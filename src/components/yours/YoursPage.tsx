"use client";
import React, { useState, useEffect, useRef } from 'react';
import { 
  Terminal, 
  Cpu, 
  Zap, 
  Server, 
  Wifi, 
  User, 
  Radio, 
  Globe, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  Share2, 
  Send, 
  MessageSquare,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Newspaper,
  Flame,
  Trophy,
  ChevronRight,
  Search,
  Lock,
  Unlock,
  TrendingUp,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import PoliticalHub from '../PoliticalHub';
import GlobalFinance from '../GlobalFinance';
import MagazineHub from '../MagazineHub';
import WorldHub from '../WorldHub';
import OptimisticInjusticeArticle, { OPTIMISTIC_INJUSTICE_ARTICLE } from './OptimisticInjustice';
import { YwcLavaPanel, YwcSectionTitle } from './YwcLavaPanel';
import { CpmsMediaPantry } from './CpmsMediaPantry';
import { YwcChartDock, YwcChartFloatLayer, YwcChartPlacementHeader, YwcChartWorkspace } from './YwcLiveChartBento';

// Static assets/mock data reflecting the RSS feeds requested by the user
const CORE_COURSES = [
  { id: 'espn', source: 'ESPN', url: 'https://www.espn.com/espn/rss/news' },
  { id: 'f1', source: 'Formula 1', url: 'https://www.formula1.com/en/latest/all.xml' },
  { id: 'nascar', source: 'NASCAR', url: 'https://www.nascar.com/feed/' }
];

const REUTERS_FEED = 'https://feeds.reuters.com/reuters/topNews';
const COINDESK_FEED = 'https://www.coindesk.com/arc/outboundfeeds/rss/';

export default function YoursPageHub() {
  // Navigation / Filter control inside the YWC View
  const [selectedFeedCategory, setSelectedFeedCategory] = useState<'all' | 'sports' | 'news' | 'finance' | 'crypto' | 'politics' | 'tech' | 'magazine' | 'relief'>('all');
  
  // Custom states for simulations
  const [xmlPollingInterval, setXmlPollingInterval] = useState<6 | 12>(12);
  const [isSimulatingFetch, setIsSimulatingFetch] = useState(false);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([]);
  const [fetchProgress, setFetchProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string>(() => new Date().toLocaleTimeString());

  // Market watch state
  const [marketIndices, setMarketIndices] = useState([
    { name: 'S&P 500', ticker: 'SPX', value: 5418.25, change: 12.80, pct: 0.24, isPositive: true },
    { name: 'NASDAQ 100', ticker: 'NDX', value: 19124.50, change: -48.35, pct: -0.25, isPositive: false },
    { name: 'DOW JONES', ticker: 'DJI', value: 39605.10, change: 185.00, pct: 0.47, isPositive: true },
    { name: 'BTC / USD', ticker: 'BTC', value: 68420.00, change: 1240.00, pct: 1.85, isPositive: true },
    { name: 'GOLD (OZ)', ticker: 'XAU', value: 2364.80, change: 18.20, pct: 0.78, isPositive: true },
    { name: 'EUR / USD', ticker: 'EUR', value: 1.0824, change: -0.0016, pct: -0.15, isPositive: false }
  ]);

  // Social login OAuth Hub providers (15 platforms)
  const [socialPlatforms, setSocialPlatforms] = useState([
    { id: 'google', name: 'Google', color: 'hover:border-red-500/80 hover:text-red-400', connected: false, isConnecting: false, username: '' },
    { id: 'facebook', name: 'Facebook', color: 'hover:border-blue-700/80 hover:text-blue-500', connected: false, isConnecting: false, username: '' },
    { id: 'instagram', name: 'Instagram', color: 'hover:border-pink-600/80 hover:text-pink-400', connected: false, isConnecting: false, username: '' },
    { id: 'twitter', name: 'X / Twitter', color: 'hover:border-cyan-400/80 hover:text-cyan-400', connected: false, isConnecting: false, username: '' },
    { id: 'tiktok', name: 'TikTok', color: 'hover:border-neutral-200 hover:text-white', connected: false, isConnecting: false, username: '' },
    { id: 'youtube', name: 'YouTube', color: 'hover:border-red-600 hover:text-red-500', connected: false, isConnecting: false, username: '' },
    { id: 'linkedin', name: 'LinkedIn', color: 'hover:border-blue-600 hover:text-blue-400', connected: false, isConnecting: false, username: '' },
    { id: 'reddit', name: 'Reddit', color: 'hover:border-orange-500 hover:text-orange-400', connected: false, isConnecting: false, username: '' },
    { id: 'discord', name: 'Discord', color: 'hover:border-indigo-500 hover:text-indigo-400', connected: false, isConnecting: false, username: '' },
    { id: 'telegram', name: 'Telegram', color: 'hover:border-sky-400 hover:text-sky-300', connected: false, isConnecting: false, username: '' },
    { id: 'vk', name: 'VKontakte', color: 'hover:border-blue-500 hover:text-blue-400', connected: false, isConnecting: false, username: '' },
    { id: 'snapchat', name: 'Snapchat', color: 'hover:border-yellow-400 hover:text-yellow-300', connected: false, isConnecting: false, username: '' },
    { id: 'pinterest', name: 'Pinterest', color: 'hover:border-red-500 hover:text-red-400', connected: false, isConnecting: false, username: '' },
    { id: 'threads', name: 'Threads', color: 'hover:border-zinc-300 hover:text-zinc-200', connected: false, isConnecting: false, username: '' },
    { id: 'twitch', name: 'Twitch', color: 'hover:border-violet-500 hover:text-violet-400', connected: false, isConnecting: false, username: '' }
  ]);

  // Social feed aggregate simulation
  const [socialFeed, setSocialFeed] = useState<Array<{ id: string, platform: string, author: string, handle: string, content: string, time: string }>>([
    { id: 's1', platform: 'twitter', author: 'Markus Macro', handle: '@macro_markus', content: 'Aggregated yield spreads show critical resistance on standard OTC benches. CPMS live signals indicating near-term short covering.', time: '10m ago' },
    { id: 's2', platform: 'discord', author: 'GlowTrader', handle: '#cpms-alpha', content: 'Master patterns setup triggers perfect harmonic long signals on EUR/USD spot desk. Locked in +45 pips! Thanks CPMS intelligence!', time: '24m ago' },
    { id: 's3', platform: 'linkedin', author: 'Dr. Sarah Pierce', handle: 'Global Risk Officer', content: 'Sovereign liquidity metrics continue to suggest systematic core reserve contraction. Watching the federal auction logs strictly.', time: '1h ago' }
  ]);
  const [newPostText, setNewPostText] = useState('');

  // Reader modal story
  const [activeStoryDetails, setActiveStoryDetails] = useState<any | null>(null);

  // Ticker text
  const tickerItems = [
    "🔥 BREAKING: Federal Reserves maintain rate thresholds, citing stable employment indices & robust retail metrics...",
    "⚽ SPORTS: Verstappen secures breathtaking pole-position at Monaco Grand Prix after high-speed final sector duel...",
    "💹 MARKET WATCH: Bitcoin clears technical resistance at $68,400 as spot exchange volumes reach high threshold limits...",
    "⚡ TECH: Sub-3nm semiconductor production lines expand inside Arizona facilities to satisfy AI infrastructure demand...",
    "⚖️ POLITICS: Coordinated energy security package enters congressional debate, offering tax deductions for natural gas utility installations..."
  ];

  // Simulated live feed item repository representing the sections
  const [newsFeed, setNewsFeed] = useState([
    {
      id: OPTIMISTIC_INJUSTICE_ARTICLE.id,
      category: OPTIMISTIC_INJUSTICE_ARTICLE.category,
      subcategory: OPTIMISTIC_INJUSTICE_ARTICLE.subcategory,
      title: OPTIMISTIC_INJUSTICE_ARTICLE.title,
      premium: OPTIMISTIC_INJUSTICE_ARTICLE.premium,
      source: OPTIMISTIC_INJUSTICE_ARTICLE.source,
      image: OPTIMISTIC_INJUSTICE_ARTICLE.image,
      time: OPTIMISTIC_INJUSTICE_ARTICLE.time,
      desc: OPTIMISTIC_INJUSTICE_ARTICLE.desc,
      longText: OPTIMISTIC_INJUSTICE_ARTICLE.longText
    },
    {
      id: 'relief-11',
      category: 'relief',
      subcategory: 'Healthcare Protection',
      title: 'World: Still Under Attack: A Decade of Monitoring Attacks on Health Care after Security Council Resolution 2286',
      premium: false,
      source: 'Insecurity Insight',
      image: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=600',
      time: 'Thu, 11 Jun 2026',
      desc: 'A major new report analyses a decade of violence against healthcare, documenting over 17,500 attacks and the loss of 3,860 health workers across global conflict settings.',
      longText: 'Over 17,500 attacks on healthcare infrastructure were systematically recorded between January 2016 and December 2025. Drawing on ten years of systematically collected data, Insecurity Insight documents the devastating scale, patterns, and consequences of attacks on healthcare in conflict-affected settings worldwide. The report notes that over 3,860 health workers were killed and 2,500 arrested or detained, with local staff bearing 65% of the casualty rate. Rising drone and explosive weapon usage continues to compound surgical and facility degradation.'
    },
    {
      id: 'relief-12',
      category: 'relief',
      subcategory: 'Migration Routes',
      title: 'World: Western Balkans : Migration Routes & Dynamics Report (April 2026)',
      premium: false,
      source: 'International Organization for Migration',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
      time: 'Thu, 11 Jun 2026',
      desc: 'The latest IOM survey offers structural insights into the pathways, profiles, and protection status of migrants transiting through Balkan routes.',
      longText: 'Analyzing transit maps across Albania, Bosnia and Herzegovina, Montenegro, North Macedonia, Serbia, and Kosovo, the International Organization for Migration (IOM) surveyed 687 transiting migrants in April 2026. The report details demographic structures, transited geography, and intended final destinations, underscoring the urgent requirement for unified regional protection structures and humane legal corridors.'
    },
    {
      id: 'relief-13',
      category: 'relief',
      subcategory: 'Food Insecurity',
      title: 'Togo: PAM et Gouvernement se mobilisent contre l’insécurité alimentaire au nord',
      premium: false,
      source: 'World Food Programme',
      image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=600',
      time: 'Thu, 11 Jun 2026',
      desc: 'Le PAM et le Gouvernement togolais déploient une réponse intégrée pour soutenir les populations face aux risques de la période de soudure.',
      longText: 'Selon les projections du Cadre Harmonisé, environ 332 000 personnes pourraient faire face à une situation de crise alimentaire (Phase 3) entre juin et août 2026 sans intervention. Pour atténuer ces risques, le WFP et le Gouvernement togolais déploient le Programme d’Urgence pour le Renforcement de la Résilience (PURS), associant des stocks céréaliers stratégiques de 40 000 tonnes à des transferts monétaires, des repas scolaires à base de produits locaux, et des interventions de restauration des terres.'
    },
    {
      id: 'relief-14',
      category: 'relief',
      subcategory: 'Territorial Action',
      title: 'Colombia: WFP Country Brief outlines shifts to peacebuilding and community resilience',
      premium: false,
      source: 'World Food Programme',
      image: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&q=80&w=600',
      time: 'Thu, 11 Jun 2026',
      desc: 'WFP transitions towards a comprehensive response combining emergency climate assistance with structural peacebuilding and zero-hunger models.',
      longText: `WFP's latest assessment indicates that 37% of households in Colombia's 15 most vulnerable departments face moderate or severe food insecurity, driven by internal violence, mixed migration, and extreme weather. Transitioning active projects, WFP has aligned operations with Colombia's long-term peace objectives, executing integrated programs that combine localized emergency logistics with community-led agricultural development and soil restoration.`
    },
    {
      id: 'relief-15',
      category: 'relief',
      subcategory: 'Climate Resilience',
      title: 'Bangladesh: Community-led drainage construction directly mitigates chronic flooding',
      premium: false,
      source: 'Concern Worldwide',
      image: 'https://images.unsplash.com/photo-1547082299-de196ea013d6?auto=format&fit=crop&q=80&w=600',
      time: 'Thu, 11 Jun 2026',
      desc: 'Under the Zurich Climate Resilience Alliance, community action groups successfully construct physical water drainage projects to secure agricultural yields.',
      longText: 'By deploying the Climate Resilience Measurement for Communities (CRMC) framework, Concern Worldwide has supported rural villages bordering the Saniajan River. In Nij Goddimari, a community-led resilience group successfully advocated for and engineered a 26-meter U-drain. The physical barrier has mitigated prolonged land waterlogging, secured fragile local crops, and kept access to surrounding schools and hospitals intact.'
    },
    {
      id: 'relief-1',
      category: 'relief',
      subcategory: 'Refugee Support',
      title: 'World: With seven in 10 refugees living in long-term displacement, UNHCR calls for solutions',
      premium: false,
      source: 'UN High Commissioner for Refugees',
      image: 'https://images.unsplash.com/photo-1469571486040-0b3b279a74dd?auto=format&fit=crop&q=80&w=600',
      time: 'Thu, 11 Jun 2026',
      desc: 'The latest Global Trends Report shows that returns are also gathering pace: 14.7 million displaced people returned to their areas or countries of origin in 2025.',
      longText: 'The latest Global Trends Report shows that returns are also gathering pace: 14.7 million displaced people returned to their areas or countries of origin in 2025. UNHCR urges global collaboration to expand secure pathways of rehabilitation. Under extreme displacement contexts, humanitarian networks calls for comprehensive support programs centered on dignity, legal identification, and physical rehabilitation.'
    },
    {
      id: 'relief-2',
      category: 'relief',
      subcategory: 'Epidemic Monitor',
      title: 'Nigeria: Rapid surge in suspected cholera cases places health facilities under severe strain',
      premium: false,
      source: 'Médecins Sans Frontières',
      image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&q=80&w=600',
      time: 'Wed, 10 Jun 2026',
      desc: 'MSF is supporting the Borno State Ministry of Health (MoH) to respond to a rapidly evolving surge in suspected cholera cases across Borno State, where more than seven thousand people have fallen ill since early May 2026.',
      longText: 'Doctors Without Borders (Médecins Sans Frontières) is supporting the Borno State Ministry of Health (MoH) to respond to a rapidly evolving surge in suspected cholera cases across Borno State, where more than seven thousand people have fallen ill since early May 2026. Treatment structures and rehydration reserves are under heavy pressure, requesting supplementary staff deployment and clean water trucks across non-urban zones.'
    },
    {
      id: 'relief-3',
      category: 'relief',
      subcategory: 'Food Security',
      title: 'South Sudan: Food insecurity worsens in Jonglei amid conflict and aid suspensions',
      premium: false,
      source: 'Save the Children',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
      time: 'Tue, 09 Jun 2026',
      desc: 'Save the Children warns that parts of South Sudan are at risk of famine as acute food insecurity and child malnutrition worsen, with conflict, flooding and aid suspensions disrupting essential services in Jonglei state.',
      longText: 'South Sudan is facing extreme stress vectors in the Jonglei province. Severe flooding combined with localized conflict has disrupted critical agricultural yields and halted standard supply routes. Save the Children warns that parts of South Sudan are at risk of famine as acute food insecurity and child malnutrition worsen, with conflict, flooding and aid suspensions disrupting essential services in Jonglei state.'
    },
    {
      id: 'relief-4',
      category: 'relief',
      subcategory: 'Peace Analytics',
      title: 'World: Global peacefulness deteriorates for twelfth consecutive year',
      premium: false,
      source: 'Institute for Economics and Peace',
      image: 'https://images.unsplash.com/photo-1444653303775-603403e56c5a?auto=format&fit=crop&q=80&w=600',
      time: 'Tue, 09 Jun 2026',
      desc: 'The 2026 Global Peace Index reveals a world struggling with the economic consequences of a record-high number of conflicts that are increasingly interconnected and difficult to resolve.',
      longText: 'The 2026 Global Peace Index reveals a world struggling with the economic consequences of a record-high number of conflicts that are increasingly interconnected and difficult to resolve. Traditional mediation mechanisms are facing structural limitations, demanding alternative analytical models to map and predict tension hot-zones.'
    },
    {
      id: 'relief-5',
      category: 'relief',
      subcategory: 'Trauma Relief',
      title: 'Drone strikes cause mass casualties at Chad-Sudan border',
      premium: false,
      source: 'Médecins Sans Frontières',
      image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&q=80&w=600',
      time: 'Thu, 04 Jun 2026',
      desc: 'Since early May, drone strikes around Tina, Sudan, near the Chadian border, have intensified, leading to repeated influxes of wounded patients at Tiné Hospital, supported by MSF in Chad.',
      longText: 'Since early May, drone strikes around Tina, Sudan, near the Chadian border, have intensified, leading to repeated influxes of wounded patients at Tiné Hospital, supported by Médecins Sans Frontières (MSF) in Chad. MSF warns of sharp escalations in direct civilian impact, requesting uninhibited safety corridors to restore medical logistics pipelines.'
    },
    {
      id: 'relief-6',
      category: 'relief',
      subcategory: 'Protection',
      title: 'oPt: Dire conditions trap Gaza’s children in an endless cycle of suffering',
      premium: false,
      source: "UN Children's Fund (UNICEF)",
      image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=600',
      time: 'Fri, 29 May 2026',
      desc: 'UNICEF is calling for safe unfettered access to deliver aid operations, the lifting of restrictions on items needed to quickly repair and sustain water and sanitation systems.',
      longText: 'Direr conditions continue to trap children in Gaza in a cyclic pattern of suffering. UNICEF is calling for safe unfettered access to deliver aid operations, the lifting of restrictions on items needed to quickly repair and sustain water and sanitation systems, and for International Humanitarian Law (IHL) to be upheld with absolute transparency code-wide.'
    },
    {
      id: 'relief-7',
      category: 'relief',
      subcategory: 'Commodity Risk',
      title: 'World: Strait of Hormuz conflict threatens global food prices as FAO warns time is running out',
      premium: false,
      source: 'Food & Agriculture Organization',
      image: 'https://images.unsplash.com/photo-1494412574643-ff11b0a5c1c3?auto=format&fit=crop&q=80&w=600',
      time: 'Wed, 20 May 2026',
      desc: 'The window for preventive action is closing quickly. Decisions taken now on fertilizer use, imports and crop choices will determine whether a severe global food price crisis emerges in 6-12 months.',
      longText: 'The window for preventive action is closing quickly. Decisions taken now on fertilizer use, imports and crop choices will determine whether a severe global food price crisis emerges in 6-12 months. Disruption vectors across key shipping passes threaten bilateral grain routing schedules.'
    },
    {
      id: 'relief-8',
      category: 'relief',
      subcategory: 'Epidemic Control',
      title: 'DR Congo: Ebola outbreak in eastern DRC spreading faster than response',
      premium: false,
      source: 'International Rescue Committee',
      image: 'https://images.unsplash.com/photo-1581056771107-24ca5f033842?auto=format&fit=crop&q=80&w=600',
      time: 'Tue, 26 May 2026',
      desc: 'Aid cuts mean eastern DRC has a weaker health system now than it did before the 2018-20 outbreak that killed more than 2,000 people. IRC calls for urgent funding.',
      longText: 'Aid cuts mean eastern DRC has a weaker health system now than it did before the 2018-20 outbreak that killed more than 2,000 people. IRC calls for urgent funding and coordination to contain epidemic. Suspected cases are rising exponentially, signaling that response logistics must scale immediately.'
    },
    {
      id: 'relief-9',
      category: 'relief',
      subcategory: 'Sahel Alliance',
      title: 'Mali: More than 24 million people in the Sahel urgently need aid',
      premium: false,
      source: 'UN OCHA',
      image: 'https://images.unsplash.com/photo-1509099836639-18ba1795216d?auto=format&fit=crop&q=80&w=600',
      time: 'Tue, 02 Jun 2026',
      desc: 'Violence in the Central Sahel is spreading beyond its traditional borders and rapidly spilling over into coastal West Africa, rendering the Sahel one of the main epicentres of violence in Africa.',
      longText: 'Violence in the Central Sahel is spreading beyond its traditional borders and rapidly spilling over into coastal West Africa, rendering the Sahel one of the main epicentres of violence in Africa. Over 24 million people in this critical pocket require immediate water filtration, medical treatment centers, and stable nutrition supplies.'
    },
    {
      id: 'relief-10',
      category: 'relief',
      subcategory: 'Food Nutrition',
      title: 'Somalia: UN agencies warn of worsening hunger and malnutrition crisis as famine risk emerges',
      premium: false,
      source: 'World Food Programme & FAO',
      image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=600',
      time: 'Fri, 15 May 2026',
      desc: 'A rapidly intensifying hunger emergency is pushing six million people – 31 percent of the population – into critical levels of food insecurity.',
      longText: 'A rapidly intensifying hunger emergency is pushing six million people – 31 percent of the population – into critical levels of food insecurity (IPC Phase 3 or above), affecting 1.9 million children. Drought-stricken locations are calling for immediate distribution hubs to counteract localized famine risk indices.'
    },
    {
      id: 'a1',
      category: 'sports',
      subcategory: 'NFL',
      title: 'Chiefs Win Thriller in Overtime with Impeccable Red Zone Strategy',
      premium: false,
      source: 'ESPN Sports Desk',
      image: 'https://images.unsplash.com/photo-1547347298-4074fc3086f0?auto=format&fit=crop&q=80&w=600',
      time: '18m ago',
      desc: 'An intense overtime drive capped with a dramatic passing touchdown secures the victory in a highly physical conference final.',
      longText: 'The Chiefs secured a historic overtime win on Sunday night, putting on a clinic of tactical resilience. Defensive coordination held their opponents to field goals throughout the fourth quarter, allowing the offense to leverage precise quick-outs in high-pressure down situations. Analysts highlight that the game-winning touchdown relied on a classic West Coast route package, exploiting weak zone coverage directly opposite the linebacker seams.'
    },
    {
      id: 'a2',
      category: 'sports',
      subcategory: 'Formula 1',
      title: 'Verstappen Wins Emilia Romagna GP After Intense Red Bull Setup adjustments',
      premium: true,
      source: 'Formula 1 Official',
      image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600',
      time: '22m ago',
      desc: 'Max Verstappen survives high tire degradation to hold off late-charging rivals on the technical Imola layout.',
      longText: 'Struggling with balance issues during private sessions, Verstappen’s engineering desk overhauled the rear suspension damper rates just moments before qualifying. The gamble paid off: Max clinched pole and successfully executed an aggressive single-stop hard compound strategy. Despite a blistering late-stage charge by competitors on fresher rubber, Red Bull’s clean telemetry line defenses held clean to secure first-place honors.'
    },
    {
      id: 'a3',
      category: 'sports',
      subcategory: 'NASCAR',
      title: 'Byron Takes Checkered Flag at Darlington as Multi-Car Collision Freezes Field',
      premium: false,
      source: 'NASCAR Feed',
      image: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=600',
      time: '34m ago',
      desc: 'William Byron maneuvers past late-stage corner traffic to claim Darlington honors under a tense green-white-checkered final.',
      longText: 'Darlington proved its notorious "Too Tough to Tame" title on Sunday afternoon. A critical multi-car pileup in Turn 2 sent ripples of mechanical debris across the track surface with only 8 laps remaining. Byron, relying on sharp navigation spots from his crew desk, chose the high line groove and maintained throttle authority to clear the field ahead of emergency caution flags.'
    },
    {
      id: 'a4',
      category: 'finance',
      subcategory: 'Macro Market',
      title: 'Global Markets Rally on Cooling Consumer Inflation and Easing Bond Yield Gauges',
      premium: false,
      source: 'Reuters Financial',
      image: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&q=80&w=600',
      time: '5m of UTC',
      desc: 'Treasury yields stabilize under 4.3% as retail benchmarks soften, triggering an immediate rotation into high-beta tech blocks.',
      longText: 'The official print of the Consumer Price Index (CPI) arrived lower than baseline forecasts, injecting sudden relief through global trading chambers. High-yield municipal paper saw sudden spot bids, sending bilateral exchange yields lower. Macro-oriented funds aggressively rotated assets out of defensive safe-haven currencies into corporate growth blocks, anticipating that central banks have officially concluded their tightening cycles.'
    },
    {
      id: 'a5',
      category: 'crypto',
      subcategory: 'Asset Flows',
      title: 'Bitcoin Surges Past $68,400 Resistance Triggering Over $120M in Leveraged Short Squeezes',
      premium: true,
      source: 'CoinDesk Desk',
      image: 'https://images.unsplash.com/photo-1516245834210-c4c142787335?auto=format&fit=crop&q=80&w=600',
      time: '12m ago',
      desc: 'Spot volume spikes across prominent domestic exchanges absorb large market sell walls, pushing prices to local highs.',
      longText: 'The sudden breakout occurred after a massive block of buy orders cleared the OTC registers, directly triggering cascade liquidations of over-leveraged short options. Analysts track that Bitcoin supply reserves on major public exchange addresses have reached their lowest levels since 2018, heightening spot market sensitivity to sudden investment flows.'
    },
    {
      id: 'a6',
      category: 'politics',
      subcategory: 'Legislative',
      title: 'Senate Approves Major Interstate Defense Infrastructure and Renewable Utility Package',
      premium: false,
      source: 'AP Washington',
      image: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&q=80&w=600',
      time: '45m ago',
      desc: 'Bipartisan vote delivers historic framework funding for high-capacity electric grids and naval shipping canals.',
      longText: 'Following two weeks of intensive committee debate, lawmakers approved the comprehensive infrastructure bill with a 72-26 majority. The legislation distributes billions in direct grants to modernize high-voltage transmission lines, reinforcing electrical supply stability for localized datacenters, while expanding maritime canal locks across corporate shipping channels.'
    },
    {
      id: 'a7',
      category: 'tech',
      subcategory: 'Artificial Labor',
      title: 'Apple Unveils Vision Pro 2 Powered by Massive Coprocessor Fabric for Neural Tracking',
      premium: true,
      source: 'Wired News',
      image: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&q=80&w=600',
      time: '1h ago',
      desc: 'Next-generation spatial visor automates professional desk tasks using high-bandwidth local language models.',
      longText: 'Apple shocked enterprise networks by releasing its premium spatial computer sooner than competitors projected. Utilizing a proprietary dual silicon stack featuring advanced liquid-cooling thermal pipes, the visor enables sub-millisecond eye-tracking fidelity. The real breakthrough lies in its integrated desktop proxy agent, allowing users to automate heavy spreadsheets, slide design, and code compilations with simple spatial gaze commands.'
    },
    {
      id: 'a8',
      category: 'magazine',
      subcategory: 'Design Core',
      title: 'Minimalist Grid Interfaces: The Return of Print-inspired Asymmetric Typography',
      premium: false,
      source: 'Wired Media',
      image: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&q=80&w=600',
      time: '2h ago',
      desc: 'Why leading digital terminals are discarding generic bento systems for spacious editorial canvas structures.',
      longText: 'The excessive saturation of modular cards is driving high-end digital publications back to classic print principles. By employing massive serif displays paired with absolute clamp-based scale ratios, authors structure layouts that feel highly organic, human, and artistic. Asymmetry, dramatic headers, and wide negative margins enhance user retention and establish an elite aesthetic character.'
    }
  ]);

  // Handle simulated auto RSS update triggers (every 6 or 12 hours check)
  const handleSimulateRSSFetch = () => {
    setIsSimulatingFetch(true);
    setFetchProgress(10);
    setSimulatedLogs([`[0.0s] [CRON] Triggered automatic feed update sequence...`]);

    const steps = [
      { t: 400, p: 25, log: `[0.4s] Connecting to ESPN RSS feed: https://www.espn.com/espn/rss/news...` },
      { t: 900, p: 45, log: `[0.9s] Connected. Found 12 XML feed nodes. Translating nodes to generic JSON objects...` },
      { t: 1400, p: 60, log: `[1.4s] Connecting to Formula 1 XML nodes & NASCAR RSS stream...` },
      { t: 1900, p: 75, log: `[1.9s] Connecting to Reuters Financial (${REUTERS_FEED}) & CoinDesk (${COINDESK_FEED})...` },
      { t: 2400, p: 90, log: `[2.4s] Completed OAuth streaming parsing. XML parse validation index: 100% green.` },
      { t: 2800, p: 100, log: `[2.8s] Database cache updated. React state updated. 8 high-fidelity cards smoothly compiled with glassmorphism glow!` }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setFetchProgress(step.p);
        setSimulatedLogs(prev => [...prev, step.log]);
        
        if (idx === steps.length - 1) {
          setIsSimulatingFetch(false);
          setLastSyncTime(new Date().toLocaleTimeString());
          
          // Randomize market prices slightly as a visual indicator
          setMarketIndices(prev => prev.map(item => {
            const delta = (Math.random() - 0.5) * (item.value * 0.015);
            const newValue = item.value + delta;
            const newChange = item.change + (delta * 0.2);
            return {
              ...item,
              value: parseFloat(newValue.toFixed(item.name.includes('EUR') ? 4 : 2)),
              change: parseFloat(newChange.toFixed(2)),
              pct: parseFloat(((newChange / (newValue - newChange)) * 100).toFixed(2)),
              isPositive: newChange >= 0
            };
          }));
        }
      }, step.t);
    });
  };

  // Social account simulation login triggering handshakes
  const handleTriggerSocialConnect = (id: string, name: string) => {
    setSocialPlatforms(prev => prev.map(p => {
      if (p.id === id) {
        if (p.connected) {
          // Disconnect
          return { ...p, connected: false, username: '' };
        } else {
          // Trigger connecting state
          return { ...p, isConnecting: true };
        }
      }
      return p;
    }));

    // If connecting, wait 1.5 seconds to simulate API websocket handshake
    const platform = socialPlatforms.find(p => p.id === id);
    if (platform && !platform.connected) {
      setTimeout(() => {
        const seedUsername = `@${name.toLowerCase().replace(/\s/g, '')}_cpms_node`;
        
        setSocialPlatforms(prev => prev.map(p => {
          if (p.id === id) {
            return {
              ...p,
              connected: true,
              isConnecting: false,
              username: seedUsername
            };
          }
          return p;
        }));

        // Add dummy broadcast signal log to feed
        const dummyPost = {
          id: 'sys_' + Date.now(),
          platform: id,
          author: `${name} Cloud Gateway`,
          handle: seedUsername,
          content: `⚡ Secure OAuth Handshake successful! WS Pipeline anchored verified on gateway broker node port 3000. Ready to stream data matrices.`,
          time: 'Just now'
        };
        setSocialFeed(prev => [dummyPost, ...prev]);

      }, 1500);
    }
  };

  const handlePublishPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;

    // Get any connected platform to verify if user has active handshake
    const activePlatform = socialPlatforms.find(p => p.connected);
    const platformId = activePlatform ? activePlatform.id : 'twitter';
    const authorName = activePlatform ? activePlatform.name : 'Guest Reader';
    const authorHandle = activePlatform ? activePlatform.username : '@guest_cpms_reader';

    const newPost = {
      id: 'custom_' + Date.now(),
      platform: platformId,
      author: authorName,
      handle: authorHandle,
      content: newPostText.trim(),
      time: 'Just now'
    };

    setSocialFeed(prev => [newPost, ...prev]);
    setNewPostText('');
  };

  const activeConnectedCount = socialPlatforms.filter(p => p.connected).length;

  // Filtered news items
  const filteredFeed = selectedFeedCategory === 'all'
    ? newsFeed
    : newsFeed.filter(item => item.category === selectedFeedCategory);

  return (
    <YwcChartWorkspace>
    <div id="ywc-page-canvas" className="min-h-screen bg-[#030003] text-white font-sans selection:bg-[#ff0088] selection:text-white p-4 md:p-8 space-y-8 select-none relative overflow-x-hidden">
      
      {/* Lava / neon atmosphere */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,0,128,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,69,0,0.04)_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
      <div className="absolute -top-32 left-1/4 w-[700px] h-[500px] bg-[#FF0080]/20 blur-[140px] rounded-full pointer-events-none animate-pulse" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-[#FF4500]/25 blur-[120px] rounded-full pointer-events-none ywc-lava-drift" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[400px] bg-[#BF00FF]/15 blur-[130px] rounded-full pointer-events-none" />

      {/* TOP HEADER MODULE - BRAND PROVENANCE */}
      <YwcLavaPanel rounded="3xl" padding="p-6 md:p-8 pt-7">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-[9px] font-mono tracking-[0.3em] bg-gradient-to-r from-[#FF0080] via-[#FF4500] to-[#FF1493] text-black px-3 py-1 rounded-full font-black uppercase shadow-[0_0_20px_rgba(255,0,128,0.6)]">
                Y.W.C. CORE MODULE
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-mono text-[#00FF88] font-bold drop-shadow-[0_0_8px_rgba(0,255,136,0.5)]">
                <span className="w-2 h-2 bg-[#00FF88] rounded-full animate-pulse shadow-[0_0_10px_#00FF88]" />
                SYSTEM SECURE Handshake (Port 3000)
              </span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black font-serif italic tracking-tight flex flex-wrap items-center gap-3 leading-[1.05]">
              <span className="text-white drop-shadow-[0_0_24px_rgba(255,255,255,0.35)]">CPMS</span>
              <span className="ywc-title-lava flex items-center gap-3">
                Your World Connected
                <Flame className="w-10 h-10 md:w-12 md:h-12 text-[#FF4500] fill-[#FF0080] animate-pulse drop-shadow-[0_0_20px_rgba(255,69,0,0.9)] shrink-0" />
              </span>
            </h1>
            
            <p className="text-sm md:text-base text-[#FFD4E8] font-sans max-w-2xl leading-relaxed drop-shadow-[0_0_12px_rgba(255,20,147,0.2)]">
              Welcome to the <span className="text-[#FF1493] font-bold">premium interactive terminal</span>. This workspace fuses elite editorial columns, sports streams, global indices, AI insight systems, live audio monitors, and a <span className="text-[#FF4500] font-bold">15-platform OAuth</span> social sync hub — built for maximum energy, not faded wallpaper.
            </p>
          </div>

          {/* Sync status & manual simulator trigger */}
          <div className="bg-black/70 rounded-2xl border-2 border-[#FF1493]/40 p-4 md:min-w-[280px] space-y-3 shadow-[0_0_24px_rgba(255,20,147,0.2)]">
            <div className="flex items-center justify-between text-[11px] font-mono text-[#FFB3D9]">
              <span>Automatic Chrono Sync:</span>
              <span className="text-[#00E5FF] font-bold drop-shadow-[0_0_6px_#00E5FF]">{xmlPollingInterval} hours</span>
            </div>
            
            <div className="flex items-center justify-between text-[11px] font-mono text-[#FFB3D9]">
              <span>Last Handshake (XML/RSS):</span>
              <span className="text-[#FF4500] font-bold drop-shadow-[0_0_6px_#FF4500]">{lastSyncTime}</span>
            </div>

            {/* Simulated cron rate changer */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#FF1493]/30">
              <span className="text-[10px] font-mono text-[#FF69B4]">SET CRON RATE:</span>
              <button 
                onClick={() => setXmlPollingInterval(6)} 
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all font-bold ${xmlPollingInterval === 6 ? 'bg-gradient-to-r from-[#FF0080] to-[#FF4500] text-white shadow-[0_0_12px_#FF4500]' : 'bg-zinc-900 text-zinc-400 hover:text-[#FF1493]'}`}
              >
                6 Hours
              </button>
              <button 
                onClick={() => setXmlPollingInterval(12)} 
                className={`px-2 py-0.5 rounded text-[9px] font-mono transition-all font-bold ${xmlPollingInterval === 12 ? 'bg-gradient-to-r from-[#FF0080] to-[#FF4500] text-white shadow-[0_0_12px_#FF4500]' : 'bg-zinc-900 text-zinc-400 hover:text-[#FF1493]'}`}
              >
                12 Hours
              </button>
            </div>
          </div>
        </div>
      </YwcLavaPanel>

      <YwcChartPlacementHeader />

      {/* AUTO UPDATE SIMULATION CONSOLE LOG (CRON, XML/RSS PIPELINE TO REACT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Core Live Update & RSS Engine Simulator */}
        <YwcLavaPanel className="lg:col-span-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#FF1493]/25">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-[#FF4500]/15 text-[#FF4500] shadow-[0_0_12px_rgba(255,69,0,0.35)]">
                <RefreshCw size={19} className={isSimulatingFetch ? 'animate-spin' : ''} />
              </div>
              <div>
                <YwcSectionTitle className="text-sm font-sans">
                  RSS Fetch & Node Parser Simulator
                </YwcSectionTitle>
                <p className="text-[11px] text-zinc-500 font-mono">
                  Convert live streams (ESPN, Formula 1, AP, Reuters, CoinDesk) into reactive grid matrices
                </p>
              </div>
            </div>

            <button
              onClick={handleSimulateRSSFetch}
              disabled={isSimulatingFetch}
              className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                isSimulatingFetch 
                  ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-[#FF0080] via-[#FF4500] to-[#FF8C00] text-black hover:shadow-[0_0_24px_rgba(255,69,0,0.55)]'
              }`}
            >
              <span>{isSimulatingFetch ? 'PROCESSING FEED...' : 'FORCE RSS XML FETCH'}</span>
            </button>
          </div>

          {/* Logging console resembling standard terminal */}
          <div className="bg-black/95 rounded-xl border border-white/5 p-4 font-mono text-[11px] leading-relaxed relative min-h-[120px] max-h-[160px] overflow-y-auto space-y-1.5 custom-scrollbar">
            {simulatedLogs.length === 0 ? (
              <div className="text-zinc-500 italic text-center py-6">
                Console idle. Click "FORCE RSS XML FETCH" to inspect XML-to-JSON telemetry lifecycle...
              </div>
            ) : (
              simulatedLogs.map((log, idx) => (
                <div key={idx} className={idx === simulatedLogs.length - 1 ? "text-cyan-400 font-medium animate-pulse" : "text-zinc-400"}>
                  {log}
                </div>
              ))
            )}
          </div>

          {/* Progress bar */}
          {isSimulatingFetch && (
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-mono text-zinc-400">
                <span>BUFFERING XML PACKS</span>
                <span>{fetchProgress}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-950 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#ff0088] to-[#00f0ff] transition-all duration-300" style={{ width: `${fetchProgress}%` }} />
              </div>
            </div>
          )}
        </YwcLavaPanel>

        {/* Global Indices Quick View (MARKET WATCH PANEL) */}
        <YwcLavaPanel className="lg:col-span-4 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#FF1493]/25">
            <div className="flex items-center gap-2">
              <TrendingUp size={16} className="text-[#FF4500] drop-shadow-[0_0_8px_#FF4500]" />
              <YwcSectionTitle className="text-xs tracking-widest">
                MARKET WATCH (GLOBAL DESK)
              </YwcSectionTitle>
            </div>
            <span className="text-[10px] bg-zinc-900 border border-white/10 text-zinc-400 px-2 py-0.5 rounded font-mono">
              REAL PARITY
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3.5">
            {marketIndices.map((item, idx) => (
              <div 
                key={idx} 
                className="bg-black/40 border border-white/5 rounded-xl p-3 hover:border-[#ff0088]/20 transition-all duration-300 relative overflow-hidden"
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500">
                  <span>{item.name}</span>
                  <span className="font-bold text-zinc-400">{item.ticker}</span>
                </div>
                
                <div className="mt-1.5 font-bold font-sans text-sm tracking-tight">
                  {item.value.toLocaleString(undefined, { minimumFractionDigits: item.name.includes('EUR') ? 4 : 2 })}
                </div>

                <div className={`mt-0.5 text-[10px] font-mono flex items-center gap-1 ${item.isPositive ? 'text-emerald-400' : 'text-rose-500'}`}>
                  {item.isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                  <span>{item.isPositive ? '+' : ''}{item.pct}%</span>
                </div>

                {/* Subtle side glowing line indicator */}
                <div className={`absolute left-0 top-0 bottom-0 w-[2px] ${item.isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`} />
              </div>
            ))}
          </div>
        </YwcLavaPanel>

      </div>

      <YwcChartDock anchor="main-top" />

      {/* CORE DIGITAL NEWSPAPER WIREFRAME (REACTIVE SECTIONS FEEDS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Main Content Column (Sports, News, Finance, Crypto, etc.) */}
        <div className="lg:col-span-8 space-y-8">

          <YwcChartDock anchor="main-mid" />
          
          <YwcLavaPanel rounded="3xl" padding="p-4 md:p-5" className="space-y-0">
          {/* Main Filter categories row (Authentic newspaper navigation rhythm) */}
          <div className="flex items-center justify-between pb-4 border-b-2 border-[#FF4500]/30">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <span className="text-sm font-black text-[#39ff14] uppercase tracking-wider shrink-0 pr-2 border-r border-white/10 hidden sm:inline">
                SECTIONS:
              </span>
              {[
                { id: 'all', label: 'ALL NEWS' },
                { id: 'sports', label: 'WORLD SPORTS' },
                { id: 'news', label: 'WORLD HUB' },
                { id: 'relief', label: 'RELIEF / HUMANITARIAN' },
                { id: 'finance', label: 'GLOBAL FINANCE' },
                { id: 'crypto', label: 'CRYPTO' },
                { id: 'politics', label: 'POLITICAL HUB' },
                { id: 'tech', label: 'TECH' },
                { id: 'magazine', label: 'MAGAZINE EDITS' }
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedFeedCategory(cat.id as any)}
                  className={`px-3 py-1 text-xs font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    selectedFeedCategory === cat.id 
                      ? 'bg-[#39ff14] text-black shadow-[0_0_15px_rgba(57,255,20,0.65)] font-extrabold' 
                      : 'text-zinc-400 hover:text-[#39ff14] hover:bg-zinc-900/50'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            
            <div className="h-2 w-2 rounded-full bg-[#FF4500] animate-ping hidden lg:block shadow-[0_0_10px_#FF4500]" />
          </div>
          </YwcLavaPanel>

          {selectedFeedCategory === 'all' && (
            /* 1. HERO TOP STORY (Giant Cinematic layout preview) */
            <YwcLavaPanel as="section" rounded="3xl" padding="p-6 md:p-10" className="min-h-[460px] flex flex-col justify-end animate-fade-in group">
              <img 
                src="https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&q=80&w=1600"
                alt="Global news background matrix" 
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-102 transition-transform duration-700 pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />
              
              <div className="relative z-10 space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="bg-[#ff0088] text-white text-[9px] font-mono font-black tracking-widest px-3 py-1 rounded">
                    HERO TOP STORY
                  </span>
                  <span className="bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20 text-[9px] font-mono px-2.5 py-1 rounded">
                    HOT NEWS BENCH
                  </span>
                  <span className="text-zinc-400 text-xs font-mono">{lastSyncTime}</span>
                </div>

                <h2 className="text-3xl md:text-5xl font-serif italic font-black leading-tight text-white max-w-3xl hover:text-cyan-400 transition-colors pointer-events-auto cursor-pointer" onClick={() => setActiveStoryDetails(newsFeed.find(n => n.id === 'a4'))}>
                  Global Markets Rally on Cooling Inflation Signs as Yields Retreat
                </h2>

                <p className="text-zinc-300 font-sans text-xs md:text-sm max-w-2xl leading-relaxed">
                  Optimism sweeps across global indices after Consumer Price levels print below baseline analyst estimates. Sovereign debt desks release deep bid blocks on longer-duration paper.
                </p>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff0088] to-[#00f0ff] flex items-center justify-center p-[1px]">
                      <div className="w-full h-full bg-zinc-950 rounded-full flex items-center justify-center text-[10px] font-bold text-white font-mono">
                        CP
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-zinc-300 block">Reuters Intelligence Node</span>
                      <span className="text-[9px] font-mono text-zinc-500">Live global transmission</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => setActiveStoryDetails(newsFeed.find(n => n.id === 'a4'))}
                    className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white border border-white/10 hover:border-[#ff0088] rounded-xl text-xs font-black tracking-wider transition-all duration-300 cursor-pointer"
                  >
                    READ COVERAGE
                  </button>
                </div>
              </div>
            </YwcLavaPanel>
          )}

          {selectedFeedCategory === 'politics' ? (
            <YwcLavaPanel rounded="3xl"><PoliticalHub /></YwcLavaPanel>
          ) : selectedFeedCategory === 'finance' ? (
            <YwcLavaPanel rounded="3xl"><GlobalFinance /></YwcLavaPanel>
          ) : selectedFeedCategory === 'magazine' ? (
            <YwcLavaPanel rounded="3xl"><MagazineHub /></YwcLavaPanel>
          ) : selectedFeedCategory === 'news' ? (
            <YwcLavaPanel rounded="3xl"><WorldHub /></YwcLavaPanel>
          ) : (
            <>
              {/* DYNAMIC STORIES GRID */}
              <YwcLavaPanel className="space-y-4">
                <YwcSectionTitle className="text-xs tracking-[0.2em]">
                  Online Newspaper — Live Editorial Grid
                </YwcSectionTitle>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredFeed.map((article) => (
                    <motion.article 
                      key={article.id}
                      layout
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-zinc-950/80 border border-white/5 hover:border-[#ff0088]/20 rounded-2xl overflow-hidden hover:shadow-[0_8px_30px_rgba(255,0,136,0.04)] hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
                    >
                      <div className="relative h-48 w-full overflow-hidden">
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute top-3 left-3 flex gap-2">
                          <span className="bg-[#ff0088]/90 text-white text-[8px] font-mono font-black tracking-widest px-2 py-0.5 rounded uppercase">
                            {article.subcategory}
                          </span>
                          {article.premium && (
                            <span className="bg-yellow-500 text-black text-[8px] font-mono font-black tracking-widest px-2 py-0.5 rounded">
                              PREMIUM
                            </span>
                          )}
                        </div>
                        <div className="absolute bottom-2 right-2 text-[10px] font-mono bg-zinc-950/85 text-zinc-400 px-2 py-0.5 rounded">
                          {article.time}
                        </div>
                      </div>

                      <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                            <span>{article.category}</span>
                            <span>•</span>
                            <span>{article.source}</span>
                          </div>

                          <h4 className="text-base font-serif font-black italic text-white hover:text-cyan-400 transition-colors line-clamp-2 cursor-pointer" onClick={() => setActiveStoryDetails(article)}>
                            {article.title}
                          </h4>

                          <p className="text-zinc-400 text-xs line-clamp-3 leading-relaxed">
                            {article.desc}
                          </p>
                        </div>

                        <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500">
                            {article.source}
                          </span>
                          <button 
                            onClick={() => setActiveStoryDetails(article)}
                            className="text-xs text-[#00f0ff] font-bold tracking-widest hover:text-[#ff0088] transition-colors flex items-center gap-1"
                          >
                            <span>EXPAND</span>
                            <ChevronRight size={14} />
                          </button>
                        </div>
                      </div>
                    </motion.article>
                  ))}
                </AnimatePresence>
              </div>
              </YwcLavaPanel>

              {/* AI INSIGHTS & ANALYSES SECTION */}
              <YwcLavaPanel as="section" className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#FF1493]/25">
                  <div className="flex items-center gap-2">
                    <Sparkles className="text-[#FF4500] drop-shadow-[0_0_8px_#FF4500]" size={18} />
                    <YwcSectionTitle className="text-sm font-sans">
                      CPMS COGNITIVE AI INSIGHTS
                    </YwcSectionTitle>
                  </div>
                  <span className="text-[10px] bg-[#ff0088]/10 text-[#ff0088] border border-[#ff0088]/20 px-2 py-0.5 rounded font-mono font-bold">
                    GENERATIVE SUMMARY STACK
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed font-sans">
                  AI scans thousands of global RSS XML feeds, indices data structures, and OTC desk volume spreads to formulate synthesized bullet intelligence maps:
                </p>

                <div className="space-y-3.5 pt-3">
                  <div className="bg-black/60 border border-white/5 rounded-xl p-4 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#00f0ff]" />
                    <h4 className="text-xs font-black text-[#00f0ff] font-mono block">
                      TRENDING: SEMICONDUCTOR SOVEREIGNTY VECTORS
                    </h4>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Sub-3nm hardware fabrication facilities face deep expansion bottlenecks due to power utility capacity limits in local sectors. Commodity desks bid up energy options anticipating long-term multi-processor loads.
                    </p>
                  </div>

                  <div className="bg-black/60 border border-white/5 rounded-xl p-4 space-y-2 relative overflow-hidden">
                    <div className="absolute top-0 left-0 bottom-0 w-[3px] bg-[#ff0088]" />
                    <h4 className="text-xs font-black text-[#ff0088] font-mono block">
                      MACRO: YIELD CONVERGENCE POLICIES
                    </h4>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      Bond pricing curves indicate aggressive short-covering triggers. International arbitrage trusts rotate capital out of zero-yield bill baskets into sovereign medium-duration debt instruments to secure peak rates.
                    </p>
                  </div>
                </div>
              </YwcLavaPanel>

              {/* MAGAZINE EDITORIAL STORY BLOCK */}
              <YwcLavaPanel as="section" rounded="3xl" padding="p-6 md:p-10" className="space-y-6">
                <div className="absolute right-4 top-4 text-zinc-800 text-7xl font-serif font-black select-none pointer-events-none">
                  M
                </div>
                
                <div className="text-center space-y-2 max-w-xl mx-auto pb-4 border-b border-white/5">
                  <span className="text-[9px] font-mono tracking-[0.25em] text-[#ff0088] font-black uppercase">
                    MAGAZINE EDITORIAL DIGEST
                  </span>
                  <h3 className="text-2xl md:text-3xl font-serif italic text-white font-bold leading-normal">
                    Modern Layout Parity: Bridging Digital Grids and Premium Print Design
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-zinc-400 font-sans leading-relaxed text-justify">
                  <p>
                    <span className="text-4xl text-transparent bg-clip-text bg-gradient-to-r from-[#ff0088] to-[#00f0ff] font-serif font-black float-left mr-3.5 mt-1 line-height-none">
                      L
                    </span>
                    ayout density is under intense reconstruction across leading global publications. The legacy saturation of structured modular grid frames—commonly dubbed "bento" systems—has reached a zenith of aesthetic redundancy. In its wake, elite design desks are pivoting back to asymmetric principles natively perfected by traditional print publications. By employing absolute viewport scaling calculations, beautiful serif displaying and bold negative voids, authors structure a highly tailored visual hierarchy.
                  </p>
                  <p>
                    Providing spacious margins enhances the organic flow of stories. As users transit through multiple display terminals, responsive CSS snap-points deliver tactile card slides that mimic premium physical pages. The ultimate objective is not merely the presentation of raw feed nodes, but the creation of an immersive storytelling wrapper that heightens consumer interaction and reinforces the gravity of the editorial content.
                  </p>
                </div>
              </YwcLavaPanel>
            </>
          )}

        </div>

        {/* Sidebar Column (Live TV, Social OAuth Login Sync, Live Feeds aggregate) */}
        <div className="lg:col-span-4 space-y-8">

          <YwcChartDock anchor="sidebar" />
          
          {/* CPMS Media Pantry — radio, live TV embeds, podcast search */}
          <YwcLavaPanel className="space-y-4">
            <CpmsMediaPantry />
          </YwcLavaPanel>

          {/* SOCIAL MEDIA OAUTH HANDSHAKE PORTAL (15 PLATFORMS INTEGRATED) */}
          <YwcLavaPanel className="space-y-4">
            <div className="flex flex-col space-y-1.5 pb-3 border-b border-[#FF1493]/25">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Share2 size={17} className="text-[#FF1493] drop-shadow-[0_0_8px_#FF1493]" />
                  <YwcSectionTitle className="text-xs tracking-widest">
                    OATH SOCIAL SYNC HUB
                  </YwcSectionTitle>
                </div>
                <span className="text-[10px] font-mono bg-cyan-950/50 text-[#00f0ff] border border-[#00f0ff]/25 px-2 py-0.5 rounded font-black">
                  {activeConnectedCount} / 15 SYNCED
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-sans leading-normal">
                Click any provider logo to establish simulated OAuth key verifying handshake, anchoring credentials into our WebSocket broadcast registry.
              </p>
            </div>

            {/* Integrated grid of 15 Social platforms */}
            <div className="grid grid-cols-3 gap-2">
              {socialPlatforms.map((platform) => {
                const isActive = platform.connected;
                const isConnecting = platform.isConnecting;
                return (
                  <button
                    key={platform.id}
                    onClick={() => handleTriggerSocialConnect(platform.id, platform.name)}
                    className={`p-2.5 rounded-xl border text-center flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer relative overflow-hidden ${
                      isActive 
                        ? 'border-emerald-500/40 bg-emerald-950/10 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
                        : isConnecting 
                          ? 'border-yellow-500/40 bg-zinc-900 text-yellow-400 animate-pulse' 
                          : 'border-white/5 bg-zinc-950 text-zinc-400 ' + platform.color
                    }`}
                  >
                    <span className="text-[10px] font-mono font-bold tracking-tight block">
                      {platform.name}
                    </span>

                    <span className="text-[8px] font-mono text-zinc-650 opacity-70 block">
                      {isActive ? 'SYNCED' : isConnecting ? 'HANDSHAKE' : 'CONNECT'}
                    </span>

                    {/* Small visual dot marker */}
                    <div className={`absolute bottom-1.5 right-1.5 w-1 h-1 rounded-full ${isActive ? 'bg-emerald-500 shadow-[0_0_4px_#34d399]' : 'bg-transparent'}`} />
                  </button>
                );
              })}
            </div>

            {/* Active Social Broadcaster composing board */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 space-y-3">
              <h4 className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase font-black">
                WS INSTANT BROADCAST DESK
              </h4>

              <form onSubmit={handlePublishPost} className="space-y-2">
                <textarea
                  rows={2}
                  maxLength={160}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  placeholder={
                    activeConnectedCount > 0 
                      ? `Anchored on ${socialPlatforms.find(p => p.connected)?.name}. Type live broadcast...` 
                      : "Handshake at least one platform above to unlock visual broadcast stream..."
                  }
                  className="w-full bg-black border border-white/5 rounded-lg p-2 text-xs text-white focus:border-[#ff0088] outline-none font-sans leading-relaxed resize-none"
                />

                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono text-zinc-600">
                    Characters remaining: {160 - newPostText.length}
                  </span>
                  <button
                    type="submit"
                    disabled={!newPostText.trim()}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-black uppercase transition-all flex items-center gap-1 cursor-pointer ${
                      newPostText.trim() 
                        ? 'bg-[#ff0088] text-white hover:shadow-[0_0_10px_rgba(255,0,136,0.3)]' 
                        : 'bg-zinc-900 text-zinc-600 cursor-not-allowed'
                    }`}
                  >
                    <Send size={10} />
                    <span>TRANSMIT BROKER</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Consolidated stream preview */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 uppercase">
                <span>CONSOLIDATED FEED MONITOR</span>
                <span>Port 3000 broadcast</span>
              </div>

              <div className="space-y-2 max-h-[220px] overflow-y-auto no-scrollbar">
                {socialFeed.map((item) => (
                  <div key={item.id} className="bg-black/50 border border-white/5 rounded-xl p-3 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-zinc-300 font-bold">{item.author}</span>
                        <span className="text-zinc-500 font-mono text-[9px]">{item.handle}</span>
                      </div>
                      <span className="text-zinc-600 font-mono text-[8.5px]">{item.time}</span>
                    </div>
                    <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </YwcLavaPanel>

        </div>

      </div>

      {/* DETAILED COVERAGE READER modal */}
      <AnimatePresence>
        {activeStoryDetails && (
          <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4 select-none">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`bg-[#0b0b0d] border border-[#ff0088]/40 rounded-3xl ${activeStoryDetails.id === 'optimistic-injustice' ? 'max-w-4xl' : 'max-w-2xl'} w-full text-left overflow-hidden shadow-[0_24px_50px_rgba(0,0,0,0.9)] flex flex-col justify-between max-h-[90vh]`}
            >
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar space-y-6">
                
                {/* Header detail */}
                <div className="flex items-center justify-between pb-3 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#ff0088] text-white text-[9px] font-mono font-black tracking-widest px-2.5 py-0.5 rounded uppercase">
                      {activeStoryDetails.subcategory}
                    </span>
                    <span className="text-zinc-500 text-[10px] font-mono">
                      {activeStoryDetails.time} • {activeStoryDetails.source}
                    </span>
                  </div>
                  
                  <button 
                    onClick={() => setActiveStoryDetails(null)}
                    className="p-1 px-3 text-red-400 bg-red-950/25 border border-red-900/30 rounded-lg text-[10px] font-mono hover:text-white hover:bg-red-950 transition-all cursor-pointer"
                  >
                    CLOSE [ESC]
                  </button>
                </div>

                {activeStoryDetails.id === 'optimistic-injustice' ? (
                  <OptimisticInjusticeArticle />
                ) : (
                  <>
                    <h3 className="text-2xl md:text-3.5xl font-serif italic text-white font-black leading-tight">
                      {activeStoryDetails.title}
                    </h3>

                    <p className="text-zinc-400 text-sm leading-relaxed border-l-2 border-[#00f0ff] pl-4 italic">
                      {activeStoryDetails.desc}
                    </p>

                    <div className="text-zinc-300 text-xs md:text-sm font-sans leading-relaxed space-y-4">
                      <p>{activeStoryDetails.longText}</p>
                      <p>Our spot research desk expects these metrics will solidify near-term market parameters. Central registers show sudden arbitrage spikes which correlate perfectly with past historical patterns tracked inside the CPMS Economic Memory Matrix database structures.</p>
                    </div>
                  </>
                )}
              </div>

              {/* Modal footer credentials */}
              <div className="bg-zinc-950 px-6 py-4 border-t border-white/10 flex items-center justify-between text-zinc-500 font-mono text-[10px]">
                <span>PUBLICATION: CPMS DIGITAL PARITY INDEX</span>
                <span>SECURE Handshake VERIFIED</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERSISTENT SCROLLING TICKER FOOTER (14. REQUIRED TICKER) */}
      <YwcLavaPanel as="footer" padding="p-4" className="w-full flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#ff0088]/10 text-[#ff0088] border border-[#ff0088]/20 px-3.5 py-1.5 rounded-xl shrink-0">
          <Radio size={14} className="animate-pulse" />
          <span className="text-[10px] font-mono font-black tracking-widest">
            CPMS REAL-TIME STREAM TICKER:
          </span>
        </div>

        {/* Scrolling text container */}
        <div className="flex-1 overflow-hidden h-6 relative bg-zinc-950/40 rounded border border-white/5 sm:mx-2">
          <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
          <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />
          
          <div className="flex items-center gap-12 whitespace-nowrap animate-marquee absolute top-1/2 -translate-y-1/2 text-[12px] font-mono text-zinc-300">
            {tickerItems.map((item, idx) => {
              const isBreaking = item.startsWith("🔥");
              const displayText = isBreaking ? item.replace("🔥 BREAKING:", "") : item;
              return (
                <span key={idx} className="flex items-center gap-2.5">
                  <span className="text-[#00f0ff] font-bold">•</span>
                  {isBreaking ? (
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Flame className="w-4 h-4 text-[#ff00c8] fill-[#ff00c8] animate-pulse drop-shadow-[0_0_8px_rgba(255,0,200,0.5)]" />
                      <span className="text-[#ff00c8] font-bold text-[12.5px] uppercase tracking-widest animate-pulse font-mono">BREAKING:</span>
                      <span className="text-[12px] font-sans font-semibold text-zinc-150">{displayText}</span>
                    </span>
                  ) : (
                    <span>{item}</span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        <div className="text-[9.5px] font-mono text-zinc-500 shrink-0 uppercase">
          © 2026 CPMS Media Group. ALL RIGHTS ANCHORED.
        </div>
      </YwcLavaPanel>

      <YwcChartFloatLayer />
    </div>
    </YwcChartWorkspace>
  );
}
