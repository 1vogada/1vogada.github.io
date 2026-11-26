// The stage, part "Surprise me": see ../index.js and ./index.js for the act format, ../rig.js for the ghost pointer.
// The slip (scenes/fortune.js) and the coin game (scenes/coin.js) run on their own wall-time scenes; the ghost only clicks.
// Two things are fixed for the stage, and put back after every act:
//  - "Yes, take me" would leave the page: while an act plays, the slip's Yes points at #stage-sent on this page instead, so a
//    Yes (yours or the hand's) only changes the address's #, and the act puts the address back.
//  - the coin game's random turns (which swat, who picks, how the coin lands) are drawn straight from Math.random in
//    scenes/coin.js. An act fixes the next few of those draws (plan(), below) and leaves every other draw alone.
import { bus } from '../../core/bus.js';

const $ = (id) => document.getElementById(id);
const slipOpen = () => { const o = $('omikuji'); return !!o && !o.hidden; };
const labels = () => [...document.querySelectorAll('#omi-actions .btn')].map((b) => b.textContent + (b.disabled ? ' (off)' : ''));
const btn = (n) => document.querySelector(`#omi-actions .btn:nth-child(${n})`);
const ready = () => { const b = btn(1); return !!b && !b.disabled && !document.querySelector('#omi-actions .btn-say'); };
const claw = (app) => { const c = app.hand.brain(); return c ? c.state : null; };

/**
 * the next draws made in `file` itself (its own Math.random() calls, not those of what it calls) take vals in order; null
 * is a real draw. Every other draw on the page stays real. Put back when the plan is used up, and when the act ends
 */
function plan(r, file, vals) {
  const orig = Math.random, q = vals.slice();
  const fn = () => {
    if (q.length) {
      const by = (new Error().stack || '').split('\n')[2] || '';
      if (by.includes(file)) { const v = q.shift(); if (!q.length && Math.random === fn) Math.random = orig; if (v != null) return v; }
    }
    return orig();
  };
  Math.random = fn;
  r.after(() => { if (Math.random === fn) Math.random = orig; });
  return q;
}

/** the slip is put away for good: a game in the middle is called off, the hand goes, the coin with it */
function shut(app) {
  const sc = app.scene.current(); if (sc) sc.kill();
  if (slipOpen()) { if (sc) { $('omikuji').hidden = true; bus.emit('slip.closed', { how: 'x' }); } else app.fortune.closeFortune('x'); }
  app.fortune.unpeek();
  for (const c of document.querySelectorAll('.coin')) c.remove();
}
/** while the act plays, Yes stays on this page; the address and the slip are put back after */
function guard(r, app) {
  const hash = location.hash, url = location.pathname + location.search + hash, s0 = app.coin.swats();
  let sent = null; try { sent = sessionStorage.getItem('kiripad-sent'); } catch (e) {}
  r.after(() => {
    shut(app);
    app.coin.setSwats(s0);
    try { if (sent === null) sessionStorage.removeItem('kiripad-sent'); else sessionStorage.setItem('kiripad-sent', sent); } catch (e) {}
    if (location.hash !== hash) history.replaceState(history.state, '', url);
  });
}
const stay = () => { const g = $('omi-go'); if (g) g.href = '#stage-sent'; };

/** the hand awake, the top of the page in view, Surprise me pressed by the ghost, the slip open (Yes kept on this page) */
async function openSlip(r, app) {
  await r.awake();
  guard(r, app);
  await r.scrollTo(0);
  await r.click('#surprise');
  if (!(await r.until(slipOpen, 6000))) throw new Error('the slip did not open');
  stay();
  await r.wait(400);
}
/** from the slip's No to the coin in the air: hello, the slam, the snap, its own buttons, "better", the toss */
async function toCoin(r) {
  await r.click(btn(2));
  if (!(await r.until(() => document.querySelector('.coin') && ready(), 16000))) throw new Error('no coin');
  await r.wait(500);
}
/** the ghost calls it */
async function call(r, side) { await r.click(btn(side === 'heads' ? 1 : 2)); }

export const PART = {
  id: 'surprise', title: 'Surprise me',
  intro: 'The omikuji slip, the coin and the games the hand plays with you.',
  acts: [
    { id: 'surprise-ask', title: 'An omikuji slip, and the hand leans in to ask',
      how: 'Press Surprise me (after a card has been ripped out, so the hand is about): the names roll, a fortune slip comes up, and the hand asks.',
      shortcut: 'The stage wakes the hand without a rip.',
      async play(r, app) {
        await openSlip(r, app);
        await r.until(() => claw(app) === 'show', 4000);
        await r.wait(3200);
        // a click beside the slip puts it away, and the hand goes back
        await r.glide(60, 120); await r.wait(200);
        const o = $('omikuji'); o.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); o.click();
        await r.wait(1500);
      } },
    { id: 'surprise-slam', title: 'Say No: it smashes Yes and No and snaps up its own coin game',
      how: 'On the slip, press No: the hand slams both buttons off the slip, snaps its fingers for Heads and Tails and tosses a coin. Your first call of the visit gets swatted.',
      shortcut: 'The stage picks the slam, lets the hand call it for you, and has the coin come up its way (all random for real).',
      async play(r, app) {
        await openSlip(r, app);
        app.coin.setSwats(1);
        await r.wait(800);
        await toCoin(r);
        // your call: slammed away (kind 0.9: the slam), two new buttons say hi, it picks for you (0.8: tails), the coin agrees
        plan(r, 'scenes/coin.js', [0.9, null, null, 0.8, 0.8, 0.8]);
        await call(r, 'heads');
        await r.until(() => !slipOpen(), 22000);
      } },
    { id: 'surprise-win', title: 'Beat the hand at heads or tails',
      how: 'Play its coin game (say No on the slip) and call it right: it sulks, lets you stay, and closes the slip itself.',
      shortcut: 'The stage picks the swat, lets you call again, and makes it heads.',
      async play(r, app) {
        await openSlip(r, app);
        app.coin.setSwats(1);
        await r.wait(800);
        await toCoin(r);
        plan(r, 'scenes/coin.js', [0.1, null, null, 0.3, 0.3]);   // a slap; "your pick"; heads
        await call(r, 'heads');
        if (!(await r.until(ready, 9000))) throw new Error('no second call');
        await r.wait(700);
        await call(r, 'heads');
        await r.until(() => !slipOpen(), 14000);
      } },
    { id: 'surprise-lose', title: 'Lose the toss: five seconds, then it presses Yes for you',
      how: 'Call the coin wrong in its game: Yes and No are yours again for five seconds, then it pokes Yes and sends you off to the project.',
      shortcut: 'The stage skips the swat and makes it heads; Yes stays on this page.',
      async play(r, app) {
        await openSlip(r, app);
        app.coin.setSwats(0);
        await r.wait(800);
        await toCoin(r);
        plan(r, 'scenes/coin.js', [0.3]);   // heads
        await call(r, 'tails');
        await r.until(() => labels().join() === 'Yes, take me →,No', 9000);
        await r.glide(innerWidth * 0.3, innerHeight * 0.75);
        await r.until(() => $('omi-go').classList.contains('pressed'), 8000);
        await r.until(() => location.hash === '#stage-sent', 3000);
        await r.wait(400);
      } },
    { id: 'surprise-own-no', title: 'Lose, then say No yourself: it lets you go',
      how: 'Lose its coin game, then press No before the five seconds are up: it sulks and lets you stay.',
      shortcut: 'The stage skips the swat and makes it heads.',
      async play(r, app) {
        await openSlip(r, app);
        app.coin.setSwats(0);
        await r.wait(800);
        await toCoin(r);
        plan(r, 'scenes/coin.js', [0.3]);
        await call(r, 'tails');
        await r.until(() => labels().join() === 'Yes, take me →,No', 9000);
        await r.wait(1600);
        await r.click(btn(2));
        await r.until(() => !slipOpen(), 5000);
        await r.wait(600);
      } },
    { id: 'surprise-own-yes', title: 'Lose, then press Yes yourself',
      how: 'Lose its coin game and press Yes yourself: the game is over and the link takes you to the project.',
      shortcut: 'The stage skips the swat and makes it heads; Yes stays on this page.',
      tail: 1800,
      async play(r, app) {
        await openSlip(r, app);
        app.coin.setSwats(0);
        await r.wait(800);
        await toCoin(r);
        plan(r, 'scenes/coin.js', [0.3]);
        await call(r, 'tails');
        await r.until(() => labels().join() === 'Yes, take me →,No', 9000);
        await r.wait(1400);
        await r.click(btn(1));
        await r.until(() => claw(app) !== 'show', 3000);
        await r.wait(900);
      } },
    { id: 'surprise-secret', title: 'The secret ×: NOOO',
      how: 'With the slip open, move the pointer to the bottom left corner of the screen: a × rises, the hand bursts in to protest, and a click on it gets you out.',
      async play(r, app) {
        await openSlip(r, app);
        await r.wait(1200);
        // the stage's own bar sits in that very corner: it steps out of the way while the × is up
        const bar = document.querySelector('.sc-bar');
        if (bar) { bar.style.visibility = 'hidden'; r.after(() => { bar.style.visibility = ''; }); }
        const o = $('omikuji').getBoundingClientRect();
        await r.glide(o.left + 120, o.bottom - 140);
        await r.glide(o.left + 29, o.bottom - 29, 8);
        await r.until(() => $('omi-secret').classList.contains('near'), 1500);
        await r.wait(2200);
        await r.click('#omi-secret');
        if (bar) bar.style.visibility = '';
        await r.wait(1800);
      } },
    { id: 'surprise-edge', title: 'The coin lands on its edge',
      how: 'Play its coin game: one toss in a hundred lands on its rim, wobbles and rolls off the page. The hand has never seen that, and lets you choose.',
      shortcut: 'The stage makes the coin land on its edge (and skips the swat).',
      async play(r, app) {
        await openSlip(r, app);
        app.coin.setSwats(0);
        await r.wait(800);
        await toCoin(r);
        plan(r, 'scenes/coin.js', [0.995]);
        await call(r, 'heads');
        await r.until(() => labels().join() === 'Yes, take me →,No' && app.scene.current() === null, 12000);
        await r.wait(900);
        await r.click(btn(2));   // and No just closes the slip now
        await r.wait(1200);
      } },
    { id: 'surprise-back', title: 'Welcome back: a rematch',
      how: 'Lose the coin game so the hand sends you to a project, then come back (the Back button): it draws you another one and wants a rematch.',
      shortcut: 'The stage plays your return without leaving the page, and makes it heads.',
      async play(r, app) {
        await r.awake();
        guard(r, app);
        await r.scrollTo(0);
        try { sessionStorage.setItem('kiripad-sent', $('omi-go').href); } catch (e) {}
        app.welcomeBack.welcomeBack();
        if (!(await r.until(slipOpen, 3000))) throw new Error('no welcome back');
        stay();
        if (!(await r.until(() => document.querySelector('.coin') && ready(), 16000))) throw new Error('no coin');
        await r.wait(500);
        plan(r, 'scenes/coin.js', [0.3]);   // no swat this time; heads
        await call(r, 'heads');
        await r.until(() => !slipOpen(), 14000);
      } },
    { id: 'surprise-word', title: 'Say "hand": it takes the word',
      how: 'Highlight the word "hand" anywhere on the page (once the hand is about): it reaches in, pinches the word off the page and drags it away.',
      shortcut: 'The stage writes the word on the page for it.',
      async play(r, app) {
        await r.awake();
        await r.scrollTo(0);
        const lede = document.querySelector('.lede'); if (!lede) throw new Error('no lede');
        const span = document.createElement('span'); span.textContent = ' Lend me a '; const w = document.createElement('span'); w.textContent = 'hand'; span.appendChild(w); span.append('?');
        lede.appendChild(span); r.after(() => span.remove());
        r.after(() => { const s = getSelection(); if (s) s.removeAllRanges(); });
        await r.until(() => ['off', 'lurk', 'sulk'].includes(claw(app)), 4000);
        const t = w.firstChild, b = w.getBoundingClientRect();
        await r.glide(b.left - 2, b.top + b.height / 2);
        const sel = getSelection(), rg = document.createRange(); rg.setStart(t, 0); rg.setEnd(t, 0);
        sel.removeAllRanges(); sel.addRange(rg);
        for (let i = 1; i <= 4; i++) { await r.move(b.left + b.width * i / 4, b.top + b.height / 2, 60); rg.setEnd(t, i); sel.removeAllRanges(); sel.addRange(rg); }
        await r.glide(b.left + b.width / 2, b.bottom + 90);
        if (!(await r.until(() => app.scene.current() && app.scene.current().name === 'word', 3000))) throw new Error('it did not come for the word');
        await r.until(() => !app.scene.current(), 9000);
      } },
    { id: 'surprise-rps', title: 'Rock, paper, scissors with an old hand',
      how: 'Let a cut-off hand walk into view of the arm: now and then they settle it the old way. Type r, p or s while they count to shout a pick for the old hand.',
      shortcut: 'The stage drops an old hand by the arm, has the arm notice it at once and play (a coin flip for real), and fixes the picks; the ghost shouts paper in the second round.',
      async play(r, app) {
        await r.awake();
        await r.toGrid(140);
        // the chance (0.1: they play), round one: rock and rock (a draw), round two: the arm's rock (you shout paper for the old hand)
        plan(r, 'scenes/rps.js', [0.1, 0.1, 0.1, 0.1]);
        const vw = document.documentElement.clientWidth;
        const o = await r.oldHand(scrollX + vw - 460, scrollY + innerHeight * 0.4);
        await r.until(() => o.ai.st === 'walk', 6000);
        await r.scrollTo(r.pos(o)[1] - innerHeight * 0.72);   // wherever it landed, in view
        // the arm lurks and notices it (for real that takes a moment of the old hand in view, and they must not be busy)
        await r.until(() => claw(app) === 'lurk', 3000);
        if (!app.scene.current() && claw(app) !== 'meet') { app.hand.get().old = o; app.hand.set('meet'); }
        if (!(await r.until(() => app.scene.current() && app.scene.current().name === 'rps', 6000))) throw new Error('they did not play');
        let shows = 0; const off = bus.on('rps.played', () => { shows++; }); if (typeof off === 'function') r.after(off);
        await r.until(() => shows >= 1, 12000);
        // round two: shout paper while they count (the count starts once the draw has been said)
        await r.wait(2500);
        for (let k = 0; k < 14 && shows < 2; k++) { await r.key('p'); await r.wait(260); }
        await r.until(() => !app.scene.current(), 14000);
        await r.wait(800);
      } },
  ],
};
