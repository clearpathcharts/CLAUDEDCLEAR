// src/calendar-bridge/providers/nextcloud.ts

export async function connectNextcloud(instanceUrl: string, username: string, appToken: string) {
  if (!instanceUrl) {
    throw new Error("Nextcloud Server instance URL is required");
  }
  if (!username || !appToken) {
    throw new Error("Username and Application Token are required");
  }
  return {
    provider: "nextcloud",
    instanceUrl,
    username,
    connected: true,
    timestamp: new Date().toISOString()
  };
}
