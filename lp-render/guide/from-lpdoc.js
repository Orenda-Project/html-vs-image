'use strict';
// ICT (NIETE) lp_doc → Guide.
//
// WHAT THIS IS. ICT's grades 6–12 pipeline authors a lesson as an `lp_doc` — typed JSON, no
// prose to parse — and renders it with its own template. This file is the fourth producer
// of the Guide object this renderer draws (after the markdown parser, the structuring model
// and a pasted guide): it turns an lp_doc into `{ meta, sections, images }` so an ICT lesson
// is drawn by this repo's renderer under the `ict` design pack.
//
// WHAT IT MAY DO AND MAY NOT. It is a MAPPING, not an author. Every string on the page comes
// from the lp_doc or from ICT's own label pack (vendored, verbatim) — nothing is reworded,
// summarised or invented, and no model is called. What ICT's production renderer deliberately
// does not paint, this does not paint either, and each such omission is written into the
// report so it is a recorded decision rather than a silent loss.
//
// WHOSE RULES. ICT's, as its v9 template applies them (niete/bot/vendor/lp-v9/lib/template.js):
//   • the lp_doc is lifted to schema 3.0 first, with ICT's own migrate.js;
//   • the Urdu page is ICT's `ur_overlay` applied with ICT's own applyOverlay();
//   • headings and labels are ICT's LABELS pack, English or Urdu;
//   • page 1: outcome box, resources line, then the five sections — the warm-up inside the
//     Introduction, common mistakes after Development, differentiation after the section
//     that carries the practice, the checkpoint / exit ticket / re-teach rule after the
//     Conclusion;
//   • the support pages: lettered in emission order so an absent section consumes no letter;
//     model answers and next-period are never painted; the exam bank only for grade 9+.
//
// Pure: same lp_doc in, same guide out. Throws on input ICT's renderer would also refuse.

const { toV3 } = require('./vendor/lp_doc_migrate');
const { applyOverlay, LABELS } = require('./vendor/lp_doc_overlay');
const { questionIndex } = require('./vendor/lp_doc_questions');
const { renderDiagram } = require('./vendor/lp_diagrams');
const { diagramLabel } = require('./vendor/lp_diagram_labels');
const { buildPageModel } = require('./lpdoc-pages');
const { texToUnicode } = require('./vendor/lp_diagrams/lib/tex');
const { requiredBox } = require('./vendor/lp_diagrams/lib/svg');

// LABELS ARE PLAIN TEXT in this renderer (card labels, list leads, headings, captions), and ICT
// puts maths in them — "Worked example: $A^{-1}$ (p.68)". ICT's own diagram engine carries a TeX
// to Unicode converter for exactly this (a figure label cannot hold KaTeX), so a label reads
// "A⁻¹ (p.68)" instead of printing its source. Chemistry first: \ce{H2O} -> H₂O.
const SUB = { 0: '₀', 1: '₁', 2: '₂', 3: '₃', 4: '₄', 5: '₅', 6: '₆', 7: '₇', 8: '₈', 9: '₉' };
const plainChem = (x) => x.replace(/\\ce\{((?:[^{}]|\{[^{}]*\})*)\}/g, (_, b) => b
  .replace(/([A-Za-z)\]])(\d+)/g, (m, a, d) => a + d.replace(/\d/g, (c) => SUB[c]))
  .replace(/<->|<=>/g, '⇌').replace(/->(\[[^\]]*\])*/g, '→'));
const plainLabel = (v) => (typeof v === 'string' && /\$|\\ce\{/.test(v)
  ? texToUnicode(plainChem(v))
  : v);

// ICT's engine returns an SVG sized "width=100%" for inlining in ICT's page. Drawn here as an
// <img> (a data URI: isolated, no markup reaches the page), it needs an intrinsic size, which
// its own viewBox supplies — the page then scales it to the column by aspect ratio.
//
// THE SIZE IS ICT'S OWN SLOT (template.js figureSlot, v9.3): a figure is drawn as small as its
// smallest label allows and never wider than the column — the engine's requiredBox() gives the
// width at which that label reaches the floor. On the phone page the drawing column is 455px
// (520 − 2×21 page margin − 23 figure chrome) and the floor is 13.5px scaled by that column
// against A4's 729: 8.43px. So a hundred-square with large cells prints compact and a mind map
// with small labels prints full width, exactly as ICT prints them.
const FIG_COL_PX = 520 - 2 * 21 - (10 * 2 + 3);                 // 455
const FIG_MIN_PX = +(13.5 * (FIG_COL_PX / (794 - 2 * 21 - 23))).toFixed(2);   // 8.43
function sizedSvg(svg) {
  const head = /<svg\b[^>]*>/.exec(svg);
  const vb = head && /viewBox="\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*"/.exec(head[0]);
  if (!vb) return svg;
  let w = Number(vb[1]); let h = Number(vb[2]);
  try {
    const box = requiredBox(svg, { minPx: FIG_MIN_PX, colPx: FIG_COL_PX });
    const slotW = Math.min(FIG_COL_PX, box.minWidthPx);
    if (slotW > 0 && w > 0) { h = +(slotW * h / w).toFixed(1); w = slotW; }
  } catch (_) { /* no viewBox the sizer can read — the figure's own size stands */ }
  const tag = head[0].replace(/\s(width|height)="[^"]*"/g, '').replace(/^<svg\b/, `<svg width="${w}" height="${h}"`);
  return tag + svg.slice(head[0].length);
}

const REGION = 'ict';
const STAGES = ['introduction', 'development', 'activity', 'conclusion', 'homework'];

// ICT's own draw-order clean-up (template.js unnumber): the list is numbered by the renderer,
// so an author's "1." must not print twice.
const unnumber = (s) => String(s == null ? '' : s)
  .replace(/^\s*[0-9\u0660-\u0669\u06F0-\u06F9]{1,2}\s*[.)\u06D4\u060C:\u2013-]\s+/, '');

// Bold a span only when bold can survive it: richText renders maths before markdown, so a
// `**…**` wrapped around `$…$` would print its asterisks.
const strong = (s) => {
  const t = String(s == null ? '' : s).trim();
  return !t || /\$|\*\*|\\ce\{/.test(t) ? t : `**${t}**`;
};
const has = (v) => v != null && String(v).trim() !== '';
// AN ANSWER, as ICT prints one: bold green words and green maths. The renderer bolds plain text
// only — a ** pair cannot span a $…$ run — so an answer with maths in it came out in ink. Each
// run of words gets its own bold and each maths run its own colour (\color, which KaTeX and
// MathJax both read). Display maths ($$…$$) is left exactly as written.
// \color is used as a SWITCH (no braces round the formula): braced, the whole formula became
// one group and could no longer break at its + and =, so a long answer ("Sum = 73 + 79 + … =
// 756") ran off the page where ICT's own page wraps it.
const ANSWER_INK = '#1F7A4D';
const boldRuns = (s, mathInk) => {
  const t = String(s == null ? '' : s).trim();
  if (!t.includes('$') || t.includes('$$')) return strong(t);
  return t.split(/(\$[^$]+\$)/g).map((p) => {
    if (/^\$[^$]+\$$/.test(p)) return mathInk ? `$\\color{${mathInk}}${p.slice(1, -1)}$` : p;
    const w = p.trim();
    return w ? p.replace(w, strong(w)) : p;
  }).join('');
};
const answerText = (s) => boldRuns(s, ANSWER_INK);

// THE RENDERER BOLDS A SHORT "Label:" AT THE START OF A LINE (math.js mdInline) — right for
// the markdown producers, wrong here. An lp_doc marks emphasis explicitly with **…**, and ICT
// prints "Draw the leaf and label four arrows: sunlight…" in plain type; left alone, this
// renderer bolded the first half of it. A WORD JOINER (U+2060, zero-width, never drawn)
// after such a colon fails that rule's lookahead and changes nothing a reader can see. Only
// a colon that rule would actually fire on is touched; an authored **Label:** already has
// its asterisks after the colon and never matches.
const AUTO_LABEL = /(^|\n)(\s*[^:<>\n*]{2,42}):(?=\s|$)/g;
const noAutoBold = (v) => (typeof v === 'string' ? v.replace(AUTO_LABEL, '$1$2:\u2060') : v);
// INLINE CHEMISTRY. ICT's text grammar (lib/rich.js) reads a bare \ce{…} as inline mhchem;
// this renderer's richText reads maths only between dollar signs. So a bare \ce{…} is given its
// dollars — a change of notation, not of content — using ICT's own tokeniser, so a \ce that is
// already inside $…$ is left exactly as it is. KaTeX here carries no mhchem and MathJax does,
// so any card with chemistry in it is drawn by MathJax.
const ICT_MATH = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$|\\ce\{((?:[^{}]|\{[^{}]*\})*)\}/g;
const dollarChem = (v) => (typeof v === 'string' && v.includes('\\ce{')
  ? v.replace(ICT_MATH, (m, _d, _i, ce) => (ce !== undefined ? `$\\ce{${ce}}$` : m))
  : v);
// ICT's own render decision (lib/rich.js, "a matrix is never typeset as a subscript"): an
// inline matrix is promoted to \displaystyle — the same maths, at full height, in the line.
const MATRIX_ENV = /\\begin\{(?:[bBpvV]?matrix|smallmatrix|array|cases|aligned)\}/;
const displayMatrices = (v) => (typeof v === 'string' && MATRIX_ENV.test(v)
  ? v.replace(ICT_MATH, (m, d, i) => (i !== undefined && MATRIX_ENV.test(i) && !/\\displaystyle/.test(i) ? `$\\displaystyle ${i}$` : m))
  : v);
const prep = (v) => noAutoBold(displayMatrices(dollarChem(v)));

// Maths that does not parse is printed as its source by ICT's renderer and in red by this one.
// It is the lesson's defect, not the renderer's, so it is reported rather than rewritten.
const katex = require('katex');
function badMaths(v, out, where) {
  if (typeof v !== 'string' || !v.includes('$')) return;
  const re = /\$\$([\s\S]+?)\$\$|\$([^$]+?)\$/g;
  let m;
  while ((m = re.exec(v)) !== null) {
    const src = m[1] !== undefined ? m[1] : m[2];
    if (/\\ce\{/.test(src)) continue;          // chemistry is MathJax's, not KaTeX's
    try { katex.renderToString(src, { throwOnError: true }); } catch (e) {
      out.push(`${where}: maths does not parse — ${src.slice(0, 60)} (${String(e.message).replace(/^KaTeX parse error: /, '').slice(0, 60)})`);
    }
  }
}

let MATH_SINK = null;   // set for the duration of one buildGuideFromLpDoc call (it is synchronous)
function guardText(sec) {
  if (!sec || typeof sec !== 'object') return sec;
  for (const k of ['label', 'lead', 'heading', 'caption']) if (typeof sec[k] === 'string') sec[k] = plainLabel(sec[k]);
  for (const k of ['a', 'b']) if (sec[k] && typeof sec[k].label === 'string') sec[k].label = plainLabel(sec[k].label);
  let chem = false;
  const fix = (v) => {
    if (typeof v === 'string' && v.includes('\\ce{')) chem = true;
    const out = prep(v);
    if (MATH_SINK) badMaths(out, MATH_SINK, sec.id || sec.cls || 'card');
    return out;
  };
  if (typeof sec.body === 'string') sec.body = fix(sec.body);
  for (const it of sec.items || []) if (it && typeof it.text === 'string') it.text = fix(it.text);
  for (const it of sec.items || []) for (const k of ['q', 'a']) if (it && typeof it[k] === 'string') it[k] = fix(it[k]);   // qa cards
  for (const k of ['a', 'b']) if (sec[k] && typeof sec[k].body === 'string') sec[k].body = fix(sec[k].body);
  for (const it of sec.items || []) if (it && typeof it.tex === 'string' && it.tex.includes('\\ce{')) chem = true;
  for (const k of ['left', 'right']) (sec[k] || []).forEach(guardText);
  if (chem) sec.engine = 'mathjax';
  return sec;
}
const lines = (...xs) => xs.filter(has).join('\n');

function buildGuideFromLpDoc(input, { lang } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new TypeError('lp_doc must be an object');
  }
  const v3 = toV3(input);
  const prov = v3.provenance || {};
  const medium = String(prov.medium || 'en');
  const want = String(lang || medium);
  if (!LABELS[want]) throw new Error(`lp_doc: no ICT label pack for language "${want}"`);
  // An English-medium lesson asked for in Urdu with no overlay would print English content
  // under Urdu headings. ICT's renderer never produces that page; neither does this.
  if (want === 'ur' && medium !== 'ur' && !v3.ur_overlay) {
    throw new Error('lp_doc: Urdu requested but this English-medium lesson carries no ur_overlay');
  }
  const { doc, errors } = applyOverlay(v3, want);
  // ICT refuses the whole lesson on a bad overlay (OVERLAY_INVALID) rather than print a
  // half-translated page. Same here.
  if (errors.length) throw new Error(`lp_doc: ur_overlay invalid — ${errors.join('; ')}`);

  const L = LABELS[want];
  const AR = want === 'ur' ? '←' : '→';
  const grade = prov.grade == null ? null : Number(prov.grade);
  const report = {
    lang: want,
    migratedFrom: v3.__migrated_from || null,
    notPrinted: [],   // present in the lp_doc, deliberately not painted (ICT's own rule)
    unrendered: [],   // should be on the page, and is not yet drawn by this renderer
    warnings: [],
  };
  const sections = [];
  const images = [];
  MATH_SINK = report.warnings;

  // A diagram block, drawn by ICT's own engine. The engine draws the caption inside the SVG
  // (ICT's template prints no second one), so the card carries none — only, on a teaching
  // figure, ICT's badge naming what the figure is ("Geometry", "Mind map"; its own table, in the
  // lesson's language). The board plan on the support page wears no badge in ICT's design either.
  // An unknown or broken spec is not a blank box: it prints a labelled placeholder and is
  // reported, as ICT does.
  // Memoised by spec: the page model (lpdoc-pages.js) asks for the same figures, and each one is
  // drawn — and listed in guide.images — once.
  const drawn = new Map();
  const diagramBody = (spec, where, opts = {}) => {
    if (spec && drawn.has(spec)) return drawn.get(spec);
    const out = drawDiagram(spec, where, opts);
    if (spec) drawn.set(spec, out);
    return out;
  };
  const drawDiagram = (spec, where, { badge = false } = {}) => {
    const sp = spec || {};
    try {
      const svg = sizedSvg(renderDiagram(sp));
      const id = `ict-dg-${images.length + 1}`;
      images.push({ id, label: badge ? diagramLabel(sp.type, want) : '', concept: 'diagram',
        dataUri: `data:image/svg+xml;base64,${Buffer.from(svg, 'utf8').toString('base64')}` });
      return { role: 'diagram', type: 'images', imageIds: [id] };
    } catch (e) {
      report.unrendered.push({ type: 'diagram', spec: sp.type || null, where, why: String(e.message).slice(0, 200) });
      return { role: 'diagram', type: 'note', label: `⚠ diagram not drawn — ${String(sp.type || '?').replace(/_/g, ' ')}`, body: sp.caption || sp.alt || '' };
    }
  };

  // ── one block → one body ─────────────────────────────────────────────────────────────
  // A body is a renderer section without its heading: `type` + that type's fields, plus
  // `role` (which becomes the card's ict-r-<role> class for the design pack).
  const answerItem = (q, a) => `${q} ${AR} ${answerText(a)}`;
  const body = (b) => {
    if (!b || typeof b !== 'object') return null;
    switch (b.type) {
      case 'paragraph':
        return { role: 'para', type: 'text', body: b.text };
      case 'say': // schema 2.0 only; toV3 turns it into a paragraph, kept for safety
        return { role: 'say', type: 'note', label: L.say, body: `“${b.text}”` };
      case 'ask':
        return {
          role: b.hook ? 'hook' : 'ask', type: 'note', label: b.hook ? L.ask : L.askPlain,
          body: lines(strong(b.question), has(b.look_for) ? `**${L.lookFor}:** ${b.look_for}` : ''),
        };
      case 'watch_out':
        return { role: 'watch', type: 'note', label: `⚠ ${L.watch}`, body: b.text };
      case 'board':
        return { role: 'board', type: 'note', label: L.board, body: b.text };
      case 'keywords':
        return {
          role: 'keywords', cls: 'lp-grid-rows', type: 'bullets', lead: `🔑 ${L.keywords}`,
          items: (b.items || []).map((k) => ({ text: `${strong(k.word)} — ${k.meaning}` })),
        };
      case 'key_points': {
        const lead = b.title === undefined ? L.keyPoints : b.title;
        return { role: 'keypoints', type: 'bullets', lead: lead || undefined, items: (b.items || []).map((t) => ({ text: t })) };
      }
      case 'table': {
        const cols = b.columns || [];
        // ICT pads a ragged row rather than dropping or shifting it (bd-a8veu.21).
        const rows = (b.rows || []).map((r) => cols.map((_, i) => (r && r[i] != null ? r[i] : '')));
        if ([...cols, ...rows.flat()].some((c) => /\$|\*\*|\\ce\{/.test(String(c)))) {
          report.warnings.push('table cell carries maths or bold — this renderer prints table cells as plain text');
        }
        return { role: 'table', type: 'table', columns: cols, rows, caption: b.title || undefined };
      }
      case 'worked_example':
      case 'faded_example': {
        const worked = b.type === 'worked_example';
        const steps = (b.steps || []).map((s, i) => `${i + 1}. ${s}`).join('\n');
        const tail = worked
          ? (has(b.result) ? answerText(b.result) : '')
          : (has(b.answer) ? answerText(`${L.answer}: ${b.answer}`) : '');
        return {
          role: worked ? 'worked' : 'faded', type: 'note',
          label: b.title || (worked ? L.worked : L.faded), body: lines(b.prompt, steps, tail),
        };
      }
      case 'practice':
        return {
          role: 'practice', type: 'bullets', marker: 'num',
          lead: b.title || (b.mode === 'guided' ? L.guided : b.mode === 'independent' ? L.independent : L.practice),
          items: (b.items || []).map((it) => ({
            text: answerItem(it.q, it.a),
            tag: it.tier && it.tier !== 'core' ? (L.tier[it.tier] || it.tier) : undefined,
          })),
        };
      case 'support_extension':
        return {
          role: 'supext', type: 'duo',
          a: { label: L.support, body: b.support }, b: { label: L.extension, body: b.extension },
        };
      case 'latex':
        // A display formula cannot wrap, and a long one ran off its card. As \displaystyle
        // maths in a line it keeps its size and may break after = and +, as KaTeX allows.
        if (String(b.tex || '').replace(/\\[a-zA-Z]+|[{}\s]/g, '').length > 44) {
          return { role: 'latex', cls: 'ict-math-wrap', type: 'text', body: lines(`$\\displaystyle ${b.tex}$`, b.caption) };
        }
        return { role: 'latex', type: 'math', items: [{ tex: b.tex, label: b.caption }] };
      case 'chem':
        // ICT writes \ce{…}; KaTeX here has no mhchem, MathJax does.
        return { role: 'chem', type: 'math', engine: 'mathjax', items: [{ tex: `\\ce{${b.tex}}`, label: b.caption }] };
      case 'textbook_figure':
        report.unrendered.push({
          type: 'textbook_figure', ref: b.ref || null, src: b.src || null,
          why: 'the book crop is not embedded yet — printed as a book reference, the way ICT prints a missing crop',
        });
        return {
          role: 'figure', type: 'note', label: b.figure_label || '',
          body: lines(`**● ${L.figureIn}${has(b.page) ? `, ${L.page}${b.page}` : ''}**`, b.caption,
            has(b.legend) ? `**${L.reading}:** ${b.legend}` : ''),
        };
      case 'diagram':
        return diagramBody(b.spec, 'flow', { badge: true });
      case 'split': {
        const side = (list) => (list || []).flatMap((x) => (x && x.type === 'split' ? [...(x.left || []), ...(x.right || [])] : [x]))
          .map(body).filter(Boolean).map(({ role, ...rest }) => ({ ...rest, cls: `ict-r-${role}` }));
        return { role: 'split', type: 'split', ratio: b.ratio, left: side(b.left), right: side(b.right) };
      }
      default:
        report.warnings.push(`unknown block type "${b.type}" — skipped (ICT's renderer skips it too)`);
        return null;
    }
  };

  // Every card of one stage carries the stage's heading and minutes; the renderer draws the
  // bar once and treats the rest as the same section continuing.
  const push = (spec, { heading = '', time = '', stage = '' } = {}) => {
    if (!spec) return;
    const { role, cls, ...rest } = spec;
    // Only a LIST may continue overleaf (between items, or between rows of a card grid);
    // every other card moves whole.
    const atomic = rest.type !== 'bullets' ? 'lp-atomic' : '';
    sections.push(guardText({
      ...rest, id: `ict-${role}`, heading, time,
      cls: ['ict', stage && `ict-st ict-st-${stage}`, `ict-r-${role}`, cls, atomic].filter(Boolean).join(' '),
    }));
  };

  // ── page 1 — furniture ───────────────────────────────────────────────────────────────
  const O = doc.objectives || {};
  if (doc.sequence) {
    const s = doc.sequence;
    push({
      role: 'seq', type: 'text',
      // one line each, as ICT's strip prints them: where the class came from, this lesson, the checkpoint
      body: lines(has(s.previous) ? `**${L.seqPrev}:** ${s.previous} ${AR}` : '', strong(s.this),
        has(s.checkpoint) ? `**${L.seqCheck}:** ${s.checkpoint}` : ''),
    });
  }
  const fbise = Array.isArray(doc.fbise_slos) && doc.fbise_slos.length
    ? doc.fbise_slos.map((t) => `**${t.code}**${t.status && L.boardStatus[t.status] ? ` ${L.boardStatus[t.status]}` : ''}`).join(' · ')
    : '';
  push({
    role: 'outcome', type: 'note',
    label: `${L.outcome}${doc.slo && doc.slo.code ? ` · ${doc.slo.code}` : ''}${grade && grade < 9 ? ` · ${L.noBoardExam}` : ''}`,
    body: lines(strong(O.outcome), fbise, has(O.by_the_end) ? `**✓** ${O.by_the_end}` : ''),
  });
  // bd-a8veu.3: ICT paints ONE outcome voice; the SLO wording and the objective list stay
  // in the document (the linter gates on them) and stop being painted.
  report.notPrinted.push('slo.text_verbatim and objectives.items — ICT paints the outcome box only (bd-a8veu.3)');

  const secs = Array.isArray(doc.sections) ? doc.sections : [];
  const dev = secs.find((s) => s && s.id === 'development');
  const video = dev && dev.video;
  const intro = secs.find((s) => s && s.id === 'introduction');
  const kwHoisted = intro && (intro.blocks || []).find((b) => b && b.type === 'keywords');
  const pacing = secs.map((s) => Number(s.minutes) || 0);
  // ICT's resource card: one tinted row each for the video (amber), the materials (green) and
  // the pacing (blue), each with its icon, then the key words (grey). The video row names the
  // video; the channel and length stay in the document, as ICT prints them.
  if (video && has(video.title)) push({ role: 'rvideo', type: 'text', body: `📺 **${L.video}** ${video.title}` });
  if ((doc.materials || []).length) push({ role: 'rmat', type: 'text', body: `🧰 **${L.materials}** ${doc.materials.join(' · ')}` });
  if (pacing.length) push({ role: 'rpace', type: 'text', body: `⏱ **${L.pacing}** ${pacing.join(' + ')} = ${pacing.reduce((a, b) => a + b, 0)} ${L.min}` });
  if (kwHoisted) push(body(kwHoisted));

  // ── page 1 — the five sections ───────────────────────────────────────────────────────
  const P2 = doc.page2 || {};
  const practiceHost = secs.find((s) => (s.blocks || []).some((b) => b && (b.type === 'practice' || b.type === 'faded_example')));
  const hosts = { mistakes: dev ? 'development' : null, differentiation: practiceHost ? practiceHost.id : null };
  // ICT's misconception card: what the pupil writes on a terracotta band over the question the
  // teacher asks back on a green one, one card per mistake. In the flow the group carries its own
  // label; on the support page the section bar names it.
  const mistakesBody = () => ({
    role: 'mistakes', cls: 'lp-grid-rows', type: 'qa',
    items: (P2.mistakes || []).map((m) => ({ q: `**✗ ${L.pupilSays}**\n${m.pupil_says}`, a: `**✓ ${L.youAsk}**\n${m.you_ask}` })),
  });
  const mistakesLabel = () => ({ role: 'grouplabel', type: 'text', body: L.p2Mistakes });
  const diffBody = () => ({
    role: 'diff', cls: 'lp-grid-rows', type: 'bullets', lead: L.p2Diff,
    items: [[L.stuck, P2.differentiation.stuck], [L.barrier, P2.differentiation.barrier], [L.early, P2.differentiation.early]]
      .filter(([, v]) => has(v)).map(([k, v]) => ({ text: `**${k}**\n${v}` })),
  });

  for (const s of secs) {
    if (!s || typeof s !== 'object') continue;
    if (!STAGES.includes(s.id)) report.warnings.push(`section id "${s.id}" is outside ICT's closed heading system`);
    const ctx = {
      heading: s.title || L[s.id] || s.id,
      time: Number(s.minutes) > 0 ? `${s.minutes} ${L.min}` : '',
      stage: s.id,
    };
    const put = (spec) => push(spec, ctx);
    if (s.id === 'introduction' && s.warmup) {
      put({
        role: 'warmup', type: 'bullets', marker: 'num', lead: L.warmup,
        items: (s.warmup.items || []).map((it) => ({
          text: answerItem(it.q, it.a),
          tag: `${L.kind[it.kind] || it.kind}${has(it.from) ? ` · ${it.from}` : ''}`,
        })),
      });
    }
    if (s.id === 'development' && has(s.textbook_page)) {
      put({ role: 'cite', type: 'text', body: `${L.fromBook} ${L.page}${s.textbook_page}` });
    }
    for (const b of s.blocks || []) {
      if (kwHoisted && b === kwHoisted) continue;
      put(body(b));
    }
    if (s.id === hosts.mistakes && (P2.mistakes || []).length) { put(mistakesLabel()); put(mistakesBody()); }
    if (s.id === hosts.differentiation && P2.differentiation) put(diffBody());
    if (s.id === 'conclusion') {
      if (s.checkpoint) {
        const c = s.checkpoint;
        put({
          role: 'checkpoint', type: 'note', label: `${L.checkpoint}${c.marks ? ` · ${c.marks} ${L.marks}` : ''}`,
          body: lines(strong(c.question), (c.mark_scheme || []).map((m) => `- ${m}`).join('\n')),
        });
      }
      if ((s.exit_ticket || []).length) {
        put({
          role: 'exit', type: 'bullets', marker: 'num', lead: L.exitTicket,
          items: s.exit_ticket.map((x) => ({ text: answerItem(x.q, x.a) })),
        });
      }
      if (has(s.reteach_rule)) put({ role: 'reteach', type: 'note', label: L.reteach, body: s.reteach_rule });
    }
    if (s.id === 'homework' && s.homework && (s.homework.items || []).length) {
      put({
        role: 'hw', type: 'bullets', marker: 'num',
        items: s.homework.items.map((it) => {
          const src = it.source && [it.source.paper, it.source.questions, has(it.source.page) ? `${L.page}${it.source.page}` : null].filter(Boolean);
          return {
            text: `${it.text}${src && src.length ? ` (${src.join(', ')})` : ''}`,
            tag: it.level ? `[${it.level}]${it.marks ? ` ${it.marks}${L.markAbbr}` : ''}` : undefined,
          };
        }),
      });
    }
  }
  if (secs.length) push({ role: 'continues', type: 'text', body: L.continues });

  // ── the support pages ───────────────────────────────────────────────────────────────
  push({
    role: 'p2head', type: 'text', cls: 'lp-break-before',   // ICT starts the support pages on a fresh page
    body: lines(`**${L.supportPage}**`, `${L.grade} ${prov.grade} ${prov.subject || ''} · ${L.page}${prov.printed_pages || ''}`, strong(prov.topic)),
  });
  let letter = 0;
  const S = (label, specs) => {
    const list = specs.filter(Boolean);
    if (!list.length) return;               // an absent section consumes no letter
    const L1 = 'ABCDEFGHIJ'[letter++];
    for (const spec of list) push(spec, { heading: label, stage: `p2 ict-p2-${L1.toLowerCase()}` });
  };

  const B = P2.board_final;
  if (B) {
    const specs = [];
    if (B.diagram) {
      specs.push(diagramBody(B.diagram, 'board plan'));
      // ICT prints the board caption only when it says something the diagram's own does not.
      if (has(B.caption) && B.caption !== B.diagram.caption) specs.push({ role: 'boardcap', type: 'text', body: B.caption });
    }
    if ((B.draw_order || []).length) {
      specs.push({ role: 'draworder', type: 'bullets', marker: 'num', lead: L.drawOrder, items: B.draw_order.map((d) => ({ text: unnumber(d) })) });
    }
    S(L.p2Board, specs);
  }
  if ((P2.model_answers || []).length) {
    report.notPrinted.push('page2.model_answers — ICT never paints them; homework answers only (bd-ir1aq)');
  }
  S(L.p2Mistakes, [!hosts.mistakes && (P2.mistakes || []).length ? mistakesBody() : null]);
  S(L.p2Diff, [!hosts.differentiation && P2.differentiation ? diffBody() : null]);

  const eb = P2.exam_bank || {};
  const fbiseGrade = grade == null || grade >= 9;
  if (!fbiseGrade && Object.keys(eb).length) {
    report.notPrinted.push('page2.exam_bank — printed for grade 9+ only; FBISE does not examine grades 6–8 (bd-a8veu.18)');
  }
  if (fbiseGrade) {
    const letterOf = (i) => 'ABCDE'[i];
    const isAnswer = (opt, i, ans) => ans != null
      && (String(ans).trim() === String(opt).trim() || String(ans).trim().toUpperCase() === letterOf(i));
    // ICT's MCQ card: the question, the options as chips with the key in green, and the teacher
    // note naming what each wrong option catches. One card per question, under the group label.
    const mcq = (eb.mcq || []).map((q) => {
      const wrong = q.options.map((o, i) => ({ o, i })).filter(({ o, i }) => !isAnswer(o, i, q.answer));
      const notes = (q.distractor_codes || []).map((c, k) => (wrong[k] ? `**${letterOf(wrong[k].i)}** ${c}` : null)).filter(Boolean);
      return {
        role: 'mcq', type: 'split',
        left: [
          { cls: 'ict-r-mcqq', type: 'text', body: boldRuns(q.q) },
          { cls: 'ict-r-mcqopts', type: 'bullets',
            // the key carries a ✓ tag, which the pack turns into ICT's green chip
            items: q.options.map((o, i) => ({ text: `**${letterOf(i)}.** ${o}`, tag: isAnswer(o, i, q.answer) ? '✓' : undefined })) },
          notes.length ? { cls: 'ict-r-mcqnote', type: 'text', body: `**${L.teacherNote}** ${L.distractors}: ${notes.join(' · ')}` } : null,
        ].filter(Boolean),
        right: [],
      };
    });
    const srqLabel = grade != null && grade >= 9 ? L.srq : L.srqEarly;
    const erq = eb.erq_skeleton;
    S(L.p2Exam, [
      mcq.length ? { role: 'grouplabel', type: 'text', body: L.mcq } : null,
      ...mcq,
      // the short-response question on navy, its mark scheme on a green card of its own
      eb.srq ? {
        role: 'srq', type: 'note', label: `${srqLabel}${eb.srq.marks ? ` · ${eb.srq.marks} ${L.marks}` : ''}`,
        body: strong(eb.srq.q),
      } : null,
      eb.srq && (eb.srq.mark_scheme || []).length ? {
        role: 'srqms', type: 'bullets', lead: L.markScheme, items: eb.srq.mark_scheme.map((m) => ({ text: m })),
      } : null,
      // the long question: its label, the question, then the plan with each part's marks at the end
      erq ? {
        role: 'erq', type: 'split',
        left: [
          { cls: 'ict-r-erqq', type: 'note', label: `${L.erq}${erq.marks_total ? ` · ${erq.marks_total} ${L.marks}` : ''}`, body: boldRuns(erq.q) },
          (erq.parts || []).length ? { cls: 'ict-r-erqplan', type: 'bullets',
            items: erq.parts.map((pt) => ({ text: `${pt.heading}${has(pt.note) ? ` — ${pt.note}` : ''}`, tag: pt.marks ? `${pt.marks} ${L.marks}` : undefined })) } : null,
        ].filter(Boolean),
        right: [],
      } : null,
      has(eb.how_marked) ? { role: 'howmarked', type: 'text', body: `**${L.howMarked}:** ${eb.how_marked}` } : null,
    ]);
  }

  const Q = questionIndex(doc);
  S(L.p2Hw, [(P2.homework_key || []).length ? {
    role: 'hwkey', cls: 'lp-grid-rows', type: 'bullets',
    items: P2.homework_key.map((h) => {
      const it = h.ref ? Q.get(h.ref) : null;
      const head = [h.ref, h.marks ? `${h.marks} ${L.marks}` : ''].filter(Boolean).join(' · ');
      // ICT sets the answer on its own line in green, with no arrow
      return { text: lines(head ? `**${head}**` : '', it ? it.q : (h.item || L.refMissing), answerText(h.answer)) };
    }),
  } : null]);
  // ICT's production template stopped painting these (bd-a8veu.20); NIETE's approved page design
  // prints the next lesson as COMING UP and "Tomorrow:", so the page model does — "not going" stays out
  if (has(P2.not_going)) report.notPrinted.push('page2.not_going — not painted (bd-a8veu.20)');
  if (has(P2.coaching_lookfor)) {
    S(L.p2Coach, [{
      role: 'coach', type: 'text',
      body: lines(P2.coaching_lookfor, has(P2.coaching_reflection) ? `**${L.coachAsk}:** ${P2.coaching_reflection}` : ''),
    }]);
    // The CTA's phone number is redacted in the code mirror we vendor from, so the offer line
    // is withheld rather than printed with a placeholder in it.
    report.unrendered.push({ type: 'coaching_offer', why: 'the WhatsApp number is redacted in the mirror — needs the real line from ICT' });
  }

  // The approved NIETE page design, as a plain data model the ict pack lays out (lpdoc-pages.js).
  const layout = buildPageModel({
    doc, want, L, grade, prov, report, has, plainLabel, unnumber, questionIndex,
    fix: (v) => prep(String(v)),
    diagram: (spec, where, opts) => { const r = diagramBody(spec, where, opts); return r && r.imageIds ? r.imageIds[0] : null; },
  });

  const pages = String(prov.printed_pages || '');
  const meta = {
    id: doc.lesson_id || `${prov.book_stem || 'lp'}-${prov.topic || ''}`,
    title: plainLabel(prov.topic || doc.lesson_id || ''),
    subtitle: [grade != null ? `${L.grade} ${grade}` : '', prov.subject].filter(Boolean).join(' · '),
    locale: want,
    region: REGION,
    subject: prov.subject || '',
    grade: grade == null ? '' : String(grade),
    // ICT's hero (v9.3): chapter / "p.24-25 · 40 min" / what the topic is worth in the board
    // exam, one per line. board_weight is absent for grades 6-8 (outside FBISE's remit), and
    // then ICT paints no chip at all. The internal lp_type key is never printed.
    chips: [prov.chapter,
      [pages ? `${L.page}${pages}` : '', doc.period_minutes ? `${doc.period_minutes} ${L.min}` : ''].filter(has).join(' · '),
      doc.board_weight]
      .filter(has).map((value) => ({ label: '', value: String(value) })),
    footer: [[grade != null ? `${L.grade} ${grade}` : '', prov.subject].filter(Boolean).join(' '), prov.chapter, pages ? `${L.pp}${pages}` : '']
      .filter(has).join(' · '),
    // the ict pack's page chrome (PAGE_NUMBER_STYLE 'foot-band'), in ICT's own words
    pageLabel: L.pageOf('{n}', '{m}'),
    runTitle: plainLabel(prov.topic || ''),
    continuedLabel: L.continued,
  };
  MATH_SINK = null;
  for (const s of sections) for (const it of (s.type === 'math' ? s.items || [] : [])) {
    if (s.engine !== 'mathjax') badMaths(`$${it.tex}$`, report.warnings, s.id);
  }
  return { guide: { meta, sections, images, layout: { kind: 'ict-pages', ...layout } }, report };
}

// IS THIS AN ICT lp_doc, and not a Guide? A Guide's sections carry a `type`; an lp_doc's carry
// `blocks`, and every lp_doc has `provenance` or `page2`. LP Studio and scripts/render-lpdoc.js
// use this to send an ICT file through the adapter instead of reading it as a finished guide —
// read as a guide, an lp_doc renders as blank cards.
function isLpDoc(v) {
  return !!v && typeof v === 'object' && !Array.isArray(v) && Array.isArray(v.sections)
    && v.sections.some((s) => s && Array.isArray(s.blocks))
    && !!(v.provenance || v.page2);
}

module.exports = { buildGuideFromLpDoc, isLpDoc, REGION };
