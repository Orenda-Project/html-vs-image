'use strict';
// LAYOUT CONTRACT: everything stays inside its own card.
//
// The reviewer's list, in her words: no overflow outside divs, no overlapping cards, no
// broken alignment, no tiny fragmented side cards, everything inside its own card
// boundary. Three separate defects produced that list, and all three were invisible in
// the DOM tree — they only appear once the boxes are measured:
//
//   1. «الإجابات» printed ON its card's top border and its answer line hung below the
//      bottom one. Those sections were the last still using the generic `.panel`, whose
//      header is pulled 32px INTO the card by `.s-head{height:32px;margin:0 0 -32px}` —
//      a trick that needs ≥33px of top padding to land inside. Padding edits took the
//      padding away and the header had nothing left to sit in.
//   2. The goal card's dart icon covered «الأسرة» and the homework card's messenger icon
//      covered «صبرك». Each icon is pinned with a LOGICAL inset (`inset-inline-end`)
//      while its gutter was reserved with PHYSICAL padding (`padding-right`), so in an
//      RTL document the space opened on the opposite side from the icon. This is the
//      third time this repo has been bitten by mixing the two coordinate systems.
//   3. A stage's instruction line («يفتح التلاميذ الكتاب صفحة ٣٢…») became a card of its
//      own, which the pagination then put on a different page from the exercises it
//      introduces.
//
// So the test renders the real lesson through the real converter and asserts geometry.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildGuideFromMarkdown } = require('../guide/from-markdown');
const { renderDecorativeLesson } = require('../decorative/render');

const RAW = fs.readFileSync(path.join(__dirname, '..', 'fixtures', 'usrati-matching.ar.txt'), 'utf8');

function chromePath() {
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// The illustration is a 1x1 pixel: this test is about boxes, not artwork.
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

function html() {
  const guide = buildGuideFromMarkdown(RAW, { region: 'ye' });
  const images = {};
  for (const im of guide.images || []) images[im.id] = { dataUri: PIXEL, width: 900, height: 600 };
  // renderDecorativeLesson returns {headHtml, bodyHtml, headCss, …} — interpolating the
  // object gives «[object Object]», a page with no cards in it, and a test that passes
  // by measuring nothing. Assert the shape so that can never happen quietly.
  const out = renderDecorativeLesson(guide, images, {});
  assert.ok(out.bodyHtml && out.bodyHtml.includes('class="section'),
    'the renderer must return card markup for this test to mean anything');
  const css = require('../decorative/theme').THEME_CSS
    + require('../decorative/regions/ye/theme').THEME_OVERRIDE_CSS + (out.headCss || '');
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">`
    + `<style>${css}</style></head><body>${out.headHtml || ''}${out.bodyHtml}</body></html>`;
}

async function measure(page) {
  return page.evaluate(() => {
    const R = (e) => e.getBoundingClientRect();
    const secs = [...document.querySelectorAll('.body > .section')];
    const out = { overflow: [], overlap: [], clipped: [], iconHits: [] };
    secs.forEach((s, i) => {
      const sr = R(s);
      for (const el of s.querySelectorAll('*')) {
        const r = R(el);
        if (!r.width || !r.height) continue;
        const out_by = Math.max(sr.top - r.top, r.bottom - sr.bottom,
          sr.left - r.left, r.right - sr.right);
        // 1.5px of tolerance: a border sits on the boundary by design.
        if (out_by > 1.5) {
          out.overflow.push({ sec: s.className, el: el.className || el.tagName, by: +out_by.toFixed(1) });
        }
      }
      for (const el of s.querySelectorAll('div,p,span,li,td')) {
        if (el.scrollHeight - el.clientHeight > 2 && getComputedStyle(el).overflow !== 'visible') {
          out.clipped.push({ sec: s.className, el: el.className || el.tagName });
        }
      }
      for (let j = i + 1; j < secs.length; j++) {
        const o = R(secs[j]);
        const dx = Math.min(sr.right, o.right) - Math.max(sr.left, o.left);
        const dy = Math.min(sr.bottom, o.bottom) - Math.max(sr.top, o.top);
        if (dx > 1 && dy > 1) out.overlap.push({ a: s.className, b: secs[j].className });
      }
    });
    // THE ICONS ARE REAL ELEMENTS NOW. Both were absolutely-positioned pseudo-elements
    // with a padding gutter reserved for them, and a later block rule of equal specificity
    // kept resetting that gutter — the dart drifted back onto «الأسرة» whenever the block
    // padding was touched, and the teacher's-corner tab ended up a 15px stub floating above
    // its card. As flex children they cannot overlap their text, and they can be measured.
    for (const sel of ['.yl-badge', '.yl-btab', '.yl-ntab']) {
      for (const ic of document.querySelectorAll(sel)) {
        const ir = R(ic);
        const card = ic.closest('.section');
        if (!card) continue;
        for (const t of card.querySelectorAll('.d-note,.d-text,.yl-title,.yl-nlabel,.yl-nrules')) {
          const tr = R(t);
          const hit = Math.min(ir.right, tr.right) - Math.max(ir.left, tr.left);
          const vhit = Math.min(ir.bottom, tr.bottom) - Math.max(ir.top, tr.top);
          if (hit > 1 && vhit > 1) out.iconHits.push({ sel, overlapPx: +hit.toFixed(1) });
        }
      }
    }
    return out;
  });
}

test('no card overflows, overlaps, clips its text, or lets an icon sit on it', async (t) => {
  const exe = chromePath();
  if (!exe) return t.skip('no chromium available');
  const { chromium } = require('playwright-core');
  const file = path.join(require('node:os').tmpdir(), `card-geometry-${process.pid}.html`);
  fs.writeFileSync(file, html());
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  try {
    // The page ships at 794px. The narrower and wider widths catch a rule that only
    // happens to fit at one measurement.
    for (const width of [720, 794, 900]) {
      const page = await browser.newPage();
      await page.setViewportSize({ width, height: 1123 });
      await page.goto('file://' + file);
      const r = await measure(page);
      assert.deepStrictEqual(r.overflow, [], `content outside its card at ${width}px`);
      assert.deepStrictEqual(r.overlap, [], `cards overlapping at ${width}px`);
      assert.deepStrictEqual(r.clipped, [], `text clipped by its box at ${width}px`);
      assert.deepStrictEqual(r.iconHits, [], `a pinned icon is sitting on text at ${width}px`);
      await page.close();
    }
  } finally {
    await browser.close();
    fs.unlinkSync(file);
  }
});

test('the teacher-notes badge stays inside its own card', () => {
  // It was a ::after box with a ::before tab, both positioned against the ASSESSMENT
  // STAGE's rectangle. That held while the stage was one flat panel; once the stage became
  // an outer tinted card with its own padding the tab was measured against the wrong box
  // and printed outside the notes strip — and a pseudo-element cannot be measured by the
  // geometry check above, so nothing caught it but the reviewer's eye.
  const guide = buildGuideFromMarkdown(RAW, { region: 'ye' });
  const notes = guide.sections.find((s) => s.type === 'notes');
  assert.ok(notes, 'the design supplies the notes section for every lesson');
  assert.match(notes.label, /ملاحظات/);
  const { bodyHtml } = renderDecorativeLesson(guide, {}, {});
  assert.match(bodyHtml, /class="section yl-notes/, 'it is a real section');
  assert.match(bodyHtml, /yl-ntab/, 'with its badge as a real element inside it');
  const css = require('../decorative/regions/ye/theme').THEME_OVERRIDE_CSS;
  assert.match(css, /\.section\.sec-stage-taqwim::after[^}]*content:none/,
    'and the pseudo-element chrome it replaces must be switched off, or both draw');
});

test('a stage is ONE card, and its instruction leads the activity it introduces', () => {
  const guide = buildGuideFromMarkdown(RAW, { region: 'ye' });
  const tatbiq = guide.sections.filter((s) => s.id === 'stage-tatbiq');
  // The approved pages compose a stage as one large teaching card holding its activities.
  assert.strictEqual(tatbiq.length, 1, 'one stage, one card');
  assert.strictEqual(tatbiq[0].heading, 'التطبيق',
    'the tab carries the stage name only — a 44-character exercise label in the tab pushed '
    + 'the duration and mode pills outside the card');
  assert.strictEqual(tatbiq[0].activities.length, 2, 'both exercises are activities in it');
  assert.match(tatbiq[0].activities[0].label, /١\)/);
  assert.match(tatbiq[0].activities[1].label, /٢\)/);
  assert.match(tatbiq[0].lead || '', /يفتح التلاميذ الكتاب صفحة/,
    'the instruction leads the card that carries the exercises it describes');
  assert.ok(!tatbiq[0].activities.some((a) => /^\s*يفتح التلاميذ/.test(a.body || '')),
    'and it is not duplicated into an activity body');
});

test('a heading the source left empty collapses to its label', () => {
  const guide = buildGuideFromMarkdown(RAW, { region: 'ye' });
  const arad = guide.sections.find((s) => s.id === 'stage-arad');
  assert.ok(arad, 'العرض is in the source and must stay in the plan');
  const hasText = (arad.activities || []).some((a) => a.body) || arad.body;
  assert.ok(!hasText, 'the source has no text under it, so nothing may be invented');
  const { bodyHtml } = renderDecorativeLesson(guide, {}, {});
  assert.match(bodyHtml, /yl-stage yl-empty/,
    'an empty stage collapses: its tab and pills, no card, no blank region');
  assert.ok(!/yl-empty[^>]*>\s*<div class="yl-shead">[\s\S]{0,400}yl-scard/.test(bodyHtml),
    'a collapsed stage must not render a content card at all');
});
