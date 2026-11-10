# Outfit, considered.: a contextual outfit checker

**Assignment:** Assignment 2 — Project Report  
**Module:** Intelligent Interactive Systems  
**Total report word count:** approximately 1,127 (abstract 153 + main report 974)
**Abstract word count:** 153
**Repository:** [add public GitHub URL before submission]  
**README:** [add public README URL before submission]  
**Submitted commit:** [replace with final commit SHA]

## Abstract

An outfit rating can appear objective even though clothing choices depend on occasion and personal preference. I developed *Outfit, considered.*, a no-cost web prototype that makes those assumptions visible. A user chooses an occasion and optional season, uploads a photo, requests optional browser-run garment suggestions, then confirms or adds items and colours. They can record their own judgement before advice. A local rule engine explains four score components, limits a conventional-interview score when major garment mismatches remain, and offers one reversible swap. Three AI-generated photos provide repeatable walkthroughs; their labels are prefilled demonstration data, separate from the vision model. The photograph stays in the browser. A user-picked skin-area colour offers descriptive contrast information but does not change the score, and gender is not inferred. The model checks three fixed image regions, so it can miss layers. This prototype demonstrates a correctable human–AI interaction; it does not establish fashion expertise or improved decisions.

## Design rationale and project explanation

### Problem, users and scope

Someone deciding what to wear may want specific advice, yet a bare score can obscure its assumptions and encourage acceptance of advice that ignores their purpose. This prototype compares one outfit with a casual day, dinner or interview. It evaluates confirmed clothing attributes, never the person’s body or attractiveness. The developed scope includes optional three-region garment guesses, manual correction, colour sampling, a contextual score and one reversible suggestion. Whole-outfit detection, shopping, wardrobe history and claims across cultures remain outside scope.

### Why the interaction starts with the person

The user sets occasion and style direction before advice because these are personal context, not facts reliably inferred from pixels. An optional “own view” asks whether the outfit needs work; it locks when the score is revealed and is displayed, not scored. This develops my Assignment 1 question about judgement before AI advice. Buçinca, Malaya and Gajos (2021) found that three cognitive-forcing designs together reduced overreliance on wrong AI advice in an ingredient-choice task, but added effort without establishing a general overall performance gain. I therefore made the self-assessment optional and do not claim it improves outfit choices.

Week 1’s sensing–interpretation–action–feedback sequence shaped the upload, optional model, editing and score loop. The browser crops the upper body, lower body and footwear regions. A CLIP model ranks garment descriptions for each crop (Radford et al., 2021); it does not locate every object or produce calibrated confidence. The user reviews each guess and supplies missed layers. This responds to Week 3’s warning that plausible vision-language output can contain absent objects. Prefilled sample labels are explicitly marked as demonstration data, not model results.

The score appears with a breakdown and a reason for each part. Week 2’s mental-model and cognitive-load lectures suggest making the system’s assumptions visible without making the user inspect a long explanation. The interface therefore shows four short reasons, not a paragraph of generated prose. It also acknowledges actions immediately and updates the score after edits, applying Week 2’s feedback-timing and gulf-of-evaluation concepts. Undo keeps a suggested swap exploratory rather than committing the user to it. Amershi et al. (2019) similarly recommend supporting correction in human–AI interfaces.

The score appears only after a photo, two garments and colours for every item. Otherwise a number would imply knowledge the system lacks. Missing footwear or an incomplete main outfit produces a qualification. One suggested swap lets the user compare a specific counterfactual; several simultaneous changes would obscure why the score moved.

### What the intelligence does

The engine weights occasion fit 55%, garment pairing 20%, colour 15% and stated preference 10%. This revises an initial weighted average that gave a printed T-shirt, shorts and sandals 67 for an interview: coordinated colours masked an obvious conventional-dress mismatch. Interview conflicts now cap the total at 65, 45 or 30 as one, two or three remain. These thresholds are design hypotheses, not validated fashion measures. A hospitality-sector interview study found professional attire more consequential than clothing colour (Ruetzler et al., 2012), while event-specific fashion research separates event suitability from colour-based style (Becattini et al., 2023). Neither establishes my numeric caps. Candidate swaps are re-scored and shown only when a single change improves the estimate by four points; a strong casual outfit may receive no suggestion.

The pixel sampler averages a small user-selected patch; the editable field corrects mistakes caused by lighting or background. A separate optional tap describes skin-to-garment light/dark contrast. It does not categorise skin tone or change the score. Perrett and Sprengelmeyer (2021) found complexion-linked preferences using simulated clothes beside twelve young White women’s faces; generalising their hues to all users or an uncalibrated phone photo would exceed that evidence. Gender prediction is unnecessary because the rules use garments, occasion and expressed preference, not identity. “Style direction” alters only the 10% preference component. Gray et al. (2014) found moderate colour coordination favoured in their stimuli; the prototype gives colour a limited role. Pantone’s 2026 autumn/winter report shows neutrals alongside vivid shades, so the optional season is a small palette cue, not a trend verdict or weather assessment.

Figure 1 separates evidence and control. The photo stays in browser memory; model files download on demand, then inference runs locally. CLIP guesses and pixel colours enter editable outfit facts only after user review. The rules calculate reasons, caps and swaps from those facts and the chosen occasion, season and style. Undo restores the prior state without reprocessing the image. The own-view answer is shown beside the score, never fed into it. Following Week 4’s context-engineering discussion, the app keeps current-task state rather than a persistent style profile. An internet connection is needed for the first model download, but manual entry and scoring do not need it.

![System diagram](architecture.svg)

*Figure 1. Implemented browser flow and optional model-file download.*

### Developed interaction and checks

Figure 2 shows three developed paths. The casual sample’s T-shirt, jeans and trainers score 94 with no needless swap. Changing its context to conventional interview lowers the estimate to 30; previewing a shirt raises it to 45, and Undo restores 30. On the new interview sample, the model suggested blouse, trousers and smart shoes but missed the blazer; the user can add it before scoring. These are prototype outputs and one smoke test, not measured accuracy or user benefit. All three sample photos are AI-generated with prefilled labels.

![Illustrated storyboards](storyboards.svg)

*Figure 2. Three interactions showing restraint, a reversible swap and correction of garment guesses.*

The project began with manual labels because a paid vision service conflicted with the no-cost constraint. I later added optional on-device CLIP inference and kept confirmation mandatory. An initial smaller model failed to load; a compatible model produced usable guesses on the interview sample, though it missed a layer. I added two samples and clarified personalisation controls. User testing exposed the implausible 67 interview score. I revised the rules after reviewing interview, colour and complexion evidence, while keeping thresholds explicit rather than claiming learned fashion expertise. Earlier testing found a `.png` containing HEIC data; this received a clear error. Automated checks cover rule and colour behaviour. The README records these decisions and AI assistance.

## References

Amershi, S. *et al.* (2019) ‘Guidelines for Human-AI Interaction’, *Proceedings of CHI 2019*. https://doi.org/10.1145/3290605.3300233.

Becattini, F. *et al.* (2023) ‘Fashion recommendation based on style and social events’, *Multimedia Tools and Applications*, 82, pp. 38217–38232. https://fedebecat.github.io/assets/papers/becattini2023fashion.pdf.

Buçinca, Z., Malaya, M.B. and Gajos, K.Z. (2021) ‘To Trust or to Think: Cognitive Forcing Functions Can Reduce Overreliance on AI in AI-Assisted Decision-Making’, *Proceedings of the ACM on Human-Computer Interaction*, 5(CSCW1). https://doi.org/10.1145/3449287.

Gray, K. *et al.* (2014) ‘The Science of Style: In Fashion, Colors Should Match Only Moderately’, *PLOS ONE*, 9(7), e102772. https://doi.org/10.1371/journal.pone.0102772.

Hugging Face (2026) *Transformers.js: zero-shot image classification pipeline*. https://huggingface.co/docs/transformers.js/api/pipelines.

Pantone Color Institute (2026) ‘New York Fashion Week Autumn/Winter 2026/2027’. https://www.pantone.com/uk/en-gb/articles/fashion-color-trend-report/new-york-fashion-week-autumn-winter-2026.

Perrett, D.I. and Sprengelmeyer, R. (2021) ‘Clothing Aesthetics: Consistent Colour Choices to Match Fair and Tanned Skin Tones’, *i-Perception*, 12(6), pp. 1–22. https://doi.org/10.1177/20416695211053361.

Radford, A. *et al.* (2021) ‘Learning Transferable Visual Models From Natural Language Supervision’, *Proceedings of the 38th International Conference on Machine Learning*, 139, pp. 8748–8763. https://proceedings.mlr.press/v139/radford21a.html.

Ruetzler, T. *et al.* (2012) ‘What is professional attire today? A conjoint analysis of personal presentation attributes’, *International Journal of Hospitality Management*, 31(3), pp. 937–943. https://doi.org/10.1016/j.ijhm.2011.11.001.

University of Birmingham (2026) *Intelligent Interactive Systems*, Weeks 1–4 lecture slides, supplied in the module.
