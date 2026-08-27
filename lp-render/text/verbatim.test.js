'use strict';
// The verbatim check is the evidence behind "the raw text was not shortened or
// rewritten", so it has to be right in both directions: it must pass text that only
// differs by things that are not rewriting, and it must FAIL a paraphrase. A checker
// that only ever passes would be worse than none — this repo has already been burned
// once by a check that shared its subject's blind spot.
const test = require('node:test');
const assert = require('node:assert');
const { checkVerbatim, norm } = require('./verbatim');

const SOURCE = {
  meta: { subject: 'العلوم', grade: 2 },
  sections: [
    { body: 'يعرض المعلم نباتًا حقيقيًا أو صورة كبيرة أمام الفصل ويسأل: هل النبات كائن حي أم غير حي؟' },
    { body: 'الجذور هي التي تمتص الماء من التربة، والساق ينقل هذا الماء إلى الأوراق.' },
    { items: [{ text: 'يكتب التلميذ ١٦ ÷ ٤ = ٤ في دفتره.' }] },
  ],
};

const guide = (sections) => ({ sections });

test('text copied from the source passes', () => {
  const r = checkVerbatim(guide([
    { id: 'stage-arad', type: 'steps', items: [
      { label: '', body: 'الجذور هي التي تمتص الماء من التربة، والساق ينقل هذا الماء إلى الأوراق.' },
      { label: 'تحقق', body: 'يكتب التلميذ ١٦ ÷ ٤ = ٤ في دفتره.' },
    ] },
  ]), SOURCE);
  assert.strictEqual(r.deviations.length, 0, JSON.stringify(r.deviations));
  assert.strictEqual(r.checked, 1, 'the body counts here; the تحقق line is counted separately');
  assert.strictEqual(r.checkLinesChecked, 1);
  assert.strictEqual(r.checkLineDeviations.length, 0, 'this تحقق line IS source text');
});

test('an authored تحقق line is reported in its own category', () => {
  // The template demands a per-stage criterion; many lessons do not state one, so the
  // model writes it. That must be visible, but it is not "the teacher's text reworded".
  const r = checkVerbatim(guide([
    { id: 'stage-tatbiq', type: 'steps', items: [
      { label: '', body: 'الجذور هي التي تمتص الماء من التربة، والساق ينقل هذا الماء إلى الأوراق.' },
      { label: 'تحقق', body: 'يرسم التلميذ شكلاً رباعياً باستخدام النقاط.' },
    ] },
  ]), SOURCE);
  assert.strictEqual(r.deviations.length, 0, 'the body is source text');
  assert.strictEqual(r.checkLineDeviations.length, 1, 'the authored criterion is reported');
});

test('a paraphrase is caught', () => {
  // Same meaning, different words — exactly what must not happen.
  const r = checkVerbatim(guide([
    { id: 'stage-arad', type: 'steps', items: [{ label: '', body: 'الجذور تمتص الماء والساق ينقله.' }] },
  ]), SOURCE);
  assert.strictEqual(r.deviations.length, 1);
  assert.match(r.deviations[0].id, /stage-arad/);
});

test('a shortened sentence is caught', () => {
  const r = checkVerbatim(guide([
    { id: 'stage-tamhid', type: 'steps', items: [{ label: '', body: 'يعرض المعلم نباتًا ويسأل سؤالًا.' }] },
  ]), SOURCE);
  assert.strictEqual(r.deviations.length, 1);
});

test('diacritics, alef forms, digits and markdown are not rewriting', () => {
  const r = checkVerbatim(guide([
    // fully diacritised, bare alef, Western digits, wrapped in bold — same sentence
    { id: 'goal', type: 'note', body: '**هدف اليوم:** يكتب التلميذ 16 ÷ 4 = 4 في دفتره.' },
  ]), SOURCE);
  assert.strictEqual(r.deviations.length, 0, JSON.stringify(r.deviations));
});

test('template chrome is not counted as lesson text', () => {
  const r = checkVerbatim(guide([
    { id: 'stage-taqwim', type: 'steps', time: '١٠ دقائق · أنت تفعل',
      heading: 'التقويم والختام',
      items: [{ label: 'تحقق', body: 'يكتب التلميذ ١٦ ÷ ٤ = ٤ في دفتره.' }] },
  ]), SOURCE);
  assert.strictEqual(r.deviations.length, 0);
  assert.strictEqual(r.checked, 0, 'heading/time/label are chrome; the تحقق body is its own category');
  assert.strictEqual(r.checkLinesChecked, 1);
});

test('figure labels are reported separately, not as body deviations', () => {
  const r = checkVerbatim(guide([
    { id: 'errors', type: 'qa', codeFigure: { kind: 'error-board', labelWrong: 'خلط الأجزاء',
      labelCorrect: 'التمييز الصحيح' } },
  ]), SOURCE);
  assert.strictEqual(r.deviations.length, 0, 'a short drawn label is not a body deviation');
  assert.strictEqual(r.labelDeviations.length, 2, 'but it is still reported');
});

test('normalisation collapses only the harmless differences', () => {
  assert.strictEqual(norm('أُسْرَتِي'), norm('اسرتي'));
  assert.strictEqual(norm('١٦ ÷ ٤'), norm('16 ÷ 4'));
  assert.notStrictEqual(norm('الجذور تمتص الماء'), norm('الجذور تمتص الماء من التربة'));
});
