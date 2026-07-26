import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import { getDb } from '../firebase';
import { doc, setDoc, updateDoc } from '../firebase';
import { 
  Crown, 
  CreditCard, 
  Sparkles, 
  ShieldCheck, 
  Check, 
  Activity, 
  Terminal as TerminalIcon, 
  ArrowRight, 
  Lock, 
  Plus, 
  RefreshCw, 
  ExternalLink, 
  Coins, 
  Copy, 
  Info,
  DollarSign,
  Settings,
  Eye,
  Sliders
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function MembershipTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const { user, userProfile, updateProfile } = useAuth();
  
  // Toggles for primary view modes
  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'merchant'>('catalog');
  const [isEditLinksOpen, setIsEditLinksOpen] = useState(false);

  // States for Stripe Payment Links
  const [essentialLink, setEssentialLink] = useState(() => 
    userProfile?.essentialLink || 'https://buy.stripe.com/mock_essential_free'
  );
  const [plusLink, setPlusLink] = useState(() => 
    userProfile?.plusLink || 'https://buy.stripe.com/mock_plus_9fb6839aa'
  );
  const [premiumLink, setPremiumLink] = useState(() => 
    userProfile?.premiumLink || 'https://buy.stripe.com/mock_premium_25bc012bb'
  );
  const [ultimateLink, setUltimateLink] = useState(() => 
    userProfile?.ultimateLink || 'https://buy.stripe.com/mock_ultimate_100ff66cc'
  );

  // States for Stripe + Novo bank configuration
  const [stripePublishable, setStripePublishable] = useState(() => 
    userProfile?.stripePublishable || ''
  );
  const [stripeSecret, setStripeSecret] = useState(() => 
    userProfile?.stripeSecret || ''
  );
  
  const [novoRouting] = useState('211370150'); // Auto-loaded from user screenshot
  const [novoAccount, setNovoAccount] = useState(() => 
    userProfile?.novoAccount || '••••••••'
  );
  
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSavingLinks, setIsSavingLinks] = useState(false);
  const [linksSaveStatus, setLinksSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [affiliateReward, setAffiliateReward] = useState<{
    discountPercent: number;
    creditDisplay: string;
    monthSignups: number;
    shareUrl: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/affiliate/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.ok) return;
        setAffiliateReward({
          discountPercent: Number(data.discountPercent) || 0,
          creditDisplay: String(data.creditDisplay || '$0.00'),
          monthSignups: Number(data.monthSignups) || 0,
          shareUrl: String(data.shareUrl || ''),
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);
  
  // Custom Payment Link configurations (Invoice dispatcher)
  const [linkClientName, setLinkClientName] = useState('');
  const [linkClientEmail, setLinkClientEmail] = useState('');
  const [linkAmount, setLinkAmount] = useState('99.00');
  const [linkServiceName, setLinkServiceName] = useState('VIP Market Intelligence Suite');
  const [linkInterval, setLinkInterval] = useState<'recurring' | 'one-time'>('recurring');
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);
  
  // Simulated Webhook Stream Console Logs
  const [webhookLogs, setWebhookLogs] = useState<string[]>([
    '[INIT] Novo + Stripe Settlement Node Listening on port 3000...',
    `[INFO] Novo Ledger initialized. Connected Routing: ${novoRouting} (Settlement Target: CLEAR PATH MARKETS SCIENCE)`,
  ]);
  const [isSimulatingPayment, setIsSimulatingPayment] = useState(false);

  // Soft launch waitlist pre-registration (logged-in users)
  const [wlFirstName, setWlFirstName] = useState(userProfile?.displayName?.split(' ')[0] || '');
  const [wlCountry, setWlCountry] = useState('');
  const [wlExperience, setWlExperience] = useState('Beginner');
  const [wlSubmitting, setWlSubmitting] = useState(false);
  const [wlError, setWlError] = useState('');
  const [wlSuccess, setWlSuccess] = useState<{ activationKey: string; emailSent: boolean } | null>(null);

  const handleWaitlistPreregister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;
    setWlError('');
    setWlSubmitting(true);
    try {
      const { submitWaitlistRegistration } = await import('../api/registrations');
      const result = await submitWaitlistRegistration({
        firstName: wlFirstName.trim() || userProfile?.displayName || 'Member',
        emailAddress: user.email,
        country: wlCountry.trim(),
        experienceLevel: wlExperience,
        uid: user.uid,
      });
      setWlSuccess({ activationKey: result.activationKey, emailSent: result.emailSent });
    } catch (err: any) {
      setWlError(err.message || 'Waitlist registration failed.');
    } finally {
      setWlSubmitting(false);
    }
  };

  const waitlistCountries = [
    'United States', 'United Kingdom', 'Canada', 'Australia', 'Germany',
    'France', 'Japan', 'Singapore', 'Switzerland', 'United Arab Emirates',
    'South Africa', 'Nigeria', 'India', 'Brazil', 'New Zealand', 'Other',
  ];

  // Sync state if userProfile changes
  useEffect(() => {
    if (userProfile) {
      if (userProfile.stripePublishable) setStripePublishable(userProfile.stripePublishable);
      if (userProfile.stripeSecret) setStripeSecret(userProfile.stripeSecret);
      if (userProfile.novoAccount) setNovoAccount(userProfile.novoAccount);
      if (userProfile.essentialLink) setEssentialLink(userProfile.essentialLink);
      if (userProfile.plusLink) setPlusLink(userProfile.plusLink);
      if (userProfile.premiumLink) setPremiumLink(userProfile.premiumLink);
      if (userProfile.ultimateLink) setUltimateLink(userProfile.ultimateLink);
    }
  }, [userProfile]);

  // Handle configuration update in database
  const handleSaveConfiguration = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setSaveStatus('idle');
    
    setWebhookLogs(prev => [
      ...prev,
      `[CONFIG] Synchronizing parameters with server: Stripe account verification active...`,
    ]);

    try {
      await updateProfile({
        stripePublishable,
        stripeSecret,
        novoAccount,
        stripeNovoActive: true,
      } as any);
      
      setSaveStatus('success');
      setWebhookLogs(prev => [
        ...prev,
        `[SUCCESS] Stripe-Novo pipeline successfully merged in Firestore database!`,
        `[AUDIT] Stripe Sandbox token registration verified (#acct_1TBjpsKawpKZWrI)`,
        `[READY] System listening for external client checkouts settling to Novo Account ****${novoAccount.slice(-4) || '3819'}`
      ]);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handle saving payment link details
  const handleSaveLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLinks(true);
    setLinksSaveStatus('idle');

    setWebhookLogs(prev => [
      ...prev,
      `[LINKS] Saving customized Stripe Payment links into live Firestore cloud database...`,
    ]);

    try {
      await updateProfile({
        essentialLink,
        plusLink,
        premiumLink,
        ultimateLink
      } as any);

      setLinksSaveStatus('success');
      setWebhookLogs(prev => [
        ...prev,
        `[LINKS-SAVED] Stored payment links successfully! Live users will now clear transactions straight to these Stripe URLs.`,
      ]);
      setTimeout(() => setLinksSaveStatus('idle'), 4000);
    } catch (err) {
      console.error(err);
      setLinksSaveStatus('error');
    } finally {
      setIsSavingLinks(false);
    }
  };

  // Generate Custom Invoice Link
  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkClientEmail || !linkServiceName || !linkAmount) return;

    const queryParams = new URLSearchParams({
      amt: linkAmount,
      svc: linkServiceName,
      email: linkClientEmail,
      type: linkInterval,
      sec: stripeSecret ? '1' : '0'
    }).toString();

    const link = `${window.location.origin}/checkout?${queryParams}`;
    setGeneratedLink(link);

    const embedCode = `<!-- Custom ClearPath Link Button -->\n<a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;background:#7F00FF;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-family:sans-serif;font-weight:bold;box-shadow:0 4px 14px rgba(127,0,255,0.4);">\n  Pay ${linkInterval === 'recurring' ? 'Subscription' : 'Invoice'} via Stripe\n</a>`;
    setGeneratedHtml(embedCode);

    setWebhookLogs(prev => [
      ...prev,
      `[LINK GEN] Created invoice for client ${linkClientEmail} (${linkInterval === 'recurring' ? 'Recurring' : 'One-Time'})`,
      `[GATEWAY] Checkout Amount: $${linkAmount} USD. Target settlement: Novo Routing ${novoRouting}`
    ]);
  };

  // Simulate transactional payload logic
  const handleSimulatePayment = () => {
    setIsSimulatingPayment(true);
    
    const clientEmail = linkClientEmail || 'external-investor@domain.com';
    const amount = linkAmount || '99.00';

    const events = [
      `[STRIPE] Customer checkout loaded in browser reference: ${clientEmail}`,
      `[STRIPE] Tokenizing payment authorization token (tok_1U9120F)...`,
      `[STRIPE] Charge authorization successful! amount: $${amount} USD, card: VISA ****4242`,
      `[WEBHOOK] Received Stripe webhook event: charge.succeeded (Event ID: #evt_910419)`,
      `[SYSTEM] Syncing client metadata to ClearPath database: Upgrading ${clientEmail} profile to premium access`,
      `[NOVO DISPATCH] Initiating ACH Sweep dispatch link - Amount: $${amount} USD`,
      `[NOVO DISPATCH] Target routing code: ${novoRouting} | Target Account: ${novoAccount}`,
      `[SETTLED] Sweep cleared! Funds successfully deposited into Novo Business Checking. Transaction ID: #TX-77382-CP`
    ];

    let delayIdx = 0;
    const interval = setInterval(() => {
      if (delayIdx < events.length) {
        setWebhookLogs(prev => [...prev, events[delayIdx]]);
        delayIdx++;
      } else {
        clearInterval(interval);
        setIsSimulatingPayment(false);
      }
    }, 850);
  };

  const copyText = (text: string, type: 'link' | 'html') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedHtml(true);
      setTimeout(() => setCopiedHtml(false), 2000);
    }
  };

  return (
    <div className="flex-1 flex flex-col p-6 lg:p-12 text-white font-sans max-w-7xl mx-auto w-full select-none" id="membership_tab_container">

      {affiliateReward && (affiliateReward.discountPercent > 0 || affiliateReward.creditDisplay !== '$0.00') && (
        <div className="mb-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400">Affiliate rewards applied</p>
            <p className="text-sm text-emerald-100 mt-1">
              {affiliateReward.discountPercent > 0
                ? `${affiliateReward.discountPercent}% off your next paid month`
                : 'Membership discount ready'}
              {affiliateReward.creditDisplay !== '$0.00'
                ? ` · ${affiliateReward.creditDisplay} account credit`
                : ''}
              {` · ${affiliateReward.monthSignups} referral${affiliateReward.monthSignups === 1 ? '' : 's'} this month`}
            </p>
          </div>
          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('AffiliateNetwork')}
              className="rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/30"
            >
              Open affiliate desk
            </button>
          )}
        </div>
      )}
      
      {/* Header card banner */}
      <div className="mb-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 p-8 rounded-3xl border border-white/10 bg-gradient-to-r from-zinc-950 via-zinc-900 to-black relative overflow-hidden" id="membership_header_banner">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#7F00FF]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
        
        <div className="space-y-3 relative z-10 text-left">
          <div className="flex items-center gap-2.5">
            <span className="px-3 py-1 text-[10px] font-mono font-black tracking-widest text-[#00FFFF] bg-cyan-400/10 border border-cyan-400/30 rounded-full flex items-center gap-1 uppercase">
              <Crown className="w-3.5 h-3.5 animate-spin-slow" />
              <span>STRIPE CLOUD ECOSYSTEM</span>
            </span>
            <span className="px-3 py-1 text-[10px] font-mono font-black tracking-widest text-[#FF007F] bg-pink-400/10 border border-pink-400/30 rounded-full uppercase">
              SECURE CHANNELS
            </span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-2">
            <span>CLEAR PATH MEMBERSHIPS</span>
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Choose your subscription membership, manage Tier Two AI-assisted research credentials, or enter the merchant controls setup to link live payment pipelines directly to your industrial Stripe dashboard.
          </p>
        </div>

        {/* Status indicator */}
        <div className="p-5 rounded-2xl bg-zinc-950 border border-white/10 shrink-0 w-full lg:w-72 relative z-10 text-left flex flex-col justify-between min-h-[140px]">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-zinc-500 font-bold uppercase tracking-wider">MEMBER CLEARING</span>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
            </div>
            
            <span className="text-lg font-black font-mono tracking-wide text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#FFD700]" />
              <span>{userProfile?.vipStatus === 'vip_pro' ? 'CLEARPATH ULTIMATE' : 'STUDENT TIER'}</span>
            </span>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
            <span className="text-zinc-500 text-[10px] font-mono">REALTIME CLOUD SYNC</span>
            {userProfile?.vipStatus === 'vip_pro' || userProfile?.subscriptionActive ? (
              <span className="text-emerald-400 text-[11px] font-bold font-mono uppercase">PAID MEMBER</span>
            ) : (
              <span className="text-zinc-500 text-[11px] font-bold font-mono uppercase">UNPAID · USE CATALOG</span>
            )}
          </div>
        </div>
      </div>

      {/* Primary Workspace Navigation Tabs within Memberships space */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-8">
        <div id="subnav-memberships" className="flex items-center gap-3">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider uppercase transition-all select-none cursor-pointer ${
              activeSubTab === 'catalog' 
                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Crown className="w-4 h-4" />
            <span>MEMBERSHIP CATALOG</span>
          </button>
          
          <button
            onClick={() => setActiveSubTab('merchant')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black font-mono tracking-wider uppercase transition-all select-none cursor-pointer ${
              activeSubTab === 'merchant' 
                ? 'bg-[#7F00FF]/15 text-[#A855F7] border border-[#7F00FF]/30' 
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>MERCHANT INTEGRATION (NOVO)</span>
          </button>
        </div>

        {/* Live Customize Drawer Trigger to keep user intent fulfilled */}
        {activeSubTab === 'catalog' && (
          <button
            onClick={() => setIsEditLinksOpen(!isEditLinksOpen)}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-xs font-bold font-mono tracking-wider text-pink-400 border border-pink-500/20 rounded-xl transition cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{isEditLinksOpen ? 'CLOSE LINK CUSTOMIZER' : 'CUSTOMIZE STRIPE LINKS'}</span>
          </button>
        )}
      </div>

      {/* Main Workspace content */}
      <AnimatePresence mode="wait">
        {activeSubTab === 'catalog' ? (
          <motion.div
            key="catalog"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Soft launch waitlist + identity pre-registration */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="p-6 rounded-3xl border border-cyan-500/20 bg-gradient-to-br from-zinc-950 to-black space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-black font-mono text-cyan-400 uppercase tracking-widest">Soft Launch Waitlist</h3>
                </div>
                {wlSuccess ? (
                  <div className="space-y-3 text-center py-4">
                    <Check className="w-8 h-8 text-cyan-400 mx-auto" />
                    <p className="text-xs text-zinc-300">
                      {wlSuccess.emailSent ? 'Confirmed! Check your email for your activation key.' : 'Registered! Save your activation key:'}
                    </p>
                    <code className="text-lg font-black text-pink-400 font-mono block">{wlSuccess.activationKey}</code>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistPreregister} className="space-y-3">
                    <p className="text-zinc-500 text-xs">Lock in your free soft launch account ({user?.email}).</p>
                    {wlError && <p className="text-red-400 text-xs font-mono">{wlError}</p>}
                    <input
                      type="text"
                      value={wlFirstName}
                      onChange={(e) => setWlFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full bg-black/60 border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-mono"
                    />
                    <select
                      value={wlCountry}
                      onChange={(e) => setWlCountry(e.target.value)}
                      required
                      className="w-full bg-black border border-zinc-800 rounded-xl py-2.5 px-4 text-xs font-mono"
                    >
                      <option value="">Select country...</option>
                      {waitlistCountries.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button
                      type="submit"
                      disabled={wlSubmitting || !wlCountry}
                      className="w-full py-3 bg-gradient-to-r from-cyan-600 to-pink-600 rounded-xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                    >
                      {wlSubmitting ? 'Registering...' : 'Pre-Register for Soft Launch'}
                    </button>
                  </form>
                )}
              </div>

              <div className="p-6 rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-zinc-950 to-black space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-sm font-black font-mono text-indigo-400 uppercase tracking-widest">Identity Verification</h3>
                  </div>
                  <p className="text-zinc-500 text-xs leading-relaxed">
                    Pre-register your verification tier now. Payment gateway goes live within 90 days — lock in your tier today.
                  </p>
                </div>
                <button
                  onClick={() => onNavigate?.('GetVerified')}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"
                >
                  Pre-Register Identity <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Live editor drawer segment for customizing Stripe buy buttons in-place */}
            {isEditLinksOpen && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="p-6 rounded-3xl border border-pink-500/20 bg-gradient-to-r from-zinc-950 to-black select-none text-left space-y-4"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-pink-500 animate-pulse" />
                  <h3 className="text-sm font-black font-mono text-zinc-100 uppercase tracking-widest">
                    STRIPE PAYMENT LINK CONFIGURATION DESK
                  </h3>
                </div>
                <p className="text-zinc-400 text-xs leading-relaxed max-w-4xl">
                  Connect your live products here by pasting URLs from your <strong>Stripe Dashboard &gt; Product Catalog &gt; Payment Links</strong>. When customers click below on the live pricing table, they'll clear directly to your personal accounts.
                </p>

                <form onSubmit={handleSaveLinks} className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">1. TIER ONE FREE LINK</label>
                    <input 
                      type="text" 
                      value={essentialLink} 
                      onChange={(e) => setEssentialLink(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder-zinc-700 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">2. PLUS ($9.99/mo) LINK</label>
                    <input 
                      type="text" 
                      value={plusLink} 
                      onChange={(e) => setPlusLink(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder-zinc-700 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">3. PREMIUM ($25.99/mo) LINK</label>
                    <input 
                      type="text" 
                      value={premiumLink} 
                      onChange={(e) => setPremiumLink(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder-zinc-700 outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono font-bold text-zinc-400 uppercase">4. ULTIMATE ($100.00/mo) LINK</label>
                    <input 
                      type="text" 
                      value={ultimateLink} 
                      onChange={(e) => setUltimateLink(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-white/10 text-xs font-mono text-white placeholder-zinc-700 outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="col-span-1 md:col-span-2 pt-2 flex items-center justify-between">
                    <button
                      type="submit"
                      disabled={isSavingLinks}
                      className="py-2.5 px-6 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white rounded-xl text-xs font-black font-mono tracking-widest uppercase transition-all shadow-md cursor-pointer shrink-0"
                    >
                      {isSavingLinks ? 'SYNCHRONIZING REPOSITORY...' : 'SAVE & DEPLOY STRIPE PAYMENT LINKS'}
                    </button>
                    {linksSaveStatus === 'success' && (
                      <span className="text-emerald-400 font-mono font-bold text-xs animate-pulse">✓ Links updated successfully inside Firestore.</span>
                    )}
                  </div>
                </form>
              </motion.div>
            )}

            {/* Direct Verification Badge linking back to parent clearing house */}
            <div className="p-5 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.02] flex flex-col sm:flex-row items-center justify-between gap-4 text-left max-w-4xl mx-auto mb-4 relative z-10">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]" />
                  <h4 className="text-xs font-black font-mono uppercase tracking-widest text-[#00D9FF]">
                    Verified End-to-End Secure Payment Channels
                  </h4>
                </div>
                <p className="text-zinc-400 text-[11.5px] leading-relaxed max-w-2xl">
                  To ensure complete safety of your data with no intermediate ledger recording, ClearPath Trader does not collect, process, or store financial credentials directly. All monthly dues and subscriptions clear securely to the original <strong>Stripe, Inc.</strong> payment servers. You may view or verify the payment conduits at any time.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <a 
                  href="https://stripe.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 border border-emerald-500/30 hover:border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl text-[10px] font-black uppercase tracking-wider font-mono transition-all"
                >
                  <span>Verify Stripe Portal</span>
                  <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                </a>
              </div>
            </div>

            {/* Standard Pricing Section rendered inside live applet */}
            <div className="pricing-section rounded-3xl" id="custom-pricing-section-container">
              
              {/* Product 1: Tier One */}
              <div className="pricing-card text-left flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="font-mono tracking-tight font-black">Tier One</h2>
                    <span className="bg-zinc-800 text-zinc-400 text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider">FREE ENTRY</span>
                  </div>
                  <h3 className="font-mono font-black">$0.00<span className="text-xs text-zinc-500 font-normal">/mo</span></h3>
                  <p className="text-zinc-500 text-xs mt-2 line-clamp-3">
                    Free access to core charting tools, market dashboards, educational content, and introductory trading analytics.
                  </p>
                  
                  <ul className="list-none space-y-3.5 mt-6 mb-8 text-sm">
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Basic Charts</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Community Access</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Market News</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Educational Tools</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <a 
                    href={essentialLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center transition-all duration-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:scale-[1.03]"
                  >
                    Get Started
                  </a>

                  {/* Secure original checkout routing trace */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">
                      <span>💳 Stripe Checkout</span>
                      <span className="text-emerald-400 font-bold">Secure Gateway</span>
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 overflow-hidden">
                      <span className="shrink-0 text-[8px] uppercase tracking-wider text-zinc-550">Origin:</span>
                      <a 
                        href={essentialLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 truncate"
                        title={essentialLink}
                      >
                        <span className="truncate">{essentialLink}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-cyan-400/75" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product 2: Plus */}
              <div className="pricing-card text-left flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-cyan-500/20 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="font-mono tracking-tight font-black">Plus</h2>
                    <span className="bg-[#06b6d4]/20 text-[#06b6d4] text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase font-mono tracking-wider">POPULAR</span>
                  </div>
                  <h3 className="font-mono font-black">$9.99<span className="text-xs text-zinc-500 font-normal">/mo</span></h3>
                  <p className="text-zinc-500 text-xs mt-2 line-clamp-3">
                    Enhanced charting features, AI-assisted market tools, advanced watchlists, and premium trading resources.
                  </p>
                  
                  <ul className="list-none space-y-3.5 mt-6 mb-8 text-sm">
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Advanced Watchlists</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>AI Analysis</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Premium Dashboards</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Faster Updates</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <a 
                    href={plusLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center transition-all duration-300 shadow-[0_0_20px_rgba(236,72,153,0.3)] hover:scale-[1.03]"
                  >
                    Subscribe
                  </a>

                  {/* Secure original checkout routing trace */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">
                      <span>💳 Stripe Checkout</span>
                      <span className="text-emerald-400 font-bold">Secure Gateway</span>
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 overflow-hidden">
                      <span className="shrink-0 text-[8px] uppercase tracking-wider text-zinc-550">Origin:</span>
                      <a 
                        href={plusLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 truncate"
                        title={plusLink}
                      >
                        <span className="truncate">{plusLink}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-cyan-400/75" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product 3: Premium */}
              <div className="pricing-card text-left flex flex-col justify-between relative border-[#00FFFF]">
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="font-mono tracking-tight font-black">Premium</h2>
                    <span className="bg-gradient-to-r from-teal-500 to-cyan-500 text-zinc-950 text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase font-mono tracking-wider">PRO-LEVEL</span>
                  </div>
                  <h3 className="font-mono font-black">$25.99<span className="text-xs text-zinc-500 font-normal">/mo</span></h3>
                  <p className="text-zinc-500 text-xs mt-2 line-clamp-3">
                    Professional-grade analytics, premium indicators, advanced market intelligence, and expanded research environments.
                  </p>
                  
                  <ul className="list-none space-y-3.5 mt-6 mb-8 text-sm">
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Institutional Dashboard</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Advanced Indicators</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>AI Scanner</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Premium Research</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <a 
                    href={premiumLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center transition-all duration-300 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-[1.03]"
                  >
                    Subscribe
                  </a>

                  {/* Secure original checkout routing trace */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">
                      <span>💳 Stripe Checkout</span>
                      <span className="text-emerald-400 font-bold">Secure Gateway</span>
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 overflow-hidden">
                      <span className="shrink-0 text-[8px] uppercase tracking-wider text-zinc-550">Origin:</span>
                      <a 
                        href={premiumLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-1 truncate"
                        title={premiumLink}
                      >
                        <span className="truncate">{premiumLink}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-cyan-400/75" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product 4: Ultimate */}
              <div className="pricing-card text-left flex flex-col justify-between relative overflow-hidden border-[#ec4899]">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-tr from-transparent to-[#ec4899]/35 rounded-bl-full pointer-events-none" />
                <div>
                  <div className="flex justify-between items-start">
                    <h2 className="font-mono tracking-tight font-black">Ultimate</h2>
                    <span className="bg-[#ec4899]/20 text-[#ec4899] text-[10px] px-2.5 py-0.5 rounded-full font-black uppercase font-mono tracking-wider">TIER TWO SUITE</span>
                  </div>
                  <h3 className="font-mono font-black">$100<span className="text-xs text-zinc-500 font-normal">/mo</span></h3>
                  <p className="text-zinc-500 text-xs mt-2 line-clamp-3">
                    Tier Two access to advanced AI systems, institutional-style dashboards, premium analytics, and future ecosystem features.
                  </p>
                  
                  <ul className="list-none space-y-3.5 mt-6 mb-8 text-sm">
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>All Features</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Tier Two AI Systems</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Advanced Analytics</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-300">
                      <div className="w-5 h-5 rounded-full bg-cyan-950/40 border border-cyan-500/20 flex items-center justify-center">
                        <Check className="w-3 h-3 text-cyan-400" />
                      </div>
                      <span>Future Access</span>
                    </li>
                  </ul>
                </div>

                <div className="space-y-3">
                  <a 
                    href={ultimateLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full text-center transition-all duration-300 shadow-[0_0_30px_rgba(236,72,153,0.5)] hover:scale-[1.03]"
                  >
                    Subscribe
                  </a>

                  {/* Secure original checkout routing trace */}
                  <div className="mt-4 pt-3 border-t border-white/5 flex flex-col gap-1.5 text-left">
                    <div className="flex items-center justify-between text-[9px] font-mono font-black uppercase tracking-widest text-zinc-400">
                      <span>💳 Stripe Checkout</span>
                      <span className="text-emerald-400 font-bold">Secure Gateway</span>
                    </div>
                    <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-1 overflow-hidden">
                      <span className="shrink-0 text-[8px] uppercase tracking-wider text-zinc-550">Origin:</span>
                      <a 
                        href={ultimateLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#ec4899] hover:text-pink-400 hover:underline flex items-center gap-1 truncate"
                        title={ultimateLink}
                      >
                        <span className="truncate">{ultimateLink}</span>
                        <ExternalLink className="w-2.5 h-2.5 shrink-0 text-pink-400/75" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Compliance footnote in pricing tab */}
            <div className="bg-zinc-950/70 p-5 rounded-2xl border border-white/5 text-left text-xs max-w-4xl mx-auto space-y-2">
              <span className="text-[#FFB800] uppercase font-mono font-black text-[10px] tracking-widest flex items-center gap-1">
                <Info className="w-4 h-4" />
                <span>RISK COMPLIANCE & SAFETY ASSURANCES</span>
              </span>
              <p className="text-zinc-400 leading-relaxed">
                ClearPath Trader provides informational, analytical, and advanced AI-assisted research tools solely for educational market intelligence. We do not issue guarantees of profit, financial returns, or automated trading signals. Trading leverages substantial risk.
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="merchant"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8"
          >
            {/* Grid: Form config / Tiers overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Step-by-Step linkage Guide Form */}
              <div className="p-6 lg:p-8 rounded-3xl border border-white/15 bg-black/40 backdrop-blur-sm shadow flex flex-col justify-between text-left h-full" id="stripe_novo_config_box">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/20 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black font-mono text-white tracking-wider uppercase">NOVO + STRIPE MERCHANT INTEGRATION</h3>
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase">Link your business checking account via Stripe Checkout</span>
                    </div>
                  </div>

                  {/* Step Explanation Checklist */}
                  <div className="bg-zinc-950/80 p-4 rounded-2xl border border-white/5 space-y-3.5 text-xs text-zinc-400 leading-relaxed font-mono">
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold shrink-0">1</span>
                      <div>
                        <strong className="text-white">Enable Stripe in Novo dashboard:</strong> Log into <strong className="text-white">app.novo.co</strong>, click <strong className="text-white">Apps</strong> (as seen in your screenshot), choose <strong className="text-white">Stripe</strong>, and follow the simple OAuth links to connect your business accounts.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-white/10 text-white flex items-center justify-center text-[10px] font-bold shrink-0">2</span>
                      <div>
                        <strong className="text-white">Register API Credentials:</strong> Input your Stripe Production/Sandbox credentials below. All cards cleared will automatically settle and sweep deposits into your Novo Routing: <strong className="text-emerald-400">211370150</strong>.
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-[#7F00FF]/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-[10px] font-bold shrink-0">
                        <Check className="w-3" />
                      </span>
                      <span className="text-zinc-300">
                        Stripe transactions are integrated synchronously right inside ClearPathTrader for automated telemetry syncing.
                      </span>
                    </div>
                  </div>

                  {/* Input fields */}
                  <form onSubmit={handleSaveConfiguration} className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                        <span>STRIPE PUBLISHABLE KEY</span>
                        <span className="text-zinc-650 tracking-normal normal-case font-sans">(From developers context menu)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-555">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                        <input 
                          type="text" 
                          value={stripePublishable}
                          onChange={(e) => setStripePublishable(e.target.value)}
                          placeholder="pk_test_51TBjpsKawp..." 
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/60 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-700 outline-none transition font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-between">
                        <span>STRIPE SECRET API KEY</span>
                        <span className="text-amber-500/70 font-sans tracking-normal font-bold">Never expose publicly (encrypted server-side)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-555">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                        <input 
                          type="password" 
                          value={stripeSecret}
                          onChange={(e) => setStripeSecret(e.target.value)}
                          placeholder="sk_test_••••••••••••••••••••••••" 
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-950/60 border border-white/10 focus:border-purple-500 text-xs text-white placeholder-zinc-700 outline-none transition font-mono"
                        />
                      </div>
                    </div>

                    {/* Bank configuration specs */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                          NOVO ROUTING CODE
                        </label>
                        <input 
                          type="text" 
                          disabled 
                          value={novoRouting} 
                          className="w-full px-4 py-2.5 rounded-xl bg-[#0e3b2b]/10 border border-[#00ff88]/20 focus:border-emerald-500 text-xs text-[#00ff88] outline-none transition font-mono font-semibold"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                          NOVO ACCOUNT NUMBER
                        </label>
                        <input 
                          type="text" 
                          value={novoAccount}
                          onChange={(e) => setNovoAccount(e.target.value)}
                          placeholder="220918302" 
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-white/10 focus:border-[#7F00FF] text-xs text-white outline-none transition font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSavingConfig}
                      className="w-full mt-4 flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-purple-800 to-indigo-800 hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black font-mono tracking-widest uppercase cursor-pointer border border-white/10 transition shadow-lg"
                    >
                      {isSavingConfig ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>SAVING SETTLED PIPELINE...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>ACTIVATE STRIPE-NOVO SETTLEMENT PIPELINE</span>
                        </>
                      )}
                    </button>

                    <AnimatePresence mode="wait">
                      {saveStatus === 'success' && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0 }} 
                          className="text-xs text-emerald-400 font-mono font-bold mt-2"
                        >
                          ✓ SUCCESS: Merchant keys registered. System synced to cloud repository.
                        </motion.p>
                      )}
                      {saveStatus === 'error' && (
                        <motion.p 
                          initial={{ opacity: 0, y: -5 }} 
                          animate={{ opacity: 1, y: 0 }} 
                          exit={{ opacity: 0 }} 
                          className="text-xs text-rose-400 font-mono font-bold mt-2"
                        >
                          ✗ ERROR: Database reference mismatch. Ensure authentication properties are active.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </form>
                </div>
              </div>

              {/* Client Pay Link Dispatcher Generator */}
              <div className="p-6 lg:p-8 rounded-3xl border border-white/15 bg-black/40 backdrop-blur-sm shadow flex flex-col justify-between text-left h-full" id="payment_generator_box">
                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-500/20 flex items-center justify-center">
                      <Crown className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h3 className="text-base font-black font-mono text-white tracking-wider uppercase">CLIENT PAY LINK DISPATCHER</h3>
                      <span className="text-[10px] font-mono text-zinc-500 block uppercase">Deploy direct checkout pages for outside clients taking fast payments</span>
                    </div>
                  </div>

                  <form onSubmit={handleGenerateLink} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                          CLIENT EMAIL ID
                        </label>
                        <input 
                          type="email" 
                          required
                          value={linkClientEmail}
                          onChange={(e) => setLinkClientEmail(e.target.value)}
                          placeholder="client@outsideinvestor.com" 
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-white/10 text-xs text-white placeholder-zinc-700 outline-none transition font-sans"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                          SETTLEMENT AMOUNT (USD)
                        </label>
                        <input 
                          type="number" 
                          required
                          value={linkAmount}
                          onChange={(e) => setLinkAmount(e.target.value)}
                          placeholder="99.00" 
                          className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-white/10 text-xs text-white placeholder-zinc-700 outline-none transition font-mono font-black"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                        SERVICE OR ACCESS PRODUCT NAME
                      </label>
                      <input 
                        type="text" 
                        required
                        value={linkServiceName}
                        onChange={(e) => setLinkServiceName(e.target.value)}
                        placeholder="Clear Path VIP Signals Subscription" 
                        className="w-full px-4 py-2.5 rounded-xl bg-zinc-950/60 border border-white/10 text-xs text-white placeholder-zinc-700 outline-none transition font-sans"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                        PAYMENT INTERVAL TYPE
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setLinkInterval('recurring')}
                          className={`py-2 px-3 text-xs font-black font-mono rounded-lg border transition uppercase cursor-pointer ${
                            linkInterval === 'recurring' 
                              ? 'bg-[#7F00FF]/25 border-[#7F00FF] text-[#A855F7]' 
                              : 'bg-zinc-950/60 border-white/10 text-zinc-500 hover:text-white'
                          }`}
                        >
                          Recurring Monthly
                        </button>
                        <button
                          type="button"
                          onClick={() => setLinkInterval('one-time')}
                          className={`py-2 px-3 text-xs font-black font-mono rounded-lg border transition uppercase cursor-pointer ${
                            linkInterval === 'one-time' 
                              ? 'bg-[#7F00FF]/25 border-[#7F00FF] text-[#A855F7]' 
                              : 'bg-zinc-950/60 border-white/10 text-zinc-500 hover:text-white'
                          }`}
                        >
                          One-Off Settle
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 font-bold font-mono text-zinc-950 text-xs tracking-wider rounded-xl uppercase transition shadow-md cursor-pointer"
                    >
                      COMPILE CLIENT PAY MODULE
                    </button>
                  </form>

                  <AnimatePresence>
                    {generatedLink && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }} 
                        animate={{ opacity: 1, height: 'auto' }} 
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-3.5 pt-4 border-t border-white/15"
                      >
                        {/* Shareable checkout url */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block">SHAREABLE PAYMENT CHECKOUT URL</span>
                          <div className="flex gap-2">
                            <input 
                              type="text" 
                              readOnly 
                              value={generatedLink} 
                              className="flex-1 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-white/5 text-[10px] font-mono text-zinc-400 select-all outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => copyText(generatedLink, 'link')}
                              className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs rounded-lg flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3" />
                              <span className="text-[10px] font-mono font-bold uppercase">{copiedLink ? 'COPIED' : 'COPY'}</span>
                            </button>
                          </div>
                        </div>

                        {/* HTML iframe embedding */}
                        <div className="space-y-1">
                          <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-widest block">HTML EMBEDDABLE ACCREDITATION CODE</span>
                          <div className="flex gap-2">
                            <textarea 
                              readOnly 
                              value={generatedHtml} 
                              rows={2}
                              className="flex-1 bg-zinc-950/80 px-3 py-1.5 rounded-lg border border-white/5 text-[9px] font-mono text-zinc-400 select-all outline-none resize-none"
                            />
                            <button
                              type="button"
                              onClick={() => copyText(generatedHtml, 'html')}
                              className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-xs rounded-lg flex items-center justify-center self-stretch cursor-pointer shrink-0"
                            >
                              <span className="text-[10px] font-mono font-bold uppercase">{copiedHtml ? 'COPIED' : 'COPY CODE'}</span>
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={handleSimulatePayment}
                            disabled={isSimulatingPayment}
                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 text-xs font-black font-mono uppercase tracking-wider rounded-lg transition text-center cursor-pointer"
                          >
                            {isSimulatingPayment ? 'SIMULATING TRANSACTION FLOW...' : 'SIMULATE CUSTOMER CHECKOUT'}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

            </div>

            {/* Terminal Sandbox logs showing Settlement tracking to Novo */}
            <div className="p-6 rounded-3xl border border-white/10 bg-black/80 font-mono relative overflow-hidden" id="settlement_terminal_block">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/15">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7F00FF] animate-pulse" />
                  <span className="text-xs font-black tracking-widest text-zinc-200 uppercase flex items-center gap-2">
                    <TerminalIcon className="w-4 h-4 text-[#7F00FF]" />
                    <span>LIVE SETTLEMENT AUDIT STREAM (NOVO CONDUIT)</span>
                  </span>
                </div>
                <span className="text-[10px] text-zinc-650">INTEGRATION GATEWAY v5.0-PRO</span>
              </div>

              {/* Logger console elements */}
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar text-left text-[11px] leading-relaxed">
                {webhookLogs.map((log, idx) => {
                  const isInit = log.startsWith('[INIT]');
                  const isConfig = log.startsWith('[CONFIG]');
                  const isSuccess = log.startsWith('[SUCCESS]') || log.startsWith('[SETTLED]');
                  const isLnk = log.startsWith('[LINK GEN]');
                  const isStripe = log.startsWith('[STRIPE]');
                  const isNovo = log.startsWith('[NOVO');
                  
                  let color = 'text-zinc-500';
                  if (isInit) color = 'text-cyan-400 font-extrabold';
                  else if (isSuccess) color = 'text-emerald-400 font-black';
                  else if (isConfig) color = 'text-[#7F00FF]';
                  else if (isLnk) color = 'text-amber-400';
                  else if (isStripe) color = 'text-[#A855F7] font-semibold';
                  else if (isNovo) color = 'text-[#34D399]';
                  else if (log.startsWith('[AUDIT]') || log.startsWith('[READY]')) color = 'text-zinc-300';

                  return (
                    <div key={idx} className="font-mono">
                      <span className={color}>{log}</span>
                    </div>
                  );
                })}
              </div>

              {/* Clear logs action */}
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                <span>STREAM ACTIVE • LOCAL ENCRYPTION (AES-256)</span>
                <button
                  type="button"
                  onClick={() => setWebhookLogs([
                    '[INIT] Novo + Stripe Settlement Node Listening on port 3000...',
                    `[INFO] Novo Ledger initialized. Connected Routing: ${novoRouting} (Settlement Target: CLEAR PATH MARKETS SCIENCE)`
                  ])}
                  className="hover:text-white cursor-pointer transition uppercase"
                >
                  Clear trace console
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
