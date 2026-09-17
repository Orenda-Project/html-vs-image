'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { route, modelInput } = require('../route');

// SINGLE-MODEL POLICY (owner decision, 2026-08-18): every generated image comes from
// nano-banana-2-lite, whatever the content kind or the script. These tests used to
// assert the old cost ladder (seedream / qwen2 / nano-banana-2 escalations); they now
// guard against those escalations coming back, which is what would quietly raise the
// per-lesson cost again.
test('every image kind routes to the one model, with no fallback ladder', () => {
  for (const kind of ['decorative_scene', 'labeled_diagram']) {
    const r = route(kind);
    assert.strictEqual(r.needsImage, true, `${kind} should need an image`);
    assert.deepStrictEqual(r.ladder, ['nano-banana-2-lite'], `${kind} must not escalate`);
  }
});

test('the script no longer changes the model — that is the point of one model', () => {
  for (const loc of ['en', 'sw', 'ar', 'ur']) {
    assert.deepStrictEqual(route('labeled_diagram', loc).ladder, ['nano-banana-2-lite'],
      `${loc} should route to the single model`);
  }
});

test('LP_ART_MODEL overrides the model for artwork runs', () => {
  const prev = process.env.LP_ART_MODEL;
  process.env.LP_ART_MODEL = 'z-image';
  try {
    assert.deepStrictEqual(route('decorative_scene').ladder, ['z-image']);
    assert.deepStrictEqual(route('labeled_diagram', 'ar').ladder, ['z-image']);
  } finally {
    if (prev === undefined) delete process.env.LP_ART_MODEL; else process.env.LP_ART_MODEL = prev;
  }
});

test('structured / icon / unknown route to no generation', () => {
  for (const c of ['structured', 'icon_or_motif', 'unknown']) {
    const r = route(c);
    assert.strictEqual(r.needsImage, false);
    assert.deepStrictEqual(r.ladder, []);
  }
});

test('modelInput merges the prompt with the model default params', () => {
  const inp = modelInput('nano-banana-2-lite', 'a warm scene');
  assert.strictEqual(inp.prompt, 'a warm scene');
  assert.strictEqual(inp.aspect_ratio, '4:3');
  const s = modelInput('bytedance/seedream-v4-text-to-image', 'x');
  assert.strictEqual(s.image_size, 'landscape_4_3');
});

// A COST DIRECTIVE MUST NOT FAIL QUIETLY.
//
// `LP_ART_MODEL` is how the cheap open-weights artwork track is selected. The check used
// to be `if (forced && MODELS[forced])`, so any value that is not a registered slug — a
// typo, a stale slug, a name copied from kie's catalogue that was never added to MODELS —
// fell through to the default ladder without a word. Whoever set the variable believed the
// cheap model was running while every image was billed at the default's rate: 4 credits
// (~$0.02) for nano-banana-2-lite against 0.8 (~$0.004) for z-image, five times the
// intended cost, invisible in every log.
test('an unregistered LP_ART_MODEL fails loudly instead of silently billing the default', () => {
  const prev = process.env.LP_ART_MODEL;
  try {
    process.env.LP_ART_MODEL = 'z_image';          // the kind of near-miss that caused this
    assert.throws(() => route('decorative_scene', 'ar'), /not a registered model/,
      'an unrecognised model name was ignored and the default would have been billed');
    // and the message has to be actionable: it names the default that would have been used
    assert.throws(() => route('decorative_scene', 'ar'), /nano-banana-2-lite/);
  } finally {
    if (prev === undefined) delete process.env.LP_ART_MODEL; else process.env.LP_ART_MODEL = prev;
  }
});

test('a registered LP_ART_MODEL is still honoured for every image category', () => {
  const prev = process.env.LP_ART_MODEL;
  try {
    process.env.LP_ART_MODEL = 'z-image';
    for (const cat of ['decorative_scene', 'labeled_diagram', 'labeled_diagram_complex']) {
      assert.deepStrictEqual(route(cat, 'ar').ladder, ['z-image'], `${cat} ignored the override`);
    }
  } finally {
    if (prev === undefined) delete process.env.LP_ART_MODEL; else process.env.LP_ART_MODEL = prev;
  }
});
