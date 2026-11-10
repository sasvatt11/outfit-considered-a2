# Outfit, considered.

**README prose word count:** approximately 825. Commands and headings are excluded.

A no-cost, local prototype for exploring how an outfit fits a chosen occasion and personal style preference. It scores the *selected clothing details*, never the person.

## Status

**Implemented:** photo upload and local preview; optional browser-run garment suggestions for three image regions; editable garment, colour and pattern labels; tap-to-sample colour; optional skin-area colour comparison; pre-score judgement; four-part contextual score with reasons; one-item swap preview and undo. The score changes when occasion or confirmed garment details change.

**Sample/simulated:** three bundled photos are AI-generated; their labels are prefilled demonstration data. Their scores and swaps use the real rule engine. Prefilled labels are not vision-model results.

**Planned, not built:** whole-outfit detection, wardrobe history, shopping links and a user evaluation. The optional model guesses one item for each of three fixed body regions; it can miss layers or make mistakes. Users confirm, correct and add pieces. Gender identification and skin-tone categorisation are deliberately outside scope.

## Technology and AI behaviour

Plain HTML, CSS and JavaScript, served by a dependency-free Node.js server. When requested, [Transformers.js](https://github.com/huggingface/transformers.js) loads the [Xenova CLIP model](https://huggingface.co/Xenova/clip-vit-base-patch32) from public hosts and runs image-text comparisons in the browser. The first use downloads about 160 MB of model files and needs an internet connection; manual entry and scoring work without it. Browser Canvas samples pixels. A local rule engine evaluates occasion fit, pairing, colour balance and the user's chosen style direction. It re-scores a candidate one-item swap before showing it. The weights are design choices, not validated fashion measures. No paid API, account or key is needed. Photos stay in the browser; model files come in, but photos are not sent out. Web fonts may load from Google Fonts; system fallbacks work offline.

## Run and inspect

Requires Node.js 20 or newer. From this folder:

```sh
npm start
```

Open `http://127.0.0.1:4173`. Choose one of three sample outfits, or upload, drop or paste a JPEG, PNG or WebP up to 5 MB. **Suggest garments from photo** optionally loads the free model; review its guesses and add missed pieces. Choose a colour for each entered piece before scoring. **Pick colour from photo** samples a garment after you tap it. The optional skin-area swatch shows descriptive light/dark contrast and does not affect the score. **Own view** locks when revealed and is displayed beside the result without changing the score; **Style direction** changes only the 15% preference component. Run the checks with:

```sh
npm test
```

See the [architecture diagram](docs/architecture.svg), [interaction storyboards](docs/storyboards.svg), and provenance notes for the [casual](public/assets/sample-casual.provenance.md), [interview](public/assets/sample-interview.provenance.md) and [earth-tone](public/assets/sample-earth.provenance.md) images. Mermaid source is alongside the two figures.

## Development record

| Stage | Decision and reason | Check |
| --- | --- | --- |
| Initial prototype (`398231d`) | User proposed image-based outfit scoring and alternatives. We narrowed the score to a chosen occasion and used transparent local rules so the system works without a paid service. | Five engine tests passed; manual sample walkthrough produced 93 for casual and 67 for interview. |
| Current revision | Added an optional independent view before the score, explicit boundaries for missing garment recognition, and diagrams showing the implemented loop. | Browser walkthrough checked the interview swap (67 → 74), undo (back to 67), and photo colour correction. |
| Upload validation repair (`f328c3a`) | Set the requested 5 MB limit and inspect image contents before showing a preview. A file named `.png` containing HEIC data now gets a clear export instruction. Added shorts and sandals so the reported outfit can be entered accurately. | Checked the reported file's format, then verified a genuine PNG preview, a scored outfit and six rule-engine checks. |
| Optional vision and colour revision | Added browser-run CLIP guesses with a correction step; a user-picked skin-area swatch reports contrast but does not set a skin-tone label or alter the score. Renamed the vague preference field to Style direction and added earth/cool choices. Added two AI-generated sample photos. | The interview sample produced blouse, trousers and smart-shoe guesses, missing its blazer; this limits the claim to a three-region first pass. Eight engine/colour checks passed. |

## AI assistance and authorship

The user chose the outfit-checking concept, no-paid-service constraint and requested optional garment recognition, skin colour comparison, clearer controls and sample variation. Codex helped draft code, interface, tests, README and diagrams; its built-in image generator made the three sample photos. A first MobileCLIP load failed because the browser pipeline expected a combined ONNX file. I switched to the documented CLIP model, checked its output against the interview sample, and kept correction mandatory. Automated checks and browser walkthroughs checked the rule logic and interactions. Before submitting, the student should review the rules, run the examples and record any further decisions. No external photographs were copied into the project.

## Scope of the evidence

The tests show that the code follows its stated rules; they do not establish fashion expertise or user benefit. One AI-generated photo was used to smoke-test vision suggestions, not measure accuracy. The model's similarity rankings are not calibrated probabilities. Crops assume a roughly centred, full-body photo. Skin swatch comparison depends on lighting and is descriptive, not a universal claim about which colours flatter a person.
