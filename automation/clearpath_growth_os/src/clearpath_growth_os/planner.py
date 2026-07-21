"""Deterministic daily planner for the 30-day "Plant the Flag" phase.

Given a run date (and the phase start date), this computes EXACTLY what should
ship today — with zero LLM involvement — so the plan is reproducible, testable,
and auditable:

  * which day of the phase we're on,
  * the message pillar of the day,
  * whether it's an SEO pillar day (Mon/Wed/Fri) and which pillar + cluster,
  * whether it's a founding-distribution (seeding) day and the targets,
  * the exact channel deliverable counts,
  * the scarcity country of the day.

The crews then *fill in* this plan with actual copy.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass, field
from datetime import date

from .campaign import (
    CADENCE,
    LAUNCH_COUNTRIES,
    LONG_TAIL_KEYWORDS,
    MESSAGE_PILLARS,
    PILLARS,
    Pillar,
)

# Founding-distribution targets (value-first, soft link).
SEEDING_TARGETS: tuple[str, ...] = (
    "r/Daytrading",
    "r/Forex",
    "r/ADHD",
    "r/autism",
    "r/algotrading",
    "Quora: trading for beginners",
    "Quora: neurodivergent focus tools",
)


@dataclass
class SeoPlan:
    is_pillar_day: bool
    pillar_slug: str | None
    pillar_title: str | None
    related_page: str | None
    supporting_posts: list[str] = field(default_factory=list)
    target_keywords: list[str] = field(default_factory=list)


@dataclass
class SeedingPlan:
    is_seeding_day: bool
    answers_to_produce: int
    targets: list[str] = field(default_factory=list)


@dataclass
class ChannelPlan:
    x_posts: int
    x_threads: int
    linkedin_posts: int
    shortform_scripts: int


@dataclass
class DailyPlan:
    run_date: str
    day_index: int  # 1-based within the phase
    weekday: int  # 0=Mon .. 6=Sun
    message_pillar: str
    keyword_focus: list[str]
    scarcity_country: str
    channels: ChannelPlan
    seo: SeoPlan
    seeding: SeedingPlan

    def to_dict(self) -> dict:
        return asdict(self)

    def deliverable_count(self) -> int:
        """Total social/content pieces planned today (for KPI pacing)."""
        c = self.channels
        total = c.x_posts + c.x_threads + c.linkedin_posts + c.shortform_scripts
        if self.seo.is_pillar_day:
            total += 1 + len(self.seo.supporting_posts)
        if self.seeding.is_seeding_day:
            total += self.seeding.answers_to_produce
        return total


def _rotate(seq, index: int):
    return seq[index % len(seq)]


def build_daily_plan(run_date: date, phase_start: date) -> DailyPlan:
    """Compute the deterministic plan for ``run_date``."""
    day_index = (run_date - phase_start).days + 1
    weekday = run_date.weekday()

    message_pillar = _rotate(MESSAGE_PILLARS, day_index - 1)

    # Two long-tail keywords per day, rotating through the list.
    k = LONG_TAIL_KEYWORDS
    start = ((day_index - 1) * 2) % len(k)
    keyword_focus = [k[start], k[(start + 1) % len(k)]]

    scarcity_country = _rotate(LAUNCH_COUNTRIES, day_index - 1)

    channels = ChannelPlan(
        x_posts=CADENCE.x_posts_per_day,
        x_threads=CADENCE.x_threads_per_day,
        linkedin_posts=CADENCE.linkedin_posts_per_day,
        shortform_scripts=CADENCE.shortform_scripts_per_day,
    )

    # SEO: pillar days are Mon/Wed/Fri; rotate which pillar each pillar-day.
    if weekday in CADENCE.seo_pillar_weekdays:
        pillar_day_ordinal = _pillar_day_ordinal(run_date, phase_start)
        pillar: Pillar = _rotate(PILLARS, pillar_day_ordinal)
        n = CADENCE.supporting_posts_per_pillar
        seo = SeoPlan(
            is_pillar_day=True,
            pillar_slug=pillar.slug,
            pillar_title=pillar.title,
            related_page=pillar.related_page,
            supporting_posts=list(pillar.cluster_angles[:n]),
            target_keywords=list(keyword_focus),
        )
    else:
        seo = SeoPlan(is_pillar_day=False, pillar_slug=None, pillar_title=None, related_page=None)

    # Seeding: Tue/Thu, 3 answers/session.
    if weekday in CADENCE.seeding_weekdays:
        offset = day_index % len(SEEDING_TARGETS)
        n = CADENCE.seeding_answers_per_session
        targets = [_rotate(SEEDING_TARGETS, offset + i) for i in range(n)]
        seeding = SeedingPlan(
            is_seeding_day=True,
            answers_to_produce=n,
            targets=targets,
        )
    else:
        seeding = SeedingPlan(is_seeding_day=False, answers_to_produce=0, targets=[])

    return DailyPlan(
        run_date=run_date.isoformat(),
        day_index=day_index,
        weekday=weekday,
        message_pillar=message_pillar,
        keyword_focus=keyword_focus,
        scarcity_country=scarcity_country,
        channels=channels,
        seo=seo,
        seeding=seeding,
    )


def _pillar_day_ordinal(run_date: date, phase_start: date) -> int:
    """How many SEO pillar days have occurred from phase_start..run_date inclusive.

    Used to rotate through the pillars in order across pillar days.
    """
    ordinal = -1
    d = phase_start
    while d <= run_date:
        if d.weekday() in CADENCE.seo_pillar_weekdays:
            ordinal += 1
        d = date.fromordinal(d.toordinal() + 1)
    return max(0, ordinal)
