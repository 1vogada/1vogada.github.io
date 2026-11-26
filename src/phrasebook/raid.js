// The hand raids the open menu (legacy scripts/phrasebook.js: TM, LINGER, HELP_WAIT, GAP, ASK_GAP, talk, S DT GRAV FALL SMASH
// GRIP, raid, armT, armed, pick, clamp, raidArm, loadPlanck, raidStart, raidWalls, raidStop, raidSay, raidCrumbs, raidRip,
// raidSwat, intact, inView, raidBody, raidShatter, raidFrame, raidHand). Moved verbatim:
//  - stay in the menu TIMING.wait.book ms (counted on a wall-time 250 ms tick, only while the tab is visible) and the hand
//    comes in, picks one of four things to do, again and again: throw a line at the left edge, eat one, hold one out for you
//    to help rip, or yank the scroll
//  - its own planck world in viewport px (numbers in TUNE.raid) and its OWN clock, r.now: the frame's ms (clamped to 250) are
//    added only while the tab is visible (README legacy trap 5). Its bubbles live on that clock: speakers 'raidHand' and
//    'raidCard' with life () => raid.now and layout: false (placed here every frame); the smash scream is sayAt 'raidScream'
//    (wall-time removal, like the legacy setTimeout)
//  - the arm is borrowed with hand.borrow() (legacy c.st = 'book') and given back with c.st = 'off' + hand.set('lurk')
//  - DOM elements are picked with the shared picker (core/lines pick: one draw from Math.random, legacy window.__pick)
//  - speak(key, text): phrase-say (./say.js) has the raiding hand say a line you picked in the menu, while it is in
import { TUNE, TIMING } from '../core/tune.js';
import { clock } from '../core/clock.js';
import { pick } from '../core/lines.js';
import { defineSpeaker, say, sayAt, hush, expire } from '../core/speech.js';
import * as menu from './menu.js';

let app = null;
/** legacy window.__hand (absent under reduced motion) */
const hand = () => (app && !app.reduced && app.hand && app.hand.awake() ? app.hand : null);   // no raid before the hand has shown itself on the page
// every wait and bubble time comes from the page's one table (TIMING)
const TM = TIMING, LINGER = TM.wait.book, HELP_WAIT = TM.wait.help / 1000, GAP = TM.gap.raid, ASK_GAP = TM.gap.raidAsk;
const R = TUNE.raid, { S, DT, GRAV, FALL, SMASH, GRIP } = R, TICK = R.ARM_TICK_MS;
let raid = null, armT = null, armed = 0;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const unarm = () => { if (armT) armT(); armT = null; };
export function raidArm() {   // counts only the time the menu is really in front of someone
  unarm(); armed = 0; if (!hand()) return;
  armT = clock.real.every(TICK, () => { if (!menu.isOpen()) return unarm(); if (!document.hidden) armed += TICK; if (armed >= LINGER) { unarm(); raidStart(); } });
}
function loadPlanck() { return window.planck ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = new URL('../../vendor/planck-1.4.2.min.js', import.meta.url).href; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
export async function raidStart() {
  const H = hand(); if (!H || !menu.isOpen() || raid) return;
  unarm();
  const r = raid = { st: 'wait', t: 0, now: 0, objs: new Set(), bits: [], hits: [], thrown: 0, broken: 0, last: 0, acc: 0, target: null, held: null, say: null, said: -1e9, mood: 'slow', fury: 0, swats: 0, act: null, lastAct: null, force: null, pull: null, bouts: 0, eaten: 0, ripped: 0, acts: [] };
  try { await loadPlanck(); } catch (e) { raid = null; return; }
  if (raid !== r || !menu.isOpen()) return;
  const pl = window.planck;
  r.layer = document.createElement('div'); r.layer.className = 'pb-fly'; document.body.appendChild(r.layer);
  // the drawn hand takes no clicks (it is one big SVG over the window), so a patch that follows it does: click it and the hand is swatted
  r.swat = document.createElement('button'); r.swat.type = 'button'; r.swat.className = 'pb-swat'; r.swat.tabIndex = -1; r.swat.setAttribute('aria-label', 'Swat the hand away'); r.layer.appendChild(r.swat);
  r.swat.addEventListener('pointerdown', (e) => { e.preventDefault(); raidSwat(e.clientX, e.clientY); });
  r.world = new pl.World({ gravity: { x: 0, y: GRAV } }); r.ground = r.world.createBody(); r.walls = [];
  r.world.on('begin-contact', (c) => {   // the world is locked in here: the hit is only noted, and the card is broken after the step
    const fa = c.getFixtureA(), fb = c.getFixtureB(), wall = fa.getBody() === r.ground ? fa : fb.getBody() === r.ground ? fb : null; if (!wall) return;
    const o = (wall === fa ? fb : fa).getBody().getUserData(); if (!o || o.kind !== 'card' || o.hit) return;
    const n = wall.getUserData(), v = o.body.getLinearVelocity(), closing = -(v.x * n[0] + v.y * n[1]); if (closing < SMASH) return;
    const wm = c.getWorldManifold(null), pt = wm && wm.points && wm.points[0], p = o.body.getPosition();
    o.hit = true; r.hits.push({ o, n, x: pt ? pt.x : p.x, y: pt ? pt.y : p.y, vx: v.x, vy: v.y, w: o.body.getAngularVelocity() });
  });
  raidWalls(); addEventListener('resize', raidWalls);
  clock.frames(raidFrame);
}
function raidWalls() {
  const r = raid; if (!r || !r.world) return; const pl = window.planck, w = document.documentElement.clientWidth / S, h = innerHeight / S, T = 5;
  for (const f of r.walls) r.ground.destroyFixture(f);
  const box = (cx, cy, hw, hh, n) => { const f = r.ground.createFixture({ shape: new pl.Box(hw, hh, { x: cx, y: cy }, 0), friction: 0.8 }); f.setUserData(n); return f; };
  r.walls = [box(-T, h / 2, T, h * 3, [1, 0]), box(w + T, h / 2, T, h * 3, [-1, 0]), box(w / 2, h + T, w, T, [0, -1])];
  for (const o of r.objs) o.body.setAwake(true);
}
export function raidStop() {
  unarm(); const r = raid; if (!r) return; raid = null;
  removeEventListener('resize', raidWalls);
  if (r.layer) r.layer.remove();
  if (r.c) {   // the hand goes back to whatever it was doing on the page
    const c = r.c, H = hand(); c.under.classList.remove('pb-raid'); c.over.classList.remove('pb-raid');
    c.x = document.documentElement.clientWidth + 340; c.pose = { ...H.POSES.lurk }; c.a = Math.PI; H.draw(0, 0, 0); c.st = 'off'; if (r.prev !== 'off') H.set('lurk');   // A2: given back with set('lurk')
  }
}
// legacy raidSay(pick(LIST), o, floor): the line is picked (one draw), then the bubble made (one draw for its tilt). A card's
// bubble is o.say, the hand's is raid.say (and raid.said = raid.now); both live on the raid's own clock.
// floor: a key of TIMING.floor for a line that wants longer than its length gives
function raidSay(key, o, floor) { say(o || raid, key, { as: o ? 'raidCard' : 'raidHand', floor: floor || (o ? null : 'hand') }); }
function raidCrumbs(x, y, n, dir) {
  const r = raid;
  for (let i = 0; i < n; i++) { const e = document.createElement('div'); e.className = 'pb-bit'; const sz = 3 + Math.random() * 5; e.style.width = e.style.height = sz + 'px'; r.layer.appendChild(e); const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 350; r.bits.push({ el: e, x, y, vx: dir * (120 + Math.random() * 380) + Math.cos(a) * sp * 0.5, vy: Math.sin(a) * sp * 0.6 - 260, life: 0.5 + Math.random() * 0.5, t: 0 }); }
}
// the two of you have pulled the card apart: your half drops, the hand keeps its own
function raidRip() {
  const r = raid, o = r.held, pl = window.planck, w = o.w, h = o.h, n = 7, tear = [];
  for (let i = 0; i <= n; i++) tear.push([w / 2 + (i % 2 ? 9 : -9) + (Math.random() - 0.5) * 8, h * i / n]);
  const pts = (a) => a.map((q) => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(',');
  const lel = o.el.cloneNode(true); lel.classList.remove('pb-offer'); lel.style.clipPath = `polygon(0px 0px,${pts(tear)},0px ${h}px)`; lel.style.boxShadow = 'none'; r.layer.appendChild(lel);
  o.el.classList.remove('pb-offer'); o.el.style.clipPath = `polygon(${w}px 0px,${pts(tear)},${w}px ${h}px)`; o.el.style.boxShadow = 'none';
  const ca = Math.cos(o.a), sa = Math.sin(o.a), st = o.st || 0, lx = o.x - st * ca, ly = o.y - st * sa;   // your half is where you had pulled it to
  const piece = raidBody({ kind: 'piece', el: lel, w, h, die: r.now + 3600 }, lx / S, ly / S, o.a, new pl.Box(w / 4 / S, h / 2 / S, { x: -w / 4 / S, y: 0 }, 0), { filterGroupIndex: -1 });
  piece.body.setLinearVelocity({ x: -7 - Math.random() * 4, y: -5 }); piece.body.setAngularVelocity(-2 - Math.random() * 3);
  raidCrumbs(o.x - st / 2, o.y, 14, -0.3); raidCrumbs(o.x - st / 2, o.y, 8, 0.3);
  o.st = 0; r.pull = null; r.ripped++;
  raidSay('hand.rip', null, 'rip');
  const card = menu.q('.pb-card'); card.classList.remove('pb-jolt'); void card.offsetWidth; card.classList.add('pb-jolt');
}
function raidSwat(x, y) {
  const r = raid; if (!r || !r.c || r.st === 'swat' || r.st === 'done') return;
  if (r.target) r.target.classList.remove('pb-tug');
  if (r.held) {   // what it was holding just drops
    const o = r.held, pl = window.planck; r.held = null; o.st = 0; o.el.classList.remove('pb-offer'); raidBody(o, o.x / S, o.y / S, o.a, new pl.Box(o.w / 2 / S, o.h / 2 / S));
    o.body.setLinearVelocity({ x: -2 - Math.random() * 3, y: -3 }); o.body.setAngularVelocity((Math.random() - 0.5) * 5); o.born = r.now;
    raidSay('card.land', o);
  }
  const ring = document.createElement('div'); ring.className = 'pb-slap'; ring.style.left = x + 'px'; ring.style.top = y + 'px'; r.layer.appendChild(ring); clock.real.after(400, () => ring.remove());
  r.act = null; r.pull = null; r.grabbed = false; r.bouts = 0; r.swats++; r.away = 5 + Math.random() * 2.5; r.st = 'swat'; r.t = 0; raidSay('raid.swat');
}
const intact = () => [...menu.scroller.querySelectorAll('.pb-entry:not(.pb-gone), .pb-fig:not(.pb-gone)')];
function inView(e) { const a = e.getBoundingClientRect(), b = menu.scroller.getBoundingClientRect(), mid = (a.top + a.bottom) / 2; return mid > b.top + 30 && mid < b.bottom - 30; }
function raidBody(o, x, y, a, shape, opt) {
  const r = raid; o.body = r.world.createBody({ type: 'dynamic', position: { x, y }, angle: a, linearDamping: 0.05, angularDamping: 0.5, bullet: true });
  o.body.createFixture({ shape, density: 1, friction: 0.7, restitution: 0.1, ...opt }); o.body.setGravityScale(FALL); o.body.setUserData(o);
  o.px = x; o.py = y; o.pa = a; r.objs.add(o); return o;
}
// the card breaks from the point where it struck: a web of cracks fanned out from there, every piece a body of its own
function raidShatter(h) {
  const r = raid, o = h.o, pl = window.planck, b = o.body, pos = b.getPosition(), ang = b.getAngle(), hw = o.w / 2, hh = o.h / 2;
  const lp = b.getLocalPoint({ x: h.x, y: h.y }), P = [clamp(lp.x * S, -hw + 4, hw - 4), clamp(lp.y * S, -hh + 4, hh - 4)];
  const rim = [], edge = (x0, y0, x1, y1) => { const n = 1 + Math.round(Math.hypot(x1 - x0, y1 - y0) / 110); rim.push([x0, y0]); for (let i = 0; i < n; i++) { const f = (i + 0.25 + Math.random() * 0.5) / n; rim.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]); } };
  edge(-hw, -hh, hw, -hh); edge(hw, -hh, hw, hh); edge(hw, hh, -hw, hh); edge(-hw, hh, -hw, -hh);
  const ring = rim.map((q) => { const f = 0.3 + Math.random() * 0.3; return [P[0] + (q[0] - P[0]) * f, P[1] + (q[1] - P[1]) * f]; });
  const polys = []; for (let i = 0; i < rim.length; i++) { const j = (i + 1) % rim.length; polys.push([P, ring[i], ring[j]], [ring[i], rim[i], rim[j], ring[j]]); }
  const area = (p) => { let a = 0; p.forEach((q, i) => { const n = p[(i + 1) % p.length]; a += q[0] * n[1] - n[0] * q[1]; }); return a / 2; };
  const vn = h.vx * h.n[0] + h.vy * h.n[1], bx = h.vx - 1.3 * vn * h.n[0], by = h.vy - 1.3 * vn * h.n[1], ca = Math.cos(ang), sa = Math.sin(ang);
  hush(o);
  r.world.destroyBody(b); r.objs.delete(o); r.broken++;
  for (let p of polys) {
    const A = area(p); if (Math.abs(A) < 90) continue; if (A < 0) p = [...p].reverse();
    let ok = true; p.forEach((q, i) => { const n = p[(i + 1) % p.length]; if (Math.hypot(q[0] - n[0], q[1] - n[1]) < 3) ok = false; }); if (!ok) continue;
    const shape = new pl.Polygon(p.map((q) => ({ x: q[0] / S, y: q[1] / S }))); if (shape.m_count !== p.length) continue;   // planck quietly makes a box out of a bad outline
    const elp = o.el.cloneNode(true); elp.style.clipPath = `polygon(${p.map((q) => `${(q[0] + hw).toFixed(1)}px ${(q[1] + hh).toFixed(1)}px`).join(',')})`; elp.style.boxShadow = 'none'; r.layer.appendChild(elp);
    const cx = p.reduce((s2, q) => s2 + q[0], 0) / p.length - P[0], cy = p.reduce((s2, q) => s2 + q[1], 0) / p.length - P[1], cl = Math.hypot(cx, cy) || 1, push = (3 + Math.random() * 7) * Math.max(0.3, 1 - cl / 400);
    const ox = (cx * ca - cy * sa) / cl, oy = (cx * sa + cy * ca) / cl;
    const piece = raidBody({ kind: 'piece', el: elp, w: o.w, h: o.h, die: r.now + 3200 + Math.random() * 2600 }, pos.x, pos.y, ang, shape, { filterGroupIndex: -1 });
    piece.body.setLinearVelocity({ x: bx * (0.25 + Math.random() * 0.5) + ox * push, y: by * (0.25 + Math.random() * 0.5) + oy * push - 2 }); piece.body.setAngularVelocity(h.w * 0.4 + (Math.random() - 0.5) * 14);
  }
  o.el.remove();
  const vw = document.documentElement.clientWidth, X = clamp(h.x * S, 0, vw), Y = clamp(h.y * S, 0, innerHeight);
  for (let i = 0; i < 16; i++) { const e = document.createElement('div'); e.className = 'pb-bit'; const sz = 3 + Math.random() * 5; e.style.width = e.style.height = sz + 'px'; r.layer.appendChild(e); const a = Math.random() * Math.PI * 2, sp = 200 + Math.random() * 700; r.bits.push({ el: e, x: X, y: Y, vx: h.n[0] * (200 + Math.random() * 500) + Math.cos(a) * sp * 0.6, vy: h.n[1] * 300 + Math.sin(a) * sp * 0.6 - 200, life: 0.6 + Math.random() * 0.6, t: 0 }); }
  sayAt(clamp(X, 90, vw - 90), clamp(Y - 60, 12, innerHeight - 50), 'card.smash', { as: 'raidScream' });   // removed after its reading time, wall time
  const card = menu.q('.pb-card'); card.classList.remove('pb-jolt'); void card.offsetWidth; card.classList.add('pb-jolt');
}
function raidFrame(t) {
  const r = raid; if (!r) return false;
  const ms = Math.min(250, t - (r.last || t)); r.last = t; const dt = ms / 1000;
  if (!document.hidden) {
    r.now += ms; r.acc += dt;
    while (r.acc >= DT) { for (const o of r.objs) { const p = o.body.getPosition(); o.px = p.x; o.py = p.y; o.pa = o.body.getAngle(); } r.world.step(DT, 10, 6); r.acc -= DT; for (const h of r.hits.splice(0)) if (r.objs.has(h.o)) raidShatter(h); }
    raidHand(dt);
    const k = r.acc / DT;
    for (const o of r.objs) {
      const p = o.body.getPosition(), x = (o.px + (p.x - o.px) * k) * S, y = (o.py + (p.y - o.py) * k) * S, a = o.pa + (o.body.getAngle() - o.pa) * k;
      o.el.style.transform = `translate(${(x - o.w / 2).toFixed(2)}px, ${(y - o.h / 2).toFixed(2)}px) rotate(${a.toFixed(4)}rad)`;
      if (o.say && expire(o, r.now)) o.say.el.style.translate = `calc(${clamp(x, 70, innerWidth - 70).toFixed(0)}px - 50%) ${clamp(y - o.h / 2 - 36, 8, innerHeight - 40).toFixed(0)}px`;
      if (o.die && r.now > o.die) { o.el.style.opacity = Math.max(0, 1 - (r.now - o.die) / 500).toFixed(2); if (r.now > o.die + 500) { hush(o); o.el.remove(); r.world.destroyBody(o.body); r.objs.delete(o); } }
      else if (o.kind === 'card' && !o.hit && !o.die && r.now > o.born + R.CARD_TTL_MS) o.die = r.now;   // one that somehow never broke does not lie around for ever
    }
    for (let i = r.bits.length - 1; i >= 0; i--) { const b = r.bits[i]; b.t += dt; b.vy += 2100 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.t > b.life) { b.el.remove(); r.bits.splice(i, 1); } else b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${(b.t * 9).toFixed(2)}rad)`; }
  }
}
// the hand's own little state machine while it is in the menu
function raidHand(dt) {
  const r = raid, H = hand(), vw = document.documentElement.clientWidth, vh = innerHeight, G = GRIP, P = H.POSES;
  if (!r.c) {   // it finishes whatever it was doing on the page first
    const c = H.get(); if ((c.st !== 'off' && c.st !== 'lurk' && c.st !== 'sulk' && c.st !== 'gloat') || c.o || c.joint) return;
    r.c = c; r.prev = c.st; H.borrow(); c.under.classList.add('pb-raid'); c.over.classList.add('pb-raid');
    c.x = vw + 340; c.y = c.ly = vh * 0.5; c.sh = c.y + 70; c.a = Math.PI; c.pose = { ...P.lurk }; r.st = 'enter'; r.t = 0;
  }
  const c = r.c; c.st = 'book'; r.t += dt;
  const set = (st) => { r.st = st; r.t = 0; }, end = (rest) => { if (r.mood === 'slow' && r.act !== 'scroll') r.mood = 'normal'; r.act = null; r.rest = rest; set('rest'); }, wristFor = (Hc, a) => { const ca = Math.cos(a), sa = Math.sin(a); return [Hc[0] - G[0] * ca - G[1] * sa, Hc[1] - G[0] * sa + G[1] * ca]; };
  const grip = () => { const ca = Math.cos(c.a), sa = Math.sin(c.a); return [c.x + G[0] * ca + G[1] * sa, c.y + G[0] * sa - G[1] * ca]; };
  let T = [vw + 30, c.ly], aim = Math.PI, pose = P.eager, rate = 7, wig = 0.12, shake = 0, strain = 0, vmax = 1e9;
  const angry = r.mood === 'angry', slow = r.mood === 'slow';
  const tr = r.target && r.target.isConnected ? r.target.getBoundingClientRect() : null;
  const hold = tr ? [Math.min(tr.right - 30, vw - 60), clamp((tr.top + tr.bottom) / 2, 70, vh - 70)] : null;
  if (r.st === 'enter') { wig = 0.34; T = [vw + 10, vh * 0.5]; if (r.t > 0.5 && r.said < 0) raidSay('raid.bored'); if (r.t > 1.7) set('pick'); }
  else if (r.st === 'pick') {
    const all = intact(), seen = all.filter(inView);
    if (!all.length) { set('done'); raidSay('raid.done'); }
    else if (!r.act) {   // what now? one of four things, never the same twice running
      const max = menu.scroller.scrollHeight - menu.scroller.clientHeight, opts = ['throw', 'eat', 'help', 'scroll'].filter((a) => a !== r.lastAct && (a !== 'scroll' || max > 40));
      r.act = r.force || (angry ? 'throw' : opts[Math.floor(Math.random() * opts.length)]); r.force = null; r.lastAct = r.act; r.acts.push(r.act); r.t = 0;
    }
    else if (r.act === 'scroll') set('scroll');
    else if (seen.length) { r.target = pick(seen); r.scrolling = false; set('reach'); }
    else if (r.t > 0.4 && !r.scrolling) { const e = all[0], sr = menu.scroller.getBoundingClientRect(), er = e.getBoundingClientRect(); menu.scroller.scrollTo({ top: Math.max(0, menu.scroller.scrollTop + er.top - sr.top - 60), behavior: 'smooth' }); r.scrolling = true; }   // nothing left on screen: it turns the page for you
    else if (r.t > 1.6) { r.scrolling = false; r.t = 0; }
  } else if (r.st === 'reach') {
    if (!tr || !inView(r.target)) set('pick');
    else {   // the first time, and when it comes back wary, it creeps: fingers out, a little at a time. Otherwise it just goes for it
      pose = slow ? P.eager : P.lunge; rate = angry ? 28 : 16; if (slow) { vmax = 150; wig = 0.3; aim = Math.PI + Math.sin(r.t * 2.6) * 0.07; }
      T = wristFor(hold, Math.PI); c.ly = hold[1]; const g = grip();
      if (Math.hypot(g[0] - hold[0], g[1] - hold[1]) < 18) { r.target.classList.add('pb-tug'); set('grip'); } else if (r.t > (slow ? 12 : 1.5)) set('pick');
    }
  } else if (r.st === 'grip') {   // it has it by the edge and the card does not want to come out
    if (!tr) set('pick');
    else {
      const gt = angry ? 0.25 : slow ? 0.9 : 0.55; strain = clamp(r.t / (gt - 0.05), 0, 1); pose = {}; for (const k in P.clamp) pose[k] = P.clamp[k] + (P.strain[k] - P.clamp[k]) * strain;
      rate = 30; shake = 1 + 3 * strain; T = wristFor([hold[0] + 26 * strain, hold[1]], aim);
      if (r.t > gt) {
        const e = r.target, el2 = e.cloneNode(true); el2.classList.remove('pb-tug'); if (e.closest('.pb-sec-hand')) el2.classList.add('pb-sec-hand');
        el2.style.width = tr.width + 'px'; el2.style.height = tr.height + 'px'; r.layer.appendChild(el2);
        e.classList.remove('pb-tug'); e.classList.add('pb-gone');
        const g = grip(), cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
        r.held = { kind: 'card', el: el2, w: tr.width, h: tr.height, off: [g[0] - cx, g[1] - cy], x: cx, y: cy, a: 0, vx: 0, vy: 0 };
        r.y0 = hold[1]; raidSay('card.rip', r.held);
        if (r.act === 'eat') set('eat');
        else if (r.act === 'help') {   // it holds the card out: take the other end and pull
          const o = r.held; o.st = 0; el2.classList.add('pb-offer');
          el2.addEventListener('pointerdown', (e) => { if (raid !== r || r.held !== o || r.st !== 'offer') return; e.preventDefault(); try { el2.setPointerCapture(e.pointerId); } catch (x) {} r.pull = { x0: e.clientX, dx: 0 }; });
          el2.addEventListener('pointermove', (e) => { if (r.pull && r.held === o) r.pull.dx = Math.max(0, r.pull.x0 - e.clientX); });
          const up = () => { if (r.held === o) r.pull = null; }; el2.addEventListener('pointerup', up); el2.addEventListener('pointercancel', up);
          set('offer');
        } else set('wind');
      }
    }
  } else if (r.st === 'wind') {   // back it goes, cocked over its shoulder
    pose = P.clamp; rate = 9; aim = Math.PI + 0.95; T = wristFor([vw - 90, clamp(r.y0 - 60, 110, vh - 110)], aim);
    if (r.t > 0.2 && r.now - r.said > GAP) raidSay('raid.bored');
    if (r.t > (angry ? 0.4 : 0.62)) set('throw');
  } else if (r.st === 'throw') {   // and the whip forward: the card leaves the fingers with the speed they had
    rate = 34; aim = Math.PI - 0.3; T = wristFor([vw - 420, clamp(r.y0 + 10, 110, vh - 110)], aim); pose = r.held ? P.clamp : P.lunge;
    if (r.held && r.t > 0.085) {
      const o = r.held, pl = window.planck; r.held = null;
      let vx = o.vx / S, vy = o.vy / S, sp = Math.hypot(vx, vy); if (vx > -0.8 * sp || sp < 1) { vx = -0.98; vy = -0.2; sp = 1; }
      const v = clamp(sp, 34, 52); vx = vx / sp * v; vy = Math.min(vy / sp * v, -2);
      raidBody(o, o.x / S, o.y / S, o.a, new pl.Box(o.w / 2 / S, o.h / 2 / S));
      o.body.setLinearVelocity({ x: vx, y: vy }); o.body.setAngularVelocity((Math.random() - 0.5) * 9); o.born = r.now; r.thrown++;
      raidSay('card.throw', o);
    }
    if (r.t > 0.5) {
      if (angry && --r.fury <= 0) r.mood = 'normal';
      if (angry && r.fury > 0 && Math.random() < 0.3) { r.act = 'scroll'; set('scroll'); } else end(angry ? 0.12 : 0.5 + Math.random() * 0.9);   // it got one: no more creeping
    }
  } else if (r.st === 'offer') {   // "help me rip this": it holds the card out by one end and waits for you to take the other
    const o = r.held; if (!o) end(0.3);
    else {
      const need = Math.min(150, o.w * 0.45), want = r.pull ? Math.min(r.pull.dx, need + 30) : 0; o.st += (want - o.st) * (1 - Math.exp(-dt * (r.pull ? 40 : 12)));
      strain = clamp(o.st / need, 0, 1); pose = {}; for (const k in P.clamp) pose[k] = P.clamp[k] + (P.strain[k] - P.clamp[k]) * strain;
      rate = 10; wig = 0.2; shake = r.pull ? 1 + 3 * strain : 0;
      const gx = clamp(vw * 0.5 + o.w / 2, Math.min(o.w + 24, vw - 70), vw - 70) + (r.pull ? 0 : Math.sin(r.t * 3.2) * 9) - o.st * 0.2;
      T = wristFor([gx, clamp(r.y0, 110, vh - 110)], aim);
      if (!r.pull && r.t > 0.3 && (!o.asked || r.now - r.said > ASK_GAP) && r.t < HELP_WAIT - 1) { o.asked = true; raidSay('raid.help', null, 'help'); }
      if (r.pull && o.st >= need) { raidRip(); set('eat'); }
      else if (!r.pull && r.t > HELP_WAIT) { o.st = 0; o.el.classList.remove('pb-offer'); raidSay('raid.alone'); r.act = 'throw'; set('wind'); }
    }
  } else if (r.st === 'eat') {   // it drags the card off the right edge of the screen, to where its mouth must be
    const o = r.held; if (!o) end(0.4);
    else {
      pose = P.clamp; wig = 0.2;
      if (r.t < 0.55) { rate = 20; T = [c.x, c.y]; } else { rate = 6; vmax = 260 + 520 * Math.min(1, (r.t - 0.55) / 0.5); T = wristFor([vw + o.w + 160, clamp(r.y0, 110, vh - 110)], aim); }
      if (o.x - o.w / 2 > vw + 4 || r.t > 4.5) {
        hush(o); o.el.remove(); r.held = null; r.eaten++; r.y0 = clamp(o.y, 90, vh - 90);
        raidSay('hand.eat', null, 'eat'); set('chew');
      }
    }
  } else if (r.st === 'chew') {   // crumbs come flying back in
    pose = P.joy; wig = 0.3; shake = 2.5; rate = 9; T = [vw + 40, r.y0]; c.ly = r.y0;
    r.crumb = (r.crumb || 0) + dt; if (r.crumb > 0.13 && r.t < 1.1) { r.crumb = 0; raidCrumbs(vw - 4, r.y0 + (Math.random() - 0.5) * 60, 2, -1); }
    if (r.t > 1.4) end(0.4 + Math.random() * 0.6);
  } else if (r.st === 'hide') {   // it was never here
    pose = P.lurk; rate = 11; wig = 0.02; T = [vw + 420, c.ly]; if (r.t > r.hide) end(0.3);
  } else if (r.st === 'rest') { pose = P.joy; wig = 0.2; T = [vw + 20, c.ly]; if (r.t > r.rest) set('pick'); }
  else if (r.st === 'swat') {   // swatted: it snatches itself back out of the window and nurses its knuckles for at least five seconds
    pose = P.sulk; rate = 13; shake = r.t < 0.35 ? 7 : 0; aim = Math.PI - 0.5; T = [vw + 400, clamp(c.ly - 30, 80, vh - 80)]; wig = 0.02;
    if (r.t > r.away) {
      if (Math.random() < 0.5) { r.mood = 'slow'; raidSay('raid.grudge'); set('pick'); }
      else { r.mood = 'angry'; r.fury = 3; raidSay('raid.angry'); if (Math.random() < 0.65) { r.act = r.lastAct = 'scroll'; r.acts.push('scroll'); } set('pick'); }
    }
  } else if (r.st === 'scroll') {   // it takes the right edge of the menu like a scrollbar and yanks the page about
    const sr = menu.scroller.getBoundingClientRect(), max = menu.scroller.scrollHeight - menu.scroller.clientHeight, top = sr.top + 40, span = Math.max(1, sr.height - 80);
    if (max < 40) { r.act = null; set('pick'); }
    else if (!r.grabbed) {
      pose = P.lunge; rate = 20; const hp = [Math.min(sr.right - 6, vw - 20), top + span * menu.scroller.scrollTop / max]; T = wristFor(hp, aim); c.ly = hp[1];
      const g = grip(); if (Math.hypot(g[0] - hp[0], g[1] - hp[1]) < 22 || r.t > 0.9) { r.grabbed = true; r.t = 0; r.dur = 2 + Math.random() * 2; r.s0 = menu.scroller.scrollTop / max; r.ph = Math.random() * 6; r.scrolled = (r.scrolled || []); r.t0 = r.now; raidSay('raid.scroll'); }
    } else {
      const f = clamp(r.s0 + 0.42 * Math.sin(r.t * 8 + r.ph) * Math.min(1, r.t * 3) + 0.12 * Math.sin(r.t * 23), 0, 1);
      pose = P.clamp; rate = 40; shake = 2; T = wristFor([Math.min(sr.right - 6, vw - 20), top + span * f], aim); menu.scroller.scrollTop = f * max;
      if (r.t > r.dur) {   // three seconds, give or take one. Then it either goes on, or lets go and hides
        r.scrolled.push(Math.round(r.now - r.t0));
        if (!angry && r.bouts < 2 && Math.random() < 0.5) { r.bouts++; r.t = 0; r.t0 = r.now; r.dur = 2 + Math.random() * 2; r.s0 = f; r.ph = Math.PI - r.ph; raidSay('raid.more'); }
        else { r.grabbed = false; r.bouts = 0; if (angry) end(0.2); else { r.hide = 2.5 + Math.random() * 2; raidSay('raid.hide', null, 'hide'); set('hide'); } }
      }
    }
  }
  else if (r.st === 'done') { pose = P.sulk; rate = 3; T = [vw + (r.t > 1.6 ? 340 : 60), vh * 0.5]; wig = 0.02; }
  const k = 1 - Math.exp(-dt * rate), ka = 1 - Math.exp(-dt * (rate > 20 ? 30 : 9)), kp = 1 - Math.exp(-dt * (r.st === 'reach' || r.st === 'throw' ? 30 : 12));
  let mx = (T[0] - c.x) * k, my = (T[1] - c.y) * k; const ml = Math.hypot(mx, my), cap = vmax * dt; if (ml > cap) { mx *= cap / ml; my *= cap / ml; }
  c.x += mx; c.y += my; c.a += (aim - c.a) * ka; c.sh += (c.y + 70 - c.sh) * (1 - Math.exp(-dt * 4));
  for (const key in pose) c.pose[key] += (pose[key] - c.pose[key]) * kp;
  if (r.held) {   // the card is pinned in the fingers: it goes where the grip goes and turns with the wrist
    const o = r.held, g = grip(), th = c.a - Math.PI, ca = Math.cos(th), sa = Math.sin(th), x = g[0] - (o.off[0] * ca - o.off[1] * sa), y = g[1] - (o.off[0] * sa + o.off[1] * ca);
    if (dt > 0) { o.vx = (x - o.x) / dt; o.vy = (y - o.y) / dt; } o.x = x; o.y = y; o.a = th;
    const st = o.st || 0; o.el.style.transform = `translate(${(x - o.w / 2 - st / 2).toFixed(2)}px, ${(y - o.h / 2).toFixed(2)}px) rotate(${th.toFixed(4)}rad)` + (st > 0.5 ? ` scaleX(${(1 + st / o.w).toFixed(4)})` : '');
    if (o.say && expire(o, r.now)) o.say.el.style.translate = `calc(${clamp(x, 70, vw - 70).toFixed(0)}px - 50%) ${clamp(y - o.h / 2 - 36, 8, vh - 40).toFixed(0)}px`;
  }
  if (r.say && expire(r, r.now)) { const g = grip(); r.say.el.style.translate = `calc(${clamp(Math.min(c.x, g[0]) - 30, 80, vw - 90).toFixed(0)}px - 50%) ${clamp(Math.min(c.y, g[1]) - 115 - (r.held && r.held.say ? 44 : 0), 10, vh - 50).toFixed(0)}px`; }
  {   // the patch that takes the swatting click sits over the palm and fingers, wherever they are
    const g = grip(), hx = (c.x + g[0]) / 2, hy = (c.y + g[1]) / 2, on = r.st !== 'swat' && r.st !== 'done' && hx < vw + 40;
    r.swat.style.display = on ? '' : 'none'; if (on) r.swat.style.transform = `translate(${(hx - 95).toFixed(0)}px, ${(hy - 80).toFixed(0)}px)`;
  }
  H.draw(wig, shake, strain);
}

/** legacy raidStart (window.__phrasebook.raid): the hand comes in now, if the menu is open */
export const start = raidStart;
/** phrase-say (./say.js): the raiding hand, when it is in the menu (not swatted away), says text now. @returns the bubble element or null */
export function speak(key, text) { const r = raid; if (!r || !r.c || r.st === 'swat') return null; const s = say(r, key, { as: 'raidHand', floor: 'hand', text }); return s ? s.el : null; }
/** force the next act: 'throw' | 'eat' | 'help' | 'scroll' (legacy __phrasebook.next) */
export function next(a) { if (raid) raid.force = a; }
/** the raid part of legacy __phrasebook.state(), or null */
export const state = () => raid && { act: raid.act, acts: raid.acts, eaten: raid.eaten, ripped: raid.ripped, scrolled: raid.scrolled, held: raid.held && [raid.held.x, raid.held.y, raid.held.w, raid.held.h], st: raid.st, mood: raid.mood, swats: raid.swats, hand: raid.c && [raid.c.x, raid.c.y], objs: raid.objs.size, thrown: raid.thrown, broken: raid.broken, gone: menu.scroller.querySelectorAll('.pb-gone').length };

export function install(a) {
  app = a;
  const layer = () => raid && raid.layer, life = () => (raid ? raid.now : 0);
  // legacy raidSay: 'pb-say hand' / 'pb-say', tilt 4 + up to 4 degrees, appended to the raid's layer, placed by raidHand / raidFrame
  defineSpeaker('raidHand', { kinds: [], cls: 'pb-say hand', gate: 'plain', layer, life, layout: false });
  defineSpeaker('raidCard', { kinds: [], cls: 'pb-say', gate: 'plain', layer, life, layout: false });
  // legacy raidShatter's scream: no tilt draw
  defineSpeaker('raidScream', { kinds: [], cls: 'pb-say scream', gate: 'plain', tilt: false, layer, layout: false });
}
