'use strict';
const { classifyBlock } = require('./classify');
const { route } = require('./route');
const { resolvePrompt } = require('./prompts/build');
const { generateImage } = require('./kie/generate');
const { checkImage } = require('./quality_gate');
const { checkCulture, cultureRulesFor } = require('./culture_gate');
const { cacheKey, MemoryAssetCache } = require('./cache');
const { BudgetGuard } = require('./budget');

// Resolve the images a segment needs: classify each block, and for blocks that
// need an image, walk the cost-ascending model ladder — generate, VLM-gate,
// cache — falling back to the deterministic path if the whole ladder fails.
async function resolveSegmentImages(segment = {}, opts = {}) {
  const {
    apiKey, region = segment.region || 'pk',
    generateImpl = generateImage, gateImpl = checkImage, cultureImpl = checkCulture,
    cache = new MemoryAssetCache(), budget = new BudgetGuard(),
  } = opts;

  const report = [];

  // Resolve one block's image (classify -> ladder -> generate -> gate -> cache).
  const resolveOne = async (block) => {
    const { category, needsImage, reason } = classifyBlock(block, segment);
    if (!needsImage) return { blockType: block.type, category, needsImage: false, model: null, asset: null, reason };

    // A block may force a specific model (e.g. an open-weight flux/qwen); otherwise
    // walk the category's cost-ascending ladder. Either way the gate still decides.
    const ladder = block.model ? [block.model] : route(category, segment.locale, segment.region).ladder;
    const prompt = resolvePrompt({ category, subject: segment.subject, block, region, grade: segment.grade, locale: segment.locale });
    const expectation = block.text || segment.topic || category;

    let resolved = null;
    let lastRejected = null; // gate-soft: presence beats absence (owner decision 2026-08-18)
    let culturallyRejected = null; // regional mismatch is NOT shipped, even soft
    for (const model of ladder) {
      const key = cacheKey(category, prompt, model);
      const cached = await cache.get(key);
      if (cached) { resolved = { model, asset: cached, credits: 0, reason: 'cache' }; break; }

      let gen = null;
      for (let attempt = 0; attempt < 3; attempt++) { // retry transient gen failures (some models are flaky)
        gen = await generateImpl({ apiKey, model, prompt });
        if (gen.ok) break;
      }
      if (!gen.ok) { report.push({ blockType: block.type, model, event: 'gen_fail', error: gen.error }); continue; }
      if (typeof gen.creditsConsumed === 'number') budget.spend(gen.creditsConsumed);

      const gate = await gateImpl({ apiKey, imageUrl: gen.url, expectation, policy: opts.gatePolicy });
      report.push({ blockType: block.type, model, credits: gen.creditsConsumed, gate: gate.pass, reason: gate.reason });
      if (!gate.pass) lastRejected = { model, asset: { url: gen.url, model }, credits: gen.creditsConsumed, reason: 'gate_soft: shipped unverified (' + gate.reason + ')' };
      // REGIONAL FIT: the prompt asks for the region's dress and setting; this checks
      // the pixels and re-rolls when the model ignored it. A culturally wrong picture
      // in a Yemeni classroom is worse than none, so we do not ship a failure.
      if (gate.pass && cultureRulesFor(region)) {
        const wantTextless = /no text|no letters|wordless/i.test(prompt) || process.env.LP_FIGURE_MODE === 'hybrid';
        let fit = await cultureImpl({ apiKey, imageUrl: gen.url, region, textless: wantTextless });
        let rolls = 0;
        while (fit.checked && !fit.pass && rolls < 2) {
          rolls++;
          report.push({ blockType: block.type, model, event: 'culture_reroll', reason: fit.reason });
          const re = await generateImpl({ apiKey, model, prompt });
          if (!re.ok) break;
          if (typeof re.creditsConsumed === 'number') budget.spend(re.creditsConsumed);
          gen = re;
          fit = await cultureImpl({ apiKey, imageUrl: gen.url, region, textless: wantTextless });
        }
        report.push({ blockType: block.type, model, event: 'culture', pass: fit.pass, checked: fit.checked, reason: fit.reason, rolls });
        if (fit.checked && !fit.pass) {
          // exhausted the re-rolls: leave the slot empty rather than ship a mismatch
          culturallyRejected = { reason: `culture_reject after ${rolls} re-roll(s): ${fit.reason}` };
          continue;
        }
      }
      if (gate.pass) {
        const asset = { url: gen.url, model };
        await cache.set(key, asset);
        resolved = { model, asset, credits: gen.creditsConsumed, reason: 'generated' };
        break;
      }
    }

    // Gate-soft policy: a rejected-but-generated image beats an empty slot. The
    // reason string carries the gate verdict so logs show what shipped unverified.
    // Gate-soft does NOT extend to a regional mismatch: a Western-looking teacher in a
    // Yemeni lesson is a wrong picture, not an unverified one.
    if (!resolved && culturallyRejected) {
      return { blockType: block.type, category, needsImage: true, model: null, asset: null, reason: culturallyRejected.reason };
    }
    if (!resolved && lastRejected) resolved = lastRejected;
    return resolved
      ? { blockType: block.type, category, needsImage: true, model: resolved.model, asset: resolved.asset, reason: resolved.reason, creditsConsumed: resolved.credits }
      : { blockType: block.type, category, needsImage: true, model: null, asset: null, reason: 'fallback: generation itself failed' };
  };

  // Blocks are independent, so resolve them concurrently (output order preserved).
  const images = await Promise.all((segment.blocks || []).map(resolveOne));
  return { images, report };
}

module.exports = { resolveSegmentImages, classifyBlock, generateImage, checkImage };
