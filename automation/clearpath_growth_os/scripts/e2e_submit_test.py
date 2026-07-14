#!/usr/bin/env python3
"""End-to-end submission demo: drop article+image -> batch -> approve -> publish.

No LLM key, no paid accounts. Creates a temp inbox with an article + a fake
image, stubs the atomizer/compliance crews, runs the real intake/assets/mapper/
publisher code, and shows images flowing through to the (dry-run) posts.
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

_tmp = tempfile.mkdtemp(prefix="ptf_submit_")
os.environ["GROWTH_OS_OUTPUT_DIR"] = str(Path(_tmp) / "output")
os.environ["CLEARPATH_PUBLIC_DIR"] = str(Path(_tmp) / "public")
os.environ["CLEARPATH_PUBLIC_BASE"] = "https://clearpathtrader.com"
os.environ["POSTING_PROVIDER"] = "dryrun"

import clearpath_growth_os.submit as submit  # noqa: E402
from clearpath_growth_os.approve import approve_batch  # noqa: E402
from clearpath_growth_os.batch_mapper import batch_to_posts  # noqa: E402
from clearpath_growth_os.publisher import PublishBlocked, publish_batch  # noqa: E402


class _Task:
    def __init__(self, raw):
        self.raw = raw


class _Result:
    def __init__(self, raw, tasks=None):
        self.raw = raw
        self.tasks_output = tasks or []


class _Factory:
    def __init__(self, result):
        self._r = result

    def crew(self):
        class _C:
            def __init__(self, r):
                self._r = r

            def kickoff(self, inputs=None):
                return self._r

        return _C(self._r)


ATOMIZE = json.dumps(
    {
        "x_pack": {
            "x_posts": [
                {"copy": "If a chart ever made you feel stupid, the chart was the problem.", "target_page": "/trading-ai"},
                {"copy": "14 neuro-adaptive layouts. Not a broker. Just clarity.", "target_page": "/trading-ai"},
            ],
            "x_thread": {"posts": ["Brain-first trading, a thread:", "1) overload is a design failure", "2) pick your layout", "Try it →"], "target_page": "/trading-ai"},
        },
        "linkedin": {"copy": "Financial tools should adapt to cognitive diversity.", "target_page": "/about", "hashtags": ["#fintech", "#accessibility"]},
    }
)
SHORTFORM = json.dumps([{"concept": "sensory overload", "hook": "POV: your trading app overwhelms you", "caption": "Switch to Low Stimulation", "hashtags": ["#adhd"]}])


def _make_inbox() -> Path:
    inbox = Path(_tmp) / "inbox"
    post = inbox / "brain-first"
    post.mkdir(parents=True)
    (post / "article.md").write_text(
        "---\ntitle: Why Brain-First Trading Wins\ntarget_page: /trading-ai\n---\n# Why Brain-First Trading Wins\n\nInterfaces should adapt to your brain.",
        encoding="utf-8",
    )
    (post / "hero.png").write_bytes(b"\x89PNG\r\n\x1a\n fake image bytes")
    return inbox


def main() -> int:
    inbox = _make_inbox()

    # Stub the LLM crews.
    submit.ContentAtomizerCrew = lambda: _Factory(_Result(SHORTFORM, [_Task(ATOMIZE), _Task(SHORTFORM)]))
    submit.ComplianceGuardianCrew = lambda: _Factory(_Result(json.dumps({"verdict": "approved", "flags": []})))

    # 1. You just dropped an article + image; process the inbox.
    print("1) Processing inbox (you submitted 1 article + 1 image)...")
    written = submit.run_inbox(inbox_dir=str(inbox))
    assert len(written) == 1
    batch_path = Path(written[0])
    batch = json.loads(batch_path.read_text())
    print(f"   -> {batch_path.name} (status={batch['status']})")
    print(f"   images hosted: {batch['images']}")
    assert batch["images"] == ["https://clearpathtrader.com/growth-assets/brain-first/hero.png"]
    assert (Path(_tmp) / "public" / "growth-assets" / "brain-first" / "hero.png").exists()

    posts = batch_to_posts(batch)
    print(f"   mapped to {len(posts)} posts:")
    for p in posts:
        media = f"  [img:{len(p.media_urls)}]" if p.media_urls else ""
        print("   -", p.summary(), media)

    # 2. Gate holds until you approve.
    try:
        publish_batch(batch_path, provider="dryrun")
        print("2) ERROR: should have been blocked")
        return 1
    except PublishBlocked:
        print("\n2) Gate held (pending_human_review).")

    # 3. Approve + publish (dry-run).
    approve_batch(batch_path)
    print("\n4) Publishing (dry-run):")
    receipt = publish_batch(batch_path, provider="dryrun")

    with_media = [r for r in receipt["results"] if True]
    assert receipt["ok"] == receipt["total"] and receipt["total"] > 0
    # article (blog), 2 x posts, 1 thread, linkedin, tiktok -> >= 6
    assert receipt["total"] >= 6
    print(f"\nReceipt: {receipt['ok']}/{receipt['total']} ok via '{receipt['provider']}'.")
    print("ALL E2E SUBMIT ASSERTIONS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
