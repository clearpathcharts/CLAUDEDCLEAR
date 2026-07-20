# Multi-engine SEO — ClearPath global markets

ClearPath already ships ~30k indexable URLs. Ranking across **all** major engines (not just Google) needs engine-specific webmaster tools **plus** regional language for markets where you already have followers.

## Engine roster

| # | Engine | How ClearPath notifies / ranks |
|---|---|---|
| 1 | Google | Search Console + sitemaps + EEAT (no IndexNow) |
| 2 | Bing | Bing Webmaster + **IndexNow** |
| 3 | Yahoo Search | Largely Bing index → IndexNow / Bing Webmaster |
| 4 | DuckDuckGo | Bing-influenced + brand/Wikipedia signals |
| 5 | Baidu | **Baidu Zhanzhang** + Simplified Chinese content |
| 6 | Yandex | **Yandex.Webmaster** + IndexNow + Russian content |
| 7 | Naver | Naver Search Advisor + Korean ecosystem (expand when KR is prioritized) |
| 8 | Brave Search | Quality pages + Brave Search submissions |
| 9 | Ecosia | Bing-based → IndexNow |
| 10 | Qwant | EU / Bing-influenced → IndexNow |

## Live regional hubs (shipped)

| Market | URL | Language |
|---|---|---|
| Index | https://clearpathtrader.com/regions | EN |
| Russia / CIS | https://clearpathtrader.com/regions/ru | `ru-RU` |
| China | https://clearpathtrader.com/regions/cn | `zh-CN` |
| Japan (Tokyo) | https://clearpathtrader.com/regions/jp | `ja-JP` |
| Philippines | https://clearpathtrader.com/regions/ph | `fil-PH` |

On boot the server IndexNow-pings these hubs when `INDEXNOW_KEY` / `SESSION_SECRET` / `CATALOG_ADMIN_SECRET` is available.

## IndexNow (wired in app)

1. Set `INDEXNOW_KEY` in `.env` (8–128 chars: `a-z` `A-Z` `0-9` `-` `_`), **or** rely on a key derived from `SESSION_SECRET` / `CATALOG_ADMIN_SECRET`.
2. The server serves `https://clearpathtrader.com/{key}.txt` containing the key.
3. Submit URLs (admin):

```bash
curl -X POST https://clearpathtrader.com/api/seo/indexnow \
  -H "x-catalog-admin-secret: $CATALOG_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://clearpathtrader.com/learn","https://clearpathtrader.com/guides","https://clearpathtrader.com/regions/ru"]}'
```

Also: `GET /api/seo/indexnow/status` (boolean presence only — never leaks the key).

Participating notify targets: `api.indexnow.org` (Bing ecosystem) and `yandex.com/indexnow`.

## Independent Contractor badge

Seeded emails (auto-queued on server boot): `dawnhobson@aol.com`, `barry.nicholl@hotmail.com`.

Manual grant:

```bash
curl -X POST https://clearpathtrader.com/api/admin/profiles/contractor-badge/seed \
  -H "x-catalog-admin-secret: $CATALOG_ADMIN_SECRET"
```

## Operator checklist (you still do these in browser)

1. Google Search Console + sitemap `https://clearpathtrader.com/sitemap.xml`
2. Bing Webmaster Tools + IndexNow key file
3. **Yandex.Webmaster** (Russia)
4. **Baidu Zhanzhang** (China)
5. Share regional hub links with each audience (social → `/regions/{id}`)
6. After every pillar/guide publish → IndexNow ping
7. Keep Blogspot / Thinkific / guest articles linking to **canonical clearpathtrader.com** URLs

## What not to do

- Do not invent empty `/ru` `/zh` bare locale trees — use `/regions/{id}` until full translations exist
- Do not expect IndexNow to replace Google Search Console
- Do not chase Naver/Baidu with English-only thin encyclopedia pages
