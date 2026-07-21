/** Shared CPMS media catalog — used by the SPA, offline fallback, and Firestore seed script. */

export interface CpmsVideoItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  /** Progressive MP4 or HLS (.m3u8) stream URL — no YouTube embeds */
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  uploadedAt: string;
  uploadedBy: string;
  relatedIndicatorId: string;
  viewers?: string;
  /** True for 24/7 market news feeds */
  isLive?: boolean;
}

export interface CpmsChannelItem {
  id?: string;
  name: string;
  description: string;
  thumbnailUrl: string;
  createdAt: string;
  createdBy: string;
}

export interface CpmsChannelSeed {
  name: string;
  description: string;
  thumbnailUrl: string;
}

/** Official Bloomberg HLS manifests (direct — not YouTube). */
export const BLOOMBERG_HLS = {
  us: 'https://www.bloomberg.com/media-manifest/streams/us.m3u8',
  eu: 'https://www.bloomberg.com/media-manifest/streams/eu.m3u8',
  /** Bloomberg Originals / Quicktake-style live loop */
  originals: 'https://www.bloomberg.com/media-manifest/streams/qt.m3u8',
} as const;

/** Opens automatically when a visitor enters ClearPath Cinema. */
export const LAUNCH_FEATURED_VIDEO_ID = 'bloomberg-television';

/**
 * Launch-day catalog — direct HLS / MP4 only. No YouTube embeds or channel fallbacks
 * (YouTube live_stream iframes freeze the cinema player).
 * Works without Firestore; seed with `npm run cpms:seed` when ready.
 */
export const SAMPLE_LIBRARY_VIDEOS: CpmsVideoItem[] = [
  {
    id: 'bloomberg-television',
    title: 'Bloomberg Television',
    description: 'Global business and markets — futures, FX, fixed income, and corporate news from Bloomberg TV (direct HLS).',
    category: 'Market News TV',
    videoUrl: BLOOMBERG_HLS.us,
    thumbnailUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=1200&q=80',
    duration: 'LIVE',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'ClearPath Curator',
    relatedIndicatorId: 'Bloomberg TV',
    isLive: true,
    viewers: '22K+',
  },
  {
    id: 'bloomberg-europe',
    title: 'Bloomberg TV Europe',
    description: 'European session open, ECB watch, DAX/FTSE flows, and cross-Atlantic macro linkage.',
    category: 'Market News TV',
    videoUrl: BLOOMBERG_HLS.eu,
    thumbnailUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
    duration: 'LIVE',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'ClearPath Curator',
    relatedIndicatorId: 'European Session',
    isLive: true,
  },
  {
    id: 'bloomberg-originals',
    title: 'Bloomberg Originals — Markets & Macro',
    description: 'Documentary-style market explainers, CEO interviews, and macro deep dives from Bloomberg Originals.',
    category: 'Finance TV',
    videoUrl: BLOOMBERG_HLS.originals,
    thumbnailUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=1200&q=80',
    duration: 'LIVE',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'ClearPath Curator',
    relatedIndicatorId: 'Macro Documentary',
    isLive: true,
  },
  {
    id: 'yahoo-finance-live',
    title: 'Yahoo Finance Live',
    description: 'Live market coverage — equities, rates, commodities, and breaking business headlines from the Yahoo Finance desk.',
    category: 'Market News TV',
    videoUrl: 'https://yahoofinance-live.akamaized.net/hls/live/621757/yahoofinance/master.m3u8',
    thumbnailUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80',
    duration: 'LIVE',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'ClearPath Curator',
    relatedIndicatorId: 'Live Markets',
    isLive: true,
    viewers: '14K+',
  },
  {
    id: 'abc-news-live',
    title: 'ABC News Live — Business & World',
    description: 'Breaking U.S. and global news with market-moving political and economic coverage.',
    category: 'Market News TV',
    videoUrl: 'https://abcnews-live.gcdn.anvato.net/hls/live/abcnews/master.m3u8',
    thumbnailUrl: 'https://images.unsplash.com/photo-1504711434967-e33886168f5c?auto=format&fit=crop&w=1200&q=80',
    duration: 'LIVE',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'ClearPath Curator',
    relatedIndicatorId: 'Breaking News',
    isLive: true,
  },
  {
    id: 'cna-business',
    title: 'CNA — Asia Business & Markets',
    description: 'Asian session coverage — China tech, ASEAN equities, and Pacific macro from CNA.',
    category: 'Market News TV',
    videoUrl: 'https://mediacorp-cna-en.akamaized.net/hls/live/2034701/cnaen/master.m3u8',
    thumbnailUrl: 'https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&w=1200&q=80',
    duration: 'LIVE',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'ClearPath Curator',
    relatedIndicatorId: 'Asia Session',
    isLive: true,
  },
  {
    id: 'yield-curve-masterclass',
    title: 'Yield Curve & Rate Decisions — Masterclass',
    description: 'How to read the 2s10s spread, Fed funds futures, and rate-path pricing ahead of FOMC weeks.',
    category: 'Indicator TV',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=1200&q=80',
    duration: '12:00',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'Macro Specialist',
    relatedIndicatorId: 'Yield Curve',
  },
  {
    id: 'atr-volatility-lab',
    title: 'ATR Volatility Lab — Position Sizing',
    description: 'Using Average True Range for stop placement and size calibration on Gold Bar / UT Bot style systems.',
    category: 'Indicator TV',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80',
    duration: '08:30',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'Lead Engineer',
    relatedIndicatorId: 'Average True Range',
  },
  {
    id: 'gold-bar-strategy',
    title: 'Gold Bar ATR Trailing Stop — Strategy Brief',
    description: 'The ClearPath Gold Bar pattern: ATR trailing stops, crossover signals, and signal-colored candles on live charts.',
    category: 'Trading Anarchy TV',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1610375228957-80da9977ce25?auto=format&fit=crop&w=1200&q=80',
    duration: '06:45',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'Anarchy Strategist',
    relatedIndicatorId: 'Gold Bar',
  },
  {
    id: 'bretton-woods-doc',
    title: 'Monetary Empires: Bretton Woods to Fiat',
    description: 'From gold convertibility to floating rates — the architecture behind modern FX and sovereign debt markets.',
    category: 'Documentary TV',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=1200&q=80',
    duration: '14:00',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'Media Archivist',
    relatedIndicatorId: 'Monetary History',
  },
];

/** Pre-configured premium category channels. */
export const STATIC_DEFAULT_CHANNELS: CpmsChannelSeed[] = [
  {
    name: 'Market News TV',
    description: 'Live desks — Bloomberg, Yahoo Finance, ABC, CNA, and breaking macro headlines.',
    thumbnailUrl: 'linear-gradient(135deg, #050410 0%, #14532d 100%)',
  },
  {
    name: 'Finance TV',
    description: 'Bloomberg Originals and institutional macro explainers.',
    thumbnailUrl: 'linear-gradient(135deg, #050410 0%, #1e3a8a 100%)',
  },
  {
    name: 'Trading Anarchy TV',
    description: 'Gold Bar systems and high-volatility breakout frameworks.',
    thumbnailUrl: 'linear-gradient(135deg, #050410 0%, #7f1d1d 100%)',
  },
  {
    name: 'Indicator TV',
    description: 'RSI, MACD, ATR, and yield-curve mechanics for systematic traders.',
    thumbnailUrl: 'linear-gradient(135deg, #050410 0%, #581c87 100%)',
  },
  {
    name: 'Documentary TV',
    description: 'Monetary history, sovereign debt, and the architecture of modern markets.',
    thumbnailUrl: 'linear-gradient(135deg, #050410 0%, #1e293b 100%)',
  },
];

export const CPMS_CURATOR = 'ClearPath Curator';

/** Founder account authorized for CPMS admin cabinet + Storage writes. */
export const CPMS_FOUNDER_EMAIL = 'forexanarchy@gmail.com';

/** Build offline channel rows from the static seed list. */
export function offlineChannelItems(): CpmsChannelItem[] {
  return STATIC_DEFAULT_CHANNELS.map((ch, idx) => ({
    id: `offline-ch-${idx}`,
    ...ch,
    createdAt: new Date().toISOString(),
    createdBy: CPMS_CURATOR,
  }));
}

/**
 * Normalize cinema rows from Firestore/local cache:
 * - force known-good Bloomberg HLS URLs
 * - drop YouTube-only / empty-URL rows that freeze the player
 */
export function normalizeCinemaVideos(items: CpmsVideoItem[]): CpmsVideoItem[] {
  const bloombergFix: Record<string, string> = {
    'bloomberg-television': BLOOMBERG_HLS.us,
    'bloomberg-europe': BLOOMBERG_HLS.eu,
    'bloomberg-originals': BLOOMBERG_HLS.originals,
  };

  const cleaned: CpmsVideoItem[] = [];
  for (const raw of items) {
    const { youtubeVideoId: _yt, youtubeChannelId: _ch, ...rest } = raw as CpmsVideoItem & {
      youtubeVideoId?: string;
      youtubeChannelId?: string;
    };
    const id = rest.id || '';
    let videoUrl = (rest.videoUrl || '').trim();
    if (bloombergFix[id]) videoUrl = bloombergFix[id];
    // Repair legacy CloudFront / non-www Bloomberg manifests
    if (/bloomberg/i.test(id) || /bloomberg/i.test(videoUrl)) {
      if (!videoUrl.includes('www.bloomberg.com/media-manifest')) {
        if (/europe|\/eu\.m3u8/i.test(`${id} ${videoUrl}`)) videoUrl = BLOOMBERG_HLS.eu;
        else if (/original|quicktake|\/qt\.m3u8/i.test(`${id} ${videoUrl}`)) videoUrl = BLOOMBERG_HLS.originals;
        else if (/bloomberg/i.test(id)) videoUrl = BLOOMBERG_HLS.us;
      }
    }
    if (!videoUrl) continue; // drop YouTube-only leftovers
    cleaned.push({ ...rest, videoUrl });
  }
  return cleaned.length > 0 ? cleaned : SAMPLE_LIBRARY_VIDEOS;
}
