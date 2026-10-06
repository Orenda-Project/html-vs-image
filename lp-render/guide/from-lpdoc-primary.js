'use strict';
// ICT Grades 1–5 lp_doc (schema 3.0) → an "ict-primary-lesson" file for our Grades 1–5 page.
//
// Besides the image path, ICT has an HTML path for Grades 1–5: a lesson written as lp_doc 3.0 (the
// grades 6–12 document format) and drawn on a phone page. The newer approved Grades 1–5 references
// (v17, 5 Oct) are lp_doc 3.0 documents printed that way. This file draws such a document on OUR
// Grades 1–5 page instead, so a Grades 1–5 lp_doc gets the approved Grades 1–5 design rather than
// the grades 6–12 one, with every part of the lesson in the place the approved pages put it:
//
//   provenance / sequence / objectives / materials  → title card, day, journey, outcome, to prepare
//   introduction   warmup · ask(hook) · diagram     → warm-up, the opening question, the board
//   development    big_idea · worked_example · diagram, page2.mistakes
//                                                   → core idea, the solved example (+ its CFU),
//                                                     step-by-step chart, common mistakes
//   activity       faded_example · diagram           → We Do: the half-solved example and its chart
//                  key_points(you-do…) · practice    → You Do: set the task, pupils alone (+ answers)
//                  page2.differentiation             → if stuck / if they finish early
//   conclusion     key_points(remember) · exit_ticket → remember, exit ticket
//   homework       key_points                        → homework
//   page2          board_final → the board at the end of the lesson; coaching_lookfor /
//                  coaching_reflection → the coaching corner; homework_key → the support page
//
// Every printed string is the document's own. NOT printed, and listed in `source.not_printed`:
// operator notes (`notes`), the one-screen WhatsApp summary (`one_screen`), `slo.text_verbatim` and
// `objectives.items` (ICT paints the outcome box only), `page2.model_answers` and
// `page2.next_period` (ICT never paints them), the exam bank (grade 9+ only), and any field that
// still holds the "this part is not ready yet" placeholder — an unfinished slot is a gap in the
// document, not a line to show a teacher. A diagram type the page cannot draw is refused.

const PLACEHOLDER = /^(یہ حصہ ابھی تیار نہیں ہوا|this section is not ready yet\.?)$/i;
const isReal = (s) => s != null && String(s).trim() !== '' && !PLACEHOLDER.test(String(s).trim());
const asList = (v) => (Array.isArray(v) ? v : v == null ? [] : [v]).filter(isReal).map(String);
const joined = (v) => asList(v).join(' ');

const UR = {
  stages: { opening: 'تعارف', explanation: 'تدریس', we_do: 'مل کر کریں', you_do: 'خود کریں', check: 'اختتام', homework: 'گھر کا کام' },
  letters: { opening: '۱', explanation: '۲', we_do: '۳', you_do: '۳', check: '۴', homework: '۵' },
  ido: 'کر کے دکھائیں',
  worked: 'حل شدہ مثال', workedPills: ['وضاحت', 'کر کے دکھائیں'],
  faded: 'نیم حل شدہ مثال', fadedPills: ['رہنمائی', 'مل کر کریں'],
  alone: 'انفرادی مشق', alonePills: ['خود کام', 'خود کریں'],
  chartCompare: 'موازنہ', chartFlow: 'مرحلہ وار خاکہ',
  boardEnd: 'سبق کے اختتام پر تختۂ سیاہ',
  concept: ['وہ فرق جو واضح کرنا ہے:', 'بچے کیا غلط سمجھتے ہیں:', 'یوں کرکے دکھائیں:'],
  hwAnswers: 'گھر کے کام کے مکمل جوابات', letterA: 'الف',
  warmupKind: { prerequisite: 'سابقہ علم', scaffold: 'آج کے لیے سہارا', spaced: 'دہرائی' },
  labels: {
    outcome: 'تدریسی مقصد', warmup: 'ابتدائی دہرائی', mistakes: 'عام غلطیاں اور آپ کا جوابی سوال', youAsk: 'آپ پوچھیں',
    pupilsWrite: 'طلبہ کیا کہتے یا لکھتے ہیں', setTask: 'کام کا آغاز کریں', homework: 'گھر کا کام', ask: 'یہ سوال پوچھیں',
  },
};
const EN = {
  stages: { opening: 'Opening', explanation: 'Explanation', we_do: 'We Do', you_do: 'You Do', check: 'Check', homework: 'Homework' },
  letters: { opening: 'I', explanation: 'D', we_do: 'A', you_do: 'A', check: 'C', homework: 'H' },
  ido: 'I DO',
  worked: 'Worked example', workedPills: ['Explain', 'I do'],
  faded: 'Half-solved example', fadedPills: ['Guided', 'We do'],
  alone: 'Independent practice', alonePills: ['Independent', 'You do'],
  chartCompare: 'Comparison', chartFlow: 'Step by step',
  boardEnd: 'The board at the end of the lesson',
  concept: ['The distinction to make clear:', 'What children get wrong:', 'Show it like this:'],
  hwAnswers: 'Homework answered in full', letterA: 'A',
  warmupKind: { prerequisite: 'prerequisite', scaffold: 'scaffold for today', spaced: 'spaced review' },
  labels: { pupilsWrite: 'What pupils say or write' },
};

const isLpDoc = (d) => !!(d && Array.isArray(d.sections) && d.provenance && d.page2 !== undefined);
const isPrimaryLpDoc = (d) => isLpDoc(d) && Number(d.provenance.grade) >= 1 && Number(d.provenance.grade) <= 5;

// ICT's two chart diagrams, as the page's own HTML charts (words in ink)
function chart(spec, where) {
  if (!spec || !spec.type) throw new Error(`${where}: diagram has no spec`);
  if (spec.type === 'panels') {
    return { type: 'compare', ...(spec.title ? { title: spec.title } : {}), columns: (spec.panels || []).map((p) => ({ head: p.title, lines: asList(p.lines) })) };
  }
  if (spec.type === 'flow') {
    return { type: 'flow', ...(spec.title ? { title: spec.title } : {}), items: (spec.steps || []).map((s) => ({ head: s.title, lines: asList(s.lines) })) };
  }
  throw new Error(`${where}: no Grades 1–5 drawing for ICT diagram type "${spec.type}" (panels and flow are drawn)`);
}

// a teacher-models line as the approved page prints it: "Say: “…”" is a quoted line, "Ask: …" a
// think-aloud, a fill-in sentence frame a frame, anything else the teacher's instruction
function seqLine(t) {
  const s = String(t).trim();
  if (/^(کہیے|کہیں|Say)\s*:/.test(s)) return { k: 'quote', t: s };
  if (/^(پوچھیں|Ask)\s*:/.test(s)) return { k: 'think', t: s };
  if (/(_{3,}|\.{6,})/.test(s)) return { k: 'frame', t: s };
  return { k: 'instr', t: s };
}

function lessonFromLpDocPrimary(doc, { origin } = {}) {
  if (!isPrimaryLpDoc(doc)) throw new Error('not a Grades 1–5 lp_doc (needs sections[], provenance.grade 1–5, page2)');
  const prov = doc.provenance;
  const lang = (prov.medium === 'ur' || prov.medium === 'en') ? prov.medium : 'en';
  const T = lang === 'ur' ? UR : EN;
  const p2 = doc.page2 || {};
  const gaps = [];
  const sec = (id) => (doc.sections || []).find((s) => s.id === id) || { blocks: [] };
  const charts = [];
  const figure = (b, where) => {
    const v = chart(b.spec, where);
    charts.push(b.id);
    return { type: 'figure', label: v.type === 'compare' ? T.chartCompare : T.chartFlow, visual: v };
  };
  const note = (where, s) => { if (s != null && !isReal(s)) gaps.push(where); };

  // ── THE BOARD (the introduction's board-plan diagram) ──
  const intro = sec('introduction');
  const board = [];
  for (const b of intro.blocks) {
    if (b.type === 'diagram' && /board/i.test(b.id || '')) {
      board.push({ visual: chart(b.spec, `introduction ${b.id}`), lines: [] });
      charts.push(b.id);
    }
  }

  // ── OPENING ──
  const opening = [];
  const wItems = ((intro.warmup || {}).items || []).filter((it) => isReal(it.q));
  if (wItems.length) {
    opening.push({ type: 'warmup', items: wItems.map((it) => ({ q: it.q, a: isReal(it.a) ? it.a : '', ...(T.warmupKind[it.kind] ? { tag: T.warmupKind[it.kind] } : {}) })) });
  }
  for (const b of intro.blocks) {
    if (b.type === 'ask' && b.hook) opening.push({ type: 'hook', text: joined(b.question) });
    else if (b.type === 'ask') opening.push({ type: 'ask_this', items: asList(b.question) });
    else if (b.type === 'diagram' && !/board/i.test(b.id || '')) opening.push(figure(b, `introduction ${b.id}`));
    else if (b.type !== 'diagram') throw new Error(`introduction: no Grades 1–5 place for block type "${b.type}"`);
  }

  // ── EXPLANATION ──
  const dev = sec('development');
  const explanation = [];
  for (const b of dev.blocks) {
    if (b.type === 'big_idea') {
      const items = [[T.concept[0], b.distinction], [T.concept[1], b.misconception], [T.concept[2], b.demo]]
        .filter(([, t]) => isReal(t)).map(([lead, text]) => ({ lead, text }));
      if (items.length) explanation.push({ type: 'concept', items });
    } else if (b.type === 'worked_example') {
      const seq = asList(b.steps).map(seqLine);
      explanation.push({ type: 'teacher_models', head: T.worked, pills: T.workedPills, instruction: seq.length ? seq[0].t : '', seq });
      if (asList(b.cfu).length) explanation.push({ type: 'ask_this', items: asList(b.cfu) });
    } else if (b.type === 'diagram') explanation.push(figure(b, `development ${b.id}`));
    else throw new Error(`development: no Grades 1–5 place for block type "${b.type}"`);
  }
  const mistakes = (p2.mistakes || []).filter((m) => isReal(m.you_ask));
  if (mistakes.length) explanation.push({ type: 'mistakes', items: mistakes.map((m) => ({ ...(isReal(m.pupil_says) ? { pupil_says: m.pupil_says } : {}), you_ask: m.you_ask })) });

  // ── WE DO / YOU DO (the activity section, split where the pupils' own work starts) ──
  const act = sec('activity');
  const split = act.blocks.findIndex((b) => /^you-do/i.test(b.id || '') || b.type === 'practice');
  const weBlocks = split < 0 ? act.blocks : act.blocks.slice(0, split);
  const youBlocks = split < 0 ? [] : act.blocks.slice(split);
  const weDo = [];
  for (const b of weBlocks) {
    if (b.type === 'faded_example') {
      const seq = [...asList(b.prompt).map((t) => ({ k: 'bullet', t })), ...asList(b.steps).map(seqLine)];
      weDo.push({ type: 'teacher_models', head: T.faded, pills: T.fadedPills, instruction: seq.length ? seq[0].t : '', seq });
    } else if (b.type === 'diagram') weDo.push(figure(b, `activity ${b.id}`));
    else throw new Error(`activity (We Do): no Grades 1–5 place for block type "${b.type}"`);
  }
  const youDo = [];
  for (const b of youBlocks) {
    if (b.type === 'key_points') youDo.push({ type: 'set_task', lines: asList(b.items) });
    else if (b.type === 'practice') {
      youDo.push({ type: 'alone', head: T.alone, pills: T.alonePills, items: (b.items || []).filter((it) => isReal(it.q)).map((it) => ({ q: it.q, ...(isReal(it.a) ? { answer: it.a } : {}) })) });
    } else if (b.type === 'diagram') youDo.push(figure(b, `activity ${b.id}`));
    else throw new Error(`activity (You Do): no Grades 1–5 place for block type "${b.type}"`);
  }
  const diff = p2.differentiation || {};
  note('page2.differentiation.barrier', diff.barrier);
  if (asList(diff.stuck).length || asList(diff.early).length) youDo.push({ type: 'differentiation', stuck: asList(diff.stuck), early: asList(diff.early) });

  // ── CHECK · HOMEWORK ──
  const concl = sec('conclusion');
  const check = [];
  for (const b of concl.blocks) {
    if (b.type === 'key_points') check.push({ type: 'remember', lines: asList(b.items) });
    else if (b.type === 'diagram') check.push(figure(b, `conclusion ${b.id}`));
    else throw new Error(`conclusion: no Grades 1–5 place for block type "${b.type}"`);
  }
  const exits = (concl.exit_ticket || []).filter((e) => asList(e.q).length);
  if (exits.length) check.push({ type: 'exit', items: exits.map((e) => ({ q: joined(e.q), criterion: isReal(e.a) ? String(e.a) : '' })) });
  const hwSec = sec('homework');
  const hwLines = hwSec.blocks.filter((b) => b.type === 'key_points').flatMap((b) => asList(b.items));

  const minutes = (s) => (Number(s.minutes) > 0 ? Number(s.minutes) : undefined);
  const faded = weBlocks.find((b) => b.type === 'faded_example');
  const practice = youBlocks.find((b) => b.type === 'practice');
  const stage = (id, blocks, extra = {}) => ({ id, label: T.stages[id], letter: T.letters[id], ...extra, blocks });
  const stages = [
    stage('opening', opening, { minutes: minutes(intro) }),
    stage('explanation', explanation, { minutes: minutes(dev), mode: T.ido }),
    stage('we_do', weDo, { minutes: faded ? minutes(faded) : undefined }),
    stage('you_do', youDo, { minutes: practice ? minutes(practice) : undefined }),
    stage('check', check, { minutes: minutes(concl) }),
    ...(hwLines.length ? [stage('homework', [{ type: 'homework', lines: hwLines }])] : []),
  ].filter((s) => s.blocks.length);

  // ── THE BOARD AT THE END · SUPPORT PAGE ──
  const bf = p2.board_final;
  const boardEnd = bf && bf.diagram ? {
    label: T.boardEnd,
    visual: { ...chart(bf.diagram, 'page2.board_final'), ...(isReal(bf.caption) ? { caption: bf.caption } : {}) },
    ...(asList(bf.draw_order).length ? { note: asList(bf.draw_order).join(' ') } : {}),
  } : undefined;
  const hwKey = (p2.homework_key || []).filter((h) => isReal(h.item));
  (p2.model_answers || []).forEach((m, i) => note(`page2.model_answers[${i}]`, m.answer));
  (doc.objectives && doc.objectives.items || []).forEach((it, i) => note(`objectives.items[${i}]`, it.text));

  const outcomeText = doc.objectives && isReal(doc.objectives.outcome) ? doc.objectives.outcome : undefined;
  return {
    kind: 'ict-primary-lesson',
    version: 1,
    lesson_id: doc.lesson_id,
    source: {
      from: origin || `ICT Grades 1–5 lp_doc ${doc.schema_version || ''} ${doc.lesson_id}`.trim(),
      method: 'REAL ICT lp_doc: converted field by field by lp-render/guide/from-lpdoc-primary.js; nothing reworded. Not rebuilt from a PDF, not a sample fixture.',
      presentation_fixes: [
        ...(charts.length ? [`ICT's ${charts.length} chart diagram(s) (${charts.join(', ')}) are drawn as the page's own comparison / step-by-step cards, words in ink`] : []),
        'list fields (the opening question, differentiation, the exit ticket) print as sentences, not as comma-joined arrays',
      ],
      not_printed: [
        'notes (operator notes) and one_screen (the WhatsApp summary)',
        'slo.text_verbatim and objectives.items — ICT paints the outcome box only',
        'page2.model_answers and page2.next_period — ICT never paints them',
        ...(gaps.length ? [`still marked "not ready yet" in the document, so left off the page: ${gaps.join(', ')}`] : []),
      ],
      gaps,
    },
    lang,
    ...(lang === 'ur' ? { numerals: 'urdu' } : {}),
    grade: Number(prov.grade),
    subject: prov.subject,
    chapter: prov.chapter || '',
    pages: String(prov.printed_pages || ''),
    period_minutes: Number(doc.period_minutes) || undefined,
    labels: T.labels,
    title: prov.topic,
    day: doc.sequence && doc.sequence.of ? { n: doc.sequence.day, of: doc.sequence.of } : undefined,
    journey: doc.sequence && isReal(doc.sequence.previous) ? doc.sequence.previous : [],
    coming_up: doc.sequence && isReal(doc.sequence.next) ? doc.sequence.next : [],
    outcome: { code: (doc.slo && doc.slo.code) || '', ...(outcomeText ? { text: outcomeText } : {}) },
    prepare: asList(doc.materials),
    keywords: [],
    board,
    ...(boardEnd ? { board_end: boardEnd } : {}),
    stages,
    coaching: {
      ...(isReal(p2.coaching_lookfor) ? { look_for: p2.coaching_lookfor } : {}),
      ask_yourself: isReal(p2.coaching_reflection) ? p2.coaching_reflection : '',
    },
    ...(hwKey.length ? { support: { sections: [{ letter: T.letterA, heading: T.hwAnswers, items: hwKey.map((h) => ({ label: h.ref, q: h.item, a: h.answer })) }] } } : {}),
  };
}

module.exports = { isPrimaryLpDoc, lessonFromLpDocPrimary, PLACEHOLDER };
