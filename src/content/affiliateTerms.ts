/**
 * ClearPath Trader Affiliate Program Agreement.
 * Single source of truth — rendered in the activation modal and at /affiliate-terms.
 * Bump AFFILIATE_TERMS_VERSION whenever the text materially changes; members'
 * accepted version is recorded at activation.
 */

export const AFFILIATE_TERMS_VERSION = '2026-07-31';

export type TermsSection = { heading: string; body: string[] };

export const AFFILIATE_TERMS_SECTIONS: TermsSection[] = [
  {
    heading: '1. The Program',
    body: [
      'The ClearPath Trader Affiliate Program (the "Program") lets active ClearPath Trader members ("Affiliates") earn commissions by referring new paying members. The Program is operated by ClearPath Trader ("ClearPath", "we", "us").',
      'Participation is free and open to any member in good standing. By clicking "Activate", you enroll in the Program and agree to this Agreement.',
    ],
  },
  {
    heading: '2. Your Referral Link',
    body: [
      'On activation you receive a unique referral link and code. A referral is "successful" when a new user who arrived through your link (or entered your code) creates an account within 30 days of clicking it, as determined by our tracking system.',
      'Our tracking records are the system of record. First attribution wins: a user referred by another affiliate first cannot be re-attributed to you.',
    ],
  },
  {
    heading: '3. Commissions — 25% Lifetime Residual',
    body: [
      'You earn 25% of every membership payment made by each member you referred, for as long as that member keeps an active paid membership. This applies to every billing period — monthly plans credit monthly, yearly plans credit yearly at 25% of the yearly price.',
      'Commissions accrue as credit in your Affiliate Network ledger. Free trials, unpaid periods, refunded payments, and disputed/charged-back payments do not generate commission; commissions already credited for refunded or charged-back payments will be reversed.',
      'This is a single-level program. You earn only on members you personally refer. There are no downlines, no legs, no override commissions, and no recruiting requirements of any kind. This Program is not a multi-level marketing opportunity.',
    ],
  },
  {
    heading: '4. Getting Paid',
    body: [
      'Once your accrued credit reaches $25.00 USD, you may request a payout from your Affiliate Network tab. Payouts are sent via PayPal (or another method we make available) within 5 business days of approval.',
      'Alternatively, you may apply credit toward your own ClearPath membership at any time, with no minimum.',
      'You are responsible for providing accurate payout details and for all taxes on your earnings. Affiliates are independent contractors, not employees, agents, or partners of ClearPath. Where required, we may ask you to complete tax documentation (e.g. IRS Form W-9/W-8) before releasing payouts, and we may report earnings as required by law.',
    ],
  },
  {
    heading: '5. Honest Promotion — What You May Not Do',
    body: [
      'No spam: no unsolicited bulk email, SMS, robocalls, or comment/forum spam.',
      'No misleading claims: never promise, guarantee, or imply trading profits, investment returns, or income of any kind — from trading or from this Program. ClearPath is a market-intelligence and education platform; it does not provide financial advice.',
      'No impersonation: do not present yourself as ClearPath, our employee, or our agent. Do not register domains, social handles, or ads that could be confused with ClearPath\u2019s own.',
      'No paid-search hijacking: do not bid on ClearPath trademarks or brand terms in search advertising.',
      'No self-dealing: self-referrals, fake accounts, incentivized sign-ups you fund yourself, cookie stuffing, forced clicks, and any manipulation of the tracking system are prohibited and will result in forfeiture of commissions and removal from the Program.',
      'Follow disclosure law: when you promote ClearPath, disclose your affiliate relationship clearly and conspicuously (e.g. "I earn a commission if you join through my link"), consistent with FTC guidance and the laws of your jurisdiction.',
    ],
  },
  {
    heading: '6. Term, Termination & Changes',
    body: [
      'You may leave the Program at any time. We may suspend or terminate your participation for violation of this Agreement, fraud, abuse, or conduct that harms ClearPath or its members; commissions obtained through violations are forfeited.',
      'If you leave or are terminated for cause, residual accrual stops. Legitimately accrued, unpaid balances over the payout minimum will be paid out on the normal schedule.',
      'We may update commission rates, payout terms, or this Agreement prospectively with notice in-app or by email. Changes never apply retroactively to commissions already earned. Continued participation after notice constitutes acceptance.',
      'If a referred member cancels and later re-subscribes, or the tracking record is lost due to circumstances beyond our control, re-attribution is at our reasonable discretion.',
    ],
  },
  {
    heading: '7. The Legal Fine Print',
    body: [
      'The Program is provided "as is". To the maximum extent permitted by law, ClearPath\u2019s total liability arising out of the Program is limited to the commissions accrued and unpaid in your ledger.',
      'Nothing in the Program creates an employment, agency, partnership, or joint-venture relationship. You have no authority to bind ClearPath.',
      'This Agreement is governed by the laws of the jurisdiction in which ClearPath Trader is organized, without regard to conflict-of-law rules. If any provision is found unenforceable, the remainder stays in effect.',
      'Questions? Contact us through the app or reply to any official ClearPath email.',
    ],
  },
];

/** Plain-text render (for email attachments or copy/paste). */
export function affiliateTermsPlainText(): string {
  const lines: string[] = [
    'CLEARPATH TRADER AFFILIATE PROGRAM AGREEMENT',
    `Version ${AFFILIATE_TERMS_VERSION}`,
    '',
  ];
  for (const section of AFFILIATE_TERMS_SECTIONS) {
    lines.push(section.heading.toUpperCase());
    for (const p of section.body) lines.push(p, '');
  }
  return lines.join('\n');
}
