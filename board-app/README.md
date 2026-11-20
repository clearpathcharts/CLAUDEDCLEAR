# ClearPath Trader — Board Demo (Cursor Apps)

Cursor-hosted board-meeting demo for **ClearPath Trader** (Clear Path Markets Science Corp.).

This is a focused, publishable app — not a lift of the full Cloud Run stack (Firebase / Twelve Data / Stripe / Ava).

## Run locally

```bash
cd board-app
npm install
npm run dev
```

Open http://localhost:3456

## Publish

Publish from this folder with Cursor Apps (`publish-app`, `project_dir: board-app`). Declares Postgres via `cursor-app.json`. Uses Cursor identity for private/team viewers.

## Scope

Working: homepage, chart desks, education, pricing (checkout disabled), about/FAQ, member dashboard stub.

Out of scope: Ava voice, live order execution, brokerage claims, Android wrap.
