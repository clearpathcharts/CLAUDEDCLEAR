"""Image asset handling for submissions.

Social APIs (e.g. Ayrshare) attach media by **public URL**, so submitted images
must be reachable on the web. The simplest owned option: copy them into the
ClearPath server's ``public/`` folder (already served at your domain) and build
the URL from your public base.

Config:
  * ``CLEARPATH_PUBLIC_DIR``  — local path to the served public dir
                               (default: <repo>/public if it exists, else ./output/assets)
  * ``CLEARPATH_PUBLIC_BASE`` — public origin (default: CLEARPATH_API_BASE)

If images are already URLs (http/https), they pass through untouched.
"""

from __future__ import annotations

import os
import shutil
from pathlib import Path

from .config import api_base, output_dir


def public_base() -> str:
    return (os.getenv("CLEARPATH_PUBLIC_BASE") or api_base()).rstrip("/")


def public_dir() -> Path:
    explicit = os.getenv("CLEARPATH_PUBLIC_DIR")
    if explicit:
        p = Path(explicit).expanduser()
    else:
        # Try the app's public/ (served by server.ts); fall back to output/assets.
        candidate = Path.cwd() / "public"
        p = candidate if candidate.is_dir() else (output_dir() / "assets")
    p.mkdir(parents=True, exist_ok=True)
    return p


def publish_assets(image_paths: list, subdir: str) -> list[str]:
    """Copy local images into ``public_dir()/growth-assets/<subdir>`` and return
    their public URLs. Pass-through for values already starting with http."""
    urls: list[str] = []
    if not image_paths:
        return urls

    base = public_base()
    rel_root = f"growth-assets/{subdir}".strip("/")
    dest_root = public_dir() / "growth-assets" / subdir
    dest_root.mkdir(parents=True, exist_ok=True)

    for img in image_paths:
        s = str(img)
        if s.startswith("http://") or s.startswith("https://"):
            urls.append(s)
            continue
        src = Path(s)
        if not src.exists():
            continue
        dest = dest_root / src.name
        shutil.copy2(src, dest)
        urls.append(f"{base}/{rel_root}/{src.name}")
    return urls
