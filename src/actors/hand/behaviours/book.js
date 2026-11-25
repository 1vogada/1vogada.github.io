// hand state "book": borrowed by the phrasebook (borrow(), or the raid writing c.st = 'book'): the tick returns before anything
// else (legacy clawTick `if (isCrazy() || c.st === 'book') return;`), and the phrasebook poses and draws it itself.
import { defineBehaviour } from '../../../core/machine.js';

export default defineBehaviour('hand', 'book', {
  pose: 'lurk',
  borrowed: true,   // the hand's tick leaves it alone
  uncut: true,
  tick(c, m, dt) {},
});
export function install(app) {}
