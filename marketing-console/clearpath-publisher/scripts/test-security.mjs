/**
 * Security self-test: boots the console on a random port with outbound OFF and checks
 * dispatch kill switch, roster, path stripping, allowlists, upload MIME, media headers.
 * Run: node scripts/test-security.mjs
 */
import assert from "assert";
import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const PORT = 18000 + Math.floor(Math.random() * 1000);
const SECRET = "s".repeat(40);
const base = `http://127.0.0.1:${PORT}`;

const env = {
  ...process.env,
  PORT: String(PORT),
  HOST: "127.0.0.1",
  TEAM_USERS: "tester:test-password-1:owner",
  SESSION_SECRET: SECRET,
  ALLOW_OUTBOUND_DISPATCH: "",
};
const child = spawn(process.execPath, ["server.js"], { cwd: root, env, stdio: ["ignore", "pipe", "pipe"] });
let logs = "";
child.stdout.on("data", (d) => (logs += d));
child.stderr.on("data", (d) => (logs += d));

async function waitUp() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(`${base}/api/health`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("server did not start:\n" + logs);
}

try {
  await waitUp();
  const { makeSessionToken } = await import("../lib/teamAuth.js");
  const cookie = `cpac_auth=${encodeURIComponent(makeSessionToken("tester", "owner", SECRET))}`;
  const json = { cookie, "content-type": "application/json" };

  const health = await (await fetch(`${base}/api/health`)).json();
  assert.equal(health.outboundEnabled, false);

  const roster = await (await fetch(`${base}/api/auth/roster`)).json();
  assert.deepEqual(Object.keys(roster), ["configured"]);

  const created = await fetch(`${base}/api/queue`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({
      id: "t1",
      title: "x",
      caption: "y",
      calm: true,
      educationOnly: true,
      status: "<img src=x>",
      channels: ["telegram", "youtube", "<script>", 5],
      videoFilePath: "/etc/passwd",
      filePath: "/etc/passwd",
      storedName: "../../x",
      absolutePath: "/etc/passwd",
    }),
  });
  assert.equal(created.status, 201);
  const job = await created.json();
  for (const k of ["videoFilePath", "filePath", "storedName", "absolutePath"]) assert.ok(!(k in job), k);
  assert.ok(!("status" in job));
  assert.deepEqual(job.channels, ["telegram", "youtube"]);

  const patched = await (await fetch(`${base}/api/queue/t1`, {
    method: "PATCH",
    headers: json,
    body: JSON.stringify({ videoFilePath: "/etc/passwd" }),
  })).json();
  assert.ok(!("videoFilePath" in patched));

  const synced = await (await fetch(`${base}/api/queue/sync`, {
    method: "POST",
    headers: json,
    body: JSON.stringify({ jobs: [{ id: "t2", title: "z", absolutePath: "/etc/passwd" }] }),
  })).json();
  assert.ok(!("absolutePath" in synced[0]));

  const dispatch = await fetch(`${base}/api/queue/t1/dispatch`, { method: "POST", headers: json });
  assert.equal(dispatch.status, 503);
  assert.deepEqual(await dispatch.json(), { error: "Outbound dispatch disabled until founder re-enables." });

  const channels = await (await fetch(`${base}/api/channels`, { headers: json })).json();
  assert.deepEqual(channels, []);

  const up = await fetch(`${base}/api/upload?filename=pic.png`, {
    method: "POST",
    headers: { cookie, "content-type": "text/html", "x-filename": "pic.png" },
    body: Buffer.from("<script>alert(1)</script>"),
  });
  assert.equal(up.status, 201);
  const rec = await up.json();
  assert.equal(rec.mimeType, "image/png");
  const media = await fetch(`${base}/media/${rec.mediaId}`);
  assert.equal(media.headers.get("x-content-type-options"), "nosniff");
  assert.equal(media.headers.get("content-type"), "image/png");

  const pdf = await (await fetch(`${base}/api/upload?filename=doc.pdf`, {
    method: "POST",
    headers: { cookie, "content-type": "application/pdf", "x-filename": "doc.pdf" },
    body: Buffer.from("%PDF-1.4"),
  })).json();
  const pdfRes = await fetch(`${base}/media/${pdf.mediaId}`);
  assert.match(pdfRes.headers.get("content-disposition") || "", /^attachment/);

  assert.equal((await fetch(`${base}/media/..%2F..%2Fserver.js`)).status, 404);

  for (let i = 0; i < 10; i++) {
    await fetch(`${base}/login`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "username=tester&password=wrong",
      redirect: "manual",
    });
  }
  const blocked = await fetch(`${base}/login`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: "username=tester&password=test-password-1",
    redirect: "manual",
  });
  assert.equal(blocked.status, 429);

  assert.match(logs, /Outbound dispatch OFF/);
  assert.doesNotMatch(logs, /\[scheduler\] running/);
  console.log("test-security: OK");
} finally {
  child.kill();
}
