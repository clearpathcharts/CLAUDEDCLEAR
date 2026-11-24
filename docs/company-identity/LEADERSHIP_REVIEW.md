# Leadership Review — Rick, Brent, Brian

**Status:** Review only. No public profile changes were made in the audit phase.

---

## Richard Anthony Floyd

| Topic | Assessment |
|-------|------------|
| **Public presence today** | Strongest of the three: `/press` + `/press-kit` with full bio, facts block, founder statement |
| **Title in copy** | Founder & CEO (`pressKit.ts` signature) |
| **Photo** | Press page has no prominent headshot in component reviewed; approved founder photo stored under `docs/company-identity/` |
| **Google Person entity** | No `Person` JSON-LD; Organization schema deliberately omits founder link |
| **Confirm with Rick** | Canonical name string for schema (`Richard Floyd` vs `Richard Anthony Floyd`); whether to show large personal brand vs “product is the asset” (press kit already explains low social footprint) |

**Recommended public description (draft — use only after Rick approves):**  
Founder and CEO of ClearPath Trader (Clear Path Markets Science). Self-taught builder of an educational markets platform focused on chart clarity, structured learning, and neurodivergent-friendly design. Not a broker-dealer; platform provides analytics and education.

---

## Brent — Board / CCO (communications)

| Topic | Assessment |
|-------|------------|
| **Public name** | **“Brent” only** — no surname on website, JSON-LD, or press (U.S. security-clearance contractor; founder confirmed 2026-10-12) |
| **User-stated role** | Board of Directors; **Chief Communications Officer (CCO)**; customer communications leadership |
| **In-app representation** | `Brent Miller`, **COO** — **must not** leak to public pages; rename internal labels when convenient |
| **Public crawlable page** | **None** yet |
| **Approved photo** | Gold tie portrait — `docs/company-identity/approved-brent-gold-tie.jpg` |

**Still confirm with Brent (short OK):**

1. Public title **CCO** (not COO) on `/leadership`.
2. One paragraph bio scope (communications / member outreach — avoid sensitive clearance detail).
3. Comfort appearing on public leadership page with first name + photo only.

**Schema:** `Person` with `"name": "Brent"`, `"jobTitle": "Chief Communications Officer"`, `"worksFor"` → Organization — no `familyName`, no `sameAs` personal profiles.

---

## Brian Weber — CFO

| Topic | Assessment |
|-------|------------|
| **User-stated role** | Chief Financial Officer |
| **In-app representation** | `Bryan Weber`, CFO, postimg image — login-only |
| **Public crawlable page** | **None** |
| **Photo** | Approved edit: black tie with hot pink upside-down pineapples — `docs/company-identity/approved-brian-weber-black-pink-pineapple-tie.jpg` (original blue tie kept as reference PNG) |

**Flags requiring confirmation:**

1. Spelling: **Brian Weber** — confirmed by founder (2026-10-12). Update in-app “Bryan” strings when implementing public `/leadership`.
2. CFO capacity: employee, contractor, or advisory?
3. Regulated activities disclaimer (not providing investment advice; not a registered investment adviser unless true).
4. Public visibility preference.

---

## Dustin Shorr (in-app only)

Listed in `MeetTheBoard.tsx` as CSTO. Not part of the user’s Google profile request. Include in public leadership only if board confirms.

---

## Cross-leadership consistency matrix

| Field | Rick (target) | Brent (target) | Brian (target) | In-app board |
|-------|---------------|----------------|----------------|--------------|
| Public URL | `/press` (+ proposed `/founder`) | Missing | Missing | N/A (login) |
| Person schema | Missing | Missing | Missing | N/A |
| Photo | Approved file on disk | Approved file on disk | TBD | Mixed / stock |
| Title | CEO & Founder | CCO + Board | CFO | CEO / COO / CFO / CSTO |

---

## Approval gate

Before Stage D implementation, obtain **written OK** (email/doc) from each leader for:

- Display name and title  
- One paragraph bio  
- Headshot file  
- Whether they appear on public `/leadership`  

Rick can approve founder/company pages unilaterally for his own bio; Brent and Brian require explicit consent for public CFO/CCO pages.
