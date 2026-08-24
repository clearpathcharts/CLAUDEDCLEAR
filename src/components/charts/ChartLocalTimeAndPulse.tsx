"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePageAutoUpdate } from "../../hooks/usePageAutoUpdate";

export const CHART_PULSE_INTERVALS = [5, 10, 15, 30] as const;
export type ChartPulseInterval = (typeof CHART_PULSE_INTERVALS)[number];
export type ChartPulseChannel = "email" | "sms";

type PulseStatus = {
  emailConfigured: boolean;
  smsConfigured: boolean;
  quoteConfigured: boolean;
  sessionEmail: string | null;
  subscriptions: Array<{
    slotId: string;
    intervalMinutes: number;
    channel: ChartPulseChannel;
    symbol: string;
  }>;
};

const CONTACT_KEY = "cpt-chart-pulse-contact";

type ContactPrefs = {
  channel: ChartPulseChannel;
  email: string;
  phone: string;
};

function readContact(): ContactPrefs {
  try {
    const raw = localStorage.getItem(CONTACT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ContactPrefs>;
      return {
        channel: parsed.channel === "sms" ? "sms" : "email",
        email: typeof parsed.email === "string" ? parsed.email : "",
        phone: typeof parsed.phone === "string" ? parsed.phone : "",
      };
    }
  } catch {
    /* ignore */
  }
  return { channel: "email", email: "", phone: "" };
}

function writeContact(prefs: ContactPrefs) {
  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(prefs));
  } catch {
    /* ignore */
  }
}

function armedKey(slotId: string) {
  return `cpt-chart-pulse-armed-${slotId}`;
}

function readArmed(slotId: string): ChartPulseInterval[] {
  try {
    const raw = localStorage.getItem(armedKey(slotId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((n): n is ChartPulseInterval =>
      CHART_PULSE_INTERVALS.includes(n as ChartPulseInterval),
    );
  } catch {
    return [];
  }
}

function writeArmed(slotId: string, intervals: ChartPulseInterval[]) {
  try {
    localStorage.setItem(armedKey(slotId), JSON.stringify(intervals));
  } catch {
    /* ignore */
  }
}

let statusCache: PulseStatus | null = null;
let statusInflight: Promise<PulseStatus | null> | null = null;

async function loadPulseStatus(force = false): Promise<PulseStatus | null> {
  if (!force && statusCache) return statusCache;
  if (!force && statusInflight) return statusInflight;
  statusInflight = fetch("/api/chart-pulse/status")
    .then(async (res) => {
      if (!res.ok) return null;
      const data = (await res.json()) as PulseStatus;
      statusCache = data;
      return data;
    })
    .catch(() => null)
    .finally(() => {
      statusInflight = null;
    });
  return statusInflight;
}

function formatLocalClock(now: Date): { time: string; zone: string } {
  const parts = new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
    timeZoneName: "short",
  }).formatToParts(now);
  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value || "";
  const zone = pick("timeZoneName") || Intl.DateTimeFormat().resolvedOptions().timeZone;
  const time = `${pick("hour")}:${pick("minute")}:${pick("second")} ${pick("dayPeriod")}`.trim();
  return { time, zone };
}

async function requestBrowserNotify(): Promise<boolean> {
  if (typeof window === "undefined" || typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const result = await Notification.requestPermission();
    return result === "granted";
  } catch {
    return false;
  }
}

function showBrowserPulse(symbol: string, interval: ChartPulseInterval) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  try {
    new Notification(`ClearPath · ${symbol} · ${interval}m`, {
      body: `Educational chart snapshot you asked for. Not a trade signal.`,
      tag: `cpt-pulse-${symbol}-${interval}`,
    });
  } catch {
    /* ignore */
  }
}

export function ChartLocalTimeAndPulse({
  slotId,
  symbol,
  compact = false,
}: {
  slotId: string;
  symbol: string | null;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => new Date());
  const [contact, setContact] = useState<ContactPrefs>(() =>
    typeof window === "undefined" ? { channel: "email", email: "", phone: "" } : readContact(),
  );
  const [armed, setArmed] = useState<ChartPulseInterval[]>(() =>
    typeof window === "undefined" ? [] : readArmed(slotId),
  );
  const [status, setStatus] = useState<PulseStatus | null>(statusCache);
  const [busy, setBusy] = useState<ChartPulseInterval | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const localTimers = useRef<Partial<Record<ChartPulseInterval, number>>>({});

  usePageAutoUpdate(() => {
    setNow(new Date());
  }, { intervalMs: 1_000 });

  const clock = useMemo(() => formatLocalClock(now), [now]);

  useEffect(() => {
    writeContact(contact);
  }, [contact]);

  useEffect(() => {
    writeArmed(slotId, armed);
  }, [slotId, armed]);

  useEffect(() => {
    let cancelled = false;
    void loadPulseStatus().then((data) => {
      if (cancelled || !data) return;
      setStatus(data);
      if (data.sessionEmail && !contact.email) {
        setContact((prev) => ({ ...prev, email: prev.email || data.sessionEmail || "" }));
      }
      const fromServer = data.subscriptions
        .filter((s) => s.slotId === slotId)
        .map((s) => s.intervalMinutes)
        .filter((n): n is ChartPulseInterval => CHART_PULSE_INTERVALS.includes(n as ChartPulseInterval));
      if (fromServer.length) setArmed(Array.from(new Set(fromServer)));
    });
    return () => {
      cancelled = true;
    };
    // slotId only — contact.email is patched when status arrives
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotId]);

  const clearLocalTimer = useCallback((interval: ChartPulseInterval) => {
    const id = localTimers.current[interval];
    if (id) {
      window.clearInterval(id);
      delete localTimers.current[interval];
    }
  }, []);

  const armLocalTimer = useCallback(
    (interval: ChartPulseInterval, sym: string) => {
      clearLocalTimer(interval);
      localTimers.current[interval] = window.setInterval(() => {
        showBrowserPulse(sym, interval);
      }, interval * 60_000);
    },
    [clearLocalTimer],
  );

  useEffect(() => {
    const sym = (symbol || "").trim().toUpperCase();
    for (const interval of CHART_PULSE_INTERVALS) {
      if (armed.includes(interval) && sym) armLocalTimer(interval, sym);
      else clearLocalTimer(interval);
    }
    return () => {
      for (const interval of CHART_PULSE_INTERVALS) clearLocalTimer(interval);
    };
  }, [armed, symbol, armLocalTimer, clearLocalTimer]);

  const toggleInterval = async (interval: ChartPulseInterval) => {
    const sym = (symbol || "").trim().toUpperCase();
    if (!sym) {
      setHint("Load a symbol on this chart first.");
      return;
    }
    const turningOff = armed.includes(interval);
    setBusy(interval);
    setHint(null);
    try {
      if (turningOff) {
        await fetch("/api/chart-pulse/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slotId,
            intervalMinutes: interval,
            channel: contact.channel,
          }),
        });
        setArmed((prev) => prev.filter((n) => n !== interval));
        clearLocalTimer(interval);
        setHint(`${interval}m pulse off.`);
        return;
      }

      if (contact.channel === "email" && !contact.email.trim() && !status?.sessionEmail) {
        setHint("Enter the email that should receive this pulse.");
        return;
      }
      if (contact.channel === "sms" && !contact.phone.trim()) {
        setHint("Enter a phone with country code (e.g. +15551234567).");
        return;
      }

      await requestBrowserNotify();
      const res = await fetch("/api/chart-pulse/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId,
          symbol: sym,
          intervalMinutes: interval,
          channel: contact.channel,
          email: contact.email,
          phone: contact.phone,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setHint(typeof data.error === "string" ? data.error : "Could not arm this pulse.");
        return;
      }
      setArmed((prev) => (prev.includes(interval) ? prev : [...prev, interval]));
      setHint(typeof data.message === "string" ? data.message : `${interval}m pulse armed.`);
      void loadPulseStatus(true).then((next) => next && setStatus(next));
    } catch {
      setHint("Network error — pulse not changed.");
    } finally {
      setBusy(null);
    }
  };

  const tzId = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div
      className="flex flex-col gap-1.5 min-w-0 w-full"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        <div
          className={`flex items-center gap-1.5 rounded-md border border-[#D4AF37]/70 bg-[#D4AF37]/10 px-2 py-1 shrink-0 ${
            compact ? "min-w-[118px]" : "min-w-[148px]"
          }`}
          title={`Your local time (${tzId})`}
          aria-live="polite"
        >
          <span className="text-[8px] font-black uppercase tracking-widest text-[#D4AF37]/80">
            Local
          </span>
          <time
            className={`font-mono font-bold tabular-nums text-[#F5D76E] ${
              compact ? "text-[10px]" : "text-[11px]"
            }`}
            dateTime={now.toISOString()}
          >
            {clock.time}
          </time>
          <span className="text-[8px] font-mono uppercase tracking-wider text-[#D4AF37]/70">
            {clock.zone}
          </span>
        </div>

        {CHART_PULSE_INTERVALS.map((interval) => {
          const on = armed.includes(interval);
          return (
            <button
              key={interval}
              type="button"
              disabled={busy === interval}
              onClick={() => void toggleInterval(interval)}
              title={
                symbol
                  ? `Push a ${contact.channel === "sms" ? "text" : "email"} snapshot every ${interval} minutes`
                  : "Load a symbol first"
              }
              className={`rounded-md border px-2 py-1 font-mono font-black uppercase tracking-wider transition-colors ${
                compact ? "text-[9px] min-w-[36px]" : "text-[10px] min-w-[42px]"
              } ${
                on
                  ? "border-rose-400 bg-rose-600/80 text-white shadow-[0_0_10px_rgba(244,63,94,0.45)]"
                  : "border-rose-500/70 bg-rose-950/40 text-rose-200 hover:bg-rose-900/50"
              } disabled:opacity-50`}
              aria-pressed={on}
            >
              {interval}m
            </button>
          );
        })}

        <div className="flex items-center rounded-md overflow-hidden border border-white/15 shrink-0">
          {(["email", "sms"] as const).map((ch) => (
            <button
              key={ch}
              type="button"
              onClick={() => setContact((prev) => ({ ...prev, channel: ch }))}
              className={`px-2 py-1 font-black uppercase tracking-wider ${
                compact ? "text-[8px]" : "text-[9px]"
              } ${
                contact.channel === ch
                  ? "bg-rose-600 text-white"
                  : "bg-black/40 text-zinc-400 hover:text-zinc-200"
              }`}
              aria-pressed={contact.channel === ch}
            >
              {ch === "email" ? "Email" : "Text"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 min-w-0">
        {contact.channel === "email" ? (
          <input
            type="email"
            value={contact.email}
            onChange={(e) => setContact((prev) => ({ ...prev, email: e.target.value }))}
            placeholder={status?.sessionEmail || "email for pulses"}
            aria-label="Email for chart pulses"
            className="min-w-[140px] flex-1 bg-black/60 border border-rose-500/30 rounded-md px-2 py-0.5 font-mono text-[10px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-400/40"
          />
        ) : (
          <input
            type="tel"
            value={contact.phone}
            onChange={(e) => setContact((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="+1 phone for texts"
            aria-label="Phone for chart text pulses"
            className="min-w-[140px] flex-1 bg-black/60 border border-rose-500/30 rounded-md px-2 py-0.5 font-mono text-[10px] text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-rose-400/40"
          />
        )}
        <span className="text-[8px] font-mono text-zinc-500 leading-tight">
          {status
            ? contact.channel === "email"
              ? status.emailConfigured
                ? "Email ready"
                : "SMTP unset — browser alert while this tab is open"
              : status.smsConfigured
                ? "Text ready"
                : "Twilio unset — browser alert while this tab is open"
            : "Educational snapshot · not a trade signal"}
        </span>
      </div>
      {hint && (
        <p className="text-[8px] font-mono text-rose-300/90 leading-tight" role="status">
          {hint}
        </p>
      )}
    </div>
  );
}
