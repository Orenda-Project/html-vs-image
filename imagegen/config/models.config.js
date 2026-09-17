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

// Scripts whose in-image labels only the strongest model renders reliably.
const COMPLEX_SCRIPT = new Set(['ar', 'ur', 'sd', 'fa', 'ps']);

// Resolve the model list for a category, honouring the lesson locale for diagrams.
function ladderFor(category, locale) {
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
  return LADDERS[category] || [];
}

module.exports = { MODELS, LADDERS, COMPLEX_SCRIPT, ladderFor };
