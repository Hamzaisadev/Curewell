import fs from 'fs';
import path from 'path';
import { Resvg } from '@resvg/resvg-js';

const rootDir = process.cwd();
const exportDir = path.join(rootDir, 'logos', 'export');
const publicDir = path.join(rootDir, 'public');
const androidResDir = path.join(rootDir, 'android', 'app', 'src', 'main', 'res');

fs.mkdirSync(exportDir, { recursive: true });

const logoSvgPath = path.join(rootDir, 'logos', 'iterations', 'iteration-1.svg');
const iconSvgPath = path.join(rootDir, 'logos', 'iterations', 'icon-1.svg');

const logoSvg = fs.readFileSync(logoSvgPath, 'utf-8');
const iconSvg = fs.readFileSync(iconSvgPath, 'utf-8');

// Copy base SVGs to exportDir
fs.writeFileSync(path.join(exportDir, 'logo.svg'), logoSvg);
fs.writeFileSync(path.join(exportDir, 'icon.svg'), iconSvg);

// Copy to publicDir
fs.writeFileSync(path.join(publicDir, 'logo.svg'), logoSvg);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), iconSvg);

// Create an Android adaptive foreground SVG (108x108 with icon centered in 66x66 safe zone)
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
    <!-- Outer Shield -->
    <path d="M256 90 L396 156 V298 C396 364 334 418 256 438 C178 418 116 364 116 298 V156 L256 90 Z" fill="url(#cw-fg-shield)" />
    <path d="M256 96 L390 160 V298 C390 358 330 410 256 430 C182 410 122 358 122 298 V160 L256 96 Z" stroke="#2DD4BF" stroke-opacity="0.4" stroke-width="2.5" />
    <path d="M256 136 L356 184 V288 C356 336 310 376 256 392 C202 376 156 336 156 288 V184 L256 136 Z" stroke="#5EEAD4" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="8 6" />
    <path d="M256 196 V316 M196 256 H316" stroke="url(#cw-fg-beam)" stroke-width="18" stroke-linecap="round" />
    <circle cx="256" cy="256" r="16" fill="#FFFFFF" />
    <circle cx="256" cy="256" r="7" fill="#0D9488" />
  </g>
</svg>`;

// Helper function to render SVG to PNG buffer
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

console.log('--- Generating logos/export/ assets ---');
const standardSizes = [16, 32, 48, 192, 512, 1024, 2048];
for (const size of standardSizes) {
  // Render logo (combination mark)
  const logoPng = renderPng(logoSvg, size * 2, size); // 1024x512 aspect ratio
  fs.writeFileSync(path.join(exportDir, `logo-${size}.png`), logoPng);

  // Render icon (square)
  const iconPng = renderPng(iconSvg, size, size);
  fs.writeFileSync(path.join(exportDir, `icon-${size}.png`), iconPng);
  console.log(`  Rendered logo-${size}.png and icon-${size}.png`);
}

console.log('--- Generating Web & PWA assets ---');
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), renderPng(iconSvg, 192, 192));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), renderPng(iconSvg, 512, 512));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), renderPng(iconSvg, 180, 180));
console.log('  Rendered public/pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png');

console.log('--- Generating Android APK mipmap assets ---');
const androidDensities = [
  { name: 'mipmap-mdpi', launcherSize: 48, fgSize: 108 },
  { name: 'mipmap-hdpi', launcherSize: 72, fgSize: 162 },
  { name: 'mipmap-xhdpi', launcherSize: 96, fgSize: 216 },
  { name: 'mipmap-xxhdpi', launcherSize: 144, fgSize: 324 },
  { name: 'mipmap-xxxhdpi', launcherSize: 192, fgSize: 432 },
];

for (const density of androidDensities) {
  const targetDir = path.join(androidResDir, density.name);
  fs.mkdirSync(targetDir, { recursive: true });

  // Standard launcher icon
  const launcherPng = renderPng(iconSvg, density.launcherSize, density.launcherSize);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher.png'), launcherPng);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_round.png'), launcherPng);

  // Adaptive icon foreground
  const fgPng = renderPng(adaptiveForegroundSvg, density.fgSize, density.fgSize);
  fs.writeFileSync(path.join(targetDir, 'ic_launcher_foreground.png'), fgPng);

  console.log(`  Updated ${density.name} (Launcher: ${density.launcherSize}px, Foreground: ${density.fgSize}px)`);
}

// Google Play store icon in export
fs.writeFileSync(path.join(exportDir, 'playstore-icon-512.png'), renderPng(iconSvg, 512, 512));
console.log('  Generated playstore-icon-512.png');

console.log('All logo and app assets exported successfully!');
