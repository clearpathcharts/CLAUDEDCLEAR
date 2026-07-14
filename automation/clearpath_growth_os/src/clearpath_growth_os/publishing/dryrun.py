"""Dry-run posting adapter — the safe default.

Logs exactly what would be posted and returns success without touching any
network. This lets the entire produce -> approve -> publish pipeline run
end-to-end with no paid accounts, and doubles as a preview of the day's output.
"""

from __future__ import annotations

from .base import PlatformPost, PostingAdapter, PostResult


class DryRunAdapter(PostingAdapter):
    name = "dryrun"

    def publish(self, post: PlatformPost) -> PostResult:
        print(f"  [DRY-RUN would post] {post.summary()}")
        return PostResult(
            platform=post.platform,
            kind=post.kind,
            ok=True,
            dry_run=True,
            external_id=None,
            detail="dry-run: not actually posted",
        )
