// Impacts (legacy onContact, shatter, the blast shove). STUB.
// begin-contact queues hits into world.hits and shoves into world.blasts; the 'impacts' step drains hits (shatter) and the
// 'blasts' step applies the shoves. A soft hit over TUNE.physics.LAND says 'card.land' on each card (gate: card).
// shatter(h): pieces, a pass-on to touching cards, sayAt(x, y + TUNE.shatter.SAY_DY, 'card.smash'), emit 'card.smashed'
// (legacy notice('smash') point), remove(o), shake #projects, toasts at 1 and 10 smashed (via 'ui.toast').

const todo = (name) => () => { throw new Error(`shatter.${name}: not implemented`); };

/** the begin-contact listener (legacy onContact) */ export const onContact = todo('onContact');
/** break a card from the impact point (legacy shatter). h: { o, pt, n, closing, share, v, w, vo } */ export const shatter = todo('shatter');
export function install(app) {}
