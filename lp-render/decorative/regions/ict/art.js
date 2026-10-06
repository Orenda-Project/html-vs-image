'use strict';
// Code-drawn art for the ICT page design: the approved pages' small icons (a speaking head for
// what the teacher says, an ear for "Listen for", a bulb for the key fact …) and two flat figures
// (a teacher, a pair of pupils). Drawn here as SVG so a lesson costs nothing and needs no model:
// the approved references were generated as whole-page images, and the only way to match their
// look at $0 is to draw the pieces in code. Colours are the design's own (see theme.js tokens).
const INK = '#34374A';
const GREEN = '#4AAB7A';

const svg = (vb, body, cls = '') => `<svg class="ic${cls ? ` ${cls}` : ''}" viewBox="${vb}" aria-hidden="true" focusable="false">${body}</svg>`;

const ICONS = {
  // a head in profile with sound lines: "say this"
  speak: (c = GREEN) => svg('0 0 24 24', `<path fill="${c}" d="M9.5 3C5.9 3 3 5.8 3 9.3c0 1.8.6 3.2 1.7 4.4L4 20.5h6.3v-2.3h1.5c1.2 0 2.2-1 2.2-2.2v-2l1.6-.5-1.5-3.4C13.8 5.8 12 3 9.5 3z"/>`
    + `<path fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" d="M17.5 7.5l2.5-1.5M18 11h3M17.5 14.5l2.5 1.5"/>`),
  // an ear: "Listen for"
  ear: (c = INK) => svg('0 0 24 24', `<path fill="none" stroke="${c}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" d="M6.5 9.5a5.5 5.5 0 0 1 11 0c0 3-2.6 3.9-3.3 5.9-.6 1.8-1.5 4.1-4 4.1-1.8 0-3-1.2-3.1-2.9"/><path fill="none" stroke="${c}" stroke-width="1.6" stroke-linecap="round" d="M9.3 9.6a2.7 2.7 0 0 1 5.4 0c0 1.4-1.5 1.8-1.5 3"/>`),
  bulb: (c = INK) => svg('0 0 24 24', `<path fill="${c}" d="M12 5a5 5 0 0 0-3 9c.6.5 1 1.2 1 2v1h4v-1c0-.8.4-1.5 1-2a5 5 0 0 0-3-9z"/><rect x="10" y="18" width="4" height="1.6" rx=".6" fill="${c}"/><rect x="10.5" y="20.2" width="3" height="1.4" rx=".6" fill="${c}"/>`
    + `<path stroke="${c}" stroke-width="1.5" stroke-linecap="round" d="M12 1.5v1.8M4.2 4.2l1.3 1.3M19.8 4.2l-1.3 1.3M1.8 11h1.8M20.4 11h1.8"/>`),
  warn: (c = INK) => svg('0 0 24 24', `<path fill="${c}" d="M12 2.5 1.5 21h21L12 2.5z"/><rect x="11" y="9" width="2" height="6.5" rx="1" fill="#fff"/><circle cx="12" cy="18" r="1.25" fill="#fff"/>`),
  check: (c = '#fff') => svg('0 0 24 24', `<path fill="none" stroke="${c}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round" d="M4 12.5l5 5L20 6.5"/>`),
  hand: (c = '#fff') => svg('0 0 24 24', `<path fill="none" stroke="${c}" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round" d="M8 12V5.5a1.4 1.4 0 0 1 2.8 0V11M10.8 11V4a1.4 1.4 0 0 1 2.8 0v7M13.6 11V5a1.4 1.4 0 0 1 2.8 0v7.5M16.4 12.5V8.3a1.4 1.4 0 0 1 2.8 0V15c0 4-2.8 6.5-6.4 6.5-2.6 0-4.3-1.2-5.6-3.3L4.6 14a1.4 1.4 0 0 1 2.3-1.6L8 14"/>`),
  up: (c = '#fff') => svg('0 0 24 24', `<path fill="none" stroke="${c}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M12 21V4M5 10.5 12 3.5l7 7"/>`),
  house: (c = INK) => svg('0 0 24 24', `<path fill="${c}" d="M12 3 1.5 12h3v9h5.5v-6h4v6h5.5v-9h3L12 3z"/>`),
  arrow: (c = '#fff') => svg('0 0 24 24', `<path fill="none" stroke="${c}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" d="M3 12h17M14 6l6 6-6 6"/>`),
  mic: (c = INK) => svg('0 0 24 24', `<rect x="8.5" y="2" width="7" height="12.5" rx="3.5" fill="${c}"/><path fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21.5h7"/>`),
  chat: (c = INK) => svg('0 0 24 24', `<path fill="none" stroke="${c}" stroke-width="1.8" d="M12 2.8a9.2 9.2 0 0 0-8 13.7L2.8 21.2l4.8-1.2A9.2 9.2 0 1 0 12 2.8z"/><path fill="${c}" d="M8.6 7.4c.3-.3.8-.3 1 .1l1 1.9c.2.3.1.7-.2 1l-.6.6c.6 1.3 1.6 2.3 2.9 2.9l.6-.6c.3-.3.7-.4 1-.2l1.9 1c.4.2.4.7.1 1l-.9 1c-.6.6-1.6.7-2.4.3-2.2-1.1-3.9-2.8-5-5-.4-.8-.3-1.8.3-2.4l.8-.8z"/>`),
  reply: (c = INK) => svg('0 0 24 24', `<path fill="${c}" d="M10 5 3 11.5l7 6.5v-4c5 0 8.5 1.5 11 5-1-5.5-4.5-10-11-11V5z"/>`),
  book: (c = INK) => svg('0 0 24 24', `<path fill="none" stroke="${c}" stroke-width="1.7" stroke-linejoin="round" d="M12 6.5C10 5 7 4.5 3 5v13c4-.5 7 0 9 1.5 2-1.5 5-2 9-1.5V5c-4-.5-7 0-9 1.5zM12 6.5v13"/>`),
  video: (c = INK) => svg('0 0 24 24', `<rect x="2.5" y="5" width="14" height="14" rx="2.5" fill="none" stroke="${c}" stroke-width="1.8"/><path fill="${c}" d="M16.5 10.5 21.5 7v10l-5-3.5z"/>`),
};

// The NIETE mark in the header's end corner. A plain monogram drawn in code; ICT's own logo file
// replaces it when ICT supplies one.
const MARK = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><path fill="#fff" d="M6 34V6h6.5l14 18.5V6H34v28h-6.5L13.5 15.5V34z"/><path fill="${INK}" d="M7.5 29.5l4-4 4 4-4 4z"/><path fill="none" stroke="#fff" stroke-width="2" d="M7.5 29.5l4-4 4 4-4 4z"/></svg>`;

// Flat figures in the approved pages' style: soft grey clothes with a slate outline.
const SKIN = '#C98C5E'; const HAIR = '#2B2521'; const CLOTH = '#E8EAEE'; const LINE = '#4A4D5E';
const TEACHER = `<svg class="fig teacher" viewBox="0 0 140 250" aria-hidden="true">
<ellipse cx="62" cy="242" rx="46" ry="6" fill="#E3E4EA"/>
<path d="M38 150h48l4 86H72l-10-62-10 62H34z" fill="${CLOTH}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M26 82c4-12 16-18 36-18s32 6 36 18l6 78H20z" fill="${CLOTH}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
<path d="M62 66v34" stroke="${LINE}" stroke-width="1.6"/><circle cx="62" cy="80" r="1.6" fill="${LINE}"/><circle cx="62" cy="90" r="1.6" fill="${LINE}"/>
<path d="M92 88l24-30" stroke="${CLOTH}" stroke-width="14" stroke-linecap="round"/><path d="M92 88l24-30" stroke="${LINE}" stroke-width="2" stroke-linecap="round" fill="none" opacity=".0"/>
<path d="M86 84c6-4 12-2 16 2l16-24" fill="none" stroke="${LINE}" stroke-width="2" stroke-linecap="round"/>
<circle cx="120" cy="54" r="7" fill="${SKIN}" stroke="${LINE}" stroke-width="1.5"/><path d="M121 48l5-9" stroke="${SKIN}" stroke-width="4" stroke-linecap="round"/>
<path d="M30 92c-4 20-4 40-2 58" stroke="${LINE}" stroke-width="2" fill="none"/>
<circle cx="32" cy="156" r="6" fill="${SKIN}" stroke="${LINE}" stroke-width="1.5"/>
<rect x="55" y="52" width="14" height="14" rx="4" fill="${SKIN}"/>
<ellipse cx="62" cy="34" rx="18" ry="21" fill="${SKIN}" stroke="${LINE}" stroke-width="1.5"/>
<path d="M44 30c0-14 8-20 18-20s18 6 18 20c-3-6-9-8-18-8s-15 2-18 8z" fill="${HAIR}"/>
<path d="M46 40c2 12 8 17 16 17s14-5 16-17c-3 4-6 5-8 4-2 4-5 5-8 5s-6-1-8-5c-2 1-5 0-8-4z" fill="${HAIR}"/>
<circle cx="55" cy="33" r="1.8" fill="${HAIR}"/><circle cx="69" cy="33" r="1.8" fill="${HAIR}"/>
<path d="M58 45c2 1.5 6 1.5 8 0" stroke="#fff" stroke-width="1.4" fill="none" stroke-linecap="round"/>
<path d="M44 236h14M66 236h14" stroke="${HAIR}" stroke-width="7" stroke-linecap="round"/>
</svg>`;
const PUPIL = (x, girl) => `<g transform="translate(${x} 0)">
<path d="M8 118c2-22 14-32 32-32s30 10 32 32z" fill="${CLOTH}" stroke="${LINE}" stroke-width="2" stroke-linejoin="round"/>
<rect x="34" y="72" width="12" height="14" rx="4" fill="${SKIN}"/>
<ellipse cx="40" cy="54" rx="17" ry="19" fill="${SKIN}" stroke="${LINE}" stroke-width="1.5"/>
${girl ? `<path d="M22 56c-2-20 7-30 18-30s20 10 18 30c-2-10-8-15-18-15s-16 5-18 15z" fill="${HAIR}"/><path d="M56 50c6 10 6 26 2 40" stroke="${HAIR}" stroke-width="6" fill="none" stroke-linecap="round"/>`
    : `<path d="M23 52c0-16 8-24 17-24s17 8 17 24c-3-7-9-10-17-10s-14 3-17 10z" fill="${HAIR}"/>`}
<circle cx="34" cy="54" r="1.8" fill="${HAIR}"/><circle cx="46" cy="54" r="1.8" fill="${HAIR}"/>
<path d="M35 63c3 2 7 2 10 0" stroke="${LINE}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
</g>`;
const PUPILS = `<svg class="fig pupils" viewBox="0 0 200 130" aria-hidden="true">${PUPIL(12, false)}${PUPIL(108, true)}
<path d="M0 112h200v6H0z" fill="#B98A5E"/><path d="M6 118h188l-6 10H12z" fill="#A67A51"/></svg>`;

const icon = (name, color) => (ICONS[name] ? ICONS[name](color) : '');

module.exports = { icon, ICONS, MARK, TEACHER, PUPILS, INK, GREEN };
