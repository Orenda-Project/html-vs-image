'use strict';
// LAYOUT RULE: the ملاحظات badge must stay inside the teacher-notes card.
//
// HISTORY, because this rule has now been broken twice by two different mechanisms:
//
//  1. The strip was a ::after and its tab a ::before on the SAME section, so neither could
//     measure the other. Their heights were maintained separately and drifted — a theme
//     round trimmed the strip to 66px while the tab stayed 72px, and the tab stood 8px
//     above the strip. That was fixed by driving both from one custom property.
//  2. Then the assessment stage became an outer TINTED CARD with its own padding, and the
//     tab — still positioned against the SECTION's rectangle rather than against the strip
//     — printed outside the notes box again. A shared variable cannot save a component
//     whose two halves are anchored to different boxes.
//
// So the notes are a real section with real children now (ylNotes), and this test measures
// the elements. A pseudo-element could not be measured by the geometry suite at all, which
// is why both regressions had to be caught by eye.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { THEME_CSS } = require('../decorative/theme');
const { renderDecorativeLesson } = require('../decorative/render');

function chromePath() {
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const GUIDE = {
  meta: { region: 'ye', locale: 'ar', title: 'دليل الدرس اليومي' },
  sections: [
    { id: 'stage-taqwim', type: 'stage', heading: 'التقويم والختام', time: '٥ دقائق',
      activities: [{ label: '', body: 'اطلب من التلميذ الإجابة شفهيًا.' }],
      checks: ['٨٠٪ من التلاميذ يجيبون إجابة صحيحة.'] },
    { id: 'notes', type: 'notes', label: 'ملاحظات المعلّم بعد الدرس', tab: 'ملاحظات', lines: 2 },
  ],
};

test('the ملاحظات badge sits inside the notes card, never outside it', async (t) => {
  const exe = chromePath();
  if (!exe) return t.skip('no chromium available');
  const { chromium } = require('playwright-core');
  const regionCss = require('../decorative/regions/ye/theme').THEME_OVERRIDE_CSS;
  const out = renderDecorativeLesson(GUIDE, {}, {});
  assert.match(out.bodyHtml, /yl-notes/, 'the notes section must render');
  const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">`
    + `<style>${THEME_CSS}</style><style>${regionCss}</style></head><body>`
    + `${out.bodyHtml}</body></html>`;
  const file = path.join(os.tmpdir(), `notes-tab-${process.pid}.html`);
  fs.writeFileSync(file, html);
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  try {
    for (const width of [700, 794, 900]) {
      const page = await browser.newPage();
      await page.setViewportSize({ width, height: 900 });
      await page.goto('file://' + file);
      const g = await page.evaluate(() => {
        const R = (s) => {
          const e = document.querySelector(s);
          if (!e) return null;
          const r = e.getBoundingClientRect();
          return { t: r.top, b: r.bottom, l: r.left, r: r.right, h: r.height, w: r.width };
        };
        return { card: R('.section.yl-notes'), tab: R('.yl-ntab'),
          body: R('.section.yl-notes .yl-nbody'), label: R('.yl-nlabel') };
      });
      assert.ok(g.card && g.tab, `the card and its badge must both render at ${width}px`);
      assert.ok(g.tab.h > 20, `the badge should be a real block, got ${g.tab.h}px`);
      for (const side of [['t', 1], ['l', 1]]) {
        assert.ok(g.tab[side[0]] >= g.card[side[0]] - 1.5,
          `at ${width}px the badge crosses the card's ${side[0]} edge`);
      }
      assert.ok(g.tab.b <= g.card.b + 1.5, `at ${width}px the badge hangs below the card`);
      assert.ok(g.tab.r <= g.card.r + 1.5, `at ${width}px the badge runs past the card`);
      // it must reach the card's edges, or it reads as floating — the original complaint
      assert.ok(g.tab.t - g.card.t <= 3 && g.card.b - g.tab.b <= 3,
        `at ${width}px the badge is inset from the card's top/bottom and reads as floating`);
      // THE SIDE IS PART OF THE DESIGN. The reviewer's correct version puts the dark badge
      // at the card's RIGHT edge with the label beside it; a flex order change once mirrored
      // it to the far end and read as "flipped/inverted". RTL start = the right edge.
      assert.ok(Math.abs(g.tab.r - g.card.r) <= 2,
        `at ${width}px the badge is not at the card's right edge — it has been mirrored`);
      // and it must not sit on the notes text
      assert.ok(Math.min(g.tab.r, g.label.r) - Math.max(g.tab.l, g.label.l) <= 1,
        `at ${width}px the badge overlaps the notes label`);
      await page.close();
    }
  } finally {
    await browser.close();
    fs.rmSync(file, { force: true });
  }
});
