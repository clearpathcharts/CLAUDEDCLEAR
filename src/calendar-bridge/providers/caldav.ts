// src/calendar-bridge/providers/caldav.ts

export async function connectCalDav(serverUrl: string, username?: string, password?: string) {
  if (!serverUrl) {
    throw new Error("CalDAV Server endpoint URL is required");
  }
  return {
    provider: "caldav",
    serverUrl,
    username: username || "anonymous",
    connected: true,
    timestamp: new Date().toISOString()
  };
}
