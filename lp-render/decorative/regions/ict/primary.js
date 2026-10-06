'use strict';
// NIETE's approved lesson-plan page for GRADES 1–5 (lp_html v8.1, the "phone page"): one column,
// 520 px wide, printed on tall 520×2000 pages that read on a phone the way a WhatsApp PDF is read
// — top to bottom. Three approved lessons are the reference: Grade 1 English, Grade 1 Maths and
// Grade 2 Urdu (shared 2026-10-01).
//
//   start      navy title card · day stepper · TODAY · journey so far / coming up · learning
//              outcome · to prepare · video · key words · write on the board
//   stages     a coloured bar per stage (Opening teal I, Explanation navy D, We Do blue A,
//              You Do green A, Check purple C, Homework slate H) and that stage's cards
//   close      coaching corner
//
// What this adds to the approved pages, and why: pictures drawn in code from the lesson's own
// words (a clock at the lesson's time, the letters being blended, the story's scenes), so the page
// is bright for young children and costs nothing; and the reference's print defects fixed (a
// teacher line split at "p.", an ASCII clock, a leaked "model_solution:" key, arrows that point
// against Urdu's reading direction).
//
// The page model is the lesson file itself (lp-render/guide/from-primary.js checks it). This file
// lays it out as a column of blocks; lp-render/render/phone-pages-pdf.js flows those blocks onto
// pages, continuing a stage on the next page under a "· continued" bar. Everything sits under
// .ictq, so no other region or the grades 6–12 design (.ictp) is touched.
const fs = require('node:fs');
const path = require('node:path');
const { draw, HTML_VISUALS, heroBadge, ICON, DEED, stageIcon, face, C, PV_ICON } = require('./primary-art');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const AR = /[؀-ۿ]/;

// ── LABELS ────────────────────────────────────────────────────────────────────────────────
// As the approved pages print them. The Urdu page mixes Urdu labels with some English ones
// (TEACHER MODELS, WE DO · CLASS PRACTISES TOGETHER …) — kept as approved.
const LABELS = {
  en: {
    grade: 'Grade', today: 'Today', journey: 'Journey so far', coming: 'Coming up', outcome: 'Learning outcome',
    prepare: 'To prepare', video: 'Video resource', keywords: 'Key words', board: 'Write on the board',
    warmup: 'Warm-up', setup: 'Set this up', hook: 'Open with this question', hookPill: '', teacherModels: 'Teacher models',
    explain: 'Explain', ido: 'I do', worked: 'Worked example', ask: 'Ask this', mistakes: 'Common mistakes and the question you ask back',
    youAsk: 'You ask', guided: 'Guided', wedo: 'We do', together: 'We do · class practises together', setTask: 'Set the task going',
    say: 'Say:', independent: 'Independent', youdo: 'You do', alone: 'You do · pupils work alone', answer: 'Answer',
    sample: 'Sample answer', diff: 'Differentiation', stuck: 'If stuck', early: 'If they finish early', exit: 'Exit ticket',
    homework: 'Homework', homeworkPill: '', coaching: 'Coaching corner', askYourself: 'Ask yourself',
    coachSteps: ['Record up to 40 minutes of this lesson', 'Send it to NIETE on WhatsApp', 'Same-day tips back: what worked, and one thing to try'],
    continued: 'continued', page: 'page {n} of {m}', min: '{n} min', pp: 'pp.', p: 'p.',
    concept: 'Core idea', conceptPill: 'Aim', pupilsWrite: 'What pupils write', remember: 'Remember', rememberPill: 'Final check',
    lookFor: 'Look for this', support: 'Reference material', supportFollow: 'Support pages follow — planning material for you, not read aloud in class.',
    keyFact: 'Key fact', why: 'Why', journeyNone: 'Starting fresh!', moreDays: '+ {n} more days in this chapter',
  },
  ur: {
    grade: 'جماعت', today: 'آج', journey: 'اب تک کا سفر', coming: 'آگے کیا', outcome: 'تدریسی نتیجہ',
    prepare: 'تیاری کیجیے', video: 'ویڈیو', keywords: 'کلیدی الفاظ', board: 'تختۂ سیاہ پر لکھیے',
    warmup: 'Warm-up', setup: 'Set this up', hook: 'اس سوال سے آغاز کریں', hookPill: 'آغاز', teacherModels: 'Teacher models',
    explain: 'وضاحت', ido: 'کر کے دکھائیں', worked: 'Worked example', ask: 'یہ سوال پوچھیں', mistakes: 'Common mistakes',
    youAsk: 'You ask', guided: 'رہنمائی', wedo: 'مل کر کریں', together: 'We do · class practises together', setTask: 'Set the task going',
    say: 'استاد:', independent: 'خود کام', youdo: 'خود کریں', alone: 'You do · pupils work alone', answer: 'جواب',
    sample: 'نمونہ جواب', diff: 'انفرادی فرق کے مطابق', stuck: 'اگر بچے اٹک جائیں', early: 'اگر جلد فارغ ہو جائیں', exit: 'اختتامی پرچی',
    homework: 'Homework', homeworkPill: 'ہوم ورک', coaching: 'کوچنگ کارنر', askYourself: 'خود سے پوچھیے',
    coachSteps: ['اس سبق کی چالیس منٹ تک کی ریکارڈنگ بنائیے', 'واٹس ایپ پر نیٹ کو بھیجیے', 'اسی دن جواب: کیا اچھا رہا، اور ایک بات جو آزمانی ہے'],
    continued: 'جاری ہے', page: 'صفحہ {n} از {m}', min: '{n} منٹ', pp: 'صفحات', p: 'صفحہ',
    concept: 'بنیادی تصور', conceptPill: 'مقصد', pupilsWrite: 'طلبہ کیا لکھتے ہیں', remember: 'یاد رکھیں', rememberPill: 'اختتامی جانچ',
    lookFor: 'اس پر نظر رکھیے', support: 'حوالہ جاتی مواد', supportFollow: 'اگلے صفحات معاون مواد ہیں—یہ آپ کی تیاری کے لیے ہیں، کلاس میں پڑھ کر نہ سنائیں۔',
    keyFact: 'اہم بات', why: 'کیوں', journeyNone: 'آج نئی شروعات', moreDays: '+ اس باب کے مزید {n} دن',
  },
};

// ── TEXT ──────────────────────────────────────────────────────────────────────────────────
// A pause mark "⏸۲" in an Urdu lesson is a reading-pause sign with its number: drawn as a chip.
// A run of underscores is a blank to fill: drawn as a writing line of the same length.
function rich(text) {
  return esc(text)
    .replace(/⏸\s*([0-9۰-۹٠-٩]+)?/g, (_, n) => `<span class="q-pz"><i></i><i></i>${n ? `<b>${n}</b>` : ''}</span>`)
    .replace(/_{3,}/g, (m) => `<span class="q-blank" style="width:${Math.min(5, Math.max(1.6, m.length * 0.32)).toFixed(2)}em"></span>`)
    // a maths lesson names its place-value pieces in brackets ("[cube] = 1000"): drawn as the piece
    .replace(/\[(cube|flat|rod|dot|bigbundle|bundle|stick)\]/g, (_, k) => PV_ICON(k));
}
// A long paragraph in sentence groups of about `n` characters, so a page break can fall between
// two sentences rather than move the whole paragraph (and leave half a page empty).
function sentenceChunks(text, n = 170) {
  // a sentence ends at . ! ? ۔ ؟ followed by a space and a capital, a digit, a quote or Urdu —
  // not inside a quoted dictionary entry ("adjective. bright with sunlight")
  const parts = String(text).split(/(?<=[.!?۔؟])\s+(?=[A-Z0-9"“‘'(\u0600-\u06FF])/);
  const out = [];
  for (const p of parts) {
    if (out.length && out[out.length - 1].length < n) out[out.length - 1] += ` ${p}`;
    else out.push(p);
  }
  if (out.length > 1 && out[out.length - 1].length < 50) out[out.length - 2] += ` ${out.pop()}`;
  return out;
}
// pictures small enough to sit beside the text they belong to
const SIDE = ['clock', 'tiles', 'road_sign'];
const quoted = (line) => (/^[“"‘'(—–-]/.test(line.trim()) || /[“”]/.test(line) ? line : `“${line}”`);

function composePrimary(guide) {
  const lesson = guide.layout.lesson;
  const lang = lesson.lang === 'ur' ? 'ur' : 'en';
  const L = { ...LABELS[lang], ...(lesson.labels || {}) };
  const rtl = lang === 'ur';
  // the direction a piece of text reads in: an Urdu lesson's English-only lines read left to right
  const dir = (s) => (rtl ? (AR.test(String(s)) ? 'rtl' : 'ltr') : 'ltr');
  const T = (s, tag = 'span', cls = '') => `<${tag}${cls ? ` class="${cls}"` : ''} dir="${dir(s)}">${rich(s)}</${tag}>`;
  const lab = (s) => `<bdi dir="${AR.test(s) ? 'rtl' : 'ltr'}">${esc(s)}</bdi>`;
  // a paragraph as units a page break may fall between (sentence groups); `lead` opens the first
  const para = (text, cls = '', lead = '') => sentenceChunks(text).map((c, i) => `<div data-units>${i === 0 ? lead : ''}<div class="q-chunk${cls ? ` ${cls}` : ''}" dir="${dir(c)}">${rich(c)}</div></div>`).join('');
  const pill = (s, cls, icon = '') => (s ? `<span class="q-pill ${cls}">${icon ? `<span class="q-pill-ic">${icon}</span>` : ''}${lab(s)}</span>` : '');
  // the newer approved Urdu lessons print their numbers (grade, minutes, page and step numbers) in Urdu digits
  const N = (v) => (lesson.numerals === 'urdu' ? String(v).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[d]) : String(v));
  const minutes = (n) => (n ? L.min.replace('{n}', N(n)) : '');
  const ARROW = rtl ? '←' : '→';
  // AN ANSWER: a green tick badge (structure) before it; the answer's own words stay in plain ink.
  // Teachers asked that no word of a lesson be coloured: colour marks structure, never words.
  const answer = (a) => `<span class="q-ansgrp"><span class="q-ansb" aria-hidden="true">${ICON.check()}</span><b class="q-ans">${rich(a)}</b></span>`;
  // a labelled sub-line (listen for, if they struggle, why, how to run …): the label is a small
  // structure chip, the words stay ink
  const xline = (x) => `<div class="q-x" dir="${dir(x.text)}"><b class="q-xl">${lab(x.label)}</b> ${rich(x.text)}</div>`;
  const extras = (arr) => (arr || []).map(xline).join('');
  // journey / coming up: one line, or a list of days (the next three, then how many more)
  const dayList = (v, none) => {
    if (!Array.isArray(v)) return v ? T(v, 'div') : T(none, 'div');
    if (!v.length) return T(none, 'div');
    const item = (d) => (typeof d === 'string' ? T(d, 'span') : `<span dir="${dir(d.topic)}">${d.day != null ? `<b class="q-n">${esc(N(d.day))}</b> ` : ''}${rich(d.topic)}${d.pages ? ` <span class="q-ref">(${esc(L.p)} ${esc(d.pages)})</span>` : ''}</span>`);
    const shown = v.slice(0, 3);
    return `<ul class="q-mini">${shown.map((d) => `<li>${item(d)}</li>`).join('')}</ul>${v.length > 3 ? `<div class="q-more">${esc(L.moreDays.replace('{n}', N(v.length - 3)))}</div>` : ''}`;
  };
  const out = [];
  const add = (stage, html, attrs = '') => out.push(`<div class="q-blk"${stage ? ` data-stage="${stage}"` : ''}${attrs ? ` ${attrs}` : ''}>${html}</div>`);
  const counts = { visuals: 0 };
  const fig = (spec, cls = '') => {
    if (!spec) return '';
    counts.visuals += 1;
    if (spec.type === 'story_map') return storyMap(spec);
    if (spec.type === 'tracker') return tracker(spec);
    if (spec.type === 'deeds') return deeds(spec);
    if (spec.type === 'compare') return compare(spec);
    if (spec.type === 'flow') return flow(spec);
    return `<figure class="q-fig ${cls}">${draw(spec)}${spec.caption ? `<figcaption>${esc(spec.caption)}</figcaption>` : ''}</figure>`;
  };
  // the story map: the story's events as boxes in reading order, the pause signs between them
  // the story map: the story's events as numbered cards in reading order, the pause signs between them
  const storyMap = (spec) => {
    let ev = 0;
    return `<div class="q-story" dir="${rtl ? 'rtl' : 'ltr'}">${spec.items.map((it, i) => {
      const arrow = i === 0 ? '' : `<span class="q-arrow">${ARROW}</span>`;
      if (/^⏸/.test(it)) return `${arrow}${rich(it)}`;
      ev += 1;
      return `${arrow}<span class="q-ev q-ev${(ev - 1) % 5}"><b class="q-evn">${ev}</b>${rich(it)}</span>`;
    }).join('')}</div>`;
  };
  // a good-citizen chart: one card per deed, its picture and the lesson's words
  const deeds = (spec) => `<div class="q-deeds" dir="${rtl ? 'rtl' : 'ltr'}">${spec.items.map((d, i) => `<div class="q-deed q-deed${i % 6}">${DEED[d.icon] ? DEED[d.icon]() : ''}<span dir="${dir(d.text)}">${rich(d.text)}</span></div>`).join('')}</div>`;
  // a two-column comparison (e.g. religious festival | national festival), each column a card
  const compare = (spec) => `<div class="q-cmp" dir="${rtl ? 'rtl' : 'ltr'}">${spec.title ? T(spec.title, 'div', 'q-cmp-t') : ''}<div class="q-cmp-cols">${spec.columns.map((c, k) => `<div class="q-cmp-c q-cmp${k % 3}">${T(c.head, 'div', 'q-cmp-h')}${(c.lines || []).map((l) => T(l, 'div', 'q-cmp-l')).join('')}</div>`).join('')}</div>${spec.caption ? T(spec.caption, 'div', 'q-cmp-cap') : ''}</div>`;
  // a step-by-step flow: boxes joined by arrows in reading order
  const flow = (spec) => `<div class="q-flow" dir="${rtl ? 'rtl' : 'ltr'}">${spec.title ? T(spec.title, 'div', 'q-cmp-t') : ''}<div class="q-flow-row">${spec.items.map((it, k) => `${k ? `<span class="q-flow-ar"${spec.arrow ? '' : ' aria-hidden="true"'}>${spec.arrow ? `<small dir="${dir(spec.arrow)}">${esc(spec.arrow)}</small>` : ''}${ARROW}</span>` : ''}<div class="q-flow-b q-cmp${k % 3}">${T(it.head, 'div', 'q-cmp-h')}${(it.lines || []).map((l) => T(l, 'div', 'q-cmp-l')).join('')}</div>`).join('')}</div></div>`;
  const tracker = (spec) => `<table class="q-track" dir="${rtl ? 'rtl' : 'ltr'}"><thead><tr>${spec.columns.map((c, k) => `<th class="q-th${k % 3}">${rich(c)}</th>`).join('')}</tr></thead>`
    + `<tbody>${spec.rows.map((r) => `<tr>${spec.columns.map((_, k) => `<td>${rich(r[k] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

  // ── START ───────────────────────────────────────────────────────────────────────────────
  const subj = lesson.subject;
  const kicker = rtl ? `${L.grade} ${N(lesson.grade)} · ${subj.toUpperCase()}` : `Grade ${lesson.grade} · ${subj}`;
  const where = `${L.p}${rtl ? ' ' : ''}${N(lesson.pages)} · <b>${esc(minutes(lesson.period_minutes))}</b>`;
  add('start', `<header class="q-hero"><div class="q-hero-top"><span class="q-kick">${lab(kicker)}</span><span class="q-where">${where}</span></div>`
    + `<div class="q-hero-main"><div class="q-hero-text">${T(lesson.title, 'h1')}${T(lesson.chapter, 'div', 'q-chap')}</div>`
    + `${lesson.hero_visual ? `<div class="q-hero-badge">${heroBadge(lesson.hero_visual)}</div>` : ''}</div></header>`);
  const day = lesson.day || {};
  if (day.of) {
    add('start', `<div class="q-steps">${Array.from({ length: day.of }, (_, i) => i + 1)
      .map((n) => `<span class="q-step${n === day.n ? ' on' : n < day.n ? ' done' : ''}">${N(n)}${n < day.n ? '<i class="q-tick">✓</i>' : ''}</span>`).join('')}</div>`);
  }
  add('start', `<div class="q-today"><div class="q-cap">${ICON.sun()} ${lab(L.today)}</div>${T(lesson.title, 'div', 'q-today-t')}${lesson.today_note ? T(lesson.today_note, 'div', 'q-today-n') : ''}</div>`);
  add('start', `<div class="q-two"><div class="q-journey"><div class="q-cap">${ICON.steps()} ${lab(L.journey)}</div>${Array.isArray(lesson.journey) || !lesson.journey ? dayList(lesson.journey, L.journeyNone) : T(lesson.journey, 'div')}</div>`
    + `<div class="q-coming"><div class="q-cap">${ICON.next()} ${lab(L.coming)}</div>${Array.isArray(lesson.coming_up) ? dayList(lesson.coming_up, '') : T(lesson.coming_up, 'div')}</div></div>`);
  add('start', `<div class="q-outcome"><div class="q-cap">${ICON.target()} ${lab(L.outcome)}${lesson.outcome.code ? ` · <bdi dir="ltr">${esc(lesson.outcome.code)}</bdi>` : ''}</div>${lesson.outcome.text ? T(lesson.outcome.text, 'div', 'q-outcome-t') : ''}`
    + `${(lesson.outcome.items || []).length ? `<ul class="q-dots q-outl">${lesson.outcome.items.map((it) => `<li>${T(it, 'span', 'q-outcome-t')}</li>`).join('')}</ul>` : ''}</div>`);
  add('start', `<div class="q-prepare"><div class="q-cap">${ICON.bag()} ${lab(L.prepare)}</div><ul class="q-checks">${lesson.prepare.map((p) => `<li>${T(p)}</li>`).join('')}</ul></div>`);
  if (lesson.video) {
    add('start', `<div class="q-video"><div class="q-video-h">${ICON.tv()}<span class="q-cap">${lab(L.video)}</span> ${T(lesson.video.title, 'span', 'q-video-t')}</div>${T(lesson.video.note, 'div', 'q-video-n')}</div>`);
  }
  if (lesson.keywords.length) add('start', `<div class="q-kw"><div class="q-kw-h" data-first-only>${ICON.key()}<span class="q-cap">${lab(L.keywords)}</span></div>`
    + `<div class="q-kw-t units">${lesson.keywords.map((k) => `<div class="q-kw-r" data-units>${k.local || k.note ? `<div class="q-kw-w">${T(k.word, 'div')}${k.local ? T(k.local, 'div', 'q-kw-loc') : ''}${k.note ? T(k.note, 'div', 'q-kw-note') : ''}</div>` : T(k.word, 'div', 'q-kw-w')}${T(k.meaning, 'div', 'q-kw-m')}</div>`).join('')}</div></div>`, 'data-split');
  if (lesson.board.length) add('start', `<div class="q-board"><div class="q-board-h" data-first-only>${ICON.board()} ${lab(L.board)}</div><div class="q-board-b units">${lesson.board.map((b, i) => {
    // an English line that carries Urdu words (a bilingual glossary) gets Nastaliq's taller line
    const lines = b.drawn ? [] : b.lines.map((l) => T(l, 'div', !rtl && AR.test(l) ? 'q-board-l q-mix' : 'q-board-l'));
    // the picture goes where the approved board has it: first, or after its first `visual_after` lines
    lines.splice(b.visual_after || 0, 0, fig(b.visual, 'q-fig-board'));
    return `<div class="q-panel" data-units><span class="q-panel-n">${N(i + 1)}</span><div class="q-panel-b">${b.title ? T(b.title, 'div', 'q-panel-t') : ''}${b.note ? T(b.note, 'div', 'q-board-note') : ''}${lines.join('')}</div></div>`;
  }).join('')}</div></div>`, 'data-split');
  // the board as it should look at the end of the lesson (the newer approved lessons): its own card
  if (lesson.board_end) {
    add('start', `<div class="q-lbl">${ICON.board()} ${lab(lesson.board_end.label)}</div>`, 'data-keep');
    add('start', `<div class="q-figcard">${lesson.board_end.note ? T(lesson.board_end.note, 'div', 'q-board-note') : ''}${fig(lesson.board_end.visual, 'q-fig-card')}</div>`);
  }

  // ── STAGES ──────────────────────────────────────────────────────────────────────────────
  const STAGE_CLS = { opening: 'op', explanation: 'ex', we_do: 'wd', you_do: 'yd', check: 'ck', homework: 'hw' };
  for (const st of lesson.stages) {
    const sid = st.id;
    const bar = `<div class="q-bar q-bar-${STAGE_CLS[sid]}"><span class="q-bar-l">${esc(st.letter)}</span><span class="q-bar-name">${lab(st.label)}</span><span class="q-bar-ic">${stageIcon(sid)}</span>`
      + `<span class="q-bar-end">${st.minutes ? `<span class="q-bar-min">${esc(minutes(st.minutes))}</span>` : ''}${st.mode ? pill(st.mode, 'amber') : ''}</span></div>`;
    add(sid, bar, 'data-bar data-keep');
    const blocks = st.blocks;
    for (let bi = 0; bi < blocks.length; bi++) {
      const b = blocks[bi];
      const next = blocks[bi + 1];
      const askAfter = next && next.type === 'ask_this' ? next : null;
      const askBody = (a) => (a.items ? `<ul class="q-dots">${a.items.map((l) => `<li>${typeof l === 'string' ? T(l) : `${T(l.q)}${extras(l.extras)}`}</li>`).join('')}</ul>` : T(a.text, 'div'));
      const askHtml = askAfter ? `<div class="q-ask"><div class="q-cap">${ICON.question()} ${lab(L.ask)}</div>${askBody(askAfter)}</div>` : '';
      switch (b.type) {
        case 'warmup':
          add(sid, `<div class="q-warm"><div class="q-lbl" data-first-only>${ICON.warmup()} ${lab(L.warmup)}</div><div class="units">${b.items.map((it, i) => `<div class="q-wi" data-units>`
            + `<span dir="${dir(it.q)}"><b class="q-n">${N(i + 1)}.</b> ${rich(it.q)}${it.a ? ` ${answer(it.a)}` : ''}</span>${extras(it.extras)}${it.tag ? `<span class="q-tag">${esc(it.tag)}</span>` : ''}</div>`).join('')}</div></div>`, 'data-split');
          break;
        case 'setup':
          add(sid, `<div class="q-lbl">${ICON.setup()} ${lab(L.setup)}</div>`, 'data-keep');
          add(sid, `<ul class="q-dots">${b.lines.map((l) => `<li>${T(l)}</li>`).join('')}</ul>`);
          break;
        case 'hook':
          add(sid, `<div class="q-hook"><div class="units">${para(b.text, 'q-hook-t', `${b.visual ? fig(b.visual, 'q-fig-hook') : ''}<div class="q-hook-h"><span class="q-cap">${ICON.question()} ${lab(L.hook)}</span>${pill(L.hookPill, 'line-l')}</div>`)}${b.extras ? `<div data-units>${extras(b.extras)}</div>` : ''}</div></div>`, 'data-split');
          break;
        case 'read_aloud': {
          add(sid, `<div class="q-lbl">${ICON.book()} ${lab(b.label)}</div>`, 'data-keep');
          const speakers = [];
          add(sid, `<div class="q-read">${b.lines.map((l) => {
            const m = /^([^:“"]{1,40}):\s*(.+)$/.exec(l);
            if (!m) return `<ul class="q-dots"><li dir="${dir(l)}">${rich(l)}</li></ul>`;
            let k = speakers.indexOf(m[1]); if (k < 0) { speakers.push(m[1]); k = speakers.length - 1; }
            return `<div class="q-say" dir="${dir(l)}">${face(k, (lesson.speakers || {})[m[1]])}<div class="q-bub"><b class="q-who">${esc(m[1])}</b>${rich(m[2])}</div></div>`;
          }).join('')}${b.visual ? fig(b.visual, 'q-fig-read') : ''}</div>`);
          break;
        }
        case 'teacher_models': {
          const inWeDo = sid === 'we_do';
          const pills = (arr, last) => (arr || []).map((t, k, all) => pill(t, k === all.length - 1 ? last : 'line')).join('');
          const head = b.head
            ? `<div class="q-card-h" data-first-only>${pill(b.head, `${inWeDo ? 'blue' : 'amber'} big`, inWeDo ? ICON.group() : ICON.teach())}<span class="q-pills">${pills(b.pills, inWeDo ? 'blue' : 'amber')}</span></div>`
            : inWeDo
              ? `<div class="q-card-h" data-first-only><span class="q-pills">${pill(L.guided, 'line')}${pill(L.wedo, 'blue')}</span></div>`
              : `<div class="q-card-h" data-first-only>${pill(L.teacherModels, 'amber big', ICON.teach())}<span class="q-pills">${pill(L.explain, 'line')}${pill(L.ido, 'amber')}</span></div>`;
          const units = [];
          // We Do: the together lines, then the model, then the sentence frames — one card, as approved
          const prevTogether = inWeDo ? blocks.find((x) => x.type === 'together') : null;
          if (prevTogether) {
            if (!b.head) units.push(`<div class="q-sub" data-units>${pill(L.together, 'blue big', ICON.group())}</div>`);
            for (const l of prevTogether.lines) units.push(`<div data-units><ul class="q-dots">${`<li>${T(l)}</li>`}</ul></div>`);
          }
          const instr = (t) => units.push(`<div class="q-instr" data-units dir="${dir(t)}"><span class="q-instr-m" aria-hidden="true"></span>${rich(t)}</div>`);
          if (b.seq) {
            // the card's lines in the order the approved page gives them
            for (const it of b.seq) {
              if (it.k === 'instr') instr(it.t);
              else if (it.k === 'quote') units.push(`<div class="q-line" data-units dir="${dir(it.t)}">${rich(quoted(it.t))}</div>`);
              else if (it.k === 'think') units.push(`<div class="q-lead" data-units dir="${dir(it.t)}">${rich(it.t)}</div>`);
              else if (it.k === 'frame') units.push(`<div class="q-frame" data-units dir="${dir(it.t)}">${ICON.bubble()}<span>${rich(it.t)}</span></div>`);
              else if (it.k === 'bullet') units.push(`<div data-units><ul class="q-dots"><li>${T(it.t)}</li></ul></div>`);
              else if (it.k === 'visual') units.push(`<div data-units>${fig(it.v, 'q-fig-tm')}</div>`);
              else if (it.k === 'local') units.push(`<div class="q-line q-local" data-units dir="${dir(it.t)}">${rich(quoted(it.t))}</div>`);
              else throw new Error(`primary page: no layout for a teacher-models line of kind "${it.k}"`);
            }
          } else instr(b.instruction);
          if (b.visual) units.push(`<div data-units>${fig(b.visual, 'q-fig-tm')}</div>`);
          const quote = (arr) => (arr || []).forEach((l) => units.push(`<div class="q-lead" data-units dir="${dir(l)}">${rich(l)}</div>`));
          const script = (arr) => (arr || []).forEach((l) => units.push(`<div class="q-line" data-units dir="${dir(l)}">${rich(quoted(l))}</div>`));
          if (!b.seq) { quote(b.lead); script(b.script); quote(b.lead2); }
          // a second teacher instruction in the same card (the approved pages print it with the same ▸)
          if (b.instruction2) units.push(`<div class="q-instr" data-units dir="${dir(b.instruction2)}"><span class="q-instr-m" aria-hidden="true"></span>${rich(b.instruction2)}</div>`);
          if (!b.seq) script(b.script2);
          const frames = inWeDo ? blocks.find((x) => x.type === 'frames') : null;
          if (frames) for (const f of frames.lines) units.push(`<div class="q-frame" data-units dir="${dir(f)}">${ICON.bubble()}<span>${rich(f)}</span></div>`);
          if (askAfter) units.push(`<div data-units>${askHtml}</div>`);
          add(sid, `<div class="q-card ${inWeDo ? 'q-card-wd' : 'q-card-tm'}">${head}<div class="units">${units.join('')}</div></div>`, 'data-split');
          if (askAfter) bi += 1;
          break;
        }
        case 'together': case 'frames':
          if (sid === 'we_do' && blocks.some((x) => x.type === 'teacher_models')) break;   // drawn inside the We Do card
          add(sid, `<ul class="q-dots">${(b.lines || []).map((l) => `<li>${T(l)}</li>`).join('')}</ul>`);
          break;
        case 'worked': {
          const wd = sid === 'we_do';
          add(sid, `<div class="q-card ${wd ? 'q-card-wd' : 'q-card-tm'}"><div class="q-card-h" data-first-only>${pill(b.label || L.worked, `${wd ? 'blue' : 'amber'} big`, ICON.pencil())}<span class="q-pills">${pill(wd ? L.wedo : L.ido, wd ? 'blue' : 'amber')}</span></div>`
            + `<div class="units">${b.problem ? `<div class="q-wprob" data-units dir="${dir(b.problem)}">${rich(b.problem)}</div>` : ''}`
            + `${b.numbered === false ? b.steps.map((s) => `<div class="q-wstep" data-units dir="${dir(s)}">${rich(s)}</div>`).join('')
              : b.steps.length > 1 ? b.steps.map((s, i) => `<div class="q-wstep" data-units dir="${dir(s)}"><b class="q-n">${N(i + 1)}.</b> ${rich(s)}</div>`).join('')
                : para(b.steps[0], 'q-wstep')}`
            + `${b.visual ? `<div data-units>${fig(b.visual, 'q-fig-worked')}</div>` : ''}${b.answer ? `<div class="q-wans" data-units dir="${dir(b.answer)}">${answer(b.answer)}</div>` : ''}`
            + `${askAfter ? `<div data-units>${askHtml}</div>` : ''}</div></div>`, 'data-split');
          if (askAfter) bi += 1;
          break;
        }
        case 'ask_this':
          add(sid, `<div class="q-card q-card-tm">${askHtml || `<div class="q-ask"><div class="q-cap">${ICON.question()} ${lab(L.ask)}</div>${askBody(b)}</div>`}</div>`);
          break;
        case 'mistakes':
          add(sid, `<div class="q-lbl">${ICON.warn()} ${lab(L.mistakes)}</div>`, 'data-keep');
          add(sid, b.items.map((m) => (m.pupil_says
            ? `<div class="q-mis2"><div class="q-mis2-q"><div class="q-cap">✗ ${lab(L.pupilsWrite)}</div>${T(m.pupil_says, 'div')}${m.why ? xline({ label: L.why, text: m.why }) : ''}</div><div class="q-mis2-a"><div class="q-cap">✓ ${lab(L.youAsk)}</div>${T(m.you_ask, 'div')}</div></div>`
            : `<div class="q-mis"><div class="q-cap">✓ ${lab(L.youAsk)}</div>${T(m.you_ask, 'div')}</div>`)).join(''));
          break;
        case 'concept':
          add(sid, `<div class="q-concept"><div class="q-concept-h"><span class="q-cap">${ICON.bulb()} ${lab(L.concept)}</span>${pill(L.conceptPill, 'line')}</div>`
            + `${b.items.map((it) => `<div class="q-concept-i" dir="${dir(it.text)}">${it.lead ? `<b class="q-concept-l">${rich(it.lead)}</b> ` : ''}${rich(it.text)}</div>`).join('')}</div>`);
          break;
        case 'key_fact':
          add(sid, `<div class="q-keyfact"><div class="q-cap">${ICON.bulb()} ${lab(L.keyFact)}</div>${b.lines.map((l) => T(l, 'div', 'q-keyfact-t')).join('')}</div>`);
          break;
        case 'remember':
          add(sid, `<div class="q-lbl q-lbl-pills"><span>${ICON.star()} ${lab(L.remember)}</span><span class="q-pills">${pill(L.rememberPill, 'line')}</span></div>`, 'data-keep');
          add(sid, `<ul class="q-dots">${b.lines.map((l) => `<li>${T(l)}</li>`).join('')}</ul>`);
          break;
        case 'figure':
          // a chart of its own (the approved pages' "comparison" and "step by step" cards), its name on a pill
          add(sid, `<div class="q-figcard"><div class="q-card-h">${pill(b.label, 'navy big')}</div>${fig(b.visual, 'q-fig-card')}</div>`);
          break;
        case 'halfway':
          add(sid, `<div class="q-half" dir="${dir(b.text)}">${ICON.clock()}<span>${rich(b.text)}</span></div>`);
          break;
        case 'set_task':
          add(sid, `<div class="q-lbl q-lbl-pills"><span>${ICON.flag()} ${lab(L.setTask)}</span><span class="q-pills">${pill(L.independent, 'line')}${pill(L.youdo, 'green')}</span></div>`, 'data-keep');
          add(sid, `<ul class="q-dots">${b.lines.map((l) => `<li>${T(l)}</li>`).join('')}${b.say ? `<li dir="${dir(b.say)}"><b class="q-sayl">${esc(L.say)}</b> ${rich(quoted(b.say))}</li>` : ''}</ul>`);
          if (b.visual) add(sid, fig(b.visual, 'q-fig-task'));
          break;
        case 'alone':
          add(sid, `<div class="q-card q-card-yd">${b.head
            ? `<div class="q-card-h" data-first-only>${pill(b.head, 'green big', ICON.pencil())}<span class="q-pills">${(b.pills || []).map((t, k, all) => pill(t, k === all.length - 1 ? 'green' : 'line')).join('')}</span></div>`
            : `<div class="q-card-h" data-first-only><span class="q-pills">${pill(L.independent, 'line')}${pill(L.youdo, 'green')}</span></div><div class="q-sub" data-first-only>${pill(L.alone, 'green big', ICON.pencil())}</div>`}<div class="units">${b.items.map((it, i) => {
              const ref = it.ref ? `<span class="q-ref">${rich(it.ref)}</span>` : '';
              // a small picture sits beside its question; a wide one (a road of cars, a signboard) goes under it
              const side = it.visual && SIDE.includes(it.visual.type);
              const pic = side ? `<div class="q-ifig">${draw(it.visual)}</div>` : '';
              const wide = it.visual && !side ? fig(it.visual, 'q-fig-item') : '';
              if (side) counts.visuals += 1;
              const ans = it.answer ? `<div class="q-a" dir="${dir(it.answer)}"><b class="q-cap q-a-cap"><span class="q-ansb" aria-hidden="true">${ICON.check()}</span>${lab(it.sample ? L.sample : L.answer)}</b> ${rich(it.answer)}</div>` : '';
              return `<div class="q-item${pic ? ' has-fig' : ''}" data-units><div class="q-item-q" dir="${dir(it.q)}"><b class="q-n">${N(i + 1)}.</b> ${it.label ? `<b class="q-xl">${lab(it.label)}</b> ` : ''}${rich(it.q)} ${ref}</div>${pic}${wide}${ans}${extras(it.extras)}</div>`;
            }).join('')}</div></div>`, 'data-split');
          break;
        case 'differentiation':
          add(sid, `<div class="q-lbl">${ICON.star()} ${lab(L.diff)}</div>`, 'data-keep');
          const diffBody = (v, cap) => (Array.isArray(v)
            ? `<div data-units>${cap}</div>${v.map((l) => `<div data-units><ul class="q-dots"><li>${typeof l === 'string' ? T(l) : `${T(l.q)}${l.answer ? `<div class="q-wans">${answer(l.answer)}</div>` : ''}${extras(l.extras)}`}</li></ul></div>`).join('')}`
            : para(v, '', cap));
          add(sid, `<div class="q-diff q-stuck"><div class="units">${diffBody(b.stuck, `<div class="q-cap">${ICON.help()} ${lab(L.stuck)}</div>`)}</div></div>`, 'data-split');
          add(sid, `<div class="q-diff q-early"><div class="units">${diffBody(b.early, `<div class="q-cap">${ICON.star()} ${lab(L.early)}</div>`)}${b.early_visual ? `<div data-units>${fig(b.early_visual, 'q-fig-early')}</div>` : ''}</div></div>`, 'data-split');
          break;
        case 'exit':
          // a small picture (a clock, letter tiles) sits beside its question; a scene goes under it
          add(sid, `<div class="q-exit"><div class="q-cap">${ICON.ticket()} ${lab(L.exit)}</div>${b.items.map((it, i) => {
            const side = it.visual && SIDE.includes(it.visual.type);
            const rich2 = it.local || it.choices || it.extras;
            const text = rich2
              ? `<div class="q-exit-o"><div class="q-exit-i" dir="${dir(it.q)}"><b class="q-n">${N(i + 1)}.</b> ${rich(it.q)}</div>${it.local ? `<div class="q-local" dir="${dir(it.local)}">${rich(it.local)}</div>` : ''}`
                + `${it.choices ? `<div class="q-choices">${it.choices.map((c, k) => `<span class="q-choice" dir="${dir(c)}"><b>${'ABCDEFGH'[k]}.</b> ${rich(c)}</span>`).join('')}</div>` : ''}`
                + `<div class="q-wans">${answer(it.criterion)}</div>${extras(it.extras)}</div>`
              : `<div class="q-exit-i" dir="${dir(it.q)}"><b class="q-n">${N(i + 1)}.</b> ${rich(it.q)} ${answer(it.criterion)}</div>`;
            if (side) { counts.visuals += 1; return `<div class="q-exit-row">${text}<div class="q-ifig">${draw(it.visual)}</div></div>`; }
            return text + (it.visual ? fig(it.visual, 'q-fig-exit') : '');
          }).join('')}${b.extras ? `<div class="q-exit-x">${extras(b.extras)}</div>` : ''}</div>`);
          break;
        case 'homework':
          add(sid, `<div class="q-lbl q-lbl-pills"><span>${ICON.house()} ${lab(L.homework)}</span>${L.homeworkPill ? `<span class="q-pills">${pill(L.homeworkPill, 'line')}</span>` : ''}</div>`, 'data-keep');
          add(sid, `<ul class="q-dots">${b.lines.map((l) => `<li>${T(l)}</li>`).join('')}</ul>`);
          break;
        default:
          throw new Error(`primary page: no layout for block type "${b.type}"`);
      }
    }
  }
  // ── COACHING CORNER ─────────────────────────────────────────────────────────────────────
  const steps = L.coachSteps.map((s, i) => `<div class="q-cstep">${[ICON.mic(), ICON.chat(), ICON.reply()][i]}<b>${N(i + 1)}</b><span>${lab(s)}</span></div>`).join('');
  const ask = sentenceChunks(lesson.coaching.ask_yourself);
  const look = lesson.coaching.look_for ? `<div data-units><div class="q-cap">${ICON.mic()} ${lab(L.coaching)}</div><b class="q-cap q-ay">${lab(L.lookFor)}</b><div dir="${dir(lesson.coaching.look_for)}">${rich(lesson.coaching.look_for)}</div></div>` : '';
  add('close', `<div class="q-coach"><div class="units">${look}${ask.map((c, i) => `<div data-units>${i === 0 && !look ? `<div class="q-cap">${ICON.mic()} ${lab(L.coaching)}</div>` : ''}<div dir="${dir(c)}">${i === 0 ? `<b class="q-cap q-ay">${lab(L.askYourself)}</b> ` : ''}${rich(c)}</div></div>`).join('')}`
    + `<div class="q-csteps" data-units>${steps}</div></div></div>`);   // the corner stays whole: its steps never sit alone on a last page
  // THE TEACHER-SUPPORT PAGES (newer approved lessons): the homework answered in full, on a page of their own
  if (lesson.support) {
    add('close', `<div class="q-follow" dir="${dir(L.supportFollow)}">${esc(L.supportFollow)}</div>`);
    const kick = rtl ? `${L.grade} ${N(lesson.grade)} ${subj} · ${L.p} ${N(lesson.pages)}` : `Grade ${lesson.grade} ${subj} · ${L.p} ${lesson.pages}`;
    add('support', `<div class="q-p2"><div class="q-p2r"><span class="q-pill navy big">${ICON.clipboard()}${lab(L.support)}</span><span class="q-p2k">${lab(kick)}</span></div>${T(lesson.title, 'div', 'q-p2-t')}</div>`, 'data-newpage data-keep');
    lesson.support.sections.forEach((sec, si) => {
      add('support', `<div class="q-p2h"><b class="q-p2l">${esc(sec.letter || String.fromCharCode(65 + si))}</b>${T(sec.heading, 'span', 'q-p2n')}</div>`, 'data-keep');
      for (const it of sec.items) add('support', `<div class="q-key">${it.label ? T(it.label, 'div', 'q-key-l') : ''}${T(it.q, 'div', 'q-key-q')}${T(it.a, 'div', 'q-key-a')}</div>`);
    });
  }

  // the page chrome the page printer clones onto every page
  const footLine = rtl
    ? `${L.grade} ${N(lesson.grade)} · ${subj} · ${lesson.chapter} · ${L.pp} ${N(lesson.pages)}`
    : `Grade ${lesson.grade} ${subj} · ${lesson.chapter} · ${L.pp} ${lesson.pages}`;
  const chrome = `<div class="q-chrome" hidden><div class="q-run"><b dir="${dir(lesson.title)}">${esc(lesson.title)}</b><span class="q-run-c">· ${lab(L.continued)}</span></div>`
    + `<footer class="q-foot"><div dir="${dir(footLine)}">${esc(footLine)}</div><div class="q-pno"></div></footer></div>`;
  const bodyHtml = `<div class="ictq" lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}" data-pno="${esc(L.page)}" data-cont="${esc(L.continued)}"${lesson.numerals === 'urdu' ? ' data-digits="urdu"' : ''}>`
    + `<div class="q-src">${out.join('')}</div>${chrome}</div>`;
  return { headerHtml: '', bodyHtml, headCss: PRIMARY_CSS(), pageLayout: { width: 520, height: 2000, flow: true }, counts };
}

// ── STYLE ─────────────────────────────────────────────────────────────────────────────────
// Sizes measured from the approved pages (390×1500 pt = 520×2000 px): body 21 px Inter, labels
// 16 px caps, title 32 px, 21 px side margins; colours sampled from their pixels.
const FONTS = path.join(__dirname, '..', '..', '..', '..', 'node_modules', '@fontsource', 'inter', 'files');
function interFaces() {
  return [400, 500, 600, 700, 800].map((w) => {
    const f = path.join(FONTS, `inter-latin-${w}-normal.woff2`);
    return fs.existsSync(f) ? `@font-face{font-family:'Inter';font-weight:${w};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${fs.readFileSync(f).toString('base64')}) format('woff2');}` : '';
  }).join('');
}
let _css = null;
const PRIMARY_CSS = () => (_css || (_css = interFaces() + `
.sheet{width:520px;padding:0}
.ictq{--navy:${C.navy};--green:${C.green};--mint:${C.mint};--mint-bd:#CFEEDC;--grey:#EDEFF3;--grey-bd:#DFE3EA;--amber:${C.amber};
  --outcome:#FDEBC8;--cream:${C.cream};--cream-bd:#F5E6C4;--teal:${C.teal};--blue:${C.blue};--blue-bar:#426D9A;--sky:#F0F4FA;--sky-bd:#C9D6E8;
  --yd:#3D8D67;--purple:${C.purple};--slate:${C.slate};--ink:#1F2433;--mut:#5B6472;--gtext:#1E6B45;
  font-family:'Inter','Noto Nastaliq Urdu',sans-serif;color:var(--ink);font-size:21px;line-height:1.55;font-weight:400;text-align:start}
.ictq *{box-sizing:border-box}
.ictq :where(b){color:inherit;font-weight:700}
.ictq ul{list-style:none;margin:0;padding:0}
.ictq[dir="rtl"],.ictq :where([dir="rtl"]){font-family:'Noto Nastaliq Urdu','Inter',sans-serif;line-height:2.05}
.ictq :where([dir="ltr"]){font-family:'Inter','Noto Nastaliq Urdu',sans-serif;line-height:1.55}
.ictq :where(bdi[dir="ltr"]){line-height:inherit}
.ictq .q-src{display:flex;flex-direction:column;gap:10px;padding:16px 21px}
.ictq .q-chrome[hidden]{display:none}
.ictq .qart{display:block;width:100%;height:auto}
.ictq .qic{display:inline-block;width:22px;height:22px;vertical-align:-4px;flex:none}
/* ── the book of pages (built by the page printer) ── */
.q-book{display:flex;flex-direction:column;align-items:center;gap:26px;padding:26px 0}
html.lp-print .q-book{gap:0;padding:0}
.qpg{width:520px;height:2000px;background:#fff;display:flex;flex-direction:column;padding:16px 21px 0;overflow:hidden;position:relative}
html:not(.lp-print) .qpg{box-shadow:0 0 0 1px #d9dbe1,0 6px 20px rgba(30,32,48,.08)}
.qpg.q-grow{height:auto}
.q-body{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:10px}
.q-run{display:flex;gap:6px;align-items:baseline;font-size:16px;line-height:1.4;padding:4px 0 8px;border-bottom:2px solid var(--grey);margin-bottom:12px;white-space:nowrap}
.q-run b{font-family:'Inter','Noto Nastaliq Urdu',sans-serif;overflow:hidden;text-overflow:ellipsis;color:var(--navy);min-width:0}
.ictq[dir="rtl"] .q-run b{font-family:'Noto Nastaliq Urdu',sans-serif;line-height:2}
.q-run-c{color:var(--mut);flex:none}
.q-foot{flex:none;border-top:1.5px solid var(--grey);margin-top:10px;padding:8px 0 14px;font-size:15px;line-height:1.5;color:var(--mut)}
.ictq[dir="rtl"] .q-foot{line-height:1.9}
/* ── start ── */
.q-hero{background:var(--navy);color:#fff;border-radius:10px;padding:12px 14px 12px}
.q-hero-top{display:flex;justify-content:space-between;align-items:baseline;gap:10px;font-size:16px;line-height:1.3}
.q-kick{color:var(--amber);font-weight:700;letter-spacing:.12em;text-transform:uppercase}
.q-where{color:#C9CDD8}.q-where b{color:#fff}
.q-hero-main{display:flex;gap:12px;align-items:center;margin-top:4px}
.q-hero-text{flex:1;min-width:0}
.q-hero h1{font-size:32px;line-height:1.12;font-weight:700;margin:0;color:#fff}
.q-hero h1[dir="rtl"]{font-size:30px;line-height:1.85;font-weight:700}
.q-chap{color:#C9CDD8;font-size:17px;margin-top:6px;line-height:1.35}
.q-chap[dir="rtl"]{line-height:1.9}
.q-hero-badge{flex:none;width:108px;height:108px;border-radius:50%;overflow:hidden;background:#fff;border:4px solid var(--amber);box-shadow:0 0 0 5px rgba(255,255,255,.14),0 0 0 10px rgba(254,202,87,.22)}
.q-hero-badge svg{display:block;width:100%;height:100%}
.q-steps{display:flex;flex-wrap:wrap;gap:6px}
.q-step{width:36px;height:36px;border-radius:50%;background:#E5E9F0;color:#4B5263;font-size:16px;font-weight:600;display:flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif}
.q-step.on{background:var(--green);color:#fff;font-weight:700;font-size:18px}
.q-step.done{background:var(--mint);color:var(--green);box-shadow:inset 0 0 0 1.5px var(--mint-bd)}
.q-step{position:relative}
.q-tick{position:absolute;top:-5px;inset-inline-end:-4px;width:17px;height:17px;border-radius:50%;background:var(--green);color:#fff;font-size:10px;font-style:normal;font-weight:800;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 2px #fff}
.q-step.on{box-shadow:0 0 0 3px #FECA57}
.q-cap{font-family:'Inter','Noto Nastaliq Urdu',sans-serif;font-size:16px;line-height:1.35;font-weight:700;letter-spacing:.09em;text-transform:uppercase}
.q-cap bdi[dir="rtl"],.q-cap[dir="rtl"]{letter-spacing:0;font-size:18px;line-height:1.9}
.q-today{background:var(--green);color:#fff;border-radius:10px;padding:10px 14px 12px}
.q-today .q-cap{color:#FFD36B}
.q-today-t{font-size:25px;line-height:1.3;font-weight:700}
.q-today-t[dir="rtl"]{line-height:1.9}
.q-two{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.q-journey{background:var(--mint);border:1.5px solid var(--mint-bd);border-radius:9px;padding:9px 12px;color:var(--ink)}
.q-coming{background:var(--grey);border:1.5px solid var(--grey-bd);border-radius:9px;padding:9px 12px;color:var(--ink)}
.q-journey .q-cap{color:var(--gtext)}.q-coming .q-cap{color:#4B5263}
.q-outcome{background:var(--outcome);border-radius:9px;border-inline-start:6px solid var(--amber);padding:10px 14px 12px;color:var(--ink)}
.q-outcome .q-cap{color:#8A5A00}
.q-outcome-t{font-weight:600}
.q-prepare{background:var(--mint);border:1.5px solid var(--mint-bd);border-radius:9px;padding:10px 14px 12px;color:var(--ink)}
.q-prepare .q-cap{color:var(--gtext);margin-bottom:4px}
.q-checks{display:flex;flex-wrap:wrap;gap:4px 16px;font-weight:600}
.q-checks li{position:relative;padding-inline-start:28px}
.q-checks li::before{content:"";position:absolute;inset-inline-start:0;top:.42em;width:17px;height:17px;border:2.5px solid var(--green);border-radius:6px;background:#fff}
.q-checks li[dir="rtl"]::before,.q-checks li > [dir="rtl"]{}
.ictq[dir="rtl"] .q-checks li::before{top:.7em}
.q-video{background:var(--cream);border:1.5px solid var(--cream-bd);border-radius:9px;padding:10px 14px 12px;color:var(--ink)}
.q-video-h{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.q-video-h .qic{width:26px;height:26px;vertical-align:-6px;align-self:center}
.q-video-h .q-cap{color:#8A5A00}
.q-video-t{text-decoration:underline;text-underline-offset:3px}
.q-video-n{font-style:italic;font-size:19px;line-height:1.5;margin-top:4px}
.q-kw{background:var(--grey);border-radius:9px;padding:10px 14px 14px}
.q-kw-h{display:flex;align-items:center;gap:8px;margin-bottom:8px}.q-kw-h .q-cap{color:#4B5263}
.q-kw-h .qic{width:26px;height:26px}
.q-kw-t{display:flex;flex-direction:column;border-radius:6px;overflow:hidden;background:#fff}
.q-kw-r{display:grid;grid-template-columns:44% 56%;border-bottom:1px solid var(--grey-bd)}
.q-kw-r:last-child{border-bottom:0}
.q-kw-w{background:#F5F6F9;font-weight:700;padding:7px 12px;color:var(--navy)}
.q-kw-m{padding:7px 12px}
.cont-card .q-kw-t{margin-top:0}
.q-board{border:2.5px solid var(--navy);border-radius:10px;overflow:hidden;background:#fff}
.q-board-h{background:var(--navy);color:#FFD36B;font-size:16px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;padding:5px 14px;font-family:'Inter','Noto Nastaliq Urdu',sans-serif}
.q-board-h bdi[dir="rtl"]{letter-spacing:0;font-size:18px;line-height:1.9}
.q-board-b{display:flex;flex-direction:column;gap:10px;padding:10px 10px 12px}
.q-panel{display:flex;gap:10px;align-items:stretch}
.q-panel-n{flex:none;width:24px;border-radius:12px;background:var(--navy);color:#fff;font-size:14px;font-weight:700;text-align:center;padding-top:4px;font-family:'Inter',sans-serif}
.q-panel-b{flex:1;min-width:0}
.q-panel-t{font-weight:800;letter-spacing:.04em;text-transform:uppercase;font-size:18px;color:var(--navy);margin-bottom:4px}
.q-panel-t[dir="rtl"]{text-transform:none;letter-spacing:0;font-size:20px}
.q-board-l{font-weight:600}
.q-fig{margin:4px 0}
.q-fig .qart[aria-label^="clock"]{max-width:210px;margin:0 auto}
.q-fig figcaption{font-size:16px;font-weight:700;color:var(--mut);text-align:center;margin-top:2px}
/* ── stage bars ── */
.q-bar{display:flex;align-items:center;gap:10px;border-radius:8px;color:#fff;padding:3px 12px;min-height:40px;font-size:21px;font-weight:700;line-height:1.3}
.q-bar-l{flex:none;width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.28);display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:800;font-family:'Inter',sans-serif}
.q-bar-name{flex:1;min-width:0}
.q-bar-ic{flex:none;width:32px;height:32px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 0 rgba(0,0,0,.18)}
.q-bar-ic .qic{width:22px;height:22px;vertical-align:0}
.q-bar-name bdi[dir="rtl"]{font-size:21px;line-height:1.9}
.q-bar-end{display:flex;align-items:center;gap:8px;flex:none}
.q-bar-min{font-size:19px}
.q-bar-min:lang(ur),.ictq[dir="rtl"] .q-bar-min{font-family:'Noto Nastaliq Urdu',sans-serif;line-height:1.9}
.q-bar-op{background:var(--teal)}.q-bar-ex{background:var(--navy)}.q-bar-wd{background:var(--blue-bar)}.q-bar-yd{background:var(--yd)}.q-bar-ck{background:var(--purple)}.q-bar-hw{background:var(--slate)}
.q-bar.cont .q-bar-name{font-style:italic}
.q-bar.cont{opacity:.92}
.q-cont{font-weight:700}
/* ── pills, labels ── */
.q-pill{display:inline-flex;align-items:center;border-radius:999px;padding:2px 12px;font-size:15px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;line-height:1.5;font-family:'Inter','Noto Nastaliq Urdu',sans-serif;white-space:nowrap}
.q-pill bdi[dir="rtl"]{letter-spacing:0;font-size:16px;line-height:1.8}
.q-pill.amber{background:var(--amber);color:#3A2A00}
.q-pill.blue{background:var(--blue);color:#fff}
.q-pill.green{background:var(--green);color:#fff}
.q-pill.line{background:#fff;color:#5B6472;box-shadow:inset 0 0 0 1.5px var(--grey-bd)}
.q-pill.line-l{background:transparent;color:#C9CDD8;box-shadow:inset 0 0 0 1.5px rgba(255,255,255,.35)}
.q-pill.big{font-size:16px;padding:3px 14px}
.q-pill-ic{display:inline-flex;align-items:center;justify-content:center;width:24px;height:24px;border-radius:50%;background:#fff;margin-inline-start:-8px;margin-inline-end:7px;flex:none}
.q-pill-ic .qic{width:17px;height:17px;vertical-align:0}
.ictq .q-cap .qic,.ictq .q-lbl .qic,.ictq .q-board-h .qic{width:23px;height:23px;vertical-align:-6px}
.ictq .q-diff .q-cap .qic{vertical-align:0}
.q-pills{display:inline-flex;gap:6px;margin-inline-start:auto}
.q-lbl{display:flex;align-items:center;gap:6px;border-inline-start:4px solid var(--amber);padding-inline-start:10px;font-size:16px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:#3B4152;font-family:'Inter','Noto Nastaliq Urdu',sans-serif;line-height:1.4}
.q-lbl bdi[dir="rtl"]{letter-spacing:0;font-size:18px;line-height:1.9}
.q-lbl-pills{display:flex;align-items:center;gap:8px}
.q-dots{display:flex;flex-direction:column;gap:2px}
.q-dots > li{position:relative;padding-inline-start:26px}
.q-dots > li::before{content:"";position:absolute;inset-inline-start:6px;top:.62em;width:8px;height:8px;border-radius:50%;background:var(--navy)}
.ictq[dir="rtl"] .q-dots > li::before{top:.95em}
.q-n{color:#8A5A00;font-weight:700}
.q-ans{color:var(--ink);font-weight:700}
.q-ansgrp{white-space:nowrap}.q-ansgrp .q-ans{white-space:normal}
.q-ansb{display:inline-flex;vertical-align:-3px;margin-inline-end:5px}.q-ansb .qic{width:19px;height:19px;vertical-align:0}
.q-tag{display:block;text-align:end;font-size:15px;font-weight:700;color:var(--mut);margin-top:-2px}
/* ── opening ── */
.q-warm{border:1.5px solid var(--grey-bd);border-radius:9px;padding:10px 12px 12px;display:flex;flex-direction:column;gap:8px}
.q-warm .units{display:flex;flex-direction:column;gap:6px}
.cont-card.q-blk .q-warm,.q-blk.cont-card > .q-warm{padding-top:10px}
.q-wi{background:var(--cream);border:1.5px solid var(--cream-bd);border-radius:8px;padding:8px 12px}
.q-hook{background:var(--navy);color:#fff;border-radius:10px;padding:12px 14px 14px;overflow:hidden}
.q-hook-h{display:flex;align-items:center;gap:8px;margin-bottom:2px}
.q-hook .q-cap{color:var(--amber)}
.q-hook-t{font-weight:700;font-size:21px}
.q-hook-t[dir="rtl"]{font-weight:700}
.q-fig-hook{margin:0 0 10px;border-radius:9px;overflow:hidden;background:#fff}
.q-fig-hook .qart{border-radius:9px}
.q-read{display:flex;flex-direction:column;gap:8px}
.q-say{display:flex;gap:10px;align-items:flex-start}
.qface{flex:none;width:52px;height:52px;margin-top:0}
.q-bub{flex:1;background:#F5F6F9;border:1.5px solid var(--grey-bd);border-radius:14px;border-start-start-radius:4px;padding:6px 12px}
.q-who{display:block;font-size:16px;color:var(--teal);letter-spacing:.02em}
.q-fig-read{margin-top:4px;background:#F2FAFF;border-radius:10px;padding:6px}
/* ── cards ── */
.q-card{border-radius:10px;padding:10px 14px 12px;display:flex;flex-direction:column;gap:6px}
.q-card .units{display:flex;flex-direction:column;gap:5px}
.q-card-tm{background:var(--cream);border:1.5px solid var(--cream-bd)}
.q-card-wd{background:var(--sky);border:1.5px solid var(--sky-bd)}
.q-card-yd{background:var(--mint);border:1.5px solid var(--mint-bd)}
.q-card-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.q-sub{display:flex}
.q-instr{color:var(--ink);font-weight:700;position:relative;padding-inline-start:20px}
.q-instr-m{position:absolute;inset-inline-start:2px;top:.5em;width:0;height:0;border-block:6px solid transparent;border-inline-start:9px solid var(--green)}
.q-lead{font-weight:700;border-inline-start:3px solid #B9C7DB;padding-inline-start:12px;margin:4px 0;color:var(--ink)}
.q-line{color:var(--ink)}
.q-frame{display:flex;gap:10px;align-items:flex-start;background:#fff;border:2px dashed #B9C7DB;border-radius:9px;padding:8px 12px;margin-top:4px}
.q-frame .qic{margin-top:6px}
.q-wstep{color:var(--ink)}
.q-ask{border-top:1.5px solid var(--cream-bd);padding-top:8px;margin-top:4px}
.q-ask .q-cap{color:#8A5A00}
.q-fig-worked{background:#fff;border-radius:9px;padding:8px}
.q-mis{background:var(--mint);border:1.5px solid var(--mint-bd);border-radius:9px;padding:9px 12px;color:var(--ink)}
.q-mis .q-cap{color:#1E6B45}
.q-half{display:flex;gap:8px;align-items:flex-start;color:var(--ink)}
.q-half .qic{margin-top:5px}
.q-sayl{display:inline-block;background:var(--green);color:#fff;border-radius:6px;padding:0 7px;font-size:16px;line-height:1.5;vertical-align:1px}
.q-item{border-bottom:1px solid var(--mint-bd);padding:6px 0 8px;display:grid;grid-template-columns:1fr;gap:4px}
.q-item:last-child{border-bottom:0}
.q-item.has-fig{grid-template-columns:1fr auto;grid-template-areas:"q f" "a a"}
.q-item.has-fig .q-item-q{grid-area:q}.q-item.has-fig .q-ifig{grid-area:f}.q-item.has-fig .q-a{grid-area:a}
.q-ifig{width:auto;max-width:180px;align-self:start}
.q-ifig .qart{width:auto;max-width:180px;height:auto;max-height:110px}
.q-ifig .qart[aria-label^="clock"]{width:112px;height:112px}
.q-ifig .qart[aria-label^="road sign"]{width:84px;height:84px}
.q-item.has-fig .q-fig-item{grid-column:1/-1}
.q-fig-item{background:#fff;border-radius:12px;padding:6px;margin:2px 0}
.q-ref{display:inline-flex;align-items:center;font-size:15px;font-weight:700;color:var(--mut);background:#fff;border-radius:999px;padding:0 8px;box-shadow:inset 0 0 0 1.5px var(--mint-bd)}
.q-a{border-inline-start:3px solid #8FD1AE;padding-inline-start:12px;color:var(--ink);font-weight:600}
.q-a .q-cap{color:#1E6B45;font-size:15px}.q-a-cap .q-ansb{margin-inline-end:4px}.q-a-cap .q-ansb .qic{width:16px;height:16px}
.q-diff{border:1.5px solid var(--grey-bd);border-radius:9px;padding:9px 12px 11px;background:#fff}
.q-diff .q-cap{color:#3B4152;display:flex;align-items:center;gap:6px}
.q-fig-early{margin-top:8px}
.q-fig-tm,.q-fig-task{background:#fff;border-radius:12px;padding:6px;margin:4px 0}
.q-deeds{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 0}
.q-deed{display:flex;align-items:center;gap:10px;border-radius:12px;padding:6px 10px;font-weight:700;font-size:18px;line-height:1.35;box-shadow:0 2px 0 rgba(0,0,0,.07)}
.q-deed[dir="rtl"] span,.q-deed span[dir="rtl"]{line-height:1.9}
.q-deed .qic{flex:none;width:36px;height:36px}
.q-deed0{background:#E3F0FF}.q-deed1{background:#DDF7EC}.q-deed2{background:#FFF1D6}.q-deed3{background:#FFE6F0}.q-deed4{background:#E8F7E4}.q-deed5{background:#EFE3FF}
.q-exit{background:var(--mint);border:1.5px solid var(--mint-bd);border-radius:10px;padding:10px 14px 12px}
.q-exit .q-cap{color:#1E6B45}
.q-fig-exit{margin-top:8px;background:#fff;border-radius:9px;padding:6px}
.q-exit-row{display:grid;grid-template-columns:1fr auto;gap:10px;align-items:start}
.q-exit-row .q-ifig{background:#fff;border-radius:50%;padding:4px}
.q-coach{background:var(--navy);color:#fff;border-radius:10px;padding:12px 14px 14px}
.q-coach [data-units] > .q-cap{color:var(--amber);margin-bottom:2px}
.q-ay{color:var(--amber);font-size:16px}
.q-csteps{display:flex;flex-direction:column;gap:6px;margin-top:10px}
.q-cstep{display:flex;gap:10px;align-items:center;background:rgba(255,255,255,.08);border-radius:9px;padding:7px 12px}
.q-cstep .qic{width:26px;height:26px}
.q-cstep > b{flex:none;display:inline-flex;width:26px;height:26px;border-radius:50%;background:var(--amber);color:#3A2A00;align-items:center;justify-content:center;font-size:15px;font-family:'Inter',sans-serif}
.q-cstep > span{flex:1;min-width:0;line-height:1.4}
.q-carrow{display:none}
/* ── pause chips, blanks, story map, tracker ── */
.q-pz{display:inline-flex;align-items:center;gap:2px;background:var(--navy);color:#fff;border-radius:6px;padding:0 6px;height:1.15em;vertical-align:-.12em;line-height:1}
.q-pz i{display:inline-block;width:3px;height:.6em;background:#FFD36B;border-radius:1px}
.q-pz b{font-size:.78em;margin-inline-start:3px;font-family:'Noto Nastaliq Urdu','Inter',sans-serif;line-height:1}
.q-blank{display:inline-block;border-bottom:2.5px solid currentColor;height:.9em;vertical-align:baseline;opacity:.75}
.q-story{display:flex;flex-wrap:wrap;align-items:center;gap:6px 6px}
.q-ev{display:inline-flex;align-items:center;gap:7px;border-radius:14px;padding:3px 13px 3px 5px;font-weight:700;box-shadow:0 2px 0 rgba(0,0,0,.09)}
.q-evn{flex:none;width:25px;height:25px;border-radius:50%;background:#fff;font-size:14px;line-height:1;display:inline-flex;align-items:center;justify-content:center;font-family:'Inter',sans-serif;color:inherit}
.q-ev0{background:#DDEFFC;color:#1D4F7A}.q-ev1{background:#FDEBC8;color:#7A5200}.q-ev2{background:#DEF4E7;color:#1E6B45}.q-ev3{background:#EDE7FA;color:#4B3B8A}.q-ev4{background:#FDE2E1;color:#9B2C2C}
.q-arrow{color:var(--slate);font-weight:800;font-family:'Inter',sans-serif;margin:0 2px}
/* the newer approved blocks (2026-10-05); every word in ink, colour on the structure */
.q-outl{margin-top:4px}
.q-concept{background:var(--sky);border:1.5px solid var(--sky-bd);border-inline-start:5px solid var(--blue-bar);border-radius:9px;padding:9px 12px 11px;display:flex;flex-direction:column;gap:6px}
.q-concept-h{display:flex;align-items:center;justify-content:space-between;gap:8px}.q-concept-h .q-cap{color:#2E5E90;display:flex;align-items:center;gap:6px}
.q-concept-l{font-weight:700}
.q-mis2{border:1.5px solid var(--grey-bd);border-radius:9px;overflow:hidden}
.q-mis2-q{background:#FDECEA;padding:8px 12px}.q-mis2-q .q-cap{color:#B23B2E}
.q-mis2-a{background:var(--mint);padding:8px 12px}.q-mis2-a .q-cap{color:#1E6B45}
.q-cmp,.q-flow{background:#fff;border:1.5px solid var(--grey-bd);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:8px}
.q-cmp-t{font-weight:700;text-align:center}
.q-cmp-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}
.q-cmp-c,.q-flow-b{border-radius:9px;padding:8px 10px;background:#fff;display:flex;flex-direction:column;gap:4px}
.q-cmp0{box-shadow:inset 0 0 0 2px var(--navy)}.q-cmp1{box-shadow:inset 0 0 0 2px var(--amber)}.q-cmp2{box-shadow:inset 0 0 0 2px var(--green)}
.q-cmp-h{font-weight:800;text-align:center;padding-bottom:3px;border-bottom:1.5px dashed var(--grey-bd)}
.q-cmp-l{font-size:18px;line-height:1.6}.ictq[dir="rtl"] .q-cmp-l{line-height:2}
.q-cmp-cap{font-size:17px;text-align:center}
.q-flow-row{display:flex;align-items:stretch;gap:6px}.q-flow-b{flex:1 1 0;min-width:0}
.q-flow-ar{align-self:center;font-weight:800;color:var(--slate);font-family:'Inter',sans-serif}
.q-flow-ar small{display:block;font-size:13px;font-weight:600;line-height:1.6;text-align:center;font-family:'Inter','Noto Nastaliq Urdu',sans-serif}
.q-today-n{font-size:18px;line-height:1.4;margin-top:4px;opacity:.95}
.q-mini{display:flex;flex-direction:column;gap:3px;font-size:17px;line-height:1.35}.q-mini .q-n{display:inline-flex;width:20px;height:20px;border-radius:50%;box-shadow:inset 0 0 0 1.5px currentColor;align-items:center;justify-content:center;font-size:12px;vertical-align:1px;font-family:'Inter',sans-serif}
.q-more{font-size:14px;font-style:italic;color:var(--mut);margin-top:3px}
.q-kw-loc{font-family:'Noto Nastaliq Urdu',serif;font-weight:400;font-size:17px;line-height:1.9}
.q-mix{line-height:2.1}
.q-kw-note{font-weight:500;font-size:14px;color:var(--mut)}
.q-board-note{font-style:italic;font-size:16px;color:var(--ink);margin-bottom:4px}
.q-x{margin-top:4px;font-size:17px;line-height:1.4;color:var(--ink)}
.q-xl{display:inline-block;font-size:12.5px;font-weight:800;letter-spacing:.04em;text-transform:uppercase;color:var(--slate);background:#EEF1F6;border-radius:5px;padding:1px 6px;margin-inline-end:4px;vertical-align:1px;font-family:'Inter',sans-serif}
.q-xl bdi[dir="rtl"]{letter-spacing:0;text-transform:none;font-size:14px}
.q-hook .q-x{color:#fff}.q-hook .q-xl{background:rgba(255,255,255,.16);color:#FFD36B}
.q-local{font-style:italic}
.q-keyfact{background:#FFF4D6;border:1.5px solid #F5D488;border-inline-start:5px solid var(--amber);border-radius:9px;padding:9px 12px 11px;display:flex;flex-direction:column;gap:4px}
.q-keyfact .q-cap{color:#8A5A00;display:flex;align-items:center;gap:6px}
.q-keyfact-t{font-size:21px;font-weight:700;line-height:1.35;color:var(--ink)}
.q-wprob{font-weight:700;color:var(--ink)}
.q-wans{margin-top:4px}
.q-exit-o{display:flex;flex-direction:column;gap:3px;padding:6px 0 8px;border-bottom:1px solid var(--mint-bd)}.q-exit-o:last-child{border-bottom:0}
.q-choices{display:flex;flex-wrap:wrap;gap:6px;margin:2px 0}
.q-choice{background:#fff;border:1.5px solid var(--mint-bd);border-radius:16px;padding:2px 12px;color:var(--ink)}
.q-exit-x{border-top:1.5px solid var(--mint-bd);margin-top:6px;padding-top:4px}
.qpv{vertical-align:-3px;margin:0 1px}
.q-figcard{background:#fff;border:1.5px solid var(--grey-bd);border-radius:10px;padding:10px 12px 12px;display:flex;flex-direction:column;gap:8px}
.q-figcard > .q-card-h{justify-content:flex-start}
.q-figcard .q-cmp,.q-figcard .q-flow{border:0;padding:0}
.q-follow{font-style:italic;font-size:17px;color:var(--ink);border-top:1.5px solid var(--grey);padding-top:8px}
.q-p2{display:flex;flex-direction:column;gap:6px;border-bottom:3px solid var(--navy);padding-bottom:8px}
.q-pill.navy{background:var(--navy);color:#fff}
.q-p2-t{font-size:26px;font-weight:700;line-height:1.3}.ictq[dir="rtl"] .q-p2-t{line-height:1.9}
.q-p2h{display:flex;align-items:center;gap:8px;font-size:20px;font-weight:700}
.q-p2r{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.q-p2k{color:var(--slate);font-size:15px;font-weight:600}
.q-p2l{display:inline-flex;min-width:24px;padding:0 6px;height:24px;border-radius:6px;background:var(--navy);color:#fff;align-items:center;justify-content:center;font-size:14px;font-family:'Inter','Noto Nastaliq Urdu',sans-serif;flex:none}
.q-key{background:#F3F5F9;border:1.5px solid var(--grey-bd);border-radius:9px;padding:8px 12px;display:flex;flex-direction:column;gap:2px}
.q-key-l{font-size:16px;font-weight:700;color:#4B5263}.q-key-q{font-weight:600}
.q-key-a{border-inline-start:3px solid #8FD1AE;padding-inline-start:10px;font-weight:600}
.q-track{width:100%;border-collapse:separate;border-spacing:0;border:2px solid var(--navy);border-radius:9px;overflow:hidden;font-size:19px}
.q-track th{background:var(--navy);color:#fff;font-weight:700;padding:4px 8px;text-align:center}
.q-track th.q-th0{background:#2E86DE}.q-track th.q-th1{background:#FF9F43}.q-track th.q-th2{background:#1DD1A1}
.q-track tbody tr:nth-child(odd) td{background:#FFFBF2}
.q-track td{padding:8px;height:48px;text-align:center;border-top:1.5px solid var(--grey-bd);background:#fff}
.q-track td + td,.q-track th + th{border-inline-start:1.5px solid var(--grey-bd)}
/* continuation copies of a card keep its look, without its heading */
.q-blk.cont-card > .q-card,.q-blk.cont-card > .q-warm,.q-blk.cont-card > .q-kw,.q-blk.cont-card > .q-board{border-start-start-radius:4px;border-start-end-radius:4px}
html.lp-print body{background:#fff}
`));

module.exports = { composePrimary, LABELS, rich };
