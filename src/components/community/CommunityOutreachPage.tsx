/**
 * Clear Path Community Outreach — public institutional portal.
 * Isolated from trading desks, charts, tickers, and membership upsells.
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
    <section id={id} className="scroll-mt-28 border-t border-slate-700/60 py-14 md:py-18 print:break-inside-avoid">
      {eyebrow ? (
        <p className="text-[10px] font-mono uppercase tracking-[0.32em] text-sky-300/90 mb-3">{eyebrow}</p>
      ) : null}
      <h2 className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-50 mb-6 max-w-3xl">{title}</h2>
      <div className="space-y-5 text-[15px] leading-relaxed text-slate-300 max-w-4xl">{children}</div>
    </section>
  );
}

function StatusPill({ children, tone = 'amber' }: { children: React.ReactNode; tone?: 'amber' | 'sky' | 'slate' }) {
  const cls =
    tone === 'sky'
      ? 'border-sky-400/40 bg-sky-500/10 text-sky-200'
      : tone === 'slate'
        ? 'border-slate-500/40 bg-slate-500/10 text-slate-300'
        : 'border-amber-400/40 bg-amber-500/10 text-amber-100';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest border ${cls}`}>
      {children}
    </span>
  );
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
    <div className="co-outreach min-h-[100dvh] bg-[#0b1220] text-slate-100">
      <SEO
        title={COMMUNITY_OUTREACH_META.title}
        description={COMMUNITY_OUTREACH_META.description}
        keywords={COMMUNITY_OUTREACH_META.keywords}
        canonical={COMMUNITY_OUTREACH_META.canonical}
      />

      <style>{`
        @media print {
          .co-outreach { background: #fff !important; color: #111 !important; }
          .co-outreach a { color: #0b3d91 !important; text-decoration: underline; }
          .co-no-print { display: none !important; }
          .co-outreach header { position: static !important; }
        }
      `}</style>

      <a href="#outreach-main" className="cp-skip-link">
        Skip to community outreach content
      </a>

      <header className="co-no-print sticky top-0 z-40 border-b border-slate-700/70 bg-[#0b1220]/92 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          <a href="/" className="flex items-center gap-3" aria-label="ClearPath home">
            <BrandMark size={30} />
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold uppercase tracking-[0.18em]">Clear Path</span>
              <span className="text-[10px] font-mono uppercase tracking-widest text-sky-300">Community Outreach</span>
            </span>
          </a>
          <nav className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-slate-400" aria-label="Outreach shortcuts">
            <a href="#food-shelf" className="hover:text-sky-300">
              Food shelf
            </a>
            <a href="#california-counties" className="hover:text-sky-300">
              CA counties
            </a>
            <a href="#inquiry" className="hover:text-sky-300">
              Inquiry
            </a>
            <a href="/company" className="hover:text-white">
              Company
            </a>
          </nav>
        </div>
      </header>

      <div className="relative overflow-hidden border-b border-slate-700/70">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{
            background:
              'radial-gradient(ellipse 70% 55% at 15% -10%, rgba(56,189,248,0.16), transparent 55%), radial-gradient(ellipse 55% 45% at 90% 10%, rgba(14,165,233,0.10), transparent 50%), linear-gradient(180deg, #101a2e 0%, #0b1220 100%)',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-4 md:px-8 py-14 md:py-20">
          <p className="text-[10px] font-mono uppercase tracking-[0.35em] text-sky-300 mb-4">Public verification portal</p>
          <h1 className="text-3xl md:text-5xl font-semibold tracking-tight max-w-4xl leading-[1.12] text-white">
            {COMMUNITY_OUTREACH_INTRO.heading}
          </h1>
          <p className="mt-5 text-lg md:text-xl text-sky-200/95 font-medium max-w-3xl">{COMMUNITY_OUTREACH_INTRO.subheading}</p>
          <p className="mt-6 text-slate-300 max-w-3xl leading-relaxed">{COMMUNITY_OUTREACH_INTRO.lead}</p>
          <p className="mt-4 text-slate-400 max-w-3xl leading-relaxed">{COMMUNITY_OUTREACH_INTRO.publicAccess}</p>
          <div className="mt-6 max-w-3xl rounded-sm border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-sm text-amber-50">
            {COMMUNITY_OUTREACH_INTRO.honestyBanner}
          </div>
          <div className="mt-8 flex flex-wrap gap-3 co-no-print">
            <a
              href="#food-shelf"
              className="inline-flex items-center justify-center px-5 py-3 text-xs font-semibold uppercase tracking-widest bg-sky-400 text-slate-950 hover:bg-white transition-colors"
            >
              Future food shelf
            </a>
            <a
              href="#california-counties"
              className="inline-flex items-center justify-center px-5 py-3 text-xs font-semibold uppercase tracking-widest border border-slate-500 text-slate-100 hover:border-sky-300 hover:text-sky-200 transition-colors"
            >
              California by county
            </a>
            <a
              href="#inquiry"
              className="inline-flex items-center justify-center px-5 py-3 text-xs font-semibold uppercase tracking-widest border border-slate-500 text-slate-100 hover:border-sky-300 hover:text-sky-200 transition-colors"
            >
              Institutional inquiry
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-[210px_minmax(0,1fr)] gap-10 pb-24">
        <aside className="hidden lg:block pt-14 co-no-print">
          <nav className="sticky top-24 space-y-2" aria-label="Community outreach sections">
            {COMMUNITY_OUTREACH_NAV.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 hover:text-sky-300 leading-snug"
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
            <div className="grid gap-4">
              {PROGRAM_DIVISIONS.map((prog) => (
                <article key={prog.id} className="border border-slate-700/80 bg-slate-900/40 p-5 md:p-6">
                  <div className="flex flex-wrap items-baseline gap-3 mb-3">
                    <span className="font-mono text-sky-300 text-xs tracking-widest">{prog.number}</span>
                    <h3 className="text-lg font-semibold text-white">{prog.title}</h3>
                  </div>
                  <p className="text-slate-400 mb-4">{prog.summary}</p>
                  <ul className="grid sm:grid-cols-2 gap-2 text-sm text-slate-300">
                    {prog.items.map((item) => (
                      <li key={item} className="border border-slate-700/60 bg-black/20 px-3 py-2">
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
              Eight planned resource categories. Unfinished materials are marked <strong className="text-amber-100">IN DEVELOPMENT</strong>.
              Download links appear only when an authorized public document exists.
            </p>
            <div className="grid gap-4">
              {resources.map((res) => (
                <article key={res.id} className="border border-slate-700/80 bg-slate-900/35 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                    <h3 className="text-white font-semibold">
                      <span className="font-mono text-sky-300 mr-2">{res.code}.</span>
                      {res.title}
                    </h3>
                    <StatusPill>{res.publicationStatus}</StatusPill>
                  </div>
                  <p className="text-slate-400 mb-3">{res.description}</p>
                  <p className="text-sm text-slate-300">
                    <strong className="text-slate-100">Audience:</strong> {res.audience}
                  </p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-slate-400 space-y-1">
                    {res.objectives.map((obj) => (
                      <li key={obj}>{obj}</li>
                    ))}
                  </ul>
                  <p className="mt-3 text-xs font-mono uppercase tracking-wider text-slate-500">
                    Revision date: {res.revisionDate}
                  </p>
                  {res.downloadUrl ? (
                    <a href={res.downloadUrl} className="mt-3 inline-block text-sky-300 hover:underline text-sm" rel="noopener noreferrer">
                      Download authorized document
                    </a>
                  ) : (
                    <p className="mt-3 text-sm text-amber-100/90">Download unavailable — material in development.</p>
                  )}
                </article>
              ))}
            </div>
          </Section>

          <Section id="food-shelf" eyebrow="Future initiative" title={FOOD_SHELF_FUTURE_INITIATIVE.title}>
            <div className="rounded-sm border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-amber-50 font-mono text-xs uppercase tracking-widest">
              {FOOD_SHELF_FUTURE_INITIATIVE.statusBanner}
            </div>
            <p>{FOOD_SHELF_FUTURE_INITIATIVE.lead}</p>
            <p>{FOOD_SHELF_FUTURE_INITIATIVE.opportunityFraming}</p>

            <div className="border border-slate-700/80 bg-slate-900/50 p-5 space-y-3">
              <h3 className="text-white font-semibold text-base">Published labor-market context</h3>
              <p>
                {CALIFORNIA_UNEMPLOYMENT_CONTEXT.label}: approximately{' '}
                <strong className="text-white">{CALIFORNIA_UNEMPLOYMENT_CONTEXT.unemployed}</strong> unemployed (
                {CALIFORNIA_UNEMPLOYMENT_CONTEXT.unemploymentRate}) for{' '}
                <strong className="text-white">{CALIFORNIA_UNEMPLOYMENT_CONTEXT.period}</strong>.
              </p>
              <p className="text-sm text-slate-400">
                Source:{' '}
                <a
                  href={CALIFORNIA_UNEMPLOYMENT_CONTEXT.sourceUrl}
                  className="text-sky-300 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {CALIFORNIA_UNEMPLOYMENT_CONTEXT.sourceName}
                </a>
                . {CALIFORNIA_UNEMPLOYMENT_CONTEXT.blsCrossCheck}{' '}
                <a
                  href={CALIFORNIA_UNEMPLOYMENT_CONTEXT.blsUrl}
                  className="text-sky-300 hover:underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  BLS LAUS table
                </a>
                .
              </p>
              <p className="text-sm text-slate-400">{CALIFORNIA_UNEMPLOYMENT_CONTEXT.note}</p>
            </div>

            <h3 className="text-white font-semibold text-base pt-2">Planning goals</h3>
            <ul className="list-disc pl-5 space-y-2">
              {FOOD_SHELF_FUTURE_INITIATIVE.goals.map((g) => (
                <li key={g}>{g}</li>
              ))}
            </ul>

            <h3 className="text-white font-semibold text-base pt-2">Proposed operating model</h3>
            <div className="grid md:grid-cols-2 gap-3">
              {FOOD_SHELF_FUTURE_INITIATIVE.proposedOperatingModel.map((row) => (
                <article key={row.title} className="border border-slate-700/70 bg-black/25 p-4">
                  <h4 className="text-sky-200 font-semibold text-sm mb-2">{row.title}</h4>
                  <p className="text-sm text-slate-400">{row.body}</p>
                </article>
              ))}
            </div>

            <h3 className="text-white font-semibold text-base pt-2">Riverside County community leadership pathways (proposed)</h3>
            <div className="space-y-3">
              {FOOD_SHELF_FUTURE_INITIATIVE.riversideLeadershipPathways.map((row) => (
                <article key={row.title} className="border border-slate-700/70 bg-slate-900/40 p-4">
                  <h4 className="text-white font-semibold text-sm mb-1">{row.title}</h4>
                  <p className="text-sm text-slate-400">{row.body}</p>
                </article>
              ))}
            </div>

            <h3 className="text-white font-semibold text-base pt-2">Need food today? Use these official resources now</h3>
            <ul className="space-y-3">
              {FOOD_SHELF_FUTURE_INITIATIVE.helpAvailableNow.map((link) => (
                <li key={link.href} className="border border-slate-700/70 bg-black/20 px-4 py-3">
                  <a href={link.href} className="text-sky-300 hover:underline font-medium" target="_blank" rel="noopener noreferrer">
                    {link.label}
                  </a>
                  <p className="text-sm text-slate-400 mt-1">{link.detail}</p>
                </li>
              ))}
            </ul>

            <div className="space-y-2 border border-amber-400/30 bg-amber-500/5 p-4 text-sm text-amber-50/95">
              {FOOD_SHELF_FUTURE_INITIATIVE.disclaimers.map((d) => (
                <p key={d}>{d}</p>
              ))}
            </div>
          </Section>

          <Section id="partnerships" eyebrow="Institutions" title="Institutional partnership center">
            <p>
              Proposed educational partnership pathways for libraries, schools, districts, municipalities, counties, and
              state agencies. These are explanations of intent — not signed agreements.
            </p>
            <div className="grid gap-3">
              {PARTNERSHIP_AUDIENCES.map((p) => (
                <article key={p.id} className="border border-slate-700/80 bg-slate-900/40 p-4">
                  <h3 className="text-white font-semibold mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-400">{p.explanation}</p>
                </article>
              ))}
            </div>
            <p>
              Organizations may request information through the{' '}
              <a href="#inquiry" className="text-sky-300 hover:underline">
                institutional inquiry
              </a>{' '}
              form.
            </p>
          </Section>

          <Section id="directory" eyebrow="Local directory" title="Local institution directory">
            <div className="rounded-sm border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-amber-50 text-sm">
              {DIRECTORY_BANNER} These are potential points of contact, not confirmed partners.
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-600 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 pr-3">Institution</th>
                    <th className="py-3 pr-3">Proposed relationship</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3">Official website</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst) => (
                    <tr key={inst.id} className="border-b border-slate-800 align-top">
                      <td className="py-4 pr-3">
                        <div className="text-white font-medium">{inst.name}</div>
                        <div className="text-xs text-slate-500 mt-1">{inst.category}</div>
                        <div className="text-[11px] text-amber-100/80 mt-2">{inst.note}</div>
                      </td>
                      <td className="py-4 pr-3 text-slate-400">{inst.proposedRelationship}</td>
                      <td className="py-4 pr-3">
                        <StatusPill>{inst.status}</StatusPill>
                        <div className="text-[11px] text-slate-500 mt-2 font-mono">Verified {inst.lastVerifiedDate}</div>
                      </td>
                      <td className="py-4">
                        <a
                          href={inst.website}
                          className="text-sky-300 hover:underline break-all"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
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
            <div className="rounded-sm border border-amber-400/35 bg-amber-500/10 px-4 py-3 text-amber-50 text-sm">
              {CALIFORNIA_COUNTY_DIRECTORY_BANNER}
            </div>
            <label className="block co-no-print">
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Filter counties or cities</span>
              <input
                value={countyFilter}
                onChange={(e) => setCountyFilter(e.target.value)}
                className="mt-2 w-full max-w-md bg-slate-950 border border-slate-600 px-3 py-2 text-sm text-white outline-none focus:border-sky-400"
                placeholder="e.g. Riverside, Murrieta, library…"
              />
            </label>
            <div className="space-y-4">
              {filteredCounties.map((county) => (
                <article key={county.id} className="border border-slate-700/80 bg-slate-900/40 p-5 print:break-inside-avoid">
                  <h3 className="text-lg font-semibold text-white mb-3">{county.county} County</h3>
                  <p className="text-sm text-slate-400 mb-3">
                    <strong className="text-slate-200">Cities / major places:</strong> {county.cities.join(', ')}
                  </p>
                  <div className="grid md:grid-cols-2 gap-3 text-sm">
                    <div className="border border-slate-700/70 bg-black/20 p-3">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">Major library</p>
                      <a
                        href={county.majorLibrary.url}
                        className="text-sky-300 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {county.majorLibrary.name}
                      </a>
                    </div>
                    <div className="border border-slate-700/70 bg-black/20 p-3">
                      <p className="text-[10px] font-mono uppercase tracking-wider text-slate-500 mb-1">
                        Major community / recreation center
                      </p>
                      <a
                        href={county.majorCommunityCenter.url}
                        className="text-sky-300 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {county.majorCommunityCenter.name}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
              {filteredCounties.length === 0 ? (
                <p className="text-slate-500 text-sm">No counties match that filter.</p>
              ) : null}
            </div>
          </Section>

          <Section id="snap-calfresh" eyebrow="Benefits information" title={SNAP_CALFRESH.title}>
            <ul className="list-disc pl-5 space-y-2">
              {SNAP_CALFRESH.bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
            <div className="border border-amber-400/35 bg-amber-500/10 p-4 text-amber-50 text-sm space-y-2">
              <p>{SNAP_CALFRESH.disclaimer}</p>
              <p>{SNAP_CALFRESH.commercialBan}</p>
            </div>
            <ul className="space-y-2">
              {SNAP_CALFRESH.officialLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sky-300 hover:underline" target="_blank" rel="noopener noreferrer">
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
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-600 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 pr-3">Category</th>
                    <th className="py-3 pr-3">Title / version</th>
                    <th className="py-3 pr-3">Status</th>
                    <th className="py-3">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {documents.map((doc) => (
                    <tr key={doc.id} className="border-b border-slate-800 align-top">
                      <td className="py-4 pr-3 text-slate-400">{doc.category}</td>
                      <td className="py-4 pr-3">
                        <div className="text-white">{doc.title}</div>
                        <div className="text-xs font-mono text-slate-500 mt-1">
                          {doc.version} · {doc.publicationDate}
                        </div>
                      </td>
                      <td className="py-4 pr-3">
                        <StatusPill>{doc.approvalStatus}</StatusPill>
                      </td>
                      <td className="py-4">
                        {doc.downloadUrl ? (
                          <a href={doc.downloadUrl} className="text-sky-300 hover:underline" rel="noopener noreferrer">
                            Download PDF
                          </a>
                        ) : (
                          <span className="text-amber-100/90 text-sm">In development</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Section>

          <Section id="transparency" eyebrow="Verification" title="Program transparency & institutional status">
            <p className="border border-sky-400/30 bg-sky-500/10 p-4 text-sky-50">{TRANSPARENCY_STATEMENT}</p>
            <p className="text-sm text-slate-400">
              Status values may be Proposed, Submitted, Under Review, Approved, Active, Suspended, or Expired. Every
              institution starts as Proposed. Status never auto-promotes to Approved — an authorized administrator must
              record documented authorization.
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead>
                  <tr className="border-b border-slate-600 text-[10px] font-mono uppercase tracking-wider text-slate-400">
                    <th className="py-3 pr-3">Institution</th>
                    <th className="py-3 pr-3">Proposed relationship</th>
                    <th className="py-3 pr-3">Current status</th>
                    <th className="py-3 pr-3">Last verified</th>
                    <th className="py-3">Official website</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map((inst) => (
                    <tr key={`t-${inst.id}`} className="border-b border-slate-800 align-top">
                      <td className="py-3 pr-3 text-white">{inst.name}</td>
                      <td className="py-3 pr-3 text-slate-400">{inst.proposedRelationship}</td>
                      <td className="py-3 pr-3">
                        <StatusPill>{inst.status}</StatusPill>
                      </td>
                      <td className="py-3 pr-3 font-mono text-xs text-slate-500">{inst.lastVerifiedDate}</td>
                      <td className="py-3">
                        <a href={inst.website} className="text-sky-300 hover:underline" target="_blank" rel="noopener noreferrer">
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
            <p className="text-sm text-amber-100/90 border border-amber-400/30 bg-amber-500/5 p-4">{GOVERNANCE_POLICY_NOTE}</p>
            <div className="grid gap-3">
              {GOVERNANCE_SECTIONS.map((g) => (
                <article key={g.id} className="border border-slate-700/70 bg-slate-900/35 p-4">
                  <h3 className="text-white font-semibold text-sm mb-2">{g.title}</h3>
                  <p className="text-sm text-slate-400">{g.body}</p>
                </article>
              ))}
            </div>
          </Section>

          <Section id="inquiry" eyebrow="Contact" title="Institutional inquiry">
            <p>
              Organizations may request information about educational partnerships, curriculum review, community
              outreach, or the future food-shelf initiative. This form does not create a partnership.
            </p>
            <p className="text-sm text-amber-100/90">{INQUIRY_PRIVACY_NOTE}</p>
            <form onSubmit={submitInquiry} className="space-y-4 max-w-xl border border-slate-700/80 bg-slate-900/40 p-5">
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Name</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full bg-slate-950 border border-slate-600 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Organization</span>
                <input
                  required
                  value={form.organization}
                  onChange={(e) => setForm((f) => ({ ...f, organization: e.target.value }))}
                  className="mt-1 w-full bg-slate-950 border border-slate-600 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Business email</span>
                <input
                  required
                  type="email"
                  value={form.businessEmail}
                  onChange={(e) => setForm((f) => ({ ...f, businessEmail: e.target.value }))}
                  className="mt-1 w-full bg-slate-950 border border-slate-600 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Inquiry category</span>
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value as InquiryCategory }))}
                  className="mt-1 w-full bg-slate-950 border border-slate-600 px-3 py-2 text-sm outline-none focus:border-sky-400"
                >
                  {INQUIRY_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500">Message</span>
                <textarea
                  required
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  className="mt-1 w-full bg-slate-950 border border-slate-600 px-3 py-2 text-sm outline-none focus:border-sky-400"
                />
              </label>
              <button
                type="submit"
                disabled={formStatus === 'sending'}
                className="px-5 py-3 text-xs font-semibold uppercase tracking-widest bg-sky-400 text-slate-950 hover:bg-white disabled:opacity-60"
              >
                {formStatus === 'sending' ? 'Sending…' : 'Submit inquiry'}
              </button>
              {formStatus === 'ok' ? (
                <p className="text-sm text-emerald-300">Inquiry received. Thank you — an authorized reviewer can follow up.</p>
              ) : null}
              {formStatus === 'err' ? <p className="text-sm text-rose-300">{formError}</p> : null}
            </form>
          </Section>

          <footer className="border-t border-slate-700/70 pt-10 mt-8 space-y-4 text-sm text-slate-500">
            <p>
              Clear Path Community Outreach is associated with Clear Path Markets Science Corp. Route:{' '}
              <code className="text-slate-300">{COMMUNITY_OUTREACH_PATH}</code>. This page is public, free, and separate
              from the ClearPathTrader charting platform.
            </p>
            <PublicSiteLinks />
          </footer>
        </main>
      </div>
    </div>
  );
}
