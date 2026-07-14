"""Compliant scarcity-loop engine.

The strategy's scarcity hook ("4,218 spots left in Brazil") is only allowed if
it reflects the *real* country-cap mechanic. The Compliance Guardian explicitly
rejects fabricated urgency, so this engine:

  * computes ``spots_left = cap - registered`` ONLY when a real registered count
    is supplied (via env, a counts file, or an injected callable), and
  * otherwise returns a clearly-labelled ``verified=False`` result with NO
    number, so downstream agents cannot invent one.

Registered counts can come from (in priority order):
  1. an explicit ``counts`` mapping passed to :func:`spots_left`,
  2. a JSON file at ``GROWTH_OS_WAITLIST_COUNTS`` ( {"Brazil": 10782, ...} ),
  3. nothing -> unverified.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass
from pathlib import Path

from .campaign import DEFAULT_COUNTRY_CAP


@dataclass(frozen=True)
class ScarcityResult:
    country: str
    cap: int
    registered: int | None
    spots_left: int | None
    verified: bool
    message: str

    def to_dict(self) -> dict:
        return {
            "country": self.country,
            "cap": self.cap,
            "registered": self.registered,
            "spots_left": self.spots_left,
            "verified": self.verified,
            "message": self.message,
        }


def _load_counts_file() -> dict[str, int]:
    path = os.getenv("GROWTH_OS_WAITLIST_COUNTS")
    if not path:
        return {}
    p = Path(path).expanduser()
    if not p.exists():
        return {}
    try:
        data = json.loads(p.read_text(encoding="utf-8"))
        return {str(k): int(v) for k, v in data.items()}
    except (json.JSONDecodeError, ValueError, TypeError):
        return {}


def spots_left(
    country: str,
    counts: dict[str, int] | None = None,
    cap: int = DEFAULT_COUNTRY_CAP,
) -> ScarcityResult:
    """Return a compliant scarcity result for ``country``.

    ``verified`` is True only when a real registered count is available.
    """
    registered_map = dict(_load_counts_file())
    if counts:
        registered_map.update({str(k): int(v) for k, v in counts.items()})

    registered = registered_map.get(country)
    if registered is None:
        return ScarcityResult(
            country=country,
            cap=cap,
            registered=None,
            spots_left=None,
            verified=False,
            message=(
                f"No verified registered count for {country}; do NOT publish a "
                "spots-left number. Wire a real count via GROWTH_OS_WAITLIST_COUNTS "
                "or the counts argument."
            ),
        )

    registered = max(0, int(registered))
    remaining = max(0, cap - registered)
    return ScarcityResult(
        country=country,
        cap=cap,
        registered=registered,
        spots_left=remaining,
        verified=True,
        message=f"{remaining:,} of {cap:,} free spots left in {country}.",
    )


def scarcity_snapshot(
    countries: list[str],
    counts: dict[str, int] | None = None,
    cap: int = DEFAULT_COUNTRY_CAP,
) -> list[dict]:
    """Compute scarcity results for many countries at once."""
    return [spots_left(c, counts=counts, cap=cap).to_dict() for c in countries]
