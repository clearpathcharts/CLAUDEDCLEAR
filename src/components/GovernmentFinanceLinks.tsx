import React from 'react';

export interface GovFinanceLink {
  id: string;
  name: string;
  href: string;
  logoSrc: string;
  shortLabel: string;
}

/** Official U.S. finance / investor-protection resources shown in site footers. */
export const GOV_FINANCE_LINKS: GovFinanceLink[] = [
  {
    id: 'sec',
    name: 'U.S. Securities and Exchange Commission',
    href: 'https://www.sec.gov/',
    logoSrc: '/images/gov/sec.svg',
    shortLabel: 'SEC',
  },
  {
    id: 'investor',
    name: 'Investor.gov — SEC Investor Education',
    href: 'https://www.investor.gov/',
    logoSrc: '/images/gov/investor-gov.svg',
    shortLabel: 'Investor.gov',
  },
  {
    id: 'ftc',
    name: 'Federal Trade Commission',
    href: 'https://www.ftc.gov/',
    logoSrc: '/images/gov/ftc.svg',
    shortLabel: 'FTC',
  },
  {
    id: 'cftc',
    name: 'Commodity Futures Trading Commission',
    href: 'https://www.cftc.gov/',
    logoSrc: '/images/gov/cftc.svg',
    shortLabel: 'CFTC',
  },
  {
    id: 'cfpb',
    name: 'Consumer Financial Protection Bureau',
    href: 'https://www.consumerfinance.gov/',
    logoSrc: '/images/gov/cfpb.svg',
    shortLabel: 'CFPB',
  },
  {
    id: 'finra',
    name: 'Financial Industry Regulatory Authority',
    href: 'https://www.finra.org/',
    logoSrc: '/images/gov/finra.svg',
    shortLabel: 'FINRA',
  },
  {
    id: 'fed',
    name: 'Board of Governors of the Federal Reserve System',
    href: 'https://www.federalreserve.gov/',
    logoSrc: '/images/gov/federal-reserve.svg',
    shortLabel: 'Federal Reserve',
  },
  {
    id: 'treasury',
    name: 'U.S. Department of the Treasury',
    href: 'https://home.treasury.gov/',
    logoSrc: '/images/gov/treasury.svg',
    shortLabel: 'U.S. Treasury',
  },
  {
    id: 'fdic',
    name: 'Federal Deposit Insurance Corporation',
    href: 'https://www.fdic.gov/',
    logoSrc: '/images/gov/fdic.svg',
    shortLabel: 'FDIC',
  },
];

interface GovernmentFinanceLinksProps {
  /** Slightly tighter padding for the authenticated terminal footer */
  compact?: boolean;
  className?: string;
}

/**
 * Bottom-of-site strip of official U.S. financial regulatory & consumer
 * protection resources. Framed as education links — not affiliation.
 */
export default function GovernmentFinanceLinks({
  compact = false,
  className = '',
}: GovernmentFinanceLinksProps) {
  return (
    <section
      className={`w-full border-t border-white/10 ${compact ? 'pt-6 pb-2' : 'pt-8 pb-4'} ${className}`}
      aria-labelledby="gov-finance-resources-heading"
    >
      <div className="max-w-5xl mx-auto px-4">
        <h2
          id="gov-finance-resources-heading"
          className="text-center text-[10px] sm:text-[11px] font-mono font-bold uppercase tracking-[0.2em] text-zinc-400 mb-1"
        >
          Official U.S. Financial Regulatory &amp; Consumer Resources
        </h2>
        <p className="text-center text-[9px] sm:text-[10px] font-mono text-zinc-600 mb-5 max-w-2xl mx-auto leading-relaxed">
          Investor education and consumer protection links. Clear Path Markets Science
          is not affiliated with, endorsed by, or sponsored by these agencies.
        </p>

        <ul className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 list-none m-0 p-0">
          {GOV_FINANCE_LINKS.map((link) => (
            <li key={link.id}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                title={`${link.name} (opens official site)`}
                aria-label={`${link.name} — official website`}
                className="group block rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-transform hover:scale-[1.04]"
              >
                <img
                  src={link.logoSrc}
                  alt={link.name}
                  width={link.id === 'investor' || link.id === 'fed' ? 140 : link.id === 'treasury' ? 130 : 120}
                  height={48}
                  className="h-10 sm:h-11 w-auto opacity-75 group-hover:opacity-100 transition-opacity shadow-sm"
                  loading="lazy"
                  decoding="async"
                />
                <span className="sr-only">{link.shortLabel}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
