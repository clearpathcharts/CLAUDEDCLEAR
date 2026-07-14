"""Tests for image asset hosting."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from clearpath_growth_os import assets  # noqa: E402


def test_publish_local_images(tmp_path, monkeypatch):
    public = tmp_path / "public"
    monkeypatch.setenv("CLEARPATH_PUBLIC_DIR", str(public))
    monkeypatch.setenv("CLEARPATH_PUBLIC_BASE", "https://clearpathtrader.com")

    img = tmp_path / "hero.png"
    img.write_bytes(b"\x89PNG\r\n")

    urls = assets.publish_assets([img], subdir="my-post")
    assert urls == ["https://clearpathtrader.com/growth-assets/my-post/hero.png"]
    assert (public / "growth-assets" / "my-post" / "hero.png").exists()


def test_http_urls_pass_through(tmp_path, monkeypatch):
    monkeypatch.setenv("CLEARPATH_PUBLIC_DIR", str(tmp_path / "public"))
    urls = assets.publish_assets(["https://cdn.example.com/a.png"], subdir="x")
    assert urls == ["https://cdn.example.com/a.png"]


def test_missing_files_skipped(tmp_path, monkeypatch):
    monkeypatch.setenv("CLEARPATH_PUBLIC_DIR", str(tmp_path / "public"))
    urls = assets.publish_assets([tmp_path / "nope.png"], subdir="x")
    assert urls == []


def test_empty_list(tmp_path, monkeypatch):
    monkeypatch.setenv("CLEARPATH_PUBLIC_DIR", str(tmp_path / "public"))
    assert assets.publish_assets([], subdir="x") == []
