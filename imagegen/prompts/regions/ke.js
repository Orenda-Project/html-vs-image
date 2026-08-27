'use strict';
// Kenya art direction — see ye.js for why clothing and setting live in the pack.
module.exports = {
  // What a reviewer must be able to confirm in the GENERATED PIXELS. The prompt asks
  // for this; the culture gate verifies it and re-rolls when the model ignores it.
  check: {
    label: 'Kenya',
    require: [
      'people look Kenyan: dark brown skin, African features',
      'the children are in ordinary school clothes',
      'adults in smart everyday Kenyan clothing, or a bright printed dress',
    ],
    forbid: [
      'European, Arab or East Asian facial features on the adults',
      'landmarks, flags or signage from another country',
      'clothing or architecture from outside East Africa',
    ],
  },
  // Bump when the art direction changes: the asset-store key includes it, so cached
  // artwork drawn under the old direction is not silently reused.
  version: 3,
  id: 'ke',
  // The scaffold prefixes this with "children dressed as ", so it must read as a
  // clothing phrase — the first shortening produced "children dressed as children
  // with dark brown skin…".
  dress: 'green or maroon Kenyan school uniforms, worn by children with dark brown skin',
  // ASK FOR WHAT THE GATE CHECKS. The forbid list above rejects European, Arab or East
  // Asian facial features on the adults — but this line only ever described the adult's
  // CLOTHING, so the appearance the gate enforces was never actually requested. Measured
  // on a Kiswahili Grade 1 render: the first roll came back with a teacher drawn with
  // clearly East Asian features, the gate rejected it (correctly), and the re-rolls then
  // failed on transient generation errors, so the lesson shipped with no artwork at all.
  // A check that forbids what the prompt never asks for spends credits to discover it.
  teacher: 'any adult is Kenyan — dark brown skin and African features — and wears smart '
    + 'everyday Kenyan clothing: a plain shirt or blouse, or a dress in a bright printed fabric',
  setting: 'a simple Kenyan classroom or schoolyard',
  names: 'Kenyan names (Amani, Baraka, Zawadi, Neema)',
  palette: 'warm, bright, friendly colours',
  avoid: 'no non-African landmarks, no clothing or architecture from outside East Africa',
  note: 'culturally grounded in Kenya and respectful; classroom-appropriate for young children',
};
