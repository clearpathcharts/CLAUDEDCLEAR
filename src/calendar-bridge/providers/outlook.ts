// src/calendar-bridge/providers/outlook.ts

export async function connectOutlook(email: string, tenantId?: string) {
  if (!email || !email.includes('@')) {
    throw new Error("Invalid Microsoft Account or Azure Active Directory email");
  }
  return {
    provider: "outlook",
    email,
    tenantId: tenantId || "common",
    connected: true,
    scopes: ["Calendars.Read"],
    timestamp: new Date().toISOString()
  };
}
