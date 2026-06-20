// src/calendar-bridge/providers/fastmail.ts

export async function connectFastmail(email: string, appPassword?: string) {
  if (!email || !email.includes('@')) {
    throw new Error("Invalid Fastmail address");
  }
  if (!appPassword) {
    throw new Error("Fastmail requires a dedicated secure App Password.");
  }
  return {
    provider: "fastmail",
    email,
    connected: true,
    serverUrl: "https://caldav.fastmail.com",
    timestamp: new Date().toISOString()
  };
}
