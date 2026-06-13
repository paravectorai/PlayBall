// Generates solid-color Apple splash screen PNGs for major iOS device sizes.
// Stadium Green background (#1B4332) with the app icon centered.
// Run: node scripts/generate-splash.mjs
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');
const publicDir = path.join(root, 'public');
const require = createRequire(import.meta.url);
const sharp = require(path.join(root, 'node_modules/sharp'));

const BACKGROUND = { r: 0x1B, g: 0x43, b: 0x32, alpha: 1 };
const ICON_SIZE = 192;
const ICON_SRC = path.join(publicDir, 'pwa-192x192.png');

const sizes = [
  { name: 'apple-splash-640-1136',   w: 640,  h: 1136 },  // iPhone SE (1st/2nd gen)
  { name: 'apple-splash-750-1334',   w: 750,  h: 1334 },  // iPhone 8
  { name: 'apple-splash-1125-2436',  w: 1125, h: 2436 },  // iPhone X/XS/11 Pro
  { name: 'apple-splash-1170-2532',  w: 1170, h: 2532 },  // iPhone 12/13/14
  { name: 'apple-splash-1284-2778',  w: 1284, h: 2778 },  // iPhone 14 Plus / 13 Pro Max
  { name: 'apple-splash-1290-2796',  w: 1290, h: 2796 },  // iPhone 14 Pro Max / 15 Pro Max
  { name: 'apple-splash-1488-2266',  w: 1488, h: 2266 },  // iPad mini 6th gen
  { name: 'apple-splash-2048-2732',  w: 2048, h: 2732 },  // iPad Pro 12.9"
];

async function generate() {
  const iconBuf = await sharp(ICON_SRC).resize(ICON_SIZE, ICON_SIZE).png().toBuffer();

  for (const { name, w, h } of sizes) {
    const left = Math.round((w - ICON_SIZE) / 2);
    const top = Math.round((h - ICON_SIZE) / 2);
    const outPath = path.join(publicDir, `${name}.png`);

    await sharp({ create: { width: w, height: h, channels: 4, background: BACKGROUND } })
      .composite([{ input: iconBuf, left, top }])
      .png()
      .toFile(outPath);

    console.log(`✔ ${name}.png (${w}×${h})`);
  }
  console.log('Done.');
}

generate().catch((e) => { console.error(e); process.exit(1); });
