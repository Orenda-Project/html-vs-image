'use strict';
// Shared prompt scaffolding — style registers and quality/negative directives.
const SCENE_STYLE = 'a warm, friendly flat-vector children\'s-book illustration, expressive happy faces, clean simple background';
const DIAGRAM_STYLE = 'a clean, minimal, flat-vector educational infographic on a plain white background, bold clear labels, textbook style, no clutter, no realistic photo, no shading';
const QUALITY = 'bright warm colours, high quality, suitable for a primary-school classroom';
const NEGATIVE_SCENE = 'no text in the image, no watermark, not scary, not violent';
const NEGATIVE_DIAGRAM = 'no watermark, no clutter, labels must be spelled correctly and legible';
function join(parts) { return parts.filter(Boolean).map((s) => String(s).trim()).join('. ') + '.'; }
module.exports = { SCENE_STYLE, DIAGRAM_STYLE, QUALITY, NEGATIVE_SCENE, NEGATIVE_DIAGRAM, join };
