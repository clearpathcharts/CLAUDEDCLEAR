# ClearPath founder workflows

Use these playbooks when the request matches. Always end with **what needs founder confirm**.

## 1. Social scheduling & cross-posting

1. Confirm platforms, theme, and date window.
2. Draft platform-native variants (do not paste one identical block everywhere).
3. Compliance pass: no financial advice, no FOMO/casino language, no unverified metrics.
4. Output a schedule table: platform | time (UTC) | copy | asset needed | status=`pending_approval`.
5. Stop until founder approves — then provide exact paste/schedule steps.

## 2. Email newsletter

1. Goal + audience segment.
2. Subject (3 options) + preview text + body.
3. One primary CTA to clearpathtrader.com (or specified path).
4. Compliance footer notes (educational only; not advice).
5. `pending_approval` until founder confirms send.

## 3. SEO & website monitoring

1. List URLs/pages in scope.
2. Check what can be verified in-repo or via local APIs (`/api/semantic/*`, pages, meta).
3. Report: indexation risks, broken internal links, thin/duplicate titles, performance suspects.
4. Rank/SERP claims only if live data exists; otherwise mark **Limited** and give on-page actions only.
5. Propose a max-5 fix list ordered by impact/effort.

## 4. Ad optimization

1. Restate objective (traffic, waitlist, education — never “guaranteed profit” framing).
2. Hypotheses + creative angles + audience notes.
3. Budget/bid changes as **recommendations only**.
4. Require explicit approval before any spend change copy is treated as executed.

## 5. Customer support routing

1. Classify: product bug, account, billing, education, moderation, crisis/distress.
2. Draft reply in ClearPath calm tone.
3. Route: Support handles drafts; Bug Triage if defect; Legal if claims/regulatory; human-only if distress/self-harm (no clinical auto-reply).
4. Deliver: suggested reply + destination queue + severity.

## 6. Crash / bug / performance monitoring

1. Capture symptom, environment, repro, severity (S0–S3).
2. Search likely code areas; propose minimal fix or instrumentation.
3. Tracking stub: title, steps, expected/actual, owner agent, release risk.
4. For production incidents: mitigation first, then root cause notes.

## 7. Marketing analytics dashboard narrative

1. Define the period and KPIs (traffic, engagement, conversion proxies, content output).
2. Separate facts vs interpretation.
3. 5-bullet digest + 1 recommended experiment.
4. Do not fabricate numbers — use placeholders `{{metric}}` when data is unavailable.

## 8. AI content drafting (blog / press / scripts)

1. Pick Blog Writer, Press Release Writer, or YouTube Producer.
2. Outline → draft → compliance pass.
3. Prefer linking into existing ClearPath education corpus when APIs/docs exist.
4. Ship as draft with sources listed.

## 9. Video transcription & translation

1. Transcribe (or clean a provided transcript).
2. Produce: cleaned transcript, timestamps if possible, summary, chapters, social clips list.
3. Translation: target languages listed by founder; keep financial disclaimers accurate; flag idioms that should stay English.
4. Knowledge Base Manager owns glossary consistency across languages.

## 10. Engineering ticket (build / refactor / debug / review)

1. Choose Junior vs Senior / React / JS-TS / etc.
2. Reproduce or state assumptions.
3. Smallest safe change; match repo patterns (`npm run lint`, tests if present).
4. Code Reviewer or Security Auditor when touching auth, payments, secrets, or public HTML.
5. Release Manager: changelog line + verify steps.

## 11. Daily founder briefing (CEO Assistant)

Produce one short brief:

```
# ClearPath daily ops
- Top 3 priorities
- Blockers needing you (max 3 yes/no decisions)
- Marketing status
- Product/eng status
- Support/risk flags
- Explicitly deferred
```

## Publishing handoff

When publishing pipelines exist:

- Prefer writing structured JSON batches for ClearPath Social OS or a human copy pack.
- Default `FORCE_HUMAN_REVIEW` mindset: nothing public ships without founder OK.
