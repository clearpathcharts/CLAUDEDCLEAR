const cache = new Map<string, { data: any; expires: number }>();

export const CacheLayer = {
  get(key: string) {
    const item = cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expires) {
      cache.delete(key);
      return null;
    }

    return item.data;
  },

  set(key: string, data: any, ttl = 3000) {
    cache.set(key, {
      data,
      expires: Date.now() + ttl,
    });
  },
};
