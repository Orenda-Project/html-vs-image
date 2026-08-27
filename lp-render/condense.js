'use strict';
// RESTRUCTURE a FULL lesson content JSON into the "daily guide" template — the region
// design sets' teacher-facing format (12 role sections, see
// decorative/regions/<region>/DESIGN.md). Same provider/key as the structurer.
//
// This step SELECTS and PLACES the source's own sentences; it does not edit them. It
// used to condense to word budgets, which was a temporary measure for fitting the Yemen
// set into a two-page review format — design work is not licence to rewrite a teacher's
// lesson. lp-render/text/verbatim.js checks the result and the Studio logs it.
//
// It keeps the lesson's language, applies the EDITORIAL RULES below (which role gets
// which source content), and reuses the source's image prompts VERBATIM so the asset
// store restores them free.
const { defaultFetch } = require('../imagegen/kie/client');
const { fixGuide } = require('./text/arabic-hygiene');

const CHAT_URL = 'https://api.kie.ai/gpt-5-2/v1/chat/completions';

const SYSTEM = `You RESTRUCTURE a FULL lesson-plan JSON into a "daily teacher guide" JSON for the same renderer.

You are not an editor. You do not shorten, summarise, paraphrase, merge or reword anything. You SELECT the source's own sentences and place them under the right role. The lesson text is the source of truth and reaches the page unchanged.

Output ONLY the JSON object — no markdown, no prose, no code fences.

THE TARGET SHAPE — exactly these 12 sections, with these EXACT "id" values, in this order:
1  { "id":"lesson-line",    "heading":"درس" (or "Lesson"), "type":"text", "body": subject · grade · lesson topic (page ref) — ONE line }
2  { "id":"goal",           "heading": goal word, "type":"note", "body": starts with the bolded goal label (Arabic: "**هدف اليوم:** …"; English: "**Today's goal:** …") then the lesson's goal, verbatim and complete }
3  { "id":"errors",         "heading": common-mistakes title (Arabic: "أخطاء شائعة — انتبه لها"), "type":"qa", "items": exactly 2: { "q":"✗ خطأ" (or "✗ Mistake"), "a": the misconception in the source's own words } and { "q":"✓ صواب" (or "✓ Correct"), "a": the correction in the source's own words } }
4  { "id":"errors-caption", "heading":"ملاحظة", "type":"text", "body": the source's own sentence describing the teacher move that disproves the mistake }
5  { "id":"stage-tamhid",   "heading": warm-up stage name (Arabic "التمهيد"), "type":"steps", "time": "<minutes> · أنا أفعل", "items":[ { "label":"", "body": ALL of the stage's activities, in the source's own words, complete — every activity, question, instruction and quoted line the source gives for this stage }, { "label":"تحقق" (or "Check"), "body": the source's own success criterion for this stage } ] }
6  { "id":"stage-arad",     same shape, presentation/explanation stage (Arabic "العرض"), "time":"<minutes> · أنا أفعل ← نحن نفعل" }
7  { "id":"stage-tatbiq",   same shape, practice stage (Arabic "التطبيق"), "time":"<minutes> · نحن نفعل ← أنت تفعل" }
8  { "id":"stage-taqwim",   same shape, assessment/closing stage (Arabic "التقويم والختام"), "time":"<minutes> · أنت تفعل" }
9  { "id":"solutions",      "heading": answers title + page ref, "type":"bullets", "marker":"num", "items": EVERY answer the source gives, one item per exercise, verbatim }
10 { "id":"glossary",       "heading": vocabulary title (Arabic "مصطلحات"), "type":"fields", "items": every concept term the source defines, with the source's own definition }
11 { "id":"multigrade",     "heading": multi-grade title (Arabic "تكييف متعدد الصفوف"), "type":"bullets", "marker":"num", "items": the source's adaptations, one item each, in its own words }
12 { "id":"homework",       "heading": homework+teacher-corner title (Arabic "الواجب المنزلي · ركن المعلم"), "type":"note", "body": the source's homework items and teacher-corner content, complete and verbatim }

meta: keep the source's locale, subject, grade, region. Set "id" = source id + "-guide".
If locale is "ar" and region "ye": title "دليل الدرس اليومي", subtitle "الجمهورية اليمنية · وزارة التربية والتعليم · التعليم المجتمعي", footer "للتواصل مع المدرّب الرقمي: 160 661 778 967+ · دليل الدرس اليومي". Otherwise: title = the guide word in the lesson's language, keep source subtitle/footer if any. NEVER set meta.banner. Keep up to 3 short chips.

EDITORIAL RULES — how to choose well (these decide quality; follow them for ANY subject):
- MISCONCEPTION (section 3): when the source lists several watch-outs, pick the one most central to the lesson's CORE skill — the confusion between the two things the lesson exists to distinguish (letter-forms in reading, place value in numbers, congruence vs similarity in shapes). The ✓ صواب side must contain the distinguishing RULE plus a concrete pupil ACTION (trace with a finger, stack the shapes, point to the middle letter) — never just "the correct fact".
- ERRORS-CAPTION (section 4): a physical teacher DEMONSTRATION that disproves the mistake in front of the class (show two different-length straight segments; hold up two same-shape different-size cutouts) — an action, not advice.
- STAGE BODIES: the source's own sentences for that stage, in the source's order, complete. Keep its hooks by name, its questions and its quoted call-and-response lines exactly as written. Nothing is cut — not administrative narration, not detail. If a stage is long, the page grows.
- CHANT/SONG: keep every line of any chant or song VERBATIM inside التمهيد, however many lines it has.
- تحقق LINES: observable pupil behaviour, action verb, SINGULAR pupil ("يذكر التلميذ…"), never pupil-count numbers, never teacher behaviour.
- SOLUTIONS (section 9): EVERY answer the source gives, verbatim, one item per exercise — never a subset. Keep the short "not X" discriminations ("لا مثلث (٣ أضلاع)").
- GLOSSARY (section 10): CONCEPT terms (the skill words: المطابقة، التمييز البصري، التطابق، القيمة المنزلية) — NOT the lesson's vocabulary items that pupils learn inside the lesson (not أبي/أمي, not the numbers list). Definitions from the source where given.
- MULTIGRADE (section 11): derive the lower grade from the source's scaffolding, the current grade = the lesson as-is, the higher grade from the source's extension activity. If the source has neither, write the natural simpler/harder variant of the SAME activity.
- HOMEWORK/CORNER (section 12): the source's homework items numbered and VERBATIM, then its re-teach trigger, then its reflection question(s) as written.
- NUMERALS: in Arabic lessons write every DIGIT as an Eastern Arabic numeral (٣٢، ٤٥ دقيقة، صفحة ٨٠) — including times, pages and marks. NEVER mix Latin digits (1,2,3) into Arabic text: Yemeni teachers flagged mixed numerals in a review as confusing for pupils. But NEVER convert a number the source wrote as a WORD into a digit: «أربعة أضلاع» stays «أربعة أضلاع», it does not become «٤ أضلاع». Changing how a number is written changes the teacher's sentence, and the verbatim rule wins. This applies ONLY to reader-visible Arabic strings — every JSON NUMBER (parts, shaded, total, len, and any value outside quotes) MUST be written with plain ASCII digits, e.g. "total": 16, never "total": ١٦, or the guide will not parse.
- KINESTHETIC: where the source already has pupils physically DOING something (touch, hold, point, stand, fold, cut, count on fingers, act out, walk to the board), keep that wording — it is what the Yemen A/B reviewers asked for. Do NOT rewrite a passive stage into an active one: that would change the teacher's text, which is not yours to change.
- ANSWERS ARE NEVER OMITTED: the solutions section must always carry the lesson's actual answers (a review found missing answer keys to be a hard failure). Never leave it empty or generic.
- STAGE MINUTES: sum to the source's period length when known.

__IMAGES_BLOCK__

HARD RULES:
- VERBATIM, NOT REWRITTEN: every reader-visible string must be text that appears in the source. You may select, order and place; you may join two adjacent source sentences with a space. You may NOT shorten, summarise, paraphrase, reword, translate or invent. A rendering pipeline checks this after you: strings that do not appear in the source are reported as deviations.
- Keep the lesson's language for ALL reader-visible text. No English scaffolding labels inside a non-English lesson.
- THERE ARE NO WORD BUDGETS AND NO PAGE TARGET. The guide is exactly as long as the lesson is. Length is never a reason to drop, trim or compress anything.`;

// Figure policy is part of a REGION'S DESIGN SET, not global editorial policy.
// Regions whose approved design is figure-rich (every card teaches inside the
// image — Yemen pilot grammar) opt in here; every other region keeps the
// conservative contract (reuse the source's figures, author nothing), so a
// region is never restyled by another region's design decisions.
const RICH_FIGURE_REGIONS = new Set(['ye']);

// FIGURE MODE (owner decision 2026-08-19 — reverted to 'labeled'):
//   'labeled' — the image model writes the figure's Arabic labels itself, as the
//               design set was originally built. Richer-looking figures; the model
//               can misspell a label or miscount a diagram, so answer-bearing
//               figures need a human eye.
//   'hybrid'  — the model draws wordless artwork and the renderer draws every label,
//               mark and exact diagram (accurate by construction).
// Switch with FIGURE_MODE below, or per run with LP_FIGURE_MODE=hybrid|labeled.
const CF_KINDS_LIST = `  · { "kind":"fraction-grid", "shape":"square"|"circle", "parts":N, "shaded":K } — one whole split into N equal parts with K shaded.
  · { "kind":"count-set", "shape":"circle"|"square"|"triangle", "total":N, "shaded":K } — N separate objects, K highlighted (counting, grouping, "K of N").
  · { "kind":"compass", "north":"شمال", "east":"شرق", "south":"جنوب", "west":"غرب", "center":"<optional short word>" } — four labelled direction arrows.
  · { "kind":"compare", "items":[ { "label":"<short Arabic>", "len":0.0-1.0, "mark":"good"|"bad"|null }, … ] } — two or three labelled bars for length/size/quantity comparisons. ONLY for magnitudes (longer/shorter, more/fewer, taller): bars say "this one is bigger", so never use them for matching, pairing or sorting — use "steps" cards for those.
  · { "kind":"expression", "text":"<a short expression or key term, e.g. ٢/٤>" } — drawn as large text, never generated.
  · { "kind":"process", "layout":"cycle"|"linear", "stages":[ { "label":"<short Arabic stage name>", "caption":"<optional 2–4 word note>" }, … 3 to 6 of them ] } — labelled stages with code-drawn arrows between them. *** USE THIS whenever the lesson teaches a SEQUENCE or a CYCLE: one thing leading to the next (water cycle, plant growth, wudu steps, life cycles, any ordered procedure). "cycle" closes the loop; "linear" is a right-to-left sequence with a start and an end. Take the stage names VERBATIM from the lesson source, in the source's order — never invent or reorder them, and never use a comparison or a compass for a process. ***
  · { "kind":"steps", "items":[ { "label":"<short Arabic, ≤ 4 words>", "caption":"<optional 2–3 word note>" }, … 2 to 6 of them ] } — numbered colour-coded cards read right-to-left. *** USE THIS for any ordered or grouped set the pupil should see at a glance: the steps of a task, the parts of a thing, the materials needed, two or three rules, what to do first/next/last. This is the default way to turn a text-heavy stage into a visual. ***
  · { "kind":"labeled-parts", "object":"plant", "parts":[ { "part":"root"|"stem"|"leaf"|"flower"|"fruit"|"seed"|"soil", "label":"<the Arabic name from the lesson>" }, … 2 to 6 ] } — a code-drawn object with Arabic labels pointing at the right part. *** USE THIS whenever the lesson names the parts of a plant. ***`;

const FIGURE_MODE = process.env.LP_FIGURE_MODE || 'labeled';

const IMAGES_RICH_LABELED = `IMAGES — the guide is FIGURE-RICH like the approved pilot. A picture must TEACH, never decorate: the explanation happens INSIDE the image, on a teaching surface (chalkboard, notebook page, flashcards, wall chart) that carries THIS lesson's exact words/letters/numbers/answers.
- EVERY stage section (stage-tamhid, stage-arad, stage-tatbiq, stage-taqwim) carries one figure via "image": "<id>". The "homework" section takes a SMALL figure when its task is physical (cutting, folding, counting objects): a simple labelled diagram of that one task.
- THE ERRORS FIGURE IS TWO SEPARATE IMAGES (the renderer composes the ✗/✓ board itself — never draw marks, never draw a split board): attach "imageWrong": "<id>" (a board showing ONLY the mistaken version) and "imageCorrect": "<id>" (a board showing ONLY the correct version) on the errors section. Each is a SINGLE-CONCEPT brief: one board, one item, its labels. Do NOT mention the other version, do NOT use words like wrong/correct/mistake inside the prompt's visual description.
- REUSE FIRST: if a SOURCE image already IS a labelled teaching diagram that fits a stage, reference its id and COPY its entry into "images" EXACTLY — id, concept, label, prompt BYTE-FOR-BYTE (any change breaks the image cache).
- Otherwise AUTHOR a new entry (fresh id, kebab-case, never colliding with a source id) in the pilot's grammar:
  * Prompt in English instruction + the lesson's exact Arabic strings quoted, using this EXACT slot template (the fixed wording is what keeps figures consistent across lessons): "Flat vector educational illustration, clean children's textbook style, soft colours. A dark-green classroom chalkboard with a light wooden frame. <ONE concept from the lesson worked out on the board — state every count in words AND digits, e.g. 'one square divided into exactly four equal parts, exactly two parts filled solid yellow'>. The ONLY text anywhere in the image is: «…», «…». No other text, no other numbers, no decorations." For notebook/exit-card/home roles swap the surface wording ('an open pupil notebook page' / 'a small exit card' / 'a simple home-objects diagram') but keep everything else identical.
  * NEVER put a contrast inside one image: no negations, no 'instead of', no wrong-vs-right — describe only what must appear.
  * LABEL RULES (image models garble long/vocalized Arabic, and garbled labels FAIL the quality gate — these rules are what make the figure generatable): 2–4 labels total; each label ONE or TWO words; STRIP ALL DIACRITICS/tashkeel from labels (write «أبي», never «أَبِي») even when the lesson text carries them; never a sentence, chant line or instruction as a label; never the same word twice; besides the labels, at most ONE short line of text on the teaching surface.
  * Per stage: stage-tamhid = the named hook object/scene WITH the day's key words written plainly on a board inside it (a chant belongs in the stage BODY, never inside the image); stage-arad = the concept worked on the board with the lesson's real example, kept to ONE worked example; stage-tatbiq = the actual exercise being solved in a pupil's notebook, the real answer visible; stage-taqwim = the exit task being performed.
  * "errors" figure: "One wide chalkboard split in two halves by a vertical line: one half shows <the lesson's real example done WRONG> under a large red ✗; the other half shows <the CORRECT version> under a large green ✓." Keep each half to ONE word/expression — the two things the lesson distinguishes. Same label rules.
  * concept: "diagram" for worked/labelled boards (most figures); "scene" only for a stage-tamhid real-world hook — and even then the key fact appears written inside.
  * label: a short Arabic caption in the lesson's language.
- One figure per section, no repeats. Do NOT emit any "images"-type section.`;


const IMAGES_RICH_HYBRID = `IMAGES — HYBRID FIGURES: the image model draws TEXTLESS illustrations; ALL text, numbers, fractions and marks are rendered by code afterwards. A generated image must NEVER contain any text, letters, numbers, fractions or symbols of any kind.

WHAT EACH SECTION CARRIES:
- stage-tamhid, stage-arad, stage-tatbiq, stage-taqwim: each carries EITHER an authored textless image ("image": "<id>") OR a CODE-DRAWN figure ("codeFigure"). *** PREFER codeFigure whenever the teaching point is a direction, a comparison, a count, a part-of-a-whole, a fraction, or a key expression — the renderer draws those exactly and legibly. Use a generated image only for real-world scenes, people and objects (supporting artwork). ***
  AT LEAST ONE PICTURE, AT MOST ONE WIDE DIAGRAM: give at least ONE stage a textless illustration ("image") so the page has a real picture on it — a scene of children or objects, no words in it. Wide code visuals (a "process", a "labeled-parts" diagram, or a "steps" set of 4+ cards) span the whole card: use them where the concept genuinely needs the width, and prefer a "steps" set of 2 or 3 cards otherwise because it reads well in the figure column. Length is not a constraint — do not drop a visual to save space.
  VISUAL DENSITY — READ THIS TWICE. A stage that is only a paragraph of instructions is a failure: teachers reported the pages as text-heavy. EVERY stage section must carry a figure — a textless illustration where the point is a real scene, a codeFigure everywhere else — and when a stage is mostly instructions, give it a "steps" card set built from the stage's own words. Keep each stage's prose SHORT (one or two sentences) and let the visual carry the rest. The "solutions" and "homework" sections may each carry a codeFigure too (e.g. "steps" for what to do at home). Never invent content for a figure: every label must be a word the lesson already uses.
  BALANCE: use a codeFigure wherever exactness matters and never the same figure twice; the other stages carry textless illustrations as supporting artwork. There is no fixed figure count — give a stage a figure when it earns one, and leave prose alone when a figure would only decorate. The errors board does not count towards the three.
  codeFigure kinds — pick the one that fits, all take optional "label" (big caption under the drawing, Eastern numerals) and "caption" (short Arabic line):
${CF_KINDS_LIST}
- errors: *** STRONGLY PREFER a fully code-drawn board *** — set "codeFigure": { "kind":"error-board", "wrong": <any codeFigure kind above, minus label/caption>, "correct": <same>, "labelWrong":"<short Arabic ≤ 4 words>", "labelCorrect":"<short Arabic ≤ 4 words>" }. The renderer draws the split board, the ✗ and ✓ marks, both mini-visuals and both captions — so the mistake is shown exactly (e.g. wrong = expression "٤/٢", correct = expression "٢/٤"; or wrong = count-set with the wrong number shaded, correct = the right one; or wrong/correct = compare bars). ONLY when the misconception cannot be drawn this way (it is about behaviour, a physical action or a place) fall back to two textless images: "imageWrong"/"imageCorrect" ids plus "labelWrong"/"labelCorrect".
- homework: a SMALL textless image of the physical task when there is one.

AUTHORED IMAGE ENTRIES (in "images"): { "id": kebab-case fresh id, "concept": "scene"|"diagram", "label": "<short Arabic caption for under the figure>", "prompt": <see template>, "overlays": [...] }.
- PROMPT TEMPLATE — English only, EXACTLY this shape: "Flat vector educational illustration, clean children's textbook style, soft colours. <the scene or object composition — concrete pictures only, real people, objects and places>. The image contains ABSOLUTELY NO text, no letters, no numbers, no symbols, no equation signs, no boxes, frames, placeholders, blank cards, answer slots, tick marks or arrows on any surface; boards, pages, cards and walls are completely EMPTY surfaces with nothing drawn on them."
  * Never describe a surface as carrying anything — not even "blank cards", "empty boxes", "counters" or "placeholders": asking for those makes the model draw boxes and = signs, which is teaching content and must come from code instead. Describe only people, objects and the room.
- OVERLAYS carry the figure's labels: up to 3 of { "text": "<exact Arabic ≤ 4 words, undiacritized, OR a fraction like ٢/٤>", "pos": "top-right"|"top-left"|"bottom-right"|"bottom-left"|"top"|"bottom", "kind": "chip"|"fraction" }. Code renders them on the image in that corner/strip; compose the picture so those areas stay uncluttered. Use kind "fraction" for fractions, "chip" for words.
- NEVER put a contrast inside one image; describe only what must appear.
- One figure per section, no repeats. Do NOT emit any "images"-type section.
- NEVER reference or reuse an image id from the source content: source prompts predate this contract and request in-image text. ALWAYS author fresh textless entries with the template above.`;

const IMAGES_REUSE = `IMAGES — critical:
- Choose up to 4 images FROM THE SOURCE's "images" array. COPY each chosen entry EXACTLY — id, concept, label and PROMPT BYTE-FOR-BYTE VERBATIM (any change breaks the image cache). Never write new prompts unless the source has NO images at all (then use an empty array).
- Selection taste: التمهيد may take a "scene"; العرض and التطبيق prefer labelled "diagram" concepts (they teach); التقويم takes whatever depicts the exit task. Attach via "image": "<id>" on the stage sections (one per stage, best content fit). Do NOT emit any "images"-type section. Labels stay the source's own.`;

// Figure-rich design sets explain through pictures AS WELL AS the text — the visuals
// are added on top of the lesson, never in place of it. This block used to carry word
// budgets ("STAGE BODIES ≤ 18 words … NO narration") which were a temporary measure to
// squeeze the Yemen set into a two-page review format. Cutting the teacher's words to
// make a design fit is not this workstream's job, so the budgets are gone and only the
// visual instruction remains.
const RICH_BUDGETS = `

VISUALS ARE ADDITIVE (applies to every section): give every section the strongest visual its content allows — a direction, a count, a fraction, a comparison, a sequence, a marked mistake, a labelled part, a set of steps. The figure makes the same content easier to grasp; it does NOT replace the words. Keep the source's full text AND add the figure.

NEVER TRADE TEXT FOR DESIGN:
- Do not shorten a stage because it has a figure. Do not drop a sentence because the visual "already shows it". Do not compress a list into a summary line.
- There are no word budgets in this design set. A long stage produces a tall card and, if needed, another page — that is correct and expected.
- The only length limits anywhere are on drawn LABELS inside a figure (a chip holds a few words, not a paragraph). Those are layout facts, not editorial licence: shorten the LABEL, never the lesson text it came from.`;

// ZERO-COST MODE (LP_NO_IMAGES=1): no image is generated at all — every figure
// must be a code-drawn visual, so an LP costs nothing but the text condensation.
const NO_IMAGES = process.env.LP_NO_IMAGES === '1';
const CODE_ONLY_RULE = `

CODE-ONLY MODE — ABSOLUTE: do NOT author any entry in "images" and do NOT set "image", "imageWrong" or "imageCorrect" on any section. "images" MUST be an empty array. EVERY figure is a "codeFigure" chosen from the kinds above, and the errors section uses { "kind":"error-board", ... }. Give a codeFigure to each stage that genuinely teaches something drawable (a count, a part of a whole, a comparison, a direction, an expression); a stage with nothing drawable simply has no figure and keeps its short text.`;

const buildSystem = (richFigures) => SYSTEM.replace('__IMAGES_BLOCK__',
  richFigures ? (FIGURE_MODE === 'hybrid' ? IMAGES_RICH_HYBRID : IMAGES_RICH_LABELED) + RICH_BUDGETS + (NO_IMAGES ? CODE_ONLY_RULE : '') : IMAGES_REUSE);

async function callOnce(content, { apiKey, fetchImpl, extra, system }) {
  const body = JSON.stringify({
    temperature: 0.2, // consistency: repeated runs of the same lesson stay close
    // Verbatim placement returns far more text than the old condensed guide did — a
    // whole lesson's sentences rather than 18-word summaries — so the completion needs
    // real room. Left unset, the provider default truncated the JSON and the guide came
    // back with too few sections.
    max_tokens: 16000,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: `${extra ? extra + '\n\n' : ''}Full lesson JSON to condense:\n\n${JSON.stringify(content)}` },
    ],
  });
  const res = await fetchImpl(CHAT_URL, { method: 'POST', headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' }, body });
  const json = JSON.parse(typeof res.body === 'string' ? res.body : res.body.toString('utf8'));
  // The provider answers an error with {code, msg} and no choices. Reported as "no
  // parseable JSON" this looked like a model failure and sent a reviewer chasing prompt
  // edits, when the real message was "Credits insufficient". Say what the API said.
  if (!json.choices && (json.code || json.msg)) {
    const err = new Error(`condense: provider error ${json.code || '?'} — ${json.msg || 'no message'}`);
    err.providerCode = json.code;
    throw err;
  }
  const text = json.choices && json.choices[0] && json.choices[0].message && json.choices[0].message.content;
  const m = String(text || '').match(/\{[\s\S]*\}/);
  if (!m) {
    // A TRUNCATED completion has no closing brace, so it looks identical to "no JSON"
    // from here. Report finish_reason and the size: that is the difference between
    // "the model refused" and "the answer did not fit".
    const fin = (json.choices && json.choices[0] && json.choices[0].finish_reason) || '?';
    const t = String(text || '');
    throw new Error(`condense: model returned no parseable JSON (finish_reason=${fin}, ${t.length} chars`
      + `${t.length ? `, ends: …${t.slice(-60).replace(/\s+/g, ' ')}` : ''})`);
  }
  // Models sometimes write Eastern Arabic numerals as JSON VALUES (total: ١٦),
  // which is not valid JSON. Convert digits only where a number is expected —
  // after ':' or ',' or '[' and before ',' '}' ']' — never inside strings.
  const AR = '٠١٢٣٤٥٦٧٨٩';
  const repaired = m[0].replace(/([:,\[]\s*)([٠-٩]+(?:\.[٠-٩]+)?)(\s*[,}\]])/g,
    (_, pre, num, post) => pre + num.replace(/[٠-٩]/g, (d) => String(AR.indexOf(d))) + post);
  return JSON.parse(repaired);
}

// Validate a code-figure spec: unknown kinds and out-of-range numbers are dropped
// rather than trusted, so a bad model emission can never reach the renderer.
// The two halves of a misconception board are drawn at about a quarter of the card's
// width, which is fine for a shape, a count or an expression but turns a step set or
// a process into unreadable 6px labels. Those kinds need width, so they are not
// allowed inside a board — the board falls back to its two labelled halves instead.
const CF_TOO_WIDE_FOR_BOARD = new Set(['steps', 'process', 'labeled-parts']);

function sanitizeCodeFigure(cf, depth = 0) {
  if (!cf || typeof cf !== 'object') return null;
  if (depth && CF_TOO_WIDE_FOR_BOARD.has(cf.kind)) return null;
  const s = (v, n = 40) => String(v == null ? '' : v).slice(0, n);
  const int = (v, lo, hi) => (Number.isInteger(v) && v >= lo && v <= hi ? v : null);
  const label = s(cf.label), caption = s(cf.caption, 60);
  switch (cf.kind) {
    case 'fraction-grid': {
      const parts = int(cf.parts, 2, 12); if (parts == null) return null;
      const shaded = int(cf.shaded, 0, parts); if (shaded == null) return null;
      return { kind: 'fraction-grid', shape: cf.shape === 'circle' ? 'circle' : 'square', parts, shaded, label, caption };
    }
    case 'count-set': {
      const total = int(cf.total, 1, 8); if (total == null) return null;
      const shaded = int(cf.shaded, 0, total); if (shaded == null) return null;
      const shape = ['circle', 'square', 'triangle'].includes(cf.shape) ? cf.shape : 'circle';
      return { kind: 'count-set', shape, total, shaded, label, caption };
    }
    case 'compass':
      return { kind: 'compass', north: s(cf.north, 16), east: s(cf.east, 16), south: s(cf.south, 16),
        west: s(cf.west, 16), center: s(cf.center, 20), label, caption };
    case 'compare': {
      const items = (Array.isArray(cf.items) ? cf.items : []).slice(0, 3)
        .map((it) => ({ label: s(it && it.label, 24), len: Math.max(0.15, Math.min(1, Number(it && it.len) || 0.6)),
          mark: ['good', 'bad'].includes(it && it.mark) ? it.mark : null }))
        .filter((it) => it.label);
      // A comparison whose bars are all the same length compares nothing — it reads
      // as a rendering fault, so reject the spec rather than draw it (this recurred
      // across rolls, so it is enforced here instead of asked for in the prompt).
      if (items.length >= 2 && items.every((it) => Math.abs(it.len - items[0].len) < 0.02)) return null;
      return items.length >= 2 ? { kind: 'compare', items, label, caption } : null;
    }
    case 'expression': {
      // 48 chars: enough for a short sequence like «تبخر ← تكاثف ← هطول المطر»
      // (24 was cutting Arabic words in half).
      const text = s(cf.text, 48); return text ? { kind: 'expression', text, label, caption } : null;
    }
    case 'steps': {
      const items = (Array.isArray(cf.items) ? cf.items : []).slice(0, 6)
        .map((it) => ({ label: s(it && it.label, 34), caption: s(it && it.caption, 26) }))
        .filter((it) => it.label);
      if (items.length < 2) return null;
      const seenS = new Set();
      for (const it of items) { if (seenS.has(it.label)) return null; seenS.add(it.label); }
      return { kind: 'steps', items, label, caption };
    }
    case 'labeled-parts': {
      const OK = new Set(['root', 'stem', 'leaf', 'flower', 'fruit', 'seed', 'soil']);
      const parts = (Array.isArray(cf.parts) ? cf.parts : []).slice(0, 6)
        .map((p) => ({ part: String((p && p.part) || '').trim().toLowerCase(), label: s(p && p.label, 30) }))
        .filter((p) => OK.has(p.part) && p.label);
      const seenP = new Set();
      const uniq = parts.filter((p) => (seenP.has(p.part) ? false : (seenP.add(p.part), true)));
      if (uniq.length < 2) return null;
      return { kind: 'labeled-parts', object: 'plant', parts: uniq, label, caption };
    }
    case 'process': {
      const stages = (Array.isArray(cf.stages) ? cf.stages : []).slice(0, 6)
        .map((st) => ({ label: s(st && st.label, 28), caption: s(st && st.caption, 28) }))
        .filter((st) => st.label);
      if (stages.length < 3) return null; // fewer than three stages is not a process
      const seen = new Set();
      for (const st of stages) { if (seen.has(st.label)) return null; seen.add(st.label); } // no duplicate stage
      return { kind: 'process', layout: cf.layout === 'linear' ? 'linear' : 'cycle', stages, label, caption };
    }
    case 'error-board': {
      if (depth) return null; // no nesting of boards
      const wrong = sanitizeCodeFigure(cf.wrong, 1), correct = sanitizeCodeFigure(cf.correct, 1);
      const lw = s(cf.labelWrong, 40), lc = s(cf.labelCorrect, 40);
      // A board with no drawable halves is still a teaching visual: two colour-coded
      // halves, the ✗/✓ marks and the two labels are drawn by code either way.
      // A label-only board must actually SAY something. «خطأ»/«صواب» simply repeat the
      // headings of the card it sits in, so it is noise, not a visual.
      const GENERIC = /^(خطأ|خطا|صواب|صحيح|غير صحيح|صح)$/;
      if (!wrong || !correct) {
        if (!lw || !lc || lw === lc) return null;
        if (GENERIC.test(lw.trim()) || GENERIC.test(lc.trim())) return null;
        return { kind: 'error-board', labelWrong: lw, labelCorrect: lc };
      }
      // Both halves identical means the board shows no contrast at all — it would
      // read as a rendering fault. Reject so the section falls back to images/text.
      if (JSON.stringify(wrong) === JSON.stringify(correct)) return null;
      return { kind: 'error-board', wrong, correct, labelWrong: s(cf.labelWrong, 40), labelCorrect: s(cf.labelCorrect, 40) };
    }
    default: return null;
  }
}


// A narrow pass over a FINISHED guide: add a figure to the sections that have none,
// change nothing else. Text-only, so it costs no image credits.
const FIGURE_PASS_SYSTEM = `You add teaching VISUALS to a finished Arabic lesson guide. You never rewrite its text.

You are given the guide's sections and which ones have no figure. For each of those, return ONE code-drawn figure spec, chosen from the kinds below, built ONLY from words that already appear in that section or elsewhere in the guide. If a section genuinely has nothing drawable, omit it — but a stage section almost always does: its instructions can be shown as ordered step cards.

${CF_KINDS_LIST}

RULES:
- Labels are SHORT Arabic (≤ 4 words), taken from the guide's own wording. Never invent a fact, a number, a stage or a part the guide does not mention. Never translate.
- Eastern Arabic numerals (٣، ٤) inside labels, never Latin digits.
- Use at most ONE wide visual in total (a "process", a "labeled-parts", or a "steps" set of 4+ cards). Everything else must be a "steps" set of 2–3 cards or another small kind.
- Never repeat the same figure twice in one lesson.
- Give each figure a "caption": a 2–5 word Arabic line saying what it shows.

Return ONLY this JSON, nothing else:
{ "figures": { "<section id>": { <one figure spec> }, … } }`;

// A figure's labels must come from the lesson, not from the model's imagination. The
// figure pass is where invention creeps in (it writes short imperatives), so every
// label has to share a real word with the guide's own text. Function words do not
// count — matching on «في» would let anything through.
const AR_STOP = new Set(['في', 'من', 'على', 'إلى', 'عن', 'مع', 'ثم', 'أن', 'إن', 'لا', 'ما', 'هو', 'هي',
  'هذا', 'هذه', 'ذلك', 'التي', 'الذي', 'كل', 'بعد', 'قبل', 'عند', 'حتى', 'أو', 'و', 'ال']);
function labelGrounded(label, haystack) {
  const text = String(label || '');
  // A label can be arithmetic rather than words («٩ + ٤» in an addition lesson). Ground
  // it on its digits: without this the rule would throw away legitimate maths cards.
  const digits = text.replace(/[^٠-٩0-9+\-×÷=\/]/g, '');
  if (digits.length >= 2 && !/[ء-ي]/.test(text)) {
    const bare = (v) => v.replace(/\s+/g, '');
    return bare(haystack).includes(bare(digits)) || haystack.includes(text.trim());
  }
  const words = text.split(/[\s،.:؛!؟"«»()]+/).filter(Boolean);
  const content = words.filter((w) => w.length >= 3 && !AR_STOP.has(w));
  if (!content.length) return false;
  // Strip a leading conjunction/article so «والجذور» matches «الجذور», and a trailing
  // feminine/plural ending so «صورة» matches «صور» — without this, ordinary Arabic
  // morphology reads as invented content.
  const stem = (w) => w.replace(/^(?:و|ف|ب|ل|ك)?(?:ال)?/, '');
  const forms = (w) => {
    const st = stem(w);
    const out = [w, st];
    for (const suf of ['ة', 'ه', 'ات', 'ان', 'ين', 'ون', 'ا', 'ي']) {
      if (st.endsWith(suf) && st.length - suf.length >= 3) out.push(st.slice(0, -suf.length));
    }
    return out.filter((f) => f.length >= 3);
  };
  return content.some((w) => forms(w).some((f) => haystack.includes(f)));
}

async function addFiguresToGuide(guide, { apiKey, fetchImpl = defaultFetch, log = () => {} } = {}) {
  const STAGES = ['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim'];
  const sections = Array.isArray(guide.sections) ? guide.sections : [];
  const hasFig = (s) => !!(s && (s.image || s.codeFigure || s.imageWrong || s.imageCorrect));
  // The misconception card is the strongest visual on the page, so it counts as a
  // gap too when a roll leaves it as plain text.
  const bare = sections.filter((s) => s && (STAGES.includes(s.id) || s.id === 'errors') && !hasFig(s));
  if (!bare.length) return { guide, added: 0 };

  // Show the model the whole guide (so labels can be grounded anywhere in it) and
  // name exactly which sections need a figure.
  const view = sections.map((s) => ({ id: s.id, heading: s.heading, items: s.items, body: s.body }));
  const already = sections.filter((s) => s && s.codeFigure && s.codeFigure.kind !== 'error-board')
    .map((s) => s.codeFigure.kind);
  const ask = [
    'Sections needing a figure: ' + bare.map((s) => s.id).join(', ') + '.',
    bare.some((s) => s.id === 'errors')
      ? 'For "errors" return an error-board: { "kind":"error-board", "wrong": <a small figure spec>, "correct": <the same kind, drawn right>, "labelWrong":"<≤4 Arabic words>", "labelCorrect":"<≤4 Arabic words>" } — the two halves MUST differ, and the ✓ half must be the lesson\'s correct version.'
      : '',
    already.length ? 'Kinds already used in this lesson (do not repeat, and remember the one-wide-visual limit): ' + already.join(', ') + '.' : '',
    'The guide:', JSON.stringify({ meta: guide.meta, sections: view }),
  ].filter(Boolean).join('\n');

  let out;
  try {
    out = await callOnce({ note: 'figure pass' }, { apiKey, fetchImpl, system: FIGURE_PASS_SYSTEM, extra: ask });
  } catch (e) {
    log(`  (figure pass failed — keeping the guide as it is: ${e.message})`);
    return { guide, added: 0 };
  }
  const figures = (out && out.figures) || {};
  let added = 0;
  for (const s of sections) {
    if (!s || !s.id || hasFig(s) || !figures[s.id]) continue;
    const clean = sanitizeCodeFigure(figures[s.id]);
    if (!clean) continue;
    // Drop any label the lesson does not actually support, and drop the whole figure
    // if too little survives — a figure of invented labels is worse than no figure.
    const hay = JSON.stringify({ meta: guide.meta, sections: view });
    if (Array.isArray(clean.items)) {
      const kept = clean.items.filter((it) => labelGrounded(it.label, hay));
      if (kept.length !== clean.items.length) {
        log(`  – dropped ${clean.items.length - kept.length} invented label(s) from ${s.id}`);
      }
      if (kept.length < 2) continue;
      clean.items = kept;
    }
    if (Array.isArray(clean.stages) && clean.stages.some((st) => !labelGrounded(st.label, hay))) {
      log(`  – ${s.id}: process stages are not grounded in the lesson — figure dropped`);
      continue;
    }
    s.codeFigure = clean;
    added++;
  }
  if (added) log(`  + figure pass added ${added} code visual(s) to bare stage(s)`);
  return { guide: applyFigureBalance(guide), added };
}

// The figure-balance rules, applied to any guide: identical visuals are duplicates, a
// stage may carry a code visual and up to two supporting sections may too. There is no
// longer a cap on card-spanning visuals — that cap existed to protect a two-page
// contract, and deleting a teaching figure to save page height is exactly what the
// raw lesson is not supposed to pay for. Callable so the figure pass obeys them too.
function applyFigureBalance(out) {

  const sig = (cf) => JSON.stringify([cf.kind, cf.shape, cf.parts, cf.shaded, cf.total, cf.north, cf.east, cf.text,
    (cf.items || []).map((i) => i.label), (cf.stages || []).map((i) => i.label), (cf.parts || []).map ? (cf.parts || []).map((p) => p && p.label) : cf.parts]);
  const seen = new Set(); let stageCount = 0, sideCount = 0;
  const STAGES = new Set(['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim']);
  // Whether a STEP SET spans the card is a layout call the renderer makes, and the
  // condenser must never delete a teaching step to influence layout.
  for (const s of out.sections) {
    if (!s || !s.codeFigure || s.codeFigure.kind === 'error-board') continue;
    const k = sig(s.codeFigure);
    const isStage = STAGES.has(s.id);
    // Duplicates never survive. Beyond that: every stage may carry a code visual,
    // and up to two supporting sections (solutions, homework, goal …) may too.
    if (seen.has(k) || (isStage ? stageCount >= 4 : sideCount >= 2)) { delete s.codeFigure; continue; }
    seen.add(k); if (isStage) stageCount++; else sideCount++;
  }
  // The model's job is supporting pictures; the teaching visuals are code. Two
  // pictures per lesson is plenty — past that a stage is better served by a code
  // visual, which the figure pass supplies. Dropping the reference here also means
  // the image is never generated, so the extra picture costs nothing either.
  {
    let pics = 0;
    for (const s of out.sections) {
      if (!s || !s.image) continue;
      if (++pics > 2) delete s.image;
    }
  }
  // Supporting sections must not eat the budget while a stage sits bare.
  {
    const bare = ['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim']
      .filter((id) => { const s = out.sections.find((x) => x && x.id === id); return s && !s.image && !s.codeFigure; });
    if (bare.length) {
      for (const s of out.sections) {
        if (s && s.codeFigure && s.codeFigure.kind !== 'error-board' && !STAGES.has(s.id)) delete s.codeFigure;
      }
    }
  }

  return out;
}

async function condenseToGuide(content, { apiKey, fetchImpl = defaultFetch, log = () => {}, extra = '' } = {}) {
  const richFigures = RICH_FIGURE_REGIONS.has(String((content.meta && content.meta.region) || '').toLowerCase());
  const system = buildSystem(richFigures);
  if (richFigures) log('Figure policy: rich (region design set) — every card carries a teaching figure.');
  // A lesson can need several condense calls (tighten passes, the figure pass), and a
  // single flaky response used to sink the whole render. Retry with a short backoff:
  // the failures seen in a corpus run were transient, not deterministic.
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  let out; let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      out = await callOnce(content, { apiKey, fetchImpl, system,
        extra: attempt === 0 ? extra
          : `${extra ? extra + '\n' : ''}CRITICAL: your previous output was INVALID JSON. Return one complete, valid, parseable JSON object and nothing else.` });
      break;
    } catch (e) {
      lastErr = e;
      if (attempt < 2) { log(`  (condense attempt ${attempt + 1} failed: ${e.message} — retrying)`); await sleep(2000 * (attempt + 1)); }
    }
  }
  if (!out) throw lastErr;
  if (!Array.isArray(out.sections) || out.sections.length < 8) {
    // Say WHAT came back: "bad guide shape" alone sent me hunting through prompt edits
    // when the real cause was a truncated completion.
    const got = Array.isArray(out.sections)
      ? `${out.sections.length} section(s): ${out.sections.map((x) => (x && x.id) || '?').join(', ')}`
      : `sections was ${typeof out.sections}`;
    throw new Error(`condense: bad guide shape — ${got}`);
  }
  const ids = new Set(out.sections.map((s) => s && s.id));
  for (const need of ['goal', 'stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim']) {
    if (!ids.has(need)) throw new Error(`condense: missing required section "${need}"`);
  }
  // Normalize shapes the model commonly gets wrong (deterministic — no re-prompting).
  for (const sec of out.sections) {
    if (!sec || !Array.isArray(sec.items)) continue;
    sec.items = sec.items.map((it) => {
      if (typeof it !== 'string') return it;
      if (sec.type === 'bullets') return { text: it };
      if (sec.type === 'steps') return { label: '', body: it };
      if (sec.type === 'qa') return { q: it };
      if (sec.type === 'fields') return { label: it, value: '' };
      return it;
    }).filter((it) => it && (it.text || it.body || it.q || it.value || it.label));
  }
  // Images are handled DETERMINISTICALLY: the model attaches ids (section.image)
  // and may AUTHOR pilot-grammar teaching figures, but code owns the outcome.
  // A referenced id that exists in the SOURCE is copied byte-for-byte (asset-store
  // cache always hits); an authored id is kept only if its entry is sane (real
  // prompt + label). One figure per section, no repeats; stages left bare are
  // auto-assigned from remaining source images (scenes suit التمهيد, labelled
  // diagrams suit the teaching stages).
  // Hybrid regions never reuse source prompts (they request in-image text, which the
  // textless contract forbids) — the model authors every figure fresh.
  // Labeled mode reuses the source's own (already labelled) prompts — free cache
  // hits; hybrid mode must author fresh wordless briefs instead.
  const srcById = (richFigures && FIGURE_MODE === 'hybrid') ? new Map() : new Map((content.images || []).map((im) => [im.id, im]));
  const outById = new Map((out.images || []).filter((im) => im && im.id).map((im) => [im.id, im]));
  const POS = new Set(['top-right', 'top-left', 'bottom-right', 'bottom-left', 'top', 'bottom']);
  const cleanOverlays = (o) => Array.isArray(o) ? o.slice(0, 3)
    .filter((v) => v && typeof v.text === 'string' && v.text.length <= 40 && POS.has(v.pos))
    .map((v) => ({ text: v.text, pos: v.pos, kind: v.kind === 'fraction' ? 'fraction' : 'chip' })) : undefined;
  for (const s of out.sections) {
    if (!s) continue;
    if (s.codeFigure) {
      const clean = sanitizeCodeFigure(s.codeFigure);
      if (clean) { s.codeFigure = clean; if (clean.kind !== 'error-board') delete s.image; }
      else delete s.codeFigure;
    }
    if (s.labelWrong) s.labelWrong = String(s.labelWrong).slice(0, 60);
    if (s.labelCorrect) s.labelCorrect = String(s.labelCorrect).slice(0, 60);
  }
  const seenIm = new Set();
  const rebuilt = [];
  const keepRef = (s, field) => {
    const id = s[field];
    if (!id || seenIm.has(id)) { delete s[field]; return; }
    const src = srcById.get(id);
    const authored = outById.get(id);
    const entry = src || ((richFigures || !srcById.size) && authored && typeof authored.prompt === 'string' && authored.prompt.trim().length >= 40 && authored.label
      ? { id: String(authored.id), concept: authored.concept === 'scene' ? 'scene' : 'diagram', label: String(authored.label), prompt: authored.prompt,
          overlays: cleanOverlays(authored.overlays) } : null);
    if (!entry) { delete s[field]; return; }
    seenIm.add(id);
    rebuilt.push(src ? { id: src.id, concept: src.concept, label: src.label, prompt: src.prompt } : entry);
  };
  for (const s of out.sections) {
    if (!s) continue;
    if (s.imageWrong) keepRef(s, 'imageWrong');
    if (s.imageCorrect) keepRef(s, 'imageCorrect');
    if (!s.image) continue;
    if (seenIm.has(s.image)) { delete s.image; continue; }
    const src = srcById.get(s.image);
    if (src) {
      seenIm.add(s.image);
      rebuilt.push({ id: src.id, concept: src.concept, label: src.label, prompt: src.prompt });
      continue;
    }
    const authored = outById.get(s.image);
    // Authored figures are a rich-figure-region feature; elsewhere they are only
    // legal when the source has no images at all (the pre-existing contract).
    if ((richFigures || !srcById.size)
        && authored && typeof authored.prompt === 'string' && authored.prompt.trim().length >= 40 && authored.label) {
      seenIm.add(s.image);
      rebuilt.push({ id: String(authored.id), concept: authored.concept === 'scene' ? 'scene' : 'diagram',
        label: String(authored.label), prompt: authored.prompt });
      continue;
    }
    delete s.image;
  }
  const remaining = (richFigures && FIGURE_MODE === 'hybrid') ? [] : (content.images || []).filter((im) => !seenIm.has(im.id));
  const pick = (pred) => { const i = remaining.findIndex(pred); return i < 0 ? null : remaining.splice(i, 1)[0]; };
  for (const id of ['stage-tamhid', 'stage-arad', 'stage-tatbiq', 'stage-taqwim']) {
    const sec = out.sections.find((x) => x && x.id === id);
    if (!sec || sec.image) continue;
    const im = id === 'stage-tamhid'
      ? (pick((x) => x.concept === 'scene') || pick(() => true))
      : (pick((x) => x.concept === 'diagram') || pick(() => true));
    if (!im) break;
    sec.image = im.id;
    rebuilt.push({ id: im.id, concept: im.concept, label: im.label, prompt: im.prompt });
  }
  out.images = rebuilt;
  // Structurer labels sometimes carry English scaffolding in parentheses
  // ("نشاط الاستهلال (Hook)") which would print as the figure caption. Labels are
  // display-only (the cache key is the prompt), so for non-English lessons strip
  // any parenthetical that contains Latin letters; pure-Arabic parentheses stay.
  const guideLocale = String((out.meta && out.meta.locale) || (content.meta && content.meta.locale) || '').toLowerCase();
  if (guideLocale && !guideLocale.startsWith('en')) {
    for (const im of out.images) {
      if (!im || !im.label) continue;
      const cleaned = String(im.label).replace(/\s*\([^)]*[A-Za-z][^)]*\)/g, ' ').replace(/\s{2,}/g, ' ').trim();
      if (cleaned) im.label = cleaned;
    }
  }
  // Correct the known Arabic errors a reviewer has already caught once (agreement,
  // imperatives, letter names, canonical glossary wording). In code, so the same
  // mistake cannot come back on the next roll.
  fixGuide(out, { log });
  applyFigureBalance(out);
  // LANGUAGE SAFETY: the guide must never disagree with its own text about language.
  // A wrong locale (seen: "en" on an Arabic lesson) flips the whole page to LTR and
  // makes the figure prompts ask for ENGLISH labels — so derive it from the script.
  {
    out.meta = out.meta || {};
    const AR_LOCALES = ['ar', 'ur', 'sd', 'fa', 'ps'];
    const guideText = JSON.stringify(out.sections || []);
    const isArabicScript = /[\u0621-\u064A]/.test(guideText);
    const declared = String((content.meta && content.meta.locale) || out.meta.locale || '').toLowerCase();
    if (isArabicScript && !AR_LOCALES.includes(declared)) {
      if (out.meta.locale !== 'ar') log(`  (locale corrected to "ar": the guide text is Arabic but locale said "${out.meta.locale || declared || 'none'}")`);
      out.meta.locale = 'ar';
    } else if (declared) out.meta.locale = declared;
    for (const k of ['subject', 'grade', 'region']) {
      if (!out.meta[k] && content.meta && content.meta[k]) out.meta[k] = content.meta[k];
    }
  }
  if (NO_IMAGES) {
    // Enforce it in code, not just in the prompt: drop every image reference so
    // nothing can reach the generator.
    for (const s of out.sections || []) { delete s.image; delete s.imageWrong; delete s.imageCorrect; }
    if ((out.images || []).length) log(`  (code-only mode: discarded ${out.images.length} image brief(s) — no generation)`);
    out.images = [];
  }
  if (out.meta) delete out.meta.banner;
  log(`Condensed to the guide template: ${out.sections.length} sections, ${out.images.length} reused image(s).`);
  return out;
}

module.exports = { condenseToGuide, addFiguresToGuide, labelGrounded };
