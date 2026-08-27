'use strict';
// z-image rejects prompts over 1,000 characters, so route.js compacts them. Two ways
// that went wrong on a real Kenyan render, both fixed here:
//
//   · the compactor sliced the longest sentence MID-WORD and shipped the result, so the
//     art direction went out as "any adult is Kenyan — dark brown skin and Afr." — worse
//     than silence, because the prompt no longer stated the thing the culture gate then
//     checks for;
//   · the composed prompt was 1,194 characters in the first place, because the lesson's
//     illustration brief restated the style the scaffold already supplies. The real fix
//     is not to compact better but to not need compacting.
const test = require('node:test');
const assert = require('node:assert');
const { compactPrompt, modelInput } = require('../route');

test('compaction never cuts a word in half', () => {
  const long = 'a warm flat-vector illustration. Scene: children counting stones with their '
    + 'teacher in a classroom, showing faces and gestures and a few simple objects they are '
    + 'handling as they work through the activity together at the front of the room. '
    + 'any adult is Kenyan with dark brown skin and African features and wears smart everyday '
    + 'Kenyan clothing, a plain shirt or blouse or a dress in a bright printed fabric. '
    + 'bright warm colours, high quality, suitable for a primary-school classroom. no text.';
  assert.ok(long.length > 400);
  const out = compactPrompt(long, 300);
  assert.ok(out.length <= 300, `compacted to ${out.length}, over the limit`);
  // every word in the output must be a whole word from the input
  const words = (s) => s.toLowerCase().match(/[a-z]+/g) || [];
  const source = new Set(words(long));
  for (const w of words(out)) {
    assert.ok(source.has(w), `«${w}» is not a whole word from the source — mid-word cut`);
  }
  // and it must not end on a dangling connective
  assert.ok(!/\b(and|or|with|the|a|in|of|as)\s*\.?$/i.test(out.trim()),
    `ends on a dangling word: «${out.slice(-40)}»`);
});

test('the Kenya lesson prompt fits z-image without being compacted at all', async () => {
  const { buildGuideFromMarkdown } = require('../../lp-render/guide/from-markdown');
  const { resolveRegion } = require('../prompts/regions');
  const { resolveSegmentImages } = require('../index');
  const CBC = `Grade 5 · Science and Technology

Sub-Strand: The Breathing System

Lesson Learning Outcomes
a) Identify the main parts of the human breathing system from a chart.

Introduction (5 minutes)
Learners are guided to carry out an activity on breathing in and out.

Lesson Development (18 minutes)
Step 1: Learners are guided to study the chart on human breathing system.

Conclusion (5 minutes)
Learners are guided to respond to oral questions.
`;
  const g = buildGuideFromMarkdown(CBC, { region: 'ke' });
  const brief = (g.images[0] || {}).prompt || '';
  assert.ok(brief, 'the lesson should author an illustration brief');

  // COMPOSE IT FOR REAL, through the pipeline's own path, rather than estimating the
  // length by adding up the pack's fields. The first version of this test guessed the
  // scaffold wrapper at 330 characters, got ~1043, and failed while the real composed
  // prompt was 970 — a proxy that disagrees with the measurable value is a bad test.
  let composed = null;
  await resolveSegmentImages(
    { subject: g.meta.subject, grade: g.meta.grade, region: 'ke', locale: 'en',
      blocks: [{ type: 'HOOK_STORY', text: brief, model: 'z-image' }] },
    { apiKey: 'test', region: 'ke',
      generateImpl: async ({ prompt }) => { composed = prompt; return { ok: false, error: 'capture only' }; },
      gateImpl: async () => ({ pass: true }),
      cultureImpl: async () => ({ pass: true, checked: false }) });

  assert.ok(composed, 'the pipeline should have composed a prompt');
  assert.ok(composed.length <= 1000,
    `composed prompt is ${composed.length} characters — over z-image's 1000-character `
    + 'limit, so the region direction gets trimmed away');
  assert.strictEqual(modelInput('z-image', composed).prompt, composed,
    'a prompt this size needs no compaction');

  // and the appearance the gate enforces must survive into what is actually sent
  const reg = resolveRegion('ke');
  assert.match(reg.teacher, /dark brown skin and African features/);
  assert.ok(reg.check.forbid.some((f) => /East Asian/i.test(f)),
    'the gate checks adult features, so the prompt must ask for them');
  assert.match(composed, /adult is Kenyan — dark brown skin and African features/);
  assert.ok(!/no empty boards|vacant panels/i.test(composed),
    'the brief must not contradict the scaffold\'s "every board is blank" rule');
});
