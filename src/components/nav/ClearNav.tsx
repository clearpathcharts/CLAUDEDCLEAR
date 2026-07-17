import React from "react";
import {
  Activity,
  BarChart3,
  BookOpen,
  Cpu,
  Crown,
  GraduationCap,
  Home,
  LogOut,
  Newspaper,
  Shield,
  Terminal,
  Users,
} from "lucide-react";
import { MobileCommandCenter } from "./MobileCommandCenter";

interface ClearNavProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  isAdmin: boolean;
  onLogout?: () => void;
}

interface NavItem {
  id: string;
  icon: React.ElementType;
  label: string;
}

export const ClearNav: React.FC<ClearNavProps> = ({
  activeTab,
  onNavigate,
  isAdmin,
  onLogout,
}) => {
  const primaryNavItems: NavItem[] = [
    {
      id: "Discovery",
      icon: Home,
      label: "HOME",
    },
    {
      id: "Yours",
      icon: Users,
      label: "Y.W.C.",
    },
    {
      id: "TheRiver",
      icon: Cpu,
      label: "THE RIVER",
    },
    {
      id: "StrictlyCharts",
      icon: BarChart3,
      label: "CHARTS",
    },
    {
      id: "News",
      icon: Newspaper,
      label: "NEWS",
    },
    {
      id: "Membership",
      icon: Crown,
      label: "MEMBERSHIPS",
    },
    {
      id: "Founders",
      icon: Crown,
      label: "FOUNDERS",
    },
  ];

  const secondaryNavItems: NavItem[] = [
    {
      id: "Biography",
      icon: Terminal,
      label: "PROFILE",
    },

    ...(isAdmin
      ? [
          {
            id: "Diagnostics",
            icon: Activity,
            label: "DIAGNOSTICS",
          },
        ]
      : []),

    {
      id: "CpmsApk",
      icon: Cpu,
      label: "CLEARPATH CINEMA",
    },

    {
      id: "Sentinel",
      icon: Shield,
      label: "SENTINEL",
    },

    {
      id: "ClearPathEducation",
      icon: BookOpen,
      label: "CLEARPATH EDUCATION",
    },

    {
      id: "Encyclopedia",
      icon: GraduationCap,
      label: "ENCYCLOPEDIA OF FINANCE",
    },

    {
      id: "EncyclopediaOfIndicators",
      icon: BarChart3,
      label: "ENCYCLOPEDIA OF INDICATORS",
    },
  ];
  const renderNavButton = (
    item: NavItem,
    index: number,
    isSecondaryGroup: boolean
  ) => {
    const Icon = item.icon;

    const isActive = activeTab === item.id;

    const isGold =
      item.id === "Membership" ||
      item.id === "Founders";

    const isPink =
      item.id === "Biography" ||
      item.id === "Diagnostics";

    const isCyan =
      item.id === "CpmsApk" ||
      item.id === "Sentinel" ||
      item.id === "Encyclopedia" ||
      item.id === "EncyclopediaOfIndicators" ||
      item.id === "ClearPathEducation";

    const isOrange =
      isSecondaryGroup || index % 2 === 1;

    let classes =
      "text-[#4D00FF] border border-[#4D00FF]/25 hover:bg-[#4D00FF]/10";

    if (isOrange)
      classes =
        "text-[#FF6A00] border border-[#FF6A00]/25 hover:bg-[#FF6A00]/10";

    if (isPink)
      classes =
        "text-[#FF1493] border border-[#FF1493]/30 hover:bg-[#FF1493]/10";

    if (isCyan)
      classes =
        "text-[#00E5FF] border border-[#00E5FF]/30 hover:bg-[#00E5FF]/10";

    if (isGold)
      classes =
        "text-[#FFD700] border border-[#FFD700]/35 hover:bg-[#FFD700]/10";

    if (isActive) {
      if (isGold)
        classes =
          "bg-[#FFD700]/25 text-[#FFD700] border border-[#FFD700] shadow-[0_0_18px_rgba(255,215,0,.8)]";
      else if (isPink)
        classes =
          "bg-[#FF1493]/25 text-[#FF1493] border border-[#FF1493] shadow-[0_0_18px_rgba(255,20,147,.8)]";
      else if (isCyan)
        classes =
          "bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF] shadow-[0_0_18px_rgba(0,229,255,.8)]";
      else if (isOrange)
        classes =
          "bg-[#FF6A00]/25 text-[#FF6A00] border border-[#FF6A00] shadow-[0_0_18px_rgba(255,106,0,.8)]";
      else
        classes =
          "bg-[#4D00FF]/25 text-[#4D00FF] border border-[#4D00FF] shadow-[0_0_18px_rgba(77,0,255,.8)]";
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => onNavigate(item.id)}
        className={`
          shrink-0
          snap-start
          flex
          items-center
          gap-2
          rounded-full

          px-3
          py-2

          md:px-4
          md:py-2

          whitespace-nowrap

          text-[10px]
          md:text-xs

          font-black
          tracking-wider

          transition-all
          duration-200

          active:scale-95

          ${classes}
        `}
        style={{
          fontFamily: "'Cinzel', serif",
          transform: "translateZ(0)",
        }}
      >
        <Icon
          className="
            w-3
            h-3
            md:w-4
            md:h-4
            shrink-0
          "
        />

        <span>{item.label}</span>
      </button>
    );
  };
  return (
    <>
      {/* ================= MOBILE NAV (Command Center) ================= */}
      <div className="md:hidden">
        <MobileCommandCenter
          activeTab={activeTab}
          onNavigate={onNavigate}
          isAdmin={isAdmin}
          onLogout={onLogout}
        />
      </div>

      {/* ================= DESKTOP NAV (original) ================= */}
      <div
        id="nav-bar"
        className="
        hidden
        md:block

        sticky
        top-0
        z-[100]
        w-full

        border-b
        border-white/5

        bg-black/95
        backdrop-blur-3xl

        px-3
        py-3

        space-y-3
      "
      >
        {/* ================= PRIMARY NAVIGATION ================= */}

        <div className="w-full overflow-x-auto overflow-y-hidden no-scrollbar touch-pan-x">
          <div
            className="
            flex
            flex-nowrap
            w-max

            items-center

            gap-2
            md:gap-4

            snap-x
            snap-mandatory

            px-1
            py-1
          "
          >
            {primaryNavItems.map((item, index) =>
              renderNavButton(item, index, false)
            )}
          </div>
        </div>

        {/* ================= SECONDARY NAVIGATION ================= */}

        <div
          className="
          w-full

          rounded-xl

          border
          border-white/5

          bg-zinc-950/60

          overflow-x-auto
          overflow-y-hidden

          no-scrollbar

          touch-pan-x
        "
        >
          <div
            className="
            flex
            flex-nowrap
            w-max

            items-center

            gap-2

            px-2
            py-2

            snap-x
            snap-mandatory
          "
          >
            {secondaryNavItems.map((item, index) =>
              renderNavButton(item, index, true)
            )}

            {onLogout && (
              <button
                type="button"
                onClick={onLogout}
                className="
                shrink-0
                snap-start

                flex
                items-center
                gap-2

                rounded-full

                px-3
                py-2

                whitespace-nowrap

                text-[10px]
                md:text-xs

                font-black

                text-red-500

                border
                border-red-500/30

                hover:bg-red-500
                hover:text-white

                transition-all
                duration-200

                active:scale-95
              "
                style={{
                  fontFamily: "'Cinzel', serif",
                }}
              >
                <LogOut className="w-3 h-3 md:w-4 md:h-4" />
                <span>EXIT</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
