import sharp from 'sharp';
import { readFileSync } from 'node:fs';
const svg = readFileSync('public/favicon.svg');
const out = (n, s) => sharp(svg, { density: 384 }).resize(s, s).png().toFile(`public/${n}`);
await out('pwa-192x192.png', 192);
await out('pwa-512x512.png', 512);
await out('apple-touch-icon.png', 180);
// maskable: full-bleed background with logo at 70%
const logo = await sharp(svg, { density: 384 }).resize(360, 360).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#1f1308' } })
  .composite([{ input: logo, gravity: 'center' }]).png().toFile('public/maskable-512x512.png');
console.log('icons ok');
