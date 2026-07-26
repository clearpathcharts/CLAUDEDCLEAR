import React, { useState, useEffect, useRef } from 'react';
import { 
  Network, Flame, Activity, Radio, Tv, ArrowLeft,
  LayoutDashboard, Users, Video, TrendingUp, Calendar, MessageSquare,
  GraduationCap, Eye, ShieldAlert, ShieldCheck, Wrench, Settings,
  Rocket, Heart, Share2, Send, Volume2, Lock, Bell, Mic, MicOff,
  VideoOff, CheckCircle2, Image, BarChart4, Plus, X, ExternalLink,
  ChevronRight, ChevronDown, Award, Globe, Play, Sparkles, RefreshCw,
  Search, ShieldX, HelpCircle, Check, Coins, AlertOctagon, CornerDownRight, Camera
} from 'lucide-react';

// Shared interfaces
interface Post {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    isVerified: boolean;
  };
  content: string;
  timestamp: string;
  category: 'Macro' | 'Liquidity' | 'Strategy' | 'Private Broadcast' | 'Education';
  reactions: { fires: number; rockets: number; hearts: number; thumbs: number; };
  comments: { id: string; author: string; content: string; timestamp: string; }[];
  repostsCount: number;
  poll?: { question: string; options: { text: string; votes: number; }[] };
  chartAttached?: string;
  mediaUrl?: string;
  isPinned?: boolean;
}

interface MiniChartData {
  id: string;
  symbol: string;
  price: number;
  change: number;
  points: number[];
  size: 'sm' | 'md' | 'lg';
  indicators: { ema?: boolean; bb?: boolean; rsi?: boolean; };
}

interface TeamMember {
  id: string;
  name: string;
  role: string;
  tier: string;
  volume: string;
  active: boolean;
  commission: string;
  avatar: string;
  subNodes?: TeamMember[];
}

interface LiveMeeting {
  id: string;
  title: string;
  host: string;
  participants: number;
  isSecured: boolean;
  activePresenter?: string;
}

export default function AffiliateDashboard({ profile, onBack }: { profile: any; onBack: () => void }) {
  // Navigation inside the Affiliate Operating System (AOS)
  const [activeMenu, setActiveMenu] = useState<string>('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fallback profile details
  const displayName = profile?.displayName || 'Rick Floyd';
  const username = profile?.username || 'rickfloyd';
  const avatarUrl = profile?.avatarUrl || profile?.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200';

  // 1. Live Stream Core States
  const [isLive, setIsLive] = useState(false);
  const [liveDuration, setLiveDuration] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);
  const [audioBars, setAudioBars] = useState<number[]>([12, 24, 18, 30, 16, 28, 22, 14, 25, 9]);
  const liveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Presenter controls
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [selectedMeetingRoom, setSelectedMeetingRoom] = useState<string | null>(null);

  // Real Camera, Recording & Acceptance Gate states
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraMirrored, setCameraMirrored] = useState(true);
  const [cameraRotation, setCameraRotation] = useState<0 | 90 | 180 | 270>(0);
  const [cameraFilter, setCameraFilter] = useState<'normal' | 'neon-amber' | 'digital-cyan' | 'matrix' | 'monochrome'>('normal');
  const [recordedClips, setRecordedClips] = useState<{ id: string; url: string; name: string; timestamp: string; size: string }[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recorderSeconds, setRecorderSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const TELEMETRY_HOOK_URL = 'https://api.clearpathtrader.com/v1/telemetry/desk/7101';
  const [cockpitTheme, setCockpitTheme] = useState<'lava' | 'slate'>('lava');
  const [messagesChannelFilter, setMessagesChannelFilter] = useState<string>('all');

  /** Real private-member referral desk from /api/affiliate/me (not a random mock code). */
  const [referralDesk, setReferralDesk] = useState<{
    code: string;
    shareUrl: string;
    monthSignups: number;
    discountPercent: number;
    creditDisplay: string;
    successfulReferrals: number;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/affiliate/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.shareUrl || !data?.code) return;
        setReferralDesk({
          code: String(data.code),
          shareUrl: String(data.shareUrl),
          monthSignups: Number(data.monthSignups) || 0,
          discountPercent: Number(data.discountPercent) || 0,
          creditDisplay: String(data.creditDisplay || '$0.00'),
          successfulReferrals: Number(data.successfulReferrals) || 0,
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 2. Watchlist & Live Ticker Rates
  const [watchlist, setWatchlist] = useState<{ [symbol: string]: { price: number; change: number; isUp: boolean; lastUpdate: string } }>({
    'EURUSD': { price: 1.08425, change: 0.34, isUp: true, lastUpdate: 'Just now' },
    'BTCUSD': { price: 68420.50, change: -1.45, isUp: false, lastUpdate: 'Just now' },
    'NASDAQ': { price: 18450.75, change: 1.12, isUp: true, lastUpdate: 'Just now' },
    'XAUUSD': { price: 2342.15, change: 0.88, isUp: true, lastUpdate: 'Just now' },
    'SPX': { price: 5410.20, change: 0.45, isUp: true, lastUpdate: 'Just now' },
    'TSLA': { price: 184.25, change: -2.35, isUp: false, lastUpdate: 'Just now' },
    'AAPL': { price: 178.60, change: 0.95, isUp: true, lastUpdate: 'Just now' }
  });

  // Dynamic price updates simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setWatchlist(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(symbol => {
          const tick = (Math.random() - 0.48) * (next[symbol].price * 0.0005);
          const oldPrice = next[symbol].price;
          const newPrice = oldPrice + tick;
          const isUp = newPrice > oldPrice;
          const changeTick = (Math.random() - 0.5) * 0.1;
          const newChange = Number((next[symbol].change + changeTick).toFixed(2));
          next[symbol] = {
            price: Number(newPrice.toFixed(symbol === 'BTCUSD' ? 2 : symbol === 'XAUUSD' ? 2 : 5)),
            change: newChange,
            isUp,
            lastUpdate: new Date().toLocaleTimeString()
          };
        });
        return next;
      });
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  // 3. Mini Charts States
  const [activeCharts, setActiveCharts] = useState<MiniChartData[]>([
    { id: 'c-eur', symbol: 'EURUSD', price: 1.08425, change: 0.34, points: [1.081, 1.082, 1.0815, 1.083, 1.0825, 1.084, 1.0838, 1.08425], size: 'md', indicators: { ema: true } },
    { id: 'c-btc', symbol: 'BTCUSD', price: 68420.50, change: -1.45, points: [69100, 68800, 68950, 68600, 68750, 68300, 68450, 68420.50], size: 'md', indicators: { bb: false } },
    { id: 'c-gold', symbol: 'XAUUSD', price: 2342.15, change: 0.88, points: [2322, 2325, 2330, 2328, 2335, 2332, 2340, 2342.15], size: 'md', indicators: {} }
  ]);

  const [availableTickers] = useState<string[]>(['EURUSD', 'BTCUSD', 'NASDAQ', 'XAUUSD', 'SPX', 'TSLA', 'AAPL']);

  const handleAddChartWidget = (symbol: string) => {
    if (activeCharts.length >= 4) {
      alert("System constraint of maximum 4 simultaneous glowing chart ports reached.");
      return;
    }
    const rate = watchlist[symbol]?.price || 100.00;
    const change = watchlist[symbol]?.change || 0.00;
    const basePts = Array.from({ length: 8 }, () => rate * (1 + (Math.random() - 0.5) * 0.01));
    const newChart: MiniChartData = {
      id: `c-dyn-${Date.now()}`,
      symbol,
      price: rate,
      change,
      points: [...basePts, rate],
      size: 'md',
      indicators: {}
    };
    setActiveCharts([...activeCharts, newChart]);
    addTelemetryLog(`Chart deck route activated: ${symbol} stream mounted on secondary bus.`);
  };

  const handleToggleIndicator = (chartId: string, type: 'ema' | 'bb' | 'rsi') => {
    setActiveCharts(prev => prev.map(c => {
      if (c.id === chartId) {
        return {
          ...c,
          indicators: {
            ...c.indicators,
            [type]: !c.indicators[type]
          }
        };
      }
      return c;
    }));
  };

  const removeChartWidget = (id: string) => {
    setActiveCharts(prev => prev.filter(c => c.id !== id));
  };

  // 4. Communities and Channels
  const [communities] = useState([
    { id: 'com-1', name: 'Sovereign Core Desks', members: 4200, active: 890, type: 'Exclusive Tier 3' },
    { id: 'com-2', name: 'Liquidity Grabbers Guild', members: 1240, active: 310, type: 'Scalping / Intra' },
    { id: 'com-3', name: 'Global Fundamental Macro', members: 890, active: 110, type: 'Macro Long' },
    { id: 'com-4', name: 'Gold Arbitrage Protocol', members: 1540, active: 470, type: 'Commodity' }
  ]);
  const [selectedCommunity, setSelectedCommunity] = useState<string>('com-1');

  // Direct and Room Messages
  const [messages, setMessages] = useState<{ id: string; author: string; avatar: string; content: string; time: string; channelId: string }[]>([
    { id: 'msg-1', author: 'Kenji Yamada', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', content: 'Frankfurt low swept cleanly, NY opening range looks locked.', time: '11:42 AM', channelId: 'com-1' },
    { id: 'msg-2', author: 'Alistair Cole', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', content: 'USD inflows shifting to Tokyo defensively.', time: '11:45 AM', channelId: 'com-1' },
    { id: 'msg-3', author: 'Katarina Silva', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', content: 'Watching AAPL 178 fill gap.', time: '11:47 AM', channelId: 'com-2' }
  ]);
  const [newMessageText, setNewMessageText] = useState('');

  const sendRoomMessage = (channelId: string) => {
    if (!newMessageText.trim()) return;
    const newMsg = {
      id: `msg-${Date.now()}`,
      author: 'Rick Floyd (You)',
      avatar: avatarUrl,
      content: newMessageText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      channelId
    };
    setMessages([...messages, newMsg]);
    setNewMessageText('');
    addTelemetryLog(`Encrypted chat packet routed outbound on channel: ${channelId}`);
  };

  // 5. Active Streaming Timer Simulation
  useEffect(() => {
    if (isLive) {
      setViewerCount(Math.floor(Math.random() * 120) + 380);
      liveTimerRef.current = setInterval(() => {
        setLiveDuration(d => d + 1);
        setViewerCount(v => Math.max(200, v + Math.floor(Math.random() * 19) - 9));
        // Pulsing audio equalizers
        setAudioBars(Array.from({ length: 12 }, () => Math.floor(Math.random() * 24) + 6));
      }, 1000);
    } else {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
      setLiveDuration(0);
      setViewerCount(0);
    }
    return () => {
      if (liveTimerRef.current) clearInterval(liveTimerRef.current);
    };
  }, [isLive]);

  // Clean up media streams and recorders on unmount
  useEffect(() => {
    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, [mediaStream]);

  // Mute/unmute live microphone tracks when presenter toggles mic
  useEffect(() => {
    if (!mediaStream) return;
    mediaStream.getAudioTracks().forEach((track) => {
      track.enabled = !isMicMuted;
    });
  }, [isMicMuted, mediaStream]);

  const initCameraStream = async (fMode: 'user' | 'environment') => {
    try {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: { facingMode: fMode, width: { ideal: 640 }, height: { ideal: 480 } },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setMediaStream(stream);
      setCameraActive(true);
      setCameraAllowed(true);
      addTelemetryLog(`Webcam and microphone access approved. Visual streaming loaded in ${fMode === 'user' ? 'front (user)' : 'rear (env)'} alignment.`, 'success');
    } catch (err: any) {
      console.error("Camera access failed:", err);
      // Fallback: Mock beautiful placeholder if iframe restricts access or no camera
      addTelemetryLog(`Secure stream loaded with simulated sensor array. Actual camera unmounted: ${err.message}`, 'warn');
      setCameraActive(true);
      setCameraAllowed(true);
    }
  };

  const stopCameraStream = () => {
    if (mediaStream) {
      mediaStream.getTracks().forEach(track => track.stop());
      setMediaStream(null);
    }
    setCameraActive(false);
    addTelemetryLog("Optical camera and audio interface disconnected.");
  };

  const flipCameraDirection = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    addTelemetryLog(`Swaying optical axis to: ${nextMode === 'user' ? 'Front-facing' : 'Rear-facing'}. Re-initializing sensor array.`);
    if (cameraActive) {
      await initCameraStream(nextMode);
    }
  };

  const startCamRecording = () => {
    recordedChunksRef.current = [];
    if (!mediaStream) {
      addTelemetryLog("Initiating synthetic sequence. Camera is simulated, so recording is emulated.", "success");
      setIsRecording(true);
      setRecorderSeconds(0);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecorderSeconds(s => s + 1);
      }, 1000);
      return;
    }

    try {
      const mimeTypes = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'];
      let selectedType = '';
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedType = mime;
          break;
        }
      }
      
      const options = selectedType ? { mimeType: selectedType } : undefined;
      const recorder = new MediaRecorder(mediaStream, options);
      
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (recordedChunksRef.current.length === 0) return;
        const superBlob = new Blob(recordedChunksRef.current, { type: selectedType || 'video/webm' });
        const clipUrl = URL.createObjectURL(superBlob);
        const clipId = `clip-${Date.now()}`;
        const newClip = {
          id: clipId,
          url: clipUrl,
          name: `TELEMETRY_RECON_${Date.now().toString().slice(-4)}.webm`,
          timestamp: new Date().toLocaleTimeString(),
          size: `${(superBlob.size / 1024 / 1024).toFixed(2)} MB`
        };
        setRecordedClips(prev => [newClip, ...prev]);
        addTelemetryLog(`Recording processed & saved: ${newClip.name}`, 'success');
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // chunk every 1 sec
      setIsRecording(true);
      setRecorderSeconds(0);
      
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecorderSeconds(s => s + 1);
      }, 1000);
      
      addTelemetryLog("Active stream capture routed to volatile memory.", "success");
    } catch (err: any) {
      console.error(err);
      addTelemetryLog(`System recording fault: ${err.message}`, "warn");
    }
  };

  const stopCamRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    } else {
      // Emulator fallback
      if (isRecording) {
        const clipId = `clip-${Date.now()}`;
        const newClip = {
          id: clipId,
          url: '', // Simulated
          name: `EMU_RECON_${Date.now().toString().slice(-4)}.webm`,
          timestamp: new Date().toLocaleTimeString(),
          size: '1.42 MB'
        };
        setRecordedClips(prev => [newClip, ...prev]);
        addTelemetryLog(`Emulated cockpit clip compiled: ${newClip.name}`, 'success');
      }
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
  };

  const deleteRecordedClip = (id: string) => {
    setRecordedClips(prev => prev.filter(c => c.id !== id));
    addTelemetryLog(`Muted backup telemetry clip: ${id}`);
  };

  const handleAcceptConsent = () => {
    setShowConsentModal(false);
    initCameraStream(facingMode);
    setIsLive(true);
    addTelemetryLog('LIVESTREAM MATRIX POWERED - BEAMING CORE DESK FEED.');
  };

  const toggleBroadcasting = () => {
    if (!isLive) {
      if (!cameraAllowed) {
        setShowConsentModal(true);
      } else {
        initCameraStream(facingMode);
        setIsLive(true);
        addTelemetryLog('LIVESTREAM MATRIX POWERED - BEAMING CORE DESK FEED.');
      }
    } else {
      setIsLive(false);
      stopCameraStream();
      stopCamRecording();
      addTelemetryLog('Broadcasting stream interface dismounted.');
    }
  };

  const handleGoToChartsCommand = () => {
    setActiveMenu('Charts');
    addTelemetryLog('Rerouting cockpit telemetry to primary charts terminal.');
  };

  // 6. Interactive Trading Academy & Quizzes (Education Module)
  const [completedQuizzes, setCompletedQuizzes] = useState<string[]>([]);
  const [activeQuizQuizId, setActiveQuizQuizId] = useState<string | null>(null);
  const [selectedQuizAnswers, setSelectedQuizAnswers] = useState<number[]>([]);
  const [quizScore, setQuizScore] = useState<{ score: number; total: number; passed: boolean } | null>(null);

  const educationCourses = [
    {
      id: 'course-1',
      title: 'Frankfurt Sweeps & Intra Session Arbitrage',
      difficulty: 'Elite',
      duration: '45 mins',
      earnedPoints: 250,
      description: 'Understanding corporate flow imbalances and vacuum pricing at key-zone switches.',
      questions: [
        { q: 'Where is Frankfurt liquidity most heavily pooled prior to London opening bells?', options: ['Yesterday NY Close', 'Session Extreme extremes', 'Frankfurt pre-market highs/lows', 'Daily average pivot points'], answer: 2 },
        { q: 'Which indicator provides the highest validation of authentic liquidity sweeps?', options: ['Relative Strength Index (RSI)', 'High Volume Imbalance nodes', 'Stochastic oscillators', 'Simple Moving Averages'], answer: 1 }
      ]
    },
    {
      id: 'course-2',
      title: 'Institutional Dollar Reserve Dynamics',
      difficulty: 'Sovereign Master',
      duration: '60 mins',
      earnedPoints: 400,
      description: 'Cross-border Corporate hedge routing structures and macro defensive interest channels.',
      questions: [
        { q: 'When Corporate hedges shift defensively, what happens on USD/JPY correlations?', options: ['Outflows strengthen JPY carry trades', 'Dollar reserve buffers capture yield inflows', 'Complete decoupling', 'Gold assets liquefy immediately'], answer: 1 }
      ]
    }
  ];

  const handleStartQuiz = (courseId: string) => {
    setActiveQuizQuizId(courseId);
    setSelectedQuizAnswers([]);
    setQuizScore(null);
    addTelemetryLog(`Authorized educational quiz exam initiated: [${courseId}]`);
  };

  const submitQuizAnswers = (courseId: string) => {
    const course = educationCourses.find(c => c.id === courseId);
    if (!course) return;

    let score = 0;
    selectedQuizAnswers.forEach((ans, idx) => {
      if (ans === course.questions[idx].answer) {
        score += 1;
      }
    });

    const passed = score === course.questions.length;
    setQuizScore({ score, total: course.questions.length, passed });
    if (passed && !completedQuizzes.includes(courseId)) {
      setCompletedQuizzes([...completedQuizzes, courseId]);
      addTelemetryLog(`EXAM COMPLETED SUCCESSFULLY: Earned +${course.earnedPoints} Sovereign XP.`);
    } else {
      addTelemetryLog(`EXAM AUDIT REJECTED: Perfect score required to sweep rewards.`);
    }
  };

  // 7. Post Composer State Management
  const [posts, setPosts] = useState<Post[]>([
    {
      id: 'p-1',
      author: { name: 'Rick Floyd', username: 'rickfloyd', avatar: avatarUrl, isVerified: true },
      content: '🚨 ALERT: Nasdaq premium zones reached. Expect standard liquidity grabs in Frankfurt overlap. Stand by for न्यूयॉर्क opening bell sweeps.',
      timestamp: '1 hour ago',
      category: 'Macro',
      reactions: { fires: 145, rockets: 88, hearts: 64, thumbs: 104 },
      comments: [
        { id: 'rep-1', author: 'MarkusFX (AOS Core)', content: 'Absolutely aligned. Standard Frankfurt pool points sweep.', timestamp: '45 mins ago' }
      ],
      repostsCount: 14,
      chartAttached: 'EURUSD',
      isPinned: true
    },
    {
      id: 'p-2',
      author: { name: 'Alistair Cole', username: 'alistair_desk', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100', isVerified: true },
      content: 'BTCUSD consolidation structural breakdown imminent. Private broadcast desks have secured hedges. Ensure appropriate leverage configurations.',
      timestamp: '3 hours ago',
      category: 'Private Broadcast',
      reactions: { fires: 98, rockets: 42, hearts: 22, thumbs: 60 },
      comments: [],
      repostsCount: 8,
      mediaUrl: 'https://images.unsplash.com/photo-1640340434855-6084b1f4901c?auto=format&fit=crop&q=80&w=600'
    }
  ]);

  const [composerText, setComposerText] = useState('');
  const [selectedPostCategory, setSelectedPostCategory] = useState<'Macro' | 'Liquidity' | 'Strategy' | 'Private Broadcast' | 'Education'>('Strategy');
  const [attachedChartTicker, setAttachedChartTicker] = useState<string>('');
  const [composerPoll, setComposerPoll] = useState<{ question: string; options: string[] } | null>(null);
  const [pollInputs, setPollInputs] = useState<string[]>(['', '']);
  const [showPollBox, setShowPollBox] = useState(false);
  const [simulatedMediaFile, setSimulatedMediaFile] = useState<string | null>(null);

  // Poll option dynamic changes
  const updatePollOptionVal = (idx: number, val: string) => {
    const nextArr = [...pollInputs];
    nextArr[idx] = val;
    setPollInputs(nextArr);
  };

  const addPollOptionField = () => {
    if (pollInputs.length >= 5) return;
    setPollInputs([...pollInputs, '']);
  };

  const handlePostCreationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!composerText.trim()) return;

    let finalPoll = undefined;
    if (showPollBox && composerPoll?.question) {
      finalPoll = {
        question: composerPoll.question,
        options: pollInputs.filter(p => p.trim()).map(text => ({ text, votes: 0 }))
      };
    }

    const newPost: Post = {
      id: `p-dyn-${Date.now()}`,
      author: {
        name: displayName,
        username,
        avatar: avatarUrl,
        isVerified: true
      },
      content: composerText,
      timestamp: 'Seconds ago',
      category: selectedPostCategory,
      reactions: { fires: 0, rockets: 0, hearts: 0, thumbs: 0 },
      comments: [],
      repostsCount: 0,
      chartAttached: attachedChartTicker || undefined,
      mediaUrl: simulatedMediaFile || undefined,
      poll: finalPoll
    };

    setPosts([newPost, ...posts]);
    setComposerText('');
    setAttachedChartTicker('');
    setComposerPoll(null);
    setPollInputs(['', '']);
    setShowPollBox(false);
    setSimulatedMediaFile(null);
    addTelemetryLog('Sovereign feed post transmitted. Cross-linking signals globally.');
  };

  // Simulating media file hover selection
  const simulateMediaUpload = () => {
    const mediaPool = [
      'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&q=80&w=600',
      'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&q=80&w=600'
    ];
    const picked = mediaPool[Math.floor(Math.random() * mediaPool.length)];
    setSimulatedMediaFile(picked);
    addTelemetryLog('Telemetry media attachment finalized on packet buffer.');
  };

  // Reaction engine
  const triggerReactionCount = (postId: string, field: 'fires' | 'rockets' | 'hearts' | 'thumbs') => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          reactions: {
            ...p.reactions,
            [field]: p.reactions[field] + 1
          }
        };
      }
      return p;
    }));
  };

  // Repost Action
  const triggerRepostAction = (postId: string) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return { ...p, repostsCount: p.repostsCount + 1 };
      }
      return p;
    }));
    addTelemetryLog(`Post packets duplicated & rebroadcast on downline networks.`);
  };

  // Comments Engine
  const [commentInputStrMap, setCommentInputStrMap] = useState<{ [postId: string]: string }>({});

  const writeCommentSubmit = (postId: string, e: React.FormEvent) => {
    e.preventDefault();
    const text = commentInputStrMap[postId];
    if (!text || !text.trim()) return;

    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          comments: [
            ...p.comments,
            { id: `c-${Date.now()}`, author: displayName, content: text, timestamp: 'Now' }
          ]
        };
      }
      return p;
    }));

    setCommentInputStrMap(prev => ({ ...prev, [postId]: '' }));
    addTelemetryLog(`In-line comment packet synced on post ${postId}.`);
  };

  // Poll Voting
  const castOptionVote = (postId: string, optIdx: number) => {
    setPosts(prev => prev.map(p => {
      if (p.id === postId && p.poll) {
        const nextOpts = [...p.poll.options];
        nextOpts[optIdx] = {
          ...nextOpts[optIdx],
          votes: nextOpts[optIdx].votes + 1
        };
        return {
          ...p,
          poll: { ...p.poll, options: nextOpts }
        };
      }
      return p;
    }));
    addTelemetryLog(`Votable database logged feedback update on post ${postId}.`);
  };

  // 8. Compliance Logs & Activity Tracking System
  const [systemLogs, setSystemLogs] = useState<{ id: string; msg: string; time: string; level: 'info' | 'warn' | 'success' }[]>([
    { id: 'l1', msg: 'ClearPathTrader Security Protocol v9.2 active.', time: '11:38 AM', level: 'info' },
    { id: 'l2', msg: 'Affiliate commission audit sweep completed. Status: SECURE', time: '11:40 AM', level: 'success' },
    { id: 'l3', msg: 'Link shield sweep: Restricted broker domain intercepted and neutralized.', time: '11:41 AM', level: 'warn' }
  ]);

  const addTelemetryLog = (msg: string, level: 'info' | 'warn' | 'success' = 'info') => {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setSystemLogs(prev => [
      { id: `l-${Date.now()}`, msg, time: timeStr, level },
      ...prev.slice(0, 18)
    ]);
  };

  // 9. Interactive Team Network Node Grid
  const [teamNodes, setTeamNodes] = useState<TeamMember>({
    id: 'n-root',
    name: 'Rick Floyd (You)',
    role: 'Sovereign Desk Master',
    tier: 'Sovereign Rank',
    volume: '$42.5M Volume',
    active: true,
    avatar: avatarUrl,
    commission: 'Primary Desk',
    subNodes: [
      {
        id: 'n-s1',
        name: 'Alistair Cole',
        role: 'Regional Sovereign Desk',
        tier: 'Tier 2 Active Desk',
        volume: '$18.2M',
        active: true,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100',
        commission: '40% Comm',
        subNodes: [
          { id: 'n-s1-1', name: 'Katarina Silva', role: 'Premium Scalper', tier: 'Tier 1 Standard', volume: '$4.1M', active: true, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=100', commission: '15% Comm' },
          { id: 'n-s1-2', name: 'Kenji Yamada', role: 'Macro Carry Lead', tier: 'Tier 1 Standard', volume: '$6.5M', active: false, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100', commission: '15% Comm' }
        ]
      },
      {
        id: 'n-s2',
        name: 'Maria Thorne',
        role: 'Liquidating Director',
        tier: 'Tier 2 Active Desk',
        volume: '$12.4M',
        active: true,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
        commission: '40% Comm',
        subNodes: [
          { id: 'n-s2-1', name: 'Gavin Vance', role: 'Arbitrage Coordinator', tier: 'Tier 1 Standard', volume: '$1.8M', active: true, avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=100', commission: '15% Comm' }
        ]
      }
    ]
  });

  const [expandedTeamNodes, setExpandedTeamNodes] = useState<{ [id: string]: boolean }>({
    'n-root': true,
    'n-s1': true,
    'n-s2': false
  });

  const toggleTeamNodeExpanded = (nodeId: string) => {
    setExpandedTeamNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Top 10 connected social media platforms array
  const [socialPlatforms, setSocialPlatforms] = useState([
    { id: 'insta', authId: 'instagram', name: 'Instagram', handle: '@rick_floyd_fx', followers: '142K', activeSync: true, icon: Flame, color: 'text-[#E1306C]', url: 'https://instagram.com/rick_floyd_fx' },
    { id: 'fb', authId: 'facebook', name: 'Facebook', handle: 'RickFloydFX', followers: '89K', activeSync: true, icon: Users, color: 'text-[#1877F2]', url: 'https://facebook.com/RickFloydFX' },
    { id: 'tiktok', authId: 'tiktok', name: 'TikTok', handle: '@rickthetrader', followers: '210K', activeSync: true, icon: Video, color: 'text-[#a6e22e]', url: 'https://tiktok.com/@rickthetrader' },
    { id: 'yt', authId: 'youtube', name: 'YouTube', handle: 'ClearPathFX_Sovereign', followers: '345K', activeSync: true, icon: Tv, color: 'text-[#FF0000]', url: 'https://youtube.com/@ClearPathFX_Sovereign' },
    { id: 'twitter', authId: 'twitter', name: 'X / Twitter', handle: '@rickfloyd_fx', followers: '76K', activeSync: true, icon: RefreshCw, color: 'text-white', url: 'https://x.com/rickfloyd_fx' },
    { id: 'tg', authId: 'telegram', name: 'Telegram', handle: 't.me/clearpath_signals', followers: '185K', activeSync: true, icon: Send, color: 'text-[#229ED9]', url: 'https://t.me/clearpath_signals' },
    { id: 'discord', authId: 'discord', name: 'Discord', handle: 'discord.gg/clearpath', followers: '62K', activeSync: true, icon: MessageSquare, color: 'text-[#5865F2]', url: 'https://discord.gg/clearpath' },
    { id: 'twitch', authId: 'twitch', name: 'Twitch', handle: 'rickfloyd_live', followers: '28K', activeSync: false, icon: Radio, color: 'text-[#9146FF]', url: 'https://twitch.tv/rickfloyd_live' },
    { id: 'linkedin', authId: 'linkedin', name: 'LinkedIn', handle: 'rick-floyd-sovereign', followers: '14K', activeSync: false, icon: Award, color: 'text-[#0A66C2]', url: 'https://linkedin.com/in/rick-floyd-sovereign' },
    { id: 'reddit', authId: 'reddit', name: 'Reddit', handle: 'r/ClearPathAnarchy', followers: '41K', activeSync: true, icon: Activity, color: 'text-[#FF4500]', url: 'https://reddit.com/r/ClearPathAnarchy' }
  ]);

  const togglePlatformSyncState = (platId: string) => {
    setSocialPlatforms(prev => prev.map(p => {
      if (p.id === platId) {
        const nextState = !p.activeSync;
        addTelemetryLog(`${p.name} automatic syndication router set to: ${nextState ? 'ONLINE' : 'OFFLINE'}`);
        return { ...p, activeSync: nextState };
      }
      return p;
    }));
  };

  /** Open OAuth login desk + live channel URL for this platform. */
  const openPlatformConnector = (plat: (typeof socialPlatforms)[number]) => {
    addTelemetryLog(`Opening ${plat.name} login + channel link…`, 'success');
    const returnTo = encodeURIComponent(window.location.pathname + window.location.search + window.location.hash);
    if (plat.authId) {
      window.open(`/auth/${plat.authId}?returnTo=${returnTo}`, '_blank', 'noopener,noreferrer');
    }
    if (plat.url) {
      window.setTimeout(() => {
        window.open(plat.url, '_blank', 'noopener,noreferrer');
      }, plat.authId ? 350 : 0);
    }
  };

  const copyTelemetryHook = async () => {
    try {
      await navigator.clipboard.writeText(TELEMETRY_HOOK_URL);
      addTelemetryLog('Telemetry hook URL copied to clipboard.', 'success');
    } catch {
      addTelemetryLog('Clipboard copy blocked — copy the hook URL manually from Settings.', 'warn');
    }
  };

  const handleCreateInvitationPacket = () => {
    const packet = referralDesk?.shareUrl;
    if (!packet) {
      addTelemetryLog('Sign in with a private ClearPath account to unlock your real /r/CODE share link.', 'warn');
      return;
    }
    void navigator.clipboard.writeText(packet).catch(() => {});
    addTelemetryLog(`Referral share link copied: ${packet} (code ${referralDesk?.code})`, 'success');
  };

  const getFilterCss = () => {
    let f = "";
    if (cameraFilter === 'neon-amber') f += "sepia(1) hue-rotate(15deg) saturate(3.5) contrast(1.15) brightness(0.95)";
    else if (cameraFilter === 'digital-cyan') f += "sepia(0.6) hue-rotate(150deg) saturate(3.5) contrast(1.2) brightness(1.1)";
    else if (cameraFilter === 'matrix') f += "grayscale(0.4) brightness(0.85) contrast(1.8) sepia(0.8) hue-rotate(80deg) saturate(3)";
    else if (cameraFilter === 'monochrome') f += "grayscale(1) contrast(1.4) brightness(1.05)";
    return f;
  };

  return (
    <div className="affiliate-page max-w-[1750px] mx-auto p-3 sm:p-6 font-sans space-y-6 text-white pb-32">
      
      {/* 1. UPPER SECURED TERMINAL PATHWAYS BACK CONTROL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0a0f1d] border-2 border-[#ff5a1f]/50 rounded-2xl p-4 shadow-[0_0_15px_rgba(255,90,31,0.2)]">
        <button 
          onClick={onBack}
          className="flex items-center gap-2.5 text-xs font-mono font-black text-[#00ffe1] hover:text-[#ff007f] transition-all uppercase tracking-widest cursor-pointer animate-pulse"
        >
          <ArrowLeft className="w-4.5 h-4.5 text-[#ff007f]" />
          Terminate OS & Back to Terminal Standard
        </button>
        
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff007f] animate-ping" />
          <span className="text-[10px] md:text-xs font-mono font-black text-[#00ffe1] uppercase tracking-widest">
            CLEARPATH AFFILIATE OPERATING SYSTEM // SECURED NETWORK DECK v1.97
          </span>
        </div>
      </div>

      {/* 2. THREE-PANEL CORE SYSTEM ARCHITECTURE */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
        
        {/* ==================================================== */}
        {/* LEFT COLUMN / SIDEBAR NAVIGATION (Col-span 3)        */}
        {/* ==================================================== */}
        <div className={`xl:col-span-3 transition-all duration-300 ${sidebarCollapsed ? 'xl:w-20' : 'w-full'}`}>
          <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-5 space-y-6 shadow-2xl relative overflow-hidden">
            
            {/* Liquid Molten Lava Line Shield */}
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-600 via-red-500 to-amber-400" />
            
            <div className="flex items-center justify-between border-b border-zinc-900 pb-4">
              {!sidebarCollapsed && (
                <div>
                  <h3 className="text-sm font-black font-cinzel text-[#00ffe1] uppercase tracking-wider">
                    OPERATING COCKPIT
                  </h3>
                  <span className="text-[9px] font-mono text-[#ff5a1f] font-black uppercase tracking-widest">
                    AFFILIATE TERMINAL
                  </span>
                </div>
              )}
              <button 
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="p-1 px-2.5 bg-[#0a0c16] rounded-md border border-zinc-800 text-xs text-zinc-400 hover:text-[#00ffe1] font-mono uppercase"
              >
                {sidebarCollapsed ? '»' : '«'}
              </button>
            </div>

            {/* Sidebar Link List Menu */}
            <nav className="space-y-1.5">
              {[
                { id: 'Dashboard', label: 'Primary Desk Feed', icon: LayoutDashboard },
                { id: 'Communities', label: 'Downline Guilds', icon: Users, badge: communities.length.toString() },
                { id: 'Live Meetings', label: 'Live Core Rooms', icon: Video, badge: 'Active' },
                { id: 'Charts', label: 'Chart Desks', icon: BarChart4, badge: activeCharts.length.toString() },
                { id: 'Team Network', label: 'Sovereign Ranks', icon: Network },
                { id: 'Messages', label: 'Radio Channels', icon: MessageSquare },
                { id: 'Education', label: 'Macro Academy', icon: GraduationCap, badge: completedQuizzes.length.toString() },
                { id: 'Watchlist', label: 'Live Pricing Specter', icon: Eye },
                { id: 'Compliance', label: 'Risk Shield Monitor', icon: ShieldAlert },
                { id: 'Settings', label: 'Terminal Profiles', icon: Settings }
              ].map((item) => {
                const Icon = item.icon;
                const isActive = activeMenu === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveMenu(item.id);
                      addTelemetryLog(`Subsystem routing target altered: ${item.id}`);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all font-mono text-xs text-left cursor-pointer select-none relative group ${
                      isActive 
                        ? 'bg-gradient-to-r from-[#ff5a1f]/10 to-transparent border-l-3 border-[#ff5a1f] text-[#ff007f] font-black bg-[#0d0710]' 
                        : 'text-zinc-400 hover:text-[#00ffe1] hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-[#ff5a1f]' : 'text-zinc-500 group-hover:text-[#00ffe1]'}`} />
                      {!sidebarCollapsed && <span className="uppercase tracking-wider font-semibold">{item.label}</span>}
                    </div>

                    {!sidebarCollapsed && item.badge && (
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${
                        item.badge === 'Active' 
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' 
                          : 'bg-zinc-800 text-zinc-350'
                      }`}>
                        {item.badge}
                      </span>
                    )}

                    {/* Molten Lava Glow On Hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#ff5a1f]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                  </button>
                );
              })}
            </nav>

            {/* Quick Summary Metrics block — live referral API when signed in */}
            {!sidebarCollapsed && (
              <div className="p-4 bg-zinc-950/80 rounded-2xl border border-zinc-900 space-y-2.5 text-left font-mono text-[10px]">
                <div className="text-zinc-550 uppercase font-bold text-[9px] border-b border-zinc-900 pb-1.5 flex justify-between items-center">
                  <span>REFERRAL LEDGER</span>
                  <span className="text-[#00ffe1]">{referralDesk ? 'LIVE' : 'SIGN IN'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-500">YOUR CODE:</span>
                  <span className="text-[#ff007f] font-extrabold">{referralDesk?.code || '—'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-500">MONTH SIGNUPS:</span>
                  <span className="text-[#ff5a1f] font-extrabold">{referralDesk ? referralDesk.monthSignups : '—'}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-500">DISCOUNT / CREDIT:</span>
                  <span className="text-[#00ffe1] font-extrabold">
                    {referralDesk
                      ? `${referralDesk.discountPercent}% · ${referralDesk.creditDisplay}`
                      : '—'}
                  </span>
                </div>
                {referralDesk?.shareUrl && (
                  <p className="text-[8px] text-zinc-500 break-all leading-relaxed pt-1 border-t border-zinc-900">
                    {referralDesk.shareUrl}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleCreateInvitationPacket}
                  className="w-full mt-2 bg-[#ff5a1f]/10 hover:bg-[#ff5a1f] border border-[#ff5a1f]/30 hover:border-transparent text-[#ff5a1f] hover:text-[#00ffe1] text-[9px] font-black uppercase py-2 rounded-lg text-center transition-all cursor-pointer"
                >
                  Copy real share link
                </button>
              </div>
            )}

          </div>
        </div>

        {/* ==================================================== */}
        {/* CENTER PANEL / MAIN INTERACTIVE COCKPIT (Col-span 6)  */}
        {/* ==================================================== */}
        <div className="xl:col-span-6 space-y-6">

          {/* 🚨 ALWAYS VISIBLE MANDATORY PINNED COMPLIANCE NOTICE */}
          <div className="relative overflow-hidden bg-gradient-to-r from-[#170505] to-[#040408] border-2 border-red-500/50 rounded-2xl p-5 shadow-[0_0_20px_rgba(239,68,68,0.1)] text-left">
            <div className="absolute top-0 right-0 py-1 px-3 bg-red-650 font-mono text-[9px] font-black text-[#00ffe1] rounded-bl-xl uppercase tracking-widest leading-none">
              MANDATORY DISCLOSURE
            </div>
            
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-600/10 rounded-xl border border-red-500/30 text-red-500 shrink-0">
                <ShieldX className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-sm font-black font-cinzel text-[#00ffe1] uppercase tracking-widest flex items-center gap-2">
                  NO UNLICENSED FINANCIAL ADVICE // SECURITIES SHIELD
                </h4>
                <p className="text-xs font-mono font-black text-[#ff5a1f] leading-relaxed uppercase tracking-wider">
                  NO UNLICENSED FINANCIAL ADVICE. NO SECURITIES SALES. NO BROKER RECRUITMENT. NO INVESTMENT SOLICITATION. NO GUARANTEED PROFITS.
                </p>
                <p className="text-[10px] text-zinc-400 font-mono leading-relaxed mt-1">
                  ClearPathTrader is a decentralized technology ecosystem. All statements, indicators, and strategy relays are strictly for educative simulation procedures.
                </p>
              </div>
            </div>
          </div>

          {/* DYNAMIC SUBSECTION CONTROLLERS IN CENTER PANEL */}
          
          {/* VIEW: DASHBOARD (Unified feed, post composition, and interactive elements) */}
          {activeMenu === 'Dashboard' && (
            <div className="space-y-6">
              
              {/* BRAND ACTION BANK: INSTANT GO LIVE & CHARTS LAUNCHERS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Custom Go Live Trigger */}
                <button 
                  onClick={toggleBroadcasting}
                  className={`border-2 rounded-[1.5rem] p-5 text-left transition-all overflow-hidden select-none cursor-pointer flex flex-col justify-between min-h-[130px] group relative ${
                    isLive 
                      ? 'bg-[#1b050d] border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
                      : 'bg-[#04040a] border-[#ff007f]/30 hover:border-[#ff007f] hover:shadow-[0_0_20px_rgba(255,0,127,0.1)]'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-[10px] font-mono font-black tracking-widest uppercase flex items-center gap-1.5 ${isLive ? 'text-red-500' : 'text-[#ff007f]'}`}>
                      <span className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-ping' : 'bg-red-900'}`} />
                      {isLive ? '🔴 TRANSMITTING DECK' : '📡 MOUNT STREAM DESK'}
                    </span>
                    <span className="text-[9px] text-zinc-550 font-mono font-semibold">PORT: 7101</span>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="text-base sm:text-lg font-cinzel font-black uppercase tracking-wider text-[#ff007f]">
                      {isLive ? 'TERMINATE TRANSIT FEED' : 'GO LIVE STREAM'}
                    </h3>
                    <p className="text-[10px] text-zinc-450 font-mono mt-1 leading-relaxed">
                      {isLive ? 'Currently casting video feed to active sub-channel rooms.' : 'Spin up core voice, charts, and microphone logs for alignment.'}
                    </p>
                  </div>
                </button>

                {/* Custom Charts launcher */}
                <button 
                  onClick={handleGoToChartsCommand}
                  className="border-2 bg-[#04040a] border-[#00ffe1]/30 hover:border-[#00ffe1] hover:shadow-[0_0_20px_rgba(0,255,225,0.1)] rounded-[1.5rem] p-5 text-left transition-all overflow-hidden select-none cursor-pointer flex flex-col justify-between min-h-[130px] group relative"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-[10px] font-mono font-black text-[#00ffe1] tracking-[0.2em] uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00ffe1]" />
                      INSTITUTIONAL GRAPHS
                    </span>
                    <span className="text-[9px] text-zinc-550 font-mono font-semibold">ACTIVE TERM</span>
                  </div>

                  <div className="mt-2.5">
                    <h3 className="text-base sm:text-lg font-cinzel font-black uppercase tracking-wider text-[#00ffe1]">
                      GO TO CHARTS TERMINAL
                    </h3>
                    <p className="text-[10px] text-zinc-450 font-mono mt-1 leading-relaxed">
                      Activate premium analytical charts, customized indicators, and liquidity zone mappings.
                    </p>
                  </div>
                </button>

              </div>

              {/* ACTIVE TV STREAM MONITOR PANEL */}
              {isLive && (
                <div className="bg-[#0c0305] border-2 border-red-500/60 rounded-3xl p-5 space-y-5 shadow-[0_0_20px_rgba(239,68,68,0.15)]">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-zinc-900 pb-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] bg-red-650 font-mono text-white px-2 py-0.5 rounded font-black tracking-widest">LIVE NOW</span>
                        <span className="text-xs font-mono font-black text-zinc-350">ACTIVE BIOMETRIC COCKPIT STREAM</span>
                      </div>
                      <h4 className="text-base font-cinzel font-black text-white uppercase tracking-wider mt-1">
                        Secured Live Downline Transmit Feed
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 bg-black/90 px-3 py-2 rounded-xl border border-red-500/20">
                      <div className="text-xs font-mono">
                        <div className="text-zinc-500 uppercase font-black text-[8px]">SECONDS DECK</div>
                        <div className="text-white font-black text-sm">
                          {Math.floor(liveDuration / 60)}:{(liveDuration % 60).toString().padStart(2, '0')}
                        </div>
                      </div>
                      <div className="w-[1px] h-6 bg-zinc-850" />
                      <div className="text-xs font-mono text-right">
                        <span className="text-red-500 font-extrabold block text-[8px]">AUDIENCE</span>
                        <span className="text-[#00ffe1] font-black">{viewerCount} Joined</span>
                      </div>
                    </div>
                  </div>

                  {/* CAMERA STREAM CONTAINER & HUD OVERLAY */}
                  <div className="relative w-full aspect-video sm:h-96 bg-black rounded-2xl border-2 border-[#ff007f]/30 overflow-hidden group">
                    <div className="absolute inset-0 bg-grid-zinc opacity-10 pointer-events-none z-0" />
                    
                    {/* Futuristic Crosshair Scope */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 opacity-30">
                      <div className="w-16 h-16 border border-white/20 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
                      </div>
                    </div>

                    <div className="absolute top-4 left-4 z-10 font-mono text-[8px] text-zinc-500 space-y-1">
                      <div>SYS_LATENCY: 12ms</div>
                      <div>RESOLUTION: 640x480</div>
                      <div>FACING: {facingMode.toUpperCase()}</div>
                    </div>

                    <div className="absolute top-4 right-4 z-10 font-mono text-[8px] text-zinc-500 text-right space-y-1">
                      <div>ENCODING: HEVC / WEBM</div>
                      <div>BUFFER: FLUID SECURE</div>
                      <div>ROTATION: {cameraRotation}°</div>
                    </div>

                    {/* Real Video Component / Mock Simulator */}
                    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-black">
                      {mediaStream ? (
                        <video
                          ref={(el) => {
                            if (el) {
                              el.srcObject = mediaStream;
                              el.play().catch(err => console.log("Main Video play err:", err));
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transition-all"
                          style={{
                            filter: getFilterCss(),
                            transform: `rotate(${cameraRotation}deg) ${cameraMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`
                          }}
                        />
                      ) : (
                        /* Beautiful Cyber Scanning Placeholder if real webcam is blocked or absent */
                        <div className="flex flex-col items-center justify-center space-y-4 text-center p-6 bg-[#040203]">
                          <div className="relative w-16 h-16 rounded-full bg-red-500/10 border-2 border-red-500 flex items-center justify-center animate-pulse">
                            <Radio className="w-8 h-8 text-red-500 animate-bounce" />
                            <div className="absolute inset-0 rounded-full border border-red-500/30 animate-ping" />
                          </div>
                          <div>
                            <p className="text-zinc-350 font-cinzel font-black tracking-wider text-xs uppercase">
                              Secured Live Emulator active
                            </p>
                            <p className="text-[10px] text-zinc-500 font-mono mt-1 max-w-sm mx-auto">
                              Webcam input stream not initialized. Please click the permissions gate to start hardware camera. Applying synthetic sensory alignment.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* HUD Scanline */}
                      <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-20" />
                    </div>

                    <div className={`absolute inset-0 pointer-events-none z-10 ${
                      cameraFilter === 'neon-amber' ? 'bg-orange-500/5 mix-blend-color-burn' :
                      cameraFilter === 'digital-cyan' ? 'bg-cyan-500/5 mix-blend-color-burn' :
                      cameraFilter === 'matrix' ? 'bg-emerald-500/5 mix-blend-color-burn' : ''
                    }`} />
                  </div>

                  {/* CAMERA TRANSFORMS & TUNING BAR */}
                  <div className="bg-black/60 border border-zinc-900 rounded-2xl p-4 space-y-3.5 font-mono text-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-zinc-900">
                      <span className="text-[10px] uppercase font-black text-zinc-400 tracking-wider">
                        🛠️ OPTICAL TARGET & FLIP EMULATION DECK
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={flipCameraDirection}
                          title="Switch between user-facing front camera and environment-facing rear camera"
                          className="bg-zinc-950 border border-zinc-800 text-white font-bold hover:bg-zinc-900 px-3 py-1.5 rounded-xl uppercase text-[9px] flex items-center gap-1.5 cursor-pointer animate-pulse"
                        >
                          <RefreshCw className="w-3 h-3 animate-spin-slow" />
                          Flip Camera Direction: {facingMode.toUpperCase()}
                        </button>

                        <button
                          onClick={() => setCameraMirrored(!cameraMirrored)}
                          className={`bg-zinc-950 border px-3 py-1.5 rounded-xl uppercase text-[9px] cursor-pointer transition-all ${
                            cameraMirrored ? 'border-[#00ffe1] text-[#00ffe1]' : 'border-zinc-850 text-zinc-400'
                          }`}
                        >
                          Mirror Feed: {cameraMirrored ? 'ON' : 'OFF'}
                        </button>

                        <button
                          onClick={() => setCameraRotation(r => ((r + 90) % 360) as any)}
                          className="bg-zinc-950 border border-zinc-850 text-white font-bold hover:bg-zinc-900 px-3 py-1.5 rounded-xl uppercase text-[9px] cursor-pointer"
                        >
                          Rotate: {cameraRotation}°
                        </button>
                      </div>
                    </div>

                    {/* HUD TELEMETRY FILTERS */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-zinc-900">
                      <span className="text-[10px] text-zinc-500 uppercase font-black">
                        VISUAL SPECTRUM FILTERS:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { id: 'normal', name: 'Original' },
                          { id: 'neon-amber', name: 'Amber Scan' },
                          { id: 'digital-cyan', name: 'Cyan Tech' },
                          { id: 'matrix', name: 'Matrix' },
                          { id: 'monochrome', name: 'B&W' }
                        ].map(f => (
                          <button
                            key={f.id}
                            onClick={() => setCameraFilter(f.id as any)}
                            className={`px-2.5 py-1 rounded text-[9px] uppercase font-bold tracking-wider cursor-pointer ${
                              cameraFilter === f.id 
                                ? 'bg-[#ff007f] text-white' 
                                : 'bg-zinc-950 border border-zinc-900 text-zinc-400 hover:text-white'
                            }`}
                          >
                            {f.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* BIOMETRIC RECORDING WORKBENCH */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        {isRecording ? (
                          <div className="flex items-center gap-2 animate-pulse text-red-500 font-bold">
                            <span className="w-2 rounded-full h-2 bg-red-500" />
                            <span>CAPTURING AUDITED CLIP: {Math.floor(recorderSeconds / 60)}:{(recorderSeconds % 60).toString().padStart(2, '0')}</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-zinc-400 font-mono">
                            AUTHORIZED INTERNAL RECORDER (DOWNLINE EVIDENCE)
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isRecording ? (
                          <button
                            onClick={stopCamRecording}
                            className="bg-red-650 hover:bg-red-700 text-white font-bold py-1.5 px-3 py-1 rounded-xl uppercase tracking-wider text-[10px] cursor-pointer animate-bounce"
                          >
                            Stop Stream Recording
                          </button>
                        ) : (
                          <button
                            onClick={startCamRecording}
                            className="bg-emerald-650 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-xl uppercase tracking-wider text-[10px] flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5 hover:rotate-12 transition-transform" />
                            Record Stream Core
                          </button>
                        )}
                      </div>
                    </div>

                    {/* RECORDED TELEMETRY CLIPS GRID */}
                    {recordedClips.length > 0 && (
                      <div className="bg-black/90 p-4 border border-zinc-850 rounded-xl space-y-3.5 max-h-56 overflow-y-auto">
                        <span className="text-[10px] text-[#00ffe1] font-black uppercase tracking-widest block">
                          📂 REPLAY BUFFERED TELEMETRY FILES ({recordedClips.length})
                        </span>
                        <div className="divide-y divide-zinc-900">
                          {recordedClips.map((clip) => (
                            <div key={clip.id} className="flex justify-between items-center py-2 bg-zinc-950/40 p-2 rounded-lg border border-zinc-900 mb-1.5 last:mb-0">
                              <div className="space-y-0.5">
                                <span className="font-bold text-white text-xs block truncate max-w-xs">{clip.name}</span>
                                <span className="text-[8px] text-zinc-500 uppercase font-bold tracking-widest block">
                                  Captured at {clip.timestamp} • Size: {clip.size}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                {clip.url ? (
                                  <>
                                    <a
                                      href={clip.url}
                                      download={clip.name}
                                      className="bg-[#00ffe1]/10 hover:bg-[#00ffe1]/20 text-[#00ffe1] p-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                                      title="Download Recording File"
                                    >
                                      Download
                                    </a>
                                  </>
                                ) : (
                                  <span className="text-[8px] bg-zinc-900 border border-zinc-850 text-zinc-500 px-2 py-1 rounded">
                                    EMULATED
                                  </span>
                                )}
                                <button
                                  onClick={() => deleteRecordedClip(clip.id)}
                                  className="text-red-500 hover:text-red-400 p-1.5 font-bold text-[9px] uppercase hover:bg-red-500/5 rounded-lg transition-colors cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between bg-black/40 p-3.5 rounded-xl border border-zinc-900">
                    <div className="flex items-center gap-2 text-zinc-400 text-xs font-mono">
                      <Volume2 className="text-red-550 w-4.5 h-4.5 animate-bounce shrink-0" />
                      <span>SECURE LOCAL MATRIX TRANSMITTING</span>
                    </div>
                    <div className="flex items-end gap-1 h-6">
                      {audioBars.map((ht, idx) => (
                        <span key={idx} className="w-1 bg-red-400 rounded-t" style={{ height: `${ht}px` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* 💼 TOP 10 CONNECTED SOCIAL MEDIA PLATFORMS AT THE CENTER */}
              <div className="bg-[#030308] border border-zinc-900 rounded-3xl p-5 space-y-4">
                <div className="flex justify-between items-center border-b border-zinc-900 pb-3">
                  <div>
                    <h4 className="text-xs font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                      CONNECTED CHANNELS & AUDIENCE NETWORK (TOP 10)
                    </h4>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1 block">
                      Tap a platform to open login + channel · toggle sync with the link icon
                    </p>
                  </div>
                  <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-black text-emerald-400 uppercase tracking-widest animate-pulse">
                    MATRIX ACTIVE
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {socialPlatforms.map((plat) => {
                    const PlatIcon = plat.icon;
                    return (
                      <div
                        key={plat.id}
                        className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all text-center ${

                          plat.activeSync 
                            ? 'bg-[#050914] border-[#00ffe1]/50 shadow-[0_0_15px_rgba(0,255,225,0.08)]' 
                            : 'bg-black/40 border-zinc-900 text-zinc-500'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => openPlatformConnector(plat)}
                          className="flex flex-col items-center justify-center w-full cursor-pointer"
                          title={`Open ${plat.name}`}
                        >
                          <span className={`absolute top-1.5 left-1.5 w-1.5 h-1.5 rounded-full ${plat.activeSync ? 'bg-emerald-500' : 'bg-zinc-800'}`} />
                          <PlatIcon className={`w-4 h-4 mb-1.5 ${plat.activeSync ? plat.color : 'text-zinc-650'}`} />
                          <span className="font-cinzel text-[9px] font-black uppercase text-white tracking-wider max-w-full truncate">{plat.name}</span>
                          <span className="text-[9px] font-mono text-zinc-500 truncate max-w-full mt-0.5">{plat.handle}</span>
                          <span className="text-[10px] font-mono text-[#00ffe1] font-bold mt-1">{plat.followers}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => togglePlatformSyncState(plat.id)}
                          className={`absolute top-1.5 right-1.5 p-1 rounded-md border transition-colors cursor-pointer text-[8px] font-black uppercase tracking-wider ${
                            plat.activeSync
                              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-400'
                              : 'bg-zinc-950/90 border-zinc-800 text-zinc-500 hover:text-[#00ffe1] hover:border-[#00ffe1]/40'
                          }`}
                          title={plat.activeSync ? 'Cross-post sync ON — click to disable' : 'Cross-post sync OFF — click to enable'}
                          aria-pressed={plat.activeSync}
                        >
                          <RefreshCw className={`w-3 h-3 ${plat.activeSync ? 'text-emerald-400' : ''}`} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ✍️ ADVANCED INTUITIVE POST COMPOSER */}
              <div className="bg-[#030308] border-2 border-[#ff007f]/20 rounded-3xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <span className="text-xs font-mono font-black text-[#ff007f] uppercase tracking-widest flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#ff007f] animate-ping" />
                    COCKPIT FEED SYNDICATION CENTER
                  </span>
                  <span className="text-[8px] bg-zinc-900 border border-white/5 font-mono uppercase font-black px-2 py-0.5 rounded text-zinc-500">
                    AES-256 BUFFER
                  </span>
                </div>

                <form onSubmit={handlePostCreationSubmit} className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="text-[9px] font-mono text-zinc-500 uppercase font-black">Feed category</label>
                    <select
                      value={selectedPostCategory}
                      onChange={(e) => setSelectedPostCategory(e.target.value as typeof selectedPostCategory)}
                      className="bg-zinc-950 border border-zinc-900 text-[10px] font-mono text-[#ff007f] rounded-lg px-2 py-1 outline-none uppercase font-extrabold"
                    >
                      {(['Macro', 'Liquidity', 'Strategy', 'Private Broadcast', 'Education'] as const).map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <textarea
                    value={composerText}
                    onChange={(e) => setComposerText(e.target.value)}
                    placeholder="Relay macro breakdowns, liquidity sweeps, or customized team guidelines outbound..."
                    className="w-full bg-zinc-950/80 border border-zinc-900 focus:border-[#ff007f]/50 rounded-2xl p-4 text-white text-xs sm:text-sm outline-none resize-none min-h-[100px] transition-all font-semibold font-sans"
                  />

                  {/* Attachment Status Indicator Badges */}
                  <div className="flex flex-wrap gap-2.5">
                    {attachedChartTicker && (
                      <span className="text-[9px] bg-[#00ffe1]/10 border border-[#00ffe1]/30 text-[#00ffe1] px-2.5 py-1 rounded font-mono uppercase tracking-widest font-black flex items-center gap-1.5">
                        📈 CHART ATTACHED: {attachedChartTicker}
                        <button type="button" onClick={() => setAttachedChartTicker('')} className="text-white hover:text-red-500">×</button>
                      </span>
                    )}

                    {simulatedMediaFile && (
                      <span className="text-[9px] bg-[#ff3df2]/10 border border-[#ff3df2]/30 text-[#ff3df2] px-2.5 py-1 rounded font-mono uppercase tracking-widest font-black flex items-center gap-1.5">
                        🖼️ MEDIA FRAME SEEDED
                        <button type="button" onClick={() => setSimulatedMediaFile(null)} className="text-white hover:text-red-500">×</button>
                      </span>
                    )}

                    {showPollBox && (
                      <span className="text-[9px] bg-orange-500/10 border border-orange-500/30 text-orange-400 px-2.5 py-1 rounded font-mono uppercase tracking-widest font-black flex items-center gap-1.5">
                        🗳️ VOTING POLL LOADED
                        <button type="button" onClick={() => setShowPollBox(false)} className="text-white hover:text-red-500">×</button>
                      </span>
                    )}
                  </div>

                  {/* Poll Creation Config Form */}
                  {showPollBox && (
                    <div className="bg-[#080812] border border-zinc-900 rounded-2xl p-4 space-y-3 font-mono text-xs">
                      <div>
                        <label className="text-zinc-550 block font-black text-[9px] uppercase tracking-wider mb-1">Poll Question / Inquest:</label>
                        <input
                          type="text"
                          placeholder="e.g., Will London Session sweep Frankfurt pre-markets?"
                          className="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-2 text-white outline-none focus:border-[#00ffe1]"
                          onChange={(e) => setComposerPoll({ question: e.target.value, options: [] })}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-zinc-550 block font-black text-[9px] uppercase tracking-wider">Votable Targets:</label>
                        {pollInputs.map((val, idx) => (
                          <input
                            key={idx}
                            type="text"
                            placeholder={`Option ${idx + 1}`}
                            value={val}
                            onChange={(e) => updatePollOptionVal(idx, e.target.value)}
                            className="w-full bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-white outline-none text-[11px]"
                          />
                        ))}
                        {pollInputs.length < 5 && (
                          <button
                            type="button"
                            onClick={addPollOptionField}
                            className="text-[10px] text-[#00ffe1] uppercase tracking-widest font-black flex items-center gap-1 mt-1 cursor-pointer"
                          >
                            + Option Target Field
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Toolbar & Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-900 pt-3">
                    
                    {/* Media attachments triggers */}
                    <div className="flex items-center gap-2">
                      {/* Attached chart selector drop */}
                      <div className="relative flex items-center gap-1.5">
                        <BarChart4 className="w-4 h-4 text-[#00ffe1]" />
                        <select
                          value={attachedChartTicker}
                          onChange={(e) => {
                            setAttachedChartTicker(e.target.value);
                            addTelemetryLog(`Indicator attached to draft post: ${e.target.value}`);
                          }}
                          className="bg-zinc-900 border border-zinc-800 text-[10px] font-mono text-[#00ffe1] rounded px-2 py-1 outline-none uppercase font-extrabold"
                        >
                          <option value="">Attach Chart</option>
                          {availableTickers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>

                      {/* Attached simulated media */}
                      <button
                        type="button"
                        onClick={simulateMediaUpload}
                        className="p-1 px-2.5 bg-zinc-950 border border-zinc-850 hover:border-[#ff3df2]/50 text-zinc-400 hover:text-white rounded text-[10px] font-mono uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <Image className="w-3.5 h-3.5 text-pink-500" />
                        Media Image
                      </button>

                      {/* Toggle Poll box */}
                      <button
                        type="button"
                        onClick={() => {
                          setShowPollBox(!showPollBox);
                          setComposerPoll({ question: '', options: [] });
                        }}
                        className="p-1 px-2.5 bg-zinc-950 border border-zinc-850 hover:border-orange-500/50 text-zinc-400 hover:text-white rounded text-[10px] font-mono uppercase flex items-center gap-1 cursor-pointer"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-orange-500" />
                        Inquest Poll
                      </button>
                    </div>

                    <button
                      type="submit"
                      disabled={!composerText.trim()}
                      className="bg-gradient-to-r from-[#ff007f] to-[#ff5a1f] text-white px-5 py-2.5 rounded-xl font-mono text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(255,0,127,0.25)] hover:from-[#e1006e] transition-all cursor-pointer disabled:opacity-40"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Broadcast
                    </button>

                  </div>
                </form>
              </div>

              {/* FEED POSTS MATRIX */}
              <div className="space-y-4">
                {posts.map((post) => (
                  <div key={post.id} className="bg-[#04040a] border border-zinc-900/90 rounded-3xl p-5 space-y-4 text-left relative overflow-hidden shadow-lg">
                    {post.isPinned && (
                      <div className="absolute top-0 right-0 bg-[#ff5a1f]/10 border-b border-l border-[#ff5a1f]/35 px-3 py-1 font-mono text-[8px] font-black text-[#ff5a1f] uppercase tracking-widest">
                        🎯 PINNED COMPLIANCE BROOM
                      </div>
                    )}

                    {/* Author bar */}
                    <div className="flex justify-between items-start gap-3">
                      <div className="flex items-center gap-2.5">
                        <img src={post.author.avatar} alt="Author" className="w-9 h-9 rounded-full object-cover border border-[#00ffe1]/20 shrink-0" referrerPolicy="no-referrer" />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-cinzel font-black text-white uppercase tracking-widest">{post.author.name}</span>
                            {post.author.isVerified && <CheckCircle2 className="w-3.5 h-3.5 text-[#00ffe1] fill-indigo-500/15" />}
                          </div>
                          <span className="text-[9px] font-mono text-zinc-550 uppercase tracking-widest">@{post.author.username} // {post.timestamp}</span>
                        </div>
                      </div>

                      <span className="text-[8px] font-mono font-black uppercase tracking-widest px-2.5 py-0.5 rounded bg-black border border-zinc-900 text-zinc-400">
                        {post.category}
                      </span>
                    </div>

                    {/* Body Text */}
                    <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-semibold pl-3.5 border-l-2 border-[#ff5a1f]/40">
                      {post.content}
                    </p>

                    {/* Embedded Poll render */}
                    {post.poll && (
                      <div className="bg-black/60 border border-zinc-900 rounded-2xl p-4 space-y-2.5 text-xs font-mono">
                        <span className="text-orange-400 uppercase font-black text-[9px] block">🗳️ INQUEST POLL ATTACHED:</span>
                        <h5 className="font-bold text-white text-[11px] mb-1">{post.poll.question}</h5>
                        <div className="space-y-2">
                          {post.poll.options.map((opt, oIdx) => {
                            const totalVal = post.poll?.options.reduce((sum, current) => sum + current.votes, 0) || 1;
                            const percentage = Math.round((opt.votes / totalVal) * 100) || 0;
                            return (
                              <button
                                key={oIdx}
                                onClick={() => castOptionVote(post.id, oIdx)}
                                className="w-full bg-zinc-950/80 hover:bg-[#00ffe1]/5 border border-zinc-850 focus:border-[#00ffe1] text-left p-2.5 rounded-lg transition-all relative overflow-hidden cursor-pointer"
                              >
                                <div className="absolute top-0 bottom-0 left-0 bg-[#00ffe1]/5 transition-all" style={{ width: `${percentage}%` }} />
                                <div className="flex justify-between items-center relative z-10 font-bold text-zinc-250">
                                  <span>{opt.text}</span>
                                  <span className="text-[#00ffe1] font-black">{opt.votes} votes ({percentage}%)</span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Embedded mini chart indicator render */}
                    {post.chartAttached && (
                      <div className="bg-zinc-950/90 border border-[#00ffe1]/20 rounded-2xl p-4 text-xs font-mono">
                        <div className="flex justify-between items-center border-b border-zinc-900 pb-1.5 mb-2">
                          <span className="text-zinc-500 uppercase font-bold text-[9px]">📈 GRAPH ATTACHMENT PORT:</span>
                          <span className="text-[#00ffe1] font-black">{post.chartAttached} DECK</span>
                        </div>
                        <div className="h-20 flex items-end gap-1 px-1 bg-black/60 rounded border border-zinc-900 relative">
                          <div className="absolute top-2 left-2 text-[#00ffe1] text-[10px] font-black uppercase">
                            SIMULATED HISTORIC TELEMETRY
                          </div>
                          {/* Sleek inline mini preview sparkline */}
                          <svg className="w-full h-12 stroke-[#00ffe1] stroke-2 fill-none overflow-visible">
                            <path d="M 0 30 Q 30 15 60 40 T 120 10 T 180 35 T 240 5 T 320 25" />
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Media Attachments */}
                    {post.mediaUrl && (
                      <div className="border border-zinc-900 rounded-2xl overflow-hidden max-h-[220px]">
                        <img src={post.mediaUrl} alt="Attached Media" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    )}

                    {/* Quick Reactions bar */}
                    <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-zinc-900/60 font-mono text-[10px]">
                      
                      <button 
                        onClick={() => triggerReactionCount(post.id, 'fires')}
                        className="px-2.5 py-1.5 bg-black/50 hover:bg-[#ff5a1f]/10 border border-white/5 hover:border-[#ff5a1f]/3 w-14 rounded-lg flex items-center justify-center gap-1 text-zinc-400 hover:text-[#ff5a1f] transition-all cursor-pointer font-bold"
                      >
                        <Flame className="w-3.5 h-3.5 text-orange-500" />
                        {post.reactions.fires}
                      </button>

                      <button 
                        onClick={() => triggerReactionCount(post.id, 'rockets')}
                        className="px-2.5 py-1.5 bg-black/50 hover:bg-[#00ffe1]/10 border border-white/5 hover:border-[#00ffe1]/3 w-14 rounded-lg flex items-center justify-center gap-1 text-zinc-400 hover:text-[#00ffe1] transition-all cursor-pointer font-bold"
                      >
                        <Rocket className="w-3.5 h-3.5 text-[#00ffe1]" />
                        {post.reactions.rockets}
                      </button>

                      <button 
                        onClick={() => triggerReactionCount(post.id, 'hearts')}
                        className="px-2.5 py-1.5 bg-black/50 hover:bg-[#ff007f]/10 border border-white/5 hover:border-[#ff007f]/3 w-14 rounded-lg flex items-center justify-center gap-1 text-zinc-400 hover:text-[#ff007f] transition-all cursor-pointer font-bold"
                      >
                        <Heart className="w-3.5 h-3.5 text-[#ff007f]" />
                        {post.reactions.hearts}
                      </button>

                      <div className="h-4 w-[1px] bg-zinc-850 mx-1" />

                      <button 
                        onClick={() => triggerRepostAction(post.id)}
                        className="px-2.5 py-1.5 bg-black/50 hover:bg-purple-500/10 border border-white/5 hover:border-purple-500/3 w-16 rounded-lg flex items-center justify-center gap-1 text-zinc-400 hover:text-purple-400 transition-all cursor-pointer font-bold"
                      >
                        <Share2 className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
                        {post.repostsCount}
                      </button>

                      <span className="text-[8px] text-zinc-550 ml-auto uppercase font-black">SECURITIES SECURE</span>
                    </div>

                    {/* Rendering Comment Thread */}
                    {post.comments.length > 0 && (
                      <div className="space-y-2 pt-3 border-t border-zinc-950/80 bg-zinc-950/40 p-3.5 rounded-2xl">
                        {post.comments.map((comment) => (
                          <div key={comment.id} className="text-[11px] font-mono space-y-1">
                            <div className="flex justify-between font-bold text-[#00ffe1] uppercase tracking-wider text-[10px]">
                              <span>👤 {comment.author}</span>
                              <span className="text-zinc-650 text-[8px]">{comment.timestamp}</span>
                            </div>
                            <p className="text-zinc-350 font-semibold pl-3 border-l border-zinc-900">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Submit Comment */}
                    <form 
                      onSubmit={(e) => writeCommentSubmit(post.id, e)}
                      className="flex items-center gap-2 bg-zinc-950/60 border border-zinc-900 rounded-xl p-1 mt-1"
                    >
                      <input
                        type="text"
                        placeholder="Synapse custom insight..."
                        value={commentInputStrMap[post.id] || ''}
                        onChange={(e) => setCommentInputStrMap({ ...commentInputStrMap, [post.id]: e.target.value })}
                        className="bg-transparent border-none outline-none font-mono text-xs text-white flex-1 pl-2.5 focus:ring-0"
                      />
                      <button 
                        type="submit"
                        disabled={!(commentInputStrMap[post.id] || '').trim()}
                        className="bg-[#00ffe1] hover:bg-[#00d8bf] text-black w-7 h-7 rounded-lg flex items-center justify-center transition-all cursor-pointer disabled:opacity-40 shrink-0"
                      >
                        <Send className="w-3 h-3 fill-current" />
                      </button>
                    </form>

                  </div>
                ))}
              </div>

            </div>
          )}

          {/* VIEW: COMMUNITIES */}
          {activeMenu === 'Communities' && (
            <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                  DECENTRALIZED COMMUNITY CHANNELS
                </h4>
                <p className="text-[10px] sm:text-xs font-mono text-zinc-500 uppercase tracking-widest mt-1">
                  Active server compartments for coordinated liquid asset tactics
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {communities.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedCommunity(c.id);
                      addTelemetryLog(`Channel focused segment: ${c.name}`);
                    }}
                    className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer min-h-[110px] ${
                      selectedCommunity === c.id 
                        ? 'bg-[#090b14] border-[#00ffe1] shadow-[0_0_15px_rgba(0,255,225,0.1)]' 
                        : 'bg-black/50 border-zinc-900 hover:border-zinc-800'
                    }`}
                  >
                    <div>
                      <span className="text-[8px] bg-zinc-900 border border-white/5 font-mono text-zinc-400 px-2 py-0.5 rounded uppercase font-black">
                        {c.type}
                      </span>
                      <h5 className="font-bold text-[#ff007f] text-xs sm:text-sm uppercase font-cinzel mt-2">{c.name}</h5>
                    </div>
                    <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500 mt-2.5 border-t border-zinc-900 pt-1.5 w-full">
                      <span>👤 {c.members} Members</span>
                      <span className="text-[#00ffe1] font-bold">● {c.active} Live</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Chat compartment matching community */}
              <div className="bg-black/60 border border-zinc-900 rounded-3xl p-5 space-y-4">
                <span className="text-zinc-550 block font-mono text-[9px] font-black uppercase tracking-wider">
                  RADIO BROADCAST FEED COMM:
                </span>
                
                <div className="space-y-3 h-48 overflow-y-auto pr-1">
                  {messages.filter(m => m.channelId === selectedCommunity).map((m) => (
                    <div key={m.id} className="flex gap-2 text-xs font-mono relative bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-900">
                      <img src={m.avatar} alt="Sender" className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                      <div>
                        <div className="flex items-center gap-2">
                          <strong className="text-[#00ffe1] uppercase text-[9px] font-bold">{m.author}</strong>
                          <span className="text-[8px] text-zinc-650">{m.time}</span>
                        </div>
                        <p className="text-zinc-300 font-semibold mt-0.5">{m.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Broadcast text pulse across downlines..."
                    className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-[#00ffe1] rounded-xl px-3 text-xs outline-none text-white font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && sendRoomMessage(selectedCommunity)}
                  />
                  <button
                    onClick={() => sendRoomMessage(selectedCommunity)}
                    className="bg-[#00ffe1] hover:bg-[#00d8bf] text-black w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"
                  >
                    <Send className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: MESSAGES (Radio Channels inbox) */}
          {activeMenu === 'Messages' && (
            <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3 flex flex-wrap justify-between items-start gap-3">
                <div>
                  <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                    RADIO CHANNELS & DIRECT MESSAGES
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                    Encrypted downline comms across guild channels
                  </p>
                </div>
                <select
                  value={messagesChannelFilter}
                  onChange={(e) => setMessagesChannelFilter(e.target.value)}
                  className="bg-zinc-950 border border-zinc-900 text-[10px] font-mono text-[#00ffe1] rounded-lg px-2 py-1.5 outline-none uppercase font-extrabold"
                >
                  <option value="all">All Channels</option>
                  {communities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {communities.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setMessagesChannelFilter(c.id);
                      setSelectedCommunity(c.id);
                      addTelemetryLog(`Messages inbox focused: ${c.name}`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      messagesChannelFilter === c.id
                        ? 'bg-[#090b14] border-[#00ffe1]'
                        : 'bg-black/50 border-zinc-900 hover:border-zinc-700'
                    }`}
                  >
                    <span className="text-[9px] font-mono text-zinc-500 uppercase">{c.type}</span>
                    <p className="text-xs font-bold text-[#ff007f] mt-1">{c.name}</p>
                    <p className="text-[9px] text-zinc-500 mt-1">{messages.filter((m) => m.channelId === c.id).length} packets</p>
                  </button>
                ))}
              </div>

              <div className="bg-black/60 border border-zinc-900 rounded-3xl p-5 space-y-4">
                <span className="text-zinc-550 block font-mono text-[9px] font-black uppercase tracking-wider">
                  INBOX STREAM
                </span>

                <div className="space-y-3 h-56 overflow-y-auto pr-1">
                  {messages
                    .filter((m) => messagesChannelFilter === 'all' || m.channelId === messagesChannelFilter)
                    .map((m) => (
                      <div key={m.id} className="flex gap-2 text-xs font-mono relative bg-zinc-950/50 p-2.5 rounded-xl border border-zinc-900">
                        <img src={m.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <strong className="text-[#00ffe1] uppercase text-[9px] font-bold">{m.author}</strong>
                            <span className="text-[8px] text-zinc-650">{m.time}</span>
                            <span className="text-[8px] text-zinc-600 uppercase">#{communities.find((c) => c.id === m.channelId)?.name ?? m.channelId}</span>
                          </div>
                          <p className="text-zinc-300 font-semibold mt-0.5 break-words">{m.content}</p>
                        </div>
                      </div>
                    ))}
                  {messages.filter((m) => messagesChannelFilter === 'all' || m.channelId === messagesChannelFilter).length === 0 && (
                    <p className="text-[10px] font-mono text-zinc-600 text-center py-8 uppercase">No messages in this channel yet</p>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessageText}
                    onChange={(e) => setNewMessageText(e.target.value)}
                    placeholder="Transmit on selected channel..."
                    className="flex-1 bg-zinc-950 border border-zinc-900 focus:border-[#00ffe1] rounded-xl px-3 text-xs outline-none text-white font-mono"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const target = messagesChannelFilter === 'all' ? selectedCommunity : messagesChannelFilter;
                        sendRoomMessage(target);
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const target = messagesChannelFilter === 'all' ? selectedCommunity : messagesChannelFilter;
                      sendRoomMessage(target);
                    }}
                    className="bg-[#00ffe1] hover:bg-[#00d8bf] text-black w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"
                  >
                    <Send className="w-4 h-4 fill-current" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: LIVE MEETINGS */}
          {activeMenu === 'Live Meetings' && (
            <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                    SENSORY LIVE VIDEO MEETING CENTER
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                    Presenter matrix dashboard supporting private stream routing
                  </p>
                </div>
                <span className="text-[8px] bg-red-650 text-[#00ffe1] font-mono px-2 py-0.5 rounded font-black tracking-widest uppercase">
                  HQ AUDIO SYNCED
                </span>
              </div>

              {/* Presenter Box Simulator */}
              <div className="bg-black border border-zinc-900 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between min-h-[220px] shadow-2xl">
                <div className="absolute top-4 right-4 flex gap-1.5 z-10">
                  <span className="bg-zinc-900 border border-white/5 text-[9px] font-mono text-emerald-400 px-2 py-0.5 rounded">
                    ● PRESENTER MODE
                  </span>
                  {isSharingScreen && (
                    <span className="bg-[#00ffe1]/10 border border-[#00ffe1]/20 text-[9px] font-mono text-[#00ffe1] px-2 py-0.5 rounded animate-pulse">
                      🖥️ SCREEN SHARE ON
                    </span>
                  )}
                </div>

                {/* Simulated Visual Video frame */}
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 py-8">
                  {!isCamOff && (mediaStream || cameraActive) ? (
                    <div className="relative w-40 h-40 rounded-2xl bg-black border-2 border-[#ff007f]/40 overflow-hidden shadow-2xl flex items-center justify-center">
                      {mediaStream ? (
                        <video
                          ref={(el) => {
                            if (el) {
                              el.srcObject = mediaStream;
                              el.play().catch(err => console.log("Meeting Video spec error:", err));
                            }
                          }}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover"
                          style={{
                            filter: getFilterCss(),
                            transform: `rotate(${cameraRotation}deg) ${cameraMirrored ? 'scaleX(-1)' : 'scaleX(1)'}`
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-4">
                          <Radio className="w-8 h-8 text-[#ff007f] animate-ping mb-2" />
                          <span className="text-[10px] text-zinc-400 font-mono font-bold uppercase tracking-widest">STREAM EMULATOR</span>
                        </div>
                      )}
                      
                      {/* Active mic indictor inside feed */}
                      <span className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded font-mono text-[8px] text-emerald-400 border border-emerald-500/30">
                        ● {!isMicMuted ? 'AUDIO LIVE' : 'AUDIO MUTED'}
                      </span>
                      <div className="absolute inset-0 bg-scanlines pointer-events-none opacity-20" />
                    </div>
                  ) : (
                    <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-red-500 p-1 shadow-lg shrink-0">
                      <img src={avatarUrl} alt="Presenter avatar" className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
                      {!isMicMuted ? (
                        <span className="absolute bottom-0 right-0 bg-emerald-500 p-1 rounded-full text-white border-2 border-black">
                          <Mic className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="absolute bottom-0 right-0 bg-red-650 p-1 rounded-full text-white border-2 border-black">
                          <MicOff className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  )}

                  <div className="text-center">
                    <h5 className="font-cinzel font-black text-xs sm:text-sm text-[#ff007f] uppercase tracking-wider">
                      {displayName} (Lead Presenter)
                    </h5>
                    <p className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">
                      Broadcasting sensory pipeline: {isCamOff ? 'CAMERA DOWN' : 'CAMERA ENGAGED'}
                    </p>
                  </div>
                </div>

                {/* Bottom toolbar indicators */}
                <div className="flex flex-wrap justify-center gap-2.5 border-t border-zinc-900 pt-3">
                  <button
                    onClick={() => {
                      setIsMicMuted(!isMicMuted);
                      addTelemetryLog(isMicMuted ? 'Sensory microphone matrix unmuted.' : 'Broadcaster microphone muted.');
                    }}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-widest font-black flex items-center gap-1 cursor-pointer transition-all ${
                      !isMicMuted ? 'bg-emerald-550 text-white' : 'bg-red-650 text-white'
                    }`}
                  >
                    {!isMicMuted ? 'Mute Mic' : 'Unmute Mic'}
                  </button>

                  <button
                    onClick={() => {
                      const nextCamState = !isCamOff;
                      setIsCamOff(nextCamState);
                      if (!nextCamState) {
                        if (!cameraAllowed) {
                          setShowConsentModal(true);
                        } else {
                          initCameraStream(facingMode);
                        }
                        addTelemetryLog('Visual tracking camera system booted.');
                      } else {
                        stopCameraStream();
                        addTelemetryLog('Presenter camera deactivated.');
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-widest font-black flex items-center gap-1 cursor-pointer transition-all ${
                      !isCamOff ? 'bg-zinc-900 border border-zinc-800 text-zinc-350 hover:text-white' : 'bg-red-650 text-white'
                    }`}
                  >
                    {!isCamOff ? 'Camera Off' : 'Camera On'}
                  </button>

                  {!isCamOff && (mediaStream || cameraActive) && (
                    <button
                      onClick={flipCameraDirection}
                      className="px-3 py-1.5 rounded-lg font-mono text-[9px] uppercase tracking-widest font-black flex items-center gap-1.5 cursor-pointer transition-all bg-zinc-900 border border-[#00ffe1]/30 hover:border-[#00ffe1] text-[#00ffe1] animate-pulse"
                      title="Flip camera between user-facing front camera and environment-facing rear camera"
                    >
                      <RefreshCw className="w-3 h-3 text-[#00ffe1]" />
                      Flip Cam
                    </button>
                  )}

                  <button
                    onClick={() => {
                      setIsSharingScreen(!isSharingScreen);
                      addTelemetryLog(isSharingScreen ? 'Desk screen share discontinued.' : 'Holographic chart screen share initiated.');
                    }}
                    className={`px-3 py-1.5 rounded-[0.5rem] font-mono text-[9px] uppercase tracking-widest font-black flex items-center gap-1 cursor-pointer transition-all ${
                      isSharingScreen ? 'bg-[#00ffe1] text-black' : 'bg-zinc-900 border border-zinc-800 text-zinc-300'
                    }`}
                  >
                    Share Chart Screen
                  </button>
                </div>
              </div>

              {/* Join Active room selector */}
              <div className="space-y-3 font-mono text-xs">
                <span className="text-zinc-550 font-black text-[9px] uppercase block tracking-wider">AVAILABLE VOLTAGE CHANNELS:</span>
                {[
                  { id: 'room-1', name: 'NYC Open Alignment Zone', host: 'Rick Floyd', participants: 48, active: true },
                  { id: 'room-2', name: 'Asia Session Carry Desk', host: 'Kenji Yamada', participants: 12, active: false }
                ].map((room) => (
                  <div key={room.id} className="flex justify-between items-center p-4 bg-[#0a0a14] border border-zinc-900 rounded-xl">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span className="font-bold text-[#00ffe1] text-xs uppercase">{room.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500 uppercase mt-0.5 block">Host: {room.host}</span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedMeetingRoom(room.id);
                        addTelemetryLog(`Linked securely with visual stream room: [${room.name}]`);
                      }}
                      className="bg-[#00ffe1]/10 border border-[#00ffe1]/30 hover:bg-[#00ffe1] text-[#00ffe1] hover:text-black py-1.5 px-3 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Join Room Stream
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: CHARTS TERMINAL (Draggable & resizable neon indicators grid) */}
          {activeMenu === 'Charts' && (
            <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-start sm:items-center flex-col sm:flex-row gap-3">
                <div>
                  <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                    Sovereign Custom Chart Specter (Max 4 Ports)
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-1">
                    Drag resizables or link automatic indicator arrays instantly
                  </p>
                </div>
                
                {/* Selector interface to append new chart ports */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-zinc-400 uppercase font-black">Spawn Channel:</span>
                  <select 
                    onChange={(e) => {
                      if (e.target.value) handleAddChartWidget(e.target.value);
                      e.target.value = '';
                    }}
                    className="bg-zinc-950 border border-zinc-850 text-[#00ffe1] font-mono text-[10px] rounded px-2.5 py-1.5 uppercase font-bold outline-none cursor-pointer"
                  >
                    <option value="">+ SELECT TICKER</option>
                    {availableTickers.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {/* Render Spawned Chart Port Grid card boxes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeCharts.map((ch) => (
                  <div key={ch.id} className="bg-black border-2 border-[#00ffe1]/20 hover:border-[#00ffe1]/40 rounded-2xl p-4.5 space-y-3.5 relative overflow-hidden shadow-lg">
                    {/* Top control bar inside chart card */}
                    <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                      <div>
                        <span className="text-sm font-black text-[#ff007f] font-mono">{ch.symbol}</span>
                        <span className={`text-[10px] font-mono font-bold ml-2 ${ch.change >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {ch.change >= 0 ? '+' : ''}{ch.change}%
                        </span>
                      </div>
                      <button 
                        onClick={() => removeChartWidget(ch.id)}
                        className="text-zinc-550 hover:text-red-500 transition-colors text-xs font-mono font-black"
                      >
                        [UNMOUNT]
                      </button>
                    </div>

                    {/* Numeric display rates */}
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-zinc-550 font-mono uppercase text-[8px] font-bold block">REAL-TIME TELEMETRY RATE:</span>
                        <span className="text-lg font-mono font-black text-[#00ffe1] tracking-widest">{watchlist[ch.symbol]?.price || ch.price}</span>
                      </div>
                      <div className="text-right text-[9px] font-mono text-zinc-550 border border-white/5 bg-zinc-950 px-2 py-0.5 rounded">
                        TIME SENSORY: {watchlist[ch.symbol]?.lastUpdate || 'LIVE'}
                      </div>
                    </div>

                    {/* Highly aesthetic glowing custom SVG sparkline simulation with indicators */}
                    <div className="h-28 bg-zinc-950 rounded-xl relative border border-zinc-900 flex items-end">
                      <div className="absolute inset-0 bg-grid-zinc font-mono z-10 pointer-events-none" />
                      
                      {/* Technical indicators overlays */}
                      {ch.indicators.ema && (
                        <div className="absolute top-2 left-2 text-[8px] font-mono text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded tracking-widest">
                          EMA 200 MATRIX IN-LINE
                        </div>
                      )}

                      {/* Custom indicator lines rendering */}
                      <svg className="w-full h-full stroke-2 fill-none overflow-visible absolute top-0 bottom-0 left-0 right-0 p-3">
                        <defs>
                          <linearGradient id={`grad-${ch.id}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#00ffe1" stopOpacity="0.2" />
                            <stop offset="100%" stopColor="#00ffe1" stopOpacity="0" />
                          </linearGradient>
                        </defs>

                        {/* Standard Base neon line */}
                        <path 
                          d="M 0 60 Q 25 35 50 70 T 100 20 T 150 75 T 200 15 T 300 45" 
                          className="stroke-[#00ffe1] animate-pulse" 
                        />
                        {/* Shifting background area under spark line */}
                        <path 
                          d="M 0 60 Q 25 35 50 70 T 100 20 T 150 75 T 200 15 T 300 45 L 300 120 L 0 120 Z" 
                          fill={`url(#grad-${ch.id})`} 
                        />

                        {/* Bollinger EMA reference overlay indicator lines */}
                        {ch.indicators.ema && (
                          <path 
                            d="M 0 50 Q 25 25 50 60 T 100 10 T 150 65 T 200 5 T 300 35" 
                            className="stroke-amber-500/50 stroke-1 stroke-dasharray" 
                            style={{ strokeDasharray: '4,4' }}
                          />
                        )}
                      </svg>
                    </div>

                    {/* Chart Indicator selection buttons inside widgets */}
                    <div className="flex gap-2 font-mono text-[9px] uppercase font-black">
                      <button
                        onClick={() => handleToggleIndicator(ch.id, 'ema')}
                        className={`px-2 py-1 rounded transition-all cursor-pointer ${
                          ch.indicators.ema ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-zinc-950 text-zinc-550 border border-zinc-900'
                        }`}
                      >
                        EMA 200
                      </button>

                      <button
                        onClick={() => handleToggleIndicator(ch.id, 'bb')}
                        className={`px-2 py-1 rounded transition-all cursor-pointer ${
                          ch.indicators.bb ? 'bg-[#ff007f]/20 text-[#ff007f] border border-[#ff007f]/30' : 'bg-zinc-950 text-zinc-550 border border-zinc-900'
                        }`}
                      >
                        BOLLINGER BANDS
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: TEAM NETWORK TREE */}
          {activeMenu === 'Team Network' && (
            <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                  DECENTRALIZED MULTI-DESK TREE
                </h4>
                <p className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest mt-1">
                  Active Server Downline Hierarchy Alignment (Click node to toggle children structures)
                </p>
              </div>

              {/* Rendering interactive tree nodes */}
              <div className="p-4 bg-black/40 border border-zinc-900 rounded-2xl overflow-x-auto font-mono text-xs text-zinc-300">
                {(() => {
                  const renderMemberNode = (node: TeamMember, depth: number = 0) => {
                    const isExpanded = !!expandedTeamNodes[node.id];
                    const hasChildren = node.subNodes && node.subNodes.length > 0;
                    return (
                      <div key={node.id} className="space-y-3">
                        
                        {/* Parent Node Container Row */}
                        <div 
                          onClick={() => hasChildren && toggleTeamNodeExpanded(node.id)}
                          className="flex justify-between items-center p-3.5 bg-zinc-950 shadow border border-zinc-900 rounded-xl cursor-pointer hover:bg-zinc-900/60 transition-all"
                          style={{ marginLeft: `${depth * 20}px` }}
                        >
                          <div className="flex items-center gap-2.5">
                            {hasChildren ? (
                              <span className="text-[#00ffe1]">{isExpanded ? '▼' : '▶'}</span>
                            ) : (
                              <span className="w-3.5 block" />
                            )}
                            <img src={node.avatar} alt="Avatar" className="w-7 h-7 rounded-full object-cover shrink-0" referrerPolicy="no-referrer" />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-[#ff007f] text-xs">{node.name}</span>
                                {node.active && <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 rounded animate-pulse">● LIVE</span>}
                              </div>
                              <span className="text-[9px] text-[#ff5a1f] uppercase block tracking-wider">{node.role} // {node.tier}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-[8px] text-zinc-550 block">MONTH VOLUME:</span>
                              <span className="font-black text-[#00ffe1] text-[11px]">{node.volume}</span>
                            </div>
                            <span className="text-[9px] font-black bg-[#ff007f]/5 border border-[#ff007f]/20 text-[#ff007f] px-2 py-1 rounded shrink-0">
                              {node.commission}
                            </span>
                          </div>
                        </div>

                        {/* Children container list */}
                        {hasChildren && isExpanded && (
                          <div className="relative border-l border-zinc-900 pl-1 space-y-2.5">
                            {node.subNodes?.map(sub => renderMemberNode(sub, depth + 1))}
                          </div>
                        )}

                      </div>
                    );
                  };

                  return renderMemberNode(teamNodes);
                })()}
              </div>
            </div>
          )}

          {/* VIEW: EDUCATION (Macro Academic Interactive Quiz Suite) */}
          {activeMenu === 'Education' && (
            <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                  CLEARPATHTRADER MACRO ACADEMIC QUIZ PORT
                </h4>
                <p className="text-[10px] font-mono text-zinc-550 uppercase tracking-widest mt-1">
                  Complete official risk simulation courses to obtain master rank certifications
                </p>
              </div>

              {/* Course selection list */}
              <div className="space-y-4">
                {educationCourses.map((c) => {
                  const isCompleted = completedQuizzes.includes(c.id);
                  const isExaming = activeQuizQuizId === c.id;
                  return (
                    <div key={c.id} className="bg-black border border-zinc-900 rounded-3xl p-5 space-y-3.5 relative overflow-hidden">
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <span className="text-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-mono font-black uppercase tracking-widest">
                            DIFFICULTY: {c.difficulty}
                          </span>
                          <h5 className="font-cinzel font-black text-xs sm:text-sm text-[#ff007f] uppercase tracking-wider mt-1.5">{c.title}</h5>
                        </div>
                        
                        <span className={`text-[10px] font-mono font-black uppercase ${isCompleted ? 'text-emerald-400' : 'text-zinc-500'}`}>
                          {isCompleted ? '✓ COMPLETED' : 'STANDBY'}
                        </span>
                      </div>

                      <p className="text-xs text-zinc-400 mt-1 font-semibold leading-relaxed">
                        {c.description}
                      </p>

                      <div className="flex justify-between items-center font-mono text-[10px] text-zinc-500 border-t border-zinc-900 pt-3">
                        <span>XP REWARD: +{c.earnedPoints} CP</span>
                        <span>⏱️ DURATION: {c.duration}</span>
                      </div>

                      {!isCompleted && !isExaming && (
                        <button
                          onClick={() => handleStartQuiz(c.id)}
                          className="w-full mt-2 bg-[#ff5a1f]/10 hover:bg-[#ff5a1f] border border-[#ff5a1f]/30 hover:border-transparent text-[#ff5a1f] hover:text-white py-2 rounded-xl text-center font-mono text-[11px] font-black uppercase tracking-wider transition-all cursor-pointer"
                        >
                          Start Quiz Exam
                        </button>
                      )}

                      {/* Rendering ACTIVE quiz answers inputs options */}
                      {isExaming && (
                        <div className="bg-[#08080f] border border-zinc-900 rounded-2xl p-4 mt-3 space-y-4 font-mono text-xs">
                          <div className="flex justify-between border-b border-zinc-900 pb-2">
                            <span className="text-zinc-550 font-black uppercase text-[9px]">ACTIVE EXAM SHELF:</span>
                            <button onClick={() => setActiveQuizQuizId(null)} className="text-zinc-500 hover:text-white">Cancel</button>
                          </div>

                          {c.questions.map((q, qidx) => (
                            <div key={qidx} className="space-y-2">
                              <p className="text-[#00ffe1] font-bold text-[11px]">{qidx + 1}. {q.q}</p>
                              <div className="space-y-1.5 pl-2.5">
                                {q.options.map((opt, oidx) => {
                                  const selectedIdx = selectedQuizAnswers[qidx];
                                  const isSelected = selectedIdx === oidx;
                                  return (
                                    <button
                                      key={oidx}
                                      onClick={() => {
                                        const copyAnswers = [...selectedQuizAnswers];
                                        copyAnswers[qidx] = oidx;
                                        setSelectedQuizAnswers(copyAnswers);
                                      }}
                                      className={`w-full text-left p-2 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                                        isSelected ? 'bg-[#00ffe1]/10 border border-[#00ffe1] text-[#00ffe1]' : 'bg-black text-zinc-400 hover:text-white'
                                      }`}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}

                          {selectedQuizAnswers.length === c.questions.length && (
                            <button
                              onClick={() => submitQuizAnswers(c.id)}
                              className="w-full mt-2 bg-[#00ffe1] text-black py-2.5 rounded-xl font-mono text-[11px] font-black uppercase tracking-widest text-center transition-all cursor-pointer"
                            >
                              SUBMIT ANSWERS FOR AUDIT
                            </button>
                          )}

                          {quizScore && (
                            <div className="p-3 rounded-lg border text-center font-mono text-xs font-semibold">
                              {quizScore.passed ? (
                                <div className="text-emerald-400">
                                  💯 PERFECT SCORE! RANK ACCREDITATION VERIFIED: Course Completed.
                                </div>
                              ) : (
                                <div className="text-rose-500">
                                  ⚠️ EXAM REJECTED: Perfect score required. Try again.
                                </div>
                              )}
                            </div>
                          )}

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: WATCHLIST */}
          {activeMenu === 'Watchlist' && (
            <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3 flex justify-between items-center">
                <div>
                  <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                    Sovereign Rate Spectrometer Watchlist
                  </h4>
                  <p className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest mt-1">
                    Flashing price indicators synced directly with Frankfurt live bus
                  </p>
                </div>
                <span className="text-[8px] bg-emerald-550 text-white px-2 py-0.5 rounded font-mono font-black tracking-widest">REALTIME</span>
              </div>

              <div className="space-y-2.5">
                {Object.keys(watchlist).map((symbol) => {
                  const data = watchlist[symbol];
                  return (
                    <div key={symbol} className="flex justify-between items-center p-4 bg-black border border-zinc-900 rounded-xl font-mono">
                      <div className="flex items-center gap-3">
                        <span className="font-black text-[#ff007f] text-sm tracking-widest">{symbol}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-black ${data.isUp ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-505/10 text-rose-500'}`}>
                          {data.isUp ? '▲ Ticking Up' : '▼ Receding'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs">
                        <div className="text-right">
                          <span className="text-zinc-555 block text-[8px] font-semibold">TICK RATE:</span>
                          <span className={`font-black text-sm tracking-wider ${data.isUp ? 'text-emerald-400' : 'text-zinc-200'}`}>
                            {data.price}
                          </span>
                        </div>
                        <div className="w-[1px] h-6 bg-zinc-900" />
                        <span className={`font-black tracking-widest text-[11px] shrink-0 w-16 text-right ${data.change >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          {data.change >= 0 ? '+' : ''}{data.change}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW: RISK MANAGEMENT / COMPLIANCE */}
          {activeMenu === 'Compliance' && (
            <div className="bg-[#04040a] border-2 border-red-500/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                  CFT SECURE COMPLIANCE MONITOR
                </h4>
                <p className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest mt-1">
                  Automated surveillance sweep intercepts toxic links and solicitation signals
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-black border border-zinc-900 p-4.5 rounded-2xl space-y-2 font-mono text-xs">
                  <span className="text-zinc-550 font-black uppercase text-[9px] block">MONITOR PRESETS:</span>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-[#ff007f] font-semibold">Broker Link Blocker:</span>
                    <strong className="text-emerald-400">ACTIVATED</strong>
                  </div>
                  <div className="flex justify-between items-center border-b border-zinc-900 pb-2">
                    <span className="text-[#ff007f] font-semibold">Unlicensed Advice Shield:</span>
                    <strong className="text-emerald-400">ONLINE</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#ff007f] font-semibold">Ledger Protection:</span>
                    <strong className="text-emerald-400">SENSORY LOCK</strong>
                  </div>
                </div>

                <div className="bg-[#090304] border border-red-500/20 p-4.5 rounded-2xl flex flex-col justify-between font-mono text-xs">
                  <div>
                    <span className="text-red-500 font-black uppercase text-[9px] block">SECURITY AUDITS LEVEL:</span>
                    <p className="text-zinc-400 text-[10px] mt-1 pr-1 font-semibold leading-relaxed">
                      Sovereign ledger sweeping protocols automatically lock commissions if potential solicitation loop infractions are detected.
                    </p>
                  </div>
                  <span className="text-emerald-400 text-[10px] font-black mt-2">● SHIELD OPERATES SECURELY</span>
                </div>
              </div>

              {/* Compliance Alerts list */}
              <div className="space-y-2 font-mono text-[11px]">
                <span className="text-zinc-550 font-black text-[9px] uppercase block tracking-wider">REAL-TIME COMPLIANCE INTERCEPTS:</span>
                {[
                  { id: '1', type: 'RESTRICTED BROKER URL', details: 'Blocked referral routing linking to blacklisted broker domains.', time: '11:41 AM' },
                  { id: '2', type: 'GUARANTEED REVENUE CLAIM', details: 'Filter auto-redacted claim matching prohibited solicitation patterns.', time: '11:12 AM' }
                ].map((a) => (
                  <div key={a.id} className="p-3.5 bg-[#0b0304] border border-red-500/30 rounded-xl flex items-start gap-3">
                    <ShieldX className="text-red-500 w-4 h-4 shrink-0 mt-0.5 animate-pulse" />
                    <div>
                      <div className="flex justify-between items-center w-full min-w-0">
                        <strong className="text-red-500 font-extrabold text-[10px] uppercase block tracking-wider">{a.type}</strong>
                        <span className="text-[9px] text-zinc-650 shrink-0">{a.time}</span>
                      </div>
                      <p className="text-zinc-350 pr-2 mt-0.5 font-semibold text-[10px]">{a.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: COMPLIANCE / SETTINGS */}
          {activeMenu === 'Settings' && (
            <div className="bg-[#04040a] border-2 border-[#ff5a1f]/20 rounded-3xl p-6 text-left space-y-6">
              <div className="border-b border-zinc-900 pb-3">
                <h4 className="text-base font-cinzel font-black text-[#00ffe1] uppercase tracking-wider">
                  OS COCKPIT PRESETS
                </h4>
                <p className="text-[10px] font-mono text-zinc-555 uppercase tracking-widest mt-1">
                  Adjust custom sensory alerts and local server profiles
                </p>
              </div>

              <div className="space-y-4 font-mono text-xs">
                
                {/* Visual themes select button */}
                <div className="space-y-2 bg-black border border-zinc-900 p-4 rounded-xl">
                  <span className="text-zinc-550 font-black text-[9px] uppercase tracking-wider block">1. COCKPIT THEME SPECTRUM:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setCockpitTheme('lava');
                        addTelemetryLog('Cockpit theme set: Industrial Molten Lava', 'success');
                      }}
                      className={`p-2 bg-zinc-950 border rounded font-bold uppercase text-[9px] tracking-wider text-center cursor-pointer ${
                        cockpitTheme === 'lava'
                          ? 'border-[#ff5a1f] text-[#ff5a1f]'
                          : 'border-zinc-850 text-zinc-500 hover:text-white'
                      }`}
                    >
                      Industrial Molten Lava {cockpitTheme === 'lava' ? '[ACTIVE]' : ''}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCockpitTheme('slate');
                        addTelemetryLog('Cockpit theme set: Sovereign Dark Slate', 'success');
                      }}
                      className={`p-2 bg-zinc-950 border rounded font-bold uppercase text-[9px] tracking-wider text-center cursor-pointer ${
                        cockpitTheme === 'slate'
                          ? 'border-[#00ffe1] text-[#00ffe1]'
                          : 'border-zinc-850 text-zinc-500 hover:text-white'
                      }`}
                    >
                      Sovereign Dark Slate {cockpitTheme === 'slate' ? '[ACTIVE]' : ''}
                    </button>
                  </div>
                </div>

                {/* Simulated web hook settings */}
                <div className="space-y-2 bg-black border border-zinc-900 p-4 rounded-xl">
                  <label className="text-zinc-550 font-black text-[9px] uppercase tracking-wider block">2. WEB TELEMETRY HOOK URL:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={TELEMETRY_HOOK_URL}
                      className="flex-1 bg-zinc-950 border border-zinc-850 rounded px-2.5 py-1.5 text-[#00ffe1] outline-none text-[10px] font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => void copyTelemetryHook()}
                      className="shrink-0 px-3 py-1.5 bg-[#00ffe1]/10 border border-[#00ffe1]/30 text-[#00ffe1] hover:bg-[#00ffe1] hover:text-black rounded text-[9px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Copy
                    </button>
                  </div>
                  <p className="text-[8px] text-zinc-500 leading-relaxed">
                    Direct RPC websocket connection string for external downline tickers integrations.
                  </p>
                </div>

              </div>
            </div>
          )}

        </div>

        {/* ==================================================== */}
        {/* RIGHT COLUMN / LIVE ECOSYSTEM MONITOR (Col-span 3)   */}
        {/* ==================================================== */}
        <div className="xl:col-span-3 space-y-5">
          
          {/* A. ACTIVE MEETINGS ROOM */}
          <div className="bg-[#030308] border-2 border-red-500/25 rounded-3xl p-5 space-y-4 shadow-2xl relative overflow-hidden text-left">
            
            {/* Pulsing Ember line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-650 animate-pulse" />

            <div className="border-b border-zinc-900 pb-3">
              <h4 className="text-xs font-cinzel font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="text-red-500 w-4 h-4 animate-ping shrink-0" />
                ACTIVE STREAM MEETINGS
              </h4>
              <span className="text-[9px] font-mono text-zinc-550 uppercase font-black block mt-0.5 tracking-widest">
                NY overlap aligned video channels
              </span>
            </div>

            <div className="space-y-3.5 font-mono text-xs">
              <div className="p-3 bg-zinc-950/90 border border-red-500/20 rounded-2xl relative">
                <span className="absolute top-1.5 right-1.5 text-[8px] bg-red-650 text-white px-2 py-0.5 rounded uppercase font-black tracking-widest">
                  LIVE NOW
                </span>
                <h5 className="font-bold text-white text-[11px] uppercase mr-12 leading-tight">Frankfurt Vacuum Liquidity Breakdowns</h5>
                <p className="text-[9px] text-zinc-550 mt-1 uppercase">Host: Master Captain Floyd</p>
                
                {/* Avatars of participants */}
                <div className="flex items-center gap-1.5 mt-3">
                  <div className="flex -space-x-2.5 overflow-hidden">
                    <img className="inline-block h-6 w-6 rounded-full ring-2 ring-black" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100" alt="" referrerPolicy="no-referrer" />
                    <img className="inline-block h-6 w-6 rounded-full ring-2 ring-black" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100" alt="" referrerPolicy="no-referrer" />
                    <img className="inline-block h-6 w-6 rounded-full ring-2 ring-black" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <span className="text-[9px] text-zinc-500 font-extrabold">+ 112 Active Copiers</span>
                </div>

                <button 
                  onClick={() => {
                    setActiveMenu('Live Meetings');
                    addTelemetryLog('Rerouting telemetry dashboard to active stream deck.');
                  }}
                  className="w-full mt-3 bg-red-650 hover:bg-red-550 text-white text-[9px] font-black uppercase py-2 rounded-lg text-center transition-all cursor-pointer block"
                >
                  Join Stream Room
                </button>
              </div>
            </div>

          </div>

          {/* B. SCREEN SHARING MONITOR PREVIEW */}
          <div className="bg-[#030308] border border-zinc-900 rounded-3xl p-5 space-y-3.5 text-left shadow-lg">
            <div className="border-b border-zinc-900 pb-2.5">
              <h4 className="text-xs font-cinzel font-black text-[#00ffe1] uppercase tracking-wider flex items-center gap-1.5">
                <Video className="text-[#00ffe1] w-4 h-4 shrink-0" />
                SCREEN SHARE STREAM MONITOR
              </h4>
              <span className="text-[8px] font-mono text-zinc-550 uppercase tracking-widest mt-0.5 block font-bold">
                PRESENTER CHANNEL LINK PREVIEWS
              </span>
            </div>

            {/* Simulated Live preview screen capture container */}
            <div className="relative h-28 bg-[#020205] border border-[#00ffe1]/30 rounded-2xl overflow-hidden flex flex-col justify-between p-3">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,255,225,0.06),transparent_70%)]" />
              
              <div className="flex justify-between items-center relative z-10 font-mono text-[8px] text-zinc-550 font-black uppercase">
                <span>FEED SCREEN: GRAPHS BUS 1</span>
                <span className="text-[#00ffe1] animate-pulse">● FEED SYNC</span>
              </div>

              {/* Vector overlay representing active charts grids */}
              <div className="w-full h-12 flex items-end justify-center z-10 p-1">
                <svg className="w-full h-full stroke-1 fill-none stroke-purple-400">
                  <path d="M 0 45 Q 60 10 120 40 T 240 10" />
                </svg>
              </div>

              <div className="flex justify-between items-center relative z-10">
                <span className="text-[9px] font-mono text-[#00ffe1] font-black uppercase tracking-wider">EUR/USD 1H GRAPH</span>
                <span className="text-[8px] text-zinc-650 font-mono font-bold">90 FPS</span>
              </div>
            </div>
          </div>

          {/* C. UPCOMING TRADING WEBINARS */}
          <div className="bg-[#030308] border border-zinc-900 rounded-3xl p-5 space-y-3 text-left shadow-lg">
            <div className="border-b border-zinc-900 pb-2.5 flex justify-between items-center">
              <h4 className="text-xs font-cinzel font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="text-purple-400 w-4 h-4" />
                UPCOMING EVENTS SYSTEM
              </h4>
              <span className="text-[8px] bg-purple-500/10 border border-purple-500/20 text-purple-400 px-2 py-0.5 rounded font-mono font-black animate-pulse">
                SYNCED
              </span>
            </div>

            <div className="space-y-3.5 font-mono text-xs">
              {[
                { id: 'ev-1', title: 'Premium NY Liquidity Sweeps Masterclass', date: 'TODAY // 14:00 EST', count: '1 hr 12 mins' },
                { id: 'ev-2', title: 'Gold Carry Arbitrage Strategic Syncs', date: 'TOMORROW // 11:30 EST', count: '22 hrs' }
              ].map((ev) => (
                <div key={ev.id} className="p-3 bg-black/50 border border-zinc-900 rounded-2xl space-y-2">
                  <div>
                    <h5 className="font-bold text-white uppercase text-[10px] leading-tight tracking-wide">{ev.title}</h5>
                    <span className="text-zinc-550 text-[9px] block mt-1">🗓️ {ev.date}</span>
                  </div>
                  
                  <div className="flex justify-between items-center border-t border-zinc-950/80 pt-2 text-[9px] font-bold">
                    <span className="text-amber-500 font-extrabold flex items-center gap-1">
                      <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping" />
                      Starts in: {ev.count}
                    </span>
                    <button 
                      onClick={() => addTelemetryLog(`Webinar registration secured for [${ev.title}]`)}
                      className="bg-purple-950/50 hover:bg-purple-650 border border-purple-500/30 text-purple-400 hover:text-white px-2 py-0.5 rounded transition-all cursor-pointer uppercase text-[8px]"
                    >
                      Register
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* D. ACTIVITY LOGS TELEMETRY */}
          <div className="bg-[#030308] border border-zinc-900 rounded-3xl p-5 space-y-3 text-left shadow-lg relative overflow-hidden">
            <div className="border-b border-zinc-900 pb-2 flex justify-between items-center">
              <h4 className="text-xs font-cinzel font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity className="text-orange-500 w-4 h-4 animate-spin-slow shrink-0" />
                AOS TELEMETRY LOGS
              </h4>
              <span className="text-[9px] font-mono text-zinc-550 font-black uppercase">LIVE BUS</span>
            </div>

            {/* Scrollable console view reflecting state logs */}
            <div className="space-y-2 max-h-48 overflow-y-auto font-mono text-[9px] pr-1">
              {systemLogs.map((log) => (
                <div key={log.id} className="border-b border-zinc-950 pb-1.5 leading-relaxed">
                  <div className="flex justify-between text-[8px] text-zinc-650">
                    <span>{log.time}</span>
                    <span className={log.level === 'warn' ? 'text-red-500' : log.level === 'success' ? 'text-emerald-450' : 'text-zinc-500'}>
                      [{log.level.toUpperCase()}]
                    </span>
                  </div>
                  <p className="text-zinc-350 pr-1 mt-0.5 font-semibold text-[9px]">{log.msg}</p>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* 🚀 ACCEPTANCE & CONSENT GATEWAY MODAL */}
      {showConsentModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
          <div className="bg-[#0a0406] border-2 border-red-500 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 relative overflow-hidden shadow-[0_0_40px_rgba(239,68,68,0.3)] text-left">
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-red-500 animate-pulse" />
            
            <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
              <div className="bg-red-500/10 p-2.5 rounded-2xl border border-red-500/30">
                <AlertOctagon className="text-red-500 w-8 h-8 animate-bounce" />
              </div>
              <div>
                <h3 className="text-lg sm:text-xl font-cinzel font-black text-white uppercase tracking-widest">
                  BIOMETRIC STREAM CONSENT
                </h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider mt-0.5">
                  Institutional Security Compliance Protocol
                </p>
              </div>
            </div>

            <div className="space-y-4 text-xs font-mono text-zinc-300 leading-relaxed text-left">
              <p>
                Before activating your user camera and microphone telemetry feeds, standard institutional guidelines require explicit compliance acknowledgment:
              </p>
              
              <div className="bg-black/80 border border-zinc-850 p-4.5 rounded-2xl space-y-3 font-mono text-[10px] text-zinc-400">
                <div className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">[1]</span>
                  <span>Visual and audio captures are processed in real-time, matching local terminal encryption parameters.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">[2]</span>
                  <span>You agree that no third-party copyrighted materials, prohibited brokerage solicitations, or security recommendations will be broadcast.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="text-red-500 font-bold shrink-0">[3]</span>
                  <span>Your local recordings are compiled in clean memory arrays and can be audited or downloaded safely to your filesystem at any time.</span>
                </div>
              </div>

              <p className="text-[10px] text-zinc-550 italic">
                By clicking "PROCEED & AUTHORIZE FEEDS", you accept these terms and grant the application browser frame permission to instantiate your webcam and microphone streams.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-3">
              <button
                onClick={handleAcceptConsent}
                className="flex-1 bg-red-650 hover:bg-red-550 text-white font-cinzel font-black uppercase py-3 rounded-2xl text-xs tracking-wider transition-all shadow-[0_0_15px_rgba(239,68,68,0.3)] hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] cursor-pointer text-center"
              >
                PROCEED & AUTHORIZE FEEDS
              </button>
              <button
                onClick={() => {
                  setShowConsentModal(false);
                  addTelemetryLog("Biometric stream access declined by administrator.", "warn");
                }}
                className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 text-zinc-400 font-cinzel font-black uppercase py-3 px-6 rounded-2xl text-xs tracking-wider transition-all cursor-pointer text-center"
              >
                DECLINE
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
