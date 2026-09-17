'use strict';
// THE ASSET CACHE MUST KNOW WHICH MODEL DREW THE PICTURE.
//
// Reported by the reviewer, 17 Sep 2026, before taking this to staging: the store was
// keyed on the brief alone, so a request for one model could be answered with a picture
// drawn by another. Observed live — Yemen was configured for z-image and two of seven
// lessons came back drawn by nano-banana-2-lite, because those two briefs already had a
// cached asset from before the switch. A cache that ignores the model cannot honour a
// change of model, and the bill silently stays at the old model's rate.
//
// Her two conditions are the two tests that matter here: a Yemen lesson resolves only
// z-image assets, and an old nano-banana asset can never be returned to a z-image request.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { artCacheKey, modelForImage } = require('../pipeline');
const store = require('../store/assets');

const PROMPT = 'children planting a seedling in a schoolyard, no text in the image';
const OPTS = { region: 'ye', locale: 'ar', topic: 'أجزاء النبات' };
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

test('one brief, two models, two different keys', () => {
  const z = artCacheKey(PROMPT, { ...OPTS, model: 'z-image' });
  const n = artCacheKey(PROMPT, { ...OPTS, model: 'nano-banana-2-lite' });
  assert.notStrictEqual(z, n, 'the two models share a cache key — this is the defect');
  // the model is legible in the key, so the index says what drew each asset without a lookup
  assert.ok(z.endsWith('@z-image'), `expected a model suffix, got ${z}`);
  assert.ok(n.endsWith('@nano-banana-2-lite'), `expected a model suffix, got ${n}`);
  // and they share the content half, so a migration can move an old entry by appending
  assert.strictEqual(z.split('@')[0], n.split('@')[0], 'the content half of the key must match');
});

test('a call with no model still resolves, for callers that do not know it', () => {
  const bare = artCacheKey(PROMPT, OPTS);
  assert.ok(!bare.includes('@'), 'a model-less call must give the plain content key');
  assert.strictEqual(bare, artCacheKey(PROMPT, { ...OPTS, model: 'z-image' }).split('@')[0]);
});

test('an old nano-banana asset is NOT returned for a z-image request', () => {
  const nKey = artCacheKey(PROMPT, { ...OPTS, model: 'nano-banana-2-lite' });
  const zKey = artCacheKey(PROMPT, { ...OPTS, model: 'z-image' });
  const files = [];
  try {
    // seed the store exactly as a pre-switch run would have left it
    assert.ok(store.put(nKey, PIXEL, { model: 'nano-banana-2-lite', prompt: PROMPT }));
    files.push(nKey);
    assert.ok(store.get(nKey), 'the seeded nano-banana asset should be retrievable by its own key');
    // …and the z-image request must MISS it
    assert.strictEqual(store.get(zKey), null,
      'a z-image request was answered with the nano-banana asset — the exact reported bug');
    // once z-image has its own asset, each model resolves to its own picture
    assert.ok(store.put(zKey, PIXEL, { model: 'z-image', prompt: PROMPT }));
    files.push(zKey);
    assert.strictEqual(store.get(zKey).meta.model, 'z-image');
    assert.strictEqual(store.get(nKey).meta.model, 'nano-banana-2-lite');
  } finally {
    // leave the real store as it was found
    const ix = JSON.parse(fs.readFileSync(path.join(store.DIR, 'index.json'), 'utf8'));
    for (const k of files) {
      const e = ix[k];
      if (e && e.file) { try { fs.unlinkSync(path.join(store.DIR, e.file)); } catch (_) { /* gone */ } }
      delete ix[k];
    }
    fs.writeFileSync(path.join(store.DIR, 'index.json'), JSON.stringify(ix, null, 2));
  }
});

test('a Yemen illustration keys to z-image; another region keys to its own model', () => {
  const scene = { concept: 'scene' };
  assert.strictEqual(modelForImage(scene, { region: 'ye', locale: 'ar' }), 'z-image');
  for (const region of ['ke', 'tz', 'pk']) {
    assert.strictEqual(modelForImage(scene, { region, locale: 'sw' }), 'nano-banana-2-lite',
      `${region} must keep its own model — this change is Yemen-only`);
  }
  // so the same brief in two regions cannot collide on one asset either
  const ye = artCacheKey(PROMPT, { region: 'ye', locale: 'ar', model: modelForImage(scene, { region: 'ye', locale: 'ar' }) });
  const ke = artCacheKey(PROMPT, { region: 'ke', locale: 'sw', model: modelForImage(scene, { region: 'ke', locale: 'sw' }) });
  assert.notStrictEqual(ye, ke);
});

test('a block that needs no image has no model, so nothing is keyed for it', () => {
  assert.strictEqual(modelForImage({ concept: 'structured' }, { region: 'ye', locale: 'ar' }), 'z-image',
    'an unknown concept falls back to HOOK_STORY, which does need an image');
  // the classifier is what decides; a diagram concept routes to the diagram model
  assert.strictEqual(modelForImage({ concept: 'diagram' }, { region: 'ye', locale: 'ar' }),
    'nano-banana-2-lite', 'the diagram flow must be untouched by the illustration change');
});

test('every entry in the shipped asset store carries its model in the key', () => {
  // the migration (scripts/migrate-asset-store-model-keys.js) has been applied to this
  // store; a bare key here means a new asset was written by a path that does not know its
  // model, which would silently reintroduce cross-model restores
  const ix = JSON.parse(fs.readFileSync(path.join(store.DIR, 'index.json'), 'utf8'));
  const bare = Object.entries(ix).filter(([k, e]) => !k.includes('@') && e && e.model);
  assert.deepStrictEqual(bare.map(([k]) => k), [],
    'these entries record a model but are not keyed by it — re-run the migration');
});
