/**
 * Magazine rack: allowlisted RSS only; outbound links stay on the publisher.
 * Run: npx tsx scripts/magazine-rack.selftest.ts
 */
import assert from 'node:assert/strict';
import {
  MAGAZINE_PUBLICATIONS,
  hostMatchesAllowlist,
  isPublisherArticleUrl,
  isSafeImageUrl,
  parseMagazineFeedXml,
  stripHtmlSnippet,
  sanitizeRssXml,
} from '../src/server/magazineRack.ts';

assert.ok(
  MAGAZINE_PUBLICATIONS.some((p) => p.id === 'motorsport-f1'),
  'Motorsport F1 wire is on the rack',
);
assert.ok(
  MAGAZINE_PUBLICATIONS.some((p) => p.id === 'smithsonian'),
  'Smithsonian Magazine is on the rack',
);
assert.ok(
  MAGAZINE_PUBLICATIONS.every((p) => p.homepage.startsWith('https://') && p.feedUrl.startsWith('https://')),
  'every publication uses https homepage + feed',
);

assert.equal(hostMatchesAllowlist('www.motorsport.com', ['motorsport.com']), true);
assert.equal(hostMatchesAllowlist('cdn-5.motorsport.com', ['motorsport.com']), true);
assert.equal(hostMatchesAllowlist('evil.example', ['motorsport.com']), false);

assert.equal(
  isPublisherArticleUrl(
    'https://www.motorsport.com/f1/news/lando-norris/10848955/',
    ['motorsport.com'],
  ),
  true,
);
assert.equal(
  isPublisherArticleUrl('https://clearpathtrader.com/phishing', ['motorsport.com']),
  false,
);
assert.equal(
  isPublisherArticleUrl('javascript:alert(1)', ['motorsport.com']),
  false,
);
assert.equal(
  isPublisherArticleUrl('http://www.motorsport.com/f1/news/x', ['motorsport.com']),
  false,
  'article links must be https',
);

assert.equal(
  isSafeImageUrl('https://cdn-5.motorsport.com/images/amp/6zoDozk0/s6/lando-norris-mclaren.jpg')?.startsWith('https://'),
  true,
);
assert.equal(isSafeImageUrl('javascript:alert(1)'), null);

assert.ok(sanitizeRssXml('<t>A & B</t>').includes('A &amp; B'));
assert.ok(sanitizeRssXml('<t>A &amp; B</t>').includes('A &amp; B'));

assert.equal(
  stripHtmlSnippet('<p>Hello <b>world</b> &amp; friends</p>'),
  'Hello world & friends',
);
assert.ok(stripHtmlSnippet('x'.repeat(400)).endsWith('…'));
assert.ok(!stripHtmlSnippet('<script>alert(1)</script>safe').includes('alert'));

const motorsport = MAGAZINE_PUBLICATIONS.find((p) => p.id === 'motorsport-f1')!;
const xml = `<?xml version="1.0"?>
<rss version="2.0">
  <channel>
    <title>Motorsport</title>
    <item>
      <title>Good F1 story</title>
      <link>https://www.motorsport.com/f1/news/good-story/1/</link>
      <description>&lt;p&gt;Snippet from the desk.&lt;/p&gt;</description>
      <enclosure url="https://cdn-5.motorsport.com/images/x.jpg" type="image/jpeg" />
    </item>
    <item>
      <title>Hijacked</title>
      <link>https://evil.example/phish</link>
    </item>
  </channel>
</rss>`;

const stories = await parseMagazineFeedXml(motorsport, xml);
assert.equal(stories.length, 1, 'hijacked host is dropped');
assert.equal(stories[0].articleUrl, 'https://www.motorsport.com/f1/news/good-story/1/');
assert.equal(stories[0].source, 'Motorsport');
assert.ok(stories[0].image?.includes('cdn-5.motorsport.com'));

console.log('magazine-rack.selftest: ok');
