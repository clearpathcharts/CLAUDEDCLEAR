import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { FolderOpen, Search, Trash2, Play, User, Globe, Lock, RefreshCw } from 'lucide-react';
import {
  listCatalogEntries,
  applyCatalogEntry,
  applyPineRecord,
  removeFromCatalog,
  searchCatalog,
  fetchPublicCatalog,
  bumpPublicApply,
  type RiverCatalogEntry,
  type PublicCatalogEntry,
} from '../river/catalog';
import {
  fetchPrivateVault,
  removeFromPrivateVault,
  bumpPrivateApply,
  type PrivateVaultEntry,
} from '../river/storage/privateCatalog';

type CatalogTab = 'local' | 'public' | 'mine';

export default function RiverCatalogPanel({
  onApplied,
  refreshToken = 0,
}: {
  onApplied?: (name: string) => void;
  refreshToken?: number;
}) {
  const [tab, setTab] = useState<CatalogTab>('local');
  const [localEntries, setLocalEntries] = useState<RiverCatalogEntry[]>([]);
  const [publicEntries, setPublicEntries] = useState<PublicCatalogEntry[]>([]);
  const [mineEntries, setMineEntries] = useState<PrivateVaultEntry[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshLocal = useCallback(() => {
    setLocalEntries(query ? searchCatalog(query) : listCatalogEntries());
  }, [query]);

  const refreshPublic = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const entries = await fetchPublicCatalog();
      const q = query.toLowerCase().trim();
      setPublicEntries(
        q
          ? entries.filter(
              (e) =>
                e.name.toLowerCase().includes(q) ||
                e.author.toLowerCase().includes(q) ||
                e.tags.some((t) => t.toLowerCase().includes(q)),
            )
          : entries,
      );
    } catch (e: any) {
      setError(e?.message || 'Public catalog unavailable.');
      setPublicEntries([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const refreshMine = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const entries = await fetchPrivateVault();
      const q = query.toLowerCase().trim();
      setMineEntries(
        q
          ? entries.filter(
              (e) =>
                e.name.toLowerCase().includes(q) ||
                e.description.toLowerCase().includes(q) ||
                e.tags.some((t) => t.toLowerCase().includes(q)),
            )
          : entries,
      );
    } catch (e: any) {
      setError(e?.message || 'Private vault unavailable.');
      setMineEntries([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const refresh = useCallback(() => {
    if (tab === 'local') refreshLocal();
    else if (tab === 'public') refreshPublic();
    else refreshMine();
  }, [tab, refreshLocal, refreshPublic, refreshMine]);

  useEffect(() => {
    refresh();
  }, [tab, query, refreshToken, refresh]);

  const applyLocal = (entry: RiverCatalogEntry) => {
    if (applyCatalogEntry(entry.id, entry.defaultInputs)) {
      onApplied?.(entry.name);
    }
  };

  const applyRemote = async (entry: PublicCatalogEntry | PrivateVaultEntry, scope: 'public' | 'mine') => {
    const ok = applyPineRecord({ name: entry.name, pineSource: entry.pineSource });
    if (!ok) {
      setError(`"${entry.name}" did not compile on this device.`);
      return;
    }
    try {
      if (scope === 'public') await bumpPublicApply(entry.id);
      else await bumpPrivateApply(entry.id);
    } catch { /* non-fatal */ }
    onApplied?.(entry.name);
  };

  const count =
    tab === 'local' ? localEntries.length : tab === 'public' ? publicEntries.length : mineEntries.length;

  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <FolderOpen size={18} className="text-[#00D9FF]" />
        <h3 className="text-sm font-black uppercase tracking-wider text-white">INDACREATOR Catalog</h3>
        <span className="text-xs text-white/30 ml-auto">{count} filed</span>
        <button onClick={refresh} className="p-1.5 text-white/30 hover:text-[#00D9FF] transition-colors" title="Refresh">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-2 mb-4">
        {([
          ['local', 'Local', FolderOpen],
          ['public', 'Public', Globe],
          ['mine', 'Mine', Lock],
        ] as const).map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs uppercase tracking-wider transition-all ${
              tab === id
                ? 'bg-[#00D9FF]/15 border border-[#00D9FF]/40 text-[#00D9FF]'
                : 'bg-black/30 border border-white/5 text-white/40 hover:text-white/70'
            }`}
          >
            <Icon size={12} /> {label}
          </button>
        ))}
      </div>

      <p className="text-xs text-white/40 mb-4">
        {tab === 'local' && 'Saved on this browser — applies via the Pine interpreter on all charts.'}
        {tab === 'public' && 'Community scripts from the ClearPath public catalog API.'}
        {tab === 'mine' && 'Your private vault — sign in with a private account to save raw Pine securely.'}
      </p>

      {error && <p className="text-xs text-red-400/80 mb-3">{error}</p>}

      <div className="relative mb-4">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search indicators, authors, tags..."
          className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-[#00D9FF]/40"
        />
      </div>

      {tab === 'local' && localEntries.length === 0 && (
        <p className="text-white/30 text-xs text-center py-8">No local indicators yet. Compile one and save it below.</p>
      )}
      {tab === 'public' && publicEntries.length === 0 && !loading && (
        <p className="text-white/30 text-xs text-center py-8">Public catalog empty — run npm run river:seed-public on the server.</p>
      )}
      {tab === 'mine' && mineEntries.length === 0 && !loading && (
        <p className="text-white/30 text-xs text-center py-8">Sign in and save scripts to your private vault.</p>
      )}

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {tab === 'local' &&
          localEntries.map((entry) => (
            <CatalogRow
              key={entry.id}
              name={entry.name}
              sub={`${entry.author} · ${entry.fingerprint}`}
              onApply={() => applyLocal(entry)}
              onRemove={() => {
                removeFromCatalog(entry.id);
                refreshLocal();
              }}
            />
          ))}

        {tab === 'public' &&
          publicEntries.map((entry) => (
            <CatalogRow
              key={entry.id}
              name={entry.name}
              sub={`${entry.author} · ${entry.applyCount} applies`}
              onApply={() => applyRemote(entry, 'public')}
            />
          ))}

        {tab === 'mine' &&
          mineEntries.map((entry) => (
            <CatalogRow
              key={entry.id}
              name={entry.name}
              sub={`Private · ${entry.applyCount} applies`}
              onApply={() => applyRemote(entry, 'mine')}
              onRemove={async () => {
                await removeFromPrivateVault(entry.id);
                refreshMine();
              }}
            />
          ))}
      </div>
    </div>
  );
}

function CatalogRow({
  name,
  sub,
  onApply,
  onRemove,
}: {
  name: string;
  sub: string;
  onApply: () => void;
  onRemove?: () => void;
}) {
  return (
    <motion.div layout className="flex items-center gap-3 bg-black/40 border border-white/5 rounded-lg p-3">
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate">{name}</p>
        <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
          <User size={10} /> {sub}
        </p>
      </div>
      <button
        onClick={onApply}
        className="p-2 bg-[#FFD700]/10 border border-[#FFD700]/30 text-[#FFD700] rounded-lg hover:bg-[#FFD700]/20 transition-all"
        title="Apply to all charts"
      >
        <Play size={14} />
      </button>
      {onRemove && (
        <button
          onClick={onRemove}
          className="p-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg hover:bg-red-500/20 transition-all"
          title="Remove"
        >
          <Trash2 size={14} />
        </button>
      )}
    </motion.div>
  );
}
