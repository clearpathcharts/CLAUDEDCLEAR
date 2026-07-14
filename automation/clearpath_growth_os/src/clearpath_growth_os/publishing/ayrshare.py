"""Ayrshare posting adapter — one API key, many social platforms.

This is the single paid piece worth keeping (it owns the social-OAuth headache).
Set ``POSTING_PROVIDER=ayrshare`` and ``AYRSHARE_API_KEY``.

Only text-postable platforms (X, LinkedIn) are auto-posted here. Video *scripts*
(TikTok/Reels/Shorts) need rendered media, so they are returned as "skipped —
needs media"; community answers (Reddit/Quora) and blog posts are "manual" by
design (they should be posted by a human or the site CMS, not sprayed).
"""

from __future__ import annotations

import os

import requests

from ..config import REQUEST_TIMEOUT_SECONDS
from .base import (
    MANUAL_PLATFORMS,
    SCRIPT_PLATFORMS,
    TEXT_PLATFORMS,
    PlatformPost,
    PostingAdapter,
    PostResult,
)

_AYRSHARE_URL = "https://app.ayrshare.com/api/post"

# Map our platform names to Ayrshare's.
_PLATFORM_MAP = {
    "x": "twitter",
    "linkedin": "linkedin",
}


class AyrshareAdapter(PostingAdapter):
    name = "ayrshare"

    def __init__(self) -> None:
        self.api_key = os.getenv("AYRSHARE_API_KEY", "")

    def publish(self, post: PlatformPost) -> PostResult:
        if post.platform in SCRIPT_PLATFORMS:
            return PostResult(post.platform, post.kind, ok=True, detail="skipped: video script needs rendered media")
        if post.platform in MANUAL_PLATFORMS:
            return PostResult(post.platform, post.kind, ok=True, detail="manual: post via human/CMS, not auto-sprayed")
        if post.platform not in TEXT_PLATFORMS:
            return PostResult(post.platform, post.kind, ok=False, detail=f"unsupported platform: {post.platform}")
        if not self.api_key:
            return PostResult(post.platform, post.kind, ok=False, detail="AYRSHARE_API_KEY not set")

        ayr_platform = _PLATFORM_MAP.get(post.platform)
        if not ayr_platform:
            return PostResult(post.platform, post.kind, ok=False, detail=f"no Ayrshare mapping for {post.platform}")

        body: dict = {"platforms": [ayr_platform]}
        if post.kind == "thread" and post.thread:
            # Ayrshare supports Twitter threads via a list of statuses.
            body["post"] = post.thread[0]
            body["twitterOptions"] = {"thread": True, "threadNumber": False, "post": post.thread}
        else:
            body["post"] = post.text
        if post.media_urls:
            body["mediaUrls"] = post.media_urls

        try:
            resp = requests.post(
                _AYRSHARE_URL,
                json=body,
                headers={"Authorization": f"Bearer {self.api_key}"},
                timeout=REQUEST_TIMEOUT_SECONDS,
            )
            data = resp.json() if resp.content else {}
        except requests.RequestException as exc:
            return PostResult(post.platform, post.kind, ok=False, detail=f"request failed: {exc}")

        status = str(data.get("status", "")).lower()
        ok = resp.ok and status in {"success", "scheduled", ""} and "errors" not in data
        return PostResult(
            platform=post.platform,
            kind=post.kind,
            ok=ok,
            external_id=str(data.get("id")) if data.get("id") else None,
            detail=data.get("status") or (f"HTTP {resp.status_code}" if not ok else "posted"),
        )
