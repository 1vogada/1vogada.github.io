// The stage, part "Old hands": see ../index.js and ./index.js for the act format, ../rig.js for the ghost pointer.
// The cut-off hands (src/actors/severed/): every behaviour in severed/behaviours/ is played by at least one act here. They need
// the world and the floor of the page: each act scrolls to the bottom first and drops its old hands there (r.oldHand).
// The visitor's still pointer matters to them (a gift, the poke): acts that do not want it send the pointer off the page first
// (away()), the way a mouse leaving the window does.
import { TUNE } from '../../core/tune.js';
import { clock } from '../../core/clock.js';
import { world, S, isCrazy } from '../../world/world.js';
import { cooled } from '../../actors/severed/tower.js';

const SV = TUNE.severed;

// ---- local helpers ----
/** the state an old hand is in (null once it is gone) */
const st = (app, o) => { const m = app.severed.brain(o); return m && app.severed.list.has(o) ? m.state : null; };
/** the pointer leaves the page (no gift, no poke from a still mouse) */
const away = () => document.documentElement.dispatchEvent(new PointerEvent('pointerleave'));
/** change a value for this act only */
function tweak(r, obj, key, v) { const was = obj[key]; obj[key] = v; r.after(() => { obj[key] = was; }); }
/** the world, scrolled to the floor of the page. @returns { W, H } page px */
async function floor(r) { await r.world(); await r.toBottom(); return world.size; }
/** an old hand dropped at page x (a share of the width, or px when > 1), a little above the floor */
async function drop(r, fx, dy = 260) { const { W, H } = world.size; return r.oldHand(fx > 1 ? fx : W * fx, H - dy); }
/** wait until fn() is truthy (at most max ms), or the act fails: what it was waiting for did not happen */
async function need(r, fn, max) { const v = await r.until(fn, max); if (!v) throw new Error('it did not happen: ' + String(fn).replace(/^\(\) => /, '')); return v; }
/** scroll so that body o is in view, low in the window (crazy mode lays the page out anew, and it moves the floor) */
async function see(r, o) { await r.scrollTo(r.pos(o)[1] - innerHeight * 0.7); }
/** over the hurt of the cut: up on its fingers at once (else it drags itself along for 7.5 s) */
const healed = (o) => { o.ai.hurt = 0; };
/** the arm out at the right edge, lurking; full (it eats nobody) unless told otherwise */
async function lurk(r, app, full = true) {
  await r.awake(); app.hand.set('lurk');
  const c = app.hand.get();
  c.fullUntil = full ? clock.now() + 1e9 : 0; r.after(() => { c.fullUntil = 0; });   // (not still full from an act before)
  return c;
}
/** the arm's state */
const arm = (app) => { const m = app.hand.brain(); return m ? m.state : null; };
/** a loose card put down at page (px, py) (it falls from there). quiet: the arm is not woken by it (it would eye the card) */
async function cardAt(r, i, px, py, quiet) {
  const o = await r.loose(i);
  if (quiet) world.ripped.clear();
  o.body.setTransform({ x: px / S, y: py / S }, 0); o.body.setLinearVelocity({ x: 0, y: 0 }); o.body.setAngularVelocity(0); o.body.setAwake(true);
  clock.wake();
  return o;
}
/** the ghost takes hold of a body by its middle. @returns where the ghost is */
async function grab(r, o) {
  for (let k = 0; k < 4; k++) {   // (it may have moved on while the ghost came over: aim again)
    await r.glide(...r.at(o)); const [x, y] = r.at(o); await r.move(x, y); await r.down();
    if (world.grab && world.grab.o === o) return [x, y];
    await r.up(); await r.wait(60);
  }
  throw new Error('the ghost could not get hold of it');
}
/** the ghost lets go where it is and moves off a little (so it does not pick it up again) */
async function letGo(r) { await r.up(); await r.glide(r.x - 40, r.y - 120); }
/** Math.random pinned to v for the length of fn (an act forcing a random branch) */
async function pinned(r, v, fn) {
  const R = Math.random; Math.random = () => v; r.after(() => { Math.random = R; });
  try { return await fn(); } finally { Math.random = R; }
}
/** a few quick passes of the ghost round a circle (the eyes follow a circling mouse) */
async function circle(r, cx, cy, rad, turns = 2, n = 24) {
  for (let k = 0; k <= turns * n; k++) { const a = k / n * 2 * Math.PI; await r.move(cx + rad * Math.cos(a), cy + rad * Math.sin(a), 22); }
}

/** it sits down to sleep (rest), eased down: the drop off its tiptoes is quick enough to count as a knock, and would wake it */
async function sitDown(r, app, o) {
  const d0 = o.body.getLinearDamping(); o.body.setLinearDamping(20); r.after(() => { if (world.bodies.has(o)) o.body.setLinearDamping(d0); });
  o.ai.tired = 0;
  await need(r, () => st(app, o) === 'rest', 2000);
  await r.wait(300); await r.until(() => o.body.getLinearVelocity().length() < 0.03, 3000);
  o.body.setLinearDamping(d0);
}
/** the secret shelf comes out (the ghost types tana), low on the page: within reach of the old hands on the floor */
async function shelfOut(r, app) {
  await pinned(r, 0.99, async () => { await r.type('tana', 90); await r.wait(120); });   // (its height is the one random draw)
  r.after(() => { if (app.shelf.state()) app.shelf.toggle(); });
  return need(r, () => app.shelf.state(), 2000);
}
/** three old hands near the right edge, over the cut, that have met the new hand, and the arm lurking (full): the hand tower comes */
async function tower(r, app, ready) {
  away(); await floor(r);
  tweak(r, TUNE.rps, 'CHANCE', 0);
  const { W } = world.size, hs = [];
  for (const x of [W - 230, W - 370, W - 510]) { const o = await drop(r, x, 300); healed(o); o.ai.met = true; hs.push(o); }
  await need(r, () => hs.every((o) => st(app, o) === 'walk'), 6000);
  for (const o of hs) app.handOld.meet(o);
  await lurk(r, app);
  cooled();   // (after a tower they rest two minutes before the next)
  await need(r, () => app.severed.tower(), 15000);
  if (ready) { await need(r, () => app.severed.tower() && app.severed.tower().phase === 'climb', 15000); await r.glide(innerWidth - 330, innerHeight - 260); }   // the ghost gets ready to pick one off
  await need(r, () => app.severed.tower() && app.severed.tower().phase === 'reach', 25000);
  return hs;
}

export const PART = {
  id: 'old', title: 'Old hands',
  intro: 'Hands that were cut off, and live on.',
  acts: [
    { id: 'old-walk', title: 'It falls limp, gets up and walks about',
      how: 'Cut the arm\'s hand off with the katana: it drops, twitches, drags itself along on two fingers, then strolls on tiptoe and turns round.',
      shortcut: 'The stage drops an old hand on the floor, and heals its cut after a few seconds of crawling (really 7.5 s).',
      async play(r, app) {
        away(); await floor(r);
        const o = await drop(r, 0.5, 340);
        await need(r, () => st(app, o) === 'walk', 6000);   // limp, rise: crawling, still hurt
        await r.wait(3200);
        healed(o);
        await need(r, () => o.ai.gait !== 'crawl', 3000);
        await r.wait(3000);
        o.ai.turn = 0;   // it turns round
        await r.wait(3000);
      } },

    { id: 'old-held', title: 'Pick it up: it wriggles and complains',
      how: 'Press an old hand and carry it about; let go and it drops limp, then gets up again.',
      async play(r, app) {
        away(); await floor(r);
        const o = await drop(r, 0.45, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000); await r.wait(800);
        const [x, y] = await grab(r, o);
        await r.line(x, y, x - 120, y - 260, 30);
        await r.path([[x - 150, y - 250], [x - 100, y - 270], [x - 140, y - 245], [x - 110, y - 265]], 120);
        await r.wait(2200);
        await letGo(r);
        await need(r, () => st(app, o) === 'walk', 5000);
        await r.wait(800); away();
      } },

    { id: 'old-thrown', title: 'Throw it across the page',
      how: 'Pick an old hand up and fling it: it shouts on the way, lands limp, and gets up.',
      async play(r, app) {
        away(); await floor(r);
        const o = await drop(r, 0.7, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000); await r.wait(500);
        const [x, y] = await grab(r, o);
        await r.line(x, y, x + 40, y - 120, 12);
        await r.wait(1200);
        await r.throwTo([x + 40, y - 120], [x - 520, y - 380], { n: 5 });
        await r.glide(r.x, r.y + 140); away();
        await need(r, () => st(app, o) === 'limp', 3000);
        await need(r, () => st(app, o) === 'walk', 6000);
      } },

    { id: 'old-cap', title: 'Three is a crowd: a fourth and the oldest bursts',
      how: 'Cut off a fourth hand while three old ones are about: the oldest goes pop.',
      shortcut: 'The stage drops the hands; for real each is a hand cut off the arm.',
      async play(r, app) {
        away(); await floor(r);
        const first = await drop(r, 0.25, 300); await r.wait(700);
        await drop(r, 0.45, 300); await r.wait(700);
        await drop(r, 0.65, 300); await r.wait(1600);
        const [x, y] = r.at(first); await r.glide(x, y - 80); await r.wait(500); away();   // that one
        await drop(r, 0.82, 300);
        if (app.severed.list.has(first)) throw new Error('the oldest is still there');
        await r.wait(2500);
      } },

    { id: 'old-rest', title: 'It gets tired and has a sit down',
      how: 'Leave an old hand to walk about: after a while it sits down with its eye shut, and gets up again after a few seconds.',
      shortcut: 'Time is skipped: really it walks 14-23 s before it tires, and sleeps 7-14 s.',
      async play(r, app) {
        away(); await floor(r);
        const o = await drop(r, 0.5, 300); healed(o);
        o.ai.stroll = 'tiptoe';   // (a hand scuttling by is too quick to sit down at once)
        await need(r, () => st(app, o) === 'walk', 6000); await r.wait(1500);
        // it sits down: eased down (the drop off its tiptoes is quick enough to count as a knock, and it would be up again at once)
        await sitDown(r, app, o);
        await r.wait(4000);
        o.ai.wake = 0; clock.wake();   // (asleep, it keeps nothing awake)
        await need(r, () => st(app, o) === 'walk', 3000);
        await r.wait(1000);
      } },

    { id: 'old-paint', title: 'Left alone, it finger-paints a word',
      how: 'Leave an old hand alone for two minutes: it writes something on the floor in its own blood, and admires it.',
      shortcut: 'Time is skipped: really nobody touches it for two minutes.',
      async play(r, app) {
        away(); await floor(r);
        const o = await drop(r, 0.5, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000); await r.wait(600);
        o.ai.alone = clock.now() - SV.PAINT.MS - 1;
        await need(r, () => st(app, o) === 'paint', 2000);
        const el = o.ai.paint && o.ai.paint.el; if (el) r.after(() => el.remove());
        await need(r, () => st(app, o) !== 'paint', 8000);
        await r.wait(1500);
      } },

    { id: 'old-crush', title: 'It hunts a card down and crushes it',
      how: 'Drop a card near an old hand: it stalks it, climbs on and squeezes until the card is gone, then does a little dance.',
      shortcut: 'The stage puts a torn-out card down next to it.',
      async play(r, app) {
        away(); await floor(r);
        const { H } = world.size;
        const o = await drop(r, 0.4, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000);
        await cardAt(r, 0, r.pos(o)[0] + o.ai.fd * 260, H - 260, true); away();   // in front of it
        await need(r, () => st(app, o) === 'crush', 12000);
        await need(r, () => st(app, o) === 'gloat', 6000);
        await need(r, () => st(app, o) === 'walk', 4000);
        await r.wait(500);
      } },

    { id: 'old-gift', title: 'Like a cat with a mouse: it brings you the card, crumpled',
      how: 'Rest your mouse on the page while an old hand crushes a card: it brings you a ball of it and waits at your feet.',
      shortcut: 'The stage puts a torn-out card down next to it.',
      async play(r, app) {
        away(); await floor(r);
        const { H } = world.size;
        const o = await drop(r, 0.4, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000);
        const d = o.ai.fd;
        await cardAt(r, 0, r.pos(o)[0] + d * 260, H - 260, true);   // in front of it
        await r.glide(innerWidth * (d > 0 ? 0.2 : 0.75), innerHeight - 330);   // the mouse rests there, behind it
        await need(r, () => st(app, o) === 'gift', 15000);
        await need(r, () => o.ai.given != null, 12000);
        await r.wait(1600);
        await r.glide(r.x + 30, r.y - 20); away();
        await r.wait(1500);
      } },

    { id: 'old-stare', title: 'The new hand and the old one look at each other',
      how: 'With an old hand about, let the arm grow a new hand: it leans out to look, and the old one stops and stares back.',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0);
        const o = await drop(r, 0.68, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000);
        await lurk(r, app);
        await need(r, () => arm(app) === 'meet', 9000);
        await need(r, () => st(app, o) === 'stare', 2000);
        await r.until(() => st(app, o) !== 'stare', 5000);
        await r.wait(1000);
      } },

    { id: 'old-rps', title: 'Rock, paper, scissors with the new hand',
      how: 'When the new hand first meets an old one, now and then they settle it: three pumps of the fist and show. Type r, p or s during the count to coach the old hand.',
      shortcut: 'The stage makes this meeting one that ends in a game (really one in two).',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 1);
        const o = await drop(r, 0.6, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000);
        await lurk(r, app);
        await need(r, () => st(app, o) === 'rps', 14000);
        let n = 0; const tips = ['p', 's', 'r'];
        r.after(() => {});   // (nothing to undo: the game cleans up after itself)
        while (st(app, o) === 'rps' && n < 3) { await r.wait(2400); await r.key(tips[n++ % 3]); }
        await r.until(() => st(app, o) !== 'rps' && arm(app) !== 'show', 15000);
        await r.wait(1500);
      } },

    { id: 'old-mirror', title: 'The mirror game: it copies the new hand',
      how: 'When the arm is out on the page with nothing to do (sulking, say), an old hand that has met it sits up and copies its every pose a beat late; circle the mouse and both their eyes follow it.',
      shortcut: 'The stage has them met already, brings the arm out and puts it through its poses.',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0);
        const o = await drop(r, 0.55, 300); healed(o); o.ai.met = true;
        await need(r, () => st(app, o) === 'walk', 6000);
        app.handOld.meet(o);
        await lurk(r, app); await r.wait(1200);
        // the arm comes out and shows off a few poses (a scene's come / to): the old hand follows a beat late
        const [ox, oy] = r.at(o);
        await app.hand.come(innerWidth - 200, oy - 230, 'eager');
        await need(r, () => st(app, o) === 'mirror', 5000);
        await r.wait(1600);
        for (const pose of ['point', 'clamp', 'joy', 'lunge', 'sulk', 'eager']) { app.hand.to({ pose }); await r.wait(1200); }
        await circle(r, ox - 160, oy - 280, 120, 2);   // round in circles: both of them watch the mouse
        await r.wait(600);
        app.hand.leave(); away();
        await r.wait(1500);
      } },

    { id: 'old-caught', title: 'The new hand goes for it: save it!',
      how: 'Leave a fresh old hand lying near the right edge: the new hand grabs it to eat it, and it flails and begs. Pull it out of the arm\'s grip to save it.',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0);
        const { W } = world.size;
        const o = await drop(r, W - 190, 200);
        await lurk(r, app, false);
        await need(r, () => st(app, o) === 'caught' && app.hand.get().joint, 14000);
        await r.wait(900);
        const [x, y] = await grab(r, o);
        await r.wait(700);
        await r.line(x, y, x - 520, y - 100, 24);
        await r.wait(800);
        await letGo(r); away();
        await r.wait(2500);
      } },

    { id: 'old-funeral', title: 'A small funeral',
      how: 'When the new hand eats an old one, the others walk over to where it was dragged off, bow, say a few words, and run.',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0);
        const { W } = world.size;
        const mourner = await drop(r, 0.3, 300); healed(mourner);
        const o = await drop(r, W - 190, 200);
        await lurk(r, app, false);
        app.handOld.meet(mourner);   // (so the arm leans out for the one at the edge first)
        await need(r, () => st(app, o) === 'caught', 14000);
        await need(r, () => st(app, mourner) === 'mourn', 9000);
        await need(r, () => st(app, mourner) === 'bow', 10000);
        await need(r, () => st(app, mourner) === 'walk', 5000);
        await r.wait(1500);
      } },

    { id: 'old-dead', title: 'It plays dead',
      how: 'An old hand the arm has met, awake near the right edge: now and then the arm goes for it anyway, and it flops onto its back. Tap it and it springs up and runs.',
      shortcut: 'The stage has them met, and makes the arm go for it this time (really one time in three).',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0);
        tweak(r, TUNE.hand.OLD, 'AWAKE', 1);
        tweak(r, TUNE.hand.OLD.PROD, 'TWITCH', 0);
        const { W } = world.size;
        const o = await drop(r, W - 280, 300); healed(o); o.ai.met = true;
        await need(r, () => st(app, o) === 'walk' && o.ai.gait !== 'crawl', 6000);
        app.handOld.meet(o);
        await lurk(r, app, false);
        await need(r, () => st(app, o) === 'dead', 12000);
        await r.wait(2600);   // the arm hovers and pokes: not a twitch
        const [x, y] = r.at(o); await r.glide(x, y); await r.down(); await r.wait(120); await r.up();
        await r.glide(x - 60, y - 150); away();
        await need(r, () => st(app, o) === 'walk', 4000);
        await r.wait(1500);
      } },

    { id: 'old-home', title: 'Sew it back on',
      how: 'Cut the arm\'s hand off, then carry the old hand to the stump: it comes out to meet it, and the hand goes back on, happily.',
      shortcut: 'The stage brings the arm out and cuts its hand off for you (really: the katana).',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0);
        await lurk(r, app);
        await need(r, () => arm(app) === 'lurk', 6000);
        await app.hand.come(innerWidth - 180, innerHeight - 420, 'eager'); await r.wait(1500);   // out on the page, where the katana could reach it
        const n0 = app.severed.list.size;
        app.hand.cut();
        await need(r, () => app.severed.list.size > n0, 2000);
        const o = [...app.severed.list].pop();
        await r.until(() => o.body.getLinearVelocity().length() < 0.3, 4000); await r.wait(600);
        const [x, y] = await grab(r, o);
        await r.line(x, y, x - 200, y - 220, 20);
        await r.wait(1600);   // carrying it: the stump comes out
        let c = app.hand.get();
        await r.glide(c.x - 60, c.y + 20);
        for (let k = 0; k < 6; k++) { c = app.hand.get(); await r.move(c.x + 35 * Math.cos(c.a), c.y + 35 * Math.sin(c.a)); await r.wait(150); }   // following the stump as it lifts towards the hand
        await r.up(); away();
        await need(r, () => arm(app) === 'sewn', 5000);
        await r.wait(2500);
      } },

    { id: 'old-hitch', title: 'The hitchhiker: it rides on a card you carry',
      how: 'Pick up a card next to an old hand: now and then it jumps on and dangles from it, chatting; swing the card hard and it flies off, lands dizzy.',
      shortcut: 'The stage puts a card down by it and makes it jump on (really one pick-up in ten).',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, SV.HITCH, 'CHANCE', 1);
        const { W, H } = world.size;
        const o = await drop(r, 0.35, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000);
        o.ai.cool = clock.now() + 1e6;   // (it is not hungry)
        const cx = r.pos(o)[0] + o.ai.fd * 210;   // just ahead of it
        await r.glide(cx - scrollX, H - 200 - scrollY + 60);   // (the ghost is there already)
        const q = await cardAt(r, 1, cx, H - 200, true);
        await r.wait(450);
        const [x, y] = await grab(r, q);
        await r.line(x, y, x + 20, y - 200, 30);
        await need(r, () => o.ai.joint, 2000);
        await r.line(x + 20, y - 200, x + 200, y - 260, 50, 30);   // a calm ride
        await r.wait(1500);
        for (let k = 0; k < 14 && st(app, o) === 'hitch'; k++) { const d = k % 2 ? -1 : 1; await r.line(r.x, r.y, r.x + d * 300, r.y + (k % 3 - 1) * 60, 3); }   // swung hard
        await need(r, () => st(app, o) === 'whee', 1000);
        await r.wait(300); await r.line(r.x, r.y, W * 0.5 - scrollX, innerHeight - 200, 12); await r.up(); away();
        await need(r, () => st(app, o) === 'dizzy', 5000);
        await need(r, () => st(app, o) === 'walk', 5000);
      } },

    { id: 'old-hide', title: 'It hides on the shelf',
      how: 'Type tana to bring out the secret shelf: old hands that have met the new hand run for it, leap up onto it and cower there.',
      shortcut: 'The stage has it met already, and brings the shelf out low enough for them to reach (it comes out at a random height).',
      async play(r, app) {
        away(); await floor(r);
        const hs = [await drop(r, 0.5, 300)];
        for (const o of hs) { healed(o); o.ai.met = true; }
        await need(r, () => hs.every((o) => st(app, o) === 'walk'), 6000);
        await r.wait(600);
        await shelfOut(r, app);
        await need(r, () => hs.some((o) => st(app, o) === 'hide'), 3000);
        await need(r, () => hs.some((o) => st(app, o) === 'leap'), 8000);
        await need(r, () => hs.some((o) => st(app, o) === 'cower'), 10000);
        await r.wait(3500);
      } },

    { id: 'old-wrest', title: 'Tug of war over a card',
      how: 'When an old hand crushes a card near the right edge, now and then the arm grabs the other end; they pull until it tears, and each keeps its half. Click the old hand meanwhile and it slips off.',
      shortcut: 'The stage has them met, puts the card down by it, and makes the arm go for it (really about one crush in three).',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0); tweak(r, TUNE.hand.WREST, 'CHANCE', 1); tweak(r, TUNE.hand.OLD, 'AWAKE', 0);
        const { W, H } = world.size;
        const o = await drop(r, W - 360, 300); healed(o); o.ai.met = true;
        await need(r, () => st(app, o) === 'walk', 6000);
        app.handOld.meet(o);
        const c = await lurk(r, app, false);
        await need(r, () => arm(app) === 'lurk', 4000); await r.wait(600);
        o.ai.fd = o.ai.dir = o.ai.face = 1; o.ai.turn = clock.now() + 1e5;   // facing the edge (turning round, it stalls and loses interest)
        const q = await cardAt(r, 0, W - 175, H - 280);   // right in front of it, in the arm's reach
        if (!await r.until(() => st(app, o) === 'crush', 5000) && st(app, o) === 'walk' && world.bodies.has(q)) { o.ai.prey = q; app.severed.set(o, 'crush'); }   // (it lost sight of it: on it goes)
        await need(r, () => st(app, o) === 'crush', 1000);
        await need(r, () => st(app, o) === 'wrest', 5000);
        c.fullUntil = clock.now() + 1e9; r.after(() => { c.fullUntil = 0; });   // (and then it eats no old hand: this one is a thief now)
        await need(r, () => st(app, o) !== 'wrest', 10000);
        await r.until(() => st(app, o) === 'walk', 6000);
        await r.wait(1000);
      } },

    { id: 'old-cheese', title: 'The cheese pull',
      how: 'Leave a card on the secret shelf with an old hand about: the arm comes all the way across for it, and the old hand may jump on the other end. They pull it apart like cheese.',
      shortcut: 'The stage opens the shelf low, lays a card on it, and makes the arm drag it off (not crush it) and the old hand jump on (really one time in two).',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0); tweak(r, SV.CHEESE, 'CHANCE', 1); tweak(r, TUNE.hand, 'REACH_CHANCE_CRUSH', 0);
        const o = await drop(r, 380, 300); healed(o); o.ai.stroll = 'tiptoe';
        await need(r, () => st(app, o) === 'walk', 6000);
        await r.wait(800);
        await sitDown(r, app, o); o.ai.wake = clock.now() + 1e6;   // it dozes under the shelf
        app.handOld.meet(o);
        await lurk(r, app);
        const sh = await shelfOut(r, app);
        await r.wait(500);
        await cardAt(r, 2, sh.x0 + sh.w / 2, sh.y - 160);
        await need(r, () => st(app, o) === 'hitch', 25000);
        await need(r, () => st(app, o) === 'cheese', 3000);
        await need(r, () => st(app, o) !== 'cheese', 9000);
        await r.until(() => !['hitch', 'crush'].includes(st(app, o)), 10000);   // with its half it rides it down and crushes it
        await r.wait(1200);
      } },

    { id: 'old-avenge', title: 'Revenge, and a high five',
      how: 'Leave the katana lying near an old hand that has met the new one: it drags the sword to the right edge and flings it at the arm. The new hand comes off, drops, and the two old hands high-five.',
      shortcut: 'The stage draws the katana and lays it on the floor, and has them met already.',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0);
        const was = app.uprising.stage(); r.after(() => app.uprising.setStage(was));   // (a revenge is the first step of the uprising: undone)
        const { W, H } = world.size;
        const o = await drop(r, W - 600, 300); healed(o); o.ai.met = true;
        await need(r, () => st(app, o) === 'walk', 6000);
        app.handOld.meet(o);
        await lurk(r, app);
        await need(r, () => arm(app) === 'lurk', 4000);
        const k = app.katana.plant(); app.katana.free(k);
        k.body.setTransform({ x: (W - 860) / S, y: (H - 60) / S }, Math.PI / 2); k.body.setLinearVelocity({ x: 0, y: 0 }); k.body.setAngularVelocity(0); k.body.setAwake(true);
        await need(r, () => st(app, o) === 'avenge', 9000);
        await need(r, () => app.severed.list.size === 2, 25000);
        await need(r, () => [...app.severed.list].some((q) => st(app, q) === 'five'), 6000);
        await need(r, () => [...app.severed.list].every((q) => st(app, q) !== 'five'), 12000);
        await r.wait(800);
      } },

    { id: 'old-tower', title: 'The hand tower pulls the arm out',
      how: 'With three old hands about that have all met the new hand, leave the arm lurking: they gather at the right edge, climb on each other, grab the arm by the wrist and pull it out onto the page, until it shakes them off.',
      shortcut: 'The stage drops the three near the right edge, already met and over their cuts.',
      async play(r, app) {
        await tower(r, app);
        await need(r, () => arm(app) === 'peer', 15000);
        await need(r, () => arm(app) === 'pulled', 10000);
        await need(r, () => arm(app) === 'sulk', 12000);
        await need(r, () => [...app.severed.list].every((o) => st(app, o) === 'dizzy'), 6000);
        await r.wait(1500);
      } },

    { id: 'old-tumble', title: 'Pick one off the hand tower: it comes down',
      how: 'While the old hands stand on each other at the right edge, take the middle one: the tower comes down and they land dizzy.',
      shortcut: 'The stage drops the three near the right edge, already met and over their cuts.',
      async play(r, app) {
        const hs = await tower(r, app, true);
        const T = app.severed.tower(), mid = T ? T.hands[1] : hs[1];   // (before the arm leans in to look)
        const [x, y] = await grab(r, mid);
        await need(r, () => !app.severed.tower(), 2000);
        await r.line(x, y, x - 700, y - 60, 30);
        await need(r, () => hs.some((o) => st(app, o) === 'tumble' || st(app, o) === 'dizzy'), 2000);
        await r.wait(1200);
        await letGo(r); away();
        await need(r, () => hs.filter((o) => o !== mid).every((o) => st(app, o) !== 'tumble'), 5000);
        await r.wait(2500);
      } },

    { id: 'old-dance', title: 'Crazy mode: they dance',
      how: 'Switch on crazy mode with old hands about: they dance on the spot to the beat; pick one up and it keeps dancing in your hand; switch it off and they freeze, look round and pretend nothing happened.',
      async play(r, app) {
        away(); await floor(r);
        const hs = [await drop(r, 0.35, 300), await drop(r, 0.62, 300)];
        await r.wait(1500);
        r.after(() => { if (isCrazy()) app.crazy.setCrazy(false); });
        await r.click('#toggle'); await r.wait(500); await r.click('#warn-yes');
        await need(r, () => hs.every((o) => st(app, o) === 'dance'), 4000);
        for (let k = 0; k < 4; k++) { await r.wait(250); await see(r, hs[0]); }   // (crazy mode's page is laid out anew, as its styles come in: back down to them)
        await r.wait(2500); await see(r, hs[0]);
        const [x, y] = await grab(r, hs[0]);
        await need(r, () => st(app, hs[0]) === 'jive', 1000);
        await r.line(x, y, x - 60, y - 160, 14);
        await r.wait(2500);
        await letGo(r);
        await need(r, () => st(app, hs[0]) === 'dance', 5000);
        await r.wait(1500);
        await r.click('#toggle'); away();
        await need(r, () => hs.every((o) => st(app, o) === 'freeze'), 1500);
        for (let k = 0; k < 3; k++) { await r.wait(150); await see(r, hs[0]); }
        await need(r, () => hs.every((o) => st(app, o) === 'walk'), 8000);
        await r.wait(800);
      } },

    { id: 'old-pester', title: 'It pokes your still cursor, and the arm wants its job back',
      how: 'Leave the mouse still on the page with an old hand about: it walks over and jumps up to poke the cursor. The arm comes out to do the same ("that is MY job"), and they take turns, faster and faster, until you move.',
      shortcut: 'Time is skipped: the mouse is still for 3 s instead of 7 (the arm waits 5 s instead of 10).',
      async play(r, app) {
        away(); await floor(r);
        tweak(r, TUNE.rps, 'CHANCE', 0); tweak(r, SV.PESTER, 'STILL_MS', 3000); tweak(r, TUNE.hand.IDLE, 'MS', 5000);
        const o = await drop(r, 0.3, 300); healed(o);
        await need(r, () => st(app, o) === 'walk', 6000);
        app.handOld.meet(o);
        await lurk(r, app);
        await r.wait(1000);
        await r.glide(innerWidth * 0.48, innerHeight * 0.42);   // and the mouse rests
        await need(r, () => st(app, o) === 'pester', 8000);
        await need(r, () => arm(app) === 'mine', 14000);
        await r.wait(7500);
        await r.glide(r.x + 50, r.y + 30);   // you move
        await need(r, () => st(app, o) !== 'pester', 4000);
        away();
        await r.wait(800);
      } },
  ],
};
