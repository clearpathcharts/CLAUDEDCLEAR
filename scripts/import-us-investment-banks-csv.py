#!/usr/bin/env python3
"""Convert a local Advisory List CSV into src/server/usInvestorRosterIb.ts.

Usage:
  python3 scripts/build-us-investment-banks.py
  python3 scripts/import-us-investment-banks-csv.py us_2026_investment_banks.csv

Honesty:
  - Blank contact_email stays blank.
  - Placeholders like name@ are dropped.
  - Identical firm names / websites collapse later in getInvestorCatalog().
"""
from __future__ import annotations

import argparse
import csv
import re
from pathlib import Path
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "src" / "server" / "usInvestorRosterIb.ts"
PLACEHOLDER = re.compile(r"^name@", re.I)
EMAIL_OK = re.compile(r"^[^@\s]+@[^@\s]+\.[A-Za-z]{2,}$")


def slug(name: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "", name.lower())
    return (s[:40] or "firm")


def host_of(url: str) -> str:
    try:
        return urlparse(url).hostname.replace("www.", "").lower()  # type: ignore[union-attr]
    except Exception:
        return url.lower()


def load_csv(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as fh:
        return list(csv.DictReader(fh))


def rows_from_csv(path: Path) -> list[str]:
    seen_id: set[str] = set()
    seen_host: set[str] = set()
    out: list[str] = []
    for raw in load_csv(path):
        name = (raw.get("company_name") or raw.get("name") or "").strip()
        website = (raw.get("website") or "").strip()
        email = (raw.get("contact_email") or raw.get("email") or "").strip().lower()
        if not name or not website:
            continue
        if not website.startswith("https://"):
            if website.startswith("http://"):
                website = "https://" + website[len("http://") :]
            else:
                website = "https://" + website
        host = host_of(website)
        if not host or host in seen_host:
            continue
        seen_host.add(host)
        ident = f"al_{slug(name)}"
        n = 2
        while ident in seen_id:
            ident = f"al_{slug(name)}{n}"
            n += 1
        seen_id.add(ident)
        if email and (PLACEHOLDER.search(email) or not EMAIL_OK.match(email)):
            email = ""
        line = f"{ident}|{name}|ib|{website}||{email}".rstrip("|")
        if line.endswith("||"):
            line = line[:-2]
        out.append(line)
    out.sort(key=lambda line: line.split("|", 2)[1].lower())
    return out


def splice(csv_path: Path) -> int:
    lines = rows_from_csv(csv_path)
    text = TARGET.read_text(encoding="utf-8")
    start = text.find("export const ADVISORY_IB_CSV")
    if start < 0:
        raise SystemExit(f"ADVISORY_IB_CSV missing in {TARGET}")
    block = "export const ADVISORY_IB_CSV = `\n" + "\n".join(lines) + "\n`.trim();\n"
    TARGET.write_text(text[:start] + block, encoding="utf-8")
    emailed = sum(1 for line in lines if line.count("|") >= 5 and "@" in line.split("|")[-1])
    print(f"Wrote {len(lines)} Advisory List IBs ({emailed} published emails) into {TARGET}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("csv", type=Path, help="us_2026_investment_banks.csv")
    args = parser.parse_args()
    if not args.csv.is_file():
        raise SystemExit(f"CSV not found: {args.csv}")
    return splice(args.csv)


if __name__ == "__main__":
    raise SystemExit(main())
