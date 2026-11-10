import { COLORS } from './engine.js';

function rgbToLab([red, green, blue]) {
  const linear = [red, green, blue].map(value => {
    const v = value / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  const x = (linear[0] * 0.4124 + linear[1] * 0.3576 + linear[2] * 0.1805) / 0.95047;
  const y = (linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722);
  const z = (linear[0] * 0.0193 + linear[1] * 0.1192 + linear[2] * 0.9505) / 1.08883;
  const f = value => value > 0.008856 ? Math.cbrt(value) : 7.787 * value + 16 / 116;
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

function hexToRgb(hex) {
  return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
}

export function nearestColour(rgb) {
  const target = rgbToLab(rgb);
  return Object.entries(COLORS).map(([name, meta]) => {
    const lab = rgbToLab(hexToRgb(meta.hex));
    const distance = Math.hypot(...lab.map((value, index) => value - target[index]));
    return { name, distance };
  }).sort((a, b) => a.distance - b.distance)[0].name;
}

/** Samples a small patch of a displayed image. Coordinates are relative to its actual pixels. */
export function sampleImageColour(image, clientX, clientY) {
  if (!image.complete || !image.naturalWidth) throw new Error('The image has not loaded yet.');
  const bounds = image.getBoundingClientRect();
  const displayedWidth = Math.min(bounds.width, bounds.height * image.naturalWidth / image.naturalHeight);
  const displayedHeight = Math.min(bounds.height, bounds.width * image.naturalHeight / image.naturalWidth);
  const imageLeft = bounds.left + (bounds.width - displayedWidth) / 2;
  const imageTop = bounds.top + (bounds.height - displayedHeight) / 2;
  const relativeX = (clientX - imageLeft) / displayedWidth;
  const relativeY = (clientY - imageTop) / displayedHeight;
  if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) throw new Error('Tap inside the visible photo, away from the blank margins.');
  const scale = Math.min(1, 640 / image.naturalWidth);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { willReadFrequently: true });
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  const x = Math.min(canvas.width - 1, Math.max(0, Math.round(relativeX * canvas.width)));
  const y = Math.min(canvas.height - 1, Math.max(0, Math.round(relativeY * canvas.height)));
  const radius = 5;
  const startX = Math.max(0, x - radius);
  const startY = Math.max(0, y - radius);
  const pixels = context.getImageData(startX, startY, Math.min(2 * radius + 1, canvas.width - startX), Math.min(2 * radius + 1, canvas.height - startY)).data;
  const channels = [0, 0, 0];
  let count = 0;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] < 128) continue;
    channels.forEach((_, channel) => { channels[channel] += pixels[index + channel]; });
    count++;
  }
  if (!count) throw new Error('No visible colour was found at that point.');
  const rgb = channels.map(value => Math.round(value / count));
  return { rgb, colour: nearestColour(rgb), x: relativeX, y: relativeY };
}
