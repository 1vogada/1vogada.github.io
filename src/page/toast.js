// The toast (legacy toast(msg)). Its life is TIMING.ms(msg, TIMING.floor.toast) on wall time (legacy setTimeout).
// Actors cannot import this file: they emit 'ui.toast' and src/reactions.js calls show(msg).
// In English-only mode the Bulgarian / Japanese parts of a toast are dropped first (scripts/lang.js wrapped window.toast).

import { TUNE, TIMING } from '../core/tune.js';
import { list, line } from '../core/lines.js';
import { real } from '../core/clock.js';
import { plain } from './language.js';

let cancel = null, pokes = 0, falling = false;

const hide = (t) => { t.classList.remove('show'); t.style.pointerEvents = ''; pokes = 0; };

/** legacy toast(msg) */
export function show(msg) {
  msg = plain(msg);
  const t = document.getElementById('toast');
  if (falling) return;
  t.textContent = msg; t.classList.add('show'); t.style.pointerEvents = 'auto'; pokes = 0;   // clickable while it shows (easter egg below)
  if (cancel) cancel();
  cancel = real.after(TIMING.ms(msg, TIMING.floor.toast), () => hide(t));
}

// Easter egg "talk back to the toast": click a toast and it answers (page.toastPoke, in turn); the fifth click knocks it off
// the screen. Lines are taken in order: no random draw.
function poke(t) {
  if (falling || !t.classList.contains('show')) return;
  const L = list('page.toastPoke');
  if (pokes < L.length) {
    const msg = L[pokes++]; t.textContent = msg;
    if (cancel) cancel();
    cancel = real.after(TIMING.ms(msg, TIMING.floor.toast), () => hide(t));
    return;
  }
  falling = true; if (cancel) { cancel(); cancel = null; }
  t.textContent = line('page.toastFall');
  const spin = (pokes % 2 ? 1 : -1) * 38;
  const a = t.animate([{ transform: 'translate(-50%, 0) rotate(0deg)' }, { transform: `translate(-50%, -18px) rotate(${spin * 0.2}deg)`, offset: 0.18 }, { transform: `translate(-40%, 60vh) rotate(${spin}deg)`, opacity: 1 }],
    { duration: TUNE.toast.FALL_MS, easing: 'cubic-bezier(.5,0,.9,.6)' });
  a.onfinish = () => { t.style.transition = 'none'; hide(t); real.after(60, () => { t.style.transition = ''; falling = false; }); };
}

export function install(app) {
  const t = document.getElementById('toast');
  if (t) t.addEventListener('click', () => poke(t));
}
