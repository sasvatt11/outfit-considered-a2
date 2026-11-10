import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateOutfit, suggestChange, applyChange } from '../src/engine.js';
import { nearestColour } from '../src/colour.js';
import { comparePhotoSwatch } from '../src/palette.js';

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
  assert.ok(compared.every(entry => ['soft', 'moderate', 'strong'].includes(entry.contrast)));
  assert.equal(casual[0].color, 'blue');
});
