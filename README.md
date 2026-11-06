# Outfit, considered.

**README prose word count:** approximately 588. Commands and headings are excluded.

A no-cost, local prototype for exploring how an outfit fits a chosen occasion and personal style preference. It scores the *selected clothing details*, never the person.

## Status

**Implemented:** photo upload and local preview; tap-to-sample colour; editable garment, colour and pattern labels; optional pre-score judgement; four-part contextual score with reasons; one-item swap preview and undo. The rule engine changes its estimate when the occasion or garment details change.

**Sample/simulated:** the bundled sample photo is AI-generated, and its three garment labels are prefilled for a repeatable walkthrough. Its score and suggestions are calculated by the real engine.

**Planned, not built:** automatic garment recognition, wardrobe history, shopping links and a user evaluation. For a personal upload, the user enters garment types; the app does not identify clothes automatically.

## Technology and AI behaviour

Plain HTML, CSS and JavaScript, served by a dependency-free Node.js server. Browser Canvas samples image pixels; a local knowledge-based engine evaluates occasion fit, garment pairing, colour balance and stated preference. It generates a candidate one-item swap and re-scores it before showing it. The weights and compatibility rules are prototype design choices, not validated style measures. No paid API, account or key is needed. Photos stay in the browser and are not uploaded by this version. Web fonts may load from Google Fonts; system fallbacks keep the app usable offline.

## Run and inspect

Requires Node.js 20 or newer. From this folder:

```sh
npm start
```

Open `http://127.0.0.1:4173`. Choose **Use sample photo** to replay the documented examples, or upload, drop or paste a JPEG, PNG or WebP up to 5 MB. After adding your own photo, enter at least two garment labels to enable scoring. Select a garment's **Pick colour from photo**, tap its area in the image, and review the suggested colour. Run the checks with:

```sh
npm test
```

See the [architecture diagram](docs/architecture.svg), [interaction storyboards](docs/storyboards.svg), and [sample-image provenance](public/assets/sample-casual.provenance.md). Mermaid source is alongside the two figures.

## Development record

| Stage | Decision and reason | Check |
| --- | --- | --- |
| Initial prototype (`398231d`) | User proposed image-based outfit scoring and alternatives. We narrowed the score to a chosen occasion and used transparent local rules so the system works without a paid service. | Five engine tests passed; manual sample walkthrough produced 93 for casual and 67 for interview. |
| Current revision | Added an optional independent view before the score, explicit boundaries for missing garment recognition, and diagrams showing the implemented loop. | Browser walkthrough checked the interview swap (67 → 74), undo (back to 67), and photo colour correction. |
| Upload validation repair (`f328c3a`) | Set the requested 5 MB limit and inspect image contents before showing a preview. A file named `.png` containing HEIC data now gets a clear export instruction. Added shorts and sandals so the reported outfit can be entered accurately. | Checked the reported file's format, then verified a genuine PNG preview, a scored outfit and six rule-engine checks. |

## AI assistance and authorship

The user chose the outfit-checking concept and the no-paid-service constraint. Codex helped draft the prototype code, interface, tests, README and diagrams; its built-in image generator created the sample photo. Automated scenario tests and a visible browser walkthrough checked the logic; a display bug that left the empty result panel visible after scoring was corrected. Before submitting this as assessed work, the student should review the rules, run the examples, and record any further decisions or changes they make. No external code or photographs were copied into the project.

## Scope of the evidence

The tests show that the code follows its stated rules; they do not establish that the rules match fashion expertise or improve users' decisions. The sample image and its labels are a demonstration fixture, not evidence of automatic vision accuracy.
