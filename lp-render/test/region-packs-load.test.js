'use strict';
// EVERY REGION PACK MUST PARSE, AND ITS CSS MUST SURVIVE INTACT.
//
// A pack's CSS is a backtick template literal. A single backtick inside a CSS comment ends
// that literal early, the module throws a SyntaxError at require time, the pipeline falls
// back to the default theme — and the only symptom is the page count: a two-page lesson
// renders as sixteen. There is no error in the output and nothing else fails. This has
// happened four times; it costs a full render round every time.
//
// This test is the guard: it requires every pack the way the pipeline does and checks the
// CSS is really there. It fails loudly at the point of the mistake instead of silently
// three steps later.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const REGIONS = path.join(__dirname, '..', 'decorative', 'regions');

test('every region pack loads and exports usable CSS', () => {
  const dirs = fs.readdirSync(REGIONS, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(REGIONS, d.name, 'theme.js')))
    .map((d) => d.name);
  assert.ok(dirs.length >= 3, `expected the ye/ke/tz packs, found ${dirs.join(', ')}`);
  for (const region of dirs) {
    const file = path.join(REGIONS, region, 'theme.js');
    let pack;
    assert.doesNotThrow(() => { pack = require(file); },
      `${region}/theme.js does not parse — check for a backtick inside a CSS comment`);
    assert.strictEqual(typeof pack.THEME_OVERRIDE_CSS, 'string',
      `${region} must export THEME_OVERRIDE_CSS`);
    // A stray backtick inside the literal would have ended it early; the source must have
    // an even number of them so the literal opens and closes cleanly.
    const src = fs.readFileSync(file, 'utf8');
    // tz is a deliberate placeholder — a named pack that ships the default look until its
    // design is approved — so empty CSS is valid. A pack with a real stylesheet in it must
    // not come back nearly empty: that is the signature of a literal that ended early.
    if (src.length > 4000) {
      assert.ok(pack.THEME_OVERRIDE_CSS.length > 500,
        `${region} has ${src.length} bytes of source but only `
        + `${pack.THEME_OVERRIDE_CSS.length} bytes of CSS — the template literal ended early`);
    }
    assert.strictEqual((src.match(/`/g) || []).length % 2, 0,
      `${region}/theme.js has an odd number of backticks — one is inside the CSS`);
    assert.ok(pack.REGION_NAME, `${region} must name itself for the Studio picker`);
  }
});
