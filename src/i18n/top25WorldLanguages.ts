/**
 * Top 25 world languages — mock catalog for native ClearPath sites.
 * Domain stays clearpathtrader.com; each locale gets its own path prefix (/languages/{code} mock → future /{code}/ production).
 * Not machine translation — each locale is a planned native copy pack (outside marketing + inside terminal UI).
 */

export type LanguageMockTier = 'full-native' | 'regional-hub' | 'priority' | 'mock-shell';

export type Top25Language = {
  /** URL segment (BCP 47 primary or common code) */
  code: string;
  bcp47: string;
  ogLocale: string;
  /** English label for operators */
  labelEn: string;
  /** Endonym */
  endonym: string;
  /** How the product reads in-market (brand + localized descriptor) */
  siteTitleNative: string;
  /** Mock path on clearpathtrader.com */
  mockPath: string;
  /** Planned production prefix once locales ship */
  productionPath: string;
  /** Approx. rank by total speakers (planning reference) */
  speakerRank: number;
  direction: 'ltr' | 'rtl';
  tier: LanguageMockTier;
  /** Link to existing regional SEO hub when applicable */
  regionalHubPath?: string;
  /** Outside — hero H1 mock */
  heroHeadline: string;
  /** Outside — one-line lead */
  heroLead: string;
  /** Inside — sample nav labels (terminal chrome) */
  navInside: {
    charts: string;
    education: string;
    encyclopedia: string;
    login: string;
  };
};

export const CLEARPATH_DOMAIN = 'clearpathtrader.com';

/** Mock index + per-locale shells at /languages/:code */
export const LANGUAGE_MOCK_INDEX_PATH = '/languages';

export const TOP_25_WORLD_LANGUAGES: Top25Language[] = [
  {
    code: 'en',
    bcp47: 'en-US',
    ogLocale: 'en_US',
    labelEn: 'English',
    endonym: 'English',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/en',
    productionPath: '/en',
    speakerRank: 1,
    direction: 'ltr',
    tier: 'full-native',
    heroHeadline: 'ClearPath Trader — market intelligence terminal',
    heroLead:
      'Live charts, encyclopedias, and education on one site. Analytics and learning only — not a broker.',
    navInside: {
      charts: 'Charts',
      education: 'Education',
      encyclopedia: 'Encyclopedia',
      login: 'Private Login',
    },
  },
  {
    code: 'zh',
    bcp47: 'zh-Hans',
    ogLocale: 'zh_CN',
    labelEn: 'Chinese (Simplified)',
    endonym: '简体中文',
    siteTitleNative: 'ClearPath 交易者',
    mockPath: '/languages/zh',
    productionPath: '/zh',
    speakerRank: 2,
    direction: 'ltr',
    tier: 'regional-hub',
    regionalHubPath: '/regions/cn',
    heroHeadline: 'ClearPath 交易者 — 市场分析终端',
    heroLead: '实时图表、百科与课程在同一平台。分析与教育，非券商。',
    navInside: {
      charts: '图表',
      education: '教育',
      encyclopedia: '百科',
      login: '私人登录',
    },
  },
  {
    code: 'hi',
    bcp47: 'hi-IN',
    ogLocale: 'hi_IN',
    labelEn: 'Hindi',
    endonym: 'हिन्दी',
    siteTitleNative: 'क्लियरपाथ ट्रेडर',
    mockPath: '/languages/hi',
    productionPath: '/hi',
    speakerRank: 3,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'क्लियरपाथ ट्रेडर — बाज़ार विश्लेषण टर्मिनल',
    heroLead: 'लाइव चार्ट, विश्वकोश और शिक्षा — एक ही साइट पर। दलाल नहीं, केवल शिक्षा और विश्लेषण।',
    navInside: {
      charts: 'चार्ट',
      education: 'शिक्षा',
      encyclopedia: 'विश्वकोश',
      login: 'निजी लॉगिन',
    },
  },
  {
    code: 'es',
    bcp47: 'es-ES',
    ogLocale: 'es_ES',
    labelEn: 'Spanish',
    endonym: 'Español',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/es',
    productionPath: '/es',
    speakerRank: 4,
    direction: 'ltr',
    tier: 'priority',
    heroHeadline: 'ClearPath Trader — terminal de inteligencia de mercados',
    heroLead:
      'Gráficos en vivo, enciclopedias y formación en un solo sitio. Análisis y educación — no somos bróker.',
    navInside: {
      charts: 'Gráficos',
      education: 'Formación',
      encyclopedia: 'Enciclopedia',
      login: 'Acceso privado',
    },
  },
  {
    code: 'fr',
    bcp47: 'fr-FR',
    ogLocale: 'fr_FR',
    labelEn: 'French',
    endonym: 'Français',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/fr',
    productionPath: '/fr',
    speakerRank: 5,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — terminal d’analyse des marchés',
    heroLead:
      'Graphiques en direct, encyclopédies et formation sur un seul site. Analyse et pédagogie — pas un courtier.',
    navInside: {
      charts: 'Graphiques',
      education: 'Formation',
      encyclopedia: 'Encyclopédie',
      login: 'Connexion privée',
    },
  },
  {
    code: 'ar',
    bcp47: 'ar',
    ogLocale: 'ar_SA',
    labelEn: 'Arabic',
    endonym: 'العربية',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/ar',
    productionPath: '/ar',
    speakerRank: 6,
    direction: 'rtl',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — محطة تحليل الأسواق',
    heroLead: 'رسوم بيانية مباشرة وموسوعات وتعليم في موقع واحد. تحليل وتعليم — ليس وسيطًا.',
    navInside: {
      charts: 'الرسوم',
      education: 'التعليم',
      encyclopedia: 'الموسوعة',
      login: 'تسجيل خاص',
    },
  },
  {
    code: 'bn',
    bcp47: 'bn-BD',
    ogLocale: 'bn_BD',
    labelEn: 'Bengali',
    endonym: 'বাংলা',
    siteTitleNative: 'ক্লিয়ারপাথ ট্রেডার',
    mockPath: '/languages/bn',
    productionPath: '/bn',
    speakerRank: 7,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ক্লিয়ারপাথ ট্রেডার — বাজার বিশ্লেষণ টার্মিনাল',
    heroLead: 'লাইভ চার্ট, বিশ্বকোষ ও শিক্ষা এক প্ল্যাটফর্মে। ব্রোকার নয় — শিক্ষা ও বিশ্লেষণ।',
    navInside: {
      charts: 'চার্ট',
      education: 'শিক্ষা',
      encyclopedia: 'বিশ্বকোষ',
      login: 'ব্যক্তিগত লগইন',
    },
  },
  {
    code: 'pt',
    bcp47: 'pt-BR',
    ogLocale: 'pt_BR',
    labelEn: 'Portuguese',
    endonym: 'Português',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/pt',
    productionPath: '/pt',
    speakerRank: 8,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — terminal de inteligência de mercado',
    heroLead:
      'Gráficos ao vivo, enciclopédias e educação num só site. Análise e ensino — não somos corretora.',
    navInside: {
      charts: 'Gráficos',
      education: 'Educação',
      encyclopedia: 'Enciclopédia',
      login: 'Login privado',
    },
  },
  {
    code: 'ru',
    bcp47: 'ru-RU',
    ogLocale: 'ru_RU',
    labelEn: 'Russian',
    endonym: 'Русский',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/ru',
    productionPath: '/ru',
    speakerRank: 9,
    direction: 'ltr',
    tier: 'regional-hub',
    regionalHubPath: '/regions/ru',
    heroHeadline: 'ClearPath Trader — терминал рыночной аналитики',
    heroLead: 'Живые графики, энциклопедия и обучение на одной платформе. Не брокер — аналитика и образование.',
    navInside: {
      charts: 'Графики',
      education: 'Обучение',
      encyclopedia: 'Энциклопедия',
      login: 'Private Login',
    },
  },
  {
    code: 'id',
    bcp47: 'id-ID',
    ogLocale: 'id_ID',
    labelEn: 'Indonesian',
    endonym: 'Bahasa Indonesia',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/id',
    productionPath: '/id',
    speakerRank: 10,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — terminal intelijen pasar',
    heroLead: 'Chart langsung, ensiklopedia, dan edukasi dalam satu situs. Analitik dan belajar — bukan broker.',
    navInside: {
      charts: 'Chart',
      education: 'Edukasi',
      encyclopedia: 'Ensiklopedia',
      login: 'Login pribadi',
    },
  },
  {
    code: 'ur',
    bcp47: 'ur-PK',
    ogLocale: 'ur_PK',
    labelEn: 'Urdu',
    endonym: 'اردو',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/ur',
    productionPath: '/ur',
    speakerRank: 11,
    direction: 'rtl',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — مارکیٹ تجزیہ ٹرمینل',
    heroLead: 'لائیو چارٹ، انسائیکلوپیڈیا اور تعلیم ایک سائٹ پر۔ بروکر نہیں — تجزیہ اور تعلیم۔',
    navInside: {
      charts: 'چارٹ',
      education: 'تعلیم',
      encyclopedia: 'انسائیکلوپیڈیا',
      login: 'نجی لاگ اِن',
    },
  },
  {
    code: 'de',
    bcp47: 'de-DE',
    ogLocale: 'de_DE',
    labelEn: 'German',
    endonym: 'Deutsch',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/de',
    productionPath: '/de',
    speakerRank: 12,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — Markt-Analyse-Terminal',
    heroLead: 'Live-Charts, Enzyklopädien und Bildung auf einer Seite. Analyse und Lernen — kein Broker.',
    navInside: {
      charts: 'Charts',
      education: 'Bildung',
      encyclopedia: 'Enzyklopädie',
      login: 'Privater Login',
    },
  },
  {
    code: 'ja',
    bcp47: 'ja-JP',
    ogLocale: 'ja_JP',
    labelEn: 'Japanese',
    endonym: '日本語',
    siteTitleNative: 'ClearPath トレーダー',
    mockPath: '/languages/ja',
    productionPath: '/ja',
    speakerRank: 13,
    direction: 'ltr',
    tier: 'regional-hub',
    regionalHubPath: '/regions/jp',
    heroHeadline: 'ClearPath トレーダー — マーケット分析ターミナル',
    heroLead: 'ライブチャート、百科事典、教育をひとつのサイトに。分析と学習 — ブローカーではありません。',
    navInside: {
      charts: 'チャート',
      education: '教育',
      encyclopedia: '百科',
      login: 'プライベートログイン',
    },
  },
  {
    code: 'sw',
    bcp47: 'sw-KE',
    ogLocale: 'sw_KE',
    labelEn: 'Swahili',
    endonym: 'Kiswahili',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/sw',
    productionPath: '/sw',
    speakerRank: 14,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — kituo cha uchambuzi wa soko',
    heroLead: 'Chati za moja kwa moja, ensaiklopidia na elimu kwenye tovuti moja. Sio dalali — uchambuzi na elimu.',
    navInside: {
      charts: 'Chati',
      education: 'Elimu',
      encyclopedia: 'Ensaiklopidia',
      login: 'Kuingia binafsi',
    },
  },
  {
    code: 'tl',
    bcp47: 'fil-PH',
    ogLocale: 'fil_PH',
    labelEn: 'Filipino / Tagalog',
    endonym: 'Filipino',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/tl',
    productionPath: '/tl',
    speakerRank: 15,
    direction: 'ltr',
    tier: 'regional-hub',
    regionalHubPath: '/regions/ph',
    heroHeadline: 'ClearPath Trader — terminal ng market intelligence',
    heroLead:
      'Live charts, encyclopedia, at edukasyon sa iisang site. Analytics at aral — hindi broker.',
    navInside: {
      charts: 'Charts',
      education: 'Edukasyon',
      encyclopedia: 'Encyclopedia',
      login: 'Private Login',
    },
  },
  {
    code: 'te',
    bcp47: 'te-IN',
    ogLocale: 'te_IN',
    labelEn: 'Telugu',
    endonym: 'తెలుగు',
    siteTitleNative: 'క్లియర్‌పాత్ ట్రేడర్',
    mockPath: '/languages/te',
    productionPath: '/te',
    speakerRank: 16,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'క్లియర్‌పాత్ ట్రేడర్ — మార్కెట్ విశ్లేషణ టర్మినల్',
    heroLead: 'లైవ్ చార్టులు, encyclopedia మరియు విద్య ఒకే సైట్‌లో. బ్రోకర్ కాదు — విశ్లేషణ మరియు విద్య.',
    navInside: {
      charts: 'చార్టులు',
      education: 'విద్య',
      encyclopedia: 'విజ్ఞానకోశం',
      login: 'ప్రైవేట్ లాగిన్',
    },
  },
  {
    code: 'tr',
    bcp47: 'tr-TR',
    ogLocale: 'tr_TR',
    labelEn: 'Turkish',
    endonym: 'Türkçe',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/tr',
    productionPath: '/tr',
    speakerRank: 17,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — piyasa analiz terminali',
    heroLead: 'Canlı grafikler, ansiklopedi ve eğitim tek sitede. Analiz ve öğrenme — aracı kurum değil.',
    navInside: {
      charts: 'Grafikler',
      education: 'Eğitim',
      encyclopedia: 'Ansiklopedi',
      login: 'Özel giriş',
    },
  },
  {
    code: 'ta',
    bcp47: 'ta-IN',
    ogLocale: 'ta_IN',
    labelEn: 'Tamil',
    endonym: 'தமிழ்',
    siteTitleNative: 'கிளியர் பாத் டிரேடர்',
    mockPath: '/languages/ta',
    productionPath: '/ta',
    speakerRank: 18,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'கிளியர் பாத் டிரேடர் — சந்தை பகுப்பாய்வு டெர்மினல்',
    heroLead: 'நேரடி விளக்கப்படங்கள், encyclopedia மற்றும் கல்வி ஒரே தளத்தில். தரகர் அல்ல — பகுப்பாய்வு மற்றும் கல்வி.',
    navInside: {
      charts: 'விளக்கப்படங்கள்',
      education: 'கல்வி',
      encyclopedia: 'அறிவுக்களஞ்சியம்',
      login: 'தனிப்பட்ட உள்நுழைவு',
    },
  },
  {
    code: 'vi',
    bcp47: 'vi-VN',
    ogLocale: 'vi_VN',
    labelEn: 'Vietnamese',
    endonym: 'Tiếng Việt',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/vi',
    productionPath: '/vi',
    speakerRank: 19,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — terminal phân tích thị trường',
    heroLead: 'Biểu đồ trực tiếp, bách khoa và đào tạo trên một trang. Phân tích và học tập — không phải sàn môi giới.',
    navInside: {
      charts: 'Biểu đồ',
      education: 'Đào tạo',
      encyclopedia: 'Bách khoa',
      login: 'Đăng nhập riêng',
    },
  },
  {
    code: 'ko',
    bcp47: 'ko-KR',
    ogLocale: 'ko_KR',
    labelEn: 'Korean',
    endonym: '한국어',
    siteTitleNative: 'ClearPath 트레이더',
    mockPath: '/languages/ko',
    productionPath: '/ko',
    speakerRank: 20,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath 트레이더 — 시장 분석 터미널',
    heroLead: '실시간 차트, 백과사전, 교육을 한 사이트에서. 분석과 학습 — 브로커가 아닙니다.',
    navInside: {
      charts: '차트',
      education: '교육',
      encyclopedia: '백과',
      login: '프라이빗 로그인',
    },
  },
  {
    code: 'it',
    bcp47: 'it-IT',
    ogLocale: 'it_IT',
    labelEn: 'Italian',
    endonym: 'Italiano',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/it',
    productionPath: '/it',
    speakerRank: 21,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — terminale di intelligence di mercato',
    heroLead: 'Grafici live, enciclopedie e formazione su un unico sito. Analisi e didattica — non siamo broker.',
    navInside: {
      charts: 'Grafici',
      education: 'Formazione',
      encyclopedia: 'Enciclopedia',
      login: 'Accesso privato',
    },
  },
  {
    code: 'th',
    bcp47: 'th-TH',
    ogLocale: 'th_TH',
    labelEn: 'Thai',
    endonym: 'ไทย',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/th',
    productionPath: '/th',
    speakerRank: 22,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — เทอร์มินัลวิเคราะห์ตลาด',
    heroLead: 'ชาร์ตสด สารานุกรม และการเรียนรู้ในเว็บเดียว วิเคราะห์และการศึกษา — ไม่ใช่โบรกเกอร์',
    navInside: {
      charts: 'ชาร์ต',
      education: 'การศึกษา',
      encyclopedia: 'สารานุกรม',
      login: 'เข้าสู่ระบบส่วนตัว',
    },
  },
  {
    code: 'pl',
    bcp47: 'pl-PL',
    ogLocale: 'pl_PL',
    labelEn: 'Polish',
    endonym: 'Polski',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/pl',
    productionPath: '/pl',
    speakerRank: 23,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — terminal analizy rynków',
    heroLead: 'Wykresy na żywo, encyklopedie i edukacja w jednym serwisie. Analiza i nauka — nie jesteśmy brokerem.',
    navInside: {
      charts: 'Wykresy',
      education: 'Edukacja',
      encyclopedia: 'Encyklopedia',
      login: 'Logowanie prywatne',
    },
  },
  {
    code: 'uk',
    bcp47: 'uk-UA',
    ogLocale: 'uk_UA',
    labelEn: 'Ukrainian',
    endonym: 'Українська',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/uk',
    productionPath: '/uk',
    speakerRank: 24,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — термінал ринкової аналітики',
    heroLead: 'Живі графіки, енциклопедія та навчання на одному сайті. Не брокер — аналітика та освіта.',
    navInside: {
      charts: 'Графіки',
      education: 'Навчання',
      encyclopedia: 'Енциклопедія',
      login: 'Приватний вхід',
    },
  },
  {
    code: 'nl',
    bcp47: 'nl-NL',
    ogLocale: 'nl_NL',
    labelEn: 'Dutch',
    endonym: 'Nederlands',
    siteTitleNative: 'ClearPath Trader',
    mockPath: '/languages/nl',
    productionPath: '/nl',
    speakerRank: 25,
    direction: 'ltr',
    tier: 'mock-shell',
    heroHeadline: 'ClearPath Trader — marktintelligentie-terminal',
    heroLead: 'Live charts, encyclopedieën en opleiding op één site. Analyse en leren — geen broker.',
    navInside: {
      charts: 'Charts',
      education: 'Opleiding',
      encyclopedia: 'Encyclopedie',
      login: 'Privé login',
    },
  },
];

export function getTop25Language(code: string): Top25Language | null {
  const key = code.toLowerCase().trim();
  return TOP_25_WORLD_LANGUAGES.find((l) => l.code === key) ?? null;
}

export function tierLabel(tier: LanguageMockTier): string {
  switch (tier) {
    case 'full-native':
      return 'English baseline';
    case 'regional-hub':
      return 'Regional hub live';
    case 'priority':
      return 'Priority full locale (Spanish next)';
    default:
      return 'Mock shell';
  }
}
