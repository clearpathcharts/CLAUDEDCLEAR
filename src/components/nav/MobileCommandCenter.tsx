import React, { useState } from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Cpu,
  Crown,
  GraduationCap,
  Home,
  LogOut,
  Network,
  Newspaper,
  Terminal,
  Users,
  X,
} from "lucide-react";

/* ============================================================
   CLEARPATH TRADER — MOBILE COMMAND CENTER
   Drop-in replacement for the mobile view of ClearNav.tsx.
   Top bar: HOME · CHARTS · Y.W.C. (opens this drawer)
   Uses the exact same nav ids as ClearNav so onNavigate()
   keeps working with zero changes to your routing.
   ============================================================ */

interface MobileCommandCenterProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isAdmin: boolean;
  onLogout?: () => void;
  /** Lean APK / installed PWA — CHARTS | RIVER | MENU */
  lean?: boolean;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
  colorClass: string; // exact match to ClearNav's per-item color
  glowClass: string; // exact match to ClearNav's active glow
}

// ---- Section definitions, using the SAME ids/icons/colors as ClearNav.tsx ----
const WORK_ITEMS: NavItem[] = [
  {
    id: "Yours",
    icon: Users,
    label: "Y.W.C. HUB",
    colorClass: "text-[#FF6A00] border-[#FF6A00]/25 hover:bg-[#FF6A00]/10",
    glowClass: "bg-[#FF6A00]/25 text-[#FF6A00] border-[#FF6A00] shadow-[0_0_18px_rgba(255,106,0,.8)]",
  },
  {
    id: "News",
    icon: Newspaper,
    label: "NEWS",
    colorClass: "text-[#FF6A00] border-[#FF6A00]/25 hover:bg-[#FF6A00]/10",
    glowClass: "bg-[#FF6A00]/25 text-[#FF6A00] border-[#FF6A00] shadow-[0_0_18px_rgba(255,106,0,.8)]",
  },
];

const LEARN_ITEMS: NavItem[] = [
  {
    id: "ClearPathEducation",
    icon: BookOpen,
    label: "CLEARPATH EDUCATION",
    colorClass: "text-[#00E5FF] border-[#00E5FF]/30 hover:bg-[#00E5FF]/10",
    glowClass: "bg-[#00E5FF]/25 text-[#00E5FF] border-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,.8)]",
  },
  {
    id: "LiteracyOS",
    icon: BookOpen,
    label: "LITERACY OS",
    colorClass: "text-[#00E5FF] border-[#00E5FF]/30 hover:bg-[#00E5FF]/10",
    glowClass: "bg-[#00E5FF]/25 text-[#00E5FF] border-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,.8)]",
  },
  {
    id: "Encyclopedia",
    icon: GraduationCap,
    label: "ENCYCLOPEDIA OF FINANCE",
    colorClass: "text-[#00E5FF] border-[#00E5FF]/30 hover:bg-[#00E5FF]/10",
    glowClass: "bg-[#00E5FF]/25 text-[#00E5FF] border-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,.8)]",
  },
  // Encyclopedia of Indicators — hidden while videos are broken (component kept).
];

const TOOLS_ITEMS: NavItem[] = [
  {
    id: "TheRiver",
    icon: Cpu,
    label: "THE RIVER",
    colorClass: "text-[#FF6A00] border-[#FF6A00]/25 hover:bg-[#FF6A00]/10",
    glowClass: "bg-[#FF6A00]/25 text-[#FF6A00] border-[#FF6A00] shadow-[0_0_18px_rgba(255,106,0,.8)]",
  },
  {
    id: "CpmsApk",
    icon: Cpu,
    label: "CLEARPATH CINEMA",
    colorClass: "text-[#00E5FF] border-[#00E5FF]/30 hover:bg-[#00E5FF]/10",
    glowClass: "bg-[#00E5FF]/25 text-[#00E5FF] border-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,.8)]",
  },
];

// Diagnostics only shows if isAdmin — handled at render time, not in this static array
const DIAGNOSTICS_ITEM: NavItem = {
  id: "Diagnostics",
  icon: Activity,
  label: "DIAGNOSTICS",
  colorClass: "text-[#FF1493] border-[#FF1493]/30 hover:bg-[#FF1493]/10",
  glowClass: "bg-[#FF1493]/25 text-[#FF1493] border-[#FF1493] shadow-[0_0_18px_rgba(255,20,147,.8)]",
};

const ACCOUNT_ITEMS: NavItem[] = [
  {
    id: "Biography",
    icon: Terminal,
    label: "PROFILE",
    colorClass: "text-[#FF1493] border-[#FF1493]/30 hover:bg-[#FF1493]/10",
    glowClass: "bg-[#FF1493]/25 text-[#FF1493] border-[#FF1493] shadow-[0_0_18px_rgba(255,20,147,.8)]",
  },
  {
    id: "AffiliateNetwork",
    icon: Network,
    label: "AFFILIATE",
    colorClass: "text-[#FF6A00] border-[#FF6A00]/25 hover:bg-[#FF6A00]/10",
    glowClass: "bg-[#FF6A00]/25 text-[#FF6A00] border-[#FF6A00] shadow-[0_0_18px_rgba(255,106,0,.8)]",
  },
  {
    id: "Membership",
    icon: Crown,
    label: "MEMBERSHIPS",
    colorClass: "text-[#FFD700] border-[#FFD700]/35 hover:bg-[#FFD700]/10",
    glowClass: "bg-[#FFD700]/25 text-[#FFD700] border-[#FFD700] shadow-[0_0_18px_rgba(255,215,0,.8)]",
  },
  {
    id: "Founders",
    icon: Crown,
    label: "FOUNDERS",
    colorClass: "text-[#FFD700] border-[#FFD700]/35 hover:bg-[#FFD700]/10",
    glowClass: "bg-[#FFD700]/25 text-[#FFD700] border-[#FFD700] shadow-[0_0_18px_rgba(255,215,0,.8)]",
  },
];

const SECTION_HEADER_COLORS: Record<string, string> = {
  WORK: "#FF6A00",
  LEARN: "#00E5FF",
  TOOLS: "#4D00FF",
  TRADE: "#00E5FF",
  ACCOUNT: "#FFD700",
};

export const MobileCommandCenter: React.FC<MobileCommandCenterProps> = ({
  activeTab,
  onNavigate,
  isAdmin,
  onLogout,
  lean = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemTap = (id: string) => {
    setIsOpen(false);
    onNavigate(id);
  };

  const toolsItems = isAdmin ? [...TOOLS_ITEMS, DIAGNOSTICS_ITEM] : TOOLS_ITEMS;

  const sections: { title: string; items: NavItem[] }[] = lean
    ? [
        { title: "TRADE", items: toolsItems.filter((i) => i.id === "TheRiver") },
        {
          title: "ACCOUNT",
          items: ACCOUNT_ITEMS.filter((i) =>
            ["Biography", "Membership"].includes(i.id),
          ),
        },
      ]
    : [
        { title: "WORK", items: WORK_ITEMS },
        { title: "LEARN", items: LEARN_ITEMS },
        { title: "TOOLS", items: toolsItems },
        { title: "ACCOUNT", items: ACCOUNT_ITEMS },
      ];

  return (
    <div id="mobile-nav" className="w-full">
      {/* ================= TOP BAR ================= */}
      <div
        className="
          sticky top-0 z-[100] w-full
          border-b border-white/5
          bg-black/95 backdrop-blur-3xl
          flex items-center justify-around
          px-3 py-3
        "
      >
        <button
          type="button"
          onClick={() => handleItemTap("StrictlyCharts")}
          className={`
            flex items-center gap-2 rounded-full px-3 py-2
            text-[10px] font-black tracking-wider transition-all duration-200 active:scale-95
            ${
              activeTab === "StrictlyCharts"
                ? "bg-[#FF6A00]/25 text-[#FF6A00] border border-[#FF6A00] shadow-[0_0_18px_rgba(255,106,0,.8)]"
                : "text-[#FF6A00] border border-[#FF6A00]/25 hover:bg-[#FF6A00]/10"
            }
          `}
          style={{ fontFamily: "'Cinzel', serif" }}
        >
          <BarChart3 className="w-4 h-4" />
          <span>CHARTS</span>
        </button>

        {lean ? (
          <button
            type="button"
            onClick={() => handleItemTap("TheRiver")}
            className={`
              flex items-center gap-2 rounded-full px-3 py-2
              text-[10px] font-black tracking-wider transition-all duration-200 active:scale-95
              ${
                activeTab === "TheRiver"
                  ? "bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,.8)]"
                  : "text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/10"
              }
            `}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Cpu className="w-4 h-4" />
            <span>RIVER</span>
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => handleItemTap("Discovery")}
              className={`
                flex items-center gap-2 rounded-full px-3 py-2
                text-[10px] font-black tracking-wider transition-all duration-200 active:scale-95
                ${
                  activeTab === "Discovery"
                    ? "bg-[#4D00FF]/25 text-[#4D00FF] border border-[#4D00FF] shadow-[0_0_18px_rgba(77,0,255,.8)]"
                    : "text-[#4D00FF] border border-[#4D00FF]/25 hover:bg-[#4D00FF]/10"
                }
              `}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Home className="w-4 h-4" />
              <span>HOME</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOpen((prev) => !prev)}
              className={`
                flex items-center gap-2 rounded-full px-3 py-2
                text-[10px] font-black tracking-wider transition-all duration-200 active:scale-95
                ${
                  isOpen
                    ? "bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,.8)]"
                    : "text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/10"
                }
              `}
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              <Users className="w-4 h-4" />
              <span>Y.W.C.</span>
            </button>
          </>
        )}

        {lean && (
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className={`
              flex items-center gap-2 rounded-full px-3 py-2
              text-[10px] font-black tracking-wider transition-all duration-200 active:scale-95
              ${
                isOpen
                  ? "bg-[#FF1493]/25 text-[#FF1493] border border-[#FF1493] shadow-[0_0_18px_rgba(255,20,147,.8)]"
                  : "text-[#FF1493] border border-[#FF1493]/30 hover:bg-[#FF1493]/10"
              }
            `}
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            <Terminal className="w-4 h-4" />
            <span>MENU</span>
          </button>
        )}
      </div>

      {/* ================= DRAWER ================= */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-[90] bg-black/75 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <div
            className="
              fixed top-0 left-0 right-0 z-[100]
              max-h-[90vh] overflow-y-auto
              bg-black/95 backdrop-blur-3xl
              border-b border-[#00E5FF]/20
              px-4 pt-5 pb-3
            "
          >
            <div className="relative text-center mb-4 pb-3 border-b border-white/10">
              <span
                className="block text-white text-base font-black tracking-[0.2em]"
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                YOUR WORLD CONNECTED
              </span>
              <span className="block text-[#AAAAAA] text-xs mt-1 px-2 leading-snug">
                Social, video, magazines — and a movable chart on the same screen. No more waiting on every app.
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsOpen(false)}
                className="absolute -top-1 right-0 text-[#AAAAAA] p-2"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {sections.map((section) => (
              <div key={section.title} className="mb-6">
                <div
                  className="text-xs font-black tracking-[0.3em] pb-1.5 mb-2 border-b"
                  style={{
                    color: SECTION_HEADER_COLORS[section.title],
                    borderColor: SECTION_HEADER_COLORS[section.title],
                    textShadow: `0 0 8px ${SECTION_HEADER_COLORS[section.title]}`,
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  {section.title}
                </div>

                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleItemTap(item.id)}
                      className={`
                        flex items-center w-full min-h-[52px] rounded-xl border
                        px-4 mb-2 transition-all duration-200 active:scale-[0.98]
                        ${isActive ? item.glowClass : `bg-white/[0.03] ${item.colorClass}`}
                      `}
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      <Icon className="w-4 h-4 mr-3 shrink-0" />
                      <span className="flex-1 text-left text-xs font-black tracking-wider">
                        {item.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}

            {onLogout && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="
                  flex items-center w-full min-h-[52px] rounded-xl border
                  border-red-500/30 text-red-500 px-4 mb-2
                  hover:bg-red-500 hover:text-white
                  transition-all duration-200 active:scale-[0.98]
                "
                style={{ fontFamily: "'Cinzel', serif" }}
              >
                <LogOut className="w-4 h-4 mr-3 shrink-0" />
                <span className="flex-1 text-left text-xs font-black tracking-wider">
                  EXIT
                </span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
