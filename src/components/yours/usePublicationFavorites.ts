import { useCallback, useEffect, useState } from 'react';
import {
  FAVORITES_STORAGE_KEY,
  parseStoredFavorites,
  removeFavorite,
  upsertFavorite,
  type PublicationFavorite,
} from '../../lib/ywc/publicationHub';

export function usePublicationFavorites() {
  const [favs, setFavs] = useState<PublicationFavorite[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
      setFavs(parseStoredFavorites(raw ? JSON.parse(raw) : []));
    } catch {
      setFavs([]);
    }
  }, []);

  const persist = useCallback((next: PublicationFavorite[]) => {
    setFavs(next);
    try {
      window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  }, []);

  const add = useCallback(
    (fav: PublicationFavorite) => {
      persist(upsertFavorite(favs, fav));
    },
    [favs, persist],
  );

  const remove = useCallback(
    (id: string) => {
      persist(removeFavorite(favs, id));
    },
    [favs, persist],
  );

  const hasHomepage = useCallback(
    (homepage: string) => favs.some((f) => f.homepage === homepage),
    [favs],
  );

  return { favs, add, remove, hasHomepage };
}
