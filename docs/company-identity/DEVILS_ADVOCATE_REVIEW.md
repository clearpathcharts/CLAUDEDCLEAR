# Devil's Advocate Review

Each issue: **risk → recommendation → acceptance test**

---

## 1. Expecting a guaranteed Google Knowledge Panel

**Risk:** Paid “KP services” or over-built schema cannot force Google to show a panel.  
**Recommendation:** Treat the bullet list as **necessary foundation**, not an outcome contract.  
**Test:** Document in public copy that panels are algorithmic; success metric = indexed URLs + Rich Results validity + branded SERP improvement over 90 days.

---

## 2. Organization schema without founder linkage

**Risk:** Google connects company to Rick via weak signals; competitors named “ClearPath” pollute entity resolution.  
**Recommendation:** Add `founder` / key `employee` Person nodes with `@id` URLs on `/founder` and `/leadership`, linked from Organization. Keep disambiguation text.  
**Test:** Rich Results Test on `/` and `/company` shows connected Organization + Person without errors.

---

## 3. Empty `sameAs`

**Risk:** No corroborating official profiles → low trust for Knowledge Graph eligibility.  
**Recommendation:** Populate only **live, controlled** URLs; never invent profiles.  
**Test:** Manual check each URL returns 200 and matches name/title; schema validator passes.

---

## 4. `/press` omitted from sitemap

**Risk:** Founder page under-crawled relative to `/about`.  
**Recommendation:** Add `/press` (and `/press-kit` canonical alias if needed) to `sitemap-pages.xml` with monthly changefreq.  
**Test:** Fetch production `sitemap-pages.xml` contains `/press`; Search Console URL inspection shows “Submitted sitemap”.

---

## 5. Leadership only behind login

**Risk:** Google cannot verify Brent or Brian as executives; user goal for three profiles fails.  
**Recommendation:** New public `/leadership` with bios, photos, mailto or contact routing — separate from board passcode portal.  
**Test:** `curl -A Googlebot` returns 200 HTML with names/titles in body; no login redirect.

---

## 6. Title and name contradictions (COO vs CCO, Bryan vs Brian, Brent Miller)

**Risk:** Knowledge Panel shows wrong person or triggers misinformation reports.  
**Recommendation:** Freeze titles in `docs/company-identity/COMPANY_IDENTITY_REGISTRY.md` after signatures; single source module e.g. `src/content/leadershipPublic.ts`. Public Brent = **first name only** (clearance privacy).  
**Test:** Grep production build for old strings (`Brent Miller`, `COO`) on public routes returns zero.

---

## 6b. Publishing a registered-agent or office address

**Risk:** Unwanted mail, security exposure; not required for an education SaaS narrative.  
**Recommendation:** No `PostalAddress` on public pages; Organization schema may use `foundingLocation` / legal name / `areaServed` without street line. Registered agent address stays in Delaware filings only.  
**Test:** View-source on `/company` and `/` — no street address in HTML or JSON-LD.

---

## 7. Stock / wrong photography

**Risk:** Misrepresentation; press reuse of incorrect likeness.  
**Recommendation:** Copy approved JPGs to `public/team/` with predictable URLs; use in press + leadership pages.  
**Test:** Lighthouse/accessibility alt text present; URLs match JSON-LD `image`.

---

## 8. Over-claiming in bios (25+ years, medical, board seats)

**Risk:** Defamation/regulatory scrutiny if overstated; Google demotion if contradicted externally.  
**Recommendation:** Keep claims aligned with `pressKit.ts` for Rick; new bios for Brent/Brian should be conservative and approved.  
**Test:** Legal/compliance read for CFO/CCO claims before publish.

---

## 9. Duplicate founder story paths

**Risk:** `/press`, proposed `/founder`, and `/about` compete for “Rick” query.  
**Recommendation:** One **canonical** founder URL (`/founder` or `/press`); other pages link with rel canonical or clear purpose split (press vs story).  
**Test:** Only one URL has `Person` primary `@id`; others use `mainEntityOfPage` or omit duplicate Person.

---

## 10. Board passcode terminal on public site

**Risk:** Scrapers or social screenshots imply fake “executive login” gimmick hurts EEAT.  
**Recommendation:** Keep gamified board inside app; public leadership is professional static page.  
**Test:** Public crawl does not expose passcode hints or fake executive stock photos.

---

## 11. Workspace / repo confusion

**Risk:** Edits in Cursor temp folder while production deploys from GitHub.  
**Recommendation:** Designate `clearpath-COMPLETE-tonight` or git remote as canonical; backup before Stage D.  
**Test:** `git remote -v` matches deploy pipeline; one backup folder dated.

---

## 12. Search Console & indexing not operator-verified

**Risk:** Schema changes never indexed.  
**Recommendation:** Rick verifies GSC; request indexing for home, about, press, new pages.  
**Test:** GSC “Page indexing” shows indexed for each target URL within ~2 weeks (not guaranteed same-day).

---

## 13. Third-party press before on-site foundation

**Risk:** Articles point to thin or inconsistent pages.  
**Recommendation:** Ship on-site pages + schema **first** (your recommended order).  
**Test:** Press pitch links resolve to live leadership/founder URLs with matching titles.

---

## 14. Privacy

**Risk:** Publishing board members without consent; leaking emails in schema.  
**Recommendation:** Public contact = role-based or press email only unless individual opts in.  
**Test:** No personal phone/home address in JSON-LD or HTML.

---

## 15. Scope creep (rebuild app, new paid agents)

**Risk:** Cost and regression.  
**Recommendation:** Stage D = small content routes + schema + sitemap + assets only.  
**Test:** `npm run build` + targeted self-tests pass; diff stays under agreed file list.
