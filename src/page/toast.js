// The toast (legacy toast(msg)). Its life is TIMING.ms(msg, TIMING.floor.toast) on wall time (legacy setTimeout).
// Actors cannot import this file: they emit 'ui.toast' and src/reactions.js calls show(msg).
// In English-only mode the Bulgarian / Japanese parts of a toast are dropped first (scripts/lang.js wrapped window.toast).
// Toast for the hand: the fifth click knocks it off the screen onto the page as a slice of bread you can throw (page/bread.js);
// without physics (reduced motion, crazy mode) it tumbles off the screen as a CSS animation, as before. The knock-off emits
// 'secret.found' { name: 'toast' } (page/stamps.js).
// without physics (reduced motion, crazy mode) it tumbles off the screen as a CSS animation, as before.
// While the 1926 egg is on, the toast is a silent-film title card too (core/speech.js filmDress).

import { TUNE, TIMING } from '../core/tune.js';
import { list, line } from '../core/lines.js';
import { real } from '../core/clock.js';
import { bus } from '../core/bus.js';
import { filmDress } from '../core/speech.js';
import { plain } from './language.js';
import { fall } from './bread.js';

let cancel = null, pokes = 0, falling = false, said = '';

const hide = (t) => { t.classList.remove('show'); t.style.pointerEvents = ''; pokes = 0; };

/** legacy toast(msg) */
export function show(msg) {
  msg = plain(msg);
  const t = document.getElementById('toast');
  if (falling) return;
  said = msg; t.textContent = msg; filmDress(t); t.classList.add('show'); t.style.pointerEvents = 'auto'; pokes = 0;   // clickable while it shows (easter egg below)
  if (cancel) cancel();
  cancel = real.after(TIMING.ms(msg, TIMING.floor.toast), () => hide(t));
}

// Easter egg "talk back to the toast": click a toast and it answers (page.toastPoke, in turn); the fifth click knocks it off
// the screen onto the page. Lines are taken in order: no random draw.
function poke(t) {
  if (falling || !t.classList.contains('show')) return;
  const L = list('page.toastPoke');
  if (pokes < L.length) {
    const msg = L[pokes++]; t.textContent = msg; filmDress(t);
    if (cancel) cancel();
    cancel = real.after(TIMING.ms(msg, TIMING.floor.toast), () => hide(t));
    return;
  }
  falling = true; if (cancel) { cancel(); cancel = null; }
  bus.emit('secret.found', { name: 'toast' });
  t.textContent = line('page.toastFall'); filmDress(t);
  const dir = pokes % 2 ? 1 : -1, r = t.getBoundingClientRect();
  fall(said, r, dir).then((ok) => {   // it lands on the page as a slice of bread: the toast bar is simply gone
    if (!ok) return tumble(t, dir);
    t.style.transition = 'none'; hide(t); real.after(60, () => { t.style.transition = ''; falling = false; });
  });
}
// no physics: it falls off the screen
function tumble(t, dir) {
  const spin = dir * 38;
  const a = t.animate([{ transform: 'translate(-50%, 0) rotate(0deg)' }, { transform: `translate(-50%, -18px) rotate(${spin * 0.2}deg)`, offset: 0.18 }, { transform: `translate(-40%, 60vh) rotate(${spin}deg)`, opacity: 1 }],
    { duration: TUNE.toast.FALL_MS, easing: 'cubic-bezier(.5,0,.9,.6)' });
  a.onfinish = () => { t.style.transition = 'none'; hide(t); real.after(60, () => { t.style.transition = ''; falling = false; }); };
}

export function install(app) {
  const t = document.getElementById('toast');
  if (t) t.addEventListener('click', () => poke(t));
}
