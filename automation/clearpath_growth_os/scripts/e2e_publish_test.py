#!/usr/bin/env python3
"""End-to-end pipeline demo: produce -> gate -> approve -> publish (dry-run).

No LLM key and no paid posting account required. Stubs the crews to produce a
realistic pillar-day batch, then exercises the real publisher path:
  1. produce a batch (status: pending_human_review)
  2. publish attempt is BLOCKED by the approval gate
  3. human approves the batch
  4. publish via the dry-run adapter -> receipt written
"""

from __future__ import annotations

import json
import os
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

os.environ["GROWTH_OS_OUTPUT_DIR"] = tempfile.mkdtemp(prefix="ptf_pub_")
os.environ["POSTING_PROVIDER"] = "dryrun"

import clearpath_growth_os.plant_the_flag as ptf  # noqa: E402
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


BRIEF = "Morning brief: gold firm, USD soft."
TEACH = json.dumps([{"concept": "liquidity", "plain_explanation": "...", "related_page": "/learn/liquidity"}])
X_PACK = json.dumps(
    {
        "x_posts": [
            {"copy": "Education before execution.", "pillar": "not-a-broker", "target_page": "/trading-ai"},
            {"copy": "Pattern scanner flagged a setup on XAU/USD.", "pillar": "pattern"},
            {"copy": "Your app shouldn't fry your senses.", "pillar": "neuro", "target_page": "/trading-ai"},
        ],
        "x_thread": {"posts": ["Why brain-first trading matters:", "1) overload is real", "2) layouts help", "Try it →"], "target_page": "/learn"},
    }
)
LINKEDIN = json.dumps({"copy": "Cognitive diversity is an edge, not an afterthought.", "target_page": "/about", "hashtags": ["#fintech"]})
SHORTFORM = json.dumps([{"concept": "sensory overload", "hook": "POV: your trading app overwhelms you", "caption": "Switch to Low Stimulation", "hashtags": ["#adhd", "#trading"]}])
PILLAR = json.dumps({"title": "What Is Inflation?", "slug": "inflation", "related_page": "/learn/inflation"})
CLUSTER = json.dumps([{"title": "CPI for beginners", "target_keyword": "cpi explained", "internal_link": "/learn/inflation"}])


def _install_stubs():
    ptf.MacroIntelligenceCrew = lambda: _Factory(_Result(BRIEF, [_Task(BRIEF), _Task(TEACH)]))
    ptf.DailyOmnipresenceCrew = lambda: _Factory(_Result(SHORTFORM, [_Task(X_PACK), _Task(LINKEDIN), _Task(SHORTFORM)]))
    ptf.SeoFarmCrew = lambda: _Factory(_Result(CLUSTER, [_Task(PILLAR), _Task(CLUSTER)]))
    ptf.SeedingCrew = lambda: _Factory(_Result("[]"))
    ptf.ComplianceGuardianCrew = lambda: _Factory(_Result(json.dumps({"verdict": "approved", "flags": []})))


def main() -> int:
    _install_stubs()

    # 1. Produce a pillar-day batch (Monday).
    flow = ptf.PlantTheFlagFlow()
    flow.state.run_date = "2026-07-13"
    flow.kickoff()
    batch_path = Path(flow.state.published_path)
    batch = json.loads(batch_path.read_text())
    print(f"\n1) Produced: {batch_path.name} (status={batch['status']})")

    posts = batch_to_posts(batch)
    print(f"   Mapped to {len(posts)} platform posts:")
    for p in posts:
        print("   -", p.summary())

    # 2. Publishing is blocked before approval.
    try:
        publish_batch(batch_path, provider="dryrun")
        print("2) ERROR: publish should have been blocked!")
        return 1
    except PublishBlocked as exc:
        print(f"\n2) Gate held: {str(exc)[:80]}...")

    # 3. Human approves.
    approve_batch(batch_path)

    # 4. Publish via dry-run.
    print("\n4) Publishing (dry-run):")
    receipt = publish_batch(batch_path, provider="dryrun")

    assert receipt["ok"] == receipt["total"] and receipt["total"] > 0
    assert receipt["provider"] == "dryrun"
    assert all(r["dry_run"] for r in receipt["results"])
    assert batch_path.with_suffix(".published.json").exists()

    print(f"\nReceipt: {receipt['ok']}/{receipt['total']} ok via '{receipt['provider']}'.")
    print("ALL E2E PUBLISH ASSERTIONS PASSED")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
