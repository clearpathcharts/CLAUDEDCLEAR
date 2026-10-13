# Implementation Plan — Google profiles for Rick, Brent, Brian

**Can we complete?**  
**Yes — the foundation and audit are completable on your PC.** A Knowledge Panel for each person is **not** completable on demand; Google decides. This plan gets you to **maximum eligible signals** in the order you specified.

**Canonical local project (2026-10-12):**  
`C:\Users\forex\Downloads\clearpath-COMPLETE-tonight`  
(baseline build passed; audit docs in `docs/company-identity/`)

**Before Stage D:** Copy or re-open this folder in Cursor; optional backup e.g. `C:\ClearPathTrader_Backup_2026-10-12`.

---

## Stage A — Inspect ✅ (done)

See `TECHNICAL_AUDIT.md`.

---

## Stage B — Document ✅ (done)

Registry, leadership review, evidence ledger, devil's advocate — this folder.

---

## Stage C — Challenge ✅ (done)

See `DEVILS_ADVOCATE_REVIEW.md`. **Blockers for implementation:**

| ID | Decision needed | Owner |
|----|-----------------|-------|
| D1 | Brent public identity | **First name only** (no surname); title **CCO** + Board; short bio still needs Brent’s OK |
| D2 | Brian vs **Bryan** Weber + CFO bio + photo | **Brian Weber** confirmed; photo approved (black/pink pineapple tie) — CFO bio still needs Brian’s OK |
| D3 | Official `sameAs` URLs | **Company Instagram only:** https://www.instagram.com/clearpathtrader — **no personal IG** on site/schema for Rick/Brent/Brian (family privacy). Add LinkedIn etc. only if/when you choose separate professional accounts |
| D4 | Legal entity in schema | **Clear Path Markets Science Corp.**, DE file **10620130**, **`foundingDate`: 2026-05-12** (certificate); **~7 years** product narrative; **no street address** on site or schema (agent/incorporator addresses stay private) |
| D5 | Canonical founder URL (see below) | Rick — recommendation: **keep `/press`**, skip extra `/founder` unless you want two URLs |

### What “#5” (D5) means — in plain English

Google works best when **one main link** is “the official Richard Floyd / founder page.” You already have that: **`https://clearpathtrader.com/press`** (press kit + bio).

The only question was whether to **also** create **`/founder`** as a second page with the same story. That can split Google’s attention between two URLs.

**Recommendation:** Treat **`/press` as the founder page** — add it to the sitemap, link it from About and Leadership, and **don’t add `/founder`** unless you want a shorter URL for cards and billboards. Not required for Knowledge Panel work.

---

## Stage D — Implement (one PR-sized batch at a time)

### D-1 Assets (low risk)

1. Copy approved photos to `public/team/richard-floyd.jpg`, `public/team/brent.jpg` (and `brian-weber.jpg` when approved).
2. Confirm `public/logo.png` matches Organization schema.

**Acceptance:** URLs `https://clearpathtrader.com/team/*.jpg` return 200 on production.

### D-2 Public pages

| Page | Content |
|------|---------|
| `/founder` | Rick bio (reuse `PRESS_KIT`), headshot, link to press kit |
| `/company` | Mission, product summary from `productIdentity.ts`, legal name, **“Delaware corporation”** (no DE file number on page yet), disclaimers |
| `/leadership` | Rick, Brent, Brian — name, title, photo, 1 paragraph each |

Wire routes in `App.tsx`, static/bot paths in `contentPages.ts` + `SEO_PAGES`, mirror `PressKitPage` patterns.

**Acceptance:** No login wall; `npm run build` pass; new self-test or extend `about-manifesto` pattern for canonical tags.

### D-3 Structured data

In `semanticDatabase.ts` (or dedicated `leadershipSchema.ts`):

- Organization: add `founder` → Person `@id` for Rick; optional `employee` for officers.
- Person entities for Rick, Brent, Brian with `jobTitle`, `worksFor`, `image`, `url`.
- Fill `sameAs` from D3 decision table only.

**Acceptance:** [Rich Results Test](https://search.google.com/test/rich-results) — no critical errors on `/`, `/company`, `/founder`, `/leadership`.

### D-4 Sitemap & internal links

- Add `/press`, `/founder`, `/company`, `/leadership` to `sitemap-pages.xml` block in `server.ts`.
- Footer/nav links from `/`, `/about`, `/press` to leadership and company.

**Acceptance:** Production sitemap includes URLs; internal links visible in static HTML for bots.

### D-5 Align in-app board (optional, separate batch)

Update `MeetTheBoard.tsx` names/titles/photos to match public `/leadership` **or** add disclaimer that in-app board is fictionalized access control.

**Acceptance:** No conflicting titles between public HTML and dashboard.

---

## Stage E — Test

```powershell
cd C:\Users\forex\Downloads\clearpath-COMPLETE-tonight
npm run build
npm run test:about-manifesto
# add: npm run test:leadership-seo  (new script recommended)
npm run audit:crawl
```

Manual: Rich Results Test; view-source on bot HTML for JSON-LD.

---

## Stage F — Review

Re-read `DEVILS_ADVOCATE_REVIEW.md` against the diff. Confirm Brent/Brian approved bios.

---

## Stage G — Publish (Rick authorizes)

Deploy via existing Cloud Run / Cloud Build path. Then:

1. [Google Search Console](https://search.google.com/search-console/) — verify domain if not done.
2. Submit `https://clearpathtrader.com/sitemap.xml`.
3. Request indexing: `/`, `/about`, `/company`, `/founder`, `/leadership`, `/press`.
4. Monitor queries: `Richard Floyd ClearPath`, `ClearPath Trader`, `Brian Weber ClearPath`, etc.

---

## Off-site (parallel, after D-2–D-4 live)

- Create/match LinkedIn profiles to on-site titles.
- Pitch fintech/education outlets (use `pressKit.ts`).
- Never pay for “guaranteed Knowledge Panel.”

---

## Mapping to your bullet list

| Bullet | Status |
|--------|--------|
| Founder page for Rick | ⚠️ Partial (`/press` exists; add `/founder` + photo + sitemap) |
| Company profile page | ❌ → `/company` |
| JSON-LD company + founder | ⚠️ Org only; add Person + links |
| Founder photo + logo | ⚠️ Files local; not on public URLs |
| Credible founder biography | ✅ In `pressKit.ts` |
| About Us | ✅ `/about` |
| Search Console + sitemap + indexing | ❓ Operator steps post-deploy |
| Consistent social profiles | ❌ `sameAs` empty |
| Official professional profiles | ❓ Out of repo |
| Press coverage | ❓ Ongoing |
| Independent references | ❌ Build after site |
| Rich Results Test | After D-3 |
| Monitor / correct SERP | Ongoing |
| Avoid KP guarantee vendors | Policy ✅ |

---

## Estimated effort (local, no new paid agents)

| Batch | Effort |
|-------|--------|
| D-1 assets | ~30 min |
| D-2 pages | 2–4 hours |
| D-3 schema | 1–2 hours |
| D-4 sitemap/links | ~1 hour |
| GSC + indexing | ~30 min operator |

Knowledge Panel appearance: **weeks to months**, depends on authority and third-party citations.

---

## Next action for Rick

1. Open `C:\Users\forex\Downloads\clearpath-COMPLETE-tonight` in Cursor (workspace temp path was empty).  
2. Resolve decisions **D1–D5** in `LEADERSHIP_REVIEW.md`.  
3. Say **“Proceed Stage D”** when ready — implementation can start in controlled batches without autonomous agent runs.
