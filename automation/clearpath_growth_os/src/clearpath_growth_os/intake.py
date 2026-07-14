"""Article + image intake.

You drop a submission into the ``inbox/`` folder and the system does the rest.
A submission is either:

  * a folder:  inbox/<name>/article.md  (+ any .png/.jpg/.jpeg/.webp/.gif images)
  * a single file: inbox/<name>.md

``article.md`` may start with optional YAML frontmatter:

    ---
    title: Why brain-first trading matters
    target_page: /trading-ai
    pillar: brain-first / neuro-adaptive layouts
    platforms: [x, linkedin, tiktok]
    ---
    # Your article body in markdown...

Everything here is dependency-light and unit-tested (no LLM, no network).
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".gif"}
_SLUG_RE = re.compile(r"[^a-z0-9]+")


def _slugify(text: str) -> str:
    return _SLUG_RE.sub("-", text.strip().lower()).strip("-") or "submission"


@dataclass
class Submission:
    submission_id: str
    source_path: Path
    title: str
    body_markdown: str
    target_page: str = ""
    pillar: str = ""
    platforms: list[str] = field(default_factory=list)
    image_paths: list[Path] = field(default_factory=list)
    frontmatter: dict = field(default_factory=dict)

    def to_dict(self) -> dict:
        return {
            "submission_id": self.submission_id,
            "source_path": str(self.source_path),
            "title": self.title,
            "target_page": self.target_page,
            "pillar": self.pillar,
            "platforms": list(self.platforms),
            "image_paths": [str(p) for p in self.image_paths],
        }


def parse_frontmatter(text: str) -> tuple[dict, str]:
    """Split optional ``--- ... ---`` YAML frontmatter from the body."""
    if not text.startswith("---"):
        return {}, text
    parts = text.split("\n")
    if parts[0].strip() != "---":
        return {}, text
    end = None
    for i in range(1, len(parts)):
        if parts[i].strip() == "---":
            end = i
            break
    if end is None:
        return {}, text
    fm_block = "\n".join(parts[1:end])
    body = "\n".join(parts[end + 1 :]).lstrip("\n")
    meta: dict = {}
    try:
        import yaml

        loaded = yaml.safe_load(fm_block) or {}
        if isinstance(loaded, dict):
            meta = loaded
    except Exception:
        meta = _naive_frontmatter(fm_block)
    return meta, body


def _naive_frontmatter(block: str) -> dict:
    """Fallback key: value parser if PyYAML is unavailable."""
    meta: dict = {}
    for line in block.splitlines():
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        key, val = key.strip(), val.strip()
        if val.startswith("[") and val.endswith("]"):
            meta[key] = [v.strip().strip("'\"") for v in val[1:-1].split(",") if v.strip()]
        else:
            meta[key] = val.strip("'\"")
    return meta


def _title_from_body(body: str, fallback: str) -> str:
    for line in body.splitlines():
        s = line.strip()
        if s.startswith("#"):
            return s.lstrip("#").strip()
        if s:
            return s[:80]
    return fallback


def _load_article(article_path: Path, source_path: Path) -> Submission:
    raw = article_path.read_text(encoding="utf-8")
    meta, body = parse_frontmatter(raw)
    default_id = _slugify(source_path.stem if source_path.is_file() else source_path.name)
    title = str(meta.get("title") or _title_from_body(body, default_id))
    platforms = meta.get("platforms") or []
    if isinstance(platforms, str):
        platforms = [p.strip() for p in platforms.split(",") if p.strip()]

    images: list[Path] = []
    if source_path.is_dir():
        images = sorted(
            p for p in source_path.iterdir() if p.suffix.lower() in IMAGE_EXTS
        )

    return Submission(
        submission_id=_slugify(str(meta.get("id") or default_id)),
        source_path=source_path,
        title=title,
        body_markdown=body,
        target_page=str(meta.get("target_page", "")),
        pillar=str(meta.get("pillar", "")),
        platforms=list(platforms),
        image_paths=images,
        frontmatter=meta,
    )


def discover_submissions(inbox_dir: str | Path) -> list[Submission]:
    """Find all submissions in ``inbox_dir`` (folders with article.md, or *.md)."""
    inbox = Path(inbox_dir)
    if not inbox.exists():
        return []
    subs: list[Submission] = []
    for entry in sorted(inbox.iterdir()):
        if entry.name.startswith(".") or entry.name.startswith("_"):
            continue
        if entry.is_dir():
            article = entry / "article.md"
            if not article.exists():
                mds = sorted(entry.glob("*.md"))
                if not mds:
                    continue
                article = mds[0]
            subs.append(_load_article(article, entry))
        elif entry.is_file() and entry.suffix.lower() == ".md":
            subs.append(_load_article(entry, entry))
    return subs
