'use strict';
// THE ICT PAGE COMPOSER — lays the page model (lp-render/guide/lpdoc-pages.js) out as NIETE's
// approved lesson-plan pages: Start, Explanation, Practice, Conclusion, and a Teacher support
// page in the same design. Pure string building; the repo's own richText/renderMath draw the
// text and maths, ICT's engine drew the diagrams (guide.images), art.js draws the icons.
//
// PAGINATION CONTRACT (read by lp-render/render/fixed-pages-pdf.js):
//   .pg            one printed page (a stage); its .band is the header, its .pg-body the rows
//   .row           the unit that moves to a continuation page when a page overflows
//   .row[data-split] a row that may itself be divided: its [data-units] children move one by
//                  one into a copy of the row on the next page (a [data-first-only] part of the
//                  row stays behind — the other column of a two-column row)
const { richText, renderMath, katexCss } = require('../../../math/math');
const { icon, MARK, TEACHER, PUPILS } = require('./art');

const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const has = (v) => v != null && String(v).trim() !== '';
// an English chrome label inside the lesson's own (possibly right-to-left) words, kept in its own order
const lab = (t) => `<b><bdi class="lbl-in" dir="ltr">${t}</bdi></b>`;

function composeIctPages(guide, images) {
  const M = guide.layout;
  const dir = M.dir;
  const eng = (s) => (/\\ce\{/.test(String(s)) ? 'mathjax' : 'katex');
  // the lesson's own words, in its own direction; chrome labels stay English, as approved
  const tx = (s, cls = '') => (has(s) ? `<div class="tx${cls ? ` ${cls}` : ''}" dir="${dir}">${richText(String(s), { engine: eng(s) })}</div>` : '');
  const span = (s) => (has(s) ? `<span dir="${dir}">${richText(String(s), { engine: eng(s) })}</span>` : '');
  const img = (id, badge = true) => {
    const im = id && images[id];
    if (!im || !im.dataUri) return '';
    return `<figure class="fg">${badge && has(im.label) ? `<figcaption class="badge" dir="${dir}">${esc(im.label)}</figcaption>` : ''}<img src="${im.dataUri}" alt="${esc(im.label || 'diagram')}"></figure>`;
  };
  const listen = (s) => (has(s) ? `<div class="ln" dir="${dir}">${icon('ear')}<div class="tx" dir="${dir}">${lab('Listen for:')} ${richText(String(s), { engine: eng(s) })}</div></div>` : '');
  const say = (s) => (has(s) ? `<div class="sy" dir="${dir}">${icon('speak')}${tx(s, 'say')}</div>` : '');
  const band = (min, title, sub = '') => `<header class="band"><span class="pill">${esc(min ? `${min} min` : '')}</span>`
    + `<h2>${esc(title)}</h2>${sub ? `<span class="bsub">${esc(sub)}</span>` : ''}${MARK}</header>`;
  const page = (stage, head, rows) => `<section class="pg pg-${stage}" data-stage="${stage}">${head}<div class="pg-body">${rows.filter(Boolean).join('')}</div></section>`;
  const row = (inner, cls = '', split = false) => `<div class="row${cls ? ` ${cls}` : ''}"${split ? ' data-split="1"' : ''}>${inner}</div>`;

  // ── generic blocks: anything the approved slots do not claim, drawn plainly ─────────────
  let stepNo = 0;
  const HOSTS = ['step', 'worked', 'keyfact', 'text'];
  // a display formula cannot wrap, so only a short one fits beside a card; a long one keeps the full width
  const sideable = (y) => y && (y.kind === 'figure' || (y.kind === 'formula' && String(y.tex || '').replace(/\\[a-zA-Z]+|[{}\s&]/g, '').length <= 26));
  // the pairing lives here, never on the model: composing is a pure function of guide.layout
  const sideFor = new Map(); const paired = new Set();
  const sideOf = (x) => {
    const y = sideFor.get(x);
    return y ? `<div class="side">${y.kind === 'figure' ? img(y.img) : formula(y)}</div>` : null;
  };
  // pair each picture with the card beside it in the flow — the one after it, else the one before
  const pairSides = (items) => {
    items.forEach((y, i) => {
      if (!sideable(y) || paired.has(y)) return;
      const host = [items[i + 1], items[i - 1]].find((h) => h && HOSTS.includes(h.kind) && !sideFor.has(h));
      if (host) { sideFor.set(host, y); paired.add(y); }
    });
  };
  const generic = (x) => {
    const side = sideOf(x);
    const withSide = (cls, inner) => row(side ? `<div class="sidewrap">${inner}${side}</div>` : inner, `${cls}${side ? ' has-side' : ''}`);
    switch (x.kind) {
      case 'step': {
        stepNo += 1;
        return row(`<div class="card step"><span class="num">${stepNo}</span><div class="bubble">${tx(x.text)}</div>${side || ''}</div>`, `r-step${side ? ' has-side' : ''}`);
      }
      case 'text': return withSide('r-text', `<div class="card plain">${tx(x.text)}</div>`);
      case 'ask': return row(`<div class="card askc">${say(x.q)}${listen(x.lookFor)}</div>`, 'r-ask');
      case 'board': return row(`<div class="card boardc"><div class="lbl">On the board</div>${tx(x.text)}</div>`, 'r-board');
      case 'keywords': return row(`<div class="card boardc"><div class="lbl">Key words</div>${x.items.map((k) => `<div class="kw" dir="${dir}">${span(`**${k.word}** = ${k.meaning}`)}</div>`).join('')}</div>`, 'r-board');
      case 'keyfact': return withSide('r-keyfact', `<div class="card keyfact">${icon('bulb')}<div><div class="lbl">Key fact${has(x.title) ? ` · ${esc(x.title)}` : ''}</div>`
        + `${x.items.length === 1 ? tx(x.items[0], 'big') : `<ul class="ticks" dir="${dir}">${x.items.map((t) => `<li>${span(t)}</li>`).join('')}</ul>`}</div></div>`);
      case 'formula': return paired.has(x) ? '' : row(`<div class="card formulac">${formula(x)}</div>`, 'r-formula');
      case 'figure': return paired.has(x) ? '' : row(`<div class="card figc">${img(x.img)}</div>`, 'r-figure');
      case 'worked': return withSide('r-worked', `<div class="card worked"><div class="lbl">Worked example${has(x.title) ? ` · <span class="lt" dir="${dir}">${esc(x.title)}</span>` : ''}</div>`
        + `${tx(x.prompt, 'prob')}${x.steps.length ? `<ol class="work" dir="${dir}">${x.steps.map((s) => `<li>${span(s)}</li>`).join('')}</ol>` : ''}`
        + `${has(x.result) ? `<div class="result">${span(x.result)}</div>` : ''}</div>`);
      case 'slip': return row(`<div class="card slip">${icon('warn')}<div><div class="lbl">Watch for this slip</div>${tx(x.text, 'big')}`
        + `${x.mistakes.map((m) => `<div class="mis"><div class="says" dir="${dir}">${lab('Pupils write:')} ${richText(m.says, { engine: eng(m.says) })}</div>`
          + `<div class="fix" dir="${dir}">${icon('arrow', '#137447')}<div class="tx" dir="${dir}">${lab('Ask:')} ${richText(m.ask, { engine: eng(m.ask) })}</div></div></div>`).join('')}</div></div>`, 'r-slip');
      case 'cfu': return row(`<div class="card cfu"><div class="cfu-top">${icon('check')}<div><div class="lbl">Check for understanding</div>${tx(x.q, 'q')}`
        + `${has(x.lookFor) ? `<div class="ln on" dir="${dir}">${icon('ear', '#fff')}<div class="tx" dir="${dir}">${lab('Listen for:')} ${richText(x.lookFor, { engine: eng(x.lookFor) })}</div></div>` : ''}</div></div>`
        + `${has(x.struggle) ? `<div class="struggle">${lab('If they struggle —')} ${span(x.struggle)}</div>` : ''}</div>`, 'r-cfu');
      case 'struggle': return row(`<div class="card struggle solo">${lab('If they struggle —')} ${span(x.text)}</div>`, 'r-struggle');
      case 'table': return row(`<div class="card tablec">${has(x.title) ? `<div class="lbl">${esc(x.title)}</div>` : ''}<table dir="${dir}"><thead><tr>${x.columns.map((c) => `<th>${span(c)}</th>`).join('')}</tr></thead>`
        + `<tbody>${x.rows.map((r) => `<tr>${r.map((c) => `<td>${span(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`, 'r-table');
      case 'bookfig': return row(`<div class="card bookfig">${icon('book')}<div><div class="lbl">Textbook figure${has(x.label) ? ` · ${esc(x.label)}` : ''}${has(x.page) ? ` · ${esc(x.page)}` : ''}</div>${tx(x.caption)}${has(x.legend) ? tx(`**Reading it:** ${x.legend}`) : ''}</div></div>`, 'r-bookfig');
      case 'questions': return row(`<div class="card plain">${has(x.title) ? `<div class="lbl">${esc(x.title)}</div>` : ''}<ol class="qs" dir="${dir}">${x.items.map((it) => `<li data-units>${span(it.q)}${has(it.a) ? ` <span class="ans">${span(it.a)}</span>` : ''}</li>`).join('')}</ol></div>`, 'r-qs', true);
      case 'duo': return row(`<div class="duo"><div class="card behind"><div class="lbl">For students who are behind</div>${tx(x.support)}</div><div class="card ahead"><div class="lbl">For students who are ahead</div>${tx(x.extension)}</div></div>`, 'r-duo');
      default: return '';
    }
  };
  const formula = (x) => `<div class="board-frame">${renderMath(x.tex, { display: true, engine: x.chem ? 'mathjax' : 'katex' })}${has(x.caption) ? `<div class="cap" dir="${dir}">${span(x.caption)}</div>` : ''}</div>`;
  const flow = (items) => { pairSides(items); return items.map((x) => generic(x)).join(''); };

  // ── 1 · Start ─────────────────────────────────────────────────────────────────────────
  const S = M.start;
  const pathHtml = S.path
    ? `<div class="path"><div class="node done">${icon('check')}</div><div class="bar"></div><div class="node now">●</div><div class="bar"></div><div class="node next">${icon('arrow', '#34374A')}</div></div>`
      + `<div class="path-cap"><span dir="${dir}">${esc(stripMd(S.path.prev))}</span><span dir="${dir}"><b>${esc(stripMd(S.path.today))}</b></span><span dir="${dir}">${esc(stripMd(S.path.next))}</span></div>`
    : '';
  const hero = `<header class="band hero"><span class="pill">${esc(S.minutes ? `${S.minutes} min` : '')}</span><div class="hero-t"><h1>${esc(M.title)}</h1>`
    + `<div class="topic" dir="${dir}">${span(M.topic)}</div></div>${MARK}`
    + `<div class="hero-b"><div class="where">${has(M.pagesRef) ? `<div class="big" dir="${dir}">${esc(M.pagesRef)}</div>` : ''}<div class="small" dir="${dir}">${esc([M.chapter, M.periodMinutes].filter(has).join(' · '))}</div>`
    + `${has(M.boardWeight) ? `<div class="wchip" dir="${dir}">${span(M.boardWeight)}</div>` : ''}</div>${pathHtml ? `<div class="pathw">${pathHtml}</div>` : ''}</div></header>`;
  const cards3 = [
    S.journey.length ? `<div class="card journey"><div class="lbl">Journey so far</div><ul class="done" dir="${dir}">${S.journey.map((j) => `<li>${span(j)}</li>`).join('')}</ul></div>` : '',
    `<div class="card today"><div class="tag">Today</div>${tx(S.today.outcome, 'out')}${tx(S.today.byTheEnd, 'bte')}`
      + `${has(S.today.fbise) ? tx(S.today.fbise, 'fb') : ''}${has(S.today.label) ? `<div class="slo">${esc(S.today.label)}</div>` : ''}</div>`,
    S.coming.length ? `<div class="card coming"><div class="lbl">Coming up</div>${S.coming.map((c, i) => `<div class="cu" dir="${dir}"><span class="cn">${i + 1}</span>${tx(c)}</div>`).join('')}</div>` : '',
  ].filter(Boolean);
  const prepare = (S.prepare.length || S.video)
    ? row(`<div class="prep"><div class="lbl">To prepare</div><div class="boxes">${S.prepare.map((m) => `<span class="cb" dir="${dir}"><i></i>${span(m)}</span>`).join('')}`
      + `${S.video ? `<span class="cb vid" dir="${dir}">${icon('video')}${span(S.video.title)}${has(S.video.meta) ? ` <em>${esc(S.video.meta)}</em>` : ''}</span>` : ''}</div></div>`, 'r-prep')
    : '';
  const warm = S.warmup
    ? `<div class="card warm"><div class="lbl">Warm up</div>${has(S.warmup.recalls) ? `<div class="recalls" dir="${dir}"><em><bdi class="lbl-in" dir="ltr">Recalls:</bdi> ${esc(S.warmup.recalls)}</em></div>` : ''}`
      + `<div class="units">${S.warmup.items.map((it) => `<div class="wu">${say(it.q)}${listen(it.a)}${has(it.tag) ? `<div class="wtag" dir="${dir}">${esc(it.tag)}</div>` : ''}</div>`).join('')}</div></div>`
    : '';
  const opening = S.opening.length
    ? `<div class="card opening"><div class="lbl">Opening <em>how to launch it</em></div><div class="units">${S.opening.map((o) => `<div class="op" data-units>${
      o.kind === 'ask' ? `${say(o.q)}${listen(o.lookFor)}` : o.kind === 'watch' ? `<div class="wn" dir="${dir}">${icon('warn')}${tx(o.text)}</div>` : o.kind === 'step' || o.kind === 'text' ? tx(o.text) : stripRow(generic(o))
    }</div>`).join('')}</div><div class="art-slot" data-art-slot>${PUPILS}</div></div>`
    : '';
  const writeOn = (S.board || S.keywords.length)
    ? row(`<div class="card wob"><div class="lbl">Write on board</div>${S.keywords.map((k) => `<div class="kw" dir="${dir}">${span(`**${k.word}** = ${k.meaning}`)}</div>`).join('')}${has(S.board) ? tx(S.board, 'bt') : ''}</div>`, 'r-wob')
    : '';
  const start = page('start', hero, [
    row(cards3.join(''), `r-three n${cards3.length}`),
    prepare,
    warm || opening ? row(`${warm ? `<div class="col" data-first-only>${warm}</div>` : ''}${opening ? `<div class="col">${opening}</div>` : ''}`, `r-two stretch${warm && opening ? '' : ' one'}`, !!opening) : '',
    writeOn,
  ]);

  // ── 2 · Explanation ───────────────────────────────────────────────────────────────────
  const E = M.explain;
  stepNo = 0;
  const explain = E.flow.length ? page('explain', band(E.minutes, 'Explanation', E.textbook ? `Textbook ${E.textbook}` : ''), [flow(E.flow)]) : '';

  // ── 3 · Practice ──────────────────────────────────────────────────────────────────────
  const P = M.practice;
  let gi = 0;
  const guided = P.guided.map((g) => {
    gi += 1;
    if (g.kind === 'faded') {
      return `<div class="card together"><div class="t-l"><span class="gnum">${gi}</span><span class="glbl">Together we solve</span>${TEACHER}</div>`
        + `<div class="t-r">${has(g.title) ? `<div class="gtitle" dir="${dir}">${esc(stripMd(g.title))}</div>` : ''}${tx(g.prompt, 'prob')}`
        + `${g.steps.length ? `<ol class="work" dir="${dir}">${g.steps.map((s) => `<li>${span(s)}</li>`).join('')}</ol>` : ''}`
        + `${has(g.answer) ? `<div class="gans">${/=/.test(g.answer) ? '' : '= '}${span(g.answer)}</div>` : ''}</div></div>`;
    }
    return `<div class="card together list"><div class="t-l"><span class="gnum">${gi}</span><span class="glbl">With the class</span></div>`
      + `<div class="t-r">${has(g.title) ? `<div class="gtitle" dir="${dir}">${esc(stripMd(g.title))}</div>` : ''}<ol class="qs" dir="${dir}">${g.items.map((it) => `<li>${span(it.q)}${has(it.a) ? ` <span class="ans">= ${span(it.a)}</span>` : ''}</li>`).join('')}</ol></div></div>`;
  });
  const cfuBars = P.flow.filter((x) => x.kind === 'cfu');
  const guidedHtml = guided.length || cfuBars.length
    ? row(`<div class="guided"><div class="gh"><span class="gt">Guided practice</span> <span class="gs">— teacher and class together</span></div>${guided.join('')}`
      + `${cfuBars.map((c) => `<div class="cfubar"><span>CFU</span><div class="tx" dir="${dir}">${richText(c.q, { engine: eng(c.q) })}${has(c.lookFor) ? ` <em>Listen for: ${richText(c.lookFor, { engine: eng(c.lookFor) })}</em>` : ''}</div></div>`).join('')}</div>`, 'r-guided')
    : '';
  const indep = P.independent.length
    ? `<div class="ind"><div class="units">${P.independent.map((it) => `<div class="iq" dir="${dir}" data-units><span class="qn">${it.n}</span><div class="qt">${tx(it.q)}${has(it.tier) ? `<span class="tier">${esc(it.tier)}</span>` : ''}</div><div class="abox"></div></div>`).join('')}</div></div>`
    : '';
  const panels = (P.behind.length || P.ahead.length)
    ? `<div class="panels">${P.behind.length ? `<div class="panel2 behind"><div class="stripe">${icon('hand')}</div><div class="pc"><div class="lbl">For students who are behind</div>${P.behind.map((t) => tx(t)).join('')}</div></div>` : ''}`
      + `${P.ahead.length ? `<div class="panel2 ahead"><div class="stripe">${icon('up')}</div><div class="pc"><div class="lbl">For students who are ahead</div>${P.ahead.map((t) => tx(t)).join('')}</div></div>` : ''}</div>`
    : '';
  const practice = (P.flow.length || guided.length || P.independent.length || panels)
    ? page('practice', band(P.minutes, 'Practice'), [
      flow(P.flow.filter((x) => x.kind !== 'cfu')),
      guidedHtml,
      indep || panels ? row(`<div class="ih"><span class="gt">Independent practice</span> <span class="gs">— on your own</span>${has(P.independentTitle) ? ` <span class="it" dir="${dir}">${esc(stripMd(P.independentTitle))}</span>` : ''}</div>`, 'r-ih keep-next') : '',
      indep || panels ? row(`${indep ? `<div class="col">${indep}</div>` : ''}${panels ? `<div class="col" data-first-only>${panels}</div>` : ''}`, `r-indep stretch${indep && panels ? '' : ' one'}`, !!indep) : '',
      P.answers.length ? row(`<div class="answers"><b>Answers</b> — for the teacher &nbsp;<span dir="${dir}">${P.answers.map((a) => `<b>${a.n}.</b> ${richText(a.a, { engine: eng(a.a) })}`).join(' · ')}</span></div>`, 'r-answers') : '',
    ])
    : '';

  // ── 4 · Conclusion ────────────────────────────────────────────────────────────────────
  const C = M.conclusion;
  const option = (o, i) => {
    const head = `<div class="opt-pill">Option ${i + 1}</div>`;
    if (o.kind === 'mcq') {
      return `<div class="opt" data-units>${head}<div class="oc"><div class="olbl">${esc(o.label)}</div>${tx(o.q, 'oq')}<div class="chips">${o.options.map((c) => `<div class="chip${c.key ? ' key' : ''}" dir="${dir}">${c.key ? icon('check') : ''}<b>${c.letter}.</b> ${richText(c.text, { engine: eng(c.text) })}</div>`).join('')}</div>`
        + `${o.notes.length ? `<div class="how" dir="${dir}"><em>${lab('Teacher note —')} ${o.notes.map((nn) => richText(nn, { engine: eng(nn) })).join(' · ')}</em></div>` : ''}</div></div>`;
    }
    return `<div class="opt" data-units>${head}<div class="oc">${has(o.label) ? `<div class="olbl">${esc(o.label)}</div>` : ''}${tx(o.q, 'oq')}`
      + `${o.how && o.how.length ? `<div class="how" dir="${dir}"><em>${lab('How it is marked:')}</em><ul>${o.how.map((h) => `<li>${span(h)}</li>`).join('')}</ul></div>` : ''}`
      + `${has(o.ans) ? `<div class="oans" dir="${dir}"><em><bdi class="lbl-in" dir="ltr">Ans:</bdi> ${richText(o.ans, { engine: eng(o.ans) })}</em></div>` : ''}</div></div>`;
  };
  const exitCard = C.options.length
    ? `<div class="card exit"><div class="eh"><span class="et">Exit ticket — pick ONE</span><span class="es">everyone answers before they leave</span>${C.minutes ? `<span class="emin">${C.minutes} min</span>` : ''}</div>`
      + `<div class="units">${C.options.map(option).join('')}</div>${has(C.reteach) ? `<div class="reteach" dir="${dir}">${lab('If many miss it:')} ${richText(C.reteach, { engine: eng(C.reteach) })}</div>` : ''}</div>`
    : '';
  const right = [
    C.remember.length ? `<div class="card remember"><div class="lbl">Remember</div><ul class="ticks" dir="${dir}">${C.remember.map((t) => `<li>${span(t)}</li>`).join('')}</ul></div>` : '',
    C.homework.length ? `<div class="card homework"><div class="hwh">${icon('house')}<span>Homework</span>${C.hwMinutes ? `<em>${C.hwMinutes} min</em>` : ''}</div><ul class="boxes" dir="${dir}">${C.homework.map((h) => `<li><i></i><div>${span(h.text)}${has(h.tag) ? ` <span class="tier">${esc(h.tag)}</span>` : ''}${has(h.ans) ? `<div class="hwans" dir="${dir}"><em><bdi class="lbl-in" dir="ltr">Ans:</bdi> ${richText(h.ans, { engine: eng(h.ans) })}</em></div>` : ''}</div></li>`).join('')}</ul></div>` : '',
    has(C.tomorrow) ? `<div class="card tomorrow">${icon('arrow')}<div class="tx" dir="${dir}">${lab('Tomorrow:')} ${richText(C.tomorrow, { engine: eng(C.tomorrow) })}</div></div>` : '',
  ].filter(Boolean).join('');
  const coach = C.coach
    ? row(`<div class="card coach"><div class="cl"><div class="lbl">Coaching corner</div>${tx(C.coach.lookFor)}${has(C.coach.reflection) ? tx(`**Ask yourself:** ${C.coach.reflection}`) : ''}</div>`
      + `<div class="cr"><div class="cs"><span class="n">1</span>${icon('mic')}<div>Record up to 40 minutes of this lesson</div></div><span class="gt2">›</span>`
      + `<div class="cs"><span class="n">2</span>${icon('chat')}<div>Send it to NIETE on WhatsApp</div></div><span class="gt2">›</span>`
      + `<div class="cs"><span class="n">3</span>${icon('reply')}<div>Same-day tips back</div></div></div></div>`, 'r-coach')
    : '';
  const conclusion = (C.options.length || right || C.flow.length || coach)
    ? page('conclusion', band(C.minutes, 'Conclusion'), [
      flow(C.flow),
      exitCard || right ? row(`${exitCard ? `<div class="col">${exitCard}</div>` : ''}${right ? `<div class="col stack" data-first-only>${right}</div>` : ''}`, `r-close stretch${exitCard && right ? '' : ' one'}`, !!exitCard) : '',
      coach,
    ])
    : '';

  // ── 5 · Teacher support ───────────────────────────────────────────────────────────────
  const X = M.support;
  const sup = [];
  if (X.board && (X.board.img || X.board.order.length)) {
    sup.push(row(`<div class="sh">The board at the end of the lesson</div>`, 'r-sh keep-next'));
    sup.push(row(`<div class="card boardplan">${X.board.img ? `<div class="bp-fig">${img(X.board.img, false)}${has(X.board.caption) ? `<div class="cap" dir="${dir}">${span(X.board.caption)}</div>` : ''}</div>` : ''}`
      + `${X.board.order.length ? `<div class="bp-order"><div class="lbl">Draw it in this order</div><ol dir="${dir}">${X.board.order.map((d) => `<li>${span(d)}</li>`).join('')}</ol></div>` : ''}</div>`, 'r-boardplan'));
  }
  if (X.exam) {
    const ex = X.exam;
    sup.push(row(`<div class="sh">FBISE format questions <em>(optional)</em></div>`, 'r-sh keep-next'));
    for (const q of ex.mcqs) {
      sup.push(row(`<div class="card mcq"><div class="olbl">${esc(q.label)}</div>${tx(q.q, 'oq')}<div class="chips">${q.options.map((c) => `<div class="chip${c.key ? ' key' : ''}" dir="${dir}">${c.key ? icon('check') : ''}<b>${c.letter}.</b> ${richText(c.text, { engine: eng(c.text) })}</div>`).join('')}</div>`
        + `${q.notes.length ? `<div class="how" dir="${dir}"><em>${lab('Teacher note —')} ${q.notes.map((nn) => richText(nn, { engine: eng(nn) })).join(' · ')}</em></div>` : ''}</div>`, 'r-mcq'));
    }
    if (ex.srq) {
      sup.push(row(`<div class="card srq"><div class="lbl">${esc(ex.srq.label)}</div>${tx(ex.srq.q, 'q')}</div>`
        + `${ex.srq.scheme.length ? `<div class="card scheme"><div class="lbl">Mark scheme</div><ul dir="${dir}">${ex.srq.scheme.map((m) => `<li>${span(m)}</li>`).join('')}</ul></div>` : ''}`, 'r-srq'));
    }
    if (ex.erq) {
      sup.push(row(`<div class="card erq"><div class="lbl">${esc(ex.erq.label)}</div>${tx(ex.erq.q, 'q')}<div class="parts">${ex.erq.parts.map((pt) => `<div class="part" dir="${dir}"><span>${span(pt.text)}</span>${has(pt.marks) ? `<b>${esc(pt.marks)}</b>` : ''}</div>`).join('')}</div></div>`, 'r-erq'));
    }
    if (has(ex.howMarked)) sup.push(row(`<div class="howm">${tx(`**How this is marked:** ${ex.howMarked}`)}</div>`, 'r-howm'));
  }
  if (X.hwkey.length) {
    sup.push(row(`<div class="sh">Homework, in full</div>`, 'r-sh keep-next'));
    sup.push(row(`<div class="hwkey units">${X.hwkey.map((h) => `<div class="hk" data-units>${has(h.head) ? `<div class="hkh">${esc(h.head)}</div>` : ''}${tx(h.q, 'hq')}${tx(h.a, 'ha')}</div>`).join('')}</div>`, 'r-hwkey', true));
  }
  const support = sup.length ? page('support', band('', 'Teacher support', 'not for the board'), sup) : '';

  const bodyHtml = `<div class="ictp" data-lang="${esc(M.lang)}">${[start, explain, practice, conclusion, support].filter(Boolean).join('')}</div>`;
  return { headerHtml: '', bodyHtml, headCss: /class="katex"/.test(bodyHtml) ? katexCss() : '' };
}

function stripMd(s) { return String(s || '').replace(/\*\*/g, '').replace(/\$([^$]*)\$/g, '$1'); }
function stripRow(html) { return String(html || '').replace(/^<div class="row[^"]*"[^>]*>/, '').replace(/<\/div>$/, ''); }

module.exports = { composeIctPages };
