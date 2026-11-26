// The stage, part "The cards": see ../index.js and ./index.js for the act format, ../rig.js for the ghost pointer.
// Most acts play at the bottom of the page, where the floor is on screen, so a card that falls, lands, shatters or is stacked
// stays in view. Pulls are made upward from a card low on the screen, so the pointer never leaves the window.
import { world } from '../../world/world.js';
import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';

const D = TUNE.drag;

// ---- local helpers ----
/** the grid cards still in their slots */
const slots = () => [...document.querySelectorAll('#grid .card:not(.held)')];
/** the index among slots() of the card with this data-key (-1 if it is out) */
const idx = (key) => slots().findIndex((c) => c.dataset.key === key);
/** the i-th card from the end of the grid, as a key (stable while other cards leave their slots) */
const fromEnd = (k) => { const all = [...document.querySelectorAll('#grid .card')]; return all[all.length - 1 - k].dataset.key; };
/** throw unless v: an act that did not see its behaviour fails (the bar says so) */
const must = (v, what) => { if (!v) throw new Error('did not happen: ' + what); return v; };
/** every card comes out on n tugs this act (0: a stubborn one, two tugs; 1: one tug). world.tugs is cleared by the next scene */
function tugs(r, one) { const was = D.ONE_TUG; D.ONE_TUG = one; r.after(() => { D.ONE_TUG = was; }); }
/** scroll so the centre of slot i sits at viewport y vy (as near as the page allows) */
async function place(r, i, vy) {
  await r.world();
  const c = slots()[i]; if (!c) throw new Error('no card ' + i);
  const b = c.getBoundingClientRect();
  await r.scrollTo(b.top + scrollY + b.height / 2 - vy);
}
const kinds = () => { const k = {}; for (const o of world.bodies) k[o.kind] = (k[o.kind] || 0) + 1; return k; };
const asleep = () => [...world.bodies].every((o) => o.root || !o.body.isAwake());
/** let go gently where the ghost is (no throw) */
async function ease(r, [x, y], [x1, y1], n = 24) { await r.line(x, y, x1, y1, n, 20); await r.wait(500); await r.up(); }

export const PART = {
  id: 'cards', title: 'The cards',
  intro: 'The project cards are rooted in their grid and would like to stay there.',
  acts: [
    { id: 'card-tilt', title: 'A card leans toward the pointer',
      how: 'Move the mouse over a card in the grid: it tilts after the pointer and a light follows it.',
      async play(r) {
        await place(r, 5, 450);
        const c = slots()[5].getBoundingClientRect(), x = (f) => c.left + c.width * f, y = (f) => c.top + c.height * f;
        await r.glide(x(0.1), y(0.5), 12);
        await r.path([[x(0.1), y(0.1)], [x(0.9), y(0.1)], [x(0.9), y(0.9)], [x(0.1), y(0.9)], [x(0.5), y(0.5)]].flatMap((p, k, a) => {
          const q = k ? a[k - 1] : [x(0.1), y(0.5)]; return Array.from({ length: 14 }, (_, j) => [q[0] + (p[0] - q[0]) * (j + 1) / 14, q[1] + (p[1] - q[1]) * (j + 1) / 14]);
        }), 24);
        must(slots()[5].style.getPropertyValue('--rx'), 'the card tilted');
        await r.wait(400);
        await r.glide(x(0.5), c.bottom + 90, 10);
      }, tail: 800 },

    { id: 'card-spring', title: 'Pull a card and let go: it springs back',
      how: 'Press a card, drag it out to where it strains and complains, and let go before it gives.',
      async play(r) {
        tugs(r, 1);
        await place(r, 5, 640);
        await r.pull(5, 50, -215, { n: 26 });
        must(await r.until(() => world.grab && world.grab.o.strained, 2000), 'the card strained');
        await r.wait(650);
        await r.up();
        must(await r.until(() => !world.bodies.size, 5000), 'it sprang back home');
      }, tail: 1500 },

    { id: 'card-tooth', title: 'A stubborn card comes out like a tooth',
      how: 'Hold a card at the strain until its root gives a notch, ease off (it sits crooked), then tug again until it comes out.',
      shortcut: 'Most cards come out on the first tug; the stage makes this one a stubborn one.',
      async play(r) {
        tugs(r, 0);
        await place(r, 4, 650);
        const [x, y] = await r.pull(4, -30, -250, { n: 16 });
        must(await r.until(() => world.grab && world.grab.o.loose >= 1, 5000, 16), 'the root gave a notch');
        await r.wait(700);
        await r.line(x, y, x + 10, y + 130, 8); await r.up();
        must(await r.until(() => !world.bodies.size, 5000), 'it went back, crooked');
        await r.wait(1000);
        const p = await r.tugOut(4, { dx: -40, dy: -320 });
        must(world.grab && !world.grab.o.root, 'out');
        await r.wait(900);
        await r.line(p[0], p[1], p[0] + 160, p[1] + 60, 20);
        await r.wait(400); await r.up();
      } },

    { id: 'card-onetug', title: 'One held tug and it is out',
      how: 'Pull a card out to the strain and hold it there: most cards give on the first tug.',
      async play(r) {
        tugs(r, 1);
        await place(r, 5, 640);
        const p = await r.pull(5, 30, -270, { n: 16 });
        must(await r.until(() => world.grab && !world.grab.o.root, 5000, 16), 'the card came out');
        await r.wait(900);
        await ease(r, p, [p[0] + 120, p[1] + 90]);
      } },

    { id: 'card-snap', title: 'Yanked too hard, a card tears in two',
      how: 'Grab a card and yank it far and fast in one go: it stretches, then tears, and you are left with half.',
      async play(r) {
        await place(r, 5, 700);
        const p = await r.pull(5, 0, -430, { n: 10 });
        must(await r.until(() => kinds().piece === 2, 3000, 16), 'it tore in two');
        await r.wait(1100);
        await ease(r, p, [p[0] - 140, p[1] + 60]);
      } },

    { id: 'card-throw', title: 'Throw a card',
      how: 'Rip a card out, carry it and let go while moving fast.',
      async play(r) {
        tugs(r, 1);
        await r.toBottom();
        const p = await r.tugOut(idx(fromEnd(0)), { dy: -300 });
        await r.wait(600);
        await r.line(p[0], p[1], 820, 420, 12);
        await r.wait(500);
        await r.throwTo([820, 420], [730, 375], { n: 5 });
        const o = [...world.bodies].find((q) => q.kind === 'card');
        must(o && o.hot, 'it was a throw');
        await r.until(() => !o.body.isAwake(), 6000);
      }, tail: 1500 },

    { id: 'card-land', title: 'A card dropped from high lands hard',
      how: 'Carry a card high up the screen and let it fall: it hits the floor with a thud and says so.',
      async play(r) {
        tugs(r, 1);
        await r.toBottom();
        const p = await r.tugOut(idx(fromEnd(1)), { dy: -300 });
        await r.wait(400);
        await r.line(p[0], p[1], 420, 110, 20, 20);
        await r.wait(900);
        let landed = false;
        const off = bus.on('card.landed', () => { landed = true; }); r.after(off);
        await r.up();
        must(await r.until(() => landed, 4000, 16), 'a hard landing');
      } },

    { id: 'card-smash', title: 'Throw a card hard: it shatters',
      how: 'Rip a card out and throw it hard against a wall or another card.',
      async play(r) {
        tugs(r, 1);
        await r.toBottom();
        const p = await r.tugOut(idx(fromEnd(0)), { dy: -300 });
        await r.wait(500);
        await r.line(p[0], p[1], 640, 470, 12);
        await r.wait(600);
        await r.throwTo([640, 470], [480, 470], { n: 4 });
        must(await r.until(() => kinds().shard, 2000, 16), 'it shattered');
        await r.wait(4500);   // the small shards fade, the big pieces stay
      }, tail: 1500 },

    { id: 'card-autoscroll', title: 'Carry a card to the edge: the page scrolls',
      how: 'Hold a torn-out card at the bottom (or top) edge of the window for a moment: the page scrolls along.',
      async play(r) {
        tugs(r, 1);
        await place(r, 4, 640);
        const p = await r.tugOut(4, { dy: -300 });
        await r.wait(500);
        await r.line(p[0], p[1], p[0] + 60, innerHeight - 20, 14);
        const y0 = scrollY, max = document.documentElement.scrollHeight - innerHeight;
        must(await r.until(() => scrollY >= max - 2, 8000), 'the page scrolled to the bottom');
        must(scrollY > y0 + 150, 'it scrolled');
        await r.line(p[0] + 60, innerHeight - 20, p[0] + 60, 600, 10);
        await r.wait(500); await r.up();
      } },

    { id: 'card-stack', title: 'Stack cards at the bottom of the page',
      how: 'Rip cards out and set them down gently on top of each other at the bottom of the page: they stay put, level.',
      async play(r) {
        tugs(r, 1);
        const X = 560, keys = [fromEnd(0), fromEnd(1), fromEnd(2)];
        for (let i = 0; i < 3; i++) {
          await r.toBottom();
          const p = await r.tugOut(idx(keys[i]), { dy: -300 });
          const o = r.held(); must(o, 'holding a card');
          await r.wait(300);
          const top = innerHeight - 6 - o.h * i - o.h / 2 - 30;
          await r.line(p[0], p[1], X, Math.min(p[1], top - 60), 14, 20);
          await r.line(X, Math.min(p[1], top - 60), X, top, 14, 24);
          await r.wait(600); await r.up();
          await r.until(asleep, 6000, 100);
        }
        const cs = [...world.bodies].filter((o) => o.kind === 'card');
        must(cs.length === 3 && cs.every((o) => Math.abs(o.body.getAngle()) < 0.05), 'three cards in a level stack');
      }, tail: 2000 },

    { id: 'card-agony', title: 'A card in a tug of war screams in agony',
      how: 'Carry a torn-out card close to the hand at the right edge: when it takes hold, pull back. The card hurts more the harder you pull.',
      async play(r, app) {
        tugs(r, 1);
        await place(r, 5, 600);
        const p = await r.tugOut(5, { dy: -300 });
        await r.wait(400);
        const W = document.documentElement.clientWidth, y = 300;
        await r.line(p[0], p[1], 540, y, 12);
        await r.line(540, y, W - 180, y, 30);
        must(await r.until(() => app.hand.brain().is('tug'), 5000, 16), 'the hand took hold');
        await r.wait(700);
        let x = W - 180;
        while (app.hand.brain().is('tug') && x > 300) { x -= 6; await r.move(x, y, 20); }
        await r.wait(700);
        await r.up();
        await r.until(() => app.hand.brain().is('lurk'), 8000);
      }, tail: 1500 },

    { id: 'card-regrow', title: 'Put the cards back: they grow back in their slots',
      how: 'Once a card is out, press "Put the cards back" at the bottom of the window.',
      async play(r) {
        tugs(r, 1);
        await r.toBottom();
        let p = await r.tugOut(idx(fromEnd(0)), { dy: -280 });
        await r.wait(300); await ease(r, p, [p[0] + 40, p[1] + 60], 8);
        p = await r.tugOut(idx(fromEnd(1)), { dy: -280 });
        await r.wait(500);
        await r.throwTo(p, [p[0] - 160, p[1]], { n: 4 });
        await r.wait(1800);
        const btn = must(document.querySelector('.reset-cards:not([hidden])'), 'the button is there');
        await r.click(btn);
        must(!world.bodies.size && document.querySelectorAll('#grid .card.regrow').length >= 2, 'the cards grew back');
      }, tail: 1800 },
  ],
};
