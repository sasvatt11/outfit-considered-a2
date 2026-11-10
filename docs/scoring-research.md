# Evidence and limits behind the scoring revision

This is a development note, not a claim that the prototype's numeric scores have been validated. The rules in `src/engine.js` remain explicit design choices. The student's task is to inspect and defend them.

## Occasion before colour

Ruetzler et al. (2012) asked 108 students, faculty and hospitality professionals to judge interview presentation attributes in a conjoint task. Professional attire and grooming were the strongest attributes; dark clothing was not independently favoured. This supports giving garment appropriateness priority over a dark or coordinated palette, while the hospitality-specific participants and simulated presentation do not justify a universal interview score. Becattini et al. (2023) model event suitability separately from colour-based style in a fashion recommender and note that event conventions change across communities and time. The app therefore labels its interview setting *conventional* and lets the user correct garment inputs.

## Coordination, complexion and season

Gray et al. (2014) found that observers preferred moderately coordinated colour combinations over extremely uniform or clashing combinations in their outfit stimuli. This motivates a modest colour component, not a rule that neutrals or a particular hue are always best.

Perrett and Sprengelmeyer (2021) found observer preferences for different simulated clothing hues beside fair versus tanned faces in two experiments. Their 12 faces were all young White women, and they explicitly do not know whether the finding extends to other ages, genders or ethnic groups. A single uncalibrated phone photo also changes skin appearance with lighting. The prototype therefore avoids an automatic skin-category-to-hue rule. The user selects a skin-area pixel and a preferred soft, balanced or bold light/dark contrast. A small score component compares that patch with colours worn near the face. The threshold bands and scores are **prototype heuristics**, not findings from the study or a flattering verdict.

Pantone's New York Fashion Week Autumn/Winter 2026–27 report includes earthy neutrals alongside vivid shades and five seasonless colours. That is evidence that seasonal *trends* are varied and temporary, not that only earth tones suit autumn or that a trend makes an outfit appropriate for an interview. The app's optional spring/summer/autumn/winter palette cue changes the colour component by at most four points. It is a transparent design example, not a validated or automatically updated trend model. It does not infer weather comfort, fabric or layering.

## Prototype decision

Without a skin-area sample, the overall score weights occasion 55%, garment pairing 20%, colour 15% and stated style direction 10%. With a sample, the colour allocation is split into palette balance 7% and user-directed near-face contrast 8%. A contrast ratio below 2 is labelled soft, 2 to below 4.5 balanced, and 4.5 or above bold. Matching the user's chosen band receives 100 within that component; an adjacent band receives 65 and the opposite band 30. These thresholds are **unvalidated prototype choices**. For a conventional interview, one, two or three entered casual garment conflicts cap the total at 65, 45 or 30 respectively, so colour cannot conceal a contextual mismatch. The photo with a printed T-shirt, shorts and sandals remains 30/100 for a conventional interview even if the contrast component changes. Different employers and cultures may use different standards; this is not a judgement of the wearer.

## Sources

- Becattini, F. et al. (2023), ‘Fashion recommendation based on style and social events’, *Multimedia Tools and Applications*, 82, pp. 38217–38232. https://fedebecat.github.io/assets/papers/becattini2023fashion.pdf
- Gray, K. et al. (2014), ‘The Science of Style: In Fashion, Colors Should Match Only Moderately’, *PLOS ONE*, 9(7), e102772. https://doi.org/10.1371/journal.pone.0102772
- Pantone Color Institute (2026), ‘New York Fashion Week Autumn/Winter 2026/2027’. https://www.pantone.com/uk/en-gb/articles/fashion-color-trend-report/new-york-fashion-week-autumn-winter-2026
- Perrett, D.I. and Sprengelmeyer, R. (2021), ‘Clothing Aesthetics: Consistent Colour Choices to Match Fair and Tanned Skin Tones’, *i-Perception*, 12(6), pp. 1–22. https://doi.org/10.1177/20416695211053361
- Ruetzler, T. et al. (2012), ‘What is professional attire today? A conjoint analysis of personal presentation attributes’, *International Journal of Hospitality Management*, 31(3), pp. 937–943. https://doi.org/10.1016/j.ijhm.2011.11.001
