// The kept coin in the arm's hand (chain coin-keep; page/coinbody.js makes the coin, kind 'coin'): take() is how the catch
// (behaviours/catch.js) and the shelf reach (behaviours/reach.js) hand it to 'bite' (behaviours/bite.js), which bites it and
// flicks it back. A plain helper, not a behaviour: catch.js and reach.js do not load the bite behaviour itself.
import { TUNE } from '../../core/tune.js';
import { world, pinJoint } from '../../world/world.js';
import { set } from './index.js';

const K = TUNE.coinKeep, P_ = TUNE.physics, H_ = TUNE.hand;

/** it closes its fingers on the coin o (w: its world centre, m; hy: the height it holds it at, viewport px) and goes to 'bite' */
export function take(c, o, w, hy) {
  o.hot = 0; o.body.setBullet(false);
  o.body.setAngularDamping(P_.HELD_SPIN); o.body.getFixtureList().setFilterData({ groupIndex: 0, categoryBits: 1 | K.LEDGE_BIT, maskBits: 0 }); o.el.style.pointerEvents = 'none';
  c.joint = pinJoint(o.body, { x: w.x, y: w.y }, H_.JOINT_HZ);
  c.hy = hy;
  set('bite');
}

export function install(app) {}
