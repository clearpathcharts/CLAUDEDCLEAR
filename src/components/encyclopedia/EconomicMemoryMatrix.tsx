import React, { useState, useEffect } from 'react';
import { 
  Clock, Calendar, History, TrendingUp, AlertTriangle, HelpCircle, 
  ArrowRight, ShieldCheck, Play, Pause, FastForward, Navigation, 
  Map, Workflow, Building, Cpu, Globe, Users, Smile, Shield, Sparkles,
  Layers, HardDrive, DollarSign, ArrowDown, Battery, Info, Zap, Flame, MoveRight
} from 'lucide-react';

interface EconomicMemoryMatrixProps {
  selectFileNode: (fileName: string) => void;
}

// Memory Matrix Data Node Types
interface MemoryNode {
  id: string;
  title: string;
  category: 'era' | 'bubble' | 'crisis' | 'revolution' | 'policy';
  year: string;
  shortDesc: string;
  connections: string[]; // Node IDs this connects to
  narrative: string;
  consequences: string; // Human consequence layer
}

export default function EconomicMemoryMatrix({ selectFileNode }: EconomicMemoryMatrixProps) {
  // Navigation states
  const [activeTab, setActiveTab] = useState<'matrix' | 'explorer' | 'psychology' | 'dxy' | 'domino' | 'stocks' | 'power' | 'future'>('matrix');

  // 1. Memory Matrix state
  const [selectedNodeId, setSelectedNodeId] = useState<string>('dep_1929');
  
  // 2. Era Explorer state
  const [selectedEraIndex, setSelectedEraIndex] = useState<number>(3); // Default to 2000s or 2020s

  // 3. Market Psychology state
  const [activePsychPhase, setActivePsychPhase] = useState<'greed' | 'anxiety' | 'panic' | 'depression'>('greed');

  // 4. DXY documentary state
  const [dxyTimelineIndex, setDxyTimelineIndex] = useState<number>(0);
  const [isPlayingDxy, setIsPlayingDxy] = useState<boolean>(false);

  // 5. Domino Effect state
  const [activeDominoChain, setActiveDominoChain] = useState<'rates' | 'oil' | 'ai' | 'money'>('rates');
  const [hoveredDominoStep, setHoveredDominoStep] = useState<number | null>(null);

  // 6. Living Stock History state
  const [selectedStock, setSelectedStock] = useState<'msft' | 'nvda' | 'aapl' | 'amzn'>('msft');
  const [activeStockEra, setActiveStockEra] = useState<number>(0);

  // 7. Global Power state
  const [selectedPowerRegion, setSelectedPowerRegion] = useState<'us' | 'china' | 'mideast' | 'europe'>('us');

  // 9. Future Engine state
  const [selectedFutureSim, setSelectedFutureSim] = useState<'ai_dividend' | 'neo_barter' | 'robotic_onshoring' | 'energy_grid'>('ai_dividend');
  const [simRunStatus, setSimRunStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [simOutputLog, setSimOutputLog] = useState<string[]>([]);

  // DXY timer mechanism
  useEffect(() => {
    let interval: any = null;
    if (isPlayingDxy) {
      interval = setInterval(() => {
        setDxyTimelineIndex((prev) => {
          if (prev >= DXY_DOCUMENTARY_TIMELINE.length - 1) {
            setIsPlayingDxy(false);
            return prev;
          }
          return prev + 1;
        });
      }, 5500);
    } else {
      if (interval) clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlayingDxy]);

  // Future engine simulator log typewriter
  const runFutureSim = () => {
    setSimRunStatus('running');
    setSimOutputLog(['[INITIALIZING SIMULATOR MATRIX]', 'Establishing forward projection parameters...']);
    
    const logs = FUTURE_SIMULATIONS[selectedFutureSim].logs;
    let currentIdx = 0;
    
    const interval = setInterval(() => {
      if (currentIdx < logs.length) {
        setSimOutputLog(prev => [...prev, logs[currentIdx]]);
        currentIdx++;
      } else {
        setSimRunStatus('completed');
        clearInterval(interval);
      }
    }, 1500);
  };

  // ----------------------------------------------------
  // DATA INJECTORS
  // ----------------------------------------------------

  const MEMORY_NODES: Record<string, MemoryNode> = {
    dep_1929: {
      id: 'dep_1929',
      title: 'The Great Depression Crash',
      category: 'crisis',
      year: '1929 - 1933',
      shortDesc: 'A colossal sovereign credit decoupling triggered by high agricultural leverage and retail margin calls.',
      connections: ['era_1920s', 'bank_1930', 'gold_std'],
      narrative: 'In October 1929, the fragile stock market bubble burst. Retail buyers who purchased shares using 90% borrowed capital (margin) were hit with margin calls. As they panic-sold to repay banks, stock indices collapsed by 85%. Due to the rigid gold-standard framework, the Federal Reserve stood frozen, refusing to expand the money supply or act as lender of last resort. This forced over 9,000 local community banks to shutter permanently.',
      consequences: 'More than 15 million citizens lost their employment. Schoolteachers, bricklayers, and clerks had their lifelong bank deposits entirely vaporized overnight. Lacking any safety nets, families relied on local church soup lines, and rural farmers whose lands turned to dust barter-swapped raw potatoes for shoes.'
    },
    era_1920s: {
      id: 'era_1920s',
      title: 'The Roaring Speculative Era',
      category: 'era',
      year: '1920 - 1929',
      shortDesc: 'Unprecedented industrial manufacturing, urban electrification, and stock margin leverage addiction.',
      connections: ['dep_1929', 'rev_industrial'],
      narrative: 'Following WWI, a boom in assembly-line manufacturing of cars and household appliances generated massive real wage gains. Simultaneously, commercial banks discovered "brokers loans," allowing everyday retail citizens to purchase stocks by putting down as little as 10% of the price. The slogan "everyone ought to be rich" swept across culture, fueling extreme speculation in radio and automotive technology monopolies.',
      consequences: 'Urban middle-classes took on massive debt for the first time. Working class households leveraged their primary homes to buy high-flying utility holding stocks, entirely blind to the systemic financial gears backing the system.'
    },
    bank_1930: {
      id: 'bank_1930',
      title: 'Systemic Fractional Panic run',
      category: 'crisis',
      year: '1930 - 1933',
      shortDesc: 'Mass physical runs on local depositories triggering a localized fractional ledger collapse.',
      connections: ['dep_1929', 'gold_std'],
      narrative: 'Because banks only hold a small fraction of customer deposits as physical cash in their vaults, a whisper of weakness was enough to spark fear. Lines of citizens formed block-deep to withdraw money. Banks were forced to fire-sell assets and call in mortgage loans to generate physical paper bills, precipitating a cascading asset freeze worldwide.',
      consequences: 'Entire regional farming towns were driven to zero cash liquidity. Farmers barricaded roads with pitchforks to prevent bank agents from foreclosing and seizing multi-generational family homesteads.'
    },
    oil_1973: {
      id: 'oil_1973',
      title: 'OPEC Petroleum Embargo Crisis',
      category: 'crisis',
      year: '1973 - 1974',
      shortDesc: 'Political retaliation chokes oil supply pipelines, initiating severe global cost-of-living inflation.',
      connections: ['era_1970s', 'dxy_nixon', 'volcker_hikes'],
      narrative: 'During the Yom Kippur War, Arab members of OPEC implemented an oil embargo targeting western nations. Crude oil prices quadrupled in months, rising from $3 to nearly $12 per barrel overnight. In a physical oil-dependent society, transportation, chemicals, harvesting, and electricity costs spiked instantly, causing severe stagflation.',
      consequences: 'Gas stations ran dry. Governments mandated state fuel rationing, leading to mile-long queues of family cars. Families skipped expensive beef to eat canned beans. Standard grocery prices inflated by 11% in a single year, destroying purchasing power.'
    },
    era_1970s: {
      id: 'era_1970s',
      title: 'The Great Stagflation Epoch',
      category: 'era',
      year: '1970 - 1979',
      shortDesc: 'Decoupling of the USD gold backing, severe fuel rationing, and wage-price feedback loops.',
      connections: ['oil_1973', 'dxy_nixon'],
      narrative: 'A dark decade where economic growth ground to a halt while consumer cost inflation spiraled out of control. With the USD decoupled from gold, unions demanded higher wages to cover costs, and businesses responded by raising prices, fueling a vicious feedback loop. This disproved classic Keynesian economics.',
      consequences: 'Standard savings accounts lost half their real value in just six years. Homemakers experienced constant stress at supermarkets, where pricing labels were stamped over with new higher prices weekly.'
    },
    dxy_nixon: {
      id: 'dxy_nixon',
      title: 'Nixon Shock Gold Decoupling',
      category: 'policy',
      year: '1971',
      shortDesc: 'The US Dollar cuts gold backing, creating the modern unbacked fiat currency standard.',
      connections: ['era_1970s', 'oil_1973', 'glob_debt'],
      narrative: 'Faced with rising inflation and shrinking gold vaults as European countries redeemed their paper dollars for physical gold bars, President Richard Nixon unilaterally closed the gold window, abandoning the Bretton Woods system. The US Dollar floated freely to be printed by decree.',
      consequences: 'This shook the bedrock of international trade. It allowed governments to run large, persistent deficits, spawning a massive global expansion of debt, asset speculation, and consumer cost-of-living erosion.'
    },
    volcker_hikes: {
      id: 'volcker_hikes',
      title: 'Volcker Extreme Rate hikes',
      category: 'policy',
      year: '1979 - 1981',
      shortDesc: 'Fed chairman pushes US interest rates to 20% to choke persistent inflation.',
      connections: ['oil_1973', 'era_1970s'],
      narrative: 'To break the back of entrenched consumer inflation, newly appointed Fed Chairman Paul Volcker tightened the money supply. By raising the benchmark interest rate to an unprecedented 22%, he deliberately induced a painful recession, destroying loan demand.',
      consequences: 'Borrowing became impossible. The home building and heavy machinery industries collapsed, pushing unemployment to 10.8%. However, this extreme medicine restored long-term confidence in the US Dollar.'
    },
    subprime_2008: {
      id: 'subprime_2008',
      title: 'Great Subprime Mortgage Bubble',
      category: 'bubble',
      year: '2004 - 2008',
      shortDesc: 'Securitized low-quality consumer loans collapse, triggering a global banking system lock.',
      connections: ['era_2000s', 'glob_debt', 'qe_era'],
      narrative: 'Wall Street investment firms packaged trillions of dollars worth of subprime mortgages into complex derivatives sold to global funds. When housing prices softened, borrowers defaulted en masse. Iconic investment firms like Lehman Brothers collapsed, freezing interbank lending.',
      consequences: 'More than 8 million Americans were laid off globally. Foreclosure signs littered neighborhoods as over 3 million homes were seized by banks. Families were displaced, packing belongings into station wagons.'
    },
    era_2000s: {
      id: 'era_2000s',
      title: 'The Liquidity & Credit Expansion',
      category: 'era',
      year: '2000 - 2009',
      shortDesc: 'The rise of complex structured credit, globalization of supply chains, and housing mania.',
      connections: ['subprime_2008', 'dotcom_2000'],
      narrative: 'After the Dotcom crash, central banks cut interest rates to record lows. This fueled a global hunting for high yields. Financial engineers constructed mortgage-backed securities (MBS), assuring markets that housing prices would never fall nationwide.',
      consequences: 'Working families with unstable income were offered "no money down" adjustable-rate mortgages. Many bought multiple properties they could not afford, set up to fail as soon as interest rates rose.'
    },
    dotcom_2000: {
      id: 'dotcom_2000',
      title: 'The Dot-Com Telecom Bubble',
      category: 'bubble',
      year: '1995 - 2000',
      shortDesc: 'Irrational exuberance in internet business models leading to a massive tech crash.',
      connections: ['era_2000s', 'rev_internet'],
      narrative: 'Speculators chased any company with a ".com" suffix. Unprofitable web startups with zero revenues raised billions in IPOs. Margin loans for retail stock purchasing reached record highs. In March 2000, reality caught up, and the Nasdaq Composite plunged 78%.',
      consequences: 'Trillions of dollars of retail savings were incinerated. Hundreds of thousands of software engineers lost their jobs, and entire fiber-optic giants filed for bankruptcy.'
    },
    qe_era: {
      id: 'qe_era',
      title: 'Quantitative Easing Era',
      category: 'policy',
      year: '2008 - 2021',
      shortDesc: 'Central banks buy trillions in sovereign debts, inflating major risk-assests and real estate.',
      connections: ['subprime_2008', 'era_2020s'],
      narrative: 'With interest rates nailed to zero (ZIRP), central banks turned to a new tool: Quantitative Easing. They printed digital money to buy treasury bonds directly, driving yields down and forcing capital into stocks, venture capital, and properties.',
      consequences: 'Wealth inequality soared as stock and home owners saw their net worth inflate while wages lagged. This cheap money period fostered corporate dependence on debt and inflated real estate prices.'
    },
    era_2020s: {
      id: 'era_2020s',
      title: 'The AI Boom & Inflation Cycle',
      category: 'era',
      year: '2020 - 2026',
      shortDesc: 'Post-pandemic monetary easing meets the rise of sovereign AI compute networks.',
      connections: ['qe_era', 'rev_ai', 'glob_debt'],
      narrative: 'Trillions in post-pandemic fiscal stimulus flooded the globe, triggering a severe consumer price inflation surge. To fight this, central banks launched the fastest interest rate hikes in forty years. Simultaneously, Nvidia and tech giants sparked a gold rush to secure AI compute grids.',
      consequences: 'Basic life staples like groceries, fuel, and housing costs skyrocketed. Young generations found homeownership completely out of reach, but the technology sector boomed as computing power scaled.'
    },
    rev_industrial: {
      id: 'rev_industrial',
      title: 'The Steam Industrial Revolution',
      category: 'revolution',
      year: '1760 - 1840',
      shortDesc: 'Bridges physical human muscle labor to high-compression coal horsepower steam engines.',
      connections: ['era_1920s'],
      narrative: 'Transitioning from hand-spinning wheels to coal-fired factories, humanity decoupled mechanical work capacity from physical biological muscles. This created massive population boom cycles.',
      consequences: 'Agile artisans were displaced, forced to adapt to intense factory work. Urban slums grew quickly, shifting society into structured industrial clocks.'
    },
    rev_internet: {
      id: 'rev_internet',
      title: 'The Silicon Information Networks',
      category: 'revolution',
      year: '1990 - Present',
      shortDesc: 'Drives marginal communication and publishing cost toward virtual zero.',
      connections: ['dotcom_2000', 'rev_ai'],
      narrative: 'Fiber-optic cables and computer silicon connected human minds globally. Information travel speed jumped from days to milliseconds, redefining business and communication.',
      consequences: 'Traditional newspapers and regional retail operations were upended. Individuals gained instant access to global knowledge, but traditional local community fabrics shifted digitally.'
    },
    rev_ai: {
      id: 'rev_ai',
      title: 'The Silicon Logic Revolution',
      category: 'revolution',
      year: '2022 - Present',
      shortDesc: 'Shifts cognitive processing from human brain hours to neural algorithms.',
      connections: ['era_2020s', 'rev_internet'],
      narrative: 'Large Language Models and deep neural nets began performing complex logical, analytical, and creative tasks, decoupling logical performance from biology.',
      consequences: 'Service desk jobs face deep automation pressures. Enterprise profit margins expand rapidly, sparking deep geopolitical contests to secure sub-3nm chip fabrication equipment.'
    },
    gold_std: {
      id: 'gold_std',
      title: 'The Golden Anchor Restraints',
      category: 'policy',
      year: '1870 - 1933',
      shortDesc: 'A strict monetary regime linking circulating paper direct to bullion vaults.',
      connections: ['dep_1929', 'bank_1930', 'dxy_nixon'],
      narrative: 'Under the classical Gold Standard, every printed ledger unit was backed by physical gold. While this limited consumer inflation, it also meant that during crises, the money supply could not be expanded to save failing banks.',
      consequences: 'This standard prioritized currency value over domestic employment, intensifying Great Depression pain by forcing painful wage contractions upon the population.'
    },
    glob_debt: {
      id: 'glob_debt',
      title: 'The Global Debt Sovereign Balloon',
      category: 'policy',
      year: '1971 - Present',
      shortDesc: 'Unbacked fiat systems allow public and corporate deficits to expand indefinitely.',
      connections: ['dxy_nixon', 'subprime_2008', 'era_2020s'],
      narrative: 'Free from gold limits, advanced nations accumulated massive debt loads. Total sovereign and corporate debt climbed above $300 trillion, heavily reliant on central bank liquidity support.',
      consequences: 'Sovereign policies became prisoner to interest rates; any sudden rate hike threatened government deficit funding, shifting systemic goals to steady inflation.'
    }
  };

  // ----------------------------------------------------
  // ERAS FOR THE ERA EXPLORER
  // ----------------------------------------------------
  const ERAS_EX_DATA = [
    {
      era: '1920s',
      name: 'The Speculative Leverage Boom',
      monetarySystem: 'Classical Gold Standard system (Rigid Anchor)',
      administration: 'Warren Harding / Calvin Coolidge (Laissez-faire deregulation style)',
      geopoliticalShift: 'Post-WWI isolationism; US emerges as prime capital creditor state',
      techRevolution: 'Automobile assembly lines, radio broadcasting networks, electrical lines',
      mainCrisis: 'The 1929 Great Wall Street crashes and widespread agricultural mortgage failures',
      narrative: 'A glorious dance of credit-fueled expansion. Retail speculators used margin accounts to buy shares, and agricultural regions suffered from debt overexpansion, setting the stage for the Great Wall Street Crash.',
      humanImpact: 'Middle-class families took on installment debts for refrigerators and cars. Main Street citizens borrowed heavily, setting up a brutal leverage reckoning.'
    },
    {
      era: '1930s',
      name: 'The Great Contraction & Dust Bowl',
      monetarySystem: 'Gold Standard fracturing (currency debasement devaluations)',
      administration: 'Herbert Hoover (orthodox austerity) / Franklin D. Roosevelt (New Deal State Intervention)',
      geopoliticalShift: 'Global rise of nationalist protectionism (tariffs) and militarist regimes',
      techRevolution: 'Industrial chemical fertilizers, synthetic rubber, early diesel transit engines',
      mainCrisis: 'Cascading fractional bank runs and sovereign credit debt freezes globally',
      narrative: 'A dark era of severe economic pain. As credit vaporized, banks collapsed and nations set up high tariff walls, drying up international commerce.',
      humanImpact: 'Bank runs wiped out lifelong savings. Farmers faced complete ruin as fertile crop lands dried to dust, forcing millions to migrate with nothing.'
    },
    {
      era: '1970s',
      name: 'The Stagflation & Fuel Embargo',
      monetarySystem: 'Unbacked Free Floating Fiat standard (The Nixon Shock)',
      administration: 'Richard Nixon (price limits) / Jimmy Carter (crisis of confidence) / Gerald Ford',
      geopoliticalShift: 'OPEC oil cartel dominance; cold war proxies escalate',
      techRevolution: 'Early microprocessors, automated containerized maritime transit ships',
      mainCrisis: 'The 1973 OPEC petroleum embargo and wage-price inflationary feedback loops',
      narrative: 'A decade of high consumer inflation accompanied by stalling economic growth. Decoupling the dollar from gold allowed governments to print money freely to fund domestic programs, driving oil and grocery costs up.',
      humanImpact: 'Mile-long lines at fuel stations became common. Standard savings lost half their real value in just six years, inducing constant financial stress for families.'
    },
    {
      era: '1980s',
      name: 'Supply-Side Economics & Hard Money',
      monetarySystem: 'Floating Fiat managed via active Federal interest rate gravity',
      administration: 'Ronald Reagan (tax cuts / defense deficit spend) / Margaret Thatcher',
      geopoliticalShift: 'De-escalation and subsequent collapse of the Soviet Union',
      techRevolution: 'Personal Desktop Computers (IBM PC / MS-DOS), early digital databases',
      mainCrisis: 'Super-high double digit interest rate induced farm debt crises and Savings & Loan failures',
      narrative: 'Under Paul Volcker, the Fed hiked rates to 20%+ to kill stagflation. Simultaneously, deregulatory policies cut taxes, fueling high corporate deficit spending.',
      humanImpact: 'Mortgages reached 18%, crushing prospective homebuyers. Unemployment peaked above 10% in industrial sectors before a major technology recovery.'
    },
    {
      era: '1990s',
      name: 'Information Age & Hyper-Globalization',
      monetarySystem: 'Strong US Dollar hegemony; global currency board structures',
      administration: 'Bill Clinton (balanced budgets, NAFTA trade liberalization)',
      geopoliticalShift: 'The Peace Dividend; China integrated into global WTO trade pipelines',
      techRevolution: 'Commercialization of World Wide Web, global fiber optic grids, GSM mobile phones',
      mainCrisis: 'The 1997 Asian Financial debt crisis, Russian default, and LTCM hedge fund collapse',
      narrative: 'The rise of the commercial internet triggered a massive tech bubble. Multi-national corporations outsourced manufacturing to lower-cost nations, keeping US inflation low while boosting tech stocks.',
      humanImpact: 'Industrial towns saw regional manufacturing jobs shipped overseas. Tech workers enjoyed stock option fortunes until the bubble burst in March 2000.'
    },
    {
      era: '2000s',
      name: 'The Housing Mania & Derivatives Crisis',
      monetarySystem: 'Floating Fiat backstopped by extreme central bank easing (Greenspan Put)',
      administration: 'George W. Bush (post-9/11 defense spends, tax cuts)',
      geopoliticalShift: 'Rise of global Middle East conflicts and China as manufacturing factory powerhouse',
      techRevolution: 'E-commerce logistics, early social media networks, consumer smartphones',
      mainCrisis: 'The Dotcom Crash (2000) followed by the massive Lehman Brothers Subprime Collapse (2008)',
      narrative: 'Unseasonably low interest rates fueled mortgage speculation. This led to Wall Street banks packaging high-risk home loans into toxic financial securities, culminating in the 2008 systemic crisis.',
      humanImpact: 'Over 8 million citizens lost their jobs. Foreclosures devastated neighborhoods, leaving families homeless of no fault of their own.'
    },
    {
      era: '2010s',
      name: 'The ZIRP & Quantitative Easing Era',
      monetarySystem: 'Helicopter Sovereign Asset purchases (QE) and Negative Interest rates (NIRP)',
      administration: 'Barack Obama (regulatory expansion) / Donald Trump (tariffs, corporate tax cuts)',
      geopoliticalShift: 'Global populist movements, rise of cloud and mobile-app monopoly giants',
      techRevolution: 'Gig economy platforms, multi-region cloud servers (AWS), early neural models',
      mainCrisis: 'Eurozone sovereign debt crisis & US debt ceiling credit de-ratings',
      narrative: 'Central banks flooded bond markets with printed digital currency. This kept borrow costs ultra-cheap, stimulating stock markets and housing prices while exacerbating wealth divides.',
      humanImpact: 'Young generations were priced out of buying homes, while asset-owning cohorts saw their net worth inflate, widening the wealth inequality gap.'
    },
    {
      era: '2020s',
      name: 'Post-Pandemic Inflation & The AI Era',
      monetarySystem: 'Heavy fiscal cash injections followed by rapid Fed interest rate rate hikes',
      administration: 'Joe Biden (Infrastructure, CHIPS Act green stimulus spends)',
      geopoliticalShift: 'Silicon semiconductor war controls, de-globalization friction, Russia conflict',
      techRevolution: 'Transformer AI deep compute clusters (LLMs), structural automation robotics',
      mainCrisis: 'Worst global consumer inflation surge in 40 years & rapid commercial bank collapses (SVB)',
      narrative: 'Massive relief packages met with physical supply bottlenecks, triggering extreme consumer price inflation. To combat this, the Fed raised rates at the fastest pace in decades, straining the financial system.',
      humanImpact: 'Groceries, child care, and rents outpaced standard wages, forcing working-class families onto credit card debt to survive daily living expenses.'
    }
  ];

  // ----------------------------------------------------
  // MARKET PSYCHOLOGY CYCLES
  // ----------------------------------------------------
  const PSYCHOLOGY_PHASES = {
    greed: {
      name: 'Greed & Euphoria (The Peak)',
      behavior: 'Speculators utilize maximum leverage to chase returns, believing "this time is different."',
      metric: 'Retail margin accounts hit record highs; junk bonds trade at tiny spreads to safe asset bills.',
      quote: '"We are in a new permanent paradigm. The old economic gravity rules no longer apply here."',
      indicator: 'Extreme Euphoria',
      domino: 'Venture funds chase unprofitable pre-revenue ideas -> Asset prices swell -> Average citizens copy using retirement funds.'
    },
    anxiety: {
      name: 'Anxiety & Doubt (The Crack)',
      behavior: 'Smart capital quietly exits. Marginal interest rates creep up, and structural credit lines begin tightening.',
      metric: 'Credit defaults increase; stock market volume drops as institutional players take safe profits.',
      quote: '"It is just a healthy minor correction. The system remains fundamentally stable."',
      indicator: 'Underlying Strain',
      domino: 'Bond yields rise -> Asset prices flatten -> Highly leveraged players borrow more to cover interest costs.'
    },
    panic: {
      name: 'Panic & Capitulation (The Crash)',
      behavior: 'Margin calls spark cascading liquidation. Buyers vanish, and credit spreads balloon.',
      metric: 'VIX volatility index reaches record highs; transaction volumes freeze as trust vaporizes.',
      quote: '"Sell everything! Get me out at any price! Cash is king!"',
      indicator: 'Extreme Panic',
      domino: 'Brokers trigger automatic stock sales -> Systemic panic spreads -> Businesses fire staff to preserve remaining cash.'
    },
    depression: {
      name: 'Depression & Despair (The Bottom)',
      behavior: 'Apathy and skepticism rule are entrenched. Society vows never to return to the markets.',
      metric: 'Asset prices hit historic lows; cash reserves dominate portfolios.',
      quote: '"The markets are a rigged casino. No one can ever recover fortunes here."',
      indicator: 'Extreme Despair',
      domino: 'Asset prices bottom out -> Smart money slowly begins accumulation -> The stage is quietly set for the next cycle.'
    }
  };

  // ----------------------------------------------------
  // DXY MACRO DOCUMENTARY TIMELINE
  // ----------------------------------------------------
  const DXY_DOCUMENTARY_TIMELINE = [
    {
      year: '1971',
      title: 'Nixon Shock decoupling',
      dxyVal: '120.5',
      rate: '5.75%',
      fedPolicy: 'Gold depeg',
      narrative: 'President Nixon closes the gold window, floating the USD. The dollar declines, causing intense concern among foreign trading partners holding US cash.',
      commentary: 'With the gold backing removed, federal deficits could expand. This freed government budgets but permanently exposed the public to long-term purchasing power erosion.'
    },
    {
      year: '1979',
      title: 'The Great Inflation Peak',
      dxyVal: '85.2',
      rate: '12.0%',
      fedPolicy: 'Emergency Tightening',
      narrative: 'Entrenched inflation and political turmoil drive the DXY down, sparking an existential crisis for the global cash reserve benchmark.',
      commentary: 'Urgent action is needed to save the USD. Paul Volcker takes control at the Fed, preparing to apply aggressive interest rate medicine.'
    },
    {
      year: '1985',
      title: 'The Plaza Accord peak',
      dxyVal: '164.7',
      rate: '7.50%',
      fedPolicy: 'Plaza Intervention',
      narrative: 'Super-high interest rates drive capital into the US, pushing the DXY to historical records. This strains US export competitiveness.',
      commentary: 'Global powers intervene, signing the Plaza Accord to weaken the overvalued US Dollar and restore balance in international trade.'
    },
    {
      year: '2001',
      title: 'The Safe-Haven flight',
      dxyVal: '118.9',
      rate: '1.75%',
      fedPolicy: 'Post-Dotcom Easing',
      narrative: 'The Dotcom bust and geopolitical tensions spark a safe-haven flight into the US Dollar index.',
      commentary: 'To counter the tech crash, the Fed slashes interest rates, planting the seeds of the subprime mortgage housing bubble.'
    },
    {
      year: '2008',
      title: 'The Subprime Bottom',
      dxyVal: '71.3',
      rate: '0.25%',
      fedPolicy: 'ZIRP / Launch of QE',
      narrative: 'As Lehman Brothers cascades, the DXY hits record lows before an emergency dollar shortage spikes standard demand again.',
      commentary: 'The Fed initiates quantitative easing, flooding global markets with cheap cash to bail out the banking sector.'
    },
    {
      year: '2022',
      title: 'The Post-QE rate hikes',
      dxyVal: '114.2',
      rate: '4.25%',
      fedPolicy: 'Extreme Hiking Cycle',
      narrative: 'Faced with rising consumer price inflation, the Fed launches its fastest interest rate hikes in forty years, driving the DXY up.',
      commentary: 'A soaring DXY draws foreign capital to the US, squeeze-pricing emerging market dollard-denominated debt and inflating global imports.'
    },
    {
      year: '2026',
      title: 'The Sovereign AI Engine Era',
      dxyVal: '106.8',
      rate: '4.50%',
      fedPolicy: 'Digital Reserve Pegs',
      narrative: 'The global power game shifts to securing computational silicon hubs. The USD Index remains supported by treasury yields as tech keeps capital flows active.',
      commentary: 'Sovereign entities realize that backing money with energy and microchips is key to stabilizing modern fiat assets.'
    }
  ];

  // ----------------------------------------------------
  // DOMINO EFFECT CHAINS
  // ----------------------------------------------------
  const DOMINO_CHAINS = {
    rates: {
      title: 'Fed Interest Rate Shift Cascade',
      trigger: 'The Federal Reserve hikes the discount rate by 75 basis points to slow an inflating real economy.',
      steps: [
        { title: 'Prime Rate Creep', desc: 'Commercial banks instantly increase base interest rates for retail auto loans and consumer credit lines.' },
        { title: 'Mortgage Cost Spike', desc: 'Standard 30-year housing interest rates climb, making home buyer payments unaffordable.' },
        { title: 'Housing Demand Chill', desc: 'Prospective buyers exit the market, building projects stall, and home builders reduce material orders.' },
        { title: 'Construction Layoffs', desc: 'Contractors lay off crews, driving down service industry spending in local economies.' },
        { title: 'Sovereign Yield Pressures', desc: 'Yields on short-term Treasury bills spike, attracting foreign capital but straining government budget deficits.' }
      ]
    },
    oil: {
      title: 'Energy Fuel Price Shock Domino',
      trigger: 'Geopolitical disruption in key shipping channels chokes petroleum supply routes.',
      steps: [
        { title: 'Crude Oil Surge', desc: 'Spot prices of crude climb 35% in days as refineries bid to secure remaining shipments.' },
        { title: 'Freight Surcharges Jump', desc: 'Aviation, cargo ship, and long-haul shipping lines implement emergency fuel surcharges.' },
        { title: 'Grocery Price inflation', desc: 'Transporting grain, milk, and basic items to stores becomes expensive, driving up shelf prices.' },
        { title: 'Consumer Spending Squeeze', desc: 'Families spend more on heating and fuel, forcing them to cut back on restaurant and retail spending.' },
        { title: 'Central Bank Tightening', desc: 'To prevent inflation from embedding in wages, the Fed raises rates, applying further pressure.' }
      ]
    },
    ai: {
      title: 'Silicon Cognitive Automation Cascade',
      trigger: 'Large neural compute systems scale to human cognitive capabilities.',
      steps: [
        { title: 'Logic Costs Plunge', desc: 'The marginal cost of coding, writing, and analyzing data drops to near-zero.' },
        { title: 'Enterprise Profit Surge', desc: 'Mega corporations replace expensive contracting firms with automated agents, driving profit margins up.' },
        { title: 'White-Collar Displacement', desc: 'Entry-level office, copywriting, and legal tasks face structural workforce displacement.' },
        { title: 'Sovereign Tax Base Squeeze', desc: 'States face shrinking income tax collections, raising pressure to implement AI compute taxes.' },
        { title: 'Resource Demands Climb', desc: 'Data centers consume enormous amounts of energy, putting rotative strain on electrical grids.' }
      ]
    },
    money: {
      title: 'Helicopter Monetary Stimulus Loop',
      trigger: 'The sovereign Treasury prints physical and digital currency, distributing deposits to households.',
      steps: [
        { title: 'Bank Vault Floods', desc: 'Commercial banking systems receive a flood of capital, driving overnight reserve lending rates down.' },
        { title: 'Risk-Asset Speculation', desc: 'Excess cash flows into stocks, crypto, and properties, inflating valuations.' },
        { title: 'Purchasing Power Decay', desc: 'The high volume of currency units chasing fixed goods drives up prices, diminishing cash value.' },
        { title: 'Cost of Living Stress', desc: 'Underprivileged households suffer as basic staples rise faster than industrial wages.' },
        { title: 'Aggressive Interventions', desc: 'Faced with public unrest, the Fed is forced to raise interest rates, tightening the screws.' }
      ]
    }
  };

  // ----------------------------------------------------
  // CORPORATE HISTORY
  // ----------------------------------------------------
  const LIVING_STOCKS_DATA = {
    msft: {
      name: 'Microsoft Corp. (MSFT)',
      revenue: '$245 Billion',
      foundation: 'Founded in 1975 by Gates & Allen to put "a computer on every desk and in every home."',
      eras: [
        { eraName: '1980s PC Launch', desc: 'Microsoft designs MS-DOS for IBM personal computers, securing a licensing deal that charges a fee for every computer sold globally.' },
        { eraName: '1990s Desktop Monopoly', desc: 'Windows Windows 95 and Windows 98 merge software utilities and the Internet Explorer browser, dominating 95%+ of global desktop operating environments.' },
        { eraName: '2010s Cloud-First Pivot', desc: 'Under Satya Nadella, MSFT moves away from desktop limits, pivoting to Azure cloud servers and subscription Office models, restoring its technology throne.' },
        { eraName: '2025 AI Copilot Era', desc: 'Microsoft partners with OpenAI, investing tens of billions to secure advanced neural model software across corporate environments.' }
      ]
    },
    nvda: {
      name: 'NVIDIA Corporation (NVDA)',
      revenue: '$96 Billion',
      foundation: 'Founded in 1993 to pioneer 3D graphics hardware acceleration for gaming and enterprise design.',
      eras: [
        { eraName: '1990s Gaming Accelerators', desc: 'Invented the Graphics Processing Unit (GPU), launching GeForce chips to power real-time 3D physics rendering in computer games.' },
        { eraName: '2012 CUDA compute pivot', desc: 'Jensen Huang bets the company on CUDA, a software platform allowing GPUs to run complex mathematical calculations alongside CPUs, laying the foundation for modern AI.' },
        { eraName: '2018 Crypto Mining Wave', desc: 'Digital currencies scale. Millions of NVDA GPUs are bought by crypto miners, driving hardware prices and revenues up.' },
        { eraName: '2020s Tensor GPU Hegemony', desc: 'AI models scale up. Nvidia commands 90%+ share of the advanced AI chip market, with massive server blocks powering the logic engine.' }
      ]
    },
    aapl: {
      name: 'Apple Inc. (AAPL)',
      revenue: '$385 Billion',
      foundation: 'Founded in 1976 by Jobs & Wozniak, starting in a family garage in Silicon Valley.',
      eras: [
        { eraName: '1980s Mac Macintosh', desc: 'Launch of the first consumer-friendly GUI computer with an elegant desktop mouse, introducing intuitive digital design.' },
        { eraName: '1997 Near Bankruptcy', desc: 'Struggling with intense Windows competition, Steve Jobs returns to introduce colorful iMacs, salvaging the brand.' },
        { eraName: '2007 Mobile iPhone Shift', desc: 'Apple reinvents computing, launching the multi-touch iPhone. It spawns the app-developer economy and delivers unprecedented cash reserves.' },
        { eraName: '2020s High-Margin Ecosystem', desc: 'Moves toward high-margin services (Apple Pay, iCloud) and advanced custom chips (Apple Silicon), securing deep customer retention.' }
      ]
    },
    amzn: {
      name: 'Amazon.com Inc. (AMZN)',
      revenue: '$570 Billion',
      foundation: 'Founded in 1995 by Jeff Bezos, starting as an online bookstore in a garage in Seattle.',
      eras: [
        { eraName: '1990s Bookstore Origins', desc: 'Starts with online books, undercutting local stores and reinvesting all revenues to scale infrastructure.' },
        { eraName: '2000 Dot-Com Defiance', desc: 'Survives the tech crash, securing critical bond financing just before capital markets closed, and expands beyond books.' },
        { eraName: '2006 AWS Cloud Innovation', desc: 'Launches Amazon Web Services (AWS), renting out server space and creating the software foundation for the modern internet.' },
        { eraName: '2020s Robotic Logistics', desc: 'Operates automated warehouses with advanced robotics, utilizing custom AI sorting networks to deliver goods globally.' }
      ]
    }
  };

  // ----------------------------------------------------
  // GLOBAL POWER REGIONS
  // ----------------------------------------------------
  const GLOBAL_POWER_DATA = {
    us: {
      nation: 'United States of America',
      moats: [
        { title: 'Global Reserve Currency (USD)', detail: 'Provides the ability to issue debt in domestic cash, borrowing from foreign states without currency collapse risk.' },
        { title: 'Silicon IP Control Labs', desc: 'Deep financial ecosystems and software labs (Windows, AWS, OpenAI, Google) dominate technology stacks.' },
        { title: 'Two-Ocean Geographic Moat', desc: 'Flanked by oceans, insulating domestic production from devastating foreign kinetic conflicts.' }
      ],
      interconnectivity: 'US consumer demand drives global export factories, anchored by deep capital markets in New York.'
    },
    china: {
      nation: 'People Republic of China',
      moats: [
        { title: 'Supply Chain Cluster Hegemony', detail: 'Consolidating components, refining, and assembly in strategic industrial cities to minimize logistics friction.' },
        { title: '90%+ Rare Earth Magnet refining', desc: 'Dominating structural extraction and processing of materials needed for clean engines and defense defense.' },
        { title: 'High-Speed Infrastructure Corridor', desc: 'State-funded high-speed networks and deep automated ports facilitate rapid assembly shipping.' }
      ],
      interconnectivity: 'Consumes enormous raw commodities (iron, copper, energy) to export finished electronics and batteries.'
    },
    mideast: {
      nation: 'Middle Eastern Energy Axis',
      moats: [
        { title: 'Ultra-Low Oil Extraction Cost', detail: 'Securing oil deposits with lifting costs below $10 a barrel, generating immense sovereign wealth reserves.' },
        { title: 'Oceanic Transport choke points', desc: 'Direct control of vulnerable trade choke points (Strait of Hormuz, Bab-el-Mandeb Reefs).' },
        { title: 'Petrodollar recycling reserves', desc: 'Investing fuel asset earnings back into liquid Western bonds, maintaining global leverage.' }
      ],
      interconnectivity: 'Directly influences worldwide gas prices, food transport costs, and sovereign wealth reserves.'
    },
    europe: {
      nation: 'European Trade and Regulatory Basin',
      moats: [
        { title: 'Global Regulatory standards', detail: 'Setting stringent safety and trade guidelines (GDPR, Carbon taxes) that force global companies to comply.' },
        { title: 'Extreme-Precision Tooling (ASML)', desc: 'Hosting ASML, the sole global builder of extreme-ultraviolet lithography tools needed for sub-5nm chips.' },
        { title: 'Pristine Legal Security frameworks', desc: 'Offering deeply safe legal structures that protect generational private wealth.' }
      ],
      interconnectivity: 'Acts as a major consumer of energy imports, specializing in pharmaceutical and precision automotive exports.'
    }
  };

  // ----------------------------------------------------
  // FUTURE MEMORY SIMULATOR SCENARIOS
  // ----------------------------------------------------
  const FUTURE_SIMULATIONS = {
    ai_dividend: {
      title: 'The AI-Fueled Sovereign Dividend',
      premise: 'All software logic and basic coding shift to zero-labor silicon agencies. Corporate earnings reach historic highs while white-collar income tax collapses.',
      simCode: 'SIM_STATE_DIVIDEND_PROJ',
      logs: [
        'Calculating corporate tax yields at 85% automation capacity...',
        'Systemic Deficit Alert: Income tax base down 62%.',
        'Deploying Sovereign Silicon Compute Tax (1.2 cents per billion tokens)...',
        'Distributing Universal Basic Dividend to 330M citizen accounts...',
        'Consumer Spending stabilized; credit default rates collapse to zero.',
        'Sovereign Bond yields re-anchored on automation output indices.'
      ],
      consequence: 'Standard families receive automated monthly cash dividends. Rarity shifts from labor hours to geographic physical real estate and mineral land rights, entirely restructuring the social contract.'
    },
    neo_barter: {
      title: 'Digital Resource-Backed Currencies',
      premise: 'Persistent debt expansion erases trust in unbacked paper fiat cash. Global commerce transitions to real-time resource baskets.',
      simCode: 'CRYPT_RESOURCE_LEDGER_A',
      logs: [
        'De-pegging unbacked paper deposits from settlement channels...',
        'Synthesizing resource basket: 40% Megawatts, 30% Grain, 30% Lithium.',
        'Initializing high-throughput ledger for micro-second physical trades...',
        'Securing global settlements across sovereign nodes...',
        'Hedging consumer electronics to real-time silicon processing capacities.',
        'Unbacked sovereign debt values adjusted downward by 75%.'
      ],
      consequence: 'Money is no longer printed by decree. Your bank wallet represents direct fraction ownership of global power gigawatts, grain elevators, and silicon. Inflation drops to zero, but national debt spending is halted.'
    },
    robotic_onshoring: {
      title: 'Robotic Factory Onshoring Supergroups',
      premise: 'Vulnerable maritime maritime supply chains force western powers to completely end foreign assembly dependency.',
      simCode: 'ONSHORE_ROBOTIC_FLOWS',
      logs: [
        'Triggering naval bottleneck container shipping freeze...',
        'Funding automated micro-factories in regional geographic zones...',
        'Deploying humanoid assembly robotic lines at 24-hour schedules...',
        'Onshoring semiconductor packaging and lithium-battery lines...',
        'Abolishing blue-collar offshore labor costs from the supply chain.',
        'Tariff rates set to 100% on foreign-manufactured industrial steel.'
      ],
      consequence: 'Products are manufactured within domestic borders by robotic limbs. Inflation in consumer goods drops, but emerging manufacturing countries face deep recessions, altering geopolitical dynamics permanently.'
    },
    energy_grid: {
      title: 'The Energy Grid Bottleneck Crisis',
      premise: 'Colossal AI data centers and massive electric vehicle charging demands exhaust local green electrical grids.',
      simCode: 'GRID_THERMAL_CAPACITY_SHK',
      logs: [
        'AI data center power usage spikes to 42% of national capacity...',
        'Thermal plant cooling vaults trigger emergency temperature alerts...',
        'Implementing regional rotational brownouts for household sectors...',
        'Bidding base electricity price to peak commercial rates ($1.85 / kWh)...',
        'Sovereign priority: Diverting power to medical grids & public safety...',
        'Data center compute queues slowed down to prevent grid failure.'
      ],
      consequence: 'Power becomes the absolute ultimate resource. Households face high utility bills and are restricted to specific charging schedules, linking real-world quality of life directly to localized copper grid output.'
    }
  };

  const activeNode = MEMORY_NODES[selectedNodeId] || MEMORY_NODES['dep_1929'];
  const activeEraData = ERAS_EX_DATA[selectedEraIndex];
  const activePsychData = PSYCHOLOGY_PHASES[activePsychPhase];
  const activeDxyItem = DXY_DOCUMENTARY_TIMELINE[dxyTimelineIndex];
  const activeDominoChainData = DOMINO_CHAINS[activeDominoChain];
  const activeStockData = LIVING_STOCKS_DATA[selectedStock];
  const activePowerData = GLOBAL_POWER_DATA[selectedPowerRegion];
  const activeFutureData = FUTURE_SIMULATIONS[selectedFutureSim];

  return (
    <div className="flex flex-col gap-6 font-sans select-none animate-fadeIn select-text pb-12">
      {/* 
        =========================================
        TOP CINEMATIC BANNER
        =========================================
      */}
      <div className="p-8 bg-gradient-to-r from-purple-950/30 to-black/80 border border-purple-500/20 rounded-3xl relative overflow-hidden card-custom-shadow">
        <div className="absolute inset-0 bg-purple-500/[0.015] pointer-events-none" />
        <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-purple-400 font-extrabold block mb-1">
          THE DIGITAL MEMORY SYSTEM OF GLOBAL MARKETS • TIME MODULES
        </span>
        <h2 className="text-white font-black text-2xl tracking-tight uppercase">
          Economic Memory Matrix & Living Archive
        </h2>
        <p className="text-zinc-400 text-xs mt-2 max-w-[700px] leading-relaxed">
          Step inside a living time machine for the global economy. Travel through historical market eras, 
          explore systemic domino cascades, map real human consequence layers, and simulate future digital civilization infrastructure.
        </p>

        {/* 18+ Regulatory disclaimer inside the matrix banner to fulfill system legal standards */}
        <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-4 items-center text-left">
          <div className="flex items-center gap-1.5 text-rose-450 text-rose-400 font-mono text-[8px] font-black tracking-wider uppercase border border-rose-500/20 bg-rose-500/5 px-2 py-0.5 rounded-md" id="m1">
            <Shield className="w-3 h-3" />
            18+ Educational Platform
          </div>
          <p className="text-[10px] font-mono text-zinc-500" id="m2">
            Trading and financial markets involve risk. Educational use only.
          </p>
        </div>
      </div>

      {/* 
        =========================================
        SYSTEM TAB SWITCHERS (CINEMATIC NEON CARDS)
        =========================================
      */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { id: 'matrix', label: 'Memory Matrix', icon: <History className="w-4 h-4" />, color: 'hover:border-purple-500/30' },
          { id: 'explorer', label: 'The Era Explorer', icon: <Calendar className="w-4 h-4" />, color: 'hover:border-amber-500/30' },
          { id: 'psychology', label: 'Market Psychology', icon: <Smile className="w-4 h-4" />, color: 'hover:border-rose-500/30' },
          { id: 'dxy', label: 'DXY Documentary', icon: <DollarSign className="w-4 h-4" />, color: 'hover:border-[#00D9FF]/30' },
          { id: 'domino', label: 'Domino Cascade', icon: <Workflow className="w-4 h-4" />, color: 'hover:border-emerald-500/30' },
          { id: 'stocks', label: 'Corporate Lifespans', icon: <Building className="w-4 h-4" />, color: 'hover:border-indigo-500/30' },
          { id: 'power', label: 'Global Power Map', icon: <Globe className="w-4 h-4" />, color: 'hover:border-pink-500/30' },
          { id: 'future', label: 'Future Explorer', icon: <Cpu className="w-4 h-4" />, color: 'hover:border-amber-400/30' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-left transition-all duration-300 btn-custom-nav ${
              activeTab === tab.id 
                ? 'bg-white/5 border-purple-500/50 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)] font-bold' 
                : 'bg-black/40 border-white/5 text-zinc-400 hover:text-zinc-200 ' + tab.color
            }`}
          >
            {tab.icon}
            <span className="text-xs tracking-tight">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* 
        =========================================
        TAB 1: THE ECONOMIC MEMORY MATRIX
        =========================================
      */}
      {activeTab === 'matrix' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Node Directory Sidebar */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            <div className="p-4 rounded-2xl border border-white/5 bg-[#030712]/60 backdrop-blur-xl">
              <span className="font-mono text-[8px] font-black text-purple-400 uppercase tracking-widest block mb-2">
                INDEX SYSTEM NODES
              </span>
              <p className="text-zinc-400 text-[11px]">
                Click nodes to view their causal linkages across economic history.
              </p>
            </div>

            <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.values(MEMORY_NODES).map((node) => {
                const categoryColors = {
                  era: 'border-amber-500/20 bg-amber-500/5 text-amber-300',
                  bubble: 'border-rose-500/20 bg-rose-500/5 text-rose-300',
                  crisis: 'border-red-500/20 bg-red-500/5 text-red-300',
                  revolution: 'border-cyan-500/20 bg-cyan-500/5 text-[#00D9FF]',
                  policy: 'border-indigo-500/20 bg-indigo-500/5 text-indigo-300'
                };

                return (
                  <button
                    key={node.id}
                    onClick={() => setSelectedNodeId(node.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all duration-300 ${
                      selectedNodeId === node.id 
                        ? 'bg-purple-950/20 border-purple-500/50 text-white shadow-md' 
                        : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/[0.02] hover:border-white/10'
                    }`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] font-mono tracking-wider text-zinc-500">{node.year}</span>
                      <span className={`text-[8px] font-mono uppercase px-1.5 py-0.5 rounded border ${categoryColors[node.category]}`}>
                        {node.category}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{node.title}</h4>
                    <p className="text-[10.5px] text-zinc-400 line-clamp-1 mt-1 leading-snug">{node.shortDesc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Node Relationship View */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="p-6 rounded-2xl border border-white/5 bg-[#030712]/75 backdrop-blur-xl flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div className="flex items-center gap-2">
                    <History className="w-5 h-5 text-purple-400 animate-pulse" />
                    <div>
                      <span className="font-mono text-[8px] font-bold tracking-widest text-[#00D9FF]">MATRIX RECORD</span>
                      <h3 className="text-white font-black text-lg tracking-tight uppercase">{activeNode.title}</h3>
                    </div>
                  </div>
                  <span className="font-mono text-xs text-zinc-400 font-bold px-2.5 py-1 bg-white/5 rounded-lg">
                    {activeNode.year}
                  </span>
                </div>

                {/* Primary Narrative */}
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[9px] font-mono uppercase font-black text-zinc-500 tracking-widest mb-1.5">
                      Systemic Genesis Narrative
                    </h4>
                    <p className="text-zinc-300 text-[12.5px] leading-relaxed select-text">
                      {activeNode.narrative}
                    </p>
                  </div>

                  {/* HUMAN CONSEQUENCE INJECTOR */}
                  <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.02] mt-4">
                    <div className="flex gap-2 items-start">
                      <Users className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-[9.5px] font-mono uppercase font-black text-rose-400 tracking-wider mb-1">
                          Human Consequence Layer (Impact Story)
                        </h4>
                        <p className="text-zinc-350 text-[11.5px] leading-relaxed font-sans">
                          {activeNode.consequences}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interconnection Pipeline */}
              <div className="mt-6 pt-4 border-t border-white/5">
                <span className="text-[8px] font-mono uppercase font-bold text-zinc-500 tracking-widest block mb-2">
                  INTERCONNECTED SYSTEMIC CAUSAL LINKAGES
                </span>
                <div className="flex flex-wrap gap-2 text-xs">
                  {activeNode.connections.map((connId) => {
                    const connNode = MEMORY_NODES[connId];
                    if (!connNode) return null;
                    return (
                      <button
                        key={connId}
                        onClick={() => setSelectedNodeId(connId)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/40 text-purple-300 text-[11px] transition-all duration-300"
                      >
                        <span>{connNode.title}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 
        =========================================
        TAB 2: THE ERA EXPLORER (TIME MACHINE)
        =========================================
      */}
      {activeTab === 'explorer' && (
        <div className="flex flex-col gap-6 animate-fadeIn">
          {/* Decade Stepper Timeline */}
          <div className="flex border-b border-white/5 pb-4 overflow-x-auto gap-4 scrollbar-none">
            {ERAS_EX_DATA.map((era, idx) => (
              <button
                key={era.era}
                onClick={() => setSelectedEraIndex(idx)}
                className={`flex flex-col items-start gap-1 py-2 px-4 rounded-xl border transition-all duration-300 min-w-[130px] shrink-0 text-left ${
                  selectedEraIndex === idx 
                    ? 'bg-amber-600/10 border-amber-500/50 text-white' 
                    : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.01]'
                }`}
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-base font-black tracking-tight">{era.era}</span>
                </div>
                <span className="text-[9.5px] line-clamp-1">{era.name}</span>
              </button>
            ))}
          </div>

          {/* Time Machine Readout Console */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Narrative Panel */}
            <div className="lg:col-span-7 p-6 rounded-2xl border border-white/5 bg-[#030712]/75 backdrop-blur-xl flex flex-col gap-5 justify-between">
              <div>
                <span className="font-mono text-[8px] font-black text-amber-400 uppercase tracking-widest block mb-1">
                  TIME SHIP NAVIGATION RECONSTRUCT
                </span>
                <h3 className="text-white font-extrabold text-xl tracking-tight uppercase mb-1">
                  The {activeEraData.era} Epoch: {activeEraData.name}
                </h3>
                <p className="text-zinc-400 text-xs leading-relaxed select-text">
                  {activeEraData.narrative}
                </p>
              </div>

              {/* Humanity Impact Feature */}
              <div className="p-4 rounded-xl border border-amber-500/15 bg-amber-500/[0.02]">
                <div className="flex gap-2.5 items-start">
                  <Users className="w-4 h-5 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                  <div>
                    <h4 className="text-[10px] font-mono font-black uppercase text-amber-300 tracking-wide mb-1">
                      The Living Cost / Personal Consequences
                    </h4>
                    <p className="text-zinc-300 text-[12px] leading-relaxed">
                      {activeEraData.humanImpact}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right System Specifications Panel */}
            <div className="lg:col-span-5 p-6 rounded-2xl border border-white/5 bg-black/60 flex flex-col gap-4">
              <span className="font-mono text-[8px] font-black text-zinc-500 uppercase tracking-widest block">
                SYSTEM SPECIFICATIONS BY PERIOD
              </span>

              <div className="space-y-3 font-mono text-[11px] text-zinc-400">
                <div className="p-3.5 bg-white/[0.015] border border-white/5 rounded-xl">
                  <span className="text-zinc-500 text-[8.5px] block uppercase font-bold tracking-wider mb-1">
                    MONETARY BASE gravity
                  </span>
                  <span className="text-zinc-200 text-xs font-bold leading-normal">{activeEraData.monetarySystem}</span>
                </div>

                <div className="p-3.5 bg-white/[0.015] border border-white/5 rounded-xl">
                  <span className="text-zinc-500 text-[8.5px] block uppercase font-bold tracking-wider mb-1">
                    ADMINISTRATION & SOVEREIGN POSTURE
                  </span>
                  <span className="text-zinc-200 text-xs font-bold leading-normal">{activeEraData.administration}</span>
                </div>

                <div className="p-3.5 bg-white/[0.015] border border-white/5 rounded-xl">
                  <span className="text-zinc-500 text-[8.5px] block uppercase font-bold tracking-wider mb-1">
                    PLANETARY GEOPOLITICAL TRANSFORMATION
                  </span>
                  <span className="text-zinc-200 text-xs font-bold leading-normal">{activeEraData.geopoliticalShift}</span>
                </div>

                <div className="p-3.5 bg-white/[0.015] border border-white/5 rounded-xl">
                  <span className="text-zinc-500 text-[8.5px] block uppercase font-bold tracking-wider mb-1">
                    PRODUCTION & TECHNOLOGY REVOLUTION
                  </span>
                  <span className="text-indigo-300 text-xs font-bold leading-normal">{activeEraData.techRevolution}</span>
                </div>

                <div className="p-3.5 bg-red-950/10 border border-red-950/40 rounded-xl">
                  <span className="text-red-450 text-red-400 text-[8.5px] block uppercase font-bold tracking-wider mb-1">
                    CRITICAL COLLAPSE REGISTRY
                  </span>
                  <span className="text-red-300 text-xs font-bold leading-normal">{activeEraData.mainCrisis}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 
        =========================================
        TAB 3: THE MARKET PSYCHOLOGY ARCHIVE
        =========================================
      */}
      {activeTab === 'psychology' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left Cycle Controls */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-4 bg-[#030712]/60 rounded-2xl border border-white/5">
              <span className="font-mono text-[8px] font-black text-rose-400 uppercase tracking-widest block mb-1">
                EMOTIONAL ENGINES
              </span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Human emotion drives macro liquidity pricing. Witness how speculative sentiment manifests.
              </p>
            </div>

            {[
              { id: 'greed', label: '1. Greed & Euphoria (The Peak)', quote: 'FOMO, leverage excess', color: 'border-emerald-500/20 text-emerald-300' },
              { id: 'anxiety', label: '2. Anxiety & Doubt (The Crack)', quote: 'Exits, quiet margin increases', color: 'border-yellow-500/20 text-yellow-300' },
              { id: 'panic', label: '3. Panic & Liquidation (The Crash)', quote: 'Fire-sales, leverage margin hit', color: 'border-red-500/20 text-red-300' },
              { id: 'depression', label: '4. Depression & Despair (The Bottom)', quote: 'Skepticism, apathy, accumulation', color: 'border-blue-500/20 text-blue-300' }
            ].map((phase) => (
              <button
                key={phase.id}
                onClick={() => setActivePsychPhase(phase.id as any)}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  activePsychPhase === phase.id
                    ? 'bg-rose-950/20 border-rose-500/50 text-white shadow-lg'
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/[0.01] hover:border-white/10'
                }`}
              >
                <h4 className="text-xs font-bold tracking-tight mb-1">{phase.label}</h4>
                <p className="font-mono text-[9.5px] text-zinc-500 truncate italic">{phase.quote}</p>
              </button>
            ))}
          </div>

          {/* Right Immersive Visualization */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <div className="p-6 rounded-2xl border border-white/5 bg-[#030712]/75 backdrop-blur-xl flex-1 flex flex-col justify-between gap-6">
              <div>
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <Smile className="w-5 h-5 text-rose-400 animate-bounce" style={{ animationDuration: '3s' }} />
                    <div>
                      <span className="font-mono text-[8px] font-bold tracking-widest text-zinc-500 uppercase">
                        PSYCHOLOGICAL INDEX
                      </span>
                      <h3 className="text-white font-black text-lg tracking-tight uppercase">
                        {activePsychData.name}
                      </h3>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] uppercase font-bold text-rose-400 px-3 py-1 bg-rose-500/10 rounded-lg animate-pulse">
                    {activePsychData.indicator}
                  </span>
                </div>

                {/* Behavioral Details & Metric */}
                <div className="space-y-4">
                  <div className="p-4 bg-white/[0.015] border border-white/5 rounded-xl">
                    <span className="font-mono text-[8.5px] uppercase text-zinc-500 block mb-1">
                      CYCLE BEHAVIOR OBSERVED
                    </span>
                    <p className="text-zinc-200 text-xs leading-relaxed font-sans">{activePsychData.behavior}</p>
                  </div>

                  <div className="p-4 bg-white/[0.015] border border-white/5 rounded-xl">
                    <span className="font-mono text-[8.5px] uppercase text-zinc-500 block mb-1">
                      SYSTEMIC QUANTITATIVE INDICATOR
                    </span>
                    <p className="text-zinc-200 text-xs leading-relaxed font-sans">{activePsychData.metric}</p>
                  </div>
                </div>
              </div>

              {/* Large quote panel emphasizing human irrationality */}
              <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.02] border-l-4 border-l-rose-500">
                <p className="font-mono text-zinc-300 text-xs md:text-sm line-clamp-3 leading-relaxed">
                  {activePsychData.quote}
                </p>
                <span className="text-[11px] block mt-2 text-zinc-500 uppercase font-mono font-bold">
                  — COLLECTIVE CROWD MIND
                </span>
              </div>

              {/* Cascade effects on Main Street */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/40">
                <span className="text-[8px] font-mono uppercase font-black text-zinc-500 block mb-1">
                  PSYCHOLOGY PROPAGATION CASCADE (CROWD EFFECT)
                </span>
                <p className="text-rose-350 text-[11px] leading-relaxed font-mono">
                  {activePsychData.domino}
                </p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 
        =========================================
        TAB 4: THE DXY HISTORY EXPERIENCE
        =========================================
      */}
      {activeTab === 'dxy' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left panel play/pause controls and index tracker */}
          <div className="lg:col-span-5 p-6 rounded-2xl border border-white/5 bg-[#030712]/75 backdrop-blur-xl flex flex-col justify-between min-h-[420px]">
            <div>
              <span className="font-mono text-[8px] font-black text-[#00D9FF] uppercase tracking-widest block mb-1">
                MACRO DOCUMENTARY PLAYER
              </span>
              <h3 className="text-white font-black text-lg tracking-tight uppercase mb-2">
                DXY Historical Observatory
              </h3>
              <p className="text-zinc-400 text-xs leading-relaxed mb-6">
                Cycle through historic eras from 1971 to 2026. Watch how unbacked monetary expansion, interest pricing hikes, 
                and geopolitical shocks adjust the sovereign index value.
              </p>

              {/* Playback Controls */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setIsPlayingDxy(!isPlayingDxy)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold transition-all duration-300 ${
                    isPlayingDxy 
                      ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300' 
                      : 'bg-[#00D9FF]/10 border border-[#00D9FF]/20 text-[#00D9FF] hover:bg-[#00D9FF]/20'
                  }`}
                >
                  {isPlayingDxy ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  <span>{isPlayingDxy ? 'PAUSE FEED' : 'PLAY TIMELINE'}</span>
                </button>
                <button
                  onClick={() => {
                    setDxyTimelineIndex((prev) => (prev >= DXY_DOCUMENTARY_TIMELINE.length - 1 ? 0 : prev + 1));
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-mono font-medium border border-white/5 text-zinc-400 hover:text-white hover:bg-white/5 transition-all duration-300"
                >
                  <FastForward className="w-3.5 h-3.5" />
                  <span>NEXT</span>
                </button>
              </div>
            </div>

            {/* List of selectpoints */}
            <div className="flex flex-col gap-2">
              {DXY_DOCUMENTARY_TIMELINE.map((item, idx) => (
                <button
                  key={item.year}
                  onClick={() => {
                    setDxyTimelineIndex(idx);
                    setIsPlayingDxy(false);
                  }}
                  className={`flex items-center justify-between p-2.5 rounded-lg border font-mono text-[11px] transition-all duration-300 ${
                    dxyTimelineIndex === idx 
                      ? 'bg-white/5 border-[#00D9FF]/40 text-[#00D9FF] font-bold' 
                      : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <span>{item.year}: {item.title}</span>
                  <span>DXY: {item.dxyVal}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right cinematic documentary projection screen */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            <div className="p-6 rounded-2xl border border-white/5 bg-[#030611] relative overflow-hidden flex-1 flex flex-col justify-between">
              {/* Floating aesthetic nodes */}
              <div className="absolute top-[10%] right-[10%] w-48 h-48 bg-[#00D9FF] rounded-full blur-[90px] pointer-events-none opacity-10 animate-pulse" />

              <div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-5">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-[#00D9FF] animate-pulse" />
                    <div>
                      <span className="font-mono text-[8px] tracking-widest text-[#00D9FF] block">
                        SOVEREIGN RESERVE LEVEL
                      </span>
                      <h4 className="text-white font-extrabold text-base tracking-tight uppercase">
                        {activeDxyItem.title} ({activeDxyItem.year})
                      </h4>
                    </div>
                  </div>
                  <span className="font-mono text-zinc-500 text-xs text-secondary-glow">
                    RECORD FEED
                  </span>
                </div>

                {/* Macro stat readout box */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl font-mono text-center">
                    <span className="text-[8px] text-zinc-500 block uppercase font-black">USD DXY INDEX</span>
                    <span className="text-[#00D9FF] text-xl font-black">{activeDxyItem.dxyVal}</span>
                  </div>

                  <div className="p-3 bg-white/[0.015] border border-white/5 rounded-xl font-mono text-center">
                    <span className="text-[8px] text-zinc-500 block uppercase font-black">BASE INT INTEREST</span>
                    <span className="text-amber-400 text-xl font-black">{activeDxyItem.rate}</span>
                  </div>

                  <div className="p-3 bg-[#030611] border border-white/10 rounded-xl font-mono text-center">
                    <span className="text-[8px] text-zinc-500 block uppercase font-black">FED ACTION</span>
                    <span className="text-indigo-400 text-[10.5px] font-black tracking-tight flex items-center justify-center h-full pt-1 uppercase">
                      {activeDxyItem.fedPolicy}
                    </span>
                  </div>
                </div>

                {/* Narrative Documentary */}
                <div className="space-y-4">
                  <p className="text-zinc-350 text-[12px] leading-relaxed">
                    {activeDxyItem.narrative}
                  </p>

                  <div className="p-4 bg-[#00D9FF]/5 border border-[#00D9FF]/10 rounded-xl border-l-4 border-l-[#00D9FF]">
                    <span className="font-mono text-[8px] font-black text-[#00D9FF] block uppercase mb-1">
                      MACRO RECORD COMMENTARY
                    </span>
                    <p className="text-zinc-300 text-[11.5px] leading-relaxed font-sans italic">
                      {activeDxyItem.commentary}
                    </p>
                  </div>
                </div>
              </div>

              {/* Mini chart grid representing market indexing spikes */}
              <div className="mt-8 pt-4 border-t border-white/5 font-mono text-[9px] text-zinc-500 flex justify-between items-center select-none">
                <span className="flex items-center gap-1"><Info className="w-3.5 h-3.5" /> High index signals global carry liquidity drain to US.</span>
                <span>CHANNELS STABLE • ACTIVE DATA</span>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 
        =========================================
        TAB 5: THE FINANCIAL DOMINO EFFECT ENGINE
        =========================================
      */}
      {activeTab === 'domino' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left trigger selector */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-4 bg-[#030712]/60 rounded-2xl border border-white/5">
              <span className="font-mono text-[8px] font-black text-emerald-400 uppercase tracking-widest block mb-1">
                SYSTEM CASCADE FEEDBACKS
              </span>
              <p className="text-zinc-400 text-[11px]">
                Choose an initial trigger macroeconomic event. See how it triggers a multi-level sequential cascade directly affecting everyday lives.
              </p>
            </div>

            {[
              { id: 'rates', title: 'Interest rate Tightening', desc: 'Slowing overheating inflation', icon: '🏛️' },
              { id: 'oil', title: 'Oil choke transport crisis', desc: 'Critical supply line spikes', icon: '⛽' },
              { id: 'ai', title: 'Cognitive automation shock', desc: 'Replacing logic hours with silicon', icon: '🧠' },
              { id: 'money', title: 'M2 Money Expansion Flood', desc: 'Helicopter liquidity drops', icon: '💸' }
            ].map((chain) => (
              <button
                key={chain.id}
                onClick={() => {
                  setActiveDominoChain(chain.id as any);
                  setHoveredDominoStep(null);
                }}
                className={`p-4 rounded-xl border text-left transition-all duration-300 ${
                  activeDominoChain === chain.id 
                    ? 'bg-emerald-950/20 border-emerald-500/50 text-white shadow-md' 
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/[0.015] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-bold text-white text-xs">
                  <span>{chain.icon}</span>
                  <span>{chain.title}</span>
                </div>
                <p className="text-[10px] text-zinc-500 font-mono italic">{chain.desc}</p>
              </button>
            ))}
          </div>

          {/* Right cascade animation blocks */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-white/5 bg-[#030712]/75 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <span className="font-mono text-[8.5px] font-black text-[#00D9FF] uppercase tracking-widest block mb-1">
                CASCADE SIMULATION ENVIRONMENT
              </span>
              <h3 className="text-white font-extrabold text-base md:text-lg tracking-tight uppercase mb-4">
                {activeDominoChainData.title}
              </h3>

              {/* Initial Shock Indicator */}
              <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/5 mb-6">
                <span className="font-mono text-[8.5px] font-bold text-rose-400 uppercase tracking-widest block mb-1">
                  CORE TRIGGER INSTANT
                </span>
                <p className="text-zinc-200 text-xs leading-normal font-sans">
                  {activeDominoChainData.trigger}
                </p>
              </div>

              {/* Timeline Domino steps */}
              <div className="flex flex-col gap-3">
                {activeDominoChainData.steps.map((step, idx) => (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredDominoStep(idx)}
                    onMouseLeave={() => setHoveredDominoStep(null)}
                    className={`flex gap-3 p-3.5 rounded-xl border transition-all duration-300 ${
                      hoveredDominoStep === idx 
                        ? 'bg-emerald-950/20 border-emerald-500/40 translate-x-1 shadow-md' 
                        : 'bg-black/40 border-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-center font-mono font-black text-xs h-6 w-6 rounded-full shrink-0 border border-emerald-500/30 text-emerald-300 bg-emerald-500/10">
                      {idx + 1}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white mb-0.5 uppercase tracking-tight">{step.title}</h4>
                      <p className="text-zinc-400 text-xs leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 text-[9.5px] font-mono text-zinc-500 flex justify-between items-center select-none">
              <span>Cascade links are derived from physical input dependencies.</span>
              <span className="text-[#00D9FF]">ACTIVE PROCESSOR MODEL</span>
            </div>
          </div>
        </div>
      )}

      {/* 
        =========================================
        TAB 6: THE LIVING STOCK HISTORY SYSTEM
        =========================================
      */}
      {activeTab === 'stocks' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left companies list */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-4 bg-[#030712]/60 rounded-2xl border border-white/5">
              <span className="font-mono text-[8px] font-black text-indigo-400 uppercase tracking-widest block mb-1">
                CORPORATE LIFESPANS
              </span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Explore the historical evolution of legendary corporate superpowers as they navigate macroeconomic transitions.
              </p>
            </div>

            {[
              { id: 'msft', name: 'Microsoft Corporation', code: 'MSFT • PC, Cloud & AI', logo: '💻' },
              { id: 'nvda', name: 'Nvidia Corporation', code: 'NVDA • Gaming & Super Chips', logo: '🧠' },
              { id: 'aapl', name: 'Apple Inc.', code: 'AAPL • Mobile & Premium lock', logo: '🍎' },
              { id: 'amzn', name: 'Amazon.com Inc.', code: 'AMZN • logistics & Cloud AWS', logo: '📦' }
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setSelectedStock(st.id as any);
                  setActiveStockEra(0);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all duration-300 ${
                  selectedStock === st.id 
                    ? 'bg-indigo-950/20 border-indigo-500/50 text-white shadow' 
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/[0.015] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span>{st.logo}</span>
                  <h4 className="text-xs font-bold text-white leading-none">{st.name}</h4>
                </div>
                <span className="font-mono text-[9px] text-zinc-500 block pl-6 italic">{st.code}</span>
              </button>
            ))}
          </div>

          {/* Right corporate timeline details */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-white/5 bg-[#030712]/75 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Building className="w-5 h-5 text-indigo-400" />
                  <div>
                    <span className="font-mono text-[8px] tracking-widest text-zinc-500 uppercase block">
                      CORPORATE RECORD
                    </span>
                    <h3 className="text-white font-black text-lg tracking-tight uppercase">
                      {activeStockData.name}
                    </h3>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-mono text-zinc-500 block uppercase font-bold">ANNUAL REVENUE</span>
                  <span className="text-emerald-400 font-mono font-bold text-xs">{activeStockData.revenue}</span>
                </div>
              </div>

              <p className="text-zinc-450 text-[11px] font-mono text-zinc-400 italic mb-5 leading-normal">
                {activeStockData.foundation}
              </p>

              {/* Horizontal Era tabs */}
              <div className="flex gap-2 mb-5 overflow-x-auto pb-1.5 scrollbar-none">
                {activeStockData.eras.map((era, index) => (
                  <button
                    key={era.eraName}
                    onClick={() => setActiveStockEra(index)}
                    className={`px-3 py-2 rounded-lg font-mono text-[10px] whitespace-nowrap transition-all border shrink-0 ${
                      activeStockEra === index 
                        ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-300 font-bold' 
                        : 'bg-black/30 border-white/5 text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    {era.eraName}
                  </button>
                ))}
              </div>

              {/* Era narrative body */}
              <div className="p-5 rounded-xl border border-white/5 bg-white/[0.015] min-h-[140px] flex flex-col justify-between">
                <div>
                  <span className="text-zinc-500 font-mono text-[8.5px] uppercase block mb-1">
                    HISTORIC PARADIGM STEP
                  </span>
                  <h4 className="text-white text-xs font-bold uppercase tracking-tight mb-2">
                    {activeStockData.eras[activeStockEra]?.eraName}
                  </h4>
                  <p className="text-zinc-350 text-[12px] leading-relaxed">
                    {activeStockData.eras[activeStockEra]?.desc}
                  </p>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5 text-[9px] font-mono text-zinc-500 select-none">
                  <span>Witness corporate adaptation across decades.</span>
                  <span>TIME MODEL COMPLIANT</span>
                </div>
              </div>
            </div>

            <div className="mt-6 text-[9.5px] font-mono text-zinc-500 flex justify-between items-center select-none">
              <span>Microsoft and NVIDIA models track silicon hardware dependencies.</span>
              <span>CHANNELS STABLE</span>
            </div>
          </div>
        </div>
      )}

      {/* 
        =========================================
        TAB 7: THE GLOBAL POWER MAP
        =========================================
      */}
      {activeTab === 'power' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left regions directory */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-4 bg-[#030712]/60 rounded-2xl border border-white/5">
              <span className="font-mono text-[8px] font-black text-pink-400 uppercase tracking-widest block mb-1">
                POWER VECTORS
              </span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Understand the strategic moats linking economics, resources, energy, and sovereign policy.
              </p>
            </div>

            {[
              { id: 'us', name: 'United States Engine', desc: 'Reserve USD, SaaS Labs & Navy', logo: '🇺🇸' },
              { id: 'china', name: 'China supply Workbench', desc: 'Clusters, Rare Earths & Lithium', logo: '🇨🇳' },
              { id: 'mideast', name: 'Middle East raw Energy', desc: 'Low cost wells, Petrodollars', logo: '🇸🇦' },
              { id: 'europe', name: 'Europe Regulatory Basin', desc: 'ASML optics, safe standards', logo: '🇪🇺' }
            ].map((reg) => (
              <button
                key={reg.id}
                onClick={() => setSelectedPowerRegion(reg.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all duration-300 ${
                  selectedPowerRegion === reg.id 
                    ? 'bg-pink-950/20 border-pink-500/50 text-white shadow' 
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/[0.015] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-bold text-white text-xs">
                  <span>{reg.logo}</span>
                  <span>{reg.name}</span>
                </div>
                <p className="text-[9.5px] text-zinc-500 font-mono italic">{reg.desc}</p>
              </button>
            ))}
          </div>

          {/* Right sovereign readouts */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-white/5 bg-[#030712]/75 backdrop-blur-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 border-b border-white/10 pb-4 mb-4">
                <Globe className="w-5 h-5 text-pink-400" />
                <div>
                  <span className="font-mono text-[8px] tracking-widest text-zinc-500 uppercase block">
                    SOCIETY RESOURCE HEGEMONY
                  </span>
                  <h3 className="text-white font-black text-lg tracking-tight uppercase">
                    {activePowerData.nation}
                  </h3>
                </div>
              </div>

              {/* Power structures lists */}
              <div className="space-y-3.5">
                <span className="text-[8.5px] font-mono uppercase font-black text-zinc-500 tracking-widest block mb-2">
                  MONOPOLY SOVEREIGN MOATS
                </span>

                {activePowerData.moats.map((moat, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-1">
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight flex items-center gap-2">
                      <span className="text-[10px] text-pink-400">⚡</span>
                      {moat.title}
                    </h4>
                    <p className="text-zinc-400 text-xs leading-relaxed">
                      {moat.detail || moat.desc}
                    </p>
                  </div>
                ))}

                {/* Ecosystem link */}
                <div className="p-3.5 rounded-xl border border-white/5 bg-black/40 text-rose-350 font-mono text-[11px] leading-relaxed">
                  <span className="font-bold text-white text-[8.5px] block uppercase mb-1">INTERCONNECTIVITY LINK</span>
                  {activePowerData.interconnectivity}
                </div>
              </div>
            </div>

            <div className="mt-6 text-[9.5px] font-mono text-zinc-500 flex justify-between items-center select-none">
              <span>Sovereign dependencies dictate capital flow movements.</span>
              <span>DATA COMPLIANT</span>
            </div>
          </div>
        </div>
      )}

      {/* 
        =========================================
        TAB 9: THE FUTURE MEMORY ENGINE
        =========================================
      */}
      {activeTab === 'future' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fadeIn">
          {/* Left select sims list */}
          <div className="lg:col-span-4 flex flex-col gap-3">
            <div className="p-4 bg-[#030712]/60 rounded-2xl border border-white/5">
              <span className="font-mono text-[8px] font-black text-amber-400 uppercase tracking-widest block mb-1">
                FUTURE PROJECTIONS
              </span>
              <p className="text-zinc-400 text-[11px] leading-relaxed">
                Choose a forward-looking paradigm. Build and launch a model simulation assessing tomorrow labor systems and resource allocations.
              </p>
            </div>

            {[
              { id: 'ai_dividend', name: 'Universal Silicon Dividend', code: 'SIM_STATE_DIVIDEND_PROJ', icon: '🤖' },
              { id: 'neo_barter', name: 'Digital Resource basket Ledger', code: 'CRYPT_RESOURCE_LEDGER', icon: '🌾' },
              { id: 'robotic_onshoring', name: 'Onshore Robotic factory Hubs', code: 'ONSHORE_ROBOTIC_FLOWS', icon: '🦾' },
              { id: 'energy_grid', name: 'Datacenter Energy crisis', code: 'GRID_THERMAL_CAPACITY_SHK', icon: '🔋' }
            ].map((sim) => (
              <button
                key={sim.id}
                onClick={() => {
                  setSelectedFutureSim(sim.id as any);
                  setSimRunStatus('idle');
                  setSimOutputLog([]);
                }}
                className={`p-3.5 rounded-xl border text-left transition-all duration-300 ${
                  selectedFutureSim === sim.id 
                    ? 'bg-amber-955/20 border-amber-550/50 border-amber-500/50 text-white shadow' 
                    : 'bg-black/30 border-white/5 text-zinc-400 hover:bg-white/[0.015] hover:border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 font-bold text-white text-xs">
                  <span>{sim.icon}</span>
                  <span>{sim.name}</span>
                </div>
                <p className="text-[9.5px] text-zinc-500 font-mono italic truncate">{sim.code}</p>
              </button>
            ))}
          </div>

          {/* Right console simulator */}
          <div className="lg:col-span-8 p-6 rounded-2xl border border-white/5 bg-black flex flex-col justify-between min-h-[460px]">
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <Cpu className="w-5 h-5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
                  <div>
                    <span className="font-mono text-[8px] tracking-widest text-[#00D9FF] block">
                      FUTURE MEMORY MATRIX EMULATOR
                    </span>
                    <h3 className="text-white font-black text-base md:text-lg tracking-tight uppercase">
                      {activeFutureData.title}
                    </h3>
                  </div>
                </div>
                <span className="font-mono text-[9px] text-zinc-500 uppercase px-2 py-0.5 border border-white/5 bg-white/5 rounded">
                  {activeFutureData.simCode}
                </span>
              </div>

              {/* Premise box */}
              <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] mb-5">
                <span className="text-[8.5px] font-mono uppercase text-zinc-500 block mb-1 font-extrabold">EMULATOR PREMISE Parameters</span>
                <p className="text-zinc-300 text-xs leading-relaxed">
                  {activeFutureData.premise}
                </p>
              </div>

              {/* Typewriter logs projector */}
              <div className="p-4 rounded-xl border border-white/5 bg-black/90 font-mono text-[11px] text-zinc-400 min-h-[160px] space-y-1.5 max-h-[220px] overflow-y-auto">
                <span className="text-[8px] text-zinc-650 tracking-wider block border-b border-white/5 pb-1 mb-2">CONSOLE DIRECT OUTPUT READOUT</span>
                {simOutputLog.map((log, i) => (
                  <p key={i} className={log.startsWith('[') ? 'text-amber-400 font-bold' : log.includes('Alert') ? 'text-red-400 animate-pulse' : 'text-zinc-300'}>
                    ⚡ {log}
                  </p>
                ))}
                {simRunStatus === 'idle' && (
                  <p className="text-zinc-500 animate-pulse">Matrix Idle. Press Run Simulation to calculate future dependencies...</p>
                )}
              </div>

              {/* Trigger run */}
              {simRunStatus === 'idle' && (
                <button
                  onClick={runFutureSim}
                  className="mt-4 px-5 py-3 rounded-xl border border-amber-500/30 text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 hover:scale-[1.02] active:scale-[0.98] transition-all text-xs font-mono font-black uppercase tracking-widest"
                >
                  Run Simulation Engine
                </button>
              )}

              {simRunStatus === 'completed' && (
                <div className="mt-4 p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02]">
                  <span className="text-[8.5px] font-mono text-emerald-400 block uppercase font-bold mb-1">CONSEQUENCE SIMULATION OUTCOME</span>
                  <p className="text-zinc-200 text-xs leading-relaxed">
                    {activeFutureData.consequence}
                  </p>
                </div>
              )}
            </div>

            {/* The primary philosophical prompt to conclude future engine section */}
            <div className="mt-8 pt-4 border-t border-white/10 text-center select-none" id="m1">
              <span className="font-mono text-zinc-400 text-xs block leading-relaxed italic">
                "What historical era are we entering now?"
              </span>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
