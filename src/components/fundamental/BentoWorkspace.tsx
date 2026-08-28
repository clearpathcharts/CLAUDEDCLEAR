import React from 'react';
import { useFundamental } from './FundamentalContext';
import {
  Bento,
  CompactEmpty,
  DualDotChart,
  ExposureDot,
  HistRange,
  MarginMeter,
  MixBars,
  SparkBars,
  SparkLine,
  StatRow,
} from './BentoPrimitives';
import { pickStatements, num } from '../../fundamental/service';
import {
  asPercent,
  concentrationBand,
  coverageExposure,
  parseSegments,
  seriesFrom,
  stmtPeriod,
} from '../../fundamental/viz';
import { usePeerRows } from '../../fundamental/usePeerRows';
import {
  cagr,
  extrema,
  formatCompactUsd,
  formatMultiple,
  formatNumber,
  formatPercent,
  formatUsdPerShare,
  median,
  yoyGrowth,
} from '../../fundamental/format';

function latestForm(filings: { type: string; date: string; url?: string }[], type: string) {
  const hit = filings.find((f) => f.type.toUpperCase().includes(type));
  return hit || null;
}

export default function BentoWorkspace({
  expandedId,
  onExpand,
}: {
  expandedId: string | null;
  onExpand: (id: string) => void;
}) {
  const { bundle, period, symbol, selectedPeers } = useFundamental();
  const stmts = pickStatements(bundle || ({} as never), period === 'ttm' ? 'annual' : period);
  const p = stmtPeriod(period);
  const inc0 = stmts.income?.[0];
  const inc1 = stmts.income?.[1];
  const cf0 = stmts.cash?.[0];
  const bs0 = stmts.balance?.[0];
  const met0 = period === 'ttm' ? bundle?.metricsTtm : stmts.metrics?.[0];
  const ttm = bundle?.metricsTtm;
  const product = parseSegments(bundle?.productSegments);
  const geo = parseSegments(bundle?.geoSegments);
  const revSeries = seriesFrom(stmts.income, 'revenue', p);
  const fcfSeries = seriesFrom(stmts.cash, 'freeCashFlow', p);
  const epsSeries = seriesFrom(stmts.income, 'epsdiluted', p);
  const debtSeries = seriesFrom(stmts.balance, 'totalDebt', p);
  const capexSeries = seriesFrom(stmts.cash, 'capitalExpenditure', p);
  const yoy = yoyGrowth(num(inc0, 'revenue'), num(inc1, 'revenue'));
  const cagr3 = cagr(revSeries[0]?.value ?? null, revSeries[revSeries.length - 1]?.value ?? null, Math.max(1, revSeries.length - 1));
  const gross = asPercent(num(inc0, 'grossProfitRatio'));
  const opm = asPercent(num(inc0, 'operatingIncomeRatio'));
  const npm = asPercent(num(inc0, 'netIncomeRatio'));
  const roic = asPercent(num(met0, 'roic') ?? num(met0, 'roicTTM') ?? num(met0, 'returnOnInvestedCapital'));
  const fcf = num(cf0, 'freeCashFlow');
  const ocf = num(cf0, 'operatingCashFlow');
  const capex = num(cf0, 'capitalExpenditure');
  const fcfM = num(inc0, 'revenue') && fcf != null ? (fcf / num(inc0, 'revenue')!) * 100 : null;
  const coverage = num(met0, 'interestCoverage');
  const rateExp = coverageExposure(coverage);
  const geoMax = geo.reduce((m, g) => Math.max(m, g.contribution ?? 0), 0) || null;
  const geoBand = concentrationBand(geo.length ? geoMax : null);
  const prodBand = concentrationBand(product.length ? product.reduce((m, g) => Math.max(m, g.contribution ?? 0), 0) : null);
  const peHist = (bundle?.metricsAnnual || []).slice(0, 8).map((r) => num(r, 'peRatio'));
  const peNow = bundle?.quote?.pe ?? num(ttm, 'peRatioTTM') ?? peHist[0] ?? null;
  const { high, low } = extrema(peHist);
  const surprises = (bundle?.epsSurprises || []).slice(0, 10);
  const earnChart = [...surprises].reverse().map((row) => ({
    label: String(row.date || '').slice(0, 7),
    estimate: num(row, 'estimatedEarning'),
    actual: num(row, 'actualEarningResult'),
  }));
  const peers = usePeerRows(symbol, selectedPeers);
  const peerAvg = (key: keyof (typeof peers)[0]) => {
    const nums = peers.map((r) => r[key]).filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
    if (!nums.length) return null;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
  };
  const filings = bundle?.filings || [];
  const id = bundle?.identity;
  const stamp = bundle?.fetchedAt ? new Date(bundle.fetchedAt).toISOString().slice(0, 16).replace('T', ' ') + ' UTC' : '—';
  const src = bundle?.fmp === 'live' ? 'FMP (as reported)' : bundle?.fmp === 'unconfigured' ? 'Vendor unconfigured' : 'Vendor';
  const toggle = (idName: string) => onExpand(expandedId === idName ? '' : idName);

  return (
    <div className="fund-bento-grid">
      <Bento
        id="company"
        kicker="Company"
        title="Identity"
        span={4}
        primary={id?.employees != null ? formatNumber(id.employees, 0) : '—'}
        primaryLabel="Employees"
        source={src}
        period={stamp}
        onExpand={() => toggle('overview')}
        expanded={expandedId === 'overview'}
      >
        <StatRow label="Revenue" value={formatCompactUsd(num(inc0, 'revenue'))} />
        <StatRow label="Earnings" value={formatCompactUsd(num(inc0, 'netIncome'))} />
        <StatRow label="Net margin" value={formatPercent(npm)} />
        <StatRow label="CEO" value={id?.ceo || 'DATA UNAVAILABLE'} />
      </Bento>

      <Bento
        id="business"
        kicker="Business"
        title="Business model"
        span={4}
        primary={product[0]?.segment || '—'}
        primaryLabel="Largest disclosed stream"
        source="Filed segmentation"
        period={stamp}
        onExpand={() => toggle('overview')}
        expanded={expandedId === 'overview'}
      >
        <MixBars
          rows={product.slice(0, 6).map((s) => ({
            label: s.segment.slice(0, 18),
            pct: s.contribution,
          }))}
        />
      </Bento>

      <Bento
        id="valuation"
        kicker="Valuation"
        title="Market multiples"
        span={4}
        primary={formatMultiple(peNow)}
        primaryLabel="P/E"
        source={src}
        period={stamp}
        onExpand={() => toggle('valuation')}
        expanded={expandedId === 'valuation'}
      >
        <StatRow label="Forward P/E" value={formatMultiple(num(ttm, 'forwardPE') ?? num(met0, 'forwardPE'))} />
        <StatRow label="EV / EBITDA" value={formatMultiple(num(ttm, 'enterpriseValueOverEBITDATTM') ?? num(met0, 'enterpriseValueOverEBITDA'))} />
        <StatRow label="P/S" value={formatMultiple(num(ttm, 'priceToSalesRatioTTM') ?? num(met0, 'priceToSalesRatio'))} />
        <StatRow label="P/B" value={formatMultiple(num(ttm, 'pbRatioTTM') ?? num(met0, 'pbRatio'))} />
        <StatRow
          label="FCF yield"
          value={formatPercent(num(ttm, 'freeCashFlowYieldTTM') ?? num(met0, 'freeCashFlowYield'), true)}
        />
        <div className="mt-2">
          <HistRange low={low} high={high} current={peNow} />
        </div>
        <p className="fund-mono mt-2 text-[9px] uppercase tracking-widest text-[#6f6a60]">
          Descriptive multiples — not a cheap/expensive call
        </p>
      </Bento>

      <Bento
        id="revenue"
        kicker="Financials"
        title="Revenue engine"
        span={5}
        primary={formatCompactUsd(num(inc0, 'revenue'))}
        primaryLabel="Latest revenue"
        source="Income statement"
        period={`${period.toUpperCase()} · ${stamp}`}
        onExpand={() => toggle('financials')}
        expanded={expandedId === 'financials'}
      >
        <SparkBars data={revSeries} />
        <div className="mt-2 grid grid-cols-3 gap-2">
          <StatRow label="YoY" value={formatPercent(yoy)} />
          <StatRow label="CAGR" value={formatPercent(cagr3)} />
          <StatRow label="Periods" value={String(revSeries.filter((d) => d.value != null).length || '—')} />
        </div>
      </Bento>

      <Bento
        id="profitability"
        kicker="Financials"
        title="Profitability"
        span={3}
        primary={roic == null ? '—' : `${roic.toFixed(1)}%`}
        primaryLabel="ROIC"
        source="Reported ratios"
        period={stamp}
        onExpand={() => toggle('financials')}
        expanded={expandedId === 'financials'}
      >
        <MarginMeter label="Gross" pct={gross} />
        <MarginMeter label="Operating" pct={opm} />
        <MarginMeter label="Net" pct={npm} />
      </Bento>

      <Bento
        id="cashflow"
        kicker="Financials"
        title="Cash flow"
        span={4}
        primary={formatCompactUsd(fcf)}
        primaryLabel="Free cash flow"
        source="Cash flow statement"
        period={stamp}
        onExpand={() => toggle('financials')}
        expanded={expandedId === 'financials'}
      >
        <StatRow label="Operating CF" value={formatCompactUsd(ocf)} />
        <StatRow label="CapEx" value={formatCompactUsd(capex)} />
        <StatRow label="FCF margin" value={formatPercent(fcfM)} />
        <SparkLine data={fcfSeries} color="#7d9a6e" />
      </Bento>

      <Bento
        id="balancesheet"
        kicker="Financials"
        title="Balance sheet"
        span={4}
        primary={formatCompactUsd(num(bs0, 'netDebt'))}
        primaryLabel="Net debt"
        source="Balance sheet"
        period={stamp}
        onExpand={() => toggle('financials')}
        expanded={expandedId === 'financials'}
      >
        <StatRow label="Cash" value={formatCompactUsd(num(bs0, 'cashAndCashEquivalents'))} />
        <StatRow label="Total debt" value={formatCompactUsd(num(bs0, 'totalDebt'))} />
        <StatRow label="Current assets" value={formatCompactUsd(num(bs0, 'totalCurrentAssets'))} />
        <StatRow label="Current liabilities" value={formatCompactUsd(num(bs0, 'totalCurrentLiabilities'))} />
        <StatRow label="Debt / EBITDA" value={formatMultiple(num(met0, 'debtToEBITDA') ?? num(met0, 'netDebtToEBITDA'))} />
        <StatRow
          label="Current ratio"
          value={formatMultiple(
            num(bs0, 'totalCurrentAssets') != null && num(bs0, 'totalCurrentLiabilities')
              ? num(bs0, 'totalCurrentAssets')! / num(bs0, 'totalCurrentLiabilities')!
              : null,
          )}
        />
        <SparkLine data={debtSeries} color="#c45c4a" />
      </Bento>

      <Bento
        id="earnings"
        kicker="Earnings"
        title="Earnings"
        span={4}
        primary={formatUsdPerShare(bundle?.quote?.eps ?? num(inc0, 'epsdiluted'))}
        primaryLabel="EPS"
        source="Surprise feed"
        period={stamp}
        onExpand={() => toggle('earnings')}
        expanded={expandedId === 'earnings'}
      >
        <DualDotChart data={earnChart} />
        <StatRow label="Next date" value={bundle?.quote?.earningsAnnouncement || 'DATA UNAVAILABLE'} />
        <StatRow
          label="Consensus EPS"
          value={formatUsdPerShare(num(bundle?.estimates?.[0], 'estimatedEpsAvg'))}
        />
        <p className="fund-mono mt-1 text-[9px] uppercase text-[#6f6a60]">Solid = actual · dashed = estimate</p>
      </Bento>

      <Bento
        id="capital"
        kicker="Financials"
        title="Capital allocation"
        span={4}
        primary={formatCompactUsd(num(cf0, 'commonStockRepurchased'))}
        primaryLabel="Buybacks (reported)"
        source="Cash flow statement"
        period={stamp}
        onExpand={() => toggle('financials')}
        expanded={expandedId === 'financials'}
      >
        <StatRow label="Dividends" value={formatCompactUsd(num(cf0, 'dividendsPaid'))} />
        <StatRow label="CapEx" value={formatCompactUsd(capex)} />
        <StatRow label="Acquisitions" value={formatCompactUsd(num(cf0, 'acquisitionsNet'))} />
        <StatRow label="Debt issuance" value={formatCompactUsd(num(cf0, 'debtIssuance'))} />
        <SparkLine data={capexSeries} />
      </Bento>

      <Bento
        id="industry"
        kicker="Industry"
        title="Industry / peers"
        span={12}
        source="Peer quotes · TTM metrics"
        period={stamp}
        onExpand={() => toggle('industry')}
        expanded={expandedId === 'industry'}
      >
        <p className="fund-sans mb-2 text-[12px] text-[#9a9588]">
          {id?.sector || 'Sector unavailable'} · {id?.industry || 'Industry unavailable'} · sorting is display only, not a ranking
        </p>
        {peers.length ? (
          <div className="overflow-auto">
            <table className="fund-mono w-full min-w-[640px] text-left text-[11px] tabular-nums">
              <thead className="text-[9px] uppercase tracking-widest text-[#6f6a60]">
                <tr>
                  <th className="px-2 py-1">Company</th>
                  <th className="px-2 py-1">P/E</th>
                  <th className="px-2 py-1">EV/EBITDA</th>
                  <th className="px-2 py-1">ROIC</th>
                  <th className="px-2 py-1">FCF yield</th>
                  <th className="px-2 py-1">Net debt/EBITDA</th>
                </tr>
              </thead>
              <tbody>
                {peers.map((row) => (
                  <tr key={row.ticker} className="border-t border-[rgba(232,228,219,0.08)]">
                    <td className="px-2 py-1.5">
                      {row.ticker}
                      {row.ticker === symbol ? ' · subject' : ''}
                    </td>
                    <td className="px-2 py-1.5">{formatMultiple(row.pe)}</td>
                    <td className="px-2 py-1.5">{formatMultiple(row.evEbitda)}</td>
                    <td className="px-2 py-1.5">{formatPercent(row.roic, true)}</td>
                    <td className="px-2 py-1.5">{formatPercent(row.fcfMargin, true)}</td>
                    <td className="px-2 py-1.5">{formatMultiple(row.debtEbitda)}</td>
                  </tr>
                ))}
                <tr className="border-t border-[rgba(232,228,219,0.16)] text-[#c49558]">
                  <td className="px-2 py-1.5">Peer average</td>
                  <td className="px-2 py-1.5">{formatMultiple(peerAvg('pe'))}</td>
                  <td className="px-2 py-1.5">{formatMultiple(peerAvg('evEbitda'))}</td>
                  <td className="px-2 py-1.5">{formatPercent(peerAvg('roic'), true)}</td>
                  <td className="px-2 py-1.5">{formatPercent(peerAvg('fcfMargin'), true)}</td>
                  <td className="px-2 py-1.5">{formatMultiple(peerAvg('debtEbitda'))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <CompactEmpty hint="Peer series awaiting vendor" />
        )}
      </Bento>

      <Bento
        id="geo"
        kicker="Exposure"
        title="Geographic exposure"
        span={4}
        source="Filed geographic mix"
        period={stamp}
        onExpand={() => toggle('overview')}
        expanded={expandedId === 'overview'}
      >
        <MixBars rows={geo.slice(0, 8).map((s) => ({ label: s.segment.slice(0, 18), pct: s.contribution }))} />
      </Bento>

      <Bento
        id="macro"
        kicker="Exposure"
        title="Macro exposure"
        span={4}
        source="FRED environment + coverage math"
        period={stamp}
        onExpand={() => toggle('macro')}
        expanded={expandedId === 'macro'}
      >
        <ExposureDot
          label="Interest rates"
          band={rateExp?.band ?? null}
          note={rateExp?.note || 'No interest-coverage figure on the statement feed — company rate sensitivity unmapped.'}
        />
        <ExposureDot
          label="Currency"
          band={geoBand?.band ?? null}
          note={geoBand?.note || 'No geographic mix on file — currency concentration unmapped.'}
        />
        <ExposureDot
          label="Inflation"
          band={null}
          note={`CPI (FRED): ${bundle?.macro?.find((m) => m.id === 'cpi')?.value ?? 'DATA UNAVAILABLE'}. Company-specific inflation mapping is not inferred.`}
        />
        <ExposureDot
          label="GDP"
          band={null}
          note={`GDP (FRED): ${bundle?.macro?.find((m) => m.id === 'gdp')?.value ?? 'DATA UNAVAILABLE'}. Company-to-GDP beta is not inferred.`}
        />
        <ExposureDot
          label="Commodities"
          band={null}
          note="WTI / copper / gold shown in Expand. No automatic commodity-beta score."
        />
      </Bento>

      <Bento
        id="risk"
        kicker="Risk"
        title="Risk factors"
        span={4}
        source="Reported figures"
        period={stamp}
        onExpand={() => toggle('risk')}
        expanded={expandedId === 'risk'}
      >
        <StatRow label="Debt" value={formatCompactUsd(num(bs0, 'totalDebt'))} />
        <StatRow label="Customer concentration" value="DATA UNAVAILABLE" />
        <StatRow
          label="Geographic concentration"
          value={geoMax != null ? `${geoMax.toFixed(1)}%` : 'DATA UNAVAILABLE'}
        />
        <StatRow
          label="Segment concentration"
          value={prodBand ? `${product.reduce((m, g) => Math.max(m, g.contribution ?? 0), 0).toFixed(1)}%` : 'DATA UNAVAILABLE'}
        />
        <StatRow label="Cyclical revenue" value="DATA UNAVAILABLE" />
        <StatRow label="Regulatory" value={filings.some((f) => /8-K|10-K/i.test(f.type)) ? 'See filings' : 'DATA UNAVAILABLE'} />
        <p className="fund-mono mt-2 text-[9px] uppercase text-[#6f6a60]">Measurements only — no composite risk score</p>
      </Bento>

      <Bento
        id="filings"
        kicker="Research"
        title="Filings"
        span={4}
        source="SEC / vendor filings"
        period={stamp}
        onExpand={() => toggle('filings')}
        expanded={expandedId === 'filings'}
      >
        {(['10-K', '10-Q', '8-K', 'DEF 14A'] as const).map((form) => {
          const hit = latestForm(filings, form === 'DEF 14A' ? 'DEF 14' : form);
          return (
            <div key={form} className="flex items-center justify-between border-b border-[rgba(232,228,219,0.06)] py-1.5">
              <span className="fund-sans text-[12px]">{form === 'DEF 14A' ? 'Proxy' : form}</span>
              <span className="fund-mono text-[11px] text-[#9a9588]">{hit?.date?.slice(0, 10) || '—'}</span>
              {hit?.url ? (
                <a className="fund-mono text-[10px] uppercase tracking-widest text-[#c49558]" href={hit.url} target="_blank" rel="noreferrer">
                  Read
                </a>
              ) : (
                <span className="fund-mono text-[10px] uppercase text-[#6f6a60]">No link</span>
              )}
            </div>
          );
        })}
        {!filings.length ? <CompactEmpty hint="Filings feed empty" /> : null}
      </Bento>

      <Bento
        id="news"
        kicker="Research"
        title="Company news"
        span={4}
        source="Vendor headlines"
        period={stamp}
        onExpand={() => toggle('news')}
        expanded={expandedId === 'news'}
      >
        {(bundle?.news || []).slice(0, 6).length ? (
          <ul className="space-y-2">
            {(bundle?.news || []).slice(0, 6).map((n, i) => (
              <li key={`${n.time}-${i}`}>
                <p className="fund-mono text-[9px] uppercase tracking-widest text-[#6f6a60]">
                  {n.time.slice(11, 16) || n.time.slice(0, 10)} · {n.category}
                </p>
                {n.url ? (
                  <a href={n.url} target="_blank" rel="noreferrer" className="fund-sans text-[13px] leading-snug text-[#f4efe4] hover:text-[#c49558]">
                    {n.headline}
                  </a>
                ) : (
                  <p className="fund-sans text-[13px] leading-snug">{n.headline}</p>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <CompactEmpty hint="No company headlines" />
        )}
      </Bento>

      <Bento
        id="management"
        kicker="Research"
        title="Management"
        span={4}
        source="Company profile"
        period={stamp}
        onExpand={() => toggle('workspace')}
        expanded={expandedId === 'workspace'}
      >
        <StatRow label="CEO" value={id?.ceo || 'DATA UNAVAILABLE'} />
        <StatRow label="CFO" value="DATA UNAVAILABLE" />
        <p className="fund-kicker mt-3">Latest sourced commentary</p>
        <p className="fund-sans text-[13px] leading-relaxed text-[#9a9588]">
          No unsourced quotation. Open the latest 10-Q / 10-K / earnings call from Filings.
        </p>
        {id?.cik ? (
          <a
            className="fund-mono mt-2 inline-block text-[10px] uppercase tracking-widest text-[#c49558]"
            href={`https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${encodeURIComponent(id.cik)}`}
            target="_blank"
            rel="noreferrer"
          >
            SEC company page
          </a>
        ) : null}
      </Bento>
    </div>
  );
}
