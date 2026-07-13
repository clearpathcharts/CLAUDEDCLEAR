import { OPTIMISTIC_INJUSTICE_ARTICLE } from '../components/yours/OptimisticInjustice';
import type { YwcNewsCard } from '../lib/ywc/feedMappers';

/** Minimal offline fallback when RSS digest is unavailable. */
export const YWC_FALLBACK_NEWS: YwcNewsCard[] = [
  {
    id: OPTIMISTIC_INJUSTICE_ARTICLE.id,
    category: OPTIMISTIC_INJUSTICE_ARTICLE.category,
    subcategory: OPTIMISTIC_INJUSTICE_ARTICLE.subcategory,
    title: OPTIMISTIC_INJUSTICE_ARTICLE.title,
    premium: OPTIMISTIC_INJUSTICE_ARTICLE.premium,
    source: OPTIMISTIC_INJUSTICE_ARTICLE.source,
    image: OPTIMISTIC_INJUSTICE_ARTICLE.image,
    time: OPTIMISTIC_INJUSTICE_ARTICLE.time,
    desc: OPTIMISTIC_INJUSTICE_ARTICLE.desc,
    longText: OPTIMISTIC_INJUSTICE_ARTICLE.longText,
  },
];
