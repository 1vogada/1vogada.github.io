// The toast (legacy toast(msg)). Its life is TIMING.ms(msg, TIMING.floor.toast) on wall time (legacy setTimeout).
// Actors cannot import this file: they emit 'ui.toast' and src/reactions.js calls show(msg).
// In English-only mode the Bulgarian / Japanese parts of a toast are dropped first (scripts/lang.js wrapped window.toast).

import { TIMING } from '../core/tune.js';
import { real } from '../core/clock.js';
import { plain } from './language.js';

let cancel = null;

/** legacy toast(msg) */
export function show(msg) {
  msg = plain(msg);
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  if (cancel) cancel();
  cancel = real.after(TIMING.ms(msg, TIMING.floor.toast), () => t.classList.remove('show'));
}

export function install(app) {}
