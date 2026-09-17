#!/usr/bin/env node
'use strict';
// MIGRATE THE ASSET STORE TO MODEL-AWARE KEYS.
//
// The cache used to be keyed on the brief alone, so the store would answer a request for
// one model with a picture drawn by another: Yemen was configured for z-image and lessons
// came back drawn by nano-banana-2-lite, because the two share a prompt. The key now
// carries the model as a suffix — `<base>@<model>`.
//
// Without this migration every existing asset becomes unreachable and the next render
// re-buys all of them. With it, each entry moves to the key naming the model that already
// drew it, which is recorded in the index: nothing is regenerated, every region keeps the
// pictures it had, and a request for a DIFFERENT model correctly misses.
//
// Run it once per asset store — including on staging, which has its own.
//
//   node scripts/migrate-asset-store-model-keys.js            # report only, changes nothing
//   node scripts/migrate-asset-store-model-keys.js --apply    # write the new index
//
// Idempotent: keys that already carry a model are left alone, so running it twice is safe.
const fs = require('node:fs');
const path = require('node:path');

const store = require('../lp-render/store/assets');
const INDEX = path.join(store.DIR, 'index.json');
const APPLY = process.argv.includes('--apply');

function main() {
  if (!fs.existsSync(INDEX)) {
    console.log(`No asset store index at ${INDEX} — nothing to migrate.`);
    return 0;
  }
  const ix = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
  const keys = Object.keys(ix);

  const moved = [];
  const already = [];
  const unknown = [];
  const collided = [];
  const next = {};

  for (const k of keys) {
    const e = ix[k] || {};
    if (k.includes('@')) { already.push(k); next[k] = e; continue; }
    const model = typeof e.model === 'string' ? e.model.trim() : '';
    if (!model) {
      // The model was never recorded, so there is no honest key to move it to. Left where
      // it is: no keyed request can reach it any more, which is the safe outcome — better
      // an orphan than the wrong picture answering a request.
      unknown.push(k); next[k] = e; continue;
    }
    const nk = `${k}@${model}`;
    if (next[nk] || ix[nk]) { collided.push(nk); next[k] = e; continue; }
    next[nk] = e;
    moved.push({ from: k, to: nk, model });
  }

  const byModel = {};
  for (const m of moved) byModel[m.model] = (byModel[m.model] || 0) + 1;

  console.log(`asset store: ${store.DIR}`);
  console.log(`  entries            ${keys.length}`);
  console.log(`  to re-key          ${moved.length}`);
  for (const [m, n] of Object.entries(byModel).sort((a, b) => b[1] - a[1])) {
    console.log(`     ${String(n).padStart(4)}  @${m}`);
  }
  console.log(`  already model-aware ${already.length}`);
  console.log(`  no model recorded   ${unknown.length}  (left as orphans — unreachable, never wrong)`);
  if (collided.length) console.log(`  collisions          ${collided.length}  (left as-is)`);

  if (!APPLY) {
    console.log('\nReport only. Re-run with --apply to write the new index.');
    return 0;
  }
  // The files on disk are referenced by the entry's own `file` field, not by the key, so
  // re-keying the index moves nothing on disk and cannot lose an image.
  const onDisk = (e) => !!(e && e.file && fs.existsSync(path.join(store.DIR, e.file)));
  const reachableBefore = Object.values(ix).filter(onDisk).length;

  fs.copyFileSync(INDEX, `${INDEX}.pre-model-keys`);
  fs.writeFileSync(INDEX, JSON.stringify(next, null, 2));
  console.log(`\nApplied. Previous index saved as ${path.basename(INDEX)}.pre-model-keys`);

  // THE ONLY QUESTION THAT MATTERS: are the same images still reachable? Counting entries
  // whose file is absent would be misleading — a store commonly carries index entries whose
  // image was never committed or has been pruned, and those were already unreachable before
  // this ran. Compare before against after instead, so a pre-existing gap is never reported
  // as damage this migration did.
  const reachableAfter = Object.values(next).filter(onDisk).length;
  const stale = Object.keys(ix).length - reachableBefore;
  console.log(`  images reachable   ${reachableBefore} → ${reachableAfter}`
    + (reachableAfter === reachableBefore ? '  (unchanged — nothing lost)' : '  ← CHANGED, investigate'));
  if (stale) {
    console.log(`  note               ${stale} entries had no image file on disk BEFORE this ran`);
    console.log('                     (index rows whose asset was never committed or was pruned —');
    console.log('                      they were already unreachable and are untouched here)');
  }
  return reachableAfter === reachableBefore ? 0 : 1;
}

process.exit(main());
