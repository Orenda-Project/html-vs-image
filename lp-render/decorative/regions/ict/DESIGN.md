# ICT (NIETE) design pack — grades 6–12 and Grades 1–5 lesson plans

**Status: built to NIETE's approved page design; not yet reviewed by ICT/NIETE.** Tracked on Notion
as FEAT-171. Local validation only: nothing here is connected to NIETE-Rumi staging or production.

## The reference

NIETE's approved lesson-plan PDFs (the "lp_pdfs" references, shared 2026-09-30): Grade 1 English
(`grade_1_english_ch3_seg1`), Grade 1 Maths (`grade_1_maths_ch3_seg19`) and Grade 1 Urdu
(`grade_1_urdu_ch1_seg990`, a revision-day variant). Each is four portrait pages, 1792×2400, one
page per stage of the lesson. **One design for every subject**, as asked: the Urdu reference's
revision-day group layout is not used; Urdu lessons take the standard pages with their text
right-to-left. The references are whole-page images, so this pack rebuilds the design in HTML, CSS
and SVG; colours were sampled from their pixels.

| Page | What it holds (from the lp_doc) |
|---|---|
| **Start** | Header: minutes, "Grade N Subject", the topic, the textbook pages; a lesson path (previous ✓ → today ● → next) when the lesson carries a sequence. JOURNEY SO FAR (previous lesson, what the warm-up recalls) · TODAY (outcome, the "by the end" promise, SLO code) · COMING UP (next lesson, checkpoint). TO PREPARE (materials, video). WARM UP beside OPENING (the hook, "Listen for"). WRITE ON BOARD (key words, board text). |
| **Explanation** | Numbered steps (the teacher's words in a slate speech bubble), KEY FACT (amber), WATCH FOR THIS SLIP (with every recorded mistake: what pupils write → what you ask), WORKED EXAMPLE, CHECK FOR UNDERSTANDING (green) + IF THEY STRUGGLE. A diagram or a short formula sits beside the card it explains. |
| **Practice** | GUIDED PRACTICE — teacher and class together (TOGETHER WE SOLVE: the faded example, its answer in a green pill; "We do" lists with their answers). INDEPENDENT PRACTICE — on your own (numbered, an answer box each) beside FOR STUDENTS WHO ARE BEHIND / AHEAD. ANSWERS — FOR THE TEACHER along the foot. |
| **Conclusion** | EXIT TICKET — pick ONE: the checkpoint, the exit questions (with "Ans:"), and for grade 9+ one FBISE MCQ as four chips with the key in green. REMEMBER (amber), HOMEWORK (with answers where the lesson gives them), Tomorrow (green), COACHING CORNER (record → send to NIETE → tips back). |
| **Teacher support** | What a grades 6–12 lesson adds to the grade 1 pages: the board at the end of the lesson (ICT's board-plan diagram + draw order), FBISE format questions (grade 9+: the other MCQs, the short response + mark scheme, the long-question plan), homework in full (the homework key). |

Chrome labels are the approved design's English ones for every subject, exactly as the approved
Urdu reference prints them; the lesson's own words stay in its language and direction. The page
chrome is left-to-right for Urdu too (as the Urdu reference is); only the content is RTL (Nastaliq).

ICT's own omissions still hold: model answers are never printed, the FBISE bank is grade 9+ only,
"not going today" is not printed, the objective list stays in the document. One deliberate
difference from ICT's production template: **the next lesson is printed** (COMING UP, "Tomorrow:"),
because the approved page design prints it. Every omission is in `report.notPrinted`.

## How it is built

```
lp_doc ──► guide/from-lpdoc.js ──► guide.layout  (guide/lpdoc-pages.js: the page model, plain data)
                                        │
                                        ▼
            regions/ict/pages.js  (the page composer: Start … Teacher support, as HTML + SVG)
            regions/ict/art.js    (code-drawn icons and figures: teacher, pupils)
            regions/ict/theme.js  (the design's CSS; COMPOSE + PAGE_LAYOUT for the pipeline)
                                        │
                                        ▼
            render/fixed-pages-pdf.js  (paginate in the browser, print 896×1200 pages as vector PDF)
```

The pipeline calls the pack's `COMPOSE` (only the ict pack has one) instead of the shared
renderer, and prints through `render/fixed-pages-pdf.js` when a pack declares
`PAGE_LAYOUT.fixedPages` (only the ict pack does). Every other region renders exactly as before.

**Pagination.** Every page is 896×1200 CSS px (the references' 1792×2400 at 2×). The printer fits
each page in the browser:
1. a page a little too long is set a little smaller (down to 0.91×; down to 0.85× when it is at most
   18% over) before anything moves;
2. otherwise the stage continues on a page headed "— continued": whole rows move first, a heading
   row goes with what it heads, a list row divides between the two pages;
3. every page is then set as large as it will go (up to 1.22×), and its main row stretches to the
   foot, so pages fill as the approved ones do.

Only a single block taller than a whole page makes a page grow (printed at its own height, never
clipped). The scale is CSS zoom on the page body with its width compensated. The `.html` saved
beside the PDF is the paginated page, so it is the same pages.

**Figures.** ICT's own diagram engine (vendored verbatim) draws every diagram as SVG, sized by
ICT's own rule (`figureSlot`): as small as its smallest label allows, never wider than the column.
Each teaching figure wears ICT's badge ("Geometry", "Mind map"). The illustrations the references
have (people, objects) were generated as images; here they are simple figures drawn in code
(`art.js`), so a lesson costs nothing — a teacher beside TOGETHER WE SOLVE, two pupils in any room
the OPENING card has left.

**Maths.** KaTeX (and MathJax for chemistry, `\ce`), rendered at build time. Answers print in green
(`\color`), an inline matrix is display-sized, a MathJax equation too wide for a narrow column
scales down to fit. TeX that does not parse is listed in `report.warnings`, never rewritten.

## Render an ICT lesson locally

```
npm install
npm run render:ict -- lp-render/fixtures/ict/niete_v9_gate_base.lp.json
#   -> out/ict/PK_G9_MATH_CH1_MATRIX_MULTIPLY.en.{pdf,html,png,guide.json,report.json}
#   --lang ur for a lesson with an Urdu overlay; --out <dir> to write elsewhere
```

No API key is needed and nothing is bought. Real inputs, and where each came from:
`lp-render/fixtures/ict/README.md`.

## Grades 6–12: ICT's production page (the approved design since 2026-10-02)

**The reference:** NIETE's approved grades 6–12 lesson plans, shared 2026-10-02 — Grade 9 English
(`grade_9_english.c10.p135-136`), Grade 7 Mathematics (`grade_7_mathematics.c12.p237-238`), Grade 6
Urdu (`grade_6_urdu.c08.p044-044`). They are ICT's own production renderer's output (lp_doc 3.0,
v9.3 phone page): one 520 px column printed on TWO pages, 390 pt wide, each as tall as its part —
the lesson, then the teacher support. This replaces, for grades 6–12, the stage-page design built on
30 Sep from the Grade 1 references (`pages.js`, still in the repo, no longer dispatched to).

**The page** (`secondary.js`, style under `.icts`): navy title card (GRADE · SUBJECT, title,
chapter, pages · minutes, the board-weight chip) · lesson path · learning outcome (amber) · video ·
materials · pacing · key words · a bar per stage — Introduction teal I, Development navy D, Activity
green A, Conclusion purple C, Home work slate H — with that stage's cards in ICT's order; then
TEACHER SUPPORT · NOT FOR THE BOARD and the lettered groups (the board at the end of the lesson,
FBISE questions for grade 9+, homework in full, coaching corner). Urdu lessons run right to left in
ICT's Urdu labels, as the approved Urdu page does. The cards come from the adapter
(`lp-render/guide/from-lpdoc.js`), already in ICT's order; the page only lays them out, and a test
checks every string of every card reaches it (seven real lessons).

**Added, drawn in code ($0)** (`secondary-art.js`): a subject picture on the title card (maths,
English, Urdu, science, chemistry, physics, biology, Islamiat, social studies, computer); the lesson
path as three marked steps; the pacing line drawn as a bar of its stages (only when its numbers add
up, one per stage); a picture on every stage bar; an icon on every card label (the approved page's
emoji are drawn as icons); ✗ / ✓ badges on the mistakes; tick boxes on the mark schemes; level
pills on the homework; the coaching steps with icons. Diagrams are ICT's own engine's SVG.

**Visual examples (2026-10-02, round 2)** — the lesson's own examples drawn as shapes, beside or
under the words they illustrate; the words are never changed and nothing is added that the line
does not say:
- a matrix-product worked example (I do, We do): its own two matrices, each "Row r with column c"
  step lit in the colour and number it has in the text, and the product cell it fills — "?" where the
  lesson leaves the step to pupils;
- a reaction or a word equation the lesson writes: the same substances or words as tiles, one dot
  per coefficient, the condition over the arrow (each distinct one once, at most four);
- a ratio (2:1, 2:3, at most 6 a part): that many blocks; "N marks": N dots;
- a quotation: a quote chip; numbered steps: one path with a rail;
- MCQ letters as answer-sheet bubbles, key-word initials as badges, ✗ → ✓ on the mistakes, a ticket
  shape for the exit ticket, level icons on the homework, wordless figures on the opening question,
  I do, We do, independent practice and coaching cards.
Nothing is illustrated inside "What pupils write" (a pupil's mistake). Tests check the drawings carry
only the lesson's numbers and formulas, and leave blank what the lesson leaves blank.

**Subject by subject (2026-10-02, round 3)**, checked against NIETE's three approved references
rebuilt from ICT production's PDFs (`fixtures/ict/rebuilt_*`):
- English reading: "Cause:" / "Effect:" (and "CAUSE", "EFFECT") as coral and blue tags; an arrow
  joins a labelled cause to its effect. Urdu "وجہ: / سبب:" and "نتیجہ: / اثر:" are tagged the same
  way, with the arrow pointing left.
- Mathematics, the mean: a worked example that averages a list the lesson writes out gets the list
  as bars, counted 1…n underneath. The stated mean is a dashed line, and each bar's part above it is
  amber (the part that evens out the bars below). Where the lesson leaves the mean to pupils, the
  chip reads "?" and no line is drawn. Nothing is drawn if the stated mean is not the values' mean.
- Urdu grammar: each kind of اسم (ذات، جمع، صوت، آلہ، مکبر، مصغر، ظرف، خاص) has its own picture.
- Every subject: a key word whose idea has a picture (cause, effect, fact, opinion, the mean, Σ, the
  kinds of اسم) shows it in place of the letter badge. A key-point list shows a picture per point
  only when every point has one; otherwise it keeps its dots.
- Urdu lines that sat on the line above (the outcome, resources, coaching steps, MCQ options) now
  have Nastaliq's line height.
- A long answer formula ("Sum = 73 + … = 756") wraps at its + and = as on ICT's page. The adapter
  colours answer maths with `\color` used as a switch; braced, the formula became one unbreakable
  group.

**Printed** by `lp-render/render/part-pages-pdf.js`: each `.spart` on its own page, as tall as itself.

**Measured against ICT's renderer on the same lessons:** our parts run about 4–7% taller (the added
pictures). Not printed: the coaching WhatsApp number (pending a decision).

## Grades 1–5: the approved phone page

**The reference:** NIETE's approved Grades 1–5 lesson plans (lp_html v8.1), shared 2026-10-01 —
Grade 1 English, Grade 1 Maths, Grade 2 Urdu. One column 520 px wide on tall 520×2000 pages
(390×1500 pt), read top to bottom on a phone; 6 pages each; no pictures.

**The page, top to bottom:** navy title card (GRADE · SUBJECT, page · minutes, title, chapter) ·
day stepper · TODAY · journey so far / coming up · learning outcome (amber) · to prepare (tick
boxes) · video · key words · write on the board (numbered panels) · then a bar per stage — Opening
teal I, Explanation navy D (I DO), We Do blue A, You Do green A, Check purple C, Homework slate H —
with that stage's cards (warm-up, the opening question, read aloud, teacher models, worked example,
ask this, common mistakes, the We Do card with its sentence frames, set the task going, pupils work
alone with answers, differentiation, exit ticket, homework) · coaching corner. Every page after
the first has the running head "<title> · continued"; every page the footer and "page N of M"; a
stage that runs over continues under its own bar, "· continued". Urdu runs right to left in its
approved labels (some stay English, as approved), Nastaliq; an English-only line reads left to
right.

**Built:** `lp-render/guide/from-primary.js` (checks an `ict-primary-lesson` file) → `primary.js`
(lays out the column; colours sampled from the approved pages; Inter, as the approved PDFs embed)
→ `lp-render/render/phone-pages-pdf.js` (flows the blocks onto pages in the browser and prints
them: a heading moves with what it heads; a list, a table or a long paragraph may divide between
its rows or sentences, so no page is left half empty; text is never shrunk to fit). The pack's
`COMPOSE` picks the layout by `guide.layout.kind`; this page names its own page layout
(`{width: 520, height: 2000, flow: true}`), which the pipeline routes to the phone printer.

**Added to the approved pages (child-friendly, $0):** pictures drawn in code from the lesson's
own words (`primary-art.js`), in a picture-book style (toy colours, round shapes, faces with rosy
cheeks, a smiling sun) — alarm-style clocks at the lesson's times beside a cheerful digital clock,
letter blocks, a smiling word blender, the blending steps as a staircase, the story's scenes
(Bunty's room with both clocks, the Fun Fair poster, the songbird, the kite, the lake, the crying
boy, pair reading), a numbered story map, the fluency tracker as a coloured table, speech bubbles
with a face per speaker, a picture on every stage bar and an icon on every section label, the
reading-pause sign as a chip. The teaching marks stay exact: hands, times and letters are the
lesson's. **Fixed from the approved pages:** a teacher
line split at "p."; a clock drawn in text characters; the leaked key "model_solution:"; "(avatar)";
a text table of pipes; Urdu arrows that pointed against the reading direction.

**Teacher rule (2026-10-05): no word of the lesson is coloured.** Every word of the lesson reads
in plain ink (`--ink`), in English and in Urdu. Colour marks structure only: stage bars, card
backgrounds and borders, labels, chips and pills, numbers, pictures. This is where the page differs
from the approved one, which printed answers, the teacher's instruction and some card text in green
or brown:
- An answer (warm-up, exit ticket) is marked by a green tick badge, not by a coloured arrow and words.
- The "Answer" / "Sample answer" labels carry the same tick.
- The teacher's instruction keeps its weight, with a green ▸ marker before it.
- "Say:" is a small green chip.
- The journey, coming-up, outcome, to-prepare, video and mistakes cards keep their colours; their
  words are ink.
The word-building board (syllable tiles, arrows, a line to write the word) and the other pictures are
unchanged. `ict-primary.test.js` checks in the browser that every word the page prints, outside a
label, chip, bar or picture, is ink, for all six lessons. The test fails when an answer turns green.

**The newer approved lessons (2026-10-05): Science G4, GK G1, Islamiat G1, SST G5.** Four more
approved Grades 1–5 lesson plans (lp_doc 3.0 rendered by lp_html v8.1, the same phone page, made
5 Oct). ICT's own Grades 1–5 production pipeline does not make these: it delivers pre-rendered
image PDFs for English, Maths, Urdu (G1–5) and General Science (G4–5) only, and GK, Islamiat and SST
exist there only as a pilot. Their lp_doc JSON is not reachable from here, so each lesson was
rebuilt field by field from its approved PDF (`fixtures/ict-primary/README.md`); every letter of
the lesson file was checked against the approved PDF's text (none differs). The page gained the
pieces these lessons use, each from its approved page:
- a core-idea box ("بنیادی تصور" with its "مقصد" pill) and a "remember" line;
- a teacher-models card as a run of instructions, quoted lines, think-alouds, sentence frames,
  bullets and charts;
- a two-part mistakes card (what pupils say / what you ask);
- a numbered list of outcomes;
- a comparison chart and a step-by-step chart with a word on each arrow (HTML, words in ink), on
  their own card ("موازنہ", "مرحلہ وار خاکہ");
- the board as it should look at the end of the lesson;
- a coaching "look for this" line;
- the teacher-support page (homework answered in full), which starts a page of its own;
- Urdu digits for the page's own numbers (grade, minutes, steps, page N of M), as these lessons
  print them (`numerals: "urdu"`).
Pictures added, drawn from each lesson's own words: the solar system (Science), the introduction's
three stairs (GK), the greeting (Islamiat: two ordinary children, never a revered figure, the
bubbles carrying the board's own words), and the hook's two circles on the board (SST: a crescent
over a mosque and the flag of Pakistan; no person). Each lesson prints on as many pages as its
approved PDF (6, 7, 7, 8). The six earlier lessons print exactly as before.

**Straight from ICT's own Grades 1–5 pipeline (2026-10-06): G2 and G3 Maths.** ICT's K-5 pipeline
runs offline in the operator workspace (`niete-nbpro`):
- A page truth → B segmentation → C enrichment → D0 the slide script (`_slide_script.json`).
- D: an image model then draws each page as a picture.
- F: the pictures are joined into the PDF.

The slide script is the whole lesson as fields: goal, SLO, key words, board, warm-up, I Do steps and lines (with
their Roman-Urdu versions), worked example, CFU, slip, We Do, partner work, You Do problems with
answers, behind/ahead, exit options, homework, reflection.

`lp-render/guide/from-slide-script.js` turns that file into a Grades 1–5 lesson, and the page draws it,
replacing step D:
- Every teacher-facing field is printed word for word, in the script's order.
- ICT's PDF of the same lesson is 4 full-page pictures with no text layer, about 14 MB before compression.
- Ours: real text, pictures drawn in code, $0.
- Not printed: the script's `diagram` strings (instructions to the image model, "[bundle][bundle]…") and
  operator notes.
- Instead, each worked number is drawn in a place-value chart counted from the number itself, so the
  picture cannot disagree with the sum beside it: bundles of sticks for G2, base-10 blocks (cube, flat,
  rod, dot) for G3. A "[cube] = 1000" line draws its pieces inline.

New optional page pieces (the ten existing lessons print exactly as before):
- a line under TODAY;
- journey / coming up as a list of days;
- a key word's Urdu and syllables;
- a board note;
- labelled sub-lines (Listen for, If they struggle, Why, How to run, Coach, Success criteria);
- the Roman-Urdu teacher line;
- a key-fact box;
- a worked example's problem and answer (blue in We Do);
- a word-problem chip;
- behind/ahead tasks with answers;
- an exit option's Roman-Urdu line and MCQ choices.

**ICT's HTML path for Grades 1–5: the lp_doc itself (2026-10-06).**

ICT also has an HTML path for Grades 1–5, beside the image path. The flow is:
- enrichment → a lesson written as **lp_doc 3.0** (the grades 6–12 format);
- → ICT's own lp-v9 renderer (HTML/CSS/SVG, a phone page) → PDF.

The newer approved references (v17) come from it.

What is still missing:
- The step that turns ICT's Grades 1–5 enrichment into lp_doc has **not been found in any reachable
  repo**: not in NIETE-Rumi (main, staging, sandbox), the skills pack (any branch) or the curriculum
  explorer.
- So existing lp_docs can be tested now, but authoring new Grades 1–5 lessons automatically is not
  yet traced.
- The only reachable Grades 1–5 lp_doc is ICT's own `GK_g1_seg2.ur.lp.json` (NIETE-Rumi sandbox,
  5 Oct). It is copied here unchanged in `fixtures/ict-primary/lp-doc/`.

`lp-render/guide/from-lpdoc-primary.js` draws a Grades 1–5 lp_doc on **our Grades 1–5 page**, not the
grades 6–12 one. Before this, a grade 1 lp_doc came out in the 6–12 production design.
- Each part goes where the approved v17 pages put it: board, opening, core idea, solved example
  with its CFU, charts, mistakes, We Do, You Do, differentiation, remember, exit ticket, homework,
  coaching, and the support page.
- Every printed word is the document's own, and lesson words are in ink.
- Against ICT's own renderer on the same file, this:
  - draws the core-idea box, which ICT's sandbox renderer skips;
  - prints list fields as sentences, where ICT joins them with commas;
  - leaves "یہ حصہ ابھی تیار نہیں ہوا" (not ready yet) slots off the page and reports them;
  - fits every page, where ICT's overflows one page by 126 px.
- ICT's panels and flow diagrams become the page's own comparison and step-by-step cards. Any other
  diagram type is refused.
- The page number now follows the lesson's digits, so Urdu pages print it in Urdu.

The twelve earlier Grades 1–5 lessons and grades 6–12 print exactly as before.

**Not printed:** the coaching WhatsApp number (waiting for a decision, as for grades 6–12), and,
in a lesson with no support pages, "Support pages follow".

```
npm run render:ict -- lp-render/fixtures/ict-primary/g2_ch10_Urdu_seg2.lesson.json
#   -> out/ict/g2_ch10_Urdu_seg2.ur.{pdf,html,png,page-N.svg,guide.json,report.json}
```

## Still open

- **Approval of the Grades 1–5 pages with pictures.** The pictures and the fixes above are this
  pack's additions to the approved design.
- **Grades 1–5 lesson data.** ICT's own slide scripts are now read directly (G2 and G3 Maths here).
  - The niete-curriculum-explorer data (11 Sep) lists 1,315 K-5 lessons with a slide script.
  - Still open: Urdu-medium scripts, revision panels, and the v17 lp_doc lessons behind the newer
    approved references.
- **Approval of the grades 6–12 adaptation.** The references are grade 1; the Teacher support page
  and the exam-bank exit option are this pack's reading of where grade 6–12 content belongs.
- **Logo.** The header mark is a plain "N" monogram drawn in code; ICT's own logo file replaces it.
- **Coaching number.** The references print NIETE's WhatsApp number; the public code redacts it, so
  the line reads "Send it to NIETE on WhatsApp" until ICT confirms the number to print.
- **Illustrations.** Code-drawn figures, not the references' generated pictures (zero cost). Topic
  pictures would need either ICT's textbook crops or a paid image model (~$0.004 each on KIE).
- **Textbook crops.** `textbook_figure.src` points to a crop on ICT's side; printed as a book
  reference until the crops are reachable.
- **Circuit diagrams** use the engine's built-in drawing; ICT's high-fidelity path needs `schemdraw`.
