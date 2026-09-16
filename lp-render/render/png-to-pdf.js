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
      // …and, separately, only those boundaries that end a WHOLE card. Both kinds are legal
      // to cut at — a grid-row gap crosses no content — but a row gap still leaves the
      // card's own border open across the page break, so anything choosing between cuts for
      // appearance rather than necessity should prefer these.
      const safe = [];
      const header = document.querySelector('.lp-header');
      if (header) { cuts.push(y(header, 'bottom')); safe.push(y(header, 'bottom')); }
      document.querySelectorAll('.body > .section').forEach((sec) => {
        cuts.push(y(sec, 'bottom'));
        safe.push(y(sec, 'bottom'));
        // A ROW OF EXERCISES MAY BREAK; NOTHING ELSE INSIDE A CARD MAY. The gap between two
        // grid rows is the one place a cut cannot cross anything: cells that share a row
        // share a top edge, so the boundary is the lowest of their bottoms and the cut lands
        // in the gutter. Every OTHER inner boundary is gone — with .yl-act, .yl-sbody and
        // .yl-check as candidates, a page ended in the middle of the cube-and-cone figure.
        // A CARD TALLER THAN A PAGE STILL BREAKS BETWEEN WHOLE ACTIVITIES. The division
        // lesson's assessment is 1108px against a 1059px page and lays its activities out as
        // full-width blocks rather than a grid, so it offered no candidate at all and the
        // composer fell back to cutting at the raw page limit — straight through an exercise.
        // The boundary BETWEEN two activities crosses nothing, exactly like the gap between
        // two grid rows. Only the gaps between them, never a boundary inside one: that
        // distinction is why a component-level candidate list was reverted once before, when
        // a page ended in the middle of a figure.
        // EVERY ROW OF THE INNER CARD IS A BOUNDARY. The assessment redesign made
        // .yl-scard itself a two-column grid, and its children are a MIX — question cards,
        // plain activities, spanning group headings. Grouping only one of those kinds left
        // the fractions lesson's 2611px assessment with no usable candidate and 31 boxes
        // crossing a hard cut. Grouping by the top edge of every child is the general form
        // of the rule already used for the activity grid: items that share a top share a
        // row, so the row's lowest bottom is a boundary that crosses nothing.
        sec.querySelectorAll('.yl-scard').forEach((card) => {
          const kids = [...card.children].filter((el) => el.nodeType === 1);
          if (kids.length < 2) return;
          const byTop = new Map();
          kids.forEach((c) => {
            const r = c.getBoundingClientRect();
            if (!r.height) return;
            const t = Math.round(y(c, 'top'));
            byTop.set(t, Math.max(byTop.get(t) || 0, y(c, 'bottom')));
          });
          [...byTop.entries()].sort((a, b) => a[0] - b[0]).slice(0, -1)
            .forEach(([, bottom]) => cuts.push(bottom));
        });
        const wholeActs = [...sec.querySelectorAll(':scope > .yl-scard > .yl-act')];
        wholeActs.slice(0, -1).forEach((el) => cuts.push(y(el, 'bottom')));
        sec.querySelectorAll('.yl-actgrid').forEach((grid) => {
          // EVERY CHILD, not only the cells. A spanning group heading sits in this grid too,
          // and grouping by the cells alone produced a "row bottom" that fell inside the
          // heading that follows it — the division lesson had an exercise cut in half by it.
          const cells = [...grid.querySelectorAll(':scope > .yl-act, :scope > .yl-ahead, :scope > .yl-qcard')];
          if (cells.length < 3) return;            // a 2-up row has no row to break between
          const byRow = new Map();
          cells.forEach((a) => {
            const top = Math.round(a.getBoundingClientRect().top);
            byRow.set(top, Math.max(byRow.get(top) || 0, y(a, 'bottom')));
          });
          const rows = [...byRow.entries()].sort((x, z) => x[0] - z[0]);
          // not the LAST row: that boundary is inside the card, above its asides and its
          // checkpoint strip, and cutting there orphans them from their own activities.
          rows.slice(0, -1).forEach(([, b]) => cuts.push(b));
        });
        // A CARD IS NEVER CUT ANYWHERE ELSE. Component boundaries used to be candidates here,
        // so a stage could continue onto the next page — it lifted page fill from 62% to
        // ~95%. But it also let a page end in the MIDDLE of an activity: the cube-and-cone
        // figure and its ✓/✗ boxes were sliced by the footer rule. The reviewer's rule is
        // explicit and it wins: if a row or section does not fit, the whole thing moves to
        // the next page. Only a section's own bottom is a legal boundary.
        // A card that carries a figure (in-panel illustration or character) must never
        // be cut THROUGH the figure: inner boundaries are legal only BELOW the
        // figure's bottom edge. Cards without figures offer all inner boundaries.
        // ── A TALL SECTION MAY CONTINUE OVERLEAF ──────────────────────────────────────
        //
        // Reported: a page left ~35% blank while the whole العرض section moved to the next
        // one. Cause: in this pack a stage is ONE .yl-scard holding ONE .yl-act, so every
        // rule above needs two of something and finds one. The section then offers only its
        // own bottom, and a 507px block that will not fit simply leaves.
        //
        // Component boundaries WERE candidates here once and were reverted, for a good
        // reason recorded above: a page ended in the middle of a figure. So the rule is not
        // "offer inner boundaries" — it is "offer any horizontal line that provably crosses
        // nothing". That is decided by geometry, not by a selector whitelist of where we
        // hope it is safe:
        //
        //   · gather candidate lines — block bottoms, and the bottom of each LINE BOX in
        //     prose, so a long paragraph can continue rather than move whole;
        //   · reject any line that passes through an ATOMIC box — a figure, an image, a
        //     chip, a badge, a callout row, a checkpoint strip, an answer strip. These are
        //     things that would be sliced in half, which is the defect that caused the
        //     revert;
        //   · reject any line that would leave a heading stranded at the foot of a page
        //     with none of its own content under it.
        //
        // These go in `cuts`, never in `safe`, so the composer still PREFERS whole cards and
        // reaches for an inner line only when that is the difference between using the page
        // and wasting it.
        const ATOMIC = 'svg, img, canvas, figure, .yl-cf, .yl-illus, .yl-tvis, .yl-check,'
          + ' .yl-srow, .yl-pill, .yl-tab, .yl-alabel, .yl-answer, .yl-badge, .yl-ntab,'
          + ' .yl-qcard, .d-inline-img, .d-code-fig, .d-code-board, .cf-card';
        const boxes = [...sec.querySelectorAll(ATOMIC)]
          .map((el) => [y(el, 'top'), y(el, 'bottom')])
          .filter(([t, b]) => b - t > 1);
        // a heading must keep the first real thing under it
        const orphan = [];
        sec.querySelectorAll('.yl-shead').forEach((head) => {
          let next = head.nextElementSibling;
          while (next && !next.getBoundingClientRect().height) next = next.nextElementSibling;
          if (!next) return;
          const first = next.querySelector('.yl-act, .yl-ttext, p') || next;
          orphan.push([y(head, 'top'), y(first, 'bottom')]);
        });
        const illegal = (v) => boxes.some(([t, b]) => v > t + 0.5 && v < b - 0.5)
          || orphan.some(([t, b]) => v > t - 0.5 && v < b - 0.5);
        const inner = [];
        sec.querySelectorAll('.yl-scard, .yl-srows, .yl-act, .yl-sbody, .yl-ttext, .yl-lead')
          .forEach((el) => inner.push(y(el, 'bottom')));
        // line boxes inside prose: the only place a long paragraph can legally break
        sec.querySelectorAll('.yl-ttext p, .yl-lead, .yl-ttext').forEach((block) => {
          const range = document.createRange();
          for (const node of block.childNodes) {
            if (node.nodeType !== 3 || !node.textContent.trim()) continue;
            range.selectNodeContents(node);
            for (const r of range.getClientRects()) {
              if (r.height > 1) inner.push(r.bottom + window.scrollY);
            }
          }
        });
        inner.forEach((v) => { if (!illegal(v)) cuts.push(v); });

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
      if (footer) {
        cuts.push(y(footer, 'top')); cuts.push(y(footer, 'bottom'));
        safe.push(y(footer, 'top')); safe.push(y(footer, 'bottom'));
      }
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
      return { cuts, safe, overflow, height: document.documentElement.scrollHeight, width: document.documentElement.scrollWidth,
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
/**
 * Share the slack out across N pages instead of leaving it wherever a tall card fell.
 *
 * Partition [0, height] into exactly `n` pages whose boundaries are existing cut points,
 * every page within `usable`, maximising the SHORTEST page — which is the same as
 * minimising the biggest blank area, the thing a reader actually notices.
 *
 * Whole-card boundaries are tried on their own first. Only if no N-page partition exists
 * using card boundaries alone does it fall back to the full cut list (row gaps), because a
 * split card is a worse defect than an uneven page and this must not trade one for the
 * other. Returns null when nothing better is available, leaving the greedy result alone.
 *
 * Exact rather than heuristic: the cut list is a few dozen entries and n is single digits,
 * so the dynamic programme below is far cheaper than the screenshot it is dividing.
 */
function balancePages(greedyN, height, usable, safeCuts, allCuts) {
  if (greedyN < 2) return null;

  const attempt = (candidates, n) => {
    // boundaries we may choose between, plus the two fixed ends
    const pts = [0, ...candidates.filter((c) => c > 0 && c < height), height]
      .filter((v, i, a) => a.indexOf(v) === i).sort((x, y) => x - y);
    const P = pts.length;
    if (P < n + 1) return null;
    const NEG = -1;
    // best[i][k] = the largest achievable "shortest page" when splitting pts[i]..height
    // into k pages. NEG means impossible.
    const best = Array.from({ length: P }, () => new Array(n + 1).fill(NEG));
    const pick = Array.from({ length: P }, () => new Array(n + 1).fill(-1));
    for (let i = 0; i < P; i++) {
      const last = height - pts[i];
      best[i][1] = (last > 0 && last <= usable) ? last : NEG;
    }
    for (let k = 2; k <= n; k++) {
      for (let i = P - 1; i >= 0; i--) {
        for (let j = i + 1; j < P; j++) {
          const page = pts[j] - pts[i];
          if (page <= 0) continue;
          if (page > usable) break;              // pts is sorted: no longer j will fit
          const rest = best[j][k - 1];
          if (rest === NEG) continue;
          const worst = Math.min(page, rest);
          if (worst > best[i][k]) { best[i][k] = worst; pick[i][k] = j; }
        }
      }
    }
    if (best[0][n] === NEG) return null;
    const out = [];
    let i = 0;
    for (let k = n; k >= 1; k--) {
      const j = k === 1 ? P - 1 : pick[i][k];
      out.push([pts[i], pts[j]]);
      i = j;
    }
    return out;
  };

  // FEWER PAGES IS THE ONLY THING THAT ACTUALLY REMOVES BLANK SPACE.
  //
  // For a fixed page count the total blank is fixed too — N × usable − height — so
  // rebalancing can only move it around, never reduce it. The reported defect was blank
  // space, and the fractions lesson showed why: 2,488px of content spread over FOUR pages
  // when three hold 3,177px. The greedy loop had opened a page it did not need, because a
  // tall card would not fit and greedy has no way to reconsider an earlier boundary.
  //
  // So try the honest minimum first and walk up only as far as greedy already went. This
  // does not FORCE a page count — nothing is compressed, dropped or shrunk to hit a target,
  // and if the content genuinely needs the pages it keeps them. It just refuses to spend a
  // sheet the content did not ask for.
  const floor = Math.max(2, Math.ceil(height / usable));
  // How short the shortest page is, which is what "blank at the bottom" means.
  const shortest = (p) => Math.min(...p.map(([a, b]) => b - a));
  // A card boundary is preferred, but not at any price. `safe || all` returned the moment
  // whole cards could make N pages, so a strictly better partition using an inner line was
  // never even compared: the directions lesson could have ended page 2 at 68% and stopped
  // at 54%, because a card-only split existed and won by default. Both are computed now,
  // and the inner one is taken only when it is meaningfully better — a tenth of a page,
  // expressed as a fraction of the printable height rather than a pixel count, so it holds
  // at any page size. Below that the card boundary keeps it, because opening a card's
  // border across the break for a sliver of space is the worse trade.
  const WORTH_SPLITTING = usable * 0.1;
  for (let n = floor; n <= greedyN; n++) {
    const bySafe = attempt(safeCuts, n);
    const byAll = attempt(allCuts, n);
    if (!bySafe && !byAll) continue;
    if (!bySafe) return byAll;
    if (!byAll) return bySafe;
    return shortest(byAll) - shortest(bySafe) > WORTH_SPLITTING ? byAll : bySafe;
  }
  return null;
}

async function composeWithChromium(shotBuf, geom, opts = {}) {
  const PAGE_H = 1123; const TOP = 28; const BOT = opts.pageStyle === 'ar-bottom' ? 36 : 12;
  const usable = PAGE_H - TOP - BOT;
  const height = Math.ceil(geom.height);
  const cuts = [...new Set((geom.cuts || []).map((c) => Math.round(c)))].sort((a, b) => a - b)
    .filter((c) => c > 0 && c <= height + 1);
  const safeCuts = [...new Set((geom.safe || geom.cuts || []).map((c) => Math.round(c)))]
    .sort((a, b) => a - b).filter((c) => c > 0 && c <= height + 1);
  const pages = [];
  let start = 0;
  while (start < height - 1) {
    const limit = start + usable;
    // A WHOLE-CARD BOUNDARY WINS WHENEVER ONE FITS. Taking the last legal cut fills the page
    // as far as possible, and a grid-row gap is legal — but choosing one when a card boundary
    // was available splits a card that would have fitted whole on the next page. Measured:
    // the fractions lesson's assessment is 879px and a page holds 1059, so it had no need to
    // be cut at all, yet the composer opened it to gain 300px on the page before. The rule
    // the reviewer set is that a card is never split and whole rows move instead — so a row
    // gap is now the FALLBACK, used only when no card boundary fits, which is the case a card
    // taller than a page genuinely needs.
    const within = cuts.filter((c) => c > start + 40 && c <= limit);
    const withinSafe = safeCuts.filter((c) => c > start + 40 && c <= limit);
    let end = withinSafe.length ? withinSafe[withinSafe.length - 1]
      : (within.length ? within[within.length - 1] : Math.min(limit, height));
    // Absorb a small trailing remainder so a few px of padding does not earn its own
    // page — but ONLY when the page still fits. The clip is a fixed `usable` box with
    // overflow:hidden, so extending it past that silently CUT the content off (a
    // homework card lost half its instructions this way, while the render still
    // reported two pages, which is also why the fit loop never noticed).
    if (height - end < 48 && height - start <= usable) end = height;
    pages.push([start, Math.min(end, height)]);
    start = end;
  }
  // ── BALANCE EVERY PAGE, NOT JUST THE LAST TWO ────────────────────────────────────────
  //
  // The loop above is greedy: each page takes the last cut that fits, which fills THAT page
  // as far as it can. Greedy is optimal per page and poor across a document — when a tall
  // card will not fit, the page simply ends, and the slack all lands wherever the awkward
  // card happens to fall. Measured on the six live lessons: 3,798px of blank across 14
  // pages, and the fractions lesson came out 67% / 41% / 75% / 52% — a half-empty page in
  // the MIDDLE, which the old rule never looked at because it only ever rebalanced the tail.
  //
  // So: keep the page COUNT greedy found (that is the minimum, and the reviewer's rule is
  // that page count follows the content), then re-choose the boundaries so the slack is
  // shared out. Formally — partition the strip into exactly N pages, at existing cut
  // points, maximising the SHORTEST page. Maximising the shortest page is the same thing as
  // minimising the largest blank area, which is the defect being reported.
  //
  // Only cut points the composer already trusts are used, so this cannot introduce a split
  // card: whole-card boundaries are tried first and a row gap is the fallback, exactly as
  // above. And every page still has to fit inside `usable` — the clip is a fixed box with
  // overflow:hidden, so a page longer than that silently loses content.
  const balanced = balancePages(pages.length, height, usable, safeCuts, cuts);
  if (balanced) pages.splice(0, pages.length, ...balanced);
  if (process.env.LP_DEBUG_PAGES === '1') {
    console.log('[pages] height=' + height + ' usable=' + usable
      + ' safe=' + JSON.stringify(safeCuts) + ' cuts=' + JSON.stringify(cuts.slice(0, 60))
      + ' -> ' + JSON.stringify(pages));
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
