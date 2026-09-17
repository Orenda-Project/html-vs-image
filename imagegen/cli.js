'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { classifyBlock } = require('./classify');
const { route } = require('./route');
const { resolvePrompt } = require('./prompts/build');
const { resolveSegmentImages } = require('./index');

// Dry run: classify + route + resolve the prompt for each block, no network.
function dryRun(segment) {
  return (segment.blocks || []).map((block) => {
    const { category, needsImage, reason } = classifyBlock(block, segment);
    // Pass the segment's own locale AND region: a dry run that reports the DEFAULT model
    // while the real run uses the region's own is worse than no dry run — it is a wrong
    // answer to "what will this cost".
    const { ladder } = route(category, segment.locale, segment.region);
    return {
      blockType: block.type, category, needsImage,
      model: ladder[0] || null,
      prompt: needsImage ? resolvePrompt({ category, subject: segment.subject, block, region: segment.region, grade: segment.grade }) : null,
      reason,
    };
  });
}

async function main() {
  const file = process.argv[2];
  const live = process.argv.includes('--live');
  if (!file) { console.error('Usage: node imagegen/cli.js <fixture.json> [--live]'); process.exit(2); }
  const segment = JSON.parse(fs.readFileSync(file, 'utf8'));

  console.log(`\n=== ${file} — subject=${segment.subject} grade=${segment.grade} region=${segment.region} ===`);
  for (const row of dryRun(segment)) {
    console.log(`\n[${row.blockType}] → ${row.category}${row.needsImage ? ` · model=${row.model}` : ' · (no AI image)'}`);
    if (row.prompt) console.log(`  prompt: ${row.prompt}`);
  }

  if (!live) { console.log('\n(dry run — pass --live to actually generate)'); return; }
  const apiKey = process.env.KIE_API_KEY;
  if (!apiKey) { console.error('\nKIE_API_KEY is not set — cannot run --live'); process.exit(1); }
  const outDir = path.join(__dirname, 'out'); fs.mkdirSync(outDir, { recursive: true });
  const { images, report } = await resolveSegmentImages(segment, { apiKey, region: segment.region });
  console.log('\n--- live result ---');
  for (const img of images) {
    console.log(`[${img.blockType}] ${img.asset ? `OK ${img.model} → ${img.asset.url}` : `no image (${img.reason})`}`);
  }
  console.log('report:', JSON.stringify(report, null, 2));
}

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
module.exports = { dryRun, main };
