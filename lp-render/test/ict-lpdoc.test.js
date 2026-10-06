'use strict';
// ICT (NIETE) grades 6–12: the lp_doc adapter and the ict design pack.
//
// Fixtures: ICT's own sample lessons, copied unchanged from the curriculum-baked-lesson-plans
// skill (scripts/lp_html/samples, agent-skills-taleemabad 813bea9) — one English-medium grade 7
// science lesson, one Urdu-medium grade 9 chemistry lesson. Both are schema 2.0, so every test
// here also runs ICT's own 2.0 → 3.0 migration.
//
// What is proved:
//   • the adapter drops nothing ICT paints, and paints nothing ICT has decided not to
//   • ICT's placement rules (mistakes after Development, differentiation after the practice)
//   • the inputs ICT's renderer refuses are refused here too
//   • the two renderer additions (the cls hook, the split body) are inert for every other
//     producer — no other region can see them
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const { buildGuideFromLpDoc } = require('../guide/from-lpdoc');
const { toV3 } = require('../guide/vendor/lp_doc_migrate');
const { renderDecorativeLesson } = require('../decorative/render');

const FIX = path.join(__dirname, '..', 'fixtures', 'ict');
const load = (f) => JSON.parse(fs.readFileSync(path.join(FIX, f), 'utf8'));
const G7 = () => load('g7_science_photosynthesis.lp.json');
const G9UR = () => load('g9_urdu_smoke.lp.json');
// Undo the adapter's three notation changes, as they appear in JSON text: the word joiner after
// a "Label:" colon, the dollars given to a bare \ce{...}, and ICT's \displaystyle on an inline
// matrix. Only those exact shapes are undone, so an ordinary "$c_{ij}$" is left alone.
const visible = (s) => String(s).replace(/⁠/g, '')
  .replace(/\$(\\\\ce\{(?:[^{}]|\{[^{}]*\})*\})\$/g, '$1')
  .replace(/\\\\displaystyle /g, '')
  // an answer's maths wears ICT's green (adapter answerText): exactly $\color{#1F7A4D}…$
  .replace(/\$\\\\color\{#1F7A4D\}([^$]*)\$/g, '$$$1$$')
  // and its words are bolded run by run; bold is emphasis, not content
  .replace(/\*\*/g, '');

test('ICT\'s own migration lifts a 2.0 lp_doc to 3.0 before anything is mapped', () => {
  const v3 = toV3(G7());
  assert.strictEqual(v3.schema_version, '3.0');
  assert.strictEqual(v3.__migrated_from, '2.0');
  assert.ok(!('warmup' in v3), 'the top-level warm-up moves into the Introduction');
  assert.ok(v3.sections.find((s) => s.id === 'introduction').warmup.items.length === 3);
  const { report } = buildGuideFromLpDoc(G7());
  assert.strictEqual(report.migratedFrom, '2.0');
});

test('the guide is an ict guide: region, header, and no images to buy', () => {
  const { guide } = buildGuideFromLpDoc(G7());
  assert.strictEqual(guide.meta.region, 'ict');
  assert.strictEqual(guide.meta.locale, 'en');
  assert.strictEqual(guide.meta.title, 'Photosynthesis');
  assert.strictEqual(guide.meta.subtitle, 'Grade 7 · General Science');
  // ICT v9.3's hero: chapter, "p.11 · 40 min", then board_weight — absent for grades 6-8, so no
  // chip at all; the internal lp_type key ("GEN-6-8") is never printed
  assert.deepStrictEqual(guide.meta.chips.map((c) => c.value), ['Ch.1 · Plant Systems', 'p.11 · 40 min']);
  const g9 = buildGuideFromLpDoc(NIETE()).guide;
  assert.deepStrictEqual(g9.meta.chips.map((c) => c.value), ['Ch. 1 · Matrices and Determinants', 'p.24-25 · 40 min', 'FBISE SSC-I · ~5 marks']);
  assert.deepStrictEqual(guide.images, [], 'an lp_doc declares no generated art — rendering it costs nothing');
  for (const s of guide.sections) assert.match(s.cls, /^ict( |$)/, `${s.id} must carry the ict class`);
});

test('page 1 follows ICT\'s order: outcome, resources, then the five sections with their hosts', () => {
  const { guide } = buildGuideFromLpDoc(G7());
  const ids = guide.sections.map((s) => s.id);
  assert.deepStrictEqual(ids.slice(0, 20), [
    'ict-outcome', 'ict-rmat', 'ict-rpace',                          // resource rows (this lesson has no video)
    'ict-warmup', 'ict-hook', 'ict-watch',                           // Introduction
    'ict-split', 'ict-chem', 'ict-keywords',                         // Development
    'ict-grouplabel', 'ict-mistakes',                                // … + the mistakes, under their label
    'ict-worked', 'ict-faded', 'ict-practice', 'ict-supext', 'ict-diff', // Activity (+ differentiation)
    'ict-ask', 'ict-practice', 'ict-para',                           // Conclusion
    'ict-keypoints',                                                 // Home work
  ]);
  // every card of one stage carries that stage's heading, so the band is drawn once
  const dev = guide.sections.filter((s) => /ict-st-development/.test(s.cls));
  assert.ok(dev.every((s) => s.heading === 'Development' && s.time === '10 min'));
});

test('nothing ICT paints from the teaching flow is dropped', () => {
  const doc = toV3(G7());
  const { guide } = buildGuideFromLpDoc(G7());
  const out = visible(JSON.stringify(guide));
  const PAINTED = new Set(['text', 'question', 'look_for', 'q', 'a', 'word', 'meaning', 'title', 'prompt',
    'result', 'answer', 'support', 'extension', 'caption', 'figure_label', 'legend', 'from']);
  const missing = [];
  const walk = (v, key) => {
    if (typeof v === 'string') {
      if ((PAINTED.has(key) || key === '[]') && v.trim() && !out.includes(visible(JSON.stringify(v).slice(1, -1)))) missing.push(`${key}: ${v.slice(0, 60)}`);
      return;
    }
    if (Array.isArray(v)) v.forEach((x) => walk(x, typeof x === 'string' && ['items', 'steps'].includes(key) ? '[]' : key));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, k);
  };
  for (const s of doc.sections) { walk(s.blocks, 'blocks'); if (s.warmup) walk(s.warmup, 'warmup'); }
  for (const m of doc.page2.mistakes) { walk(m.pupil_says, 'text'); walk(m.you_ask, 'text'); }
  assert.deepStrictEqual(missing, [], 'every painted lp_doc string reaches the guide verbatim');
});

test('what ICT has decided not to paint is not painted — and each omission is reported', () => {
  const { guide, report } = buildGuideFromLpDoc(G7());
  const out = JSON.stringify(guide);
  assert.ok(!out.includes('Blank 1 = stomata'), 'model answers are never painted (bd-ir1aq)');
  assert.ok(!guide.sections.some((s) => s.id === 'ict-mcq'), 'no FBISE exam bank on a grade 7 plan (bd-a8veu.18)');
  // ICT's production template stopped painting the next period (bd-a8veu.20); NIETE's approved page
  // design prints it (COMING UP, "Tomorrow:"), so it is in the page model and nowhere else
  assert.ok(!JSON.stringify(guide.sections).includes('§1.8 Respiration'), 'not in the v9 card flow');
  assert.ok(guide.layout.conclusion.tomorrow.includes('§1.8 Respiration'), 'the approved design prints it as Tomorrow');
  assert.ok(!out.includes(G7().page2.not_going), '"not going today" is never painted');
  const why = report.notPrinted.join('\n');
  assert.match(why, /model_answers/); assert.match(why, /exam_bank/); assert.match(why, /not_going/);
  // …but a grade 9 plan does carry its exam bank
  const g9 = buildGuideFromLpDoc(G9UR()).guide;
  assert.ok(g9.sections.some((s) => s.id === 'ict-mcq'), 'grade 9 prints the FBISE questions');
});

test('support pages are lettered in emission order, so an absent section consumes no letter', () => {
  const { guide } = buildGuideFromLpDoc(G7());
  const p2 = guide.sections.filter((s) => /ict-st-p2/.test(s.cls)).map((s) => [s.heading, (s.cls.match(/ict-p2-(\w)/) || [])[1]]);
  assert.deepStrictEqual(p2, [
    ['The board at the end of the lesson', 'a'],
    ['Homework, in full', 'b'],   // mistakes and differentiation live in the flow; exam bank not on grade 7
    ['Coaching corner', 'c'],
  ]);
});

test('the Urdu lesson gets ICT\'s Urdu labels and right-to-left arrows', () => {
  const { guide, report } = buildGuideFromLpDoc(G9UR());
  assert.strictEqual(guide.meta.locale, 'ur');
  assert.strictEqual(report.lang, 'ur');
  const intro = guide.sections.find((s) => s.id === 'ict-warmup');
  assert.strictEqual(intro.heading, 'تعارف');
  assert.ok(intro.items.every((it) => it.text.includes(' ← ')), 'answers point the way an Urdu line reads');
});

test('inline chemistry: a bare \\ce{} gets its dollars and a MathJax card; $…$ is left alone', () => {
  const { guide } = buildGuideFromLpDoc(G9UR());
  const mis = guide.sections.find((s) => s.id === 'ict-mistakes');
  assert.strictEqual(mis.engine, 'mathjax');
  assert.match(mis.items[0].q, /\$\\ce\{H2O\}\$/);
  assert.ok(!/\$\$\\ce/.test(JSON.stringify(guide)), 'never double-wrapped');
  const chem = guide.sections.find((s) => s.id === 'ict-chem');
  assert.strictEqual(chem.engine, 'mathjax');
  assert.strictEqual(chem.items[0].tex, '\\ce{C + O2 -> CO2}');
});

test('a plain "Label:" line stays plain — the renderer\'s auto-bold does not fire on lp_doc text', () => {
  const { guide } = buildGuideFromLpDoc(G7());
  const { bodyHtml } = renderDecorativeLesson(guide, {}, {});
  assert.ok(bodyHtml.includes('Draw the leaf and label four arrows:'), 'the homework line is there');
  assert.ok(!bodyHtml.includes('<b>Draw the leaf and label four arrows:</b>'), '…and not bolded');
  assert.ok(bodyHtml.includes('<b>Close the hook:</b>'), 'authored **bold** still renders bold');
});

test('the inputs ICT refuses are refused', () => {
  assert.throws(() => buildGuideFromLpDoc(null), /must be an object/);
  assert.throws(() => buildGuideFromLpDoc(G7(), { lang: 'ur' }), /no ur_overlay/,
    'an English lesson under Urdu headings is a page ICT never prints');
  assert.throws(() => buildGuideFromLpDoc(G7(), { lang: 'fr' }), /no ICT label pack/);
  const bad = G7(); bad.ur_overlay = { '/slo/text_verbatim': 'x' };
  assert.throws(() => buildGuideFromLpDoc(bad, { lang: 'ur' }), /ur_overlay invalid/,
    'the verbatim SLO may not be overlaid — ICT refuses the whole lesson (OVERLAY_INVALID)');
});

test('the split is ONE card with both columns inside it', () => {
  const { guide } = buildGuideFromLpDoc(G7());
  const { bodyHtml } = renderDecorativeLesson(guide, {}, {});
  const splits = bodyHtml.match(/class="d-split"/g) || [];
  assert.strictEqual(splits.length, 1);
  const i = bodyHtml.indexOf('class="d-split"');
  const card = bodyHtml.slice(bodyHtml.lastIndexOf('<section', i), bodyHtml.indexOf('</section>', i));
  assert.match(card, /d-sub ict-r-figure/); assert.match(card, /d-sub ict-r-keypoints/); assert.match(card, /d-sub ict-r-watch/);
  // the composer must treat it as a figure: no page cut may land inside either column
  const composer = fs.readFileSync(path.join(__dirname, '..', 'render', 'png-to-pdf.js'), 'utf8');
  assert.match(composer, /querySelector\('\.d-inline-img, \.char-fig, \.d-split'\)/);
});

test('the renderer additions are inert for every other producer', () => {
  // cls: a section without it renders exactly the class string it always did
  const plain = renderDecorativeLesson({ meta: { title: 't' }, sections: [{ id: 'x', type: 'text', heading: 'H', body: 'b' }] }, {}, {});
  assert.match(plain.bodyHtml, /<section class="section sec-x">/);
  // …and only the ICT adapter emits cls or split: no other guide producer mentions either
  const guideDir = path.join(__dirname, '..', 'guide');
  for (const f of ['from-markdown.js', 'profiles.js']) {
    const src = fs.readFileSync(path.join(guideDir, f), 'utf8');
    assert.ok(!/\bcls\s*:/.test(src) && !/type:\s*'split'/.test(src), `${f} must not emit cls or split`);
  }
  for (const f of ['structure.js', 'condense.js', 'adapter.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    assert.ok(!/\bcls\s*:/.test(src) && !/'split'/.test(src), `${f} must not emit cls or split`);
  }
});

test('the ict pack is a real pack: loads, no character cast, and its role rules are ict-scoped', () => {
  const pack = require('../decorative/regions/ict/theme');
  assert.strictEqual(pack.CHARACTER_CAST, false, 'ICT plans carry no decorative characters (and the cast is paid)');
  assert.ok(!('MAX_PAGES' in pack), 'page count follows the lesson');
  assert.ok(pack.THEME_OVERRIDE_CSS.length > 5000);
  // every role/stage rule names an ict class — none can land on a card another producer made
  const CARD = /\.(panel|d-note|d-bullets|d-lead|d-tag|d-col|d-duo|d-mrow|d-mlabel|d-text|cc-b|s-head|s-tab|s-ic|s-title|s-time)\b/;
  const parts = pack.THEME_OVERRIDE_CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    .split('}').map((r) => r.split('{')[0].trim()).filter(Boolean)
    .flatMap((sel) => sel.split(',').map((x) => x.trim()));
  const unscoped = parts.filter((part) => CARD.test(part) && !/ict/.test(part));
  assert.deepStrictEqual(unscoped, [], 'a card rule without an ict class would restyle any region\'s cards');
});

// A hand-built 3.0 document: the block types and section fields neither sample carries.
// The strings are placeholders; what is asserted is that each one is mapped and drawn.
const V3 = () => ({
  lesson_id: 'T_V3', schema_version: '3.0', lp_type: 'STEM-9-12', period_minutes: 40,
  provenance: { grade: 10, subject: 'Physics', medium: 'en', chapter: 'Ch.2', topic: 'Motion', printed_pages: '20-21' },
  slo: { code: 'P-10-A-01' }, fbise_slos: [{ code: 'P-10-A-01', status: 'Summative' }],
  sequence: { previous: 'Speed', this: 'Velocity', checkpoint: 'Quiz 1' },
  materials: ['Ball'],
  objectives: { outcome: 'You can tell speed from velocity.', by_the_end: 'Answer a 2-mark question.', items: [{ text: 'You can define velocity.' }] },
  sections: [
    { id: 'introduction', minutes: 5, blocks: [{ type: 'board', text: 'BOARD-TEXT' }] },
    { id: 'development', minutes: 15, textbook_page: '20', video: { url: 'https://x', title: 'VIDEO-TITLE' },
      blocks: [
        { type: 'table', title: 'TABLE-TITLE', columns: ['Quantity', 'Unit'], rows: [['speed', 'm/s'], ['short-row']] },
        { type: 'latex', tex: 'v = \\frac{d}{t}', caption: 'LATEX-CAPTION' },
        { type: 'diagram', spec: { type: 'graph', caption: 'DIAGRAM-CAPTION' } },
      ] },
    { id: 'activity', minutes: 10, blocks: [{ type: 'practice', mode: 'guided', items: [{ q: 'Q1', a: 'A1' }] }] },
    { id: 'conclusion', minutes: 8, blocks: [{ type: 'paragraph', text: 'P' }],
      checkpoint: { question: 'CHECKPOINT-Q', marks: 2, mark_scheme: ['MS-1'] },
      exit_ticket: [{ q: 'EXIT-Q', a: 'EXIT-A' }], reteach_rule: 'RETEACH-RULE' },
    { id: 'homework', minutes: 2, blocks: [{ type: 'paragraph', text: 'HW' }],
      homework: { items: [{ text: 'HW-ITEM', level: 'U', marks: 3, source: { page: '21', questions: 'Q4' } }] } },
  ],
  page2: {
    board_final: { draw_order: ['1. DRAW-1'], diagram: { type: 'graph', caption: 'BOARD-DIAGRAM' } },
    mistakes: [{ pupil_says: 'PUPIL-SAYS', you_ask: 'YOU-ASK' }],
    differentiation: { stuck: 'STUCK', barrier: 'BARRIER', early: 'EARLY' },
    exam_bank: {
      mcq: [{ q: 'MCQ-Q', options: ['o1', 'o2'], answer: 'B', distractor_codes: ['CODE-A'] }],
      srq: { q: 'SRQ-Q', marks: 2, mark_scheme: ['SRQ-MS'] },
      erq_skeleton: { q: 'ERQ-Q', marks_total: 6, parts: [{ heading: 'ERQ-PART', marks: 3, note: 'ERQ-NOTE' }] },
      how_marked: 'HOW-MARKED',
    },
    homework_key: [{ item: 'HWK-ITEM', answer: 'HWK-ANSWER', marks: 3 }],
    next_period: 'NEXT', not_going: 'NOT-GOING', coaching_lookfor: 'COACH', coaching_reflection: 'REFLECT',
  },
  one_screen: 'x',
});

test('all 16 block types and every 3.0 section field are mapped and drawn', () => {
  const { guide, report } = buildGuideFromLpDoc(V3());
  const { bodyHtml } = renderDecorativeLesson(guide, {}, {});
  for (const s of ['BOARD-TEXT', 'TABLE-TITLE', 'short-row', 'LATEX-CAPTION', 'VIDEO-TITLE',
    'Teaching from p.20', 'CHECKPOINT-Q', 'MS-1', 'EXIT-Q', 'EXIT-A', 'RETEACH-RULE', 'HW-ITEM', '(Q4, p.21)', '[U] 3m',
    'DRAW-1', 'MCQ-Q', 'CODE-A', 'SRQ-Q', 'SRQ-MS', 'ERQ-Q', 'ERQ-PART', 'ERQ-NOTE', 'HOW-MARKED',
    'HWK-ITEM', 'HWK-ANSWER', 'COACH', 'REFLECT', 'Velocity', 'P-10-A-01']) {
    assert.ok(bodyHtml.includes(s), `"${s}" must be on the page`);
  }
  assert.ok(!bodyHtml.includes('1. DRAW-1'), 'ICT numbers the draw order itself — the author\'s "1." is stripped');
  assert.ok(/class="d-gtable"/.test(bodyHtml) && /katex/.test(bodyHtml), 'table and LaTeX are drawn as themselves');
  assert.strictEqual(guide.sections.find((s) => s.id === 'ict-table').rows[1].length, 2, 'a ragged row is padded, not dropped');
  assert.ok(!bodyHtml.includes('NOT-GOING'), 'not painted, as in ICT (bd-a8veu.20)');
  // both diagrams are drawn by ICT's engine, as SVG, captions inside the figure
  assert.strictEqual(guide.images.length, 2);
  const svgs = guide.images.map((im) => Buffer.from(im.dataUri.split(',')[1], 'base64').toString('utf8'));
  assert.ok(svgs.every((x) => x.startsWith('<svg')), 'data:image/svg+xml of a real <svg>');
  assert.ok(svgs[0].includes('DIAGRAM-CAPTION') && svgs[1].includes('BOARD-DIAGRAM'), 'the engine draws each caption');
  assert.deepStrictEqual(report.unrendered.filter((u) => u.type === 'diagram'), []);
  assert.ok(guide.meta.chips.some((c) => c.value === 'p.20-21 · 40 min'), 'the hero prints "p.20-21", as ICT\'s hero does');
  assert.match(guide.meta.footer, /pp\. 20-21$/, 'the footer keeps the plural locator, as ICT\'s footer does');
  const hosts = guide.sections.map((s) => s.id);
  assert.ok(hosts.indexOf('ict-diff') > hosts.indexOf('ict-practice'), 'differentiation follows the section with the practice');
  assert.deepStrictEqual(report.warnings, []);
  // all sixteen types, counted across the three fixtures
  const types = new Set();
  const walk = (b) => { if (!b) return; types.add(b.type); (b.left || []).concat(b.right || []).forEach(walk); };
  for (const d of [toV3(G7()), toV3(G9UR()), V3()]) for (const s of d.sections) (s.blocks || []).forEach(walk);
  assert.deepStrictEqual([...types].sort(), ['ask', 'board', 'chem', 'diagram', 'faded_example', 'key_points', 'keywords',
    'latex', 'paragraph', 'practice', 'split', 'support_extension', 'table', 'textbook_figure', 'watch_out', 'worked_example']);
});


// ── Phase 2 ─────────────────────────────────────────────────────────────────────────────

test('diagrams: ICT\'s engine draws them; a spec it cannot draw is a labelled placeholder, reported', () => {
  const doc = V3();
  doc.sections[1].blocks.push({ type: 'diagram', spec: { type: 'no_such_type', caption: 'NOPE' } });
  const { guide, report } = buildGuideFromLpDoc(doc);
  assert.strictEqual(guide.images.length, 2, 'the two good specs are drawn');
  const im = guide.images[0];
  assert.match(im.dataUri, /^data:image\/svg\+xml;base64,/);
  const svg = Buffer.from(im.dataUri.split(',')[1], 'base64').toString('utf8');
  assert.match(svg, /^<svg width="[\d.]+" height="[\d.]+"/, 'intrinsic size from the viewBox, so <img> can size it');
  const bad = report.unrendered.find((u) => u.spec === 'no_such_type');
  assert.ok(bad && /unknown diagram type/.test(bad.why), 'the engine\'s own refusal is reported');
  const { bodyHtml } = renderDecorativeLesson(guide, Object.fromEntries(guide.images.map((x) => [x.id, x])), {});
  assert.ok(bodyHtml.includes('diagram not drawn — no such type') && bodyHtml.includes('NOPE'));
});

test('a diagram inside a split column counts as shown — it is not appended again at the end', () => {
  const doc = V3();
  doc.sections[1].blocks.push({ type: 'split', left: [{ type: 'diagram', spec: { type: 'graph', caption: 'IN-SPLIT' } }], right: [{ type: 'key_points', items: ['k'] }] });
  const { guide } = buildGuideFromLpDoc(doc);
  const images = Object.fromEntries(guide.images.map((x) => [x.id, x]));
  const { bodyHtml } = renderDecorativeLesson(guide, images, {});
  const n = guide.images.length;
  assert.strictEqual((bodyHtml.match(/<img /g) || []).length, n, 'every diagram drawn exactly once');
});

test('page chrome and structure: ICT\'s labels for the band, a fresh page for support, row-only breaks for card grids', () => {
  const { guide } = buildGuideFromLpDoc(G7());
  assert.strictEqual(guide.meta.pageLabel, 'page {n} of {m}');
  assert.strictEqual(guide.meta.continuedLabel, 'continued');
  assert.strictEqual(guide.meta.runTitle, 'Photosynthesis');
  assert.strictEqual(buildGuideFromLpDoc(G9UR()).guide.meta.pageLabel, 'صفحہ {n} از {m}');
  const head = guide.sections.find((s) => s.id === 'ict-p2head');
  assert.match(head.cls, /\blp-break-before\b/);
  for (const id of ['ict-mistakes', 'ict-diff', 'ict-hwkey', 'ict-keywords']) {
    assert.match(guide.sections.find((s) => s.id === id).cls, /\blp-grid-rows\b/, id);
  }
  // only a list may continue overleaf; every other card moves whole
  for (const s of guide.sections) {
    assert.strictEqual(/\blp-atomic\b/.test(s.cls), s.type !== 'bullets', `${s.id} (${s.type})`);
  }
  const pack = require('../decorative/regions/ict/theme');
  assert.deepStrictEqual(pack.PAGE_LAYOUT, { width: 896, height: 1200, fixedPages: true }, 'NIETE\'s approved portrait page');
  assert.match(pack.THEME_OVERRIDE_CSS, /@font-face\{font-family:'ICT Cond';font-weight:700/, 'the condensed face is embedded in this pack only');
  assert.ok(!require('../fonts/load').fontFaceCss().includes("'ICT Cond'"), 'the shared font loader is untouched');
});

test('maths: a long display formula becomes breakable; an inline matrix is display-sized; bad TeX is reported', () => {
  const doc = V3();
  doc.sections[1].blocks.push({ type: 'latex', tex: 'v = u + gt, \\; u = \\text{initial}, \\; v = \\text{final}, \\; g = 9.8, \\; t = \\text{time}, \\; 78.5 = 0 + 9.8t' });
  doc.sections[2].blocks[0].items.push({ q: 'Find $\\begin{bmatrix}1&2\\\\3&4\\end{bmatrix}^{-1}$', a: 'A' });
  doc.sections[2].blocks[0].items.push({ q: 'Blank $\\dfrac{1}{___}$', a: 'B' });
  const { guide, report } = buildGuideFromLpDoc(doc);
  const wrap = guide.sections.find((s) => /ict-math-wrap/.test(s.cls));
  assert.ok(wrap && wrap.type === 'text' && wrap.body.startsWith('$\\displaystyle v = u + gt'));
  const pr = guide.sections.find((s) => s.id === 'ict-practice');
  assert.ok(pr.items.some((it) => it.text.includes('$\\displaystyle \\begin{bmatrix}')));
  assert.ok(report.warnings.some((w) => /maths does not parse — \\dfrac\{1\}\{___\}/.test(w)), report.warnings.join('\n'));
});

test('the page chrome and forced breaks are wired only through the ict pack', () => {
  const composer = fs.readFileSync(path.join(__dirname, '..', 'render', 'png-to-pdf.js'), 'utf8');
  // compose_pdf.py knows neither feature, so a page that uses either never goes there
  assert.match(composer, /opts\.pageStyle === 'foot-band' \|\| \(geom && Array\.isArray\(geom\.forced\) && geom\.forced\.length\)/);
  // and no other pack asks for the new page style
  const regions = path.join(__dirname, '..', 'decorative', 'regions');
  for (const r of fs.readdirSync(regions).filter((d) => d !== 'ict' && fs.existsSync(path.join(regions, d, 'theme.js')))) {
    assert.notStrictEqual(require(path.join(regions, r, 'theme.js')).PAGE_NUMBER_STYLE, 'foot-band', r);
  }
  // only the ICT adapter marks sections lp-break-before / lp-grid-rows or hands over a finished image
  for (const f of ['guide/from-markdown.js', 'structure.js', 'condense.js', 'adapter.js']) {
    const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
    assert.ok(!/lp-break-before|lp-grid-rows|lp-atomic|dataUri\s*:/.test(src), f);
  }
});

test('maths in a label is written in Unicode, not printed as TeX source', () => {
  const doc = V3();
  doc.sections[2].blocks.push({ type: 'worked_example', title: 'Find $A^{-1}$ (p.68)', steps: ['s'] });
  doc.sections[2].blocks.push({ type: 'key_points', title: 'Burning $\\ce{CH4 + 2O2 -> CO2 + 2H2O}$', items: ['k'] });
  const { guide } = buildGuideFromLpDoc(doc);
  assert.ok(guide.sections.some((s) => s.label === 'Find A⁻¹ (p.68)'));
  assert.ok(guide.sections.some((s) => s.lead === 'Burning CH₄ + 2O₂ → CO₂ + 2H₂O'), JSON.stringify(guide.sections.map((s) => s.lead).filter(Boolean)));
});

// ── Real NIETE-Rumi inputs (lp-render/fixtures/ict/README.md says where each came from) ─────────

const NIETE = () => load('niete_v9_gate_base.lp.json');

test('isLpDoc tells an ICT lp_doc from a guide, so LP Studio and the CLI route it to the adapter', () => {
  const { isLpDoc } = require('../guide/from-lpdoc');
  assert.strictEqual(isLpDoc(NIETE()), true, 'NIETE schema-3.0 lesson');
  assert.strictEqual(isLpDoc(G7()), true, 'ICT schema-2.0 sample');
  assert.strictEqual(isLpDoc(buildGuideFromLpDoc(G7()).guide), false, 'a guide is not an lp_doc');
  assert.strictEqual(isLpDoc(load('niete_prod_2026-09-06_halicin_molecule.json')), false, 'a diagram fixture is not a lesson');
  assert.strictEqual(isLpDoc(null), false);
  const studio = fs.readFileSync(path.join(__dirname, '..', '..', 'scripts', 'lp-studio.js'), 'utf8');
  assert.match(studio, /if \(isLpDoc\(parsed\)\)/, 'LP Studio converts a pasted lp_doc');
  assert.match(studio, /const looksLikeGuide = fromLpDoc \|\|/, '…and skips the paid 2-page passes for it');
});

test('the real NIETE lesson (G9 maths, schema 3.0) maps completely: nothing painted is dropped', () => {
  const doc = NIETE();
  const { guide, report } = buildGuideFromLpDoc(doc);
  assert.strictEqual(guide.meta.region, 'ict');
  assert.strictEqual(guide.meta.title, 'Multiplying two 2×2 matrices');
  assert.deepStrictEqual(report.warnings, [], 'no unknown block, no unparsed maths');
  assert.strictEqual(guide.images.length, 2, 'the geometry diagram and the board-plan grid are drawn');
  assert.deepStrictEqual(report.unrendered.map((u) => u.type), ['coaching_offer']);
  const out = visible(JSON.stringify(guide));
  const PAINTED = new Set(['text', 'question', 'look_for', 'q', 'a', 'word', 'meaning', 'title', 'prompt',
    'result', 'answer', 'support', 'extension', 'caption', 'legend', 'from', 'reteach_rule']);
  const missing = [];
  const walk = (v, key) => {
    if (typeof v === 'string') {
      if ((PAINTED.has(key) || key === '[]') && v.trim() && !out.includes(visible(JSON.stringify(v).slice(1, -1)))) missing.push(`${key}: ${v.slice(0, 60)}`);
      return;
    }
    if (Array.isArray(v)) v.forEach((x) => walk(x, typeof x === 'string' && ['items', 'steps', 'mark_scheme'].includes(key) ? '[]' : key));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) { if (k !== 'spec') walk(x, k); }
  };
  for (const s of doc.sections) {
    walk(s.blocks, 'blocks'); if (s.warmup) walk(s.warmup, 'warmup');
    if (s.checkpoint) walk(s.checkpoint, 'checkpoint'); if (s.exit_ticket) walk(s.exit_ticket, 'exit_ticket');
    if (s.reteach_rule) walk(s.reteach_rule, 'reteach_rule');
  }
  assert.deepStrictEqual(missing, [], 'every painted string of the real lesson reaches the guide verbatim');
  assert.ok(guide.sections.some((s) => s.id === 'ict-seq'), 'the sequence strip (last / this / checkpoint)');
  assert.ok(guide.sections.some((s) => s.id === 'ict-mcq'), 'grade 9: the FBISE question bank is printed');
});

test('our copy of ICT\'s diagram engine draws the production molecules byte for byte', () => {
  const { renderDiagram } = require('../guide/vendor/lp_diagrams');
  const f = load('niete_prod_2026-09-06_halicin_molecule.json');
  assert.strictEqual(renderDiagram(f.delivered_en), f.delivered_en_svg, 'the English delivery, prod 2026-09-06');
  assert.strictEqual(renderDiagram(f.failed_ur), f.failed_ur_svg, 'the Urdu spec from the same segment');
});

test('an ICT-authored English science lesson (G7 photosynthesis) maps cleanly, diagrams drawn in code', () => {
  const { guide, report } = buildGuideFromLpDoc(load('authored_PK_G7_GSCI_CH1_PHOTOSYNTHESIS.lp.json'));
  assert.strictEqual(guide.meta.locale, 'en');
  assert.strictEqual(guide.meta.subtitle, 'Grade 7 · General Science');
  assert.deepStrictEqual(report.warnings, []);
  assert.strictEqual(guide.images.length, 2, 'the leaf cross-section and the board-plan flow');
  assert.ok(guide.images.every((im) => /^data:image\/svg\+xml;base64,/.test(im.dataUri)), 'SVG, drawn by ICT\'s engine');
  assert.ok(report.unrendered.some((u) => u.type === 'textbook_figure'), 'the book photo is a reference until ICT\'s crops are reachable');
  assert.ok(!guide.sections.some((s) => s.id === 'ict-mcq'), 'grade 7: no FBISE question bank');
});
