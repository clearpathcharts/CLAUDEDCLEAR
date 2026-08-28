import React, { useEffect, useMemo, useState } from "react";
import { Maximize2, X } from "lucide-react";
import { TradingHaltController } from "../../truth/TradingHaltController";
import { getClearState, subscribeToClearState } from "../../lib/trading/clearState";
import {
  cagr,
  fetchFundamentalResearch,
  formatMoney,
  formatPct,
  formatPrice,
  formatRatio,
  n,
  rangeOf,
  s,
  series,
  yoy,
  type FundamentalResearchPack,
} from "../../services/fundamentalResearchService";
import { MarginBar, MetricRow, RangeTrack, SegmentTree, Sparkline, YearLabels } from "./viz";
import "./fundamentalDesk.css";

const RAIL = [
  { id: "identity", label: "Overview" },
  { id: "financials", label: "Financials" },
  { id: "valuation", label: "Valuation" },
  { id: "earnings", label: "Earnings" },
  { id: "industry", label: "Industry" },
  { id: "macro", label: "Macro" },
  { id: "news", label: "News" },
  { id: "filings", label: "Filings" },
] as const;

function Bento({
  id,
  title,
  source,
  className,
  children,
  onExpand,
}: {
  id?: string;
  title: string;
  source?: string;
  className?: string;
  children: React.ReactNode;
  onExpand?: () => void;
}) {
  return (
    <article id={id} className={`fr-bento ${className || ""}`}>
      <header className="fr-bento-head">
        <div>
          <h3 className="fr-bento-title">{title}</h3>
          {source ? <div className="fr-stamp mt-1">{source}</div> : null}
        </div>
        {onExpand ? (
          <button type="button" className="fr-expand" onClick={onExpand} aria-label={`Expand ${title}`}>
            <Maximize2 size={11} className="inline mr-1" />
            Expand
          </button>
        ) : null}
      </header>
      <div className="flex-1 min-h-0">{children}</div>
    </article>
  );
}

export default function FundamentalResearchDesk() {
  const [symbol, setSymbol] = useState(() => getClearState().selectedAsset || "NVDA");
  const [query, setQuery] = useState(symbol);
  const [pack, setPack] = useState<FundamentalResearchPack | null>(null);
  const [loading, setLoading] = useState(true);
  const [rail, setRail] = useState("identity");
  const [expanded, setExpanded] = useState<{ title: string; body: React.ReactNode } | null>(null);
  const [halted, setHalted] = useState(TradingHaltController.isHalted());
  const [haltReason, setHaltReason] = useState(TradingHaltController.getHaltReason());

  useEffect(() => TradingHaltController.subscribe((h, r) => {
    setHalted(h);
    setHaltReason(r);
  }), []);

  useEffect(() => subscribeToClearState((state) => {
    if (state.selectedAsset && state.selectedAsset !== symbol) {
      setSymbol(state.selectedAsset);
      setQuery(state.selectedAsset);
    }
  }), [symbol]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchFundamentalResearch(symbol).then((next) => {
      if (!cancelled) {
        setPack(next);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [symbol]);

  const model = useMemo(() => {
    if (!pack) return null;
    const q = pack.quote;
    const p = pack.profile;
    const inc = pack.income[0];
    const bs = pack.balance[0];
    const cf = pack.cash[0];
    const m = pack.metrics[0];
    const r = pack.ratios[0];
    const revPts = series(pack.income, "revenue");
    const fcfPts = series(pack.cash, "freeCashFlow");
    const ocfPts = series(pack.cash, "operatingCashFlow");
    const epsPts = series(pack.income, "eps");
    const revVals = revPts.map((x) => x.value);
    const peHist = pack.metrics.map((row) => n(row, "peRatio")).filter((v): v is number => v !== null);
    const ceo = pack.executives.find((e) => /chief executive|ceo/i.test(String(e.title || ""))) || pack.executives[0];
    const cfo = pack.executives.find((e) => /chief financial|cfo/i.test(String(e.title || "")));
    const filingTypes = ["10-K", "10-Q", "8-K", "DEF 14A"];
    const latestFilings = filingTypes.map((type) => {
      const hit = pack.filings.find((f) => String(f.type || f.form || "").toUpperCase().includes(type.replace("DEF 14A", "DEF 14")));
      return { type, date: s(hit, "fillingDate") || s(hit, "acceptedDate") || s(hit, "filedDate"), link: s(hit, "finalLink") || s(hit, "link") };
    });
    const liveFeeds = [q, p, inc, bs, cf, m].filter(Boolean).length;
    return {
      name: s(p, "companyName") || pack.symbol,
      ticker: pack.symbol,
      exchange: s(p, "exchangeShortName") || s(p, "exchange"),
      sector: s(p, "sector"),
      industry: s(p, "industry"),
      image: s(p, "image"),
      description: s(p, "description"),
      employees: n(p, "fullTimeEmployees"),
      ceoName: s(p, "ceo") || s(ceo, "name"),
      cfoName: s(cfo, "name"),
      price: n(q, "price") ?? n(p, "price"),
      changePct: n(q, "changesPercentage"),
      marketCap: n(q, "marketCap") ?? n(p, "mktCap") ?? n(m, "marketCap"),
      fiscal: s(inc, "calendarYear") || s(inc, "date")?.slice(0, 4),
      revenue: n(inc, "revenue"),
      netIncome: n(inc, "netIncome"),
      eps: n(inc, "eps") ?? n(q, "eps"),
      gross: n(r, "grossProfitMargin") ?? (n(inc, "grossProfit") !== null && n(inc, "revenue") ? n(inc, "grossProfit")! / n(inc, "revenue")! : null),
      operating: n(r, "operatingProfitMargin") ?? (n(inc, "operatingIncome") !== null && n(inc, "revenue") ? n(inc, "operatingIncome")! / n(inc, "revenue")! : null),
      netMargin: n(r, "netProfitMargin") ?? (n(inc, "netIncome") !== null && n(inc, "revenue") ? n(inc, "netIncome")! / n(inc, "revenue")! : null),
      roic: n(m, "roic") ?? n(r, "returnOnCapitalEmployed"),
      ocf: n(cf, "operatingCashFlow"),
      fcf: n(cf, "freeCashFlow"),
      capex: n(cf, "capitalExpenditure"),
      fcfMargin: n(cf, "freeCashFlow") !== null && n(inc, "revenue") ? n(cf, "freeCashFlow")! / n(inc, "revenue")! : null,
      cash: n(bs, "cashAndCashEquivalents") ?? n(bs, "cashAndShortTermInvestments"),
      debt: n(bs, "totalDebt"),
      netDebt: n(bs, "netDebt"),
      currentAssets: n(bs, "totalCurrentAssets"),
      currentLiab: n(bs, "totalCurrentLiabilities"),
      currentRatio: n(r, "currentRatio") ?? n(m, "currentRatio"),
      debtEbitda: n(m, "netDebtToEBITDA") ?? n(r, "netDebtToEBITDA"),
      pe: n(m, "peRatio") ?? n(r, "priceEarningsRatio") ?? n(q, "pe"),
      fwdPe: n(m, "forwardPE") ?? n(r, "forwardPE"),
      evEbitda: n(m, "evToEBITDA") ?? n(m, "enterpriseValueOverEBITDA"),
      ps: n(m, "priceToSalesRatio") ?? n(r, "priceToSalesRatio"),
      pb: n(m, "pbRatio") ?? n(r, "priceToBookRatio"),
      fcfYield: n(m, "freeCashFlowYield") ?? n(r, "freeCashFlowYield"),
      peRange: rangeOf(peHist),
      buybacks: n(cf, "commonStockRepurchased"),
      dividends: n(cf, "dividendsPaid"),
      acquisitions: n(cf, "acquisitionsNet"),
      debtIssue: n(cf, "debtRepayment"),
      revPts,
      fcfPts,
      ocfPts,
      epsPts,
      yoy: yoy(revVals),
      cagr: cagr(revVals),
      surprises: pack.surprises.slice(0, 6),
      latestFilings,
      news: pack.news,
      fetchedAt: pack.fetchedAt,
      errors: pack.errors,
      status: liveFeeds >= 5 ? "live" : liveFeeds >= 1 ? "partial" : "dark",
    };
  }, [pack]);

  const scrollTo = (id: string) => {
    setRail(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (halted) {
    return (
      <div className="fundamental-desk min-h-[70vh] flex items-center justify-center p-8 text-center">
        <p className="fr-kicker">Research halt</p>
        <p className="fr-muted mt-3 max-w-md">{haltReason || "Fundamental modules paused."}</p>
      </div>
    );
  }

  const srcStamp = model
    ? `FMP · ${new Date(model.fetchedAt).toLocaleString()}`
    : loading
      ? "Loading feed…"
      : "No feed";

  return (
    <div className="fundamental-desk min-h-[80vh] px-5 lg:px-8 py-5">
      <header className="flex flex-wrap items-end justify-between gap-4 mb-5 border-b border-white/10 pb-4">
        <div>
          <p className="fr-kicker">ClearPath Fundamental</p>
          <h1 className="text-2xl md:text-[28px] font-semibold tracking-tight mt-1" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            Equity research workstation
          </h1>
          <p className="fr-muted text-sm mt-1 max-w-xl">
            What is this business, how does it earn, how does cash move, and how is the market pricing it — measurements only.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const next = query.trim().toUpperCase();
              if (next) setSymbol(next);
            }}
          >
            <label className="fr-stamp block mb-1">Company search</label>
            <input className="fr-search" value={query} onChange={(e) => setQuery(e.target.value.toUpperCase())} placeholder="NVDA" />
          </form>
          <div>
            <div className="fr-stamp mb-1">Data status</div>
            <div className={`fr-status ${model?.status === "live" ? "is-live" : model?.status === "partial" ? "is-partial" : "is-dark"}`}>
              {loading ? "Loading" : model?.status === "live" ? "Live filings feed" : model?.status === "partial" ? "Partial feed" : "Unavailable"}
            </div>
          </div>
        </div>
      </header>

      <nav className="fr-rail mb-4" aria-label="Research sections">
        {RAIL.map((item) => (
          <button key={item.id} type="button" className={rail === item.id ? "is-active" : ""} onClick={() => scrollTo(item.id)}>
            {item.label}
          </button>
        ))}
      </nav>

      <div className="fr-grid">
        <Bento id="identity" title="Company identity" source={srcStamp} className="fr-bento--hero fr-span-12" onExpand={() => setExpanded({ title: "Company identity", body: <p className="text-sm leading-relaxed text-[#d7cfc4]">{model?.description || "Company description unavailable from the current feed."}</p> })}>
          <div className="flex flex-wrap gap-8 items-start">
            {model?.image ? (
              <img src={model.image} alt="" className="w-14 h-14 object-contain bg-white/90 p-1" />
            ) : (
              <div className="w-14 h-14 border border-white/10 flex items-center justify-center fr-empty">Mark</div>
            )}
            <div className="flex-1 min-w-[240px]">
              <div className="text-4xl md:text-5xl leading-none" style={{ fontFamily: "Georgia, serif" }}>{model?.name || symbol}</div>
              <div className="fr-mono text-[11px] tracking-[0.18em] uppercase text-[#9a9186] mt-2">
                {[model?.ticker, model?.exchange, model?.sector, model?.industry].filter(Boolean).join(" · ") || "Identity unavailable"}
              </div>
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  ["Business", "business"],
                  ["Financials", "financials"],
                  ["Valuation", "valuation"],
                  ["Filings", "filings"],
                ].map(([label, id]) => (
                  <button key={id} type="button" className="fr-jump" onClick={() => scrollTo(id)}>{label}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-3 min-w-[280px]">
              <div>
                <div className="fr-label">Price</div>
                <div className="fr-primary">{formatPrice(model?.price ?? null)}</div>
                <div className="fr-mono text-sm" style={{ color: (model?.changePct ?? 0) >= 0 ? "var(--fr-up)" : "var(--fr-down)" }}>
                  {model?.changePct == null ? "—" : `${model.changePct >= 0 ? "+" : ""}${model.changePct.toFixed(2)}%`}
                </div>
              </div>
              <div>
                <div className="fr-label">Market cap</div>
                <div className="fr-primary text-[26px]">{formatMoney(model?.marketCap ?? null, 2)}</div>
              </div>
              <div>
                <div className="fr-label">Fiscal year</div>
                <div className="fr-val">{model?.fiscal ? `FY${model.fiscal}` : "—"}</div>
              </div>
              <div>
                <div className="fr-label">Employees</div>
                <div className="fr-val">{model?.employees ? model.employees.toLocaleString() : "—"}</div>
              </div>
            </div>
          </div>
        </Bento>

        <Bento id="business" title="Business model" source={srcStamp} className="fr-span-4" onExpand={() => setExpanded({ title: "Business model", body: <p className="text-sm leading-relaxed">{model?.description || "No sourced business description."}</p> })}>
          <SegmentTree name={model?.name || symbol} segments={[]} />
          <p className="fr-empty mt-3">Revenue composition requires a product-segment feed. Showing identity only.</p>
          <p className="text-[12px] text-[#cfc6ba] mt-3 line-clamp-4 leading-relaxed">{model?.description || "Description unavailable."}</p>
        </Bento>

        <Bento title="Company snapshot" source={srcStamp} className="fr-span-4">
          <MetricRow label="Revenue" value={formatMoney(model?.revenue ?? null)} />
          <MetricRow label="Earnings" value={formatMoney(model?.netIncome ?? null)} />
          <MetricRow label="Net margin" value={formatPct(model?.netMargin ?? null)} />
          <MetricRow label="Employees" value={model?.employees ? model.employees.toLocaleString() : "—"} />
        </Bento>

        <Bento id="valuation" title="Valuation" source={srcStamp} className="fr-span-4" onExpand={() => setExpanded({ title: "Valuation", body: (
          <div>
            <MetricRow label="P/E" value={formatRatio(model?.pe ?? null)} />
            <MetricRow label="Forward P/E" value={formatRatio(model?.fwdPe ?? null)} />
            <MetricRow label="EV / EBITDA" value={formatRatio(model?.evEbitda ?? null)} />
            <MetricRow label="P/S" value={formatRatio(model?.ps ?? null)} />
            <MetricRow label="P/B" value={formatRatio(model?.pb ?? null)} />
            <MetricRow label="FCF yield" value={formatPct(model?.fcfYield ?? null)} />
          </div>
        ) })}>
          <div className="fr-primary text-[26px] mb-2">{formatRatio(model?.pe ?? null)} <span className="fr-label">P/E</span></div>
          <MetricRow label="Forward P/E" value={formatRatio(model?.fwdPe ?? null)} />
          <MetricRow label="EV / EBITDA" value={formatRatio(model?.evEbitda ?? null)} />
          <MetricRow label="P/S" value={formatRatio(model?.ps ?? null)} />
          <MetricRow label="P/B" value={formatRatio(model?.pb ?? null)} />
          <MetricRow label="FCF yield" value={formatPct(model?.fcfYield ?? null)} />
          <div className="fr-label mt-4">Historical P/E range</div>
          {model?.peRange ? (
            <RangeTrack low={model.peRange.low} high={model.peRange.high} current={model.peRange.current} />
          ) : (
            <div className="fr-empty mt-2">Range unavailable</div>
          )}
          <div className="fr-label mt-4">Peer comparison</div>
          <div className="fr-empty mt-1">Peer tape not on this feed. No estimated averages.</div>
        </Bento>

        <Bento id="financials" title="Revenue engine" source={srcStamp} className="fr-span-5" onExpand={() => setExpanded({ title: "Revenue", body: <MetricRow label="Latest revenue" value={formatMoney(model?.revenue ?? null)} /> })}>
          <div className="fr-primary mb-1">{formatMoney(model?.revenue ?? null)}</div>
          <Sparkline points={model?.revPts || []} />
          <YearLabels points={model?.revPts || []} />
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div><div className="fr-label">YoY</div><div className="fr-val">{formatPct(model?.yoy ?? null)}</div></div>
            <div><div className="fr-label">Multi-year CAGR</div><div className="fr-val">{formatPct(model?.cagr ?? null)}</div></div>
            <div><div className="fr-label">Latest</div><div className="fr-val">{formatMoney(model?.revenue ?? null)}</div></div>
          </div>
        </Bento>

        <Bento title="Growth" source={srcStamp} className="fr-span-3">
          <MetricRow label="Revenue YoY" value={formatPct(model?.yoy ?? null)} />
          <MetricRow label="CAGR (reported years)" value={formatPct(model?.cagr ?? null)} />
          <MetricRow label="Segment growth" value="—" />
          <p className="fr-empty mt-3">Segment growth waits on product-mix filings.</p>
        </Bento>

        <Bento title="Profitability" source={srcStamp} className="fr-span-4">
          <MarginBar label="Gross margin" value={model?.gross ?? null} />
          <MarginBar label="Operating margin" value={model?.operating ?? null} />
          <MarginBar label="Net margin" value={model?.netMargin ?? null} />
          <MetricRow label="ROIC" value={formatPct(model?.roic ?? null)} />
        </Bento>

        <Bento title="Cash flow" source={srcStamp} className="fr-span-5">
          <div className="grid grid-cols-2 gap-3 mb-2">
            <div><div className="fr-label">Operating cash flow</div><div className="fr-primary text-[22px]">{formatMoney(model?.ocf ?? null)}</div></div>
            <div><div className="fr-label">Free cash flow</div><div className="fr-primary text-[22px]">{formatMoney(model?.fcf ?? null)}</div></div>
            <div><div className="fr-label">CapEx</div><div className="fr-val">{formatMoney(model?.capex ?? null)}</div></div>
            <div><div className="fr-label">FCF margin</div><div className="fr-val">{formatPct(model?.fcfMargin ?? null)}</div></div>
          </div>
          <Sparkline points={model?.fcfPts || []} />
          <YearLabels points={model?.fcfPts || []} />
        </Bento>

        <Bento title="Balance sheet" source={srcStamp} className="fr-span-4">
          <MetricRow label="Cash" value={formatMoney(model?.cash ?? null)} />
          <MetricRow label="Total debt" value={formatMoney(model?.debt ?? null)} />
          <MetricRow label="Net debt" value={formatMoney(model?.netDebt ?? null)} />
          <MetricRow label="Current assets" value={formatMoney(model?.currentAssets ?? null)} />
          <MetricRow label="Current liabilities" value={formatMoney(model?.currentLiab ?? null)} />
          <MetricRow label="Debt / EBITDA" value={formatRatio(model?.debtEbitda ?? null, 2)} />
          <MetricRow label="Current ratio" value={formatRatio(model?.currentRatio ?? null, 2)} />
          <Sparkline points={series(pack?.balance || [], "totalDebt")} />
        </Bento>

        <Bento title="Capital allocation" source={srcStamp} className="fr-span-3">
          <MetricRow label="Buybacks" value={formatMoney(model?.buybacks ?? null)} />
          <MetricRow label="Dividends" value={formatMoney(model?.dividends ?? null)} />
          <MetricRow label="CapEx" value={formatMoney(model?.capex ?? null)} />
          <MetricRow label="Acquisitions" value={formatMoney(model?.acquisitions ?? null)} />
          <MetricRow label="Debt issuance / repay" value={formatMoney(model?.debtIssue ?? null)} />
          <Sparkline points={series(pack?.cash || [], "commonStockRepurchased")} color="#8faf86" />
        </Bento>

        <Bento id="earnings" title="Earnings" source={srcStamp} className="fr-span-5">
          <div className="fr-label mb-1">Reported EPS</div>
          <Sparkline points={model?.epsPts || []} />
          <YearLabels points={model?.epsPts || []} />
          <div className="fr-label mt-3">Actual vs estimate</div>
          {model?.surprises?.length ? (
            <div className="space-y-1 mt-1">
              {model.surprises.slice(0, 4).map((row, i) => (
                <div key={i} className="fr-row">
                  <span className="fr-label">{s(row, "date") || "—"}</span>
                  <span className="fr-val">A {formatRatio(n(row, "actualEarningResult"), 2)} · E {formatRatio(n(row, "estimatedEarningResult"), 2)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="fr-empty mt-2">Estimate history unavailable</div>
          )}
        </Bento>

        <Bento id="industry" title="Industry / peers" source={srcStamp} className="fr-span-12">
          <table className="fr-table">
            <thead>
              <tr>
                <th>Measure</th>
                <th>{model?.ticker || "Company"}</th>
                <th>Peer 2</th>
                <th>Peer 3</th>
                <th>Peer 4</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Revenue growth", formatPct(model?.yoy ?? null)],
                ["Gross margin", formatPct(model?.gross ?? null)],
                ["ROIC", formatPct(model?.roic ?? null)],
                ["P/E", formatRatio(model?.pe ?? null)],
                ["EV/EBITDA", formatRatio(model?.evEbitda ?? null)],
                ["FCF yield", formatPct(model?.fcfYield ?? null)],
              ].map(([label, val]) => (
                <tr key={label}>
                  <td>{label}</td>
                  <td>{val}</td>
                  <td className="fr-empty">—</td>
                  <td className="fr-empty">—</td>
                  <td className="fr-empty">—</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="fr-empty mt-3">Peer identifiers are not on the current allowlisted FMP routes. Company column uses this issuer’s reported figures only.</p>
        </Bento>

        <Bento title="Geographic exposure" source={srcStamp} className="fr-span-4">
          {["North America", "Asia", "Europe", "Other"].map((region) => (
            <div key={region} className="mb-3">
              <div className="fr-row" style={{ border: 0, paddingBottom: 4 }}>
                <span className="fr-label">{region}</span>
                <span className="fr-empty">—</span>
              </div>
              <div className="fr-bar-track"><div className="fr-bar-fill" style={{ width: "18%", opacity: 0.22 }} /></div>
            </div>
          ))}
          <p className="fr-empty">Geographic mix is not in the current statement feed.</p>
        </Bento>

        <Bento id="macro" title="Macro exposure" source={srcStamp} className="fr-span-4">
          {["Interest rates", "Currency", "Inflation", "GDP", "Commodities"].map((factor) => (
            <div className="fr-row" key={factor}>
              <span className="fr-label">{factor}</span>
              <span className="fr-empty">Not documented</span>
            </div>
          ))}
          <p className="fr-empty mt-3">No inferred risk scores. This card stays empty until a sourced mapping exists.</p>
        </Bento>

        <Bento title="Risk factors" source={srcStamp} className="fr-span-4">
          <MetricRow label="Debt" value={formatMoney(model?.debt ?? null)} />
          <MetricRow label="Customer concentration" value="—" />
          <MetricRow label="Geographic concentration" value="—" />
          <MetricRow label="Cyclical revenue" value="—" />
          <MetricRow label="Currency exposure" value="—" />
          <MetricRow label="Regulatory exposure" value="See filings" />
          <p className="fr-empty mt-2">Concentration and cyclicality require 10-K segment notes. Not estimated here.</p>
        </Bento>

        <Bento id="filings" title="Filings" source={srcStamp} className="fr-span-4">
          <div className="grid grid-cols-2 gap-3">
            {(model?.latestFilings || []).map((f) => (
              <div key={f.type} className="border border-white/10 p-3">
                <div className="fr-label">{f.type}</div>
                <div className="fr-val mt-1">{f.date ? f.date.slice(0, 10) : "—"}</div>
                {f.link ? (
                  <a href={f.link} target="_blank" rel="noreferrer" className="fr-jump inline-block mt-2">Read filing</a>
                ) : (
                  <div className="fr-empty mt-2">No link</div>
                )}
              </div>
            ))}
          </div>
        </Bento>

        <Bento id="news" title="Company news" source="Filtered live wire · not advice" className="fr-span-5">
          {model?.news?.length ? (
            <ul className="space-y-3">
              {model.news.map((item) => (
                <li key={item.title}>
                  <div className="fr-stamp">{item.pubDate ? new Date(item.pubDate).toLocaleString() : "—"} · {item.category || item.source}</div>
                  {item.link ? (
                    <a href={item.link} target="_blank" rel="noreferrer" className="text-sm text-[#f3ece2] hover:underline">{item.title}</a>
                  ) : (
                    <div className="text-sm">{item.title}</div>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div>
              <div className="space-y-3">
                {["Earnings", "Company", "Regulatory"].map((tag) => (
                  <div key={tag} className="border-b border-white/5 pb-2">
                    <div className="fr-stamp">{tag}</div>
                    <div className="fr-empty mt-1">No matching headline on the live wire</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Bento>

        <Bento title="Management" source={srcStamp} className="fr-span-3">
          <MetricRow label="CEO" value={model?.ceoName || "—"} />
          <MetricRow label="CFO" value={model?.cfoName || "—"} />
          <div className="fr-label mt-3">Latest commentary</div>
          <p className="fr-empty mt-1">No unsourced quotations. Open a filing for management’s own words.</p>
        </Bento>
      </div>

      {expanded ? (
        <div className="fr-overlay" role="dialog" aria-modal="true" aria-label={expanded.title}>
          <div className="fr-overlay-card">
            <div className="flex justify-between items-center mb-4">
              <h2 className="fr-bento-title">{expanded.title}</h2>
              <button type="button" className="fr-expand" onClick={() => setExpanded(null)}><X size={14} /></button>
            </div>
            {expanded.body}
          </div>
        </div>
      ) : null}
    </div>
  );
}
