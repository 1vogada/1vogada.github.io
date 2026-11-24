// The one clock, and the one frame loop.
//
// Game time: now() is legacy cardPhysics now(): performance.now() minus the time the tab spent hidden, frozen while hidden.
// Game timers (after / every / sleep / cooldown / scope) run on game time: they stop while the tab is hidden and go on
// where they were when it is shown again.
// Wall time: clock.real.* are plain browser timers (they keep running, throttled, while hidden). Legacy code that used a
// bare setTimeout (bubbles left at a page point, toasts, the Surprise me scene, the greeting) must use real.* to keep
// legacy behaviour while the tab is hidden; scope(name, { wall: true }) gives a scope on wall time.
//
// The frame loop is legacy frame() with its phases named (see README "Frame phases"):
//   if hidden: return (the loop resumes on return)
//   if no hasWork(): stop
//   ms = min(250, t - last); acc += ms / 1000
//   tick 'input'                      (autoscroll of a carried card)
//   while acc >= DT: step phases       pose, forces, joints, world, impacts, blasts, bodies
//   tick fx, blade, hand, severed, late   (legacy moveBits, bladeCuts, clawTick, sevTick)
//   busy = any keepAwake()
//   draw phases bodies, bubbles  with k = busy ? acc / DT : 1
//   busy ? next frame : stop
// Within a phase, callbacks run in registration order.
//
// No DOM access at import time: the browser globals are read when a function runs. createClock(env) builds an
// independent clock for tests.

import { TUNE } from './tune.js';
import { bus as defaultBus } from './bus.js';

export const GONE = new Error('gone');   // what a scope's pending sleep() rejects with when the scope ends (legacy GONE 'slip closed')

export const STEP_PHASES = ['pose', 'forces', 'joints', 'world', 'impacts', 'blasts', 'bodies'];
export const TICK_PHASES = ['input', 'fx', 'blade', 'hand', 'severed', 'late'];
export const DRAW_PHASES = ['bodies', 'bubbles'];

function browserEnv() {
  const g = globalThis;
  return {
    perf: () => g.performance.now(),
    setTimeout: (f, ms) => g.setTimeout(f, ms),
    clearTimeout: (h) => g.clearTimeout(h),
    setInterval: (f, ms) => g.setInterval(f, ms),
    clearInterval: (h) => g.clearInterval(h),
    raf: (f) => (g.requestAnimationFrame ? g.requestAnimationFrame(f) : g.setTimeout(() => f(g.performance.now()), 16)),
    caf: (h) => (g.cancelAnimationFrame ? g.cancelAnimationFrame(h) : g.clearTimeout(h)),
    hidden: () => !!(g.document && g.document.hidden),
  };
}

export function createClock(envIn, { bus = defaultBus, DT = TUNE.physics.DT, MAX_FRAME = TUNE.physics.MAX_FRAME_MS } = {}) {
  let envCache = envIn || null;
  const env = () => envCache || (envCache = browserEnv());
  let away = 0, hiddenAt = 0;

  // ---------------- game time ----------------
  const now = () => (hiddenAt || env().perf()) - away;
  const hidden = () => !!hiddenAt;
  const wall = () => env().perf();

  const timers = new Set();   // { due, ms, every, fn, h }
  const arm = (tm) => { if (hiddenAt || !timers.has(tm)) return; tm.h = env().setTimeout(() => fire(tm), Math.max(0, tm.due - now())); };
  const disarm = (tm) => { if (tm.h != null) { env().clearTimeout(tm.h); tm.h = null; } };
  function fire(tm) {
    tm.h = null;
    if (!timers.has(tm) || hiddenAt) return;
    if (tm.due - now() > 1) return arm(tm);   // woke early (the tab was hidden in between): wait for the rest
    if (tm.every) { tm.due += tm.ms; arm(tm); } else timers.delete(tm);
    tm.fn();
  }
  function add(ms, fn, every) {
    const tm = { due: now() + ms, ms, every, fn, h: null };
    timers.add(tm); arm(tm);
    return () => { if (timers.delete(tm)) disarm(tm); };
  }
  /** run fn once after ms of game time. @returns {() => void} cancel */
  const after = (ms, fn) => add(ms, fn, false);
  /** run fn every ms of game time. @returns {() => void} cancel */
  const every = (ms, fn) => add(Math.max(1, ms), fn, true);
  const sleep = (ms) => new Promise((res) => after(ms, res));
  /** a cooldown on game time: ready() once ms have passed since the last hit() */
  function cooldown(ms) {
    let last = -Infinity;
    return { ready: () => now() - last >= ms, hit: () => { last = now(); }, left: () => Math.max(0, ms - (now() - last)), reset: () => { last = -Infinity; } };
  }

  // ---------------- wall time ----------------
  const real = {
    after(ms, fn) { const h = env().setTimeout(fn, ms); return () => env().clearTimeout(h); },
    every(ms, fn) { const h = env().setInterval(fn, ms); return () => env().clearInterval(h); },
    sleep: (ms) => new Promise((res) => env().setTimeout(res, ms)),
  };

  // ---------------- scopes ----------------
  // Everything made through a scope dies with it. end() rejects every pending sleep with GONE and runs onEnd callbacks,
  // in the order they were registered (legacy handScene: my.kill() ran my.fails in push order).
  function scope(name, { wall: onWall = false } = {}) {
    const base = onWall ? real : { after, every };
    const cancels = new Set(), fails = [];
    const sc = {
      name, ended: false,
      after(ms, fn) { if (sc.ended) return () => {}; let c = null; const run = () => { cancels.delete(c); fn(); }; c = base.after(ms, run); cancels.add(c); return () => { if (cancels.delete(c)) c(); }; },
      every(ms, fn) { if (sc.ended) return () => {}; const c = base.every(ms, fn); cancels.add(c); return () => { if (cancels.delete(c)) c(); }; },
      sleep(ms) {
        return new Promise((res, rej) => {
          if (sc.ended) return rej(GONE);
          let c = null;
          fails.push(() => rej(GONE));
          c = base.after(ms, () => { cancels.delete(c); if (sc.ended) rej(GONE); else res(); });
          cancels.add(c);
        });
      },
      /** a bus listener that dies with the scope */
      on(type, fn) { const off = bus.on(type, fn); sc.onEnd(off); return off; },
      /** a DOM listener that dies with the scope */
      listen(target, type, fn, opts) { target.addEventListener(type, fn, opts); sc.onEnd(() => target.removeEventListener(type, fn, opts)); return () => target.removeEventListener(type, fn, opts); },
      onEnd(fn) { if (sc.ended) { fn(); return; } fails.push(fn); },
      end() {
        if (sc.ended) return;
        sc.ended = true;
        for (const c of [...cancels]) c();
        cancels.clear();
        for (const f of fails.splice(0)) f();
      },
    };
    return sc;
  }

  // ---------------- the frame loop ----------------
  const phases = (names) => Object.fromEntries(names.map((n) => [n, []]));
  const stepFns = phases(STEP_PHASES), tickFns = phases(TICK_PHASES), drawFns = phases(DRAW_PHASES);
  const works = [], awakes = [];
  let loopOn = false, last = 0, acc = 0, rafH = null;
  const reg = (table, names, phase, fn) => {
    if (!table[phase]) throw new Error(`clock: unknown phase "${phase}" (one of ${names.join(', ')})`);
    table[phase].push(fn);
    return () => { const a = table[phase], i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
  };
  const regList = (a, fn) => { a.push(fn); return () => { const i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); }; };
  /** fn() once per fixed DT step, in the named phase. @returns off */
  const onStep = (fn, phase = 'bodies') => reg(stepFns, STEP_PHASES, phase, fn);
  /** fn(dt, ms) once per frame, in the named phase ('input' runs before the steps, the rest after). @returns off */
  const onTick = (fn, phase = 'late') => reg(tickFns, TICK_PHASES, phase, fn);
  /** fn(k) once per frame after the ticks; k is the interpolation factor (1 when the loop is about to stop). @returns off */
  const onDraw = (fn, phase = 'bodies') => reg(drawFns, DRAW_PHASES, phase, fn);
  /** the loop may start, or run a frame, only while one of these returns true (legacy: objs.size || bits.length || clawBusy()) */
  const hasWork = (fn) => regList(works, fn);
  /** the loop asks for another frame only while one of these returns true (legacy end-of-frame busy check) */
  const keepAwake = (fn) => regList(awakes, fn);
  const any = (a) => { for (const f of a) if (f()) return true; return false; };

  function runStep() { for (const n of STEP_PHASES) for (const f of stepFns[n].slice()) f(); }
  function runTick(n, dt, ms) { for (const f of tickFns[n].slice()) f(dt, ms); }
  function frame(t) {
    rafH = null;
    if (hiddenAt) return;   // tab in the background: no stepping, no drawing. The loop is picked up again on return
    if (!any(works)) { loopOn = false; return; }
    const ms = Math.min(MAX_FRAME, t - (last || t)); last = t; acc += ms / 1000;
    const dt = ms / 1000;
    runTick('input', dt, ms);
    while (acc >= DT) { runStep(); acc -= DT; }
    for (const n of TICK_PHASES) if (n !== 'input') runTick(n, dt, ms);
    const busy = any(awakes);
    const k = busy ? acc / DT : 1;
    for (const n of DRAW_PHASES) for (const f of drawFns[n].slice()) f(k);
    if (busy) rafH = env().raf(frame); else loopOn = false;
  }
  /** legacy run(): start the loop if it is not running and there is work */
  function wake() { if (!loopOn && any(works)) { loopOn = true; last = 0; acc = 0; rafH = env().raf(frame); } }
  const running = () => loopOn;

  // ---------------- other animation-frame loops ----------------
  /** an independent per-frame loop (fog, kiri flood, band roll, the phrasebook raid, the coin). fn(t) returning false stops it. @returns cancel */
  function frames(fn) {
    let on = true;
    const tick = (t) => { if (!on) return; if (fn(t) === false) { on = false; return; } env().raf(tick); };
    env().raf(tick);
    return () => { on = false; };
  }
  /** fn(t) on the next animation frame. @returns cancel */
  function nextFrame(fn) { let on = true; env().raf((t) => { if (on) fn(t); }); return () => { on = false; }; }

  // ---------------- visibility ----------------
  /** legacy visibilitychange handler (install() wires it to the document; tests call it directly) */
  function visibility(isHidden) {
    if (isHidden) {
      if (!hiddenAt) { hiddenAt = env().perf(); for (const tm of timers) disarm(tm); }
      return;
    }
    if (!hiddenAt) return;
    away += env().perf() - hiddenAt; hiddenAt = 0;
    for (const tm of timers) arm(tm);
    if (loopOn) { last = 0; acc = 0; rafH = env().raf(frame); }   // start from this frame: the time away is not simulated
  }
  let installed = false;
  function install() {
    if (installed) return; installed = true;
    const doc = globalThis.document; if (!doc) return;
    if (doc.hidden) hiddenAt = env().perf();
    doc.addEventListener('visibilitychange', () => visibility(doc.hidden));
  }

  return {
    now, hidden, wall, after, every, sleep, cooldown, real, scope, GONE,
    onStep, onTick, onDraw, hasWork, keepAwake, wake, running, frames, nextFrame,
    visibility, install, DT,
    /** for tests: run one frame at rAF time t */
    _frame: frame,
  };
}

export const clock = createClock();
export const { now, hidden, wall, after, every, sleep, cooldown, real, scope, onStep, onTick, onDraw, hasWork, keepAwake, wake, running, frames, nextFrame } = clock;
export function install() { clock.install(); }
