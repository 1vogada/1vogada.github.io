// 幕 The stage: a secret menu that plays every animation of every feature on the page, on demand. Typing maku (or まく, 幕,
// сцена) anywhere on the page, entering one of them in the search box, or kiri.maku() in the console raises the curtain.
// Not the phrasebook (that one lists what is said): this one lists what happens, and plays it.
//
// The menu is one big card over the tinted page, like the phrasebook. Press ▶ on an act and the card steps aside: a small bar
// stays at the bottom left (what is playing, again, next, the list, stop) while a ghost pointer (./rig.js) plays your part on the
// real page. "Play all" plays a whole part, one act after another. Before every act the scene is set the same way (setScene):
// cards back in their slots, no cut-off hands, the arm back off the page, no flood, no menus.
// While the stage is up nothing counts as found or heard (core/rehearsal.js), so it spoils no secret and no blotted line.
// The acts are in ./acts/<part>.js: { id, title, how, play(r, app), tail }. See docs/recipes.md "Add an act to the stage".
// Emits 'secret.found' { name: 'stage' } the first time it opens (page/stamps.js has a stamp for it). Draws no Math.random itself.
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { hook } from '../core/debug.js';
import { rehearse } from '../core/rehearsal.js';
import { defineCommand } from '../core/commands.js';
import { world, remove, reset as resetCards, isCrazy } from '../world/world.js';
import { current as sceneNow } from '../scenes/scene.js';
import { closeFortune } from '../scenes/fortune.js';
import { rig, STOP } from './rig.js';
import { PARTS } from './acts/index.js';

const VER = 1;
const WORDS = ['maku', 'まく', '幕', 'сцена'];
const here = import.meta.url;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let app = null, el = null, bar = null, scroller = null, opened = false, lastFocus = null, cur = null, last = null, queue = [], found = false;
const ACTS = () => PARTS.flatMap((p) => p.acts.map((a) => ({ ...a, part: p })));
const q = (s) => el.querySelector(s);

function css() {
  if (document.getElementById('sc-css')) return;
  const l = document.createElement('link'); l.id = 'sc-css'; l.rel = 'stylesheet'; l.href = new URL('../../styles/showcase.css?v=' + VER, here).href;
  document.head.appendChild(l);
}

function build() {
  const n = ACTS().length;
  const tabs = PARTS.map((p) => `<button type="button" class="sc-tab" data-to="${esc(p.id)}">${esc(p.title)}</button>`).join('');
  let body = '';
  if (app.reduced) body = '<p class="sc-intro">Nothing on this page moves while your system asks for reduced motion, so there is nothing to play. Switch that setting off and come back.</p>';
  else for (const p of PARTS) {
    body += `<section class="sc-sec" id="sc-${esc(p.id)}"><header class="sc-sec-h"><h3>${esc(p.title)}</h3><span class="sc-pill">${p.acts.length} acts</span><button type="button" class="sc-all" data-part="${esc(p.id)}">▶ Play all</button></header>`;
    if (p.intro) body += `<p class="sc-intro">${esc(p.intro)}</p>`;
    body += '<div class="sc-grid">';
    for (const a of p.acts) body += `<article class="sc-act" data-act="${esc(a.id)}"><div class="sc-act-h"><h4>${esc(a.title)}</h4><button type="button" class="sc-play" data-act="${esc(a.id)}" aria-label="Play ${esc(a.title)}">▶</button></div><p class="sc-how"><b>For real</b> ${esc(a.how)}</p>${a.shortcut ? `<p class="sc-cut"><b>Here</b> ${esc(a.shortcut)}</p>` : ''}</article>`;
    body += '</div></section>';
  }
  return { tabs, body, n };
}

function make() {
  css();
  el = document.createElement('div'); el.className = 'sc'; el.hidden = true;
  el.innerHTML = `<div class="sc-shade"></div><div class="sc-card" role="dialog" aria-modal="true" aria-labelledby="sc-title">
    <div class="sc-top"><div class="sc-top-row"><div><h2 id="sc-title"><span class="sc-seal">幕</span> The stage</h2><p class="sc-sub">Every animation on this page, played on demand. <span class="sc-count"></span></p></div>
    <button type="button" class="btn ghost sc-x">Close</button></div><nav class="sc-tabs" aria-label="Parts"></nav></div>
    <div class="sc-scroll" tabindex="-1"></div></div>`;
  document.body.appendChild(el);
  scroller = q('.sc-scroll');
  q('.sc-shade').addEventListener('click', close);
  q('.sc-x').addEventListener('click', close);
  q('.sc-tabs').addEventListener('click', (e) => { const b = e.target.closest('.sc-tab'); if (!b) return; const s = q('#sc-' + b.dataset.to); if (s) scroller.scrollTo({ top: s.offsetTop - 6, behavior: 'smooth' }); });
  scroller.addEventListener('scroll', () => el.classList.toggle('scrolled', scroller.scrollTop > 4));
  scroller.addEventListener('click', (e) => {
    const b = e.target.closest('.sc-play, .sc-all'); if (!b) return;
    if (b.classList.contains('sc-all')) { const p = PARTS.find((x) => x.id === b.dataset.part); if (p) start(p.acts.map((a) => a.id)); }
    else start([b.dataset.act]);
  });
  // the bar that stays while an act plays
  bar = document.createElement('div'); bar.className = 'sc-bar'; bar.hidden = true; bar.setAttribute('role', 'status');
  bar.innerHTML = `<span class="sc-dot" aria-hidden="true"></span><span class="sc-now"><b class="sc-title"></b><i class="sc-step"></i></span>
    <span class="sc-btns"><button type="button" class="sc-b" data-do="again" title="Play it again">↻</button><button type="button" class="sc-b" data-do="next" title="Next act">⏭</button>
    <button type="button" class="sc-b" data-do="list" title="Back to the list">☰</button><button type="button" class="sc-b" data-do="stop" title="Stop and close the stage">✕</button></span>`;
  document.body.appendChild(bar);
  bar.addEventListener('click', (e) => {
    const b = e.target.closest('.sc-b'); if (!b) return;
    const d = b.dataset.do;
    if (d === 'again' && last) start([last.id, ...queue]);
    else if (d === 'next') { const all = ACTS(), i = last ? all.findIndex((a) => a.id === last.id) : -1; if (queue.length) start(queue); else if (all[i + 1]) start([all[i + 1].id]); else { halt(); list(); } }
    else if (d === 'list') { halt(); list(); }
    else if (d === 'stop') { halt(); hideBar(); end(); }
  });
}

/** the list in front again (an act that is playing goes on behind it until you pick another) */
function list() { open(); }

export function open() {
  if (!el) make();
  if (!found) { found = true; bus.emit('secret.found', { name: 'stage' }); }
  rehearse(true);
  if (opened) return;
  opened = true; lastFocus = document.activeElement;
  const b = build(); q('.sc-tabs').innerHTML = b.tabs; scroller.innerHTML = b.body; q('.sc-count').textContent = `${b.n} acts in ${PARTS.length} parts.`;
  el.hidden = false; document.documentElement.classList.add('sc-lock');
  if (cur) { const a = scroller.querySelector(`[data-act="${cur.act.id}"]`); if (a) a.scrollIntoView({ block: 'center' }); }
  clock.nextFrame(() => el.classList.add('in'));
  scroller.focus({ preventScroll: true });
  bus.emit('stage.opened', {});
}
export function close() {
  if (!opened) return;
  opened = false; el.classList.remove('in'); document.documentElement.classList.remove('sc-lock');
  clock.real.after(220, () => { if (!opened) el.hidden = true; });
  if (!cur) end();
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  bus.emit('stage.closed', {});
}
/** the stage is down: things count as found again */
function end() { if (!opened && (!bar || bar.hidden)) rehearse(false); }
function hideBar() { if (bar) { bar.hidden = true; bar.classList.remove('done', 'failed'); } }

/** before every act: the same empty scene */
async function setScene(r) {
  if (isCrazy() && app.crazy) app.crazy.setCrazy(false);
  if (app.phrasebook && app.phrasebook.close) app.phrasebook.close();
  if (app.kiri && app.kiri.floodState && app.kiri.floodState()) app.kiri.lift();
  const sc = sceneNow(); if (sc && sc.kill) sc.kill();
  const omi = document.getElementById('omikuji'); if (omi && !omi.hidden) { if (sceneNow()) { omi.hidden = true; bus.emit('slip.closed', { how: 'stage' }); } else closeFortune('stage'); }
  if (world.b2) {
    for (const o of [...world.bodies]) if (o.kind === 'hand' || o.kind === 'toast') remove(o);
    resetCards();
    if (app.katana && world.blade && !world.blade.root && app.katana.putBack) app.katana.putBack();
    if (app.shelf && app.shelf.state && app.shelf.state()) app.shelf.toggle();
  }
  if (app.hand && app.hand.reset) app.hand.reset();
  if (app.ghost && app.ghost.reset) app.ghost.reset();   // a ghost raised by an earlier act (the arm ate an old hand)
  await r.wait(80);
}

/** stop what is playing (the act's clean-ups run) */
function halt() { queue = []; if (cur) { cur.r.end(); cur = null; } }

async function start(ids) {
  if (!el) make();
  halt();
  const all = ACTS(), next = ids.map((id) => all.find((a) => a.id === id)).filter(Boolean);
  if (!next.length) return;
  const [act, ...rest] = next; queue = rest.map((a) => a.id);
  close(); rehearse(true);
  const r = rig(app), me = { act, r }; last = act;
  cur = me;
  bar.hidden = false; bar.classList.remove('done', 'failed');
  bar.querySelector('.sc-title').textContent = act.title;
  bar.querySelector('.sc-step').textContent = `${act.part.title} · ${all.indexOf(act) + 1} of ${all.length}`;
  let ok = true;
  try {
    await setScene(r);
    await act.play(r, app);
    await r.wait(act.tail ?? 2500);
  } catch (e) {
    if (e !== STOP) { ok = false; console.warn('[stage] ' + act.id, e); } else console.warn('[stage] stopped ' + act.id, e.stack);   // eslint-disable-line no-console
  }
  if (cur !== me) return;   // another act took over
  r.end(); cur = null;
  bar.classList.add(ok ? 'done' : 'failed');
  bar.querySelector('.sc-step').textContent = ok ? (queue.length ? 'next act in a moment…' : 'done. ↻ again, ☰ the list') : 'this one could not play here';
  if (queue.length) { const q2 = queue.slice(); await clock.real.sleep(1200); if (!cur && queue.join() === q2.join()) start(q2); }
}

/** test hooks and the stage's state */
const state = () => ({ open: opened, playing: cur ? cur.act.id : null, queue: queue.slice(), bar: bar ? (bar.hidden ? 'hidden' : bar.classList.contains('failed') ? 'failed' : bar.classList.contains('done') ? 'done' : 'playing') : 'hidden' });

export function install(a) {
  app = a;
  let typed = '';
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.matches && e.target.matches('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.key === 'Escape' && opened) { e.stopPropagation(); close(); if (!cur) hideBar(); return; }
    if (e.key.length !== 1) return;
    typed = (typed + e.key.toLowerCase()).slice(-8);
    if (WORDS.some((w) => typed.endsWith(w))) { typed = ''; open(); }
  }, true);
  const box = document.getElementById('q');
  if (box) box.addEventListener('keydown', (e) => { if (e.key === 'Enter' && WORDS.includes(box.value.trim().toLowerCase())) { e.preventDefault(); e.stopImmediatePropagation(); box.value = ''; box.dispatchEvent(new Event('input')); box.blur(); open(); } }, true);
  defineCommand('maku', { about: 'raises the curtain', hidden: true, run: () => { open(); return '幕 the stage is up.'; } });
  hook('__stage', { open, close, play: (id) => start([id]), all: (part) => { const p = PARTS.find((x) => x.id === part); if (p) start(p.acts.map((x) => x.id)); }, stop: () => { halt(); hideBar(); end(); }, state, acts: () => ACTS().map((x) => ({ id: x.id, part: x.part.id, title: x.title })) });
}
