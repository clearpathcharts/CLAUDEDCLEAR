// /src/components/encyclopedia/PoliticalErasView.tsx
import React, { useState, useMemo } from 'react';
import { 
  Building2, TrendingUp, ShieldCheck, HelpCircle, Info, Landmark, 
  Activity, ArrowDownRight, ArrowUpRight, Scale, RefreshCw, BarChart2,
  Lock, AlertTriangle, Layers, DollarSign, Shuffle, Zap, Sliders, Play, RotateCcw
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  CartesianGrid, Legend, ReferenceLine, ComposedChart, Line
} from 'recharts';

interface PoliticalErasViewProps {
  selectFileNode?: (fileName: string) => void;
  pedagogyMode?: 'kids' | 'highschool' | 'college' | 'researcher';
  activeLanguage?: 'EN' | 'ZH' | 'ES' | 'PT' | 'KO';
}

// 1. NON-BIASED HISTORICAL METRICS: Cumulative S&P performance & Party In Office
// Includes S&P return, DXY average, and structural debt expansion indicators.
const HISTORICAL_ERA_SERIES = [
  { year: 1969, label: 'Nixon 1', spReturn: 100, dxy: 120.2, party: 'Republican', m2Billions: 580 },
  { year: 1971, label: 'Nixon (Gold Break)', spReturn: 114, dxy: 111.8, party: 'Republican', m2Billions: 692 },
  { year: 1974, label: 'Ford Crisis', spReturn: 92, dxy: 98.4, party: 'Republican', m2Billions: 900 },
  { year: 1977, label: 'Jimmy Carter', spReturn: 135, dxy: 94.2, party: 'Democrat', m2Billions: 1150 },
  { year: 1979, label: 'Carter (Volcker Spike)', spReturn: 148, dxy: 88.1, party: 'Democrat', m2Billions: 1400 },
  { year: 1981, label: 'Reaganomics 1', spReturn: 172, dxy: 104.5, party: 'Republican', m2Billions: 1650 },
  { year: 1985, label: 'Reagan (Plaza Accord)', spReturn: 284, dxy: 140.2, party: 'Republican', m2Billions: 2400 },
  { year: 1989, label: 'Bush Senior', spReturn: 412, dxy: 92.5, party: 'Republican', m2Billions: 2950 },
  { year: 1993, label: 'Clinton 1', spReturn: 520, dxy: 93.1, party: 'Democrat', m2Billions: 3410 },
  { year: 1997, label: 'Clinton (Dot-Com Boom)', spReturn: 980, dxy: 100.8, party: 'Democrat', m2Billions: 3880 },
  { year: 2001, label: 'Bush Junior 1', spReturn: 1120, dxy: 114.2, party: 'Republican', m2Billions: 4950 },
  { year: 2005, label: 'Bush Jr (Housing Bubble)', spReturn: 1210, dxy: 88.3, party: 'Republican', m2Billions: 6410 },
  { year: 2008, label: 'Lehman Crash', spReturn: 880, dxy: 82.1, party: 'Republican', m2Billions: 7800 },
  { year: 2009, label: 'Obama (QE1)', spReturn: 1050, dxy: 84.5, party: 'Democrat', m2Billions: 8300 },
  { year: 2013, label: 'Obama 2 (QE3)', spReturn: 1650, dxy: 80.7, party: 'Democrat', m2Billions: 10400 },
  { year: 2017, label: 'Trump 1', spReturn: 2280, dxy: 96.2, party: 'Republican', m2Billions: 13200 },
  { year: 2020, label: 'Trump (COVID helicopter)', spReturn: 3230, dxy: 97.4, party: 'Republican', m2Billions: 18405 },
  { year: 2021, label: 'Biden 1', spReturn: 3804, dxy: 95.8, party: 'Democrat', m2Billions: 21100 },
  { year: 2024, label: 'Biden Rates Peak', spReturn: 5400, dxy: 103.5, party: 'Democrat', m2Billions: 20850 },
  { year: 2026, label: 'Modern Frontier', spReturn: 6150, dxy: 103.8, party: 'Democrat', m2Billions: 21150 }
];

// Chronology detail cards on "Does the dollar ever benefit?"
const DOLLAR_BENEFIT_ARCHIVE = [
  {
    eraId: "nixon_carter",
    years: "1969 - 1981",
    title: "Nixon to Carter: The Great De-Anchoring & Stagflation Drain",
    didItBenefit: "No - Systematic Depreciation",
    reasons: "The suspension of the gold standard in 1971 destroyed global currency custody. Foreign trust collapsed. Simultaneously, the Federal Reserve under Arthur Burns aggressively printed to fund budget deficits, resulting in two massive energy spikes (1973, 1979) and collapsing the DXY in a historic bear slide.",
    benefitTrigger: "None, until Paul Volcker was appointed to the Fed and forcefully hiked the funds discount rate to 20%, suffocating inflation, reclaiming trust at a brutal cost of deep global recessions."
  },
  {
    eraId: "reagan",
    years: "1981 - 1989",
    title: "Reagan Era: The Plaza Accord & Sovereign Devaluation",
    didItBenefit: "Yes (Initially), then Controlled Devaluation",
    reasons: "High real interest rates (Volcker's hikes legacy) and a flood of international defensive cash into high-yielding US treasuries triggered a massive rally. By 1985, the DXY reached a record peak of 164. However, this high dollar decimated American manufacturing exports. In September 1985, the G5 nations signed the Plaza Accord, actively coordinating to depreciate the USD by 40% over two years.",
    benefitTrigger: "Capital flows into high US treasury yields, but ended in a controlled multi-national devaluation alliance."
  },
  {
    eraId: "bush_sr",
    years: "1989 - 1993",
    title: "Bush Senior: Gulf War Shock & S&L Cleansing",
    didItBenefit: "Stable / Sideways",
    reasons: "The collapse of the Soviet Union created a brief global 'peace dividend' expectation. However, the costly Savings and Loan banking collapse and the Gulf War oil price shock forced the Fed to cut interest rates continuously, keeping the dollar floating sideways and slightly downwards inside global currency pools.",
    benefitTrigger: "Brief safe-haven bidding during regional geopolitical friction points, but dragged down by domestic bank cleanups."
  },
  {
    eraId: "clinton",
    years: "1993 - 2001",
    title: "Clinton Era: Dot-Com Boom & Structural Surplus",
    didItBenefit: "Yes - The Strong Dollar Era",
    reasons: "A rare convergence. Explosive productivity from the commercialization of the internet attracted trillions of foreign venture investments into US tech. Concurrently, bipartisan fiscal constraint achieved genuine, historic US federal budget surpluses, allowing foreign central banks to hoard dollars with complete confidence.",
    benefitTrigger: "Massive foreign direct investment into computer tech combined with actual fiscal balance—a rare dollar golden age."
  },
  {
    eraId: "bush_jr",
    years: "2001 - 2009",
    title: "Bush Junior: Subprime Ruptions & War Deficits",
    didItBenefit: "No - Sustained Decline",
    reasons: "A decade of relentless structural deterioration. Post-9/11 rate cuts to 1.0% stoked a massive residential housing mortgage bubble. Deficits expanded massively to finance prolonged wars in Iraq and Afghanistan. The decade culminated in the total collapse of the banking system in 2008 with the subprime Lehman waterfall.",
    benefitTrigger: "None. The dollar underwent an uninterrupted 8-year bear market, only spiking briefly in late 2008 during a universal desperate panic rush to liquidate assets to settle USD-denominated bank debts."
  },
  {
    eraId: "obama",
    years: "2009 - 2017",
    title: "Obama Era: Quantitative Easing & Basel Scarcity",
    didItBenefit: "Yes (Mid-Term Run) - Divergence Boom",
    reasons: "The Federal Reserve deployed the historic Quantitative Easing (QE) framework, creating trillions of digital dollars to buy toxic bank mortgage bonds. While many predicted hyperinflation, the dollar actually skyrocketed in 2014-2015. Why? Because the Eurozone collapsed into a sovereign debt crisis, and US fracking technology turned America into a net energy producer.",
    benefitTrigger: "Systemic divergence—when the rest of the world (Europe/Japan) looked even weaker and printed even faster, capital fled back to the USD."
  },
  {
    eraId: "trump_biden",
    years: "2017 - Present",
    title: "Trump & Biden: Helicopter Liquidity & Rates Weaponization",
    didItBenefit: "Highly Volatile Waves",
    reasons: "A total monetary playground. The COVID panic of 2020 triggered $5 Trillion of combined helicopter spending across both administrations, causing consumer prices to inflate uncontrollably (peak 9.1%). In response, the Fed launched the fastest rate hikes in 40 years, lifting rates to 5.25%. This created a massive relative yield advantage, pumping DXY to 20-year highs but wrecking foreign sovereign treasury portfolios.",
    benefitTrigger: "Relentless yield differentials. When the Fed hikes significantly higher and faster than Europe or Japan, global liquidity is mathematically sucked back into US registers."
  }
];

export default function PoliticalErasView({ selectFileNode, pedagogyMode = 'college', activeLanguage = 'EN' }: PoliticalErasViewProps) {
  const [activeTab, setActiveTab] = useState<'presidents' | 'wedges' | 'observatory' | 'simulator' | 'carry'>('presidents');
  const [selectedDollarEra, setSelectedDollarEra] = useState<string>("clinton");
  const [activeWedgeStep, setActiveWedgeStep] = useState<number>(0);
  const [isolateM2, setIslateM2] = useState<boolean>(false);

  // Timeframe Explorer in Wedge Tab
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '1H' | '1D' | '1W' | 'Macro'>('Macro');

  // Simulator Sliders State
  const [deficitSpending, setDeficitSpending] = useState<number>(1500); // $ Billion per year
  const [fedBalanceSheet, setFedBalanceSheet] = useState<number>(1000); // $ Billion per year (QE/QT change)
  const [interestRatesRate, setInterestRatesRate] = useState<number>(4.5); // % Fed Funds Rate
  const [foreignDehoarding, setForeignDehoarding] = useState<number>(30); // % percentage of foreign central bank liquidation

  // Carry Trade Simulation State
  const [carryTradeStep, setCarryTradeStep] = useState<number>(0);
  const [bojRate, setBojRate] = useState<number>(0.0);
  const [usRate, setUsRate] = useState<number>(5.25);
  const [stockBubbleMagnitude, setStockBubbleMagnitude] = useState<number>(100);

  const wedgeSteps = [
    {
      title: "Phase 1: M2 Money Base Influx (Rising Wedge)",
      concept: "The Constant Inflationary Bid",
      mechanics: "Central banks expand the credit ledger. Because there are more paper dollars chasing a finite supply of blue-chip corporate equities (S&P 500 contains companies with real earnings and buybacks), the nominal index is relentlessly bid higher. This forms an ascending wedge channels structure.",
      quote: "It's not that the companies got 10x smarter in 10 years; it's that the currency used to measure them lost 90% of its density."
    },
    {
      title: "Phase 2: Leverage Overheat & Tightening (Falling Wedge Retrace)",
      concept: "The Systemic Squeeze",
      mechanics: "The expansion creates massive pricing bubbles. To cool the CPI index, the Fed begins raising rates and draining core reserves (Quantitative Tightening). Leverage contracts, speculative market makers are purged, and indices retrace inside a tight, falling wedge structure to clean out old debts.",
      quote: "Society tells lies about bubbles. They blame speculators, but bubbles are mathematically manufactured by the rate cycle."
    },
    {
      title: "Phase 3: The Larger Wedge Resurrection (Continuous Extension)",
      concept: "The Sovereign Pivot Loop",
      mechanics: "As higher rates threaten to trigger systemic state defaults (due to astronomical Treasury interest payments) and corporate credit freezes, the central bank is forced to panic and pivot, re-injecting fresh credit liquidity. The index breaks out of the falling wedge, climbing onto an even larger timeframe rising wedge.",
      quote: "The game is structural. To prevent total government bond collapse, credit must expand forever. Thus, the index charts are eternal fractal wedges."
    }
  ];

  const timeframeData = {
    '1M': {
      title: "High-Frequency Arbitrage Wedge",
      desc: "Even on the 1-minute chart, computerized trading algorithms deploy rising and falling wedges. Why? Because the central bank's intraday reserve system continuously handles liquidity clearings. When banking channels need reserves, algorithms tighten the bid-ask matrix, creating a micro-falling wedge retrace before restarting the automated asset accumulation drift.",
      geometry: "Tight 1-minute patterns with volume depletion indicators at the tip of the micro-wedge."
    },
    '1H': {
      title: "Intraday Fed Repo Window Wave",
      desc: "Hourly wedges track the open/close windows of international treasury clearing centers like Euroclear and the Federal Reserve Bank of New York. The 13:00 to 15:30 repo allocations flood or starve primary bond dealers of capital. Dealers compress their market-making spreads, printing distinct hourly consolidations that breakout precisely at reserve distribution hours.",
      geometry: "Hourly wedge tip convergences highly correlated with central bank daily repo announcements and sovereign debt auctions."
    },
    '1D': {
      title: "The Weekly Option Pin Cycle",
      desc: "Daily wedges trace the delta-hedging strategies of major options market-makers. When high-volume options are printed across Nasdaq or S&P 500 triggers, dealers must carry delta hedges by buying or selling futures packages. This mechanical hedging forces the index into a tightening wedge, until options expire, triggering a massive volatility breakout.",
      geometry: "Classic 30-day to 60-day visual consolidation wedge, ending in rapid, violent breakouts."
    },
    '1W': {
      title: "The Medium-Term Macro Rate Cycle",
      desc: "Governed by regular FOMC meetings (every 6 weeks) and quantitative tightening channels. As interest rates step up, leverage is systematically purged across retail and regional banking hubs, causing index prices to bleed downward inside a neat, 6-9 month falling wedge retrace. Once the Fed suggests pause, the next ascending trendline originates.",
      geometry: "Large-scale weekly chart channels tracking major macro economic regime changes (e.g. 2018 QT Squeeze, 2022 Fed rate hike slide)."
    },
    'Macro': {
      title: "The Sovereign Debt Expansion Era",
      desc: "The ultimate 50-year timeframe chart. Beginning with Richard Nixon closing the gold custody window in 1971, the entire nominal tracking index is a colossal, compounding rising wedge. S&P 500 went from 100 to 6000+ because the quantity of dollars expanded by 3,500%. Every historical drop is simply a micro-retrace inside the eternal sovereign fiat dilution trend.",
      geometry: "The grand sovereign fractal. All historical crashes are mathematically minor retraces on the long-term dollar dilution curve."
    }
  };

  // Memoized Systemic Devaluation Calculation
  const simulationResults = useMemo(() => {
    // Basic structural equations modeled from actual fiscal-monetary expansion trends
    // Total simulated money expansion in 10 years (combination of QE and Deficit monetization)
    const annualM2Expansion = (deficitSpending * 0.85) + (fedBalanceSheet > 0 ? fedBalanceSheet : 0);
    const m2Multipler = 1 + (annualM2Expansion * 10) / 21150; // compared to modern M2 base
    
    // S&P Nominal Projected level
    const baselineSP = 6150;
    // Lower corporate tax / rates boost S&P marginally, higher deficit boosts it nominally through liquidity expansion
    const interestRatesImpact = 1 - (interestRatesRate - 4.5) * 0.04;
    const nominalSPProjected = Math.round(baselineSP * m2Multipler * interestRatesImpact);

    // Dollar Purchasing Power relative to 2026 dollar ($1.00 base)
    const annualDevaluationRate = ((annualM2Expansion / 21150) * 100) + (interestRatesRate < 3.0 ? (3.0 - interestRatesRate) : 0) + (foreignDehoarding * 0.4);
    const compoundPurchasingPower = Math.max(0.01, Math.pow(1 - (annualDevaluationRate / 100), 10));

    // Real Value of S&P projected (inflation adjusted)
    const realSPValue = Math.round(nominalSPProjected * compoundPurchasingPower);

    // Real-time classification
    let stateLabel = "";
    let stateDesc = "";
    let systemHealthAlert = "";

    if (annualDevaluationRate > 25) {
      stateLabel = "CRITICAL HYPER-INFLATIONARY MELTDOWN";
      stateDesc = "Speculators scramble to buy any physical asset, stock nominal numbers rise 400%, but cash currency is transformed into kindling. Real purchasing power has been completely annihilated.";
      systemHealthAlert = "State of absolute currency debasement. Both public trust and fiscal systems are collapsing under the interest burden of debt.";
    } else if (annualDevaluationRate > 12) {
      stateLabel = "STAGFLATIONARY DEVALUATION SPIRAL";
      stateDesc = "Nominal stock indexes push upwards into massive rising wedges, giving the illusion of immense wealth. However, when adjusted for actual food, energy, and real estate, you are functionally getting poorer.";
      systemHealthAlert = "Uncontrolled monetization of structural government deficits. Severe middle-class purchasing power depletion.";
    } else if (annualDevaluationRate > 4) {
      stateLabel = "CONTROLLED DEBT MONETIZATION (The Standard Lie)";
      stateDesc = "The sweet-spot engineered by central banks. Soft inflation targets dilute the government's debt slowly while nominal stock markets drift up in an ascending wedge, convincing the public that they are experiencing 'growth'.";
      systemHealthAlert = "Hidden wealth transition: wealth is systematically extracted from savers to debtors and asset owners.";
    } else if (deficitSpending < 300 && fedBalanceSheet < 0 && interestRatesRate > 7) {
      stateLabel = "TOTAL SYSTEMIC DEBT-DEFLATION CRASH";
      stateDesc = "With monetary supply contracting and interest rates high, the massive multi-trillion dollar credit pyramid collapses. Asset prices crash inside a terminal falling wedge as short-sellers buy gold and cash.";
      systemHealthAlert = "High threat of sovereign defaults and severe interbank lockup. The system's high debt cannot handle real interest weights.";
    } else {
      stateLabel = "STRUCTURAL EQUILIBRIUM (Theoretical)";
      stateDesc = "Fiscal discipline forces budget balance. The dollar retains its purchasing power. Nominal stock gains represent true gains in corporate productivity and scientific advancement.";
      systemHealthAlert = "Ideal scenario. Never observed in modern post-1971 central banking as governments are permanently hooked on credit expansion.";
    }

    return {
      nominalSP: nominalSPProjected,
      realSP: realSPValue,
      dollarValue: compoundPurchasingPower.toFixed(3),
      annualDevaluation: annualDevaluationRate.toFixed(1),
      stateLabel,
      stateDesc,
      systemHealthAlert
    };
  }, [deficitSpending, fedBalanceSheet, interestRatesRate, foreignDehoarding]);

  // Carry Trade step details
  const carryTradeSequence = [
    {
      title: "Step 1: Leverage Sinks the Sovereign Yield (Borrow Yen)",
      mechanics: "Global hedge fund managers borrow Japanese Yen (JPY) from Tokyo bank clusters. Because Bank of Japan maintains rates at or near 0%, the borrowing toll is practically zero. Large international players take billions of Yen debt on high leverage.",
      jxyImpact: "JXY under pressure — massive supply of borrowed Yen being created and immediately offered for exchange.",
      dxyImpact: "Neutral.",
      nasdaqImpact: "Calm rising base."
    },
    {
      title: "Step 2: FX Conversion & Capital Flight (Sell Yen, Buy USD)",
      mechanics: "Funds dump their borrowed JPY on the foreign exchange market to receive US Dollars (USD). They deposit USD into high-yielding US Treasury bonds or bank registers, earning a juicy 5.25% interest rate arbitrage spread.",
      jxyImpact: "JXY plunges — capital flees Japan. Currency reaches record lows.",
      dxyImpact: "DXY goes sky-high — aggressive, non-stop bid for US Dollar units.",
      nasdaqImpact: "Liquidity pipelines starting to overflow with collateral."
    },
    {
      title: "Step 3: The Asset Boom Overdrive (Buy US Equities / Nasdaq)",
      mechanics: "Earning 5% is good, but leverage dictates search for higher returns. Money managers pledge their US Treasury collateral to borrow even more USD and buy Nasdaq 100 and S&P 500 tech shares. Tickers surge into an aggressive, sharp **Rising Wedge**.",
      jxyImpact: "JXY remains depressed, completely flatlined.",
      dxyImpact: "DXY stable and high, supporting global asset prices.",
      nasdaqImpact: "Nasdaq reaches overbought records. S&P forms long-duration wedge tip."
    },
    {
      title: "Step 4: The Sovereign Pivot Trigger (BOJ Rate Hike Squeeze)",
      mechanics: "As import inflation wrecks the Japanese domestic economy, the Bank of Japan is forced to raise interest rates to 0.25% / 0.5%. Simultaneously, the US Federal Reserve starts hints of rate cuts. Suddenly, the yield spread collapses.",
      jxyImpact: "JXY begins a violent upward trend. The exchange rate reverses rapidly.",
      dxyImpact: "DXY slides as capital begins fleeing US treasury corridors.",
      nasdaqImpact: "Warning flags flash. Algorithms detect currency trend pivots."
    },
    {
      title: "Step 5: The Carry Unwind Cascade (The Nasdaq Falling Wedge Crash)",
      mechanics: "Borrowers realize their Yen loans are rapidly appreciating in value. Every JXY uptick means their debt is mathematically growing in dollar terms. To survive, they panic and dump Nasdaq stocks and US bonds to get USD, convert them into JPY, and close their loans. The market enters a terrifying **Falling Wedge Retrace**.",
      jxyImpact: "JXY skyrockets — desperate buying of Yen to cover debts.",
      dxyImpact: "DXY experiences massive volatility whipsaws.",
      nasdaqImpact: "Nasdaq cascades 10% to 15% in absolute liquidating waterfalls."
    }
  ];

  // Pedagogical translations
  const pedagogyTranslations = {
    kids: {
      lesson: "Sometimes we think leaders in Washington change the markets by themselves. But actually, the stock market mostly goes up because the government keeps printing more paper money every year!",
      wedge: "Think of stock charts like a big bouncy balloon. The government blows air in, it grows up (rising wedge). They squeeze the air, it shrinks (falling wedge). Then they blow in even more air, making a giant balloon!"
    },
    highschool: {
      lesson: "While politicians claim credit for economic growth, cold financial data proves both parties preside over systematic fiscal expansion. Market cycles are driven by Federal Reserve liquidity injections instead of who sits in the White House.",
      wedge: "Stock indices form wedges because credit expansion fuels steady uptrends. When inflation spikes, the Fed hikes rates to create a cooling down-trend retrace, before printing assets again to trigger a larger uptrend."
    },
    college: {
      lesson: "Macroeconomic consensus indicates that partisan administration changes induce localized sector rotations, but the fundamental long-term trajectory of equities remains locked to aggregate systemic liquidity (M2) and central bank credit expansion metrics.",
      wedge: "Wedge geometry represents the compounding balance of credit creation vs credit destruction. Ascending wedges track long-duration asset inflation. Descending corrective phases represent systematic margin-calls clearing leverage, paving the way for the next macro expansion cycle."
    },
    researcher: {
      lesson: "Sovereign data reveals an absolute convergence of partisan fiscal outcomes. Partisan shifts dictate which corporate sectors exploit rent-seeking privileges, but total asset valuations are fundamentally bound to central bank ledger expansions and global liquidity recycling indexes.",
      wedge: "Fractal wedge dynamics correspond directly to thermodynamic debt cycles. Long-term baseline indexing maps the exponential expansion of fiat liabilities. Corrective falling wedges are engineered collateral contraction vectors designed to purge leverage before systemic refinancing restarts on a higher state balance-sheet tier."
    }
  };

  return (
    <div className="political-eras-layout flex flex-col gap-6 text-white text-left select-text font-sans animate-fadeIn">
      
      {/* MONUMENTAL TITLE BAR */}
      <div className="p-6 md:p-8 bg-gradient-to-br from-[#0c0525] via-[#040816]/98 to-indigo-950/20 border border-indigo-400/30 rounded-[32px] relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <Scale className="w-64 h-64 text-indigo-400" />
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF00C8] animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#00D9FF] font-black">
              CLEAR PATH CHRONICLES // EXPOSING SYSTEMIC MACRO LIES
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
            Partisan Eras, Fractal Wedges & Sovereign Indexes
          </h1>
          <p className="text-zinc-350 text-sm sm:text-base max-w-4xl leading-relaxed">
            Breaking the illusions of market narratives. Learn the real forces that shape world wealth: why Republican and Democrat administrations sit on the exact same debt-compounding conveyor belt, why index charts are mathematically bound to form eternal fractal wedges, and how sovereign currency indexes (DXY, AXY, JXY) govern the global trade engine.
          </p>
        </div>

        {/* PEDAGOGICAL DECK */}
        <div className="bg-[#FF00C8]/5 border border-[#FF00C8]/25 rounded-2xl p-4 mt-6 font-mono text-xs max-w-3xl flex gap-3.5 items-start">
          <Info className="w-5 h-5 text-[#FF00C8] shrink-0 mt-0.5" />
          <div className="space-y-1.5 leading-normal">
            <span className="text-[#FF00C8] font-black uppercase tracking-widest block text-[9px]">SYSTEM PEDAGOGICAL OVERVIEW</span>
            <p className="leading-relaxed font-sans text-sm font-semibold text-zinc-200">
              {pedagogyTranslations[pedagogyMode].lesson}
            </p>
          </div>
        </div>
      </div>

      {/* MASTER SECTIONS TAB SWITCHER */}
      <div className="flex gap-2 p-1.5 bg-[#040816]/90 border border-white/10 rounded-2xl flex-wrap font-mono text-xs md:text-sm">
        <button
          onClick={() => setActiveTab('presidents')}
          className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-center transition-all cursor-pointer ${
            activeTab === 'presidents' 
              ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-450 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          1. Partisan Money & Dollar
        </button>
        <button
          onClick={() => setActiveTab('wedges')}
          className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-center transition-all cursor-pointer ${
            activeTab === 'wedges' 
              ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-450 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          2. The Fractal Wedge Anatomy
        </button>
        <button
          onClick={() => setActiveTab('observatory')}
          className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-center transition-all cursor-pointer ${
            activeTab === 'observatory' 
              ? 'bg-indigo-500/20 border border-indigo-400/40 text-indigo-450 text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          3. DXY, AXY, JXY Indexes
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-center transition-all cursor-pointer ${
            activeTab === 'simulator' 
              ? 'bg-[#FF00C8]/20 border border-[#FF00C8]/40 text-[#FF00C8] shadow-[0_0_15px_rgba(255,0,200,0.2)]' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          4. Devaluation Simulator
        </button>
        <button
          onClick={() => setActiveTab('carry')}
          className={`flex-1 py-3 px-4 rounded-xl font-black uppercase text-center transition-all cursor-pointer ${
            activeTab === 'carry' 
              ? 'bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)]' 
              : 'text-zinc-500 hover:text-zinc-300'
          }`}
        >
          5. Yen Carry Trade Unwind
        </button>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: THE PARTISAN DATA REVOLUTION & DOLLAR HISTORY TRACK */}
      {/* ========================================================= */}
      {activeTab === 'presidents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fadeIn">
          
          {/* THE CHART NODE (8/12) */}
          <div className="lg:col-span-8 bg-black/75 border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-6">
            <div className="flex justify-between items-start flex-wrap gap-4 border-b border-white/5 pb-3">
              <div className="space-y-1 text-left">
                <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase tracking-wider block">THE CLEAR PATH CONTRARIAN GRAPH</span>
                <h3 className="text-white font-black text-xl uppercase tracking-tight">S&P 500 Cumulative returns vs. Partisan control (1969 - 2026)</h3>
                <p className="text-zinc-400 text-xs font-semibold font-sans leading-relaxed">
                  Compare S&P 500 index trajectory mapped against who sat in the office. Observe note: stock returns scale proportionally with the constant expansion of M2 Money supply, independent of republican or democrat party labels.
                </p>
              </div>
              <div className="flex flex-col gap-2 items-end">
                <div className="flex gap-2 font-mono text-[10px]">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-red-950/20 border border-red-500/25 rounded-md text-red-400 font-extrabold">
                    <span className="w-2.5 h-2.5 bg-red-500 rounded-sm" /> Rep
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-950/20 border border-blue-500/25 rounded-md text-blue-400 font-extrabold">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-sm" /> Dem
                  </div>
                </div>
                {/* ISOLATE M2 TOGGLE */}
                <button 
                  onClick={() => setIslateM2(!isolateM2)}
                  className={`px-3 py-1 border font-mono text-[9px] font-black uppercase rounded-lg cursor-pointer transition-all ${
                    isolateM2 
                      ? 'bg-[#00ffff]/10 border-[#00ffff] text-[#00ffff]' 
                      : 'bg-zinc-900 border-white/10 text-zinc-400 hover:text-white'
                  }`}
                >
                  {isolateM2 ? '★ Showing M2 Correlate Node Only' : '• Compare S&P + M2 + DXY'}
                </button>
              </div>
            </div>

            {/* CHART VIEWPORT */}
            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={HISTORICAL_ERA_SERIES} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" />
                  <XAxis dataKey="label" stroke="#777" fontSize={10} angle={-25} textAnchor="end" height={50} />
                  <YAxis yAxisId="left" orientation="left" stroke="#777" fontSize={10} domain={[0, 7000]} label={{ value: 'S&P 500 Returns / M2 Supply Level', angle: -90, position: 'insideLeft', style: { fill: '#777', fontSize: 10, fontWeight: 'bold' } }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#777" fontSize={10} domain={[40, 180]} label={{ value: 'DXY Index Level', angle: 90, position: 'insideRight', style: { fill: '#777', fontSize: 10, fontWeight: 'bold' } }} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#050916', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                    labelStyle={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#00D9FF' }}
                  />
                  <Legend wrapperStyle={{ fontSize: 10, fontFamily: 'monospace' }} />
                  
                  {/* S&P Performance Area */}
                  {!isolateM2 && (
                    <Area 
                      yAxisId="left"
                      name="S&P 500 Cumulative Return" 
                      type="monotone" 
                      dataKey="spReturn" 
                      stroke="#FF00C8" 
                      fill="url(#colorSp)" 
                      strokeWidth={3} 
                    />
                  )}
                  
                  {/* M2 Money Supply Line representing the true denominator */}
                  <Line 
                    yAxisId="left"
                    name="M2 Supply - The Dollar Dilution Base" 
                    type="monotone" 
                    dataKey="m2Billions" 
                    stroke="#00ffff" 
                    strokeWidth={3}
                    dot={{ fill: '#00ffff', strokeWidth: 1 }}
                  />

                  {/* DXY Index Overlay */}
                  {!isolateM2 && (
                    <Line 
                      yAxisId="right"
                      name="US Dollar Index DXY Level" 
                      type="monotone" 
                      dataKey="dxy" 
                      stroke="#EAB308" 
                      strokeWidth={2}
                      dot={{ fill: '#EAB308', strokeWidth: 1 }}
                    />
                  )}

                  {/* Definitions of colors gradient */}
                  <defs>
                    <linearGradient id="colorSp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF00C8" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#FF00C8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* INTUITIVE REVELATION CALLOUT */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/25 rounded-2xl flex items-start gap-3.5">
              <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="space-y-1 font-mono text-xs">
                <span className="text-white font-extrabold uppercase block text-[9px] tracking-widest text-[#00D9FF]">UNVEILING THE MATHEMATICAL ILLUSION: THE LIES OF PARTY COMPETENCY</span>
                <p className="text-zinc-300 font-sans leading-relaxed text-sm">
                  Political teams claim that they 'grow' the economy, but the master chart proves otherwise: the S&P 500 is directly correlated with the <b>parabolic expansion of the monetary supply base (M2)</b>. When more paper units are created by the Federal Reserve, nominal equity index tickers rise. <b>Both teams continuously expand the national debt ledger (Republicans via massive corporate tax cuts and military budgets; Democrats via extensive helicopter stimulus and welfare injections).</b> It is not a Republican or Democratic miracle—it is the direct devaluation of the currency unit.
                </p>
              </div>
            </div>
          </div>

          {/* THE DOLLAR HISTORY ARCHIVE & CHRONOLOGY PANEL (4/12) */}
          <div className="lg:col-span-4 bg-[#030612]/98 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-5 text-left">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#FF00C8] font-bold uppercase tracking-wider block">DOLLAR OBSOLVES SERIES</span>
              <h3 className="text-white font-black text-sm uppercase tracking-tight">Did the dollar ever actually benefit from anything?</h3>
              <p className="text-zinc-450 text-[11px] leading-relaxed font-sans font-medium">
                Has the U.S. central bank ever actually supported dollar purchasing power? Read the historical administration report profiles.
              </p>
            </div>

            {/* ACCORDION TRIGGER */}
            <div className="relative">
              <select
                value={selectedDollarEra}
                onChange={(e) => setSelectedDollarEra(e.target.value)}
                className="w-full bg-[#050916] border border-indigo-500/35 focus:border-[#FF00C8] focus:ring-1 focus:ring-[#FF00C8] rounded-xl py-3 px-4 text-xs text-white uppercase font-mono font-black select-none cursor-pointer focus:outline-none"
              >
                {DOLLAR_BENEFIT_ARCHIVE.map((db) => (
                  <option key={db.eraId} value={db.eraId} className="bg-slate-950 text-white font-mono uppercase text-xs">
                    {db.years} - {db.title.slice(0, 32)}...
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-3.5 pointer-events-none text-zinc-400 text-xs">▼</div>
            </div>

            {/* DETAILED RESULTS FOR SELECT ERA */}
            {(() => {
              const activeDb = DOLLAR_BENEFIT_ARCHIVE.find(x => x.eraId === selectedDollarEra) || DOLLAR_BENEFIT_ARCHIVE[0];
              return (
                <div className="p-4 bg-black/60 border border-white/5 rounded-2xl space-y-4 text-xs font-mono animate-slideDown">
                  <div className="flex justify-between border-b border-white/5 pb-2 text-[10.5px]">
                    <span className="text-zinc-500 uppercase font-black font-mono">HISTORIC PERIOD</span>
                    <span className="text-[#00D9FF] font-black">{activeDb.years}</span>
                  </div>

                  <div className="space-y-1 text-left">
                    <span className="text-zinc-500 uppercase font-black text-[9px] block">SYSTEM VALUE STATUS:</span>
                    <span className={`font-black text-sm uppercase block ${activeDb.didItBenefit.includes('Yes') ? 'text-emerald-400' : 'text-red-400'}`}>
                      {activeDb.didItBenefit}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white/[0.012] border border-white/5 rounded-xl text-left space-y-2 leading-relaxed">
                    <span className="text-[9px] text-[#FF00C8] font-black block uppercase">THE SYSTEMIC REALITY</span>
                    <p className="text-zinc-350 text-[11px] font-sans font-semibold">
                      {activeDb.reasons}
                    </p>
                  </div>

                  <div className="p-3 bg-[#EAB308]/5 border border-[#EAB308]/20 rounded-xl text-left font-sans text-zinc-350 leading-relaxed text-[11px]">
                    <span className="font-mono text-[9px] text-[#EAB308] font-black uppercase tracking-wider block mb-1">TRUE VALUE CATALYST</span>
                    <p className="font-semibold text-zinc-400">{activeDb.benefitTrigger}</p>
                  </div>
                </div>
              );
            })()}

            {/* SYSTEMIC DEBUT REVELATION BLOCK */}
            <div className="p-4 bg-red-950/15 border border-red-500/20 rounded-2xl flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 text-xs font-mono text-red-400">
                <span className="font-black block uppercase text-[9px] tracking-widest">IS THE GAME RIGGED?</span>
                <p className="font-sans font-semibold leading-relaxed text-zinc-400">
                  It's not rigged by a backroom cabal. It is "rigged" by the compounding mechanics of <b>sovereign debt mathematics</b>. A government with $35 Trillion in debt can never allow currency to grow stronger or interest rates to stay high forever, as they would instantly go bankrupt. The currency index is actively inflated, forcing people to take risk in stocks simply to survive monetary devaluation.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: THE FRACTAL WEDGE GEOMETRY CHRONICLES */}
      {/* ========================================================= */}
      {activeTab === 'wedges' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fadeIn">
          
          {/* THE STORY DEC (7/12) */}
          <div className="lg:col-span-7 bg-[#030612]/98 border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-6">
            <div className="space-y-2">
              <span className="font-mono text-[9px] text-[#FF00C8] font-black uppercase tracking-[0.2em] block">THE RECURRING STOCK CHART ANATOMY</span>
              <h3 className="text-white font-black text-xl uppercase tracking-tight">WHY INDICES RELENTLESSLY FORM FRACTAL WEDGES</h3>
              <p className="text-zinc-450 text-xs font-sans font-medium leading-relaxed">
                Ever look at the Nasdaq, Dow Jones, or S&P 500 and notice their shape? Why is it that the market climbs in a wedge (rising wedge up), undergoes a steep descending corrective retrace (falling wedge down), then continues onto a far larger wedge timeframe? Here is the secret behind the chart geometry. Use the timeframe selector below to explore the fractal replication.
              </p>
            </div>

            {/* TIMEFRAME SELECTOR */}
            <div className="grid grid-cols-5 gap-1.5 p-1 bg-black/50 border border-white/5 rounded-xl font-mono text-[10px] text-center">
              {(['1M', '1H', '1D', '1W', 'Macro'] as const).map((tf) => (
                <button
                  key={tf}
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`py-2 px-1 rounded-lg uppercase font-black cursor-pointer transition-all ${
                    selectedTimeframe === tf 
                      ? 'bg-[#00D9FF] text-black font-black font-mono shadow-[0_0_10px_rgba(0,217,255,0.25)]' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tf} Chart
                </button>
              ))}
            </div>

            {/* TIMEFRAME EXPLORER TEXT */}
            <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-2 font-mono text-xs">
              <div className="flex justify-between items-center border-b border-white/5 pb-1 text-[11px]">
                <span className="text-white font-black uppercase">CHART WINDOW: {timeframeData[selectedTimeframe].title}</span>
                <span className="text-[#00D9FF] font-black uppercase tracking-wider">FRACTAL MATCHING</span>
              </div>
              <p className="font-sans text-zinc-300 text-xs leading-relaxed font-semibold">
                {timeframeData[selectedTimeframe].desc}
              </p>
            </div>

            {/* WEDGE STEPPING PATH */}
            <div className="flex flex-col gap-3.5">
              {wedgeSteps.map((st, i) => {
                const isSelected = activeWedgeStep === i;
                return (
                  <div 
                    key={i}
                    onClick={() => setActiveWedgeStep(i)}
                    className={`p-4 bg-black/40 border rounded-2xl cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-[#00D9FF] bg-[#00D9FF]/5 shadow-[0_0_15px_rgba(0,217,255,0.1)]' 
                        : 'border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-3">
                        <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black ${
                          isSelected ? 'bg-[#00D9FF] text-black' : 'bg-white/5 text-zinc-400'
                        }`}>
                          {i + 1}
                        </span>
                        <span className={`font-sans tracking-tight font-black text-sm uppercase ${isSelected ? 'text-[#00D9FF]' : 'text-zinc-200'}`}>
                          {st.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-zinc-550 tracking-widest font-black uppercase">{st.concept}</span>
                    </div>

                    {isSelected && (
                      <div className="mt-3.5 pt-3 border-t border-white/5 space-y-3 animate-slideDown">
                        <p className="text-zinc-300 text-xs sm:text-sm font-sans font-semibold leading-relaxed">
                          {st.mechanics}
                        </p>
                        <div className="p-3 bg-neutral-950 border border-[#FF00C8]/25 rounded-xl font-mono text-[10.5px]">
                          <span className="text-[#FF00C8] font-black uppercase text-[8px] block tracking-wide mb-1">OBSERVER REVELATION PROJECTION:</span>
                          <span className="text-zinc-400 font-semibold font-mono tracking-tight font-black">★ "{st.quote}"</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 bg-yellow-950/15 border border-yellow-500/20 rounded-2xl font-mono text-xs text-yellow-400 leading-relaxed text-left">
              <span className="font-black uppercase text-[9px] block tracking-widest mb-1">“SOCIETY IS TELLING LIES”</span>
              <p className="font-sans font-semibold text-zinc-400 text-sm">
                Society tells you that a market drop is an economic calamity, and that a continuously rising stock index is a sign of productivity. They are lying. The rising wedge is the direct measurement of currency dilution. If a cup of coffee goes from $1 to $5, we call it inflation. If a share of Amazon goes from $1 to $5, they call it "growth". But they are products of the exact same monetary printing base.
              </p>
            </div>
          </div>

          {/* THE VISUAL CHART DEMONSTRATIVE CONTAINER (5/12) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-neutral-950 via-[#03040c]/98 to-indigo-950/30 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase tracking-widest block">MATHEMATICAL GRID SYSTEM</span>
              <h3 className="text-white font-black text-sm uppercase tracking-tight">FRACTAL WEDGE PATTERN DRAWING BOARD</h3>
              <p className="text-zinc-450 text-[11px] font-sans font-medium leading-relaxed">
                Visualize how these infinite repeating patterns construct themselves on the stock chart. Interact with steps above to isolate different legs of the cycle.
              </p>
            </div>

            {/* ARTISTIC CUSTOM INTERACTIVE SVG FOR WEDGE GEOMETRY */}
            <div className="p-4 bg-black/60 border border-white/5 rounded-2xl flex items-center justify-center h-64 relative overflow-hidden">
              <svg viewBox="0 0 400 240" className="w-full h-full text-zinc-500">
                {/* Background Grid Lines */}
                <line x1="0" y1="40" x2="400" y2="40" stroke="#111" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="400" y2="100" stroke="#111" strokeDasharray="3 3" />
                <line x1="0" y1="160" x2="400" y2="160" stroke="#111" strokeDasharray="3 3" />
                <line x1="100" y1="0" x2="100" y2="240" stroke="#111" strokeDasharray="3 3" />
                <line x1="200" y1="0" x2="200" y2="240" stroke="#111" strokeDasharray="3 3" />
                <line x1="300" y1="0" x2="300" y2="240" stroke="#111" strokeDasharray="3 3" />

                {/* Draw Fractal Channel 1 */}
                <path 
                  d="M 10,210 L 80,110 L 110,150 L 180,60 L 210,120 M 210,120 L 320,30 L 340,70 L 390,10" 
                  stroke={activeWedgeStep === 2 ? '#FF00C8' : activeWedgeStep === 1 ? '#eab308' : '#00ffff'}
                  strokeWidth="3.5" 
                  fill="none" 
                  className="transition-all duration-300"
                />

                {/* Submitting Wedge limits */}
                {/* Wedge 1 boundaries */}
                <line x1="10" y1="211" x2="180" y2="50" stroke="#555" strokeDasharray="2 2" />
                <line x1="80" y1="110" x2="180" y2="60" stroke="#555" strokeDasharray="2 2" />

                {/* Retrace correction down */}
                {activeWedgeStep >= 1 && (
                  <>
                    <line x1="180" y1="60" x2="210" y2="120" stroke="#00ffff" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x="185" y="140" fill="#eab308" className="font-mono text-[9px] font-black">LEVERAGE FLUSH (falling wedge)</text>
                  </>
                )}

                {/* Large Continuation Wedge limits */}
                {activeWedgeStep === 2 && (
                  <>
                    <line x1="10" y1="210" x2="390" y2="10" stroke="#FF00C8" strokeWidth="1" strokeDasharray="4 4" />
                    <text x="230" y="55" fill="#FF00C8" className="font-mono text-[9px] font-black">QE PIVOT EXTENSION</text>
                  </>
                )}

                {/* Highlighting selected step dots */}
                {activeWedgeStep === 0 && <circle cx="80" cy="110" r="6" fill="#00ffff" className="animate-ping" />}
                {activeWedgeStep === 1 && <circle cx="210" cy="120" r="6" fill="#eab308" className="animate-ping" />}
                {activeWedgeStep === 2 && <circle cx="320" cy="30" r="6" fill="#FF00C8" className="animate-ping" />}

                {/* Labels nodes */}
                <text x="15" y="195" fill="#777" className="font-mono text-[8px] font-extrabold uppercase">M2 expansion starts</text>
                <text x="260" y="210" fill="#fff" className="font-mono text-[9px] font-bold">FRACTAL CONTINUITY</text>
              </svg>
            </div>

            <div className="p-3.5 bg-black/60 border border-white/5 rounded-2xl text-xs space-y-1">
              <span className="font-mono text-[9px] text-[#00D9FF] font-black block uppercase">HOW TO TRADE THIS REALITY:</span>
              <p className="text-zinc-400 font-sans font-semibold leading-relaxed">
                When you understand that equity markets are de-facto inflation vectors, you stop trying to "time" an absolute system crash. Instead, you trade the <b>liquidity nodes</b>. You buy when descriptive falling wedges are flush of speculative leverage, and you hold knowing the macro monetary supply must expand infinitely to support sovereign treasuries.
              </p>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: THE SOVEREIGN INDEX OBSERVATORY: DXY, AXY, JXY */}
      {/* ========================================================= */}
      {activeTab === 'observatory' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fadeIn">
          
          {/* THE EXPLAINER NODE (7/12) */}
          <div className="lg:col-span-7 bg-[#030612]/98 border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-5 text-left">
            <div className="space-y-2">
              <span className="font-mono text-[9px] text-[#FF00C8] font-bold uppercase tracking-[0.2em] block">SOVEREIGN TICKER DECK</span>
              <h3 className="text-white font-black text-xl uppercase tracking-tight">Understanding DXY, AXY, and JXY Currency Indexes</h3>
              <p className="text-zinc-450 text-xs font-sans font-medium leading-relaxed">
                Currency indexes represent the strength of a sovereign country's paper money measured against an aggregated weight basket of other partner nations. They dictate import overheads, bond capital flows, and international trade competitive levels.
              </p>
            </div>

            {/* THREE INDEX COMPARISONS ROW CARD */}
            <div className="flex flex-col gap-4 font-sans text-xs">
              
              {/* DXY Card */}
              <div className="p-4 bg-indigo-950/5 border border-indigo-500/25 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 bg-indigo-500/20 text-indigo-400 rounded-sm font-black">DXY</span>
                    <span className="font-black text-white font-sans text-[13px] uppercase">U.S. Dollar Index (Global Anchor)</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase font-mono">Weight: 6 Core currencies</span>
                </div>
                <p className="text-zinc-350 leading-relaxed font-semibold">
                  Established in 1973 under the Bretton Woods wreckage. Tracks the US Dollar against 6 key western currencies (Euro 57.6%, Japanese Yen 13.6%, British Pound 11.9%, Canadian Dollar 9.1%, Swedish Krona 4.2%, Swiss Franc 3.6%). 
                </p>
                <div className="p-2.5 bg-black/40 rounded-xl font-mono text-[10px] text-zinc-450 leading-tight">
                  <span className="text-[#00D9FF] font-black block uppercase text-[8px] mb-1">SOVEREIGN PURPOSE:</span>
                  Tracks whether the world has systemic dollar scarcity (high DXY) or high dollar credit expansion (low DXY). Controls global emerging market commodity costs.
                </div>
              </div>

              {/* AXY Card */}
              <div className="p-4 bg-emerald-950/5 border border-emerald-500/25 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-sm font-black">AXY</span>
                    <span className="font-black text-white font-sans text-[13px] uppercase">Bloomberg Asian Currency Index</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase font-mono">Weight: 10 Asian Currencies</span>
                </div>
                <p className="text-zinc-350 leading-relaxed font-semibold">
                  Tracks a basket of the 10 most influential trade currencies of East Asia (Chinese Renminbi, South Korean Won, Singapore Dollar, Taiwan Dollar, Malaysian Ringgit, Thai Baht, etc.) valued against the USD.
                </p>
                <div className="p-2.5 bg-black/40 rounded-xl font-mono text-[10px] text-zinc-450 leading-tight">
                  <span className="text-emerald-400 font-black block uppercase text-[8px] mb-1">SOVEREIGN PURPOSE:</span>
                  Measures the competitiveness of Asian manufacturing corridors. A low AXY means cheap local export operations, boosting Asian balance sheets.
                </div>
              </div>

              {/* JXY Card */}
              <div className="p-4 bg-pink-950/5 border border-pink-500/25 rounded-2xl space-y-2">
                <div className="flex items-center justify-between border-b border-white/5 pb-1.5 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded-sm font-black">JXY</span>
                    <span className="font-black text-white font-sans text-[13px] uppercase">Japanese Yen Currency Index</span>
                  </div>
                  <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase font-mono">Weight: Global FX Core</span>
                </div>
                <p className="text-zinc-350 leading-relaxed font-semibold">
                  Measures the purchasing power of the Yen independently. The Japanese Yen represents the master collateral fund of the global financial system due to the Keiretsu asset backing and persistent zero-rate bank holdings.
                </p>
                <div className="p-2.5 bg-black/40 rounded-xl font-mono text-[10px] text-zinc-450 leading-tight">
                  <span className="text-pink-400 font-black block uppercase text-[8px] mb-1">SOVEREIGN PURPOSE:</span>
                  Tracks the <b>Yen Carry Trade</b>. When JXY spikes violently, it reveals international funds are rapidly selling their yield assets elsewhere and buying back Yen to close borrowing pipelines post-danger.
                </div>
              </div>

            </div>
          </div>

          {/* DYNAMIC WEIGHTS CHART CONSOLE (5/12) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-neutral-950 via-[#030612] to-indigo-950/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-6">
            <div className="space-y-1 text-left">
              <span className="font-mono text-[9px] text-[#FF00C8] font-bold uppercase tracking-wider block">THE CLEAR PATH CONVERSATION</span>
              <h3 className="text-white font-black text-sm uppercase tracking-tight">WHY SOVEREIGN INDEXES CONSTRAIN YOUR PORTFOLIO</h3>
              <p className="text-zinc-450 text-[10.5px] leading-relaxed font-sans font-medium">
                No stock ticker operates inside a vacuum. Discover how currency index changes command equity pricing triggers.
              </p>
            </div>

            {/* WEIGHT MATRIX DISPLAY CHANNELS */}
            <div className="p-4 bg-black/50 border border-white/5 rounded-2xl flex flex-col gap-3 font-mono text-xs sm:text-sm">
              <span className="text-[10px] text-zinc-500 uppercase font-black tracking-wider block border-b border-white/5 pb-1 font-mono">INDEX FEEDBACK MECHANISMS:</span>
              
              <div className="space-y-2 text-zinc-300 text-xs text-left">
                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full shrink-0 mt-1.5" />
                  <p className="font-semibold"><b className="text-white font-black">Scarcity Choke (DXY Surge)</b>: When DXY rallies, foreign debts denominated in dollars expand instantly, sucking liquidity from emerging stock exchanges.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shrink-0 mt-1.5" />
                  <p className="font-semibold"><b className="text-white font-black">Asian Engine (AXY Rise)</b>: A rising AXY signals strong domestic consumer demand across China and Korea, boosting technology import indices.</p>
                </div>
                <div className="flex gap-2.5 items-start">
                  <span className="w-1.5 h-1.5 bg-pink-400 rounded-full shrink-0 mt-1.5" />
                  <p className="font-semibold"><b className="text-white font-black">Carry Crack (JXY Spikes)</b>: Rising Yen devalues global arbitrage, driving cascading margin checks across Wall Street indexes.</p>
                </div>
              </div>
            </div>

            {/* MONETARY QUIZ BLOCK TO ENGAGE THE WORLD */}
            <div className="p-4 bg-[#FF00C8]/5 border border-[#FF00C8]/25 rounded-2xl space-y-2">
              <span className="font-mono text-[9px] text-[#FF00C8] font-black uppercase tracking-widest block">SOVEREIGN MATURITY MATRIX TEST</span>
              <p className="text-xs font-sans text-zinc-205 font-medium leading-normal">
                If the Fed prints M2 paper to finance state debts, and DXY slides downwards, does the S&P 500 index ticket rise or drop?
              </p>
              <div className="grid grid-cols-2 gap-2 text-[10.5px] font-mono">
                <button
                  onClick={() => alert("CORRECT! When the USD index slides due to dilution, nominal stock tickers move UPWARD. It takes more devalued dollar notes to bid the exact same equity share.")}
                  className="py-1.5 bg-zinc-850 hover:bg-zinc-800 rounded text-center border border-white/5 text-zinc-300 uppercase font-black cursor-pointer animate-pulse"
                >
                  ▲ Rise (Price Inflation)
                </button>
                <button
                  onClick={() => alert("INCORRECT. Consider this: if the value of a dollar unit devalues, it requires MORE paper dollars to clear/buy one asset of Apple stock. Thus index prices mathematically appreciate.")}
                  className="py-1.5 bg-zinc-850 hover:bg-zinc-800 rounded text-center border border-white/5 text-zinc-300 uppercase font-black cursor-pointer"
                >
                  ▼ Drop (Purge)
                </button>
              </div>
            </div>

            <div className="text-center font-mono text-[8.5px] text-zinc-600 border-t border-white/5 pt-2">
              Clear Path Observatory - Play to succeed, master the mechanics of monetary systems.
            </div>
            
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: THE SYSTEMIC DEVALUATION SIMULATOR & TRUTH LEDGER */}
      {/* ========================================================= */}
      {activeTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fadeIn">
          
          {/* CONTROL BOX (5/12) */}
          <div className="lg:col-span-5 bg-black/75 border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-5 text-left">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-[#FF00C8] font-black uppercase tracking-wider block">SYSTEM PARAMETERS PANEL</span>
              <h3 className="text-white font-black text-lg uppercase tracking-tight">Set S&P Denominator Physics</h3>
              <p className="text-zinc-400 text-xs font-sans font-medium">
                Adjust federal budgets, print operations, and rate targets. Observe how nominal values explode while dollar buying efficiency collapses.
              </p>
            </div>

            {/* SLIDERS MATRIX */}
            <div className="space-y-5 font-mono text-xs">
              
              {/* Sliders 1: Budget Deficit */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-zinc-300 text-[10.5px]">
                  <span>1. ANNUAL DEBT DEFICIT (BOTH PARTIES)</span>
                  <span className="text-amber-400">${deficitSpending}B / year</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="3000" 
                  step="100"
                  value={deficitSpending} 
                  onChange={(e) => setDeficitSpending(Number(e.target.value))}
                  className="w-full accent-[#FF00C8] bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-zinc-550">
                  <span>Balance sheet discipline</span>
                  <span>Hyper Uncapped Spending</span>
                </div>
              </div>

              {/* Sliders 2: Fed Balance Sheet expansion */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-zinc-300 text-[10.5px]">
                  <span>2. FED QUANTITATIVE EASING (QE EXTRAS)</span>
                  <span className="text-[#00D9FF]">${fedBalanceSheet}B / year</span>
                </div>
                <input 
                  type="range" 
                  min="-500" 
                  max="2500" 
                  step="100"
                  value={fedBalanceSheet} 
                  onChange={(e) => setFedBalanceSheet(Number(e.target.value))}
                  className="w-full accent-[#00D9FF] bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-zinc-550">
                  <span>-$500B (QT - Draining Reserv.)</span>
                  <span>+$2.5T / yr (Severe Liquidity Flood)</span>
                </div>
              </div>

              {/* Sliders 3: Fed Rate */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-zinc-300 text-[10.5px]">
                  <span>3. CENTRAL RESERVE BASE LENDING RATE</span>
                  <span className="text-emerald-400">{interestRatesRate}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="15" 
                  step="0.25"
                  value={interestRatesRate} 
                  onChange={(e) => setInterestRatesRate(Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-zinc-550">
                  <span>0.00% (Absolute Zero Bubble)</span>
                  <span>15.00% (High Interest Suffocation)</span>
                </div>
              </div>

              {/* Sliders 4: De-dollarization */}
              <div className="space-y-2">
                <div className="flex justify-between font-bold text-zinc-300 text-[10.5px]">
                  <span>4. GLOBAL RESERVE DE-HOARDING (FOREIGN SELLS)</span>
                  <span className="text-pink-400">{foreignDehoarding}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  step="5"
                  value={foreignDehoarding} 
                  onChange={(e) => setForeignDehoarding(Number(e.target.value))}
                  className="w-full accent-pink-500 bg-zinc-800 h-1.5 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[8px] text-zinc-550">
                  <span>0% (Strong Foreign Custody)</span>
                  <span>100% (Universal Treasury Dumping)</span>
                </div>
              </div>

            </div>

            {/* RESET BUTTON */}
            <button
              onClick={() => {
                setDeficitSpending(1500);
                setFedBalanceSheet(1000);
                setInterestRatesRate(4.5);
                setForeignDehoarding(30);
              }}
              className="mt-4 flex items-center justify-center gap-2 py-2 px-4 bg-zinc-900 hover:bg-zinc-800 border border-white/10 rounded-xl font-mono text-[10.5px] uppercase font-black cursor-pointer text-zinc-300 hover:text-white transition-all w-full"
            >
              <RotateCcw className="w-4 h-4 text-[#FF00C8]" />
              Reset To Baseline Metrics
            </button>
          </div>

          {/* SIMULATION REAL-TIME RESULTS (7/12) */}
          <div className="lg:col-span-7 bg-[#030612] border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-6 relative overflow-hidden">
            <div className="space-y-2 border-b border-white/5 pb-3">
              <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase tracking-widest block">10-YEAR PROJECTION ENGINE ANALYSIS</span>
              <h3 className="text-white font-black text-xl uppercase tracking-tight">THE SOVEREIGN REALITY REPORT</h3>
              
              {/* SYSTEM STATE INDICATOR BADGE */}
              <div className="p-3 bg-[#FF00C8]/5 border border-[#FF00C8]/35 rounded-xl font-mono text-center">
                <span className="text-zinc-500 text-[9px] uppercase font-black block tracking-widest">SYSTEMIC CLASSIFICATION:</span>
                <span className="text-[#FF00C8] text-sm font-black tracking-tight">{simulationResults.stateLabel}</span>
              </div>
            </div>

            {/* PROJECTION SCOREBOARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
              
              <div className="p-4 bg-black/45 border border-white/5 rounded-2xl flex flex-col justify-between gap-2 text-left">
                <span className="text-[9.5px] text-zinc-500 font-black uppercase select-none">Projected Nom S&P Level</span>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-[#00D9FF]">{simulationResults.nominalSP}</span>
                  <span className="text-[9px] text-zinc-650 block border-t border-white/5 pt-1">Compared to 6,150 base</span>
                </div>
              </div>

              <div className="p-4 bg-black/45 border border-white/5 rounded-2xl flex flex-col justify-between gap-2 text-left">
                <span className="text-[9.5px] text-zinc-500 font-black uppercase select-none">Dollar Buying Efficiency</span>
                <div className="space-y-0.5">
                  <span className="text-2xl font-black text-amber-400">${simulationResults.dollarValue}</span>
                  <span className="text-[9px] text-zinc-650 block border-t border-white/5 pt-1">Relative to 2026 $1.00 bills</span>
                </div>
              </div>

              <div className="p-4 bg-black/45 border border-white/5 rounded-2xl flex flex-col justify-between gap-2 text-left">
                <span className="text-[9.5px] text-zinc-500 font-bold uppercase select-none">Actual Real S&P Value</span>
                <div className="space-y-0.5">
                  <span className={`text-2xl font-black ${simulationResults.realSP < 5000 ? 'text-red-400' : 'text-emerald-400'}`}>{simulationResults.realSP}</span>
                  <span className="text-[9px] text-zinc-650 block border-t border-white/5 pt-1">Adjusted for money dilution</span>
                </div>
              </div>

            </div>

            {/* THE LIES REVELATION HUB CARDS */}
            <div className="p-4 bg-zinc-950 border border-white/5 rounded-2xl space-y-3.5">
              <div className="flex gap-2 items-center text-[#EAB308]">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-mono text-[9px] font-black uppercase tracking-widest">SOCIETY'S LIES VS COLD FISCAL REALITY</span>
              </div>

              <div className="space-y-2 text-[11.5px] leading-relaxed text-zinc-300 font-sans">
                <p className="font-semibold">
                  <b className="text-white">The Lie:</b> "The Federal Reserve targets 2.0% inflation to ensure stable growth and keep you balanced."
                </p>
                <p className="font-semibold pl-4 border-l border-red-500/30 text-zinc-400 italic">
                  <b className="text-red-400 font-mono text-[10px] uppercase font-black tracking-wider block not-italic">THE TRUTH LEDGER:</b> 
                  Even at 'only' 2.0% inflation, your paper dollar loses 50% of its purchasing efficiency every 35 years. It is a systematic, silent wealth extraction to pay for government overspending without raising direct head tax votes.
                </p>

                <p className="font-semibold pt-2">
                  <b className="text-white">The Lie:</b> "Partisan debate governs index returns. Democrat or Republican dominance defines market velocity."
                </p>
                <p className="font-semibold pl-4 border-l border-red-500/30 text-zinc-400 italic">
                  <b className="text-[#00D9FF] font-mono text-[10px] uppercase font-black tracking-wider block not-italic">THE TRUTH LEDGER:</b> 
                  Both factions preside over continuous deficit expansions. The nominal S&P 505 index has mathematically appreciated under both teams simply because of the M2 money expansion. When you measure the index in real gold, calories, or oil units, its massive 50-year gains are radically consolidated.
                </p>
              </div>
            </div>

            <div className="p-3 bg-red-950/20 border border-red-500/20 rounded-2xl text-[11px] font-sans text-zinc-400 leading-relaxed text-left">
              <span className="font-mono text-[9px] text-red-400 font-black tracking-wider uppercase block mb-1">MONETARY HEALTH ALERT:</span>
              <p className="font-semibold">{simulationResults.systemHealthAlert}</p>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 5: THE YEN CARRY TRADE UNWIND FLOW MODEL */}
      {/* ========================================================= */}
      {activeTab === 'carry' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-fadeIn">
          
          {/* FLOW CHART CONTROLS & MODEL VIEW (7/12) */}
          <div className="lg:col-span-7 bg-[#030612]/98 border border-white/10 rounded-3xl p-6 flex flex-col justify-between gap-5 text-left">
            <div className="space-y-1">
              <span className="font-mono text-[9px] text-emerald-400 font-black uppercase block">THE HIGH-STAKES CARRY PIPELINE</span>
              <h3 className="text-white font-black text-xl uppercase tracking-tight">Yen Carry Trade Interlocked Liquidity Engine</h3>
              <p className="text-zinc-450 text-xs font-sans font-medium leading-relaxed">
                Ever wonder why regional events in Tokyo cause S&P 500 futures, Nasdaq, or the Dow to suddenly tumble 3% in a night? Learn how hedge funds exploit international monetary spreads, and why currency arbitrage governs US stock wedges.
              </p>
            </div>

            {/* FLOW STEPS TIMELINE PROGRESSION */}
            <div className="space-y-3.5 relative">
              
              {/* Timeline Connector Line */}
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-zinc-800/80 pointer-events-none" />

              {carryTradeSequence.map((seq, idx) => {
                const isCompleted = carryTradeStep >= idx;
                const isActive = carryTradeStep === idx;
                return (
                  <div 
                    key={idx}
                    onClick={() => setCarryTradeStep(idx)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer relative pl-[52px] ${
                      isActive 
                        ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_15px_rgba(16,185,129,0.15)]' 
                        : isCompleted
                          ? 'border-emerald-500/30 bg-black/40' 
                          : 'border-white/5 bg-transparent opacity-50'
                    }`}
                  >
                    {/* Circle Indicator */}
                    <div className={`absolute left-2.5 top-[18px] w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10.5px] font-black tracking-tight ${
                      isActive 
                        ? 'bg-emerald-500 text-black animate-pulse' 
                        : isCompleted 
                          ? 'bg-emerald-950 border border-emerald-500 text-emerald-400' 
                          : 'bg-zinc-900 border border-white/10 text-zinc-500'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="space-y-1">
                      <span className={`font-sans font-black text-xs uppercase block ${isActive ? 'text-emerald-400' : 'text-zinc-200'}`}>
                        {seq.title}
                      </span>
                      {isActive && (
                        <div className="space-y-3.5 pt-2 border-t border-white/5 mt-2 animate-slideDown">
                          <p className="text-zinc-300 text-xs leading-relaxed font-sans font-semibold">
                            {seq.mechanics}
                          </p>
                          
                          {/* INDEX PARAMETERS IMPACT MAP */}
                          <div className="grid grid-cols-3 gap-2 text-center font-mono text-[9px] font-black uppercase">
                            <div className="p-2 bg-black/60 border border-white/5 rounded-xl text-left space-y-0.5">
                              <span className="text-zinc-500 text-[8px] block">JXY Yen Index</span>
                              <span className="text-[#FF00C8] font-bold block">{seq.jxyImpact}</span>
                            </div>
                            <div className="p-2 bg-black/60 border border-white/5 rounded-xl text-left space-y-0.5">
                              <span className="text-zinc-500 text-[8px] block">DXY Dollars Index</span>
                              <span className="text-[#00D9FF] font-bold block">{seq.dxyImpact}</span>
                            </div>
                            <div className="p-2 bg-black/60 border border-white/5 rounded-xl text-left space-y-0.5">
                              <span className="text-zinc-500 text-[8px] block">US Indices Impact</span>
                              <span className="text-amber-400 font-bold block">{seq.nasdaqImpact}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

            </div>

            {/* PREV/NEXT ACTIONS TAB */}
            <div className="flex gap-2">
              <button
                disabled={carryTradeStep === 0}
                onClick={() => setCarryTradeStep(p => Math.max(0, p - 1))}
                className="flex-1 py-2 px-4 rounded-xl font-mono text-[10px] font-black uppercase bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                ◀ Previous Leg
              </button>
              <button
                disabled={carryTradeStep === carryTradeSequence.length - 1}
                onClick={() => setCarryTradeStep(p => Math.min(carryTradeSequence.length - 1, p + 1))}
                className="flex-1 py-2 px-4 rounded-xl font-mono text-[10px] font-black uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next Sequence Leg ▶
              </button>
            </div>
          </div>

          {/* CARRY METRICS LEDGER PANEL (5/12) */}
          <div className="lg:col-span-5 bg-gradient-to-br from-neutral-950 via-[#030612] to-emerald-950/20 border border-white/5 rounded-3xl p-6 flex flex-col justify-between gap-5">
            <div className="space-y-1 text-left">
              <span className="font-mono text-[9px] text-[#00D9FF] font-black uppercase tracking-[0.2em] block">THE SYSTEM SQUEEZE MECHANICS</span>
              <h3 className="text-white font-black text-sm uppercase tracking-tight">WHY THE YEN DETERMINES Wall street</h3>
              <p className="text-zinc-400 text-[11px] leading-relaxed font-sans font-medium">
                Sovereign debt systems are connected by liquid conduits. If you change the level in one tank, all other connected containers must level out immediately. Japanese funds hold the largest hoard of foreign assets on Earth ($4 Trillion in US government debt and equities). 
              </p>
            </div>

            {/* PIPELINE DATA CHIPS */}
            <div className="p-4 bg-black/60 border border-white/5 rounded-2xl text-[11px] font-mono space-y-4">
              <span className="text-[9px] text-zinc-500 font-black block uppercase tracking-wider border-b border-white/5 pb-1 select-none">INTERACTIVE CARRY ARBITRAGE ARDUINO BOARD</span>
              
              <div className="space-y-3.5 text-left text-zinc-300">
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black">
                    <span className="text-red-400 uppercase">BANK OF JAPAN RATE VALUE</span>
                    <span>{bojRate.toFixed(2)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="3" 
                    step="0.25"
                    value={bojRate} 
                    onChange={(e) => {
                      const newBoj = Number(e.target.value);
                      setBojRate(newBoj);
                      // As Japan rate rises, spread compresses, bubble pops!
                      const spread = usRate - newBoj;
                      setStockBubbleMagnitude(Math.round(Math.max(20, spread * 18)));
                    }}
                    className="w-full accent-red-500 bg-zinc-800 h-1 rounded cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] font-black">
                    <span className="text-blue-400 uppercase">FED FUNDS RATE VALUE</span>
                    <span>{usRate.toFixed(2)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="8" 
                    step="0.25"
                    value={usRate} 
                    onChange={(e) => {
                      const newUs = Number(e.target.value);
                      setUsRate(newUs);
                      const spread = newUs - bojRate;
                      setStockBubbleMagnitude(Math.round(Math.max(20, spread * 18)));
                    }}
                    className="w-full accent-blue-500 bg-zinc-800 h-1 rounded cursor-pointer"
                  />
                </div>

                <div className="p-3 bg-zinc-900 border border-white/5 rounded-xl space-y-2">
                  <div className="flex justify-between text-[9px] text-zinc-500 font-bold uppercase">
                    <span>Active Liquidity Spread spread</span>
                    <span className="text-zinc-300">{(usRate - bojRate).toFixed(2)}% Yield Gap</span>
                  </div>
                  
                  <div className="flex justify-between text-[10px] text-zinc-300 font-bold uppercase">
                    <span>Nasdaq speculative capacity:</span>
                    <span className={`font-black ${stockBubbleMagnitude > 80 ? 'text-[#00ffff]' : stockBubbleMagnitude > 40 ? 'text-amber-400' : 'text-red-400'}`}>
                      {stockBubbleMagnitude}% Capacity Peak
                    </span>
                  </div>
                  <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${stockBubbleMagnitude > 80 ? 'bg-[#00ffff]' : stockBubbleMagnitude > 40 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ width: `${Math.min(100, stockBubbleMagnitude)}%` }}
                    />
                  </div>
                </div>

              </div>
            </div>

            {/* MACRO REVELATION FINAL CARD */}
            <div className="p-4 bg-emerald-950/10 border border-emerald-500/25 rounded-2xl flex items-start gap-3 text-left">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="space-y-0.5 font-mono text-xs text-emerald-400">
                <span className="font-black uppercase tracking-wider text-[9px] block">MASTER THE CONDUIT RULE BOOK:</span>
                <p className="font-sans text-zinc-350 leading-relaxed font-semibold">
                  You are taught to fear inflation, yet you are enticed to speculate on stock price indexes. To play to win, you must stop looking at stock tick numbers as direct measures of profit. They are dynamic records of systemic arbitrage. When JXY surges, protect your capital. When core central banks start the debt deficit stimulus pipeline, load up on blue chips at the wedge tip support lines.
                </p>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
