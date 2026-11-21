import { requireIdentity } from "../../../../cursor/identity";
import { sql } from "@/lib/db";
import { isKnownSymbol } from "@/lib/marketData";

export const dynamic = "force-dynamic";

const SYMBOL_RE = /^[A-Za-z0-9./-]{1,24}$/;

async function loadWatchlist(sub: string) {
  return sql<{ symbol: string; label: string }>(
    "select symbol, label from watchlist_items where viewer_sub = $1 order by created_at asc",
    [sub],
  );
}

export async function GET(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;
  if (identity.kind === "key") {
    return Response.json({ error: "person_required" }, { status: 403 });
  }
  const watchlist = await loadWatchlist(identity.sub);
  return Response.json({ watchlist }, { headers: { "cache-control": "private, no-store" } });
}

export async function POST(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;
  if (identity.kind === "key") {
    return Response.json({ error: "person_required" }, { status: 403 });
  }

  let body: { symbol?: string; label?: string };
  try {
    body = (await request.json()) as { symbol?: string; label?: string };
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const symbol = (body.symbol ?? "").trim().toUpperCase();
  if (!SYMBOL_RE.test(symbol) || !isKnownSymbol(symbol)) {
    return Response.json({ error: "unknown_symbol" }, { status: 400 });
  }
  const label = String(body.label ?? symbol).slice(0, 80);

  const existing = await loadWatchlist(identity.sub);
  if (existing.length >= 25 && !existing.some((row) => row.symbol === symbol)) {
    return Response.json({ error: "watchlist_full" }, { status: 400 });
  }

  await sql(
    `insert into watchlist_items (viewer_sub, symbol, label)
     values ($1, $2, $3)
     on conflict (viewer_sub, symbol) do update set label = excluded.label`,
    [identity.sub, symbol, label],
  );

  const watchlist = await loadWatchlist(identity.sub);
  return Response.json({ watchlist }, { headers: { "cache-control": "private, no-store" } });
}

export async function DELETE(request: Request) {
  const identity = await requireIdentity(request);
  if (identity instanceof Response) return identity;
  if (identity.kind === "key") {
    return Response.json({ error: "person_required" }, { status: 403 });
  }

  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") ?? "").trim().toUpperCase();
  if (!SYMBOL_RE.test(symbol)) {
    return Response.json({ error: "invalid_symbol" }, { status: 400 });
  }

  await sql("delete from watchlist_items where viewer_sub = $1 and symbol = $2", [
    identity.sub,
    symbol,
  ]);
  const watchlist = await loadWatchlist(identity.sub);
  return Response.json({ watchlist }, { headers: { "cache-control": "private, no-store" } });
}
