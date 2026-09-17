'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { resolveSegmentImages } = require('../index');
const { MemoryAssetCache } = require('../cache');
const { BudgetGuard } = require('../budget');

const segment = {
  subject: 'English', grade: '1', region: 'pk',
  blocks: [
    { type: 'HOOK_STORY', text: 'Ali and Sara on the train', characters: [{ name: 'Ali' }, { name: 'Sara' }] },
    { type: 'BOARD_WORK', text: 'draw 4 picture boxes' },
  ],
};

test('generates an image for the hook, skips the structured block', async () => {
  const generateImpl = async ({ model }) => ({ ok: true, model, url: 'http://img/hook.png', creditsConsumed: 4 });
  const gateImpl = async () => ({ pass: true, reason: 'good' });
  const { images } = await resolveSegmentImages(segment, { apiKey: 'k', generateImpl, gateImpl, cache: new MemoryAssetCache(), budget: new BudgetGuard(100) });
  const hook = images.find((i) => i.blockType === 'HOOK_STORY');
  const board = images.find((i) => i.blockType === 'BOARD_WORK');
  assert.strictEqual(hook.category, 'decorative_scene');
  assert.strictEqual(hook.asset.url, 'http://img/hook.png');
  // this fixture is region 'pk', which keeps the shared default — Yemen's cheaper
  // illustration model must not leak into any other region
  assert.strictEqual(hook.model, 'nano-banana-2-lite');
  assert.strictEqual(board.needsImage, false);
  assert.strictEqual(board.asset, null);
});

test('the ladder is a single model — no escalation to a costlier one', async () => {
  const seen = [];
  const generateImpl = async ({ model }) => { seen.push(model); return { ok: true, model, url: `http://img/${model}.png`, creditsConsumed: 5 }; };
  const gateImpl = async () => ({ pass: true });
  const { images } = await resolveSegmentImages(segment, { apiKey: 'k', generateImpl, gateImpl, cache: new MemoryAssetCache(), budget: new BudgetGuard(100) });
  const hook = images.find((i) => i.blockType === 'HOOK_STORY');
  // ONE model per job, and the ladder must not reach past it: a second generation at a
  // dearer model is the silent escalation the cost instruction rules out, so `seen` must
  // hold exactly one distinct slug. (region 'pk' → the shared default.)
  assert.strictEqual(seen[0], 'nano-banana-2-lite');
  assert.deepStrictEqual([...new Set(seen)], ['nano-banana-2-lite']);
  assert.strictEqual(hook.model, 'nano-banana-2-lite');
});

test('gate-soft: a rejected image still ships, flagged, rather than leaving a blank card', async () => {
  const generateImpl = async ({ model }) => ({ ok: true, model, url: 'http://img/x.png', creditsConsumed: 4 });
  const gateImpl = async () => ({ pass: false, reason: 'off-topic' });
  const { images } = await resolveSegmentImages(segment, { apiKey: 'k', generateImpl, gateImpl, cache: new MemoryAssetCache(), budget: new BudgetGuard(100) });
  const hook = images.find((i) => i.blockType === 'HOOK_STORY');
  // Presence beats absence: the card keeps its picture and the log says it is unverified.
  assert.ok(hook.asset && hook.asset.url, 'expected the rejected image to ship anyway');
  assert.match(hook.reason, /gate_soft/);
  assert.match(hook.reason, /off-topic/);
});

test('a card is only left blank when generation itself fails', async () => {
  const generateImpl = async () => ({ ok: false, error: 'createTask: 500' });
  const gateImpl = async () => ({ pass: true });
  const { images } = await resolveSegmentImages(segment, { apiKey: 'k', generateImpl, gateImpl, cache: new MemoryAssetCache(), budget: new BudgetGuard(100) });
  const hook = images.find((i) => i.blockType === 'HOOK_STORY');
  assert.strictEqual(hook.asset, null);
  assert.match(hook.reason, /generation itself failed/);
});

test('a cache hit skips generation', async () => {
  const cache = new MemoryAssetCache();
  let called = 0;
  const generateImpl = async ({ model }) => { called++; return { ok: true, model, url: 'http://img/hook.png', creditsConsumed: 4 }; };
  const gateImpl = async () => ({ pass: true });
  const opts = { apiKey: 'k', generateImpl, gateImpl, cache, budget: new BudgetGuard(100) };
  await resolveSegmentImages(segment, opts);
  const before = called;
  await resolveSegmentImages(segment, opts);
  assert.strictEqual(called, before, 'no new generation on the cached run');
});

// The same segment, resolved for Yemen: the only region that has declared its own
// illustration model. Run through resolveSegmentImages rather than route() alone, so the
// whole path — classify → route → generate — is what is being checked.
test('a Yemen segment generates its illustration on z-image', async () => {
  const seen = [];
  const generateImpl = async ({ model }) => { seen.push(model); return { ok: true, model, url: 'http://img/ye.png', creditsConsumed: 0.8 }; };
  const gateImpl = async () => ({ pass: true });
  const { images } = await resolveSegmentImages({ ...segment, region: 'ye', locale: 'ar' },
    { apiKey: 'k', generateImpl, gateImpl, cache: new MemoryAssetCache(), budget: new BudgetGuard(100) });
  const hook = images.find((i) => i.blockType === 'HOOK_STORY');
  assert.strictEqual(hook.model, 'z-image');
  assert.deepStrictEqual([...new Set(seen)], ['z-image'], 'Yemen escalated past z-image');
});
