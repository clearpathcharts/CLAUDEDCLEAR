import sharp from "sharp";

const BAND = 22;
const GAP = 4;

function isPurple(r, g, b, a) {
  if (a < 50) return false;
  if (g > 150 && b > 160 && r < g) return false;
  return r > 75 && b > 85 && b + r > g * 2.15 && b >= g && r > g * 0.62;
}

function isCyan(r, g, b, a) {
  if (a < 40) return false;
  return b > 85 && g > 55 && r < 175 && g > r * 0.72 && b > r + 12;
}

function distTo(mask, w, h) {
  const n = w * h;
  const dist = new Int16Array(n);
  dist.fill(32767);
  const q = new Int32Array(n);
  let qs = 0;
  let qe = 0;
  for (let p = 0; p < n; p++) {
    if (mask[p]) {
      dist[p] = 0;
      q[qe++] = p;
    }
  }
  while (qs < qe) {
    const p = q[qs++];
    const d = dist[p] + 1;
    if (d > 48) continue;
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
        if (dist[np] > d) {
          dist[np] = d;
          q[qe++] = np;
        }
      }
    }
  }
  return dist;
}

export async function wrapHotPink(srcPath) {
  const { data, info } = await sharp(srcPath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const n = w * h;
  const purple = new Uint8Array(n);
  const cyan = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const a = data[i + 3];
    if (isPurple(r, g, b, a)) purple[p] = 1;
    else if (isCyan(r, g, b, a)) cyan[p] = 1;
  }
  const dP = distTo(purple, w, h);
  const dC = distTo(cyan, w, h);
  const pink = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    if (purple[p] || cyan[p] || data[i + 3] < 48) continue;
    if (dP[p] < 1 || dP[p] > BAND) continue;
    if (dC[p] < GAP) continue;
    pink[p] = 1;
  }
  // Close small breaks in the wrap, then drop isolated specks.
  const closed = new Uint8Array(n);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const p = y * w + x;
      if (purple[p] || cyan[p] || data[p * 4 + 3] < 48) continue;
      if (dC[p] < GAP) continue;
      let neighbors = 0;
      for (let dy = -2; dy <= 2; dy++) {
        for (let dx = -2; dx <= 2; dx++) {
          if (pink[(y + dy) * w + (x + dx)]) neighbors++;
        }
      }
      if (pink[p] || neighbors >= 8) closed[p] = 1;
    }
  }
  const seen = new Uint8Array(n);
  const ids = new Int32Array(n);
  ids.fill(-1);
  let bestId = -1;
  let bestCount = 0;
  let nextId = 0;
  for (let start = 0; start < n; start++) {
    if (!closed[start] || seen[start]) continue;
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
          if (closed[np] && !seen[np]) {
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
  const out = Buffer.from(data);
  let painted = 0;
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    if (ids[p] !== bestId) continue;
    let neighbors = 0;
    const x = p % w;
    const y = (p / w) | 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const xx = x + dx;
        const yy = y + dy;
        if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
        if (closed[yy * w + xx]) neighbors++;
      }
    }
    if (neighbors < 3) continue;
    // Flat #FF1493 — red is already maxed, so this is as hot a pink as the screen can hold.
    out[i] = 255;
    out[i + 1] = 20;
    out[i + 2] = 147;
    out[i + 3] = 255;
    painted++;
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
