"""CrewAI tool wrappers around the ClearPath Trader API client.

Each tool is a thin, well-described wrapper so agents can pull *real* product
data (education corpus, FAQs, live news/sentiment, macro series, quotes) and
auto-internal-link finance terms — grounding every generated asset in owned,
verifiable content rather than hallucinations.
"""

from __future__ import annotations

import json

from crewai.tools import tool

from . import clearpath_client as api


@tool("Fetch ClearPath education corpus")
def fetch_education_corpus() -> str:
    """Return ClearPath's semantic/education records (topics, summaries,
    keywords, related /learn pages) as JSON. Use this to ground content in
    real, owned articles and to find internal pages to link to."""
    try:
        records = api.get_semantic_content()
        return json.dumps(api.summarize_corpus(records), ensure_ascii=False)
    except api.ClearPathAPIError as exc:
        return f"ERROR: {exc}"


@tool("Fetch ClearPath FAQs")
def fetch_faqs() -> str:
    """Return the site-wide FAQ list (question/answer pairs) as JSON. Use these
    verified answers for FAQ-style posts, ad copy, and objection handling."""
    try:
        return json.dumps(api.get_faqs(), ensure_ascii=False)
    except api.ClearPathAPIError as exc:
        return f"ERROR: {exc}"


@tool("Auto internal-link finance terms")
def auto_internal_link(text: str) -> str:
    """Given a block of marketing/education text, return it with recognised
    finance terms auto-linked to ClearPath pages (SEO internal-linking).
    Always run long-form copy through this before publishing."""
    try:
        return api.semantic_link(text)
    except api.ClearPathAPIError as exc:
        return f"ERROR: {exc}"


@tool("Search finance news and sentiment")
def search_finance_news(query: str) -> str:
    """Grounded finance-news search with sentiment for a topic/asset (e.g.
    'gold', 'EUR/USD', 'Fed rate decision'). Returns JSON. If the response has
    'demo': true the server has no live key — treat those numbers as
    NON-publishable placeholders and do not cite them as fact."""
    try:
        return json.dumps(api.search_news(query), ensure_ascii=False)
    except api.ClearPathAPIError as exc:
        return f"ERROR: {exc}"


@tool("Fetch macro series (FRED)")
def fetch_macro_series(series_id: str) -> str:
    """Fetch a FRED macro time series by id (e.g. 'CPIAUCSL' for CPI, 'FEDFUNDS'
    for the Fed Funds rate, 'M2SL' for M2). Returns JSON observations."""
    try:
        return json.dumps(api.get_fred_observations(series_id), ensure_ascii=False)
    except api.ClearPathAPIError as exc:
        return f"ERROR: {exc}"


@tool("Fetch live quote")
def fetch_quote(symbol: str) -> str:
    """Fetch the latest quote for a symbol (e.g. 'EUR/USD', 'XAU/USD', 'BTC/USD').
    Returns JSON. Only cite prices from this tool, never invented numbers."""
    try:
        return json.dumps(api.get_quote(symbol), ensure_ascii=False)
    except api.ClearPathAPIError as exc:
        return f"ERROR: {exc}"


# Grouped for convenient import into crews.
RESEARCH_TOOLS = [
    fetch_education_corpus,
    fetch_faqs,
    search_finance_news,
    fetch_macro_series,
    fetch_quote,
]

CONTENT_TOOLS = [
    fetch_education_corpus,
    fetch_faqs,
    auto_internal_link,
]

COMPLIANCE_TOOLS = [
    fetch_faqs,
    fetch_education_corpus,
]
