import React, { useState } from 'react';
import { InterfaceProfile } from '../types';
import { Shield, CheckCircle2, Building2, User, Building, ArrowLeft } from 'lucide-react';
import { BackToDashboard } from './nav/BackToDashboard';

interface GetVerifiedProps {
  onBack: () => void;
  profile?: InterfaceProfile;
}

export default function GetVerified({ onBack, profile }: GetVerifiedProps) {
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  
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

  return (
    <div className="w-full h-full min-h-screen bg-[#050505] text-white p-6 md:p-12 overflow-y-auto">
      <div className="max-w-5xl mx-auto space-y-12">
        
        {/* Header */}
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

        {/* Tiers Grid */}
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

              {/* Background gradient glow based on selection */}
              {selectedTier === tier.id && (
                <div className={`absolute inset-0 ${tier.bgColor} opacity-5 blur-3xl`} />
              )}
            </div>
          ))}
        </div>

        {/* Action Bottom */}
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-sm text-gray-400 font-mono tracking-widest uppercase">
            {selectedTier 
              ? `Proceeding with ${tiers.find(t => t.id === selectedTier)?.name} Verification` 
              : 'Select a verification tier to continue'}
          </div>
          <button 
            disabled={!selectedTier}
            className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-sm transition-all ${
              selectedTier 
                ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                : 'bg-white/10 text-gray-500 cursor-not-allowed'
            }`}
          >
            Acknowledge & Setup Payment
          </button>
        </div>
        
        <p className="text-center text-[10px] text-gray-600 uppercase tracking-widest font-mono">
          * Note: Payment gateway integration will be fully active within 90 days. Pre-register your identity now.
        </p>

      </div>
    </div>
  );
}
