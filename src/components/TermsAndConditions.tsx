import React, { useState, useEffect } from 'react';
import { Shield, FileText, CheckCircle2, ChevronLeft, Building, Scale, AlertTriangle, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SurfBackground } from './SurfBackground';
import { useAuth } from '../contexts/FirebaseContext';

interface TermsProps {
  onBack?: () => void;
  isBackend?: boolean;
}

export default function TermsAndConditions({ onBack, isBackend = false }: TermsProps) {
  const { user } = useAuth();
  const uid = user?.uid || 'guest';
  const termsKey = `terms_agreed_${uid}`;
  const selectionKey = `terms_selection_${uid}`;

  const [agreed, setAgreed] = useState<{ [key: string]: boolean }>(() => {
    try {
      const saved = localStorage.getItem(selectionKey);
      if (saved) {
        return {
          finra: false,
          sec: false,
          cftc: false,
          ftc: false,
          updates: false,
          ...JSON.parse(saved)
        };
      }
    } catch (e) {
      console.error('[TermsAndConditions] Failed to read cached selections:', e);
    }
    return {
      finra: false,
      sec: false,
      cftc: false,
      ftc: false,
      updates: false
    };
  });

  const allAgreed = Object.values(agreed).every(Boolean);

  useEffect(() => {
    try {
      localStorage.setItem(selectionKey, JSON.stringify(agreed));
      const hasAgreedAll = Object.values(agreed).every(Boolean);
      localStorage.setItem(termsKey, hasAgreedAll ? 'true' : 'false');
    } catch (e) {
      console.error('[TermsAndConditions] Failed to write agreement details:', e);
    }
  }, [agreed, uid, termsKey, selectionKey]);

  const toggleAgreement = (key: keyof typeof agreed) => {
    setAgreed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const sections = [
    {
      id: 'finra',
      title: 'FINRA Compliance',
      icon: Building,
      description: 'Compliance with the Financial Industry Regulatory Authority (FINRA) rules governing brokers and dealers, ensuring market integrity and investor protection.'
    },
    {
      id: 'sec',
      title: 'SEC Regulation',
      icon: Scale,
      description: 'Adherence to the Securities and Exchange Commission (SEC) laws, mandating full disclosure of material information and protection against market manipulation.'
    },
    {
      id: 'cftc',
      title: 'CFTC Oversight',
      icon: Shield,
      description: 'Compliance with the Commodity Futures Trading Commission (CFTC) regulations protecting market participants from fraud, manipulation, and abusive practices.'
    },
    {
      id: 'ftc',
      title: 'FTC Guidelines',
      icon: AlertTriangle,
      description: 'Following Federal Trade Commission (FTC) laws preventing unfair methods of competition and deceptive acts or practices in commerce.'
    },
    {
      id: 'updates',
      title: 'Quarterly Optimization & Review',
      icon: RefreshCw,
      description: 'Agreement to quarterly optimization protocols to remain in strict alignment and compliance with all US governing financial authorities and regulations.'
    }
  ];

  const content = (
    <div className={`w-full max-w-4xl mx-auto ${isBackend ? 'p-0' : 'p-6'}`}>
      <div className="flex items-center gap-4 mb-8">
        {onBack && (
          <button 
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
        )}
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase tracking-widest text-white flex items-center gap-3">
            <FileText className="text-blue-500" />
            Compliance & Risk Framework
          </h1>
          <p className="text-xs text-gray-400 font-mono uppercase tracking-widest mt-1">Regulatory Terms & Conditions</p>
        </div>
      </div>

      <div className="space-y-4 mb-8">
        <p className="text-sm text-gray-300 font-mono leading-relaxed border-l-2 border-blue-500 pl-4 py-1">
          By accessing Clear Path Markets Science terminal and networks, you acknowledge and agree to abide strictly by the following regulatory frameworks. This platform demands 100% compliance with jurisdictional laws.
        </p>
      </div>

      <div className="grid gap-4">
        {sections.map((section) => (
          <motion.div 
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              agreed[section.id] 
                ? 'bg-blue-500/10 border-blue-500/30' 
                : 'bg-black/40 border-white/10 hover:border-white/20'
            }`}
            onClick={() => toggleAgreement(section.id as keyof typeof agreed)}
          >
            <div className="flex items-start gap-4">
              <div className={`p-3 rounded-xl border ${
                agreed[section.id] ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-gray-400'
              }`}>
                <section.icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className={`text-sm font-black uppercase tracking-widest mb-1 ${
                  agreed[section.id] ? 'text-white' : 'text-gray-300'
                }`}>
                  {section.title}
                </h3>
                <p className="text-[10px] sm:text-xs text-gray-400 font-mono leading-relaxed">
                  {section.description}
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors ${
                agreed[section.id] 
                  ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.4)]' 
                  : 'border-white/20 text-transparent'
              }`}>
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 p-6 rounded-2xl bg-white/5 border border-white/10 text-center">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-2 flex items-center justify-center gap-2">
          {allAgreed ? <Shield className="text-green-500 w-5 h-5" /> : <AlertTriangle className="text-amber-500 w-5 h-5" />}
          Acknowledgment Status
        </h3>
        <p className="text-xs text-gray-400 font-mono mb-6 max-w-lg mx-auto">
          {allAgreed 
            ? "You have acknowledged all required regulatory frameworks. The system records this consent." 
            : "Please review and acknowledge each regulatory section above to ensure compliance."
          }
        </p>
        <button 
          disabled={!allAgreed}
          onClick={() => { if(allAgreed && onBack) onBack() }}
          className={`w-full max-w-xs mx-auto py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
            allAgreed 
              ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.3)]' 
              : 'bg-white/5 text-gray-500 cursor-not-allowed'
          }`}
        >
          {allAgreed ? (isBackend ? 'Update Compliance Status' : 'Return to Login') : 'Awaiting Consent'}
        </button>
      </div>
    </div>
  );

  if (isBackend) {
    return content;
  }

  return (
    <div className="min-h-screen relative flex flex-col items-center justify-center py-12 px-4 z-50">
      <SurfBackground />
      <div className="fixed inset-0 bg-black/60 backdrop-blur-md -z-10" />
      {content}
    </div>
  );
}
