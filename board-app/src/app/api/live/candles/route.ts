import { NextRequest, NextResponse } from "next/server";
import { fetchLiveCandles } from "@/lib/clearpathLive";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const symbol = req.nextUrl.searchParams.get("symbol")?.trim();
  const interval = req.nextUrl.searchParams.get("interval")?.trim() || "1h";
  if (!symbol) {
    return NextResponse.json({ error: "symbol required" }, { status: 400 });
  }
  try {
    const series = await fetchLiveCandles(symbol, interval, 100);
    return NextResponse.json(series, {
      headers: { "cache-control": "no-store" },
    });
  } catch (err) {
    return NextResponse.json(
      {
        candles: [],
        error: err instanceof Error ? err.message : "Live candles failed",
      },
      { status: 502 },
    );
  }
}
