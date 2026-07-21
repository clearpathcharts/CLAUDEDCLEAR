"""ClearPath Trader API bridge tools for CrewAI agents."""

from __future__ import annotations

import json
import os
from typing import Any, Type
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from crewai.tools import BaseTool
from pydantic import BaseModel, Field


def _api_base() -> str:
    base = os.getenv("CLEARPATH_API_BASE", "https://clearpathtrader.com").rstrip("/")
    parsed = urlparse(base)
    host = (parsed.hostname or "").lower()
    allowed = {"localhost", "127.0.0.1", "clearpathtrader.com", "www.clearpathtrader.com"}
    if parsed.scheme not in {"http", "https"} or (
        host not in allowed and not host.endswith(".clearpathtrader.com")
    ):
        raise ValueError(f"CLEARPATH_API_BASE host not allowlisted: {host}")
    return base


def _http_get(path: str, params: dict[str, str]) -> dict[str, Any]:
    if not path.startswith("/api/") or ".." in path:
        raise ValueError(f"Refusing non-API path: {path}")
    query = urlencode(params)
    url = f"{_api_base()}{path}?{query}"
    request = Request(url, headers={"Accept": "application/json"})
    with urlopen(request, timeout=30) as response:
        payload = response.read().decode("utf-8")
        return json.loads(payload)


class ClearPathCandlesInput(BaseModel):
    symbol: str = Field(..., description="Market symbol, e.g. ES, SPY, EUR/USD, BTC/USD")
    interval: str = Field(default="5min", description="Candle interval, e.g. 5min, 1h, 1day")
    outputsize: int = Field(default=500, description="Number of candles (server may cap)")


class ClearPathGetCandlesTool(BaseTool):
    name: str = "clearpath_get_candles"
    description: str = (
        "Fetch OHLCV candle data from ClearPath Trader for pattern scanning and backtesting. "
        "Returns Twelve Data proxy JSON with values array."
    )
    args_schema: Type[BaseModel] = ClearPathCandlesInput

    def _run(self, symbol: str, interval: str = "5min", outputsize: int = 500) -> str:
        try:
            data = _http_get(
                "/api/candles",
                {"symbol": symbol, "interval": interval, "outputsize": str(outputsize)},
            )
            return json.dumps(data, indent=2)
        except Exception as exc:
            return json.dumps(
                {
                    "error": "CLEARPATH_CANDLES_UNAVAILABLE",
                    "message": str(exc),
                    "instruction": "Report the data gap. Never simulate market data.",
                }
            )


class ClearPathQuoteInput(BaseModel):
    symbol: str = Field(..., description="Market symbol for live quote")


class ClearPathGetQuoteTool(BaseTool):
    name: str = "clearpath_get_quote"
    description: str = (
        "Fetch a live quote from ClearPath Trader for sentiment and correlation analysis."
    )
    args_schema: Type[BaseModel] = ClearPathQuoteInput

    def _run(self, symbol: str) -> str:
        try:
            data = _http_get("/api/quote", {"symbol": symbol})
            return json.dumps(data, indent=2)
        except Exception as exc:
            return json.dumps(
                {
                    "error": "CLEARPATH_QUOTE_UNAVAILABLE",
                    "message": str(exc),
                    "instruction": "Report the data gap. Never simulate market data.",
                }
            )


class ClearPathFredInput(BaseModel):
    series_id: str = Field(
        ...,
        description="FRED series ID, e.g. DGS10, T10Y2Y, CPIAUCSL, UNRATE",
    )
    limit: int = Field(default=5, description="Number of recent observations")


class ClearPathMacroFredTool(BaseTool):
    name: str = "clearpath_macro_fred"
    description: str = (
        "Fetch macro economic observations via ClearPath FRED proxy bridge."
    )
    args_schema: Type[BaseModel] = ClearPathFredInput

    def _run(self, series_id: str, limit: int = 5) -> str:
        try:
            data = _http_get(
                "/api/fred/observations",
                {"series_id": series_id, "limit": str(limit)},
            )
            return json.dumps(data, indent=2)
        except Exception as exc:
            return json.dumps(
                {
                    "error": "FRED_UNAVAILABLE",
                    "message": str(exc),
                    "instruction": "Use search tools for macro context and label as contextual.",
                }
            )


class ClearPathNewsInput(BaseModel):
    query: str = Field(..., description="News search query for grounded sentiment")


class ClearPathGroundedNewsTool(BaseTool):
    name: str = "clearpath_grounded_news"
    description: str = (
        "Search grounded news and sentiment via ClearPath Y.W.C. news pipeline."
    )
    args_schema: Type[BaseModel] = ClearPathNewsInput

    def _run(self, query: str) -> str:
        try:
            data = _http_get("/api/news/search", {"q": query})
            return json.dumps(data, indent=2)
        except Exception as exc:
            return json.dumps(
                {
                    "error": "NEWS_SEARCH_UNAVAILABLE",
                    "message": str(exc),
                    "instruction": "Fall back to Tavily/Serper and note the API gap.",
                }
            )
