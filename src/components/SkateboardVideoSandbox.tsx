import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  TrendingUp, 
  Radio, 
  PlaySquare, 
  Bookmark, 
  Tv, 
  BookOpen, 
  Award, 
  Users, 
  Search, 
  Bell, 
  ChevronDown, 
  Share2, 
  Heart, 
  MessageSquare,
  Check,
  X,
  Home
} from 'lucide-react';

interface SkateboardVideoSandboxProps {
  onClose: () => void;
}

interface VideoItem {
  id: number;
  time: string;
  source: string;
  by: string;
  isOffline?: boolean;
  name: string;
  views: string;
  date: string;
  authorImg: string;
  coverImg: string;
}

export const SkateboardVideoSandbox: React.FC<SkateboardVideoSandboxProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'Discover' | 'Trending' | 'Streaming' | 'Playlist' | 'Bookmark' | 'LiveStream' | 'Tutorial' | 'Competition' | 'Community'>('Discover');
  const [showMainContainer, setShowMainContainer] = useState(false); // false = Discover page, true = Active Video/Trending page
  
  // Search query
  const [searchQuery, setSearchQuery] = useState('');

  // Video states
  const [activeVideo, setActiveVideo] = useState({
    title: 'Basic how to ride your Skateboard comfortly',
    source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    by: 'Andy William',
    avatar: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
    isLiked: false,
    subscribers: '1,980,893 subscribers',
    description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellendus illum tempora consequuntur. Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis earum velit accusantium maiores qui sit quas, laborum voluptatibus vero quidem tempore facilis voluptate tempora deserunt!'
  });

  // Chat Feed states
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    { id: 1, name: 'Wijaya Adabi', avatar: 'https://images.unsplash.com/photo-1560941001-d4b52ad00ecc?auto=format&fit=crop&w=150&q=80', content: 'Lorem ipsum clor sit, ame conse quae debitis', date: 'Just now' },
    { id: 2, name: 'Johny Wise', avatar: 'https://images.pexels.com/photos/2889942/pexels-photo-2889942.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=150', content: 'Suscipit eos atque voluptates labore', isOffline: true },
    { id: 3, name: 'Budi Hakim', avatar: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?auto=format&fit=crop&w=150&q=80', content: 'Dicta quidem sunt adipisci', isOffline: true },
    { id: 4, name: 'Thomas Hope', avatar: 'https://images.pexels.com/photos/1870163/pexels-photo-1870163.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=150', content: 'recusandae doloremque aperiam alias molestias' },
    { id: 5, name: 'Gerard Will', avatar: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=150', content: 'Dicta quidem sunt adipisci' }
  ]);

  // Video items list
  const videoItems: VideoItem[] = [
    {
      id: 1,
      time: '8 min',
      source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      by: 'Andy William',
      name: 'HI IM GONNA STRECH YOU OUT CAUSE IM TOXIC',
      views: '54K views',
      date: '1 week ago',
      authorImg: 'https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
      coverImg: 'https://i.postimg.cc/43KH5fDs/f4f55f9a-9f90-4ed0-9bb8-26ccc0ed50ce.png'
    },
    {
      id: 2,
      time: '5 min',
      source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      by: 'Gerard Bind',
      isOffline: true,
      name: 'LEARN REVERSALS',
      views: '42K views',
      date: '1 week ago',
      authorImg: 'https://images.pexels.com/photos/3370021/pexels-photo-3370021.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
      coverImg: 'https://i.postimg.cc/DyHTG7Pj/d9c32ce2-713f-4cd0-a0a2-61cb46a30e50.png'
    },
    {
      id: 3,
      time: '7 min',
      source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      by: 'John Wise',
      isOffline: true,
      name: 'HOW TO DO MOLLY',
      views: '64K views',
      date: '2 week ago',
      authorImg: 'https://images.pexels.com/photos/1870163/pexels-photo-1870163.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
      coverImg: 'https://i.postimg.cc/852Y5CSk/Chat-GPT-Image-Jun-7-2026-12-22-00-PM.png'
    },
    {
      id: 4,
      time: '6 min',
      source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      by: 'Budi Hakim',
      name: 'GETTING BOARED OUT BY BRYAN',
      views: '50K views',
      date: '1 week ago',
      authorImg: 'https://images.pexels.com/photos/2889942/pexels-photo-2889942.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500',
      coverImg: 'https://i.postimg.cc/Y2X4JmtS/Gemini-Generated-Image-bx0dgxbx0dgxbx0d.jpg'
    }
  ];

  // Ref array to control video previews on hover
  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  const handleVideoHoverEnter = (id: number) => {
    const video = videoRefs.current[id];
    if (video) {
      video.play().catch(() => {});
    }
  };

  const handleVideoHoverLeave = (id: number) => {
    const video = videoRefs.current[id];
    if (video) {
      video.pause();
    }
  };

  const handleSelectVideo = (video: VideoItem) => {
    setActiveVideo({
      title: video.name,
      source: video.source,
      by: video.by,
      avatar: video.authorImg,
      isLiked: false,
      subscribers: '1,980,893 subscribers',
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Repellendus illum tempora consequuntur. Lorem ipsum dolor sit amet consectetur adipisicing elit. Debitis earum velit accusantium maiores qui sit quas, laborum voluptatibus vero quidem tempore facilis voluptate tempora deserunt!'
    });
    setShowMainContainer(true); // Jump directly to active streaming workspace
    setActiveTab('Trending');   // Switch menu active state as in the original JS selection
  };

  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    
    setChatMessages(prev => [
      ...prev,
      {
        id: Date.now(),
        name: 'Thomas', // Logged in user in header
        avatar: 'https://images.unsplash.com/photo-1587918842454-870dbd18261a?auto=format&fit=crop&w=150&q=80',
        content: chatInput,
        date: 'Just now'
      }
    ]);
    setChatInput('');
  };

  return (
    <div className="fixed inset-0 z-[150] flex select-none font-sans bg-[#1f1d2b] overflow-hidden">
      {/* Background Poster Cover Accent */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none opacity-10 bg-cover bg-center"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?auto=format&fit=crop&w=1950&q=80')` }}
      />
      
      {/* Exit Button absolute overlay */}
      <button 
        onClick={onClose}
        type="button"
        className="absolute top-4 right-4 z-[160] px-4 py-2 bg-black/80 hover:bg-red-500 border border-white/10 hover:border-red-500 text-zinc-300 hover:text-white rounded-full text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer shadow-2xl flex items-center gap-1.5"
      >
        <span>✕ Close sandbox</span>
      </button>

      {/* Main Container mimicking Dwinawan exploration */}
      <div className="relative z-10 w-full h-full bg-[#1f1d2b] flex overflow-hidden text-[#808191]">
        
        {/* SIDEBAR NAVIGATION PANEL */}
        <aside className="w-20 md:w-56 h-full p-4 md:p-6 border-r border-[#808191]/10 flex flex-col flex-shrink-0 bg-[#1f1d2b] overflow-y-auto custom-scrollbar transition-all duration-300">
          
          {/* Logo Brand Title */}
          <div className="flex items-start gap-2.5 mb-8">
            <span className="w-8 h-8 rounded-full bg-[#22b07d] text-white flex items-center justify-center font-extrabold tracking-tight shadow-md shrink-0">C</span>
            <div className="hidden md:flex flex-col text-left leading-none gap-0.5">
              <span className="text-white text-[11px] font-black tracking-wider uppercase">clear path</span>
              <span className="text-[#22b07d] text-[10px] font-black tracking-wider uppercase">Market science</span>
              <span className="text-zinc-400 text-[9px] font-bold tracking-wider uppercase font-mono">Video</span>
              <span className="text-zinc-500 text-[8px] font-bold tracking-widest uppercase font-mono">EDU.</span>
            </div>
          </div>

          {/* SIDEBAR MENU */}
          <div className="flex flex-col gap-6">
            <div>
              <div className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-[#808191]/65 mb-4 px-3">MENU</div>
              <div className="flex flex-col gap-2">
                {[
                  { name: 'Discover', icon: Compass, tab: 'Discover' as const },
                  { name: 'Trending', icon: TrendingUp, tab: 'Trending' as const },
                  { name: 'Streaming', icon: Radio, tab: 'Streaming' as const },
                  { name: 'Playlist', icon: PlaySquare, tab: 'Playlist' as const },
                  { name: 'Bookmark', icon: Bookmark, tab: 'Bookmark' as const }
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.tab);
                      if (item.tab === 'Discover') setShowMainContainer(false);
                      else setShowMainContainer(true);
                    }}
                    className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-xs tracking-wide text-left ${
                      activeTab === item.tab 
                        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-white border-l-2 border-[#22b07d]' 
                        : 'hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.tab ? 'text-[#22b07d]' : 'text-zinc-500'}`} />
                    <span className="hidden md:inline">{item.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* CATEGORIES MENU SECTION */}
            <div>
              <div className="hidden md:block text-[10px] font-bold uppercase tracking-wider text-[#808191]/65 mb-4 px-3">CATEGORY</div>
              <div className="flex flex-col gap-2">
                {[
                  { name: 'Live Stream', icon: Tv, tab: 'LiveStream' as const },
                  { name: 'Tutorial', icon: BookOpen, tab: 'Tutorial' as const },
                  { name: 'Competition', icon: Award, tab: 'Competition' as const },
                  { name: 'Community', icon: Users, tab: 'Community' as const }
                ].map((item) => (
                  <button
                    key={item.name}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.tab);
                      setShowMainContainer(true);
                    }}
                    className={`flex items-center gap-4 px-3 py-2.5 rounded-xl transition-all cursor-pointer font-bold text-xs tracking-wide text-left ${
                      activeTab === item.tab 
                        ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/5 text-white border-l-2 border-[#22b07d]' 
                        : 'hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 shrink-0 ${activeTab === item.tab ? 'text-[#22b07d]' : 'text-zinc-500'}`} />
                    <span className="hidden md:inline">{item.name}</span>
                  </button>
                ))}

                {/* Return home to original front terminal */}
                <button
                  type="button"
                  onClick={onClose}
                  className="flex items-center gap-4 px-3 py-2.5 mt-2 rounded-xl transition-all cursor-pointer font-extrabold text-xs text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/15 text-left"
                >
                  <Home className="w-4 h-4 shrink-0 text-rose-400" />
                  <span className="hidden md:inline uppercase tracking-widest text-[9.5px]">Homepage</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* CONTENT & SEARCH CONTROL AREA */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#1f1d2b]">
          
          {/* HEADER TOP BAR BAR */}
          <header className="flex items-center justify-between p-4 md:p-6 border-b border-[#808191]/10 flex-shrink-0">
            {/* Search filter input */}
            <div className="relative w-full max-w-sm">
              <input
                type="text"
                placeholder="Search Skateboard Videos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#353340] border-0 text-white rounded-xl py-2 pl-4 pr-10 text-xs font-semibold placeholder-[#808191]/60 focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
              />
              <Search className="absolute right-3.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
            </div>

            {/* Profile configuration parameters */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <img 
                  className="w-7 h-7 rounded-full object-cover border border-white/10 shrink-0" 
                  src="https://images.unsplash.com/photo-1587918842454-870dbd18261a?auto=format&fit=crop&w=150&q=80" 
                  alt="Thomas Portrait" 
                />
                <span className="hidden sm:inline text-white font-bold text-xs">Thomas</span>
                <ChevronDown className="hidden sm:block w-3.5 h-3.5 text-zinc-500" />
              </div>

              {/* Notification icon */}
              <div className="relative cursor-pointer hover:text-white transition-colors">
                <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-red-500 border border-[#1f1d2b]" />
                <Bell className="w-4 h-4" />
              </div>
            </div>
          </header>

          {/* DYNAMIC CANVAS AREA */}
          <div className="flex-grow overflow-y-auto p-4 md:p-6 custom-scrollbar">
            
            {/* VIEWPORT 1: PORTAL DISCOVER FEED (when showMainContainer is false) */}
            {!showMainContainer && (
              <div className="flex flex-col gap-6">
                <div className="text-white text-2xl font-black uppercase tracking-wide">Discover</div>

                {/* TWO-COLUMN FEATURE BLOG/HERO CARDS */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                  <div 
                    onClick={() => setShowMainContainer(true)}
                    className="lg:col-span-8 p-6 bg-[#31abbd] rounded-2xl flex flex-col justify-between min-h-[220px] bg-no-repeat bg-right-bottom relative overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                    style={{ 
                      backgroundImage: `url('https://assets.codepen.io/3364143/skate-removebg-preview.png')`,
                      backgroundSize: '40%' 
                    }}
                  >
                    <div className="max-w-[65%] flex flex-col gap-3">
                      <h2 className="text-white text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">
                        How to do Basic Jumping and how to landing safely
                      </h2>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="relative">
                          <img className="w-10 h-10 rounded-full border border-white/50 object-cover shrink-0" src="https://images.unsplash.com/photo-1560941001-d4b52ad00ecc?auto=format&fit=crop&w=150&q=80" />
                          <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#1da1f2] flex items-center justify-center border border-[#31abbd]">
                            <Check className="w-1.5 h-1.5 text-white stroke-[4]" />
                          </span>
                        </div>
                        <div className="text-left text-white leading-tight">
                          <div className="text-xs font-bold leading-normal">Thomas Hope</div>
                          <div className="text-[10px] text-zinc-100 font-semibold mt-0.5">53K views • 2 weeks ago</div>
                        </div>
                      </div>
                    </div>
                    <span className="absolute right-4 bottom-4 px-2 py-1 bg-black/45 text-white/90 text-[10px] font-mono rounded">
                      7 min
                    </span>
                  </div>

                  <div 
                    onClick={() => {
                      setActiveVideo({
                        title: 'Skateboard Tips You need to know',
                        source: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
                        by: 'Tony Andrew',
                        avatar: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?auto=format&fit=crop&w=150&q=80',
                        isLiked: false,
                        subscribers: '840K subscribers',
                        description: 'Ultimate tutorial listing professional skateboarding tips, optimal dynamic posture control and balancing techniques during intermediate jumps.'
                      });
                      setShowMainContainer(true);
                      setActiveTab('Trending');
                    }}
                    className="lg:col-span-4 p-6 bg-cover bg-center rounded-2xl flex flex-col justify-between relative overflow-hidden group cursor-pointer saturate-[1.3] transition-all duration-300 hover:scale-[1.01]"
                    style={{ backgroundImage: `url('https://c0.anyrgb.com/images/1020/945/venice-beach-2018-outdoors-sport-men-jumping-desert-sunset-extreme-sports-one-person-action.jpg')` }}
                  >
                    <div className="absolute inset-0 bg-[#121527bf] z-0 group-hover:bg-[#121527a0] transition-colors" />
                    
                    <div className="relative z-10 text-left">
                      <h2 className="text-white text-lg font-bold tracking-tight">
                        Skateboard Tips You need to know
                      </h2>
                    </div>

                    <div className="relative z-10 flex items-center gap-3 text-left">
                      <div className="relative">
                        <img className="w-10 h-10 rounded-full border border-white/50 object-cover shrink-0" src="https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?auto=format&fit=crop&w=150&q=80" />
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#1da1f2] flex items-center justify-center border border-black">
                          <Check className="w-1.5 h-1.5 text-white stroke-[4]" />
                        </span>
                      </div>
                      <div className="text-white leading-tight">
                        <div className="text-xs font-bold leading-normal">Tony Andrew</div>
                        <div className="text-[10px] text-zinc-300 font-semibold mt-0.5">53K views • 2 weeks ago</div>
                      </div>
                    </div>
                    
                    <span className="absolute right-4 top-4 z-10 px-2 py-1 bg-black/45 text-white/90 text-[10px] font-mono rounded">
                      7 min
                    </span>
                  </div>
                </div>

                {/* MOST WATCHED CAROUSEL GRID */}
                <div>
                  <div className="text-white text-lg font-bold mb-4 mt-6 text-left">Most Watched</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {videoItems
                      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()) || item.by.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelectVideo(item)}
                          onMouseEnter={() => handleVideoHoverEnter(item.id)}
                          onMouseLeave={() => handleVideoHoverLeave(item.id)}
                          className="bg-[#252936] rounded-2xl overflow-hidden group cursor-pointer transition-all duration-400 hover:-translate-y-1 relative"
                        >
                          <div className="relative aspect-video overflow-hidden">
                            <span className="absolute top-2 right-2 bg-black/50 text-white/85 px-2 py-0.5 text-[10px] font-mono rounded z-10 group-hover:hidden">
                              {item.time}
                            </span>
                            <video
                              ref={el => { videoRefs.current[item.id] = el; }}
                              muted
                              loop
                              poster={item.coverImg}
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-130"
                              src={item.source}
                            />
                            
                            {/* Author avatar on bottom-right overlay hover */}
                            <div className="absolute right-3.5 -bottom-5 z-20 group-hover:bottom-2 rounded-full border border-[#252936] transition-all duration-300 scale-100 group-hover:scale-90 shrink-0">
                              <img className="w-8 h-8 rounded-full object-cover" src={item.authorImg} alt="" />
                            </div>
                          </div>

                          <div className="p-4 text-left">
                            <div className={`text-[11px] font-semibold flex items-center gap-1.5 ${item.isOffline ? 'text-orange-400' : 'text-emerald-400'}`}>
                              <span>{item.by}</span>
                              <span className={`w-1.5 h-1.5 rounded-full ${item.isOffline ? 'bg-orange-400' : 'bg-emerald-400'}`} />
                            </div>
                            <h4 className="text-white text-xs font-bold leading-snug mt-1.5 h-8 line-clamp-2">
                              {item.name}
                            </h4>
                            <div className="text-[10px] text-zinc-500 font-semibold mt-2">
                              {item.views} • {item.date}
                            </div>
                          </div>
                        </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* VIEWPORT 2: STREAMING ACTIVE WORKSPACE (when showMainContainer is true) */}
            {showMainContainer && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                
                {/* ACTIVE VIDEO WRAPPER STREAM & PARAGRAPH TEXT */}
                <div className="lg:col-span-8 flex flex-col gap-5">
                  <div className="rounded-2xl overflow-hidden bg-black aspect-video relative border border-white/5 shadow-2xl">
                    <video
                      key={activeVideo.source}
                      src={activeVideo.source}
                      controls
                      autoPlay
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="flex items-start justify-between gap-4 mt-2">
                    <div className="flex items-center gap-3 text-left">
                      <div className="relative">
                        <img 
                          className="w-12 h-12 rounded-full border border-white/10 object-cover shrink-0" 
                          src={activeVideo.avatar || "https://images.pexels.com/photos/1680172/pexels-photo-1680172.jpeg?auto=compress&cs=tinysrgb&dpr=2&w=500"} 
                          alt="" 
                        />
                        <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#1da1f2] flex items-center justify-center border border-[#1f1d2b]">
                          <Check className="w-2 h-2 text-white stroke-[4]" />
                        </span>
                      </div>
                      <div>
                        <div className="text-white text-sm font-bold flex items-center gap-1.5">
                          <span>{activeVideo.by}</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        </div>
                        <div className="text-[#808191] text-[10.5px] font-semibold mt-0.5">{activeVideo.subscribers}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        type="button"
                        className="px-4 py-2 bg-[#353340] hover:bg-[#353340]/80 text-white rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 border border-white/5"
                      >
                        <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                        <span>Share</span>
                      </button>

                      <button 
                        type="button"
                        onClick={() => setActiveVideo(v => ({ ...v, isLiked: !v.isLiked }))}
                        className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all cursor-pointer flex items-center gap-1.5 border border-white/5 ${
                          activeVideo.isLiked 
                            ? 'bg-[#ea5f5f] text-white hover:bg-[#ea5f5f]/90' 
                            : 'bg-[#353340] hover:bg-[#353340]/80 text-white'
                        }`}
                      >
                        <Heart className={`w-3.5 h-3.5 ${activeVideo.isLiked ? 'fill-white text-white' : 'text-zinc-400'}`} />
                        <span>Liked</span>
                      </button>
                    </div>
                  </div>

                  {/* Descriptions block */}
                  <div className="text-left py-2 border-t border-[#808191]/10 mt-2">
                    <h1 className="text-white text-xl font-bold tracking-tight mb-2 uppercase">{activeVideo.title}</h1>
                    <p className="text-zinc-405 text-xs sm:text-[13px] leading-relaxed font-semibold mb-4">
                      {activeVideo.description}
                    </p>
                    <p className="text-zinc-500 text-xs leading-relaxed font-medium">
                      Lorem ipsum dolor sit amet consectetur adipisicing elit. Temporibus laborum qui dolorum fugiat eius accusantium repellendus illum tempora consequuntur. Lorem ipsum dolor, sit amet consectetur adipisicing elit.
                    </p>
                  </div>
                </div>

                {/* SIDE COLUMN: LIVE CHAT STREAM & MORE RELATED VIDEOS */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* LIVE CHAT BOX */}
                  <div className="bg-[#252836] border border-white/5 rounded-2xl flex flex-col h-[380px] overflow-hidden shadow-lg relative text-left">
                    <div className="p-3.5 border-b border-[#808191]/10 flex items-center justify-between font-bold text-xs">
                      <span className="text-white flex items-center gap-1.5 uppercase font-extrabold font-sans">
                        <MessageSquare className="w-4 h-4 text-emerald-400" />
                        <span>Live Chat</span>
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-[#ea5f5f] rounded-full animate-ping" />
                        <span>15,988 watching</span>
                      </span>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3.5 scrollbar-thin">
                      {chatMessages.map((msg) => (
                        <div key={msg.id} className="flex gap-2.5 items-start text-xs leading-relaxed">
                          <div className="relative shrink-0 mt-0.5">
                            <img className="w-8 h-8 rounded-full border border-white/5 object-cover" src={msg.avatar} alt="" />
                            {msg.isOffline && (
                              <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#ff7551] border border-[#252836]" />
                            )}
                          </div>
                          <div>
                            <div className="text-white font-bold text-[11px] flex items-center gap-1.5 justify-start">
                              <span>{msg.name}</span>
                              <span className="text-[8px] text-zinc-650 font-mono">12:35</span>
                            </div>
                            <div className="text-[#808191] text-[11px] mt-0.5 max-w-[22ch]">{msg.content}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Submit message chat interface footer */}
                    <form onSubmit={handleSendChatMessage} className="p-2 border-t border-[#808191]/10 bg-[#252836] flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Write your message..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="w-full bg-[#2d303e] border-0 text-white rounded-full py-2 px-4 text-[11.5px] placeholder-[#808191]/65 focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="w-7 h-7 bg-[#6c5ecf] hover:bg-[#5847d0] transition-colors rounded-full flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <span className="text-white text-xs">➔</span>
                      </button>
                    </form>
                  </div>

                  {/* RELATED VIDEOS GRID */}
                  <div>
                    <div className="text-white text-sm font-black uppercase text-left mb-3.5 tracking-wide">Related Videos</div>
                    <div className="flex flex-col gap-3">
                      {videoItems
                        .filter(v => v.name !== activeVideo.title)
                        .slice(0, 2)
                        .map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSelectVideo(item)}
                            className="bg-[#252936] p-2 border border-white/5 rounded-xl cursor-pointer hover:border-emerald-500/20 transition-all flex gap-3 text-left items-start"
                          >
                            <img 
                              className="w-20 h-16 rounded-lg object-cover bg-black shrink-0 hover:scale-102 transition-transform" 
                              src={item.coverImg} // Using custom coverImg thumbnail
                              alt="" 
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className="text-white text-[11.5px] font-bold leading-snug line-clamp-2">{item.name}</h4>
                              <div className="text-[10px] text-[#808191] font-semibold mt-1">{item.by}</div>
                              <div className="text-[9.5px] text-zinc-550 font-semibold mt-0.5">{item.views} • 2 days ago</div>
                            </div>
                          </div>
                      ))}
                    </div>

                    <button 
                      type="button"
                      onClick={() => setShowMainContainer(false)}
                      className="mt-3.5 w-full bg-[#6c5ecf] hover:bg-[#5847d0] transition-colors rounded-xl py-2.5 text-[10.5px] font-black uppercase text-white tracking-widest cursor-pointer text-center"
                    >
                      See All related videos (32)
                    </button>
                  </div>

                </div>
              </div>
            )}

          </div>
        </main>

      </div>
    </div>
  );
};
