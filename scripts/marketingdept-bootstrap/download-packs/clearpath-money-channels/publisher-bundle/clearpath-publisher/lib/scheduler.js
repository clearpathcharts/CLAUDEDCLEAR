/**
 * Scheduler: every 30s, dispatch APPROVED jobs whose scheduled time has arrived.
 * Nothing auto-sends without founder approval — approval is explicit per job.
 */
import { loadJobs, patchJob } from "./store.js";
import { dispatchJob, guardrailErrors } from "./dispatch.js";

const TICK_MS = 30_000;
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    const now = Date.now();
    const due = loadJobs().filter(
      (j) =>
        j.approved === true &&
        (j.status === "queued" || j.status === "ready") &&
        j.scheduledFor &&
        new Date(j.scheduledFor).getTime() <= now,
    );
    for (const job of due) {
      if (guardrailErrors(job).length) {
        patchJob(job.id, { status: "failed", results: [{ ok: false, error: "Guardrails not met" }] });
        continue;
      }
      patchJob(job.id, { status: "sending" });
      const { status, results } = await dispatchJob(job);
      patchJob(job.id, { status, results, sentAt: new Date().toISOString() });
      console.log(`[scheduler] job ${job.id} → ${status}`);
    }
  } catch (err) {
    console.error("[scheduler] tick error:", err);
  } finally {
    running = false;
  }
}

export function startScheduler() {
  setInterval(tick, TICK_MS);
  console.log("[scheduler] running — approved scheduled jobs dispatch automatically");
}
