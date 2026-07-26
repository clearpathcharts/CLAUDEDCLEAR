import {
  getEnabledAssets,
  getRegistryAsset,
  type RegistryAsset,
} from "./assetRegistry";

export type MarketAsset = { label: string; value: string };

/** Chart/search picker — driven by ClearPath 70 registry. */
export const MARKET_ASSETS: MarketAsset[] = getEnabledAssets().map((a) => ({
  label: a.display,
  value: a.symbol,
}));

export function resolveMarketAsset(symbol: string): MarketAsset {
  const asset = getRegistryAsset(symbol);
  if (asset) return { label: asset.display, value: asset.symbol };
  const sym = symbol.toUpperCase().trim().replace(/\//g, "");
  return { label: sym, value: sym };
}

export function resolveRegistryForPicker(symbol: string): RegistryAsset | undefined {
  return getRegistryAsset(symbol);
}
