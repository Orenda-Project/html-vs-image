#!/usr/bin/env node
'use strict';
// Render an ICT (NIETE) lesson to PDF with this repo's renderer, locally.
//
//   node scripts/render-lpdoc.js <lp_doc.json | lesson.json> [--lang en|ur] [--out <dir>] [--svg]
//   npm run render:ict -- lp-render/fixtures/ict/niete_v9_gate_base.lp.json
//   npm run render:ict -- lp-render/fixtures/ict-primary/g1_ch9_Maths_seg1.lesson.json
//
// Two kinds of input: a grades 6–12 lp_doc (below), or a Grades 1–5 "ict-primary-lesson" file
// (lp-render/guide/from-primary.js), which prints NIETE's approved Grades 1–5 phone pages
// (520×2000) with pictures drawn in code. --svg also writes each PDF page as an SVG file
// (pdftocairo, vector); it is on by default for Grades 1–5 lessons.
//
// lp_doc -> ICT adapter (lp-render/guide/from-lpdoc.js) -> Guide -> renderLessonImage with the
// ict design pack -> PDF. No model is called and no image is generated: an lp_doc carries no
// generated art and the adapter draws its diagrams with ICT's own engine, so this costs nothing
// and needs no API key. The PDF is NIETE's approved page design: portrait pages, one per stage
// (Start, Explanation, Practice, Conclusion) plus Teacher support, printed by Chrome from the HTML
// (vector, selectable text).
// Output goes to out/ict/ by default (git-ignored): the .pdf, the .html page it was printed from
// (HTML + SVG), a .png preview, the .guide.json and the adapter report.
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { buildGuideFromLpDoc, isLpDoc } = require('../lp-render/guide/from-lpdoc');
const { buildGuideFromPrimary, isPrimaryLesson } = require('../lp-render/guide/from-primary');
const { isSlideScript, lessonFromSlideScript } = require('../lp-render/guide/from-slide-script');
const { isPrimaryLpDoc, lessonFromLpDocPrimary } = require('../lp-render/guide/from-lpdoc-primary');
const { renderLessonImage } = require('../lp-render/pipeline');

function parseArgs(argv) {
  const out = { src: null, lang: undefined, dir: path.join(__dirname, '..', 'out', 'ict'), svg: false, origin: undefined, chapter: undefined };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--lang') out.lang = argv[++i];
    else if (argv[i] === '--svg') out.svg = true;
    else if (argv[i] === '--out') out.dir = path.resolve(argv[++i]);
    else if (argv[i] === '--origin') out.origin = argv[++i];   // where a slide script came from, for its source note
    else if (argv[i] === '--chapter') out.chapter = argv[++i]; // a slide script's chapter line (from its segmentation file)
    else if (!out.src) out.src = argv[i];
  }
  return out;
}

(async () => {
  const { src, lang, dir, svg, origin, chapter } = parseArgs(process.argv.slice(2));
  if (!src) {
    console.error('usage: node scripts/render-lpdoc.js <lp_doc.json | lesson.json | _slide_script.json> [--lang en|ur] [--out <dir>] [--svg] [--origin <text>] [--chapter <text>]');
    process.exit(2);
  }
  let doc = JSON.parse(fs.readFileSync(src, 'utf8'));
  // ICT's own Grades 1–5 slide script (Stage D0 of its K-5 pipeline) is turned into a Grades 1–5
  // lesson file first; the converted file is written beside the PDF so it can be read
  // A Grades 1–5 lp_doc (ICT's HTML path for Grades 1–5) is drawn on the Grades 1–5 page, not the
  // grades 6–12 one; it too is converted first and the converted file written beside the PDF
  const fromScript = isSlideScript(doc);
  const fromK5Doc = !fromScript && isPrimaryLpDoc(doc);
  if (fromScript) doc = lessonFromSlideScript(doc, { origin: origin || `ICT Grades 1–5 slide script ${path.basename(src)}`, chapter });
  if (fromK5Doc) doc = lessonFromLpDocPrimary(doc, { origin: origin || `ICT Grades 1–5 lp_doc ${path.basename(src)}` });
  const primary = isPrimaryLesson(doc);
  if (!primary && !isLpDoc(doc)) throw new Error(`${src} is neither an ICT lp_doc (no sections[].blocks with provenance/page2) nor an ict-primary-lesson file`);

  const { guide, report } = primary ? buildGuideFromPrimary(doc) : buildGuideFromLpDoc(doc, lang ? { lang } : {});
  const logs = [];
  const r = await renderLessonImage(guide, { apiKey: '', pdf: true, log: (m) => logs.push(m) });

  fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, `${guide.meta.id || 'lesson'}.${report.lang}`);
  fs.writeFileSync(`${base}.pdf`, r.pdf);
  fs.writeFileSync(`${base}.png`, r.png);
  fs.writeFileSync(`${base}.html`, r.html);   // the HTML + SVG page itself; open it in any browser
  fs.writeFileSync(`${base}.guide.json`, JSON.stringify(guide, null, 2));
  fs.writeFileSync(`${base}.report.json`, JSON.stringify(report, null, 2));
  if (fromScript || fromK5Doc) fs.writeFileSync(`${base}.lesson.json`, `${JSON.stringify(doc, null, 2)}\n`);

  const pages = (r.pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  // each page as a vector SVG (text as outlines, so it looks the same anywhere)
  const svgs = [];
  if (svg || primary) {
    for (let k = 1; k <= pages; k++) {
      const f = `${base}.page-${k}.svg`;
      execFileSync('pdftocairo', ['-svg', '-f', String(k), '-l', String(k), `${base}.pdf`, f]);
      svgs.push(f);
    }
  }
  console.log(logs.join('\n'));
  console.log(`\n${guide.meta.title} (${report.lang}) -> ${base}.pdf`);
  if (svgs.length) console.log(`  svg pages: ${svgs.map((f) => path.basename(f)).join(', ')}`);
  if (primary) {
    console.log(`  pages ${pages} · pictures drawn in code ${report.pictures} · images generated ${r.stats.generated} · overflow findings ${(r.overflow || []).length}`);
    for (const n of report.notPrinted) console.log(`  not printed: ${n}`);
  } else {
    console.log(`  pages ${pages} · diagrams ${guide.images.length} · images generated ${r.stats.generated} · overflow findings ${(r.overflow || []).length}`);
    for (const u of report.unrendered) console.log(`  not drawn yet: ${u.type}${u.spec ? ` (${u.spec})` : ''} — ${u.why}`);
    for (const w of report.warnings) console.log(`  warning: ${w}`);
    for (const n of report.notPrinted) console.log(`  not printed (ICT rule): ${n}`);
  }
  process.exit(0);
})().catch((e) => { console.error('render-lpdoc failed:', e.message); process.exit(1); });
