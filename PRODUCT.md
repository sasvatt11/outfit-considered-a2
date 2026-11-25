# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Delegated by the user: plain HTML, CSS and JavaScript with a small Node.js server for local inspection. No paid service or API key is required.

## Users

An individual checking how their clothes work together for a chosen occasion. They upload a photo, review optional garment suggestions, inspect a contextual score, and can try a suggested change.

## Product Purpose

Help the user reflect on an outfit and compare possible changes. The score concerns the clothes relative to the user's chosen goal and preferences, never the person's body or attractiveness.

## Operating Context

Assignment 2 for Intelligent Interactive Systems. The submitted project needs inspectable developed interaction, a component-and-flow diagram, two or three illustrated scenarios, a public repository where possible, and a concise README development record.

## Capabilities and Constraints

- Upload a photo and sample colours directly from it.
- An optional browser-run vision-language model suggests garments in three fixed image areas. The user reviews, edits, or ignores its guesses and adds missed items manually.
- The model downloads on first use and needs an internet connection then; it needs no paid service or API key.
- An optional user-selected skin-area sample describes the photographed patch. The default “Just show me” choice leaves scoring unchanged. If the user chooses a small, noticeable or strong light/dark difference, it is compared with clothes worn near the face and receives 8% of the weighted score. No identity or universal skin-tone palette is inferred; occasion caps still take priority.
- A recorded pre-score judgement is shown beside the result but does not alter it. The chosen style direction affects only the preference portion of the score.
- An optional season provides a small palette cue, without claiming to assess weather comfort or a universal colour trend.
- A local knowledge-based engine prioritises occasion suitability across Casual, Smart casual, Fancy and Smart levels, caps major mismatches in the latter three, explains its score, and compares a suggested swap. It offers 34 grouped garment choices, including relaxed clothes and dress shoes. Footwear is optional for Casual because staying in is one of its examples. The caps are prototype design decisions, not validated fashion measures.
- No paid service, account or API key is needed.
- The prototype must label sample data and unfinished capabilities accurately.

## Evidence on Hand

The user's Assignment 2 brief and Week 1–4 lecture extracts in the parent workspace. No user-provided outfit photographs or brand assets.

## Product Principles

- Let the user set the context before offering advice.
- Make every inferred colour and score component correctable or inspectable.
- Treat the score as a design aid, not an objective style verdict.
- Prefer a complete, honestly bounded interaction over speculative features.
