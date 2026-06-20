// src/calendar-bridge/providers/yahoo.ts

export async function connectYahoo(yahooEmail: string, appPassword?: string) {
  if (!yahooEmail || !yahooEmail.includes('@')) {
    throw new Error("Invalid Yahoo Mail address");
  }
  return {
    provider: "yahoo",
    yahooEmail,
    connected: true,
    timestamp: new Date().toISOString()
  };
}
