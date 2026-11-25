// cut-off hand behaviour "walk": walking: looks around 4x a second for food (hunt) and the blade (flee); crawl / run / sneak /
// scuttle / stroll; crush when on a card; rest when tired.
// Legacy SEV.walk, moved verbatim: objs -> world.bodies, katObj -> world.blade, size -> world.size, the numbers named in
// TUNE.severed (same values). ctx (m) replaces legacy `a` for t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { clock } from '../../../core/clock.js';
import { world } from '../../../world/world.js';
import { GAIT } from '../gait.js';
import { set, say, food, tickNow } from '../index.js';

const S = TUNE.physics.S, SV = TUNE.severed;

// walking. How depends on what is going on: dragging itself along while it is hurt, strolling on tiptoe or scuttling like a spider with nothing to do,
// stalking a card it has seen and scuttling the last stretch, and running for it when the katana comes near
export default defineBehaviour('sev', 'walk', {
  pose: 'walk',
  up: true,
  enter(o, m) { const a = o.ai; a.turn = clock.now() + SV.TURN_MS[0] + Math.random() * SV.TURN_MS[1]; a.tired = clock.now() + SV.TIRED_MS[0] + Math.random() * SV.TIRED_MS[1]; a.stuck = 0; },
  tick(o, m, dt) {
    const a = o.ai, t = tickNow(), size = world.size;
    const b = o.body, p = b.getPosition(), v = b.getLinearVelocity();
    if (t > (a.look || 0)) {   // look around a few times a second
      a.look = t + SV.LOOK_MS; a.food = null; let best = SV.SEE_PX;
      if (t > a.cool) for (const q of world.bodies) { if (!food(q)) continue; const w = q.body.getWorldCenter(), dx = (w.x - p.x) * S, dy = (w.y - p.y) * S; if (dy > -90 && dy < 240 && Math.abs(dx) < best && q.body.getLinearVelocity().length() < 2.5) { best = Math.abs(dx); a.food = q; } }
      if (a.food && !a.hunting) say(o, 'hunt'); a.hunting = !!a.food;
      const kat = world.blade, k = kat && !kat.root && kat.tips ? kat.tips : null;   // the blade that cut it off
      if (k && Math.hypot(k[0] - p.x * S, k[1] - p.y * S) < SV.FLEE_PX) { if (t > a.flee) say(o, 'flee', true); a.flee = t + SV.FLEE_MS; a.fd = k[0] < p.x * S ? 1 : -1; }
    }
    const f = a.food && food(a.food) && world.bodies.has(a.food) ? a.food : null;
    a.stuck = Math.abs(v.x) < 0.25 ? a.stuck + dt : 0;
    if (t < a.flee) { a.gait = 'run'; if (p.x * S < SV.EDGE_PX) a.fd = 1; else if (p.x * S > size.W - SV.EDGE_PX) a.fd = -1; }
    else if (t < a.hurt) { a.gait = 'crawl'; say(o, 'drag'); if (p.x * S < SV.CRAWL_EDGE_PX) a.fd = 1; else if (p.x * S > size.W - SV.CRAWL_EDGE_PX) a.fd = -1; }
    else if (f) {
      const w = f.body.getWorldCenter(), dx = (w.x - p.x) * S; a.fd = dx < 0 ? -1 : 1; a.gait = Math.abs(dx) > f.w / 2 + 150 ? 'sneak' : 'scuttle';
      if ((Math.abs(dx) < 46 || (a.stuck > 0.2 && Math.abs(dx) < f.w / 2 + 110)) && Math.abs(w.y - p.y) * S < 260) { a.prey = f; return set(o, 'crush'); }   // over it, or up against its side: it climbs on
    } else {
      a.gait = a.stroll;
      if (p.x * S < SV.EDGE_PX) a.fd = 1; else if (p.x * S > size.W - SV.EDGE_PX) a.fd = -1; else if (t > a.turn) { a.fd = -a.fd; a.turn = t + SV.STROLL_TURN_MS[0] + Math.random() * SV.STROLL_TURN_MS[1]; a.stroll = Math.random() < 0.6 ? 'tiptoe' : 'scuttle'; }
      if (t > a.tired) return set(o, 'rest');
    }
    if (a.stuck > 0.7) { a.stuck = 0; if (f) { a.cool = t + SV.FOOD_COOL; a.food = null; } a.fd = -a.fd; a.turn = t + SV.STUCK_TURN_MS[0] + Math.random() * SV.STUCK_TURN_MS[1]; }
    const g = GAIT[a.gait]; a.vx = a.fd * g.speed * (g.drag ? (a.air ? 0.12 : 1) : 1);   // dragging: it only moves while both fingers have hold of the ground
    a.wig = 0.03; a.look2 = a.gait === 'sneak' ? 'sneak' : a.gait === 'run' ? 'run' : a.gait === 'crawl' ? 'crawl' : 'walk';
  },
});
export function install(app) {}
