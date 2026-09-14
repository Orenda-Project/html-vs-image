'use strict';
// ONE LESSON, ONE ILLUSTRATION — AND IT IS ABOUT THAT LESSON.
//
// A reviewer opened fifteen rendered Yemen LPs and found the same picture on all of them: a
// standing teacher, children in a ring, a mud-brick fortress behind. They read it as a cache
// collision — the same asset-store key being reached from unrelated lessons.
//
// It was not. The keys differed, the files differed, and every lesson had its own image. The
// fault was in the BRIEF: it was one fixed English sentence, «children and their teacher in a
// simple classroom, engaged in an activity about <goal>», with the lesson's ARABIC goal
// interpolated. A model cannot act on an Arabic clause inside an English prompt, so fifteen
// briefs that differed only in a clause it could not read produced fifteen renderings of the
// same generic scene. The cache was working perfectly and faithfully storing them.
//
// So this file pins BOTH halves of the guarantee, because either one alone is passable while
// the output is wrong:
//
//   1. the briefs must differ, and differ in the part the model actually reads;
//   2. the keys must differ, so nothing unrelated can resolve to one cached picture.
//
// It also pins the Arabic-boundary rule that the scene lookup depends on, and the fallback's
// honesty: a topic the region has not declared a scene for gets the plain classroom rather
// than a picture of something the lesson never mentions.
const test = require('node:test');
const assert = require('node:assert');
const { buildGuideFromMarkdown } = require('../guide/from-markdown');
const { artCacheKey } = require('../pipeline');
const { PROFILES } = require('../guide/profiles');

// Six of the document's lessons, each a different subject, trimmed to the parts the scene
// lookup reads: the goal, the errors line and the warm-up. Real source wording throughout.
const LESSONS = {
  division: `الهدف: أستطيع إيجاد ناتج القسمة على ٢ و٣ و٤ و٥ وربط القسمة بالضرب والطرح.
المواد: السبورة، الطباشير، حصى، أغطية زجاجات.

التمهيد (٥ دقائق)

يطلب المعلم من تلميذ إحضار ٦ أغطية زجاجات وتوزيعها بالتساوي على تلميذين.`,
  fractions: `الهدف: أستطيع التعرف على الكسور (١/٢، ١/٣، ١/٤) وتمثيلها وكتابتها في الأشكال.
المواد: السبورة، الطباشير، أغطية زجاجات.

التمهيد (٥ دقائق)

يطلب المعلم من تلميذ تقسيم قطعة من الورق بالتساوي بين زميلين.`,
  plants: `الهدف: أستطيع تسمية أجزاء النبات وتحديد وظائفها ومراحل نموه.
المواد: السبورة، الطباشير، كتاب التلميذ.

التمهيد (٥ دقائق)

يسأل المعلم: من منكم لديه نبات في منزله؟ ماذا تفعلون لكي لا يذبل؟`,
  ablution: `الهدف: أستطيع أن أطبق خطوات الوضوء الصحيحة بالترتيب.
المواد: السبورة، الطباشير، كتاب التلميذ.

التمهيد (٥ دقائق)

سؤال: ماذا نفعل قبل أن نقف بين يدي الله في الصلاة؟`,
  sight: `الهدف: أستطيع استخدام عيني للوصف والتمييز والعناية بنعمة البصر.
المواد: السبورة، الطباشير، أغطية زجاجات ملونة.

التمهيد (٥ دقائق)

يطلب المعلم من التلاميذ إغلاق أعينهم لثوانٍ، ثم يسأل: هل ترون شيئاً؟`,
  road: `الهدف: أستطيع أن أطبق آداب المشي في الطريق وأميز السلوك الصحيح.
المواد: السبورة، الطباشير، كتاب التلميذ.

التمهيد (٥ دقائق)

سؤال: كيف تصلون إلى المدرسة؟ وهل تمشون في وسط الطريق أم على جانبه؟`,
};

const briefOf = (src) => {
  const g = buildGuideFromMarkdown(src, { region: 'ye' });
  const im = (g.images || [])[0];
  assert.ok(im, 'every one of these lessons has a warm-up and so earns an illustration');
  return im;
};

test('each lesson briefs its own scene, and no two briefs are the same', () => {
  const briefs = new Map();
  for (const [name, src] of Object.entries(LESSONS)) {
    const im = briefOf(src);
    const scene = im.prompt.split('. The composition')[0];
    const clash = [...briefs.entries()].find(([, s]) => s === scene);
    assert.ok(!clash, `${name} briefs the same scene as ${clash && clash[0]}: «${scene}»`);
    briefs.set(name, scene);
  }
  assert.strictEqual(briefs.size, Object.keys(LESSONS).length);
});

test('the brief the model reads is English — the topic never goes into it', () => {
  // This is the actual defect. A brief carrying the Arabic goal LOOKS specific and reads as
  // generic to the model, which is how fifteen lessons ended up with one picture while every
  // key and every file differed.
  for (const [name, src] of Object.entries(LESSONS)) {
    const im = briefOf(src);
    assert.ok(!/[؀-ۿ]/.test(im.prompt),
      `${name}: the brief must contain no Arabic, or the model cannot act on it — got «${im.prompt}»`);
    assert.ok(/[؀-ۿ]/.test(String(im.topic || '')),
      `${name}: the lesson's own topic must still travel, as data for the key and the caption`);
  }
});

test('two lessons can never resolve to one cached illustration', () => {
  const keys = new Map();
  for (const [name, src] of Object.entries(LESSONS)) {
    const im = briefOf(src);
    const key = artCacheKey(im.prompt, { region: 'ye', locale: 'ar', topic: im.topic });
    const clash = [...keys.entries()].find(([, k]) => k === key);
    assert.ok(!clash, `${name} shares an asset key with ${clash && clash[0]}`);
    keys.set(name, key);
  }
});

test('a shared scene still gives each lesson its own asset, and re-rendering still hits cache', () => {
  // Two lessons that legitimately map to one declared scene must not share the picture —
  // that was the reviewer's requirement — while the SAME lesson re-rendered must still hit
  // the cache, or every re-render would spend credits again.
  const scene = 'children sharing a heap of coloured bottle caps into several equal piles';
  const a = artCacheKey(scene, { region: 'ye', locale: 'ar', topic: 'القسمة على ٢' });
  const b = artCacheKey(scene, { region: 'ye', locale: 'ar', topic: 'القسمة على ٥' });
  const again = artCacheKey(scene, { region: 'ye', locale: 'ar', topic: 'القسمة على ٢' });
  assert.notStrictEqual(a, b, 'different lessons, different asset');
  assert.strictEqual(a, again, 'the same lesson re-rendered must restore from the store');
});

test('a scene word must stand alone, not sit inside another word', () => {
  // «ربع» is inside «أربعات» and «أربعة», and JavaScript's \b is defined on ASCII so it can
  // never match at the edge of an Arabic word. Without a lookaround guard the division
  // lesson — which says «٣ أربعات» in its own answers — pulled the fraction scene.
  const div = briefOf(LESSONS.division);
  assert.match(div.prompt, /equal piles/,
    'the division lesson briefs the grouping scene, not one matched from a substring');
  assert.doesNotMatch(div.prompt, /paper circle/,
    'and specifically not the fractions scene, which «أربعات» would reach by substring');
});

test('a lesson that briefs an illustration gets exactly one', () => {
  // One contextual picture per lesson — the AI image supports the lesson, it does not
  // compete with the code-drawn teaching figures, which stay on their own stages.
  //
  // Deliberately NOT asserted here: whether a warm-up carrying its own concept figure
  // should suppress the illustration. The reviewer praised lp02 for exactly that shape, but
  // in the rendered set lp02 carries both, and I have not established which is intended —
  // so pinning it either way would be inventing a contract. Left for the reviewer to settle.
  for (const [name, src] of Object.entries(LESSONS)) {
    const g = buildGuideFromMarkdown(src, { region: 'ye' });
    assert.strictEqual((g.images || []).length, 1, `${name}: exactly one illustration`);
  }
});

test('an undeclared topic falls back to the plain classroom rather than inventing a subject', () => {
  const g = buildGuideFromMarkdown(
    `الهدف: أستطيع أن أتعرف على موضوع لم تعلنه المنطقة في جدول المشاهد.
المواد: السبورة.

التمهيد (٥ دقائق)

يسأل المعلم التلاميذ سؤالاً عاماً عن الدرس.`, { region: 'ye' });
  const im = (g.images || [])[0];
  assert.ok(im, 'a lesson with a warm-up still gets an illustration');
  assert.strictEqual(im.prompt.split('. The composition')[0], PROFILES.ye.sceneFallback,
    'an undeclared topic gets the declared fallback, not a guessed scene');
});

test('the region declares its scenes, so adding one needs no renderer change', () => {
  const ye = PROFILES.ye;
  assert.ok(Array.isArray(ye.sceneTerms) && ye.sceneTerms.length >= 10,
    'the scene table lives in the profile');
  assert.ok(typeof ye.sceneFallback === 'string' && ye.sceneFallback.length > 20);
  for (const [re, scene] of ye.sceneTerms) {
    assert.ok(re instanceof RegExp, 'each entry matches the lesson\'s own words');
    assert.ok(!/[؀-ۿ]/.test(scene),
      `a scene is what the model must draw, so it is English: «${scene}»`);
    assert.ok(scene.length > 25, `a scene must actually describe something: «${scene}»`);
  }
});
