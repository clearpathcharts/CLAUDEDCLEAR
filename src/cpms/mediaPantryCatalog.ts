/** CPMS Media Pantry — curated channels (SiriusXM-style drawers). */

import { BLOOMBERG_HLS } from './cpmsCatalog';

export type MediaDrawerId = 'radio' | 'live' | 'pantry';

export interface PantryShow {
  id: string;
  title: string;
  feedUrl: string;
  host?: string;
  cadence?: string;
}

export interface PantryChannel {
  id: string;
  label: string;
  tagline: string;
  shows: PantryShow[];
}

export interface LiveStreamSource {
  id: string;
  label: string;
  network: string;
  /** Direct HLS (.m3u8) — no YouTube embeds */
  hlsUrl: string;
  description: string;
}

export const MEDIA_DRAWERS: { id: MediaDrawerId; label: string; hint: string }[] = [
  { id: 'radio', label: 'RADIO', hint: 'Podcasts & daily audio' },
  { id: 'live', label: 'LIVE TV', hint: 'Bloomberg direct HLS' },
  { id: 'pantry', label: 'PANTRY', hint: 'Search the open directory' },
];

/** Inclusive channel lineup — everyone gets a seat. */
export const PANTRY_CHANNELS: PantryChannel[] = [
  {
    id: 'markets',
    label: 'Markets & Money',
    tagline: 'Daily trading, macro, and desk talk',
    shows: [
      { id: 'cwt', title: 'Chat With Traders', feedUrl: 'https://chatwithtraders.com/feed/podcast/', host: 'Tessa Dao & team', cadence: 'Weekly' },
      { id: 'fool', title: 'Motley Fool Money', feedUrl: 'https://feeds.foolcdn.com/foolpodcasts/motleyfoolmoney.xml', cadence: 'Weekly' },
      { id: 'ilb', title: 'Invest Like the Best', feedUrl: 'https://feeds.megaphone.fm/investlikethebest', host: 'Patrick O\'Shaughnessy', cadence: 'Weekly' },
      { id: 'macro', title: 'Macro Voices', feedUrl: 'https://macrovoices.com/podcast/rss', cadence: 'Weekly' },
    ],
  },
  {
    id: 'newsroom',
    label: 'The Newsroom',
    tagline: 'Left, center, right — pick your lens',
    shows: [
      { id: 'upfirst', title: 'Up First (NPR)', feedUrl: 'https://feeds.npr.org/510318/podcast.xml', cadence: 'Daily' },
      { id: 'bbc', title: 'BBC Global News Podcast', feedUrl: 'https://podcasts.files.bbci.co.uk/p02pc9w6.rss', cadence: 'Daily' },
      { id: 'daily', title: 'The Daily (NYT)', feedUrl: 'https://feeds.simplecast.com/54nAGcIl', cadence: 'Weekdays' },
      { id: 'wsj', title: 'WSJ What\'s News', feedUrl: 'https://video-api.wsj.com/podcast/rss/wsj/whats-news', cadence: 'Daily' },
    ],
  },
  {
    id: 'neuro',
    label: 'Neurodivergent & Well',
    tagline: 'ADHD, autism, TBI, mental health — front and center',
    shows: [
      { id: 'adhd', title: 'ADHD Experts Podcast', feedUrl: 'https://adhdrewired.com/feed/podcast/', cadence: 'Weekly' },
      { id: 'hacking', title: 'Hacking Your ADHD', feedUrl: 'https://hackingyouradhd.libsyn.com/rss', cadence: 'Weekly' },
      { id: 'hidden', title: 'Hidden Brain', feedUrl: 'https://feeds.simplecast.com/kwWc0lhf', cadence: 'Weekly' },
    ],
  },
  {
    id: 'womens',
    label: "Women's Voices",
    tagline: 'Leadership, markets, and lived experience',
    shows: [
      { id: 'womenwork', title: 'Women at Work (HBR)', feedUrl: 'https://feeds.harvardbusiness.org/harvardbusiness/women-at-work', cadence: 'Biweekly' },
      { id: 'skimm', title: 'Skimm This', feedUrl: 'https://feeds.megaphone.fm/skimmthis', cadence: 'Weekdays' },
    ],
  },
  {
    id: 'lgbtq',
    label: 'LGBTQ+ Voices',
    tagline: 'Queer stories, culture, and resilience',
    shows: [
      { id: 'lgbtqa', title: 'LGBTQ&A', feedUrl: 'https://feeds.simplecast.com/7gkl5syx', cadence: 'Weekly' },
      { id: 'makinggay', title: 'Making Gay History', feedUrl: 'https://makinggayhistory.com/feed/podcast/', cadence: 'Seasonal' },
    ],
  },
  {
    id: 'black',
    label: 'Black Voices',
    tagline: 'Business, culture, and history',
    shows: [
      { id: 'code', title: 'Code Switch (NPR)', feedUrl: 'https://feeds.npr.org/510312/podcast.xml', cadence: 'Weekly' },
      { id: '1619', title: '1619 (NYT)', feedUrl: 'https://feeds.simplecast.com/Nn6fjnB0', cadence: 'Serial' },
    ],
  },
  {
    id: 'latino',
    label: 'Latino / Latina Voices',
    tagline: 'News, identity, and diaspora stories',
    shows: [
      { id: 'latino', title: 'Latino USA (NPR)', feedUrl: 'https://feeds.npr.org/510259/podcast.xml', cadence: 'Weekly' },
    ],
  },
  {
    id: 'faith',
    label: 'Faith & Spirit',
    tagline: 'Across traditions, without picking sides',
    shows: [
      { id: 'onbeing', title: 'On Being', feedUrl: 'https://feeds.feedburner.com/onbeing', cadence: 'Weekly' },
    ],
  },
  {
    id: 'veterans',
    label: 'Veterans & Service',
    tagline: 'Service members and transition stories',
    shows: [
      { id: 'borr', title: 'Borne the Battle (VA)', feedUrl: 'https://feeds.buzzsprout.com/256122.rss', cadence: 'Weekly' },
    ],
  },
  {
    id: 'recovery',
    label: 'Health & Recovery',
    tagline: 'Sobriety, healing, and honest talk',
    shows: [
      { id: 'recovery', title: 'Recovery Happy Hour', feedUrl: 'https://recoveryhappyhour.libsyn.com/rss', cadence: 'Weekly' },
    ],
  },
  {
    id: 'comedy',
    label: 'Comedy & Decompression',
    tagline: 'Release valve while the screens are open',
    shows: [
      { id: 'conan', title: 'Conan O\'Brien Needs A Friend', feedUrl: 'https://feeds.simplecast.com/dHoohVNH', cadence: 'Weekly' },
    ],
  },
];

export const LIVE_STREAM_SOURCES: LiveStreamSource[] = [
  {
    id: 'bloomberg',
    label: 'Bloomberg TV',
    network: 'Bloomberg',
    hlsUrl: BLOOMBERG_HLS.us,
    description: 'Markets, Surveillance, and global business news — direct Bloomberg HLS (no YouTube).',
  },
  {
    id: 'bloomberg-eu',
    label: 'Bloomberg Europe',
    network: 'Bloomberg',
    hlsUrl: BLOOMBERG_HLS.eu,
    description: 'European session coverage from Bloomberg TV Europe — direct HLS.',
  },
  {
    id: 'bloomberg-originals',
    label: 'Bloomberg Originals',
    network: 'Bloomberg',
    hlsUrl: BLOOMBERG_HLS.originals,
    description: 'Macro explainers and market deep dives from Bloomberg Originals — direct HLS.',
  },
];
