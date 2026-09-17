'use strict';
// THE خطأ/صواب BOARD MUST NEVER HAVE AN EMPTY HALF.
//
// Found while running the Yemen chain end to end: the صواب box was rendering as a green
// panel with a tick and no words under it — in SEVEN of the fifteen approved lessons.
//
// Every one of those lessons states its correction. The profile split the sentence on «؛»
// alone, and Yemen writes the same sentence three ways:
//
//   «…لتشابه الحروف؛ يصححه المعلم بالتركيز على…»        semicolon  — split
//   «…والاكتفاء بالكفين، ويصححه المعلم بتوضيح…»          comma      — did NOT split
//   «…عند كتابة الكسر. يصححه المعلم بالتأكيد على…»       full stop  — did NOT split
//
// So the correction stayed inside the خطأ half and the صواب half had nothing to show. The
// split now keys on where the correction BEGINS. Below that there is a floor: if a lesson
// genuinely states no correction, the board draws ONE panel rather than an empty box —
// nothing may be invented to fill it.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { buildGuideFromMarkdown } = require('../guide/from-markdown');
const { renderDecorativeLesson } = require('../decorative/render');

const lesson = (errors) => [
  `الأخطاء الشائعة: ${errors}`,
  'المواد: السبورة والطباشير',
  '',
  'التمهيد (٥ دقائق)',
  '',
  'ما الذي نتعلمه اليوم؟',
  '',
  'ركن المعلّم: عزيزي المعلم، اربط الدرس بحياة تلاميذك.',
].join('\n');

const board = (errors) => {
  const g = buildGuideFromMarkdown(lesson(errors), { region: 'ye' });
  const s = (g.sections || []).find((x) => x.type === 'misconception');
  assert.ok(s, 'the fixture produced no misconception card — the test would pass vacuously');
  return s;
};

const CORRECTION = 'يصححه المعلم بتوضيح الفرق بين الرسغ والمرفق عملياً.';
const MISTAKE = 'نسيان غسل اليدين إلى المرفقين والاكتفاء بالكفين';

for (const [name, sentence] of [
  ['a semicolon', `${MISTAKE}؛ ${CORRECTION}`],
  ['a comma and a joining «و»', `${MISTAKE}، و${CORRECTION}`],
  ['a full stop', `${MISTAKE}. ${CORRECTION}`],
]) {
  test(`the correction is found when the source separates it with ${name}`, () => {
    const s = board(sentence);
    assert.ok(s.fix, `صواب has nothing to show — the correction stayed inside the خطأ half`);
    assert.strictEqual(s.fix, CORRECTION,
      'the صواب half must carry the correction exactly as the source wrote it');
    assert.strictEqual(s.body, MISTAKE,
      'the خطأ half must carry the mistake exactly as the source wrote it, and only that');
  });
}

test('a lesson that states no correction keeps its words and splits nothing', () => {
  const only = 'خلط التلميذ بين الشكل الرباعي وأي شكل آخر له أربعة أضلاع في الرسم';
  const s = board(only);
  assert.strictEqual(s.body, only, 'the mistake was altered');
  assert.ok(!s.fix, 'a correction was manufactured out of a sentence that has none');
});

// ── the floor, measured ──────────────────────────────────────────────────────────────
function chromePath() {
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function html(errors) {
  const guide = buildGuideFromMarkdown(lesson(errors), { region: 'ye' });
  const out = renderDecorativeLesson(guide, {}, {});
  assert.ok(out.bodyHtml && out.bodyHtml.includes('class="section'),
    'the renderer must return card markup for this test to mean anything');
  const css = require('../decorative/theme').THEME_CSS
    + require('../decorative/regions/ye/theme').THEME_OVERRIDE_CSS + (out.headCss || '');
  return '<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    + `<style>${css}</style></head><body>${out.headHtml || ''}${out.bodyHtml}</body></html>`;
}

test('no half of the board is ever an empty box', async (t) => {
  const exe = chromePath();
  if (!exe) return t.skip('no chromium on this machine');
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  try {
    for (const [what, sentence] of [
      ['a stated correction', `${MISTAKE}، و${CORRECTION}`],
      ['no correction at all', 'خلط التلميذ بين الشكل الرباعي وأي شكل آخر له أربعة أضلاع'],
    ]) {
      const page = await browser.newPage({ viewport: { width: 794, height: 1200 } });
      await page.setContent(html(sentence), { waitUntil: 'networkidle' });
      const halves = await page.evaluate(() => [...document.querySelectorAll('.yl-half')]
        .map((h) => {
          const r = h.getBoundingClientRect();
          const body = h.querySelector('.yl-mbody');
          return { w: Math.round(r.width), text: (body ? body.innerText : '').trim().length };
        }));
      await page.close();
      assert.ok(halves.length, `${what}: no board rendered`);
      for (const h of halves) {
        assert.ok(h.text > 0,
          `${what}: a ${h.w}px half of the board rendered with no words in it`);
      }
    }
  } finally { await browser.close(); }
});
