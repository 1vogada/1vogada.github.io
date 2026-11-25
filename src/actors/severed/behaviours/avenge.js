// cut-off hand behaviour "avenge": the katana that cut it off is lying loose, and the arm has a new hand. It walks to the hilt,
// takes hold of it (a hinge, so the blade drags along the floor behind it), hauls it to the right edge of the screen, and there
// lets go and flings it, tip up, at the arm: emits 'sev.avenged', and src/reactions.js cuts the new hand off. When that new old
// hand drops, the two of them high-five (five). Started from index.js (wants()); gives up after AVENGE.GIVE_UP_S, when you pick
// the katana up, or when the arm has no hand to cut.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { world } from '../../../world/world.js';
import { set, say, armed, avenger } from '../index.js';
import { GAIT, head } from '../gait.js';

const S = TUNE.physics.S, AV = TUNE.severed.AVENGE, HILT = { x: 0, y: -1.2 };   // the middle of the grip, on the katana body (m)

function release(a) { if (a.hinge) { world.b2.destroyJoint(a.hinge); a.hinge = null; } }

export default defineBehaviour('sev', 'avenge', {
  pose: 'sneak',
  up: true,
  enter(o, m) { const a = o.ai; a.gait = 'tiptoe'; a.hinge = null; a.avenged = true; o.body.setAngularDamping(0.5); say(o, 'avenge', true); },
  tick(o, m, dt) {
    const a = o.ai, k = world.blade, vw = document.documentElement.clientWidth;
    if (!k || k.root || !world.bodies.has(k) || (world.grab && world.grab.o === k) || !armed() || m.t > AV.GIVE_UP_S) { release(a); set(o, 'walk'); return; }
    const p = o.body.getPosition(), x = p.x * S;
    if (!a.hinge) {   // to the hilt
      const h = k.body.getWorldPoint(HILT), dx = h.x * S - x;
      if (Math.abs(dx) < AV.GRAB_PX && Math.abs(h.y - p.y) * S < AV.GRAB_DY) {
        a.hinge = world.b2.createJoint(new world.pl.RevoluteJoint({ collideConnected: false }, o.body, k.body, h));
        a.gait = 'scuttle'; say(o, 'haul', true); return;
      }
      head(a, dx < 0 ? -1 : 1); a.vx = a.dir * GAIT.scuttle.speed; a.gait = 'scuttle'; a.wig = 0.03; return;
    }
    // hauling it to the right edge of the screen
    const edge = scrollX + vw - AV.EDGE_PX;
    if (x < edge) { head(a, 1); a.vx = GAIT.scuttle.speed * AV.HAUL; a.wig = 0.15; if (m.t > (a.puff || 0)) { a.puff = m.t + AV.PUFF_S; say(o, 'haul'); } return; }
    // there: it lets go and throws the blade, tip first, up at the arm
    release(a);
    k.body.setLinearVelocity({ x: AV.THROW[0], y: AV.THROW[1] }); k.body.setAngularVelocity(AV.SPIN); k.body.setAwake(true);
    say(o, 'stab', true); avenger(o);
    bus.emit('sev.avenged', { hand: o });
    set(o, 'walk');
  },
  leave(o, m) { release(o.ai); },
});
export function install(app) {}
