import type { SentinelSource } from "../types";

/** Public information pages only — for study / change-awareness, not advice. */
export const DEFAULT_SENTINEL_SOURCES: SentinelSource[] = [
  {
    id: "fed_press",
    label: "Federal Reserve — Press Releases",
    url: "https://www.federalreserve.gov/newsevents/pressreleases.htm",
    agency: "Federal Reserve",
  },
  {
    id: "fed_fomc",
    label: "Federal Reserve — FOMC Calendars",
    url: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    agency: "Federal Reserve",
  },
  {
    id: "sec_press",
    label: "SEC — Press Releases",
    url: "https://www.sec.gov/newsroom/press-releases",
    agency: "SEC",
  },
  {
    id: "sec_litigation",
    label: "SEC — Litigation Releases",
    url: "https://www.sec.gov/enforcement-litigation/litigation-releases",
    agency: "SEC",
  },
  {
    id: "treasury_press",
    label: "U.S. Treasury — Press Releases",
    url: "https://home.treasury.gov/news/press-releases",
    agency: "Treasury",
  },
  {
    id: "treasury_policy",
    label: "U.S. Treasury — Policy Issues",
    url: "https://home.treasury.gov/policy-issues",
    agency: "Treasury",
  },
];
