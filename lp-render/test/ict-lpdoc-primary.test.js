'use strict';
// ICT's Grades 1–5 lp_doc (its HTML path for Grades 1–5) drawn on our Grades 1–5 page. The fixture is
// real: ICT's own GRADE_1_GENERAL_KNOWLEDGE_CH1_SEG2, copied byte for byte from NIETE-Rumi
// `sandbox`, bot/tests/fixtures/lp-v9/GK_g1_seg2.ur.lp.json (commit b65f97d6, 5 Oct 2026).
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { isPrimaryLpDoc, lessonFromLpDocPrimary, PLACEHOLDER } = require('../guide/from-lpdoc-primary');
const { buildGuideFromPrimary, isPrimaryLesson } = require('../guide/from-primary');
const { composePrimary } = require('../decorative/regions/ict/primary');

const FX = path.join(__dirname, '..', 'fixtures');
const GK = () => JSON.parse(fs.readFileSync(path.join(FX, 'ict-primary', 'lp-doc', 'GK_g1_seg2.ur.lp.json'), 'utf8'));
const compose = (doc) => composePrimary(buildGuideFromPrimary(lessonFromLpDocPrimary(doc)).guide);
const words = (html) => html.replace(/<style[\s\S]*?<\/style>/g, ' ').replace(/<[^>]+>/g, ' ')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const norm = (s) => String(s).replace(/_{3,}/g, ' ').replace(/\s+/g, ' ').trim();
const real = (s) => s != null && String(s).trim() && !PLACEHOLDER.test(String(s).trim());
const list = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]).filter(real);

// every string of the document that the page promises to print, read from the document itself
function docTexts(d) {
  const p = d.provenance; const p2 = d.page2;
  const out = [p.topic, p.subject, p.chapter, d.objectives.outcome, d.slo.code, ...d.materials, d.sequence.previous, d.sequence.next];
  for (const s of d.sections) {
    if (s.warmup) for (const it of s.warmup.items) out.push(it.q, it.a);
    for (const b of s.blocks) {
      if (b.type === 'ask') out.push(...list(b.question));
      if (b.type === 'big_idea') out.push(b.distinction, b.misconception, b.demo);
      if (b.type === 'worked_example') out.push(...list(b.steps), ...list(b.cfu));
      if (b.type === 'faded_example') out.push(...list(b.prompt), ...list(b.steps));
      if (b.type === 'key_points') out.push(...list(b.items));
      if (b.type === 'practice') for (const it of b.items) out.push(it.q, it.a);
      if (b.type === 'diagram') {
        const sp = b.spec; out.push(sp.title);
        for (const x of sp.panels || sp.steps || []) out.push(x.title, ...list(x.lines));
      }
    }
    for (const e of s.exit_ticket || []) out.push(...list(e.q), e.a);
  }
  for (const m of p2.mistakes) out.push(m.pupil_says, m.you_ask);
  out.push(...list(p2.differentiation.stuck), ...list(p2.differentiation.early), p2.coaching_lookfor, p2.coaching_reflection);
  out.push(p2.board_final.caption, ...list(p2.board_final.draw_order), p2.board_final.diagram.title);
  for (const x of p2.board_final.diagram.panels) out.push(x.title, ...list(x.lines));
  for (const h of p2.homework_key) out.push(h.ref, h.item, h.answer);
  return out.filter(real).map(norm).filter(Boolean);
}

test('a Grades 1–5 lp_doc is recognised and becomes a Grades 1–5 lesson; a grades 6–12 lp_doc is left to the 6–12 page', () => {
  assert.ok(isPrimaryLpDoc(GK()));
  const lesson = lessonFromLpDocPrimary(GK());
  assert.ok(isPrimaryLesson(lesson));
  assert.match(lesson.source.method, /^REAL ICT lp_doc/);
  const { report } = buildGuideFromPrimary(lesson);
  assert.deepStrictEqual(report.stages, ['opening', 'explanation', 'we_do', 'you_do', 'check', 'homework']);
  for (const f of fs.readdirSync(path.join(FX, 'ict')).filter((x) => x.endsWith('.lp.json'))) {
    const d = JSON.parse(fs.readFileSync(path.join(FX, 'ict', f), 'utf8'));
    assert.ok(!isPrimaryLpDoc(d), `${f} (grade ${d.provenance.grade}) stays on the grades 6–12 page`);
  }
});

test('nothing the document tells the teacher is dropped: every printed field is on the page, word for word', () => {
  const page = words(compose(GK()).bodyHtml);
  for (const s of docTexts(GK())) {
    for (const piece of s.split(/(?<=[.!?۔؟])\s+/)) assert.ok(page.includes(piece.trim()), `«${piece.slice(0, 70)}» is on the page`);
  }
});

test('the parts ICT\'s own renderer mishandles: the core idea is drawn, lists read as sentences, unfinished slots stay off the page', () => {
  const d = GK();
  const page = words(compose(d).bodyHtml);
  const big = d.sections.find((s) => s.id === 'development').blocks.find((b) => b.type === 'big_idea');
  assert.ok(page.includes(norm(big.distinction)), 'the big_idea box ICT skips is printed');
  const hook = d.sections[0].blocks.find((b) => b.hook).question;
  assert.ok(!page.includes(hook.join(',')), 'the opening question is not printed as a comma-joined array');
  assert.ok(!PLACEHOLDER.test(page) && !/یہ حصہ ابھی تیار نہیں ہوا/.test(page), 'no "not ready yet" placeholder reaches the page');
  const { gaps } = lessonFromLpDocPrimary(d).source;
  assert.ok(gaps.includes('page2.differentiation.barrier') && gaps.some((g) => g.startsWith('page2.model_answers')), `gaps reported: ${gaps.join(', ')}`);
});

test('ICT\'s panels and flow diagrams become the page\'s own charts; any other diagram type is refused, not dropped', () => {
  const lesson = lessonFromLpDocPrimary(GK());
  assert.strictEqual(lesson.board[0].visual.type, 'compare');
  const figs = lesson.stages.flatMap((s) => s.blocks).filter((b) => b.type === 'figure').map((b) => b.visual.type);
  assert.deepStrictEqual(figs, ['flow', 'flow']);
  assert.strictEqual(lesson.board_end.visual.type, 'compare');
  const bad = GK(); bad.sections[1].blocks.find((b) => b.type === 'diagram').spec.type = 'molecule';
  assert.throws(() => lessonFromLpDocPrimary(bad), /no Grades 1–5 drawing for ICT diagram type "molecule"/);
});

test('the Grade 1 GK lp_doc prints on phone pages in Urdu: nothing outside its page, nothing bought, pages numbered in Urdu', { timeout: 120000 }, async () => {
  const { renderLessonImage } = require('../pipeline');
  const { guide } = buildGuideFromPrimary(lessonFromLpDocPrimary(GK()));
  const r = await renderLessonImage(guide, { apiKey: '', pdf: true, log: () => {} });
  const pages = r.html.split('<section class="qpg"').slice(1);
  assert.ok(pages.length >= 5 && pages.length <= 9, `${pages.length} pages`);
  assert.deepStrictEqual(r.overflow, []);
  assert.strictEqual(r.stats.generated, 0);
  assert.ok(pages[0].includes('صفحہ ۱ از'), 'page N of M in Urdu digits');
});
