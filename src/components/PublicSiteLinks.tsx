import React from 'react';

/** Shared footer links for public identity pages (company, leadership, press, founder). */
export default function PublicSiteLinks() {
  const linkClass =
    'text-[#00E5FF] hover:text-white transition-colors text-xs uppercase tracking-widest font-mono';

  return (
    <nav
      className="flex flex-wrap gap-x-4 gap-y-2 justify-center pt-6 border-t border-white/10"
      aria-label="Company and site links"
    >
      <a href="/" className={linkClass}>
        Home
      </a>
      <a href="/about" className={linkClass}>
        About
      </a>
      <a href="/company" className={linkClass}>
        Company
      </a>
      <a href="/meet-the-board" className={linkClass}>
        Meet the Board
      </a>
      <a href="/press" className={linkClass}>
        Press kit
      </a>
      <a href="/founder" className={linkClass}>
        Founder
      </a>
      <a href="/accessibility" className={linkClass}>
        Accessibility
      </a>
      <a
        href="https://www.instagram.com/clearpathtrader"
        className={linkClass}
        rel="noopener noreferrer"
        target="_blank"
      >
        Instagram
      </a>
    </nav>
  );
}
