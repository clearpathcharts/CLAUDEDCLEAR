"""Submission pipeline — you drop an article + images, it produces a batch.

    growth-os-submit                # process every new submission in inbox/
    growth-os-submit --force        # re-process even if a batch already exists

For each submission it: hosts the images, atomizes the article into platform
posts (Content Atomizer crew), runs the Compliance Guardian, and writes an
approvable batch to output/submission_<id>.json. Nothing posts until you
`growth-os-approve` + `growth-os-publish` (same gate as everything else).
"""

from __future__ import annotations

import argparse
import json
import os
from datetime import date, datetime, timezone
from pathlib import Path

from dotenv import load_dotenv
from pydantic import BaseModel, Field

from crewai.flow.flow import Flow, listen, router, start

from .assets import publish_assets
from .batch_mapper import batch_to_posts
from .config import force_human_review, output_dir
from .crews.compliance_guardian.compliance_guardian_crew import ComplianceGuardianCrew
from .crews.content_atomizer.content_atomizer_crew import ContentAtomizerCrew
from .intake import Submission, discover_submissions
from .main import _as_text, _safe_load

load_dotenv()

DEFAULT_INBOX = os.getenv("GROWTH_OS_INBOX", "./inbox")


class SubmissionState(BaseModel):
    submission: dict = Field(default_factory=dict)
    body_markdown: str = ""
    image_urls: list[str] = Field(default_factory=list)
    shortform_count: int = 1

    atomized: str = ""
    verdict: str = ""
    compliance_report: str = ""
    requires_human_review: bool = True
    published_path: str = ""
    metrics: dict = Field(default_factory=dict)


class SubmissionFlow(Flow[SubmissionState]):
    """Atomize one submitted article -> compliance -> approvable batch."""

    @start()
    def atomize(self) -> None:
        sub = self.state.submission
        result = (
            ContentAtomizerCrew()
            .crew()
            .kickoff(
                inputs={
                    "title": sub.get("title", ""),
                    "body_markdown": self.state.body_markdown,
                    "pillar": sub.get("pillar", "") or "brain-first / neuro-adaptive layouts",
                    "target_page": sub.get("target_page", "") or "/trading-ai",
                    "image_urls": ", ".join(self.state.image_urls) or "(none)",
                    "shortform_count": self.state.shortform_count,
                }
            )
        )
        tasks = getattr(result, "tasks_output", []) or []
        atomize_out = _safe_load(_as_text(tasks[0])) if len(tasks) > 0 else {}
        shortform = _safe_load(_as_text(tasks[1])) if len(tasks) > 1 else []
        x_pack = atomize_out.get("x_pack") if isinstance(atomize_out, dict) else None
        linkedin = atomize_out.get("linkedin") if isinstance(atomize_out, dict) else None
        self.state.atomized = json.dumps(
            {"x_pack": x_pack, "linkedin": linkedin, "shortform": shortform},
            ensure_ascii=False,
        )

    @listen(atomize)
    def enforce_compliance(self) -> None:
        sub = self.state.submission
        payload = json.dumps(
            {
                "omnipresence": _safe_load(self.state.atomized),
                "article": {"title": sub.get("title"), "target_page": sub.get("target_page")},
                "images": self.state.image_urls,
            },
            ensure_ascii=False,
        )
        result = ComplianceGuardianCrew().crew().kickoff(inputs={"content_payload": payload})
        report = _as_text(result)
        self.state.compliance_report = report
        verdict = "needs_revision"
        try:
            parsed = json.loads(report)
            if isinstance(parsed, dict) and parsed.get("verdict") == "approved":
                verdict = "approved"
        except (json.JSONDecodeError, TypeError):
            verdict = "needs_revision"
        self.state.verdict = verdict

    @router(enforce_compliance)
    def route_on_verdict(self) -> str:
        return "approved" if self.state.verdict == "approved" else "needs_revision"

    @listen("approved")
    def publish_submission(self) -> str:
        self.state.requires_human_review = force_human_review()
        status = "pending_human_review" if self.state.requires_human_review else "ready_to_publish"
        batch = self._build_batch(status)
        out = output_dir() / f"submission_{self.state.submission['submission_id']}.json"
        out.write_text(json.dumps(batch, ensure_ascii=False, indent=2), encoding="utf-8")
        self.state.published_path = str(out)
        print(f"[submit] {out.name} -> {status} ({batch['metrics']['social_posts']} posts, "
              f"{len(self.state.image_urls)} image(s))")
        return str(out)

    @listen("needs_revision")
    def flag_submission(self) -> str:
        batch = self._build_batch("blocked_by_compliance")
        out = output_dir() / f"submission_{self.state.submission['submission_id']}_flags.json"
        out.write_text(json.dumps(batch, ensure_ascii=False, indent=2), encoding="utf-8")
        self.state.published_path = str(out)
        print(f"[submit] {out.name} -> blocked_by_compliance")
        return str(out)

    def _build_batch(self, status: str) -> dict:
        sub = self.state.submission
        omni = _safe_load(self.state.atomized)
        batch = {
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "run_date": date.today().isoformat(),
            "source": "submission",
            "submission_id": sub["submission_id"],
            "title": sub.get("title"),
            "status": status,
            "compliance_verdict": self.state.verdict,
            "article": {
                "title": sub.get("title"),
                "target_page": sub.get("target_page"),
                "body_markdown": self.state.body_markdown,
            },
            "images": self.state.image_urls,
            "omnipresence": omni,
            "seo": {
                "pillar": {
                    "title": sub.get("title"),
                    "slug": sub["submission_id"],
                    "related_page": sub.get("target_page") or "/trading-ai",
                }
            },
            "compliance_report": _safe_load(self.state.compliance_report),
        }
        posts = batch_to_posts(batch)
        batch["metrics"] = {
            "articles": 1,
            "social_posts": sum(1 for p in posts if p.platform in {"x", "linkedin", "tiktok"}),
            "images": len(self.state.image_urls),
        }
        return batch


def _already_processed(sub: Submission) -> bool:
    out = output_dir()
    return (out / f"submission_{sub.submission_id}.json").exists()


def run_inbox(inbox_dir: str | None = None, force: bool = False) -> list[str]:
    """Process every new submission in the inbox. Returns written batch paths."""
    inbox = inbox_dir or DEFAULT_INBOX
    subs = discover_submissions(inbox)
    if not subs:
        print(f"[submit] No submissions found in {inbox}.")
        return []

    written: list[str] = []
    for sub in subs:
        if not force and _already_processed(sub):
            print(f"[submit] Skipping already-processed '{sub.submission_id}' (use --force to redo).")
            continue
        print(f"[submit] Processing '{sub.submission_id}' ({len(sub.image_paths)} image(s))...")
        image_urls = publish_assets(sub.image_paths, subdir=sub.submission_id)
        flow = SubmissionFlow()
        flow.state.submission = sub.to_dict()
        flow.state.body_markdown = sub.body_markdown
        flow.state.image_urls = image_urls
        flow.state.shortform_count = 1 if not image_urls else 2
        flow.kickoff()
        written.append(flow.state.published_path)
    return written


def main() -> int:
    ap = argparse.ArgumentParser(description="Process article+image submissions from the inbox.")
    ap.add_argument("--inbox", help=f"Inbox directory (default: {DEFAULT_INBOX}).")
    ap.add_argument("--force", action="store_true", help="Re-process even if a batch exists.")
    args = ap.parse_args()
    run_inbox(inbox_dir=args.inbox, force=args.force)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
