'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { route, modelInput } = require('../route');
const { LADDERS } = require('../config/models.config');

// ONE MODEL PER JOB, AND NO ESCALATION LADDER.
//
// The single-model policy (owner decision, 2026-08-18) put nano-banana-2-lite on every
// image kind. That still holds for LABELLED DIAGRAMS, where readable words have to appear
// inside the picture and the Arabic bake-off settled the choice on evidence. It no longer
// holds for LESSON ILLUSTRATIONS: a wordless scene does not need label fidelity, so the
// reviewer's cost instruction (17 Sep 2026) moved those to z-image at 0.8 credits against
// 4.0 — a fifth of the price for a job that does not exercise the difference.
//
// What has not changed is the shape: ONE entry per kind. A second entry is a
// gate-escalation path, and that is what used to make the per-lesson cost unpredictable.
test('each image kind routes to one model, with no fallback ladder', () => {
  const expected = { decorative_scene: 'z-image', labeled_diagram: 'nano-banana-2-lite' };
  for (const [kind, model] of Object.entries(expected)) {
    const r = route(kind, 'ar', 'ye');
    assert.strictEqual(r.needsImage, true, `${kind} should need an image`);
    assert.deepStrictEqual(r.ladder, [model], `${kind} must not escalate`);
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

// ── THE COST CONTRACT FOR LESSON ILLUSTRATIONS ──────────────────────────────────────
// Reviewer's instruction, 17 Sep 2026: lesson illustrations use the cheapest model that
// still draws an acceptable picture, and nothing may quietly fall back to the dearer
// nano-banana-2-lite. These tests are the contract, so a later edit cannot raise the bill
// by accident — the difference is 0.8 credits against 4.0, five times over, per image.
test('a lesson illustration is drawn by z-image, and by exactly one model', () => {
  const prev = process.env.LP_ART_MODEL;
  delete process.env.LP_ART_MODEL;                     // the committed default, not an override
  try {
    const ladder = route('decorative_scene', 'ar', 'ye').ladder;
    assert.deepStrictEqual(ladder, ['z-image'],
      'the illustration ladder is no longer z-image alone');
    // a second entry IS the silent escalation path — one model, or the cost is unbounded
    assert.strictEqual(ladder.length, 1,
      'a fallback entry would escalate from $0.004 to a dearer model without saying so');
    assert.ok(!ladder.includes('nano-banana-2-lite'),
      'nano-banana-2-lite is 5× the price and must not be reachable for an illustration');
  } finally {
    if (prev !== undefined) process.env.LP_ART_MODEL = prev;
  }
});

test('the locale cannot route an illustration to a dearer model', () => {
  const prev = process.env.LP_ART_MODEL;
  delete process.env.LP_ART_MODEL;
  try {
    // ar/ur take the complex-script branch for DIAGRAMS; an illustration must not follow it
    for (const loc of ['ar', 'ur', 'en', 'sw', undefined]) {
      assert.deepStrictEqual(route('decorative_scene', loc, 'ye').ladder, ['z-image'],
        `locale ${loc} moved the Yemen illustration off z-image`);
    }
  } finally {
    if (prev !== undefined) process.env.LP_ART_MODEL = prev;
  }
});

test('the diagram and labelling flows are left exactly as they were', () => {
  const prev = process.env.LP_ART_MODEL;
  delete process.env.LP_ART_MODEL;
  try {
    // The reviewer asked for these to be untouched: a labelled diagram must render readable
    // words inside the image, which the Arabic bake-off settled on evidence z-image has
    // never been tested against. Pinned so cheaper artwork cannot creep into them.
    for (const reg of ['ye', 'ke', 'tz', 'pk', undefined]) {
      assert.deepStrictEqual(route('labeled_diagram', 'en', reg).ladder, ['nano-banana-2-lite']);
      assert.deepStrictEqual(route('labeled_diagram', 'ar', reg).ladder, ['nano-banana-2-lite']);
      assert.deepStrictEqual(route('labeled_diagram', 'ur', reg).ladder, ['nano-banana-2-lite']);
    }
  } finally {
    if (prev !== undefined) process.env.LP_ART_MODEL = prev;
  }
});

// ── YEMEN ONLY. THE WHOLE POINT. ─────────────────────────────────────────────────────
// Yemen is the only region integrated so far. A cost change made for Yemen that also
// moved Kenya, Tanzania or Pakistan would be a change to regions nobody has reviewed,
// which the Design lane's standing constraint forbids. This is the test that makes the
// scoping real rather than a claim in a comment: it FAILS if the illustration model is
// edited in LADDERS (the shared default) instead of in Yemen's own entry.
test('only Yemen moves — every other region keeps the default illustration model', () => {
  const prev = process.env.LP_ART_MODEL;
  delete process.env.LP_ART_MODEL;
  try {
    assert.deepStrictEqual(route('decorative_scene', 'ar', 'ye').ladder, ['z-image'],
      'Yemen should be on the cheap illustration model');
    for (const reg of ['ke', 'tz', 'pk', 'in', '', undefined]) {
      assert.deepStrictEqual(route('decorative_scene', 'sw', reg).ladder, ['nano-banana-2-lite'],
        `region ${JSON.stringify(reg)} was moved off the default — this change must be Yemen-only`);
    }
    // and the shared default itself must still read nano-banana-2-lite, so that a future
    // region inherits what it inherited before this change
    assert.deepStrictEqual(LADDERS.decorative_scene, ['nano-banana-2-lite'],
      'the shared default was edited instead of Yemen declaring its own model');
  } finally {
    if (prev !== undefined) process.env.LP_ART_MODEL = prev;
  }
});
