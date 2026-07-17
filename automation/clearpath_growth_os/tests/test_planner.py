"""Tests for the deterministic daily planner."""

from __future__ import annotations

import sys
from datetime import date, timedelta
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from clearpath_growth_os.campaign import CADENCE, PILLARS  # noqa: E402
from clearpath_growth_os.planner import build_daily_plan  # noqa: E402

PHASE_START = date(2026, 7, 13)  # a Monday


def test_day_index_and_weekday():
    plan = build_daily_plan(PHASE_START, PHASE_START)
    assert plan.day_index == 1
    assert plan.weekday == 0  # Monday

    plan2 = build_daily_plan(PHASE_START + timedelta(days=3), PHASE_START)
    assert plan2.day_index == 4
    assert plan2.weekday == 3  # Thursday


def test_monday_is_pillar_day():
    plan = build_daily_plan(PHASE_START, PHASE_START)  # Monday
    assert plan.seo.is_pillar_day is True
    assert plan.seo.pillar_slug is not None
    # 8-10 supporting posts.
    assert 8 <= len(plan.seo.supporting_posts) <= 10
    assert len(plan.seo.supporting_posts) == CADENCE.supporting_posts_per_pillar


def test_tuesday_is_not_pillar_but_is_seeding():
    tue = PHASE_START + timedelta(days=1)
    plan = build_daily_plan(tue, PHASE_START)
    assert plan.seo.is_pillar_day is False
    assert plan.seeding.is_seeding_day is True
    assert plan.seeding.answers_to_produce == CADENCE.seeding_answers_per_session
    assert len(plan.seeding.targets) == CADENCE.seeding_answers_per_session


def test_sunday_is_quiet_for_seo_and_seeding():
    sun = PHASE_START + timedelta(days=6)
    plan = build_daily_plan(sun, PHASE_START)
    assert plan.seo.is_pillar_day is False
    assert plan.seeding.is_seeding_day is False


def test_channels_match_cadence_every_day():
    for offset in range(30):
        plan = build_daily_plan(PHASE_START + timedelta(days=offset), PHASE_START)
        assert plan.channels.x_posts == CADENCE.x_posts_per_day
        assert plan.channels.x_threads == CADENCE.x_threads_per_day
        assert plan.channels.linkedin_posts == CADENCE.linkedin_posts_per_day
        assert plan.channels.shortform_scripts == CADENCE.shortform_scripts_per_day


def test_pillars_rotate_across_pillar_days():
    seen = []
    d = PHASE_START
    while len(seen) < len(PILLARS):
        plan = build_daily_plan(d, PHASE_START)
        if plan.seo.is_pillar_day:
            seen.append(plan.seo.pillar_slug)
        d += timedelta(days=1)
    # First len(PILLARS) pillar-days should cover all pillars in order.
    assert seen == [p.slug for p in PILLARS]


def test_deterministic_reproducibility():
    a = build_daily_plan(PHASE_START + timedelta(days=5), PHASE_START)
    b = build_daily_plan(PHASE_START + timedelta(days=5), PHASE_START)
    assert a.to_dict() == b.to_dict()


def test_keyword_focus_has_two_terms():
    plan = build_daily_plan(PHASE_START, PHASE_START)
    assert len(plan.keyword_focus) == 2
    assert all(isinstance(k, str) and k for k in plan.keyword_focus)
