'use strict';
// The rubric's severity ramp used to be a lookup on four English words:
//
//   const COL = { exceeding: '--c-teal', meeting: '--c-green', approaching: '--c-amber',
//                 below: '--c-red' };
//   const key = String(it.level || '').toLowerCase().replace(/[^a-z]/g, '');
//   const c = COL[key] || accent; const sym = SYM[key] || '•';
//
// The key is the WHOLE level name with non-letters stripped, so it only ever matched a
// level spelled exactly "Exceeding" / "Meeting" / "Approaching" / "Below". Kenya's own
// CBC wording is "Exceeding Expectation", which collapses to "exceedingexpectation" and
// misses — as does "Level 4", a Kiswahili level name, and any three-band rubric. Every
// row then drew the same accent colour and the same bullet, so the ramp that carries the
// assessment decision disappeared into a flat list.
//
// The ramp is positional now. These tests pin that, and they are written so they FAIL
// against the old implementation.
const test = require('node:test');
const assert = require('node:assert');
const { renderDecorativeLesson } = require('../decorative/render');

const rubric = (items, extra = {}) => ({
  meta: { id: 't', locale: 'en', title: 'Rubric test' },
  sections: [{ id: 'rubric', heading: 'Assessment Rubric', type: 'rubric', items, ...extra }],
});

// the badge colours, in the order they appear in the markup
function badges(content) {
  const html = String(renderDecorativeLesson(content, {}).bodyHtml);
  return [...html.matchAll(/class="ric"[^>]*background:var\((--c-[a-z]+)\)[^>]*>([^<]*)</g)]
    .map((m) => ({ colour: m[1], symbol: m[2] }));
}
const markup = (content) => String(renderDecorativeLesson(content, {}).bodyHtml);

test('CBC level names keep the full ramp', () => {
  const content = rubric([
    { level: 'Exceeding Expectation', desc: 'Names all four parts unaided' },
    { level: 'Meeting Expectation', desc: 'Names three parts' },
    { level: 'Approaching Expectation', desc: 'Names two parts' },
    { level: 'Below Expectation', desc: 'Names one part with help' },
  ]);
  const b = badges(content);
  const html = markup(content);
  assert.strictEqual(b.length, 4, 'every row draws a badge');
  assert.deepStrictEqual(b.map((x) => x.colour),
    ['--c-teal', '--c-green', '--c-amber', '--c-red']);
  assert.deepStrictEqual(b.map((x) => x.symbol), ['★', '✓', '▲', '✕']);
  // the source's own wording survives, in full
  assert.match(html, /Exceeding Expectation/);
  assert.match(html, /Below Expectation/);
});

test('a numbered rubric ramps too — nothing depends on the words', () => {
  assert.deepStrictEqual(badges(rubric([
    { level: 'Level 4', desc: 'all four parts' },
    { level: 'Level 3', desc: 'three parts' },
    { level: 'Level 2', desc: 'two parts' },
    { level: 'Level 1', desc: 'one part' },
  ])).map((x) => x.colour),
    ['--c-teal', '--c-green', '--c-amber', '--c-red']);
});

test('a three-band rubric gets three distinct colours, not three of the same', () => {
  const cols = badges(rubric([
    { level: 'Kiwango cha juu', desc: 'anaonyesha umahiri kamili' },
    { level: 'Kiwango cha wastani', desc: 'anaonyesha umahiri wa kutosha' },
    { level: 'Kiwango cha chini', desc: 'anahitaji msaada' },
  ])).map((x) => x.colour);
  assert.strictEqual(cols.length, 3);
  assert.strictEqual(new Set(cols).size, 3, 'three bands, three colours');
});

test('a rubric written worst-first is not drawn upside down', () => {
  const items = [
    { level: 'Below Expectation', desc: 'needs help' },
    { level: 'Approaching Expectation', desc: 'two parts' },
    { level: 'Meeting Expectation', desc: 'three parts' },
    { level: 'Exceeding Expectation', desc: 'all four parts' },
  ];
  const auto = badges(rubric(items));
  assert.deepStrictEqual(auto.map((x) => x.colour),
    ['--c-red', '--c-amber', '--c-green', '--c-teal'],
    'the bottom band stays red wherever it sits in the list');
  // and a source can say so outright rather than relying on its wording
  const told = badges(rubric([
    { level: 'Band A', desc: 'lowest' }, { level: 'Band B', desc: 'middle' },
    { level: 'Band C', desc: 'highest' },
  ], { order: 'worst-first' }));
  assert.deepStrictEqual(told.map((x) => x.colour), ['--c-red', '--c-amber', '--c-teal']);
});

test('more bands than the palette still ramps monotonically', () => {
  const items = Array.from({ length: 6 }, (_, i) => ({ level: `Band ${6 - i}`, desc: `d${i}` }));
  const cols = badges(rubric(items)).map((x) => x.colour);
  assert.strictEqual(cols.length, 6);
  const RANK = { '--c-teal': 0, '--c-green': 1, '--c-amber': 2, '--c-red': 3 };
  for (let i = 1; i < cols.length; i++) {
    assert.ok(RANK[cols[i]] >= RANK[cols[i - 1]],
      `row ${i} must not rank better than row ${i - 1}: ${cols.join(', ')}`);
  }
});
