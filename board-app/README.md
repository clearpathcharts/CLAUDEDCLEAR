# Clear Path Trader (app)

Investor / mobile Progressive Web App for **Clear Path Trader** (Clear Path Markets Science Corp.).

Live charts and ClearCloud APIs come from clearpathtrader.com.

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
