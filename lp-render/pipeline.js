'use strict';
// Reusable lesson-plan image pipeline — the single code path behind both the CLI
// (scripts/render-lp-image.js) and the web interface (scripts/lp-studio.js).
//
//   content JSON -> read skills -> restore/generate images (shared store) ->
//   ensure character cast -> render HTML+CSS+SVG (KaTeX/MathJax) -> PDF + PNG
const fs = require('node:fs');
const path = require('node:path');
const https = require('node:https');
const { buildShell } = require('./template/shell');
const { htmlToPdf, closeBrowser } = require('./index');
const { THEME_CSS } = require('./decorative/theme');
const { renderDecorativeLesson } = require('./decorative/render');
const { htmlToPixelPdf } = require('./render/png-to-pdf');
const { ensureCast } = require('./decorative/characters');
const store = require('./store/assets');
const { resolveRegion } = require('../imagegen/prompts/regions');
const { fixGuide } = require('./text/arabic-hygiene');

// An image the generator has already given up on must not be attempted again inside
// the same run. The fit/density loop re-renders a lesson several times, and each
// re-render was retrying every dropped image from scratch — including its culture
// re-rolls — so one stubborn brief could cost a dozen generations and minutes of wall
// clock. Remember the failure and make that decision once.
const GAVE_UP = new Set();
const { resolveSegmentImages } = require('../imagegen');
const { chromium } = require('../node_modules/playwright-core');

const ROOT = path.resolve(__dirname, '..');
const RULES_PATH = path.join(__dirname, 'decorative', 'RULES.md');
const CONCEPT_TO_BLOCK = { diagram: 'DIAGRAM', scene: 'HOOK_STORY', photo: 'HOOK_STORY' };

// Cache identity = the brief + the region + that region's art-direction version.
// Keyed on the brief alone, changing how Yemeni teachers are dressed changed
// nothing: every lesson just restored the old picture. Bumping a pack's `version`
// is therefore how a region re-buys its art — and why old entries stay orphaned.
// Exported so tests seed the same key the pipeline will look up, instead of
// re-deriving the formula and drifting from it.
function artCacheKey(prompt, { region, locale } = {}) {
  const artRegion = String(region || ({ sw: 'ke', ar: 'ye' })[locale] || 'pk').toLowerCase();
  const artVersion = (resolveRegion(artRegion) || {}).version || 1;
  return store.keyFor(`${prompt}|region:${artRegion}|art:v${artVersion}`);
}

function chromePath() {
  for (const c of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(c)) return c;
  try { return require('../node_modules/puppeteer').executablePath(); } catch (_) { return undefined; }
}
function download(url) {
  return new Promise((res, rej) => {
    https.get(url, (r) => {
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('download ' + r.statusCode)); }
      const chunks = []; r.on('data', (d) => chunks.push(d));
      r.on('end', () => { const b = Buffer.concat(chunks); const mime = b[0] === 0x89 && b[1] === 0x50 ? 'image/png' : b[0] === 0x47 ? 'image/gif' : 'image/jpeg'; res('data:' + mime + ';base64,' + b.toString('base64')); });
    }).on('error', rej);
  });
}
// The pipeline ALWAYS reads its skills file first (mandatory), from an absolute path.
function readSkills(log) {
  if (!fs.existsSync(RULES_PATH)) throw new Error(`Skills file missing: ${RULES_PATH}`);
  const txt = fs.readFileSync(RULES_PATH, 'utf8');
  const titles = (txt.match(/^## R\d+ —.*$/gm) || []).map((l) => l.replace(/^##\s*/, ''))
    .sort((a, b) => parseInt(a.match(/R(\d+)/)[1], 10) - parseInt(b.match(/R(\d+)/)[1], 10));
  const policy = (txt.match(/## GATE_POLICY\s*([\s\S]*?)$/) || [])[1];
  log(`Read ${titles.length} skills from RULES.md first — applying them.`);
  return (policy || '').trim();
}
async function screenshot(html) {
  const browser = await chromium.launch({ executablePath: chromePath(), args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  try {
    const page = await browser.newPage();
    await page.setViewportSize({ width: 794, height: 1123 });
    await page.setContent(html, { waitUntil: 'networkidle' });
    await page.evaluate(async () => { await document.fonts.ready; });
    return await page.screenshot({ fullPage: true });
  } finally { await browser.close(); }
}

// Render one lesson to { png, pdf } buffers. Content images are restored from the
// shared asset store when possible (no credits); anything new is generated, gated,
// and saved to the store for next time.
async function renderLessonImage(content, opts = {}) {
  const { apiKey = process.env.KIE_API_KEY, fresh = false, log = () => {}, pdf: wantPdf = true } = opts;
  const gatePolicy = readSkills(log);
  const meta = content.meta || {};
  const locale = meta.locale || 'en';
  const contentId = meta.id || 'lesson';
  // A guide handed straight to the renderer (a re-render of something already
  // reviewed) must get the same corrections as a freshly condensed one — otherwise the
  // fixes only reach new content.
  if (String(locale).startsWith('ar')) fixGuide(content, { log });
  const wanted = Array.isArray(content.images) ? content.images : [];
  const statsOut = { restored: 0, generated: 0, dropped: 0 };

  const imagesMap = {};
  const toGen = [];
  const cacheKey = (prompt) => artCacheKey(prompt, { region: meta.region, locale });
  for (const im of wanted) {
    const key = cacheKey(im.prompt);
    if (GAVE_UP.has(key)) { statsOut.dropped++; log(`  ⊘ image "${im.id}" skipped — already rejected earlier in this run`); continue; }
    const priorReject = store.isRejected(key);
    if (priorReject) {
      statsOut.dropped++;
      log(`  ⊘ image "${im.id}" skipped — rejected on an earlier run (${priorReject.reason}); set LP_RETRY_REJECTED=1 to try again`);
      continue;
    }
    if (!fresh) {
      const hit = store.get(key);
      if (hit) { imagesMap[im.id] = { dataUri: hit.dataUri, label: im.label, cover: im.concept !== 'diagram' }; statsOut.restored++; log(`  ⤿ image "${im.id}" restored from store (no credits)`); continue; }
    }
    toGen.push({ im, key });
  }

  if (toGen.length) {
    if (!apiKey) throw new Error(`Need KIE_API_KEY to generate ${toGen.length} new image(s) (or seed the asset store first).`);
    // Ground generated images in the lesson's region (people/setting): sw→Kenya, ar→Yemen.
    // Region comes FIRST from the content's own meta.region; the language mapping is
    // only a fallback when no region is declared. (Kiswahili is spoken in Tanzania AND
    // Kenya — a language never implies a country. RULES R22.)
    const imgRegion = meta.region || ({ sw: 'ke', ar: 'ye' })[locale] || 'pk';
    const segment = {
      subject: meta.subject || (meta.chips || []).map((c) => c.value).join(' '),
      grade: meta.grade || '', region: imgRegion, locale,
      blocks: toGen.map(({ im }) => ({ type: CONCEPT_TO_BLOCK[im.concept] || 'HOOK_STORY', text: im.prompt, characters: im.characters, model: im.model })),
    };
    const { images } = await resolveSegmentImages(segment, { apiKey, region: segment.region, gatePolicy });
    // One retry pass for gate-dropped figures only: every generation is a fresh
    // sample, so a second roll rescues most first-pass drops (batch runs showed
    // ~50% first-pass drop rates). Additive and region-neutral: nothing changes
    // when the first pass passed everything.
    const failedIdx = toGen.map((_, i) => i).filter((i) => !(images[i] && images[i].asset && images[i].asset.url));
    if (failedIdx.length) {
      log(`  ↻ retrying ${failedIdx.length} gate-dropped image(s) once…`);
      const retrySeg = { ...segment, blocks: failedIdx.map((i) => segment.blocks[i]) };
      const { images: retryImages } = await resolveSegmentImages(retrySeg, { apiKey, region: segment.region, gatePolicy });
      failedIdx.forEach((origI, k) => { if (retryImages[k] && retryImages[k].asset && retryImages[k].asset.url) images[origI] = retryImages[k]; });
    }
    for (let i = 0; i < toGen.length; i++) {
      const { im, key } = toGen[i]; const got = images[i];
      if (got && got.asset && got.asset.url) {
        const dataUri = await download(got.asset.url);
        store.put(key, dataUri, { model: got.model, concept: im.concept, prompt: im.prompt });
        imagesMap[im.id] = { dataUri, label: im.label, cover: im.concept !== 'diagram' };
        statsOut.generated++; log(`  ✓ image "${im.id}" generated (${got.model}) → saved to store`);
      } else {
        statsOut.dropped++;
        // Say WHY: a regional-fit rejection is a different problem from a generation
        // failure, and the operator needs to know which one happened.
        const why = (got && got.reason) || 'no model passed the quality gate';
        log(`  ✗ image "${im.id}" dropped — ${why}`);
        GAVE_UP.add(key); // do not pay for this again on the next re-render
        // and remember it across runs: the gates will not change their mind by themselves
        if (/culture_reject/.test(why)) store.markRejected(key, why);
      }
    }
  } else if (wanted.length) {
    log('All content images restored from the store — no credits spent.');
  }

  // Load the region design pack FIRST: it may switch off features that predate it
  // (the character cast, below) and it carries the page contract.
  let regionPack = null;
  const themeRegion = String(meta.region || '').toLowerCase();
  if (themeRegion) {
    // Cache-busted so a long-running server (LP Studio) always serves the pack's
    // CURRENT code — theme edits apply on the next render, no restart needed.
    try {
      const themePath = require.resolve(`./decorative/regions/${themeRegion}/theme`);
      delete require.cache[themePath];
      regionPack = require(themePath);
    } catch (_) { /* no design pack for this region — default look */ }
  }
  // Characters are a fallback: only build the (region-appropriate) cast when the
  // lesson has no content images. Region follows the language (ar→Yemen, sw→Kenya).
  const anyImage = Object.values(imagesMap).some((im) => im && im.dataUri);
  // A pack with its own approved design has no slot for decorative characters — and
  // the cast is a generator, so letting it fire also spends credits and page height a
  // fixed-format design cannot afford. Corpus runs showed it pushing zero-artwork
  // lessons onto a third page.
  const castAllowed = !(regionPack && regionPack.CHARACTER_CAST === false);
  // Code-only mode spends nothing: the character cast is a generator too, so skip it.
  const cast = (anyImage || !castAllowed || process.env.LP_NO_IMAGES === '1')
    ? {} : await ensureCast({ apiKey, gatePolicy, locale });
  if (!anyImage && !castAllowed) log('  (no illustration in this lesson; this design set does not use the character cast)');
  const { headerHtml, bodyHtml, headCss } = renderDecorativeLesson(content, imagesMap, cast);
  let html = buildShell({ headerHtml, bodyHtml, locale, title: meta.title || contentId });
  // Region DESIGN PACK: each region with an approved design set owns a folder
  // (decorative/regions/<region>/) holding its theme.js (CSS overrides, loaded AFTER
  // the default theme so plain cascade re-skins the page), its DESIGN.md (the design
  // set: reference artifacts, anatomy, template rules) and, when needed, goldens.
  // No pack → the locked default (R26) as-is. Regions are fully independent: adding
  // or changing one pack cannot affect another region's output.
  let regionCss = '';
  let regionPageStyle = '';
  let regionMaxPages = null;
  let overflowFindings = [];
  if (regionPack) {
    try {
      const pack = regionPack;
      regionCss = pack.THEME_OVERRIDE_CSS || '';
      regionPageStyle = pack.PAGE_NUMBER_STYLE || '';
      regionMaxPages = Number(pack.MAX_PAGES) || null;
      log(`  ⛨ region design pack "${themeRegion}" applied`);
    } catch (_) { /* no design pack for this region — default look */ }
  }
  html = html.replace('</head>', `<style>${THEME_CSS}</style>${regionCss ? `<style>${regionCss}</style>` : ''}${headCss ? `<style>${headCss}</style>` : ''}</head>`);
  // Figure density: a caller that has to fit a fixed number of pages can shrink
  // every figure together rather than lose one. 1 (or absent) changes nothing.
  const figureScale = Number(opts.figureScale);
  if (figureScale > 0 && figureScale !== 1) {
    html = html.replace('</head>', `<style>:root{--figscale:${figureScale}}</style></head>`);
    log(`  ⤡ figure density ${Math.round(figureScale * 100)}% (fitting the page budget)`);
  }

  // The PDF is a second full render; skip it when only the PNG is needed (e.g. the web
  // interface) to roughly halve the render step.
  let pdf = null;
  if (wantPdf) {
    // Default deliverable (RULES R30): a PIXEL-PERFECT paginated PDF sliced from the 2×
    // screenshot at section / list-item boundaries, with page numbers — identical to the
    // preview, no section leaking, real margins. Falls back to the Chromium vector PDF if
    // python3 + pillow + img2pdf are not available.
    try {
      // No instructional text may leave its container: the composer measures the real
      // laid-out DOM and reports before the PDF is built.
      const onFindings = (list) => {
        for (const f of (list || []).slice(0, 8)) log(`  ⚠ ${f.kind}: «${f.text}» does not fit inside its box`);
        if ((list || []).length > 8) log(`  ⚠ …and ${list.length - 8} more overflow finding(s)`);
        overflowFindings = list || [];
      };
      pdf = await htmlToPixelPdf(html, regionPageStyle
        ? { pageStyle: regionPageStyle, footerText: (content.meta && content.meta.footer) || '', onFindings }
        : { onFindings });
    } catch (e) {
      log(`  (pixel-perfect PDF unavailable — ${e.message}; using vector fallback)`);
      pdf = await htmlToPdf(html, { pageMode: 'paged', pdfOptions: { printBackground: true } });
      await closeBrowser();
    }
  }
  const png = await screenshot(html);
  // Report how full the page is, so a caller with a page contract can not only shrink
  // figures to fit but GROW them to fill: a lesson that lands with 450px spare reads
  // as unfinished, and its figures were the thing that should have been bigger.
  let stripHeight = null;
  try { stripHeight = png && png.length > 24 ? Buffer.from(png).readUInt32BE(20) : null; } catch (_) { /* not a PNG buffer */ }
  const usablePerPage = 1123 - 28 - (regionPageStyle === 'ar-bottom' ? 36 : 12);
  const pageBudget = regionMaxPages ? regionMaxPages * usablePerPage : null;
  return { png, pdf, html, contentId, locale, stats: statsOut, maxPages: regionMaxPages, stripHeight, pageBudget, overflow: overflowFindings };
}

module.exports = { renderLessonImage, artCacheKey, ROOT };
