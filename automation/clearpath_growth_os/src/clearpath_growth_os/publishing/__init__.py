"""Pluggable posting layer.

The engine (CrewAI) produces content; this layer is the *hands* that put it on
platforms. It is deliberately thin and swappable:

  * ``dryrun``  (default) — logs exactly what WOULD post, no network. Lets the
    whole pipeline run end-to-end today with zero paid accounts.
  * ``ayrshare`` — one API key posts to X/LinkedIn/etc. (the only piece worth
    paying for: social OAuth). Snap it in with POSTING_PROVIDER=ayrshare.

Add another provider by implementing :class:`PostingAdapter` and registering it
in :func:`get_adapter`.
"""

from __future__ import annotations

import os

from .base import PlatformPost, PostingAdapter, PostResult
from .dryrun import DryRunAdapter


def get_adapter(provider: str | None = None) -> PostingAdapter:
    """Return the configured posting adapter.

    Provider resolution: explicit arg -> ``POSTING_PROVIDER`` env -> "dryrun".
    """
    name = (provider or os.getenv("POSTING_PROVIDER") or "dryrun").strip().lower()
    if name in {"dryrun", "dry-run", "noop", ""}:
        return DryRunAdapter()
    if name == "ayrshare":
        from .ayrshare import AyrshareAdapter

        return AyrshareAdapter()
    raise ValueError(f"Unknown POSTING_PROVIDER '{name}' (use 'dryrun' or 'ayrshare').")


__all__ = ["PlatformPost", "PostingAdapter", "PostResult", "DryRunAdapter", "get_adapter"]
