import React, { useState, useEffect } from 'react';
import { getDb, auth } from "../firebase";
import { collection, getDocs, query, limit, onSnapshot } from '../firebase';
import { Search, Activity, Users, Globe, ShieldAlert, Terminal, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/FirebaseContext';
import { isVideoUrl, isAudioUrl } from '../lib/utils';
import { AnimatePresence } from 'framer-motion';
import QuarantineModal from './QuarantineModal';
import KafkaSandbox from './KafkaSandbox';

export default function CeoDashboard() {
  const db = getDb();
  const [ceoTab, setCeoTab] = useState<'system' | 'kafka'>('system');
  const [users, setUsers] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [investigatingUser, setInvestigatingUser] = useState<any | null>(null);
  
  // Real-time remote system logs states
  const [logs, setLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<any | null>(null);
  
  const { userProfile } = useAuth();

  useEffect(() => {
    let unsubscribeLogs = () => {};

    const setupLogsListener = () => {
      try {
        if (!auth.currentUser) {
          console.warn("No authorized Auth state active for system_logs subscription.");
          setLogsLoading(false);
          return;
        }

        unsubscribeLogs = onSnapshot(query(collection(getDb(), 'system_logs'), limit(100)), (snapshot) => {
          const fetchedLogs = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Sort in-memory safely to protect against missing composite-index errors
          fetchedLogs.sort((a: any, b: any) => {
            const timeA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          });

          setLogs(fetchedLogs);
          setLogsLoading(false);
        }, (error) => {
          console.error("Failed to subscribe to system logs realtime stream:", error);
          setLogsLoading(false);
        });
      } catch (err) {
        console.error("Failed to register logs stream:", err);
        setLogsLoading(false);
      }
    };

    setupLogsListener();
    return () => unsubscribeLogs();
  }, []);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        if (!auth.currentUser) {
          console.warn("No active Firebase Auth user, falling back to mock data.");
          setUsers([{
            id: 'mock-1',
            email: 'operator@clearpathtrader.com',
            displayName: 'System Operator',
            username: 'sys_op',
            interfaceType: 'calm_focus',
            createdAt: new Date()
          }]);
          setIsLoading(false);
          return;
        }
        const q = query(collection(getDb(), 'users'));
        const querySnapshot = await getDocs(q);
        const fetchedUsers = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUsers(fetchedUsers);
      } catch (err) {
        // Silently handle error or log it if the user isn't authorized to read all users
        console.error("Failed to fetch users", err);
        setUsers([{
          id: 'mock-1',
          email: 'admin@clearpathtrader.com',
          displayName: 'Clear Path Admin',
          username: 'admin',
          interfaceType: 'calm_focus',
          createdAt: new Date()
        }]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    (user.email && user.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.displayName && user.displayName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.username && user.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-full p-6 md:p-12 font-sans overflow-y-auto custom-scrollbar pb-32" style={{ backgroundColor: '#09090b' }}>
      {/* Header Section */}
      <h1 className="text-4xl text-[#FF00FF] border-b-2 border-[#4B0082] pb-3 uppercase drop-shadow-[0_0_8px_rgba(255,0,255,0.8)] font-black tracking-widest mb-6">
        CEO Backdoor: Clear Path Understanding
      </h1>

      {/* CEO Micro-Tabs */}
      <div className="flex border-b border-indigo-500/20 mb-8 gap-4 select-none flex-wrap">
        <button
          onClick={() => setCeoTab('system')}
          className={`px-5 py-3 font-mono text-xs uppercase tracking-widest font-black transition-all duration-250 border-b-2 ${
            ceoTab === 'system'
              ? 'text-[#00FFFF] border-[#00FFFF] bg-[#00FFFF]/5 shadow-[0_12px_24px_-12px_rgba(0,255,255,0.4)]'
              : 'text-zinc-500 border-transparent hover:text-zinc-350 hover:bg-white/5'
          }`}
        >
          🚨 ALERTS & USER DATABASE
        </button>
        <button
          onClick={() => setCeoTab('kafka')}
          className={`px-5 py-3 font-mono text-xs uppercase tracking-widest font-black transition-all duration-250 border-b-2 ${
            ceoTab === 'kafka'
              ? 'text-[#FF00FF] border-[#FF00FF] bg-[#FF00FF]/5 shadow-[0_12px_24px_-12px_rgba(255,0,255,0.4)]'
              : 'text-zinc-500 border-transparent hover:text-zinc-350 hover:bg-white/5'
          }`}
        >
          ⚙️ KAFKA EVENT STREAM ENGINE
        </button>
      </div>

      {ceoTab === 'system' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
        {/* Panel 1: Live Users */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#00FFFF] shadow-[0_0_15px_rgba(0,255,255,0.3)]">
          <h2 className="text-[#00FFFF] text-xl font-bold uppercase mb-4 flex items-center">
            <Users size={20} className="mr-2" />
            Registered Users
          </h2>
          <p className="text-white text-5xl font-black m-0">{isLoading ? '--' : users.length}</p>
          <p className="text-gray-400 text-sm mt-3">Total distinct profiles loaded from database.</p>
        </div>

        {/* Panel 2: System Health */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#FF4500] shadow-[0_0_15px_rgba(255,69,0,0.3)]">
          <h2 className="text-[#FF4500] text-xl font-bold uppercase mb-4 flex items-center">
            <Activity size={20} className="mr-2" />
            System Health
          </h2>
          <div className="flex justify-between mb-3">
            <span className="text-white text-lg">Website Uptime:</span>
            <span className="text-[#00FFFF] text-lg font-bold">ONLINE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-white text-lg">Core Engine:</span>
            <span className="text-[#00FFFF] text-lg font-bold">ONLINE</span>
          </div>
        </div>

        {/* Panel 3: Social Media Connections */}
        <div className="bg-[#1a1a2e] p-6 rounded-lg border-2 border-[#4D00FF] shadow-[0_0_15px_rgba(77,0,255,0.3)]">
          <h2 className="text-xl font-bold uppercase mb-4 flex items-center"
              style={{
                background: 'linear-gradient(135deg, #00FFFF, #4D00FF)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
            <Globe size={20} className="mr-2 text-[#00FFFF]" />
            Social Media Status
          </h2>
          <div className="flex justify-between mb-3">
            <span className="text-lg font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #00FFFF, #4D00FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>X (Twitter):</span>
            <span className={`text-lg font-bold truncate max-w-[200px] text-right ${userProfile?.contactInfo?.twitter ? 'text-green-400' : 'text-[#FF4500]'}`}>
              {userProfile?.contactInfo?.twitter ? <a href={userProfile.contactInfo.twitter} target="_blank" rel="noreferrer" className="hover:underline">{userProfile.contactInfo.twitter}</a> : 'PENDING LINK'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-lg font-bold"
                  style={{
                    background: 'linear-gradient(135deg, #00FFFF, #4D00FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}>YouTube:</span>
            <span className={`text-lg font-bold truncate max-w-[200px] text-right ${(userProfile?.contactInfo as any)?.youtube ? 'text-green-400' : 'text-[#FF4500]'}`}>
              {(userProfile?.contactInfo as any)?.youtube ? <a href={(userProfile?.contactInfo as any).youtube} target="_blank" rel="noreferrer" className="hover:underline">{(userProfile?.contactInfo as any).youtube}</a> : 'PENDING LINK'}
            </span>
          </div>
        </div>
      </div>

        {/* Database Search Section */}
      <div className="bg-[#1a1a2e] p-6 rounded-lg border border-white/10 mb-10">
        <h2 className="text-2xl text-red-500 font-bold mb-6 flex items-center uppercase tracking-widest gap-3">
          <ShieldAlert size={28} />
          System Alerts
        </h2>
        <div className="space-y-4">
          {users.filter(u => {
            const defaultAvatars = [
              'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400&q=80',
              'https://images.unsplash.com/photo-1611689342806-0863700ce7e4?w=400&q=80',
              'https://images.unsplash.com/photo-1590424744257-f112e4f0dc7f?w=400&q=80',
              'https://images.unsplash.com/photo-15ed38eb1eb9d-19cd1eb5dcdc?w=400&q=80',
              'https://images.unsplash.com/photo-1588392205575-10459aafaf38?w=400&q=80'
            ];
            const p = u.photoURL || u.photoUrl;
            const noRealPhoto = !p || defaultAvatars.includes(p);
            const cTime = u.createdAt?.toDate ? u.createdAt.toDate().getTime() : (u.createdAt ? new Date(u.createdAt).getTime() : Date.now());
            return noRealPhoto && (Date.now() - cTime > 7 * 24 * 60 * 60 * 1000);
          }).map(u => (
            <div key={u.id} className="bg-red-500/10 border border-red-500/30 p-4 rounded-lg flex items-center justify-between shadow-[0_0_15px_rgba(239,68,68,0.2)]">
              <div className="flex flex-col">
                <span className="text-red-400 font-bold text-lg">{u.displayName || u.email || 'Unknown User'}</span>
                <span className="text-red-300/60 text-sm">SECURITY ALERT: This person refuses to create a real profile.</span>
              </div>
              <button 
                onClick={() => setInvestigatingUser(u)}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-500 px-4 py-2 rounded-md font-bold uppercase tracking-widest transition-colors border border-red-500/50"
              >
                Investigate
              </button>
            </div>
          ))}
          {users.filter(u => {
            const defaultAvatars = [
              'https://images.unsplash.com/photo-1614027164847-1b28cfe1df60?w=400&q=80',
              'https://images.unsplash.com/photo-1611689342806-0863700ce7e4?w=400&q=80',
              'https://images.unsplash.com/photo-1590424744257-f112e4f0dc7f?w=400&q=80',
              'https://images.unsplash.com/photo-15ed38eb1eb9d-19cd1eb5dcdc?w=400&q=80',
              'https://images.unsplash.com/photo-1588392205575-10459aafaf38?w=400&q=80'
            ];
            const p = u.photoURL || u.photoUrl;
            const noRealPhoto = !p || defaultAvatars.includes(p);
            const cTime = u.createdAt?.toDate ? u.createdAt.toDate().getTime() : (u.createdAt ? new Date(u.createdAt).getTime() : Date.now());
            return noRealPhoto && (Date.now() - cTime > 7 * 24 * 60 * 60 * 1000);
          }).length === 0 && (
            <div className="text-green-500/70 font-mono text-sm tracking-wider">No active security alerts.</div>
          )}
        </div>
      </div>

      {/* Centralized Remote System Logs */}
      <div className="bg-[#151525] p-6 rounded-lg border-2 border-indigo-600/50 shadow-[0_0_20px_rgba(99,102,241,0.25)] mb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 border-b border-white/10 pb-4 gap-4">
          <div>
            <h2 className="text-2xl text-indigo-400 font-extrabold flex items-center uppercase tracking-wider gap-3">
              <Terminal size={28} className="animate-pulse" />
              Centralized Remote Logs
            </h2>
            <p className="text-gray-400 text-sm mt-1 font-sans">
              Active zero-trust diagnostic audit stream of permission-related crashes and system errors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold">Realtime Connected</span>
          </div>
        </div>

        {/* Filters and search info */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input 
              type="text" 
              placeholder="Filter logs by message, user email, operation code, or path..." 
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              className="w-full bg-black/60 border border-indigo-500/20 rounded-lg py-3 px-11 text-sm text-white placeholder-white/40 focus:outline-none focus:border-indigo-500 transition-all font-mono"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          </div>
          {logSearchQuery && (
            <button 
              onClick={() => setLogSearchQuery('')}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-mono text-gray-400 transition-colors border border-white/10 cursor-pointer"
            >
              CLEAR FILTER
            </button>
          )}
        </div>

        {/* Logs viewport */}
        <div className="max-h-[500px] overflow-y-auto custom-scrollbar border border-white/10 rounded-lg bg-black/40 divide-y divide-white/5">
          {logsLoading ? (
            <div className="py-20 text-center text-gray-400 font-mono text-xs">
              Establishing Firestore stream...
            </div>
          ) : logs.filter(log => {
            if (!logSearchQuery) return true;
            const query = logSearchQuery.toLowerCase();
            return (
              (log.error && log.error.toLowerCase().includes(query)) ||
              (log.operationType && log.operationType.toLowerCase().includes(query)) ||
              (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
              (log.path && log.path.toLowerCase().includes(query))
            );
          }).length === 0 ? (
            <div className="py-20 text-center text-gray-500 font-mono text-xs">
              No system logs found matching criteria.
            </div>
          ) : (
            logs.filter(log => {
              if (!logSearchQuery) return true;
              const query = logSearchQuery.toLowerCase();
              return (
                (log.error && log.error.toLowerCase().includes(query)) ||
                (log.operationType && log.operationType.toLowerCase().includes(query)) ||
                (log.userEmail && log.userEmail.toLowerCase().includes(query)) ||
                (log.path && log.path.toLowerCase().includes(query))
              );
            }).map((log) => {
              const dateObj = log.createdAt?.toDate ? log.createdAt.toDate() : (log.createdAt ? new Date(log.createdAt) : null);
              const formattedTime = dateObj ? dateObj.toLocaleTimeString() + ' ' + dateObj.toLocaleDateString() : 'N/A';
              const isSelected = selectedLog?.id === log.id;
              
              // Define tag styles for operation types
              let opBadgeClass = "bg-amber-500/10 text-amber-400 border border-amber-500/20";
              if (log.operationType?.includes('unhandled')) {
                opBadgeClass = "bg-rose-500/15 text-rose-400 border border-rose-500/30 font-black";
              } else if (log.operationType?.includes('write') || log.operationType?.includes('delete')) {
                opBadgeClass = "bg-orange-600/15 text-orange-400 border border-orange-500/30";
              } else if (log.operationType?.includes('get') || log.operationType?.includes('list')) {
                opBadgeClass = "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20";
              }

              return (
                <div key={log.id} className={`p-4 transition-all ${isSelected ? 'bg-indigo-950/20' : 'hover:bg-white/[0.02]'}`}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 cursor-pointer" onClick={() => setSelectedLog(isSelected ? null : log)}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${opBadgeClass}`}>
                          {log.operationType || 'SYSTEM ERROR'}
                        </span>
                        <span className="text-gray-500 font-mono text-[10px]">
                          {formattedTime}
                        </span>
                        {log.path && log.path !== 'none' && (
                          <span className="text-indigo-400/80 font-mono text-[10px] truncate max-w-[200px]" title={log.path}>
                            path: {log.path}
                          </span>
                        )}
                      </div>
                      <p className="text-white text-xs font-mono font-bold leading-relaxed truncate max-w-4xl">
                        {log.error}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 shrink-0 text-right">
                      <div className="text-right hidden sm:block">
                        <p className="text-xs text-white/95 font-bold">{log.userEmail || 'unauthenticated'}</p>
                        <p className="text-[10px] text-gray-500 font-mono">UID: {log.userId?.substring(0, 8)}...</p>
                      </div>
                      <button className="text-indigo-400 hover:text-indigo-300 text-xs font-mono uppercase tracking-widest font-black transition-colors shrink-0 cursor-pointer">
                        {isSelected ? '[-]' : '[+]'}
                      </button>
                    </div>
                  </div>

                  {/* Log Details Viewer inside line item */}
                  {isSelected && (
                    <div className="mt-4 p-4 rounded bg-black/80 border border-indigo-500/20 font-mono text-xs text-indigo-300 space-y-3 shadow-inner">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-indigo-500/10 pb-3">
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black">Logged URL</p>
                          <p className="text-white break-all">{log.url || 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black">Firebase Log Path</p>
                          <p className="text-yellow-400 break-all">/system_logs/{log.id}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black">User Details</p>
                          <p className="text-white">Email: {log.userEmail || 'unknown'}</p>
                          <p className="text-white">UID: {log.userId || 'unknown'}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black">Operation</p>
                          <p className="text-emerald-400">{log.operationType || 'unknown_op'}</p>
                          <p className="text-cyan-400">path: {log.path || 'none'}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-500 uppercase tracking-wider text-[9px] font-black mb-2 flex items-center gap-1.5">
                          <AlertCircle size={12} className="text-rose-400" /> Trace / Stack / Payload Details
                        </p>
                        <pre className="max-h-[300px] overflow-y-auto bg-black p-3.5 rounded border border-white/5 text-[11px] font-mono text-rose-400 whitespace-pre-wrap leading-relaxed select-text custom-scrollbar">
                          {log.error}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Database Search Section */}
      <div className="bg-[#1a1a2e] p-6 rounded-lg border border-white/10">
        <h2 className="text-2xl text-white font-bold mb-6 flex items-center">
          <Search className="mr-3 text-indigo-400" />
          User Database Search
        </h2>
        
        <div className="relative mb-6">
          <input 
            type="text" 
            placeholder="Search by email, name, or username..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/50 border border-white/20 rounded-lg py-4 px-12 text-white placeholder-white/40 focus:outline-none focus:border-[#FF00FF] focus:ring-1 focus:ring-[#FF00FF] transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" size={20} />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-white/80">
            <thead className="bg-black/40 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4 rounded-tl-lg">User</th>
                <th className="px-6 py-4">Email Address</th>
                <th className="px-6 py-4">Interface Type</th>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4 rounded-tr-lg text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">Loading user database...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-white/50">No users found matching "{searchQuery}"</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {(user.photoURL || user.photoUrl) ? (
                          isVideoUrl(user.photoURL || user.photoUrl) ? (
                            <video src={user.photoURL || user.photoUrl} className="w-10 h-10 rounded-full mr-4 border border-white/20 object-cover" autoPlay loop muted playsInline />
                          ) : isAudioUrl(user.photoURL || user.photoUrl) ? (
                            <div className="w-10 h-10 rounded-full mr-4 border border-white/20 bg-[#111] flex items-center justify-center overflow-hidden">
                              <audio src={user.photoURL || user.photoUrl} className="w-[300%] scale-[0.35] opacity-60" />
                            </div>
                          ) : (
                            <img 
                              referrerPolicy="no-referrer"
                              src={user.photoURL || user.photoUrl} 
                              alt="avatar" 
                              className="w-10 h-10 rounded-full mr-4 border border-white/20 object-cover"
                            />
                          )
                        ) : (
                          <div className="w-10 h-10 rounded-full mr-4 border border-white/20 bg-[#111] flex items-center justify-center">
                            <span className="text-white/30 text-xs font-bold">{(user.displayName || 'U').substring(0,1).toUpperCase()}</span>
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-white">{user.displayName || 'Unknown'}</p>
                          <p className="text-xs text-white/50">@{user.username || 'user'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-sm">{user.email || 'Hidden/Not provided'}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        user.interfaceType === 'lava' ? 'bg-[#ff4500]/20 text-[#ff4500] border border-[#ff4500]/30' : 
                        user.interfaceType === 'accessible' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                        'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      }`}>
                        {user.interfaceType || 'Standard'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-white/40">{user.id}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => setInvestigatingUser(user)}
                        className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg border border-red-500/30 transition-colors"
                        title="Quarantine / Investigate User"
                      >
                        <ShieldAlert size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      ) : (
        <KafkaSandbox />
      )}

      <AnimatePresence>
        {investigatingUser && (
          <QuarantineModal 
            user={investigatingUser} 
            onClose={() => setInvestigatingUser(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
