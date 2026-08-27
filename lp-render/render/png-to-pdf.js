'use strict';
// Pixel-perfect paginated PDF: screenshot the rendered page at 2× (that's the "perfect"
// preview) and slice THAT image into A4 pages, cutting ONLY at section / list-item
// boundaries so nothing is split mid-item, with a "current / total" page-number band.
// Assembly is done by scripts/compose_pdf.py (Python: pillow + img2pdf).
//
// Used by the pipeline as the default deliverable PDF (RULES R30); throws if Chromium
// or the Python composer/libs are unavailable so the caller can fall back to the
// Chromium vector PDF.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright-core');

const SCALE = 2;        // device pixel ratio → crisp text
const CSS_WIDTH = 794;  // A4 width @96dpi (matches the preview screenshot)
const COMPOSER = path.resolve(__dirname, '../../scripts/compose_pdf.py');

function chromePath() {
  for (const c of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(c)) return c;
  try { const p = require('puppeteer').executablePath(); if (p && fs.existsSync(p)) return p; } catch (_) { /* fine */ }
  return undefined;
}

async function htmlToPixelPdf(html, opts = {}) {
  if (!fs.existsSync(COMPOSER)) throw new Error('compose_pdf.py not found');
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'] });
  let shot; let geom;
  try {
    const page = await browser.newPage({ deviceScaleFactor: SCALE });
    await page.setViewportSize({ width: CSS_WIDTH, height: 1123 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await document.fonts.ready; });
    // Page-break candidates: header/section bottoms + gaps between list items (so a long
    // list fills the page and continues overleaf, never cut through an item).
    geom = await page.evaluate(() => {
      const y = (el, edge) => el.getBoundingClientRect()[edge] + window.scrollY;
      const cuts = [];
      const header = document.querySelector('.lp-header');
      if (header) cuts.push(y(header, 'bottom'));
      document.querySelectorAll('.body > .section').forEach((sec) => {
        cuts.push(y(sec, 'bottom'));
        // A card that carries a figure (in-panel illustration or character) must never
        // be cut THROUGH the figure: inner boundaries are legal only BELOW the
        // figure's bottom edge. Cards without figures offer all inner boundaries.
        const fig = sec.querySelector('.d-inline-img, .char-fig');
        // A card holding a CODE-drawn figure is atomic: its figure is followed by a
        // value label and caption, so a cut 'below the figure' would slice the card
        // and orphan that text. Only the card's own bottom is a legal boundary.
        if (sec.querySelector('.d-code-fig, .d-code-board')) return;
        const figBottom = fig ? y(fig, 'bottom') : -Infinity;
        sec.querySelectorAll(
          '.d-bullets > li, .d-steps > .d-step, .d-rubric > .rrow, .d-imgrow, .d-qa, ' +
          '.d-math > .d-mrow, .d-fields, .d-note, .d-text, .d-chips, .d-summary .srow'
        ).forEach((item) => { const b = y(item, 'bottom'); if (b > figBottom + 6) cuts.push(b); });
      });
      const footer = document.querySelector('.lp-footer');
      if (footer) { cuts.push(y(footer, 'top')); cuts.push(y(footer, 'bottom')); }
      // OVERFLOW GUARD: no instructional text may leave its container. Checked here
      // because this is the one place the real laid-out DOM exists, before the PDF is
      // sliced. Each code-drawn card is a <g class="cf-card"> whose first child is its
      // rect, so a label can be measured against the box it belongs to.
      const overflow = [];
      const outside = (inner, outer, pad) => inner.left < outer.left - pad || inner.right > outer.right + pad
        || inner.top < outer.top - pad || inner.bottom > outer.bottom + pad;
      document.querySelectorAll('g.cf-card').forEach((card) => {
        const rect = card.querySelector('rect');
        if (!rect) return;
        const rb = rect.getBoundingClientRect();
        card.querySelectorAll('text').forEach((t) => {
          const tb = t.getBoundingClientRect();
          if (tb.width && outside(tb, rb, 1.5)) {
            overflow.push({ kind: 'text_outside_card', text: (t.textContent || '').trim().slice(0, 28) });
          }
        });
      });
      document.querySelectorAll('svg.cf-svg').forEach((svg) => {
        const sb = svg.getBoundingClientRect();
        svg.querySelectorAll('text').forEach((t) => {
          const tb = t.getBoundingClientRect();
          if (tb.width && outside(tb, sb, 1)) {
            overflow.push({ kind: 'text_outside_figure', text: (t.textContent || '').trim().slice(0, 28) });
          }
        });
      });
      // MATH DIRECTION. In Arabic an expression is written with its first operand on
      // the RIGHT \u2014 \u00ab\u0661\u0666 \u00f7 \u0664 = \u0664\u00bb reads \u0661\u0666, \u00f7, \u0664, =, \u0664 moving leftwards \u2014 so the tokens
      // must step right-to-left while the digits inside one number stay left-to-right.
      // An earlier version of this check asserted the opposite and therefore passed a
      // set the reviewer could see was mirrored. If a run steps the wrong way,
      // something is forcing its direction (see lp-render/math/math.js).
      const MATH_RE = /[\u0660-\u06690-9]+(?:\s*[+\-\u00d7\u00f7*/]\s*[\u0660-\u06690-9]+)*\s*=\s*[\u0660-\u06690-9]+/;
      if ((document.documentElement.getAttribute('dir') || '') === 'rtl') {
        const box = (node, from, len) => {
          const rg = document.createRange();
          rg.setStart(node, from); rg.setEnd(node, from + len);
          const b = rg.getBoundingClientRect();
          return b.width ? { x: (b.left + b.right) / 2, line: Math.round(b.top / 4) } : null;
        };
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        let node;
        while ((node = walker.nextNode())) {
          const s = node.nodeValue || '';
          const m = s.match(MATH_RE);
          if (!m) continue;
          const tokens = m[0].match(/[\u0660-\u06690-9]+|[+\-\u00d7\u00f7*/=]/g) || [];
          // A slash-joined pair like \u00ab\u0662/\u0664\u00bb is a fraction, not a division: the bidi
          // algorithm treats a common separator between two numbers as one numeric
          // unit and lays it out left-to-right. That is correct, and lesson content
          // relies on it (a misconception board deliberately shows \u00ab\u0664/\u0662\u00bb beside
          // \u00ab\u0662/\u0664\u00bb), so it is not this rule's business.
          if (tokens.length < 3 || !/[+\-\u00d7\u00f7=]/.test(m[0])) continue;
          const spans = []; let cursor = s.indexOf(m[0]); let ok = true;
          for (const t of tokens) {
            const i = s.indexOf(t, cursor);
            const b = i < 0 ? null : box(node, i, t.length);
            if (!b) { ok = false; break; }
            spans.push({ t, ...b }); cursor = i + t.length;
          }
          if (!ok) continue;
          // Compare positions only WITHIN a line. A run that wraps mid-expression
          // restarts at the right edge, and comparing across that break reads as a
          // reversal when nothing is wrong.
          let reversed = false;
          for (let k = 1; k < spans.length; k++) {
            if (spans[k].line !== spans[k - 1].line) continue;
            if (spans[k].x > spans[k - 1].x) reversed = true;
          }
          if (reversed) { overflow.push({ kind: 'math_reversed', text: m[0] }); continue; }
          const multi = tokens.find((t) => t.length > 1);
          if (multi) {
            const i = s.indexOf(multi, s.indexOf(m[0]));
            const d1 = box(node, i, 1); const d2 = box(node, i + 1, 1);
            if (d1 && d2 && d1.line === d2.line && d1.x > d2.x) overflow.push({ kind: 'number_mirrored', text: multi });
          }
        }
      }
      // and HTML text spilling out of its panel
      document.querySelectorAll('.panel').forEach((panel) => {
        const pb = panel.getBoundingClientRect();
        panel.querySelectorAll('.cf-label, .cap, .cb-label, .tb-label').forEach((el) => {
          const eb = el.getBoundingClientRect();
          if (eb.width && outside(eb, pb, 2)) {
            overflow.push({ kind: 'caption_outside_card', text: (el.textContent || '').trim().slice(0, 28) });
          }
        });
      });
      return { cuts, overflow, height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth,
        bg: getComputedStyle(document.body).backgroundColor || '#ffffff' };
    });
    shot = await page.screenshot({ fullPage: true });
    // Hand the overflow findings to the caller BEFORE the PDF exists, so a page that
    // clips a label is reported rather than quietly shipped.
    if (typeof opts.onFindings === 'function' && geom && Array.isArray(geom.overflow)) opts.onFindings(geom.overflow);
  } finally { await browser.close(); }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lppdf-'));
  const png = path.join(dir, 'full.png'); const gj = path.join(dir, 'geom.json'); const out = path.join(dir, 'out.pdf');
  fs.writeFileSync(png, shot);
  fs.writeFileSync(gj, JSON.stringify({ scale: SCALE, cssWidth: CSS_WIDTH, ...geom }));
  try {
    execFileSync('python3', [COMPOSER, png, gj, out], { stdio: ['ignore', 'ignore', 'pipe'] });
    return fs.readFileSync(out);
  } catch (e) {
    // Python composer unavailable (no pillow/img2pdf on this machine) — compose the
    // same slices with Chromium instead. Additive fallback: machines with the Python
    // libs keep the exact path above; only its failure reaches here.
    fs.rmSync(dir, { recursive: true, force: true });
    return composeWithChromium(shot, geom, opts);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

// Node/Chromium composer: same contract as compose_pdf.py — slice the 2× screenshot
// into A4 pages cutting only at the supplied boundaries, page number on every page,
// top margin band, pages filled (a long section continues overleaf), no blank tail.
async function composeWithChromium(shotBuf, geom, opts = {}) {
  const PAGE_H = 1123; const TOP = 28; const BOT = opts.pageStyle === 'ar-bottom' ? 36 : 12;
  const usable = PAGE_H - TOP - BOT;
  const height = Math.ceil(geom.height);
  const cuts = [...new Set((geom.cuts || []).map((c) => Math.round(c)))].sort((a, b) => a - b)
    .filter((c) => c > 0 && c <= height + 1);
  const pages = [];
  let start = 0;
  while (start < height - 1) {
    const limit = start + usable;
    const within = cuts.filter((c) => c > start + 40 && c <= limit);
    let end = within.length ? within[within.length - 1] : Math.min(limit, height);
    // Absorb a small trailing remainder so a few px of padding does not earn its own
    // page — but ONLY when the page still fits. The clip is a fixed `usable` box with
    // overflow:hidden, so extending it past that silently CUT the content off (a
    // homework card lost half its instructions this way, while the render still
    // reported two pages, which is also why the fit loop never noticed).
    if (height - end < 48 && height - start <= usable) end = height;
    pages.push([start, Math.min(end, height)]);
    start = end;
  }
  const b64 = shotBuf.toString('base64');
  // Page-number chrome is pack-driven: 'ar-bottom' prints the pilot-style
  // «الصفحة ن من م» at the bottom start edge; default keeps the classic top num.
  const arDigits = (v) => String(v).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);
  const escText = (s) => String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const numFor = (i, n) => opts.pageStyle === 'ar-bottom'
    ? `<div class="band" dir="rtl"><span class="bn">الصفحة ${arDigits(i + 1)} من ${arDigits(n)}</span><span class="bc">${escText(opts.footerText)}</span></div>`
    : `<div class="num">${i + 1} / ${n}</div>`;
  const divs = pages.map(([s, e], i) =>
    `<div class="pg">${numFor(i, pages.length)}`
    + `<div class="clip" style="height:${e - s}px"><img src="data:image/png;base64,${b64}" style="top:${-s}px"></div></div>`).join('');
  const html = `<!doctype html><html><head><style>
  @page{size:794px 1123px;margin:0}
  html,body{margin:0;padding:0}
  .pg{width:794px;height:${PAGE_H - 2}px;box-sizing:border-box;position:relative;overflow:hidden;page-break-after:always;background:${geom.bg || '#fff'}}
  .pg:last-child{page-break-after:auto}
  .num{position:absolute;top:9px;inset-inline-end:16px;font:700 11px system-ui,sans-serif;color:#8a8f98;z-index:2}
  .band{position:absolute;left:22px;right:22px;bottom:9px;border-top:2px solid #182448;padding-top:5px;text-align:center;z-index:2;
    font:700 11.5px 'Noto Naskh Arabic',system-ui,sans-serif;color:#182448}
  .band .bn{position:absolute;left:0;top:5px}
  .clip{position:relative;overflow:hidden;margin-top:${TOP}px;width:794px}
  .clip img{position:absolute;left:0;width:794px}
  </style></head><body>${divs}</body></html>`;
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await page.pdf({ width: '794px', height: `${PAGE_H}px`, margin: { top: 0, bottom: 0, left: 0, right: 0 }, printBackground: true });
  } finally { await browser.close(); }
}

module.exports = { htmlToPixelPdf };
