import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Send, RotateCcw } from "lucide-react";
import { useChartVision } from "../hooks/useChartVision";
import { useAuth } from "../contexts/FirebaseContext";
import { getDb, doc, getDoc, setDoc, deleteDoc } from "../firebase";

/* ============================================================
   C.P.T. - PERSONAL BUDDY (with permanent memory)

   HOW MEMORY WORKS NOW:
   1. Everything C.P.T. knows about a user (name, skill level,
      personal facts, and the conversation itself) is saved to
      Firestore at:  users/{uid}/buddy_memory/profile
   2. Every time the user opens the buddy - on any device -
      that memory is loaded first, so C.P.T. greets them by
      name and picks up where they left off.
   3. After every exchange, the server extracts any NEW lasting
      facts the user revealed and sends them back. They are
      merged into the memory and saved. C.P.T. literally gets
      smarter about each person over time.
   4. If the user is not signed in, memory falls back to this
      browser's localStorage (works, but only on this device).
   5. Users can Reset anytime (header button) to wipe name,
      chat, and remembered facts — then re-introduce themselves.
   ============================================================ */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY_NAME = "cpt_buddy_username";
const STORAGE_KEY_SKILL = "cpt_buddy_skill_level";
const STORAGE_KEY_FACTS = "cpt_buddy_facts";
const STORAGE_KEY_MSGS = "cpt_buddy_messages";
const MAX_SAVED_MESSAGES = 100; // how much conversation history we keep in the database
const MAX_FACTS = 60;           // how many remembered facts we keep per user
const MAX_NAME_LENGTH = 40;
const MAX_NAME_WORDS = 4;

const SUGGESTED_PROMPTS = [
  "How do I get around the site?",
  "Explain neuro chart profiles",
  "How do I use INDACREATOR?",
  "Where is ClearPath Education?",
] as const;

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
  } catch {}
}

export const CptBuddyWidget: React.FC = () => {
  const { user } = useAuth() as any;
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [facts, setFacts] = useState<string[]>([]);
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
  const { scans: patternScans, mentorContext } = useChartVision();
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ---------- LOAD MEMORY (Firestore first, localStorage fallback) ---------- */
  useEffect(() => {
    let cancelled = false;

    const applyLoadedMemory = (
      rawName: string | null | undefined,
      rawSkill: string | null | undefined,
      rawFacts: unknown,
      rawMsgs: unknown,
    ) => {
      const cleanedName = typeof rawName === "string" ? sanitizeBuddyName(rawName) : null;
      const skill = typeof rawSkill === "string" && rawSkill.trim() ? rawSkill.trim() : null;
      const nextFacts = Array.isArray(rawFacts) ? rawFacts.filter((f): f is string => typeof f === "string") : [];
      // Drop conversation if the stored name was invalid (e.g. a whole paragraph saved as a name)
      const nextMsgs =
        cleanedName && Array.isArray(rawMsgs)
          ? (rawMsgs as ChatMessage[]).filter(
              (m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string"
            )
          : [];
      if (cancelled) return;
      setUserName(cleanedName);
      setSkillLevel(skill);
      setFacts(nextFacts);
      setMessages(nextMsgs);
      setSetupStep(cleanedName && skill ? "done" : "name");
      setMemoryLoaded(true);

      // Persist the cleanup so the bad name does not keep coming back
      if (rawName && !cleanedName) {
        try {
          localStorage.removeItem(STORAGE_KEY_NAME);
          localStorage.removeItem(STORAGE_KEY_MSGS);
          if (skill) localStorage.setItem(STORAGE_KEY_SKILL, skill);
          localStorage.setItem(STORAGE_KEY_FACTS, JSON.stringify(nextFacts.slice(-MAX_FACTS)));
        } catch {}
        if (user?.uid) {
          void setDoc(
            doc(getDb(), "users", user.uid, "buddy_memory", "profile"),
            {
              userName: null,
              skillLevel: skill,
              facts: nextFacts.slice(-MAX_FACTS),
              messages: [],
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
      try { savedFacts = JSON.parse(localStorage.getItem(STORAGE_KEY_FACTS) || "[]"); } catch {}
      try { savedMsgs = JSON.parse(localStorage.getItem(STORAGE_KEY_MSGS) || "[]"); } catch {}
      applyLoadedMemory(savedName, savedSkill, savedFacts, savedMsgs);
    };

    const loadMemory = async () => {
      if (user?.uid) {
        try {
          const snap: any = await getDoc(doc(getDb(), "users", user.uid, "buddy_memory", "profile"));
          if (!cancelled && snap && typeof snap.exists === "function" && snap.exists()) {
            const d = snap.data() || {};
            applyLoadedMemory(d.userName, d.skillLevel, d.facts, d.messages);
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
    messages: ChatMessage[];
  }) => {
    const trimmedMsgs = next.messages.slice(-MAX_SAVED_MESSAGES);
    const trimmedFacts = next.facts.slice(-MAX_FACTS);

    // Always keep a local copy so signed-out users still get memory on this device
    try {
      if (next.userName) localStorage.setItem(STORAGE_KEY_NAME, next.userName);
      if (next.skillLevel) localStorage.setItem(STORAGE_KEY_SKILL, next.skillLevel);
      localStorage.setItem(STORAGE_KEY_FACTS, JSON.stringify(trimmedFacts));
      localStorage.setItem(STORAGE_KEY_MSGS, JSON.stringify(trimmedMsgs));
    } catch {}

    // The real memory: the user's own document in Firestore
    if (user?.uid) {
      try {
        await setDoc(
          doc(getDb(), "users", user.uid, "buddy_memory", "profile"),
          {
            userName: next.userName || null,
            skillLevel: next.skillLevel || null,
            facts: trimmedFacts,
            messages: trimmedMsgs,
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
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0 && setupStep === "done" && memoryLoaded) {
      const greeting: ChatMessage = {
        role: "assistant",
        content:
          facts.length > 0
            ? `Welcome back, ${userName}! Good to see you again. Ask me about Four Up Three Down, navigating the site, neuro chart profiles, INDACREATOR, Education, or the Encyclopedias — I remember our past conversations.`
            : `Hey ${userName}! I'm C.P.T., your personal trading buddy. I can teach Four Up Three Down, help you navigate ClearPath (Charts, INDACREATOR, Education, Encyclopedias), and explain the neurodivergent chart profiles. Ask me anything.`,
      };
      setMessages([greeting]);
    }
  };

  // Lets other components (like the home page quick-nav tile) open this widget
  useEffect(() => {
    const listener = () => handleOpen();
    window.addEventListener("open-cpt-buddy", listener);
    return () => window.removeEventListener("open-cpt-buddy", listener);
  }, [userName, setupStep, messages, memoryLoaded, facts]);

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
        content: `Great to meet you, ${cleaned}! I'll explain things at a ${skillLevel} level. Ask me about trading, how to get around the site, neuro chart profiles, INDACREATOR, Education, or the Encyclopedias — I'm always here, and I'll remember you from now on.`,
      };
      setMessages([intro]);
      void saveMemory({ userName: cleaned, skillLevel, facts, messages: [intro] });
      return;
    }

    setSetupStep("skill");
  };

  const handleSkillSelect = (level: string) => {
    setSkillLevel(level);
    setSetupStep("done");
    const intro: ChatMessage = {
      role: "assistant",
      content: `Great to meet you, ${userName}! I'll explain things at a ${level} level. Ask me about trading, how to get around the site, neuro chart profiles, INDACREATOR, Education, or the Encyclopedias — I'm always here, and I'll remember you from now on.`,
    };
    setMessages([intro]);
    saveMemory({ userName, skillLevel: level, facts, messages: [intro] });
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
    setMessages([]);
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
              messages: [],
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

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: question }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/mentor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          userName,
          skillLevel,
          memoryFacts: facts,
          chartContext: mentorContext,
          conversationHistory: newMessages.slice(-20).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      const answer: string = data.answer || "I didn't catch that - try asking again.";
      const updatedMessages: ChatMessage[] = [...newMessages, { role: "assistant", content: answer }];

      // Merge any new facts the server learned about this user (deduplicated)
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

      setMessages(updatedMessages);
      saveMemory({ userName, skillLevel, facts: updatedFacts, messages: updatedMessages });
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Try again in a moment." },
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

  // Portal to <body>: full-screen overlays elsewhere in the app (e.g. chart
  // blackout mode) also portal to <body>, and the buddy must stack above them
  // (zIndex 200 vs the overlays' z-150) instead of being trapped inside the
  // app root's stacking context.
  return createPortal(
    <div
      style={{
        position: "fixed",
        bottom: "max(12px, env(safe-area-inset-bottom))",
        right: "max(12px, env(safe-area-inset-right))",
        left: isOpen && narrowViewport ? "max(12px, env(safe-area-inset-left))" : "auto",
        zIndex: 200,
        display: "flex",
        justifyContent: "flex-end",
        pointerEvents: "none",
      }}
    >
      {/* Floating avatar button */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Open C.P.T. Personal Buddy"
          style={{
            width: narrowViewport ? 52 : 64,
            height: narrowViewport ? 52 : 64,
            borderRadius: "50%",
            border: "2px solid #FF1493",
            boxShadow: "0 0 20px rgba(255,20,147,0.6)",
            overflow: "hidden",
            cursor: "pointer",
            background: "#030307",
            padding: 0,
            pointerEvents: "auto",
          }}
        >
          <img
            src="/cpt-buddy-icon.png"
            alt="C.P.T. Personal Buddy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </button>
      )}

      {/* Chat panel — shorter on phone landscape so charts stay usable */}
      {isOpen && (
        <div
          style={{
            width: narrowViewport ? "100%" : "min(320px, calc(100vw - 24px))",
            maxWidth: "100%",
            maxHeight: shortViewport
              ? "min(260px, calc(100dvh - 24px))"
              : narrowViewport
                ? "min(55dvh, 420px)"
                : "min(480px, calc(100dvh - 40px))",
            display: "flex",
            flexDirection: "column",
            background: "rgba(3,3,7,0.97)",
            border: "1px solid rgba(255,20,147,0.4)",
            borderRadius: 16,
            boxShadow: "0 0 30px rgba(255,20,147,0.3)",
            overflow: "hidden",
            pointerEvents: "auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 14px",
              borderBottom: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <img
              src="/cpt-buddy-icon.png"
              alt=""
              style={{ width: 32, height: 32, borderRadius: "50%" }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: "#FF1493", fontWeight: 800, fontSize: 13, fontFamily: "'Cinzel', serif" }}>
                C.P.T. - PERSONAL BUDDY
              </div>
              <div style={{ color: "#AAAAAA", fontSize: 10 }}>
                {user?.uid && setupStep === "done" ? "Always here. Remembers you." : "Always here."}
              </div>
            </div>
            <button
              type="button"
              onClick={() => { void handleResetBuddy(); }}
              disabled={isResetting || !memoryLoaded}
              aria-label="Reset C.P.T. memory"
              title="Reset chat & memory"
              style={{
                background: "transparent",
                border: "none",
                color: isResetting ? "#666666" : "#AAAAAA",
                cursor: isResetting || !memoryLoaded ? "default" : "pointer",
                padding: 4,
                display: "flex",
                alignItems: "center",
              }}
            >
              <RotateCcw size={16} />
            </button>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close"
              style={{ background: "transparent", border: "none", color: "#AAAAAA", cursor: "pointer", padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflowY: "auto",
              padding: 12,
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
                      onClick={() => handleSkillSelect(lvl)}
                      style={{
                        textAlign: "left",
                        padding: "8px 12px",
                        borderRadius: 8,
                        border: "1px solid rgba(255,20,147,0.3)",
                        background: "rgba(255,20,147,0.08)",
                        color: "#FF1493",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "capitalize",
                        cursor: "pointer",
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
                </div>
              ))}

            {isLoading && (
              <div style={{ color: "#AAAAAA", fontSize: 12, fontStyle: "italic" }}>C.P.T. is thinking...</div>
            )}
          </div>

          {/* Quick asks stay available alongside free-form typing */}
          {memoryLoaded && setupStep === "done" && !isLoading && (
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
                  onClick={() => { void handleSend(prompt); }}
                  style={{
                    fontSize: 10,
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: "1px solid rgba(0,229,255,0.35)",
                    background: "rgba(0,229,255,0.08)",
                    color: "#00E5FF",
                    cursor: "pointer",
                    textAlign: "left",
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
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  if (nameError) setNameError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder={setupStep === "name" ? "Type your name..." : "Ask about charts, INDACREATOR, neuro profiles..."}
                aria-label={setupStep === "name" ? "Your name" : "Message C.P.T. about trading or site help"}
                maxLength={setupStep === "name" ? MAX_NAME_LENGTH : undefined}
                style={{
                  flex: 1,
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  color: "#FFFFFF",
                  fontSize: 13,
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={setupStep === "name" ? handleNameSubmit : () => { void handleSend(); }}
                disabled={isLoading || isResetting}
                aria-label="Send"
                style={{
                  background: "rgba(255,20,147,0.15)",
                  border: "1px solid rgba(255,20,147,0.4)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  color: "#FF1493",
                  cursor: "pointer",
                }}
              >
                <Send size={16} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>,
    document.body
  );
};
