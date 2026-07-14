"""Tests for article/image intake."""

from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from clearpath_growth_os.intake import discover_submissions, parse_frontmatter  # noqa: E402


def test_parse_frontmatter_basic():
    text = "---\ntitle: Hello\ntarget_page: /trading-ai\nplatforms: [x, linkedin]\n---\n# Body\ncontent"
    meta, body = parse_frontmatter(text)
    assert meta["title"] == "Hello"
    assert meta["target_page"] == "/trading-ai"
    assert meta["platforms"] == ["x", "linkedin"]
    assert body.startswith("# Body")


def test_parse_frontmatter_absent():
    text = "# Just a title\nno frontmatter"
    meta, body = parse_frontmatter(text)
    assert meta == {}
    assert body == text


def test_discover_folder_submission_with_images(tmp_path):
    sub_dir = tmp_path / "my-post"
    sub_dir.mkdir()
    (sub_dir / "article.md").write_text("---\ntitle: T\n---\nbody", encoding="utf-8")
    (sub_dir / "hero.png").write_bytes(b"\x89PNG\r\n")
    (sub_dir / "chart.jpg").write_bytes(b"\xff\xd8\xff")
    (sub_dir / "notes.txt").write_text("ignore me", encoding="utf-8")

    subs = discover_submissions(tmp_path)
    assert len(subs) == 1
    s = subs[0]
    assert s.submission_id == "my-post"
    assert s.title == "T"
    assert len(s.image_paths) == 2  # png + jpg, not txt


def test_discover_single_file_submission(tmp_path):
    (tmp_path / "quick-take.md").write_text("# Quick take\nhi", encoding="utf-8")
    subs = discover_submissions(tmp_path)
    assert len(subs) == 1
    assert subs[0].submission_id == "quick-take"
    assert subs[0].title == "Quick take"
    assert subs[0].image_paths == []


def test_underscore_entries_ignored(tmp_path):
    (tmp_path / "_README.md").write_text("doc", encoding="utf-8")
    (tmp_path / "real.md").write_text("# Real", encoding="utf-8")
    subs = discover_submissions(tmp_path)
    assert [s.submission_id for s in subs] == ["real"]


def test_title_falls_back_to_first_heading(tmp_path):
    (tmp_path / "p").mkdir()
    (tmp_path / "p" / "article.md").write_text("# Heading Title\n\nbody text", encoding="utf-8")
    subs = discover_submissions(tmp_path)
    assert subs[0].title == "Heading Title"
