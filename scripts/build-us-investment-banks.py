#!/usr/bin/env python3
"""
ClearPathTrader — 2026 US Investment Bank Database Builder (founder ZIP).

Source: Advisory List state directories (public HTML).
Then each firm's official website is checked for a published contact email.

Honesty rules (do not weaken):
- Never invent an email. Blank is correct when none is published.
- Never scrape LinkedIn search, DMs, or Sales Navigator.
- Advisory List and many bank sites rate-limit (HTTP 429). Run locally,
  not from Cloud Run / this VM, if the directory returns a security checkpoint.

Usage:
  python3 scripts/build-us-investment-banks.py
  python3 scripts/build-us-investment-banks.py --states CA NY TX

Output:
  us_2026_investment_banks.csv
"""
from __future__ import annotations

import argparse
import csv
import re
import time
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urljoin, urlparse
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

DIRECTORY_BASE = "https://www.advisorylist.co/directory/investment-bankers/{slug}"
DEFAULT_OUT = Path("us_2026_investment_banks.csv")
HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml",
    "Accept-Language": "en-US,en;q=0.9",
}
EMAIL_RE = re.compile(r"[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}", re.I)
JUNK_PREFIXES = ("noreply", "no-reply", "donotreply", "mailer-daemon", "webmaster")
TRACKING_HOSTS = ("sentry.io", "wixpress.com", "example.com", "schema.org")

US_SLUGS = [
    "alabama", "alaska", "arizona", "arkansas", "california", "colorado",
    "connecticut", "delaware", "florida", "georgia", "hawaii", "idaho",
    "illinois", "indiana", "iowa", "kansas", "kentucky", "louisiana",
    "maine", "maryland", "massachusetts", "michigan", "minnesota",
    "mississippi", "missouri", "montana", "nebraska", "nevada",
    "new-hampshire", "new-jersey", "new-mexico", "new-york",
    "north-carolina", "north-dakota", "ohio", "oklahoma", "oregon",
    "pennsylvania", "rhode-island", "south-carolina", "south-dakota",
    "tennessee", "texas", "utah", "vermont", "virginia", "washington",
    "west-virginia", "wisconsin", "wyoming", "district-of-columbia",
    "u-s-virgin-islands",
]


class AnchorParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.hrefs: list[str] = []
        self._current: str | None = None
        self.texts: list[tuple[str, str]] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag != "a":
            return
        href = dict(attrs).get("href")
        if href:
            self._current = href
            self.hrefs.append(href)

    def handle_endtag(self, tag: str) -> None:
        if tag == "a":
            self._current = None

    def handle_data(self, data: str) -> None:
        if self._current and data.strip():
            self.texts.append((self._current, data.strip()))


def fetch(url: str, timeout: int = 30) -> str | None:
    req = Request(url, headers=HEADERS)
    try:
        with urlopen(req, timeout=timeout) as resp:
            return resp.read().decode("utf-8", errors="replace")
    except HTTPError as exc:
        print(f"  HTTP {exc.code} {url}")
    except URLError as exc:
        print(f"  URL error {exc.reason} {url}")
    return None


def company_links(html: str, page_url: str) -> list[tuple[str, str]]:
    parser = AnchorParser()
    parser.feed(html)
    seen: set[str] = set()
    out: list[tuple[str, str]] = []
    host = urlparse(page_url).netloc
    for href, text in parser.texts:
        if href.startswith("#") or href.startswith("mailto:"):
            continue
        abs_url = urljoin(page_url, href)
        parsed = urlparse(abs_url)
        if parsed.netloc == host:
            continue
        if parsed.scheme not in ("http", "https"):
            continue
        key = parsed.netloc.lower()
        if key in seen or len(text) < 2:
            continue
        seen.add(key)
        out.append((text[:160], abs_url))
    return out


def published_email(html: str, site_host: str) -> str:
    emails = EMAIL_RE.findall(html or "")
    host_root = site_host.lower().replace("www.", "")
    ranked: list[str] = []
    for raw in emails:
        email = raw.strip(".,;<>()[]{}\"' ").lower()
        local, _, domain = email.partition("@")
        if not domain or any(local.startswith(p) for p in JUNK_PREFIXES):
            continue
        if any(bad in domain for bad in TRACKING_HOSTS):
            continue
        if domain.endswith(host_root) or host_root.endswith(domain):
            ranked.insert(0, email)
        else:
            ranked.append(email)
    return ranked[0] if ranked else ""


def scrape_state(slug: str, sleep_s: float) -> list[dict[str, str]]:
    url = DIRECTORY_BASE.format(slug=slug)
    print(f"Directory {slug} …")
    html = fetch(url)
    if not html:
        return []
    if "Security Checkpoint" in html or "challenge" in html.lower()[:400]:
        print(f"  blocked by security checkpoint: {url}")
        return []
    rows: list[dict[str, str]] = []
    for name, website in company_links(html, url):
        time.sleep(sleep_s)
        site_html = fetch(website)
        host = urlparse(website).netloc
        email = published_email(site_html or "", host) if site_html else ""
        rows.append(
            {
                "company_name": name,
                "website": website,
                "contact_email": email,
                "state_or_territory": slug.replace("-", " ").title(),
                "source_url": url,
                "verified_2026": "yes" if email else "no",
            }
        )
        mark = email or "(blank — no published email)"
        print(f"  {name} → {mark}")
    return rows


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--states", nargs="*", help="Directory slugs (default: all US)")
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--sleep", type=float, default=1.2, help="Seconds between firm pages")
    args = parser.parse_args()
    slugs = args.states or US_SLUGS
    rows: list[dict[str, str]] = []
    for slug in slugs:
        rows.extend(scrape_state(slug, args.sleep))
        time.sleep(args.sleep)
    if not rows:
        print("No rows. Advisory List may be rate-limiting this network.")
        return 1
    fields = [
        "company_name",
        "website",
        "contact_email",
        "state_or_territory",
        "source_url",
        "verified_2026",
    ]
    args.out.write_text("", encoding="utf-8")
    with args.out.open("w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)
    emailed = sum(1 for row in rows if row["contact_email"])
    print(f"Wrote {args.out} — {len(rows)} firms, {emailed} published emails, {len(rows) - emailed} blank.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
