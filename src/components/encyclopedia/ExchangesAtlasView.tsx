// /src/components/encyclopedia/ExchangesAtlasView.tsx
import React, { useState } from 'react';
import { 
  Globe, Landmark, Cpu, ArrowRight, ShieldCheck, 
  Layers, Info, Sparkles, TrendingUp, HelpCircle
} from 'lucide-react';

interface ExchangesAtlasViewProps {
  selectFileNode?: (fileName: string) => void;
  pedagogyMode?: 'kids' | 'highschool' | 'college' | 'researcher';
  activeLanguage?: 'EN' | 'ZH' | 'ES' | 'PT' | 'KO';
}

interface ExchangeProfile {
  name: string;
  code: string;
  city: string;
  country: string;
  type: 'Equities' | 'Derivatives / Futures' | 'Crypto' | 'Multi-Asset';
  founded: string;
  settlementLayer: string;
  clearingMechanism: string;
  dailyVolumeUSD: string;
  listedEntities: string;
  primaryTech: string;
  architecturalCore: string;
  whySovereign: string;
}

const GLOBAL_EXCHANGES_RAW: ExchangeProfile[] = [
  {
    name: "Chicago Mercantile Exchange (CME Group)",
    code: "CME",
    city: "Chicago",
    country: "United States",
    type: "Derivatives / Futures",
    founded: "1898",
    settlementLayer: "Clearing House Delivery (CME Clearing / physical & cash settlement)",
    clearingMechanism: "Central Counterparty Clearing (CCP) with SPAN Margin Logic",
    dailyVolumeUSD: "$4.8 Trillion (Notional)",
    listedEntities: "Indexes, Rates, Agriculture, Metals, Energy Contracts",
    primaryTech: "CME Globex Core Match Engine",
    architecturalCore: "Designed from the ground up for risk-shifting and future-hedging rather than equity ownership. Transactions are bilateral futures commitments secured by performance bonds (margins) processed via CME Clearing.",
    whySovereign: "A sovereign hedging reservoir. CME allows food producers, power plants, and foreign treasuries to lock in stable prices months in advance, absorbing real-world pricing shocks."
  },
  {
    name: "NASDAQ Stock Market",
    code: "NASDAQ",
    city: "New York",
    country: "United States",
    type: "Equities",
    founded: "1971",
    settlementLayer: "T+1 National Securities Clearing Corporation (NSCC) / DTCC",
    clearingMechanism: "Continuous Net Settlement (CNS)",
    dailyVolumeUSD: "$250 Billion",
    listedEntities: "3,554 (Primarily Tech & Telecom corporations)",
    primaryTech: "INET High-Speed Match Core",
    architecturalCore: "Historically the world's first electronic screen stock market, NASDAQ operates as a dealer-market framework where computerized Market Makers compete to clear orders inside high-speed electronic pools.",
    whySovereign: "The primary capital engine for high-growth tech platforms. NASDAQ matches public cash with venture blueprints, powering massive enterprise networks globally."
  },
  {
    name: "New York Stock Exchange",
    code: "NYSE",
    city: "New York",
    country: "United States",
    type: "Equities",
    founded: "1792",
    settlementLayer: "T+1 Clearing (DTCC / NSCC)",
    clearingMechanism: "Continuous Broker Auction System Systemic Netting",
    dailyVolumeUSD: "$180 Billion",
    listedEntities: "2,400 (Corporate Bluechips, Industrials, financials)",
    primaryTech: "NYSE Pillar Matching Engine & DMMs",
    architecturalCore: "Operating under the Buttonwood Agreement heritage, NYSE utilizes Designated Market Makers (DMMs) who physically and electronically manage auction flow on the trading floor, maintaining extreme book liquidity.",
    whySovereign: "The global anchor of blue-chip liquidity. NYSE catalogs the foundational industrial enterprises of modern civilization."
  },
  {
    name: "London Stock Exchange",
    code: "LSE",
    city: "London",
    country: "United Kingdom",
    type: "Multi-Asset",
    founded: "1801",
    settlementLayer: "T+1 / T+2 Settlement via Euroclear UK & International (CREST)",
    clearingMechanism: "LCH (London Clearing House)",
    dailyVolumeUSD: "$12 Billion",
    listedEntities: "1,950 (Global conglomerates, resources, minerals)",
    primaryTech: "MillenniumIT Matching Technology",
    architecturalCore: "A historic global entry point. LSE specializes in matching international capital, sovereign bond issuance, and major energy/resources listings.",
    whySovereign: "The primary reserve gateway bridging Eastern European, Asian, and Western transatlantic capital markets."
  },
  {
    name: "Japan Exchange Group (Tokyo)",
    code: "JPX",
    city: "Tokyo",
    country: "Japan",
    type: "Equities",
    founded: "1878",
    settlementLayer: "T+1 via Japan Securities Clearing Corporation (JSCC)",
    clearingMechanism: "Central National Net Settlement",
    dailyVolumeUSD: "$35 Billion",
    listedEntities: "3,890 (Industrial, automotive, technology conglomerates)",
    primaryTech: "Arrowhead Matching Engine",
    architecturalCore: "Operates as Japan's capital nucleus. Highly electronic, hosting legendary industrial giants with strict sovereign structural groupings (Keiretsu).",
    whySovereign: "The primary gateway to East Asia's electronics and high-precision precision industrial supply bases."
  },
  {
    name: "Euronext",
    code: "ENX",
    city: "Paris / Amsterdam / Brussels / Dublin",
    country: "Europe",
    type: "Multi-Asset",
    founded: "2000",
    settlementLayer: "T+1 / T+2 via Euroclear & LCH.Clearnet",
    clearingMechanism: "Euronext Clearing Hub",
    dailyVolumeUSD: "$40 Billion",
    listedEntities: "1,530 (Transnational European corporations)",
    primaryTech: "Optiq Trading System",
    architecturalCore: "A synchronized pan-European exchange system, uniting several sovereign stock markets under a single unified, ultra-fast matching platform.",
    whySovereign: "Unifies the core monetary corridors of the Eurozone, allowing capital to move seamlessly across European borders."
  },
  {
    name: "Shanghai Stock Exchange",
    code: "SSE",
    city: "Shanghai",
    country: "China",
    type: "Equities",
    founded: "1990",
    settlementLayer: "T+1 via China Securities Depository and Clearing Corporation (CSDCC / Chinaclear)",
    clearingMechanism: "Direct Sovereign Ledger Netting",
    dailyVolumeUSD: "$75 Billion",
    listedEntities: "2,208 (Chinese state enterprises & domestic private companies)",
    primaryTech: "SSE Direct Match Hub",
    architecturalCore: "A highly regulated gateway structured into 'A-shares' (denominated in local RMB for domestic buyers) and 'B-shares' (for foreign participants), carefully managed by sovereign monetary policies.",
    whySovereign: "Directly funds the manufacturing expansion of Chinese industrial corridors and domestic consumer networks."
  },
  {
    name: "Hong Kong Exchanges and Clearing",
    code: "HKEX",
    city: "Hong Kong",
    country: "Hong Kong / China",
    type: "Multi-Asset",
    founded: "2000 (Consolidated)",
    settlementLayer: "T+2 via Central Clearing and Settlement System (CCASS)",
    clearingMechanism: "HKFE Clearing Corporation",
    dailyVolumeUSD: "$15 Billion",
    listedEntities: "2,600 (Mainland offshore corporations & international listings)",
    primaryTech: "Orion Trading Platform (OTP-C)",
    architecturalCore: "The ultimate offshore-onshore monetary bridge for China. HKEX leverages 'Stock Connect' corridors directly routing offshore capital into Shanghai registries.",
    whySovereign: "The friction point between Western dollar custody frameworks and East Asian manufacturing balance sheets."
  },
  {
    name: "Intercontinental Exchange (ICE)",
    code: "ICE",
    city: "Atlanta / London",
    country: "United States / UK / Global",
    type: "Derivatives / Futures",
    founded: "2000",
    settlementLayer: "ICE Clear Europe / ICE Clear US physical transfer",
    clearingMechanism: "ICE CCP Systemic Netting",
    dailyVolumeUSD: "$3.5 Trillion (Notional)",
    listedEntities: "Global Brent Crude futures, indexes, rates",
    primaryTech: "ICE Global Trading Platform",
    architecturalCore: "An digitized powerhouse. ICE manages the absolute price of global oil contracts (Brent Crude) and energy derivatives, controlling key input costs.",
    whySovereign: "ICE sets the price of real physical energy, which directly controls the inflation rates of importing nations."
  }
];

export default function ExchangesAtlasView({ selectFileNode, pedagogyMode = 'college', activeLanguage = 'EN' }: ExchangesAtlasViewProps) {
  const [selectedCode, setSelectedCode] = useState<string>("CME");
  const [comprehensionStep, setComprehensionStep] = useState<number>(0);

  const activeExchange = GLOBAL_EXCHANGES_RAW.find(e => e.code === selectedCode) || GLOBAL_EXCHANGES_RAW[0];

  const langIntros: Record<'EN' | 'ZH' | 'ES' | 'PT' | 'KO', Record<string, string>> = {
    EN: {
      intro_kids: "An exchange is like a gigantic playground market where people buy and sell cards. Some sell toy parts, and others buy rules to trade them later!",
      intro_highschool: "Financial exchanges are regulated platforms where assets are matched between buyers and sellers. Equity markets sell pieces of companies; futures markets trade advance price lock-ins.",
      intro_college: "Exchanges are double-auction matching networks with centralized risk clearing layers. They protect markets from counterparty default while establishing standard settlement parameters.",
      intro_researcher: "Sovereign liquidity portals matching institutional order-books. Clearing architectures net bilateral exposures, mitigating systemic risk through margin metrics and clearing capital pools.",
      cmeVsNasdaq_kids: "Think of CME like buying a ticket to trade wheat next summer from a farmer. Think of NASDAQ like buying a piece of Apple's actual computer shop right now!",
      cmeVsNasdaq_highschool: "CME handles forward futures commitments (risk hedging). NASDAQ handles actual stock certificates (equity business ownership).",
      cmeVsNasdaq_college: "CME operates on a central counterparty margin-clearing ledger to manage bilateral forward agreements. NASDAQ operates an open double-auction matching book matching buyer and seller capital for equity shares.",
      cmeVsNasdaq_researcher: "CME uses SPAN margin vectors for forward risk hedging. NASDAQ is an equity matching engine utilizing Continuous Net Settlement (CNS) via security depositories.",
      titular: "Global Exchange Systems Atlas",
      desc: "Every transaction, every clearing ledger, in one unified study cockpit. Markets do not float in midair—they run on sovereign technical hardware routers, matching buyers and sellers across different assets, settlement laws, and geographic zones."
    },
    ZH: {
      intro_kids: "交易所就像一个巨大的游乐场市场，人们在那里买卖卡片。有些人出售玩具零件，而另一些人则购买规则，以便以后交易它们！",
      intro_highschool: "金融交易所是买卖双方资产匹配的受监管平台。股票市场销售公司的股份；期货市场交易提前锁定价格的合约。",
      intro_college: "交易所是具有集中风险清算层的双向拍卖匹配网络。它们保护市场免受交易对手违约的影响，同时确立标准结算参数。",
      intro_researcher: "匹配机构交易账簿的主权流动性门户。清算架构能够合并双边风险敞口，通过保证金指标和清算资金池降低系统性风险。",
      cmeVsNasdaq_kids: "把CME想象成向农民买一张明年夏天交易小麦的门票。把NASDAQ想象成现在就购买苹果电脑商店的实际股份！",
      cmeVsNasdaq_highschool: "CME处理远期期货承诺（风险对冲）。NASDAQ处理实际的股票证书（股权所有权）。",
      cmeVsNasdaq_college: "CME在中央交易对手保证金清算账簿上运行，以管理双边远期协议。NASDAQ运行一个公开的双向拍卖匹配簿，为股权匹配买卖双方的资本。",
      cmeVsNasdaq_researcher: "CME使用SPAN保证金向量进行远期风险对冲。NASDAQ是一个利用证券存管机构连续净额结算(CNS)的股票匹配引擎。",
      titular: "全球交易系统地图集",
      desc: "每一次交易，每一个清算账簿，尽在一个统一的学习操控台。市场并不会凭空漂浮——它们在主权技术硬件路由器上运行，在不同的资产、结算法律和地理区域之间匹配买家和卖家。"
    },
    ES: {
      intro_kids: "¡Un intercambio es como un mercado de patio de recreo gigante donde la gente compra y vende cartas! ¡Algunos venden piezas de juguetes y otros compran reglas para cambiarlas más tarde!",
      intro_highschool: "Las bolsas financieras son plataformas reguladas donde se casan activos entre compradores y vendedores. Los mercados de renta variable venden partes de empresas; los mercados de futuros negocian fijaciones de precios anticipadas.",
      intro_college: "Las bolsas son redes de casamiento de doble subasta con niveles de liquidación de riesgos centralizados. Protegen a los mercados contra el incumplimiento de la contraparte al tiempo que establecen parámetros estandarizados.",
      intro_researcher: "Portales de liquidez soberanos que casan libros de órdenes institucionales. Las arquitecturas de compensación netean las exposiciones bilaterales, mitigando el riesgo sistémico a través de métricas de margen.",
      cmeVsNasdaq_kids: "Piensa en CME como comprar un boleto para comerciar trigo el próximo verano con un agricultor. ¡Piensa en NASDAQ como comprar una parte de la tienda real de Apple ahora mismo!",
      cmeVsNasdaq_highschool: "CME maneja compromisos de futuros a plazo (cobertura de riesgos). NASDAQ maneja certificados de acciones reales (propiedad comercial de acciones).",
      cmeVsNasdaq_college: "CME opera en un libro de liquidación de márgenes de contraparte central para gestionar acuerdos a plazo bilaterales. NASDAQ opera un libro de casamiento de doble subasta abierto que empareja capital de compradores y vendedores para acciones de capital.",
      cmeVsNasdaq_researcher: "CME utiliza vectores de margen SPAN para la cobertura de riesgos a plazo. NASDAQ es un motor de casamiento de acciones que utiliza la Liquidación Neta Continua (CNS) a través de depositarios de valores.",
      titular: "Atlas de Sistemas de Intercambio Global",
      desc: "Cada transacción, cada registro de compensación, en una cabina de estudio unificada. Los mercados no flotan en el aire: se ejecutan en enrutadores de hardware técnico soberano, emparejando compradores y vendedores."
    },
    PT: {
      intro_kids: "Uma bolsa é como um gigantesco mercado de brinquedos onde as pessoas compram e vendem cartas. Alguns vendem peças de brinquedo, e outros compram regras para negociar mais tarde!",
      intro_highschool: "As bolsas financeiras são plataformas reguladas onde os ativos são combinados entre compradores e vendedores. Mercados de ações vendem fatias de empresas; mercados de futuros travam preços antecipados.",
      intro_college: "As bolsas são redes de correspondência de leilão duplo com camadas centralizadas de compensação de risco. Protegem os mercados de inadimplência da contraparte enquanto estabelecem parâmetros.",
      intro_researcher: "Portais soberanos de liquidez que cruzam livros de ofertas institucionais. Arquiteturas de compensação liquidam as exposições bilaterais, mitigando riscos sistêmicos.",
      cmeVsNasdaq_kids: "Pense na CME como comprar um bilhete para negociar trigo no próximo verão com um agricultor. Pense na NASDAQ como comprar um pedaço da própria loja da Apple agora mesmo!",
      cmeVsNasdaq_highschool: "A CME lida com compromissos futuros de derivativos (hedge de risco). A NASDAQ gerencia certificados de ações reais (propriedade acionária).",
      cmeVsNasdaq_college: "A CME funciona com uma câmara de compensação de contraparte central por margem para gerir acordos a termo bilaterais. A NASDAQ opera um livro aberto de ofertas combinando capital de compradores e vendedores para ações ordinárias.",
      cmeVsNasdaq_researcher: "A CME usa vetores de margem SPAN para hedge de risco cambial e de commodities. A NASDAQ usa um sistema de liquidação líquida contínua (CNS) via custódia de títulos.",
      titular: "Atlas de Sistemas de Bolsas Globais",
      desc: "Cada transação, cada livro de compensação, em uma única cabine de estudo unificada. Os mercados não flutuam no ar — eles funcionam em roteadores físicos soberanos de hardware."
    },
    KO: {
      intro_kids: "거래소는 사람들이 모여 카드를 사고파는 거대한 운동장 시장과 같아요. 어떤 친구는 장난감 부품을 팔고, 다른 친구는 나중에 교환할 재미있는 규칙을 사기도 해요!",
      intro_highschool: "금융 거래소는 구매자와 판매자 간의 자산을 매칭하는 전술적 정식 플랫폼입니다. 주식 시장은 회사 지분을 나누어 팔고, 선물 시장은 향후 고정 가격 계약을 거래합니다.",
      intro_college: "거래소는 다자간 중앙 청산 결제 시스템을 갖춘 이중 경매 매칭 네트워크입니다. 거래 상대방의 채무불이행 리스크를 보증하고 표준 결제 주기를 관리합니다.",
      intro_researcher: "기관 투자자 호가창을 동기화하는 주권 핵심 유동성 관문입니다. 청산 구조는 쌍방 리스크 편중을 실시간 상쇄하며, 증거금 지표를 활용하여 결제 불이행 연쇄 파급을 차단합니다.",
      cmeVsNasdaq_kids: "CME는 농부에게 내년 여름에 밀을 사기로 약속하는 티켓을 사는 것과 같아요. NASDAQ은 지금 바로 애플의 진짜 컴퓨터 가게 조각을 사는 것과 같아요!",
      cmeVsNasdaq_highschool: "CME는 미래의 선물 약정(위험 헤징)을 관리합니다. NASDAQ은 법적 실제 소유지분(주식 지분권)을 관리합니다.",
      cmeVsNasdaq_college: "CME는 원격 위험 관리를 조율하는 일대다 청산 원장에서 양자간 선도 거래 계약서들의 만기를 관리합니다. NASDAQ은 자본 매칭 장부를 통하여 주식 투자자의 매수/매도 균형을 조율합니다.",
      cmeVsNasdaq_researcher: "CME는 거래소 전체의 기초자산 안정성을 유지하고자 SPAN 벡터 증거금 알고리즘을 사용합니다. NASDAQ은 예탁결제원 장부 통제 하에 CNS(Continuous Net Settlement) 실시간 전산 결제를 채택합니다.",
      titular: "글로벌 교환 및 거래소 핵심 아틀라스",
      desc: "모든 미시 트랜잭션과 중앙 청산 원장을 단일 스터디 데스크에 통합했습니다. 금융 시장은 우주에 떠돌지 않으며, 전 세계 하드웨어 라우터 네트워크와 주권 사법 결제 규정을 통해 정밀 구동됩니다."
    }
  };

  const getIntroKey = () => {
    if (pedagogyMode === 'kids') return 'intro_kids';
    if (pedagogyMode === 'highschool') return 'intro_highschool';
    if (pedagogyMode === 'college') return 'intro_college';
    return 'intro_researcher';
  };

  const selectedIntroText = langIntros[activeLanguage]?.[getIntroKey()] || langIntros['EN'][getIntroKey()];
  const selectedTitular = langIntros[activeLanguage]?.titular || langIntros['EN'].titular;
  const selectedDesc = langIntros[activeLanguage]?.desc || langIntros['EN'].desc;

  const pedagogyTranslations = {
    kids: {
      intro: langIntros[activeLanguage]?.[`intro_kids`] || langIntros['EN'][`intro_kids`],
      cmeVsNasdaq: langIntros[activeLanguage]?.[`cmeVsNasdaq_kids`] || langIntros['EN'][`cmeVsNasdaq_kids`]
    },
    highschool: {
      intro: langIntros[activeLanguage]?.[`intro_highschool`] || langIntros['EN'][`intro_highschool`],
      cmeVsNasdaq: langIntros[activeLanguage]?.[`cmeVsNasdaq_highschool`] || langIntros['EN'][`cmeVsNasdaq_highschool`]
    },
    college: {
      intro: langIntros[activeLanguage]?.[`intro_college`] || langIntros['EN'][`intro_college`],
      cmeVsNasdaq: langIntros[activeLanguage]?.[`cmeVsNasdaq_college`] || langIntros['EN'][`cmeVsNasdaq_college`]
    },
    researcher: {
      intro: langIntros[activeLanguage]?.[`intro_researcher`] || langIntros['EN'][`intro_researcher`],
      cmeVsNasdaq: langIntros[activeLanguage]?.[`cmeVsNasdaq_researcher`] || langIntros['EN'][`cmeVsNasdaq_researcher`]
    }
  };

  return (
    <div className="exchanges-atlas-layout flex flex-col gap-6 text-white text-left select-text font-sans animate-fadeIn">
      
      {/* HEADER SECTION */}
      <div className="relative border-b border-white/5 pb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full bg-[#00D9FF] animate-pulse" />
          <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#00D9FF] font-black">
            BLUEPRINT 01 // WORLD EXCHANGES SYSTEM ATLAS
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
          {selectedTitular}
        </h1>
        <p className="text-zinc-300 text-sm sm:text-base max-w-4xl leading-relaxed">
          {selectedDesc}
        </p>
      </div>

      {/* COMPREHENSION BLOCK */}
      <div className="bg-[#FF00C8]/5 border border-[#FF00C8]/30 rounded-2xl p-4 mt-6 font-mono text-xs max-w-3xl flex gap-3.5 items-start">
        <Info className="w-5 h-5 text-[#FF00C8] shrink-0 mt-0.5" />
        <div className="space-y-1.5 text-zinc-250">
          <span className="text-[#FF00C8] font-black uppercase tracking-widest block">PEDAGOGICAL SYLLABUS INTERFACE</span>
          <p className="leading-relaxed font-sans text-sm font-semibold">
            {selectedIntroText}
          </p>
        </div>
      </div>

      {/* CORE SELECTOR MATRIX */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT PROFILE PANEL: 20+ EXCHANGES INTERFACE */}
        <div className="lg:col-span-4 bg-[#030612]/98 border border-white/10 rounded-3xl p-6 flex flex-col gap-5">
          <div className="space-y-1.5 text-left">
            <label className="font-mono text-[10px] text-zinc-400 font-extrabold uppercase tracking-widest">
              SELECT SOVEREIGN LIQUIDITY ROUTER
            </label>
            
            {/* LARGE DROPDOWN SELECTOR */}
            <div className="relative">
              <select
                value={selectedCode}
                onChange={(e) => setSelectedCode(e.target.value)}
                className="w-full bg-[#050916] border border-[#00D9FF]/40 focus:border-[#FF00C8] focus:ring-1 focus:ring-[#FF00C8] rounded-xl py-3.5 px-4 text-sm text-white uppercase font-mono font-black appearance-none cursor-pointer focus:outline-none"
              >
                {GLOBAL_EXCHANGES_RAW.map((ex) => (
                  <option key={ex.code} value={ex.code} className="bg-slate-950 text-white py-2 font-mono">
                    {ex.code} - {ex.name}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-4.5 pointer-events-none text-zinc-400 text-xs">▼</div>
            </div>
          </div>

          <div className="flex flex-col gap-4 text-left font-mono">
            <span className="text-[10px] text-zinc-550 tracking-wider uppercase font-black">EXCHANGE CORE DETAILS</span>
            
            <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex flex-col gap-3 text-xs sm:text-sm">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 font-bold">SOVEREIGN CODE</span>
                <span className="text-white font-black text-[#00D9FF]">{activeExchange.code}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 font-bold">HQ GEOLOCATION</span>
                <span className="text-white font-black">{activeExchange.city}, {activeExchange.country}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 font-bold">ESTABLISHED</span>
                <span className="text-white font-black">{activeExchange.founded}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-zinc-500 font-bold">ASSET CATEGORY</span>
                <span className="text-purple-400 font-black">{activeExchange.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500 font-bold">DAILY VOLUME</span>
                <span className="text-emerald-400 font-black">{activeExchange.dailyVolumeUSD}</span>
              </div>
            </div>
          </div>

          {/* Quick list checklist elements */}
          <div className="border-t border-white/10 pt-4 flex flex-col gap-2.5">
            <span className="font-mono text-[9px] text-[#FF00C8] font-bold uppercase tracking-widest">RAPID ACCESS CLUSTERS</span>
            <div className="grid grid-cols-3 gap-2">
              {GLOBAL_EXCHANGES_RAW.slice(0, 6).map(e => (
                <button
                  key={e.code}
                  onClick={() => setSelectedCode(e.code)}
                  className={`py-1.5 rounded-lg border font-mono text-[10px] font-black tracking-wider transition-all cursor-pointer ${
                    selectedCode === e.code 
                      ? 'bg-[#00D9FF] text-black border-transparent shadow-[0_0_10px_rgba(0,120,255,0.4)]' 
                      : 'bg-[#FF00C8]/5 border-[#FF00C8]/20 text-zinc-300 hover:bg-white/5'
                  }`}
                >
                  {e.code}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: CORE FUNCTIONAL ANATOMY VIEWER (8/12) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          {/* ARCHITECTURAL DESCRIPTION DECK */}
          <div className="bg-gradient-to-br from-[#040816]/98 via-[#02050c]/98 to-neutral-950 border border-white/15 rounded-3xl p-6 text-left flex flex-col gap-5 justify-between">
            
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4 flex-wrap border-b border-white/10 pb-4">
                <div className="space-y-1">
                  <span className="text-xs font-mono font-black text-[#00D9FF] uppercase tracking-widest">ROUTING SYSTEM BLUEPRINT</span>
                  <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                    {activeExchange.name}
                  </h2>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 font-mono text-xs shrink-0">
                  <span className="text-zinc-500 block uppercase">Listed Assets</span>
                  <span className="text-white font-extrabold mt-0.5 block">{activeExchange.listedEntities}</span>
                </div>
              </div>

              {/* Functional deep dive boxes with beautiful tabs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white/[0.015] border border-white/10 rounded-xl space-y-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-extrabold flex items-center gap-1.5">
                    <Cpu className="w-4 h-4 text-[#00D9FF]" /> Matching Tech Hub
                  </span>
                  <p className="text-[#00D9FF] text-sm font-black font-mono">
                    {activeExchange.primaryTech}
                  </p>
                  <p className="text-zinc-400 text-xs font-medium leading-relaxed font-sans">
                    Core low-latency matching pipeline designed to coordinate millions of transaction units per millisecond safely.
                  </p>
                </div>

                <div className="p-4 bg-white/[0.015] border border-white/10 rounded-xl space-y-2">
                  <span className="text-xs uppercase font-mono tracking-wider text-zinc-400 font-extrabold flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-purple-400" /> Settlement & Clearing Systems
                  </span>
                  <p className="text-purple-400 text-sm font-black font-mono">
                    {activeExchange.settlementLayer}
                  </p>
                  <p className="text-zinc-450 text-[11px] font-sans font-semibold mt-1">
                    Clearing Layer: {activeExchange.clearingMechanism}
                  </p>
                </div>
              </div>

              {/* Narrative block */}
              <div className="p-5 bg-black/50 border border-white/5 rounded-2xl space-y-2 leading-relaxed">
                <span className="text-xs font-mono font-black text-amber-400 uppercase tracking-widest block">OPERATION ARCHITECTURE</span>
                <p className="text-zinc-300 text-sm leading-relaxed font-medium font-sans">
                  {activeExchange.architecturalCore}
                </p>
              </div>

              {/* Why State matters */}
              <div className="p-5 bg-gradient-to-r from-cyan-950/20 to-black/80 border border-[#00D9FF]/25 rounded-2xl space-y-2 leading-relaxed shadow-inner">
                <span className="text-xs font-mono font-black text-[#00D9FF] uppercase tracking-widest block">SOVEREIGN MONETARY SIGNIFICANCE</span>
                <p className="text-zinc-200 text-sm font-medium leading-relaxed font-sans">
                  {activeExchange.whySovereign}
                </p>
              </div>

            </div>

          </div>

          {/* CRUCIAL ARCHITECTURAL MASTER CLASS: CME VS NASDAQ */}
          <div className="bg-black/60 border border-white/10 rounded-3xl p-6 text-left space-y-4">
            <h3 className="font-mono text-[#FF00C8] text-xs sm:text-xs font-black uppercase tracking-[0.2em] border-b border-white/10 pb-2.5">
              THE CME VS NASDAQ ARCHITECTURAL DIVIDE (FUTURES CONTRACTS VS EQUITY CERTIFICATES)
            </h3>
            
            <p className="text-xs font-mono text-zinc-400 leading-relaxed font-semibold">
              ★ {pedagogyTranslations[pedagogyMode].cmeVsNasdaq}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-cyan-950/10 border border-cyan-400/20 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 bg-cyan-400/10 text-cyan-400 rounded-sm font-black">CME</span>
                  <span className="text-sm font-extrabold uppercase text-white leading-none font-sans">Futures / Risk-Shifting Engine</span>
                </div>
                <ul className="text-zinc-350 text-xs space-y-2 list-disc pl-4 font-semibold leading-relaxed">
                  <li>No assets exist in hand; contracts are commitments to lock prices in the future.</li>
                  <li>Secured by double margin channels (Performance Bond and Maintenance checks).</li>
                  <li>Allows commercial entities (farmers, producers) to hedge volatile costs safely.</li>
                  <li>Physical delivery is typical (barrels, bushels, gold bars) upon contract execution.</li>
                </ul>
              </div>

              <div className="p-4 bg-purple-950/10 border border-purple-400/20 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs px-2 py-0.5 bg-purple-400/10 text-purple-400 rounded-sm font-black">NASDAQ / NYSE</span>
                  <span className="text-sm font-extrabold uppercase text-white leading-none font-sans">Corporate Equities Engine</span>
                </div>
                <ul className="text-zinc-350 text-xs space-y-2 list-disc pl-4 font-semibold leading-relaxed">
                  <li>Direct fractional legal ownership of real-world corporate assets (stocks).</li>
                  <li>Settled immediately under security depositories (T+1 days NSCC framework).</li>
                  <li>Driven by corporate earnings indices, investment capital, and market value.</li>
                  <li>Entitles the buyer to dividend streams and corporate governance votes.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
