import React, { useState } from 'react';

export default function FutureInvestors() {
  const [form, setForm] = useState({ name: '', email: '', interest: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!form.name || !form.email) return;
    // Wire to Firestore when ready
    console.log('Expression of interest:', form);
    setSubmitted(true);
  };

  const stats = [
    { label: 'Markets Covered', value: '300+', color: '#00D9FF' },
    { label: 'Neuro Profiles', value: '15', color: '#a855f7' },
    { label: 'Membership Tiers', value: '4', color: '#FFD700' },
    { label: 'Price vs TradingView', value: '50%', color: '#00ff87' },
  ];

  const timeline = [
    { phase: 'NOW', label: 'Platform Launch', desc: 'Live platform, waitlist open, memberships activating', color: '#00ff87' },
    { phase: '30 DAYS', label: 'First Revenue', desc: 'Membership subscriptions begin generating monthly recurring revenue', color: '#00D9FF' },
    { phase: '90 DAYS', label: 'International Expansion', desc: 'Australia, UK, UAE, India outreach campaigns active', color: '#a855f7' },
    { phase: '6 MONTHS', label: 'Investor Partnerships Open', desc: 'Formal investor agreements available with revenue data as proof', color: '#FFD700' },
    { phase: '12 MONTHS', label: 'Platform OS Complete', desc: 'QubitScript, Backtester, Market Islands, full feature rollout', color: '#FF8800' },
  ];

  const model = [
    { label: 'Tier One — Free', price: '$0', tv: '$0', desc: 'Basic charts, community, news, educational tools' },
    { label: 'Plus', price: '$9.99/mo', tv: '$19.99/mo', desc: 'Advanced watchlists, AI analysis, premium dashboards' },
    { label: 'Premium', price: '$25/mo', tv: '$49.99/mo', desc: 'Institutional dashboard, AI indicators, research' },
    { label: 'Elite Suite', price: '$100/mo', tv: '$199.99/mo', desc: 'All features, Tier Two AI, advanced analytics' },
  ];

  return (
    <div style={{
      background: '#020205',
      color: '#e2e2ec',
      minHeight: '100vh',
      padding: '40px 24px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ maxWidth: '860px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <span style={{
            background: 'rgba(0,217,255,0.1)',
            color: '#00D9FF',
            border: '1px solid rgba(0,217,255,0.3)',
            padding: '4px 16px',
            borderRadius: '20px',
            fontSize: '11px',
            letterSpacing: '0.2em',
            fontWeight: 700,
            textTransform: 'uppercase' as const
          }}>
            Future Investment Opportunities
          </span>
          <h1 style={{
            fontSize: '36px',
            fontWeight: 900,
            color: '#fff',
            marginTop: '16px',
            lineHeight: 1.2
          }}>
            CLEARPATH MARKETS SCIENCE
          </h1>
          <p style={{ color: '#888', fontSize: '16px', marginTop: '12px', maxWidth: '600px', margin: '12px auto 0' }}>
            A perception-adaptive financial data platform built for the 2.5 billion neurodivergent people the industry ignores.
          </p>
          <div style={{
            marginTop: '16px',
            padding: '12px 20px',
            background: 'rgba(255,165,0,0.08)',
            border: '1px solid rgba(255,165,0,0.2)',
            borderRadius: '12px',
            fontSize: '12px',
            color: '#aaa',
            display: 'inline-block'
          }}>
            ⚠️ This page is for informational purposes only. No investment is being solicited at this time. Formal investor partnerships open at 6 months post-launch with verified revenue data.
          </div>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '48px'
        }}>
          {stats.map(s => (
            <div key={s.label} style={{
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: '16px',
              padding: '24px 16px',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: '11px', color: '#666', marginTop: '6px' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* The Mission */}
        <div style={{
          background: 'rgba(0,217,255,0.04)',
          border: '1px solid rgba(0,217,255,0.15)',
          borderRadius: '20px',
          padding: '32px',
          marginBottom: '48px'
        }}>
          <h2 style={{ color: '#00D9FF', fontWeight: 900, fontSize: '14px', letterSpacing: '0.2em', marginBottom: '16px' }}>
            THE MISSION
          </h2>
          <p style={{ color: '#ccc', lineHeight: 1.8, fontSize: '15px' }}>
            TradingView built a platform that serves institutions. ClearPath builds for humans. 
            90% of every subscription funds educational programs for neurodivergent youth and 
            at-risk communities. We never sell signals, never sell user data, never take broker kickbacks. 
            We profit from clarity — not from confusion.
          </p>
          <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {['No signals ever', 'No ads ever', 'No data selling', 'No broker kickbacks'].map(rule => (
              <div key={rule} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00ff87', fontSize: '13px' }}>
                <span>✓</span> {rule}
              </div>
            ))}
          </div>
        </div>

        {/* Revenue Model */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '14px', letterSpacing: '0.2em', marginBottom: '20px' }}>
            REVENUE MODEL — ALWAYS HALF OF TRADINGVIEW
          </h2>
          <div style={{ display: 'grid', gap: '12px' }}>
            {model.map(m => (
              <div key={m.label} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '14px',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{m.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>{m.desc}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: '#00ff87', fontWeight: 900, fontSize: '18px' }}>{m.price}</div>
                  <div style={{ color: '#444', fontSize: '11px', textDecoration: 'line-through' }}>TV: {m.tv}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: '48px' }}>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '14px', letterSpacing: '0.2em', marginBottom: '24px' }}>
            ROADMAP TO INVESTOR PARTNERSHIPS
          </h2>
          <div style={{ display: 'grid', gap: '16px' }}>
            {timeline.map(t => (
              <div key={t.phase} style={{
                display: 'flex',
                gap: '20px',
                alignItems: 'flex-start'
              }}>
                <div style={{
                  minWidth: '90px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  background: `${t.color}15`,
                  border: `1px solid ${t.color}40`,
                  color: t.color,
                  fontSize: '10px',
                  fontWeight: 900,
                  textAlign: 'center',
                  letterSpacing: '0.1em'
                }}>
                  {t.phase}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#fff', marginBottom: '4px' }}>{t.label}</div>
                  <div style={{ fontSize: '13px', color: '#666' }}>{t.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Expression of Interest Form */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '20px',
          padding: '32px'
        }}>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '14px', letterSpacing: '0.2em', marginBottom: '8px' }}>
            REGISTER YOUR INTEREST
          </h2>
          <p style={{ color: '#666', fontSize: '13px', marginBottom: '24px' }}>
            No commitment. No money changes hands. We'll contact you when formal investor partnerships open at 6 months.
          </p>

          {submitted ? (
            <div style={{ textAlign: 'center', color: '#00ff87', padding: '24px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>✅</div>
              <div style={{ fontWeight: 700 }}>Interest registered.</div>
              <div style={{ color: '#666', fontSize: '13px', marginTop: '4px' }}>We'll be in touch when investor partnerships open.</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '16px' }}>
              <input
                placeholder="Your Name"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                style={{
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: '10px',
                  padding: '14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box' as const
                }}
              />
              <input
                placeholder="Email Address"
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                style={{
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: '10px',
                  padding: '14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box' as const
                }}
              />
              <input
                placeholder="General investment interest range (optional)"
                value={form.interest}
                onChange={e => setForm({ ...form, interest: e.target.value })}
                style={{
                  background: '#111',
                  border: '1px solid #222',
                  borderRadius: '10px',
                  padding: '14px',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  width: '100%',
                  boxSizing: 'border-box' as const
                }}
              />
              <button
                onClick={handleSubmit}
                style={{
                  background: 'linear-gradient(90deg, #00D9FF, #a855f7)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '16px',
                  color: '#fff',
                  fontWeight: 900,
                  fontSize: '14px',
                  cursor: 'pointer',
                  letterSpacing: '0.1em'
                }}
              >
                REGISTER INTEREST →
              </button>
              <p style={{ color: '#444', fontSize: '11px', textAlign: 'center' }}>
                This is not a solicitation for investment. ClearPath Trader is an informational data platform. We do not provide financial advice.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
