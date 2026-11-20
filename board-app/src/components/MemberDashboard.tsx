"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DESKS, DESK_IDS, type DeskId, isDeskId } from "@/lib/desks";

type State = {
  name: string;
  email: string;
  simulated: boolean;
  preferredDesk: DeskId;
  watchlist: { symbol: string; label: string }[];
  storage: string;
  error?: string;
};

export function MemberDashboard() {
  const [state, setState] = useState<State | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    const res = await fetch("/api/me", { cache: "no-store" });
    const data = await res.json();
    if (!res.ok && !data.viewer) {
      setState({
        name: "Signed out",
        email: "",
        simulated: false,
        preferredDesk: "retail",
        watchlist: [],
        storage: data.storage ?? "memory",
        error: "No viewer identity yet — publish as private/team for Cursor sign-in.",
      });
      return;
    }
    setState({
      name: data.viewer?.name ?? "Member",
      email: data.viewer?.email ?? "",
      simulated: Boolean(data.viewer?.simulated),
      preferredDesk: isDeskId(data.preferredDesk) ? data.preferredDesk : "retail",
      watchlist: data.watchlist ?? [],
      storage: data.storage ?? "memory",
    });
  }

  useEffect(() => {
    void refresh();
  }, []);

  async function saveDesk(preferredDesk: DeskId) {
    setBusy(true);
    try {
      await fetch("/api/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ preferredDesk }),
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function removeSymbol(symbol: string) {
    setBusy(true);
    try {
      await fetch(`/api/watchlist?symbol=${encodeURIComponent(symbol)}`, { method: "DELETE" });
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  if (!state) {
    return <p style={{ color: "var(--text-muted)" }}>Loading member state…</p>;
  }

  return (
    <div className="dash-grid">
      <section className="panel">
        <h2>Viewer</h2>
        <p style={{ margin: "0 0 0.35rem", fontSize: "1.2rem" }}>{state.name}</p>
        <p style={{ margin: 0, color: "var(--text-muted)" }}>{state.email || "—"}</p>
        <p style={{ marginTop: "0.75rem" }}>
          <span className="status-chip">
            {state.simulated ? "SIMULATED LOCAL VIEWER" : "CURSOR IDENTITY"}
          </span>{" "}
          <span className="status-chip">STORAGE {state.storage.toUpperCase()}</span>
        </p>
        {state.error ? (
          <p style={{ color: "var(--brand)", marginTop: "0.85rem" }}>{state.error}</p>
        ) : null}

        <h3 style={{ marginTop: "1.5rem" }}>Preferred desk</h3>
        <div className="desk-switch">
          {DESK_IDS.map((id) => (
            <button
              key={id}
              type="button"
              disabled={busy}
              aria-pressed={state.preferredDesk === id}
              onClick={() => void saveDesk(id)}
            >
              {DESKS[id].title}
              <span className="tone">{DESKS[id].tagline}</span>
            </button>
          ))}
        </div>
        <p style={{ marginTop: "1rem" }}>
          <Link className="btn btn-primary" href={`/charts?desk=${state.preferredDesk}`}>
            Open preferred desk
          </Link>
        </p>
      </section>

      <section className="panel">
        <h2>Watchlist</h2>
        <ul className="watch-list">
          {state.watchlist.length === 0 ? (
            <li style={{ fontFamily: "var(--font-body)", color: "var(--text-dim)" }}>
              Empty — add symbols from the Charts workspace search.
            </li>
          ) : (
            state.watchlist.map((item) => (
              <li key={item.symbol}>
                <Link href="/charts">{item.symbol}</Link>
                <button
                  type="button"
                  className="remove"
                  disabled={busy}
                  onClick={() => void removeSymbol(item.symbol)}
                >
                  Remove
                </button>
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
