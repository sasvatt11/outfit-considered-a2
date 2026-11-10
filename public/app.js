import { OCCASIONS, SEASONS, GARMENTS, COLORS, PATTERNS, PREFERENCES, evaluateOutfit, suggestChange, applyChange, describeChange } from '/src/engine.js';
import { sampleImageColour } from '/src/colour.js';
import { comparePhotoSwatch } from '/src/palette.js';
import { suggestGarments } from '/src/vision.js';

const $ = id => document.getElementById(id);
const elements = {
  photoArea: $('photo-area'), photo: $('outfit-image'), photoBadge: $('photo-badge'),
  photoMessage: $('photo-message'), photoInput: $('photo-input'), sampleChoices: document.querySelector('.sample-choices'),
  sampleMarker: $('sample-marker'), itemList: $('item-list'), itemCount: $('item-count'),
  addItem: $('add-item'), scoreButton: $('score-button'), inputError: $('input-error'),
  resultEmpty: $('result-empty'), resultContent: $('result-content'), scoreValue: $('score-value'),
  scoreContext: $('score-context'), dimensions: $('dimensions'), notes: $('score-notes'),
  suggestion: $('suggestion-content'), preference: $('preference'), season: $('season'), selfViewResult: $('self-view-result'),
  suggestButton: $('suggest-button'), visionStatus: $('vision-status'), visionPanel: $('vision-panel'),
  visionList: $('vision-list'), applyVision: $('apply-vision'), skinButton: $('skin-button'), skinOutput: $('skin-output')
};

const state = {
  occasion: 'casual', preference: 'none', season: 'none', items: [], photoUrl: null, source: null,
  scored: false, samplingId: null, skinPicking: false, skinRgb: null,
  previewOriginal: null, selfView: 'uncertain', recordedView: null, nextId: 1
};

const samples = {
  casual: { src: '/assets/sample-casual.webp', alt: 'AI-generated sample: blue T-shirt, dark jeans and white trainers.', occasion: 'casual', preference: 'none', season: 'none', items: [['tshirt', 'blue'], ['jeans', 'navy'], ['sneakers', 'white']] },
  interview: { src: '/assets/sample-interview.webp', alt: 'AI-generated sample: adult woman in a cream blouse, charcoal blazer, navy trousers and black loafers.', occasion: 'interview', preference: 'none', season: 'none', items: [['shirt', 'cream'], ['blazer', 'grey'], ['trousers', 'navy'], ['loafers', 'black']] },
  earth: { src: '/assets/sample-earth.webp', alt: 'AI-generated sample: adult person in a rust sweater, brown jacket, beige trousers and brown boots.', occasion: 'dinner', preference: 'earth', season: 'autumn', items: [['knit', 'orange'], ['jacket', 'brown'], ['trousers', 'beige'], ['boots', 'brown']] }
};

function item(kind = 'tshirt', color = null, pattern = 'solid') {
  return { id: String(state.nextId++), kind, color, pattern };
}

function options(dictionary, selected, label = value => value.label) {
  return Object.entries(dictionary).map(([key, value]) => `<option value="${key}"${key === selected ? ' selected' : ''}>${label(value)}</option>`).join('');
}

function setPhoto(src, source, alt) {
  if (state.photoUrl?.startsWith('blob:')) URL.revokeObjectURL(state.photoUrl);
  state.photoUrl = src;
  state.source = source;
  elements.photo.src = src;
  elements.photo.alt = alt;
  elements.photo.hidden = false;
  $('empty-photo').hidden = true;
  elements.photoArea.classList.remove('empty', 'sampling');
  elements.photoBadge.hidden = false;
  elements.photoBadge.textContent = source === 'sample' ? 'Sample image · AI generated' : 'Your photo · local only';
  elements.sampleMarker.hidden = true;
  state.samplingId = null;
  state.skinPicking = false;
  state.skinRgb = null;
  state.recordedView = null;
  document.querySelectorAll('input[name="self-view"]').forEach(input => { input.disabled = false; });
  elements.skinOutput.hidden = true;
  elements.suggestButton.disabled = false;
  elements.skinButton.disabled = false;
  elements.visionPanel.hidden = true;
  elements.visionList.replaceChildren();
  elements.visionStatus.textContent = 'Optional. First use downloads about 160 MB of free model files; your photo stays in this browser. Results are guesses, not verified labels.';
  state.scored = false;
  state.previewOriginal = null;
  elements.resultEmpty.hidden = false;
  elements.resultContent.hidden = true;
  elements.photoInput.value = '';
}

function photoFeedback(message, isError = false) {
  elements.photoMessage.textContent = message;
  elements.photoMessage.classList.toggle('photo-error', isError);
  elements.photoMessage.setAttribute('role', isError ? 'alert' : 'status');
}

function loadSample(sampleId) {
  const sample = samples[sampleId];
  if (!sample) return;
  setPhoto(sample.src, 'sample', sample.alt);
  state.items = sample.items.map(([kind, color]) => item(kind, color));
  state.occasion = sample.occasion;
  state.preference = sample.preference;
  state.season = sample.season;
  state.selfView = 'uncertain';
  document.querySelector(`[name="occasion"][value="${sample.occasion}"]`).checked = true;
  document.querySelector('[name="self-view"][value="uncertain"]').checked = true;
  elements.preference.value = sample.preference;
  elements.season.value = sample.season;
  photoFeedback('AI-generated sample image and its garment labels are provided for demonstration. You can edit every label or try the vision model separately.');
  renderItems();
}

async function imageFormat(file) {
  const bytes = new Uint8Array(await file.slice(0, 16).arrayBuffer());
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((byte, index) => bytes[index] === byte)) return 'PNG';
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'JPEG';
  const header = String.fromCharCode(...bytes);
  if (header.startsWith('RIFF') && header.slice(8, 12) === 'WEBP') return 'WebP';
  if (header.slice(4, 8) === 'ftyp' && /^(heic|heix|hevc|hevx|heim|heis|mif1|msf1)$/.test(header.slice(8, 12))) return 'HEIC';
  return 'unknown';
}

async function loadUpload(file) {
  if (!file) return;
  elements.photoInput.value = '';
  if (file.size > 5 * 1024 * 1024) {
    photoFeedback('That image is over 5 MB. Resize or export a smaller copy, then try again.', true);
    return;
  }
  let format;
  try {
    format = await imageFormat(file);
  } catch {
    photoFeedback('The image could not be read. Try exporting it again as PNG or JPEG.', true);
    return;
  }
  if (format === 'HEIC') {
    photoFeedback('This file contains HEIC image data even if its name ends in .png. Export a real PNG or JPEG and try again.', true);
    return;
  }
  if (format === 'unknown') {
    photoFeedback('That file is not a readable JPEG, PNG or WebP image. Export it in one of those formats and try again.', true);
    return;
  }
  const url = URL.createObjectURL(file);
  try {
    const preview = new Image();
    preview.src = url;
    await preview.decode();
  } catch {
    URL.revokeObjectURL(url);
    photoFeedback(`This ${format} image could not be displayed. Try exporting a new copy.`, true);
    return;
  }
  setPhoto(url, 'upload', 'Your uploaded outfit photo.');
  state.items = [];
  state.selfView = 'uncertain';
  document.querySelector('[name="self-view"][value="uncertain"]').checked = true;
  photoFeedback(`Photo added locally. Current context: ${OCCASIONS[state.occasion].label}; season: ${SEASONS[state.season]}; style: ${PREFERENCES[state.preference]}. Check or change these, then review garment suggestions before scoring.`);
  renderItems();
}

function renderSkinComparison() {
  if (!state.skinRgb) return;
  const compared = comparePhotoSwatch(state.skinRgb, state.items);
  const swatch = document.createElement('i');
  swatch.className = 'sampled-skin-swatch';
  swatch.style.background = `rgb(${state.skinRgb.join(',')})`;
  swatch.setAttribute('aria-hidden', 'true');
  const copy = document.createElement('span');
  copy.textContent = compared.length
    ? `Photo colour sampled. ${compared.map(entry => {
      const piece = state.items.find(item => item.id === entry.id);
      return `${entry.label} ${GARMENTS[piece.kind].label.toLowerCase()}: ${entry.contrast}`;
    }).join('; ')} light/dark contrast. This does not change the score.`
    : 'Photo colour sampled. Add garment colours to compare light/dark contrast. This does not change the score.';
  elements.skinOutput.replaceChildren(swatch, copy);
  elements.skinOutput.hidden = false;
}

function renderVisionSuggestions(suggestions) {
  elements.visionList.replaceChildren();
  for (const [index, suggestion] of suggestions.entries()) {
    const row = document.createElement('div');
    row.className = 'vision-row';
    const check = document.createElement('input');
    check.type = 'checkbox';
    check.checked = true;
    check.setAttribute('aria-label', `Use suggestion for ${suggestion.zone}`);
    const label = document.createElement('span');
    label.textContent = suggestion.zone;
    const select = document.createElement('select');
    select.setAttribute('aria-label', `Suggested garment for ${suggestion.zone}`);
    select.innerHTML = options(GARMENTS, suggestion.kind);
    row.dataset.zone = String(index);
    row.append(check, label, select);
    elements.visionList.append(row);
  }
  elements.visionPanel.hidden = suggestions.length === 0;
}

async function runVision() {
  if (!state.photoUrl || elements.suggestButton.disabled) return;
  const currentPhoto = state.photoUrl;
  let active = true;
  elements.suggestButton.disabled = true;
  elements.visionStatus.textContent = 'Loading the free vision model. The first use downloads about 160 MB and may take a few minutes…';
  try {
    const suggestions = await suggestGarments(elements.photo, message => { if (active && state.photoUrl === currentPhoto) elements.visionStatus.textContent = message; });
    if (state.photoUrl !== currentPhoto) return;
    renderVisionSuggestions(suggestions);
    elements.visionStatus.textContent = 'Suggestions are ready. The model compared image regions with garment names; its rankings are not calibrated confidence scores. Review before adding.';
  } catch (error) {
    active = false;
    if (state.photoUrl !== currentPhoto) return;
    elements.visionStatus.textContent = 'The free model could not load or analyse this photo. You can still add pieces manually; try again when online.';
    console.warn('Local garment suggestions unavailable:', error);
  } finally {
    active = false;
    if (state.photoUrl === currentPhoto) elements.suggestButton.disabled = false;
  }
}

function renderItems() {
  elements.itemList.innerHTML = state.items.map((piece, index) => `
    <div class="item-row" data-id="${piece.id}">
      <div class="item-top"><span class="item-title">PIECE ${String(index + 1).padStart(2, '0')}</span><button type="button" class="remove-item" data-action="remove" aria-label="Remove piece ${index + 1}">Remove</button></div>
      <div class="item-fields">
        <label><span>Garment</span><select data-field="kind" aria-label="Garment for piece ${index + 1}">${options(GARMENTS, piece.kind)}</select></label>
        <label><span>Colour</span><div class="color-field"><i class="swatch" style="background:${COLORS[piece.color]?.hex || '#fff'}" aria-hidden="true"></i><select data-field="color" aria-label="Colour for piece ${index + 1}"><option value=""${piece.color ? '' : ' selected'}>Choose colour</option>${options(COLORS, piece.color)}</select></div></label>
        <label><span>Pattern</span><select data-field="pattern" aria-label="Pattern for piece ${index + 1}">${options(PATTERNS, piece.pattern, value => value)}</select></label>
      </div>
      <button type="button" class="sample-button ${state.samplingId === piece.id ? 'active' : ''}" data-action="sample" aria-pressed="${state.samplingId === piece.id}">${state.samplingId === piece.id ? 'Tap the garment in the photo…' : 'Pick colour from photo'}</button>
    </div>`).join('');
  elements.itemCount.textContent = `${state.items.length} ${state.items.length === 1 ? 'piece' : 'pieces'} added`;
  const ready = !!state.photoUrl && state.items.length >= 2 && state.items.every(piece => COLORS[piece.color]);
  elements.scoreButton.disabled = !ready;
  elements.inputError.hidden = true;
  renderSkinComparison();
  if (state.scored && ready) renderResult();
  if (state.scored && !ready) {
    state.scored = false;
    state.recordedView = null;
    document.querySelectorAll('input[name="self-view"]').forEach(input => { input.disabled = false; });
    elements.resultEmpty.hidden = false;
    elements.resultContent.hidden = true;
  }
}

function makeDimension(dimension) {
  const safeScore = Math.max(0, Math.min(100, dimension.score));
  const wrapper = document.createElement('div');
  wrapper.className = 'dimension';
  wrapper.innerHTML = `<div class="dimension-head"><span>${dimension.label}<span class="dimension-weight">${dimension.weight}% of score</span></span><strong>${safeScore}/100</strong></div><div class="dimension-bar" aria-hidden="true"><div class="dimension-fill" style="transform:scaleX(${safeScore / 100})"></div></div><p></p>`;
  wrapper.querySelector('p').textContent = dimension.reason;
  return wrapper;
}

function renderResult() {
  const context = { occasion: state.occasion, preference: state.preference, season: state.season, items: state.items };
  const result = evaluateOutfit(context);
  if (result.total === null) {
    state.scored = false;
    elements.resultEmpty.hidden = false;
    elements.resultContent.hidden = true;
    return;
  }
  elements.resultEmpty.hidden = true;
  elements.resultContent.hidden = false;
  elements.scoreValue.textContent = result.total;
  elements.scoreContext.textContent = OCCASIONS[state.occasion].label;
  elements.selfViewResult.hidden = state.recordedView === 'uncertain';
  elements.selfViewResult.textContent = state.recordedView === 'low'
    ? 'Your initial view before advice: “Needs work.” You can disagree with the estimate.'
    : 'Your initial view before advice: “Works well.” You can disagree with the estimate.';
  elements.dimensions.replaceChildren(...result.dimensions.map(makeDimension));
  elements.notes.hidden = result.notes.length === 0;
  elements.notes.textContent = result.notes.join(' ');

  elements.suggestion.replaceChildren();
  if (state.previewOriginal) {
    const message = document.createElement('p');
    message.className = 'suggestion-copy';
    message.textContent = 'You’re previewing a swap.';
    const detail = document.createElement('p');
    detail.className = 'suggestion-reason';
    detail.textContent = 'This is a hypothetical edit to the garment list, not a change to your photo.';
    const undo = document.createElement('button');
    undo.className = 'button button-outline';
    undo.type = 'button';
    undo.textContent = 'Undo the swap';
    undo.addEventListener('click', () => {
      state.items = state.previewOriginal;
      state.previewOriginal = null;
      renderItems();
      elements.scoreValue.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    elements.suggestion.append(message, detail, undo);
    return;
  }
  const suggestion = suggestChange(context);
  if (!suggestion) {
    const message = document.createElement('p');
    message.className = 'no-suggestion';
    message.textContent = 'The selected rules do not find a worthwhile single-item change. Keep the outfit if it feels right to you.';
    elements.suggestion.append(message);
    return;
  }
  const swap = document.createElement('p');
  swap.className = 'suggestion-copy';
  swap.textContent = describeChange(suggestion, state.items);
  const reason = document.createElement('p');
  reason.className = 'suggestion-reason';
  reason.textContent = suggestion.explanation;
  const impact = document.createElement('p');
  impact.className = 'suggestion-impact';
  impact.textContent = `Estimated change: ${suggestion.before} → ${suggestion.after} (+${suggestion.gain})`;
  const tryButton = document.createElement('button');
  tryButton.className = 'button button-suggestion';
  tryButton.type = 'button';
  tryButton.textContent = 'Preview this swap';
  tryButton.addEventListener('click', () => {
    state.previewOriginal = state.items.map(piece => ({ ...piece }));
    state.items = applyChange(state.items, suggestion);
    renderItems();
    elements.scoreValue.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
  elements.suggestion.append(swap, reason, impact, tryButton);
}

elements.sampleChoices.addEventListener('click', event => {
  const button = event.target.closest('button[data-sample]');
  if (button) loadSample(button.dataset.sample);
});
elements.suggestButton.addEventListener('click', runVision);
elements.applyVision.addEventListener('click', () => {
  const selected = [...elements.visionList.querySelectorAll('.vision-row')]
    .filter(row => row.querySelector('input').checked)
    .map(row => row.querySelector('select').value)
    .filter((kind, index, kinds) => !state.items.some(piece => piece.kind === kind) && kinds.indexOf(kind) === index);
  if (state.items.length + selected.length > 8) {
    elements.visionStatus.textContent = 'Remove some pieces before adding these suggestions; the prototype supports eight pieces.';
    return;
  }
  for (const kind of selected) state.items.push(item(kind));
  elements.visionPanel.hidden = true;
  elements.visionStatus.textContent = selected.length
    ? 'Suggested garment types added. Choose a colour for each new piece and check all details before scoring.'
    : 'No new pieces added; any matching garment types are already in the list.';
  state.previewOriginal = null;
  renderItems();
});
elements.skinButton.addEventListener('click', () => {
  if (!state.photoUrl) return;
  state.skinPicking = !state.skinPicking;
  state.samplingId = null;
  elements.photoArea.classList.toggle('sampling', state.skinPicking);
  photoFeedback(state.skinPicking ? 'Tap a visible skin area in the photo, then check the sampled colour.' : 'Colour comparison cancelled.');
  renderItems();
});
document.getElementById('upload-button').addEventListener('click', () => elements.photoInput.click());
elements.photoInput.addEventListener('change', event => loadUpload(event.target.files?.[0]));
elements.photo.addEventListener('error', () => photoFeedback('The selected image could not be displayed. Try exporting it again as PNG or JPEG.', true));
elements.photoArea.addEventListener('dragover', event => {
  event.preventDefault();
  elements.photoArea.classList.add('drop-ready');
});
elements.photoArea.addEventListener('dragleave', event => {
  if (!elements.photoArea.contains(event.relatedTarget)) elements.photoArea.classList.remove('drop-ready');
});
elements.photoArea.addEventListener('drop', event => {
  event.preventDefault();
  elements.photoArea.classList.remove('drop-ready');
  loadUpload(event.dataTransfer?.files?.[0]);
});
window.addEventListener('paste', event => {
  const file = [...(event.clipboardData?.files || [])].find(entry => entry.type.startsWith('image/'));
  if (file) loadUpload(file);
});
elements.addItem.addEventListener('click', () => {
  if (state.items.length >= 8) {
    elements.inputError.textContent = 'This prototype supports up to eight visible pieces.';
    elements.inputError.hidden = false;
    return;
  }
  state.items.push(item());
  state.previewOriginal = null;
  renderItems();
});
elements.itemList.addEventListener('click', event => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;
  const id = button.closest('.item-row').dataset.id;
  if (button.dataset.action === 'remove') {
    state.items = state.items.filter(piece => piece.id !== id);
    state.previewOriginal = null;
    if (state.samplingId === id) state.samplingId = null;
    elements.photoArea.classList.toggle('sampling', !!state.samplingId);
    renderItems();
  } else if (button.dataset.action === 'sample') {
    if (!state.photoUrl) {
      elements.inputError.textContent = 'Add a photo before sampling its colours.';
      elements.inputError.hidden = false;
      return;
    }
    state.skinPicking = false;
    state.samplingId = state.samplingId === id ? null : id;
    elements.photoArea.classList.toggle('sampling', !!state.samplingId);
    elements.photoMessage.textContent = state.samplingId ? 'Tap the centre of the selected garment in the photo. Then check the colour name below.' : 'Colour picking cancelled.';
    renderItems();
  }
});
elements.itemList.addEventListener('change', event => {
  const field = event.target.dataset.field;
  if (!field) return;
  const piece = state.items.find(entry => entry.id === event.target.closest('.item-row').dataset.id);
  if (!piece) return;
  piece[field] = field === 'color' ? (event.target.value || null) : event.target.value;
  state.previewOriginal = null;
  renderItems();
});
elements.photo.addEventListener('click', event => {
  if (!state.samplingId && !state.skinPicking) return;
  try {
    const sampled = sampleImageColour(elements.photo, event.clientX, event.clientY);
    const area = elements.photoArea.getBoundingClientRect();
    elements.sampleMarker.style.left = `${(event.clientX - area.left) / area.width * 100}%`;
    elements.sampleMarker.style.top = `${(event.clientY - area.top) / area.height * 100}%`;
    elements.sampleMarker.hidden = false;
    if (state.skinPicking) {
      state.skinRgb = sampled.rgb;
      state.skinPicking = false;
      renderSkinComparison();
      photoFeedback('Photo colour sampled for a light/dark comparison. Lighting can change the result; it does not affect your score.');
    } else {
      const piece = state.items.find(entry => entry.id === state.samplingId);
      if (piece) piece.color = sampled.colour;
      state.samplingId = null;
      state.previewOriginal = null;
      photoFeedback(`Suggested colour: ${COLORS[sampled.colour].label}. Check or change it in the garment row.`);
    }
    elements.photoArea.classList.remove('sampling');
    renderItems();
  } catch (error) {
    photoFeedback(error.message, true);
  }
});
document.querySelectorAll('input[name="occasion"]').forEach(input => input.addEventListener('change', event => {
  state.occasion = event.target.value;
  state.previewOriginal = null;
  if (state.scored) renderResult();
}));
elements.preference.addEventListener('change', event => {
  state.preference = event.target.value;
  state.previewOriginal = null;
  if (state.scored) renderResult();
});
elements.season.addEventListener('change', event => {
  state.season = event.target.value;
  state.previewOriginal = null;
  if (state.scored) renderResult();
});
document.querySelectorAll('input[name="self-view"]').forEach(input => input.addEventListener('change', event => {
  state.selfView = event.target.value;
  if (state.scored) renderResult();
}));
elements.scoreButton.addEventListener('click', () => {
  if (elements.scoreButton.disabled) return;
  if (!state.scored) {
    state.recordedView = state.selfView;
    document.querySelectorAll('input[name="self-view"]').forEach(input => { input.disabled = true; });
  }
  state.scored = true;
  renderResult();
  if (window.matchMedia('(max-width: 1020px)').matches) elements.resultContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
