# Kenya design pack — CBC lesson plan

**Status: first pass, NOT partner-approved.** The structure below is fixed by the CBC
lesson-plan form and is safe to build on. The *skin* (palette, header treatment,
typography) is a proposal awaiting a Kenyan reviewer, exactly as the Yemen pack was a
proposal until the pilot review settled it.

## What the source looks like

A CBC lesson plan arrives as prose with **bare heading lines** — no Markdown `#`, often
no bold, sometimes with the content on the same line as the heading:

```
Strand: Living Things and Their Environment
Sub-Strand: The Breathing System
Lesson Learning Outcomes
By the end of the lesson the learner should be able to:
a) identify the parts of the breathing system …
Key Inquiry Question(s)
How does air move into and out of our bodies?
Learning Resources
Charts, a model of the torso, straws, balloons …
Introduction (5 minutes)
…
Lesson Development
Step 1: …
Step 2: …
Conclusion (5 minutes)
Extended Activities
Assessment
Assessment Rubric
Reflection
```

The converter reads these as headings without needing `#` — see
`lp-render/guide/profiles.js` (`ke`) and the bare-line mode in
`lp-render/guide/from-markdown.js`.

## The role contract

`sec-<role>` classes, order-independent (a lesson missing a role shifts nothing else):

| role | card title | notes |
|---|---|---|
| `lesson-line` | Lesson | grade · subject · topic, assembled from the paste |
| `strand` | Strand | quiet admin band |
| `sub-strand` | Sub-Strand | quiet admin band |
| `outcomes` | Lesson Learning Outcomes | numbered list; what the lesson is judged against |
| `inquiry` | Key Inquiry Question(s) | note card, set larger |
| `resources` | Learning Resources | chips |
| `introduction` | Introduction | teaching phase — one card per labelled part |
| `development` | Lesson Development | teaching phase — the source's own Step 1, Step 2 … |
| `conclusion` | Conclusion | teaching phase |
| `assessment` | Assessment | list |
| `rubric` | Assessment Rubric | table; badge colours from ROW ORDER, never from the level's spelling |
| `extended` | Extended Activities | note |
| `reflection` | Reflection | ruled space, written after teaching |

**These are CBC's own roles.** They are not mapped onto Yemen's four 5E stages, and
Yemen's roles (`goal`, `errors`, `stage-*`, `multigrade`, `homework`) never appear in a
Kenyan render.

## Rubric colours

The severity ramp is **positional**: row 1 is the top band, the last row is the bottom
band, and the badge colour and symbol come from that position. The renderer consults the
level's words only to decide whether the source is written best-first or worst-first, and
a source can state it outright with `order: 'worst-first'`. This is what lets
"Exceeding Expectation", "Level 4", or a Kiswahili level name keep the ramp — the previous
implementation matched four English words and dropped everything else to one flat colour.

## Open for review

1. **Palette.** Currently a calm banded document (navy header, one colour per role). A
   Kenyan reviewer should say whether a CBC plan should read as an official form (current)
   or as a bright classroom poster (the repo default look).
2. **Header.** No ministry/county chrome — the subtitle band reads
   "Republic of Kenya · Competency-Based Curriculum". Needs a decision on what a real
   plan's letterhead should carry.
3. **Page numbering.** Uses the repo default (top-right). Yemen uses a footer band with
   Arabic-Indic numerals because its pack asked for it; Kenya has made no such request.
4. **Kiswahili.** The heading vocabulary is English only. Kiswahili CBC headings
   (Mada Kuu, Mada Ndogo, Matokeo ya Kujifunza, Nyenzo …) should be added to the `ke`
   profile's `roles` list before any Kiswahili lesson is run through it.
5. **Illustrations.** Art direction comes from `imagegen/prompts/regions/ke.js`, which
   already exists and grounds scenes in a Kenyan classroom.
