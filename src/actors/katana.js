// The katana: planted in the banner behind the fog, revealed by wiping, pulled out like a card, equipped by double-click
// (legacy katanaSvg, the reveal pointermove, plant, freeKatana, equip, putBack, the dblclick / Escape / sheathe handlers). STUB.
// install(app): creates .katana and .phys-actions (with the sheathe button) in legacy DOM order, registers its listeners
// (hero pointermove BEFORE page/fog.js registers its own), defineSpeaker('katana', { kinds: ['katana'], prefix: 'katana.',
// gate: 'card', quiet: TIMING.gap.katana, anchor }), own listeners: katana.dropped -> 'katana.drop' line,
// body.removed -> forget the body / setBlade(null), world.reset -> back in the banner.

const todo = (name) => () => { throw new Error(`katana.${name}: not implemented`); };

/** the drawing (legacy katanaSvg(id)); the phrasebook prints it too. @returns {string} SVG markup */
export const katanaSvg = todo('katanaSvg');
/** the planted, rooted body (legacy plant) */ export const plant = todo('plant');
/** torn out of the banner (legacy freeKatana): 'katana.hello', then emit 'katana.drawn' */ export const free = todo('free');
/** double-click: into the hand at a steady angle (legacy equip): 'katana.hello', then emit 'katana.equipped' */ export const equip = todo('equip');
/** back in the banner (legacy putBack): emits 'katana.sheathed' */ export const putBack = todo('putBack');
/** the katana body or null (legacy katObj) */ export const body = () => null;
/** out of the ground and in the world (legacy k9()) */ export const loose = () => false;
/** legacy say(katObj, 'kbrag', true) when it took the hand off */ export const brag = todo('brag');
export function install(app) {}
