/**
 * CEO-only explainer-video library.
 *
 * Founder flow: upload a video → watch the bar fill → in "Where each video
 * plays", choose it from the dropdown next to the play icon it belongs to.
 * COPY LINK stays for one-off placements. Big targets, one tap per action, and
 * every state says out loud what is happening.
 *
 * Files go straight from this browser to the Cloud Storage bucket using a
 * resumable upload URL minted by the founder-gated API, so a 900 MB recording
 * never has to squeeze through Cloud Run's ~32 MB request limit.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Film,
  Loader2,
  MonitorPlay,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';

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

type SlotAssignment = {
  slotId: string;
  videoId: string;
  url: string;
  assignedAt: string;
};

type VideoSlotRow = {
  id: string;
  groupId: string;
  label: string;
  where: string;
  explains: string;
  assignment: SlotAssignment | null;
};

type VideoSlotGroupRow = {
  id: string;
  label: string;
  blurb: string;
};

type LibraryPayload = {
  ok: boolean;
  storage: StorageStatus;
  limits: { maxBytes: number; contentTypes: string[] };
  videos: CeoVideo[];
  groups: VideoSlotGroupRow[];
  slots: VideoSlotRow[];
};

/** The group pinned open at the top. Everything else starts folded away. */
const NAV_GROUP_ID = 'nav';

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
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [savedSlotId, setSavedSlotId] = useState<string | null>(null);
  const [slotQuery, setSlotQuery] = useState('');
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  // Only groups the founder has deliberately opened or closed land here; the
  // rest fall back to the default for the current filter state.
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});
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

  /** One dropdown change = one video behind one play icon. Empty value clears it. */
  const handleSlotChange = async (slot: VideoSlotRow, videoId: string) => {
    setSavingSlotId(slot.id);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = videoId
        ? await fetch(`/api/ceo/videos/slots/${encodeURIComponent(slot.id)}`, {
            method: 'PUT',
            headers,
            credentials: 'include',
            body: JSON.stringify({ videoId }),
          })
        : await fetch(`/api/ceo/videos/slots/${encodeURIComponent(slot.id)}`, {
            method: 'DELETE',
            headers,
            credentials: 'include',
          });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Could not save that (${res.status})`);
      setSavedSlotId(slot.id);
      window.setTimeout(() => setSavedSlotId((id) => (id === slot.id ? null : id)), 2500);
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not change what plays there.');
    } finally {
      setSavingSlotId(null);
    }
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
  const slots = payload?.slots || [];
  const assignedCount = slots.filter((s) => s.assignment).length;
  const nameForVideoId = (videoId: string) =>
    videos.find((v) => v.id === videoId)?.originalName || 'this video';

  // Fall back to one synthetic group if an older server build sends no groups,
  // so the page still lists every slot instead of rendering nothing.
  const groups: VideoSlotGroupRow[] = payload?.groups?.length
    ? payload.groups
    : slots.length
      ? [{ id: NAV_GROUP_ID, label: 'All places a video can play', blurb: '' }]
      : [];

  const needle = slotQuery.trim().toLowerCase();
  const filtering = needle.length > 0 || onlyUnassigned;
  const slotMatches = (slot: VideoSlotRow) => {
    if (onlyUnassigned && slot.assignment) return false;
    if (!needle) return true;
    return (
      slot.label.toLowerCase().includes(needle) || slot.where.toLowerCase().includes(needle)
    );
  };

  /**
   * Nav is open on arrival; walkthroughs stay folded. While a filter is on,
   * everything opens so a match is never hidden behind a closed panel — but an
   * explicit tap on a header always wins over that default.
   */
  const isGroupOpen = (groupId: string) =>
    groupOverrides[groupId] ?? (filtering || groupId === NAV_GROUP_ID);

  const toggleGroup = (groupId: string) =>
    setGroupOverrides((prev) => ({ ...prev, [groupId]: !isGroupOpen(groupId) }));

  const visibleGroups = groups
    .map((group) => {
      const all = slots.filter((slot) => (slot.groupId || NAV_GROUP_ID) === group.id);
      return {
        group,
        all,
        shown: all.filter(slotMatches),
        assigned: all.filter((slot) => slot.assignment).length,
      };
    })
    .filter((row) => row.all.length > 0 && (!filtering || row.shown.length > 0));

  const shownCount = visibleGroups.reduce((n, row) => n + row.shown.length, 0);

  return (
    <section data-ceo-video-library className="space-y-6">
      <header className="space-y-2">
        <h2 className="m-0 flex items-center gap-3 text-xl font-black uppercase tracking-widest text-[#00FFFF]">
          <Film className="h-6 w-6" aria-hidden="true" /> Explainer video library
        </h2>
        <p className="m-0 max-w-3xl text-sm leading-relaxed text-zinc-300">
          Upload a video, wait for the bar to fill, then scroll to{' '}
          <strong className="text-white">Where each video plays</strong> and choose it from the dropdown next to
          the play icon it belongs to. That puts it on the live site — no code, no developer.{' '}
          <strong className="text-white">COPY LINK</strong> is still there for one-off placements. Only you can
          open this page.
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

      {slots.length ? (
        <section data-ceo-video-slots className="space-y-4 rounded-2xl border border-[#00FFFF]/25 bg-black/40 p-5">
          <header className="space-y-2">
            <h3 className="m-0 flex items-center gap-3 text-lg font-black uppercase tracking-widest text-[#00FFFF]">
              <MonitorPlay className="h-6 w-6" aria-hidden="true" /> Where each video plays
            </h3>
            <p className="m-0 max-w-3xl text-sm leading-relaxed text-zinc-300">
              Every place a video can play is one row below. Pick a video from a row&apos;s dropdown and it
              starts playing there straight away. Pick <span className="text-white">Nothing yet</span> to take
              it back off. The nav play icons are open at the top; each section walkthrough is folded away
              until you tap its heading.
            </p>
            <p className="m-0 text-xs uppercase tracking-widest text-zinc-500">
              {assignedCount} of {slots.length} places have a video
            </p>
          </header>

          {videos.length === 0 ? (
            <p className="m-0 rounded-xl border border-zinc-700 bg-black/50 px-4 py-4 text-sm text-zinc-400">
              Upload a video first — then these dropdowns will have something to choose.
            </p>
          ) : null}

          <div className="flex flex-wrap items-end gap-4">
            <div className="min-w-[260px] flex-1">
              <label
                htmlFor="video-slot-search"
                className="m-0 block text-xs font-black uppercase tracking-widest text-zinc-400"
              >
                Find a place by name
              </label>
              <div className="relative mt-2">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500"
                  aria-hidden="true"
                />
                <input
                  id="video-slot-search"
                  data-ceo-video-slot-search
                  type="search"
                  value={slotQuery}
                  onChange={(e) => setSlotQuery(e.target.value)}
                  placeholder="Try: charts, affiliate, calm tip"
                  className="min-h-[64px] w-full rounded-xl border border-zinc-600 bg-black pl-12 pr-4 text-base text-white placeholder:text-zinc-600 focus:border-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF]"
                />
              </div>
            </div>
            <label
              htmlFor="video-slot-unassigned"
              data-ceo-video-slot-unassigned-toggle
              className="flex min-h-[64px] cursor-pointer items-center gap-3 rounded-xl border border-zinc-600 bg-black px-5 text-sm font-black uppercase tracking-widest text-zinc-200 hover:border-[#00FFFF]/60"
            >
              <input
                id="video-slot-unassigned"
                type="checkbox"
                checked={onlyUnassigned}
                onChange={(e) => setOnlyUnassigned(e.target.checked)}
                className="h-6 w-6 accent-[#00FFFF]"
              />
              Show only empty ones
            </label>
          </div>

          {filtering ? (
            <p aria-live="polite" className="m-0 text-xs uppercase tracking-widest text-[#00FFFF]">
              {shownCount === 0
                ? 'Nothing matches that — clear the box to see everything again.'
                : `Showing ${shownCount} of ${slots.length} places`}
            </p>
          ) : null}

          <ul className="m-0 list-none space-y-3 p-0">
            {visibleGroups.map(({ group, all, shown, assigned }) => {
              const open = isGroupOpen(group.id);
              const panelId = `video-slot-group-${group.id.replace(/[^a-z0-9]+/gi, '-')}`;
              return (
                <li key={group.id} data-ceo-video-slot-group className="overflow-hidden rounded-xl border border-zinc-700 bg-zinc-950">
                  <button
                    type="button"
                    data-ceo-video-slot-group-toggle
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggleGroup(group.id)}
                    className="flex min-h-[72px] w-full flex-wrap items-center gap-4 px-4 py-4 text-left hover:bg-zinc-900"
                  >
                    {open ? (
                      <ChevronDown className="h-6 w-6 shrink-0 text-[#00FFFF]" aria-hidden="true" />
                    ) : (
                      <ChevronRight className="h-6 w-6 shrink-0 text-[#00FFFF]" aria-hidden="true" />
                    )}
                    <span className="min-w-[200px] flex-1">
                      <span className="block text-base font-black text-white">{group.label}</span>
                      {group.blurb ? (
                        <span className="mt-1 block text-xs leading-relaxed text-zinc-500">{group.blurb}</span>
                      ) : null}
                    </span>
                    <span
                      className={`shrink-0 rounded-lg px-3 py-2 text-xs font-black uppercase tracking-widest ${
                        assigned === all.length
                          ? 'bg-emerald-500/15 text-emerald-300'
                          : assigned > 0
                            ? 'bg-[#FFD700]/15 text-[#FFD700]'
                            : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {assigned} of {all.length} filled
                    </span>
                  </button>

                  {open ? (
                    <ul id={panelId} className="m-0 list-none space-y-3 border-t border-zinc-800 p-4">
                      {shown.map((slot) => {
                        const selectId = `video-slot-${slot.id.replace(/[^a-z0-9]+/gi, '-')}`;
                        const busy = savingSlotId === slot.id;
                        return (
                          <li
                            key={slot.id}
                            data-ceo-video-slot-row
                            className="flex flex-wrap items-center gap-4 rounded-xl border border-zinc-700 bg-black/60 px-4 py-4"
                          >
                            <div className="min-w-[240px] flex-1">
                              <label htmlFor={selectId} className="m-0 block text-sm font-black text-white">
                                {slot.label}
                              </label>
                              <p className="m-0 mt-1 text-xs leading-relaxed text-zinc-500">{slot.where}</p>
                              <p
                                className={`m-0 mt-1 text-xs font-bold ${
                                  slot.assignment ? 'text-emerald-300' : 'text-zinc-600'
                                }`}
                              >
                                {slot.assignment
                                  ? `Now playing: ${nameForVideoId(slot.assignment.videoId)}`
                                  : 'Nothing here yet — visitors read the written explanation instead.'}
                              </p>
                            </div>
                            <div className="flex min-w-[260px] flex-1 items-center gap-3">
                              <select
                                id={selectId}
                                data-ceo-video-slot-select
                                disabled={busy || !videos.length}
                                value={slot.assignment?.videoId || ''}
                                onChange={(e) => void handleSlotChange(slot, e.target.value)}
                                className="min-h-[60px] w-full rounded-xl border border-zinc-600 bg-black px-4 text-sm text-white focus:border-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF] disabled:opacity-50"
                              >
                                <option value="">Nothing yet</option>
                                {videos.map((video) => (
                                  <option key={video.id} value={video.id}>
                                    {video.originalName}
                                  </option>
                                ))}
                              </select>
                              <span
                                aria-live="polite"
                                className="min-w-[72px] text-xs font-black uppercase tracking-widest text-emerald-300"
                              >
                                {busy ? 'Saving…' : savedSlotId === slot.id ? 'Saved' : ''}
                              </span>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
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
