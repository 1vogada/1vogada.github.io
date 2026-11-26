// The stage, part "The cards": see ../index.js and ./index.js for the act format, ../rig.js for the ghost pointer.
import { world } from '../../world/world.js';

export const PART = {
  id: 'cards', title: 'The cards',
  intro: 'The project cards are rooted in their grid and would like to stay there.',
  acts: [
    { id: 'card-spring', title: 'Pull a card and let go: it springs back',
      how: 'Press a card, drag it a little way and let go before it tears.',
      async play(r) {
        await r.toGrid();
        await r.pull(1, 60, -150, { n: 24 });
        await r.wait(900);
        await r.up();
      } },
    { id: 'card-tooth', title: 'A card comes out like a tooth',
      how: 'Tug a card out of its slot: pull, ease off, pull again until the root gives.',
      async play(r) {
        await r.toGrid();
        const p = await r.tugOut(0);
        await r.wait(1200);
        await r.line(p[0], p[1], p[0] - 120, p[1] + 60, 20);
        await r.up();
      } },
    { id: 'card-throw', title: 'Throw a card across the page',
      how: 'Rip a card out, carry it and let go while moving fast.',
      async play(r) {
        const o = await r.loose(2);
        await r.wait(300);
        const [x, y] = r.at(o);
        await r.glide(x, y); await r.down();
        await r.throwTo([x, y], [x - 260, y - 160], { n: 5 });
        await r.until(() => !world.bodies.has(o) || o.body.getLinearVelocity().length() < 0.2, 5000);
      } },
  ],
};
