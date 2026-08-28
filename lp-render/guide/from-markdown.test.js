'use strict';
// The render path must reach the design template without a model call, and without
// touching the teacher's words. These tests pin both properties, plus the one that is
// easy to lose under pressure: a role the lesson does not provide stays EMPTY rather
// than being filled with something plausible.
const test = require('node:test');
const assert = require('node:assert');
const { buildGuideFromMarkdown, roleOf, tableRows, listItems,
  rubricItems } = require('./from-markdown');
const { resolveProfile } = require('./profiles');
const { checkVerbatim } = require('../text/verbatim');

const LESSON = `# خطة الدرس: أسرتي (صفحة 32) — الصف الأول

## الأهداف التعليمية ومعايير النجاح
يتعرف التلميذ على كلمات أفراد الأسرة الخمس ويربط كل كلمة بصورتها الصحيحة.

### جدول المفردات الأساسية
| الكلمة | المعنى |
|--------|--------|
| أَبِي | والد التلميذ |
| أُمِّي | والدة التلميذ |

## خطة الدرس

#### Engage (الإحماء والتشويق) — 8-10 دقائق
يبدأ المعلم بالنظر إلى صفحة 32 من الكتاب مباشرة كنشاط تمهيدي.
\`\`\`
أُسْرَتِي أُسْرَتِي
وَإِيمَان تُحِبُّنِي
\`\`\`

#### Explore (الاستكشاف) — 15-20 دقيقة
- يوزع المعلم بطاقات الكلمات على المجموعات
- يطابق التلميذ كل كلمة بصورتها

#### Practice (التطبيق) — 10-15 دقيقة
يحل التلميذ التدريب الأول مع المعلم ثم يكمل الثاني بنفسه.

#### Assess & Close (التقييم والختام) — 5-10 دقائق
يشير التلميذ إلى الكلمة المطلوبة ويقرأها بصوت مسموع.

## FOR TEACHER ONLY — ANSWER KEY
- السؤال 1: يُقيَّم شفهياً — 3 علامات.
- السؤال 2: MODEL ANSWER: "أَبِي" = 2 علامة.
`;

test('a raw markdown lesson becomes a guide with no model call', () => {
  const g = buildGuideFromMarkdown(LESSON, { region: 'ye', locale: 'ar', subject: 'اللغة العربية' });
  const ids = g.sections.map((s) => s.id);
  // 'notes' is supplied by the DESIGN, not by the lesson text: the pack declares that every
  // plan carries the teacher's after-lesson notes, and where. It used to be drawn as
  // pseudo-element chrome hanging off the assessment stage, which is why it was invisible
  // to this contract — and why its badge ended up outside its own box.
  assert.deepStrictEqual(ids, ['lesson-line', 'goal', 'stage-tamhid', 'stage-arad',
    'stage-tatbiq', 'stage-taqwim', 'notes', 'solutions', 'glossary']);
  const notes = g.sections.find((x) => x.id === 'notes');
  assert.strictEqual(notes.type, 'notes');
  assert.ok(!notes.body, 'it carries no lesson text — it is writing space');
  assert.strictEqual(g.meta.region, 'ye');
  assert.match(g.meta.title, /دليل الدرس اليومي/);
});

test('the lesson text arrives verbatim', () => {
  const g = buildGuideFromMarkdown(LESSON, { region: 'ye', locale: 'ar' });
  const blob = JSON.stringify(g);
  // the chant, inside a fenced block in the source, survives word for word
  assert.match(blob, /أُسْرَتِي أُسْرَتِي/);
  assert.match(blob, /وَإِيمَان تُحِبُّنِي/);
  // and the verbatim checker agrees, which is the same check the Studio logs
  const r = checkVerbatim(g, { text: LESSON }, {});
  assert.strictEqual(r.deviations.length, 0,
    'code mapping must produce zero deviations: ' + JSON.stringify(r.deviations.map((d) => d.missing)));
});

test('a role the lesson does not provide is left out, not invented', () => {
  const g = buildGuideFromMarkdown(LESSON, { region: 'ye', locale: 'ar' });
  const ids = g.sections.map((s) => s.id);
  // this lesson has no misconception pair and no multigrade block
  assert.ok(!ids.includes('errors'), 'a misconception card was invented');
  assert.ok(!ids.includes('multigrade'), 'a multigrade block was invented');
});

test('stage times and gradual-release pills come from the source headings', () => {
  const g = buildGuideFromMarkdown(LESSON, { region: 'ye', locale: 'ar' });
  const tamhid = g.sections.find((s) => s.id === 'stage-tamhid');
  // duration and teaching mode are SEPARATE slots now: the stage component renders them as
  // two pills (DurationPill, TeachingModePill), so they are no longer one joined string.
  // THE SOURCE'S OWN UNIT WORD. Arabic inflects it — «٥ دقائق», «١٥ دقيقة» — and printing
  // the profile's single form made the pill say «٥ دقيقة» where the lesson said «٥ دقائق».
  assert.match(tamhid.time, /١٠ دقائق/, 'minutes parsed from «8-10 دقائق», in the source\'s own word');
  assert.match(tamhid.mode, /أنا أفعل/);
});

test('Explore and Explain both reach العرض, as activities of the one stage card', () => {
  // ONE STAGE, ONE CARD (profile flag oneCardPerStage) — the approved pages compose a stage
  // as a single large teaching card holding its activities, not as a card per source block.
  // What must never change is that no source block is dropped.
  const two = LESSON.replace('#### Practice', '#### Explain (الشرح) — 10 دقائق\nيشرح المعلم الفرق بين الكلمات.\n\n#### Practice');
  const g = buildGuideFromMarkdown(two, { region: 'ye', locale: 'ar' });
  const arad = g.sections.filter((s) => s.id === 'stage-arad');
  assert.strictEqual(arad.length, 1, 'one stage, one card');
  assert.ok(arad[0].activities.length >= 2, 'each source block becomes an activity in it');
  const blob = JSON.stringify(arad[0]);
  assert.match(blob, /Explore|الاستكشاف/);
  assert.match(blob, /Explain|الشرح/);
  assert.match(blob, /يشرح المعلم الفرق بين الكلمات/, 'the second block keeps its text');
});

test('each labelled part becomes an activity block inside its stage card', () => {
  // A card per labelled part put the numbered exercise label in the stage TAB, where a
  // 44-character heading pushed the duration and mode pills clean outside the card, and it
  // produced two cards both tabbed «التطبيق». The label belongs inside the card, above its
  // own activity; the tab carries the stage name only.
  const withParts = LESSON.replace(
    'يبدأ المعلم بالنظر إلى صفحة 32 من الكتاب مباشرة كنشاط تمهيدي.',
    '**نشاط الافتتاح:** يبدأ المعلم بالنظر إلى صفحة 32.\n\n**السؤال الجوهري:** من هم أفراد أسرتك؟');
  const g = buildGuideFromMarkdown(withParts, { region: 'ye', locale: 'ar' });
  const cards = g.sections.filter((s) => s.id === 'stage-tamhid');
  assert.strictEqual(cards.length, 1, 'one card for the stage');
  const card = cards[0];
  assert.strictEqual(card.type, 'stage');
  assert.strictEqual(card.heading, 'التمهيد', 'the tab carries the stage name and nothing else');
  assert.ok(card.activities.length >= 2, 'one activity per labelled part');
  assert.match(card.activities[0].label, /نشاط الافتتاح/);
  assert.match(card.activities[1].label, /السؤال الجوهري/);
  assert.match(card.time, /١٠ دقائق/, 'the card carries the duration pill, in the source\'s word');
  assert.match(card.mode, /أنا أفعل/, '…and the teaching-mode pill');
  assert.ok(card.activities.every((a) => !a.time && !a.mode),
    'the pills belong to the stage, not to each activity');
});

test('every stage that can carry a visual gets one', () => {
  // Text after text was the complaint. A stage with a chant, a list, a table or an
  // arithmetic run must render a code figure built from those same words — now on the
  // activity that owns it.
  const g = buildGuideFromMarkdown(LESSON, { region: 'ye', locale: 'ar' });
  const figOf = (id) => {
    const sec = g.sections.find((s) => s.id === id);
    return sec && (sec.codeFigure
      || (sec.activities || []).map((a) => a.codeFigure).find(Boolean));
  };
  const chant = figOf('stage-tamhid');
  assert.ok(chant, 'the fenced chant should become a figure');
  assert.strictEqual(chant.kind, 'steps');
  assert.match(JSON.stringify(chant), /أُسْرَتِي/, 'built from the chant lines');
  assert.ok(figOf('stage-arad'), 'a bulleted stage should become a figure');
});

test('the vocabulary table becomes the glossary', () => {
  const rows = tableRows('| الكلمة | المعنى |\n|---|---|\n| أَبِي | والد التلميذ |');
  assert.deepStrictEqual(rows, [{ label: 'أَبِي', value: 'والد التلميذ' }]);
});

test('headings route to roles, and an unknown heading routes nowhere', () => {
  // roleOf takes the PROFILE that is doing the reading. It used to have Yemen's patterns
  // compiled into it, which is the whole reason a Kenyan heading matched nothing.
  assert.strictEqual(roleOf('#### Engage (الإحماء)', 'ye'), 'stage-tamhid');
  assert.strictEqual(roleOf('## FOR TEACHER ONLY — ANSWER KEY', 'ye'), 'solutions');
  assert.strictEqual(roleOf('### جدول المفردات الأساسية', 'ye'), 'glossary');
  assert.strictEqual(roleOf('### مستويات الأداء (Grade Bands)', 'ye'), null);
  // and the same headings mean nothing to the Kenya profile, which is correct
  assert.strictEqual(roleOf('#### Engage (الإحماء)', 'ke'), null);
});

test('list items keep their whole text', () => {
  const items = listItems('- يوزع المعلم بطاقات الكلمات على المجموعات\n- يطابق التلميذ كل كلمة بصورتها');
  assert.strictEqual(items.length, 2);
  assert.strictEqual(items[0], 'يوزع المعلم بطاقات الكلمات على المجموعات');
});

test('a lesson with no headings fails loudly instead of guessing', () => {
  assert.throws(() => buildGuideFromMarkdown('just some prose with no headings at all'),
    /no lesson headings found/);
});

// ── Kenya (CBC) ──────────────────────────────────────────────────────────────────────
// Everything below is the regression set for the Kenya failure: a pasted CBC lesson has
// no '#' markers, none of its headings are Yemen's, and its rubric levels are not the
// four English words the renderer used to key its colours to.

const CBC = `Grade 5 · Science and Technology

Strand: Living things and their environment
Sub-Strand: The Breathing System

Lesson Learning Outcomes
By the end of the lesson, the learner should be able to:
a) Identify the main parts of the human breathing system from a chart.
b) Describe the functions of each part of the human breathing system to peers.

Key Inquiry Question(s)
- How does the breathing system help us stay alive?

Learning Resources
Chart, Model of the breathing system; Balloons; Flashcards

Introduction (5 minutes)
Learners are guided to carry out an activity on breathing in and out.

Lesson Development (18 minutes)
Step 1: Learners are guided to study the chart on human breathing system.
Step 2: learners are guided to discuss in groups on how to label the parts.

Conclusion (5 minutes)
Learners are guided to respond to oral questions on how to keep their breathing system healthy.

Assessment Questions (to be captured in the teacher's notes) (5 minutes)
a) Name 4 parts of the human breathing system
b) What is the work of the lungs

Extended Activities
Learners to draw and label the human Breathing System in their exercise books.

Reflection
`;

test('a CBC lesson with BARE headings (no # anywhere) is read, not rejected', () => {
  assert.ok(!/^#/m.test(CBC), 'the fixture must carry no markdown headings');
  const g = buildGuideFromMarkdown(CBC, { region: 'ke' });
  assert.strictEqual(g.sourceProfile.mode, 'bare');
  const ids = g.sections.map((s) => s.id);
  for (const id of ['admin', 'outcomes', 'inquiry', 'resources', 'introduction',
    'development', 'conclusion', 'assessment', 'extended', 'reflection']) {
    assert.ok(ids.includes(id), `CBC role ${id} is missing from the guide`);
  }
  // Strand and Sub-Strand are the two rows of the identifying table, not two cards
  const admin = g.sections.find((s) => s.id === 'admin');
  assert.deepStrictEqual(admin.items.map((x) => x.label), ['Strand', 'Sub-Strand']);
  assert.match(admin.items[0].value, /Living things and their environment/);
});

test('Kenya content is not dressed as Yemen content', () => {
  const g = buildGuideFromMarkdown(CBC, { region: 'ke' });
  const blob = JSON.stringify(g);
  assert.ok(!/[\u0600-\u06FF]/.test(blob), 'no Arabic may appear in a Kenyan guide');
  const ids = g.sections.map((s) => s.id);
  for (const yemenOnly of ['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim',
    'goal', 'multigrade', 'homework']) {
    assert.ok(!ids.includes(yemenOnly), `Yemen role ${yemenOnly} was forced onto a CBC lesson`);
  }
  assert.strictEqual(g.meta.locale, 'en');
  assert.strictEqual(g.meta.title, 'The Breathing System', 'the Sub-Strand names the lesson');
  assert.strictEqual(g.meta.grade, 'Grade 5');
});

test('the CBC roles keep the source order, and its own steps become its own cards', () => {
  const g = buildGuideFromMarkdown(CBC, { region: 'ke' });
  const ids = g.sections.map((s) => s.id);
  assert.ok(ids.indexOf('outcomes') < ids.indexOf('introduction'));
  assert.ok(ids.indexOf('introduction') < ids.indexOf('development'));
  assert.ok(ids.indexOf('development') < ids.indexOf('conclusion'));
  assert.ok(ids.indexOf('conclusion') < ids.indexOf('assessment'));
  const dev = g.sections.filter((s) => s.id === 'development');
  assert.strictEqual(dev.length, 2, 'Step 1 and Step 2 are two cards');
  assert.match(dev[0].heading, /Step 1/);
  assert.match(dev[0].time, /18 min/);
  assert.ok(!/Introduction · Introduction/.test(JSON.stringify(g.sections)),
    'a card must not repeat the role name it already carries');
});

test('nothing in a CBC lesson is rewritten', () => {
  const g = buildGuideFromMarkdown(CBC, { region: 'ke' });
  const r = checkVerbatim(g, { text: CBC }, {});
  assert.strictEqual(r.deviations.length, 0,
    'deviations: ' + JSON.stringify(r.deviations.map((d) => d.missing)));
  // the lead line above the outcomes list is text too, and used to be dropped
  assert.match(JSON.stringify(g.sections),
    /By the end of the lesson, the learner should be able to/);
});

test('the region can be detected from the text when the picker says nothing', () => {
  assert.strictEqual(buildGuideFromMarkdown(CBC, {}).sourceProfile.id, 'ke');
  assert.strictEqual(buildGuideFromMarkdown(LESSON, {}).sourceProfile.id, 'ye');
  // and a declared region always wins over detection
  assert.strictEqual(buildGuideFromMarkdown(CBC, { region: 'ke' }).sourceProfile.id, 'ke');
});

// ── Kenya, in Kiswahili ──────────────────────────────────────────────────────────────
// The CBC form exists in Kiswahili with the same roles in the same order. That is a
// LANGUAGE VARIANT of the Kenya profile, not another region, and the variant is chosen by
// the text. Fixture below: the repo's own Kiswahili demo lesson
// (assets/content/lesson-kiswahili-demo.sw.json) reflowed as a raw paste, so the words
// are the repo's, not invented for the test.

const CBC_SW = `Darasa la 1 · Hisabati

Mada Ndogo: Kuhesabu 1 hadi 10

Malengo ya Somo
a) Kuhesabu vitu kutoka 1 hadi 10.
b) Kuandika namba 1 hadi 10.

Utangulizi (Dakika 5)
Mwalimu anaonyesha mawe na wanafunzi wanahesabu pamoja kwa sauti.

Hatua za Somo (Dakika 20)
Hatua ya 1: Hesabu mawe kwa sauti pamoja na wanafunzi.
Hatua ya 2: Andika namba ubaoni na wanafunzi waandike madaftarini.

Hitimisho (Dakika 5)
Wanafunzi wanahesabu kwa sauti kutoka 1 hadi 10 pamoja.

Tathmini
a) Hesabu mawe matano.
b) Andika namba tatu.

Shughuli za Ziada
Wanafunzi wahesabu vitu vitano nyumbani.

Tafakari
`;

test('every Kiswahili CBC heading routes to its role', () => {
  const p = resolveProfile('ke', CBC_SW);
  // A Kenyan Kiswahili plan carries THREE curriculum levels — Suala 1.0 → Mada 1.1 →
  // Mada Ndogo 1.1.1 — and the innermost one names the lesson. The first version of this
  // test pinned «Mada Ndogo» to sub-strand, which is one level out: it made the document
  // title the sub-strand ("Kusikiliza na Kuzungumza") instead of the lesson
  // ("Maamkizi na Maagano").
  const expected = [
    ['Suala', 'strand'],
    ['Mada Kuu', 'strand'],
    ['Mada', 'sub-strand'],
    ['Mada Ndogo', 'lesson-topic'],
    ['Muhtasari wa Sekunde 30', 'summary'],
    ['SHULE:', 'admin-form'],
    ['Maelezo ya Kurekebisha', 'remediation'],
    ['Ukuaji wa Somo', 'development'],
    ['Ukuzaji wa Somo', 'development'],
    ['Swali/Maswali Muhimu ya Uchunguzi', 'inquiry'],
    ['Matokeo ya Kujifunza', 'outcomes'],
    ['Malengo ya Somo', 'outcomes'],
    ['Maswali Muhimu ya Udadisi', 'inquiry'],
    ['Nyenzo za Kujifunza', 'resources'],
    ['Utangulizi', 'introduction'],
    ['Ukuzaji wa Somo', 'development'],
    ['Hatua za Somo', 'development'],
    ['Hitimisho', 'conclusion'],
    ['Shughuli za Ziada', 'extended'],
    ['Tathmini', 'assessment'],
    ['Rubriki ya Tathmini', 'rubric'],
    ['Tafakari', 'reflection'],
  ];
  for (const [heading, role] of expected) {
    assert.strictEqual(roleOf(heading, p), role, `«${heading}» should be ${role}`);
  }
  // and the English headings still work, because a Kiswahili plan often leaves one or
  // two of them in English
  assert.strictEqual(roleOf('Assessment Rubric', p), 'rubric');
  assert.strictEqual(roleOf('Learning Resources', p), 'resources');
});

test('a Kiswahili CBC lesson renders as Kiswahili, in the Kenya region', () => {
  const g = buildGuideFromMarkdown(CBC_SW, { region: 'ke' });
  assert.match(g.sourceProfile.name, /Kiswahili/);
  assert.strictEqual(g.meta.locale, 'sw', 'the locale follows the language of the source');
  assert.strictEqual(g.meta.region, 'ke');
  assert.strictEqual(g.meta.title, 'Kuhesabu 1 hadi 10');
  assert.strictEqual(g.meta.grade, 'Darasa la 1');
  assert.match(g.meta.subtitle, /Jamhuri ya Kenya/);
  const headings = g.sections.map((s) => s.heading).join(' | ');
  assert.match(headings, /Matokeo ya Kujifunza/);
  assert.match(headings, /Ukuz?aji wa Somo/);
  assert.match(headings, /Hitimisho/);
  assert.match(headings, /Tathmini/);
  // no English card titles leak into a Kiswahili document
  for (const english of ['Lesson Learning Outcomes', 'Lesson Development', 'Conclusion',
    'Assessment', 'Extended Activities', 'Reflection', '30-Second Summary',
    'Remediation Notes']) {
    assert.ok(!headings.includes(english), `English card title «${english}» leaked`);
  }
  assert.ok(!/[\u0600-\u06FF]/.test(JSON.stringify(g)), 'no Arabic in a Kenyan guide');
  const dev = g.sections.filter((s) => s.id === 'development');
  assert.ok(dev.length >= 2, 'the source\'s own Hatua become their own cards');
  assert.match(dev[0].time, /Dakika 20/, 'minutes read and printed the Kiswahili way round');
  const r = checkVerbatim(g, { text: CBC_SW }, {});
  assert.strictEqual(r.deviations.length, 0,
    'deviations: ' + JSON.stringify(r.deviations.map((d) => d.missing)));
});

test('adding Kiswahili did not turn English CBC lessons Kiswahili', () => {
  const g = buildGuideFromMarkdown(CBC, { region: 'ke' });
  assert.strictEqual(g.meta.locale, 'en');
  assert.ok(!/Kiswahili/.test(g.sourceProfile.name));
  const headings = g.sections.map((s) => s.heading).join(' | ');
  assert.match(headings, /Lesson Learning Outcomes/);
  assert.ok(!headings.includes('Matokeo ya Kujifunza'));
});

test('a rubric keeps the source level names and reads levels in order', () => {
  const rows = rubricItems('| Level | Descriptor |\n|---|---|\n'
    + '| Exceeding Expectation | Names all four parts unaided |\n'
    + '| Meeting Expectation | Names three parts |\n'
    + '| Approaching Expectation | Names two parts |\n'
    + '| Below Expectation | Names one part with help |');
  assert.strictEqual(rows.length, 4);
  assert.strictEqual(rows[0].level, 'Exceeding Expectation');
  assert.strictEqual(rows[3].level, 'Below Expectation');
  // and the «Level — descriptor» line form a teacher is likelier to paste
  const lines = rubricItems('Level 4 — Names all four parts unaided\n'
    + 'Level 3 — Names three parts\nLevel 2 — Names two parts');
  assert.deepStrictEqual(lines.map((x) => x.level), ['Level 4', 'Level 3', 'Level 2']);
});
