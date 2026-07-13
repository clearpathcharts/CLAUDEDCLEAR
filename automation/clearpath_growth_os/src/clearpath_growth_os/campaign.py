"""Campaign configuration for the 30-day "Plant the Flag" phase.

This is the single, declarative source of truth for the phase: the SEO pillars
and their supporting clusters, the long-tail keywords, the per-channel daily
cadence, the country caps that power the (compliant) scarcity loop, and the
30-day KPI targets.

Everything here is plain data so it can be unit-tested and tuned without
touching agent prompts or the flow.
"""

from __future__ import annotations

from dataclasses import dataclass, field


# ---------------------------------------------------------------------------
# SEO farm — pillars already exist in the ClearPath semantic corpus.
# Each pillar seeds a cluster of 8-10 supporting posts (long-tail intent).
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class Pillar:
    slug: str
    title: str
    related_page: str
    cluster_angles: tuple[str, ...]


PILLARS: tuple[Pillar, ...] = (
    Pillar(
        slug="inflation",
        title="Inflation & Purchasing Power",
        related_page="/learn/inflation",
        cluster_angles=(
            "what inflation means for a beginner trader",
            "how CPI prints move forex and gold",
            "inflation vs your savings, explained simply",
            "reading the Fed without the jargon",
            "inflation and crypto: the real relationship",
            "how to track inflation on ClearPath",
            "inflation myths beginners believe",
            "stagflation explained for new traders",
            "inflation and interest rates, step by step",
            "an ADHD-friendly way to follow inflation data",
        ),
    ),
    Pillar(
        slug="liquidity",
        title="Macro Liquidity & Capital Flows",
        related_page="/learn/liquidity",
        cluster_angles=(
            "what liquidity actually is, in plain English",
            "how central bank liquidity moves markets",
            "M2 explained for beginners",
            "why liquidity droughts cause crashes",
            "liquidity and risk assets, simply",
            "spotting liquidity shifts on ClearPath",
            "repo markets for normal people",
            "liquidity vs volume: the difference",
            "how liquidity affects crypto",
            "a calm, low-clutter way to watch liquidity",
        ),
    ),
    Pillar(
        slug="valuation",
        title="Asset Valuation Fundamentals",
        related_page="/learn/valuation",
        cluster_angles=(
            "how assets are actually valued",
            "P/E ratios for absolute beginners",
            "valuation vs price: why they differ",
            "discounted cash flow without the math fear",
            "how rates change valuations",
            "valuing crypto: is it even possible?",
            "overvalued vs undervalued, explained",
            "valuation traps beginners fall into",
            "using ClearPath fundamentals panel",
            "a dyslexia-friendly guide to reading valuations",
        ),
    ),
    Pillar(
        slug="microstructure",
        title="Market Microstructure",
        related_page="/learn/microstructure",
        cluster_angles=(
            "what market microstructure means",
            "bid-ask spread explained simply",
            "how order books really work",
            "slippage and why it happens",
            "market makers for beginners",
            "why your fills differ from the chart",
            "liquidity at the microstructure level",
            "reading depth without overwhelm",
            "microstructure and volatility",
            "a low-stimulation intro to order flow",
        ),
    ),
    Pillar(
        slug="correlations",
        title="Intermarket Correlations",
        related_page="/learn/correlations",
        cluster_angles=(
            "what correlations mean for traders",
            "gold vs the dollar, explained",
            "why bonds and stocks move together (or not)",
            "crypto correlation to tech stocks",
            "oil and inflation correlations",
            "how to use correlations to reduce risk",
            "correlation vs causation in markets",
            "risk-on vs risk-off, simply",
            "tracking correlations on ClearPath",
            "an ADHD-friendly correlation cheat sheet",
        ),
    ),
)


# ---------------------------------------------------------------------------
# Long-tail intent keywords competitors ignore (the wedge).
# ---------------------------------------------------------------------------

LONG_TAIL_KEYWORDS: tuple[str, ...] = (
    "neurodivergent friendly trading platform",
    "trading app for ADHD",
    "TradingView alternative for beginners",
    "autism friendly charts",
    "learn forex without a broker",
    "low stimulation trading interface",
    "dyslexia friendly trading platform",
    "trading terminal that adapts to your brain",
    "calm trading dashboard",
    "all in one trading terminal not a broker",
    "AI trading mentor for beginners",
    "automatic chart pattern scanner",
)


# ---------------------------------------------------------------------------
# Content pillars (messaging), rotated across the week.
# ---------------------------------------------------------------------------

MESSAGE_PILLARS: tuple[str, ...] = (
    "brain-first / neuro-adaptive layouts",
    "if trading and ChatGPT had a baby (AI mentor)",
    "not a broker / trust & board governance",
    "pattern-in-60-seconds (automatic scanner)",
    "school of markets (10 education schools)",
    "terminal speed (single combined server)",
    "community & lobby (guilds, no signal selling)",
)


# ---------------------------------------------------------------------------
# Real, verifiable product capabilities the crews may cite.
# (Compliance rejects anything not on this list unless tool-verified.)
# ---------------------------------------------------------------------------

VERIFIED_CAPABILITIES: tuple[str, ...] = (
    "14 neuro-adaptive layout profiles",
    "automatic chart pattern scanner",
    "AI trading mentor (assisted analysis, not predictions)",
    "10 education schools with quizzes",
    "10 implemented technical indicators with an encyclopedia",
    "live charts on a single combined server",
    "public trading lobby and guild rooms",
    "not a broker — analytics and education only",
)


# ---------------------------------------------------------------------------
# Per-channel daily cadence for the 30-day phase.
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class ChannelCadence:
    x_posts_per_day: int = 4  # 3-4 standalone posts
    x_threads_per_day: int = 1
    linkedin_posts_per_day: int = 1
    shortform_scripts_per_day: int = 2  # TikTok/Reels, 1-2
    # SEO farm: 3 pillar articles/week -> Mon/Wed/Fri (weekday() 0,2,4)
    seo_pillar_weekdays: tuple[int, ...] = (0, 2, 4)
    supporting_posts_per_pillar: int = 9  # 8-10
    # Founding distribution: 20 Reddit/Quora answers across the month.
    # ~5/week on Tue/Thu (weekday 1,3) => ~40 capacity, we cap the month at 20.
    seeding_weekdays: tuple[int, ...] = (1, 3)
    seeding_answers_per_session: int = 3


CADENCE = ChannelCadence()


# ---------------------------------------------------------------------------
# Scarcity loop — soft-launch country caps (compliant: real counts required).
# ---------------------------------------------------------------------------

DEFAULT_COUNTRY_CAP = 15_000

# Priority launch countries for the 30-day phase.
LAUNCH_COUNTRIES: tuple[str, ...] = (
    "United States",
    "Brazil",
    "United Kingdom",
    "India",
    "Nigeria",
    "Canada",
    "Australia",
    "Germany",
)


# ---------------------------------------------------------------------------
# 30-day KPI targets (from the strategy).
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class KpiTargets:
    owned_articles_indexed: int = 90
    social_posts: int = 300
    waitlist_signups_low: int = 2_000
    waitlist_signups_high: int = 5_000
    viral_video_views: int = 50_000
    phase_days: int = 30


KPI_TARGETS = KpiTargets()
