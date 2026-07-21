"""Tests for the KPI tracker."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from clearpath_growth_os.kpi import build_report  # noqa: E402


def _write_batch(d: Path, run_date: str, articles: int, social: int, seeding: int):
    (d / f"plant_the_flag_{run_date}.json").write_text(
        json.dumps(
            {"run_date": run_date, "metrics": {"articles": articles, "social_posts": social, "seeding_answers": seeding}}
        ),
        encoding="utf-8",
    )


def test_rollup_across_batches(tmp_path: Path):
    _write_batch(tmp_path, "2026-07-13", articles=10, social=7, seeding=0)
    _write_batch(tmp_path, "2026-07-14", articles=0, social=7, seeding=3)
    report = build_report(tmp_path).to_dict()

    assert report["days_run"] == 2
    assert report["articles"]["produced"] == 10
    assert report["social_posts"]["produced"] == 14
    assert report["seeding_answers"]["produced"] == 3
    assert report["articles"]["target"] == 90
    assert report["social_posts"]["target"] == 300


def test_actuals_override_and_waitlist(tmp_path: Path):
    _write_batch(tmp_path, "2026-07-13", articles=10, social=7, seeding=0)
    report = build_report(
        tmp_path, actuals={"articles_indexed": 42, "waitlist_signups": 3120, "top_video_views": 61000}
    ).to_dict()

    assert report["articles"]["produced"] == 42  # actual indexed overrides produced
    assert report["waitlist"]["signups"] == 3120
    assert report["waitlist"]["on_track"] is True
    assert report["viral_video"]["on_track"] is True


def test_empty_dir(tmp_path: Path):
    report = build_report(tmp_path).to_dict()
    assert report["days_run"] == 0
    assert report["social_posts"]["produced"] == 0
