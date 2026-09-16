import React, { useMemo } from 'react';
import { lookupCompany, relatedCompanies, COMPANY_DIRECTORY_DISCLAIMER } from '../../lib/companyCatalog';

export default function CompanyProfileView({ slug }: { slug: string }) {
  const rec = useMemo(() => lookupCompany(slug), [slug]);
  const related = useMemo(() => (rec ? relatedCompanies(rec, 4) : []), [rec]);

  if (!rec) {
    return (
      <div className="p-8 text-zinc-400 font-mono text-sm">
        No educational directory record for <code>{slug}</code>.{' '}
        <a className="text-cyan-400 underline" href="/companies">
          Back to directory
        </a>
      </div>
    );
  }

  const parentHref = rec.parentTicker ? `/stocks/${rec.parentTicker.toLowerCase()}` : '/stocks';

  return (
    <article className="max-w-3xl mx-auto p-6 text-white space-y-5">
      <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">Educational company listing</p>
      <h1 className="text-3xl font-black uppercase tracking-tight">{rec.name}</h1>
      <p className="text-zinc-300 text-sm leading-relaxed">{rec.description}</p>
      <p className="text-xs text-zinc-500">{COMPANY_DIRECTORY_DISCLAIMER}</p>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <dt className="text-zinc-500 font-mono text-[10px] uppercase">Status</dt>
          <dd>{rec.status}</dd>
        </div>
        <div>
          <dt className="text-zinc-500 font-mono text-[10px] uppercase">Sector</dt>
          <dd>{rec.sector || 'DATA UNAVAILABLE'}</dd>
        </div>
        {rec.parentCompany ? (
          <div>
            <dt className="text-zinc-500 font-mono text-[10px] uppercase">Parent issuer</dt>
            <dd>
              <a className="text-cyan-400 underline" href={parentHref}>
                {rec.parentCompany} {rec.parentTicker ? `(${rec.parentTicker})` : ''}
              </a>
            </dd>
          </div>
        ) : null}
        {rec.unitLabel ? (
          <div>
            <dt className="text-zinc-500 font-mono text-[10px] uppercase">Study unit</dt>
            <dd>{rec.unitLabel}</dd>
          </div>
        ) : null}
      </dl>
      <p className="text-sm">
        <strong className="text-pink-400">DATA UNAVAILABLE</strong> for live revenue, filings, and quotes on this page.
      </p>
      {related.length ? (
        <section>
          <h2 className="text-lg font-black uppercase mb-2">Related listings</h2>
          <ul className="space-y-1 text-sm">
            {related.map((r) => (
              <li key={r.slug}>
                <a
                  className="text-cyan-400 underline"
                  href={r.status === 'Public' && r.ticker ? `/stocks/${r.ticker.toLowerCase()}` : `/companies/${r.slug}`}
                >
                  {r.name}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p>
        <a className="text-cyan-400 underline" href="/companies">
          ← Company directory
        </a>
      </p>
    </article>
  );
}
