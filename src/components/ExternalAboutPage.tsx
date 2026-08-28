import React from 'react';
import { ArrowLeft, Cpu, ShieldCheck, Zap, Activity, Users, LineChart, Building2 } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';
import GovernmentFinanceLinks from './GovernmentFinanceLinks';
import { ABOUT_MANIFESTO_CLOSER, ABOUT_MANIFESTO_LEAD } from '../content/aboutManifesto';

export default function ExternalAboutPage() {
  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-y-auto overflow-x-hidden pb-20 relative">
      <SEO
        title="About ClearPath Trader | Market Intelligence Terminal"
        description="Some people see patterns. Some people need structure. Some people learn visually. ClearPath Trader is a market intelligence terminal — charts, encyclopedias, education, accessibility — not a brokerage, not a website chatbot, not aiclearpath.com."
        canonical="https://clearpathtrader.com/about"
      />
      <SurfBackground />
      
      {/* Nav */}
      <nav className="relative z-10 w-full p-6 lg:px-12 flex justify-between items-center border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-[0_0_20px_#4D00FF]">
            
          </div>
          <span className="font-black tracking-tighter text-xl uppercase italic text-white flex flex-col leading-none">
            <span>CLEAR PATH MARKETS SCIENCE</span>
            <span className="text-sm lava-hot-text">TRADER</span>
          </span>
        </div>
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleBack}
            className="flex items-center space-x-2 px-4 py-2 border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-lg hover:bg-white/5 transition-colors"
          >
            <ArrowLeft size={16} />
            <span>Back to Terminal</span>
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20">
        <div className="space-y-16">
          
          <header className="text-center space-y-6">
            <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-mono uppercase tracking-widest mb-4">
              <Building2 size={14} className="mr-2" />
              Board-Governed Platform
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[1.1]">
              About <span className="lava-hot-text">ClearPath Trader</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-sans max-w-3xl mx-auto leading-relaxed">
              ClearPath Trader is a <strong className="text-indigo-400 font-normal">full market intelligence and education terminal</strong> — live charts, pattern scans, encyclopedias, Literacy OS, a macro desk, custom indicators, and 13 accessibility profiles. It is <strong className="text-white font-normal">not</strong> a website chatbot, not a receptionist bot, and not aiclearpath.com.
            </p>
          </header>

          <section
            id="about-manifesto"
            aria-labelledby="about-manifesto-heading"
            className="glass p-8 md:p-12 rounded-3xl border border-[#00FFFF]/20 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#00FFFF]/10 rounded-full blur-[100px] pointer-events-none" />
            <h2 id="about-manifesto-heading" className="sr-only">
              Some people see patterns
            </h2>
            <p className="relative text-zinc-200 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto whitespace-pre-line font-cinzel font-bold">
              {ABOUT_MANIFESTO_LEAD}
            </p>
            <div className="w-24 h-[3px] mx-auto my-10 bg-[#FF1493] rounded-full shadow-[0_0_10px_rgba(255,20,147,0.5)]" />
            <p className="relative text-zinc-300 text-lg sm:text-xl md:text-2xl leading-relaxed max-w-4xl mx-auto whitespace-pre-line font-cinzel font-bold">
              {ABOUT_MANIFESTO_CLOSER}
            </p>
          </section>

          <section className="glass p-8 md:p-10 rounded-3xl border border-amber-500/20 shadow-2xl relative overflow-hidden">
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-4">
              Not a website chatbot
            </h2>
            <p className="text-gray-400 leading-relaxed text-base md:text-lg mb-4">
              Search engines sometimes mix us up with unrelated “ClearPath” products that greet website visitors, capture leads, and book appointments. That is a different company. ClearPath Trader is a <strong className="text-white">trading terminal</strong>: charts, indicators, education, and research. C.P.T. Buddy lives <em>inside</em> that terminal to teach markets — it does not sit on someone else’s homepage as a sales widget.
            </p>
            <ul className="text-gray-400 text-sm md:text-base space-y-2 list-disc pl-5">
              <li>Live multi-asset charts + unlimited indicators + automatic pattern context</li>
              <li>Financial encyclopedia + indicator encyclopedia + beginner-to-advanced education</li>
              <li>Literacy OS, macro desk, INDACREATOR / River Genie</li>
              <li>13 neurodivergent / accessibility UI profiles</li>
              <li>Not a broker. Not lead-gen. Not appointment booking.</li>
            </ul>
          </section>

          <section className="glass p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
            <h2 className="text-2xl font-black text-white uppercase tracking-tight mb-6 flex items-center">
              <ShieldCheck className="text-indigo-500 mr-4" size={28} />
              Governance &amp; Mission
            </h2>
            <div className="space-y-5 text-gray-400 leading-relaxed text-base md:text-lg">
              <p>
                ClearPath is developed under the oversight of a <strong className="text-white">board of directors</strong> with a shared mandate: ship tools that help people read markets without noise, hype, or predatory design. We are an analytics and education company — <strong className="text-white">not a broker</strong> and not a fund manager.
              </p>
              <p>
                Our focus is practical: live charts you can search and arrange, pattern context, macro and news feeds, and structured learning — so operators can study price action on their own terms.
              </p>
            </div>
          </section>

          {/* Section 1: Design philosophy */}
          <section className="glass p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-6 flex items-center">
              <Cpu className="text-indigo-500 mr-4" size={32} />
              Built for Clarity
            </h2>
            <div className="space-y-6 text-gray-400 leading-relaxed text-lg">
              <p>
                Most terminals dump maximum density by default. ClearPath starts from the opposite assumption: <strong className="text-white">the screen should adapt to how you work</strong>, not the other way around.
              </p>
              <p>
                That means <strong className="text-white">adjustable data density</strong>, readable typography, calm color profiles, and chart slots you control — search any symbol, place panels where you want them, and strip chrome when you only need price. No single layout is forced on you.
              </p>
            </div>
          </section>

          {/* Section 2: Unified Platform */}
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight text-center">
              The All-In-One Unified Analysis Hub
            </h2>
            <p className="text-center text-gray-400 max-w-2xl mx-auto">
              Stop the noise of tab-switching. We are the ultimate <strong>analysis hub that replaces multiple apps</strong>, bringing everything together in one place.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl">
                <LineChart className="text-indigo-500 mb-4" size={28} />
                <h3 className="text-xl font-bold text-white mb-3">Live Market Data & Charting</h3>
                <p className="text-sm text-gray-400">
                  A high-velocity <strong>real-time market data platform</strong> and an entirely <strong>customizable charting hub for analysts</strong>. Access lightning-fast, <strong>mobile visualization charts</strong> alongside deep historical data.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl">
                <Activity className="text-red-500 mb-4" size={28} />
                <h3 className="text-xl font-bold text-white mb-3">Forex & Crypto Synced</h3>
                <p className="text-sm text-gray-400">
                  The definitive <strong>forex and crypto visualization platform</strong>. Secure access to <strong>real-time market data</strong> and highly responsive <strong>crypto and forex charts</strong> without touching a third-party application.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl">
                <Users className="text-green-500 mb-4" size={28} />
                <h3 className="text-xl font-bold text-white mb-3">Community & Social Sentiment</h3>
                <p className="text-sm text-gray-400">
                  A genuinely <strong>unified analysis platform with social sentiment</strong>. Monitor <strong>live market sentiment tools</strong> alongside global discussion in our <strong>analysis dashboard with social integration</strong>.
                </p>
              </div>
              <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-2xl">
                <Zap className="text-yellow-500 mb-4" size={28} />
                <h3 className="text-xl font-bold text-white mb-3">AI & Tactical Analysis</h3>
                <p className="text-sm text-gray-400">
                  An <strong>AI analysis dashboard</strong> that doesn't just read data—it interprets it. Experience a state-of-the-art <strong>market analysis platform</strong> that delivers autonomous insights and <strong>customizable alerts</strong>.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Applications & Differentiation */}
          <section className="glass p-10 rounded-3xl border border-white/5 space-y-8">
            <div className="text-center">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-4">
                Adaptive vs. Theme-Adaptive
              </h2>
              <p className="text-gray-400">Why standard "customization" is an outdated paradigm.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-8">
              <div className="space-y-4">
                <div className="inline-flex px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs font-bold uppercase tracking-widest">Standard Adaptive (Legacy)</div>
                <h3 className="text-xl font-bold text-white">Surface-Level Modifications</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Most setups offer "customizable trading charts" or a basic "dark mode trading interface", but the core architecture remains chaotic. Standard dashboards dump maximum data density onto the user, leading to immediate processing fatigue and analysis paralysis.
                </p>
              </div>
              <div className="space-y-4">
                <div className="inline-flex px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-xs font-bold uppercase tracking-widest">Theme-Adaptive (Clear Path Markets Science)</div>
                <h3 className="text-xl font-bold text-white">Clear Alignment</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  A true <strong>all-in-one trading dashboard</strong> that shifts structurally. It scales chart density and visual intensity up or down based on <strong>your</strong> workflow — fewer distractions when you want focus, full depth when you want it.
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: Use Cases */}
          <section className="space-y-8">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight text-center">Use Cases</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-white/10 rounded-2xl p-6 bg-[#050505]">
                <h3 className="text-white font-bold mb-2">The Multi-Asset Analyst</h3>
                <p className="text-sm text-gray-500">Requires <strong>all analysis tools in one place</strong>. They monitor forex pairs and crypto momentum concurrently, utilizing our <strong>customizable visualization charts</strong> to process data with milliseconds of edge, leveraging the <strong>fast analysis dashboard</strong>.</p>
              </div>
              <div className="border border-white/10 rounded-2xl p-6 bg-[#050505]">
                <h3 className="text-white font-bold mb-2">The Focused Layout</h3>
                <p className="text-sm text-gray-500">Uses calm profiles and lower-density views to read price action without fighting the interface — <strong>searchable charts</strong>, draggable panels, and typography tuned for long sessions.</p>
              </div>
              <div className="border border-white/10 rounded-2xl p-6 bg-[#050505]">
                <h3 className="text-white font-bold mb-2">The Syndicate & Student</h3>
                <p className="text-sm text-gray-500">Leverages the <strong>integrated analysis education platform</strong> and <strong>analysis platform with community features</strong> to cross-reference their personal thesis against live market momentum.</p>
              </div>
            </div>
          </section>

          {/* Section 5: What operators say (anonymous, no labels) */}
          <section className="relative p-10 mt-16 rounded-3xl overflow-hidden border border-indigo-500/20">
            <div className="absolute inset-0 lava-hot-gradient opacity-5" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-10 text-center">From the Desk</h2>
              <div className="space-y-8">
                <blockquote className="bg-[#050505]/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-gray-300 italic mb-4">"Before ClearPath, my workflow was six browser tabs — charts, chat, calendar, news. Now the terminal keeps research in one place. I pick my symbols and layouts; nothing is pre-loaded on me."</p>
                  <footer className="text-indigo-400 font-mono text-xs uppercase tracking-widest">— Multi-asset analyst</footer>
                </blockquote>
                <blockquote className="bg-[#050505]/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-gray-300 italic mb-4">"Standard hubs are loud — alerts, clutter, tiny type. ClearPath lets me run a <strong>dark, readable layout</strong> with <strong>adjustable density</strong>. I stay on the chart instead of fighting the UI."</p>
                  <footer className="text-lava-red font-mono text-xs uppercase tracking-widest">— Independent operator</footer>
                </blockquote>
              </div>
            </div>
          </section>

          {/* Section 6: FAQ */}
          <section className="space-y-8 pb-10">
            <h2 className="text-3xl font-black text-white uppercase tracking-tight text-center">Frequently Asked Questions</h2>
            <div className="max-w-3xl mx-auto space-y-4">
              
              <div className="bg-[#0a0a0a] rounded-xl p-6 border border-white/5">
                <h3 className="text-white font-bold mb-2 flex items-center">
                  <span className="text-indigo-500 mr-3">Q.</span> 
                  Is ClearPath a brokerage?
                </h3>
                <p className="text-gray-400 text-sm ml-7">
                  No. ClearPath Trader provides <strong>market data visualization, education, and research tools</strong>. We do not hold customer funds, execute trades, or provide personalized investment advice.
                </p>
              </div>

              <div className="bg-[#0a0a0a] rounded-xl p-6 border border-white/5">
                <h3 className="text-white font-bold mb-2 flex items-center">
                  <span className="text-indigo-500 mr-3">Q.</span> 
                  Can I track multiple asset classes?
                </h3>
                <p className="text-gray-400 text-sm ml-7">
                  Absolutely. Clear Path Markets Science is a premier <strong>forex and crypto visualization platform</strong> giving you unrestricted access to <strong>real-time market data</strong> and comprehensive <strong>crypto and forex charts</strong> simultaneously.
                </p>
              </div>

              <div className="bg-[#0a0a0a] rounded-xl p-6 border border-white/5">
                <h3 className="text-white font-bold mb-2 flex items-center">
                  <span className="text-indigo-500 mr-3">Q.</span> 
                  Does it work well for mobile operators?
                </h3>
                <p className="text-gray-400 text-sm ml-7">
                  The infrastructure natively supports responsive viewports, providing uncompromised <strong>mobile analysis charts</strong> and ensuring you have an on-the-go <strong>centralized data platform</strong> without sacrificing theme-adaptive benefits.
                </p>
              </div>

            </div>
          </section>

        </div>
      </main>

      <footer className="relative z-10 text-center py-10 text-gray-600 text-xs uppercase tracking-widest font-mono border-t border-white/5">
        <div className="max-w-4xl mx-auto px-6">
          <p>By connecting to this terminal, you submit to our AI-driven algorithmic protocols.</p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-4 md:gap-8 text-indigo-500/70 font-bold uppercase tracking-widest text-[10px]">
            <a href="/accessibility" className="text-[#00FFFF] hover:text-white transition-colors">Accessibility · WCAG</a>
            <span className="text-white/10 hidden md:block">•</span>
            <a href="/ui" className="hover:text-indigo-400 transition-colors">Accessible UI Modes</a>
            <span className="text-white/10 hidden md:block">•</span>
            <a href="/" className="hover:text-indigo-400 transition-colors">Return to Login</a>
            <span className="text-white/10 hidden md:block">•</span>
            <a href="/press" className="hover:text-indigo-400 transition-colors">Press Kit</a>
            <span className="text-white/10 hidden md:block">•</span>
            <a href="/platform-scope.html" className="hover:text-indigo-400 transition-colors">Platform Scope</a>
            <span className="text-white/10 hidden md:block">•</span>
            <a href="/terms.html" className="hover:text-indigo-400 transition-colors">Terms</a>
            <span className="text-white/10 hidden md:block">•</span>
            <a href="/privacy.html" className="hover:text-indigo-400 transition-colors">Privacy</a>
            <span className="text-white/10 hidden md:block">•</span>
            <a href="/disclaimer.html" className="hover:text-indigo-400 transition-colors">Disclaimer</a>
          </div>
          <p className="mt-6 text-indigo-900">&copy; {new Date().getFullYear()} Clear Path Markets Science Grid</p>
          <GovernmentFinanceLinks compact />
        </div>
      </footer>
    </div>
  );
}
