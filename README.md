# Outfit, considered.

**README prose word count:** 1,427. Commands, headings and link destinations are excluded.

A no-cost, local prototype for exploring how an outfit fits a chosen occasion and personal style preference. It scores the *selected clothing details*, never the person.

## Status

**Implemented:** photo upload and local preview; optional browser-run garment, colour and pattern suggestions for three image regions; 34 editable garment choices grouped as tops, bottoms, one-piece outfits, layers and shoes; tap-to-sample colour; optional skin-area sampling with a user-chosen light/dark preference; pre-score judgement; contextual score with reasons; optional time-of-year palette cue; one-item swap preview and undo. The four selectable dress levels are Casual, Smart casual, Fancy and Smart. The score changes when occasion, confirmed garments or the optional light/dark preference change.

**Sample/simulated:** four bundled photos are AI-generated; their labels are prefilled demonstration data. Their scores and swaps use the real rule engine. Prefilled labels are not vision-model results.

**Planned, not built:** whole-outfit detection, wardrobe history, shopping links and a user evaluation. The optional model guesses one item and its colour and pattern for each of three fixed body regions; it can miss layers or confuse garments with skin or background. Users confirm, correct and add pieces. Gender identification and skin-tone categorisation are deliberately outside scope.

## Technology and AI behaviour

Plain HTML, CSS and JavaScript run on a dependency-free Node.js server. Optional [Transformers.js](https://github.com/huggingface/transformers.js) loads [Xenova CLIP](https://huggingface.co/Xenova/clip-vit-base-patch32) and compares image crops with garment, colour and pattern descriptions in the browser. Its first use downloads about 160 MB; manual entry and scoring work offline. Canvas samples pixels. The local engine weights occasion (55%), pairing (20%), colour (15%) and style direction (10%). A selected skin-area patch reallocates 8% of colour only when the user chooses a preferred light/dark difference; “Just show me” leaves scoring unchanged. A separate, inspectable [semantic rule set](src/semantic.js) interprets occasion conflicts and garment relationships, and checks whether entered pieces describe a complete outfit. Missing main pieces, missing footwear outside Casual, or duplicate footwear/lower pieces limit confidence in the total; the interface explains the check and asks for correction before suggesting a swap. Dress layering is flagged for confirmation without an automatic penalty. Major Smart casual, Fancy and Smart mismatches can cap the total, so coordinated colours cannot hide an occasion mismatch. Season adds at most four points to the colour component. These thresholds are design choices, not validated fashion measures. Photos stay in the browser; no paid API, account or key is required.

## Run and inspect

Requires Node.js 20 or newer. From this folder:

```sh
npm start
```

Open `http://127.0.0.1:4173`. Use a sample or upload, drop or paste a JPEG, PNG or WebP up to 5 MB. Optional **Suggest details from photo** preselects garment, colour and pattern guesses in a review panel; correct or reject them before adding. Add missed pieces and check every label against the photo before scoring. **Pick colour from photo** samples a garment colour; **Pick a skin area from photo** starts the optional light/dark comparison. Use arrow keys and Enter to select from the photo without a pointer. The default comparison does not change the score. **Own view** records a pre-score judgement but does not affect the score. Run the checks with:

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
| Interface review | Kept the editorial look, added visual sample choices and a clear score-readiness message, and enabled keyboard photo sampling and reduced-motion scrolling. | Desktop and phone walkthroughs showed the selected sample, dinner score of 50, no horizontal overflow and no console errors. |
| Semantic rule revision | Collected occasion and pairing relationships in one inspectable module and added outfit-structure checks so partial or duplicate entries cannot appear fully confident. Removed an automatic dress-layering penalty because that combination can be intentional. | Nineteen automated checks pass, including partial interview attire, duplicate footwear and dress layering; the complete sample scores remain unchanged. |
| Vision detail revision | Extended the optional CLIP pass to suggest colour and pattern alongside garment type, then presented all three as editable choices before they enter the score. | A browser walkthrough with the synthetic interview photo transferred three editable triplets; several colour guesses differed from the known labels. Recognition accuracy has not been measured. |
| Occasion and wardrobe revision | Replaced event-specific labels with four dress levels and expanded garment choices to include hoodies, joggers, chinos, dresses, heels and other everyday pieces. Added plain-language style descriptions; made footwear optional for staying in. | Twenty-two automated checks pass. Browser checks confirmed all four levels, 34 garment choices, a Fancy mismatch cap and a two-column phone layout without horizontal overflow. |
| Contrast control clarification | Replaced technical contrast labels with a direct question about the light/dark difference between skin and clothes in the photo. Kept the default descriptive only, with score effect explained beside each active choice. | Browser walkthrough checked the default text and a selected preference; 22 rule checks still pass. |

## AI assistance and authorship

The user chose the outfit-checking concept, no-paid-service constraint and requested optional garment recognition, skin colour comparison, clearer controls, sample variation and broader clothing and occasion choices. They also identified the implausible interview and dinner scores and asked for research before revision. Codex helped draft code, interface, tests, README and diagrams; its built-in image generator made the four sample photos. A first MobileCLIP load failed because the browser pipeline expected a combined ONNX file. I switched to the documented CLIP model, checked its output against the interview sample, and kept correction mandatory. I compared published evidence with the proposed scoring rules and labelled the numeric caps as design choices. Automated checks and browser walkthroughs checked the rule logic and interactions, including the three storyboard paths. No user photographs were copied into the project.

## Scope of the evidence

The tests show that the code follows its stated rules; they do not establish fashion expertise, scoring accuracy or user benefit. The semantic checks operate on confirmed garment labels, not direct understanding of the image. Their numeric limits are prototype choices; users may intentionally layer pieces or omit garments from a photo. One AI-generated photo was used to smoke-test vision suggestions, not measure accuracy. The model's similarity rankings are not calibrated probabilities. Crops assume a roughly centred, full-body photo. The user must identify a real skin area; the app does not verify it. Photo lighting can change the patch description and contrast band. The optional 8% near-face score applies only with a chosen goal; it is not a validated rule about skin colour or attractiveness.
