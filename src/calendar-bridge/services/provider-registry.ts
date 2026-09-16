// src/calendar-bridge/services/provider-registry.ts

export interface CalendarProviderConfig {
  name: string;
  type: 'oauth' | 'caldav' | 'webcal' | 'ics' | 'custom' | 'exchange';
  tier: 1 | 2 | 3;
  description: string;
}

export const CALENDAR_PROVIDERS: Record<string, CalendarProviderConfig> = {
  // Tier 1 - Major Players
  google: {
    name: "Google Calendar",
    type: "oauth",
    tier: 1,
    description: "OAuth 2.0 direct synchronization"
  },
  apple: {
    name: "Apple Calendar",
    type: "caldav",
    tier: 1,
    description: "iCloud CalDAV safe connection"
  },
  outlook: {
    name: "Microsoft Outlook",
    type: "oauth",
    tier: 1,
    description: "Microsoft Graph API authentication"
  },
  yahoo: {
    name: "Yahoo Calendar",
    type: "oauth",
    tier: 1,
    description: "Yahoo securely authenticated sync"
  },

  // Tier 2 - Professional and International
  proton: {
    name: "Proton Calendar",
    type: "oauth",
    tier: 2,
    description: "End-to-End Encrypted handshake"
  },
  zoho: {
    name: "Zoho Calendar",
    type: "oauth",
    tier: 2,
    description: "Zoho Workspace CalDAV or OAuth"
  },
  fastmail: {
    name: "Fastmail Calendar",
    type: "caldav",
    tier: 2,
    description: "Fastmail App Password connection"
  },
  nextcloud: {
    name: "Nextcloud",
    type: "caldav",
    tier: 2,
    description: "WebDAV/CalDAV private instance"
  },
  teamup: {
    name: "Teamup Calendar",
    type: "webcal",
    tier: 2,
    description: "Teamup shared read-only link"
  },
  calendarbridge: {
    name: "CalendarBridge",
    type: "custom",
    tier: 2,
    description: "Direct bridge integration pipeline"
  },

  // Tier 3 - Open Standards & Corporate Protocols
  caldav: {
    name: "CalDAV Server",
    type: "caldav",
    tier: 3,
    description: "Custom CalDAV credentials connection"
  },
  webcal: {
    name: "WebCal Feed",
    type: "webcal",
    tier: 3,
    description: "Subscription URL (.ics over HTTP)"
  },
  ics: {
    name: "ICS File Import",
    type: "ics",
    tier: 3,
    description: "Upload local calendar snapshot file"
  },
  exchange_activesync: {
    name: "Exchange ActiveSync",
    type: "exchange",
    tier: 3,
    description: "Microsoft Exchange modern synchronization"
  },
  exchange_server: {
    name: "Microsoft Exchange",
    type: "exchange",
    tier: 3,
    description: "On-premise corporate Exchange server"
  },

  // Custom fallback
  other: {
    name: "Other Calendar",
    type: "custom",
    tier: 3,
    description: "Universal custom adapter protocol"
  }
};
