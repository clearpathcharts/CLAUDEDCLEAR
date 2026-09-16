import React, { useEffect, useMemo, useState } from "react";
import { advancedProfiles, type AdvancedProfileId } from "../lib/advanced/profiles";
import {
  formatFormingBriefForChat,
  getActiveFormingBrief,
  getAllPatternScans,
  subscribeFormingBrief,
  subscribePatternScan,
} from "../patterns";
import { DEFAULT_SENTINEL_SOURCES } from "./data/sentinelSources";
import { EDUCATIONAL_FEEDS, LISTEN_CONCEPT_HINTS } from "./data/educationalFeeds";
import { LITERACY_TRACKS } from "./data/literacyCurriculum";
import type { useLiteracyStore } from "./hooks/useLiteracyStore";
import { checkWatchedPage, fetchRssFeed, scoreMentorTrust, truthSearch } from "./services/literacyApi";
import { FieldLabel, PanelShell, TextArea, TextButton, TextInput } from "./ui";
import type { MediaFeedItem } from "./types";

type StoreApi = ReturnType<typeof useLiteracyStore>;

export function MorningBriefPanel({ api, onOpen }: { api: StoreApi; onOpen: (id: string) => void }) {
  const { store } = api;
  const changes = Object.values(store.sentinel).filter((s) => s.changed).slice(0, 5);
  const openLessons = LITERACY_TRACKS.flatMap((t) =>
    t.lessons.filter((l) => !store.progress.passedLessonIds.includes(l.id)).slice(0, 1).map((l) => ({ track: t.title, lesson: l }))
  ).slice(0, 3);
  const expiredPins = store.pins.filter((p) => p.expiresAt < Date.now() && !p.verified).slice(0, 4);
  const recentVault = store.vault.slice(0, 4);

  return (
    <PanelShell
      title="Personal Morning Brief"
      subtitle="One study composition: vault, sentinel diffs, open lessons, and decaying pins. Learning only."
      accent="#FFD700"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <BriefCard title="Source Sentinel diffs" empty="No page changes since last check.">
          {changes.map((c) => (
            <li key={c.sourceId} className="text-sm text-white/80">
              <button type="button" className="text-left hover:text-[#00E5FF]" onClick={() => onOpen("sentinel")}>
                <span className="text-[#FFD700] font-bold">{c.title}</span>
                <span className="block text-xs text-white/45 line-clamp-2">{c.excerpt}</span>
              </button>
            </li>
          ))}
        </BriefCard>
        <BriefCard title="Open literacy lessons" empty="All current lessons complete.">
          {openLessons.map(({ track, lesson }) => (
            <li key={lesson.id} className="text-sm">
              <button type="button" className="text-left hover:text-[#00E5FF]" onClick={() => onOpen("lms")}>
                <span className="font-bold text-white/90">{lesson.title}</span>
                <span className="block text-xs text-white/45">{track} · {lesson.minutes}m</span>
              </button>
            </li>
          ))}
        </BriefCard>
        <BriefCard title="Recent vault" empty="Vault is empty — archive a note.">
          {recentVault.map((v) => (
            <li key={v.id} className="text-sm text-white/80">
              <button type="button" className="hover:text-[#00E5FF]" onClick={() => onOpen("vault")}>
                {v.title}
              </button>
            </li>
          ))}
        </BriefCard>
        <BriefCard title="Pins needing re-verify" empty="No decaying pins.">
          {expiredPins.map((p) => (
            <li key={p.id} className="text-sm text-white/80">
              <button type="button" className="hover:text-[#FF1493]" onClick={() => onOpen("pins")}>
                {p.title}
              </button>
            </li>
          ))}
        </BriefCard>
        <BriefCard title="Appealing Additions" empty="">
          <li className="text-sm text-white/80">
            <button type="button" className="text-left hover:text-[#FFD700]" onClick={() => onOpen("appealing")}>
              <span className="font-bold text-white/90">Open sandboxes &amp; discovery shelves</span>
              <span className="block text-xs text-white/45">
                Budget notebook, certificates, self-hosted tools, academic research — literacy only.
              </span>
            </button>
          </li>
        </BriefCard>
      </div>
    </PanelShell>
  );
}

function BriefCard({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children: React.ReactNode;
}) {
  const items = React.Children.toArray(children);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
      <h3 className="text-[10px] uppercase tracking-[0.2em] text-white/45 font-black mb-2">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-white/35">{empty}</p>
      ) : (
        <ul className="space-y-2">{children}</ul>
      )}
    </div>
  );
}

export function ThesisVaultPanel({ api }: { api: StoreApi }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [kind, setKind] = useState<"note" | "lesson" | "podcast" | "mentor" | "chart" | "other">("note");
  const [tags, setTags] = useState("");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return api.store.vault;
    return api.store.vault.filter(
      (v) =>
        v.title.toLowerCase().includes(needle) ||
        v.body.toLowerCase().includes(needle) ||
        v.tags.some((t) => t.includes(needle))
    );
  }, [api.store.vault, q]);

  return (
    <PanelShell
      title="Thesis Vault"
      subtitle="Private archive of charts, notes, lessons, podcast clips, and mentor Q&A you studied."
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <div className="space-y-2">
          <FieldLabel>Title</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="What did you study?" />
          <FieldLabel>Kind</FieldLabel>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
            className="w-full rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm"
          >
            {["note", "lesson", "podcast", "mentor", "chart", "other"].map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
          <FieldLabel>Tags (comma)</FieldLabel>
          <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="candles, structure" />
          <FieldLabel>Body</FieldLabel>
          <TextArea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Evidence, quotes, observations…" />
          <TextButton
            onClick={() => {
              if (!title.trim() || !body.trim()) return;
              api.addVaultItem({
                title: title.trim(),
                body: body.trim(),
                kind,
                tags: tags
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean),
              });
              setTitle("");
              setBody("");
              setTags("");
            }}
          >
            Archive to vault
          </TextButton>
        </div>
        <div>
          <FieldLabel>Search vault</FieldLabel>
          <TextInput value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter archived study…" className="mb-3" />
          <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {filtered.map((v) => (
              <li key={v.id} className="rounded-xl border border-white/10 p-3 bg-white/[0.02]">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm text-[#00E5FF]">{v.title}</strong>
                  <span className="text-[10px] uppercase text-white/35">{v.kind}</span>
                </div>
                <p className="text-xs text-white/65 mt-1 whitespace-pre-wrap line-clamp-4">{v.body}</p>
                {v.tags.length > 0 && (
                  <p className="text-[10px] text-white/35 mt-2">{v.tags.join(" · ")}</p>
                )}
              </li>
            ))}
            {filtered.length === 0 && <p className="text-xs text-white/35">No vault items yet.</p>}
          </ul>
        </div>
      </div>
    </PanelShell>
  );
}

export function ConceptWikiPanel({ api }: { api: StoreApi }) {
  const [selectedId, setSelectedId] = useState(api.store.wiki[0]?.id || "");
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [body, setBody] = useState("");
  const selected = api.store.wiki.find((w) => w.id === selectedId) || api.store.wiki[0];

  useEffect(() => {
    if (selected) {
      setTitle(selected.title);
      setSummary(selected.summary);
      setBody(selected.body);
      setSelectedId(selected.id);
    }
  }, [selected?.id]);

  return (
    <PanelShell
      title="Concept Wiki"
      subtitle="Interlinked personal literacy graph: indicator → pattern → psychology → glossary."
      accent="#A78BFA"
    >
      <div className="grid gap-4 lg:grid-cols-[14rem_1fr]">
        <ul className="space-y-1 max-h-[28rem] overflow-y-auto">
          {api.store.wiki.map((w) => (
            <li key={w.id}>
              <button
                type="button"
                onClick={() => setSelectedId(w.id)}
                className={`w-full text-left rounded-lg px-2 py-2 text-xs border ${
                  w.id === selectedId
                    ? "border-[#A78BFA] bg-[#A78BFA]/15 text-white"
                    : "border-transparent text-white/60 hover:bg-white/5"
                }`}
              >
                {w.title}
              </button>
            </li>
          ))}
        </ul>
        {selected && (
          <div className="space-y-2">
            <FieldLabel>Title</FieldLabel>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
            <FieldLabel>Summary</FieldLabel>
            <TextInput value={summary} onChange={(e) => setSummary(e.target.value)} />
            <FieldLabel>Body</FieldLabel>
            <TextArea rows={8} value={body} onChange={(e) => setBody(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <TextButton
                tone="pink"
                onClick={() =>
                  api.upsertWiki({
                    ...selected,
                    title: title.trim() || selected.title,
                    summary: summary.trim(),
                    body: body.trim(),
                  })
                }
              >
                Save node
              </TextButton>
              <TextButton
                tone="muted"
                onClick={() => {
                  const id = `wiki_${Date.now().toString(36)}`;
                  api.upsertWiki({
                    id,
                    title: "New concept",
                    summary: "Short definition",
                    body: "Expand this literacy node.",
                    links: selected ? [selected.id] : [],
                    tags: ["custom"],
                  });
                  setSelectedId(id);
                }}
              >
                Add linked node
              </TextButton>
            </div>
            <div className="pt-2">
              <FieldLabel>Links</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {selected.links.map((lid) => {
                  const n = api.store.wiki.find((w) => w.id === lid);
                  return (
                    <button
                      key={lid}
                      type="button"
                      onClick={() => setSelectedId(lid)}
                      className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-[#A78BFA]/40 text-[#A78BFA]"
                    >
                      {n?.title || lid}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </PanelShell>
  );
}

export function SourceSentinelPanel({ api }: { api: StoreApi }) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [customUrl, setCustomUrl] = useState("");
  const [customLabel, setCustomLabel] = useState("");

  const runCheck = async (sourceId: string, url: string, label: string) => {
    setBusyId(sourceId);
    setError(null);
    try {
      const result = await checkWatchedPage(url);
      const prev = api.store.sentinel[sourceId];
      const changed = Boolean(prev && prev.hash && prev.hash !== result.hash);
      api.setSentinelSnapshot({
        sourceId,
        url,
        hash: result.hash,
        title: result.title || label,
        excerpt: result.excerpt,
        checkedAt: result.fetchedAt,
        changed,
        previousHash: prev?.hash,
      });
      if (changed) {
        api.addVaultItem({
          title: `Sentinel change: ${label}`,
          body: `${result.title}\n\n${result.excerpt}\n\nSource: ${url}`,
          kind: "other",
          tags: ["sentinel", "diff"],
          sourceUrl: url,
        });
      }
    } catch (e: any) {
      setError(e?.message || "Check failed");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <PanelShell
      title="Source Sentinel"
      subtitle="Watch Fed / SEC / Treasury (and other public pages) — alert only when page text actually changes. Study diffs, never trade signals."
      accent="#FF6A00"
    >
      {error && <p className="text-xs text-[#FF1493] mb-3">{error}</p>}
      <ul className="space-y-2 mb-4">
        {DEFAULT_SENTINEL_SOURCES.map((s) => {
          const snap = api.store.sentinel[s.id];
          return (
            <li key={s.id} className="rounded-xl border border-white/10 p-3 flex flex-col md:flex-row md:items-center gap-2 justify-between">
              <div className="min-w-0">
                <div className="text-sm font-bold text-white/90">{s.label}</div>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-[10px] text-[#00E5FF]/70 break-all">
                  {s.url}
                </a>
                {snap && (
                  <p className="text-xs text-white/45 mt-1">
                    Last check {new Date(snap.checkedAt).toLocaleString()}
                    {snap.changed ? " · CHANGE DETECTED" : " · unchanged"}
                  </p>
                )}
                {snap?.excerpt && <p className="text-xs text-white/55 mt-1 line-clamp-2">{snap.excerpt}</p>}
              </div>
              <TextButton tone="gold" disabled={busyId === s.id} onClick={() => runCheck(s.id, s.url, s.label)}>
                {busyId === s.id ? "Checking…" : "Check now"}
              </TextButton>
            </li>
          );
        })}
      </ul>
      <div className="rounded-xl border border-dashed border-white/15 p-3 space-y-2">
        <FieldLabel>Custom public URL</FieldLabel>
        <TextInput value={customLabel} onChange={(e) => setCustomLabel(e.target.value)} placeholder="Label" />
        <TextInput value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} placeholder="https://…" />
        <TextButton
          disabled={!customUrl.trim()}
          onClick={() =>
            runCheck(
              `custom_${btoa(customUrl).replace(/[^a-z0-9]/gi, "").slice(0, 24)}`,
              customUrl.trim(),
              customLabel.trim() || customUrl.trim()
            )
          }
        >
          Watch custom page
        </TextButton>
      </div>
    </PanelShell>
  );
}

export function AdaptiveLmsPanel({
  api,
  onProfileChange,
}: {
  api: StoreApi;
  onProfileChange?: (id: string) => void;
}) {
  const preferred =
    api.store.progress.preferredNeuroProfileId ||
    (typeof localStorage !== "undefined"
      ? localStorage.getItem("clearpath_current_profile_id") || "calm_focus"
      : "calm_focus");
  const profile = (advancedProfiles as any)[preferred] || advancedProfiles.calm_focus;

  return (
    <PanelShell
      title="Adaptive Neuro LMS"
      subtitle="Lessons unlock concept wiki nodes and reshape the desk via neuro profiles. Knowledge before conclusions."
      accent={profile.borderA}
    >
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <FieldLabel>Study profile</FieldLabel>
        <select
          value={preferred}
          onChange={(e) => {
            const id = e.target.value;
            api.setPreferredNeuro(id);
            onProfileChange?.(id);
            try {
              localStorage.setItem("clearpath_current_profile_id", id);
            } catch {
              /* ignore */
            }
          }}
          className="rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm"
        >
          {(Object.keys(advancedProfiles) as AdvancedProfileId[]).map((id) => (
            <option key={id} value={id}>
              {advancedProfiles[id].name}
            </option>
          ))}
        </select>
        <span className="text-xs text-white/45">Active: {profile.name}</span>
      </div>
      <div className="space-y-4">
        {LITERACY_TRACKS.map((track) => (
          <div key={track.id} className="rounded-xl border border-white/10 p-3">
            <h3 className="font-bold text-white/90" style={{ fontFamily: "'Cinzel', serif" }}>
              {track.title}
            </h3>
            <p className="text-xs text-white/50 mb-3">{track.summary}</p>
            <ul className="space-y-2">
              {track.lessons.map((lesson, idx) => {
                const prev = track.lessons[idx - 1];
                const unlocked = idx === 0 || (prev && api.store.progress.passedLessonIds.includes(prev.id));
                const passed = api.store.progress.passedLessonIds.includes(lesson.id);
                return (
                  <li
                    key={lesson.id}
                    className={`rounded-lg p-3 border ${
                      passed
                        ? "border-[#00F5D4]/40 bg-[#00F5D4]/5"
                        : unlocked
                          ? "border-white/15 bg-white/[0.02]"
                          : "border-white/5 opacity-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <strong className="text-sm">{lesson.title}</strong>
                      <span className="text-[10px] uppercase text-white/40">{lesson.minutes} min</span>
                    </div>
                    <p className="text-xs text-white/65 mt-1">{lesson.body}</p>
                    <p className="text-[10px] text-[#00E5FF]/80 mt-2">Neuro hint: {lesson.neuroHint}</p>
                    <div className="mt-2 flex gap-2">
                      <TextButton
                        disabled={!unlocked || passed}
                        onClick={() => {
                          api.markLessonPassed(lesson.id);
                          for (const wid of lesson.unlocksWikiIds) {
                            const node = api.store.wiki.find((w) => w.id === wid);
                            if (node) {
                              api.addVaultItem({
                                title: `Lesson complete → ${node.title}`,
                                body: node.summary,
                                kind: "lesson",
                                tags: ["lms", ...node.tags],
                              });
                            }
                          }
                        }}
                      >
                        {passed ? "Completed" : unlocked ? "Mark complete" : "Locked"}
                      </TextButton>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </PanelShell>
  );
}

export function MediaPantryPanel({ api }: { api: StoreApi }) {
  const [items, setItems] = useState<MediaFeedItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [neuroRead, setNeuroRead] = useState<"default" | "low_stim" | "dyslexia">("default");

  const load = async () => {
    setBusy(true);
    setError(null);
    try {
      const custom = api.store.pantryFeedUrls.length
        ? api.store.pantryFeedUrls.map((url, i) => ({ id: `custom_${i}`, label: `Custom ${i + 1}`, url, topics: [] as string[] }))
        : [];
      const feeds = [...EDUCATIONAL_FEEDS, ...custom];
      const collected: MediaFeedItem[] = [];
      for (const feed of feeds) {
        try {
          const rows = await fetchRssFeed(feed.url);
          for (const r of rows.slice(0, 8)) {
            collected.push({
              id: `${feed.id}_${r.id}`,
              title: r.text,
              link: r.link,
              description: r.description,
              timestamp: r.timestamp,
              feedLabel: feed.label,
            });
          }
        } catch {
          /* skip broken feed */
        }
      }
      collected.sort((a, b) => b.timestamp - a.timestamp);
      setItems(collected);
    } catch (e: any) {
      setError(e?.message || "Failed to load pantry");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const textClass =
    neuroRead === "dyslexia"
      ? "tracking-wide leading-7 text-[15px]"
      : neuroRead === "low_stim"
        ? "text-white/70 leading-6"
        : "text-white/85";

  return (
    <PanelShell
      title="Y.W.C. Media Pantry"
      subtitle="User-owned education RSS inbox with neuro reading modes and topic digests."
      accent="#FF6A00"
    >
      <div className="flex flex-wrap gap-2 mb-3 items-end">
        <div>
          <FieldLabel>Reading mode</FieldLabel>
          <select
            value={neuroRead}
            onChange={(e) => setNeuroRead(e.target.value as typeof neuroRead)}
            className="rounded-xl bg-black/50 border border-white/15 px-3 py-2 text-sm"
          >
            <option value="default">Default</option>
            <option value="low_stim">Low stim</option>
            <option value="dyslexia">Reading support</option>
          </select>
        </div>
        <TextButton onClick={() => void load()} disabled={busy}>
          {busy ? "Refreshing…" : "Refresh pantry"}
        </TextButton>
        <TextButton
          tone="muted"
          onClick={() => {
            const url = prompt("Add education RSS URL");
            if (!url) return;
            api.setPantryFeeds([...api.store.pantryFeedUrls, url.trim()]);
            void load();
          }}
        >
          Add feed URL
        </TextButton>
      </div>
      {error && <p className="text-xs text-[#FF1493] mb-2">{error}</p>}
      <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
        {items.map((item) => (
          <li key={item.id} className="rounded-xl border border-white/10 p-3">
            <div className="text-[10px] uppercase tracking-wider text-[#FF6A00]/80">{item.feedLabel}</div>
            <a
              href={item.link || "#"}
              target="_blank"
              rel="noreferrer"
              className={`block font-bold mt-1 hover:text-[#00E5FF] ${textClass}`}
            >
              {item.title}
            </a>
            {item.description && <p className={`text-xs mt-1 ${textClass} opacity-80 line-clamp-3`}>{item.description}</p>}
            <div className="mt-2">
              <TextButton
                tone="muted"
                onClick={() =>
                  api.addVaultItem({
                    title: item.title,
                    body: item.description || item.link || item.title,
                    kind: "other",
                    tags: ["pantry", item.feedLabel.toLowerCase()],
                    sourceUrl: item.link,
                  })
                }
              >
                Archive digest
              </TextButton>
            </div>
          </li>
        ))}
        {!busy && items.length === 0 && <p className="text-xs text-white/35">No feed items loaded.</p>}
      </ul>
    </PanelShell>
  );
}

export function ListenLearnPanel({ api }: { api: StoreApi }) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [audioUrl, setAudioUrl] = useState("");

  const inferConcepts = (text: string): string[] => {
    const lower = text.toLowerCase();
    const ids = new Set<string>();
    for (const [kw, concepts] of Object.entries(LISTEN_CONCEPT_HINTS)) {
      if (lower.includes(kw)) concepts.forEach((c) => ids.add(c));
    }
    if (ids.size === 0) ids.add("wiki_psychology");
    return Array.from(ids);
  };

  return (
    <PanelShell
      title="Listen → Learn"
      subtitle="Turn an audio clip or episode note into glossary cards and encyclopedia concepts."
      accent="#22D3EE"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Clip / episode title</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
          <FieldLabel>Audio URL (optional)</FieldLabel>
          <TextInput value={audioUrl} onChange={(e) => setAudioUrl(e.target.value)} placeholder="https://…" />
          <FieldLabel>What you heard (notes)</FieldLabel>
          <TextArea rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Key phrases, definitions, questions…" />
          <TextButton
            onClick={() => {
              if (!title.trim() || !notes.trim()) return;
              const concepts = inferConcepts(`${title} ${notes}`);
              api.addListenItem({
                title: title.trim(),
                audioUrl: audioUrl.trim() || undefined,
                notes: notes.trim(),
                concepts,
              });
              api.addVaultItem({
                title: `Listen: ${title.trim()}`,
                body: notes.trim(),
                kind: "podcast",
                tags: ["listen", ...concepts],
                sourceUrl: audioUrl.trim() || undefined,
              });
              setTitle("");
              setNotes("");
              setAudioUrl("");
            }}
          >
            Map to concepts
          </TextButton>
        </div>
        <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
          {api.store.listenQueue.map((item) => (
            <li key={item.id} className="rounded-xl border border-white/10 p-3">
              <strong className="text-sm text-[#22D3EE]">{item.title}</strong>
              <p className="text-xs text-white/60 mt-1 whitespace-pre-wrap line-clamp-4">{item.notes}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {item.concepts.map((cid) => {
                  const node = api.store.wiki.find((w) => w.id === cid);
                  return (
                    <span key={cid} className="text-[10px] px-2 py-1 rounded-full border border-[#22D3EE]/35 text-[#22D3EE]">
                      {node?.title || cid}
                    </span>
                  );
                })}
              </div>
            </li>
          ))}
          {api.store.listenQueue.length === 0 && <p className="text-xs text-white/35">No listen cards yet.</p>}
        </ul>
      </div>
    </PanelShell>
  );
}

export function TruthSearchPanel({ api }: { api: StoreApi }) {
  const [query, setQuery] = useState("");
  const [symbol, setSymbol] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hits, setHits] = useState<
    Array<{ id: string; title: string; snippet: string; source: string; score: number }>
  >([]);
  const [marketNote, setMarketNote] = useState<string | undefined>();

  const run = async () => {
    if (!query.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await truthSearch({
        query: query.trim(),
        vault: api.store.vault.map((v) => ({ id: v.id, title: v.title, body: v.body, tags: v.tags })),
        wiki: api.store.wiki.map((w) => ({
          id: w.id,
          title: w.title,
          summary: w.summary,
          body: w.body,
          tags: w.tags,
        })),
        symbol: symbol.trim() || undefined,
      });
      setHits(result.hits);
      setMarketNote(result.marketNote);
    } catch (e: any) {
      setError(e?.message || "Search failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell
      title="Truth Search"
      subtitle="Search your vault + concept wiki, optionally grounded with verified live market data. No agency corpus scraping here."
    >
      <div className="flex flex-col md:flex-row gap-2 mb-3">
        <TextInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="What are you verifying?" />
        <TextInput
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          placeholder="Optional symbol for live quote"
          className="md:max-w-[12rem]"
        />
        <TextButton onClick={() => void run()} disabled={busy}>
          {busy ? "Searching…" : "Search"}
        </TextButton>
      </div>
      {error && <p className="text-xs text-[#FF1493] mb-2">{error}</p>}
      {marketNote && <p className="text-xs text-[#FFD700]/80 mb-2">{marketNote}</p>}
      <ul className="space-y-2">
        {hits.map((h) => (
          <li key={`${h.source}_${h.id}`} className="rounded-xl border border-white/10 p-3">
            <div className="flex justify-between gap-2">
              <strong className="text-sm">{h.title}</strong>
              <span className="text-[10px] uppercase text-white/40">
                {h.source} · {Math.round(h.score * 100)}%
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1">{h.snippet}</p>
          </li>
        ))}
        {!busy && hits.length === 0 && <p className="text-xs text-white/35">Run a search against your personal knowledge.</p>}
      </ul>
    </PanelShell>
  );
}

export function MentorTrustPanel({ api }: { api: StoreApi }) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [last, setLast] = useState<{ score: number; reasons: string[] } | null>(null);

  const run = async () => {
    if (!question.trim() || !answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const result = await scoreMentorTrust({
        question: question.trim(),
        answer: answer.trim(),
        vaultNotes: api.store.vault.slice(0, 40).map((v) => `${v.title}\n${v.body}`),
      });
      setLast(result);
      api.addTrust({
        question: question.trim(),
        answer: answer.trim(),
        score: result.score,
        reasons: result.reasons,
      });
    } catch (e: any) {
      setError(e?.message || "Scoring failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelShell
      title="Mentor Trust Score"
      subtitle="Grade tutor answers against your vault and uncertainty hygiene. Rewards receipts; penalizes advice language."
      accent="#FF1493"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Question</FieldLabel>
          <TextArea rows={3} value={question} onChange={(e) => setQuestion(e.target.value)} />
          <FieldLabel>Tutor answer</FieldLabel>
          <TextArea rows={6} value={answer} onChange={(e) => setAnswer(e.target.value)} />
          <TextButton tone="pink" onClick={() => void run()} disabled={busy}>
            {busy ? "Scoring…" : "Score answer"}
          </TextButton>
          {error && <p className="text-xs text-[#FF1493]">{error}</p>}
          {last && (
            <div className="rounded-xl border border-[#FF1493]/30 p-3 mt-2">
              <div className="text-2xl font-black text-[#FF1493]" style={{ fontFamily: "'Cinzel', serif" }}>
                {last.score}/100
              </div>
              <ul className="mt-2 space-y-1">
                {last.reasons.map((r) => (
                  <li key={r} className="text-xs text-white/65">
                    • {r}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
          {api.store.trust.map((t) => (
            <li key={t.id} className="rounded-xl border border-white/10 p-3">
              <div className="flex justify-between gap-2">
                <strong className="text-sm line-clamp-1">{t.question}</strong>
                <span className="text-[#FF1493] font-black text-sm">{t.score}</span>
              </div>
              <p className="text-xs text-white/50 mt-1 line-clamp-3">{t.answer}</p>
            </li>
          ))}
          {api.store.trust.length === 0 && <p className="text-xs text-white/35">No trust scores yet.</p>}
        </ul>
      </div>
    </PanelShell>
  );
}

export function CognitiveCoachPanel({ api }: { api: StoreApi }) {
  const [stim, setStim] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!startedAt) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 60000)), 1000);
    return () => clearInterval(t);
  }, [startedAt]);

  const cooldown =
    stim >= 4 ? "Take a 10-minute low-stim break before another session." : stim >= 3 ? "Optional 5-minute reset." : "Steady — keep sessions short and intentional.";

  return (
    <PanelShell
      title="Cognitive Study Coach"
      subtitle="Track session length, stim load, and cooldowns for learning — not performance P&L."
      accent="#38BDF8"
    >
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-3">
          <FieldLabel>Stim load (1 calm → 5 overloaded)</FieldLabel>
          <input
            type="range"
            min={1}
            max={5}
            value={stim}
            onChange={(e) => setStim(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
            className="w-full"
            disabled={Boolean(activeId)}
          />
          <p className="text-xs text-white/50">{cooldown}</p>
          {!activeId ? (
            <TextButton
              onClick={() => {
                const s = api.startCoachSession(stim);
                setActiveId(s.id);
                setStartedAt(Date.now());
                setElapsed(0);
              }}
            >
              Start study session
            </TextButton>
          ) : (
            <>
              <p className="text-sm text-[#38BDF8] font-bold">Session live · ~{elapsed} min</p>
              <FieldLabel>Session notes</FieldLabel>
              <TextArea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              <TextButton
                tone="gold"
                onClick={() => {
                  if (!activeId) return;
                  api.endCoachSession(activeId, Math.max(1, elapsed), notes);
                  setActiveId(null);
                  setStartedAt(null);
                  setNotes("");
                }}
              >
                End + log cooldown
              </TextButton>
            </>
          )}
        </div>
        <ul className="space-y-2 max-h-[22rem] overflow-y-auto">
          {api.store.coachSessions.map((c) => (
            <li key={c.id} className="rounded-xl border border-white/10 p-3 text-xs text-white/70">
              <div className="flex justify-between">
                <span>{new Date(c.startedAt).toLocaleString()}</span>
                <span>stim {c.stimLoad}</span>
              </div>
              <div>
                {c.endedAt ? `${c.focusMinutes} min focused` : "In progress / unfinished"}
              </div>
              {c.notes && <p className="mt-1 text-white/50">{c.notes}</p>}
            </li>
          ))}
        </ul>
      </div>
    </PanelShell>
  );
}

export function IdeaPinsPanel({ api }: { api: StoreApi }) {
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const now = Date.now();

  return (
    <PanelShell
      title="Idea Pins with Decay"
      subtitle="Saved study notes expire unless you re-verify them against live market data or fresh sources."
      accent="#F472B6"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-2">
          <FieldLabel>Pin title</FieldLabel>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
          <FieldLabel>Study note</FieldLabel>
          <TextArea rows={5} value={note} onChange={(e) => setNote(e.target.value)} />
          <TextButton
            tone="pink"
            onClick={() => {
              if (!title.trim() || !note.trim()) return;
              api.addPin({ title: title.trim(), note: note.trim(), ttlHours: 72 });
              setTitle("");
              setNote("");
            }}
          >
            Pin for 72 hours
          </TextButton>
        </div>
        <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
          {api.store.pins.map((p) => {
            const expired = p.expiresAt < now;
            return (
              <li
                key={p.id}
                className={`rounded-xl border p-3 ${
                  expired ? "border-[#FF1493]/40 bg-[#FF1493]/5" : "border-white/10"
                }`}
              >
                <div className="flex justify-between gap-2">
                  <strong className="text-sm">{p.title}</strong>
                  <span className="text-[10px] uppercase text-white/40">
                    {expired ? "Expired" : p.verified ? "Verified" : "Fresh"}
                  </span>
                </div>
                <p className="text-xs text-white/60 mt-1 whitespace-pre-wrap">{p.note}</p>
                <p className="text-[10px] text-white/35 mt-1">
                  Expires {new Date(p.expiresAt).toLocaleString()}
                </p>
                <div className="mt-2">
                  <TextButton tone="muted" onClick={() => api.verifyPin(p.id)}>
                    Re-verify (extend 72h)
                  </TextButton>
                </div>
              </li>
            );
          })}
          {api.store.pins.length === 0 && <p className="text-xs text-white/35">No pins yet.</p>}
        </ul>
      </div>
    </PanelShell>
  );
}

export function PatternLiteracyPanel({ api }: { api: StoreApi }) {
  const [scans, setScans] = useState(() => getAllPatternScans());
  const [forming, setForming] = useState(() => getActiveFormingBrief());

  useEffect(() => {
    const unsubScan = subscribePatternScan(() => setScans(getAllPatternScans()));
    const unsubForm = subscribeFormingBrief(() => setForming(getActiveFormingBrief()));
    return () => {
      unsubScan();
      unsubForm();
    };
  }, []);

  return (
    <PanelShell
      title="Pattern Literacy Studio"
      subtitle="Auto-detected chart structures become teaching moments with plain-language explainers — not instructions."
      accent="#00F5D4"
    >
      {forming && (
        <div className="mb-4 rounded-xl border border-[#00F5D4]/30 p-3 bg-[#00F5D4]/5">
          <h3 className="text-sm font-bold text-[#00F5D4]">
            Forming structure · {forming.symbol} · {forming.timeframe}
          </h3>
          <p className="text-xs text-white/70 mt-1 whitespace-pre-wrap">
            {formatFormingBriefForChat(forming)}
          </p>
          <div className="mt-2">
            <TextButton
              tone="muted"
              onClick={() =>
                api.addVaultItem({
                  title: `Forming brief: ${forming.symbol} ${forming.timeframe}`,
                  body: formatFormingBriefForChat(forming),
                  kind: "chart",
                  tags: ["pattern", "forming", "literacy"],
                })
              }
            >
              Archive brief
            </TextButton>
          </div>
        </div>
      )}
      <ul className="space-y-2 max-h-[28rem] overflow-y-auto">
        {scans.map((scan) => {
          const list = scan.scan.patterns.slice(0, 8);
          const label = `${scan.symbol} · ${scan.timeframe}`;
          return (
            <li key={`${scan.symbol}_${scan.timeframe}_${scan.updatedAt}`} className="rounded-xl border border-white/10 p-3">
              <strong className="text-sm text-[#00F5D4]">{label}</strong>
              <ul className="mt-2 space-y-1">
                {list.map((p) => (
                  <li key={`${p.id}_${p.startIndex}_${p.endIndex}`} className="text-xs text-white/70 flex flex-wrap justify-between gap-2 items-center">
                    <span>
                      {p.label}{" "}
                      <span className="text-white/35">
                        ({p.direction}, {Math.round(p.confidence * 100)}%)
                      </span>
                      {p.detail ? <span className="block text-white/45">{p.detail}</span> : null}
                    </span>
                    <TextButton
                      tone="muted"
                      onClick={() =>
                        api.addVaultItem({
                          title: `Pattern lesson: ${p.label}`,
                          body: `Teaching moment on ${label}.\n${p.detail || "Describe the geometry in your own words and link it in Concept Wiki."}\nDirection: ${p.direction}. Confidence: ${Math.round(p.confidence * 100)}%.`,
                          kind: "chart",
                          tags: ["pattern", "literacy", p.category],
                        })
                      }
                    >
                      Archive lesson
                    </TextButton>
                  </li>
                ))}
              </ul>
              {list.length === 0 && (
                <p className="text-xs text-white/40 mt-1">Scan present but no patterns labeled yet.</p>
              )}
            </li>
          );
        })}
        {scans.length === 0 && (
          <p className="text-xs text-white/35">
            No active pattern scans yet. Open CHARTS, let the scanner run, then return here for teaching moments.
          </p>
        )}
      </ul>
    </PanelShell>
  );
}

export function EncyclopediaWorldPanel({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  return (
    <PanelShell
      title="Encyclopedia World"
      subtitle="Cinematic conceptual learning — systems, psychology, junior academy. Jump into the existing encyclopedias."
      accent="#C084FC"
    >
      <div className="grid gap-3 md:grid-cols-2">
        <WorldCard
          title="Encyclopedia of Finance"
          body="Civilization-scale finance literacy: systems, psychology, and conceptual labs."
          onClick={() => onNavigate?.("Encyclopedia")}
        />
        <WorldCard
          title="Encyclopedia of Indicators"
          body="Directory of indicator concepts with explanations for study."
          onClick={() => onNavigate?.("EncyclopediaOfIndicators")}
        />
        <WorldCard
          title="ClearPath Education schools"
          body="Full curriculum tracks — continue structured courses."
          onClick={() => onNavigate?.("ClearPathEducation")}
        />
        <WorldCard
          title="Y.W.C. media desk"
          body="Your media pantry home inside the terminal."
          onClick={() => onNavigate?.("Yours")}
        />
      </div>
    </PanelShell>
  );
}

function WorldCard({ title, body, onClick }: { title: string; body: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-xl border border-[#C084FC]/30 bg-[#C084FC]/5 p-4 hover:bg-[#C084FC]/10 transition"
    >
      <h3 className="font-bold text-[#C084FC]" style={{ fontFamily: "'Cinzel', serif" }}>
        {title}
      </h3>
      <p className="text-xs text-white/60 mt-2">{body}</p>
    </button>
  );
}
