// The hand raids the open menu after TIMING.wait.book (legacy raidArm, loadPlanck, raidStart, raidWalls, raidStop, raidSay,
// raidCrumbs, raidRip, raidSwat, intact, inView, raidBody, raidShatter, raidFrame, raidHand). Its own planck world in
// viewport px and its own clock (r.now: frame ms added only while visible, 250 ms clamp): speakers 'raidHand' / 'raidCard'
// with life: () => r.now, layout: false; 'raidScream' for sayAt. The arm is borrowed with hand.borrow(). STUB.
const todo = (name) => () => { throw new Error(`raid.${name}: not implemented`); };
export const start = todo('start');
export const stop = todo('stop');
/** force the next act: 'throw' | 'eat' | 'help' | 'scroll' */ export const next = todo('next');
export const state = () => null;
export function install(app) {}
