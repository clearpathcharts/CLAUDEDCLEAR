// src/calendar-bridge/providers/ics.ts

export async function parseIcsContent(content: string) {
  // Simple ICS parser snippet to normalise events
  const events: any[] = [];
  const lines = content.split(/\r?\n/);
  let currentEvent: any = null;

  for (const line of lines) {
    if (line.startsWith("BEGIN:VEVENT")) {
      currentEvent = {};
    } else if (line.startsWith("END:VEVENT") && currentEvent) {
      if (currentEvent.summary && currentEvent.dtstart) {
        events.push(currentEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      if (line.startsWith("SUMMARY:")) {
        currentEvent.summary = line.substring(8).trim();
      } else if (line.startsWith("DTSTART:")) {
        currentEvent.dtstart = line.substring(8).trim();
      } else if (line.startsWith("DTEND:")) {
        currentEvent.dtend = line.substring(6).trim();
      } else if (line.startsWith("LOCATION:")) {
        currentEvent.location = line.substring(9).trim();
      }
    }
  }
  return events;
}

export async function connectIcs(fileName: string, fileContent: string) {
  if (!fileName || !fileContent) {
    throw new Error("No calendar snapshot file provided for upload");
  }
  const parsed = await parseIcsContent(fileContent);
  return {
    provider: "ics",
    fileName,
    eventsCount: parsed.length,
    connected: true,
    timestamp: new Date().toISOString()
  };
}
