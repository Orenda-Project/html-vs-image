'use strict';
// Phone pages, printed by the browser — NIETE's approved Grades 1–5 lesson-plan format.
//
// The Grades 1–5 page (lp-render/decorative/regions/ict/primary.js) is one column of blocks,
// 520 px wide. This flows those blocks onto tall 520×2000 pages (390×1500 pt, the approved PDFs'
// own size) the way the approved pages do, and prints them straight from the browser (vector,
// selectable text, fonts embedded), so the PDF reads well on a phone in WhatsApp:
//   · every page after the first carries the running head "<lesson title> · continued", and every
//     page the footer "<grade subject chapter pages>" / "page N of M";
//   · a block that does not fit moves to the next page whole; a heading (data-keep) moves with
//     the block it heads, so no page ends on a heading;
//   · a block that may divide (data-split) gives up its [data-units] — rows of a list, a table's
//     rows, a card's paragraphs — into a copy of itself on the next page (its [data-first-only]
//     heading stays behind), so a long card does not leave a half-empty page behind it;
//   · a stage that continues on a new page starts that page with its own bar, "· continued";
//   · a block marked data-newpage (the teacher-support pages) starts a page of its own;
//   · only a single block taller than a whole page makes its page grow, so nothing is cut off.
// Text is never set smaller to fit: on a phone, size is what makes a page readable.
//
// Only a page layout that says { flow: true } reaches this file (the ICT Grades 1–5 page, today).
const fs = require('node:fs');
const { chromium } = require('playwright-core');

function chromePath() {
  for (const c of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(c)) return c;
  try { const p = require('puppeteer').executablePath(); if (p && fs.existsSync(p)) return p; } catch (_) { /* fine */ }
  return undefined;
}

// Runs in the page. Returns each page's height, the stage it holds and what the probe found.
const PACK_FLOW = ({ W, H }) => {
  document.documentElement.classList.add('lp-print');
  const root = document.querySelector('.ictq');
  const src = root.querySelector('.q-src');
  const proto = { run: root.querySelector('.q-chrome .q-run'), foot: root.querySelector('.q-chrome .q-foot') };
  const pno = root.dataset.pno || 'page {n} of {m}';
  const contWord = root.dataset.cont || 'continued';
  const bars = new Map();
  src.querySelectorAll('[data-bar]').forEach((b) => bars.set(b.dataset.stage, b.cloneNode(true)));
  const book = document.createElement('div'); book.className = 'q-book'; root.appendChild(book);
  const pages = [];
  const bodyOf = (pg) => pg.querySelector(':scope > .q-body');
  const newPage = () => {
    const pg = document.createElement('section'); pg.className = 'qpg';
    if (pages.length) pg.appendChild(proto.run.cloneNode(true));
    const body = document.createElement('div'); body.className = 'q-body'; pg.appendChild(body);
    const foot = proto.foot.cloneNode(true);
    // the page number is written in at the end; hold its line now, or the foot grows later
    const n = foot.querySelector('.q-pno'); if (n) n.textContent = pno.replace('{n}', '00').replace('{m}', '00');
    pg.appendChild(foot);
    book.appendChild(pg); pages.push(pg);
    return pg;
  };
  const room = (pg) => bodyOf(pg).getBoundingClientRect().bottom;
  const fits = (pg) => { const last = bodyOf(pg).lastElementChild; return !last || last.getBoundingClientRect().bottom <= room(pg) + 0.5; };
  const contBar = (stage) => {
    const p = bars.get(stage);
    if (!p) return null;
    const c = p.cloneNode(true);
    c.removeAttribute('data-bar'); c.removeAttribute('data-keep'); c.classList.add('cont');
    const inner = c.querySelector('.q-bar'); if (inner) inner.classList.add('cont');
    const nm = c.querySelector('.q-bar-name');
    if (nm) nm.insertAdjacentHTML('beforeend', ` <span class="q-cont">· ${contWord}</span>`);
    c.querySelectorAll('.q-bar-end').forEach((x) => x.remove());
    return c;
  };
  const startPage = (stage) => {
    const pg = newPage();
    if (stage && bars.has(stage)) bodyOf(pg).appendChild(contBar(stage));
    return pg;
  };
  // the blocks that came with `blk` and must go with it: the headings right before it
  const headingsBefore = (blk) => {
    const out = []; let p = blk.previousElementSibling;
    while (p && p.hasAttribute('data-keep')) { out.unshift(p); p = p.previousElementSibling; }
    return out;
  };
  const queue = [...src.children];
  let pg = newPage();
  let guard = 0;
  while (queue.length && guard++ < 4000) {
    const blk = queue.shift();
    // a block marked data-newpage (the teacher-support pages) starts a page of its own
    if (blk.hasAttribute('data-newpage') && bodyOf(pg).children.length) pg = startPage(null);
    const body = bodyOf(pg);
    body.appendChild(blk);
    if (fits(pg)) continue;
    const stage = blk.dataset.stage;
    // 1. a block that may divide keeps what fits and continues in a copy on the next page
    if (blk.hasAttribute('data-split')) {
      const host = blk.querySelector('.units');
      const units = host ? [...host.children].filter((u) => u.hasAttribute('data-units')) : [];
      // the card's own padding and border below its last unit come along on this page too
      const tail = units.length ? blk.getBoundingClientRect().bottom - units[units.length - 1].getBoundingClientRect().bottom : 0;
      if (units.length > 1 && units[0].getBoundingClientRect().bottom + tail <= room(pg) + 0.5) {
        const copy = blk.cloneNode(true);
        copy.querySelectorAll('[data-first-only]').forEach((x) => x.remove());
        const twin = copy.querySelector('.units'); twin.innerHTML = '';
        copy.classList.add('cont-card');
        for (let k = units.length - 1; k >= 1 && !fits(pg); k--) twin.prepend(units[k]);
        // a sub-heading left last on the page goes over with what it heads
        while (host.lastElementChild && host.lastElementChild.classList.contains('q-sub') && host.children.length > 1) twin.prepend(host.lastElementChild);
        // only headings left behind on this page is no division at all: the block moves whole
        const kept = [...host.children];
        if (fits(pg) && kept.some((u) => !u.classList.contains('q-sub'))) {
          queue.unshift(copy);
          pg = startPage(stage && stage !== 'start' && stage !== 'close' ? stage : null);
          continue;
        }
        for (const u of [...twin.children]) host.appendChild(u);   // it did not work: undo, move it whole
      }
    }
    // 2. otherwise the block moves to the next page whole, with the headings above it
    const moving = [...headingsBefore(blk), blk];
    const staying = [...body.children].filter((c) => !moving.includes(c) && !c.classList.contains('cont'));
    if (!staying.length) {
      // already at the top of its page and still too tall: the page grows to hold it
      if (!blk.hasAttribute('data-split')) { pg.classList.add('q-grow'); continue; }
      pg.classList.add('q-grow'); continue;
    }
    const first = moving[0];
    pg = startPage(first.hasAttribute('data-bar') || !stage || stage === 'start' || stage === 'close' ? null : stage);
    for (const m of moving.slice(0, -1)) bodyOf(pg).appendChild(m);
    queue.unshift(blk);   // placed again on the new page, where it may still need to divide
  }
  src.remove();
  const total = pages.length;
  // a lesson that prints its numbers in Urdu digits numbers its pages in them too
  const dg = (v) => (root.dataset.digits === 'urdu' ? String(v).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(v));
  pages.forEach((p, k) => { const n = p.querySelector('.q-pno'); if (n) n.textContent = pno.replace('{n}', dg(k + 1)).replace('{m}', dg(total)); });
  // nothing may leave its page sideways, nor run past its foot
  const overflow = [];
  pages.forEach((p, k) => {
    const pb = p.getBoundingClientRect();
    p.querySelectorAll('.q-body *').forEach((el) => {
      if (el.ownerSVGElement) return;   // a drawing's insides are clipped by the drawing itself
      const eb = el.getBoundingClientRect();
      if (eb.width && (eb.right > pb.right + 1 || eb.left < pb.left - 1)) overflow.push({ kind: 'content_outside_page', page: k + 1, text: (el.textContent || el.tagName).trim().slice(0, 32) });
    });
    if (!p.classList.contains('q-grow') && !fits(p)) overflow.push({ kind: 'content_past_page_foot', page: k + 1, text: (bodyOf(p).lastElementChild.textContent || '').trim().slice(0, 32) });
  });
  const docW = document.documentElement.scrollWidth;
  if (docW > W + 1) overflow.push({ kind: 'page_wider_than_format', text: `${docW}px > ${W}px` });
  const heights = pages.map((p) => (p.classList.contains('q-grow') ? Math.ceil(p.getBoundingClientRect().height) + 1 : H));
  const st = document.createElement('style');
  st.id = 'lp-phone-pages';
  st.textContent = `@page{size:${W}px ${H}px;margin:0}html,body{margin:0;padding:0}.qpg{break-after:page}.qpg:last-child{break-after:auto}`
    + pages.map((p, k) => (p.classList.contains('q-grow') ? `@page g${k}{size:${W}px ${heights[k]}px;margin:0}.qpg[data-k="${k}"]{page:g${k}}` : '')).join('');
  pages.forEach((p, k) => { p.dataset.k = String(k); });
  document.head.appendChild(st);
  // opened on a phone, the .html shows one page across the screen, as the PDF does
  if (!document.querySelector('meta[name="viewport"]')) document.head.insertAdjacentHTML('afterbegin', `<meta name="viewport" content="width=${W + 40}">`);
  const stages =pages.map((p) => [...new Set([...bodyOf(p).children].map((c) => c.dataset.stage).filter(Boolean))].join('+'));
  return { heights, overflow, stages };
};

async function htmlToPhonePagesPdf(html, opts = {}) {
  const W = Number(opts.pageWidth) || 520;
  const H = Number(opts.pageHeight) || 2000;
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'] });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: W, height: H });
    await page.emulateMedia({ media: 'screen' });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await document.fonts.ready; });
    const got = await page.evaluate(PACK_FLOW, { W, H });
    if (!got || !got.heights.length) throw new Error('no pages to print');
    if (typeof opts.onFindings === 'function') opts.onFindings(got.overflow);
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
    // the paginated page as a browser shows it (pages apart on a grey desk): the .html is the PDF's pages
    const packed = await page.evaluate(() => { document.documentElement.classList.remove('lp-print'); return '<!DOCTYPE html>' + document.documentElement.outerHTML; });
    return { pdf, heights: got.heights, stages: got.stages, overflow: got.overflow, html: packed };
  } finally { await browser.close(); }
}

module.exports = { htmlToPhonePagesPdf, PACK_FLOW };
