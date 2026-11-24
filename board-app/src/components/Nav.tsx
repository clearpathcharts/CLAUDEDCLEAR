"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { usePathname } from "next/navigation";

/** Website-style command menu — keeps the front screen clean. */
const MENU = [
  { href: "/", label: "HOME", section: "Work" },
  { href: "/charts", label: "CHARTS", section: "Work" },
  { href: "/ywc", label: "Y.W.C. — YOUR WORLD CONNECTED", section: "Work" },
  { href: "/education", label: "CLEARPATH EDUCATION", section: "Learn" },
  { href: "/pricing", label: "PLANS / MEMBERSHIPS", section: "Account" },
  { href: "/dashboard", label: "DASHBOARD", section: "Account" },
  { href: "/about", label: "ABOUT", section: "Account" },
] as const;

const SECTIONS = ["Work", "Learn", "Account"] as const;

export function Nav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const panelId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <header className="site-header">
      <div className="container nav-row nav-row-clean">
        <Link href="/" className="brand" aria-label="Clear Path Trader home">
          <span className="brand-text">
            <span className="brand-name">Clear Path Trader</span>
            <span className="brand-sub">Clear Path Markets Science</span>
          </span>
          <img
            src="/clearpath-flame.png"
            alt=""
            className="brand-flame"
            width={40}
            height={40}
          />
        </Link>

        <div className="nav-actions">
          <Link href="/charts" className="nav-cta nav-cta-compact">
            Charts
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="menu-toggle-bars" aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
            <span className="menu-toggle-label">MENU</span>
          </button>
        </div>
      </div>

      {open ? (
        <div className="app-menu-layer" role="presentation">
          <button
            type="button"
            className="app-menu-backdrop"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <nav id={panelId} className="app-menu-panel" aria-label="Site menu">
            <div className="app-menu-head">
              <p className="eyebrow">ClearCloud menu</p>
              <button type="button" className="app-menu-close" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            {SECTIONS.map((section) => (
              <div key={section} className="app-menu-section">
                <h2>{section}</h2>
                <ul>
                  {MENU.filter((item) => item.section === section).map((item) => {
                    const current =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          aria-current={current ? "page" : undefined}
                          onClick={() => setOpen(false)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
            <a
              className="app-menu-external"
              href="https://clearpathtrader.com/"
              rel="noopener noreferrer"
              target="_blank"
            >
              Open full ClearCloud →
            </a>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
