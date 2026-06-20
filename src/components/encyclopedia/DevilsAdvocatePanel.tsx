// /src/components/encyclopedia/DevilsAdvocatePanel.tsx
import React, { useState } from 'react';
import { 
  Skull, 
  Volume2, 
  Sparkles, 
  Gauge, 
  Zap, 
  BookOpen, 
  AlertTriangle, 
  Award, 
  RefreshCw,
  TrendingDown,
  Clock,
  HelpCircle
} from 'lucide-react';

interface DevilsAdvocatePanelProps {
  isNarcissistMode: boolean;
  setIsNarcissistMode: (active: boolean) => void;
}

// Full-featured Handcrafted and Dynamic Narcissistic Lexicon Translator
export const getNarcissisticInterpretation = (term: string, definition: string, category?: string) => {
  const handcrafted: Record<string, string> = {
    "10-K": "A 90-page novel of corporate lawyers pretending everything is fine while key founders sell their equities directly to retail bagholders.",
    "401(k) Plan": "An elaborate scheme to lock up your cash for 40 years, yielding average returns, so hedge funds can borrow it to fund high-frequency trading rigs that frontrun you.",
    "Drafting": "Pretending you understand financial mechanics by copy-pasting code while elites transact at fiber-speeds that laugh at your browser latency.",
    "Shelf Offering": "The ultimate corporate exit scheme. When a company realizes its stock is overvalued due to retail hype, they dump new shares from the 'shelf' directly onto your head.",
    "Arbitrage": "The art of using multimillion-dollar fiber-optic lines to frontrun slow retail orders by 3 nanoseconds. Fully legal, provided your yacht is large enough.",
    "Adverse Selection": "A sophisticated trading scenario where you believe you scored a brilliant bargain, but in reality, you just bought toxic waste from an insider who knows the company is folding.",
    "Inflation": "A quiet stealth-tax on the middle class designed to degrade their buying power while inflating the hard assets of elites like me.",
    "Technical Analysis": "Astrology for finance enthusiasts who wear Patagonia vests. Drawing colorful crayon lines on historical charts to feel in control while my market makers eat your limit orders.",
    "Absolute Advantage": "What I possess over you in every imaginable domain: capital depth, processing speed, margins, and overall caliber. Also, some basic trade efficiency concept.",
    "Beta Coefficient": "A math metric telling you how fast your speculative portfolio will disintegrate when my proprietary desk decides to decrease leverage.",
    "51% Attack": "An elegant display of raw hardware superiority where a wealthier entity commands a decentralised consensus ledger by sheer hashing force, proving that code is only 'law' when you own the server grid.",
    "Accounting Equation": "The illusion of balance. Nominally represents Assets = Liabilities + Equity, but practically measures how successfully our auditors hide parent-company liabilities in offshore special-purpose vehicles.",
    "Acquisition": "The corporate equivalent of consumption. Swallowing a smaller competitor before they discover we copied their patent, paying them in hyper-inflated stock options that vest when we are already retired.",
    "Environmental, Social, and Governance (ESG) Investing": "A premium fee-harvesting index strategy where we slap a green leaf logo on oil conglomerates so wealthy, guilt-ridden heirs feel superb about paying us 1.8% annual management fees.",
    "SEC Form 13F": "A delayed report showing what my fund held 45 days ago, giving retail sheep plenty of time to copy our trades right as we are shorting them to zero.",
    "10-Year Treasury Note": "A standard certificate where you lock up capital for a decade to lose purchasing power against real-world price inflation, essentially lending to a government that owes $34 trillion.",
    "Last Mile": "The phase where we squeeze delivery drivers down to the micro-cent for delivering packages, because optimizing logistics is the only way we keep our quarterly dividends growing.",
    "403(b) Plan": "A 401(k) derivative designed to farm fees from schoolteachers, doctors, and charitable workers who are too busy saving lives to notice the 2.50% annual expense ratio.",
    "SEC Form 10-K": "See '10-K'. Our compliance team spends 6 months drafting it so we do not go to prison while we execute strategic executive stock liquidations.",
    "10-Q SEC Form": "A quarterly checkpoint where corporate communications sanitizes three months of bad decisions so we can survive to the next incentive bonus payout.",
    "ADP National Employment Report": "A monthly data point used to distract television hosts with private payroll metrics, while our algorithms have already traded the payroll delta three minutes prior to the press release.",
    "1%/10 Net 30": "An ancient trade credit terms structure where slow corporations admit they lack liquidity, so we offer them a tiny discount if they pay us quickly enough to meet our payroll.",
    "10-Year Treasury": "A low-yield holding tool for risk-averse institutions who are legally forced to buy them, enabling governments to print more fiat without immediate collapse.",
    "1040 IRS Form": "The official document where you pledge allegiance to the state by handing over 40% of your labor, while my tax lawyers utilize offshore double-Irish structures to pay exactly zero.",
    "12B-1 Fee": "A brilliantly devious mutual fund fee where you literally pay the fund manager to market the fund to *other* gullible investors. Truly a masterpiece of fee-farming."
  };

  const termKey = Object.keys(handcrafted).find(k => k.toLowerCase() === term.toLowerCase() || term.toLowerCase().includes(k.toLowerCase()));
  if (termKey) return handcrafted[termKey];

  // Dynamic Generator based on category for the other 12,000+ terms
  const dynamicInsults = [
    `A classic structural decoy utilized by the financial system to capture margins from retail accounts who mistake themselves for "market participants."`,
    `A functional mechanism designed to lock up your cash reserves inside commercial banks so we can leverage mutual collateral pools to maximize our high-frequency gains.`,
    `What academic textbooks call "an essential pricing indicator," but my institutional spot desk classifies as "predictable consumer order book flow."`,
    `A theoretical formula taught by professors who have never traded a single contract, designed to ensure you remain an excellent, compliant corporate employee.`,
  ];
  
  let index = Math.abs(term.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)) % dynamicInsults.length;
  return `${dynamicInsults[index]} (In short, another cog in the grand machine that keeps retail liquidity flowing directly to elite nodes).`;
};

export default function DevilsAdvocatePanel({ 
  isNarcissistMode, 
  setIsNarcissistMode 
}: DevilsAdvocatePanelProps) {
  const [activeTab, setActiveTab] = useState<'intro' | 'quiz' | 'soundboard'>('intro');

  // Insults Soundboard Data
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null);
  const soundboardQuotes = [
    { category: "TECHNICAL ANALYSIS", trigger: "Technical Charts", text: "Ah, drawing lines on charts like a toddler with a crayon. Let me guess, your 'Fibonacci Retracement' will save you when a central bank floods the system with liquidity? Cute." },
    { category: "SPECULATORS & HODLers", trigger: "HODL Diamond Hands", text: "'Holding on for dear life' is a strategy invented by institutional whales to keep you quiet while they exit. Thank you for staying in the sinking boat." },
    { category: "PENNY STOCK GAMBLERS", trigger: "Penny Stock Pioneers", text: "You bought that penny stock because 'it can easily go from $0.10 to $1.00'. It's actually going to $0.00, but your small coin balance successfully financed the CEO's next boat slip." },
    { category: "RISK MANAGEMENT", trigger: "Tight Stop-Losses", text: "You set a protective 2% stop-loss. That's adorable. Our proprietary algorithmic triggers swept that stop-loss inside a millisecond, then bounced the price 30%. Thanks for the liquidity." },
    { category: "AI & QUANT TRADING", trigger: "AI Investing Tools", text: "Buying a social media bot script does not make you Jim Simons. It just guarantees that your trading capital evaporates at 10,500 API calls per second." },
    { category: "CENTRAL BANK ADMIRERS", trigger: "Central Bank Actions", text: "You think the FOMC debates rate policies to stabilize prices? No, they gather to decide which elite financial institutions get to expand their balance sheet first." }
  ];

  // Diagnostic Quiz States and Questions
  const [quizIndex, setQuizIndex] = useState(0);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [explanationText, setExplanationText] = useState<string | null>(null);

  const quizQuestions = [
    {
      q: "Your speculative option position plumments 45% on a Tuesday morning. What do you do?",
      opts: [
        { text: "Average down! It's a discount, the tech is amazing!", score: 0, feedback: "Hilarious. You are doubling down on a burning building because your ego cannot accept a stop-loss. My fund thanks you." },
        { text: "Hold it forever. It is only a loss if I hit sell!", score: 0, feedback: "A classic coping mantra. Your capital is now frozen in a zombie asset, suffering massive opportunity cost. Spectacular failure." },
        { text: "Immediately cut it. My underlying thesis failed, and I respect risk limits.", score: 20, feedback: "Surprisingly rational. You have a marginal survival instinct. You still got outsmarted, but you'll live to buy more top-heavy bags." },
        { text: "Complain on Reddit about options manipulation and 'naked shorts'.", score: -10, feedback: "The definition of retail noise. Your outrage is the fuel that powers our high-frequency clearing servers." }
      ]
    },
    {
      q: "An influencer guarantees an 'easy 35% APR risk-free yield' on a new DeFi project. You:",
      opts: [
        { text: "Put in half my savings immediately. Ground floors make fortunes!", score: 0, feedback: "You are the yield. In three weeks, when the creators migrate the liquidity pool to a bank in Barbados, please don't look surprised." },
        { text: "Study the Smart Contract code to verify the protocol.", score: 5, feedback: "You think reading a basic Solidity file makes you safe from a flash-loan exploit? Keep studying, college boy." },
        { text: "Realize that without a logical source, YOU are the source of the yield.", score: 20, feedback: "Correct. One point of intelligence detected. The yield is literally funded by gullible latecomers." },
        { text: "Report the post to regulatory committees.", score: -5, feedback: "Reporting a cartoon profile to a state committee that takes 3 years to issue a letter. How heroic." }
      ]
    },
    {
      q: "When a major stock index drops 4% in 15 minutes, what is happening in reality?",
      opts: [
        { text: "Panic among small individual investors worldwide.", score: 0, feedback: "Wrong. Small investors don't move the tape. That drop was a coordinated institutional liquidity sweep to clean out leveraged retail margins." },
        { text: "Algorithms hitting stop-triggers, causing automatic cascading sell programs.", score: 20, feedback: "Precisely. Systematic execution engines cleaning the index book. You are learning." },
        { text: "The President gave a negative speech.", score: 0, feedback: "You believe political theater moves billions of institutional dollars? How charmingly naive." },
        { text: "A physical system malfunction in the exchange server racks.", score: -10, feedback: "You think a dusty server wire caused a $50B market move? Back to the sandbox." }
      ]
    },
    {
      q: "You want to beat the Wall Street algorithms. What is your primary weapon?",
      opts: [
        { text: "A high-speed fiber internet connection and dual-monitor setup.", score: -10, feedback: "You are fighting an army of specialized server clusters co-located inside the exchange floor with a browser tab? Absolutely suicidal." },
        { text: "Sovereign emotional control and avoiding over-leveraged trades.", score: 20, feedback: "A genuine insight. The only way to survive is to stop playing our high-speed game and control your own psychology." },
        { text: "Paying $199/month for a premium algorithmic signal indicator package.", score: 0, feedback: "Selling signals to retail traders is the real arbitrage. You paid someone to sell you yesterday's data." },
        { text: "Advanced mathematics and manual calculations.", score: 10, feedback: "Unless your pen can write at 150,000 equations per millisecond, your math is just a historical ledger of how you went bust." }
      ]
    },
    {
      q: "Which best describes the Federal Reserve's primary purpose?",
      opts: [
        { text: "To maintain stable prices and maximize employment.", score: 0, feedback: "The corporate media narrative. In reality, it keeps the national currency flowing while protecting sovereign banking institutions from their own leverage errors." },
        { text: "To act as a central liquidity clearing backstop for global primary dealers.", score: 20, feedback: "Spot on. The lender of last resort exists to keep the banking system's debt bubble from popping." },
        { text: "To help the average citizen grow their retirement savings account.", score: -15, feedback: "You think a central bank manages interest rates for your granny's certificate of deposit? Your structural naivety is breathtaking." },
        { text: "To print paper money because physical cash is wearing out.", score: -5, feedback: "An absolute toddler-grade response. The currency is mostly electronic ledger entries." }
      ]
    }
  ];

  const handleOptionClick = (optIdx: number, scoreVal: number, feedback: string) => {
    setSelectedOpt(optIdx);
    setExplanationText(feedback);
  };

  const handleNextQuestion = () => {
    if (selectedOpt !== null) {
      setQuizScore(prev => prev + quizQuestions[quizIndex].opts[selectedOpt].score);
    }
    setSelectedOpt(null);
    setExplanationText(null);

    if (quizIndex + 1 < quizQuestions.length) {
      setQuizIndex(prev => prev + 1);
    } else {
      setQuizCompleted(true);
    }
  };

  const resetQuiz = () => {
    setQuizIndex(0);
    setSelectedOpt(null);
    setQuizScore(0);
    setQuizCompleted(false);
    setExplanationText(null);
  };

  const getRankBadge = (score: number) => {
    if (score >= 80) return { title: "ELITE QUANT ARBITRAGEUR", desc: "A terrifyingly rational brain. You view the markets as they are: a ruthless clearing engine. Welcome to the elite tier.", color: "text-[#00ffff] bg-cyan-950/40 border-cyan-400" };
    if (score >= 40) return { title: "MARGIN-COMPLIANT APPRENTICE", desc: "You have a basic survival drive and realize you aren't the genius in the room. Train harder and you might escape our stop-sweeps.", color: "text-[#FF007F] bg-pink-950/40 border-pink-400" };
    return { title: "COMPLACENT LIQUIDITY PROVIDER", desc: "The ultimate retail bagholder. You buy at the top, hold to the bottom, and pay our yacht slip fees. We salute your generous donations.", color: "text-red-400 bg-red-950/40 border-red-500/30" };
  };

  return (
    <div id="devils-advocate-portal" className="w-full bg-gradient-to-br from-[#0c0415] via-[#04081c] to-black border-2 border-dashed border-[#FF007F]/40 p-6 rounded-3xl relative overflow-hidden shadow-[0_0_30px_rgba(255,0,127,0.15)] flex flex-col gap-6 text-left">
      {/* Dynamic scanline element */}
      <div className="absolute inset-x-0 h-px bg-[#FF007F]/20 top-0 animate-pulse pointer-events-none" />
      
      {/* Decorative advocate title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-black/60 border border-[#FF007F] rounded-2xl text-[#FF007F] shadow-[0_0_15px_rgba(255,0,127,0.4)] animate-bounce">
            <Skull className="w-6 h-6" />
          </div>
          <div>
            <span className="font-mono text-[9px] text-[#FF007F] tracking-[0.2em] font-black uppercase leading-none block mb-1">
              DEVIL'S ADVOCATE CRITIQUE TERM
            </span>
            <h3 className="text-white font-black text-lg font-sans tracking-tight leading-none uppercase">
              THE NARCISSISTIC ARBITRAGE GATEWAY
            </h3>
          </div>
        </div>

        {/* Big Glowy Active Mode Indicator */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsNarcissistMode(!isNarcissistMode)}
            style={{
              boxShadow: isNarcissistMode ? '0 0 20px rgba(0, 217, 255, 0.4)' : 'none'
            }}
            className={`py-2 px-4.5 rounded-xl text-xs font-mono font-black uppercase tracking-wider transition-all duration-300 cursor-pointer border ${
              isNarcissistMode 
                ? 'bg-neutral-900 border-[#00D9FF] text-[#00D9FF]' 
                : 'bg-white/5 border-white/5 text-zinc-500 hover:text-white'
            }`}
          >
            {isNarcissistMode ? "● NARCISSIST MODE: ACTIVE" : "○ ACTIVATE NARCISSIST MODE"}
          </button>
        </div>
      </div>

      {/* Tabs list inside Devil's portal */}
      <div className="flex gap-2 p-1 bg-black/50 border border-white/5 rounded-xl shrink-0">
        {[
          { id: 'intro', label: 'THE CRITIQUE CHALLENGE', icon: Clock },
          { id: 'quiz', label: 'EGO HUMILIATION DICTIONARY TEST', icon: HelpCircle },
          { id: 'soundboard', label: 'ARROGANT SOUNDBOARD FEED', icon: Volume2 }
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 py-2 px-3 text-[10px] font-mono font-black uppercase rounded-lg cursor-pointer transition-all flex items-center justify-center gap-1.5 ${
                isActive 
                  ? 'bg-gradient-to-r from-[#FF007F]/20 to-purple-950/25 border border-[#FF007F]/40 text-white' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.02]'
              }`}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>

      {/* Content Renderer based on tabs */}
      <div className="flex-1 min-h-[220px] text-zinc-300 font-sans text-xs leading-relaxed">
        {activeTab === 'intro' && (
          <div className="flex flex-col gap-4">
            <p className="text-zinc-350 leading-relaxed font-semibold italic border-l-2 border-[#FF007F] pl-3">
              "Finished? You think cataloging alphabetical lists across an interactive layout makes you a master of financial logistics? What a charming exercise in textbook cataloging. Real financial power has absolutely nothing to do with standard definitions. It's about knowing exactly how the elite 0.01% monetize human sentiment and harvest retail liquidity. I challenge you to look behind the curtain."
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col gap-1">
                <span className="#00D9FF font-mono text-[#00D9FF] font-black text-[9.5px]">01 // DE-MASK INDEXES</span>
                <p className="text-zinc-500 text-[10.5px]">Toggle <b>Narcissist Mode</b> to translate all dictionary terms into brutal explanations of institutional reality.</p>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col gap-1">
                <span className="text-purple-400 font-mono font-black text-[9.5px]">02 // TEST YOUR COMPETENCE</span>
                <p className="text-zinc-500 text-[10.5px]">Take the <b>Humiliation Diagnostic</b> to evaluate whether you have true elite potential or if you are simply a market liquidity provider.</p>
              </div>
              <div className="p-4 bg-white/[0.01] border border-white/5 rounded-xl flex flex-col gap-1">
                <span className="text-[#FF007F] font-mono text-[9.5px] font-black">03 // INSULT FEED</span>
                <p className="text-zinc-500 text-[10.5px]">Trigger the <b>Arrogant Soundboard</b> to hear what market makers think of standard retail trading excuses.</p>
              </div>
            </div>
          </div>
        )}

        {/* Diagnostic Quiz Panel */}
        {activeTab === 'quiz' && (
          <div className="flex flex-col gap-4">
            {!quizCompleted ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center font-mono text-[9.5px] text-zinc-550 border-b border-white/5 pb-2">
                  <span>EGO INTEGRATION CHECKPOINT: {quizIndex + 1} / {quizQuestions.length}</span>
                  <span className="text-[#FF007F]">CURRENT ACCUMULATION: {quizScore} PTS</span>
                </div>

                <h4 className="text-white text-sm font-black font-sans tracking-tight mb-2 uppercase leading-snug">
                  {quizQuestions[quizIndex].q}
                </h4>

                <div className="flex flex-col gap-2.5">
                  {quizQuestions[quizIndex].opts.map((opt, oIdx) => {
                    const isSelected = selectedOpt === oIdx;
                    return (
                      <button
                        key={oIdx}
                        disabled={selectedOpt !== null}
                        onClick={() => handleOptionClick(oIdx, opt.score, opt.feedback)}
                        className={`w-full p-3.5 rounded-xl text-left font-semibold text-[11px] leading-relaxed transition-all cursor-pointer border ${
                          isSelected 
                            ? 'bg-[#FF007F]/10 border-[#FF007F] text-white' 
                            : 'bg-[#040813] border-white/5 text-zinc-350 hover:bg-white/[0.02] hover:border-white/10'
                        }`}
                      >
                        <span className="font-mono text-[#FF007F] mr-2 font-black">[{String.fromCharCode(65 + oIdx)}]</span>
                        {opt.text}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation text */}
                {explanationText && (
                  <div className="p-4 bg-[#0a020d]/80 border border-[#FF007F]/20 text-[11px] rounded-xl text-zinc-300 font-medium leading-relaxed font-mono mt-2 flex gap-2">
                    <span className="text-[#FF007F] font-black shrink-0">CRITIQUE➔</span>
                    <p>{explanationText}</p>
                  </div>
                )}

                {/* Confirm/Next buttons */}
                {selectedOpt !== null && (
                  <div className="flex justify-end mt-2 animate-fadeIn">
                    <button
                      onClick={handleNextQuestion}
                      className="py-2.5 px-6 bg-gradient-to-r from-[#FF007F] to-violet-900 border border-[#FF007F]/30 text-white font-mono text-[10.5px] font-black uppercase rounded-lg cursor-pointer hover:opacity-90 transition-all shadow-[0_0_15px_rgba(255,0,127,0.3)]"
                    >
                      {quizIndex + 1 === quizQuestions.length ? "VIEW DIAGNOSTIC RECORD" : "PROCEED TO NEXT CHECKPOINT ➔"}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center p-4 bg-black/40 border border-white/5 rounded-2xl gap-4">
                <Award className="w-12 h-12 text-[#00ffff] animate-pulse" />
                
                <div>
                  <h4 className="text-[10px] font-mono text-[#00ffff] font-black tracking-widest uppercase">DIAGNOSTIC VERDICT</h4>
                  <div className={`text-sm font-black border p-2 px-5 rounded-xl mt-2 inline-block font-mono ${getRankBadge(quizScore).color}`}>
                    {getRankBadge(quizScore).title}
                  </div>
                  <p className="text-zinc-400 text-xs leading-relaxed max-w-lg mt-3.5 font-sans font-medium">
                    {getRankBadge(quizScore).desc}
                  </p>
                </div>

                <button
                  onClick={resetQuiz}
                  className="mt-2 py-2 px-5 border border-white/10 hover:border-[#00ffff] text-white font-mono text-[10px] rounded-xl cursor-pointer flex items-center gap-1.5 bg-[#040813] transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  RETAKE DIAGNOSTIC COCKPITS
                </button>
              </div>
            )}
          </div>
        )}

        {/* Insult Soundboard Panel */}
        {activeTab === 'soundboard' && (
          <div className="flex flex-col gap-4">
            <span className="font-mono text-[9px] text-[#A3E635] tracking-widest uppercase">INTERACTIVE TRADER SOUNDBOARD FEED //</span>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {soundboardQuotes.map((q, qIdx) => (
                <button
                  key={qIdx}
                  onClick={() => setSelectedQuote(q.text)}
                  className="p-3 bg-[#040813] border border-white/5 hover:border-[#FF007F] rounded-xl text-left flex flex-col justify-between hover:bg-neutral-950/40 transition-all cursor-pointer font-sans h-24"
                >
                  <span className="font-mono text-[8px] text-[#FF007F] font-black uppercase tracking-wider">{q.category}</span>
                  <span className="text-white font-black text-xs block leading-tight mt-1 uppercase tracking-tight">{q.trigger}</span>
                  <span className="text-[9px] text-zinc-550 block font-mono font-bold mt-2">TRIGGER VO-TRANS ➔</span>
                </button>
              ))}
            </div>

            {/* Quote playback display */}
            {selectedQuote && (
              <div className="p-4.5 bg-gradient-to-r from-purple-700/10 to-transparent border border-[#FF007F]/20 rounded-2xl font-mono text-[11px] leading-relaxed relative overflow-hidden text-zinc-300 mt-2 select-text animate-fadeIn">
                <span className="absolute top-2 right-2 flex text-[8.5px] items-center gap-1 font-black text-[#FF007F] uppercase bg-[#FF007F]/10 border border-[#FF007F]/20 px-1.5 py-0.5 rounded leading-none">
                  <Volume2 className="w-3 h-3 animate-ping" />
                  AUDIO FEED
                </span>
                <p className="font-semibold italic max-w-[90%]">"{selectedQuote}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
