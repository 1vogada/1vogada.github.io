// The per-step and per-frame work of the world, registered on core/clock.js phases (legacy step(), draw(), frame() body parts).
// STUB: the world package fills these in. install(app) registers:
//   clock.hasWork(() => world.bodies.size > 0)             (fx.js adds bits.length, the actors add their own busy checks)
//   clock.keepAwake(() => !!world.grab || any body root / die / say / awake)
//   onStep 'pose'    snapshot px, py, pa of every body
//   onStep 'forces'  root springs of rooted bodies (and the random shake torque of a slipping root, in body order)
//                    (the severed hand's leg spring registers in 'forces' too: legacy ran both in one loop over objs;
//                    no body is both, and forces add up, so the split keeps the random-draw order)
//   onStep 'joints'  grab.joint.setTarget(pointer + scroll)
//   onStep 'world'   b2.step(DT, 10, 6)
//   onStep 'bodies'  expire o.die, cool o.hot, the root's grip / strain line / tear / settle-and-remove
//   onTick 'input'   autoscroll while a carried card rests at the top or bottom edge
//   onDraw 'bodies'  transforms (held body drawn on the pointer, others interpolated), fade of dying bodies, then
//                    speech.ride(world.bodies, now) for the bubbles riding on them
export function install(app) {}
