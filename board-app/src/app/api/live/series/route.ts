import { NextRequest, NextResponse } from "next/server";
import { fetchLiveSeries } from "@/lib/clearpathLive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim();
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  try {
    const series = await fetchLiveSeries(symbol);
    return NextResponse.json(series, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        symbol,
        name: "DATA UNAVAILABLE",
        price: 0,
        change: 0,
        changePct: 0,
        candles: [],
        source: "clearpathtrader.com",
        unavailable: true,
        error: err instanceof Error ? err.message : "Live series failed",
      },
      { status: 502 },
    );
  }
}
