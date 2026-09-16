export const METRIC_DEFINITIONS: Record<string, { title: string; body: string }> = {
  ROIC: {
    title: 'Return on Invested Capital (ROIC)',
    body: 'ROIC measures operating profit after tax relative to the capital invested in the business (typically equity plus interest-bearing debt, minus excess cash). It describes how much profit the firm generated per unit of capital employed. It is an efficiency metric, not a recommendation.',
  },
  ROE: {
    title: 'Return on Equity (ROE)',
    body: 'ROE is net income divided by shareholders’ equity. It shows accounting return on the book equity residual. Leverage can raise ROE without improving operating performance.',
  },
  ROA: {
    title: 'Return on Assets (ROA)',
    body: 'ROA is net income divided by total assets. It describes how much profit is generated from the asset base reported on the balance sheet.',
  },
  'EV/EBITDA': {
    title: 'Enterprise Value / EBITDA',
    body: 'EV/EBITDA compares enterprise value (equity market value plus net debt and other claims) with earnings before interest, taxes, depreciation, and amortization. It is a capital-structure-aware operating multiple, not a buy or sell instruction.',
  },
  FCF: {
    title: 'Free Cash Flow (FCF)',
    body: 'FCF is typically operating cash flow minus capital expenditure. It is the cash generated after maintaining or expanding the productive asset base, before discretionary financing decisions. Methodology can differ by data vendor; this desk uses reported operating cash flow minus capex when both exist.',
  },
  PEG: {
    title: 'PEG ratio',
    body: 'PEG is a price/earnings multiple divided by an expected earnings growth rate (often consensus long-term EPS growth, in percent). Methodology varies: some vendors use forward P/E, others trailing. A PEG figure is an arithmetic relationship, not an appraisal of whether shares should be purchased.',
  },
  'P/E': {
    title: 'Price / Earnings',
    body: 'P/E divides the share price by earnings per share (trailing or forward). It describes how many dollars of price attach to one dollar of reported or estimated earnings. It does not say whether that price is “cheap” or “expensive” in isolation.',
  },
  'EV': {
    title: 'Enterprise Value',
    body: 'Enterprise value approximates the total claim on operating assets: market capitalization + total debt − cash (and sometimes minority interest, preferred, leases). Components should be inspected individually.',
  },
  'FCF yield': {
    title: 'Free cash flow yield',
    body: 'FCF yield is free cash flow divided by enterprise value or market capitalization, depending on convention. This desk labels the denominator when the figure is shown.',
  },
  'Net debt/EBITDA': {
    title: 'Net debt / EBITDA',
    body: 'Net debt (interest-bearing debt minus cash) divided by EBITDA. It is a leverage coverage snapshot from reported figures, not a credit rating.',
  },
  'Interest coverage': {
    title: 'Interest coverage',
    body: 'Typically EBIT or EBITDA divided by interest expense. It describes how many times operating profit covers reported interest in that period.',
  },
  'Payout ratio': {
    title: 'Dividend payout ratio',
    body: 'Dividends divided by earnings (or FCF in some methodologies). It describes the share of profits distributed as cash dividends in the reported period.',
  },
};

export function definitionFor(key: string): { title: string; body: string } | null {
  return METRIC_DEFINITIONS[key] || null;
}

export const ASSISTANT_REFUSAL =
  'This desk is research and education only. It does not recommend buying, selling, holding, entering, or exiting a position, and it does not provide personalized investment advice or price targets as instructions. You can inspect the reported financials, valuation multiples, earnings history, industry context, and macro series, then form your own view.';
