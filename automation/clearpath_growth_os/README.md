# ClearPath Growth OS (CrewAI)

An autonomous growth engine for **ClearPath Trader**, built as a
[CrewAI **Flow**](https://docs.crewai.com/concepts/flows) that orchestrates
three **Crews**. It turns the product's own APIs (`server.ts`) into a daily
`research → content → compliance → distribution` pipeline.

It is the first production flow described in the growth strategy: lead with the
*brain-first, all-in-one, not-a-broker* wedge, ground everything in owned
content, and never ship a claim the brand can't back up.

## What it does

```
gather_intelligence   Macro Intelligence crew  → grounded morning brief + 3 teachable moments
      ↓
produce_content       Content Factory crew     → platform-native batch (X, LinkedIn, TikTok/Reels, IG)
      ↓
enforce_compliance    Compliance Guardian crew → audits against the Engineering Constitution
      ↓ (router)
approved → publish_batch      writes output/growth_batch_<date>.json for Zapier hand-off
needs_revision → flag_for_revision   writes output/growth_flags_<date>.json
```

State is persisted across steps via a Pydantic model (`GrowthState`) so every
run is auditable. When `FORCE_HUMAN_REVIEW=true` (default), approved batches are
written as `pending_human_review` — nothing auto-publishes during the trust
window.

## Crews & agents

| Crew | Agents | Grounded by |
| --- | --- | --- |
| **Macro Intelligence** | Macro Sentinel, Education Translator | `/api/news/search`, `/api/fred/observations`, `/api/quote`, `/api/semantic/content` |
| **Content Factory** | Hook Engineer, Thread Architect, CTA/SEO Router | `/api/semantic/content`, `/api/semantic/faqs`, `/api/semantic/link` |
| **Compliance Guardian** | Truth & Compliance Auditor | `/api/semantic/faqs`, `/api/semantic/content` |

## Tools (wrap real ClearPath APIs)

Defined in `src/clearpath_growth_os/tools.py`, backed by the dependency-free
HTTP client in `clearpath_client.py`:

- `fetch_education_corpus` → `GET /api/semantic/content`
- `fetch_faqs` → `GET /api/semantic/faqs`
- `auto_internal_link` → `POST /api/semantic/link`
- `search_finance_news` → `GET /api/news/search`
- `fetch_macro_series` → `GET /api/fred/observations`
- `fetch_quote` → `GET /api/quote`

## Setup

```bash
cd automation/clearpath_growth_os
cp .env.example .env          # add OPENAI_API_KEY (or your provider); set CLEARPATH_API_BASE

# Option A: pip
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# Option B: CrewAI CLI (reads pyproject.toml)
pip install crewai
crewai install
```

## Run

Start the ClearPath server first (from the repo root: `npm run dev`), then:

```bash
# Smoke-test the API plumbing only (no LLM key needed):
CLEARPATH_API_BASE=http://localhost:3000 python scripts/smoke_test.py

# Visualise the flow graph (no LLM key needed):
python -m clearpath_growth_os.main  # or: crewai flow plot

# Full run (needs an LLM key):
crewai flow kickoff
# or
python -m clearpath_growth_os.main
```

Output lands in `output/growth_batch_<date>.json` (approved) or
`output/growth_flags_<date>.json` (blocked by compliance).

## Zapier / scheduler hand-off

The flow **never posts directly**. It writes an approved JSON batch; wire that
file (or the `publish_batch` return value) into Zapier MCP to fan out to X,
LinkedIn, Buffer, email, or your CRM after a human approves. This keeps the
board-governed brand in control during the initial trust window.

## 30-Day "Plant the Flag" phase

`plant_the_flag.py` is the concrete system for the 30-day launch phase: daily
omnipresence on 3 channels, a seeded SEO farm, founding distribution, and a
compliant scarcity loop — all tracked against the phase KPIs.

```
build_daily_plan   deterministic planner (no LLM) — decides the day's exact output
      ↓
gather_intelligence   Macro Intelligence crew  → grounded brief + teachable moments
      ↓
produce_omnipresence  Daily Omnipresence crew  → X pack (3-4 posts + thread), LinkedIn post, 1-2 short-form scripts
      ↓
produce_seo           SEO Farm crew  → pillar article + 8-10 supporting posts  (Mon/Wed/Fri only)
      ↓
produce_seeding       Seeding crew   → value-first Reddit/Quora answers          (Tue/Thu only)
      ↓
enforce_compliance    Compliance Guardian crew
      ↓ (router)
approved → publish_day  → output/plant_the_flag_<date>.json + output/plant_the_flag_kpi.json
needs_revision → flag_day → output/plant_the_flag_flags_<date>.json
```

### Deterministic core (unit-tested, no LLM)

| Module | Responsibility |
| --- | --- |
| `campaign.py` | Pillars + clusters, long-tail keywords, per-channel cadence, country caps, KPI targets |
| `planner.py` | `build_daily_plan(run_date, phase_start)` → exactly what ships today (reproducible) |
| `scarcity.py` | Compliant "spots left" — emits a number ONLY with a real registered count |
| `kpi.py` | Rolls up daily batches vs the 90 articles / 300 posts / 2-5k signups / 50k video targets |

### Scarcity loop (compliant)

The "4,218 spots left in Brazil" hook only fires with a real count. Supply
counts via `GROWTH_OS_WAITLIST_COUNTS` (a JSON file like `{"Brazil": 10782}`)
or the `counts` argument. Without a verified count the engine returns
`verified: false` and no number, so agents cannot invent urgency.

### Run

```bash
# Deterministic tests (fast, no LLM key):
python -m pytest tests/ -q

# End-to-end flow with stubbed crews (no LLM key):
python scripts/e2e_flow_test.py

# One real day of the phase (needs an LLM key):
plant-the-flag           # or: python -m clearpath_growth_os.plant_the_flag
```

## Submit your own articles + images

You don't have to let the AI write everything — drop finished content into
`inbox/` and the system distributes it. See `inbox/_README.md` for the format
and `OPERATIONS.md` for the full runbook.

```bash
# 1) drop inbox/my-post/article.md (+ images)   2) turn it into posts:
growth-os-submit
# 3) review, then approve + publish:
growth-os-approve
growth-os-publish            # dry-run by default
```

`growth-os-submit` hosts the images (`assets.py`), atomizes the article into an
X pack + LinkedIn post + short-form script (Content Atomizer crew), runs the
compliance gate, and writes `output/submission_<name>.json`. Submitted images
are auto-attached to the LinkedIn post, the blog article, the first X post, and
the short-form script.

## Runtime & publishing (run it without SaaS middlemen)

The engine produces content; two more pieces make it *run itself* and *post*,
all owned by you — no Zapier/Make/Pulse.

### LLM: uses the key you already have
Agents default to **Gemini** via `GEMINI_API_KEY` (see `AGENTS.md`) — no OpenAI
key needed. Override with `GROWTH_OS_MODEL` (e.g. `gpt-4o-mini`,
`groq/llama-3.3-70b-versatile`). Falls back to CrewAI's default if no key is set.

### Posting adapter (the "hands")
Pluggable, dry-run by default so the whole pipeline runs today with zero paid
accounts:

| Provider | Behaviour |
| --- | --- |
| `dryrun` (default) | Logs exactly what would post; no network. |
| `ayrshare` | One API key posts to X/LinkedIn. Video scripts → "needs media"; Reddit/Quora/blog → "manual" (posted by human/CMS, never sprayed). |

Set `POSTING_PROVIDER` + (for Ayrshare) `AYRSHARE_API_KEY`. Add a provider by
implementing `PostingAdapter` in `publishing/` and registering it in `get_adapter`.

### Human-gated publishing
```bash
plant-the-flag                     # produce today's batch (status: pending_human_review)
growth-os-approve                  # the human "yes" -> approved_for_publish
growth-os-publish --provider dryrun   # map batch -> posts -> adapter (+ writes a receipt)
```
`growth-os-publish` refuses any batch still at `pending_human_review` unless you
`--approved`. `batch_mapper.py` turns a batch into normalized `PlatformPost`s
(X posts/threads, LinkedIn, short-form scripts, blog articles, Reddit/Quora answers).

### GitHub Actions (the free runtime)
- `.github/workflows/growth-os-daily.yml` — scheduled (12:00 UTC) produce; uploads
  the batch as an artifact + previews it in the job summary. **Posts nothing.**
- `.github/workflows/growth-os-publish.yml` — manual `workflow_dispatch`; downloads
  the latest batch, optionally approves, and publishes via the chosen provider
  (defaults to dry-run).

Secrets/vars: `GEMINI_API_KEY` (secret), `AYRSHARE_API_KEY` (secret, optional),
`CLEARPATH_API_BASE` / `GROWTH_OS_MODEL` (repo vars, optional).

## Extending

The strategy calls for more crews — Social Distributor, Funnel Architect,
Affiliate Empire, Competitive Warfare. Each is added the same way: a folder
under `crews/` with `config/agents.yaml` + `config/tasks.yaml` and a `@CrewBase`
class, then a new `@listen(...)` step in a flow.
