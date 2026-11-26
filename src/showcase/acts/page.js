// The stage, part "The page": see ../index.js and ./index.js for the act format, ../rig.js for the ghost pointer.
// Everything around the cards: the greeting, the banner fog and the kiri flood, theme and crazy mode, the shelf, the toasts and
// the slice of bread, feeding the search box, the stamp book, the ghost in the fog, the uprising's truce, the tab you leave, and
// the eggs (1926, the moon, Konami, the basement, say "hand"). An act that changes a lasting mode (theme, crazy, Konami, the
// moon, the ghost, the uprising's count) puts it back with r.after.
import { TUNE } from '../../core/tune.js';
import { bus } from '../../core/bus.js';
import { world, isCrazy } from '../../world/world.js';
import * as fog from '../../page/fog.js';
import * as kiri from '../../page/kiri.js';
import * as shelf from '../../actors/shelf.js';
import * as eggs from '../../page/eggs.js';
import * as omikuji from '../../page/omikuji.js';
import * as stamps from '../../page/stamps.js';
import * as ghost from '../../page/ghost.js';
import * as uprising from '../../page/uprising.js';
import * as bread from '../../page/bread.js';
import { show as toast } from '../../page/toast.js';

const $ = (s) => document.querySelector(s);
const vw = () => document.documentElement.clientWidth;

// ---- local helpers ----
/** nothing is focused (a key typed on the page must not land in the search box) */
function unfocus() { const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur(); }
/** a word typed on the page, as a visitor would (not into a text box) */
async function typeOnPage(r, w) { unfocus(); await r.type(w, 90); }
/** the ghost's pointer enters / leaves an element (the rig only sends move, down and up) */
function enter(el, r, type = 'pointerenter') { el.dispatchEvent(new PointerEvent(type, { bubbles: false, pointerId: 77, pointerType: 'mouse', clientX: r.x, clientY: r.y })); }
/** a click right where the ghost is, with its coordinates (el.click() has none) */
function clickHere(r) {
  const el = document.elementFromPoint(r.x, r.y) || document.body;
  el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'mouse', clientX: r.x, clientY: r.y, button: 0, buttons: 1 }));
  el.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerId: 77, pointerType: 'mouse', clientX: r.x, clientY: r.y, button: 0 }));
  el.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, clientX: r.x, clientY: r.y, button: 0 }));
}
/** typed into the search box a letter at a time, the grid filtering as it goes */
async function typeInBox(r, text, dt = 140) {
  const q = $('#q');
  q.focus({ preventScroll: true });
  for (const ch of text) { q.value += ch; q.dispatchEvent(new Event('input', { bubbles: true })); await r.wait(dt); }
}
function clearBox() { const q = $('#q'); if (!q) return; q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); q.blur(); }
/** the theme now, put back as it was when the act ends (the button, its storage, and the system default) */
function keepTheme(r) {
  const root = document.documentElement, ds = root.dataset.theme;
  let ls = null; try { ls = localStorage.getItem('kiripad-theme'); } catch (e) {}
  const dark = () => (root.dataset.theme ? root.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches);
  const was = dark();
  r.after(() => {
    if (dark() !== was) $('#theme').click();
    if (ds == null) delete root.dataset.theme; else root.dataset.theme = ds;
    try { if (ls == null) localStorage.removeItem('kiripad-theme'); else localStorage.setItem('kiripad-theme', ls); } catch (e) {}
  });
}
/** the banner in view, the ghost resting a little under it */
async function toTop(r) { await r.scrollTo(0); }
const heroBox = () => $('#hero').getBoundingClientRect();
/** sweep the ghost back and forth across the banner in rows (wipes the fog) */
async function sweep(r, rows = 6, { n = 10, dt = 16, x0 = 0.06, x1 = 0.94, y0 = 0.12, y1 = 0.9 } = {}) {
  const h = heroBox();
  for (let k = 0; k < rows; k++) {
    const y = h.top + h.height * (y0 + (y1 - y0) * k / Math.max(1, rows - 1));
    const [a, b] = k % 2 ? [x1, x0] : [x0, x1];
    await r.line(h.left + h.width * a, y, h.left + h.width * b, y, n, dt);
  }
}
/** a viewport point well clear of everything (the ghost parks there) */
const park = (r) => r.glide(vw() * 0.5, innerHeight - 30);
/** the stage's pinned Escape: closes the stamp card, the basement, lifts the flood */
const escape = () => document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
/** the shelf's y in page px is in view */
async function showShelf(r) { const s = shelf.state(); if (s) await r.scrollTo(s.y - innerHeight * 0.45, 60); }
/** the search box in view near the top of the window; @returns its client rect */
async function toBox(r, at = 160) {
  const b0 = $('.toolbar .search').getBoundingClientRect();
  await r.scrollTo(b0.top + scrollY - at);
  return $('.toolbar .search').getBoundingClientRect();
}
/** carry what the ghost holds from `from` onto the middle of the search box, slowly; hold there; let go */
async function dropOnBox(r, from) {
  const b = $('.toolbar .search').getBoundingClientRect(), to = [b.left + b.width / 2, b.top + b.height / 2];
  await r.line(from[0], from[1], to[0], to[1], 30, 16);
  await r.wait(300);
  await r.up();
  return to;
}
/** the ghost takes hold of body o (it waits for it to lie still, and tries again if it missed). @returns where the ghost is */
async function grab(r, o, still = true) {
  if (still) await r.until(() => !world.bodies.has(o) || o.body.getLinearVelocity().length() < 0.3, 3000);
  for (let k = 0; k < 6; k++) {
    let at = r.at(o);
    await r.glide(at[0], at[1]);
    at = r.at(o); await r.move(at[0], at[1], 0);
    await r.down();
    if (r.held() === o) return at;
    await r.up();
  }
  throw new Error('the ghost could not get hold of it');
}
/** the ghost lies under the act's own clean-up: no ghost, nothing laid to rest, no flood */
function ghostAfter(r) { ghost.reset(); r.after(() => { ghost.reset(); if (kiri.floodState()) kiri.lift(); }); }

export const PART = {
  id: 'page', title: 'The page',
  intro: 'Fog, eggs and everything else around the cards.',
  acts: [
    // ---------------- the banner ----------------
    { id: 'page-greeting', title: 'The greeting types itself, again and again',
      how: 'Open the page: the greeting at the top types hello, holds it, and erases it for the next language.',
      async play(r) {
        await toTop(r);
        const h = $('#hello').getBoundingClientRect();
        await r.glide(h.right + 40, h.bottom + 30);
        await r.wait(7500);
      }, tail: 500 },
    { id: 'page-fog', title: 'Wipe the fog off the banner and it grows back',
      how: 'Move the pointer over the banner: it wipes the fog off; leave it and the fog rolls back in over twelve seconds.',
      shortcut: 'The fog grows back in four seconds instead of twelve.',
      async play(r) {
        const T = TUNE.fog, was = T.REGROW_S; T.REGROW_S = 4; r.after(() => { T.REGROW_S = was; });
        await toTop(r);
        await sweep(r, 5, { n: 14, x0: 0.2, x1: 0.8, y0: 0.3, y1: 0.7 });
        await sweep(r, 4, { n: 12, x0: 0.25, x1: 0.75, y0: 0.35, y1: 0.65 });
        await park(r);
        await r.wait(4500);
      }, tail: 500 },
    { id: 'page-kiri', title: 'Type kiri: fog floods the whole page',
      how: 'Type kiri (or мъгла) anywhere on the page: a wall of fog rolls down over everything; wipe holes in it, Esc lifts it.',
      async play(r) {
        r.after(() => { if (kiri.floodState()) kiri.lift(); });
        await r.toGrid(200);
        await typeOnPage(r, 'kiri');
        await r.until(() => { const f = kiri.floodState(); return f && f.in; }, 4000);
        await r.wait(300);
        await r.glide(vw() * 0.3, innerHeight * 0.45);
        await r.line(r.x, r.y, vw() * 0.7, innerHeight * 0.5, 30, 16);
        await r.line(r.x, r.y, vw() * 0.35, innerHeight * 0.6, 30, 16);
        await r.wait(1200);
        await r.key('Escape');
        await r.until(() => !kiri.floodState(), 6000);
      }, tail: 800 },
    { id: 'page-theme', title: 'Light, dark and light again',
      how: 'Press the moon (or sun) button in the header: the page turns dark or light and the fog over the banner thickens again.',
      async play(r) {
        keepTheme(r);
        await toTop(r);
        await sweep(r, 3, { n: 10, x0: 0.25, x1: 0.75, y0: 0.35, y1: 0.65 });
        await r.click('#theme');
        await r.wait(2200);
        await r.click('#theme');
        await r.wait(1200);
      } },
    { id: 'page-crazy', title: 'Crazy mode (after the warning)',
      how: 'Press "Crazy mode" in the footer: a flashing-lights warning asks first; say yes and the page goes wild. Press it again for boring mode.',
      async play(r, app) {
        let ls = null; try { ls = localStorage.getItem('kiripad-mode'); } catch (e) {}
        r.after(() => {
          if (isCrazy()) app.crazy.setCrazy(false);
          $('#warn').hidden = true;
          try { if (ls == null) localStorage.removeItem('kiripad-mode'); else localStorage.setItem('kiripad-mode', ls); } catch (e) {}
        });
        await r.click('#toggle');
        await r.until(() => !$('#warn').hidden, 2000);
        await r.wait(1800);
        await r.click('#warn-yes');
        await r.until(isCrazy, 2000);
        await r.wait(700);
        await r.glide(vw() * 0.5, innerHeight * 0.4);
        await r.wait(4000);
        await r.click('#toggle');
        await r.until(() => !isCrazy(), 2000);
      } },

    // ---------------- the secret shelf ----------------
    { id: 'page-shelf-typed', title: 'Type tana: a shelf comes out, at a new height each time',
      how: 'Type tana (рафт, たな) anywhere on the page: a shelf slides out of the left edge at a random height; type it again and it goes.',
      async play(r) {
        await r.world();
        r.after(() => { if (shelf.state()) shelf.toggle(); });
        for (let k = 0; k < 3; k++) {
          await typeOnPage(r, 'tana');
          await r.until(() => shelf.state(), 2000);
          await showShelf(r);
          await r.wait(2400);
          await typeOnPage(r, 'tana');
          await r.until(() => !shelf.state(), 2000);
          await r.wait(900);
        }
      }, tail: 1000 },
    { id: 'page-shelf-search', title: 'tana + Enter in the search box opens the shelf',
      how: 'Type tana in the search box and press Enter (the way in on a phone): the box clears and the shelf comes out.',
      async play(r) {
        await r.world();
        r.after(() => { clearBox(); if (shelf.state()) shelf.toggle(); });
        await toBox(r);
        await r.click('#q');
        await typeInBox(r, 'tana', 180);
        await r.wait(700);
        await r.key('Enter');
        await r.until(() => shelf.state(), 2000);
        await r.wait(500);
        await showShelf(r);
        await r.wait(1500);
      } },
    { id: 'page-shelf-tap', title: 'Wipe the corner of the banner and tap the writing',
      how: 'Wipe the fog off the top right corner of the banner ("psst. type tana" is written under it) and tap the writing.',
      async play(r) {
        await r.world();
        r.after(() => { if (shelf.state()) shelf.toggle(); });
        await toTop(r);
        const s = $('#secret').getBoundingClientRect(), c = [s.left + s.width / 2, s.top + s.height / 2];
        await r.glide(c[0] - 90, c[1]);
        for (let k = 0; k < 5; k++) await r.line(r.x, r.y, c[0] + (k % 2 ? -90 : 90), c[1] + (k % 3 - 1) * 5, 10, 16);
        await r.glide(c[0], c[1]);
        await r.wait(400);
        clickHere(r);
        await r.until(() => shelf.state(), 2000);
        await r.wait(1200);
        await showShelf(r);
        await r.wait(1500);
      } },

    // ---------------- toasts ----------------
    { id: 'page-toast-poke', title: 'Talk back to a toast',
      how: 'Click a toast at the bottom of the screen while it shows: it answers, a little crosser each time.',
      async play(r) {
        await r.world();
        r.after(() => { if (shelf.state()) shelf.toggle(); });
        await typeOnPage(r, 'tana');   // something to say: the shelf's toast
        const t = $('#toast');
        await r.until(() => t.classList.contains('show'), 2000);
        await r.wait(900);
        for (let k = 0; k < 4; k++) { await r.click(t); await r.wait(1100); }
        await park(r);
      } },
    { id: 'page-toast-bread', title: 'Pester the toast: it falls off as a slice of bread',
      how: 'Click a toast five times: it is knocked off the screen and lands on the page as a slice of toast you can pick up and throw.',
      async play(r) {
        await r.world();
        r.after(() => { if (shelf.state()) shelf.toggle(); });
        await r.scrollTo(260);
        await typeOnPage(r, 'tana');
        const t = $('#toast');
        await r.until(() => t.classList.contains('show'), 2000);
        await r.wait(500);
        for (let k = 0; k < 5; k++) { await r.click(t); await r.wait(k < 4 ? 350 : 100); }
        const o = await r.until(() => bread.current(), 3000);
        if (!o) throw new Error('no slice of bread');
        await r.wait(600);
        const at = await grab(r, o);
        await r.line(at[0], at[1], at[0] - 60, at[1] - 220, 20, 16);
        await r.wait(400);
        await r.throwTo([r.x, r.y], [r.x - 420, r.y - 200], { n: 4 });
        await r.until(() => !world.bodies.has(o) || o.body.getLinearVelocity().length() < 0.2, 5000);
      } },

    // ---------------- the search box ----------------
    { id: 'page-search', title: 'Search: the grid filters as you type',
      how: 'Press / (or click the search box) and type: the cards that do not match drop out and the rest rise into place; Esc clears it.',
      async play(r) {
        r.after(clearBox);
        await toBox(r);
        unfocus();
        await r.key('/');
        await typeInBox(r, 'fog', 260);
        await r.wait(1600);
        await typeInBox(r, 'zzq', 200);
        await r.wait(1400);
        await r.key('Escape');
        await r.wait(800);
      } },
    { id: 'page-feed-card', title: 'Feed a card to the search box',
      how: 'Rip a card out, carry it onto the search box and let it go there gently: the box swallows it, types its name, and it grows back in its slot.',
      async play(r) {
        r.after(clearBox);
        await toBox(r, 380);
        const at = await r.tugOut(0);
        await r.wait(300);
        await dropOnBox(r, at);
        await r.until(() => $('#q').value.length > 2, 4000);
        await r.until(() => !$('#grid .card.held'), 6000);
        await r.wait(600);
      } },
    { id: 'page-feed-scrap', title: 'Feed a torn half to the search box: nothing found',
      how: 'Yank a card so hard it tears, carry your half onto the search box: it swallows it, types "…" and finds nothing.',
      shortcut: 'The stage makes the card a stubborn one, so the yank tears it.',
      async play(r) {
        r.after(clearBox);
        const D = TUNE.drag, was = D.ONE_TUG; D.ONE_TUG = 0; r.after(() => { D.ONE_TUG = was; });
        await r.world();
        await toBox(r);
        const p = await r.pull(1, -380, 0, { n: 8 });
        const held = await r.until(() => { const h = r.held(); return h && h.kind === 'piece' ? h : null; }, 3000, 16);
        if (!held) throw new Error('the card did not tear');
        await r.wait(400);
        await dropOnBox(r, p);
        await r.until(() => $('#q').value === '…', 4000);
        await r.wait(1500);
      } },
    { id: 'page-feed-hand', title: 'Feed an old hand to the search box: it spits it out',
      how: 'Carry a cut-off hand onto the search box: the box shakes, spits it back up, and looks for "hand" anyway.',
      shortcut: 'The stage brings an old hand along (really you cut one off the arm first).',
      async play(r) {
        r.after(clearBox);
        await r.world();
        const b = await toBox(r);
        const o = await r.oldHand(b.left - 160 + scrollX, b.top + scrollY + 160);
        await r.wait(60);
        const at = await grab(r, o, false);
        await r.wait(200);
        await dropOnBox(r, at);
        await r.until(() => $('#q').value === 'hand', 4000);
        await r.wait(1500);
      } },

    // ---------------- the stamp book ----------------
    { id: 'page-stamps', title: 'Hold the seal: the stamp book, and a find thumping down',
      how: 'Press and hold the red seal of the logo for three seconds: a stamp card slides out, one circle per secret; a secret found since you last looked thumps down.',
      shortcut: 'Nothing is inked while the stage plays, so it thumps down a stamp you already have.',
      async play(r) {
        r.after(() => { if ($('.stamp-card')) escape(); });
        await toTop(r);
        const s = $('.brand .hanko').getBoundingClientRect();
        await r.glide(s.left + s.width / 2, s.top + s.height / 2);
        await r.down();
        await r.wait(3200);
        await r.up();
        await r.until(() => $('.stamp-card'), 2000);
        await r.glide(Math.min(vw() - 40, s.left + 480), s.top + 120);
        await r.wait(1200);
        const have = stamps.found();
        stamps.replay(have.includes('stage') ? 'stage' : have[have.length - 1]);
        await r.wait(2400);
        escape();
        await r.wait(400);
      }, tail: 1000 },

    // ---------------- the ghost in the fog ----------------
    { id: 'page-ghost-rise', title: 'A ghost in the fog: it drifts, and slips away when you wipe through it',
      how: 'After the arm has eaten an old hand, its ghost lingers in the banner fog; wipe through it fast and it slips away and waves.',
      shortcut: 'The stage raises the ghost (really the arm has to eat an old hand first).',
      async play(r) {
        ghostAfter(r);
        await toTop(r);
        await park(r);
        ghost.rise();
        await r.until(() => { const g = ghost.get(); return g && g.a >= 1; }, 4000);
        await r.wait(1200);
        for (let k = 0; k < 4; k++) {
          const g = ghost.get(); if (!g) throw new Error('no ghost');
          if (g.hits > 0) break;
          await r.glide(g.x - 220, g.y - scrollY - 10, 40);
          const gx = g.x, gy = g.y - scrollY;   // where it is now (it drifts)
          await r.move(gx - 200, gy - 10, 0);
          await r.line(gx - 200, gy - 10, gx + 200, gy + 10, 10, 16);
          await r.wait(1200);
        }
        await park(r);
        await r.wait(3500);
      } },
    { id: 'page-ghost-roam', title: 'The ghost roams the kiri flood, tapping cards',
      how: 'With the ghost in the banner, type kiri: once the fog has rolled in, it leaves the banner and taps the cards; each one shivers.',
      shortcut: 'The stage raises the ghost (really the arm has to eat an old hand first).',
      async play(r) {
        ghostAfter(r);
        await r.scrollTo(160);
        await park(r);
        ghost.rise();
        await r.wait(1500);
        await typeOnPage(r, 'kiri');
        await r.until(() => { const g = ghost.get(); return g && g.st === 'roam'; }, 6000);
        let taps = 0; const off = bus.on('ghost.tapped', () => { taps++; }); r.after(() => { if (typeof off === 'function') off(); });
        await r.until(() => taps >= 2, 12000);
        await r.wait(800);
        await r.key('Escape');
        await r.wait(2500);
      } },
    { id: 'page-ghost-bow', title: 'An old hand walks over and bows to the ghost',
      how: 'With the ghost in the kiri flood and a cut-off hand on the screen: the old hand walks over and bows, and the ghost bows back.',
      shortcut: 'The stage raises the ghost and brings an old hand along.',
      async play(r) {
        ghostAfter(r);
        await r.world();
        ghost.rise();
        await r.toBottom();
        const o = await r.oldHand(world.size.W * 0.35, world.size.H - 200);
        if (o && o.ai) o.ai.hurt = 0;
        await park(r);
        await r.wait(1500);
        await typeOnPage(r, 'kiri');
        await r.until(() => [...app_sev()].some((h) => h.ai && h.ai.st === 'bow'), 14000);
        await r.wait(2500);
      } },
    { id: 'page-ghost-rest', title: 'Wipe the ghost again and again: it bows and is laid to rest',
      how: 'Wipe through the ghost four times, or wipe the banner nearly clear while it is there: it bows, fades, and never comes back that visit.',
      shortcut: 'The stage raises the ghost (really the arm has to eat an old hand first).',
      async play(r) {
        ghostAfter(r);
        await toTop(r);
        await park(r);
        ghost.rise();
        await r.until(() => { const g = ghost.get(); return g && g.a >= 1; }, 4000);
        await r.wait(600);
        for (let k = 0; k < 4 && ghost.get() && ghost.get().st !== 'bow'; k++) await sweep(r, 7, { n: 9 });
        await park(r);
        await r.until(() => ghost.isLaid(), 6000);
        await r.wait(1200);
      } },

    // ---------------- the uprising, left unattended ----------------
    { id: 'page-truce', title: 'The uprising ends in a truce: the old hands cheer',
      how: 'Revenge, then the hand tower, then an old hand sewn on the arm, in that order on one visit: the arm calls a truce, a toast says so and the old hands cheer.',
      shortcut: 'The stage skips the revenge, the tower and the sewing (the arm\'s and old hands\' acts) and calls the truce for the arm.',
      async play(r) {
        const was = uprising.stage(); r.after(() => uprising.set(was));
        await r.world();
        await r.toGrid(120);
        await r.oldHand(scrollX + vw() * 0.35, scrollY + innerHeight * 0.45);
        await r.oldHand(scrollX + vw() * 0.55, scrollY + innerHeight * 0.4);
        await park(r);
        await r.wait(1800);
        uprising.set('sewn');
        bus.emit('hand.truce', {});
        await r.wait(3500);
      } },
    { id: 'page-away', title: 'Leave the tab: it begs you to come back',
      how: 'Switch to another tab: the tab title begs you to come back and the icon turns into the hand; come back and it says "there you are".',
      shortcut: 'The stage pretends the tab is hidden for four seconds. Watch the tab title.',
      async play(r) {
        const ov = (v) => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => v }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (v ? 'hidden' : 'visible') }); document.dispatchEvent(new Event('visibilitychange')); };
        const restore = () => { if (Object.getOwnPropertyDescriptor(document, 'hidden')) { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); } };
        r.after(restore);
        await park(r);
        const titles = [document.title];
        ov(true);
        titles.push(document.title);
        await r.wait(4000);
        restore();
        await r.until(() => document.title !== titles[1], 1000);
        await r.wait(2200);
      }, tail: 800 },

    // ---------------- eggs ----------------
    { id: 'page-1926', title: '1926: the page turns into a silent film, then the reel ends',
      how: 'Linger on the year in the footer: it reads 1926, the page goes sepia under film grain and every bubble is a title card; when you leave, the reel ends on a last card.',
      shortcut: 'The reel runs out three seconds after you leave the year, not thirty.',
      async play(r) {
        const F = TUNE.film, was = F.LINGER_MS; F.LINGER_MS = 3000;
        const yr = $('#yr');
        r.after(() => { F.LINGER_MS = 0; enter(yr, r, 'pointerleave'); F.LINGER_MS = was; });
        await r.toBottom();
        const y = yr.getBoundingClientRect();
        await r.glide(y.left + y.width / 2, y.top + y.height / 2);
        enter(yr, r);
        await r.until(() => yr.textContent === '1926', 6000);
        await r.wait(1500);
        await r.glide(y.left + y.width / 2, y.top - 120);
        enter(yr, r, 'pointerleave');
        // a card speaks in a title card while the reel rolls
        await r.toGrid(140);
        await r.pull(1, 30, -150, { n: 26 });
        await r.wait(1400);
        await r.up();
        await r.until(() => yr.textContent !== '1926', 8000);
        await r.wait(1200);
      } },
    { id: 'page-moon', title: 'Too many light switches: the sun becomes a moon with an eye',
      how: 'Flip the light / dark button seven times in a row: the sun in the banner turns into a moon with the hand\'s eye in it, which follows your pointer.',
      async play(r) {
        keepTheme(r);
        r.after(() => eggs.unmoon && eggs.unmoon());
        await toTop(r);
        for (let k = 0; k < 8; k++) await r.click('#theme');
        const sun = $('#hero svg.scene circle');
        await r.until(() => sun && sun.dataset.moon, 2000);
        await r.wait(1500);
        const b = sun.getBoundingClientRect(), cx = b.left + b.width / 2, cy = b.top + b.height / 2;
        await r.glide(cx - 220, cy + 120);
        for (let k = 0; k <= 24; k++) { const a = k / 24 * Math.PI * 2; await r.move(cx + Math.cos(a) * 220, cy + Math.sin(a) * 150, 60); }
        await r.wait(800);
      } },
    { id: 'page-konami', title: 'The Konami code: every card is an omikuji slip',
      how: 'Type ↑ ↑ ↓ ↓ ← → ← → B A anywhere on the page: every card folds into a fortune slip; rip one out and it unfolds and reads you your fortune.',
      async play(r) {
        r.after(() => omikuji.off());
        unfocus();
        await toBox(r, 380);
        for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) { await r.key(k); await r.wait(120); }
        await r.until(() => $('#grid .card .omi-card'), 2000);
        await r.wait(1500);
        const p = await r.tugOut(0);
        await r.wait(2600);
        await r.line(p[0], p[1], p[0] + 60, p[1] + 40, 12);
        await r.up();
        await r.wait(1800);
      } },
    { id: 'page-konami-torn', title: 'Tear an omikuji slip: both halves read 凶',
      how: 'With the cards folded into slips (the Konami code), yank one so hard it tears: both halves open on the curse.',
      shortcut: 'The stage makes the card a stubborn one, so the yank tears it.',
      async play(r) {
        r.after(() => omikuji.off());
        const D = TUNE.drag, was = D.ONE_TUG; D.ONE_TUG = 0; r.after(() => { D.ONE_TUG = was; });
        unfocus();
        await r.toGrid(110);
        for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) { await r.key(k); await r.wait(60); }
        await r.until(() => $('#grid .card .omi-card'), 2000);
        await r.wait(900);
        const p = await r.pull(1, -360, 0, { n: 8 });
        await r.until(() => { const h = r.held(); return h && h.kind === 'piece'; }, 3000, 16);
        await r.wait(1500);
        await r.line(p[0], p[1], p[0] - 40, p[1] + 60, 10);
        await r.up();
        await r.wait(1500);
      } },
    { id: 'page-basement', title: 'Keep scrolling at the bottom: the basement trophy wall',
      how: 'At the very bottom of the page keep scrolling down: the footer lifts like a trapdoor onto the hand\'s trophy wall; scroll up to shut it.',
      async play(r) {
        r.after(() => { if ($('.basement')) escape(); });
        await r.toBottom();
        await park(r);
        for (let k = 0; k < 4 && !$('.basement'); k++) { window.dispatchEvent(new WheelEvent('wheel', { deltaY: 520, bubbles: true })); await r.wait(300); }
        await r.until(() => $('.basement'), 1500);
        await r.wait(3200);
        window.dispatchEvent(new WheelEvent('wheel', { deltaY: -200, bubbles: true }));
        await r.wait(900);
      }, tail: 800 },
    { id: 'page-tilt', title: 'Cards tilt under the pointer; the embroidery rolls with a swung card',
      how: 'Move the pointer over a card: it tilts towards it and its embroidered band slides; swing a card out of its slot and the band rolls with it.',
      async play(r) {
        const reset = () => document.querySelectorAll('#grid .card').forEach((c) => { for (const p of ['--rx', '--ry', '--mx', '--my', '--bx']) c.style.removeProperty(p); });
        r.after(reset);
        await r.toGrid(110);
        for (const i of [0, 1, 2]) {
          const c = await r.card(i); if (!c) continue;
          await r.glide(c.left + 10, c.top + 10);
          await r.line(c.left + 10, c.top + 10, c.right - 10, c.bottom - 10, 30, 22);
          await r.line(r.x, r.y, c.left + 20, c.bottom - 20, 20, 22);
          reset();
        }
        await toBox(r, 380);
        await r.tugOut(1, { dy: -300 });
        for (let k = 0; k < 3; k++) { await r.line(r.x, r.y, r.x + 220, r.y - 80, 14, 16); await r.line(r.x, r.y, r.x - 220, r.y + 80, 14, 16); }
        await r.up();
        await r.wait(1200);
      } },
  ],
};

// the old hands on the page (a Set of bodies; severed keeps it as world bodies of kind 'hand' with an ai)
function app_sev() { return [...world.bodies].filter((o) => o.kind === 'hand' && o.ai); }
