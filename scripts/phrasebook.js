// The phrasebook of kiripad.dev. A translate button in the header opens a near-fullscreen menu (one big card over the tinted page) that lists every line the cards,
// the katana and the hand can say, what sets each one off, and what the Bulgarian and Japanese ones mean.
// The lines themselves are NOT kept here: they are read from the page's own lists (window.__lines, set in index.html), so a line added
// there turns up in the menu by itself. Only the descriptions of the triggers and the translations live in this file.
(() => {
  const nav = document.querySelector('header.top .nav'); if (!nav) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Bump VER, and the ?v= on this file's script tag in index.html, whenever this file or the stylesheet changes. GitHub Pages caches each
  // file for ten minutes on its own, and a new script with an old stylesheet looks broken; the version makes them arrive as a pair
  const VER = 3;
  const here = (document.currentScript && document.currentScript.src) || '/scripts/phrasebook.js';

  // ---- what this file knows: which occasion each list belongs to. src = which list on window.__lines, key = which entry of it ----
  const CHAPTERS = [
    { id: 'cards', num: 'I', title: 'The Cards', head: 'Of the Cards',
      intro: 'The cards of this site are rooted in their grid and would like to stay there. Each one may be taken by any part of it and pulled; it will complain from the first pixel, and louder the worse you treat it. A card is never silent for long, but it will not speak twice within about a second and a half unless something new is done to it.',
      entries: [
        { src: 'SAY', key: 'pull', title: 'On being taken hold of', when: 'You begin to drag a card that still sits in its place in the grid. A card the Hand plucks out of the air says the same.' },
        { src: 'SAY', key: 'strain', title: 'Under strain', when: 'You have pulled some 160 px from where you took hold, and the root begins to lose its grip.' },
        { src: 'SAY', key: 'back', title: 'Let go in time', when: 'You release the card before it tears. It springs home, and gloats.' },
        { src: 'SAY', key: 'rip', title: 'Torn out', when: 'You pull past 350 px, or hold the strain until the root gives up. The card comes loose in your hand.' },
        { fig: 'pull' },
        { src: 'SAY', key: 'throw', title: 'Thrown', when: 'A loose card is let go at more than 900 px a second.' },
        { src: 'SAY', key: 'land', title: 'A hard landing', when: 'The card strikes something at more than 500 px a second, and survives it.' },
        { src: 'SAY', key: 'smash', title: 'Shattered', when: 'A thrown card meets a wall, the floor or another card at more than 1300 px a second. Only a thrown card breaks; one that is dropped or carried never does.' },
        { fig: 'smash' },
        { src: 'SAY', key: 'cutting', title: 'With the blade inside', when: 'The very tip of the katana has entered the card and has not yet come out.' },
        { src: 'SAY', key: 'stab', title: 'Stabbed, not cut', when: 'The tip leaves by the same side it came in through. The card is not divided, but it bleeds for a while.' },
        { src: 'SAY', key: 'slice', title: 'Cut in two', when: 'The tip goes in by one side and out by another. These are also the last words of a card torn in half between you and the Hand.' },
        { fig: 'cut' },
        { src: 'AGONY', key: 0, title: 'Stretched: the first degree', when: 'You and the Hand each hold an end of the same card, and it has begun to grow longer.' },
        { src: 'AGONY', key: 1, title: 'Stretched: the second degree', when: 'The card is pulled past a third of what it can bear. Also said in the Hand’s fist, while it is being crushed.' },
        { src: 'AGONY', key: 2, title: 'Stretched: the third degree', when: 'The card is close to tearing, or close to being a ball of paper. The letters grow, redden and shake.' },
        { src: 'BEG', key: null, title: 'Begging', when: 'In the Hand’s closed fist, in the quiet pause after the second squeeze.' },
      ] },
    { id: 'katana', num: 'II', title: 'The Katana', head: 'Of the Katana',
      intro: 'Hidden in the mist of the banner stands a katana, and it has a very high opinion of itself. It is drawn like a card, by pulling, and a double click keeps it in the hand. Only its very tip cuts, at any speed whatever. It speaks once and is then quiet for two seconds, however much it has done in the meantime.',
      entries: [
        { fig: 'katana' },
        { src: 'SAY', key: 'khello', title: 'Introducing itself', when: 'You tear it out of the banner, or double-click to take it in hand.' },
        { src: 'SAY', key: 'kbrag', title: 'Boasting', when: 'It has just cut a card in two while you were holding it. It boasts about two times in five.' },
        { src: 'SAY', key: 'kcut', title: 'Cutting by accident', when: 'It cuts a card with nobody holding it, on its way down the page.' },
        { src: 'SAY', key: 'kdrop', title: 'Dropped', when: 'You let go of it.' },
      ] },
    { id: 'hand', num: 'III', title: 'The Hand', head: 'Of the Hand',
      intro: 'Something lives past the right edge of the screen, and it wants your cards. It shows itself only after the first card has been torn loose. It has one eye, on the back of the hand, and opinions on everything it sees. It never answers at once: every remark waits up to three seconds, and two full seconds always pass between any two things it says.',
      entries: [
        { src: 'CLAW_SAY', key: 'eager', title: 'Wanting', when: 'You carry a loose card towards the right edge of the screen. Said again if you keep it waiting.' },
        { fig: 'hand' },
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
        { fig: 'fist' },
        { src: 'CLAW_SAY', key: 'caught', title: 'A catch', when: 'You throw a card towards the right edge, and it plucks it out of the air.' },
        { src: 'CLAW_SAY', key: 'slip', title: 'Losing its grip', when: 'You yank the card away the moment it grabs, or take back the card it was celebrating with.' },
        { src: 'CLAW_SAY', key: 'cut', title: 'Watching a cut', when: 'It saw the katana divide a card.' },
        { src: 'CLAW_SAY', key: 'stab', title: 'Watching a stab', when: 'It saw the katana go in and come out the same way.' },
        { src: 'CLAW_SAY', key: 'smash', title: 'Watching a card shatter', when: 'It saw a thrown card break.' },
        { src: 'CLAW_SAY', key: 'throw', title: 'Watching a throw', when: 'It saw you throw a card.' },
        { src: 'CLAW_SAY', key: 'katana', title: 'On the katana', when: 'It saw you draw the katana, or take it in hand.' },
        { src: 'CLAW_SAY', key: 'kdrop', title: 'On the katana, dropped', when: 'It saw you drop the katana.' },
        { src: 'CLAW_SAY', key: 'hello', title: 'Answering a no', when: 'Surprise me offers you a project and you say No. The Hand comes out to see about that.' },
        { src: 'CLAW_SAY', key: 'flip', title: 'The toss', when: 'It throws a coin and makes you call it, heads or tails.' },
        { src: 'CLAW_SAY', key: 'won', title: 'Beaten by a coin', when: 'You called it right. You may stay on the page.' },
        { src: 'CLAW_SAY', key: 'lost', title: 'The taunt', when: 'You called it wrong. It reaches over and presses Yes for you.' },
        { src: 'CLAW_SAY', key: 'idgaf', title: 'Not bothering with the coin', when: 'One toss in ten it pockets the coin and decides for you anyway.' },
        { src: 'CLAW_SAY', key: 'bye', title: 'Seeing you off', when: 'Its finger is on the Yes button. You are leaving.' },
      ] },
  ];
  // what the Bulgarian and Japanese lines mean. A line that is missing here is simply printed without a gloss
  const GLOSS = {
    'здрасти.': 'hi.', 'やあ。': 'hey.', 'ези или тура?': 'heads or tails?', '表か裏か?': 'heads or tails?', 'пф. късмет.': 'pff. luck.', 'ちっ': 'tch',
    'не позна!': 'wrong guess!', 'ハズレ!': 'miss!', 'майната ѝ на монетата': 'to hell with the coin', 'どうでもいい。行け。': 'whatever. go.', 'ЧАО-ЧАО!': 'BYE-BYE!', 'バイバイ!': 'bye-bye!',
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
  const langOf = (s) => /[぀-ヿ一-鿿]/.test(s) ? 'JP' : /[Ѐ-ӿ]/.test(s) ? 'BG' : '';

  // ---- the figures: small static drawings in the page's own colours. The katana and the hand are not redrawn here:
  // they are the page's own drawings (window.__hand), posed once and printed ----
  let figN = 0;
  const INK = 'fill="none" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round"';
  const zig = (x0, x1, y) => { let d = `M${x0} ${y + 3}`; for (let x = x0 + 4, up = true; x <= x1; x += 4, up = !up) d += `L${x} ${up ? y - 3 : y + 3}`; return d; };
  const cardG = (tf, extra = '') => `<g transform="${tf}"><rect width="112" height="72" rx="6" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M.7 13h110.6" stroke="var(--ink)" stroke-width=".8"/>
    <path d="${zig(6, 106, 6.5)}" fill="none" stroke="var(--rubric)" stroke-width="1.2"/><path d="M10 27h50" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M10 40h90M10 48h82M10 56h60" stroke="var(--ink)" stroke-width="1" opacity=".55" stroke-linecap="round"/>${extra}</g>`;
  const bubble = (x, y, text, red) => { const w = Math.max(30, [...text].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e7f ? 11 : ch === ch.toLowerCase() ? 6.4 : 8.6), 0) + 18); return `<g transform="translate(${x - w / 2} ${y})"><rect width="${w}" height="20" rx="10" fill="var(--${red ? 'rubric' : 'ink'})"/><path d="M${w / 2 - 5} 19l5 6 5-6z" fill="var(--${red ? 'rubric' : 'ink'})"/><text x="${w / 2}" y="14" text-anchor="middle" font-size="11.5" font-weight="700" font-family="system-ui, sans-serif" fill="var(--paper)">${esc(text)}</text></g>`; };
  const cursor = (x, y) => `<path transform="translate(${x} ${y})" d="M0 0v17l4.6-4.2 3 7 2.9-1.3-3-6.8h6.2z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/>`;
  const hatch = (id) => `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="var(--ink)" stroke-width="1"/></pattern></defs>`;
  const first = (L, src, key, fallback) => { const a = L && L[src] && L[src][key]; return (Array.isArray(a) && a.find((s) => !langOf(s) && s.length < 14)) || fallback; };
  function handPrint(pose, a) {   // the page's hand, held in a pose for a moment and copied as paths
    const H = window.__hand; if (!H) return '';
    try {
      const c = H.get(), parts = ['thumb', 'talonT', 'flesh', 'talon', 'crease', 'vein', 'eye', 'pupil'], vw = document.documentElement.clientWidth;
      const keep = { x: c.x, y: c.y, a: c.a, sh: c.sh, pose: c.pose, d: parts.map((k) => c[k].getAttribute('d')), eye: c.eye.getAttribute('class') };
      Object.assign(c, { x: vw - 250, y: 400, a: a, sh: 520, pose: { ...H.POSES[pose] } }); H.draw(0, 0, 0);
      const out = parts.map((k) => `<path class="${k === 'thumb' ? 'flesh' : k === 'talonT' ? 'talon' : c[k].getAttribute('class')}" d="${c[k].getAttribute('d')}"/>`).join('');
      Object.assign(c, { x: keep.x, y: keep.y, a: keep.a, sh: keep.sh, pose: keep.pose }); parts.forEach((k, i) => { if (keep.d[i] == null) c[k].removeAttribute('d'); else c[k].setAttribute('d', keep.d[i]); }); c.eye.setAttribute('class', keep.eye || 'eye');
      return `<svg class="pb-hand" viewBox="${vw - 440} 270 400 250" aria-hidden="true">${out}</svg>`;
    } catch (e) { return ''; }
  }
  const FIGS = {
    pull: (L) => [`<svg viewBox="0 0 340 150" aria-hidden="true">
        ${cardG('translate(4 62)')}${cardG('translate(224 62)')}
        <rect x="114" y="62" width="112" height="72" rx="6" ${INK} stroke-width="1.1" stroke-dasharray="4 4" opacity=".7"/>
        <path d="M150 96c8-10 18-16 30-20M168 110c8-8 16-13 26-17M140 80c6-8 14-14 24-18" ${INK} stroke-width=".9" opacity=".6"/>
        ${cardG('translate(150 34) rotate(-13 56 36)')}${bubble(206, 2, first(L, 'SAY', 'pull', 'hey!'))}${cursor(243, 52)}</svg>`,
      'A card taken hold of by the corner. It turns about the point where it is held, and its place in the grid is kept for it.'],
    smash: (L) => { let sh = ''; const P = [[0, 0, 26, -8, 30, 20, 6, 26], [34, -30, 62, -44, 70, -18, 44, -8], [40, 10, 72, 2, 80, 30, 50, 34], [84, -40, 118, -52, 122, -26, 92, -18], [96, 2, 130, -6, 140, 22, 108, 26], [60, 52, 92, 44, 100, 66, 70, 72], [16, 44, 40, 40, 44, 60, 22, 64], [136, -66, 160, -74, 164, -54, 142, -48], [150, 40, 176, 34, 180, 56, 156, 60], [120, 62, 138, 58, 142, 74, 124, 78]];
      for (const q of P) sh += `<path d="M${q[0]} ${q[1]}L${q[2]} ${q[3]}L${q[4]} ${q[5]}L${q[6]} ${q[7]}Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/><path d="M${(q[0] + q[6]) / 2 + 3} ${(q[1] + q[7]) / 2}L${(q[2] + q[4]) / 2 - 3} ${(q[3] + q[5]) / 2}" stroke="var(--ink)" stroke-width=".8" opacity=".5"/>`;
      return [`<svg viewBox="0 0 340 170" aria-hidden="true">${hatch('pb-h1')}<rect x="0" y="0" width="22" height="170" fill="url(#pb-h1)"/><path d="M22 0v170" ${INK} stroke-width="1.6"/>
        <path d="M22 84l22-34M22 84l30-12M22 84l32 8M22 84l24 30M22 84l10-44M22 84l8 42" ${INK} stroke="var(--rubric)" stroke-width="1.3"/>
        <g transform="translate(52 78)">${sh}</g><path d="M330 20C290 26 250 38 214 58" ${INK} stroke-width="1" stroke-dasharray="2 5"/><path d="M214 58l11-1M214 58l6-9" ${INK} stroke-width="1"/>
        ${bubble(268, 104, 'KRRRK—', true)}</svg>`, 'The end of a thrown card. The pieces fly from the place where it struck; the large ones remain, and may be picked up, stacked, cut or thrown again.']; },
    cut: () => [`<svg viewBox="0 0 340 120" aria-hidden="true">
        <g transform="translate(18 26)"><path d="M0 6a6 6 0 0 1 6-6h46l-10 72H6a6 6 0 0 1-6-6z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M64 0h46a6 6 0 0 1 6 6v60a6 6 0 0 1-6 6H54z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/>
          <path d="M66-22L46 94" ${INK} stroke="var(--rubric)" stroke-width="1.3" stroke-dasharray="5 4"/><path d="M46 94l-1-10M46 94l8-7" ${INK} stroke="var(--rubric)" stroke-width="1.3"/><circle cx="62" cy="0" r="3" fill="var(--rubric)"/><circle cx="50" cy="72" r="3" fill="var(--rubric)"/>
          <path d="M10 22h26M10 34h30M10 44h22M74 22h30M72 34h34M70 44h24" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round"/></g>
        <text x="30" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">a.</text>
        <g transform="translate(204 26)"><rect width="116" height="72" rx="6" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/>
          <path d="M40-22C44 10 52 36 60 40C68 36 74 10 78-22" ${INK} stroke="var(--rubric)" stroke-width="1.3" stroke-dasharray="5 4"/><path d="M78-22l-7 6M78-22l3 9" ${INK} stroke="var(--rubric)" stroke-width="1.3"/><circle cx="43.500" cy="0" r="3" fill="var(--rubric)"/><circle cx="74.500" cy="0" r="3" fill="var(--rubric)"/>
          <path d="M60 42v9M56 46l4 5 4-5" ${INK} stroke="var(--rubric)" stroke-width="1.2"/><circle cx="60" cy="60" r="2" fill="var(--rubric)"/><circle cx="60" cy="67" r="1.4" fill="var(--rubric)"/>
          <path d="M10 22h24M10 34h30M10 44h22M84 22h22M80 34h26M78 44h20" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round"/></g>
        <text x="216" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">b.</text></svg>`,
      '<b>a.</b> In by one side and out by another: a cut, made from the point of entry to the point of leaving. <b>b.</b> In and out by the same side: a stab.'],
    katana: () => { const H = window.__hand; if (!H) return null; const id = 'pb-kat' + (++figN);
      return [`<svg class="pb-kat" viewBox="-6 -22 312 74" aria-hidden="true"><g transform="translate(0 40) rotate(-90)">${H.katanaSvg(id).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>
        <path d="M296 5l0-16" ${INK} stroke-width=".9"/><text x="296" y="-14" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">a.</text>
        <path d="M100 30h180M100 26v8M280 26v8" ${INK} stroke-width=".9"/><text x="190" y="46" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">b.</text></svg>`,
      'The katana. <b>a.</b> The tip, which cuts whatever it touches. <b>b.</b> The rest of the blade, which passes through everything and only looks sharp.']; },
    hand: () => { const s = handPrint('eager', Math.PI); return s && [s, 'The Hand, wanting. The eye opens wide and the fingers spread when a loose card comes near.']; },
    fist: () => { const s = handPrint('joy', Math.PI + 0.12); return s && [s, 'The Hand, pleased with itself. When it is happy the eye closes to a curve.']; },
  };
  function figure(name, L) {
    let f = null; try { f = FIGS[name](L); } catch (e) { f = null; }
    return f ? `<figure class="pb-fig pb-fig-${name}">${f[0]}<figcaption><b>Fig. ${++figN_plate}</b> ${f[1]}</figcaption></figure>` : '';
  }
  let figN_plate = 0;

  // ---- the text, built from the live lists ----
  function listOf(L, e) { const src = L[e.src]; if (!src) return null; const v = e.key == null ? src : src[e.key]; return Array.isArray(v) ? v : null; }
  function linesHTML(arr) {
    return [...new Set(arr)].map((s) => {
      const lang = langOf(s), g = GLOSS[s];
      return `<span class="pb-chip"${lang ? ` lang="${lang === 'JP' ? 'ja' : 'bg'}"` : ''}><b>${esc(s)}</b>${lang ? `<i lang="en">${lang}${g ? ' · ' + esc(g) : ''}</i>` : ''}</span>`;
    }).join('');
  }
  function build() {
    const L = window.__lines; figN_plate = 0;
    if (!L) return { head: 'Nothing to list', nav: '', body: '<p class="pb-intro">Nothing on this site moves or speaks while your system asks for reduced motion, so there are no lines to show. Switch that setting off and open this again.</p>' };
    const chapters = CHAPTERS.map((c) => ({ ...c, entries: c.entries.map((e) => e.fig ? e : ({ ...e, lines: listOf(L, e) })).filter((e) => e.fig || (e.lines && e.lines.length)) }));
    // lists the page has that this file has not been told about yet: they are still shown, in the section they belong to
    const known = new Set(CHAPTERS.flatMap((c) => c.entries.filter((e) => e.key != null).map((e) => e.src + '.' + e.key)));
    const extra = (src, test, ch) => { for (const k of Object.keys(L[src] || {})) if (!known.has(src + '.' + k) && Array.isArray(L[src][k]) && test(k)) chapters[ch].entries.push({ src, key: k, title: `New: “${k}”`, when: 'A new set of lines. What sets it off has not been written down here yet.', lines: L[src][k] }); };
    extra('SAY', (k) => k[0] !== 'k', 0); extra('SAY', (k) => k[0] === 'k', 1); extra('CLAW_SAY', () => true, 2);
    let nLines = 0, nOcc = 0; for (const c of chapters) { c.n = 0; for (const e of c.entries) if (!e.fig) { nOcc++; c.n += new Set(e.lines).size; } nLines += c.n; }
    let h = '';
    for (const c of chapters) {
      h += `<section class="pb-sec pb-sec-${c.id}" id="pb-${c.id}"><header class="pb-sec-h"><h3>${esc(c.title)}</h3><span class="pb-pill">${c.n} lines</span></header><p class="pb-intro">${esc(c.intro)}</p><div class="pb-grid">`;
      for (const e of c.entries) h += e.fig ? figure(e.fig, L) : `<article class="pb-entry"><h4>${esc(e.title)}<span class="pb-pill">${new Set(e.lines).size}</span></h4><p class="pb-when"><b>When</b> ${esc(e.when)}</p><div class="pb-lines">${linesHTML(e.lines)}</div></article>`;
      h += '</div></section>';
    }
    h += '<p class="pb-end">That is all of them. Go and make them say it.</p>';
    return { head: `${nLines} lines, ${nOcc} triggers`, nav: chapters.map((c) => `<button type="button" class="pb-tab" data-go="${c.id}">${esc(c.title)}</button>`).join(''), body: h };
  }

  // ---- the menu: one big card over a tinted page, scrolling top to bottom ----
  let el = null, scroller = null, isOpen = false, lastFocus = null;
  const q = (s) => el.querySelector(s);
  function make() {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../styles/phrasebook.css?v=' + VER, here).href;
    const ready = new Promise((res) => { css.onload = css.onerror = res; }); document.head.appendChild(css);
    el = document.createElement('div'); el.className = 'pb'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'pb-title');
    el.innerHTML = `<div class="pb-shade"></div>
      <div class="pb-card">
        <header class="pb-top"><div class="pb-top-row"><div><h2 id="pb-title">Phrasebook</h2><p class="pb-sub">Everything the cards, the katana and the hand can say, and what sets it off. <span class="pb-count"></span></p></div>
          <button class="icon-btn pb-x" type="button" aria-label="Close the phrasebook">✕</button></div><nav class="pb-tabs" aria-label="Sections"></nav></header>
        <div class="pb-scroll" tabindex="-1"></div>
      </div>`;
    document.body.appendChild(el);
    scroller = q('.pb-scroll');
    q('.pb-shade').addEventListener('click', close); q('.pb-x').addEventListener('click', close);
    q('.pb-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'), sec = b && document.getElementById('pb-' + b.dataset.go); if (sec) scroller.scrollTo({ top: sec.offsetTop - 8, behavior: 'smooth' }); });
    scroller.addEventListener('scroll', () => { let cur = null; el.querySelectorAll('.pb-sec').forEach((s) => { if (s.offsetTop - 140 <= scroller.scrollTop) cur = s.id.slice(3); }); el.querySelectorAll('.pb-tab').forEach((t) => t.classList.toggle('on', t.dataset.go === cur)); el.classList.toggle('scrolled', scroller.scrollTop > 4); }, { passive: true });
    return ready;
  }
  function onKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { const f = [...el.querySelectorAll('button:not(:disabled)')], k = f.indexOf(document.activeElement); e.preventDefault(); (f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length] || f[0]).focus(); }
    e.stopPropagation();   // nothing typed in the menu reaches the page under it
  }
  document.addEventListener('keydown', onKey, true);
  async function open() {
    if (isOpen) return;
    isOpen = true; lastFocus = document.activeElement;
    if (!el) await make();
    const b = build(); scroller.innerHTML = b.body; q('.pb-count').textContent = b.head + '.'; q('.pb-tabs').innerHTML = b.nav;
    el.hidden = false; document.documentElement.classList.add('pb-lock'); scroller.scrollTop = 0; scroller.dispatchEvent(new Event('scroll'));
    requestAnimationFrame(() => el.classList.add('in'));
    scroller.focus({ preventScroll: true });   // so the arrow keys, space and page keys scroll it straight away
    el.dispatchEvent(new CustomEvent('pb-open'));
  }
  function close() {
    if (!isOpen) return;
    isOpen = false; el.classList.remove('in'); document.documentElement.classList.remove('pb-lock');
    el.dispatchEvent(new CustomEvent('pb-close'));
    setTimeout(() => { if (!isOpen) el.hidden = true; }, 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // ---- the button: a translate sign, next to the theme switch ----
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'icon-btn pb-open-btn'; btn.id = 'phrasebook'; btn.title = 'Phrasebook: what everything on this page says, and why'; btn.setAttribute('aria-label', 'Open the phrasebook');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
  btn.addEventListener('click', open);
  nav.insertBefore(btn, document.getElementById('theme'));
  window.__phrasebook = { open, close, state: () => ({ isOpen }), get el() { return el; } };
})();
