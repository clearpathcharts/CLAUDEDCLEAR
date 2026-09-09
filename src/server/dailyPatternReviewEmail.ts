/**
 * Founder email digest for overnight structure review.
 * Requires SMTP_HOST / SMTP_USER / SMTP_PASS on Cloud Run.
 */

import { FOUNDER_EMAIL } from "../lib/founder";
import { isSmtpConfigured, sendTransactionalEmail } from "./registrationEmail";
import type { DailyPatternReviewReport, SymbolReviewRow } from "./dailyPatternReviewTypes";
import type { MarketProphetsBriefSummary } from "./marketProphetsClient";

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
  return rows.filter((r) => r.status === "ok" && r.dailyPattern);
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
  const hits = labeledRows(report.rows).slice(0, 12);
  const mp = report.marketProphets;

  const subject = `ClearPath overnight structure · ${report.date} · ${report.labeled} labeled · ${report.unreadCount} unread`;

  const hitLines = hits.map((r) => {
    const p = r.dailyPattern!;
    return `· ${r.display}: ${p.label} (${p.direction}) — ${Math.round(p.confidence * 100)}%`;
  });

  const mpLines: string[] = [];
  if (mp?.source === "live") {
    mpLines.push(`Market Prophets (${mp.editionDate}): ${mp.headline}`);
    if (mp.summary) mpLines.push(mp.summary);
    for (const b of mp.bullets.slice(0, 4)) mpLines.push(`  • ${b}`);
    mpLines.push(`Read: ${mp.url}`);
  }

  const text = [
    `Overnight structure review — ${report.date} (Pacific)`,
    "",
    `Scanned: ${report.scanned} · Labeled: ${report.labeled} · Unavailable: ${report.unavailable}`,
    `Unread daily labels: ${report.unreadCount}`,
    "",
    hits.length ? "Top labeled daily structures:" : "No major daily labels this sweep.",
    ...hitLines,
    "",
    ...(mpLines.length ? ["— Market Prophets —", ...mpLines, ""] : []),
    report.disclaimer,
    "",
    `Open CEO inbox: ${site}/ceo`,
    "— ClearPath Trader (not a trade signal)",
  ].join("\n");

  const hitHtml = hits.length
    ? `<ul>${hits
        .map((r) => {
          const p = r.dailyPattern!;
          return `<li><strong>${escapeHtml(r.display)}</strong>: ${escapeHtml(p.label)} (${escapeHtml(p.direction)}) · ${Math.round(p.confidence * 100)}%</li>`;
        })
        .join("")}</ul>`
    : "<p>No major daily labels this sweep.</p>";

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
      <h1 style="color:#fbbf24;font-size:18px;">Overnight structure review</h1>
      <p style="color:#a1a1aa;">${escapeHtml(report.date)} · scanned ${report.scanned} · labeled ${report.labeled} · <strong style="color:#fbbf24;">${report.unreadCount} unread</strong></p>
      <h2 style="color:#fff;font-size:14px;">Daily labels</h2>
      ${hitHtml}
      ${mpHtml}
      <p style="color:#71717a;font-size:11px;margin-top:24px;">${escapeHtml(report.disclaimer)}</p>
      <p><a href="${escapeHtml(site)}/ceo" style="color:#22d3ee;">Open CEO inbox</a></p>
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
