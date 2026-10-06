'use strict';
// ICT's Grades 1–5 slide script → an "ict-primary-lesson" file for our Grades 1–5 page.
//
// ICT's K-5 pipeline (run offline in the operator workspace, `niete-nbpro`) goes: page truth (A) →
// segmentation (B) → enrichment (C) → SLIDE SCRIPT (D0, `_slide_script.json`) → an image model
// draws each page (D) → PDF (F). The slide script is the whole lesson as structured fields — goal,
// SLO, key words, board, warm-up, I Do steps and lines, worked example, We Do, partner work, You Do
// problems with answers, exit options, homework, reflection — written for the image model to draw.
//
// This turns that file into our Grades 1–5 lesson file, so the lesson is drawn as HTML + SVG
// instead of by the image model. Every teacher-facing field is printed word for word, in the
// script's own order. What it leaves out is listed in `source.not_printed`:
//   • the `diagram` strings — prompts telling the image model what to draw ("[bundle][bundle]");
//     the place-value pictures here are counted from the lesson's own numbers instead;
//   • operator notes (`designNotes`, `sourceFile`, `cost`, `navLocal`, skill/CPA/bloom tags).
// No model is called. A field this file cannot place is refused, never silently dropped.

const isSlideScript = (d) => !!(d && d.meta && d.meta.lessonId && d.iDo && d.weDo && d.youDo && d.wrap);

// the labels this file adds (the slide script names the parts by key, not by words)
const EN = {
  recalls: 'Recalls', nextLine: 'Next line', partners: 'With a partner', show: 'Show', listen: 'Listen for',
  struggle: 'If they struggle', how: 'How to run', coach: 'Coach', success: 'Success criteria',
  predict: 'Self-predict', wordProblem: 'Word problem', partnerA: 'Partner A', partnerB: 'Partner B',
  togetherSolve: 'Together we solve', withPartner: 'With your partner',
};
const LABELS = {
  mistakes: 'Watch for this slip', pupilsWrite: 'Slip', youAsk: 'Fix',
  stuck: 'For students who are behind', early: 'For students who are ahead', exit: 'Exit ticket — pick one',
};
const SUBJECT = { math: 'Maths', maths: 'Maths', english: 'English', urdu: 'Urdu', science: 'Science', general_science: 'Science' };

const x = (label, text) => (text == null || String(text).trim() === '' ? null : { label, text: String(text) });
const xs = (...items) => items.filter(Boolean);
const pagesOf = (arr) => {
  const p = (arr || []).map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
  if (!p.length) return '';
  const run = p.every((n, i) => i === 0 || n === p[i - 1] + 1);
  return run && p.length > 1 ? `${p[0]}-${p[p.length - 1]}` : p.join(', ');
};

// PLACE VALUE: a maths script that builds numbers in a Thousands | Hundreds | Tens | Ones chart
// gets a drawing per worked number, counted from the number itself
const PLACE = /^(thousands|hundreds|tens|ones)$/i;
function placeValueSetup(ss) {
  const board = ((ss.hook || {}).board || {}).content || '';
  const headLine = board.split('\n').find((l) => l.includes('|') && l.split('|').every((h) => PLACE.test(h.trim())));
  if (!headLine) return null;
  const all = JSON.stringify(ss);
  const kind = /\b(cube|flat|rod)s?\b/i.test(all) ? 'blocks' : /\b(bundle|stick)s?\b/i.test(all) ? 'sticks' : null;
  if (!kind) return null;
  return { headLine, heads: headLine.split('|').map((h) => h.trim()), kind };
}
const numberOf = (answer) => { const m = /^\s*(\d{1,4})\s*=/.exec(String(answer || '')); return m ? m[1] : null; };

// `chapter`: the chapter line (the slide script names only its pages; the segmentation file
// that came before it, Stage B, carries the chapter title)
function lessonFromSlideScript(ss, { origin, chapter } = {}) {
  if (!isSlideScript(ss)) throw new Error('not an ICT Grades 1–5 slide script (needs meta.lessonId, iDo, weDo, youDo, wrap)');
  const m = ss.meta;
  if (m.urduMedium) throw new Error(`${m.lessonId}: an Urdu-medium slide script is not mapped yet (this file writes the English-medium page)`);
  if (ss.wrap.revisionPanels) throw new Error(`${m.lessonId}: revision panels are not mapped yet`);
  const pv = placeValueSetup(ss);
  const pvVisual = (num) => (pv && num != null ? { type: 'place_value', number: String(num), heads: pv.heads, kind: pv.kind } : undefined);
  const fixes = [];

  // ── BOARD ──
  const boardLines = String(ss.hook.board.content || '').split('\n').map((l) => l.trim()).filter(Boolean);
  const board = [{ note: ss.hook.board.instruction || undefined, lines: boardLines }];
  if (pv) {
    board[0].visual = { type: 'place_value', number: '', heads: pv.heads, kind: pv.kind };
    board[0].lines = boardLines.filter((l) => l !== pv.headLine);
    fixes.push(`the board's "${pv.headLine}" line is drawn as the empty place-value chart it describes`);
  }

  // ── OPENING ──
  const w = ss.hook.warmUp || {};
  const opening = [
    { type: 'warmup', items: [{ q: w.teacherAsks, a: w.expectedAnswer || '', extras: xs(x(EN.recalls, w.recallOf), x(EN.nextLine, w.nextLine), x(EN.partners, ss.warmUpPeerMove)) }] },
    { type: 'hook', text: ss.hook.story, extras: xs(...(ss.hook.objects || []).map((o) => x(EN.show, o))) },
  ];
  if ((ss.hook.conversation || []).length) {
    opening.push({ type: 'ask_this', items: ss.hook.conversation.map((c) => ({ q: c.teacherAsks, extras: xs(x(EN.listen, c.listenFor)) })) });
  }

  // ── I DO ──
  const i = ss.iDo;
  const seq = [];
  for (const st of i.steps || []) {
    seq.push({ k: 'instr', t: st.action });
    if (st.say) seq.push({ k: 'quote', t: st.say });
    if (st.sayLocal) seq.push({ k: 'local', t: st.sayLocal });
  }
  if (i.teacherSays) seq.push({ k: 'quote', t: i.teacherSays });
  if (i.teacherSaysLocal) seq.push({ k: 'local', t: i.teacherSaysLocal });
  const explanation = [{ type: 'teacher_models', instruction: (i.steps || [])[0] ? i.steps[0].action : i.teacherSays, seq }];
  if (i.keyFact) explanation.push({ type: 'key_fact', lines: [i.keyFact] });
  if (i.worked) {
    explanation.push({ type: 'worked', problem: i.worked.problem, steps: i.worked.work || [], numbered: false, answer: i.worked.answer, visual: pvVisual(numberOf(i.worked.answer)) });
  }
  if (i.cfu) explanation.push({ type: 'ask_this', items: [{ q: i.cfu, extras: xs(x(EN.listen, i.cfuPassSignal), x(EN.struggle, i.ifStruggle)) }] });
  if (i.misconception) explanation.push({ type: 'mistakes', items: [{ pupil_says: i.misconception.slip, why: i.misconception.why, you_ask: i.misconception.fix }] });

  // ── WE DO ──
  const wd = ss.weDo;
  const weDo = [{ type: 'teacher_models', instruction: wd.action, seq: [{ k: 'instr', t: wd.action }, ...(wd.strategy ? [{ k: 'bullet', t: wd.strategy }] : [])] }];
  if (wd.modelled) {
    weDo.push({ type: 'worked', label: EN.togetherSolve, problem: wd.modelled.problem, steps: wd.modelled.work || [], numbered: false, answer: wd.modelled.answer, visual: pvVisual(numberOf(wd.modelled.answer)) });
  }
  if (wd.partner) {
    const pseq = [{ k: 'instr', t: wd.partner.instruction }];
    if (wd.partner.a) pseq.push({ k: 'frame', t: `${EN.partnerA}: ${wd.partner.a}` });
    if (wd.partner.b) pseq.push({ k: 'frame', t: `${EN.partnerB}: ${wd.partner.b}` });
    if (wd.partner.teacherRole) pseq.push({ k: 'bullet', t: wd.partner.teacherRole });
    weDo.push({ type: 'teacher_models', head: EN.withPartner, pills: [], instruction: wd.partner.instruction, seq: pseq });
  }
  if (wd.cfu) weDo.push({ type: 'ask_this', items: [wd.cfu] });

  // ── YOU DO ──
  const yd = ss.youDo;
  const items = (yd.problems || []).map((p) => ({ q: p.prompt, ref: p.ref || p.source || undefined, answer: p.answer }));
  if (yd.wordProblem) items.push({ label: EN.wordProblem, q: yd.wordProblem.prompt, answer: yd.wordProblem.answer });
  const youDo = [{ type: 'set_task', lines: [yd.action] }, { type: 'alone', items }];
  const diffItem = (d) => (d ? [{ q: d.prompt, answer: d.answer, extras: xs(x(EN.coach, d.coach)) }] : []);
  if (yd.behind || yd.ahead) youDo.push({ type: 'differentiation', stuck: diffItem(yd.behind), early: diffItem(yd.ahead) });

  // ── CHECK · HOMEWORK ──
  const wr = ss.wrap;
  const check = [];
  if ((wr.keyFacts || []).length) check.push({ type: 'remember', lines: wr.keyFacts });
  check.push({
    type: 'exit',
    items: (wr.exitOptions || []).map((o) => ({ q: o.prompt, local: o.promptLocal || undefined, choices: (o.choices || []).length ? o.choices : undefined, criterion: o.answer, extras: xs(x(EN.how, o.howToRun)) })),
    extras: xs(x(EN.success, ss.exitSuccessCriteria), x(EN.predict, ss.exitSelfPredict)),
  });

  const stages = [
    { id: 'opening', label: 'Opening', letter: 'I', blocks: opening },
    { id: 'explanation', label: 'Explanation', letter: 'D', minutes: i.minutes, mode: 'I DO', blocks: explanation },
    { id: 'we_do', label: 'We Do', letter: 'A', minutes: wd.minutes, blocks: weDo },
    { id: 'you_do', label: 'You Do', letter: 'A', minutes: yd.minutes, blocks: youDo },
    { id: 'check', label: 'Check', letter: 'C', blocks: check },
  ];
  if ((wr.homework || []).length) stages.push({ id: 'homework', label: 'Homework', letter: 'H', blocks: [{ type: 'homework', lines: wr.homework }] });

  return {
    kind: 'ict-primary-lesson',
    version: 1,
    lesson_id: m.lessonId,
    source: {
      from: origin || `ICT Grades 1–5 pipeline, Stage D0 slide script (_slide_script.json) for ${m.lessonId}`,
      method: 'REAL PIPELINE OUTPUT: converted field by field from ICT\'s own slide script by lp-render/guide/from-slide-script.js; nothing reworded. Not rebuilt from a PDF, not a sample fixture.',
      presentation_fixes: [
        ...fixes,
        ...(pv ? ['each worked number (worked example, together-we-solve) is also drawn in the place-value chart, counted from the number itself'] : []),
      ],
      not_printed: [
        'the slide script\'s "diagram" strings: they are instructions to the image model ("[bundle][bundle]…"), so the pictures are drawn from the lesson\'s numbers instead',
        'operator notes: designNotes, sourceFile, cost, navLocal, skillType / cpaPhase / bloom tags',
      ],
    },
    lang: 'en',
    grade: m.grade,
    subject: SUBJECT[String(m.subject).toLowerCase()] || m.subject,
    chapter: chapter || m.chapterTitle || '',
    pages: pagesOf(m.pagesPrinted),
    period_minutes: m.durationMin || ss.totalMinutes,
    labels: LABELS,
    title: m.topic,
    today_note: ss.goal,
    ...(pv ? { hero_visual: { type: 'place_value', number: '', heads: pv.heads, kind: pv.kind } } : {}),
    day: { n: m.day, of: m.total },
    journey: m.journeySoFar || [],
    coming_up: m.comingUp || [],
    outcome: { code: ss.sloCode, text: ss.sloFull, items: m.sloDescriptions },
    prepare: m.materials || [],
    keywords: (ss.hook.keyWords || []).map((k) => ({ word: k.term, local: k.urdu, note: k.syllables, meaning: k.def })),
    board,
    stages,
    coaching: { ask_yourself: wr.reflection },
  };
}

module.exports = { isSlideScript, lessonFromSlideScript };
