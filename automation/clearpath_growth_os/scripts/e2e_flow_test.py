#!/usr/bin/env python3
"""End-to-end test of PlantTheFlagFlow with stubbed crews (no LLM key needed).

Exercises the full orchestration — deterministic planning, the three content
crews, the compliance router, publishing, and KPI rollup — by replacing each
crew with a canned output. Verifies:
  * a pillar day (Mon) produces article metrics,
  * a seeding day (Tue) produces seeding metrics,
  * the approved route writes a day batch + KPI file,
  * the needs_revision route writes a flags file.
"""

from __future__ import annotations

import json
import sys
import tempfile
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

import os

os.environ.setdefault("GROWTH_OS_OUTPUT_DIR", tempfile.mkdtemp(prefix="ptf_"))

import clearpath_growth_os.plant_the_flag as ptf  # noqa: E402


class _Task:
    def __init__(self, raw):
        self.raw = raw


class _Result:
    def __init__(self, raw, tasks=None):
        self.raw = raw
        self.tasks_output = tasks or []


class _Crew:
    def __init__(self, result):
        self._r = result

    def kickoff(self, inputs=None):
        return self._r


class _Factory:
    def __init__(self, result):
        self._r = result

    def crew(self):
        return _Crew(self._r)


BRIEF = "ClearPath Morning Brief: Gold firm, USD soft. Data confidence: news=demo."
TEACH = json.dumps([{"concept": "liquidity", "plain_explanation": "...", "related_page": "/learn/liquidity"}])
OMNI = json.dumps({"x_posts": [{"copy": "Education first."}], "x_thread": {"posts": ["1", "2"]}})
SEO = json.dumps({"title": "What Is Inflation?", "slug": "inflation"})
SEEDING = json.dumps([{"target": "r/ADHD", "answer": "...", "includes_link": False}])


def _install_stubs(verdict: str):
    ptf.MacroIntelligenceCrew = lambda: _Factory(_Result(BRIEF, [_Task(BRIEF), _Task(TEACH)]))
    ptf.DailyOmnipresenceCrew = lambda: _Factory(_Result(OMNI))
    ptf.SeoFarmCrew = lambda: _Factory(_Result(SEO))
    ptf.SeedingCrew = lambda: _Factory(_Result(SEEDING))
    report = {"verdict": verdict, "flags": [] if verdict == "approved" else [{"issue": "x"}]}
    ptf.ComplianceGuardianCrew = lambda: _Factory(_Result(json.dumps(report)))


def run_day(run_date: str, verdict: str, label: str):
    _install_stubs(verdict)
    flow = ptf.PlantTheFlagFlow()
    flow.state.run_date = run_date
    flow.kickoff()
    print(f"--- {label} ({run_date}) ---")
    print("  day_index:", flow.state.plan["day_index"], "weekday:", flow.state.plan["weekday"])
    print("  metrics:", flow.state.metrics)
    print("  verdict:", flow.state.verdict, "-> file:", Path(flow.state.published_path).name)
    return flow


def main() -> int:
    ok = True

    # Monday 2026-07-13 = pillar day, approved.
    mon = run_day("2026-07-13", "approved", "PILLAR DAY / APPROVED")
    assert mon.state.metrics["articles"] == 10, "pillar day should yield 10 articles"
    assert mon.state.plan["seo"]["is_pillar_day"] is True
    assert Path(mon.state.published_path).name.startswith("plant_the_flag_2026")

    # Tuesday 2026-07-14 = seeding day, approved.
    tue = run_day("2026-07-14", "approved", "SEEDING DAY / APPROVED")
    assert tue.state.metrics["seeding_answers"] == 3, "seeding day should yield 3 answers"
    assert tue.state.plan["seo"]["is_pillar_day"] is False
    assert tue.state.plan["seeding"]["is_seeding_day"] is True

    # Sunday 2026-07-19 = quiet, needs revision (flagged).
    sun = run_day("2026-07-19", "needs_revision", "QUIET DAY / FLAGGED")
    assert sun.state.metrics["articles"] == 0
    assert "flags" in Path(sun.state.published_path).name

    # KPI file should aggregate the two approved days.
    kpi_path = Path(os.environ["GROWTH_OS_OUTPUT_DIR"]) / "plant_the_flag_kpi.json"
    kpi = json.loads(kpi_path.read_text())
    print("\nKPI rollup:", json.dumps(kpi, indent=2)[:600])
    assert kpi["days_run"] == 2, "only approved days write batches counted by KPI"
    assert kpi["articles"]["produced"] == 10
    assert kpi["social_posts"]["produced"] == 16  # 8 per approved day (4+1+1+2)
    assert kpi["seeding_answers"]["produced"] == 3

    print("\nALL E2E ASSERTIONS PASSED" if ok else "FAILURES")
    return 0 if ok else 1


if __name__ == "__main__":
    raise SystemExit(main())
