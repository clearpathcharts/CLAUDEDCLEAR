import { ThemeProfile, ThemeProfileId } from './lib/theme/profiles';

export type InterfaceProfileId = ThemeProfileId;

export type GlowLevel = 'none' | 'low' | 'medium' | 'high';

export type MotionLevel = 'static' | 'smooth' | 'dynamic';

export type InterfaceProfile = ThemeProfile;

export interface AnalysisEntry {
  id?: string;
  uid: string;
  createdAt: any;
  pair: string;
  direction: 'long' | 'short';
  timeframe: string;
  entry: number;
  sl: number;
  tp: number;
  rr: number | null;
  resultR: number | null;
  outcome: 'good' | 'bad';
  emotion: string;
  screenshot: string;
  notes: string;
  position?: number;
  exitPrice?: number;
}

export interface JournalSettings {
  startingCapital: number;
  riskPercent: number;
  currencySymbol: string;
  currencyCode: string;
  language: string;
}

export interface Entry {
  ticker: string;
  pos: number;
  entry: number;
}

export interface NewsItem {
  id: string;
  text: string;
  timestamp: number;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username?: string;
  email: string;
  photoURL: string;
  coverURL?: string;
  isVerified?: boolean;
  isFounder?: boolean;
  founderLicenseKey?: string;
  founderApprovedAt?: string;
  founderInvestmentLevel?: string;
  interfaceType: InterfaceProfileId;
  customTheme?: {
    primaryColor: string;
    secondaryColor: string;
    fontSize: string;
    highContrast: boolean;
  };
  bio?: string;
  keywords?: string[];
  linkInBio?: string;
  contactInfo?: {
    email?: string;
    twitter?: string;
    discord?: string;
    instagram?: string;
    website?: string;
    vk?: string;
    telegram?: string;
    tiktok?: string;
    facebook?: string;
  };
  metrics?: {
    followers: number;
    following: number;
    mutuals: number;
  };
  intro?: {
    bio: string;
    location: string;
    company: string;
  };
  statuses?: {
    id: number;
    image: string;
    caption: string;
  }[];
  socials?: {
    website?: string;
    youtube?: string;
    instagram?: string;
    tiktok?: string;
    facebook?: string;
    twitter?: string;
    discord?: string;
    telegram?: string;
    linkedin?: string;
    twitch?: string;
    pinterest?: string;
  };
  /** Live Stripe Payment Link URLs only (https://buy.stripe.com/…). Never store API secrets here. */
  essentialLink?: string;
  plusLink?: string;
  premiumLink?: string;
  ultimateLink?: string;
  vipStatus?: string;
  subscriptionActive?: boolean;
  lastLegalAck?: any;
  createdAt: any;
}

export interface TimelinePost {
  id?: string;
  uid: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'none';
  chartMarkup?: string;
  market_layer?: string;
  likesCount?: number;
  likes?: string[];
  commentsLength?: number;
  symbol?: string;
  createdAt: any;
}

export interface AboutContent {
  title: string;
  body: string;
  lastUpdated: any;
}

export interface MarketAsset {
  symbol: string;
  name: string;
  price?: string;
  change?: string;
  group: string;
}

export interface MarketGroup {
  name: string;
  assets: MarketAsset[];
}

export interface AnalystProfile {
  universe: {
    tickers: string[];
    industries: string[];
    countries: string[];
    commodities: string[];
  };
  exposures: {
    factor: string[];
    sector: string[];
    region: string[];
    rates: number; // sensitivity
    fx: string[];
  };
  constraints: {
    holdingPeriod: string;
    maxDrawdown: number;
    leverage: number;
    liquidityNeeds: string;
    eventRiskTolerance: 'low' | 'medium' | 'high';
  };
  catalystCalendar: {
    earningsWindows: string[];
    rollDates: string[];
    fomcCpiSensitivity: number;
    electionRegulatorySensitivity: number;
  };
  preferredSources: string[];
}

export interface EventObject {
  event_id: string;
  event_time: number; // UTC
  event_type: string; // filing, rule, bill, macro_update, article, advisory...
  entities: string[]; // CIKs, tickers, agencies, committees, countries
  topics: string[]; // energy, banking, AI, defense, sanctions, taxes...
  raw_source: {
    url: string;
    provider: string;
    original_payload?: any;
  };
  title?: string;
  detail?: string;
  source?: string;
  color?: string;
  confidence: number; // 0-1
  impactScore?: number;
  impactExplanation?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AIAsset {
  id: string;
  uid: string;
  type: 'image' | 'video';
  url: string;
  prompt: string;
  model: string;
  config: any;
  createdAt: any;
}

export interface Task {
  id?: string;
  uid: string;
  title: string;
  completed: boolean;
  dueDate: any; // Timestamp
  createdAt: any;
}

export interface Alert {
  id?: string;
  uid: string;
  symbol: string;
  price: number;
  condition: 'above' | 'below';
  triggered: boolean;
  createdAt: any;
}

export interface UserRole {
  uid: string;
  role: 'public' | 'verified' | 'admin' | 'board';
  updatedAt: any;
}

export interface PortfolioPosition {
  id?: string;
  uid: string;
  symbol: string;
  price: number;
  quantity: number;
  createdAt: any;
}

export interface LeaderboardEntry {
  uid: string;
  score: number;
  rank?: number;
}

export interface AnalysisEvent {
  type: 'draw' | 'fundamental' | 'macro';
  time: string;
  data?: {
    metric?: string;
    label?: string;
  };
}

export interface ScreenerFilters {
  pe: number;
  margin: number;
  volume: number;
}

export interface TradingStrategy {
  id?: string;
  uid: string;
  name: string;
  result: number;
  createdAt: any;
}

export interface UserBadge {
  id?: string;
  uid: string;
  type: string;
  createdAt: any;
}

export interface EconomicEvent {
  event: string;
  country: string;
  impact: 'High' | 'Medium' | 'Low';
  date: string;
  actual?: string;
  forecast?: string;
  previous?: string;
}

export interface CompanyFundamentals {
  revenue: number;
  netIncome: number;
  margin: number;
  pe: number;
  eps: number;
  symbol: string;
}

export interface VolumeAnomaly {
  index: number;
  volume: number;
  price: number;
  timestamp: string;
}

export interface ScannerItem {
  symbol: string;
  price: number;
  change: number;
  volume: number;
  score: number;
}
