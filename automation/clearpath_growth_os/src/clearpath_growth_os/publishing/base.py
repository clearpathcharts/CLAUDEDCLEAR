"""Posting layer contracts."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


# Platforms an adapter may be asked to post to.
TEXT_PLATFORMS = {"x", "linkedin"}
SCRIPT_PLATFORMS = {"tiktok", "reels", "shorts"}  # need rendered media, not auto-postable
MANUAL_PLATFORMS = {"reddit", "quora", "blog"}  # community/owned-site, posted by humans/CMS


@dataclass
class PlatformPost:
    """A single normalized unit of content to publish."""

    platform: str  # x | linkedin | tiktok | reddit | quora | blog | ...
    kind: str  # post | thread | video_script | article | answer
    text: str
    thread: list[str] = field(default_factory=list)  # for X threads
    media_urls: list[str] = field(default_factory=list)
    target_page: str = ""
    meta: dict = field(default_factory=dict)

    def summary(self) -> str:
        body = self.text if self.text else (self.thread[0] if self.thread else "")
        head = body.replace("\n", " ")[:80]
        extra = f" (+{len(self.thread) - 1} more)" if self.kind == "thread" and len(self.thread) > 1 else ""
        return f"[{self.platform}/{self.kind}] {head}{extra}"


@dataclass
class PostResult:
    platform: str
    kind: str
    ok: bool
    dry_run: bool = False
    external_id: str | None = None
    detail: str = ""

    def to_dict(self) -> dict:
        return {
            "platform": self.platform,
            "kind": self.kind,
            "ok": self.ok,
            "dry_run": self.dry_run,
            "external_id": self.external_id,
            "detail": self.detail,
        }


class PostingAdapter(ABC):
    """Base class for a posting backend."""

    name: str = "base"

    @abstractmethod
    def publish(self, post: PlatformPost) -> PostResult:  # pragma: no cover - interface
        ...

    def publish_many(self, posts: list[PlatformPost]) -> list[PostResult]:
        return [self.publish(p) for p in posts]
