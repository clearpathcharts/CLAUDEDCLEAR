import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Headphones,
  Pause,
  Play,
  Radio,
  Search,
  SkipBack,
  SkipForward,
  Tv,
  Volume2,
  Loader2,
} from 'lucide-react';
import { YwcSectionTitle } from './YwcLavaPanel';
import { useAudioVisualizer } from '../../hooks/useAudioVisualizer';
import {
  LIVE_STREAM_SOURCES,
  MEDIA_DRAWERS,
  PANTRY_CHANNELS,
  type MediaDrawerId,
} from '../../cpms/mediaPantryCatalog';
import { bindVideoSource } from '../../lib/cpms/hlsPlayer';

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  audioUrl: string;
  publishedAt: string;
  duration?: string;
  imageUrl?: string;
  showTitle?: string;
  feedUrl: string;
}

interface PodcastSearchHit {
  id: number;
  title: string;
  author?: string;
  description?: string;
  feedUrl: string;
  image?: string;
}

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

/** CPMS Media Pantry — SiriusXM-style radio + live TV + open podcast search. */
export function CpmsMediaPantry() {
  const [drawer, setDrawer] = useState<MediaDrawerId>('radio');
  const [channelId, setChannelId] = useState(PANTRY_CHANNELS[0].id);
  const [showId, setShowId] = useState(PANTRY_CHANNELS[0].shows[0].id);
  const [feedUrl, setFeedUrl] = useState(PANTRY_CHANNELS[0].shows[0].feedUrl);
  const [overrideShow, setOverrideShow] = useState<{ title: string; host?: string } | null>(null);
  const [episodes, setEpisodes] = useState<PodcastEpisode[]>([]);
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [loadingEpisodes, setLoadingEpisodes] = useState(false);
  const [episodeError, setEpisodeError] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(72);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(false);

  const [liveId, setLiveId] = useState(LIVE_STREAM_SOURCES[0].id);
  const [searchQuery, setSearchQuery] = useState('forex trading');
  const [searchResults, setSearchResults] = useState<PodcastSearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchNote, setSearchNote] = useState<string | null>(null);
  const [searchSource, setSearchSource] = useState<'itunes' | 'podcastindex'>('itunes');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const liveVideoRef = useRef<HTMLVideoElement | null>(null);
  const [liveError, setLiveError] = useState<string | null>(null);
  const bars = useAudioVisualizer(audioRef, isPlaying && drawer === 'radio');

  const channel = useMemo(
    () => PANTRY_CHANNELS.find((c) => c.id === channelId) ?? PANTRY_CHANNELS[0],
    [channelId]
  );

  const show = useMemo(
    () => channel.shows.find((s) => s.id === showId) ?? channel.shows[0],
    [channel, showId]
  );

  const displayShow = overrideShow ?? { title: show.title, host: show.host };

  const liveSource = useMemo(
    () => LIVE_STREAM_SOURCES.find((s) => s.id === liveId) ?? LIVE_STREAM_SOURCES[0],
    [liveId]
  );

  const currentEpisode = episodes[episodeIndex] ?? null;
  const nextEpisode = episodes[episodeIndex + 1];

  const loadEpisodes = useCallback(async (feedUrl: string) => {
    setLoadingEpisodes(true);
    setEpisodeError(null);
    try {
      const res = await fetch(`/api/podcast/episodes?feedUrl=${encodeURIComponent(feedUrl)}&limit=15`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load episodes');
      setEpisodes(data.episodes ?? []);
      setEpisodeIndex(0);
    } catch (e: unknown) {
      setEpisodes([]);
      setEpisodeError(e instanceof Error ? e.message : 'Could not load episodes');
    } finally {
      setLoadingEpisodes(false);
    }
  }, []);

  useEffect(() => {
    if (drawer !== 'radio') return;
    loadEpisodes(feedUrl);
  }, [drawer, feedUrl, loadEpisodes]);

  // Direct Bloomberg HLS in the live drawer — never YouTube.
  useEffect(() => {
    if (drawer !== 'live') return;
    const el = liveVideoRef.current;
    if (!el || !liveSource.hlsUrl) return;
    setLiveError(null);
    return bindVideoSource(el, liveSource.hlsUrl, {
      autoPlay: true,
      onError: () => setLiveError('Live stream unavailable. Try another Bloomberg channel.'),
    });
  }, [drawer, liveSource.id, liveSource.hlsUrl]);

  useEffect(() => {
    fetch('/api/podcast/status')
      .then((r) => r.json())
      .then((d) => setSearchSource(d.searchSource === 'podcastindex' ? 'podcastindex' : 'itunes'))
      .catch(() => setSearchSource('itunes'));
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;
    audio.src = currentEpisode.audioUrl;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentEpisode?.id, currentEpisode?.audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume / 100;
    }
  }, [volume]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio || !currentEpisode) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));
    }
  };

  const skip = (dir: -1 | 1) => {
    if (episodes.length === 0) return;
    setEpisodeIndex((i) => (i + dir + episodes.length) % episodes.length);
    setIsPlaying(true);
  };

  const runSearch = async () => {
    setSearching(true);
    setSearchNote(null);
    try {
      const res = await fetch(`/api/podcast/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Search failed');
      setSearchResults(data.results ?? []);
      if (data.source === 'podcastindex' || data.source === 'itunes') {
        setSearchSource(data.source);
      }
      if (data.note) setSearchNote(data.note);
    } catch (e: unknown) {
      setSearchResults([]);
      setSearchNote(e instanceof Error ? e.message : 'Search unavailable');
    } finally {
      setSearching(false);
    }
  };

  const statusLabel = buffering
    ? 'BUFFERING'
    : isPlaying
      ? 'PLAYING'
      : currentEpisode
        ? 'PAUSED'
        : 'STANDBY';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#FF1493]/25 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {drawer === 'live' ? (
            <Tv size={17} className="text-[#FF4500] drop-shadow-[0_0_8px_#FF4500]" />
          ) : (
            <Headphones size={17} className="text-[#FF4500] drop-shadow-[0_0_8px_#FF4500]" />
          )}
          <YwcSectionTitle className="text-xs tracking-widest">
            CPMS MEDIA PANTRY
          </YwcSectionTitle>
        </div>
        <span className="text-[9px] font-mono font-bold uppercase px-2 py-0.5 rounded border border-[#FF4500]/40 text-[#FF4500] bg-[#FF4500]/10">
          {statusLabel}
        </span>
      </div>

      {/* Drawer tabs — filing cabinet */}
      <div className="flex gap-1.5 flex-wrap">
        {MEDIA_DRAWERS.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => setDrawer(d.id)}
            className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
              drawer === d.id
                ? 'bg-gradient-to-r from-[#FF0080] to-[#FF4500] text-black shadow-[0_0_14px_rgba(255,69,0,0.45)]'
                : 'border border-white/10 bg-black/50 text-zinc-400 hover:border-[#FF1493]/40 hover:text-white'
            }`}
            title={d.hint}
          >
            {d.label}
          </button>
        ))}
      </div>

      {drawer === 'radio' && (
        <>
          <div className="space-y-2">
            <p className="text-[9px] font-mono text-[#FFB3D9] uppercase tracking-widest">Channel</p>
            <div className="flex gap-1.5 overflow-x-auto custom-scrollbar pb-1">
              {PANTRY_CHANNELS.map((ch) => (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => {
                    setChannelId(ch.id);
                    setShowId(ch.shows[0].id);
                    setFeedUrl(ch.shows[0].feedUrl);
                    setOverrideShow(null);
                  }}
                  className={`shrink-0 px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wide whitespace-nowrap ${
                    channelId === ch.id
                      ? 'bg-[#FF1493]/25 border border-[#FF1493] text-white'
                      : 'border border-white/10 text-zinc-500 hover:text-[#FF4500]'
                  }`}
                >
                  {ch.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-zinc-400 leading-snug">{channel.tagline}</p>
          </div>

          <div className="flex gap-1.5 flex-wrap">
            {channel.shows.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setShowId(s.id);
                  setFeedUrl(s.feedUrl);
                  setOverrideShow(null);
                }}
                className={`px-2 py-1 rounded-lg text-[9px] font-mono border transition-all ${
                  showId === s.id && !overrideShow
                    ? 'border-[#00E5FF]/50 bg-[#00E5FF]/10 text-[#00E5FF]'
                    : 'border-white/10 text-zinc-500 hover:text-white'
                }`}
              >
                {s.title}
                {s.cadence ? ` · ${s.cadence}` : ''}
              </button>
            ))}
          </div>

          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#FF1493]/20 flex flex-col justify-between p-3 min-h-[180px]">
            {currentEpisode?.imageUrl && (
              <img
                src={currentEpisode.imageUrl}
                alt=""
                className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none"
                referrerPolicy="no-referrer"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-black/40 pointer-events-none" />

            <div className="relative z-10 space-y-1">
              <span className="text-[8px] font-mono text-[#FF4500] font-bold uppercase">
                {displayShow.title}
                {displayShow.host ? ` · ${displayShow.host}` : ''}
              </span>
              <p className="text-[11px] font-bold text-white line-clamp-2 leading-snug">
                {loadingEpisodes ? 'Loading episodes…' : currentEpisode?.title ?? 'No episodes'}
              </p>
              {currentEpisode && (
                <p className="text-[9px] font-mono text-zinc-400">
                  {formatDate(currentEpisode.publishedAt)}
                  {nextEpisode ? ` · Next: ${nextEpisode.title.slice(0, 40)}…` : ''}
                </p>
              )}
            </div>

            <div className="relative z-10 space-y-1">
              <div className="flex items-end justify-center gap-[2px] h-10 px-2">
                {bars.map((h, i) => (
                  <div
                    key={i}
                    className="w-1 rounded-t transition-all duration-75"
                    style={{
                      height: `${h}%`,
                      backgroundColor: i % 2 === 0 ? '#ff4500' : '#ff0080',
                      boxShadow: isPlaying ? '0 0 6px rgba(255,69,0,0.5)' : undefined,
                    }}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[8px] font-mono text-zinc-500 bg-black/80 px-2 py-1 rounded">
                <span>{formatTime(currentTime)}</span>
                <span>{episodeError ? 'FEED ERROR' : 'REAL AUDIO · RSS'}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>

          <audio
            ref={audioRef}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onWaiting={() => setBuffering(true)}
            onCanPlay={() => setBuffering(false)}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            onEnded={() => {
              if (episodeIndex < episodes.length - 1) {
                setEpisodeIndex((i) => i + 1);
                setIsPlaying(true);
              } else {
                setIsPlaying(false);
              }
            }}
          />

          <div className="flex items-center justify-between gap-2 bg-zinc-950/80 p-3 rounded-xl border border-[#FF1493]/20">
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => skip(-1)} className="p-2 rounded-lg border border-white/10 hover:border-[#FF4500]/50 text-zinc-400 hover:text-white" aria-label="Previous episode">
                <SkipBack size={14} />
              </button>
              <button
                type="button"
                onClick={togglePlay}
                disabled={!currentEpisode || loadingEpisodes}
                className="p-2 rounded-lg bg-gradient-to-r from-[#FF0080] to-[#FF4500] text-black font-black disabled:opacity-40"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              </button>
              <button type="button" onClick={() => skip(1)} className="p-2 rounded-lg border border-white/10 hover:border-[#FF4500]/50 text-zinc-400 hover:text-white" aria-label="Next episode">
                <SkipForward size={14} />
              </button>
            </div>
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <Volume2 size={13} className="text-zinc-500 shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                className="w-full accent-[#FF4500]"
                title="Volume"
              />
            </div>
          </div>
        </>
      )}

      {drawer === 'live' && (
        <>
          <div className="flex gap-1.5 flex-wrap">
            {LIVE_STREAM_SOURCES.map((src) => (
              <button
                key={src.id}
                type="button"
                onClick={() => setLiveId(src.id)}
                className={`px-2 py-1 rounded-lg text-[9px] font-mono border ${
                  liveId === src.id
                    ? 'border-[#00E5FF]/50 bg-cyan-950/20 text-[#00E5FF]'
                    : 'border-white/10 text-zinc-500 hover:text-white'
                }`}
              >
                {src.label}
              </button>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 leading-relaxed">{liveSource.description}</p>
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-[#FF1493]/20">
            {liveError && (
              <div className="absolute inset-x-2 top-2 z-10 rounded-lg border border-red-500/30 bg-red-950/80 px-2 py-1.5 text-[9px] font-mono text-red-200">
                {liveError}
              </div>
            )}
            <video
              ref={liveVideoRef}
              title={liveSource.label}
              className="absolute inset-0 w-full h-full object-contain"
              playsInline
              muted
              controls
            />
          </div>
          <p className="text-[8px] font-mono text-zinc-500 leading-relaxed">
            Direct {liveSource.network} HLS stream — ClearPath does not embed YouTube.
          </p>
        </>
      )}

      {drawer === 'pantry' && (
        <>
          <p className="text-[10px] text-zinc-400">
            Search podcasts by topic — works now via Apple&apos;s open directory (no signup). Optional Podcast Index keys unlock the independent directory too.
          </p>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              runSearch();
            }}
          >
            <div className="relative flex-1">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="forex, macro, ADHD, politics…"
                className="w-full bg-black border border-white/10 rounded-lg py-2 pl-8 pr-2 text-xs text-white focus:border-[#FF4500] outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-2 rounded-lg bg-gradient-to-r from-[#FF0080] to-[#FF4500] text-black text-[10px] font-black uppercase flex items-center gap-1"
            >
              {searching ? <Loader2 size={12} className="animate-spin" /> : <Radio size={12} />}
              Search
            </button>
          </form>
          {searchSource === 'itunes' && (
            <p className="text-[9px] font-mono text-zinc-500 border border-white/10 bg-black/30 rounded-lg p-2">
              Using Apple podcast search (no API key). Podcast Index blocks Gmail signups — use a domain email like you@clearpathtrader.com if you want their open directory later.
            </p>
          )}
          {searchNote && <p className="text-[9px] font-mono text-zinc-500">{searchNote}</p>}
          <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
            {searchResults.map((hit) => (
              <button
                key={hit.id}
                type="button"
                onClick={() => {
                  setDrawer('radio');
                  setFeedUrl(hit.feedUrl);
                  setOverrideShow({ title: hit.title, host: hit.author });
                  setIsPlaying(true);
                }}
                className="w-full text-left p-2 rounded-lg border border-white/10 bg-black/40 hover:border-[#FF1493]/40 transition-all"
              >
                <p className="text-[10px] font-bold text-white">{hit.title}</p>
                {hit.author && <p className="text-[9px] text-zinc-500">{hit.author}</p>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
