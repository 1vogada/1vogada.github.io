// The figures in the phrasebook (legacy scripts/phrasebook.js figN, INK, zig, cardG, bubble (SVG), cursor, hatch, first, handParts
// (a posed copy of the page's hand), handPrint, kat, FIGS, figure, figN_plate). Moved verbatim; the lists are read with
// core/lines list(key) (legacy window.__lines, thinned the same way in English-only mode), the hand and the katana's drawing
// come off app (legacy window.__hand: absent under reduced motion, so the figures that need them are left out).
// The words in the figures' little bubbles are drawings, not lines anyone says: the first short English line of a list, or the
// literal fallback a figure carries (legacy, kept with the figure).
import { list, langOf } from '../core/lines.js';

let app = null;
/** legacy window.__hand (null under reduced motion: cardPhysics() returned before publishing it) */
const hand = () => (app && !app.reduced && app.hand ? app.hand : null);
const katanaSvg = (id) => (app && app.katana && app.katana.katanaSvg ? app.katana.katanaSvg(id) : '');
/** legacy phrasebook esc */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// ---- the figures: small static drawings in the page's own colours. The katana and the hand are not redrawn here:
// they are the page's own drawings, posed once and printed ----
let figN = 0;
const INK = 'fill="none" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round"';
const zig = (x0, x1, y) => { let d = `M${x0} ${y + 3}`; for (let x = x0 + 4, up = true; x <= x1; x += 4, up = !up) d += `L${x} ${up ? y - 3 : y + 3}`; return d; };
const cardG = (tf, extra = '') => `<g transform="${tf}"><rect width="112" height="72" rx="6" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M.7 13h110.6" stroke="var(--ink)" stroke-width=".8"/>
    <path d="${zig(6, 106, 6.5)}" fill="none" stroke="var(--rubric)" stroke-width="1.2"/><path d="M10 27h50" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M10 40h90M10 48h82M10 56h60" stroke="var(--ink)" stroke-width="1" opacity=".55" stroke-linecap="round"/>${extra}</g>`;
const bubble = (x, y, text, red) => { const w = Math.max(30, [...text].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e7f ? 11 : ch === ch.toLowerCase() ? 6.4 : 8.6), 0) + 18); return `<g transform="translate(${x - w / 2} ${y})"><rect width="${w}" height="20" rx="10" fill="var(--${red ? 'rubric' : 'ink'})"/><path d="M${w / 2 - 5} 19l5 6 5-6z" fill="var(--${red ? 'rubric' : 'ink'})"/><text x="${w / 2}" y="14" text-anchor="middle" font-size="11.5" font-weight="700" font-family="system-ui, sans-serif" fill="var(--paper)">${esc(text)}</text></g>`; };
const cursor = (x, y) => `<path transform="translate(${x} ${y})" d="M0 0v17l4.6-4.2 3 7 2.9-1.3-3-6.8h6.2z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/>`;
const hatch = (id) => `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="var(--ink)" stroke-width="1"/></pattern></defs>`;
const first = (key, fallback) => { const a = list(key); return (Array.isArray(a) && a.find((s) => langOf(s) === 'en' && s.length < 14)) || fallback; };
// the page's hand, held in a pose for a moment and copied as paths. x, y: where the wrist goes in the figure. It comes back in two layers,
// thumb (under) and the rest (over), so a card can be drawn between them and sit in its grip
function handParts(pose, a, x, y, sh = 70) {
  const H = hand(); if (!H) return null;
  try {
    const c = H.get(), parts = ['thumb', 'talonT', 'flesh', 'talon', 'crease', 'vein', 'eye', 'pupil'], vw = document.documentElement.clientWidth;
    const keep = { x: c.x, y: c.y, a: c.a, sh: c.sh, pose: c.pose, d: parts.map((k) => c[k].getAttribute('d')), eye: c.eye.getAttribute('class') };
    Object.assign(c, { x: vw - 250, y: 400, a, sh: 400 + sh, pose: typeof pose === 'string' ? { ...H.POSES[pose] } : { ...H.POSES.lurk, ...pose } }); H.draw(0, 0, 0);
    const g = (ks) => `<g class="pb-hand" transform="translate(${x - (vw - 250)} ${y - 400})">${ks.map((k) => `<path class="${k === 'thumb' ? 'flesh' : k === 'talonT' ? 'talon' : c[k].getAttribute('class')}" d="${c[k].getAttribute('d') || ''}"/>`).join('')}</g>`;
    const out = { under: g(parts.slice(0, 2)), over: g(parts.slice(2)) }; out.all = out.under + out.over;
    Object.assign(c, { x: keep.x, y: keep.y, a: keep.a, sh: keep.sh, pose: keep.pose }); parts.forEach((k, i) => { if (keep.d[i] == null) c[k].removeAttribute('d'); else c[k].setAttribute('d', keep.d[i]); }); c.eye.setAttribute('class', keep.eye || 'eye');
    return out;
  } catch (e) { return null; }
}
function handPrint(pose, a) { const h = handParts(pose, a, 190, 130, 120); return h ? `<svg class="pb-clip" viewBox="0 0 400 250" aria-hidden="true">${h.all}</svg>` : ''; }
const kat = (tf) => { const H = hand(); return H ? `<g class="pb-kat" transform="${tf}">${katanaSvg('pb-kat' + (++figN)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>` : ''; };
const FIGS = {
  pull: () => [`<svg viewBox="0 0 340 150" aria-hidden="true">
        ${cardG('translate(4 62)')}${cardG('translate(224 62)')}
        <rect x="114" y="62" width="112" height="72" rx="6" ${INK} stroke-width="1.1" stroke-dasharray="4 4" opacity=".7"/>
        <path d="M150 96c8-10 18-16 30-20M168 110c8-8 16-13 26-17M140 80c6-8 14-14 24-18" ${INK} stroke-width=".9" opacity=".6"/>
        ${cardG('translate(150 34) rotate(-13 56 36)')}${bubble(206, 2, first('card.pull', 'hey!'))}${cursor(243, 52)}</svg>`,
    'A card taken hold of by the corner. It turns about the point where it is held, and its place in the grid is kept for it.'],
  smash: () => { let sh = ''; const P = [[0, 0, 26, -8, 30, 20, 6, 26], [34, -30, 62, -44, 70, -18, 44, -8], [40, 10, 72, 2, 80, 30, 50, 34], [84, -40, 118, -52, 122, -26, 92, -18], [96, 2, 130, -6, 140, 22, 108, 26], [60, 52, 92, 44, 100, 66, 70, 72], [16, 44, 40, 40, 44, 60, 22, 64], [136, -66, 160, -74, 164, -54, 142, -48], [150, 40, 176, 34, 180, 56, 156, 60], [120, 62, 138, 58, 142, 74, 124, 78]];
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
  katana: () => { const H = hand(); if (!H) return null; const id = 'pb-kat' + (++figN);
    return [`<svg class="pb-kat" viewBox="-6 -22 312 74" aria-hidden="true"><g transform="translate(0 40) rotate(-90)">${katanaSvg(id).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>
        <path d="M296 5l0-16" ${INK} stroke-width=".9"/><text x="296" y="-14" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">a.</text>
        <path d="M100 30h180M100 26v8M280 26v8" ${INK} stroke-width=".9"/><text x="190" y="46" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">b.</text></svg>`,
    'The katana. <b>a.</b> The tip, which cuts whatever it touches. <b>b.</b> The rest of the blade, which passes through everything and only looks sharp.']; },
  hand: () => { const s = handPrint('eager', Math.PI); return s && [s, 'The Hand, wanting. The eye opens wide and the fingers spread when a loose card comes near.']; },
  fist: () => { const s = handPrint('joy', Math.PI + 0.12); return s && [s, 'The Hand, pleased with itself. When it is happy the eye closes to a curve.']; },
  // ---- more figures. The ones with the hand in them use the page's own drawing of it (handParts), placed among the other shapes ----
  strain: () => [`<svg viewBox="0 0 340 160" aria-hidden="true">
        ${cardG('translate(4 78)')}${cardG('translate(224 78)')}
        <rect x="114" y="78" width="112" height="72" rx="6" ${INK} stroke-width="1.1" stroke-dasharray="4 4" opacity=".7"/>
        <path d="M132 80C140 66 150 70 162 58M158 80C164 68 176 74 184 62M186 80C190 70 202 76 208 66M210 80C214 72 222 76 228 70" ${INK} stroke="var(--rubric)" stroke-width="1.5"/>
        ${cardG('translate(150 6) rotate(-9 56 36)')}
        <path d="M138 30l-8-4M136 44l-9 1M272 14l8-5M276 30l9-1" ${INK} stroke-width="1.1"/>
        ${bubble(96, 34, first('card.strain', 'nnngh!'))}${cursor(232, 30)}</svg>`,
    'Under strain. Past 160 px of pull the root starts to let go, strand by strand, and the card shakes.'],
  back: () => [`<svg viewBox="0 0 340 150" aria-hidden="true">
        ${cardG('translate(4 62)')}${cardG('translate(224 62)')}
        <rect x="114" y="62" width="112" height="72" rx="6" ${INK} stroke-width="1.1" stroke-dasharray="4 4" opacity=".7"/>
        ${cardG('translate(118 56) rotate(3 56 36)')}
        <path d="M300 18C270 14 244 24 226 44" ${INK} stroke-width="1" stroke-dasharray="2 5"/><path d="M226 44l10-3M226 44l3-10" ${INK} stroke-width="1"/>
        <path d="M108 52c-6 6-8 14-6 22M236 50c6 6 8 14 6 22M100 44c-9 9-12 20-9 32" ${INK} stroke-width="1" opacity=".6"/>
        ${bubble(170, 16, first('card.back', 'ha!'))}${cursor(304, 14)}</svg>`,
    'Let go in time. The root pulls the card straight home, where it wobbles once and gloats.'],
  fly: () => [`<svg viewBox="0 0 340 150" aria-hidden="true">
        <path d="M20 132C70 60 150 30 250 38" ${INK} stroke-width="1" stroke-dasharray="2 5"/>
        <path d="M150 66h-46M146 82h-58M150 98h-40" ${INK} stroke-width="1.4"/><path d="M96 74h-22M82 90h-18" ${INK} stroke-width="1" opacity=".6"/>
        ${cardG('translate(166 34) rotate(14 56 36)')}${cursor(22, 118)}
        <path d="M36 112l8-9M44 122l11-4" ${INK} stroke-width="1"/>
        ${bubble(228, 4, first('card.throw', 'wheee'))}</svg>`,
    'Thrown. Let go at more than 900 px a second and the card keeps the speed of the hand that threw it.'],
  land: () => [`<svg viewBox="0 0 340 150" aria-hidden="true">${hatch('pb-h2')}
        <rect x="0" y="128" width="340" height="22" fill="url(#pb-h2)" opacity=".7"/><path d="M0 128h340" ${INK} stroke-width="1.6"/>
        <path d="M250 6C236 30 220 46 204 60" ${INK} stroke-width="1" stroke-dasharray="2 5"/>
        ${cardG('translate(108 51) rotate(-7 56 36)')}
        <path d="M104 126l-14-8M100 118l-10-12M232 124l14-10M236 114l8-12" ${INK} stroke-width="1.2"/>
        <path d="M70 124a7 5 0 1 1 12 0M254 124a8 5 0 1 1 14 0M44 125a5 4 0 1 1 9 0" ${INK} stroke-width="1" opacity=".7"/>
        ${bubble(126, 14, first('card.land', 'oof'))}</svg>`,
    'A hard landing. Faster than 500 px a second it hurts; only a thrown card going faster than 1300 breaks.'],
  stack: () => [`<svg viewBox="0 -24 340 194" aria-hidden="true">${hatch('pb-h3')}
        <rect x="0" y="150" width="340" height="20" fill="url(#pb-h3)" opacity=".7"/><path d="M0 150h340" ${INK} stroke-width="1.6"/>
        ${cardG('translate(110 108) scale(1 .56)')}${cardG('translate(122 67) scale(1 .56)')}${cardG('translate(104 26) scale(1 .56)')}${cardG('translate(118 -15) scale(1 .56)')}
        <path d="M262 -14v40M262 26l-5-8M262 26l5-8" ${INK} stroke-width="1" stroke-dasharray="2 4"/><path d="M84 148l-10-6M256 148l10-6" ${INK} stroke-width="1.1"/></svg>`,
    'Loose cards are ordinary objects. They fall, lie on each other and stack; a tower of five stands.'],
  stretch: () => { const h = handParts('strain', Math.PI, 392, 82); if (!h) return null; const a = list('card.agony.1');
    return [`<svg class="pb-clip" viewBox="0 0 460 190" aria-hidden="true">${h.under}
        <path d="M40 56h74c40 2 62 30 86 30s48-22 96-18v72c-48 4-72-20-96-20s-46 28-86 30H40a6 6 0 0 1-6-6V62a6 6 0 0 1 6-6z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M34 70h82c34 2 58 24 84 24" ${INK} stroke-width=".8"/><path d="M46 84h44M46 98h70c30 0 50 4 84 4M46 110h60M46 122h40" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round" fill="none"/>
        <path d="M188 80l5 8M200 78l1 9M212 80l-4 8M190 116l4-7M204 118l0-8" ${INK} stroke="var(--rubric)" stroke-width="1.4"/>
        <circle cx="198" cy="132" r="2.6" fill="var(--rubric)"/><circle cx="206" cy="146" r="2" fill="var(--rubric)"/><circle cx="194" cy="158" r="1.5" fill="var(--rubric)"/>
        ${h.over}${cursor(52, 96)}${bubble(196, 30, (a && a.find((s) => langOf(s) === 'en' && s.length < 14)) || 'IT HURTS', true)}</svg>`,
    'The tug of war. You hold one end and the Hand the other; the card grows a waist, drips, and at last tears in two.']; },
  crush: () => { const h = handParts({ ...hand().POSES.clamp, curl: 0.7, th: 0.7, eye: 1.3, pupil: 1.2 }, Math.PI, 300, 100); if (!h) return null;
    return [`<svg class="pb-clip" viewBox="0 0 400 200" aria-hidden="true">${h.under}
        <path d="M168 96l14-22 20 8 16-14 14 20 22 2-6 22 14 16-20 10-2 22-22-8-16 14-12-20-22-2 8-20-14-16z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M182 74l18 34 18-40M200 108l32-20M200 108l-24 22M200 108l24 28M200 108l40 10" ${INK} stroke-width=".9" opacity=".7"/>
        ${h.over}<path d="M150 70l-10-8M146 96l-13-1M152 122l-11 7" ${INK} stroke-width="1.2"/>
        ${bubble(128, 28, (list('card.beg').find((s) => langOf(s) === 'en' && s.length < 14)) || 'please')}</svg>`,
    'In the fist. It squeezes in three goes and looks the card over between them. In the second pause the card begs.']; },
  shelf: () => { const h = handParts('eager', Math.PI, 400, 96); if (!h) return null; const p = list('card.panic.1');
    return [`<svg class="pb-clip" viewBox="0 0 440 190" aria-hidden="true">
        <path d="M14 132h196" ${INK} stroke-width="3"/><path d="M40 132v22l18-22M184 132v22l-18-22" ${INK} stroke-width="1.6"/>
        ${cardG('translate(52 59) rotate(-3 56 36)')}
        <path d="M44 70l-9-5M42 92l-10 1M174 62l9-6M176 88l10-1M58 52l-4-9M150 50l4-9" ${INK} stroke-width="1.1"/>
        <path d="M218 96h-22M210 110h-16" ${INK} stroke-width="1" stroke-dasharray="2 4"/>
        ${h.all}${bubble(108, 14, (p && p.find((s) => langOf(s) === 'en' && s.length < 16)) || 'it is coming', true)}</svg>`,
    'The secret shelf. A card left on it shakes and hops as the Hand comes over. Pick the card up and it is saved.']; },
  mist: () => { const k = kat('translate(150 6) scale(.52)'); if (!k) return null; const cloud = (x, y, s, o) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 30c-14 0-20-18-6-24 2-16 26-20 34-6 12-10 32-2 30 14 16 2 16 22-2 22z" fill="var(--paper)" stroke="var(--ink)" stroke-width="${1.1 / s}" opacity="${o}"/>`;
    return [`<svg viewBox="0 0 340 170" aria-hidden="true"><path d="M0 162h340" ${INK} stroke-width="1.4"/>
        ${cloud(40, 96, 1.5, 0.8)}${k}${cloud(96, 112, 1.6, 1)}${cloud(176, 104, 1.3, 1)}${cloud(232, 118, 1.2, 0.85)}${cloud(10, 126, 1, 1)}
        <path d="M196 30c16-12 34-10 44 2M204 44c12-8 24-6 32 2" ${INK} stroke-width="1" stroke-dasharray="2 4"/>${cursor(246, 26)}</svg>`,
    'The katana stands planted in the mist of the banner. Move the pointer about near it for a while and it shows itself.']; },
  kfall: () => { const k = kat('translate(150 -30) scale(.46)'); if (!k) return null;
    return [`<svg class="pb-clip" viewBox="0 0 340 180" aria-hidden="true">
        <g transform="translate(96 100)"><path d="M0 6a6 6 0 0 1 6-6h58l-6 72H6a6 6 0 0 1-6-6z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M84 0h58a6 6 0 0 1 6 6v60a6 6 0 0 1-6 6H78z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4" transform="translate(6 3) rotate(3 110 36)"/>
          <path d="M10 22h34M10 34h40M10 44h28" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round"/></g>
        ${k}<path d="M140 2v22M190 0v26" ${INK} stroke-width="1" opacity=".6"/>
        ${bubble(262, 50, first('katana.cut', 'whoops'))}</svg>`,
    'Dropped, it still cuts. The tip divides whatever it meets on the way down the page, and the katana says sorry.']; },
  equip: () => { const k = kat('translate(120 -40) rotate(38 20 150) scale(.6)'); if (!k) return null;
    return [`<svg class="pb-clip" viewBox="0 0 340 170" aria-hidden="true">${k}
        <circle cx="218" cy="42" r="15" ${INK} stroke="var(--rubric)" stroke-width="1.4"/><circle cx="218" cy="42" r="24" ${INK} stroke="var(--rubric)" stroke-width="1.1" stroke-dasharray="3 4"/>
        ${cursor(214, 38)}<text x="262" y="34" font-size="12" font-weight="700" fill="var(--ink)">× 2</text>
        <path d="M66 150c10 6 24 8 36 4M52 136c14 12 36 16 56 10" ${INK} stroke-width="1" stroke-dasharray="2 4"/></svg>`,
    'Double-click and the katana stays in the hand at one steady angle. Double-click again, or press Esc, to let it go.']; },
  catch: () => { const h = handParts('lunge', Math.PI + 0.08, 410, 104); if (!h) return null;
    return [`<svg class="pb-clip" viewBox="0 0 460 190" aria-hidden="true">
        <path d="M10 150C60 96 110 78 160 76" ${INK} stroke-width="1" stroke-dasharray="2 5"/>
        <path d="M118 62h-46M112 80h-60M118 98h-38" ${INK} stroke-width="1.4"/>
        ${h.under}${cardG('translate(134 44) rotate(-10 56 36)')}${h.over}
        ${bubble(330, 16, first('hand.caught', 'CAUGHT IT'), true)}</svg>`,
    'A catch. Throw a card towards the right edge and the arm shoots out to pluck it from the air.']; },
  press: () => { const h = handParts('point', Math.PI - 0.95, 286, 60); if (!h) return null;
    return [`<svg class="pb-clip" viewBox="0 0 440 180" aria-hidden="true">
        <rect x="34" y="62" width="150" height="96" rx="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M52 84h76M52 98h110" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round"/>
        <rect x="52" y="116" width="52" height="26" rx="13" ${INK} stroke-width="1.3"/><text x="78" y="133.500" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--ink)">No</text>
        <rect x="114" y="116" width="54" height="26" rx="13" fill="var(--rubric)"/><text x="141" y="133.500" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--paper)">Yes</text>
        ${h.all}${bubble(110, 22, first('hand.bye', 'BYE BYE'), true)}</svg>`,
    'Surprise me. Lose the toss, press neither button for five seconds, and one pointing finger presses Yes for you.']; },
  coin: () => { const h = handParts('snapped', Math.PI + 0.5, 360, 150); if (!h) return null;
    return [`<svg class="pb-clip" viewBox="0 0 440 200" aria-hidden="true">
        <path d="M236 96C212 60 196 44 172 40" ${INK} stroke-width="1" stroke-dasharray="2 5"/>
        <ellipse cx="150" cy="40" rx="20" ry="14" fill="#e3c32f" stroke="var(--ink)" stroke-width="1.4"/><ellipse cx="150" cy="40" rx="13" ry="8.500" ${INK} stroke-width="1"/>
        <path d="M118 30c-6 6-6 14 0 20M182 30c6 6 6 14 0 20M110 24c-9 10-9 22 0 32M190 24c9 10 9 22 0 32" ${INK} stroke-width="1"/>
        ${h.all}${bubble(110, 84, first('hand.flip', 'call it.'), true)}</svg>`,
    'The toss. It will not take your No for an answer: it flips a coin and makes you call heads or tails.']; },
  severed: () => { const h = handParts('lunge', Math.PI, 250, 96); if (!h) return null; const id = 'pb-sv' + (++figN);
    return [`<svg class="pb-clip" viewBox="0 0 440 190" aria-hidden="true"><defs><clipPath id="${id}a"><path d="M0-40h292l-26 280H0z"/></clipPath><clipPath id="${id}b"><path d="M292-40h200v280H266z"/></clipPath></defs>
        <g transform="translate(-16 14) rotate(-7 250 96)"><g clip-path="url(#${id}a)">${h.all}</g></g><g transform="translate(12 -2)"><g clip-path="url(#${id}b)">${h.all}</g></g>
        <path d="M306-6L262 196" ${INK} stroke="var(--rubric)" stroke-width="1.4" stroke-dasharray="6 5"/>
        <circle cx="282" cy="150" r="3" fill="var(--rubric)"/><circle cx="290" cy="166" r="2.200" fill="var(--rubric)"/><circle cx="274" cy="172" r="1.600" fill="var(--rubric)"/><circle cx="296" cy="140" r="1.800" fill="var(--rubric)"/>
        ${bubble(370, 20, first('hand.severed', 'MY HAND!!'), true)}</svg>`,
    'Pass the tip of the katana through the arm and the hand comes off. It lives on by itself; the arm grows a new one.']; },
  swat: () => { const h = handParts('sulk', Math.PI - 0.45, 372, 84); if (!h) return null;
    return [`<svg class="pb-clip" viewBox="0 0 440 190" aria-hidden="true">
        <circle cx="150" cy="104" r="20" ${INK} stroke="var(--rubric)" stroke-width="2"/><circle cx="150" cy="104" r="32" ${INK} stroke="var(--rubric)" stroke-width="1.2" stroke-dasharray="3 5"/>
        <path d="M150 62v-12M150 146v12M108 104h-12M192 104h12M120 74l-9-9M180 74l9-9M120 134l-9 9M180 134l9 9" ${INK} stroke="var(--rubric)" stroke-width="1.4"/>
        ${cursor(146, 100)}<path d="M214 70h26M208 92h34M216 114h24" ${INK} stroke-width="1.3"/>
        ${h.all}${bubble(300, 16, list('raid.swat')[0], true)}</svg>`,
    'Click the Hand while it is in this menu and it is swatted. It drops what it holds and sulks for five seconds or more.']; },
  scroll: () => { const h = handParts('clamp', Math.PI, 382, 78); if (!h) return null; let rows = ''; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) rows += `<rect x="${40 + j * 106}" y="${34 + i * 48}" width="96" height="38" rx="6" ${INK} stroke-width="1" opacity=".6"/><path d="M${48 + j * 106} ${46 + i * 48}h40M${48 + j * 106} ${58 + i * 48}h70" stroke="var(--ink)" stroke-width="1" opacity=".4" stroke-linecap="round"/>`;
    return [`<svg class="pb-clip" viewBox="0 0 440 190" aria-hidden="true">
        <rect x="28" y="20" width="250" height="160" rx="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/>${rows}
        <path d="M266 30v140" ${INK} stroke-width="1" opacity=".5"/><rect x="262" y="80" width="8" height="38" rx="4" fill="var(--rubric)"/>
        <path d="M296 34v-18M296 16l-6 8M296 16l6 8M296 150v20M296 170l-6-8M296 170l6-8" ${INK} stroke="var(--rubric)" stroke-width="1.5"/>
        ${h.all}${bubble(366, 150, list('raid.scroll')[0], true)}</svg>`,
    'In a temper it takes hold of the edge of this menu and yanks the page up and down until you have lost your place.']; },
  sulking: () => { const s = handPrint('sulk', Math.PI - 0.4); return s && [s, 'The Hand, sulking: a fist turned half away and the eye nearly shut. It does not last.']; },
};
export function figure(name) {
  let f = null; try { f = FIGS[name](); } catch (e) { f = null; }
  return f ? `<figure class="pb-fig pb-fig-${name}">${f[0]}<figcaption><b>Fig. ${++figN_plate}</b> ${f[1]}</figcaption></figure>` : '';
}
let figN_plate = 0;
/** legacy build(): figN_plate = 0, so every open numbers its plates from 1 */
export function resetPlates() { figN_plate = 0; }

export function install(a) { app = a; }
