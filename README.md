# Outfit, considered.

**README prose word count:** approximately 1,000. Commands, headings and link destinations are excluded.

A no-cost, local prototype for exploring how an outfit fits a chosen occasion and personal style preference. It scores the *selected clothing details*, never the person.

## Status

**Implemented:** photo upload and local preview; optional browser-run garment suggestions for three image regions; editable garment, colour and pattern labels; tap-to-sample colour; optional skin-area sampling with a user-chosen contrast goal; pre-score judgement; contextual score with reasons; optional time-of-year palette cue; one-item swap preview and undo. The score changes when occasion, confirmed garments or the optional contrast goal change.

**Sample/simulated:** four bundled photos are AI-generated; their labels are prefilled demonstration data. Their scores and swaps use the real rule engine. Prefilled labels are not vision-model results.

**Planned, not built:** whole-outfit detection, wardrobe history, shopping links and a user evaluation. The optional model guesses one item for each of three fixed body regions; it can miss layers or make mistakes. Users confirm, correct and add pieces. Gender identification and skin-tone categorisation are deliberately outside scope.

## Technology and AI behaviour

Plain HTML, CSS and JavaScript run on a dependency-free Node.js server. Optional [Transformers.js](https://github.com/huggingface/transformers.js) loads [Xenova CLIP](https://huggingface.co/Xenova/clip-vit-base-patch32) and compares image crops with garment descriptions in the browser. Its first use downloads about 160 MB; manual entry and scoring work offline. Canvas samples pixels. The local engine weights occasion (55%), pairing (20%), colour (15%) and style direction (10%). A selected skin-area patch reallocates 8% of colour only when the user chooses a near-face contrast goal; “No contrast goal” leaves scoring unchanged. Conventional-interview and smart-casual dinner mismatches can cap the total. Season adds at most four points to the colour component. These thresholds are design choices, not validated fashion measures. Photos stay in the browser; no paid API, account or key is required.

## Run and inspect

Requires Node.js 20 or newer. From this folder:

```sh
npm start
```

Open `http://127.0.0.1:4173`. Use a sample or upload, drop or paste a JPEG, PNG or WebP up to 5 MB. Optional **Suggest garments from photo** gives guesses to review, correct or reject. Add missed pieces and confirm colours and patterns before scoring. **Pick colour from photo** samples a garment or skin-area patch; the latter offers an optional contrast goal. **Own view** records a pre-score judgement but does not affect the score. Run the checks with:

```sh
npm test
```

To replay the three storyboard paths: (1) open **Casual day** and reveal 94/100 with no suggested swap; (2) open **Dinner mismatch**, reveal 50/100, preview the knitwear swap to 60/100 and Undo; (3) upload the bundled `public/assets/sample-interview.webp` as a normal photo, request garment suggestions, correct them and add any missed blazer before scoring. The third path requires the first-time model download; the two rule-engine paths work offline.

See the [project report](output/pdf/A2_Project_Report.pdf), [architecture diagram](docs/architecture.svg), [interaction storyboards](docs/storyboards.svg), [scoring research and limits](docs/scoring-research.md), and provenance notes for the [casual](public/assets/sample-casual.provenance.md), [dinner](public/assets/sample-dinner.provenance.md), [interview](public/assets/sample-interview.provenance.md) and [earth-tone](public/assets/sample-earth.provenance.md) images. Mermaid source is alongside the two figures; `scripts/build_report.py` renders the report from the Markdown source and figure PNGs with ReportLab.

## Development record

| Stage | Decision and reason | Check |
| --- | --- | --- |
| Initial prototype (`398231d`) | Used editable garment labels and local rules to avoid a paid service. | Five rule checks passed; the early interview score of 67 exposed weak context handling. |
| Interaction and upload (`f328c3a`) | Added optional pre-score judgement, reversible swaps and 5 MB image validation; rejected HEIC data disguised as PNG. | Browser walkthrough checked correction and Undo; a genuine PNG preview worked. |
| Optional vision | Added three-region CLIP guesses, with user review because it can miss layers. | On the bundled interview image it suggested blouse, trousers and smart shoes but missed the blazer. |
| Context revision | Raised occasion priority after a printed T-shirt, shorts and flip-flops scored 67 for interview. | The same inputs now cap at 30 for a conventional interview; tests cover the cap. |
| Skin-area comparison (`2e27bcf`) | Let a user-picked photo patch and personal contrast goal affect 8% of the score; avoided inferred skin categories. | Browser check changed an uncapped score when the goal changed; interview cap still held. |
| Dinner revision (`7210462`) | A 74 dinner result prompted a stated smart-casual assumption, caps and separate flip-flop/dress-sandal labels. | Printed T-shirt, shorts and flip-flops now cap at 50; dress sandals do not trigger that conflict. |
| Submission walkthrough | Generated a distinct synthetic dinner image so the path can be replayed without publishing the user's photograph. | Browser checked 94 with no swap, dinner 50 → 60 → 50 with Undo, and correction of the model's missed blazer. |
| Contrast control revision | Added “No contrast goal” so sampling alone does not imply a styling preference; explained all four options next to the control. | An automated check confirms the sample does not change the score until a goal is chosen. Sixteen checks pass. |

## AI assistance and authorship

The user chose the outfit-checking concept, no-paid-service constraint and requested optional garment recognition, skin colour comparison, clearer controls and sample variation. They also identified the implausible interview and dinner scores and asked for research before revision. Codex helped draft code, interface, tests, README and diagrams; its built-in image generator made the four sample photos. A first MobileCLIP load failed because the browser pipeline expected a combined ONNX file. I switched to the documented CLIP model, checked its output against the interview sample, and kept correction mandatory. I compared published evidence with the proposed scoring rules and labelled the numeric caps as design choices. Automated checks and browser walkthroughs checked the rule logic and interactions. Before submitting, the student should review the rules, run the examples and record any further decisions. No user photographs were copied into the project.

## Scope of the evidence

The tests show that the code follows its stated rules; they do not establish fashion expertise or user benefit. One AI-generated photo was used to smoke-test vision suggestions, not measure accuracy. The model's similarity rankings are not calibrated probabilities. Crops assume a roughly centred, full-body photo. The user must identify a real skin area; the app does not verify it. Photo lighting can change the patch description and contrast band. The optional 8% near-face score applies only with a chosen goal; it is not a validated rule about skin colour or attractiveness.
