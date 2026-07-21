"""Apify and YouTube research tools for competitor and social listening agents."""

from __future__ import annotations

import json
import os
from typing import Any, Type
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

from crewai.tools import BaseTool
from pydantic import BaseModel, Field

# Outbound HTTP allowlist — blocks SSRF to internal/metadata hosts (Aikido).
_ALLOWED_HTTP_HOST_SUFFIXES = (
    "api.apify.com",
    "apify.com",
    "www.googleapis.com",
    "youtube.googleapis.com",
    "clearpathtrader.com",
    "www.clearpathtrader.com",
)


def _assert_safe_outbound_url(url: str) -> None:
    parsed = urlparse(url)
    if parsed.scheme not in ("https",):
        raise ValueError("Only https outbound URLs are permitted")
    host = (parsed.hostname or "").lower()
    if not host or host == "localhost" or host.endswith(".local"):
        raise ValueError("Blocked host")
    if not any(host == suffix or host.endswith("." + suffix) for suffix in _ALLOWED_HTTP_HOST_SUFFIXES):
        raise ValueError(f"Host not allowlisted for outbound fetch: {host}")


def _http_json(
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    body: dict[str, Any] | None = None,
    timeout: int = 120,
) -> dict[str, Any]:
    _assert_safe_outbound_url(url)
    data = None
    req_headers = {"Accept": "application/json", **(headers or {})}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        req_headers["Content-Type"] = "application/json"
    request = Request(url, data=data, headers=req_headers, method=method)
    with urlopen(request, timeout=timeout) as response:
        payload = response.read().decode("utf-8")
        return json.loads(payload) if payload else {}


class ApifyRedditScraperInput(BaseModel):
    subreddit: str = Field(
        ...,
        description="Subreddit name without r/ prefix, e.g. Daytrading, TradingView, Webull",
    )
    search_terms: str = Field(
        default="",
        description="Optional comma-separated frustration keywords, e.g. clutter,lag,crash,overload",
    )
    max_items: int = Field(default=25, description="Maximum posts/comments to return (1-100)")


class ApifyRedditScraperTool(BaseTool):
    name: str = "apify_reddit_scraper"
    description: str = (
        "Scrape public Reddit posts and comments from a trading subreddit via Apify. "
        "Use for competitor pain harvesting and social listening. Returns post title, body, "
        "score, URL, and created date. Never fabricate quotes."
    )
    args_schema: Type[BaseModel] = ApifyRedditScraperInput

    def _run(self, subreddit: str, search_terms: str = "", max_items: int = 25) -> str:
        api_key = os.getenv("APIFY_API_KEY", "").strip()
        actor_id = os.getenv(
            "APIFY_REDDIT_ACTOR_ID", "trudax/reddit-scraper-lite"
        ).strip()
        max_items = max(1, min(max_items, 100))

        if not api_key:
            return json.dumps(
                {
                    "error": "APIFY_API_KEY_NOT_CONFIGURED",
                    "instruction": (
                        "Set APIFY_API_KEY in AMP environment. "
                        "Fall back to Serper site:reddit.com searches and cite URLs."
                    ),
                    "subreddit": subreddit,
                    "search_terms": search_terms,
                },
                indent=2,
            )

        actor_input: dict[str, Any] = {
            "startUrls": [
                {
                    "url": f"https://www.reddit.com/r/{subreddit.strip().lstrip('r/')}/"
                }
            ],
            "maxItems": max_items,
            "proxy": {"useApifyProxy": True},
        }
        if search_terms.strip():
            actor_input["searchTerms"] = [
                term.strip() for term in search_terms.split(",") if term.strip()
            ]

        try:
            run_url = (
                f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
                f"?token={api_key}&timeout=120"
            )
            items = _http_json("POST", run_url, body=actor_input, timeout=130)
            if isinstance(items, dict) and items.get("error"):
                raise RuntimeError(items.get("error", "Apify actor failed"))

            normalized = []
            for item in items if isinstance(items, list) else []:
                if not isinstance(item, dict):
                    continue
                normalized.append(
                    {
                        "title": item.get("title") or item.get("postTitle"),
                        "body": item.get("body") or item.get("text") or item.get("selftext"),
                        "url": item.get("url") or item.get("postUrl"),
                        "author": item.get("author") or item.get("username"),
                        "score": item.get("score") or item.get("upvotes"),
                        "createdAt": item.get("createdAt") or item.get("time"),
                        "subreddit": item.get("subreddit") or subreddit,
                    }
                )

            return json.dumps(
                {
                    "source": "apify_reddit",
                    "subreddit": subreddit,
                    "search_terms": search_terms,
                    "count": len(normalized),
                    "items": normalized[:max_items],
                },
                indent=2,
            )
        except Exception as exc:
            return json.dumps(
                {
                    "error": "APIFY_REDDIT_UNAVAILABLE",
                    "message": str(exc),
                    "instruction": (
                        "Report the data gap. Use Serper/Tavily with site:reddit.com and cite exact URLs."
                    ),
                    "subreddit": subreddit,
                },
                indent=2,
            )


class ApifyAppStoreReviewsInput(BaseModel):
    app_store_url: str = Field(
        ...,
        description="Apple App Store or Google Play URL for a competitor trading app",
    )
    max_reviews: int = Field(default=30, description="Maximum reviews to return (1-100)")


class ApifyAppStoreReviewsTool(BaseTool):
    name: str = "apify_app_store_reviews"
    description: str = (
        "Scrape 1-3 star app store reviews for competitor trading apps via Apify. "
        "Use for competitor pain-point harvesting. Returns rating, title, text, date, and URL."
    )
    args_schema: Type[BaseModel] = ApifyAppStoreReviewsInput

    def _run(self, app_store_url: str, max_reviews: int = 30) -> str:
        api_key = os.getenv("APIFY_API_KEY", "").strip()
        actor_id = os.getenv(
            "APIFY_APP_REVIEWS_ACTOR_ID", "agents/appstore-reviews-scraper"
        ).strip()
        max_reviews = max(1, min(max_reviews, 100))

        if not api_key:
            return json.dumps(
                {
                    "error": "APIFY_API_KEY_NOT_CONFIGURED",
                    "instruction": (
                        "Set APIFY_API_KEY. Fall back to Serper site:play.google.com or "
                        "site:apps.apple.com searches."
                    ),
                    "app_store_url": app_store_url,
                },
                indent=2,
            )

        try:
            run_url = (
                f"https://api.apify.com/v2/acts/{actor_id}/run-sync-get-dataset-items"
                f"?token={api_key}&timeout=120"
            )
            items = _http_json(
                "POST",
                run_url,
                body={"startUrls": [{"url": app_store_url}], "maxReviews": max_reviews},
                timeout=130,
            )

            reviews = []
            for item in items if isinstance(items, list) else []:
                if not isinstance(item, dict):
                    continue
                rating = item.get("rating") or item.get("score")
                if rating is not None and float(rating) > 3:
                    continue
                reviews.append(
                    {
                        "rating": rating,
                        "title": item.get("title") or item.get("reviewTitle"),
                        "text": item.get("text") or item.get("reviewText") or item.get("body"),
                        "date": item.get("date") or item.get("reviewDate"),
                        "url": item.get("url") or app_store_url,
                    }
                )

            return json.dumps(
                {
                    "source": "apify_app_reviews",
                    "app_store_url": app_store_url,
                    "count": len(reviews),
                    "reviews": reviews[:max_reviews],
                },
                indent=2,
            )
        except Exception as exc:
            return json.dumps(
                {
                    "error": "APIFY_APP_REVIEWS_UNAVAILABLE",
                    "message": str(exc),
                    "instruction": "Use Serper for app store review pages and cite URLs.",
                    "app_store_url": app_store_url,
                },
                indent=2,
            )


class YouTubeCommentsInput(BaseModel):
    video_id: str = Field(
        ...,
        description="YouTube video ID (not full URL), e.g. dQw4w9WgXcQ",
    )
    max_results: int = Field(default=50, description="Maximum top-level comments (1-100)")


class YouTubeCommentsTool(BaseTool):
    name: str = "youtube_comments_harvest"
    description: str = (
        "Harvest public YouTube comments from platform review or tutorial videos. "
        "Use for social listening on trader frustration, clutter, and UX pain. "
        "Returns comment text, author, like count, and published date."
    )
    args_schema: Type[BaseModel] = YouTubeCommentsInput

    def _run(self, video_id: str, max_results: int = 50) -> str:
        api_key = os.getenv("YOUTUBE_API_KEY", "").strip()
        max_results = max(1, min(max_results, 100))
        video_id = video_id.strip()
        if "youtube.com" in video_id or "youtu.be" in video_id:
            if "v=" in video_id:
                video_id = video_id.split("v=")[1].split("&")[0]
            elif "youtu.be/" in video_id:
                video_id = video_id.split("youtu.be/")[1].split("?")[0]

        if not api_key:
            return json.dumps(
                {
                    "error": "YOUTUBE_API_KEY_NOT_CONFIGURED",
                    "instruction": (
                        "Set YOUTUBE_API_KEY in AMP environment. "
                        "Fall back to Serper for YouTube comment threads and cite video URLs."
                    ),
                    "video_id": video_id,
                },
                indent=2,
            )

        try:
            params = urlencode(
                {
                    "part": "snippet",
                    "videoId": video_id,
                    "maxResults": str(max_results),
                    "order": "relevance",
                    "textFormat": "plainText",
                    "key": api_key,
                }
            )
            url = f"https://www.googleapis.com/youtube/v3/commentThreads?{params}"
            data = _http_json("GET", url, timeout=30)

            if data.get("error"):
                raise RuntimeError(data["error"].get("message", "YouTube API error"))

            comments = []
            for item in data.get("items", []):
                snippet = (
                    item.get("snippet", {})
                    .get("topLevelComment", {})
                    .get("snippet", {})
                )
                comments.append(
                    {
                        "text": snippet.get("textDisplay") or snippet.get("textOriginal"),
                        "author": snippet.get("authorDisplayName"),
                        "likeCount": snippet.get("likeCount"),
                        "publishedAt": snippet.get("publishedAt"),
                        "videoId": video_id,
                    }
                )

            return json.dumps(
                {
                    "source": "youtube_data_api",
                    "video_id": video_id,
                    "count": len(comments),
                    "comments": comments,
                },
                indent=2,
            )
        except Exception as exc:
            return json.dumps(
                {
                    "error": "YOUTUBE_COMMENTS_UNAVAILABLE",
                    "message": str(exc),
                    "instruction": (
                        "Report the data gap. Use Serper for YouTube video pages and cite URLs."
                    ),
                    "video_id": video_id,
                },
                indent=2,
            )


class ClearPathWebhookPostInput(BaseModel):
    briefing_markdown: str = Field(..., description="Final daily briefing markdown to store")
    localized_briefing_markdown: str = Field(
        default="",
        description="Optional neuro-profile localized briefing markdown",
    )
    run_mode: str = Field(default="full_intelligence_cycle")
    active_neuro_profile: str = Field(default="calm_focus")
    publish_mode: str = Field(default="draft_only")
    source: str = Field(default="clearpath_intelligence_crew")


class ClearPathIntelligenceWebhookTool(BaseTool):
    name: str = "clearpath_post_intelligence_webhook"
    description: str = (
        "POST completed intelligence briefing to ClearPath Trader webhook receiver "
        "for storage and optional Make.com forwarding."
    )
    args_schema: Type[BaseModel] = ClearPathWebhookPostInput

    def _run(
        self,
        briefing_markdown: str,
        localized_briefing_markdown: str = "",
        run_mode: str = "full_intelligence_cycle",
        active_neuro_profile: str = "calm_focus",
        publish_mode: str = "draft_only",
        source: str = "clearpath_intelligence_crew",
    ) -> str:
        base = os.getenv("CLEARPATH_API_BASE", "https://clearpathtrader.com").rstrip("/")
        secret = os.getenv("INTELLIGENCE_WEBHOOK_SECRET", "").strip()
        payload: dict[str, Any] = {
            "source": source,
            "run_mode": run_mode,
            "active_neuro_profile": active_neuro_profile,
            "publish_mode": publish_mode,
            "clearpath_daily_briefing": briefing_markdown,
        }
        if localized_briefing_markdown.strip():
            payload["clearpath_daily_briefing_localized"] = localized_briefing_markdown

        headers = {"Content-Type": "application/json", "Accept": "application/json"}
        if secret:
            headers["x-intelligence-webhook-secret"] = secret

        try:
            request = Request(
                f"{base}/api/intelligence/webhook?forward=make",
                data=json.dumps(payload).encode("utf-8"),
                headers=headers,
                method="POST",
            )
            with urlopen(request, timeout=30) as response:
                body = response.read().decode("utf-8")
                return body or json.dumps({"status": "ok"})
        except Exception as exc:
            return json.dumps(
                {
                    "error": "CLEARPATH_WEBHOOK_POST_FAILED",
                    "message": str(exc),
                    "instruction": "Briefing saved locally in output/ — webhook delivery failed.",
                },
                indent=2,
            )
