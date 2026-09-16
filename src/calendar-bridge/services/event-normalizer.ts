// src/calendar-bridge/services/event-normalizer.ts

export interface NormalizedEvent {
  id: string;
  title: string;
  start: string; // ISO string 2026-07-14T08:30:00
  end: string;
  timezone: string;
  sourceProvider: string;
}

/**
 * Normalizes any calendar provider's raw event to a consistent, secure corporate schema.
 * Respects strict Privacy Architecture by stripping out any sensitive notes, attachments,
 * and private descriptions, capturing ONLY the Event Title, and Date-Time boundaries.
 */
export function normalizeCalendarEvent(rawEvent: any, provider: string): NormalizedEvent {
  const eventId = rawEvent.id || rawEvent.uid || `evt_${Math.random().toString(36).substring(2, 9)}`;
  const title = (rawEvent.title || rawEvent.summary || rawEvent.subject || "Private Appointment").trim();
  
  // Clean timezone identification
  const timezone = rawEvent.timezone || rawEvent.tz || "UTC";

  // Parse starts and ends securely
  let startRaw = rawEvent.start || rawEvent.dtstart || rawEvent.startTime;
  let endRaw = rawEvent.end || rawEvent.dtend || rawEvent.endTime;

  if (typeof startRaw === 'object' && startRaw !== null) {
    startRaw = startRaw.dateTime || startRaw.date || startRaw.iso;
  }
  if (typeof endRaw === 'object' && endRaw !== null) {
    endRaw = endRaw.dateTime || endRaw.date || endRaw.iso;
  }

  // Ensure valid date strings
  const start = startRaw ? new Date(startRaw).toISOString() : new Date().toISOString();
  const end = endRaw ? new Date(endRaw).toISOString() : new Date(new Date(start).getTime() + 30 * 60 * 1000).toISOString();

  // STRICT PRIVACY ARCHITECTURE
  // We NEVER store rawEvent.description, rawEvent.notes, rawEvent.attachments, or rawEvent.attendees.
  return {
    id: eventId,
    title,
    start,
    end,
    timezone,
    sourceProvider: provider
  };
}
