// The search box (legacy q input / keydown). Escape clears it; Enter opens the first result; tana / рафт / たな / 棚 + Enter
// opens the shelf through actors/shelf.js (legacy window.__shelf, which only existed without reduced motion).
// The "/" key that focuses the box is part of the page keys (page/kiri.js); it calls focus() here.

import { render, setQuery, visible } from './directory.js';
import * as shelf from '../actors/shelf.js';

let q = null;
/** legacy q.focus() from the page keys ("/", not in crazy mode: the caller checks) */
export const focus = () => q && q.focus();

export function install(app) {
  q = document.getElementById('q');
  q.addEventListener('input', () => { setQuery(q.value.trim()); render(); });
  q.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { q.value = ''; setQuery(''); render(); q.blur(); }
    if (e.key === 'Enter' && !e.isComposing) {
      // 棚 the shelf secret works from the search box too (Enter / Go on a phone keyboard): clear the box and open it
      if (/^(tana|рафт|たな|棚)$/i.test(q.value.trim()) && !app.reduced) { e.preventDefault(); q.value = ''; setQuery(''); render(); q.blur(); shelf.toggle(); return; }
      const first = visible()[0]; if (first) location.href = first.url;
    }
  });
}
