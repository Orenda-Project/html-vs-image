'use strict';
// One page per PART, printed by the browser — ICT's grades 6–12 delivery format.
//
// ICT's approved page (NIETE-Rumi bot/vendor/lp-v9, lib/continuous.js; operator sign-off
// 2026-09-24: "keep it 2 pages, 1 page teaching, next page teacher support"): each part of the
// lesson is printed on ONE 520 px page whose height is that part's own height, so nothing is cut
// and nothing is padded. The approved PDFs are 390 pt wide and as tall as their parts.
//
// The page (lp-render/decorative/regions/ict/secondary.js) marks each part as a .spart and leaves
// an empty .spno in its footer; this measures the parts, writes "page N of M" into each, and gives
// each part a named @page of its own height. It prints straight from the browser (vector,
// selectable text), and hands back the page as laid out, so the .html is the PDF's pages.
//
// Only a page that names { parts: true } as its layout reaches this file (the ICT grades 6–12
// page, today). Every other page is printed exactly as before.
const fs = require('node:fs');
const { chromium } = require('playwright-core');

function chromePath() {
  for (const c of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(c)) return c;
  try { const p = require('puppeteer').executablePath(); if (p && fs.existsSync(p)) return p; } catch (_) { /* fine */ }
  return undefined;
}

// Runs in the page.
const PACK_PARTS = ({ W }) => {
  document.documentElement.classList.add('lp-print');
  const root = document.querySelector('.icts');
  const parts = [...document.querySelectorAll('.spart')];
  if (!root || !parts.length) return null;
  const pno = root.dataset.pno || 'page {n} of {m}';
  parts.forEach((p, k) => { const n = p.querySelector('.spno'); if (n) n.textContent = pno.replace('{n}', k + 1).replace('{m}', parts.length); });
  // nothing may be wider than the page, or leave it sideways (a drawing's insides are its own)
  const overflow = [];
  const docW = document.documentElement.scrollWidth;
  if (docW > W + 1) overflow.push({ kind: 'page_wider_than_format', text: `${docW}px > ${W}px` });
  parts.forEach((p, k) => {
    const pb = p.getBoundingClientRect();
    p.querySelectorAll('*').forEach((el) => {
      if (el.ownerSVGElement) return;
      const eb = el.getBoundingClientRect();
      if (eb.width && (eb.right > pb.right + 1 || eb.left < pb.left - 1)) overflow.push({ kind: 'content_outside_page', page: k + 1, text: (el.textContent || el.tagName).trim().slice(0, 32) });
    });
  });
  const heights = parts.map((p) => Math.ceil(p.getBoundingClientRect().height) + 1);
  const st = document.createElement('style');
  st.id = 'lp-part-pages';
  st.textContent = `html,body{margin:0;padding:0;width:${W}px}.spart{break-after:page;margin:0 !important;box-shadow:none !important}.spart:last-child{break-after:auto}`
    + heights.map((h, k) => `@page part${k + 1}{size:${W}px ${h}px;margin:0}.spart[data-part="${k + 1}"]{page:part${k + 1};height:${h}px}`).join('');
  document.head.appendChild(st);
  if (!document.querySelector('meta[name="viewport"]')) document.head.insertAdjacentHTML('afterbegin', `<meta name="viewport" content="width=${W + 40}">`);
  return { heights, overflow };
};

async function htmlToPartPagesPdf(html, opts = {}) {
  const W = Number(opts.pageWidth) || 520;
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--font-render-hinting=none'] });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: W, height: 2000 });
    await page.emulateMedia({ media: 'screen' });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await document.fonts.ready; });
    const got = await page.evaluate(PACK_PARTS, { W });
    if (!got || !got.heights.length) throw new Error('no parts to print');
    if (typeof opts.onFindings === 'function') opts.onFindings(got.overflow);
    const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
    // the page as a browser shows it (the print class off, so the parts sit apart on a grey desk)
    const packed = await page.evaluate(() => { document.documentElement.classList.remove('lp-print'); return '<!DOCTYPE html>' + document.documentElement.outerHTML; });
    return { pdf, heights: got.heights, overflow: got.overflow, html: packed };
  } finally { await browser.close(); }
}

module.exports = { htmlToPartPagesPdf, PACK_PARTS };
