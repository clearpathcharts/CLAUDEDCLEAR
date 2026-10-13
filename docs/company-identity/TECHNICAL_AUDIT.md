# ClearPathTrader — Technical Audit (Google identity & SEO foundation)

**Date:** 2026-10-12  
**Repository:** `C:\Users\forex\Downloads\clearpath-COMPLETE-tonight`  
**Production URL (canonical):** https://clearpathtrader.com  
**Audit scope:** Local inventory only — no deployment, no application code changes in this phase.

---

## 1. Application stack

| Item | Finding |
|------|---------|
| Framework | React 19 + Vite 6 SPA with Express server (`server.ts`) |
| Package name | `clear-path-markets-science` |
| Entry (dev) | `tsx server.ts` |
| Entry (prod) | `node dist/server.cjs` after `vite build` + esbuild bundle |
| Build baseline | **`npm run build` succeeded** on 2026-10-12 (~20s Vite, server bundle OK) |
| Mobile | Capacitor Android scripts present |

---

## 2. Routing architecture

- **Client routing:** Path-based in `src/App.tsx` (not React Router file-based routes for most pages).
- **Server-side SEO interceptor:** `server.ts` serves enriched static/crawl HTML for listed `SEO_PAGES` (bots and/or prerender paths).
- **Logged-in shell:** Most trader desks and `MeetTheBoard` live inside `Dashboard.tsx` after authentication — **not in the public SEO page list**.

---

## 3. Public pages relevant to Google Knowledge Panel

| URL | Purpose today | In `sitemap-pages.xml` | Bot/static enrichment |
|-----|---------------|------------------------|------------------------|
| `/` | Product home | Yes | Yes (`renderStaticHomeForBots`) |
| `/about` | Company manifesto / mission | Yes | Yes (`renderStaticAboutForBots`) |
| `/press`, `/press-kit` | Richard Floyd press kit (founder bio) | **No** | Yes (listed in `SEO_PAGES`) |
| `/faq` | FAQs + identity disambiguation | Yes | Yes |
| Dedicated `/founder` | — | **Missing** | — |
| Dedicated `/company` | — | **Missing** | — |
| Public `/leadership` or `/team` | — | **Missing** | — |

**Gap:** Founder story exists at `/press`, but the primary sitemap omits it, which weakens discovery and indexing priority for Rick’s entity.

---

## 4. SEO & structured data

**Central implementation:** `src/server/semanticDatabase.ts` + `enrichHtml()` in `server.ts`.

**Organization JSON-LD (site-wide):**

- `@type`: `Organization`
- `name`: ClearPathTrader
- `legalName`: Clear Path Markets Science
- `url`, `logo`, `description`, `knowsAbout`, `disambiguatingDescription`
- **`sameAs`: empty array** — no LinkedIn, Crunchbase, Wikidata, or social URLs wired for corroboration
- Comment in code: *“brand trust — no personal founder attribution”*

**Homepage extras:** `SoftwareApplication`, `FAQPage` (identity FAQs from `productIdentity.ts`).

**Person schema for Richard Floyd / Brent / Brian Weber:** **Not present** on public routes reviewed.

**Canonical URLs:** Derived per path in `semanticDatabase.ts`; `/about` covered by self-test (`scripts/about-manifesto.selftest.ts`).

**Sitemaps:** Index at `/sitemap.xml` with child sitemaps (pages, learn, guides, stocks, etc.). `robots.txt` served from `server.ts`.

**Helmet:** Client pages such as `PressKitPage.tsx` use `react-helmet-async` via `SEO` component for title/description/canonical.

---

## 5. Assets (logo & photography)

| Asset | Location | Notes |
|-------|----------|-------|
| Logo | `${baseUrl}/logo.png` in schema | Verify file in `public/` on deploy |
| Brand mark | `src/components/brand/BrandMark.tsx` references `clearpath-mark-128.png` | |
| Rick (approved in chat) | `docs/company-identity/approved-richard-floyd-founder.jpg` | **Not yet in `public/` for live URL** |
| Brent (gold tie, approved) | `docs/company-identity/approved-brent-gold-tie.jpg` | **Not yet in `public/`** |
| Brian Weber | `MeetTheBoard.tsx` uses external `postimg.cc` URL | Third chat image not supplied; existing CDN photo may still be official |

**In-app board UI (`MeetTheBoard.tsx`):** Rick uses a generic Unsplash stock portrait; Brent labeled **Brent Miller, COO** with different image URL — **not aligned** with approved names/titles/photos.

---

## 6. Leadership / board (technical exposure)

- **`MeetTheBoard`:** Only reachable inside authenticated `Dashboard` — **invisible to Google** as a public leadership page.
- **`BoardLoginTerminal`:** Maps `Brent Miller` and `Bryan Weber` (spelling) to internal codes — operational, not SEO.
- **Press kit:** Public, crawlable — **Rick only** (`src/content/pressKit.ts`, `PressKitPage.tsx`).

---

## 7. Tests & validation commands (existing)

| Command | Relevance |
|---------|-----------|
| `npm run build` | Release gate — **passed** |
| `npm run test:about-manifesto` | About page SEO/canonical |
| `npm run test:homepage-h1` | Homepage H1 |
| `npm run test:identity-risk` | Registration abuse — not Knowledge Panel |
| `npm run audit:crawl` | Internal crawl audit |
| Google Rich Results Test | Manual — after deploy |
| Search Console | External — requires domain verification (operator) |

---

## 8. Deployment (observed, not executed)

- Documented Cloud Run service name pattern: `clear-path-markets-science` (see `docs/cloud-run-two-paths.md`, `docs/multi-engine-seo.md`).
- CI/deploy not re-run in this audit.

---

## 9. Unknown / requires confirmation

- Legal entity jurisdiction, registration number, and official address for `Organization` schema `address` / `foundingDate`.
- Exact legal spelling: **Brian** vs **Bryan** Weber; **Brent** last name (Miller vs other); Brent title **CCO** vs code **COO**.
- Which local folder is the **single source of truth** for production deploy (Downloads copy vs GitHub vs AndroidStudioProjects).
- Whether Google Search Console is already verified for `clearpathtrader.com`.
- List of official social profiles to populate `sameAs`.

---

## 10. Summary

The site has **strong product-level SEO** (large sitemap, Organization schema, About, press kit content) but **weak person- and leadership-level signals** for Google Knowledge Panels: no public leadership page, no Person JSON-LD, empty `sameAs`, press URLs omitted from sitemap, and internal board data contradicts the Rick/Brent/Brian profile plan.

**Next stage (Implementation Plan):** Add public founder/company/leadership pages, align photos and titles, extend JSON-LD, fix sitemap, then Search Console + indexing + third-party citations — without guaranteeing a Knowledge Panel (Google decides).
