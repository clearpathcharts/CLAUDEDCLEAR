/**
 * Crawlable mock pages for the 25-locale ClearPath vision.
 * Preview only — native copy packs, not browser translation widgets.
 */

import {
  CLEARPATH_DOMAIN,
  LANGUAGE_MOCK_INDEX_PATH,
  TOP_25_WORLD_LANGUAGES,
  getTop25Language,
  tierLabel,
  type Top25Language,
} from '../i18n/top25WorldLanguages';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const MOCK_BANNER = `<p class="mock-banner" role="status"><strong>Locale mock</strong> — native copy preview for <code>${escapeHtml(CLEARPATH_DOMAIN)}</code>. Not a machine translator. Production locales will ship as full outside + inside sites at each <code>productionPath</code>.</p>`;

const ARCHITECTURE = `<section>
<h2>How 25 sites on one domain</h2>
<ul>
  <li><strong>Domain:</strong> always <code>${escapeHtml(CLEARPATH_DOMAIN)}</code> (no separate TLDs in this plan).</li>
  <li><strong>Outside</strong> (marketing, SEO, education hubs): locale-prefixed URLs, e.g. <code>/es/</code> for Spanish.</li>
  <li><strong>Inside</strong> (terminal, desks, encyclopedia UI): same locale prefix + shared APIs; copy from locale message catalogs.</li>
  <li><strong>This mock:</strong> <code>${escapeHtml(LANGUAGE_MOCK_INDEX_PATH)}</code> and <code>${escapeHtml(LANGUAGE_MOCK_INDEX_PATH)}/:code</code> until each locale graduates.</li>
  <li><strong>hreflang:</strong> every locale page declares siblings + <code>x-default</code> (English).</li>
</ul>
</section>`;

function tierBadge(lang: Top25Language): string {
  const cls =
    lang.tier === 'priority'
      ? 'badge-priority'
      : lang.tier === 'regional-hub'
        ? 'badge-hub'
        : lang.tier === 'full-native'
          ? 'badge-native'
          : 'badge-mock';
  return `<span class="lang-badge ${cls}">${escapeHtml(tierLabel(lang.tier))}</span>`;
}

export function renderUnknownLanguageBody(pathClean: string): string {
  return `${MOCK_BANNER}
<h1>Language mock not found</h1>
<p class="lead">No locale mock matches <code>${escapeHtml(pathClean)}</code>. Browse the <a href="${LANGUAGE_MOCK_INDEX_PATH}">25-language mock index</a>.</p>
<p><a href="${LANGUAGE_MOCK_INDEX_PATH}">← All languages</a></p>`;
}

export function isUnknownLanguageMockPath(reqPath: string): boolean {
  const parts = (reqPath || '').toLowerCase().split('?')[0].replace(/\/$/, '').split('/').filter(Boolean);
  return parts[0] === 'languages' && parts.length === 2 && !getTop25Language(parts[1]);
}

export function renderLanguageWorldMockIndex(): string {
  const cards = TOP_25_WORLD_LANGUAGES.map((lang) => {
    const hub = lang.regionalHubPath
      ? `<p class="hub-link">Live hub: <a href="${lang.regionalHubPath}">${escapeHtml(lang.regionalHubPath)}</a></p>`
      : '';
    return `<li><a class="card" href="${lang.mockPath}" hreflang="${escapeHtml(lang.code)}">
  <div class="card-top">${tierBadge(lang)} <span class="rank">#${lang.speakerRank}</span></div>
  <h2>${escapeHtml(lang.endonym)} <span class="muted">(${escapeHtml(lang.labelEn)})</span></h2>
  <p class="site-title">${escapeHtml(lang.siteTitleNative)}</p>
  <p>${escapeHtml(lang.heroHeadline)}</p>
  <p class="url-mock"><code>https://${escapeHtml(CLEARPATH_DOMAIN)}${escapeHtml(lang.productionPath)}/</code></p>
  ${hub}
</a></li>`;
  }).join('\n');

  return `${MOCK_BANNER}
<h1>ClearPath Trader — 25 language mock world</h1>
<p class="lead">One brand, one domain (<strong>${escapeHtml(CLEARPATH_DOMAIN)}</strong>), twenty-five native-language experiences — outside marketing and inside terminal — built from real copy packs, not overlay translators.</p>
${ARCHITECTURE}
<h2>All locales (preview)</h2>
<ul class="card-list lang-grid">
${cards}
</ul>
<p><a href="/?live=1">Open English terminal (live SPA)</a> · <a href="/regions">Regional hubs (RU, CN, JP, PH)</a></p>`;
}

export function renderLanguageMockLocale(code: string): string | null {
  const lang = getTop25Language(code);
  if (!lang) return null;

  const dir = lang.direction === 'rtl' ? ' dir="rtl"' : '';
  const hubBlock = lang.regionalHubPath
    ? `<p>Existing regional hub: <a href="${lang.regionalHubPath}">${escapeHtml(lang.regionalHubPath)}</a> (SEO landing — this mock shows the future full-locale site shape).</p>`
    : '';

  const insidePreview = `<section class="inside-preview"${dir}>
<h2>Inside terminal (mock chrome)</h2>
<p class="muted">Sample nav labels — full desks, encyclopedia, and education will use the same locale catalog.</p>
<ul class="nav-mock">
  <li>${escapeHtml(lang.navInside.charts)}</li>
  <li>${escapeHtml(lang.navInside.education)}</li>
  <li>${escapeHtml(lang.navInside.encyclopedia)}</li>
  <li>${escapeHtml(lang.navInside.login)}</li>
</ul>
</section>`;

  const siblings = TOP_25_WORLD_LANGUAGES.filter((l) => l.code !== lang.code)
    .slice(0, 8)
    .map((l) => `<a href="${l.mockPath}" hreflang="${escapeHtml(l.code)}">${escapeHtml(l.endonym)}</a>`)
    .join(' · ');

  return `${MOCK_BANNER}
<article lang="${escapeHtml(lang.bcp47)}"${dir}>
<p><a href="${LANGUAGE_MOCK_INDEX_PATH}">← All 25 languages</a></p>
${tierBadge(lang)}
<h1>${escapeHtml(lang.heroHeadline)}</h1>
<p class="lead">${escapeHtml(lang.heroLead)}</p>
<div class="meta-grid">
  <div><span class="k">Site title</span><span class="v">${escapeHtml(lang.siteTitleNative)}</span></div>
  <div><span class="k">Production URL</span><span class="v"><code>/${escapeHtml(lang.code)}/</code></span></div>
  <div><span class="k">BCP 47</span><span class="v">${escapeHtml(lang.bcp47)}</span></div>
  <div><span class="k">Domain</span><span class="v">${escapeHtml(CLEARPATH_DOMAIN)}</span></div>
</div>
${hubBlock}
<h2>Outside (marketing mock)</h2>
<p>Each locale gets the same shape: native hero, native footer/legal, native education CTAs, and crawlable HTML — no browser translation overlay.</p>
${insidePreview}
<h2>Other locales</h2>
<p>${siblings} · <a href="${LANGUAGE_MOCK_INDEX_PATH}">View all 25</a></p>
<p><a class="btn-inline" href="/?live=1">Launch live terminal (English UI today)</a></p>
</article>`;
}

/** Extra CSS hooks for language mock pages (injected via contentPages PAGE_CSS extension). */
export const LANGUAGE_MOCK_PAGE_CSS = `
  .mock-banner { background: rgba(255, 193, 7, 0.12); border: 1px solid rgba(255, 193, 7, 0.35); border-radius: 10px; padding: 0.85rem 1rem; margin-bottom: 1.25rem; font-size: 0.88rem; }
  .mock-banner code { color: #ffe082; }
  .lang-grid .card .card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem; }
  .lang-badge { font-size: 0.62rem; letter-spacing: 0.1em; text-transform: uppercase; padding: 0.2rem 0.45rem; border-radius: 6px; font-weight: 800; }
  .badge-priority { background: rgba(0, 229, 255, 0.2); color: #00e5ff; }
  .badge-hub { background: rgba(76, 175, 80, 0.2); color: #a5d6a7; }
  .badge-native { background: rgba(255, 255, 255, 0.12); color: #fff; }
  .badge-mock { background: rgba(255, 255, 255, 0.06); color: rgba(255,255,255,0.55); }
  .rank { font-size: 0.7rem; color: rgba(255,255,255,0.4); }
  .site-title { font-weight: 800; color: #00e5ff; }
  .url-mock { font-size: 0.75rem; opacity: 0.85; }
  .hub-link { font-size: 0.78rem; margin-top: 0.35rem; }
  .muted { color: rgba(255,255,255,0.5); font-weight: 400; }
  .inside-preview { border: 1px dashed rgba(0,229,255,0.35); border-radius: 12px; padding: 1rem 1.1rem; margin: 1.25rem 0; }
  .nav-mock { display: flex; flex-wrap: wrap; gap: 0.5rem; list-style: none; padding: 0; margin: 0.75rem 0 0; }
  .nav-mock li { background: rgba(0,229,255,0.1); border: 1px solid rgba(0,229,255,0.25); padding: 0.4rem 0.75rem; border-radius: 8px; font-size: 0.8rem; font-weight: 700; }
  a.btn-inline { display: inline-block; margin-top: 0.5rem; color: #00e5ff; font-weight: 800; }
`;

export function languageMockHtmlLang(pathClean: string): string {
  const parts = pathClean.split('/').filter(Boolean);
  if (parts[0] === 'languages' && parts.length === 2) {
    return getTop25Language(parts[1])?.bcp47.split('-')[0] || 'en';
  }
  return 'en';
}
