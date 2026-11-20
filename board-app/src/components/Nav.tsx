"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/charts", label: "Charts" },
  { href: "/education", label: "Education" },
  { href: "/pricing", label: "Memberships" },
  { href: "/about", label: "About" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="container nav-row">
        <Link href="/" className="brand" aria-label="ClearPath Trader home">
          <span className="brand-name">ClearPath Trader</span>
          <span className="brand-sub">Clear Path Markets Science</span>
        </Link>
        <nav className="nav-links" aria-label="Primary">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={pathname === link.href || pathname.startsWith(`${link.href}/`) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/charts" className="nav-cta">
            Open desks
          </Link>
        </nav>
      </div>
    </header>
  );
}
