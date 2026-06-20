import React, { useState } from 'react';
import { ArrowLeft, Brain, Cpu, ShieldCheck, Zap, Activity, Users, LineChart, MessageSquare } from 'lucide-react';
import SEO from './SEO';
import { SurfBackground } from './SurfBackground';

export default function ExternalAboutPage() {
  const handleBack = () => {
    window.location.href = '/';
  };

  return (
    <div className="h-[100dvh] max-h-[100dvh] w-full bg-[#050505] text-[#ccc8db] font-sans overflow-y-auto overflow-x-hidden pb-20 relative">
      <SEO 
        title="Accessible Display Technology for Clear Insights | Clear Path Markets Science" 
        description="Accessible Display Technology for market traders. Adaptive technology with high clarity for real-time insights and decision support." 
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
              <Brain size={14} className="mr-2" />
              high clarity Enabled
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter uppercase italic leading-[1.1]">
              Accessible Display Technology <br className="hidden md:block" />
              <span className="lava-hot-text">For Market Analysis</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-400 font-sans max-w-3xl mx-auto leading-relaxed">
              Clear Path Markets Science is the premier <strong className="text-indigo-400 font-normal">advanced analysis platform</strong> built entirely on accessibility needs. By fusing <strong className="text-white font-normal">adaptive technology with high clarity</strong>, we've developed an environment that actively processes and supports your real-time insights and data organization capabilities.
            </p>
          </header>

          {/* Section 1: Definition */}
          <section className="glass p-8 md:p-10 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
            <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-6 flex items-center">
              <Cpu className="text-indigo-500 mr-4" size={32} />
              What is Accessible Display Technology?
            </h2>
            <div className="space-y-6 text-gray-400 leading-relaxed text-lg">
              <p>
                Standard interfaces are static; they force the brain to adapt to the screen. <strong>Accessible Display Technology</strong> reverses this dynamic. It dynamically shifts visual hierarchies, data flow logic, and auditory feedback to match the user's specific processing processing style.
              </p>
              <p>
                As the leading <strong className="text-white">analysis platform for people with disabilities</strong>, Clear Path Markets Science offers an <strong>interface with adjustable data density</strong>. Whether you require a hyper-focused, <strong className="text-white">minimal and high-stimulation visualization interface</strong> or a low-velocity visual stream to mitigate sensory overload, this system is a <strong>easy-to-read platform</strong> designed to give you absolute control over your mental bandwidth.
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
                  A true <strong>all-in-one trading dashboard</strong> that shifts structurally. It scales its <strong>centralized trading data platform</strong> up or down based on your psychological saturation limit. It's a <strong>fast trading dashboard</strong> that physically aligns with your nervous system.
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
                <h3 className="text-white font-bold mb-2">The Accessible View</h3>
                <p className="text-sm text-gray-500">Requires a sanctuary. They activate our low-distraction profiles to interact with a <strong>easy-to-read platform</strong>, absorbing deep market truth without the visual anxiety of standard environments.</p>
              </div>
              <div className="border border-white/10 rounded-2xl p-6 bg-[#050505]">
                <h3 className="text-white font-bold mb-2">The Syndicate & Student</h3>
                <p className="text-sm text-gray-500">Leverages the <strong>integrated analysis education platform</strong> and <strong>analysis platform with community features</strong> to cross-reference their personal thesis against live market momentum.</p>
              </div>
            </div>
          </section>

          {/* Section 5: Operator Testimonials */}
          <section className="relative p-10 mt-16 rounded-3xl overflow-hidden border border-indigo-500/20">
            <div className="absolute inset-0 lava-hot-gradient opacity-5" />
            <div className="relative z-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-10 text-center">Operator Testimonials</h2>
              <div className="space-y-8">
                <blockquote className="bg-[#050505]/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-gray-300 italic mb-4">"Before Clear Path Markets Science, my memory footprint was tied up in six different browser windows. TradingView, Discord, a crypto exchange, an economic calendar... Now I have an <strong>analysis platform without switching apps</strong>. <strong>All research tools in one place</strong>. My data processing speed tripled."</p>
                  <footer className="text-indigo-400 font-mono text-xs uppercase tracking-widest">— Senior Crypto Data Analyst</footer>
                </blockquote>
                <blockquote className="bg-[#050505]/50 p-6 rounded-xl border border-white/5 backdrop-blur-sm">
                  <p className="text-gray-300 italic mb-4">"As someone on the spectrum, standard financial hubs cause severe sensory overload. The flashing, the alerts, the density. Finding an <strong>analysis platform for people with disabilities</strong> with a true, pure <strong>dark mode interface</strong> and <strong>adjustable data density</strong> saved my career."</p>
                  <footer className="text-lava-red font-mono text-xs uppercase tracking-widest">— Private Equities Managing Director</footer>
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
                  Is this essentially an analysis dashboard with social integration?
                </h3>
                <p className="text-gray-400 text-sm ml-7">
                  Yes, but structurally much deeper. It is a <strong>unified analysis platform with social sentiment</strong>. You don't just "see chat"—you map global emotional bias directly to your <strong>charting hub for analysts</strong> using <strong>live market sentiment tools</strong>.
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
            <a href="/" className="hover:text-indigo-400 transition-colors">Return to Login</a>
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
        </div>
      </footer>
    </div>
  );
}
