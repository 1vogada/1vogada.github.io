// "No": the hand smashes Yes/No, snaps in Heads/Tails, tosses a coin, makes you call it, swats your first try, and presses
// Yes for you when you lose (legacy handScene(back) with makeBtns, the smash, turn, fly, hover, poke, the call clock, myPick,
// go, the result and the Yes press; noBtn / goBtn handlers; swatsLeft; sessionStorage 'kiripad-sent'). STUB.
// Every wait is a scene sleep (wall time); every bubble goes through core/speech (hand.say, sayIn for the new buttons:
// the two btnhi picks are drawn up front with two Math.random, exactly as legacy, and passed as opts.text).

const todo = (name) => () => { throw new Error(`coin.${name}: not implemented`); };

/** legacy handScene(back) */ export const handScene = todo('handScene');
/** legacy swatsLeft (welcome-back sets it to 0) */ export const setSwats = todo('setSwats');
export function install(app) {}
