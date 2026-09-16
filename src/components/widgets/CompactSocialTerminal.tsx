import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Send, Radio, Globe, MessageSquare } from 'lucide-react';

interface SocialPost {
  id: string;
  platform: 'x' | 'discord' | 'stocktwits' | 'linkedin';
  handle: string;
  text: string;
  timestamp: number;
  isSystemNotification?: boolean;
}

export default function CompactSocialTerminal() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [wsStatus, setWsStatus] = useState<'ONLINE' | 'CONNECTING' | 'OFFLINE'>('OFFLINE');
  const [msgInput, setMsgInput] = useState('');
  const [activeAccount, setActiveAccount] = useState<{ platform: 'x' | 'discord' | 'stocktwits' | 'linkedin', handle: string } | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Read connected accounts from localStorage if saved or fallback
  useEffect(() => {
    // Sync connection state with backend Websocket
    let socket: WebSocket | null = null;
    let reconnectTimeout: any = null;

    const connectWs = () => {
      try {
        setWsStatus('CONNECTING');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = window.location.host;
        socket = new WebSocket(`${protocol}//${host}`);

        socket.onopen = () => {
          setWsStatus('ONLINE');
          
          // Let's check which handles are active
          // For demo, if none connected, we can default connect to an "All-Access Member" socket
          const dummyHandle = `@ApexAnalyst_CPM`;
          setActiveAccount({ platform: 'x', handle: dummyHandle });
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'ACTIVE_SOCIAL_POSTS') {
              setPosts(parsed.posts || []);
            } else if (parsed.type === 'SOCIAL_POST_BROADCAST' && parsed.post) {
              setPosts(prev => [parsed.post, ...prev]);
            } else if (parsed.type === 'SOCIAL_CONNECT_BROADCAST') {
              const systemNotif: SocialPost = {
                id: 'sys_conn_compact_' + Date.now(),
                platform: parsed.platform,
                handle: parsed.handle,
                text: `⚡ Established secure WebSocket gateway thread. Hub channel synced.`,
                timestamp: parsed.timestamp || Date.now(),
                isSystemNotification: true
              };
              setPosts(prev => [systemNotif, ...prev]);
            }
          } catch (err) {
            console.error('Error in compact ws packet parse:', err);
          }
        };

        socket.onclose = () => {
          setWsStatus('OFFLINE');
          reconnectTimeout = setTimeout(() => connectWs(), 6000);
        };

        wsRef.current = socket;
      } catch (err) {
         console.error('Failed compact ws connection:', err);
         setWsStatus('OFFLINE');
      }
    };

    connectWs();

    return () => {
      if (socket) socket.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  // Scroll to main container top on new post
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [posts]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgInput.trim() || !activeAccount) return;

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'SOCIAL_POST',
        platform: activeAccount.platform,
        handle: activeAccount.handle,
        text: msgInput.trim()
      }));
      setMsgInput('');
    } else {
      alert("Socket handshake pipeline resolving. Please wait.");
    }
  };

  const getPlatformLabelColor = (platform: string) => {
    switch (platform) {
      case 'x': return 'bg-[#00D9FF] text-black';
      case 'discord': return 'bg-[#7289DA] text-white';
      case 'stocktwits': return 'bg-[#4CAF50] text-white';
      case 'linkedin': return 'bg-[#0077B5] text-white';
      default: return 'bg-zinc-800 text-zinc-300';
    }
  };

  return (
    <div className="bg-[#050314] text-white flex flex-col font-mono p-4 rounded-xl border border-white/10 select-none overflow-hidden h-[360px] relative">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-2.5 border-b border-white/10 shrink-0">
        <div className="flex items-center space-x-2">
          <Terminal size={14} className="text-[#FF00C8]" />
          <h2 className="text-[10px] font-black uppercase tracking-wider text-zinc-200">
            WS Social Terminal Feed
          </h2>
        </div>
        <div className="flex items-center space-x-1 bg-black/45 px-2 py-0.5 rounded-full border border-white/5">
          <span className={`w-1.5 h-1.5 rounded-full ${wsStatus === 'ONLINE' ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-[8px] text-zinc-400 font-bold uppercase">{wsStatus}</span>
        </div>
      </div>

      {/* Main Feed Container */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 pr-1 mb-2.5"
      >
        {posts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[9px] text-[#555] p-2">
            <Radio size={16} className="animate-pulse mb-1.5" />
            <div>NO BROADCASTS RECEIVED</div>
            <div>WS Gateway connection active on port 3000</div>
          </div>
        ) : (
          posts.map((post) => {
            if (post.isSystemNotification) {
              return (
                <div key={post.id} className="border-l-2 border-emerald-500 bg-emerald-950/20 px-2 py-1.5 rounded text-[8px] leading-relaxed text-zinc-300">
                  <span className="text-emerald-400 font-black">WS GATEWAY HANDSHAKE APPROVE</span>
                  <div className="mt-0.5">Trader <strong className="text-emerald-300">{post.handle}</strong> connected securely on port 3000.</div>
                </div>
              );
            }

            return (
              <div key={post.id} className="border-l-2 border-[#FF00C8]/50 bg-black/30 p-2 rounded relative text-[9px] leading-snug">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center space-x-1.5">
                    <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded ${getPlatformLabelColor(post.platform)}`}>
                      {post.platform}
                    </span>
                    <span className="font-bold text-zinc-200">{post.handle}</span>
                  </div>
                  <span className="text-zinc-600 text-[8px]">
                    {new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>
                <div className="text-zinc-300 font-sans tracking-wide text-[9px]">
                  {post.text}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Instant Broadcast Command form */}
      <form onSubmit={handleSend} className="shrink-0 flex gap-1 pt-2 border-t border-white/5">
        <input 
          type="text"
          value={msgInput}
          onChange={(e) => setMsgInput(e.target.value)}
          placeholder={activeAccount ? `Broadcast as ${activeAccount.handle}...` : "Connecting..."}
          disabled={!activeAccount}
          className="flex-1 bg-black/60 border border-white/10 rounded px-2.5 py-1.5 text-[9px] text-zinc-100 placeholder-zinc-500 font-mono focus:outline-none focus:border-[#FF00C8]/50 disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={!msgInput.trim() || !activeAccount}
          className="bg-indigo-600 hover:bg-indigo-500 px-2.5 rounded flex items-center justify-center border border-indigo-500 transition-colors disabled:opacity-50"
        >
          <Send size={10} className="text-white" />
        </button>
      </form>

    </div>
  );
}
