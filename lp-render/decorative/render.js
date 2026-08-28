'use strict';
// Generic, content-driven decorative renderer (RULES R1–R7).
// It ONLY styles what the content JSON gives it. It never rewords, summarizes,
// translates, or invents lesson content. Every string rendered is escaped
// content taken verbatim from the JSON.
const { esc } = require('../template/shell');
const { icon, hasIcon } = require('../template/icons');
const { headerMotifs, headTwinkle, sparkle } = require('./motifs');
const { accentFor } = require('./theme');
const { renderMath, richText, katexCss, cleanHeading } = require('../math/math');

// Label text: escaped and stripped of markdown noise. Direction is the page's —
// see cfText for why arithmetic is not special-cased.
const lbl = (v) => esc(cleanHeading(v == null ? '' : v));

const ALPHA = 'abcdefghijklmnopqrstuvwxyz';
const mark = (kind, i) => (kind === 'alpha' ? ALPHA[i] + ')' : kind === 'num' ? String(i + 1) : '•');

// small helpers for per-lesson character variation
function seedOf(str) { let h = 0; for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function rotate(arr, k) { const n = arr.length; if (!n) return arr.slice(); const s = ((k % n) + n) % n; return arr.slice(s).concat(arr.slice(0, s)); }

// A section header. Single-grade: a solid coloured tab (accent box, white icon+title).
// Multigrade (mg): a dark navy full-width bar (reference-matched). '' for empty heading.
function sectionHead(accent, section, i, mg) {
  const title = cleanHeading(section.heading);
  if (!title) return '';
  const time = section.time ? `<div class="s-time">${esc(cleanHeading(section.time))}</div>` : '';
  const ic = section.icon && hasIcon(section.icon) ? icon(section.icon, 22) : sparkle('#fff');
  if (mg) {
    return `<div class="s-head mg"><div class="s-bar"><span class="s-ic">${ic}</span>`
      + `<span class="s-title">${esc(title)}</span>${time}</div></div>`;
  }
  return `<div class="s-head"><div class="s-tab" style="background:var(${accent})">`
    + `<span class="s-ic">${ic}</span><span class="s-title">${esc(title)}</span></div>${time}</div>`;
}

// Faint decorative icons behind the title block (like a lesson-plan letterhead).
function headerBg() {
  const ic = (n, cls) => (hasIcon(n) ? `<div class="hb ${cls}">${icon(n, 60)}</div>` : '');
  return `<div class="hbwrap">${ic('blackboard', 'b1')}${ic('books', 'b2')}${ic('target', 'b3')}${ic('pencil', 'b4')}</div>`;
}

// An image shown INLINE inside a section, right under the point it explains.
function inlineImage(id, images) {
  const im = images[id];
  if (!im || !im.dataUri) return '';
  const cap = im.label ? `<div class="cap">${esc(cleanHeading(im.label))}</div>` : '';
  return `<div class="d-imgrow n1 d-inline-img"><div class="d-img${im.cover ? ' cover' : ''}">`
    + `<img src="${im.dataUri}" alt="${esc(cleanHeading(im.label || ''))}">${cap}</div></div>`;
}

function renderBody(section, accent, images) {
  const soft = `var(${accent}-soft)`;
  const ink = `var(${accent}-ink)`;
  switch (section.type) {
    case 'summary': {
      const rows = (section.items || []).map((it) =>
        `<div class="srow"><div class="sic">${esc(it.icon || '•')}</div>`
        + `<div class="stext">${it.label ? `<b>${esc(cleanHeading(it.label))}:</b> ` : ''}${richText(it.body || '', { engine: section.engine })}</div></div>`
      ).join('');
      return `<div class="d-summary">${rows}</div>`;
    }
    case 'duo': {
      // Two grades side by side — lower grade (a) teal, higher grade (b) gold. Each
      // column can show WHO HAS THE TEACHER: role "teacher" (filled dot) / "own" (ring).
      const col = (g, tok) => {
        if (!g || !(g.label || g.body)) return '';
        const role = g.role === 'teacher'
          ? '<span class="mk teacher"></span><span class="role">Teacher here</span>'
          : g.role === 'own'
            ? '<span class="mk own"></span><span class="role">On its own</span>' : '';
        return `<div class="d-col" style="--cc:var(${tok});--cc-soft:var(${tok}-soft)">`
          + `<div class="cc-h">${role}${esc(cleanHeading(g.label || ''))}</div>`
          + `<div class="cc-b">${richText(g.body || '', { engine: section.engine })}</div></div>`;
      };
      const cols = col(section.a, '--g-a') + col(section.b, '--g-b');
      return cols ? `<div class="d-duo">${cols}</div>` : '';
    }
    case 'schedule': {
      // Minute-by-minute rotation overview: time · phase · who has the teacher · pages.
      const dot = (who) => {
        if (who === 'a') return '<span class="who"><span class="dot" style="background:var(--g-a)"></span>Teacher with ' + esc(section.gradeA || 'Grade A') + '</span>';
        if (who === 'b') return '<span class="who"><span class="dot" style="background:var(--g-b)"></span>Teacher with ' + esc(section.gradeB || 'Grade B') + '</span>';
        return '<span class="who">Whole class</span>';
      };
      const rows = (section.items || []).map((it) =>
        `<tr><td class="t">${esc(cleanHeading(it.time || ''))}</td><td>${richText(it.phase || '', { engine: section.engine })}</td>`
        + `<td>${dot(it.teacher)}</td><td>${esc(cleanHeading(it.pages || ''))}</td></tr>`).join('');
      return `<table class="d-sched"><thead><tr><th>Time</th><th>What happens</th><th>Who has the teacher</th><th>Pages</th></tr></thead><tbody>${rows}</tbody></table>`;
    }
    case 'table': {
      // A simple grid (e.g. a board-prep place-value table). Optional grade colour.
      const tok = section.grade === 'b' ? '--g-b' : section.grade === 'a' ? '--g-a' : null;
      const style = tok ? ` style="--cc:var(${tok});--cc-soft:var(${tok}-soft);--cc-ink:var(${tok}-ink)"` : '';
      const cap = section.caption ? `<caption>${esc(cleanHeading(section.caption))}</caption>` : '';
      const head = (section.columns || []).length ? `<thead><tr>${section.columns.map((c) => `<th>${esc(cleanHeading(c))}</th>`).join('')}</tr></thead>` : '';
      const body = (section.rows || []).map((r) => `<tr>${(r || []).map((c) => `<td>${esc(String(c))}</td>`).join('')}</tr>`).join('');
      return `<table class="d-gtable"${style}>${cap}${head}<tbody>${body}</tbody></table>`;
    }
    case 'rubric': {
      // THE SEVERITY RAMP IS POSITIONAL, NOT LEXICAL. It used to be a lookup on four
      // English words (exceeding / meeting / approaching / below), so any other level
      // name — "Exceeding Expectation", a numbered band, a Kiswahili level, a three-band
      // rubric — fell through to one flat accent colour and a bullet on every row, and
      // the ramp that carries the meaning disappeared. A rubric's rows already arrive in
      // order, so the ramp comes from POSITION; the words are consulted only to work out
      // which end is the top, and a source can say so outright with order:'worst-first'.
      const items = section.items || [];
      const n = items.length;
      const RAMP = {
        1: ['--c-teal'],
        2: ['--c-green', '--c-red'],
        3: ['--c-teal', '--c-amber', '--c-red'],
        4: ['--c-teal', '--c-green', '--c-amber', '--c-red'],
      };
      const SYMS = { 1: ['★'], 2: ['✓', '✕'], 3: ['★', '▲', '✕'], 4: ['★', '✓', '▲', '✕'] };
      const spread = (a) => items.map((_, i) => a[Math.min(3, Math.floor((i * 4) / Math.max(1, n)))]);
      const cols = RAMP[n] || spread(RAMP[4]);
      const syms = SYMS[n] || spread(SYMS[4]);
      const TOP = /exceed|excellent|advanced|distinction|outstanding|above|ممتاز/i;
      const BOTTOM = /below|beginning|emerging|needs|weak|poor|ضعيف/i;
      const first = String((items[0] || {}).level || '');
      const last = String((items[n - 1] || {}).level || '');
      const worstFirst = section.order === 'worst-first'
        || (n > 1 && !TOP.test(first) && !BOTTOM.test(last)
            && (BOTTOM.test(first) || TOP.test(last)));
      const rank = (i) => (worstFirst ? n - 1 - i : i);
      const rows = items.map((it, i) => {
        const c = cols[rank(i)] || accent; const sym = syms[rank(i)] || '•';
        const lvl = cleanHeading(it.level || '').replace(/^[^\p{L}]+/u, ''); // drop any leading emoji/symbol (the badge already shows one)
        return `<div class="rrow"><div class="ric" style="background:var(${c})">${sym}</div>`
          + `<div><span class="rlevel">${esc(lvl)}:</span> `
          + `<span class="rdesc">${richText(it.desc || '', { engine: section.engine })}</span></div></div>`;
      }).join('');
      return `<div class="d-rubric">${rows}</div>`;
    }
    case 'bullets': {
      const km = section.marker || 'dot';
      const lis = (section.items || []).map((it, i) => {
        const tag = it.tag ? `<span class="d-tag" style="background:${soft};color:${ink}">${esc(it.tag)}</span>` : '';
        return `<li data-mark="${esc(mark(km, i))}">${richText(it.text, { engine: section.engine })}${tag}</li>`;
      }).join('');
      const lead = section.lead ? `<div class="d-lead">${esc(section.lead)}</div>` : '';
      return `${lead}<ul class="d-bullets">${lis}</ul>`;
    }
    case 'text':
      return `<div class="d-text">${richText(section.body, { engine: section.engine })}</div>`;
    case 'note': {
      const nt = section.label ? `<span class="nt" style="color:${ink}">${esc(cleanHeading(section.label))}</span>` : '';
      return `<div class="d-note" style="background:linear-gradient(90deg,${soft},#fff);border-inline-start:5px solid var(${accent})">${nt}${richText(section.body, { engine: section.engine })}</div>`;
    }
    case 'math':
      return `<div class="d-math">${(section.items || []).map((it) => `<div class="d-mrow">${it.label ? `<div class="d-mlabel">${esc(cleanHeading(it.label))}</div>` : ''}<div class="d-mformula">${renderMath(it.tex, { display: true, engine: section.engine })}</div></div>`).join('')}</div>`;
    case 'chips':
      return `<div class="d-chips">${(section.items || []).map((c) => `<span class="d-chip" style="background:${soft};color:${ink}">${esc(cleanHeading(c))}</span>`).join('')}</div>`;
    case 'steps':
      return `<div class="d-steps">${(section.items || []).map((s, i) => `<div class="d-step"><div class="n" style="background:var(${accent})">${i + 1}</div><div><div class="st-label">${richText(s.label, { engine: section.engine })}</div><div class="st-body">${richText(s.body, { engine: section.engine })}</div></div></div>`).join('')}</div>`;
    case 'qa': {
      const km = section.marker || 'alpha';
      return `<div class="d-qa">${(section.items || []).map((qa, i) => `<div class="d-qc"><div class="d-q" data-mark="${esc(mark(km, i))}" style="color:${ink}">${richText(qa.q, { engine: section.engine })}</div>${qa.a ? `<div class="d-a">${richText(qa.a, { engine: section.engine })}</div>` : ''}</div>`).join('')}</div>`;
    }
    case 'fields':
      return `<div class="d-fields">${(section.items || []).map((f) => `<div class="d-field"><b>${esc(cleanHeading(f.label))}</b>${esc(f.value || '')}</div>`).join('')}</div>`;
    case 'images': {
      const cards = (section.imageIds || [])
        .map((id) => images[id])
        .filter((im) => im && im.dataUri)
        .map((im) => `<div class="d-img${im.cover ? ' cover' : ''}"><img src="${im.dataUri}" alt="${esc(cleanHeading(im.label || ''))}"><div class="cap">${esc(cleanHeading(im.label || ''))}</div></div>`);
      if (!cards.length) return '';
      const n = Math.min(cards.length, 3);
      return `<div class="d-imgrow n${n}">${cards.join('')}</div>`;
    }
    default:
      return `<div class="d-text">${esc(section.body || '')}</div>`;
  }
}

const TEACHER_POOL = ['teacher', 'teacher_coral', 'teacher_purple'];

// Pick the first preferred character the cast has AND that this lesson hasn't used
// yet, so no two sections in one LP show the same figure (R9). Only if every option
// is already used do we allow a repeat.
function pickAvailable(prefs, cast, used) {
  for (const id of prefs) if (cast[id] && !used.has(id)) return id;
  for (const id of prefs) if (cast[id]) return id;
  return null;
}

// Decide which cast character (if any) accompanies a section that has no relevant
// real image (RULES R8, R9). Presentation varies by section, repeated teachers
// rotate colours, and the whole ordering is offset by a per-lesson seed so a maths
// plan and a science plan don't show the same faces. No figure repeats within one LP.
function pickCharacter(section, cast, rot, used) {
  if (section.character === false) return null;
  if (typeof section.character === 'string') return cast[section.character] ? section.character : null;
  if (section.type === 'images' || section.type === 'fields' || section.type === 'chips') return null;
  const h = String(section.heading || '');
  const isActivity = /activit|practic|experiment|partner|group|discuss/i.test(h);
  const eligible = section.type === 'text' || section.type === 'note' || section.type === 'steps' ||
    (section.type === 'bullets' && /activit|practic|experiment|assess|quiz|exam|partner|group|discuss/i.test(h));
  if (!eligible) return null;
  const teachers = rotate(TEACHER_POOL, rot.seed + rot.t++);     // varied per lesson
  const kids = rotate(['girl', 'boy'], rot.seed + rot.n++);
  let prefs;
  if (isActivity) prefs = ['students_pair', 'students_sitting', ...teachers, ...kids];
  else if (section.type === 'steps' || /develop|explanation|board|model answer|demonstrat/i.test(h)) prefs = ['teacher_board', ...teachers, 'students_sitting', ...kids];
  else if (/introduc/i.test(h)) prefs = ['students_sitting', ...kids, ...teachers];
  else if (/assess|quiz|exam/i.test(h)) prefs = [...kids, 'students_sitting', ...teachers];
  else prefs = [...kids, ...teachers, 'students_pair'];
  return pickAvailable(prefs, cast, used);
}

// Estimate a section's rendered content height so the character can be sized to
// fit within that boundary — never dwarfed, never overflowing (RULES R10).
function estimateHeight(section) {
  const items = (section.items || []).length;
  switch (section.type) {
    case 'steps': return items * 96;
    case 'bullets': return items * 46 + (section.lead ? 26 : 0);
    case 'qa': return Math.ceil(items / 2) * 74;
    case 'note':
    case 'text': return Math.max(74, Math.ceil(String(section.body || '').length / 58) * 24) + 22;
    default: return 150;
  }
}

// Given a section + chosen character, return inline sizes that respect the
// content boundary. Wider poses (pairs, sitting groups, board scenes) get a
// slightly wider box; tall content gets a taller figure.
function charSize(section, charId) {
  const wide = /pair|sitting|board/.test(charId); // multi-figure / scene poses need more room
  const floor = wide ? 152 : 124;
  const h = Math.max(floor, Math.min(310, estimateHeight(section) - 8));
  const w = Math.max(wide ? 132 : 104, Math.min(220, Math.round(h * (wide ? 0.82 : 0.66))));
  return { h, w };
}


// ── Code-rendered teaching visuals ────────────────────────────────────────────
// The image model draws wordless art; everything a pupil must READ or COUNT is
// drawn here, so it is exact by construction. Palette follows the design set.
const CF = { fill: '#f5c33b', empty: '#ffffff', stroke: '#2f3e63', ink: '#0a1220',
  good: '#1e8e4d', bad: '#c0392b', accent: '#4479ad' };

function cfSvg(inner, w = 240, h = 200, cls = 'cf-svg') {
  return '<svg class="' + cls + '" viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>';
}
// Labels — including equations — carry the lesson's own direction. An Arabic
// expression is written with its first operand on the right, so rtl is correct for
// both prose and arithmetic; forcing ltr on digit-and-operator strings is what made
// «١٦ ÷ ٤ = ٤» read backwards in figures. See lp-render/math/math.js.
// THE DOCUMENT'S OWN DIRECTION, not a fixed one. Removing the forced-LTR override that
// mirrored Arabic arithmetic was right, but hard-coding 'rtl' in its place was only right
// for Arabic: a Kiswahili label «Hujambo?» drew as «?Hujambo», because the question mark
// is a neutral character and takes the paragraph direction. Measured on a Kenyan Kiswahili
// render — the lesson's whole point is the greeting, and every greeting card showed its
// question mark on the wrong side.
//
// Set once per render from meta.locale (see renderDecorativeLesson). The default stays
// 'rtl' so the Arabic maths-direction tests, which call cfText directly, keep testing what
// they were written to test.
let CF_DIR = 'rtl';
const RTL_LOCALES = /^(ar|he|fa|ur|ps|sd|ku|yi|dv)\b/i;
function cfDirFor(locale) { return RTL_LOCALES.test(String(locale || '')) ? 'rtl' : 'ltr'; }

function cfText(x, y, s, size = 13, weight = 700, fill = CF.ink, anchor = 'middle', dir = CF_DIR) {
  const txt = String(s || '');
  return '<text x="' + x + '" y="' + y + '" text-anchor="' + anchor + '" font-size="' + size
    + '" font-weight="' + weight + '" fill="' + fill + '" direction="' + dir + '">' + esc(txt) + '</text>';
}

// N parts of one shape, K shaded (square grid or circle pie) — exact fractions.
function cfFractionGrid({ shape, parts, shaded }) {
  const W = 240, H = 190;
  if (shape === 'circle') {
    const cx = W / 2, cy = H / 2, r = 78; let out = '';
    for (let i = 0; i < parts; i++) {
      const a0 = -Math.PI / 2 + (2 * Math.PI * i) / parts, a1 = -Math.PI / 2 + (2 * Math.PI * (i + 1)) / parts;
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      out += '<path d="M ' + cx + ' ' + cy + ' L ' + (cx + r * Math.cos(a0)) + ' ' + (cy + r * Math.sin(a0))
        + ' A ' + r + ' ' + r + ' 0 ' + large + ' 1 ' + (cx + r * Math.cos(a1)) + ' ' + (cy + r * Math.sin(a1))
        + ' Z" fill="' + (i < shaded ? CF.fill : CF.empty) + '" stroke="' + CF.stroke + '" stroke-width="3"/>';
    }
    return cfSvg(out, W, H);
  }
  const cols = parts <= 2 ? 2 : parts === 3 ? 3 : parts <= 4 ? 2 : parts <= 6 ? 3 : 4;
  const rows = Math.ceil(parts / cols), cw = 170 / cols, ch = 140 / rows;
  const x0 = (W - 170) / 2, y0 = (H - 140) / 2; let out = '';
  for (let i = 0; i < parts; i++) {
    const c = i % cols, r = Math.floor(i / cols);
    out += '<rect x="' + (x0 + c * cw) + '" y="' + (y0 + r * ch) + '" width="' + cw + '" height="' + ch
      + '" fill="' + (i < shaded ? CF.fill : CF.empty) + '" stroke="' + CF.stroke + '" stroke-width="3"/>';
  }
  return cfSvg(out, W, H);
}

// A row of separate objects, K of them highlighted — counting and grouping.
function cfCountSet({ shape = 'circle', total = 4, shaded = 0 }) {
  const W = 240, H = 150, n = Math.max(1, Math.min(8, total));
  const gap = W / (n + 1), r = Math.min(26, gap / 2.4), cy = H / 2; let out = '';
  for (let i = 0; i < n; i++) {
    const cx = gap * (i + 1), f = i < shaded ? CF.fill : CF.empty;
    if (shape === 'square') out += '<rect x="' + (cx - r) + '" y="' + (cy - r) + '" width="' + (2 * r) + '" height="' + (2 * r) + '" rx="3" fill="' + f + '" stroke="' + CF.stroke + '" stroke-width="3"/>';
    else if (shape === 'triangle') out += '<path d="M ' + cx + ' ' + (cy - r) + ' L ' + (cx + r) + ' ' + (cy + r) + ' L ' + (cx - r) + ' ' + (cy + r) + ' Z" fill="' + f + '" stroke="' + CF.stroke + '" stroke-width="3"/>';
    else out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + f + '" stroke="' + CF.stroke + '" stroke-width="3"/>';
  }
  return cfSvg(out, W, H);
}

// Four labelled direction arrows (Arabic labels supplied by the guide).
function cfCompass({ north, east, south, west, center }) {
  const W = 240, H = 200, cx = W / 2, cy = H / 2 + 4, L = 58;
  const arrow = (dx, dy) => '<path d="M ' + cx + ' ' + cy + ' L ' + (cx + dx * L) + ' ' + (cy + dy * L)
    + '" stroke="' + CF.accent + '" stroke-width="5" stroke-linecap="round" marker-end="url(#cfArrow)"/>';
  const defs = '<defs><marker id="cfArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">'
    + '<path d="M 0 0 L 10 5 L 0 10 z" fill="' + CF.accent + '"/></marker></defs>';
  let out = defs + arrow(0, -1) + arrow(1, 0) + arrow(0, 1) + arrow(-1, 0)
    + '<circle cx="' + cx + '" cy="' + cy + '" r="7" fill="' + CF.fill + '" stroke="' + CF.stroke + '" stroke-width="2.5"/>';
  if (north) out += cfText(cx, cy - L - 12, north, 14);
  if (south) out += cfText(cx, cy + L + 24, south, 14);
  if (east) out += cfText(cx + L + 22, cy + 5, east, 14);
  if (west) out += cfText(cx - L - 22, cy + 5, west, 14);
  if (center) out += cfText(cx, cy + 34, center, 11, 700, CF.stroke);
  return cfSvg(out, W, H);
}

// Two labelled bars for length / size / quantity comparisons.
function cfCompare({ items = [] }) {
  const W = 240;
  const rows = Math.min(3, Math.max(1, items.filter((it) => it).length));
  // The height was fixed at 170px, which fits two bars: with three, the last bar's
  // label fell outside the viewBox and was silently clipped — the figure looked
  // complete but one item had lost its name. Derive the height from the row count.
  const H = 30 + rows * 56; let out = '';
  items.slice(0, 3).forEach((it, i) => {
    const y = 30 + i * 56, len = Math.max(0.15, Math.min(1, Number(it.len) || 0.6)) * 170;
    out += '<rect x="' + ((W - 170) / 2) + '" y="' + y + '" width="' + len + '" height="16" rx="8" fill="'
      + (it.mark === 'good' ? CF.good : it.mark === 'bad' ? CF.bad : CF.accent) + '"/>';
    if (it.label) out += cfText(W / 2, y + 38, it.label, 12.5);
  });
  return cfSvg(out, W, H);
}

// A large expression/word (e.g. ٢/٤ or a key term) drawn as text, not generated.
function cfExpression({ text }) {
  // No direction override: an Arabic phrase («تبخر ≠ تكاثف») and an Arabic equation
  // are both written right-to-left at token level.
  const t = String(text || '');
  return '<div class="cf-expr">' + esc(t) + '</div>';
}


// PROCESS / CYCLE: stages in order with arrows between them. layout 'cycle' closes
// the loop (water cycle, life cycles); layout 'linear' reads RIGHT-TO-LEFT like the
// Arabic text (wudu steps, procedures). Tints cycle through the design-set palette.
function cfProcess({ layout = 'cycle', stages = [] }) {
  const S = stages.slice(0, 6).filter((s) => s && String(s.label || '').trim());
  if (S.length < 2) return '';
  const TINT = ['#fcd8d8', '#e7eef8', '#e9f2e5', '#fcf0d8', '#f1e7f5', '#dcf2f2'];
  const defs = '<defs><marker id="cfPA" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">'
    + '<path d="M 0 0 L 10 5 L 0 10 z" fill="' + CF.stroke + '"/></marker></defs>';
  // Fit every stage name FIRST, then size the boxes to whatever the longest needs. A
  // fixed box height with adaptive text is how a two-line stage name ended up
  // standing above the top edge of its rectangle.
  const fitStage = (st, w) => ({
    fit: cfFit(st.label, w - 14, S.length > 4 ? 14 : 16, 2, 9, 700),
    capFit: st.caption ? cfFit(String(st.caption), w - 12, 12, 1, 8, 600) : null,
  });
  const boxHeightFor = (fits) => Math.max(48, ...fits.map((f) =>
    16 + f.fit.lines.length * (f.fit.size + 2) + (f.capFit ? f.capFit.size + 6 : 0)));
  const box = (cx, cy, w, h, i, s, pre) => {
    const { fit, capFit } = pre || fitStage(s, w);
    // top-align the label block: growing to two lines then never pushes the first
    // line out through the top of the box
    let ty = cy - h / 2 + 8 + fit.size * 0.85;
    let label = '';
    for (const line of fit.lines) { label += cfText(cx, ty, line, fit.size, 700); ty += fit.size + 2; }
    const cap = capFit ? cfText(cx, cy + h / 2 - 7, capFit.lines[0] || '', capFit.size, 600, CF.stroke) : '';
    // grouped: rect first, then its text, so overflow is checkable against the box
    return '<g class="cf-card"><rect x="' + (cx - w / 2) + '" y="' + (cy - h / 2) + '" width="' + w + '" height="' + h
      + '" rx="9" fill="' + TINT[i % TINT.length] + '" stroke="' + CF.stroke + '" stroke-width="2"/>' + label + cap + '</g>';
  };
  // arrow from box i to box j, trimmed to the boxes' edges
  const arrow = (x1, y1, x2, y2, w, h) => {
    const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    const ux = dx / len, uy = dy / len;
    const t = (bw, bh) => Math.min(Math.abs(ux) > 1e-6 ? (bw / 2 + 6) / Math.abs(ux) : 1e9,
      Math.abs(uy) > 1e-6 ? (bh / 2 + 6) / Math.abs(uy) : 1e9);
    const a = t(w, h), b = t(w, h);
    return '<line x1="' + (x1 + ux * a) + '" y1="' + (y1 + uy * a) + '" x2="' + (x2 - ux * b) + '" y2="' + (y2 - uy * b)
      + '" stroke="' + CF.stroke + '" stroke-width="2.4" marker-end="url(#cfPA)"/>';
  };

  if (layout === 'linear') {
    const W = 430, BW = Math.min(126, (W - 40 - (S.length - 1) * 26) / S.length);
    const preL = S.map((st) => fitStage(st, BW));
    const BH = boxHeightFor(preL);
    const gap = (W - 30 - S.length * BW) / Math.max(1, S.length - 1);
    const cy = 40 + (S.some((s) => s.caption) ? 6 : 0);
    let out = defs, xs = [];
    // RTL: the first stage sits on the RIGHT and the sequence runs leftwards.
    for (let i = 0; i < S.length; i++) {
      const cx = W - 15 - BW / 2 - i * (BW + gap);
      xs.push(cx);
      out += box(cx, cy, BW, BH, i, S[i], preL[i]);
    }
    for (let i = 0; i < S.length - 1; i++) out += arrow(xs[i], cy, xs[i + 1], cy, BW, BH);
    return cfSvg(out, W, cy + BH / 2 + 14);
  }

  // cycle: stages on an ellipse, running counter-clockwise so the order reads
  // right-to-left like the Arabic around it; the last arrow closes the loop.
  // flat and wide: the card is wide, so a squat ellipse keeps the labels large
  // without adding page height.
  const W = 470, H = 196, cx0 = W / 2, cy0 = H / 2, rx = 176, ry = 62;
  const BW = S.length > 4 ? 108 : 122;
  const preC = S.map((st) => fitStage(st, BW));
  const BH = boxHeightFor(preC); // whatever the longest stage name needs
  let out = defs, pts = [];
  for (let i = 0; i < S.length; i++) {
    const th = -Math.PI / 2 - (2 * Math.PI * i) / S.length;
    const cx = cx0 + rx * Math.cos(th), cy = cy0 + ry * Math.sin(th);
    pts.push([cx, cy]);
  }
  for (let i = 0; i < S.length; i++) {
    const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % S.length];
    out += arrow(x1, y1, x2, y2, BW, BH);
  }
  for (let i = 0; i < S.length; i++) out += box(pts[i][0], pts[i][1], BW, BH, i, S[i], preC[i]);
  return cfSvg(out, W, H);
}


const CF_TINT = ['#fcd8d8', '#e7eef8', '#e9f2e5', '#fcf0d8', '#f1e7f5', '#dcf2f2'];
// THE DOCUMENT'S OWN NUMERALS. A step badge was always drawn in Arabic-Indic digits, so
// a Kiswahili lesson's matching exercise came out numbered «١ ٢ ٣» — measured on a Kenyan
// Grade 1 render. Same root cause as the hard-coded text direction above: a choice that is
// right for Arabic, made once, in a component every region shares. Follows CF_DIR, which
// renderDecorativeLesson sets from meta.locale.
const CF_AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const cfArNum = (n) => (CF_DIR === 'rtl'
  ? String(n).replace(/\d/g, (d) => CF_AR_DIGITS[+d])
  : String(n));

// SVG text does not wrap, so break an Arabic label into at most two or three lines on
// word boundaries. Arabic glyphs run ~0.52em, so chars-per-line is derived from the
// box width rather than guessed.
// Fit text to a box: wrap it, and if a line still would not fit, step the font size
// down until it does. Bold Arabic runs wider than regular, so the advance factor
// follows the weight — guessing one factor for both is what let text escape its card.
function cfAdvance(size, weight) { return size * (weight >= 700 ? 0.56 : 0.5); }
function cfFit(text, width, size, maxLines = 2, minSize = 8.5, weight = 800) {
  const inner = Math.max(10, width);
  const fits = (lines, sz) => Math.max(0, ...lines.map((l) => l.length * cfAdvance(sz, weight))) <= inner;
  const whole = (lines) => !lines.some((l) => l.endsWith('…'));
  // First choice: the largest size at which every word survives and every line fits.
  // Dropping words is worse than smaller type — a truncated instruction is unusable.
  for (let sz = size; sz >= minSize; sz -= 0.5) {
    const lines = cfWrap(text, inner, sz, maxLines, weight);
    if (whole(lines) && fits(lines, sz)) return { lines, size: sz };
  }
  // Second choice: keep the words, allow one more line.
  for (let sz = size; sz >= minSize; sz -= 0.5) {
    const lines = cfWrap(text, inner, sz, maxLines + 1, weight);
    if (whole(lines) && fits(lines, sz)) return { lines, size: sz };
  }
  // Last resort: floor size, ellipsised — but it will never spill out of the box.
  return { lines: cfWrap(text, inner, minSize, maxLines + 1, weight), size: minSize };
}

function cfWrap(s, width, size, lines = 2, weight = 800) {
  const per = Math.max(6, Math.floor(width / cfAdvance(size, weight)));
  const words = String(s || '').trim().split(/\s+/);
  const out = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= per) cur += ' ' + w;
    else { out.push(cur); cur = w; if (out.length === lines - 1) break; }
  }
  if (cur && out.length < lines) out.push(cur);
  const used = out.join(' ').split(/\s+/).length;
  if (used < words.length && out.length) out[out.length - 1] += '…';
  return out;
}

// STEP / PART CARDS: 2–6 colour-coded tiles read RIGHT-TO-LEFT, each with an Arabic
// numeral badge, a bold label and an optional short caption. No arrows — this is for
// an ordered set the pupil takes in at a glance (steps of a task, parts of a thing,
// rules, materials). Every word comes from the lesson; the layout is computed.
function cfSteps({ items = [], numbered = true, orient = 'h', wide = false }) {
  const S = items.slice(0, 6).filter((s) => s && String(s.label || '').trim());
  if (S.length < 2) return '';
  // Stacked: the cards fill the figure column the design set already reserves, so a
  // stage gains a visual without gaining page height.
  if (orient === 'v') {
    // The canvas width decides how large the cards can render: a 250-wide viewBox
    // inside a 583-wide card hits its height cap while still looking small. A set
    // that spans the card draws on a wider canvas — same height, far bigger cards.
    const CW = wide ? 430 : 250, LS = wide ? 15 : 13.5, CS = wide ? 11.5 : 10.5, pad = wide ? 9 : 7;
    let y = 4, out = '';
    S.forEach((s, i) => {
      // The text area is the card minus the badge and padding on both sides. Fitting
      // to that width — rather than wrapping at a guessed size — is what keeps the
      // words inside the card.
      const TXTW = CW - 62;
      const fit = cfFit(s.label, TXTW, LS, 2);
      const cap = String(s.caption || '').trim();
      const capFit = cap ? cfFit(cap, TXTW, CS, 1, 8, 600) : null;
      // +9 rather than +5: Arabic descenders («ي», «ج») reach further below the baseline
      // than a naive line-height allows, and they were poking through the card edge.
      // Arabic descenders («ة», «ب», «ج») reach about 0.36em below the baseline, so a
      // card sized on line-height alone lets them poke through its bottom edge.
      const h = 19 + fit.lines.length * (fit.size + 3) + (cap ? capFit.size + 9 : 0);
      // Each card is a group: its rect first, then its text, so overflow can be
      // checked against the box the text is supposed to sit in.
      out += '<g class="cf-card">'
        + '<rect x="4" y="' + y + '" width="' + (CW - 8) + '" height="' + h + '" rx="9" fill="'
        + CF_TINT[i % CF_TINT.length] + '" stroke="' + CF.stroke + '" stroke-width="2"/>';
      if (numbered) {
        out += '<circle cx="' + (CW - 22) + '" cy="' + (y + h / 2) + '" r="10" fill="' + CF.stroke + '"/>'
          + '<text x="' + (CW - 22) + '" y="' + (y + h / 2 + 4) + '" text-anchor="middle" font-size="11.5"'
          + ' font-weight="800" fill="#ffffff">' + cfArNum(i + 1) + '</text>';
      }
      // The badge sits at the right edge (RTL start), so the text centres in what is left.
      const tx = (CW - 40) / 2;
      let ty = y + 13 + fit.size * 0.8;
      for (const line of fit.lines) { out += cfText(tx, ty, line, fit.size, 800); ty += fit.size + 3; }
      if (cap) out += cfText(tx, y + h - 9, capFit.lines[0] || '', capFit.size, 600, CF.stroke);
      out += '</g>';
      y += h + pad;
    });
    return cfSvg(out, CW, y);
  }
  const W = 480, n = S.length, gap = n > 4 ? 7 : 10;
  const BW = (W - 14 - gap * (n - 1)) / n;
  const hasCap = S.some((s) => String(s.caption || '').trim());
  const LS = n > 4 ? 11 : 12.5, CS = 9.5;
  // Fit every card to the narrowest common width, then use ONE size for the row so
  // the cards stay visually consistent.
  const fits = S.map((s) => cfFit(s.label, BW - 16, LS, 2));
  const LSf = Math.min(...fits.map((f) => f.size));
  const labelLines = S.map((s) => cfFit(s.label, BW - 16, LSf, 2).lines);
  const capFits = S.map((s) => (String(s.caption || '').trim() ? cfFit(String(s.caption).trim(), BW - 12, CS, 1, 8, 600) : null));
  const CSf = Math.min(CS, ...capFits.filter(Boolean).map((f) => f.size));
  const maxL = Math.max(...labelLines.map((l) => l.length));
  const BH = 35 + maxL * (LSf + 3) + (hasCap ? CSf + 11 : 0);
  const y0 = 6;
  let out = '';
  for (let i = 0; i < n; i++) {
    // RTL: card 1 sits on the right, so the row reads with the Arabic.
    const x = W - 7 - BW - i * (BW + gap), cx = x + BW / 2;
    out += '<g class="cf-card">'
      + '<rect x="' + x + '" y="' + y0 + '" width="' + BW + '" height="' + BH + '" rx="10" fill="'
      + CF_TINT[i % CF_TINT.length] + '" stroke="' + CF.stroke + '" stroke-width="2"/>';
    if (numbered) {
      out += '<circle cx="' + (x + BW - 15) + '" cy="' + (y0 + 15) + '" r="10.5" fill="' + CF.stroke + '"/>'
        + '<text x="' + (x + BW - 15) + '" y="' + (y0 + 19.5) + '" text-anchor="middle" font-size="12"'
        + ' font-weight="800" fill="#ffffff">' + cfArNum(i + 1) + '</text>';
    }
    let ty = y0 + 32;
    for (const line of labelLines[i]) { out += cfText(cx, ty, line, LSf, 800); ty += LSf + 3; }
    if (capFits[i]) out += cfText(cx, y0 + BH - 11, capFits[i].lines[0] || '', CSf, 600, CF.stroke);
    out += '</g>';
  }
  return cfSvg(out, W, BH + 12);
}

// Anchor points on each code-drawn object, so a label always points at the right
// place. Adding an object means adding its drawing and its anchors — nothing else.
const CF_OBJECTS = {
  plant: {
    // A part that exists on both sides of the plant carries a mirror anchor, so a
    // chip on the left points at the LEFT leaf instead of dragging a leader line
    // across the whole drawing.
    anchors: { flower: [240, 38], fruit: [266, 68], leaf: [292, 100], stem: [240, 76], soil: [132, 156], root: [240, 184], seed: [240, 170] },
    mirror: { leaf: [188, 118], fruit: [216, 68] },
    draw() {
      const g = CF.good, s = CF.stroke;
      // The soil band stops short of the edges so the label chips have clear space
      // on both sides — a full-width band forces leader lines to cross it.
      return '<rect x="120" y="150" width="240" height="10" rx="5" fill="#c8a06a" stroke="' + s + '" stroke-width="2"/>'
        // roots + seed
        + '<path d="M 240 158 L 240 186 M 240 168 L 216 186 M 240 168 L 264 186 M 240 178 L 228 192 M 240 178 L 252 192" stroke="#8a6a3a" stroke-width="3" stroke-linecap="round" fill="none"/>'
        + '<ellipse cx="240" cy="170" rx="7" ry="5" fill="#8a6a3a" stroke="' + s + '" stroke-width="1.5"/>'
        // fruits on short stalks, one each side of the stem
        + '<path d="M 240 64 L 258 66 M 240 64 L 222 66" stroke="' + g + '" stroke-width="2.5" stroke-linecap="round"/>'
        + '<circle cx="264" cy="68" r="7" fill="#d9534f" stroke="' + s + '" stroke-width="2"/>'
        + '<circle cx="216" cy="68" r="7" fill="#d9534f" stroke="' + s + '" stroke-width="2"/>'
        // stem
        + '<path d="M 240 152 L 240 52" stroke="' + g + '" stroke-width="6" stroke-linecap="round"/>'
        // leaves
        + '<path d="M 240 100 C 262 82 292 84 300 96 C 288 112 258 114 240 100 Z" fill="' + g + '" stroke="' + s + '" stroke-width="2"/>'
        + '<path d="M 240 116 C 218 98 188 100 180 112 C 192 128 222 130 240 116 Z" fill="' + g + '" stroke="' + s + '" stroke-width="2"/>'
        // flower
        + '<circle cx="240" cy="34" r="11" fill="' + CF.fill + '" stroke="' + s + '" stroke-width="2"/>'
        + '<circle cx="222" cy="42" r="9" fill="#e8778f" stroke="' + s + '" stroke-width="2"/>'
        + '<circle cx="258" cy="42" r="9" fill="#e8778f" stroke="' + s + '" stroke-width="2"/>'
        + '<circle cx="240" cy="50" r="9" fill="#e8778f" stroke="' + s + '" stroke-width="2"/>'
        + '<circle cx="240" cy="42" r="7.5" fill="' + CF.fill + '" stroke="' + s + '" stroke-width="2"/>';
    },
  },
};

// LABELLED PARTS: a code-drawn object with Arabic label chips and leader lines
// pointing at named anchors. The drawing and the pointing are geometry, so a label
// can never drift onto the wrong part the way a generated caption can.
function cfLabeledParts({ object = 'plant', parts = [] }) {
  const obj = CF_OBJECTS[object];
  if (!obj) return '';
  const P = parts.slice(0, 6).filter((p) => p && obj.anchors[p.part] && String(p.label || '').trim());
  if (P.length < 2) return '';
  // The drawing is the point of this figure, but it only occupied about a quarter of
  // the width — the label chips claimed the edges and the plant sat small in the
  // middle. Scale the object up about its own centre and give the figure the height
  // that needs; the anchors scale with it so every leader line still lands correctly.
  const W = 480, H = 236, K = 1.35, CX = 240, CY = 112;
  const tf = (pt) => [CX + K * (pt[0] - CX), CY + K * (pt[1] - CY)];
  let out = `<g transform="translate(${(CX - K * CX).toFixed(2)} ${(CY - K * CY).toFixed(2)}) scale(${K})">`
    + obj.draw() + '</g>';
  // Top to bottom, and each chip goes on the side its own part already leans to, so
  // a leader line never crosses the drawing. Parts sitting on the centre line
  // alternate; a part that exists on both sides (mirror) moves to the emptier side.
  const ordered = P.slice().sort((a, b) => obj.anchors[a.part][1] - obj.anchors[b.part][1]);
  const used = { left: [], right: [] };
  let centre = 0;
  ordered.forEach((p, i) => {
    let [ax, ay] = tf(obj.anchors[p.part]);
    const nat = Math.abs(ax - 240) > 12 ? (ax > 240 ? 'right' : 'left') : (centre++ % 2 === 0 ? 'right' : 'left');
    const other = nat === 'right' ? 'left' : 'right';
    const mir = obj.mirror && obj.mirror[p.part]; // the copy on the opposite side
    const side = mir && used[nat].length > used[other].length + 1 ? other : nat;
    if (side !== nat && mir) [ax, ay] = tf(mir);
    const right = side === 'right';
    // The chip is sized to the FITTED text, so a long part name can never spill out.
    const fit = cfFit(p.label, 156, 12, 1, 8.5, 800);
    const lines = fit.lines;
    const cw = Math.min(172, Math.max(58, (lines[0] || '').length * cfAdvance(fit.size, 800) + 22)), ch = 28;
    let cy = Math.max(17, Math.min(H - 15, ay));
    // push down until clear of the last chip on this side
    for (const prev of used[side]) if (Math.abs(cy - prev) < ch + 5) cy = prev + ch + 5;
    cy = Math.min(H - 15, cy);
    used[side].push(cy);
    const cx = right ? W - 8 - cw / 2 : 8 + cw / 2;
    const inner = right ? cx - cw / 2 : cx + cw / 2;
    out += '<line x1="' + inner + '" y1="' + cy + '" x2="' + ax + '" y2="' + ay + '" stroke="' + CF.stroke
      + '" stroke-width="1.8" stroke-dasharray="4 3"/>'
      + '<circle cx="' + ax + '" cy="' + ay + '" r="4" fill="' + CF.stroke + '"/>'
      + '<g class="cf-card">'
      + '<rect x="' + (cx - cw / 2) + '" y="' + (cy - ch / 2) + '" width="' + cw + '" height="' + ch
      + '" rx="8" fill="' + CF_TINT[i % CF_TINT.length] + '" stroke="' + CF.stroke + '" stroke-width="2"/>'
      + cfText(cx, cy + 4.5, lines[0] || '', fit.size, 800) + '</g>';
  });
  return cfSvg(out, W, H);
}

// ── MATCHING ACTIVITY ────────────────────────────────────────────────────────────────
// «أصل بين الصورة والكلمة الدالة عليها» — join each word to the thing it names. This is
// the CENTRAL teaching activity of a matching lesson, and rendering it as a row of small
// chips (which is what a generic `steps` figure did) made it read as a widget embedded in
// a paragraph. It is a full-width two-column activity: the prompt on the reading side, its
// match on the other, joined by a dotted connector, at a size a class can see.
//
// RTL: the SOURCE's left-hand term is the prompt, so in an Arabic document it is drawn on
// the RIGHT — the reading start — and its match on the left.
//
// A person figure is drawn instead of a word when the match NAMES a picture («صورة الأب»,
// «صورة البنت»): code-drawn, wordless, modestly dressed. The exact label always comes from
// the source and is always drawn as text by code, never generated.
// NO \b AFTER AN ARABIC LETTER — the same trap as in the region profiles. JavaScript's \b
// is defined on ASCII word characters, so /\bالأب\b/ matched nothing at all: «صورة الأب»
// and «صورة الأم» drew no figure while «صورة الولد» and «صورة البنت» did, because those two
// patterns happened to have no \b in them. Ordered longest-first so «الأب» is tested before
// «أب» can match inside another word.
const CF_PEOPLE = [
  [/الولد|الابن|boy/i, 'boy'],
  [/البنت|الابنة|girl/i, 'girl'],
  [/الأب(?![\u0600-\u06FF])|father/i, 'man'],
  [/الأم(?![\u0600-\u06FF])|mother/i, 'woman'],
];
function cfPerson(kind, cx, cy, sc) {
  const S = (n) => n * sc;
  const skin = '#e8b98f', dark = '#2f3e63';
  const head = '<circle cx="' + cx + '" cy="' + (cy - S(15)) + '" r="' + S(7.5) + '" fill="' + skin + '"/>';
  if (kind === 'woman' || kind === 'girl') {
    // headscarf and a long modest dress — the region pack's own dress code, drawn
    const robe = kind === 'woman' ? '#3b4a72' : '#7f9cc4';
    return head
      + '<path d="M' + (cx - S(9)) + ' ' + (cy - S(15)) + ' a' + S(9) + ' ' + S(9) + ' 0 0 1 ' + S(18) + ' 0'
      + ' l0 ' + S(9) + ' l-' + S(4) + ' 0 l0 -' + S(5) + ' l-' + S(10) + ' 0 l0 ' + S(5) + ' z" fill="' + robe + '"/>'
      + '<path d="M' + (cx - S(10)) + ' ' + (cy + S(22)) + ' l' + S(3) + ' -' + S(24) + ' l' + S(14) + ' 0 l' + S(3) + ' ' + S(24) + ' z" fill="' + robe + '"/>';
  }
  const thobe = kind === 'man' ? '#f2f4f8' : '#cfe0ef';
  return head
    + '<path d="M' + (cx - S(9)) + ' ' + (cy + S(22)) + ' l' + S(2) + ' -' + S(24) + ' l' + S(14) + ' 0 l' + S(2) + ' ' + S(24) + ' z" fill="' + thobe + '" stroke="' + dark + '" stroke-width="' + S(0.9) + '"/>'
    + (kind === 'man'
      ? '<path d="M' + (cx - S(8)) + ' ' + (cy - S(21)) + ' q' + S(8) + ' -' + S(6) + ' ' + S(16) + ' 0" stroke="' + dark + '" stroke-width="' + S(1.6) + '" fill="none"/>'
      : '');
}

function cfMatchPairs({ items = [], wide = false } = {}) {
  const P = items.slice(0, 6)
    .map((it) => ({ a: String(it.label || '').trim(), b: String(it.caption || '').trim() }))
    .filter((x) => x.a && x.b);
  if (P.length < 2) return '';

  // TWO PAIRS PER ROW when the activity is wide and has four or more of them. One pair per
  // row made a five-pair exercise ~200px tall before scaling; three of those, each inside
  // an atomic card, left page 2 of the LP a third empty because no card could fit in what
  // was left. Two-up halves the height, makes each card WIDER, and gives the compact
  // block-of-cards composition the approved pilot uses for its number grid.
  const twoUp = wide && P.length >= 4;
  const cols = twoUp ? 2 : 1;
  const rows = Math.ceil(P.length / cols);
  const pad = 8;
  const gapX = twoUp ? 22 : 0;
  const W = wide ? 660 : 250;
  const rowH = wide ? 46 : 38;
  const H = pad * 2 + rows * rowH;
  const colW = (W - pad * 2 - gapX * (cols - 1)) / cols;
  const cw = Math.min(twoUp ? 132 : 250, colW * 0.42);   // one word card
  const fs = wide ? (twoUp ? 17 : 21) : 13;
  let out = '';
  P.forEach((pr, i) => {
    const c = twoUp ? i % cols : 0;
    const r = twoUp ? Math.floor(i / cols) : i;
    // RTL: the first column of pairs sits on the RIGHT of the figure
    const colX = pad + (cols - 1 - c) * (colW + gapX);
    const y = pad + r * rowH;
    const cy = y + rowH / 2;
    const rightX = colX + colW - cw;     // the prompt, at the reading start of its column
    const leftX = colX;
    const person = CF_PEOPLE.find(([re]) => re.test(pr.b));
    out += '<line x1="' + (rightX - 3) + '" y1="' + cy + '" x2="' + (leftX + cw + 3) + '" y2="' + cy
      + '" stroke="' + CF.stroke + '" stroke-width="1.5" stroke-dasharray="3 3" opacity=".5"/>'
      + '<circle cx="' + (rightX - 3) + '" cy="' + cy + '" r="2.4" fill="' + CF.stroke + '"/>'
      + '<circle cx="' + (leftX + cw + 3) + '" cy="' + cy + '" r="2.4" fill="' + CF.stroke + '"/>';
    out += '<rect x="' + rightX + '" y="' + (y + 4) + '" width="' + cw + '" height="' + (rowH - 9)
      + '" rx="8" fill="#fff" stroke="' + CF.stroke + '" stroke-width="1.7"/>'
      + cfText(rightX + cw / 2, cy + fs * 0.36, pr.a, fs, 800, CF.ink);
    out += '<rect x="' + leftX + '" y="' + (y + 4) + '" width="' + cw + '" height="' + (rowH - 9)
      + '" rx="8" fill="#f7f9fc" stroke="' + CF.accent + '" stroke-width="1.5"/>';
    if (person) {
      const sc = (rowH - 14) / 46;
      out += cfPerson(person[1], leftX + 16, cy + 5, sc)
        + cfText(leftX + cw / 2 + 11, cy + fs * 0.36, pr.b, fs - 2, 700, CF.ink);
    } else {
      out += cfText(leftX + cw / 2, cy + fs * 0.36, pr.b, fs - 1, 700, CF.ink);
    }
  });
  return cfSvg(out, W, H);
}

const CF_WIDE = new Set(['process', 'labeled-parts', 'match-pairs']);
// ── GEOMETRY FIGURES ────────────────────────────────────────────────────────────────
// Drawn from a spec, never from a lesson: the shapes, how many, and which one is correct
// all come from the spec the converter built out of the source's own words. A geometry
// exercise printed as a sentence is unusable to a six-year-old; drawn, it is the exercise.
const GEO_INK = '#2f3e63';
const GEO_OK = '#2f7d4a';
const GEO_NO = '#c0392b';

// one drawn shape, on its own 100x74 canvas
function geoShape(kind) {
  const S = (inner) => '<svg viewBox="0 0 100 74" class="geo-s" aria-hidden="true">' + inner + '</svg>';
  const st = `fill="none" stroke="${GEO_INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
  switch (kind) {
    case 'line':   return S(`<path d="M12 37 H88" ${st}/><circle cx="12" cy="37" r="3.5" fill="${GEO_INK}"/><circle cx="88" cy="37" r="3.5" fill="${GEO_INK}"/>`);
    case 'curve':  return S(`<path d="M12 52 Q50 6 88 52" ${st}/><circle cx="12" cy="52" r="3.5" fill="${GEO_INK}"/><circle cx="88" cy="52" r="3.5" fill="${GEO_INK}"/>`);
    case 'quad-sm': return S(`<rect x="34" y="24" width="32" height="26" rx="2" ${st} fill="#f2f4f8"/>`);
    case 'quad':   return S(`<rect x="20" y="14" width="60" height="46" rx="2" ${st} fill="#e7eef8"/>`);
    case 'quad2':  return S(`<path d="M22 58 L34 16 L82 20 L74 60 Z" ${st} fill="#e7eef8"/>`);
    case 'tri':    return S(`<path d="M50 14 L84 60 L16 60 Z" ${st} fill="#fdeaea"/>`);
    case 'cube':   return S(`<path d="M26 26 H68 V62 H26 Z" ${st} fill="#e7eef8"/><path d="M26 26 L40 14 H82 L68 26" ${st} fill="#d6e2f2"/><path d="M68 26 L82 14 V50 L68 62" ${st} fill="#c9d9ee"/>`);
    case 'cone':   return S(`<path d="M50 12 L76 58 H24 Z" ${st} fill="#fdf1e0"/><ellipse cx="50" cy="58" rx="26" ry="7" ${st} fill="#f5e2c4"/>`);
    default:       return S('');
  }
}

// «ضع إشارة (✓) على …» — candidates in a row, each with its own answer box
function cfGeoPick(spec) {
  const items = (spec.items || []).map((it) => {
    const mark = it.ok
      ? `<span class="geo-box geo-yes">✓</span>`
      : `<span class="geo-box geo-no">✗</span>`;
    return `<div class="geo-cell">${geoShape(it.shape)}${mark}</div>`;
  }).join('');
  return `<div class="geo-fig geo-pick">${items}</div>`;
}

// «ارسم قطعاً مستقيمة بين كل نقطتين» — pairs of points, the ruler line shown faintly
function cfGeoDots(spec) {
  const n = Math.max(2, Math.min(4, Number(spec.pairs) || 3));
  const rows = [];
  for (let i = 0; i < n; i++) {
    const y = 22 + i * 30;
    rows.push(`<circle cx="18" cy="${y}" r="4.5" fill="${GEO_INK}"/>`
      + `<circle cx="${170 - i * 16}" cy="${y}" r="4.5" fill="${GEO_INK}"/>`
      + `<path d="M18 ${y} H${170 - i * 16}" stroke="${GEO_OK}" stroke-width="2.4"`
      + ` stroke-dasharray="6 6" opacity=".55"/>`);
  }
  const h = 22 + n * 30;
  return `<div class="geo-fig"><svg viewBox="0 0 188 ${h}" class="geo-w" aria-hidden="true">`
    + rows.join('') + '</svg></div>';
}

// «ارسم على الشبكة شكلاً يطابق» — the model on squared paper, empty squares beside it
function cfGeoGrid(spec) {
  const cols = Math.max(4, Math.min(8, Number(spec.cols) || 6));
  const rows = Math.max(3, Math.min(7, Number(spec.rows) || 5));
  const u = 15;
  const grid = (filled) => {
    let g = '';
    for (let x = 0; x <= cols; x++) g += `<path d="M${x * u} 0 V${rows * u}" stroke="#c9d4e6" stroke-width="1"/>`;
    for (let y = 0; y <= rows; y++) g += `<path d="M0 ${y * u} H${cols * u}" stroke="#c9d4e6" stroke-width="1"/>`;
    if (filled) {
      g += `<path d="M${u} ${u} H${u * 4} V${u * 2} H${u * 2} V${u * 4} H${u} Z"`
        + ` fill="#cfe0f2" stroke="${GEO_INK}" stroke-width="2.6" stroke-linejoin="round"/>`;
    }
    return `<svg viewBox="0 0 ${cols * u} ${rows * u}" class="geo-g" aria-hidden="true">${g}</svg>`;
  };
  return `<div class="geo-fig geo-two">${grid(true)}${grid(false)}</div>`;
}

// «الشكل المطابق» — a model, then candidates, one of them congruent
function cfGeoMatch(spec) {
  const L = spec.labels || {};
  const fill = spec.colour ? '#f6c445' : '#e7eef8';
  const box = (w, h, f, cls) => `<svg viewBox="0 0 100 74" class="geo-s ${cls || ''}" aria-hidden="true">`
    + `<rect x="${50 - w / 2}" y="${37 - h / 2}" width="${w}" height="${h}" rx="2" fill="${f}"`
    + ` stroke="${GEO_INK}" stroke-width="3"/></svg>`;
  const cap = (t, cls) => (t ? `<span class="geo-cap ${cls || ''}">${esc(t)}</span>` : '');
  return '<div class="geo-fig geo-match">'
    + `<div class="geo-cell geo-model">${box(52, 40, '#dfe9f5')}${cap(L.model, 'geo-mcap')}</div>`
    + '<div class="geo-vs">=</div>'
    + `<div class="geo-cell">${box(52, 40, fill)}${cap(L.same, 'geo-ok')}</div>`
    + `<div class="geo-cell">${box(34, 26, '#f2f4f8')}${cap(L.diff, 'geo-bad')}</div>`
    + '</div>';
}

// the demonstration board: every contrast the stage names, with ✓ and ✗
function cfGeoBoard(spec) {
  // The ✗ half of a congruence row must be VISIBLY different, or the row teaches the
  // opposite of what it says: two identical squares under «صواب» and «خطأ» is a picture of
  // two congruent shapes labelled as not congruent.
  const pair = { line: ['line', 'curve'], quad: ['quad', 'tri'], congruent: ['quad', 'quad-sm'] };
  const rows = (spec.rows || []).map((r) => {
    const [a, b] = pair[r.pair] || ['quad', 'tri'];
    const small = r.pair === 'congruent';
    return '<div class="geo-brow">'
      + `<div class="geo-cell">${geoShape(a)}<span class="geo-box geo-yes">✓</span>`
      + (spec.yes ? `<span class="geo-cap geo-ok">${esc(spec.yes)}</span>` : '') + '</div>'
      + `<div class="geo-cell${small ? ' geo-small' : ''}">${geoShape(b)}`
      + `<span class="geo-box geo-no">✗</span>`
      + (spec.no ? `<span class="geo-cap geo-bad">${esc(spec.no)}</span>` : '') + '</div>'
      + '</div>';
  }).join('');
  return `<div class="geo-fig geo-board">${rows}</div>`;
}

const CF_KINDS = new Set(['geo-pick', 'geo-dots', 'geo-grid', 'geo-match', 'geo-board', 'fraction-grid', 'count-set', 'compass', 'compare', 'expression', 'process', 'steps', 'labeled-parts', 'error-board', 'match-pairs']);
function cfMini(spec) {
  if (!spec) return '';
  switch (spec.kind) {
    case 'geo-pick': return cfGeoPick(spec);
    case 'geo-dots': return cfGeoDots(spec);
    case 'geo-grid': return cfGeoGrid(spec);
    case 'geo-match': return cfGeoMatch(spec);
    case 'geo-board': return cfGeoBoard(spec);
    case 'fraction-grid': return cfFractionGrid(spec);
    case 'count-set': return cfCountSet(spec);
    case 'compass': return cfCompass(spec);
    case 'compare': return cfCompare(spec);
    case 'process': return cfProcess(spec);
    case 'match-pairs': return cfMatchPairs({ ...spec, wide: true });
    case 'steps': return cfSteps(spec);
    case 'labeled-parts': return cfLabeledParts(spec);
    case 'expression': return cfExpression(spec);
    default: return '';
  }
}
// Fully code-drawn misconception board: ✗ half and ✓ half, each a code visual.
function cfErrorBoard(cf) {
  const half = (spec, mark, cls, label) => '<div class="cb-half ' + cls + '"><div class="cb-mark">' + mark + '</div>'
    + '<div class="cb-vis">' + cfMini(spec) + '</div>'
    + (label ? '<div class="cb-label">' + lbl(label) + '</div>' : '') + '</div>';
  return '<div class="d-code-board">' + half(cf.wrong, '✗', 'cb-wrong', cf.labelWrong)
    + '<div class="cb-divider"></div>' + half(cf.correct, '✓', 'cb-correct', cf.labelCorrect) + '</div>';
}

// (legacy name kept for the existing call path)
function fractionGridSvg({ shape, parts, shaded }) {
  const W = 240, H = 200, FILL = '#f5c33b', EMPTY = '#ffffff', STROKE = '#2f3e63';
  if (shape === 'circle') {
    const cx = W / 2, cy = H / 2, r = 82;
    let paths = '';
    for (let i = 0; i < parts; i++) {
      const a0 = -Math.PI / 2 + (2 * Math.PI * i) / parts;
      const a1 = -Math.PI / 2 + (2 * Math.PI * (i + 1)) / parts;
      const large = (a1 - a0) > Math.PI ? 1 : 0;
      paths += `<path d="M ${cx} ${cy} L ${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)} Z" fill="${i < shaded ? FILL : EMPTY}" stroke="${STROKE}" stroke-width="3"/>`;
    }
    return `<svg class="cf-svg" viewBox="0 0 ${W} ${H}">${paths}</svg>`;
  }
  const cols = parts === 2 ? 2 : parts === 3 ? 3 : parts <= 4 ? 2 : parts <= 6 ? 3 : 4;
  const rows = Math.ceil(parts / cols);
  const cw = 180 / cols, ch = 150 / rows, x0 = (W - 180) / 2, y0 = (H - 150) / 2;
  let rects = '';
  for (let i = 0; i < parts; i++) {
    const c = i % cols, rr = Math.floor(i / cols);
    rects += `<rect x="${x0 + c * cw}" y="${y0 + rr * ch}" width="${cw}" height="${ch}" fill="${i < shaded ? FILL : EMPTY}" stroke="${STROKE}" stroke-width="3"/>`;
  }
  return `<svg class="cf-svg" viewBox="0 0 ${W} ${H}">${rects}</svg>`;
}

// ══ APPROVED-DESIGN COMPONENTS ═══════════════════════════════════════════════════════
// Explicit components with known slots, laid out by CSS Grid. The renderer used to hand a
// section to a generic panel and let each figure decide its own size inside it: an SVG with
// a fixed viewBox in a flexible card is exactly how a small widget ends up centred in a
// large empty box, and how a stage stopped reading as one designed unit.
//
// So Arabic text is HTML and geometry is SVG or CSS. HTML text reflows, which means a
// component FILLS the slot it is given instead of preserving an aspect ratio — that is the
// structural fix for the empty space, not a padding change. It also gives the Arabic proper
// font and RTL handling, which text drawn inside an SVG never had.
//
// Component names match the design vocabulary: yl-stage (StageCard), yl-stage-head
// (StageHeader), yl-dur (DurationPill), yl-mode (TeachingModePill), yl-text, yl-visual
// (IllustrationPanel), yl-check (CheckpointStrip), yl-support / yl-challenge
// (SupportStrip / ChallengeStrip), yl-match (MatchingActivity), yl-wordmatch
// (WordMatchingActivity), yl-assess (AssessmentActivity), yl-misc (MisconceptionPanel).

// Wordless person figures, drawn in code — never generated, never labelled by the model.
const YL_PEOPLE = {
  man: '<svg viewBox="0 0 40 44" class="yl-fig"><circle cx="20" cy="11" r="7.5" fill="#e8b98f"/>'
    + '<path d="M12 10.5q8-6 16 0" fill="none" stroke="#2f3e63" stroke-width="2"/>'
    + '<path d="M11 43l2-22h14l2 22z" fill="#f2f4f8" stroke="#2f3e63" stroke-width="1.4"/></svg>',
  woman: '<svg viewBox="0 0 40 44" class="yl-fig"><circle cx="20" cy="11" r="7.5" fill="#e8b98f"/>'
    + '<path d="M11 11a9 9 0 0118 0v9h-4v-5H15v5h-4z" fill="#3b4a72"/>'
    + '<path d="M10 43l3-24h14l3 24z" fill="#3b4a72"/></svg>',
  boy: '<svg viewBox="0 0 40 44" class="yl-fig"><circle cx="20" cy="11" r="7.5" fill="#e8b98f"/>'
    + '<path d="M12.5 6.5q7.5-5 15 0" fill="#3a2b1c"/>'
    + '<path d="M12 43l2-22h12l2 22z" fill="#cfe0ef" stroke="#2f3e63" stroke-width="1.3"/></svg>',
  girl: '<svg viewBox="0 0 40 44" class="yl-fig"><circle cx="20" cy="11" r="7.5" fill="#e8b98f"/>'
    + '<path d="M11 11a9 9 0 0118 0v8h-3.5v-4.5H14.5V19H11z" fill="#7f9cc4"/>'
    + '<path d="M11 43l3-24h12l3 24z" fill="#7f9cc4"/></svg>',
};
const YL_PERSON_FOR = [
  [/الولد|الابن|boy/i, 'boy'],
  [/البنت|الابنة|girl/i, 'girl'],
  [/الأب(?![\u0600-\u06FF])|father/i, 'man'],
  [/الأم(?![\u0600-\u06FF])|mother/i, 'woman'],
];
const ylPerson = (t) => {
  const hit = YL_PERSON_FOR.find(([re]) => re.test(String(t)));
  return hit ? YL_PEOPLE[hit[1]] : '';
};

// A dotted connector with a dot at each end — SVG geometry, stretched by the grid.
const YL_LINK = '<svg class="yl-link" viewBox="0 0 100 10" preserveAspectRatio="none">'
  + '<line x1="4" y1="5" x2="96" y2="5" stroke="#2f3e63" stroke-width="1.4" stroke-dasharray="4 4" opacity=".55"/>'
  + '</svg><span class="yl-dot yl-dot-a"></span><span class="yl-dot yl-dot-b"></span>';

// MatchingActivity — «أصل بين الصورة والكلمة الدالة عليها». Word card, connector, then the
// thing it names: a code-drawn figure plus its exact label from the source.
function ylMatching(items) {
  const rows = (items || []).map((it) => {
    const word = esc(cleanHeading(it.label || ''));
    const target = String(it.caption || '').trim();
    const fig = ylPerson(target);
    return '<div class="yl-row">'
      + '<div class="yl-card yl-word">' + word + '</div>'
      + '<div class="yl-conn">' + YL_LINK + '</div>'
      + '<div class="yl-card yl-target">' + (fig ? '<span class="yl-figwrap">' + fig + '</span>' : '')
      + '<span class="yl-tlabel">' + esc(cleanHeading(target)) + '</span></div>'
      + '</div>';
  }).join('');
  return '<div class="yl-match">' + rows + '</div>';
}

// WordMatchingActivity — «أصل بين كل كلمتين متماثلتين». Two balanced columns of word cards.
function ylWordMatch(items) {
  const rows = (items || []).map((it) =>
    '<div class="yl-row">'
    + '<div class="yl-card yl-word">' + esc(cleanHeading(it.label || '')) + '</div>'
    + '<div class="yl-conn">' + YL_LINK + '</div>'
    + '<div class="yl-card yl-word yl-word-b">' + esc(cleanHeading(it.caption || '')) + '</div>'
    + '</div>').join('');
  return '<div class="yl-match yl-wordmatch">' + rows + '</div>';
}

// AssessmentActivity — «ألاحظ الكلمة التي في الشكل، ثم أضع خطاً تحت الكلمة المماثلة لها في
// السطر». Deliberately a DIFFERENT shape from the practice activity: the word in a shape on
// the reading side, then the row it is looked for in, with the match underlined.
function ylAssessment(items) {
  const rows = (items || []).map((it) =>
    '<div class="yl-arow">'
    + '<div class="yl-shape">' + esc(cleanHeading(it.label || '')) + '</div>'
    + '<div class="yl-optrow"><span class="yl-opt yl-opt-pick">'
    + esc(cleanHeading(it.caption || '')) + '</span></div>'
    + '</div>').join('');
  return '<div class="yl-assess">' + rows + '</div>';
}

const TARGET_SVG = '<svg class="yl-tg" viewBox="0 0 64 64" aria-hidden="true">'
  + '<circle cx="30" cy="34" r="23" fill="none" stroke="currentColor" stroke-width="5"/>'
  + '<circle cx="30" cy="34" r="11" fill="none" stroke="currentColor" stroke-width="5"/>'
  + '<circle cx="30" cy="34" r="3.5" fill="currentColor"/>'
  + '<path d="M30 34 L55 11" stroke="#ffd98a" stroke-width="5" stroke-linecap="round"/>'
  + '<path d="M55 11 l-2 10 M55 11 l-10 2" stroke="#ffd98a" stroke-width="4.4"'
  + ' stroke-linecap="round"/></svg>';

const BUBBLE_SVG = '<svg class="yl-bubble" viewBox="0 0 24 24" aria-hidden="true">'
  + '<path d="M4 5.5h16v10.5H12.5L8 19.5V16H4z" fill="none" stroke="currentColor"'
  + ' stroke-width="1.9" stroke-linejoin="round"/>'
  + '<path d="M8 9.5h8M8 12.5h5" stroke="currentColor" stroke-width="1.7"'
  + ' stroke-linecap="round"/></svg>';

const CLOCK_SVG = '<svg class="yl-clock" viewBox="0 0 24 24" aria-hidden="true">'
  + '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/>'
  + '<path d="M12 7v5.5l3.5 2" fill="none" stroke="currentColor" stroke-width="2"'
  + ' stroke-linecap="round"/></svg>';

// MisconceptionPanel, composed the way the approved pages compose it: ONE component, not
// three columns of unrelated text. The ✕ خطأ half at the RTL start states the confusion,
// the ✓ صواب half beside it shows the two words with the letter that separates them marked,
// and the teacher's correction runs as one quiet strip beneath both — which is where the
// approved design puts the supporting line. Previously the explanation sat as a third
// column wedged next to the boxes.
//
// Every character comes from the source: the pair is the pair the lesson names, and the
// marked letter is found by comparing the two words, not chosen.
function ylLetterPair(a, b) {
  const A = [...String(a)]; const B = [...String(b)];
  let at = -1;
  if (A.length === B.length) {
    const diff = A.reduce((acc, ch, i) => (ch === B[i] ? acc : acc.concat(i)), []);
    if (diff.length === 1) at = diff[0];
  }
  // NEVER PUT MARKUP INSIDE AN ARABIC WORD. Wrapping the single differing letter in a
  // <b> was the obvious way to mark it and it is wrong: shaping does not cross element
  // boundaries, so «أبي» would lose the ب–ي join and print in disjointed letter forms.
  // Nothing in the verbatim check would notice — the characters are all still there.
  // The letters are shown as their own chips beneath the two words instead, which is how
  // a letter contrast is taught anyway, and a letter standing alone is correctly isolated.
  const word = (t) => '<span class="yl-pword">' + esc(t) + '</span>';
  const chips = at >= 0
    ? '<div class="yl-dchips"><span class="yl-dchip">' + esc(A[at]) + '</span>'
      + '<span class="yl-dvs">/</span><span class="yl-dchip">' + esc(B[at]) + '</span></div>'
    : '';
  return '<div class="yl-pair">' + word(a) + '<span class="yl-vs"></span>' + word(b)
    + '</div>' + chips;
}

function ylMisconception(section, engine) {
  const cf = section.codeFigure || {};
  const wrong = (cf.wrong && cf.wrong.text) || '';
  const correct = (cf.correct && cf.correct.text) || '';
  // THE LABELS ARE THE DESIGN'S, NOT THE FIGURE'S. They were read off the codeFigure, which
  // only exists when the source names a confused PAIR — «الخلط بين كلمتي "أبي" و"أمي"». A
  // lesson whose misconception is not a pair («خلط التلميذ بين الشكل الرباعي وأي شكل آخر»)
  // built no figure, so the panel printed a ✓ with no «صواب» beside it and an empty green
  // half. The labels come from the profile now, and they are always there.
  const lw = cf.labelWrong || section.labelWrong || '';
  const lc = cf.labelCorrect || section.labelCorrect || '';
  const half = (cls, mark, lbl, inner) =>
    '<div class="yl-half ' + cls + '">'
    + '<div class="yl-mhead"><span class="yl-mark">' + mark + '</span>'
    + '<span class="yl-mlbl">' + esc(cleanHeading(lbl)) + '</span></div>'
    + (inner ? '<div class="yl-mbody">' + inner + '</div>' : '') + '</div>';
  const said = section.body ? richText(section.body, { engine }) : '';
  const pair = (wrong && correct) ? ylLetterPair(wrong, correct) : '';
  // AND THE ✓ HALF MUST SAY SOMETHING. With a pair, it shows the two words and the letter
  // that separates them, and the teacher's correction runs beneath both. With no pair, the
  // correction IS the right-hand side — which is what the source put there.
  const fixText = section.fix ? richText(section.fix, { engine }) : '';
  const row = '<div class="yl-mrow">'
    + half('yl-wrong', '✕', lw, said)
    + half('yl-correct', '✓', lc, pair || fixText)
    + '</div>';
  const strip = (pair && fixText) ? '<div class="yl-mfix">' + fixText + '</div>' : '';
  return '<div class="yl-misc">' + row + strip + '</div>';
}

// The visual slot of a stage: the model illustration, or a code activity, or nothing.
function ylVisual(section, images, engine) {
  const cf = section.codeFigure;
  if (cf) {
    if (cf.kind === 'match-pairs') {
      const named = (cf.items || []).some((it) => /صورة|picture|image/i.test(String(it.caption || '')));
      return named ? ylMatching(cf.items) : ylWordMatch(cf.items);
    }
    if (cf.kind === 'assessment') return ylAssessment(cf.items);
    if (CF_KINDS.has(cf.kind)) return '<div class="yl-cf">' + cfMini(cf) + '</div>';
  }
  const im = section.image && images[section.image];
  if (im && im.dataUri) {
    return '<figure class="yl-illus"><img src="' + im.dataUri + '" alt="'
      + esc(cleanHeading(im.label || '')) + '">'
      + (im.label ? '<figcaption>' + esc(cleanHeading(im.label)) + '</figcaption>' : '')
      + '</figure>';
  }
  return '';
}

// A titled BLOCK: header row, then its content, inside one border. The generic panel this
// replaces relies on a header pulled 32px into it — fine while every card was a panel with
// 33px of top padding, wrong the moment a rule changed that padding, and it put «الإجابات»
// on the card's border with its answer text clipped outside the card.
function ylBlock(section, accent, images, idCls, body) {
  const title = cleanHeading(section.heading);
  const ic = section.icon && hasIcon(section.icon) ? icon(section.icon, 19) : '';
  const head = title
    ? '<div class="yl-bhead"><span class="yl-ic">' + ic + '</span>'
      + '<span class="yl-title">' + esc(title) + '</span></div>'
    : '';
  // TeacherCorner — a labelled tab down the card's inline end, as the approved page has it.
  // REAL MARKUP, not a pseudo-element: two generations of ::before rules for this card were
  // fighting each other (an old messenger icon with its own transform against a new tab),
  // and the result was a 15px amber stub floating above the card with no label on it. A
  // pseudo-element cannot be measured by the geometry test either.
  const tab = section.tab
    ? '<div class="yl-btab">' + BUBBLE_SVG
      + '<span class="yl-btl">' + esc(cleanHeading(section.tab)) + '</span></div>'
    : '';
  // A BADGE IS REAL MARKUP, NOT A PSEUDO-ELEMENT. The objective band's dart was an
  // absolutely-positioned ::before with a padding gutter reserved for it, and a later
  // generic `.yl-block .yl-bbody{padding:…}` rule of equal specificity kept resetting that
  // gutter — the icon drifted back onto the text every time the block padding was touched.
  // As a flex child it cannot overlap anything, and the geometry test can measure it.
  const badge = section.badge === 'target'
    ? '<span class="yl-badge">' + TARGET_SVG + '</span>' : '';
  return '<section class="section yl-block' + (tab ? ' yl-tabbed' : '') + idCls + '">'
    + head + tab + '<div class="yl-bbody">' + badge + body + '</div></section>';
}

// StageCard — one designed teaching unit with fixed slots:
//   head:   title · duration pill · teaching-mode pill
//   body:   teaching text | visual            (explicit grid, 1fr / 1.3fr)
//   check:  checkpoint strip, full width
//   diff:   دعم | تحد, two equal columns, full width
// TeacherNotes — a real section, not chrome hanging off another card.
//
// This was a ::after box with a ::before tab, both positioned against the ASSESSMENT
// STAGE's box. That worked while the stage was one flat panel. Once the stage became an
// outer tinted card with its own padding, the tab was being positioned against the wrong
// rectangle and printed outside the notes box — and because a pseudo-element is not an
// element, the geometry test could not see it. As its own component it cannot drift, and
// it is measured like everything else.
function ylNotes(section) {
  const lines = Math.max(2, Math.min(6, Number(section.lines) || 2));
  const rules = new Array(lines).fill('<i></i>').join('');
  return '<section class="section yl-notes' + (section.id ? ' sec-' + section.id : '') + '">'
    + '<div class="yl-nbody">'
    + '<div class="yl-nlabel">' + esc(cleanHeading(section.label || '')) + '</div>'
    + '<div class="yl-nrules">' + rules + '</div></div>'
    + (section.tab ? '<div class="yl-ntab">' + BUBBLE_SVG
      + '<span class="yl-ntl">' + esc(cleanHeading(section.tab)) + '</span></div>' : '')
    + '</section>';
}

// StageCard — ONE stage, ONE card, with named slots, the way the approved pages compose it:
//
//   StageHeader        tab · duration pill ......................... mode pill   (above the card)
//   ┌─ card ────────────────────────────────────────────────────────────────────┐
//   │ TeachingTextColumn (lead)                                                 │
//   │ ActivityLabel                                                             │
//   │ TeachingTextColumn | TeachingVisualColumn      (or the visual full width)  │
//   │ ActivityLabel                                                             │
//   │ … one block per activity the stage contains …                             │
//   │ SupportChallengeRow                                                       │
//   │ CheckpointStrip                                                           │
//   └───────────────────────────────────────────────────────────────────────────┘
function ylStage(section, accent, images, idCls) {
  const engine = section.engine;
  const title = cleanHeading(section.heading);
  const head = '<div class="yl-shead">'
    + '<span class="yl-tab">' + esc(title) + '</span>'
    + (section.time ? '<span class="yl-pill yl-dur">' + CLOCK_SVG
      + esc(cleanHeading(section.time)) + '</span>' : '')
    + (section.mode ? '<span class="yl-pill yl-mode"><i class="yl-dot"></i>'
      + esc(cleanHeading(section.mode)) + '</span>' : '')
    + '</div>';
  const para = (t) => '<p>' + richText(t, { engine }) + '</p>';
  const lead = section.lead ? '<div class="yl-ttext yl-lead">' + para(section.lead) + '</div>' : '';
  // Each activity is its own block inside the same card. WIDE ACTIVITIES STACK, COMPACT
  // VISUALS SIT BESIDE THE TEXT — the rule the approved pages follow. A five-row matching
  // grid squeezed into half a card is unreadable; an illustration beside two lines of
  // teacher text is exactly the composition of the approved intro card.
  const acts = Array.isArray(section.activities) && section.activities.length
    ? section.activities
    : [{ label: '', body: section.body || '', codeFigure: section.codeFigure || null }];
  const blocks = acts.map((a) => {
    const visual = ylVisual({ ...a, image: a.image || section.image }, images, engine);
    const text = a.body ? '<div class="yl-ttext">' + para(a.body) + '</div>' : '';
    const label = a.label
      ? '<div class="yl-alabel">' + esc(cleanHeading(a.label)) + '</div>' : '';
    const answer = a.answer
      ? '<div class="yl-answer">' + richText(a.answer, { engine }) + '</div>' : '';
    const wide = !!(a.codeFigure
      && (a.codeFigure.kind === 'match-pairs' || a.codeFigure.kind === 'assessment'));
    const vis = visual ? '<div class="yl-tvis">' + visual + '</div>' : '';
    const layout = !text || !visual ? ' yl-solo' : (wide ? ' yl-stacked' : ' yl-split');
    const body = (text || vis)
      ? '<div class="yl-sbody' + layout + '">' + text + vis + '</div>' : '';
    return (label || body || answer)
      ? '<div class="yl-act">' + label + body + answer + '</div>' : '';
  });
  // EXERCISES OF THE SAME KIND SHARE A ROW, as the approved card does with the two halves
  // of its exercise. Stacked, two five-row matching grids made one card 500px tall; a
  // geometry lesson with seven drawn exercises stacked ran to five pages. The grid is
  // built from the activities that CARRY A FIGURE — an instruction line with no figure
  // stays full width above them, where it belongs — and it widens to three columns once
  // there are enough of them for two columns to waste the page.
  const figIdx = acts.map((a, i) => (a.codeFigure ? i : -1)).filter((i) => i >= 0);
  const gridFrom = figIdx.length > 1 && figIdx[figIdx.length - 1] === acts.length - 1
    ? figIdx[0] : -1;
  const cols = figIdx.length >= 6 ? 4 : (figIdx.length >= 5 ? 3 : 2);
  const diff = (Array.isArray(section.callouts) && section.callouts.length)
    ? '<div class="yl-srows">' + section.callouts.map((c, k) =>
      '<div class="yl-srow ' + (k === 0 ? 'yl-support' : 'yl-challenge') + '">'
      + '<span class="yl-cl">' + esc(cleanHeading(c.label || '')) + '</span>'
      + '<span class="yl-cb">' + richText(c.body || '', { engine }) + '</span></div>').join('')
      + '</div>' : '';
  const checks = (Array.isArray(section.checks) && section.checks.length ? section.checks
    : (section.check ? [section.check] : []))
    .map((c) => '<div class="yl-check"><span class="yl-cmark">✓</span>'
      + '<span class="yl-ctext">' + richText(c, { engine }) + '</span></div>').join('');
  // A HEADING THE SOURCE LEFT EMPTY COLLAPSES to its label. «العرض — أنا أفعل (١٠ دقائق)»
  // carries no text in this lesson: inventing content is not an option, and neither is a
  // large blank card. The stage keeps its tab and its pills, and nothing else.
  // `blocks` is an ARRAY now — and an empty array is truthy, so this test silently stopped
  // firing and «العرض», the stage the source leaves empty, went back to rendering a card.
  const anyBlock = blocks.some((x) => x);
  if (!lead && !anyBlock && !checks && !diff) {
    return '<section class="section yl-stage yl-empty' + idCls + '">' + head + '</section>';
  }
  const inner = gridFrom >= 0
    ? blocks.slice(0, gridFrom).join('')
      + '<div class="yl-actgrid yl-cols-' + cols + '">' + blocks.slice(gridFrom).join('') + '</div>'
    : blocks.join('');
  // The approved stage is TWO cards: an outer one carrying the stage's own tint, which
  // holds the header row, the asides and the checkpoint strip; and a white inner card
  // holding the teaching content. That outer block of colour is what makes a stage read
  // as one designed unit instead of a header floating above a white box.
  return '<section class="section yl-stage' + idCls + '">' + head
    + '<div class="yl-scard">' + lead + inner + '</div>' + diff + checks + '</section>';
}

function renderDecorativeLesson(content, images = {}, cast = {}) {
  const meta = content.meta || {};
  CF_DIR = cfDirFor(meta.locale);   // drawn labels read the way this document reads
  const chips = (meta.chips || []).map((c) => `<span><b>${esc(cleanHeading(c.label))}</b>${esc(cleanHeading(c.value))}</span>`).join('');
  const htext =
    `<h1>${esc(cleanHeading(meta.title))}</h1>` +
    (meta.subtitle ? `<div class="sub">${esc(cleanHeading(meta.subtitle))}</div>` : '') +
    (chips ? `<div class="meta">${chips}</div>` : '');
  // A banner image (meta.banner → an image id) becomes the hero background with the
  // title on a soft dark scrim; otherwise fall back to the warm gradient hero.
  const bannerImg = meta.banner && images[meta.banner] && images[meta.banner].dataUri;
  const headerHtml = bannerImg
    ? `<div class="lp-header banner" style="background-image:url('${bannerImg}')"><div class="lp-htext">${htext}</div></div>`
    : `<div class="lp-header">${headerBg()}${headerMotifs()}${htext}</div>`;

  // Track which images a section actually displays, so none are silently missing.
  const referenced = new Set();
  if (meta.banner) referenced.add(meta.banner); // shown in the hero, not as a card
  for (const s of (content.sections || [])) if (s && s.type === 'images' && Array.isArray(s.imageIds)) s.imageIds.forEach((id) => referenced.add(id));
  for (const s of (content.sections || [])) if (s && s.image) referenced.add(s.image); // in-panel figures (see below)
  for (const s of (content.sections || [])) { if (s && s.imageWrong) referenced.add(s.imageWrong); if (s && s.imageCorrect) referenced.add(s.imageCorrect); } // code-composed twin boards

  // Characters are a FALLBACK only (R23): if this lesson already shows real content
  // images, we add no characters at all — the informative images carry it.
  const hasContentImages = Object.values(images).some((im) => im && im.dataUri);

  const mg = !!meta.multigrade; // multigrade → navy headers + teal/gold grade columns
  let placed = 0;
  let prevHeading = '';
  const rot = { n: 0, t: 0, seed: seedOf(`${meta.id || ''}|${meta.subject || ''}|${meta.title || ''}`) };
  const used = new Set(); // no character repeats within one lesson
  // WHETHER A STEP SET TAKES THE CARD'S FULL WIDTH is a layout question about the
  // figure, not a page budget. It used to be capped at two per lesson to protect a
  // two-page contract; when that contract went I lifted the cap to Infinity, which made
  // EVERY step set span — so every figure dropped below its text and the card stopped
  // being the pilot's text-beside-figure anatomy. A row of 4+ cards genuinely needs the
  // width; 2 or 3 cards read better beside the text, in the figure column.
  const SPANNING_MIN_CARDS = 4;
  const sections = (content.sections || []).map((section, i) => {
    // Admin blocks (Lesson Details) use a neutral slate tab, not a warm accent.
    const accent = section.type === 'fields' ? '--c-slate' : accentFor(i);
    // A section's id becomes a class (sec-<id>) so region packs can style specific
    // template roles order-independently. Additive: nothing targets these by default.
    const idCls = section.id ? ` sec-${String(section.id).toLowerCase().replace(/[^a-z0-9_-]/g, '')}` : '';
    let body = renderBody(section, accent, images);
    // SUB-ELEMENTS OF THIS CARD, not cards of their own. «دعم» and «تحد» are the
    // differentiation notes for the activity above them; as full-width cards they tripled
    // the length of the LP and made every stage read as three identical boxes. A compact
    // two-up row keeps them visually attached to the stage they belong to.
    if (Array.isArray(section.callouts) && section.callouts.length) {
      body += '<div class="d-callouts">' + section.callouts.map((c) =>
        '<div class="d-callout"><span class="co-l">' + esc(cleanHeading(c.label || '')) + '</span>'
        + '<span class="co-b">' + richText(c.body || '', { engine: section.engine }) + '</span></div>'
      ).join('') + '</div>';
    }
    // Inline image (R32, upstream): in MULTIGRADE guides an explanatory picture sits
    // under the point it explains. In all other lessons section.image renders as the
    // in-panel side figure (design packs like Yemen's — see below); the mg gate keeps
    // both features exactly as their authors shipped them.
    if (mg && section.image && images[section.image] && images[section.image].dataUri) {
      referenced.add(section.image);
      body += inlineImage(section.image, images);
    }
    // AN EXPLICIT COMPONENT, NOT A GENERIC PANEL. A stage carries known slots and is laid
    // out by grid; nothing inside it chooses its own position.
    if (section.type === 'notes') return ylNotes(section);
    if (section.type === 'stage') return ylStage(section, accent, images, idCls);
    if (section.component === 'block' && body !== '') {
      return ylBlock(section, accent, images, idCls, body);
    }
    if (section.type === 'misconception') {
      // Its OWN header row, not the generic one: this pack pulls a section head 32px into
      // the card it labels, which works against a .panel and only against a .panel. On a
      // component with no panel the header landed on top of the ✕ box.
      const t = cleanHeading(section.heading);
      const mic = section.icon && hasIcon(section.icon) ? icon(section.icon, 19) : '';
      return '<section class="section' + idCls + ' yl-miscsec">'
        + '<div class="yl-stage-head"><span class="yl-ic">' + mic + '</span>'
        + '<span class="yl-title">' + esc(t) + '</span><span></span><span></span></div>'
        + ylMisconception(section, section.engine) + '</section>';
    }
    if (body === '') return '';
    // A heading that repeats the previous one (e.g. a phase split across structuring
    // chunks) is shown once — the rest render as a continuation, no repeated header.
    const title = cleanHeading(section.heading);
    const head = (title && title !== prevHeading) ? sectionHead(accent, section, i, mg) : '';
    if (title) prevHeading = title;
    // Optional in-panel illustration: `section.image` names a declared image id and the
    // figure renders INSIDE the section's panel beside the body (design sets like
    // Yemen's put an illustration in every stage card). Additive — no existing content
    // sets it, and sections without it render exactly as before.
    // Code-composed misconception board: the model draws two SINGLE-CONCEPT halves
    // (imageWrong / imageCorrect); the ✗/✓ marks, divider and side assignment are
    // rendered by CODE so the mapping can never invert (weak models scramble
    // relational binding when one image must contain the contrast).
    const twinW = !mg && section.imageWrong && images[section.imageWrong] && images[section.imageWrong].dataUri ? images[section.imageWrong] : null;
    const twinC = !mg && section.imageCorrect && images[section.imageCorrect] && images[section.imageCorrect].dataUri ? images[section.imageCorrect] : null;
    if (twinW && twinC) {
      const half = (im, mark, cls, lbl) => `<div class="tb-half ${cls}"><div class="tb-mark">${mark}</div><img src="${im.dataUri}" alt="${esc(cleanHeading(im.label || ''))}">${lbl ? `<div class="tb-label">${esc(cleanHeading(lbl))}</div>` : ''}</div>`;
      const fig = `<div class="d-twin-board">${half(twinW, '✗', 'tb-wrong', section.labelWrong)}<div class="tb-divider"></div>${half(twinC, '✓', 'tb-correct', section.labelCorrect)}</div>`;
      return `<section class="section${idCls}">${head}<div class="panel has-twin-board" style="border-color:var(${accent}-soft)"><div class="ii-body">${body}</div>${fig}</div></section>`;
    }
    // Code-drawn exact-math figure (fraction grids): parts/shading/label are
    // parameters, so the mathematics is pixel-exact by construction.
    if (!mg && section.codeFigure && CF_KINDS.has(section.codeFigure.kind)) {
      const cf = section.codeFigure;
      // A code-drawn misconception board spans the card under the body.
      if (cf.kind === 'error-board') {
        return `<section class="section${idCls}">${head}<div class="panel has-twin-board" style="border-color:var(${accent}-soft)"><div class="ii-body">${body}</div>${cfErrorBoard(cf)}</div></section>`;
      }
      // A process/cycle needs the whole card width or its stage labels become
      // unreadable at half-column size.
      // A step set of 2–3 cards stacks inside the figure column; 4+ cards need the
      // card's full width, as a cycle or a labelled diagram always does.
      // A step set of 3+ cards reads as a proper sequence, so it takes the card's
      // width as a ROW; only a pair stays stacked in the figure column.
      const stepCount = (cf.items || []).length;
      const spans = CF_WIDE.has(cf.kind)
        || (cf.kind === 'steps' && stepCount >= SPANNING_MIN_CARDS);
      // Stacked cards at the card's full width are far larger than the same number
      // side by side; only 4+ cards need the row, which would otherwise run too tall.
      const spec = cf.kind === 'steps'
        ? { ...cf, orient: stepCount >= 4 ? 'h' : 'v', wide: spans && stepCount < 4 }
        : cf;
      const wide = spans ? ' cf-wide cf-k-' + cf.kind : ' cf-k-' + cf.kind;
      const fig = `<div class="d-inline-img d-code-fig${wide}">${cfMini(spec)}${cf.label ? `<div class="cf-label">${lbl(cf.label)}</div>` : ''}${cf.caption ? `<div class="cap">${lbl(cf.caption)}</div>` : ''}</div>`;
      return `<section class="section${idCls}">${head}<div class="panel has-inline-img" style="border-color:var(${accent}-soft)"><div class="ii-body">${body}</div>${fig}</div></section>`;
    }
    const inlineIm = !mg && section.image && images[section.image] && images[section.image].dataUri ? images[section.image] : null;
    if (inlineIm) {
      // Labels are ALWAYS code-rendered on the image: use the model's overlay spec
      // when it gave one, otherwise derive a chip from the figure's own label so the
      // guarantee never depends on the model emitting the optional field.
      const lbl = cleanHeading(inlineIm.label || '');
      const ovs = (section.overlays || inlineIm.overlays
        || (lbl ? [{ text: lbl, pos: 'bottom-right', kind: /[٠-٩0-9]\s*\/\s*[٠-٩0-9]/.test(lbl) ? 'fraction' : 'chip' }] : []));
      const capBelow = !(ovs.length && ovs.some((o) => o.text === lbl));
      const ovHtml = ovs.map((o) => {
        const frac = o.kind === 'fraction' && /\//.test(o.text);
        const inner = frac ? `<span class="fr-n">${esc(o.text.split('/')[0])}</span><span class="fr-b"></span><span class="fr-d">${esc(o.text.split('/')[1])}</span>` : esc(o.text);
        return `<div class="ov ov-${o.pos} ov-${o.kind === 'fraction' ? 'fraction' : 'chip'}">${inner}</div>`;
      }).join('');
      const fig = `<div class="d-inline-img${ovHtml ? ' has-ov' : ''}"><div class="ov-wrap"><img src="${inlineIm.dataUri}" alt="${esc(lbl)}">${ovHtml}</div>${lbl && capBelow ? `<div class="cap">${esc(lbl)}</div>` : ''}</div>`;
      return `<section class="section${idCls}">${head}<div class="panel has-inline-img" style="border-color:var(${accent}-soft)"><div class="ii-body">${body}</div>${fig}</div></section>`;
    }
    const charId = hasContentImages ? null : pickCharacter(section, cast, rot, used);
    if (charId) {
      used.add(charId);
      const side = placed % 2 === 0 ? 'left' : 'right';
      placed++;
      const { h, w } = charSize(section, charId);
      const fig = `<div class="char-fig ${side}" style="width:${w}px"><img src="${cast[charId]}" alt="" style="max-height:${h}px"></div>`;
      const inner = side === 'left' ? `${fig}<div class="char-body">${body}</div>` : `<div class="char-body">${body}</div>${fig}`;
      return `<section class="section${idCls}">${head}<div class="panel has-char" style="border-color:var(${accent}-soft)">${inner}</div></section>`;
    }
    return `<section class="section${idCls}">${head}<div class="panel" style="border-color:var(${accent}-soft)">${body}</div></section>`;
  }).join('');

  // Safety net (R12): any generated image not shown by an images section is
  // appended, so a declared image is never silently missing from the render.
  const leftover = Object.keys(images).filter((id) => images[id] && images[id].dataUri && !referenced.has(id));
  let extra = '';
  if (leftover.length) {
    const body2 = renderBody({ type: 'images', imageIds: leftover }, accentFor((content.sections || []).length), images);
    if (body2) extra = `<section class="section"><div class="panel">${body2}</div></section>`;
  }

  // Multigrade legend — "what the symbols mean" (only when there is duo content to explain).
  const legend = (mg && /class="d-duo"/.test(sections))
    ? `<div class="mg-legend">`
      + `<span class="li"><span class="dot fill"></span>Teacher is here</span>`
      + `<span class="li"><span class="dot"></span>This class works on its own</span>`
      + `<span class="li"><span class="sw" style="background:var(--g-a)"></span>${esc(cleanHeading(meta.gradeA || 'Grade A'))}</span>`
      + `<span class="li"><span class="sw" style="background:var(--g-b)"></span>${esc(cleanHeading(meta.gradeB || 'Grade B'))}</span>`
      + `</div>`
    : '';
  const footer = meta.footer ? `<div class="lp-footer">${richText(String(meta.footer), {})}</div>` : '';
  const body = `<div class="body">${legend}${sections}${extra}</div>${footer}`;
  // KaTeX-rendered math needs its stylesheet; MathJax output is self-contained SVG.
  const headCss = /class="katex"/.test(body) ? katexCss() : '';
  return { headerHtml, bodyHtml: body, headCss };
}

// cfText is exported for lp-render/test/math-direction.test.js: the direction of a
// figure label is a rule worth asserting directly, not only through a full render.
module.exports = { renderDecorativeLesson, cfText, cfDirFor };
