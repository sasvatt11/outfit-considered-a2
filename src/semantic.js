/**
 * Inspectable garment relationships and input-coverage rules.
 * These are prototype assumptions, not learned or validated fashion judgements.
 */
export function assessSemanticRules(occasion, items, garments) {
  const kinds = new Set(items.map(item => item.kind));
  const has = kind => kinds.has(kind);
  const inSlot = slot => items.filter(item => garments[item.kind].slot === slot);
  const occasionConflicts = [];

  // Context changes the meaning of a garment. These rules assume the named dress code.
  if (occasion === 'dinner') {
    if (has('shorts')) occasionConflicts.push('shorts');
    if (has('sandals')) occasionConflicts.push('casual sandals or flip-flops');
    if (items.some(item => item.kind === 'tshirt' && item.pattern === 'print')) occasionConflicts.push('a printed T-shirt');
  }
  if (occasion === 'interview') {
    if (has('shorts')) occasionConflicts.push('shorts');
    else if (has('jeans')) occasionConflicts.push('jeans');
    if (has('sandals')) occasionConflicts.push('sandals');
    else if (has('sneakers')) occasionConflicts.push('trainers');
    if (has('tshirt')) occasionConflicts.push(items.some(item => item.kind === 'tshirt' && item.pattern === 'print') ? 'a printed T-shirt' : 'a T-shirt');
  }

  const pairingRules = [
    { applies: has('jeans') && has('sneakers') && occasion === 'casual', points: 14, reason: 'Jeans and trainers form a familiar casual pairing.' },
    { applies: has('shorts') && has('sandals') && occasion === 'casual', points: 14, reason: 'Shorts and sandals form a familiar casual pairing.' },
    { applies: has('trousers') && has('loafers'), points: 14, reason: 'Tailored trousers and smart shoes share a similar level of dress.' },
    { applies: has('trousers') && has('sneakers') && occasion === 'interview', points: -18, reason: 'Trainers introduce a more casual note beside tailored trousers.' },
    { applies: has('blazer') && (has('trousers') || has('skirt') || inSlot('dress').length > 0), points: 8, reason: 'The blazer relates clearly to the main outfit.' },
    { applies: items.filter(item => item.pattern !== 'solid').length > 1, points: -10, reason: 'Two visible patterns compete for attention.' }
  ];
  const pairingAdjustments = pairingRules.filter(rule => rule.applies).map(({ points, reason }) => ({ points, reason }));

  // An incomplete or ambiguous entry cannot support a confident whole-outfit score.
  // The limit is on estimate coverage, not the wearer's appearance.
  const inputChecks = [];
  const dress = inSlot('dress');
  const upper = inSlot('upper');
  const lower = inSlot('lower');
  const footwear = inSlot('footwear');
  if (!dress.length && (!upper.length || !lower.length)) {
    inputChecks.push({ id: 'missing-main', cap: 70, message: 'Outfit structure check: the main outfit needs a dress or both an upper and lower piece. This partial estimate is capped at 70/100; add any missed piece.' });
  }
  if (!footwear.length) {
    inputChecks.push({ id: 'missing-footwear', cap: 85, message: 'Outfit structure check: footwear is not entered. This estimate is capped at 85/100 until you add or confirm it.' });
  }
  if (footwear.length > 1) {
    inputChecks.push({ id: 'multiple-footwear', cap: 70, message: 'Outfit structure check: more than one footwear item is entered, so the estimate is capped at 70/100. Confirm the pair actually worn.' });
  }
  if (lower.length > 1) {
    inputChecks.push({ id: 'multiple-lower', cap: 75, message: 'Outfit structure check: multiple lower-body pieces are entered, so the estimate is capped at 75/100. Check for intentional layering or a duplicate label.' });
  }
  if (dress.length && (upper.length || lower.length)) {
    inputChecks.push({ id: 'dress-layering', cap: null, message: 'Outfit structure check: a dress and separate pieces may be intentional layering. Confirm all entered pieces are worn together.' });
  }
  return { occasionConflicts, pairingAdjustments, inputChecks };
}
