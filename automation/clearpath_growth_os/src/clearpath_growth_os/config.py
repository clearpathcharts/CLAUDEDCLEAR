"""Runtime configuration read from the environment."""

from __future__ import annotations

import os
from pathlib import Path


def api_base() -> str:
    """Base URL of the ClearPath Trader server (server.ts)."""
    return os.getenv("CLEARPATH_API_BASE", "http://localhost:3000").rstrip("/")


def output_dir() -> Path:
    """Directory where approved content batches are written for hand-off."""
    path = Path(os.getenv("GROWTH_OS_OUTPUT_DIR", "./output")).expanduser()
    path.mkdir(parents=True, exist_ok=True)
    return path


def force_human_review() -> bool:
    """When true, the compliance router always defers to a human approver."""
    return os.getenv("FORCE_HUMAN_REVIEW", "true").strip().lower() in {"1", "true", "yes", "on"}


# Reasonable timeout for the local/remote API calls the tools make.
REQUEST_TIMEOUT_SECONDS = float(os.getenv("CLEARPATH_API_TIMEOUT", "30"))
