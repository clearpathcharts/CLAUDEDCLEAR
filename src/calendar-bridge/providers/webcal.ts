// src/calendar-bridge/providers/webcal.ts

export async function connectWebCal(webcalUrl: string) {
  if (!webcalUrl) {
    throw new Error("WebCal live subscription HTTP list URL is required");
  }
  if (!webcalUrl.startsWith("http://") && !webcalUrl.startsWith("https://") && !webcalUrl.startsWith("webcal://")) {
    throw new Error("Invalid calendar URL protocol. Must start with http, https, or webcal.");
  }
  return {
    provider: "webcal",
    webcalUrl,
    connected: true,
    timestamp: new Date().toISOString()
  };
}
