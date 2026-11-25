// Crazy mode with old hands dancing (src/reactions.js, mode.changed -> bob(crazy)): the arm comes in to just inside the right
// edge and bobs along to the same beat as the old hands (one every TUNE.dance.BEAT_TICKS steps of the scrolling tab title, on game
// time), its hand swaying and switching between jazz hands and a happy fist; it says 'bob' once. It pretends it is not dancing.
// Crazy mode makes tick() in ./index.js return before the behaviours, so this runs instead (bobTick) while bobbing, and draws the
// arm; crazy mode's stylesheet hides the claw, so its two drawings get an inline display while it bobs (styles/ is pinned by a
// unit test). Its bubble is made visible by src/actors/severed/dance.js with the old hands' ones (.claw-say).
// bob(false) (crazy mode off, or the last old hand gone) hands it back to its behaviour, wherever it was.
import { TUNE } from '../../core/tune.js';
import { clock, now } from '../../core/clock.js';
import { expire, place } from '../../core/speech.js';
import { isCrazy } from '../../world/world.js';
import { POSES } from './poses.js';
import { gripPt } from './tug.js';
import { brain, get, speak, draw, wrapA } from './index.js';

const D = TUNE.dance, B = D.BOB, BEAT_MS = TUNE.crazy.TITLE_MS * D.BEAT_TICKS;
let on = false;

/** it is bobbing along (crazy mode, old hands dancing) */
export const bobbing = () => on && isCrazy();

/** start (true, only in crazy mode once it exists) or stop bobbing. @returns true when it changed */
export function bob(v) {
  if (!brain()) return false;
  v = !!v && isCrazy(); if (v === on) return false;
  on = v; const c = get();
  c.under.style.display = c.over.style.display = on ? 'block' : '';
  if (on) { c.bobAt = now(); c.bobSaid = false; clock.wake(); }
  return true;
}

/** one frame of bobbing (from tick() in ./index.js while crazy mode is on) */
export function bobTick(c, dt) {
  if (!bobbing()) return;
  const vw = document.documentElement.clientWidth, t = now(), b = t / BEAT_MS, n = Math.floor(b), u = b - n;
  const T = [vw - B.EDGE_PX, c.ly + B.PX * (1 - Math.abs(Math.cos(Math.PI * u)))];   // down and up once a beat
  const aim = Math.PI + B.SWAY * Math.sin(Math.PI * b), pose = n % 2 ? POSES.joy : POSES.eager;
  const k = 1 - Math.exp(-dt * B.RATE), ka = 1 - Math.exp(-dt * 9), kp = 1 - Math.exp(-dt * 12);
  c.x += (T[0] - c.x) * k; c.y += (T[1] - c.y) * k; c.a += wrapA(aim - c.a) * ka; c.sh += (c.y + 70 - c.sh) * (1 - Math.exp(-dt * 4));
  for (const key in pose) c.pose[key] = (c.pose[key] || 0) + (pose[key] - (c.pose[key] || 0)) * kp;
  if (!c.bobSaid && t - c.bobAt > B.SAY_MS) { c.bobSaid = true; speak('bob', true); }
  const Hv = gripPt();
  if (expire(c, t)) place(c, Math.min(c.x, Hv[0], vw - 80) - 30 + scrollX, Math.max(70, Math.min(c.y, Hv[1]) - 115) + scrollY, c.x + scrollX);
  c.lookAt = null;
  draw(B.WIG, 0, 0);
}

export function install(app) {}
