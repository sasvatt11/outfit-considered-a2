const LIBRARY = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.2';
const MODEL = 'Xenova/clip-vit-base-patch32';

const colours = ['black', 'white', 'grey', 'cream', 'beige', 'brown', 'navy', 'blue', 'red', 'orange', 'yellow', 'green', 'pink', 'purple'];
const patterns = [
  ['solid', 'plain solid colour with no visible pattern'],
  ['stripe', 'striped pattern'],
  ['print', 'graphic print or illustrated pattern'],
  ['check', 'checked or plaid pattern']
];

const zones = [
  { name: 'Upper body', rect: [0.16, 0.12, 0.84, 0.53], candidates: [
    ['tshirt', 'a photo of a T-shirt'], ['tank', 'a photo of a tank top'],
    ['hoodie', 'a photo of a hoodie'], ['sweatshirt', 'a photo of a sweatshirt'],
    ['polo', 'a photo of a polo shirt'], ['shirt', 'a photo of a shirt or blouse'],
    ['knit', 'a photo of a sweater'], ['blazer', 'a photo of a blazer'],
    ['jacket', 'a photo of a casual jacket'], ['denimJacket', 'a photo of a denim jacket'],
    ['cardigan', 'a photo of a cardigan'], ['coat', 'a photo of a coat'],
    ['dress', 'a photo of a dress'], ['jumpsuit', 'a photo of a jumpsuit']
  ] },
  { name: 'Lower body', rect: [0.19, 0.44, 0.81, 0.82], candidates: [
    ['jeans', 'a photo of jeans'], ['shorts', 'a photo of shorts'],
    ['tailoredShorts', 'a photo of tailored shorts'], ['joggers', 'a photo of joggers'],
    ['leggings', 'a photo of leggings'], ['cargoTrousers', 'a photo of cargo trousers'],
    ['chinos', 'a photo of chinos'], ['trousers', 'a photo of tailored trousers'],
    ['skirt', 'a photo of a skirt'], ['tailoredSkirt', 'a photo of a tailored skirt'],
    ['dress', 'a photo of a dress'], ['casualDress', 'a photo of a casual dress'],
    ['eveningDress', 'a photo of an evening dress'], ['jumpsuit', 'a photo of a jumpsuit']
  ] },
  { name: 'Footwear', rect: [0.20, 0.75, 0.80, 1], candidates: [
    ['sneakers', 'a photo of trainers or sneakers'], ['sandals', 'a photo of casual sandals or flip-flops'],
    ['flats', 'a photo of flat shoes'], ['dressSandals', 'a photo of dress sandals'],
    ['boots', 'a photo of boots'], ['loafers', 'a photo of smart shoes or loafers'],
    ['heels', 'a photo of heels']
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

function bestLabel(result, candidates) {
  const best = result.reduce((winner, entry) => !winner || entry.score > winner.score ? entry : winner, null);
  return candidates.find(([, prompt]) => prompt === best?.label)?.[0] ?? null;
}

/** Estimates one garment, colour and pattern per region; all are editable guesses. */
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
    if (!ranked.length) continue;
    const kind = ranked[0].kind;
    const garment = zone.candidates.find(([key]) => key === kind)[1].replace(/^a photo of (a|an) /, '');
    const colourCandidates = colours.map(colour => [colour, `a photo of ${colour} ${garment}`]);
    const patternCandidates = patterns.map(([pattern, description]) => [pattern, `a photo of ${garment} with a ${description}`]);
    onProgress?.(`Checking ${zone.name.toLowerCase()} colour and pattern…`);
    const colourResult = await pipe(input, colourCandidates.map(([, prompt]) => prompt));
    const patternResult = await pipe(input, patternCandidates.map(([, prompt]) => prompt));
    suggestions.push({
      zone: zone.name, kind,
      color: bestLabel(colourResult, colourCandidates),
      pattern: bestLabel(patternResult, patternCandidates),
      alternatives: ranked.slice(0, 3).map(entry => entry.kind)
    });
  }
  const onePieceKinds = new Set(['dress', 'casualDress', 'eveningDress', 'tailoredDress', 'jumpsuit']);
  return suggestions.filter((entry, index) => !onePieceKinds.has(entry.kind) || !suggestions.slice(0, index).some(earlier => onePieceKinds.has(earlier.kind)));
}
