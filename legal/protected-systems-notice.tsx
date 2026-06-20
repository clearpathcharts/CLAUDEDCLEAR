import React from "react";

export default function ProtectedSystemsNotice({ onAccept }: { onAccept?: () => void }) {
  return (
    <div className="fixed inset-0 bg-[#050505]/95 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div 
        className="bg-[#101010] border-2 border-cyan-500/30 rounded-[2.5rem] max-w-2xl w-full p-8 md:p-10 text-left relative overflow-hidden shadow-[0_0_50px_rgba(0,255,225,0.15)]"
        id="protected-systems-card"
      >
        {/* Glow Strip */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#00ffe1] to-transparent" />
        
        <h1 className="text-2xl md:text-3xl font-cinzel font-black uppercase text-[#00ffe1] tracking-wider mb-6 text-center border-b border-white/10 pb-4">
          🛡️ CLEARPATHTRADER PROTECTED SYSTEMS NOTICE
        </h1>

        <div className="space-y-4 text-xs md:text-sm font-mono text-zinc-300 leading-relaxed overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
          <p className="font-semibold text-white">
            ClearPathTrader contains proprietary systems, AI-assisted workflows,
            automation structures, market organization frameworks, analytics systems,
            interface architectures, and intellectual property protected under
            applicable law and pending intellectual property filings.
          </p>

          <p className="text-zinc-400">
            By accessing this platform, you acknowledge and agree that you may not:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li><strong className="text-white">Scrape</strong> or harvest platform data programmatically.</li>
            <li><strong className="text-white">Reverse engineer</strong> proprietary systems or custom interfaces.</li>
            <li><strong className="text-white">Replicate</strong> platform architecture, feeds, or visual assets.</li>
            <li><strong className="text-white">Train AI systems</strong> or models using our proprietary data.</li>
            <li><strong className="text-white">Automate extraction</strong> using spiders, VPNs, proxies, or masking tools.</li>
            <li><strong className="text-white">Mirror, clone</strong>, or commercially reproduce any protected system models.</li>
          </ul>

          <p className="text-zinc-400 border-t border-white/5 pt-3">
            ClearPathTrader actively monitors and preserves forensic logs relating to:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>Automated scraping behavior and abnormal tick rates.</li>
            <li>Reverse engineering attempts and hidden route probe sweeps.</li>
            <li>Suspicious VPN or anonymous proxy activity filters.</li>
            <li>Bypassing standard authorization gateways.</li>
          </ul>

          <p className="text-zinc-400 border-t border-white/5 pt-3">
            Unauthorized use may result in:
          </p>

          <ul className="list-disc pl-5 space-y-2 text-zinc-400">
            <li>Immediate and permanent account termination.</li>
            <li>IP address blocks and device hardware fingerprint restrictions.</li>
            <li>Preservation of forensic evidence for legal proceedings.</li>
            <li>Legal enforcement actions where applicable.</li>
          </ul>

          <p className="text-amber-400 font-bold border-t border-white/5 pt-3 text-center">
            ⚠️ By continuing, you agree to the Terms of Service,
            Acceptable Use Policy, Privacy Policy,
            and Protected Systems Policy.
          </p>
        </div>

        <button 
          onClick={onAccept}
          className="mt-8 w-full bg-cyan-500 hover:bg-cyan-400 text-black font-mono text-sm font-black py-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.01] shadow-[0_0_20px_rgba(0,255,225,0.2)]"
        >
          ACCEPT & CONTINUE SYSTEM DEPLOYMENT
        </button>
      </div>
    </div>
  );
}
