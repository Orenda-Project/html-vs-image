'use strict';
// REGION PROFILES for the raw-text converter.
//
// The converter was written against one curriculum and quietly assumed it everywhere.
// Feeding it a Kenyan CBC lesson failed in five separate ways at once:
//
//   1. it only saw a heading if the line began with a Markdown '#', and a pasted CBC
//      lesson has bare heading lines — so it threw "no markdown headings found";
//   2. with '#' added by hand, none of the eleven CBC headings matched its patterns,
//      which are the Yemen 5E names and their Arabic equivalents — 0 of 11 recognised;
//   3. every card title came from an Arabic table, so a Kenyan English lesson was
//      labelled «درس»;
//   4. the section order it emitted was Yemen's twelve-role contract, so CBC roles like
//      Strand, Key Inquiry Question and Extended Activities had nowhere to go;
//   5. the labels around the content — page, minutes, the answer marker, the ✗/✓ pair —
//      were Arabic string literals in the mapper.
//
// A profile is the whole of what varies: which headings name which role, what each card
// is called, the order the roles appear in, the small labels around the content, and the
// document's own chrome. The converter itself is region-neutral and reads one of these.
//
// Adding a region means adding a profile — not editing the converter.

// ── Yemen: the دليل الدرس اليومي daily guide, 5E stages mapped onto four cards ──────
const YE = {
  id: 'ye',
  name: 'Yemen — دليل الدرس اليومي',
  locale: 'ar',
  // These patterns were built from the artifact lessons, whose headings are English 5E
  // names with an Arabic parenthetical («#### Engage (الإحماء والتشويق) — 8-10 دقائق»).
  // A lesson written with plain Arabic headings missed five of them, because Arabic
  // inflects and the patterns were exact:
  //   «الهدف» ≠ «الأهداف»            (singular against plural)
  //   «الأخطاء الشائعة» ≠ «أخطاء شائعة»  (the definite article on both words)
  //   «التقويم» ≠ «التقييم»            (a different word for assessment, and the one
  //                                     this pack has always PRINTED on the card)
  //   «المواد» and «بطاقة الخروج»       (no role existed for either)
  // Measured: 5 of 13 headings recognised, and التقويم's whole 279-character block was
  // being absorbed into التطبيق.
  roles: [
    // NOT \b AFTER AN ARABIC LETTER. JavaScript's \b is defined on ASCII word
    // characters, and Arabic letters are not among them, so /الهدف\b/ can never match:
    // at the end of «الهدف» both sides of the position are non-word. Measured — it
    // silently matched nothing at all. A negative lookahead for another Arabic letter
    // is the boundary that works, and it still refuses «الهدفان».
    ['goal', /الأهداف|الهدف(?![؀-ۿ])|معايير النجاح|objectives?|goals?/i],
    ['glossary', /المفردات|glossary|vocabulary/i],
    ['materials', /^\s*(?:ال)?مواد(?![؀-ۿ])|^\s*الوسائل|^\s*الأدوات|teaching aids|materials/i],
    ['errors', /أخطاء\s+(?:ال)?شائعة|(?:ال)?أخطاء\s+(?:ال)?شائعة|خطأ شائع|سوء فهم|misconception|common error/i],
    ['stage-tamhid', /\bengage\b|الإحماء|التشويق|التمهيد|warm[- ]?up/i],
    ['stage-arad', /\bexplore\b|الاستكشاف|\bexplain\b|الشرح|العرض|presentation/i],
    ['stage-tatbiq', /\bpractice\b|التطبيق|guided practice/i],
    ['stage-taqwim', /\bassess\b|التقييم|التقويم|الختام|closing|wrap[- ]?up/i],
    ['exit-ticket', /بطاقة الخروج|تذكرة الخروج|exit ticket/i],
    ['solutions', /answer key|الإجابة|الإجابات|الحل|نموذج الإجابة/i],
    ['multigrade', /متعدد الصفوف|multigrade|تكييف|differentiat/i],
    ['homework', /الواجب|واجب منزلي|homework|ركن المعلم/i],
  ],
  // roles that are not their own heading here — they sit as a bold label inside a stage
  lift: [
    ['homework', /الواجب المنزلي|homework|إعادة التعليم|ركن المعلم/i],
    ['multigrade', /scaffolding|المتعثرين|extension|المتقدمين|تكييف/i],
    ['errors-caption', /watch out|تنبيه|احذر/i],
  ],
  titles: {
    'lesson-line': 'درس',
    goal: 'الهدف',
    errors: 'أخطاء شائعة — انتبه لها',
    'errors-caption': 'ملاحظة',
    'stage-tamhid': 'التمهيد',
    'stage-arad': 'العرض',
    'stage-tatbiq': 'التطبيق',
    'stage-taqwim': 'التقويم والختام',
    solutions: 'الإجابات',
    glossary: 'مصطلحات',
    multigrade: 'تكييف متعدد الصفوف',
    homework: 'الواجب المنزلي · ركن المعلم',
    materials: 'المواد والوسائل',
    'exit-ticket': 'بطاقة الخروج',
  },
  // the two roles with no hand-written treatment: a materials list is a row of chips,
  // an exit ticket is a single question on a note card
  types: { materials: 'chips', 'exit-ticket': 'note' },
  // the gradual-release pill the pack expects on a stage
  grr: {
    'stage-tamhid': 'أنا أفعل',
    'stage-arad': 'أنا أفعل ← نحن نفعل',
    'stage-tatbiq': 'نحن نفعل ← أنت تفعل',
    'stage-taqwim': 'أنت تفعل',
  },
  stages: ['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim'],
  // A stage heading the source leaves empty still appears, as a slim card carrying its own
  // title and pills. The four-stage rhythm is what a teacher reads by, and fabricating
  // content to fill a gap is not an option.
  emitEmptyStages: true,
  leadIntoFirstPart: true,
  oneCardPerStage: true,
  tabbedBlocks: ['homework'],
  badgeBlocks: { goal: 'target' },
  // GEOMETRY VOCABULARY. A maths lesson names its own shapes; the renderer draws whatever
  // the source asks for. Kept here so another region or language supplies its own words
  // without a line of renderer code changing.
  geoTerms: {
    straight: /مستقيم/, curved: /منحن|غير\s*مستقيم/,
    quad: /رباعي|أربعة\s*أضلاع|٤\s*أضلاع/, notQuad: /ثلاثة\s*أضلاع|غير\s*رباعي/,
    congruent: /متطابق|يطابق|مطابق|متماثل/, notCongruent: /غير\s*متطابق|غير\s*متماثل/,
    dots: /نقطتين|النقاط|نقاط/, grid: /الشبكة|شبكة/, colour: /لوّن|لون/,
    cube: /مكعب/, cone: /مخروط/, ruler: /المسطرة|مسطرة/,
    // A geometry figure needs an actual SHAPE to be about. Without this, «أصل بين كل
    // كلمتين متماثلتين» — a WORD-matching exercise — matched «متماثل» and would have been
    // drawn as congruent shapes.
    shapeNoun: /شكل|أشكال|قطعة|قطع|خط|خطاً|مجسم|مربع/,
  },
  // «١. ضع إشارة (✓) على القطعة المستقيمة. (الإجابة: وضع الإشارة على الخط المستقيم فقط).»
  // states the exercise and its model answer in one line. They are two different things to
  // a teacher — the instruction is read out, the answer is not — so the answer comes out of
  // the label and prints under the exercise. Not a character is dropped.
  answerParenRe: /\s*[(（]\s*((?:الإجابة|الحل)\s*[:：][\s\S]*?)[)）]\s*[.،]?\s*$/,
  // …and it may follow the instruction with no brackets at all: «١. أين نمشي؟ الإجابة:
  // أمشي على الرصيف.» The instruction is read to the class, the answer is not, so they are
  // two different things on the card either way.
  answerTailRe: /\s*(?:الإجابة|الحل)\s*[:：]\s*([\s\S]+?)\s*$/,
  // A BEHAVIOUR CHECKLIST is «١. المشي على الرصيف. الإجابة: (✔)» against «٢. اللعب في
  // الطريق العام. الإجابة: ( )» — the source states which behaviours are right by ticking
  // them. Drawn as one list with a tick box per row it is an exercise a child can do; as
  // four separate lines of prose it is unusable.
  tickRe: /^[(（]\s*[✔✓√]\s*[)）]$/,
  blankTickRe: /^[(（]\s*[)）]$/,
  answerLabel: 'الإجابة',
  geoLabels: { yes: 'صواب', no: 'خطأ', model: 'النموذج', same: 'مطابق', diff: 'غير مطابق' },
  notes: { after: 'stage-taqwim', label: 'ملاحظات المعلّم بعد الدرس', tab: 'ملاحظات', lines: 2 },
  // The assessment activity must not be a second copy of the practice widget — the
  // reviewer asked for it to read differently inside the same design family.
  assessmentStage: 'stage-taqwim',
  // Roles that render as a titled BLOCK component — their own header row inside their
  // own border. They were the last sections still using the generic panel, whose header
  // is pulled 32px into the card; on those five it drew the title ON the border and
  // clipped «أبي، أمي، أحمد، إيمان» outside the card.
  // '*' = every section that is not a stage, a misconception panel or the notes card gets
  // the block component. Naming roles individually only covers the roles of the lesson you
  // tested with; glossary, multigrade and the lesson line were missed that way.
  blockComponents: ['*'],
  order: ['lesson-line', 'goal', 'materials', 'errors', 'errors-caption', 'stage-tamhid',
    'stage-arad', 'stage-tatbiq', 'stage-taqwim', 'exit-ticket', 'solutions', 'glossary',
    'multigrade', 'homework'],
  // small labels the mapper writes around the source's own words
  goalLead: 'هدف اليوم:',
  labelWrong: 'خطأ',
  labelCorrect: 'صواب',
  boardWrong: 'خطأ شائع',
  boardCorrect: 'التصحيح',
  checkLabel: 'تحقق',
  solutionLabel: 'الحل',
  teacherSaysLabel: 'يقول المعلم',
  pageLabel: 'صفحة',
  pageWords: ['صفحة', 'ص\\.?', 'page'],
  minutesWords: ['دقائق', 'دقيقة', 'min'],
  minutesLabel: 'دقيقة',
  digits: 'arabic',
  chipWords: 3,
  chipEllipsis: false,
  gradeRe: /الصف\s+\S+/,
  titleStrip: /^خطة الدرس:\s*/,
  checkMarks: /(?=(?:\*{0,2})\s*(?:MODEL ANSWER|الحل الصحيح|الحل:|الإجابة الصحيحة|الإجابة:|نقطة التحقق))/i,
  // A label the mapper must NOT split a card at, because it belongs in the card's own
  // تحقق sidebar — the signature of this design set. «نقطة التحقق: ٤ من كل ٥ تلاميذ…» is
  // the criterion the teacher checks against, so it fills the amber strip beside the
  // activity rather than becoming a separate card after it.
  checkLabelRe: /^\s*نقطة التحقق\s*$/,
  // The exact phrases that open a slot when they appear INLINE in a paragraph, written as
  // the sources actually write them. Explicit, because inferring them from the short labels
  // meant guessing about the definite article — «تحقق» vs «نقطة التحقق» — and a guess that
  // fixed one paste broke three others.
  inlineLabels: ['نقطة التحقق', 'دعم', 'تحد'],
  // «س١:» / «س٢:» — this curriculum numbers its assessment questions with a س prefix as
  // readily as with a bare digit, and writes the whole set on one line. Declared here
  // rather than in the mapper so that «س» stays an ordinary letter everywhere else.
  questionMarkRe: /س\s*[٠-٩0-9]{1,2}\s*[:：.)]/,
  // A BULLETED QUESTION THAT CARRIES ITS OWN ANSWER IS AN EXERCISE, not a list item.
  // «الكلب الوفي» writes nine of them under one heading — «* ما الذي كان لدى الرجل؟
  // الإجابة: كلب ذكي وأمين.» — and read as a plain list they collapsed into one activity
  // whose answer swallowed the following eight questions. A numbered lesson already gets
  // one card per question; this gives a bulleted one the same treatment, with no numeral
  // invented. Two or more, so a single such bullet stays part of its paragraph.
  qaLineRe: /^[ \t]*[*•▪-]\s*([^\n]*[؟?][^\n]*(?:الإجابة|الحل)\s*[:：][^\n]+)$/m,
  // FRACTION WORDS THIS CURRICULUM NAMES, as parts and shaded parts. «ظلل نصف الشكل» is a
  // drawing instruction, and the fractions lesson stated nine of them with no figure at all
  // — the one lesson in the set whose whole subject is a picture. Declared, so a word the
  // renderer does not know draws nothing rather than guessing a denominator.
  fractionWords: {
    'نصف': [2, 1], 'النصف': [2, 1],
    'ثلث': [3, 1], 'الثلث': [3, 1],
    'ربع': [4, 1], 'الربع': [4, 1],
    'ربعين': [4, 2], 'ربعان': [4, 2],
  },
  // «كم ٤ في العدد ١٢؟» → «٣ أربعات، ١٢ ÷ ٤ = ٣». The lesson's own words for the answer are
  // a count of equal groups, which is exactly what division means and exactly what a
  // teacher draws on the board. Read from the division sentence itself, never invented.
  groupingRe: /([٠-٩]{1,3})\s*÷\s*([٠-٩]{1,2})\s*=\s*([٠-٩]{1,3})/,
  // WHAT AN ILLUSTRATION SHOULD SHOW, per topic this curriculum actually teaches.
  //
  // The brief used to be ONE fixed English sentence — «children and their teacher in a
  // simple classroom, engaged in an activity about <goal>» — with the lesson's ARABIC goal
  // interpolated into it. A model cannot act on an Arabic clause inside an English prompt,
  // so fifteen lessons produced fifteen DIFFERENT files of the SAME generic scene: a
  // standing teacher, children in a ring, a mud-brick fortress behind them. The reviewer
  // read that as a cache collision; the cache was working correctly and faithfully storing
  // fifteen near-identical pictures. The brief was the fault.
  //
  // Each entry is a pattern over the lesson's OWN words and the English scene to draw for
  // it. Ordered: the first match wins, so a lesson that mentions «البيت» in passing does not
  // take the house scene from the lesson that is about one. Matching is diacritic-blind.
  // Declared here — reviewable, and owned by the region — like every other label in this
  // pack. A topic with no entry falls back to the classroom scene, which is honest: better
  // a generic picture than one asserting something the lesson never mentions.
  sceneTerms: [
    [/الأسرة|أفراد الأسرة/, 'a mother, a father and their children standing together in the courtyard of a mud-brick house, the youngest child holding up a small drawing'],
    [/الوالدين|والديك|أبويه/, 'a child carrying a cup of water to a tired father sitting down after work, the mother smiling beside them'],
    [/الوضوء|الطهارة|المضمضة/, 'a boy with his sleeves rolled to the elbow washing his hands and face at a low water tap in a school courtyard'],
    [/الأخدود|نجران|ذو نواس/, 'the tall mud-brick tower houses of an old walled Yemeni town at evening, seen across an empty square'],
    [/الكلب|النباح/, 'a watchful dog sitting upright beside the shuttered wooden door of a small village shop at dusk'],
    [/دورة الماء|التبخر|التكاثف|المياه الجوفية/, 'rain falling from a grey cloud onto terraced hillside fields with a low stone dam below, children watching from a wall'],
    [/الجهات|الشرق|الغرب|الشمال والجنوب/, 'a child standing with both arms stretched wide in an open field, the low sun on one side and a long shadow falling to the other'],
    [/النبات|الجذور|الساق|الأوراق/, 'children kneeling around a young seedling lifted out of dark soil so its roots, stem and leaves are all visible'],
    [/البصر|أبصر|عضو حاسة/, 'a child cupping both hands around their eyes to peer at a bright red bottle cap that a classmate is holding up'],
    [/الكسور|ظلل|المظلل/, 'a child colouring in one part of a large paper circle that has been folded into equal parts'],
    [/القسمة|توزيع بالتساوي/, 'children sharing a heap of coloured bottle caps into several equal piles on a mat, one pile in front of each child'],
    [/حقائق الجمع|العد التصاعدي/, 'two children counting small pebbles gathered into two separate heaps on a mat, one heap larger than the other'],
    [/المكعب|المخروط|الشكل الرباعي|القطعة المستقيمة/, 'a child ruling a straight line on a slate with a wooden ruler, a clay cube and a clay cone resting on the mat beside it'],
    [/الرصيف|آداب المشي|رجل المرور/, 'children walking in single file along the raised kerb of a village street while a traffic warden holds up an open hand to stop a car'],
    [/العنب|يبني بيتا|البناء/, 'a builder pressing a mud brick into a half-built house wall while a girl carries a heavy bunch of grapes past him'],
  ],
  sceneFallback: 'primary-school children and their teacher working together at a low table in a Yemeni classroom',
  // COLOURS THE DESIGN IS WILLING TO DRAW, keyed by the words the sources actually use.
  // «ألوان علم بلادي: الأحمر، الأبيض، الأسود» and «ما هي ألوان إشارة المرور؟ … الأحمر،
  // الأصفر، الأخضر» are the most drawable thing a Grade 1 lesson contains, and both were
  // printing as running prose. Declared here, so a colour is never guessed from a word the
  // renderer does not know, and a region that does not teach colour naming is unaffected.
  colourNames: {
    'الأحمر': '#d5262c', 'أحمر': '#d5262c', 'حمراء': '#d5262c',
    'الأبيض': '#ffffff', 'أبيض': '#ffffff', 'بيضاء': '#ffffff',
    'الأسود': '#1a1a1a', 'أسود': '#1a1a1a', 'سوداء': '#1a1a1a',
    'الأصفر': '#f2c012', 'أصفر': '#f2c012', 'صفراء': '#f2c012',
    'الأخضر': '#1e8b4d', 'أخضر': '#1e8b4d', 'خضراء': '#1e8b4d',
    'الأزرق': '#1f5fa8', 'أزرق': '#1f5fa8', 'زرقاء': '#1f5fa8',
  },
  // ── PATTERNS THAT ARE ALREADY DRAWINGS ──────────────────────────────────────────────
  // Five figure primitives — process, labeled-parts, compass, compare, count-set — were
  // built for the model path and were reachable from raw text by nothing at all: the
  // mapper could emit sixteen kinds while the renderer could draw twenty-one. The
  // vocabularies below are what the detectors read. Every one of them is a pattern over
  // words a lesson USES, never a subject or a lesson id, so a science lesson and a maths
  // lesson are offered exactly the same detectors and a lesson stating none of these
  // patterns draws nothing and keeps its designed text card.
  //
  // A SEQUENCE THE SOURCE WROTE WITH ARROWS. «تبخر ← تكاثف ← هطول المطر ← المياه الجارية»
  // is a process; «الجذور ← تثبيت وامتصاص الماء» is a pair, not a process, which is why
  // three links are the minimum. `cycleRe` promotes it to a ring only where the lesson
  // itself calls the sequence a cycle in the same sentence — the water-cycle lesson does,
  // and a ring asserts a closing arrow that a linear chain must not be given for free.
  cycleRe: /دورة/,
  // A DIAGRAM'S NAMED PARTS. The lesson writes «الجذور ← تثبيت وامتصاص الماء. الساق ← نقل
  // الماء. الأوراق ← صنع الغذاء» while the teacher draws the plant on the board — the parts
  // are named, so they can be labelled on a drawing that already exists in the renderer.
  // `objectRe` is the guard: the body must be about the object, or «الساق» in another sense
  // would pull a plant. The chip carries the part word as the source wrote it; what the
  // part DOES stays in the card's text, because the drawing's own contribution is showing
  // WHERE each part is, which no sentence can do.
  partObjects: [
    { object: 'plant', objectRe: /نبات|النبات|نباتاً/,
      terms: [
        [/^(?:ال)?جذور$|^(?:ال)?جذر$/, 'root'],
        [/^(?:ال)?ساق$/, 'stem'],
        [/^(?:ال)?أوراق$|^(?:ال)?ورقة$/, 'leaf'],
        [/^(?:ال)?أزهار$|^(?:ال)?زهرة$/, 'flower'],
        [/^(?:ال)?ثمار$|^(?:ال)?ثمرة$/, 'fruit'],
        [/^(?:ال)?بذور$|^(?:ال)?بذرة$/, 'seed'],
        [/^(?:ال)?تربة$/, 'soil'],
      ] },
  ],
  // THE FOUR DIRECTIONS, AND ONLY WHEN ALL FOUR ARE THERE. A compass drawn from three of
  // them is a factual error, not an untidy figure. Matching is permissive (the lesson says
  // «للجنوب» as often as «الجنوب») while the label drawn is the declared word, so a compass
  // is never labelled with half a preposition. `nounRe` keeps it to lessons about
  // direction: «تشرق الشمس» contains «شرق» in a sentence about sunrise.
  compassTerms: [['north', /شمال/, 'الشمال'], ['east', /شرق/, 'الشرق'],
    ['south', /جنوب/, 'الجنوب'], ['west', /غرب/, 'الغرب']],
  compassNounRe: /الجهات|جهة|جهات/,
  // A SIZE CONTRAST THE LESSON STATES. «بعيني أميز أن هذا كبير وهذا صغير» — two bars, the
  // longer one for the word the lesson uses for bigger. The bar lengths carry no measured
  // quantity because the source states none; they carry the only thing it does state,
  // which is which of the two is larger. Both members of one pair must be present, and
  // exactly one pair: two contrasts are four bars and the component draws three, so a
  // second pair is a refusal rather than a dropped item. The cue keeps it to sentences
  // that are ABOUT the contrast — «حباً كبيراً» is not a comparison.
  // The bar is labelled with the word DECLARED here, not with the matched substring: the
  // lesson writes «كبيراً», matching runs diacritic-blind so the text reads «كبيرا», and a
  // pattern capturing that returned «كبير» — the source's word with its final letter left
  // behind. Same rule as the colour swatches and the compass: the pattern finds it, the
  // declared word is what gets drawn, so a chip is always a whole word.
  comparePairs: [
    { big: [/كبير/, 'كبير'], small: [/صغير/, 'صغير'] },
    { big: [/طويل/, 'طويل'], small: [/قصير/, 'قصير'] },
    { big: [/ثقيل/, 'ثقيل'], small: [/خفيف/, 'خفيف'] },
    { big: [/كثير/, 'كثير'], small: [/قليل/, 'قليل'] },
    { big: [/واسع/, 'واسع'], small: [/ضيق/, 'ضيق'] },
  ],
  compareCueRe: /أميز|نميز|أقارن|قارن|الفرق بين|أكبر|أصغر/,
  // A COUNTED SET OF THINGS. Only where the lesson asks for the objects to be COUNTED —
  // «كم عدد الحصى؟» — and only for objects this curriculum actually puts on the desk. A
  // sentence that merely fetches six bottle caps is not a counting exercise, and drawing
  // six rings for it would be decoration; the sentence keeps its words and its picture.
  countNouns: [/أغطية(?:\s+زجاجات)?/, /حصى/, /أعواد/, /أقلام/, /ورقات/, /حبات/, /كرات/, /مربعات/],
  countCueRe: /كم عدد|احسب عدد|اعدد|عُدّ|عدّ\s/,
  // WHAT THE TEACHER PUTS ON THE BOARD IS A SET OF CARDS. The cue is the lesson's own
  // «يكتب على السبورة:», and what follows it is drawn in whichever of three shapes it is
  // written in — «الملك: ذو نواس. الدين: اليهودية. المكان: نجران» as fact cards, «(ذئب،
  // كلباً، ذات، الهزال، آثار، طعام)» as word cards, «الرَّجُلُ يَبْنِيْ بَيْتَاً. الْبَيْتُ جَمِيْلٌ. …» as
  // sentence cards. Three items minimum, so a single sentence on the board stays a
  // sentence. `boardStopRe` ends the board content: «نقطة التحقق: ٨٠٪ من التلاميذ…» is a
  // measurement of the class, not something written up for them to read.
  boardCueRe: /يكتب(?:\s+\S+){0,3}\s+على\s+السبورة\s*[:：]|يكتب\s+على\s+السبورة\s*[:：]/,
  boardStopRe: /نقطة التحقق|دعم\s*[:：]|تحد|الإجابة|الحل\s*[:：]|يقول المعلم|يكتب جملة/,
  boardMetaLabels: /^(?:الإجابة|الحل|نقطة التحقق|دعم|تحد|سؤال|الهدف|المواد|التمرين|ملاحظة|مثال)/,
  // A NUMBERED RUN OF INSTRUCTIONS IS ONE SEQUENCE, NOT TEN CARDS. The ablution lesson
  // writes ten ordered steps; each became its own label-only row, and a stage that teaches
  // an order printed as ten bare lines. Drawn as one numbered set it is the same words in
  // the same order, and the order is visible. Whole run or nothing.
  orderedRun: { minItems: 3, maxWords: 9, maxChars: 54 },
  // THE SAME LESSON MUST RENDER THE SAME WHETHER ITS ANSWER IS ON ITS OWN LINE OR INSIDE
  // THE SENTENCE. «بطاقة الخروج: أي كلمة…؟ الإجابة: أبي، أمي…» carries both in one line, so
  // the answer stayed inside the exit-ticket card and the الإجابات card disappeared — the
  // reviewer noticed exactly that difference between two pastes of one lesson. The answer
  // is split out into its own card, which is also what the approved layout pairs with the
  // exit ticket.
  // The brackets belong to the answer, not to the question. «…يطابقه. (الإجابة: …).» left
  // an orphaned «(» at the end of بطاقة الخروج and a stray «).» on the الإجابات card.
  answerSplit: { from: 'exit-ticket', to: 'solutions',
    re: /\s*[(（]?\s*(?:الإجابة|الحل)\s*[:：]\s*([\s\S]+?)\s*[)）]?\s*[.،]?\s*$/ },
  // SUB-ELEMENTS OF A STAGE, NOT CARDS OF THEIR OWN. «دعم» and «تحد» are the
  // differentiation notes for the activity above them. Rendered as full-width cards they
  // tripled the length of the LP and made every stage look like three identical boxes —
  // the reviewer's first complaint about the render. They attach to the stage card they
  // belong to and draw as a compact two-up callout row underneath it.
  subElements: [
    ['support', /^\s*دعم\s*$/, 'دعم'],
    ['challenge', /^\s*تحد\s*$/, 'تحد'],
  ],
  // A numbered exercise «١) أصل بين الصورة والكلمة الدالة عليها» is the heading of a
  // teaching ACTIVITY, so it opens its own card and gets its own visual. The bare-label
  // splitter only fires on «label:» lines, so these ran together inside one card and the
  // matching exercises ended up as one small merged widget.
  // 70 characters was the أسرتي exercise's length. A geometry lesson writes «١. ضع إشارة
  // (✓) على القطعة المستقيمة. (الإجابة: وضع الإشارة على الخط المستقيم فقط).» — 85
  // characters — so not one of its seven exercises was recognised and all seven ran
  // together as prose. The line still has to BE a whole line and start with a digit.
  exerciseRe: /^[ \t]*([٠-٩0-9]{1,2}\s*[).\u061F]?\s*[^\n]{4,170})$/gm,
  // the lesson's own «Watch out» wording, for the drawn ✗/✓ board
  warnRe: /watch out|تنبيه|احذر/i,
  fixRe: /(?:التصحيح|الصواب|الصحيح)\s*[:،]?\s*([^.!؟\n]{6,60})/,
  errRe: /(?:بعض الطلاب|قد يخلط|يخلط|الخطأ)\s*[:،]?\s*([^.!؟\n]{6,60})/,
  fixLongRe: /(?:التصحيح|الصواب)\s*[:،]\s*([^.!؟]{6,120})/,
  errLongRe: /((?:بعض الطلاب|كثير من الطلاب)[^.!؟]{6,140})/,
  errLeadRe: /^(?:بعض|كثير من) الطلاب\s*/,
  confusionPairRe: /يخلطون\s+بين\s+("?[^"،.]{1,12}"?)\s*و\s*("?[^"،.]{1,12}"?)/,
  // «الخلط بين كلمتي "أبي" و"أمي"» — the two words a pupil confuses, for the ✗/✓ board.
  // The clause that says what the TEACHER does about the confusion. Arabic writes it
  // after a semicolon («؛»); the panel gives it its own strip beneath the two halves.
  correctionSplitRe: /\s*[؛;]\s*/,
  confusedPairRe: /الخلط\s+بين\s+(?:كلمتي|كلمتين)?\s*("[^"]{1,14}"|[^\s"،.]{1,14})\s*و\s*("[^"]{1,14}"|[^\s"،.]{1,14})/,
  chrome: {
    when: (locale, region) => String(locale).startsWith('ar') && region === 'ye',
    title: 'دليل الدرس اليومي',
    subtitle: 'الجمهورية اليمنية · وزارة التربية والتعليم · التعليم المجتمعي',
    footer: 'للتواصل مع المدرّب الرقمي: 160 661 778 967+ · دليل الدرس اليومي',
  },
};

// ── Kenya: the CBC lesson plan. Its own roles, in its own order, in English ────────
// Heading vocabulary from the CBC lesson-plan form (Strand → Reflection) and from the
// CBC lesson already in this repo (assets/content/lesson-breathing-cbc.en.json), whose
// sections are llo / kiq / resources / introduction / development / conclusion /
// assessment / extended.
const KE = {
  id: 'ke',
  name: 'Kenya — CBC lesson plan',
  locale: 'en',
  roles: [
    ['strand', /^\s*strand\b/i],
    ['sub-strand', /sub[-\s]?strand/i],
    ['outcomes', /learning outcomes?|specific outcomes?|lesson outcomes?/i],
    ['inquiry', /key inquiry|inquiry question/i],
    ['resources', /learning resources?|teaching (?:aids|resources)|materials/i],
    ['introduction', /^\s*introduction\b|lesson introduction/i],
    ['development', /lesson development|development steps?|^\s*steps?\b|procedure/i],
    ['conclusion', /^\s*conclusion\b|lesson conclusion/i],
    ['extended', /extended activit|extension activit/i],
    ['rubric', /assessment rubric|rubric|marking guide|levels? of achievement/i],
    ['assessment', /assessment|assessment questions?/i],
    ['reflection', /^\s*reflection\b|teacher(?:'s)? reflection|self[-\s]?reflection/i],
    // The Taleemabad LP template wraps the CBC form in three more blocks: a
    // 30-second summary at the top, the fill-in admin/TSC form, and remediation
    // notes near the end. Additive — the plain CBC lesson has none of them.
    ['summary', /\b30[-\s]?second summary\b|lesson at a glance/i],
    ['admin-form', /^\s*school\b/i],
    ['remediation', /remediation|correction notes/i],
  ],
  lift: [],
  titles: {
    'lesson-line': 'Lesson',
    strand: 'Strand',
    'sub-strand': 'Sub-Strand',
    outcomes: 'Lesson Learning Outcomes',
    inquiry: 'Key Inquiry Question(s)',
    resources: 'Learning Resources',
    introduction: 'Introduction',
    development: 'Lesson Development',
    conclusion: 'Conclusion',
    extended: 'Extended Activities',
    assessment: 'Assessment',
    rubric: 'Assessment Rubric',
    reflection: 'Reflection',
    summary: '30-Second Summary',
    'admin-form': 'Lesson Details',
    remediation: 'Remediation Notes',
  },
  grr: {},
  // A CBC plan names its topic in the Sub-Strand row ("Sub-Strand: The Breathing
  // System"); the line above the first heading carries the grade and the learning area.
  topicRole: 'sub-strand',
  // CBC lesson development is one role, not four named stages: the source's own Step 1,
  // Step 2 … become the cards inside it rather than being forced into Engage/Explore.
  stages: ['introduction', 'development', 'conclusion'],
  order: ['lesson-line', 'summary', 'admin', 'admin-form', 'strand', 'sub-strand',
    'lesson-topic', 'outcomes', 'inquiry', 'resources', 'introduction', 'development',
    'conclusion', 'assessment', 'rubric', 'extended', 'remediation', 'reflection'],
  // The CBC form states the learning area and grade in its header row, and the page
  // header already carries the topic — so a separate lesson-line CARD repeated all of it
  // a second time. These become header chips instead.
  lessonLineCard: false,
  headerChips: [['Learning Area', 'subject'], ['Grade', 'grade']],
  gradeField: /^\s*grade\b|^\s*class\b/i,
  subjectField: /^\s*learning\s+area|^\s*subject\b/i,
  // Roles that belong together on ONE card. A CBC plan's identifying rows are a table
  // on the form, not four separate panels — rendering Strand and Sub-Strand as
  // full-width cards of their own spent a third of page 1 on two short phrases.
  merge: [{ id: 'admin', title: 'Lesson details', type: 'fields',
    roles: ['strand', 'sub-strand'] }],
  // how a role with no hand-written treatment should be drawn
  types: {
    strand: 'text',
    'sub-strand': 'text',
    outcomes: 'bullets',
    inquiry: 'note',
    resources: 'chips',
    assessment: 'bullets',
    rubric: 'rubric',
    extended: 'note',
    reflection: 'note',
    summary: 'summary',
    'admin-form': 'fields',
    remediation: 'bullets',
  },
  goalLead: 'Learning outcomes:',
  labelWrong: 'Common error',
  labelCorrect: 'Correct',
  boardWrong: 'Common error',
  boardCorrect: 'Correction',
  checkLabel: 'Check',
  solutionLabel: 'Answer',
  teacherSaysLabel: 'Teacher says',
  pageLabel: 'page',
  pageWords: ['page', 'pg\\.?'],
  minutesWords: ['minutes', 'minute', 'mins', 'min'],
  minutesLabel: 'min',
  digits: 'latin',
  chipWords: 5,
  chipEllipsis: true,
  // Roles whose card is the SPACE, not the words: a CBC plan's Reflection is ruled lines
  // the teacher writes on after the lesson, so the heading alone earns the card.
  emitEmpty: ['reflection'],
  gradeRe: /\bgrade\s+\d+\b/i,
  titleStrip: /^(?:lesson plan|lesson)\s*[:—–-]\s*/i,
  checkMarks: /(?=(?:\*{0,2})\s*(?:MODEL ANSWER|Model answer|Expected response|Expected answer|Answer:))/,
  warnRe: /watch out|misconception|common error/i,
  fixRe: /(?:correction|correct(?:ion)?)\s*[:—–]?\s*([^.!\n]{6,60})/i,
  errRe: /(?:some (?:pupils|learners|children)|learners often|pupils often)\s*[:—–]?\s*([^.!\n]{6,60})/i,
  chrome: {
    title: '',                       // the lesson's own topic titles the page
    subtitle: 'Republic of Kenya · Competency-Based Curriculum',
    footer: 'Competency-Based Curriculum · lesson plan',
  },
  // ── KISWAHILI ─────────────────────────────────────────────────────────────────────
  // The same CBC form, written in Kiswahili. This is a LANGUAGE VARIANT of the Kenya
  // profile, not a separate region: the roles, their order and the design pack are
  // identical — only the words the source uses to name them, and the words we print
  // back, differ. The variant is chosen by the TEXT (see resolveProfile): whichever
  // language's headings the document actually uses wins, and both pattern sets stay
  // active afterwards, because a Kenyan Kiswahili plan routinely leaves a heading or
  // two in English.
  //
  // Vocabulary sources, so this is not guesswork: the CBC lesson-plan form's own
  // Kiswahili wording, plus the Kiswahili already attested in this repo —
  // assets/content/lesson-kiswahili-demo.sw.json (Malengo ya Somo, Utangulizi, Hatua za
  // Somo, Shughuli ya Wanafunzi, Tathmini, Darasa la 1, Dakika 40) and the Kiswahili
  // Grade 1 guide under assets/generated/lessons (Somo, Lengo, Makosa ya kawaida,
  // Utangulizi, Ukuzaji wa Somo, Mazoezi, Hitimisho, Majibu, Maneno muhimu, Kazi ya
  // Nyumbani).
  langs: {
    sw: {
      name: 'Kenya — CBC lesson plan (Kiswahili)',
      locale: 'sw',
      // ORDER MATTERS — first match wins, and Kiswahili headings overlap far more than
      // the English ones do. Every ordering below was forced by a real mis-routing:
      //   · «Shughuli za Ziada» went to Lesson Development, because the development
      //     pattern claims «Shughuli»/«Hatua» and sat earlier;
      //   · «Tathmini ya Mwalimu» went to the pupils' assessment rather than the
      //     teacher's reflection;
      //   · «Mada Ndogo» went to sub-strand and «Mada» to strand, which is one level
      //     out — a Kenyan Kiswahili plan carries THREE levels (Suala 1.0 → Mada 1.1 →
      //     Mada Ndogo 1.1.1) and the innermost one names the lesson.
      roles: [
        // three-level hierarchy, innermost first so the more specific name wins
        ['lesson-topic', /^\s*mada\s+ndogo/i],
        ['strand', /^\s*suala\b|^\s*mada\s+kuu/i],
        ['sub-strand', /^\s*mada\b|kipengele/i],
        ['summary', /muhtasari/i],
        ['admin-form', /^\s*shule\b/i],
        ['outcomes', /matokeo\s+ya\s+kujifunza|malengo\s+ya\s+somo|malengo\s+mahsusi|matokeo\s+yanayotarajiwa|^\s*malengo\b/i],
        ['inquiry', /maswali?\s+muhimu|udadisi|kudadisi|uchunguzi/i],
        ['resources', /nyenzo|vifaa\s+vya\s+kujifunz|zana\s+za\s+kujifunz/i],
        ['extended', /shughuli\s+za\s+ziada|kazi\s+ya\s+ziada|kazi\s+ya\s+nyumbani/i],
        ['rubric', /rubriki|kigezo\s+cha\s+tathmini|viwango\s+vya\s+tathmini|vigezo\s+vya\s+tathmini/i],
        ['reflection', /^\s*tafakari\b|maoni\s+ya\s+mwalimu|tathmini\s+ya\s+mwalimu/i],
        ['remediation', /maelezo\s+ya\s+kurekebisha|kurekebisha|marekebisho/i],
        ['introduction', /^\s*utangulizi\b|kuanzisha\s+somo/i],
        ['conclusion', /^\s*hitimisho\b|^\s*tamati\b|kumalizia|kufunga\s+somo/i],
        // «Ukuaji wa Somo» and «Ukuzaji wa Somo» are both in use — the first is what the
        // reviewer's own Grade 1 lesson says, and it matched nothing until now.
        ['development', /ukuz?aji\s+wa\s+somo|hatua\s+za\s+somo|maendeleo\s+ya\s+somo|^\s*hatua\b|^\s*shughuli\b|mazoezi/i],
        ['assessment', /^\s*tathmini\b|maswali\s+ya\s+tathmini/i],
      ],
      titles: {
        'lesson-line': 'Somo',
        admin: 'Maelezo ya Somo',
        summary: 'Muhtasari wa Sekunde 30',
        'admin-form': 'Maelezo ya Somo',
        strand: 'Suala',
        'sub-strand': 'Mada',
        'lesson-topic': 'Mada Ndogo',
        outcomes: 'Matokeo ya Kujifunza ya Somo',
        inquiry: 'Swali Muhimu la Uchunguzi',
        resources: 'Nyenzo za Kujifunza',
        introduction: 'Utangulizi',
        development: 'Ukuaji wa Somo',
        conclusion: 'Hitimisho',
        extended: 'Shughuli za Ziada',
        assessment: 'Tathmini',
        rubric: 'Vigezo vya Tathmini',
        remediation: 'Maelezo ya Kurekebisha',
        reflection: 'Tafakari',
      },
      // ONE identifying card, as on the form: the fill-in rows (SHULE, TAREHE, IDADI,
      // Nambari ya TSC …) expand into fields, and the three curriculum levels join them
      // as three more rows. Six separate full-width cards for six short phrases is what
      // this avoids.
      merge: [{ id: 'admin', title: 'Maelezo ya Somo', type: 'fields',
        expand: ['admin-form'], roles: ['strand', 'sub-strand', 'lesson-topic'] }],
      // the lesson is named by the innermost level
      topicRole: 'lesson-topic',
      // …and the grade and learning area are rows of the fill-in form, not a title line
      gradeField: /^\s*darasa\b/i,
      subjectField: /^\s*eneo\s+la\s+kujifunza|^\s*somo\b/i,
      types: {
        summary: 'summary',
        'admin-form': 'fields',
        outcomes: 'bullets',
        inquiry: 'note',
        resources: 'chips',
        assessment: 'bullets',
        rubric: 'rubric',
        extended: 'note',
        remediation: 'bullets',
        reflection: 'note',
      },
      order: ['lesson-line', 'summary', 'admin', 'admin-form', 'strand', 'sub-strand',
        'lesson-topic', 'outcomes', 'inquiry', 'resources', 'introduction', 'development',
        'conclusion', 'assessment', 'rubric', 'extended', 'remediation', 'reflection'],
      headerChips: [['Somo', 'subject'], ['Darasa', 'grade']],
      goalLead: 'Matokeo ya kujifunza:',
      labelWrong: 'Kosa',
      labelCorrect: 'Sahihi',
      boardWrong: 'Kosa la kawaida',
      boardCorrect: 'Sahihi',
      checkLabel: 'Hakiki',
      solutionLabel: 'Jibu',
      teacherSaysLabel: 'Mwalimu anasema',
      pageLabel: 'ukurasa',
      pageWords: ['ukurasa', 'uk\\.?', 'page'],
      minutesWords: ['dakika', 'min'],
      minutesLabel: 'Dakika',
      minutesUnitFirst: true,          // Kiswahili writes «Dakika 20», not «20 dakika»
      gradeRe: /\bdarasa\s+(?:la\s+)?\d+\b/i,
      titleStrip: /^(?:andalio\s+la\s+somo|mpango\s+wa\s+somo|somo)\s*[:—–-]\s*/i,
      checkMarks: /(?=(?:\*{0,2})\s*(?:Jibu sahihi|Jibu:|Majibu:|Jibu linalotarajiwa))/i,
      warnRe: /angalia|tahadhari|kosa la kawaida/i,
      fixRe: /(?:sahihi|marekebisho)\s*[:—–]?\s*([^.!\n]{6,60})/i,
      errRe: /(?:wanafunzi\s+wengi|wanafunzi\s+wanaweza|baadhi\s+ya\s+wanafunzi)\s*[:—–]?\s*([^.!\n]{6,60})/i,
      chrome: {
        title: '',
        subtitle: 'Jamhuri ya Kenya · Mtaala Unaozingatia Umahiri (CBC)',
        footer: 'Mtaala Unaozingatia Umahiri · andalio la somo',
      },
    },
  },
};

// ── Fallback: enough English structure to be useful, no curriculum assumed ─────────
const GENERIC = {
  ...KE,
  id: 'generic',
  name: 'Generic (no region profile)',
  roles: [
    ['outcomes', /objectives?|outcomes?|goals?/i],
    ['resources', /resources?|materials/i],
    ['introduction', /^\s*(?:introduction|warm[- ]?up|starter)\b/i],
    ['development', /development|steps?|procedure|activit/i],
    ['conclusion', /^\s*(?:conclusion|closing|summary)\b/i],
    ['rubric', /rubric|marking guide/i],
    ['assessment', /assessment|evaluation/i],
  ],
  order: ['lesson-line', 'outcomes', 'resources', 'introduction', 'development',
    'conclusion', 'assessment', 'rubric'],
  chrome: { title: '', subtitle: '', footer: '' },
};

const PROFILES = { ye: YE, ke: KE, generic: GENERIC };

function profileFor(region) {
  const key = String(region || '').toLowerCase();
  return PROFILES[key] || GENERIC;
}

// How many of a role set does this text actually name? A heading leads with its own
// name, so the pattern must match in the opening of a short line — the same rule the
// converter's bare-heading detector uses, and the reason a sentence containing the word
// "tathmini" halfway along is not mistaken for the Tathmini heading.
function countRoles(text, roles) {
  const lines = String(text).split('\n')
    .map((l) => l.replace(/^#+\s*/, '').replace(/[*_]/g, '').trim())
    .filter((l) => l && l.length < 120);
  const found = new Set();
  for (const [role, re] of roles) {
    if (lines.some((l) => re.test(l.slice(0, 44)))) found.add(role);
  }
  return found.size;
}

const variantsOf = (p) => Object.values(p.langs || {});

// The region says WHICH curriculum; the text says which LANGUAGE of it. A Kenyan CBC
// plan exists in English and in Kiswahili with the same roles in the same order and the
// same design pack — only the words naming them differ. So a language variant is chosen
// by counting which language's headings the document actually uses, and BOTH pattern
// sets stay active afterwards: a Kenyan Kiswahili plan routinely leaves a heading or two
// in English, and that heading should still find its role.
//
// Card titles then come from the chosen language even for a heading matched by the other
// one — a card title is document chrome, not source text, and a Kiswahili plan should
// not sprout one English card title. (The Yemen pack has always worked this way: Arabic
// card titles over English 5E headings.)
function resolveProfile(region, text) {
  const base = profileFor(region);
  const variants = variantsOf(base);
  if (!variants.length || !text) return base;
  let best = null;
  let bestScore = countRoles(text, base.roles);
  for (const v of variants) {
    const score = countRoles(text, v.roles);
    if (score > bestScore) { best = v; bestScore = score; }
  }
  if (!best) return base;
  const merged = { ...base, ...best, id: base.id,
    roles: [...best.roles, ...base.roles] };
  delete merged.langs;
  return merged;
}

// Which profile does this text look like? The score is the best any of a profile's
// languages manages, so a Kiswahili Kenyan lesson is recognised as Kenyan. Used only
// when no region was declared: an explicit picker choice always wins.
function detectRegion(text) {
  let best = { id: '', score: 0 };
  for (const p of [YE, KE]) {
    const score = Math.max(countRoles(text, p.roles),
      ...variantsOf(p).map((v) => countRoles(text, v.roles)));
    if (score > best.score) best = { id: p.id, score };
  }
  return best.score >= 3 ? best.id : '';
}

// Every section id any profile can emit. The Studio uses this to recognise content that
// is ALREADY in guide shape; it used to test for 'stage-tamhid', which meant a Kenyan
// guide was never recognised as one and got sent back through the structurer.
const GUIDE_SECTION_IDS = new Set(Object.values(PROFILES).flatMap((p) => p.order));

module.exports = { profileFor, resolveProfile, detectRegion, countRoles, PROFILES,
  GUIDE_SECTION_IDS };
