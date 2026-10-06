'use strict';
// ICT's own Grades 1–5 slide scripts (Stage D0 of its K-5 pipeline, `_slide_script.json`) drawn on
// our Grades 1–5 page instead of by the image model. The two fixtures are real pipeline output
// (G2 and G3 Maths, Ch.1 lesson 1, round v8), as published for niete-curriculum-explorer; only the
// operator's local `meta.sourceFile` path was taken out.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { isSlideScript, lessonFromSlideScript } = require('../guide/from-slide-script');
const { buildGuideFromPrimary, isPrimaryLesson } = require('../guide/from-primary');
const { composePrimary } = require('../decorative/regions/ict/primary');
const art = require('../decorative/regions/ict/primary-art');

const SS = path.join(__dirname, '..', 'fixtures', 'ict-primary', 'slide-scripts');
const load = (f) => JSON.parse(fs.readFileSync(path.join(SS, f), 'utf8'));
const G2 = () => load('grade_2_math_ch1_seg1.slide_script.json');
const G3 = () => load('grade_3_math_ch1_seg1.slide_script.json');
const BOTH = [['G2 Maths', G2], ['G3 Maths', G3]];
const compose = (ss) => composePrimary(buildGuideFromPrimary(lessonFromSlideScript(ss)).guide);
const words = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const asPrinted = (s) => String(s).replace(/_{3,}/g, ' ').replace(/\[(cube|flat|rod|dot|bigbundle|bundle|stick)\]/g, ' ').replace(/\s+/g, ' ').trim();

// every teacher-facing field of a slide script, read straight from the script (not from the adapter)
function scriptTexts(ss) {
  const m = ss.meta; const h = ss.hook; const i = ss.iDo; const w = ss.weDo; const y = ss.youDo; const r = ss.wrap;
  const out = [m.topic, ss.goal, ss.sloCode, ss.sloFull, ...(m.sloDescriptions || []), ...(m.materials || []),
    ...(m.comingUp || []).slice(0, 3).map((d) => d.topic),
    ...(h.keyWords || []).flatMap((k) => [k.term, k.urdu, k.syllables, k.def]),
    h.board.instruction, ...String(h.board.content).split('\n').filter((l) => !/^[A-Za-z |]+$/.test(l) || !l.includes('|')),
    h.warmUp.teacherAsks, h.warmUp.expectedAnswer, h.warmUp.recallOf, h.warmUp.nextLine, ss.warmUpPeerMove,
    h.story, ...(h.objects || []), ...(h.conversation || []).flatMap((c) => [c.teacherAsks, c.listenFor]),
    ...(i.steps || []).flatMap((s) => [s.action, s.say, s.sayLocal]), i.teacherSays, i.teacherSaysLocal, i.keyFact,
    i.worked.problem, ...i.worked.work, i.worked.answer, i.cfu, i.cfuPassSignal, i.ifStruggle,
    i.misconception.slip, i.misconception.why, i.misconception.fix,
    w.action, w.strategy, w.modelled.problem, ...w.modelled.work, w.modelled.answer,
    w.partner.instruction, w.partner.a, w.partner.b, w.partner.teacherRole, w.cfu,
    y.action, ...y.problems.flatMap((p) => [p.prompt, p.answer, p.ref]), y.wordProblem.prompt, y.wordProblem.answer,
    ...[y.behind, y.ahead].flatMap((d) => [d.prompt, d.answer, d.coach]),
    ...r.exitOptions.flatMap((o) => [o.prompt, o.promptLocal, ...(o.choices || []), o.answer, o.howToRun]),
    ss.exitSuccessCriteria, ss.exitSelfPredict, ...r.keyFacts, ...r.homework, r.reflection];
  return out.filter((s) => s != null && String(s).trim());
}

test('a slide script is recognised and becomes a valid Grades 1–5 lesson, labelled as real pipeline output', () => {
  for (const [name, doc] of BOTH) {
    assert.ok(isSlideScript(doc()), name);
    const lesson = lessonFromSlideScript(doc(), { origin: 'test' });
    assert.ok(isPrimaryLesson(lesson), name);
    assert.match(lesson.source.method, /^REAL PIPELINE OUTPUT/, `${name}: says where it came from`);
    const { guide, report } = buildGuideFromPrimary(lesson);
    assert.deepStrictEqual(guide.images, [], `${name}: nothing to buy`);
    assert.deepStrictEqual(report.stages, ['opening', 'explanation', 'we_do', 'you_do', 'check', 'homework']);
  }
  assert.ok(!isSlideScript({ kind: 'ict-primary-lesson' }), 'a lesson file is not a slide script');
  const urdu = G2(); urdu.meta.urduMedium = true;
  assert.throws(() => lessonFromSlideScript(urdu), /Urdu-medium slide script is not mapped yet/, 'refused, not half printed');
});

test('nothing the slide script tells the teacher is dropped: every field prints on the page, word for word', () => {
  for (const [name, doc] of BOTH) {
    const ss = doc();
    const page = words(compose(ss).bodyHtml);
    for (const s of scriptTexts(ss)) {
      for (const piece of asPrinted(s).split(/(?<=[.!?])\s+(?=[A-Z0-9"“‘'(])/)) {
        assert.ok(page.includes(piece.trim()), `${name}: «${piece.slice(0, 70)}» is on the page`);
      }
    }
  }
});

test('what is not printed: the image-model drawing prompts and the operator notes', () => {
  for (const [name, doc] of BOTH) {
    const ss = doc();
    const page = words(compose(ss).bodyHtml);
    assert.ok(!/\[(bundle|bigbundle|cube|flat|rod|dot)\]\s*\[/.test(page), `${name}: no "[bundle][bundle]…" prompt text`);
    assert.ok(!page.includes(ss.meta.designNotes.slice(0, 40)), `${name}: no operator design notes`);
  }
});

test('place value is drawn from the number itself: one piece per unit of each digit, an empty column for a zero', () => {
  const count = (svg, re) => (svg.match(re) || []).length;
  const sticks = art.draw({ type: 'place_value', number: '342', heads: ['Hundreds', 'Tens', 'Ones'], kind: 'sticks' });
  assert.strictEqual(count(sticks, /width="32" height="5"/g), 3 * 2, 'three hundred-bundles (two bands each)');
  assert.strictEqual(count(sticks, /width="18" height="5"/g), 4, 'four bundles of ten');
  assert.strictEqual(count(sticks, /width="4" height="56"/g), 2, 'two sticks');
  const zero = art.draw({ type: 'place_value', number: '602', heads: ['Hundreds', 'Tens', 'Ones'], kind: 'sticks' });
  assert.strictEqual(count(zero, /width="18" height="5"/g), 0, 'no bundle for the 0 tens');
  assert.ok(/>0<\/text>/.test(zero), 'the 0 is still written under its column');
  const blocks = art.draw({ type: 'place_value', number: '1986', heads: ['Thousands', 'Hundreds', 'Tens', 'Ones'], kind: 'blocks' });
  assert.strictEqual(count(blocks, /fill="#C49BF2"/g), 1, 'one cube');
  assert.strictEqual(count(blocks, /fill="#FFD2A6"/g), 9, 'nine flats');
  assert.strictEqual(count(blocks, /fill="#BFDDFF"/g), 8, 'eight rods');
  assert.strictEqual(count(blocks, /r="6" fill="#FF6B6B"/g), 6, 'six dots');
  const bad = lessonFromSlideScript(G3()); bad.stages[1].blocks.find((b) => b.type === 'worked').visual.number = '12345';
  assert.throws(() => buildGuideFromPrimary(bad), /does not fit its 4 places/);
});

test('each worked number is drawn, and the drawing agrees with the sum printed beside it', () => {
  for (const [name, doc, nums] of [['G2 Maths', G2, ['342', '256']], ['G3 Maths', G3, ['9999', '1986']]]) {
    const lesson = lessonFromSlideScript(doc());
    const drawn = lesson.stages.flatMap((s) => s.blocks).filter((b) => b.type === 'worked').map((b) => b.visual.number);
    assert.deepStrictEqual(drawn, nums, name);
    for (const b of lesson.stages.flatMap((s) => s.blocks).filter((x) => x.type === 'worked')) {
      const terms = b.answer.split('=')[1].split(',')[0].split('+').map((t) => Number(t.trim()));
      assert.strictEqual(terms.reduce((a, c) => a + c, 0), Number(b.visual.number), `${name}: ${b.answer}`);
    }
  }
});

test('G2 Maths from ICT\'s slide script prints on phone pages: nothing outside its page, nothing bought', { timeout: 120000 }, async () => {
  const { renderLessonImage } = require('../pipeline');
  const { guide } = buildGuideFromPrimary(lessonFromSlideScript(G2()));
  const r = await renderLessonImage(guide, { apiKey: '', pdf: true, log: () => {} });
  const pages = [...r.pdf.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)];
  assert.ok(pages.length >= 5 && pages.length <= 8, `${pages.length} pages`);
  assert.deepStrictEqual(r.overflow, []);
  assert.strictEqual(r.stats.generated, 0);
  assert.ok(!/<img\b/.test(r.html), 'every picture is SVG drawn in code');
});

module.exports = { G2, G3 };
