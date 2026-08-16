/**
 * Icon Generator Script
 * 
 * Generates PNG icons from the SVG source for PWA compatibility.
 * Run with: node scripts/generate-icons.js
 * 
 * Requires: npm install sharp (or use an online converter)
 * 
 * If sharp is not available, you can use any SVG-to-PNG converter:
 * - https://convertio.co/svg-png/
 * - https://cloudconvert.com/svg-to-png
 * 
 * Generated files:
 * - static/icon-192x192.png
 * - static/icon-512x512.png
 * - static/apple-touch-icon.png (180x180)
 * - static/favicon.ico (32x32)
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const SVG_PATH = join(__dirname, '..', 'static', 'icon.svg');

console.log('Shopping List PWA - Icon Generator');
console.log('=================================\n');

try {
  const svgContent = readFileSync(SVG_PATH, 'utf-8');
  console.log('✓ SVG icon found at static/icon.svg');
  console.log(`  Size: ${svgContent.length} bytes\n`);
} catch (error) {
  console.error('✗ SVG icon not found at static/icon.svg');
  console.error('  Please ensure the SVG icon exists.\n');
  process.exit(1);
}

console.log('Required PNG outputs:');
console.log('  - static/icon-192x192.png (192x192)');
console.log('  - static/icon-512x512.png (512x512)');
console.log('  - static/apple-touch-icon.png (180x180)');
console.log('  - static/favicon.ico (32x32, multi-resolution ICO)\n');

console.log('Option 1: Automatic generation (requires sharp)');
console.log('  npm install -D sharp');
console.log('  node scripts/generate-icons.js --sharp\n');

console.log('Option 2: Manual conversion');
console.log('  Use an online SVG-to-PNG converter with these sizes:');
console.log('  32x32, 180x180, 192x192, 512x512\n');

console.log('Option 3: Use the SVG directly (modern browsers)');
console.log('  The manifest already references icon.svg for modern browsers.');
console.log('  PNG fallbacks are only needed for older Safari/iOS versions.\n');

// If --sharp flag is passed, attempt to generate
if (process.argv.includes('--sharp')) {
  try {
    const sharp = await import('sharp');
    const { writeFileSync } = await import('fs');
    
    const svgBuffer = readFileSync(SVG_PATH);
    const sizes = [
      { name: 'favicon.ico', size: 32 },
      { name: 'apple-touch-icon.png', size: 180 },
      { name: 'icon-192x192.png', size: 192 },
      { name: 'icon-512x512.png', size: 512 }
    ];
    
    for (const { name, size } of sizes) {
      const outputPath = join(__dirname, '..', 'static', name);
      
      if (name.endsWith('.ico')) {
        // For ICO, generate PNG and note that it should be converted
        const pngBuffer = await sharp.default(svgBuffer)
          .resize(size, size)
          .png()
          .toBuffer();
        writeFileSync(outputPath.replace('.ico', '-32x32.png'), pngBuffer);
        console.log(`  Generated ${name} placeholder (PNG format, rename to .ico or use to-ico)`);
      } else {
        await sharp.default(svgBuffer)
          .resize(size, size)
          .png()
          .toFile(outputPath);
        console.log(`  Generated ${name} (${size}x${size})`);
      }
    }
    
    console.log('\n✓ All icons generated successfully!');
  } catch (error) {
    console.error('\n✗ Failed to generate icons with sharp:', error.message);
    console.error('  Make sure sharp is installed: npm install -D sharp');
    process.exit(1);
  }
}
