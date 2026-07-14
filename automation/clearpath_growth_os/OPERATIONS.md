# ClearPath Growth OS — Operations Runbook

How the systems connect, and the exact steps to run the automation where **you
just submit articles and images** and everything else is automatic.

---

## 1. The map — how each system connects to the next

```
   YOU                     CURSOR (me)                 GITHUB (runtime)
 submit article    ┌──────────────────────┐      ┌──────────────────────┐
 + images  ─────►  │ builds & maintains    │────► │ Actions run the code │
   into inbox/     │ the code in this repo │      │ on a schedule (free) │
                   └──────────────────────┘      └───────────┬──────────┘
                                                              │
                        ┌─────────────────────────────────────┘
                        ▼
     CrewAI ENGINE (this package)          CLEARPATH SERVER (server.ts)
   ┌───────────────────────────┐          ┌───────────────────────────┐
   │ intake -> atomize -> check │◄────────►│ /api/semantic, /api/news,  │
   │ -> approvable batch (JSON) │  pulls   │ /api/quote, /api/candles   │
   └─────────────┬─────────────┘  real     └───────────────────────────┘
                 │                 data
                 ▼
        GEMINI (your key)                 POSTING API (Ayrshare, optional)
   ┌───────────────────────┐             ┌───────────────────────────┐
   │ writes the copy        │             │ one key -> X / LinkedIn    │
   └───────────────────────┘             └───────────────────────────┘
```

Five connections, each one-time:

| # | Connect this | to this | How |
|---|---|---|---|
| 1 | Gemini | the engine | put `GEMINI_API_KEY` in GitHub secrets (you already have the key) |
| 2 | ClearPath server | the engine | set `CLEARPATH_API_BASE` (defaults to `https://clearpathtrader.com`) |
| 3 | Posting API | the engine | (optional) `AYRSHARE_API_KEY` + `POSTING_PROVIDER=ayrshare` |
| 4 | GitHub Actions | the engine | already wired via `.github/workflows/` — just enable Actions |
| 5 | Cursor (me) | everything | this repo — you ping me to change/fix anything |

---

## 2. One-time setup (~10 minutes, once)

### Step 1 — Connect Gemini (required)
GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**
- Name: `GEMINI_API_KEY`  Value: *(your existing Gemini key)*

That's the only required secret. The engine defaults to Gemini — no OpenAI needed.

### Step 2 — Point at your live site (optional, recommended)
Same page → **Variables** tab → **New repository variable**
- Name: `CLEARPATH_API_BASE`  Value: `https://clearpathtrader.com`

### Step 3 — Connect the posting API (optional — skip to stay in dry-run)
When you're ready for real posts:
1. Create an Ayrshare account, connect your X + LinkedIn there (this is the OAuth
   step that's painful to build — let them own it).
2. GitHub secret: `AYRSHARE_API_KEY` = *(Ayrshare key)*.
3. Until you do this, everything runs in **dry-run** (produces + previews, posts
   nothing). Safe to operate for weeks like this.

### Step 4 — Enable Actions
GitHub repo → **Actions** tab → enable workflows if prompted. Done.

---

## 3. Local setup (only if you want to run it from your own machine)

```bash
cd automation/clearpath_growth_os
cp .env.example .env         # fill GEMINI_API_KEY; leave POSTING_PROVIDER=dryrun
python -m venv .venv && source .venv/bin/activate
pip install -e .
```

Sanity checks (no key needed):
```bash
python -m pytest tests/ -q            # 39 tests
python scripts/e2e_submit_test.py     # full submit->approve->publish (dry-run)
```

---

## 4. The daily workflow — "I just submit articles and images"

### Step 1 — Drop your content into `inbox/`
```
inbox/
  my-post-name/
    article.md      # optional frontmatter (title, target_page, pillar), then markdown
    hero.png        # optional images
    chart.jpg
```
(A single `inbox/my-post-name.md` also works if there are no images.)
See `inbox/_README.md` for the exact format. There's a real example in
`inbox/example-brain-first-trading/`.

### Step 2 — Turn it into posts
```bash
growth-os-submit
```
This hosts your images, atomizes the article into X posts + a thread, a LinkedIn
post, and a short-form script, runs the compliance check, and writes an
**approvable batch** to `output/submission_<name>.json`. **Nothing is posted.**

### Step 3 — Review + approve
Open the batch JSON (or read the receipt), and if you're happy:
```bash
growth-os-approve            # marks the latest batch approved_for_publish
```

### Step 4 — Publish
```bash
growth-os-publish                        # dry-run: shows exactly what would post
growth-os-publish --provider ayrshare    # real posts (once AYRSHARE_API_KEY is set)
```
A receipt is written to `output/submission_<name>.published.json`.

That's the whole loop: **drop → submit → approve → publish.** Steps 2–4 are one
line each, and you can wire them into the GitHub "publish" workflow so you click
one button instead.

---

## 5. Fully hands-off mode (GitHub does it)

- **Daily autonomous content** (no submission needed): the `Growth OS — Daily
  Produce` workflow runs every morning, produces the day's batch, and uploads it
  for review. You approve via the `Growth OS — Publish (manual)` workflow.
- **Your submissions**: run `growth-os-submit` locally, or ask me to add a
  submission trigger to Actions (e.g. run on push to `inbox/`).

---

## 6. Where "Cursor (me)" fits

I am the **builder**, not the runtime. You keep me connected simply by keeping
this repo. When you want to:
- add a platform, change the voice, add a crew, fix a broken API,
- change the posting provider, adjust the schedule,

…you tell me and I edit the code + tests and open a PR. The always-on running is
GitHub's job; the building and fixing is mine.

---

## 7. Safety guarantees (built in)

- **Nothing posts without your approval** (`FORCE_HUMAN_REVIEW=true`).
- **Compliance gate** blocks return promises, brokerage/"AI predicts" language,
  fabricated stats, and fake urgency before anything reaches you.
- **Dry-run by default** — you can rehearse the entire pipeline with zero paid
  accounts and zero risk of an accidental post.
