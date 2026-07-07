import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Search, Trash2, Play, User } from 'lucide-react';
import {
  listCatalogEntries,
  applyCatalogEntry,
  removeFromCatalog,
  searchCatalog,
  RiverCatalogEntry,
} from '../river/catalog';

export default function RiverCatalogPanel({ onApplied }: { onApplied?: (entry: RiverCatalogEntry) => void }) {
  const [entries, setEntries] = useState<RiverCatalogEntry[]>([]);
  const [query, setQuery] = useState('');

  const refresh = () => setEntries(query ? searchCatalog(query) : listCatalogEntries());

  useEffect(() => { refresh(); }, [query]);

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen size={18} className="text-[#00D9FF]" />
        <h3 className="text-sm font-black uppercase tracking-wider text-white">The River Catalog</h3>
        <span className="text-xs text-white/30 ml-auto">{entries.length} filed</span>
      </div>
      <p className="text-xs text-white/40 mb-4">
        Community indicators filed here apply to any chart. Bring your Pine from TradingView — help others without paywalls.
      </p>

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search indicators, authors, tags..."
          className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]/40"
        />
      </div>

      {entries.length === 0 ? (
        <p className="text-white/30 text-xs text-center py-8">No indicators filed yet. Compile one in The River and save it for the community.</p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {entries.map((entry) => (
            <motion.div
              key={entry.id}
              layout
              className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg p-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">{entry.name}</p>
                <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                  <User size={10} /> {entry.author} · {entry.bytecodeId}
                </p>
              </div>
              <button
                onClick={() => { applyCatalogEntry(entry.id); onApplied?.(entry); }}
                className="p-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/20 transition-all"
                title="Apply to all charts"
              >
                <Play size={14} />
              </button>
              <button
                onClick={() => { removeFromCatalog(entry.id); refresh(); }}
                className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
                title="Remove from catalog"
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
