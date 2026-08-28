# Yemen design set — «دليل الدرس اليومي»

**Source of truth:** the approved pilot `YE_BLN_Math_G3_U1_L2_4digit_1000_2000_v11.pdf`
(card PROJ-044; SHLS/BLN shape). NOTE: the pilot PDF is the ANNOTATED DESIGN SPEC —
its small English labels ("TEAL OBJECTIVE", "HERO ILLUSTRATION") are designer
annotations, not content.

## Measured spec (pixel-sampled — never match by eye; sample, fix, re-sample)
- Page ground **WHITE `#fcfcfc`** (cream only inside tinted panels)
- Header **`#182448`** navy-indigo, **~78px tall**, gold rule below;
  title «دليل الدرس اليومي» top-RIGHT (RTL start), ministry lines top-LEFT
- Lesson-info line sits BELOW the header (navy, right-aligned) — not in the band
- Stage tints: rose **`#fcd8d8`** (التمهيد, figure on the RIGHT) · blue `#e7eef8`
  (العرض) · green `#e9f2e5` (التطبيق) · amber **`#fcf0d8`** (التقويم)
- «✔ تحقق» strip amber `#fcf0d8`; «هدف اليوم:» inline TEAL in a white teal-border card;
  errors strip = ONE coral-border card titled «أخطاء شائعة — انتبه لها» (red)
- Footer: plain thin navy rule + centred line (NOT a dark band)

## Typography (reviewer-selected via 5-font specimen, 2026-08-12)
**Noto Naskh Arabic** — 400 body (13.5–14px, line-height ≥1.55), 700 headings.
(Reviewer-selected 2026-08-13, replacing IBM Plex Sans Arabic: the design set's lettering
reads Naskh-style.) Pilot chrome replicated in the theme: dartboard-with-arrow icon on
the goal card, ملاحظات teacher-notes strip (dotted rules + navy tab) after التقويم, and
role-coloured card borders (answers teal, glossary navy, multigrade pink, homework amber).
Embedded from `@fontsource/ibm-plex-sans-arabic` at require-time; falls back to
Noto Naskh when absent.

## THE CONTENT CONTRACT — section ids (order-independent)
Role styling is applied by **section `id`** (rendered as a `sec-<id>` class).
Any content JSON that wants the full Yemen treatment must use these ids:

| id | role | notes |
|---|---|---|
| `lesson-line` | subject·grade·lesson line below header | type `text` |
| `goal` | هدف اليوم card | type `note`, body starts `**هدف اليوم:** …` |
| `errors` | أخطاء شائعة card | type `qa`, 2 items (خطأ / صواب) |
| `errors-caption` | caption under the twins | type `text` |
| `stage-tamhid` | التمهيد (rose, figure RIGHT) | type `steps`, `time` pill carries `٨ دقائق · أنا أفعل`, LAST item label `تحقق` |
| `stage-arad` | العرض (blue) | same steps shape |
| `stage-tatbiq` | التطبيق (green) | same steps shape |
| `stage-taqwim` | التقويم والختام (amber) | same steps shape |
| `solutions` | حلول التدريبات | type `bullets` |
| `glossary` | مصطلحات | type `fields` |
| `multigrade` | تكييف متعدد الصفوف | type `bullets` |
| `homework` | الواجب المنزلي · ركن المعلم | type `note` |

Stage figures: declare images (`concept: diagram` prompts pass the gate; scene-form
fails often) and set `image: <id>` on the stage section. Sections WITHOUT these ids
still get the base Yemen skin (white page, navy header, Plex, tints absent).
Canonical example: `assets/content/daleel-usrati-2p.ar.json`.

## Review protocol
Three-up compare (pilot / ours). A named differing element is a defect — fix same-day.

## The component contract (2026-08-27)

Read off the approved Yemen pages in the reviewer's reference artifact (lesson 01 أسرتي,
both rendered pages). These are the pack's reusable components. A lesson's semantics map
into them; the renderer does not invent a div structure per lesson.

| Component | Markup | What the approved design does |
|---|---|---|
| `YemenHeader` | `.lp-header` > `h1` + `.sub` | one dark rounded card, **centred**, title over a single subtitle line — not a full-bleed band |
| `ObjectiveBand` | `.yl-block.sec-goal` > `.yl-badge` + `.d-note` | solid dark-green band, dart badge at the RTL start, white text |
| `MaterialsRow` | `.yl-block.sec-materials` > `.d-chips` | one compact row of code-drawn chips |
| `MisconceptionPanel` | `.yl-miscsec` > `.yl-mrow` (`.yl-wrong` \| `.yl-correct`) + `.yl-mfix` | ✕ خطأ at the start states the confusion, ✓ صواب beside it shows the words with the letter that separates them as chips, and the teacher's correction is **one quiet strip beneath both** — never a third column |
| `StageCard` | `.yl-stage` (outer, tinted) > `.yl-shead` + `.yl-scard` (white) + `.yl-srows` + `.yl-check` | the stage's colour is a **block**, not a line: the outer card carries the tint, the header row, the asides and the checkpoint; the white inner card carries the content |
| `StageHeader` | `.yl-shead` > `.yl-tab` + `.yl-pill.yl-dur` + `.yl-pill.yl-mode` | solid tab at the RTL start with the **stage name only**, duration pill beside it, mode pill pushed to the far end |
| `DurationPill` | `.yl-dur` + `CLOCK_SVG` | solid stage colour, white text, clock glyph |
| `TeachingModePill` | `.yl-mode` + `.yl-dot` | white pill, thin border, dot in the stage colour |
| `ActivityLabel` | `.yl-alabel` | the numbered exercise label, **inside** the card above its own activity |
| `TeachingTextColumn` | `.yl-ttext` | teacher prose, one column |
| `TeachingVisualColumn` | `.yl-tvis` | the visual in a white card of its own with a grey caption strip |
| `CheckpointStrip` | `.yl-check` | full width, last band of the stage, on the stage tint |
| `SupportChallengeRow` | `.yl-srows` > 2 × `.yl-srow` | **one row, two cells**, label chip at the start of each. Never floating side boxes |
| `MatchingActivity` | `.yl-match` | word → picture, one row per pair, connector line between |
| `WordMatchingActivity` | `.yl-match.yl-wordmatch` | identical-word pairs |
| `AssessmentActivity` | `.yl-assess` | dashed answer boxes with the underlined word |
| `TeacherNotes` | `.sec-notes` chrome | ruled writing space after the assessment stage |
| `ExitAnswerRow` | `.sec-exit-ticket` (1/7) + `.sec-solutions` (7/13) | one balanced row, exit ticket at the RTL start |
| `TeacherCorner` | `.yl-block.yl-tabbed` > `.yl-bbody` + `.yl-btab` | full width, labelled amber tab down the card's **end** |
| `Footer` | `.lp-footer` | gold rule, centred contact line, page number from the composer |

### Layout rules that are not negotiable

1. **One stage, one card.** Profile flag `oneCardPerStage`. Each labelled part of a stage
   becomes an *activity* inside that card, never a card of its own.
2. **Wide activities stack, compact visuals sit beside the text.** A matching or assessment
   activity spans the card under the text; an illustration or small drawn figure takes the
   column next to it. Two activities of the same kind sit **side by side** (`.yl-actgrid`).
3. **An empty heading collapses.** A stage the source leaves empty keeps its tab and pills
   and renders nothing else. No invented content, and no large blank card.
4. **Badges and tabs are real markup**, never pseudo-elements: a `::before` with a padding
   gutter drifts back onto the text the moment any block-padding rule of equal specificity
   is added after it, and it cannot be measured by the geometry test.
5. **Never put markup inside an Arabic word.** Shaping does not cross element boundaries,
   so marking one letter with `<b>` breaks the joins — and the verbatim check cannot see it
   because every character is still present. Show the letters as their own chips.
6. **A stage card is never half a row** (`grid-column:1/13`). With `grid-auto-flow:row
   dense`, a half-width stage lets an unrelated block backfill the empty half.
7. `lp-render/test/card-geometry.test.js` enforces: nothing outside its card, no two cards
   sharing a pixel, no box clipping its own text, no badge or tab intersecting text — at
   720 / 794 / 900px.
