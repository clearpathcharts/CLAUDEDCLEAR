# Evidence Ledger

Tracks **sources** Google and journalists can use to corroborate ClearPathTrader and its leaders.  
Legend: ✅ Present · ⚠️ Partial · ❌ Missing · 🔒 Internal only

---

## On-site (clearpathtrader.com)

| Evidence | URL / location | Status | Notes |
|----------|----------------|--------|-------|
| Organization JSON-LD | Injected on enriched pages | ✅ | `semanticDatabase.ts`; `sameAs` empty |
| Product identity FAQs | Homepage / FAQ schema | ✅ | Disambiguation from other “ClearPath” products |
| About / mission | `/about` | ✅ | In sitemap |
| Founder press kit | `/press`, `/press-kit` | ⚠️ | Public + SEO interceptor; **not in sitemap-pages.xml** |
| Founder headshot at stable URL | — | ❌ | Approved JPG only in `docs/company-identity/` |
| Company profile page | — | ❌ | Proposed `/company` |
| Leadership team page | — | ❌ | Proposed `/leadership` |
| Person JSON-LD (Rick) | — | ❌ | |
| Person JSON-LD (Brent, Brian) | — | ❌ | |
| Logo at schema URL | `/logo.png` | ⚠️ | Referenced in schema — verify on production |
| Sitemap | `/sitemap.xml` | ✅ | Press URLs should be added |
| robots.txt | `/robots.txt` | ✅ | |

---

## Delaware incorporation (verified 2026-10-12)

| Evidence | Location | Public? |
|----------|----------|---------|
| Certificate PDF | `OneDrive\Documents\Clear Path Markets Science Corp. - DE Filing Evidence (1).pdf` | **No** — internal; contains private addresses |
| Review PNG | `docs/company-identity/de-filing-evidence-page1.png` | **No** — do not commit/deploy to public repos |
| File number | **10620130** | **Internal only** — not on clearpathtrader.com until established |
| Verified summary | `docs/company-identity/DELAWARE_FILING_VERIFIED.md` | Operators only |

---

## Local artifacts (not public until deployed)

| Artifact | Path |
|----------|------|
| Brent — gold tie headshot | `docs/company-identity/approved-brent-gold-tie.jpg` |
| Richard Floyd — founder headshot | `docs/company-identity/approved-richard-floyd-founder.jpg` |
| Brian Weber — CFO headshot (black tie, hot pink upside-down pineapples) | `docs/company-identity/approved-brian-weber-black-pink-pineapple-tie.jpg` |
| Brian Weber — original (blue/green tie, reference only) | `docs/company-identity/approved-brian-weber-original-blue-tie.png` |
| Audit reports | `docs/company-identity/*.md` |
| Audit instruction | `CLEARPATHTRADER_LOCAL_AUDIT.txt` |

---

## In-application (not Google evidence)

| Item | Location | Status |
|------|----------|--------|
| Meet the Board | `Dashboard` → `MeetTheBoard` | 🔒 Login required |
| Board passcodes | `BoardLoginTerminal.tsx` | 🔒 Operational |
| CEO dashboard | `/ceo` founder gate | 🔒 Founder only |

---

## Third-party (status unknown — fill as created)

| Channel | Status | Action |
|---------|--------|--------|
| Google Search Console | ❓ | Verify property; submit sitemap |
| Google Business Profile | ❓ | Usually N/A for pure SaaS/education — confirm strategy |
| LinkedIn Company Page | ❓ | Add to `sameAs` when live |
| Instagram (company) | ✅ URL known | https://www.instagram.com/clearpathtrader — wire into Organization `sameAs` only |
| Personal social (Rick, Brent, Brian) | 🔒 Intentionally omitted | Family privacy — not on public site/schema |
| LinkedIn personal (Rick, Brent, Brian) | ❓ | Optional later; professional accounts only if you want |
| Crunchbase / PitchBook | ❓ | Optional |
| Press / fintech media | ❓ | Per bullet list — interviews, bylines |
| Wikipedia / Wikidata | ❓ | Typically requires sustained independent coverage |

---

## Build & test evidence (this audit)

| Check | Result | When |
|-------|--------|------|
| `npm run build` | Pass | 2026-10-12 |
| `npm run test:about-manifesto` | Not run | Run before next deploy |
| Rich Results Test | Not run | After Person/Organization changes on staging/prod |

---

## Contradictions to resolve (evidence quality)

1. **Brent:** CCO + user photo vs COO + Miller + different image in app.  
2. **Brian/Bryan:** Spelling across user message vs code.  
3. **Rick:** Rich press bio vs Organization schema with no `founder` / `employee` link.  
4. **Press in sitemap:** Crawlers may under-prioritize `/press` vs `/about`.

---

## Target state (for Knowledge Panel *eligibility*, not guarantee)

Minimum independent corroboration set:

1. Three stable on-site URLs: **company**, **founder**, **leadership** (or combined leadership with anchors).  
2. Organization + Person JSON-LD with consistent `@id` graph.  
3. `sameAs` with at least 2–3 **official** profiles per entity.  
4. 2+ **independent** media or industry mentions naming Rick as founder and company by name.  
5. Search Console verified; URLs indexed; Rich Results Test clean.
