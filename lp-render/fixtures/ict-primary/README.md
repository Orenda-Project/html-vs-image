# ICT (NIETE) Grades 1–5 fixtures

The three lesson plans NIETE approved as the Grades 1–5 design reference (lp_html v8.1, the phone
page), each written out as an `ict-primary-lesson` file so this repo can draw it.

NIETE's own Grades 1–5 lesson data is not reachable from here, so each file was **transcribed from
the approved PDF**, field by field, with nothing reworded. Each file's `source` says how, and lists
the reference's print defects that the file does not carry over (`presentation_fixes`).

| File | Lesson | How it was transcribed |
|---|---|---|
| `g1_ch9_Maths_seg1.lesson.json` | Grade 1 Maths, Ch.9 "Tick-Tock Time Travel" — Reading Time on Analogue & Digital Clocks (introduction), p.220, day 1 of 11 | from the PDF's own text layer |
| `g1_ch10_English_seg1.lesson.json` | Grade 1 English, Ch.10 "Pinky's Garden of Wonders!" — Predict + Word Blender + Using a Dictionary (Memory Lane), p.124, day 1 of 10 | from the PDF's own text layer |
| `g2_ch10_Urdu_seg2.lesson.json` | Grade 2 Urdu, Ch.10 «جھیل سیف الملوک کی سیر» — بلند خوانی، p.72, day 2 of 8 | by hand from the page images (the PDF's Urdu text layer is in visual order and cannot be copied cleanly) |

Three more lessons test the same page on other grades and other content. They are **not NIETE
lessons**: they were written for design testing from the public Punjab Textbook Board books (Single
National Curriculum 2020), with the textbook's own words kept word for word and the teaching steps
written around them in the approved structure.

| File | Lesson | From |
|---|---|---|
| `g3_u5_English_road_safety.lesson.json` | Grade 3 English, Unit 5 "Road Safety" — Road Safety Rules + road signs | PCTB English 3, pp. 47–50 |
| `g2_u1_Maths_ordinal_numbers.lesson.json` | Grade 2 Maths, Unit 1 "Whole Numbers" — Ordinal Numbers, first to twentieth | PCTB Mathematics 2, pp. 2–3 |
| `g4_l4_Urdu_achhe_shehri.lesson.json` | Grade 4 Urdu, سبق ۴ «ہم بنیں گے اچھے شہری» | PCTB Urdu 4, pp. 21–23 |

Four newer approved lessons (lp_doc 3.0 rendered by lp_html v8.1, shared 2026-10-05) were **rebuilt
from their approved PDFs**. Their lp_doc JSON is not reachable from here: it is not in NIETE-Rumi, its
staging or the skills pack, and ICT's Grades 1–5 production pipeline makes image PDFs, not these.
So these four files are not pipeline JSON. For the Urdu ones, the PDF's Urdu text layer was decoded
to reading order for exact letters; word breaks, numbers and the order of list items were read from
the page images. Every letter of each file was checked against its approved PDF: none differs.

| File | Lesson | Approved PDF | Pages |
|---|---|---|---|
| `g4_ch8_Science_seg2.lesson.json` | Grade 4 General Science, Ch.8 "Space Safari" — The Solar System, p.188, day 2 of 11 (English) | `g4_ch8_Science_seg2.pdf` | 6 |
| `g1_ch1_GK_seg1.lesson.json` | Grade 1 General Knowledge, باب ۱ میرا تعارف — Self-Introduction, p.۱, day 1 of 6 (Urdu) | `GK_g1_seg1_v9_r2.pdf` | 7 |
| `g1_ch4_Islamiat_seg6.lesson.json` | Grade 1 Islamiat, باب ۴ اخلاق و آداب — سلام کرنا, p.۴۷, day 6 of 9 (Urdu) | `Islamiat_g1_seg6_v17.pdf` | 7 |
| `g5_ch2_SST_seg3.lesson.json` | Grade 5 Social Studies, باب ۲ ثقافت — تہوار، شمولیت، مذہبی ہم آہنگی…, p.۲۰, day 3 of 7 (Urdu) | `SST_g5_seg3_v17.pdf` | 8 |

The Islamiat lesson's honorifics were assembled cluster by cluster from the approved PDF's own code
points and are printed exactly as given.

The approved PDFs are NIETE's, shared with the Design lane on 2026-10-01 and 2026-10-05 (Google
Drive file links, not copied into this repo).

## Straight from ICT's pipeline: `slide-scripts/`

Two lessons as ICT's own Grades 1–5 pipeline wrote them: its Stage D0 slide scripts, the files
its image model draws from (round v8, published under R2 `ict-k5/renders/…`, listed in
`Orenda-Project/niete-curriculum-explorer`, downloaded 2026-10-06). They are real pipeline output.
They were not transcribed and are not test lessons. The only change: `meta.sourceFile`, an
operator's local file path, was taken out.

| File | Lesson |
|---|---|
| `slide-scripts/grade_2_math_ch1_seg1.slide_script.json` | Grade 2 Maths, Ch.1 "Numberland Adventures: Up to 999", day 1 of 12 — Recognise the place value of each digit (pp. 2–4) |
| `slide-scripts/grade_3_math_ch1_seg1.slide_script.json` | Grade 3 Maths, Ch.1 "Number Ninjas: Mastering the Thousands", day 1 of 10 — Count up to 9999 (pp. 2–3) |

```
npm run render:ict -- lp-render/fixtures/ict-primary/slide-scripts/grade_2_math_ch1_seg1.slide_script.json \
  --chapter "Ch.1 · Numberland Adventures: Up to 999"
#   -> out/ict/grade_2_math_ch1_seg1.en.{pdf,html,page-N.svg,lesson.json,…}
```

`lp-render/guide/from-slide-script.js` turns the script into an `ict-primary-lesson` (written out
as `.lesson.json` beside the PDF). The chapter title comes from the lesson's segmentation file
(Stage B); the slide script itself names only the pages.

Printed as written, including four places where ICT's own text is wrong or cut short:
- G2: the CFU "value of the digit 2 in 123" says "listen for: Says 40" (it is 20);
- G2: "Recalls: … counting by tens (Day 1" stops mid-phrase;
- G3: the "thousands place" meaning ends in "…";
- G3: the slip's fix stops mid-sentence ("…so the place, not the digit").

## ICT's HTML path: `lp-doc/`

`lp-doc/GK_g1_seg2.ur.lp.json` is ICT's own Grades 1–5 lp_doc 3.0 for
GRADE_1_GENERAL_KNOWLEDGE_CH1_SEG2. It is copied byte for byte from NIETE-Rumi `sandbox`,
`bot/tests/fixtures/lp-v9/GK_g1_seg2.ur.lp.json` (commit b65f97d6, 5 Oct; Amena's v16/v17 revision).
It is the only Grades 1–5 lp_doc reachable from here.

```
npm run render:ict -- lp-render/fixtures/ict-primary/lp-doc/GK_g1_seg2.ur.lp.json
#   -> drawn on the Grades 1–5 page by lp-render/guide/from-lpdoc-primary.js (converted .lesson.json beside it)
```

What the document still marks "یہ حصہ ابھی تیار نہیں ہوا" (not ready yet) is left off the page and
reported: `page2.differentiation.barrier`, `page2.model_answers` and `objectives.items`.

The chapter line prints as the document gives it (`Ch.1 · میرا تعارف`).

## What a file holds

The approved page's fields, in its order: `title`, `chapter`, `pages`, `period_minutes`, `day`,
`journey`, `coming_up`, `outcome`, `prepare`, `video`, `keywords`, `board`, then `stages`
(`opening`, `explanation`, `we_do`, `you_do`, `check`, `homework`, each with its `blocks`) and
`coaching`. A block or picture type the page cannot lay out is refused
(`lp-render/guide/from-primary.js`), so nothing is ever left off silently.

**Pictures** are named, never generated: `visual: {type, …}` on a board panel, a block or a
question, drawn in code by `lp-render/decorative/regions/ict/primary-art.js` from the lesson's own
words — `clock` / `clock_pair` (at the lesson's time), `tiles`, `blender`, `blender_list`,
`blend_steps` (the lesson's own steps, as a staircase), `predict`, `dictionary`, `poster` (a
textbook poster's lines, each with a small clock at its time), `scene` (`songbird`, `kite_tree`,
`lake`, `crying_boy`, `pair_reading`, `bunty_home` — at the lesson's `time` —, `bee_line`,
`park_family` — with its `sign` —, `zebra_crossing` — `signal: false` for none), `traffic_light`,
`road_signs` / `road_sign`, `look_steps`, `ordinal_row` (bees, or `object: 'child'`), `car_road`,
`podium`, `signboards`, `deeds` (a good-citizen chart), `story_map`, `tracker`. In a question a
clock, letter tiles or a road sign sits beside the question; any other picture goes under it. `hero_visual` is the small round picture on the title card. A board panel marked
`drawn: true` is printed as its picture (its `lines` are what the picture shows). `speakers` gives
each read-aloud speaker a kind of face (`girl_scarf`, `girl`, `boy`, `boy_cheeky`, `man_cap`,
`man_moustache`, `elder`, `woman`); a speaker not listed gets a plain face in its own colour.

In Urdu text, `⏸۱` is the textbook's reading-pause sign with its number; it prints as a pause chip.

**The newer lessons' pieces:**
- `labels` overrides the page's own labels where a lesson names them differently.
- `numerals: "urdu"` prints the page's own numbers (grade, minutes, steps, page N of M) in Urdu digits.
- `outcome.items` is a list of outcomes.
- `board_end: {label, visual}` is the board as it should look at the end of the lesson.
- A board panel's `visual_after: n` places its picture after its first n lines.
- `support.sections` is the teacher-support page (homework answered in full), on a page of its own.
- `coaching.look_for` is the coaching corner's "look for this" line.
- Blocks:
  - `concept` is the core-idea box.
  - `remember` is the "remember" line.
  - `figure: {label, visual}` puts a chart on its own card.
  - `teacher_models.seq` lists the card's lines in order. Each has a kind `k`: `instr`, `quote`,
    `think`, `frame`, `bullet` or `visual`.
  - `mistakes[].pupil_says` gives the two-part mistakes card.
- Pictures:
  - `compare` is a chart of columns.
  - `flow` is boxes joined by arrows, with `arrow`, a word on each arrow.
  - `solar_system`, `stairs`, `greeting` and `festivals` are drawn.

## Render

```
npm run render:ict -- lp-render/fixtures/ict-primary/g1_ch9_Maths_seg1.lesson.json
#   -> out/ict/g1_ch9_Maths_seg1.en.{pdf,html,png,page-N.svg,guide.json,report.json}
```

No model is called and no image is generated: $0, no API key.
