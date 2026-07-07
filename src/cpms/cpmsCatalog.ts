/** Shared CPMS media catalog — used by the SPA, offline fallback, and Firestore seed script. */

export interface CpmsVideoItem {
  id?: string;
  title: string;
  description: string;
  category: string;
  videoUrl: string;
  thumbnailUrl: string;
  duration: string;
  uploadedAt: string;
  uploadedBy: string;
  relatedIndicatorId: string;
  viewers?: string;
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

/** 12 curated premium videos for the CPMS media library. */
export const SAMPLE_LIBRARY_VIDEOS: CpmsVideoItem[] = [
  {
    title: "Global Debt Expansion & Central Collateral Systems",
    description: "An immersive masterclass breaking down national obligations, sovereign gold backing suspensions, and global liquid collateral velocity across modern tier-1 banking systems.",
    category: "Finance TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    duration: "09:56",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "ClearPath Director",
    relatedIndicatorId: "Global Reserve"
  },
  {
    title: "Order Flow Liquidity & Swaps Infrastructure",
    description: "Evaluating sovereign interest swap spreads, capital collateral requirements, and how the Federal Reserve discount system governs physical money creation.",
    category: "Finance TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?auto=format&fit=crop&w=800&q=80",
    duration: "10:53",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Chief quantitative Officer",
    relatedIndicatorId: "Market Microstructure"
  },
  {
    title: "The Sovereign Yield Curve & Inflation Vectors",
    description: "Mastering yield curve inversions to anticipate macroeconomic shifts, interest premium behaviors, and strategic liquidity rotations ahead of volatile quarters.",
    category: "Finance TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=800&q=80",
    duration: "00:15",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Macro Specialist",
    relatedIndicatorId: "Yield Curve"
  },
  {
    title: "RSI Momentum: Advanced Overbought Fallacies",
    description: "Stripping out standard retail misconceptions surrounding Relative Strength Index boundaries. We rebuild true momentum divergence curves and volatility models.",
    category: "Indicator TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    duration: "00:15",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Lead Engineer",
    relatedIndicatorId: "Relative Strength Index"
  },
  {
    title: "MACD Crossings & Signal Smoothing Calibration",
    description: "A mathematical teardown on tuning exponential moving average lookback thresholds to completely remove market noise in choppy horizontal range environments.",
    category: "Indicator TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80",
    duration: "00:15",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Lead Engineer",
    relatedIndicatorId: "MACD"
  },
  {
    title: "Average True Range (ATR): Scientific Volatility Boundaries",
    description: "How top-tier hedge funds construct mechanical target structures and stop thresholds using true session physical volatility metrics rather than arbitrary price variables.",
    category: "Indicator TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80",
    duration: "00:15",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Quantitative Specialist",
    relatedIndicatorId: "Average True Range"
  },
  {
    title: "Gold Bar Sovereign Havens & High-Volume Collateral",
    description: "Tracing international bullion gold storage chains, global physical clearing flows, and historical safe havens during debt limits collapses.",
    category: "Trading Anarchy TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1610375228957-80da9977ce25?auto=format&fit=crop&w=800&q=80",
    duration: "00:15",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Anarchy Strategist",
    relatedIndicatorId: "Gold Reserves"
  },
  {
    title: "The 4-Up 3-Down Session Momentum Breakout",
    description: "An intensive strategy study focused on detecting breakout sequences by monitoring daily highs, daily lows, and target volatility expansion limits.",
    category: "Trading Anarchy TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1507679799987-c73779587ccf?auto=format&fit=crop&w=800&q=80",
    duration: "00:30",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Anarchy Strategist",
    relatedIndicatorId: "Breakout Models"
  },
  {
    title: "Macroeconomic Pulse: Central Bank Rates Decisions",
    description: "Live brief and quantitative reaction tracking after central bank corridors shift national benchmark rates.",
    category: "Market News TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
    duration: "12:14",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Chief Editor",
    relatedIndicatorId: "Rates Watch"
  },
  {
    title: "Global Currency Flows: Flight to Sovereign Debt Reserves",
    description: "A chronological look at active liquid flight routes into stable sovereign government bonds during session stress levels.",
    category: "Market News TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/WeAreGoingOnBullrun.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?auto=format&fit=crop&w=800&q=80",
    duration: "00:46",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Chief News Editor",
    relatedIndicatorId: "Sovereign Debt"
  },
  {
    title: "Monetary Empires: Bretton Woods & the Suspension of Convertibility",
    description: "A historical investigation of Bretton Woods, the Nixon Shock suspension of gold convertibility, and the emergence of floating fiat paper standards.",
    category: "Documentary TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=800&q=80",
    duration: "08:52",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Media Archivist",
    relatedIndicatorId: "Monetary History"
  },
  {
    title: "Futuristic Ledger Ecosystems & Private Digital Trust",
    description: "A cinematic review of cryptographic clearing corridors, decentralized transaction engines, and asset preservation rules across safe network sectors.",
    category: "Documentary TV",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
    thumbnailUrl: "https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80",
    duration: "12:14",
    uploadedAt: new Date().toISOString(),
    uploadedBy: "Media Archivist",
    relatedIndicatorId: "Trust Protocols"
  }
];

/** Pre-configured premium category channels. */
export const STATIC_DEFAULT_CHANNELS: CpmsChannelSeed[] = [
  {
    name: "Finance TV",
    description: "Sovereign debt systems, high-tier credit creation, and institutional liquid corridors.",
    thumbnailUrl: "linear-gradient(135deg, #050410 0%, #1e3a8a 100%)",
  },
  {
    name: "Indicator TV",
    description: "Quantitative analysis, advanced RSI models, and mechanical signal line smoothing formulas.",
    thumbnailUrl: "linear-gradient(135deg, #050410 0%, #581c87 100%)",
  },
  {
    name: "Trading Anarchy TV",
    description: "High-volatility breakouts, bullion gold standards, and decentralized liquidity flows.",
    thumbnailUrl: "linear-gradient(135deg, #050410 0%, #7f1d1d 100%)",
  },
  {
    name: "Market News TV",
    description: "Macroeconomic rates adjustments, Federal Reserve metrics, and safe haven market pulses.",
    thumbnailUrl: "linear-gradient(135deg, #050410 0%, #14532d 100%)",
  },
  {
    name: "Documentary TV",
    description: "Cinematic documentaries outlining historic currencies collapses and cryptographic futures.",
    thumbnailUrl: "linear-gradient(135deg, #050410 0%, #1e293b 100%)",
  }
];

export const CPMS_CURATOR = "ClearPath Curator";
