// cut-off hand behaviour "paint": nobody has touched it for TUNE.severed.PAINT.MS (index.js), so it finger-paints a word on the
// floor in the gore it drips ("HELP", "ivo was here", 手, ...: the 'sev.paint' list), walking along as the letters appear. It
// steps back, says something about its art, and walks on. The word stays on the page and fades after PAINT.FADE_MS. Once per hand.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { clock } from '../../../core/clock.js';
import { line } from '../../../core/lines.js';
import { world } from '../../../world/world.js';
import { gore } from '../../../world/fx.js';
import { set, say } from '../index.js';
import { GAIT, head, ground } from '../gait.js';

const S = TUNE.physics.S, PA = TUNE.severed.PAINT;

export default defineBehaviour('sev', 'paint', {
  pose: 'walk',
  up: true,
  enter(o, m) {
    const a = o.ai, p = o.body.getPosition(), x = p.x * S, floor = (ground(x, p.y * S + 80) ?? world.size.H) - 10, dir = x > world.size.W / 2 ? -1 : 1;   // the floor: looking down from just under its own body
    const el = document.createElement('div'), word = line('sev.paint');
    el.textContent = word; el.setAttribute('aria-hidden', 'true');
    Object.assign(el.style, { position: 'absolute', left: '0', top: '0', whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: '0',
      font: `italic 800 ${PA.SIZE_PX}px/1 "Segoe Print", "Bradley Hand", "Comic Sans MS", "Chalkboard SE", cursive`, color: '#8e1b14', opacity: '.85', letterSpacing: '.04em',
      textShadow: '0 1px 0 #5c0d08, 1px 2px 2px rgba(110, 10, 5, .35)', transform: 'rotate(-2deg)', clipPath: 'inset(0 100% 0 0)' });
    world.layer.prepend(el);
    const w = el.offsetWidth, left = dir > 0 ? x + 30 : x - 30 - w;
    el.style.translate = `${left.toFixed(0)}px ${(floor - PA.SIZE_PX).toFixed(0)}px`;
    a.paint = { el, left, w, dir, start: x, floor, drip: 0 };
    clock.real.after(PA.FADE_MS, () => { el.style.transition = 'opacity 4s'; el.style.opacity = '0'; clock.real.after(4000, () => el.remove()); });
    o.body.setAngularDamping(0.5); a.gait = 'tiptoe';
  },
  tick(o, m, dt) {
    const a = o.ai, P = a.paint; if (!P) { set(o, 'walk'); return; }
    const f = Math.min(1, m.t * 1000 / PA.DRAW_MS), x = o.body.getPosition().x * S;
    // the word appears from the end it started at, as the hand walks along it, dripping
    P.el.style.clipPath = P.dir > 0 ? `inset(0 ${((1 - f) * 100).toFixed(1)}% 0 0)` : `inset(0 0 0 ${((1 - f) * 100).toFixed(1)}%)`;
    const want = P.dir > 0 ? P.left + P.w * f : P.left + P.w * (1 - f);
    head(a, want > x ? 1 : -1); a.vx = Math.abs(want - x) > 12 ? a.dir * GAIT.tiptoe.speed * 0.7 : 0; a.wig = 0.25;
    if (m.t * 1000 > P.drip) { P.drip = m.t * 1000 + 140; gore(want, P.floor - 6, 0, 1, 1, 0.2); }
    if (f >= 1) { a.paint = null; say(o, 'painted', true); set(o, 'walk'); }
  },
  leave(o, m) { o.ai.paint = null; },   // interrupted (picked up, scared off): the word stays as far as it got
});
export function install(app) {}
