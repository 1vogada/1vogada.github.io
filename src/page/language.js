// English-only mode (Ivo, 2026-11-24: on by default): no Bulgarian or Japanese in bubbles, greeting, slip or phrasebook.
// Uses core/lines.js setLanguages(['en']); localStorage 'kiripad-lang'; a footer toggle; emits 'language.changed'. STUB:
// until the package that builds it lands, every language stays on (lines default: null = all), which is legacy behaviour.
const todo = (name) => () => { throw new Error(`language.${name}: not implemented`); };
/** @returns {string[] | null} null = all languages */ export const get = () => null;
export const set = todo('set');
export function install(app) {}
