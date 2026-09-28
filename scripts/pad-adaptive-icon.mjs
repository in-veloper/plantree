import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const SIZE = 1024;
const ART_SIZE = 660;

async function makeSafeIcon(sourcePath, targetPath) {
  const { data, info } = await sharp(sourcePath).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  const visited = new Uint8Array(width * height);
  const queue = new Int32Array(width * height);
  let head = 0;
  let tail = 0;

  function isBackground(index) {
    const offset = index * channels;
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    return Math.min(r, g, b) >= 240 && Math.max(r, g, b) - Math.min(r, g, b) <= 24;
  }

  function enqueue(index) {
    if (visited[index] || !isBackground(index)) return;
    visited[index] = 1;
    queue[tail++] = index;
  }

  for (let x = 0; x < width; x += 1) {
    enqueue(x);
    enqueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    enqueue(y * width);
    enqueue(y * width + width - 1);
  }

  while (head < tail) {
    const index = queue[head++];
    const x = index % width;
    const y = Math.floor(index / width);
    if (x > 0) enqueue(index - 1);
    if (x + 1 < width) enqueue(index + 1);
    if (y > 0) enqueue(index - width);
    if (y + 1 < height) enqueue(index + width);
  }

  for (let i = 0; i < visited.length; i += 1) {
    if (visited[i]) data[i * channels + 3] = 0;
  }

  const art = await sharp(data, { raw: info }).resize(ART_SIZE, ART_SIZE, { fit: 'inside' }).png().toBuffer();
  const output = await sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite([{ input: art, gravity: 'centre' }])
    .png()
    .toBuffer();

  await sharp(output).toFile(targetPath);
}

const source = fileURLToPath(new URL('../assets/icon.png', import.meta.url));
await makeSafeIcon(source, fileURLToPath(new URL('../assets/android-icon-foreground.png', import.meta.url)));
await makeSafeIcon(source, fileURLToPath(new URL('../assets/android-icon-monochrome.png', import.meta.url)));
