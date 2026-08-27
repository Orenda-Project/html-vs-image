'use strict';
// RENDERING RULE: an arithmetic expression inside Arabic prose flows right-to-left
// at the token level, exactly like the prose around it.
//
// Arabic writes «١٦ ÷ ٤ = ٤» with the first operand on the RIGHT. Reading
// right-to-left the eye meets ١٦, then ÷, then ٤, then =, then ٤. The default bidi
// algorithm already produces this: the digits inside one number are strong
// Arabic-Number characters and stay left-to-right, while the operators between
// numbers are NEUTRAL and take the paragraph's direction, so the tokens flow
// right-to-left. The approved Yemen design set confirms the convention — its own
// caption reads «١٠ ورقات فئة ١٠٠ ريال = ١٠٠٠ ريال», left-hand side on the right and
// the result on the left.
//
// This test exists because we got it backwards. The renderer used to wrap every run
// in `<bdi class="ltr-math" dir="ltr">` with `unicode-bidi:isolate-override`, which
// forces the tokens the other way and renders «٤ = ٤ ÷ ١٦» to an Arabic reader. A
// reviewer reported the expression as reversed three times; each "fix" was another
// variation on the cause. So the rule now has a test that would have caught it, and
// the test states which direction is correct rather than assuming.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const { THEME_CSS } = require('../decorative/theme');
const { THEME_OVERRIDE_CSS } = require('../decorative/regions/ye/theme');
const { richText } = require('../math/math');
const { cfText } = require('../decorative/render');

function chromePath() {
  for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

// Every place an expression can appear in a guide: prose, an answer key, check text,
// an unspaced run, and Latin digits inside Arabic.
const CASES = [
  ['prose', 'يكتب التلميذ ١٦ ÷ ٤ = ٤ في دفتره.', ['١٦', '÷', '٤', '=', '٤']],
  ['answer-key', 'الحل: ١٠ ÷ ٢ = ٥.', ['١٠', '÷', '٢', '=', '٥']],
  ['check', 'تحقق: ٦ + ٨ = ١٤ صحيح.', ['٦', '+', '٨', '=', '١٤']],
  ['no-spaces', 'اكتب ١٥÷٥=٣ بخط واضح.', ['١٥', '÷', '٥', '=', '٣']],
  ['latin-digits', 'اكتب 12 ÷ 2 = 6 هنا.', ['12', '÷', '2', '=', '6']],
];

function fixture() {
  const rows = CASES.map(([id, text]) => `<p id="c-${id}" class="d-text">${richText(text)}</p>`).join('');
  const svg = `<svg class="cf-svg" viewBox="0 0 320 60" width="320" height="60">`
    + cfText(160, 34, '٢٠ ÷ ٥ = ٤', 16).replace('<text ', '<text id="c-svg" ') + `</svg>`;
  // The control is the old behaviour: the same run forced left-to-right. The test
  // must be able to tell the two apart, or its verdicts mean nothing.
  const forced = `<p id="ctl-forced" class="d-text">يكتب التلميذ `
    + `<bdi style="direction:ltr;unicode-bidi:isolate-override">١٦ ÷ ٤ = ٤</bdi> في دفتره.</p>`;
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8">`
    + `<style>${THEME_CSS}</style><style>${THEME_OVERRIDE_CSS}</style>`
    + `<style>body{width:794px;font-size:17px}</style></head><body>`
    + `<div class="section"><div class="panel">${rows}${svg}${forced}</div></div></body></html>`;
}

// Measure where each token of a run actually sits. Returns the x-centre of every
// occurrence of every token, in the order the tokens were given.
function tokenCentres(sel, tokens) {
  const el = document.querySelector(sel);
  const nodes = []; let flat = '';
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let n; while ((n = w.nextNode())) { nodes.push({ n, start: flat.length }); flat += n.nodeValue || ''; }
  // Position AND which line it landed on: a run that wraps mid-expression restarts
  // at the right edge, and comparing x across that break looks like a reversal.
  const centre = (from, len) => {
    const rec = nodes.filter((z) => z.start <= from).pop();
    const rg = document.createRange();
    rg.setStart(rec.n, from - rec.start); rg.setEnd(rec.n, from - rec.start + len);
    const b = rg.getBoundingClientRect();
    return b.width ? { x: (b.left + b.right) / 2, line: Math.round(b.top / 4) } : null;
  };
  const out = []; let cursor = 0;
  for (const t of tokens) {
    const i = flat.indexOf(t, cursor);
    if (i < 0) return { error: `token «${t}» not found after ${cursor} in «${flat}»` };
    out.push({ token: t, ...centre(i, t.length) });
    cursor = i + t.length;
  }
  // also: the digits of the first multi-digit number must not be mirrored
  const multi = tokens.find((t) => t.length > 1);
  let digits = null;
  if (multi) {
    const i = flat.indexOf(multi);
    digits = [centre(i, 1), centre(i + 1, 1)];  // same line by construction here
  }
  return { centres: out, digits };
}

test('arithmetic inside Arabic prose flows right-to-left, like the prose', async (t) => {
  const exe = chromePath();
  if (!exe) return t.skip('no chromium available');
  const { chromium } = require('playwright-core');
  const browser = await chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.setContent(fixture());
    await page.evaluate(async () => { await document.fonts.ready; });
    const measure = (sel, tokens) => page.evaluate(
      ([s, tk, src]) => new Function('return ' + src)()(s, tk),
      [sel, tokens, tokenCentres.toString()],
    );

    // Negative control FIRST: the old forced-LTR markup must measure as
    // left-to-right. If it does not, this browser cannot show the difference and
    // every assertion below would pass vacuously.
    const ctl = await measure('#ctl-forced', ['١٦', '÷', '٤', '=', '٤']);
    assert.ok(!ctl.error, ctl.error);
    const ctlXs = ctl.centres.map((c) => c.x);
    assert.ok(ctlXs.every((x, i) => i === 0 || x > ctlXs[i - 1]),
      `forced-LTR control should run left-to-right, measured ${JSON.stringify(ctlXs)}`);

    for (const [id, , tokens] of CASES) {
      const r = await measure(`#c-${id}`, tokens);
      assert.ok(!r.error, `${id}: ${r.error}`);
      const steps = r.centres.filter((c, i) => i === 0 || c.line === r.centres[i - 1].line);
      assert.ok(r.centres.every((c, i) => i === 0 || c.line !== r.centres[i - 1].line || c.x < r.centres[i - 1].x),
        `${id}: tokens ${JSON.stringify(tokens)} should step right-to-left within a line, measured `
        + JSON.stringify(r.centres.map((c) => [Math.round(c.x), c.line])));
      assert.ok(steps.length >= 2, `${id}: nothing comparable measured`);
      if (r.digits) {
        assert.ok(r.digits[0].x < r.digits[1].x,
          `${id}: the digits of a single number must stay left-to-right, measured ${JSON.stringify(r.digits)}`);
      }
    }

    const svg = await measure('#c-svg', ['٢٠', '÷', '٥', '=', '٤']);
    assert.ok(!svg.error, svg.error);
    const svgXs = svg.centres.map((c) => c.x);
    assert.ok(svgXs.every((x, i) => i === 0 || x < svgXs[i - 1]),
      `an SVG figure label should read right-to-left too, measured ${JSON.stringify(svgXs)}`);
  } finally {
    await browser.close();
  }
});

test('no direction override is emitted around maths', () => {
  // The markup guard for the regression: nothing may force an expression's
  // direction — not a class, not dir="ltr", not a Unicode isolate.
  for (const [, text] of CASES) {
    const html = richText(text);
    assert.ok(!/ltr-math/.test(html), `ltr-math container returned for: ${text}`);
    assert.ok(!/dir="ltr"/.test(html), `dir="ltr" returned for: ${text}`);
    assert.ok(!/unicode-bidi/.test(html), `unicode-bidi returned for: ${text}`);
    assert.ok(!/[⁦⁧⁨⁩]/.test(html), `Unicode isolate returned for: ${text}`);
  }
});

test('SVG labels keep the page direction, maths included', () => {
  const mathy = cfText(10, 10, '١٦ ÷ ٤ = ٤');
  assert.match(mathy, /direction="rtl"/);
  assert.ok(!/unicode-bidi/.test(mathy), 'no bidi override on a figure label');
  assert.match(cfText(10, 10, 'الساق'), /direction="rtl"/);
});

test('the Yemen pack declares no direction rule for maths', () => {
  // Comments discuss the override on purpose (that history is worth keeping), so
  // assert on the actual declarations.
  const css = THEME_OVERRIDE_CSS.replace(/\/\*[\s\S]*?\*\//g, '');
  assert.ok(!/\.ltr-math\s*\{/.test(css), '.ltr-math rule is back in the pack');
  assert.ok(!/isolate-override/.test(css), 'isolate-override is back in the pack');
});
