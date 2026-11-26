// Crazy mode with old hands dancing (src/reactions.js, mode.changed -> bob(crazy)): the arm comes in to just inside the right
// edge and bobs along to the same beat as the old hands (one every TUNE.dance.BEAT_TICKS steps of the scrolling tab title, on game
// time), its hand swaying and switching between jazz hands and a happy fist; it says 'bob' once. It pretends it is not dancing.
// Crazy mode makes tick() in ./index.js return before the behaviours, so this runs instead (bobTick) while bobbing, and draws the
// arm; crazy mode's stylesheet hides the claw, so its two drawings get an inline display while it bobs (styles/ is pinned by a
// unit test). Its bubble is made visible by src/actors/severed/dance.js with the old hands' ones (.claw-say).
// bob(false) (crazy mode off, or the last old hand gone) hands it back to its behaviour, wherever it was.
import { TUNE } from '../../core/tune.js';
import { clock, now } from '../../core/clock.js';
import { expire } from '../../core/speech.js';
import { isCrazy } from '../../world/world.js';
import { POSES } from './poses.js';
import { gripPt } from './tug.js';
import { brain, get, speak, draw, easeArm, placeBubble } from './index.js';

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
  easeArm(c, dt, T, aim, pose, B.RATE, 9, 12);
  if (!c.bobSaid && t - c.bobAt > B.SAY_MS) { c.bobSaid = true; speak('bob', true); }
  const Hv = gripPt();
  if (expire(c, t)) placeBubble(c, vw, Hv);
  c.lookAt = null;
  draw(B.WIG, 0, 0);
}

export function install(app) {}
