'use strict';
// Yemen region design pack — the definitive theme (single source, no patch layers).
// Reference: the approved BLN pilot "دليل الدرس اليومي" (card PROJ-044), replicated by
// measurement (pixel-sampled colours; specimen-selected typography) through Iqra's
// review rounds of 2026-08-12. Content contract (section ids) in DESIGN.md.
const fs = require('node:fs');
const path = require('node:path');

// Typography: Noto Naskh Arabic (reviewer-selected Naskh style, 2026-08-13 — replaces
// IBM Plex). Embedded when the package is installed; falls back to system fonts.
let FONT_FACES = '';
try {
  const dir = path.join(__dirname, '..', '..', '..', '..', 'node_modules', '@fontsource', 'noto-naskh-arabic', 'files');
  for (const w of [400, 500, 700]) {
    const f = fs.readdirSync(dir).find((x) => x.endsWith('arabic-' + w + '-normal.woff2'));
    if (f) FONT_FACES += "@font-face{font-family:'Noto Naskh Arabic';font-weight:" + w +
      ";font-display:swap;src:url(data:font/woff2;base64," +
      fs.readFileSync(path.join(dir, f)).toString('base64') + ") format('woff2');}";
  }
} catch (_) { /* package not installed — default fonts apply */ }

const THEME_OVERRIDE_CSS = FONT_FACES + `
:root{
  --c-amber:#e3a23c; --c-amber-ink:#9a6a12; --c-amber-soft:#fcf0d8;
  --c-red:#e0705a;   --c-red-ink:#c0392b;   --c-red-soft:#fbdfdf;
  --c-teal:#18a4a4;  --c-teal-ink:#0e7a7a;  --c-teal-soft:#dcf2f2;
  --c-green:#4b8a3f; --c-green-ink:#38682e; --c-green-soft:#e4f0e4;
  --c-blue:#4479ad;  --c-blue-ink:#2f5a88;  --c-blue-soft:#dfe9f5;
  --navy:#182448;
  --cream:#fcf0d8; --cream-line:#ecd9a0;
  --ink:#101a30; --muted:#6b7280; --line:#e5e7eb;
}
/* measured: WHITE page ground; IBM Plex everywhere */
body{background:#fcfcfc;font-family:'Noto Naskh Arabic','IBM Plex Sans Arabic','Noto Sans',sans-serif}
.sheet{background:#fcfcfc;padding-bottom:4px}
.s-title,.lp-header h1,.lp-header .sub,.d-step .st-label,.d-q,.d-note,.d-text,.d-bullets li,
.d-field,.d-chip,.st-body,.d-a,.d-img .cap,.d-inline-img .cap,.lp-footer,.s-time{
  font-family:'Noto Naskh Arabic','IBM Plex Sans Arabic','Noto Sans',sans-serif}

/* header: #182448 ministry strip (~78px) — title at RTL start, ministry lines opposite.
   The design set has NO hero banner: banner mode is suppressed. */
.lp-header{background:var(--navy);border-radius:0;border-bottom:4px solid #e3a23c;
  padding:24px 28px 22px;min-height:78px;display:flex;align-items:center;justify-content:space-between;gap:16px}
.lp-header h1{font-size:25px;font-weight:700;margin:0;text-shadow:none;order:1;white-space:nowrap}
.lp-header .sub{font-size:12px;font-weight:600;opacity:.92;margin:0;text-shadow:none;order:2;text-align:start;line-height:1.7;max-width:60%}
.lp-header .meta{display:none}
.lp-header.banner{background-image:none !important;min-height:78px;padding:24px 28px 22px}
.lp-header.banner::after{display:none}
.lp-header.banner .lp-htext{position:static;padding:0;display:flex;align-items:center;justify-content:space-between;gap:16px;width:100%}
.lp-header.banner h1{white-space:normal;font-size:19px;line-height:1.45}
.hbwrap,.deco{display:none}

/* rhythm */
.body{padding:6px 22px 2px;display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-flow:row dense;column-gap:8px}
.body > .section{grid-column:1/-1;min-width:0}
.section.sec-glossary{grid-column:6/13}
.section.sec-multigrade{grid-column:1/6}
.section.sec-glossary .panel,.section.sec-multigrade .panel{height:calc(100% - 2px);box-sizing:border-box}
.section{margin:0 0 4px}

/* section anatomy: the title sits ON the card; white pill carries time + GRR marker */
.s-head{position:relative;gap:8px;margin:0 0 -32px;z-index:2;padding:0 14px;align-items:center;height:32px}
.s-tab{flex:0 1 auto;background:transparent !important;box-shadow:none;padding:6px 2px}
.s-title{font-size:15px;font-weight:700}
.s-ic{display:none}
.s-time{position:static;margin-inline-start:auto;background:#fff;border:1px solid var(--line);
  color:var(--navy);font-weight:700;font-size:11px;box-shadow:0 1px 3px rgba(0,0,0,.12)}
.panel{background:#fff;border:2px solid #ccd2dc;border-radius:14px;padding:33px 15px 5px;box-shadow:none;border-color:#ccd2dc !important}

/* in-card figures — the pilot's card anatomy: TEXT | IMAGE | TEXT. Teacher
   actions at the inline start, the hero illustration centred and large, and the
   تحقق checkpoint as the far amber sidebar. Stage steps are body + تحقق by the
   content contract, so the two steps become the two text columns around the
   figure (display:contents lifts them into the card grid). */
.panel.has-inline-img{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,50%) minmax(0,.68fr);gap:10px;align-items:center}
.panel.has-inline-img .ii-body{display:contents}
.panel.has-inline-img .ii-body > .d-steps{display:contents}
.panel.has-inline-img .d-steps > .d-step:first-child{grid-column:1;grid-row:1;align-self:center}
.panel.has-inline-img .d-steps > .d-step:last-child{grid-column:3;grid-row:1;align-self:stretch;display:flex;flex-direction:column;justify-content:center}
.panel.has-inline-img .d-steps > .d-step:only-child{grid-column:1}
.panel.has-inline-img .d-inline-img{grid-column:2;grid-row:1;justify-self:center;width:100%}
.d-inline-img{border:1.5px solid #fff;border-radius:10px;background:#fff;box-shadow:0 2px 8px rgba(20,30,60,.10)}
.d-inline-img img{background:#fff;max-height:238px;width:100%;object-fit:contain}
.d-inline-img .cap{background:#fff;color:var(--muted);border-top:1px solid var(--line);font-size:10.5px;padding:3px 8px}

/* stage steps: no numbered circles; the LAST item is the amber checkpoint strip */
.d-steps{gap:4px}
.d-step{background:transparent;border:0;padding:2px 0}
.d-step .n{display:none}
.d-step .st-label{color:var(--navy);font-size:13.5px}
.d-step .st-body{font-size:14px;line-height:1.55;font-weight:500}
.d-step:last-child{background:var(--cream);border:1px solid var(--cream-line);border-radius:9px;padding:5px 10px;flex-basis:100%}
.d-step:last-child .st-label{color:#8a6d1d}
.d-step:last-child .st-label::before{content:"✔ "}

/* twins: white cards, coloured borders, centred coloured headers */
.d-qa{grid-template-columns:1fr 1fr;gap:10px}
.d-qc{border-radius:12px;padding:10px 12px;background:#fff}
.d-qc:first-child{border:2px solid var(--c-red)}
.d-qc:last-child{border:2px solid #35a06a}
.d-qc .d-q{font-size:13.5px;text-align:center;margin-bottom:6px}
.d-qc:first-child .d-q{color:var(--c-red-ink) !important}
.d-qc:last-child .d-q{color:#2c7d52 !important}
.d-qc .d-q::before{content:""}
.d-qc .d-a{color:var(--ink);font-size:14px;line-height:1.55;font-weight:500}
.d-qc .d-a::before{content:""}
.d-note{border-radius:10px;padding:9px 13px;font-size:14.5px;font-weight:500}
.d-bullets li{font-size:14px;line-height:1.44;font-weight:500}

/* ── template ROLE map — order-independent via sec-<id> classes (see DESIGN.md).
      Sections without contract ids get only the base skin above. ── */
.section.sec-lesson-line .s-head{display:none}
.section.sec-lesson-line .panel{background:transparent;border:0;box-shadow:none;padding:2px 4px 0}
.section.sec-lesson-line .d-text{font-size:13.5px;font-weight:700;color:var(--navy)}
.section.sec-goal .s-head{display:none}
.section.sec-goal .panel{border:2px solid var(--c-teal);border-color:var(--c-teal) !important;background:#fff;padding:10px 62px 10px 15px;position:relative;margin-right:14px}
/* pilot: dartboard-with-arrow icon at the goal card's left end */
.section.sec-goal .panel::before{content:"";position:absolute;right:-32px;top:50%;transform:translateY(-50%);width:58px;height:58px;background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='28' cy='36' r='25' fill='%23e0705a'/><circle cx='28' cy='36' r='18.5' fill='%23fff'/><circle cx='28' cy='36' r='12' fill='%23e0705a'/><circle cx='28' cy='36' r='5.5' fill='%23fff'/><path d='M28 36 L50 14' stroke='%23182448' stroke-width='4.5' stroke-linecap='round'/><path d='M50 14 l-1.5 9 M50 14 l-9 1.5' stroke='%23e3a23c' stroke-width='4' stroke-linecap='round'/></svg>") no-repeat center/contain}
.section.sec-goal .d-note{background:none !important;border:0 !important;color:var(--ink);padding:0;font-size:14px}
.section.sec-goal .d-note .nt{display:none}
.section.sec-goal .d-note b{color:var(--c-teal-ink)}
.section.sec-errors .s-title{color:#c0392b}
.section.sec-errors .panel{border:2px solid var(--c-red);border-color:var(--c-red) !important;background:#fff}
.section.sec-errors .d-qc{border-width:1.5px;border-radius:10px}
/* code-composed twin board: full width below the qa twins, RTL order (✗ right) */
/* The ✗/✓ board arrives as a TWIN BOARD, not an inline image, so the one-row rule has to
   name that class too — naming only .has-inline-img left this card stacked and it stayed the
   tallest non-activity block on the page. */
.section.sec-errors .panel.has-twin-board{display:flex;flex-direction:row-reverse;
  align-items:center;gap:10px}
.section.sec-errors .panel.has-twin-board .ii-body{display:block;flex:0 0 38%;width:38%}
.section.sec-errors .panel.has-twin-board .d-twin-board{flex:1 1 60%;margin:0}
.section.sec-errors .d-twin-board{max-width:470px;margin:2px auto 4px;flex-direction:row-reverse}
.section.sec-errors .d-twin-board .tb-half img{height:170px}
/* Illustrated errors strip (pilot): the خطأ/صواب twin-board figure spans the card
   width BELOW the twins instead of squeezing them into a side column. */
/* THE PILOT'S MISCONCEPTION STRIP IS ONE ROW: the explanation on the reading side, the
   ✗/✓ boxes beside it — not stacked. Stacking made the tallest non-activity card on the
   page out of two short pieces of content. */
.section.sec-errors .panel.has-inline-img{display:flex;flex-direction:row-reverse;
  align-items:center;gap:10px}
.section.sec-errors .panel.has-inline-img .ii-body{display:block;flex:0 0 38%;width:38%}
.section.sec-errors .d-inline-img{flex:1 1 60%;width:60%;max-width:62%;display:flex;flex-direction:column;align-items:center;box-shadow:none;border:0;background:transparent}
.section.sec-errors .d-inline-img img{max-height:172px;width:auto;max-width:96%;border:1px solid var(--line);border-radius:10px}
.section.sec-errors .d-inline-img .cap{border-top:0;background:transparent}
.section.sec-errors-caption .s-head{display:none}
.section.sec-errors-caption .panel{background:transparent;border:0;box-shadow:none;padding:0 6px}
.section.sec-errors-caption .d-text{font-size:12px;color:var(--muted);text-align:center;font-weight:600}
/* Two roles this pack gained when a lesson written with plain Arabic headings arrived:
   «المواد» and «بطاقة الخروج». Both were previously unrecognised, so the materials list
   was dropped from every LP and the exit ticket had nowhere to go. Titles in this pack are
   coloured TEXT rather than filled tabs, so a role with no colour of its own renders its
   title invisibly — which is exactly what happened on the first render. */
.section.sec-materials .s-title{color:var(--c-teal-ink)}
.section.sec-materials .panel{background:#f4faf9;border-color:#a8d4d0 !important}
.section.sec-materials .d-chip{background:#fff !important;border:1.5px solid #a8d4d0;
  color:var(--c-teal-ink) !important;font-weight:700;font-size:13px;padding:5px 12px}
.section.sec-materials .d-bullets li{font-size:13.5px}
/* the exit ticket is the last thing a pupil answers, so it reads as a question card */
.section.sec-exit-ticket .s-title{color:#8a6d1d}
.section.sec-exit-ticket .panel{background:var(--cream);border-color:#dbb95e !important}
.section.sec-exit-ticket .d-note{background:#fff !important;font-size:15px;font-weight:700}

.section.sec-stage-tamhid .s-title{color:#b23a48}
.section.sec-stage-tamhid .panel{background:#fcd8d8;border-color:#e79a9a !important}
.section.sec-stage-arad .s-title{color:var(--c-blue-ink)}
.section.sec-stage-arad .panel{background:#e7eef8;border-color:#9dbbde !important}
.section.sec-stage-tatbiq .s-title{color:var(--c-green-ink)}
/* practice/assessment figures a notch smaller than the intro heroes: keeps the
   guide to its 2-page promise while every card stays figure-led */
.section.sec-stage-tatbiq .d-inline-img img,.section.sec-stage-taqwim .d-inline-img img{max-height:180px}
.section.sec-stage-tatbiq .panel{background:#e9f2e5;border-color:#a3cc93 !important}
.section.sec-stage-taqwim .s-title{color:#8a6d1d}
.section.sec-stage-taqwim .panel{background:var(--cream);border-color:#dbb95e !important}
.section.sec-stage-taqwim .d-step:last-child{background:#fff;border-color:var(--cream-line)}
/* ONE STRIP, NOT ONE PER CARD. This chrome hangs off .sec-stage-taqwim, which was safe
   while a guide had exactly one التقويم card. A lesson whose التقويم has several labelled
   parts (دعم, تحد …) gets one card each — and printed the teacher-notes strip three times,
   which also cost the LP a third page. :has() hides it on every taqwim card that is
   immediately followed by another one, so only the last card in the run carries it. */
.section.sec-stage-taqwim:has(+ .section.sec-stage-taqwim)::after,
.section.sec-stage-taqwim:has(+ .section.sec-stage-taqwim)::before{display:none}

/* pilot chrome: teacher-notes strip after التقويم — dotted ruled lines and the
   dark ملاحظات tab; pure theme chrome, identical for every lesson */
.section.sec-stage-taqwim{position:relative}
.section.sec-stage-taqwim::after{content:"ملاحظات المعلّم بعد الدرس";display:block;margin-top:6px;height:38px;
  background-color:#fff;
  background-image:repeating-linear-gradient(to right,#b9c2d0 0 5px,transparent 5px 11px),repeating-linear-gradient(to right,#b9c2d0 0 5px,transparent 5px 11px);
  background-size:calc(100% - 92px) 1.5px,calc(100% - 92px) 1.5px;background-repeat:no-repeat,no-repeat;background-position:16px 32px,16px 48px;
  border:2px solid var(--navy);border-radius:12px;padding:6px 64px 16px 14px;
  font-weight:700;font-size:13px;color:var(--navy);text-align:start}
.section.sec-stage-taqwim::before{content:"ملاحظات";position:absolute;bottom:2px;right:2px;width:58px;height:56px;
  display:flex;align-items:flex-end;justify-content:center;box-sizing:border-box;padding-bottom:7px;
  background:var(--navy) url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 3.5h16a2.2 2.2 0 012.2 2.2v8.6a2.2 2.2 0 01-2.2 2.2H9.6L4.4 20.6v-4.1H4a2.2 2.2 0 01-2.2-2.2V5.7A2.2 2.2 0 014 3.5z' fill='%23fff'/><circle cx='8' cy='10' r='1.25' fill='%23182448'/><circle cx='12' cy='10' r='1.25' fill='%23182448'/><circle cx='16' cy='10' r='1.25' fill='%23182448'/></svg>") no-repeat center 8px/22px 22px;
  color:#fff;font-size:10.5px;font-weight:700;
  border-radius:0 10px 10px 0;z-index:1}
.section.sec-solutions .s-title{color:var(--c-teal-ink)}
.section.sec-solutions .panel{border-color:var(--c-teal) !important}
.section.sec-glossary .s-title{color:var(--navy)}
.section.sec-glossary .d-fields{display:block}
.section.sec-glossary .d-field{display:block;padding:5px 2px;border-bottom:1px dashed #c9cfda;font-size:13.5px;font-weight:700;line-height:1.5}
.section.sec-glossary .d-field:last-child{border-bottom:0}
.section.sec-glossary .d-field b{display:inline;margin-inline-end:6px;font-size:11px}
.section.sec-multigrade .d-bullets li{font-size:12.5px;line-height:1.5}
.section.sec-glossary .panel{border-color:var(--navy) !important}
.section.sec-multigrade .s-title{color:#a94f86}
.section.sec-multigrade .panel{border-color:#d68fb8 !important}
.section.sec-homework .s-title{color:var(--c-amber-ink)}
.section.sec-homework .panel{background:var(--cream);border-color:#dbb95e !important;position:relative;padding-left:66px}
.section.sec-homework .panel::before{content:"";position:absolute;left:14px;top:50%;transform:translateY(-50%);
  width:40px;height:40px;background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><circle cx='24' cy='24' r='22' fill='%2340c351'/><path d='M24 12c-6.6 0-12 5.1-12 11.4 0 2.3.75 4.5 2.05 6.3L12.6 35l5.5-1.4c1.75 1 3.8 1.6 5.9 1.6 6.6 0 12-5.1 12-11.4S30.6 12 24 12z' fill='%23fff'/><path d='M20.3 18.9c-.3-.65-.6-.66-.87-.67h-.74c-.26 0-.68.1-1.03.47s-1.36 1.32-1.36 3.22 1.39 3.73 1.58 3.99c.2.26 2.7 4.3 6.65 5.86 3.28 1.29 3.95 1.03 4.66.97.71-.07 2.3-.94 2.62-1.84.32-.9.32-1.68.23-1.84-.1-.16-.36-.26-.74-.45s-2.3-1.13-2.65-1.26c-.36-.13-.61-.2-.87.2-.26.39-1 1.25-1.23 1.51-.23.26-.45.29-.84.1-.39-.2-1.64-.6-3.12-1.92-1.15-1.02-1.93-2.28-2.16-2.67-.23-.39-.02-.6.17-.79.18-.17.39-.45.58-.68.2-.23.26-.39.39-.65.13-.26.06-.49-.03-.68-.1-.2-.85-2.12-1.19-2.87z' fill='%2340c351'/></svg>") no-repeat center/contain}
.section.sec-homework .d-note{background:none !important;border:0 !important}

/* misc */
.d-img{border-color:var(--line);border-radius:10px;box-shadow:none;background:#fff}
.d-img img{height:130px;background:#fff}
.d-img .cap{background:#fff;color:var(--muted);padding:5px 10px;font-size:11px;border-top:1px solid var(--line)}
.char-fig{background:#f6f7f9}
.d-mrow{background:#fff;border-color:var(--line)}
.d-fields{gap:8px 14px}
.d-field{font-size:13px}
.d-field b{font-size:9px}

/* footer: plain thin navy rule (the design set has NO dark footer band) */
.lp-footer{margin:6px 22px 0;padding:5px 4px 0;background:none;border-top:1.5px solid var(--navy);
  color:var(--navy);font-size:10.5px;text-align:center;font-weight:700}
.lp-footer b{color:var(--navy)}

/* ── ROUND 11 visual polish (reviewer): pastel fills, stronger text, compact
      visual language in the lower sections, figures fill their columns. ── */
/* 1) subtle tinted fills per role (twins/inner cards stay white and pop) */
.section.sec-goal .panel{background:#f4fbfb}
.section.sec-errors .panel{background:#fdf3f1}
.section.sec-solutions .panel{background:#f1fafa}
.section.sec-glossary .panel{background:#f5f7fc}
.section.sec-multigrade .panel{background:#fdf4f9}
/* 2) text: a step larger, darker, roomier */
:root{--ink:#0c1526}
.d-step .st-body{font-size:15.5px;line-height:1.56;font-weight:700}
.d-qc .d-a{font-size:15.5px;line-height:1.6;font-weight:700}
.d-bullets li{font-size:14.5px;line-height:1.48;font-weight:700}
.d-note{font-size:15px;font-weight:700}
.d-text,.d-field{font-weight:700}
.d-step:last-child .st-body{font-weight:700}
.section.sec-glossary .d-field{font-size:13px}
.section.sec-multigrade .d-bullets li{font-size:13px;line-height:1.55}
/* 3) lower sections: labels as chips, icons on titles — visual, not text-heavy */
.section.sec-solutions .d-bullets li b,.section.sec-multigrade .d-bullets li b{
  background:#fff;border:1.5px solid var(--c-teal);color:var(--c-teal-ink);
  padding:1px 9px;border-radius:9px;font-size:12px;margin-inline-end:4px;display:inline-block}
.section.sec-multigrade .d-bullets li b{border-color:#d68fb8;color:#a94f86}
.section.sec-solutions .s-title::before,.section.sec-glossary .s-title::before,.section.sec-multigrade .s-title::before{
  content:"";display:inline-block;width:15px;height:15px;vertical-align:-2px;margin-inline-end:6px;
  background:no-repeat center/contain}
.section.sec-solutions .s-title::before{background-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect x='2.5' y='2.5' width='19' height='19' rx='5' fill='%230e7a7a'/><path d='M7 12.5l3.2 3.2L17 8.9' stroke='%23fff' stroke-width='2.6' fill='none' stroke-linecap='round' stroke-linejoin='round'/></svg>")}
.section.sec-glossary .s-title::before{background-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path d='M4 4.5A2.5 2.5 0 016.5 2H20v17.5H6.75A2.75 2.75 0 004 22z' fill='%23182448'/><path d='M6.5 2H20v15H6.75c-1 0-1.95.3-2.75.85V4.5A2.5 2.5 0 016.5 2z' fill='%23fff' stroke='%23182448' stroke-width='1.6'/><path d='M9 7.5h7M9 11h7' stroke='%23182448' stroke-width='1.7' stroke-linecap='round'/></svg>")}
.section.sec-multigrade .s-title::before{background-image:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><circle cx='8.5' cy='8' r='3.4' fill='%23a94f86'/><circle cx='16.5' cy='9.5' r='2.7' fill='%23d68fb8'/><path d='M2.5 19.5c0-3.2 2.7-5.4 6-5.4s6 2.2 6 5.4z' fill='%23a94f86'/><path d='M14.7 19.5c.4-2.6 2-4.2 4.3-4.2 2 0 3.7 1.5 4 4.2z' fill='%23d68fb8'/></svg>")}
/* 5) no dead space around images: on the text-driven cards (تمهيد/عرض) the figure
      absolutely FILLS its stretched column so it can never grow the row; the
      figure-driven cards (تطبيق/تقويم) keep flow layout. */
.section.sec-stage-tamhid .d-inline-img,.section.sec-stage-arad .d-inline-img{position:relative;align-self:stretch;min-height:230px}
.section.sec-stage-tamhid .d-inline-img img,.section.sec-stage-arad .d-inline-img img{position:absolute;left:0;top:0;width:100%;height:calc(100% - 24px);object-fit:contain;max-height:none}
/* This pins the caption to the bottom of a hero IMAGE, whose box is positioned. A
   CODE figure's box is static, so an absolute caption escaped it and landed at the
   foot of the page — two of them stacked on each other, 440px from their figures.
   Restrict it to real images. */
.section.sec-stage-tamhid .d-inline-img:not(.d-code-fig) .cap,.section.sec-stage-arad .d-inline-img:not(.d-code-fig) .cap{position:absolute;bottom:0;left:0;right:0}
.section.sec-stage-tatbiq .d-inline-img img,.section.sec-stage-taqwim .d-inline-img img{max-height:166px}
/* 7) footer: stronger, pilot-proportioned band */
.lp-footer{border-top:2px solid var(--navy);font-size:11.5px;padding:6px 4px 0;margin:8px 22px 0}

/* ── ROUND 13: page-2 polish (numbered cards, notes box, footer, fills, wider figures) ── */
/* 1+4+6) numbered lines become airy white row-cards with circled numbers */
.section.sec-solutions .d-bullets,.section.sec-multigrade .d-bullets{gap:5px}
.section.sec-solutions .d-bullets li,.section.sec-multigrade .d-bullets li{
  background:#fff;border:1px solid rgba(20,30,60,.10);border-radius:9px;
  padding:3px 34px 3px 9px;font-size:14px;line-height:1.46}
.section.sec-solutions .d-bullets li::before,.section.sec-multigrade .d-bullets li::before{
  inset-inline-start:9px;top:50%;transform:translateY(-50%);width:18px;height:18px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  background:var(--c-teal-soft);color:var(--c-teal-ink);font-size:11px;line-height:1}
.section.sec-multigrade .d-bullets li::before{background:#f7e3ee;color:#a94f86}
/* 6) terms rows and homework note get soft inner cards */
.section.sec-glossary .d-field{background:#fff;border:1px solid rgba(20,30,60,.08);border-radius:8px;padding:2px 9px;margin-bottom:2px}
.section.sec-glossary .d-field:last-child{margin-bottom:0}
.section.sec-homework .d-note{background:#fff !important;border:1.5px solid #ecd9a0 !important;border-radius:10px;padding:6px 11px;font-size:13.5px}
/* 2) notes box: taller with top breathing room; tab = outlined message icon + label */
.section.sec-stage-taqwim::after{margin-top:8px;height:42px;padding:10px 70px 16px 14px;
  background-position:16px 40px,16px 56px;background-size:calc(100% - 100px) 1.5px,calc(100% - 100px) 1.5px}
.section.sec-stage-taqwim::before{height:72px;width:62px;bottom:2px;padding-bottom:8px;
  background:var(--navy) url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'><path d='M21 11.2c0 3.9-3.8 7-8.5 7-1 0-2-.13-2.9-.38L5.2 19.5l1.2-3C4.9 15.2 4 13.3 4 11.2c0-3.9 3.8-7 8.5-7s8.5 3.1 8.5 7z' stroke='%23fff' stroke-width='1.8' stroke-linejoin='round'/><path d='M8.8 10h6.9M8.8 12.8h4.4' stroke='%23fff' stroke-width='1.6' stroke-linecap='round'/></svg>") no-repeat center 11px/26px 26px}
/* 3) footer: pilot structure — text at the start, page number at the far end */
/* left end reserved for the composer page number; single centered line like the pilot */
.lp-footer{display:block;text-align:center;padding-left:130px}
/* page numbers are composer chrome now (PAGE_NUMBER_STYLE ar-bottom) — no footer ::after */
/* 5) slightly darker overall (weights unchanged) */
:root{--muted:#3a4660;--ink:#03080f}
/* 7) figures wider in their cards */
.panel.has-inline-img{grid-template-columns:minmax(0,.95fr) minmax(0,55%) minmax(0,.6fr)}


/* ── ROUND 14: Arabic-Indic badges + visual homework ── */
.section.sec-solutions .d-bullets li:nth-child(1)::before,.section.sec-multigrade .d-bullets li:nth-child(1)::before{content:"١"}
.section.sec-solutions .d-bullets li:nth-child(2)::before,.section.sec-multigrade .d-bullets li:nth-child(2)::before{content:"٢"}
.section.sec-solutions .d-bullets li:nth-child(3)::before,.section.sec-multigrade .d-bullets li:nth-child(3)::before{content:"٣"}
.section.sec-solutions .d-bullets li:nth-child(4)::before,.section.sec-multigrade .d-bullets li:nth-child(4)::before{content:"٤"}
.section.sec-solutions .d-bullets li:nth-child(5)::before,.section.sec-multigrade .d-bullets li:nth-child(5)::before{content:"٥"}
/* homework with a figure: small task diagram beside the note; the messenger icon
   yields its place to the figure */
.section.sec-homework .panel.has-inline-img{display:flex;gap:10px;align-items:center}
.section.sec-homework .panel.has-inline-img .ii-body{display:block;flex:1;min-width:0}
.section.sec-homework .panel.has-inline-img .d-inline-img{flex:0 0 31%;max-width:230px;position:static;align-self:auto}
.section.sec-homework .panel.has-inline-img .d-inline-img img{max-height:96px;position:static;height:auto}
.section.sec-homework .panel.has-inline-img::before{display:none}
.section.sec-homework .panel.has-inline-img{padding-left:14px}


/* ── ROUND 17: typography — labels and body one notch up; funded by rhythm trims ── */
.s-title{font-size:16px}
.s-time{font-size:11.5px}
.d-step .st-label{font-size:14px}
.d-qc .d-q{font-size:14px}
.d-step .st-body{font-size:16px}
.d-qc .d-a{font-size:16px}
.d-note{font-size:15.5px}
.section.sec-homework .d-note{font-size:14px}
.section.sec-solutions .d-bullets li,.section.sec-multigrade .d-bullets li{font-size:14.5px}
.section.sec-solutions .d-bullets li b,.section.sec-multigrade .d-bullets li b{font-size:12.5px;padding:1px 10px}
.section.sec-solutions .d-bullets li::before,.section.sec-multigrade .d-bullets li::before{width:19px;height:19px;font-size:11.5px}
.section.sec-glossary .d-field{font-size:14px}
.section.sec-glossary .d-field b{font-size:12px}
.d-inline-img .cap{font-size:11px}
.section.sec-errors-caption .d-text{font-size:12.5px}
.section.sec-lesson-line .d-text{font-size:14px}
/* funding trims — invisible rhythm, not content */
.section{margin:0 0 3px}
.panel{padding-bottom:4px}
.section.sec-stage-taqwim::after{margin-top:6px}
.section.sec-stage-tatbiq .d-inline-img img,.section.sec-stage-taqwim .d-inline-img img{max-height:158px}


/* ── ROUND 18 (teammate feedback): bigger type, blacker headings, stage icons ── */
/* headings: darker role inks (the light title colours read as not-bold) + larger */
.s-title{font-size:17px}
.section.sec-stage-tamhid .s-title{color:#8f2230}
.section.sec-stage-arad .s-title{color:#1e4266}
.section.sec-stage-tatbiq .s-title{color:#25511d}
.section.sec-stage-taqwim .s-title{color:#6e5410}
.section.sec-errors .s-title{color:#a82d20}
.section.sec-solutions .s-title{color:#0a5c5c}
.section.sec-glossary .s-title{color:#101a30}
.section.sec-multigrade .s-title{color:#8f3b6f}
.section.sec-homework .s-title{color:#6e5410}
.section.sec-goal .d-note b{color:#0a5c5c}
/* body: one more notch, tighter leading pays part of it */
.d-step .st-body{font-size:17px;line-height:1.5}
.d-qc .d-a{font-size:17px;line-height:1.52}
.d-note{font-size:16px}
.section.sec-homework .d-note{font-size:14.5px}
.section.sec-solutions .d-bullets li,.section.sec-multigrade .d-bullets li{font-size:15px;line-height:1.42}
.section.sec-glossary .d-field{font-size:14.5px}
.section.sec-lesson-line .d-text{font-size:14.5px}
.d-step .st-label{font-size:15px}
.d-qc .d-q{font-size:15px}
/* stage-title icons like the reference (leaf/book/pencil/board/warning) */
.section.sec-stage-tamhid .s-title::before,.section.sec-stage-arad .s-title::before,
.section.sec-stage-tatbiq .s-title::before,.section.sec-stage-taqwim .s-title::before,
.section.sec-errors .s-title::before{
  content:"";display:inline-block;width:17px;height:17px;vertical-align:-3px;margin-inline-end:6px;background:no-repeat center/contain}
.section.sec-stage-tamhid .s-title::before{background-image:url("data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M20 4C10 4 5 9 5 15c0 2.5 1.5 4.5 4 4.5 6 0 11-5 11-15.5zM5 20c3-6 7-9 11-11%22 fill%3D%22none%22 stroke%3D%22%23b23a48%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")}
.section.sec-stage-arad .s-title::before{background-image:url("data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zm0 0v14%22 fill%3D%22none%22 stroke%3D%22%232f5a88%22 stroke-width%3D%222%22 stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")}
.section.sec-stage-tatbiq .s-title::before{background-image:url("data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M4 20l1-4L16 5l3 3L8 19l-4 1zm11-14l3 3%22 fill%3D%22none%22 stroke%3D%22%2338682e%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22 stroke-linejoin%3D%22round%22%2F%3E%3C%2Fsvg%3E")}
.section.sec-stage-taqwim .s-title::before{background-image:url("data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Crect x%3D%224%22 y%3D%225%22 width%3D%2216%22 height%3D%2212%22 rx%3D%221.5%22 fill%3D%22none%22 stroke%3D%22%238a6d1d%22 stroke-width%3D%222%22%2F%3E%3Cpath d%3D%22M8 21l4-4 4 4M9 9h6M9 12h4%22 fill%3D%22none%22 stroke%3D%22%238a6d1d%22 stroke-width%3D%222%22 stroke-linecap%3D%22round%22%2F%3E%3C%2Fsvg%3E")}
.section.sec-errors .s-title::before{background-image:url("data:image/svg+xml,%3Csvg xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22 viewBox%3D%220 0 24 24%22%3E%3Cpath d%3D%22M12 4L2.5 20h19L12 4z%22 fill%3D%22none%22 stroke%3D%22%23a82d20%22 stroke-width%3D%222%22 stroke-linejoin%3D%22round%22%2F%3E%3Cpath d%3D%22M12 10v4.5%22 stroke%3D%22%23a82d20%22 stroke-width%3D%222.2%22 stroke-linecap%3D%22round%22%2F%3E%3Ccircle cx%3D%2212%22 cy%3D%2217.4%22 r%3D%221.2%22 fill%3D%22%23a82d20%22%2F%3E%3C%2Fsvg%3E")}
/* funding trims */
.section.sec-stage-tatbiq .d-inline-img img,.section.sec-stage-taqwim .d-inline-img img{max-height:150px}
.section.sec-stage-taqwim::after{height:40px;background-position:16px 38px,16px 54px}


/* ── ROUND 19: the footer band is composer chrome on EVERY page (pilot) — hide
      the strip-level band; sizes per reviewer ── */
.lp-footer{display:none}
.section.sec-errors .d-inline-img img{max-height:190px}
.section.sec-stage-tamhid .d-inline-img,.section.sec-stage-arad .d-inline-img{min-height:210px}
.section.sec-solutions .d-bullets li,.section.sec-multigrade .d-bullets li{font-size:15.5px}
.section.sec-glossary .d-field{font-size:15px}
.section.sec-homework .d-note{font-size:15px}
.section.sec-lesson-line .d-text{font-size:15px}
.d-step .st-body{font-size:17.5px}
.d-qc .d-a{font-size:17.5px}
.section.sec-stage-tatbiq .d-inline-img img,.section.sec-stage-taqwim .d-inline-img img{max-height:144px}
.section.sec-stage-taqwim::after{height:38px;background-position:16px 36px,16px 52px;padding-bottom:14px}


/* ── ROUND 20: heading hierarchy — larger, more prominent like the reference ── */
.s-title{font-size:19px;letter-spacing:.1px}
.s-head{height:34px;margin:0 0 -34px}
.d-step .st-label{font-size:16px}
.d-qc .d-q{font-size:16px}
.section.sec-goal .d-note b{font-size:17px}
.section.sec-stage-tamhid .s-title::before,.section.sec-stage-arad .s-title::before,
.section.sec-stage-tatbiq .s-title::before,.section.sec-stage-taqwim .s-title::before,
.section.sec-errors .s-title::before{width:19px;height:19px;vertical-align:-3.5px}


/* ── ROUND 21: beyond weight-700 — stroke the glyphs (Chromium render) ── */
:root{--ink:#000}
.s-title{font-size:21px;-webkit-text-stroke:.45px currentColor}
.s-head{height:36px;margin:0 0 -36px}
.d-step .st-label,.d-qc .d-q{-webkit-text-stroke:.3px currentColor}
.d-step .st-body,.d-qc .d-a,.d-bullets li,.d-note,.d-field,.d-text{-webkit-text-stroke:.22px currentColor}
.section.sec-goal .d-note b{-webkit-text-stroke:.35px currentColor}


/* ── ROUND 22: the errors board fills its strip (reviewer) — heroes pay ── */
.section.sec-errors .d-inline-img img{max-height:232px}
.section.sec-stage-tamhid .d-inline-img,.section.sec-stage-arad .d-inline-img{min-height:188px}


/* ── ROUND 23: errors figure — zoom the BOARD, not the card. Fixed frame crops the
      bitmap's beige margins (uniform scale, centred, no distortion); card border
      slightly darker/more defined. ── */
.section.sec-errors .panel{border-color:#c85340 !important}
.section.sec-errors .d-inline-img{height:252px;width:440px;max-width:96%;overflow:hidden;
  display:flex;align-items:center;justify-content:center;border:1.5px solid #c3cad6;border-radius:12px;background:#f6efe3}
.section.sec-errors .d-inline-img img{height:330px;max-height:none;width:auto;max-width:none;border:0;border-radius:0;flex:none}
.section.sec-errors .d-inline-img .cap{display:none}


/* ── ROUND 24: errors section — lighter border again, caption restored below the
      zoomed board (object-fit cover crops the bitmap's beige margins), tighter
      lower spacing so the block stays compact ── */
.section.sec-errors .panel{border-color:var(--c-red) !important;padding-bottom:2px}
.section.sec-errors .panel.has-inline-img{gap:6px}
.section.sec-errors .d-inline-img{height:auto;width:470px;max-width:96%;overflow:hidden;display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;border:1.5px solid #c3cad6;border-radius:12px;background:#fff}
.section.sec-errors .d-inline-img img{height:236px;width:100%;object-fit:cover;max-height:none;border:0;border-radius:0}
.section.sec-errors .d-inline-img .cap{display:block;background:#fff;border-top:1px solid var(--line);font-size:11.5px;padding:3px 8px;text-align:center}
.section.sec-stage-tamhid .d-inline-img,.section.sec-stage-arad .d-inline-img{min-height:180px}


/* ── ROUND: hybrid figures — code overlays on textless art + SVG math figures ── */
.ov-wrap{position:relative;display:block}
.ov{position:absolute;z-index:2;font-family:'Noto Naskh Arabic','IBM Plex Sans Arabic',sans-serif}
.ov-chip{background:#fff;border:1.5px solid var(--navy);color:var(--navy);font-weight:700;font-size:13px;
  padding:2px 10px;border-radius:9px;box-shadow:0 1px 4px rgba(20,30,60,.18);white-space:nowrap}
.ov-fraction{background:#fff;border:2px solid var(--navy);border-radius:10px;padding:3px 10px;
  display:flex;flex-direction:column;align-items:center;line-height:1.05;font-weight:800;color:var(--navy);font-size:15px}
.ov-fraction .fr-b{display:block;width:16px;border-top:2.5px solid var(--navy);margin:2px 0}
.ov-top-right{top:6px;right:6px}.ov-top-left{top:6px;left:6px}
.ov-bottom-right{bottom:6px;right:6px}.ov-bottom-left{bottom:6px;left:6px}
.ov-top{top:6px;left:50%;transform:translateX(-50%)}.ov-bottom{bottom:6px;left:50%;transform:translateX(-50%)}
.d-code-fig{background:#fff;display:flex;flex-direction:column;align-items:center;padding:8px 6px 0}
.d-code-fig .cf-svg{width:82%;max-height:170px}
.d-code-fig .cf-label{font-weight:800;font-size:22px;color:var(--navy);margin:2px 0 0}
.tb-label{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);background:#fff;border:1px solid var(--line);
  border-radius:8px;padding:1px 10px;font-weight:700;font-size:12.5px;color:var(--navy);white-space:nowrap}
.d-twin-board .tb-half{padding-bottom:26px;background:#fff}


/* hybrid fixes: ov-wrap fills the absolute-fill hero slots; compact code figures */
.section.sec-stage-tamhid .d-inline-img .ov-wrap,.section.sec-stage-arad .d-inline-img .ov-wrap{position:absolute;left:0;right:0;top:0;bottom:24px}
.section.sec-stage-tamhid .d-inline-img .ov-wrap img,.section.sec-stage-arad .d-inline-img .ov-wrap img{position:absolute;left:0;top:0;width:100%;height:100%;object-fit:contain;max-height:none}
.d-code-fig .cf-svg{max-height:132px}
.d-code-fig .cf-label{font-size:20px}


/* code figures are flow-laid-out even inside the hero slots (the absolute-fill
   rules are for bitmaps only) — otherwise the SVG + fraction label get clipped */
.section.sec-stage-tamhid .d-code-fig,.section.sec-stage-arad .d-code-fig{position:static;min-height:0;height:auto;align-self:center;padding:6px 6px 4px}
.section.sec-stage-tamhid .d-code-fig .cf-svg,.section.sec-stage-arad .d-code-fig .cf-svg{position:static;width:78%;height:auto;max-height:126px}
.d-code-fig .cf-label{margin-top:1px;line-height:1.1}
/* on-image chips sit clear of the caption strip */
.d-inline-img.has-ov .ov-bottom-right{bottom:8px;right:8px}


/* ── code-rendered teaching visuals: expressions, and the code-drawn ✗/✓ board ── */
.cf-expr{font:800 40px 'Noto Naskh Arabic','IBM Plex Sans Arabic',sans-serif;color:var(--navy);
  padding:14px 6px 8px;text-align:center;line-height:1.1}
.d-code-board{display:flex;flex-direction:row-reverse;align-items:stretch;gap:0;background:#fff;
  border:1.5px solid var(--line);border-radius:12px;overflow:hidden;max-width:470px;margin:4px auto 2px}
.d-code-board .cb-half{flex:1;position:relative;padding:6px 6px 4px;display:flex;flex-direction:column;
  align-items:center;justify-content:flex-start;min-width:0}
.d-code-board .cb-divider{width:2px;background:var(--line)}
.d-code-board .cb-mark{position:absolute;top:4px;inset-inline-start:6px;font-size:19px;font-weight:800;line-height:1;
  width:26px;height:26px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;
  box-shadow:0 1px 3px rgba(0,0,0,.22);z-index:1}
.d-code-board .cb-wrong .cb-mark{color:#c0392b}
.d-code-board .cb-correct .cb-mark{color:#1e8e4d}
.d-code-board .cb-vis{width:100%;display:flex;justify-content:center}
.d-code-board .cb-vis .cf-svg{max-height:104px;width:88%}
.d-code-board .cb-vis .cf-expr{font-size:30px;padding:8px 4px 2px}
.d-code-board .cb-label{margin-top:2px;background:#fff;border:1px solid var(--line);border-radius:8px;
  padding:1px 10px;font-weight:700;font-size:12.5px;color:var(--navy);white-space:nowrap}
.section.sec-errors .panel.has-twin-board .d-code-board{margin-top:6px}


/* process / cycle figures: wider than tall, so let them use the full card width */
.d-code-fig .cf-svg{max-height:150px}
.section.sec-stage-tamhid .d-code-fig .cf-svg,.section.sec-stage-arad .d-code-fig .cf-svg{max-height:150px}
.d-code-fig.cf-wide,.d-inline-img.cf-wide{width:100% !important;max-width:100% !important;flex:0 0 100% !important}


/* a process/cycle figure takes the whole card, stacked under the text, so its
   stage labels stay legible instead of shrinking into the figure column */
/* the panel is a 3-column grid; span the figure across all of it (no :has()
   dependency, which some renderers ignore) */
.panel.has-inline-img .d-code-fig.cf-wide{grid-column:1 / -1;grid-row:auto}
.panel.has-inline-img .d-code-fig.cf-wide{width:100%;max-width:100%;margin:4px auto 0;padding:2px;position:static;min-height:0}
.panel.has-inline-img .d-code-fig.cf-wide .cf-svg{width:100%;max-height:112px;position:static}


/* step cards and labelled diagrams span the card like a process does; each kind gets
   the height its drawing actually needs, capped so the lesson still fits two pages */
.panel.has-inline-img .d-code-fig.cf-k-steps .cf-svg{max-height:118px}
.panel.has-inline-img .d-code-fig.cf-k-labeled-parts .cf-svg{max-height:192px}
.section.sec-solutions .d-code-fig.cf-wide .cf-svg,.section.sec-homework .d-code-fig.cf-wide .cf-svg{max-height:96px}


/* a stacked step set behaves like a hero figure: it fills the reserved figure
   column instead of spanning the card, so it adds no page height */
.panel.has-inline-img .d-code-fig.cf-k-steps:not(.cf-wide){position:static;width:100%;max-width:100%}
.panel.has-inline-img .d-code-fig.cf-k-steps:not(.cf-wide) .cf-svg{position:static;width:100%;height:auto;max-height:168px}
.panel.has-inline-img .d-code-fig.cf-k-steps.cf-wide .cf-svg{max-height:112px}


/* the last stage and the closing sections always land on page 2 in this design set,
   so their figures run a little more compact — shaving page-1 residents instead only
   moves the page boundary down and gains nothing */
.section.sec-stage-taqwim .d-code-fig.cf-k-steps:not(.cf-wide) .cf-svg{max-height:126px}
.section.sec-stage-taqwim .d-code-fig.cf-wide .cf-svg{max-height:100px}


/* ───────────────────────────────────────────────────────────────────────────
   RULE: a status icon never overlaps instructional text. It gets its own slot
   in the layout, so the text cannot be covered at any size and nothing depends
   on the icon happening to be small.
   ─────────────────────────────────────────────────────────────────────────── */

/* code-drawn ✗/✓ board: each half becomes a two-column grid — a fixed icon column
   at the RTL start (the right), then the content. The icon spans both content rows,
   so it stays beside the drawing AND its caption instead of floating over either. */
.d-code-board .cb-half{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto auto;
  column-gap:8px;align-items:start;justify-items:center;padding:7px 8px 6px}
.d-code-board .cb-mark{position:static;grid-column:1;grid-row:1 / span 2;align-self:start;
  width:23px;height:23px;min-width:23px;font-size:15.5px;box-shadow:none;
  border:1.6px solid currentColor;background:#fff}
.d-code-board .cb-vis{grid-column:2;grid-row:1}
/* the caption may now wrap inside its column rather than run under the icon */
.d-code-board .cb-label{grid-column:2;grid-row:2;white-space:normal;text-align:center;max-width:100%}

/* twin IMAGE board: the badge moves off the picture into its own row above it, so it
   can never cover the image's code-rendered label chip. */
/* with no mini-visuals the board used to collapse to its content, leaving each
   caption barely 85px and wrapping short labels; hold the full width so a 2-3 word
   caption stays on one line (and the board stays the height it was) */
.d-code-board{width:100%}

.d-twin-board .tb-half{display:flex;flex-direction:column;align-items:stretch}
.d-twin-board .tb-mark{position:static;align-self:flex-start;margin:4px 7px 3px;box-shadow:none;
  border:1.6px solid currentColor;background:#fff;width:23px;height:23px;font-size:15.5px;
  display:flex;align-items:center;justify-content:center;border-radius:50%;line-height:1}


/* ───────────────────────────────────────────────────────────────────────────
   Teacher-notes strip: the box is ::after and its ملاحظات tab is ::before on the
   same section, so neither can measure the other. Their heights were hard-coded
   separately and drifted — a later round trimmed the box to 66px while the tab
   stayed at 72px, so the tab stood 8px above the box's top and floated 2px above
   its bottom. ONE variable now drives both, and the tab is derived from it, so
   changing the strip's height can never leave the tab behind again.
   ─────────────────────────────────────────────────────────────────────────── */
.section.sec-stage-taqwim{--notes-h:66px;--notes-bw:2px}
/* border-box so --notes-h IS the outer height; padding and the dotted rules are
   unchanged, so the strip renders exactly as before */
.section.sec-stage-taqwim::after{box-sizing:border-box;height:var(--notes-h);border-width:var(--notes-bw)}
/* the tab fills the box's inner height and sits flush in its bottom-inline-start
   corner, framed by the navy border on three sides instead of overhanging it */
.section.sec-stage-taqwim::before{height:calc(var(--notes-h) - var(--notes-bw) * 2);
  bottom:var(--notes-bw);right:var(--notes-bw);background-position:center 7px;padding-bottom:7px;
  border-radius:0 10px 10px 0}


/* ───────────────────────────────────────────────────────────────────────────
   BIGGER FIGURES. Two things were holding them small:
   (1) the shared theme caps every inline figure at max-width:240px, so a figure
       sat in 240px of the 394px column this design set reserves for it;
   (2) figures scale to CONTAIN, so with the width freed the binding dimension
       becomes the height cap — raising the cap is what actually enlarges them.
   Page 1 ends 15px short of its limit, so تمهيد/عرض can only take a little;
   page 2 had ~114px spare, which goes to تطبيق/تقويم.
   ─────────────────────────────────────────────────────────────────────────── */
.panel.has-inline-img .d-inline-img{max-width:100%}
.panel.has-inline-img .d-code-fig{max-width:100%}
/* On a card whose figure spans the full width, the text row still used only the
   narrow first column while the 394px figure column sat empty beside it — so the
   prose ran 8 lines deep and ate the height the figure wanted. Let the text span
   both columns on that row; the تحقق sidebar keeps the third. */
.panel.has-inline-img:has(.cf-wide) .d-step:first-child{grid-column:1 / 3}

/* the figure column, used in full */
.section.sec-stage-tamhid .d-inline-img,.section.sec-stage-arad .d-inline-img{min-height:196px}
.section.sec-stage-tatbiq .d-inline-img img,.section.sec-stage-taqwim .d-inline-img img{max-height:196px}
.section.sec-stage-tatbiq .d-code-fig .cf-svg{max-height:166px;width:100%}
.section.sec-stage-taqwim .d-code-fig.cf-k-steps:not(.cf-wide) .cf-svg{max-height:170px}
.section.sec-stage-taqwim .d-code-fig.cf-wide .cf-svg{max-height:140px}
/* the wide labelled diagram gets the same treatment within what page 1 allows */
.panel.has-inline-img .d-code-fig.cf-k-labeled-parts .cf-svg{max-height:206px}


/* ───────────────────────────────────────────────────────────────────────────
   FIGURES ARE THE POINT OF THE PAGE — size them generously.
   On a wide-figure card the تحقق sidebar sat in the text row only, so a 145px
   sidebar beside 60px of text forced 85px of empty height, and the figure had to
   fit in what was left. Let the sidebar span BOTH rows: the wasted height goes to
   the figure instead. Roughly 100px per wide-figure card.
   ─────────────────────────────────────────────────────────────────────────── */
.panel.has-inline-img:has(.cf-wide){grid-template-rows:auto auto;align-items:start}
.panel.has-inline-img:has(.cf-wide) .d-step:first-child{grid-column:1 / 3;grid-row:1}
.panel.has-inline-img:has(.cf-wide) .d-step:last-child{grid-column:3;grid-row:1 / span 2;align-self:stretch}
.panel.has-inline-img:has(.cf-wide) .d-code-fig.cf-wide{grid-column:1 / 3;grid-row:2}


/* a step ROW spanning the card: tall enough that the numerals and labels read at a
   glance, which is the whole point of the visual */
.panel.has-inline-img .d-code-fig.cf-k-steps.cf-wide .cf-svg{max-height:150px}
.section.sec-stage-taqwim .d-code-fig.cf-k-steps.cf-wide .cf-svg{max-height:150px}
/* a stacked PAIR fills its column instead of sitting small inside it */
.panel.has-inline-img .d-code-fig.cf-k-steps:not(.cf-wide) .cf-svg{max-height:200px}
/* the illustration: fill the figure column instead of leaving white space beside a
   small picture — the box now follows the picture's own 4:3 shape */
.section.sec-stage-tamhid .d-inline-img,.section.sec-stage-arad .d-inline-img{min-height:242px}


/* a spanning STACKED step set: full card width, cards tall enough to read at arm's
   length — this is the shape that replaced a small figure lost in its column */
.panel.has-inline-img .d-code-fig.cf-k-steps.cf-wide .cf-svg{max-height:176px;width:100%}
.section.sec-stage-taqwim .d-code-fig.cf-k-steps.cf-wide .cf-svg{max-height:158px}

/* ───────────────────────────────────────────────────────────────────────────
   FIGURE DENSITY (--figscale, 1 by default so nothing changes at rest).
   Scaling max-height caps turned out to be useless: a figure is usually smaller
   than its cap, so lowering the cap moves nothing. What actually governs height
   is the figure's WIDTH (an SVG keeps its aspect) and the hero floor. Those are
   what scale here.

   And the hero floor now applies only to a real illustration: a stage carrying a
   small code figure was paying 242px of empty height for a 120px drawing.
   ─────────────────────────────────────────────────────────────────────────── */
:root{--figscale:1}
/* SHRINK by width (an SVG keeps its aspect, so width governs height) but never grow
   past the column, or the drawing spills out of its card. */
.panel.has-inline-img .d-code-fig .cf-svg{width:min(100%, calc(100% * var(--figscale)))}
.panel.has-inline-img .d-inline-img:not(.d-code-fig) img{max-width:min(100%, calc(100% * var(--figscale)))}
.d-code-board .cb-vis .cf-svg{width:min(88%, calc(88% * var(--figscale)))}
/* GROW by cap: when a figure is already as wide as its column, only a taller cap lets
   it get bigger — which is what fills a page that came out sparse. */
.section.sec-stage-tamhid .d-inline-img.d-code-fig,.section.sec-stage-arad .d-inline-img.d-code-fig{min-height:0}
.section.sec-stage-tamhid .d-inline-img:not(.d-code-fig),.section.sec-stage-arad .d-inline-img:not(.d-code-fig){min-height:calc(242px * var(--figscale))}
.panel.has-inline-img .d-code-fig.cf-k-steps:not(.cf-wide) .cf-svg{max-height:calc(200px * var(--figscale))}
.section.sec-stage-taqwim .d-code-fig.cf-k-steps:not(.cf-wide) .cf-svg{max-height:calc(170px * var(--figscale))}
.section.sec-stage-tatbiq .d-code-fig .cf-svg{max-height:calc(166px * var(--figscale))}
.panel.has-inline-img .d-code-fig.cf-wide .cf-svg{max-height:calc(112px * var(--figscale))}
/* kind-specific caps must come AFTER the generic cf-wide cap: same specificity, so
   source order decides, and the generic 112px was silently flattening the labelled
   diagram to a fifth of the height it was given. */
.panel.has-inline-img .d-code-fig.cf-k-labeled-parts .cf-svg{max-height:calc(258px * var(--figscale))}
.panel.has-inline-img .d-code-fig.cf-k-steps.cf-wide .cf-svg{max-height:calc(176px * var(--figscale))}
.section.sec-stage-taqwim .d-code-fig.cf-k-steps.cf-wide .cf-svg{max-height:calc(158px * var(--figscale))}
.section.sec-stage-taqwim .d-code-fig.cf-wide .cf-svg{max-height:calc(140px * var(--figscale))}
.section.sec-solutions .d-code-fig.cf-wide .cf-svg,.section.sec-homework .d-code-fig.cf-wide .cf-svg{max-height:calc(96px * var(--figscale))}
.section.sec-errors .d-twin-board .tb-half img{height:calc(170px * var(--figscale))}
.d-twin-board .tb-half img{height:calc(150px * var(--figscale))}
.section.sec-errors .d-inline-img img{height:calc(204px * var(--figscale))}


/* MATHS DIRECTION: deliberately nothing here. Arabic writes «١٥ ÷ ٥ = ٣» with the
   first operand on the right, which is what default bidi produces — the digits of a
   number stay left-to-right, the neutral operators take the paragraph direction, so
   the tokens flow right-to-left. An earlier version of this pack forced every run
   left-to-right with unicode-bidi:isolate-override; that is what made expressions
   read backwards to an Arabic reader. Do not add a direction rule for maths. */

/* A process/cycle diagram is the MAIN visual of its stage, so it gets real size rather
   than sitting small inside a wide card — roughly 1.6x what it had. Density still
   scales it to fit, so this is a ceiling and not a fixed height. */
.panel.has-inline-img .d-code-fig.cf-k-process .cf-svg{max-height:calc(240px * var(--figscale))}
.section.sec-stage-taqwim .d-code-fig.cf-k-process .cf-svg{max-height:calc(210px * var(--figscale))}
.panel.has-inline-img .d-code-fig.cf-k-process{width:100%}


/* RAW-TEXT MODE. A stage whose body is ROW CARDS (.d-bullets) is not the pilot's
   three-column anatomy. That grid exists for body | figure | تحقق and relies on
   .d-steps using display:contents to fill columns 1 and 3; with row cards there is no
   .d-steps, so columns 2 and 3 sit empty while the cards squeeze into ~40% of the card
   and the figure falls off the page. One column, cards full width, figure below.
   Scoped by :has() so the approved step-shaped anatomy is untouched. */
.panel.has-inline-img:has(.d-bullets){display:block}
.panel.has-inline-img:has(.d-bullets) .ii-body{display:block;width:100%}
.panel.has-inline-img:has(.d-bullets) .d-inline-img,
.panel.has-inline-img:has(.d-bullets) .d-code-fig{width:100%;max-width:none;margin:10px auto 0;position:static}
.panel.has-inline-img:has(.d-bullets) .d-code-fig .cf-svg{max-height:none;width:100%}


/* A design-shaped card carrying ONE labelled part: prose beside its figure. The pilot
   anatomy is three columns (body | figure | تحقق) and relies on .d-steps to fill the
   flanking columns; a part card has a plain .d-text and no تحقق, so the third column
   would sit empty and the text would be squeezed. Two columns in the pilot's own
   proportion, figure beside the text where it belongs. */
.panel.has-inline-img:has(.d-text):not(:has(.d-steps)):not(:has(.d-bullets)){
  grid-template-columns:minmax(0,1fr) minmax(0,52%);align-items:center}
.panel.has-inline-img:has(.d-text):not(:has(.d-steps)):not(:has(.d-bullets)) .ii-body{display:block}
.panel.has-inline-img:has(.d-text):not(:has(.d-steps)):not(:has(.d-bullets)) .d-code-fig{
  grid-column:2;grid-row:1;margin:0;position:static}


/* ── RAW-TEXT LP: prominence and rhythm ─────────────────────────────────────────
   The caps above were tuned for the two-page format, where every pixel was
   contested: figures live at 112–168px so four stages plus the whole back page
   could fit. A raw-text LP has no page contract, so that thrift buys nothing and
   costs the design its visuals. Where a stage card carries one labelled part, the
   figure gets the size the pilot gives it. */
.section[class*="sec-stage-"] .panel.has-inline-img:has(.d-text) .d-code-fig .cf-svg{
  max-height:250px !important;width:100% !important}
.section[class*="sec-stage-"] .panel.has-inline-img:has(.d-text) .d-code-fig{padding:2px}
.section[class*="sec-stage-"] .panel.has-inline-img:has(.d-text) .d-code-fig.cf-wide .cf-svg{
  max-height:200px !important}

/* A card of pure prose is the thing that reads as a wall. It cannot be shortened —
   the lesson's words are the deliverable — but it can be set in two columns like a
   textbook, which halves the line count and the apparent density. Only cards with no
   figure: a card that already has a visual has its own rhythm. */
.section[class*="sec-stage-"] .panel:not(:has(.d-code-fig)):not(:has(.d-inline-img)) .d-text{
  column-count:2;column-gap:24px;column-rule:1px solid #e8ebf2;text-align:justify}
.section[class*="sec-stage-"] .panel:not(:has(.d-code-fig)) .d-text{line-height:1.62}

/* Breathing room between cards, and a lighter card edge so a page of many cards
   reads as a sequence rather than a grid of boxes. */
.section[class*="sec-stage-"]{margin:0 0 7px}
.section[class*="sec-stage-"] .panel{padding:34px 16px 9px}

/* ══ REVIEWER ROUND: bring the raw-text render back to the approved design language ══
   Reported problems: large plain text boxes; checkpoint/support/challenge each becoming
   another full-width card; matching activities squeezed into body text as a small embedded
   widget; weak hierarchy; every section the same pale tint. Structure was fixed in the
   mapper (sub-elements now ride on their stage card, each numbered exercise is its own
   activity); these are the rules that make it LOOK like the approved family. ── */

/* 1 · SUPPORT / CHALLENGE — compact two-up callouts inside their stage, never cards */
.d-callouts{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:8px}
.d-callout{display:flex;gap:7px;align-items:flex-start;background:rgba(255,255,255,.72);
  border:1px solid rgba(24,36,72,.14);border-radius:9px;padding:6px 9px}
.d-callout .co-l{flex:none;font-size:11px;font-weight:800;color:#fff;background:var(--navy);
  border-radius:99px;padding:2px 9px;line-height:1.5;white-space:nowrap}
.d-callout .co-b{font-size:13px;line-height:1.45;font-weight:600;color:var(--ink)}
/* a lone callout should not stretch across the whole card */
.d-callouts:has(.d-callout:only-child){grid-template-columns:minmax(0,62%)}

/* 1b · …AND THEY MUST SPAN THE CARD. The pilot stage card is a three-column grid
      (body | figure | تحقق) and .ii-body is display:contents, so anything appended to the
      body becomes a GRID ITEM — the callout row landed in the narrow first column and
      wrapped to one word per line. It spans all columns, under the three of them. */
/* …INSIDE THE TEXT COLUMN, as the approved pilot has them: two small tinted boxes stacked
   under «ماذا يفعل المعلم», not a band across the card. Full width was better than separate
   cards but still spent a whole row of the page on two short notes. */
.section .panel.has-inline-img .d-callouts,
.section .panel.has-twin-board .d-callouts{grid-column:1;grid-template-columns:1fr;gap:4px}
.section .panel .d-callouts{margin-top:8px}
.d-callout{padding:5px 8px;border-radius:8px}
.d-callout .co-l{font-size:10.5px;padding:1px 8px}
.d-callout .co-b{font-size:12.5px;line-height:1.4}
/* the pilot tints دعم green and تحد violet */
.d-callouts .d-callout:nth-child(1){background:#eaf4e6;border-color:#b6d6a8}
.d-callouts .d-callout:nth-child(1) .co-l{background:#4a8a2e}
.d-callouts .d-callout:nth-child(2){background:#f1ecf8;border-color:#c9b9de}
.d-callouts .d-callout:nth-child(2) .co-l{background:#6b4a86}

/* 2 · THE MISCONCEPTION PANEL — a green/red split, clearly separated, code-drawn */
.section.sec-errors .panel{background:#fff8f7}
.section.sec-errors .d-note{background:#fff !important;border:1px solid #f0c9c2 !important;
  border-radius:10px;font-size:14px;line-height:1.55}
.section.sec-errors .d-code-fig{background:transparent;border:0;box-shadow:none;margin-top:4px}
.section.sec-errors .d-code-fig svg{max-height:none;width:min(100%,470px)}

/* 3 · MATCHING ACTIVITY — a main teaching visual, not an embedded widget. It spans the
      card and is given real height; the two-column structure is drawn in SVG. */
/* A SPANNING FIGURE MUST SPAN THE CARD, not its column. The stage card is a three-column
   grid and .ii-body is display:contents, so a figure marked cf-wide is still just a grid
   ITEM — it sat in the ~44%-wide figure column and the matching cards inside it scaled down
   to about a third of their drawn size, which is what made a main activity look like a
   widget. Spanning all columns is what gives it the page space the approved design gives a
   teaching figure. */
/* …BUT NOT OVER THE SIDEBAR. Spanning all three columns drew the activity across the
   amber تحقق strip, which sits in the third column and spans both rows — the check text
   disappeared behind the figure on two cards. Spanning the first two columns puts the
   activity on its own row, full width of the content area, with the strip beside it. */
.section .panel.has-inline-img .d-code-fig.cf-wide{grid-column:1 / span 2;width:100%}
/* …and when the card has NO تحقق strip there is nothing to leave room for, so the activity
   takes all three columns. Without this, an activity card with no check point drew its
   figure two-thirds width while the identical card beside it drew full width — the two
   matching exercises came out visibly different sizes. */
.section .panel.has-inline-img:not(:has(.d-steps)) .d-code-fig.cf-wide{grid-column:1 / -1}
.section .panel .d-text:empty{display:none}
/* Trimmed deliberately: at 8px margin and 8px padding the three activity cards came to
   1,072px and page 2 could hold only two of them, wasting 435px. Five pixels each brings
   the set under a page, so page 2 packs all three activities. */
.section .d-code-fig.cf-wide{width:100%;max-width:100%;margin:3px auto 0;background:#fff;
  border:1.5px solid #dfe4ee;border-radius:12px;padding:3px 7px;box-shadow:none}
/* …and the SVG itself must be allowed to grow. Earlier rules cap .cf-svg at 170px, 132px
   and 126px for the stage figures — sensible for a small diagram beside prose, fatal for a
   full-width activity: the aspect ratio is preserved, so a height cap shrank the WIDTH too
   and the word cards came out about a third of their drawn size. These selectors are more
   specific than all three. */
.section .d-code-fig.cf-wide svg,
.section .d-code-fig.cf-wide .cf-svg,
.section.sec-stage-tamhid .d-code-fig.cf-wide .cf-svg,
.section.sec-stage-arad .d-code-fig.cf-wide .cf-svg,
.section.sec-stage-tatbiq .d-code-fig.cf-wide .cf-svg,
.section.sec-stage-taqwim .d-code-fig.cf-wide .cf-svg{
  position:static;width:100%;height:auto;max-height:none}
.section .d-code-fig.cf-wide .cap{display:none}

/* 4 · STAGE COLOURS — warm amber for التمهيد, blue for العرض, green for التطبيق, cream for
      التقويم. The reviewer asked for a warm intro; the previous rose came from sampling the
      pilot, so if rose was right this is the one line to put back. */
.section.sec-stage-tamhid .s-title{color:#a85a12}
.section.sec-stage-tamhid .panel{background:#fdeedd;border-color:#e8bb86 !important}

/* 5 · AN EMPTY STAGE — the source gives العرض no body. Slim, quiet, honest: the heading and
      its pills, and no invented text. */
/* An empty stage needs REAL height, or its header collides with the next section's. At
   min-height:0 the dashed strip collapsed to a few pixels and «العرض» sat on top of
   «التطبيق». A slim block with its own space reads as "this stage is in the plan and the
   plan says nothing about it" — which is the honest message. */
.section.sec-stage-arad:has(.panel .d-text:empty){margin-bottom:16px}
.section.sec-stage-arad .panel:has(.d-text:empty){
  min-height:34px;padding:8px 14px;background:#eef3fa;border-style:dashed !important}

/* 6 · MATERIALS chips a touch stronger, so the top of the page has three distinct blocks
      (objective · materials · misconception) rather than three similar boxes */
.section.sec-materials .panel{background:#f3faf9}
.section.sec-materials .d-chip{background:#fff !important;border:1.5px solid #9ecfc9;
  color:#0f6b64 !important;font-weight:800;font-size:13.5px;padding:6px 14px}

/* 12 · NO TWO-COLUMN JUSTIFIED PROSE IN A NARROW CARD. The raw-text prominence block sets
      column-count:2 with justified text on a figure-less stage card — fine across a full
      page, but the التطبيق opening line now shares its row, and in a half-width card the
      same rule produced «يفتح التلاميذ الكتاب صفحة ٣٢، جماعياً: ويحلون التمرين…» with
      word-gaps wide enough to read as scrambled. One column, left-natural spacing. */
.section.sec-stage-arad + .section.sec-stage-tatbiq .d-text,
.section.sec-stage-arad + .section.sec-stage-tatbiq .panel .d-text{
  column-count:1 !important;text-align:start !important;word-spacing:normal}

/* 11 · FIFTY-TWO PIXELS BUY A WHOLE PAGE. Measured: page 1 ended at 883 of 1059 because
      the first matching activity (228px) could not fit in the 176px left — so it went to
      page 2, which pushed the closing components onto a third page holding 181px. Trimming
      the page-1 residents by ~55px lets that activity onto page 1 and the whole lesson onto
      TWO pages, with nothing removed from the content. The illustration keeps pilot scale;
      what goes is padding. */
/* Trim the BOTTOM, never the top: .s-head is pulled 32px into the card, so a panel needs
   ~33px of top padding or the header lands on the first line of text. Cutting the top to
   8px during the page-1 trim is exactly what made «التقويم والختام» overlap its own
   opening sentence. */
.section.sec-errors .panel{padding:33px 12px 7px}
.section.sec-errors .d-note{padding:7px 10px}
.section.sec-stage-tamhid .panel{padding:33px 12px 7px}
.section.sec-stage-tamhid .d-inline-img{min-height:196px}
.section.sec-goal .panel{padding:8px 62px 8px 15px}
.section.sec-materials .panel{padding:6px 10px}

/* 9 · THE OBJECTIVE AND THE MATERIALS SHARE A ROW. The pilot carries its materials as
      chips on the lesson-information line, not as a band of their own; giving them a
      full-width card of their own spent ~76px of page on five one-word chips. RTL: column 1
      is the right edge, so the objective keeps the reading start. */
/* The five material chips wrapped to a second line — «قلم» alone — which cost 24px and,
   with it, a whole page: page 1 could then not fit the first activity, the tail slid onto a
   third page and page 2 came out half empty. One more column of width fits them on one
   line. The arithmetic, measured: 31px off page-1 residents lets the first activity onto
   page 1 and brings the whole lesson to two pages, both ~100% dense. */
.section.sec-goal{grid-column:1 / 7}
.section.sec-materials{grid-column:7 / 13}
.section.sec-materials .s-head{margin-bottom:4px}
.section.sec-materials .panel{padding:7px 10px}
.section.sec-materials .d-chip{font-size:12.5px;padding:4px 10px}
.section.sec-goal .panel{margin-right:14px}

/* 10 · The empty العرض strip sits beside the التطبيق opening line — two short blocks, one
      row, which is how the pilot pairs its narrow stage with a wide one. */
.section.sec-stage-arad{grid-column:1 / 6}
.section.sec-stage-arad + .section.sec-stage-tatbiq{grid-column:6 / 13}

/* 8 · THE CHECKPOINT COLUMN IS TOO NARROW ON AN ACTIVITY CARD. Measured: the التقويم card
      is 546px tall and the tallest thing in it is not the activity — it is «٨٠٪ من التلاميذ
      يضعون الخط تحت الكلمة الصحيحة» wrapping to seven lines in a ~95px column. The pilot's
      تحقق column is much wider and runs three or four lines. Widening it on cards that
      carry a spanning activity takes ~90px off each of them, and it matches the reference.
      Cards with a small side figure keep the narrow column the pilot uses there. */
.section .panel.has-inline-img:has(.d-code-fig.cf-wide){
  grid-template-columns:minmax(0,1fr) minmax(0,50%) minmax(0,1.15fr);gap:8px}
.section .panel.has-inline-img:has(.d-code-fig.cf-wide){padding:33px 12px 7px}
.section .panel.has-inline-img:has(.d-code-fig.cf-wide) .d-steps > .d-step:last-child{
  align-self:start}

/* 7 · EXIT TICKET AND ANSWERS SHARE A ROW — a question and its answer belong together, and
      the pilot pairs its two closing blocks the same way (مصطلحات رئيسية beside تكييف
      للفصول متعددة الصفوف). RTL: column 1 is the right edge, so the question sits right. */
.section.sec-exit-ticket{grid-column:1 / 7}
.section.sec-solutions{grid-column:7 / 13}

.section.sec-exit-ticket .d-note{border:1.5px solid #dbb95e !important}
.section.sec-solutions .panel{background:#f2faf7}

/* ══════════════════════════════════════════════════════════════════════════════════════
   APPROVED-DESIGN COMPONENT LAYER
   Explicit components on explicit grids. Everything above styles the generic panel the
   renderer used to wrap every section in; a stage no longer uses it. The reason is
   structural, not cosmetic: a generic card sized itself to whatever it contained and each
   figure inside kept its own aspect ratio, so a small activity sat centred in a large
   empty box and a stage never read as one unit. These components have named slots, the
   grid decides the proportions, and HTML text reflows to fill them.
   ══════════════════════════════════════════════════════════════════════════════════════ */

/* DEAD SPACE AFTER THE LAST CARD MADE A THIRD PAGE THAT HELD ONLY THE FOOTER. The document
   ended 14px below its last card — the body's bottom padding plus that card's margin — and
   the composer will not absorb an overflow it cannot fit without clipping, so it opened a
   page for it. Nothing renders there but page chrome. */
.body{padding-bottom:0 !important}
.body > .section:last-child{margin-bottom:0}

/* 17px decided a page: the document came to 1924px against a two-page capacity of 1907,
   and the composer will not absorb an overflow it cannot fit without clipping. One pixel
   off each card margin and the body padding covers it. */
.section.yl-stage{margin:0 0 8px;border:2px solid #ccd2dc;border-radius:14px;overflow:hidden;
  background:#fff;break-inside:avoid;page-break-inside:avoid}

/* StageHeader: icon + title on the reading side, duration and teaching mode on the other */
.yl-stage-head{display:grid;grid-template-columns:auto 1fr auto auto;align-items:center;
  gap:8px;padding:7px 13px;background:rgba(255,255,255,.55);border-bottom:1.5px solid #e3e7ef}
.yl-stage-head .yl-ic{display:flex;align-items:center}
.yl-stage-head .yl-ic svg{width:19px;height:19px}
.yl-title{font-size:15.5px;font-weight:700;letter-spacing:-.1px}
.yl-pill{font-size:11.5px;font-weight:700;white-space:nowrap;border-radius:99px;
  padding:3px 11px;background:#fff;border:1px solid #d7dce6;color:#44506a}
.yl-pill.yl-mode{background:var(--navy);border-color:var(--navy);color:#fff}

/* StageCard body: teaching text | visual. One explicit grid, one known proportion. */
.yl-stage-body{display:grid;grid-template-columns:1fr 1.3fr;gap:12px;align-items:center;
  padding:10px 13px}
.yl-stage-body.yl-solo{grid-template-columns:1fr}
.yl-text{font-size:14.5px;line-height:1.6;font-weight:500;color:var(--ink)}
.yl-visual{min-width:0}
.yl-visual > *{width:100%}

/* IllustrationPanel */
.yl-illus{margin:0;background:#fff;border:1px solid #e1e6ef;border-radius:11px;padding:5px;
  display:flex;flex-direction:column;gap:3px}
.yl-illus img{width:100%;height:auto;max-height:205px;object-fit:contain;border-radius:8px}
.yl-illus figcaption{font-size:11.5px;font-weight:700;color:#44506a;text-align:center}

/* CheckpointStrip — full width, at the bottom of the stage it belongs to */
.yl-check{display:flex;gap:8px;align-items:baseline;margin:0 13px 9px;padding:7px 11px;
  background:#fdf3dc;border:1px solid #e3c579;border-radius:9px}
.yl-check .yl-cmark{flex:none;color:#8a6410;font-weight:800;font-size:13px}
.yl-check .yl-ctext{font-size:13.5px;line-height:1.45;font-weight:700;color:#5f4708}

/* SupportStrip | ChallengeStrip — two equal columns, aligned, never floating side boxes */
.yl-diff{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 13px 10px}
.yl-cal{display:flex;gap:7px;align-items:flex-start;border-radius:9px;padding:6px 9px;
  border:1px solid transparent}
.yl-cal .yl-cl{flex:none;font-size:10.5px;font-weight:800;color:#fff;border-radius:99px;
  padding:2px 9px;line-height:1.55}
.yl-cal .yl-cb{font-size:12.5px;line-height:1.45;font-weight:600;color:var(--ink)}
.yl-support{background:#eaf4e6;border-color:#b6d6a8}
.yl-support .yl-cl{background:#4a8a2e}
.yl-challenge{background:#f1ecf8;border-color:#c9b9de}
.yl-challenge .yl-cl{background:#6b4a86}

/* An empty stage: the source gives العرض no body, so the card is its header alone. */
.section.yl-stage.yl-empty{border-style:dashed;background:#eef3fa}
.section.yl-stage.yl-empty .yl-stage-head{border-bottom:0;background:transparent}

/* MatchingActivity / WordMatchingActivity — rows that FILL the slot they are given.
   [word card] · dotted connector · [figure + its exact label] */
.yl-match{display:grid;gap:5px}
.yl-match .yl-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(34px,.55fr) minmax(0,1.15fr);
  align-items:center;gap:4px}
/* Row rhythm: 15px Arabic in a full-width card reads as well as 16px and takes ~42px a row
   instead of ~48px. Across three five-row activities that is ~240px — the difference between
   a page that ends with the assessment and one that pushes it over. The cards stay full
   width; what is tightened is the vertical rhythm, not the scale of the type. */
.yl-card{border-radius:9px;padding:5px 9px;font-weight:800;font-size:15px;text-align:center;
  background:#fff;border:1.7px solid #2f3e63;color:#0a1220;min-width:0}
.yl-card.yl-word-b{background:#f7f9fc;border-color:#4479ad}
.yl-card.yl-target{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:7px;
  background:#f7f9fc;border-color:#4479ad;font-size:14px;text-align:start;padding:5px 9px}
.yl-figwrap{display:flex;align-items:center}
.yl-fig{width:30px;height:33px;display:block}
.yl-tlabel{font-weight:700;min-width:0}
.yl-conn{position:relative;display:flex;align-items:center;height:100%}
.yl-conn .yl-link{width:100%;height:10px;display:block}
.yl-conn .yl-dot{position:absolute;top:50%;width:5px;height:5px;border-radius:50%;
  background:#2f3e63;transform:translateY(-50%)}
.yl-conn .yl-dot-a{inset-inline-start:0}
.yl-conn .yl-dot-b{inset-inline-end:0}
.yl-wordmatch .yl-row{grid-template-columns:minmax(0,1fr) minmax(34px,.5fr) minmax(0,1fr)}

/* AssessmentActivity — the word in a shape, then the row it is looked for in, underlined */
/* The assessment rows go two-up for the same reason the matching rows did: five rows of one
   pair left a 90px orphan on a third page. Three rows close the lesson on page 2. */
.yl-assess{display:grid;grid-template-columns:1fr 1fr;gap:5px 16px}
.yl-arow{display:grid;grid-template-columns:minmax(0,.62fr) minmax(0,1fr);gap:9px;align-items:center}
.yl-shape{border:2px dashed #8a6d1d;border-radius:10px;background:#fffaf0;padding:5px 9px;
  font-weight:800;font-size:15px;text-align:center}
.yl-optrow{border-bottom:1.6px solid #d7dce6;padding:4px 8px 6px;display:flex;gap:12px;
  justify-content:flex-start}
.yl-opt{font-weight:800;font-size:15px}
.yl-opt-pick{text-decoration:underline;text-decoration-thickness:2.5px;
  text-underline-offset:4px;text-decoration-color:#4a8a2e}

/* MisconceptionPanel — two columns, ✕ against ✓, explanation beside them */
.section.yl-miscsec{border:2px solid #e0553a;border-radius:14px;overflow:hidden;
  background:#fff8f7;margin:0 0 8px;break-inside:avoid}
.section.yl-miscsec .yl-stage-head{border-bottom:1.5px solid #f3cdc6}
.section.yl-miscsec .yl-title{color:#c0392b}
.section.yl-miscsec .yl-misc{display:grid;grid-template-columns:1.25fr .9fr;gap:10px;
  align-items:center;padding:9px 13px}
.yl-mboard{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.yl-half{border-radius:11px;padding:7px 9px 6px;text-align:center;border:1.8px solid;
  position:relative}
.yl-half .yl-mark{position:absolute;top:5px;inset-inline-end:8px;font-size:13px;font-weight:800}
.yl-half .yl-mword{font-size:21px;font-weight:800;line-height:1.5}
.yl-half .yl-mlbl{font-size:11.5px;font-weight:800;border-radius:99px;padding:1px 9px;
  display:inline-block;color:#fff}
.yl-wrong{background:#fdecea;border-color:#e0553a}
.yl-wrong .yl-mark{color:#c0392b}
.yl-wrong .yl-mlbl{background:#c0392b}
.yl-correct{background:#eaf6ec;border-color:#4a8a2e}
.yl-correct .yl-mark{color:#1e8e4d}
.yl-correct .yl-mlbl{background:#1e8e4d}
.yl-mnote{font-size:13.5px;line-height:1.55;font-weight:600;color:var(--ink);
  background:#fff;border:1px solid #f0c9c2;border-radius:10px;padding:8px 10px}

/* TWO RELATED EXERCISES SHARE A ROW. «أصل بين الصورة والكلمة» and «أصل بين كل كلمتين
   متماثلتين» are the two halves of one التطبيق, and stacked full-width they were 709px —
   which is why the assessment could not fit the page and a third page appeared holding
   62% of nothing. Side by side they are ~330px and the whole lesson closes on page 2. The
   pilot does the same thing with its two stages. Each keeps its own header, checkpoint and
   دعم/تحد strips, so it is still one designed unit. */
.section.yl-stage.sec-stage-tatbiq:has(.yl-match){grid-column:span 6}
.section.yl-stage:has(.yl-match) .yl-diff{grid-template-columns:1fr}
.section.yl-stage:has(.yl-match) .yl-card{font-size:14px;padding:5px 7px}
.section.yl-stage:has(.yl-match) .yl-card.yl-target{font-size:12.5px;gap:5px}
.section.yl-stage:has(.yl-match) .yl-fig{width:24px;height:27px}
.section.yl-stage:has(.yl-match) .yl-match .yl-row{grid-template-columns:minmax(0,1fr) minmax(26px,.42fr) minmax(0,1.1fr)}

/* Stage role colours — one fill per stage, headers tinted to match */
.section.yl-stage.sec-stage-tamhid{background:#fdeedd;border-color:#e8bb86}
.section.yl-stage.sec-stage-tamhid .yl-title{color:#a85a12}
.section.yl-stage.sec-stage-arad{background:#e7eef8;border-color:#9dbbde}
.section.yl-stage.sec-stage-arad .yl-title{color:#1c4f7c}
.section.yl-stage.sec-stage-tatbiq{background:#e9f2e5;border-color:#a3cc93}
.section.yl-stage.sec-stage-tatbiq .yl-title{color:#3f7027}
.section.yl-stage.sec-stage-taqwim{background:var(--cream);border-color:#dbb95e}
.section.yl-stage.sec-stage-taqwim .yl-title{color:#8a6d1d}
/* the activity itself sits on white so the word cards read cleanly */
.yl-visual .yl-match,.yl-visual .yl-assess{background:#fff;border:1px solid #dfe4ee;
  border-radius:11px;padding:8px}

/* ── BLOCK COMPONENTS: objective, materials, exit ticket, answer key, teacher corner ──
   Header row inside the card, content inside the card, nothing on the border. These were
   the last sections on the generic panel — whose header is pulled 32px into it, which is
   why «الإجابات» printed on the top border and its answer text was clipped below the
   bottom one. A component owns its own header, so that cannot happen. */
.section.yl-block{margin:0 0 8px;border:2px solid #ccd2dc;border-radius:14px;overflow:hidden;
  background:#fff;break-inside:avoid;page-break-inside:avoid}
.yl-bhead{display:flex;align-items:center;gap:8px;padding:6px 13px;
  background:rgba(255,255,255,.55);border-bottom:1.5px solid #e3e7ef}
.yl-bhead .yl-ic{display:flex}
.yl-bhead .yl-ic svg{width:18px;height:18px}
.yl-bbody{padding:8px 13px}
.yl-bbody > *:last-child{margin-bottom:0}
.yl-bbody .d-text,.yl-bbody .d-note{font-size:14px;line-height:1.55;font-weight:600;
  background:none;border:0;padding:0;color:var(--ink)}
.yl-bbody .d-chips{display:flex;flex-wrap:wrap;gap:6px}

/* per-role skins */
.section.yl-block.sec-goal{border-color:var(--c-teal);background:#f4fbfa}
.section.yl-block.sec-goal .yl-bhead{display:none}
/* The icon is pinned with a LOGICAL inset but the gutter was reserved with PHYSICAL padding,
   so in RTL the space opened on the far side and the dart landed on top of «الأسرة».
   Both must speak the same coordinate system. */
.section.yl-block.sec-goal .yl-bbody{padding:9px 14px;padding-inline-end:58px;position:relative}
.section.yl-block.sec-goal .yl-bbody::before{content:"";position:absolute;inset-inline-end:8px;
  top:50%;transform:translateY(-50%);width:42px;height:42px;background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='34' r='24' fill='%23e0705a'/><circle cx='32' cy='34' r='17.5' fill='%23fff'/><circle cx='32' cy='34' r='11' fill='%23e0705a'/><circle cx='32' cy='34' r='5' fill='%23fff'/><path d='M32 34 L52 14' stroke='%23182448' stroke-width='4.5' stroke-linecap='round'/><path d='M52 14 l-1.5 9 M52 14 l-9 1.5' stroke='%23e3a23c' stroke-width='4' stroke-linecap='round'/></svg>") no-repeat center/contain}
.section.yl-block.sec-goal .d-note b{color:var(--c-teal-ink)}
.section.yl-block.sec-materials{border-color:#9ecfc9;background:#f3faf9}
.section.yl-block.sec-materials .yl-title{color:var(--c-teal-ink)}
.section.yl-block.sec-materials .d-chip{background:#fff !important;border:1.5px solid #9ecfc9;
  color:#0f6b64 !important;font-weight:800;font-size:12.5px;padding:4px 11px}
.section.yl-block.sec-exit-ticket{border-color:#dbb95e;background:var(--cream)}
.section.yl-block.sec-exit-ticket .yl-title{color:#8a6d1d}
.section.yl-block.sec-exit-ticket .yl-bbody .d-note{background:#fff;border:1.5px solid #e3d3a3;
  border-radius:9px;padding:7px 10px;font-size:14.5px;font-weight:700}
.section.yl-block.sec-solutions{border-color:#8fc9bf;background:#f2faf7}
.section.yl-block.sec-solutions .yl-title{color:#0e7a7a}
.section.yl-block.sec-solutions .yl-bbody .d-text{font-weight:800;font-size:15px}
.section.yl-block.sec-homework{border-color:#dbb95e;background:#fdf6e6}
.section.yl-block.sec-homework .yl-title{color:#8a6d1d}
.section.yl-block.sec-homework .yl-bbody{padding:9px 13px;padding-inline-start:58px;position:relative}
.section.yl-block.sec-homework .yl-bbody .d-note{background:#fff;border:1px solid #e3d3a3;
  border-radius:9px;padding:7px 10px}
.section.yl-block.sec-homework .yl-bbody::before{content:"";position:absolute;inset-inline-start:9px;
  top:50%;transform:translateY(-50%);width:34px;height:34px;background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 48 48'><circle cx='24' cy='24' r='22' fill='%2340c351'/><path d='M24 12c-6.6 0-12 5.1-12 11.4 0 2.3.75 4.5 2.05 6.3L12.6 35l5.5-1.4c1.75 1 3.8 1.6 5.9 1.6 6.6 0 12-5.1 12-11.4S30.6 12 24 12z' fill='%23fff'/></svg>") no-repeat center/contain}
/* the objective and the materials keep their shared row */
.section.yl-block.sec-goal{grid-column:1 / 7}
.section.yl-block.sec-materials{grid-column:7 / 13}
.section.yl-block.sec-exit-ticket{grid-column:1 / 7}
.section.yl-block.sec-solutions{grid-column:7 / 13}


/* ── INSTRUCTION SLOT + RULED SPACE ────────────────────────────────────────────────
   The lead sentence spans the card above both columns; a source heading with no content
   under it becomes writing space instead of an empty titled box. */
.section.yl-stage .yl-lead{padding:7px 13px 0;font-size:14.5px;font-weight:700;
  line-height:1.5;color:var(--ink)}
.section.yl-stage .yl-lead + .yl-stage-body{padding-top:7px}
.section.yl-stage.yl-empty{grid-column:1 / 13}
.yl-rules{display:flex;flex-direction:column;gap:9px;padding:10px 14px 12px}
.yl-rules i{display:block;height:0;border-bottom:1.5px dashed #c3cede}

/* ── PAGE-1 DENSITY ────────────────────────────────────────────────────────────────
   Page 1 was carrying 228px of blank paper below the last card while page 2 sat at its
   limit: the next card is a matching activity that cannot be split, so it moved whole to
   page 2 and left the gap behind. Shaving page 1 would only move the boundary up by the
   same amount — the fix is to spend that space on page 1's own residents. The approved
   design is figure-led, so it goes to the illustration and to the writing space. */
/* The illustration is WIDTH-bound inside its column, so raising max-height alone moved
   nothing — the column itself has to be wider. The intro text is two lines; the picture
   is what a six-year-old reads first. */
.section.sec-stage-tamhid .yl-stage-body{grid-template-columns:1fr 2fr}
.section.sec-stage-tamhid .yl-illus img{max-height:420px}
.section.sec-stage-tamhid.yl-stage .yl-stage-body{align-items:stretch}
.section.yl-stage.yl-empty .yl-rules{gap:15px;padding:13px 14px 15px}
.section.yl-stage.yl-empty .yl-rules i:nth-child(n+4){display:none}

/* …and one pixel back from page 2, which sat exactly 1px over its own limit. */
.section.yl-block.sec-homework .yl-bbody{padding-top:8px;padding-bottom:8px}

/* The activity widgets are laid out with width:100% inside their column, so their own
   border and padding were added ON TOP of that width and the widget stood 3px outside its
   card at narrow measurements. Border-box makes that 100% include them. */
.yl-visual > *,.yl-match,.yl-assess,.yl-match .yl-row,.yl-card{box-sizing:border-box}

/* ── SIDES, CHECKED AGAINST THE APPROVED PAGES ─────────────────────────────────────
   Reserving each icon's gutter logically stopped it covering text, but it left both
   icons on the side the markup happened to name — and that is not the side the approved
   design puts them on. Read off the pilot: the dart sits at the goal card's RTL START
   (right) with the sentence beginning after it, and the messenger icon sits at the
   teacher's-corner card's far END (left) with the word beside it. Gutter and inset move
   together, both logical, so the pair can never drift apart again. */
.section.yl-block.sec-goal .yl-bbody{padding:9px 14px;padding-inline-start:58px}
.section.yl-block.sec-goal .yl-bbody::before{inset-inline-start:8px;inset-inline-end:auto}
.section.yl-block.sec-homework .yl-bbody{padding:9px 13px;padding-inline-end:58px}
.section.yl-block.sec-homework .yl-bbody::before{inset-inline-end:9px;inset-inline-start:auto}

/* The pilot's common-errors strip reads TEXT → صواب → خطأ from the RTL start: the
   teacher meets the explanation first and the correct form before the error. Ours was
   mirrored — error, correction, then the explanation last. This was logged as an open
   judgment call for months; the approved pages settle it. */
.section.yl-miscsec .yl-misc{grid-template-columns:.9fr 1.25fr}
.section.yl-miscsec .yl-mnote{order:-1}
.yl-mboard{direction:ltr}
.yl-mboard .yl-half{direction:rtl}

/* ═══════════════════════════════════════════════════════════════════════════════════
   APPROVED-ARTIFACT COMPOSITION
   Read off the approved Yemen pages in the reviewer's reference artifact (lesson 01
   أسرتي, both pages) rather than inferred from the earlier BLN pilot, which is a
   different design set. What the approved pages actually do:

     · header      a rounded navy CARD, centred, title over one subtitle line
     · objective   a SOLID dark band, full width, icon + label at the RTL start
     · errors      ✕ خطأ at the start, ✓ صواب beside it, the teacher's correction as
                   one quiet strip BENEATH both — not a third column
     · stage       tab + duration pill at the start and mode pill at the far end, all
                   ABOVE the card's border; then a white bordered card holding
                   text | visual, the asides, and the checkpoint strip last
     · visuals     a COMPACT visual sits beside the text; a WIDE activity (matching,
                   assessment) spans the full card beneath it. Not one fixed grid.
     · bottom      exit ticket + answers share a row; teacher's corner runs full width
                   with its labelled tab at the end
   ═══════════════════════════════════════════════════════════════════════════════════ */

/* ── YemenHeader ──────────────────────────────────────────────────────────────────── */
/* The container is .lp-header — .head matched nothing and the whole block was inert. */
.lp-header{background:none !important;border:0 !important;border-bottom:0 !important;
  border-radius:0 !important;padding:0 0 9px !important;min-height:0 !important;
  box-shadow:none !important;display:block !important;overflow:visible !important;
  text-align:center !important}
.lp-header .hb,.lp-header .deco,.lp-header .h-bg,.lp-header svg.h-bg{display:none !important}
.lp-header{background:#1f2937 !important;border-radius:15px !important;
  padding:12px 22px 11px !important;margin:0 0 9px}
.lp-header h1{background:none;color:#fff;margin:0;padding:0;text-align:center;
  font-size:26px;line-height:1.25;font-weight:700;-webkit-text-stroke:0;position:static}
.lp-header .sub{background:none;color:#dfe6f2;margin:3px 0 0;padding:0;
  text-align:center;font-size:14px;font-weight:600;line-height:1.4;position:static;
  width:auto;max-width:none}
.lp-header .meta{display:none}

/* ── ObjectiveMaterialsRow ────────────────────────────────────────────────────────── */
.section.yl-block.sec-goal{grid-column:1 / 13;background:#1d6b5f !important;
  border:0 !important;border-radius:13px;overflow:hidden}
.section.yl-block.sec-goal .yl-bhead{display:none}
.section.yl-block.sec-goal .yl-bbody{padding:11px 15px;padding-inline-start:52px;
  position:relative;display:block}
.section.yl-block.sec-goal .d-note{background:none !important;border:0 !important;
  padding:0 !important;color:#fff !important;font-size:15.5px;line-height:1.5;
  font-weight:700;text-align:start}
.section.yl-block.sec-goal .d-note b{color:#ffd98a !important;font-size:16px;
  -webkit-text-stroke:0}
/* the label and its dart live at the RTL start, inside the band */
.section.yl-block.sec-goal .yl-bbody::before{content:"";position:absolute;
  inset-inline-start:14px;top:50%;transform:translateY(-50%);width:26px;height:26px;
  inset-inline-end:auto;
  background:url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 64'><circle cx='32' cy='34' r='23' fill='none' stroke='%23ffffff' stroke-width='5'/><circle cx='32' cy='34' r='11' fill='none' stroke='%23ffffff' stroke-width='5'/><circle cx='32' cy='34' r='3' fill='%23ffffff'/><path d='M32 34 L54 12' stroke='%23ffd98a' stroke-width='5' stroke-linecap='round'/></svg>") no-repeat center/contain}
.section.yl-block.sec-materials{grid-column:1 / 13}
.section.yl-block.sec-materials .yl-bhead{padding:5px 13px 3px}
.section.yl-block.sec-materials .yl-bbody{padding:6px 13px 8px}

/* ── MisconceptionPanel ──────────────────────────────────────────────────────────── */
.section.yl-miscsec{grid-column:1 / 13;border:1.6px solid #d8dee9 !important;
  border-radius:13px;overflow:hidden;background:#fff}
.section.yl-miscsec .yl-stage-head,.section.yl-miscsec .yl-shead{display:none}
.section.yl-miscsec .yl-misc{display:block !important;padding:0;grid-template-columns:none}
.section.yl-miscsec .yl-mrow{display:grid;grid-template-columns:1fr 1fr;gap:0}
.section.yl-miscsec .yl-mrow .yl-half{padding:9px 13px 10px;min-width:0;border:0;border-radius:0;
  display:block;text-align:start;position:static}
.section.yl-miscsec .yl-mrow .yl-wrong{background:#fdeaea;border-inline-end:1.6px solid #e9d2d2}
.section.yl-miscsec .yl-mrow .yl-correct{background:#e8f5ea}
.section.yl-miscsec .yl-mhead{display:flex;align-items:center;gap:7px;margin:0 0 5px}
.section.yl-miscsec .yl-mhead .yl-mark{position:static;font-size:17px;font-weight:800;line-height:1}
.section.yl-miscsec .yl-mhead .yl-mlbl{font-size:18px;font-weight:700;border:0;background:none;padding:0;
  border-radius:0;-webkit-text-stroke:.3px currentColor}
.section.yl-miscsec .yl-wrong .yl-mhead{color:#b3261e !important}
.section.yl-miscsec .yl-correct .yl-mhead{color:#1f6b3a !important}
.section.yl-miscsec .yl-mbody{font-size:14px;line-height:1.55;font-weight:600;color:var(--ink)}
/* the pair, with the one letter that separates the two words marked */
.section.yl-miscsec .yl-pair{display:flex;align-items:center;justify-content:center;gap:14px;
  padding:3px 0 1px;flex-wrap:wrap}
.yl-pword{font-size:26px;font-weight:800;letter-spacing:1px;color:#1f2937;
  background:#fff;border:1.5px solid #bcd9c4;border-radius:10px;padding:2px 15px}
.section.yl-miscsec .yl-dchips{display:flex;align-items:center;justify-content:center;
  gap:8px;padding:2px 0 0}
.section.yl-miscsec .yl-dchip{font-size:17px;font-weight:800;color:#fff;background:#2f7d4a;
  border-radius:8px;min-width:30px;text-align:center;padding:1px 7px}
.section.yl-miscsec .yl-dvs{color:#6b8f78;font-weight:800;font-size:14px}
.yl-vs{width:15px;height:0;border-top:2px dotted #8fb79c}
/* the teacher's correction: one quiet strip beneath both halves */
.section.yl-miscsec .yl-mfix{background:#eef1f5;border-top:1.5px solid #dde3ec;padding:7px 14px;
  font-size:13.5px;line-height:1.5;font-weight:600;color:#42506a;text-align:start}

/* ── StageCard ───────────────────────────────────────────────────────────────────── */
.section.yl-stage{background:none !important;border:0 !important;padding:0 !important;
  border-radius:0 !important;overflow:visible;display:block;margin:0 0 8px}
.yl-shead{display:flex;align-items:center;gap:7px;padding:0 2px 5px;flex-wrap:nowrap;
  min-width:0}
.yl-tab{color:#fff;font-size:16.5px;font-weight:700;border-radius:9px;
  padding:3px 15px 4px;white-space:nowrap;-webkit-text-stroke:.3px currentColor;
  flex:0 0 auto}
.yl-shead .yl-pill{display:inline-flex;align-items:center;gap:5px;font-size:12.5px;
  font-weight:700;border-radius:99px;padding:2px 11px;white-space:nowrap;flex:0 0 auto}
.yl-shead .yl-dur{color:#fff}
.yl-shead .yl-dur .yl-clock{width:13px;height:13px;flex:0 0 auto}
.yl-shead .yl-mode{background:#fff;border:1.5px solid #cfd7e4;color:#2f3e63;
  margin-inline-start:auto}
.yl-shead .yl-mode .yl-dot{width:8px;height:8px;border-radius:50%;flex:0 0 auto}
.yl-scard{background:#fff;border:1.7px solid;border-radius:13px;overflow:hidden}
.yl-sbody{padding:10px 13px}
.yl-sbody.yl-split{display:grid;grid-template-columns:1fr 1fr;gap:12px;
  align-items:stretch}
.yl-sbody.yl-stacked{display:grid;grid-template-columns:1fr;gap:9px}
.yl-sbody.yl-solo{display:block}
.yl-ttext{min-width:0}
.yl-ttext p{margin:0 0 7px;font-size:14.5px;line-height:1.62;font-weight:700;
  color:var(--ink)}
.yl-ttext p:last-child{margin-bottom:0}
.yl-tvis{min-width:0;display:flex;flex-direction:column;justify-content:center}

/* the visual sits in a white card of its own, as it does on the approved pages */
.yl-tvis > *{width:100%;box-sizing:border-box;margin:0}
.yl-tvis .yl-illus{border:1.5px solid #e1e6ef;border-radius:11px;padding:5px;
  background:#fff;box-shadow:none}
.yl-tvis .yl-illus img{max-height:none;width:100%;height:auto;object-fit:contain;
  border-radius:8px;position:static}
.yl-tvis .yl-illus figcaption{background:#f1f3f7;color:#4a5568;border-radius:0 0 8px 8px;
  margin:5px -5px -5px;padding:4px 9px;font-size:11.5px;font-weight:700;
  text-align:center;border-top:1px solid #e4e8f0}
.yl-tvis .yl-match,.yl-tvis .yl-assess,.yl-tvis .yl-cf{background:#fff;
  border:1.5px solid #e1e6ef;border-radius:11px;padding:9px 10px}

/* ── SupportChallengeRow ─────────────────────────────────────────────────────────── */
.yl-srows{display:block;padding:0 13px 9px}
.yl-srow{display:flex;align-items:flex-start;gap:8px;background:#f5f7fa;
  border:1px solid #e3e8f0;border-radius:9px;padding:5px 10px;margin:0 0 5px;
  font-size:13px;line-height:1.5;font-weight:600;color:#3c4a63}
.yl-srow:last-child{margin-bottom:0}
.yl-srow .yl-cl{flex:0 0 auto;font-size:11.5px;font-weight:800;color:#fff;
  border-radius:99px;padding:1px 9px;margin-top:1px}
.yl-srow.yl-support .yl-cl{background:#4b8a3f}
.yl-srow.yl-challenge .yl-cl{background:#7c5aa6}
.yl-srow .yl-cb{min-width:0}

/* ── CheckpointStrip ─────────────────────────────────────────────────────────────── */
.section.yl-stage .yl-check{display:flex;align-items:flex-start;gap:7px;
  border-top:1.5px solid;border-radius:0;margin:0;padding:6px 13px 7px;
  font-size:13.5px;line-height:1.5;font-weight:700}
.section.yl-stage .yl-check .yl-cmark{flex:0 0 auto;font-weight:800}
.section.yl-stage .yl-check .yl-ctext{min-width:0}

/* per-stage colour: the tab, the duration pill, the card border and the strip */
.sec-stage-tamhid  .yl-tab,.sec-stage-tamhid  .yl-dur{background:#c8862a}
.sec-stage-tamhid  .yl-scard{border-color:#e8c07a}
.sec-stage-tamhid  .yl-check{background:#fdf4e3;border-top-color:#efd9ad;color:#7a5410}
.sec-stage-tamhid  .yl-mode .yl-dot{background:#c8862a}
.sec-stage-arad    .yl-tab,.sec-stage-arad    .yl-dur{background:#2f5a88}
.sec-stage-arad    .yl-scard{border-color:#9dbbde}
.sec-stage-arad    .yl-check{background:#eaf1f9;border-top-color:#c2d5ea;color:#26456a}
.sec-stage-arad    .yl-mode .yl-dot{background:#2f5a88}
.sec-stage-tatbiq  .yl-tab,.sec-stage-tatbiq  .yl-dur{background:#2f7d4a}
.sec-stage-tatbiq  .yl-scard{border-color:#a3cc93}
.sec-stage-tatbiq  .yl-check{background:#eaf4ec;border-top-color:#c3e0c8;color:#25511d}
.sec-stage-tatbiq  .yl-mode .yl-dot{background:#2f7d4a}
.sec-stage-taqwim  .yl-tab,.sec-stage-taqwim  .yl-dur{background:#2f5a88}
.sec-stage-taqwim  .yl-scard{border-color:#9dbbde}
.sec-stage-taqwim  .yl-check{background:#eaf1f9;border-top-color:#c2d5ea;color:#26456a}
.sec-stage-taqwim  .yl-mode .yl-dot{background:#2f5a88}

/* ── an empty stage COLLAPSES to its label ───────────────────────────────────────── */
.section.yl-stage.yl-empty{grid-column:1 / 13;margin-bottom:8px}
.section.yl-stage.yl-empty .yl-shead{padding:0 2px;background:none}

/* ── TeacherNotes · ExitAnswerRow · TeacherCorner · Footer ───────────────────────── */
.section.yl-block{background:#fff;border:1.6px solid #dbe1ea;border-radius:13px;
  overflow:hidden;margin:0 0 8px}
.section.yl-block .yl-bhead{padding:5px 13px 4px;background:#f6f8fb;
  border-bottom:1px solid #e6eaf2}
.section.yl-block .yl-title{font-size:14.5px;font-weight:700}
.section.yl-block .yl-bbody{padding:8px 13px}
.section.yl-block.sec-exit-ticket{grid-column:1 / 7}
.section.yl-block.sec-solutions{grid-column:7 / 13}
.section.yl-block.sec-exit-ticket .yl-bbody .d-note,
.section.yl-block.sec-solutions .yl-bbody .d-text{background:#fff !important;
  border:1.4px solid #e6dcc0 !important;border-radius:9px;padding:7px 11px;
  font-size:14.5px;font-weight:700}
.section.yl-block.sec-solutions .yl-bbody .d-text{border-color:#c9e2d3 !important}
/* teacher's corner: full width, its labelled tab at the far end, as in the approved set */
.section.yl-block.sec-homework{grid-column:1 / 13;background:#fdf6e6;
  border-color:#e8cf95 !important;position:relative}
.section.yl-block.sec-homework .yl-bhead{display:none}
.section.yl-block.sec-homework .yl-bbody{padding:10px 15px;padding-inline-end:96px}
.section.yl-block.sec-homework .yl-bbody::before{content:"";position:absolute;
  inset-inline-end:0;top:0;bottom:0;width:84px;background:#d9a13b;
  border-radius:0 12px 12px 0}
.section.yl-block.sec-homework .yl-bbody::after{content:"ركن المعلم";position:absolute;
  inset-inline-end:0;top:50%;transform:translateY(-50%);width:84px;text-align:center;
  color:#fff;font-size:13px;font-weight:800;line-height:1.3;padding:0 6px}
.section.yl-block.sec-homework .d-note{background:#fff !important;
  border:1.4px solid #ecd9a0 !important;border-radius:9px;padding:7px 11px;
  font-size:14.5px;font-weight:700}

/* ── page density ────────────────────────────────────────────────────────────────────
   The approved cards breathe: the illustration is the largest object on page 1 and the
   text sits beside it in a narrower column. The intro card gets the page's spare height
   because it is the card whose visual carries the lesson. */
.section.sec-stage-tamhid .yl-sbody.yl-split{grid-template-columns:.78fr 1.22fr}
.section.sec-stage-tamhid .yl-tvis .yl-illus img{max-height:none}
.yl-sbody{padding:11px 13px 12px}
.yl-ttext p{font-size:15px;line-height:1.68}

/* ── ActivityLabel + activity blocks ─────────────────────────────────────────────────
   The numbered exercise label is a line INSIDE the card above its activity, never text
   in the tab: a 44-character label in the tab pushed the duration and mode pills 203px
   outside the card. The tab carries the stage's name and nothing else. */
.yl-tab{flex:0 1 auto;min-width:0;overflow:hidden;text-overflow:ellipsis}
.yl-shead{flex-wrap:nowrap}
.yl-act{padding:0}
.yl-act + .yl-act{border-top:1px dashed #e2e7f0;margin-top:2px}
.yl-alabel{padding:8px 13px 0;font-size:14px;font-weight:800;color:#2f3e63}
.yl-alabel + .yl-sbody{padding-top:6px}
.yl-ttext.yl-lead{padding:11px 13px 0}
.yl-ttext.yl-lead + .yl-act .yl-alabel{padding-top:7px}
.yl-ttext.yl-lead p{margin-bottom:0}
.section.yl-stage .yl-check + .yl-check{border-top-style:dashed}

/* two activities of the same kind: one row, two explicit columns */
.yl-actgrid{display:grid;grid-template-columns:1fr 1fr;gap:0 12px;padding:0 13px 10px}
.yl-actgrid .yl-act{min-width:0;padding:0}
.yl-actgrid .yl-act + .yl-act{border-top:0;margin-top:0}
.yl-actgrid .yl-alabel{padding:8px 0 0;font-size:13.5px;line-height:1.45}
.yl-actgrid .yl-sbody{padding:6px 0 0}

/* The intro illustration is the page's largest object but it must not eat the page: an
   unbounded height took the intro card to 559px and cost the LP a third page. */
.section.sec-stage-tamhid .yl-tvis .yl-illus img{max-height:290px !important}
.section.sec-stage-tamhid .yl-sbody.yl-split{grid-template-columns:1fr 1.12fr}

/* 81px decided the second page. Taken from the asides and the card padding — never from
   the teaching text, whose size the reviewer set, and never from the activities. */
.yl-srows{padding:0 13px 8px}
.yl-srow{padding:4px 9px;margin-bottom:4px;font-size:12.5px;line-height:1.45}
.yl-srow .yl-cl{font-size:11px;padding:1px 8px}
.yl-sbody{padding:9px 13px 10px}
.yl-alabel{padding:7px 13px 0}
.section.yl-stage .yl-check{padding:5px 13px 6px;font-size:13px}
.section.yl-block .yl-bbody{padding:7px 13px}
.section.yl-block .yl-bhead{padding:4px 13px 3px}

/* the last 35px */
.section.sec-stage-tamhid .yl-tvis .yl-illus img{max-height:262px !important}
.section.yl-block.sec-exit-ticket .yl-bbody .d-note,
.section.yl-block.sec-solutions .yl-bbody .d-text{padding:5px 10px}
.section.yl-block.sec-homework .yl-bbody{padding:8px 15px}
.section.yl-block.sec-homework .d-note{padding:5px 10px}

/* SupportChallengeRow — ONE row, two cells, at the foot of the stage it belongs to. As two
   stacked rows this pair cost ~28px per stage and the LP a third page; as a row it is the
   component the reviewer named, and neither cell is a floating side box. */
.yl-srows{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.yl-srow{margin:0}
.yl-srow:last-child{margin:0}

/* The last 23px, taken only from PAGE-2 residents — the activities' own frames, not the
   teaching text and not the page-1 cards, because shaving a page-1 card moves the page
   boundary up by the same amount and gains nothing. */
.section.sec-stage-tatbiq .yl-tvis .yl-match,
.section.sec-stage-taqwim .yl-tvis .yl-assess{padding:6px 8px}
.section.sec-stage-tatbiq .yl-match{gap:4px}
.section.sec-stage-tatbiq .yl-check,.section.sec-stage-taqwim .yl-check{padding:4px 13px 5px}
.yl-actgrid .yl-alabel{padding:6px 0 0}
.section.yl-block.sec-exit-ticket .yl-bhead,
.section.yl-block.sec-solutions .yl-bhead,
.section.yl-block.sec-homework .yl-bhead{padding:3px 13px 2px}

/* Page 2 landed exactly 1px over its own limit, which the composer will not absorb. A few
   px of real margin, taken from the bottom blocks' frames. */
.section.yl-block.sec-homework .yl-bbody{padding:6px 15px}
.section.yl-block.sec-exit-ticket .yl-bbody,
.section.yl-block.sec-solutions .yl-bbody{padding:6px 13px}
.body > .section{margin-bottom:7px}

/* ONE STAGE, ONE FULL-WIDTH CARD. An earlier rule made the practice card half-width when
   it carried a matching activity — and with grid-auto-flow:row dense the الإجابات block
   backfilled the empty half, so the answers printed beside the practice stage on page 1
   and the practice card was cut across the page break. A stage card is never half a row. */
.body > .section.yl-stage{grid-column:1 / 13 !important}

/* ── the space goes to the teaching visuals ──────────────────────────────────────────
   With every stage card now a full row the document came back 226px under its two-page
   capacity. The approved pages spend that on the visuals, not on padding: the intro
   illustration is the largest object on page 1, and the matching and assessment
   activities are big enough for a six-year-old to read across the room. */
.section.sec-stage-tamhid .yl-tvis .yl-illus img{max-height:372px !important}
.section.sec-stage-tatbiq .yl-tvis .yl-match{padding:9px 11px}
.section.sec-stage-tatbiq .yl-match{gap:7px}
.section.sec-stage-tatbiq .yl-card{font-size:15px;padding:6px 9px}
.section.sec-stage-tatbiq .yl-card.yl-target{font-size:13.5px}
.section.sec-stage-tatbiq .yl-fig{width:27px;height:30px}
.section.sec-stage-taqwim .yl-tvis .yl-assess{padding:9px 11px}
.section.sec-stage-taqwim .yl-assess{gap:7px 16px}

/* The illustration is WIDTH-bound inside its column, so a taller cap alone moves nothing —
   the column has to be wider. The intro text is two lines; the picture is what a six-year-
   old reads first, and on the approved page it is the biggest thing on the sheet. */
.section.sec-stage-tamhid .yl-sbody.yl-split{grid-template-columns:1fr 1.62fr}
.section.sec-stage-tamhid .yl-tvis .yl-illus img{max-height:400px !important}
.section.sec-stage-tatbiq .yl-card{font-size:15.5px;padding:7px 10px}
.section.sec-stage-tatbiq .yl-match{gap:8px}
.section.sec-stage-taqwim .yl-assess{gap:9px 16px}
.section.sec-stage-taqwim .yl-card{font-size:15px;padding:6px 10px}

/* ── TeacherCorner ─────────────────────────────────────────────────────────────────── */
.section.yl-block.yl-tabbed{position:relative;display:flex;align-items:stretch}
.section.yl-block.yl-tabbed .yl-bbody{flex:1;min-width:0;padding:8px 14px}
.yl-btab{flex:0 0 82px;background:#d9a13b;color:#fff;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:2px;padding:7px 5px;text-align:center}
.yl-btab .yl-bubble{width:19px;height:19px}
.yl-btab .yl-btl{font-size:12.5px;font-weight:800;line-height:1.25}
/* the pseudo-element tab this replaces, off */
.section.yl-block.sec-homework .yl-bbody::before,
.section.yl-block.sec-homework .yl-bbody::after{display:none !important;content:none !important}
.section.yl-block.sec-homework .yl-bbody{padding-inline-end:14px !important;
  padding-inline-start:14px !important}

/* the tab belongs at the card's END, as the approved page has it (RTL: the left edge) */
.yl-btab{order:2;border-radius:0 12px 12px 0}
.section.yl-block.yl-tabbed .yl-bbody{order:1}

/* ── the stage is an OUTER tinted card holding a WHITE inner card ────────────────────
   Read off the approved pages: the stage's colour is a block, not a line. The outer card
   carries the tint, the header row, the asides and the checkpoint; the inner white card
   carries the teaching content. */
.section.yl-stage{border:1.6px solid !important;border-radius:14px !important;
  padding:8px 9px 9px !important;overflow:hidden}
.yl-shead{padding:0 3px 7px}
.yl-scard{border-width:1.3px}
.section.yl-stage .yl-check{border-top:0;border-radius:8px;margin:7px 0 0;
  padding:5px 11px 6px;background:none !important}
.yl-srows{padding:7px 0 0}
.section.yl-stage .yl-check + .yl-check{margin-top:5px}
.section.sec-stage-tamhid{background:#fdf4e3;border-color:#e8c07a !important}
.section.sec-stage-arad{background:#eaf1f9;border-color:#9dbbde !important}
.section.sec-stage-tatbiq{background:#eaf4ec;border-color:#a3cc93 !important}
.section.sec-stage-taqwim{background:#eaf1f9;border-color:#9dbbde !important}
.section.sec-stage-tamhid .yl-check{border:1px solid #e3c78f;color:#7a5410}
.section.sec-stage-arad .yl-check,.section.sec-stage-taqwim .yl-check{
  border:1px solid #bcd0e8;color:#26456a}
.section.sec-stage-tatbiq .yl-check{border:1px solid #bcd8c2;color:#25511d}
.section.yl-stage.yl-empty{background:#eaf1f9;border-color:#9dbbde !important;
  padding:7px 9px !important}
.section.yl-stage.yl-empty .yl-shead{padding:0 3px}
/* the asides read as part of the stage, on its own tint */
.yl-srow{background:#fff;border-color:#e0e6ef}

/* ── YemenHeader: a centred card, not a full-width band ─────────────────────────────── */
.lp-header{max-width:66% !important;margin:0 auto 9px !important}

/* ── the objective's label is white in the approved band ────────────────────────────── */
.section.yl-block.sec-goal .d-note b{color:#fff !important}

/* ── the panel's ✕/✓ labels carry the approved weight ───────────────────────────────── */
.section.yl-miscsec .yl-mhead .yl-mlbl{font-size:20px;font-weight:800;
  -webkit-text-stroke:.4px currentColor}
.section.yl-miscsec .yl-mhead .yl-mark{font-size:19px}

/* the outer stage cards added 9px past page 2's limit; taken back from the activity frames */
.section.sec-stage-tatbiq .yl-match{gap:6px}
.section.sec-stage-tatbiq .yl-card{padding:6px 10px}
.section.sec-stage-taqwim .yl-assess{gap:7px 16px}

/* «خطأ» and «صواب» were rendering WHITE on their tints — all but invisible. The colour has
   to be set on the label itself: this pack's inherited title colour is white (the same trap
   that made «المواد» and «بطاقة الخروج» disappear), so setting it on the row does nothing. */
.section.yl-miscsec .yl-wrong .yl-mlbl{color:#b3261e !important}
.section.yl-miscsec .yl-correct .yl-mlbl{color:#1f6b3a !important}

/* the approved footer rule is gold, not navy */
.lp-footer{border-top-color:#e0a83c !important}

/* ── ObjectiveMaterialsRow: the badge is a flex child, so no gutter can drift ────────── */
.section.yl-block.sec-goal .yl-bbody{display:flex !important;align-items:center;gap:11px;
  padding:11px 15px !important}
.section.yl-block.sec-goal .yl-bbody::before{display:none !important;content:none !important}
.yl-badge{flex:0 0 auto;display:flex;color:#fff}
.yl-badge .yl-tg{width:27px;height:27px}
.section.yl-block.sec-goal .d-note{flex:1;min-width:0}

/* ═══════════════════════════════════════════════════════════════════════════════════
   TEACHER NOTES AS A COMPONENT, AND COLOUR ALL THE WAY DOWN THE PAGE
   Two reviewer notes: the notes badge was printing outside its box, and the page went
   plain after the first few cards. The first was pseudo-element chrome positioned against
   the assessment stage's rectangle — it is a real section now, so the old chrome goes off.
   The second is a fill: every block gets a gentle pastel ground so the sheet reads as one
   designed LP rather than colourful at the top and white below.
   ═══════════════════════════════════════════════════════════════════════════════════ */

/* the old chrome, off — box AND tab */
.section.sec-stage-taqwim::after,.section.sec-stage-taqwim::before{
  content:none !important;display:none !important}

/* ── TeacherNotes ─────────────────────────────────────────────────────────────────── */
.section.yl-notes{display:flex;align-items:stretch;background:#eef3fb;
  border:1.6px solid #c3d3e9;border-radius:13px;overflow:hidden;grid-column:1 / 13;
  margin:0 0 7px}
.section.yl-notes .yl-nbody{flex:1;min-width:0;padding:8px 13px 9px}
.section.yl-notes .yl-nlabel{font-size:13.5px;font-weight:800;color:#2f4a72;
  margin:0 0 6px;text-align:start}
.section.yl-notes .yl-nrules{display:flex;flex-direction:column;gap:11px;padding:2px 0 3px}
.section.yl-notes .yl-nrules i{display:block;height:0;border-bottom:1.5px dashed #b9c9e2}
.yl-ntab{flex:0 0 74px;background:#2f4a72;color:#fff;display:flex;flex-direction:column;
  align-items:center;justify-content:center;gap:3px;padding:6px 5px;text-align:center}
.yl-ntab .yl-bubble{width:18px;height:18px}
.yl-ntab .yl-ntl{font-size:12px;font-weight:800;line-height:1.25}

/* ── pastel grounds for every block, so the page does not go white below the fold ──── */
.section.yl-block.sec-materials{background:#eef7ef;border-color:#c3ddc6 !important}
.section.yl-block.sec-materials .yl-bhead{background:#e2f0e4;border-bottom-color:#cbe2ce}
.section.yl-block.sec-materials .yl-title{color:#2f6b3a}
.section.yl-block.sec-exit-ticket{background:#fdf6e6;border-color:#e8cf95 !important}
.section.yl-block.sec-exit-ticket .yl-bhead{background:#f8ecd2;border-bottom-color:#e5d3a6}
.section.yl-block.sec-exit-ticket .yl-title{color:#8a6d1d}
.section.yl-block.sec-solutions{background:#eaf5f0;border-color:#b6d9c8 !important}
.section.yl-block.sec-solutions .yl-bhead{background:#dcefe6;border-bottom-color:#c3e0d1}
.section.yl-block.sec-solutions .yl-title{color:#1f6b52}
/* the inner answer boxes stay white so they read as the thing to be filled or read */
.section.yl-block .yl-bbody .d-note,.section.yl-block .yl-bbody .d-text{background:#fff}
/* the misconception panel's frame picks up its own soft ground behind the two halves */
.section.yl-miscsec{background:#fbfcfe}
.section.yl-miscsec .yl-mfix{background:#eef1f5}
/* the material chips read as chips on the tint */
.section.yl-block.sec-materials .d-chip{background:#fff !important;border:1.4px solid #bcd8c1;
  color:#2f6b3a !important}

/* ── reviewer round: the objective's dart, and the notes badge on the RIGHT ──────────
   Two asks. The dart in the objective band was too small. And the ملاحظات badge belongs at
   the card's RIGHT edge — the side the earlier correct version had it on — with the label
   beside it, not mirrored to the far end. The section clips its own corners, so the badge
   needs no radius of its own; the flex order is the whole fix, and the badge stays a
   flex child, which is what keeps it inside the card. */
.yl-badge .yl-tg{width:34px;height:34px}
.section.yl-block.sec-goal .yl-bbody{gap:13px}
.yl-ntab{order:-1}
.section.yl-block.yl-tabbed .yl-bbody{order:1}
.section.yl-notes .yl-nbody{order:2}

/* ── GEOMETRY FIGURES ────────────────────────────────────────────────────────────────
   The shapes are drawn in SVG and the boxes, ticks and captions in CSS, so an exercise
   that would otherwise be a sentence becomes something a six-year-old can act on. */
.geo-fig{display:flex;align-items:flex-end;justify-content:center;gap:14px;flex-wrap:wrap;
  padding:4px 2px}
.geo-cell{display:flex;flex-direction:column;align-items:center;gap:5px;min-width:0}
.geo-s{width:100%;max-width:104px;height:auto;display:block}
.geo-w{width:100%;max-width:230px;height:auto;display:block}
.geo-g{width:100%;max-width:132px;height:auto;display:block}
.geo-box{width:26px;height:26px;border-radius:7px;border:2px solid;display:flex;
  align-items:center;justify-content:center;font-size:15px;font-weight:800;line-height:1}
.geo-box.geo-yes{border-color:#8fbf9c;color:#2f7d4a;background:#eaf5ec}
.geo-box.geo-no{border-color:#e0a8a0;color:#c0392b;background:#fdeced}
.geo-cap{font-size:11.5px;font-weight:800;line-height:1.2;text-align:center}
.geo-cap.geo-ok{color:#2f7d4a}
.geo-cap.geo-bad{color:#c0392b}
.geo-cap.geo-mcap{color:#42506a}
.geo-vs{font-size:17px;font-weight:800;color:#8896b3;align-self:center;padding-bottom:16px}
.geo-two{gap:18px}
.geo-two .geo-g{border-radius:6px}
.geo-board{flex-direction:column;align-items:stretch;gap:8px}
.geo-brow{display:grid;grid-template-columns:1fr 1fr;gap:12px;align-items:end;
  padding-bottom:7px;border-bottom:1px dashed #dbe2ee}
.geo-board .geo-brow:last-child{border-bottom:0;padding-bottom:0}
.geo-small .geo-s{max-width:74px}
.geo-match .geo-model .geo-s{max-width:96px}
/* inside a stage's visual column the figure gets the card's white ground */
.yl-tvis .geo-fig{background:#fff;border:1.5px solid #e1e6ef;border-radius:11px;
  padding:8px 10px}

/* the exercise's model answer, under its own exercise */
.yl-answer{margin:5px 0 0;padding:4px 9px;background:#f3f6fa;border:1px solid #e0e6ef;
  border-radius:8px;font-size:12px;line-height:1.45;font-weight:700;color:#42506a}
.yl-actgrid.yl-cols-3{grid-template-columns:1fr 1fr 1fr;gap:0 10px}
.yl-actgrid.yl-cols-3 .yl-alabel{font-size:12.5px;line-height:1.4}
.yl-actgrid.yl-cols-3 .yl-answer{font-size:11px;padding:3px 7px}

/* A FIGURE MUST SCALE TO ITS COLUMN, NOT WRAP INSIDE IT. In a three-column grid the
   shapes were wider than the cell, so flex-wrap stacked them and a two-shape exercise
   stood 248px tall — seven of those ran the lesson to five pages. Each shape takes an
   equal share of the cell and shrinks; nothing wraps. */
.yl-actgrid .geo-fig{flex-wrap:nowrap;gap:6px;padding:5px 6px;align-items:center}
.yl-actgrid .geo-cell{flex:1 1 0;min-width:0}
.yl-actgrid .geo-s,.yl-actgrid .geo-w,.yl-actgrid .geo-g{max-width:100%;max-height:62px}
.yl-actgrid .geo-box{width:21px;height:21px;font-size:12.5px;border-radius:6px}
.yl-actgrid .geo-cap{font-size:10px}
.yl-actgrid .geo-vs{font-size:13px;padding-bottom:10px}
.yl-actgrid .geo-two{gap:8px}
.yl-actgrid .yl-answer{margin-top:4px}
/* the demonstration board is one card's worth, not three stacked figures */
.sec-stage-arad .geo-board{gap:5px}
.sec-stage-arad .geo-brow{padding-bottom:5px}
.sec-stage-arad .geo-s{max-height:58px}

/* Seven short drawn exercises read fine four to a row — each is a thumbnail of what the
   pupil does in the book, not a page of its own. */
.yl-actgrid.yl-cols-4{grid-template-columns:repeat(4,1fr);gap:0 8px}
.yl-actgrid.yl-cols-4 .yl-alabel{font-size:11.5px;line-height:1.35;padding-top:5px}
.yl-actgrid.yl-cols-4 .yl-answer{font-size:10px;padding:3px 6px;margin-top:3px}
.yl-actgrid.yl-cols-4 .geo-s,.yl-actgrid.yl-cols-4 .geo-w,
.yl-actgrid.yl-cols-4 .geo-g{max-height:50px}
.yl-actgrid.yl-cols-4 .geo-box{width:18px;height:18px;font-size:11px}
.yl-actgrid.yl-cols-4 .geo-cap{font-size:9px}
.yl-actgrid.yl-cols-4 .geo-fig{padding:4px 5px;gap:4px}
/* the demonstration board and the stages, a notch tighter for a long lesson */
.sec-stage-arad .geo-s{max-height:52px}
.sec-stage-arad .geo-brow{padding-bottom:4px}

/* أسرتي landed 4px over its two-page budget after the activity slots gained their answer
   line. Taken from writing space and card padding, never from the teaching text. */
.section.yl-notes .yl-nrules{gap:9px;padding:1px 0 2px}
.section.yl-notes .yl-nbody{padding:7px 13px 8px}
.section.yl-stage .yl-check{padding:4px 13px 5px}

/* 25px past the last legal cut on page 2 — taken from the closing blocks' frames only,
   so the page-1 boundary does not move. */
.section.yl-block.sec-exit-ticket .yl-bbody,
.section.yl-block.sec-solutions .yl-bbody{padding:5px 13px}
.section.yl-block.sec-homework .yl-bbody{padding:5px 15px}
.section.yl-notes .yl-nbody{padding:6px 13px 7px}
.section.yl-notes .yl-nrules{gap:8px}
.body > .section{margin-bottom:6px}

/* the last 12px past page 2's final legal cut */
.body > .section{margin-bottom:5px}
.section.yl-block .yl-bhead{padding:3px 13px 2px}
.section.sec-stage-taqwim .yl-assess{gap:5px 16px}
.section.yl-block .yl-bbody .d-note,.section.yl-block .yl-bbody .d-text{padding:4px 9px}

/* 4px of tail was still opening a third page for the two-page lesson. */
.section.yl-notes .yl-nrules{gap:7px}
.yl-btab{padding:6px 4px}

/* The last card's bottom margin is dead space that opens a page for itself. This rule
   existed already and was overridden by a later blanket .body > .section margin of equal
   specificity — restated last so it wins. */
.body > .section:last-child{margin-bottom:0}

.section.yl-notes .yl-nlabel{margin-bottom:4px}
.yl-ntab{padding:5px 5px}

/* The same lesson pasted with its answer on the exit-ticket line instead of its own line
   is a taller card, and it put the sheet 23px past page 2's last legal cut. Taken from the
   closing blocks' frames, which is where the extra text sits. */
.section.yl-block.sec-exit-ticket .yl-bbody,
.section.yl-block.sec-solutions .yl-bbody{padding:4px 12px}
.section.yl-block.sec-exit-ticket .yl-bbody .d-note,
.section.yl-block.sec-solutions .yl-bbody .d-text{padding:4px 8px;line-height:1.5}
.section.yl-notes .yl-nrules{gap:6px}
.section.yl-notes .yl-nbody{padding:5px 13px 6px}

/* the last card sat 9px past page 2's limit */
.section.yl-block.sec-homework .yl-bbody{padding:4px 14px}
.section.yl-block.sec-homework .d-note{padding:4px 9px;line-height:1.45}
.yl-btab{padding:4px 4px}

/* THE EXIT TICKET PAIRS WITH THE ANSWERS, OR IT SPANS THE ROW. Whether الإجابات becomes its
   own card depends on how the source is written: on its own line it does, inline at the end
   of the بطاقة الخروج sentence it does not. Without a partner the exit ticket was still
   holding half a row with the other half empty — a wasted half-row AND a taller card,
   because its text had half the width to wrap in. */
.body:not(:has(.sec-solutions)) .section.yl-block.sec-exit-ticket{grid-column:1 / 13}

/* WHEN EVERY STAGE CARRIES CONTENT, THE ILLUSTRATION GIVES BACK ITS SLACK. A paste where
   العرض is written out in full is a whole stage longer than one where it is empty; the
   illustration is the only element that can shrink without touching a word of teaching
   text or an activity. It is still the largest object on page 1. */
.section.sec-stage-tamhid .yl-tvis .yl-illus img{max-height:312px !important}

/* the cap did not bind — the picture is width-bound in its column, so the column is what
   has to give. Text and picture share the intro card evenly. */
.section.sec-stage-tamhid .yl-sbody.yl-split{grid-template-columns:1fr 1.04fr}

/* the last 16px, spread evenly across the cards rather than taken out of one */
.yl-sbody{padding:8px 13px 9px}
.yl-alabel{padding:6px 13px 0}
.yl-ttext.yl-lead{padding:9px 13px 0}

/* 8px: one pixel off the top and bottom of each stage card's own frame */
.section.yl-stage{padding:7px 9px 8px !important}

/* The last 34px, taken from the activity ROW GAPS on page 2 — about three pixels a row
   across ten rows, rather than a visible cut anywhere. */
.section.sec-stage-tatbiq .yl-match{gap:4px}
.section.sec-stage-taqwim .yl-assess{gap:4px 16px}
.section.sec-stage-tatbiq .yl-card,.section.sec-stage-taqwim .yl-card{padding:5px 10px}

/* A PAGE HOLDING ONE 47px CARD IS WORSE THAN A TIGHTER PAGE. ركن المعلم was being stranded
   on a third page by 24px. Taken from the notes card's writing space and the closing row's
   frames — chrome, not teaching content, and not the page-1 cards, since shaving those
   moves the page boundary up by the same amount and gains nothing. */
.section.yl-notes .yl-nrules{gap:5px;padding:0}
.section.yl-notes .yl-nbody{padding:4px 13px 5px}
.section.yl-notes .yl-nlabel{margin-bottom:3px}
.section.yl-block.sec-exit-ticket .yl-bbody,
.section.yl-block.sec-solutions .yl-bbody{padding:3px 12px 4px}
.section.yl-block.sec-homework .yl-bbody{padding:3px 14px}

/* ═══════════════════════════════════════════════════════════════════════════════════
   THE CLOSING PAIR — بطاقة الخروج and الإجابات, ONE authoritative definition.
   Ten rounds of per-round padding tweaks had left these two cards with different
   internal structures: one printed its text bare, the other wrapped it in a white box;
   their header bands were different heights; and each stood 123px tall for a single line
   of text. Side by side they read as two unrelated cards that happened to be adjacent,
   which is exactly what the reviewer saw. Everything below supersedes those tweaks.

   They are a PAIR: same header band, same white content box, same padding, equal height,
   a clear gap between them. And being half the height they were, ركن المعلم now joins
   them on the same page instead of being stranded on a page of its own — which is what
   was leaving a 75px gap above the footer rule.
   ═══════════════════════════════════════════════════════════════════════════════════ */
.body > .section.yl-block.sec-exit-ticket{grid-column:1 / 7}
.body > .section.yl-block.sec-solutions{grid-column:7 / 13}
/* the cards are grid items in one row: each stretches to the row's height and lays its
   own header and body out in a column, so the two bottoms line up by construction */
.section.yl-block.sec-exit-ticket,
.section.yl-block.sec-solutions{display:flex;flex-direction:column;align-self:stretch;
  margin-bottom:5px}
.section.yl-block.sec-exit-ticket .yl-bhead,
.section.yl-block.sec-solutions .yl-bhead{flex:0 0 auto;padding:4px 12px 3px;
  min-height:0;align-items:center}
.section.yl-block.sec-exit-ticket .yl-title,
.section.yl-block.sec-solutions .yl-title{font-size:14px;font-weight:800;line-height:1.3}
/* the body fills what is left and centres its box, so a one-line card and a two-line card
   still align top and bottom */
.section.yl-block.sec-exit-ticket .yl-bbody,
.section.yl-block.sec-solutions .yl-bbody{flex:1 1 auto;display:flex;align-items:center;
  padding:6px 12px 7px !important}
/* ONE content box, identical on both sides */
.section.yl-block.sec-exit-ticket .yl-bbody .d-note,
.section.yl-block.sec-solutions .yl-bbody .d-note,
.section.yl-block.sec-exit-ticket .yl-bbody .d-text,
.section.yl-block.sec-solutions .yl-bbody .d-text{width:100%;box-sizing:border-box;
  margin:0;background:#fff !important;border-radius:9px;padding:6px 10px !important;
  font-size:14.5px;font-weight:700;line-height:1.5;text-align:start}
.section.yl-block.sec-exit-ticket .yl-bbody .d-note{border:1.4px solid #e6dcc0 !important}
.section.yl-block.sec-solutions .yl-bbody .d-text{border:1.4px solid #c9e2d3 !important}
/* ركن المعلم keeps the full width beneath the pair, as the reviewer specified */
.body > .section.yl-block.sec-homework{grid-column:1 / 13}

/* The last 25px, so ركن المعلم sits with the pair instead of alone on a page of its own —
   which is what left the gap above the footer rule. Taken from the asides' and the notes
   card's own frames: no font size changes, no activity changes, no teaching text touched. */
.yl-srow{padding:3px 8px;line-height:1.42}
.yl-srow .yl-cl{margin-top:0}
.section.yl-notes .yl-nlabel{font-size:13px;margin-bottom:2px}
.section.yl-notes .yl-nbody{padding:4px 12px}
.section.yl-notes .yl-nrules{gap:4px}

/* «بطاقة الخروج» was a pale amber on cream beside «الإجابات» in strong teal, so the two
   still did not read as a matched pair even once they were aligned. Same presence, each in
   its own accent. */
.section.yl-block.sec-exit-ticket .yl-title{color:#7a5910 !important}
.section.yl-block.sec-solutions .yl-title{color:#155e46 !important}
`;

// NO MAX_PAGES. This pack used to declare a two-page contract, and the Studio then
// re-condensed the lesson tighter and shrank the figures until the render fitted it.
// That made the page count the thing being satisfied and the teacher's words the thing
// being sacrificed. The raw lesson is the source of truth: pagination now follows the
// content, and a lesson that needs three pages gets three pages. The composer numbers
// «الصفحة ن من م» from the real page count, so nothing downstream assumes two.
// A pack MAY still declare MAX_PAGES if its design genuinely requires one — the
// mechanism in pipeline.js is intact, this design just no longer uses it.
// CHARACTER_CAST: false — this design set has no slot for decorative characters. The
// legacy fallback (add a cast when a lesson has no content images) was injecting one
// into the homework card.
module.exports = { THEME_OVERRIDE_CSS, REGION_NAME: 'Yemen', PAGE_NUMBER_STYLE: 'ar-bottom', CHARACTER_CAST: false };