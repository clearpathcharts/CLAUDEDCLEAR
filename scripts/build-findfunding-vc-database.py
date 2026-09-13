"""Refresh the open findfunding.vc US VC extract (public emails only).

Run: python3 scripts/build-findfunding-vc-database.py
Then convert the CSV into src/server/usInvestorRosterFindfunding.ts.
Does not invent emails. Placeholders like name@ are dropped in the TS import.
"""
import csv, json, re, urllib.request
from urllib.parse import urlparse

API = "https://www.findfunding.vc/api/firms"
OUT = "us_active_vc_database.csv"

def clean_url(url):
    if not url:
        return ""
    if url.startswith("http://") or url.startswith("https://"):
        return url
    return "https://" + url

def is_email(value):
    return bool(re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", value.strip()))

def normalize_contact(contact):
    if not contact:
        return ""
    # Keep only an actual public email. Contact forms/LinkedIn/warm-intro text are excluded.
    m = re.search(r'[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', contact)
    return m.group(0).lower() if m else ""

print("Downloading the current open VC dataset...")
with urllib.request.urlopen(API, timeout=60) as r:
    data = json.load(r)

firms = data.get("firms", [])
rows = []
seen = set()

for f in firms:
    location = (f.get("location") or "").strip()
    # The public dataset uses U.S. state names for U.S. firms and Canadian provinces
    # for Canadian firms. Exclude obvious non-U.S. records.
    us_states = {
        "Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut",
        "Delaware","District of Columbia","Florida","Georgia","Hawaii","Idaho","Illinois",
        "Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts",
        "Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada",
        "New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota",
        "Ohio","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina",
        "South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington",
        "West Virginia","Wisconsin","Wyoming"
    }
    if location not in us_states:
        continue

    # "verified" is the dataset's current verification flag.
    if not f.get("verified", False):
        continue

    name = (f.get("name") or "").strip()
    website = clean_url((f.get("website") or "").strip())
    email = normalize_contact(f.get("contact") or "")

    # User requested company-level public contact info.
    if not email:
        continue

    key = (name.lower(), website.lower(), email.lower())
    if key in seen:
        continue
    seen.add(key)

    rows.append({
        "company_name": name,
        "website": website,
        "contact_email": email,
        "state": location,
        "investment_stage": "; ".join(f.get("primaryStage") or []),
        "sector": "; ".join(f.get("specialization") or []),
        "firm_type": f.get("generalistSpecialist") or "",
        "2026_source": f.get("url") or ""
    })

rows.sort(key=lambda x: x["company_name"].lower())

with open(OUT, "w", newline="", encoding="utf-8-sig") as fh:
    writer = csv.DictWriter(fh, fieldnames=[
        "company_name","website","contact_email","state",
        "investment_stage","sector","firm_type","2026_source"
    ])
    writer.writeheader()
    writer.writerows(rows)

print(f"Finished: {len(rows)} verified U.S. VC firms with public email addresses.")
print(f"Created: {OUT}")
