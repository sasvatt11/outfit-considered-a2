/**
 * Local, inspectable knowledge-based outfit engine.
 * These weights are design choices for this prototype, not validated fashion facts.
 */
import { assessNearFaceContrast, CONTRAST_GOALS } from './appearance.js';

export const OCCASIONS = {
  casual: { label: 'Casual day', target: 1 },
  dinner: { label: 'Dinner out (smart casual)', target: 2 },
  interview: { label: 'Interview (conventional)', target: 3 }
};

export const SEASONS = {
  none: 'No season selected',
  spring: 'Spring',
  summer: 'Summer',
  autumn: 'Autumn',
  winter: 'Winter'
};

export const GARMENTS = {
  tshirt: { label: 'T-shirt', slot: 'upper', formality: 1 },
  shirt: { label: 'Shirt or blouse', slot: 'upper', formality: 3 },
  knit: { label: 'Knitwear', slot: 'upper', formality: 2 },
  jeans: { label: 'Jeans', slot: 'lower', formality: 1 },
  shorts: { label: 'Shorts', slot: 'lower', formality: 1 },
  trousers: { label: 'Tailored trousers', slot: 'lower', formality: 3 },
  skirt: { label: 'Skirt', slot: 'lower', formality: 2 },
  dress: { label: 'Dress', slot: 'dress', formality: 2 },
  blazer: { label: 'Blazer', slot: 'outerwear', formality: 3 },
  jacket: { label: 'Casual jacket', slot: 'outerwear', formality: 1 },
  sneakers: { label: 'Trainers', slot: 'footwear', formality: 1 },
  sandals: { label: 'Casual sandals / flip-flops', slot: 'footwear', formality: 1 },
  dressSandals: { label: 'Dress sandals', slot: 'footwear', formality: 2 },
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

export const PREFERENCES = {
  none: 'No colour or style direction',
  minimal: 'Understated',
  expressive: 'Bright or expressive',
  earth: 'Earth tones',
  cool: 'Cool tones'
};

const clamp = value => Math.max(0, Math.min(100, Math.round(value)));

function checkItems(items) {
  return Array.isArray(items) && items.every(item =>
    item && typeof item.id === 'string' && GARMENTS[item.kind] && COLORS[item.color] && PATTERNS[item.pattern]
  );
}

export function evaluateOutfit({ occasion, preference = 'none', season = 'none', skinRgb = null, contrastGoal = 'none', items }) {
  if (!OCCASIONS[occasion]) throw new Error('Choose a supported occasion.');
  if (!PREFERENCES[preference]) throw new Error('Choose a supported preference.');
  if (!SEASONS[season]) throw new Error('Choose a supported season.');
  if (!CONTRAST_GOALS[contrastGoal]) throw new Error('Choose a supported contrast goal.');
  if (!checkItems(items)) throw new Error('Review the garment details before scoring.');
  if (items.length < 2) {
    return { total: null, dimensions: [], notes: ['Add at least two visible garments to receive an estimate.'] };
  }

  const kinds = items.map(item => item.kind);
  const target = OCCASIONS[occasion].target;
  const distance = items.reduce((sum, item) => sum + Math.abs(GARMENTS[item.kind].formality - target), 0) / items.length;
  const interviewConflicts = [];
  const dinnerConflicts = [];
  if (occasion === 'dinner') {
    if (kinds.includes('shorts')) dinnerConflicts.push('shorts');
    if (kinds.includes('sandals')) dinnerConflicts.push('casual sandals or flip-flops');
    if (items.some(item => item.kind === 'tshirt' && item.pattern === 'print')) dinnerConflicts.push('a printed T-shirt');
  }
  if (occasion === 'interview') {
    if (kinds.includes('shorts')) interviewConflicts.push('shorts');
    else if (kinds.includes('jeans')) interviewConflicts.push('jeans');
    if (kinds.includes('sandals')) interviewConflicts.push('sandals');
    else if (kinds.includes('sneakers')) interviewConflicts.push('trainers');
    if (kinds.includes('tshirt')) interviewConflicts.push(items.some(item => item.kind === 'tshirt' && item.pattern === 'print') ? 'a printed T-shirt' : 'a T-shirt');
  }
  let occasionScore = clamp(100 - distance * 28);
  if (interviewConflicts.length >= 3) occasionScore = Math.min(occasionScore, 20);
  else if (interviewConflicts.length === 2) occasionScore = Math.min(occasionScore, 35);
  else if (interviewConflicts.length === 1) occasionScore = Math.min(occasionScore, 60);
  if (dinnerConflicts.length >= 3) occasionScore = Math.min(occasionScore, 35);
  else if (dinnerConflicts.length === 2) occasionScore = Math.min(occasionScore, 50);
  else if (dinnerConflicts.length === 1) occasionScore = Math.min(occasionScore, 70);
  const conflicts = occasion === 'interview' ? interviewConflicts : dinnerConflicts;
  const conflictList = conflicts.length > 1
    ? `${conflicts.slice(0, -1).join(', ')} and ${conflicts.at(-1)}`
    : conflicts[0];
  const occasionReason = conflicts.length
    ? `${conflictList[0].toUpperCase()}${conflictList.slice(1)} ${conflicts.length === 1 ? 'is' : 'are'} less suited to ${occasion === 'interview' ? 'a conventional interview' : 'a smart-casual dinner'}.`
    : occasionScore >= 85
      ? `Most entered pieces match the ${OCCASIONS[occasion].label.toLowerCase()} setting.`
      : `The entered garment types differ in formality from the selected ${OCCASIONS[occasion].label.toLowerCase()} setting.`;

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
  if (kinds.includes('shorts') && kinds.includes('sandals') && occasion === 'casual') {
    pairing += 14;
    pairingReasons.push('Shorts and sandals form a familiar casual pairing.');
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
  let colourScore = hueCount === 0 ? 80 : hueCount === 1 ? 85 : hueCount === 2 ? 79 : 68;
  const seasonalPalettes = {
    spring: new Set(['cream', 'beige', 'pink', 'blue', 'green', 'yellow', 'orange']),
    summer: new Set(['white', 'cream', 'beige', 'blue', 'green', 'pink', 'yellow']),
    autumn: new Set(['cream', 'beige', 'brown', 'orange', 'green', 'navy']),
    winter: new Set(['black', 'white', 'grey', 'navy', 'blue', 'red', 'purple'])
  };
  const seasonalMatches = season === 'none' ? 0 : items.filter(item => seasonalPalettes[season].has(item.color)).length;
  if (season !== 'none') colourScore += Math.round(4 * seasonalMatches / items.length);
  const colourReason = `${hueCount === 0 ? 'The entered colours form a neutral palette.' : hueCount <= 2 ? 'The entered colours use a limited number of accent hues.' : 'Several accent hues make the palette more varied.'}${season === 'none' ? '' : ` ${seasonalMatches} of ${items.length} colours follow the optional ${SEASONS[season].toLowerCase()} palette cue; this adds at most four points to this component.`}`;

  const expressiveCount = items.filter(item => item.pattern !== 'solid' || !COLORS[item.color].neutral).length;
  const share = expressiveCount / items.length;
  let preferenceScore = 75;
  let preferenceReason = 'No style direction was specified, so this component uses a fixed 75/100.';
  if (preference === 'minimal') {
    preferenceScore = clamp(100 - share * 45);
    preferenceReason = share <= 0.25 ? 'The outfit follows your understated preference.' : 'Several selected pieces are more expressive than your stated preference.';
  }
  if (preference === 'expressive') {
    preferenceScore = clamp(55 + share * 45);
    preferenceReason = share >= 0.5 ? 'Colour or pattern supports your expressive preference.' : 'The outfit is quieter than your stated preference.';
  }
  if (preference === 'earth' || preference === 'cool') {
    const earth = new Set(['cream', 'beige', 'brown', 'orange', 'green']);
    const cool = new Set(['black', 'white', 'grey', 'navy', 'blue', 'purple', 'pink']);
    const palette = preference === 'earth' ? earth : cool;
    const matches = items.filter(item => palette.has(item.color)).length;
    preferenceScore = clamp(60 + 40 * matches / items.length);
    preferenceReason = `${matches} of ${items.length} selected colours follow your ${preference === 'earth' ? 'earth-tone' : 'cool-tone'} direction. This reflects your choice, not a rule about skin tone.`;
  }

  const skinRelation = skinRgb && contrastGoal !== 'none' ? assessNearFaceContrast(skinRgb, items, COLORS, GARMENTS, contrastGoal) : null;
  const dimensions = [
    { key: 'occasion', label: 'Occasion fit', score: occasionScore, weight: 55, reason: occasionReason },
    { key: 'pairing', label: 'Garment pairing', score: pairingScore, weight: 20, reason: pairingReasons.join(' ') },
    { key: 'colour', label: 'Colour balance', score: clamp(colourScore), weight: skinRelation ? 7 : 15, reason: colourReason }
  ];
  if (skinRelation) {
    const pieces = skinRelation.comparisons.map(entry => {
      const piece = items.find(item => item.id === entry.id);
      return `${COLORS[piece.color].label.toLowerCase()} ${GARMENTS[piece.kind].label.toLowerCase()} (${entry.contrast})`;
    });
    dimensions.push({
      key: 'skinContrast', label: 'Colour near your face', score: skinRelation.score, weight: 8,
      reason: `${pieces.join(', ')} compared with the photo sample. Your chosen goal is ${CONTRAST_GOALS[contrastGoal].toLowerCase()}. This is an experimental preference rule, not a judgement of your skin.`
    });
  }
  dimensions.push({ key: 'preference', label: 'Your preference', score: preferenceScore, weight: 10, reason: preferenceReason });
  const weightedTotal = clamp(dimensions.reduce((sum, d) => sum + d.score * d.weight / 100, 0));
  const interviewCap = interviewConflicts.length >= 3 ? 30 : interviewConflicts.length === 2 ? 45 : interviewConflicts.length === 1 ? 65 : null;
  const dinnerCap = dinnerConflicts.length >= 3 ? 50 : dinnerConflicts.length === 2 ? 60 : dinnerConflicts.length === 1 ? 75 : null;
  const cap = occasion === 'interview' ? interviewCap : dinnerCap;
  const total = cap === null ? weightedTotal : Math.min(weightedTotal, cap);
  const notes = [];
  if (interviewCap !== null && weightedTotal > interviewCap) notes.push(`The weighted components total ${weightedTotal}/100, but interview suitability limits the total to ${interviewCap}/100. This assumes a conventional interview dress code.`);
  if (dinnerCap !== null && weightedTotal > dinnerCap) notes.push(`The weighted components total ${weightedTotal}/100, but smart-casual dinner suitability limits the total to ${dinnerCap}/100. A very casual venue may have different expectations.`);
  if (skinRgb && contrastGoal !== 'none' && !skinRelation) notes.push('Add or confirm an upper-body, outerwear or dress colour to include the selected photo patch in scoring.');
  const slots = new Set(items.map(item => GARMENTS[item.kind].slot));
  if (!slots.has('footwear')) notes.push('Footwear is not included; this estimate covers only the visible pieces you entered.');
  if (!slots.has('dress') && (!slots.has('upper') || !slots.has('lower'))) notes.push('The main outfit may be incomplete in this photo.');
  return { total, dimensions, notes, weightedTotal, cap };
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
      if (item.kind === 'sneakers' || item.kind === 'boots' || item.kind === 'sandals') offer(item, { kind: 'loafers' }, 'Smart shoes may align more closely with the interview setting.');
      if (item.kind === 'tshirt') offer(item, { kind: 'shirt', pattern: 'solid' }, 'A plain shirt or blouse may better match this setting.');
      if (item.kind === 'jeans' || item.kind === 'shorts') offer(item, { kind: 'trousers', pattern: 'solid' }, 'Tailored trousers may give the outfit a more consistent level of dress.');
    }
    if (context.occasion === 'dinner') {
      if (item.kind === 'sneakers' || item.kind === 'sandals') offer(item, { kind: 'boots' }, 'Boots may bring the footwear closer to the selected dinner setting.');
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
