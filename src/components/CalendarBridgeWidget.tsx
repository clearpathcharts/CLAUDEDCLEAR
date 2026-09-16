// src/components/CalendarBridgeWidget.tsx

import React, { useState, useEffect } from 'react';
import { 
  Calendar, Plus, Trash2, ShieldAlert, Check, Lock, Sparkles, 
  Bell, Sliders, Globe, RefreshCw, AlertTriangle, ChevronDown, 
  Settings, ShieldCheck, Mail, Info, Smartphone, AlertCircle
} from 'lucide-react';

import { CALENDAR_PROVIDERS } from '../calendar-bridge/services/provider-registry';
import { connectCalendar } from '../calendar-bridge/api/connect';
import { disconnectCalendar } from '../calendar-bridge/api/disconnect';
import { syncAllCalendars } from '../calendar-bridge/api/sync';
import { ConnectedCalendar, getConnectedCalendarsDb } from '../calendar-bridge/services/calendar-sync';
import { NormalizedEvent } from '../calendar-bridge/services/event-normalizer';
import { EconomicConflict, EconomicEvent } from '../calendar-bridge/services/economic-matcher';
import { NotificationPreferences, DEFAULT_NOTIF_PREFERENCES, generateConflictWarning } from '../calendar-bridge/services/notification-engine';

interface CalendarBridgeWidgetProps {
  onConflictsUpdated?: (conflicts: EconomicConflict[]) => void;
}

export function CalendarBridgeWidget({ onConflictsUpdated }: CalendarBridgeWidgetProps) {
  // States
  const [calendars, setCalendars] = useState<ConnectedCalendar[]>([]);
  const [userEvents, setUserEvents] = useState<NormalizedEvent[]>([]);
  const [conflicts, setConflicts] = useState<EconomicConflict[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [tierFilter, setTierFilter] = useState<'All' | 1 | 2 | 3>('All');

  // Connection Form
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('google');
  const [emailOrUrl, setEmailOrUrl] = useState<string>('');
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [formError, setFormError] = useState<string>('');

  // Pro features configuration
  const [isPro, setIsPro] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'connections' | 'overlay' | 'ai_layer' | 'notifications'>('connections');
  
  // AI Scheduling Layer Subscribed Assets
  const [subscribedSymbols, setSubscribedSymbols] = useState<string[]>(['EURUSD', 'GBPUSD', 'XAUUSD']);
  
  // Notification preference flags
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIF_PREFERENCES);

  // Hardcoded current economic calendar events stream for matching
  const SAMPLE_ECONOMIC_EVENTS: EconomicEvent[] = [
    {
      id: "econ_cpi",
      title: "US CPI Inflation Release (YoY & MoM)",
      start: "2026-06-09T08:30:00Z", // aligns with Google Doctor Appointment (9:00 AM)
      end: "2026-06-09T09:15:00Z",
      importance: "High",
      category: "Economics",
      impactTicker: "EURUSD"
    },
    {
      id: "econ_fomc",
      title: "Federal Reserve Interest Rate Decision & Presser",
      start: "2026-06-10T14:00:00Z", // overlaps with "Trader Round-Table Sync"
      end: "2026-06-10T15:30:00Z",
      importance: "High",
      category: "Central Banks",
      impactTicker: "USD"
    },
    {
      id: "econ_boe",
      title: "BOE Monetary Policy Summary & Rate Announcement",
      start: "2026-06-09T12:00:00Z", // matches Outlook corporate lunch!
      end: "2026-06-09T13:00:00Z",
      importance: "High",
      category: "Central Banks",
      impactTicker: "GBPUSD"
    },
    {
      id: "econ_soy",
      title: "USDA WASDE Crop Production (Soybeans & Corn Outlook)",
      start: "2026-06-09T16:00:00Z",
      end: "2026-06-09T17:00:00Z",
      importance: "Medium",
      category: "Economics",
      impactTicker: "SOYBEANS"
    }
  ];

  // Load calendars and sync
  const triggerSync = async () => {
    setIsLoading(true);
    try {
      const stats = await syncAllCalendars(SAMPLE_ECONOMIC_EVENTS, subscribedSymbols);
      setCalendars(await getConnectedCalendarsDb());
      setUserEvents(stats.events);
      setConflicts(stats.conflicts);
      if (onConflictsUpdated) {
        onConflictsUpdated(stats.conflicts);
      }
    } catch (e) {
      console.error("Sync error", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    triggerSync();
  }, [subscribedSymbols]);

  // Handle new connection
  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    // Pro cap constraint (Max 1 calendar for Free users)
    if (!isPro && calendars.length >= 1) {
      setFormError("Free Tier limit reached. Please upgrade to Pro for Unlimited Unified Calendars.");
      return;
    }

    if (selectedProvider === 'other' || CALENDAR_PROVIDERS[selectedProvider].type === 'caldav') {
      if (!emailOrUrl) {
        setFormError("Server/Calendar Endpoint URL or file address is required");
        return;
      }
    } else {
      if (!emailOrUrl || !emailOrUrl.includes('@')) {
        setFormError("A valid email handle is required");
        return;
      }
    }

    try {
      const credentials = { username, password };
      await connectCalendar(selectedProvider, emailOrUrl, credentials);
      
      // Reset form
      setEmailOrUrl('');
      setUsername('');
      setPassword('');
      setIsAdding(false);
      
      // Reload lists
      await triggerSync();
    } catch (err: any) {
      setFormError(err.message || "Failed to make connection secure check");
    }
  };

  // Handle Disconnect
  const handleDisconnect = async (calId: string) => {
    try {
      await disconnectCalendar(calId);
      await triggerSync();
    } catch (e) {
      console.error(e);
    }
  };

  // Toggle symbols
  const toggleSymbol = (symbol: string) => {
    if (subscribedSymbols.includes(symbol)) {
      setSubscribedSymbols(subscribedSymbols.filter(s => s !== symbol));
    } else {
      setSubscribedSymbols([...subscribedSymbols, symbol]);
    }
  };

  // Render provider badges/icons helper
  const getProviderTag = (providerKey: string) => {
    const config = CALENDAR_PROVIDERS[providerKey];
    if (!config) return "OT";
    return config.name.split(' ')[0].toUpperCase();
  };

  return (
    <div className="bg-black/55 backdrop-blur-xl border border-white/[0.08] rounded-2xl p-5 shadow-[0_12px_36px_rgba(0,0,0,0.6)] select-none text-left" id="calendar-bridge-dashboard">
      
      {/* HEADER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-[#ff007f]/10 rounded-xl border border-[#ff007f]/20 shadow-[0_0_12px_rgba(255,0,127,0.15)]">
            <Calendar className="w-5 h-5 text-[#ff007f] animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white font-mono tracking-wider uppercase">PRIVATE CALENDAR BRIDGE</h3>
            <p className="text-[10px] text-zinc-400 font-mono tracking-tight leading-normal">Zero-Description Privacy Sync Engine</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Pro Upgrade trigger */}
          {!isPro ? (
            <button 
              onClick={() => setIsPro(true)}
              className="px-3 py-1.5 bg-gradient-to-r from-yellow-500/10 via-[#ff007f]/15 to-[#00f0ff]/10 hover:from-yellow-400/20 hover:via-[#ff007f]/30 hover:to-[#00f0ff]/20 text-yellow-500 font-mono text-[10px] font-black border border-yellow-500/30 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-[0_2px_10px_rgba(234,179,8,0.1)]"
            >
              <Sparkles className="w-3.5 h-3.5 animate-spin" />
              UPGRADE PRO
            </button>
          ) : (
            <span className="px-2.5 py-1 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 font-mono text-[9px] font-black tracking-widest rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> PRO ACCOUNT
            </span>
          )}

          <button 
            onClick={triggerSync} 
            disabled={isLoading}
            className="p-2 bg-white/5 hover:bg-white/10 active:bg-white/15 text-zinc-300 hover:text-white border border-white/[0.06] rounded-xl transition-all cursor-pointer"
            title="Force refresh calendars stream"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* MINI TABS */}
      <div className="flex bg-black/40 border border-white/[0.06] p-0.5 rounded-xl text-[10px] font-mono font-bold mb-4">
        {[
          { id: 'connections', label: 'CONNECTIONS', count: calendars.length },
          { id: 'overlay', label: 'UNIFIED OVERLAY', count: conflicts.length ? `${conflicts.length} CLASHES` : null },
          { id: 'ai_layer', label: 'AI SCHEDULER' },
          { id: 'notifications', label: 'NOTIFICATIONS' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 text-center rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5
              ${activeTab === tab.id 
                ? 'bg-[#ff007f]/15 text-[#ff007f] font-black shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)]' 
                : 'text-zinc-500 hover:text-zinc-300'}`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className={`px-1 rounded text-[8px] ${activeTab === tab.id ? 'bg-[#ff007f]/30 text-white' : 'bg-white/5 text-zinc-500'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. CONNECTIONS MANAGER PANEL */}
      {activeTab === 'connections' && (
        <div className="space-y-4">
          
          {/* List of Active Calendars */}
          {calendars.length === 0 ? (
            <div className="text-center py-6 border border-dashed border-white/[0.06] rounded-xl bg-black/20">
              <AlertCircle className="w-6 h-6 text-zinc-500 mx-auto mb-2" />
              <p className="text-[11px] text-zinc-400 font-mono">No Calendars Connected</p>
              <p className="text-[9px] text-zinc-600 font-mono mt-0.5">Integrate Google, Apple, or custom WebCal feeds securely.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {calendars.map(cal => (
                <div key={cal.id} className="flex items-center justify-between p-3 bg-black/40 border border-white/[0.06] rounded-xl shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 font-mono px-2 py-0.5 rounded font-bold uppercase">
                      {getProviderTag(cal.provider)}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-white font-mono uppercase">{cal.name}</h4>
                      <p className="text-[9px] text-zinc-500 font-mono truncate max-w-44 lg:max-w-xs">{cal.emailOrUrl}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDisconnect(cal.id)}
                    className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/30 rounded-lg transition-all cursor-pointer"
                    title="Disconnect Calendar Integration"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Trigger Add Button */}
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full py-2.5 border border-dashed border-white/[0.15] bg-white/[0.02] hover:bg-white/[0.04] text-zinc-300 hover:text-white font-mono text-[10px] font-black rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 uppercase"
            >
              <Plus className="w-4 h-4 text-[#ff007f]" />
              Connect Private Calendar Provider
            </button>
          ) : (
            <form onSubmit={handleConnect} className="bg-black/40 border border-white/[0.08] p-4 rounded-xl space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
              {/* Heading */}
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono font-black text-[#ff007f] uppercase tracking-wider">Configure Sync Details</span>
                <button 
                  type="button" 
                  onClick={() => { setIsAdding(false); setFormError(''); }}
                  className="text-[9px] font-mono font-bold text-zinc-500 hover:text-zinc-300 underline uppercase"
                >
                  Cancel
                </button>
              </div>

              {/* Tiers filter selection */}
              <div className="flex gap-1 bg-black/60 p-0.5 border border-white/[0.04] rounded-lg text-[9px] font-mono font-bold">
                {[
                  { id: 'All', label: 'ALL' },
                  { id: '1', label: 'TIER 1 (POPULAR)' },
                  { id: '2', label: 'TIER 2 (PRO)' },
                  { id: '3', label: 'TIER 3 (STANDARDS)' }
                ].map(group => (
                  <button
                    key={group.id}
                    type="button"
                    onClick={() => setTierFilter(group.id === 'All' ? 'All' : parseInt(group.id) as any)}
                    className={`flex-1 py-1 rounded transition-all cursor-pointer
                      ${(tierFilter === 'All' && group.id === 'All') || (tierFilter.toString() === group.id)
                        ? 'bg-white/10 text-white' 
                        : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {group.label}
                  </button>
                ))}
              </div>

              {/* Provider dropdown selector with groups */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">Calendar System Type</label>
                <div className="relative">
                  <select 
                    value={selectedProvider} 
                    onChange={(e) => {
                      setSelectedProvider(e.target.value);
                      setEmailOrUrl('');
                      setFormError('');
                    }}
                    className="w-full bg-black border border-white/[0.08] rounded-lg py-2 pl-3 pr-8 text-xs text-zinc-200 focus:outline-none focus:border-[#ff007f] font-mono uppercase"
                  >
                    {/* TIER 1 */}
                    {(tierFilter === 'All' || tierFilter === 1) && (
                      <optgroup label="Tier 1 - Standard Systems">
                        <option value="google">Google Calendar (OAuth)</option>
                        <option value="apple">Apple Calendar (CalDAV)</option>
                        <option value="outlook">Microsoft Outlook (OAuth)</option>
                        <option value="yahoo">Yahoo Calendar (OAuth)</option>
                      </optgroup>
                    )}
                    {/* TIER 2 */}
                    {(tierFilter === 'All' || tierFilter === 2) && (
                      <optgroup label="Tier 2 - Professional Solutions">
                        <option value="proton">Proton Calendar (Encrypted Portal)</option>
                        <option value="zoho">Zoho Calendar (Corporate)</option>
                        <option value="fastmail">Fastmail Calendar (CalDAV)</option>
                        <option value="nextcloud">Nextcloud Instance (Private Cloud)</option>
                        <option value="teamup">Teamup Calendar (WebCal Link)</option>
                        <option value="calendarbridge">CalendarBridge Workspace</option>
                      </optgroup>
                    )}
                    {/* TIER 3 */}
                    {(tierFilter === 'All' || tierFilter === 3) && (
                      <optgroup label="Tier 3 - Structured Standards">
                        <option value="caldav">Standard CalDAV Protocol</option>
                        <option value="webcal">WebCal URL Subscription (.ics)</option>
                        <option value="ics">ICS Snapshot Local Upload</option>
                        <option value="exchange_activesync">Exchange ActiveSync Server</option>
                        <option value="exchange_server">Microsoft Exchange (On-Premises)</option>
                        <option value="other">Other System Connector (Universal CalDAV)</option>
                      </optgroup>
                    )}
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Dynamic Credential Input based on Protocol */}
              {selectedProvider === 'other' || CALENDAR_PROVIDERS[selectedProvider].type === 'caldav' || selectedProvider === 'exchange_server' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">Calendar Feed URL / Server Endpoint</label>
                    <input 
                      type="text" 
                      placeholder="e.g. https://calendar.company.com/caldav"
                      value={emailOrUrl}
                      onChange={(e) => setEmailOrUrl(e.target.value)}
                      className="w-full bg-black/65 border border-white/[0.08] rounded-lg py-1.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff007f] font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">Username</label>
                      <input 
                        type="text" 
                        placeholder="Required"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-black/65 border border-white/[0.08] rounded-lg py-1.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff007f] font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-black/65 border border-white/[0.08] rounded-lg py-1.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff007f] font-mono"
                      />
                    </div>
                  </div>
                </>
              ) : selectedProvider === 'webcal' ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">WebCal Subscription .ics URL</label>
                  <input 
                    type="text" 
                    placeholder="webcal://calendar.corp.com/ical/feed.ics"
                    value={emailOrUrl}
                    onChange={(e) => setEmailOrUrl(e.target.value)}
                    className="w-full bg-black/65 border border-white/[0.08] rounded-lg py-1.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff007f] font-mono"
                  />
                </div>
              ) : selectedProvider === 'ics' ? (
                <div className="space-y-1">
                  <label className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">Mock Local .ics Path Name</label>
                  <input 
                    type="text" 
                    placeholder="e.g. trading-schedule-june.ics"
                    value={emailOrUrl}
                    onChange={(e) => setEmailOrUrl(e.target.value)}
                    className="w-full bg-black/65 border border-white/[0.08] rounded-lg py-1.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff007f] font-mono"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">Account Email Address</label>
                    <input 
                      type="email" 
                      placeholder="e.g. operator@domain.com"
                      value={emailOrUrl}
                      onChange={(e) => setEmailOrUrl(e.target.value)}
                      className="w-full bg-black/65 border border-white/[0.08] rounded-lg py-1.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff007f] font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-mono font-bold text-zinc-400 block uppercase">App-Specific Access Token</label>
                    <input 
                      type="password" 
                      placeholder="OAUTH SECURED"
                      disabled={CALENDAR_PROVIDERS[selectedProvider].type === 'oauth'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-black/65 border border-white/[0.08] rounded-lg py-1.5 px-3 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#ff007f] font-mono disabled:opacity-50"
                    />
                  </div>
                </div>
              )}

              {/* Error Box */}
              {formError && (
                <div className="p-2.5 bg-rose-500/10 border border-rose-500/25 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                  <p className="text-[9px] text-rose-400 font-mono leading-normal">{formError}</p>
                </div>
              )}

              {/* Submit Connect */}
              <button 
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-[#ff007f] via-[#5d00ff] to-[#00f0ff] text-white font-mono text-[10px] font-bold rounded-lg cursor-pointer hover:opacity-90 tracking-widest uppercase transition-opacity flex items-center justify-center gap-1"
              >
                Assemble Connection Pipe <Check className="w-3.5 h-3.5 text-white" />
              </button>
            </form>
          )}

          {/* PRIVACY SHIELD FOOTER NOTE */}
          <div className="flex gap-2 p-3 bg-zinc-950/40 border border-white/[0.03] rounded-xl text-[9px] text-zinc-500 font-mono leading-relaxed">
            <Info className="w-4 h-4 text-[#00f0ff] shrink-0 mt-0.5" />
            <p>
              <strong>PRIVACY ARCHITECTURE:</strong> This client strictly isolates the connection. ClearPathTrader fetches start, end, timezone, and title to detect collisions; we never parse descriptions, attendee lists, or documents.
            </p>
          </div>
        </div>
      )}

      {/* 2. UNIFIED EVENT OVERLAY TAB */}
      {activeTab === 'overlay' && (
        <div className="space-y-4">
          
          {/* List of collisions / alerts warning */}
          {conflicts.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[9px] font-mono font-black text-[#ff007f] uppercase tracking-wider block">
                Active Economic Clashes ({conflicts.length})
              </span>
              {conflicts.map((conflict, i) => {
                const warningMsg = generateConflictWarning(conflict, notifPrefs);
                return (
                  <div key={i} className="bg-black/55 border-r-2 border-l border-t border-b border-[#ff007f]/45 rounded-xl p-3.5 space-y-2.5 relative overflow-hidden shadow-[0_4px_16px_rgba(255,0,127,0.08)]">
                    <div className="absolute right-2.5 top-2 bg-[#ff007f]/15 border border-[#ff007f]/30 px-2 py-0.5 rounded text-[8px] font-mono text-[#ff007f] font-black uppercase">
                      clash #{i+1}
                    </div>
                    
                    <div className="flex gap-2 items-start text-xs font-mono">
                      <ShieldAlert className="w-4.5 h-4.5 text-[#ff007f] shrink-0 animate-pulse mt-0.5" />
                      <div>
                        <strong className="text-zinc-200 block text-[11px] leading-snug uppercase tracking-tight">{warningMsg.headline}</strong>
                        <span className="text-red-400 font-black text-[9px] uppercase tracking-wider block mt-0.5">{warningMsg.status}</span>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] font-mono text-zinc-300">
                      <p className="bg-black/30 p-1.5 rounded border border-white/[0.04]">
                        🌐 <strong>{warningMsg.eventDetails}</strong>
                      </p>
                      <p className="text-zinc-400">
                        🗓️ {warningMsg.conflictTime}
                      </p>
                    </div>

                    {/* Quick alert actions */}
                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[10px] font-mono">
                      <span className="text-zinc-500">Alert state:</span>
                      <div className="flex gap-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${notifPrefs.push ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          PUSH
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${notifPrefs.sms ? 'bg-emerald-500/10 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
                          SMS
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${notifPrefs.email ? 'bg-[#00f0ff]/10 text-[#00f0ff]' : 'bg-zinc-800 text-zinc-500'}`}>
                          EMAIL
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Unified timeline overlay */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono font-black text-[#00f0ff] uppercase tracking-wider block">Unified Calendar Feed</span>
            
            <div className="bg-black/35 border border-white/[0.05] rounded-xl p-3 max-h-56 overflow-y-auto custom-scrollbar space-y-2">
              {/* Combine user events and economic releases into a structured list */}
              {userEvents.length === 0 ? (
                <div className="text-center py-4 text-[10px] text-zinc-500 font-mono">
                  No private calendar events parsed. Connect a provider inside "Connections" tab to populated the feed.
                </div>
              ) : (
                [
                  ...userEvents.map(e => ({ ...e, type: 'user' })),
                  ...SAMPLE_ECONOMIC_EVENTS.map(e => ({ id: e.id, title: e.title, start: e.start, end: e.end, timezone: 'UTC', sourceProvider: 'economic', type: 'econ', importance: e.importance }))
                ]
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .map((item, idx) => {
                  const dateObj = new Date(item.start);
                  const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' });
                  const isEcon = item.type === 'econ';
                  
                  return (
                    <div 
                      key={idx} 
                      className={`p-2.5 rounded-lg border flex items-start gap-3 transition-colors text-xs font-mono
                        ${isEcon 
                          ? 'bg-black/55 border-r border-t border-b border-l-2 border-l-[#ff007f] border-white/[0.03]' 
                          : 'bg-black/35 border-l-2 border-l-[#00f0ff] border-white/[0.04]'}`}
                    >
                      <div className="text-[10px] text-zinc-500 shrink-0 text-center font-bold">
                        <div>{formattedTime}</div>
                        <div className="text-[8px] font-normal uppercase text-zinc-650 opacity-60">UTC</div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`text-[8px] font-black uppercase px-1 rounded
                            ${isEcon ? 'bg-[#ff007f]/10 text-pink-400' : 'bg-[#00f0ff]/10 text-cyan-400'}`}>
                            {isEcon ? 'Economic Indicator' : 'My Schedule'}
                          </span>
                          {!isEcon && (
                            <span className="text-[8px] bg-white/5 text-zinc-500 px-1 rounded uppercase">
                              {(item as any).sourceProvider}
                            </span>
                          )}
                          {isEcon && (item as any).importance === 'High' && (
                            <span className="text-[8px] bg-yellow-500/10 text-yellow-500 px-1 rounded uppercase animate-pulse">
                              High Impact
                            </span>
                          )}
                        </div>
                        <h5 className="text-[11px] font-black text-white uppercase mt-0.5 truncate leading-relaxed">
                          {item.title}
                        </h5>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. AI SCHEDULING LAYER TAB */}
      {activeTab === 'ai_layer' && (
        <div className="space-y-4">
          <div className="bg-black/45 border border-white/[0.06] p-3 rounded-xl flex gap-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)]">
            <Sparkles className="w-5 h-5 text-yellow-500 shrink-0 animate-spin mt-0.5" />
            <div className="text-xs font-mono text-zinc-300">
              <strong className="text-white block mb-0.5">SMART FILTER INFERENCE</strong>
              The AI automatically tracks macro events relative to your active portfolio indices while safely muting unrelated news.
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-[9px] font-mono font-black text-[#ff007f] uppercase tracking-wider block">My Trade Tickers (Subscription Setup)</span>
            
            {/* Symbol Chips */}
            <div className="flex flex-wrap gap-2">
              {['EURUSD', 'GBPUSD', 'XAUUSD', 'BTCUSD', 'SOYBEANS', 'COTTON', 'LIVESTOCK'].map(symbol => {
                const isSelected = subscribedSymbols.includes(symbol);
                const isAgri = ['SOYBEANS', 'COTTON', 'LIVESTOCK'].includes(symbol);
                return (
                  <button
                    key={symbol}
                    onClick={() => toggleSymbol(symbol)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold border transition-all cursor-pointer flex items-center gap-1.5
                      ${isSelected 
                        ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30 shadow-xs' 
                        : 'bg-black/40 border-white/[0.05] text-zinc-500 hover:text-zinc-350'}`}
                  >
                    <span>{symbol}</span>
                    {isSelected ? (
                      <Check className="w-3 h-3 text-cyan-400" />
                    ) : (
                      isAgri && <span className="text-[8px] text-zinc-550">(Muted by default)</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* AI Decision inference output log */}
          <div className="bg-black/55 border border-white/[0.06] p-4 rounded-xl space-y-2">
            <span className="text-[9px] font-mono font-black text-yellow-500 uppercase flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> AI Scheduling Intelligence Log:
            </span>
            <ul className="space-y-1.5 text-[10px] font-mono text-zinc-400 list-disc pl-4 leading-normal">
              <li>
                Following Central Banks: <span className="text-cyan-405 font-bold">FOMC (Fed)</span>, <span className="text-indigo-405 font-bold">ECB</span>, <span className="text-pink-405 font-bold">BOE</span>.
              </li>
              <li>
                Monitoring indicators: <span className="text-white font-bold">CPI</span>, <span className="text-white font-bold">NFP</span>, <span className="text-white font-bold">Initial Jobless Claims</span>.
              </li>
              <li>
                {subscribedSymbols.some(s => ['SOYBEANS', 'COTTON', 'LIVESTOCK'].includes(s)) ? (
                  <span className="text-yellow-500 font-bold">Agriculture monitoring active based on manual subscriptions overrides.</span>
                ) : (
                  <span className="text-zinc-500 font-bold">Ignoring low-relevance commodity streams (Agricultural, Soybeans, Livestock) to minimize cognitive load.</span>
                )}
              </li>
              {subscribedSymbols.includes('XAUUSD') && (
                <li>
                  <span className="text-yellow-405 font-bold">Gold-related volatility warning filters applied to family scheduling structures.</span>
                </li>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* 4. NOTIFICATION RULES CONFIGURATION TAB */}
      {activeTab === 'notifications' && (
        <div className="space-y-3.5">
          <span className="text-[9px] font-mono font-black text-[#ff007f] uppercase tracking-wider block">Trader Handshake Delivery Channels</span>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            
            {/* Reminder Toggle */}
            <div className="bg-black/40 border border-white/[0.05] p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-pink-400" />
                <div>
                  <h6 className="text-[11px] font-black text-white font-mono uppercase">In-App Banner</h6>
                  <p className="text-[9px] text-zinc-500 font-mono">Desktop visual warning</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={notifPrefs.reminder} 
                onChange={() => setNotifPrefs({ ...notifPrefs, reminder: !notifPrefs.reminder })}
                className="w-4 h-4 text-[#ff007f] bg-black border-zinc-700 rounded-sm cursor-pointer"
              />
            </div>

            {/* Push notification */}
            <div className="bg-black/40 border border-white/[0.05] p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <div>
                  <h6 className="text-[11px] font-black text-white font-mono uppercase">Push Alerts</h6>
                  <p className="text-[9px] text-zinc-500 font-mono">Active device tracking</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={notifPrefs.push} 
                onChange={() => setNotifPrefs({ ...notifPrefs, push: !notifPrefs.push })}
                className="w-4 h-4 text-[#ff007f] bg-black border-zinc-700 rounded-sm cursor-pointer"
              />
            </div>

            {/* SMS Toggle - PRO limited */}
            <div className="bg-black/40 border border-white/[0.05] p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-yellow-500" />
                <div>
                  <h6 className="text-[11px] font-black text-white font-mono uppercase">SMS Warnings</h6>
                  <p className="text-[9px] text-zinc-500 font-mono">Cellular direct alerts (Pro)</p>
                </div>
              </div>
              {isPro ? (
                <input 
                  type="checkbox" 
                  checked={notifPrefs.sms} 
                  onChange={() => setNotifPrefs({ ...notifPrefs, sms: !notifPrefs.sms })}
                  className="w-4 h-4 text-[#ff007f] bg-black border-zinc-700 rounded-sm cursor-pointer"
                />
              ) : (
                <span className="text-[9px] text-yellow-500 font-mono font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> PRO TIER
                </span>
              )}
            </div>

            {/* Email Alerts */}
            <div className="bg-black/40 border border-white/[0.05] p-3 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-indigo-400" />
                <div>
                  <h6 className="text-[11px] font-black text-white font-mono uppercase">Email Dispatch</h6>
                  <p className="text-[9px] text-zinc-500 font-mono">Secure detailed transmission</p>
                </div>
              </div>
              <input 
                type="checkbox" 
                checked={notifPrefs.email} 
                onChange={() => setNotifPrefs({ ...notifPrefs, email: !notifPrefs.email })}
                className="w-4 h-4 text-[#ff007f] bg-black border-zinc-700 rounded-sm cursor-pointer"
              />
            </div>
          </div>

          {/* SMS / EMAIL inputs */}
          {isPro && (
            <div className="bg-black/55 border border-white/[0.06] p-3.5 rounded-xl space-y-3 shadow-[inset_0_1px_1px_rgba(255,255,255,0.01)] animated-fade-in text-[10px]">
              <span className="text-[9px] font-mono font-black text-cyan-405 uppercase tracking-wider block">Secure Cellular/Email Dispatch Target Settings</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                <div className="space-y-1 font-mono">
                  <label className="text-[8px] text-zinc-400 font-bold uppercase block">Mobile Phone Node</label>
                  <input 
                    type="text" 
                    placeholder="+1 (555) 759-3221" 
                    value={notifPrefs.phoneNumber || ''} 
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, phoneNumber: e.target.value })}
                    className="w-full bg-black/60 border border-white/[0.06] rounded-lg py-1 px-2 text-white focus:outline-none placeholder-zinc-700"
                  />
                </div>
                <div className="space-y-1 font-mono">
                  <label className="text-[8px] text-zinc-400 font-bold uppercase block">Secondary Alert Email</label>
                  <input 
                    type="text" 
                    placeholder="alternate@traders.com" 
                    value={notifPrefs.alternateEmail || ''} 
                    onChange={(e) => setNotifPrefs({ ...notifPrefs, alternateEmail: e.target.value })}
                    className="w-full bg-black/60 border border-white/[0.06] rounded-lg py-1 px-2 text-white focus:outline-none placeholder-zinc-700"
                  />
                </div>
              </div>
              
              {/* Extra professional routing toggles */}
              <div className="space-y-2 pt-2 border-t border-white/[0.04]">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-450 font-bold uppercase">Dynamic Alert Custom API Routing:</span>
                  <input 
                    type="checkbox" 
                    checked={notifPrefs.customAlertRouting} 
                    onChange={() => setNotifPrefs({ ...notifPrefs, customAlertRouting: !notifPrefs.customAlertRouting })}
                    className="w-3.5 h-3.5"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-zinc-450 font-bold uppercase">Corporate Earnings Blackout Warns:</span>
                  <input 
                    type="checkbox" 
                    checked={notifPrefs.earningsBlackoutWarning} 
                    onChange={() => setNotifPrefs({ ...notifPrefs, earningsBlackoutWarning: !notifPrefs.earningsBlackoutWarning })}
                    className="w-3.5 h-3.5"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
