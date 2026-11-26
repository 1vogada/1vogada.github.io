// The hand tower: with three old hands on the page, all of them awake, on their feet and having met the new hand, and the arm
// lurking at the right edge, after a while they gather there and climb on top of each other: the bottom one braces on its
// wrist, fingers up, the next one climbs up and stands on its fingertips, the top one climbs highest and reaches. When the arm
// leans down to look (the arm's 'peer'), the top one takes it by the wrist and they all pull it out onto the page (the arm's
// 'pulled'), leaning back like a tug-of-war team, until it shakes them off (hand.shookOff -> shookOff()) and they land in a
// heap, dizzy. Knocked, picked up, or too slow: the tower comes down (tumble) and the arm goes back to what it was doing.
//
// This file keeps the tower: who stands where (place()), when the next one climbs, when it is over. The old hands' own parts
// are behaviours/gather.js (walk to its spot), tower.js (climb, then hold its place) and tumble.js (come down). The arm is sensed
// through senses() (lurks(), wrist()), wired in src/reactions.js. Off while window.__test.idle === false (the scenarios), so no
// existing golden can reach it; its random draws (lines, the fall) happen only here.
import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { clock } from '../../core/clock.js';
import { isFree } from '../../core/claims.js';
import { flags } from '../../core/debug.js';
import { world, isHeld, isCrazy, NO_HIT } from '../../world/world.js';
import { ground } from './gait.js';
import { list, brain, set, say, onRefuge, lurks, wrist } from './index.js';

const S = TUNE.physics.S, SV = TUNE.severed, TW = SV.TOWER, BW = SV.BODY.w;
const LEN = 2 * TW.STEP_PX + BW;   // from the bottom one's wrist to the top one's fingertips, all three up

let T = null;        // the tower: { hands: [bottom, middle, top], phase: gather | climb | reach | pull, B: [x, y] page px of the bottom one's wrist, n: hands up, at, born }
let since = null;    // game ms since when everything has been just right
let next = 0;        // not again before this (game ms)

/** the tower being built or pulling, or null */ export const tower = () => T;
/** o is in the tower (gathering, climbing, up or pulling) */ export const inTower = (o) => !!T && T.hands.includes(o);
/** o's place: 0 bottom, 1 middle, 2 top (or -1) */ export const tier = (o) => (T ? T.hands.indexOf(o) : -1);

const vw = () => document.documentElement.clientWidth;
const where = (o) => { const p = o.body.getPosition(); return [p.x * S, p.y * S]; };

/** up for it: awake, walking on its feet (not hurt), met the new hand, nobody holding it, not hunting, not on the shelf, in view */
function ready(o, t) {
  const a = o.ai, m = brain(o);
  if (!world.bodies.has(o) || !m || !m.is('walk') || !a.met || a.hunting || a.gait === 'crawl' || t < a.hurt || t < a.flee || isHeld(o) || !isFree(o) || onRefuge(o)) return false;
  const [x, y] = where(o), vx = x - scrollX, vy = y - scrollY;
  return vx > 0 && vx < vw() && vy > 0 && vy < innerHeight + SV.BODY.h;
}

/** where o belongs in the tower now: { x, y, a } page px and its angle (fingers along the tower, away from the bottom) */
export function place(o) {
  const i = tier(o); if (i < 0) return null;
  const [B, u] = line();
  const w = [B[0] + u[0] * TW.STEP_PX * i, B[1] + u[1] * TW.STEP_PX * i], sway = Math.sin(clock.now() / 1000 * TW.WOBBLE_W + i * 0.7) * TW.WOBBLE * (i + 1);
  return { x: w[0] + u[0] * BW / 2, y: w[1] + u[1] * BW / 2, a: Math.atan2(u[1], u[0]) + (T.phase === 'pull' ? 0 : sway) };
}
/** the line the tower stands on: [the bottom one's wrist, the way up (a unit vector)], page px */
function line() {
  if (T.phase !== 'pull') return [T.B, [0, -1]];
  // pulling: the top one's fingertips are on the arm's grip G; the bottom one digs in on the floor LEN away, to the left, and
  // they lean back along that line (hanging off the arm if it is too high for their feet to reach the floor)
  const r = wrist(); if (r) T.G = [r.grip[0] + scrollX, r.grip[1] + scrollY];
  const G = T.G, dy = T.floor - G[1], F = [G[0] - Math.sqrt(Math.max(0, LEN * LEN - dy * dy)), T.floor];
  const d = Math.hypot(G[0] - F[0], G[1] - F[1]) || 1, u = [(G[0] - F[0]) / d, (G[1] - F[1]) / d];
  return [[G[0] - u[0] * LEN, G[1] - u[1] * LEN], u];
}
/** the top one's fingertips, page px */
function tip() { const [B, u] = line(); return [B[0] + u[0] * LEN, B[1] + u[1] * LEN]; }

function start(t, hands) {
  hands.sort((p, q) => where(q)[0] - where(p)[0]);   // the one nearest the edge braces, the furthest climbs highest
  const bx = scrollX + vw() - TW.EDGE_PX;
  T = { hands, phase: 'gather', B: [bx, null], floor: null, n: 0, at: t, born: t, asked: 0 };
  for (const o of hands) { o.ai.there = false; set(o, 'gather'); }
  say(hands[0], 'towerCall', true);
  bus.emit('sev.towerGather', { hands: [...hands] });
}

/** it is over: the hands still in it come down (tumble); flung: shaken off by the arm. Emits 'sev.towerFell' unless shaken off */
function end(why, flung) {
  const was = T; if (!was) return;
  T = null; since = null; next = clock.now() + TW.COOL_MS;
  let first = true;
  for (const o of was.hands) {
    const m = brain(o); if (!world.bodies.has(o) || !m || !m.is('gather', 'tower')) continue;
    o.ai.flung = !!flung; o.ai.heap = flung && first; o.ai.fell = !flung && first; first = false;
    m.set('tumble');
  }
  if (!flung) bus.emit('sev.towerFell', { why });
}

/** the arm shook them off (reactions: hand.shookOff): they fly, and land in a heap */
export function shookOff() { if (T && T.phase === 'pull') end('shaken', true); }

/** once a frame, before the hands think (from tick() in ./index.js) */
export function towerTick(dt) {
  const t = clock.now();
  if (!T) {
    if (list.size !== SV.MAX || t < next || !flags().idle || isCrazy() || !lurks()) { since = null; return; }
    const hands = [...list]; if (!hands.every((o) => ready(o, t))) { since = null; return; }
    if (since == null) since = t;
    if (t - since > TW.WAIT_MS) start(t, hands);
    return;
  }
  // anything wrong: one of them was picked up, knocked off (it left its state), is gone, or it takes too long
  for (const o of T.hands) { const m = brain(o); if (!list.has(o) || !world.bodies.has(o) || !m || !m.is('gather', 'tower')) { end(m && m.is('held') ? 'held' : 'knocked'); return; } }
  if (isCrazy()) { end('gone'); return; }
  const arm = wrist();
  if (T.phase === 'gather' || T.phase === 'climb') {
    if (t - T.born > TW.BUILD_S * 1000) { end('slow'); return; }
    const [b0] = T.hands;
    if (T.phase === 'gather') {
      if (!b0.ai.there) return;
      const y = where(b0)[1], g = ground(T.B[0], y);
      T.floor = (g ?? y + b0.ai.hh * S) - 2; T.B[1] = T.floor;
      T.phase = 'climb'; T.n = 1; T.at = t; set(b0, 'tower');
      return;
    }
    const up = T.hands[T.n - 1], nx = T.hands[T.n];
    if (brain(up).t < TW.CLIMB_S + TW.BRACE_S) return;
    if (!nx) { T.phase = 'reach'; T.at = t; say(up, 'towerReach', true); return; }
    if (nx.ai.there) { T.n++; set(nx, 'tower'); }
    return;
  }
  if (T.phase === 'reach') {
    if (!arm || arm.is('stump', 'regrow', 'off')) { end('gone'); return; }   // no hand to grab
    if (t - T.at > TW.REACH_S * 1000) { end('bored'); return; }   // (busy with something else, it may still come back to lurk in time)
    const [px, py] = tip();
    if (arm.is('lurk') && lurks() && t >= T.asked) { T.asked = t + TW.ASK_MS; bus.emit('sev.tower', { hand: T.hands[2], x: px, y: py }); }   // up here! the arm leans in to look
    if (arm.is('peer') && arm.t > TW.GRAB_AFTER_S && Math.hypot(arm.grip[0] + scrollX - px, arm.grip[1] + scrollY - py) < TW.GRAB_PX) {
      T.phase = 'pull'; T.at = t; T.G = [arm.grip[0] + scrollX, arm.grip[1] + scrollY];
      for (const o of T.hands) o.body.getFixtureList().setFilterData(NO_HIT);   // hanging on: nothing on the page knocks them now
      say(T.hands[2], 'towerPull', true);
      bus.emit('sev.towerGrab', { hand: T.hands[2], hands: [...T.hands] });
    }
    return;
  }
  if (!arm || !arm.is('pulled')) { end('gone'); return; }   // T.phase 'pull': the arm got away some other way
  if (t - T.at > TW.HEAVE_MS) { const o = T.hands[Math.floor((t - T.at) / TW.HEAVE_MS) % 3]; say(o, 'towerPull'); }   // heave! (unforced: the gate keeps it to now and then)
}

export function install(app) {}
