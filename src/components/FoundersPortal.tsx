import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ReidsGamesWidget from './ReidsGamesWidget';
import { SkateboardVideoSandbox } from './SkateboardVideoSandbox';
import { 
  Sparkles, 
  Cpu, 
  Award, 
  Mail, 
  BookOpen, 
  ArrowUpDown, 
  ChevronLeft, 
  ChevronRight, 
  EyeOff, 
  Eye, 
  Send,
  Sun, 
  Moon, 
  Plus,
  RefreshCw,
  Share2,
  Trash2,
  Bookmark,
  Lock,
  Unlock,
  ShieldAlert,
  Key
} from 'lucide-react';

interface Article {
  id: string;
  category: 'design' | 'css' | 'ai' | 'technology' | 'culture';
  date: string;
  image: string;
  title: string;
  text: string;
  fullText?: string;
  readTime: string;
  isPopular?: boolean;
}

const INITIAL_ARTICLES: Article[] = [
  {
    id: 'a1',
    category: 'design',
    date: '2026-05-11',
    image: 'https://images.unsplash.com/photo-1520045892732-304bc3ac5d8e?q=80&w=1200&auto=format&fit=crop',
    title: 'Video Education',
    text: 'Modern interactive media platforms are increasingly borrowing design systems from unblocked retro archives. Our high-fidelity skateboard platform features fluid layouts, smooth hovered video play, and custom live-chat simulation logs.',
    fullText: 'The Video Education Platform represents the ultimate intersection of digital storytelling and skate culture. Featuring hover-active media timelines, custom live chat logs, and responsive dashboard grid alignments, this premium media workspace lets clients experience skate cinematography natively on the web.',
    readTime: '6 min read',
    isPopular: true
  },
  {
    id: 'a2',
    category: 'css',
    date: '2026-05-10',
    image: 'https://images.unsplash.com/photo-1496171367470-9ed9a91ea931?q=80&w=1200&auto=format&fit=crop',
    title: 'Advanced CSS Grid techniques for editorial systems',
    text: 'Developers are using nested grids, subgrid layouts, and dynamic spacing systems to build premium publishing platforms without monolithic frameworks. By coordinating grid alignments, adjacent columns seamlessly lock to structural layouts, ensuring perfect text align on any mobile browser viewport.',
    fullText: 'Developers are using nested grids, subgrid layouts, and dynamic spacing systems to build premium publishing platforms without monolithic frameworks.\n\nSubgrid allows nested grid items to inherit the track configuration of the parent container, solving a decade-old problem of column height mismatches. Additionally, combining CSS variable grids with CSS clamp functions allows columns, font margins, and decorative borders on secondary columns to self-adjust dynamically, eliminating the need for hundreds of bloated media query rules.',
    readTime: '7 min read',
    isPopular: false
  },
  {
    id: 'a3',
    category: 'ai',
    date: '2026-05-09',
    image: 'https://i.postimg.cc/fTvj9SWY/1c98314d-6e6c-4e5a-9976-014deba7a909.png',
    title: 'API Monitoring Station',
    text: 'Rick is currently working on direct secure link visualizers and custom publishing frameworks.',
    fullText: 'Check the secure project asset in detail at: https://postimg.cc/MvvQkTQG',
    readTime: '1 min read',
    isPopular: true
  },
  {
    id: 'a4',
    category: 'design',
    date: '2026-05-08',
    image: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1200&auto=format&fit=crop',
    title: 'Why whitespace creates premium user experiences',
    text: 'Spacious layouts improve readability, create elegant visual rhythm, and help readers focus on deep storytelling without overwhelming interfaces or cluttering headers. Clutter acts as friction; premium designs prioritize deliberate breathing room.',
    fullText: 'Spacious layouts improve readability, create elegant visual rhythm, and help readers focus on deep storytelling without overwhelming interfaces or cluttering headers. Clutter acts as friction; premium designs prioritize deliberate breathing room.\n\nIn typography, positive and negative tracking balanced with spacious line heights determine cognitive speed. When content is bounded by ample margins and empty borders, the brain immediately allocates priority attention resources to the isolated assets, creating deep emotional interest and clear visual hierarchy.',
    readTime: '4 min read',
    isPopular: false
  },
  {
    id: 'a5',
    category: 'css',
    date: '2026-05-07',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?q=80&w=1200&auto=format&fit=crop',
    title: 'Building immersive interfaces using modern CSS',
    text: 'Features like container queries, clamp(), and scroll animations are helping developers build more responsive, fluid, and exciting editorial experiences that react intelligently to any embedding context.',
    fullText: 'Features like container queries, clamp(), and scroll animations are helping developers build more responsive, fluid, and exciting editorial experiences that react intelligently to any embedding context.\n\nContainer queries redefine modular components. Instead of monitoring the global browser width, components watch their immediate parent wrappers. This allows a sidebar-nested article preview card to self-optimize to tiny rows, whilst the exact same component automatically updates to wide feature banner layouts when placed in a massive main grid node.',
    readTime: '8 min read',
    isPopular: false
  },
  {
    id: 'a6',
    category: 'ai',
    date: '2026-05-06',
    image: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?q=80&w=1200&auto=format&fit=crop',
    title: 'Generative AI is reshaping visual storytelling',
    text: 'Creative agencies are experimenting with AI-generated visuals and adaptive editorial systems, producing futuristic publishing experiences that change their entire layout theme based on the user\'s reader preferences.',
    fullText: 'Creative agencies are experimenting with AI-generated visuals and adaptive editorial systems, producing futuristic publishing experiences that change their entire layout theme based on the user\'s reader preferences.\n\nBy leveraging advanced image diffusion models and large language capabilities, publishing systems have transitioned from passive static HTML files to active storytelling agents. Readers can ask to expand specialized paragraphs to teach complex definitions, translated immediately to simplified or technical structures matching their individual expertise constraints.',
    readTime: '6 min read',
    isPopular: true
  },
  {
    id: 'a7',
    category: 'design',
    date: '2026-05-05',
    image: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?q=80&w=1200&auto=format&fit=crop',
    title: 'Swipe card interactions are becoming mainstream',
    text: 'Swipeable layouts are no longer exclusive to native mobile apps; they are now appearing widely across premium desktop editorial platforms, trading research terminals, and financial metric dashboards.',
    fullText: 'Swipeable layouts are no longer exclusive to native mobile apps; they are now appearing widely across premium desktop editorial platforms, trading research terminals, and financial metric dashboards.\n\nProviding tactile desktop swipes utilizing CSS scroll snap points is extremely simple yet profoundly enhances the responsive experience. When combined with custom touch event handlers and velocity metrics, card swipes feel fluid and premium, completely eliminating standard choppy slide changes.',
    readTime: '5 min read',
    isPopular: false
  },
  {
    id: 'a8',
    category: 'css',
    date: '2026-05-04',
    image: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=1200&auto=format&fit=crop',
    title: 'Responsive typography is the future of readability',
    text: 'Fluid font systems powered by clamp() help maintain visual harmony across large monitors, high-definition displays, tablets, and compact mobile phone device dimensions without breaking line wraps.',
    fullText: 'Fluid font systems powered by clamp() help maintain visual harmony across large monitors, high-definition displays, tablets, and compact mobile phone device dimensions without breaking line wraps.\n\nInstead of jumping abruptly through distinct pixel sizes upon triggering arbitrary media breakpoints, fluid typography scales continuously on a linear slope between a defined minimum and maximum size parameter. For instance, clamp(2rem, 5vw, 4.5rem) keeps the viewport margins balanced and typography perfectly sized for maximum executive reading ease.',
    readTime: '7 min read',
    isPopular: false
  }
];

export default function FoundersPortal() {
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    // Check local storage or default to elegant cream background to match pen
    return localStorage.getItem('founders_dark') === 'true';
  });

  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    return localStorage.getItem('founders_unlocked') === 'true';
  });
  const [pinInput, setPinInput] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);

  const handlePinSubmit = (val?: string) => {
    const codeToVerify = val !== undefined ? val : pinInput;
    if (codeToVerify === '142879') {
      setIsUnlocked(true);
      localStorage.setItem('founders_unlocked', 'true');
      setPinError(false);
    } else {
      setPinError(true);
      setPinInput('');
      if (typeof window !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(200);
      }
    }
  };

  const handleKeyPress = (num: string) => {
    setPinError(false);
    setPinInput(prev => {
      const nextPin = prev.length < 6 ? prev + num : prev;
      if (nextPin.length === 6) {
        setTimeout(() => {
          handlePinSubmit(nextPin);
        }, 150);
      }
      return nextPin;
    });
  };

  const handleBackspace = () => {
    setPinInput(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPinInput('');
    setPinError(false);
  };

  useEffect(() => {
    if (isUnlocked) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      } else if (e.key === 'Enter') {
        if (pinInput.length === 6) {
          handlePinSubmit();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pinInput, isUnlocked]);

  const [articles, setArticles] = useState<Article[]>(INITIAL_ARTICLES);
  const [expandedArticles, setExpandedArticles] = useState<Set<string>>(new Set());
  const [hiddenArticles, setHiddenArticles] = useState<Set<string>>(new Set());
  const [bookmarkedArticles, setBookmarkedArticles] = useState<Set<string>>(new Set());
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  
  // Carousel swipe state
  const [carouselIndex, setCarouselIndex] = useState<number>(0);
  const carouselTrackRef = useRef<HTMLDivElement>(null);
  const [startX, setStartX] = useState<number>(0);
  const [currentX, setCurrentX] = useState<number>(0);

  // New Article Form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'design' | 'css' | 'ai' | 'technology' | 'culture'>('design');
  const [newImage, setNewImage] = useState('');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newFullText, setNewFullText] = useState('');
  const [newReadTime, setNewReadTime] = useState('5 min read');

  // Newsletter subscription
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [subscriptionSuccess, setSubscriptionSuccess] = useState(false);
  const [showGamesModal, setShowGamesModal] = useState(false);
  const [showSkateSandbox, setShowSkateSandbox] = useState(false);
  const [importedMaterial, setImportedMaterial] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('founders_dark', String(isDarkMode));
  }, [isDarkMode]);

  // Handle CSS Font Injections Dynamically inside DOM Head
  useEffect(() => {
    const fontId = 'google-fonts-cormorant';
    let docLink = document.getElementById(fontId);
    if (!docLink) {
      docLink = document.createElement('link');
      docLink.id = fontId;
      docLink.setAttribute('rel', 'stylesheet');
      docLink.setAttribute('href', 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');
      document.head.appendChild(docLink);
    }
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleExpand = (id: string) => {
    setExpandedArticles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleHide = (id: string) => {
    setHiddenArticles(prev => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedArticles(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newExcerpt.trim()) return;

    const defaultImg = newImage.trim() || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop';
    const cleanDate = new Date().toISOString().split('T')[0];

    const newlyCreated: Article = {
      id: `custom_${Date.now()}`,
      category: newCategory,
      date: cleanDate,
      image: defaultImg,
      title: newTitle.trim(),
      text: newExcerpt.trim(),
      fullText: newFullText.trim() || newExcerpt.trim(),
      readTime: newReadTime
    };

    setArticles(prev => [newlyCreated, ...prev]);
    setNewTitle('');
    setNewExcerpt('');
    setNewFullText('');
    setNewImage('');
    setShowAddForm(false);
  };

  const handleResetFeed = () => {
    setArticles(INITIAL_ARTICLES);
    setHiddenArticles(new Set());
    setExpandedArticles(new Set());
    setBookmarkedArticles(new Set());
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    setSubscriptionSuccess(true);
    setNewsletterEmail('');
    setTimeout(() => {
      setSubscriptionSuccess(false);
    }, 4000);
  };

  // Carousel handlers
  const handleCarouselNext = () => {
    const swipeableCount = articles.filter(a => a.isPopular && !hiddenArticles.has(a.id)).length;
    if (swipeableCount === 0) return;
    setCarouselIndex(prev => (prev + 1) % swipeableCount);
  };

  const handleCarouselPrev = () => {
    const swipeableCount = articles.filter(a => a.isPopular && !hiddenArticles.has(a.id)).length;
    if (swipeableCount === 0) return;
    setCarouselIndex(prev => (prev - 1 + swipeableCount) % swipeableCount);
  };

  const touchStartHandler = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
  };

  const touchMoveHandler = (e: React.TouchEvent) => {
    setCurrentX(e.touches[0].clientX);
  };

  const touchEndHandler = () => {
    const diff = startX - currentX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        handleCarouselNext();
      } else {
        handleCarouselPrev();
      }
    }
    setStartX(0);
    setCurrentX(0);
  };

  // Filtering & Sorting Process
  const visibleArticles = articles
    .filter(article => !hiddenArticles.has(article.id))
    .filter(article => {
      if (activeFilter === 'all') return true;
      return article.category === activeFilter;
    })
    .sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });

  const popularArticles = articles.filter(a => a.isPopular && !hiddenArticles.has(a.id));

  // Visual Palette Class Mapping matching Pen beautifully
  const themeBg = 'bg-gradient-to-br from-[#1c1d1f] via-[#090a0c] to-[#000000] text-zinc-100';
  const themeSurface = 'bg-zinc-900/80 text-zinc-100 border-zinc-850';
  const themeSurfaceAlt = 'bg-zinc-950 text-zinc-100 border-zinc-800';
  const themeTextMuted = 'text-zinc-400';
  const themeBorder = 'border-zinc-800/80';
  const themeAccent = '#d64933'; // Deep rust orange matching Owlevate NewsFeed
  const themeBadge = isDarkMode ? 'bg-[#d64933]/15 text-[#ff5f47]' : 'bg-[#d64933]/10 text-[#d64933]';

  if (!isUnlocked) {
    return (
      <div id="founders-lock-screen" className="w-full min-h-screen bg-[#050508] text-white flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
        {/* Sleek tech backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        {/* Cyberpunk matrix scanner beam */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.25)_50%),_linear-gradient(90deg,_rgba(255,0,0,0.06),_rgba(0,255,0,0.02),_rgba(0,0,255,0.06))] bg-[size:100%_4px,_6px_100%] pointer-events-none opacity-40" />

        <motion.div 
          initial={{ opacity: 0, y: 15 }} 
          animate={{ opacity: 1, y: 0 }} 
          className="w-full max-w-md bg-zinc-950/80 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.9)] backdrop-blur-md rounded-3xl p-6 md:p-8 space-y-6 relative text-center"
        >
          {/* Header block with lock graphic */}
          <div className="space-y-3 relative">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-900 to-black border border-white/10 flex items-center justify-center relative">
              <motion.div 
                animate={pinError ? { x: [-4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                <Lock className={`w-7 h-7 ${pinError ? 'text-rose-500' : 'text-[#39ff14]'} drop-shadow-[0_0_10px_rgba(57,255,20,0.4)]`} />
              </motion.div>
              {pinInput.length > 0 && !pinError && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-ping" />
              )}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-2xl font-black font-mono tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
                FOUNDERS GATEWAY
              </h2>
              <p className="text-[10px] font-mono tracking-widest text-[#39ff14] bg-[#39ff14]/5 py-1 px-2.5 rounded-full inline-block">
                ● SECURITY CORE DECRYPTOR
              </p>
            </div>
            
            <p className="text-xs text-zinc-400 font-sans max-w-[280px] mx-auto leading-relaxed">
              Input the sovereign passcode clearance key to unseal historical media vectors and game assets.
            </p>
          </div>

          {/* Code input circles with reactive states */}
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-3.5 bg-black/60 border border-white/5 rounded-2xl py-3.5 px-4">
              {[0, 1, 2, 3, 4, 5].map((idx) => {
                const isFilled = pinInput.length > idx;
                return (
                  <motion.div
                    key={idx}
                    animate={isFilled ? { scale: [1, 1.25, 1], backgroundColor: ["#52525b", "#39ff14", "#39ff14"] } : { scale: 1, backgroundColor: "#18181b" }}
                    transition={{ duration: 0.2 }}
                    className={`w-3.5 h-3.5 rounded-full border border-white/10`}
                  />
                );
              })}
            </div>

            {pinError && (
              <motion.div 
                initial={{ opacity: 0, y: -5 }} 
                animate={{ opacity: 1, y: 0 }} 
                className="text-red-500 font-mono text-[9.5px] uppercase tracking-widest font-bold flex items-center justify-center gap-1 bg-red-950/20 py-1.5 rounded-lg border border-red-900/30"
              >
                <ShieldAlert className="w-3.5 h-3.5 animate-pulse" />
                <span>ACCESS REFUSED: KEY MISMATCH</span>
              </motion.div>
            )}
          </div>

          {/* Grid numeric keypad */}
          <div className="grid grid-cols-3 gap-3">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-zinc-700 rounded-xl font-mono text-lg font-black text-white hover:text-[#39ff14] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
              >
                {num}
              </button>
            ))}
            
            {/* Clear button */}
            <button
              onClick={handleClear}
              className="py-3 px-2 bg-zinc-950 hover:bg-zinc-900 border border-white/5 text-[9.5px] font-mono hover:text-rose-500 font-bold uppercase transition-all rounded-xl cursor-pointer active:scale-95 flex items-center justify-center"
            >
              CLEAR
            </button>

            {/* Zero button */}
            <button
              onClick={() => handleKeyPress('0')}
              className="py-3 bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-zinc-700 rounded-xl font-mono text-lg font-black text-white hover:text-[#39ff14] transition-all cursor-pointer active:scale-95 flex items-center justify-center"
            >
              0
            </button>

            {/* Backspace code */}
            <button
              onClick={handleBackspace}
              className="py-3 bg-zinc-950 hover:bg-zinc-900 border border-white/5 hover:border-rose-500 transition-all rounded-xl cursor-pointer active:scale-95 flex items-center justify-center text-zinc-400"
              title="Backspace"
            >
              ⌫
            </button>
          </div>

          {/* Security details foot indicator */}
          <div className="pt-2 border-t border-white/5 lg:pt-4 text-left flex items-center justify-between text-[8px] font-mono text-zinc-500 uppercase tracking-widest">
            <span>TRANSIT SECURE</span>
            <span className="flex items-center gap-1 text-cyan-400/80">
              <Key className="w-2.5 h-2.5" /> CODE: SECURE
            </span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`w-full min-h-screen font-sans ${themeBg} transition-colors duration-500 pb-20 relative p-1 md:p-4 text-left leading-relaxed`}>
      
      {/* Inline styles for custom PWA high-fidelity magazine ticker & typography overrides */}
      <style dangerouslySetInnerHTML={{ __html: `
        .editorial-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
        .editorial-sans {
          font-family: 'Inter', sans-serif;
        }
        .ticker-track-animation {
          animation: ticker-scrolling 22s linear infinite;
        }
        @keyframes ticker-scrolling {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .premium-article-text::first-letter {
          font-size: 3.5rem;
          font-weight: 800;
          color: ${themeAccent};
          float: left;
          line-height: 0.85;
          margin-right: 0.45rem;
          margin-top: 0.2rem;
          font-family: 'Cormorant Garamond', Georgia, serif;
        }
      `}} />

      {/* Header Bar matching Owlevate NewsFeed navbar */}
      <header className={`sticky top-0 z-50 backdrop-blur-xl border-b ${themeBorder} bg-[#0c0c0e]/85 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 flex justify-between items-center">
          
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-zinc-400 font-bold text-xs uppercase tracking-widest hidden md:inline">
              ★ INTEL HUB
            </span>
            <div className="editorial-title text-2xl md:text-3xl font-black tracking-tight leading-none">
              News<span style={{ color: themeAccent }}>Feed</span>
            </div>
          </div>

          {/* Nav Categories */}
          <nav className="hidden lg:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-zinc-400">
            {['all', 'design', 'css', 'ai', 'technology', 'culture'].map((cat) => (
              <button 
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`transition-all hover:text-rose-500 cursor-pointer ${activeFilter === cat ? 'text-[#d64933] font-extrabold pb-0.5 border-b-2 border-[#d64933]' : 'text-zinc-500'}`}
              >
                {cat}
              </button>
            ))}
          </nav>

          {/* Action buttons on header */}
          <div className="flex items-center gap-3">
            {/* File Upload for user materials */}
            <input 
              type="file" 
              id="material-upload" 
              className="hidden" 
              accept=".txt,.md,.pdf" 
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (event) => setImportedMaterial(event.target?.result as string);
                  reader.readAsText(file);
                }
              }}
            />
            <button 
              onClick={() => document.getElementById('material-upload')?.click()}
              className="px-3.5 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest bg-zinc-700 hover:bg-zinc-600 text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Load Material</span>
            </button>

            <button 
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3.5 py-1.5 rounded-full text-sm font-bold uppercase tracking-widest bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Story</span>
            </button>

            <button 
              onClick={handleResetFeed}
              title="Reset Feeds & Hidden Articles"
              className={`p-2 rounded-full border ${themeBorder} transition-all cursor-pointer hover:bg-zinc-500/10 active:scale-95`}
            >
              <RefreshCw className="w-4 h-4 text-zinc-400" />
            </button>

            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-full border ${themeBorder} transition-all cursor-pointer hover:bg-zinc-500/10 active:scale-95`}
              aria-label="Toggle visual theme"
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-purple-600" />}
            </button>

            {isUnlocked && (
              <button 
                onClick={() => {
                  setIsUnlocked(false);
                  localStorage.removeItem('founders_unlocked');
                  setPinInput('');
                }}
                title="Lock Founders Portal"
                className={`p-2 rounded-full border ${themeBorder} transition-all cursor-pointer hover:text-rose-500 hover:bg-rose-500/15 active:scale-95`}
              >
                <Lock className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </header>

      {/* Ticker Section */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mt-5">
        <div className={`flex items-center gap-3 ${themeSurface} border rounded-2xl p-2 md:p-3 overflow-hidden shadow-sm`}>
          <span className="px-3 py-1 bg-[#d64933] text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex-shrink-0 animate-pulse">
            Breaking
          </span>
          <div className="overflow-hidden relative w-full flex items-center pr-2">
            <div className="flex gap-12 whitespace-nowrap ticker-track-animation uppercase font-mono text-[10.5px] font-semibold text-zinc-400">
              <span>● Responsive typography with clamp() is transforming professional-grade editorial layouts</span>
              <span>● CSS Grid layout properties enable beautiful magazine grid designs natively on the web</span>
              <span>● Large Language Models now generate custom metadata schema graphs directly for indexing crawlers</span>
              <span>● Pure offline caching strategies protect clients from latency surges and unexpected network 403s</span>
              
              {/* Repeated block for perfect seamless wrapping */}
              <span>● Responsive typography with clamp() is transforming professional-grade editorial layouts</span>
              <span>● CSS Grid layout properties enable beautiful magazine grid designs natively on the web</span>
              <span>● Large Language Models now generate custom metadata schema graphs directly for indexing crawlers</span>
              <span>● Pure offline caching strategies protect clients from latency surges and unexpected network 403s</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">

        {/* Dynamic New Story Creator slide container */}
        <AnimatePresence>
          {showAddForm && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`overflow-hidden mb-8 border ${themeBorder} ${themeSurfaceAlt} rounded-3xl p-5 md:p-6 shadow-xl`}
            >
              <h2 className="editorial-title text-2xl font-black tracking-tight mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                Curate A New Editorial Article
              </h2>
              <form onSubmit={handleCreateArticle} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Story Title</label>
                  <input 
                    type="text" 
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter clean visual headline..."
                    required
                    className={`p-3 text-base rounded-xl border outline-none font-sans ${isDarkMode ? 'bg-[#1b1e2a] text-white border-zinc-700' : 'bg-white text-zinc-900 border-neutral-300'}`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Category Tag</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as any)}
                      className={`p-3 text-sm rounded-xl border outline-none font-sans ${isDarkMode ? 'bg-[#1b1e2a] text-white border-zinc-700' : 'bg-white text-zinc-900 border-neutral-300'}`}
                    >
                      <option value="design">Design</option>
                      <option value="css">CSS</option>
                      <option value="ai">AI</option>
                      <option value="technology">Technology</option>
                      <option value="culture">Culture</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Read Estimate</label>
                    <input 
                      type="text" 
                      value={newReadTime}
                      onChange={(e) => setNewReadTime(e.target.value)}
                      placeholder="e.g. 5 min read"
                      className={`p-3 text-sm rounded-xl border outline-none font-sans ${isDarkMode ? 'bg-[#1b1e2a] text-white border-zinc-700' : 'bg-white text-zinc-900 border-neutral-300'}`}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Image Asset URL</label>
                  <input 
                    type="url" 
                    value={newImage}
                    onChange={(e) => setNewImage(e.target.value)}
                    placeholder="Leave blank for random modern developer graphic..."
                    className={`p-3 text-sm rounded-xl border outline-none font-sans ${isDarkMode ? 'bg-[#1b1e2a] text-white border-zinc-700' : 'bg-white text-zinc-900 border-neutral-300'}`}
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Story Excerpt (First paragraph with Dropcap)</label>
                  <textarea 
                    value={newExcerpt}
                    onChange={(e) => setNewExcerpt(e.target.value)}
                    rows={2}
                    placeholder="Provide a high-fidelity summary intro paragraph..."
                    required
                    className={`p-3 text-sm rounded-xl border outline-none font-sans ${isDarkMode ? 'bg-[#1b1e2a] text-white border-zinc-700' : 'bg-white text-zinc-900 border-neutral-300'}`}
                  />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Extended Story Body Text (Markdown supports styling blocks)</label>
                  <textarea 
                    value={newFullText}
                    onChange={(e) => setNewFullText(e.target.value)}
                    rows={4}
                    placeholder="Provide detailed structural layout insights, calculations or educational reviews..."
                    className={`p-3 text-sm rounded-xl border outline-none font-sans ${isDarkMode ? 'bg-[#1b1e2a] text-white border-zinc-700' : 'bg-white text-zinc-900 border-neutral-300'}`}
                  />
                </div>

                <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddForm(false)}
                    className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase text-zinc-400 border border-zinc-700 hover:bg-zinc-500/10 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-6 py-2.5 rounded-xl text-xs font-bold uppercase text-white bg-emerald-600 hover:bg-emerald-500 cursor-pointer transition-all"
                  >
                    Publish News Entry
                  </button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* User Material Loader section */}
        {importedMaterial && (
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             className={`mb-8 border ${themeBorder} ${themeSurfaceAlt} rounded-3xl p-6`}
           >
              <h2 className="text-xl font-bold mb-4 font-mono uppercase tracking-widest text-[#39ff14]">Loaded Material</h2>
              <pre className="font-mono text-xs whitespace-pre-wrap text-zinc-300 bg-black/50 p-4 rounded-xl border border-white/5">{importedMaterial}</pre>
              <button onClick={() => setImportedMaterial(null)} className="mt-4 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-rose-500 cursor-pointer">Close Material</button>
           </motion.div>
        )}

        {/* Hero Magazine Grid Segment */}
        {activeFilter === 'all' && (
          <section className="mb-12">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6.5">
              
              {/* MAIN HERO FEATURE CARD - Left (Spans 2 cols) */}
              <article className="lg:col-span-2 relative min-h-[500px] md:min-h-[620px] rounded-[28px] overflow-hidden shadow-2xl flex flex-col justify-end group">
                <img 
                  src="https://i.postimg.cc/nhTds3k6/60cb398f-1895-4e70-92fc-227244da7a33.png"
                  alt="CPMS Connected - World Digital News and Financial Intelligence Platform Dashboard"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-cover transition-all duration-700 group-hover:scale-105"
                />
                
                {/* Immersive gradient background overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-transparent z-10" />

                <div className="relative z-20 p-6 md:p-10 text-left">
                  <span className="inline-block px-3.5 py-1.5 rounded-full bg-[#d64933] text-white text-[10px] font-black uppercase tracking-widest mb-4">
                    Featured Story
                  </span>
                  
                  <h1 className="editorial-title text-4xl md:text-5xl lg:text-6xl text-white font-extrabold tracking-tight leading-[0.98] mb-4 max-w-2xl">
                    "YOURS" GOT A UPDATE
                  </h1>
                </div>
              </article>

              {/* SIDE CARDS - Right Column */}
              <div className="lg:col-span-1 flex flex-col gap-5">
                
                <article className={`border ${themeBorder} ${themeSurface} rounded-[28px] overflow-hidden shadow-md transition-all duration-300 hover:-translate-y-1.5 flex flex-col h-full`}>
                  <div className="h-44 md:h-52 relative overflow-hidden">
                    <img 
                      src="https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=1200&auto=format&fit=crop" 
                      alt="Coding abstract background"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-[#39ff14] text-black text-[9px] uppercase font-bold px-3 py-1 rounded-full">
                      HOW TO AND EDU
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="editorial-title text-xl md:text-2xl font-bold tracking-tight mb-2 text-white uppercase">
                        FOUNDERS GET BOARD TO
                      </h3>
                      <p className={`text-xs ${themeTextMuted} leading-relaxed font-sans`}>
                        Access the interactive unblocked gaming laboratory featuring custom canvas snow animations, fluid catalog search, and cloaked about:blank safe-mode proxies.
                      </p>
                    </div>
                    <button
                      onClick={() => setShowGamesModal(true)}
                      className="mt-4 w-full py-2 bg-[#d64933] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-rose-600 transition-all cursor-pointer font-bold text-center"
                    >
                      LAUNCH NEW SANDBOX →
                    </button>
                  </div>
                </article>

              </div>

            </div>
          </section>
        )}

        {/* Swipeable Popular Slider (Featuring items with isPopular rating) */}
        {popularArticles.length > 0 && (
          <section className="mb-14">
            <div className="flex justify-between items-center mb-6">
              <div>
                <span className="font-mono text-[#d64933] text-[9px] uppercase tracking-widest font-black block mb-1">
                  ★ POPULAR ARTICLES
                </span>
                <h2 className="editorial-title text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight">
                  This is what Rick is working on this week.
                </h2>
              </div>

              {/* Slider Prev / Next Controls */}
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleCarouselPrev}
                  className={`p-3 rounded-full border ${themeBorder} ${themeSurface} hover:bg-[#d64933] hover:text-white transition-all cursor-pointer active:scale-90`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleCarouselNext}
                  className={`p-3 rounded-full border ${themeBorder} ${themeSurface} hover:bg-[#d64933] hover:text-white transition-all cursor-pointer active:scale-90`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Slider track area */}
            <div 
              className="overflow-hidden rounded-[24px]"
              onTouchStart={touchStartHandler}
              onTouchMove={touchMoveHandler}
              onTouchEnd={touchEndHandler}
            >
              <div 
                ref={carouselTrackRef}
                className="flex transition-transform duration-500 ease-out gap-5"
                style={{ transform: `translateX(-${carouselIndex * (100 / (popularArticles.length > 1 ? 1.4 : 1))}%)` }}
              >
                {popularArticles.map((article) => {
                  if (article.id === 'a3') {
                    return (
                      <div 
                        key={`popular_${article.id}`}
                        className={`min-w-[280px] sm:min-w-[380px] md:min-w-[420px] w-1/3 border ${themeBorder} ${themeSurface} rounded-[24px] overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.01] flex-shrink-0 flex flex-col`}
                      >
                        {/* Header above the image */}
                        <div className="px-5 py-3 border-b border-zinc-700/10 dark:border-white/5 flex items-center justify-between bg-zinc-950/20">
                          <span className="text-xs font-black tracking-wider uppercase text-amber-500 font-mono">
                            API Monitoring Station
                          </span>
                          <span className="text-[10px] font-mono opacity-50 flex items-center gap-1.5 align-middle">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            EXTERNAL LINK
                          </span>
                        </div>
                        <a 
                          href="https://postimg.cc/MvvQkTQG" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full h-full relative group flex-1"
                        >
                          <img 
                            src="https://i.postimg.cc/fTvj9SWY/1c98314d-6e6c-4e5a-9976-014deba7a909.png" 
                            alt="Rick's Project Link" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover min-h-[350px] transition-all duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                            <span className="bg-zinc-950/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-xs font-mono font-bold text-amber-500">
                              VISIT SECURE PARTNER SHARED ASSET
                            </span>
                          </div>
                        </a>
                      </div>
                    );
                  }
                  return (
                    <div 
                      key={`popular_${article.id}`}
                      className={`min-w-[280px] sm:min-w-[380px] md:min-w-[420px] w-1/3 border ${themeBorder} ${themeSurface} rounded-[24px] overflow-hidden shadow-lg transition-all duration-300 hover:scale-[1.01] flex-shrink-0 flex flex-col`}
                    >
                      <div className="h-56 relative">
                        <img src={article.image} alt={article.title} className="w-full h-full object-cover" />
                        <div className="absolute top-4 left-4 bg-zinc-950/80 backdrop-blur-md border border-white/10 text-[9px] uppercase tracking-widest font-black text-amber-500 px-3.5 py-1.5 rounded-full">
                          {article.category}
                        </div>
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="editorial-title text-xl font-bold tracking-tight mb-2.5 hover:text-[#d64933] transition-colors">
                            {article.title}
                          </h3>
                          <p className={`text-xs ${themeTextMuted} font-sans leading-relaxed`}>
                            {article.text}
                          </p>
                        </div>
                        <div className="border-t border-zinc-700/10 dark:border-white/5 pt-4 mt-4 flex items-center justify-between">
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{article.date}</span>
                          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#d64933]">{article.readTime}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <p className="text-[10px] text-center font-mono opacity-60 mt-3 md:hidden">
              Swipe slider left/right or click arrow controls to browse
            </p>
          </section>
        )}

        {/* Content Control Filters & Sorters */}
        <section className={`border-t border-b ${themeBorder} py-5 mb-8 mt-4`}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            
            {/* Filter buttons list */}
            <div className="flex gap-2 flex-wrap items-center">
              <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest mr-2 block">
                Filter Category:
              </span>
              {['all', 'design', 'css', 'ai', 'technology', 'culture'].map((tag) => (
                <button
                  key={`tag_${tag}`}
                  onClick={() => setActiveFilter(tag)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer active:scale-95 ${
                    activeFilter === tag 
                      ? 'bg-[#d64933] text-white shadow-md shadow-[#d64933]/20'
                      : `${themeSurface} text-zinc-400 border ${themeBorder} hover:text-[#d64933]`
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Sort toggler button */}
            <button
              onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
              className={`px-4.5 py-2 rounded-full border ${themeBorder} ${themeSurface} text-xs font-semibold uppercase tracking-wider hover:text-[#d64933] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95`}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort by {sortOrder === 'newest' ? 'Newest' : 'Oldest'}</span>
            </button>

          </div>
        </section>

        {/* Articles Grid Column lists */}
        <section className="relative">
          <AnimatePresence mode="popLayout">
            {visibleArticles.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`text-center py-16 border rounded-3xl ${themeSurfaceAlt} border-dashed flex flex-col items-center justify-center`}
              >
                <BookOpen className="w-12 h-12 text-zinc-400 mb-2.5 animate-bounce" />
                <h3 className="editorial-title text-xl font-bold">No active stories found</h3>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Try clearing category filters or click the Reset Feed button below to return hidden items.
                </p>
                <button 
                  onClick={handleResetFeed}
                  className="mt-4 px-5 py-2 bg-[#d64933] text-white text-xs font-bold uppercase tracking-widest rounded-full cursor-pointer hover:bg-[#b03c27] transition-all"
                >
                  Restore Default Feed
                </button>
              </motion.div>
            ) : (
              <motion.div 
                layout
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6.5"
              >
                {visibleArticles.map((article) => {
                  const isExpanded = expandedArticles.has(article.id);
                  const isBookmarked = bookmarkedArticles.has(article.id);
                  
                  if (article.id === 'a3') {
                    return (
                      <motion.article
                        layout
                        key={article.id}
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.92, opacity: 0 }}
                        transition={{ duration: 0.35 }}
                        className={`border ${themeBorder} ${themeSurface} rounded-[28px] overflow-hidden shadow-lg flex flex-col h-full`}
                      >
                        {/* Header above the image */}
                        <div className="px-5 py-3.5 border-b border-zinc-700/10 dark:border-white/5 flex items-center justify-between bg-zinc-950/20">
                          <span className="text-xs font-black tracking-wider uppercase text-amber-500 font-mono">
                            API Monitoring Station
                          </span>
                          <span className="text-[10px] font-mono opacity-50 flex items-center gap-1.5 align-middle">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            EXTERNAL LINK
                          </span>
                        </div>
                        <a 
                          href="https://postimg.cc/MvvQkTQG" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="block w-full h-full relative group flex-1"
                        >
                          <img 
                            src="https://i.postimg.cc/fTvj9SWY/1c98314d-6e6c-4e5a-9976-014deba7a909.png" 
                            alt="Rick's Project Link" 
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover min-h-[350px] transition-all duration-500 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                            <span className="bg-zinc-950/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-xl text-xs font-mono font-bold text-amber-500">
                              VISIT SECURE PARTNER SHARED ASSET
                            </span>
                          </div>
                        </a>
                      </motion.article>
                    );
                  }
                  
                  return (
                    <motion.article 
                      layout
                      key={article.id}
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.92, opacity: 0 }}
                      transition={{ duration: 0.35 }}
                      className={`border ${themeBorder} ${themeSurface} rounded-[28px] overflow-hidden shadow-lg flex flex-col h-full`}
                    >
                      {/* Image Frame */}
                      <div className="h-52 md:h-56 relative overflow-hidden group">
                        <img 
                          src={article.image} 
                          alt={article.title} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
                        />
                        <div className={`absolute top-4 left-4 ${themeBadge} px-3 py-1 text-[9px] uppercase tracking-widest font-black rounded-lg`}>
                          {article.category}
                        </div>
                        <button
                          onClick={() => toggleBookmark(article.id)}
                          className="absolute top-4 right-4 p-2 bg-[#0f111a]/70 backdrop-blur-md rounded-full border border-white/10 text-white hover:text-amber-500 cursor-pointer transition-all active:scale-90"
                          title="Bookmark Entry"
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500 text-amber-500' : 'text-zinc-200'}`} />
                        </button>
                      </div>

                      {/* Content Frame */}
                      <div className="p-6 flex-1 flex flex-col">
                        
                        {/* Meta tags */}
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">{article.date}</span>
                          <span className="text-[10px] font-mono text-zinc-500 uppercase">{article.readTime}</span>
                        </div>

                        {/* Title Display */}
                        <h2 
                          onClick={() => {
                            if (article.id === 'a1') {
                              setShowSkateSandbox(true);
                            }
                          }}
                          className={`editorial-title text-xl md:text-2xl font-bold tracking-tight mb-3 hover:text-[#d64933] transition-colors leading-tight ${article.id === 'a1' ? 'cursor-pointer hover:underline text-emerald-400' : ''}`}
                        >
                          {article.title} {article.id === 'a1' && ' 🎥'}
                        </h2>

                        {/* Interactive Excerpt / Full Body Expansion with Dropcap styling */}
                        <div className={`text-xs ${themeTextMuted} font-sans leading-relaxed flex-1`}>
                          <p className={isExpanded ? '' : 'premium-article-text'}>
                            {isExpanded ? (article.fullText || article.text) : article.text}
                          </p>
                          {article.id === 'a1' && (
                            <button
                              onClick={() => setShowSkateSandbox(true)}
                              className="mt-3.5 w-full py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.2)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                            >
                              <span>▶ PLAY VIDEO SERIES SANDBOX</span>
                            </button>
                          )}
                        </div>

                        {/* Action buttons footer drawer */}
                        <div className="border-t border-zinc-700/10 dark:border-white/5 pt-4 mt-6 flex items-center justify-between gap-2.5">
                          
                          {article.id === 'a1' ? (
                            <button
                              onClick={() => setShowSkateSandbox(true)}
                              className="px-4.5 py-2 bg-gradient-to-r from-[#22b07d] to-[#12a1bd] hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-95 flex items-center gap-1 shadow-md"
                            >
                              Play Series →
                            </button>
                          ) : (
                            <button
                              onClick={() => toggleExpand(article.id)}
                              className={`px-4.5 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                                isExpanded 
                                  ? 'bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 shadow-inner'
                                  : `${isDarkMode ? 'bg-[#1b1e2a] border border-zinc-800 text-zinc-300' : 'bg-neutral-100 text-zinc-800'} hover:bg-[#d64933] hover:text-white`
                              }`}
                            >
                              {isExpanded ? 'Collapse' : 'Expand'}
                            </button>
                          )}

                          <button
                            onClick={() => toggleHide(article.id)}
                            className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-500/10 cursor-pointer transition-all"
                            title="Hide Entry"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>

                        </div>

                      </div>
                    </motion.article>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

      </main>

      {/* Interactive Games Modal */}
      <AnimatePresence>
        {showGamesModal && (
          <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl relative"
            >
              <ReidsGamesWidget onClose={() => setShowGamesModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Skateboard Video Series Portal Modal */}
      <AnimatePresence>
        {showSkateSandbox && (
          <SkateboardVideoSandbox onClose={() => setShowSkateSandbox(false)} />
        )}
      </AnimatePresence>

    </div>
  );
}
