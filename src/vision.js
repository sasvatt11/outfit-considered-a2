const LIBRARY = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
const MODEL = 'Xenova/clip-vit-base-patch32';

const zones = [
  { name: 'Upper body', rect: [0.16, 0.12, 0.84, 0.53], candidates: [
    ['tshirt', 'a photo of a T-shirt'], ['shirt', 'a photo of a shirt or blouse'],
    ['knit', 'a photo of a sweater'], ['blazer', 'a photo of a blazer'],
    ['jacket', 'a photo of a casual jacket'], ['dress', 'a photo of a dress']
  ] },
  { name: 'Lower body', rect: [0.19, 0.44, 0.81, 0.82], candidates: [
    ['jeans', 'a photo of jeans'], ['shorts', 'a photo of shorts'],
    ['trousers', 'a photo of tailored trousers'], ['skirt', 'a photo of a skirt'],
    ['dress', 'a photo of a dress']
  ] },
  { name: 'Footwear', rect: [0.20, 0.75, 0.80, 1], candidates: [
    ['sneakers', 'a photo of trainers or sneakers'], ['sandals', 'a photo of casual sandals or flip-flops'],
    ['dressSandals', 'a photo of dress sandals'],
    ['boots', 'a photo of boots'], ['loafers', 'a photo of smart shoes or loafers']
  ] }
];

let classifierPromise;

async function classifier(onProgress) {
  if (!classifierPromise) {
    classifierPromise = import(LIBRARY).then(async ({ pipeline, RawImage, env }) => {
      env.allowLocalModels = false;
      const pipe = await pipeline('zero-shot-image-classification', MODEL, {
        dtype: 'q8',
        progress_callback: info => {
          if (info.status === 'progress' && info.total) onProgress?.(`Loading free model… ${Math.round(info.progress || 0)}%`);
        }
      });
      return { pipe, RawImage };
    }).catch(error => { classifierPromise = null; throw error; });
  }
  return classifierPromise;
}

function crop(image, rect) {
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 320;
  const [left, top, right, bottom] = rect;
  const sourceX = Math.round(image.naturalWidth * left);
  const sourceY = Math.round(image.naturalHeight * top);
  const sourceWidth = Math.round(image.naturalWidth * (right - left));
  const sourceHeight = Math.round(image.naturalHeight * (bottom - top));
  const context = canvas.getContext('2d');
  context.fillStyle = '#f5f2eb';
  context.fillRect(0, 0, 320, 320);
  const scale = Math.min(320 / sourceWidth, 320 / sourceHeight);
  const width = sourceWidth * scale;
  const height = sourceHeight * scale;
  context.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, (320 - width) / 2, (320 - height) / 2, width, height);
  return canvas;
}

/** Estimates one garment per body region; scores are relative similarities, not confidence. */
export async function suggestGarments(image, onProgress) {
  if (!image.complete || !image.naturalWidth) throw new Error('Wait for the photo to finish loading.');
  onProgress?.('Loading the free vision model. The first use may take a few minutes…');
  const { pipe, RawImage } = await classifier(onProgress);
  const suggestions = [];
  for (const zone of zones) {
    onProgress?.(`Checking ${zone.name.toLowerCase()}…`);
    const input = await RawImage.fromCanvas(crop(image, zone.rect));
    const result = await pipe(input, zone.candidates.map(([, prompt]) => prompt));
    const ranked = result.map(entry => ({
      kind: zone.candidates.find(([, prompt]) => prompt === entry.label)?.[0],
      similarity: entry.score
    })).filter(entry => entry.kind).sort((a, b) => b.similarity - a.similarity);
    if (ranked.length) suggestions.push({ zone: zone.name, kind: ranked[0].kind, alternatives: ranked.slice(0, 3).map(entry => entry.kind) });
  }
  return suggestions.filter((entry, index) => entry.kind !== 'dress' || !suggestions.slice(0, index).some(earlier => earlier.kind === 'dress'));
}
