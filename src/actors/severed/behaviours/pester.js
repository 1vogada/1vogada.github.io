// cut-off hand behaviour "pester": your mouse has gone still (../pester.js picked it). It walks over to below your cursor
// ('go'), looks up ('wait'), and jumps up to poke it with one finger ('hop': its body is put on an arc from where it stood to
// just under the cursor and back, fingers up, no gravity, passing through everything; at the top it holds still a moment, its
// fingertip put on the cursor from where the last frame drew it). Each poke emits 'sev.pestered' { hand, n }. Alone it pokes every PESTER.SOLO_S; once the arm has
// joined in (its pokes come back through pesterTurn() in ../pester.js) it waits for the arm's poke and answers it a little
// sooner each time (PESTER.RALLY). You move the mouse ('back'): it drops, says so, and walks off after PESTER.BACK_S.
// o.ai.pe: phase (go | wait | hop | back), from (the pointer's last move), n (pokes so far), next (m.t of its next hop), turn (the arm
// poked since its last hop), retort (it answered the arm's "MY job"), base (where it stood: page px and angle), at, dur, hit, off (its fingertip from its
// middle at the top, viewport px), prev (its middle last frame), top (last frame it was at the top).
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { bus } from '../../../core/bus.js';
import { isCrazy, HIT_ALL, NO_HIT } from '../../../world/world.js';
import { GAIT, head, clamp01, wrapA } from '../gait.js';
import { set, say, pointer, moved } from '../index.js';
import { pesterFrom, poked } from '../pester.js';
import { easePose } from '../../../world/math.js';

const S = TUNE.physics.S, PE = TUNE.severed.PESTER;

/** up it goes: from where it stands now */
function hop(o, m) {
  const a = o.ai, pe = a.pe, b = o.body, p = b.getPosition();
  pe.base = { x: p.x * S, y: p.y * S, a: b.getAngle() }; pe.phase = 'hop'; pe.at = m.t; pe.hit = false;
  pe.dur = Math.max(PE.HOP_MIN_S, PE.HOP_S * Math.pow(PE.RALLY.DECAY, pe.n));
  a.up = false; a.hop = 0; a.vx = 0; a.poseSet = true;
  b.setGravityScale(0); b.getFixtureList().setFilterData(NO_HIT); b.setAwake(true);
}
/** back on the ground (or let go in mid-air): gravity and collisions as before */
function land(o) {
  const b = o.body; o.ai.poseSet = false;
  b.setGravityScale(TUNE.physics.FALL); b.getFixtureList().setFilterData(HIT_ALL); b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0); b.setAwake(true);
}

export default defineBehaviour('sev', 'pester', {
  pose: 'walk',
  up: true,
  enter(o, m) {
    const a = o.ai; a.vx = 0; a.gait = 'tiptoe';
    a.pe = { phase: 'go', from: pesterFrom(o) ?? moved(), n: 0, next: 0, turn: false, retort: false, off: [0, -PE.REACH_PX], prev: null, top: false };
    say(o, 'pester', true);
  },
  tick(o, m, dt) {
    const a = o.ai, pe = a.pe, P = pointer();
    if (pe.phase !== 'back' && (!P || moved() !== pe.from || isCrazy())) {   // you moved: it drops, says so (as soon as it may), and walks off
      if (pe.phase === 'hop') { land(o); a.up = true; }
      pe.phase = 'back'; pe.at = m.t; pe.said = false;
    }
    if (pe.phase === 'back') {
      a.vx = 0; a.hop = 0; if (!pe.said) pe.said = !!say(o, 'pesterBack', true);
      if (m.t - pe.at > PE.BACK_S * (pe.said ? 1 : 2)) set(o, 'walk');
      return;
    }
    if (m.t > PE.MAX_S) { set(o, 'walk'); return; }
    const b = o.body, p = b.getPosition(), cx = P[0] + scrollX, cy = P[1] + scrollY;
    if (pe.phase === 'go') {   // over to below your cursor
      const dx = cx - p.x * S, d = dx < 0 ? -1 : 1;
      if (Math.abs(dx) < PE.AT_PX) { pe.phase = 'wait'; pe.next = m.t + PE.LOOK_S; a.vx = 0; return; }
      if (m.t > PE.GO_S) { set(o, 'walk'); return; }   // it cannot get there
      head(a, d); a.gait = Math.abs(dx) > PE.FAR_PX ? 'scuttle' : 'tiptoe';
      a.vx = a.fd === d ? a.fd * GAIT[a.gait].speed : 0; a.wig = 0.03;
      return;
    }
    if (pe.phase === 'wait') {   // looking up at it, bouncing on its fingers, more and more impatient
      a.vx = 0; a.wig = 0.05 + 0.02 * Math.min(10, pe.n); a.hop = PE.BOUNCE * Math.abs(Math.sin(m.t * (5 + pe.n)));
      if (m.t >= pe.next) hop(o, m);
      return;
    }
    // 'hop': up to the cursor on an arc (flat at the top: it holds the poke a moment), poke, and back down to where it stood
    const u = clamp01((m.t - pe.at) / pe.dur), f = Math.min(1, Math.sin(Math.PI * u) * PE.FLAT), B = pe.base;
    const tip = o.hand.tip;   // last frame's drawing: at the top, where its fingertip was from its middle (then its middle goes where that puts the fingertip on the cursor)
    if (pe.top && tip && pe.prev) pe.off = [tip[0] - pe.prev[0], tip[1] - pe.prev[1]];
    const ty = Math.min(B.y - PE.MIN_UP_PX, cy - pe.off[1]), tx = cx - pe.off[0];
    const x = B.x + (tx - B.x) * f, y = B.y + (ty - B.y) * f, k = Math.min(1, f * 1.6), an = B.a + wrapA(-Math.PI / 2 - B.a) * k;   // fingers up (a somersault: it walks on them)
    b.setTransform({ x: x / S, y: y / S }, an); b.setLinearVelocity({ x: 0, y: 0 }); b.setAngularVelocity(0);
    pe.prev = [x - scrollX, y - scrollY]; pe.top = f >= 1;
    const hp = o.hand.pose, kp = 1 - Math.exp(-dt * 14);
    easePose(hp, PE.POSE, kp);
    a.wig = 0.08;
    if (u >= 0.5 && !pe.hit) {   // poke
      pe.hit = true; const n = pe.n + 1; pe.n = n; poked(o, n);
      if (pe.turn && !pe.retort) { pe.retort = true; say(o, 'pesterRetort', true); } else say(o, 'pesterPoke', n === 1);
      pe.turn = false; pe.next = m.t + pe.dur / 2 + PE.SOLO_S;   // alone, it goes again after a while; the arm's poke brings that forward
      bus.emit('sev.pestered', { hand: o, n });
    }
    if (u >= 1) { b.setTransform({ x: B.x / S, y: B.y / S }, B.a); land(o); a.up = true; pe.phase = 'wait'; }
  },
  leave(o, m) { const a = o.ai; if (a.pe && a.pe.phase === 'hop') land(o); a.hop = 0; a.poseSet = false; a.pe = null; },
});
export function install(app) {}
