'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { dryRun } = require('../cli');

const segment = {
  subject: 'English', grade: '1', region: 'pk',
  blocks: [
    { type: 'HOOK_STORY', text: 'Ali and Sara on the train', characters: [{ name: 'Ali' }, { name: 'Sara' }] },
    { type: 'BOARD_WORK', text: 'draw picture boxes' },
  ],
};

test('dryRun reports category + model + prompt per block, no network', () => {
  const rows = dryRun(segment);
  const hook = rows.find((r) => r.blockType === 'HOOK_STORY');
  const board = rows.find((r) => r.blockType === 'BOARD_WORK');
  assert.strictEqual(hook.category, 'decorative_scene');
  // region 'pk' → the shared default. A dry run must report what the RUN will use.
  assert.strictEqual(hook.model, 'nano-banana-2-lite');
  assert.match(hook.prompt, /Ali/);
  assert.strictEqual(board.needsImage, false);
  assert.strictEqual(board.model, null);
});

// A dry run is answering "what will this cost", so it has to resolve the region the same
// way a real run does. It used to call route(category) with neither locale nor region and
// report the shared default for every lesson.
test('a dry run reports the region\'s own model, not the shared default', () => {
  const rows = dryRun({ ...segment, region: 'ye', locale: 'ar' });
  const hook = rows.find((r) => r.blockType === 'HOOK_STORY');
  assert.strictEqual(hook.model, 'z-image');
});
