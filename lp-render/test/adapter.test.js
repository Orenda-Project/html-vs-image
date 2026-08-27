'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { renderLessonPdf } = require('../adapter');
const { artCacheKey } = require('../pipeline');
const store = require('../store/assets');

// A 1x1 transparent PNG: these tests are about the render path, not the artwork.
const PIXEL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';

// A minimal content object with no images → renders without a kie.ai key or the store,
// so this is fully deterministic in CI.
const MINIMAL = {
  meta: { id: 'adapter-smoke', title: 'Somo la Mfano', locale: 'en' },
  sections: [{ type: 'text', title: 'Utangulizi', body: 'Habari za asubuhi.' }],
  images: [],
};

test('renderLessonPdf turns a content object into a real PDF buffer', async () => {
  const { pdf, png, locale } = await renderLessonPdf(MINIMAL, {});
  assert.ok(Buffer.isBuffer(pdf), 'pdf is a Buffer');
  assert.ok(pdf.length > 1000, 'pdf is non-trivial');
  assert.strictEqual(pdf.slice(0, 4).toString('latin1'), '%PDF', 'starts with the PDF magic bytes');
  assert.ok(Buffer.isBuffer(png), 'png preview is a Buffer too');
  assert.strictEqual(locale, 'en');
});

test('renderLessonPdf honours a forced locale (rumi knows the language)', async () => {
  const { locale } = await renderLessonPdf(MINIMAL, { locale: 'sw' });
  assert.strictEqual(locale, 'sw', 'forced locale wins over the content meta');
});

test('renderLessonPdf accepts a JSON string, not just an object', async () => {
  const { pdf } = await renderLessonPdf(JSON.stringify(MINIMAL), {});
  assert.strictEqual(pdf.slice(0, 4).toString('latin1'), '%PDF');
});

test('renderLessonPdf renders an already-structured fixture with store images (no API)', async () => {
  const p = path.join(__dirname, '../../tests/visual/fixtures/kiswahili.sw.json');
  const content = JSON.parse(fs.readFileSync(p, 'utf8'));
  // Seed the store ourselves rather than relying on whatever this machine happens to
  // have cached. The fixture's own briefs were cached under a pre-art-direction key,
  // so bumping a region pack's version orphaned them and this test started demanding
  // credits — a test of the restore path should never depend on cache archaeology.
  // Sentinel briefs keep the placeholder out of the way of any real lesson.
  content.images = (content.images || []).map((im, i) => ({ ...im, prompt: `test-fixture placeholder ${i} — never generated` }));
  for (const im of content.images) {
    store.put(artCacheKey(im.prompt, { region: content.meta.region, locale: 'sw' }), PIXEL, { test: true });
  }
  const { pdf, locale } = await renderLessonPdf(content, {});
  assert.strictEqual(pdf.slice(0, 4).toString('latin1'), '%PDF');
  assert.strictEqual(locale, 'sw');
});

test('renderLessonPdf refuses raw prose without an apiKey (clear error)', async () => {
  await assert.rejects(
    () => renderLessonPdf('Teach photosynthesis to grade 5.', { apiKey: '' }),
    /needs a kie\.ai apiKey/,
  );
});
