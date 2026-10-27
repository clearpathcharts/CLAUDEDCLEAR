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
import { notifyVideoSlotAssignmentsChanged } from '../hooks/useVideoSlotUrl';
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
  X,
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
  merged?: boolean;
};

const MERGED_TITLE_CLASS = 'text-[#FF1493] font-black drop-shadow-[0_0_12px_rgba(255,20,147,0.45)]';
const LIBRARY_VIDEO_ID = /^[a-f0-9]{16}$/i;

function isValidLibraryVideoId(id: string): boolean {
  return LIBRARY_VIDEO_ID.test(String(id || '').trim());
}

function isMergedVideo(video: CeoVideo): boolean {
  return Boolean(video.merged || video.originalName.startsWith('★'));
}

function libraryLabel(video: CeoVideo): string {
  const name = video.originalName || video.filename;
  if (isMergedVideo(video)) return name.startsWith('★') ? name : `★ ${name}`;
  return name;
}

function VideoSelectOptions({ videos }: { videos: CeoVideo[] }) {
  const usable = videos.filter((v) => isValidLibraryVideoId(v.id));
  const combined = usable.filter(isMergedVideo);
  const singles = usable.filter((v) => !isMergedVideo(v));
  return (
    <>
      {combined.length > 0 ? (
        <optgroup label="Combined videos">
          {combined.map((video) => (
            <option key={video.id} value={video.id}>
              {libraryLabel(video)}
            </option>
          ))}
        </optgroup>
      ) : null}
      <optgroup label="Single uploads">
        {singles.map((video) => (
          <option key={video.id} value={video.id}>
            {libraryLabel(video)}
          </option>
        ))}
      </optgroup>
    </>
  );
}

/** Native `<select>` cannot paint options pink — show the real color under the control. */
function VideoLibrarySelect({
  id,
  value,
  onChange,
  videos,
  disabled,
  placeholder = 'Choose a clip',
  dataMergeClip,
  dataSlotSelect,
}: {
  id?: string;
  value: string;
  onChange: (videoId: string) => void;
  videos: CeoVideo[];
  disabled?: boolean;
  placeholder?: string;
  dataMergeClip?: number;
  dataSlotSelect?: boolean;
}) {
  const selected = value ? videos.find((v) => v.id === value) : undefined;
  const merged = selected ? isMergedVideo(selected) : false;
  return (
    <div className="w-full space-y-1">
      <select
        id={id}
        data-ceo-video-merge-clip={dataMergeClip}
        data-ceo-video-slot-select={dataSlotSelect ? true : undefined}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`min-h-[60px] w-full rounded-xl border border-zinc-600 bg-black px-4 text-sm focus:border-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF] disabled:opacity-50 ${
          merged ? `${MERGED_TITLE_CLASS} font-black` : 'text-white'
        }`}
      >
        <option value="">{placeholder}</option>
        <VideoSelectOptions videos={videos} />
      </select>
      {selected ? (
        <p
          data-ceo-video-picker-preview
          className={`m-0 truncate text-xs ${merged ? MERGED_TITLE_CLASS : 'text-zinc-400'}`}
        >
          {merged ? (
            <>
              <span className={MERGED_TITLE_CLASS}>{libraryLabel(selected)}</span>
              <span className="text-zinc-500"> — live on the site when this row shows Saved</span>
            </>
          ) : (
            <>
              {libraryLabel(selected)}
              <span className="text-zinc-500"> — delete duplicate singles with X in the catalog above</span>
            </>
          )}
        </p>
      ) : null}
    </div>
  );
}

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
  const [deleteNote, setDeleteNote] = useState<string | null>(null);
  const [savingSlotId, setSavingSlotId] = useState<string | null>(null);
  const [savedSlotId, setSavedSlotId] = useState<string | null>(null);
  const [slotQuery, setSlotQuery] = useState('');
  const [onlyUnassigned, setOnlyUnassigned] = useState(false);
  // Only groups the founder has deliberately opened or closed land here; the
  // rest fall back to the default for the current filter state.
  const [groupOverrides, setGroupOverrides] = useState<Record<string, boolean>>({});
  const [mergeClipCount, setMergeClipCount] = useState<2 | 3>(3);
  const [clipIds, setClipIds] = useState<['', '', ''] | [string, string, string]>(['', '', '']);
  const [mergeTitle, setMergeTitle] = useState('');
  const [mergeSlotId, setMergeSlotId] = useState('');
  const [merging, setMerging] = useState(false);
  const [mergeNote, setMergeNote] = useState<string | null>(null);
  const [mergeError, setMergeError] = useState<string | null>(null);
  const [highlightVideoId, setHighlightVideoId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const load = useCallback(async (): Promise<LibraryPayload | null> => {
    setLoading(true);
    setError(null);
    try {
      const headers = await getHeaders();
      const res = await fetch('/api/ceo/videos', { headers, credentials: 'include' });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Video library failed (${res.status})`);
      const next = body as LibraryPayload;
      setPayload(next);
      return next;
    } catch (err: any) {
      setError(err?.message || 'Could not load the video library.');
      setPayload(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, [getHeaders]);

  useEffect(() => {
    void load();
  }, [load]);

  const mergeClips = async () => {
    const picked = [
      String(clipIds[0] ?? '').trim().toLowerCase(),
      String(clipIds[1] ?? '').trim().toLowerCase(),
      mergeClipCount === 3 ? String(clipIds[2] ?? '').trim().toLowerCase() : '',
    ].filter(Boolean);
    const videoIds =
      mergeClipCount === 3
        ? ([
            String(clipIds[0] ?? '').trim().toLowerCase(),
            String(clipIds[1] ?? '').trim().toLowerCase(),
            String(clipIds[2] ?? '').trim().toLowerCase(),
          ] as [string, string, string])
        : ([
            String(clipIds[0] ?? '').trim().toLowerCase(),
            String(clipIds[1] ?? '').trim().toLowerCase(),
          ] as [string, string]);
    if (picked.length !== mergeClipCount) {
      setMergeError(
        mergeClipCount === 3
          ? 'Pick Clip 1, Clip 2, and Clip 3 — three different uploads in play order.'
          : 'Pick Clip 1 and Clip 2 — two different uploads in play order.'
      );
      return;
    }
    if (videoIds.some((id) => !isValidLibraryVideoId(id))) {
      setMergeError(
        'One or more clips are not wired to a library id. Tap Refresh, then pick your clips again (not just the filenames).'
      );
      return;
    }
    if (new Set(videoIds).size < videoIds.length) {
      setMergeError('Pick different clips — the same upload cannot be used twice.');
      return;
    }
    setMerging(true);
    setMergeNote(null);
    setMergeError(null);
    try {
      const catalog = await load();
      if (!catalog?.videos?.length) {
        throw new Error('Video library did not load. Tap Refresh, then try merge again.');
      }
      for (let i = 0; i < videoIds.length; i += 1) {
        if (!catalog.videos.some((v) => v.id.toLowerCase() === videoIds[i])) {
          throw new Error(
            `Clip ${i + 1} is not in the library yet. Tap Refresh, wait a few seconds, then merge again.`
          );
        }
      }
      const headers = await getHeaders();
      const res = await fetch('/api/ceo/videos/merge', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          videoIds,
          clip1Id: videoIds[0],
          clip2Id: videoIds[1],
          clip3Id: videoIds.length > 2 ? videoIds[2] : undefined,
          clipCount: mergeClipCount,
          title: mergeTitle.trim() || undefined,
          slotId: mergeSlotId.trim() || undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || body.error || `Could not join the clips (${res.status})`);
      const slotLabel = mergeSlotId
        ? slots.find((s) => s.id === mergeSlotId)?.label
        : null;
      if (body.slotWarning) {
        setMergeNote(`${body.slotWarning} It is at the top of the library as “${body.video?.originalName || 'merged video'}”.`);
      } else if (slotLabel) {
        setMergeNote(
          `Joined as “${body.video?.originalName || mergeTitle || '30s video'}” and assigned to ${slotLabel}. It also appears at the top of the library.`
        );
      } else {
        setMergeNote(
          `Joined as “${body.video?.originalName || mergeTitle || '30s video'}”. Scroll to Where each video plays and pick a row, or choose a play icon above before merging next time.`
        );
      }
      const mergedId = String(body.video?.id || '');
      setClipIds(['', '', '']);
      setMergeTitle('');
      setMergeSlotId('');
      notifyVideoSlotAssignmentsChanged();
      await load();
      if (mergedId) {
        setHighlightVideoId(mergedId);
        window.setTimeout(() => {
          document.querySelector(`[data-ceo-video-card-id="${mergedId}"]`)?.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
          });
        }, 200);
        window.setTimeout(() => setHighlightVideoId(null), 12_000);
      }
    } catch (err: any) {
      setMergeError(err?.message || 'Could not join the clips.');
    } finally {
      setMerging(false);
    }
  };

  const fillClipsFromLatest = (count: 2 | 3 = mergeClipCount, catalog?: CeoVideo[]) => {
    const list = catalog ?? videos;
    const singles = list.filter((v) => !isMergedVideo(v));
    if (singles.length < count) {
      setMergeError(
        `Upload at least ${count} separate clips first (not counting older combined videos).`
      );
      return false;
    }
    const latest = [...singles]
      .sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt))
      .slice(0, count)
      .reverse();
    setClipIds([
      latest[0]!.id,
      latest[1]!.id,
      count === 3 ? latest[2]!.id : '',
    ] as [string, string, string]);
    setMergeError(null);
    setMergeNote(
      count === 3
        ? 'Filled Clip 1–3 from your three newest uploads (oldest → newest). Tap Merge when ready.'
        : 'Filled Clip 1–2 from your two newest uploads (oldest → newest). Tap Merge when ready.'
    );
    return true;
  };

  const mergeSlotsReady =
    Boolean(clipIds[0]) &&
    Boolean(clipIds[1]) &&
    (mergeClipCount === 2 || Boolean(clipIds[2]));

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
    const catalog = await load();
    if (
      catalog?.videos?.length &&
      (picked.length === mergeClipCount || (picked.length === 3 && mergeClipCount === 3))
    ) {
      fillClipsFromLatest(
        picked.length >= 3 ? 3 : picked.length >= 2 ? 2 : mergeClipCount,
        catalog.videos
      );
    }
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
      notifyVideoSlotAssignmentsChanged();
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
      const cleared = Array.isArray(body.clearedSlots) ? body.clearedSlots.length : 0;
      setDeleteNote(
        cleared > 0
          ? `Removed “${libraryLabel(video)}” from the catalog and cleared ${cleared} slot assignment(s).`
          : `Removed “${libraryLabel(video)}” from the catalog.`
      );
      window.setTimeout(() => setDeleteNote(null), 8000);
      setClipIds((prev) => {
        const next = [...prev] as [string, string, string];
        for (let i = 0; i < 3; i += 1) {
          if (next[i] === video.id) next[i] = '';
        }
        return next;
      });
      if (highlightVideoId === video.id) setHighlightVideoId(null);
      notifyVideoSlotAssignmentsChanged();
      await load();
    } catch (err: any) {
      setError(err?.message || 'Could not delete that video.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderCatalogRemoveControl = (video: CeoVideo, compact: boolean) => {
    const confirming = confirmDeleteId === video.id;
    const busy = deletingId === video.id;
    return (
      <button
        type="button"
        data-ceo-video-catalog-remove={video.id}
        disabled={busy}
        title={
          confirming
            ? 'Tap again to permanently delete from Cloud Storage'
            : 'Remove from catalog (file deleted on server)'
        }
        aria-label={
          confirming ? `Confirm delete ${libraryLabel(video)}` : `Delete ${libraryLabel(video)} from catalog`
        }
        onClick={() => void handleDelete(video)}
        className={
          compact
            ? `flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border transition-colors disabled:opacity-50 ${
                confirming
                  ? 'border-red-400 bg-red-500 text-white hover:bg-red-400'
                  : 'border-red-500/40 text-red-300 hover:border-red-400 hover:bg-red-500/20'
              }`
            : `flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors disabled:opacity-50 ${
                confirming
                  ? 'border-red-400 bg-red-500 text-white hover:bg-red-400'
                  : 'border-red-500/50 text-red-300 hover:bg-red-500/15'
              }`
        }
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : confirming ? (
          <span className="text-[10px] font-black uppercase">OK</span>
        ) : (
          <X className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
    );
  };

  const storage = payload?.storage;
  const maxMb = payload ? Math.round(payload.limits.maxBytes / 1024 / 1024) : 2048;
  const videos = payload?.videos || [];
  const slots = payload?.slots || [];
  const assignedCount = slots.filter((s) => s.assignment).length;
  const videoForId = (videoId: string) => videos.find((v) => v.id === videoId);

  const nameForVideoId = (videoId: string) => {
    const video = videoForId(videoId);
    return video ? libraryLabel(video) : 'this video';
  };

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
      {!payload && !loading ? (
        <p
          data-ceo-video-upload-locked
          className="m-0 rounded-xl border border-amber-400/50 bg-amber-500/10 px-4 py-3 text-sm leading-relaxed text-amber-50"
        >
          The upload button is locked because your video library did not load. Read the red message above,
          then tap <strong className="text-white">Refresh</strong>. If it says Unauthorized, sign out and use
          Private Login with the founder account, then come back to this tab.
        </p>
      ) : null}
      <p className="m-0 text-xs uppercase tracking-widest text-zinc-500">
        Up to {maxMb} MB each · MP4, MOV, WebM, M4V, MKV · you can pick several at once
      </p>

      {deleteNote ? (
        <p
          data-ceo-video-delete-note
          className="m-0 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100"
        >
          {deleteNote}
        </p>
      ) : null}

      {payload && storage?.configured && videos.length > 0 ? (
        <section
          data-ceo-video-catalog
          className="space-y-3 rounded-2xl border border-zinc-600 bg-zinc-950/80 px-5 py-4"
        >
          <header className="space-y-1">
            <h3 className="m-0 text-sm font-black uppercase tracking-widest text-zinc-200">
              Video catalog ({videos.length})
            </h3>
            <p className="m-0 text-xs leading-relaxed text-zinc-400">
              Tap the red <strong className="text-red-300">X</strong> to delete a duplicate from Cloud Storage.
              Tap <strong className="text-white">X</strong> again to confirm. Assignments on the site are cleared
              automatically.
            </p>
          </header>
          <ul className="m-0 max-h-[min(420px,50vh)] list-none space-y-2 overflow-y-auto p-0 pr-1">
            {videos.map((video) => (
              <li
                key={`catalog-${video.id}`}
                data-ceo-video-catalog-row={video.id}
                className={`flex items-center gap-3 rounded-xl border px-3 py-2 ${
                  isMergedVideo(video) ? 'border-[#FF1493]/40 bg-[#FF1493]/5' : 'border-zinc-700 bg-black/40'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={`m-0 truncate text-sm ${
                      isMergedVideo(video) ? MERGED_TITLE_CLASS : 'text-white'
                    }`}
                  >
                    {libraryLabel(video)}
                  </p>
                  <p className="m-0 font-mono text-[10px] text-zinc-500">
                    {video.id} · {formatSize(video.sizeBytes)} · {formatDate(video.uploadedAt)}
                  </p>
                </div>
                {renderCatalogRemoveControl(video, true)}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        data-ceo-video-merge
        className="space-y-3 rounded-2xl border border-[#00FFFF]/30 bg-black/40 px-5 py-5"
      >
        <p className="m-0 text-sm font-black uppercase tracking-widest text-[#00FFFF]">
          Join Flow clips into one tab video
        </p>
        <p className="m-0 text-sm leading-relaxed text-zinc-300">
          Google Flow stops at about 10 seconds. Upload your clips first, then pick them in play order (two or
          three). The joined video shows up in the library so you can put it on that tab.
        </p>
        <div
          data-ceo-video-merge-clip-count
          className="flex flex-wrap gap-2"
          role="group"
          aria-label="How many clips to join"
        >
          {([2, 3] as const).map((n) => (
            <button
              key={n}
              type="button"
              disabled={!storage?.configured || merging}
              onClick={() => {
                setMergeClipCount(n);
                if (n === 2) {
                  setClipIds((prev) => [prev[0], prev[1], ''] as [string, string, string]);
                }
                setMergeError(null);
              }}
              className={`min-h-[48px] rounded-xl border px-4 text-xs font-black uppercase tracking-widest transition-colors disabled:opacity-50 ${
                mergeClipCount === n
                  ? 'border-[#00FFFF] bg-[#00FFFF]/15 text-[#00FFFF]'
                  : 'border-zinc-600 text-zinc-300 hover:border-zinc-400'
              }`}
            >
              Join {n} clips
            </button>
          ))}
        </div>
        {videos.some((v) => !isValidLibraryVideoId(v.id)) ? (
          <p className="m-0 rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Some uploads are missing a library id — merge cannot use them. Tap <strong className="text-white">Refresh</strong>
            , then re-upload if a clip still will not appear in the dropdown.
          </p>
        ) : null}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-1 md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Title in the library
            </span>
            <input
              type="text"
              data-ceo-video-merge-title
              disabled={!storage?.configured || merging}
              value={mergeTitle}
              onChange={(e) => setMergeTitle(e.target.value)}
              placeholder="e.g. Memberships — 30s walkthrough"
              className="min-h-[60px] w-full rounded-xl border border-zinc-600 bg-black px-4 text-sm text-white placeholder:text-zinc-600 focus:border-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF] disabled:opacity-50"
            />
          </label>
          <label className="block space-y-1 md:col-span-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Put it on the site (optional)
            </span>
            <select
              data-ceo-video-merge-slot
              disabled={!storage?.configured || merging || !slots.length}
              value={mergeSlotId}
              onChange={(e) => setMergeSlotId(e.target.value)}
              className="min-h-[60px] w-full rounded-xl border border-zinc-600 bg-black px-4 text-sm text-white focus:border-[#00FFFF] focus:outline-none focus:ring-2 focus:ring-[#00FFFF] disabled:opacity-50"
            >
              <option value="">Choose later under “Where each video plays”</option>
              {groups.map((group) => {
                const groupSlots = slots.filter((s) => (s.groupId || NAV_GROUP_ID) === group.id);
                if (!groupSlots.length) return null;
                return (
                  <optgroup key={group.id} label={group.label}>
                    {groupSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label} — {slot.where}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>
        </div>
        <div className={`grid gap-3 ${mergeClipCount === 3 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          {([0, 1, 2] as const)
            .filter((index) => mergeClipCount === 3 || index < 2)
            .map((index) => (
              <label key={index} className="block space-y-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                  Clip {index + 1}
                </span>
                <VideoLibrarySelect
                  dataMergeClip={index + 1}
                  disabled={!storage?.configured || merging || !videos.length}
                  value={clipIds[index]}
                  onChange={(videoId) =>
                    setClipIds((prev) => {
                      const next = [...prev] as [string, string, string];
                      next[index] = videoId;
                      return next;
                    })
                  }
                  videos={videos}
                />
              </label>
            ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            data-ceo-video-merge-autofill
            disabled={
              !storage?.configured ||
              merging ||
              videos.filter((v) => !isMergedVideo(v)).length < mergeClipCount
            }
            onClick={() => fillClipsFromLatest(mergeClipCount)}
            className={`${BTN} min-h-[52px] border border-[#FF1493]/50 px-4 text-xs text-[#FF1493] hover:bg-[#FF1493]/10`}
          >
            Use my {mergeClipCount} newest single clips
          </button>
        </div>
        {!mergeSlotsReady ? (
          <p className="m-0 text-sm text-amber-200">
            {mergeClipCount === 3
              ? 'Pick Clip 1–3 in play order (or upload three at once — they auto-fill). Merge stays off until all three are set.'
              : 'Pick Clip 1 and Clip 2 in play order. Merge stays off until both are set.'}
          </p>
        ) : null}
        <button
          type="button"
          data-ceo-video-merge-go
          disabled={!storage?.configured || merging || !mergeSlotsReady}
          onClick={() => void mergeClips()}
          className={`${BTN} min-h-[64px] bg-[#00FFFF] px-6 text-sm text-black hover:bg-[#6ffcff]`}
        >
          {merging ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" /> : null}
          {merging
            ? 'Joining clips… (up to 5 min)'
            : mergeClipCount === 3
              ? 'Merge 3 clips into one ~30s video'
              : 'Merge 2 clips into one ~20s video'}
        </button>
        {mergeError ? (
          <p
            data-ceo-video-merge-error
            className="m-0 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-100"
          >
            {mergeError}
          </p>
        ) : null}
        {mergeNote ? <p className="m-0 text-sm text-emerald-300">{mergeNote}</p> : null}
      </div>

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
                                {slot.assignment ? (
                                  <>
                                    Now playing:{' '}
                                    <span
                                      className={
                                        videoForId(slot.assignment.videoId) &&
                                        isMergedVideo(videoForId(slot.assignment.videoId)!)
                                          ? MERGED_TITLE_CLASS
                                          : 'text-emerald-300'
                                      }
                                    >
                                      {nameForVideoId(slot.assignment.videoId)}
                                    </span>
                                  </>
                                ) : (
                                  'Nothing here yet — visitors read the written explanation instead.'
                                )}
                              </p>
                            </div>
                            <div className="flex min-w-[260px] flex-1 items-center gap-3">
                              <VideoLibrarySelect
                                id={selectId}
                                dataSlotSelect
                                disabled={busy || !videos.length}
                                placeholder="Nothing yet"
                                value={slot.assignment?.videoId || ''}
                                onChange={(videoId) => void handleSlotChange(slot, videoId)}
                                videos={videos}
                              />
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
            data-ceo-video-card-id={video.id}
            data-ceo-video-merged={isMergedVideo(video) ? '1' : undefined}
            className={`space-y-4 rounded-2xl bg-zinc-950 p-4 ${
              isMergedVideo(video)
                ? 'border-2 border-[#FF1493]/70 shadow-[0_0_28px_rgba(255,20,147,0.25)]'
                : 'border border-indigo-500/30'
            } ${highlightVideoId === video.id ? 'ring-4 ring-[#FF1493]/50' : ''}`}
          >
            <video
              src={video.url}
              controls
              preload="metadata"
              className="aspect-video w-full rounded-xl bg-black"
            />
            <div className="flex items-start gap-2">
              <div className="min-w-0 flex-1 space-y-1">
              {isMergedVideo(video) ? (
                <span className="inline-block rounded-lg border border-[#FF1493]/50 bg-[#FF1493]/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#FF1493]">
                  Combined video
                </span>
              ) : null}
              <p
                className={`m-0 break-all font-mono text-sm ${
                  isMergedVideo(video) ? MERGED_TITLE_CLASS : 'text-white'
                }`}
              >
                {libraryLabel(video)}
              </p>
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
              {renderCatalogRemoveControl(video, false)}
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
                    : 'Delete from catalog'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
