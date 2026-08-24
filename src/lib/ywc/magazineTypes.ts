export type MagazineCategory = 'automotive' | 'lifestyle' | 'tech' | 'science';

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
