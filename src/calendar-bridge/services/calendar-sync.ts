// src/calendar-bridge/services/calendar-sync.ts

import { getDb, auth } from '../../firebase';
import { collection, doc, setDoc, getDocs, deleteDoc, query, where } from '../../firebase';                
import { normalizeCalendarEvent, NormalizedEvent } from './event-normalizer';
import { CALENDAR_PROVIDERS } from './provider-registry';

export interface ConnectedCalendar {
  id: string; // providerId or unique
  provider: string; // e.g., 'google', 'apple', 'other'
  name: string;
  emailOrUrl: string;
  connectedAt: string;
}

// Simulated real seed events generated when connecting calendars so users can test immediately!
const SIMULATED_SEED_EVENTS: Record<string, any[]> = {
  google: [
    { id: "g1", title: "Doctor Appointment", start: "2026-06-09T09:00:00Z", end: "2026-06-09T10:00:00Z", timezone: "America/New_York" },
    { id: "g2", title: "Trader Round-Table Sync", start: "2026-06-10T14:30:00Z", end: "2026-06-10T15:30:00Z", timezone: "America/New_York" }
  ],
  apple: [
    { id: "ap1", title: "Dentist Board Check", start: "2026-06-09T13:30:00Z", end: "2026-06-09T14:30:00Z", timezone: "Europe/London" },
    { id: "ap2", title: "Family Vacation Departure", start: "2026-06-11T08:00:00Z", end: "2026-06-11T18:00:00Z", timezone: "America/New_York" }
  ],
  outlook: [
    { id: "o1", title: "Client Earnings Lunch", start: "2026-06-09T12:00:00Z", end: "2026-06-09T13:30:00Z", timezone: "America/Chicago" },
    { id: "o2", title: "Strategy Call w/ London Desk", start: "2026-06-10T10:00:00Z", end: "2026-06-10T11:00:00Z", timezone: "America/New_York" }
  ],
  yahoo: [
    { id: "y1", title: "School Pick-up", start: "2026-06-09T15:00:00Z", end: "2026-06-09T15:45:00Z", timezone: "America/New_York" }
  ],
  other: [
    { id: "oth1", title: "Weekly Portfolio Review", start: "2026-06-09T08:00:00Z", end: "2026-06-09T09:30:00Z", timezone: "UTC" }
  ]
};

// Fallback in localStorage if Firebase fails or in guest mode
const LOCAL_STORAGE_CALENDARS_KEY = "cpt_calendars_sync";
const LOCAL_STORAGE_EVENTS_KEY = "cpt_events_sync";

function getLocalCalendars(): ConnectedCalendar[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CALENDARS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalCalendars(list: ConnectedCalendar[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_CALENDARS_KEY, JSON.stringify(list));
  } catch (e) {}
}

function getLocalEvents(): NormalizedEvent[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_EVENTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
}

function saveLocalEvents(list: NormalizedEvent[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_EVENTS_KEY, JSON.stringify(list));
  } catch (e) {}
}

/**
 * Connects and registers a new calendar provider.
 */
export async function connectCalendarDb(
  provider: string,
  emailOrUrl: string,
  credentials?: any
): Promise<{ success: boolean; calendar: ConnectedCalendar; events: NormalizedEvent[] }> {
  
  const providerConf = CALENDAR_PROVIDERS[provider] || CALENDAR_PROVIDERS.other;
  const uniqueId = `cal_${provider}_${Math.random().toString(36).substring(2, 9)}`;

  const calendar: ConnectedCalendar = {
    id: uniqueId,
    provider,
    name: providerConf.name,
    emailOrUrl: emailOrUrl || "Universal Connector",
    connectedAt: new Date().toISOString()
  };

  // Generate seed mock events
  const rawEvents = SIMULATED_SEED_EVENTS[provider] || SIMULATED_SEED_EVENTS.other || [];
  const normalizedEvents = rawEvents.map(evt => normalizeCalendarEvent(evt, provider));

  const userId = auth.currentUser?.uid || "guest";

  if (userId && userId !== "guest") {
    try {
      // 1. Save Calendar
      const calRef = doc(getDb(), 'connected_calendars', `${userId}_${uniqueId}`);
      await setDoc(calRef, {
        ...calendar,
        userId,
        createdAt: new Date().toISOString()
      });

      // 2. Save Normalized Events
      for (const evt of normalizedEvents) {
        const evtRef = doc(getDb(), 'calendar_events', `${userId}_${evt.id}`);
        await setDoc(evtRef, {
          ...evt,
          userId,
          calendarId: uniqueId,
          createdAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn("[CalendarSync] Firestore write bypassed or failed, using local storage fallback:", err);
    }
  }

  // Backup locally always to support robust instantaneous hydration
  const localCals = getLocalCalendars();
  localCals.push(calendar);
  saveLocalCalendars(localCals);

  const localEvts = getLocalEvents();
  normalizedEvents.forEach(e => localEvts.push(e));
  saveLocalEvents(localEvts);

  return {
    success: true,
    calendar,
    events: normalizedEvents
  };
}

/**
 * Retrieves list of connected user calendars
 */
export async function getConnectedCalendarsDb(): Promise<ConnectedCalendar[]> {
  const userId = auth.currentUser?.uid || "guest";
  let list: ConnectedCalendar[] = [];

  if (userId && userId !== "guest") {
    try {
      const q = query(collection(getDb(), 'connected_calendars'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data() as ConnectedCalendar);
      });
    } catch (err) {
      console.warn("[CalendarSync] Firestore read failed, using local storage fallback:", err);
    }
  }

  if (list.length === 0) {
    list = getLocalCalendars();
  }
  return list;
}

/**
 * Retrieves list of normalized user events
 */
export async function getNormalizedEventsDb(): Promise<NormalizedEvent[]> {
  const userId = auth.currentUser?.uid || "guest";
  let list: NormalizedEvent[] = [];

  if (userId && userId !== "guest") {
    try {
      const q = query(collection(getDb(), 'calendar_events'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      querySnap.forEach((docSnap) => {
        list.push(docSnap.data() as NormalizedEvent);
      });
    } catch (err) {
      console.warn("[CalendarSync] Firestore read failed, using local storage fallback:", err);
    }
  }

  if (list.length === 0) {
    list = getLocalEvents();
  }
  return list;
}

/**
 * Disconnects a user calendar, deleting related events
 */
export async function disconnectCalendarDb(calendarId: string): Promise<boolean> {
  const userId = auth.currentUser?.uid || "guest";

  // Filter local state
  const localCals = getLocalCalendars();
  const filteredCals = localCals.filter(c => c.id !== calendarId);
  saveLocalCalendars(filteredCals);

  const targetCal = localCals.find(c => c.id === calendarId);
  if (targetCal) {
    const localEvts = getLocalEvents();
    // Remove events synced from this provider
    const filteredEvts = localEvts.filter(e => e.sourceProvider !== targetCal.provider);
    saveLocalEvents(filteredEvts);
  }

  if (userId && userId !== "guest") {
    try {
      const calRef = doc(getDb(), 'connected_calendars', `${userId}_${calendarId}`);
      await deleteDoc(calRef);

      // Delete target events
      const q = query(collection(getDb(), 'calendar_events'), where('userId', '==', userId));
      const querySnap = await getDocs(q);
      querySnap.forEach(async (docSnap) => {
        const data = docSnap.data();
        if (data.calendarId === calendarId) {
          await deleteDoc(doc(getDb(), 'calendar_events', docSnap.id));
        }
      });
    } catch (err) {
      console.warn("[CalendarSync] Firestore delete failed:", err);
    }
  }

  return true;
}

/**
 * Wipe all local cached lists
 */
export function wipeAllConnectedCalendarsLocal() {
  saveLocalCalendars([]);
  saveLocalEvents([]);
}
