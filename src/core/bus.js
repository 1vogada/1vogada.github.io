// The event bus. SYNCHRONOUS: emit() calls every matching listener before it returns, in registration order
// (exact and wildcard listeners share one order). A listener added during an emit is not called for that emit;
// one removed during an emit is not called if it has not run yet.
// Patterns: an exact type, 'card.*' (every type that starts with "card."), or '*'.
// Strict mode (debug, tests): emitting or listening to a type that is not in events.js throws.

import { EVENT_TYPES } from './events.js';

export function createBus({ strict = false, catalogue = EVENT_TYPES } = {}) {
  const list = [];   // { pattern, fn, live }
  const taps = [];
  const matches = (p, type) => p === type || p === '*' || (p.endsWith('.*') && type.startsWith(p.slice(0, -1)));
  const check = (type, wildOk) => {
    if (!bus.strict || !catalogue) return;
    if (wildOk && (type === '*' || type.endsWith('.*'))) return;
    if (!catalogue.has(type)) throw new Error(`bus: unknown event type "${type}" (add it to src/core/events.js)`);
  };
  const bus = {
    strict,
    /** @returns {() => void} off */
    on(type, fn) {
      check(type, true);
      const l = { pattern: type, fn, live: true };
      list.push(l);
      return () => { if (!l.live) return; l.live = false; const i = list.indexOf(l); if (i >= 0) list.splice(i, 1); };
    },
    once(type, fn) { const off = bus.on(type, (ev, t) => { off(); fn(ev, t); }); return off; },
    emit(type, payload) {
      check(type, false);
      for (const t of taps) t(type, payload);
      for (const l of list.slice()) if (l.live && matches(l.pattern, type)) l.fn(payload, type);
    },
    /** called for every emit before the listeners (?debug=events logs through this) */
    tap(fn) { taps.push(fn); return () => { const i = taps.indexOf(fn); if (i >= 0) taps.splice(i, 1); }; },
    count() { return list.length; },
  };
  return bus;
}

export const bus = createBus();
export const on = (type, fn) => bus.on(type, fn);
export const once = (type, fn) => bus.once(type, fn);
export const emit = (type, payload) => bus.emit(type, payload);

export function install() {}
