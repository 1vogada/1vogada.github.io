// The stage, part "The phrasebook": see ../index.js and ./index.js for the act format, ../rig.js for the ghost pointer.
// The book (phrasebook/menu.js) is opened by the ghost with its button in the header, and closed after every act. While the
// stage plays, nothing in it is heard or found (core/rehearsal.js): the raid and phrase-say read your record of heard lines but
// write nothing to it, and the stage's look into the book leaves your "new since you last looked" mark where it was.
import { list } from '../../core/lines.js';
import { blot, hash } from '../../phrasebook/ink.js';
import { rehearseInk } from '../../phrasebook/heard.js';

const ID = 77;   // the ghost's pointerId (../rig.js)
const LANG = { ja: 'JP', bg: 'BG' };
const pb = () => document.querySelector('.pb');
const scroller = () => document.querySelector('.pb .pb-scroll');
const raidSt = (app) => app.raid.state();
/** a pointer event the ghost sends straight to el (for what it holds on to, wherever it goes) */
const send = (el, type, x, y) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, composed: true, pointerId: ID, pointerType: 'mouse', isPrimary: false, clientX: x, clientY: y, button: 0, buttons: type === 'pointerup' ? 0 : 1 }));

/** the ghost opens the book with its button; it is closed again when the act ends. calm: the hand is kept from raiding it */
async function openBook(r, app, calm) {
  r.after(() => { if (app.phrasebook.isOpen()) app.phrasebook.close(); const s = getSelection(); if (s) s.removeAllRanges(); });
  await r.click('#phrasebook');
  if (!(await r.until(() => app.phrasebook.isOpen() && pb() && !pb().hidden && pb().querySelector('.pb-chip'), 5000))) throw new Error('the book did not open');
  if (calm) app.raid.stop();   // its five seconds in the book are not counted
  await r.wait(500);
}
/** the hand comes in to raid the open book. real: wait the five seconds a visitor waits; else it is let in at once */
async function raid(r, app, real) {
  await r.awake();
  await openBook(r, app);
  if (!real) app.raid.start();
  if (!(await r.until(() => raidSt(app), real ? 7500 : 3000))) throw new Error('no raid');
}
/** the section of the book in view, as its tab would */
async function toSection(r, id) {
  const tab = document.querySelector(`.pb-tab[data-go="${id}"]`);
  if (tab) await r.click(tab);
  await r.wait(900);
}
/** the ghost drags across a line in the open book, selecting it (as you would with the mouse) */
async function select(r, chip) {
  const b = chip.querySelector('b'), t = b && b.firstChild; if (!t) throw new Error('no line');
  const sc = scroller(), cr = chip.getBoundingClientRect(), sr = sc.getBoundingClientRect();
  if (cr.top < sr.top + 40 || cr.bottom > sr.bottom - 40) { sc.scrollTo({ top: sc.scrollTop + cr.top - sr.top - sc.clientHeight / 2, behavior: 'smooth' }); await r.wait(700); }
  const bb = b.getBoundingClientRect(), y = bb.top + Math.min(bb.height, 22) / 2, n = 10, len = t.textContent.length;
  await r.glide(bb.left + 1, y); await r.down();
  const sel = getSelection(), rg = document.createRange(); rg.setStart(t, 0); rg.setEnd(t, 0); sel.removeAllRanges(); sel.addRange(rg);
  for (let k = 1; k <= n; k++) { await r.move(bb.left + (bb.width * k) / n, bb.top + (bb.height * k) / n / 2 + Math.min(bb.height, 22) / 4, 40); rg.setEnd(t, Math.round(len * k / n)); sel.removeAllRanges(); sel.addRange(rg); }
  await r.up();
  await r.glide(Math.min(innerWidth - 40, r.x + 160), r.y + 90);
}
/** chips of the lists whose key starts with prefix, written out (heard) or blotted */
const chips = (prefix, blotted) => [...document.querySelectorAll('.pb .pb-scroll .pb-entry[data-key] .pb-chip')]
  .filter((c) => c.closest('[data-key]').dataset.key.startsWith(prefix) && c.classList.contains('pb-blot') === blotted && !c.closest('#pb-diary'));
/** the line a chip stands for (a blot keeps only a hash of it) */
function textOf(chip) {
  if (!chip.classList.contains('pb-blot')) return chip.querySelector('b').textContent;
  const h = chip.dataset.ink, key = chip.closest('[data-key]').dataset.key;
  return list(key).find((s) => hash(s) === h) || null;
}
/** wait for phrase-say to be done with its line */
const quiet = (r, app) => r.until(() => !document.querySelector('.pb-say'), 9000);

export const PART = {
  id: 'book', title: 'The phrasebook',
  intro: 'The book of lines, and the hand that raids it.',
  acts: [
    { id: 'book-open', title: 'The phrasebook opens and closes',
      how: 'Press the translate sign in the header: every line the page can say, and what sets it off. Its ✕, a click beside it or Esc closes it.',
      tail: 1500,
      async play(r, app) {
        await openBook(r, app, true);
        await toSection(r, 'katana');
        await toSection(r, 'hand');
        await r.wait(600);
        await r.click('.pb-x');
        await r.until(() => pb().hidden, 2000);
      } },
    { id: 'book-raid-throw', title: 'The hand raids the book: it throws a line at the wall',
      how: 'Keep the phrasebook open for five seconds (once the hand is about): it reaches in, tears an entry out and throws it at the left edge, where it smashes.',
      shortcut: 'The stage wakes the hand without a rip and has it pick the throw (it picks at random).',
      async play(r, app) {
        await raid(r, app, true);
        app.raid.next('throw');
        await r.glide(innerWidth * 0.3, innerHeight * 0.3);
        if (!(await r.until(() => raidSt(app) && raidSt(app).broken >= 1, 20000))) throw new Error('nothing was thrown');
        await r.wait(2200);
      } },
    { id: 'book-raid-eat', title: 'The hand raids the book: it eats a line',
      how: 'Stay in the phrasebook while the hand raids it: now and then it drags an entry off to the right edge and eats it, crumbs flying.',
      shortcut: 'The stage lets the hand in at once (really after five seconds) and has it pick eating.',
      async play(r, app) {
        await raid(r, app, false);
        app.raid.next('eat');
        await r.glide(innerWidth * 0.3, innerHeight * 0.3);
        if (!(await r.until(() => raidSt(app) && raidSt(app).eaten >= 1, 20000))) throw new Error('nothing was eaten');
        await r.wait(1800);
      } },
    { id: 'book-raid-help', title: 'Help it rip a line in two',
      how: 'While the hand raids the book it may hold an entry out and ask for help: take the left end and pull to the left.',
      shortcut: 'The stage lets the hand in at once and has it ask for help.',
      async play(r, app) {
        await raid(r, app, false);
        app.raid.next('help');
        await r.glide(innerWidth * 0.3, innerHeight * 0.4);
        if (!(await r.until(() => raidSt(app) && raidSt(app).st === 'offer', 20000))) throw new Error('it did not ask');
        await r.wait(1300);
        const el = document.querySelector('.pb-offer'); if (!el) throw new Error('nothing held out');
        const b = el.getBoundingClientRect(), need = Math.min(150, b.width * 0.45), x0 = b.left + 24, y0 = b.top + b.height / 2;
        await r.glide(x0, y0); await r.down(); send(el, 'pointerdown', x0, y0);
        for (let k = 1; k <= 24 && raidSt(app) && !raidSt(app).ripped; k++) { const x = x0 - (need + 40) * Math.min(1, k / 20); await r.move(x, y0, 30); send(el, 'pointermove', x, y0); }
        await r.until(() => raidSt(app) && raidSt(app).ripped >= 1, 2000);
        send(el, 'pointerup', r.x, r.y); await r.up();
        await r.until(() => raidSt(app) && raidSt(app).eaten >= 1, 8000);
        await r.wait(1200);
      } },
    { id: 'book-raid-scroll', title: 'It yanks the page about',
      how: 'While the hand raids the book it may take the scrollbar edge and shake the pages up and down, then hide.',
      shortcut: 'The stage lets the hand in at once and has it pick the scroll.',
      async play(r, app) {
        await raid(r, app, false);
        app.raid.next('scroll');
        await r.glide(innerWidth * 0.3, innerHeight * 0.3);
        if (!(await r.until(() => { const s = raidSt(app); return s && s.scrolled && s.scrolled.length; }, 20000))) throw new Error('no scroll');
        await r.wait(2500);
      } },
    { id: 'book-raid-swat', title: 'Swat the raiding hand',
      how: 'Click the hand while it reaches into the book: it snatches itself back, nurses its knuckles, and comes back with a grudge or in a temper.',
      shortcut: 'The stage lets the hand in at once.',
      async play(r, app) {
        await raid(r, app, false);
        app.raid.next('throw');
        await r.glide(innerWidth * 0.55, innerHeight * 0.45);
        const vw = document.documentElement.clientWidth;
        const ok = await r.until(() => { const s = raidSt(app), w = document.querySelector('.pb-swat'); if (!s || s.st !== 'reach' || !w || w.style.display === 'none') return false; const b = w.getBoundingClientRect(); return b.left + b.width / 2 < vw - 50; }, 20000);
        if (!ok) throw new Error('it never reached in');
        const w = document.querySelector('.pb-swat'), at = () => { const b = w.getBoundingClientRect(); return [b.left + b.width / 2, b.top + b.height / 2]; };
        await r.glide(...at(), 40);
        const [x, y] = at(); await r.move(x, y, 0);
        send(w, 'pointerdown', x, y); send(w, 'pointerup', x, y);
        if (!(await r.until(() => raidSt(app) && raidSt(app).swats >= 1, 1000))) throw new Error('missed');
        await r.glide(innerWidth * 0.3, innerHeight * 0.3);
        await r.until(() => raidSt(app) && raidSt(app).st !== 'swat', 10000);
        await r.wait(2200);
      } },
    { id: 'book-say', title: 'Select a line: its owner says it',
      how: 'In the open phrasebook, select a line you have heard: a card peeks out from behind the book and shouts it; a hand line, and the hand pokes in over the edge to say it.',
      async play(r, app) {
        await r.awake();
        await openBook(r, app, true);
        const card = chips('card.', false)[0] || chips('katana.', false)[0];
        if (card) { await select(r, card); await r.until(() => document.querySelector('.pb-say'), 2500); await r.wait(600); await quiet(r, app); }
        const arm = chips('hand.', false)[0];
        if (arm) { await toSection(r, 'hand'); await select(r, arm); await r.until(() => document.querySelector('.pb-say'), 2500); await r.wait(600); await quiet(r, app); }
        if (!card && !arm) {   // nothing heard on this browser yet: every line is blotted, and the owner refuses (see the next act)
          const b = chips('card.', true)[0]; if (b) { await select(r, b); await r.wait(800); await quiet(r, app); }
        }
      } },
    { id: 'book-refuse', title: 'A line you never heard: it refuses',
      how: 'Select a blotted line in the phrasebook (one you have not heard on this browser): its owner comes out all the same and will not say it.',
      async play(r, app) {
        await r.awake();
        await openBook(r, app, true);
        const card = chips('card.', true)[0];
        if (card) { await select(r, card); await r.until(() => document.querySelector('.pb-say'), 2500); await r.wait(600); await quiet(r, app); }
        const arm = chips('hand.', true)[0];
        if (arm) { await toSection(r, 'hand'); await select(r, arm); await r.until(() => document.querySelector('.pb-say'), 2500); await r.wait(600); await quiet(r, app); }
      } },
    { id: 'book-ink', title: 'A line heard while the book is open inks itself in',
      how: 'Lines you have not heard are blotted out in the phrasebook. Keep it open while the page says one: the blot clears into the line, with a red ink dot that fades.',
      shortcut: 'The stage inks a few of the hand\'s lines in without the hand saying them, and writes nothing into your record (lines you have heard are blotted again first).',
      tail: 3000,
      async play(r, app) {
        await openBook(r, app, true);
        await toSection(r, 'hand');
        // an entry of the hand's with a few lines, brought into view
        const sc = scroller();
        const entry = [...sc.querySelectorAll('#pb-hand .pb-entry[data-key^="hand."]')].find((e) => e.querySelectorAll('.pb-chip').length >= 3);
        if (!entry) throw new Error('no entry');
        { const sr = sc.getBoundingClientRect(), b = entry.getBoundingClientRect(); sc.scrollTo({ top: sc.scrollTop + b.top - sr.top - Math.max(60, (sc.clientHeight - b.height) / 2), behavior: 'smooth' }); await r.wait(800); }
        const picks = [...entry.querySelectorAll('.pb-chip')].slice(0, 3).map((c) => {
          const text = textOf(c); if (!text) return null;
          if (!c.classList.contains('pb-blot')) { const box = document.createElement('div'); box.innerHTML = blot(text, c.querySelector('i') ? (LANG[c.getAttribute('lang')] || '') : ''); c.replaceWith(box.firstChild); }
          return text;
        }).filter(Boolean);
        await r.wait(900);
        for (const text of picks) {
          const c = sc.querySelector(`.pb-blot[data-ink="${hash(text)}"]`);
          if (c) { const b = c.getBoundingClientRect(); await r.glide(b.right + 30, b.top + b.height / 2 + 26); }
          rehearseInk(text);
          await r.wait(1100);
        }
      } },
    { id: 'book-diary', title: 'The hand\'s secret diary',
      how: 'With the phrasebook open, type kotoba (言葉, words): the hand\'s diary slides in under the last chapter, everything it said to you on this visit.',
      shortcut: 'Here it shows for this look only: it does not count as found.',
      tail: 3000,
      async play(r, app) {
        await openBook(r, app, true);
        await r.wait(400);
        await r.type('kotoba', 160);
        if (!(await r.until(() => document.getElementById('pb-diary'), 2000))) throw new Error('no diary');
        await r.wait(1500);
      } },
  ],
};
