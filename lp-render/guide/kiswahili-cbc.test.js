'use strict';
// The Kenyan CBC lesson plan as it is actually written in Kiswahili, and the six defects
// a real Grade 1 Kiswahili lesson (Maamkizi na Maagano) exposed that the English CBC
// lesson never could. Every fixture line below is from that lesson.
const test = require('node:test');
const assert = require('node:assert');
const { buildGuideFromMarkdown, roleOf, listItems, rubricItems } = require('./from-markdown');
const { resolveProfile } = require('./profiles');
const { checkVerbatim } = require('../text/verbatim');

const LESSON = `Muhtasari wa Sekunde 30

Kile wanafunzi watakachofanya kufikia mwisho:
Wanafunzi wataweza kuamkua na kuitikia maamkizi ipasavyo ili kufanikisha mawasiliano.

Muda wote / Muda wa maandalizi:
dakika 30 / muda wa maandalizi hauzidi 20% ya muda wa somo.

SHULE: __________________

ENEO LA KUJIFUNZA: Kiswahili

DARASA: 1

MUDA: dakika 30

IDADI:
WAVULANA ___
WASICHANA ___
JUMLA ___

Nambari ya TSC: __________________

Suala: 1.0 Darasani

Mada: 1.1 Kusikiliza na Kuzungumza

Mada Ndogo: 1.1.1 Maamkizi na Maagano

Matokeo ya Kujifunza ya Somo

a) kutambua maneno yanayotumiwa katika maamkizi.

Swali/Maswali Muhimu ya Uchunguzi

Je, kwa nini ni vizuri kumsalimu mwenzako?

Nyenzo za Kujifunza

• Kadi za maneno ya maamkizi
• Chati ya maamkizi

Utangulizi (dakika 4)

• Mwalimu anaanza na mfano wa maisha halisi:
“Fikiria - unapokutana na mwenzako asubuhi, unamsalimu vipi?
Tuseme pamoja: ‘Hujambo?’”
(Wanafunzi wanajibu kwa mfano yao wenyewe.)

• Ukaguzi wa haraka wa sekunde 30:
“Sikiliza: ‘Hujambo?’ - Sasa jibu: ‘Sijambo.’”
(Wanafunzi wanajibu.)

Ukuaji wa Somo (dakika 22)

Hatua

• Mazoezi ya pamoja:
darasa zima linafanya mazoezi ya kuoanisha maamkizi na majibu yake sahihi
(Hujambo?-Sijambo, Hamjambo?-Hatujambo, Habari?-Nzuri).

Hitimisho (dakika 1)

• Ukaguzi wa Kujitathmini:
Onyesha vidole - vitano kama unaweza kusalimu kwa ujasiri.

• Maswali ya mdomo ya kufunga somo:
Tunasemaje tunaposalimu mwalimu?

Shughuli za Ziada (dakika 3)

• Wanafunzi waliofikia lengo kikamilifu:
nyumbani, waamkue mwanafamilia kwa maamkizi mapya ambayo hayakutumika darasani leo.

• Wanafunzi walio chini ya lengo:
waonyeshe mwanafamilia jinsi ya kusema ‘Hujambo?’ na kujibu ‘Sijambo.’

Tafakari

____% ya wanafunzi waliweza kutumia maamkizi na majibu yake kwa usahihi.

Maelezo ya Kurekebisha

• Ikiwa wanafunzi hawajafaulu ukaguzi wa awali:
rudia shughuli ya kutambua maamkizi kwenye picha mara moja zaidi kama darasa zima.

Vigezo vya Tathmini

Kuzidi Matarajio:
Anatambua na kutumia maamkizi na majibu yake kwa usahihi na kwa ujasiri, bila mfano.

Kufikia Matarajio:
Anatambua na kutumia maamkizi na majibu yake kwa usahihi katika mazoezi ya pamoja.

Kukaribia Matarajio:
Anatambua baadhi ya maamkizi kwa usahihi, au anatumia kwa msaada.

Chini ya Matarajio:
Anahitaji msaada mkubwa kutambua au kutumia maamkizi.
`;

const guide = () => buildGuideFromMarkdown(LESSON, { region: 'ke' });

test('the three curriculum levels are three levels, and the innermost names the lesson', () => {
  // Suala 1.0 → Mada 1.1 → Mada Ndogo 1.1.1. Reading «Mada Ndogo» as the sub-strand is
  // one level out, and it titled the document with the sub-strand instead of the lesson.
  const p = resolveProfile('ke', LESSON);
  assert.strictEqual(roleOf('Suala', p), 'strand');
  assert.strictEqual(roleOf('Mada', p), 'sub-strand');
  assert.strictEqual(roleOf('Mada Ndogo', p), 'lesson-topic');
  assert.strictEqual(guide().meta.title, '1.1.1 Maamkizi na Maagano');
});

test('the fill-in form becomes one identifying card, with its first row named', () => {
  const admin = guide().sections.find((s) => s.id === 'admin');
  assert.ok(admin, 'the form should produce an identifying card');
  const rows = new Map(admin.items.map((i) => [i.label, i.value]));
  // «SHULE: ______» is read as a heading whose content is the blank, so without seeding
  // the heading back in as the label this row rendered as bare underscores.
  assert.strictEqual(rows.get('SHULE'), '__________________');
  assert.strictEqual(rows.get('ENEO LA KUJIFUNZA'), 'Kiswahili');
  assert.strictEqual(rows.get('DARASA'), '1');
  assert.strictEqual(rows.get('Nambari ya TSC'), '__________________');
  // a colon-label whose values are on the following lines keeps all of them
  assert.strictEqual(rows.get('IDADI'), 'WAVULANA ___ WASICHANA ___ JUMLA ___');
  // and the three curriculum levels join the same card
  assert.strictEqual(rows.get('Suala'), '1.0 Darasani');
  assert.strictEqual(rows.get('Mada Ndogo'), '1.1.1 Maamkizi na Maagano');
});

test('grade and learning area are read from the form, not from a title line', () => {
  const g = guide();
  assert.strictEqual(g.meta.grade, '1');
  assert.strictEqual(g.meta.subject, 'Kiswahili');
  assert.deepStrictEqual(g.meta.chips,
    [{ label: 'Somo', value: 'Kiswahili' }, { label: 'Darasa', value: '1' }]);
});

test('a card title never begins inside the teacher\'s own words', () => {
  // «Tuseme pamoja:» and «“Sikiliza:» sit inside a multi-line quotation. Read as labels,
  // they tore one piece of teacher speech into three cards, one titled with an opening
  // quote mark.
  const intro = guide().sections.filter((s) => s.id === 'introduction');
  assert.strictEqual(intro.length, 2, 'two bulleted parts, not five');
  for (const s of intro) {
    assert.ok(!/[“”‘’]/.test(s.heading.split('·').pop()),
      `a quote glyph reached a card title: ${s.heading}`);
    assert.ok(!/Tuseme pamoja$/.test(s.heading), `split inside a quotation: ${s.heading}`);
  }
  // the quotation itself survives whole, in one card
  assert.match(JSON.stringify(intro),
    /Fikiria - unapokutana na mwenzako asubuhi, unamsalimu vipi\? Tuseme pamoja: ‘Hujambo\?’/);
});

test('a prose line is not promoted to a heading just for containing a role word', () => {
  // Kiswahili role names are ordinary words. «darasa zima linafanya mazoezi ya
  // kuoanisha…» contains "mazoezi" and «Maswali ya mdomo ya kufunga somo:» contains
  // "kufunga somo" — with a 44-character window both became headings, splitting a
  // sentence in half and pulling the closing questions out of Hitimisho.
  const g = guide();
  const dev = g.sections.filter((s) => s.id === 'development');
  assert.ok(dev.some((s) => /Mazoezi ya pamoja/.test(s.heading)),
    'the bulleted label IS a card title');
  assert.ok(!dev.some((s) => /darasa zima linafanya/.test(s.heading)),
    'but the sentence under it is not');
  const conc = g.sections.filter((s) => s.id === 'conclusion');
  assert.strictEqual(conc.length, 2);
  assert.ok(conc.some((s) => /Maswali ya mdomo ya kufunga somo/.test(s.heading)),
    'the closing questions stay inside Hitimisho as one of its cards');
  // and the source's own bullet is not part of any title
  for (const s of g.sections) {
    assert.ok(!/[•▪]/.test(s.heading), `a bullet glyph reached a card title: ${s.heading}`);
  }
});

test('a bulleted label keeps the lines underneath it', () => {
  // Taking only the marked lines dropped every second line of these two sections.
  const g = guide();
  const ext = g.sections.find((s) => s.id === 'extended');
  assert.match(JSON.stringify(ext.items),
    /nyumbani, waamkue mwanafamilia kwa maamkizi mapya/);
  assert.match(JSON.stringify(ext.items), /waonyeshe mwanafamilia jinsi ya kusema/);
  const rem = g.sections.find((s) => s.id === 'remediation');
  assert.match(JSON.stringify(rem.items), /rudia shughuli ya kutambua maamkizi/);
  // …and only lines that a colon actually introduces
  assert.deepStrictEqual(
    listItems('- kwanza\n**Kichwa kidogo:**\n- pili\nendelea hapa'),
    ['kwanza', 'pili'],
    'a bold sub-heading between bullets is not folded into either of them');
  assert.deepStrictEqual(
    listItems('- kwanza:\nendelea hapa\n\n- pili'),
    ['kwanza: endelea hapa', 'pili']);
});

test('a rubric written level-then-descriptor keeps its ramp', () => {
  const rb = guide().sections.find((s) => s.id === 'rubric');
  assert.strictEqual(rb.type, 'rubric', 'not a plain text card');
  assert.deepStrictEqual(rb.items.map((i) => i.level),
    ['Kuzidi Matarajio', 'Kufikia Matarajio', 'Kukaribia Matarajio', 'Chini ya Matarajio']);
  assert.match(rb.items[3].desc, /Anahitaji msaada mkubwa/);
  // the same shape read directly
  assert.strictEqual(rubricItems('Kuzidi Matarajio:\nvizuri sana\n\nChini ya Matarajio:\nmsaada').length, 2);
});

test('the 30-second summary becomes the design\'s summary card', () => {
  const sum = guide().sections.find((s) => s.id === 'summary');
  assert.strictEqual(sum.type, 'summary');
  assert.strictEqual(sum.heading, 'Muhtasari wa Sekunde 30');
  assert.strictEqual(sum.items[0].label, 'Kile wanafunzi watakachofanya kufikia mwisho');
  assert.match(sum.items[0].body, /^Wanafunzi wataweza kuamkua/);
});

test('nothing in the lesson is rewritten, and it stays Kiswahili', () => {
  const g = guide();
  assert.strictEqual(g.meta.locale, 'sw');
  assert.strictEqual(g.meta.region, 'ke');
  assert.ok(!/[؀-ۿ]/.test(JSON.stringify(g)), 'no Arabic in a Kenyan guide');
  for (const yemenOnly of ['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim',
    'goal', 'multigrade', 'homework']) {
    assert.ok(!g.sections.some((s) => s.id === yemenOnly),
      `Yemen role ${yemenOnly} was forced onto a Kiswahili CBC lesson`);
  }
  const r = checkVerbatim(g, { text: LESSON }, {});
  assert.strictEqual(r.deviations.length, 0,
    'deviations: ' + JSON.stringify(r.deviations.map((d) => d.missing)));
});

test('times are read and printed the Kiswahili way round', () => {
  const g = guide();
  assert.match(g.sections.find((s) => s.id === 'introduction').time, /Dakika 4/);
  assert.match(g.sections.find((s) => s.id === 'development').time, /Dakika 22/);
  assert.match(g.sections.find((s) => s.id === 'conclusion').time, /Dakika 1/);
});
