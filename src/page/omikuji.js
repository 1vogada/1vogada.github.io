// The Konami code (↑ ↑ ↓ ↓ ← → ← → B A, typed anywhere but a text box): every grid card folds itself into an omikuji slip
// for the rest of the visit (sessionStorage). Rip one out of its slot and it unfolds and reads you its fortune, drawn from the
// Surprise me slips ('fortune.slip', thinned for English-only like scenes/fortune.js does); a 凶 complains about it after. Yank
// one so hard it tears and both halves read 凶. Nothing hints at it. Typing the code emits 'secret.found' { name: 'konami' } (page/stamps.js).
// The slip is a layer inside the card (styled inline: styles/*.css stay as they were); torn-out copies keep it, since the
// physics layer clones the card with its children. The arrow keys still scroll the page and nothing is prevented, so
// page/kiri.js's typed words and the phrasebook's keys are untouched. Random draws only on this path: the toast's line, and
// per ripped slip its fortune (one draw, two for 末吉), the card's line, and a 凶's line.
import { TUNE } from '../core/tune.js';
import { real } from '../core/clock.js';
import { bus } from '../core/bus.js';
import { line, list } from '../core/lines.js';
import { say } from '../core/speech.js';
import { world, isCrazy } from '../world/world.js';
import { thinFortunes } from './language.js';

const O = TUNE.omikuji, KEY = 'kiripad-omikuji';
const CODE = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
const MINCHO = '"Hiragino Mincho ProN", "Yu Mincho", "Noto Serif JP", serif';
const CURSE = '凶';
let on = false, FORTUNES = null;

/** is every card a slip (this visit) */
export const isOn = () => on;

/** one fortune, by weight (as scenes/fortune.js drawFortune): [kanji, name, [text, tooltip]] */
function draw() {
  if (!FORTUNES) FORTUNES = thinFortunes(list('fortune.slip').map((f) => [...f]));
  const total = FORTUNES.reduce((a, f) => a + f[3], 0);
  let r = Math.random() * total, f = FORTUNES[0];
  for (const x of FORTUNES) { if ((r -= x[3]) < 0) { f = x; break; } }
  const t = Array.isArray(f[2]) ? f[2][Math.floor(Math.random() * f[2].length)] : [f[2], ''];
  return [f[0], f[1], t];
}
const curseOf = () => { if (!FORTUNES) FORTUNES = thinFortunes(list('fortune.slip').map((f) => [...f])); const f = FORTUNES.find((x) => x[0] === CURSE) || FORTUNES[FORTUNES.length - 1]; return [f[0], f[1], [f[2], '']]; };

const css = (el, s) => { Object.assign(el.style, s); return el; };
const div = (s, text) => { const d = css(document.createElement('div'), s); if (text != null) d.textContent = text; return d; };

/** the folded slip laid over a grid card */
function fold(card) {
  if (card.querySelector(':scope > .omi-card')) return;
  const name = (card.querySelector('h3 a') || {}).textContent || '';
  const slip = div({ position: 'absolute', inset: '0', zIndex: '3', pointerEvents: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center',
    justifyContent: 'center', gap: '14px', padding: '18px 14px', textAlign: 'center', color: 'var(--text)', borderRadius: 'inherit',
    background: 'linear-gradient(90deg, transparent 0 33%, rgba(0,0,0,.035) 33% 34%, transparent 34% 66%, rgba(0,0,0,.035) 66% 67%, transparent 67%), ' +
      'color-mix(in srgb, var(--c1, var(--accent)) 5%, var(--surface))' });
  slip.className = 'omi-card'; slip.setAttribute('aria-hidden', 'true');
  slip.append(
    div({ position: 'absolute', left: '0', right: '0', top: '0', height: '12px', background: 'repeating-linear-gradient(90deg, var(--c1, var(--accent)) 0 8px, transparent 8px 12px)', opacity: '.75' }),
    div({ position: 'absolute', left: '0', right: '0', bottom: '0', height: '12px', background: 'repeating-linear-gradient(90deg, var(--c1, var(--accent)) 0 8px, transparent 8px 12px)', opacity: '.75' }),
    div({ position: 'absolute', left: '14px', top: '22px', width: '30px', height: '30px', borderRadius: '6px', background: 'var(--accent)', color: '#fff', display: 'grid',
      placeItems: 'center', fontWeight: '800', fontSize: '.95rem', rotate: '-8deg', boxShadow: 'inset 0 0 0 2px rgba(255,255,255,.25)' }, '霧'),
    css(div({ writingMode: 'vertical-rl', fontFamily: MINCHO, fontWeight: '800', fontSize: '1.3rem', letterSpacing: '.15em', color: 'var(--accent)', lineHeight: '1', whiteSpace: 'nowrap' }, 'おみくじ'), {}),
    div({ fontSize: '.72rem', fontWeight: '650', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, name),
  );
  // a paper band tied round the folded slip
  slip.appendChild(div({ position: 'absolute', left: '0', right: '0', top: '50%', height: '16px', marginTop: '-8px', background: 'color-mix(in srgb, var(--accent) 14%, transparent)',
    borderTop: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', borderBottom: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)', zIndex: '-1' }));
  card.appendChild(slip);
}
/** every card in the grid (the grid re-renders on search, data, mode) */
function foldAll() { if (!on || isCrazy()) return; document.querySelectorAll('#grid .card').forEach(fold); }

/** a torn-out slip opens: its fortune is written on it */
function unfold(o, f) {
  const slip = o.el && o.el.querySelector('.omi-card'); if (!slip) return;
  const [kanji, name, [text, tip]] = f;
  slip.replaceChildren(
    div({ fontFamily: MINCHO, fontWeight: '800', fontSize: '2.6rem', lineHeight: '1', letterSpacing: '.05em', color: kanji === CURSE ? 'var(--text)' : 'var(--accent)' }, kanji),
    div({ fontSize: '.7rem', fontWeight: '650', letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--muted)' }, name),
    div({ fontSize: '.86rem', lineHeight: '1.35', maxWidth: '100%' }, text),
  );
  slip.style.justifyContent = 'center'; slip.style.gap = '6px';
  if (tip) slip.lastChild.title = tip;
  slip.animate([{ transform: 'scaleY(.06)', opacity: 0.4 }, { opacity: 1, offset: 0.6 }, { transform: 'none', opacity: 1 }], { duration: O.UNFOLD_MS, easing: 'cubic-bezier(.2,1.2,.4,1)' });
}
const alive = (o) => world.bodies.has(o) && o.el && o.el.isConnected;

function ripped(o) {
  if (!on || !o || !o.el || !o.el.querySelector('.omi-card')) return;
  const f = draw();
  unfold(o, f);
  real.after(O.READ_MS, () => { if (alive(o)) say(o, 'card.omikuji', { mode: 'plain', text: `${line('card.omikuji')} ${f[0]} · ${f[1].split(' · ')[0]}` }); });
  if (f[0] === CURSE) real.after(O.CURSE_MS, () => { if (alive(o)) say(o, 'card.cursed', { mode: 'plain' }); });
}
function torn(mine, rest) {
  if (!on || !mine || !mine.el || !mine.el.querySelector('.omi-card')) return;
  const f = curseOf();
  unfold(mine, f); unfold(rest, f);
  real.after(O.TORN_MS, () => { if (alive(mine)) say(mine, 'card.tornslip', { mode: 'plain' }); });
}

function start() {
  if (isCrazy()) return;
  const first = !on;
  on = true; try { sessionStorage.setItem(KEY, '1'); } catch (e) {}
  foldAll();
  if (first) bus.emit('ui.toast', { msg: line('page.konami') });
  bus.emit('secret.found', { name: 'konami' });
}

export function install(app) {
  try { on = sessionStorage.getItem(KEY) === '1'; } catch (e) {}
  let at = 0;
  document.addEventListener('keydown', (e) => {
    if (e.target && e.target.matches && e.target.matches('input, textarea, [contenteditable]')) { at = 0; return; }
    const k = (e.key || '').toLowerCase();
    if (k === CODE[at]) at++; else at = k !== CODE[0] ? 0 : at === 2 ? 2 : 1;   // a third ↑ still leaves two ↑ typed
    if (at === CODE.length) { at = 0; start(); }
  });
  bus.on('cards.rendered', foldAll);
  bus.on('card.ripped', ({ card }) => ripped(card));
  bus.on('card.snapped', ({ mine, rest }) => torn(mine, rest));
  foldAll();
}
