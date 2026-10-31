import sharp from 'sharp';
import { mkdir, copyFile } from 'fs/promises';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BRAND_DIR = resolve(__dirname, '../assets/branding');
const OUT_DIR = resolve(__dirname, '../public/icons');

const ICON_SOURCE = resolve(BRAND_DIR, 'kippa_icon_monochrome.png');

const SIZES = [
  { name: 'icon-192.png', size: 192 },
  { name: 'icon-512.png', size: 512 },
  { name: 'maskable-192.png', size: 192 },
  { name: 'maskable-512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
];

// Brand marks used directly by the app (splash + theme-aware logo swap).
// Copied verbatim — no resizing needed (they already have alpha channels).
const MARK_COPIES = [
  { src: 'kippa_mark_black_transparent.png', dest: 'logo_black_transparent.png' },
  { src: 'kippa_mark_white_transparent.png', dest: 'logo_white_transparent.png' },
];

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const { name, size } of SIZES) {
    await sharp(ICON_SOURCE).resize(size, size, { fit: 'cover' }).png().toFile(resolve(OUT_DIR, name));
    console.log(`Generated ${name} (${size}x${size})`);
  }

  for (const { src, dest } of MARK_COPIES) {
    await copyFile(resolve(BRAND_DIR, src), resolve(OUT_DIR, dest));
    console.log(`Copied ${src} → ${dest}`);
  }

  console.log('All icons generated.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
