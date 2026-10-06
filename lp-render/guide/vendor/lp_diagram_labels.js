'use strict';
// VENDORED from the NIETE (ICT) bot, niete/bot/vendor/lp-v9/lib/template.js (lines 30-117 at the
// mirror's 2cabe3b) — the diagram BADGE table and its lookup, copied verbatim so a figure wears
// the same label ICT prints ("Geometry", "Mind map", "مرحلہ وار خاکہ"). template.js itself is not
// vendored: this renderer draws the page. Re-vendor rather than edit.

// ── diagram-type badge: the enum is OURS, the badge is the TEACHER'S ─────────
// The figure badge used to print `spec.type` raw, under `text-transform:uppercase`, so the
// 2026-09-02 ICT sample set shipped "CHEM_EQUATION", "FREE_BODY", "GRAPH" and
// "LEAF_CROSS_SECTION" to classrooms. A diagram type is an internal registry key; the badge is
// a teacher-facing label and must read as one, in the DOCUMENT's language.
//
// Every canonical type AND every alias gets its own row on purpose. A doc may name either —
// `leaf_cross_section` is an alias and it is in the shipped ICT set today — and the alias is
// usually the more specific word, so it earns a more specific label than its canonical type
// ("Cross-section", not "Cell"). test/print_quality.js enumerates the diagram engine's OWN
// registry against this table, so a new type cannot ship without a label.
const DIAGRAM_LABELS = {
  atom:               { en: "Atom",            ur: "ایٹم" },
  bohr:               { en: "Bohr model",      ur: "بور ماڈل" },
  electron_shells:    { en: "Electron shells", ur: "برقیوں کے خول" },
  dot_and_cross:      { en: "Dot and cross",   ur: "نقطہ و صلیب خاکہ" },
  cell:               { en: "Cell",            ur: "خلیہ" },
  leaf_cross_section: { en: "Cross-section",   ur: "مقطع" },
  heart_loop:         { en: "Circulation",     ur: "دورانِ خون" },
  bio_schematic:      { en: "Biology diagram", ur: "حیاتیاتی خاکہ" },
  dna_helix:          { en: "DNA helix",       ur: "ڈی این اے مرغولہ" },
  rna_helix:          { en: "RNA helix",       ur: "آر این اے مرغولہ" },
  nucleic_acid_helix: { en: "Nucleic acid",    ur: "نیوکلک ایسڈ" },
  helix:              { en: "Helix",           ur: "مرغولہ" },
  chem_equation:      { en: "Equation",        ur: "مساوات" },
  equation:           { en: "Equation",        ur: "مساوات" },
  reaction:           { en: "Reaction",        ur: "تعامل" },
  circuit:            { en: "Circuit",         ur: "برقی دور" },
  circuit_diagram:    { en: "Circuit",         ur: "برقی دور" },
  flow:               { en: "Flow",            ur: "مرحلہ وار خاکہ" },
  process:            { en: "Process",         ur: "عمل" },
  chain:              { en: "Chain",           ur: "سلسلہ" },
  fraction_bar:       { en: "Bar model",       ur: "پٹی نما ماڈل" },
  bar_model:          { en: "Bar model",       ur: "پٹی نما ماڈل" },
  tape_diagram:       { en: "Bar model",       ur: "پٹی نما ماڈل" },
  free_body:          { en: "Force diagram",   ur: "قوتوں کا خاکہ" },
  fbd:                { en: "Force diagram",   ur: "قوتوں کا خاکہ" },
  force_diagram:      { en: "Force diagram",   ur: "قوتوں کا خاکہ" },
  vector:             { en: "Vectors",         ur: "سمتیہ خاکہ" },
  geometry:           { en: "Geometry",        ur: "ہندسہ" },
  construction:       { en: "Construction",    ur: "ہندسی تشکیل" },
  graph:              { en: "Graph",           ur: "گراف" },
  plot:               { en: "Graph",           ur: "گراف" },
  function_plot:      { en: "Graph",           ur: "گراف" },
  grid:               { en: "Grid",            ur: "خانہ دار جدول" },
  area_model:         { en: "Area model",      ur: "رقبے کا ماڈل" },
  hundred_square:     { en: "Hundred square",  ur: "سو خانوں کا مربع" },
  illustrative:       { en: "Illustration",    ur: "تصویری وضاحت" },
  ai_art:             { en: "Illustration",    ur: "تصویری وضاحت" },
  placeholder:        { en: "Illustration",    ur: "تصویری وضاحت" },
  labelled_figure:    { en: "Labelled figure", ur: "نشان زد تصویر" },
  textbook_figure:    { en: "Book figure",     ur: "کتاب کی تصویر" },
  photo_labels:       { en: "Labelled figure", ur: "نشان زد تصویر" },
  mindmap:            { en: "Mind map",        ur: "ذہنی نقشہ" },
  concept_map:        { en: "Concept map",     ur: "تصوراتی نقشہ" },
  molecule:           { en: "Molecule",        ur: "سالمہ" },
  smiles:             { en: "Molecule",        ur: "سالمہ" },
  structure:          { en: "Structure",       ur: "ساخت" },
  numberline:         { en: "Number line",     ur: "عددی خط" },
  number_line:        { en: "Number line",     ur: "عددی خط" },
  // "Panels" was the SHAPE, not the point: it told the teacher how the SVG is laid out, which is
  // the one thing she can already see. Its own Urdu has always said موازنہ — comparison — so the
  // English was the outlier, not the translation. The badge names what the figure is FOR.
  panels:             { en: "Comparison",      ur: "موازنہ" },
  comparison:         { en: "Comparison",      ur: "موازنہ" },
  compare:            { en: "Comparison",      ur: "موازنہ" },
  punnett:            { en: "Punnett square",  ur: "پنیٹ مربع" },
  genetics:           { en: "Genetics",        ur: "جینیات" },
  cross:              { en: "Genetic cross",   ur: "جینیاتی کراس" },
  ray_diagram:        { en: "Ray diagram",     ur: "شعاعی خاکہ" },
  optics:             { en: "Optics",          ur: "بصریات" },
  lens:               { en: "Lens",            ur: "عدسہ" },
  mirror:             { en: "Mirror",          ur: "آئینہ" },
  timeline:           { en: "Timeline",        ur: "زمانی خط" },
  chronology:         { en: "Timeline",        ur: "زمانی خط" },
};

/**
 * The teacher-facing badge for a diagram type, in `lang`. Returns "" for an unknown type —
 * the caller prints NO badge rather than leaking the enum, because an unlabelled figure is a
 * cosmetic gap and a printed enum is a defect a teacher sees.
 */
function diagramLabel(type, lang = "en") {
  const row = DIAGRAM_LABELS[String(type ?? "").trim().toLowerCase()];
  if (!row) return "";
  return row[lang === "ur" ? "ur" : "en"] || row.en || "";
}

module.exports = { DIAGRAM_LABELS, diagramLabel };
