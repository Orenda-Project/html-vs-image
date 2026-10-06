'use strict';
// NIETE's approved lesson-plan page for GRADES 6–12 — ICT's own production page (NIETE-Rumi
// bot/vendor/lp-v9, v9.3 phone page, printed as v6 "two parts"). The approved references
// (shared 2026-10-02): Grade 9 English, Grade 7 Mathematics, Grade 6 Urdu, each a 520 px column
// printed on TWO tall pages — the lesson, then the teacher support — each page as tall as its part.
//
//   part 1   navy title card · lesson path (last → this lesson → checkpoint) · learning outcome ·
//            video · materials · pacing · key words · then a bar per stage — Introduction teal I,
//            Development navy D, Activity green A, Conclusion purple C, Home work slate H — and
//            that stage's cards, in the order ICT prints them
//   part 2   TEACHER SUPPORT · NOT FOR THE BOARD, then lettered groups: the board at the end of the
//            lesson, the FBISE questions (grade 9+), the homework in full, the coaching corner
//
// The cards come from the ICT adapter (lp-render/guide/from-lpdoc.js), which already puts every
// lp_doc field in ICT's order with ICT's labels in the lesson's language; this file only lays them
// out. Every card is drawn — a card of a kind this file does not know is drawn plainly rather than
// left out — and no word is changed.
//
// Added to the approved page, all drawn in code ($0): a subject picture on the title card, the
// lesson path as three marked steps, the pacing line drawn as a bar of its stages, a picture on
// every stage bar, an icon on every card label, ✗ / ✓ badges on the mistakes, tick boxes on the
// mark schemes, level pills on the homework, the coaching steps with their icons.
//
// Grades 6–12 only. Its style sits under .icts and its art in secondary-art.js; it shares nothing
// with the Grades 1–5 page (primary.js, .ictq), so either can change without moving the other.
const fs = require('node:fs');
const path = require('node:path');
const { richText, katexCss } = require('../../../math/math');
const { ICON, stageIcon, subjectPicture, pacingBar, STAGE_LETTER, parseMatrix, matrixProduct, reaction, wordEquation, ratioBlocks, marksDots, FIG, LEVEL_ICON,
  termOf, termIcon, CE_ICON, ceArrow, meanChart } = require('./secondary-art');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const has = (v) => v != null && String(v).trim() !== '';
const AR = /[؀-ۿ]/;

// chrome the cards do not carry: the page footer's byline and the coaching steps, as the approved
// pages print them (the WhatsApp number is left out until that is decided)
const CHROME = {
  en: { byline: 'NIETE Teaching Assistant', coachSteps: ['Record up to 40 minutes of this lesson', 'Send it to NIETE on WhatsApp', 'Same-day tips back: what worked, and one thing to try'] },
  ur: { byline: 'NIETE Teaching Assistant', coachSteps: ['اس سبق کی چالیس منٹ تک کی ریکارڈنگ بنائیے', 'واٹس ایپ پر نیٹ کو بھیجیے', 'اسی دن جواب: کیا اچھا رہا، اور ایک بات جو آزمانی ہے'] },
};

const STAGES = ['introduction', 'development', 'activity', 'conclusion', 'homework'];
const roleOf = (s) => ((/\bict-r-([a-z0-9]+)/.exec(s.cls || '') || [])[1] || '');
const stageOf = (s) => ((/\bict-st-([a-z0-9]+)/.exec(s.cls || '') || [])[1] || '');
const groupOf = (s) => ((/\bict-p2-([a-z])\b/.exec(s.cls || '') || [])[1] || '');

function composeSecondary(guide, images) {
  const meta = guide.meta || {};
  const lang = meta.locale === 'ur' ? 'ur' : 'en';
  const rtl = lang === 'ur';
  const dir = rtl ? 'rtl' : 'ltr';
  const C = CHROME[lang];
  const eng = (s) => (/\\ce\{/.test(String(s)) ? 'mathjax' : 'katex');
  const rt = (s) => richText(String(s == null ? '' : s), { engine: eng(s) });
  // the direction of a piece of the lesson: an English-only line in an Urdu lesson reads left to right
  const dirOf = (s) => (rtl ? (AR.test(String(s)) ? 'rtl' : 'ltr') : 'ltr');
  const stripEmoji = (s) => String(s || '').replace(/^[\s⌀-⏿☀-➿⬀-⯿\u{1F300}-\u{1FAFF}️]+/u, '');
  const counts = { cards: 0, pictures: 0, visuals: 0, unknown: [] };

  // ── VISUALS FROM THE LESSON'S OWN LINES ──────────────────────────────────────────────────
  // Inline, beside the words they illustrate (the words are never touched): a ratio's blocks, a
  // mark count's dots, a quotation set as a quote chip. Under a line: the reaction or word
  // equation it states, drawn as tiles — each distinct one once per lesson, at most four.
  const PH = { ratio: '\uE001', marks: '\uE002', qo: '\uE003', qc: '\uE004' };
  // CAUSE and EFFECT, as an English reading lesson labels them ("Cause: … Effect: …", "this is the
  // CAUSE"), and as an Urdu one does ("وجہ: … نتیجہ: …"): each word in its own coloured tag, an
  // arrow before the effect when the cause comes first. The words stay exactly as written.
  const CE = { c: '\uE007', e: '\uE008', end: '\uE009', ar: '\uE00A', arEnd: '\uE00B' };
  const ceTags = (seg, state) => seg
    .replace(/(^|[^A-Za-z\u0600-\u06FF])(Cause:|CAUSE\b|(?:وجہ|سبب):)/g, (m, pre, w) => { if (w.endsWith(':')) state.cause = true; return `${pre}${CE.c}${w}${CE.end}`; })
    .replace(/(^|[^A-Za-z\u0600-\u06FF])(Effect:|EFFECT\b|(?:نتیجہ|اثر):)/g, (m, pre, w) => {
      const ar = state.cause && w.endsWith(':'); if (ar) state.cause = false;
      return ar ? `${pre}${CE.ar}${CE.e}${w}${CE.end}${CE.arEnd}` : `${pre}${CE.e}${w}${CE.end}`;
    });
  const inlineVis = [];
  let quiet = false;   // inside "What pupils write" (a pupil's mistake) nothing is illustrated
  const rtx = (raw) => {
    if (quiet) return rt(raw);
    // a formula keeps the full stop or comma that follows it on its own line
    const glued = String(raw == null ? '' : raw).replace(/(\$[^$]+\$)([.,;:!?])(?=\s|$)/g, '\uE005$1$2\uE006');
    const ceState = { cause: false };
    const out = glued.split(/(\$[^$]+\$)/).map((seg) => {
      if (/^\$[^$]+\$$/.test(seg)) return seg;
      return ceTags(seg, ceState)
        .replace(/(^|[^\d.~])(\d)\s*:\s*(\d)(?:\s*:\s*(\d))?(?![\d.])/g, (m, pre, a, b, c) => {
          const svg = ratioBlocks([a, b, c].filter((x) => x != null).map(Number));
          if (!svg) return m; inlineVis.push(svg); counts.visuals += 1; return `${m}${PH.ratio}${inlineVis.length - 1}${PH.ratio}`;
        })
        .replace(/(^|[^~\d])(\d{1,2})\s*(marks?|نمبر)\b/g, (m, pre, n) => {
          const svg = marksDots(Number(n));
          if (!svg) return m; inlineVis.push(svg); return `${m}${PH.marks}${inlineVis.length - 1}${PH.marks}`;
        })
        .replace(/(^|[\s(—–-])(['‘“])([^'’”\n]{3,90}?)(['’”])(?=[\s.,;:!?)—–-]|$)/g, (m, pre, o, q, c) => `${pre}${PH.qo}${o}${q}${c}${PH.qc}`);
    }).join('');
    return rt(out)
      .replace(/\uE001(\d+)\uE001/g, (_, i) => inlineVis[Number(i)])
      .replace(/\uE002(\d+)\uE002/g, (_, i) => inlineVis[Number(i)])
      .replace(/\uE003/g, '<span class="squote">').replace(/\uE004/g, '</span>')
      .replace(/\uE005/g, '<span class="snw">').replace(/\uE006/g, '</span>')
      .replace(/\uE007/g, () => { counts.visuals += 1; return `<span class="sce sce-c">${CE_ICON.cause()}`; })
      .replace(/\uE008/g, () => `<span class="sce sce-e">${CE_ICON.effect()}`)
      .replace(/\uE009/g, '</span>').replace(/\uE00A/g, ` <span class="sce-w">${ceArrow(AR.test(String(raw)))}`).replace(/\uE00B/g, '</span>');
  };
  const seenViz = new Set();
  const underViz = (raw) => {
    if (quiet) return '';
    const t = String(raw || ''); let out = '';
    for (const m of t.matchAll(/\\ce\{([^{}]*(?:->|→)[^{}]*)\}/g)) {
      const key = m[1].replace(/\((?:g|l|s|aq)\)/g, '').replace(/\s+/g, ' ').trim();
      if (seenViz.has(key) || seenViz.size >= 4) continue;
      const svg = reaction(key);
      if (svg) { seenViz.add(key); counts.visuals += 1; out += `<div class="sviz-w">${svg}</div>`; }
    }
    if (!/\\ce\{/.test(t) && /\s\+\s/.test(t) && /-->|→/.test(t)) {
      const svg = wordEquation(t); const key = `w:${t}`;
      if (svg && !seenViz.has(key) && seenViz.size < 4) { seenViz.add(key); counts.visuals += 1; out += `<div class="sviz-w">${svg}</div>`; }
    }
    return out;
  };

  // ── text: a body is lines; a line may be a numbered step, a bullet, or a paragraph ──────────
  const line = (l, cls = '') => {
    const t = String(l);
    const num = /^(\d+)\.\s+([\s\S]*)$/.exec(t);
    if (num) return `<div class="sl sl-n${cls}" dir="${dirOf(t)}"><b class="sn">${esc(num[1])}</b><span class="st">${rtx(num[2])}${underViz(num[2])}</span></div>`;
    const bul = /^[-•]\s+([\s\S]*)$/.exec(t);
    if (bul) return `<div class="sl sl-b${cls}" dir="${dirOf(t)}"><i class="sbx"></i><span class="st">${rtx(bul[1])}${underViz(bul[1])}</span></div>`;
    return `<div class="sl${cls}" dir="${dirOf(t)}">${rtx(t)}</div>${underViz(t)}`;
  };
  // consecutive numbered steps are one path: a rail joins their numbers
  const lines = (body, cls = '') => {
    const ls = String(body || '').split('\n').filter(has);
    let html = ''; let path = '';
    for (const l of ls) {
      if (/^\d+\.\s/.test(l)) { path += line(l, cls); continue; }
      if (path) { html += `<div class="spath">${path}</div>`; path = ''; }
      html += line(l, cls);
    }
    if (path) html += `<div class="spath">${path}</div>`;
    return html;
  };
  // THE ROW × COLUMN PICTURE: a worked matrix product, drawn from its own two matrices and its own
  // "Row r with column c" steps; a step left for pupils ("you fill this in") shows "?"
  const matrixViz = (body) => {
    const ls = String(body || '').split('\n');
    const named = [...String(ls[0] || '').matchAll(/([A-Z])\s*=\s*(?:\\displaystyle\s*)?(\\begin\{bmatrix\}[\s\S]*?\\end\{bmatrix\})/g)].map((m) => parseMatrix(m[2]));
    if (named.length < 2 || !named[0] || !named[1]) return '';
    const steps = ls.map((l) => {
      const m = /^(?:(\d+)\.\s+)?.*?Row (\d) with column (\d)/i.exec(l);
      return m && { n: m[1] ? Number(m[1]) : null, r: Number(m[2]), c: Number(m[3]), value: ((/=\s*(-?[\d.]+)\s*\$?\.?\s*$/.exec(l) || [])[1]) || null };
    }).filter(Boolean);
    const svg = matrixProduct({ left: named[0], right: named[1], steps });
    if (svg) counts.visuals += 1;
    return svg ? `<div class="sviz-w sviz-m">${svg}</div>` : '';
  };
  // THE MEAN, DRAWN: a worked example that finds the mean of a list the lesson writes out. The
  // bars are its values; the line is its stated mean; a mean left for pupils ("you fill this in")
  // is drawn as "?" with no line
  const meanViz = (body) => {
    const t = String(body || ''); const ls = t.split('\n');
    if (!/\\bar\{X\}|\\overline\{x\}|\bmean\b|اوسط/i.test(t)) return '';
    const list = [...String(ls[0] || '').matchAll(/\$([^$]+)\$/g)].map((m) => m[1].trim()).find((m) => /^-?\d+(?:\.\d+)?(?:\s*[,،]\s*-?\d+(?:\.\d+)?){2,11}$/.test(m));
    if (!list) return '';
    const values = list.split(/\s*[,،]\s*/).map(Number);
    const blank = /you fill this in|آپ (?:بتائیں|لکھیں|مکمل کریں)/i.test(t);
    const stated = [...t.matchAll(/\\bar\{X\}\s*=\s*(-?\d+(?:\.\d+)?)\s*\$/g)].map((m) => m[1]).pop();
    const svg = meanChart({ values, mean: blank ? '?' : (stated == null ? null : stated), rtl });
    if (!svg || (!blank && stated == null)) return '';
    counts.visuals += 1;
    return `<div class="sviz-w">${svg}</div>`;
  };
  const label = (text, icon = '', cls = '') => (has(text) || icon ? `<div class="slab${cls ? ` ${cls}` : ''}" dir="${dirOf(text)}">${icon}<span>${rt(stripEmoji(text))}</span></div>` : '');
  const tag = (t) => {
    if (!has(t)) return '';
    const lv = (/^\[([KUA])\]/.exec(t) || [])[1];
    const cls = lv ? ` ${lv.toLowerCase()}` : /support|سہار/.test(t) ? ' sup' : /extension|توسیع/.test(t) ? ' ext' : '';
    return `<span class="stag${cls}" dir="${dirOf(t)}">${lv ? LEVEL_ICON[lv]() : ''}${rt(t)}</span>`;
  };
  const card = (cls, inner) => { counts.cards += 1; return `<div class="sc ${cls}${/class="sfigw"/.test(inner) ? ' hasfig' : ''}">${inner}</div>`; };
  const img = (id) => {
    const im = id && images[id];
    if (!im || !im.dataUri) return '';
    counts.pictures += 1;
    return `<figure class="sfig">${has(im.label) ? `<figcaption class="sbadge">${ICON.diagram()}<span dir="${dirOf(im.label)}">${esc(im.label)}</span></figcaption>` : ''}<img src="${im.dataUri}" alt="${esc(im.label || 'diagram')}"></figure>`;
  };
  // a numbered or plain list, each row with its tag at the end
  const rows = (items, numbered, cls = '', iconOf = null) => `<div class="srows${cls}">${(items || []).map((it, i) => {
    const t = String(it.text || '');
    const body = t.split('\n').filter(has);
    const first = body.shift() || '';
    const ico = iconOf ? iconOf(it, i) : '';
    return `<div class="srow${ico ? ' has-ti' : ''}" dir="${dirOf(t)}">${ico ? `<i class="skpi">${ico}</i>` : ''}${numbered ? `<b class="sn">${i + 1}</b>` : ''}<div class="srow-b"><div class="sl">${rtx(first)}${it.tag ? ` ${tag(it.tag)}` : ''}</div>${underViz(first)}${body.map((l) => line(l)).join('')}</div></div>`;
  }).join('')}</div>`;

  // ── one card, by the lp_doc block it came from ─────────────────────────────────────────────
  const renderers = {
    seq: (s) => {
      let today = false;
      return card('s-seq', String(s.body || '').split('\n').filter(has).map((l) => {
        const isToday = /^\*\*[^*]+\*\*$/.test(l.trim());
        const icon = isToday ? ICON.today() : (today ? ICON.flag() : ICON.past());
        if (isToday) today = true;
        return `<div class="sseq${isToday ? ' now' : ''}" dir="${dirOf(l)}">${icon}<span>${rt(l)}</span></div>`;
      }).join(''));
    },
    outcome: (s) => {
      // an outcome code (M-09-A-07) becomes a pill; any other part stays in the label, as printed
      const bits = String(s.label || '').split(' · ');
      const isCode = (b) => /^[A-Z]{1,4}-\d{2}(-[A-Z0-9]{1,4})+$/.test(b.trim());
      const name = bits.filter((b) => !isCode(b)).join(' · ');
      const codes = bits.filter(isCode);
      const body = String(s.body || '').split('\n').filter(has);
      return card('s-outcome', `<div class="slab" dir="${dirOf(name)}">${ICON.target()}<span>${rt(name)}</span>${codes.map((c) => `<span class="scode" dir="${dirOf(c)}">${rt(c)}</span>`).join('')}</div>`
        + body.map((l, i) => {
          if (/^\*\*✓\*\*/.test(l)) return `<div class="so-promise" dir="${dirOf(l)}">${ICON.tick()}<span>${rt(l.replace(/^\*\*✓\*\*\s*/, ''))}</span></div>`;
          return `<div class="${i === 0 ? 'so-main' : 'sl'}" dir="${dirOf(l)}">${rt(l)}</div>`;
        }).join(''));
    },
    rvideo: (s) => card('s-res s-video', `${ICON.video()}<div class="sres-t" dir="${dirOf(s.body)}">${rt(stripEmoji(s.body))}</div>`),
    rmat: (s) => card('s-res s-mat', `${ICON.materials()}<div class="sres-t" dir="${dirOf(s.body)}">${rt(stripEmoji(s.body))}</div>`),
    rpace: (s, ctx) => card('s-res s-pace', `${ICON.pacing()}<div class="sres-t" dir="${dirOf(s.body)}">${rt(stripEmoji(s.body))}${(() => { const b = pacingBar(s.body, ctx.stages, { rtl }); if (b) counts.pictures += 1; return b; })()}</div>`),
    keywords: (s) => card('s-kw', label(s.lead, ICON.key()) + `<div class="skw">${(s.items || []).map((it, i) => {
      // the word's own first letter, as a badge
      const first = (String(it.text).replace(/^[\s*'‘“"]+/, '').match(/^./u) || [''])[0];
      const term = termOf(it.text);
      if (term) counts.visuals += 1;
      const badge = term ? `<span class="sini sini-t">${termIcon(term)}</span>` : `<span class="sini sini${i % 6}">${esc(first.toUpperCase())}</span>`;
      return `<div class="skw-i" dir="${dirOf(it.text)}">${badge}<span class="skw-t">${rt(it.text)}</span></div>`;
    }).join('')}</div>`),
    warmup: (s) => `<div class="sgrp">${label(s.lead, ICON.warmup(), 'rule')}</div>` + card('s-warm', rows(s.items, true)),
    hook: (s) => card('s-navy s-hook', `<span class="sfigw">${FIG.think()}</span>` + label(s.label, ICON.question()) + navyBody(s.body)),
    ask: (s) => card('s-ask', label(s.label, ICON.question()) + lines(s.body)),
    watch: (s) => card('s-watch', label(s.label, ICON.warn()) + lines(s.body)),
    reteach: (s) => card('s-watch s-reteach', label(s.label, ICON.redo()) + lines(s.body)),
    board: (s) => card('s-board', label(s.label, ICON.board()) + lines(s.body)),
    cite: (s) => `<div class="scite" dir="${dirOf(s.body)}">${ICON.book()}<span>${rt(s.body)}</span></div>`,
    para: (s) => `<div class="spara">${lines(s.body)}</div>`,
    keypoints: (s) => {
      const items = s.items || [];
      const terms = items.map((it) => termOf(it.text));
      const pictured = items.length > 1 && terms.every(Boolean);
      if (pictured) counts.visuals += items.length;
      return `<div class="skp">${has(s.lead) ? label(s.lead, ICON.bulb(), 'rule') : ''}${rows(items, false, pictured ? ' dots pics' : ' dots', pictured ? (it, i) => termIcon(terms[i]) : null)}</div>`;
    },
    latex: (s) => card('s-latex', lines(s.body)),
    chem: (s) => card('s-latex', lines(s.body)),
    worked: (s) => card('s-worked', `<span class="sfigw">${FIG.teach()}</span><div class="spill amber" dir="${dirOf(s.label)}">${ICON.teach()}<span>${rt(stripEmoji(s.label))}</span></div>` + lines(s.body) + matrixViz(s.body) + meanViz(s.body)),
    faded: (s) => card('s-faded', `<span class="sfigw">${FIG.pair()}</span><div class="spill green" dir="${dirOf(s.label)}">${ICON.group()}<span>${rt(stripEmoji(s.label))}</span></div>` + lines(s.body) + matrixViz(s.body) + meanViz(s.body)),
    figure: (s) => card('s-fig', label(s.label) + lines(s.body)),
    diagram: (s) => card('s-diag', (s.imageIds || []).map(img).join('')),
    grouplabel: (s) => `<div class="sgrp">${label(s.body, /mcq|سوال/i.test(s.body) ? ICON.exam() : ICON.warn(), 'rule')}</div>`,
    mistakes: (s) => (s.items || []).map((it) => {
      const half = (t, icon, cls) => {
        const ls = String(t || '').split('\n').filter(has);
        const head = ls.length && /^\*\*[^*]+\*\*$/.test(ls[0].trim()) ? ls.shift().replace(/^\*\*[✗✓]?\s*|\*\*$/g, '') : '';
        return `<div class="${cls}">${head ? `<div class="smh" dir="${dirOf(head)}">${icon}<span>${rt(head)}</span></div>` : ''}${ls.map((l) => line(l)).join('')}</div>`;
      };
      quiet = true; const q = half(it.q, ICON.cross(), 'smq'); quiet = false;
      return card('s-mis', q + half(it.a, ICON.tick(), 'sma'));
    }).join(''),
    practice: (s) => card(/exit|خارجی/i.test(s.lead || '') ? 's-exit' : 's-prac', `${/exit|خارجی|گھر|home/i.test(s.lead || '') ? '' : `<span class="sfigw">${FIG.write()}</span>`}<div class="spill green" dir="${dirOf(s.lead)}">${/exit|خارجی/i.test(s.lead || '') ? ICON.ticket() : /گھر|home/i.test(s.lead || '') ? ICON.house() : ICON.pencil()}<span>${rt(stripEmoji(s.lead))}</span></div>` + rows(s.items, s.marker === 'num')),
    exit: (s) => card('s-exit', label(s.lead, ICON.ticket()) + rows(s.items, s.marker === 'num')),
    hw: (s) => `<div class="shw">${has(s.lead) ? label(s.lead, ICON.house()) : ''}${rows(s.items, s.marker === 'num', ' cards')}</div>`,
    diff: (s) => `<div class="sgrp">${label(s.lead, ICON.star(), 'rule')}</div>` + (s.items || []).map((it, i) => {
      const ls = String(it.text || '').split('\n').filter(has);
      const head = ls.length && /^\*\*[^*]+\*\*$/.test(ls[0].trim()) ? ls.shift().replace(/^\*\*|\*\*$/g, '') : '';
      const icon = [ICON.help(), ICON.barrier(), ICON.rocket()][i] || ICON.star();
      return card('s-diff', `${head ? `<div class="smh" dir="${dirOf(head)}">${icon}<span>${rt(head)}</span></div>` : ''}${ls.map((l) => line(l)).join('')}`);
    }).join(''),
    checkpoint: (s) => card('s-navy s-check', label(s.label, ICON.medal()) + navyBody(s.body, true)),
    continues: (s) => `<div class="scont" dir="${dirOf(s.body)}">${rt(s.body)}</div>`,
    p2head: (s) => {
      const ls = String(s.body || '').split('\n').filter(has);
      return `<div class="sp2h"><div class="sp2pill" dir="${dirOf(ls[0])}">${ICON.clipboard()}<span>${rt(String(ls[0] || '').replace(/^\*\*|\*\*$/g, ''))}</span></div>`
        + ls.slice(1).map((l, i) => `<div class="${i === ls.length - 2 ? 'sp2t' : 'sp2s'}" dir="${dirOf(l)}">${rt(String(l).replace(/^\*\*|\*\*$/g, ''))}</div>`).join('') + '</div>';
    },
    draworder: (s) => card('s-order', label(s.lead) + rows(s.items, s.marker === 'num')),
    boardcap: (s) => `<div class="scap">${lines(s.body)}</div>`,
    srq: (s) => card('s-navy s-srq', label(s.label, ICON.exam()) + `<div class="sq-strong">${lines(s.body)}</div>`),
    srqms: (s) => card('s-ms', label(s.lead, ICON.tick()) + rows(s.items, false, ' boxes')),
    howmarked: (s) => `<div class="shm">${lines(s.body)}</div>`,
    hwkey: (s) => (s.items || []).map((it) => {
      const ls = String(it.text || '').split('\n').filter(has);
      const head = ls.length && /^\*\*[^*]+\*\*$/.test(ls[0].trim()) ? ls.shift().replace(/^\*\*|\*\*$/g, '') : '';
      return card('s-key', `${head ? `<div class="skh" dir="${dirOf(head)}">${rt(head)}</div>` : ''}${ls.map((l, i) => line(l, i === ls.length - 1 && ls.length > 1 ? ' sk-ans' : '')).join('')}`);
    }).join(''),
    coach: (s) => card('s-navy s-coach', `<span class="sfigw">${FIG.coach()}</span>` + lines(s.body, ' scl')
      + `<div class="scsteps">${C.coachSteps.map((t, i) => `<div class="scstep">${[ICON.mic(), ICON.chat(), ICON.reply()][i]}<b>${i + 1}</b><span dir="${dirOf(t)}">${esc(t)}</span></div>`).join('')}</div>`),
    // the exam bank's split cards: the parts are drawn in order, top to bottom, as on a phone
    mcq: (s) => card('s-mcq', subs([...(s.left || []), ...(s.right || [])])),
    erq: (s) => card('s-erq', subs([...(s.left || []), ...(s.right || [])])),
  };
  // the navy cards: the question in white, "Look for:" and the mark lines under it
  function navyBody(body, scheme = false) {
    return String(body || '').split('\n').filter(has).map((l, i) => {
      if (i === 0) return `<div class="sq-strong" dir="${dirOf(l)}">${rt(l)}</div>`;
      if (/^\*\*[^*]{1,40}:\*\*/.test(l)) return `<div class="slook" dir="${dirOf(l)}">${ICON.eye()}<span>${rt(l)}</span></div>`;
      return line(l, scheme ? ' sms' : '');
    }).join('');
  }
  // the parts of a split card
  function subs(list) {
    return list.map((b) => {
      const role = (/\bict-r-([a-z0-9]+)/.exec(b.cls || '') || [])[1] || '';
      if (role === 'mcqq') return `<div class="smcq-q">${lines(b.body)}</div>`;
      if (role === 'mcqopts') return `<div class="sopts">${(b.items || []).map((it) => {
        // the option's own letter, as an answer-sheet bubble
        const m = /^\*\*([A-E])\.\*\*\s*([\s\S]*)$/.exec(String(it.text));
        const body = m ? `<b class="sbub">${m[1]}</b> ${rt(m[2])}` : rt(it.text);
        return `<span class="sopt${it.tag ? ' key' : ''}" dir="${dirOf(it.text)}">${body}${it.tag ? ICON.tick() : ''}</span>`;
      }).join('')}</div>`;
      if (role === 'mcqnote') return `<div class="snote">${lines(b.body)}</div>`;
      if (role === 'erqq') return `<div class="serq-q">${label(b.label, ICON.exam())}<div class="sq-strong">${lines(b.body)}</div></div>`;
      if (role === 'erqplan') return `<div class="splan">${(b.items || []).map((it) => `<div class="splan-r" dir="${dirOf(it.text)}"><span>${rt(it.text)}</span>${has(it.tag) ? `<b class="smark">${rt(it.tag)}</b>` : ''}</div>`).join('')}</div>`;
      return generic(b);
    }).join('');
  }
  // a card of a kind not named above: drawn plainly by its shape, so nothing is ever left out
  function generic(s) {
    switch (s.type) {
      case 'text': return `<div class="spara">${lines(s.body)}</div>`;
      case 'note': return card('s-plain', label(s.label) + lines(s.body));
      case 'bullets': return card('s-plain', label(s.lead) + rows(s.items, s.marker === 'num'));
      case 'qa': return (s.items || []).map((it) => card('s-plain', `${lines(it.q)}${lines(it.a, ' sk-ans')}`)).join('');
      case 'images': return card('s-diag', (s.imageIds || []).map(img).join(''));
      case 'split': return card('s-plain', subs([...(s.left || []), ...(s.right || [])]));
      default: return `<div class="spara">${lines(s.body || s.text || '')}</div>`;
    }
  }

  // ── the two parts ──────────────────────────────────────────────────────────────────────────
  const secs = guide.sections || [];
  const cut = secs.findIndex((s) => roleOf(s) === 'p2head');
  const partSecs = cut > 0 ? [secs.slice(0, cut), secs.slice(cut)] : [secs];
  const stages = [];
  for (const s of partSecs[0]) { const st = stageOf(s); if (STAGES.includes(st) && !stages.includes(st)) stages.push(st); }
  const ctx = { stages };
  const draw = (s) => {
    const r = renderers[roleOf(s)];
    if (!r) counts.unknown.push(roleOf(s) || s.type);
    return r ? r(s, ctx) : generic(s);
  };
  const bar = (s, st) => `<div class="sbar sb-${st}"><span class="sbl">${STAGE_LETTER[st]}</span><span class="sbn" dir="${dirOf(s.heading)}">${esc(s.heading)}</span>`
    + `${has(s.time) ? `<span class="sbt" dir="${dirOf(s.time)}">${esc(s.time)}</span>` : ''}<span class="sbi">${stageIcon(st)}</span></div>`;
  const group = (s, g) => `<div class="sgh"><span class="sgl">${esc(g.toUpperCase())}</span><span class="sgn" dir="${dirOf(s.heading)}">${esc(s.heading)}</span></div>`;

  const parts = partSecs.map((list, k) => {
    let html = '';
    if (k === 0) html += hero();
    let curStage = ''; let curGroup = '';
    for (const s of list) {
      const st = stageOf(s);
      if (STAGES.includes(st) && st !== curStage) { html += bar(s, st); curStage = st; }
      const g = groupOf(s);
      if (g && g !== curGroup && has(s.heading)) { html += group(s, g); curGroup = g; }
      html += draw(s);
    }
    return `<section class="spart" data-part="${k + 1}"><div class="sbody">${html}</div>`
      + `<footer class="sfoot" dir="${dir}"><div class="sfl" dir="${dirOf(meta.footer)}">${esc(meta.footer || '')}</div>`
      + `<div class="sfr"><b>${esc(C.byline)}</b> · <span class="spno"></span></div></footer></section>`;
  });

  function hero() {
    const chips = (meta.chips || []).map((c) => c && c.value).filter(has);
    return `<header class="shero"><div class="shero-t"><div class="skick" dir="${dirOf(meta.subtitle)}">${esc(meta.subtitle || '')}</div>`
      + `<h1 dir="${dirOf(meta.title)}">${rt(meta.title || '')}</h1>`
      + chips.map((c, i) => `<div class="${i === 2 ? 'schip' : 'sloc'}" dir="${dirOf(c)}">${rt(c)}</div>`).join('')
      + `</div><div class="shero-p">${subjectPicture(meta.subject)}</div></header>`;
  }

  const bodyHtml = `<div class="icts" lang="${lang}" dir="${dir}" data-pno="${esc(meta.pageLabel || 'page {n} of {m}')}">${parts.join('')}</div>`;
  counts.pictures += 1;   // the subject picture
  return {
    headerHtml: '', bodyHtml,
    headCss: SECONDARY_CSS() + (/class="katex"/.test(bodyHtml) ? katexCss() : ''),
    pageLayout: { width: 520, parts: true },
    counts,
  };
}

// ── STYLE ─────────────────────────────────────────────────────────────────────────────────
// Sizes and colours measured from ICT's own production page at 520 px (getComputedStyle on its
// rendered HTML, 2026-09-30): body 21 px / 1.55 (Urdu 2.05), labels 16.33 px 800 capitals .09em,
// list rows 19.25 px, stage bars 36 px, title 33.25 px, 21 px side margins.
const FONTS = path.join(__dirname, '..', '..', '..', '..', 'node_modules', '@fontsource', 'inter', 'files');
function interFaces() {
  return [400, 600, 700, 800].map((w) => {
    const f = path.join(FONTS, `inter-latin-${w}-normal.woff2`);
    return fs.existsSync(f) ? `@font-face{font-family:'ICTS Inter';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2');}` : '';
  }).join('');
}
let _css = null;
const SECONDARY_CSS = () => (_css || (_css = interFaces() + `
.sheet{width:520px;padding:0;margin:0 auto;background:#fff}
html:not(.lp-print) body{background:#eef0f4}
.icts{--navy:#0B2545;--navy2:#13315C;--amber:#F2A20C;--amber-soft:#FDEBC8;--ink:#1a2233;--mut:#5b6472;--line:#e5e9f0;--leaf:#1F7A4D;
  --teach:#F2F6FC;--teach-l:#CBD8E8;--teach-i:#13315C;--do:#EFF7F2;--do-l:#BFE3CD;--do-i:#14603A;--watch:#FCEDE6;--watch-l:#F2C4AD;--watch-i:#B4531F;
  --note:#FFF8E8;--note-l:#F0DFB4;--note-i:#8A5F04;--quiet:#F5F7FA;--quiet-l:#E1E6EE;--quiet-i:#414A57;
  --fs:21px;--fs-row:19.25px;--fs-lbl:16.33px;--lh:1.55;
  font-family:'ICT Salawat','ICTS Inter',Inter,'Noto Sans',sans-serif;color:var(--ink);font-size:var(--fs);line-height:var(--lh);text-align:start}
.icts[dir="rtl"]{--lh:2.05;font-family:'ICT Salawat','Noto Nastaliq Urdu','ICTS Inter',sans-serif}
.icts *{box-sizing:border-box}
.icts :where(b){font-weight:700;color:inherit}
.icts :where([dir="ltr"]){font-family:'ICT Salawat','ICTS Inter',Inter,sans-serif}
.icts[dir="rtl"] :where([dir="rtl"]){font-family:'ICT Salawat','Noto Nastaliq Urdu','ICTS Inter',sans-serif}
.icts .katex{direction:ltr;unicode-bidi:isolate}
.icts .sic{display:inline-block;flex:none;width:24px;height:24px;vertical-align:-5px}
.icts img{max-width:100%}
.icts mjx-container,.icts svg[role="img"]{max-width:100%}
/* the parts: one 520 px column each; the printer gives each its own page as tall as itself */
.spart{width:520px;background:#fff;padding:10px 0 0;position:relative}
html:not(.lp-print) .spart{margin:0 auto 24px;box-shadow:0 0 0 1px #d9dbe1,0 6px 20px rgba(30,32,48,.08)}
.sbody{padding:0 21px;display:flex;flex-direction:column;gap:8px}
.sfoot{margin:14px 21px 0;padding:8px 0 10px;border-top:1px solid var(--line);font-size:var(--fs-lbl);line-height:1.4;color:var(--mut)}
.sfoot .sfl{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sfoot b{color:var(--navy2);font-weight:700}
.icts[dir="rtl"] .sfoot{line-height:1.9}
/* ── title card ── */
.shero{background:var(--navy);color:#fff;border-radius:9px;padding:9px 12px 10px 14px;display:flex;gap:10px;align-items:center;
  background-image:radial-gradient(circle at 92% 18%,rgba(242,162,12,.18),transparent 42%)}
.shero-t{flex:1;min-width:0}
.skick{color:var(--amber);font-size:var(--fs-lbl);font-weight:800;letter-spacing:.13em;text-transform:uppercase;line-height:1.3}
.shero h1{font-size:33.25px;font-weight:800;line-height:1.08;margin:3px 0 4px;color:#fff}
.shero h1[dir="rtl"]{line-height:1.7;font-size:31px}
.sloc{color:#C9D4E6;font-size:16.92px;line-height:1.55}
.schip{display:inline-block;margin:4px 0 1px;background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.35);color:#DBE5F3;border-radius:999px;
  padding:2px 10px;font-size:var(--fs-lbl);font-weight:800;letter-spacing:.04em;line-height:1.45}
.shero-p{flex:none;width:96px;height:96px;border-radius:50%;overflow:hidden;border:3px solid var(--amber);box-shadow:0 0 0 4px rgba(255,255,255,.12)}
.ssubj{display:block;width:100%;height:100%}
.icts[dir="rtl"] .skick,.icts[dir="rtl"] .schip{letter-spacing:0}
/* ── cards ── */
.sc{border:1px solid var(--line);border-radius:9px;padding:7px 12px;background:#fff}
.slab{display:flex;align-items:center;gap:7px;flex-wrap:wrap;color:var(--navy2);font-size:var(--fs-lbl);font-weight:800;letter-spacing:.09em;text-transform:uppercase;line-height:1.35;margin:0 0 3px}
.slab .sic{width:22px;height:22px;vertical-align:0}
.slab{flex-wrap:nowrap}.s-outcome .slab{flex-wrap:wrap}
.slab > span:not(.scode){min-width:0}
.slab.rule{border-inline-start:3px solid var(--amber);padding-inline-start:8px;margin:2px 0 0}
.sgrp{margin-top:4px}
.icts[dir="rtl"] .slab{letter-spacing:0;text-transform:none;font-size:18px;line-height:1.8}
.sl{line-height:var(--lh)}
.sl-n,.sl-b{display:flex;gap:8px;align-items:flex-start}
.sn{flex:none;min-width:24px;height:24px;border-radius:12px;background:var(--navy2);color:#fff;font-size:14px;font-weight:800;display:inline-flex;align-items:center;
  justify-content:center;margin-top:.3em;font-family:'ICTS Inter',Inter,sans-serif;padding:0 5px}
.icts[dir="rtl"] .sn{margin-top:.55em}
.sbx{flex:none;width:8px;height:8px;border-radius:50%;background:var(--amber);margin-top:.62em}
.icts[dir="rtl"] .sbx{margin-top:.95em}
.st{flex:1;min-width:0}
.stag{display:inline-block;background:var(--quiet);border:1px solid var(--quiet-l);color:var(--mut);border-radius:999px;padding:0 8px;font-size:14.5px;font-weight:700;
  line-height:1.6;margin-inline-start:4px;vertical-align:1px;max-width:100%}
.stag.k{background:#DDF4E6;border-color:#BFE3CD;color:#14603A}.stag.u{background:#E3EEFB;border-color:#C9DAF2;color:#13315C}.stag.a{background:#FDEBC8;border-color:#F0DFB4;color:#8A5F04}
.stag.sup{background:#E3EEFB;border-color:#C9DAF2;color:#13315C}.stag.ext{background:#EEE8FA;border-color:#DCD2F2;color:#4B3B8A}
/* lesson path */
.s-seq{background:var(--quiet);border-color:var(--quiet-l);padding:6px 12px;display:flex;flex-direction:column;gap:2px}
.sseq{display:flex;gap:8px;align-items:flex-start;font-size:18.67px;line-height:1.5;color:var(--mut)}
.sseq .sic{margin-top:.15em}
.sseq b{color:var(--navy2);font-weight:800}
.sseq.now{color:var(--navy2)}
.icts[dir="rtl"] .sseq{line-height:1.95}
/* outcome */
.s-outcome{background:var(--amber-soft);border:0;border-inline-start:6px solid var(--amber);padding:8px 14px;color:#6B5312}
.s-outcome .slab{color:var(--note-i)}
.scode{background:#fff;border:1.5px solid var(--amber);border-radius:999px;color:#7A5200;padding:0 8px;font-size:14.5px;letter-spacing:.04em;line-height:1.6}
.so-main{font-size:21.58px;font-weight:600;color:#3A2C0A;line-height:1.5}
.so-main b{font-weight:800}
/* Nastaliq needs room: a wrapped Urdu line in any of these sat on the line above it */
.icts[dir="rtl"] .so-main{line-height:2}
.icts[dir="rtl"] .sres-t,.icts[dir="rtl"] .scont{line-height:1.95}
.icts[dir="rtl"] .scstep,.icts[dir="rtl"] .sopt,.icts[dir="rtl"] .sp2s{line-height:1.9}
.so-promise{display:flex;gap:7px;align-items:flex-start;font-size:19.83px;font-weight:600;color:#6B5312;margin-top:2px}
.so-promise .sic{width:22px;height:22px;margin-top:.15em}
/* resource rows */
.s-res{display:flex;gap:9px;align-items:flex-start;padding:6px 11px}
.s-res > .sic{margin-top:.15em}
.sres-t{flex:1;min-width:0;font-size:var(--fs-row);line-height:1.55}
.sres-t b{font-size:var(--fs-lbl);font-weight:800;letter-spacing:.09em;text-transform:uppercase;margin-inline-end:6px}
.icts[dir="rtl"] .sres-t b{letter-spacing:0;text-transform:none}
.s-video{background:var(--note);border-color:var(--note-l);color:var(--note-i)}
.s-video .sres-t{text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px}
.s-video .sres-t b{text-decoration:none;display:inline-block}
.s-mat{background:var(--do);border-color:var(--do-l)} .s-mat .sres-t b{color:var(--do-i)}
.s-pace{background:var(--teach);border-color:var(--teach-l)} .s-pace .sres-t b{color:var(--teach-i)}
.space-bar{display:block;width:100%;height:auto;margin:6px 0 2px}
/* key words */
.s-kw{background:var(--quiet);border-color:var(--quiet-l);padding:7px 11px}
.s-kw .slab{color:var(--quiet-i)}
.skw{display:flex;flex-direction:column;gap:5px;margin-top:3px}
.skw-i{background:#fff;border:1px solid var(--quiet-l);border-inline-start:4px solid var(--amber);border-radius:6px;padding:3px 11px;font-size:var(--fs-row);color:var(--mut)}
.skw-i b{color:var(--navy2);font-weight:800}
/* stage bars */
.sbar{display:flex;align-items:center;gap:9px;border-radius:7px;color:#fff;padding:3px 8px 3px 11px;min-height:38px;margin-top:6px}
.sb-introduction{background:#0F6A73}.sb-development{background:#0B2545}.sb-activity{background:#1F7A4D}.sb-conclusion{background:#584A93}.sb-homework{background:#5b6472}
.sbl{flex:none;width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.24);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;font-family:'ICTS Inter',Inter,sans-serif}
.sbn{flex:1;font-size:20.42px;font-weight:800;letter-spacing:.02em;line-height:1.3}
.sbt{font-size:18.08px;font-weight:800}
.sbi{flex:none;width:30px;height:30px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(0,0,0,.2)}
.sbi .sic{width:21px;height:21px;vertical-align:0}
.icts[dir="rtl"] .sbn,.icts[dir="rtl"] .sbt{letter-spacing:0;line-height:1.85}
/* warm-up, practice, homework rows */
.srows{display:flex;flex-direction:column;gap:6px}
.srow{display:flex;gap:9px;align-items:flex-start;font-size:var(--fs-row)}
.srow-b{flex:1;min-width:0}
.s-warm{border:0;padding:0;background:none}
.s-warm .srow{background:var(--note);border:1px solid var(--note-l);border-radius:7px;padding:4px 10px}
.s-warm .sn,.s-key .skh{background:var(--amber)}
.s-warm b:not(.sn),.s-prac b:not(.sn),.s-exit b:not(.sn),.sk-ans b:not(.sn),.s-faded b:not(.sn),.s-worked .sl b:not(.sn){color:var(--leaf)}
.srows.dots .srow{gap:8px}
.srows.dots .srow::before{content:'';flex:none;width:8px;height:8px;border-radius:50%;background:var(--amber);margin-top:.66em}
.icts[dir="rtl"] .srows.dots .srow::before{margin-top:1em}
.srows.cards .srow{border:1px solid var(--line);border-radius:7px;padding:5px 10px;background:#fff}
.srows.boxes .srow::before{content:'';flex:none;width:17px;height:17px;border:2px solid var(--do-i);border-radius:4px;background:#fff;margin-top:.32em}
.icts[dir="rtl"] .srows.boxes .srow::before{margin-top:.7em}
/* navy landmarks: the opening question, the board question, the short-response question, coaching */
.s-navy{background:var(--navy);border:0;color:#C9D4E6;padding:9px 14px}
.s-navy .slab{color:var(--amber)}
.sq-strong{color:#fff;font-weight:700;font-size:22.17px;line-height:1.5}
.s-srq .sq-strong,.s-erq .sq-strong{font-size:var(--fs)}
.icts[dir="rtl"] .sq-strong{line-height:2}
.slook{display:flex;gap:8px;align-items:flex-start;font-size:18.67px;color:#C9D4E6;margin-top:3px}
.slook b{color:#fff}
.slook .sic{margin-top:.15em}
.s-navy .sl{color:#E3EAF5}
.s-navy .sl b{color:#fff}
.s-navy .sbx{background:var(--amber)}
.sl.sms{font-size:var(--fs-row)}
/* blue question, terracotta warnings, grey board */
.s-ask{background:var(--teach);border:0;border-inline-start:4px solid var(--navy2)}
.s-watch{background:var(--watch);border-color:var(--watch-l)}
.s-watch .slab{color:var(--watch-i)}
.s-board{background:var(--quiet);border:0;border-inline-start:4px solid var(--quiet-i)}
.s-board .slab{color:var(--quiet-i)}
.scite{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:var(--teach);border-radius:999px;padding:2px 11px 2px 6px;
  color:var(--navy2);font-size:var(--fs-lbl);font-weight:700;line-height:1.55}
.scite .sic{width:20px;height:20px;vertical-align:0}
.spara .sl{margin:2px 0}
.skp .srows{margin-top:4px}
/* worked example (amber) and the one done together (green) */
.s-worked{background:var(--note);border-color:var(--note-l)}
.s-faded,.s-latex{background:var(--do);border-color:var(--do-l)}
.s-latex{text-align:center}
.s-latex .katex{font-size:1.18em}
.spill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:2px 12px 2px 5px;color:#fff;font-size:var(--fs-lbl);font-weight:800;letter-spacing:.06em;
  text-transform:uppercase;line-height:1.5;margin:0 0 6px;max-width:100%}
.spill .sic{width:21px;height:21px;background:#fff;border-radius:50%;padding:2px;vertical-align:0}
.spill.amber{background:var(--amber)} .spill.green{background:var(--leaf)}
.icts[dir="rtl"] .spill{letter-spacing:0;text-transform:none;line-height:1.8}
/* mistakes: what the pupil writes (terracotta) over the question you ask back (mint) */
.s-mis{padding:0;overflow:hidden}
.smq,.sma{padding:5px 11px}
.smq{background:var(--watch)} .sma{background:var(--do)}
.smh{display:flex;align-items:center;gap:7px;font-size:var(--fs-lbl);font-weight:800;letter-spacing:.09em;text-transform:uppercase;line-height:1.4}
.smh .sic{width:20px;height:20px;vertical-align:0}
.smq .smh{color:var(--watch-i)} .sma .smh{color:var(--do-i)}
.icts[dir="rtl"] .smh{letter-spacing:0;text-transform:none;line-height:1.8}
/* practice and the exit ticket */
.s-prac{background:#fff;border:0;padding:0}
.s-prac .srows{gap:9px}
.s-prac .sn{background:var(--leaf)}
.s-exit{background:var(--do);border-color:var(--do-l)}
.s-exit .sn{background:var(--leaf)}
.s-diff{padding:6px 11px}
.s-diff .smh{color:var(--navy2);margin-bottom:2px}
.s-check .slab .sic{background:#fff;border-radius:50%}
.s-reteach .slab{color:var(--watch-i)}
.shw .srows{margin-top:4px}
.shw .sn{background:#5b6472}
.scont{font-size:var(--fs-lbl);font-style:italic;color:var(--mut);margin-top:6px;line-height:1.55}
/* diagrams from ICT's own engine */
.s-diag{border-width:1.5px;padding:9px 11px}
.sfig{margin:0;display:flex;flex-direction:column;gap:6px}
.sfig + .sfig{margin-top:10px}
.sfig img{display:block;width:auto;max-width:100%;height:auto;margin:0 auto}
.sbadge{align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:var(--navy);color:#fff;border-radius:999px;padding:2px 11px 2px 4px;
  font-size:var(--fs-lbl);font-weight:800;line-height:1.55}
.sbadge .sic{width:20px;height:20px;background:#fff;border-radius:50%;padding:2px;vertical-align:0}
/* ── teacher support ── */
.sp2h{border-bottom:3px solid var(--navy);padding:0 0 8px}
.sp2pill{display:inline-flex;align-items:center;gap:7px;background:var(--navy);color:#fff;border-radius:999px;padding:4px 14px 4px 6px;letter-spacing:.11em;
  text-transform:uppercase;font-size:var(--fs-lbl);font-weight:800}
.sp2pill .sic{width:21px;height:21px;vertical-align:0}
.sp2s{font-size:18.08px;font-weight:600;color:var(--mut);line-height:1.45;margin-top:4px}
.sp2t{font-size:23.92px;font-weight:800;color:var(--navy);margin-top:2px;line-height:1.3}
.icts[dir="rtl"] .sp2pill{letter-spacing:0;text-transform:none}
.icts[dir="rtl"] .sp2t{line-height:1.9}
.sgh{display:flex;align-items:center;gap:8px;margin-top:8px}
.sgh::after{content:'';flex:1;height:2px;background:var(--line)}
.sgl{flex:none;width:22px;height:22px;border-radius:6px;background:var(--navy);color:#fff;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center;font-family:'ICTS Inter',Inter,sans-serif}
.sgn{color:var(--navy);text-transform:uppercase;font-size:19.83px;font-weight:800;letter-spacing:.03em;line-height:1.3}
.icts[dir="rtl"] .sgn{text-transform:none;letter-spacing:0;line-height:1.9}
.s-order .slab{color:var(--navy2)}
.scap{font-size:15.5px;font-weight:600;color:var(--mut);text-align:center}
.s-mcq{padding:6px 11px;display:flex;flex-direction:column;gap:6px}
.smcq-q .sl{font-weight:700;color:var(--navy2)}
.sopts{display:flex;flex-wrap:wrap;gap:5px 6px}
.sopt{display:inline-flex;align-items:center;gap:5px;padding:2px 9px;border:1px solid var(--quiet-l);border-radius:6px;background:var(--quiet);font-size:18.67px;line-height:1.55}
.sopt.key{background:var(--do);border-color:var(--do-l);color:var(--do-i);font-weight:700}
.sopt.key b{color:var(--do-i)}
.sopt .sic{width:18px;height:18px;vertical-align:0}
.snote{background:var(--note);border-radius:6px;padding:4px 10px}
.snote .sl{font-size:16.92px;line-height:1.5;color:#7D6425}
.icts[dir="rtl"] .snote .sl{line-height:1.95}
.s-ms{background:var(--do);border-color:var(--do-l)}
.s-ms .slab{color:var(--do-i)}
.s-erq{border-color:var(--teach-l);padding:7px 12px}
.serq-q .slab{color:var(--navy2)}
.serq-q .sq-strong{color:var(--navy2);margin:2px 0 6px}
.splan{display:flex;flex-direction:column;gap:3px}
.splan-r{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:var(--fs-row)}
.smark{flex:none;color:var(--amber);font-size:18.08px;font-weight:800}
.shm .sl{font-size:16.92px;color:var(--mut)}
.shm .sl b{color:var(--ink)}
.s-key{background:var(--quiet);border-color:var(--quiet-l);padding:6px 11px}
.skh{display:inline-block;background:var(--navy2);color:#fff;border-radius:999px;padding:0 10px;font-size:14.5px;font-weight:800;letter-spacing:.06em;line-height:1.7;margin-bottom:3px}
.s-key .sl{font-size:18.67px;font-weight:600;color:var(--navy2)}
.s-key .sk-ans{color:var(--leaf)}
.s-coach .sl{color:#fff}
.s-coach .sl b{color:var(--amber);font-size:var(--fs-lbl);font-weight:800;letter-spacing:.09em;text-transform:uppercase}
.icts[dir="rtl"] .s-coach .sl b{letter-spacing:0;text-transform:none}
.scsteps{display:flex;flex-direction:column;gap:5px;margin-top:9px}
.scstep{display:flex;gap:9px;align-items:center;background:rgba(255,255,255,.08);border-radius:8px;padding:5px 10px;color:#fff;font-size:var(--fs-row);line-height:1.4}
.scstep > b{flex:none;width:24px;height:24px;border-radius:50%;background:var(--amber);color:#3A2A00;display:inline-flex;align-items:center;justify-content:center;font-size:14px;font-family:'ICTS Inter',Inter,sans-serif}
.icts[dir="rtl"] .scstep{line-height:1.9}
.s-plain .slab{color:var(--navy2)}
/* ── visual engagement (all drawn from the lesson's own lines) ── */
.sviz-w{margin:4px 0 2px;padding:6px 8px;background:#fff;border:1px dashed #C9D4E6;border-radius:9px;overflow:hidden}
.sviz{display:block;max-width:100%;height:auto;margin:0 auto}
.sreact{max-height:54px}
.sviz-m .sviz{width:100%}
.snw{white-space:nowrap}
.sratio,.smarks{display:inline-block;vertical-align:-1px;margin-inline-start:5px}
.squote{background:#FFF3D6;border-radius:5px;padding:0 3px;box-shadow:inset 0 -2px 0 #F6C343}
.s-navy .squote{background:rgba(246,195,67,.2);box-shadow:inset 0 -2px 0 #F6C343}
/* a path of numbered steps: a rail joins their numbers */
.spath{position:relative;display:flex;flex-direction:column;gap:3px}
.spath .sl-n{position:relative}
.spath .sl-n:not(:last-child)::after{content:'';position:absolute;top:1.5em;bottom:-0.9em;inset-inline-start:11px;width:2px;background:repeating-linear-gradient(to bottom,#C9D4E6 0 4px,transparent 4px 7px)}
.spath .sl-n .sn{position:relative;z-index:1}
.s-worked .spath .sl-n:nth-child(6n+1) .sn{background:#E0533F}.s-worked .spath .sl-n:nth-child(6n+2) .sn{background:#3B82C4}.s-worked .spath .sl-n:nth-child(6n+3) .sn{background:#F2A20C}
.s-worked .spath .sl-n:nth-child(6n+4) .sn{background:#2BB673}.s-worked .spath .sl-n:nth-child(6n+5) .sn{background:#8E5BC6}.s-worked .spath .sl-n:nth-child(6n) .sn{background:#16A085}
.s-faded .spath .sn{background:var(--leaf)}
/* wordless figures on the key cards, at the card's end side */
.sfigw{float:inline-end;width:72px;margin:-2px 0 2px 0;margin-inline-start:8px;margin-inline-end:-4px}
.hasfig > .spill{max-width:calc(100% - 82px)}
.spill > span{text-align:start}
.sfigr{display:block;width:100%;height:auto}
/* key words: the word's first letter as a badge */
.skw-i{display:flex;gap:9px;align-items:flex-start}
.sini{flex:none;width:26px;height:26px;border-radius:8px;color:#fff;font-weight:800;font-size:15px;display:inline-flex;align-items:center;justify-content:center;margin-top:.15em;font-family:'ICTS Inter','Noto Nastaliq Urdu',sans-serif}
.icts[dir="rtl"] .sini{font-size:14px;line-height:1;margin-top:.45em}
.sini0{background:#E0533F}.sini1{background:#3B82C4}.sini2{background:#F2A20C}.sini3{background:#2BB673}.sini4{background:#8E5BC6}.sini5{background:#16A085}
.skw-t{flex:1;min-width:0}
.sini-t{background:#fff;border:1.5px solid var(--quiet-l)}.sini-t .sti{width:20px;height:20px}
.srows.pics .srow::before{display:none}
.skpi{flex:none;display:inline-flex;margin-top:.12em}.skpi .sti{width:22px;height:22px}
.icts[dir="rtl"] .skpi{margin-top:.5em}
.sce{display:inline-flex;align-items:center;gap:3px;padding:0 7px 0 4px;border-radius:999px;color:#fff;font-weight:800;line-height:1.3;white-space:nowrap}
.sce-c{background:#E0533F}.sce-e{background:#3B82C4}
.sce .sce-i{width:12px;height:12px;flex:none}
.sce-ar{display:inline-block;vertical-align:-1px;margin:0 3px 0 0}.sce-w{white-space:nowrap}
.smean{max-height:170px}
/* mistakes: an arrow from what the pupil writes to the question you ask back */
.s-mis{position:relative}
.sma{position:relative}
.sma::before{content:'';position:absolute;top:-11px;inset-inline-end:14px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 0 0 2px #2BB673;
  background-image:linear-gradient(#2BB673,#2BB673),linear-gradient(45deg,transparent 45%,#2BB673 45% 60%,transparent 60%);background-size:2px 9px,0 0;background-position:center 4px;background-repeat:no-repeat}
.sma::after{content:'';position:absolute;top:-3px;inset-inline-end:20px;width:8px;height:8px;border-inline-end:2px solid #2BB673;border-bottom:2px solid #2BB673;transform:rotate(45deg)}
.icts[dir="rtl"] .sma::after{transform:rotate(-45deg)}
/* the exit ticket is a ticket */
.s-exit{position:relative;border-style:dashed;border-width:1.5px;
  -webkit-mask:radial-gradient(circle 9px at 0 50%,transparent 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 9px at 100% 50%,transparent 98%,#000) right/51% 100% no-repeat;
  mask:radial-gradient(circle 9px at 0 50%,transparent 98%,#000) left/51% 100% no-repeat,radial-gradient(circle 9px at 100% 50%,transparent 98%,#000) right/51% 100% no-repeat}
/* homework levels: a picture in the pill */
.stag .slv{width:15px;height:15px;vertical-align:-3px;margin-inline-end:3px}
/* MCQ options: the letter as an answer-sheet bubble */
.sbub{display:inline-flex;width:22px;height:22px;border-radius:50%;border:2px solid #13315C;color:#13315C;font-size:12.5px;font-weight:800;align-items:center;justify-content:center;
  margin-inline-end:7px;flex:none;font-family:'ICTS Inter',Inter,sans-serif;background:#fff}
.sopt.key .sbub{background:#2BB673;border-color:#2BB673;color:#fff}
.sopt{gap:0}
html.lp-print body{background:#fff}
`));

module.exports = { composeSecondary, CHROME };
