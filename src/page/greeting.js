// The greeting typewriter (legacy hellos + type()): TUNE.greeting, wall-time sleeps (legacy setTimeout). With reduced
// motion it is a fixed "Hi there.". In English-only mode (page/language.js) it types only the English words ('Hi there.',
// 'Welcome.'), the same sequence legacy typed from the hellos array scripts/lang.js thinned in place.

import { TUNE } from '../core/tune.js';
import { real } from '../core/clock.js';
import { thin } from './language.js';

const { TYPE_MS, HOLD_MS, ERASE_MS, PAUSE_MS } = TUNE.greeting;

// ---- Bulgarian, Japanese, English ----
export const hellos = ['Hi there.', 'Здравей.', 'こんにちは。', 'Welcome.', 'Добре дошли.', 'ようこそ。']; // always English, then Bulgarian, then Japanese
const words = thin(hellos);

export function install(app) {
  const helloEl = document.getElementById('hello');
  if (app.reduced) { helloEl.textContent = words[0]; return; }
  (async function type() {
    const wait = real.sleep;
    for (let k = 0; ; k = (k + 1) % words.length) {
      const word = [...words[k]];
      for (let j = 1; j <= word.length; j++) { helloEl.textContent = word.slice(0, j).join(''); await wait(TYPE_MS); }
      await wait(HOLD_MS);
      for (let j = word.length - 1; j >= 0; j--) { helloEl.textContent = word.slice(0, j).join(''); await wait(ERASE_MS); }
      await wait(PAUSE_MS);
    }
  })();
}
