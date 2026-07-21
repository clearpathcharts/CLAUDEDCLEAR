"""ClearPath Growth OS — the master CrewAI Flow.

Pipeline (event-driven, stateful):

    gather_intelligence  (Macro Intelligence crew)
            |
            v
    produce_content      (Content Factory crew)
            |
            v
    enforce_compliance   (Compliance Guardian crew)
            |
        route_on_verdict  (@router)
        /            \
   approved      needs_revision
      |                |
  publish_batch   flag_for_revision
      |
  (writes an approved batch file for hand-off to Zapier / schedulers)

The flow persists state across steps via a Pydantic model, so a run is fully
auditable — exactly what a board-governed brand needs before anything ships.
"""

from __future__ import annotations

import json
from datetime import date, datetime, timezone
from pathlib import Path
from typing import Any

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from crewai.flow.flow import Flow, listen, or_, router, start

from .config import force_human_review, output_dir
from .crews.compliance_guardian.compliance_guardian_crew import ComplianceGuardianCrew
from .crews.content_factory.content_factory_crew import ContentFactoryCrew
from .crews.macro_intelligence.macro_intelligence_crew import MacroIntelligenceCrew

load_dotenv()


DEFAULT_WATCHLIST = ["EUR/USD", "XAU/USD", "BTC/USD", "SPX", "US10Y"]
DEFAULT_FOCUS_THEMES = ["Federal Reserve policy", "gold", "bitcoin", "US dollar"]


class GrowthState(BaseModel):
    """Persistent state for one growth-engine run."""

    run_date: str = Field(default_factory=lambda: date.today().isoformat())
    watchlist: list[str] = Field(default_factory=lambda: list(DEFAULT_WATCHLIST))
    focus_themes: list[str] = Field(default_factory=lambda: list(DEFAULT_FOCUS_THEMES))

    morning_brief: str = ""
    teachable_moments: str = ""
    content_batch: str = ""

    verdict: str = ""  # "approved" | "needs_revision"
    compliance_report: str = ""
    requires_human_review: bool = True
    published_path: str = ""


def _as_text(crew_output: Any) -> str:
    """Normalise a CrewAI output object to a plain string."""
    for attr in ("raw", "pydantic", "json_dict"):
        value = getattr(crew_output, attr, None)
        if isinstance(value, str) and value.strip():
            return value
        if value is not None and not isinstance(value, str):
            try:
                return json.dumps(value, ensure_ascii=False, default=str)
            except TypeError:
                pass
    return str(crew_output)


class ClearPathGrowthFlow(Flow[GrowthState]):
    """Research -> content -> compliance -> publish, with a human-review gate."""

    @start()
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
        # The last task output is the teachable moments; the brief is the first.
        tasks_output = getattr(result, "tasks_output", []) or []
        if len(tasks_output) >= 2:
            self.state.morning_brief = _as_text(tasks_output[0])
            self.state.teachable_moments = _as_text(tasks_output[-1])
        else:
            self.state.morning_brief = _as_text(result)
            self.state.teachable_moments = ""

    @listen(gather_intelligence)
    def produce_content(self) -> None:
        research_payload = (
            f"MORNING BRIEF:\n{self.state.morning_brief}\n\n"
            f"TEACHABLE MOMENTS:\n{self.state.teachable_moments}"
        )
        result = (
            ContentFactoryCrew()
            .crew()
            .kickoff(
                inputs={
                    "run_date": self.state.run_date,
                    "research_payload": research_payload,
                }
            )
        )
        self.state.content_batch = _as_text(result)

    @listen(produce_content)
    def enforce_compliance(self) -> None:
        result = (
            ComplianceGuardianCrew()
            .crew()
            .kickoff(inputs={"content_payload": self.state.content_batch})
        )
        report = _as_text(result)
        self.state.compliance_report = report

        verdict = "needs_revision"
        try:
            parsed = json.loads(report)
            if isinstance(parsed, dict) and parsed.get("verdict") == "approved":
                verdict = "approved"
        except (json.JSONDecodeError, TypeError):
            # If the auditor didn't return clean JSON, fail safe.
            verdict = "needs_revision"
        self.state.verdict = verdict

    @router(enforce_compliance)
    def route_on_verdict(self) -> str:
        if self.state.verdict == "approved":
            return "approved"
        return "needs_revision"

    @listen("approved")
    def publish_batch(self) -> str:
        self.state.requires_human_review = force_human_review()
        status = "pending_human_review" if self.state.requires_human_review else "ready_to_publish"

        batch = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "run_date": self.state.run_date,
            "status": status,
            "compliance_verdict": self.state.verdict,
            "morning_brief": self.state.morning_brief,
            "teachable_moments": _safe_load(self.state.teachable_moments),
            "content_queue": _safe_load(self.state.content_batch),
            "compliance_report": _safe_load(self.state.compliance_report),
        }

        out_path = output_dir() / f"growth_batch_{self.state.run_date}.json"
        out_path.write_text(json.dumps(batch, ensure_ascii=False, indent=2), encoding="utf-8")
        self.state.published_path = str(out_path)

        print(f"\n[ClearPath Growth OS] Batch written -> {out_path}")
        print(f"[ClearPath Growth OS] Status: {status}")
        if self.state.requires_human_review:
            print("[ClearPath Growth OS] FORCE_HUMAN_REVIEW is on — approve before scheduling.")
        return str(out_path)

    @listen("needs_revision")
    def flag_for_revision(self) -> str:
        out_path = output_dir() / f"growth_flags_{self.state.run_date}.json"
        out_path.write_text(
            json.dumps(
                {
                    "generated_at": datetime.now(timezone.utc).isoformat(),
                    "run_date": self.state.run_date,
                    "status": "blocked_by_compliance",
                    "compliance_report": _safe_load(self.state.compliance_report),
                    "content_queue": _safe_load(self.state.content_batch),
                },
                ensure_ascii=False,
                indent=2,
            ),
            encoding="utf-8",
        )
        self.state.published_path = str(out_path)
        print(f"\n[ClearPath Growth OS] Compliance flagged content -> {out_path}")
        return str(out_path)


def _safe_load(text: str) -> Any:
    """Return parsed JSON if ``text`` is JSON, else the raw string."""
    if not text:
        return None
    try:
        return json.loads(text)
    except (json.JSONDecodeError, TypeError):
        return text


def kickoff() -> None:
    """Entry point: run the full growth flow once."""
    ClearPathGrowthFlow().kickoff()


def plot() -> None:
    """Render the flow graph to an HTML file (crewai visualisation)."""
    ClearPathGrowthFlow().plot("clearpath_growth_os")
    print("Saved flow diagram to clearpath_growth_os.html")


if __name__ == "__main__":
    kickoff()
