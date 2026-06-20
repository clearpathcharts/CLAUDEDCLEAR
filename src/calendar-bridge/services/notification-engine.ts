// src/calendar-bridge/services/notification-engine.ts

import { EconomicConflict } from './economic-matcher';

export interface NotificationPreferences {
  reminder: boolean;
  push: boolean;
  sms: boolean;
  email: boolean;
  phoneNumber?: string;
  alternateEmail?: string;
  customAlertRouting: boolean;
  earningsBlackoutWarning: boolean;
}

export const DEFAULT_NOTIF_PREFERENCES: NotificationPreferences = {
  reminder: true,
  push: true,
  sms: false,
  email: true,
  customAlertRouting: false,
  earningsBlackoutWarning: true
};

export interface SentAlertLog {
  id: string;
  conflictId: string;
  title: string;
  method: 'reminder' | 'push' | 'sms' | 'email';
  destination: string;
  timestamp: string;
  status: 'sent' | 'queued' | 'simulated';
}

/**
 * Simulates routing high-impact warnings based on user preferences which solves the Trader Workflow layout:
 * "HIGH IMPACT EVENT"
 * "US CPI RELEASE - 8:30 AM"
 * "You have an appointment at 9:00 AM."
 * "Would you like: Reminder, Push Notification, SMS, Email"
 */
export function generateConflictWarning(conflict: EconomicConflict, prefs: NotificationPreferences): {
  headline: string;
  status: string;
  eventDetails: string;
  conflictTime: string;
  routings: { type: string; enabled: boolean; destination: string }[];
} {
  const econTimeStr = new Date(conflict.economicEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const userTimeStr = new Date(conflict.userEvent.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  const headline = `CRITICAL TRADING ALERT`;
  const status = conflict.economicEvent.importance === 'High' ? 'HIGH IMPACT EVENT' : 'MEDIUM IMPACT EVENT';
  const eventDetails = `${conflict.economicEvent.title.toUpperCase()} at ${econTimeStr}`;
  const conflictTime = `You have an appointment "${conflict.userEvent.title}" at ${userTimeStr}.`;

  const routings = [
    { type: 'Reminder', enabled: prefs.reminder, destination: 'In-app Pop-up Alert Banner' },
    { type: 'Push Notification', enabled: prefs.push, destination: 'Trader Terminal Active Guard' },
    { type: 'SMS', enabled: prefs.sms, destination: prefs.phoneNumber || 'Not specified' },
    { type: 'Email', enabled: prefs.email, destination: prefs.alternateEmail || 'Default Account Mail' }
  ];

  return {
    headline,
    status,
    eventDetails,
    conflictTime,
    routings
  };
}
