"""Plant the Flag — the 30-day phase Flow.

Orchestrates one day of the "Plant the Flag" phase end to end:

    build_daily_plan   (deterministic planner — no LLM)
          |
    gather_intelligence     (Macro Intelligence crew)
          |
    produce_omnipresence    (Daily Omnipresence crew: X + LinkedIn + short-form)
          |
    produce_seo             (SEO Farm crew — only on pillar days: Mon/Wed/Fri)
          |
    produce_seeding         (Seeding crew — only on Tue/Thu)
          |
    enforce_compliance      (Compliance Guardian crew)
          |
      route_on_verdict (@router) -> publish_day | flag_day
          |
    publish_day  writes plant_the_flag_<date>.json + rolls up KPIs

Deterministic metrics (article/social/seeding counts) come from the plan, so KPI
pacing is accurate even before any LLM output is parsed.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timezone

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from crewai.flow.flow import Flow, listen, router, start

from .campaign import KPI_TARGETS
from .config import force_human_review, output_dir
from .crews.compliance_guardian.compliance_guardian_crew import ComplianceGuardianCrew
from .crews.daily_omnipresence.daily_omnipresence_crew import DailyOmnipresenceCrew
from .crews.macro_intelligence.macro_intelligence_crew import MacroIntelligenceCrew
from .crews.seeding.seeding_crew import SeedingCrew
from .crews.seo_farm.seo_farm_crew import SeoFarmCrew
from .kpi import build_report
from .planner import build_daily_plan
from .main import _as_text, _safe_load  # reuse helpers

load_dotenv()


DEFAULT_PHASE_START = date(2026, 7, 13)
DEFAULT_WATCHLIST = ["EUR/USD", "XAU/USD", "BTC/USD", "SPX", "US10Y"]
DEFAULT_FOCUS_THEMES = ["Federal Reserve policy", "gold", "bitcoin", "US dollar"]


class PhaseState(BaseModel):
    """Persistent state for one day of the Plant the Flag phase."""

    run_date: str = Field(default_factory=lambda: date.today().isoformat())
    phase_start: str = DEFAULT_PHASE_START.isoformat()
    watchlist: list[str] = Field(default_factory=lambda: list(DEFAULT_WATCHLIST))
    focus_themes: list[str] = Field(default_factory=lambda: list(DEFAULT_FOCUS_THEMES))

    plan: dict = Field(default_factory=dict)
    morning_brief: str = ""
    teachable_moments: str = ""

    omnipresence: str = ""
    seo_output: str = ""
    seeding_output: str = ""

    verdict: str = ""
    compliance_report: str = ""
    requires_human_review: bool = True
    published_path: str = ""
    metrics: dict = Field(default_factory=dict)
    kpi_report: dict = Field(default_factory=dict)


class PlantTheFlagFlow(Flow[PhaseState]):
    """One full day of the 30-day phase, planned deterministically then executed."""

    @start()
    def build_daily_plan(self) -> None:
        plan = build_daily_plan(
            run_date=date.fromisoformat(self.state.run_date),
            phase_start=date.fromisoformat(self.state.phase_start),
        )
        self.state.plan = plan.to_dict()
        # Deterministic KPI metrics for the day (independent of LLM output).
        p = plan
        articles = 0
        if p.seo.is_pillar_day:
            articles = 1 + len(p.seo.supporting_posts)
        social = (
            p.channels.x_posts
            + p.channels.x_threads
            + p.channels.linkedin_posts
            + p.channels.shortform_scripts
        )
        self.state.metrics = {
            "articles": articles,
            "social_posts": social,
            "seeding_answers": p.seeding.answers_to_produce,
        }
        print(f"[Plant the Flag] Day {p.day_index} plan: {json.dumps(self.state.metrics)}")

    @listen(build_daily_plan)
    def gather_intelligence(self) -> None:
        result = (
            MacroIntelligenceCrew()
            .crew()
            .kickoff(
                inputs={
                    "run_date": self.state.run_date,
                    "watchlist": ", ".join(self.state.watchlist),
                    "focus_themes": ", ".join(self.state.focus_themes),
                }
            )
        )
        tasks_output = getattr(result, "tasks_output", []) or []
        if len(tasks_output) >= 2:
            self.state.morning_brief = _as_text(tasks_output[0])
            self.state.teachable_moments = _as_text(tasks_output[-1])
        else:
            self.state.morning_brief = _as_text(result)

    @listen(gather_intelligence)
    def produce_omnipresence(self) -> None:
        plan = self.state.plan
        ch = plan["channels"]
        research_payload = (
            f"MORNING BRIEF:\n{self.state.morning_brief}\n\n"
            f"TEACHABLE MOMENTS:\n{self.state.teachable_moments}"
        )
        result = (
            DailyOmnipresenceCrew()
            .crew()
            .kickoff(
                inputs={
                    "run_date": self.state.run_date,
                    "day_index": plan["day_index"],
                    "message_pillar": plan["message_pillar"],
                    "scarcity_country": plan["scarcity_country"],
                    "x_posts": ch["x_posts"],
                    "x_threads": ch["x_threads"],
                    "linkedin_posts": ch["linkedin_posts"],
                    "shortform_scripts": ch["shortform_scripts"],
                    "research_payload": research_payload,
                }
            )
        )
        self.state.omnipresence = _as_text(result)

    @listen(produce_omnipresence)
    def produce_seo(self) -> None:
        seo = self.state.plan["seo"]
        if not seo["is_pillar_day"]:
            self.state.seo_output = json.dumps({"skipped": "not a pillar day"})
            print("[Plant the Flag] SEO skipped (not a pillar day).")
            return
        result = (
            SeoFarmCrew()
            .crew()
            .kickoff(
                inputs={
                    "run_date": self.state.run_date,
                    "pillar_title": seo["pillar_title"],
                    "pillar_slug": seo["pillar_slug"],
                    "related_page": seo["related_page"],
                    "target_keywords": ", ".join(seo["target_keywords"]),
                    "supporting_posts": "; ".join(seo["supporting_posts"]),
                }
            )
        )
        self.state.seo_output = _as_text(result)

    @listen(produce_seo)
    def produce_seeding(self) -> None:
        seeding = self.state.plan["seeding"]
        if not seeding["is_seeding_day"]:
            self.state.seeding_output = json.dumps({"skipped": "not a seeding day"})
            print("[Plant the Flag] Seeding skipped (not a seeding day).")
            return
        result = (
            SeedingCrew()
            .crew()
            .kickoff(
                inputs={
                    "run_date": self.state.run_date,
                    "answers_to_produce": seeding["answers_to_produce"],
                    "targets": ", ".join(seeding["targets"]),
                }
            )
        )
        self.state.seeding_output = _as_text(result)

    @listen(produce_seeding)
    def enforce_compliance(self) -> None:
        payload = json.dumps(
            {
                "omnipresence": _safe_load(self.state.omnipresence),
                "seo": _safe_load(self.state.seo_output),
                "seeding": _safe_load(self.state.seeding_output),
            },
            ensure_ascii=False,
        )
        result = ComplianceGuardianCrew().crew().kickoff(inputs={"content_payload": payload})
        report = _as_text(result)
        self.state.compliance_report = report

        verdict = "needs_revision"
        try:
            parsed = json.loads(report)
            if isinstance(parsed, dict) and parsed.get("verdict") == "approved":
                verdict = "approved"
        except (json.JSONDecodeError, TypeError):
            verdict = "needs_revision"
        self.state.verdict = verdict

    @router(enforce_compliance)
    def route_on_verdict(self) -> str:
        return "approved" if self.state.verdict == "approved" else "needs_revision"

    @listen("approved")
    def publish_day(self) -> str:
        self.state.requires_human_review = force_human_review()
        status = "pending_human_review" if self.state.requires_human_review else "ready_to_publish"

        batch = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "run_date": self.state.run_date,
            "phase": "30-day Plant the Flag",
            "status": status,
            "compliance_verdict": self.state.verdict,
            "plan": self.state.plan,
            "metrics": self.state.metrics,
            "morning_brief": self.state.morning_brief,
            "teachable_moments": _safe_load(self.state.teachable_moments),
            "omnipresence": _safe_load(self.state.omnipresence),
            "seo": _safe_load(self.state.seo_output),
            "seeding": _safe_load(self.state.seeding_output),
            "compliance_report": _safe_load(self.state.compliance_report),
        }
        out = output_dir() / f"plant_the_flag_{self.state.run_date}.json"
        out.write_text(json.dumps(batch, ensure_ascii=False, indent=2), encoding="utf-8")
        self.state.published_path = str(out)

        self.state.kpi_report = build_report(output_dir()).to_dict()
        _write_kpi(self.state.kpi_report)

        print(f"\n[Plant the Flag] Day batch -> {out} ({status})")
        return str(out)

    @listen("needs_revision")
    def flag_day(self) -> str:
        out = output_dir() / f"plant_the_flag_flags_{self.state.run_date}.json"
        out.write_text(
            json.dumps(
                {
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "run_date": self.state.run_date,
                    "status": "blocked_by_compliance",
                    "plan": self.state.plan,
                    "compliance_report": _safe_load(self.state.compliance_report),
                    "omnipresence": _safe_load(self.state.omnipresence),
                    "seo": _safe_load(self.state.seo_output),
                    "seeding": _safe_load(self.state.seeding_output),
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        self.state.published_path = str(out)
        print(f"\n[Plant the Flag] Compliance flagged content -> {out}")
        return str(out)


def _write_kpi(report: dict) -> None:
    path = output_dir() / "plant_the_flag_kpi.json"
    path.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")


def kickoff() -> None:
    """Run one day of the Plant the Flag phase."""
    PlantTheFlagFlow().kickoff()


def plot() -> None:
    PlantTheFlagFlow().plot("plant_the_flag")
    print("Saved flow diagram to plant_the_flag.html")


if __name__ == "__main__":
    kickoff()
