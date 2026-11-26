// "No": the hand smashes Yes/No, snaps in Heads/Tails, tosses a coin, makes you call it, swats your first try, and presses
// Yes for you when you lose (legacy handScene(back) with makeBtns, the smash, turn, fly, hover, poke, the call clock, myPick,
// go, the result and the Yes press; noBtn / goBtn handlers; swatsLeft; sessionStorage 'kiripad-sent').
// Every wait is a scene sleep (wall time); every bubble goes through core/speech (hand.say, sayIn for the new buttons:
// the two btnhi picks are drawn up front with two Math.random, exactly as legacy, and passed as opts.text).
// Timers that legacy did not tie to the scene (the snap's, the puffs', the lost coin's removal) are plain wall timers, so a
// kill does not cancel them. Emits coin.tossed { side, call }. One toss in a hundred (TUNE.coin.EDGE) lands on its edge and
// rolls off: the hand gives up and you choose (No then only closes the slip).

import { TIMING, TUNE } from '../core/tune.js';
import { real, wall, frames } from '../core/clock.js';
import { bus } from '../core/bus.js';
import { list } from '../core/lines.js';
import { sayIn } from '../core/speech.js';
import { isCrazy } from '../world/world.js';
import { scene, current, GONE } from './scene.js';
import { dom, st, H, keepShow, endShow, closeFortune } from './fortune.js';
import { SENT } from './welcome-back.js';
const GO_THERE = 'Go there?', HEADS = 'Heads', TAILS = 'Tails';   // page labels

let free = false;   // the coin landed on its edge: until the slip closes, No just closes it
let swatsLeft = 1;   // the first time you go for heads or tails (once per visit) it knocks the buttons away, then snaps
/** legacy swatsLeft (welcome-back sets it to 0) */ export const setSwats = (n) => { swatsLeft = n; };
/** how many swats are left this visit (the stage puts it back after an act) */ export const swats = () => swatsLeft;

/** legacy handScene(back). back: you returned after it sent you away, so it greets you differently */
export async function handScene(back) {
  if (current()) return;
  keepShow();
  const h = H(); if (!h || isCrazy()) { closeFortune('x'); return; }
  const H_ = h, { omi, slip, goBtn, noBtn, qEl, actEl } = dom, root = document.documentElement;
  st.peek = false;   // if it had burst in over the secret ×, the scene takes it over
  // a scene can be killed by the secret ×: every wait below then throws, and the finally tidies up
  const my = scene('coin');
  const sleep = my.sleep;
  noBtn.disabled = true; root.classList.add('hand-show');
  const sr = slip.getBoundingClientRect(), vw = document.documentElement.clientWidth;
  const hx = Math.min(vw - 70, sr.right + 70), hy = sr.top + sr.height * 0.35;
  try {
    await H_.come(hx, hy, 'eager');
    await sleep(700);
    await sleep(Math.max(back ? TIMING.wait.back : TIMING.wait.hello, H_.say(back ? 'back' : 'hello')));   // long enough to read it
    let heads, tails, go;
    const makeBtns = () => {
      heads = document.createElement('button'); tails = document.createElement('button');
      heads.className = tails.className = 'btn ghost'; heads.type = tails.type = 'button'; heads.textContent = HEADS; tails.textContent = TAILS;
      const tap = (side, el) => go && go(side, el).catch((e) => { if (e !== GONE) throw e; });
      heads.onclick = () => tap('heads', heads); tails.onclick = () => tap('tails', tails);
      actEl.innerHTML = ''; actEl.append(heads, tails);
    };
    // it has no use for Yes and No: it slams itself down on them, they fly off the page in pieces, and it snaps its fingers for a pair of its own
    {
      const gb = goBtn.getBoundingClientRect(), nb = noBtn.getBoundingClientRect();
      const mx = (Math.min(gb.left, nb.left) + Math.max(gb.right, nb.right)) / 2, by = (Math.min(gb.top, nb.top) + Math.max(gb.bottom, nb.bottom)) / 2;
      actEl.style.minHeight = actEl.offsetHeight + 'px';
      H_.to({ x: mx + 20, y: by - 150, pose: 'eager', tip: false, aim: Math.PI, rate: 12, bob: false }); await sleep(600);   // it rises over them
      H_.to({ x: mx + 20, y: by + 4, pose: 'lunge', rate: 60 }); await sleep(100); H_.say('smashbtn');   // and comes down flat
      slip.animate([{ translate: '0 0' }, { translate: '0 9px' }, { translate: '0 -4px' }, { translate: '0 2px' }, { translate: '0 0' }], { duration: 300, easing: 'ease-out' });
      [goBtn, noBtn].forEach((el, i) => {
        const r = el.getBoundingClientRect(), d = i ? 1 : -1, cs = getComputedStyle(el), cl = el.cloneNode(true);
        cl.removeAttribute('id'); cl.removeAttribute('href'); cl.classList.add('omi-flung'); cl.setAttribute('aria-hidden', 'true');
        Object.assign(cl.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); omi.appendChild(cl);
        // the button itself is flattened, then shot out past the edge of the screen
        cl.animate([{ transform: 'none' }, { transform: 'translateY(5px) scale(1.25, .3)', offset: .14 },
          { transform: `translate(${d * (vw * 0.6 + 260)}px, ${-140 - Math.random() * 220}px) rotate(${d * (700 + Math.random() * 500)}deg) scale(.8)` }], { duration: 560, easing: 'cubic-bezier(.3,.6,.6,1)', fill: 'forwards' }).onfinish = () => cl.remove();
        // and bits of it break off
        const cols = [cs.backgroundColor, cs.borderTopColor, cs.color].filter((c) => c && !/, 0\)$|transparent/.test(c));
        for (let k = 0; k < 9; k++) {
          const bit = document.createElement('i'), sz = 4 + Math.random() * 7, a = -Math.PI * (0.08 + 0.84 * Math.random()), sp = 90 + Math.random() * 230, dx = Math.cos(a) * sp + d * 40, dy = Math.sin(a) * sp;
          bit.className = 'omi-bit'; Object.assign(bit.style, { width: sz + 'px', height: sz * (0.5 + Math.random() * 0.6) + 'px', background: cols[k % cols.length] });
          const x0 = r.left + r.width * Math.random(), y0 = r.top + r.height * Math.random(); omi.appendChild(bit);
          bit.animate([{ transform: `translate(${x0}px, ${y0}px)`, opacity: 1 }, { transform: `translate(${x0 + dx * 0.6}px, ${y0 + dy * 0.75}px) rotate(${dx * 2}deg)`, opacity: 1, offset: .45 },
            { transform: `translate(${x0 + dx}px, ${y0 + dy * 0.5 + 240}px) rotate(${dx * 5}deg)`, opacity: 0 }], { duration: 650 + Math.random() * 350, easing: 'linear', fill: 'forwards' }).onfinish = () => bit.remove();
        }
      });
      actEl.innerHTML = ''; qEl.textContent = '';   // gone at once. The hand asks the questions from here on, not the slip
      await sleep(700);
      // back up, thumb on its middle finger; a snap; and its own two buttons poof in
      H_.to({ x: hx, y: hy, pose: 'pinch', tip: false, aim: Math.PI, rate: 9, bob: false }); await sleep(950);
      H_.to({ pose: 'snapped', rate: 60 });
      { const q = H_.get().tip2 || [hx, hy], sn = document.createElement('div'); sn.className = 'omi-snap'; sn.style.translate = `${q[0].toFixed(0)}px ${q[1].toFixed(0)}px`;   // tip2 is never set: always [hx, hy] (legacy)
        for (let k = 0; k < 7; k++) { const ray = document.createElement('i'); ray.style.rotate = (k * 360 / 7) + 'deg'; sn.appendChild(ray); }
        document.body.appendChild(sn); real.after(420, () => sn.remove()); }
      await sleep(160);
      makeBtns(); heads.disabled = tails.disabled = true; actEl.style.minHeight = '';
      for (const el of [heads, tails]) { el.classList.add('poof'); const puff = document.createElement('i'); puff.className = 'omi-puff'; el.appendChild(puff); real.after(520, () => puff.remove()); }
      await sleep(900); const ms = H_.say('better'); H_.to({ pose: 'joy', rate: 10, bob: true });
      await sleep(Math.max(TIMING.wait.better, ms));
    }
    // the toss: the coin leaves the hand and spins in the air above it until you call it
    H_.to({ pose: 'joy', bob: false }); H_.say(back ? 'rematch' : 'flip');
    const g = H_.grip() || [hx, hy], coin = document.createElement('div'); coin.className = 'coin'; coin.innerHTML = '<i class="rim"></i><b class="face"></b>'; document.body.appendChild(coin);
    my.coin = coin; my.coinEl = coin; H_.get().dodge = coin.querySelector('.face');
    const D = 54, THICK = 10, face = coin.querySelector('.face'), rim = coin.querySelector('.rim');
    // th = how far it is turned (0 = face to you). The face shrinks with cos, the rim (its thickness, seen edge-on) grows with sin
    const turn = (th, label) => {
      const c = Math.abs(Math.cos(th)), h = Math.max(1.5, D * c), e = THICK * Math.abs(Math.sin(th)) + 2;
      face.style.height = h.toFixed(1) + 'px'; face.style.top = (-(h + e) / 2).toFixed(1) + 'px'; face.style.fontSize = (1.3 * c).toFixed(2) + 'rem'; face.textContent = c > 0.3 ? label : '';
      rim.style.height = h.toFixed(1) + 'px'; rim.style.top = (-(h + e) / 2 + e).toFixed(1) + 'px';
      rim.style.boxShadow = `0 ${(-e / 2).toFixed(1)}px 0 #b98325`;
    };
    my.turn = turn;
    const t0 = wall(), cx = Math.min(vw - 40, g[0]), top = Math.max(60, g[1] - 140);
    const fly = () => { if (!my.coin) return false; const tn = wall(), s = Math.min(1, (tn - t0) / 450), y = g[1] + (top - g[1]) * (1 - (1 - s) * (1 - s)) + (s >= 1 ? Math.sin(tn / 160) * 6 : 0);
      coin.style.translate = `${cx.toFixed(0)}px ${y.toFixed(0)}px`; turn((tn - t0) / 1000 * Math.PI * 5, '?'); };   // 2.5 turns a second, real time
    frames(fly);
    heads.disabled = tails.disabled = false; heads.focus({ preventScroll: true });
    const hover = () => H_.to({ x: hx, y: hy, pose: 'joy', tip: false, aim: Math.PI, rate: 10, bob: true });
    // one finger, on a button
    const poke = async (btn) => {
      const b = btn.getBoundingClientRect(), bx = b.left + b.width * 0.6, by = b.top + b.height * 0.5;
      H_.to({ x: bx + 10, y: by - 34, pose: 'point', tip: true, aim: Math.PI - 0.5, rate: 12, bob: false }); await sleep(700);
      H_.to({ x: bx, y: by, rate: 22 }); await sleep(120); btn.classList.add('pressed'); await sleep(260);
      H_.to({ x: bx + 6, y: by - 26, rate: 10 }); await sleep(300);
    };
    // you have TIMING.wait.call to call it, with a nag halfway. Then it calls it itself and presses the button for you. The clock starts over
    // whenever the buttons are yours again
    let nagT = null, outT = null;
    const stopClock = () => { if (nagT) nagT(); if (outT) outT(); nagT = outT = null; };
    const call = await new Promise((res, rej) => {
      my.fail(() => { stopClock(); rej(GONE); });
      let busy = false;
      const clock = () => {
        stopClock();
        nagT = real.after(TIMING.wait.callNag, () => !busy && !my.dead && H_.say('callit'));
        outT = real.after(TIMING.wait.call, () => go && go(null).catch((e) => { if (e !== GONE) throw e; }));
      };
      const myPick = async () => {   // it picks for you: one finger on Heads or Tails
        heads.disabled = tails.disabled = true;
        const mine = Math.random() < 0.5 ? 'heads' : 'tails'; H_.say('mypick');
        await poke(mine === 'heads' ? heads : tails); hover(); res(mine);
      };
      go = async (side, btn) => {
        if (busy) return;
        stopClock();
        if (side === null) { busy = true; await myPick(); return; }   // you took too long
        if (swatsLeft <= 0) { res(side); return; }
        busy = true; swatsLeft--;
        // it knocks both buttons off the slip, one of three ways: a slap (sweep left), a backhand (sweep right) or a slam (straight down)
        heads.disabled = tails.disabled = true;
        const hb = heads.getBoundingClientRect(), tb = tails.getBoundingClientRect(), my_ = (hb.top + hb.bottom) / 2, L = hb.left, R = tb.right, mx = (L + R) / 2;
        const kind = ['slap', 'backhand', 'slam'][Math.floor(Math.random() * 3)];
        const fling = (el, kf, delay) => el.animate(kf, { duration: 650, delay, easing: 'cubic-bezier(.2,.7,.4,1)', fill: 'forwards' });
        if (kind === 'slam') {
          H_.to({ x: mx, y: my_ - 110, pose: 'clamp', tip: false, aim: Math.PI, rate: 30, bob: false }); await sleep(260);
          H_.to({ x: mx, y: my_ - 4, rate: 50 }); await sleep(110); H_.say('slap');
          for (const [el, d] of [[heads, -1], [tails, 1]]) fling(el, [{ transform: 'none' }, { transform: 'translateY(4px) scale(1.3, .3)', offset: .2 },
            { transform: `translate(${d * 60}px, 70px) rotate(${d * 40}deg) scale(1.4, .1)`, opacity: 0 }], 0);
        } else {
          const d = kind === 'slap' ? -1 : 1, from = d < 0 ? R + 30 : L - 30, to = d < 0 ? L - 60 : R + 60;
          H_.to({ x: from, y: my_, pose: kind === 'slap' ? 'clamp' : 'joy', tip: false, aim: Math.PI, rate: 40, bob: false }); await sleep(220);
          H_.to({ x: to, y: my_ - 10, rate: 45 }); await sleep(80); H_.say('slap');
          const first = d < 0 ? tails : heads, second = d < 0 ? heads : tails;
          [first, second].forEach((el, i) => fling(el, [{ transform: 'none' }, { transform: `translate(${d * 30}px, -12px) rotate(${d * 25}deg)`, offset: .15 },
            { transform: `translate(${d * (320 + i * 60)}px, ${kind === 'slap' ? 140 : -180}px) rotate(${d * (280 + i * 120)}deg)`, opacity: 0 }], i * 70));
        }
        await sleep(450); hover();
        // then it snaps, and a fresh pair poofs in, chattering
        await sleep(900); H_.to({ pose: 'sulk', rate: 14 }); H_.say('snap');
        await sleep(1000);
        makeBtns(); heads.disabled = tails.disabled = true;
        const hi = list('button.hi'), a = Math.floor(Math.random() * hi.length), b2 = (a + 1 + Math.floor(Math.random() * (hi.length - 1))) % hi.length;
        [heads, tails].forEach((el, i) => {
          el.classList.add('poof'); const puff = document.createElement('i'); puff.className = 'omi-puff'; el.appendChild(puff); real.after(520, () => puff.remove());
          real.after(250 + i * 450, () => sayIn(el, 'button.hi', { text: hi[i ? b2 : a], floor: 'btn' }));
        });
        await sleep(2600);
        if (Math.random() < 0.5) { H_.say('yourpick'); hover(); heads.disabled = tails.disabled = false; busy = false; clock(); return; }
        await myPick();
      };
      clock();
    }).finally(stopClock);
    heads.disabled = tails.disabled = true;
    // one toss in a hundred lands on its edge (taken out of the "it did not bother" tenth, so the draw stays the same)
    const r = Math.random(), side = r < 0.45 ? 'heads' : r < 0.9 ? 'tails' : r >= 1 - TUNE.coin.EDGE ? 'edge' : null;
    bus.emit('coin.tossed', { side, call });
    await sleep(500);
    if (side === 'edge') {   // it lands on its rim on the slip, wobbles, and rolls off the page. The hand has never seen that: you choose
      my.coin = null; turn(Math.PI / 2, '');
      const sb = slip.getBoundingClientRect(), y = Math.round(sb.bottom - 30), x0 = Math.round(cx);
      coin.style.translate = `${x0}px ${y}px`;
      coin.animate([{ rotate: '0deg' }, { rotate: '9deg', offset: .2 }, { rotate: '-7deg', offset: .45 }, { rotate: '4deg', offset: .7 }, { rotate: '0deg' }], { duration: 900, easing: 'ease-out' });
      await sleep(1100);
      coin.animate([{ translate: `${x0}px ${y}px` }, { translate: `${x0 - 60}px ${y}px`, offset: .3 }, { translate: `-120px ${y + 40}px` }], { duration: 2200, easing: 'ease-in', fill: 'forwards' }).onfinish = () => coin.remove();
      H_.to({ x: hx, y: hy, pose: 'eager', tip: false, aim: Math.PI + 0.25, rate: 6, bob: false });
      await sleep(Math.max(TIMING.wait.verdict, H_.say('edge')));
      H_.to({ pose: 'sulk', aim: Math.PI, rate: 8 });
      await sleep(Math.max(TIMING.wait.escaped, H_.say('edgepick')));
      free = true;   // your No closes the slip now, no game
      actEl.innerHTML = ''; actEl.append(goBtn, noBtn); goBtn.classList.remove('pressed'); qEl.textContent = GO_THERE;
      H_.leave();
      return;
    }
    if (!side) { my.coin = null; coin.remove(); H_.to({ pose: 'clamp' }); H_.say('idgaf'); }
    else {
      my.coin = null; turn(0.55, side === 'heads' ? 'H' : 'T'); coin.style.translate = `${cx.toFixed(0)}px ${(g[1] - 40).toFixed(0)}px`;
      H_.say(side); await sleep(TIMING.wait.result);
      if (side === call) {   // spared
        await sleep(300); H_.to({ pose: 'sulk', bob: false }); const ms = H_.say('won');
        await sleep(Math.max(TIMING.wait.verdict, ms)); coin.remove(); H_.say('stay');
        await sleep(1500); await poke(document.getElementById('omi-x'));   // it closes the slip for you, then goes back where it came from
        omi.hidden = true; H_.leave();
        qEl.textContent = GO_THERE; actEl.innerHTML = ''; actEl.append(goBtn, noBtn); goBtn.classList.remove('pressed');
        bus.emit('slip.closed', { how: 'hand' });
        return;
      }
      await sleep(300); H_.to({ pose: 'joy', bob: true }); H_.say('lost');
      real.after(1500, () => coin.remove());
    }
    // it reaches over and presses Yes for you
    await sleep(TIMING.wait.verdict);
    actEl.innerHTML = ''; actEl.append(goBtn, noBtn); noBtn.disabled = false;
    const b = goBtn.getBoundingClientRect(), bx = b.left + b.width * 0.62, by = b.top + b.height * 0.5;
    // Yes and No are yours again for 5 seconds, and it keeps its hand off them. Only if you press neither does it press Yes itself
    H_.to({ x: hx, y: hy, pose: 'point', tip: false, aim: Math.PI, rate: 10, bob: true });
    const nag = real.after(TIMING.wait.yesNag, () => my.pick && H_.say('waiting'));
    let t = null;
    const own = await new Promise((res, rej) => { my.fail(() => rej(GONE)); t = real.after(TIMING.wait.yes, () => res(null)); my.pick = (c) => { t(); res(c); }; }).finally(() => { my.pick = null; nag(); });
    if (own === 'no') {   // you said no again, and this time it lets you
      noBtn.disabled = true; H_.to({ x: hx, y: hy, pose: 'sulk', tip: false, aim: Math.PI, rate: 10, bob: false }); H_.say('escaped');
      await sleep(TIMING.wait.escaped); omi.hidden = true; H_.leave(); qEl.textContent = GO_THERE;
      bus.emit('slip.closed', { how: 'hand' });
      return;
    }
    noBtn.disabled = true;
    H_.to({ x: bx + 10, y: by - 34, pose: 'point', tip: true, aim: Math.PI - 0.5, rate: 12, bob: false });   // one finger out, hovering over Yes
    await sleep(700);
    H_.to({ x: bx, y: by, rate: 22 }); await sleep(120); goBtn.classList.add('pressed'); H_.say('bye');   // poke
    await sleep(260); H_.to({ x: bx + 6, y: by - 26, rate: 10 });
    await sleep(300); H_.to({ pose: 'joy', tip: false, aim: Math.PI, bob: true, rate: 10 });
    await sleep(1100);
    try { sessionStorage.setItem(SENT, goBtn.href); } catch (e) {}
    location.href = goBtn.href;
  } catch (e) {
    if (e !== GONE) throw e;
  } finally {
    my.coin = null; if (my.coinEl) my.coinEl.remove(); actEl.style.minHeight = '';
    if (my.dead) { const H2 = H(); if (H2) H2.leave(); qEl.textContent = GO_THERE; actEl.innerHTML = ''; actEl.append(goBtn, noBtn); goBtn.classList.remove('pressed'); }
    my.done();
    noBtn.disabled = false;
    endShow();
  }
}

export function install(app) {
  const { noBtn, goBtn } = dom;
  // No and the × do the same thing: the hand comes out
  noBtn.addEventListener('click', () => { const sc = current(); if (!sc && free) { free = false; return closeFortune('x'); } return sc && sc.pick ? sc.pick('no') : handScene(); });
  bus.on('slip.closed', () => { free = false; });
  goBtn.addEventListener('click', () => { const sc = current(); if (sc && sc.pick) sc.kill(); });   // your own Yes: the link takes you there, and the scene is over
}
