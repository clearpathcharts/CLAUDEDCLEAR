import { Link, NavLink } from "react-router-dom";
import { Sparkles } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-violet-500/20 bg-black/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <Sparkles className="w-5 h-5 text-violet-400 group-hover:text-violet-300" />
            <span className="font-semibold tracking-tight text-lg">
              Market <span className="text-violet-400">Prophets</span>
            </span>
          </Link>
          <nav className="flex items-center gap-4 text-sm text-zinc-400">
            <NavLink to="/brief/latest" className={({ isActive }) => (isActive ? "text-violet-300" : "hover:text-white")}>
              Today
            </NavLink>
            <NavLink to="/archive" className={({ isActive }) => (isActive ? "text-violet-300" : "hover:text-white")}>
              Archive
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">{children}</main>

      <footer className="border-t border-white/5 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 text-xs text-zinc-500 space-y-2 leading-relaxed">
          <p>
            <strong className="text-zinc-400">Market Prophets</strong> publishes AI-assisted summaries built from public
            news and policy feeds. Each claim links to a source where possible.
          </p>
          <p>
            <strong className="text-zinc-400">Not investment advice.</strong> For education and general information only.
            Past headlines do not predict future returns.
          </p>
          <p className="text-zinc-600">© {new Date().getFullYear()} Market Prophets · marketprophets.io</p>
        </div>
      </footer>
    </div>
  );
}
