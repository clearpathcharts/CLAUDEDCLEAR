"""
ClearPathTrader — 2026 U.S. Investment Banking Database Builder

Goal:
  Build a backend-ready CSV of active investment-banking / M&A advisory firms
  located in every U.S. state + DC + U.S. Virgin Islands.

Output:
  us_2026_investment_banks.csv

Fields:
  company_name, website, contact_email, state_or_territory, source_url, verified_2026

Method:
  1. Collect firms from the current state-by-state Advisory List directory.
  2. Visit each firm's public website.
  3. Find an official contact email only when it is actually published.
  4. Check that the official domain responds.
  5. Deduplicate.
  6. Do NOT invent email addresses.

Notes:
  - "Active 2026" here means the firm is present in the current 2026 directory
    and its official website is reachable at collection time.
  - A blank email means no public email was found; the row is retained so the
    database does not silently discard a real firm.
  - This script does not scrape private LinkedIn data or personal email addresses.
"""

import csv, re, time, sys
from urllib.parse import urljoin, urlparse, quote
import requests
from bs4 import BeautifulSoup

BASE = "https://www.advisorylist.co/directory/investment-bankers/"
STATES = [
    "alabama","alaska","arizona","arkansas","california","colorado","connecticut",
    "delaware","district-of-columbia","florida","georgia","hawaii","idaho","illinois",
    "indiana","iowa","kansas","kentucky","louisiana","maine","maryland","massachusetts",
    "michigan","minnesota","mississippi","missouri","montana","nebraska","nevada",
    "new-hampshire","new-jersey","new-mexico","new-york","north-carolina","north-dakota",
    "ohio","oklahoma","oregon","pennsylvania","rhode-island","south-carolina",
    "south-dakota","tennessee","texas","utah","vermont","virginia","washington",
    "west-virginia","wisconsin","wyoming","u-s-virgin-islands"
]
DISPLAY = {
    "district-of-columbia":"District of Columbia",
    "u-s-virgin-islands":"U.S. Virgin Islands"
}
DISPLAY.update({s.replace("-"," ").title(): s.replace("-"," ").title() for s in STATES})

HEADERS = {
    "User-Agent":"ClearPathTrader-Research/2026 (+public-business-directory research)"
}
EMAIL_RE = re.compile(r'(?i)\b[A-Z0-9._%+\-]+@[A-Z0-9.\-]+\.[A-Z]{2,}\b')

# Generic inboxes are preferred over individual employee addresses.
GENERIC_PREFIXES = (
    "info","contact","hello","office","inquiries","inquiry","admin",
    "team","businessdevelopment","bd","transactions","capital","advisory"
)

def clean_text(s):
    return re.sub(r"\s+", " ", s or "").strip()

def absolute(u, base_url):
    if not u: return ""
    return urljoin(base_url, u)

def normalize_site(u):
    if not u: return ""
    u = u.strip()
    if not u.startswith(("http://","https://")):
        u = "https://" + u
    p = urlparse(u)
    return f"{p.scheme}://{p.netloc}/"

def same_domain(a,b):
    return urlparse(a).netloc.lower().lstrip("www.") == urlparse(b).netloc.lower().lstrip("www.")

def get(url, timeout=20):
    try:
        return requests.get(url, headers=HEADERS, timeout=timeout, allow_redirects=True)
    except Exception:
        return None

def extract_emails(html):
    if not html: return []
    soup = BeautifulSoup(html, "html.parser")
    found = set(EMAIL_RE.findall(soup.get_text(" ")))
    for a in soup.select('a[href^="mailto:"]'):
        x = a.get("href","")[7:].split("?")[0].strip()
        if EMAIL_RE.fullmatch(x):
            found.add(x)
    return sorted(found, key=lambda e: (
        0 if e.split("@")[0].lower() in GENERIC_PREFIXES else 1,
        len(e)
    ))

def likely_contact_links(soup, site):
    words = ("contact","about","team","leadership","services","investment","banking")
    links = []
    for a in soup.find_all("a", href=True):
        label = clean_text(a.get_text(" ")).lower()
        href = absolute(a["href"], site)
        if href.startswith(("mailto:","tel:")): continue
        if same_domain(href, site) and any(w in (label+" "+href.lower()) for w in words):
            links.append(href)
    # preserve order, dedupe
    out=[]
    for x in links:
        if x not in out: out.append(x)
    return out[:15]

def discover_email(site):
    r = get(site)
    if not r or r.status_code >= 400:
        return "", False
    final = normalize_site(r.url)
    soup = BeautifulSoup(r.text, "html.parser")
    emails = extract_emails(r.text)
    if emails:
        return emails[0], True

    for link in likely_contact_links(soup, final):
        rr = get(link)
        if not rr or rr.status_code >= 400: continue
        emails = extract_emails(rr.text)
        if emails:
            return emails[0], True
        time.sleep(0.15)
    return "", True

def parse_directory_page(state):
    url = BASE + state
    r = get(url)
    if not r or r.status_code >= 400:
        return []
    soup = BeautifulSoup(r.text, "html.parser")
    rows=[]
    # Advisory List pages expose firm cards/links. Capture links whose URL
    # points away from the directory and appears to be a firm profile.
    seen=set()
    for a in soup.find_all("a", href=True):
        href = absolute(a["href"], url)
        label = clean_text(a.get_text(" "))
        if not label or len(label) < 2: continue
        if "advisorylist.co" not in urlparse(href).netloc:
            continue
        # Firm detail links generally sit below the directory path.
        if "/directory/investment-bankers/" in href and href.rstrip("/") != url.rstrip("/"):
            key=(label.lower(),href)
            if key not in seen:
                seen.add(key)
                rows.append((label, href))
    return rows

def parse_firm_profile(profile_url):
    r=get(profile_url)
    if not r or r.status_code >= 400:
        return None
    soup=BeautifulSoup(r.text,"html.parser")
    text=clean_text(soup.get_text(" "))
    # Look for an external official website.
    site=""
    for a in soup.find_all("a", href=True):
        href=absolute(a["href"],profile_url)
        host=urlparse(href).netloc.lower()
        if host and "advisorylist.co" not in host and href.startswith(("http://","https://")):
            if not any(x in host for x in ("facebook.","linkedin.","instagram.","x.com","twitter.","youtube.")):
                site=normalize_site(href)
                break
    name=""
    h=soup.find(["h1","h2"])
    if h: name=clean_text(h.get_text(" "))
    if not name:
        name=clean_text(soup.title.get_text(" ")) if soup.title else ""
        name=re.split(r"\s+[|–-]\s+",name)[0]
    return name, site

def main():
    firms={}
    print("Collecting current 2026 investment-banking firms by state...")
    for i,state in enumerate(STATES,1):
        print(f"[{i}/{len(STATES)}] {state}")
        for label, profile in parse_directory_page(state):
            p=parse_firm_profile(profile)
            if not p: continue
            name,site=p
            if not site: continue
            key=(name.lower(),site.lower())
            firms[key]={
                "company_name":name,
                "website":site,
                "state_or_territory":DISPLAY.get(state,state),
                "source_url":profile
            }
            time.sleep(0.1)

    print(f"Found {len(firms)} firm profiles. Verifying official websites and public emails...")
    output=[]
    for n,item in enumerate(firms.values(),1):
        email, reachable=discover_email(item["website"])
        item["contact_email"]=email
        item["verified_2026"]="yes" if reachable else "no"
        output.append(item)
        if n % 25 == 0:
            print(f"Processed {n}/{len(firms)}")
        time.sleep(0.15)

    output.sort(key=lambda x:(x["state_or_territory"],x["company_name"].lower()))
    with open("us_2026_investment_banks.csv","w",newline="",encoding="utf-8-sig") as f:
        w=csv.DictWriter(f,fieldnames=[
            "company_name","website","contact_email",
            "state_or_territory","source_url","verified_2026"
        ])
        w.writeheader()
        w.writerows(output)

    print(f"Done. Wrote {len(output)} firms to us_2026_investment_banks.csv")

if __name__=="__main__":
    main()
