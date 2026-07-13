"""KPI tracker for the 30-day phase.

Aggregates the JSON batches the flow writes to the output directory and rolls
them up against the strategy's 30-day targets (90+ articles, 300+ social posts,
2-5k waitlist signups, one 50k+ video). Pure/deterministic and unit-tested.

Batch files are expected to contain a ``metrics`` block written by the flow:
    {
      "run_date": "2026-07-13",
      "metrics": {
        "articles": 10,       # pillar + supporting posts produced
        "social_posts": 7,    # x posts + threads + linkedin + shortform
        "seeding_answers": 3,
      }
    }
External results (actual indexed articles, real signups, video views) can be
merged in from an ``actuals`` mapping so the report blends produced vs achieved.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field
from pathlib import Path

from .campaign import KPI_TARGETS


@dataclass
class KpiProgress:
    label: str
    produced: int
    target: int

    @property
    def pct(self) -> float:
        if self.target <= 0:
            return 100.0
        return round(min(100.0, (self.produced / self.target) * 100.0), 1)

    def to_dict(self) -> dict:
        return {
            "label": self.label,
            "produced": self.produced,
            "target": self.target,
            "pct": self.pct,
            "on_track": self.produced >= self.target,
        }


@dataclass
class KpiReport:
    days_run: int
    articles: KpiProgress
    social_posts: KpiProgress
    seeding_answers: KpiProgress
    waitlist_signups: int | None = None
    top_video_views: int | None = None
    notes: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        t = KPI_TARGETS
        waitlist_status = None
        if self.waitlist_signups is not None:
            waitlist_status = {
                "signups": self.waitlist_signups,
                "target_low": t.waitlist_signups_low,
                "target_high": t.waitlist_signups_high,
                "on_track": self.waitlist_signups >= t.waitlist_signups_low,
            }
        video_status = None
        if self.top_video_views is not None:
            video_status = {
                "top_views": self.top_video_views,
                "target": t.viral_video_views,
                "on_track": self.top_video_views >= t.viral_video_views,
            }
        return {
            "phase": "30-day Plant the Flag",
            "days_run": self.days_run,
            "phase_days": t.phase_days,
            "articles": self.articles.to_dict(),
            "social_posts": self.social_posts.to_dict(),
            "seeding_answers": self.seeding_answers.to_dict(),
            "waitlist": waitlist_status,
            "viral_video": video_status,
            "notes": self.notes,
        }


def _iter_metrics(output_dir: Path):
    for f in sorted(output_dir.glob("plant_the_flag_*.json")):
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError):
            continue
        metrics = data.get("metrics") if isinstance(data, dict) else None
        if isinstance(metrics, dict):
            yield data.get("run_date"), metrics


def build_report(output_dir: Path, actuals: dict | None = None) -> KpiReport:
    """Roll up all batch files in ``output_dir`` into a KPI report.

    ``actuals`` may supply real-world numbers not derivable from produced
    content, e.g. {"articles_indexed": 42, "waitlist_signups": 3120,
    "top_video_views": 61000}.
    """
    actuals = actuals or {}
    t = KPI_TARGETS

    articles_produced = 0
    social_produced = 0
    seeding_produced = 0
    run_dates: set[str] = set()

    for run_date, metrics in _iter_metrics(output_dir):
        if run_date:
            run_dates.add(run_date)
        articles_produced += int(metrics.get("articles", 0) or 0)
        social_produced += int(metrics.get("social_posts", 0) or 0)
        seeding_produced += int(metrics.get("seeding_answers", 0) or 0)

    # Prefer real indexed count when supplied.
    articles_metric = int(actuals.get("articles_indexed", articles_produced))

    report = KpiReport(
        days_run=len(run_dates),
        articles=KpiProgress("owned articles", articles_metric, t.owned_articles_indexed),
        social_posts=KpiProgress("social posts", social_produced, t.social_posts),
        seeding_answers=KpiProgress("seeding answers", seeding_produced, 20),
        waitlist_signups=actuals.get("waitlist_signups"),
        top_video_views=actuals.get("top_video_views"),
    )

    if report.days_run and report.social_posts.produced < (report.days_run * 8):
        report.notes.append(
            "Social pace below ~8/day; increase X cadence to stay on track for 300."
        )
    if not actuals.get("waitlist_signups"):
        report.notes.append(
            "No live waitlist signup count supplied; pass actuals['waitlist_signups'] for full KPI."
        )
    return report
