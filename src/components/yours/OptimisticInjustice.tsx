import React from 'react';
import { Clock, ShieldCheck, Heart, Sparkles, BookOpen, Star, ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';

// Exporting the raw structured data for integration in feed arrays
export const OPTIMISTIC_INJUSTICE_ARTICLE = {
  id: 'optimistic-injustice',
  category: 'magazine',
  subcategory: 'Philosophy',
  title: 'Optimistic Injustice: The 168-Hour Equalizer and the Architecture of Cognitive Access',
  premium: false,
  source: 'CPMS Core Truth Desk',
  image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=600',
  time: 'Just now',
  desc: 'Every human being is granted exactly 168 hours each week. The injustice lies not in our time, but in the cognitive barriers designed into the modern digital landscape. Optimistic Injustice is the philosophy of reclamation.',
  longText: 'The mathematics of time is unyielding. 24 hours a day, 7 days a week, equals exactly 168 hours. No industrial capital, legacy privilege, or intellectual hierarchy can expand it; no economic disparity or physical boundary can contract it. It is the absolute, ultimate equalizer of human experience. Yet, a silent injustice transpires code-wide across modern software architectures. For individuals with neurodivergent profiles—Down syndrome, dyspraxia, dyslexia, autism, ADD, and ADHD—an enormous tax is levied on these 168 hours. Unnecessary visual density, simulated telemetry clutter, endless buy/sell noise, and confusing synthetic feedback loops consume their precious focus. This is not custom design; it is cognitive drag. "Optimistic Injustice" represents our radical defiance. By engineering interfaces with absolute truth, zero fallback substitutions, and clean typographic rhythm, we restore these hours to their rightful owners. We reject standard industry over-complications. Instead, we build clean, unvarnished pathways of reality, ensuring that high school students, neurodivergent analysts, and learners worldwide can process direct market signals with complete clarity, autonomy, and dignity.'
};

export default function OptimisticInjusticeArticle() {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="bg-zinc-950/90 border border-purple-500/30 rounded-3xl p-6 md:p-8 space-y-8 shadow-[0_12px_40px_rgba(168,85,247,0.1)] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-purple-500/10 to-transparent blur-2xl rounded-full pointer-events-none" />
      <div className="absolute left-0 bottom-0 w-48 h-48 bg-gradient-to-tr from-cyan-500/10 to-transparent blur-3xl rounded-full pointer-events-none" />

      {/* Badge block */}
      <div className="flex flex-wrap items-center gap-3 relative z-10">
        <span className="text-[9px] font-mono tracking-[0.25em] bg-gradient-to-r from-purple-500 to-pink-500 text-white px-2.5 py-0.5 rounded-full font-black uppercase shadow-[0_0_10px_rgba(168,85,247,0.3)]">
          FEATURED WRITING
        </span>
        <span className="flex items-center gap-1 text-[11px] font-mono text-purple-400">
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          The #168 Principle
        </span>
        <span className="text-zinc-500 text-[10px] font-mono border-l border-white/10 pl-3">
          GENESIS SERIES
        </span>
      </div>

      {/* Main Title & Concept banner */}
      <div className="space-y-4 relative z-10">
        <h2 className="text-3xl md:text-4.5xl font-serif italic font-black tracking-tight text-white leading-tight">
          Optimistic Injustice: <br className="hidden md:inline" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400">
            The 168-Hour Equalizer and Cognitive Sovereignty
          </span>
        </h2>
        
        <p className="text-sm md:text-base text-zinc-300 font-sans leading-relaxed border-l-2 border-purple-500 pl-4 italic">
          "Every week provides exactly 168 hours. No billionaire can buy 169, and no human being has to settle for 167. Our mission is to protect this equal ground."
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        {/* Editorial Text */}
        <div className="lg:col-span-8 text-xs md:text-sm text-zinc-400 font-sans leading-relaxed space-y-6 text-justify">
          <p>
            <span className="text-5xl text-purple-400 font-serif font-black float-left mr-3 mt-1 leading-none drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
              T
            </span>
            ime is the single absolute, uncompromised, and unbendable currency of human existence. It makes no exceptions for social hierarchies, geographical coordinates, or financial standing. Across seven rotations of the earth, every single representative of the human families inherits exactly <strong className="text-white">168 hours</strong>. It is the ultimate baseline of equity.
          </p>

          <p>
            Yet, the modern digital landscape has committed a quiet, pervasive injustice. Instead of treating these 168 hours as sacred, contemporary software layouts are engineered to extract, clutter, and deplete them. Complicated broker-like charts, blinking tickers, confusing artificial signals, and complex interfaces force minds to struggle. For those possessing cognitive differences—including Down syndrome, dyspraxia, dyslexia, autism, ADD, or ADHD—this burden is multiplied tenfold. They are forced to spend a significant fraction of their 168 hours simply "translating" poor, overly technical, and chaotic layouts just to inspect the same fundamental data values.
          </p>

          <p className="border-t border-b border-white/5 py-4 my-4 font-serif text-sm italic text-purple-300 text-center">
            "Simplification is not a dumbing down; it is the ultimate act of respect, turning raw data into an unburdened human playground."
          </p>

          <p>
            This is where <strong className="text-purple-400 font-medium">Optimistic Injustice</strong> takes its stand. We recognize the structural inequality ("Injustice") of the barriers placed before neurodivergent minds, but we meet it with a radical, constructive momentum ("Optimism"). We refuse to gatekeeper information behind high-barrier terminology or confusing layouts. By stripping away simulations, synthetic fillers, complex buttons, and "tech larping," we restore clarity.
          </p>

          <p>
            This data processing terminal is built for the high school student, the autistic learner, the individual with learning challenges, and the curious mind who wants to see the raw world clearly. We leverage the absolute unvarnished truth. When API keys fail, we propagate the exact error code rather than concealing it behind simulated fallbacks. No buy buttons. No sell buttons. Just real reality, mapped gracefully.
          </p>
        </div>

        {/* Dynamic Sidebar Stats Board / Infographic */}
        <div className="lg:col-span-4 bg-black/60 border border-purple-500/20 rounded-2xl p-5 space-y-5 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-purple-500 to-pink-500" />
          
          <h4 className="text-xs font-black tracking-widest uppercase font-mono text-zinc-300">
            METRICS & CORE PRINCIPLES
          </h4>

          {/* Principle 1 */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="text-purple-400 font-extrabold">#168</span> Absolute Baseline
              </span>
              <span className="text-emerald-400">100% Equal</span>
            </div>
            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" style={{ width: '100%' }} />
            </div>
            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
              Every person is allocated exactly 168 hours. We protect this space.
            </p>
          </div>

          {/* Principle 2 */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-pink-400" /> No Synthetic Clutter
              </span>
              <span className="text-pink-400 font-bold">Absolute Parity</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
              No simulated ticks, synthetic pricing overlays, or false indicators code-wide.
            </p>
          </div>

          {/* Principle 3 */}
          <div className="space-y-1.5 pt-2 border-t border-white/5">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-cyan-400" /> Human Accessibility
              </span>
              <span className="text-cyan-400 font-bold">Zero Cognitive Drag</span>
            </div>
            <p className="text-[10px] text-zinc-500 font-sans leading-relaxed">
              Designed explicitly with Down syndrome, dyspraxia, and ADHD safety pathways in mind.
            </p>
          </div>

          <div className="pt-4 border-t border-white/5 flex justify-center">
            <span className="text-[9px] font-mono text-zinc-500 italic uppercase">
              CPMS Sovereign Science Division
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
