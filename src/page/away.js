// "Come back": while you are on another tab the tab title begs you to come back and the icon turns into the hand's 手; when
// you return it says "there you are" for TUNE.away.BACK_MS, then the page's own title and icon come back. Lines are taken in
// turn (no random draw). Skipped in crazy mode (that scrolls its own title) and under a test's frozen visibility.
// How long you were gone is wall time (the game clock stops while the tab is hidden): coming back emits 'page.returned' { ms },
// and after TUNE.awayThief.AWAY_MS or more the title is always "oh, there you are" (src/reactions.js may then find the hand
// chewing one of your cards: chain away-thief).
import { TUNE } from '../core/tune.js';
import { real, wall } from '../core/clock.js';
import { bus } from '../core/bus.js';
import { list } from '../core/lines.js';
import { isCrazy } from '../world/world.js';

const A = TUNE.away;
const HAND_ICON = "data:image/svg+xml," + encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='#1d1a19'/><text x='16' y='24' font-size='21' text-anchor='middle' fill='#e2574c' font-family='serif'>手</text></svg>");
let n = 0, saved = null, backTimer = null, left = 0;

const icon = () => document.querySelector('link[rel="icon"]');

function away() {
  if (isCrazy() || saved) return;
  if (backTimer) { backTimer(); backTimer = null; }
  const ic = icon();
  saved = { title: document.title, icon: ic ? ic.href : null }; left = wall();
  const L = list('page.away'); document.title = L[n++ % L.length];
  if (ic) ic.href = HAND_ICON;
}
function back() {
  if (!saved) return;
  const was = saved; saved = null;
  const ic = icon(); if (ic && was.icon) ic.href = was.icon;
  if (isCrazy()) return;
  const ms = wall() - left, L = list('page.back');
  document.title = ms >= TUNE.awayThief.AWAY_MS ? L[0] : L[(n - 1 + L.length) % L.length];   // away long enough: "oh, there you are"
  bus.emit('page.returned', { ms });
  backTimer = real.after(A.BACK_MS, () => { backTimer = null; if (!saved && !isCrazy()) document.title = was.title; });
}

export function install(app) {
  document.addEventListener('visibilitychange', () => (document.hidden ? away() : back()));
}
