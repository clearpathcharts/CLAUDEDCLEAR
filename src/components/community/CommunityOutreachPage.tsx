/**
 * Clear Path Community Outreach — public institutional portal.
 * Isolated from trading desks, charts, tickers, and membership upsells.
 * Visual language: neon cyan / magenta cosmic dark (founder outreach art).
 */
import React, { useEffect, useMemo, useState } from 'react';
import SEO from '../SEO';
import { BrandMark } from '../brand/BrandMark';
import PublicSiteLinks from '../PublicSiteLinks';
import {
  CALIFORNIA_COUNTY_COUNT,
  CALIFORNIA_COUNTY_DIRECTORY,
  CALIFORNIA_COUNTY_DIRECTORY_BANNER,
} from '../../content/californiaCountyDirectory';
import {
  CALIFORNIA_UNEMPLOYMENT_CONTEXT,
  COMMUNITY_OUTREACH_INTRO,
  COMMUNITY_OUTREACH_META,
  COMMUNITY_OUTREACH_NAV,
  COMMUNITY_OUTREACH_PATH,
  DIRECTORY_BANNER,
  DIRECTORY_INSTITUTIONS,
  DOCUMENT_CENTER,
  EDUCATIONAL_RESOURCES,
  FOOD_SHELF_FUTURE_INITIATIVE,
  GOVERNANCE_POLICY_NOTE,
  GOVERNANCE_SECTIONS,
  INQUIRY_CATEGORIES,
  INQUIRY_PRIVACY_NOTE,
  PARTNERSHIP_AUDIENCES,
  PROGRAM_DIVISIONS,
  SNAP_CALFRESH,
  TRANSPARENCY_STATEMENT,
  type InquiryCategory,
} from '../../content/communityOutreach';

type PubInstitution = (typeof DIRECTORY_INSTITUTIONS)[number] & {
  submittedAt?: string | null;
  approvedAt?: string | null;
  approvalSource?: string | null;
};

type PubResource = (typeof EDUCATIONAL_RESOURCES)[number];
type PubDocument = (typeof DOCUMENT_CENTER)[number];

const HERO_COMMUNITY = '/images/community-outreach/hero-community.jpg';
const HERO_FOOD_BANK = '/images/community-outreach/hero-food-bank.jpg';

const PROGRAM_ICONS: Record<string, React.ReactNode> = {
  libraries: (
    <svg viewBox="0 0 24 24" className="co-icon" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        d="M4 5.5h7.5A2.5 2.5 0 0 1 14 8v11.5H6.5A2.5 2.5 0 0 1 4 17V5.5Zm16 0h-7.5A2.5 2.5 0 0 0 10 8v11.5H17.5A2.5 2.5 0 0 0 20 17V5.5Z"
      />
    </svg>
  ),
  schools: (
    <svg viewBox="0 0 24 24" className="co-icon" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        d="M12 4 3.5 8.5 12 13l8.5-4.5L12 4Zm-6.5 8.2V16c0 1.5 2.9 3.2 6.5 3.2s6.5-1.7 6.5-3.2v-3.8"
      />
    </svg>
  ),
  adult: (
    <svg viewBox="0 0 24 24" className="co-icon" aria-hidden>
      <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M4 18V10m5 8V7m5 11v-5m5 5V5" />
      <path fill="none" stroke="currentColor" strokeWidth="1.6" d="m14 9 3-3 3 2" />
    </svg>
  ),
  'digital-inclusion': (
    <svg viewBox="0 0 24 24" className="co-icon" aria-hidden>
      <rect x="3.5" y="5" width="17" height="11.5" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path fill="none" stroke="currentColor" strokeWidth="1.6" d="M8 20h8M12 16.5V20" />
    </svg>
  ),
  'consumer-protection': (
    <svg viewBox="0 0 24 24" className="co-icon" aria-hidden>
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        d="M12 3.5 5 6.2v5.1c0 4.2 2.9 7.4 7 8.7 4.1-1.3 7-4.5 7-8.7V6.2L12 3.5Z"
      />
      <path fill="none" stroke="currentColor" strokeWidth="1.6" d="m9 12 2.1 2.1L15.5 9.7" />
    </svg>
  ),
};

const SECONDARY_PILLARS = [
  { label: 'Volunteer Opportunities', href: '#inquiry' },
  { label: 'Community Partnerships', href: '#partnerships' },
  { label: 'Free Educational Resources', href: '#resources' },
  { label: 'Schools · Libraries · City & County', href: '#directory' },
  { label: 'Workforce & Skills Development', href: '#programs' },
  { label: 'Supporting Families & Individuals', href: '#food-shelf' },
] as const;

/** Visual pillars only — must stay clearly proposed, never read as live services. */
const FOOD_HELP_LABELS = [
  'Proposed food distribution',
  'Proposed family support',
  'Proposed nutrition education',
  'Proposed community resources',
  'Proposed volunteer roles',
] as const;

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="co-section scroll-mt-28 print:break-inside-avoid">
      {eyebrow ? <p className="co-eyebrow">{eyebrow}</p> : null}
      <h2 className="co-h2">{title}</h2>
      <div className="co-section-body">{children}</div>
    </section>
  );
}

function StatusPill({ children, tone = 'amber' }: { children: React.ReactNode; tone?: 'amber' | 'cyan' | 'slate' }) {
  return <span className={`co-pill co-pill-${tone}`}>{children}</span>;
}

export default function CommunityOutreachPage() {
  const [institutions, setInstitutions] = useState<PubInstitution[]>([...DIRECTORY_INSTITUTIONS]);
  const [resources, setResources] = useState<PubResource[]>([...EDUCATIONAL_RESOURCES]);
  const [documents, setDocuments] = useState<PubDocument[]>([...DOCUMENT_CENTER]);
  const [countyFilter, setCountyFilter] = useState('');
  const [form, setForm] = useState({
    name: '',
    organization: '',
    businessEmail: '',
    category: INQUIRY_CATEGORIES[0] as InquiryCategory,
    message: '',
  });
  const [formStatus, setFormStatus] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/community-outreach/snapshot');
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || !data?.ok) return;
        if (Array.isArray(data.institutions)) setInstitutions(data.institutions);
        if (Array.isArray(data.resources)) setResources(data.resources);
        if (Array.isArray(data.documents)) setDocuments(data.documents);
      } catch {
        /* seed content remains */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCounties = useMemo(() => {
    const q = countyFilter.trim().toLowerCase();
    if (!q) return CALIFORNIA_COUNTY_DIRECTORY;
    return CALIFORNIA_COUNTY_DIRECTORY.filter(
      (c) =>
        c.county.toLowerCase().includes(q) ||
        c.cities.some((city) => city.toLowerCase().includes(q)) ||
        c.majorLibrary.name.toLowerCase().includes(q),
    );
  }, [countyFilter]);

  const submitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormStatus('sending');
    setFormError('');
    try {
      const res = await fetch('/api/community-outreach/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormStatus('err');
        setFormError(data?.error || 'Could not submit inquiry.');
        return;
      }
      setFormStatus('ok');
      setForm({
        name: '',
        organization: '',
        businessEmail: '',
        category: INQUIRY_CATEGORIES[0],
        message: '',
      });
    } catch {
      setFormStatus('err');
      setFormError('Network error. Please try again.');
    }
  };

  return (
    <div className="co-outreach min-h-[100dvh]">
      <SEO
        title={COMMUNITY_OUTREACH_META.title}
        description={COMMUNITY_OUTREACH_META.description}
        keywords={COMMUNITY_OUTREACH_META.keywords}
        canonical={COMMUNITY_OUTREACH_META.canonical}
      />

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;700;800&family=Outfit:wght@400;500;600;700&display=swap');
        .co-outreach {
          --co-bg: #050814;
          --co-bg-2: #0a1024;
          --co-panel: rgba(8, 14, 36, 0.72);
          --co-cyan: #22f0ff;
          --co-cyan-soft: #7ef6ff;
          --co-magenta: #ff3cf0;
          --co-purple: #b14cff;
          --co-warm: #ff9a3c;
          --co-text: #f4f7ff;
          --co-muted: #a9b4d4;
          --co-glow-cyan: 0 0 18px rgba(34, 240, 255, 0.45), 0 0 42px rgba(34, 240, 255, 0.18);
          --co-glow-magenta: 0 0 18px rgba(255, 60, 240, 0.4), 0 0 42px rgba(177, 76, 255, 0.2);
          --co-font-display: "Orbitron", "Segoe UI", sans-serif;
          --co-font-body: "Outfit", "Segoe UI", sans-serif;
          background:
            radial-gradient(ellipse 90% 55% at 50% -8%, rgba(120, 40, 220, 0.28), transparent 55%),
            radial-gradient(ellipse 50% 40% at 90% 20%, rgba(34, 240, 255, 0.12), transparent 50%),
            radial-gradient(ellipse 45% 35% at 8% 40%, rgba(255, 60, 240, 0.1), transparent 55%),
            linear-gradient(180deg, #070b1c 0%, var(--co-bg) 40%, #04060f 100%);
          color: var(--co-text);
          font-family: var(--co-font-body);
        }
        .co-outreach a { color: var(--co-cyan-soft); }
        .co-outreach a:hover { color: #fff; }
        .co-metallic {
          font-family: var(--co-font-display);
          letter-spacing: 0.04em;
          background: linear-gradient(180deg, #ffffff 0%, #c8d6ff 38%, #7ef6ff 72%, #e6abff 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          filter: drop-shadow(0 0 10px rgba(34, 240, 255, 0.55)) drop-shadow(0 0 22px rgba(177, 76, 255, 0.35));
        }
        .co-eyebrow {
          font-family: var(--co-font-display);
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.34em;
          color: var(--co-cyan-soft);
          margin-bottom: 0.75rem;
          text-shadow: 0 0 12px rgba(34, 240, 255, 0.45);
        }
        .co-h2 {
          font-family: var(--co-font-display);
          font-size: clamp(1.35rem, 2.4vw, 1.9rem);
          font-weight: 700;
          letter-spacing: 0.03em;
          margin-bottom: 1.35rem;
          max-width: 42rem;
          color: #fff;
          text-shadow: 0 0 18px rgba(34, 240, 255, 0.25);
        }
        .co-section {
          border-top: 1px solid rgba(126, 246, 255, 0.16);
          padding: 3.5rem 0;
        }
        .co-section-body {
          display: flex;
          flex-direction: column;
          gap: 1.15rem;
          font-size: 0.98rem;
          line-height: 1.65;
          color: var(--co-muted);
          max-width: 52rem;
        }
        .co-panel {
          background: var(--co-panel);
          border: 1px solid rgba(126, 246, 255, 0.28);
          border-radius: 14px;
          box-shadow: var(--co-glow-cyan), inset 0 0 28px rgba(34, 240, 255, 0.04);
          padding: 1.15rem 1.25rem;
        }
        .co-panel-magenta {
          border-color: rgba(255, 60, 240, 0.35);
          box-shadow: var(--co-glow-magenta), inset 0 0 28px rgba(255, 60, 240, 0.05);
        }
        .co-panel-warm {
          border-color: rgba(255, 154, 60, 0.4);
          box-shadow: 0 0 18px rgba(255, 154, 60, 0.28), inset 0 0 24px rgba(255, 154, 60, 0.05);
        }
        .co-pill {
          display: inline-flex;
          align-items: center;
          padding: 0.28rem 0.7rem;
          font-family: var(--co-font-display);
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border-radius: 999px;
          border: 1px solid;
        }
        .co-pill-amber {
          border-color: rgba(255, 154, 60, 0.55);
          background: rgba(255, 154, 60, 0.12);
          color: #ffe0b8;
          box-shadow: 0 0 12px rgba(255, 154, 60, 0.25);
        }
        .co-pill-cyan {
          border-color: rgba(34, 240, 255, 0.5);
          background: rgba(34, 240, 255, 0.1);
          color: #bffffa;
          box-shadow: 0 0 12px rgba(34, 240, 255, 0.25);
        }
        .co-pill-slate {
          border-color: rgba(169, 180, 212, 0.35);
          background: rgba(169, 180, 212, 0.08);
          color: #d5dcef;
        }
        .co-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0.85rem 1.35rem;
          font-family: var(--co-font-display);
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          border-radius: 999px;
          transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .co-btn:hover { transform: translateY(-1px); }
        .co-btn-ghost {
          color: #fff;
          border: 1px solid rgba(126, 246, 255, 0.45);
          background: rgba(6, 12, 30, 0.55);
          box-shadow: 0 0 16px rgba(34, 240, 255, 0.18);
        }
        .co-btn-magenta {
          color: #fff;
          border: 1px solid rgba(255, 60, 240, 0.55);
          background: linear-gradient(110deg, rgba(255, 60, 240, 0.25), rgba(34, 240, 255, 0.18));
          box-shadow: var(--co-glow-magenta);
        }
        .co-input, .co-outreach select, .co-outreach textarea {
          width: 100%;
          margin-top: 0.35rem;
          background: rgba(2, 6, 18, 0.9);
          border: 1px solid rgba(126, 246, 255, 0.28);
          border-radius: 10px;
          padding: 0.65rem 0.8rem;
          color: #fff;
          outline: none;
          box-shadow: inset 0 0 18px rgba(34, 240, 255, 0.05);
        }
        .co-input:focus, .co-outreach select:focus, .co-outreach textarea:focus {
          border-color: var(--co-cyan);
          box-shadow: 0 0 0 1px rgba(34, 240, 255, 0.35), var(--co-glow-cyan);
        }
        .co-table {
          width: 100%;
          text-align: left;
          font-size: 0.9rem;
          border-collapse: collapse;
        }
        .co-table th {
          padding: 0.75rem 0.7rem 0.75rem 0;
          font-family: var(--co-font-display);
          font-size: 9px;
          letter-spacing: 0.16em;
          text-transform: uppercase;
          color: var(--co-cyan-soft);
          border-bottom: 1px solid rgba(126, 246, 255, 0.28);
        }
        .co-table td {
          padding: 1rem 0.7rem 1rem 0;
          border-bottom: 1px solid rgba(126, 246, 255, 0.1);
          vertical-align: top;
        }
        .co-program-grid {
          display: grid;
          gap: 0.9rem;
          grid-template-columns: 1fr;
        }
        @media (min-width: 720px) {
          .co-program-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (min-width: 1100px) {
          .co-program-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
        .co-program-card {
          display: flex;
          flex-direction: column;
          gap: 0.7rem;
          min-height: 100%;
          padding: 1rem 0.9rem 1.1rem;
          border-radius: 16px;
          background: rgba(6, 10, 28, 0.78);
          border: 1.5px solid rgba(126, 246, 255, 0.4);
          box-shadow: var(--co-glow-cyan);
          text-decoration: none !important;
          color: inherit !important;
          transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
        }
        .co-program-card:nth-child(even) {
          border-color: rgba(255, 60, 240, 0.45);
          box-shadow: var(--co-glow-magenta);
        }
        .co-program-card:hover {
          transform: translateY(-4px) scale(1.01);
          border-color: #fff;
        }
        .co-icon-wrap {
          width: 2.6rem;
          height: 2.6rem;
          display: grid;
          place-items: center;
          border-radius: 10px;
          border: 1px solid rgba(126, 246, 255, 0.45);
          color: #fff;
          box-shadow: 0 0 14px rgba(34, 240, 255, 0.35);
        }
        .co-program-card:nth-child(even) .co-icon-wrap {
          border-color: rgba(255, 60, 240, 0.5);
          box-shadow: 0 0 14px rgba(255, 60, 240, 0.35);
        }
        .co-icon { width: 1.35rem; height: 1.35rem; }
        .co-hero {
          position: relative;
          min-height: min(96vh, 1100px);
          display: flex;
          align-items: flex-end;
          overflow: hidden;
          border-bottom: 1px solid rgba(126, 246, 255, 0.22);
        }
        .co-hero-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          object-position: center top;
          transform: scale(1.01);
          animation: co-hero-drift 22s ease-in-out infinite alternate;
        }
        @keyframes co-hero-drift {
          from { transform: scale(1.01) translate3d(0, 0, 0); }
          to { transform: scale(1.04) translate3d(0, -0.8%, 0); }
        }
        .co-hero-veil {
          position: absolute;
          inset: 0;
          background:
            linear-gradient(180deg, rgba(5, 8, 20, 0.12) 0%, rgba(5, 8, 20, 0.08) 48%, rgba(5, 8, 20, 0.72) 78%, rgba(5, 8, 20, 0.96) 100%);
          pointer-events: none;
        }
        .co-hero-content {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 72rem;
          margin: 0 auto;
          padding: 1.5rem 1.25rem 2.25rem;
        }
        @media (min-width: 768px) {
          .co-hero-content { padding: 2rem 2rem 2.75rem; }
        }
        .co-btn-primary {
          color: #031018 !important;
          background: linear-gradient(110deg, #9af6ff 0%, var(--co-cyan) 42%, #7ad0ff 100%);
          box-shadow: var(--co-glow-cyan);
          text-shadow: none;
        }
        .co-ribbon {
          display: inline-flex;
          align-items: center;
          max-width: 100%;
          padding: 0.45rem 0.9rem;
          border-radius: 999px;
          border: 1px solid rgba(177, 76, 255, 0.55);
          background: linear-gradient(90deg, rgba(177, 76, 255, 0.28), rgba(34, 240, 255, 0.12));
          font-family: var(--co-font-display);
          font-size: 9px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #f3e8ff;
          box-shadow: var(--co-glow-magenta);
        }
        .co-pillars {
          display: grid;
          gap: 0.75rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (min-width: 900px) {
          .co-pillars { grid-template-columns: repeat(6, minmax(0, 1fr)); }
        }
        .co-pillar {
          text-align: center;
          padding: 0.85rem 0.5rem;
          border-radius: 12px;
          border: 1px solid rgba(126, 246, 255, 0.22);
          background: rgba(6, 10, 28, 0.55);
          text-decoration: none !important;
          color: #e8eeff !important;
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
        }
        .co-pillar:hover {
          border-color: var(--co-cyan);
          box-shadow: var(--co-glow-cyan);
          transform: translateY(-2px);
        }
        .co-cta-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          margin-top: 1.5rem;
          padding: 0.95rem 1.25rem;
          border-radius: 999px;
          border: 1.5px solid transparent;
          background:
            linear-gradient(rgba(6, 10, 28, 0.92), rgba(6, 10, 28, 0.92)) padding-box,
            linear-gradient(110deg, var(--co-magenta), var(--co-cyan)) border-box;
          box-shadow: var(--co-glow-magenta), var(--co-glow-cyan);
          font-family: var(--co-font-display);
          font-size: clamp(0.72rem, 1.8vw, 0.95rem);
          letter-spacing: 0.08em;
          color: #fff !important;
          text-decoration: none !important;
          animation: co-cta-pulse 2.8s ease-in-out infinite;
        }
        @keyframes co-cta-pulse {
          0%, 100% { box-shadow: 0 0 16px rgba(255, 60, 240, 0.35), 0 0 22px rgba(34, 240, 255, 0.25); }
          50% { box-shadow: 0 0 28px rgba(255, 60, 240, 0.55), 0 0 36px rgba(34, 240, 255, 0.4); }
        }
        .co-food-hero {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          border: 1.5px solid rgba(255, 60, 240, 0.4);
          box-shadow: var(--co-glow-magenta);
          min-height: 220px;
        }
        .co-food-hero img {
          width: 100%;
          height: 100%;
          min-height: 240px;
          max-height: 420px;
          object-fit: cover;
          object-position: center top;
          display: block;
        }
        .co-food-hero-caption {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 1rem 1.1rem;
          background: linear-gradient(180deg, transparent, rgba(5, 8, 20, 0.92));
          font-family: var(--co-font-display);
          font-size: 11px;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: #fff;
          text-shadow: 0 0 12px rgba(34, 240, 255, 0.5);
        }
        .co-help-row {
          display: grid;
          gap: 0.7rem;
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
        @media (min-width: 900px) {
          .co-help-row { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
        .co-help-chip {
          text-align: center;
          padding: 0.85rem 0.55rem;
          border-radius: 14px;
          border: 1.5px solid rgba(34, 240, 255, 0.35);
          background: rgba(6, 10, 28, 0.7);
          box-shadow: 0 0 14px rgba(34, 240, 255, 0.18);
          font-size: 0.72rem;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: #eaf6ff;
        }
        .co-help-chip:nth-child(even) {
          border-color: rgba(255, 60, 240, 0.4);
          box-shadow: 0 0 14px rgba(255, 60, 240, 0.18);
        }
        @media (prefers-reduced-motion: reduce) {
          .co-hero-media, .co-cta-bar, .co-program-card, .co-btn, .co-pillar { animation: none !important; transition: none !important; }
        }
        @media print {
          .co-outreach { background: #fff !important; color: #111 !important; }
          .co-outreach a { color: #0b3d91 !important; text-decoration: underline; }
          .co-no-print { display: none !important; }
          .co-outreach header { position: static !important; }
          .co-metallic { color: #111 !important; background: none !important; filter: none !important; -webkit-text-fill-color: initial; }
        }
      `}</style>

      <a href="#outreach-main" className="cp-skip-link">
        Skip to community outreach content
      </a>

      <header className="co-no-print sticky top-0 z-40 border-b border-cyan-400/20 bg-[#050814]/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-3" aria-label="ClearPath home" style={{ color: '#fff', textDecoration: 'none' }}>
            <BrandMark size={30} />
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.18em]" style={{ fontFamily: 'var(--co-font-display)' }}>
                ClearPathTrader
              </span>
              <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--co-cyan-soft)', fontFamily: 'var(--co-font-display)' }}>
                Community Outreach
              </span>
            </span>
          </a>
          <nav className="flex items-center gap-4 text-[10px] uppercase tracking-widest" aria-label="Outreach shortcuts" style={{ fontFamily: 'var(--co-font-display)', color: 'var(--co-muted)' }}>
            <a href="#food-shelf">Food shelf</a>
            <a href="#california-counties">CA counties</a>
            <a href="#inquiry">Inquiry</a>
            <a href="/company" style={{ color: '#fff' }}>
              Company
            </a>
          </nav>
        </div>
      </header>

      <section className="co-hero" aria-label="Clear Path Community Outreach">
        <img
          className="co-hero-media"
          src={HERO_COMMUNITY}
          alt="ClearPathTrader Community Outreach — education, opportunity, financial literacy, and digital inclusion"
          width={1400}
          height={1532}
          fetchPriority="high"
        />
        <div className="co-hero-veil" aria-hidden />
        {/* Poster art already carries brand + COMMUNITY title; keep HTML overlay to CTAs only. */}
        <div className="co-hero-content">
          <h1 className="sr-only">{COMMUNITY_OUTREACH_INTRO.heading}</h1>
          <p className="sr-only">{COMMUNITY_OUTREACH_INTRO.subheading}</p>
          <div className="flex flex-wrap gap-3 co-no-print">
            <a href="#programs" className="co-btn co-btn-primary">
              Explore programs
            </a>
            <a href="#food-shelf" className="co-btn co-btn-magenta">
              Future food shelf
            </a>
            <a href="#inquiry" className="co-btn co-btn-ghost">
              Institutional inquiry
            </a>
          </div>
          <a href={COMMUNITY_OUTREACH_PATH} className="co-cta-bar co-no-print" aria-label="Community Outreach portal URL">
            ClearPathTrader.com/Community-Outreach
          </a>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 md:px-8">
        <div className="co-panel co-panel-warm mt-8 text-sm" style={{ color: '#ffe8c8', maxWidth: '52rem' }}>
          {COMMUNITY_OUTREACH_INTRO.honestyBanner}
        </div>
        <p className="mt-4 text-sm max-w-3xl" style={{ color: 'var(--co-muted)' }}>
          {COMMUNITY_OUTREACH_INTRO.publicAccess}
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)] gap-10 pb-24">
        <aside className="hidden lg:block pt-14 co-no-print">
          <nav className="sticky top-24 space-y-2" aria-label="Community outreach sections">
            {COMMUNITY_OUTREACH_NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-[10px] uppercase tracking-wider leading-snug"
                style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.75)' }}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </aside>

        <main id="outreach-main" tabIndex={-1} className="outline-none">
          <Section id="programs" eyebrow="Phase programs" title="Five program divisions">
            <p>
              These divisions describe the proposed educational scope. They are community-education tracks — not trading
              desks, chart products, or investment services.
            </p>
            <div className="co-program-grid" style={{ maxWidth: '100%' }}>
              {PROGRAM_DIVISIONS.map((prog) => (
                <a key={prog.id} href={`#program-${prog.id}`} className="co-program-card">
                  <div className="co-icon-wrap">{PROGRAM_ICONS[prog.id]}</div>
                  <p className="text-[10px] tracking-[0.2em] uppercase" style={{ color: 'var(--co-cyan-soft)', fontFamily: 'var(--co-font-display)' }}>
                    {prog.number}
                  </p>
                  <h3 className="text-sm font-semibold text-white leading-snug" style={{ fontFamily: 'var(--co-font-display)' }}>
                    {prog.title}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--co-muted)' }}>
                    {prog.summary}
                  </p>
                </a>
              ))}
            </div>
            <p
              className="text-center uppercase tracking-[0.14em] text-sm md:text-base text-white pt-2"
              style={{ fontFamily: 'var(--co-font-display)', textShadow: '0 0 14px rgba(34,240,255,0.35)' }}
            >
              Building stronger communities through education, technology, and opportunity
            </p>
            <div className="co-pillars co-no-print">
              {SECONDARY_PILLARS.map((p) => (
                <a key={p.label} href={p.href} className="co-pillar">
                  {p.label}
                </a>
              ))}
            </div>
            <div className="grid gap-4" style={{ maxWidth: '100%' }}>
              {PROGRAM_DIVISIONS.map((prog) => (
                <article id={`program-${prog.id}`} key={`detail-${prog.id}`} className="co-panel scroll-mt-28">
                  <div className="flex flex-wrap items-baseline gap-3 mb-3">
                    <span style={{ fontFamily: 'var(--co-font-display)', color: 'var(--co-cyan-soft)', fontSize: 12, letterSpacing: '0.16em' }}>
                      {prog.number}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{prog.title}</h3>
                  </div>
                  <p className="mb-4" style={{ color: 'var(--co-muted)' }}>
                    {prog.summary}
                  </p>
                  <ul className="grid sm:grid-cols-2 gap-2 text-sm">
                    {prog.items.map((item) => (
                      <li key={item} className="co-panel" style={{ padding: '0.55rem 0.75rem', boxShadow: 'none' }}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </Section>

          <Section id="resources" eyebrow="Education" title="Educational resource library">
            <p>
              Eight planned resource categories. Unfinished materials are marked{' '}
              <strong style={{ color: '#ffe0b8' }}>IN DEVELOPMENT</strong>. Download links appear only when an authorized
              public document exists.
            </p>
            <div className="grid gap-4" style={{ maxWidth: '100%' }}>
              {resources.map((res) => (
                <article key={res.id} className="co-panel">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold">
                      <span className="mr-2" style={{ fontFamily: 'var(--co-font-display)', color: 'var(--co-cyan-soft)' }}>
                        {res.code}.
                      </span>
                      {res.title}
                    </h3>
                    <StatusPill>{res.publicationStatus}</StatusPill>
                  </div>
                  <p className="mb-3" style={{ color: 'var(--co-muted)' }}>
                    {res.description}
                  </p>
                  <p className="text-sm">
                    <strong className="text-white">Audience:</strong> {res.audience}
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm space-y-1">
                    {res.objectives.map((obj) => (
                      <li key={obj}>{obj}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs uppercase tracking-wider" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                    Revision date: {res.revisionDate}
                  </p>
                  {res.downloadUrl ? (
                    <a href={res.downloadUrl} className="mt-3 inline-block text-sm" rel="noopener noreferrer">
                      Download authorized document
                    </a>
                  ) : (
                    <p className="mt-3 text-sm" style={{ color: '#ffe0b8' }}>
                      Download unavailable — material in development.
                    </p>
                  )}
                </article>
              ))}
            </div>
          </Section>

          <Section id="food-shelf" eyebrow="Future initiative" title={FOOD_SHELF_FUTURE_INITIATIVE.title}>
            <div className="co-food-hero">
              <img
                src={HERO_FOOD_BANK}
                alt="ClearPathTrader Community Food Bank concept art — future initiative, not yet operational"
                width={1400}
                height={1532}
                loading="lazy"
              />
              <div className="co-food-hero-caption">Community Food Bank · Future initiative</div>
            </div>
            <div className="co-panel co-panel-warm font-semibold text-xs uppercase tracking-[0.18em]" style={{ fontFamily: 'var(--co-font-display)', color: '#ffe8c8' }}>
              {FOOD_SHELF_FUTURE_INITIATIVE.statusBanner}
            </div>
            <p
              className="uppercase tracking-[0.12em] text-sm text-white"
              style={{ fontFamily: 'var(--co-font-display)', textShadow: '0 0 12px rgba(34,240,255,0.35)' }}
            >
              Proposed mission — not open for drop-off or pick-up yet
            </p>
            <div className="co-help-row co-no-print" aria-label="Proposed future food-shelf focus areas">
              {FOOD_HELP_LABELS.map((label) => (
                <div key={label} className="co-help-chip">
                  {label}
                </div>
              ))}
            </div>
            <p>{FOOD_SHELF_FUTURE_INITIATIVE.lead}</p>
            <p>{FOOD_SHELF_FUTURE_INITIATIVE.opportunityFraming}</p>

            <div className="co-panel space-y-3">
              <h3 className="text-white font-semibold text-base">Published labor-market context</h3>
              <p>
                {CALIFORNIA_UNEMPLOYMENT_CONTEXT.label}: approximately{' '}
                <strong className="text-white">{CALIFORNIA_UNEMPLOYMENT_CONTEXT.unemployed}</strong> unemployed (
                {CALIFORNIA_UNEMPLOYMENT_CONTEXT.unemploymentRate}) for{' '}
                <strong className="text-white">{CALIFORNIA_UNEMPLOYMENT_CONTEXT.period}</strong>.
              </p>
              <p className="text-sm">
                Source:{' '}
                <a href={CALIFORNIA_UNEMPLOYMENT_CONTEXT.sourceUrl} target="_blank" rel="noopener noreferrer">
                  {CALIFORNIA_UNEMPLOYMENT_CONTEXT.sourceName}
                </a>
                . {CALIFORNIA_UNEMPLOYMENT_CONTEXT.blsCrossCheck}{' '}
                <a href={CALIFORNIA_UNEMPLOYMENT_CONTEXT.blsUrl} target="_blank" rel="noopener noreferrer">
                  BLS LAUS table
                </a>
                .
              </p>
              <p className="text-sm">{CALIFORNIA_UNEMPLOYMENT_CONTEXT.note}</p>
            </div>

            <h3 className="text-white font-semibold text-base pt-2">Planning goals</h3>
            <ul className="list-disc pl-5 space-y-2">
              {FOOD_SHELF_FUTURE_INITIATIVE.goals.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>

            <h3 className="text-white font-semibold text-base pt-2">Proposed operating model</h3>
            <div className="grid md:grid-cols-2 gap-3" style={{ maxWidth: '100%' }}>
              {FOOD_SHELF_FUTURE_INITIATIVE.proposedOperatingModel.map((row, idx) => (
                <article key={row.title} className={`co-panel ${idx % 2 ? 'co-panel-magenta' : ''}`}>
                  <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--co-cyan-soft)' }}>
                    {row.title}
                  </h4>
                  <p className="text-sm">{row.body}</p>
                </article>
              ))}
            </div>

            <h3 className="text-white font-semibold text-base pt-2">Riverside County community leadership pathways (proposed)</h3>
            <div className="space-y-3" style={{ maxWidth: '100%' }}>
              {FOOD_SHELF_FUTURE_INITIATIVE.riversideLeadershipPathways.map((row) => (
                <article key={row.title} className="co-panel">
                  <h4 className="text-white font-semibold text-sm mb-1">{row.title}</h4>
                  <p className="text-sm">{row.body}</p>
                </article>
              ))}
            </div>

            <h3 className="text-white font-semibold text-base pt-2">Need food today? Use these official resources now</h3>
            <ul className="space-y-3" style={{ maxWidth: '100%' }}>
              {FOOD_SHELF_FUTURE_INITIATIVE.helpAvailableNow.map((link) => (
                <li key={link.href} className="co-panel">
                  <a href={link.href} className="font-medium" target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                  <p className="text-sm mt-1">{link.detail}</p>
                </li>
              ))}
            </ul>

            <div className="co-panel co-panel-warm space-y-2 text-sm" style={{ color: '#ffe8c8' }}>
              {FOOD_SHELF_FUTURE_INITIATIVE.disclaimers.map((d) => (
                <p key={d}>{d}</p>
              ))}
            </div>
            <div className="co-panel co-panel-magenta space-y-2 text-sm">
              <p className="uppercase tracking-[0.12em] text-white" style={{ fontFamily: 'var(--co-font-display)' }}>
                How you can help (when the shelf opens)
              </p>
              <ul className="space-y-1">
                <li>✓ Donate shelf-stable food</li>
                <li>✓ Volunteer your time</li>
                <li>✓ Support local families</li>
                <li>✓ Spread the word</li>
              </ul>
              <p className="text-xs" style={{ color: 'var(--co-muted)' }}>
                These actions are planned — not available yet. Use the inquiry form to discuss leadership or partnership
                pathways in Riverside County.
              </p>
            </div>
          </Section>

          <Section id="partnerships" eyebrow="Institutions" title="Institutional partnership center">
            <p>
              Proposed educational partnership pathways for libraries, schools, districts, municipalities, counties, and
              state agencies. These are explanations of intent — not signed agreements.
            </p>
            <div className="grid gap-3" style={{ maxWidth: '100%' }}>
              {PARTNERSHIP_AUDIENCES.map((p, idx) => (
                <article key={p.id} className={`co-panel ${idx % 2 ? 'co-panel-magenta' : ''}`}>
                  <h3 className="text-white font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm">{p.explanation}</p>
                </article>
              ))}
            </div>
            <p>
              Organizations may request information through the <a href="#inquiry">institutional inquiry</a> form.
            </p>
          </Section>

          <Section id="directory" eyebrow="Local directory" title="Local institution directory">
            <div className="co-panel co-panel-warm text-sm" style={{ color: '#ffe8c8' }}>
              {DIRECTORY_BANNER} These are potential points of contact, not confirmed partners.
            </div>
            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
              <table className="co-table">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Proposed relationship</th>
                    <th>Status</th>
                    <th>Official website</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst) => (
                    <tr key={inst.id}>
                      <td>
                        <div className="text-white font-medium">{inst.name}</div>
                        <div className="text-xs mt-1" style={{ color: 'rgba(169,180,212,0.7)' }}>
                          {inst.category}
                        </div>
                        <div className="text-[11px] mt-2" style={{ color: '#ffe0b8' }}>
                          {inst.note}
                        </div>
                      </td>
                      <td style={{ color: 'var(--co-muted)' }}>{inst.proposedRelationship}</td>
                      <td>
                        <StatusPill>{inst.status}</StatusPill>
                        <div className="text-[11px] mt-2" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.65)' }}>
                          Verified {inst.lastVerifiedDate}
                        </div>
                      </td>
                      <td>
                        <a href={inst.website} className="break-all" target="_blank" rel="noopener noreferrer">
                          {inst.websiteLabel}
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="california-counties" eyebrow="California" title="California by county — libraries & community centers">
            <p>
              All {CALIFORNIA_COUNTY_COUNT} California counties are listed with major cities, the county’s primary public
              library system (or largest city library where that is the practical public door), and a major community /
              parks-recreation center link. These are public resource links for outreach planning.
            </p>
            <div className="co-panel co-panel-warm text-sm" style={{ color: '#ffe8c8' }}>
              {CALIFORNIA_COUNTY_DIRECTORY_BANNER}
            </div>
            <label className="block co-no-print">
              <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                Filter counties or cities
              </span>
              <input
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="co-input max-w-md"
                placeholder="e.g. Riverside, Murrieta, library…"
              />
            </label>
            <div className="space-y-4" style={{ maxWidth: '100%' }}>
              {filteredCounties.map((county) => (
                <article key={county.id} className="co-panel print:break-inside-avoid">
                  <h3 className="text-lg font-semibold text-white mb-3">{county.county} County</h3>
                  <p className="text-sm mb-3">
                    <strong className="text-white">Cities / major places:</strong> {county.cities.join(', ')}
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="co-panel" style={{ boxShadow: 'none' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                        Major library
                      </p>
                      <a href={county.majorLibrary.url} target="_blank" rel="noopener noreferrer">
                        {county.majorLibrary.name}
                      </a>
                    </div>
                    <div className="co-panel co-panel-magenta" style={{ boxShadow: 'none' }}>
                      <p className="text-[10px] uppercase tracking-wider mb-1" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                        Major community / recreation center
                      </p>
                      <a href={county.majorCommunityCenter.url} target="_blank" rel="noopener noreferrer">
                        {county.majorCommunityCenter.name}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
              {filteredCounties.length === 0 ? <p className="text-sm">No counties match that filter.</p> : null}
            </div>
          </Section>

          <Section id="snap-calfresh" eyebrow="Benefits information" title={SNAP_CALFRESH.title}>
            <ul className="list-disc pl-5 space-y-2">
              {SNAP_CALFRESH.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="co-panel co-panel-warm text-sm space-y-2" style={{ color: '#ffe8c8' }}>
              <p>{SNAP_CALFRESH.disclaimer}</p>
              <p>{SNAP_CALFRESH.commercialBan}</p>
            </div>
            <ul className="space-y-2">
              {SNAP_CALFRESH.officialLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="documents" eyebrow="Document center" title="Institutional document center">
            <p>
              Only documents authorized for public distribution show download links. Everything else remains in
              development.
            </p>
            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
              <table className="co-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Title / version</th>
                    <th>Status</th>
                    <th>Download</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id}>
                      <td style={{ color: 'var(--co-muted)' }}>{doc.category}</td>
                      <td>
                        <div className="text-white">{doc.title}</div>
                        <div className="text-xs mt-1" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.65)' }}>
                          {doc.version} · {doc.publicationDate}
                        </div>
                      </td>
                      <td>
                        <StatusPill>{doc.approvalStatus}</StatusPill>
                      </td>
                      <td>
                        {doc.downloadUrl ? (
                          <a href={doc.downloadUrl} rel="noopener noreferrer">
                            Download PDF
                          </a>
                        ) : (
                          <span className="text-sm" style={{ color: '#ffe0b8' }}>
                            In development
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="transparency" eyebrow="Verification" title="Program transparency & institutional status">
            <p className="co-panel">{TRANSPARENCY_STATEMENT}</p>
            <p className="text-sm">
              Status values may be Proposed, Submitted, Under Review, Approved, Active, Suspended, or Expired. Every
              institution starts as Proposed. Status never auto-promotes to Approved — an authorized administrator must
              record documented authorization.
            </p>
            <div className="overflow-x-auto" style={{ maxWidth: '100%' }}>
              <table className="co-table">
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Proposed relationship</th>
                    <th>Current status</th>
                    <th>Last verified</th>
                    <th>Official website</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst) => (
                    <tr key={`t-${inst.id}`}>
                      <td className="text-white">{inst.name}</td>
                      <td style={{ color: 'var(--co-muted)' }}>{inst.proposedRelationship}</td>
                      <td>
                        <StatusPill>{inst.status}</StatusPill>
                      </td>
                      <td style={{ fontFamily: 'var(--co-font-display)', fontSize: 11, color: 'rgba(169,180,212,0.65)' }}>
                        {inst.lastVerifiedDate}
                      </td>
                      <td>
                        <a href={inst.website} target="_blank" rel="noopener noreferrer">
                          Visit site
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="governance" eyebrow="Safeguards" title="Governance and safeguards">
            <p className="co-panel co-panel-warm text-sm" style={{ color: '#ffe8c8' }}>
              {GOVERNANCE_POLICY_NOTE}
            </p>
            <div className="grid gap-3" style={{ maxWidth: '100%' }}>
              {GOVERNANCE_SECTIONS.map((g, idx) => (
                <article key={g.id} className={`co-panel ${idx % 2 ? 'co-panel-magenta' : ''}`}>
                  <h3 className="text-white font-semibold text-sm mb-2">{g.title}</h3>
                  <p className="text-sm">{g.body}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section id="inquiry" eyebrow="Contact" title="Institutional inquiry">
            <p>
              Organizations may request information about educational partnerships, curriculum review, community
              outreach, or the future food-shelf initiative. This form does not create a partnership.
            </p>
            <p className="text-sm" style={{ color: '#ffe0b8' }}>
              {INQUIRY_PRIVACY_NOTE}
            </p>
            <form onSubmit={submitInquiry} className="co-panel space-y-4 max-w-xl">
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                  Name
                </span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="co-input"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                  Organization
                </span>
                <input
                  required
                  value={form.organization}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                  className="co-input"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                  Business email
                </span>
                <input
                  required
                  type="email"
                  value={form.businessEmail}
                  onChange={(e) => setForm((f) => ({ ...f, businessEmail: e.target.value }))}
                  className="co-input"
                />
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                  Inquiry category
                </span>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as InquiryCategory }))}
                >
                  {INQUIRY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] uppercase tracking-widest" style={{ fontFamily: 'var(--co-font-display)', color: 'rgba(169,180,212,0.7)' }}>
                  Message
                </span>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                />
              </label>
              <button type="submit" disabled={formStatus === 'sending'} className="co-btn co-btn-primary disabled:opacity-60">
                {formStatus === 'sending' ? 'Sending…' : 'Submit inquiry'}
              </button>
              {formStatus === 'ok' ? (
                <p className="text-sm" style={{ color: '#7ef6ff' }}>
                  Inquiry received. Thank you — an authorized reviewer can follow up.
                </p>
              ) : null}
              {formStatus === 'err' ? <p className="text-sm text-rose-300">{formError}</p> : null}
            </form>
          </Section>

          <footer className="border-t border-cyan-400/20 pt-10 mt-8 space-y-4 text-sm" style={{ color: 'rgba(169,180,212,0.75)' }}>
            <p>
              Clear Path Community Outreach is associated with Clear Path Markets Science Corp. Route:{' '}
              <code style={{ color: '#dce7ff' }}>{COMMUNITY_OUTREACH_PATH}</code>. This page is public, free, and separate
              from the ClearPathTrader charting platform.
            </p>
            <a href={COMMUNITY_OUTREACH_PATH} className="co-cta-bar co-no-print">
              ClearPathTrader.com/Community-Outreach
            </a>
            <PublicSiteLinks />
          </footer>
        </main>
      </div>
    </div>
  );
}
