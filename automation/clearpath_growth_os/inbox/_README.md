# Inbox — drop your articles + images here

This is where **you** submit content. The system does the rest
(`growth-os-submit`).

## Two ways to submit

**A) Folder (article + images) — recommended**

```
inbox/
  my-post-name/
    article.md        # required (frontmatter optional)
    hero.png          # optional images (.png .jpg .jpeg .webp .gif)
    chart.jpg
```

**B) Single file (no images)**

```
inbox/my-post-name.md
```

## article.md format

Optional YAML frontmatter at the top, then your article in markdown:

```markdown
---
title: Why brain-first trading matters
target_page: /trading-ai
pillar: brain-first / neuro-adaptive layouts
platforms: [x, linkedin, tiktok]
---

# Why brain-first trading matters

Your article body here...
```

Everything except the body is optional — if you omit `title`, the first heading
is used. Folders/files starting with `_` or `.` are ignored (like this file).

## What happens next

1. `growth-os-submit` hosts your images, atomizes the article into X/LinkedIn/
   short-form posts, runs the compliance check, and writes an **approvable batch**
   to `output/submission_<name>.json`. Nothing posts yet.
2. You review, then `growth-os-approve` and `growth-os-publish`.

See `OPERATIONS.md` for the full runbook.
