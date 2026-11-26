// A ledge at the bottom of the viewport for one thrown-onto-the-page body (the toast, page/bread.js; the coin, page/coinbody.js):
// a static body on its own category bit, so only that body collides with it (cards, pieces and hands pass through). It holds the
// body on the screen you are looking at until you pick it up or scroll more than scrollPx; then the body falls like any other.
// Each owner calls tick() from its own clock.onTick(..., 'late') and listens for scroll itself, so the late phase keeps its order.
// No random draws.
import { TUNE } from '../core/tune.js';
import { world, isHeld } from '../world/world.js';

/** @param {{ bit: number, scrollPx: number, body: () => object|null }} o  body(): the owner's body, or null */
export function makeLedge({ bit, scrollPx, body }) {
  let ledge = null, y0 = 0;
  const live = () => { const b = body(); return b && world.bodies.has(b) ? b : null; };
  function off() {
    if (!ledge) return;
    world.b2.destroyBody(ledge); ledge = null;
    const b = live(); if (b) b.body.setAwake(true);
  }
  function on() {
    off();
    const S = TUNE.physics.S, T = TUNE.physics.WALL.thickness, w = innerWidth / S;
    y0 = scrollY;
    ledge = world.b2.createBody({ position: { x: scrollX / S + w / 2, y: (scrollY + innerHeight) / S + T } });
    ledge.createFixture({ shape: new world.pl.Box(w / 2, T), friction: TUNE.physics.WALL.friction, filterCategoryBits: bit, filterMaskBits: bit });
  }
  const scrolled = () => Math.abs(scrollY - y0) > scrollPx;
  return {
    on, off,
    /** per frame: picked up, gone, or the page scrolled -> the ledge goes */
    tick() { const b = body(); if (ledge && (!b || isHeld(b) || scrolled())) off(); },
    /** on scroll: @returns true when the ledge went (the caller wakes the clock) */
    scroll() { if (ledge && scrolled()) { off(); return true; } return false; },
  };
}
