"use client";

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChartSymbolSearch } from '../charts/ChartSymbolSearch';
import { LightweightCandles } from '../charts/LightweightCandles';
import { useMarketReplay } from '../../hooks/useMarketReplay';
import { REPLAY_STEP_PRESETS, type ReplaySpeed } from '../../lib/replay/types';
import { resolveMarketAsset } from '../../constants/marketAssets';
import {
  deleteReplayClip,
  handReplayClipToDevice,
  listReplayClips,
  replayClipFileName,
  saveReplayClip,
  startReplayCapture,
  type ReplayCapture,
  type ReplayClipRecord,
} from '../../lib/replay/replayGallery';

const TIMEFRAMES = ['1m', '5m', '15m', '30m', '1h', '4h', '1d'] as const;

export function DeskReplayPanel({
  initialSymbol = 'USDJPY',
  initialTimeframe = '1h',
  profileId = 'calm_focus',
  userTier = 'VIP',
}: {
  initialSymbol?: string;
  initialTimeframe?: string;
  profileId?: string;
  userTier?: string;
}) {
  const replay = useMarketReplay({ initialSymbol, initialTimeframe, userTier });
  const [symbol, setSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [dateStr, setDateStr] = useState(() => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 14);
    return d.toISOString().slice(0, 10);
  });
  const [customStep, setCustomStep] = useState(5);
  const [clips, setClips] = useState<ReplayClipRecord[]>([]);
  const [recording, setRecording] = useState(false);
  const [recordNote, setRecordNote] = useState('');
  const chartRef = useRef<HTMLDivElement>(null);
  const captureRef = useRef<ReplayCapture | null>(null);

  const startUnix = useMemo(() => {
    const t = Date.parse(`${dateStr}T00:00:00Z`);
    return Number.isFinite(t) ? Math.floor(t / 1000) : undefined;
  }, [dateStr]);

  const previewUrls = useMemo(() => {
    const map = new Map<string, string>();
    for (const clip of clips) map.set(clip.id, URL.createObjectURL(clip.blob));
    return map;
  }, [clips]);

  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  useEffect(() => {
    void listReplayClips().then(setClips).catch(() => setClips([]));
  }, []);

  const refreshClips = async () => {
    setClips(await listReplayClips());
  };

  const onLoad = () => {
    void replay.load({
      symbol,
      timeframe,
      startUnix,
      startDate: dateStr,
      endDate: new Date().toISOString().slice(0, 10),
    });
  };

  const finishRecording = async () => {
    const cap = captureRef.current;
    captureRef.current = null;
    setRecording(false);
    if (!cap) return;
    setRecordNote('Saving recording…');
    try {
      const blob = await cap.stop();
      const mime = blob.type || 'video/webm';
      const clip = await saveReplayClip({
        symbol: replay.engineState.symbol || symbol,
        timeframe: replay.engineState.timeframe || timeframe,
        mime,
        name: replayClipFileName(replay.engineState.symbol || symbol, replay.engineState.timeframe || timeframe),
        blob,
      });
      await refreshClips();
      const handed = await handReplayClipToDevice(clip);
      setRecordNote(
        handed === 'shared'
          ? 'Saved in your gallery. The share sheet is open so you can post it or keep it in Photos.'
          : handed === 'downloaded'
            ? 'Saved in your gallery and downloaded so you can post it.'
            : 'Saved in your gallery. Share it whenever you want.',
      );
    } catch (err) {
      setRecordNote((err as Error)?.message || 'Could not save the recording.');
    }
  };

  const startRecording = () => {
    const root = chartRef.current;
    if (!root) return;
    try {
      captureRef.current = startReplayCapture(root);
      setRecording(true);
      setRecordNote('Recording the chart. Stop when the clip is ready.');
    } catch (err) {
      setRecordNote((err as Error)?.message || 'Could not start recording.');
    }
  };

  const exitReplay = () => {
    if (captureRef.current) void finishRecording();
    replay.exitReplay();
  };

  const shareClip = async (clip: ReplayClipRecord) => {
    try {
      const handed = await handReplayClipToDevice(clip);
      setRecordNote(
        handed === 'cancelled'
          ? 'Share cancelled. The clip is still in your gallery.'
          : handed === 'shared'
            ? 'Share sheet opened.'
            : 'Download started.',
      );
    } catch (err) {
      setRecordNote((err as Error)?.message || 'Could not share that clip.');
    }
  };

  const removeClip = async (id: string) => {
    await deleteReplayClip(id);
    await refreshClips();
  };

  return (
    <section
      data-market-replay
      className="flex min-h-0 flex-col gap-3 rounded-2xl border border-cyan-500/25 bg-black/60 p-3 shadow-[0_0_24px_rgba(0,229,255,0.08)]"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">Market Replay</p>
          <p className="text-xs text-zinc-500">
            Real history · no look-ahead · record a clip into your gallery
          </p>
        </div>
        {replay.active && (
          <button
            type="button"
            onClick={exitReplay}
            className="rounded-lg border border-zinc-700 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-400 hover:border-rose-500/50 hover:text-rose-300"
          >
            Exit Replay
          </button>
        )}
      </header>

      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[160px] flex-1">
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Symbol</label>
          <ChartSymbolSearch
            compact
            placeholder="USDJPY…"
            activeSymbol={symbol}
            onSubmit={(s) => setSymbol(resolveMarketAsset(s).value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Timeframe</label>
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="rounded-lg border border-white/10 bg-black px-2 py-1.5 font-mono text-xs text-zinc-200"
          >
            {TIMEFRAMES.map((tf) => (
              <option key={tf} value={tf}>{tf}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[9px] font-bold uppercase tracking-wider text-zinc-600">Start date (UTC)</label>
          <input
            type="date"
            value={dateStr}
            onChange={(e) => setDateStr(e.target.value)}
            className="rounded-lg border border-white/10 bg-black px-2 py-1.5 font-mono text-xs text-zinc-200"
          />
        </div>
        <button
          type="button"
          onClick={onLoad}
          disabled={replay.loading}
          className="rounded-lg border border-cyan-500/40 bg-cyan-500/15 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-cyan-300 hover:bg-cyan-500/25 disabled:opacity-50"
        >
          {replay.loading ? 'Loading…' : 'Load Real History'}
        </button>
      </div>

      {replay.error && (
        <p className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 font-mono text-xs text-rose-300">
          {replay.error}
        </p>
      )}
      {replay.loadNote && replay.active && (
        <p className="font-mono text-[10px] text-zinc-500">{replay.loadNote}</p>
      )}

      {replay.active && (
        <>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2">
            <span className="rounded bg-rose-600/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-rose-300">
              Replay Mode
            </span>
            <span className="font-mono text-sm font-bold text-cyan-300">{replay.engineState.symbol}</span>
            <span className="font-mono text-xs text-zinc-400">{replay.engineState.timeframe}</span>
            <span className="font-mono text-sm text-white">{replay.currentTimeLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => replay.step(-1)} className="replay-btn">◀ 1</button>
            {replay.engineState.isPlaying ? (
              <button type="button" onClick={replay.pause} className="replay-btn replay-btn-primary">Pause</button>
            ) : (
              <button type="button" onClick={replay.play} className="replay-btn replay-btn-primary">Play</button>
            )}
            <button type="button" onClick={() => replay.step(1)} className="replay-btn">1 ▶</button>
            {REPLAY_STEP_PRESETS.map((n) => (
              <button key={n} type="button" onClick={() => replay.step(n)} className="replay-btn">{n} ▶▶</button>
            ))}
            <input
              type="number"
              min={1}
              value={customStep}
              onChange={(e) => setCustomStep(Math.max(1, Number(e.target.value) || 1))}
              className="w-16 rounded-lg border border-white/10 bg-black px-2 py-1 font-mono text-xs text-zinc-200"
            />
            <button type="button" onClick={() => replay.step(customStep)} className="replay-btn">Custom ▶</button>
            <button type="button" onClick={replay.restart} className="replay-btn">Restart</button>
            <label className="ml-2 flex items-center gap-1 text-[10px] uppercase tracking-wider text-zinc-500">
              Speed
              <select
                value={replay.engineState.playbackSpeed}
                onChange={(e) => replay.setSpeed(Number(e.target.value) as ReplaySpeed)}
                className="rounded border border-white/10 bg-black px-1 py-0.5 font-mono text-xs text-cyan-300"
              >
                {replay.speeds.map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
            </label>
            <button
              type="button"
              onClick={() => (recording ? void finishRecording() : startRecording())}
              className="replay-btn"
              data-replay-record
              aria-pressed={recording}
            >
              {recording ? 'Stop recording' : 'Record'}
            </button>
          </div>
          {recordNote && (
            <p className="font-mono text-[10px] text-zinc-400" role="status">{recordNote}</p>
          )}

          <div className="space-y-1">
            <input
              type="range"
              min={replay.engineState.replayStartIndex}
              max={replay.engineState.replayEndIndex}
              value={replay.engineState.currentReplayIndex}
              onChange={(e) => replay.seekToIndex(Number(e.target.value))}
              className="w-full accent-cyan-400"
            />
            <div className="flex justify-between font-mono text-[9px] text-zinc-600">
              <span>Start #{replay.engineState.replayStartIndex}</span>
              <span>
                Now #{replay.engineState.currentReplayIndex} / {replay.engineState.replayEndIndex}
              </span>
              <span>End of loaded history</span>
            </div>
          </div>

          <div ref={chartRef} data-replay-stage className="min-h-[360px] overflow-hidden rounded-xl border border-white/10 bg-black">
            <LightweightCandles
              key={`replay-${replay.engineState.symbol}-${replay.engineState.timeframe}-${replay.engineState.replayStartIndex}`}
              data={replay.visibleCandles}
              symbol={replay.engineState.symbol}
              timeframe={replay.engineState.timeframe}
              profileId={profileId}
              height={360}
              fillParent
              embedMode
              hidePatternOverlays
              replayMode
            />
          </div>
        </>
      )}

      <div data-replay-gallery className="rounded-xl border border-white/10 bg-zinc-950/70 p-3">
        <p className="mb-1 text-[10px] font-black uppercase tracking-widest text-zinc-500">Your gallery</p>
        <p className="mb-3 text-[11px] leading-relaxed text-zinc-500">
          Clips stay on this device. Share opens your phone or computer share sheet so you can post the video or save it to Photos.
        </p>
        {clips.length === 0 ? (
          <p className="text-xs text-zinc-600">No recordings yet. Load a replay, press Record, then Stop.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {clips.map((clip) => (
              <li key={clip.id} className="overflow-hidden rounded-lg border border-white/10 bg-black">
                <video
                  src={previewUrls.get(clip.id)}
                  controls
                  playsInline
                  className="aspect-video w-full bg-black"
                  aria-label={`${clip.symbol} ${clip.timeframe} replay recording`}
                />
                <div className="flex flex-wrap items-center justify-between gap-2 px-2 py-2">
                  <span className="font-mono text-[10px] text-zinc-400">
                    {clip.symbol} {clip.timeframe} · {new Date(clip.createdAt).toLocaleString()}
                  </span>
                  <span className="flex gap-2">
                    <button type="button" className="replay-btn" onClick={() => void shareClip(clip)}>Share</button>
                    <button type="button" className="replay-btn" onClick={() => void removeClip(clip.id)}>Remove</button>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style>{`
        .replay-btn {
          border-radius: 0.5rem;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(0,0,0,0.7);
          padding: 0.35rem 0.65rem;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: #d4d4d8;
        }
        .replay-btn:hover { border-color: rgba(0,229,255,0.45); color: #67e8f9; }
        .replay-btn-primary {
          border-color: rgba(0,229,255,0.45);
          background: rgba(0,229,255,0.12);
          color: #67e8f9;
        }
      `}</style>
    </section>
  );
}
