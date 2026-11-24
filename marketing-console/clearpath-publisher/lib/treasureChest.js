/**
 * Shared marketing "treasure chest" — one open file all team accounts use.
 * Tracks packages / drafts / notes flowing through the console.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const CHEST_FILE = path.join(DATA_DIR, "treasure-chest.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadChest() {
  ensureDir();
  try {
    const raw = fs.readFileSync(CHEST_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveChest(items) {
  ensureDir();
  const tmp = CHEST_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(items, null, 2), "utf8");
  fs.renameSync(tmp, CHEST_FILE);
}

export function listChest() {
  return loadChest().sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function addChestItem(input, username) {
  const now = new Date().toISOString();
  const item = {
    id: `chest_${crypto.randomBytes(6).toString("hex")}`,
    title: String(input.title || "").trim() || "Untitled",
    body: String(input.body || "").trim(),
    channels: Array.isArray(input.channels) ? input.channels.map(String) : [],
    tags: Array.isArray(input.tags) ? input.tags.map(String) : [],
    status: input.status === "shipped" || input.status === "archived" ? input.status : "open",
    createdBy: username,
    updatedBy: username,
    createdAt: now,
    updatedAt: now,
  };
  const items = loadChest();
  items.push(item);
  saveChest(items);
  return item;
}

export function patchChestItem(id, patch, username) {
  const items = loadChest();
  const idx = items.findIndex((i) => i.id === id);
  if (idx < 0) return null;
  const prev = items[idx];
  const next = {
    ...prev,
    title: patch.title !== undefined ? String(patch.title).trim() : prev.title,
    body: patch.body !== undefined ? String(patch.body) : prev.body,
    channels: Array.isArray(patch.channels) ? patch.channels.map(String) : prev.channels,
    tags: Array.isArray(patch.tags) ? patch.tags.map(String) : prev.tags,
    status:
      patch.status === "open" || patch.status === "shipped" || patch.status === "archived"
        ? patch.status
        : prev.status,
    updatedBy: username,
    updatedAt: new Date().toISOString(),
  };
  items[idx] = next;
  saveChest(items);
  return next;
}

export function deleteChestItem(id) {
  const items = loadChest();
  const next = items.filter((i) => i.id !== id);
  if (next.length === items.length) return false;
  saveChest(next);
  return true;
}
