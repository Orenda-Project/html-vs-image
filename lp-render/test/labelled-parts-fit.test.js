'use strict';
// NOTHING IN A LABELLED DIAGRAM MAY LEAVE ITS VIEWBOX.
//
// The plant figure shipped with its flower sliced off. The drawing was zoomed by a fixed
// factor (K = 1.35) about a guessed centre inside a fixed 236-tall viewBox, and nothing
// connected the drawing's real extent to the canvas it had to fit in. Making the plant
// nicer made it taller, and the top petal landed at y = -14.2 — outside the viewBox, so
// the browser simply cropped it. No test failed, because no test was measuring.
//
// The fix is arithmetic: the object declares its bounding box, the figure scales it to
// the room between the label chips and takes its height FROM the drawing. This file is
// the other half — it re-measures the real rendered SVG in a browser, so a declared
// bounding box that drifts away from the drawing fails here instead of reaching a
// teacher. A declared box nobody checks is how the first version broke.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const { chromium } = require('playwright-core');
const { renderDecorativeLesson } = require('../decorative/render');

const CHROME = process.env.CHROME_PATH || '/usr/bin/google-chrome';

const guideWith = (parts) => ({
  meta: { id: 'fit', locale: 'ar', region: 'ye' },
  sections: [{
    id: 'stage-arad', heading: 'العرض', type: 'stage', checks: [],
    activities: [{ label: '', body: 'نص', codeFigure: { kind: 'labeled-parts', object: 'plant', parts } }],
  }],
});

// the lesson's own three parts, and a fuller set that pushes the figure harder
const THREE = [{ part: 'root', label: 'الجذور' }, { part: 'stem', label: 'الساق' },
  { part: 'leaf', label: 'الأوراق' }];
const FIVE = THREE.concat([{ part: 'flower', label: 'الأزهار' }, { part: 'fruit', label: 'الثمار' }]);

async function measure(parts) {
  const html = '<html dir="rtl"><head><meta charset="utf-8"><style>'
    + 'body{margin:0;padding:0}.yl-cf{width:520px}svg{width:100%;height:auto}'
    + '</style></head><body>' + renderDecorativeLesson(guideWith(parts), {}).bodyHtml + '</body></html>';
  const browser = await chromium.launch({ executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage({ viewport: { width: 700, height: 900 } });
    await page.setContent(html, { waitUntil: 'networkidle' });
    return await page.evaluate(() => {
      const svg = [...document.querySelectorAll('svg')].find((s) => s.querySelector('line[stroke-dasharray]'));
      if (!svg) return null;
      const [, , vw, vh] = svg.getAttribute('viewBox').split(/\s+/).map(Number);
      const all = svg.getBBox();                       // every mark, in viewBox units
      const g = svg.querySelector('g[transform^="translate"]');
      const gb = g.getBBox();                          // the drawing, in its own units
      const m = g.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\) scale\(([\d.]+)\)/);
      const [tx, ty, k] = [Number(m[1]), Number(m[2]), Number(m[3])];
      return {
        vw, vh,
        content: { x: all.x, y: all.y, right: all.x + all.width, bottom: all.y + all.height },
        drawing: { x: tx + gb.x * k, y: ty + gb.y * k,
          right: tx + (gb.x + gb.width) * k, bottom: ty + (gb.y + gb.height) * k, k },
      };
    });
  } finally {
    await browser.close();
  }
}

test('the whole plant — flower included — is inside the viewBox', async () => {
  const r = await measure(THREE);
  assert.ok(r, 'the labelled-parts figure rendered');
  const d = r.drawing;
  // This is the bug, stated as an assertion. It failed at y = -14.2 before the fix.
  assert.ok(d.y >= 0, `the top of the drawing is cut off: y = ${d.y.toFixed(1)}`);
  assert.ok(d.bottom <= r.vh, `the bottom is cut off: ${d.bottom.toFixed(1)} > ${r.vh}`);
  assert.ok(d.x >= 0 && d.right <= r.vw,
    `the drawing runs off the side: x ${d.x.toFixed(1)}…${d.right.toFixed(1)} in ${r.vw}`);
});

test('every mark — labels and leader lines too — is inside the viewBox', async () => {
  for (const parts of [THREE, FIVE]) {
    const r = await measure(parts);
    const c = r.content;
    assert.ok(c.y >= 0, `${parts.length} parts: content starts above the canvas (${c.y.toFixed(1)})`);
    assert.ok(c.bottom <= r.vh + 0.5,
      `${parts.length} parts: content runs past the bottom (${c.bottom.toFixed(1)} > ${r.vh})`);
    assert.ok(c.x >= 0 && c.right <= r.vw + 0.5,
      `${parts.length} parts: content runs past the side`);
  }
});

test('there is comfortable padding on every side, not a hairline escape', async () => {
  // "Not clipped" and "not touching the edge" are different claims, and the second is the
  // one a reader actually sees. 6px of the figure's own units on each side.
  const MIN = 6;
  const r = await measure(THREE);
  const d = r.drawing;
  assert.ok(d.y >= MIN, `only ${d.y.toFixed(1)}px above the flower`);
  assert.ok(r.vh - d.bottom >= MIN, `only ${(r.vh - d.bottom).toFixed(1)}px below the soil`);
  assert.ok(d.x >= MIN && r.vw - d.right >= MIN, 'the sides are tight');
});

test('the plant stays LARGE — the fix must not have shrunk it', async () => {
  // The first attempt at fitting sized the drawing against the widest a chip could ever
  // be and came out SMALLER than the version that was clipping. The point was a complete
  // plant, not a smaller one.
  const r = await measure(THREE);
  assert.ok(r.drawing.k >= 1.35,
    `the drawing scale fell to ${r.drawing.k} — it was 1.35 when it was clipping`);
  const covers = (r.drawing.bottom - r.drawing.y) / r.vh;
  assert.ok(covers > 0.8, `the plant only fills ${(covers * 100).toFixed(0)}% of the figure height`);
});

test('the figure height follows the drawing rather than cropping it', async () => {
  // Adding parts must not squeeze the plant: the canvas grows with what it holds.
  const a = await measure(THREE);
  const b = await measure(FIVE);
  assert.strictEqual(a.vh, b.vh, 'the same object needs the same height whatever is labelled');
  assert.ok(a.vh > a.drawing.bottom - a.drawing.y, 'the canvas is taller than the drawing it holds');
});
