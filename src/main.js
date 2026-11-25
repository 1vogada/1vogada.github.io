// The entry point of the new code (the default; ?legacy loads the old script instead). Imports every module and
// installs them in a fixed order. The order is legacy script order, because it decides the order of DOM listeners of the
// same type on the same target (keydown Escape, pointermove, pointerdown) and of the Math.random draws made at start-up
// (the fog's blobs before the flood's). See src/README.md "Install order" before moving anything.

import * as tune from './core/tune.js';
import * as events from './core/events.js';
import * as busMod from './core/bus.js';
import * as clockMod from './core/clock.js';
import * as linesMod from './core/lines.js';
import * as speech from './core/speech.js';
import * as machineMod from './core/machine.js';
import * as claimsMod from './core/claims.js';
import * as debug from './core/debug.js';

import * as linesCards from './lines/cards.js';
import * as linesKatana from './lines/katana.js';
import * as linesHand from './lines/hand.js';
import * as linesSevered from './lines/severed.js';
import * as linesShelf from './lines/shelf.js';
import * as linesPhrasebook from './lines/phrasebook.js';
import * as linesPage from './lines/page.js';

import * as toast from './page/toast.js';
import * as directory from './page/directory.js';
import * as reader from './page/reader.js';
import * as search from './page/search.js';
import * as tilt from './page/tilt.js';

import * as world from './world/world.js';
import * as loop from './world/loop.js';
import * as drag from './world/drag.js';
import * as shatter from './world/shatter.js';
import * as cut from './world/cut.js';
import * as fx from './world/fx.js';

import * as cards from './actors/cards.js';
import * as katana from './actors/katana.js';
import * as handPoses from './actors/hand/poses.js';
import * as handDraw from './actors/hand/draw.js';
import * as handZones from './actors/hand/zones.js';
import * as handTug from './actors/hand/tug.js';
import * as hOff from './actors/hand/behaviours/off.js';
import * as hLurk from './actors/hand/behaviours/lurk.js';
import * as hReach from './actors/hand/behaviours/reach.js';
import * as hEager from './actors/hand/behaviours/eager.js';
import * as hLunge from './actors/hand/behaviours/lunge.js';
import * as hSnatch from './actors/hand/behaviours/snatch.js';
import * as hCatch from './actors/hand/behaviours/catch.js';
import * as hCrush from './actors/hand/behaviours/crush.js';
import * as hGloat from './actors/hand/behaviours/gloat.js';
import * as hTug from './actors/hand/behaviours/tug.js';
import * as hHas from './actors/hand/behaviours/has.js';
import * as hTriumph from './actors/hand/behaviours/triumph.js';
import * as hEat from './actors/hand/behaviours/eat.js';
import * as hShow from './actors/hand/behaviours/show.js';
import * as hStump from './actors/hand/behaviours/stump.js';
import * as hRegrow from './actors/hand/behaviours/regrow.js';
import * as hSulk from './actors/hand/behaviours/sulk.js';
import * as hBook from './actors/hand/behaviours/book.js';
import * as hMeet from './actors/hand/behaviours/meet.js';
import * as hDevour from './actors/hand/behaviours/devour.js';
import * as handOld from './actors/hand/old.js';
import * as hand from './actors/hand/index.js';
import * as sevGait from './actors/severed/gait.js';
import * as sLimp from './actors/severed/behaviours/limp.js';
import * as sRise from './actors/severed/behaviours/rise.js';
import * as sWalk from './actors/severed/behaviours/walk.js';
import * as sHeld from './actors/severed/behaviours/held.js';
import * as sCrush from './actors/severed/behaviours/crush.js';
import * as sGloat from './actors/severed/behaviours/gloat.js';
import * as sRest from './actors/severed/behaviours/rest.js';
import * as sStare from './actors/severed/behaviours/stare.js';
import * as sCaught from './actors/severed/behaviours/caught.js';
import * as severed from './actors/severed/index.js';
import * as shelf from './actors/shelf.js';

import * as reactions from './reactions.js';

import * as greeting from './page/greeting.js';
import * as scene from './scenes/scene.js';
import * as fortune from './scenes/fortune.js';
import * as coin from './scenes/coin.js';
import * as welcomeBack from './scenes/welcome-back.js';
import * as fog from './page/fog.js';
import * as kiri from './page/kiri.js';
import * as theme from './page/theme.js';
import * as crazy from './page/crazy.js';

import * as menu from './phrasebook/menu.js';
import * as figures from './phrasebook/figures.js';
import * as raid from './phrasebook/raid.js';

import * as language from './page/language.js';

/** [name, module] in install order */
export const ORDER = [
  // 1 core
  ['tune', tune], ['events', events], ['bus', busMod], ['clock', clockMod], ['lines', linesMod], ['speech', speech],
  ['machine', machineMod], ['claims', claimsMod], ['debug', debug],
  // 2 line tables (defineLines runs when they are imported; install is for anything that needs the DOM)
  ['linesCards', linesCards], ['linesKatana', linesKatana], ['linesHand', linesHand], ['linesSevered', linesSevered],
  ['linesShelf', linesShelf], ['linesPhrasebook', linesPhrasebook], ['linesPage', linesPage],
  // 3 the page above the physics in legacy script order: toast, directory (+ fetches), reader, search, tilt (+ band roll)
  ['toast', toast], ['directory', directory], ['reader', reader], ['search', search], ['tilt', tilt],
  // 4 legacy cardPhysics(): the world, then the actors in the order their legacy listeners were registered
  ['world', world], ['loop', loop], ['drag', drag], ['shatter', shatter], ['cut', cut], ['fx', fx],
  ['cards', cards], ['katana', katana],
  ['handPoses', handPoses], ['handDraw', handDraw], ['handZones', handZones], ['handTug', handTug],
  ['hOff', hOff], ['hLurk', hLurk], ['hReach', hReach], ['hEager', hEager], ['hLunge', hLunge], ['hSnatch', hSnatch], ['hCatch', hCatch],
  ['hCrush', hCrush], ['hGloat', hGloat], ['hTug', hTug], ['hHas', hHas], ['hTriumph', hTriumph], ['hEat', hEat], ['hShow', hShow],
  ['hStump', hStump], ['hRegrow', hRegrow], ['hSulk', hSulk], ['hBook', hBook], ['hMeet', hMeet], ['hDevour', hDevour], ['handOld', handOld], ['hand', hand],
  ['sevGait', sevGait], ['sLimp', sLimp], ['sRise', sRise], ['sWalk', sWalk], ['sHeld', sHeld], ['sCrush', sCrush], ['sGloat', sGloat], ['sRest', sRest], ['sStare', sStare], ['sCaught', sCaught],
  ['severed', severed], ['shelf', shelf],
  // 5 the rules between features (after every actor: own listeners first)
  ['reactions', reactions],
  // 6 the page below the physics in legacy script order
  ['greeting', greeting], ['scene', scene], ['fortune', fortune], ['coin', coin], ['welcomeBack', welcomeBack],
  ['fog', fog], ['kiri', kiri], ['theme', theme], ['crazy', crazy],
  // 7 the phrasebook (legacy: a deferred script, after the inline one)
  ['phrasebook', menu], ['figures', figures], ['raid', raid],
  // 8 new
  ['language', language],
];

/** the app every install(app) receives: each module by name, plus a few flags */
export const app = {
  reduced: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  root: typeof document !== 'undefined' ? document.documentElement : null,
};
for (const [name, mod] of ORDER) app[name] = mod;

export function boot() {
  if (app.booted) return app;
  app.booted = true;
  for (const [name, mod] of ORDER) {
    if (typeof mod.install !== 'function') throw new Error(`main: ${name} has no install(app)`);
    mod.install(app);
  }
  return app;
}

boot();
