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
.section.sec-errors .panel.has-twin-board{display:flex;flex-direction:column;gap:6px}
.section.sec-errors .panel.has-twin-board .ii-body{display:block;width:100%}
.section.sec-errors .d-twin-board{max-width:470px;margin:2px auto 4px;flex-direction:row-reverse}
.section.sec-errors .d-twin-board .tb-half img{height:170px}
/* Illustrated errors strip (pilot): the خطأ/صواب twin-board figure spans the card
   width BELOW the twins instead of squeezing them into a side column. */
.section.sec-errors .panel.has-inline-img{display:flex;flex-direction:column}
.section.sec-errors .panel.has-inline-img .ii-body{display:block;flex:none;width:100%}
.section.sec-errors .d-inline-img{flex:none;width:100%;max-width:100%;display:flex;flex-direction:column;align-items:center;box-shadow:none;border:0;background:transparent}
.section.sec-errors .d-inline-img img{max-height:172px;width:auto;max-width:96%;border:1px solid var(--line);border-radius:10px}
.section.sec-errors .d-inline-img .cap{border-top:0;background:transparent}
.section.sec-errors-caption .s-head{display:none}
.section.sec-errors-caption .panel{background:transparent;border:0;box-shadow:none;padding:0 6px}
.section.sec-errors-caption .d-text{font-size:12px;color:var(--muted);text-align:center;font-weight:600}
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
