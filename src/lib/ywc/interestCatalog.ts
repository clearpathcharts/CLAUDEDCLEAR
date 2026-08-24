/**
 * Founder-provided interest map for the Y.W.C. publication hub.
 * Starting homepages only — we do not scrape FeedSpot or getrssfeed.com.
 * Dating apps and official health/gov sites are bookmarks, not RSS fetches.
 * Health cards are information links, not medical advice.
 */
import type { AudienceAge, OrientationDesk, PoliticsDesk } from './magazineTypes';
import { parseFavoriteHomepage, type PublicationFavorite } from './publicationHub';

export type AgeBandId = '19-22' | '23-29' | '30-38' | '39-48' | '49-57' | '58-80';
export type InterestDeskId = 'everyone' | 'gay-men' | 'queer-women';
export type InterestSourceKind = 'publication' | 'official' | 'app' | 'social' | 'organization';

export type InterestSource = {
  id: string;
  name: string;
  homepage: string;
  kind: InterestSourceKind;
};

export type InterestAgent = {
  slug: string;
  name: string;
  watches: string;
  sources: InterestSource[];
};

export const AGE_BANDS: Array<{ id: AgeBandId; label: string; note: string }> = [
  { id: '19-22', label: '19–22', note: 'Early adult map — 35 interests' },
  { id: '23-29', label: '23–29', note: 'Same 35 interest names until a distinct URL list is pasted' },
  { id: '30-38', label: '30–38', note: 'Same 35 interest names until a distinct URL list is pasted' },
  { id: '39-48', label: '39–48', note: 'Same 35 interest names until a distinct URL list is pasted' },
  { id: '49-57', label: '49–57', note: 'Same 35 interest names until a distinct URL list is pasted' },
  { id: '58-80', label: '58–80', note: 'Later-life map — 35 interests' },
];

export const INTEREST_DESKS: Array<{ id: InterestDeskId; label: string }> = [
  { id: 'everyone', label: 'Everyone' },
  { id: 'gay-men', label: 'Gay men — 15 desks' },
  { id: 'queer-women', label: 'Lesbian / queer women — 15 desks' },
];

export const SOURCE_KIND_LABEL: Record<InterestSourceKind, string> = {
  publication: 'Magazine / news',
  official: 'Official site',
  app: 'App — their site',
  social: 'Social / directory',
  organization: 'Organization',
};

function s(
  id: string,
  name: string,
  homepage: string,
  kind: InterestSourceKind = 'publication',
): InterestSource {
  return { id, name, homepage, kind };
}

function agent(slug: string, name: string, watches: string, sources: InterestSource[]): InterestAgent {
  return { slug, name, watches, sources };
}

/** 35 master interests — 19–22 list (also used for 23–57 until those lists arrive). */
export const EARLY_ADULT_AGENTS: InterestAgent[] = [
  agent('ai', 'AI & AI Agents', 'AI tools, agents, new models, automation', [
    s('techcrunch', 'TechCrunch', 'https://techcrunch.com/'),
    s('theverge', 'The Verge', 'https://www.theverge.com/'),
  ]),
  agent('money', 'Money & Personal Finance', 'Saving, credit, budgeting, income', [
    s('nerdwallet', 'NerdWallet', 'https://www.nerdwallet.com/'),
    s('pennyhoarder', 'The Penny Hoarder', 'https://www.thepennyhoarder.com/'),
  ]),
  agent('investing', 'Investing & Stocks', 'Stocks, ETFs, market news', [
    s('yahoo-finance', 'Yahoo Finance', 'https://finance.yahoo.com/'),
    s('cnbc', 'CNBC', 'https://www.cnbc.com/markets/'),
  ]),
  agent('crypto', 'Crypto & Web3', 'Bitcoin, crypto, blockchain', [
    s('coindesk', 'CoinDesk', 'https://www.coindesk.com/'),
    s('cointelegraph', 'Cointelegraph', 'https://cointelegraph.com/'),
  ]),
  agent('cars', 'Cars & Automotive', 'New cars, modifications, reviews', [
    s('caranddriver', 'Car and Driver', 'https://www.caranddriver.com/'),
    s('motortrend', 'MotorTrend', 'https://www.motortrend.com/'),
  ]),
  agent('sneakers', 'Sneakers', 'Releases, resale, streetwear', [
    s('sneakernews', 'Sneaker News', 'https://sneakernews.com/'),
    s('hypebeast', 'Hypebeast', 'https://hypebeast.com/'),
  ]),
  agent('mens-fashion', "Men's Fashion", 'Clothing, streetwear, style', [
    s('gq', 'GQ', 'https://www.gq.com/'),
    s('fashionbeans', 'FashionBeans', 'https://www.fashionbeans.com/'),
  ]),
  agent('womens-fashion', "Women's Fashion", 'Trends, clothing, styling', [
    s('whowhatwear', 'Who What Wear', 'https://www.whowhatwear.com/'),
    s('elle', 'ELLE', 'https://www.elle.com/'),
  ]),
  agent('beauty', 'Beauty & Skincare', 'Makeup, skincare, beauty trends', [
    s('allure', 'Allure', 'https://www.allure.com/'),
    s('byrdie', 'Byrdie', 'https://www.byrdie.com/'),
  ]),
  agent('food', 'Food & Restaurants', 'Restaurants, recipes, viral food', [
    s('eater', 'Eater', 'https://www.eater.com/'),
    s('bonappetit', 'Bon Appétit', 'https://www.bonappetit.com/'),
  ]),
  agent('coffee', 'Coffee & Cafés', 'Coffee trends, shops, recipes', [
    s('sprudge', 'Sprudge', 'https://sprudge.com/'),
    s('pdg', 'Perfect Daily Grind', 'https://perfectdailygrind.com/'),
  ]),
  agent('gaming', 'Gaming', 'PC, console, releases, esports', [
    s('ign', 'IGN', 'https://www.ign.com/'),
    s('polygon', 'Polygon', 'https://www.polygon.com/'),
  ]),
  agent('esports', 'Esports', 'Competitive gaming, tournaments', [
    s('espn-esports', 'ESPN Esports', 'https://www.espn.com/esports/'),
    s('dotesports', 'Dot Esports', 'https://www.dotesports.com/'),
  ]),
  agent('anime', 'Anime & Manga', 'Anime releases, manga, fandom', [
    s('crunchyroll', 'Crunchyroll News', 'https://www.crunchyroll.com/news'),
    s('ann', 'Anime News Network', 'https://www.animenewsnetwork.com/'),
  ]),
  agent('movies', 'Movies & Cinema', 'New releases, trailers, reviews', [
    s('imdb', 'IMDb', 'https://www.imdb.com/', 'social'),
    s('variety', 'Variety', 'https://variety.com/'),
  ]),
  agent('tv', 'TV & Streaming', 'Netflix, Hulu, Max, Disney+', [
    s('thr', 'The Hollywood Reporter', 'https://www.hollywoodreporter.com/'),
    s('tvline', 'TVLine', 'https://tvline.com/'),
  ]),
  agent('music', 'Music', 'Releases, artists, genres', [
    s('billboard', 'Billboard', 'https://www.billboard.com/'),
    s('nme', 'NME', 'https://www.nme.com/'),
  ]),
  agent('concerts', 'Concerts & Live Events', 'Concerts, festivals, experiences', [
    s('eventbrite', 'Eventbrite', 'https://www.eventbrite.com/', 'social'),
    s('livenation', 'Live Nation', 'https://www.livenation.com/', 'social'),
  ]),
  agent('sports', 'Sports', 'Major sports and athletes', [
    s('espn', 'ESPN', 'https://www.espn.com/'),
    s('athletic', 'The Athletic', 'https://www.nytimes.com/athletic/'),
  ]),
  agent('fitness', 'Fitness & Gym', 'Workouts, lifting, training', [
    s('menshealth', "Men's Health", 'https://www.menshealth.com/'),
    s('womenshealth', "Women's Health", 'https://www.womenshealthmag.com/'),
  ]),
  agent('outdoor', 'Outdoor & Adventure', 'Hiking, camping, climbing', [
    s('outside', 'Outside', 'https://www.outsideonline.com/'),
    s('rei', 'REI Expert Advice', 'https://www.rei.com/learn/expert-advice'),
  ]),
  agent('travel', 'Travel', 'Destinations, cheap travel, experiences', [
    s('lonelyplanet', 'Lonely Planet', 'https://www.lonelyplanet.com/'),
    s('cntraveler', 'Condé Nast Traveler', 'https://www.cntraveler.com/'),
  ]),
  agent('college', 'College & Education', 'College life, scholarships, careers', [
    s('collegeboard', 'College Board', 'https://www.collegeboard.org/', 'official'),
    s('coursera', 'Coursera', 'https://www.coursera.org/', 'organization'),
  ]),
  agent('careers', 'Careers & Jobs', 'Jobs, internships, career advice', [
    s('linkedin', 'LinkedIn', 'https://www.linkedin.com/', 'social'),
    s('indeed', 'Indeed', 'https://www.indeed.com/', 'social'),
  ]),
  agent('hustles', 'Side Hustles & Entrepreneurship', 'Small businesses, freelancing', [
    s('shopify-blog', 'Shopify Blog', 'https://www.shopify.com/blog'),
    s('entrepreneur', 'Entrepreneur', 'https://www.entrepreneur.com/'),
  ]),
  agent('gadgets', 'Technology & Gadgets', 'Phones, computers, gadgets', [
    s('cnet', 'CNET', 'https://www.cnet.com/'),
    s('engadget', 'Engadget', 'https://www.engadget.com/'),
  ]),
  agent('social-trends', 'Social Media Trends', 'Viral trends, creators, memes', [
    s('tiktok', 'TikTok', 'https://www.tiktok.com/', 'social'),
    s('instagram', 'Instagram', 'https://www.instagram.com/', 'social'),
  ]),
  agent('memes', 'Memes & Internet Culture', 'Memes, viral culture, internet humor', [
    s('kym', 'Know Your Meme', 'https://knowyourmeme.com/'),
    s('reddit', 'Reddit', 'https://www.reddit.com/', 'social'),
  ]),
  agent('relationships', 'Relationships & Dating', 'Dating culture, relationships', [
    s('psychtoday', 'Psychology Today', 'https://www.psychologytoday.com/'),
    s('gottman', 'The Gottman Institute', 'https://www.gottman.com/', 'organization'),
  ]),
  agent('home', 'Home & Apartment Life', 'Dorms, apartments, décor', [
    s('apttherapy', 'Apartment Therapy', 'https://www.apartmenttherapy.com/'),
    s('ikea-ideas', 'IKEA Ideas', 'https://www.ikea.com/us/en/ideas/', 'social'),
  ]),
  agent('pets', 'Pets & Animals', 'Dogs, cats, pet care', [
    s('dodo', 'The Dodo', 'https://www.thedodo.com/'),
    s('petmd', 'PetMD', 'https://www.petmd.com/'),
  ]),
  agent('diy', 'DIY & Making', 'Building, crafts, repairs', [
    s('instructables', 'Instructables', 'https://www.instructables.com/'),
    s('makezine', 'Make:', 'https://makezine.com/'),
  ]),
  agent('photo', 'Photography & Video', 'Cameras, editing, creators', [
    s('petapixel', 'PetaPixel', 'https://petapixel.com/'),
    s('dpreview', 'DPReview', 'https://www.dpreview.com/'),
  ]),
  agent('books', 'Books, Comics & Reading', 'Books, comics, recommendations', [
    s('goodreads', 'Goodreads', 'https://www.goodreads.com/', 'social'),
    s('bookriot', 'Book Riot', 'https://bookriot.com/'),
  ]),
  agent('science', 'Science, Space & Future', 'Space, science, discoveries', [
    s('nasa', 'NASA', 'https://www.nasa.gov/', 'official'),
    s('popsci', 'Popular Science', 'https://www.popsci.com/'),
  ]),
];

/** 35 master interests — 58–80 list. */
export const LATER_LIFE_AGENTS: InterestAgent[] = [
  agent('retirement', 'Retirement & Retirement Income', 'Retirement planning, income, pensions', [
    s('fidelity-retire', 'Fidelity Retirement', 'https://www.fidelity.com/retirement-ira/overview', 'organization'),
  ]),
  agent('ssa', 'Social Security', 'Benefits, claiming, updates', [
    s('ssa', 'Social Security Administration', 'https://www.ssa.gov/', 'official'),
  ]),
  agent('medicare', 'Medicare & Healthcare Costs', 'Medicare, coverage, enrollment', [
    s('medicare', 'Medicare', 'https://www.medicare.gov/', 'official'),
  ]),
  agent('wealth', 'Investing & Wealth Preservation', 'Stocks, ETFs, bonds, portfolios', [
    s('yahoo-finance', 'Yahoo Finance', 'https://finance.yahoo.com/'),
  ]),
  agent('estate', 'Estate Planning & Legacy', 'Wills, trusts, inheritance', [
    s('aarp-money', 'AARP Money', 'https://www.aarp.org/money/'),
  ]),
  agent('taxes', 'Taxes & Tax Planning', 'Retirement taxes, deductions', [
    s('irs', 'IRS', 'https://www.irs.gov/', 'official'),
  ]),
  agent('realestate', 'Real Estate & Downsizing', 'Home values, selling, relocation', [
    s('redfin', 'Redfin', 'https://www.redfin.com/', 'social'),
  ]),
  agent('home-improve', 'Home Improvement', 'Remodeling, repairs, kitchens', [
    s('thisoldhouse', 'This Old House', 'https://www.thisoldhouse.com/'),
  ]),
  agent('garden', 'Gardening & Landscaping', 'Gardening, flowers, yards', [
    s('bhg-garden', 'Better Homes & Gardens Gardening', 'https://www.bhg.com/gardening/'),
  ]),
  agent('smarthome', 'Smart Home & Home Security', 'Cameras, alarms, accessibility', [
    s('cnet-smart', 'CNET Smart Home', 'https://www.cnet.com/home/smart-home/'),
  ]),
  agent('tech-gadgets', 'Technology & Gadgets', 'Phones, tablets, TVs, computers', [
    s('aarp-tech', 'AARP Technology', 'https://www.aarp.org/home-family/personal-technology/'),
  ]),
  agent('ai-later', 'AI & Artificial Intelligence', 'AI assistants, productivity, entertainment', [
    s('mit-tr', 'MIT Technology Review', 'https://www.technologyreview.com/'),
  ]),
  agent('travel-later', 'Travel & Vacations', 'Destinations, hotels, flights', [
    s('aarp-travel', 'AARP Travel', 'https://www.aarp.org/travel/'),
  ]),
  agent('bucket', 'International & Bucket-List Travel', 'Europe, Asia, cruises, culture', [
    s('cntraveler', 'Condé Nast Traveler', 'https://www.cntraveler.com/'),
  ]),
  agent('rv', 'Road Trips & RV Travel', 'RVs, road trips, camping, routes', [
    s('rvlife', 'RV Life', 'https://www.rvlife.com/'),
  ]),
  agent('cruises', 'Cruises', 'Cruise lines, ships, deals', [
    s('cruisecritic', 'Cruise Critic', 'https://www.cruisecritic.com/'),
  ]),
  agent('food-later', 'Food & Restaurants', 'Restaurants, chefs, dining', [
    s('eater', 'Eater', 'https://www.eater.com/'),
  ]),
  agent('cooking', 'Cooking & Recipes', 'Recipes, grilling, baking', [
    s('foodnetwork', 'Food Network', 'https://www.foodnetwork.com/'),
  ]),
  agent('wine', 'Wine, Whiskey & Beverage Culture', 'Wine, bourbon, tastings', [
    s('wineent', 'Wine Enthusiast', 'https://www.wineenthusiast.com/'),
  ]),
  agent('active-aging', 'Fitness & Active Aging', 'Walking, strength, mobility', [
    s('silversneakers', 'SilverSneakers', 'https://www.silversneakers.com/', 'organization'),
  ]),
  agent('nutrition', 'Nutrition & Healthy Aging', 'Nutrition, healthy eating, wellness', [
    s('eatingwell', 'EatingWell', 'https://www.eatingwell.com/'),
  ]),
  agent('longevity', 'Longevity & Preventative Wellness', 'Healthy aging, wellness information', [
    s('nia', 'National Institute on Aging', 'https://www.nia.nih.gov/', 'official'),
  ]),
  agent('sleep', 'Sleep & Recovery', 'Sleep quality, rest, recovery', [
    s('sleepfound', 'Sleep Foundation', 'https://www.sleepfoundation.org/', 'organization'),
  ]),
  agent('purpose', 'Mental Wellness & Purpose', 'Mindfulness, connection, staying sharp', [
    s('aarp-brain', 'AARP Staying Sharp', 'https://www.aarp.org/health/brain-health/'),
  ]),
  agent('golf', 'Golf', 'Courses, equipment, instruction', [
    s('golfdigest', 'Golf Digest', 'https://www.golfdigest.com/'),
  ]),
  agent('fishing', 'Fishing & Boating', 'Fishing, boats, lakes, ocean', [
    s('outdoorlife', 'Outdoor Life', 'https://www.outdoorlife.com/'),
  ]),
  agent('hiking', 'Hiking & Outdoor Recreation', 'Hiking, camping, parks', [
    s('rei', 'REI Expert Advice', 'https://www.rei.com/learn/expert-advice'),
  ]),
  agent('cars-later', 'Cars & Automotive', 'New cars, SUVs, maintenance, EVs', [
    s('motortrend', 'MotorTrend', 'https://www.motortrend.com/'),
  ]),
  agent('classics', 'Classic & Collector Cars', 'Classic vehicles, restoration, auctions', [
    s('hagerty', 'Hagerty', 'https://www.hagerty.com/'),
  ]),
  agent('family', 'Family & Grandchildren', 'Family activities, multigenerational life', [
    s('aarp-family', 'AARP Family', 'https://www.aarp.org/home-family/'),
  ]),
  agent('caregiving', 'Caregiving & Aging Parents', 'Caregiving resources, family support', [
    s('aarp-care', 'AARP Caregiving', 'https://www.aarp.org/caregiving/'),
  ]),
  agent('pets-later', 'Pets & Animal Companions', 'Dogs, cats, pet care', [
    s('dodo', 'The Dodo', 'https://www.thedodo.com/'),
  ]),
  agent('music-later', 'Music & Concerts', 'Artists, concerts, releases', [
    s('billboard', 'Billboard', 'https://www.billboard.com/'),
  ]),
  agent('screen-later', 'Movies, Television & Streaming', 'Movies, series, documentaries', [
    s('variety', 'Variety', 'https://variety.com/'),
  ]),
  agent('lifelong', 'Hobbies, Collecting & Lifelong Learning', 'Crafts, history, books, classes', [
    s('aarp', 'AARP', 'https://www.aarp.org/'),
  ]),
];

/** 15 gay-men desks. Dating apps are homepages only. */
export const GAY_MEN_AGENTS: InterestAgent[] = [
  agent('gm-news', "Gay Men's News & Culture", 'LGBTQ+ news, culture, community', [
    s('advocate', 'The Advocate', 'https://www.advocate.com/'),
  ]),
  agent('gm-fashion', "Gay Men's Fashion & Style", 'Menswear, streetwear, designers', [
    s('out-fashion', 'OUT', 'https://www.out.com/fashion'),
  ]),
  agent('gm-grooming', "Gay Men's Grooming & Beauty", 'Skincare, hair, grooming', [
    s('out-beauty', 'OUT', 'https://www.out.com/'),
  ]),
  agent('gm-dating', "Gay Men's Dating & Relationships", 'Dating and community apps — their site', [
    s('grindr', 'Grindr', 'https://www.grindr.com/', 'app'),
  ]),
  agent('gm-travel', "Gay Men's Travel", 'Destinations, resorts, travel', [
    s('gaytravel', 'GayTravel', 'https://www.gaytravel.com/'),
  ]),
  agent('gm-health', "Gay Men's Health & Wellness", 'Health education — not medical advice', [
    s('gmhc', 'GMHC', 'https://www.gmhc.org/', 'organization'),
  ]),
  agent('gm-fitness', "Gay Men's Fitness", 'Gym, training, inclusive wellness', [
    s('outwellness', 'OutWellness', 'https://outwellnessatx.com/', 'organization'),
  ]),
  agent('gm-entertainment', "Gay Men's Entertainment", 'Film, television, culture', [
    s('out-ent', 'OUT Entertainment', 'https://www.out.com/entertainment'),
  ]),
  agent('gm-sports', "Gay Men's Sports", 'Athletes, professional sports, inclusion', [
    s('outsports', 'Outsports', 'https://www.outsports.com/'),
  ]),
  agent('gm-food', "Gay Men's Food & Dining", 'Restaurants, chefs, food culture', [
    s('eater', 'Eater', 'https://www.eater.com/'),
  ]),
  agent('gm-business', "Gay Men's Business & Careers", 'Entrepreneurship, workplace', [
    s('nglcc', 'NGLCC', 'https://nglcc.org/', 'organization'),
  ]),
  agent('gm-money', "Gay Men's Money & Finance", 'Money, investing, planning', [
    s('aarp-money', 'AARP Money', 'https://www.aarp.org/money/'),
  ]),
  agent('gm-drag', "Gay Men's Drag & Nightlife", 'Drag, nightlife, performers', [
    s('out-drag', 'OUT', 'https://www.out.com/'),
  ]),
  agent('gm-books', "Gay Men's Books & Literature", 'LGBTQ+ authors, books', [
    s('lambda-lit', 'Lambda Literary', 'https://lambdaliterary.org/', 'organization'),
  ]),
  agent('gm-lifestyle', "Gay Men's Cars, Gear & Lifestyle", 'Cars, technology, lifestyle', [
    s('out', 'OUT', 'https://www.out.com/'),
  ]),
];

/** 15 lesbian / queer-women desks. Dating apps are homepages only. */
export const QUEER_WOMEN_AGENTS: InterestAgent[] = [
  agent('qw-news', 'Lesbian News & Culture', 'Lesbian news, culture, community', [
    s('autostraddle', 'Autostraddle', 'https://www.autostraddle.com/'),
  ]),
  agent('qw-fashion', "Queer Women's Fashion", 'Fashion, style, designers', [
    s('diva', 'DIVA', 'https://divamag.co.uk/'),
  ]),
  agent('qw-dating', 'Lesbian Dating & Relationships', 'Dating and community apps — their site', [
    s('her', 'HER', 'https://weareher.com/', 'app'),
  ]),
  agent('qw-travel', 'Lesbian Travel', 'Destinations, travel, events', [
    s('diva-travel', 'DIVA', 'https://divamag.co.uk/'),
  ]),
  agent('qw-health', "Queer Women's Health", 'Health information — not medical advice', [
    s('lgbtq-health', 'National Coalition for LGBTQ Health', 'https://healthlgbtq.org/', 'organization'),
  ]),
  agent('qw-fitness', "Queer Women's Fitness", 'Fitness, strength, wellness', [
    s('outwellness', 'OutWellness', 'https://outwellnessatx.com/', 'organization'),
  ]),
  agent('qw-beauty', "Queer Women's Beauty & Grooming", 'Skincare, hair, personal style', [
    s('them', 'Them', 'https://www.them.us/'),
  ]),
  agent('qw-entertainment', 'Lesbian Entertainment', 'Film, TV, representation', [
    s('them-ent', 'Them', 'https://www.them.us/'),
  ]),
  agent('qw-sports', "Queer Women's Sports", 'Athletes, sports, inclusion', [
    s('outsports', 'Outsports', 'https://www.outsports.com/'),
  ]),
  agent('qw-food', 'Lesbian Food & Dining', 'Restaurants, chefs, food culture', [
    s('eater', 'Eater', 'https://www.eater.com/'),
  ]),
  agent('qw-business', 'Queer Women in Business', 'Entrepreneurship, founders', [
    s('nglcc', 'NGLCC', 'https://nglcc.org/', 'organization'),
  ]),
  agent('qw-tech', "Queer Women's Careers & Technology", 'Technology, careers, networking', [
    s('lwt', 'Lesbians Who Tech', 'https://lesbianswhotech.org/', 'organization'),
  ]),
  agent('qw-books', 'Lesbian Books & Literature', 'Authors, books, publishing', [
    s('lambda-lit', 'Lambda Literary', 'https://lambdaliterary.org/', 'organization'),
  ]),
  agent('qw-family', "Queer Women's Family & Parenting", 'Parenting, adoption, family life', [
    s('familyeq', 'Family Equality', 'https://www.familyequality.org/', 'organization'),
  ]),
  agent('qw-community', "Queer Women's Community & Culture", 'Events, community, culture', [
    s('autostraddle-comm', 'Autostraddle', 'https://www.autostraddle.com/'),
  ]),
];

export function audienceAgeForBand(band: AgeBandId): AudienceAge {
  if (band === '19-22' || band === '23-29') return 'young-adult';
  if (band === '58-80' || band === '49-57') return 'fifty-plus';
  return 'adult';
}

export function orientationForDesk(desk: InterestDeskId): OrientationDesk {
  return desk === 'everyone' ? 'general' : 'lgbtq';
}

export function agentsFor(band: AgeBandId, desk: InterestDeskId): InterestAgent[] {
  if (desk === 'gay-men') return GAY_MEN_AGENTS;
  if (desk === 'queer-women') return QUEER_WOMEN_AGENTS;
  return band === '58-80' ? LATER_LIFE_AGENTS : EARLY_ADULT_AGENTS;
}

export function sourceHost(homepage: string): string {
  try {
    return new URL(homepage).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

export function allCatalogSources(): InterestSource[] {
  const lists = [EARLY_ADULT_AGENTS, LATER_LIFE_AGENTS, GAY_MEN_AGENTS, QUEER_WOMEN_AGENTS];
  const out: InterestSource[] = [];
  const seen = new Set<string>();
  for (const agents of lists) {
    for (const agentRow of agents) {
      for (const src of agentRow.sources) {
        const key = `${src.id}|${src.homepage}`;
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(src);
      }
    }
  }
  return out;
}

export function favoriteFromInterestSource(
  src: InterestSource,
  band: AgeBandId,
  desk: InterestDeskId,
): PublicationFavorite | null {
  const homepage = parseFavoriteHomepage(src.homepage);
  if (!homepage) return null;
  return {
    id: `fav:${src.id}`,
    title: src.name,
    homepage,
    audienceAge: audienceAgeForBand(band),
    orientation: orientationForDesk(desk),
    politics: 'nonpartisan' as PoliticsDesk,
    sourceId: src.id,
    addedAt: new Date().toISOString(),
  };
}

export function isFetchableKind(kind: InterestSourceKind): boolean {
  return kind === 'publication';
}
