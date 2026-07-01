import React, { useState, useEffect, useRef } from "react";
import { X, Send } from "lucide-react";

/* ============================================================
   C.P.T. - PERSONAL BUDDY
   A small, friendly, always-visible floating mentor icon.
   Click it to open a chat window connected to /api/mentor/chat.
   Remembers the user's name and skill level in this browser
   (localStorage) so it doesn't ask again on return visits.
   ============================================================ */

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const STORAGE_KEY_NAME = "cpt_buddy_username";
const STORAGE_KEY_SKILL = "cpt_buddy_skill_level";

export const CptBuddyWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [skillLevel, setSkillLevel] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<"name" | "skill" | "done">("done");
  const scrollRef = useRef<HTMLDivElement>(null);

  // On first load, check if we already know this user
  useEffect(() => {
    const savedName = localStorage.getItem(STORAGE_KEY_NAME);
    const savedSkill = localStorage.getItem(STORAGE_KEY_SKILL);
    if (savedName && savedSkill) {
      setUserName(savedName);
      setSkillLevel(savedSkill);
      setSetupStep("done");
    } else {
      setSetupStep("name");
    }
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0 && setupStep === "done") {
      setMessages([
        {
          role: "assistant",
          content: `Hey ${userName}! I'm C.P.T., your personal trading buddy. Ask me anything about Four Up Three Down, an indicator, or anything else on ClearPath. I'm always here.`,
        },
      ]);
    }
  };

  // Lets other components (like the home page quick-nav tile) open this widget
  // without needing to lift isOpen state up into App.tsx.
  useEffect(() => {
    const listener = () => handleOpen();
    window.addEventListener("open-cpt-buddy", listener);
    return () => window.removeEventListener("open-cpt-buddy", listener);
  }, [userName, setupStep, messages]);

  const handleNameSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setUserName(trimmed);
    localStorage.setItem(STORAGE_KEY_NAME, trimmed);
    setInput("");
    setSetupStep("skill");
  };

  const handleSkillSelect = (level: string) => {
    setSkillLevel(level);
    localStorage.setItem(STORAGE_KEY_SKILL, level);
    setSetupStep("done");
    setMessages([
      {
        role: "assistant",
        content: `Great to meet you, ${userName}! I'll explain things at a ${level} level. Ask me anything, any time - I'm always here.`,
      },
    ]);
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
          conversationHistory: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.answer || "I didn't catch that - try asking again." },
      ]);
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
            width: 320,
            maxHeight: 480,
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
              <div style={{ color: "#AAAAAA", fontSize: 10 }}>Always here.</div>
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
            {setupStep === "name" && (
              <div style={{ color: "#FFFFFF", fontSize: 13, lineHeight: 1.5 }}>
                Hi! I'm C.P.T., your personal trading buddy. What's your name?
              </div>
            )}

            {setupStep === "skill" && (
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

            {setupStep === "done" &&
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
