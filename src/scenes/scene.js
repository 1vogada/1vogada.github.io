// A scene is a script the page runs with the hand (Surprise me). It is a core/clock.js scope on WALL time (legacy handScene
// used setTimeout, which keeps running while the tab is hidden), named, with legacy kill() semantics: every pending sleep
// rejects with GONE and the scene's finally block tidies up.
//
// Legacy handScene kept `scene = my = { dead, fails }` and:
//   sleep(ms)   pushed a rejecter on my.fails and set a timer that rejected (if dead by then) or resolved. A sleep started
//               after the kill was not rejected at once: its timer ran out first, then it rejected (kept: dead() sleeps).
//   kill()      dead = true and every fail in push order (the sleeps and the two answer promises).
//   finally     `if (scene === my) scene = null`: the scene stays current() until its own finally runs, even after kill()
//               (the secret × reads it right after killing: kept).

import { GONE, scope, real } from '../core/clock.js';
import { bus } from '../core/bus.js';

export { GONE };

let cur = null;

/**
 * start a scene. @returns {{ name, dead, sleep(ms), after, every, on, listen, onEnd, fail(fn), kill(), done() }}
 * emits scene.started; done() (the scene's finally) emits scene.ended and frees current()
 */
export function scene(name) {
  const sc = scope(name, { wall: true });
  const my = {
    name, dead: false,
    /** a wall-time wait that rejects with GONE when the scene is killed (legacy handScene sleep) */
    sleep: (ms) => (my.dead ? new Promise((r, j) => { real.after(ms, () => j(GONE)); }) : sc.sleep(ms)),
    after: sc.after, every: sc.every, on: sc.on, listen: sc.listen, onEnd: sc.onEnd,
    /** legacy my.fails.push(fn): run on kill, in push order (never, once the scene is dead) */
    fail(fn) { if (!my.dead) sc.onEnd(fn); },
    /** legacy my.kill() */
    kill() { my.dead = true; sc.end(); },
    /** the scene's finally: legacy `if (scene === my) scene = null` */
    done() {
      if (cur !== my) return;
      cur = null;
      if (!sc.ended) sc.end();
      bus.emit('scene.ended', { name, killed: my.dead });
    },
  };
  cur = my;
  bus.emit('scene.started', { name });
  return my;
}
/** the running scene or null (legacy `scene`) */ export const current = () => cur;
export function install(app) {}
