import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOutfit, suggestChange, applyChange } from '../src/engine.js';
import { nearestColour } from '../src/colour.js';
import { comparePhotoSwatch, describePhotoPatch } from '../src/palette.js';

const casual = [
  { id: '1', kind: 'tshirt', color: 'blue', pattern: 'solid' },
  { id: '2', kind: 'jeans', color: 'navy', pattern: 'solid' },
  { id: '3', kind: 'sneakers', color: 'white', pattern: 'solid' }
];

test('the same outfit is interpreted differently when the user changes occasion', () => {
  const day = evaluateOutfit({ occasion: 'casual', items: casual });
  const interview = evaluateOutfit({ occasion: 'interview', items: casual });
  assert.ok(day.total > interview.total);
  assert.ok(day.dimensions.find(d => d.key === 'occasion').score > interview.dimensions.find(d => d.key === 'occasion').score);
});

test('a suggested swap is reversible and its displayed estimate matches the engine', () => {
  const context = { occasion: 'interview', items: casual };
  const suggestion = suggestChange(context);
  assert.ok(suggestion && suggestion.gain >= 4);
  const changed = applyChange(casual, suggestion);
  assert.equal(evaluateOutfit({ ...context, items: changed }).total, suggestion.after);
  assert.deepEqual(casual, context.items);
});

test('a strong outfit does not receive an unnecessary suggestion', () => {
  const items = [
    { id: '1', kind: 'shirt', color: 'white', pattern: 'solid' },
    { id: '2', kind: 'trousers', color: 'navy', pattern: 'solid' },
    { id: '3', kind: 'loafers', color: 'black', pattern: 'solid' },
    { id: '4', kind: 'blazer', color: 'navy', pattern: 'solid' }
  ];
  assert.equal(suggestChange({ occasion: 'interview', items }), null);
});

test('incomplete input does not receive a misleading numeric score', () => {
  const result = evaluateOutfit({ occasion: 'casual', items: [casual[0]] });
  assert.equal(result.total, null);
  assert.match(result.notes[0], /at least two/);
});

test('photo colour classification identifies common sample colours', () => {
  assert.equal(nearestColour([245, 245, 240]), 'white');
  assert.equal(nearestColour([38, 61, 89]), 'navy');
});

test('shorts and sandals can be scored and revised for a different occasion', () => {
  const items = [
    { id: '1', kind: 'tshirt', color: 'brown', pattern: 'print' },
    { id: '2', kind: 'shorts', color: 'cream', pattern: 'solid' },
    { id: '3', kind: 'sandals', color: 'black', pattern: 'solid' }
  ];
  const casualResult = evaluateOutfit({ occasion: 'casual', items });
  const interviewResult = evaluateOutfit({ occasion: 'interview', items });
  assert.ok(casualResult.total > interviewResult.total);
  const suggestion = suggestChange({ occasion: 'interview', items });
  assert.ok(suggestion && suggestion.gain >= 4);
});

test('a coordinated palette cannot mask three interview garment conflicts', () => {
  const items = [
    { id: '1', kind: 'tshirt', color: 'cream', pattern: 'print' },
    { id: '2', kind: 'shorts', color: 'white', pattern: 'solid' },
    { id: '3', kind: 'sandals', color: 'black', pattern: 'solid' }
  ];
  const result = evaluateOutfit({ occasion: 'interview', items, season: 'summer' });
  assert.equal(result.total, 30);
  assert.equal(result.cap, 30);
  assert.match(result.dimensions[0].reason, /shorts.*sandals.*printed T-shirt/i);
  assert.match(result.notes[0], /limits the total/);
  const next = suggestChange({ occasion: 'interview', items, season: 'summer' });
  assert.ok(next && next.after > result.total);
});

test('a printed T-shirt, shorts and sandals do not receive a high smart-casual dinner score', () => {
  const items = [
    { id: '1', kind: 'tshirt', color: 'cream', pattern: 'print' },
    { id: '2', kind: 'shorts', color: 'white', pattern: 'solid' },
    { id: '3', kind: 'sandals', color: 'black', pattern: 'solid' }
  ];
  const context = { occasion: 'dinner', season: 'autumn', preference: 'earth', skinRgb: [180, 130, 105], items };
  const result = evaluateOutfit(context);
  assert.equal(result.total, 50);
  assert.equal(result.cap, 50);
  assert.match(result.dimensions[0].reason, /shorts.*casual sandals.*printed T-shirt.*smart-casual dinner/i);
  assert.match(result.notes[0], /smart-casual dinner suitability/);
  const suggestion = suggestChange(context);
  assert.ok(suggestion && suggestion.after > result.total);
});

test('smart-casual dinner clothes are not capped', () => {
  const items = [
    { id: '1', kind: 'knit', color: 'cream', pattern: 'solid' },
    { id: '2', kind: 'trousers', color: 'navy', pattern: 'solid' },
    { id: '3', kind: 'loafers', color: 'brown', pattern: 'solid' }
  ];
  const result = evaluateOutfit({ occasion: 'dinner', items });
  assert.equal(result.cap, null);
  assert.ok(result.total > 75);
});

test('dress sandals are not treated as casual flip-flops', () => {
  const items = [
    { id: '1', kind: 'dress', color: 'navy', pattern: 'solid' },
    { id: '2', kind: 'dressSandals', color: 'black', pattern: 'solid' }
  ];
  const result = evaluateOutfit({ occasion: 'dinner', items });
  assert.equal(result.cap, null);
});

test('season is a small palette cue, never a substitute for occasion', () => {
  const noSeason = evaluateOutfit({ occasion: 'interview', items: casual });
  const summer = evaluateOutfit({ occasion: 'interview', season: 'summer', items: casual });
  assert.equal(noSeason.total, summer.total);
  assert.ok(summer.dimensions[2].score - noSeason.dimensions[2].score <= 4);
});

test('chosen earth-tone direction affects only the preference component', () => {
  const items = [
    { id: '1', kind: 'knit', color: 'orange', pattern: 'solid' },
    { id: '2', kind: 'trousers', color: 'beige', pattern: 'solid' },
    { id: '3', kind: 'boots', color: 'brown', pattern: 'solid' }
  ];
  const neutral = evaluateOutfit({ occasion: 'dinner', preference: 'none', items });
  const earth = evaluateOutfit({ occasion: 'dinner', preference: 'earth', items });
  assert.equal(neutral.dimensions.find(d => d.key === 'occasion').score, earth.dimensions.find(d => d.key === 'occasion').score);
  assert.ok(earth.dimensions.find(d => d.key === 'preference').score > neutral.dimensions.find(d => d.key === 'preference').score);
});

test('photo swatch comparison is descriptive and keeps garment input intact', () => {
  const compared = comparePhotoSwatch([180, 130, 105], casual);
  assert.equal(compared.length, casual.length);
  assert.ok(compared.every(entry => ['soft', 'balanced', 'bold'].includes(entry.contrast)));
  assert.equal(casual[0].color, 'blue');
  assert.match(describePhotoPatch([180, 130, 105]), /photo.*lighting/i);
});

test('a selected skin-area colour and contrast goal affect a suitable outfit score', () => {
  const items = [
    { id: '1', kind: 'shirt', color: 'white', pattern: 'solid' },
    { id: '2', kind: 'trousers', color: 'navy', pattern: 'solid' },
    { id: '3', kind: 'loafers', color: 'black', pattern: 'solid' }
  ];
  const base = evaluateOutfit({ occasion: 'interview', items });
  const balanced = evaluateOutfit({ occasion: 'interview', items, skinRgb: [180, 130, 105], contrastGoal: 'balanced' });
  const soft = evaluateOutfit({ occasion: 'interview', items, skinRgb: [180, 130, 105], contrastGoal: 'soft' });
  assert.equal(base.dimensions.length, 4);
  assert.equal(balanced.dimensions.length, 5);
  assert.equal(balanced.dimensions.find(entry => entry.key === 'skinContrast').weight, 8);
  assert.notEqual(balanced.total, soft.total);
});

test('no contrast goal keeps a sampled photo patch out of scoring', () => {
  const items = [
    { id: '1', kind: 'shirt', color: 'white', pattern: 'solid' },
    { id: '2', kind: 'trousers', color: 'navy', pattern: 'solid' },
    { id: '3', kind: 'loafers', color: 'black', pattern: 'solid' }
  ];
  const base = evaluateOutfit({ occasion: 'interview', items });
  const sampled = evaluateOutfit({ occasion: 'interview', items, skinRgb: [180, 130, 105], contrastGoal: 'none' });
  assert.equal(sampled.total, base.total);
  assert.equal(sampled.dimensions.length, 4);
  assert.equal(sampled.dimensions.find(entry => entry.key === 'colour').weight, 15);
  assert.equal(sampled.dimensions.find(entry => entry.key === 'skinContrast'), undefined);
});

test('skin-colour preference cannot lift a conventional interview cap', () => {
  const items = [
    { id: '1', kind: 'tshirt', color: 'cream', pattern: 'print' },
    { id: '2', kind: 'shorts', color: 'white', pattern: 'solid' },
    { id: '3', kind: 'sandals', color: 'black', pattern: 'solid' }
  ];
  const result = evaluateOutfit({ occasion: 'interview', items, skinRgb: [180, 130, 105], contrastGoal: 'bold' });
  assert.equal(result.total, 30);
  assert.equal(result.dimensions.find(entry => entry.key === 'skinContrast').weight, 8);
});

test('a shirt and blazer alone cannot receive a confident whole-outfit score', () => {
  const partial = [
    { id: '1', kind: 'shirt', color: 'white', pattern: 'solid' },
    { id: '2', kind: 'blazer', color: 'navy', pattern: 'solid' }
  ];
  const result = evaluateOutfit({ occasion: 'interview', items: partial });
  assert.equal(result.cap, 70);
  assert.equal(result.total, 70);
  assert.ok(result.semanticChecks.some(check => check.id === 'missing-main'));
  assert.ok(result.semanticChecks.some(check => check.id === 'missing-footwear'));
  assert.equal(suggestChange({ occasion: 'interview', items: partial }), null);
  const complete = evaluateOutfit({ occasion: 'interview', items: [
    ...partial,
    { id: '3', kind: 'trousers', color: 'navy', pattern: 'solid' },
    { id: '4', kind: 'loafers', color: 'black', pattern: 'solid' }
  ] });
  assert.equal(complete.cap, null);
  assert.ok(complete.total > result.total);
});

test('duplicate footwear limits confidence until the entered outfit is corrected', () => {
  const result = evaluateOutfit({ occasion: 'casual', items: [
    ...casual,
    { id: '4', kind: 'sandals', color: 'black', pattern: 'solid' }
  ] });
  assert.equal(result.cap, 70);
  assert.ok(result.semanticChecks.some(check => check.id === 'multiple-footwear'));
  assert.equal(suggestChange({ occasion: 'casual', items: [...casual, { id: '4', kind: 'sandals', color: 'black', pattern: 'solid' }] }), null);
});

test('dress layering is flagged for confirmation without an automatic style penalty', () => {
  const dress = { id: '1', kind: 'dress', color: 'navy', pattern: 'solid' };
  const blazer = { id: '2', kind: 'blazer', color: 'black', pattern: 'solid' };
  const shoes = { id: '3', kind: 'loafers', color: 'black', pattern: 'solid' };
  const layered = evaluateOutfit({ occasion: 'dinner', items: [dress, blazer, shoes] });
  assert.equal(layered.cap, null);
  assert.equal(layered.semanticChecks.length, 0);
  const ambiguous = evaluateOutfit({ occasion: 'dinner', items: [dress, blazer, shoes, { id: '4', kind: 'trousers', color: 'navy', pattern: 'solid' }] });
  assert.ok(ambiguous.semanticChecks.some(check => check.id === 'dress-layering'));
  assert.equal(ambiguous.cap, null);
  assert.ok(ambiguous.dimensions.find(d => d.key === 'pairing').score >= layered.dimensions.find(d => d.key === 'pairing').score);
});
