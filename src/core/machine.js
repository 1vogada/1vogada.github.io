// Behaviour tables made general (legacy SEV / sevSet, and the arm's clawSet).
//
// defineBehaviour(actor, name, { pose, busy = true, enter(self, m), tick(self, m, dt), leave(self, m), on: { 'event.type'(self, ev, m) {} }, ...anything })
//   Extra fields (like the severed hand's `up`) are kept on the definition: m.def.up.
// machine(actor, self, initial, { switched(self, m), entered(self, m), bus }) -> m
//   m.state, m.def, m.t (seconds in this state), m.data, m.busy (m.def.busy)
//   m.set(name, data): leave() of the old state, its `on` handlers unbound; state, def, t = 0, data switched;
//                      switched(); the new `on` handlers bound; enter(); entered(); then '<actor>.state' { self, from, to, data }
//                      is emitted (only if enter() did not switch again; the inner switch emitted its own).
//   initial state: switched(), handlers bound, enter(), and the state event with from: null. entered() is NOT run for the
//                  initial state (legacy sevSpawn called SEV.limp.enter only).
//   m.age(dt) adds dt to m.t; m.step(dt) runs tick(); m.tick(dt) does both (legacy sevTick does age, a held check, then step).
//   m.end(): leave() of the current state, handlers unbound (legacy sevGone). No event.
//   m.is(...names)
// `on` handlers run only while their state is current. ctx (the second argument everywhere) is m itself: keep per-instance
// scratch on self or on m.

import { bus as defaultBus } from './bus.js';

const tables = new Map();   // actor -> Map(name -> def)

export function defineBehaviour(actor, name, def = {}) {
  if (!tables.has(actor)) tables.set(actor, new Map());
  const t = tables.get(actor);
  if (t.has(name)) throw new Error(`machine: behaviour "${actor}.${name}" is defined twice`);
  const d = { name, busy: true, ...def };
  t.set(name, d);
  return d;
}
export const behaviours = (actor) => tables.get(actor) || new Map();
export const behaviour = (actor, name) => behaviours(actor).get(name);

export function machine(actor, self, initial, { switched, entered, bus = defaultBus } = {}) {
  const table = () => { const t = tables.get(actor); if (!t) throw new Error(`machine: no behaviours for "${actor}"`); return t; };
  let offs = [];
  const unbind = () => { for (const off of offs) off(); offs = []; };
  const bind = (d) => { if (d.on) for (const type of Object.keys(d.on)) offs.push(bus.on(type, (ev) => { if (m.def === d && !m.ended) d.on[type](self, ev, m); })); };
  const m = {
    actor, self, state: null, def: null, t: 0, data: null, ended: false,
    get busy() { return !!(m.def && m.def.busy); },
    is: (...names) => names.includes(m.state),
    set(name, data) {
      const d = table().get(name); if (!d) throw new Error(`machine: unknown behaviour "${actor}.${name}"`);
      const from = m.state;
      if (m.def && m.def.leave) m.def.leave(self, m);
      unbind();
      m.state = name; m.def = d; m.t = 0; m.data = data === undefined ? null : data;
      if (switched) switched(self, m);
      bind(d);
      if (d.enter) d.enter(self, m);
      if (entered) entered(self, m);
      if (m.state === name && m.def === d) bus.emit(actor + '.state', { self, from, to: name, data: m.data });
      return m;
    },
    age(dt) { m.t += dt; },
    step(dt) { if (m.def && m.def.tick) m.def.tick(self, m, dt); },
    tick(dt) { m.age(dt); m.step(dt); },
    end() { if (m.ended) return; if (m.def && m.def.leave) m.def.leave(self, m); unbind(); m.ended = true; },
  };
  const d = table().get(initial); if (!d) throw new Error(`machine: unknown behaviour "${actor}.${initial}"`);
  m.state = initial; m.def = d; m.t = 0;
  if (switched) switched(self, m);
  bind(d);
  if (d.enter) d.enter(self, m);
  if (m.state === initial && m.def === d) bus.emit(actor + '.state', { self, from: null, to: initial, data: null });
  return m;
}

export function install() {}
