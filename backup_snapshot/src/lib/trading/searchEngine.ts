/**
 * GLOBAL SEARCH & EXCHANGE ROUTING (Files 56, 57)
 */

export interface SearchResult {
  symbol: string;
  name?: string;
  type: string;
  exchange: string;
}

export function routeExchange(symbol: string): string {
  if (symbol.endsWith(".NS")) return "NSE";       // India
  if (symbol.endsWith(".L")) return "LSE";        // London
  if (symbol.endsWith(".T")) return "TSE";        // Tokyo

  if (symbol.includes("BTC") || symbol.includes("ETH")) return "CRYPTO";
  if (symbol.includes("/")) return "FOREX";

  return "NYSE"; // Default
}

export function globalSearch(query: string, assetDB: any[]): SearchResult[] {
  const q = query.toLowerCase();
  
  return assetDB
    .filter(asset => 
      asset.symbol.toLowerCase().includes(q) || 
      (asset.name && asset.name.toLowerCase().includes(q))
    )
    .map(asset => ({
      ...asset,
      exchange: routeExchange(asset.symbol),
      type: asset.type || 'EQUITY'
    }))
    .slice(0, 50);
}
