'use strict';
// Per-model default input params (createTask `input` minus prompt). Add a model
// by adding an entry here + placing its slug in the relevant LADDER — no code change.
const MODELS = {
  'nano-banana-2-lite': { input: { aspect_ratio: '4:3' } },
  'bytedance/seedream-v4-text-to-image': { input: { image_size: 'landscape_4_3', image_resolution: '1K' } },
  'gpt-image-2-text-to-image': { input: { aspect_ratio: '4:3', resolution: '1K' } },
  'nano-banana-2': { input: { aspect_ratio: '4:3', output_format: 'png' } },
  // Open-weight options (verified working — see docs/image-model-benchmark.md):
  //  flux-2/pro : reliable (3/3), pure-white bg, but slow/variable (24–83s), 5cr. Needs aspect_ratio + resolution.
  //  qwen2      : fastest (~10s), 5.6cr, but returns a tinted (non-white) bg. image_size uses ratio strings ('1:1'), NOT 'portrait_4_3'.
  'flux-2/pro-text-to-image': { input: { aspect_ratio: '2:3', resolution: '1K' } },
  'qwen2/text-to-image': { input: { image_size: '1:1' } },
  // registered for the Arabic low-cost research (2026-08-18) — cheapest tier:
  'gpt-image/1.5-text-to-image': { input: {} },
  'grok-imagine/text-to-image': { input: { aspect_ratio: '1:1' } },
  'google/nano-banana': { input: { aspect_ratio: '4:3' } },
  'ideogram/v3-text-to-image': { input: { aspect_ratio: '4:3' } },
  'google/imagen4-fast': { input: { aspect_ratio: '4:3' } },
  // z-image documents a 1000-character prompt limit; longer prompts are rejected
  // outright, which shows up as a dropped image rather than an error.
  'z-image': { input: { aspect_ratio: '4:3' }, maxPrompt: 1000 },
  'seedream/5-lite-text-to-image': { input: { image_size: 'landscape_4_3', image_resolution: '1K' } },
};
// SINGLE-MODEL POLICY (company decision 2026-08-18): every image type uses
// nano-banana-2-lite — one model for all generation, all regions. The pipeline's
// retry pass provides a second Lite attempt when the gate rejects. Previous
// per-type ladders are in git history if the policy changes.
// Direct type → model assignment (NOT a cost-ascending climb). Each image type goes
// straight to the model that empirically makes it best on the FIRST attempt, so we do
// not burn credits generating-then-rejecting cheap models. The second entry is a single
// safety fallback the quality gate escalates to ONLY if the primary is rejected.
// Grounded in docs/image-model-benchmark.md.
const LADDERS = {
  // Scenes (children/activity/family, no in-image text): cheap, fast, warm art with
  // expressive faces → nano-banana-2-lite. Fallback: qwen2 (open-weight, ~10s, good art).
  decorative_scene: ['nano-banana-2-lite'],
  // Latin-script labelled diagrams (en, sw, fr…): Seedream v4 = best value + accurate
  // labels on the first try. Fallback: nano-banana-2 (top label fidelity).
  labeled_diagram: ['nano-banana-2-lite'],
  // Complex / right-to-left scripts (Arabic, Urdu…). The Arabic bake-off
  // (2026-08-18, four corpus prompts × 6 models) showed nano-banana-2-lite renders
  // our few-label Arabic boards correctly at 4cr/~10s — half of nano-banana-2 —
  // while Seedream/FLUX/Qwen garble Arabic outright. Lite goes FIRST; the gate
  // escalates to nano-banana-2 then gpt-image-2 for the many-label/complex cases
  // Lite is known to mis-map.
  labeled_diagram_complex: ['nano-banana-2-lite'],
};

// ── PER-REGION OVERRIDES — ONE REGION AT A TIME, BY CONSTRUCTION ────────────────────
//
// LADDERS above is the default for EVERY region and is not to be edited for one region's
// sake. Yemen is the only region integrated so far, and a change made in LADDERS would
// silently change Kenya, Tanzania and Pakistan with it — which is exactly what the Design
// lane's standing constraint forbids. A region that wants a different model for one
// category declares it here; a region with no entry keeps the default untouched.
//
// YEMEN — LESSON ILLUSTRATIONS ON z-image (reviewer's cost instruction, 17 Sep 2026).
// The ask was the cheapest model that still draws an acceptable lesson illustration, with
// anything cheaper than z-image to be recommended first. kie's own catalogue settles it
// (GET /api/v1/models — 206 models, 32 text-to-image; kie publishes no price list
// anywhere else):
//
//   z-image (Z Image Turbo)   0.8 credits  ~$0.004   ← cheapest real generator
//   bytedance/seedream (V3)   3.5 credits  ~$0.0175    next cheapest, 4.4× more
//   nano-banana-2-lite        4.0 credits  ~$0.02      the default, 5× more
//   nano-banana-2             8.0 credits  ~$0.04
//
// Two entries LOOK cheaper and are not: `recraft/crisp-upscale` (0.5cr) is an UPSCALER —
// it cannot draw from a prompt, and kie mislabels its taskType as Text to Image; and
// `seedream/5-pro` quotes 0.5cr for an INPUT reference image while generation is 7cr
// ($0.035), among the dearest. Nothing in the catalogue undercuts z-image for generation,
// and kie flags NO model as free — there is no zero-cost generator to choose.
//
// Quality is measured, not assumed: 0.86 credits per image observed across six live
// generations (5.14 credits total), and the six illustrations were reviewed in the
// rendered pages beside their nano-banana predecessors.
//
// ONE ENTRY, DELIBERATELY. A second entry is a gate-escalation path, and escalating from
// $0.004 to $0.02 without saying so is the silent fallback this change exists to rule out.
// If the gate rejects a z-image the pipeline's retry pass rolls z-image again (same ladder,
// fresh sample); failing that the lesson ships without a photograph, and the code-drawn
// figures cost nothing and carry the teaching content regardless.
//
// DIAGRAMS AND LABELLING ARE NOT LISTED HERE, DELIBERATELY. A labelled diagram must render
// readable words inside the image — a different and much harder job than a wordless scene,
// settled for Arabic by the bake-off cited above, which z-image has never been tested
// against. Cheaper artwork is not a reason to re-open a legibility question that was
// answered with evidence.
const REGION_LADDERS = {
  ye: { decorative_scene: ['z-image'] },
};

// Scripts whose in-image labels only the strongest model renders reliably.
const COMPLEX_SCRIPT = new Set(['ar', 'ur', 'sd', 'fa', 'ps']);

// Resolve the model list for a category, honouring the lesson locale for diagrams and the
// region for anything that region has declared for itself.
function ladderFor(category, locale, region) {
  // ARTWORK MODEL OVERRIDE: with LP_ART_MODEL set, every illustration comes from
  // that one model. Used for the open-source artwork track (LP_ART_MODEL=z-image),
  // where the model draws wordless art and code renders all teaching content.
  //
  // AN UNRECOGNISED VALUE MUST NOT BE IGNORED. This read `if (forced && MODELS[forced])`,
  // so a value that is not a registered slug — a typo, a stale slug, a name from kie's
  // catalogue that was never added to MODELS above — fell straight through to the default
  // ladder. Anyone who set the variable then believed the cheap model was in use while
  // every image was billed at the default's rate: nano-banana-2-lite is 4 credits (~$0.02)
  // against z-image's 0.8 (~$0.004), so a silent miss costs five times what was intended.
  // A cost directive that fails quietly is worse than one that fails loudly.
  const forced = process.env.LP_ART_MODEL;
  if (forced) {
    if (MODELS[forced]) return [forced];
    throw new Error(
      `LP_ART_MODEL="${forced}" is not a registered model, so it would be ignored and the `
      + `default (${(LADDERS.decorative_scene || [])[0]}) billed instead. Register it in `
      + `MODELS in imagegen/config/models.config.js, or use one of: ${Object.keys(MODELS).join(', ')}`,
    );
  }
  if (category === 'labeled_diagram' && COMPLEX_SCRIPT.has(String(locale || '').toLowerCase())) {
    return LADDERS.labeled_diagram_complex;
  }
  // A region's own declaration wins for the categories it names, and ONLY those. A region
  // that declares nothing — every region but Yemen today — resolves exactly as before.
  const own = REGION_LADDERS[String(region || '').toLowerCase()];
  if (own && own[category]) return own[category];
  return LADDERS[category] || [];
}

module.exports = { MODELS, LADDERS, REGION_LADDERS, COMPLEX_SCRIPT, ladderFor };
