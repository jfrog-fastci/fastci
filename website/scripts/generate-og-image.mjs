#!/usr/bin/env node
/**
 * Generates og-image.png (1200x630) for social media previews.
 * Run: node scripts/generate-og-image.mjs
 */
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputPath = join(__dirname, '../public/og-image.png');

const width = 1200;
const height = 630;

// Create SVG for the OG image - dark theme with FastCI branding
const svg = `
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0f172a"/>
      <stop offset="100%" style="stop-color:#1e293b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#40BE46"/>
      <stop offset="100%" style="stop-color:#34d399"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect x="0" y="0" width="100%" height="4" fill="url(#accent)"/>
  <text x="600" y="300" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="bold" fill="white" text-anchor="middle">FastCI</text>
  <text x="600" y="360" font-family="system-ui, -apple-system, sans-serif" font-size="28" fill="#94a3b8" text-anchor="middle">Automatically Identify and Optimize Your CI</text>
</svg>
`;

await sharp(Buffer.from(svg))
  .png()
  .toFile(outputPath);

console.log(`Generated ${outputPath}`);
