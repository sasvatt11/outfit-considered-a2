/**
 * Local, inspectable knowledge-based outfit engine.
 * These weights are design choices for this prototype, not validated fashion facts.
 */
import { assessNearFaceContrast, CONTRAST_GOALS } from './appearance.js';
import { assessSemanticRules } from './semantic.js';

export const OCCASIONS = {
  casual: { label: 'Casual', target: 1, description: 'Staying in, errands or relaxed plans. Comfort and easy layers fit here.' },
  dinner: { label: 'Smart casual', target: 2, description: 'A friend’s birthday, dinner out or a relaxed social event. Neat pieces can still feel easy.' },
  fancy: { label: 'Fancy', target: 3, description: 'A dress-up date, celebration or evening event. More polished pieces are expected.' },
  interview: { label: 'Smart', target: 3, description: 'An interview, presentation or professional setting with a conventional dress code.' }
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
  tank: { label: 'Vest or tank top', slot: 'upper', formality: 1 },
  hoodie: { label: 'Hoodie', slot: 'upper', formality: 1 },
  sweatshirt: { label: 'Sweatshirt', slot: 'upper', formality: 1 },
  polo: { label: 'Polo shirt', slot: 'upper', formality: 2 },
  shirt: { label: 'Shirt or blouse', slot: 'upper', formality: 3 },
  knit: { label: 'Knitwear', slot: 'upper', formality: 2 },
  jeans: { label: 'Jeans', slot: 'lower', formality: 1 },
  shorts: { label: 'Shorts', slot: 'lower', formality: 1 },
  tailoredShorts: { label: 'Tailored shorts', slot: 'lower', formality: 2 },
  joggers: { label: 'Joggers', slot: 'lower', formality: 1 },
  leggings: { label: 'Leggings', slot: 'lower', formality: 1 },
  cargoTrousers: { label: 'Cargo trousers', slot: 'lower', formality: 1 },
  chinos: { label: 'Chinos', slot: 'lower', formality: 2 },
  trousers: { label: 'Tailored trousers', slot: 'lower', formality: 3 },
  skirt: { label: 'Skirt', slot: 'lower', formality: 2 },
  tailoredSkirt: { label: 'Tailored skirt', slot: 'lower', formality: 3 },
  dress: { label: 'Dress', slot: 'dress', formality: 2 },
  casualDress: { label: 'Casual dress', slot: 'dress', formality: 1 },
  eveningDress: { label: 'Evening dress', slot: 'dress', formality: 3 },
  tailoredDress: { label: 'Tailored dress', slot: 'dress', formality: 3 },
  jumpsuit: { label: 'Jumpsuit', slot: 'dress', formality: 2 },
  blazer: { label: 'Blazer', slot: 'outerwear', formality: 3 },
  jacket: { label: 'Casual jacket', slot: 'outerwear', formality: 1 },
  denimJacket: { label: 'Denim jacket', slot: 'outerwear', formality: 1 },
  cardigan: { label: 'Cardigan', slot: 'outerwear', formality: 2 },
  coat: { label: 'Coat', slot: 'outerwear', formality: 2 },
  sneakers: { label: 'Trainers', slot: 'footwear', formality: 1 },
  sandals: { label: 'Casual sandals / flip-flops', slot: 'footwear', formality: 1 },
  flats: { label: 'Flats', slot: 'footwear', formality: 2 },
  dressSandals: { label: 'Dress sandals', slot: 'footwear', formality: 2 },
  boots: { label: 'Boots', slot: 'footwear', formality: 2 },
  loafers: { label: 'Loafers or smart shoes', slot: 'footwear', formality: 3 },
  heels: { label: 'Heels', slot: 'footwear', formality: 3 }
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

  const semantics = assessSemanticRules(occasion, items, GARMENTS);
  const target = OCCASIONS[occasion].target;
  const distance = items.reduce((sum, item) => sum + Math.abs(GARMENTS[item.kind].formality - target), 0) / items.length;
  const interviewConflicts = occasion === 'interview' ? semantics.occasionConflicts : [];
  const dinnerConflicts = occasion === 'dinner' ? semantics.occasionConflicts : [];
  const fancyConflicts = occasion === 'fancy' ? semantics.occasionConflicts : [];
  let occasionScore = clamp(100 - distance * 28);
  if (interviewConflicts.length >= 3) occasionScore = Math.min(occasionScore, 20);
  else if (interviewConflicts.length === 2) occasionScore = Math.min(occasionScore, 35);
  else if (interviewConflicts.length === 1) occasionScore = Math.min(occasionScore, 60);
  if (dinnerConflicts.length >= 3) occasionScore = Math.min(occasionScore, 35);
  else if (dinnerConflicts.length === 2) occasionScore = Math.min(occasionScore, 50);
  else if (dinnerConflicts.length === 1) occasionScore = Math.min(occasionScore, 70);
  if (fancyConflicts.length >= 3) occasionScore = Math.min(occasionScore, 20);
  else if (fancyConflicts.length === 2) occasionScore = Math.min(occasionScore, 40);
  else if (fancyConflicts.length === 1) occasionScore = Math.min(occasionScore, 65);
  const conflicts = semantics.occasionConflicts;
  const conflictList = conflicts.length > 1
    ? `${conflicts.slice(0, -1).join(', ')} and ${conflicts.at(-1)}`
    : conflicts[0];
  const occasionReason = conflicts.length
    ? `${conflictList[0].toUpperCase()}${conflictList.slice(1)} ${conflicts.length === 1 ? 'is' : 'are'} less suited to the selected ${OCCASIONS[occasion].label.toLowerCase()} dress level.`
    : occasionScore >= 85
      ? `Most entered pieces match the ${OCCASIONS[occasion].label.toLowerCase()} setting.`
      : `The entered garment types differ in formality from the selected ${OCCASIONS[occasion].label.toLowerCase()} setting.`;

  const pairingScore = clamp(80 + semantics.pairingAdjustments.reduce((sum, rule) => sum + rule.points, 0));
  const pairingReasons = semantics.pairingAdjustments.map(rule => rule.reason);
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
      key: 'skinContrast', label: 'Clothes near your face', score: skinRelation.score, weight: 8,
      reason: `${pieces.join(', ')} compared with the photo sample. You chose ${CONTRAST_GOALS[contrastGoal]}. This is an experimental preference rule, not a judgement of your skin.`
    });
  }
  dimensions.push({ key: 'preference', label: 'Your preference', score: preferenceScore, weight: 10, reason: preferenceReason });
  const weightedTotal = clamp(dimensions.reduce((sum, d) => sum + d.score * d.weight / 100, 0));
  const interviewCap = interviewConflicts.length >= 3 ? 30 : interviewConflicts.length === 2 ? 45 : interviewConflicts.length === 1 ? 65 : null;
  const dinnerCap = dinnerConflicts.length >= 3 ? 50 : dinnerConflicts.length === 2 ? 60 : dinnerConflicts.length === 1 ? 75 : null;
  const fancyCap = fancyConflicts.length >= 3 ? 40 : fancyConflicts.length === 2 ? 55 : fancyConflicts.length === 1 ? 75 : null;
  const occasionCap = occasion === 'interview' ? interviewCap : occasion === 'dinner' ? dinnerCap : fancyCap;
  const inputCap = semantics.inputChecks.reduce((lowest, check) => check.cap === null ? lowest : Math.min(lowest, check.cap), 100);
  const cap = Math.min(occasionCap ?? 100, inputCap) === 100 ? null : Math.min(occasionCap ?? 100, inputCap);
  const total = cap === null ? weightedTotal : Math.min(weightedTotal, cap);
  const notes = [];
  if (occasionCap !== null && weightedTotal > occasionCap) notes.push(`The weighted components total ${weightedTotal}/100, but the selected ${OCCASIONS[occasion].label.toLowerCase()} dress level limits the total to ${occasionCap}/100. Expectations vary by place and person.`);
  if (skinRgb && contrastGoal !== 'none' && !skinRelation) notes.push('Add or confirm an upper-body, outerwear or dress colour to include the selected photo patch in scoring.');
  notes.push(...semantics.inputChecks.map(check => check.message));
  return { total, dimensions, notes, weightedTotal, cap, semanticChecks: semantics.inputChecks };
}

export function applyChange(items, change) {
  return items.map(item => item.id === change.itemId ? { ...item, ...change.patch } : item);
}

export function suggestChange(context) {
  const before = evaluateOutfit(context);
  if (before.total === null || before.total >= 88) return null;
  if (before.semanticChecks.some(check => check.cap !== null)) return null;
  const options = [];
  const offer = (item, patch, explanation) => {
    const revisedItems = applyChange(context.items, { itemId: item.id, patch });
    const after = evaluateOutfit({ ...context, items: revisedItems });
    const gain = after.total - before.total;
    if (gain >= 4) options.push({ itemId: item.id, patch, explanation, before: before.total, after: after.total, gain });
  };

  for (const item of context.items) {
    if (context.occasion === 'interview') {
      if (item.kind === 'sneakers' || item.kind === 'boots' || item.kind === 'sandals') offer(item, { kind: 'loafers' }, 'Smart shoes may align more closely with the selected professional dress level.');
      if (['tshirt', 'tank', 'hoodie', 'sweatshirt'].includes(item.kind)) offer(item, { kind: 'shirt', pattern: 'solid' }, 'A plain shirt or blouse may better match this setting.');
      if (['jeans', 'shorts', 'tailoredShorts', 'joggers', 'leggings', 'cargoTrousers'].includes(item.kind)) offer(item, { kind: 'trousers', pattern: 'solid' }, 'Tailored trousers may give the outfit a more consistent level of dress.');
      if (item.kind === 'eveningDress') offer(item, { kind: 'tailoredDress' }, 'A tailored dress may suit a professional setting more closely.');
    }
    if (context.occasion === 'dinner') {
      if (item.kind === 'sandals') offer(item, { kind: 'boots' }, 'Boots may bring the footwear closer to the selected smart-casual level.');
      if (['tshirt', 'hoodie', 'sweatshirt', 'tank'].includes(item.kind)) offer(item, { kind: 'knit' }, 'Knitwear may shift the outfit toward the selected smart-casual level.');
      if (['shorts', 'joggers', 'leggings', 'cargoTrousers'].includes(item.kind)) offer(item, { kind: 'chinos' }, 'Chinos may give the outfit a neater, still relaxed level of dress.');
    }
    if (context.occasion === 'fancy') {
      if (item.kind === 'sneakers' || item.kind === 'sandals') offer(item, { kind: 'loafers' }, 'Dressier shoes may better fit the selected fancy level.');
      if (['tshirt', 'tank', 'hoodie', 'sweatshirt', 'polo'].includes(item.kind)) offer(item, { kind: 'shirt', pattern: 'solid' }, 'A dressier top may fit the selected fancy level.');
      if (['jeans', 'shorts', 'joggers', 'leggings', 'cargoTrousers'].includes(item.kind)) offer(item, { kind: 'trousers', pattern: 'solid' }, 'Tailored trousers may fit the selected fancy level.');
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
