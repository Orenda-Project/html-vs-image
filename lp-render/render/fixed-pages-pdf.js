'use strict';
// Fixed portrait pages, printed by the browser — NIETE's approved lesson-plan page format.
//
// The ICT pack lays each stage of a lesson out on its own portrait page (lp-render/decorative/
// regions/ict/pages.js). This paginates that page in the browser — fitting each page, continuing a
// stage that is too long — and prints it straight from the browser (vector, selectable text). The
// paginated page is handed back too, so the .html a teacher opens is the same pages as the PDF.
//
// Only a region pack that declares PAGE_LAYOUT.fixedPages reaches this file (the ICT pack, today).
// Every other region's PDF is composed by png-to-pdf.js exactly as before.
const fs = require('node:fs');
const { chromium } = require('playwright-core');

function chromePath() {
  for (const c of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(c)) return c;
  try { const p = require('puppeteer').executablePath(); if (p && fs.existsSync(p)) return p; } catch (_) { /* fine */ }
  return undefined;
}

// ── FIXED PAGES ─────────────────────────────────────────────────────────────────────────────
// NIETE's approved design prints every stage on a fixed portrait page (896×1200 here — the
// references' own 1792×2400 at 2×), and those pages are FULL. So each page is fitted, in order:
//   1. a page a little too long is set a little smaller (down to 0.91×, or 0.85× when it is at
//      most 18% over) before anything moves;
//   2. otherwise the stage continues on a page of its own headed "<stage> — continued": whole
//      rows move first (a heading row, .keep-next, goes with the row it heads); a row that may
//      divide ([data-split]) gives up its [data-units] one at a time into a copy of itself (its
//      [data-first-only] column stays behind);
//   3. every page is then set as large as it will go (up to 1.22×), and its main row (.stretch)
//      takes what is left, so it fills as the approved pages do.
// The scale is CSS zoom on the page body with its width compensated, so the page width never
// changes. Only a single block taller than a whole page makes its page grow; that page prints at
// its own height, so nothing is ever clipped.
//
// Runs in the page. Returns the page heights (for the PDF), each page's scale and what the probe found.
const PACK_PAGES = ({ W, H, padBottom = 20, minK = 0.91, maxK = 1.22 }) => {
  document.documentElement.classList.add('lp-print');
  const overflow = [];
  const docW = document.documentElement.scrollWidth;
  if (docW > W + 1) overflow.push({ kind: 'page_wider_than_format', text: `${docW}px > ${W}px` });
  const bodyOf = (pg) => pg.querySelector(':scope > .pg-body');
  const limitOf = (pg) => pg.getBoundingClientRect().top + H - padBottom;      // zoom-proof: the paper, not the box
  const bottomOf = (el) => el.getBoundingClientRect().bottom;
  const rowsOf = (pg) => [...bodyOf(pg).children];
  const fits = (pg) => rowsOf(pg).every((r) => bottomOf(r) <= limitOf(pg) + 0.5);
  const setK = (pg, k) => { const b = bodyOf(pg); b.style.zoom = String(k); b.style.width = `${(W / k).toFixed(2)}px`; pg.dataset.k = String(k); };
  const kOf = (pg) => Number(pg.dataset.k || 1);
  const contOf = (pg) => {
    const next = pg.nextElementSibling;
    if (next && next.dataset.contOf === pg.dataset.pid) return next;
    const c = document.createElement('section');
    c.className = pg.className.replace(/\bgrow\b/, '').trim();
    c.dataset.stage = pg.dataset.stage; c.dataset.pid = `${pg.dataset.pid}c`; c.dataset.contOf = pg.dataset.pid;
    const band = pg.querySelector(':scope > .band');
    let head;
    if (band && band.classList.contains('hero')) {
      head = document.createElement('header'); head.className = 'band cont';
      const h1 = band.querySelector('h1'); const pill = band.querySelector('.pill'); const mark = band.querySelector('.mark');
      head.innerHTML = `<span class="pill">${pill ? pill.innerHTML : ''}</span><h2></h2>`;
      head.querySelector('h2').textContent = h1 ? h1.textContent : '';
      if (mark) head.appendChild(mark.cloneNode(true));
    } else if (band) { head = band.cloneNode(true); head.classList.add('cont'); }
    if (head) c.appendChild(head);
    const b = document.createElement('div'); b.className = 'pg-body'; c.appendChild(b);
    pg.after(c);
    return c;
  };
  const moveTo = (cont, rows) => { for (const r of [...rows].reverse()) bodyOf(cont).prepend(r); };
  const splitCopy = (row, cont) => {
    const copy = row.cloneNode(true);
    copy.querySelectorAll('[data-first-only]').forEach((x) => x.remove());
    copy.querySelectorAll('[data-units]').forEach((x) => x.remove());
    copy.classList.add('cont-row', 'one');
    bodyOf(cont).prepend(copy);
    return copy;
  };
  // a stage only a little too long (up to 18% over) may be set down to 0.85× rather than leave a
  // near-empty "continued" page; a longer one keeps its size and continues
  const overBy = (pg) => { const rs = rowsOf(pg); const top = bodyOf(pg).getBoundingClientRect().top; return rs.length ? (bottomOf(rs[rs.length - 1]) - top) / (limitOf(pg) - top) : 0; };
  const shrinkToFit = (pg) => {
    const floor = overBy(pg) <= 1.18 ? 0.85 : minK;
    for (const k of [0.97, 0.94, 0.91, 0.88, 0.85].filter((x) => x >= floor)) { setK(pg, k); if (fits(pg)) return true; }
    setK(pg, 1);
    return false;
  };
  [...document.querySelectorAll('.pg')].forEach((pg, i) => { pg.dataset.pid = `p${i}`; setK(pg, 1); });
  let i = 0;
  while (i < document.querySelectorAll('.pg').length && i < 400) {
    const pg = document.querySelectorAll('.pg')[i];
    if (!fits(pg) && !shrinkToFit(pg)) {
      const rows = rowsOf(pg);
      const limit = limitOf(pg);
      let k = rows.findIndex((r) => bottomOf(r) > limit + 0.5);    // the first row past the page
      const breaking = rows[k];
      let moved = false;
      // a row that may divide gives up its units, last first, until it fits (keeping at least one)
      if (breaking && breaking.hasAttribute('data-split')) {
        const units = [...breaking.querySelectorAll('[data-units]')];
        if (units.length > 1 && units[0].getBoundingClientRect().bottom <= limit) {
          const cont = contOf(pg);
          moveTo(cont, rows.slice(k + 1));
          const host = units[0].parentElement;                     // the units share one container
          host.setAttribute('data-unit-host', '');
          const copy = splitCopy(breaking, cont);
          const twin = copy.querySelector('[data-unit-host]') || copy;
          host.removeAttribute('data-unit-host'); twin.removeAttribute('data-unit-host');
          for (const u of units.slice(1).reverse()) {
            if (bottomOf(breaking) <= limit + 0.5) break;
            twin.prepend(u);
          }
          moved = true;
        }
      }
      if (!moved) {
        while (k > 1 && rows[k - 1].classList.contains('keep-next')) k -= 1;   // a heading goes with what it heads
        if (k > 0) moveTo(contOf(pg), rows.slice(k));
        else if (rows.length > 1) { moveTo(contOf(pg), rows.slice(1)); if (!fits(pg)) pg.classList.add('grow'); }
        else pg.classList.add('grow');   // one block taller than a page: the page takes its height
      }
      if (!fits(pg) && !pg.classList.contains('grow')) continue;   // try this page again
    }
    i += 1;
  }
  // fill: every page as large as it will go, as the approved pages are full
  document.querySelectorAll('.pg:not(.grow)').forEach((pg) => {
    let lo = kOf(pg); let hi = maxK;
    if (lo >= hi) return;
    setK(pg, hi);
    if (fits(pg)) return;
    for (let n = 0; n < 7; n++) { const mid = (lo + hi) / 2; setK(pg, mid); if (fits(pg)) lo = mid; else hi = mid; }
    setK(pg, +lo.toFixed(3));
  });
  // a picture in the room a card has left: shown only where the room is there
  document.querySelectorAll('[data-art-slot]').forEach((slot) => {
    const card = slot.parentElement;
    const kids = [...card.children].filter((c) => c !== slot);
    const last = kids.length ? kids[kids.length - 1].getBoundingClientRect().bottom : card.getBoundingClientRect().top;
    const free = card.getBoundingClientRect().bottom - last - 22;
    if (free >= 120) { slot.classList.add('on'); slot.style.height = `${Math.min(free, 170)}px`; }
  });
  // nothing may leave its page sideways
  document.querySelectorAll('.pg').forEach((pg) => {
    const pb = pg.getBoundingClientRect();
    pg.querySelectorAll('.card, img, svg, .katex, table').forEach((el) => {
      const eb = el.getBoundingClientRect();
      if (eb.width && (eb.right > pb.right + 1 || eb.left < pb.left - 1)) overflow.push({ kind: 'content_outside_page', text: (el.textContent || el.tagName).trim().slice(0, 28) });
    });
  });
  const pages = [...document.querySelectorAll('.pg')];
  const heights = pages.map((pg) => (pg.classList.contains('grow') ? Math.ceil(pg.getBoundingClientRect().height) + 1 : H));
  const st = document.createElement('style');
  st.id = 'lp-fixed-pages';
  st.textContent = `@page{size:${W}px ${H}px;margin:0}html,body{margin:0;padding:0}.pg{break-after:page}.pg:last-child{break-after:auto}`
    + pages.map((pg, k) => (pg.classList.contains('grow') ? `@page g${k}{size:${W}px ${heights[k]}px;margin:0}.pg[data-pid="${pg.dataset.pid}"]{page:g${k}}` : '')).join('');
  document.head.appendChild(st);
  return { heights, overflow, scales: pages.map(kOf), stages: pages.map((pg) => pg.dataset.stage + (pg.dataset.contOf ? '+' : '')) };
};

async function htmlToFixedPagesPdf(html, opts = {}) {
  const W = Number(opts.pageWidth) || 896;
  const H = Number(opts.pageHeight) || 1200;
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'] });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: W, height: H });
    await page.emulateMedia({ media: 'screen' });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await document.fonts.ready; });
    const got = await page.evaluate(PACK_PAGES, { W, H });
    if (!got || !got.heights.length) throw new Error('no pages to print');
    if (typeof opts.onFindings === 'function') opts.onFindings(got.overflow);
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
    // The paginated page, as a browser shows it (the print class off, so the pages sit apart on a
    // grey desk): the .html a teacher opens is the same pages as the PDF.
    const packed = await page.evaluate(() => { document.documentElement.classList.remove('lp-print'); return '<!DOCTYPE html>' + document.documentElement.outerHTML; });
    return { pdf, heights: got.heights, stages: got.stages, scales: got.scales, html: packed };
  } finally { await browser.close(); }
}

module.exports = { htmlToFixedPagesPdf, PACK_PAGES };
