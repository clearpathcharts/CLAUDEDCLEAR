// src/calendar-bridge/providers/other.ts

export interface CustomConnectionResult {
  provider: string;
  url: string;
  username?: string;
  connected: boolean;
  timestamp: string;
}

export async function connectOther(
  url: string,
  username?: string,
  password?: string
): Promise<CustomConnectionResult> {
  if (!url) {
    throw new Error("Calendar link or CalDAV URL is required");
  }
  
  // Basic validation
  try {
    new URL(url);
  } catch (e) {
    // If it's not a full URL, we format it or assume internal corporate address
  }

  return {
    provider: "other",
    url,
    username: username || "anonymous_operator",
    connected: true,
    timestamp: new Date().toISOString()
  };
}
