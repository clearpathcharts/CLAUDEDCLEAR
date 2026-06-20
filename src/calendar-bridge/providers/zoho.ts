// src/calendar-bridge/providers/zoho.ts

export async function connectZoho(email: string, appKey?: string) {
  if (!email || !email.includes('@')) {
    throw new Error("Invalid Zoho email address");
  }
  return {
    provider: "zoho",
    email,
    connected: true,
    timestamp: new Date().toISOString()
  };
}
