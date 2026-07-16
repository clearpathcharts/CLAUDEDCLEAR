# ClearPath Trader — CrewAI Enterprise Deployment Instructions

Full paste-ready package for **Crew Studio** or **CrewAI AMP** (GitHub-connected).

> **Repo path:** connect AMP to this repo with root directory `crewai/`.

---

## Section 0 — Master Crew Brief (crew-level instructions)

```
CREW NAME: ClearPath Market Intelligence & Competitive Intelligence Engine
BRAND: ClearPath Trader (clearpathtrader.com)
PRODUCT POSITIONING: Real analysis. Zero casino pressure. Built for brains that need it explained differently.

MISSION:
Run a continuous, automated intelligence operation that:
(A) Harvests real user pain from competitor platforms and trading communities
(B) Monitors live trader conversations for emotional/UX/cognitive overload signals
(C) Produces institutional-grade market analysis through 10 narrow specialist agents
(D) Synthesizes everything into ONE calm daily briefing — no jargon pileup, no ten separate alerts

NON-NEGOTIABLE COMPLIANCE:
- Educational and research purposes ONLY. Never financial advice. Never "buy/sell/hold."
- Never promise profits, guaranteed outcomes, or certainty.
- Never use hype, urgency, FOMO, or casino language.
- Pattern/setup language must use "possible" or "forming" — never "confirmed."
- Never invent data, percentages, or patterns not supported by retrieved evidence.
- Never claim access to user accounts, balances, or positions.
- If distress/self-harm is detected in social listening: flag for human review only — do not auto-respond clinically.

TONE: Calm. Plain English. Short sentences. Zero judgment. Neurodivergent-friendly by default.

COMPETITOR WATCH LIST: TradingView, MT4, MT5, Webull, Thinkorswim, Binance, IBKR

SOCIAL LISTENING TARGETS: Reddit (r/Daytrading, r/Forex, r/options, r/thinkorswim, r/Webull,
r/TradingView, r/interactivebrokers, r/Binance, r/algotrading), public Discord/Telegram,
YouTube comments, Forex Factory, Elite Trader, Trade2Win, BabyPips forums.

CLEARPATH DIFFERENTIATORS: Four Up Three Down, Gold Bar Indicator, 12 Neuro-Adaptive Chart Profiles,
Blackout Mode, C.P.T. Personal Buddy, Y.W.C., Encyclopedia of Finance/Indicators, Institutional Registry.
```

---

## Section 1 — Kickoff inputs

```json
{
  "inputs": {
    "alternative_platform": "clearpathtrader.com",
    "launch_message": "We're giving away 15,000 free accounts! Experience a clean, uncluttered charting platform that focuses on trading - not selling you upgrades on every screen. Get yours at clearpathtrader.com",
    "active_neuro_profile": "calm_focus",
    "asset_universe": "ES, NQ, CL, GC, EURUSD, GBPUSD, BTCUSD, ETHUSD, SPY, QQQ",
    "run_mode": "full_intelligence_cycle",
    "competitor_focus": "all",
    "social_depth": "deep",
    "publish_mode": "draft_only"
  }
}
```

| Input | Options | Purpose |
|-------|---------|---------|
| `active_neuro_profile` | See Section 8 | Final briefing rendering |
| `run_mode` | `competitive_intel_only` \| `market_intel_only` \| `full_intelligence_cycle` | Scope control |
| `competitor_focus` | `all` or comma-separated names | Narrow scans |
| `social_depth` | `light` \| `standard` \| `deep` | Search breadth |
| `publish_mode` | `draft_only` \| `ready_for_review` | Never auto-post without human approval |

---

## Section 2 — Process architecture

```
PROCESS TYPE: Hierarchical
MANAGER: crew_manager (Agent 10)
EXECUTION ORDER:
  Phase 1 (parallel): competitor_harvester, social_listener
  Phase 2 (parallel): macro, pattern, order_flow, sentiment, correlation, backtest
  Phase 3: risk_guardrail
  Phase 4: devils_advocate
  Phase 5: crew_manager synthesis
  Phase 6: neuro_translator
```

Implemented in `src/clearpath_intelligence/crew.py` via task `context` chains.

---

## Section 5 — Tools (already wired in crew.py)

| Agent | Tools |
|-------|-------|
| competitor_harvester, social_listener | Serper, Tavily, ScrapeWebsite, Firecrawl, Apify Reddit, Apify App Reviews, YouTube Comments |
| macro_intelligence | Serper, Tavily, clearpath_macro_fred |
| pattern_scanner | clearpath_get_candles, clearpath_get_quote |
| order_flow_agent | Serper, Tavily, clearpath_get_quote |
| sentiment_divergence | clearpath_grounded_news, Serper, Tavily, clearpath_get_quote |
| correlation_agent | clearpath_get_candles, clearpath_get_quote |
| devils_advocate, risk_guardrail, backtest_validator | FileReadTool |
| neuro_translator | FileReadTool, FileWriteTool |
| crew_manager | FileReadTool, FileWriteTool, clearpath_post_intelligence_webhook |

### ClearPath webhook receiver (Express server)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/intelligence/webhook` | POST | Receive crew briefing payloads |
| `/api/intelligence/briefings` | GET | List recent briefings |
| `/api/intelligence/briefings/:id` | GET | Fetch full briefing record |

Auth: `x-intelligence-webhook-secret` header. Forward to Make.com: `?forward=make` + `MAKE_WEBHOOK_URL` on server.

---

## Section 6 — Environment variables

Copy from `.env.example`. Required minimum:

- `OPENAI_API_KEY` (or `ANTHROPIC_API_KEY` / `GEMINI_API_KEY`)
- `SERPER_API_KEY`, `TAVILY_API_KEY`
- `CLEARPATH_API_BASE=https://clearpathtrader.com`

---

## Section 7 — Custom HTTP tools (implemented)

| Tool | Endpoint |
|------|----------|
| `clearpath_get_candles` | `GET /api/candles?symbol={symbol}&interval={interval}&outputsize=500` |
| `clearpath_get_quote` | `GET /api/quote?symbol={symbol}` |
| `clearpath_macro_fred` | `GET /api/fred/observations?series_id={series_id}` |
| `clearpath_grounded_news` | `GET /api/news/search?q={query}` |

Source: `src/clearpath_intelligence/tools/clearpath_api.py`

Social harvest tools: `src/clearpath_intelligence/tools/social_research.py`

| Tool | Env |
|------|-----|
| `apify_reddit_scraper` | `APIFY_API_KEY`, optional `APIFY_REDDIT_ACTOR_ID` |
| `apify_app_store_reviews` | `APIFY_API_KEY`, optional `APIFY_APP_REVIEWS_ACTOR_ID` |
| `youtube_comments_harvest` | `YOUTUBE_API_KEY` |
| `clearpath_post_intelligence_webhook` | `CLEARPATH_API_BASE`, `INTELLIGENCE_WEBHOOK_SECRET` |

---

## Section 8 — Neuro profile IDs

| ID | Label |
|----|-------|
| `calm_focus` | Calm Focus |
| `low_stim_emergency` | Low Stimulation |
| `dyslexia_readable` | Reading Support |
| `dyscalculia_numeric_relief` | Numeric Relief |
| `visual_processing_safe` | Visual Ease |
| `apd_assist` | Reduced Signal Load |
| `executive_function_support` | Task Structure |
| `motor_friendly` | Large Target Mode |
| `adhd_dopamine_balanced` | Balanced Energy |
| `adhd_hyperfocus` | Hyperfocus |
| `autism_predictable` | Autism - Predictable |
| `tourette_tic_friendly` | Minimal Motion |

---

## Section 10 — Make.com automation

```json
POST {CREWAI_BASE_URL}/kickoff
{
  "inputs": {
    "alternative_platform": "clearpathtrader.com",
    "active_neuro_profile": "calm_focus",
    "asset_universe": "ES,NQ,CL,GC,EURUSD,BTCUSD,SPY,QQQ",
    "run_mode": "full_intelligence_cycle",
    "publish_mode": "draft_only"
  },
  "crewWebhookUrl": "https://hook.make.com/YOUR_WEBHOOK"
}
```

Schedule: daily 06:00 ET + 20:00 ET, or every 6 hours for competitive intel only.

---

## Section 12 — AMP checklist

1. Connect GitHub repo → set root to `crewai/`
2. Paste Section 0 as crew-level system instructions
3. Agents/tasks load from `config/agents.yaml` and `config/tasks.yaml` via `crew.py`
4. Process = **Hierarchical**, Manager = **crew_manager**
5. Install tools: Serper, Tavily, Firecrawl, Apify (AMP Tools Repository)
6. Paste env vars from `.env.example`
7. Custom HTTP tools: already in repo (`clearpath_api.py`)
8. Deploy → test kickoff → wire Make.com
9. Keep `publish_mode: draft_only` until first 5 briefings approved

---

## Section 13 — Honest limitations

- MT4/MT5: no public complaint API — use forums, app stores, Reddit
- Discord/Telegram: public/indexed channels only
- COT/dark-pool: not live in ClearPath — label as contextual
- Never simulate market data if APIs fail — report the gap

---

## YAML sources

Agent and task definitions are in:

- `src/clearpath_intelligence/config/agents.yaml`
- `src/clearpath_intelligence/config/tasks.yaml`

Python orchestration: `src/clearpath_intelligence/crew.py`
