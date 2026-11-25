// Back after the hand sent you away: another project and a rematch (legacy SENT, welcomeBack, the pageshow handler).
// Runs TUNE.surprise.WELCOME_MS after 'data.loaded' (wall time; wired in reactions.js) and PAGESHOW_MS after a persisted pageshow.
// Back on the page after the hand sent you away (Back button, a page restored from the back/forward cache, or a later
// visit in the same tab): it draws you another project and wants a rematch. A normal visit has no mark and gets nothing.

import { TUNE } from '../core/tune.js';
import { real } from '../core/clock.js';
import { isCrazy } from '../world/world.js';
import { data } from '../page/directory.js';
import { current } from './scene.js';
import { drawFortune, candidates, H } from './fortune.js';
import { handScene, setSwats } from './coin.js';

/** sessionStorage key: the project the hand sent you to (scenes/coin.js writes it before it sends you) */
export const SENT = 'kiripad-sent';

/** legacy welcomeBack() */
export function welcomeBack() {
  let sent = null; try { sent = sessionStorage.getItem(SENT); } catch (e) {}
  const d = data();
  if (!sent || current() || !d || !d.projects.length || !H() || isCrazy()) return;
  try { sessionStorage.removeItem(SENT); } catch (e) {}
  const list = candidates(d), fresh = list.filter((p) => p.url !== sent);
  const from = fresh.length ? fresh : list.length ? list : d.projects;
  setSwats(0);   // it already slapped you once today
  drawFortune(list, from[Math.floor(Math.random() * from.length)]);
  handScene(true);
}

export function install(app) {
  window.addEventListener('pageshow', (e) => { if (e.persisted) real.after(TUNE.surprise.PAGESHOW_MS, welcomeBack); });
}
