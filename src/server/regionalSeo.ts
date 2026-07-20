/**
 * Priority regional markets for ClearPath multi-engine SEO.
 * Full translated page trees come later; locale alternates + IndexNow land first.
 */
export type RegionalMarket = {
  id: string;
  label: string;
  /** BCP 47 language tag */
  lang: string;
  /** Open Graph locale */
  ogLocale: string;
  /** Primary search engines / webmaster tools for this market */
  engines: string[];
  /** Notes for operators */
  notes: string;
};

export const REGIONAL_MARKETS: RegionalMarket[] = [
  {
    id: 'ru',
    label: 'Russia / CIS',
    lang: 'ru-RU',
    ogLocale: 'ru_RU',
    engines: ['Yandex', 'Google', 'Bing'],
    notes:
      'Yandex.Webmaster + IndexNow. Russian (or bilingual) hubs outperform EN-only for Yandex IKS.',
  },
  {
    id: 'cn',
    label: 'China',
    lang: 'zh-CN',
    ogLocale: 'zh_CN',
    engines: ['Baidu', 'Bing', 'Google'],
    notes:
      'Baidu Zhanzhang is required. EN-only sites rarely rank. Prefer Simplified Chinese landings; ICP/hosting rules may apply for .cn.',
  },
  {
    id: 'jp',
    label: 'Japan (Tokyo)',
    lang: 'ja-JP',
    ogLocale: 'ja_JP',
    engines: ['Google', 'Bing', 'Yahoo Japan'],
    notes:
      'Google.jp dominates; Yahoo Japan still matters. Japanese learn/guide pages + local citations.',
  },
  {
    id: 'ph',
    label: 'Philippines',
    lang: 'fil-PH',
    ogLocale: 'fil_PH',
    engines: ['Google', 'Bing'],
    notes:
      'Google is primary. Filipino/English bilingual content and PH community links convert your following into crawlable authority.',
  },
];

/** Alternate locales announced in HTML head (signals markets even before full i18n routes). */
export function regionalOgLocaleAlternates(): string[] {
  return REGIONAL_MARKETS.map((m) => m.ogLocale);
}

export function regionalHreflangHints(canonicalUrl: string): { hreflang: string; href: string }[] {
  // Until translated routes exist, point all alternates at the EN canonical
  // (x-default) so we do not invent empty locale URLs.
  return [
    { hreflang: 'x-default', href: canonicalUrl },
    { hreflang: 'en', href: canonicalUrl },
    ...REGIONAL_MARKETS.map((m) => ({ hreflang: m.lang, href: canonicalUrl })),
  ];
}
