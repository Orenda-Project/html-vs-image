#!/usr/bin/env node
'use strict';
// LP Studio — a tiny local web interface for the lesson-plan pipeline.
// Two panels: paste a lesson content JSON on the left, get the rendered image on
// the right. The SAME code path runs behind it (lp-render/pipeline.js).
//
//   node scripts/lp-studio.js         # then open http://localhost:5178
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { renderLessonImage } = require('../lp-render/pipeline');
const { structureLesson } = require('../lp-render/structure');
const { condenseToGuide, addFiguresToGuide } = require('../lp-render/condense');
const { validateFigures } = require('../lp-render/figures/validate');
const { checkVerbatim } = require('../lp-render/text/verbatim');
const { buildGuideFromMarkdown, GUIDE_SECTION_IDS } = require('../lp-render/guide/from-markdown');

const ROOT = path.resolve(__dirname, '..');
// Load the kie.ai key from the git-ignored .env-api if it isn't already in the env.
if (!process.env.KIE_API_KEY) {
  try {
    const t = fs.readFileSync(path.join(ROOT, 'assets/generated/.env-api'), 'utf8');
    const line = t.split(/\r?\n/).find((l) => l.startsWith('KIE_API_KEY='));
    if (line) process.env.KIE_API_KEY = line.split('=').slice(1).join('=').trim();
  } catch (_) { /* no key file — store-only mode still works */ }
}

const PORT = process.env.PORT || 5178;
const PAGE = fs.readFileSync(path.join(__dirname, 'lp-studio.html'), 'utf8');
const SAMPLE_FILE = path.join(ROOT, 'assets/content/lesson-speed-demo.en.json');

function send(res, code, type, body) { res.writeHead(code, { 'Content-Type': type }); res.end(body); }

function handler(req, res) {
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) return send(res, 200, 'text/html; charset=utf-8', PAGE);
  if (req.method === 'GET' && req.url === '/sample') {
    try { return send(res, 200, 'application/json', fs.readFileSync(SAMPLE_FILE, 'utf8')); }
    catch (_) { return send(res, 404, 'application/json', '{}'); }
  }
  if (req.method === 'GET' && req.url === '/regions') {
    // Region design packs on disk (decorative/regions/<code>/theme.js) — the picker
    // lists them automatically, so a new pack shows up with no Studio change.
    const dir = path.join(ROOT, 'lp-render/decorative/regions');
    let regions = [];
    try {
      regions = fs.readdirSync(dir).filter((r) => fs.existsSync(path.join(dir, r, 'theme.js'))).sort()
        .map((code) => {
          let name = code.toUpperCase();
          try {
            const themePath = require.resolve(path.join(dir, code, 'theme.js'));
            delete require.cache[themePath];
            name = require(themePath).REGION_NAME || name;
          } catch (_) { /* stub without name — code is fine */ }
          return { code, name };
        });
    } catch (_) { /* no regions dir — empty list */ }
    return send(res, 200, 'application/json', JSON.stringify({ regions }));
  }
  if (req.method === 'POST' && req.url === '/render') {
    // Collect BYTES, not strings: appending each chunk to a string decodes it on its
    // own, so a multi-byte character split across two TCP chunks becomes two U+FFFD
    // replacement marks. A pasted Arabic lesson is big enough to hit that boundary,
    // and the damage is invisible until it shows up as tofu in the rendered PDF.
    const chunks = []; let size = 0;
    req.on('data', (d) => { chunks.push(d); size += d.length; if (size > 5e6) req.destroy(); });
    req.on('end', async () => {
      const body = Buffer.concat(chunks).toString('utf8');
      const logs = []; const log = (m) => logs.push(m);
      // Proxies and tunnels (Cloudflare et al) kill a response that stays silent for
      // ~100s, while structure+render+imagegen can take minutes. Send the headers now
      // and a whitespace heartbeat until the JSON is ready — leading whitespace is
      // valid JSON, so the client's res.json() parses exactly as before.
      res.writeHead(200, { 'Content-Type': 'application/json' });
      const heartbeat = setInterval(() => { try { res.write(' '); } catch (_) { /* client gone */ } }, 15000);
      const finish = (obj) => { clearInterval(heartbeat); res.end(JSON.stringify(obj)); };
      try {
        const parsedBody = JSON.parse(body);
        const { content, region } = parsedBody;
        // Default ON — clients that predate the checkbox get the guide structure too.
        const guide2p = parsedBody.guide2p !== false;
        // guideMode: 'code' (default) maps the lesson onto the template IN CODE, with no
        // model call at all. 'llm' is the old restructuring step, kept for input that has
        // no headings to map. The default matters: a design/rendering layer must not
        // depend on a language model to reach its own template, must not rewrite the
        // teacher's words, and must not stop working when a credit balance runs out.
        const guideMode = parsedBody.guideMode === 'llm' ? 'llm' : 'code';
        let parsed = null; let structured = null;
        // First, try to read the paste as a ready content JSON.
        if (typeof content !== 'string') parsed = content;
        else { try { parsed = JSON.parse(content); } catch (_) { parsed = null; } }
        // Raw lesson TEXT (markdown, as the lesson artifacts carry it) is mapped by code.
        if (!parsed && typeof content === 'string' && guideMode === 'code') {
          log('Raw lesson text → guide template, mapped in code (no model call, no credits).');
          // REGION-AWARE. This line used to read `{ region: region || 'ye', locale: 'ar' }`:
          // every paste with no picker choice was treated as a Yemeni lesson and every
          // lesson was declared Arabic, so a Kenyan CBC paste was read with Yemen's
          // heading rules and titled with Arabic card names. The picker's choice is
          // passed through as-is; with nothing chosen the profile is detected from the
          // text, and the locale comes from that profile rather than being asserted here.
          parsed = buildGuideFromMarkdown(content, {
            region: region === 'default' ? '' : (region || ''),
            locale: parsedBody.locale || '',
          });
          const sp = parsed.sourceProfile || {};
          log(`  ✓ profile: ${sp.name} (${sp.id}) · headings read in ${sp.mode === 'bare'
            ? 'bare-line mode — the paste carries no "#" markers' : 'markdown mode'}`);
          structured = JSON.stringify(parsed, null, 2);
          const chars = parsed.sections.reduce((a, x) => a + (x.body ? x.body.length
            : (x.items || []).reduce((b, i) => b + String(i.body || i.text || i.value || '').length, 0)), 0);
          log(`  ✓ ${parsed.sections.length} section(s), ${chars} characters of the lesson's own text — nothing rewritten`);
        }
        // A usable content JSON MUST have a sections array. Anything else — a JSON in
        // some other shape (an API dump, a blob with the lesson inside a text field) —
        // is structured into the schema first. This path still needs a model.
        if (!parsed || !Array.isArray(parsed.sections)) {
          log('Input is not a lesson content JSON — structuring it into the schema first…');
          if (!process.env.KIE_API_KEY) throw new Error('Structuring needs a kie.ai key. Paste a content JSON (with a "sections" array), or start the server with KIE_API_KEY set.');
          const raw = typeof content === 'string' ? content : JSON.stringify(content);
          parsed = await structureLesson(raw, { apiKey: process.env.KIE_API_KEY });
          structured = JSON.stringify(parsed, null, 2);
          log('Structured the input into a content JSON (kept its own words).');
        }
        // Region override from the Studio picker: '' = auto (whatever the content
        // declares), 'default' = force the default theme, '<code>' = that design pack.
        if (region === 'default') { parsed.meta = { ...(parsed.meta || {}) }; delete parsed.meta.region; log('Region: forced default theme (picker).'); }
        else if (region) { parsed.meta = { ...(parsed.meta || {}), region }; log(`Region: "${region}" design pack (picker).`); }
        // GUIDE STRUCTURE (default ON): map the full lesson onto the design set's
        // teacher-facing 12-role template before rendering. This is a structural
        // mapping, not a length target — it does not exist to hit a page count.
        // Content already in the guide shape passes through untouched.
        const srcForValidation = parsed; // the structured lesson, before condensing
        let figureReport = null; let verbatimReport = null;
        // "Is this already in guide shape?" used to mean "does it contain stage-tamhid",
        // i.e. does it look YEMENI — so a Kenyan guide was never recognised as a guide and
        // got sent back through the structurer. Any section id any region profile can
        // emit counts, and a stage id of any profile is the real signal.
        const looksLikeGuide = Array.isArray(parsed.sections)
          && parsed.sections.filter((x) => x && GUIDE_SECTION_IDS.has(x.id)).length >= 3;
        if (guide2p && !looksLikeGuide && guideMode === 'llm') {
          if (!process.env.KIE_API_KEY) throw new Error('The guide structure needs a kie.ai key for the condense step.');
          log('Mapping the full lesson onto the guide template (model path — guideMode=llm)…');
          const keepRegion = parsed.meta && parsed.meta.region;
          parsed = await condenseToGuide(parsed, { apiKey: process.env.KIE_API_KEY, log });
          if (keepRegion) parsed.meta = { ...(parsed.meta || {}), region: keepRegion };
          // Coverage retry: the design set promises a figure on every stage card, but
          // condense rolls vary. Count the stages that actually got one and re-condense
          // (text only — no image credits spent yet) when the guide comes back bare.
          // Coverage: no fixed figure count — a lesson may be as visual as it needs.
          // Only a guide that comes back with essentially NO figures is re-condensed.
          const STAGES = ['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim'];
          const covered = (g) => STAGES.filter((id) => {
            const s = (g.sections || []).find((x) => x && x.id === id);
            return s && (s.image || s.codeFigure);
          }).length;
          for (let pass = 0; covered(parsed) < 2 && pass < 2; pass++) {
            log(`Only ${covered(parsed)}/4 stages carry a figure — re-condensing for a visual-first guide…`);
            parsed = await condenseToGuide(parsed, { apiKey: process.env.KIE_API_KEY, log,
              extra: 'VISUAL-FIRST: this guide came back nearly text-only. Give the stages that genuinely benefit a figure — a textless illustration ("image") or a "codeFigure" — and keep their prose to one or two short lines.' });
            if (keepRegion) parsed.meta = { ...(parsed.meta || {}), region: keepRegion };
          }
          // Accuracy net (§6/§7): validate the figure SPECS against the source lesson
          // before any image is generated, so wrong values surface as findings.
          figureReport = validateFigures(parsed, { source: srcForValidation, log });
          // Design is our job; editing the teacher's words is not. Prove it every run:
          // every reader-visible string must appear in the source, template chrome aside.
          verbatimReport = checkVerbatim(parsed, srcForValidation, { log });
          structured = JSON.stringify(parsed, null, 2);
        }
        let { png, pdf, stats, contentId, locale, maxPages } = await renderLessonImage(parsed, { log, pdf: true }); // PNG preview + PDF download (final product)
        // PAGE COUNT FOLLOWS THE CONTENT. A pack may still declare MAX_PAGES, but the
        // guide checkbox no longer implies one: it selects the 12-role guide STRUCTURE,
        // not a length. Nothing below re-condenses or shrinks anything to hit a page
        // target — the raw lesson is the source of truth and the document is as long as
        // the lesson needs.
        const pageLimit = maxPages || null;
        const pageCount = (buf) => ((buf || '').toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
        // A tightening pass rewrites the guide, and it has been observed dropping
        // every stage figure despite being told not to. Snapshot the figures and put
        // back whatever a pass loses: the loop is for cutting words, not visuals.
        const FIGKEYS = ['image', 'codeFigure', 'overlays', 'imageWrong', 'imageCorrect', 'labelWrong', 'labelCorrect'];
        const snapshotFigures = (g) => {
          const m = new Map();
          for (const sec of (g.sections || [])) {
            if (!sec || !sec.id) continue;
            const keep = {};
            for (const k of FIGKEYS) if (sec[k] !== undefined) keep[k] = sec[k];
            if (keep.image || keep.codeFigure || keep.imageWrong) m.set(sec.id, keep);
          }
          return { bySection: m, images: new Map((g.images || []).map((im) => [im.id, im])) };
        };
        const restoreFigures = (g, snap) => {
          let restored = 0;
          const referenced = new Set();
          for (const sec of (g.sections || [])) for (const k of ['image', 'imageWrong', 'imageCorrect']) if (sec && sec[k]) referenced.add(sec[k]);
          for (const sec of (g.sections || [])) {
            const had = sec && sec.id && snap.bySection.get(sec.id);
            if (!had || sec.image || sec.codeFigure || sec.imageWrong) continue;
            for (const k of FIGKEYS) if (had[k] !== undefined) sec[k] = had[k];
            // an image brief the tightened guide dropped has to come back with it
            for (const k of ['image', 'imageWrong', 'imageCorrect']) {
              const id = had[k];
              if (!id || referenced.has(id)) continue;
              const brief = snap.images.get(id);
              g.images = g.images || [];
              if (brief && !g.images.some((im) => im && im.id === id)) g.images.push(brief);
            }
            restored++;
          }
          if (restored) log(`  ↺ restored ${restored} figure(s) the tightening pass dropped — the fit loop cuts words, not visuals`);
          return g;
        };
        // (The figure-shrinking ladder that used to run here is gone with the page
        // contract: figures were being drawn down to 62% to buy a page that no longer
        // needs buying. They now render at their designed size.)
        // Everything from here on is an OPTIMISATION of a render we already have. A
        // flaky model call must not cost us the lesson: keep the last good state and
        // fall back to it. (A corpus run lost a whole lesson to one bad response.)
        let best = { parsed, structured, png, pdf, stats, contentId, locale };
        const keepBest = () => { best = { parsed, structured, png, pdf, stats, contentId, locale }; };
        const revert = (why) => {
          log(`  ⚠ ${why} — keeping the last good render instead of failing the lesson`);
          ({ parsed, structured, png, pdf, stats, contentId, locale } = best);
        };
        if (pdf) log(`Guide rendered at ${pageCount(pdf)} page(s) — length follows the lesson, nothing was cut to fit.`);
        // A pack may still declare a page contract. It is now REPORTED, not enforced:
        // the operator learns the design's expectation without the lesson being
        // rewritten or the figures shrunk behind their back.
        if (pageLimit && pdf && pageCount(pdf) > pageLimit) {
          log(`  ℹ this design pack declares MAX_PAGES=${pageLimit}; the lesson rendered ${pageCount(pdf)} page(s). Reported only — no text was cut and no figure was shrunk.`);
        }
        // Whatever the rolls did, no stage ships as bare prose: a narrow text-only
        // figure pass fills the gaps from the guide's own words, then we re-render.
        if (guide2p && !looksLikeGuide) {
          const stages = ['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim'];
          const bareCount = () => stages.concat('errors').filter((id) => {
            const sec = (parsed.sections || []).find((x) => x && x.id === id);
            return sec && !sec.image && !sec.codeFigure && !sec.imageWrong;
          }).length;
          if (bareCount()) {
            log(`${bareCount()} stage(s) came back without a figure — running the figure pass…`);
            const before = bareCount();
            try {
            ({ guide: parsed } = await addFiguresToGuide(parsed, { apiKey: process.env.KIE_API_KEY, log }));
            if (bareCount() < before) {
              structured = JSON.stringify(parsed, null, 2);
              ({ png, pdf, stats, contentId, locale } = await renderLessonImage(parsed, { log, pdf: true }));
              // Figures added here simply make the document longer if they need to;
              // there is no tightening pass to claw the space back.
            }
            } catch (e) { revert(`the figure pass failed (${e.message})`); }
          }
          if (bareCount()) log('  ⚠ ' + bareCount() + ' stage(s) still have no figure — the page will read text-heavy');
          // A page of pure diagrams is its own kind of dry: the design set expects at
          // least one real picture. One text-only retry when a roll authored none.
          if (!(parsed.images || []).length) {
            log('This roll authored no illustration at all — asking once for one picture…');
            keepBest();
            const keepR3 = parsed.meta && parsed.meta.region;
            try {
            const withArt = await condenseToGuide(parsed, { apiKey: process.env.KIE_API_KEY, log,
              extra: 'This guide has NO illustration. Keep every figure and all the text as they are, and additionally author EXACTLY ONE textless illustration in "images" for the single most scene-like stage (children or objects doing the activity, absolutely no text in the image), referenced by that section\'s "image" field. Change nothing else.' });
            if (keepR3) withArt.meta = { ...(withArt.meta || {}), region: keepR3 };
            const merged = restoreFigures(withArt, snapshotFigures(parsed));
            if ((merged.images || []).length) {
              parsed = merged;
              structured = JSON.stringify(parsed, null, 2);
              ({ png, pdf, stats, contentId, locale } = await renderLessonImage(parsed, { log, pdf: true }));
            }
            } catch (e) { revert(`the artwork retry failed (${e.message})`); }
          }
        }
        // (The page-filling upscale that used to run here is gone too: it grew figures
        // to consume leftover space inside a fixed budget. With no budget there is no
        // leftover to fill.)
        // Keep every rendered lesson in the repo (pdf + png + the content JSON used).
        try {
          const dir = path.join(ROOT, 'assets/generated/lessons');
          fs.mkdirSync(dir, { recursive: true });
          const base = path.join(dir, `${contentId}.${locale || 'en'}`);
          if (pdf) fs.writeFileSync(`${base}.pdf`, pdf);
          fs.writeFileSync(`${base}.png`, png);
          fs.writeFileSync(`${base}.json`, JSON.stringify(parsed, null, 2));
          log(`Saved to assets/generated/lessons/${contentId}.${locale || 'en'}.{pdf,png,json}`);
        } catch (e) { log(`(could not save to repo: ${e.message})`); }
        // Second pass with the generated artwork's real dimensions (resolution check).
        if (figureReport) {
          try {
            const dims = {};
            for (const im of parsed.images || []) {
              const hit = require('../lp-render/store/assets').get(require('../lp-render/store/assets').keyFor(im.prompt));
              if (!hit) continue;
              const buf = Buffer.from(hit.dataUri.split(',')[1], 'base64');
              if (buf[0] === 0x89) dims[im.id] = { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
              else { // JPEG: walk the segments for SOFn
                for (let i = 2; i < buf.length - 9;) {
                  if (buf[i] !== 0xFF) { i++; continue; }
                  const m = buf[i + 1];
                  if (m >= 0xC0 && m <= 0xCF && m !== 0xC4 && m !== 0xC8 && m !== 0xCC) {
                    dims[im.id] = { width: buf.readUInt16BE(i + 7), height: buf.readUInt16BE(i + 5) }; break;
                  }
                  i += 2 + buf.readUInt16BE(i + 2);
                }
              }
            }
            figureReport = validateFigures(parsed, { source: srcForValidation, imageDims: dims, log });
          } catch (e) { log(`  (resolution check skipped: ${e.message})`); }
        }
        // Re-check what ACTUALLY ships: the figure pass and the artwork retry can
        // re-run the restructuring step, so the report must describe the final guide,
        // not the first draft of it.
        if (guide2p && !looksLikeGuide) {
          try { verbatimReport = checkVerbatim(parsed, srcForValidation, { log }); }
          catch (e) { log(`  (verbatim re-check skipped: ${e.message})`); }
        }
        finish({
          ok: true,
          figureReport, verbatimReport,
          png: 'data:image/png;base64,' + png.toString('base64'),
          pdf: pdf ? 'data:application/pdf;base64,' + pdf.toString('base64') : null,
          logs, stats, structured,
        });
      } catch (e) {
        finish({ ok: false, error: e.message, logs });
      }
    });
    return;
  }
  send(res, 404, 'text/plain', 'not found');
}

// Start on PORT; if it's already in use, quietly try the next few ports instead of
// crashing with EADDRINUSE. Prints the URL it actually bound to.
function start(port, attemptsLeft) {
  const server = http.createServer(handler);
  server.on('error', (e) => {
    if (e.code === 'EADDRINUSE' && attemptsLeft > 0) {
      console.log(`Port ${port} is busy — trying ${port + 1}…`);
      start(port + 1, attemptsLeft - 1);
    } else {
      console.error(`Could not start LP Studio: ${e.message}`);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    console.log('\n  LP Studio — build: region-casts + robust-extraction + paginated-pdf (R1–R26)');
    console.log(`\n  LP Studio → http://localhost:${port}\n`);
    console.log(process.env.KIE_API_KEY ? '  (kie.ai key loaded — new images can be generated)' : '  (no kie.ai key — store-only: only already-stored images render)');
    console.log('  Press Ctrl+C to stop.\n');
  });
}
start(Number(PORT) || 5178, 12);
