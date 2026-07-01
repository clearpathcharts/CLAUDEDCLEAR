import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/* ============================================================
   CLEARPATH TRADER — MOBILE COMMAND CENTER
   Replaces the cramped two-row mobile nav with a 3-button
   top bar (HOME · CHARTS · Y.W.C.) that opens a full-screen
   "command center" drawer for everything else.

   Design intent: calm, not casino. Slow motion, no strobing,
   no flashing — matches ClearPath's "calm for trading" brand.
   ============================================================ */

// ---------- Brand colors (official ClearPath Color System) ----------
const COLORS = {
  bg: '#030307',        // Obsidian Black
  white: '#FFFFFF',      // Pure White
  secondary: '#AAAAAA',  // Secondary text
  pink: '#FF1493',       // Fluorescent Pink
  cyan: '#00FFFF',       // Electric Cyan
  purple: '#B026FF',     // Neon Purple
  orange: '#FF7B00',     // Molten Lava Orange
};

// NOTE: The original spec called for a "gold" section header on ACCOUNT.
// Gold is not one of the four official brand colors, so ACCOUNT below
// uses Fluorescent Pink instead. If you'd rather add an official gold
// hex to the brand system, tell me the code and I'll swap it in.

interface NavItem {
  key: string;
  icon: string;
  label: string;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  color: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    title: 'WORK',
    color: COLORS.orange,
    items: [
      { key: 'workspace', icon: '🗂', label: 'Workspace' },
      { key: 'journal', icon: '📔', label: 'Journal' },
      { key: 'news', icon: '📰', label: 'News' },
    ],
  },
  {
    title: 'LEARN',
    color: COLORS.cyan,
    items: [
      { key: 'finance-encyclopedia', icon: '📚', label: 'Financial Encyclopedia' },
      { key: 'indicator-encyclopedia', icon: '📈', label: 'Indicator Encyclopedia' },
    ],
  },
  {
    title: 'TOOLS',
    color: COLORS.purple,
    items: [
      { key: 'river', icon: '🌊', label: 'The River' },
      { key: 'api-monitor', icon: '📡', label: 'API Monitor' },
      { key: 'diagnostics', icon: '🖥', label: 'Diagnostics', adminOnly: true },
      { key: 'sentinel', icon: '🛡', label: 'Sentinel' },
    ],
  },
  {
    title: 'ACCOUNT',
    color: COLORS.pink,
    items: [
      { key: 'profile', icon: '👤', label: 'Profile' },
      { key: 'membership', icon: '💎', label: 'Membership' },
      { key: 'founders', icon: '👑', label: 'Founders' },
      { key: 'exit', icon: '🚪', label: 'Exit' },
    ],
  },
];

export interface MobileCommandCenterProps {
  /** Currently active tab key, so we can highlight it */
  activeTab: string;
  /** Called with the item's `key` whenever the user taps something */
  onNavigate: (key: string) => void;
  /** Hides Diagnostics unless true */
  isAdmin?: boolean;
}

export default function MobileCommandCenter({
  activeTab,
  onNavigate,
  isAdmin = false,
}: MobileCommandCenterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleTopBarTap = (key: string) => {
    if (key === 'ywc') {
      setIsOpen((prev) => !prev);
      return;
    }
    setIsOpen(false);
    onNavigate(key);
  };

  const handleItemTap = (key: string) => {
    setIsOpen(false);
    onNavigate(key);
  };

  return (
    <div style={styles.wrapper}>
      {/* ---------- TOP BAR ---------- */}
      <div style={styles.topBar}>
        <TopBarButton
          icon="🏠"
          label="HOME"
          active={activeTab === 'home'}
          onTap={() => handleTopBarTap('home')}
        />
        <TopBarButton
          icon="📈"
          label="CHARTS"
          active={activeTab === 'charts'}
          onTap={() => handleTopBarTap('charts')}
        />
        <TopBarButton
          icon="🌎"
          label="Y.W.C."
          active={isOpen}
          onTap={() => handleTopBarTap('ywc')}
        />
      </div>

      {/* ---------- COMMAND CENTER DRAWER ---------- */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              style={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setIsOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              style={styles.drawer}
              initial={{ y: '-100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '-100%', opacity: 0 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
            >
              <div style={styles.drawerHeader}>
                <span style={styles.drawerTitle}>YOUR WORLD CONNECTED</span>
                <span style={styles.drawerSubtitle}>
                  Everything you need. One place.
                </span>
                <button
                  aria-label="Close menu"
                  onClick={() => setIsOpen(false)}
                  style={styles.closeButton}
                >
                  ✕
                </button>
              </div>

              <div style={styles.sectionsScroll}>
                {SECTIONS.map((section) => {
                  const visibleItems = section.items.filter(
                    (item) => !item.adminOnly || isAdmin
                  );
                  if (visibleItems.length === 0) return null;

                  return (
                    <div key={section.title} style={{ marginBottom: 24 }}>
                      <div
                        style={{
                          ...styles.sectionHeader,
                          color: section.color,
                          borderColor: section.color,
                          textShadow: `0 0 8px ${section.color}`,
                        }}
                      >
                        {section.title}
                      </div>

                      {visibleItems.map((item) => (
                        <button
                          key={item.key}
                          onClick={() => handleItemTap(item.key)}
                          style={{
                            ...styles.navRow,
                            borderColor:
                              activeTab === item.key
                                ? section.color
                                : 'rgba(255,255,255,0.08)',
                          }}
                        >
                          <span style={styles.navRowIcon}>{item.icon}</span>
                          <span style={styles.navRowLabel}>{item.label}</span>
                          <span style={{ color: section.color }}>›</span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------- Small top-bar button subcomponent ----------
function TopBarButton({
  icon,
  label,
  active,
  onTap,
}: {
  icon: string;
  label: string;
  active: boolean;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      style={{
        ...styles.topBarButton,
        color: active ? COLORS.cyan : COLORS.white,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={styles.topBarLabel}>{label}</span>
    </button>
  );
}

// ---------- Inline styles (no Tailwind / CSS framework required) ----------
const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    position: 'relative',
    width: '100%',
    fontFamily: 'inherit',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 56,
    background: COLORS.bg,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  topBarButton: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'transparent',
    border: 'none',
    gap: 2,
    padding: '4px 12px',
    cursor: 'pointer',
  },
  topBarLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: 0.5,
  },
  backdrop: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(3,3,7,0.75)',
    backdropFilter: 'blur(6px)',
    zIndex: 40,
  },
  drawer: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    maxHeight: '90vh',
    background: 'rgba(3,3,7,0.96)',
    backdropFilter: 'blur(20px)',
    borderBottom: `1px solid ${COLORS.cyan}33`,
    boxShadow: `0 10px 40px rgba(0,255,255,0.08)`,
    zIndex: 50,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 16px 12px',
  },
  drawerHeader: {
    position: 'relative',
    textAlign: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottom: '1px solid rgba(255,255,255,0.08)',
  },
  drawerTitle: {
    display: 'block',
    color: COLORS.white,
    fontSize: 16,
    fontWeight: 800,
    letterSpacing: 2,
  },
  drawerSubtitle: {
    display: 'block',
    color: COLORS.secondary,
    fontSize: 12,
    marginTop: 4,
  },
  closeButton: {
    position: 'absolute',
    top: -4,
    right: 0,
    background: 'transparent',
    border: 'none',
    color: COLORS.secondary,
    fontSize: 18,
    cursor: 'pointer',
    padding: 8,
  },
  sectionsScroll: {
    overflowY: 'auto',
    paddingBottom: 8,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: 800,
    letterSpacing: 3,
    borderBottom: '1px solid',
    paddingBottom: 6,
    marginBottom: 8,
  },
  navRow: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    minHeight: 52,
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10,
    padding: '0 14px',
    marginBottom: 8,
    cursor: 'pointer',
  },
  navRowIcon: {
    fontSize: 18,
    marginRight: 12,
    width: 22,
    textAlign: 'center',
  },
  navRowLabel: {
    flex: 1,
    textAlign: 'left',
    color: COLORS.white,
    fontSize: 14,
    fontWeight: 600,
  },
};
