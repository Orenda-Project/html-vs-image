'use strict';
// NO ILLUSTRATION DOMINATES A PAGE.
//
// The reviewer: "some AI-generated images are too large / too heavy visually … one image
// is taking almost the whole page". Measured on a Rumi-written lesson before the fix: a
// single illustration at 692×517px, half the composer's 1059px printable page, and
// cropped by object-fit:cover on top of that.
//
// TWO CAUSES, one in each layer, so this file tests both:
//   1. The design pack capped the picture for التمهيد only. Any other stage met
//      `max-height:none` and was sized by whatever column it landed in.
//   2. The renderer offered the section's illustration to the first activity with no
//      picture of its own — which, now that stages arrive as several small blocks, is
//      often one with no TEXT either. An activity with a visual and no text lays out
//      `yl-solo`, where the picture takes the inner card's full width.
//
// And the cap is pinned to the composer's own page geometry here, not just asserted to be
// "small", so the two cannot drift apart silently.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { buildGuideFromMarkdown } = require('../guide/from-markdown');
const { renderDecorativeLesson } = require('../decorative/render');

const THEME = require('../decorative/regions/ye/theme').THEME_OVERRIDE_CSS;
const COMPOSER = fs.readFileSync(path.join(__dirname, '..', 'render', 'png-to-pdf.js'), 'utf8');

const num = (re, src, what) => {
  const m = src.match(re);
  assert.ok(m, `could not read ${what} — this test is pinned to it and must be updated with it`);
  return Number(m[1]);
};

// The composer's own numbers, read from the composer. `ar-bottom` is the page style this
// design pack declares, which is the branch that reserves the footer band.
const PAGE_H = num(/const PAGE_H = (\d+)/, COMPOSER, 'PAGE_H');
const TOP = num(/const TOP = (\d+)/, COMPOSER, 'TOP');
const BOT = num(/'ar-bottom' \? (\d+)/, COMPOSER, 'BOT for ar-bottom');
const USABLE = PAGE_H - TOP - BOT;

test('the design pack knows the composer\'s printable page height', () => {
  const declared = num(/--lp-page-usable:(\d+)px/, THEME, '--lp-page-usable');
  assert.strictEqual(declared, USABLE,
    `the pack declares a ${declared}px printable page; the composer makes it `
    + `${PAGE_H} - ${TOP} - ${BOT} = ${USABLE}px. One of the two moved without the other.`);
});

test('the art cap is the approved design\'s own largest illustration, and one number', () => {
  const cap = num(/--lp-art-max:(\d+)px/, THEME, '--lp-art-max');
  // The intro illustration's height on the approved page. Its rule is `!important` and
  // still governs التمهيد; the variable must carry the same value or the pack would be
  // saying two different things about how big the biggest picture is.
  const tamhid = [...THEME.matchAll(/sec-stage-tamhid[^{]*\.yl-illus img\{max-height:(\d+)px !important\}/g)]
    .map((m) => Number(m[1]));
  assert.ok(tamhid.length, 'the approved intro illustration rule is gone — re-pin this test');
  assert.strictEqual(cap, tamhid[tamhid.length - 1],
    'the cap and the approved intro illustration must be the same number');
  assert.ok(cap < USABLE / 3,
    `a ${cap}px picture is ${Math.round(cap / USABLE * 100)}% of the printable page`);
});

// ── the measured half ────────────────────────────────────────────────────────────────
// A lesson whose illustration lands in العرض, not التمهيد: the exact case the pack had no
// rule for. Written in the raw shape the mapper reads, so this goes through the real
// converter and the real renderer.
const lesson = (arad) => [
  'الهدف: أستطيع أن أسمي أجزاء النبات وأصف وظيفة كل جزء.',
  'المواد: نبتة في أصيص، السبورة والطباشير',
  '',
  'التمهيد (٥ دقائق)',
  '',
  'ما الذي تحتاجه النبتة لتنمو؟',
  '',
  'العرض — أنا أفعل (١٠ دقائق)',
  '',
].concat(arad).concat([
  'نقطة التحقق: ٤ من كل ٥ تلاميذ يسمون ثلاثة أجزاء.',
  'دعم: إعادة تسمية الأجزاء مع التلميذ أمام النبتة.',
  '',
  'ركن المعلّم: عزيزي المعلم، اجعل التلاميذ يلمسون أوراق النبات.',
]).join('\n');

// Every activity is label-only — the shape that put the picture on its own across the
// card. It stays on its own here (there is no text to pair it with and none may be
// invented); the design pack is what keeps it to a picture rather than a poster.
const RAW = lesson([
  'اعرض النبتة أمام التلاميذ وأشر إلى كل جزء منها.',
  '١. الجذور: تثبت النبات في التربة وتمتص الماء',
  '٢. الساق: تحمل الماء إلى الأوراق',
]);

// One activity DOES carry teaching text, and it is not the first. The picture belongs
// beside those words. Before the fix the illustration went to whichever activity came
// first without a picture of its own — here the label-only one — and went full width.
const RAW_WITH_TEXT = lesson([
  '١. الجذور:',
  'الأوراق: تصنع الأوراق غذاء النبات من ضوء الشمس والهواء، ويشرح المعلم ذلك للتلاميذ '
    + 'وهو يشير إلى ورقة من النبتة المعروضة أمامهم على الطاولة.',
]);

// A real natural size, so the layout has a genuine aspect ratio to work with. A 1×1 pixel
// would let any rule look correct.
const ART = 'data:image/svg+xml;utf8,'
  + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="900" height="600"></svg>');

function chromePath() {
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function html(raw) {
  const guide = buildGuideFromMarkdown(raw, { region: 'ye' });
  // hang the illustration on العرض, whichever id the profile gave it
  const stage = (guide.sections || []).find((s) => s.id === 'stage-arad');
  assert.ok(stage, 'the fixture must produce an العرض stage for this test to mean anything');
  guide.images = [{ id: 'art', prompt: 'x', label: 'النبتة' }];
  stage.image = 'art';
  const out = renderDecorativeLesson(guide, { art: { dataUri: ART, width: 900, height: 600 } }, {});
  assert.ok(out.bodyHtml && out.bodyHtml.includes('class="section'),
    'the renderer must return card markup for this test to mean anything');
  const css = require('../decorative/theme').THEME_CSS + THEME + (out.headCss || '');
  return '<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    + `<style>${css}</style></head><body>${out.headHtml || ''}${out.bodyHtml}</body></html>`;
}

async function boxes(browser, raw) {
  const page = await browser.newPage({ viewport: { width: 794, height: 1400 } });
  await page.setContent(html(raw), { waitUntil: 'networkidle' });
  const out = await page.evaluate(() => {
    const r = (el) => { const b = el.getBoundingClientRect(); return { w: Math.round(b.width), h: Math.round(b.height) }; };
    const img = document.querySelector('.yl-illus img');
    return {
      img: img ? r(img) : null,
      figure: img ? r(img.closest('.yl-illus')) : null,
      card: img ? r(img.closest('.yl-scard') || img.closest('.section')) : null,
      solo: !!(img && img.closest('.yl-sbody.yl-solo')),
    };
  });
  await page.close();
  return out;
}

test('an illustration outside التمهيد is still bounded by the page', async (t) => {
  const exe = chromePath();
  if (!exe) return t.skip('no chromium on this machine');
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  const cap = num(/--lp-art-max:(\d+)px/, THEME, '--lp-art-max');
  try {
    const b = await boxes(browser, RAW);
    assert.ok(b.img, 'the fixture drew no illustration — the test would pass vacuously');
    assert.ok(b.img.h <= cap + 1,
      `an illustration measured ${b.img.w}×${b.img.h}px — ${Math.round(b.img.h / USABLE * 100)}% `
      + `of the ${USABLE}px printable page, against a ${cap}px cap`);
    // A CAP ALONE WOULD NOT BE ENOUGH. Held at full width with its height clamped, the
    // frame becomes a wide white slab with a small picture adrift inside it. The frame
    // hugs the picture instead, so what is left over is card, not empty box.
    assert.ok(b.figure.w - b.img.w < 40,
      `the picture is ${b.img.w}px wide inside a ${b.figure.w}px frame — `
      + `${b.figure.w - b.img.w}px of empty frame around it`);
    // and the aspect ratio is intact: 900×600 is 3:2, so nothing has been cropped or squashed
    assert.ok(Math.abs(b.img.w / b.img.h - 1.5) < 0.02,
      `the picture rendered at ${b.img.w}×${b.img.h}, which is not the 3:2 it was drawn at`);
  } finally { await browser.close(); }
});

test('the section illustration goes to an activity that has words for it to sit beside', async (t) => {
  const exe = chromePath();
  if (!exe) return t.skip('no chromium on this machine');
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  try {
    const b = await boxes(browser, RAW_WITH_TEXT);
    assert.ok(b.img, 'the fixture drew no illustration — the test would pass vacuously');
    assert.strictEqual(b.solo, false,
      'the picture went to the label-only activity and laid out across the whole card '
      + 'instead of beside the activity that has teaching text');
    assert.ok(b.img.w < b.card.w * 0.7,
      `the picture is ${b.img.w}px of a ${b.card.w}px card — it is not sharing the row`);
  } finally { await browser.close(); }
});
