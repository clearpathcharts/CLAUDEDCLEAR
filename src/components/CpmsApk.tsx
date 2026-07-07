import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Tv, 
  Play, 
  VolumeX, 
  Volume2, 
  SlidersHorizontal, 
  Database, 
  Radio, 
  Plus, 
  Trash, 
  Edit, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Award, 
  Search, 
  RotateCcw,
  Sparkles,
  Info,
  Clock,
  ExternalLink,
  Sliders,
  LogOut,
  Maximize2
} from 'lucide-react';
import { useAuth } from '../contexts/FirebaseContext';
import { db, collection, addDoc, getDocs, deleteDoc, updateDoc, doc, onSnapshot } from '../firebase';
import {
  type CpmsVideoItem,
  type CpmsChannelItem,
  SAMPLE_LIBRARY_VIDEOS,
  STATIC_DEFAULT_CHANNELS,
  CPMS_CURATOR,
  CPMS_FOUNDER_EMAIL,
} from '../cpms/cpmsCatalog';
import { bindVideoSource } from '../lib/cpms/hlsPlayer';
import { uploadCpmsMedia } from '../lib/cpms/uploadMedia';
import { openCpmsTv } from '../lib/cpms/openCpmsTv';

type VideoItem = CpmsVideoItem;
type ChannelItem = CpmsChannelItem;

export default function CpmsApk() {
  const { user, userProfile } = useAuth();
  
  // PRIMARY STATES
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<ChannelItem[]>([]);
  const [loadingVideos, setLoadingVideos] = useState<boolean>(true);
  const [loadingChannels, setLoadingChannels] = useState<boolean>(true);
  
  // IMMERSIVE LAYOUT STATES
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRowCategory, setSelectedRowCategory] = useState<string>("All Categories");
  const [continueWatching, setContinueWatching] = useState<VideoItem[]>([]);
  const [fontScale, setFontScale] = useState<number>(1.0);
  
  // FOUNDER ADMINISTRATION ACCESS STATES
  const [isCabinetOpen, setIsCabinetOpen] = useState<boolean>(false);
  const [cabinetTab, setCabinetTab] = useState<'videos' | 'channels'>('videos');
  
  // MEDIA CABINET FORM VARIABLES
  const [newTitle, setNewTitle] = useState<string>("");
  const [newDescription, setNewDescription] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>("Finance TV");
  const [newVideoUrl, setNewVideoUrl] = useState<string>("");
  const [newThumbnailUrl, setNewThumbnailUrl] = useState<string>("");
  const [newDuration, setNewDuration] = useState<string>("05:30");
  const [newIndicator, setNewIndicator] = useState<string>("General");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  // CABINET CHANNEL EDIT VARIABLES
  const [channelName, setChannelName] = useState<string>("");
  const [channelDescription, setChannelDescription] = useState<string>("");
  const [channelThumbnailUrl, setChannelThumbnailUrl] = useState<string>("");
  const [editingChannelId, setEditingChannelId] = useState<string | null>(null);

  // CINEMATIC VIDEO PLAYER STATE
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoPlaying, setVideoPlaying] = useState<boolean>(true);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [volume, setVolume] = useState<number>(85);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isPlaybackFinished, setIsPlaybackFinished] = useState<boolean>(false);

  // CHECKS IF USER IS GIVEN ACCESS TO CABINET CREATION
  // SECURITY: locked to the founder's real account only. No client-side bypass exists anymore.
  const isUserAuthorized = () => {
    if (user?.email === CPMS_FOUNDER_EMAIL) return true;
    if (userProfile?.email === CPMS_FOUNDER_EMAIL) return true;
    return false;
  };

  // LOAD RECENTLY WATCHED STREAMS ON MOUNT
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cpms_continue_watching');
      if (stored) {
        setContinueWatching(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Storage access rejected:", e);
    }
  }, []);

  // LOAD VIDEOS FROM FIRESTORE OR FALLBACK
  useEffect(() => {
    setLoadingVideos(true);
    const colRef = collection(db, 'cpms_videos');
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        console.log("No remote tracks found. Seeding beautiful CPMS library sample...");
        seedDbWithVideos();
      } else {
        const list: VideoItem[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as VideoItem);
        });
        setVideos(list);
        setLoadingVideos(false);
      }
    }, (error) => {
      console.warn("Dynamic cloud sync disabled, engaging beautiful pre-seeded database:", error);
      setVideos(SAMPLE_LIBRARY_VIDEOS);
      setLoadingVideos(false);
    });

    return () => unsubscribe();
  }, []);

  // LOAD CHANNELS FROM FIRESTORE OR FALLBACK
  useEffect(() => {
    setLoadingChannels(true);
    const colRef = collection(db, 'cpms_channels');
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      if (snapshot.empty) {
        console.log("No channels found. Seeding standard cinema categories...");
        seedDbWithChannels();
      } else {
        const list: ChannelItem[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as ChannelItem);
        });
        list.sort((a, b) => a.name.localeCompare(b.name));
        setChannels(list);
        setLoadingChannels(false);
      }
    }, (error) => {
      console.warn("Using offline premium channels hierarchy:", error);
      const mapped = STATIC_DEFAULT_CHANNELS.map((ch, idx) => ({
        id: `offline-ch-${idx}`,
        ...ch,
        createdAt: new Date().toISOString(),
        createdBy: CPMS_CURATOR
      }));
      setChannels(mapped);
      setLoadingChannels(false);
    });

    return () => unsubscribe();
  }, []);

  // SEED FUNCTIONS ENABLING AUTOMATIC HIGH-STAKES POPULATION
  const seedDbWithVideos = async () => {
    try {
      const colRef = collection(db, 'cpms_videos');
      for (const item of SAMPLE_LIBRARY_VIDEOS) {
        await addDoc(colRef, item);
      }
    } catch (err) {
      console.error("Could not write seed packs:", err);
      setVideos(SAMPLE_LIBRARY_VIDEOS);
    }
  };

  const seedDbWithChannels = async () => {
    try {
      const colRef = collection(db, 'cpms_channels');
      for (const item of STATIC_DEFAULT_CHANNELS) {
        await addDoc(colRef, {
          ...item,
          createdAt: new Date().toISOString(),
          createdBy: CPMS_CURATOR
        });
      }
    } catch (err) {
      console.error("Could not write channels seed pack:", err);
    }
  };

  // HANDLE RECENT CONTINUED WATCHING LIST
  const addToContinueWatching = (vid: VideoItem) => {
    setContinueWatching((prev) => {
      const filtered = prev.filter(v => v.title !== vid.title);
      const updated = [vid, ...filtered].slice(0, 4); // Keep recent 4 tracks
      try {
        localStorage.setItem('cpms_continue_watching', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // VIDEO PLAYBACK TIME HANDLERS
  const updateTime = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const loadMetadata = () => {
    if (videoRef.current) {
      setVideoDuration(videoRef.current.duration);
      setVideoPlaying(true);
      setIsPlaybackFinished(false);
    }
  };

  const handleVideoEnded = () => {
    setVideoPlaying(false);
    setIsPlaybackFinished(true);
  };

  const formatTimelineTime = (seconds: number) => {
    if (isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSeekBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (videoRef.current && videoDuration > 0) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const clickedPercentage = clickX / width;
      const newTime = clickedPercentage * videoDuration;
      videoRef.current.currentTime = newTime;
      setCurrentTime(newTime);
      setIsPlaybackFinished(false);
    }
  };

  // AUDIO VOLUME CONTROLS
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume / 100;
    }
  }, [volume, isMuted, selectedVideo]);

  // HLS / progressive stream binding (cleans up on video change or unmount)
  useEffect(() => {
    const url = selectedVideo?.videoUrl;
    const el = videoRef.current;
    if (!url || !el) return;

    setCurrentTime(0);
    setVideoDuration(0);
    setIsPlaybackFinished(false);

    const cleanup = bindVideoSource(el, url, {
      autoPlay: true,
      onReady: () => {
        setVideoPlaying(true);
        setIsPlaybackFinished(false);
      },
    });

    return cleanup;
  }, [selectedVideo?.id, selectedVideo?.videoUrl]);

  // CATEGORY LIST SELECTION
  const getCategoriesList = () => {
    const list = channels.map(c => c.name);
    if (list.length === 0) return ["Finance TV", "Indicator TV", "Trading Anarchy TV", "Market News TV", "Documentary TV"];
    return list;
  };

  // VIDEO METADATA PUBLISH ACTION
  const handleMediaFileUpload = async (
    file: File,
    folder: 'videos' | 'thumbnails',
    applyUrl: (url: string) => void
  ) => {
    setUploadProgress(0);
    try {
      const url = await uploadCpmsMedia(file, folder, setUploadProgress);
      applyUrl(url);
      setUploadProgress(null);
    } catch (err) {
      console.error(err);
      setUploadProgress(null);
      alert('Upload failed. Sign in as the founder account and deploy storage.rules.');
    }
  };

  const handleAddNewVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newVideoUrl.trim()) {
      alert("Please specify a title and valid streaming link.");
      return;
    }

    setUploadProgress(25);
    const payload: VideoItem = {
      title: newTitle.trim(),
      description: newDescription.trim() || "ClearPath Markets Science masterclass archive stream.",
      category: newCategory,
      videoUrl: newVideoUrl.trim(),
      thumbnailUrl: newThumbnailUrl.trim() || "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
      duration: newDuration || "08:15",
      uploadedAt: new Date().toISOString(),
      uploadedBy: user?.displayName || user?.email || "Founder Administrator",
      relatedIndicatorId: newIndicator || "General"
    };

    try {
      setUploadProgress(70);
      const colRef = collection(db, 'cpms_videos');
      await addDoc(colRef, payload);
      setUploadProgress(100);

      // Clean inputs
      setNewTitle("");
      setNewDescription("");
      setNewVideoUrl("");
      setNewThumbnailUrl("");
      setNewDuration("10:00");
      setNewIndicator("General");

      setTimeout(() => {
        setUploadProgress(null);
        alert("Cinematic catalog updated successfully ✓ Saved to Firestore.");
      }, 500);

    } catch (err) {
      console.error(err);
      setUploadProgress(null);
      alert("Failed to write video record. Make sure you are authorized or signed in.");
    }
  };

  // CHANNEL REGISTRATION ACTION
  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelName.trim()) return;

    const payload = {
      name: channelName.trim(),
      description: channelDescription.trim() || "Archival network feed.",
      thumbnailUrl: channelThumbnailUrl.trim() || "linear-gradient(135deg, #020205 0%, #172554 100%)",
      createdAt: new Date().toISOString(),
      createdBy: user?.displayName || user?.email || "Founder Director"
    };

    try {
      if (editingChannelId) {
        const docRef = doc(db, 'cpms_channels', editingChannelId);
        await updateDoc(docRef, {
          name: payload.name,
          description: payload.description,
          thumbnailUrl: payload.thumbnailUrl
        });
        alert("Broadcast channel modified ✓");
        setEditingChannelId(null);
      } else {
        const colRef = collection(db, 'cpms_channels');
        await addDoc(colRef, payload);
        alert("New broadcast category initialized ✓");
      }
      setChannelName("");
      setChannelDescription("");
      setChannelThumbnailUrl("");
    } catch (err) {
      console.error(err);
      alert("Error logging dynamic channel coordinates.");
    }
  };

  // PURGE DYNAMIC ELEMENTS
  const handleDeleteVideo = async (id: string, name: string) => {
    if (!window.confirm(`Permanently drop "${name}" from the CPMS streaming catalog?`)) return;
    try {
      await deleteDoc(doc(db, 'cpms_videos', id));
      alert("Stream dropped.");
    } catch (err) {
      console.error(err);
      alert("Database error dropping file.");
    }
  };

  const handleDeleteChannel = async (id: string, name: string) => {
    if (!window.confirm(`Permanently wipe the category channel "${name}"? This removes its dedicated row in the cinema theater layout.`)) return;
    try {
      await deleteDoc(doc(db, 'cpms_channels', id));
      alert("Category wiped mapping.");
    } catch (err) {
      console.error(err);
      alert("Wipe failed.");
    }
  };

  // FONT RESPONSIVENESS SCALER
  const getScaledText = (size: number) => {
    return {
      fontSize: `${size * fontScale}rem`,
      lineHeight: `${size * fontScale * 1.3}rem`
    };
  };

  // FILTER CHANNELS & VIDEOS ON THE FLY USING SUBSCRIBER SEARCH
  const filteredVideos = videos.filter(vid => {
    const matchesSearch = 
      vid.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vid.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
      vid.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vid.relatedIndicatorId.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedRowCategory === "All Categories") return matchesSearch;
    return vid.category === selectedRowCategory && matchesSearch;
  });

  // GET A SUITABLE FEATURED HERO VIDEO FOR THE LUXURY BILLBOARD
  const getHeroVideo = () => {
    const featured = videos.find(v => v.title.includes("Debt") || v.category === "Documentary TV");
    return featured || videos[0] || SAMPLE_LIBRARY_VIDEOS[0];
  };

  const hero = getHeroVideo();

  return (
    <div className="p-4 md:p-8 bg-[#020203] text-white min-h-screen relative font-sans selection:bg-amber-400 selection:text-black overflow-x-hidden" id="cpms-streaming-hub">
      
      {/* SOFT LUXURY NEON LIGHTS & DEEP GRADIET ACCENTS */}
      <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,#1e153a_0%,transparent_70%)] pointer-events-none" />
      <div className="absolute top-[10%] left-[-100px] w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[-100px] w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[180px] pointer-events-none" />
      
      <div className="relative z-10 max-w-7xl mx-auto space-y-10">
        
        {/* --- LUXURY BRAND HEADER BAR --- */}
        <header className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/[0.04] pb-6">
          <div className="flex items-center gap-4 text-left">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-indigo-600 p-[1px] shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <div className="w-full h-full bg-black rounded-[15px] flex items-center justify-center">
                <Tv className="w-6 h-6 text-amber-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-black text-amber-500 tracking-[0.3em] uppercase">CPMS PRIVATE STATION</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <h1 className="text-2xl md:text-3xl font-cinzel font-black tracking-wide bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                CLEARPATH <span className="text-amber-400 italic">CINEMA</span>
              </h1>
            </div>
          </div>

          {/* FILTER SEARCH & CAB PANEL */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* SEARCH INPUT BAR */}
            <div className="relative flex-grow md:flex-grow-0 md:w-64">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search premium libraries..."
                className="w-full bg-zinc-900/60 border border-white/5 focus:border-amber-500/30 rounded-full pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 outline-none transition-all font-semibold"
              />
            </div>

            {/* LAUNCH FULL IPTV (news / live TV channels) */}
            <button
              type="button"
              onClick={() => openCpmsTv('home')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-cyan-500/40 bg-cyan-950/30 hover:bg-cyan-900/40 text-cyan-300 text-xs font-mono font-black tracking-wider transition-all cursor-pointer shadow-[0_0_12px_rgba(0,229,255,0.12)]"
              title="Open CPMS TV — live news & IPTV channel directory"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Launch CPMS TV</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            {/* SCREEN SCALER */}
            <div className="flex items-center gap-1 bg-zinc-900/60 border border-white/5 rounded-full p-1 select-none text-[10px] font-mono text-zinc-400">
              <button 
                onClick={() => setFontScale(prev => Math.max(0.8, prev - 0.1))} 
                className="px-2 py-1 rounded-full hover:bg-white/5 cursor-pointer"
                title="Decrease Font Size"
              >
                A-
              </button>
              <span className="px-1.5 font-bold">{Math.round(fontScale * 100)}%</span>
              <button 
                onClick={() => setFontScale(prev => Math.min(1.4, prev + 0.1))} 
                className="px-2 py-1 rounded-full hover:bg-white/5 cursor-pointer"
                title="Increase Font Size"
              >
                A+
              </button>
            </div>

            {/* ADMINISTRATION CABINET SWITCH - only visible to authorized founder account */}
            {isUserAuthorized() && (
              <button
                onClick={() => setIsCabinetOpen(!isCabinetOpen)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border text-xs font-mono tracking-wider transition-all duration-300 cursor-pointer ${
                  isCabinetOpen 
                    ? "bg-amber-950/40 text-amber-400 border-amber-500/40" 
                    : "bg-zinc-900 hover:bg-zinc-850 hover:border-amber-500/10 text-zinc-300 border-white/5"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isCabinetOpen ? "Close Cabinet" : "Media Cabinet"}</span>
              </button>
            )}
          </div>
        </header>

        {/* --- COLLAPSIBLE MEDIA CABINET (ADMIN SECTION, FOUNDER-ONLY) --- */}
        <AnimatePresence>
          {isCabinetOpen && isUserAuthorized() && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border border-white/5 rounded-3xl bg-[#09090b] text-left relative"
            >
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-base font-cinzel font-black tracking-wide text-amber-400">
                      CPMS PRIVATE CABINET REGISTER
                    </h3>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase mt-1">
                      Direct asset streaming manager mapped to secure Firestore partitions.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-black/40 p-2 rounded-full border border-white/5 select-none">
                    <span className="text-[10px] font-mono text-emerald-400 font-bold px-3">
                      AUTHORIZED ✓ FOUNDER ACCOUNT
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs font-semibold">
                  
                  {/* CABINET SELECTION TABS */}
                  <div className="lg:col-span-12 flex gap-2 border-b border-white/5 pb-3">
                    <button
                      onClick={() => setCabinetTab('videos')}
                      className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                        cabinetTab === 'videos' ? "bg-amber-400 text-black" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      🎞️ Stream Inventory ({videos.length})
                    </button>
                    <button
                      onClick={() => setCabinetTab('channels')}
                      className={`px-4 py-2 rounded-full font-mono text-[10px] uppercase font-black tracking-wider transition-all cursor-pointer ${
                        cabinetTab === 'channels' ? "bg-amber-400 text-black" : "text-zinc-400 hover:text-white"
                      }`}
                    >
                      📺 Broadcast Categories ({channels.length})
                    </button>
                  </div>

                  {cabinetTab === 'videos' ? (
                    <>
                      {/* INPUT UPLOAD FORM */}
                      <form onSubmit={handleAddNewVideo} className="lg:col-span-5 space-y-4 bg-zinc-950/60 p-5 rounded-2xl border border-white/5 text-zinc-300">
                        <h4 className="font-mono text-[10px] font-black uppercase text-amber-400">PUBLISH DYNAMIC BROADCAST CLIP</h4>
                        
                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Clip Title</label>
                          <input
                            type="text"
                            required
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. Federal Reserve Corridor Expansion"
                            className="w-full bg-zinc-900 border border-zinc-800/80 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Category</label>
                            <select
                              value={newCategory}
                              onChange={(e) => setNewCategory(e.target.value)}
                              className="w-full bg-zinc-900 border border-zinc-800/80 focus:border-amber-400/30 rounded-xl px-2 py-2 text-xs text-white outline-none"
                            >
                              {getCategoriesList().map(catName => (
                                <option key={catName} value={catName}>{catName}</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Duration Tag</label>
                            <input
                              type="text"
                              required
                              value={newDuration}
                              onChange={(e) => setNewDuration(e.target.value)}
                              placeholder="09:12"
                              className="w-full bg-zinc-900 border border-zinc-800/80 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white text-center font-mono"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Stream File URL (Direct MP4, WEBM, or HLS M3U8)</label>
                          <input
                            type="url"
                            required
                            value={newVideoUrl}
                            onChange={(e) => setNewVideoUrl(e.target.value)}
                            placeholder="https://example.com/stream.m3u8 or .mp4"
                            className="w-full bg-zinc-900 border border-zinc-800/80 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white font-mono text-[11px]"
                          />
                          <label className="inline-flex items-center gap-2 mt-1 text-[10px] font-mono text-amber-500/80 uppercase cursor-pointer hover:text-amber-400">
                            <input
                              type="file"
                              accept="video/*,video/mp4,video/webm,.m3u8"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) void handleMediaFileUpload(file, 'videos', setNewVideoUrl);
                                e.target.value = '';
                              }}
                            />
                            <span>↑ Upload video file to Storage</span>
                          </label>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Thumbnail Image URL</label>
                            <input
                              type="text"
                              value={newThumbnailUrl}
                              onChange={(e) => setNewThumbnailUrl(e.target.value)}
                              placeholder="https://unsplash.com/..."
                              className="w-full bg-zinc-900 border border-zinc-800/80 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white"
                            />
                            <label className="inline-flex items-center gap-2 mt-1 text-[10px] font-mono text-amber-500/80 uppercase cursor-pointer hover:text-amber-400">
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) void handleMediaFileUpload(file, 'thumbnails', setNewThumbnailUrl);
                                  e.target.value = '';
                                }}
                              />
                              <span>↑ Upload thumbnail</span>
                            </label>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Linked Indicator Metric</label>
                            <input
                              type="text"
                              value={newIndicator}
                              onChange={(e) => setNewIndicator(e.target.value)}
                              placeholder="e.g. RSI Calibration"
                              className="w-full bg-zinc-900 border border-zinc-800/80 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white"
                            />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Summary & Objectives Description</label>
                          <textarea
                            value={newDescription}
                            onChange={(e) => setNewDescription(e.target.value)}
                            placeholder="Deep objectives explanation regarding swap lines and liquidity corridors..."
                            rows={3}
                            className="w-full bg-zinc-900 border border-zinc-800/80 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white font-medium resize-none"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-black font-mono font-black text-[11px] uppercase tracking-wider rounded-xl cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)] transition-all"
                        >
                          {uploadProgress !== null ? `PUBLISHING (${uploadProgress}%)` : "PUBLISH TO STREAM DIRECTORY"}
                        </button>
                      </form>

                      {/* LIST REGISTERED SLOTS */}
                      <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h4 className="font-mono text-[10px] font-black uppercase text-zinc-400 border-b border-white/5 pb-2">ACTIVE REGISTERED DIRECTORY</h4>
                          <div className="space-y-2 max-h-[360px] overflow-y-auto custom-scrollbar pr-1">
                            {videos.map(v => (
                              <div key={v.id || v.title} className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/40 flex items-center justify-between gap-3 text-left">
                                <div className="space-y-0.5">
                                  <span className="text-[8px] font-mono px-1.5 py-0.5 bg-zinc-800 rounded text-amber-400 font-extrabold uppercase">
                                    {v.category}
                                  </span>
                                  <h5 className="font-bold text-white text-xs">{v.title}</h5>
                                  <p className="text-[10px] text-zinc-400 truncate max-w-md line-clamp-1">{v.description}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteVideo(v.id || "", v.title)}
                                  className="p-2 bg-red-950/20 text-red-400 hover:bg-red-900 hover:text-white rounded-lg border border-red-500/10 cursor-pointer"
                                  title="Unpublish Stream"
                                >
                                  <Trash className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="p-3 bg-zinc-900/60 rounded-xl border border-white/5 text-[9px] font-mono text-zinc-500 text-center leading-normal mt-4">
                          Note: Live updates will immediately sync with the cinema sliding carousels synchronously across all active subscriber sessions.
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* MANAGE BROADCAST CHANNELS / CATEGORIES */}
                      <form onSubmit={handleAddChannel} className="lg:col-span-5 space-y-4 bg-zinc-950/60 p-5 rounded-2xl border border-white/5 text-zinc-300">
                        <h4 className="font-mono text-[10px] font-black uppercase text-amber-400">
                          {editingChannelId ? "✎ MODIFY ACTIVE BROADCAST STREAM" : "CREATE NEW CATEGORY STREAM"}
                        </h4>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Category Name</label>
                          <input
                            type="text"
                            required
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            placeholder="e.g. Sovereign Macro TV"
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Thumbnail Style (Gradient/Image Link)</label>
                          <input
                            type="text"
                            required
                            value={channelThumbnailUrl}
                            onChange={(e) => setChannelThumbnailUrl(e.target.value)}
                            placeholder="linear-gradient(...) or Unsplash absolute URL"
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white font-mono text-[10px]"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-mono text-zinc-500 uppercase block font-bold">Stream Description Summary</label>
                          <textarea
                            required
                            value={channelDescription}
                            onChange={(e) => setChannelDescription(e.target.value)}
                            placeholder="e.g. Masterclass reports mapping sovereign credit default swaps and inflation limits..."
                            rows={3}
                            className="w-full bg-zinc-900 border border-zinc-800 focus:border-amber-400/30 rounded-xl px-3 py-2 text-xs text-white resize-none"
                          />
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="submit"
                            className="flex-grow py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-mono font-black text-[10px] uppercase tracking-wider rounded-xl cursor-pointer"
                          >
                            {editingChannelId ? "SAVE STREAM ADJUSTMENTS" : "RE-MAP CINEMA STREAM"}
                          </button>
                          {editingChannelId && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChannelId(null);
                                setChannelName("");
                                setChannelDescription("");
                                setChannelThumbnailUrl("");
                              }}
                              className="px-3 bg-zinc-900 text-zinc-400 rounded-xl border border-zinc-850 cursor-pointer"
                            >
                              CANCEL
                            </button>
                          )}
                        </div>
                      </form>

                      {/* LIST ACTIVE CHANNELS */}
                      <div className="lg:col-span-7 bg-zinc-950/60 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                        <div className="space-y-3">
                          <h4 className="font-mono text-[10px] font-black uppercase text-zinc-400 border-b border-white/5 pb-2 font-bold">
                            ACTIVE CHANNELS ROWS ({channels.length})
                          </h4>
                          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                            {channels.map(chan => (
                              <div key={chan.id || chan.name} className="p-3 bg-zinc-900/40 rounded-xl border border-zinc-800/40 flex items-center justify-between gap-3 text-left">
                                <div>
                                  <span className="text-[8px] font-mono text-amber-500 font-extrabold uppercase">CREATED BY: {chan.createdBy}</span>
                                  <h5 className="font-bold text-white text-xs">{chan.name}</h5>
                                  <p className="text-[10px] text-zinc-400 max-w-sm font-medium line-clamp-1">{chan.description}</p>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingChannelId(chan.id || null);
                                      setChannelName(chan.name);
                                      setChannelDescription(chan.description);
                                      setChannelThumbnailUrl(chan.thumbnailUrl);
                                    }}
                                    className="p-1.5 bg-zinc-800 text-amber-400 hover:text-white rounded border border-white/5 cursor-pointer"
                                    title="Edit Category Details"
                                  >
                                    <Edit className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChannel(chan.id || "", chan.name)}
                                    className="p-1.5 bg-red-950/20 text-red-400 hover:bg-rose-900 rounded border border-red-500/10 cursor-pointer"
                                    title="Drop Category"
                                  >
                                    <Trash className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            if(window.confirm("Seed default high-end categories back into database?")) {
                              seedDbWithChannels();
                            }
                          }}
                          className="mt-4 py-2 bg-zinc-900/60 hover:bg-zinc-850 text-zinc-400 hover:text-white font-mono text-[9px] uppercase font-bold text-center border border-white/5 rounded-xl cursor-pointer"
                        >
                          Re-sync default high-end categories
                        </button>
                      </div>
                    </>
                  )}

                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- LUXURIOUS HERO BILLBOARD SECTION (MasterClass style) --- */}
        {hero && (
          <div 
            onClick={() => {
              setSelectedVideo(hero);
              addToContinueWatching(hero);
            }}
            className="w-full relative overflow-hidden rounded-[2.5rem] border border-white/5 bg-gradient-to-r from-black via-zinc-950/90 to-indigo-950/20 group cursor-pointer shadow-[0_20px_50px_rgba(0,0,0,0.8)] min-h-[340px] md:min-h-[460px] flex flex-col justify-end text-left relative animate-fadeIn"
          >
            {/* LARGE CLINEMATIC IMAGE BACKGROUND */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-45 group-hover:scale-105 transition-all duration-1000 transform scale-102 filter brightness-[0.7] saturate-[1.2]"
              style={{ backgroundImage: `url(${hero.thumbnailUrl})` }}
            />
            {/* STUNNING VIGNETTE & AMBIENT SOFT COLOR GLOWS */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
            <div className="absolute top-[10%] right-[10%] w-[350px] h-[350px] bg-amber-500/5 rounded-full blur-[110px] pointer-events-none" />

            <div className="relative p-6 md:p-12 space-y-4 max-w-3xl z-10">
              
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-amber-400/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono font-bold tracking-widest px-3 py-1 rounded-full uppercase flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  FEATURED LUXURY MASTERCLASS
                </span>
                <span className="bg-zinc-950/80 text-zinc-400 border border-white/5 text-[10px] font-mono font-semibold px-2.5 py-1 rounded-full">
                  {hero.duration} MINUTES
                </span>
                <span className="bg-indigo-950/80 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono font-bold px-2.5 py-1 rounded-full uppercase">
                  {hero.relatedIndicatorId}
                </span>
              </div>

              <div className="space-y-3">
                <h2 
                  className="font-cinzel font-black tracking-wide text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] hover:text-amber-300 transition-colors"
                  style={getScaledText(1.8)}
                >
                  {hero.title}
                </h2>
                <p 
                  className="text-zinc-300 font-semibold leading-relaxed drop-shadow-[0_2px_3px_rgba(0,0,0,0.8)]"
                  style={getScaledText(0.65)}
                >
                  {hero.description}
                </p>
              </div>

              {/* INTERACTIVE COMPRESSION PLAY BUTTON */}
              <div className="pt-2 flex items-center gap-4">
                <div className="px-6 py-3 bg-white hover:bg-amber-400 text-black hover:text-black font-semibold rounded-full flex items-center gap-2.5 shadow-[0_4px_20px_rgba(255,255,255,0.15)] transition-all transform group-hover:scale-105 active:scale-95 duration-300 shrink-0">
                  <Play className="w-4 h-4 fill-current text-black" />
                  <span className="text-xs uppercase font-black tracking-wider">Play Masterclass</span>
                </div>
                <span className="text-xs font-mono font-bold text-amber-500 group-hover:underline uppercase tracking-widest hidden sm:inline-block">
                  Click to launch standard cinema broadcast
                </span>
              </div>

            </div>
          </div>
        )}

        {/* --- STUNNING ENROLLMENT LIBRARY VIEWS --- */}
        <div className="space-y-12">
          
          {/* SEARCH METRIC HEADER BAR */}
          {searchQuery && (
            <div className="text-left font-mono border-b border-white/5 pb-2">
              <span className="text-xs text-zinc-400">
                DISCOVERED <span className="text-amber-400 font-bold">{filteredVideos.length}</span> STREAMS MATCHING "{searchQuery}"
              </span>
            </div>
          )}

          {/* DYNAMIC CATEGORY PICKER BAR */}
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-white/[0.04]">
            <button
              onClick={() => setSelectedRowCategory("All Categories")}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                selectedRowCategory === "All Categories" 
                  ? "bg-amber-400 text-black font-extrabold shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white"
              }`}
            >
              All Library Streams ({videos.length})
            </button>
            {getCategoriesList().map(catName => (
              <button
                key={catName}
                onClick={() => setSelectedRowCategory(catName)}
                className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  selectedRowCategory === catName
                    ? "bg-amber-400 text-black font-extrabold shadow-[0_2px_10px_rgba(245,158,11,0.2)]"
                    : "bg-zinc-900/60 text-zinc-400 hover:text-white"
                }`}
              >
                {catName} ({videos.filter(v => v.category === catName).length})
              </button>
            ))}
          </div>

          {/* --- CONTINUE WATCHING SECTION --- */}
          {continueWatching.length > 0 && !searchQuery && (
            <div className="space-y-4 text-left">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <h3 className="font-cinzel text-sm uppercase font-black tracking-widest text-[#f5f5f7]">
                  Continue Watching
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {continueWatching.map((item, index) => (
                  <div
                    key={`continue-watch-${index}`}
                    onClick={() => {
                      setSelectedVideo(item);
                      addToContinueWatching(item);
                    }}
                    className="relative group cursor-pointer bg-zinc-950/80 border border-white/5 rounded-2xl p-3 flex items-center gap-3.5 hover:border-amber-500/20 hover:bg-zinc-900/40 transition-all shadow-md shrink-0"
                  >
                    <div 
                      className="w-16 h-10 rounded-lg bg-cover bg-center shrink-0 border border-white/10"
                      style={{ backgroundImage: `url(${item.thumbnailUrl})` }}
                    />
                    <div className="min-w-0 pr-1 text-left space-y-0.5">
                      <h4 className="text-[11px] font-bold text-white truncate line-clamp-1">{item.title}</h4>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] font-mono font-extrabold text-[#00FFFF] uppercase tracking-wider">{item.category}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-600" />
                        <span className="text-[8px] font-mono text-zinc-500">{item.duration}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* --- HORIZONTAL MOVIE ROWS SECTION --- */}
          <div className="space-y-12">
            {getCategoriesList().map((category) => {
              const filtered = filteredVideos.filter(v => v.category === category);
              if (filtered.length === 0) return null;

              return (
                <div key={category} className="space-y-4" id={`theater-channel-${category.replace(/\s+/g,'-').toLowerCase()}`}>
                  
                  {/* CATEGORY ROW HEADER BAR */}
                  <div className="flex justify-between items-center text-left border-l-2 border-amber-500 pl-3">
                    <div>
                      <h4 
                        className="font-cinzel font-black uppercase text-[#fafafa] italic tracking-wider filter drop-shadow"
                        style={getScaledText(1.1)}
                      >
                        {category}
                      </h4>
                      <span className="text-[9px] font-mono text-zinc-500 uppercase font-black block mt-0.5 tracking-wider">
                        CPMS Verified Premium Cinema Feed
                      </span>
                    </div>

                    <span className="text-[9px] font-mono text-zinc-400 font-extrabold bg-zinc-900/60 border border-white/5 px-2.5 py-1 rounded-full uppercase">
                      {filtered.length} AVAILABLE STREAMS
                    </span>
                  </div>

                  {/* CAROUSEL HORIZONTAL CONVEYOR */}
                  <div className="flex gap-6 overflow-x-auto pb-4 pt-1 items-stretch snap-x scroll-smooth custom-scrollbar">
                    {filtered.map((item) => (
                      <div
                        key={item.id || item.title}
                        onClick={() => {
                          setSelectedVideo(item);
                          addToContinueWatching(item);
                        }}
                        className="bg-zinc-950/80 border border-white/[0.04] p-4 rounded-3xl w-[280px] md:w-[350px] shrink-0 snap-start cursor-pointer hover:border-amber-400/20 hover:bg-zinc-900/40 hover:shadow-[0_15px_30px_rgba(0,0,0,0.6)] group transition-all duration-300 transform hover:-translate-y-1 relative flex flex-col justify-between"
                      >
                        {/* DECORATIVE TOP DESIGN GLOW BAR */}
                        <div className="absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                        
                        <div className="space-y-4">
                          {/* CLINK PREVIEW THUMBNAIL */}
                          <div 
                            className="w-full h-[150px] rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5 shadow-inner"
                            style={{ 
                              backgroundImage: `url(${item.thumbnailUrl})`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center'
                            }}
                          >
                            <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
                            
                            {/* PREMIUM LUXURY CIRCLE PLAY */}
                            <div className="w-11 h-11 rounded-full bg-black/80 hover:bg-amber-400 border border-white/10 flex items-center justify-center text-white hover:text-black shadow-lg transform group-hover:scale-110 transition-all duration-300 z-10 shrink-0">
                              <Play className="fill-current w-5 h-5 ml-0.5 text-inherit" />
                            </div>

                            <span className="absolute bottom-2.5 right-2.5 bg-black/90 font-mono text-[9px] font-black text-amber-400 px-2.5 py-0.5 rounded border border-white/10 select-none">
                              {item.duration} MIN
                            </span>
                          </div>

                          <div className="text-left space-y-1.5 pr-2">
                            <span className="text-[8px] font-mono px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-500/10 rounded-full font-black uppercase tracking-wider inline-block">
                              {item.relatedIndicatorId || 'General Math'}
                            </span>
                            <h5 
                              className="font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1 truncate"
                              style={getScaledText(0.7)}
                            >
                              {item.title}
                            </h5>
                            <p 
                              className="text-zinc-400 font-semibold leading-relaxed line-clamp-2"
                              style={getScaledText(0.55)}
                            >
                              {item.description}
                            </p>
                          </div>
                        </div>

                        {/* BOTTOM ROW METRICS */}
                        <div className="flex justify-between items-center border-t border-white/[0.04] pt-3 mt-4 text-[9px] font-mono text-zinc-500">
                          <span className="uppercase">Source: {item.uploadedBy}</span>
                          <span>{item.relatedIndicatorId && "✓ HD STREAM"}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              );
            })}
          </div>

          {/* CINEMA INFOBAR BRIEFING */}
          <div className="p-6 bg-gradient-to-r from-[#07070b] via-[#09090f] to-[#07070b] border border-white/5 rounded-3xl flex items-center gap-4 text-left select-none relative overflow-hidden shadow-md">
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-xl pointer-events-none" />
            <Info className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="space-y-0.5 pr-2">
              <span className="text-[10px] font-mono text-amber-500 uppercase tracking-widest font-black block">SUBSCRIBER BULLETIN</span>
              <p className="text-xs font-semibold text-zinc-300 leading-relaxed">
                CPMS represents a premium system for direct, uninhibited educational cinema. Every streaming video targets the core math parameters governing indices and rates variables. Select any stream thumbnail to initiate the player.
              </p>
            </div>
          </div>

        </div>

      </div>

      {/* --- CINEMATIC MOVIE THEATRE PLAYBACK OVERLAY --- */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-3 md:p-6 overflow-y-auto" id="cinema-modal-overlay">
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-[#040407] border border-white/10 rounded-[2.5rem] w-full max-w-5xl shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden flex flex-col relative z-50"
              onClick={(e) => e.stopPropagation()}
            >
              
              {/* HEADER CONTAINER */}
              <div className="flex justify-between items-center p-5 bg-zinc-950 border-b border-white/5">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-lg bg-amber-400/10 flex items-center justify-center">
                    <Tv className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <span className="text-[8px] font-mono text-amber-500 font-extrabold tracking-widest uppercase block">{selectedVideo.category}</span>
                    <h4 className="text-xs font-mono font-black text-white uppercase">{selectedVideo.title}</h4>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedVideo(null);
                    setVideoPlaying(false);
                  }}
                  className="bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white px-4 py-2 text-[10px] uppercase font-mono font-black tracking-widest rounded-full transition-all cursor-pointer border border-white/5"
                >
                  ✕ Exit Theater
                </button>
              </div>

              {/* CINEMATIC HTML5 PLAYER WRAPPER */}
              <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden border-b border-white/5 group">
                
                {selectedVideo.videoUrl ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    onTimeUpdate={updateTime}
                    onLoadedMetadata={loadMetadata}
                    onEnded={handleVideoEnded}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center py-24 space-y-3">
                    <Info className="w-12 h-12 text-zinc-500" />
                    <p className="text-xs font-mono text-zinc-400 font-extrabold">STREAM URL IS MISSING OR INACCESSIBLE</p>
                  </div>
                )}

                {/* THEATRE AMBIENT GRADIET HOVER OVERLAY */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                {/* PLAYBACK COMPLETED SCREEN overlay */}
                {isPlaybackFinished && (
                  <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center space-y-4 z-20">
                    <CheckCircle className="w-12 h-12 text-emerald-400 animate-bounce" />
                    <div className="text-center space-y-1">
                      <h4 className="text-sm font-cinzel font-black uppercase text-white tracking-wider">Masterclass Block Completed</h4>
                      <p className="text-[10px] font-mono text-zinc-400">Verifiable media timeline reached 100% calibration.</p>
                    </div>
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          videoRef.current.play();
                          setVideoPlaying(true);
                          setIsPlaybackFinished(false);
                        }
                      }}
                      className="px-4 py-2 bg-amber-400 text-black text-[10px] font-mono font-black uppercase tracking-widest rounded-full cursor-pointer hover:bg-amber-300 transition-all flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Replay Block</span>
                    </button>
                  </div>
                )}

              </div>

              {/* STUNNING TRANSPARENT GLASS CONTROLS PANEL */}
              <div className="p-6 bg-zinc-950 border-t border-white/5 text-zinc-300 space-y-4 relative z-10 text-left">
                
                {/* PROGRESS BAR TIMELINE TRACKER */}
                <div className="flex items-center gap-3 select-none">
                  <span className="text-[10px] font-mono text-zinc-500 font-bold">{formatTimelineTime(currentTime)}</span>
                  <div 
                    onClick={handleSeekBarClick}
                    className="flex-grow h-2 bg-zinc-900 hover:h-2.5 border border-white/5 rounded-full overflow-hidden cursor-pointer relative transition-all"
                    title="Click to seek stream timeline"
                  >
                    <div className="absolute inset-y-0 left-0 bg-zinc-800 rounded-full w-full opacity-40" />
                    <div 
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-300 rounded-full shadow-[0_0_8px_rgba(245,158,11,0.6)]" 
                      style={{ width: `${videoDuration > 0 ? (currentTime / videoDuration) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 font-extrabold">
                    {formatTimelineTime(videoDuration || 0)}
                  </span>
                </div>

                {/* THEATER INTERACTIVE PANEL CONTROLS */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 select-none">
                  
                  {/* PLAYSTATE BUTTONS */}
                  <div className="flex items-center gap-2.5">
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          if (videoPlaying) {
                            videoRef.current.pause();
                            setVideoPlaying(false);
                          } else {
                            if (isPlaybackFinished) {
                              videoRef.current.currentTime = 0;
                              setIsPlaybackFinished(false);
                            }
                            videoRef.current.play();
                            setVideoPlaying(true);
                          }
                        }
                      }}
                      className="px-5 py-2.5 bg-white hover:bg-amber-400 text-black font-semibold tracking-wider text-xs rounded-full cursor-pointer transition-all flex items-center gap-1.5 shrink-0"
                    >
                      <Play className={`w-3.5 h-3.5 fill-current ${videoPlaying ? 'animate-pulse' : ''}`} />
                      <span>{videoPlaying ? 'PAUSE' : 'PLAY'}</span>
                    </button>

                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          videoRef.current.currentTime = 0;
                          setCurrentTime(0);
                          setIsPlaybackFinished(false);
                        }
                      }}
                      className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-white/5 text-[10px] font-mono font-bold text-zinc-400 hover:text-white rounded-full cursor-pointer transition-all"
                    >
                      RESET TIMER
                    </button>
                    
                    {/* AUDIO TRACK METRICS */}
                    <span className="text-[9px] font-mono text-zinc-500 uppercase font-black tracking-widest hidden md:inline-block">
                      ✓ AUDIO DECODED STEREO
                    </span>
                  </div>

                  {/* HIGH-END SOUND CONTROL ENGINE */}
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-white border border-white/5 cursor-pointer transition-all shrink-0"
                    >
                      {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-500" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseInt(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-20 h-1 bg-zinc-900 appearance-none rounded-lg cursor-pointer accent-amber-400"
                    />
                    
                    <button
                      onClick={() => {
                        if (videoRef.current) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen();
                          } else {
                            videoRef.current.requestFullscreen();
                          }
                        }
                      }}
                      className="p-2 bg-zinc-900 hover:bg-zinc-800 rounded-full text-zinc-400 border border-white/5 cursor-pointer transition-all"
                      title="Full Screen Playback"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

                {/* CINEMA DESCRIPTION PANEL */}
                <div className="mt-4 pt-4 border-t border-white/[0.04] space-y-1">
                  <span className="text-[9px] font-mono text-zinc-500 uppercase block tracking-widest font-black">ACTIVE THEATER METADATA SUMMARY</span>
                  <div className="space-y-1 text-left">
                    <h5 className="font-bold text-white text-sm">{selectedVideo.title}</h5>
                    <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                      {selectedVideo.description}
                    </p>
                  </div>
                </div>

              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
