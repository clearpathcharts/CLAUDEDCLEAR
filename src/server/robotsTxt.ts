/**
 * Single robots.txt body — Express serves this in prod; public/robots.txt is the static fallback.
 * Keep both in sync by importing this string (server) and mirroring content in public/.
 */
export const ROBOTS_TXT = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /auth/
Disallow: /login
Disallow: /dashboard

# Multi-engine: Google, Bing, Yahoo, DuckDuckGo, Yandex, Brave, Ecosia, Qwant, Naver, Baidu
Sitemap: https://clearpathtrader.com/sitemap.xml
Host: clearpathtrader.com
`;
