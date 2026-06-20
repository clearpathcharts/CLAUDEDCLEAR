// src/calendar-bridge/providers/apple.ts

export async function connectApple(appleId: string, appSpecificPassword?: string) {
  if (!appleId || !appleId.includes('@')) {
    throw new Error("A valid Apple ID email is required");
  }
  if (!appSpecificPassword) {
    throw new Error("iCloud connections require an App-Specific Password. Standard iCloud passwords are blocked by Apple security.");
  }
  return {
    provider: "apple",
    appleId,
    connected: true,
    serverUrl: "https://caldav.icloud.com",
    timestamp: new Date().toISOString()
  };
}
