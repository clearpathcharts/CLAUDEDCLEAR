"""Map an approved Plant-the-Flag batch into normalized platform posts.

Deterministic and defensive: crew outputs may be JSON strings, already-parsed
objects, "skipped" markers, or slightly off-shape. This turns whatever shape the
batch has into a clean ``list[PlatformPost]`` the posting adapter understands.
"""

from __future__ import annotations

import json
from typing import Any

from .publishing.base import PlatformPost


def _coerce(value: Any) -> Any:
    """Parse JSON strings; pass through objects; None stays None."""
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, ValueError):
            return value
    return value


def _is_skipped(obj: Any) -> bool:
    return isinstance(obj, dict) and "skipped" in obj


def _target_platform_for_seed(target: str) -> str:
    t = (target or "").lower()
    if "quora" in t:
        return "quora"
    return "reddit"


def batch_to_posts(batch: dict) -> list[PlatformPost]:
    """Return the ordered list of platform posts contained in ``batch``."""
    posts: list[PlatformPost] = []

    omni = _coerce(batch.get("omnipresence")) or {}
    if isinstance(omni, dict):
        posts.extend(_map_x(_coerce(omni.get("x_pack"))))
        posts.extend(_map_linkedin(_coerce(omni.get("linkedin"))))
        posts.extend(_map_shortform(_coerce(omni.get("shortform"))))

    seo = _coerce(batch.get("seo"))
    if isinstance(seo, dict) and not _is_skipped(seo):
        posts.extend(_map_seo(seo))

    seeding = _coerce(batch.get("seeding"))
    if isinstance(seeding, list):
        posts.extend(_map_seeding(seeding))

    return posts


def _map_x(x_pack: Any) -> list[PlatformPost]:
    out: list[PlatformPost] = []
    if not isinstance(x_pack, dict):
        return out
    for item in x_pack.get("x_posts", []) or []:
        if isinstance(item, dict):
            copy = item.get("copy") or item.get("text") or ""
        else:
            copy = str(item)
        if copy:
            out.append(
                PlatformPost(
                    platform="x",
                    kind="post",
                    text=copy,
                    target_page=(item.get("target_page", "") if isinstance(item, dict) else ""),
                    meta={"pillar": item.get("pillar")} if isinstance(item, dict) else {},
                )
            )
    thread = x_pack.get("x_thread")
    if isinstance(thread, dict):
        posts = [str(p) for p in (thread.get("posts") or []) if str(p).strip()]
        if posts:
            out.append(
                PlatformPost(
                    platform="x",
                    kind="thread",
                    text=posts[0],
                    thread=posts,
                    target_page=thread.get("target_page", ""),
                )
            )
    return out


def _map_linkedin(linkedin: Any) -> list[PlatformPost]:
    if not isinstance(linkedin, dict):
        return []
    copy = linkedin.get("copy") or linkedin.get("text") or ""
    if not copy:
        return []
    return [
        PlatformPost(
            platform="linkedin",
            kind="post",
            text=copy,
            target_page=linkedin.get("target_page", ""),
            meta={"hashtags": linkedin.get("hashtags", [])},
        )
    ]


def _map_shortform(shortform: Any) -> list[PlatformPost]:
    out: list[PlatformPost] = []
    if not isinstance(shortform, list):
        return out
    for script in shortform:
        if not isinstance(script, dict):
            continue
        caption = script.get("caption") or script.get("hook") or script.get("concept") or ""
        out.append(
            PlatformPost(
                platform="tiktok",
                kind="video_script",
                text=caption,
                meta={
                    "concept": script.get("concept"),
                    "hook": script.get("hook"),
                    "beats": script.get("beats", []),
                    "onscreen_text": script.get("onscreen_text", []),
                    "hashtags": script.get("hashtags", []),
                },
            )
        )
    return out


def _map_seo(seo: dict) -> list[PlatformPost]:
    out: list[PlatformPost] = []
    pillar = seo.get("pillar")
    if isinstance(pillar, dict):
        out.append(
            PlatformPost(
                platform="blog",
                kind="article",
                text=pillar.get("title", "Pillar article"),
                target_page=pillar.get("related_page", ""),
                meta={"slug": pillar.get("slug"), "meta_description": pillar.get("meta_description")},
            )
        )
    cluster = seo.get("cluster")
    if isinstance(cluster, list):
        for item in cluster:
            if isinstance(item, dict) and item.get("title"):
                out.append(
                    PlatformPost(
                        platform="blog",
                        kind="article",
                        text=item.get("title"),
                        target_page=item.get("internal_link", ""),
                        meta={"target_keyword": item.get("target_keyword")},
                    )
                )
    return out


def _map_seeding(seeding: list) -> list[PlatformPost]:
    out: list[PlatformPost] = []
    for item in seeding:
        if not isinstance(item, dict):
            continue
        answer = item.get("answer") or ""
        if not answer:
            continue
        out.append(
            PlatformPost(
                platform=_target_platform_for_seed(item.get("target", "")),
                kind="answer",
                text=answer,
                target_page=item.get("link", "") if item.get("includes_link") else "",
                meta={"target": item.get("target"), "assumed_question": item.get("assumed_question")},
            )
        )
    return out
