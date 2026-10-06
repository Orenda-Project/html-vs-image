'use strict';
// ICT (NIETE) design pack — grades 6–12, Islamabad Capital Territory. (Grades 1–5 have their own
// approved page, NIETE's tall phone page: primary.js, with its own style under .ictq; COMPOSE below
// picks it for a guide built by lp-render/guide/from-primary.js. Nothing in this file's CSS reaches it.)
//
// THE DESIGN IS NIETE'S APPROVED LESSON-PLAN PAGES (the "lp_pdfs" references for English, Maths
// and Urdu, shared 2026-09-30): portrait pages, one per stage — Start, Explanation, Practice,
// Conclusion — plus a Teacher support page in the same design for what a grades 6–12 lesson adds.
// The colours below were sampled from those pages' pixels; the type is a condensed sans like
// theirs (Roboto Condensed, OFL), Nastaliq for Urdu content. The chrome labels are the approved
// English ones for every subject, as the approved Urdu reference prints them.
//
// The page is laid out by this pack's own composer (pages.js, from the page model built in
// lp-render/guide/lpdoc-pages.js) and printed as fixed 896×1200 pages — the references' own
// 1792×2400 at 2× — by lp-render/render/fixed-pages-pdf.js. Nothing here reaches another region:
// the pack loads only for meta.region "ict", and every selector sits under .ictp.
//
// Never put a backtick in a comment inside this template literal: it ends the string and the
// pack fails to load.
const fs = require('node:fs');
const path = require('node:path');
const { composeIctPages } = require('./pages');
const { composePrimary } = require('./primary');
const { composeSecondary } = require('./secondary');

const FONTS = path.join(__dirname, '..', '..', '..', '..', 'node_modules', '@fontsource');
function face(family, file, weight, style) {
  const f = path.join(FONTS, file);
  if (!fs.existsSync(f)) return '';
  return `@font-face{font-family:'${family}';font-weight:${weight};font-style:${style};font-display:block;`
    + `src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2');}`;
}
const RC = 'roboto-condensed/files/roboto-condensed-latin';
const fontFaces = () => [
  face('ICT Cond', `${RC}-400-normal.woff2`, 400, 'normal'), face('ICT Cond', `${RC}-500-normal.woff2`, 500, 'normal'),
  face('ICT Cond', `${RC}-700-normal.woff2`, 700, 'normal'), face('ICT Cond', `${RC}-400-italic.woff2`, 400, 'italic'),
  face('ICT Cond', `${RC}-700-italic.woff2`, 700, 'italic'),
  // ﷺ (U+FDFA) paints ~3.2em of ink in Nastaliq and lands on the lines around it; a face for that ONE
  // code point (the bundled Naskh at 85%) plays the role of ICT's 0.61em span.
  (() => {
    const f = path.join(FONTS, 'noto-naskh-arabic', 'files', 'noto-naskh-arabic-arabic-400-normal.woff2');
    return fs.existsSync(f) ? `@font-face{font-family:'ICT Salawat';font-display:block;unicode-range:U+FDFA;size-adjust:85%;src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2');}` : '';
  })(),
].join('');

const PAGE = { width: 896, height: 1200 };

const THEME_OVERRIDE_CSS = fontFaces() + `
:root{
  --slate:#34374A; --slate2:#3A3C51; --green:#4AAB7A; --green-d:#137447; --green-t:#1C6E43;
  --mint:#EAF5ED; --mint2:#DAEBE0; --grey:#E9ECF1; --grey2:#E3E2E8; --amber:#F8CA60; --amber-s:#F6AB05;
  --ink:#1f2130; --mut:#5f6273; --rule:#4A4D5E; --soft:#d7d9df;
}
html,body{background:#fff;overflow-x:hidden}
.sheet{padding:0;background:#fff;width:${PAGE.width}px;max-width:100%;margin:0 auto}
.lp-footer{display:none}
.ictp{direction:ltr;text-align:left;font-family:'ICT Salawat','ICT Cond','Roboto Condensed','Noto Nastaliq Urdu',Arial Narrow,sans-serif;color:var(--ink);font-size:14.5px;line-height:1.32;font-weight:400}
.ictp *{box-sizing:border-box}
.ictp ul,.ictp ol{list-style:none;margin:0;padding:0}
.ictp b{font-weight:700}
.ictp [dir="rtl"]{font-family:'ICT Salawat','Noto Nastaliq Urdu','ICT Cond',sans-serif;line-height:2;text-align:right}
.ictp .katex{font-size:1.06em}
/* a MathJax equation (chemistry) cannot wrap: in a narrow column it scales down to fit, aspect kept */
.ictp mjx-container{display:inline-block;max-width:100%}
.ictp mjx-container > svg,.ictp svg[role="img"]{max-width:100%;height:auto}
.ictp .ic{display:inline-block;flex:none;width:20px;height:20px;vertical-align:-4px}
/* ── the page: fixed 896×1200, a band on top, rows below ─────────────────────────────── */
.pg{width:${PAGE.width}px;height:${PAGE.height}px;position:relative;overflow:hidden;background:#fff;display:flex;flex-direction:column;padding:0 0 20px}
html:not(.lp-print) .pg{margin:0 auto 26px;box-shadow:0 0 0 1px #d9dbe1,0 6px 20px rgba(30,32,48,.08)}
html:not(.lp-print) body{background:#eef0f4}
.pg-body{flex:1 1 auto;min-height:0;padding:16px 26px 0;display:flex;flex-direction:column;gap:12px}
.row{flex:none}
/* the page's main row takes what the page has left, as the approved pages run their cards to the foot */
.row.stretch{flex:1 1 auto;display:grid;align-content:stretch}
.row.stretch.cont-row{flex:none}
.row.stretch > .col{height:100%}
.row.stretch .ind,.row.stretch .ind > .units{height:100%}
.row.stretch .ind > .units{display:flex;flex-direction:column}
.row.stretch .ind .iq{flex:1 1 auto;align-items:stretch}
.row.stretch .ind .iq .abox{height:auto;min-height:60px}
.row.stretch .panels > .panel2:last-child{flex:1 1 auto}
.row.stretch .panels{height:100%}
.pg.grow{height:auto}
/* ── bands ─────────────────────────────────────────────────────────────────────────── */
.band{display:flex;align-items:center;gap:18px;background:var(--slate);color:#fff;margin:22px 26px 0;border-radius:12px;padding:11px 18px;min-height:58px}
.band .pill{background:#fff;color:var(--slate);border-radius:999px;padding:3px 15px;font-weight:700;font-size:17px;white-space:nowrap}
.band .pill:empty{display:none}
.band h2{font-size:27px;font-weight:700;margin:0;letter-spacing:.2px}
.band .bsub{font-size:15px;color:#b9bdca}
.band .mark{width:30px;height:30px;margin-inline-start:auto;flex:none}
.band.cont h2::after{content:' — continued';font-weight:400;font-size:20px;color:#b9bdca}
.band.hero{margin:0;border-radius:0;padding:20px 30px 16px;display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"pill title mark" "bot bot bot";column-gap:16px;row-gap:8px;align-items:start}
.hero .pill{grid-area:pill;margin-top:8px}
.hero .mark{grid-area:mark;width:36px;height:36px}
.hero-t{grid-area:title;text-align:center}
.hero h1{font-size:36px;font-weight:700;margin:0;color:#fff;line-height:1.1}
.hero .topic{font-size:23px;font-weight:700;color:#57B886;line-height:1.25;margin-top:3px}
.hero .topic[dir="rtl"]{text-align:center;line-height:1.9;font-size:24px}
.hero-b{grid-area:bot;display:flex;align-items:center;gap:26px;margin-top:6px}
.where{flex:none;min-width:140px}
.where .big{font-size:31px;font-weight:700;color:#57B886;line-height:1}
.where .small{font-size:14px;color:#a9dcc0;margin-top:3px;max-width:230px}
.where .wchip{display:inline-block;margin-top:6px;border:1.5px solid #57B886;color:#dff2e7;border-radius:999px;padding:1px 10px;font-size:12.5px;font-weight:500}
.pathw{flex:1;min-width:0}
.path{display:grid;grid-template-columns:30px 1fr 50px 1fr 30px;align-items:center}
.path .bar{height:3px;background:#57B886}
.path .node{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;background:var(--green)}
.path .node .ic{width:17px;height:17px}
.path .node.now{width:50px;height:50px;border:3px solid #fff;background:var(--green);color:#fff;font-size:18px}
.path .node.next{background:#fff}
.path-cap{display:grid;grid-template-columns:1fr 1.4fr 1fr;gap:10px;margin-top:6px;font-size:12.5px;color:#cfd3dc;line-height:1.25}
.path-cap span:nth-child(2){text-align:center;color:#fff}
.path-cap span:nth-child(3){text-align:end}
/* ── cards ─────────────────────────────────────────────────────────────────────────── */
.card{border-radius:16px;padding:13px 16px;background:#fff}
.lbl{font-weight:700;text-transform:uppercase;letter-spacing:.01em;font-size:17px;color:var(--slate);line-height:1.2;margin-bottom:5px}
.lbl em{text-transform:none;font-weight:400;font-style:italic;color:var(--green-t);font-size:16px}
.tx{margin:0}
.ictp b{color:inherit}
.path-cap b{color:#fff}
.where .small{white-space:normal}
/* a picture set beside the card it explains */
.sidewrap{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,40%);gap:14px;align-items:center}
.sidewrap > .side{display:flex;justify-content:center;align-items:center;min-width:0}
.sidewrap > .card{min-width:0}
/* start: journey · today · coming up */
.r-three{display:grid;gap:14px}
.r-three.n3{grid-template-columns:1fr 1.05fr 1fr}.r-three.n2{grid-template-columns:1fr 1fr}.r-three.n1{grid-template-columns:1fr}
.journey{background:var(--mint)} .journey .lbl,.coming .lbl{color:var(--green-t);font-size:19px}
ul.done li{position:relative;padding-inline-start:20px;font-size:13.5px;margin:2px 0}
ul.done li::before{content:'✓';position:absolute;inset-inline-start:0;color:var(--green);font-weight:700}
.today{background:var(--green);color:#fff;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px}
.today .tag{background:#fff;color:var(--slate);border-radius:999px;padding:1px 16px;font-weight:700;font-size:17px;text-transform:uppercase}
.today .out{font-size:21px;font-weight:700;line-height:1.18}
.today .bte{font-size:14.5px;line-height:1.3;color:#f1fbf5}
.today .fb{font-size:12.5px;color:#e3f5ea}
.today .slo{font-size:12px;letter-spacing:.04em;color:#dff3e8;margin-top:auto}
.today [dir="rtl"]{text-align:center}
.coming{background:var(--grey)}
.cu{display:flex;gap:10px;align-items:flex-start;margin:6px 0}
.cn{flex:none;width:30px;height:30px;border:2px solid var(--slate);border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:15px;color:var(--slate)}
.cu .tx{font-size:14.5px;font-weight:500}
/* start: to prepare */
.r-prep{border-bottom:2px solid var(--soft);padding-bottom:10px}
.prep .lbl{font-size:18px}
.prep .boxes{display:flex;flex-wrap:wrap;gap:5px 18px;font-size:15px}
.cb{display:inline-flex;gap:7px;align-items:center}
.cb i{width:15px;height:15px;border:1.6px solid var(--slate);border-radius:2px;display:inline-block;flex:none}
.cb.vid .ic{width:18px;height:18px} .cb em{color:var(--mut);font-size:13px}
/* start: warm up | opening */
.r-two{display:grid;grid-template-columns:1fr 1.9fr;gap:14px;align-items:stretch}
.r-two.one{grid-template-columns:1fr}
.col{min-width:0;display:flex;flex-direction:column;gap:12px}
.col > .card{flex:1 1 auto}
.warm{background:var(--grey)}
.warm .lbl{font-size:21px}
.recalls{color:var(--mut);font-size:14px;margin:-2px 0 6px}
.units{display:flex;flex-direction:column;gap:8px}
.sy{display:flex;gap:8px;align-items:flex-start}
.sy .ic{width:22px;height:22px;margin-top:1px}
.say{color:var(--green-t);font-weight:700;font-size:14.5px}
.ln{display:flex;gap:8px;align-items:flex-start;margin-top:3px}
.ln .ic{width:20px;height:20px;margin-top:1px}
.ln .tx{font-size:14px}
.wtag{font-size:12.5px;font-style:italic;color:var(--mut);text-align:end;margin-top:1px}
.opening{border:2.5px solid var(--green);display:flex;flex-direction:column}
/* spare room at the foot of the opening holds a picture, as the approved opening does; the page
   packer shows it only when the room is there */
.art-slot{display:none;margin-top:auto;align-self:flex-end}
.art-slot.on{display:block}
.art-slot svg{height:100%;width:auto;display:block}
.opening .lbl{color:var(--green-t);font-size:21px}
.op .tx{font-size:14.5px}
.wn{display:flex;gap:8px;align-items:flex-start;color:#7a3b16}
.wn .ic{width:18px;height:18px}
/* start: write on board */
.wob{background:var(--slate);color:#fff}
.wob .lbl{color:#57B886;font-size:20px}
.kw{font-size:16.5px;line-height:1.3;margin:2px 0}
.wob .bt{font-size:15px;color:#e6e8ee;margin-top:4px}
.boardc{background:var(--slate);color:#fff} .boardc .lbl{color:#57B886}
/* ── explanation ───────────────────────────────────────────────────────────────────── */
.step{border:2px solid var(--rule);display:grid;grid-template-columns:44px minmax(0,1fr);gap:12px;align-items:start;padding:12px 14px}
.has-side .step{grid-template-columns:44px minmax(0,1fr) minmax(0,38%)}
.num{width:42px;height:42px;border-radius:50%;background:var(--slate);color:#fff;font-size:22px;font-weight:700;display:grid;place-items:center}
.bubble{background:var(--slate2);color:#fff;border-radius:16px;padding:11px 15px;position:relative;font-size:14.5px}
.has-side .bubble::after{content:'';position:absolute;inset-inline-end:-13px;top:16px;border:8px solid transparent;border-inline-start:13px solid var(--slate2)}
.side{display:flex;justify-content:center;align-items:center;min-width:0}
.r-step + .r-step{position:relative}
.r-step + .r-step::before{content:'';position:absolute;top:-12px;left:50%;margin-left:-8px;border:8px solid transparent;border-top:9px solid var(--slate);border-bottom:0}
.keyfact{background:var(--amber);border-inline-start:9px solid var(--amber-s);display:flex;gap:12px;align-items:flex-start;border-radius:14px}
.keyfact > .ic{width:28px;height:28px;margin-top:2px}
.keyfact .lbl{font-size:16px;margin-bottom:2px}
.keyfact .big{font-size:18.5px;line-height:1.28}
ul.ticks li{position:relative;padding-inline-start:22px;margin:3px 0;font-size:15px}
ul.ticks li::before{content:'✓';position:absolute;inset-inline-start:0;font-weight:700;color:var(--slate)}
.slip{border:2px solid var(--rule);display:flex;gap:12px;align-items:flex-start}
.slip > .ic{width:30px;height:30px}
.slip .lbl{font-size:16px;margin-bottom:2px}
.slip .big{font-size:16px}
.mis{margin-top:6px}
.mis .says{font-size:14.5px}
.fix{display:flex;gap:6px;align-items:flex-start;color:var(--green-t);font-weight:700;font-size:14.5px;margin-top:2px}
.fix .ic{width:18px;height:18px;margin-top:1px}
.worked{background:var(--grey)}
.worked .lbl{font-size:16px;color:#50536a}
.worked .lt{text-transform:none;font-weight:500}
.worked .prob{font-weight:700;font-size:16px;margin-bottom:3px}
ol.work{counter-reset:w}
ol.work li{counter-increment:w;position:relative;padding-inline-start:22px;font-size:14.5px;margin:2px 0}
ol.work li::before{content:counter(w) ".";position:absolute;inset-inline-start:0;font-weight:700;color:var(--slate)}
.result{display:inline-block;margin-top:7px;border:2px solid var(--green);border-radius:6px;padding:4px 12px;font-weight:700;background:#fff;font-size:15px}
.cfu{background:var(--green);color:#fff;padding:0;overflow:hidden;border:2px solid var(--green)}
.cfu-top{display:flex;gap:12px;padding:12px 16px}
.cfu-top > .ic{width:30px;height:30px}
.cfu .lbl{color:#fff;font-size:16px}
.cfu .q{font-size:17px;font-weight:700;line-height:1.25}
.ln.on .tx{color:#f3fbf6}
.struggle{background:#fff;color:var(--ink);padding:8px 16px;font-size:14px}
.struggle.solo{border:2px solid var(--green)}
.struggle b{text-transform:uppercase}
.formulac{padding:6px}
.board-frame{border:5px solid var(--slate);border-radius:10px;padding:10px 12px;text-align:center;background:#fff;max-width:100%;overflow:hidden}
.board-frame .katex{font-size:1.25em}
.board-frame .cap{font-size:13px;color:var(--mut);margin-top:4px}
.figc{border:2px solid var(--soft);display:flex;justify-content:center}
figure.fg{margin:0;display:flex;flex-direction:column;align-items:center;max-width:100%}
figure.fg img{display:block;max-width:100%;height:auto}
.fg .badge{align-self:flex-start;background:var(--slate);color:#fff;border-radius:999px;padding:1px 10px;font-size:12px;font-weight:700;margin-bottom:5px}
.plain{border:2px solid var(--soft)}
.askc{background:var(--mint)}
.tablec{border:2px solid var(--soft)}
.tablec table{border-collapse:collapse;width:100%;font-size:13.5px}
.tablec th{background:var(--slate);color:#fff;text-align:start;padding:4px 8px}
.tablec td{border-bottom:1px solid var(--soft);padding:4px 8px}
.bookfig{background:var(--grey);display:flex;gap:10px}
.bookfig > .ic{width:26px;height:26px}
/* ── practice ──────────────────────────────────────────────────────────────────────── */
.guided{background:var(--mint);border-radius:16px;padding:12px 16px 14px}
.gh,.ih{border-bottom:3px solid var(--green-d);padding-bottom:5px;margin-bottom:10px}
.gt{font-size:23px;font-weight:700;color:var(--green-d);text-transform:uppercase}
.gs{font-size:19px;color:var(--green-d)}
.ih .it{font-size:14px;color:var(--mut);margin-inline-start:8px}
.ih{margin:0}
.together{border:2px solid var(--green-d);display:grid;grid-template-columns:132px minmax(0,1fr);gap:14px;margin-top:10px;padding:12px 14px}
.together.list{grid-template-columns:132px minmax(0,1fr)}
bdi.lbl-in{unicode-bidi:isolate;direction:ltr}
.t-l{display:flex;flex-direction:column;align-items:flex-start;gap:6px}
.t-l .gnum{background:var(--green-d);color:#fff;min-width:30px;height:32px;border-radius:6px;display:grid;place-items:center;font-weight:700;font-size:19px}
.t-l .glbl{font-weight:700;text-transform:uppercase;font-size:16px;color:var(--ink);line-height:1.1}
.t-l .teacher{width:92px;height:auto;margin-top:2px}
.gtitle{font-size:13px;color:var(--mut);text-transform:uppercase;letter-spacing:.03em;margin-bottom:2px}
.together .prob{font-weight:700;font-size:15.5px}
.gans{display:inline-block;margin-top:7px;background:var(--green-d);color:#fff;border-radius:6px;padding:4px 12px;font-weight:700;font-size:15px}
ol.qs{counter-reset:q}
ol.qs li{counter-increment:q;position:relative;padding-inline-start:24px;margin:4px 0;font-size:14.5px}
ol.qs li::before{content:counter(q) ".";position:absolute;inset-inline-start:0;font-weight:700;color:var(--green-d)}
.ans{color:var(--green-d);font-weight:700}
.cfubar{display:flex;align-items:stretch;background:var(--slate);color:#fff;border-radius:10px;margin-top:10px;overflow:hidden;font-size:14px}
.cfubar > span{background:var(--green-d);font-weight:700;padding:8px 12px;display:flex;align-items:center}
.cfubar .tx{padding:8px 12px}
.cfubar em{color:#cfd3dc}
.r-indep{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);gap:16px}
.r-indep.one{grid-template-columns:1fr}
.r-indep > .col + .col{border-inline-start:2px dashed #9aa0ad;padding-inline-start:16px}
.iq{display:grid;grid-template-columns:32px minmax(0,1fr) 140px;gap:10px;align-items:start;padding:9px 0;border-bottom:1.5px solid var(--green-d)}
.iq:last-child{border-bottom:0}
.qn{width:30px;height:32px;border:2px solid var(--green-d);border-radius:6px;color:var(--green-d);font-weight:700;font-size:17px;display:grid;place-items:center}
.qt .tx{font-size:14.5px}
.tier{display:inline-block;background:var(--grey2);color:var(--slate);border-radius:4px;padding:0 6px;font-size:12px;font-weight:500;margin-top:3px}
.abox{border:2px solid var(--green-d);border-radius:8px;height:60px;background:linear-gradient(transparent 48%,#c8ccd6 48%,#c8ccd6 52%,transparent 52%)}
.panels{display:flex;flex-direction:column;gap:12px}
.panel2{display:grid;grid-template-columns:46px minmax(0,1fr);border-radius:14px;overflow:hidden}
.panel2 .stripe{display:flex;justify-content:center;padding-top:12px}
.panel2 .stripe .ic{width:28px;height:28px}
.panel2 .pc{padding:11px 14px}
.panel2 .lbl{font-size:15px}
.panel2 .tx{font-size:14.5px;margin-bottom:4px}
.panel2.behind{background:var(--grey)} .panel2.behind .stripe{background:var(--slate)}
.panel2.ahead{background:var(--mint2)} .panel2.ahead .stripe{background:var(--green-d)} .panel2.ahead .lbl{color:var(--green-d)}
.duo{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.duo .behind{background:var(--grey)} .duo .ahead{background:var(--mint2)}
.answers{background:var(--grey2);border-top:2px dashed #9aa0ad;margin:0 -26px;padding:9px 26px;font-size:13px;line-height:1.35}
.answers > b{text-transform:uppercase}
/* ── conclusion ────────────────────────────────────────────────────────────────────── */
.r-close{display:grid;grid-template-columns:minmax(0,1.9fr) minmax(0,1fr);gap:16px;align-items:stretch}
.r-close.one{grid-template-columns:1fr}
.col.stack{gap:14px}
.col.stack > .card{flex:none}
.col.stack > .homework{flex:1 1 auto}
.exit{border:3px solid var(--green)}
.eh{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.et{font-size:25px;font-weight:700;color:var(--green);text-transform:uppercase}
.es{font-size:14px;color:var(--mut);max-width:150px;line-height:1.15}
.emin{margin-inline-start:auto;background:var(--green);color:#fff;border-radius:8px;padding:4px 10px;font-weight:700}
.opt{margin-top:6px}
.opt-pill{display:inline-block;background:var(--green);color:#fff;border-radius:999px;padding:3px 18px;font-weight:700;font-size:16px;text-transform:uppercase;position:relative;z-index:1;margin-inline-start:12px}
.oc{background:#F4F5F7;border:1.5px solid var(--soft);border-radius:12px;padding:18px 16px 10px;margin-top:-13px}
.olbl{font-size:12.5px;color:var(--mut);text-transform:uppercase;letter-spacing:.03em}
.oq{font-size:15.5px;font-weight:500}
.how{font-size:13px;margin-top:5px;color:#373a4c}
.how ul li{position:relative;padding-inline-start:12px}
.how ul li::before{content:'•';position:absolute;inset-inline-start:0}
.oans{text-align:end;color:#6b6e7c;font-size:13px;margin-top:4px}
.chips{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}
.chip{border:2px solid var(--slate);border-radius:8px;padding:6px 10px;font-size:14.5px;display:block;background:#fff}
.chip.key{background:var(--green);border-color:var(--green);color:#fff}
.chip .ic{width:15px;height:15px;margin-inline-end:5px;vertical-align:-2px}
.reteach{margin-top:10px;font-size:13.5px;border-top:1.5px dashed var(--soft);padding-top:7px}
.remember{background:var(--amber)} .remember .lbl{font-size:22px}
.homework{background:var(--grey)}
.hwh{display:flex;gap:10px;align-items:center;font-size:21px;font-weight:700;text-transform:uppercase;color:var(--slate);margin-bottom:6px}
.hwh .ic{width:28px;height:28px}
.hwh em{font-size:13px;font-weight:400;text-transform:none;color:var(--mut);margin-inline-start:auto}
ul.boxes li{display:flex;gap:10px;margin:6px 0;font-size:14.5px}
ul.boxes li > i{width:15px;height:15px;border:1.6px solid var(--slate);flex:none;margin-top:3px}
.hwans{font-size:12.5px;color:#6b6e7c;margin-top:1px}
.tomorrow{background:var(--green);color:#fff;display:flex;gap:10px;align-items:flex-start;font-size:15.5px}
.tomorrow > .ic{width:26px;height:26px}
.coach{background:var(--mint);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center}
.coach .lbl{font-size:19px}
.coach .tx{font-size:14.5px}
.cr{display:flex;align-items:center;gap:8px;border-inline-start:2px solid #bcd0c3;padding-inline-start:14px}
.cs{text-align:center;width:108px;font-size:13px;line-height:1.2;display:flex;flex-direction:column;align-items:center;gap:4px}
.cs .ic{width:32px;height:32px}
.cs .n{font-weight:700;font-size:19px}
.gt2{color:var(--green);font-size:30px;font-weight:700}
/* ── teacher support ───────────────────────────────────────────────────────────────── */
.sh{font-size:20px;font-weight:700;text-transform:uppercase;color:var(--slate);border-bottom:3px solid var(--slate);padding-bottom:4px}
.sh em{text-transform:none;font-weight:400;font-size:16px;color:var(--mut)}
.boardplan{border:2px solid var(--soft);display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px;align-items:start}
.bp-fig .cap{font-size:13px;color:var(--mut);text-align:center;margin-top:4px}
.bp-order ol{counter-reset:d}
.bp-order li{counter-increment:d;position:relative;padding-inline-start:22px;margin:4px 0;font-size:14.5px}
.bp-order li::before{content:counter(d) ".";position:absolute;inset-inline-start:0;font-weight:700}
.mcq,.erq{border:2px solid var(--soft)}
.srq{background:var(--slate);color:#fff} .srq .lbl{color:var(--amber)} .srq .q{font-weight:700;font-size:15.5px}
.scheme{background:var(--mint);margin-top:10px} .scheme .lbl{color:var(--green-d)}
.scheme li{position:relative;padding-inline-start:14px;margin:2px 0}
.scheme li::before{content:'•';position:absolute;inset-inline-start:0}
.erq .q{font-weight:700;margin-bottom:6px}
.part{display:flex;justify-content:space-between;gap:12px;border-bottom:1px solid #e3e4ea;padding:4px 0}
.part b{color:var(--amber-s);white-space:nowrap}
.howm .tx{font-size:13.5px;color:var(--mut)}
.hwkey{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.hk{background:var(--grey);border-radius:12px;padding:10px 12px}
.hkh{font-weight:700;text-transform:uppercase;font-size:12.5px;color:var(--slate);letter-spacing:.03em}
.hk .hq{font-size:14px}
.hk .ha{color:var(--green-t);font-weight:700;font-size:14px;margin-top:3px}
/* Urdu content: Nastaliq needs a taller line and a little more size to read at the same weight */
.ictp[data-lang="ur"] [dir="rtl"]{font-size:1.04em}
.ictp[data-lang="ur"] .hero h1{font-size:34px}
`;

module.exports = {
  THEME_OVERRIDE_CSS,
  REGION_NAME: 'ICT (NIETE)',
  // The page is this pack's own layout (NIETE's approved design), built from guide.layout:
  // grades 6–12 on fixed portrait pages (pages.js), grades 1–5 on tall phone pages (primary.js,
  // which names its own page layout).
  COMPOSE: (guide, images) => {
    const kind = guide && guide.layout && guide.layout.kind;
    // grades 6–12: ICT's production page, the approved design since 2026-10-02 (secondary.js)
    if (kind === 'ict-pages') return composeSecondary(guide, images);
    if (kind === 'ict-primary') return composePrimary(guide);
    return null;
  },
  // Fixed portrait pages, one or more per stage; a stage too long for its page continues on the next.
  PAGE_LAYOUT: { width: PAGE.width, height: PAGE.height, fixedPages: true },
  // ICT's plans carry no decorative characters; the cast is also a paid generator.
  CHARACTER_CAST: false,
};
