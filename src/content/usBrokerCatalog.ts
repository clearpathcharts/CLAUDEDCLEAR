export type BrokerIntegrationState = 'available' | 'planned';

export type UsBrokerCard = {
  id: string;
  name: string;
  legalName: string;
  logo: string;
  logoSurface: 'dark' | 'light';
  assetClasses: string[];
  integration: BrokerIntegrationState;
  sourceLabel: string;
  sourceUrl: string;
  note: string;
};

/**
 * Logos are unmodified files published by each firm on its own website or
 * official brand kit. Provenance stays beside every card; none are redraws.
 */
export const US_BROKER_CATALOG: UsBrokerCard[] = [
  {
    id: 'alpaca',
    name: 'Alpaca',
    legalName: 'Alpaca Securities LLC',
    logo: '/images/brokers/alpaca.png',
    logoSurface: 'dark',
    assetClasses: ['Stocks', 'ETFs', 'Options'],
    integration: 'available',
    sourceLabel: 'Alpaca newsroom',
    sourceUrl: 'https://alpaca.markets/newsroom',
    note: 'OAuth pass-through foundation is implemented. Availability depends on production broker keys.',
  },
  {
    id: 'schwab',
    name: 'Charles Schwab',
    legalName: 'Charles Schwab & Co., Inc.',
    logo: '/images/brokers/schwab.svg',
    logoSurface: 'light',
    assetClasses: ['Stocks', 'ETFs', 'Options', 'Futures'],
    integration: 'planned',
    sourceLabel: 'Schwab website',
    sourceUrl: 'https://www.schwab.com/',
    note: 'Connection is not yet implemented. Requires approved developer access and production credentials.',
  },
  {
    id: 'tradier',
    name: 'Tradier',
    legalName: 'Tradier Brokerage, Inc.',
    logo: '/images/brokers/tradier.svg',
    logoSurface: 'light',
    assetClasses: ['Stocks', 'ETFs', 'Options'],
    integration: 'planned',
    sourceLabel: 'Tradier attribution guidelines',
    sourceUrl: 'https://docs.tradier.com/docs/attribution-guidelines',
    note: 'Connection is not yet implemented. Tradier publishes brokerage APIs and attribution requirements.',
  },
  {
    id: 'tradestation',
    name: 'TradeStation',
    legalName: 'TradeStation Securities, Inc.',
    logo: '/images/brokers/tradestation.png',
    logoSurface: 'light',
    assetClasses: ['Stocks', 'ETFs', 'Options', 'Futures'],
    integration: 'planned',
    sourceLabel: 'TradeStation brand kit',
    sourceUrl: 'https://www.tradestation.com/brand/',
    note: 'Connection is not yet implemented. Brand and API approvals are required before launch.',
  },
  {
    id: 'ibkr',
    name: 'Interactive Brokers',
    legalName: 'Interactive Brokers LLC',
    logo: '/images/brokers/ibkr.png',
    logoSurface: 'dark',
    assetClasses: ['Stocks', 'ETFs', 'Options', 'Futures', 'FX'],
    integration: 'planned',
    sourceLabel: 'Interactive Brokers website',
    sourceUrl: 'https://www.interactivebrokers.com/',
    note: 'Connection is not yet implemented. Institutional onboarding and mark-use approval may be required.',
  },
  {
    id: 'tastytrade',
    name: 'tastytrade',
    legalName: 'tastytrade, Inc.',
    logo: '/images/brokers/tastytrade.svg',
    logoSurface: 'dark',
    assetClasses: ['Stocks', 'ETFs', 'Options', 'Futures'],
    integration: 'planned',
    sourceLabel: 'tastytrade developer site',
    sourceUrl: 'https://developer.tastytrade.com/',
    note: 'Connection is not yet implemented. The firm publishes a developer API and authentication documentation.',
  },
  {
    id: 'etrade',
    name: 'E*TRADE',
    legalName: 'E*TRADE from Morgan Stanley',
    logo: '/images/brokers/etrade.svg',
    logoSurface: 'dark',
    assetClasses: ['Stocks', 'ETFs', 'Options', 'Futures'],
    integration: 'planned',
    sourceLabel: 'E*TRADE website',
    sourceUrl: 'https://us.etrade.com/home',
    note: 'Connection is not yet implemented. Developer licensing and production access are required.',
  },
  {
    id: 'webull',
    name: 'Webull',
    legalName: 'Webull Financial LLC',
    logo: '/images/brokers/webull.svg',
    logoSurface: 'dark',
    assetClasses: ['Stocks', 'ETFs', 'Options'],
    integration: 'planned',
    sourceLabel: 'Webull website',
    sourceUrl: 'https://www.webull.com/',
    note: 'Connection is not yet implemented. Partner API and brand-use approval must be confirmed.',
  },
  {
    id: 'tradovate',
    name: 'Tradovate',
    legalName: 'Tradovate, LLC',
    logo: '/images/brokers/tradovate.png',
    logoSurface: 'dark',
    assetClasses: ['Futures'],
    integration: 'planned',
    sourceLabel: 'Tradovate website',
    sourceUrl: 'https://www.tradovate.com/',
    note: 'Connection is not yet implemented. Futures API onboarding and production approval are required.',
  },
];

