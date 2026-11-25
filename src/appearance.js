/** Photo-colour comparisons, not measurements of identity or attractiveness. */
export const CONTRAST_GOALS = {
  none: 'no score effect',
  soft: 'a small light/dark difference',
  balanced: 'a noticeable light/dark difference',
  bold: 'a strong light/dark difference'
};

function validRgb(rgb) {
  return Array.isArray(rgb) && rgb.length === 3 && rgb.every(value => Number.isFinite(value) && value >= 0 && value <= 255);
}

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

function contrastBand(ratio) {
  return ratio < 2 ? 'soft' : ratio < 4.5 ? 'balanced' : 'bold';
}

export function describePhotoPatch(rgb) {
  if (!validRgb(rgb)) throw new Error('Choose a valid photo colour.');
  const lightness = luminance(rgb);
  const brightness = lightness < 0.12 ? 'dark' : lightness < 0.28 ? 'medium-dark' : lightness < 0.5 ? 'medium-light' : 'light';
  const cast = rgb[0] - rgb[2] > 25 ? 'warm-toned' : rgb[2] - rgb[0] > 15 ? 'cool-toned' : 'fairly neutral';
  return `The selected area looks ${brightness} and ${cast} in this photo. Lighting can change how it looks; this is not a measurement of your skin tone.`;
}

export function comparePatchWithItems(rgb, items, colors) {
  if (!validRgb(rgb)) throw new Error('Choose a valid photo colour.');
  const base = luminance(rgb);
  return items.filter(item => colors[item.color]).map(item => {
    const other = luminance(hexRgb(colors[item.color].hex));
    const ratio = (Math.max(base, other) + 0.05) / (Math.min(base, other) + 0.05);
    return { id: item.id, label: colors[item.color].label, ratio, contrast: contrastBand(ratio) };
  });
}

/** User-selected contrast goal determines the score; no skin-category palette is assumed. */
export function assessNearFaceContrast(rgb, items, colors, garments, goal = 'none') {
  if (!CONTRAST_GOALS[goal] || goal === 'none') throw new Error('Choose a supported contrast goal.');
  const nearFace = items.filter(item => ['upper', 'outerwear', 'dress'].includes(garments[item.kind]?.slot));
  if (!nearFace.length) return null;
  const comparisons = comparePatchWithItems(rgb, nearFace, colors);
  if (!comparisons.length) return null;
  const order = { soft: 0, balanced: 1, bold: 2 };
  const score = Math.round(comparisons.reduce((sum, entry) => {
    const difference = Math.abs(order[entry.contrast] - order[goal]);
    return sum + (difference === 0 ? 100 : difference === 1 ? 65 : 30);
  }, 0) / comparisons.length);
  return { score, comparisons };
}
