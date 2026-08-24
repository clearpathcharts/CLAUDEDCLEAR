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

export type MagazineRackPayload = {
  fetchedAt: string;
  publications: Array<{
    id: string;
    name: string;
    homepage: string;
    category: MagazineCategory;
  }>;
  items: MagazineStory[];
};
