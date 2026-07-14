"""Tests for the deterministic batch -> platform posts mapper."""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from clearpath_growth_os.batch_mapper import batch_to_posts  # noqa: E402


def _sample_batch(as_strings: bool = False) -> dict:
    omni = {
        "x_pack": {
            "x_posts": [
                {"copy": "Education first, not signals.", "pillar": "not-a-broker", "target_page": "/trading-ai"},
                {"copy": "Gold held firm today.", "pillar": "brief"},
            ],
            "x_thread": {"posts": ["Hook line", "Point 1", "Point 2", "Soft CTA"], "target_page": "/learn"},
        },
        "linkedin": {"copy": "Cognitive diversity is a serious edge.", "target_page": "/about", "hashtags": ["#fintech"]},
        "shortform": [
            {"concept": "sensory overload", "hook": "POV: your app overwhelms you", "caption": "Switch layouts", "hashtags": ["#adhd"]},
        ],
    }
    seo = {
        "pillar": {"title": "What Is Inflation?", "slug": "inflation", "related_page": "/learn/inflation"},
        "cluster": [
            {"title": "CPI for beginners", "target_keyword": "cpi explained", "internal_link": "/learn/inflation"},
            {"title": "Inflation vs savings", "internal_link": "/learn/inflation"},
        ],
    }
    seeding = [
        {"target": "r/ADHD", "answer": "Here's a calm way to follow markets...", "includes_link": True, "link": "/trading-ai"},
        {"target": "Quora: trading for beginners", "answer": "Start with education...", "includes_link": False},
    ]
    if as_strings:
        return {"omnipresence": json.dumps(omni), "seo": json.dumps(seo), "seeding": json.dumps(seeding)}
    return {"omnipresence": omni, "seo": seo, "seeding": seeding}


def test_maps_all_channels():
    posts = batch_to_posts(_sample_batch())
    platforms = [(p.platform, p.kind) for p in posts]

    assert ("x", "post") in platforms
    assert ("x", "thread") in platforms
    assert ("linkedin", "post") in platforms
    assert ("tiktok", "video_script") in platforms
    assert ("blog", "article") in platforms
    assert ("reddit", "answer") in platforms
    assert ("quora", "answer") in platforms


def test_counts():
    posts = batch_to_posts(_sample_batch())
    x_posts = [p for p in posts if p.platform == "x" and p.kind == "post"]
    threads = [p for p in posts if p.kind == "thread"]
    articles = [p for p in posts if p.platform == "blog"]
    assert len(x_posts) == 2
    assert len(threads) == 1
    assert threads[0].thread == ["Hook line", "Point 1", "Point 2", "Soft CTA"]
    assert len(articles) == 3  # 1 pillar + 2 cluster


def test_accepts_json_string_values():
    posts = batch_to_posts(_sample_batch(as_strings=True))
    assert any(p.platform == "linkedin" for p in posts)
    assert any(p.kind == "thread" for p in posts)


def test_seeding_link_only_when_included():
    posts = batch_to_posts(_sample_batch())
    seeds = {p.meta.get("target"): p for p in posts if p.kind == "answer"}
    assert seeds["r/ADHD"].target_page == "/trading-ai"
    assert seeds["Quora: trading for beginners"].target_page == ""


def test_skipped_seo_and_missing_fields():
    batch = {"omnipresence": {"x_pack": {"x_posts": []}}, "seo": {"skipped": "not a pillar day"}, "seeding": []}
    posts = batch_to_posts(batch)
    assert all(p.platform != "blog" for p in posts)


def test_images_attached_to_relevant_posts():
    batch = _sample_batch()
    batch["images"] = ["https://clearpathtrader.com/growth-assets/p/hero.png", "https://clearpathtrader.com/growth-assets/p/chart.jpg"]
    posts = batch_to_posts(batch)

    linkedin = next(p for p in posts if p.platform == "linkedin")
    tiktok = next(p for p in posts if p.platform == "tiktok")
    blog = next(p for p in posts if p.platform == "blog")
    x_with_media = [p for p in posts if p.platform == "x" and p.media_urls]

    assert linkedin.media_urls == [batch["images"][0]]
    assert tiktok.media_urls == batch["images"]  # scripts reference all images
    assert blog.media_urls == batch["images"]
    assert len(x_with_media) == 1  # only the first X item gets the image
