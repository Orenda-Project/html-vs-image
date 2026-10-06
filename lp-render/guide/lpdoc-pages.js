'use strict';
// THE ICT PAGE MODEL — an lp_doc laid out as NIETE's approved lesson-plan pages.
//
// The approved design (NIETE's "lp_pdfs" references for English, Maths and Urdu, 2026-09-21) is a
// set of portrait pages, one per stage of the lesson:
//
//   Start        the lesson path, JOURNEY SO FAR · TODAY · COMING UP, TO PREPARE,
//                WARM UP beside OPENING, WRITE ON BOARD
//   Explanation  numbered teaching steps (the teacher's words in a speech bubble), KEY FACT,
//                WATCH FOR THIS SLIP, WORKED EXAMPLE, CHECK FOR UNDERSTANDING + IF THEY STRUGGLE
//   Practice     GUIDED PRACTICE (TOGETHER WE SOLVE), INDEPENDENT PRACTICE with answer boxes
//                beside FOR STUDENTS WHO ARE BEHIND / AHEAD, ANSWERS — FOR THE TEACHER
//   Conclusion   EXIT TICKET — pick ONE (options), REMEMBER, HOMEWORK, Tomorrow, COACHING CORNER
//
// A grades 6–12 lp_doc carries more than those grade 1 references show (the board plan, the FBISE
// exam bank, the homework key), so a fifth page in the same design — Teacher support — holds it.
// Nothing ICT paints is dropped; ICT's own omissions (model answers, "not going") still apply.
//
// This builds a PLAIN DATA MODEL: every string already carries the adapter's notation fixes
// (maths dollars, \displaystyle matrices, the auto-bold guard), so the pack's page composer
// (lp-render/decorative/regions/ict/pages.js) only lays it out. Nothing here is reworded and no
// model is called. The chrome labels are the approved design's English ones, for every subject,
// exactly as the approved Urdu reference prints them; the lesson's own words stay in its language.

function buildPageModel(ctx) {
  const { doc, want, L, grade, prov, report, diagram, fix, plainLabel, unnumber, questionIndex, has } = ctx;
  const P2 = doc.page2 || {};
  const O = doc.objectives || {};
  const secs = Array.isArray(doc.sections) ? doc.sections : [];
  const byId = (id) => secs.find((s) => s && s.id === id);
  const minutes = (s) => (s && Number(s.minutes) > 0 ? Number(s.minutes) : null);
  const T = (v) => (has(v) ? fix(String(v)) : '');           // a content string, notation fixed
  const list = (xs) => (Array.isArray(xs) ? xs : []).filter(has).map(T);
  const flat = (blocks) => (blocks || []).flatMap((b) => (b && b.type === 'split' ? [...flat(b.left), ...flat(b.right)] : [b])).filter(Boolean);

  const intro = byId('introduction');
  const dev = byId('development');
  const act = byId('activity');
  const concl = byId('conclusion');
  const hw = byId('homework');
  const S = doc.sequence || {};
  const video = dev && dev.video;

  // ── Start ─────────────────────────────────────────────────────────────────────────────
  const journey = [];
  if (has(S.previous)) journey.push(T(S.previous));
  const warm = intro && intro.warmup && (intro.warmup.items || []).length ? intro.warmup : null;
  for (const it of warm ? warm.items : []) if (has(it.from)) { const f = T(it.from); if (!journey.includes(f)) journey.push(f); }
  const coming = [];
  if (has(S.next)) coming.push(T(S.next));
  else if (has(P2.next_period)) coming.push(T(P2.next_period));
  if (has(S.checkpoint)) coming.push(`**${L.seqCheck}:** ${T(S.checkpoint)}`);
  const start = {
    minutes: minutes(intro),
    path: has(S.this) ? { prev: T(S.previous), today: T(S.this), next: T(S.next) } : null,
    journey,
    today: {
      label: [doc.slo && has(doc.slo.code) ? doc.slo.code : '', grade && grade < 9 ? L.noBoardExam : ''].filter(Boolean).join(' · '),
      outcome: T(O.outcome), byTheEnd: T(O.by_the_end),
      fbise: (doc.fbise_slos || []).map((t) => `**${t.code}**${t.status && L.boardStatus[t.status] ? ` ${L.boardStatus[t.status]}` : ''}`).join(' · '),
    },
    coming,
    prepare: list(doc.materials),
    video: video && has(video.title) ? { title: T(video.title), meta: [video.channel, video.duration].filter(has).join(' · ') } : null,
    warmup: warm ? {
      recalls: [...new Set(warm.items.map((it) => (L.kind[it.kind] || it.kind)).filter(has))].join(' · '),
      items: warm.items.map((it) => ({ q: T(it.q), a: T(it.a), tag: [L.kind[it.kind] || it.kind, it.from].filter(has).map(plainLabel).join(' · ') })),
    } : null,
    opening: [], board: null, keywords: [], notes: [],
  };
  for (const b of flat(intro && intro.blocks)) {
    if (b.type === 'ask') start.opening.push({ kind: 'ask', q: T(b.question), lookFor: T(b.look_for), hook: !!b.hook });
    else if (b.type === 'keywords') start.keywords.push(...(b.items || []).map((k) => ({ word: T(k.word), meaning: T(k.meaning) })));
    else if (b.type === 'board') start.board = T(b.text);
    else if (b.type === 'watch_out') start.opening.push({ kind: 'watch', text: T(b.text) });
    else start.opening.push(...generic(b));
  }

  // ── Explanation ───────────────────────────────────────────────────────────────────────
  const mistakes = (P2.mistakes || []).map((m) => ({ says: T(m.pupil_says), ask: T(m.you_ask) }));
  const diff = P2.differentiation || {};
  const explain = { minutes: minutes(dev), textbook: dev && has(dev.textbook_page) ? `${L.page}${dev.textbook_page}` : '', flow: [] };
  let slipAdded = false;
  for (const b of flat(dev && dev.blocks)) {
    if (b.type === 'watch_out') {
      explain.flow.push({ kind: 'slip', text: T(b.text), mistakes: slipAdded ? [] : mistakes });
      slipAdded = true;
    } else if (b.type === 'ask' && !b.hook) {
      explain.flow.push({ kind: 'cfu', q: T(b.question), lookFor: T(b.look_for) });
    } else explain.flow.push(...generic(b, 'explain'));
  }
  if (!slipAdded && mistakes.length) explain.flow.push({ kind: 'slip', text: '', mistakes });
  if (has(diff.barrier)) {
    const cfu = [...explain.flow].reverse().find((x) => x.kind === 'cfu');
    if (cfu) cfu.struggle = T(diff.barrier);
    else explain.flow.push({ kind: 'struggle', text: T(diff.barrier) });
  }

  // ── Practice ──────────────────────────────────────────────────────────────────────────
  const practice = { minutes: minutes(act), guided: [], independent: [], behind: [], ahead: [], answers: [], flow: [] };
  let n = 0;
  const addPractice = (b, into) => {
    for (const it of b.items || []) {
      n += 1;
      into.push({ n, q: T(it.q), tier: it.tier && it.tier !== 'core' ? plainLabel(L.tier[it.tier] || it.tier) : '' });
      if (has(it.a)) practice.answers.push({ n, a: T(it.a) });
    }
  };
  for (const b of flat(act && act.blocks)) {
    if (b.type === 'faded_example') {
      practice.guided.push({ kind: 'faded', title: T(b.title), prompt: T(b.prompt), steps: (b.steps || []).map(T), answer: T(b.answer) });
    } else if (b.type === 'practice' && b.mode === 'guided') {
      // "We do": solved with the class, so its answers print with it, as TOGETHER WE SOLVE does
      practice.guided.push({ kind: 'list', title: T(b.title), items: (b.items || []).map((it) => ({ q: T(it.q), a: T(it.a) })) });
    } else if (b.type === 'practice') {
      practice.independentTitle = practice.independentTitle || T(b.title);
      addPractice(b, practice.independent);
    } else if (b.type === 'support_extension') {
      if (has(b.support)) practice.behind.push(T(b.support));
      if (has(b.extension)) practice.ahead.push(T(b.extension));
    } else if (b.type === 'ask' && !b.hook) {
      practice.flow.push({ kind: 'cfu', q: T(b.question), lookFor: T(b.look_for) });
    } else practice.flow.push(...generic(b, 'practice'));
  }
  if (has(diff.stuck)) practice.behind.push(T(diff.stuck));
  if (has(diff.early)) practice.ahead.push(T(diff.early));

  // ── Conclusion ────────────────────────────────────────────────────────────────────────
  const conclusion = { minutes: minutes(concl), hwMinutes: minutes(hw), options: [], reteach: '', remember: [], homework: [], tomorrow: '', coach: null, flow: [] };
  if (concl && concl.checkpoint) {
    const c = concl.checkpoint;
    conclusion.options.push({ kind: 'question', label: [L.checkpoint, c.marks ? `${c.marks} ${L.marks}` : ''].filter(Boolean).join(' · '),
      q: T(c.question), how: (c.mark_scheme || []).map(T) });
  }
  for (const x of (concl && concl.exit_ticket) || []) conclusion.options.push({ kind: 'question', label: L.exitTicket, q: T(x.q), ans: T(x.a) });
  for (const b of flat(concl && concl.blocks)) {
    if (b.type === 'board') conclusion.remember.push(T(b.text));
    else if (b.type === 'key_points') conclusion.remember.push(...(b.items || []).map(T));
    else if (b.type === 'practice') for (const it of b.items || []) conclusion.options.push({ kind: 'question', label: T(b.title) || L.exitTicket, q: T(it.q), ans: T(it.a) });
    else conclusion.flow.push(...generic(b, 'conclusion'));
  }
  if (concl && has(concl.reteach_rule)) conclusion.reteach = T(concl.reteach_rule);
  for (const b of flat(hw && hw.blocks)) {
    if (b.type === 'key_points') conclusion.homework.push(...(b.items || []).map((t) => ({ text: T(t) })));
    // homework set as questions keeps its answers, for the teacher, as the exit ticket's "Ans:" does
    else if (b.type === 'practice') conclusion.homework.push(...(b.items || []).map((it) => ({ text: T(it.q), ans: T(it.a) })));
    else conclusion.flow.push(...generic(b, 'homework'));
  }
  if (hw && hw.homework && (hw.homework.items || []).length) {
    for (const it of hw.homework.items) {
      const src = it.source && [it.source.paper, it.source.questions, has(it.source.page) ? `${L.page}${it.source.page}` : null].filter(Boolean);
      conclusion.homework.push({ text: `${T(it.text)}${src && src.length ? ` (${src.map(T).join(', ')})` : ''}`,
        tag: it.level ? `[${it.level}]${it.marks ? ` ${it.marks}${L.markAbbr}` : ''}` : '' });
    }
  }
  // the approved design closes on tomorrow's lesson: the sequence's next, else the page-2 line
  conclusion.tomorrow = has(S.next) ? T(S.next) : (has(P2.next_period) ? T(P2.next_period) : '');
  if (has(P2.coaching_lookfor)) conclusion.coach = { lookFor: T(P2.coaching_lookfor), reflection: T(P2.coaching_reflection) };

  // ── the FBISE exam bank (grade 9+): the first MCQ becomes an exit-ticket option, as the
  //    approved exit ticket offers a four-choice question; the rest print on the support page
  const eb = P2.exam_bank || {};
  const fbiseGrade = grade == null || grade >= 9;
  const letterOf = (i) => 'ABCDE'[i];
  const isAnswer = (opt, i, ans) => ans != null && (String(ans).trim() === String(opt).trim() || String(ans).trim().toUpperCase() === letterOf(i));
  const mcqs = fbiseGrade ? (eb.mcq || []).map((q) => {
    const wrong = q.options.map((o, i) => ({ o, i })).filter(({ o, i }) => !isAnswer(o, i, q.answer));
    return {
      kind: 'mcq', label: L.mcq, q: T(q.q),
      options: q.options.map((o, i) => ({ letter: letterOf(i), text: T(o), key: isAnswer(o, i, q.answer) })),
      notes: (q.distractor_codes || []).map((c, k) => (wrong[k] ? `**${letterOf(wrong[k].i)}** ${T(c)}` : null)).filter(Boolean),
    };
  }) : [];
  if (mcqs.length) conclusion.options.push(mcqs.shift());

  // ── Teacher support ───────────────────────────────────────────────────────────────────
  const support = { board: null, exam: null, hwkey: [] };
  const B = P2.board_final;
  if (B) {
    support.board = {
      img: B.diagram ? diagram(B.diagram, 'board plan') : null,
      caption: has(B.caption) && (!B.diagram || B.caption !== B.diagram.caption) ? T(B.caption) : '',
      order: (B.draw_order || []).map((d) => T(unnumber(d))),
    };
  }
  if (fbiseGrade && (mcqs.length || eb.srq || eb.erq_skeleton || has(eb.how_marked))) {
    const erq = eb.erq_skeleton;
    support.exam = {
      mcqs,
      srq: eb.srq ? { label: [grade != null && grade >= 9 ? L.srq : L.srqEarly, eb.srq.marks ? `${eb.srq.marks} ${L.marks}` : ''].filter(Boolean).join(' · '),
        q: T(eb.srq.q), scheme: (eb.srq.mark_scheme || []).map(T) } : null,
      erq: erq ? { label: [L.erq, erq.marks_total ? `${erq.marks_total} ${L.marks}` : ''].filter(Boolean).join(' · '), q: T(erq.q),
        parts: (erq.parts || []).map((pt) => ({ text: `${T(pt.heading)}${has(pt.note) ? ` — ${T(pt.note)}` : ''}`, marks: pt.marks ? `${pt.marks} ${L.marks}` : '' })) } : null,
      howMarked: T(eb.how_marked),
    };
  }
  const Q = questionIndex(doc);
  for (const h of P2.homework_key || []) {
    const it = h.ref ? Q.get(h.ref) : null;
    support.hwkey.push({ head: [h.ref, h.marks ? `${h.marks} ${L.marks}` : ''].filter(Boolean).join(' · '), q: it ? T(it.q) : T(h.item || L.refMissing), a: T(h.answer) });
  }

  return {
    lang: want, dir: want === 'ur' ? 'rtl' : 'ltr',
    // chrome, so English for every lesson, as the approved Urdu reference prints its header
    title: `Grade ${grade == null ? '' : grade} ${plainLabel(prov.subject || '')}`.replace(/\s+/g, ' ').trim(),
    topic: T(prov.topic),
    chapter: plainLabel(prov.chapter || ''),
    pagesRef: has(prov.printed_pages) ? `${L.page}${prov.printed_pages}` : '',
    periodMinutes: doc.period_minutes ? `${doc.period_minutes} ${L.min}` : '',
    boardWeight: T(doc.board_weight),
    start, explain, practice, conclusion, support,
  };

  // Any block, drawn plainly where no approved slot claims it — so nothing ICT paints is lost.
  function generic(b, where) {
    switch (b.type) {
      case 'paragraph': return [{ kind: where === 'explain' ? 'step' : 'text', text: T(b.text) }];
      case 'say': return [{ kind: where === 'explain' ? 'step' : 'text', text: `“${T(b.text)}”` }];
      case 'ask': return [{ kind: 'ask', q: T(b.question), lookFor: T(b.look_for) }];
      case 'watch_out': return [{ kind: 'slip', text: T(b.text), mistakes: [] }];
      case 'board': return [{ kind: 'board', text: T(b.text) }];
      case 'keywords': return [{ kind: 'keywords', items: (b.items || []).map((k) => ({ word: T(k.word), meaning: T(k.meaning) })) }];
      case 'key_points': return [{ kind: 'keyfact', title: has(b.title) ? T(b.title) : '', items: (b.items || []).map(T) }];
      case 'table': {
        const cols = b.columns || [];
        return [{ kind: 'table', title: T(b.title), columns: cols.map(T), rows: (b.rows || []).map((r) => cols.map((_, i) => (r && r[i] != null ? T(String(r[i])) : ''))) }];
      }
      case 'worked_example': return [{ kind: 'worked', title: T(b.title), prompt: T(b.prompt), steps: (b.steps || []).map(T), result: T(b.result) }];
      case 'faded_example': return [{ kind: 'worked', title: T(b.title), prompt: T(b.prompt), steps: (b.steps || []).map(T), result: T(b.answer) }];
      case 'practice': return [{ kind: 'questions', title: T(b.title), items: (b.items || []).map((it) => ({ q: T(it.q), a: T(it.a) })) }];
      case 'support_extension': return [{ kind: 'duo', support: T(b.support), extension: T(b.extension) }];
      case 'latex': return [{ kind: 'formula', tex: b.tex, caption: T(b.caption) }];
      case 'chem': return [{ kind: 'formula', tex: `\\ce{${b.tex}}`, caption: T(b.caption), chem: true }];
      case 'textbook_figure': return [{ kind: 'bookfig', label: plainLabel(b.figure_label || ''), page: has(b.page) ? `${L.page}${b.page}` : '', caption: T(b.caption), legend: T(b.legend) }];
      case 'diagram': {
        const img = diagram(b.spec, 'flow', { badge: true });
        return img ? [{ kind: 'figure', img }] : [];
      }
      default:
        report.warnings.push(`page model: block type "${b.type}" has no slot`);
        return [];
    }
  }
}

module.exports = { buildPageModel };
