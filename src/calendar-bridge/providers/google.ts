// src/calendar-bridge/providers/google.ts

export async function connectGoogle(email: string, oauthCode?: string) {
  if (!email || !email.includes('@')) {
    throw new Error("Invalid GSuite or Google Account Email");
  }
  return {
    provider: "google",
    email,
    connected: true,
    syncInterval: "realtime",
    scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    timestamp: new Date().toISOString()
  };
}
