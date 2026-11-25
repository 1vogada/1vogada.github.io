// The project directory (legacy esc, host, seeded, band, excerpt, items, visible, sections, calmCard, fmtDate, render, the
// site.json / projects.json fetches). STUB. After projects.json renders it emits 'data.loaded'; every render emits
// 'cards.rendered' (and still dispatches the legacy DOM event 'cards-rendered').

const todo = (name) => () => { throw new Error(`directory.${name}: not implemented`); };

/** the loaded projects.json (legacy data) or null */ export const data = () => null;
/** legacy items() */ export const items = todo('items');
/** legacy visible() */ export const visible = todo('visible');
/** legacy render() */ export const render = todo('render');
/** legacy band(name, i): the project's embroidery */ export const band = todo('band');
/** legacy esc(s) */ export const esc = todo('esc');
/** set the search query (search.js) */ export const setQuery = todo('setQuery');
export function install(app) {}
