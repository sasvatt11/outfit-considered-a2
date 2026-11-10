import { COLORS } from './engine.js';

function luminance(rgb) {
  const channels = rgb.map(value => {
    const scaled = value / 255;
    return scaled <= 0.04045 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  });
  return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
}

function hexRgb(hex) {
  return [1, 3, 5].map(index => parseInt(hex.slice(index, index + 2), 16));
}

/** Descriptive light/dark contrast only; this is not a measure of attractiveness. */
export function comparePhotoSwatch(rgb, items) {
  if (!Array.isArray(rgb) || rgb.length !== 3 || rgb.some(value => !Number.isFinite(value) || value < 0 || value > 255)) {
    throw new Error('Choose a valid photo colour.');
  }
  const base = luminance(rgb);
  return items.filter(item => COLORS[item.color]).map(item => {
    const other = luminance(hexRgb(COLORS[item.color].hex));
    const ratio = (Math.max(base, other) + 0.05) / (Math.min(base, other) + 0.05);
    return { id: item.id, label: COLORS[item.color].label, ratio, contrast: ratio >= 4.5 ? 'strong' : ratio >= 2 ? 'moderate' : 'soft' };
  });
}
