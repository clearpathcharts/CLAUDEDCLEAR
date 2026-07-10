export type MarketAsset = { label: string; value: string };

export const MARKET_ASSETS: MarketAsset[] = [
  { label: 'EUR/USD', value: 'EURUSD' },
  { label: 'GBP/USD', value: 'GBPUSD' },
  { label: 'USD/JPY', value: 'USDJPY' },
  { label: 'AUD/USD', value: 'AUDUSD' },
  { label: 'USD/CAD', value: 'USDCAD' },
  { label: 'NZD/USD', value: 'NZDUSD' },
  { label: 'XAU/USD', value: 'XAUUSD' },
  { label: 'XAG/USD', value: 'XAGUSD' },
  { label: 'SOL/USD', value: 'SOLUSD' },
  { label: 'SPX', value: 'SPX' },
  { label: 'DXY', value: 'DXY' },
];

export function resolveMarketAsset(symbol: string): MarketAsset {
  const sym = symbol.toUpperCase().trim();
  const match = MARKET_ASSETS.find((a) => a.value === sym);
  return match ?? { label: sym, value: sym };
}
