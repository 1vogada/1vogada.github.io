// Rock, paper, scissors. The new hand meets an old one (hand.met) and, now and then (TUNE.rps.CHANCE), they settle it the old
// way: the arm comes out over the old hand, which stands up on its wrist; both pump their fists three times and show. You can
// shout a pick for the old hand by typing r, p or s while they count. A draw: again (TUNE.rps.ROUNDS at most). The old hand
// loses: it is fair game for the new one for a while (it may be eaten, rules in actors/hand/old.js). The new hand loses: it
// sulks off out of sight for TUNE.rps.SULK_MS.
// A scene (scenes/scene.js): wall-time sleeps that reject with GONE when the scene is killed; done() in the finally.
// Off under tests (window.__test.idle === false, like the arm's "are you still there?") and in crazy mode; the random draws
// (the chance, then each pick) happen only on this path. Emits rps.played { hand, arm, old, you, winner } at each show.
import { TUNE, TIMING } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { flags } from '../core/debug.js';
import { world, isCrazy } from '../world/world.js';
import * as hand from '../actors/hand/index.js';
import * as severed from '../actors/severed/index.js';
import { scene, current, GONE } from './scene.js';

const R = TUNE.rps, PICKS = ['rock', 'paper', 'scissors'], KEYS = { r: 'rock', p: 'paper', s: 'scissors' };
const QUIT = new Error('rps: the old hand left');
/** a beats b */
const beats = (a, b) => (a === 'rock' && b === 'scissors') || (a === 'paper' && b === 'rock') || (a === 'scissors' && b === 'paper');
const pick = () => PICKS[Math.min(2, Math.floor(Math.random() * 3))];

let app = { reduced: false };

/** hand.met (src/reactions.js): maybe they play */
export function maybe(o) {
  if (app.reduced || !flags().idle || current() || isCrazy() || !hand.awake()) return;
  if (Math.random() >= R.CHANCE) return;
  play(o).catch((e) => { if (e !== GONE) throw e; });
}

/** one game with old hand o */
export async function play(o) {
  if (current()) return;
  const my = scene('rps');
  let counting = false, you = null;
  const onKey = (e) => {   // you shout a pick for the old hand
    if (!counting || e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
    const t = e.target; if (t && (/^(input|textarea|select)$/i.test(t.tagName) || t.isContentEditable)) return;
    const k = KEYS[(e.key || '').toLowerCase()]; if (!k) return;
    if (you !== k) severed.say(o, 'coached', true);
    you = k;
  };
  const here = () => severed.list.has(o) && world.bodies.has(o);
  const alive = () => here() && severed.brain(o).is('rps');
  try {
    await my.sleep(R.WAIT_MS);   // they look at each other first (meet, stare)
    const hm = hand.brain();
    if (!here() || !severed.brain(o).is('stare', 'walk') || !hm || !hm.is('meet', 'lurk')) return;
    document.addEventListener('keydown', onKey);
    const vw = document.documentElement.clientWidth, w = o.body.getWorldCenter(), qy = w.y * TUNE.physics.S - scrollY;
    const x = vw - R.IN_PX, y = Math.max(R.TOP_PX, Math.min(innerHeight - R.TOP_PX, qy - R.ABOVE_PX));
    await hand.come(x, y, 'eager');
    severed.set(o, 'rps'); severed.play(o, { pose: 'rock', pump: false });
    await my.sleep(Math.max(TIMING.wait.hello, hand.say('rps')));
    if (!alive()) throw QUIT;
    severed.say(o, 'rpsYes', true); await my.sleep(R.YES_MS);
    let done = false;
    for (let n = 0; n < R.ROUNDS && !done; n++) {
      if (!alive()) throw QUIT;
      counting = true; you = null;
      hand.to({ pose: R.HAND.rock, bob: false, rate: 16, wig: 0.04 }); severed.play(o, { pose: 'rock', pump: true });
      for (let k = 0; k < R.PUMPS; k++) {
        hand.to({ y: y - R.PUMP_PX }); await my.sleep(R.PUMP_MS / 2);
        hand.to({ y }); await my.sleep(R.PUMP_MS / 2);
        if (!alive()) throw QUIT;
      }
      counting = false;
      const arm = pick(), old = you || pick(), winner = arm === old ? null : beats(arm, old) ? 'arm' : 'old';
      hand.to({ pose: R.HAND[arm], rate: 30 }); severed.play(o, { pose: old, pump: false });
      hand.say('rpsShoot');
      bus.emit('rps.played', { hand: o, arm, old, you: !!you, winner });
      await my.sleep(R.SHOW_MS);
      if (!winner) { await my.sleep(Math.max(R.DRAW_MS, hand.say('rpsDraw'))); continue; }
      done = true;
      if (winner === 'arm') {   // the old hand lost: fair game
        hand.to({ pose: 'joy', bob: true }); hand.say('rpsWon'); await my.sleep(R.SAY_GAP_MS);
        severed.say(o, 'rpsLost', true); hand.oldLost(o);
        await my.sleep(R.END_MS);
        if (alive()) severed.set(o, 'walk');
      } else {   // the new hand lost: it sulks off
        severed.set(o, 'gloat'); severed.say(o, 'rpsWon', true);
        hand.to({ pose: 'sulk', bob: false, rate: 6 }); await my.sleep(R.SAY_GAP_MS);
        await my.sleep(Math.max(R.END_MS, hand.say('rpsLost')));
        hand.sulkFor(R.SULK_MS);
      }
    }
    if (!done) { hand.to({ pose: 'sulk' }); await my.sleep(Math.max(R.END_MS, hand.say('rpsDraw'))); }   // a draw, every time: they call it off
  } catch (e) {
    if (e === QUIT) { hand.to({ pose: 'point', bob: false }); await my.sleep(Math.max(R.END_MS, hand.say('rpsQuit'))).catch(() => {}); }
    else if (e !== GONE) throw e;
  } finally {
    document.removeEventListener('keydown', onKey);
    if (here() && severed.brain(o).is('rps')) severed.set(o, 'walk');
    hand.leave();   // 'show' -> 'sulk' (nothing if it already went: sulkFor)
    my.done();
  }
}

export function install(a) { app = a || app; }
