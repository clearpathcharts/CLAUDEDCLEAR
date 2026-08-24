export type MagazineCategory = 'automotive' | 'lifestyle' | 'tech' | 'science' | 'news';

/** Who the magazine is written for — not a person's age. */
export type AudienceAge = 'all-ages' | 'young-adult' | 'adult' | 'fifty-plus';

/** Press desk, not a dating profile. */
export type OrientationDesk = 'general' | 'lgbtq';

export type PoliticsDesk = 'nonpartisan' | 'left' | 'center' | 'right';

export type MagazineStory = {
  id: string;
  title: string;
  snippet: string;
  image: string | null;
  publishedAt: string;
  source: string;
  sourceId: string;
  category: MagazineCategory;
  homepage: string;
  articleUrl: string;
};

export type MagazinePublicationCard = {
  id: string;
  name: string;
  homepage: string;
  category: MagazineCategory;
  audienceAge: AudienceAge;
  orientation: OrientationDesk;
  politics: PoliticsDesk;
};

export type MagazineShelf = {
  publication: MagazinePublicationCard;
  items: MagazineStory[];
};

export type MagazineRackPayload = {
  fetchedAt: string;
  publications: MagazinePublicationCard[];
  items: MagazineStory[];
  shelves: MagazineShelf[];
};
