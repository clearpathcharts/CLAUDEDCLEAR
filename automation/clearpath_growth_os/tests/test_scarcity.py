"""Tests for the compliant scarcity engine."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from clearpath_growth_os.campaign import DEFAULT_COUNTRY_CAP  # noqa: E402
from clearpath_growth_os.scarcity import scarcity_snapshot, spots_left  # noqa: E402


def test_unverified_when_no_count():
    r = spots_left("Brazil")
    assert r.verified is False
    assert r.spots_left is None
    assert "do NOT publish" in r.message


def test_verified_with_real_count():
    r = spots_left("Brazil", counts={"Brazil": 10_782})
    assert r.verified is True
    assert r.spots_left == DEFAULT_COUNTRY_CAP - 10_782
    assert "Brazil" in r.message


def test_spots_left_never_negative():
    r = spots_left("Brazil", counts={"Brazil": 20_000})
    assert r.verified is True
    assert r.spots_left == 0


def test_custom_cap():
    r = spots_left("India", counts={"India": 100}, cap=1_000)
    assert r.cap == 1_000
    assert r.spots_left == 900


def test_snapshot_mixed():
    snap = scarcity_snapshot(["Brazil", "India"], counts={"Brazil": 5_000})
    by_country = {s["country"]: s for s in snap}
    assert by_country["Brazil"]["verified"] is True
    assert by_country["India"]["verified"] is False
