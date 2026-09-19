import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

// Pixel-perfect SVG matching the user's uploaded Freelife-log_icon_v3.png
// featuring clock face with crossed pencils (with eraser ends extending through center)
const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <filter id="subtle-shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.10"/>
    </filter>
  </defs>

  <!-- Clean Off-white App Icon Canvas -->
  <rect width="512" height="512" fill="#f8f9fa" />

  <!-- Outer Sage Green Clock Ring -->
  <circle cx="256" cy="256" r="226" fill="#6e9479" />

  <!-- Inner Cream Clock Face -->
  <circle cx="256" cy="256" r="184" fill="#f6f4eb" />

  <!-- 12 Clock Ticks (Charcoal rounded bars) -->
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(30 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(60 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(90 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(120 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(150 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(180 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(210 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(240 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(270 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(300 256 256)" />
  <rect x="249" y="86" width="14" height="28" rx="7" fill="#474747" transform="rotate(330 256 256)" />

  <!-- Clock Hands: 2 Crossed Pencils with eraser ends -->

  <!-- Pencil 1 (Minute Hand pointing to ~2 o'clock, 52 deg) -->
  <g transform="translate(256, 256) rotate(52)">
    <!-- Yellow Shaft -->
    <rect x="-12" y="-115" width="24" height="135" rx="3" fill="#eeb039" />
    <!-- Wood Cone Tip -->
    <polygon points="-12,-115 12,-115 0,-148" fill="#ebd0a6" />
    <!-- Graphite Lead Tip -->
    <polygon points="-5,-134 5,-134 0,-148" fill="#383838" />
    <!-- Metal Ferrule -->
    <rect x="-12" y="20" width="24" height="12" fill="#c6c9cc" />
    <!-- Pink Eraser -->
    <rect x="-12" y="32" width="24" height="18" rx="4" fill="#db6576" />
  </g>

  <!-- Pencil 2 (Hour Hand pointing to ~10 o'clock, -54 deg) -->
  <g transform="translate(256, 256) rotate(-54)">
    <!-- Yellow Shaft -->
    <rect x="-12" y="-90" width="24" height="110" rx="3" fill="#eeb039" />
    <!-- Wood Cone Tip -->
    <polygon points="-12,-90 12,-90 0,-122" fill="#ebd0a6" />
    <!-- Graphite Lead Tip -->
    <polygon points="-5,-108 5,-108 0,-122" fill="#383838" />
    <!-- Metal Ferrule -->
    <rect x="-12" y="20" width="24" height="12" fill="#c6c9cc" />
    <!-- Pink Eraser -->
    <rect x="-12" y="32" width="24" height="18" rx="4" fill="#db6576" />
  </g>

  <!-- Center Pivot Pin: Green ring with cream center -->
  <circle cx="256" cy="256" r="23" fill="#6e9479" filter="url(#subtle-shadow)" />
  <circle cx="256" cy="256" r="10" fill="#f6f4eb" />
</svg>
`;

// Maskable SVG with padded background for Android safe zone
const maskableSvgContent = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect x="0" y="0" width="512" height="512" fill="#6e9479" />
  <g transform="translate(51.2, 51.2) scale(0.8)">
    ${svgContent.replace('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">', '').replace('</svg>', '')}
  </g>
</svg>
`;

async function generate() {
  const publicDir = path.resolve('public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Save SVG
  fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

  const svgBuffer = Buffer.from(svgContent);
  const maskableSvgBuffer = Buffer.from(maskableSvgContent);

  // Generate PNGs for Apple Touch Icon and PWA
  await sharp(svgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-512x512.png'));
  await sharp(svgBuffer).resize(192, 192).png().toFile(path.join(publicDir, 'pwa-192x192.png'));
  await sharp(svgBuffer).resize(180, 180).png().toFile(path.join(publicDir, 'apple-touch-icon.png'));
  await sharp(svgBuffer).resize(64, 64).png().toFile(path.join(publicDir, 'favicon.png'));
  await sharp(maskableSvgBuffer).resize(512, 512).png().toFile(path.join(publicDir, 'pwa-maskable-512x512.png'));

  console.log('Successfully generated Apple Touch Icon & PWA assets in /public!');
}

generate().catch(console.error);
