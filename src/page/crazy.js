// Crazy mode (legacy calmTitle, slopTitle, titleTimer, applyMode, warn, setCrazy, askCrazy, the toggle / warning handlers).
// kiripad-mode=crazy in storage only sets data-want-crazy (head script); the flashing-lights warning asks again on every load.
// The tab title scrolls on a wall-time interval (legacy setInterval). applyMode emits 'mode.changed' where legacy called the
// fog's setRunning(!crazy && !document.hidden): page/fog.js answers it. Then the grid re-renders (badges in crazy mode).

import { bus } from '../core/bus.js';
import { real } from '../core/clock.js';
import { isCrazy } from '../world/world.js';
import { render } from './directory.js';

const TITLE_MS = 180;   // TUNE-REQUEST: TUNE.crazy.TITLE_MS (legacy setInterval 180 ms per scrolled character)

const calmTitle = 'kiripad.dev · Projects';
let slopTitle = '✨🚀 KIRIPAD.DEV 🚀 Revolutionizing The Future With AI-Powered Synergy 🤖 100% CERTIFIED SLOP 🥣 ';
let titleTimer = null;
let root = null, warn = null;

function applyMode() {
  const crazy = isCrazy();
  document.getElementById('toggle').textContent = crazy ? '😴 back to boring mode' : 'Crazy mode';
  if (titleTimer) { titleTimer(); titleTimer = null; }
  if (crazy) titleTimer = real.every(TITLE_MS, () => { slopTitle = slopTitle.slice(1) + slopTitle[0]; document.title = slopTitle; });
  else document.title = calmTitle;
  bus.emit('mode.changed', { crazy });
  render();
}
/** legacy setCrazy(on) */
export function setCrazy(on) {
  root.classList.toggle('crazy', on);
  try { localStorage.setItem('kiripad-mode', on ? 'crazy' : 'normal'); } catch (e) {}
  applyMode();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
/** legacy askCrazy(): the flashing-lights warning */
export function askCrazy() { warn.hidden = false; document.getElementById('warn-yes').focus(); }

export function install(app) {
  root = document.documentElement;
  warn = document.getElementById('warn');
  document.getElementById('toggle').addEventListener('click', () => { if (isCrazy()) setCrazy(false); else askCrazy(); });
  document.getElementById('warn-yes').addEventListener('click', () => { warn.hidden = true; setCrazy(true); });
  document.getElementById('warn-no').addEventListener('click', () => { warn.hidden = true; setCrazy(false); });
  warn.addEventListener('keydown', (e) => { if (e.key === 'Escape') document.getElementById('warn-no').click(); });
  applyMode();
  if (root.dataset.wantCrazy) askCrazy();
}
