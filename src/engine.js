/**
 * Local, inspectable knowledge-based outfit engine.
 * These weights are design choices for this prototype, not validated fashion facts.
 */

export const OCCASIONS = {
  casual: { label: 'Casual day', target: 1 },
  dinner: { label: 'Dinner out', target: 2 },
  interview: { label: 'Interview', target: 3 }
};

export const GARMENTS = {
  tshirt: { label: 'T-shirt', slot: 'upper', formality: 1 },
  shirt: { label: 'Shirt or blouse', slot: 'upper', formality: 3 },
  knit: { label: 'Knitwear', slot: 'upper', formality: 2 },
  jeans: { label: 'Jeans', slot: 'lower', formality: 1 },
  trousers: { label: 'Tailored trousers', slot: 'lower', formality: 3 },
  skirt: { label: 'Skirt', slot: 'lower', formality: 2 },
  dress: { label: 'Dress', slot: 'dress', formality: 2 },
  blazer: { label: 'Blazer', slot: 'outerwear', formality: 3 },
  jacket: { label: 'Casual jacket', slot: 'outerwear', formality: 1 },
  sneakers: { label: 'Trainers', slot: 'footwear', formality: 1 },
  boots: { label: 'Boots', slot: 'footwear', formality: 2 },
  loafers: { label: 'Smart shoes', slot: 'footwear', formality: 3 }
};

export const COLORS = {
  black: { label: 'Black', hex: '#282827', neutral: true },
  white: { label: 'White', hex: '#f4f1e8', neutral: true },
  grey: { label: 'Grey', hex: '#898d8c', neutral: true },
  cream: { label: 'Cream', hex: '#e7dabe', neutral: true },
  beige: { label: 'Beige', hex: '#bca789', neutral: true },
  brown: { label: 'Brown', hex: '#73513b', neutral: true },
  navy: { label: 'Navy', hex: '#273d59', neutral: true },
  blue: { label: 'Blue', hex: '#477ab1', neutral: false },
  red: { label: 'Red', hex: '#b44848', neutral: false },
  orange: { label: 'Orange', hex: '#ca7840', neutral: false },
  yellow: { label: 'Yellow', hex: '#d4b34d', neutral: false },
  green: { label: 'Green', hex: '#5c8266', neutral: false },
  pink: { label: 'Pink', hex: '#d38a9f', neutral: false },
  purple: { label: 'Purple', hex: '#806991', neutral: false }
};

export const PATTERNS = {
  solid: 'Solid',
  stripe: 'Striped',
  print: 'Printed',
  check: 'Checked'
};

const clamp = value => Math.max(0, Math.min(100, Math.round(value)));

function checkItems(items) {
  return Array.isArray(items) && items.every(item =>
    item && typeof item.id === 'string' && GARMENTS[item.kind] && COLORS[item.color] && PATTERNS[item.pattern]
  );
}

export function evaluateOutfit({ occasion, preference = 'none', items }) {
  if (!OCCASIONS[occasion]) throw new Error('Choose a supported occasion.');
  if (!['none', 'minimal', 'expressive'].includes(preference)) throw new Error('Choose a supported preference.');
  if (!checkItems(items)) throw new Error('Review the garment details before scoring.');
  if (items.length < 2) {
    return { total: null, dimensions: [], notes: ['Add at least two visible garments to receive an estimate.'] };
  }

  const kinds = items.map(item => item.kind);
  const target = OCCASIONS[occasion].target;
  const distance = items.reduce((sum, item) => sum + Math.abs(GARMENTS[item.kind].formality - target), 0) / items.length;
  const occasionScore = clamp(100 - distance * 28);
  const occasionReason = occasionScore >= 85
    ? `Most visible pieces match the ${OCCASIONS[occasion].label.toLowerCase()} setting.`
    : `Some pieces sit away from the formality level chosen for ${OCCASIONS[occasion].label.toLowerCase()}.`;

  let pairing = 80;
  const pairingReasons = [];
  if (kinds.includes('dress') && (kinds.some(k => GARMENTS[k].slot === 'upper') || kinds.some(k => GARMENTS[k].slot === 'lower'))) {
    pairing -= 20;
    pairingReasons.push('Check whether the dress and separate pieces are all visible together.');
  }
  if (kinds.includes('jeans') && kinds.includes('sneakers') && occasion === 'casual') {
    pairing += 14;
    pairingReasons.push('Jeans and trainers form a familiar casual pairing.');
  }
  if (kinds.includes('trousers') && kinds.includes('loafers')) {
    pairing += 14;
    pairingReasons.push('Tailored trousers and smart shoes share a similar level of dress.');
  }
  if (kinds.includes('trousers') && kinds.includes('sneakers') && occasion === 'interview') {
    pairing -= 18;
    pairingReasons.push('Trainers introduce a more casual note beside tailored trousers.');
  }
  if (kinds.includes('blazer') && (kinds.includes('trousers') || kinds.includes('skirt') || kinds.includes('dress'))) {
    pairing += 8;
    pairingReasons.push('The blazer relates clearly to the main outfit.');
  }
  if (items.filter(item => item.pattern !== 'solid').length > 1) {
    pairing -= 10;
    pairingReasons.push('Two visible patterns compete for attention.');
  }
  const pairingScore = clamp(pairing);
  if (!pairingReasons.length) pairingReasons.push('No strong garment-pairing conflict was found in the selected rules.');

  const coloured = items.filter(item => !COLORS[item.color].neutral);
  const hueCount = new Set(coloured.map(item => item.color)).size;
  let colourScore = 84;
  if (hueCount === 1 && coloured.length > 1) colourScore += 10;
  if (hueCount === 2) colourScore -= 5;
  if (hueCount >= 3) colourScore -= 22;
  const colourReason = hueCount >= 3
    ? 'Three or more distinct accent colours make the palette busier.'
    : hueCount === 0 ? 'The selected colours form a neutral palette.'
    : 'The palette has a limited number of accent colours.';

  const expressiveCount = items.filter(item => item.pattern !== 'solid' || !COLORS[item.color].neutral).length;
  const share = expressiveCount / items.length;
  let preferenceScore = 82;
  let preferenceReason = 'No personal style preference was specified.';
  if (preference === 'minimal') {
    preferenceScore = clamp(100 - share * 45);
    preferenceReason = share <= 0.25 ? 'The outfit follows your understated preference.' : 'Several selected pieces are more expressive than your stated preference.';
  }
  if (preference === 'expressive') {
    preferenceScore = clamp(55 + share * 45);
    preferenceReason = share >= 0.5 ? 'Colour or pattern supports your expressive preference.' : 'The outfit is quieter than your stated preference.';
  }

  const dimensions = [
    { key: 'occasion', label: 'Occasion fit', score: occasionScore, weight: 40, reason: occasionReason },
    { key: 'pairing', label: 'Garment pairing', score: pairingScore, weight: 25, reason: pairingReasons.join(' ') },
    { key: 'colour', label: 'Colour balance', score: clamp(colourScore), weight: 20, reason: colourReason },
    { key: 'preference', label: 'Your preference', score: preferenceScore, weight: 15, reason: preferenceReason }
  ];
  const total = clamp(dimensions.reduce((sum, d) => sum + d.score * d.weight / 100, 0));
  const notes = [];
  const slots = new Set(items.map(item => GARMENTS[item.kind].slot));
  if (!slots.has('footwear')) notes.push('Footwear is not included; this estimate covers only the visible pieces you entered.');
  if (!slots.has('dress') && (!slots.has('upper') || !slots.has('lower'))) notes.push('The main outfit may be incomplete in this photo.');
  return { total, dimensions, notes };
}

export function applyChange(items, change) {
  return items.map(item => item.id === change.itemId ? { ...item, ...change.patch } : item);
}

export function suggestChange(context) {
  const before = evaluateOutfit(context);
  if (before.total === null || before.total >= 88) return null;
  const options = [];
  const offer = (item, patch, explanation) => {
    const revisedItems = applyChange(context.items, { itemId: item.id, patch });
    const after = evaluateOutfit({ ...context, items: revisedItems });
    const gain = after.total - before.total;
    if (gain >= 4) options.push({ itemId: item.id, patch, explanation, before: before.total, after: after.total, gain });
  };

  for (const item of context.items) {
    if (context.occasion === 'interview') {
      if (item.kind === 'sneakers' || item.kind === 'boots') offer(item, { kind: 'loafers' }, 'Smart shoes may align more closely with the interview setting.');
      if (item.kind === 'tshirt') offer(item, { kind: 'shirt' }, 'A shirt or blouse may better match this setting.');
      if (item.kind === 'jeans') offer(item, { kind: 'trousers' }, 'Tailored trousers may give the outfit a more consistent level of dress.');
    }
    if (context.occasion === 'dinner') {
      if (item.kind === 'sneakers') offer(item, { kind: 'boots' }, 'Boots may bring the footwear closer to the selected dinner setting.');
      if (item.kind === 'tshirt') offer(item, { kind: 'knit' }, 'Knitwear may shift the outfit toward the selected dinner setting.');
    }
    if (context.occasion === 'casual') {
      if (item.kind === 'loafers') offer(item, { kind: 'sneakers' }, 'Trainers may better match the casual setting.');
      if (item.kind === 'trousers') offer(item, { kind: 'jeans' }, 'Jeans may fit the selected casual setting more closely.');
    }
    if (context.preference === 'minimal' && !COLORS[item.color].neutral) {
      offer(item, { color: 'navy' }, 'A quieter colour may better match your understated preference.');
    }
  }
  options.sort((a, b) => b.gain - a.gain);
  return options[0] || null;
}

export function describeChange(change, items) {
  const current = items.find(item => item.id === change.itemId);
  if (!current) return '';
  const before = `${COLORS[current.color].label.toLowerCase()} ${GARMENTS[current.kind].label.toLowerCase()}`;
  const next = { ...current, ...change.patch };
  const after = `${COLORS[next.color].label.toLowerCase()} ${GARMENTS[next.kind].label.toLowerCase()}`;
  return `${before} → ${after}`;
}
