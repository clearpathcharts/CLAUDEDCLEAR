/**
 * Probe publisher homepages for RSS. Input: one domain or https URL per line.
 * Does not scrape getrssfeed.com. Does not write MAGAZINE_PUBLICATIONS —
 * prints JSON the founder can review before it lands on the catalog.
 *
 *   npx tsx scripts/ingest-rss-catalog.ts data/ywc-rss-ingest.example.txt
 */
import { writeFileSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import {
  candidateFeedUrls,
  homepageFromDomain,
  registrableHost,
} from '../src/server/rssDiscover.ts';
import {
  isPublisherArticleUrl,
  parseMagazineFeedXml,
  type MagazinePublication,
} from '../src/server/magazineRack.ts';

const FETCH_MS = 8000;

async function fetchText(url: string): Promise<{ status: number; body: string; finalUrl: string }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), FETCH_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'ClearPathTrader/1.0 (+https://clearpathtrader.com)',
        Accept: 'text/html, application/rss+xml, application/xml, text/xml',
      },
      redirect: 'follow',
    });
    const body = await res.text();
    return { status: res.status, body, finalUrl: res.url || url };
  } finally {
    clearTimeout(t);
  }
}

async function probeOne(homepage: string): Promise<MagazinePublication | { homepage: string; error: string }> {
  let html = '';
  try {
    const page = await fetchText(homepage);
    if (page.status < 400) html = page.body;
  } catch (err) {
    return { homepage, error: err instanceof Error ? err.message : 'homepage fetch failed' };
  }

  const candidates = candidateFeedUrls(homepage, html);
  const host = registrableHost(new URL(homepage).hostname);
  const slug = host.replace(/\./g, '-');

  for (const feedUrl of candidates.slice(0, 8)) {
    try {
      const got = await fetchText(feedUrl);
      if (got.status >= 400) continue;
      if (/^\s*<!DOCTYPE html/i.test(got.body) || /^\s*<html/i.test(got.body)) continue;
      const pub: MagazinePublication = {
        id: slug,
        name: host,
        homepage,
        feedUrl,
        category: 'lifestyle',
        articleHosts: [host],
      };
      const stories = await parseMagazineFeedXml(pub, got.body);
      const ok = stories.some((s) => isPublisherArticleUrl(s.articleUrl, [host]));
      if (!ok) continue;
      return {
        ...pub,
        name: stories[0]?.source || host,
      };
    } catch {
      /* try next candidate */
    }
  }
  return { homepage, error: 'no working https RSS on this host' };
}

const inputPath = process.argv[2];
if (!inputPath) {
  console.error('Usage: npx tsx scripts/ingest-rss-catalog.ts <domains.txt>');
  process.exit(1);
}

const raw = await readFile(inputPath, 'utf8');
const homes = raw
  .split(/\r?\n/)
  .map(homepageFromDomain)
  .filter((h): h is string => Boolean(h));

const results = [];
for (const home of homes) {
  const row = await probeOne(home);
  results.push(row);
  const label = 'error' in row ? `FAIL ${row.error}` : `OK ${row.feedUrl}`;
  console.error(`${home} → ${label}`);
}

const accepted = results.filter((r): r is MagazinePublication => !('error' in r));
const rejected = results.filter((r) => 'error' in r);
const out = {
  accepted,
  rejected,
};
const outPath = inputPath.replace(/\.txt$/i, '') + '.result.json';
writeFileSync(outPath, JSON.stringify(out, null, 2));
console.log(JSON.stringify({ accepted: accepted.length, rejected: rejected.length, outPath }, null, 2));
