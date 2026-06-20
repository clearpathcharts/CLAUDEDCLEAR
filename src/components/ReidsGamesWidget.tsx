import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Gamepad2, Film, X, Monitor, ShieldAlert, Sparkles } from 'lucide-react';

interface GameItem {
  name: string;
  url: string;
}

const GAMES_DATA: GameItem[] = [
  { name: "Plants vs Zombies", url: "https://script.google.com/macros/s/AKfycbyyEXD9_h6Vsie5eSBmDPCD1rAgPDa6O4kKxn9eyRMkzEsohm_7sMFRzs_h411gQEPx2w/exec" },
  { name: "Subway Surfers", url: "https://mysticgames.netlify.app/games/subway/" },
  { name: "Strong Man Simulator", url: "https://script.google.com/macros/s/AKfycbxLkugSSEdQm0qJQ4PZWRce6p8pKpuPdLIFeivG0cMt-QmjEjedBCarzz_kd2tlvxzs/exec" },
  { name: "Steal a Brainrot", url: "https://script.google.com/macros/s/AKfycbytsGAlf3lPg4Po7HvAheHvyJKxYRA4ZYPUGjjjMpZafajZs3F5pu7E5BekDXlNhRHUFw/exec" },
  { name: "Grow a Garden", url: "https://script.google.com/macros/s/AKfycbwK_YDMKEccZyVOz_fpe66G4Je4VyFPdT10OdaKpM699Utzbq41n2m6OXqAzpX0oqrLTA/exec" },
  { name: "Snow Rider 3D", url: "https://script.google.com/macros/s/AKfycbw5Z-Ryg_JfIIDYH7pzzPKXlr2tN0HCw-tT_ZvxBGDPsDDY41ewPVneVeLzelfpnBab/exec" },
  { name: "Crash Carts", url: "https://script.google.com/macros/s/AKfycbx63iRe5mtf5PQGIn_eGwKePxCA1iU6w-YApn57Mh4phi2ZB-G-GCJA1YTV9jKrwoqb/exec" },
  { name: "Nugget Clicker", url: "https://script.google.com/macros/s/AKfycbzjgnGGeTNL2DTjJzVx3WGvsLjEyA47O6xYss-ijTLWWwrQv9siK9Gn_QqNDlDkrc27/exec" },
  { name: "Cookie Clicker", url: "https://script.google.com/macros/s/AKfycbxGM35J29NkO-2LYjxWj_cA9IUaaXypkUy-LqXyLRbGTz0R6lXmAEapz1STN1jlTIRavw/exec" },
  { name: "Pixel Shooter", url: "https://script.google.com/macros/s/AKfycbzBG3iwMy-Kdz3gY7oQSBugoIGwmA-IWITNrA8j1vX5ytZQHcKTS-61QLSpA5ixBJ2U/exec" },
  { name: "1v1 LOL", url: "https://1009047778-atari-embeds.googleusercontent.com/aff94361-27e5-4c58-b0e9-d72815885587" },
  { name: "Bitlife", url: "https://script.google.com/macros/s/AKfycbz7YQScNBizgtxyn4DO7v12IQTI4nqwQc8srdlN30uZWw5BxWdIr2TPoMRC_8yQQKC7/exec" },
  { name: "Cat Clicker", url: "https://script.google.com/macros/s/AKfycbyZC8Co483g482FRlWQrt5RGrDErAhWbwboKbvJW26UflpwUdNs5XlLObHrDjEszGRV4w/exec" },
  { name: "Pizza Clicker", url: "https://script.google.com/macros/s/AKfycbxYgrQX9Czp4Tt9bYdMCxZ4gAQOtTBECYvroKJ7r48kTXs1vXa6xTOXYFYhcRNIawzK/exec" },
  { name: "Pixel Gun 3D", url: "https://storage.googleapis.com/test-41376.appspot.com/pga2.html" },
  { name: "Space Bar Clicker", url: "https://script.google.com/macros/s/AKfycbzZN3jRO2eOgcp622_W0GYAeArMio71AmlfRhF8yFucC5hEbRnDFZ3NLiN8peebEdlhWw/exec" },
  { name: "Poop Clicker", url: "https://script.google.com/macros/s/AKfycbzDdetO4NX5twY1pU389ZUG2M9DERmoV0DeJNJS7SvzVIdA1WUaBeIeHo_CfQVNw2gq6g/exec" },
  { name: "Clicker Heros", url: "https://script.google.com/macros/s/AKfycbxiYJVxz4HPt3JTbXtgX7swXZ734vV_Wr4QcqmQrBMydobF0wIOH_eqQx9HFVCkH4cX/exec" },
  { name: "Duck Clicker", url: "https://script.google.com/macros/s/AKfycbysJKtWMnsbhg8q1RmnOEAr2U89XMzTL2Ca0w9lqKdoi7dx9QZbwsqzQdCcCBmLUtiI6A/exec" },
  { name: "Spider Man", url: "https://script.google.com/macros/s/AKfycbwAoMJxFkkCGbz6H0x2lq5uVhb1vvQRKraex1znydX5Gm0jWse3HWUTvdU34ghoPqQauQ/exec" },
  { name: "Slope 2", url: "https://sites.google.com/view/slpe-2-player/" },
  { name: "Slither IO", url: "https://script.google.com/macros/s/AKfycbwXhPAppqZUy69d6b26B3Z6daQdZmzPsiaSsywQseSBMh94FLNnVTmupJqtonwt9oaQLw/exec" },
  { name: "Paper IO", url: "https://script.google.com/macros/s/AKfycbwNxCzUuQVmLRWTwYK2D4yTqpWg2O-qge8BwCkxhLmqWd1DtXynwJXPEDClPt7ERZr-/exec" },
  { name: "Noob Miner", url: "https://script.google.com/macros/s/AKfycbxkvPO4mEcWEk5a9TgEuR7qyiYZs7hL80XF5pwK8QMKHqmA7qUqxvIePB3PF9c3Bqc93w/exec" },
  { name: "Zombie Sandbox", url: "https://script.google.com/macros/s/AKfycbxutg4sKZIHB5Nu6jyZ1PcIze8YSbsHFDx8xJraC4VHAfJOu4If-Tk7swki5Mia_IGY/exec" },
  { name: "Drift Boss", url: "https://script.google.com/macros/s/AKfycbwAOi2tPbjzeWDkigfZMIPEGubYxz2la_qjxJyydNZyjwgbqsv9mv05g7tdmLHdvdaw/exec" },
  { name: "Hole IO", url: "https://script.google.com/macros/s/AKfycbwSQ0aXrXdz23Z0adlljZLtt6EGzD7max6U15OnUFBxhQmht6KK7l7RzsVo2wOdkoXR/exec" },
  { name: "Snow IO", url: "https://script.google.com/macros/s/AKfycbxa3OjBw8KWer3YhEXl1wxoe1uQKNo-wgGuqPO3NTndX566TTs10-ioXopEPitTvE-B/exec" },
  { name: "Death Run 3D", url: "https://script.google.com/macros/s/AKfycbwqW4kBl41CHKxAW1aOCzUllnCGaK6LDmkZfAZH_dJzu646nns5bRfn0oqa5Zpq9zEI/exec" },
  { name: "Madalin Car Stunts", url: "https://script.google.com/macros/s/AKfycbwkhPzDs1efaiOPjYhNnVKMinAE3jONqLhZa8Eu5oGeqrQaDQtp-glIhnYrXAem5E8Dqw/exec" },
  { name: "Granny", url: "https://storage.googleapis.com/test-41376.appspot.com/gn.html" },
  { name: "FNAF", url: "https://script.google.com/macros/s/AKfycbxJNtrKTWPCSIo9tOqq53G2xqoQCIPDTYUsVOT79Eqk8I7C5cQkGdDnj0jzlNHa7bvs3g/exec" },
  { name: "Slender Man", url: "https://script.google.com/macros/s/AKfycbzD78lGmoq37iyrMDWZavBLxIRpQ_HmutXT9arsozaDkYaHVSfk7YliEmd3EL4nXM_4Bw/exec" },
  { name: "Gun Night", url: "https://script.google.com/macros/s/AKfycbxIkkCWh4kp5QZwqA8qXEnb2XaFgXTErieBl4CMrLPYHqTDtl21HiF4373fWf9hInDNBQ/exec" },
  { name: "Ahoy Raft", url: "https://script.google.com/macros/s/AKfycbyzVkBvWyVbdMcOo68Fh2bzuKaGAPmJdypz7toaDyxYMoctbxh7cgg6DC-LGUdA-LZ0Ow/exec" },
  { name: "NFL Madden", url: "https://script.google.com/macros/s/AKfycbyeK7PhBwy3ieGSllnEILb9qSdGPmt2vheRIPImM2VOllSJAk-0Y82i1OVGl7qxWda3ZA/exec" },
  { name: "Funny Shooter 2", url: "https://storage.googleapis.com/test-41376.appspot.com/fs2.html" },
  { name: "Build a Plane", url: "https://script.google.com/macros/s/AKfycbwzSeRTcepa4gSddtkqyNQgNIxsXgbtpvOwBH_iHFqTPuI4LDTOREP_BcbCyO48fn6aew/exec" },
  { name: "Feed a Brainrot", url: "https://script.google.com/macros/s/AKfycbyGbCbN5nPB5TUr52E5i_9LV_tSmFUNZKdmgUSaKMMBsoHkEnrS7HBPgftiRn0xbOEd/exec" },
  { name: "Minecraft Raft", url: "https://script.google.com/macros/s/AKfycbwpQHXN2419GU1OjX9m-MoQwpIeM-ZS7r2UE3NiqJ_GqPinDaFWAd_FJ_i0HZ_pxU/exec" },
  { name: "Car King", url: "https://script.google.com/macros/s/AKfycbz6GTepbaULO9dEqHBzfb2Rm0C3pdSKcKnaOGr6qAWXxoppLkkA65v3vTgsDS4o7W56aQ/exec" },
  { name: "TABS", url: "https://script.google.com/macros/s/AKfycbx-20sK1Vv2W5l1l4NnyzA67dCLHiWUNOnwlGioOx9yKXkauoZt5H7l6il14wlLS9hI4A/exec" },
  { name: "Football Bros", url: "https://script.google.com/macros/s/AKfycbxjYzXDX0iopyVPSDgG8_sTlQPpjv5KYMdsOtLXzYrQYdHPmHdswUb5NTXedQ3RK8XyoQ/exec" },
  { name: "Basketball Stars", url: "https://script.google.com/macros/s/AKfycbwzYMDDcdDUAvEP7iO6OdRk-5_oUp6vYvDdyEEz8tTOzWi5y4-Qf3vQ6TBoZuc9UYVcLg/exec" },
  { name: "Pokemon Emerald", url: "https://script.google.com/macros/s/AKfycbydeGJlDAWwZCE5PY08zOOmx37ItizsHHLSxDEwAEOsGgT7n9rqb4V1Anelns4sezU6/exec" },
  { name: "Pokemon Fire", url: "https://script.google.com/macros/s/AKfycbzEbzXxS4zazELSeJtXyLaPrJhPMEJsh2lACeG_0Ky7xTL0ewG0m1iJeU2d1K0OmeGOug/exec" },
  { name: "Retro Bowl", url: "https://bav1.wadmc.site.cdn.cloudflare.net/pages/other/interpreter/index.html?url=https://cdn.jsdelivr.net/gh/gn-math/html@main/33.html" },
  { name: "Geometry Dash", url: "https://mysticgames.netlify.app/games/geometrydash/" },
  { name: "Time Shooter 2", url: "https://storage.googleapis.com/test-41376.appspot.com/ts2.html" },
  { name: "Time Shooter 3", url: "https://storage.googleapis.com/test-41376.appspot.com/ts3.html" },
  { name: "Blade Ball", url: "https://storage.googleapis.com/test-41376.appspot.com/blb.html" },
  { name: "Poly Track", url: "https://script.google.com/macros/s/AKfycbzOmulSCFb0CwkaIrhIBdqglMVAfxQppFmVZmp2cp8-eHLj0j_LjbQtEhNyTClffFte/exec" },
  { name: "OvO", url: "https://script.google.com/macros/s/AKfycbyDZOJq86UIFlMkKfvZtA_Sv86sKooVRpwVFS2rb38TOT8ExCt3PfR1Y5UAveVuVGlQLw/exec" },
  { name: "DOOM", url: "https://script.google.com/macros/s/AKfycbyxLM58t1oGIyqp09GNTAGBqUBaFg7A9nY5lLwS45Zg2z63ax0EmnhHCXW_aHhEpdFcqg/exec" }
];

const MOVIES_DATA: GameItem[] = [
  { name: "The Super Mario Bros. Movie", url: "https://drive.google.com/file/d/1eRB_-rlFmeifwaUg5nq8AN1Z8XWOUrzX/preview" },
  { name: "Ant-Man and The Wasp", url: "https://drive.google.com/file/d/1A3IjnFbij3F9PsfR8yqgxmOYgtde4u6i/preview" },
  { name: "Shrek", url: "https://drive.google.com/file/d/1L3PP-zA8fT3qD8VXVOnj9jOSaPGkUxRw/preview" },
  { name: "An Extremely Goofy Movie", url: "https://drive.google.com/file/d/1uH6tzn26qa5bbVp3RNUxuANcYd5G-3zP/preview" },
  { name: "Moana", url: "https://drive.google.com/file/d/1jvUEJm-zNFj3JwUDicd0gvutkqrP9HxV/preview" }
];

interface ReidsGamesWidgetProps {
  onClose?: () => void;
}

export default function ReidsGamesWidget({ onClose }: ReidsGamesWidgetProps) {
  const [activeTab, setActiveTab] = useState<'games' | 'movies'>('games');
  const [searchTerm, setSearchTerm] = useState('');
  const [launchedUrl, setLaunchedUrl] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Snow Particle Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    class Flake {
      x = Math.random() * width;
      y = Math.random() * -height;
      size = Math.random() * 2.5 + 1;
      speed = Math.random() * 0.8 + 0.3;
      opacity = Math.random() * 0.5 + 0.3;
      swayOffset = Math.random() * Math.PI * 2;

      update() {
        this.y += this.speed;
        this.x += Math.sin(this.y * 0.01 + this.swayOffset) * 0.3 + 0.1;
        if (this.y > height) {
          this.y = -10;
          this.x = Math.random() * width;
        }
        if (this.x > width) this.x = 0;
        if (this.x < 0) this.x = width;
      }

      draw(cCtx: CanvasRenderingContext2D) {
        cCtx.beginPath();
        cCtx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        cCtx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        cCtx.fill();
      }
    }

    const flakes: Flake[] = Array.from({ length: 60 }, () => new Flake());

    let reqId = 0;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      flakes.forEach((f) => {
        f.update();
        f.draw(ctx);
      });
      reqId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(reqId);
    };
  }, []);

  const items = activeTab === 'games' ? GAMES_DATA : MOVIES_DATA;
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLaunch = (url: string) => {
    // If the browser doesn't block popups or we want inline simulation
    setLaunchedUrl(url);
  };

  const getImgUrl = (name: string, type: 'game' | 'movie') => {
    const query = encodeURIComponent(name + (type === 'game' ? " game app icon" : " movie poster"));
    const w = type === 'game' ? 300 : 300;
    const h = type === 'game' ? 220 : 400;
    return `https://tse2.mm.bing.net/th?q=${query}&w=${w}&h=${h}&c=7&rs=1&p=0`;
  };

  return (
    <div className="relative w-full h-[660px] bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl p-6 flex flex-col">
      {/* Dynamic Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none opacity-40 z-0" />

      {/* Main Container Elements */}
      <div className="relative z-10 flex flex-col h-full space-y-5">
        
        {/* Header bar */}
        <div className="flex justify-between items-center bg-zinc-900/60 p-4 rounded-2xl border border-white/5">
          <div className="flex items-center gap-2.5">
            <Gamepad2 className="w-6 h-6 text-cyan-400 animate-pulse" />
            <div>
              <h2 className="title font-bold text-xl text-white tracking-wide">REIDS GAMES &amp; EDU PORTAL</h2>
              <p className="text-[10px] text-cyan-400 uppercase tracking-widest font-mono">Unblocked Retro Sandbox Hub</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('games')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'games' ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-black/40 text-zinc-400 border border-white/5 hover:text-white'
              }`}
            >
              GAMES
            </button>
            <button
              onClick={() => setActiveTab('movies')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === 'movies' ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'bg-black/40 text-zinc-400 border border-white/5 hover:text-white'
              }`}
            >
              MOVIES
            </button>
            {onClose && (
              <button 
                onClick={onClose}
                className="p-1.5 rounded-full bg-zinc-850 border border-white/10 text-zinc-400 hover:text-white ml-2 cursor-pointer active:scale-90"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4" />
          <input
            type="text"
            placeholder="Search retro catalogs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/8 w-full py-3.5 pl-11 pr-5 text-sm rounded-xl border border-white/5 focus:border-cyan-400 text-white outline-none placeholder-zinc-500 focus:shadow-[0_0_15px_rgba(6,182,212,0.15)] transition"
          />
        </div>

        {/* Catalog grid */}
        <div className="flex-1 overflow-y-auto no-scrollbar grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-2">
          {filteredItems.map((item) => (
            <div
              key={item.name}
              onClick={() => handleLaunch(item.url)}
              className="group bg-zinc-900/40 border border-white/5 rounded-2xl overflow-hidden cursor-pointer hover:border-cyan-400 hover:-translate-y-1 transition-all h-[140px] flex flex-col justify-end relative shadow-lg"
            >
              <img
                src={getImgUrl(item.name, activeTab === 'games' ? 'game' : 'movie')}
                alt={item.name}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 group-hover:opacity-85 transition-all duration-500"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://placehold.co/180x130/18181b/06b6d4?text=${encodeURIComponent(item.name)}`;
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              <div className="p-3 relative z-10">
                <span className="text-[9px] uppercase font-mono text-cyan-400 font-bold block tracking-wider">
                  {activeTab === 'games' ? 'GAME MODULE' : 'CINEMA'}
                </span>
                <span className="text-[12px] font-bold text-white line-clamp-1 group-hover:text-cyan-400 transition">
                  {item.name}
                </span>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
            <div className="col-span-full py-16 text-center text-zinc-500 font-mono text-xs">
              No results match "{searchTerm}". Try another search query.
            </div>
          )}
        </div>

        {/* Panic button explanation footer */}
        <div className="text-zinc-650 font-mono text-[9px] text-center pt-2 border-t border-white/5 flex items-center justify-center gap-1.5">
          <ShieldAlert size={12} className="text-zinc-500" />
          <span>Press ESC inside active sessions to instantly swap and cloake view with Google Drive. Stable sandbox connection secure.</span>
        </div>
      </div>

      {/* Frame overlay modal when game is launched */}
      <AnimatePresence>
        {launchedUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/95 z-50 flex flex-col"
          >
            <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center text-xs">
              <span className="font-mono text-cyan-400 font-bold flex items-center gap-1.5 uppercase">
                <Sparkles size={13} className="animate-spin" />
                Active Cloaked Sandbox Stream
              </span>
              <button
                onClick={() => setLaunchedUrl(null)}
                className="px-3 py-1 bg-red-600/20 text-red-400 border border-red-500/20 rounded-full hover:bg-red-600 hover:text-white transition-all text-[10px] uppercase font-black tracking-widest cursor-pointer"
              >
                Close Connection
              </button>
            </div>
            <div className="flex-1 w-full bg-black relative">
              <iframe
                src={launchedUrl}
                className="w-full h-full border-0 absolute inset-0"
                allowFullScreen
                title="Cloaked Gaming Sandboxed Node"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
