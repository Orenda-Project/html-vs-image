'use strict';
// KENYA design pack — CBC lesson plan.
//
// Status: FIRST PASS, not partner-approved. See DESIGN.md. Tanzania's pack applies no
// overrides at all because its look is still unknown; Kenya's does apply overrides,
// because the CBC lesson-plan form has a structure worth honouring even before a partner
// signs off a skin: its roles are fixed and ordered (Strand → Reflection), the teacher
// reads them in that order every lesson, and the rubric is the part that carries the
// assessment decision. So this pack pins a colour to each CBC ROLE and gives the rubric
// the room it needs. It deliberately imports nothing from the Yemen pack: no ministry
// header, no Arabic chrome, no 4-stage tab colours.
//
// WHY ROLE COLOUR MATTERS HERE, measured on the first render: the default theme rotates
// four accents BY SECTION INDEX, so the three cards of one Lesson Development stage came
// out green, amber and red — three colours for one role, which reads as three different
// kinds of thing. Pinning the colour to the role is the fix, and it is why every rule
// below is keyed to `sec-<role>` rather than to position.
//
// GOTCHA (documented in the repo's CLAUDE.md, and it bit the Yemen pack): render.js
// stamps INLINE styles on the section tab (`background:var(--c-X)`) and on every .panel
// (`border-color:var(--c-X-soft)`). Inline beats a stylesheet rule, so both need
// !important here. The tab's own label is white by default — do NOT recolour .s-title,
// or the title goes dark-on-dark. (It did, on the first pass.)

const THEME_OVERRIDE_CSS = `
:root{ --ke-ink:#12263f; --ke-band:#0f3d5c; --ke-line:#d8e0e8; }

/* ── CBC document chrome ─────────────────────────────────────────────────────────── */
/* The CBC plan is a form a teacher fills and a head of department signs, not a poster:
   a calm banded header reads as official where the default warm gradient reads as
   promotional. The default header's floating stars and clouds are removed for the same
   reason — one of them was sitting on top of the lesson title. */
.lp-header{background:linear-gradient(135deg,#124e6f 0%,#0f3d5c 58%,#0b2c44 100%);
  border-radius:0 0 16px 16px;padding:20px 30px 17px}
.lp-header h1{font-size:28px;letter-spacing:-.2px}
.lp-header .sub{font-size:13px;letter-spacing:.3px;opacity:.9}
.lp-header .hbwrap,.lp-header .deco{display:none !important}
.sheet,body{background:#eef2f6}
.body{padding:14px 26px 2px}
.section{margin:0 0 9px}
.s-head{margin:0 0 7px}
.s-tab{padding:6px 14px 6px 11px;border-radius:10px;box-shadow:0 2px 7px rgba(15,40,70,.14)}
.s-title{font-size:15.5px}
.panel{padding:11px 14px}

/* ── one colour per CBC role, fixed across every lesson ──────────────────────────── */
/* Identifying rows: the form's header table, deliberately quiet. */
.section.sec-lesson-line .s-tab,.section.sec-admin .s-tab{background:#4a6480 !important}
.section.sec-lesson-line .panel,.section.sec-admin .panel{
  background:#f4f6f9;border-color:#c3cfdc !important}
.section.sec-lesson-line .d-text{font-weight:800;font-size:15px}
/* Twelve rows on the identifying card (the fill-in form plus the three curriculum
   levels), so two columns and a fixed label gutter — otherwise the values ragged badly
   against labels of very different lengths («MUDA» beside «ENEO LA KUJIFUNZA»). */
.section.sec-admin .d-fields{display:grid;grid-template-columns:1fr 1fr;gap:4px 18px}
.section.sec-admin .d-field{background:transparent;border:0;padding:1px 0;font-size:13.5px;
  display:grid;grid-template-columns:132px 1fr;gap:8px;align-items:baseline}
.section.sec-admin .d-field b{color:#4a6480;font-size:11.5px;text-transform:uppercase;
  letter-spacing:.3px;line-height:1.35}

/* The 30-second summary opens the plan: what the pupils will be able to do, how long it
   takes, and the one thing not to skip. The default theme already draws it as a cream
   card with icon rows — this only anchors its colour and gives the rows room. */
.section.sec-summary .s-tab{background:#8a6410 !important}
.section.sec-summary .panel{background:var(--cream);border-color:#e3c579 !important}
.section.sec-summary .d-summary{display:flex;flex-direction:column;gap:7px}
.section.sec-summary .srow{display:grid;grid-template-columns:22px 1fr;gap:9px;align-items:start}
.section.sec-summary .sic{width:20px;height:20px;border-radius:6px;background:#e3c579;
  display:flex;align-items:center;justify-content:center;font-size:11px;color:#6b4c08}
.section.sec-summary .stext{font-size:14px;line-height:1.5}
.section.sec-summary .stext b{color:#6b4c08}

/* Remediation notes are what the teacher does when the check fails — corrective, so
   amber, and deliberately not the same colour as the assessment it follows. */
.section.sec-remediation .s-tab{background:#a8641a !important}
.section.sec-remediation .panel{background:#fdf1e3;border-color:#e0b483 !important}

/* Outcomes and the key inquiry question are what the lesson is judged against, so they
   sit directly under the header and carry the strongest colours. */
.section.sec-outcomes .s-tab{background:#1f7a53 !important}
.section.sec-outcomes .panel{background:#e6f2ec;border-color:#9ac7b0 !important}
.section.sec-inquiry .s-tab{background:#c98a12 !important}
.section.sec-inquiry .panel{background:#fdf4de;border-color:#e3c579 !important}
.section.sec-inquiry .d-bullets li,.section.sec-inquiry .d-note{font-size:15.5px;font-weight:700}

.section.sec-resources .s-tab{background:#5a6f86 !important}
.section.sec-resources .panel{background:#f1f4f8;border-color:#c3cfdc !important}
.section.sec-resources .d-chips{gap:6px}
.section.sec-resources .d-chip{font-size:12.5px;font-weight:700;padding:5px 12px;
  background:#fff !important;border:1.5px solid #c3cfdc;color:#2c445c !important}

/* The three teaching phases the CBC form names. Not Yemen's four 5E stages: this pack
   styles the roles the CBC form actually has, and every card of one phase matches. */
.section.sec-introduction .s-tab{background:#d1751f !important}
.section.sec-introduction .panel{background:#fdeddf;border-color:#eab98c !important}
.section.sec-development .s-tab{background:#1c5f96 !important}
.section.sec-development .panel{background:#e8f0f9;border-color:#a6c1dd !important}
.section.sec-conclusion .s-tab{background:#4a8a2e !important}
.section.sec-conclusion .panel{background:#eaf4e5;border-color:#a8cd97 !important}

.section.sec-assessment .s-tab{background:#6b4a86 !important}
.section.sec-assessment .panel{background:#f6f0fa;border-color:#cdb6dd !important}
.section.sec-rubric .s-tab{background:#0f3d5c !important}
.section.sec-extended .s-tab{background:#1c7a72 !important}
.section.sec-extended .panel{background:#eaf6f5;border-color:#a9cfcb !important}
.section.sec-extended .d-note{background:#fff !important;border-inline-start-color:#1c7a72 !important}

/* Reflection is written by hand on the printed page after the lesson, so the card IS
   ruled space. The note wrapper carries an inline gradient and an inline start-border,
   both of which have to be overridden or an empty note draws a stray coloured bar — it
   did, on the first pass. */
.section.sec-reflection .s-tab{background:#4a6480 !important}
.section.sec-reflection .panel{background:#fff;border:1.5px dashed #b8c4d2 !important;
  min-height:86px;padding:6px 14px;
  background-image:repeating-linear-gradient(to bottom,transparent 0 29px,#e3e9f0 29px 30px)}
.section.sec-reflection .d-note,.section.sec-reflection .d-text{
  background:none !important;border:0 !important;padding:0;min-height:74px}

/* ── the assessment rubric ───────────────────────────────────────────────────────── */
/* The rubric is the part of a CBC plan that carries a decision, so it is a real table:
   one row per level, badge and level name in fixed columns, the descriptor beside them.
   The BADGE COLOURS come from row order in render.js — this pack only lays them out, so
   a rubric with three levels, numbered bands or Kiswahili level names still shows the
   ramp. Nothing here matches on how a level is spelled. */
.section.sec-rubric .panel{background:#fff;border-color:#c3cfdc !important;padding:8px 10px}
.section.sec-rubric .d-rubric{display:flex;flex-direction:column;gap:0}
/* BOTH children of a row are divs, INCLUDING THE BADGE (<div class="ric">), so a
   .rrow > div rule catches the badge too: it turned the badge into a 2-column grid
   and the star/tick/triangle/cross glyph vanished into a 168px column. Exclude .ric.
   render.js emits TWO children per row — the badge, then one div holding the level and
   the descriptor as sibling spans. A three-column grid on the row therefore squeezed the
   whole of both into 172px and the descriptor wrapped four lines deep (measured). The row
   is badge | content, and the CONTENT is what splits into level | descriptor. */
.section.sec-rubric .rrow{display:grid;grid-template-columns:30px 1fr;align-items:start;
  gap:10px;padding:7px 6px;border-bottom:1px solid var(--ke-line);background:transparent}
.section.sec-rubric .rrow > div:not(.ric){display:grid;grid-template-columns:168px 1fr;
  gap:12px;align-items:start}
.section.sec-rubric .rrow:last-child{border-bottom:0}
.section.sec-rubric .rrow:nth-child(odd){background:#f8fafc}
.section.sec-rubric .ric{width:25px;height:25px;border-radius:7px;font-size:13.5px;
  display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800}
.section.sec-rubric .rlevel{font-weight:800;font-size:13.5px;color:#12263f}
.section.sec-rubric .rdesc{font-size:13.5px;line-height:1.5;color:#2c3a4f}

/* ── figures ─────────────────────────────────────────────────────────────────────── */
/* A teaching-phase card is text beside its figure. The figure column is sized so a card
   never opens a tall empty gap under short prose (the first render left one). */
/* A figure card is ATOMIC to the composer (it may only break at its own bottom), so a
   card 20px too tall for the space left on a page moves whole to the next one and leaves
   that space empty. Page 1 lost ~260px to exactly that on the first render; the phase
   figure is sized to fit beside its text rather than to be as large as possible. */
.section.sec-introduction .d-inline-img,.section.sec-development .d-inline-img,
.section.sec-conclusion .d-inline-img{align-self:start;max-width:40%}
.section.sec-introduction .d-inline-img img,.section.sec-development .d-inline-img img,
.section.sec-conclusion .d-inline-img img{max-height:152px}
.d-code-fig{background:#fff;border:1px solid var(--ke-line);border-radius:12px}

/* ── page packing ────────────────────────────────────────────────────────────────── */
/* Measured on the CBC test lesson: the document came to 2145px against a two-page budget
   of 2×(1123−28−12) = 2166, and still paginated to THREE pages — the last legal cut sat
   at 2088 (the footer's top), leaving a 57px orphan, and the composer only absorbs a
   trailing remainder under 48px. Shaving page-1 residents does not help: it moves the
   page-1 boundary up by the same amount, so page 2 carries exactly as much as before.
   The saving has to come from PAGE-2 RESIDENTS, which is what these four rules do
   (≈54px), and the reflection block stays deep enough to write three lines in. */
.section.sec-development .panel{padding:9px 14px}
.section.sec-assessment .d-bullets li{padding-block:0}
.section.sec-extended .d-note{padding:9px 12px}

/* ── typography ──────────────────────────────────────────────────────────────────── */
.d-text,.d-note,.d-bullets li,.st-body{font-size:14.5px;line-height:1.52;color:#16233a}
.d-bullets li{padding-block:2px}
.d-lead{font-size:13.5px;color:#4a5768;font-weight:700;margin-bottom:4px}
.lp-footer{color:#4a5768;font-size:11.5px}
`;

module.exports = {
  THEME_OVERRIDE_CSS,
  REGION_NAME: 'Kenya',
  // The East African character cast is Kenyan imagery, so it is allowed here (the Yemen
  // pack opts out because the cast does not depict a Yemeni classroom).
  CHARACTER_CAST: true,
};
