// The phrasebook of kiripad.dev. A translate button in the header opens a near-fullscreen book that catalogues every line the cards,
// the katana and the hand can say, what sets each one off, and what the Bulgarian and Japanese ones mean.
// The lines themselves are NOT kept here: they are read from the page's own lists (window.__lines, set in index.html), so a line added
// there turns up in the book by itself. Only the descriptions of the triggers and the translations live in this file.
(() => {
  const nav = document.querySelector('header.top .nav'); if (!nav) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const here = (document.currentScript && document.currentScript.src) || '/scripts/phrasebook.js';

  // ---- what the book knows: which occasion each list belongs to. src = which list on window.__lines, key = which entry of it ----
  const CHAPTERS = [
    { id: 'cards', num: 'I', title: 'The Cards', head: 'Of the Cards',
      intro: 'The cards of this site are rooted in their grid and would like to stay there. Each one may be taken by any part of it and pulled; it will complain from the first pixel, and louder the worse you treat it. A card is never silent for long, but it will not speak twice within about a second and a half unless something new is done to it.',
      entries: [
        { src: 'SAY', key: 'pull', title: 'On being taken hold of', when: 'You begin to drag a card that still sits in its place in the grid. A card the Hand plucks out of the air says the same.' },
        { src: 'SAY', key: 'strain', title: 'Under strain', when: 'You have pulled some 160 px from where you took hold, and the root begins to lose its grip.' },
        { src: 'SAY', key: 'back', title: 'Let go in time', when: 'You release the card before it tears. It springs home, and gloats.' },
        { src: 'SAY', key: 'rip', title: 'Torn out', when: 'You pull past 350 px, or hold the strain until the root gives up. The card comes loose in your hand.' },
        { src: 'SAY', key: 'throw', title: 'Thrown', when: 'A loose card is let go at more than 900 px a second.' },
        { src: 'SAY', key: 'land', title: 'A hard landing', when: 'The card strikes something at more than 500 px a second, and survives it.' },
        { src: 'SAY', key: 'smash', title: 'Shattered', when: 'A thrown card meets a wall, the floor or another card at more than 1300 px a second. Only a thrown card breaks; one that is dropped or carried never does.' },
        { src: 'SAY', key: 'cutting', title: 'With the blade inside', when: 'The very tip of the katana has entered the card and has not yet come out.' },
        { src: 'SAY', key: 'stab', title: 'Stabbed, not cut', when: 'The tip leaves by the same side it came in through. The card is not divided, but it bleeds for a while.' },
        { src: 'SAY', key: 'slice', title: 'Cut in two', when: 'The tip goes in by one side and out by another. These are also the last words of a card torn in half between you and the Hand.' },
        { src: 'AGONY', key: 0, title: 'Stretched: the first degree', when: 'You and the Hand each hold an end of the same card, and it has begun to grow longer.' },
        { src: 'AGONY', key: 1, title: 'Stretched: the second degree', when: 'The card is pulled past a third of what it can bear. Also said in the Hand’s fist, while it is being crushed.' },
        { src: 'AGONY', key: 2, title: 'Stretched: the third degree', when: 'The card is close to tearing, or close to being a ball of paper. The letters grow, redden and shake.' },
        { src: 'BEG', key: null, title: 'Begging', when: 'In the Hand’s closed fist, in the quiet pause after the second squeeze.' },
      ] },
    { id: 'katana', num: 'II', title: 'The Katana', head: 'Of the Katana',
      intro: 'Hidden in the mist of the banner stands a katana, and it has a very high opinion of itself. It is drawn like a card, by pulling, and a double click keeps it in the hand. Only its very tip cuts, at any speed whatever. It speaks once and is then quiet for two seconds, however much it has done in the meantime.',
      entries: [
        { src: 'SAY', key: 'khello', title: 'Introducing itself', when: 'You tear it out of the banner, or double-click to take it in hand.' },
        { src: 'SAY', key: 'kbrag', title: 'Boasting', when: 'It has just cut a card in two while you were holding it. It boasts about two times in five.' },
        { src: 'SAY', key: 'kcut', title: 'Cutting by accident', when: 'It cuts a card with nobody holding it, on its way down the page.' },
        { src: 'SAY', key: 'kdrop', title: 'Dropped', when: 'You let go of it.' },
      ] },
    { id: 'hand', num: 'III', title: 'The Hand', head: 'Of the Hand',
      intro: 'Something lives past the right edge of the screen, and it wants your cards. It shows itself only after the first card has been torn loose. It has one eye, on the back of the hand, and opinions on everything it sees. It never answers at once: every remark waits up to three seconds, and two full seconds always pass between any two things it says.',
      entries: [
        { src: 'CLAW_SAY', key: 'eager', title: 'Wanting', when: 'You carry a loose card towards the right edge of the screen. Said again if you keep it waiting.' },
        { src: 'CLAW_SAY', key: 'grab', title: 'Taking hold', when: 'You bring the card within its reach and it closes its fingers on the far end. The tug of war begins.' },
        { src: 'CLAW_SAY', key: 'tug', title: 'In the tug of war', when: 'You pull against it hard enough that its grip starts to slip.' },
        { src: 'CLAW_SAY', key: 'rip', title: 'A card comes apart', when: 'A card is torn out of the grid while it watches, or torn in half between the two of you.' },
        { src: 'CLAW_SAY', key: 'eat', title: 'Eating', when: 'It drags its half of the card off the screen.' },
        { src: 'CLAW_SAY', key: 'keep', title: 'Winning the whole card', when: 'You let go during the tug of war.' },
        { src: 'CLAW_SAY', key: 'toss', title: 'Bored of it', when: 'It has held a card for two seconds. The card comes back, and about one time in three it comes back hard.' },
        { src: 'CLAW_SAY', key: 'sulk', title: 'Sulking', when: 'You tempt it and take the card away, or the thing it was holding is cut or smashed.' },
        { src: 'CLAW_SAY', key: 'snatch', title: 'Out of patience', when: 'You have teased it for too long with a card just out of reach. The arm shoots out as far as it must.' },
        { src: 'CLAW_SAY', key: 'savour', title: 'Savouring', when: 'In the pauses of the crushing, while it turns the card over and looks at it.' },
        { src: 'CLAW_SAY', key: 'crush', title: 'The crunch', when: 'The card it snatched is finally crushed.' },
        { src: 'CLAW_SAY', key: 'caught', title: 'A catch', when: 'You throw a card towards the right edge, and it plucks it out of the air.' },
        { src: 'CLAW_SAY', key: 'slip', title: 'Losing its grip', when: 'You yank the card away the moment it grabs, or take back the card it was celebrating with.' },
        { src: 'CLAW_SAY', key: 'cut', title: 'Watching a cut', when: 'It saw the katana divide a card.' },
        { src: 'CLAW_SAY', key: 'stab', title: 'Watching a stab', when: 'It saw the katana go in and come out the same way.' },
        { src: 'CLAW_SAY', key: 'smash', title: 'Watching a card shatter', when: 'It saw a thrown card break.' },
        { src: 'CLAW_SAY', key: 'throw', title: 'Watching a throw', when: 'It saw you throw a card.' },
        { src: 'CLAW_SAY', key: 'katana', title: 'On the katana', when: 'It saw you draw the katana, or take it in hand.' },
        { src: 'CLAW_SAY', key: 'kdrop', title: 'On the katana, dropped', when: 'It saw you drop the katana.' },
      ] },
  ];
  // what the Bulgarian and Japanese lines mean. A line that is missing here is simply printed without a gloss
  const GLOSS = {
    'не!': 'no!', 'やめて!': 'stop it!', 'ъъъгх': 'nnngh', 'ау!': 'ow!', 'ох…': 'oh…', 'おっと': 'oops', 'опа!': 'whoops!',
    '世界一切れる刀です': 'I am the sharpest sword in the world', 'най-острата катана на света, здрасти!': 'the sharpest katana in the world, hello!',
    'スパッ': 'the sound of a clean cut', 'като масло': 'like butter', '痛い痛い痛い!!': 'it hurts, it hurts, it hurts!!', 'ААААААА!': 'a scream', 'боли боли боли': 'hurts, hurts, hurts',
    'まだ生きてる…?': 'still alive…?', 'жив съм?!': 'I am alive?!', 'ААААААААА!!!': 'a scream', 'НЕЕЕЕЕЕЕ!': 'NOOOOO!', 'ぎゃああああ!!': 'a shriek', 'うわあああ!!': 'a wail',
    'ААААА!!': 'a scream', 'ぐはっ!!': 'the wind knocked out of it', 'のびてる!': 'I am stretching!', 'БОЛИИИ!': 'IT HUUURTS!', '痛い!!': 'it hurts!!', 'МАМООООО': 'MOOOMMY',
    'моля те…': 'please…', 'やめて…': 'stop…', 'дай!': 'give!', 'ちょうだい': 'give it to me', 'мое!': 'mine!', 'いただき!': 'got it!', 'разтяга се…': 'it stretches…', 'のびる…': 'it stretches…',
    'チーズ!!!': 'CHEESE!!!', 'СИРЕНЕ!!!': 'CHEESE!!!', 'ごちそうさま': 'thank you for the meal', 'ммм.': 'mmm.', 'хе-хе': 'heh-heh', 'いらない': 'do not want it', 'ケチ': 'stingy', 'пф.': 'pff.',
    'いい切れ味': 'a fine edge', 'режи, режи…': 'cut, cut…', 'бум!': 'boom!', 'もったいない': 'what a waste', 'дай го насам': 'hand it over here', 'かっこつけ': 'show-off',
    'хванах!': 'caught it!', 'ナイスパス!': 'nice pass!', 'дай тука!': 'give it here!', 'もらった!': 'mine now!', 'бавно…': 'slowly…', 'まだだよ': 'not yet', 'смачках го.': 'I crushed it.', 'ぐしゃ': 'the sound of crumpling',
  };
  const langOf = (s) => /[぀-ヿ一-鿿]/.test(s) ? 'Jap.' : /[Ѐ-ӿ]/.test(s) ? 'Bulg.' : '';
  const ORN = '<svg class="pb-orn" viewBox="0 0 120 14" width="120" height="14" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.1" stroke-linecap="round" d="M2 7h34M84 7h34M44 7c4-7 10-7 16 0s12 7 16 0M44 7c4 7 10 7 16 0s12-7 16 0"/><path fill="currentColor" d="M60 3.2 63.8 7 60 10.8 56.2 7z"/><circle cx="40" cy="7" r="1.4" fill="currentColor"/><circle cx="80" cy="7" r="1.4" fill="currentColor"/></svg>';

  // ---- the text of the book, built from the live lists ----
  function listOf(L, e) { const src = L[e.src]; if (!src) return null; const v = e.key == null ? src : src[e.key]; return Array.isArray(v) ? v : null; }
  function linesHTML(arr) {
    return [...new Set(arr)].map((s) => {
      const lang = langOf(s), g = GLOSS[s];
      return `<span class="pb-q${s.length > 26 ? ' long' : ''}"${lang ? ` lang="${lang === 'Jap.' ? 'ja' : 'bg'}"` : ''}>“${esc(s)}”</span>` + (lang ? ` <span class="pb-gl">(${lang}${g ? ` <i>${esc(g)}</i>` : ''})</span>` : '');
    }).join('<span class="pb-sep">·</span> ');
  }
  function build() {
    const L = window.__lines;
    if (!L) return `<section class="pb-title"><p class="pb-small">kiripad.dev</p><h2>A Phrasebook</h2>${ORN}<p class="pb-being">Nothing on this site moves or speaks while your system asks for reduced motion, so this book has nothing to record. Switch that setting off and open it again.</p></section>`;
    const chapters = CHAPTERS.map((c) => ({ ...c, entries: c.entries.map((e) => ({ ...e, lines: listOf(L, e) })).filter((e) => e.lines && e.lines.length) }));
    // lists the page has that this book has not been told about yet: they are still printed, in the chapter they belong to
    const known = new Set(CHAPTERS.flatMap((c) => c.entries.filter((e) => e.key != null).map((e) => e.src + '.' + e.key)));
    const extra = (src, test, ch) => { for (const k of Object.keys(L[src] || {})) if (!known.has(src + '.' + k) && Array.isArray(L[src][k]) && test(k)) chapters[ch].entries.push({ src, key: k, title: `Newly heard: “${k}”`, when: 'A saying too new for this edition. The compiler has heard it, and has not yet seen what provokes it.', lines: L[src][k] }); };
    if (!Array.isArray(L.SAY)) { extra('SAY', (k) => k[0] !== 'k', 0); extra('SAY', (k) => k[0] === 'k', 1); }
    extra('CLAW_SAY', () => true, 2);
    let nLines = 0, nOcc = 0; for (const c of chapters) for (const e of c.entries) { nOcc++; nLines += new Set(e.lines).size; }
    let h = `<section class="pb-frontis"><div class="pb-frame"><div class="pb-seal" lang="ja">霧</div></div><p class="pb-cap">The seal of the house. <span lang="ja">霧</span> is <i>kiri</i>, mist; the Bulgarian for it is <span lang="bg">мъгла</span>.</p></section>`;
    h += `<section class="pb-title"><p class="pb-small">kiripad.dev</p><h2>A Phrasebook<small>of the</small>Cards, the Katana<small>&amp;</small>the Hand</h2>${ORN}
      <p class="pb-being">being a true catalogue of the ${nLines} sayings heard on this site, in English, Bulgarian and Japanese, set down under the ${nOcc} occasions that provoke them, with glosses for the traveller</p>${ORN}
      <p class="pb-imprint">Printed in the mist · MMXXVI</p></section>`;
    h += `<section class="pb-contents"><h3>Contents</h3><ol class="pb-toc">${chapters.map((c) => `<li><span class="n">${c.num}.</span><button type="button" data-go="${c.id}">${esc(c.title)}</button><i></i><span data-pg="${c.id}"></span></li>`).join('')}</ol>
      <h3>To the reader</h3>
      <p class="pb-note">Every saying is given exactly as it is spoken, and after it, where it is not English, the language and the sense of it. Where a creature has several things to say on one occasion it chooses among them by chance, so you may need to provoke it more than once to hear them all.</p>
      <p class="pb-note">Distances are in pixels and speeds in pixels a second, as measured on the page itself. Turn the leaves with the arrow keys, or by the outer margins.</p></section>`;
    for (const c of chapters) {
      h += `<header class="pb-chapter" id="pb-${c.id}"><p class="pb-num">Chapter ${c.num}</p><h2>${esc(c.title)}</h2>${ORN}</header><p class="pb-intro">${esc(c.intro)}</p>`;
      for (const e of c.entries) h += `<article class="pb-entry"><h3><span>${esc(e.title)}</span><em>${new Set(e.lines).size}</em></h3><p class="pb-when"><b>When.</b> ${esc(e.when)}</p><p class="pb-lines">${linesHTML(e.lines)}</p></article>`;
    }
    h += `<p class="pb-end"><b>Finis</b>Here the catalogue ends. Go and make them say it.${ORN}</p>`;
    return h;
  }

  // ---- the book itself ----
  let el = null, flow = null, view = null, spread = 0, spreads = 1, isOpen = false, lastFocus = null, turning = 0;
  const q = (s) => el.querySelector(s);
  function make() {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../styles/phrasebook.css', here).href;
    const ready = new Promise((res) => { css.onload = css.onerror = res; }); document.head.appendChild(css);
    el = document.createElement('div'); el.className = 'pb'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', 'Phrasebook');
    el.innerHTML = `<div class="pb-shade"></div>
      <div class="pb-book"><div class="pb-leaves"></div>
        <div class="pb-head"><span>A Phrasebook of kiripad.dev</span><span>Cards, Katana &amp; Hand</span></div>
        <div class="pb-view"><div class="pb-flow"></div></div>
        <div class="pb-foot"><span class="pb-fl"></span><span class="pb-fr"></span></div>
        <button class="pb-edge l" type="button" tabindex="-1" aria-hidden="true"></button><button class="pb-edge r" type="button" tabindex="-1" aria-hidden="true"></button>
        <button class="pb-nav pb-prev" type="button">← back</button><button class="pb-nav pb-next" type="button">turn the page →</button>
        <button class="pb-x" type="button" aria-label="Close the phrasebook">×</button>
      </div><div class="pb-vignette"></div>`;
    document.body.appendChild(el);
    flow = q('.pb-flow'); view = q('.pb-view');
    q('.pb-shade').addEventListener('click', close); q('.pb-x').addEventListener('click', close);
    q('.pb-prev').addEventListener('click', () => go(spread - 1)); q('.pb-next').addEventListener('click', () => go(spread + 1));
    q('.pb-edge.l').addEventListener('click', () => go(spread - 1)); q('.pb-edge.r').addEventListener('click', () => go(spread + 1));
    flow.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(spreadOf(document.getElementById('pb-' + b.dataset.go))); });
    let sx = null; view.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
    view.addEventListener('touchend', (e) => { if (sx == null) return; const d = e.changedTouches[0].clientX - sx; sx = null; if (Math.abs(d) > 50) go(spread + (d < 0 ? 1 : -1)); });
    addEventListener('resize', () => { if (isOpen) layout(); });
    return ready;
  }
  // The text is one long column flow. The view shows two columns of it (one on a phone) and a "page turn" slides the flow by one view
  const cols = () => getComputedStyle(flow).columnCount === '1' ? 1 : 2;
  const gap = () => parseFloat(getComputedStyle(flow).columnGap) || 0;
  const pitch = () => view.clientWidth + gap();
  function spreadOf(node) { if (!node) return 0; return Math.max(0, Math.round((node.getBoundingClientRect().left - flow.getBoundingClientRect().left) / pitch() - 0.25)); }
  function layout() {
    flow.style.transform = 'none';
    spreads = Math.max(1, Math.round((flow.scrollWidth + gap()) / pitch()));
    const n = cols();
    el.querySelectorAll('[data-pg]').forEach((s) => { const node = document.getElementById('pb-' + s.dataset.pg), fr = flow.getBoundingClientRect(); s.textContent = node ? Math.round((node.getBoundingClientRect().left - fr.left) / (pitch() / n)) + 1 : ''; });
    show(Math.min(spread, spreads - 1));
  }
  function show(i) {
    spread = Math.max(0, Math.min(spreads - 1, i));
    flow.style.transform = `translateX(${-spread * pitch()}px)`;
    const n = cols(), p = spread * n + 1;
    q('.pb-fl').textContent = p > 1 ? p : ''; q('.pb-fr').textContent = n === 2 ? p + 1 : '';
    q('.pb-prev').disabled = q('.pb-edge.l').disabled = spread === 0; q('.pb-next').disabled = q('.pb-edge.r').disabled = spread === spreads - 1;
    el.dispatchEvent(new CustomEvent('pb-spread'));
  }
  function go(i) {
    i = Math.max(0, Math.min(spreads - 1, i)); if (i === spread) return;
    clearTimeout(turning); flow.classList.add('turn');
    turning = setTimeout(() => { show(i); flow.classList.remove('turn'); }, 150);
  }
  function onKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') close();
    else if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') go(spread + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(spread - 1);
    else if (e.key === 'Home') go(0); else if (e.key === 'End') go(spreads - 1);
    else if (e.key === 'Tab') { const f = [...el.querySelectorAll('button:not(:disabled):not([tabindex="-1"])')], k = f.indexOf(document.activeElement); e.preventDefault(); (f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length] || f[0]).focus(); return; }
    else if (e.key.length !== 1) return;
    e.preventDefault(); e.stopPropagation();   // nothing typed in the book reaches the page under it
  }
  document.addEventListener('keydown', onKey, true);
  async function open() {
    if (isOpen) return;
    isOpen = true; lastFocus = document.activeElement;
    if (!el) await make();
    flow.innerHTML = build(); spread = 0;
    el.hidden = false; document.documentElement.classList.add('pb-lock');
    layout(); requestAnimationFrame(() => el.classList.add('in'));
    q('.pb-x').focus({ preventScroll: true });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (isOpen) layout(); });
    el.dispatchEvent(new CustomEvent('pb-open'));
  }
  function close() {
    if (!isOpen) return;
    isOpen = false; el.classList.remove('in'); document.documentElement.classList.remove('pb-lock');
    el.dispatchEvent(new CustomEvent('pb-close'));
    setTimeout(() => { if (!isOpen) el.hidden = true; }, 280);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // ---- the button: a translate sign, next to the theme switch ----
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'icon-btn pb-open-btn'; btn.id = 'phrasebook'; btn.title = 'Phrasebook: what everything on this page says, and why'; btn.setAttribute('aria-label', 'Open the phrasebook');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
  btn.addEventListener('click', open);
  nav.insertBefore(btn, document.getElementById('theme'));
  window.__phrasebook = { open, close, state: () => ({ isOpen, spread, spreads }), get el() { return el; } };
})();
