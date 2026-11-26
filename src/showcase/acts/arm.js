// The stage, part "The hand": see ../index.js and ./index.js for the act format, ../rig.js for the ghost pointer.
// The arm at the right edge (src/actors/hand/): every behaviour in hand/behaviours/ is reached by at least one act here, most of
// them the way a visitor gets there (the ghost carries, teases, throws and tugs), a few through a shortcut the act names.
// Chance is forced through the TUNE numbers the behaviours roll against (set for the act, put back by r.after), never by pinning
// Math.random for the whole page.
import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { world, fragment, remove, toPage, isCrazy } from '../../world/world.js';
import { line } from '../../core/lines.js';
import { meet } from '../../actors/hand/old.js';
import { set as setUprising, stage as uprisingStage } from '../../page/uprising.js';

const H_ = TUNE.hand;
const vw = () => document.documentElement.clientWidth;
/** the arm's state, and its record */
const st = (app) => { const m = app.hand.brain(); return m ? m.state : null; };
const claw = (app) => app.hand.get();
// every state the arm has been in since the last to(): a short one (eat, when the card is already at the edge) is not missed
let since = null;
function track() { if (since) return; since = []; bus.on('hand.state', ({ to: s }) => { if (s === 'off') since.length = 0; since.push(s); }); }   // (off: the stage set the scene for a new act)
/** wait until the arm is in (or has passed through, since the last call) one of the states; throws when it does not get there
 * (the act then shows as failed) */
async function to(r, app, states, max = 10000) {
  track();
  const want = [].concat(states), hit = () => want.includes(st(app)) || since.some((s) => want.includes(s));
  const ok = await r.until(hit, max);
  since.length = 0; if (want.includes(st(app))) since.push(st(app));
  if (!ok) throw new Error(`the arm never got to ${want.join('/')} (it is ${st(app)})`);
}
/** set a tuning number for this act only */
function tune(r, obj, key, v) { const was = obj[key]; obj[key] = v; r.after(() => { obj[key] = was; }); }

/** the hand awake and out lurking (r.awake() alone leaves it 'off' while nothing else keeps the frame loop running) */
async function wake(r, app) {
  await r.awake(); if (st(app) === 'off') app.hand.set('lurk');
  await r.glide(r.x - 30, r.y + 12);   // (the pointer moves: no "are you still there?" left over from the last act's stillness)
}
/** keep the ghost's pointer from resting long enough for anyone to come and poke it (a nudge every 2 s while it holds nothing).
 * @returns stop() */
function fidget(r) {
  let on = true, k = 0;
  (async () => { try { while (on) { await r.wait(2000); if (on && !r.held()) await r.move(r.x + (k++ % 2 ? -3 : 3), r.y); } } catch (e) { /* the act is over */ } })();
  return () => { on = false; };
}

/** what the arm remembers from an act before (full after eating, jealous lately, the truce): forgotten, for a fresh start */
function fresh(app) { const c = claw(app); if (!c) return; c.fullUntil = 0; c.jealousAt = null; c.cool = 0; c.sulkUntil = 0; c.peace = false; c.truce = false; c.uproot = false; c.tempted = 0; }
/** the hand out lurking, the bottom of the page in view (where old hands end up: they fall to the floor), and old hands spawned
 * there at page x = W - dx (lying limp). `awake`: up on its feet at once (not hurt from the cut). @returns the old hands */
async function oldHands(r, app, dxs, { awake = false, met = false } = {}) {
  tune(r, TUNE.rps, 'CHANCE', 0);   // (no game of rock, paper, scissors when they meet: that is the old hands' part)
  await wake(r, app); fresh(app);
  await r.toBottom();
  const { W, H } = world.size, out = [];
  for (const dx of [].concat(dxs)) { const o = await r.oldHand(W - dx, H - 200); if (awake) o.ai.hurt = 0; out.push(o); }
  if (met) {   // met already: it looks away until they are up on their feet, so it does not take one lying there for a meal
    const c = claw(app); c.cool = Infinity;
    for (const o of out) await sevTo(r, o, 'walk', 9000);
    for (const o of out) { meet(o); o.ai.met = true; }
    c.cool = 0;
  }
  return out;
}
/** an old hand's state */
const sevSt = (o) => (o && o.ai ? o.ai.st : null);
async function sevTo(r, o, states, max = 10000) {
  const want = [].concat(states);
  if (!(await r.until(() => want.includes(sevSt(o)), max))) throw new Error(`the old hand never got to ${want.join('/')} (it is ${sevSt(o)})`);
}

/** wipe the fog off the katana in the banner (scrolled to the top) until it is found */
async function findKatana(r, app) {
  await r.scrollTo(0);
  if (app.katana.isFound()) return;
  const b = document.querySelector('.katana').getBoundingClientRect(), cx = b.left + b.width / 2, ky = b.bottom - 70;
  await r.glide(cx - 90, ky);
  for (let k = 0; k < 8 && !app.katana.isFound(); k++) await r.line(k % 2 ? cx + 90 : cx - 90, ky + (k % 2) * 8, k % 2 ? cx - 90 : cx + 90, ky + ((k + 1) % 2) * 8, 6);
  if (!app.katana.isFound()) throw new Error('the katana was not found');
}
/** double-click the katana (planted in the banner, or lying about) where the ghost is: it jumps into its hand */
function equip(r) {
  const el = document.querySelector('.katana-body') || document.querySelector('.katana-in');
  el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true, cancelable: true, clientX: r.x, clientY: r.y }));
}
/** where the equipped katana's tip is, from the ghost (viewport px) */
const tipOff = (r) => { const k = world.blade; return k && k.tips ? [k.tips[0] - scrollX - r.x, k.tips[1] - scrollY - r.y] : [107, -227]; };
/** the ghost puts the katana back in the banner (Escape lets go of it, Escape again puts it back) */
async function sheathe(r) { await r.key('Escape'); await r.wait(100); await r.key('Escape'); }
/** the ghost carries an old hand to the stump and lets go of it with its palm where the hand belongs: it is sewn on */
async function sewOn(r, app) {
  for (let k = 0; k < 8 && !['sew', 'sewn'].includes(st(app)); k++) {
    const c = claw(app);
    await r.glide(c.x + 35 * Math.cos(c.a), c.y + 35 * Math.sin(c.a), 14); await r.wait(150);
  }
  await r.up();
  await to(r, app, 'sew', 1500);
}

/** the ghost picks up a loose body (card, piece, toast, old hand) where it is now. @returns where the ghost is */
async function pick(r, o) {
  const where = () => { if (!o.poly) return r.at(o); const n = o.poly.length, cx = o.poly.reduce((s, p) => s + p[0], 0) / n - o.w / 2, cy = o.poly.reduce((s, p) => s + p[1], 0) / n - o.h / 2, q = toPage(o, [cx, cy]); return [q[0] - scrollX, q[1] - scrollY]; };
  let [x, y] = where();
  const bar = document.querySelector('.sc-bar'), B = bar && bar.getBoundingClientRect();
  const still = !o.body || o.body.getLinearVelocity().length() < 0.5;
  if ((y < 60 || y > innerHeight - 60 || (B && x > B.left - 20 && x < B.right + 20 && y > B.top - 20))) { await r.scrollTo(scrollY + y - innerHeight / 2); [x, y] = where(); }   // (in view, and not under the stage's bar)
  // a card just out of its slot is still falling: it waits in the air for the ghost to get there (as a quick hand would catch it)
  const b = o.kind === 'card' && o.body, g = b && b.getGravityScale();
  if (b && !still) { b.setGravityScale(0); b.setLinearVelocity({ x: 0, y: 0 }); }
  try {
    await r.glide(x, y);
    for (let k = 0; k < 3 && r.held() !== o; k++) {   // (it may still have been tumbling into place: try again where it is now)
      if (k) { await r.up(); await r.wait(250); }
      [x, y] = where(); await r.move(x, y); await r.down();
    }
  } finally { if (b && world.bodies.has(o)) b.setGravityScale(g); }
  if (r.held() !== o) throw new Error('the ghost could not pick it up');
  return [x, y];
}
/** a grid card out of its slot and in the ghost's hand (the quick way: no tugging), the arm awake. @returns where the ghost is */
async function holdCard(r, i = 0) {
  await r.awake(); await r.toGrid();
  const o = await r.loose(i);
  return pick(r, o);
}
/** carry what the ghost holds from where it is to (x, y) at about `speed` px a frame */
async function carry(r, x, y, speed = 18) { await r.glide(x, y, speed); return [x, y]; }
/** a card held out close to the edge: it lunges for the far end and the tug of war is on. @returns the ghost's place */
async function tugOfWar(r, app, y = 340) {
  await carry(r, 540, y);
  await carry(r, vw() - 180, y, 14);
  await to(r, app, 'tug', 6000);
  return [vw() - 180, y];
}
/** throw what the ghost holds: carried from `from` to `to` in n steps and let go on the last one, with no pause in between (the
 * throw speed is read from the last few moves, and a pause before the release would count as slowing down) */
async function fling(r, from, to, n = 5) {
  for (let k = 1; k <= n; k++) await r.move(from[0] + (to[0] - from[0]) * k / n, from[1] + (to[1] - from[1]) * k / n, k < n ? 16 : 0);
  await r.up(16);
}
/** pull back slowly (a sharp yank in the first 0.45 s makes its claws slip) until the tug of war is over. @returns the ghost's x */
async function pullBack(r, app, y = 340) {
  let x = vw() - 180;
  await r.wait(700);
  while (st(app) === 'tug' && x > 300) { x -= 8; await r.move(x, y); }
  return x;
}

/** every act: a clean slate for the arm (the last act's tail may have left it cooling off after a poke), and the ghost's pointer
 * never still long enough for a poke or an old hand's pester, except in the acts that wait for exactly that */
const STILL = new Set(['arm-idle', 'arm-mine']);
function steady(a) {
  return { ...a, async play(r, app) {
    fresh(app);
    if (app.kiri.floodState()) await r.until(() => !app.kiri.floodState(), 8000);   // (the last act's flood thinning out: the ghost cannot get at the cards under it)
    if (STILL.has(a.id)) return a.play(r, app);
    const stop = fidget(r);
    try { await a.play(r, app); } finally { stop(); }
  } };
}
/** the kiri flood gone again, thinned out all the way */
async function unflood(r, app) { if (app.kiri.floodState()) app.kiri.lift(); await r.until(() => !app.kiri.floodState(), 8000); }

export const PART = {
  id: 'arm', title: 'The hand',
  intro: 'The arm at the right edge of the page, once a card has been ripped out.',
  acts: [
    { id: 'arm-tease', title: 'It wakes, lurks and wants your card',
      how: 'Rip a card out and carry it towards the right edge: the hand follows it up and down, then reaches for it. Take it away again and it sulks.',
      async play(r, app) {
        await r.toGrid();
        const p = await r.tugOut(0);
        await r.line(p[0], p[1], 520, 360, 24);
        await to(r, app, 'lurk', 3000);
        await r.line(520, 360, 520, 520, 30); await r.line(520, 520, 520, 300, 30);   // it follows the card up and down
        await carry(r, vw() - 430, 330, 16);
        await to(r, app, 'eager', 3000);
        await r.line(vw() - 430, 330, vw() - 430, 400, 20);   // gimme
        await r.line(vw() - 430, 400, 420, 400, 8);           // and away again, before it loses its temper
        await to(r, app, 'sulk', 3000);
        await r.wait(1200); await r.up();
      } },
    { id: 'arm-tug', title: 'Tug of war: the card tears in two',
      how: 'Hold a card out close to the right edge: it grabs the far end. Pull back slowly and the card stretches until it tears; it keeps its half and eats it.',
      shortcut: 'The card comes out of its slot without tugging.',
      async play(r, app) {
        await holdCard(r, 0);
        await tugOfWar(r, app);
        const x = await pullBack(r, app);
        await to(r, app, 'triumph', 1000);
        await r.line(x, 340, 420, 380, 30); await r.wait(400); await r.up();   // put your half down gently
        await to(r, app, 'eat', 3000);
        await to(r, app, 'lurk', 8000);
      } },
    { id: 'arm-keep', title: 'Let go in a tug of war: it keeps the card',
      how: 'In a tug of war, just let go: it has the whole card, waves it about, and gets bored of it after two seconds.',
      shortcut: 'The card comes out of its slot without tugging.',
      async play(r, app) {
        await holdCard(r, 0);
        await tugOfWar(r, app);
        await r.wait(900);
        await r.up();
        await to(r, app, 'has', 1000);
        await to(r, app, 'lurk', 6000);
      } },
    { id: 'arm-slip', title: 'A sharp yank: its claws slip',
      how: 'The moment it takes hold of your card, yank it away hard.',
      shortcut: 'The card comes out of its slot without tugging.',
      async play(r, app) {
        await holdCard(r, 0);
        const [x, y] = await tugOfWar(r, app);
        await r.line(x, y, x - 420, y + 40, 6, 16);
        await to(r, app, 'sulk', 1500);
        await r.wait(1500); await r.up();
      } },
    { id: 'arm-snatch', title: 'Out of patience: it snatches the card and crushes it',
      how: 'Hold a card in its zone, just out of reach, and keep it there.',
      shortcut: 'The card comes out of its slot without tugging; it always loses its patience here (really: sometimes it just asks again).',
      async play(r, app) {
        tune(r, H_, 'SNATCH_AGAIN', 1);
        await holdCard(r, 0);
        await carry(r, 540, 330);
        await carry(r, vw() - 470, 330, 12);
        await to(r, app, 'eager', 3000);
        await to(r, app, 'crush', 6000);
        await r.up();
        await to(r, app, 'gloat', 8000);
        await to(r, app, 'lurk', 4000);
      } },
    { id: 'arm-catch', title: 'Throw it a card: it catches it',
      how: 'Throw a card hard towards the right edge: the hand plucks it out of the air, holds it a moment and tosses it back.',
      shortcut: 'The card comes out of its slot without tugging; it never crushes this one (really: three times in ten).',
      async play(r, app) {
        tune(r, H_, 'CATCH_CHANCE_CRUSH', 0);
        await holdCard(r, 1);
        await carry(r, 560, 330);
        await r.wait(500);
        await fling(r, [560, 330], [560 + 26 * 5, 330], 5);
        await to(r, app, 'has', 2000);
        await to(r, app, 'lurk', 5000);
      } },
    { id: 'arm-catch-crush', title: 'A caught card gets crushed',
      how: 'Throw a card at it: sometimes it does not feel like sharing.',
      shortcut: 'The card comes out of its slot without tugging; it always crushes this one (really: three times in ten).',
      async play(r, app) {
        tune(r, H_, 'CATCH_CHANCE_CRUSH', 1);
        await holdCard(r, 0);
        await carry(r, 560, 330);
        await r.wait(500);
        await fling(r, [560, 330], [560 + 26 * 5, 330], 5);
        await to(r, app, 'crush', 2000);
        await to(r, app, 'gloat', 8000);
      } },
    { id: 'arm-piece', title: 'A torn-off piece gets the full tug of war',
      how: 'Yank a card out of its slot so hard that it tears, and hold the big piece out to the hand: everything it does to a card it does to a piece.',
      async play(r, app) {
        await r.toGrid();
        await r.awake();
        await r.pull(0, 0, -420, { n: 10 });
        await r.wait(600);
        const o = r.held(); if (!o || o.kind !== 'piece') throw new Error('the card did not tear');
        await r.wait(500);
        await tugOfWar(r, app);
        const x = await pullBack(r, app);
        await to(r, app, 'triumph', 1000);
        await r.line(x, 340, 420, 380, 30); await r.wait(400); await r.up();
        await to(r, app, 'lurk', 9000);
      } },
    { id: 'arm-scrap', title: 'A scrap is turned away, and batted back',
      how: 'Hold out a scrap of a card (less than a quarter of one): it turns its nose up. Throw it at it and it swats it straight back.',
      shortcut: 'The stage tears the scrap off for you.',
      async play(r, app) {
        await r.awake(); await r.toGrid();
        const o = await r.loose(1);
        const sc = fragment(o, [[0, 0], [o.w * 0.45, 0], [o.w * 0.4, o.h * 0.45], [0, o.h * 0.5]], 'piece', {}, {});
        remove(o);
        await r.wait(30);
        await pick(r, sc);
        await carry(r, 560, 340);
        await carry(r, vw() - 180, 340, 14);
        await to(r, app, 'sulk', 3000);
        await r.wait(2200);
        await carry(r, 560, 340, 14);
        await to(r, app, 'lurk', 4000);
        await r.wait(2700);
        await fling(r, [560, 340], [560 + 26 * 5, 340], 5);
        await r.until(() => !world.bodies.has(sc) || sc.body.getLinearVelocity().x < -5, 3000);
      } },
    { id: 'arm-shelf', title: 'It comes for a card left on the shelf',
      how: 'Type tana to bring out the secret shelf and leave a card lying on it: the hand creeps all the way across the screen for it while the card panics and its neighbour says it was not it.',
      shortcut: 'The cards come out of their slots without tugging (the second is dropped on the first for you); it always crushes this one (really: four times in ten, else it drags it off to eat).',
      async play(r, app) {
        tune(r, H_, 'REACH_CHANCE_CRUSH', 1);
        await r.awake();
        await r.type('tana');
        const sh = await r.until(() => app.shelf.state(), 3000); if (!sh) throw new Error('no shelf');
        await holdCard(r, 0);
        await r.scrollTo(sh.y - 330);
        const y0 = sh.y - scrollY;
        await carry(r, 200, y0 - 140, 14); await r.wait(800); await r.up(); await r.wait(400);
        // a second card dropped on top of it: it is not on the shelf, so it only watches (and says it was not it)
        const A = [...world.bodies].find((o) => o.kind === 'card'), S = TUNE.physics.S;
        const B = await r.loose(0), p = A.body.getPosition();
        B.body.setTransform({ x: p.x + 0.1, y: p.y - (A.h / 2 + B.h / 2 + 15) / S }, 0); B.body.setLinearVelocity({ x: 0, y: 0 }); B.body.setAwake(true);
        await r.glide(700, 520);
        for (let k = 0; ; k++) {   // (in its panic the card may hop right off the shelf, and the arm gives up: it goes back on)
          await to(r, app, 'reach', 6000);
          await r.until(() => st(app) !== 'reach', 16000);
          if (st(app) === 'crush') break;   // (else it gave up: sulk, or lurk already)
          if (k === 2) throw new Error('the card kept hopping off the shelf');
          await r.until(() => st(app) === 'lurk', 4000);
          if (!app.shelf.holds(A)) { await pick(r, A); await r.scrollTo(sh.y - 330); await carry(r, 200, sh.y - scrollY - 140, 14); await r.wait(800); await r.up(); }
          await r.glide(700, 520);
        }
        await to(r, app, 'crush', 1000);
        await to(r, app, 'gloat', 8000);
      } },
    { id: 'arm-sever', title: 'Cut its hand off with the katana tip; a new one grows',
      how: 'Wipe the fog off the katana in the banner, double-click it into your hand and bring its tip down through the arm while it is out: the hand comes off, the arm whips back spurting, and comes back with a new one about eight seconds later.',
      shortcut: 'The cards come out of their slots without tugging.',
      async play(r, app) {
        await wake(r, app); fresh(app);
        await findKatana(r, app);
        await r.type('tana');
        const sh = await r.until(() => app.shelf.state(), 3000); if (!sh) throw new Error('no shelf');
        await holdCard(r, 0);
        await r.scrollTo(sh.y - 330);
        await carry(r, 200, sh.y - scrollY - 140, 14); await r.wait(800); await r.up();
        await r.glide(620, 120);
        const q = [...world.bodies].find((b) => b.kind === 'card');
        for (let k = 0; ; k++) {   // (in its panic the card may hop right off the shelf, and the arm gives up: it goes back on)
          await to(r, app, 'reach', 6000);
          await r.wait(2000);   // the arm well out across the page
          if (st(app) === 'reach') break;
          if (k === 2) throw new Error('the card kept hopping off the shelf');
          await r.until(() => st(app) === 'lurk', 4000);
          if (!app.shelf.holds(q)) { await pick(r, q); await r.scrollTo(sh.y - 330); await carry(r, 200, sh.y - scrollY - 140, 14); await r.wait(800); await r.up(); }
          await r.glide(620, 120);
        }
        equip(r); await r.wait(300);
        if (!world.blade || world.blade.root) throw new Error('the katana is not in hand');
        await r.move(r.x + 2, r.y); await r.wait(50);
        const off = tipOff(r), a = claw(app).arm2, M = [(a[1][0] + a[2][0]) / 2, (a[1][1] + a[2][1]) / 2];
        await r.glide(r.x, 60 - off[1], 20);                 // the tip up over everything,
        await r.glide(M[0] - off[0], 60 - off[1], 20);       // across to above the arm,
        await r.glide(M[0] - off[0], M[1] + 70 - off[1], 9); // and down through it
        await to(r, app, 'stump', 1500);
        await r.wait(600);
        await sheathe(r);
        await to(r, app, 'regrow', 10000);
        await to(r, app, 'lurk', 4000);
      } },
    { id: 'arm-sew', title: 'Sew the old hand back on',
      how: 'Cut its hand off, then pick the cut-off hand up and let go of it at the stump: it is pulled back on, and no new hand grows.',
      shortcut: 'The card comes out of its slot without tugging; the stage cuts the hand off for you (really: the katana).',
      async play(r, app) {
        await holdCard(r, 0); fresh(app);
        await carry(r, 540, 360); await carry(r, vw() - 430, 380, 16);
        await to(r, app, 'eager', 3000);
        app.hand.cut();
        const o = [...app.severed.list].pop();
        await r.up(); await r.wait(100);
        await pick(r, o);
        await carry(r, vw() - 330, 420, 16);
        await r.wait(1400);   // the stump comes out for it
        await sewOn(r, app);
        await to(r, app, 'sewn', 3000);
        await to(r, app, 'lurk', 4000);
      } },
    { id: 'arm-toast', title: 'Toast for the hand',
      how: 'Click a toast five times: it falls onto the page as a slice of bread. Throw it at the hand: it catches it and eats it, real food at last.',
      async play(r, app) {
        await r.toGrid();
        await r.tugOut(0);
        await r.up();
        const t = document.getElementById('toast'), tb = t.getBoundingClientRect();
        await r.glide(tb.left + tb.width / 2, tb.top + tb.height / 2, 40);
        if (!t.classList.contains('show')) bus.emit('ui.toast', { msg: line('toast.ripped') });   // (it went while the ghost got there)
        for (let k = 0; k < 7 && !app.bread.current(); k++) { await r.click(t); await r.wait(220); }
        const b = await r.until(() => app.bread.current(), 3000); if (!b) throw new Error('no toast fell');
        await r.until(() => !b.body.isAwake() || b.body.getLinearVelocity().length() < 0.3, 5000);
        await r.wait(300);
        await pick(r, b);
        await carry(r, 560, 330, 16); await r.wait(500);
        await fling(r, [560, 330], [560 + 60 * 4, 322], 4);   // (bread is heavier than a card: a harder throw)
        await to(r, app, 'eat', 2000);
        await to(r, app, 'lurk', 6000);
      } },
    { id: 'arm-idle', title: 'Are you still there?',
      how: 'Once the hand is about, leave the mouse still on the page for ten seconds: it creeps out and taps your cursor. Move and it whips away.',
      shortcut: 'The card comes out of its slot without tugging.',
      async play(r, app) {
        await holdCard(r, 0);
        await carry(r, 420, 460); await r.wait(300); await r.up();   // (a card lying about, as there is once the hand is out)
        await r.glide(620, 460); await r.move(600, 450);
        await to(r, app, 'poke', 13000);
        await r.wait(4200);
        await r.move(640, 470);
        await to(r, app, 'lurk', 3000);
      } },
    { id: 'arm-circle', title: 'Its eye follows you round in circles',
      how: 'Move the mouse round in circles near the hand while it is out: its eye follows the pointer.',
      shortcut: 'The card comes out of its slot without tugging; it does not snatch it this time.',
      async play(r, app) {
        tune(r, H_, 'SNATCH_AGAIN', 0);
        await holdCard(r, 0);
        const cx = vw() - 400, cy = 420;
        await carry(r, 540, cy); await carry(r, cx + 70, cy, 16);
        await to(r, app, 'eager', 3000);
        for (let k = 0; k <= 200; k++) { const a = k / 8; await r.move(cx + 70 * Math.cos(a), cy + 70 * Math.sin(a)); }
        await r.line(r.x, r.y, 420, 420, 10);
        await r.wait(1200); await r.up();
      } },
    { id: 'arm-blind', title: 'Blind in the kiri flood, until it sees you',
      how: 'Type kiri to flood the page with fog: the hand gropes up and down the edge and cannot see the card you carry past it. Wipe a hole round its hand and THERE you are.',
      shortcut: 'The card comes out of its slot without tugging.',
      async play(r, app) {
        r.after(() => { if (app.kiri.floodState()) app.kiri.lift(); });
        await holdCard(r, 0);
        await carry(r, 540, 300);
        await r.type('kiri');
        await to(r, app, 'grope', 6000);
        await carry(r, vw() - 330, 300, 10);
        await r.wait(2600);
        // over to the hand (it keeps groping up and down) and round about it: the card wipes a hole in the flood there
        for (let k = 0; k < 160 && !['snatch', 'crush'].includes(st(app)); k++) {
          const c = claw(app), tx = vw() - 60 - (k % 8 < 4 ? 0 : 40), ty = Math.max(60, Math.min(innerHeight - 60, c.y)), d = Math.hypot(tx - r.x, ty - r.y), f = Math.min(1, 22 / (d || 1));
          await r.move(r.x + (tx - r.x) * f, r.y + (ty - r.y) * f);
        }
        await to(r, app, ['snatch', 'crush'], 3000);
        await to(r, app, 'crush', 3000);
        await r.up();
        await to(r, app, 'gloat', 8000);
        await unflood(r, app);
      } },
    { id: 'arm-blind-lift', title: 'Blind in the fog until it lifts',
      how: 'Type kiri: the hand cannot see a thing and gropes about. Press Escape and the fog thins out: it blinks and can see again.',
      shortcut: 'The card comes out of its slot without tugging.',
      async play(r, app) {
        r.after(() => { if (app.kiri.floodState()) app.kiri.lift(); });
        await holdCard(r, 0);
        await carry(r, 420, 460); await r.wait(300); await r.up();   // (a card lying about, as there is once the hand is out)
        await r.glide(500, 500);
        await r.type('kiri');
        await to(r, app, 'grope', 6000);
        await r.wait(4000);
        await r.key('Escape');
        await to(r, app, 'lurk', 4000);
        await r.until(() => !app.kiri.floodState(), 8000);
      } },
    { id: 'arm-film', title: 'Silent film: it moves in jerky steps',
      how: 'Hover the year in the footer until it reads 1926: in the silent film every hand moves in jerky steps, twelve a second.',
      shortcut: 'The stage starts the reel without the hover, and stops it at the end.',
      async play(r, app) {
        tune(r, H_, 'SNATCH_AGAIN', 0);
        r.after(() => bus.emit('page.film', { on: false }));
        await r.until(() => !app.kiri.floodState(), 8000);
        await holdCard(r, 0);
        await carry(r, 540, 380);
        bus.emit('page.film', { on: true });
        await carry(r, vw() - 420, 380, 12);
        await to(r, app, 'eager', 3000);
        await r.line(vw() - 420, 380, vw() - 420, 240, 40); await r.line(vw() - 420, 240, vw() - 420, 520, 60);
        await r.line(vw() - 420, 520, 460, 420, 12);
        await r.wait(1500); await r.up();
        bus.emit('page.film', { on: false });
      } },
    { id: 'arm-chew', title: 'Left unattended: pull the card back, bitten',
      how: 'Rip a card, then leave the tab for twenty seconds: when you come back the hand is chewing one of your cards at the edge. Pull it out of its fingers.',
      shortcut: 'Time is skipped: really you are away from the tab for 20 s.',
      async play(r, app) {
        await wake(r, app); await r.toGrid();
        await r.glide(520, 460);
        bus.emit('page.returned', { ms: TUNE.awayThief.AWAY_MS + 1000 });
        await to(r, app, 'chew', 3000);
        await r.wait(2200);
        const b = claw(app).o.el.getBoundingClientRect(), gx = b.left + 30, gy = b.top + b.height / 2;
        await r.glide(gx, gy); await r.down(); await r.wait(80);
        await r.line(gx, gy, gx - 260, gy + 40, 15);
        await to(r, app, 'sulk', 2000);
        await r.line(r.x, r.y, 420, 460, 20); await r.wait(500); await r.up();
      } },
    { id: 'arm-gulp', title: 'Left unattended: it finishes the card',
      how: 'Leave the tab for twenty seconds and do not take the card back: it chews it down and swallows it whole (pinned up in the basement after).',
      shortcut: 'Time is skipped: really you are away from the tab for 20 s.',
      async play(r, app) {
        await wake(r, app); await r.toGrid();
        await r.glide(520, 460);
        bus.emit('page.returned', { ms: TUNE.awayThief.AWAY_MS + 1000 });
        await to(r, app, 'chew', 3000);
        await to(r, app, 'lurk', 12000);
      } },
    { id: 'arm-show', title: 'Called in for a scene',
      how: 'Press Surprise me (or flip the coin): the hand comes out where the scene wants it, in the pose it wants, and goes when it is done.',
      shortcut: 'The stage calls the hand in itself, the way a scene does.',
      async play(r, app) {
        await wake(r, app);
        await r.scrollTo(0);
        await app.hand.come(vw() - 300, 300, 'eager');
        await to(r, app, 'show', 1000);
        await r.wait(1400);
        app.hand.to({ x: vw() - 420, y: 420, pose: 'point' }); await r.wait(1400);
        app.hand.to({ x: vw() - 260, y: 260, pose: 'joy' }); await r.wait(Math.max(1400, app.hand.say('ask')));
        app.hand.leave();
        await to(r, app, 'sulk', 1000);
        await to(r, app, 'lurk', 4000);
      } },
    { id: 'arm-book', title: 'The phrasebook borrows the hand',
      how: 'Stay a while in the open phrasebook (type kiri.phrasebook() or find it in the footer): the hand comes in to raid it, and the page lends it the arm.',
      shortcut: 'The raid starts at once.',
      async play(r, app) {
        r.after(() => { if (app.phrasebook.isOpen()) app.phrasebook.close(); });
        await wake(r, app);
        await app.phrasebook.open();
        await r.wait(400);
        app.raid.start();
        await to(r, app, 'book', 6000);
        await r.wait(9000);
        app.phrasebook.close();
        await to(r, app, ['lurk', 'off', 'sulk'], 3000);
      } },
    { id: 'arm-meet', title: 'It meets an old hand, and eats it',
      how: 'Cut its hand off with the katana and let the old hand lie near the right edge: the new hand leans out and looks at it, then, since the old one can only crawl, drags it off and eats it.',
      shortcut: 'The stage drops the old hand there for you.',
      async play(r, app) {
        const [o] = await oldHands(r, app, 190);
        await to(r, app, 'meet', 6000);
        await to(r, app, 'devour', 9000);
        await to(r, app, 'lurk', 12000);
        if (world.bodies.has(o)) throw new Error('it did not eat it');
      } },
    { id: 'arm-save', title: 'You save the old hand from the new one',
      how: 'While the new hand lifts an old hand to eat it, grab the old hand off it.',
      shortcut: 'The stage drops the old hand there for you.',
      async play(r, app) {
        const [o] = await oldHands(r, app, 190);
        if (!(await r.until(() => st(app) === 'devour' && claw(app).joint, 16000))) throw new Error('it did not take the old hand');
        await r.wait(200);
        await pick(r, o);
        await to(r, app, 'sulk', 1500);
        await r.line(r.x, r.y, r.x - 500, r.y - 120, 24);
        await r.wait(600); await r.up();
      } },
    { id: 'arm-prod', title: 'An old hand plays dead',
      how: 'An old hand walking about near the right edge, one the arm has met: now and then it goes for it anyway. The old hand plays dead, and the arm pokes it.',
      shortcut: 'The stage drops the old hand there, already met; the arm always tries (really: about one time in three) and the old hand never twitches.',
      async play(r, app) {
        tune(r, H_.OLD, 'AWAKE', 1); tune(r, H_.OLD.PROD, 'TWITCH', 0);
        const [o] = await oldHands(r, app, 240, { awake: true, met: true });
        await to(r, app, 'prod', 12000);
        await sevTo(r, o, 'dead', 2000);
        await to(r, app, 'lurk', 6000);
      } },
    { id: 'arm-paper', title: 'Not paper',
      how: 'Pick up an old hand and hold it out to the arm in its zone, like a card: it takes it, has a look, and works out it is not paper.',
      shortcut: 'The stage drops the old hand there for you; it hands this one back (really: half the time it eats it anyway).',
      async play(r, app) {
        tune(r, H_.OLD.PAPER, 'EAT', 0);
        const [o] = await oldHands(r, app, 700);
        await r.wait(600);
        await pick(r, o);
        await carry(r, r.x - 100, innerHeight - 380, 14);
        await carry(r, vw() - 420, innerHeight - 380, 14);
        await to(r, app, 'paper', 4000);
        await r.until(() => !r.held(), 3000); r.release();
        await to(r, app, 'lurk', 8000);
      } },
    { id: 'arm-jealous', title: 'Jealous',
      how: 'Carry an old hand around for a while: the arm leans in, drumming its fingers.',
      shortcut: 'The stage drops the old hand there for you.',
      async play(r, app) {
        const [o] = await oldHands(r, app, 700);
        await r.wait(600);
        const [x, y] = await pick(r, o);
        const said = r.until(() => claw(app).mood === 'jealous', 9000);
        for (let k = 0; k <= 160; k++) await r.move(x - 80 + 220 * Math.sin(k / 18), y - 260 + 90 * Math.sin(k / 11));
        if (!(await said)) throw new Error('it was not jealous');
        await r.wait(1500); await r.up();
      } },
    { id: 'arm-wrest', title: 'Tug of war with an old hand',
      how: 'An old hand the arm has met starts crushing a card near the right edge: now and then the arm grabs the other end, and they pull until the card tears.',
      shortcut: 'The stage drops the old hand there, already met, and a card next to it; the arm always grabs the card (really: about one time in three).',
      async play(r, app) {
        tune(r, H_.WREST, 'CHANCE', 1); tune(r, H_.OLD, 'AWAKE', 0);   // (and it does not go and prod the old hand instead)
        const [o] = await oldHands(r, app, 330, { awake: true, met: true });
        await r.toGrid();
        const q = await r.loose(0);
        await r.toBottom();
        const { W, H } = world.size; q.body.setTransform({ x: (W - 190) / TUNE.physics.S, y: (H - 120) / TUNE.physics.S }, 0); q.body.setAwake(true);
        await sevTo(r, o, 'crush', 15000);
        await to(r, app, 'wrest', 3000);
        await to(r, app, ['eat', 'sulk'], 10000);
        await to(r, app, 'lurk', 8000);
      } },
    { id: 'arm-cheese', title: 'The cheese pull',
      how: 'Leave a card on the shelf with an old hand near it: as the arm drags the card off, the old hand may jump on the other end, and the card stretches between them like hot cheese until it tears.',
      shortcut: 'The cards come out of their slots without tugging; the old hand is put on the shelf for you, and always jumps (really: half the time); the arm drags this card off (really: it crushes four in ten on the spot).',
      async play(r, app) {
        tune(r, H_, 'REACH_CHANCE_CRUSH', 0); tune(r, TUNE.severed.CHEESE, 'CHANCE', 1); tune(r, TUNE.rps, 'CHANCE', 0);
        await wake(r, app); fresh(app);
        await r.type('tana');
        const sh = await r.until(() => app.shelf.state(), 3000); if (!sh) throw new Error('no shelf');
        await holdCard(r, 0);
        await r.scrollTo(sh.y - 330);
        await carry(r, 160, sh.y - scrollY - 140, 14); await r.wait(800); await r.up();
        await r.glide(700, 560);
        const q = [...world.bodies].find((b) => b.kind === 'card'), S = TUNE.physics.S;
        const near = (o) => { const a = o.body.getWorldCenter(), b = q.body.getWorldCenter(); return Math.hypot(a.x - b.x, a.y - b.y) * S < 260; };
        let old = null;
        for (let k = 0; ; k++) {   // (in its panic the card may hop right off the shelf, and the arm gives up: it goes back on)
          await to(r, app, 'reach', 12000);
          // the old hand: dropped onto the card once the arm is well on its way (so it has no time to wander off), and it sits down
          await r.until(() => st(app) !== 'reach' || claw(app).x - (q.body.getPosition().x * S - scrollX) < 650, 6000);
          if (st(app) === 'reach' && !(old && world.bodies.has(old) && near(old))) {
            const qp = q.body.getPosition();
            old = await r.oldHand(qp.x * S + 40, qp.y * S - q.h / 2 - 70); meet(old); old.ai.met = true;
            await r.wait(400); app.severed.set(old, 'rest');
          }
          // until the arm has the card, it does nothing an old hand cannot jump from (not off copying the pointer)
          await r.until(() => {
            if (old && st(app) === 'reach' && !TUNE.severed.CHEESE.FROM.concat('hitch', 'cheese').includes(sevSt(old))) app.severed.set(old, 'rest');
            return st(app) !== 'reach';
          }, 16000);
          if (['eat', 'cheese'].includes(st(app))) break;
          if (k === 2) throw new Error('the card kept hopping off the shelf');
          await r.until(() => st(app) === 'lurk', 4000);
          if (!app.shelf.holds(q)) { await pick(r, q); await r.scrollTo(sh.y - 330); await carry(r, 160, sh.y - scrollY - 140, 14); await r.wait(800); await r.up(); }
          await r.glide(700, 560);
        }
        await to(r, app, 'eat', 1000);
        await to(r, app, 'cheese', 1500);
        await to(r, app, 'eat', 7000);
        await to(r, app, 'lurk', 9000);
      } },
    { id: 'arm-mine', title: "That's MY job",
      how: 'With an old hand on the page, leave the mouse still: the old hand goes and pokes your cursor first. When the arm comes out to do the same, it finds the job taken, and they take turns, faster and faster, until you move.',
      shortcut: 'The stage drops the old hand there for you.',
      async play(r, app) {
        const [o] = await oldHands(r, app, world.size.W / 2, { awake: true });
        claw(app).fullUntil = Infinity; r.after(() => { claw(app).fullUntil = 0; });   // (full: it eats none meanwhile)
        await to(r, app, 'meet', 8000);
        await r.until(() => st(app) === 'lurk' && sevSt(o) === 'walk', 12000);
        const C = [Math.round(vw() * 0.42), Math.round(innerHeight * 0.5)];
        await r.glide(C[0] + 10, C[1] + 6); await r.move(...C);
        await sevTo(r, o, 'pester', 10000);
        await to(r, app, 'mine', 8000);
        await r.wait(7000);
        await r.move(C[0] + 40, C[1] + 20);
        await to(r, app, 'lurk', 3000);
      } },
    { id: 'arm-tower', title: 'The hand tower pulls the arm out',
      how: 'Three old hands that have met the new one, up and about: they climb on each other at the right edge, the arm leans down to look, and the top one takes it by the wrist. They pull it out onto the page until it shakes them off.',
      shortcut: 'The stage drops three old hands there, already met and up on their feet.',
      async play(r, app) {
        tune(r, TUNE.severed.TOWER, 'COOL_MS', 0);
        const os = await oldHands(r, app, [world.size.W * 0.7, world.size.W * 0.55, world.size.W * 0.4], { awake: true, met: true });
        claw(app).fullUntil = Infinity; r.after(() => { claw(app).fullUntil = 0; });   // (full: it eats none meanwhile)
        await r.glide(300, 200);
        await to(r, app, 'peer', 30000);
        await to(r, app, 'pulled', 10000);
        await to(r, app, 'sulk', 12000);
        if (!os.every((o) => world.bodies.has(o))) throw new Error('an old hand went missing');
      } },
    { id: 'arm-truce', title: 'The uprising ends in a truce',
      how: 'On one visit: an old hand takes the new hand off with the katana (revenge), the tower pulls the arm out so hard its hand flies off, and you sew an old hand back on the stump. Back at its edge: "fine. truce." It takes nothing from you after that.',
      shortcut: 'The stage plays the revenge and the tower\'s grab for you, and the new hand grows back at once; the truce is forgotten after the act.',
      async play(r, app) {
        const was = uprisingStage();
        r.after(() => { setUprising(was); fresh(app); });
        tune(r, H_, 'STUMP_S', 2);
        const os = await oldHands(r, app, [world.size.W * 0.7, world.size.W * 0.55]);
        claw(app).fullUntil = Infinity;
        setUprising('');
        const still = fidget(r);   // (no old hand pokes the cursor meanwhile)
        await r.wait(1200);
        bus.emit('sev.avenged', { hand: os[0] });   // revenge: the new hand comes off
        await to(r, app, 'stump', 1000);
        await to(r, app, 'lurk', 8000);
        claw(app).tower = { x: world.size.W - 120, y: world.size.H - 330 }; app.hand.set('peer');   // the tower is up
        await r.wait(1600);
        bus.emit('sev.towerGrab', { hand: null, hands: [] });
        await to(r, app, 'pulled', 1000);
        await to(r, app, 'spent', 9000);
        await r.wait(1500);
        still();
        const bar = document.querySelector('.sc-bar'), br = bar && !bar.hidden ? bar.getBoundingClientRect() : null;
        const free = (q) => { const [x, y] = r.at(q); return x > 20 && x < vw() - 20 && y > 80 && y < innerHeight - 10 && !(br && x > br.left - 30 && x < br.right + 30 && y > br.top - 40); };
        const o = [...app.severed.list].filter(free).sort((a, b) => b.body.getPosition().x - a.body.getPosition().x)[0];   // (one the stage's own bar is not in front of)
        if (!o) throw new Error('no old hand to sew on');
        await pick(r, o);
        const c = claw(app); await carry(r, c.x - 80, c.y + 20, 14);
        await sewOn(r, app);
        await to(r, app, 'sewn', 3000);
        await to(r, app, 'truce', 6000);
        await to(r, app, 'lurk', 6000);
        if (!claw(app).peace) throw new Error('no truce');
        // a card held out to it now: it looks, and leaves it
        await r.scrollTo(0); await holdCard(r, 0);
        await carry(r, 540, 380); await carry(r, vw() - 160, 380, 16);
        await r.wait(3500);
        if (claw(app).o) throw new Error('it took the card');
        await r.line(r.x, r.y, 420, 420, 14); await r.wait(600); await r.up();
      } },
    { id: 'arm-bob', title: 'Crazy mode: the arm bobs along',
      how: 'With old hands on the page, switch to crazy mode: the old hands dance, and the arm comes in at the edge and bobs along, pretending it is not dancing.',
      shortcut: 'The stage drops two old hands there for you.',
      async play(r, app) {
        r.after(() => { if (isCrazy()) app.crazy.setCrazy(false); });
        await oldHands(r, app, [world.size.W * 0.6, world.size.W * 0.35]);
        await r.wait(1200);
        await r.click('#toggle'); await r.wait(300);
        await r.click('#warn-yes');
        if (!(await r.until(() => app.hand.bobbing(), 3000))) throw new Error('it is not bobbing');
        await r.wait(6000);
        await r.click('#toggle');
        await r.wait(1500);
      } },
  ].map(steady),
};
