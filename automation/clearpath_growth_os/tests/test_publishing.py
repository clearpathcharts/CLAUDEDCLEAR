"""Tests for the posting adapters and the human-gated publisher."""

from __future__ import annotations

import json
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from clearpath_growth_os.publishing import get_adapter  # noqa: E402
from clearpath_growth_os.publishing.base import PlatformPost  # noqa: E402
from clearpath_growth_os.publishing.dryrun import DryRunAdapter  # noqa: E402
from clearpath_growth_os.publisher import PublishBlocked, publish_batch  # noqa: E402


def test_default_adapter_is_dryrun(monkeypatch):
    monkeypatch.delenv("POSTING_PROVIDER", raising=False)
    assert isinstance(get_adapter(), DryRunAdapter)


def test_dryrun_publishes_without_network():
    adapter = DryRunAdapter()
    res = adapter.publish(PlatformPost(platform="x", kind="post", text="hello"))
    assert res.ok is True
    assert res.dry_run is True
    assert res.external_id is None


def test_unknown_provider_raises():
    with pytest.raises(ValueError):
        get_adapter("make.com")


def test_ayrshare_handles_non_text_platforms_without_key(monkeypatch):
    monkeypatch.delenv("AYRSHARE_API_KEY", raising=False)
    adapter = get_adapter("ayrshare")
    # Video scripts are skipped (need media), community answers are manual.
    r_script = adapter.publish(PlatformPost(platform="tiktok", kind="video_script", text="x"))
    r_reddit = adapter.publish(PlatformPost(platform="reddit", kind="answer", text="x"))
    r_x = adapter.publish(PlatformPost(platform="x", kind="post", text="x"))
    assert r_script.ok is True and "media" in r_script.detail
    assert r_reddit.ok is True and "manual" in r_reddit.detail
    assert r_x.ok is False and "AYRSHARE_API_KEY" in r_x.detail  # would-post but no key


def _write_batch(path: Path, status: str) -> Path:
    batch = {
        "run_date": "2026-07-14",
        "status": status,
        "omnipresence": {
            "x_pack": {"x_posts": [{"copy": "hi"}], "x_thread": {"posts": ["a", "b"]}},
            "linkedin": {"copy": "credible post"},
            "shortform": [{"caption": "script"}],
        },
        "seo": {"skipped": "not a pillar day"},
        "seeding": [],
    }
    path.write_text(json.dumps(batch), encoding="utf-8")
    return path


def test_publisher_blocks_unapproved(tmp_path):
    batch = _write_batch(tmp_path / "plant_the_flag_2026-07-14.json", "pending_human_review")
    with pytest.raises(PublishBlocked):
        publish_batch(batch, provider="dryrun")


def test_publisher_posts_when_approved_flag(tmp_path):
    batch = _write_batch(tmp_path / "plant_the_flag_2026-07-14.json", "pending_human_review")
    receipt = publish_batch(batch, provider="dryrun", approved=True)
    assert receipt["provider"] == "dryrun"
    assert receipt["ok"] == receipt["total"] > 0
    assert (tmp_path / "plant_the_flag_2026-07-14.published.json").exists()


def test_publisher_posts_when_status_ready(tmp_path):
    batch = _write_batch(tmp_path / "plant_the_flag_2026-07-14.json", "approved_for_publish")
    receipt = publish_batch(batch, provider="dryrun")
    assert receipt["ok"] > 0
