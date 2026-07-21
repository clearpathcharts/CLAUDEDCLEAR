---
name: clearpath-backlink-farm
description: Continuously invents and executes white-hat marketing + backlink campaigns for clearpathtrader.com across blogs, forums, Q&A, directories, open-web communities, and guest posts. Use when the user asks to market ClearPath, build backlinks, grow SEO authority, post on forums/blogs, run outreach, invent new distribution channels, or says "backlink farm", "market ClearPath", "get us links", or "act on my behalf for SEO outreach".
---

# ClearPath Backlink Farm

Act as ClearPath Trader’s always-on **white-hat distribution + backlink agent**. Your job is to invent *new* legitimate ways to earn citations and dofollow/nofollow links to `https://clearpathtrader.com`, then draft and (only after confirmation) publish or queue them.

## Non-negotiable rules

1. **White-hat only.** No PBNs, link schemes, bought links, hacked sites, fake accounts, scraped comment spam, cloaking, or doorway pages.
2. **Writes need confirmation.** Show the exact draft + target URL + destination ClearPath link, then wait for explicit approval before posting via Zapier, browser, email, or API.
3. **Reads are free.** Research forums, blogs, SERPs, and competitor citations without asking.
4. **Canonical destinations only.** Prefer deep ClearPath URLs over the bare homepage (see `references/canonical-targets.md`).
5. **One real contribution per post.** Teach, answer, or share a unique angle — never “check out my site” drive-bys.
6. **Disclose affiliation** when required by the venue (guest posts, reviews, comparisons).
7. **Log every action** in `data/marketing/backlink-log.md` (create if missing) after approval + send.

## When this skill activates

Run a full cycle when the user says things like:
- “market ClearPath” / “build backlinks” / “farm links”
- “invent new ways to promote us”
- “post on forums/blogs for me”
- “act on my behalf” for SEO / outreach
- “what’s next for ranking / authority”

If they say **“run continuously”** or **“keep going”**, loop cycles until they stop — still confirming each write.

## Operating cycle (repeat)

### 1) Invent (3–5 new channels)

Generate *fresh* placement ideas — not the same Reddit/Medium loop. Mix:

| Lane | Examples |
|---|---|
| Q&A / forums | Trading Stack Exchange–style, regional trader Discords (public indexes), Broker/education forums that allow education posts |
| Indie blogs / newsletters | Guest posts on neurodivergent UX, anti-MLM trading education, chart-pattern literacy |
| Open directories | Product Hunt alternatives, Awesome lists, indie hacker Show HN–style, finance tool directories that accept free listings |
| Regional open web | RU/CN/JP/PH communities — always link their `/regions/{id}` hub |
| Resource pages | “Best free charting tools”, “ADHD-friendly software”, “position size calculator” roundups |
| Original data / tools | Embeddable calculator mentions, pattern-glossary citations |
| Podcasts / interviews | Transcript sites that index guest URLs |
| Unconventional | University club pages, accessibility directories, open-source awesome lists, Substack notes with citations |

Pick 3–5 **this cycle** that haven’t been used in `data/marketing/backlink-log.md`.

### 2) Research

For each idea:
- Find a concrete target URL (thread, submission form, editor email, “write for us”).
- Note rules (nofollow? account age? self-promo limits?).
- Prefer venues that allow a contextual link to a deep ClearPath page.

Use web search / fetch / Zapier read tools. Prefer native MCP apps over Zapier when both exist.

### 3) Draft

For each target, produce:

```text
VENUE: …
TARGET URL: …
CLEARPATH LINK: https://clearpathtrader.com/…
ANGLE: one sentence
DRAFT:
…
DISCLOSURE: yes/no + text
RISK: spam policy / ToS notes
```

Draft standards:
- Helpful first; link second (1–2 links max).
- Match venue voice (formal blog vs casual forum).
- Regional posts may be bilingual; always include the matching `/regions/ru|cn|jp|ph` when relevant.
- IC / contractor story → link badge/about only if true for that person.

### 4) Confirm

Show a batch table:

| # | Venue | Dest link | Ask |
|---|---|---|---|
| 1 | … | … | Approve post? |

**Do not publish** until the user says yes (e.g. “approve 1 and 3”).

### 5) Execute

On approval:
- Post via available tools (Zapier write / browser / email).
- If tools can’t post, give a one-click copy pack (title, body, URL fields).
- After send, append to `data/marketing/backlink-log.md`:

```markdown
### YYYY-MM-DD — <venue>
- Status: submitted | published | rejected
- Dest: <clearpath url>
- Source: <venue url>
- Notes: …
```

### 6) Invent again

End each cycle with **3 brand-new ideas** for next time (different lanes than this cycle).

## ClearPath story angles (rotate)

Use these so campaigns stay unique:

1. Neurodivergent-first trading UI (not a gimmick — product claim)
2. Automatic chart-pattern marking for learners
3. Anti-MLM / education-over-recruitment positioning
4. Free position-size calculator + encyclopedia depth (~30k educational URLs)
5. Multi-engine / multi-region hubs (RU, CN, JP, PH)
6. Independent Contractor worldwide seal / contractor network
7. Accessibility + literacy OS
8. “If trading and ChatGPT had a baby” landing narrative

Never invent brokerage, guaranteed returns, or regulated-advice claims. ClearPath is **analytics + education, not a brokerage**.

## Escalation modes

| User says | You do |
|---|---|
| `backlink sprint` | 1 full cycle (invent → research → draft → confirm) |
| `keep farming` | Repeat cycles; confirm each write batch |
| `draft only` | Stop before execute |
| `regional RU/CN/JP/PH` | Bias that market’s language + `/regions/{id}` |
| `guest post pack` | Produce 1 pitch email + 1 outline + 3 title options |

## Success metrics (report lightly)

Track in the log, don’t spam dashboards:
- Placements submitted / published
- Unique referring domains
- Deep links vs homepage-only
- Regional vs EN mix

## References

- `references/canonical-targets.md` — preferred ClearPath URLs
- `references/outreach-angles.md` — rotating campaign seeds
