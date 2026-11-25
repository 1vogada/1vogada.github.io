// Light / dark (legacy themeBtn, darkNow, syncTheme, the theme button, localStorage kiripad-theme, the prefers-color-scheme
// listener). syncTheme emits 'theme.changed' where legacy recomputed the fog colour (rgb = fogRGB()): page/fog.js re-reads
// its colour on it (and only that). The button click also refogs (legacy syncTheme(); refog()).

import { bus } from '../core/bus.js';
import { refog } from './fog.js';

let root = null, themeBtn = null;
/** legacy darkNow() */
export const dark = () => root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
function syncTheme() { themeBtn.textContent = dark() ? '☀' : '☾'; bus.emit('theme.changed', { dark: dark() }); }

export function install(app) {
  root = document.documentElement;
  themeBtn = document.getElementById('theme');
  themeBtn.addEventListener('click', () => {
    root.dataset.theme = dark() ? 'light' : 'dark';
    try { localStorage.setItem('kiripad-theme', root.dataset.theme); } catch (e) {}
    syncTheme(); refog();
  });
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', syncTheme);
  syncTheme();
}
