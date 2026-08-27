'use strict';
// Did the guide keep the lesson's own words?
//
// The renderer's job is design, not editing. The restructuring step selects source
// sentences and places them under the 12 template roles; it must not shorten,
// paraphrase or invent. That is an instruction to a language model, which means it is a
// hope until something checks it — so this module checks it, and the Studio logs the
// result with every render.
//
// Method: normalise both sides, then require every reader-visible guide string to be a
// SUBSTRING of the flattened source. Normalisation absorbs the things that are not
// rewriting — harakat, tatweel, alef and ya spelling variants, Eastern/Western digits,
// markdown emphasis, quotation marks and whitespace — so «أُسْرَتِي» matches «اسرتي»
// and «١٦» matches «16». What it does NOT absorb is a changed, trimmed or invented
// sentence, which is the whole point.
//
// Template chrome is excluded by design: section headings, the ✗/✓ labels, the تحقق
// label, the goal's bold prefix, ministry title/subtitle/footer and the time pills are
// the design set's own furniture, not the teacher's text.

const HARAKAT = /[ً-ْٰـ]/g;

// Strings the template supplies. Compared after normalisation, so plain forms are fine.
const CHROME = new Set([
  'تحقق', 'check', 'خطأ', 'صواب', 'mistake', 'correct', 'ملاحظة', 'درس', 'lesson',
  'هدف اليوم', "today's goal", 'التمهيد', 'العرض', 'التطبيق', 'التقويم والختام',
  'مصطلحات', 'تكييف متعدد الصفوف', 'الواجب المنزلي · ركن المعلم',
  'اخطاء شائعة — انتبه لها', 'اخطاء شائعة - انتبه لها',
  // labels the renderer puts on a drawn ✗/✓ board
  'خطا شائع', 'التصحيح', 'صواب', 'خطا',
]);
// Keys that never hold lesson prose.
const SKIP_KEYS = new Set(['id', 'type', 'kind', 'marker', 'heading', 'time', 'label',
  'q', 'pos', 'engine', 'image', 'imageWrong', 'imageCorrect', 'prompt', 'concept',
  'shape', 'north', 'east', 'orient']);

function norm(s) {
  return String(s == null ? '' : s)
    .replace(HARAKAT, '')
    .replace(/[أإآٱ]/g, 'ا')   // أ إ آ ٱ → ا
    .replace(/ى/g, 'ي')                        // ى → ي
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/\*\*|__|[«»"'`]/g, '')
    .replace(/[‎‏‪-‮⁦-⁩]/g, '')
    .replace(/[.,;:!?،؛؟…—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

// Every string anywhere in the source, flattened into one haystack.
function sourceText(source) {
  const parts = [];
  const walk = (v) => {
    if (typeof v === 'string') { parts.push(v); return; }
    if (Array.isArray(v)) { v.forEach(walk); return; }
    if (v && typeof v === 'object') { for (const k of Object.keys(v)) walk(v[k]); }
  };
  walk(source);
  return norm(parts.join('  '));
}

// Reader-visible strings in the guide, with where they came from.
function guideStrings(guide) {
  const out = []; const checks = [];
  for (const sec of (guide.sections || [])) {
    if (!sec || typeof sec !== 'object') continue;
    const id = sec.id || sec.type || '?';
    const take = (val, field) => {
      if (typeof val !== 'string' || !val.trim()) return;
      out.push({ id, field, text: val });
    };
    if (id !== 'lesson-line') take(sec.body, 'body');   // composed from meta fields
    for (const it of (sec.items || [])) {
      if (!it || typeof it !== 'object') continue;
      // The تحقق line is a slot the template demands per stage. Many raw lessons do not
      // state a per-stage success criterion, so it is often authored rather than copied.
      // That is a real editorial act and must be visible — but it is a different finding
      // from rewording the teacher's own sentence, so it is counted separately.
      const isCheck = ['تحقق', 'check'].includes(norm(it.label || ''));
      if (isCheck) { if (typeof it.body === 'string' && it.body.trim()) checks.push({ id, field: 'تحقق', text: it.body }); continue; }
      take(it.body, 'item.body');
      take(it.text, 'item.text');
      take(it.a, 'item.a');
      take(it.value, 'item.value');
    }
  }
  return { bodies: out, checks };
}

// Figure labels and captions are drawn INSIDE a visual, where only a few words fit.
// They are reported separately: a label that paraphrases is a design compromise, a
// body that paraphrases is the thing we are actually guarding against.
function figureLabels(guide) {
  const out = [];
  const walk = (cf, id) => {
    if (!cf || typeof cf !== 'object') return;
    for (const k of ['label', 'caption', 'labelWrong', 'labelCorrect', 'text']) {
      if (typeof cf[k] === 'string' && cf[k].trim()) out.push({ id, field: `figure.${k}`, text: cf[k] });
    }
    for (const k of ['wrong', 'correct']) if (cf[k]) walk(cf[k], id);
    for (const it of (cf.items || cf.stages || cf.parts || [])) {
      if (it && typeof it === 'object') {
        for (const k of ['label', 'caption']) {
          if (typeof it[k] === 'string' && it[k].trim()) out.push({ id, field: `figure.item.${k}`, text: it[k] });
        }
      }
    }
  };
  for (const sec of (guide.sections || [])) if (sec && sec.codeFigure) walk(sec.codeFigure, sec.id || '?');
  return out;
}

function isChrome(text) {
  const n = norm(text);
  if (!n) return true;
  if (CHROME.has(n)) return true;
  if (/^[\d\s+\-×÷*/=<>().,:]+$/.test(n)) return true;          // pure numerals/operators
  if (/^\d+\s*(دقيقة|دقائق|min|minutes)/.test(n)) return true;    // time pills
  if (/(انا افعل|نحن نفعل|انت تفعل|i do|we do|you do)/.test(n)) return true;
  return false;
}

// Strip the template's bold goal prefix before comparing the goal body.
function stripGoalLabel(text) {
  return String(text).replace(/^\s*\*\*[^*]{0,40}\*\*\s*/, '');
}

// A role often holds SEVERAL source sentences — a stage body carries the whole stage,
// and the lesson line is composed from the source's subject, grade, topic and page. Those
// are assemblies of source text, not rewrites, and they are not contiguous in the source,
// so a whole-string match would call them deviations. Split and require every fragment.
function fragments(text) {
  return String(text)
    // Also split on markdown table cells and bold-run boundaries. A flattened table
    // («الكلمة | عدد الحروف | من هو؟ أَبِي | 3 | الوالد …») is every one of the
    // source's own cells joined for display; splitting only on sentence ends made it
    // look like a rewrite when not a word had changed.
    // A closing quote may follow the full stop — «…ونتأكد من الترتيب." بعض الطلاب…» is
    // two sentences, and without allowing for it the splitter saw one long run and
    // reported a seam that is simply a quoted sentence ending.
    .split(/(?<=[.!?؟]["»'”]?)\s+|[\n؛|]+|\s+·\s+|(?<=:)\s+|(?=\*\*)|(?<=\*\*)/)
    .map((x) => x.trim())
    .filter((x) => norm(x).split(' ').length >= 3);   // ignore stubs like "صفحة ٨٠"
}

function checkVerbatim(guide, source, { log = () => {} } = {}) {
  const hay = sourceText(source);
  const check = (rows) => {
    const deviations = [];
    for (const r of rows) {
      const raw = r.field === 'body' && r.id === 'goal' ? stripGoalLabel(r.text) : r.text;
      if (isChrome(raw)) continue;
      const n = norm(raw);
      if (!n) continue;
      if (hay.includes(n)) continue;                       // whole string is source text
      const frags = fragments(raw);
      const missing = frags.filter((f) => !hay.includes(norm(f)));
      if (!frags.length) { deviations.push({ ...r, normalised: n, missing: [raw] }); continue; }
      // every fragment present → assembled from source sentences, which is allowed
      if (missing.length) deviations.push({ ...r, normalised: n, missing });
    }
    return deviations;
  };
  const { bodies, checks } = guideStrings(guide);
  const labels = figureLabels(guide);
  const bodyDev = check(bodies);
  const labelDev = check(labels);
  const checkDev = check(checks);
  const checked = bodies.filter((r) => !isChrome(r.text)).length;
  const report = {
    checked,
    verbatim: checked - bodyDev.length,
    deviations: bodyDev,
    checkLinesChecked: checks.length,
    checkLineDeviations: checkDev,
    labelsChecked: labels.filter((r) => !isChrome(r.text)).length,
    labelDeviations: labelDev,
  };
  if (!hay) {
    log('  ⚠ verbatim check skipped — no source text to compare against');
    return { ...report, skipped: true };
  }
  if (!bodyDev.length) {
    log(`  ✓ verbatim: ${report.verbatim}/${checked} reader-visible string(s) appear in the source unchanged`);
  } else {
    log(`  ⚠ verbatim: ${bodyDev.length} of ${checked} string(s) do NOT appear in the source — the text was reworded:`);
    for (const d of bodyDev.slice(0, 6)) log(`     · [${d.id}/${d.field}] ${String(d.text).slice(0, 90)}`);
  }
  if (checkDev.length) {
    log(`  ℹ ${checkDev.length} of ${checks.length} تحقق line(s) are authored, not copied — the template asks for a per-stage criterion the source does not state`);
  }
  if (labelDev.length) {
    log(`  ℹ ${labelDev.length} figure label(s) are not verbatim source text (labels are drawn short by design)`);
  }
  return report;
}

module.exports = { checkVerbatim, norm, sourceText };
