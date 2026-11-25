// The phrasebook menu (legacy scripts/phrasebook.js: CHAPTERS, listOf, linesHTML, build, make, onKey, open, close, the
// translate button, VER, window.__phrasebook). Lines, triggers and glosses come from core/lines.js allLines(); no line text
// here. Emits phrasebook.opened / phrasebook.closed. STUB.
const todo = (name) => () => { throw new Error(`phrasebook.${name}: not implemented`); };
export const open = todo('open');
export const close = todo('close');
export const isOpen = () => false;
export function install(app) {}
