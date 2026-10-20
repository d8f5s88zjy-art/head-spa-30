# 045 — Výroba a ladenie shaderov

Use when a visual mechanism genuinely requires per-pixel or per-vertex computation. A shader is an implementation choice, not a requirement for a premium site.

## Decide

Define the visual relationship and input domain first: UV, object/world position, screen coordinates, pointer or progress. Choose the renderer and shader language compatible with the existing project. Prefer a simpler mask or pre-rendered asset when it communicates equally well.

## Execute

Build from a visible diagnostic output such as UV color, then add one transformation at a time. Name uniforms by meaning and units. Bound parameters, avoid invalid divisions, handle degenerate ranges and separate logical time from tab-suspension jumps. Keep shader compilation failures local to the decorative surface.

Understand which work scales with vertices, pixels, samples or passes. Keep static data out of per-frame allocation. Budget transparent overdraw, texture fetches and render-target resolution. Use deterministic inputs for scroll so reversing returns to the same appearance. Avoid hiding real content inside uninspectable effects.

## Verify

Test boundary values, resize, high/low pixel ratio, missing textures, fallback renderer and reduced motion. Inspect output with post-processing disabled to isolate faults. Profile the actual workload before claiming optimization. A shader compiling in one environment does not establish device coverage.

## Deliver

Provide parameter contract, coordinate spaces, renderer/version, cost drivers, disposal responsibility and a static fallback. Preserve source/license for adapted algorithms. Use current official TSL or renderer documentation, and label illustrative pseudocode as such instead of presenting incompatible snippets as ready to run.
