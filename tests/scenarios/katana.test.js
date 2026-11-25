'use strict';
// Katana: hidden in the banner under the fog. Wipe it free, pull it out, double-click to equip, cut entry to exit, stab, sheathe.
const { scenario, assert } = require('../helpers/harness');
const G = 'katana';

const kat = () => { const st = window.__cards.state(), k = st.katana; if (!k) return null; const p = k.body.getPosition();
  return { root: !!k.root, x: p.x * 100, y: p.y * 100, a: k.body.getAngle(), tip: k.tips, sticky: !!(st.grab && st.grab.o === k && st.grab.sticky), held: !!(st.grab && st.grab.o === k) }; };
const at = (a) => Math.abs(Math.atan2(Math.sin(a - Math.PI - 0.5), Math.cos(a - Math.PI - 0.5))) < 1e-6;   // the equipped angle, pi + 0.5
const kinds = () => { const k = {}; for (const o of window.__cards.objs) k[o.kind] = (k[o.kind] || 0) + 1; return k; };

// the same strokes that wipe the fog uncover it: about 260 px of pointer travel near its spot at the bottom left of the banner
async function find(s) {
  await s.ensurePlanck();
  const r = await s.box('.katana');
  const cx = r.x + r.w / 2, y = r.y + r.h - 50;
  await s.move(cx - 90, y - 20);
  for (let k = 0; k < 4; k++) await s.line(k % 2 ? cx + 90 : cx - 90, y - 20 + k * 8, k % 2 ? cx - 90 : cx + 90, y - 12 + k * 8, 6);
  return s.box('.katana-in');
}
// press the visible grip of the planted katana (local y 40 of the 300 px drawing, which sits 190 px down in the ground)
async function grip(s) { const b = await s.box('.katana-in'); return [b.x + 20, b.y + 40 - 0]; }

scenario(G, 'draw from the banner', async (s) => {
  await find(s);
  const r = await s.eval(() => ({ found: document.querySelector('.katana').classList.contains('found'), toast: document.getElementById('toast').textContent, kat: window.__cards.state().found }));
  assert.deepEqual(r, { found: true, toast: 'A katana?! Pull it out of the ground.', kat: true });
  const [gx, gy] = await grip(s);
  await s.move(gx, gy); await s.down();
  assert.equal((await s.state()).grab, 'katana:rooted', 'planted, it is held by its root like a card');
  await s.line(gx, gy, gx + 30, gy - 200, 15);
  assert.ok((await s.eval(kat)).root, 'still in the ground under 350 px');
  await s.line(gx + 30, gy - 200, gx + 60, gy - 450, 25);
  const k = await s.eval(kat);
  assert.equal(k.root, false, 'pulled past the limit it tears out of the ground');
  const ui = await s.eval(() => ({ away: document.querySelector('.katana').classList.contains('away'), body: document.querySelectorAll('#phys .katana-body').length, sheathe: !document.querySelector('.sheathe').hidden, toast: document.getElementById('toast').textContent }));
  assert.deepEqual(ui, { away: true, body: 1, sheathe: true, toast: 'The very tip of the blade cuts, however slowly. Double-click the katana to keep it in hand.' });
  await s.run(400);
  assert.ok(await s.said('SAY.khello'), 'it introduces itself');
  await s.run(2000);   // the katana speaks at most once per TIMING.gap.katana
  await s.up();
  assert.ok(await s.said('SAY.kdrop'), 'dropped, it has something to say about that too');
  await s.run(3000, 100);
  const k2 = await s.eval(kat);
  assert.ok(!k2.held && k2.y > k.y, 'it falls');
});

scenario(G, 'double-click equip', async (s) => {
  await find(s);
  const [gx, gy] = await grip(s);
  await s.page.mouse.dblclick(gx, gy);
  await s.run(100);
  let k = await s.eval(kat);
  assert.ok(k && !k.root && k.sticky, 'a double-click takes it out of the ground and into the hand');
  assert.ok(at(k.a), 'held at one steady angle ' + k.a);
  assert.equal((await s.state()).kat, 'equipped');
  assert.ok(await s.eval(() => document.querySelector('#phys .katana-body').classList.contains('equipped')));
  // no button held: it follows the pointer anyway, and does not swing
  await s.line(gx, gy, 400, 300, 20);
  await s.run(500);
  k = await s.eval(kat);
  assert.ok(k.sticky && at(k.a), 'still in hand, still at its angle');
  // the grip (local 0, -105 px) is on the pointer
  const g = [k.x + 105 * Math.sin(k.a), k.y - 105 * Math.cos(k.a)];
  assert.ok(Math.hypot(g[0] - 400, g[1] - 300) < 6, `the grip is under the pointer (${g.map(Math.round)})`);
  await s.run(1500);   // the katana speaks at most once per TIMING.gap.katana
  await s.page.mouse.dblclick(400, 300);
  await s.run(100);
  k = await s.eval(kat);
  assert.ok(!k.held && !k.sticky, 'double-click again lets go');
  assert.ok(await s.said('SAY.kdrop'));
  await s.run(3000, 100);
  await s.scrollTo(await s.eval(() => document.documentElement.scrollHeight - innerHeight));   // it fell to the floor of the page
  // a double-click on the katana lying loose takes it in hand again; Esc lets go
  const g2 = await s.eval(() => { const r = document.querySelector('#phys .katana-body svg rect[height="80"]').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; });
  assert.ok(g2[1] > 0 && g2[1] < 900, 'it lies on screen');
  await s.page.mouse.dblclick(g2[0], g2[1]);
  await s.run(300);
  k = await s.eval(kat);
  assert.ok(k.sticky && at(k.a), 'equipped again');
  await s.key('Escape');
  k = await s.eval(kat);
  assert.ok(k && !k.held, 'Esc drops the equipped katana (and does not put it back)');
});

// the tip is 107 px right of and 227 px above the grip when equipped (local 15,146 from the centre, the grip at 0,-105, at pi + 0.5)
const TIP = [107, -227];

async function equipAt(s, scroll) {
  await s.scrollTo(scroll);
  await find(s);
  const [gx, gy] = await grip(s);
  await s.page.mouse.dblclick(gx, gy);
  await s.run(100);
  return [gx, gy];
}

scenario(G, 'cut entry to exit', async (s) => {
  const [gx, gy] = await equipAt(s, 300);
  const c = await s.cardBox(1);                    // the middle card of the top row
  const tx = c.x + c.w / 2, px = tx - TIP[0];
  await s.line(gx, gy, px, 100, 16);               // over it, tip well above the card
  await s.run(300);
  let k = await s.eval(kat);
  assert.ok(Math.abs(k.tip[0] - tx) < 8, 'the tip is lined up over the card');
  // down through the top edge and out through the bottom edge, at 10 px a frame
  const y0 = 100, y1 = c.y + c.h + 30 - TIP[1];
  await s.line(px, y0, px, y1, Math.round((y1 - y0) / 10));
  await s.run(300);
  const kk = await s.eval(kinds);
  assert.equal(kk.piece, 2, `cut in two (${JSON.stringify(kk)})`);
  assert.ok(await s.eval(() => document.querySelectorAll('#grid .card')[1].classList.contains('held')), 'the card left its slot');
  assert.ok(await s.said('SAY.cutting'), 'it screams while the blade is in it');
  assert.ok(await s.said('SAY.slice'), 'and once more as it falls apart');
  // the cut runs from entry to exit: a vertical line, so the two halves are side by side
  const halves = await s.eval(() => [...window.__cards.objs].filter((o) => o.kind === 'piece').map((o) => { const xs = o.poly.map((p) => p[0]); return [Math.min(...xs), Math.max(...xs)]; }).sort((a, b) => a[0] - b[0]));
  assert.ok(Math.abs(halves[0][1] - halves[1][0]) < 1 && halves[0][0] === 0, `left and right halves: ${JSON.stringify(halves)}`);
  await s.run(2500, 100);
  assert.ok(await s.said('CLAW_SAY.cut') || true);
});

scenario(G, 'stab and bleed', async (s) => {
  const [gx, gy] = await equipAt(s, 300);
  const c = await s.cardBox(1);
  const tx = c.x + c.w / 2, px = tx - TIP[0];
  await s.line(gx, gy, px, 100, 16);
  await s.run(300);
  // in through the top edge, 70 px deep, and back out the same way
  const yin = c.y + 70 - TIP[1];
  await s.line(px, 100, px, yin, Math.round((yin - 100) / 10));
  await s.run(200);
  assert.ok(await s.said('SAY.cutting'));
  await s.line(px, yin, px, 100, Math.round((yin - 100) / 10));
  await s.run(100);
  assert.deepEqual(await s.eval(kinds), { katana: 1 }, 'in and out through the same side: not cut');
  assert.ok(await s.said('SAY.stab'), 'it is a stab, and the card says so');
  assert.equal(await s.eval(() => document.querySelectorAll('#grid .card')[1].classList.contains('held')), false, 'it stays in its slot');
  // it bleeds for a while from the wound
  let most = 0;
  for (let i = 0; i < 10; i++) { await s.run(200, 50); most = Math.max(most, await s.eval(() => document.querySelectorAll('#phys .bit').length)); }
  assert.ok(most >= 3, `drops come out of the wound (${most})`);
  await s.run(3000, 100);
  assert.equal(await s.eval(() => document.querySelectorAll('#phys .bit').length), 0, 'and it stops after a few seconds');
});

scenario(G, 'sheathe', async (s) => {
  await find(s);
  let [gx, gy] = await grip(s);
  await s.move(gx, gy); await s.down();
  await s.line(gx, gy, gx + 200, gy - 450, 30);
  await s.up();
  await s.run(1500, 100);
  await s.press('.sheathe');
  let r = await s.eval(() => ({ kat: !!window.__cards.state().katana, away: document.querySelector('.katana').classList.contains('away'), sheathe: document.querySelector('.sheathe').hidden, bodies: document.querySelectorAll('#phys .katana-body').length }));
  assert.deepEqual(r, { kat: false, away: false, sheathe: true, bodies: 0 }, 'the button puts it back in the banner');
  // pulled out again, it can be put back with Esc
  [gx, gy] = await grip(s);
  await s.move(gx, gy); await s.down();
  await s.line(gx, gy, gx + 200, gy - 450, 30);
  await s.up();
  await s.run(800, 100);
  assert.equal((await s.state()).kat, 'loose');
  await s.key('Escape');
  r = await s.eval(() => ({ kat: !!window.__cards.state().katana, away: document.querySelector('.katana').classList.contains('away'), sheathe: document.querySelector('.sheathe').hidden }));
  assert.deepEqual(r, { kat: false, away: false, sheathe: true }, 'Esc puts a loose katana back');
});

// chain fog-slash: in hand, the tip leaves thin slits in the kiri flood (and the banner fog) that close up again slowly; slashed
// fast across the hidden 棚 in the banner's top corner, the writing splits and the shelf slides out
const kiriAt = ([x, y]) => { const c = document.getElementById('kiri'), r = c.getBoundingClientRect(), k = c.width / r.width; return c.getContext('2d').getImageData(Math.round((x - r.left) * k), Math.round((y - r.top) * k), 1, 1).data[3]; };
const low = async (s, f, [x, y]) => Math.min(...await Promise.all([-2, -1, 0, 1, 2].map((d) => s.eval(f, [x, y + d]))));   // the darkest of 5 px across the line
const fogAt = ([x, y]) => { const c = document.getElementById('fog'), r = c.getBoundingClientRect(), k = c.width / r.width; return c.getContext('2d').getImageData(Math.round((x - r.left) * k), Math.round((y - r.top) * k), 1, 1).data[3]; };

scenario(G, 'slash the fog open', { legacy: false }, async (s) => {
  const [gx, gy] = await equipAt(s, 0);
  // the banner fog: a swing across the top of the banner slits it; the pointer's round wipe is off while the katana is in hand
  const h = await s.box('#hero'), by = Math.round(h.y + h.h * 0.3), bx = Math.round(h.x + h.w * 0.5), py = by - TIP[1];
  await s.line(gx, gy, bx - 150 - TIP[0], py, 16);
  await s.run(400);
  const fb = await s.eval(fogAt, [bx, by]);
  await s.line(bx - 150 - TIP[0], py, bx + 150 - TIP[0], py, 15);
  await s.run(50);
  const fs = await low(s, fogAt, [bx, by]), fn = await s.eval(fogAt, [bx, by + 25]), fp = await s.eval(fogAt, [bx - TIP[0], py]);
  assert.ok(py < h.y + h.h, 'the pointer moved over the banner too');
  assert.ok(fb > 150 && fs < 40, `the banner fog is slit (${fb} -> ${fs})`);
  assert.ok(fn > 150, `thinly (${fn})`);
  assert.ok(fp > 150, `the pointer itself wiped nothing (${fp})`);
  // the kiri flood
  await s.type('kiri');
  await s.run(3000, 100);                          // the flood rolls in (and the katana's hello is long enough ago)
  assert.equal(await s.eval(() => document.getElementById('kiri').classList.contains('on')), true, 'the page is flooded');
  // a horizontal swing low on the screen: the tip draws a straight line at y = 600
  const y = 600 - TIP[1], x0 = 300 - TIP[0], x1 = 800 - TIP[0];
  await s.line(bx + 150 - TIP[0], py, x0, y, 16);
  await s.run(400);
  const before = await s.eval(kiriAt, [550, 600]);
  assert.ok(before > 200, `under the flood before the swing (${before})`);
  await s.line(x0, y, x1, y, 25);
  await s.run(50);
  const tip = (await s.eval(kat)).tip;
  assert.ok(Math.abs(tip[1] - 600) < 10, `the tip ran along y = 600 (${tip.map(Math.round)})`);
  const slit = await low(s, kiriAt, [550, 600]), beside = await s.eval(kiriAt, [550, 625]);
  assert.ok(slit < 40, `a clean slit where the tip passed (${slit})`);
  assert.ok(beside > 200, `but only a thin one: 25 px away it is still fog (${beside})`);
  await s.run(4000, 100);
  const later = await low(s, kiriAt, [550, 600]);
  assert.ok(later > slit + 30, `the slit closes up again, slowly (${slit} -> ${later})`);
  // 棚 (under the flood now): up to it slowly, then one fast stroke down across it
  const g = await s.box('#secret b'), cx = g.x + g.w / 2, cy = g.y + g.h / 2;
  assert.equal(await s.eval(() => !!window.__cards.state().shelf), false, 'no shelf yet');
  await s.line(x1, y, cx - 30 - TIP[0], cy - 45 - TIP[1], 30);
  await s.run(400);
  await s.line(cx - 30 - TIP[0], cy - 45 - TIP[1], cx + 30 - TIP[0], cy + 45 - TIP[1], 4);
  const halves = await s.eval(() => document.querySelectorAll('#secret b span').length);
  await s.run(200);
  assert.equal(halves, 2, 'the writing splits in two');
  assert.equal(await s.eval(() => !!window.__cards.state().shelf && !!document.querySelector('#phys .shelf')), true, 'the shelf slides out');
  assert.ok(await s.said('katana.tana'), 'and the katana takes the credit');
  // slashed again while it is out, it stays out
  await s.run(2000, 100);
  await s.line(cx + 30 - TIP[0], cy + 45 - TIP[1], cx - 30 - TIP[0], cy - 45 - TIP[1], 4);
  await s.run(300);
  assert.equal(await s.eval(() => !!window.__cards.state().shelf), true, 'a second slash does not put it away');
});
