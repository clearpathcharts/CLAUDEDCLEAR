# Company Identity Registry

**Purpose:** Single registry of **verified vs unverified** facts for ClearPathTrader public identity.  
**Rule:** Do not treat unverified items as press-ready or schema-ready until confirmed.

---

## Brand & product (verified in repository)

| Field | Value | Source |
|-------|-------|--------|
| Consumer brand | ClearPath Trader / ClearPathTrader | `src/content/productIdentity.ts` |
| Legal / alternate name | Clear Path Markets Science Corp. (Delaware) | Founder confirmation 2026-10-12; align code `legalName` in schema when implementing |
| Canonical site | https://clearpathtrader.com | `PRODUCT_URL`, server SEO |
| Product category | Educational financial markets site (not a broker-dealer) | `productIdentity.ts`, `pressKit.ts` |
| Four desks | Institutional, Fundamental, Retail, Neurodivergent | `PRODUCT_FOUR_DESKS` |
| Disambiguation | Not a website chatbot; not unrelated “ClearPath” vendors | `PRODUCT_DISAMBIGUATION` |
| Press contact email | clearpathcharts@gmail.com | `pressKit.ts` |

---

## Mission (verified — paraphrased from in-repo copy)

- Reduce noise; charts and structured learning at the center.
- Accessibility and neurodivergent-friendly UX as product goals.
- Education and market intelligence — **not** investment advice; **not** custody.

Sources: `aboutManifesto.ts`, `pressKit.ts`, `productIdentity.ts`.

---

## Founder (verified in repository)

| Field | Value | Source |
|-------|-------|--------|
| Name | Richard Floyd (Richard A. Floyd in signature) | `pressKit.ts` |
| Role stated | Founder & CEO / founder of ClearPathTrader.com | `pressKit.ts`, `PressKitPage.tsx` |
| Public bio | Short + long sections in press kit | `pressKit.ts` |
| Public URL | https://clearpathtrader.com/press | `PressKitPage.tsx`, `SEO_PAGES` |
| Approved photo (2026-10-12) | `docs/company-identity/approved-richard-floyd-founder.jpg` | User-provided asset (chat) |

**Unverified externally:** Third-party articles, Wikipedia, Crunchbase, LinkedIn URL, awards, exact years of market experience beyond copy claims.

---

## Leadership (mixed — requires company confirmation)

User directive (2026-10-12 chat):

| Person | Stated role | Approved photo |
|--------|-------------|----------------|
| Richard Anthony Floyd | CEO, Founder, product builder | Magenta-hair executive portrait (file above) |
| Brent (first name only — **no public last name**) | Board of Directors; **CCO** (communications) | `approved-brent-gold-tie.jpg` — U.S. clearance contractor; do not publish surname |
| Brian Weber | **CFO** | `approved-brian-weber-black-pink-pineapple-tie.jpg` |

**In-app board (`MeetTheBoard.tsx`) — conflicts with user directive:**

| In-app name | In-app title | Image |
|-------------|--------------|-------|
| Richard Anthony | CEO | Unsplash stock (not approved founder photo) |
| Brent Miller | **COO** (not CCO) | postimg.cc (not gold-tie file) |
| Bryan Weber | CFO | postimg.cc WEBER3 |
| Dustin Shorr | CSTO | postimg.cc |

**Status:** Treat in-app board as **internal gamified portal**, not authoritative public identity, until reconciled.

---

## Customer communications (partial)

- Brent associated in user narrative with **telemarketing / communications** operation — **not documented in public press kit**; needs written job description approved by Brent before publishing.
- Brian Weber associated with **financial leadership** — aligns with CFO title in app; scope (controller, fundraising, compliance) **unverified**.

---

## Official public profiles (`sameAs`)

Organization schema currently: `"sameAs": []`.

### Social media policy (confirmed 2026-10-12, Rick)

- **Use on the website / JSON-LD:** official **business** profiles only.
- **Do not publish** Rick, Brent, or Brian’s **personal** Instagram (or other personal social) on leadership pages or `Person` schema — keep family life separate from the financial-markets brand.
- **Approved company profile:**
  - Instagram: https://www.instagram.com/clearpathtrader  
  - (Use clean URL without tracking params in code: `https://www.instagram.com/clearpathtrader`)

**Optional later (only if you create dedicated *professional* accounts — not personal):**

- LinkedIn company page
- LinkedIn or X for individuals (only with each person’s consent)
- YouTube official channel
- Business listings (Google Business Profile if applicable)

---

## Legal entity

| Item | Status |
|------|--------|
| Legal name (public) | **Clear Path Markets Science Corp.** (certificate: CLEAR PATH MARKETS SCIENCE CORP.) |
| DE file number | **10620130** (verified — **not on public site** until company is more established; founder 2026-10-12) |
| Public jurisdiction line | **Delaware corporation** (yes); file number (no) |
| State of incorporation | **Delaware** |
| Certificate filed (DE stamp) | **May 12, 2026** (see `DELAWARE_FILING_VERIFIED.md`) |
| Registered agent (private) | ZenBusiness Inc., Dover, DE — **not published on website** |
| Product / brand continuity | **~7 years** building ClearPath Trader (founder-stated; ~2019 origin narrative) |
| EIN / file number | **Do not publish** on consumer site unless counsel approves; not required for Organization JSON-LD |
| **Physical address on website** | **Policy: none** — education/fintech surface; no street address in HTML, footer, or schema `PostalAddress` (use jurisdiction-only fields if needed) |

### Due diligence note (2026-10-12)

Web search easily confuses unrelated entities (“Science Corp” SEC Form D, ClearPath.org, etc.) — **not** this company.  
**Verified:** Founder-supplied DE Certificate of Incorporation + file **10620130** (details in `DELAWARE_FILING_VERIFIED.md`; PDF in OneDrive).

---

## Company history

- **Founder-stated:** ClearPath Trader work ongoing **seven years**.
- **Certificate:** Delaware stock corp **filed May 12, 2026** (file 10620130).
- Verifiable from repo: active product development; Cloud Run deployment references; large SEO surface (~30k URLs per internal doc).
- **Not published:** office locations, registered-agent street address, headcount, funding (unless future press release).

---

## Naming consistency checklist

| Term | Preferred public form | Notes |
|------|----------------------|-------|
| Site | ClearPathTrader.com / clearpathtrader.com | |
| Product | ClearPath Trader | Space in display title |
| Legal | Clear Path Markets Science Corp. | Delaware; no street address on site |
| Brent (public) | **Brent** only | No last name on web, schema, or press |
| Founder | Richard Floyd / Richard Anthony Floyd | Confirm single canonical form for Person schema |
| CFO | **Brian Weber** (canonical) | In-app code still says “Bryan” — fix in Stage D |
