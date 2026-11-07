// Generates QR codes for all 24 cards: npm run qr -- https://your-domain.vercel.app
import QRCode from 'qrcode';
import { mkdirSync, writeFileSync } from 'node:fs';

const base = (process.argv[2] || '').replace(/\/$/, '');
if (!/^https?:\/\//.test(base)) {
  console.error('Please pass the app URL, e.g.: npm run qr -- https://brief-24.vercel.app');
  process.exit(1);
}
mkdirSync('qr', { recursive: true });
const opts = { margin: 1, color: { dark: '#8A6A2FFF', light: '#00000000' }, errorCorrectionLevel: 'M' };
for (let num = 1; num <= 24; num++) {
  const url = `${base}/day/${num}`;
  const name = `qr/day-${String(num).padStart(2, '0')}`;
  writeFileSync(`${name}.svg`, await QRCode.toString(url, { ...opts, type: 'svg' }));
  await QRCode.toFile(`${name}.png`, url, { ...opts, width: 1200 });
  console.log(`${name}  →  ${url}`);
}
console.log('\nDone: folder qr/ (SVG for Canva, PNG with transparent background, gold #8A6A2F).');
