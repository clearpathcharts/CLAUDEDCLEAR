CLEARPATHTRADER — 2026 U.S. INVESTMENT BANK DATABASE

This package builds the investment-banking database in the same style as the VC database.

Coverage:
- All 50 U.S. states
- District of Columbia
- U.S. Virgin Islands
- Current 2026 state directories
- Official website verification
- Public business email discovery
- No invented email addresses
- No private/personal LinkedIn scraping

Primary public directory source:
https://www.advisorylist.co/directory/investment-bankers/

The current directory has state-by-state investment-banker listings. For example,
the current Alabama page lists 6 firms and the California page lists 81 firms.

OUTPUT:
us_2026_investment_banks.csv

Columns:
company_name
website
contact_email
state_or_territory
source_url
verified_2026

IMPORTANT:
A blank contact_email means the firm's official site was reachable but a public
email was not found. The firm is retained rather than deleted.

The script does NOT guess addresses such as info@company.com.

WINDOWS / LOCAL:
1. Install Python 3.10+ and `pip install requests beautifulsoup4`.
2. From this folder, run BUILD_INVESTMENT_BANKS.bat or:
     python3 scripts/ib-database-builder/build_investment_banks.py
   Stdlib fallback (no pip): python3 scripts/build-us-investment-banks.py
3. Advisory List may return HTTP 429 (Vercel checkpoint) from some networks.
   Run it on a home/office connection, not Cloud Run.
4. Import the CSV (blank emails stay blank — that is correct):
     python3 scripts/import-us-investment-banks-csv.py us_2026_investment_banks.csv

The script uses only publicly accessible business information.
