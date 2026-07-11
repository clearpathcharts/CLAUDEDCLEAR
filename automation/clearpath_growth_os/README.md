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

## Extending

The strategy calls for four more crews — Social Distributor, Funnel Architect,
Affiliate Empire, Competitive Warfare. Each is added the same way: a folder
under `crews/` with `config/agents.yaml` + `config/tasks.yaml` and a `@CrewBase`
class, then a new `@listen(...)` step in `main.py`.
