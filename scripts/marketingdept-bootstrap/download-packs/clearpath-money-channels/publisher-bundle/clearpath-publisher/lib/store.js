/**
 * Simple JSON-file store for the publish queue.
 * Small volume (education posts), so a flat file beats a native DB dependency.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");
const QUEUE_FILE = path.join(DATA_DIR, "queue.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadJobs() {
  ensureDir();
  try {
    const raw = fs.readFileSync(QUEUE_FILE, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveJobs(jobs) {
  ensureDir();
  const tmp = QUEUE_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(jobs, null, 2), "utf8");
  fs.renameSync(tmp, QUEUE_FILE);
}

export function getJob(id) {
  return loadJobs().find((j) => j.id === id) ?? null;
}

export function upsertJob(job) {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === job.id);
  if (idx >= 0) jobs[idx] = job;
  else jobs.unshift(job);
  saveJobs(jobs);
  return job;
}

export function patchJob(id, patch) {
  const jobs = loadJobs();
  const idx = jobs.findIndex((j) => j.id === id);
  if (idx < 0) return null;
  jobs[idx] = { ...jobs[idx], ...patch };
  saveJobs(jobs);
  return jobs[idx];
}

export function deleteJob(id) {
  const jobs = loadJobs();
  const next = jobs.filter((j) => j.id !== id);
  saveJobs(next);
  return next.length !== jobs.length;
}

export function replaceAll(jobs) {
  saveJobs(Array.isArray(jobs) ? jobs : []);
  return loadJobs();
}
