# Vendored: ICT's diagram-as-code engine

Copied **verbatim** from the NIETE (ICT) bot, `niete/bot/vendor/lp-v9/diagrams/` (upstream: the
`curriculum-baked-lesson-plans` skill, `scripts/lp_html/diagrams/`). Re-vendor, never edit:
if a file must diverge, note it here and at the site, as ICT's own SYNC.md requires.

Used by `lp-render/guide/from-lpdoc.js` only: `renderDiagram(spec)` turns an lp_doc diagram
spec into an SVG string (pure, synchronous, no network). Two optional dependencies:

- `openchemlib` (npm, same `^9.7.0` range ICT pins) — the `molecule` type.
- a Python `schemdraw` venv — the `circuit` type's high-fidelity path. Absent here, so
  `circuit` uses the engine's own built-in drawing (the engine returns null and falls back).

`assets/pictograms/build_pictograms.js` is ICT's offline asset builder; it is not loaded at
render time. Pictogram licences: `assets/pictograms/LICENSE.txt` and `ATTRIBUTION.md`.
