// Surprise me and the omikuji slip (legacy: the surprise click with its slot-machine roll, FORTUNES, drawFortune,
// closeFortune, fitOmi, the secret × (pointermove near it, click), askHand, unpeek, omi-x / backdrop / Escape handlers). STUB.
// The hand asks the question itself: askHand() 700 ms after the slip opens (wall time), ask again after TIMING.wait.ask.
// install(app): listeners in legacy order: surprise click, visualViewport resize/scroll, document pointermove (secret),
// secret click, omi-x click, omi click, document keydown (Escape) — after the katana's keydown and before page/kiri.js keys.

const todo = (name) => () => { throw new Error(`fortune.${name}: not implemented`); };

/** legacy drawFortune(list, pick): one Math.random for the fortune, one more for a 末吉 line */ export const drawFortune = todo('drawFortune');
/** legacy closeFortune() */ export const closeFortune = todo('closeFortune');
/** legacy askHand() */ export const askHand = todo('askHand');
/** legacy unpeek() */ export const unpeek = todo('unpeek');
export function install(app) {}
