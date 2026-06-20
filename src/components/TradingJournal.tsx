import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/FirebaseContext';
import { AnalysisEntry } from '../types';
import { BookOpen, Plus, Trash2, HelpCircle, Save, Info } from 'lucide-react';

export default function TradingJournal() {
  const { 
    analysisEntries, 
    addAnalysisEntry, 
    updateAnalysisEntry, 
    deleteAnalysisEntry 
  } = useAuth();

  const [rows, setRows] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [dateStr, setDateStr] = useState('');

  // Initial Sync from Firestore. If nothing in DB, pre-populate with 3 standard mockup entries.
  useEffect(() => {
    if (analysisEntries && analysisEntries.length > 0) {
      setRows(analysisEntries.map(e => ({
        id: e.id,
        pair: e.pair || '',
        position: e.position ?? 1,
        entry: e.entry ?? 0,
        exitPrice: e.exitPrice ?? 0,
        notes: e.notes || '',
      })));
    } else {
      setRows([
        { id: 'mock1', pair: 'EUR/USD', position: 100000, entry: 1.0820, exitPrice: 1.0855, notes: 'FOMC sentiment sweep, clean logical execution.' },
        { id: 'mock2', pair: 'BTC/USD', position: 2, entry: 64200, exitPrice: 65150, notes: 'Break out of tactical compression channel.' },
        { id: 'mock3', pair: 'GOLD', position: 50, entry: 2340, exitPrice: 2322, notes: 'Double top structure breakdown on higher timeframe.' }
      ]);
    }
  }, [analysisEntries]);

  // Set the current date string on load matching jQuery Keller's journal Title `.toUTCString().slice(0, -13)`
  useEffect(() => {
    const d = new Date();
    setDateStr(d.toUTCString().slice(0, -13));
  }, []);

  // Update a single field in our local state synchronously
  const handleFieldChange = (rowId: string, field: string, value: any) => {
    setRows(prevRows => 
      prevRows.map(row => {
        if (row.id === rowId) {
          return {
            ...row,
            [field]: value
          };
        }
        return row;
      })
    );
  };

  // Run auto-save to Firestore on input blur
  const triggerSave = async (rowId: string, updatedRow: any) => {
    setIsSaving(true);
    try {
      // Sanitizing number inputs
      const pairVal = String(updatedRow.pair || '').toUpperCase();
      const posVal = Number(updatedRow.position ?? 0);
      const entryVal = Number(updatedRow.entry ?? 0);
      const exitVal = Number(updatedRow.exitPrice ?? 0);
      const notesVal = String(updatedRow.notes || '');

      // All entries can be updated in-place inside our context container
      await updateAnalysisEntry(rowId, {
        pair: pairVal,
        entry: entryVal,
        exitPrice: exitVal,
        position: posVal,
        notes: notesVal,
        direction: exitVal >= entryVal ? 'long' : 'short',
        outcome: exitVal >= entryVal ? 'good' : 'bad',
      });
    } catch (err) {
      console.error('Infiltraders sync error:', err);
    } finally {
      // Simulating a real sync delay so user sees the saving indicator state beautifully
      setTimeout(() => {
        setIsSaving(false);
      }, 1000);
    }
  };

  // Add a clean empty starting row
  const addRow = async () => {
    setIsSaving(true);
    try {
      // Add a fresh blank document in Firestore
      await addAnalysisEntry({
        pair: 'GBP/USD',
        direction: 'long',
        timeframe: 'M15',
        entry: 1.2500,
        sl: 0,
        tp: 0,
        rr: 1,
        resultR: 1,
        outcome: 'good',
        emotion: 'Neutral',
        screenshot: '',
        notes: 'Enter comments...',
        position: 10000,
        exitPrice: 1.2550
      });
    } catch (err) {
      console.error('Failed adding trade file record:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 850);
    }
  };

  // Delete a trade file record
  const deleteRow = async (rowId: string) => {
    if (String(rowId).startsWith('mock')) {
      // Optimistically filter out mock rows immediately
      setRows(prev => prev.filter(r => r.id !== rowId));
      return;
    }

    setIsSaving(true);
    try {
      await deleteAnalysisEntry(rowId);
    } catch (err) {
      console.error('Failed deleting trade file record:', err);
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  // Calculate precision and differences for each row
  const computedRows = useMemo(() => {
    return rows.map(row => {
      const entry = Number(row.entry || 0);
      const exit = Number(row.exitPrice || 0);
      const position = Number(row.position || 0);

      // Determine dynamic decimal precision from highest string split size
      const entryStr = String(row.entry || 0);
      const exitStr = String(row.exitPrice || 0);
      const entryDot = entryStr.indexOf('.');
      const exitDot = exitStr.indexOf('.');
      const entryDec = entryDot === -1 ? 2 : entryStr.length - entryDot - 1;
      const exitDec = exitDot === -1 ? 2 : exitStr.length - exitDot - 1;
      const decimals = Math.max(2, entryDec, exitDec);

      const diff = (exit - entry) * (position || 1);
      const pctChange = entry !== 0 ? ((exit - entry) / entry) * 100 : 0;
      const gain = diff >= 0;

      return {
        ...row,
        diff,
        pctChange,
        gain,
        decimals
      };
    });
  }, [rows]);

  // Grand total sum of all diff columns
  const grandTotal = useMemo(() => {
    return computedRows.reduce((acc, curr) => acc + curr.diff, 0);
  }, [computedRows]);

  return (
    <div className="w-full max-w-7xl mx-auto p-4 md:p-8 space-y-6 font-sans text-white text-left">
      {/* Styles Injector to render pure Keller-inspired theme elements */}
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&family=JetBrains+Mono:wght@400;700&display=swap');
        
        .infiltraders-title {
          font-family: 'Lato', sans-serif;
          font-weight: 900;
          letter-spacing: 0.1em;
          color: #ffffff;
        }
        
        .infiltraders-text {
          font-family: 'Lato', sans-serif;
          color: #ffffff;
        }

        .journal-table {
          width: 100%;
          border-collapse: separate;
          border-spacing: 4px;
        }

        .journal-table thead tr th {
          background-color: #515363;
          border: solid 1px #515363;
          font-family: 'Lato', sans-serif;
          font-size: 11px;
          font-weight: bold;
          text-transform: uppercase;
          color: #ffffff;
          padding: 8px 12px;
          border-radius: 2px;
          letter-spacing: 0.05em;
        }

        .journal-table tbody td {
          border: solid 1px #606374;
          background-color: rgba(0, 0, 0, 0.6);
          border-radius: 2px;
          padding: 2px 4px;
          height: 38px;
        }

        .infiltraders-input {
          width: 100%;
          height: 100%;
          background: transparent;
          border: none;
          outline: none;
          color: #ffffff;
          font-family: 'Lato', sans-serif;
          font-size: 12px;
          padding: 4px 8px;
          transition: all 0.2s;
        }

        .infiltraders-input:focus {
          background-color: #515364;
          outline: none;
        }

        .gain-highlight {
          color: #96B28B !important;
          font-weight: bold;
        }

        .loss-highlight {
          color: #CE7734 !important;
          font-weight: bold;
        }

        .pulse-glow-indicator {
          animation: glowPulse 2s infinite ease-in-out;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
      `}} />

      {/* CORE PORTAL DOCK CONTAINER */}
      <div className="bg-black border border-zinc-800 p-6 rounded-3xl shadow-[0_0_30px_rgba(0,0,0,0.8)] relative overflow-hidden">
        
        {/* HEADER BRANDING BANNER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-zinc-900 pb-5 mb-6 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#96B28B] animate-pulse" />
              <span className="text-[10px] uppercase font-black tracking-widest text-[#96B28B] font-mono">
                INFILTRADERS - SYSTEM LOCK
              </span>
            </div>
            <h1 className="text-3xl infiltraders-title font-black uppercase text-white flex items-center gap-3">
              <BookOpen className="text-[#96B28B]" size={28} />
              TRADING JOURNAL
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-400">
              <span id="journal-title" className="font-mono text-[11px] text-zinc-500 uppercase tracking-widest border border-zinc-800 px-2 py-0.5 bg-zinc-950 rounded">
                {dateStr || 'SYNCING UTC TIME...'}
              </span>
              <span>•</span>
              <span className="text-zinc-500 font-mono text-[11px]">LIVE DATA INVENTORY</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* SAVING INDICATOR BADGE */}
            {isSaving ? (
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-zinc-400 border border-zinc-700 px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-zinc-900/50 pulse-glow-indicator">
                <span className="w-2 h-2 rounded-full bg-[#CE7734] animate-ping" />
                SAVING...
              </span>
            ) : (
              <span className="text-[10px] font-mono font-black uppercase tracking-widest text-emerald-400 border border-emerald-950 px-3 py-1.5 rounded-full flex items-center gap-1.5 bg-emerald-950/20">
                <span className="w-1.5 h-1.5 rounded-full bg-[#96B28B]" />
                AUTO-SAVING SYNCED
              </span>
            )}
          </div>
        </div>

        {/* INFORMATIVE INSTRUCTIONS OVERLAY */}
        <div className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-xl flex items-start gap-3 mb-6 text-xs text-zinc-400 leading-relaxed infiltraders-text">
          <Info size={16} className="text-[#96B28B] shrink-0 mt-0.5" />
          <p>
            Welcome to the interactive journal. Click directly inside any cells below to edit Tickers, Position size, Entry, Exit prices, and Comments dynamically. Calculations occur automatically in real-time, matching our high-end consensus model with direct cloud state locks.
          </p>
        </div>

        {/* MAIN SPREADSHEET JOURNAL TABLE */}
        <div className="overflow-x-auto rounded-xl border border-zinc-900 p-2 bg-black">
          <table className="journal-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}></th>
                <th style={{ width: '130px' }}>TICKER / ASSET</th>
                <th style={{ width: '110px' }}>POSITION / SIZE</th>
                <th style={{ width: '110px' }}>ENTRY PRICE</th>
                <th style={{ width: '110px' }}>EXIT PRICE</th>
                <th style={{ width: '140px', textAlign: 'right' }}>DIFF / PNL</th>
                <th style={{ width: '110px', textAlign: 'right' }}>CHANGE %</th>
                <th>COMMENTS / CONTEXT NOTES</th>
                <th style={{ width: '50px', textAlign: 'center' }}></th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-zinc-900/40">
              {computedRows.map((row) => (
                <tr key={row.id} className="group hover:bg-zinc-950/60 transition-all">
                  
                  {/* Dragger Column */}
                  <td className="text-center text-zinc-600 font-mono text-sm select-none" style={{ cursor: 'move' }}>
                    <span className="opacity-40 group-hover:opacity-100 transition-opacity">::</span>
                  </td>

                  {/* Ticker Column */}
                  <td>
                    <input 
                      type="text"
                      value={row.pair}
                      onChange={(e) => handleFieldChange(row.id, 'pair', e.target.value)}
                      onBlur={() => triggerSave(row.id, row)}
                      className="infiltraders-input font-bold tracking-wide uppercase text-white"
                      placeholder="e.g. BTC/USD"
                    />
                  </td>

                  {/* Position Column */}
                  <td>
                    <input 
                      type="text"
                      value={row.position}
                      onChange={(e) => handleFieldChange(row.id, 'position', e.target.value)}
                      onBlur={() => triggerSave(row.id, row)}
                      className="infiltraders-input text-zinc-300 font-mono"
                      placeholder="e.g. 10000"
                    />
                  </td>

                  {/* Entry Column */}
                  <td>
                    <input 
                      type="text"
                      value={row.entry}
                      onChange={(e) => handleFieldChange(row.id, 'entry', e.target.value)}
                      onBlur={() => triggerSave(row.id, row)}
                      className="infiltraders-input text-zinc-300 font-mono"
                      placeholder="e.g. 1.0820"
                    />
                  </td>

                  {/* Exit Column */}
                  <td>
                    <input 
                      type="text"
                      value={row.exitPrice}
                      onChange={(e) => handleFieldChange(row.id, 'exitPrice', e.target.value)}
                      onBlur={() => triggerSave(row.id, row)}
                      className="infiltraders-input text-zinc-300 font-mono"
                      placeholder="e.g. 1.0850"
                    />
                  </td>

                  {/* Diff Column */}
                  <td className="text-right px-3 select-all">
                    <span className={`font-mono text-sm ${row.gain ? 'gain-highlight' : 'loss-highlight'}`}>
                      {row.gain ? '+' : ''}{row.diff.toFixed(row.decimals)}
                    </span>
                  </td>

                  {/* Change Column */}
                  <td className="text-right px-3 select-all">
                    <span className={`font-mono text-sm ${row.gain ? 'gain-highlight' : 'loss-highlight'}`}>
                      {row.gain ? '+' : ''}{row.pctChange.toFixed(2)}%
                    </span>
                  </td>

                  {/* Comments Column */}
                  <td>
                    <input 
                      type="text"
                      value={row.notes}
                      onChange={(e) => handleFieldChange(row.id, 'notes', e.target.value)}
                      onBlur={() => triggerSave(row.id, row)}
                      className="infiltraders-input text-zinc-400 font-sans italic"
                      placeholder="Synthesize logical parameters here..."
                    />
                  </td>

                  {/* Delete Column */}
                  <td className="text-center">
                    <button 
                      onClick={() => deleteRow(row.id)}
                      className="text-zinc-600 hover:text-[#CE7734] transition-all p-1.5 rounded hover:bg-zinc-950 group/btn"
                      title="DELETE RECORD"
                    >
                      <Trash2 size={14} className="opacity-40 group-hover:opacity-100 group-hover/btn:scale-110 transition-all" />
                    </button>
                  </td>

                </tr>
              ))}
            </tbody>

            {/* GRAND TOTALS FOOTER SECTION */}
            <tfoot>
              <tr>
                <td colSpan={5} className="text-right py-4 px-4 font-mono text-[11px] text-zinc-500 uppercase tracking-widest bg-zinc-950/20 border-t border-zinc-900 rounded-bl-xl">
                  GLOBAL GRAND TOTAL DEVIATION :
                </td>
                <td className="text-right py-4 px-3 bg-zinc-950/30 border-t border-zinc-900">
                  <span className={`font-mono text-base font-black tracking-wide ${grandTotal >= 0 ? 'gain-highlight' : 'loss-highlight'}`}>
                    {grandTotal >= 0 ? '+' : ''}{grandTotal.toFixed(2)}
                  </span>
                </td>
                <td colSpan={3} className="bg-zinc-950/20 border-t border-zinc-900 rounded-br-xl"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* JOURNAL ACTIONS AREA */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-5 gap-3">
          <div className="flex items-center gap-2">
            <button 
              id="add_row"
              onClick={addRow}
              className="bg-white hover:bg-zinc-200 text-black border border-zinc-700 rounded-md px-4 py-2 font-mono text-xs font-bold tracking-wider uppercase active:scale-95 transition-all flex items-center gap-2 shadow-[0_2px_10px_rgba(255,255,255,0.05)] cursor-pointer"
            >
              <Plus size={14} strokeWidth={2.5} />
              + ADD NEW TRADE ROW
            </button>
          </div>

          <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 bg-zinc-950 border border-zinc-900 px-3 py-1 rounded">
            <span>KEYBOARD TAB AT WORK</span>
            <span>•</span>
            <span className="text-[#96B28B]">CELL AUTOSAVE ACTIVE</span>
          </div>
        </div>

      </div>
    </div>
  );
}
