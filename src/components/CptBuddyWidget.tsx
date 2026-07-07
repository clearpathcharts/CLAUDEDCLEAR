import React, { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";
import { getAllFormingBriefs, subscribeFormingBrief, formatAllFormingBriefsForChat } from "../patterns";
import type { FormingStructureBrief } from "../patterns";
import { useAuth } from "../contexts/FirebaseContext";
import { getDb, doc, getDoc, setDoc } from "../firebase";

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
  const [formingBriefs, setFormingBriefs] = useState<FormingStructureBrief[]>(getAllFormingBriefs());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => subscribeFormingBrief(() => setFormingBriefs(getAllFormingBriefs())), []);

  /* ---------- LOAD MEMORY (Firestore first, localStorage fallback) ---------- */
  useEffect(() => {
    let cancelled = false;

    const loadLocal = () => {
      const savedName = localStorage.getItem(STORAGE_KEY_NAME);
      const savedSkill = localStorage.getItem(STORAGE_KEY_SKILL);
      let savedFacts: string[] = [];
      let savedMsgs: ChatMessage[] = [];
      try { savedFacts = JSON.parse(localStorage.getItem(STORAGE_KEY_FACTS) || "[]"); } catch {}
      try { savedMsgs = JSON.parse(localStorage.getItem(STORAGE_KEY_MSGS) || "[]"); } catch {}
      if (cancelled) return;
      setUserName(savedName);
      setSkillLevel(savedSkill);
      setFacts(Array.isArray(savedFacts) ? savedFacts : []);
      setMessages(Array.isArray(savedMsgs) ? savedMsgs : []);
      setSetupStep(savedName && savedSkill ? "done" : "name");
      setMemoryLoaded(true);
    };

    const loadMemory = async () => {
      if (user?.uid) {
        try {
          const snap: any = await getDoc(doc(getDb(), "users", user.uid, "buddy_memory", "profile"));
          if (!cancelled && snap && typeof snap.exists === "function" && snap.exists()) {
            const d = snap.data() || {};
            setUserName(d.userName || null);
            setSkillLevel(d.skillLevel || null);
            setFacts(Array.isArray(d.facts) ? d.facts : []);
            setMessages(Array.isArray(d.messages) ? d.messages : []);
            setSetupStep(d.userName && d.skillLevel ? "done" : "name");
            setMemoryLoaded(true);
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
            ? `Welcome back, ${userName}! Good to see you again. Ask me anything - about Four Up Three Down, an indicator, or whatever's on your mind. I remember our past conversations.`
            : `Hey ${userName}! I'm C.P.T., your personal trading buddy. Ask me anything about Four Up Three Down, an indicator, or anything else on ClearPath. I'm always here.`,
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

  const handleNameSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    setInput("");
    setSetupStep("skill");
  };

  const handleSkillSelect = (level: string) => {
    setSkillLevel(level);
    setSetupStep("done");
    const intro: ChatMessage = {
      role: "assistant",
      content: `Great to meet you, ${userName}! I'll explain things at a ${level} level. Ask me anything, any time - I'm always here, and I'll remember you from now on.`,
    };
    setMessages([intro]);
    saveMemory({ userName, skillLevel: level, facts, messages: [intro] });
  };

  const handleSend = async () => {
    const question = input.trim();
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
          chartContext: formatAllFormingBriefsForChat(formingBriefs),
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

  return (
    <div style={{ position: "fixed", bottom: 20, right: 20, zIndex: 200 }}>
      {/* Floating avatar button */}
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Open C.P.T. Personal Buddy"
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "2px solid #FF1493",
            boxShadow: "0 0 20px rgba(255,20,147,0.6)",
            overflow: "hidden",
            cursor: "pointer",
            background: "#030307",
            padding: 0,
          }}
        >
          <img
            src="/cpt-buddy-icon.png"
            alt="C.P.T. Personal Buddy"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div
          style={{
            width: "min(320px, calc(100vw - 24px))",
            maxHeight: "min(480px, calc(100dvh - 40px))",
            display: "flex",
            flexDirection: "column",
            background: "rgba(3,3,7,0.97)",
            border: "1px solid rgba(255,20,147,0.4)",
            borderRadius: 16,
            boxShadow: "0 0 30px rgba(255,20,147,0.3)",
            overflow: "hidden",
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
            <div style={{ flex: 1 }}>
              <div style={{ color: "#FF1493", fontWeight: 800, fontSize: 13, fontFamily: "'Cinzel', serif" }}>
                C.P.T. - PERSONAL BUDDY
              </div>
              <div style={{ color: "#AAAAAA", fontSize: 10 }}>
                {user?.uid ? "Always here. Remembers you." : "Always here."}
              </div>
            </div>
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
          <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 12, minHeight: 200 }}>
            {!memoryLoaded && (
              <div style={{ color: "#AAAAAA", fontSize: 12, fontStyle: "italic" }}>Waking up...</div>
            )}

            {memoryLoaded && setupStep === "name" && (
              <div style={{ color: "#FFFFFF", fontSize: 13, lineHeight: 1.5 }}>
                Hi! I'm C.P.T., your personal trading buddy. What's your name?
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

            {memoryLoaded && setupStep === "done" && formingBriefs.some((b) => b.possibilities.length > 0) && (
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
                  FORMING WATCH · {formingBriefs.length} CHART{formingBriefs.length === 1 ? "" : "S"}
                </div>
                {formingBriefs.filter((b) => b.possibilities.length > 0).slice(0, 4).map((brief) => (
                  <div key={`${brief.symbol}-${brief.timeframe}`} style={{ marginBottom: 6 }}>
                    <div style={{ color: "#BF00FF", fontWeight: 700, fontSize: 9, marginBottom: 2 }}>
                      {brief.symbol} · {brief.timeframe}
                    </div>
                    {brief.clock.active && (
                      <div style={{ marginBottom: 2, color: "#FF00CC" }}>
                        {brief.clock.type === "16-bar-retrace" ? "16" : "12"}-bar clock: {brief.clock.bar}/{brief.clock.total}
                      </div>
                    )}
                    {brief.possibilities.slice(0, 2).map((p) => (
                      <div key={p.id} style={{ color: "#fff" }}>
                        {p.status.toUpperCase()} {p.label} (~{Math.round(p.probability * 100)}%)
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

          {/* Input */}
          {setupStep !== "skill" && (
            <div style={{ display: "flex", gap: 6, padding: 10, borderTop: "1px solid rgba(255,255,255,0.08)" }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={setupStep === "name" ? "Type your name..." : "Ask C.P.T. anything..."}
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
                onClick={setupStep === "name" ? handleNameSubmit : handleSend}
                disabled={isLoading}
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
    </div>
  );
};
