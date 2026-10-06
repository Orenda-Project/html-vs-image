'use strict';
// ICT grades 6–12 lessons in NIETE's approved design — ICT's own production page (v9.3 phone page,
// printed as two parts; the approved Grade 9 English, Grade 7 Mathematics and Grade 6 Urdu
// references, 2026-10-02). Real ICT lp_docs go through the adapter (guide/from-lpdoc.js) to the
// page (regions/ict/secondary.js) and are printed one page per part (render/part-pages-pdf.js).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildGuideFromLpDoc } = require('../guide/from-lpdoc');
const { composeSecondary } = require('../decorative/regions/ict/secondary');
const { pacingBar, subjectKind } = require('../decorative/regions/ict/secondary-art');

const FX = path.join(__dirname, '..', 'fixtures', 'ict');
const load = (f) => JSON.parse(fs.readFileSync(path.join(FX, f), 'utf8'));
const LESSONS = [
  ['G6 Islamiat (Urdu)', 'authored_PK_G6_ISLAMIAT_CH4_MASHAWARAT.lp.json'],
  ['G7 General Science', 'authored_PK_G7_GSCI_CH1_PHOTOSYNTHESIS.lp.json'],
  ['G8 English', 'authored_PK_G8_ENG_CH6_THE_BELLS_CLOSE_READING.lp.json'],
  ['G9 Mathematics (ICT gate lesson)', 'niete_v9_gate_base.lp.json'],
  ['G9 Physics', 'authored_PK_G9_PHYS_CH2_MOTION_UNDER_GRAVITY.lp.json'],
  ['G10 Urdu', 'authored_PK_G10_URDU_CH1_AKHLAQ_E_NABVI_BULAND_KHWANI.lp.json'],
  ['G11 Chemistry', 'authored_PK_G11_CHEM_CH4_MOLE_RATIO.lp.json'],
  // NIETE's three approved grades 6–12 references, rebuilt word for word from ICT production's PDFs
  ['G9 English (approved reference, rebuilt)', 'rebuilt_grade_9_english.c10.p135-136.reading_comprehension.lp.json'],
  ['G7 Mathematics (approved reference, rebuilt)', 'rebuilt_grade_7_mathematics.c12.p237-238.lp.json'],
  ['G6 Urdu (approved reference, rebuilt)', 'rebuilt_grade_6_urdu.c08.p044-044.qawaid.lp.json'],
];
// images as the pipeline hands them over: ICT's diagrams, drawn by its own engine, by id
const imagesOf = (guide) => Object.fromEntries((guide.images || []).map((im) => [im.id, { dataUri: im.dataUri, label: im.label }]));
const compose = (f) => { const { guide } = buildGuideFromLpDoc(load(f)); return { guide, out: composeSecondary(guide, imagesOf(guide)) }; };
// inline tags (a quote chip, a bold run) join their neighbours; block tags break; the wordless
// inline drawings (a ratio's blocks, a mark count's dots, a cause/effect tag's icon and arrow)
// carry no words
const words = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<annotation[\s\S]*?<\/annotation>/g, ' ')
  .replace(/<svg class="(?:sratio|smarks|sce-i|sce-ar)"[\s\S]*?<\/svg>/g, '').replace(/<\/?(?:span|b|bdi|i|em|strong)\b[^>]*>/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const norm = (s) => String(s).replace(/⁠/g, '').replace(/\*\*/g, '').replace(/[✗✓⚠📺🧰⏱🔑]️?/gu, ' ').replace(/\s+/g, ' ').trim();

// every string of every card, with the card it came from
function strings(sec, out = []) {
  for (const k of ['body', 'label', 'lead', 'heading', 'time']) if (sec[k]) out.push([sec.id, sec[k]]);
  for (const it of sec.items || []) for (const k of ['text', 'tag', 'q', 'a']) if (it[k]) out.push([sec.id, it[k]]);
  for (const b of [...(sec.left || []), ...(sec.right || [])]) strings({ ...b, id: sec.id }, out);
  return out;
}

test('every card ICT prints reaches the page, word for word (ten lessons, grades 6–11: seven real ICT lessons and the three approved references)', () => {
  for (const [name, f] of LESSONS) {
    const { guide, out } = compose(f);
    const page = norm(words(out.bodyHtml));
    assert.deepStrictEqual(out.counts.unknown, [], `${name}: every card has a layout`);
    let checked = 0;
    for (const [id, s] of guide.sections.flatMap((sec) => strings(sec))) {
      // maths is drawn by KaTeX; the words around it must be on the page as written
      for (const raw of String(s).split(/\$[^$]+\$/)) {
        // a label's parts may print as separate chips (the outcome code is a pill), so each part is checked
        for (const ln of raw.split('\n').flatMap((l) => l.split(' · '))) {
          // a numbered or bulleted line prints its marker as a badge; an MCQ option's letter as a bubble
          const piece = norm(ln.replace(/^\s*(?:\d+\.|[-•])\s+/, '').replace(/^\s*(\*\*)?([A-E])\.(\*\*)?\s+/, '$2 '));
          if (piece.replace(/[\s.,;:—–()→←·|-]/g, '').length < 3) continue;
          checked += 1;
          assert.ok(page.includes(piece), `${name}: «${piece.slice(0, 60)}» (${id}) is on the page`);
        }
      }
    }
    assert.ok(checked > 60, `${name}: ${checked} strings checked`);
  }
});

test('the page is the approved one: two parts, the lesson then the teacher support, stage bars in ICT\'s order', () => {
  const { out } = compose('niete_v9_gate_base.lp.json');
  const h = out.bodyHtml;
  assert.deepStrictEqual(out.pageLayout, { width: 520, parts: true });
  assert.strictEqual((h.match(/<section class="spart"/g) || []).length, 2, 'two parts');
  const [p1, p2] = h.split('<section class="spart"').slice(1);
  assert.ok(/class="shero"/.test(p1) && !/class="shero"/.test(p2), 'the title card opens part 1');
  assert.ok(/Teacher support · not for the board/.test(p2) && !/Teacher support · not for the board/.test(p1), 'part 2 is the teacher support');
  assert.deepStrictEqual([...p1.matchAll(/class="sbar sb-(\w+)"/g)].map((m) => m[1]), ['introduction', 'development', 'activity', 'conclusion', 'homework']);
  assert.deepStrictEqual([...p2.matchAll(/<span class="sgl">(\w)<\/span>/g)].map((m) => m[1]), ['A', 'B', 'C', 'D'], 'the support groups lettered A–D');
  assert.strictEqual((p1.match(/<span class="sbi"><svg/g) || []).length, 5, 'a picture on every stage bar');
  assert.ok(/Support pages follow/.test(p1), 'part 1 ends by saying the support follows');
  assert.ok(/Record up to 40 minutes of this lesson/.test(p2) && !/03\d{2}\s?\d{7}/.test(words(h)), 'the coaching steps print; the number does not, until that is decided');
});

test('Urdu lessons read right to left in their own labels, as the approved Urdu page does', () => {
  const { out } = compose('authored_PK_G10_URDU_CH1_AKHLAQ_E_NABVI_BULAND_KHWANI.lp.json');
  const h = out.bodyHtml;
  assert.ok(h.startsWith('<div class="icts" lang="ur" dir="rtl"'));
  for (const l of ['تعارف', 'تدریس', 'سرگرمی', 'اختتام', 'گھر کا کام', 'کوچنگ کارنر', 'صفحہ {n} از {m}']) assert.ok(h.includes(l), l);
  assert.ok(/اس سبق کی چالیس منٹ تک کی ریکارڈنگ بنائیے/.test(h), 'the coaching steps in Urdu');
});

test('the pacing bar is the lesson\'s own pacing line, or nothing', () => {
  const st = ['introduction', 'development', 'activity', 'conclusion', 'homework'];
  const bar = pacingBar('⏱ **Pacing** 10 + 12 + 12 + 4 + 2 = 40 min', st);
  assert.ok(/aria-label="pacing 10 \+ 12 \+ 12 \+ 4 \+ 2 = 40 minutes"/.test(bar));
  assert.strictEqual((bar.match(/<rect /g) || []).length, 5, 'one segment per stage');
  assert.strictEqual(pacingBar('10 + 12 + 12 + 4 + 2 = 41 min', st), '', 'numbers that do not add up draw nothing');
  assert.strictEqual(pacingBar('10 + 30 = 40 min', st), '', 'one number per stage, or nothing');
  assert.strictEqual((pacingBar('10 + 15 + 10 + 5 + 0 = 40 منٹ', st).match(/<rect /g) || []).length, 4, 'a 0-minute stage takes no room');
});

test('the visual examples draw only the lesson\'s own numbers, formulas and words, and never an answer it leaves blank', () => {
  const art = require('../decorative/regions/ict/secondary-art');
  // the worked matrix product: the lesson's matrices, its steps' own values
  const g9 = compose('niete_v9_gate_base.lp.json').out.bodyHtml;
  const viz = [...g9.matchAll(/<div class="sviz-w sviz-m"><svg[\s\S]*?<\/svg><\/div>/g)].map((m) => m[0]);
  assert.strictEqual(viz.length, 2, 'one picture for the worked example (I do), one for the one done together (We do)');
  const nums = (svg) => [...svg.matchAll(/>(-?[\d.]+|\?)<\/text>/g)].map((m) => m[1]);
  const lessonNums = new Set('1 2 3 0 4 5 8 11 12'.split(' '));
  assert.ok(nums(viz[0]).every((n) => lessonNums.has(n) || /^[2-5]$/.test(n)), 'I do: only the lesson\'s numbers (and its step numbers 2–5)');
  assert.ok(nums(viz[1]).includes('?'), 'We do: the steps left for pupils show "?"');
  assert.ok(!/>8<\/text>[\s\S]*>6<\/text>/.test(viz[1].split('?')[0]), 'We do: the answers pupils fill in are not drawn before the "?"');
  // reactions: one dot per coefficient
  const r = art.reaction('2Mg + O2 -> 2MgO');
  assert.strictEqual((r.match(/<circle /g) || []).length, 5, '2 + 1 + 2 dots');
  assert.strictEqual(art.reaction('not a reaction'), '');
  // ratios and marks
  assert.strictEqual((art.ratioBlocks([2, 3]).match(/<rect /g) || []).length, 5);
  assert.strictEqual(art.ratioBlocks([4, 32]), '', 'a ratio with a part over 6 draws nothing');
  assert.strictEqual((art.marksDots(4).match(/<circle /g) || []).length, 4);
  // nothing is illustrated inside "What pupils write" (it is a pupil's mistake)
  const chem = compose('authored_PK_G11_CHEM_CH4_MOLE_RATIO.lp.json').out.bodyHtml;
  for (const q of chem.split('<div class="smq">').slice(1).map((x) => x.split('<div class="sma">')[0])) assert.ok(!/class="(sratio|smarks|sviz-w)"/.test(q));
  // every reaction drawn is one the lesson writes
  const src = JSON.stringify(load('authored_PK_G11_CHEM_CH4_MOLE_RATIO.lp.json'));
  for (const m of chem.matchAll(/aria-label="reaction ([^"]+)"/g)) assert.ok(src.includes(m[1].replace(/&gt;/g, '>').split(' ')[0]), m[1]);
});

test('subject by subject, each new picture is drawn from the lesson\'s own words and numbers', () => {
  const art = require('../decorative/regions/ict/secondary-art');
  // MATHEMATICS — the mean: the I do's own six values as bars, its stated mean as the line
  const m = compose('rebuilt_grade_7_mathematics.c12.p237-238.lp.json').out.bodyHtml;
  const charts = [...m.matchAll(/<svg class="sviz smean"[\s\S]*?<\/svg>/g)].map((x) => x[0]);
  assert.strictEqual(charts.length, 2, 'one chart for the I do, one for the We do');
  const vals = (svg) => [...svg.matchAll(/font-size="12" fill="#13315C">(-?[\d.]+)<\/text>/g)].map((x) => Number(x[1]));
  assert.deepStrictEqual(vals(charts[0]), [70, 62, 55, 94, 79, 86], 'I do: the lesson\'s values, in its order');
  assert.ok(/X = 74\.33</.test(charts[0]) && /stroke-dasharray="7 4"/.test(charts[0]), 'I do: the mean the lesson states, as a line');
  assert.deepStrictEqual(vals(charts[1]), [50, 48, 49, 51, 52]);
  assert.ok(/X = \?</.test(charts[1]) && !/stroke-dasharray="7 4"/.test(charts[1]), 'We do: the mean is left for pupils — "?", no line');
  assert.strictEqual(art.meanChart({ values: [1, 2, 3], mean: '5' }), '', 'a stated mean that is not the values\' mean draws nothing');
  assert.ok(/X = \?/.test(art.meanChart({ values: [3, 1, 2], mean: '?', rtl: true })), 'Urdu: the same chart, right to left');
  // ENGLISH — cause and effect: each label a tag, an arrow only from a labelled cause to its effect
  const e = compose('rebuilt_grade_9_english.c10.p135-136.reading_comprehension.lp.json').out.bodyHtml;
  assert.strictEqual((e.match(/class="sce sce-c"/g) || []).length, (e.match(/class="sce sce-e"/g) || []).length, 'every cause tag has its effect');
  assert.strictEqual((e.match(/class="sce-w"/g) || []).length, 4, 'an arrow for each "Cause: … Effect: …" (warm-up, I do, We do, P1), none in a sentence');
  assert.ok(/the <span class="sce sce-c"><svg[\s\S]*?<\/svg>CAUSE<\/span> and which is the <span class="sce sce-e">/.test(e), 'the words stay as written, no arrow mid-sentence');
  assert.ok(art.ceArrow(true).includes('M25 6H6') && art.ceArrow(false).includes('M1 6h19'), 'the arrow points the way the line reads');
  // the ideas the lesson names get their pictures: key words, and key points when every point has one
  assert.strictEqual((e.match(/class="sini sini-t"/g) || []).length, 4, 'cause, effect, fact, opinion');
  assert.strictEqual((e.match(/<i class="skpi">/g) || []).length, 3, 'English key points: cause, fact, one-act play');
  // URDU — the kinds of اسم
  const u = compose('rebuilt_grade_6_urdu.c08.p044-044.qawaid.lp.json').out.bodyHtml;
  assert.strictEqual((u.match(/<i class="skpi">/g) || []).length, 5, 'one picture per kind of اسم in the key points');
  assert.strictEqual((u.match(/class="sini sini-t"/g) || []).length, 3);
  assert.deepStrictEqual(['اسم جمع بظاہر', 'اسم صوت کسی آواز', 'اسم آلہ کسی اوزار'].map((w) => art.termOf(w)), ['jama', 'saut', 'aala']);
  // a key-point list where one point has no picture keeps its plain dots (Mathematics)
  assert.ok(!/<i class="skpi">/.test(m) && (m.match(/class="sini sini-t"/g) || []).length === 2, 'Maths: the mean and Σ keep their pictures as key words only');
  // a pupil's mistake is never decorated
  for (const q of e.split('<div class="smq">').slice(1).map((x) => x.split('<div class="sma">')[0])) assert.ok(!/class="sce|smean/.test(q));
});

test('each subject gets its own title picture, chosen by the subject only', () => {
  assert.strictEqual(subjectKind('Mathematics'), 'maths');
  assert.strictEqual(subjectKind('Urdu'), 'urdu');
  assert.strictEqual(subjectKind('General Science'), 'science');
  assert.strictEqual(subjectKind('Chemistry'), 'chemistry');
  assert.strictEqual(subjectKind('Islamiat'), 'islamiat');
  assert.strictEqual(subjectKind('Something new'), 'general');
});

test('isolation: grades 6–12 and Grades 1–5 each get their own page, and share no style', () => {
  const pack = require('../decorative/regions/ict/theme');
  const g612 = buildGuideFromLpDoc(load('niete_v9_gate_base.lp.json')).guide;
  const a = pack.COMPOSE(g612, imagesOf(g612));
  assert.ok(a.bodyHtml.startsWith('<div class="icts"') && /\.icts\b/.test(a.headCss) && !/\.ictq\b/.test(a.headCss));
  const { buildGuideFromPrimary } = require('../guide/from-primary');
  const g15 = buildGuideFromPrimary(JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'ict-primary', 'g1_ch9_Maths_seg1.lesson.json'), 'utf8'))).guide;
  const b = pack.COMPOSE(g15, {});
  assert.ok(b.bodyHtml.startsWith('<div class="ictq"') && !/\.icts\b/.test(b.headCss));
  assert.deepStrictEqual(b.pageLayout, { width: 520, height: 2000, flow: true }, 'Grades 1–5 keep their own pages');
  for (const f of ['primary.js', 'primary-art.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'decorative', 'regions', 'ict', f), 'utf8');
    assert.ok(!/secondary/.test(src), `${f} does not reach into the grades 6–12 page`);
  }
  for (const f of ['secondary.js', 'secondary-art.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', 'decorative', 'regions', 'ict', f), 'utf8');
    assert.ok(!/require\([^)]*primary/.test(src), `${f} does not import the Grades 1–5 page`);
  }
});

// ── printed ───────────────────────────────────────────────────────────────────────────────
const mediaBoxes = (pdf) => [...pdf.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);
// the G7 Mathematics reference also guards a long answer formula ("Sum = 73 + 79 + … = 756"), which
// must wrap at its + and = as on ICT's page instead of running off it
for (const [name, f, lang] of [['G9 Mathematics', 'niete_v9_gate_base.lp.json', 'en'], ['G10 Urdu', 'authored_PK_G10_URDU_CH1_AKHLAQ_E_NABVI_BULAND_KHWANI.lp.json', 'ur'],
  ['G7 Mathematics (approved reference, rebuilt)', 'rebuilt_grade_7_mathematics.c12.p237-238.lp.json', 'en']]) {
  test(`${name} prints as the approved design does: two 390 pt pages, each as tall as its part, nothing outside, nothing bought`, { timeout: 180000 }, async () => {
    const { renderLessonImage } = require('../pipeline');
    const { guide } = buildGuideFromLpDoc(load(f));
    const r = await renderLessonImage(guide, { apiKey: '', pdf: true, log: () => {} });
    const boxes = mediaBoxes(r.pdf);
    assert.strictEqual(boxes.length, 2, 'two pages');
    for (const [w, h] of boxes) { assert.ok(Math.abs(w - 390) < 0.5, `width ${w}`); assert.ok(h > 500, `height ${h}`); }
    assert.ok(boxes[0][1] > boxes[1][1], 'the lesson is the longer part');
    assert.deepStrictEqual(r.overflow, [], 'nothing leaves its page');
    assert.strictEqual(r.stats.generated, 0, 'no picture generated');
    assert.ok(![...r.html.matchAll(/<img [^>]*src="([^"]{0,30})/g)].some((m) => !/^data:image\/svg\+xml/.test(m[1])), 'every picture is SVG');
    assert.ok(r.html.includes(`<div class="icts" lang="${lang}"`) && /page 1 of 2|صفحہ 1 از 2/.test(r.html), 'the .html is the printed pages, numbered');
    assert.ok(!/katex-error|mjx-merror|data-mjx-error/.test(r.html), 'every formula parsed');
  });
}
