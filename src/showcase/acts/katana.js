// The stage, part "The katana": see ../index.js and ./index.js for the act format, ../rig.js for the ghost pointer.
// Held in the hand (equipped) the katana keeps one angle, so its tip is always TIP px from the pointer: the acts aim the tip.
import { world } from '../../world/world.js';
import { bus } from '../../core/bus.js';

const TIP = [107, -227];   // the tip, from the pointer, when equipped (katana.test.js)
const must = (v, what) => { if (!v) throw new Error('did not happen: ' + what); return v; };
const kat = () => world.blade;
const box = (sel) => { const e = document.querySelector(sel); return e ? e.getBoundingClientRect() : null; };
const heard = (r, type) => { const box = { n: 0, last: null }; r.after(bus.on(type, (e) => { box.n++; box.last = e; })); return box; };

/** wipe the banner fog where the katana lies until it shows (the same strokes that wipe the fog) */
async function find(r, app) {
  await r.world();
  if (window.scrollY > 0) await r.scrollTo(0);
  if (app.katana.isFound()) return;
  const k = box('.katana'), cx = Math.max(60, k.left + k.width / 2), y = k.bottom - 50;
  await r.glide(cx - 10, y - 30, 14);
  for (let i = 0; i < 6 && !app.katana.isFound(); i++) await r.line(r.x, r.y, i % 2 ? cx - 10 : cx + 95, y - 30 + i * 9, 8, 20);
  must(app.katana.isFound(), 'the katana was uncovered');
}
/** the visible grip of the planted katana, viewport px */
const grip = () => { const b = box('.katana-in'); return [b.left + 20, b.top + 40]; };
/** a double-click where the ghost is */
async function dbl(r) {
  await r.wait(40);
  const t = document.elementFromPoint(r.x, r.y) || document.body;
  for (const type of ['click', 'dblclick']) t.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, clientX: r.x, clientY: r.y, detail: type === 'click' ? 1 : 2, view: window }));
  await r.wait(120);
}
/** found, double-clicked into the hand: the pointer is on its grip */
async function equip(r, app) {
  await find(r, app);
  const [gx, gy] = grip();
  await r.glide(gx, gy);
  await dbl(r);
  must(world.grab && world.grab.sticky && world.grab.o === kat(), 'the katana is in hand');
}
/** found, grabbed by the grip and pulled out of the ground sideways; the button stays down */
async function draw(r, app) {
  await find(r, app);
  const [gx, gy] = grip();
  await r.glide(gx, gy); await r.down();
  must(await r.until(() => world.grab && world.grab.o === kat(), 1000, 16), 'it took hold of the katana');
  // up and to the right: out of the ground it hangs from the hilt, its tip between the banner and the grid
  await r.line(gx, gy, gx + 110, gy - 90, 14, 20);
  await r.line(gx + 110, gy - 90, gx + 330, gy - 250, 18, 20);
  must(await r.until(() => kat() && !kat().root, 3000, 16), 'it tore out of the ground');
  return [gx + 330, gy - 250];
}
/** the pointer (with the equipped katana) so the tip is at viewport (x, y) */
const aim = (x, y) => [x - TIP[0], y - TIP[1]];
/** the slot i card's rect */
const cardBox = (i) => document.querySelectorAll('#grid .card')[i].getBoundingClientRect();

export const PART = {
  id: 'katana', title: 'The katana',
  intro: 'The sword in the banner, under the fog.',
  acts: [
    { id: 'katana-find', title: 'Wipe the fog: a katana in the banner',
      how: 'Rub the fog at the bottom left of the banner with the mouse: a katana stuck in the ground shows through.',
      shortcut: 'Found once, it stays found for the visit; the stage hides it again first.',
      async play(r, app) {
        app.katana.cover();
        await find(r, app);
        await r.wait(600);
        const [gx, gy] = grip();
        await r.glide(gx + 30, gy + 20, 8);
      }, tail: 2500 },

    { id: 'katana-draw', title: 'Pull the katana out of the ground',
      how: 'Once it shows, grab the hilt and pull hard, like a card, until it comes out; let go and it drops.',
      async play(r, app) {
        const p = await draw(r, app);
        await r.wait(1600);
        await r.line(p[0], p[1], 560, 230, 20, 20);
        await r.wait(600);
        await r.line(560, 230, 80, 170, 30, 24);   // over the margin left of the grid: dropped there, it cuts nothing on its way down
        await r.wait(1800);   // it speaks once per two seconds at most
        await r.up();
        must(!world.grab, 'let go');
        await r.wait(1200);
      }, tail: 1000 },

    { id: 'katana-equip', title: 'Double-click: the katana in hand',
      how: 'Double-click the katana: it jumps into your hand at one steady angle and follows the pointer without a button held. Double-click again (or Esc) to let go.',
      async play(r, app) {
        await equip(r, app);
        await r.wait(400);
        const arc = []; for (let k = 0; k <= 40; k++) { const a = Math.PI * 1.1 * k / 40; arc.push([560 + 260 * Math.cos(a + Math.PI), 470 - 150 * Math.sin(a)]); }
        await r.glide(arc[0][0], arc[0][1]);
        await r.path(arc, 20);
        await r.wait(700);
        must(world.grab && world.grab.sticky, 'still in hand');
        await r.glide(70, 260);
        await r.wait(1200);
        await dbl(r);
        must(!world.grab, 'a double-click let go');
        await r.wait(350);
        await r.key('Escape');   // loose, Esc puts it back before it falls into the grid
        must(!kat(), 'Esc put it back');
      }, tail: 1500 },

    { id: 'katana-cut-grid', title: 'Cut a card in the grid in two',
      how: 'With the katana in hand, swing its tip through a card from one edge out through another: it is cut clean in two and falls out of its slot.',
      async play(r, app) {
        await equip(r, app);
        const cut = heard(r, 'card.cut');
        const c0 = cardBox(1), tx = c0.left + c0.width / 2;
        await r.glide(...aim(tx, -120), 16);
        await r.scrollTo(300); await r.wait(500);
        const c = cardBox(1), y1 = c.bottom + 30;
        await r.line(r.x, r.y, ...aim(tx, y1), Math.round((y1 + 120) / 10));
        must(await r.until(() => cut.n, 1000, 16), 'the card was cut');
        await r.wait(900);
        await r.glide(...aim(tx + 120, 200), 12);
      }, tail: 2000 },

    { id: 'katana-stab', title: 'Stab a card: it bleeds',
      how: 'With the katana in hand, push the tip into a card and pull it back out the same side: a wound that drips for a while.',
      async play(r, app) {
        await equip(r, app);
        const stab = heard(r, 'card.stabbed');
        const c0 = cardBox(1), tx = c0.left + c0.width / 2;
        await r.glide(...aim(tx, -120), 16);
        await r.scrollTo(300); await r.wait(500);
        const c = cardBox(1), yin = c.top + 70;
        await r.line(r.x, r.y, ...aim(tx, yin), Math.round((yin + 120) / 10));
        await r.wait(250);
        await r.line(r.x, r.y, ...aim(tx, c.top - 80), 12);
        must(await r.until(() => stab.n, 1000, 16), 'a stab');
        must(document.querySelectorAll('#grid .card')[1].classList.contains('held') === false, 'it stayed in its slot');
        await r.wait(3000);
      }, tail: 1500 },

    { id: 'katana-cut-loose', title: 'Slice a falling card; the katana brags',
      how: 'With the katana in hand, swing it through a loose card in mid-air: it falls in two halves, and sometimes the katana boasts about it.',
      shortcut: 'The stage drops the card out of its slot for you, and makes sure the katana brags (it does so one cut in three).',
      async play(r, app) {
        await equip(r, app);
        const cut = heard(r, 'card.cut');
        // the card under "minitype" has nothing to its right. Down to it with the tip in the margin left of the grid, so it cuts nothing on the way
        await r.glide(43, 480, 16);
        const c0 = cardBox(3);
        await r.scrollTo(c0.top + scrollY + c0.height / 2 - 400);
        const c = cardBox(3), start = aim(c.left - 26, c.top + c.height / 2 + 30), end = aim(c.right + 210, c.top + c.height / 2 + 60);
        await r.glide(...start, 16);
        await r.wait(2400);   // the katana says one thing per two seconds at most: its hello is long enough ago
        // the brag is a one-in-three roll when the cut ends: weigh it while the tip is in the card
        const rnd = Math.random; let pinned = false;
        const unpin = () => { if (pinned) { Math.random = rnd; pinned = false; } };
        r.after(unpin);
        r.after(bus.on('card.cutting', () => { if (!pinned) { pinned = true; Math.random = () => 0.1; } }));
        r.after(bus.on('card.cut', () => unpin()));
        r.after(bus.on('card.stabbed', () => unpin()));
        await r.loose(3);
        await r.wait(60);
        await r.line(...start, ...end, 9);
        unpin();
        must(await r.until(() => cut.n, 800, 16), 'the loose card was cut');
        await r.wait(1500);
      }, tail: 2000 },

    { id: 'katana-drop-cut', title: 'Drop the katana on a card',
      how: 'Pull the katana out, hold it up by the hilt over a card and let go: it falls tip first and cuts through.',
      async play(r, app) {
        const p = await draw(r, app);
        const cut = heard(r, 'card.cut');
        // over the top card of the right column (nothing under it but one more card): the tip hangs 250 px under the hilt
        const c = cardBox(2), x = c.left + c.width / 2 - 15, y = c.top - 300;
        await r.line(p[0], p[1], x, y, 40, 24);
        await r.wait(1800);
        await r.up();
        must(await r.until(() => cut.n, 2500, 16), 'it cut the card as it fell');
        await r.wait(1500);
      }, tail: 1500 },

    { id: 'katana-sheathe', title: 'Put the katana back',
      how: 'Press "Put the katana back" at the bottom of the window, or Esc while it is out and not in hand.',
      async play(r, app) {
        let p = await draw(r, app);
        await r.line(p[0], p[1], 80, 170, 20, 20);   // over the margin left of the grid: it falls past the cards
        await r.wait(800); await r.up();
        await r.wait(1200);
        await r.click('.sheathe');
        must(!kat() && !document.querySelector('.katana').classList.contains('away'), 'back in the banner');
        await r.wait(1400);
        p = await draw(r, app);
        await r.line(p[0], p[1], 80, 170, 20, 20);
        await r.wait(500); await r.up();
        await r.wait(900);
        await r.key('Escape');
        must(!kat(), 'Esc put it back');
        await r.wait(600);
      }, tail: 1200 },

    { id: 'katana-fog', title: 'Slash the fog open',
      how: 'With the katana in hand, swing the tip fast across the fog of the banner (or the kiri flood): it leaves thin slits that slowly close.',
      shortcut: 'The kiri flood is called by typing kiri, as you would.',
      async play(r, app) {
        await equip(r, app);
        r.after(() => { if (app.kiri.floodState && app.kiri.floodState()) app.kiri.lift(); });
        const h = box('#hero'), by = h.top + h.height * 0.3, bx = h.left + h.width * 0.5;
        await r.glide(...aim(bx - 260, by), 16);
        await r.wait(400);
        await r.line(r.x, r.y, ...aim(bx + 260, by - 20), 14);
        await r.wait(200);
        await r.line(r.x, r.y, ...aim(bx - 200, by + 70), 12);
        await r.wait(900);
        await r.type('kiri');
        await r.wait(2800);
        await r.glide(...aim(250, 560), 16);   // between the banner and the grid: the flood, and no card
        await r.wait(300);
        await r.line(r.x, r.y, ...aim(950, 560), 22);
        await r.wait(150);
        await r.line(r.x, r.y, ...aim(420, 380), 16);
        await r.wait(2500);
      }, tail: 1500 },

    { id: 'katana-tana', title: 'Slash 棚 in the banner: the shelf slides out',
      how: 'With the katana in hand, slash fast across the hidden 棚 in the top right corner of the banner (it is written there only with "More languages" on).',
      async play(r, app) {
        r.after(() => { if (app.shelf.state()) app.shelf.toggle(); });
        await equip(r, app);
        const slashed = heard(r, 'tana.slashed');
        const g = box('#secret b');
        if (!g) { bus.emit('ui.toast', { msg: 'The 棚 is written only with "More languages" on (in the footer).' }); await r.wait(2500); return; }
        const cx = g.left + g.width / 2, cy = g.top + g.height / 2;
        await r.glide(...aim(cx - 45, cy - 60), 16);
        await r.wait(2200);   // its hello is long enough ago for it to gloat
        // one fast stroke across the writing; the blade trails the hand a little, so if the tip did not get across, again the other way
        for (let k = 0; k < 3 && !slashed.n; k++) {
          const s = k % 2 ? -1 : 1;
          await r.line(r.x, r.y, ...aim(cx + 45 * s, cy + 60 * s), 4);
          await r.until(() => slashed.n, 600, 16);
          if (!slashed.n) await r.wait(1600);   // a slash cools down for 1.5 s
        }
        must(await r.until(() => slashed.n && app.shelf.state(), 1500, 16), 'the shelf came out');
        await r.wait(900);
        await r.glide(...aim(cx - 300, cy + 300), 12);
        await r.wait(1500);
      }, tail: 1500 },
  ],
};
