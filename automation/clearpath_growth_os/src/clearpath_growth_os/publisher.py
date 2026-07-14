"""Human-gated publisher — the bridge from approved batch to platforms.

Loads a Plant-the-Flag batch, enforces the approval gate, maps it to platform
posts, and dispatches them through the configured posting adapter (dry-run by
default). Writes a receipt next to the batch.

Gate: a batch is publishable only if its ``status`` is ``ready_to_publish`` or
``approved_for_publish``, OR ``approved=True`` is passed explicitly. A batch
left at ``pending_human_review`` is refused — nothing posts without a yes.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from .batch_mapper import batch_to_posts
from .config import output_dir
from .publishing import get_adapter

PUBLISHABLE_STATUSES = {"ready_to_publish", "approved_for_publish"}


class PublishBlocked(RuntimeError):
    """Raised when a batch is not approved for publishing."""


def _latest_batch() -> Path | None:
    out = output_dir()
    batches = sorted([*out.glob("plant_the_flag_2*.json"), *out.glob("submission_*.json")], key=lambda p: p.stat().st_mtime)
    batches = [b for b in batches if all(x not in b.name for x in ("flags", "kpi", "published"))]
    return batches[-1] if batches else None


def publish_batch(
    batch_path: str | Path | None = None,
    provider: str | None = None,
    approved: bool = False,
) -> dict:
    """Publish one batch through the posting adapter. Returns a receipt dict."""
    path = Path(batch_path) if batch_path else _latest_batch()
    if not path or not path.exists():
        raise FileNotFoundError(f"No batch to publish (looked for {path or output_dir()}).")

    batch = json.loads(path.read_text(encoding="utf-8"))
    status = str(batch.get("status", "")).lower()

    if status not in PUBLISHABLE_STATUSES and not approved:
        raise PublishBlocked(
            f"Batch '{path.name}' has status '{status}'. Approve it first "
            f"(growth-os-approve) or pass approved=True. Nothing was posted."
        )

    posts = batch_to_posts(batch)
    adapter = get_adapter(provider)
    print(f"[publisher] Publishing {len(posts)} item(s) via '{adapter.name}' adapter...")
    results = adapter.publish_many(posts)

    ok = sum(1 for r in results if r.ok)
    receipt = {
        "batch": path.name,
        "provider": adapter.name,
        "approved": approved or status in PUBLISHABLE_STATUSES,
        "total": len(results),
        "ok": ok,
        "failed": len(results) - ok,
        "results": [r.to_dict() for r in results],
    }
    receipt_path = path.with_suffix(".published.json")
    receipt_path.write_text(json.dumps(receipt, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[publisher] {ok}/{len(results)} ok via '{adapter.name}'. Receipt -> {receipt_path}")
    return receipt


def main() -> int:
    ap = argparse.ArgumentParser(description="Publish an approved Plant-the-Flag batch.")
    ap.add_argument("batch", nargs="?", help="Path to batch JSON (default: latest).")
    ap.add_argument("--provider", help="Posting provider (dryrun|ayrshare). Default: env POSTING_PROVIDER or dryrun.")
    ap.add_argument("--approved", "--yes", action="store_true", help="Override the approval gate.")
    args = ap.parse_args()
    try:
        publish_batch(args.batch, provider=args.provider, approved=args.approved)
    except (PublishBlocked, FileNotFoundError) as exc:
        print(f"[publisher] {exc}")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
