// cut-off hand behaviour "gift": like a cat with a mouse. It has just crushed a card while your pointer rested on the page
// (crush made the crumpled ball, o.ai.ball, see crumple() in ../index.js; gloat hands over to here). It carries the ball on its
// back to below your cursor, puts it down at your feet, steps back and waits, pleased with itself; then walks off. Throw the
// ball at the new hand and the new hand eats it and burps (actors/hand: catch, eat).
// o.ai: ball (the ball, claimed 'sev' / 'gift' while carried), given (s into the state when it put it down), free (the claim's release).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { claim } from '../../../core/claims.js';
import { world, isHeld, HIT_ALL, NO_HIT } from '../../../world/world.js';
import { GAIT, head } from '../gait.js';
import { set, say, pointer } from '../index.js';

const S = TUNE.physics.S, SV = TUNE.severed, G = SV.GIFT;

/** it takes the ball it made (crush): claimed, weightless, passing through everything */
export function pickUp(o) {
  const a = o.ai, q = a.ball; if (!q || a.free || !world.bodies.has(q)) return;
  a.free = claim(q, 'sev', 'gift'); q.body.getFixtureList().setFilterData(NO_HIT); q.body.setGravityScale(0);
}
/** the ball rides on its back (each frame) */
export function carry(o) {
  const q = o.ai.ball; if (!q || !world.bodies.has(q) || isHeld(q)) return;
  const p = o.body.getPosition(), lc = q.body.getLocalCenter();
  q.body.setTransform({ x: p.x - lc.x, y: p.y - G.ON_TOP_PX / S - lc.y }, 0); q.body.setLinearVelocity({ x: 0, y: 0 }); q.body.setAngularVelocity(0);
}
/** it lets go of the ball (it drops where it is, with a little push) */
export function putDown(o, push) {
  const a = o.ai, q = a.ball; if (a.free) { a.free(); a.free = null; }
  if (q && world.bodies.has(q)) { q.body.getFixtureList().setFilterData(HIT_ALL); q.body.setGravityScale(TUNE.physics.FALL); q.body.setLinearVelocity({ x: push ? a.fd * G.PUSH[0] : 0, y: push ? -G.PUSH[1] : 0 }); q.body.setAwake(true); }
}

export default defineBehaviour('sev', 'gift', {
  pose: 'walk',
  up: true,
  enter(o, m) {
    const a = o.ai, q = a.ball; a.given = null; a.vx = 0; a.gait = 'tiptoe';
    if (!q || !world.bodies.has(q)) return;
    pickUp(o); say(o, 'fetch', true);
  },
  tick(o, m, dt) {
    const a = o.ai, q = a.ball, b = o.body, p = b.getPosition();
    if (a.given != null) {   // it put it down: it waits, bouncing on its fingers, looking up at you
      a.vx = 0; a.hop = 0.12 * Math.abs(Math.sin(m.t * 8)); a.wig = 0.05;
      if (m.t - a.given > G.WAIT_S) { a.hop = 0; a.ball = null; set(o, 'walk'); }
      return;
    }
    if (!q || !world.bodies.has(q) || isHeld(q)) { putDown(o, false); a.ball = null; set(o, 'walk'); return; }   // the ball is gone, or you took it from it
    const P = pointer();
    if (!P || m.t > G.MAX_S) { putDown(o, false); a.ball = null; set(o, 'walk'); return; }   // you went away: it leaves it where it is
    carry(o);   // on its back while it walks
    const dx = P[0] + scrollX - p.x * S, d = dx < 0 ? -1 : 1;
    if (Math.abs(dx) < G.AT_PX) {   // at your feet: it puts it down for you
      putDown(o, true); a.given = m.t; a.vx = 0;
      say(o, 'gift', true); bus.emit('sev.gift', { hand: o, ball: q });
      return;
    }
    head(a, d); a.gait = Math.abs(dx) > G.FAR_PX ? 'scuttle' : 'tiptoe';
    a.vx = a.fd === d ? a.fd * GAIT[a.gait].speed : 0; a.wig = 0.03;
    if (m.t > 3 && Math.abs(dx) > G.FAR_PX) say(o, 'fetch');
  },
  leave(o, m) { const a = o.ai; if (a.given == null) putDown(o, false); a.hop = 0; a.given = null; },
});
export function install(app) {}
