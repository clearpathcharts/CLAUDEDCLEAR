import React, { useState } from 'react';
import { InterfaceProfile } from '../types';
import { Shield, CheckCircle2, Building2, User, Building, Mail, Copy, Check } from 'lucide-react';
import { BackToDashboard } from './nav/BackToDashboard';
import { useAuth } from '../contexts/FirebaseContext';
import { submitIdentityPreregistration } from '../api/registrations';

interface GetVerifiedProps {
  onBack: () => void;
  profile?: InterfaceProfile;
}

export default function GetVerified({ onBack, profile }: GetVerifiedProps) {
  const { user, userProfile } = useAuth();
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [email, setEmail] = useState(user?.email || '');
  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [activationKey, setActivationKey] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const tiers = [
    {
      id: 'blue',
      name: 'Retail Trader',
      icon: User,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
      badge: 'Blue Check',
      price: '$8',
      period: 'per month',
      description: 'Ideal for independent market researchers accessing market visualization tools.',
      features: [
        'Blue Verification Badge',
        'Standard Market API Visualization',
        'Retail Analysis Templates',
        'Community Feed Priority'
      ]
    },
    {
      id: 'green',
      name: 'Professional Analyst',
      icon: Building2,
      color: 'text-green-500',
      bgColor: 'bg-green-500',
      badge: 'Green Check',
      price: '$5',
      period: 'per month',
      popular: true,
      description: 'Optimized pricing for professional analysis accounts with specific layout requirements.',
      features: [
        'Green Verification Badge',
        'Professional Layout APIs',
        'Advanced Risk Modeling Views',
        'Dedicated Support Channel'
      ]
    },
    {
      id: 'gold',
      name: 'Market Desk',
      icon: Building,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500',
      badge: 'Gold Check',
      price: '$10',
      period: 'per month',
      description: 'Full seat-level verification for research desks and data analysis firms.',
      features: [
        'Gold Verification Badge',
        'Whitelabel Terminal Access',
        'Unlimited API Seats',
        'Legal Identity Verification'
      ]
    }
  ];

  const handlePreregister = async () => {
    if (!selectedTier) return;
    setSubmitError('');
    setIsSubmitting(true);

    try {
      const result = await submitIdentityPreregistration({
        emailAddress: email,
        tierId: selectedTier,
        displayName: displayName || undefined,
        uid: user?.uid,
      });
      setActivationKey(result.activationKey);
      setEmailSent(result.emailSent);
    } catch (err: any) {
      setSubmitError(err.message || 'Pre-registration failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyKey = async () => {
    if (!activationKey) return;
    try {
      await navigator.clipboard.writeText(activationKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  if (activationKey) {
    return (
      <div className="scrollbar-panel w-full h-full min-h-screen bg-[#050505] text-white p-6 md:p-12 overflow-y-auto">
        <div className="max-w-2xl mx-auto space-y-8 text-center">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto border border-indigo-500/30">
            <CheckCircle2 className="text-indigo-400" size={40} />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-black uppercase tracking-tight">Identity Pre-Registered</h1>
            <p className="text-sm text-gray-400">
              Your {tiers.find(t => t.id === selectedTier)?.name} tier is reserved.
              {emailSent
                ? ' A confirmation email with your reference key has been sent.'
                : ' Save your reference key below — email delivery is not configured on this server.'}
            </p>
          </div>
          <div className="bg-white/5 border border-indigo-500/30 rounded-2xl p-6 space-y-3">
            <div className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Pre-Registration Reference</div>
            <div className="flex items-center justify-center gap-3">
              <code className="text-2xl font-black text-[#00FFFF] font-mono tracking-wider">{activationKey}</code>
              <button onClick={copyKey} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors" title="Copy key">
                {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} className="text-gray-400" />}
              </button>
            </div>
          </div>
          <button
            onClick={onBack}
            className="px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm bg-indigo-600 hover:bg-indigo-500 transition-all"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="scrollbar-panel w-full h-full min-h-screen bg-[#050505] text-white p-6 md:p-12 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-12">
        
        <div className="flex items-center space-x-6 border-b border-white/10 pb-6">
          <BackToDashboard onBack={onBack} color="#fff" />
          <div>
            <h1 className="text-4xl font-black italic tracking-tighter uppercase flex items-center gap-3">
              <Shield className="text-indigo-500" size={36} />
              Identity <span className="text-indigo-500">Verification</span>
            </h1>
            <p className="text-sm font-mono text-gray-500 tracking-widest uppercase mt-2">
              Select your structural identity for network integration
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div 
              key={tier.id}
              onClick={() => setSelectedTier(tier.id)}
              className={`relative rounded-3xl p-8 border-2 transition-all cursor-pointer backdrop-blur-md overflow-hidden ${
                selectedTier === tier.id 
                  ? `border-[${tier.color.replace('text-', '')}] bg-white/5 scale-105 shadow-2xl` 
                  : 'border-white/5 bg-black/40 hover:bg-white/5 hover:border-white/20'
              }`}
            >
              {tier.popular && (
                <div className="absolute top-0 right-0 bg-green-500 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-xl">
                  Optimized
                </div>
              )}
              
              <div className="space-y-6 relative z-10">
                <div className="flex items-center justify-between">
                  <tier.icon size={32} className={tier.color} />
                  <CheckCircle2 size={28} className={tier.color} />
                </div>
                
                <div>
                  <div className={`text-[10px] font-black uppercase tracking-widest ${tier.color} mb-1`}>
                    {tier.badge}
                  </div>
                  <h3 className="text-2xl font-black uppercase tracking-tight">{tier.name}</h3>
                  <div className="mt-4 flex items-baseline gap-2">
                    <span className="text-4xl font-black">{tier.price}</span>
                    <span className="text-xs font-mono text-gray-500 uppercase">{tier.period}</span>
                  </div>
                </div>

                <p className="text-sm text-gray-400 font-medium">
                  {tier.description}
                </p>

                <div className="border-t border-white/10 pt-6 space-y-4">
                  {tier.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <CheckCircle2 size={16} className={`${tier.color} mt-0.5 shrink-0`} />
                      <span className="text-sm text-white font-medium">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTier === tier.id && (
                <div className={`absolute inset-0 ${tier.bgColor} opacity-5 blur-3xl`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-black/60 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Display Name (optional)</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your public name"
                className="w-full bg-black/60 border border-white/10 rounded-xl py-3 px-4 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono"
              />
            </div>
          </div>

          {submitError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-4 rounded-xl font-mono text-center uppercase">
              {submitError}
            </div>
          )}

          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-sm text-gray-400 font-mono tracking-widest uppercase">
              {selectedTier 
                ? `Proceeding with ${tiers.find(t => t.id === selectedTier)?.name} Verification` 
                : 'Select a verification tier to continue'}
            </div>
            <button 
              disabled={!selectedTier || !email.trim() || isSubmitting}
              onClick={handlePreregister}
              className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${
                selectedTier && email.trim() && !isSubmitting
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                  : 'bg-white/10 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? 'Securing Pre-Registration...' : 'Acknowledge & Pre-Register'}
            </button>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest font-mono">
          * Note: Payment gateway integration will be fully active within 90 days. Pre-register your identity now to lock in your tier.
        </p>

      </div>
    </div>
  );
}
