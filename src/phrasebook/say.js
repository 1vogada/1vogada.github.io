// Phrase-say: in the open phrasebook, select a line (a chip) and the one who owns it says it out loud, beside the menu.
//  - a card line: a card (a loose one off the page if there is one, else one from the grid, copied) peeks out from behind the
//    menu's left edge, trembling, and shouts it. A katana line: the katana slides out the same way and says it, coolly.
//    When the margin beside the menu is too narrow to peek out of, it comes in from the screen's left edge, over the menu's edge.
//  - a hand line: the hand (a drawn copy, so the arm on the page is left alone) pokes in over the menu's right edge and says it.
//    While the hand is raiding the menu (./raid.js), the raiding hand says it instead.
//  - an old-hand line: an old hand creeps in over the menu's left edge and says it, if one is about on the page.
//  - a line you have never heard (on this visit): its owner comes out all the same and refuses ('card.notyet', 'katana.notyet',
//    'hand.notyet', 'sev.notyet'). When the owner is not about (no old hand on the page, or the hand has not shown itself yet):
//    a toast says nobody is there to say it ('toast.sayNobody').
// "Heard" is every bubble's text that went up on this visit, through core/speech.js onSaid (the said-hook), kept in
// sessionStorage 'kiripad-heard' (at most TUNE.phraseSay.MAX texts). One line at a time; closing the menu takes it all away.
// The selection must sit still TUNE.phraseSay.SETTLE_MS with no button held (as scenes/word.js; that egg stays off while the
// menu is open). Never in crazy mode or under reduced motion.
// Motion: one clock.frames loop on wall time (clock.wall()); bubbles are sayAt on the speakers 'pbsCard' (pb-say scream),
// 'pbsHand' (pb-say hand), 'pbsPlain' (pb-say), in a fixed layer over the menu (z-index 48, as the raid's); the peeking card sits
// in a child layer clipped to outside the menu's card, so it comes out from behind it. The drawn hands are claw SVGs with
// .pb-raid (z-index 47 / 49).
// Random draws, only on this path: the card picked, the refusal line, the bubble's tilt, 2 per frame while a hand is drawn.
// Emits 'phrasebook.spoke' { key, text, who, heard } after the bubble went up.
import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { allLines, line, pick } from '../core/lines.js';
import { defineSpeaker, sayAt, onSaid } from '../core/speech.js';
import { hook } from '../core/debug.js';
import { world, isCrazy } from '../world/world.js';
import { handParts, handDraw } from '../actors/hand/draw.js';
import { awake as handAwake, POSES as ARM_POSES } from '../actors/hand/index.js';
import { list as olds, POSES as OLD_POSES } from '../actors/severed/index.js';
import { katanaSvg } from '../actors/katana.js';
import * as menu from './menu.js';
import * as raid from './raid.js';

const P = TUNE.phraseSay, STORE = 'kiripad-heard';
// who owns a list (its `who` in src/lines/*.js) -> who comes out to say it
const OWNER = { card: 'card', button: 'card', katana: 'katana', hand: 'hand', raid: 'hand', sev: 'old' };
const SPEAKER = { card: 'pbsCard', katana: 'pbsPlain', hand: 'pbsHand', old: 'pbsHand' };
const REFUSE = { card: 'card.notyet', katana: 'katana.notyet', hand: 'hand.notyet', old: 'sev.notyet' };

let app = { reduced: false }, layer = null, behind = null, cur = null, wait = null, down = false, lastChip = null;
const heard = new Set();
try { for (const t of JSON.parse(sessionStorage.getItem(STORE) || '[]')) heard.add(t); } catch (e) {}

/** the said-hook: every bubble's words are a line you have now heard */
function remember({ text }) {
  if (!text || heard.has(text)) return;
  heard.add(text);
  if (heard.size > P.MAX) heard.delete(heard.values().next().value);
  try { sessionStorage.setItem(STORE, JSON.stringify([...heard])); } catch (e) {}
}

const vw = () => document.documentElement.clientWidth;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = (k) => 1 - Math.pow(1 - k, 3);
const elOf = (n) => (n && n.nodeType === 1 ? n : n ? n.parentElement : null);
const squash = (s) => s.replace(/\s+/g, '');

/** the chip the selection is on: { chip, key, text, rect }, or null (no selection, across chips, outside the menu) */
function picked() {
  if (!menu.isOpen() || !menu.scroller) return null;
  const sel = typeof getSelection === 'function' ? getSelection() : null;
  if (!sel || sel.rangeCount !== 1 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0), from = elOf(range.startContainer), chip = from && from.closest('.pb-chip');
  if (!chip || !menu.scroller.contains(chip)) return null;
  const said = squash(sel.toString());
  if (!said || said.length > squash(chip.textContent).length) return null;   // it runs on into the next chip: not one line
  const b = chip.querySelector('b'), entry = chip.closest('[data-key]');
  if (!b || !entry) return null;
  return { chip, key: entry.dataset.key, text: b.textContent, rect: chip.getBoundingClientRect() };
}

// ---- the layer over the menu, and the one behind its edge ----
function layers(R) {
  if (!layer) {
    layer = document.createElement('div'); layer.setAttribute('aria-hidden', 'true');
    Object.assign(layer.style, { position: 'fixed', inset: '0', zIndex: '48', pointerEvents: 'none', overflow: 'hidden' });
    behind = document.createElement('div');
    Object.assign(behind.style, { position: 'absolute', inset: '0' });
    layer.appendChild(behind);
  }
  if (!layer.isConnected) document.body.appendChild(layer);
  // everything but the menu's card: what peeks out of behind it shows only past its edge
  const W = vw(), H = innerHeight, f = (v) => v.toFixed(0);
  behind.style.clipPath = `path(evenodd, "M0 0H${f(W)}V${f(H)}H0Z M${f(R.left)} ${f(R.top)}H${f(R.right)}V${f(R.bottom)}H${f(R.left)}Z")`;
}

// ---- who comes out ----
/** a copy of a card: a loose one off the page if there is one, else one from the grid. @returns { node, w, h } */
function cardCopy() {
  const loose = [...world.bodies].filter((o) => o.kind === 'card' && !o.root && o.el);
  const grid = [...document.querySelectorAll('#grid .card')];
  const src = loose.length ? pick(loose).el : grid.length ? pick(grid) : null;
  let node, w = 300, h = 170;
  if (src) {
    w = src.offsetWidth || w; h = src.offsetHeight || h;
    node = src.cloneNode(true); node.removeAttribute('id'); node.querySelectorAll('[id]').forEach((e) => e.removeAttribute('id'));
    node.classList.remove('held', 'grab-ready', 'pulling', 'regrow', 'picked', 'settled');
    node.removeAttribute('style'); node.removeAttribute('data-key');
  } else { node = document.createElement('div'); node.className = 'card'; }
  node.inert = true;
  return { node, w, h };
}
/** the katana's drawing, lying flat: hilt left, tip towards the menu */
function katanaCopy() {
  const node = document.createElement('div'); node.innerHTML = katanaSvg('pbs-kat');
  return { node, w: 40, h: 300, rot: -90 };
}

/** something flat (a card, the katana) that peeks out from behind the menu's left edge at height y */
function peeker({ node, w, h, rot = 0 }, R, y) {
  const flat = rot !== 0, s = P.CARD_W / (flat ? h : w), cw = P.CARD_W, ch = (flat ? w : h) * s, vh = innerHeight;
  const vis = cw * P.SHOW, wide = R.left >= vis + P.GAP_PX;
  const yy = clamp(y, Math.min(vh - ch / 2 - 8, R.top + ch / 2 + P.TOP_PX), vh - ch / 2 - 8);
  const x1 = wide ? R.left - vis + cw / 2 : vis - cw / 2, x0 = wide ? R.left + cw / 2 + 4 : -cw / 2 - 20;
  Object.assign(node.style, { position: 'absolute', left: '0', top: '0', width: w + 'px', height: h + 'px', margin: '0', transformOrigin: '0 0',
    pointerEvents: 'none', animation: 'none', transition: 'none', opacity: '1', visibility: 'visible', boxShadow: flat ? 'none' : '0 14px 30px rgba(0, 0, 0, .28)' });
  (wide ? behind : layer).appendChild(node);
  let talking = false;
  return {
    mouth: () => [wide ? R.left - vis / 2 : vis / 2, yy - ch / 2 - P.BUBBLE_DY],
    talk() { talking = true; },
    draw(k, t) {
      const x = x0 + (x1 - x0) * k, r = rot + P.TILT * k + (talking ? Math.sin(t / 45) * P.SHAKE : 0);
      node.style.transform = `translate(${x.toFixed(1)}px, ${yy.toFixed(1)}px) rotate(${r.toFixed(2)}deg) scale(${s.toFixed(4)}) translate(${-w / 2}px, ${-h / 2}px)`;
    },
    remove() { node.remove(); },
  };
}

/** the hand, drawn on its arm, poking in over the menu's right edge at height y */
function armHand(R, y) {
  const W = vw(), yy = clamp(y, R.top + P.HAND_DY + 10, innerHeight - 60), x0 = W + 200, x1 = Math.min(W - 40, R.right - P.HAND_IN);
  const c = { ...handParts('pb-raid'), x: x0, y: yy, a: Math.PI, sh: yy + 70, pose: { ...ARM_POSES.eager } };
  let mood = null;
  return {
    mouth: () => [x1 - 30, yy - P.HAND_DY],
    talk(knows) { mood = knows ? 'joy' : 'point'; c.pose = { ...ARM_POSES[mood] }; },
    draw(k, t) {
      c.x = x0 + (x1 - x0) * k;
      c.a = Math.PI + (mood === 'point' ? Math.sin(t / 110) * 0.22 : 0);   // a wagging finger
      handDraw(c, mood ? 0 : 0.3, 0, 0);
    },
    remove() { c.under.remove(); c.over.remove(); },
  };
}

/** an old hand (no arm), creeping in over the menu's left edge at height y */
function oldHand(R, y) {
  const yy = clamp(y, R.top + P.HAND_DY + 10, innerHeight - 60), x1 = Math.max(60, R.left + P.OLD_IN - 110), x0 = -160;
  const c = { ...handParts('sev pb-raid'), arm: false, m: -1, x: x0, y: yy, a: 0, sh: 0, pose: { legs: 0, ...OLD_POSES.grip }, gait: 0, reach: 100 };
  return {
    mouth: () => [x1 + 30, yy - P.HAND_DY + 15],
    talk(knows) { c.pose = { ...(knows ? OLD_POSES.joy : OLD_POSES.sneak), legs: 0 }; },
    draw(k) { c.x = x0 + (x1 - x0) * k; handDraw(c, 0, 0, 0); },
    remove() { c.under.remove(); c.over.remove(); },
  };
}

// ---- one line: out, say it (or refuse), back ----
function stop() { if (cur) cur.end(); }
function spoke(p, who, knows, text) { bus.emit('phrasebook.spoke', { key: p.key, text, who, heard: knows }); }
function nobody() { bus.emit('ui.toast', { msg: line('toast.sayNobody') }); }

function run(act, who, p, knows) {
  let phase = 'in', at = clock.wall(), hold = 0, bubble = null, off = null;
  const me = cur = { who, end() { if (off) off(); act.remove(); if (bubble) bubble.remove(); if (cur === me) cur = null; } };
  act.draw(0, at, phase);
  off = clock.frames(() => {
    if (cur !== me) return false;
    const t = clock.wall(), e = t - at;
    let k = 1;
    if (phase === 'in') {
      k = ease(Math.min(1, e / P.IN_MS));
      if (e >= P.IN_MS) {
        phase = 'hold'; at = t; k = 1;
        const [bx, by] = act.mouth();
        bubble = sayAt(bx, by, knows ? p.key : REFUSE[who], { as: SPEAKER[who], text: knows ? p.text : null });
        Object.assign(bubble.style, { whiteSpace: 'normal', width: 'max-content', maxWidth: Math.min(P.BUBBLE_W, vw() - 24) + 'px', textAlign: 'center' });   // a long shout wraps on a phone
        const bw = bubble.offsetWidth, x = clamp(bx, bw / 2 + 8, vw() - bw / 2 - 8);
        bubble.style.translate = `calc(${x.toFixed(0)}px - 50%) ${Math.max(8, by).toFixed(0)}px`;
        hold = parseFloat(bubble.style.getPropertyValue('--say')) || 0;
        act.talk(knows);
        spoke(p, who, knows, bubble.textContent);
      }
    } else if (phase === 'hold') {
      if (e >= hold) { phase = 'out'; at = t; }
    } else {
      k = 1 - ease(Math.min(1, e / P.OUT_MS));
      if (e >= P.OUT_MS) { bubble = null; off = null; me.end(); return false; }
    }
    act.draw(k, t, phase);
  });
}

/** the line on chip p is picked: its owner comes out and says it, or refuses */
function say(p) {
  if (app.reduced || isCrazy() || cur) return;
  const d = allLines().find((x) => x.key === p.key);
  const who = OWNER[d ? d.who : p.key.split('.')[0]] || 'card', knows = heard.has(p.text);
  const R = menu.q('.pb-card').getBoundingClientRect(), y = p.rect.top + p.rect.height / 2;
  if (who === 'hand') {
    if (!handAwake()) return nobody();
    if (raid.state()) {   // it is in the menu already: the raiding hand says it
      const el = raid.speak(knows ? p.key : REFUSE.hand, knows ? p.text : line(REFUSE.hand));
      if (el) return spoke(p, who, knows, el.textContent);
    }
    layers(R); return run(armHand(R, y), who, p, knows);
  }
  if (who === 'old') { if (!olds.size) return nobody(); layers(R); return run(oldHand(R, y), who, p, knows); }
  layers(R);
  return run(peeker(who === 'katana' ? katanaCopy() : cardCopy(), R, y), who, p, knows);
}

// the selection has to sit still a moment, with no button held, before it counts (a drag across the chips is not a pick)
function later() {
  if (wait) wait();
  wait = clock.real.after(P.SETTLE_MS, () => {
    wait = null; if (down) return;
    const p = picked();
    if (!p) { lastChip = null; return; }
    if (p.chip === lastChip || cur) return;   // the same pick still standing, or someone is still talking
    lastChip = p.chip;
    say(p);
  });
}

export function install(a) {
  app = a || app;
  if (app.reduced) return;
  onSaid(remember);
  const where = () => layer;
  defineSpeaker('pbsCard', { kinds: [], cls: 'pb-say scream', gate: 'plain', layer: where, life: 'wall', layout: false });
  defineSpeaker('pbsHand', { kinds: [], cls: 'pb-say hand', gate: 'plain', layer: where, life: 'wall', layout: false });
  defineSpeaker('pbsPlain', { kinds: [], cls: 'pb-say', gate: 'plain', layer: where, life: 'wall', layout: false });
  document.addEventListener('selectionchange', () => { if (menu.isOpen()) later(); });
  document.addEventListener('pointerdown', () => { down = true; }, true);
  document.addEventListener('pointerup', () => { down = false; if (menu.isOpen()) later(); }, true);
  bus.on('phrasebook.closed', () => { stop(); lastChip = null; if (wait) { wait(); wait = null; } if (layer) layer.remove(); });
  hook('__phrasesay', { heard: () => [...heard], busy: () => (cur ? cur.who : null) });
}
