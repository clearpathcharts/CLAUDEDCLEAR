/**
 * Priority regional markets for ClearPath multi-engine SEO.
 * Hub pages at /regions/{id} carry real language content for follower markets.
 */
export type RegionalFaq = { question: string; answer: string };

export type RegionalCtaCopy = {
  chartTitle: string;
  chartBody: string;
  launchLabel: string;
  educationLabel: string;
  waitlistTitle: string;
  waitlistBody: string;
  firstNameLabel: string;
  emailLabel: string;
  countryLabel: string;
  countryPlaceholder: string;
  experienceLabel: string;
  submitLabel: string;
  submittingMsg: string;
  successMsg: string;
};

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
  /** FAQ for FAQPage JSON-LD + on-page section */
  faqs: RegionalFaq[];
  /** Localized soft-launch CTA (keeps html[lang] signal clean) */
  cta: RegionalCtaCopy;
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
      'ClearPath Trader для аудитории России и СНГ: живые графики, энциклопедия, обучение и IndexNow/Yandex. Не брокер — аналитика и образование. USD/RUB, золото, инфляция, ФРС.',
    headline: 'ClearPath для России и СНГ',
    lead:
      'Терминал рыночной аналитики для трейдеров из России и СНГ: графики, индикаторы, энциклопедия и обучение на одной платформе — страницы, которые индексируют Яндекс, Google и Bing.',
    faqs: [
      {
        question: 'ClearPath Trader — это брокер?',
        answer:
          'Нет. ClearPath Trader — платформа аналитики и образования: графики, индикаторы и энциклопедия. Мы не принимаем депозиты и не исполняем биржевые ордера.',
      },
      {
        question: 'Какие поисковые системы важны для аудитории России и СНГ?',
        answer:
          'Приоритетны Яндекс и Google; Bing и экосистема IndexNow помогают Yahoo, DuckDuckGo и другим. Хаб /regions/ru — вход на индексируемые URL.',
      },
      {
        question: 'С чего начать изучение рублёвого и долларового контекста?',
        answer:
          'Откройте USD/RUB, золото XAU/USD, материалы по инфляции и ФРС, затем курс ClearPath Education и калькулятор размера позиции.',
      },
    ],
    cta: {
      chartTitle: 'Перенесите знания на живой график',
      chartBody:
        'ClearPath Trader — бесплатный терминал: живые графики, неограниченные индикаторы, контекст паттернов и обучение от новичка до продвинутого уровня. Не брокер.',
      launchLabel: 'Открыть терминал',
      educationLabel: 'Начать обучение',
      waitlistTitle: 'Лист ожидания soft-launch',
      waitlistBody: 'Получайте обновления о новых столах и функциях. Без спама — только образование и запуск.',
      firstNameLabel: 'Имя',
      emailLabel: 'Email',
      countryLabel: 'Страна',
      countryPlaceholder: 'Россия',
      experienceLabel: 'Опыт',
      submitLabel: 'В лист ожидания',
      submittingMsg: 'Отправка…',
      successMsg: 'Вы в листе ожидания. Проверьте email.',
    },
    bodyHtml: `
<article lang="ru">
<p>Если вы уже следите за ClearPath в соцсетях — этот хаб ваш вход в <strong>индексируемый</strong> продукт: страницы, которые видят Яндекс, Google и Bing. Посты дают охват; рейтинг строится на URL clearpathtrader.com и внешних ссылках на них.</p>
<h2>Для кого этот хаб</h2>
<p>Для трейдеров, студентов и исследователей из России и СНГ, которым нужен ясный путь: сначала понять макро и структуру рынка, потом смотреть графики — без давления «внести депозит».</p>
<h2>Что внутри</h2>
<ul>
  <li><a href="/education">Обучение</a> — от свечей до структуры рынка</li>
  <li><a href="/encyclopedia">Энциклопедия</a> — акции, крипто, форекс, сырьё</li>
  <li><a href="/indicators">Индикаторы</a> — визуальные объяснения</li>
  <li><a href="/tools/position-size">Калькулятор размера позиции</a></li>
  <li><a href="/learn">Learn</a> и <a href="/guides">Guides</a> — опорные статьи</li>
</ul>
<h2>Ключевой рыночный контекст для СНГ</h2>
<ul>
  <li><a href="/forex/usdrub">USD/RUB</a> — доллар к рублю</li>
  <li><a href="/forex/eurusd">EUR/USD</a> — глобальный FX-якорь</li>
  <li><a href="/commodities/xauusd">Золото (XAU/USD)</a></li>
  <li><a href="/economy/inflation">Инфляция</a> · <a href="/economy/federal-reserve">ФРС</a></li>
  <li><a href="/learn/liquidity">Ликвидность</a> · <a href="/guides/macro-spreads">Макро-спреды</a></li>
</ul>
<h2>Часовой пояс и сессии</h2>
<p>Москва (MSK) пересекается с европейской и азиатской сессиями. Удобно начинать день с макро-календаря и пар вроде USD/RUB и EUR/USD, затем переходить к золоту и индексам, когда открывается американская ликвидность.</p>
<h2>Поисковые системы</h2>
<p>Для России приоритетны <strong>Яндекс</strong> и Google. Мы отдаём sitemap и IndexNow; ваш контент и ссылки на clearpathtrader.com усиливают авторитет. Не ждите ранжирования только от соцсетей — делитесь этими URL.</p>
<h2>Частые вопросы</h2>
<dl>
  <dt>ClearPath Trader — это брокер?</dt>
  <dd>Нет. Только аналитика и образование: графики, индикаторы, энциклопедия. Без клиентских депозитов и исполнения ордеров.</dd>
  <dt>С чего начать?</dt>
  <dd><a href="/education">Education</a>, затем <a href="/forex/usdrub">USD/RUB</a> и <a href="/commodities/xauusd">золото</a>, плюс разделы про инфляцию и ФРС.</dd>
</dl>
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
    seoTitle: 'ClearPath Trader 中国站 — 市场情报与图表教育终端',
    seoDescription:
      '面向中国用户的 ClearPath Trader：实时图表、USD/CNY、黄金、指标百科与结构化教育。非券商——分析与学习。对接百度站长、Bing 与 Google。',
    headline: 'ClearPath 中国用户入口',
    lead:
      '为关注 ClearPath 的中国交易者与学习者准备的简体中文入口：图表、百科、教育与工具，指向可被百度、必应与 Google 抓取的正式页面。',
    faqs: [
      {
        question: 'ClearPath Trader 是券商或交易所吗？',
        answer:
          '不是。ClearPath 只提供市场分析与教育：图表、指标与百科。不接受客户资金，也不执行交易所订单。',
      },
      {
        question: '在中国更应关注哪些搜索引擎？',
        answer:
          '优先百度站长平台（Zhanzhang），并配合 Bing 与 Google。纯英文薄页面很难在百度获得有效排名——请从本中文枢纽建立内链。',
      },
      {
        question: '推荐从哪些品种与主题开始？',
        answer:
          '可从 USD/CNY、黄金 XAU/USD、比特币、通胀与流动性主题入手，再进入教育课程与仓位计算器。',
      },
    ],
    cta: {
      chartTitle: '把知识放到实时图表上',
      chartBody:
        'ClearPath Trader 是免费市场情报终端：实时图表、无限指标、形态上下文，以及从入门到进阶的教育路径。非券商。',
      launchLabel: '启动终端',
      educationLabel: '开始学习',
      waitlistTitle: '软启动候补名单',
      waitlistBody: '获取新工作台与功能开通通知。无垃圾邮件——仅教育与上线信息。',
      firstNameLabel: '名字',
      emailLabel: '邮箱',
      countryLabel: '国家/地区',
      countryPlaceholder: '中国',
      experienceLabel: '经验',
      submitLabel: '加入候补',
      submittingMsg: '提交中…',
      successMsg: '已加入候补名单，请查收邮件。',
    },
    bodyHtml: `
<article lang="zh-CN">
<p>社交媒体上的关注能带来认知，但<strong>搜索引擎只收录网站 URL</strong>。本页把您带到 ClearPath 的正式内容与工具，方便百度、必应与 Google 抓取，也方便您把链接分享给社群。</p>
<h2>本站适合谁</h2>
<p>适合需要先理解市场结构、再看盘的中国交易者、学生与独立研究者。平台强调「知识先于执行」：先学逻辑与风险，再谈下单——而 ClearPath 本身并不提供经纪服务。</p>
<h2>核心入口</h2>
<ul>
  <li><a href="/education">教育课程</a> — 结构化学习路径</li>
  <li><a href="/encyclopedia">金融百科</a> — 股票、加密、外汇、大宗商品</li>
  <li><a href="/indicators">技术指标百科</a></li>
  <li><a href="/guides">进阶指南</a> · <a href="/learn">主题学习</a></li>
  <li><a href="/tools/position-size">仓位计算器</a></li>
</ul>
<h2>对中国用户特别有用的深度链接</h2>
<ul>
  <li><a href="/forex/usdcny">USD/CNY</a> — 美元兑人民币</li>
  <li><a href="/commodities/xauusd">黄金 XAU/USD</a></li>
  <li><a href="/crypto/btc">Bitcoin</a> · <a href="/stocks/aapl">Apple</a> · <a href="/stocks/tsla">Tesla</a></li>
  <li><a href="/economy/inflation">通胀</a> · <a href="/learn/liquidity">流动性</a></li>
  <li><a href="/economy/federal-reserve">美联储</a> · <a href="/guides/macro-spreads">宏观利差</a></li>
</ul>
<h2>时区与交易时段</h2>
<p>中国标准时间（CST/UTC+8）横跨亚洲早盘与欧美衔接时段。可先关注亚洲流动性与 USD/CNY 相关新闻，再在欧美开盘前后跟踪黄金、美股与宏观日历。</p>
<h2>搜索与收录</h2>
<p>中国市场请优先配置 <strong>百度站长平台（Zhanzhang）</strong>，并配合 Bing 与 Google。纯英文薄页很难在百度获得有效排名 — 请从本中文枢纽出发建立内链，并把 <code>/regions/cn</code> 分享给关注者。</p>
<h2>常见问题</h2>
<dl>
  <dt>是否需要开户入金？</dt>
  <dd>不需要。ClearPath 不做经纪，也不保管资金。</dd>
  <dt>如何开始？</dt>
  <dd>先打开 <a href="/education">教育</a> 与 <a href="/forex/usdcny">USD/CNY</a>，再用仓位计算器练习风险管理概念。</dd>
</dl>
<p><a href="/">启动终端</a> · <a href="/regions">全部地区</a> · <a href="/ui">无障碍 / 神经多样性界面</a></p>
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
      '日本・東京のトレーダー向け ClearPath：USD/JPY、ライブチャート、指標百科、体系的な教育。証券会社ではありません。Google / Yahoo! JAPAN / Bing 向けハブ。',
    headline: 'ClearPath 日本（東京）ハブ',
    lead:
      '東京をはじめ日本のフォロワー向け入口。チャート、百科事典、学習コンテンツへ、検索エンジンが辿れる正規URLで接続します。',
    faqs: [
      {
        question: 'ClearPath Trader は証券会社ですか？',
        answer:
          'いいえ。分析と教育のプラットフォームです。顧客資金の預かりや取引所注文の執行は行いません。',
      },
      {
        question: '日本で重要な検索エンジンは？',
        answer:
          'Google が中心で、Yahoo! JAPAN も重要です。Bing / IndexNow は周辺エンジンにも波及します。このハブ URL を共有してください。',
      },
      {
        question: '東京時間では何から見るべきですか？',
        answer:
          'USD/JPY、金（XAU/USD）、FRB / マクロ学習、教育カリキュラムから始めるのが分かりやすいです。',
      },
    ],
    cta: {
      chartTitle: '学んだ内容をライブチャートへ',
      chartBody:
        'ClearPath Trader は無料のマーケット端末です。ライブチャート、無制限のインジケーター、パターン文脈、初級〜上級の教育。証券会社ではありません。',
      launchLabel: 'ターミナルを開く',
      educationLabel: '学習を始める',
      waitlistTitle: 'ソフトローンチ待機リスト',
      waitlistBody: '新デスクや機能の公開情報をお届けします。スパムなし — 教育とローンチ案内のみ。',
      firstNameLabel: '名前',
      emailLabel: 'メール',
      countryLabel: '国',
      countryPlaceholder: '日本',
      experienceLabel: '経験',
      submitLabel: '待機リストに登録',
      submittingMsg: '送信中…',
      successMsg: '登録しました。メールをご確認ください。',
    },
    bodyHtml: `
<article lang="ja">
<p>SNSのフォローは認知です。検索での評価は <strong>clearpathtrader.com</strong> 上のページと被リンクで決まります。このハブから本編へ進み、フォロワーにもこの URL を共有してください。</p>
<h2>こんな方へ</h2>
<p>東京を含む日本の個人投資家・学習者向け。まず市場の仕組みを理解し、その後にチャートを見る流れを想定しています。ClearPath 自体は証券口座や注文執行を提供しません。</p>
<h2>主なコンテンツ</h2>
<ul>
  <li><a href="/education">教育カリキュラム</a></li>
  <li><a href="/encyclopedia">金融百科</a></li>
  <li><a href="/indicators">インジケーター百科</a></li>
  <li><a href="/learn">学習トピック</a> · <a href="/guides">ガイド</a></li>
  <li><a href="/tools/position-size">ポジションサイズ計算</a></li>
</ul>
<h2>日本市場で特に見るリンク</h2>
<ul>
  <li><a href="/forex/usdjpy">USD/JPY</a> — ドル円</li>
  <li><a href="/commodities/xauusd">金（XAU/USD）</a></li>
  <li><a href="/stocks/aapl">Apple</a> · <a href="/stocks/tsla">Tesla</a></li>
  <li><a href="/economy/federal-reserve">FRB</a> · <a href="/economy/inflation">インフレ</a></li>
  <li><a href="/learn/microstructure">マーケットマイクロ構造</a> · <a href="/learn/liquidity">流動性</a></li>
</ul>
<h2>東京時間の見方</h2>
<p>日本時間（JST）はアジア早朝〜欧州開始にまたがります。朝は USD/JPY とアジア関連ニュース、欧州・米国オープン前後に金やマクロ指標を追う流れが一般的です。</p>
<h2>検索エンジン</h2>
<p>日本では <strong>Google</strong> が中心で、<strong>Yahoo! JAPAN</strong> も引き続き重要です。サイトマップと IndexNow（Bing 系）を併用しています。</p>
<h2>よくある質問</h2>
<dl>
  <dt>口座開設は必要ですか？</dt>
  <dd>不要です。教育と分析のみです。</dd>
  <dt>最初の一歩は？</dt>
  <dd><a href="/education">教育</a> と <a href="/forex/usdjpy">USD/JPY</a> から始め、ポジションサイズ計算でリスクの考え方を練習してください。</dd>
</dl>
<p><a href="/">ターミナルを開く</a> · <a href="/regions">地域一覧</a> · <a href="/ui">UIモード</a></p>
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
      'ClearPath para sa traders sa Pilipinas: live charts, USD/PHP, ginto, encyclopedia, education. Hindi brokerage — analytics at pag-aaral. Google at Bing ready.',
    headline: 'ClearPath para sa Pilipinas',
    lead:
      'Entrada para sa followers sa Pilipinas: charts, encyclopedia, at education — mga URL na mababasa ng Google, hindi lang posts sa social.',
    faqs: [
      {
        question: 'Brokerage ba ang ClearPath Trader?',
        answer:
          'Hindi. Analytics at education lang: charts, indicators, encyclopedia. Walang client deposits at walang order execution.',
      },
      {
        question: 'Anong search engine ang importante sa Pilipinas?',
        answer:
          'Google ang primary. Bing/IndexNow tumutulong sa Yahoo, DuckDuckGo, at iba pa. I-share ang /regions/ph URL sa community.',
      },
      {
        question: 'Saan magsisimula para sa PH context?',
        answer:
          'Magsimula sa USD/PHP, gold (XAU/USD), education path, at position size calculator — bago mag-isip ng live risk.',
      },
    ],
    cta: {
      chartTitle: 'Ilagay ang kaalaman sa live chart',
      chartBody:
        'Free market intelligence terminal ang ClearPath Trader: live charts, unlimited indicators, pattern context, at beginner-to-advanced education. Hindi brokerage.',
      launchLabel: 'Buksan ang terminal',
      educationLabel: 'Simulan ang education',
      waitlistTitle: 'Soft-launch waitlist',
      waitlistBody: 'Updates kapag may bagong desks at features. Walang spam — education at launch notes lang.',
      firstNameLabel: 'Pangalan',
      emailLabel: 'Email',
      countryLabel: 'Bansa',
      countryPlaceholder: 'Pilipinas',
      experienceLabel: 'Karanasan',
      submitLabel: 'Sumali sa waitlist',
      submittingMsg: 'Isinusumite…',
      successMsg: 'Nasa waitlist ka na. Tingnan ang email.',
    },
    bodyHtml: `
<article lang="fil">
<p>Malakas ang community sa social — pero ang ranking ay nasa <strong>website pages</strong>. Gamitin ang hub na ito para punta sa opisyal na ClearPath content, at i-share ang URL na ito sa group chats at pages ninyo.</p>
<h2>Para kanino ito</h2>
<p>Para sa traders, students, at independent learners sa Pilipinas na gusto munang maintindihan ang sistema bago mag-risk. Ang ClearPath ay hindi brokerage — analytics at pag-aaral lang.</p>
<h2>Mga pangunahing link</h2>
<ul>
  <li><a href="/education">Education</a> — structured learning</li>
  <li><a href="/encyclopedia">Encyclopedia</a> — stocks, crypto, forex, commodities</li>
  <li><a href="/indicators">Indicators</a></li>
  <li><a href="/guides">Guides</a> · <a href="/learn">Learn</a></li>
  <li><a href="/tools/position-size">Position size calculator</a></li>
</ul>
<h2>PH-relevant deep links</h2>
<ul>
  <li><a href="/forex/usdphp">USD/PHP</a> — dolyar sa piso</li>
  <li><a href="/commodities/xauusd">Gold (XAU/USD)</a></li>
  <li><a href="/crypto/btc">Bitcoin</a> · <a href="/stocks/aapl">Apple (AAPL)</a></li>
  <li><a href="/learn/valuation">Valuation</a> · <a href="/learn/liquidity">Liquidity</a></li>
  <li><a href="/economy/inflation">Inflation</a> · <a href="/education">Full curriculum</a></li>
  <li><a href="/ui">Neurodivergent UI modes</a></li>
</ul>
<h2>Oras sa Pilipinas (PHT)</h2>
<p>UTC+8 ang Philippine Time — magkakapatong sa Asian session at bahagi ng European open. Maganda umpisahan ang araw sa USD/PHP at macro headlines, tapos sundin ang gold at US-related markets kapag dumating ang mas malaking liquidity.</p>
<h2>Search engines</h2>
<p>Sa Pilipinas, <strong>Google</strong> ang primary; Bing/IndexNow tumutulong sa Yahoo, DuckDuckGo, at iba pa.</p>
<h2>Madalas itanong</h2>
<dl>
  <dt>Kailangan bang mag-deposit?</dt>
  <dd>Hindi. Walang brokerage account sa ClearPath.</dd>
  <dt>Unang hakbang?</dt>
  <dd>Buksan ang <a href="/education">Education</a> at <a href="/forex/usdphp">USD/PHP</a>, tapos subukan ang position size calculator.</dd>
</dl>
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
 * Hreflang for regional hubs: siblings + EN home + regions index.
 * Generic EN pages only announce themselves (x-default + en) — pointing every
 * English URL at language hubs is not equivalent-content hreflang.
 */
export function regionalHreflangHints(
  canonicalUrl: string,
  options?: { marketId?: string; regionalIndex?: boolean }
): { hreflang: string; href: string }[] {
  const base = 'https://clearpathtrader.com';
  if (options?.marketId) {
    const self = getRegionalMarket(options.marketId);
    if (!self) return [{ hreflang: 'x-default', href: canonicalUrl }];
    const tags: { hreflang: string; href: string }[] = [
      { hreflang: 'x-default', href: `${base}/regions` },
      { hreflang: 'en', href: `${base}/` },
      ...REGIONAL_MARKETS.map((m) => ({
        hreflang: m.lang,
        href: `${base}${m.hubPath}`,
      })),
    ];
    // Filipino also commonly tagged as tl
    tags.push({ hreflang: 'tl', href: `${base}/regions/ph` });
    return tags;
  }
  if (options?.regionalIndex) {
    return [
      { hreflang: 'x-default', href: `${base}/regions` },
      { hreflang: 'en', href: `${base}/regions` },
      ...REGIONAL_MARKETS.map((m) => ({
        hreflang: m.lang,
        href: `${base}${m.hubPath}`,
      })),
      { hreflang: 'tl', href: `${base}/regions/ph` },
    ];
  }
  return [
    { hreflang: 'x-default', href: canonicalUrl },
    { hreflang: 'en', href: canonicalUrl },
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

/** URLs to IndexNow-ping for regional SEO (Bing/Yandex ecosystem). */
export function regionalIndexNowUrls(): string[] {
  const base = 'https://clearpathtrader.com';
  return [
    `${base}/regions`,
    ...REGIONAL_MARKETS.map((m) => `${base}${m.hubPath}`),
    `${base}/forex/usdrub`,
    `${base}/forex/usdcny`,
    `${base}/forex/usdjpy`,
    `${base}/forex/usdphp`,
    `${base}/commodities/xauusd`,
    `${base}/education`,
    `${base}/learn`,
    `${base}/encyclopedia`,
  ];
}
