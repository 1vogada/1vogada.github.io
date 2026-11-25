// Pointer input on bodies (legacy: hold, carry, drop, the grid pointerdown, onMove, startPull trigger, touch, click capture,
// dragstart, the loose-body pointerdown). STUB.
// Listener registration order is part of the contract (install registers them in legacy order):
//   grid pointerdown (press), window pointermove (onMove), window pointerup + pointercancel (drop), window touchmove (passive: false),
//   document click (capture: swallow the click after a drag), document dragstart, document pointerdown (pick up a loose body).
// A press that travels TUNE.drag.MOVE_PX on an armed grid card calls the handler set with onPull (the cards actor's startPull).

const todo = (name) => () => { throw new Error(`drag.${name}: not implemented`); };

/** the cards actor registers startPull(press, e) here */
export const onPull = todo('onPull');
/** see world.js hold */ export const hold = todo('hold');
/** see world.js drop */ export const drop = todo('drop');
/** see world.js carry */ export const carry = todo('carry');
export function install(app) {}
