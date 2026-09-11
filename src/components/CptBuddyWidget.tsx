import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Send, RotateCcw, List } from "lucide-react";
import { useChartVision } from "../hooks/useChartVision";
import { useAuth } from "../contexts/FirebaseContext";
import { getDb, doc, getDoc, setDoc, deleteDoc } from "../firebase";
import type { BuddyBondProfile } from "../lib/buddyBond";
import {
  MAX_CONVERSATION_BULLETS,
  fallbackConversationBullet,
  mergeMemoryLines,
  normalizeConversationBullets,
} from "../lib/buddyMemory";
import "./CptBuddyWidget.css";

/* ============================================================
   C.P.T. - PERSONAL BUDDY (grows with you)

   HOW MEMORY WORKS NOW:
   1. Name, skill, facts, conversation bullets, chat, and a platonic "bond profile"
      (mood, neuro self-disclosures, emotional themes, pace)
      save to Firestore: users/{uid}/buddy_memory/profile
   2. On open, C.P.T. greets by name and gently checks in on
      their day — then listens and continues a real conversation.
   3. Each turn: affect classify → companion reply → growth extract.
   4. Signed-out fallback: localStorage on this device only.
   5. Reset wipes everything so they can start clean.
   6. Hard rule: platonic only — never sexual / romantic.
   ============================================================ */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  toolsUsed?: string[];
}

const STORAGE_KEY_NAME = "cpt_buddy_username";
const STORAGE_KEY_SKILL = "cpt_buddy_skill_level";
const STORAGE_KEY_FACTS = "cpt_buddy_facts";
const STORAGE_KEY_MSGS = "cpt_buddy_messages";
const STORAGE_KEY_BOND = "cpt_buddy_bond";
const STORAGE_KEY_BULLETS = "cpt_buddy_conversation_bullets";
const MAX_SAVED_MESSAGES = 120;
const MAX_FACTS = 80;
const MAX_NAME_LENGTH = 40;
const MAX_NAME_WORDS = 4;

const SUGGESTED_PROMPTS = [
  "I'm having a rough day",
  "What's live gold doing?",
  "How do I get around the site?",
  "Explain neuro chart profiles",
] as const;

const DAY_CHECKIN_CHIPS = [
  "Good day so far",
  "Okay / mixed",
  "Rough day",
  "Overwhelmed",
  "Just want to learn",
] as const;

function emptyBond(): BuddyBondProfile {
  return { conversationDepth: 0, likesDayCheckIn: true, preferredPace: "warm" };
}

function mergeBondLocal(prev: BuddyBondProfile, patch: Partial<BuddyBondProfile> | undefined): BuddyBondProfile {
  if (!patch) {
    return {
      ...prev,
      conversationDepth: (prev.conversationDepth || 0) + 1,
    };
  }
  const uniq = (a?: string[], b?: string[], max = 16) => {
    const out: string[] = [];
    for (const x of [...(a || []), ...(b || [])]) {
      const t = String(x || "").trim();
      if (!t) continue;
      if (!out.some((y) => y.toLowerCase() === t.toLowerCase())) out.push(t);
    }
    return out.slice(-max);
  };
  return {
    ...prev,
    ...patch,
    knownNeuro: uniq(prev.knownNeuro, patch.knownNeuro, 12),
    emotionalThemes: uniq(prev.emotionalThemes, patch.emotionalThemes, 16),
    growthNotes: uniq(prev.growthNotes, patch.growthNotes, 20),
    conversationDepth:
      typeof patch.conversationDepth === "number"
        ? patch.conversationDepth
        : (prev.conversationDepth || 0) + 1,
    lastMood: patch.lastMood || prev.lastMood,
    preferredPace: patch.preferredPace || prev.preferredPace,
    likesDayCheckIn:
      typeof patch.likesDayCheckIn === "boolean" ? patch.likesDayCheckIn : prev.likesDayCheckIn,
  };
}

function buildReturnGreeting(name: string | null, bond: BuddyBondProfile, factCount: number): string {
  const who = name || "friend";
  const depth = bond.conversationDepth || 0;
  const askDay = bond.likesDayCheckIn !== false;
  const moodBit =
    bond.lastMood && bond.lastMood.primary !== "unknown"
      ? ` Last time you seemed ${bond.lastMood.primary.replace(/_/g, " ")} — no pressure if that's shifted.`
      : "";
  const neuroBit =
    bond.knownNeuro && bond.knownNeuro.length
      ? ` I'll keep honoring what you've shared about ${bond.knownNeuro.slice(0, 2).join(" / ")}.`
      : "";
  if (depth < 3 && factCount === 0) {
    return `Hey ${who} — I'm C.P.T., your personal ClearPath buddy. I'm here to talk, listen, and help you learn at your pace.${askDay ? " How's your day going so far?" : " What would you like to talk about?"}`;
  }
  return `Welcome back, ${who}. I'm really glad you're here.${moodBit}${neuroBit}${
    askDay
      ? " How's your day — good, rough, or somewhere in between?"
      : " Want to pick up where we left off, or start fresh on something new?"
  }`;
}

/** Keep names short so a full chat message cannot be stored as a name. */
function sanitizeBuddyName(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed) return null;
  if (trimmed.length > MAX_NAME_LENGTH) return null;
  if (trimmed.includes("?")) return null;
  if (trimmed.split(" ").length > MAX_NAME_WORDS) return null;
  return trimmed;
}

function clearLocalBuddyMemory() {
  try {
    localStorage.removeItem(STORAGE_KEY_NAME);
    localStorage.removeItem(STORAGE_KEY_SKILL);
    localStorage.removeItem(STORAGE_KEY_FACTS);
    localStorage.removeItem(STORAGE_KEY_MSGS);
    localStorage.removeItem(STORAGE_KEY_BOND);
    localStorage.removeItem(STORAGE_KEY_BULLETS);
  } catch {}
}

/** Heavy panel — only mounted while open so chart-vision subscriptions stay off the main thread. */
const CptBuddyOpenPanel: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { user } = useAuth() as any;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [facts, setFacts] = useState<string[]>([]);
  const [conversationBullets, setConversationBullets] = useState<string[]>([]);
  const [bond, setBond] = useState<BuddyBondProfile>(emptyBond);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [memoryLoaded, setMemoryLoaded] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<"name" | "skill" | "done">("done");
  const [nameError, setNameError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [shortViewport, setShortViewport] = useState(false);
  const [narrowViewport, setNarrowViewport] = useState(false);
  const [kbInset, setKbInset] = useState(0);
  const [vvHeight, setVvHeight] = useState(0);
  const [showDayChips, setShowDayChips] = useState(false);
  const [showMemory, setShowMemory] = useState(false);
  const { scans: patternScans, mentorContext } = useChartVision(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const greetingQueued = useRef(false);

  /* ---------- LOAD MEMORY (Firestore first, localStorage fallback) ---------- */
  useEffect(() => {
    let cancelled = false;

    const applyLoadedMemory = (
      rawName: string | null | undefined,
      rawSkill: string | null | undefined,
      rawFacts: unknown,
      rawMsgs: unknown,
      rawBond?: unknown,
      rawBullets?: unknown,
    ) => {
      const cleanedName = typeof rawName === "string" ? sanitizeBuddyName(rawName) : null;
      const skill = typeof rawSkill === "string" && rawSkill.trim() ? rawSkill.trim() : null;
      const nextFacts = Array.isArray(rawFacts) ? rawFacts.filter((f): f is string => typeof f === "string") : [];
      const nextMsgs =
        cleanedName && Array.isArray(rawMsgs)
          ? (rawMsgs as ChatMessage[]).filter(
              (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
            )
          : [];
      let nextBullets = normalizeConversationBullets(rawBullets);
      if (nextBullets.length === 0 && nextMsgs.length) {
        nextBullets = mergeMemoryLines(
          [],
          nextMsgs
            .filter((m) => m.role === "user")
            .map((m) => fallbackConversationBullet(m.content))
            .filter((b): b is string => !!b),
          MAX_CONVERSATION_BULLETS
        );
      }
      const nextBond =
        rawBond && typeof rawBond === "object" ? { ...emptyBond(), ...(rawBond as BuddyBondProfile) } : emptyBond();
      if (cancelled) return;
      setUserName(cleanedName);
      setSkillLevel(skill);
      setFacts(nextFacts);
      setConversationBullets(nextBullets);
      setBond(nextBond);
      setMessages(nextMsgs);
      setSetupStep(cleanedName && skill ? "done" : "name");
      setMemoryLoaded(true);

      if (nextBullets.length && normalizeConversationBullets(rawBullets).length === 0) {
        try {
          localStorage.setItem(STORAGE_KEY_BULLETS, JSON.stringify(nextBullets));
        } catch {}
      }

      if (rawName && !cleanedName) {
        try {
          localStorage.removeItem(STORAGE_KEY_NAME);
          localStorage.removeItem(STORAGE_KEY_MSGS);
          if (skill) localStorage.setItem(STORAGE_KEY_SKILL, skill);
          localStorage.setItem(STORAGE_KEY_FACTS, JSON.stringify(nextFacts.slice(-MAX_FACTS)));
          localStorage.setItem(STORAGE_KEY_BULLETS, JSON.stringify(nextBullets.slice(-MAX_CONVERSATION_BULLETS)));
          localStorage.setItem(STORAGE_KEY_BOND, JSON.stringify(nextBond));
        } catch {}
        if (user?.uid) {
          void setDoc(
            doc(getDb(), "users", user.uid, "buddy_memory", "profile"),
            {
              userName: null,
              skillLevel: skill,
              facts: nextFacts.slice(-MAX_FACTS),
              conversationBullets: nextBullets.slice(-MAX_CONVERSATION_BULLETS),
              messages: [],
              bond: nextBond,
              updatedAt: Date.now(),
            },
            { merge: true }
          ).catch((e) => console.error("[C.P.T.] Failed to clear invalid name from Firestore:", e));
        }
      }
    };

    const loadLocal = () => {
      const savedName = localStorage.getItem(STORAGE_KEY_NAME);
      const savedSkill = localStorage.getItem(STORAGE_KEY_SKILL);
      let savedFacts: string[] = [];
      let savedMsgs: ChatMessage[] = [];
      let savedBond: BuddyBondProfile = emptyBond();
      let savedBullets: string[] = [];
      try { savedFacts = JSON.parse(localStorage.getItem(STORAGE_KEY_FACTS) || "[]"); } catch {}
      try { savedMsgs = JSON.parse(localStorage.getItem(STORAGE_KEY_MSGS) || "[]"); } catch {}
      try { savedBond = { ...emptyBond(), ...JSON.parse(localStorage.getItem(STORAGE_KEY_BOND) || "{}") }; } catch {}
      try { savedBullets = JSON.parse(localStorage.getItem(STORAGE_KEY_BULLETS) || "[]"); } catch {}
      applyLoadedMemory(savedName, savedSkill, savedFacts, savedMsgs, savedBond, savedBullets);
    };

    const loadMemory = async () => {
      if (user?.uid) {
        try {
          const snap: any = await getDoc(doc(getDb(), "users", user.uid, "buddy_memory", "profile"));
          if (!cancelled && snap && typeof snap.exists === "function" && snap.exists()) {
            const d = snap.data() || {};
            applyLoadedMemory(d.userName, d.skillLevel, d.facts, d.messages, d.bond, d.conversationBullets);
            return;
          }
        } catch (e) {
          console.error("[C.P.T.] Failed to load memory from Firestore:", e);
        }
      }
      loadLocal();
    };

    setMemoryLoaded(false);
    loadMemory();
    return () => { cancelled = true; };
  }, [user?.uid]);

  /* ---------- SAVE MEMORY (both places, every time) ---------- */
  const saveMemory = async (next: {
    userName: string | null;
    skillLevel: string | null;
    facts: string[];
    conversationBullets: string[];
    messages: ChatMessage[];
    bond: BuddyBondProfile;
  }) => {
    const trimmedMsgs = next.messages.slice(-MAX_SAVED_MESSAGES);
    const trimmedFacts = next.facts.slice(-MAX_FACTS);
    const trimmedBullets = normalizeConversationBullets(next.conversationBullets);
    const nextBond = next.bond || emptyBond();

    try {
      if (next.userName) localStorage.setItem(STORAGE_KEY_NAME, next.userName);
      if (next.skillLevel) localStorage.setItem(STORAGE_KEY_SKILL, next.skillLevel);
      localStorage.setItem(STORAGE_KEY_FACTS, JSON.stringify(trimmedFacts));
      localStorage.setItem(STORAGE_KEY_BULLETS, JSON.stringify(trimmedBullets));
      localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(trimmedMsgs));
      localStorage.setItem(STORAGE_KEY_BOND, JSON.stringify(nextBond));
    } catch {}

    if (user?.uid) {
      try {
        await setDoc(
          doc(getDb(), "users", user.uid, "buddy_memory", "profile"),
          {
            userName: next.userName || null,
            skillLevel: next.skillLevel || null,
            facts: trimmedFacts,
            conversationBullets: trimmedBullets,
            messages: trimmedMsgs,
            bond: nextBond,
            updatedAt: Date.now(),
          },
          { merge: true }
        );
      } catch (e) {
        console.error("[C.P.T.] Failed to save memory to Firestore:", e);
      }
    }
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (greetingQueued.current || !memoryLoaded || setupStep !== "done" || messages.length > 0) return;
    greetingQueued.current = true;
    const greeting: ChatMessage = {
      role: "assistant",
      content: buildReturnGreeting(userName, bond, facts.length),
    };
    setMessages([greeting]);
    setShowDayChips(bond.likesDayCheckIn !== false);
  }, [memoryLoaded, setupStep, messages.length, userName, bond, facts.length]);

  useEffect(() => {
    const shortMq = window.matchMedia("(max-height: 520px)");
    const narrowMq = window.matchMedia("(max-width: 767px)");
    const apply = () => {
      setShortViewport(shortMq.matches);
      setNarrowViewport(narrowMq.matches);
    };
    apply();
    shortMq.addEventListener("change", apply);
    narrowMq.addEventListener("change", apply);
    return () => {
      shortMq.removeEventListener("change", apply);
      narrowMq.removeEventListener("change", apply);
    };
  }, []);

  /* iOS Safari + Android Chrome: lift the sheet with the visual viewport / keyboard */
  useEffect(() => {
    const apply = () => {
      const vv = window.visualViewport;
      if (!vv) {
        setKbInset(0);
        setVvHeight(window.innerHeight);
        return;
      }
      setVvHeight(Math.round(vv.height));
      setKbInset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    };
    apply();
    window.visualViewport?.addEventListener("resize", apply);
    window.visualViewport?.addEventListener("scroll", apply);
    window.addEventListener("orientationchange", apply);
    return () => {
      window.visualViewport?.removeEventListener("resize", apply);
      window.visualViewport?.removeEventListener("scroll", apply);
      window.removeEventListener("orientationchange", apply);
    };
  }, []);

  useEffect(() => {
    if (!narrowViewport) return;
    const html = document.documentElement;
    const prevBody = document.body.style.overflow;
    const prevHtml = html.style.overflow;
    document.body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      html.style.overflow = prevHtml;
    };
  }, [narrowViewport]);

  const handleNameSubmit = () => {
    const cleaned = sanitizeBuddyName(input);
    if (!cleaned) {
      setNameError("Please enter a short first name (up to 4 words).");
      return;
    }
    setNameError(null);
    setUserName(cleaned);
    setInput("");

    // If skill was already saved (e.g. after clearing a bad name), skip re-asking
    if (skillLevel) {
      setSetupStep("done");
      const intro: ChatMessage = {
        role: "assistant",
        content: `Great to meet you, ${cleaned}. I'll keep things at a ${skillLevel} level — and more importantly, I'll grow with you over time: how your days feel, what helps your brain, what you care about. I'm a platonic buddy, never anything romantic or sexual. How's your day going so far?`,
      };
      setMessages([intro]);
      setShowDayChips(true);
      void saveMemory({ userName: cleaned, skillLevel, facts, conversationBullets, messages: [intro], bond });
      return;
    }

    setSetupStep("skill");
  };

  const handleSkillSelect = (level: string) => {
    setSkillLevel(level);
    setSetupStep("done");
    const intro: ChatMessage = {
      role: "assistant",
      content: `Great to meet you, ${userName}. I'll keep things at a ${level} level — and more importantly, I'll grow with you over time: how your days feel, what helps your brain, what you care about. I'm a platonic buddy, never anything romantic or sexual. How's your day going so far?`,
    };
    setMessages([intro]);
    setShowDayChips(true);
    void saveMemory({ userName, skillLevel: level, facts, conversationBullets, messages: [intro], bond });
  };

  /** Wipe name, facts, and chat so a bad memory (or mistaken name) can be fixed. */
  const handleResetBuddy = async () => {
    if (isResetting) return;
    const ok = window.confirm(
      "Reset C.P.T.? This clears your name, chat history, and everything C.P.T. remembers about you. You can introduce yourself again afterward."
    );
    if (!ok) return;

    setIsResetting(true);
    setIsLoading(false);
    setInput("");
    setNameError(null);
    setUserName(null);
    setSkillLevel(null);
    setFacts([]);
    setConversationBullets([]);
    setBond(emptyBond());
    setMessages([]);
    setShowDayChips(false);
    setShowMemory(false);
    setSetupStep("name");
    clearLocalBuddyMemory();

    if (user?.uid) {
      try {
        await deleteDoc(doc(getDb(), "users", user.uid, "buddy_memory", "profile"));
      } catch (e) {
        console.error("[C.P.T.] Failed to delete memory from Firestore:", e);
        try {
          await setDoc(
            doc(getDb(), "users", user.uid, "buddy_memory", "profile"),
            {
              userName: null,
              skillLevel: null,
              facts: [],
              conversationBullets: [],
              messages: [],
              bond: emptyBond(),
              updatedAt: Date.now(),
            },
            { merge: false }
          );
        } catch (e2) {
          console.error("[C.P.T.] Failed to overwrite memory in Firestore:", e2);
        }
      }
    }

    setIsResetting(false);
  };

  const handleSend = async (presetQuestion?: string) => {
    const question = (presetQuestion ?? input).trim();
    if (!question || isLoading) return;

    setShowDayChips(false);
    const newMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          question,
          userName,
          skillLevel,
          memoryFacts: facts,
          conversationBullets,
          bondProfile: bond,
          chartContext: mentorContext,
          pagePath: typeof window !== "undefined" ? window.location.pathname : "/",
          conversationHistory: newMessages.slice(-30).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const answer: string = data.answer || "I want to stay with you on this — try saying that again?";
      const toolsUsed = Array.isArray(data.toolsUsed)
        ? data.toolsUsed.filter((t: unknown): t is string => typeof t === "string")
        : [];
      const updatedMessages: ChatMessage[] = [
        ...newMessages,
        { role: "assistant", content: answer, toolsUsed: toolsUsed.length ? toolsUsed : undefined },
      ];

      let updatedFacts = facts;
      if (Array.isArray(data.newFacts) && data.newFacts.length > 0) {
        const merged = [...facts];
        for (const f of data.newFacts) {
          if (typeof f === "string" && f.trim() && !merged.some((x) => x.toLowerCase() === f.toLowerCase())) {
            merged.push(f.trim());
          }
        }
        updatedFacts = merged.slice(-MAX_FACTS);
        setFacts(updatedFacts);
      }

      const fromApi = normalizeConversationBullets(data.conversationBullets, 4);
      const localBullet = fromApi.length ? [] : [fallbackConversationBullet(question)].filter((b): b is string => !!b);
      const updatedBullets = mergeMemoryLines(conversationBullets, [...fromApi, ...localBullet], MAX_CONVERSATION_BULLETS);
      setConversationBullets(updatedBullets);

      const updatedBond = mergeBondLocal(bond, data.bondPatch || undefined);
      setBond(updatedBond);
      setMessages(updatedMessages);
      void saveMemory({
        userName,
        skillLevel,
        facts: updatedFacts,
        conversationBullets: updatedBullets,
        messages: updatedMessages,
        bond: updatedBond,
      });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "I'm having trouble connecting right now, but I'm still on your side. Try again in a moment.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (setupStep === "name") handleNameSubmit();
      else if (setupStep === "done") handleSend();
    }
  };

  const phoneSheet = narrowViewport && !shortViewport;
  const visibleH = vvHeight > 0 ? vvHeight : 640;
  const panelMaxHeight = shortViewport
    ? "min(260px, calc(100dvh - 24px))"
    : narrowViewport
      ? `min(${Math.max(220, visibleH - 12)}px, 100dvh)`
      : "min(480px, calc(100dvh - 40px))";

  return (
        <div
          className="cpt-buddy-panel"
          data-phone-sheet={phoneSheet ? "1" : "0"}
          role="dialog"
          aria-modal="true"
          aria-label="C.P.T. Personal Buddy"
          style={{
            width: narrowViewport ? "100%" : "min(320px, calc(100vw - 24px))",
            maxWidth: "100%",
            height: phoneSheet ? `min(92dvh, ${Math.max(240, visibleH - 12)}px)` : undefined,
            maxHeight: panelMaxHeight,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "8px 8px 8px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src="/cpt-buddy-icon.png"
              alt=""
              draggable={false}
              style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#FF1493", fontWeight: 800, fontSize: 13, fontFamily: "'Cinzel', serif" }}>
                C.P.T. - PERSONAL BUDDY
              </div>
              <div style={{ color: "#AAAAAA", fontSize: 10 }}>
                {user?.uid && setupStep === "done"
                  ? "Platonic buddy · grows with you"
                  : "Platonic buddy · always here"}
              </div>
            </div>
            <button
              type="button"
              className="cpt-buddy-icon-btn"
              onClick={() => setShowMemory((v) => !v)}
              aria-label="Conversation memory"
              aria-pressed={showMemory}
              title="Conversation memory"
            >
              <List size={18} />
            </button>
            <button
              type="button"
              className="cpt-buddy-icon-btn"
              onClick={() => { void handleResetBuddy(); }}
              disabled={isResetting || !memoryLoaded}
              aria-label="Reset C.P.T. memory"
              title="Reset chat & memory"
            >
              <RotateCcw size={18} />
            </button>
            <button
              type="button"
              className="cpt-buddy-icon-btn"
              onClick={onClose}
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>

          {showMemory && (
            <div className="cpt-buddy-memory" aria-label="What C.P.T. remembers">
              <div className="cpt-buddy-memory__title">Memory</div>
              {conversationBullets.length === 0 && facts.length === 0 ? (
                <p className="cpt-buddy-memory__empty">Nothing saved yet. Talk with C.P.T. and conversation bullets land here.</p>
              ) : (
                <>
                  {conversationBullets.length > 0 && (
                    <>
                      <div className="cpt-buddy-memory__kicker">Conversation</div>
                      <ul className="cpt-buddy-memory__list">
                        {conversationBullets.slice(-MAX_CONVERSATION_BULLETS).reverse().map((bullet) => (
                          <li key={bullet}>{bullet}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  {facts.length > 0 && (
                    <>
                      <div className="cpt-buddy-memory__kicker">Lasting facts</div>
                      <ul className="cpt-buddy-memory__list">
                        {facts.slice(-24).reverse().map((fact) => (
                          <li key={fact}>{fact}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </>
              )}
            </div>
          )}

          {/* Body */}
          <div
            ref={scrollRef}
            className="cpt-buddy-log"
            style={{
              minHeight: shortViewport ? 72 : narrowViewport ? 120 : 200,
            }}
          >
            {!memoryLoaded && (
              <div style={{ color: "#AAAAAA", fontSize: 12, fontStyle: "italic" }}>Waking up...</div>
            )}

            {memoryLoaded && setupStep === "name" && (
              <div style={{ color: "#FFFFFF", fontSize: 13, lineHeight: 1.5 }}>
                Hi! I'm C.P.T., your personal trading buddy. What's your name?
                {nameError && (
                  <div style={{ color: "#FF6B9D", fontSize: 11, marginTop: 8 }}>{nameError}</div>
                )}
              </div>
            )}

            {memoryLoaded && setupStep === "skill" && (
              <div style={{ color: "#FFFFFF", fontSize: 13, lineHeight: 1.5 }}>
                <div style={{ marginBottom: 10 }}>
                  Nice to meet you, {userName}! How would you describe your trading experience?
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {["beginner", "intermediate", "advanced"].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      className="cpt-buddy-skill"
                      onClick={() => handleSkillSelect(lvl)}
                      style={{
                        padding: "10px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,20,147,0.3)",
                        background: "rgba(255,20,147,0.08)",
                        color: "#FF1493",
                        fontSize: 16,
                        fontWeight: 700,
                        textTransform: "capitalize",
                      }}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {memoryLoaded && setupStep === "done" && patternScans.some((s) => s.scan.patterns.length > 0) && (
              <div
                style={{
                  marginBottom: 10,
                  padding: "8px 10px",
                  borderRadius: 8,
                  border: "1px solid rgba(191,0,255,0.35)",
                  background: "rgba(191,0,255,0.08)",
                  fontSize: 10,
                  lineHeight: 1.45,
                  color: "#E9D5FF",
                }}
              >
                <div style={{ color: "#FF1493", fontWeight: 800, marginBottom: 4, fontSize: 9, letterSpacing: 1 }}>
                  LIVE CHART VISION · {patternScans.filter((s) => s.scan.patterns.length > 0).length} CHART{patternScans.filter((s) => s.scan.patterns.length > 0).length === 1 ? "" : "S"}
                </div>
                {patternScans.filter((s) => s.scan.patterns.length > 0).slice(0, 4).map((entry) => (
                  <div key={`${entry.symbol}-${entry.timeframe}`} style={{ marginBottom: 6 }}>
                    <div style={{ color: "#BF00FF", fontWeight: 700, fontSize: 9, marginBottom: 2 }}>
                      {entry.symbol} · {entry.timeframe}
                    </div>
                    {entry.scan.patterns.slice(0, 2).map((p) => (
                      <div key={`${p.id}-${p.endIndex}`} style={{ color: "#fff" }}>
                        {p.label} ({Math.round(p.confidence * 100)}% measured)
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {memoryLoaded && setupStep === "done" &&
              messages.map((m, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 10,
                    textAlign: m.role === "user" ? "right" : "left",
                  }}
                >
                  <div
                    style={{
                      display: "inline-block",
                      maxWidth: "85%",
                      padding: "8px 12px",
                      borderRadius: 10,
                      fontSize: 13,
                      lineHeight: 1.5,
                      background: m.role === "user" ? "rgba(77,0,255,0.2)" : "rgba(255,20,147,0.1)",
                      color: m.role === "user" ? "#B9A6FF" : "#FFFFFF",
                      border: m.role === "user" ? "1px solid rgba(77,0,255,0.3)" : "1px solid rgba(255,20,147,0.2)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {m.content}
                  </div>
                  {m.role === "assistant" && m.toolsUsed && m.toolsUsed.length > 0 && (
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 10,
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                        color: "#7dd3c7",
                      }}
                    >
                      Live look-up · {m.toolsUsed.join(" · ")}
                    </div>
                  )}
                </div>
              ))}

            {isLoading && (
              <div style={{ color: "#AAAAAA", fontSize: 12, fontStyle: "italic" }}>C.P.T. is thinking...</div>
            )}
          </div>

          {/* Day check-in chips on open / first greeting */}
          {memoryLoaded && setupStep === "done" && !isLoading && showDayChips && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: "8px 10px 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {DAY_CHECKIN_CHIPS.map((chip) => (
                <button
                  key={`day-${chip}`}
                  type="button"
                  className="cpt-buddy-chip"
                  onClick={() => {
                    void handleSend(chip);
                  }}
                  style={{
                    fontSize: 14,
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(255,20,147,0.4)",
                    background: "rgba(255,20,147,0.1)",
                    color: "#FF9AD5",
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Quick asks stay available alongside free-form typing */}
          {memoryLoaded && setupStep === "done" && !isLoading && !showDayChips && (
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                padding: "8px 10px 0",
                borderTop: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={`ask-${prompt}`}
                  type="button"
                  className="cpt-buddy-chip"
                  onClick={() => { void handleSend(prompt); }}
                  style={{
                    fontSize: 14,
                    padding: "8px 12px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,229,255,0.35)",
                    background: "rgba(0,229,255,0.08)",
                    color: "#00E5FF",
                  }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          {setupStep !== "skill" && (
            <div style={{ display: "flex", gap: 6, padding: 10, borderTop: setupStep === "done" ? "none" : "1px solid rgba(255,255,255,0.08)" }}>
              <input
                type="text"
                className="cpt-buddy-input"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (nameError) setNameError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={
                  setupStep === "name"
                    ? "Type your name..."
                    : "Talk to me — your day, feelings, charts, learning..."
                }
                aria-label={
                  setupStep === "name"
                    ? "Your name"
                    : "Message C.P.T., your platonic ClearPath buddy"
                }
                maxLength={setupStep === "name" ? MAX_NAME_LENGTH : undefined}
                enterKeyHint={setupStep === "name" ? "done" : "send"}
                autoComplete={setupStep === "name" ? "given-name" : "off"}
                autoCapitalize={setupStep === "name" ? "words" : "sentences"}
                autoCorrect="on"
                spellCheck={setupStep !== "name"}
                inputMode="text"
              />
              <button
                type="button"
                className="cpt-buddy-send"
                onClick={setupStep === "name" ? handleNameSubmit : () => { void handleSend(); }}
                disabled={isLoading || isResetting}
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>
          )}
        </div>
  );
};

export const CptBuddyWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const open = () => {
      requestAnimationFrame(() => setIsOpen(true));
    };
    window.addEventListener("open-cpt-buddy", open);
    return () => window.removeEventListener("open-cpt-buddy", open);
  }, []);

  const handleOpen = () => {
    requestAnimationFrame(() => setIsOpen(true));
  };

  const handleClose = () => {
    setIsOpen(false);
  };

  return createPortal(
    <div
      className="cpt-buddy-root"
      data-cpt-buddy={isOpen ? "open" : "fab"}
      style={{
        position: "fixed",
        bottom: "max(12px, env(safe-area-inset-bottom, 0px))",
        right: "max(12px, env(safe-area-inset-right, 0px))",
        left: isOpen ? "max(12px, env(safe-area-inset-left, 0px))" : "auto",
        zIndex: 280,
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
    >
      {!isOpen ? (
        <button
          type="button"
          className="cpt-buddy-fab"
          onClick={handleOpen}
          aria-label="Open C.P.T. Personal Buddy"
        >
          <img
            src="/cpt-buddy-icon.png"
            alt="C.P.T. Personal Buddy"
            draggable={false}
            decoding="async"
          />
        </button>
      ) : (
        <CptBuddyOpenPanel onClose={handleClose} />
      )}
    </div>,
    document.body
  );
};
