/**
 * Last print for ticker tape + chart adapters.
 * Twelve Data /quote uses `close`; a stale or leftover `price` field must not win
 * (desk gold once stuck at 2382 while candles printed ~4022).
 */
export type QuotePriceFields = {
  price?: string | number;
  close?: string | number;
  error?: unknown;
} | null | undefined;

export function resolveQuotePrice(data: QuotePriceFields): number | null {
  if (!data || data.error) return null;
  const raw = data.close ?? data.price;
  if (raw === undefined || raw === null || raw === "") return null;
  const n = typeof raw === "number" ? raw : parseFloat(String(raw));
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Stamp `price` from last print so every consumer reads the same number. */
export function withTapePrice<T extends object>(data: T): T {
  const last = resolveQuotePrice(data as QuotePriceFields);
  if (last == null) return data;
  return { ...data, close: (data as { close?: unknown }).close ?? last, price: last };
}
