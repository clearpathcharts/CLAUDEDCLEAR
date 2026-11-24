/**
 * Replay clips stay on this device. The in-page gallery is immediate.
 * When the browser can hand a video file to the operating system, Share
 * opens Photos / Instagram / TikTok / the rest of the share sheet.
 */

export const REPLAY_GALLERY_DB = 'clearpath-replay-gallery';
export const REPLAY_GALLERY_STORE = 'clips';
export const REPLAY_GALLERY_MAX = 12;
const MAX_RECORD_MS = 3 * 60 * 1000;

export type ReplayClipRecord = {
  id: string;
  createdAt: number;
  symbol: string;
  timeframe: string;
  mime: string;
  name: string;
  blob: Blob;
};

export function replayClipFileName(symbol: string, timeframe: string, at = new Date()): string {
  const stamp = at.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const safe = `${symbol || 'chart'}-${timeframe || 'tf'}`.replace(/[^a-zA-Z0-9._-]+/g, '');
  return `clearpath-replay-${safe}-${stamp}.webm`;
}

export function pickReplayRecorderMime(): string {
  if (typeof MediaRecorder === 'undefined') return '';
  const types = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported(t)) || '';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(REPLAY_GALLERY_DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(REPLAY_GALLERY_STORE)) {
        db.createObjectStore(REPLAY_GALLERY_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error || new Error('Could not open the replay gallery.'));
  });
}

export async function listReplayClips(): Promise<ReplayClipRecord[]> {
  if (typeof indexedDB === 'undefined') return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(REPLAY_GALLERY_STORE, 'readonly');
    const req = tx.objectStore(REPLAY_GALLERY_STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as ReplayClipRecord[]) || [];
      rows.sort((a, b) => b.createdAt - a.createdAt);
      resolve(rows);
    };
    req.onerror = () => reject(req.error || new Error('Could not read the replay gallery.'));
  });
}

export async function saveReplayClip(input: Omit<ReplayClipRecord, 'id' | 'createdAt'> & { id?: string; createdAt?: number }): Promise<ReplayClipRecord> {
  const clip: ReplayClipRecord = {
    id: input.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `clip-${Date.now()}`),
    createdAt: input.createdAt || Date.now(),
    symbol: input.symbol,
    timeframe: input.timeframe,
    mime: input.mime,
    name: input.name,
    blob: input.blob,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(REPLAY_GALLERY_STORE, 'readwrite');
    tx.objectStore(REPLAY_GALLERY_STORE).put(clip);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Could not save the replay clip.'));
  });
  const all = await listReplayClips();
  const extra = all.slice(REPLAY_GALLERY_MAX);
  if (extra.length) {
    const db2 = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db2.transaction(REPLAY_GALLERY_STORE, 'readwrite');
      const store = tx.objectStore(REPLAY_GALLERY_STORE);
      for (const row of extra) store.delete(row.id);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error || new Error('Could not trim the replay gallery.'));
    });
  }
  return clip;
}

export async function deleteReplayClip(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(REPLAY_GALLERY_STORE, 'readwrite');
    tx.objectStore(REPLAY_GALLERY_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Could not remove the replay clip.'));
  });
}

export type ReplayCapture = {
  stop: () => Promise<Blob>;
};

/** Records the chart canvases inside `root` without asking for screen-share permission. */
export function startReplayCapture(root: HTMLElement): ReplayCapture {
  const mime = pickReplayRecorderMime();
  if (!mime) throw new Error('This browser cannot record video.');
  const sources = () =>
    Array.from(root.querySelectorAll('canvas')).filter((c) => c.width > 0 && c.height > 0);
  if (!sources().length) throw new Error('The chart is not ready to record yet.');

  const dest = document.createElement('canvas');
  const ctx = dest.getContext('2d');
  if (!ctx) throw new Error('This browser cannot record video.');
  const stream = dest.captureStream(30);
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  rec.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  const stopped = new Promise<Blob>((resolve, reject) => {
    rec.onstop = () => resolve(new Blob(chunks, { type: mime.split(';')[0] || 'video/webm' }));
    rec.onerror = () => reject(new Error('Recording failed.'));
  });

  let raf = 0;
  const draw = () => {
    const canvases = sources();
    if (canvases.length) {
      const w = canvases[0].width;
      const h = canvases[0].height;
      if (dest.width !== w || dest.height !== h) {
        dest.width = w;
        dest.height = h;
      }
      ctx.clearRect(0, 0, dest.width, dest.height);
      for (const c of canvases) ctx.drawImage(c, 0, 0, dest.width, dest.height);
    }
    raf = requestAnimationFrame(draw);
  };
  draw();
  rec.start(250);
  const cap = window.setTimeout(() => {
    if (rec.state === 'recording') rec.stop();
  }, MAX_RECORD_MS);

  return {
    stop: async () => {
      window.clearTimeout(cap);
      cancelAnimationFrame(raf);
      if (rec.state !== 'inactive') {
        rec.stop();
      }
      const blob = await stopped;
      stream.getTracks().forEach((t) => t.stop());
      if (!blob.size) throw new Error('The recording was empty.');
      return blob;
    },
  };
}

export async function handReplayClipToDevice(clip: Pick<ReplayClipRecord, 'blob' | 'name' | 'mime'>): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const file = new File([clip.blob], clip.name, { type: clip.mime || 'video/webm' });
  const nav = navigator as Navigator & { canShare?: (data: ShareData) => boolean };
  if (typeof nav.canShare === 'function' && nav.canShare({ files: [file] }) && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        files: [file],
        title: 'ClearPath Trader replay',
        text: 'Market replay from ClearPath Trader',
      });
      return 'shared';
    } catch (err) {
      const name = (err as { name?: string })?.name;
      if (name === 'AbortError') return 'cancelled';
      throw err;
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = clip.name;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
  return 'downloaded';
}
