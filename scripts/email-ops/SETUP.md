# ClearPath Email Ops — Google Workspace + Sheets + Gmail + Gemini

Your recommended stack, wired for ClearPath member mail.

## What this folder gives you

| File | Purpose |
| --- | --- |
| `export-mailmerge-sheet.ts` | Pulls live Firestore members + invite passwords → CSV |
| `MailMerge.gs` | Paste into Google Sheets Apps Script → Gmail send |
| `templates/` | Starter subject/body copy (optional; export already fills defaults) |

CSV output lands in `data/email-ops/` (gitignored — contains temp passwords).

## One-time Google setup (15 minutes)

1. **Google Workspace or Gmail** signed in as the founder send address (e.g. your Workspace domain or Gmail).
2. Create a Sheet named **ClearPath Mail Merge**.
3. In Sheets: **Tools → Gemini** (or the Gemini side panel) — enable for drafting later.
4. Optional but recommended: install **Yet Another Mail Merge (YAMM)** from Google Workspace Marketplace if you prefer a UI over Apps Script. Our `MailMerge.gs` works without YAMM.

## Every campaign (repeatable)

### A) Export members from ClearPath

```powershell
npm run email:export-mailmerge
```

Opens/creates: `data/email-ops/clearpath-mailmerge-YYYY-MM-DD.csv`

### B) Import into Google Sheets

1. File → Import → Upload the CSV → Replace current sheet (or new tab **Members**).
2. Confirm columns: `email`, `firstName`, `subject`, `body`, `sendStatus`, etc.

### C) Use Gemini to refine copy (optional)

1. Open Gemini in the Sheet side panel.
2. Prompt example:

> For rows where tempPassword is not empty, rewrite column `body` in Rick Floyd's calm founder voice. Keep activateUrl and tempPassword exact. No financial advice. Under 180 words.

3. Or ask Gemini to rewrite only `subject` for a maintenance notice / thank-you / affiliate pitch.

### D) Send with Gmail mail merge

**Option 1 — Apps Script (included)**

1. Extensions → Apps Script → paste `MailMerge.gs` → Save
2. Reload Sheet → menu **ClearPath Mail**
3. **Dry run** first → then **Send mail merge (pending rows)**
4. `sendStatus` becomes `SENT …` automatically

**Option 2 — YAMM**

1. Open YAMM → select email + subject + body columns
2. Send as yourself from Gmail
3. Mark sent rows manually or let YAMM track

## Safety rules

- Never commit `data/email-ops/*.csv` (gitignored).
- Never paste temp passwords into Cursor chat, Discord, or group email CC.
- Use **BCC** only if you send one blast without merge; prefer 1:1 merge so each person gets their own password.
- Gmail daily send limits apply (~100–500/day personal; higher on Workspace). Pace big lists.
- After members log in, rotate/reset any temp passwords that were emailed.

## First campaign to run now

**Private Login restore** — export already builds subject/body for anyone with a `tempPassword`.

After that: maintenance notice, thank-you + affiliate pitch, using Gemini to rewrite `subject`/`body` columns only.
