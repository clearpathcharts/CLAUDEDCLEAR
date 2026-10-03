/**
 * CEO-only explainer-video library.
 *
 * Founder flow: pick video → watch the bar fill → tap COPY LINK → paste the
 * link wherever it belongs on the site. Big targets, one tap per action, and
 * every state says out loud what is happening.
 *
 * Files go straight from this browser to the Cloud Storage bucket using a
 * resumable upload URL minted by the founder-gated API, so a 900 MB recording
 * never has to squeeze through Cloud Run's ~32 MB request limit.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Check, Copy, Film, Loader2, RefreshCw, Trash2, Upload, AlertTriangle } from 'lucide-react';

type CeoVideo = {
  id: string;
  objectPath: string;
  filename: string;
  originalName: string;
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;
  url: string;
  publicRead: boolean | null;
};

type StorageStatus = {
  configured: boolean;
  bucket: string | null;
  credentials: boolean;
  reason?: string;
};

type LibraryPayload = {
  ok: boolean;
  storage: StorageStatus;
  limits: { maxBytes: number; contentTypes: string[] };
  videos: CeoVideo[];
};

type UploadRow = {
  key: string;
  name: string;
  sizeBytes: number;
  percent: number;
  state: 'waiting' | 'uploading' | 'finishing' | 'done' | 'error';
  message?: string;
};

function formatSize(bytes: number): string {
  if (!bytes) return '—';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatDate(value: string): string {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : d.toLocaleString();
}

/** Clipboard API first, hidden-textarea fallback for older/locked-down contexts. */
async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.setAttribute('readonly', '');
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(el);
      return ok;
    } catch {
      return false;
    }
  }
}

function putFileWithProgress(
  uploadUrl: string,
  file: File,
  onProgress: (percent: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'video/mp4');
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () =>
      xhr.status >= 200 && xhr.status < 300
        ? resolve()
        : reject(new Error(`Bucket refused the upload (${xhr.status}). Check the bucket CORS rule.`));
    xhr.onerror = () =>
      reject(new Error('The browser could not reach the bucket. Usually this is the bucket CORS rule.'));
    xhr.onabort = () => reject(new Error('Upload cancelled.'));
    xhr.send(file);
  });
}

const BTN =
  'inline-flex items-center justify-center gap-2 rounded-xl font-black uppercase tracking-widest transition-colors disabled:opacity-50';

export default function CeoVideoLibrary({
  getHeaders,
}: {
  getHeaders: () => Promise<Record<string, string>>;
}) {
  const [payload, setPayload] = useState<LibraryPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadRow[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/ceo/videos', { headers, credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Video library failed (${res.status})`);
      setPayload(body as LibraryPayload);
    } catch (err: any) {
      setError(err?.message || 'Could not load the video library.');
      setPayload(null);
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const patchUpload = (key: string, patch: Partial<UploadRow>) =>
    setUploads((rows) => rows.map((r) => (r.key === key ? { ...r, ...patch } : r)));

  const uploadOne = async (file: File, key: string) => {
    patchUpload(key, { state: 'uploading', percent: 0 });
    const headers = await getHeaders();
    const res = await fetch('/api/ceo/videos/upload-url', {
      method: 'POST',
      headers,
      credentials: 'include',
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'video/mp4',
        sizeBytes: file.size,
      }),
    });
    const session = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(session.message || session.error || `Could not start the upload (${res.status})`);

    await putFileWithProgress(session.uploadUrl, file, (percent) => patchUpload(key, { percent }));

    patchUpload(key, { state: 'finishing', percent: 100 });
    const finalizeHeaders = await getHeaders();
    const done = await fetch(`/api/ceo/videos/${session.id}/finalize`, {
      method: 'POST',
      headers: finalizeHeaders,
      credentials: 'include',
      body: '{}',
    });
    const doneBody = await done.json().catch(() => ({}));
    if (!done.ok) throw new Error(doneBody.message || doneBody.error || `Upload did not finish (${done.status})`);
    patchUpload(key, { state: 'done', message: 'Saved. Link is ready below.' });
  };

  const handleFiles = async (files: FileList | null) => {
    const picked = Array.from(files || []);
    if (!picked.length) return;
    const rows: UploadRow[] = picked.map((file, i) => ({
      key: `${Date.now()}-${i}-${file.name}`,
      name: file.name,
      sizeBytes: file.size,
      percent: 0,
      state: 'waiting',
    }));
    setUploads((prev) => [...rows, ...prev]);

    for (let i = 0; i < picked.length; i += 1) {
      try {
        await uploadOne(picked[i]!, rows[i]!.key);
      } catch (err: any) {
        patchUpload(rows[i]!.key, { state: 'error', message: err?.message || 'Upload failed.' });
      }
    }
    await load();
  };

  const handleCopy = async (video: CeoVideo) => {
    const ok = await copyText(video.url);
    setCopiedId(ok ? video.id : null);
    if (!ok) setError('The browser blocked copying. Long-press the link under the video instead.');
    window.setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDelete = async (video: CeoVideo) => {
    if (confirmDeleteId !== video.id) {
      setConfirmDeleteId(video.id);
      window.setTimeout(() => setConfirmDeleteId((id) => (id === video.id ? null : id)), 6000);
      return;
    }
    setConfirmDeleteId(null);
    setDeletingId(video.id);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/ceo/videos/${video.id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Delete failed (${res.status})`);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not delete that video.');
    } finally {
      setDeletingId(null);
    }
  };

  const storage = payload?.storage;
  const maxMb = payload ? Math.round(payload.limits.maxBytes / 1024 / 1024) : 2048;
  const videos = payload?.videos || [];

  return (
    <section data-ceo-video-library className="space-y-6">
      <header className="space-y-2">
        <h2 className="m-0 flex items-center gap-3 text-xl font-black uppercase tracking-widest text-[#00FFFF]">
          <Film className="h-6 w-6" aria-hidden="true" /> Explainer video library
        </h2>
        <p className="m-0 max-w-3xl text-sm leading-relaxed text-zinc-300">
          Upload a video, wait for the bar to fill, then tap <strong className="text-white">COPY LINK</strong> and
          paste it wherever you want it on the site. Only you can open this page.
        </p>
      </header>

      {storage && !storage.configured ? (
        <div
          data-ceo-video-not-configured
          className="space-y-3 rounded-2xl border-2 border-amber-400/50 bg-amber-500/10 px-5 py-5"
        >
          <p className="m-0 flex items-center gap-2 text-base font-black uppercase tracking-widest text-amber-200">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" /> Storage not configured — nothing can upload yet
          </p>
          <p className="m-0 text-sm leading-relaxed text-amber-50">{storage.reason}</p>
          <ol className="m-0 space-y-2 pl-5 text-sm leading-relaxed text-amber-50">
            <li>Make the bucket in Google Cloud Storage (one time).</li>
            <li>
              Cloud Run → <strong>clear-path-markets-science</strong> → Edit &amp; deploy new revision → Variables
              &amp; secrets → add <span className="font-mono text-white">CEO_VIDEO_BUCKET</span>. Leave the
              container image alone.
            </li>
            <li>Add the CORS rule on the bucket so this page is allowed to upload to it.</li>
          </ol>
          <p className="m-0 text-xs text-amber-200/80">
            Full walkthrough: <span className="font-mono">docs/ceo-video-library.md</span>
          </p>
        </div>
      ) : null}

      {error ? (
        <p className="m-0 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          data-ceo-video-pick
          disabled={!storage?.configured}
          onClick={() => fileInputRef.current?.click()}
          className={`${BTN} min-h-[72px] flex-1 min-w-[280px] bg-[#00FFFF] px-8 text-base text-black hover:bg-[#6ffcff]`}
        >
          <Upload className="h-6 w-6" aria-hidden="true" /> Choose a video to upload
        </button>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className={`${BTN} min-h-[72px] border border-zinc-600 px-6 text-xs text-zinc-200 hover:bg-zinc-800`}
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" /> Refresh
        </button>
      </div>
      <p className="m-0 text-xs uppercase tracking-widest text-zinc-500">
        Up to {maxMb} MB each · MP4, MOV, WebM, M4V, MKV · you can pick several at once
      </p>

      {uploads.length ? (
        <ul className="m-0 list-none space-y-3 p-0">
          {uploads.map((row) => (
            <li
              key={row.key}
              data-ceo-video-upload-row
              className="rounded-xl border border-zinc-700 bg-black/50 px-4 py-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm text-zinc-100">{row.name}</span>
                <span className="text-xs uppercase tracking-widest text-zinc-400">
                  {row.state === 'uploading' ? `${row.percent}% uploaded` : null}
                  {row.state === 'waiting' ? 'Waiting its turn' : null}
                  {row.state === 'finishing' ? 'Finishing…' : null}
                  {row.state === 'done' ? 'Done' : null}
                  {row.state === 'error' ? 'Failed' : null}
                </span>
              </div>
              <div className="mt-3 h-4 w-full overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full transition-[width] duration-200 ${
                    row.state === 'error' ? 'bg-red-500' : row.state === 'done' ? 'bg-emerald-400' : 'bg-[#00FFFF]'
                  }`}
                  style={{ width: `${row.state === 'done' ? 100 : row.percent}%` }}
                />
              </div>
              {row.message ? (
                <p
                  className={`m-0 mt-2 text-xs ${row.state === 'error' ? 'text-red-300' : 'text-emerald-300'}`}
                >
                  {row.message}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}

      {loading && !payload ? (
        <p className="m-0 flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> Loading your videos…
        </p>
      ) : null}

      {payload && storage?.configured && videos.length === 0 && !loading ? (
        <p className="m-0 rounded-xl border border-zinc-700 bg-black/40 px-4 py-6 text-center text-sm text-zinc-400">
          No videos yet. Tap the big button above to upload your first one.
        </p>
      ) : null}

      <ul className="m-0 grid list-none grid-cols-1 gap-5 p-0 lg:grid-cols-2">
        {videos.map((video) => (
          <li
            key={video.id}
            data-ceo-video-card
            className="space-y-4 rounded-2xl border border-indigo-500/30 bg-zinc-950 p-4"
          >
            <video
              src={video.url}
              controls
              preload="metadata"
              className="aspect-video w-full rounded-xl bg-black"
            />
            <div className="space-y-1">
              <p className="m-0 break-all font-mono text-sm text-white">{video.originalName}</p>
              <p className="m-0 text-xs uppercase tracking-widest text-zinc-500">
                {formatSize(video.sizeBytes)} · {formatDate(video.uploadedAt)}
              </p>
              {video.publicRead === false ? (
                <p className="m-0 text-xs text-amber-300">
                  Uploaded, but the bucket is not public yet, so this link will not play for visitors. Grant
                  allUsers → Storage Object Viewer on the bucket.
                </p>
              ) : null}
            </div>
            <p className="m-0 break-all rounded-lg bg-black/60 px-3 py-2 font-mono text-[11px] text-zinc-400">
              {video.url}
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                data-ceo-video-copy
                onClick={() => void handleCopy(video)}
                className={`${BTN} min-h-[60px] flex-1 min-w-[200px] px-6 text-sm ${
                  copiedId === video.id
                    ? 'bg-emerald-400 text-black'
                    : 'bg-[#FFD700] text-black hover:bg-[#ffe766]'
                }`}
              >
                {copiedId === video.id ? (
                  <>
                    <Check className="h-5 w-5" aria-hidden="true" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-5 w-5" aria-hidden="true" /> Copy link
                  </>
                )}
              </button>
              <button
                type="button"
                data-ceo-video-delete
                disabled={deletingId === video.id}
                onClick={() => void handleDelete(video)}
                className={`${BTN} min-h-[60px] px-6 text-xs ${
                  confirmDeleteId === video.id
                    ? 'bg-red-500 text-white hover:bg-red-400'
                    : 'border border-red-500/50 text-red-300 hover:bg-red-500/15'
                }`}
              >
                <Trash2 className="h-5 w-5" aria-hidden="true" />
                {deletingId === video.id
                  ? 'Deleting…'
                  : confirmDeleteId === video.id
                    ? 'Tap again to delete'
                    : 'Delete'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
