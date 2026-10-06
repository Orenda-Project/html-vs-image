'use strict';
// ICT Grades 1–5 lessons in NIETE's approved phone-page design (lp_html v8.1; the Grade 1 English,
// Grade 1 Maths and Grade 2 Urdu references, 2026-10-01): one column, 520 px, on tall 520×2000
// pages; laid out by the ict pack's primary.js from an "ict-primary-lesson" file
// (guide/from-primary.js), with pictures drawn in code (primary-art.js), and flowed onto pages by
// render/phone-pages-pdf.js.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildGuideFromPrimary, isPrimaryLesson, printedTexts } = require('../guide/from-primary');
const { composePrimary } = require('../decorative/regions/ict/primary');
const art = require('../decorative/regions/ict/primary-art');

const FX = path.join(__dirname, '..', 'fixtures', 'ict-primary');
const load = (f) => JSON.parse(fs.readFileSync(path.join(FX, f), 'utf8'));
const MATHS = () => load('g1_ch9_Maths_seg1.lesson.json');
const ENGLISH = () => load('g1_ch10_English_seg1.lesson.json');
const URDU = () => load('g2_ch10_Urdu_seg2.lesson.json');
// three more lessons, other grades and other content, written from public textbook pages for design testing
const G3_ENGLISH = () => load('g3_u5_English_road_safety.lesson.json');
const G2_MATHS = () => load('g2_u1_Maths_ordinal_numbers.lesson.json');
const G4_URDU = () => load('g4_l4_Urdu_achhe_shehri.lesson.json');
const ALL = [['Maths', MATHS], ['English', ENGLISH], ['Urdu', URDU], ['G3 English', G3_ENGLISH], ['G2 Maths', G2_MATHS], ['G4 Urdu', G4_URDU]];
// the four newer approved Grades 1–5 lessons (2026-10-05: Science G4, GK G1, Islamiat G1, SST G5), rebuilt
// field by field from the approved PDFs — their lp_doc JSON is not reachable from here
const SCIENCE = () => load('g4_ch8_Science_seg2.lesson.json');
const GK = () => load('g1_ch1_GK_seg1.lesson.json');
const ISLAMIAT = () => load('g1_ch4_Islamiat_seg6.lesson.json');
const SST = () => load('g5_ch2_SST_seg3.lesson.json');
const REBUILT = [['G4 Science', SCIENCE], ['G1 GK', GK], ['G1 Islamiat', ISLAMIAT], ['G5 SST', SST]];
// two lessons straight from ICT's own Grades 1–5 pipeline: its Stage D0 slide scripts (G2, G3 Maths)
const { lessonFromSlideScript } = require('../guide/from-slide-script');
const script = (f) => () => lessonFromSlideScript(JSON.parse(fs.readFileSync(path.join(FX, 'slide-scripts', f), 'utf8')));
const PIPELINE = [['G2 Maths (ICT slide script)', script('grade_2_math_ch1_seg1.slide_script.json')], ['G3 Maths (ICT slide script)', script('grade_3_math_ch1_seg1.slide_script.json')]];
// and one from ICT's HTML path for Grades 1–5: its own lp_doc 3.0 (G1 GK, Urdu)
const { lessonFromLpDocPrimary } = require('../guide/from-lpdoc-primary');
PIPELINE.push(['G1 GK (ICT lp_doc)', () => lessonFromLpDocPrimary(JSON.parse(fs.readFileSync(path.join(FX, 'lp-doc', 'GK_g1_seg2.ur.lp.json'), 'utf8')))]);
const compose = (doc) => composePrimary(buildGuideFromPrimary(doc).guide);
// the page's words, as a reader sees them: tags off, entities decoded, spaces collapsed
const words = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
// a source string as the page prints it: a pause mark becomes a chip (its number stays), a blank a line
const asPrinted = (s) => String(s).replace(/⏸/g, ' ').replace(/_{3,}/g, ' ').replace(/\s+/g, ' ').trim();

test('the approved lessons and three lessons from other grades are valid Grades 1–5 lesson files', () => {
  for (const [name, doc] of ALL) {
    assert.ok(isPrimaryLesson(doc()), name);
    const { guide, report } = buildGuideFromPrimary(doc());
    assert.strictEqual(guide.meta.region, 'ict');
    assert.strictEqual(guide.layout.kind, 'ict-primary');
    assert.deepStrictEqual(guide.images, [], `${name}: nothing to buy`);
    assert.deepStrictEqual(report.stages, ['opening', 'explanation', 'we_do', 'you_do', 'check', 'homework']);
    assert.ok(report.pictures >= 4, `${name}: ${report.pictures} pictures`);
  }
});

test('a lesson the page cannot lay out is refused, not printed with parts missing', () => {
  const bad = MATHS(); bad.stages[0].blocks.push({ type: 'poem', lines: ['x'] });
  assert.throws(() => buildGuideFromPrimary(bad), /no layout for block type "poem"/);
  const pic = MATHS(); pic.board[0].visual = { type: 'volcano' };
  assert.throws(() => buildGuideFromPrimary(pic), /no drawing for picture type "volcano"/);
  const time = MATHS(); time.hero_visual = { type: 'clock', time: 'nine' };
  assert.throws(() => buildGuideFromPrimary(time), /not h:mm/);
  const order = MATHS(); order.stages.reverse();
  assert.throws(() => buildGuideFromPrimary(order), /out of order/);
});

test('nothing the lesson says is dropped: every text prints on the page', () => {
  for (const [name, doc] of [...ALL, ...REBUILT]) {
    const lesson = doc();
    const page = words(compose(lesson).bodyHtml);
    for (const s of printedTexts(lesson)) {
      // the page may wrap a teacher line in quotes and break a long paragraph between sentences
      for (const piece of asPrinted(s).split(/(?<=[.!?۔؟])\s+(?=[A-Z0-9"“‘'(؀-ۿ])/)) {
        // a read-aloud line's speaker is the name on its speech bubble ("Pinky: “…”" → Pinky “…”)
        const bubble = piece.replace(/^([^:“"]{1,40}):\s*(?=[“"])/, '$1 ');
        assert.ok(page.includes(piece.trim()) || page.includes(bubble.trim()), `${name}: «${piece.slice(0, 60)}» is on the page`);
      }
    }
  }
});

test('the approved pages\' print defects are fixed', () => {
  const m = words(compose(MATHS()).bodyHtml);
  assert.ok(m.includes('I am reading the analogue clock on p.222.'), 'the teacher line split at "p." is one line');
  assert.ok(!/model_solution/.test(m), 'no leaked key');
  assert.ok(!/\|-{3,}|-{4,}\s*hour hand/.test(m), 'no text-drawn clock');
  const e = compose(ENGLISH()).bodyHtml;
  assert.ok(!/model_solution/.test(e) && /Sample answer/.test(e), 'sample answers are named as such');
  assert.ok(!/\[TITLE \+ PICTURE/.test(words(e)), 'the board sketch note is a drawing, not text');
  const u = compose(URDU()).bodyHtml;
  assert.ok(!/avatar/.test(u), 'no internal word');
  assert.ok(/<table class="q-track"/.test(u) && !/\|جوڑی کا نام\|/.test(words(u)), 'the fluency tracker is a real table');
  assert.ok(/<div class="q-story" dir="rtl">/.test(u) && /←/.test(u) && !/q-story[^>]*>[^]*?→/.test(u.split('q-story')[1].split('</div>')[0]), 'the story map reads right to left with arrows that point that way');
  assert.ok(!/03\d{2}\s?\d{7}/.test(words(u) + words(e) + m), 'the coaching number is not printed yet');
});

test('Urdu: the page reads right to left in its own labels; an English-only line reads left to right', () => {
  const u = compose(URDU()).bodyHtml;
  assert.ok(u.startsWith('<div class="ictq" lang="ur" dir="rtl"'));
  for (const l of ['تختۂ سیاہ پر لکھیے', 'کلیدی الفاظ', 'تدریسی نتیجہ', 'اختتامی پرچی', 'کوچنگ کارنر', 'صفحہ {n} از {m}']) assert.ok(u.includes(l), l);
  assert.ok(/<div class="q-half" dir="ltr">.*Halfway check/.test(u), 'the English halfway note is left to right');
  assert.ok(/dir="rtl">Echo-Reading سہارا/.test(u), 'a line that starts with an English word still starts on the right');
  assert.ok(/<span class="q-pz"><i><\/i><i><\/i><b>۲<\/b><\/span>/.test(u), 'the pause sign ⏸۲ is drawn with its number');
  const e = compose(ENGLISH()).bodyHtml;
  assert.ok(e.startsWith('<div class="ictq" lang="en" dir="ltr"') && /Write on the board/.test(e));
});

test('the clocks are drawn at the lesson\'s own time: short thick hour hand, long thin minute hand', () => {
  const hands = (svgText) => [...svgText.matchAll(/<line x1="100" y1="100" x2="([\d.-]+)" y2="([\d.-]+)" stroke="(#[0-9A-F]+)" stroke-width="([\d.]+)"/gi)]
    .map((m) => ({ x: +m[1] - 100, y: +m[2] - 100, color: m[3], w: +m[4] }));
  const at = (t) => { const [h, mn] = hands(art.draw({ type: 'clock', time: t })); return { h, mn }; };
  const nine = at('9:00');
  assert.ok(nine.h.x < -30 && Math.abs(nine.h.y) < 1, 'at 9:00 the hour hand points to 9');
  assert.ok(Math.abs(nine.mn.x) < 1 && nine.mn.y < -60, 'and the minute hand to 12');
  assert.ok(Math.hypot(nine.h.x, nine.h.y) < Math.hypot(nine.mn.x, nine.mn.y) && nine.h.w > nine.mn.w, 'hour hand shorter and thicker');
  const eleven = at('11:00');
  assert.ok(eleven.h.x < 0 && eleven.h.y < 0 && Math.abs(Math.atan2(eleven.h.x, -eleven.h.y) * 180 / Math.PI + 30) < 0.5, 'at 11:00 the hour hand points to 11');
  const six = at('6:00');
  assert.ok(Math.abs(six.h.x) < 1 && six.h.y > 30, 'at 6:00 the hour hand points to 6');
  assert.throws(() => art.draw({ type: 'clock', time: '25:00' }), /not a time/);
  const pair = art.draw({ type: 'clock_pair', time: '9:00', digital: '09:00', digital_label: 'Hours | Minutes' });
  assert.ok(/>09:00</.test(pair) && />Hours</.test(pair) && />Minutes</.test(pair), 'the digital clock shows the lesson\'s digits and labels');
});

test('the letter pictures show the lesson\'s own sounds and word', () => {
  const b = art.draw({ type: 'blender', parts: ['s', 'u', 'nn', 'y'], word: 'sunny' });
  for (const t of ['>s<', '>u<', '>nn<', '>y<', '>sunny<']) assert.ok(b.includes(t), t);
  const steps = art.draw({ type: 'blend_steps', steps: [['s', 'u', 'su'], ['su', 'nn', 'sun'], ['sun', 'y', 'sunny']] });
  for (const t of ['>su<', '>sun<', '>sunny<']) assert.ok(steps.includes(t), `step ${t}`);
  assert.ok(!steps.includes('>sunn<'), 'the steps are the lesson\'s, not the letters joined');
  const list = art.draw({ type: 'blender_list', words: [['gr', 'ou', 'nd'], ['c', 'are']] });
  for (const t of ['>gr<', '>ou<', '>nd<', '>c<', '>are<']) assert.ok(list.includes(t), t);
  assert.ok(!/<image\b|data:image\/(png|jpe?g)/.test(b + steps + list), 'drawn, not pictures');
});

test('the story pictures carry the lesson\'s own facts: the poster\'s shows at their times, Bunty\'s two clocks at 9:00', () => {
  const handsAt = (svgText, cx, cy) => [...svgText.matchAll(new RegExp(`<line x1="${cx}" y1="${cy}" x2="([\\d.-]+)" y2="([\\d.-]+)"`, 'g'))].map((m) => [+m[1] - cx, +m[2] - cy]);
  const deg = ([x, y]) => (Math.atan2(x, -y) * 180 / Math.PI + 360) % 360;
  const p = art.draw({ type: 'poster', title: 'FUN FAIR', items: [{ text: 'PUPPET SHOW', time: '11:00', icon: 'puppet' }, { text: 'FIREWORKS', time: '6:00', icon: 'fireworks' }] });
  for (const t of ['>FUN FAIR<', '>PUPPET SHOW<', '>11:00<', '>FIREWORKS<', '>6:00<']) assert.ok(p.includes(t), t);
  const [h11] = handsAt(p, 410, 120);   // the first row's small clock
  assert.ok(Math.abs(deg(h11) - 330) < 1, 'the Puppet Show clock\'s hour hand is on 11');
  const home = art.draw({ type: 'scene', scene: 'bunty_home', time: '9:00', digital: '09:00' });
  assert.ok(home.includes('>09:00<'), 'the digital clock on the table reads 09:00');
  const [hw] = handsAt(home, 140, 78);
  assert.ok(Math.abs(deg(hw) - 270) < 1, 'the wall clock\'s hour hand is on 9');
  assert.throws(() => buildGuideFromPrimary(Object.assign(MATHS(), { hero_visual: { type: 'poster', items: [{ text: 'X', time: 'noon' }] } })), /poster time/);
});

test('every stage bar and label carries its picture; read-aloud speakers get their own faces; the story map is numbered', () => {
  const m = compose(MATHS()).bodyHtml;
  assert.strictEqual((m.match(/<span class="q-bar-ic"><svg/g) || []).length, 6, 'one picture per stage bar');
  const u = compose(URDU()).bodyHtml;
  assert.strictEqual((u.match(/class="qface"/g) || []).length, 4, 'four speakers, four faces');
  assert.ok(u.includes('M-22 -110c0-14'), 'the local man wears his cap (speakers: man_cap)');
  assert.deepStrictEqual([...u.matchAll(/<b class="q-evn">(\d)<\/b>/g)].map((x) => +x[1]), [1, 2, 3, 4, 5], 'the five story events, numbered in order');
  assert.ok(!/<img\b|data:image\/(png|jpe?g)/.test(m + u), 'every picture and icon is drawn, not a bitmap');
});

test('other grades, other content: road signs, positions and a park signboard are drawn from the lesson', () => {
  const e = compose(G3_ENGLISH()).bodyHtml;
  for (const t of ['>STOP<', '>Parking lot<', '>No cycling<', '>Look right<', '>Look left<', '>Look right again<']) assert.ok(e.includes(t), t);
  const m = compose(G2_MATHS()).bodyHtml;
  assert.ok(/>1<tspan[^>]*>st</.test(m) && />20<tspan[^>]*>th</.test(m), 'ordinals drawn as 1st … 20th');
  for (const L of 'ABCDEFGHIJKLMNOPQRST') assert.ok(m.includes(`>${L}</text>`), `car ${L}`);
  const u = compose(G4_URDU()).bodyHtml;
  assert.ok(u.includes('>پھول توڑنا منع ہے<'), 'the park signboard carries the lesson\'s own words');
  assert.strictEqual((u.match(/class="q-deed q-deed/g) || []).length, 6, 'six good-citizen deeds');
  assert.ok(!(e + m + u).includes(' · <bdi dir="ltr"></bdi>'), 'no empty outcome code printed');
  assert.ok(compose(MATHS()).bodyHtml.includes(' · <bdi dir="ltr">M-01-TM-01</bdi>'), 'a lesson with a code still prints it');
  const bad = G2_MATHS(); bad.board[0].visual = { type: 'road_signs', signs: [{ sign: 'rocket', label: 'x' }] };
  assert.throws(() => buildGuideFromPrimary(bad), /no drawing for road sign "rocket"/);
});

test('only the Grades 1–5 page names its own page layout; everything else in the ict pack is as before', () => {
  const pack = require('../decorative/regions/ict/theme');
  assert.deepStrictEqual(pack.PAGE_LAYOUT, { width: 896, height: 1200, fixedPages: true }, 'grades 6–12 keep their fixed pages');
  const c = pack.COMPOSE(buildGuideFromPrimary(MATHS()).guide, {});
  assert.deepStrictEqual(c.pageLayout, { width: 520, height: 2000, flow: true });
  assert.strictEqual(pack.COMPOSE({ sections: [] }, {}), null);
  assert.ok(!/\.ictp\b/.test(c.headCss) && /\.ictq\b/.test(c.headCss), 'its style sits under .ictq only');
});

test('the four rebuilt lessons are valid, say how they were made, and draw no person where a revered figure could be meant', () => {
  for (const [name, doc] of REBUILT) {
    const lesson = doc();
    const { guide, report } = buildGuideFromPrimary(lesson);
    assert.deepStrictEqual(guide.images, [], `${name}: nothing to buy`);
    assert.deepStrictEqual(report.stages, ['opening', 'explanation', 'we_do', 'you_do', 'check', 'homework']);
    assert.match(lesson.source.method, /^REBUILT: /, `${name}: labelled as rebuilt, not as pipeline data`);
    assert.match(lesson.source.method, /not the real pipeline JSON/, name);
  }
  // the festivals drawing (SST) is a crescent over a mosque and a flag: no face, no skin
  const f = art.draw({ type: 'festivals', circles: ['عید کا دن', 'آزادی کا دن'] });
  assert.ok(f.includes('>عید کا دن<') && f.includes('>آزادی کا دن<'), 'the circles carry the lesson\'s own words');
  assert.ok(!f.includes('#E0A97E') && !f.includes('#C98C5E'), 'no person drawn');
});

test('the newer approved pieces: a chart card, the board at the end of the lesson, a word on each flow arrow, Urdu digits', () => {
  const s = compose(SST()).bodyHtml;
  assert.strictEqual((s.match(/class="q-figcard"/g) || []).length, 3, 'the end-of-lesson board, the comparison and the step-by-step chart');
  assert.ok(/<table class="q-track"/.test(s) && !/مذہبی تہوار\|قومی تہوار/.test(words(s)), 'the board\'s festival table is a real table');
  assert.ok(words(s).indexOf('کامیابی کا معیار') < words(s).indexOf('جانچ فہرست') && s.indexOf('q-track') > s.indexOf('کامیابی کا معیار'), 'the table sits where the approved board has it: after the success criterion');
  assert.strictEqual((s.match(/<span class="q-flow-ar"><small dir="rtl">پھر<\/small>←<\/span>/g) || []).length, 2, 'each flow arrow carries its word and points right to left');
  assert.ok(s.includes('data-digits="urdu"') && /جماعت ۵ · /.test(s) && s.includes('۴۰ منٹ') && /class="q-step on">۳</.test(s), 'Urdu digits on grade, minutes and steps');
  const u = compose(URDU()).bodyHtml;
  assert.ok(!u.includes('data-digits') && /q-step on">\d/.test(u), 'a lesson that does not ask for Urdu digits keeps its digits');
  const bad = SST(); bad.stages[1].blocks.find((b) => b.type === 'figure').visual = { type: 'volcano' };
  assert.throws(() => buildGuideFromPrimary(bad), /no drawing for picture type "volcano"/);
});

// ── the page printer ─────────────────────────────────────────────────────────────────────
const mediaBoxes = (pdf) => [...pdf.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);

test('the phone printer: a block moves whole with its heading, a list divides, a stage continues under its own bar', { timeout: 120000 }, async () => {
  const { htmlToPhonePagesPdf } = require('../render/phone-pages-pdf');
  const blk = (stage, inner, attrs = '') => `<div class="q-blk" data-stage="${stage}" ${attrs}>${inner}</div>`;
  const box = (t, h) => `<div style="height:${h}px;background:#eee">${t}</div>`;
  const css = '<style>body{margin:0}.qpg{width:400px;height:600px;display:flex;flex-direction:column;padding:10px 10px 0;box-sizing:border-box;overflow:hidden}'
    + '.q-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:10px}.q-foot{flex:none;height:30px}.q-run{height:20px}.q-chrome[hidden]{display:none}</style>';
  const html = `<!doctype html><html><head>${css}</head><body><div class="ictq" data-pno="page {n} of {m}" data-cont="continued"><div class="q-src">`
    + blk('a', '<div class="q-bar"><span class="q-bar-name">A</span><span class="q-bar-end">5 min</span></div>', 'data-bar data-keep')
    + blk('a', box('one', 300)) + blk('a', '<div>HEADING</div>', 'data-keep') + blk('a', box('two', 200))
    + blk('b', '<div class="q-bar"><span class="q-bar-name">B</span></div>', 'data-bar data-keep')
    + blk('b', `<div><div data-first-only>LIST HEAD</div><div class="units">${Array.from({ length: 16 }, (_, i) => `<div data-units style="height:60px">item ${i + 1}</div>`).join('')}</div></div>`, 'data-split')
    + '</div><div class="q-chrome" hidden><div class="q-run">run</div><footer class="q-foot"><div>foot</div><div class="q-pno"></div></footer></div></div></body></html>';
  const r = await htmlToPhonePagesPdf(html, { pageWidth: 400, pageHeight: 600 });
  const pages = r.html.split('<section class="qpg"').slice(1);
  assert.ok(!pages[0].includes('HEADING') && pages[1].includes('HEADING') && /HEADING[\s\S]*two/.test(pages[1]), 'the heading moved with what it heads');
  assert.ok(pages[1].includes('q-bar cont') && pages[1].includes('continued'), 'stage A continues under its own bar');
  const items = pages.map((p) => (p.match(/item \d+/g) || []).length);
  assert.strictEqual(items.reduce((a, b) => a + b, 0), 16, 'the list divided, nothing lost');
  assert.ok(items.filter((n) => n).length >= 2, 'over more than one page');
  assert.strictEqual((r.html.match(/LIST HEAD/g) || []).length, 1, 'its heading printed once');
  assert.ok(/page 1 of \d/.test(pages[0]) && !pages[0].includes('>run<') && pages[1].includes('>run<'), 'page numbers; the running head from page 2');
  assert.deepStrictEqual(r.overflow, []);
  assert.ok(mediaBoxes(r.pdf).every(([w, h]) => Math.abs(w - 300) < 0.5 && Math.abs(h - 450) < 0.5), 'every page is the fixed size (400×600 px)');
});

for (const [name, doc, lang] of [['Grade 1 Maths', MATHS, 'en'], ['Grade 2 Urdu', URDU, 'ur']]) {
  test(`${name} prints in the approved phone design: 390×1500 pt pages, nothing outside its page, nothing bought`, { timeout: 120000 }, async () => {
    const { renderLessonImage } = require('../pipeline');
    const { guide } = buildGuideFromPrimary(doc());
    const logs = [];
    const r = await renderLessonImage(guide, { apiKey: '', pdf: true, log: (m) => logs.push(m) });
    const boxes = mediaBoxes(r.pdf);
    assert.ok(boxes.length >= 5 && boxes.length <= 8, `${boxes.length} pages`);
    for (const [w, h] of boxes) { assert.ok(Math.abs(w - 390) < 0.5 && Math.abs(h - 1500) < 0.5, `${w}×${h}`); }
    assert.deepStrictEqual(r.overflow, [], 'nothing leaves its page or runs past its foot');
    assert.strictEqual(r.stats.generated, 0, 'nothing bought');
    assert.ok(!/<img\b/.test(r.html), 'no raster pictures: every picture is SVG drawn in code');
    assert.ok(r.html.includes(`<div class="ictq" lang="${lang}"`) && r.html.includes('class="qpg"'), 'the .html is the paginated pages');
    const stages = logs.filter((l) => /▭ page/.test(l)).map((l) => l.replace(/.*: /, '')).join('+').split('+');
    assert.deepStrictEqual([...new Set(stages)], ['start', 'opening', 'explanation', 'we_do', 'you_do', 'check', 'homework', 'close'], 'the stages in order');
    const total = boxes.length;
    assert.ok(r.html.includes(lang === 'ur' ? `صفحہ 1 از ${total}` : `page 1 of ${total}`), 'page N of M');
  });
}

test('Grade 5 SST prints like its approved PDF: 8 pages, the teacher-support page on its own, pages numbered in Urdu', { timeout: 120000 }, async () => {
  const { renderLessonImage } = require('../pipeline');
  const { guide } = buildGuideFromPrimary(SST());
  const r = await renderLessonImage(guide, { apiKey: '', pdf: true, log: () => {} });
  const boxes = mediaBoxes(r.pdf);
  assert.strictEqual(boxes.length, 8, 'as many pages as the approved PDF');
  assert.deepStrictEqual(r.overflow, []);
  assert.strictEqual(r.stats.generated, 0, 'nothing bought');
  const pages = r.html.split('<section class="qpg"').slice(1);
  assert.ok(pages[0].includes('صفحہ ۱ از ۸') && pages[7].includes('صفحہ ۸ از ۸'), 'page N of M in Urdu digits');
  assert.ok(/<div class="q-p2">/.test(pages[7]) && !/<div class="q-p2">/.test(pages[6]), 'the support page starts a page of its own');
});

// TEACHER FEEDBACK (2026-10-05): no word of the lesson is coloured. Colour marks structure — a stage
// bar, a card, a label, a chip, a picture — and every word of the lesson itself reads in plain ink,
// in English and in Urdu. Checked in the browser on every text the page prints.
test('teacher rule: every word of the lesson reads in plain ink; colour is for structure only (all thirteen lessons)', { timeout: 240000 }, async () => {
  const { chromium } = require('playwright-core');
  const br = await chromium.launch({ executablePath: '/usr/bin/google-chrome', args: ['--no-sandbox'] });
  try {
    const page = await br.newPage({ viewport: { width: 520, height: 1200 } });
    for (const [name, doc] of [...ALL, ...REBUILT, ...PIPELINE]) {
      const c = compose(doc());
      await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${c.headCss}</style></head><body>${c.bodyHtml}</body></html>`);
      const bad = await page.evaluate(() => {
        // structure: dark cards in white type, labels, chips, pills, bars, numbers, pictures, chrome
        const STRUCT = '.q-hero,.q-today,.q-hook,.q-coach,.q-bar,.q-pill,.q-cap,.q-lbl,.q-n,.q-tag,.q-ref,.q-who,.q-sayl,.q-kw-w,'
          + '.q-panel-t,.q-panel-n,.q-board-h,.q-step,.q-steps,.q-pz,.q-ev,.q-evn,.q-arrow,.q-track th,.q-deed,.q-chrome,svg,figure,.q-video-t,'
          // the newer lessons' chart headings and arrow words, the support page's subject line and card labels
          + '.q-cmp-h,.q-flow-ar,.q-p2k,.q-p2l,.q-key-l,'
          // the labels of a labelled sub-line (Listen for, Coach …) and the "+ N more days" note
          + '.q-xl,.q-more';
        const ink = getComputedStyle(document.querySelector('.ictq')).getPropertyValue('--ink').trim();
        const probe = document.createElement('span'); probe.style.color = ink; document.body.append(probe);
        const INK = getComputedStyle(probe).color; probe.remove();
        const out = [];
        const tw = document.createTreeWalker(document.querySelector('.q-src'), NodeFilter.SHOW_TEXT);
        let n;
        while ((n = tw.nextNode())) {
          const t = n.textContent.trim();
          if (!/[A-Za-z؀-ۿ]{2}/.test(t)) continue;
          const el = n.parentElement;
          if (el.closest(STRUCT)) continue;
          const col = getComputedStyle(el).color;
          if (col !== INK) out.push(`${col} «${t.slice(0, 40)}» in .${[...el.classList].join('.') || el.tagName}`);
        }
        return out;
      });
      assert.deepStrictEqual(bad, [], `${name}: lesson words in a colour of their own`);
      assert.ok(!/class="q-ans"[^>]*>\s*[→←]/.test(c.bodyHtml), `${name}: an answer is marked by a tick badge, not a coloured arrow`);
    }
  } finally { await br.close(); }
});
