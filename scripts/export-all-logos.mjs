import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const rootDir = process.cwd();
const exportDir = path.join(rootDir, 'logos', 'export');
const publicDir = path.join(rootDir, 'public');
const exportAndroidDir = path.join(exportDir, 'android');
const exportIosDir = path.join(exportDir, 'ios');

fs.mkdirSync(exportDir, { recursive: true });
fs.mkdirSync(exportAndroidDir, { recursive: true });
fs.mkdirSync(exportIosDir, { recursive: true });

const logoSvgPath = path.join(rootDir, 'logos', 'iterations', 'iteration-1.svg');
const iconSvgPath = path.join(rootDir, 'logos', 'iterations', 'icon-1.svg');

const logoSvg = fs.readFileSync(logoSvgPath, 'utf-8');
const iconSvg = fs.readFileSync(iconSvgPath, 'utf-8');

// Copy base SVGs
fs.writeFileSync(path.join(exportDir, 'logo.svg'), logoSvg);
fs.writeFileSync(path.join(exportDir, 'icon.svg'), iconSvg);
fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), iconSvg);

// Android adaptive foreground SVG (108x108 with icon in safe zone)
const adaptiveForegroundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 108 108" width="108" height="108" fill="none">
  <defs>
    <linearGradient id="cw-fg-beam" x1="42" y1="42" x2="66" y2="66" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#5EEAD4" />
      <stop offset="100%" stop-color="#14B8A6" />
    </linearGradient>
    <linearGradient id="cw-fg-shield" x1="28" y1="20" x2="80" y2="88" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#0D9488" />
      <stop offset="45%" stop-color="#0F766E" />
      <stop offset="100%" stop-color="#042F2E" />
    </linearGradient>
    <filter id="cw-fg-glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#0D9488" flood-opacity="0.3" />
    </filter>
  </defs>

  <g transform="translate(54, 54) scale(0.18) translate(-256, -256)" filter="url(#cw-fg-glow)">
    <path d="M256 90 L396 156 V298 C396 364 334 418 256 438 C178 418 116 364 116 298 V156 L256 90 Z" fill="url(#cw-fg-shield)" />
    <path d="M256 96 L390 160 V298 C390 358 330 410 256 430 C182 410 122 358 122 298 V160 L256 96 Z" stroke="#2DD4BF" stroke-opacity="0.4" stroke-width="2.5" />
    <path d="M256 136 L356 184 V288 C356 336 310 376 256 392 C202 376 156 336 156 288 V184 L256 136 Z" stroke="#5EEAD4" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 6" />
    <path d="M256 196 V316 M196 256 H316" stroke="url(#cw-fg-beam)" stroke-width="18" stroke-linecap="round" />
    <circle cx="256" cy="256" r="16" fill="#FFFFFF" />
    <circle cx="256" cy="256" r="7" fill="#0D9488" />
  </g>
</svg>`;

function renderPng(svgContent, width, height) {
  const resvg = new Resvg(svgContent, {
    fitTo: { mode: 'width', value: width },
    shapeRendering: 2,
    textRendering: 1,
    imageRendering: 0,
  });
  const pngData = resvg.render();
  return pngData.asPng();
}

console.log('--- 1. Standard Logo & Icon Exports ---');
const standardSizes = [16, 32, 48, 192, 512, 1024, 2048];
for (const size of standardSizes) {
  fs.writeFileSync(path.join(exportDir, `logo-${size}.png`), renderPng(logoSvg, size * 2, size));
  fs.writeFileSync(path.join(exportDir, `icon-${size}.png`), renderPng(iconSvg, size, size));
  console.log(`  Exported logo-${size}.png and icon-${size}.png`);
}

console.log('--- 2. Web & PWA Assets ---');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderPng(iconSvg, 192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderPng(iconSvg, 512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderPng(iconSvg, 180, 180));
console.log('  Updated public/pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png');

console.log('--- 3. Android APK & Mobile Assets (Full Density Sets) ---');
const androidDensities = [
  { name: 'mipmap-mdpi', launcherSize: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', launcherSize: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', launcherSize: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', launcherSize: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', launcherSize: 192, fgSize: 432 },
];

for (const density of androidDensities) {
  const targetDir = path.join(exportAndroidDir, density.name);
  fs.mkdirSync(targetDir, { recursive: true });

  const launcherPng = renderPng(iconSvg, density.launcherSize, density.launcherSize);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), launcherPng);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), launcherPng);

  const fgPng = renderPng(adaptiveForegroundSvg, density.fgSize, density.fgSize);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), fgPng);
  console.log(`  Rendered ${density.name} in logos/export/android/`);
}

fs.writeFileSync(path.join(exportAndroidDir, 'playstore-icon-512.png'), renderPng(iconSvg, 512, 512));

console.log('--- 4. iOS Mobile App Icons ---');
const iosSizes = [
  { name: 'AppIcon-20@2x.png', size: 40 },
  { name: 'AppIcon-20@3x.png', size: 60 },
  { name: 'AppIcon-29@2x.png', size: 58 },
  { name: 'AppIcon-29@3x.png', size: 87 },
  { name: 'AppIcon-40@2x.png', size: 80 },
  { name: 'AppIcon-40@3x.png', size: 120 },
  { name: 'AppIcon-60@2x.png', size: 120 },
  { name: 'AppIcon-60@3x.png', size: 180 },
  { name: 'AppIcon-1024.png', size: 1024 },
];

for (const ios of iosSizes) {
  fs.writeFileSync(path.join(exportIosDir, ios.name), renderPng(iconSvg, ios.size, ios.size));
  console.log(`  Rendered ${ios.name} (${ios.size}x${ios.size})`);
}

console.log('--- 5. Generating multi-resolution favicon.ico ---');
const p16 = fs.readFileSync(path.join(exportDir, 'icon-16.png'));
const p32 = fs.readFileSync(path.join(exportDir, 'icon-32.png'));
const p48 = fs.readFileSync(path.join(exportDir, 'icon-48.png'));

const images = [
  { w: 16, h: 16, data: p16 },
  { w: 32, h: 32, data: p32 },
  { w: 48, h: 48, data: p48 }
];

const count = images.length;
const headerSize = 6 + count * 16;
let currentOffset = headerSize;

const buffers = [];
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(count, 4);
buffers.push(header);

const dirEntries = [];
for (const img of images) {
  const entry = Buffer.alloc(16);
  entry.writeUInt8(img.w, 0);
  entry.writeUInt8(img.h, 1);
  entry.writeUInt8(0, 2);
  entry.writeUInt8(0, 3);
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(img.data.length, 8);
  entry.writeUInt32LE(currentOffset, 12);
  dirEntries.push(entry);
  currentOffset += img.data.length;
}

buffers.push(...dirEntries);
for (const img of images) {
  buffers.push(img.data);
}

const ico = Buffer.concat(buffers);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico);
fs.writeFileSync(path.join(exportDir, 'favicon.ico'), ico);
console.log('  Updated public/favicon.ico and logos/export/favicon.ico');

console.log('✅ ALL MOBILE, APK, WEB, AND BRAND ASSETS EXPORTED SUCCESSFULLY!');
