// Generate square favicon PNGs from public/logo.png for tab icons and PWA.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const publicDir = path.join(process.cwd(), 'public');
const logoPath = path.join(publicDir, 'logo.png');

if (!fs.existsSync(logoPath)) {
  console.error('Missing public/logo.png — add the brand asset first.');
  process.exit(1);
}

const sizes = [32, 192, 512];

for (const size of sizes) {
  const out = path.join(publicDir, size === 32 ? 'favicon.png' : `favicon-${size}.png`);
  await sharp(logoPath)
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(out);
  console.log(`Wrote ${out}`);
}
