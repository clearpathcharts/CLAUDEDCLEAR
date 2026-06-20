// src/calendar-bridge/providers/exchange.ts

export async function connectExchange(exchangeServer: string, domainUsername: string) {
  if (!exchangeServer) {
    throw new Error("ActiveSync Exchange server host is required");
  }
  return {
    provider: "exchange",
    exchangeServer,
    domainUsername,
    connected: true,
    timestamp: new Date().toISOString()
  };
}
