import React from 'react';
import { InterfaceProfile } from '../types';
import GovernmentFinanceLinks from './GovernmentFinanceLinks';
import { LEGAL_POSITIONING_BLURB } from '../legal/nonAdvisoryCopy';

interface LegalFooterProps {
  profile?: InterfaceProfile;
  onShowTerms?: () => void;
}

export default function LegalFooter({ profile, onShowTerms }: LegalFooterProps) {
  return (
    <footer className="mt-auto py-8 px-6 border-t text-sm font-bold font-mono text-center glass" 
            style={{ borderColor: profile ? `${profile.borderA}22` : '#272a3a', color: profile ? profile.text : '#5c5e6e' }}>
      <div className="flex flex-col space-y-3 opacity-70">
        <div className="text-xl font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-[#ff3333] via-[#ff6633] to-[#ff9933]" style={{ fontFamily: "'Cinzel', serif" }}>
          <span className="mr-2" style={{ color: profile?.borderA }}>⚖</span>
          <span style={{ color: profile?.borderA }}>Legal Positioning</span> — “{LEGAL_POSITIONING_BLURB}”
        </div>
        <nav
          className="flex justify-center items-center space-x-6 text-sm font-bold pt-2 flex-wrap gap-y-2"
          aria-label="Accessibility and legal links"
        >
          <a href="/accessibility" className="hover:underline transition-all hover:scale-105" style={{ color: profile?.borderA || '#00FFFF' }}>
            Accessibility · WCAG
          </a>
          <span className="opacity-50">•</span>
          <a href="/ui" className="hover:underline transition-all hover:scale-105" style={{ color: profile?.borderA }}>
            Accessible UI Modes
          </a>
          <span className="opacity-50">•</span>
          <a href="/platform-scope.html" className="hover:underline transition-all hover:scale-105" style={{ color: profile?.borderA }}>Platform Scope</a>
          <span className="opacity-50">•</span>
          {onShowTerms ? (
            <button onClick={onShowTerms} className="hover:underline transition-all hover:scale-105 cursor-pointer" style={{ color: profile?.borderA }}>Terms & Conditions</button>
          ) : (
            <a href="/terms.html" className="hover:underline transition-all hover:scale-105" style={{ color: profile?.borderA }}>Terms</a>
          )}
          <span className="opacity-50">•</span>
          <a href="/privacy.html" className="hover:underline transition-all hover:scale-105" style={{ color: profile?.borderA }}>Privacy</a>
          <span className="opacity-50">•</span>
          {onShowTerms ? (
            <button onClick={onShowTerms} className="hover:underline transition-all hover:scale-105 cursor-pointer" style={{ color: profile?.borderA }}>Disclaimer</button>
          ) : (
            <a href="/disclaimer.html" className="hover:underline transition-all hover:scale-105" style={{ color: profile?.borderA }}>Disclaimer</a>
          )}
          <span className="opacity-50">•</span>
          <button type="button" className="hover:underline transition-all hover:scale-105" style={{ color: profile?.borderA }}>CPT Bible</button>
          <span className="opacity-50">•</span>
          <span className="opacity-50">© {new Date().getFullYear()} Clear Path Markets Science</span>
        </nav>
      </div>
      <GovernmentFinanceLinks compact />
    </footer>
  );
}
