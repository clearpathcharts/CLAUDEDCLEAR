import sharp from "sharp";

const BAND_INNER = 1.4;
const BAND_OUTER = 8.6;
const GAP = 3.1;

function isCyan(r, g, b, a) {
  if (a < 40) return false;
  return b > 95 && g > 70 && r < 165 && g > r * 0.8 && b > r + 25;
}

function isPurpleSeed(r, g, b, a) {
  if (a < 45 || isCyan(r, g, b, a)) return false;
  return b > 55 && r > 45 && r + b > g * 1.85 && b >= g * 0.85 && r > g * 0.5;
}

function nearest(mask, w, h) {
  const n = w * h;
  const dist = new Float32Array(n);
  dist.fill(1e6);
  const q = new Int32Array(n);
  let qs = 0;
  let qe = 0;
  for (let p = 0; p < n; p++) {
    if (!mask[p]) continue;
    dist[p] = 0;
    q[qe++] = p;
  }
  while (qs < qe) {
    const p = q[qs++];
    const base = dist[p];
    if (base > 40) continue;
    const x = p % w;
    const y = (p / w) | 0;
    for (let dy = -1; dy <= 1; dy++) {
      const yy = y + dy;
      if (yy < 0 || yy >= h) continue;
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx;
        if (xx < 0 || xx >= w) continue;
        const np = yy * w + xx;
        const nd = base + (dx && dy ? 1.4142 : 1);
        if (nd < dist[np]) {
          dist[np] = nd;
          q[qe++] = np;
        }
      }
    }
  }
  return dist;
}

function dilate(mask, dist, radius) {
  const out = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) if (dist[p] <= radius) out[p] = 1;
  return out;
}

function erode(mask, w, h, radius) {
  const inv = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) inv[p] = mask[p] ? 0 : 1;
  const dist = nearest(inv, w, h);
  const out = new Uint8Array(mask.length);
  for (let p = 0; p < mask.length; p++) if (mask[p] && dist[p] > radius) out[p] = 1;
  return out;
}

function smooth(edge0, edge1, x) {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

export async function wrapHotPink(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const n = w * h;
  const seed = new Uint8Array(n);
  const cyan = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (isCyan(r, g, b, a)) cyan[p] = 1;
    else if (isPurpleSeed(r, g, b, a)) seed[p] = 1;
  }
  const fromSeed = nearest(seed, w, h);
  const cyanDist = nearest(cyan, w, h);
  const core = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    if (cyan[p] || data[i + 3] < 40) continue;
    if (fromSeed[p] <= 24 && fromSeed[p] + 2 < cyanDist[p]) core[p] = 1;
  }
  let solid = dilate(core, nearest(core, w, h), 2);
  for (let p = 0; p < n; p++) if (cyan[p]) solid[p] = 0;
  solid = erode(solid, w, h, 2);
  const coreDist = nearest(solid, w, h);
  const smoothDist = new Float32Array(n);
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      let sum = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) sum += coreDist[(y + dy) * w + (x + dx)];
      }
      smoothDist[y * w + x] = sum / 25;
    }
  }
  const out = Buffer.from(data);
  let painted = 0;
  const lightX = -0.32;
  const lightY = -0.95;
  for (let y = 2; y < h - 2; y++) {
    for (let x = 2; x < w - 2; x++) {
      const p = y * w + x;
      const i = p * 4;
      if (solid[p] || cyan[p] || data[i + 3] < 20) continue;
      const dCore = smoothDist[p];
      const dCyan = cyanDist[p];
      const cover =
        smooth(0.25, 1.15, dCore) *
        (1 - smooth(11.5, 13.5, dCore)) *
        smooth(1.5, 2.7, dCyan);
      if (cover < 0.05) continue;
      const gx = smoothDist[p + 1] - smoothDist[p - 1];
      const gy = smoothDist[p + w] - smoothDist[p - w];
      const glen = Math.hypot(gx, gy) || 1;
      const ndotl = (gx / glen) * lightX + (gy / glen) * lightY;
      const wrapped = Math.min(1, Math.max(0.08, ndotl * 0.48 + 0.62));
      const spec = Math.pow(Math.max(0, ndotl), 8);
      let pr = 120 + 135 * wrapped;
      let pg = 6 + 36 * wrapped;
      let pb = 78 + 80 * wrapped;
      pr += (255 - pr) * spec;
      pg += (248 - pg) * spec;
      pb += (255 - pb) * spec;
      const t = Math.min(1, cover);
      out[i] = Math.round(data[i] * (1 - t) + Math.min(255, pr) * t);
      out[i + 1] = Math.round(data[i + 1] * (1 - t) + Math.min(255, pg) * t);
      out[i + 2] = Math.round(data[i + 2] * (1 - t) + Math.min(255, pb) * t);
      out[i + 3] = Math.max(data[i + 3], Math.round(255 * t));
      painted++;
    }
  }
  const changed = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    if (out[i] !== data[i] || out[i + 1] !== data[i + 1] || out[i + 2] !== data[i + 2]) changed[p] = 1;
  }
  const seen = new Uint8Array(n);
  const ids = new Int32Array(n);
  ids.fill(-1);
  let bestId = -1;
  let bestCount = 0;
  let nextId = 0;
  for (let start = 0; start < n; start++) {
    if (!changed[start] || seen[start]) continue;
    const stack = [start];
    seen[start] = 1;
    const pixels = [];
    while (stack.length) {
      const p = stack.pop();
      pixels.push(p);
      const x = p % w;
      const y = (p / w) | 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (!dx && !dy) continue;
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const np = yy * w + xx;
          if (changed[np] && !seen[np]) {
            seen[np] = 1;
            stack.push(np);
          }
        }
      }
    }
    const id = nextId++;
    if (pixels.length > bestCount) {
      bestCount = pixels.length;
      bestId = id;
    }
    for (const p of pixels) ids[p] = id;
  }
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    if (!changed[p] || ids[p] === bestId) continue;
    out[i] = data[i];
    out[i + 1] = data[i + 1];
    out[i + 2] = data[i + 2];
    out[i + 3] = data[i + 3];
    painted--;
  }
  return { buffer: out, width: w, height: h, painted };
}

const src = process.argv[2];
const dest = process.argv[3];
if (src && dest) {
  const result = await wrapHotPink(src);
  await sharp(result.buffer, { raw: { width: result.width, height: result.height, channels: 4 } })
    .png()
    .toFile(dest);
  console.log("painted", result.painted, "->", dest);
}
