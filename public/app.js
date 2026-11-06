import { OCCASIONS, GARMENTS, COLORS, PATTERNS, evaluateOutfit, suggestChange, applyChange, describeChange } from '/src/engine.js';
import { sampleImageColour } from '/src/colour.js';

const $ = id => document.getElementById(id);
const elements = {
  photoArea: $('photo-area'), photo: $('outfit-image'), photoBadge: $('photo-badge'),
  photoMessage: $('photo-message'), photoInput: $('photo-input'), sampleButton: $('sample-button'),
  sampleMarker: $('sample-marker'), itemList: $('item-list'), itemCount: $('item-count'),
  addItem: $('add-item'), scoreButton: $('score-button'), inputError: $('input-error'),
  resultEmpty: $('result-empty'), resultContent: $('result-content'), scoreValue: $('score-value'),
  scoreContext: $('score-context'), dimensions: $('dimensions'), notes: $('score-notes'),
  suggestion: $('suggestion-content'), preference: $('preference'), selfViewResult: $('self-view-result')
};

const state = {
  occasion: 'casual', preference: 'none', items: [], photoUrl: null, source: null,
  scored: false, samplingId: null, previewOriginal: null, selfView: 'uncertain', nextId: 1
};

function item(kind = 'tshirt', color = 'black', pattern = 'solid') {
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

function loadSample() {
  setPhoto('/assets/sample-casual.webp', 'sample', 'AI-generated sample outfit: blue T-shirt, dark jeans and white trainers.');
  state.items = [item('tshirt', 'blue'), item('jeans', 'navy'), item('sneakers', 'white')];
  state.occasion = 'casual';
  state.preference = 'none';
  state.selfView = 'uncertain';
  document.querySelector('[name="occasion"][value="casual"]').checked = true;
  document.querySelector('[name="self-view"][value="uncertain"]').checked = true;
  elements.preference.value = 'none';
  photoFeedback('Sample image and its three garment labels are provided for demonstration. You can edit every label.');
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
  photoFeedback('Photo added locally. Add the visible garments below; the app does not identify them automatically.');
  renderItems();
}

function renderItems() {
  elements.itemList.innerHTML = state.items.map((piece, index) => `
    <div class="item-row" data-id="${piece.id}">
      <div class="item-top"><span class="item-title">PIECE ${String(index + 1).padStart(2, '0')}</span><button type="button" class="remove-item" data-action="remove" aria-label="Remove piece ${index + 1}">Remove</button></div>
      <div class="item-fields">
        <label><span>Garment</span><select data-field="kind" aria-label="Garment for piece ${index + 1}">${options(GARMENTS, piece.kind)}</select></label>
        <label><span>Colour</span><div class="color-field"><i class="swatch" style="background:${COLORS[piece.color].hex}" aria-hidden="true"></i><select data-field="color" aria-label="Colour for piece ${index + 1}">${options(COLORS, piece.color)}</select></div></label>
        <label><span>Pattern</span><select data-field="pattern" aria-label="Pattern for piece ${index + 1}">${options(PATTERNS, piece.pattern, value => value)}</select></label>
      </div>
      <button type="button" class="sample-button ${state.samplingId === piece.id ? 'active' : ''}" data-action="sample" aria-pressed="${state.samplingId === piece.id}">${state.samplingId === piece.id ? 'Tap the garment in the photo…' : 'Pick colour from photo'}</button>
    </div>`).join('');
  elements.itemCount.textContent = `${state.items.length} ${state.items.length === 1 ? 'piece' : 'pieces'} added`;
  elements.scoreButton.disabled = !state.photoUrl || state.items.length < 2;
  elements.inputError.hidden = true;
  if (state.scored) renderResult();
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
  const context = { occasion: state.occasion, preference: state.preference, items: state.items };
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
  elements.selfViewResult.hidden = state.selfView === 'uncertain';
  elements.selfViewResult.textContent = state.selfView === 'low'
    ? 'Your view before the score: “Needs work.” You can disagree with the estimate.'
    : 'Your view before the score: “Works well.” You can disagree with the estimate.';
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

elements.sampleButton.addEventListener('click', loadSample);
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
  piece[field] = event.target.value;
  state.previewOriginal = null;
  renderItems();
});
elements.photo.addEventListener('click', event => {
  if (!state.samplingId) return;
  try {
    const sampled = sampleImageColour(elements.photo, event.clientX, event.clientY);
    const piece = state.items.find(entry => entry.id === state.samplingId);
    if (piece) piece.color = sampled.colour;
    elements.sampleMarker.style.left = `${sampled.x * 100}%`;
    elements.sampleMarker.style.top = `${sampled.y * 100}%`;
    elements.sampleMarker.hidden = false;
    state.samplingId = null;
    state.previewOriginal = null;
    elements.photoArea.classList.remove('sampling');
    elements.photoMessage.textContent = `Suggested colour: ${COLORS[sampled.colour].label}. Check or change it in the garment row.`;
    renderItems();
  } catch (error) {
    elements.photoMessage.textContent = error.message;
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
document.querySelectorAll('input[name="self-view"]').forEach(input => input.addEventListener('change', event => {
  state.selfView = event.target.value;
  if (state.scored) renderResult();
}));
elements.scoreButton.addEventListener('click', () => {
  if (!state.photoUrl || state.items.length < 2) return;
  state.scored = true;
  renderResult();
  if (window.matchMedia('(max-width: 1020px)').matches) elements.resultContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
