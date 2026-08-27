'use strict';
const { MODELS, ladderFor } = require('./config/models.config');

// Resolve which model(s) a category uses. `locale` selects the script-appropriate
// diagram models (e.g. Arabic → a model that renders Arabic labels first-try).
function route(category, locale) {
  const ladder = ladderFor(category, locale);
  return { needsImage: ladder.length > 0, ladder };
}

// Some models reject prompts over a hard length (z-image: 1000 chars), which
// surfaces as a dropped image rather than an error. Compact instead: drop the
// generic quality/setting clauses first, then shorten the longest remaining
// clause — never the first (style register) or the last (the no-text negative,
// which is what keeps generated artwork wordless).
function compactPrompt(prompt, max) {
  if (!max || prompt.length <= max) return prompt;
  let parts = String(prompt).split(/\.\s+/).filter(Boolean);
  const generic = /bright warm colours|high quality|suitable for a primary|clean simple background/i;
  for (let i = parts.length - 2; i > 0 && parts.join('. ').length > max; i--) {
    if (generic.test(parts[i])) parts.splice(i, 1);
  }
  while (parts.join('. ').length > max && parts.length > 2) {
    let longest = 1;
    for (let i = 1; i < parts.length - 1; i++) if (parts[i].length > parts[longest].length) longest = i;
    const over = parts.join('. ').length - max;
    if (parts[longest].length - over > 40) {
      // TRIM AT A WORD BOUNDARY. A raw slice cut mid-word and shipped the result to the
      // model: the Kenya art direction went out as "any adult is Kenyan — dark brown
      // skin and Afr." — worse than saying nothing, because the sentence no longer
      // states the requirement the culture gate then checks for. Measured on a Kiswahili
      // Grade 1 render, where that clause was the longest middle sentence and so always
      // the one chosen for trimming.
      const keep = parts[longest].length - over - 2;
      const cut = parts[longest].slice(0, keep);
      const sp = cut.lastIndexOf(' ');
      parts[longest] = (sp > keep * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:—–-]+$/, '');
    } else parts.splice(longest, 1);
  }
  let out = parts.join('. ');
  if (!/\.$/.test(out)) out += '.';
  return out.length > max ? out.slice(0, max) : out;
}

// Build a createTask `input` object for a model from its config defaults + prompt.
function modelInput(slug, prompt) {
  const cfg = MODELS[slug];
  if (!cfg) throw new Error(`unknown model slug: ${slug}`);
  return { prompt: compactPrompt(prompt, cfg.maxPrompt), ...cfg.input };
}

module.exports = { route, modelInput, compactPrompt };
