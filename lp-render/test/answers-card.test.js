'use strict';
// THE الإجابات CARD — two regressions the reviewer found on Rumi-written lessons.
//
//   1. EMPTY. The card printed its title over an empty box. The comprehension splitter
//      moves a glued «question؟ الإجابة: answer» run out of a body and into activities[],
//      then re-homes the section as a stage so the stage renderer can draw them — but it
//      only re-homes ids the profile lists as stages, and it was running on every section
//      regardless. الإجابات is a `block`: ylBlock() draws the body string it is handed and
//      knows nothing about activities. So on an answer key written as a Q&A run, the body
//      was cleared and the pairs were parked where nothing draws them.
//
//   2. HALF A ROW WITH NOTHING BESIDE IT. The closing pair pins بطاقة الخروج to columns
//      1-6 and الإجابات to 7-12. A Rumi lesson has no exit ticket, so a full answer key
//      was laid out in a 366px column with 384px of empty paper next to it — the "narrow
//      side card" in the report.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { buildGuideFromMarkdown } = require('../guide/from-markdown');
const { renderDecorativeLesson } = require('../decorative/render');

// An answer key written the way the writer writes one: the questions and their answers on
// a single line, so the run carries the «الإجابة:» marker more than once.
const ANSWER_RUN = 'الإجابة: ١. لماذا يحب أحمد والده؟ الإجابة: يحب أحمد والده لأنه يتعب '
  + 'من أجله ويسهر على راحة أسرته. ٢. ما واجبنا نحو والدينا؟ الإجابة: واجبنا نحو والدينا '
  + 'حبهما وتقديرهما وطاعتهما.';

const lesson = (extra = []) => [
  'الهدف: أستطيع أن أقرأ نص حب الوالدين وأجيب عن أسئلة الاستيعاب.',
  'المواد: الكتاب المدرسي، كراسة التلميذ والقلم',
  '',
  'التقويم — أنت تفعل (١٠ دقائق)',
  '',
  'اطلب من التلاميذ كتابة إجابات الأسئلة في كراساتهم بشكل مستقل.',
  'نقطة التحقق: ٨٠٪ من التلاميذ يجيبون عن السؤالين إجابة صحيحة.',
  '',
].concat(extra).concat([
  '',
  'ركن المعلّم: عزيزي المعلم، اربط النص بحياة تلاميذك اليومية.',
]).join('\n');

const guideOf = (raw) => buildGuideFromMarkdown(raw, { region: 'ye' });
const sectionOf = (g, id) => (g.sections || []).find((s) => s.id === id);

test('an answer key written as a Q&A run keeps its text', () => {
  const sol = sectionOf(guideOf(lesson([ANSWER_RUN])), 'solutions');
  assert.ok(sol, 'the fixture produced no الإجابات card — the test would pass vacuously');
  // whatever shape it draws in, the card must HAVE something to draw
  const drawn = [sol.body || '', ...(sol.items || []).map((i) => i.text || '')].join(' ').trim();
  assert.ok(drawn.length > 40,
    `الإجابات carries ${drawn.length} characters of drawable text — it renders as an empty box`);
  // and it is the source's own answers, not a paraphrase or a fragment
  for (const phrase of ['يتعب من أجله', 'حبهما وتقديرهما وطاعتهما']) {
    assert.ok(drawn.includes(phrase), `the answer «${phrase}» is not on the card`);
  }
});

test('a numbered activity is not eaten because a role word appears in it', () => {
  // «١. الإجابة الكتابية عن أسئلة الاستيعاب» is a teaching activity, not the الإجابات
  // heading. The role pattern matched «الإجابة» three characters in, the line was
  // consumed as a role marker, and its words never reached the page — a silent loss of
  // teacher text in two of seven lessons.
  const raw = lesson(['١. الإجابة الكتابية عن أسئلة الاستيعاب', '٢. التأكد من صحة الإملاء']);
  const g = guideOf(raw);
  const all = [];
  (function walk(v) {
    if (typeof v === 'string') all.push(v);
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  }(g));
  const blob = all.join(' ').replace(/\s+/g, ' ');
  assert.ok(blob.includes('الإجابة الكتابية'),
    'the numbered activity was read as the الإجابات heading and its words were dropped');
  assert.ok(blob.includes('التأكد من صحة الإملاء'), 'the activity beside it was dropped too');
});

test('the splitter still turns a stage\'s Q&A run into one activity per question', () => {
  // the case the pass was written for: the run sits in a TAQWIM stage, which can draw
  // activities, so it is split and re-homed. Nothing here may regress.
  const raw = lesson().replace(
    'اطلب من التلاميذ كتابة إجابات الأسئلة في كراساتهم بشكل مستقل.',
    'اطلب من التلاميذ الإجابة. ' + ANSWER_RUN.replace(/^الإجابة: /, ''),
  );
  const taqwim = sectionOf(guideOf(raw), 'stage-taqwim');
  assert.ok(taqwim, 'no التقويم stage in the fixture');
  const acts = (taqwim.activities || []).filter((a) => a.answer);
  assert.strictEqual(acts.length, 2,
    `the stage produced ${acts.length} question/answer activities, not 2`);
  // the question may sit in either slot — a later pass promotes a short one to the label,
  // and the assessment renderer reads `body || label` for exactly that reason
  const question = (a) => `${a.body || ''} ${a.label || ''}`;
  assert.ok(question(acts[0]).includes('لماذا يحب أحمد والده'), 'the first question is wrong');
  assert.ok(acts[1].answer.includes('حبهما وتقديرهما'), 'the second answer is wrong');
});

// ── the measured half ────────────────────────────────────────────────────────────────
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

function chromePath() {
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function html(raw) {
  const guide = guideOf(raw);
  const images = {};
  for (const im of guide.images || []) images[im.id] = { dataUri: PIXEL, width: 900, height: 600 };
  const out = renderDecorativeLesson(guide, images, {});
  assert.ok(out.bodyHtml && out.bodyHtml.includes('class="section'),
    'the renderer must return card markup for this test to mean anything');
  const css = require('../decorative/theme').THEME_CSS
    + require('../decorative/regions/ye/theme').THEME_OVERRIDE_CSS + (out.headCss || '');
  return '<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">'
    + `<style>${css}</style></head><body>${out.headHtml || ''}${out.bodyHtml}</body></html>`;
}

async function widths(browser, raw) {
  const page = await browser.newPage({ viewport: { width: 794, height: 1400 } });
  await page.setContent(html(raw), { waitUntil: 'networkidle' });
  const out = await page.evaluate(() => {
    const w = (sel) => {
      const el = document.querySelector(sel);
      return el ? Math.round(el.getBoundingClientRect().width) : null;
    };
    const row = document.querySelector('.body');
    return { sol: w('.sec-solutions'), exit: w('.sec-exit-ticket'),
      text: (document.querySelector('.sec-solutions') || {}).innerText || '',
      row: row ? Math.round(row.getBoundingClientRect().width) : 0 };
  });
  await page.close();
  return out;
}

test('الإجابات takes the row when it has no partner, and shares it when it has one', async (t) => {
  const exe = chromePath();
  if (!exe) return t.skip('no chromium on this machine');
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  try {
    const alone = await widths(browser, lesson([ANSWER_RUN]));
    assert.ok(alone.sol, 'no الإجابات card rendered — the test would pass vacuously');
    assert.ok(alone.sol > alone.row * 0.92,
      `الإجابات rendered ${alone.sol}px wide in a ${alone.row}px row with nothing beside it`);
    assert.ok(alone.text.replace(/\s+/g, ' ').trim().length > 60,
      'the الإجابات card rendered with no text in it');

    // …and the approved closing pair is untouched: with an exit ticket present the two
    // still share the row, which is the anatomy the approved pages have.
    const paired = await widths(browser, lesson(['بطاقة الخروج: ما أجمل صفة في والدك؟', ANSWER_RUN]));
    assert.ok(paired.exit, 'the paired fixture produced no بطاقة الخروج');
    assert.ok(paired.sol < paired.row * 0.6 && paired.exit < paired.row * 0.6,
      `the closing pair no longer shares a row: بطاقة الخروج ${paired.exit}px, `
      + `الإجابات ${paired.sol}px, row ${paired.row}px`);
  } finally { await browser.close(); }
});
