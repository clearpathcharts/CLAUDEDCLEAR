"""Approve a batch for publishing (the human 'yes').

Flips a batch's status from ``pending_human_review`` to ``approved_for_publish``
so the publisher will post it. This is the human-in-the-loop control point.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .config import output_dir


def _latest_batch() -> Path | None:
    out = output_dir()
    batches = sorted([*out.glob("plant_the_flag_2*.json"), *out.glob("submission_*.json")], key=lambda p: p.stat().st_mtime)
    batches = [b for b in batches if all(x not in b.name for x in ("flags", "kpi", "published"))]
    return batches[-1] if batches else None


def approve_batch(batch_path: str | Path | None = None) -> Path:
    path = Path(batch_path) if batch_path else _latest_batch()
    if not path or not path.exists():
        raise FileNotFoundError(f"No batch to approve (looked for {path or output_dir()}).")
    batch = json.loads(path.read_text(encoding="utf-8"))
    batch["status"] = "approved_for_publish"
    path.write_text(json.dumps(batch, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[approve] {path.name} -> approved_for_publish")
    return path


def main() -> int:
    ap = argparse.ArgumentParser(description="Approve a Plant-the-Flag batch for publishing.")
    ap.add_argument("batch", nargs="?", help="Path to batch JSON (default: latest).")
    args = ap.parse_args()
    try:
        approve_batch(args.batch)
    except FileNotFoundError as exc:
        print(f"[approve] {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
