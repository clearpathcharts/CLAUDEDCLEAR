// Client-side compiler manifest fetch + semver-style update nudge.

import manifest from "./manifest.json";

export interface RiverCompilerManifest {
  engine: string;
  version: string;
  minClientVersion: string;
  releasedAt: string;
  channel: string;
  features: string[];
  unsupported: string[];
  selfTestCommand?: string;
  releaseNotes?: string;
}

const LOCAL_MANIFEST = manifest as RiverCompilerManifest;
const MANIFEST_URL = "/api/river/compiler/manifest";
const STORAGE_KEY = "clearpath_river_compiler_version";

function parseVersion(v: string): number[] {
  return v.split(".").map((n) => parseInt(n, 10) || 0);
}

export function compareVersions(a: string, b: string): number {
  const av = parseVersion(a);
  const bv = parseVersion(b);
  const len = Math.max(av.length, bv.length);
  for (let i = 0; i < len; i++) {
    const diff = (av[i] ?? 0) - (bv[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function getBundledCompilerManifest(): RiverCompilerManifest {
  return LOCAL_MANIFEST;
}

export async function fetchRemoteCompilerManifest(): Promise<RiverCompilerManifest | null> {
  try {
    const res = await fetch(MANIFEST_URL, { credentials: "same-origin" });
    if (!res.ok) return null;
    return (await res.json()) as RiverCompilerManifest;
  } catch {
    return null;
  }
}

export async function checkCompilerUpdate(): Promise<{
  updateAvailable: boolean;
  current: RiverCompilerManifest;
  remote: RiverCompilerManifest | null;
}> {
  const current = getBundledCompilerManifest();
  const remote = await fetchRemoteCompilerManifest();
  const seen = typeof localStorage !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const baseline = remote?.version ?? seen ?? current.version;
  const updateAvailable = remote ? compareVersions(remote.version, baseline) > 0 : false;
  if (remote && typeof localStorage !== "undefined") {
    localStorage.setItem(STORAGE_KEY, remote.version);
  }
  return { updateAvailable, current, remote };
}
