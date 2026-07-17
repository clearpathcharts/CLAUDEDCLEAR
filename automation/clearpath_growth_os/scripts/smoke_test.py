#!/usr/bin/env python3
"""Smoke-test the ClearPath API tools against a running server.

Usage:
    CLEARPATH_API_BASE=http://localhost:3000 python scripts/smoke_test.py

Does NOT require CrewAI or any LLM key — it exercises the pure HTTP client that
the CrewAI tools wrap, so you can confirm the data plumbing works before
spending tokens on a full flow kickoff.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Allow running from the project root without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))

from clearpath_growth_os import clearpath_client as api  # noqa: E402
from clearpath_growth_os.config import api_base  # noqa: E402


def _check(name: str, fn) -> bool:
    try:
        result = fn()
    except api.ClearPathAPIError as exc:
        print(f"  [FAIL] {name}: {exc}")
        return False
    preview = repr(result)
    if len(preview) > 160:
        preview = preview[:157] + "..."
    print(f"  [ OK ] {name}: {preview}")
    return True


def main() -> int:
    print(f"ClearPath Growth OS smoke test -> {api_base()}\n")
    checks = [
        ("semantic corpus", lambda: api.summarize_corpus(api.get_semantic_content())),
        ("faqs", api.get_faqs),
        ("semantic link", lambda: api.semantic_link("Inflation and liquidity drive the Federal Reserve rate path.")),
        ("news search (gold)", lambda: api.search_news("gold")),
    ]
    results = [_check(name, fn) for name, fn in checks]

    passed = sum(results)
    total = len(results)
    print(f"\n{passed}/{total} checks passed.")
    return 0 if passed == total else 1


if __name__ == "__main__":
    raise SystemExit(main())
