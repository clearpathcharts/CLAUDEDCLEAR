/**
 * Founder email digest — sent only after CEO publishes a briefing.
 */

import { FOUNDER_EMAIL } from "../lib/founder";
import { isSmtpConfigured, sendTransactionalEmail } from "./registrationEmail";
import type { DailyPatternReviewReport, SymbolReviewRow } from "./dailyPatternReviewTypes";
import type { MarketProphetsBriefSummary } from "./marketProphetsClient";
import { slotLabel } from "./dailyPatternReviewSchedule";

export type DigestEmailResult = {
  sent: boolean;
  to?: string;
  reason?: string;
};

export function dailyPatternReviewRecipient(): string {
  return (
    (process.env.DAILY_PATTERN_REVIEW_EMAIL || "").trim() ||
    FOUNDER_EMAIL ||
    (process.env.ADMIN_NOTIFY_EMAIL || "").trim()
  );
}

function siteBaseUrl(): string {
  return (process.env.SITE_URL || "https://clearpathtrader.com").replace(/\/$/, "");
}

function labeledRows(rows: SymbolReviewRow[]): SymbolReviewRow[] {
  return rows.filter((r) => r.status === "ok" && (r.dailyPattern || r.weeklyPattern));
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildDailyPatternReviewDigest(report: DailyPatternReviewReport): {
  subject: string;
  html: string;
  text: string;
} {
  const site = siteBaseUrl();
  const hits = labeledRows(report.rows).slice(0, 15);
  const mp = report.marketProphets;

  const subject = `ClearPath daily briefing · ${report.date} · ${slotLabel(report.slot)} · ${report.labeled} labeled`;

  const hitLines = hits.map((r) => {
    const d = r.dailyPattern ? `daily ${r.dailyPattern.label}` : "daily —";
    const w = r.weeklyPattern ? `weekly ${r.weeklyPattern.label}` : "weekly —";
    return `· ${r.display}: ${w} · ${d}`;
  });

  const mpLines: string[] = [];
  if (mp?.source === "live") {
    mpLines.push(`Market Prophets (${mp.editionDate}): ${mp.headline}`);
    if (mp.summary) mpLines.push(mp.summary);
    for (const b of mp.bullets.slice(0, 4)) mpLines.push(`  • ${b}`);
    mpLines.push(`Read: ${mp.url}`);
  }

  const text = [
    `Daily structure briefing — ${report.date} · ${slotLabel(report.slot)} (ET)`,
    "",
    report.scannerNote,
    "",
    `Scanned: ${report.scanned} · Labeled: ${report.labeled} · Unavailable: ${report.unavailable}`,
    "",
    hits.length ? "Weekly + daily labels:" : "No major weekly/daily labels this sweep.",
    ...hitLines,
    "",
    ...(mpLines.length ? ["— Market Prophets (free media) —", ...mpLines, ""] : []),
    report.trainingPricingNote,
    "",
    report.disclaimer,
    "",
    `CEO review desk: ${site}/ceo`,
  ].join("\n");

  const hitHtml = hits.length
    ? `<ul>${hits
        .map((r) => {
          const d = r.dailyPattern
            ? `${escapeHtml(r.dailyPattern.label)} (${escapeHtml(r.dailyPattern.direction)})`
            : "—";
          const w = r.weeklyPattern
            ? `${escapeHtml(r.weeklyPattern.label)} (${escapeHtml(r.weeklyPattern.direction)})`
            : "—";
          return `<li><strong>${escapeHtml(r.display)}</strong><br/>Weekly: ${w}<br/>Daily: ${d}</li>`;
        })
        .join("")}</ul>`
    : "<p>No major weekly/daily labels this sweep.</p>";

  const mpHtml =
    mp?.source === "live"
      ? `<h3 style="color:#fbbf24;">Market Prophets · ${escapeHtml(mp.editionDate)}</h3>
         <p><strong>${escapeHtml(mp.headline)}</strong></p>
         ${mp.summary ? `<p>${escapeHtml(mp.summary)}</p>` : ""}
         ${mp.bullets.length ? `<ul>${mp.bullets.slice(0, 4).map((b) => `<li>${escapeHtml(b)}</li>`).join("")}</ul>` : ""}
         <p><a href="${escapeHtml(mp.url)}">Read on marketprophets.io</a></p>`
      : "";

  const html = `
    <div style="font-family:monospace;background:#0a0a0f;color:#e4e4e7;padding:24px;max-width:640px;">
      <h1 style="color:#fbbf24;font-size:18px;">Daily structure briefing</h1>
      <p style="color:#a1a1aa;">${escapeHtml(report.date)} · ${escapeHtml(slotLabel(report.slot))}</p>
      <p style="color:#cbd5e1;font-size:12px;">${escapeHtml(report.scannerNote)}</p>
      <h2 style="color:#fff;font-size:14px;">Weekly + daily labels</h2>
      ${hitHtml}
      ${mpHtml}
      <p style="color:#a78bfa;font-size:11px;margin-top:16px;">${escapeHtml(report.trainingPricingNote)}</p>
      <p style="color:#71717a;font-size:11px;margin-top:16px;">${escapeHtml(report.disclaimer)}</p>
      <p><a href="${escapeHtml(site)}/ceo" style="color:#22d3ee;">CEO review desk</a></p>
    </div>`;

  return { subject, html, text };
}

export async function sendDailyPatternReviewDigest(
  report: DailyPatternReviewReport,
  deps?: {
    sendEmail?: (payload: { to: string; subject: string; html: string; text: string }) => Promise<boolean>;
  },
): Promise<DigestEmailResult> {
  const enabled = (process.env.DAILY_PATTERN_REVIEW_EMAIL_ENABLED || "1").toLowerCase();
  if (enabled === "0" || enabled === "false" || enabled === "off") {
    return { sent: false, reason: "email_disabled" };
  }

  const to = dailyPatternReviewRecipient();
  if (!to.includes("@")) return { sent: false, reason: "no_recipient" };
  if (!isSmtpConfigured()) return { sent: false, reason: "smtp_not_configured", to };

  const send = deps?.sendEmail ?? sendTransactionalEmail;
  const payload = buildDailyPatternReviewDigest(report);
  const ok = await send({ to, ...payload });
  return ok ? { sent: true, to } : { sent: false, reason: "send_failed", to };
}

export function marketProphetsUnavailableSummary(): MarketProphetsBriefSummary {
  const base = (process.env.MARKET_PROPHETS_URL || "https://marketprophets.io").replace(/\/$/, "");
  return {
    editionDate: "",
    headline: "Market Prophets brief not reachable",
    summary: "DATA UNAVAILABLE — configure MARKET_PROPHETS_URL or publish an edition on marketprophets.io.",
    bullets: [],
    url: base,
    source: "unavailable",
  };
}
