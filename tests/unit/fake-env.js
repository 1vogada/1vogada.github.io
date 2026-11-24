// A fake time source for core/clock.js: perf() is a number we move by hand, timers fire when advance() passes them,
// requestAnimationFrame callbacks run on frame().
export function fakeEnv() {
  let t = 1000, seq = 0, hidden = false;
  const timers = new Map();   // id -> { at, fn, every }
  const rafs = [];
  const env = {
    perf: () => t,
    setTimeout: (fn, ms) => { const id = ++seq; timers.set(id, { at: t + Math.max(0, ms), fn, seq: id }); return id; },
    clearTimeout: (id) => { timers.delete(id); },
    setInterval: (fn, ms) => { const id = ++seq; timers.set(id, { at: t + ms, fn, every: ms, seq: id }); return id; },
    clearInterval: (id) => { timers.delete(id); },
    raf: (fn) => { rafs.push(fn); return rafs.length; },
    caf: () => {},
    hidden: () => hidden,
  };
  return {
    env,
    get now() { return t; },
    setHidden(h) { hidden = h; },
    /** move time forward by ms, firing due timers in time order (then creation order) */
    advance(ms) {
      const end = t + ms;
      for (;;) {
        let next = null;
        for (const [id, x] of timers) if (x.at <= end && (!next || x.at < next[1].at || (x.at === next[1].at && x.seq < next[1].seq))) next = [id, x];
        if (!next) break;
        const [id, x] = next;
        t = Math.max(t, x.at);
        if (x.every) x.at += x.every; else timers.delete(id);
        x.fn();
      }
      t = end;
    },
    /** run one animation frame at the current time (after moving ms) */
    frame(ms = 16) { this.advance(ms); const fs = rafs.splice(0); for (const f of fs) f(t); return fs.length; },
    pendingFrames: () => rafs.length,
  };
}
// a seeded Math.random (mulberry32)
export function seeded(seed) {
  let a = seed >>> 0;
  return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let x = Math.imul(a ^ (a >>> 15), 1 | a); x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x; return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
}
