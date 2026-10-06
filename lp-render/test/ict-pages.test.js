'use strict';
// ICT lessons in NIETE's approved page design (the "lp_pdfs" references, 2026-09-30): fixed
// portrait pages, one per stage — Start, Explanation, Practice, Conclusion — and a Teacher support
// page, laid out from the page model (guide/lpdoc-pages.js) by the ict pack (pages.js) and printed
// by render/fixed-pages-pdf.js. Plus the adapter rules those pages rely on: figures at ICT's own
// slot, answers in green, the exam-bank cards.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildGuideFromLpDoc } = require('../guide/from-lpdoc');

const FX = path.join(__dirname, '..', 'fixtures', 'ict');
const load = (f) => JSON.parse(fs.readFileSync(path.join(FX, f), 'utf8'));
const NIETE = () => load('niete_v9_gate_base.lp.json');
const URDU = () => load('authored_PK_G10_URDU_CH1_AKHLAQ_E_NABVI_BULAND_KHWANI.lp.json');
const ENGLISH = () => load('authored_PK_G8_ENG_CH6_THE_BELLS_CLOSE_READING.lp.json');
const svgOf = (im) => Buffer.from(im.dataUri.split(',')[1], 'base64').toString('utf8');
const sizeOf = (svg) => { const m = /<svg\b[^>]*\swidth="([\d.]+)" height="([\d.]+)"/.exec(svg); return m && [Number(m[1]), Number(m[2])]; };
// the adapter's notation changes, undone exactly (see ict-lpdoc.test.js), so a source string can be found
const visible = (s) => String(s).replace(/⁠/g, '')
  .replace(/\$(\\\\ce\{(?:[^{}]|\{[^{}]*\})*\})\$/g, '$1')
  .replace(/\\\\displaystyle /g, '')
  .replace(/\*\*/g, '');

test('every figure is sized to ICT\'s own slot: never wider than the 455px column, never smaller than its labels allow', () => {
  const { requiredBox } = require('../guide/vendor/lp_diagrams/lib/svg');
  for (const doc of [NIETE(), URDU(), ENGLISH()]) {
    const { guide } = buildGuideFromLpDoc(doc);
    for (const im of guide.images) {
      const svg = svgOf(im);
      const [w, h] = sizeOf(svg);
      const box = requiredBox(svg, { minPx: 8.43, colPx: 455 });
      assert.ok(w <= 455, `${im.id} fits the column (${w}px)`);
      assert.strictEqual(w, Math.min(455, box.minWidthPx), `${im.id} is drawn at ICT's slot`);
      assert.ok(Math.abs(h - w * box.vbH / box.vbW) < 0.2, `${im.id} keeps its aspect`);
    }
  }
  // the hundred-square board plan prints compact, as ICT prints it (its --fig-h is 200px)
  const grid = sizeOf(svgOf(buildGuideFromLpDoc(NIETE()).guide.images[1]));
  assert.ok(grid[1] <= 200, `board plan ${grid[1]}px tall`);
});

test('a teaching figure wears ICT\'s badge in the lesson\'s language; the board plan wears none', () => {
  const en = buildGuideFromLpDoc(NIETE()).guide.images;
  assert.strictEqual(en[0].label, 'Geometry');
  assert.strictEqual(en[1].label, '', 'the support page\'s board plan: no badge, as in ICT');
  const ur = buildGuideFromLpDoc(URDU()).guide.images;
  assert.strictEqual(ur[0].label, 'مرحلہ وار خاکہ', 'a flow, labelled in Urdu from ICT\'s own table');
});

test('an answer prints green: its words bolded, its maths coloured, the text itself unchanged', () => {
  const { guide } = buildGuideFromLpDoc(NIETE());
  const wu = guide.sections.find((s) => s.id === 'ict-warmup');
  assert.match(wu.items[0].text, /→ \$\\color\{#1F7A4D\}26\$$/, 'a number answer');
  assert.match(wu.items[2].text, /→ \$\\displaystyle \\color\{#1F7A4D\}\\begin\{bmatrix\}/, 'a matrix answer, still at full height');
  const pr = guide.sections.find((s) => s.id === 'ict-practice');
  assert.match(pr.items[0].text, /\*\*Defined, because the inner orders match; the product is\*\* \$\\color\{#1F7A4D\}2\\times2\$\*\*\.\*\*$/);
  const katex = require('katex');
  for (const s of guide.sections) for (const it of s.items || []) {
    for (const m of String(it.text || '').matchAll(/\$([^$]+)\$/g)) {
      assert.doesNotThrow(() => katex.renderToString(m[1], { throwOnError: true }), m[1]);
    }
  }
});

test('the exam bank prints as ICT\'s cards: one MCQ card each with exactly one key, the SRQ beside its own mark scheme', () => {
  const { guide } = buildGuideFromLpDoc(NIETE());
  const ids = guide.sections.map((s) => s.id);
  const mcqs = guide.sections.filter((s) => s.id === 'ict-mcq');
  assert.strictEqual(mcqs.length, 2);
  for (const q of mcqs) {
    assert.strictEqual(q.type, 'split');
    const opts = q.left.find((x) => /ict-r-mcqopts/.test(x.cls));
    assert.strictEqual(opts.items.filter((o) => o.tag === '✓').length, 1, 'one key per question');
    assert.ok(opts.items.every((o) => /^\*\*[A-E]\.\*\* /.test(o.text)), 'each option carries its letter in bold');
  }
  assert.strictEqual(ids[ids.indexOf('ict-mcq') - 1], 'ict-grouplabel', 'the MCQs sit under their group label');
  assert.strictEqual(ids[ids.indexOf('ict-srq') + 1], 'ict-srqms', 'the mark scheme follows the question, as its own card');
  assert.ok(!guide.sections.find((s) => s.id === 'ict-srq').body.includes('Mark scheme'));
  const hw = guide.sections.find((s) => s.id === 'ict-hwkey');
  assert.match(hw.items[0].text, /^\*\*H1 · 1 marks\*\*\n/, 'the ref and marks head each homework row');
  assert.ok(hw.items.every((it) => !/→/.test(it.text)), 'the answer sits on its own line, no arrow');
});


// ── the page model: every painted string reaches an approved slot ──────────────────────────
const PAINTED = new Set(['text', 'question', 'look_for', 'q', 'a', 'word', 'meaning', 'prompt', 'result', 'answer', 'support',
  'extension', 'caption', 'legend', 'reteach_rule', 'pupil_says', 'you_ask', 'stuck', 'barrier', 'early', 'coaching_lookfor',
  'coaching_reflection', 'outcome', 'by_the_end', 'previous', 'next', 'checkpoint', 'heading', 'note', 'how_marked']);
const missingFrom = (doc, layoutJson) => {
  const out = visible(layoutJson);
  const missing = [];
  const walk = (v, key) => {
    if (typeof v === 'string') {
      if ((PAINTED.has(key) || key === '[]') && v.trim() && !out.includes(visible(JSON.stringify(v).slice(1, -1)))) missing.push(`${key}: ${v.slice(0, 50)}`);
      return;
    }
    if (Array.isArray(v)) v.forEach((x) => walk(x, typeof x === 'string' && ['items', 'steps', 'mark_scheme', 'draw_order', 'materials'].includes(key) ? '[]' : key));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (!['spec', 'diagram', 'model_answers', 'not_going', 'ur_overlay', 'provenance', 'slo', 'distractor_codes'].includes(k)) walk(x, k); }
  };
  for (const s of doc.sections) walk(s, 'section');
  // ICT's own omissions: the objective list (outcome box only, bd-a8veu.3), the exam bank below
  // grade 9 (bd-a8veu.18), the model answers and "not going" (skipped above); the draw order is
  // printed without the author's numbers (ICT's unnumber)
  const p2 = { ...doc.page2 };
  if (Number(doc.provenance && doc.provenance.grade) < 9) delete p2.exam_bank;
  if (p2.board_final) p2.board_final = { ...p2.board_final, draw_order: (p2.board_final.draw_order || []).map((d) => d.replace(/^\s*[0-9\u0660-\u0669\u06F0-\u06F9]{1,2}\s*[.)\u06D4\u060C:\u2013-]\s+/, '')) };
  walk(p2, 'page2');
  walk({ outcome: doc.objectives && doc.objectives.outcome, by_the_end: doc.objectives && doc.objectives.by_the_end }, 'objectives');
  walk(doc.sequence, 'sequence');
  return missing;
};

for (const [name, doc] of [['G9 Maths', NIETE], ['G8 English', ENGLISH], ['G10 Urdu', URDU]]) {
  test(`${name}: every string ICT paints lands on one of the approved pages — nothing dropped`, () => {
    const d = doc();
    const { guide } = buildGuideFromLpDoc(d);
    assert.strictEqual(guide.layout.kind, 'ict-pages');
    const fixed = JSON.stringify(guide.layout).replace(/\$\\\\displaystyle /g, '$');
    // the Urdu lesson prints its overlay-free Urdu text as authored
    assert.deepStrictEqual(missingFrom(d, fixed), [], 'every painted string is in the page model');
  });
}

test('the approved slots are filled from the lesson, not invented', () => {
  const d = NIETE();
  const L = buildGuideFromLpDoc(d).guide.layout;
  assert.strictEqual(L.title, 'Grade 9 Mathematics');
  assert.deepStrictEqual(L.start.journey[0], d.sequence.previous, 'JOURNEY SO FAR starts with the sequence\'s previous lesson');
  assert.strictEqual(L.start.coming[0], d.sequence.next, 'COMING UP names the next lesson');
  assert.ok(L.start.opening.some((o) => o.kind === 'ask' && o.hook), 'OPENING carries the hook question');
  assert.deepStrictEqual(L.start.keywords.map((k) => k.word), d.sections[0].blocks.find((b) => b.type === 'keywords').items.map((k) => k.word), 'WRITE ON BOARD holds the key words');
  const kinds = L.explain.flow.map((x) => x.kind);
  for (const k of ['step', 'keyfact', 'worked', 'slip']) assert.ok(kinds.includes(k), `Explanation has a ${k}`);
  assert.strictEqual(L.explain.flow.find((x) => x.kind === 'slip').mistakes.length, d.page2.mistakes.length, 'WATCH FOR THIS SLIP carries every recorded mistake');
  assert.strictEqual(L.practice.guided[0].kind, 'faded', 'TOGETHER WE SOLVE is the faded example');
  assert.strictEqual(L.practice.independent.length, 3);
  assert.strictEqual(L.practice.answers.length, 3, 'ANSWERS — FOR THE TEACHER holds each independent answer');
  assert.deepStrictEqual(L.practice.behind, [d.page2.differentiation.stuck]);
  assert.deepStrictEqual(L.practice.ahead, [d.page2.differentiation.early]);
  assert.deepStrictEqual(L.conclusion.options.map((o) => o.kind), ['question', 'question', 'mcq'], 'EXIT TICKET: the checkpoint, the exit question, one FBISE MCQ');
  assert.strictEqual(L.conclusion.options[2].options.filter((o) => o.key).length, 1, 'the MCQ has exactly one key');
  assert.ok(L.conclusion.tomorrow.startsWith('The determinant'), 'Tomorrow is the next lesson');
  assert.strictEqual(L.support.exam.mcqs.length, d.page2.exam_bank.mcq.length - 1, 'the other MCQs print on the support page');
  assert.strictEqual(L.support.hwkey.length, d.page2.homework_key.length);
  // grade 8: no FBISE exam bank anywhere
  const E = buildGuideFromLpDoc(ENGLISH()).guide.layout;
  assert.strictEqual(E.support.exam, null);
  assert.ok(!E.conclusion.options.some((o) => o.kind === 'mcq'));
});

test('the page composer: five stage pages in order; English chrome, the lesson\'s own words in their direction', () => {
  const { composeIctPages } = require('../decorative/regions/ict/pages');
  for (const [doc, dir] of [[NIETE, 'ltr'], [URDU, 'rtl']]) {
    const { guide } = buildGuideFromLpDoc(doc());
    const images = Object.fromEntries(guide.images.map((x) => [x.id, x]));
    const { bodyHtml } = composeIctPages(guide, images);
    assert.deepStrictEqual([...bodyHtml.matchAll(/<section class="pg pg-(\w+)"/g)].map((m) => m[1]), ['start', 'explain', 'practice', 'conclusion', 'support']);
    for (const label of ['Journey so far', 'Today', 'Warm up', 'Opening', 'Write on board', 'Explanation', 'Practice', 'Exit ticket — pick ONE', 'Coaching corner']) {
      assert.ok(bodyHtml.includes(label), `${dir}: chrome label "${label}"`);
    }
    assert.ok(bodyHtml.includes(`class="tx" dir="${dir}"`), `${dir}: lesson text carries its own direction`);
    assert.strictEqual((bodyHtml.match(/<img /g) || []).length, guide.images.length, 'every diagram is drawn once');
  }
  const pack = require('../decorative/regions/ict/theme');
  assert.match(pack.THEME_OVERRIDE_CSS, /\.ictp\{direction:ltr/, 'the page chrome stays left-to-right, as the approved Urdu reference prints it');
});

test('only the ICT pack lays out and prints its own page', () => {
  const dir = path.join(__dirname, '..', 'decorative', 'regions');
  for (const r of fs.readdirSync(dir)) {
    const f = path.join(dir, r, 'theme.js');
    if (!fs.existsSync(f)) continue;
    const pack = require(f);
    if (r === 'ict') {
      assert.deepStrictEqual(pack.PAGE_LAYOUT, { width: 896, height: 1200, fixedPages: true });
      assert.strictEqual(typeof pack.COMPOSE, 'function');
      assert.strictEqual(pack.COMPOSE({ sections: [] }, {}), null, 'a guide without the ICT page model is left to the shared renderer');
    } else {
      assert.strictEqual(pack.PAGE_LAYOUT, undefined, `${r} keeps the A4 composer`);
      assert.strictEqual(pack.COMPOSE, undefined, `${r} keeps the shared renderer`);
    }
  }
});

// ── the page printer ─────────────────────────────────────────────────────────────────────
const mediaBoxes = (pdf) => [...pdf.toString('latin1').matchAll(/\/MediaBox\s*\[\s*0 0 ([\d.]+) ([\d.]+)\s*\]/g)].map((m) => [Number(m[1]), Number(m[2])]);

test('a stage too long for its page continues on a "continued" page; a heading goes with what it heads; a list row divides', { timeout: 120000 }, async () => {
  const { htmlToFixedPagesPdf } = require('../render/fixed-pages-pdf');
  const card = (n, h) => `<div class="row"><div style="height:${h}px;background:#eee">card ${n}</div></div>`;
  const css = '<style>body{margin:0}.pg{width:400px;height:500px;display:flex;flex-direction:column;padding:0 0 20px;box-sizing:border-box;overflow:hidden}'
    + '.band{height:40px}.pg-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:10px}.row{flex:none}.band.cont h2::after{content:" — continued"}</style>';
  const html = `<!doctype html><html><head>${css}</head><body>`
    + `<section class="pg" data-stage="a"><header class="band"><h2>A</h2></header><div class="pg-body">${card(1, 200)}${card(2, 200)}`
    + `<div class="row keep-next"><h3 style="margin:0;height:30px">HEADING</h3></div>${card(3, 150)}</div></section>`
    + `<section class="pg" data-stage="b"><header class="band"><h2>B</h2></header><div class="pg-body"><div class="row" data-split="1"><ol class="units">${
      Array.from({ length: 14 }, (_, i) => `<li data-units style="height:60px">item ${i + 1}</li>`).join('')}</ol></div></div></section></body></html>`;
  const r = await htmlToFixedPagesPdf(html, { pageWidth: 400, pageHeight: 500 });
  assert.deepStrictEqual(r.stages, ['a', 'a+', 'b', 'b+'], 'each long stage continues once');
  const a2 = r.html.split('data-stage="a"')[2];
  assert.ok(/HEADING[\s\S]*card 3/.test(a2) && !r.html.split('data-stage="a"')[1].includes('HEADING'), 'the heading moved with the card it heads');
  assert.ok(a2.includes('class="band cont"'), 'the continuation is headed as continued');
  const items = (seg) => (seg.match(/item \d+/g) || []).length;
  const [b1, b2] = r.html.split('data-stage="b"').slice(1);
  assert.ok(items(b1) >= 1 && items(b2) >= 1 && items(b1) + items(b2) === 14, 'the list divided between the two pages, nothing lost');
  assert.ok(mediaBoxes(r.pdf).every(([w, h]) => Math.abs(w - 300) < 0.5 && Math.abs(h - 375) < 0.5), 'every page is the fixed size (400×500 px)');
});

// The end-to-end print of a grades 6–12 lesson moved to ict-secondary.test.js on 2026-10-02, when
// NIETE's approved grades 6–12 design became ICT's production page (secondary.js). The tests above
// still cover this earlier stage-page composer and its printer, which nothing dispatches to now.
