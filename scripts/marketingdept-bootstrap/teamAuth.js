/**
 * In-house team accounts (Brent / Dustin / Brian / owner).
 * Passwords come ONLY from Cloud Run env — never commit secrets.
 *
 * TEAM_USERS format (comma-separated):
 *   brent:password1:member,dustin:password2:member,brian:password3:member,owner:password4:owner
 *
 * Or individual vars:
 *   TEAM_BRENT_PASSWORD / TEAM_DUSTIN_PASSWORD / TEAM_BRIAN_PASSWORD / TEAM_OWNER_PASSWORD
 */
import crypto from "crypto";

const COOKIE_NAME = "cpac_auth";
const SESSION_HOURS = 12;

function clean(v) {
  return String(v || "").trim();
}

/** @returns {{ username: string, password: string, role: 'owner'|'member' }[]} */
export function loadTeamUsers() {
  const fromList = clean(process.env.TEAM_USERS);
  if (fromList) {
    return fromList
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const [username, password, roleRaw] = part.split(":");
        const role = roleRaw === "owner" ? "owner" : "member";
        return {
          username: clean(username).toLowerCase(),
          password: password || "",
          role,
        };
      })
      .filter((u) => u.username && u.password);
  }

  const users = [];
  const named = [
    ["brent", process.env.TEAM_BRENT_PASSWORD, "member"],
    ["dustin", process.env.TEAM_DUSTIN_PASSWORD, "member"],
    ["brian", process.env.TEAM_BRIAN_PASSWORD, "member"],
    ["owner", process.env.TEAM_OWNER_PASSWORD || process.env.APP_PASSWORD, "owner"],
  ];
  for (const [username, password, role] of named) {
    if (clean(password)) {
      users.push({ username, password: clean(password), role });
    }
  }
  return users;
}

export function findUser(username, password) {
  const u = clean(username).toLowerCase();
  const p = String(password || "");
  return loadTeamUsers().find((row) => row.username === u && row.password === p) || null;
}

export function teamAuthConfigured() {
  return loadTeamUsers().length > 0 && Boolean(clean(process.env.SESSION_SECRET));
}

export function listPublicRoster() {
  return loadTeamUsers().map((u) => ({
    username: u.username,
    role: u.role,
  }));
}

export function makeSessionToken(username, role, secret) {
  const expires = String(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const payload = `${expires}|${username}|${role}`;
  const sig = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifySessionToken(token, secret) {
  if (!token || !secret) return null;
  const lastDot = token.lastIndexOf(".");
  if (lastDot <= 0) return null;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expected = crypto.createHmac("sha256", secret).update(payload).digest("hex");
  try {
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  } catch {
    return null;
  }
  const [expires, username, role] = payload.split("|");
  if (!expires || !username || Number(expires) <= Date.now()) return null;
  return {
    username,
    role: role === "owner" ? "owner" : "member",
    expiresAt: Number(expires),
  };
}

export function parseCookies(req) {
  const header = req.headers.cookie || "";
  const out = {};
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function sessionCookieHeader(token) {
  return [
    `${COOKIE_NAME}=${encodeURIComponent(token)}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
    `Max-Age=${SESSION_HOURS * 60 * 60}`,
    "Path=/",
  ].join("; ");
}

export function clearSessionCookieHeader() {
  return `${COOKIE_NAME}=; HttpOnly; Secure; SameSite=Lax; Max-Age=0; Path=/`;
}

export { COOKIE_NAME, SESSION_HOURS };
