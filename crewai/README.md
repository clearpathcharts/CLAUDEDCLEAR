# ClearPath Intelligence Crew — CrewAI Enterprise / AMP

GitHub-ready deployment package for the **ClearPath Market Intelligence & Competitive Intelligence Engine** — an 11-agent hierarchical crew combining competitor intelligence, social listening, and institutional market analysis.

## Quick start (local)

```bash
cd crewai
cp .env.example .env
# Fill in OPENAI_API_KEY (or ANTHROPIC/GEMINI) + SERPER_API_KEY + TAVILY_API_KEY
pip install -e .
crewai run
```

Or:

```bash
python -m clearpath_intelligence.main run_mode=competitive_intel_only
```

## AMP one-click deploy

1. In **CrewAI AMP**, connect this repo and set **root directory** to `crewai/`
2. Paste **Section 0** master brief from [`DEPLOYMENT.md`](./DEPLOYMENT.md) into crew-level instructions
3. Set **Process = Hierarchical**, **Manager = `crew_manager`**
4. Add environment variables from `.env.example`
5. Kickoff with:

```json
{
  "inputs": {
    "alternative_platform": "clearpathtrader.com",
    "launch_message": "We're giving away 15,000 free accounts!...",
    "active_neuro_profile": "calm_focus",
    "asset_universe": "ES, NQ, CL, GC, EURUSD, GBPUSD, BTCUSD, ETHUSD, SPY, QQQ",
    "run_mode": "full_intelligence_cycle",
    "competitor_focus": "all",
    "social_depth": "deep",
    "publish_mode": "draft_only"
  }
}
```

## Project structure

```
crewai/
├── pyproject.toml              # type = "crew" for AMP
├── .env.example
├── DEPLOYMENT.md               # Full paste-ready deployment package
├── README.md
└── src/clearpath_intelligence/
    ├── main.py                 # kickoff entry point (run())
    ├── crew.py                 # @CrewBase — agents, tasks, hierarchical process
    ├── config/
    │   ├── agents.yaml         # 11 agents (0A, 0B, 1–10)
    │   └── tasks.yaml          # 12 tasks with context chains
    └── tools/
        └── clearpath_api.py    # ClearPath HTTP bridge tools
```

## Agents

| Agent | Role |
|-------|------|
| `competitor_harvester` | Competitor pain-point harvester (0A) |
| `social_listener` | Live social conversation monitor (0B) |
| `macro_intelligence` | Macro brief |
| `pattern_scanner` | Four Up Three Down scanner |
| `order_flow_agent` | Smart money / order flow |
| `sentiment_divergence` | Sentiment vs reality |
| `correlation_agent` | Cross-asset correlation |
| `devils_advocate` | Steel-man countercase |
| `backtest_validator` | Historical validation |
| `risk_guardrail` | Behavioral guardrail |
| `crew_manager` | Synthesis editor (manager) |
| `neuro_translator` | Neurodivergent profile rendering |

## ClearPath API bridge

Custom tools call your deployed ClearPath server:

| Tool | Endpoint |
|------|----------|
| `clearpath_get_candles` | `GET /api/candles?symbol=&interval=&outputsize=` |
| `clearpath_get_quote` | `GET /api/quote?symbol=` |
| `clearpath_macro_fred` | `GET /api/fred/observations?series_id=` |
| `clearpath_grounded_news` | `GET /api/news/search?q=` |

Set `CLEARPATH_API_BASE=https://clearpathtrader.com` (or your staging URL).

## Outputs

Written to `output/`:

- `competitor_pain_matrix.md`
- `social_pulse_report.md`
- `clearpath_daily_briefing.md`
- `clearpath_daily_briefing_localized.md`

## Compliance

Educational and research purposes only. Not financial advice. Pattern language uses "possible" or "forming" — never "confirmed." `publish_mode: draft_only` by default.

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the complete deployment package, neuro profile IDs, Make.com automation, and AMP checklist.
