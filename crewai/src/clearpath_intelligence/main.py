#!/usr/bin/env python
"""
ClearPath Intelligence Crew — entry point for local runs and CrewAI AMP kickoff.

Usage:
  crewai run
  python -m clearpath_intelligence.main
"""

from __future__ import annotations

import os
import sys
from datetime import datetime, timezone

from clearpath_intelligence.crew import ClearpathIntelligenceCrew


DEFAULT_INPUTS = {
    "alternative_platform": os.getenv(
        "DEFAULT_ALTERNATIVE_PLATFORM", "clearpathtrader.com"
    ),
    "launch_message": (
        "We're giving away 15,000 free accounts! Experience a clean, uncluttered "
        "charting platform that focuses on trading - not selling you upgrades on "
        "every screen. Get yours at clearpathtrader.com"
    ),
    "active_neuro_profile": os.getenv("DEFAULT_NEURO_PROFILE", "calm_focus"),
    "asset_universe": "ES, NQ, CL, GC, EURUSD, GBPUSD, BTCUSD, ETHUSD, SPY, QQQ",
    "run_mode": "full_intelligence_cycle",
    "competitor_focus": "all",
    "social_depth": "deep",
    "publish_mode": os.getenv("DEFAULT_PUBLISH_MODE", "draft_only"),
    "date": datetime.now(timezone.utc).strftime("%Y-%m-%d"),
}


def run() -> None:
    """Run the ClearPath intelligence crew with kickoff inputs."""
    os.makedirs("output", exist_ok=True)

    inputs = {**DEFAULT_INPUTS}
    # Allow lightweight CLI overrides: key=value pairs
    for arg in sys.argv[1:]:
        if "=" in arg:
            key, value = arg.split("=", 1)
            inputs[key.strip()] = value.strip()

    print("ClearPath Intelligence Crew — kickoff inputs:")
    for key, value in inputs.items():
        print(f"  {key}: {value}")

    result = ClearpathIntelligenceCrew().crew().kickoff(inputs=inputs)
    print("\n--- Crew complete ---\n")
    print(result)


if __name__ == "__main__":
    run()
