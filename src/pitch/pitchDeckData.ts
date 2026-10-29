export type PitchSlideId =
  | 'cover'
  | 'problem'
  | 'market'
  | 'product'
  | 'ai'
  | 'traction'
  | 'model'
  | 'gtm'
  | 'raise'
  | 'close';

export type PitchCategory = {
  id: PitchSlideId;
  label: string;
  menuLabel: string;
};

export const PITCH_CATEGORIES: PitchCategory[] = [
  { id: 'cover', label: 'Cover', menuLabel: 'Cover' },
  { id: 'problem', label: 'The problem', menuLabel: 'The problem' },
  { id: 'market', label: 'The market', menuLabel: 'The market' },
  { id: 'product', label: 'The product', menuLabel: 'The product' },
  { id: 'ai', label: 'AI advantage', menuLabel: 'AI advantage' },
  { id: 'traction', label: 'Traction', menuLabel: 'Traction' },
  { id: 'model', label: 'Business model', menuLabel: 'Business model' },
  { id: 'gtm', label: 'Go to market', menuLabel: 'Go to market' },
  { id: 'raise', label: 'The raise', menuLabel: 'The raise' },
  { id: 'close', label: 'Close', menuLabel: 'Close' },
];

export type PitchSlide = {
  id: PitchSlideId;
  kicker: string;
  title: string;
  subtitle?: string;
  bullets?: string[];
  callout?: { label: string; body: string };
  metrics?: Array<{ label: string; value: string; unverified?: boolean }>;
  funds?: Array<{ label: string; pct: number }>;
  pairs?: Array<{ label: string; value: string }>;
  footnote?: string;
};

export const PITCH_SLIDES: PitchSlide[] = [
  {
    id: 'cover',
    kicker: 'ClearPath Trader',
    title: 'Investor pitch',
    subtitle:
      'A chart-first terminal for retail, institutional, and neurodivergent traders — honest data, differentiated UX, and AI that explains instead of hallucinating fills.',
  },
  {
    id: 'problem',
    kicker: 'The problem',
    title: 'Terminals optimize for pros — and leave everyone else behind.',
    bullets: [
      'Retail traders get cluttered dashboards, opaque data, and tools that punish cognitive load.',
      'Institutional workflows need integrity, auditability, and vendor transparency — not black-box widgets.',
      'Neurodivergent traders need calm layouts, predictable navigation, and accessibility that is not an afterthought.',
    ],
  },
  {
    id: 'market',
    kicker: 'The market',
    title: 'Three desks, one platform.',
    bullets: [
      'Retail — self-directed traders who want pro-grade charts without a Bloomberg budget.',
      'Institutional — research, positioning, and macro context with server-side vendor keys and fail-closed honesty.',
      'Neurodivergent — chart-first desks, held-file bento, WCAG display prefs, and reduced sensory modes.',
    ],
    footnote: 'TAM/SAM/SOM figures are founder estimates — not third-party verified in this deck.',
  },
  {
    id: 'product',
    kicker: 'The product',
    title: 'ClearPath Trader is a single SPA + Express terminal.',
    bullets: [
      'Live market data via proxied Twelve Data (no client-side secrets).',
      'Institutional, retail, and neurodivergent chart desks with shared intelligence rails.',
      'CEO ops layer: Site Doctor, backups, membership, and content governance on clearpathtrader.com.',
    ],
  },
  {
    id: 'ai',
    kicker: 'AI advantage',
    title: 'AI as copilot — not fake market data.',
    bullets: [
      'Explain overlays, literacy OS, and desk assistants grounded in what the chart actually shows.',
      'Missing vendor cells stay blank (DATA UNAVAILABLE) — the model does not invent COT, IV, or Level II.',
      'Founder-gated publishing for sensitive briefings and pattern reviews.',
    ],
  },
  {
    id: 'traction',
    kicker: 'Traction',
    title: 'Early product — metrics below need founder verification.',
    metrics: [
      { label: 'Monthly active traders', value: '—', unverified: true },
      { label: 'Paying members', value: '—', unverified: true },
      { label: 'Net revenue (ARR/MRR)', value: '—', unverified: true },
      { label: '90-day retention', value: '—', unverified: true },
    ],
    footnote:
      'Replace placeholders with Stripe/Firestore exports before sending this deck to institutional investors.',
  },
  {
    id: 'model',
    kicker: 'Business model',
    title: 'Membership + education + institutional upsell.',
    bullets: [
      'Tiered plans (Basic → Platinum) with chart entitlements aligned to plan catalog.',
      'Affiliate network with cookie attribution and account credit.',
      'Optional API / white-label paths for partners (future).',
    ],
  },
  {
    id: 'gtm',
    kicker: 'Go to market',
    title: 'Community-led growth with founder trust.',
    bullets: [
      'YWC magazine rack, education desks, and SEO encyclopedia funnels.',
      'Press kit, broker network page, and transparent ops for chargeback-sensitive UX.',
      'Paid social + scheduling via tools like Metricool once brand slots are budgeted.',
    ],
  },
  {
    id: 'raise',
    kicker: 'The investment',
    title: 'Raising $1.5M to turn a differentiated product into a repeatable growth engine.',
    subtitle:
      'Capital funds product hardening, compliant data spend, and go-to-market — not vanity features.',
    callout: {
      label: 'Proposed structure',
      body: '$1.5M seed financing via SAFE',
    },
    pairs: [
      { label: 'Valuation cap', value: '$15M' },
      { label: 'Discount', value: '20%' },
    ],
    funds: [
      { label: 'Product & engineering', pct: 45 },
      { label: 'Growth & community', pct: 25 },
      { label: 'Data & compliance', pct: 20 },
      { label: 'Operations', pct: 10 },
    ],
  },
  {
    id: 'close',
    kicker: 'Close',
    title: 'Join us on clearpathtrader.com',
    subtitle: 'Founder conversations: forexanarchy@gmail.com',
    bullets: [
      'Live terminal: https://clearpathtrader.com',
      'This deck: https://clearpathtrader.com/pitch',
      'Due diligence: Site Doctor + disaster backup exports on CEO dashboard.',
    ],
  },
];

export function slideIndex(id: PitchSlideId): number {
  return PITCH_SLIDES.findIndex((s) => s.id === id);
}

export function slideById(id: PitchSlideId): PitchSlide {
  return PITCH_SLIDES[slideIndex(id)] ?? PITCH_SLIDES[0];
}

export function parsePitchPath(pathname: string): { mode: 'intro' | 'deck'; slideId: PitchSlideId } {
  const parts = pathname.toLowerCase().replace(/\/$/, '').split('/').filter(Boolean);
  if (parts[0] !== 'pitch') return { mode: 'intro', slideId: 'cover' };
  const slug = (parts[1] || 'cover') as PitchSlideId;
  const valid = PITCH_CATEGORIES.some((c) => c.id === slug);
  if (!parts[1]) return { mode: 'intro', slideId: 'cover' };
  return { mode: 'deck', slideId: valid ? slug : 'cover' };
}

export function pitchHref(id: PitchSlideId): string {
  return id === 'cover' ? '/pitch/cover' : `/pitch/${id}`;
}
