'use strict';
// DETECTION FROM THE RAW TEXT, ACROSS EVERY SUBJECT.
//
// The renderer could DRAW twenty-one kinds of figure and the raw-text mapper could REACH
// sixteen. Five primitives — process, labeled-parts, compass, compare, count-set — were
// built for the model path and never got detectors when the deterministic path replaced
// it, and a sixth shape, the set of cards a teacher writes on the board, had none either.
// Measured on the fifteen Yemen lessons that was most of why maths carried thirty-three of
// forty-three figures from four of the fifteen lessons, while three Arabic lessons, one
// science lesson and two Islamic-education lessons drew nothing at all.
//
// These tests pin the six new detectors and, more importantly, the two rules that decide
// when they must REFUSE. Both rules were paid for in this repo:
//
//   · NEVER TRUNCATE. A pattern that does not fit its component whole is refused, not
//     shortened — shortening put «كسروا الباب وأخذوا» in a coloured box.
//   · NEVER DRAW PART OF A PATTERN. A compass missing one direction, or two of a lesson's
//     four arrow chains, is a factual error, not an untidy figure — which is why the
//     inline pair extractor was reverted rather than tuned.
//
// So every detector here has a negative twin: a lesson that does NOT state the pattern, or
// states more of it than can be drawn faithfully, must draw nothing and keep its text
// card. A test suite that only pins the positives would pass while the renderer invents.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { buildGuideFromMarkdown } = require('../guide/from-markdown');

// A lesson skeleton in this curriculum's own shape. Only the stage under test varies, so
// each case is the detector's input and nothing else.
const lesson = ({ goal = 'أستطيع أن أتعلم شيئاً جديداً.', arad = '', tatbiq = '', taqwim = '' }) => `الهدف: ${goal}
المواد: السبورة، الطباشير.

التمهيد (٥ دقائق)

يسأل المعلم التلاميذ سؤالاً عن الدرس.

العرض — أنا أفعل (١٠ دقائق)

${arad}

التطبيق — نحن نفعل (١٥ دقيقة)

${tatbiq}

التقويم — أنت تفعل (١٠ دقائق)

${taqwim}
`;

// every drawn figure in the guide, with the card it sits on and that card's own text
function figures(src) {
  const g = buildGuideFromMarkdown(src, { region: 'ye' });
  const out = [];
  for (const sec of g.sections || []) {
    if (sec.codeFigure) out.push({ id: sec.id, fig: sec.codeFigure, body: sec.body || '' });
    for (const a of sec.activities || []) {
      if (a.codeFigure) out.push({ id: sec.id, fig: a.codeFigure, body: a.body || '' });
    }
  }
  return out;
}
const kinds = (src) => figures(src).map((f) => f.fig.kind);
const of = (src, kind) => figures(src).filter((f) => f.fig.kind === kind);

// ── process / cycle ────────────────────────────────────────────────────────────────
test('an arrow chain the lesson wrote is drawn as a process, with every link', () => {
  // the water-cycle lesson's own fill-in-the-blanks answer
  const src = lesson({ goal: 'أستطيع أن أشرح مراحل دورة الماء في الطبيعة.',
    tatbiq: 'أكمل الكلمات الناقصة: تبخر → تكاثف → هطول المطر → المياه الجارية.' });
  const [p] = of(src, 'process');
  assert.ok(p, 'a chain of four links draws a process');
  assert.deepStrictEqual(p.fig.stages.map((s) => s.label),
    ['تبخر', 'تكاثف', 'هطول المطر', 'المياه الجارية'],
    'every link, in the order the lesson wrote them, and none of them re-worded');
  // …and the words appear ONCE: drawn, not also printed as prose beside their own diagram
  assert.doesNotMatch(p.body, /تكاثف/,
    'the chain moves into the figure; the instruction above it stays as written');
  assert.match(p.body, /أكمل الكلمات الناقصة/, 'the teacher\'s instruction is untouched');
});

test('the instruction survives even though the chain moved into the figure', () => {
  const src = lesson({ tatbiq: 'أكمل: تبخر ← تكاثف ← هطول.' });
  const g = buildGuideFromMarkdown(src, { region: 'ye' });
  const seen = JSON.stringify(g);
  for (const word of ['تبخر', 'تكاثف', 'هطول', 'أكمل']) {
    assert.ok(seen.includes(word), `«${word}» is still in the guide`);
  }
});

test('TWO chains in one body draw nothing — a figure of the first is a partial pattern', () => {
  // The real demonstration stage of the water-cycle lesson. Four chains, and the last link
  // of the fourth is a nine-word sentence: no single figure carries all four faithfully.
  const src = lesson({ arad: 'يكتب بجانب كل سهم العملية: ١- ماء (بحر/نهر) ← أشعة الشمس ← تبخر. '
    + '٢- بخار ← برودة الجو ← تكاثف (غيوم). ٣- غيوم ← هطول (مطر).' });
  assert.ok(!kinds(src).includes('process'),
    'two drawable chains is a refusal, not a choice between them');
});

test('a chain whose last link is a sentence draws nothing rather than a shortened link', () => {
  const src = lesson({ arad: 'العملية: مطر ← تجمع ← تسرب لباطن الأرض أو عودة للبحر مرة أخرى.' });
  assert.ok(!kinds(src).includes('process'), 'the link is not cut down to fit a box');
});

test('one arrow is a pair, not a process', () => {
  const src = lesson({ arad: 'يكتب على السبورة: الصحراء ← جفاف.' });
  assert.ok(!kinds(src).includes('process'), 'a process needs three links');
});

test('a cycle is a ring only where the lesson calls it one in the same breath', () => {
  const linear = lesson({ arad: 'الترتيب: بذرة ← جذور ← ساق ← أزهار.' });
  const cyclic = lesson({ arad: 'هذه دورة الماء: تبخر ← تكاثف ← هطول ← تجمع.' });
  assert.strictEqual(of(linear, 'process')[0].fig.layout, 'linear',
    'a sequence is not given a closing arrow the lesson never wrote');
  assert.strictEqual(of(cyclic, 'process')[0].fig.layout, 'cycle',
    'the lesson\'s own word «دورة» is what promotes it to a ring');
});

// ── labeled parts ──────────────────────────────────────────────────────────────────
test('parts the lesson names are labelled on the drawing the renderer owns', () => {
  // the plant lesson's own board work
  const src = lesson({ goal: 'أستطيع تسمية أجزاء النبات وتحديد وظائفها.',
    arad: 'يرسم المعلم نباتاً بسيطاً على السبورة. يكتب على السبورة: الجذور ← تثبيت وامتصاص الماء. '
      + 'الساق ← نقل الماء. الأوراق ← صنع الغذاء.' });
  const [lp] = of(src, 'labeled-parts');
  assert.ok(lp, 'three named parts draw a labelled diagram');
  assert.strictEqual(lp.fig.object, 'plant');
  assert.deepStrictEqual(lp.fig.parts.map((p) => p.part), ['root', 'stem', 'leaf']);
  assert.deepStrictEqual(lp.fig.parts.map((p) => p.label), ['الجذور', 'الساق', 'الأوراق'],
    'the chip carries the part word as the lesson wrote it');
  // What each part DOES stays in the card's text: the drawing's own contribution is
  // showing WHERE the part is, and a chip carrying a four-word function drops to 8px.
  assert.match(lp.body, /تثبيت وامتصاص الماء/, 'the functions are not taken out of the text');
});

test('one named part is not a labelled diagram', () => {
  const src = lesson({ goal: 'أستطيع وصف النبات.', arad: 'يكتب على السبورة: الجذور ← تمتص الماء.' });
  assert.ok(!kinds(src).includes('labeled-parts'), 'two parts minimum');
});

test('a part word in another lesson\'s sense draws nothing', () => {
  // «الساق» outside a lesson about plants — no object, no diagram
  const src = lesson({ goal: 'أستطيع قراءة النص قراءة صحيحة.',
    arad: 'يكتب على السبورة: الساق ← كلمة. الأوراق ← كلمة أخرى.' });
  assert.ok(!kinds(src).includes('labeled-parts'),
    'the body must be about the object the parts belong to');
});

// ── compass ────────────────────────────────────────────────────────────────────────
test('the four directions the lesson names are drawn as a compass', () => {
  const src = lesson({ goal: 'أستطيع تحديد الجهات الأصلية الأربع ومعرفة فائدتها.',
    arad: 'يكتب على السبورة: الجهات الأصلية هي: الشرق، الغرب، الشمال، الجنوب.' });
  const [c] = of(src, 'compass');
  assert.ok(c, 'all four directions draw the compass');
  assert.deepStrictEqual(
    { north: c.fig.north, east: c.fig.east, south: c.fig.south, west: c.fig.west },
    { north: 'الشمال', east: 'الشرق', south: 'الجنوب', west: 'الغرب' });
});

test('three of the four directions draw NOTHING — a compass with a gap is a wrong drawing', () => {
  const src = lesson({ goal: 'أستطيع تحديد الجهات.',
    arad: 'يكتب على السبورة: الجهات هي: الشرق، الغرب، الشمال.' });
  assert.ok(!kinds(src).includes('compass'), 'a missing direction is a refusal');
});

test('a sentence about sunrise is not a lesson about direction', () => {
  // «تشرق» contains «شرق»; without the lesson's own direction noun there is no compass
  const src = lesson({ goal: 'أستطيع قراءة النص.',
    arad: 'يقول المعلم: تشرق الشمس صباحاً وتغرب مساءً، وينام الطفل في الشمال والجنوب.' });
  assert.ok(!kinds(src).includes('compass'), 'the direction noun is the guard');
});

// ── compare ────────────────────────────────────────────────────────────────────────
test('a size contrast the lesson states is drawn as two bars, longer first', () => {
  const src = lesson({ goal: 'أستطيع استخدام عيني للوصف والتمييز.',
    arad: 'يضع المعلم غطاء زجاجة كبيراً وآخر صغيراً ويقول: بعيني أميز أن هذا كبير وهذا صغير.' });
  const [c] = of(src, 'compare');
  assert.ok(c, 'a stated contrast draws the comparison');
  assert.strictEqual(c.fig.items.length, 2);
  assert.ok(c.fig.items[0].len > c.fig.items[1].len,
    'the bar lengths carry the only thing the source states: which one is bigger');
  // The lesson writes «كبيراً»; matching is diacritic-blind, so the bar carries the word
  // the region declares rather than a substring with its last letter left behind.
  assert.deepStrictEqual(c.fig.items.map((i) => i.label), ['كبير', 'صغير'],
    'in the order the lesson names them');
});

test('«حباً كبيراً» is not a comparison', () => {
  const src = lesson({ goal: 'أستطيع قراءة نص حب الوالدين.',
    arad: 'تذكر أن كلمات التشجيع تزرع في قلوب تلاميذك حباً كبيراً لوالديهم.' });
  assert.ok(!kinds(src).includes('compare'), 'one word of a pair, and no contrast cue');
});

test('two contrasts draw nothing — four bars in a component that draws three', () => {
  const src = lesson({ arad: 'أميز أن هذا كبير وهذا صغير، وأن هذا طويل وهذا قصير.' });
  assert.ok(!kinds(src).includes('compare'), 'a second pair is a refusal, not a dropped item');
});

// ── count set ──────────────────────────────────────────────────────────────────────
test('a counting question over objects this curriculum uses draws the counted set', () => {
  const src = lesson({ tatbiq: 'يسأل المعلم: كم عدد ٦ أغطية زجاجات على الطاولة؟' });
  const [c] = of(src, 'count-set');
  assert.ok(c, 'the lesson asked for them to be counted');
  assert.strictEqual(c.fig.total, 6);
  assert.match(c.fig.caption, /أغطية/,
    'the objects are named under the row, or a row of rings says nothing');
});

test('fetching six bottle caps is not a counting exercise', () => {
  // The division lesson's warm-up. Six rings drawn for it would be decoration, which is
  // the one thing this work is explicitly not adding.
  const src = lesson({ goal: 'أستطيع إيجاد ناتج القسمة على ٢.',
    arad: 'يطلب المعلم من تلميذ إحضار ٦ أغطية زجاجات وتوزيعها بالتساوي على تلميذين.' });
  assert.ok(!kinds(src).includes('count-set'), 'no counting cue, no counted set');
});

// ── the cards a teacher writes on the board ────────────────────────────────────────
test('a label and its value, three times over, is a set of fact cards', () => {
  const src = lesson({ goal: 'أستطيع أن أقرأ نص قصة أصحاب الأخدود.',
    arad: 'يكتب على السبورة: الملك: ذو نواس. الدين: اليهودية. المكان: نجران.' });
  const [f] = of(src, 'fact-grid');
  assert.ok(f, 'three facts draw three cards');
  assert.deepStrictEqual(f.fig.items.map((i) => i.text),
    ['الملك: ذو نواس', 'الدين: اليهودية', 'المكان: نجران']);
  assert.doesNotMatch(f.body, /نجران/, 'drawn once, not printed beside its own figure');
  assert.match(f.body, /يكتب على السبورة/, 'the sentence that introduces them stays');
});

test('the words a lesson puts on the board become word cards, markers and all removed', () => {
  const src = lesson({ goal: 'أستطيع قراءة نص الكلب الوفي.',
    arad: 'يقول المعلم: انظروا إلى الكلمات الملونة. يكتب على السبورة: (ذئب، كلباً، ذات، الهزال، آثار، طعام).' });
  const [f] = of(src, 'fact-grid');
  assert.ok(f, 'a comma list of short words is a card set');
  assert.deepStrictEqual(f.fig.items.map((i) => i.text),
    ['ذئب', 'كلباً', 'ذات', 'الهزال', 'آثار', 'طعام']);
});

test('EVERY sentence on the board is drawn — diacritics are not width', () => {
  // This is a real regression: the fourth sentence is 27 letters and 40 characters once its
  // harakat are counted, so a length test on the raw string dropped it and drew three of
  // four. A card set missing one of the lesson's four reading sentences is exactly the
  // partial pattern this file exists to prevent.
  const src = lesson({ goal: 'أستطيع أن أقرأ جمل الدرس.',
    arad: 'يكتب المعلم على السبورة: الرَّجُلُ يَبْنِيْ بَيْتَاً. الْبَيْتُ جَمِيْلٌ. '
      + 'الْبِنْتُ تَحْمِلُ عِنَبَاً. عِنَبُ الْيَمَنِ لَذِيْذُ الطَّعْمِ. نقطة التحقق: ٨٠٪ من التلاميذ يرددون الجمل.' });
  const [f] = of(src, 'fact-grid');
  assert.ok(f, 'the sentences on the board are the content of the stage');
  assert.strictEqual(f.fig.items.length, 4, 'all four, or none');
  assert.ok(f.fig.items.every((i) => /[ً-ْ]/.test(i.text)),
    'and drawn with the vowelling the source wrote, letter for letter');
  // the run stops at the lesson's own check point: that measures the class, it is not
  // something written up for them to read
  assert.ok(!f.fig.items.some((i) => /التحقق|٨٠/.test(i.text)),
    'the check point never becomes a card');
});

test('one over-long sentence on the board and the whole set stays text', () => {
  const src = lesson({ arad: 'يكتب المعلم على السبورة: البيت جميل. العنب لذيذ. '
    + 'الرجل يبني بيتاً كبيراً من الطين والحجر في حارتنا القديمة.' });
  assert.ok(!of(src, 'fact-grid').length,
    'if one piece of what the teacher wrote up cannot be a card, none of it is drawn');
});

test('one sentence on the board stays a sentence', () => {
  const src = lesson({ arad: 'يكتب على السبورة: (أحمد يحب والده لأن والده يتعب من أجلهم).' });
  assert.ok(!of(src, 'fact-grid').length, 'three items minimum');
});

// ── a numbered run of instructions ─────────────────────────────────────────────────
const orderedSteps = lesson({ goal: 'أستطيع أن أطبق خطوات الوضوء الصحيحة بالترتيب.',
  arad: 'ثم يشرح بالترتيب: ١. غسل الكفين إلى الرسغين (٣ مرات). ٢. المضمضة (٣ مرات). '
    + '٣. الاستنشاق والاستنثار (٣ مرات). ٤. غسل الوجه (٣ مرات). ٥. غسل اليد اليمنى إلى المرفق (٣ مرات). '
    + '٦. غسل اليد اليسرى إلى المرفق (٣ مرات). ٧. مسح الرأس (مرة واحدة). ٨. مسح الأذنين (مرة واحدة). '
    + '٩. غسل الرجل اليمنى إلى الكعبين (٣ مرات). ١٠. غسل الرجل اليسرى إلى الكعبين (٣ مرات).' });

test('ten ordered steps are ONE sequence, and all ten are drawn', () => {
  const [s] = of(orderedSteps, 'steps');
  assert.ok(s, 'a stage whose subject is the order draws the order');
  assert.strictEqual(s.fig.items.length, 10,
    'six is a row\'s limit, not a sequence\'s: capping here would delete four steps');
  assert.strictEqual(s.fig.items[0].label, 'غسل الكفين إلى الرسغين (٣ مرات)',
    'the step\'s own words, with the source\'s numbering left to the component\'s badges');
  assert.strictEqual(s.fig.orient, 'v', 'stacked: ten cards in a row are 44px wide');
  assert.strictEqual(s.fig.wide, true, 'and given the width the stack was drawn for');
});

test('the run replaces its rows instead of duplicating them', () => {
  const g = buildGuideFromMarkdown(orderedSteps, { region: 'ye' });
  const stage = (g.sections || []).find((s) => s.id === 'stage-arad');
  const labels = (stage.activities || []).map((a) => String(a.label || ''));
  assert.ok(!labels.some((l) => /المضمضة/.test(l)),
    'the ten label-only rows are gone; the same words are in the figure');
  assert.ok(JSON.stringify(g).includes('المضمضة'), 'and not one of them left the guide');
});

test('numbered questions with answers are a Q&A card, not a process', () => {
  const src = lesson({ tatbiq: 'يطرح المعلم الأسئلة التالية: ١. من هو الملك؟ الإجابة: ذو نواس. '
    + '٢. ما الديانة التي اعتنقها؟ الإجابة: اليهودية. ٣. إلى أين ذهب بجيشه؟ الإجابة: إلى نجران.' });
  assert.ok(!of(src, 'steps').length, 'a numbered set of questions is not a sequence of steps');
});

test('a run that does not start at one is left as rows', () => {
  // the component draws its own badges, so a run starting at «٣» would be drawn as 1–3
  const src = lesson({ arad: 'يشرح المعلم: ٣. غسل الوجه. ٤. مسح الرأس. ٥. غسل الرجلين.' });
  assert.ok(!of(src, 'steps').length, 'renumbering the teacher\'s steps is not an option');
});

// ── the same drawing is not printed twice ──────────────────────────────────────────
test('an identical figure is drawn once, and the second card keeps its text', () => {
  // The directions lesson names all four twice — the teacher writes them up, then the
  // class draws the cross — and both stages drew the identical compass, one above the
  // other on the same page.
  const src = lesson({ goal: 'أستطيع تحديد الجهات الأصلية الأربع.',
    arad: 'يكتب على السبورة: الجهات الأصلية هي: الشرق، الغرب، الشمال، الجنوب.',
    tatbiq: 'إكمال الفراغات: فالجهات الأربع هي: الشرق، الغرب، والشمال، الجنوب.' });
  assert.strictEqual(of(src, 'compass').length, 1, 'drawn once, on the first card that states it');
  const g = buildGuideFromMarkdown(src, { region: 'ye' });
  const tatbiq = (g.sections || []).find((s) => s.id === 'stage-tatbiq');
  assert.match(JSON.stringify(tatbiq), /الجهات الأربع/,
    'the later card loses the duplicate drawing, never its words');
});

test('…but a numbered exercise keeps its own figure, even an identical one', () => {
  // The fractions lesson draws one circle per instruction, and two of its fifteen ask for
  // the same fraction. Those are answers to different exercises and the reviewer approved
  // exactly that, so the dedupe must not reach them.
  const src = lesson({ goal: 'أستطيع التعرف على الكسور وتمثيلها.',
    tatbiq: '١. ظلل نصف الشكل الأول.\n٢. ظلل نصف الشكل الثاني.' });
  assert.strictEqual(of(src, 'fraction-grid').length, 2,
    'each numbered exercise carries its own answer figure');
});

// ── the property that matters most: this is content-pattern, not subject ────────────
test('the same pattern draws the same figure whatever the subject', () => {
  const science = lesson({ goal: 'أستطيع أن أشرح مراحل دورة الماء.',
    arad: 'الترتيب: تبخر ← تكاثف ← هطول.' });
  const religion = lesson({ goal: 'أستطيع أن أطبق خطوات الوضوء بالترتيب.',
    arad: 'الترتيب: نية ← غسل الكفين ← المضمضة.' });
  const arabic = lesson({ goal: 'أستطيع أن أقرأ جمل الدرس.',
    arad: 'الترتيب: حرف ← كلمة ← جملة.' });
  for (const [name, src] of [['science', science], ['religion', religion], ['arabic', arabic]]) {
    assert.ok(kinds(src).includes('process'), `${name}: the same three-link chain, drawn`);
  }
});

test('no detector consults the subject, the region or the lesson id', () => {
  // The guarantee above has to hold structurally, not just for the three lessons a test
  // happens to name. figureFor is a flat sequence of pattern detectors: if any of them
  // starts keying on WHICH lesson it is looking at, the renderer stops being fair across
  // subjects and this test says so.
  const src = fs.readFileSync(path.join(__dirname, '..', 'guide', 'from-markdown.js'), 'utf8');
  const body = src.slice(src.indexOf('function figureFor('));
  const chain = body.slice(0, body.indexOf('\n}\n'));
  for (const forbidden of [/profile\.id/, /\bsubject\b/, /locale/, /region/, /lesson\s*===/]) {
    assert.doesNotMatch(chain, forbidden,
      `figureFor must not branch on ${forbidden} — detection is on the content, not the subject`);
  }
  // and every detector must be reachable from it
  for (const fn of ['processFigure', 'labeledPartsFigure', 'compassFigure', 'compareFigure',
    'countSetFigure', 'boardFactsFigure']) {
    assert.match(chain, new RegExp(fn + '\\('), `${fn} is wired into figureFor`);
  }
});

test('the region declares the vocabularies, so a new region needs no renderer change', () => {
  const { PROFILES } = require('../guide/profiles');
  const ye = PROFILES.ye;
  assert.ok(Array.isArray(ye.compassTerms) && ye.compassTerms.length === 4);
  assert.ok(Array.isArray(ye.comparePairs) && ye.comparePairs.length >= 3);
  assert.ok(Array.isArray(ye.partObjects) && ye.partObjects.length >= 1);
  assert.ok(ye.boardCueRe instanceof RegExp && ye.countCueRe instanceof RegExp);
  // …and a region that declares none of them draws none of these figures rather than
  // falling back to Arabic patterns. Kenya's CBC profile is the live case.
  const ke = PROFILES.ke;
  for (const key of ['compassTerms', 'comparePairs', 'partObjects', 'countNouns', 'boardCueRe']) {
    assert.strictEqual(ke[key], undefined, `ke must not inherit ye's ${key}`);
  }
});

test('a lesson stating none of these patterns draws nothing and keeps its text', () => {
  // The comprehension lesson: seven questions and their answers, no drawable pattern in
  // any of them. It must come out as designed text cards, not as invented figures.
  const src = lesson({ goal: 'أستطيع أن أقرأ نص حب الوالدين وأجيب عن أسئلة الاستيعاب.',
    arad: 'يقرأ المعلم النص قراءة جهرية معبرة، ثم يشرح أن حب الوالدين يكون بالتقدير والطاعة.',
    tatbiq: 'يقرأ المعلم أسئلة الاستيعاب ويناقشها مع التلاميذ.' });
  const drawn = kinds(src);
  for (const kind of ['process', 'labeled-parts', 'compass', 'compare', 'count-set', 'fact-grid']) {
    assert.ok(!drawn.includes(kind), `nothing to draw, so no ${kind}`);
  }
  const g = buildGuideFromMarkdown(src, { region: 'ye' });
  assert.ok(JSON.stringify(g).includes('التقدير والطاعة'), 'and every word is still there');
});
