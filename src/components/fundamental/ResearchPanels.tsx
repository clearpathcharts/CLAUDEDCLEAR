import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useFundamental } from './FundamentalContext';
import { DataRibbon, FinTable, Metric, Panel, Tone, Unavailable } from './primitives';
import { pickStatements, num } from '../../fundamental/service';
import {
  cagr,
  extrema,
  formatCompactUsd,
  formatMultiple,
  formatNumber,
  formatPercent,
  formatUsdPerShare,
  median,
  statementLabel,
  surpriseVsConsensus,
  yoyGrowth,
} from '../../fundamental/format';
import { ASSISTANT_REFUSAL, definitionFor } from '../../fundamental/metricDefinitions';
import { runScenario, SCENARIO_DISCLAIMER } from '../../fundamental/scenario';
import { CHART_LAYOUTS } from '../../fundamental/localStore';
import type { PeerRow, SegmentRow } from '../../fundamental/types';

const chartTip = {
  contentStyle: { background: '#05070a', border: '1px solid #1f2937', fontSize: 11 },
};

function seriesFrom(
  rows: Record<string, unknown>[] | null | undefined,
  key: string,
  period: 'annual' | 'quarter',
) {
  if (!rows?.length) return [];
  return [...rows].reverse().map((row) => ({
    label: statementLabel(row, period),
    value: num(row, key),
  }));
}

function parseSegments(raw: unknown): SegmentRow[] {
  if (!raw) return [];
  const rows = Array.isArray(raw) ? raw : [raw];
  const latest = rows[0];
  if (!latest || typeof latest !== 'object') return [];
  const obj = latest as Record<string, unknown>;
  const nested = obj.data && typeof obj.data === 'object' ? (obj.data as Record<string, unknown>) : obj;
  const skip = new Set(['date', 'symbol', 'calendarYear', 'period', 'reportedCurrency', 'cik', 'fillingDate', 'acceptedDate', 'link', 'finalLink']);
  const entries = Object.entries(nested).filter(([k, v]) => !skip.has(k) && typeof v !== 'object');
  const total = entries.reduce((s, [, v]) => s + (typeof v === 'number' ? v : 0), 0);
  return entries.map(([segment, v]) => {
    const revenue = typeof v === 'number' ? v : Number(v);
    return {
      segment,
      revenue: Number.isFinite(revenue) ? revenue : null,
      growth: null,
      operatingMargin: null,
      contribution: Number.isFinite(revenue) && total ? (revenue / total) * 100 : null,
    };
  });
}

function Spark({ data, color = '#22d3ee' }: { data: { label: string; value: number | null }[]; color?: string }) {
  const clean = data.filter((d) => d.value != null);
  if (!clean.length) return <Unavailable />;
  return (
    <div className="h-36 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
        <LineChart data={clean}>
          <CartesianGrid stroke="#ffffff08" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} />
          <YAxis tick={{ fill: '#64748b', fontSize: 9 }} width={48} />
          <Tooltip {...chartTip} />
          <Line type="monotone" dataKey="value" stroke={color} dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CompanyOverviewPanel() {
  const { bundle, profileOpen, setProfileOpen } = useFundamental();
  const id = bundle?.identity;
  if (!id) return (
    <Panel id="overview" title="Company overview">
      <Unavailable />
    </Panel>
  );
  const desc = id.description || '';
  const shown = profileOpen ? desc : desc.slice(0, 520);
  return (
    <Panel
      id="overview"
      title="Company intelligence"
      source={id.cik ? `SEC CIK ${id.cik}` : 'VENDOR PROFILE'}
    >
      <p className="text-sm leading-relaxed text-zinc-300">{shown || 'DATA UNAVAILABLE'}</p>
      {desc.length > 520 ? (
        <button
          type="button"
          className="mt-2 text-[10px] font-black uppercase tracking-widest text-cyan-300"
          onClick={() => setProfileOpen(!profileOpen)}
        >
          {profileOpen ? 'Collapse profile' : 'Expand full profile'}
        </button>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4">
        <Metric label="CEO" value={id.ceo || 'DATA UNAVAILABLE'} />
        <Metric label="Employees" value={id.employees != null ? formatNumber(id.employees, 0) : 'DATA UNAVAILABLE'} />
        <Metric label="IPO" value={id.ipoDate || 'DATA UNAVAILABLE'} />
        <Metric label="Website" value={id.website ? <a className="text-cyan-300 underline" href={id.website} target="_blank" rel="noreferrer">Open</a> : 'DATA UNAVAILABLE'} />
      </div>
    </Panel>
  );
}

export function ScorecardPanel() {
  const { bundle, period } = useFundamental();
  const stmts = pickStatements(bundle || ({} as never), period === 'ttm' ? 'annual' : period);
  const inc = stmts.income?.[0];
  const prior = stmts.income?.[1];
  const cf = stmts.cash?.[0];
  const met = period === 'ttm' ? bundle?.metricsTtm : stmts.metrics?.[0];
  const revG = yoyGrowth(num(inc, 'revenue'), num(prior, 'revenue'));
  const fcf = num(cf, 'freeCashFlow');
  const fcfM = num(inc, 'revenue') && fcf != null ? (fcf / num(inc, 'revenue')!) * 100 : null;
  return (
    <Panel title="Fundamental scorecard" source="Calculated from reported statements">
      <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">
        Descriptive measurements only — not an investment recommendation. Composite scores are not used.
      </p>
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-5">
        <Metric label="Revenue growth" value={formatPercent(revG)} />
        <Metric label="Profitability (net margin)" value={formatPercent(num(inc, 'netIncomeRatio') ?? (num(inc, 'netIncome') && num(inc, 'revenue') ? (num(inc, 'netIncome')! / num(inc, 'revenue')!) * 100 : null), true)} defKey="ROE" />
        <Metric label="FCF margin" value={formatPercent(fcfM)} defKey="FCF" />
        <Metric label="ROIC" value={formatPercent(num(met, 'roic'), true)} defKey="ROIC" />
        <Metric label="Net debt/EBITDA" value={formatMultiple(num(met, 'netDebtToEBITDA'))} defKey="Net debt/EBITDA" />
        <Metric label="P/E" value={formatMultiple(bundle?.quote?.pe ?? num(met, 'peRatio'))} defKey="P/E" />
        <Metric label="EPS" value={formatUsdPerShare(bundle?.quote?.eps ?? num(inc, 'epsdiluted'))} />
        <Metric label="Industry" value={bundle?.identity?.industry || 'DATA UNAVAILABLE'} />
        <Metric label="Macro exposure" value="See Macro panel (FRED)" />
        <Metric label="Risk" value="See Risk factor center" />
      </div>
    </Panel>
  );
}

export function HealthPanel() {
  const { setSection } = useFundamental();
  const cats = [
    ['Growth', 'financials'],
    ['Profitability', 'financials'],
    ['Cash flow', 'financials'],
    ['Balance sheet', 'financials'],
    ['Valuation', 'valuation'],
    ['Earnings', 'earnings'],
    ['Industry', 'industry'],
    ['Macro', 'macro'],
  ] as const;
  return (
    <Panel title="Fundamental health overview">
      <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">
        Categories expand into reported metrics. No opaque “health score.”
      </p>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        {cats.map(([label, section]) => (
          <button
            key={label}
            type="button"
            onClick={() => setSection(section)}
            className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-3 py-3 text-left text-[10px] font-black uppercase tracking-widest text-indigo-200"
          >
            {label}
          </button>
        ))}
      </div>
    </Panel>
  );
}

export function SegmentsPanel() {
  const { bundle, period } = useFundamental();
  const product = parseSegments(bundle?.productSegments);
  const geo = parseSegments(bundle?.geoSegments);
  const stmts = pickStatements(bundle || ({} as never), period === 'ttm' ? 'annual' : period);
  const rev = seriesFrom(stmts.income, 'revenue', period === 'quarter' ? 'quarter' : 'annual');
  return (
    <>
      <Panel id="segments" title="Business segment analysis" source="Vendor segmentation when filed">
        {product.length ? (
          <FinTable
            columns={['Revenue', 'Contribution %']}
            rows={product.map((s) => ({ label: s.segment, values: [s.revenue, s.contribution] }))}
            format={(n) => (n != null && Math.abs(n) <= 100 && Number.isFinite(n) ? formatPercent(n) : formatCompactUsd(n))}
          />
        ) : (
          <Unavailable />
        )}
      </Panel>
      <Panel title="Geographic exposure">
        {geo.length ? (
          <FinTable
            columns={['Revenue', 'Contribution %']}
            rows={geo.map((s) => ({ label: s.segment, values: [s.revenue, s.contribution] }))}
            format={(n) => (n != null && Math.abs(n) <= 100 ? formatPercent(n) : formatCompactUsd(n))}
          />
        ) : (
          <Unavailable />
        )}
      </Panel>
      <Panel title="Revenue analytics">
        <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">
          CAGR {formatPercent(cagr(rev[0]?.value ?? null, rev[rev.length - 1]?.value ?? null, Math.max(1, rev.length - 1)))} · YoY latest {formatPercent(yoyGrowth(rev[rev.length - 1]?.value ?? null, rev[rev.length - 2]?.value ?? null))}
        </p>
        <Spark data={rev} />
      </Panel>
    </>
  );
}

export function FinancialPerformancePanels() {
  const { bundle, period, setPeriod } = useFundamental();
  const stmts = pickStatements(bundle || ({} as never), period === 'ttm' ? 'annual' : period);
  const cols = (stmts.income || []).slice(0, 6).map((r) => statementLabel(r, period === 'quarter' ? 'quarter' : 'annual'));
  const take = (key: string, rows?: Record<string, unknown>[] | null) =>
    (rows || []).slice(0, 6).map((r) => num(r, key));
  const incRows = [
    { label: 'Revenue', values: take('revenue', stmts.income) },
    { label: 'Cost of revenue', values: take('costOfRevenue', stmts.income) },
    { label: 'Gross profit', values: take('grossProfit', stmts.income) },
    { label: 'Operating expenses', values: take('operatingExpenses', stmts.income) },
    { label: 'Operating income', values: take('operatingIncome', stmts.income) },
    { label: 'Interest expense', values: take('interestExpense', stmts.income) },
    { label: 'Pretax income', values: take('incomeBeforeTax', stmts.income) },
    { label: 'Taxes', values: take('incomeTaxExpense', stmts.income) },
    { label: 'Net income', values: take('netIncome', stmts.income) },
    { label: 'EPS (diluted)', values: take('epsdiluted', stmts.income) },
  ];
  const bsRows = [
    { label: 'Cash', values: take('cashAndCashEquivalents', stmts.balance) },
    { label: 'Short-term investments', values: take('shortTermInvestments', stmts.balance) },
    { label: 'Accounts receivable', values: take('netReceivables', stmts.balance) },
    { label: 'Inventory', values: take('inventory', stmts.balance) },
    { label: 'Current assets', values: take('totalCurrentAssets', stmts.balance) },
    { label: 'PP&E', values: take('propertyPlantEquipmentNet', stmts.balance) },
    { label: 'Goodwill', values: take('goodwill', stmts.balance) },
    { label: 'Intangible assets', values: take('intangibleAssets', stmts.balance) },
    { label: 'Total assets', values: take('totalAssets', stmts.balance) },
    { label: 'Accounts payable', values: take('accountPayables', stmts.balance) },
    { label: 'Current liabilities', values: take('totalCurrentLiabilities', stmts.balance) },
    { label: 'Short-term debt', values: take('shortTermDebt', stmts.balance) },
    { label: 'Long-term debt', values: take('longTermDebt', stmts.balance) },
    { label: 'Total liabilities', values: take('totalLiabilities', stmts.balance) },
    { label: 'Shareholder equity', values: take('totalStockholdersEquity', stmts.balance) },
    { label: 'Retained earnings', values: take('retainedEarnings', stmts.balance) },
    { label: 'Treasury stock', values: take('treasuryStock', stmts.balance) },
  ];
  const cfRows = [
    { label: 'Operating cash flow', values: take('operatingCashFlow', stmts.cash) },
    { label: 'Investing cash flow', values: take('netCashUsedForInvestingActivites', stmts.cash) },
    { label: 'Financing cash flow', values: take('netCashUsedProvidedByFinancingActivities', stmts.cash) },
    { label: 'Free cash flow', values: take('freeCashFlow', stmts.cash) },
    { label: 'Capex', values: take('capitalExpenditure', stmts.cash) },
    { label: 'Acquisitions', values: take('acquisitionsNet', stmts.cash) },
    { label: 'Debt issuance', values: take('debtIssuance', stmts.cash) },
    { label: 'Debt repayment', values: take('debtRepayment', stmts.cash) },
    { label: 'Dividends', values: take('dividendsPaid', stmts.cash) },
    { label: 'Share repurchases', values: take('commonStockRepurchased', stmts.cash) },
  ];
  const fmtLine = (label: string) => (n: number | null) =>
    label.includes('EPS') ? formatUsdPerShare(n) : formatCompactUsd(n);
  const inc0 = stmts.income?.[0];
  const cf0 = stmts.cash?.[0];
  const met0 = period === 'ttm' ? bundle?.metricsTtm : stmts.metrics?.[0];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Accounting period">
        {(['annual', 'quarter', 'ttm'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPeriod(p)}
            className="rounded border px-2 py-1 text-[9px] font-black uppercase tracking-widest"
            style={{
              borderColor: period === p ? '#22d3ee' : '#334155',
              color: period === p ? '#22d3ee' : '#94a3b8',
              background: period === p ? 'rgba(34,211,238,0.12)' : 'transparent',
            }}
          >
            {p === 'ttm' ? 'TTM' : p}
          </button>
        ))}
      </div>
      {period === 'ttm' ? (
        <p className="font-mono text-[8px] uppercase text-amber-200/80">
          TTM uses vendor trailing-twelve-month metric endpoints where available. Full TTM income statements are DATA UNAVAILABLE unless the vendor supplies them.
        </p>
      ) : null}
      <Panel id="income" title="Income statement" source="Financial statements" period={period.toUpperCase()} reported={String(inc0?.fillingDate || inc0?.date || '')}>
        {stmts.income?.length ? <FinTable columns={cols} rows={incRows} format={fmtLine('')} /> : <Unavailable />}
      </Panel>
      <Panel id="balance" title="Balance sheet" source="Financial statements">
        {stmts.balance?.length ? <FinTable columns={cols} rows={bsRows} format={formatCompactUsd} /> : <Unavailable />}
      </Panel>
      <Panel id="cashflow" title="Cash flow statement" source="Financial statements">
        {stmts.cash?.length ? <FinTable columns={cols} rows={cfRows} format={formatCompactUsd} /> : <Unavailable />}
      </Panel>
      <Panel title="Free cash flow" source="OCF − capex as reported">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Metric label="Operating cash flow" value={formatCompactUsd(num(cf0, 'operatingCashFlow'))} defKey="FCF" />
          <Metric label="Capex" value={formatCompactUsd(num(cf0, 'capitalExpenditure'))} />
          <Metric label="Free cash flow" value={formatCompactUsd(num(cf0, 'freeCashFlow'))} defKey="FCF" />
          <Metric label="FCF margin" value={formatPercent(num(inc0, 'revenue') && num(cf0, 'freeCashFlow') != null ? (num(cf0, 'freeCashFlow')! / num(inc0, 'revenue')!) * 100 : null)} />
          <Metric label="FCF / share" value={formatUsdPerShare(num(met0, 'freeCashFlowPerShare'))} />
          <Metric label="FCF growth" value={formatPercent(yoyGrowth(num(cf0, 'freeCashFlow'), num(stmts.cash?.[1], 'freeCashFlow')))} />
        </div>
        <Spark data={seriesFrom(stmts.cash, 'freeCashFlow', period === 'quarter' ? 'quarter' : 'annual')} color="#818cf8" />
      </Panel>
      <Panel title="Profitability">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Metric label="Gross margin" value={formatPercent(num(inc0, 'grossProfitRatio'), true)} />
          <Metric label="Operating margin" value={formatPercent(num(inc0, 'operatingIncomeRatio'), true)} />
          <Metric label="Net margin" value={formatPercent(num(inc0, 'netIncomeRatio'), true)} />
          <Metric label="EBITDA margin" value={formatPercent(num(inc0, 'ebitdaratio') ?? num(inc0, 'ebitdaRatio'), true)} />
          <Metric label="EBIT margin" value={formatPercent(num(inc0, 'operatingIncome') && num(inc0, 'revenue') ? (num(inc0, 'operatingIncome')! / num(inc0, 'revenue')!) * 100 : null)} />
          <Metric label="FCF margin" value={formatPercent(num(cf0, 'freeCashFlow') && num(inc0, 'revenue') ? (num(cf0, 'freeCashFlow')! / num(inc0, 'revenue')!) * 100 : null)} />
        </div>
        <Spark data={seriesFrom(stmts.income, 'operatingIncomeRatio', period === 'quarter' ? 'quarter' : 'annual')} color="#34d399" />
      </Panel>
      <Panel title="Return on capital">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Metric label="ROE" value={formatPercent(num(met0, 'roe') ?? num(met0, 'returnOnEquity'), true)} defKey="ROE" />
          <Metric label="ROA" value={formatPercent(num(met0, 'roa') ?? num(met0, 'returnOnAssets'), true)} defKey="ROA" />
          <Metric label="ROIC" value={formatPercent(num(met0, 'roic') ?? num(met0, 'returnOnInvestedCapital'), true)} defKey="ROIC" />
          <Metric label="Invested capital" value={formatCompactUsd(num(met0, 'investedCapital'))} />
          <Metric label="Asset turnover" value={formatNumber(num(met0, 'assetTurnover'))} />
          <Metric label="Equity multiplier" value={formatNumber(num(met0, 'equityMultiplier'))} />
        </div>
      </Panel>
      <Panel title="Debt & leverage">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="Total debt" value={formatCompactUsd(num(stmts.balance?.[0], 'totalDebt'))} />
          <Metric label="Short-term debt" value={formatCompactUsd(num(stmts.balance?.[0], 'shortTermDebt'))} />
          <Metric label="Long-term debt" value={formatCompactUsd(num(stmts.balance?.[0], 'longTermDebt'))} />
          <Metric label="Net debt" value={formatCompactUsd(num(stmts.balance?.[0], 'netDebt'))} />
          <Metric label="Debt/equity" value={formatMultiple(num(met0, 'debtToEquity'))} />
          <Metric label="Debt/EBITDA" value={formatMultiple(num(met0, 'debtToEBITDA') ?? num(met0, 'netDebtToEBITDA'))} />
          <Metric label="Interest coverage" value={formatMultiple(num(met0, 'interestCoverage'))} defKey="Interest coverage" />
          <Metric label="Maturity schedule" value="DATA UNAVAILABLE" />
        </div>
        <Spark data={seriesFrom(stmts.balance, 'totalDebt', period === 'quarter' ? 'quarter' : 'annual')} color="#f472b6" />
      </Panel>
      <Panel title="Capital allocation">
        <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">Describes reported cash uses — not a judgment of management quality.</p>
        {stmts.cash?.length ? <FinTable columns={cols} rows={cfRows.filter((r) => ['Capex', 'Acquisitions', 'Dividends', 'Share repurchases', 'Debt issuance', 'Debt repayment', 'Operating cash flow'].includes(r.label))} format={formatCompactUsd} /> : <Unavailable />}
      </Panel>
      <Panel title="Share count">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Metric label="Weighted average shares" value={formatNumber(num(inc0, 'weightedAverageShsOut'), 0)} />
          <Metric label="Diluted shares" value={formatNumber(num(inc0, 'weightedAverageShsOutDil'), 0)} />
          <Metric label="SBC" value={formatCompactUsd(num(cf0, 'stockBasedCompensation'))} />
        </div>
        <Spark data={seriesFrom(stmts.income, 'weightedAverageShsOutDil', period === 'quarter' ? 'quarter' : 'annual')} />
      </Panel>
    </div>
  );
}

export function EarningsPanels() {
  const { bundle } = useFundamental();
  const surprises = (bundle?.epsSurprises || []).slice(0, 12);
  const estimates = bundle?.estimates || [];
  const latestEst = estimates[0];
  const chart = [...surprises].reverse().map((row) => ({
    label: String(row.date || '').slice(0, 7),
    estimate: num(row, 'estimatedEarning'),
    actual: num(row, 'actualEarningResult'),
  }));
  return (
    <div className="space-y-3">
      <Panel id="earnings" title="Earnings / EPS">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="EPS (quote)" value={formatUsdPerShare(bundle?.quote?.eps)} />
          <Metric label="Diluted EPS (latest stmt)" value={formatUsdPerShare(num(bundle?.incomeAnnual?.[0], 'epsdiluted'))} />
          <Metric label="Consensus EPS" value={formatUsdPerShare(num(latestEst, 'estimatedEpsAvg'))} />
          <Metric label="High / low estimate" value={`${formatUsdPerShare(num(latestEst, 'estimatedEpsHigh'))} / ${formatUsdPerShare(num(latestEst, 'estimatedEpsLow'))}`} />
        </div>
      </Panel>
      <Panel title="Earnings surprise">
        {surprises.length ? (
          <>
            <FinTable
              columns={['Estimate', 'Actual', 'Surprise']}
              rows={surprises.map((row) => {
                const est = num(row, 'estimatedEarning');
                const act = num(row, 'actualEarningResult');
                return { label: String(row.date || ''), values: [est, act, act != null && est != null ? act - est : null] };
              })}
              format={formatUsdPerShare}
            />
            <p className="mt-2 font-mono text-[9px] uppercase text-cyan-200">
              {surpriseVsConsensus(num(surprises[0], 'actualEarningResult'), num(surprises[0], 'estimatedEarning')).label}
            </p>
            <div className="mt-2 h-40">
              <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                <BarChart data={chart}>
                  <CartesianGrid stroke="#ffffff08" />
                  <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 9 }} />
                  <YAxis tick={{ fill: '#64748b', fontSize: 9 }} />
                  <Tooltip {...chartTip} />
                  <Legend />
                  <Bar dataKey="estimate" fill="#6366f1" />
                  <Bar dataKey="actual" fill="#22d3ee" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </>
        ) : (
          <Unavailable />
        )}
      </Panel>
      <Panel title="Revenue surprise">
        <p className="font-mono text-[9px] text-zinc-500">
          Vendor earnings-surprise feed on this desk is EPS-centric. Revenue estimate vs actual:{' '}
          {latestEst ? `consensus revenue ${formatCompactUsd(num(latestEst, 'estimatedRevenueAvg'))}` : 'DATA UNAVAILABLE'}
        </p>
      </Panel>
      <Panel title="Guidance">
        <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">PREVIOUS / CURRENT / CHANGE — company-issued guidance is shown only when the vendor supplies it.</p>
        <Unavailable message="DATA UNAVAILABLE" />
      </Panel>
      <Panel title="Analyst estimates">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Metric label="Consensus EPS" value={formatUsdPerShare(num(latestEst, 'estimatedEpsAvg'))} />
          <Metric label="High" value={formatUsdPerShare(num(latestEst, 'estimatedEpsHigh'))} />
          <Metric label="Low" value={formatUsdPerShare(num(latestEst, 'estimatedEpsLow'))} />
          <Metric label="Consensus revenue" value={formatCompactUsd(num(latestEst, 'estimatedRevenueAvg'))} />
          <Metric label="Revenue high" value={formatCompactUsd(num(latestEst, 'estimatedRevenueHigh'))} />
          <Metric label="Revenue low" value={formatCompactUsd(num(latestEst, 'estimatedRevenueLow'))} />
        </div>
        <p className="mt-2 font-mono text-[8px] uppercase text-zinc-600">No buy/sell ratings are displayed.</p>
      </Panel>
      <Panel title="Estimate revisions">
        {estimates.length > 1 ? (
          <Spark
            data={[...estimates].reverse().map((row) => ({
              label: String(row.date || '').slice(0, 7),
              value: num(row, 'estimatedEpsAvg'),
            }))}
          />
        ) : (
          <Unavailable />
        )}
        <div className="mt-2 flex gap-1">
          {['30D', '90D', '180D', '1Y'].map((w) => (
            <span key={w} className="rounded border border-white/10 px-2 py-0.5 font-mono text-[8px] uppercase text-zinc-500">
              {w} window: inspect history chart
            </span>
          ))}
        </div>
      </Panel>
      <Panel title="Dividends">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="Dividend / share" value={formatUsdPerShare(num(bundle?.metricsAnnual?.[0], 'dividendPerShare'))} />
          <Metric label="Dividend yield" value={formatPercent(num(bundle?.metricsAnnual?.[0], 'dividendYield'), true)} />
          <Metric label="Payout ratio" value={formatPercent(num(bundle?.ratiosAnnual?.[0], 'payoutRatio') ?? num(bundle?.metricsTtm, 'payoutRatio'), true)} defKey="Payout ratio" />
          <Metric label="Ex / pay date" value="DATA UNAVAILABLE" />
        </div>
      </Panel>
    </div>
  );
}

export function ValuationPanels() {
  const { bundle, valuationWindow, setValuationWindow } = useFundamental();
  const met = bundle?.metricsAnnual || [];
  const ttm = bundle?.metricsTtm;
  const evHist = bundle?.enterpriseValues || [];
  const ev0 = evHist[0];
  const windowN = valuationWindow === '1Y' ? 1 : valuationWindow === '3Y' ? 3 : valuationWindow === '5Y' ? 5 : valuationWindow === '10Y' ? 10 : met.length;
  const peHist = met.slice(0, windowN).map((r) => num(r, 'peRatio'));
  const { high, low } = extrema(peHist);
  return (
    <div className="space-y-3">
      <Panel id="valuation" title="Valuation center">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Metric label="P/E" value={formatMultiple(bundle?.quote?.pe ?? num(ttm, 'peRatioTTM') ?? num(met[0], 'peRatio'))} defKey="P/E" />
          <Metric label="Forward P/E" value={formatMultiple(num(ttm, 'forwardPE') ?? num(met[0], 'forwardPE'))} />
          <Metric label="PEG" value={formatMultiple(num(ttm, 'pegRatioTTM') ?? num(met[0], 'pegRatio'))} defKey="PEG" />
          <Metric label="Price/Sales" value={formatMultiple(num(ttm, 'priceToSalesRatioTTM') ?? num(met[0], 'priceToSalesRatio'))} />
          <Metric label="Price/Book" value={formatMultiple(num(ttm, 'pbRatioTTM') ?? num(met[0], 'pbRatio'))} />
          <Metric label="EV/Sales" value={formatMultiple(num(ttm, 'evToSalesTTM') ?? num(met[0], 'evToSales'))} />
          <Metric label="EV/EBITDA" value={formatMultiple(num(ttm, 'enterpriseValueOverEBITDATTM') ?? num(met[0], 'enterpriseValueOverEBITDA'))} defKey="EV/EBITDA" />
          <Metric label="EV/EBIT" value={formatMultiple(num(met[0], 'evToOperatingCashFlow') )} />
          <Metric label="EV/FCF" value={formatMultiple(num(met[0], 'evToFreeCashFlow'))} />
          <Metric label="EPS" value={formatUsdPerShare(bundle?.quote?.eps)} />
          <Metric label="FCF / share" value={formatUsdPerShare(num(ttm, 'freeCashFlowPerShareTTM') ?? num(met[0], 'freeCashFlowPerShare'))} />
          <Metric label="Book / share" value={formatUsdPerShare(num(ttm, 'bookValuePerShareTTM') ?? num(met[0], 'bookValuePerShare'))} />
        </div>
      </Panel>
      <Panel title="Historical valuation">
        <div className="mb-2 flex flex-wrap gap-1">
          {(['1Y', '3Y', '5Y', '10Y', 'MAX'] as const).map((w) => (
            <button
              key={w}
              type="button"
              onClick={() => setValuationWindow(w)}
              className="rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest"
              style={{
                borderColor: valuationWindow === w ? '#818cf8' : '#334155',
                color: valuationWindow === w ? '#c7d2fe' : '#94a3b8',
              }}
            >
              {w}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="Current P/E" value={formatMultiple(peHist[0] ?? bundle?.quote?.pe)} />
          <Metric label="Historical median" value={formatMultiple(median(peHist))} />
          <Metric label="Historical high" value={formatMultiple(high)} />
          <Metric label="Historical low" value={formatMultiple(low)} />
        </div>
        <Spark
          data={[...met].slice(0, windowN).reverse().map((r) => ({
            label: String(r.calendarYear || r.date || ''),
            value: num(r, 'peRatio'),
          }))}
          color="#a78bfa"
        />
      </Panel>
      <Panel title="Enterprise value" source="MARKET CAP + DEBT − CASH">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          <Metric label="Market capitalization" value={formatCompactUsd(bundle?.quote?.marketCap ?? num(ev0, 'marketCapitalization'))} />
          <Metric label="+ Total debt" value={formatCompactUsd(num(ev0, 'addTotalDebt') ?? num(bundle?.balanceAnnual?.[0], 'totalDebt'))} />
          <Metric label="− Cash" value={formatCompactUsd(num(ev0, 'minusCashAndCashEquivalents') ?? num(bundle?.balanceAnnual?.[0], 'cashAndCashEquivalents'))} />
          <Metric label="= Enterprise value" value={formatCompactUsd(num(ev0, 'enterpriseValue'))} defKey="EV" />
        </div>
      </Panel>
      <Panel title="Capital structure">
        <div className="h-40">
          {ev0 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
              <BarChart
                data={[
                  {
                    name: 'Structure',
                    Equity: bundle?.quote?.marketCap,
                    Debt: num(ev0, 'addTotalDebt'),
                    Cash: num(ev0, 'minusCashAndCashEquivalents'),
                  },
                ]}
              >
                <Tooltip {...chartTip} />
                <Bar dataKey="Equity" fill="#22d3ee" />
                <Bar dataKey="Debt" fill="#f472b6" />
                <Bar dataKey="Cash" fill="#34d399" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <Unavailable />
          )}
        </div>
      </Panel>
    </div>
  );
}

export function IndustryPanels() {
  const { bundle, selectedPeers, setSelectedPeers, symbol } = useFundamental();
  const [peerMetrics, setPeerMetrics] = useState<PeerRow[]>([]);
  const [extra, setExtra] = useState('');

  React.useEffect(() => {
    let cancelled = false;
    const tickers = Array.from(new Set([symbol, ...selectedPeers])).slice(0, 8);
    void (async () => {
      const rows: PeerRow[] = [];
      for (const t of tickers) {
        try {
          const [qRes, mRes] = await Promise.all([
            fetch(`/api/fmp/quote/${encodeURIComponent(t)}`),
            fetch(`/api/fmp/key-metrics-ttm/${encodeURIComponent(t)}`),
          ]);
          if (!qRes.ok) continue;
          const q = await qRes.json();
          const m = mRes.ok ? await mRes.json() : [];
          const quote = Array.isArray(q) ? q[0] : q;
          const met = Array.isArray(m) ? m[0] : m;
          if (quote?.error) continue;
          rows.push({
            company: String(quote?.name || t),
            ticker: t,
            pe: num(quote, 'pe'),
            evEbitda: num(met, 'enterpriseValueOverEBITDATTM'),
            revenueGrowth: null,
            epsGrowth: null,
            roic: num(met, 'roicTTM') ?? num(met, 'roic'),
            fcfMargin: num(met, 'freeCashFlowYieldTTM'),
            debtEbitda: num(met, 'netDebtToEBITDATTM'),
          });
        } catch {
          /* skip */
        }
      }
      if (!cancelled) setPeerMetrics(rows);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedPeers, symbol]);

  const [sortKey, setSortKey] = useState<keyof PeerRow>('ticker');
  const sorted = [...peerMetrics].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv);
    return (Number(bv) || 0) - (Number(av) || 0);
  });

  return (
    <div className="space-y-3">
      <Panel id="industry" title="Industry intelligence">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <Metric label="Sector" value={bundle?.identity?.sector || 'DATA UNAVAILABLE'} />
          <Metric label="Industry" value={bundle?.identity?.industry || 'DATA UNAVAILABLE'} />
          <Metric label="Industry growth" value="DATA UNAVAILABLE" />
          <Metric label="Pricing environment" value="DATA UNAVAILABLE" />
          <Metric label="Supply / demand" value="DATA UNAVAILABLE" />
          <Metric label="Concentration / regulation" value="DATA UNAVAILABLE" />
        </div>
      </Panel>
      <Panel title="Peer comparison">
        <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">Sorting rearranges the table. It is not a ranking or recommendation.</p>
        <form
          className="mb-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const t = extra.trim().toUpperCase();
            if (t && !selectedPeers.includes(t)) setSelectedPeers([...selectedPeers, t].slice(0, 12));
            setExtra('');
          }}
        >
          <input
            value={extra}
            onChange={(e) => setExtra(e.target.value)}
            placeholder="Add ticker"
            className="rounded border border-white/10 bg-black/50 px-2 py-1 font-mono text-xs text-white"
          />
          <button type="submit" className="rounded border border-cyan-500/40 px-2 py-1 text-[9px] font-black uppercase tracking-widest text-cyan-300">
            Add peer
          </button>
        </form>
        <div className="overflow-auto">
          <table className="w-full min-w-[720px] font-mono text-[10px] tabular-nums">
            <thead>
              <tr className="text-left text-[8px] uppercase text-zinc-500">
                {(['company', 'pe', 'evEbitda', 'revenueGrowth', 'epsGrowth', 'roic', 'fcfMargin', 'debtEbitda'] as const).map((k) => (
                  <th key={k} className="cursor-pointer px-2 py-1" onClick={() => setSortKey(k)}>
                    {k}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row) => (
                <tr key={row.ticker} className="border-t border-white/5">
                  <td className="px-2 py-1">{row.company} ({row.ticker})</td>
                  <td className="px-2 py-1">{formatMultiple(row.pe)}</td>
                  <td className="px-2 py-1">{formatMultiple(row.evEbitda)}</td>
                  <td className="px-2 py-1">{formatPercent(row.revenueGrowth)}</td>
                  <td className="px-2 py-1">{formatPercent(row.epsGrowth)}</td>
                  <td className="px-2 py-1">{formatPercent(row.roic, true)}</td>
                  <td className="px-2 py-1">{formatPercent(row.fcfMargin, true)}</td>
                  <td className="px-2 py-1">{formatMultiple(row.debtEbitda)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!sorted.length ? <Unavailable /> : null}
        </div>
      </Panel>
      <Panel title="Competitive landscape / market share">
        <p className="font-mono text-[9px] uppercase text-zinc-500">
          Market share time series are shown only when a vendor supplies them. Current feed: DATA UNAVAILABLE for share percentages. Peers listed: {selectedPeers.join(', ') || 'none'}.
        </p>
      </Panel>
    </div>
  );
}

export function MacroPanels() {
  const { bundle } = useFundamental();
  const points = bundle?.macro || [];
  const rates = bundle?.rates || [];
  const comm = bundle?.commodities || [];
  const dgs2 = rates.find((r) => r.id === 'dgs2')?.value;
  const dgs10 = rates.find((r) => r.id === 'dgs10')?.value;
  const spread = dgs2 != null && dgs10 != null ? dgs10 - dgs2 : null;
  return (
    <div className="space-y-3">
      <Panel id="macro" title="Macroeconomic environment" source="ECONOMIC DATA PROVIDER (FRED)">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {points.map((p) => (
            <Metric
              key={p.id}
              label={p.label}
              value={p.value == null ? 'DATA UNAVAILABLE' : formatNumber(p.value, 2)}
              sub={p.date ? `Release ${p.date}` : undefined}
            />
          ))}
        </div>
      </Panel>
      <Panel title="Interest-rate exposure">
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          {rates.map((p) => (
            <Metric key={p.id} label={p.label} value={p.value == null ? 'DATA UNAVAILABLE' : `${p.value.toFixed(2)}%`} sub={p.date || undefined} />
          ))}
          <Metric label="10Y–2Y curve" value={spread == null ? 'DATA UNAVAILABLE' : `${spread.toFixed(2)} pp`} />
        </div>
      </Panel>
      <Panel title="Commodity exposure">
        <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">Company metric ↔ commodity price are shown side by side. No trade inference.</p>
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {comm.map((p) => (
            <Metric key={p.id} label={p.label} value={p.value == null ? 'DATA UNAVAILABLE' : formatNumber(p.value, 2)} sub={p.unit} />
          ))}
        </div>
      </Panel>
      <Panel title="Currency exposure">
        <p className="font-mono text-[9px] uppercase text-zinc-500">
          Geographic revenue mix is in the overview segmentation table when filed. Major pairs: see catalog search (EURUSD, USDJPY). FX change series: DATA UNAVAILABLE unless selected as the research asset.
        </p>
      </Panel>
    </div>
  );
}

export function NewsRiskPanels() {
  const { bundle, symbol } = useFundamental();
  const [newsFilter, setNewsFilter] = useState('All');
  const cats = ['All', 'Earnings', 'Corporate', 'Management', 'Regulation', 'Litigation', 'M&A', 'Product', 'Industry', 'Macro', 'Geopolitical'];
  const news = (bundle?.news || []).filter((n) => newsFilter === 'All' || n.category === newsFilter);
  return (
    <div className="space-y-3">
      <Panel id="news" title="News intelligence">
        <div className="mb-2 flex flex-wrap gap-1">
          {cats.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setNewsFilter(c)}
              className="rounded border border-white/10 px-2 py-0.5 text-[8px] font-black uppercase tracking-widest text-zinc-400"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-left font-mono text-[10px]">
            <thead className="sticky top-0 bg-[#0b0e13] text-[8px] uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-1">Time</th>
                <th className="px-2 py-1">Source</th>
                <th className="px-2 py-1">Headline</th>
                <th className="px-2 py-1">Company</th>
                <th className="px-2 py-1">Category</th>
              </tr>
            </thead>
            <tbody>
              {news.map((n, i) => (
                <tr key={`${n.time}-${i}`} className="border-t border-white/5">
                  <td className="whitespace-nowrap px-2 py-1 text-zinc-500">{n.time}</td>
                  <td className="px-2 py-1">{n.source}</td>
                  <td className="px-2 py-1 text-zinc-200">
                    {n.url ? (
                      <a href={n.url} className="hover:text-cyan-300" target="_blank" rel="noreferrer">
                        {n.headline}
                      </a>
                    ) : (
                      n.headline
                    )}
                  </td>
                  <td className="px-2 py-1">{n.company}</td>
                  <td className="px-2 py-1">{n.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!news.length ? <Unavailable /> : null}
        </div>
      </Panel>
      <Panel id="filings" title="SEC / regulatory filings">
        <div className="max-h-64 overflow-auto">
          <table className="w-full text-left font-mono text-[10px]">
            <thead className="text-[8px] uppercase text-zinc-500">
              <tr>
                <th className="px-2 py-1">Date</th>
                <th className="px-2 py-1">Type</th>
                <th className="px-2 py-1">Company</th>
                <th className="px-2 py-1">Description</th>
              </tr>
            </thead>
            <tbody>
              {(bundle?.filings || []).map((f, i) => (
                <tr key={`${f.date}-${f.type}-${i}`} className="border-t border-white/5">
                  <td className="px-2 py-1">{f.date}</td>
                  <td className="px-2 py-1">{f.type}</td>
                  <td className="px-2 py-1">{f.company}</td>
                  <td className="px-2 py-1">
                    {f.url ? (
                      <a className="text-cyan-300 underline" href={f.url} target="_blank" rel="noreferrer">
                        {f.description || 'Open source document'}
                      </a>
                    ) : (
                      f.description || 'DATA UNAVAILABLE'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!bundle?.filings.length ? (
            <p className="p-3 font-mono text-[10px] text-zinc-500">
              DATA UNAVAILABLE from filings feed.
              {bundle?.identity?.cik ? (
                <>
                  {' '}
                  <a
                    className="text-cyan-300 underline"
                    href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(bundle.identity.cik)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open SEC company page
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </div>
      </Panel>
      <Panel title="Management / insider activity">
        <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">Factual historical transactions. Not a recommendation.</p>
        {(bundle?.insiders || []).length ? (
          <FinTable
            columns={['Shares', 'Owned']}
            rows={(bundle?.insiders || []).slice(0, 20).map((r) => ({
              label: `${r.date} ${r.name} ${r.transaction}`,
              values: [r.shares, r.value],
            }))}
            format={formatNumber}
          />
        ) : (
          <Unavailable />
        )}
      </Panel>
      <Panel id="risk" title="Risk factor center" source="Categories for research; filing text when linked">
        <ul className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300 md:grid-cols-3">
          {[
            'Financial',
            'Operational',
            'Competitive',
            'Regulatory',
            'Legal',
            'Geopolitical',
            'Supply chain',
            'Currency',
            'Interest rate',
            'Commodity',
            'Management',
            'Customer concentration',
          ].map((c) => (
            <li key={c} className="rounded border border-white/10 bg-black/40 px-2 py-2">
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-2 font-mono text-[8px] uppercase text-zinc-600">
          Narrative risk factors live in the 10-K. This panel does not auto-score risk as a trade idea. Symbol {symbol}.
        </p>
      </Panel>
    </div>
  );
}

export function WorkspacePanels() {
  const { bundle, period, chartLayout, setChartLayout, notes, addNote, watchlists, setWatchlists, alerts, symbol } =
    useFundamental();
  const stmts = pickStatements(bundle || ({} as never), period === 'ttm' ? 'annual' : period);
  const [note, setNote] = useState('');
  const [q, setQ] = useState('');
  const [answer, setAnswer] = useState('');
  const layout = CHART_LAYOUTS.find((l) => l.id === chartLayout) || CHART_LAYOUTS[0];
  const keys: Record<string, { data: { label: string; value: number | null }[]; color: string }> = {
    Revenue: { data: seriesFrom(stmts.income, 'revenue', period === 'quarter' ? 'quarter' : 'annual'), color: '#22d3ee' },
    EPS: { data: seriesFrom(stmts.income, 'epsdiluted', period === 'quarter' ? 'quarter' : 'annual'), color: '#818cf8' },
    'Free Cash Flow': { data: seriesFrom(stmts.cash, 'freeCashFlow', period === 'quarter' ? 'quarter' : 'annual'), color: '#34d399' },
    'Operating Margin': { data: seriesFrom(stmts.income, 'operatingIncomeRatio', period === 'quarter' ? 'quarter' : 'annual'), color: '#f472b6' },
    'P/E': { data: seriesFrom(bundle?.metricsAnnual, 'peRatio', 'annual'), color: '#a78bfa' },
    'EV/EBITDA': { data: seriesFrom(bundle?.metricsAnnual, 'enterpriseValueOverEBITDA', 'annual'), color: '#22d3ee' },
    ROIC: { data: seriesFrom(bundle?.metricsAnnual, 'roic', 'annual'), color: '#fbbf24' },
    ROE: { data: seriesFrom(bundle?.metricsAnnual, 'roe', 'annual'), color: '#34d399' },
    Cash: { data: seriesFrom(stmts.balance, 'cashAndCashEquivalents', period === 'quarter' ? 'quarter' : 'annual'), color: '#22d3ee' },
    Debt: { data: seriesFrom(stmts.balance, 'totalDebt', period === 'quarter' ? 'quarter' : 'annual'), color: '#f472b6' },
  };

  const inc0 = stmts.income?.[0];
  const [scenario, setScenario] = useState(() => ({
    revenueBase: num(inc0, 'revenue'),
    revenueHigh: num(inc0, 'revenue'),
    revenueLow: num(inc0, 'revenue'),
    marginBase: num(inc0, 'operatingIncomeRatio'),
    marginHigh: num(inc0, 'operatingIncomeRatio'),
    marginLow: num(inc0, 'operatingIncomeRatio'),
    fcfConversionBase: 0.7,
    fcfConversionHigh: 0.85,
    fcfConversionLow: 0.5,
  }));
  const out = useMemo(() => runScenario(scenario), [scenario]);

  return (
    <div className="space-y-3">
      <Panel id="workspace" title="Multi-chart fundamental workspace">
        <div className="mb-2 flex flex-wrap gap-1">
          {CHART_LAYOUTS.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setChartLayout(l.id)}
              className="rounded border px-2 py-1 text-[8px] font-black uppercase tracking-widest"
              style={{
                borderColor: chartLayout === l.id ? '#22d3ee' : '#334155',
                color: chartLayout === l.id ? '#22d3ee' : '#94a3b8',
              }}
            >
              {l.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {layout.series.map((name) => (
            <div key={name} className="rounded border border-white/10 p-2">
              <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-zinc-400">{name}</p>
              <Spark data={keys[name]?.data || []} color={keys[name]?.color} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Scenario analysis">
        <p className="mb-2 font-mono text-[8px] uppercase text-amber-200/90">{SCENARIO_DISCLAIMER}</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            ['Revenue base', 'revenueBase'],
            ['Revenue high', 'revenueHigh'],
            ['Revenue low', 'revenueLow'],
            ['Margin base', 'marginBase'],
            ['Margin high', 'marginHigh'],
            ['Margin low', 'marginLow'],
            ['FCF conv. base', 'fcfConversionBase'],
            ['FCF conv. high', 'fcfConversionHigh'],
            ['FCF conv. low', 'fcfConversionLow'],
          ] as const).map(([label, key]) => (
            <label key={key} className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
              {label}
              <input
                type="number"
                className="mt-1 w-full rounded border border-white/10 bg-black/60 px-2 py-1 font-mono text-xs text-white"
                value={scenario[key] ?? ''}
                onChange={(e) =>
                  setScenario({ ...scenario, [key]: e.target.value === '' ? null : Number(e.target.value) })
                }
              />
            </label>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <Metric label="EBIT base" value={formatCompactUsd(out.ebitBase)} />
          <Metric label="EBIT high" value={formatCompactUsd(out.ebitHigh)} />
          <Metric label="EBIT low" value={formatCompactUsd(out.ebitLow)} />
          <Metric label="FCF base" value={formatCompactUsd(out.fcfBase)} />
          <Metric label="FCF high" value={formatCompactUsd(out.fcfHigh)} />
          <Metric label="FCF low" value={formatCompactUsd(out.fcfLow)} />
        </div>
      </Panel>
      <Panel title="Research notes">
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Thesis observations, metrics, earnings, management, industry, macro, links…"
          className="w-full rounded border border-white/10 bg-black/50 p-2 text-sm text-zinc-200"
        />
        <button
          type="button"
          className="mt-2 rounded border border-cyan-500/40 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-cyan-300"
          onClick={() => {
            if (!note.trim()) return;
            addNote(note.trim(), ['manual']);
            setNote('');
          }}
        >
          Save note
        </button>
        <ul className="mt-3 space-y-2">
          {notes.filter((n) => n.symbol === symbol).map((n) => (
            <li key={n.id} className="rounded border border-white/5 p-2 font-mono text-[11px] text-zinc-300">
              <span className="text-zinc-600">{new Date(n.createdAt).toISOString()}</span>
              <p className="mt-1 whitespace-pre-wrap">{n.body}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Research watchlists">
        {watchlists.map((wl) => (
          <div key={wl.id} className="mb-2 rounded border border-white/10 p-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">
              {wl.name} · {wl.group}
            </p>
            <p className="font-mono text-xs text-zinc-400">{wl.symbols.join(' · ')}</p>
          </div>
        ))}
        <button
          type="button"
          className="text-[9px] font-black uppercase tracking-widest text-cyan-300"
          onClick={() =>
            setWatchlists([
              ...watchlists,
              { id: `wl-${Date.now()}`, name: `${symbol} research`, group: 'research status', symbols: [symbol] },
            ])
          }
        >
          Add current symbol to a new list
        </button>
      </Panel>
      <Panel title="Alerts">
        {!alerts.length ? <Unavailable message="No objective change alerts stored yet" /> : null}
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.id} className="rounded border border-white/10 p-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-pink-300">{a.title}</p>
              <p className="font-mono text-[11px] text-zinc-300">{a.detail}</p>
            </li>
          ))}
        </ul>
      </Panel>
      <Panel title="Fundamental research assistant">
        <p className="mb-2 font-mono text-[8px] uppercase text-zinc-500">
          Explains metrics and reported figures. Does not recommend transactions.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const lower = q.toLowerCase();
            if (/should i (buy|sell)|strong buy|strong sell|good entry|take profit|stop loss/.test(lower)) {
              setAnswer(ASSISTANT_REFUSAL);
              return;
            }
            const hit = Object.keys(definitionFor('P/E') ? { P: 1 } : {}).length;
            void hit;
            const def =
              definitionFor('ROIC') && /roic/.test(lower)
                ? definitionFor('ROIC')
                : /ev\/ebitda|enterprise/.test(lower)
                  ? definitionFor('EV/EBITDA')
                  : /fcf|free cash/.test(lower)
                    ? definitionFor('FCF')
                    : /peg/.test(lower)
                      ? definitionFor('PEG')
                      : /p\/e|pe ratio/.test(lower)
                        ? definitionFor('P/E')
                        : null;
            if (def) setAnswer(`${def.title}: ${def.body}`);
            else if (/earn|eps/.test(lower))
              setAnswer(
                `Latest diluted EPS on the statement feed: ${formatUsdPerShare(num(bundle?.incomeAnnual?.[0], 'epsdiluted'))}. Consensus when provided: ${formatUsdPerShare(num(bundle?.estimates?.[0], 'estimatedEpsAvg'))}.`,
              );
            else setAnswer('Ask about a metric (ROIC, EV/EBITDA, FCF, PEG, P/E) or a reported line (revenue, EPS). ' + ASSISTANT_REFUSAL);
          }}
        >
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Explain ROIC…"
            className="w-full rounded border border-white/10 bg-black/50 px-2 py-2 text-sm text-white"
          />
        </form>
        {answer ? <p className="mt-2 text-sm leading-relaxed text-zinc-300">{answer}</p> : null}
      </Panel>
    </div>
  );
}

export function ValuationRail() {
  const { bundle } = useFundamental();
  const met = bundle?.metricsTtm || bundle?.metricsAnnual?.[0];
  return (
    <Panel title="Valuation">
      <div className="space-y-2">
        <Metric label="P/E" value={formatMultiple(bundle?.quote?.pe ?? num(met, 'peRatioTTM') ?? num(met, 'peRatio'))} defKey="P/E" />
        <Metric label="Forward P/E" value={formatMultiple(num(met, 'forwardPE'))} />
        <Metric label="EV/EBITDA" value={formatMultiple(num(met, 'enterpriseValueOverEBITDATTM') ?? num(met, 'enterpriseValueOverEBITDA'))} defKey="EV/EBITDA" />
        <Metric label="P/S" value={formatMultiple(num(met, 'priceToSalesRatioTTM') ?? num(met, 'priceToSalesRatio'))} />
        <Metric label="P/B" value={formatMultiple(num(met, 'pbRatioTTM') ?? num(met, 'pbRatio'))} />
        <Metric label="FCF yield" value={formatPercent(num(met, 'freeCashFlowYieldTTM') ?? num(met, 'freeCashFlowYield'), true)} defKey="FCF yield" />
      </div>
    </Panel>
  );
}

export function StatusChip() {
  const { bundle, loading } = useFundamental();
  if (loading) return <DataRibbon status="delayed" label="LOADING" />;
  return <DataRibbon status={bundle?.fmp || 'unavailable'} />;
}
