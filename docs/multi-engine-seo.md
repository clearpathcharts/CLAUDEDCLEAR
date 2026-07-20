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

## Priority follower markets

| Market | Engines | Language | First assets |
|---|---|---|---|
| Russia / CIS | Yandex, Google, Bing | `ru-RU` | RU hub + Yandex.Webmaster |
| China | Baidu, Bing | `zh-CN` | ZH hub + Baidu Zhanzhang |
| Japan (Tokyo) | Google, Yahoo Japan, Bing | `ja-JP` | JA learn/guides |
| Philippines | Google, Bing | `fil-PH` + EN | Bilingual PH community pages |

## IndexNow (wired in app)

1. Set `INDEXNOW_KEY` in `.env` (8–128 chars: `a-z` `A-Z` `0-9` `-` `_`), **or** rely on a key derived from `SESSION_SECRET` / `CATALOG_ADMIN_SECRET`.
2. The server serves `https://clearpathtrader.com/{key}.txt` containing the key.
3. Submit URLs (admin):

```bash
curl -X POST https://clearpathtrader.com/api/seo/indexnow \
  -H "x-catalog-admin-secret: $CATALOG_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"urls":["https://clearpathtrader.com/learn","https://clearpathtrader.com/guides"]}'
```

Also: `GET /api/seo/indexnow/status` (boolean presence only — never leaks the key).

Participating notify targets: `api.indexnow.org` (Bing ecosystem) and `yandex.com/indexnow`.

## Operator checklist (this week)

1. Verify Google Search Console property + sitemap `https://clearpathtrader.com/sitemap.xml`
2. Verify Bing Webmaster Tools + enable IndexNow key file
3. Create **Yandex.Webmaster** for Russia following
4. Create **Baidu Zhanzhang** for China following (plan ZH landing — EN alone will not convert Baidu share)
5. Publish 1 thick regional hub each: `/learn` cluster or dedicated locale hubs when ready
6. After every pillar/guide publish → `POST /api/seo/indexnow` with the new URLs
7. Keep Blogspot / Thinkific / guest articles linking to **canonical clearpathtrader.com** URLs

## What not to do

- Do not add empty `/ru` `/zh` `/ja` URL trees to the sitemap until real translated content exists
- Do not expect IndexNow to replace Google Search Console
- Do not chase Naver/Baidu with English-only thin encyclopedia pages
