/**
 * ClearPath Automation Console
 * In-house queue + direct publisher backend.
 * NO Zapier / Buffer / Make / CrewAI — ClearPath-owned sends only.
 * file:// opens talk to local publisher; Cloud Run uses same-origin /api.
 */

const STORAGE_KEY = "clearpath-automation-queue-v1";
const API_BASE =
  window.location.protocol === "file:" ? "http://127.0.0.1:8787" : "";

let backendOnline = false;
let backendChannels = [];

async function api(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: "same-origin",
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ? `${body.error}${body.details ? ": " + body.details.join(", ") : ""}` : `HTTP ${res.status}`);
  }
  return res.json();
}

function setBackendStatusOnline() {
  const statusEl = document.getElementById("backend-status");
  const direct = backendChannels.filter((c) => c.mode === "direct" && c.ready).map((c) => c.name);
  if (!statusEl) return;
  statusEl.textContent = direct.length
    ? `Backend: ONLINE — Dispatch ready for: ${direct.join(", ")}`
    : "Backend: ONLINE — set TELEGRAM_BOT_TOKEN / DISCORD_WEBHOOK_URL (etc.) in Cloud Run → Variables & secrets, then Dispatch appears for those channels";
}

/** Upload a File to ClearPath media store (binary body — not JSON). */
async function uploadMedia(file, onProgress) {
  if (!backendOnline) {
    await initBackend();
  }
  if (!backendOnline) {
    throw new Error("Backend offline — hard-refresh and login again. File hosting runs on this same fuckweasel.net server.");
  }
  if (onProgress) onProgress(0);
  const res = await fetch(`${API_BASE}/api/upload`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "Content-Type": file.type || "application/octet-stream",
      "X-Filename": file.name,
    },
    body: file,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error("Session expired — refresh and login again, then re-choose the file.");
    }
    throw new Error(body.error || `Upload failed (HTTP ${res.status})`);
  }
  if (onProgress) onProgress(100);
  return body;
}

async function initBackend() {
  const statusEl = document.getElementById("backend-status");
  try {
    let channels = [];
    try {
      const health = await api("/api/health");
      channels = health.channels || [];
    } catch {
      // Older revisions gated /api/health; channels still prove the publisher is up.
      channels = await api("/api/channels");
    }
    backendOnline = true;
    backendChannels = Array.isArray(channels) ? channels : [];
    setBackendStatusOnline();
  } catch {
    backendOnline = false;
    if (statusEl) {
      statusEl.textContent = "Backend: offline — hard-refresh, login again. If this persists, redeploy FIX-CONTAINER-START.";
    }
    return;
  }

  // Queue sync must not flip the whole publisher offline (upload/dispatch still work).
  try {
    const serverQueue = await api("/api/queue");
    if (Array.isArray(serverQueue)) {
      const changed = JSON.stringify(serverQueue) !== JSON.stringify(queue);
      queue = serverQueue;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
      updateStats();
      if (changed && view === "queue") render();
      else if (changed) renderLatest();
    }
  } catch {
    /* keep backendOnline */
  }
}

function syncToBackend() {
  if (!backendOnline) return;
  api("/api/queue/sync", { method: "POST", body: JSON.stringify({ jobs: queue }) })
    .then((serverQueue) => {
      if (Array.isArray(serverQueue)) queue = serverQueue;
    })
    .catch(() => {});
}

async function dispatchNow(jobId) {
  const job = queue.find((j) => j.id === jobId);
  if (!job) return;
  const directTargets = job.channels.filter((id) =>
    backendChannels.some((c) => c.id === id && c.mode === "direct" && c.ready),
  );
  const bridgeTargets = job.channels.filter((id) => !directTargets.includes(id));
  const msg = [
    `Dispatch "${job.title}" now?`,
    directTargets.length ? `Direct send: ${directTargets.join(", ")}` : "No direct channels ready — nothing will send.",
    bridgeTargets.length
      ? `Not wired for direct send yet (stay in queue / export notes): ${bridgeTargets.join(", ")}`
      : "",
    "Dispatch now = founder approval. Posts go out from ClearPath Publisher on this server.",
  ].filter(Boolean).join("\n");
  if (!confirm(msg)) return;
  try {
    const updated = await api(`/api/queue/${jobId}/dispatch`, { method: "POST" });
    const idx = queue.findIndex((j) => j.id === jobId);
    if (idx >= 0) queue[idx] = updated;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
    updateStats();
    render();
    const sent = (updated.results || []).filter((r) => r.ok).map((r) => r.channel);
    const failed = (updated.results || []).filter((r) => !r.ok && !r.skipped).map((r) => `${r.channel} (${r.error})`);
    const bridged = (updated.results || []).filter((r) => r.skipped).map((r) => r.channel);
    alert(
      [
        sent.length ? `SENT via ClearPath Publisher: ${sent.join(", ")}` : "",
        failed.length ? `FAILED: ${failed.join("; ")}` : "",
        bridged.length
          ? `NOT SENT (no API yet): ${bridged.join(", ")} — keep in queue until that channel is wired.`
          : "",
      ].filter(Boolean).join("\n") || "No results.",
    );
  } catch (err) {
    alert(`Dispatch error: ${err.message}`);
  }
}

const CHANNELS = [
  // Social / video (15)
  { id: "facebook", name: "Facebook", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "Meta Graph Page post" },
  { id: "instagram", name: "Instagram", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "Business Content Publishing API" },
  { id: "x", name: "X (Twitter)", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "X API v2" },
  { id: "tiktok", name: "TikTok", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "Calm edits only — flash risk" },
  { id: "youtube", name: "YouTube", group: "social", engine: "ClearPath Publisher", status: "partial", note: "Optional — ClearPath file upload first, then Data API if OAuth set" },
  { id: "linkedin", name: "LinkedIn", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "UGC / Posts API" },
  { id: "reddit", name: "Reddit", group: "social", engine: "ClearPath Publisher", status: "partial", note: "Script app submit" },
  { id: "snapchat", name: "Snapchat", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "Story / Spotlight education" },
  { id: "pinterest", name: "Pinterest", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "Pins API" },
  { id: "discord", name: "Discord", group: "social", engine: "ClearPath Publisher", status: "partial", note: "Channel webhook" },
  { id: "threads", name: "Threads", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "Threads API" },
  { id: "telegram", name: "Telegram", group: "social", engine: "ClearPath Publisher", status: "partial", note: "BotFather token + chat id (easiest win)" },
  { id: "whatsapp", name: "WhatsApp", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "Meta Cloud API" },
  { id: "twitch", name: "Twitch", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / announcements" },
  { id: "bluesky", name: "Bluesky", group: "social", engine: "ClearPath Publisher", status: "not_yet", note: "AT Protocol app password" },
  { id: "myspace", name: "MySpace", group: "social", engine: "ClearPath Publisher", status: "blocked", note: "No public posting API — site read-only since 2024" },
  // Professional / networking (15 — LinkedIn also in social)
  { id: "xing", name: "Xing", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "viadeo", name: "Viadeo", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "shapr", name: "Shapr", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "lunchclub", name: "Lunchclub", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "polywork", name: "Polywork", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "wellfound", name: "Wellfound (AngelList)", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "fishbowl", name: "Fishbowl", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "blind", name: "Blind", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "opportunity", name: "Opportunity", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "meetup", name: "Meetup", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "API or webhook" },
  { id: "alignable", name: "Alignable", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "bark", name: "Bark", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "gust", name: "Gust", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
  { id: "researchgate", name: "ResearchGate", group: "networking", engine: "ClearPath Publisher", status: "not_yet", note: "Webhook / package" },
];

const DISCOVERY = [
  { rank: 1, name: "Google Search Console", status: "not_yet" },
  { rank: 2, name: "Bing Webmaster + IndexNow", status: "not_yet" },
  { rank: 3, name: "YouTube", status: "connected" },
  { rank: 4, name: "GA4", status: "not_yet" },
  { rank: 5, name: "Gmail", status: "connected" },
  { rank: 14, name: "Apple Podcasts", status: "not_yet" },
  { rank: 15, name: "Spotify Podcasts", status: "not_yet" },
];

const FOOTER =
  "\n\nClearPath Trader — market education for calm learning.\nNot a brokerage. https://clearpathtrader.com";

const app = document.getElementById("app");
const viewRoot = document.getElementById("view-root");
const currentTitle = document.querySelector(".current");
const searchLabel = document.querySelector(".search label");
const queueFilter = document.getElementById("queue-filter");

let view = "publish";
let queue = loadQueue();
let selectedChannels = ["facebook", "youtube", "instagram", "linkedin", "reddit"];
let me = null;
let treasure = [];

async function loadMe() {
  try {
    me = await api("/api/me");
    const thumb = document.querySelector(".avatar .thumb");
    const name = document.querySelector(".avatar .name");
    if (thumb && me?.username) {
      thumb.textContent = String(me.username).slice(0, 2).toUpperCase();
    }
    if (name && me?.username) {
      name.innerHTML = `<span class="brand-cyan">${me.username}</span> <span class="brand-magenta">${me.role || "member"}</span>`;
    }
  } catch {
    me = null;
  }
}

async function loadTreasure() {
  try {
    treasure = await api("/api/treasure");
    if (!Array.isArray(treasure)) treasure = [];
  } catch {
    treasure = [];
  }
}

document.addEventListener("touchstart", () => {}, true);

searchLabel.addEventListener("click", () => app.classList.toggle("search"));

document.querySelectorAll("#main-nav .menu-item").forEach((item) => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    document.querySelectorAll("#main-nav .menu-item").forEach((i) => i.classList.remove("active"));
    item.classList.add("active");
    view = item.dataset.view;
    currentTitle.textContent = item.querySelector(".desc").textContent;
    render();
  });
});

queueFilter.addEventListener("input", () => {
  if (view === "queue") render();
});

document.getElementById("btn-export-all").addEventListener("click", exportAll);
document.getElementById("btn-clear-queue").addEventListener("click", () => {
  if (confirm("Clear the entire local queue?")) {
    queue = [];
    saveQueue();
    render();
  }
});

function loadQueue() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveQueue() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(queue));
  updateStats();
  syncToBackend();
}

function uid() {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

function updateClock() {
  const now = new Date();
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const pad = (n) => (n < 10 ? "0" + n : n);
  document.getElementById("side-date").textContent =
    `${now.getDate()} ${months[now.getMonth()]}, ${now.getFullYear()}`;
  document.getElementById("side-time").textContent =
    `${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

function updateStats() {
  document.getElementById("stat-queued").textContent = String(
    queue.filter((j) => j.status === "queued").length
  );
  document.getElementById("stat-ready").textContent = String(
    queue.filter((j) => j.status === "ready").length
  );
  document.getElementById("stat-channels").textContent = String(selectedChannels.length);
}

function buildPackage(job) {
  const lines = [
    "CLEARPATH AUTOMATION PACKAGE",
    `Job: ${job.id}`,
    `Title: ${job.title}`,
    `When: ${job.scheduledFor || "ASAP after confirmation"}`,
    `Status: ${job.status}`,
    "",
    "MISSION",
    `Calm / no flash: ${job.calm ? "YES" : "NO"}`,
    `Education only: ${job.educationOnly ? "YES" : "NO"}`,
    "",
    "CAPTION",
    job.caption,
    "",
    `Video URL: ${job.videoUrl || "(none)"}`,
    `ClearPath media: ${job.mediaId || "(none)"}`,
    `File: ${job.fileName || "(none)"}`,
    "",
    "CHANNELS",
  ];
  job.channels.forEach((id) => {
    const ch = CHANNELS.find((c) => c.id === id);
    if (!ch) return;
    lines.push(`- ${ch.name} → ${ch.engine} → ${ch.note}`);
  });
  lines.push(
    "",
    "CLEARPATH PUBLISHER INSTRUCTIONS",
    "1. Confirm this exact package with the founder.",
    "2. Dispatch through ClearPath Publisher only after approval.",
    "3. Report success/fail per channel.",
    "4. Never claim brokerage or post flashy ticker creatives."
  );
  return lines.join("\n");
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function exportAll() {
  if (!queue.length) {
    alert("Queue is empty.");
    return;
  }
  const blob = new Blob([queue.map(buildPackage).join("\n\n-----\n\n")], {
    type: "text/plain",
  });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `clearpath-queue-${Date.now()}.txt`;
  a.click();
  URL.revokeObjectURL(a.href);
}

function wireChannelPicks() {
  const picks = document.getElementById("channel-picks");
  if (!picks) return;
  picks.innerHTML = CHANNELS.map((ch) => `
    <button type="button" class="chip ${selectedChannels.includes(ch.id) ? "on" : ""}" data-ch="${ch.id}">
      ${ch.name}
    </button>
  `).join("");
  picks.querySelectorAll(".chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.ch;
      if (selectedChannels.includes(id)) {
        selectedChannels = selectedChannels.filter((x) => x !== id);
        btn.classList.remove("on");
      } else {
        selectedChannels.push(id);
        btn.classList.add("on");
      }
      updateStats();
    });
  });
}

let pendingMedia = null; // { mediaId, fileName, videoUrl, mimeType, size }

function setUploadStatus(msg, isError = false) {
  const el = document.getElementById("f-upload-status");
  if (!el) return;
  el.textContent = msg || "";
  el.classList.toggle("error", Boolean(isError));
}

function wireMediaPicker() {
  const input = document.getElementById("f-file");
  const clearBtn = document.getElementById("btn-clear-media");
  if (!input) return;
  input.addEventListener("change", async () => {
    const file = input.files && input.files[0];
    pendingMedia = null;
    if (!file) {
      setUploadStatus("");
      return;
    }
    setUploadStatus(`Uploading ${file.name} (${Math.round(file.size / (1024 * 1024))}MB) to ClearPath…`);
    try {
      const uploaded = await uploadMedia(file);
      pendingMedia = {
        mediaId: uploaded.mediaId,
        fileName: uploaded.fileName,
        videoUrl: uploaded.videoUrl,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
      };
      const urlField = document.getElementById("f-url");
      if (urlField && !urlField.value.trim() && uploaded.videoUrl) {
        urlField.value = uploaded.videoUrl.startsWith("http")
          ? uploaded.videoUrl
          : `${window.location.origin}${uploaded.videoUrl}`;
      }
      setUploadStatus(
        `Hosted on ClearPath: ${uploaded.fileName} · ${Math.round((uploaded.size || 0) / 1024)} KB · id ${uploaded.mediaId}`,
      );
    } catch (err) {
      pendingMedia = null;
      input.value = "";
      setUploadStatus(err.message || "Upload failed", true);
    }
  });
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      pendingMedia = null;
      input.value = "";
      setUploadStatus("Cleared — YouTube not required; leave empty for text-only.");
    });
  }
}

async function addFromForm() {
  const title = document.getElementById("f-title").value.trim();
  const caption = document.getElementById("f-caption").value.trim();
  let videoUrl = document.getElementById("f-url").value.trim();
  const fileInput = document.getElementById("f-file");
  const when = document.getElementById("f-when").value;
  // Mission checks are implied for this education desk — no click-through required.
  const calm = true;
  const educationOnly = true;
  const btn = document.getElementById("btn-queue");

  if (!title || !caption) {
    alert("Title and caption are required.");
    return;
  }
  if (!selectedChannels.length) {
    alert("Pick at least one channel.");
    return;
  }

  // If user picked a file but upload hasn't finished / failed, upload now.
  if (fileInput?.files?.[0] && !pendingMedia) {
    try {
      if (btn) btn.disabled = true;
      setUploadStatus(`Uploading ${fileInput.files[0].name}…`);
      const uploaded = await uploadMedia(fileInput.files[0]);
      pendingMedia = {
        mediaId: uploaded.mediaId,
        fileName: uploaded.fileName,
        videoUrl: uploaded.videoUrl,
        mimeType: uploaded.mimeType,
        size: uploaded.size,
      };
    } catch (err) {
      alert(`File upload required before queueing: ${err.message}`);
      if (btn) btn.disabled = false;
      return;
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  if (pendingMedia?.videoUrl && !videoUrl) {
    videoUrl = pendingMedia.videoUrl.startsWith("http")
      ? pendingMedia.videoUrl
      : `${window.location.origin}${pendingMedia.videoUrl}`;
  }

  const job = {
    id: uid(),
    createdAt: new Date().toISOString(),
    title,
    caption,
    videoUrl,
    fileName: pendingMedia?.fileName || "",
    mediaId: pendingMedia?.mediaId || null,
    mimeType: pendingMedia?.mimeType || null,
    mediaSize: pendingMedia?.size || null,
    scheduledFor: when ? new Date(when).toISOString() : null,
    channels: [...selectedChannels],
    calm,
    educationOnly,
    status: "queued",
  };
  queue.unshift(job);
  saveQueue();
  document.getElementById("f-title").value = "";
  document.getElementById("f-url").value = "";
  if (fileInput) fileInput.value = "";
  document.getElementById("f-when").value = "";
  pendingMedia = null;
  setUploadStatus("");
  alert(
    job.mediaId
      ? "Queued with ClearPath-hosted file. Open Queue → Dispatch — Telegram/Discord get the video directly (YouTube optional)."
      : "Queued. Open Queue to dispatch or copy the publish package.",
  );
  renderLatest();
}

function renderLatest() {
  const box = document.getElementById("latest-queue");
  if (!box) return;
  if (!queue.length) {
    box.innerHTML = `<p class="hint">No jobs yet.</p>`;
    return;
  }
  const j = queue[0];
  box.innerHTML = `
    <p><strong>${escapeHtml(j.title)}</strong></p>
    <p class="hint">${j.channels.join(" · ")} · ${j.status}</p>
    ${
      backendOnline
        ? `<button type="button" class="btn btn-primary" data-dispatch="${j.id}">Dispatch now</button>`
        : `<p class="hint">Backend offline — start ClearPath Publisher to dispatch from this console.</p>`
    }
    <button type="button" class="btn" data-copy="${j.id}">Export notes</button>
  `;
  const dispatchBtn = box.querySelector("[data-dispatch]");
  if (dispatchBtn) {
    dispatchBtn.addEventListener("click", () => dispatchNow(j.id));
  }
  box.querySelector("[data-copy]").addEventListener("click", async () => {
    const ok = await copyText(buildPackage(j));
    j.status = "ready";
    saveQueue();
    alert(ok ? "Notes copied for your records. Live send = Queue → Dispatch now (ClearPath Publisher)." : "Copy failed.");
    renderLatest();
  });
}

function renderQueue() {
  const q = queueFilter.value.trim().toLowerCase();
  const list = queue.filter(
    (j) => !q || j.title.toLowerCase().includes(q) || j.channels.join(" ").includes(q)
  );

  viewRoot.innerHTML = `
    <div class="cardcolumn span-all">
      <div class="card">
        <header><span class="title">Automation queue (${list.length})</span></header>
        <div class="content queue-list">
          ${
            list.length
              ? list
                  .map(
                    (j) => `
            <article class="queue-item">
              <div>
                <h3>${escapeHtml(j.title)}</h3>
                <p class="hint">${j.channels.join(" · ")} · ${j.status}${
                      j.scheduledFor ? " · " + new Date(j.scheduledFor).toLocaleString() : ""
                    }${
                      j.mediaId
                        ? ` · ClearPath file: ${escapeHtml(j.fileName || j.mediaId)}`
                        : j.videoUrl
                        ? " · link only"
                        : ""
                    }</p>
                ${
                  Array.isArray(j.results) && j.results.length
                    ? `<p class="hint">${j.results
                        .map((r) =>
                          r.ok
                            ? `✓ ${r.channel} sent`
                            : r.skipped
                            ? `→ ${r.channel} via ClearPath package (no Zapier)`
                            : `✗ ${r.channel}: ${escapeHtml(String(r.error || "failed"))}`,
                        )
                        .join(" · ")}</p>`
                    : ""
                }
              </div>
              <div class="queue-actions">
                ${
                  backendOnline
                    ? `<button type="button" class="btn btn-primary" data-dispatch="${j.id}">Dispatch now</button>`
                    : ""
                }
                <button type="button" class="btn" data-copy="${j.id}">Export notes</button>
                <button type="button" class="btn btn-danger" data-del="${j.id}">Remove</button>
              </div>
              <pre class="pkg">${escapeHtml(buildPackage(j))}</pre>
            </article>`
                  )
                  .join("")
              : `<p class="hint">Queue empty — use Publish to add an education post.</p>`
          }
        </div>
      </div>
    </div>
  `;

  viewRoot.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const job = queue.find((j) => j.id === btn.dataset.copy);
      if (!job) return;
      const ok = await copyText(buildPackage(job));
      job.status = "ready";
      saveQueue();
      alert(ok ? "Notes copied. Live send uses Queue → Dispatch now on this console." : "Clipboard blocked — select the text below.");
      render();
    });
  });
  viewRoot.querySelectorAll("[data-del]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.del;
      queue = queue.filter((j) => j.id !== id);
      saveQueue();
      if (backendOnline) api(`/api/queue/${id}`, { method: "DELETE" }).catch(() => {});
      render();
    });
  });
  viewRoot.querySelectorAll("[data-dispatch]").forEach((btn) => {
    btn.addEventListener("click", () => dispatchNow(btn.dataset.dispatch));
  });
}

function renderChannelGroup(title, items) {
  if (!items.length) return "";
  return `
    <div class="card channel-group">
      <header><span class="title">${title}</span><span class="count-pill">${items.length}</span></header>
      <div class="content channel-stack">
        ${items
          .map(
            (ch) => `
          <div class="channel-card">
            <div class="channel-card-top">
              <strong class="channel-card-name">${ch.name}</strong>
              <span class="badge ${ch.status}">${ch.status.replace("_", " ")}</span>
            </div>
            <p class="channel-card-engine">${ch.engine || "ClearPath Publisher"}</p>
            <p class="channel-card-note">${ch.note}</p>
          </div>`
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderChannels() {
  const live = CHANNELS.filter((ch) => ch.status === "connected" || ch.status === "partial");
  const pending = CHANNELS.filter((ch) => ch.status === "not_yet");
  const blocked = CHANNELS.filter((ch) => ch.status === "blocked");
  viewRoot.innerHTML = `
    <div class="cardcolumn span-all channels-wrap">
      ${renderChannelGroup("Partial / ready code", live)}
      ${renderChannelGroup("Not yet — need API keys / approval", pending)}
      ${renderChannelGroup("No public API (do not chase)", blocked)}
      <p class="hint channel-foot">Open <strong>API Keys</strong> in the left nav for step-by-step how to get each credential. Partial = adapters exist. Not yet = need keys. Blocked = platform has no posting API.</p>
    </div>
  `;
}

/** Honest acquisition paths — do first wins first. Never invent “connected” without real keys. */
const API_KEY_GUIDES = [
  {
    priority: 1,
    id: "telegram",
    name: "Telegram",
    difficulty: "Easy — 10 minutes",
    env: "TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID",
    steps: [
      "Open Telegram → search @BotFather → /newbot → copy the token",
      "Create/open your channel or group → add the bot as admin",
      "Get chat id (@channelusername or numeric id via @userinfobot)",
      "Set both on Cloud Run env (never commit the token)",
      "If a token was ever pasted in chat: BotFather → /revoke → make a new one",
    ],
  },
  {
    priority: 2,
    id: "discord",
    name: "Discord",
    difficulty: "Easy — 5 minutes",
    env: "DISCORD_WEBHOOK_URL",
    steps: [
      "Server Settings → Integrations → Webhooks → New Webhook",
      "Pick the education channel → Copy Webhook URL",
      "Set DISCORD_WEBHOOK_URL on Cloud Run",
    ],
  },
  {
    priority: 3,
    id: "youtube",
    name: "YouTube Data API",
    difficulty: "Medium — Google Cloud OAuth",
    env: "YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET, YOUTUBE_REFRESH_TOKEN",
    steps: [
      "Google Cloud Console → same project (or new) → enable YouTube Data API v3",
      "APIs & Services → Credentials → Create OAuth client (Desktop or Web)",
      "OAuth consent screen: External or Internal; add your Google account as tester",
      "Use OAuth playground / a one-time local script to exchange auth code → refresh token (scope: youtube.upload)",
      "Set the three env vars on Cloud Run; uploads default to unlisted",
      "Remember: ClearPath file upload already posts to Telegram/Discord without YouTube",
    ],
  },
  {
    priority: 4,
    id: "reddit",
    name: "Reddit",
    difficulty: "Medium",
    env: "REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD, REDDIT_SUBREDDIT",
    steps: [
      "reddit.com/prefs/apps → create app → type script",
      "Copy client id + secret; use the bot/mod account username + password",
      "Set REDDIT_SUBREDDIT (e.g. ClearMarketScience) where the account can post",
    ],
  },
  {
    priority: 5,
    id: "facebook",
    name: "Facebook (Meta Graph)",
    difficulty: "Hard — App Review",
    env: "META_APP_ID, META_APP_SECRET, META_PAGE_ID, META_PAGE_ACCESS_TOKEN",
    steps: [
      "developers.facebook.com → Create App → Business type",
      "Add Facebook Login + pages_manage_posts / pages_read_engagement permissions",
      "Connect your Facebook Page; generate a long-lived Page access token",
      "Submit App Review for pages_manage_posts before production posting",
      "Until approved: channel stays bridge (copy package) — do not fake “Connected”",
    ],
  },
  {
    priority: 6,
    id: "instagram",
    name: "Instagram (Meta Content Publishing)",
    difficulty: "Hard — Business account + App Review",
    env: "META_IG_USER_ID, META_PAGE_ACCESS_TOKEN (same Meta app as Facebook)",
    steps: [
      "Instagram Professional (Business/Creator) linked to a Facebook Page",
      "Same Meta app → Instagram Graph API → instagram_content_publish",
      "App Review required for live publishing",
      "Calm still images / calm video only — no flash patterns",
    ],
  },
  {
    priority: 7,
    id: "linkedin",
    name: "LinkedIn",
    difficulty: "Hard — Marketing Developer Platform",
    env: "LINKEDIN_CLIENT_ID, LINKEDIN_CLIENT_SECRET, LINKEDIN_ACCESS_TOKEN, LINKEDIN_AUTHOR_URN",
    steps: [
      "linkedin.com/developers → Create app → request Community Management / Share on LinkedIn products",
      "Many education orgs need LinkedIn partnership approval — expect wait time",
      "Until approved: bridge package only",
    ],
  },
  {
    priority: 8,
    id: "tiktok",
    name: "TikTok",
    difficulty: "Hard — Content Posting API audit",
    env: "TIKTOK_CLIENT_KEY, TIKTOK_CLIENT_SECRET, TIKTOK_ACCESS_TOKEN",
    steps: [
      "developers.tiktok.com → Content Posting API",
      "App audit required; calm static/caption-led edits only for ClearPath mission",
    ],
  },
  {
    priority: 9,
    id: "myspace",
    name: "MySpace",
    difficulty: "Impossible right now",
    env: "(none)",
    steps: [
      "MySpace has been read-only (no new posts/uploads) since late 2024",
      "Old developer.myspace.com / OpenSocial APIs are dead — do not buy “MySpace API” packages",
      "If the brand relaunches with a real API later, we can add an adapter then",
      "Do not block the rest of the stack waiting on MySpace",
    ],
  },
];

function renderApiKeys() {
  viewRoot.innerHTML = `
    <div class="cardcolumn span-all">
      <div class="card">
        <header><span class="title">How to get APIs — founder order</span></header>
        <div class="content">
          <p class="hint">You do <strong>not</strong> need every API before publishing. ClearPath hosts the file; Telegram + Discord can ship today. YouTube/Meta come next. MySpace has no posting API.</p>
          <ol class="api-order">
            <li>Telegram + Discord (minutes)</li>
            <li>YouTube OAuth (optional — same ClearPath upload)</li>
            <li>Reddit script app</li>
            <li>Meta (Facebook + Instagram) App Review</li>
            <li>LinkedIn / TikTok when approved</li>
            <li>Skip MySpace until they relaunch a real API</li>
          </ol>
        </div>
      </div>
      ${API_KEY_GUIDES.map(
        (g) => `
        <div class="card api-guide" data-api="${g.id}">
          <header>
            <span class="title">${g.priority}. ${g.name}</span>
            <span class="badge ${g.id === "myspace" ? "blocked" : "partial"}">${escapeHtml(g.difficulty)}</span>
          </header>
          <div class="content">
            <p class="hint"><code>${escapeHtml(g.env)}</code></p>
            <ol class="api-steps">
              ${g.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
            </ol>
          </div>
        </div>`,
      ).join("")}
      <p class="hint channel-foot">Set secrets only on Cloud Run → Edit &amp; deploy → Variables. Never commit tokens. Never paste live bot tokens into chat.</p>
    </div>
  `;
}

function renderAnalytics() {
  const live = CHANNELS.filter((ch) => ch.status === "connected" || ch.status === "partial");
  const pending = CHANNELS.filter((ch) => ch.status === "not_yet");
  viewRoot.innerHTML = `
    <div class="cardcolumn span-all">
      <div class="card">
        <header><span class="title">Site & channel analytics</span></header>
        <div class="content analytics-grid">
          <div class="analytics-stat">
            <span class="label">Live channels</span>
            <strong>${live.length}</strong>
            <p class="hint">${live.map((c) => c.name).join(", ") || "None"}</p>
          </div>
          <div class="analytics-stat">
            <span class="label">Not yet</span>
            <strong>${pending.length}</strong>
            <p class="hint">${pending.map((c) => c.name).join(", ") || "None"}</p>
          </div>
          <div class="analytics-stat">
            <span class="label">Queued posts</span>
            <strong>${queue.filter((j) => j.status === "queued").length}</strong>
            <p class="hint">Waiting in local publisher queue</p>
          </div>
          <div class="analytics-stat">
            <span class="label">Ready packages</span>
            <strong>${queue.filter((j) => j.status === "ready").length}</strong>
            <p class="hint">Copied for ClearPath Publisher dispatch</p>
          </div>
        </div>
        <p class="hint channel-foot">No fake traffic numbers. These counts come from this console only until live analytics are wired.</p>
      </div>
    </div>
  `;
}

function renderSeo() {
  viewRoot.innerHTML = `
    <div class="cardcolumn span-all">
      <div class="card">
        <header><span class="title">SEO automation — video release prompts</span></header>
        <div class="content composer">
          <label>Video topic
            <input id="seo-topic" type="text" placeholder="e.g. Reading support without flashing tickers" />
          </label>
          <label>Target sector
            <select id="seo-sector">
              <option value="data centers">Data centers</option>
              <option value="AI infrastructure">AI infrastructure</option>
              <option value="B2B technology">B2B technology</option>
              <option value="cybersecurity">Cybersecurity</option>
              <option value="veteran education">Veteran education</option>
              <option value="neurodivergent learning">Neurodivergent learning</option>
            </select>
          </label>
          <label>Primary keyword
            <input id="seo-keyword" type="text" placeholder="e.g. accessible trading education" />
          </label>
          <button type="button" class="btn btn-primary" id="btn-seo-gen">Generate ranking prompts</button>
          <pre class="pkg" id="seo-output">Generate prompts for titles, descriptions, chapters, and channel-specific captions.</pre>
        </div>
      </div>
    </div>
  `;
  document.getElementById("btn-seo-gen").addEventListener("click", () => {
    const topic = document.getElementById("seo-topic").value.trim() || "Calm market education";
    const sector = document.getElementById("seo-sector").value;
    const keyword = document.getElementById("seo-keyword").value.trim() || topic.toLowerCase();
    const output = `CLEARPATH SEO VIDEO PROMPT PACK
Topic: ${topic}
Sector: ${sector}
Primary keyword: ${keyword}

YOUTUBE TITLE OPTIONS
1. ${topic}: a calm guide for ${sector}
2. ${keyword} without ticker overload
3. ClearPath education — ${topic}

YOUTUBE DESCRIPTION
${topic} explained in plain language for veterans and neurodivergent learners.
Focus sector: ${sector}.
Keyword focus: ${keyword}.
No flashing charts. No brokerage pitch.
Learn more: https://clearpathtrader.com

CHAPTER PROMPT
0:00 Why calm market education matters
1:00 Core idea — ${topic}
3:00 How to read this without sensory overload
5:00 Practical takeaway for ${sector}
6:30 Next lesson + encyclopedia link

SHORT CAPTIONS
Facebook/LinkedIn: ${topic} — plain-language ${sector} education. Not a brokerage.
Instagram: Calm charts. Clear words. ${keyword}.
Reddit: Discussion: how do you learn ${keyword} without noisy terminals?
TikTok/Douyin/Lemon8: Only if edit stays static + caption-led. Topic: ${topic}.
WhatsApp/WeChat: New ClearPath lesson — ${topic}. https://clearpathtrader.com

HASHTAGS (see Hashtags view for full packs)
${generateHashtags(topic, sector, keyword).split("\n").slice(0, 12).join("\n")}

RANKING RULES
- Put primary keyword in first 50 characters of title
- Repeat keyword once in first 2 description lines
- Link to encyclopedia / learn pages
- No fake urgency, no broker CTAs`;
    document.getElementById("seo-output").textContent = output;
  });
}

function slugTag(text) {
  return String(text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join("");
}

function generateHashtags(topic, sector, keyword) {
  const topicTag = slugTag(topic) || "CalmMarkets";
  const sectorTag = slugTag(sector) || "B2BTechnology";
  const keywordTag = slugTag(keyword) || topicTag;
  const core = [
    "#ClearPathTrader",
    "#ClearPathMarketsScience",
    "#MarketEducation",
    "#AccessibleTrading",
    "#NeurodivergentFriendly",
    "#VeteranEducation",
    "#NoTickerFlash",
    "#FinancialLiteracy",
    `#${topicTag}`,
    `#${sectorTag}`,
    `#${keywordTag}`,
    "#NotABrokerage",
  ];
  const packs = {
    Instagram: [...core, "#LearnOnInstagram", "#CalmLearning", "#EducationCarousel"].join(" "),
    LinkedIn: [...core, "#B2B", "#ThoughtLeadership", "#DataCenters", "#Cybersecurity", "#AIInfrastructure"].join(" "),
    Facebook: [...core, "#CommunityLearning", "#ClearPathEducation"].join(" "),
    YouTube: [...core, "#YouTubeEducation", "#MarketExplained"].join(" "),
    TikTok: ["#ClearPathTrader", `#${topicTag}`, `#${keywordTag}`, "#LearnOnTikTok", "#CalmFinance", "#MarketBasics"].join(" "),
    Douyin: ["#ClearPath", `#${sectorTag}`, "#FinanceEducation", "#CalmCharts"].join(" "),
    Lemon8: ["#ClearPathTrader", `#${topicTag}`, "#LifestyleLearning", "#CalmFocus"].join(" "),
    Reddit: `Tags/flair ideas: ${keyword} | ${sector} | accessible education | ClearPathTrader — also use ready packs for r/stocks · r/Trading · r/wallstreetbets`,
    Mastodon: [...core, "#A11y", "#Neurodiversity", "#FinLit"].join(" "),
    WhatsApp: "No hashtags needed — use plain lesson link + short caption.",
    WeChat: "Use topic keywords in caption; hashtags are limited on WeChat.",
    Snapchat: ["#ClearPathTrader", `#${topicTag}`, "#MarketEducation"].join(" "),
  };
  return `CLEARPATH HASHTAG PACK
Topic: ${topic}
Sector: ${sector}
Keyword: ${keyword}

CORE SET
${core.join(" ")}

BY CHANNEL
Instagram:
${packs.Instagram}

LinkedIn:
${packs.LinkedIn}

Facebook:
${packs.Facebook}

YouTube:
${packs.YouTube}

TikTok:
${packs.TikTok}

Douyin:
${packs.Douyin}

Lemon8:
${packs.Lemon8}

Reddit:
${packs.Reddit}

Mastodon:
${packs.Mastodon}

Snapchat:
${packs.Snapchat}

WhatsApp:
${packs.WhatsApp}

WeChat:
${packs.WeChat}

StockTwits:
#StockTwits #FinTwit #MarketSentiment #ClearPathTrader #NotABrokerage

eToro USA:
#eToro #eToroUSA #SocialTrading #FinancialLiteracy #ClearPathTrader #NotABrokerage

RULES
- Max 8–12 tags on Instagram/TikTok
- 3–5 tags on LinkedIn
- Skip hashtags on WhatsApp
- Never use broker/signal spam tags
- Keep veteran + accessibility tags in every education post`;
}

const COMMUNITY_HASHTAG_GROUPS = [
  {
    id: "forums",
    label: "Trading forums",
    note: "Niche discovery tags for education posts aimed at these communities",
    packs: [
      { name: "BabyPips", focus: "forex-focused", tags: "#BabyPips #ForexEducation #ForexTrading #RetailForex #FXBasics #CurrencyMarkets #LearnForex #ClearPathTrader" },
      { name: "Trade2Win", focus: "UK's largest trading forum", tags: "#Trade2Win #UKTrading #TradingForum #MarketEducation #DiscretionaryTrading #ClearPathTrader" },
      { name: "MQL5 Community", focus: "largest forex / automated trading forum", tags: "#MQL5 #MetaTrader #AlgoTrading #ExpertAdvisors #AutomatedTrading #ForexBots #MQL4 #ClearPathTrader" },
      { name: "SteadyOptions", focus: "options-focused", tags: "#SteadyOptions #OptionsTrading #OptionsEducation #DefinedRisk #IronCondor #OptionsStrategies #ClearPathTrader" },
      { name: "Aussie Stock Forums", focus: "ASX / Australia", tags: "#AussieStockForums #ASX #ASXStocks #AustralianInvesting #ASXEducation #ClearPathTrader" },
      { name: "MyPivots", focus: "day trading", tags: "#MyPivots #DayTrading #IntradayTrading #PivotPoints #PriceAction #DayTradingEducation #ClearPathTrader" },
      { name: "NinjaTrader Community", focus: "futures", tags: "#NinjaTrader #FuturesTrading #OrderFlow #ESFutures #NQFutures #FuturesEducation #ClearPathTrader" },
    ],
  },
  {
    id: "reddit",
    label: "Reddit",
    note: "Education framing only — never meme-pump or broker CTAs",
    packs: [
      { name: "r/wallstreetbets", focus: "14.8M members", tags: "#WallStreetBets #WSB #RetailInvestors #MarketEducation #NotFinancialAdvice #ClearPathTrader" },
      { name: "r/stocks", focus: "7.2M members", tags: "#Stocks #StockMarket #InvestingEducation #EquityMarkets #LongTermInvesting #ClearPathTrader" },
      { name: "r/Trading", focus: "active traders", tags: "#Trading #TradingCommunity #TechnicalAnalysis #TradingEducation #RiskManagement #ClearPathTrader" },
    ],
  },
  {
    id: "discord",
    label: "Discord communities",
    note: "For social cross-posts that mention or target these rooms",
    packs: [
      { name: "Investors Underground", focus: "Discord", tags: "#InvestorsUnderground #DayTradingEducation #SmallCapEducation #ClearPathTrader" },
      { name: "Warrior Trading", focus: "Discord", tags: "#WarriorTrading #DayTrading #MomentumTrading #TradingEducation #ClearPathTrader" },
      { name: "Bear Bull Traders", focus: "Discord", tags: "#BearBullTraders #DayTradingCommunity #TradingRoom #ClearPathTrader" },
      { name: "For Traders", focus: "prop-firm / funded-account focused", tags: "#ForTraders #PropFirm #FundedTrader #PropTradingEducation #RiskRules #ClearPathTrader" },
      { name: "Bull Trading Community", focus: "Discord", tags: "#BullTradingCommunity #TradingCommunity #MarketEducation #ClearPathTrader" },
      { name: "Humbled Trader", focus: "Discord", tags: "#HumbledTrader #TradingMindset #RetailTrading #TradingEducation #ClearPathTrader" },
      { name: "Elite Trading Community", focus: "Discord", tags: "#EliteTradingCommunity #TradingEducation #MarketStructure #ClearPathTrader" },
      { name: "SMB Capital", focus: "Discord", tags: "#SMBCapital #PropTrading #TradingDesk #ProfessionalTrading #ClearPathTrader" },
      { name: "HighStrike Trading Room", focus: "Discord", tags: "#HighStrike #OptionsTrading #TradingRoom #OptionsEducation #ClearPathTrader" },
      { name: "Market Masters", focus: "Discord", tags: "#MarketMasters #TradingCommunity #MarketEducation #ClearPathTrader" },
      { name: "Disruptive Investments", focus: "Discord", tags: "#DisruptiveInvestments #GrowthInvesting #InvestingEducation #ClearPathTrader" },
      { name: "FLI Capital", focus: "Discord", tags: "#FLICapital #TradingCommunity #CapitalMarketsEducation #ClearPathTrader" },
    ],
  },
  {
    id: "sentiment",
    label: "Sentiment / social",
    note: "StockTwits + eToro — keep education-only voice",
    packs: [
      { name: "StockTwits", focus: "sentiment / social", tags: "#StockTwits #FinTwit #MarketSentiment #StockTalk #TradingIdeas #InvestingEducation #ClearPathTrader #NotABrokerage" },
      { name: "eToro USA community feed", focus: "social / copy-trading audience", tags: "#eToro #eToroUSA #SocialTrading #CopyTrading #InvestingCommunity #FinancialLiteracy #ClearPathTrader #NotABrokerage" },
    ],
  },
];

function formatCommunityCatalog() {
  const lines = ["CLEARPATH — READY-TO-GRAB COMMUNITY HASHTAGS", "Education / analytics only. Not a brokerage.", ""];
  for (const group of COMMUNITY_HASHTAG_GROUPS) {
    lines.push(`=== ${group.label.toUpperCase()} ===`, group.note, "");
    for (const pack of group.packs) {
      lines.push(`${pack.name} (${pack.focus})`, pack.tags, "");
    }
  }
  lines.push("RULES", "- Grab 3–8 tags max per post", "- Always keep #ClearPathTrader + #NotABrokerage on public social", "- Never use pump, signal, or deposit CTAs");
  return lines.join("\n");
}

function renderHashtags() {
  const groupsHtml = COMMUNITY_HASHTAG_GROUPS.map(
    (group) => `
      <section class="hash-group">
        <h3 class="hash-group-title">${group.label}</h3>
        <p class="hint">${group.note}</p>
        <div class="hash-grid">
          ${group.packs
            .map(
              (pack) => `
            <button type="button" class="hash-chip" data-tags="${pack.tags.replace(/"/g, "&quot;")}" data-label="${pack.name}">
              <span class="hash-chip-name">${pack.name}</span>
              <span class="hash-chip-focus">${pack.focus}</span>
              <span class="hash-chip-tags">${pack.tags}</span>
            </button>`,
            )
            .join("")}
        </div>
      </section>`,
  ).join("");

  viewRoot.innerHTML = `
    <div class="cardcolumn span-all">
      <div class="card">
        <header><span class="title">Hashtag generator</span></header>
        <div class="content composer">
          <label>Video / post topic
            <input id="hash-topic" type="text" placeholder="e.g. Reading support without flashing tickers" />
          </label>
          <label>Target sector
            <select id="hash-sector">
              <option value="data centers">Data centers</option>
              <option value="AI infrastructure">AI infrastructure</option>
              <option value="B2B technology">B2B technology</option>
              <option value="cybersecurity">Cybersecurity</option>
              <option value="veteran education">Veteran education</option>
              <option value="neurodivergent learning">Neurodivergent learning</option>
            </select>
          </label>
          <label>Primary keyword
            <input id="hash-keyword" type="text" placeholder="e.g. accessible trading education" />
          </label>
          <div class="queue-actions">
            <button type="button" class="btn btn-primary" id="btn-hash-gen">Generate hashtags</button>
            <button type="button" class="btn" id="btn-hash-copy">Copy pack</button>
            <button type="button" class="btn" id="btn-hash-communities">Copy all community packs</button>
          </div>
          <p class="hint hash-status" id="hash-status">Click any community card below to copy its hashtags.</p>
          <div class="hash-ready">
            <h3 class="hash-group-title">Ready to grab</h3>
            ${groupsHtml}
          </div>
          <pre class="pkg" id="hash-output">Generate channel-ready hashtag packs, or grab a community set above.</pre>
        </div>
      </div>
    </div>
  `;
  const status = document.getElementById("hash-status");
  const gen = () => {
    const topic = document.getElementById("hash-topic").value.trim() || "Calm market education";
    const sector = document.getElementById("hash-sector").value;
    const keyword = document.getElementById("hash-keyword").value.trim() || topic.toLowerCase();
    document.getElementById("hash-output").textContent = generateHashtags(topic, sector, keyword);
  };
  document.getElementById("btn-hash-gen").addEventListener("click", gen);
  document.getElementById("btn-hash-copy").addEventListener("click", async () => {
    const text = document.getElementById("hash-output").textContent;
    const ok = await copyText(text);
    status.textContent = ok ? "Hashtag pack copied." : "Clipboard blocked — select the text manually.";
  });
  document.getElementById("btn-hash-communities").addEventListener("click", async () => {
    const ok = await copyText(formatCommunityCatalog());
    status.textContent = ok ? "Full community catalog copied." : "Clipboard blocked — select manually.";
  });
  viewRoot.querySelectorAll(".hash-chip").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const tags = btn.getAttribute("data-tags") || "";
      const label = btn.getAttribute("data-label") || "pack";
      const ok = await copyText(tags);
      status.textContent = ok ? `Copied: ${label}` : "Clipboard blocked — select tags manually.";
      document.getElementById("hash-output").textContent = `${label}\n${tags}`;
    });
  });
}

function renderDiscovery() {
  viewRoot.innerHTML = `
    <div class="cardcolumn span-all">
      <div class="card">
        <header><span class="title">Discovery priorities</span></header>
        <div class="content channel-table">
          <div class="channel-row channel-head">
            <span>Priority</span>
            <span>Status</span>
            <span></span>
          </div>
          ${DISCOVERY.map(
            (d) => `
            <div class="channel-row">
              <div class="channel-name">
                <strong>#${d.rank} ${d.name}</strong>
              </div>
              <span class="badge ${d.status}">${d.status.replace("_", " ")}</span>
              <span class="channel-note"></span>
            </div>`
          ).join("")}
        </div>
        <p class="hint channel-foot">Next critical opens: Google Search Console, Bing + IndexNow, then podcasts.</p>
      </div>
    </div>
  `;
}

function renderTreasure() {
  viewRoot.innerHTML = `
    <div class="cardcolumn span-all">
      <div class="card">
        <header><span class="title">Marketing treasure chest</span></header>
        <div class="content">
          <p class="hint">Shared open file for this console. Drop packages, captions, and channel notes here.</p>
          <label>Title<input id="chest-title" class="bar" type="text" placeholder="e.g. Support levels lesson — week of Aug 4" /></label>
          <label>Body / package<textarea id="chest-body" class="bar" rows="6" placeholder="Paste caption, links, channel plan…"></textarea></label>
          <label>Tags (comma-separated)<input id="chest-tags" class="bar" type="text" placeholder="youtube, telegram, veterans" /></label>
          <button type="button" class="btn" id="chest-add">Add to treasure chest</button>
        </div>
      </div>
      <div class="card">
        <header><span class="title">Shared items</span><span class="count-pill">${treasure.length}</span></header>
        <div class="content channel-stack" id="chest-list">
          ${
            treasure.length
              ? treasure
                  .map(
                    (item) => `
            <div class="channel-card" data-chest-id="${item.id}">
              <div class="channel-card-top">
                <strong class="channel-card-name">${escapeHtml(item.title)}</strong>
                <span class="badge ${item.status === "open" ? "partial" : "connected"}">${item.status}</span>
              </div>
              <p class="channel-card-note">${escapeHtml((item.body || "").slice(0, 240))}${(item.body || "").length > 240 ? "…" : ""}</p>
              <p class="hint">by ${escapeHtml(item.createdBy || "?")} · updated ${escapeHtml(item.updatedAt || "")}${
                      item.tags?.length ? " · " + item.tags.map(escapeHtml).join(", ") : ""
                    }</p>
              <div class="quick-actions">
                <button type="button" class="btn" data-chest-ship="${item.id}">Mark shipped</button>
                <button type="button" class="btn btn-danger" data-chest-del="${item.id}">Delete</button>
              </div>
            </div>`
                  )
                  .join("")
              : `<p class="hint">Chest is empty — add the first marketing package above.</p>`
          }
        </div>
      </div>
    </div>
  `;

  document.getElementById("chest-add")?.addEventListener("click", async () => {
    const title = document.getElementById("chest-title").value.trim();
    const body = document.getElementById("chest-body").value.trim();
    const tags = document
      .getElementById("chest-tags")
      .value.split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!title && !body) {
      alert("Add a title or body first.");
      return;
    }
    try {
      await api("/api/treasure", {
        method: "POST",
        body: JSON.stringify({ title, body, tags, status: "open" }),
      });
      await loadTreasure();
      render();
    } catch (err) {
      alert(err.message);
    }
  });

  viewRoot.querySelectorAll("[data-chest-ship]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      try {
        await api(`/api/treasure/${btn.dataset.chestShip}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "shipped" }),
        });
        await loadTreasure();
        render();
      } catch (err) {
        alert(err.message);
      }
    });
  });

  viewRoot.querySelectorAll("[data-chest-del]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Delete this treasure item?")) return;
      try {
        await api(`/api/treasure/${btn.dataset.chestDel}`, { method: "DELETE" });
        await loadTreasure();
        render();
      } catch (err) {
        alert(err.message);
      }
    });
  });
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function render() {
  updateStats();
  if (view === "publish") {
    // fixed publish render without chip-driven full wipe loop
    viewRoot.innerHTML = `
      <div class="cardcolumn span-2">
        <div class="card composer-card">
          <header><span class="title">Education post composer</span></header>
          <div class="content composer">
            <label>Title
              <input id="f-title" type="text" placeholder="Calm lesson title" />
            </label>
            <label>Caption / description
              <textarea id="f-caption" rows="6">${FOOTER.trim()}</textarea>
            </label>
            <label>Upload video / image to ClearPath (preferred — no YouTube required)
              <input id="f-file" type="file" accept="video/*,image/*,.mp4,.mov,.webm,.mkv,.pdf" />
            </label>
            <div class="row-2 upload-actions">
              <button type="button" class="btn" id="btn-clear-media">Clear file</button>
              <p class="hint" id="f-upload-status">Pick an MP4 — it hosts on ClearPath and sends to Telegram/Discord as the real file.</p>
            </div>
            <label>Optional public / external URL (Reddit link post, or already-hosted)
              <input id="f-url" type="url" placeholder="https://… (auto-filled after ClearPath upload when possible)" />
            </label>
            <label>Schedule (optional)
              <input id="f-when" type="datetime-local" />
            </label>
            <div class="channel-picks" id="channel-picks"></div>
            <button type="button" class="btn btn-primary" id="btn-queue">Add to automation queue</button>
            <p class="hint">Standalone ClearPath Publisher. Upload → Queue → Dispatch. Telegram/Discord send the file when API keys are set on Cloud Run.</p>
          </div>
        </div>
      </div>
      <div class="cardcolumn">
        <div class="card">
          <header><span class="title">How this works</span></header>
          <div class="content howto">
            <ol>
              <li>Upload the lesson file to ClearPath (or paste a URL)</li>
              <li>Pick channels</li>
              <li>Add to queue</li>
              <li>Open Queue → <strong>Dispatch now</strong> (posts leave from this ClearPath Publisher server)</li>
            </ol>
          </div>
        </div>
        <div class="card">
          <header><span class="title">Latest in queue</span></header>
          <div class="content" id="latest-queue"></div>
        </div>
      </div>
    `;
    wireChannelPicks();
    wireMediaPicker();
    document.getElementById("btn-queue").addEventListener("click", () => {
      addFromForm().catch((err) => alert(err.message || String(err)));
    });
    renderLatest();
    return;
  }
  if (view === "queue") return renderQueue();
  if (view === "treasure") return renderTreasure();
  if (view === "channels") return renderChannels();
  if (view === "apikeys") return renderApiKeys();
  if (view === "analytics") return renderAnalytics();
  if (view === "seo") return renderSeo();
  if (view === "hashtags") return renderHashtags();
  if (view === "discovery") return renderDiscovery();
}

updateClock();
setInterval(updateClock, 30000);
render();
initBackend();
loadMe();
loadTreasure();
setInterval(initBackend, 60000);
