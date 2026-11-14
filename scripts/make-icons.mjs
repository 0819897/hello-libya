// Draws the app icon (teal tile, amber speech bubble, white dots) as PNGs with no dependencies.
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = buf => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};

function icon(size) {
  const px = (x, y) => {
    const u = x / size, v = y / size;
    const inBubble = ((u - 0.5) ** 2) / 0.33 ** 2 + ((v - 0.46) ** 2) / 0.26 ** 2 <= 1;
    const inTail = v > 0.6 && v < 0.82 && u > 0.3 && u < 0.46 && (u - 0.3) < (0.82 - v) * 0.9;
    const dot = [0.36, 0.5, 0.64].some(cx => (u - cx) ** 2 + (v - 0.46) ** 2 <= 0.045 ** 2);
    if (dot && inBubble) return [255, 255, 255];
    if (inBubble || inTail) return [245, 158, 11];
    return [15, 118, 110];
  };
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) px(x, y).forEach((c, i) => { raw[y * (size * 3 + 1) + 1 + x * 3 + i] = c; });
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

for (const s of [192, 512]) writeFileSync(`public/icons/icon-${s}.png`, icon(s));
console.log('icons written');
