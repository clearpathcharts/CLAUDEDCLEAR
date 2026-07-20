/**
 * Priority regional markets for ClearPath multi-engine SEO.
 * Hub pages at /regions/{id} carry real language content for follower markets.
 */
export type RegionalMarket = {
  id: string;
  label: string;
  /** BCP 47 language tag */
  lang: string;
  /** Open Graph locale */
  ogLocale: string;
  hubPath: string;
  /** Primary search engines / webmaster tools for this market */
  engines: string[];
  /** Notes for operators */
  notes: string;
  /** Native-language SEO */
  seoTitle: string;
  seoDescription: string;
  /** Hub H1 in native language */
  headline: string;
  /** Short lead */
  lead: string;
  /** HTML body paragraphs (trusted static copy) */
  bodyHtml: string;
};

export const REGIONAL_MARKETS: RegionalMarket[] = [
  {
    id: 'ru',
    label: 'Russia / CIS',
    lang: 'ru-RU',
    ogLocale: 'ru_RU',
    hubPath: '/regions/ru',
    engines: ['Yandex', 'Google', 'Bing'],
    notes:
      'Yandex.Webmaster + IndexNow. Russian (or bilingual) hubs outperform EN-only for Yandex IKS.',
    seoTitle: 'ClearPath Trader для России и СНГ — терминал рыночной аналитики',
    seoDescription:
      'ClearPath Trader для аудитории России и СНГ: живые графики, энциклопедия, обучение и IndexNow/Yandex. Не брокер — аналитика и образование.',
    headline: 'ClearPath для России и СНГ',
    lead:
      'Терминал рыночной аналитики для трейдеров из России и СНГ: графики, индикаторы, энциклопедия и обучение на одной платформе.',
    bodyHtml: `
<article lang="ru">
<p>Если вы уже следите за ClearPath в соцсетях — этот хаб ваш вход в <strong>индексируемый</strong> продукт: страницы, которые видят Яндекс, Google и Bing.</p>
<h2>Что внутри</h2>
<ul>
  <li><a href="/education">Обучение</a> — от свечей до структуры рынка</li>
  <li><a href="/encyclopedia">Энциклопедия</a> — акции, крипто, форекс, сырьё</li>
  <li><a href="/indicators">Индикаторы</a> — визуальные объяснения</li>
  <li><a href="/tools/position-size">Калькулятор размера позиции</a></li>
</ul>
<h2>Поисковые системы</h2>
<p>Для России приоритетны <strong>Яндекс</strong> и Google. Мы отдаём sitemap и IndexNow; ваш контент и ссылки на clearpathtrader.com усиливают авторитет.</p>
<p><a href="/">Открыть терминал</a> · <a href="/learn">Learn (EN)</a> · <a href="/regions">Все регионы</a></p>
</article>`,
  },
  {
    id: 'cn',
    label: 'China',
    lang: 'zh-CN',
    ogLocale: 'zh_CN',
    hubPath: '/regions/cn',
    engines: ['Baidu', 'Bing', 'Google'],
    notes:
      'Baidu Zhanzhang is required. EN-only sites rarely rank. Prefer Simplified Chinese landings; ICP/hosting rules may apply for .cn.',
    seoTitle: 'ClearPath Trader 中国站 — 市场情报终端',
    seoDescription:
      '面向中国用户的 ClearPath Trader：实时图表、指标百科、结构化教育。非券商 — 分析与学习平台。对接百度站长与 Bing。',
    headline: 'ClearPath 中国用户入口',
    lead:
      '为关注 ClearPath 的中国交易者准备的中文入口：图表、百科、教育与工具，指向可被百度与必应抓取的正式页面。',
    bodyHtml: `
<article lang="zh-CN">
<p>社交媒体上的关注很重要，但<strong>搜索引擎只收录网站 URL</strong>。本页把您带到 ClearPath 的正式内容与工具。</p>
<h2>核心入口</h2>
<ul>
  <li><a href="/education">教育课程</a></li>
  <li><a href="/encyclopedia">金融百科</a></li>
  <li><a href="/indicators">技术指标百科</a></li>
  <li><a href="/guides">进阶指南</a></li>
  <li><a href="/tools/position-size">仓位计算器</a></li>
</ul>
<h2>搜索与收录</h2>
<p>中国市场请优先配置 <strong>百度站长平台（Zhanzhang）</strong>，并配合 Bing。纯英文薄页很难在百度获得有效排名 — 请从本中文枢纽出发建立内链。</p>
<p><a href="/">启动终端</a> · <a href="/regions">全部地区</a></p>
</article>`,
  },
  {
    id: 'jp',
    label: 'Japan (Tokyo)',
    lang: 'ja-JP',
    ogLocale: 'ja_JP',
    hubPath: '/regions/jp',
    engines: ['Google', 'Bing', 'Yahoo Japan'],
    notes:
      'Google.jp dominates; Yahoo Japan still matters. Japanese learn/guide pages + local citations.',
    seoTitle: 'ClearPath Trader 日本（東京）— マーケットインテリジェンス端末',
    seoDescription:
      '日本・東京のトレーダー向け ClearPath：ライブチャート、指標百科、体系的な教育。証券会社ではありません。Google / Yahoo! JAPAN 向けハブ。',
    headline: 'ClearPath 日本（東京）ハブ',
    lead:
      '東京をはじめ日本のフォロワー向け入口。チャート、百科事典、学習コンテンツへ、検索エンジンが辿れる正規URLで接続します。',
    bodyHtml: `
<article lang="ja">
<p>SNSのフォローは認知です。検索での評価は <strong>clearpathtrader.com</strong> 上のページと被リンクで決まります。このハブから本編へ進んでください。</p>
<h2>主なコンテンツ</h2>
<ul>
  <li><a href="/education">教育カリキュラム</a></li>
  <li><a href="/encyclopedia">金融百科</a></li>
  <li><a href="/indicators">インジケーター百科</a></li>
  <li><a href="/learn">学習トピック（英語）</a></li>
  <li><a href="/tools/position-size">ポジションサイズ計算</a></li>
</ul>
<h2>検索エンジン</h2>
<p>日本では <strong>Google</strong> が中心で、<strong>Yahoo! JAPAN</strong> も引き続き重要です。サイトマップと IndexNow（Bing 系）を併用しています。</p>
<p><a href="/">ターミナルを開く</a> · <a href="/regions">地域一覧</a></p>
</article>`,
  },
  {
    id: 'ph',
    label: 'Philippines',
    lang: 'fil-PH',
    ogLocale: 'fil_PH',
    hubPath: '/regions/ph',
    engines: ['Google', 'Bing'],
    notes:
      'Google is primary. Filipino/English bilingual content and PH community links convert your following into crawlable authority.',
    seoTitle: 'ClearPath Trader Pilipinas — market intelligence terminal',
    seoDescription:
      'ClearPath para sa traders sa Pilipinas: live charts, encyclopedia, education. Hindi brokerage — analytics at pag-aaral. Google at Bing ready.',
    headline: 'ClearPath para sa Pilipinas',
    lead:
      'Entrada para sa followers sa Pilipinas: charts, encyclopedia, at education — mga URL na mababasa ng Google, hindi lang posts sa social.',
    bodyHtml: `
<article lang="fil">
<p>Malakas ang community sa social — pero ang ranking ay nasa <strong>website pages</strong>. Gamitin ang hub na ito para punta sa opisyal na ClearPath content.</p>
<h2>Mga pangunahing link</h2>
<ul>
  <li><a href="/education">Education</a> — structured learning</li>
  <li><a href="/encyclopedia">Encyclopedia</a> — stocks, crypto, forex, commodities</li>
  <li><a href="/indicators">Indicators</a></li>
  <li><a href="/guides">Guides</a></li>
  <li><a href="/tools/position-size">Position size calculator</a></li>
</ul>
<h2>Search engines</h2>
<p>Sa Pilipinas, <strong>Google</strong> ang primary; Bing/IndexNow tumutulong sa Yahoo, DuckDuckGo, at iba pa.</p>
<p><a href="/">Buksan ang terminal</a> · <a href="/learn">Learn</a> · <a href="/regions">Lahat ng rehiyon</a></p>
</article>`,
  },
];

const ALIAS_TO_ID: Record<string, string> = {
  ru: 'ru',
  cn: 'cn',
  zh: 'cn',
  'zh-cn': 'cn',
  jp: 'jp',
  ja: 'jp',
  'ja-jp': 'jp',
  ph: 'ph',
  fil: 'ph',
  'fil-ph': 'ph',
  philippines: 'ph',
};

export function resolveRegionalMarketId(raw: string): string | null {
  const key = String(raw || '')
    .trim()
    .toLowerCase();
  return ALIAS_TO_ID[key] || null;
}

export function getRegionalMarket(idOrAlias: string): RegionalMarket | null {
  const id = resolveRegionalMarketId(idOrAlias);
  if (!id) return null;
  return REGIONAL_MARKETS.find((m) => m.id === id) || null;
}

/** Alternate locales announced in HTML head. */
export function regionalOgLocaleAlternates(): string[] {
  return REGIONAL_MARKETS.map((m) => m.ogLocale);
}

/**
 * Hreflang: EN pages keep x-default + en on themselves.
 * Regional hubs get self + cross-links to sibling hubs + EN home.
 */
export function regionalHreflangHints(
  canonicalUrl: string,
  options?: { marketId?: string }
): { hreflang: string; href: string }[] {
  const base = 'https://clearpathtrader.com';
  if (options?.marketId) {
    const self = getRegionalMarket(options.marketId);
    if (!self) return [{ hreflang: 'x-default', href: canonicalUrl }];
    return [
      { hreflang: 'x-default', href: `${base}/regions` },
      { hreflang: 'en', href: `${base}/` },
      ...REGIONAL_MARKETS.map((m) => ({
        hreflang: m.lang,
        href: `${base}${m.hubPath}`,
      })),
    ];
  }
  // Until other translated article trees exist, point language tags at regional hubs
  // when on a generic EN page — engines prefer real language URLs over duplicates.
  return [
    { hreflang: 'x-default', href: canonicalUrl },
    { hreflang: 'en', href: canonicalUrl },
    ...REGIONAL_MARKETS.map((m) => ({
      hreflang: m.lang,
      href: `${base}${m.hubPath}`,
    })),
  ];
}

export function regionalHubEntries(): { path: string; lastmod: string; changefreq: string; priority: string }[] {
  const today = new Date().toISOString().slice(0, 10);
  return [
    { path: '/regions', lastmod: today, changefreq: 'weekly', priority: '0.85' },
    ...REGIONAL_MARKETS.map((m) => ({
      path: m.hubPath,
      lastmod: today,
      changefreq: 'weekly' as const,
      priority: '0.9',
    })),
  ];
}
