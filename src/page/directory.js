// The project directory (legacy esc, host, seeded, band, excerpt, items, visible, sections, calmCard, fmtDate, render, the
// site.json / projects.json fetches). After projects.json renders it emits 'data.loaded' (src/reactions.js starts the welcome
// back 900 ms later, legacy setTimeout(welcomeBack, 900)); a calm render emits 'cards.rendered' and still dispatches the legacy
// DOM event 'cards-rendered' (legacy dispatched it only from the calm path: crazy and empty renders do not).
// setQuery(v, nothing): page/feed.js can make a query find nothing whatever it says (a scrap, an old hand fed to the search box).

import { bus } from '../core/bus.js';
import { isCrazy } from '../world/world.js';
import { route } from './reader.js';

// crazy-mode copy (page text, not spoken lines)
export const hype = ['🔥 HOT', '✨ NEW', '🚀 VIRAL', '💎 PREMIUM', '🤖 AI'];
export const blurbs = ['A paradigm-shifting solution that redefines what\'s possible.', 'Seamlessly empowering users across the digital landscape.',
                       'Unleash the power of next-gen synergy.', 'It\'s not just an app. It\'s a movement.'];
/** legacy esc(s) */
export const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/** legacy host(u) */
export const host = (u) => u.replace(/^https:\/\//, '').replace(/\/$/, '');

let _data = null, _site = { categories: [], items: [], posts: [] }, failed = false, query = '', none = false;
/** the loaded projects.json (legacy data) or null */ export const data = () => _data;
/** the loaded site.json (legacy site) */ export const site = () => _site;
/** the search query (legacy query) */ export const getQuery = () => query;
/** set the search query (search.js); nothing: find nothing whatever it says (page/feed.js: a scrap, an old hand) */ export const setQuery = (v, nothing = false) => { query = v; none = !!nothing; };

// ---- embroidery band: a symmetric shevitsa-style motif seeded by the project name ----
export const PALETTES = [['#c8372d', '#22344f'], ['#22344f', '#c8372d'], ['#b5402a', '#3f6b4f'], ['#7a2e46', '#c99a2e'], ['#2f5d7c', '#c8372d'], ['#c8372d', '#c99a2e']];
export function seeded(str) {
  let h = 2166136261;
  for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}
/** legacy band(name, i): the project's embroidery */
export function band(name, i) {
  const rnd = seeded(name), [c1, c2] = PALETTES[Math.floor(rnd() * PALETTES.length)];
  const n = 9, half = 5, cell = 4, cells = [];
  for (let y = 0; y < half; y++) for (let x = y; x < half; x++) {
    const r = rnd(); if (r > 0.55) continue;
    const col = r < 0.18 ? c2 : c1;
    for (const [a, b] of [[x, y], [y, x]]) for (const [px, py] of [[a, b], [n - 1 - a, b], [a, n - 1 - b], [n - 1 - a, n - 1 - b]])
      cells.push(`<rect x="${px * cell}" y="${py * cell}" width="${cell}" height="${cell}" fill="${col}"/>`);
  }
  // one motif per tile; CSS repeats it with background-repeat: round, so a whole number of motifs always fills the band
  const w = (n + 2) * cell;
  const tile = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="46" viewBox="0 0 ${w} 46"><g transform="translate(${cell} 5)" opacity=".85">${[...new Set(cells)].join('')}</g></svg>`;
  return { c1, style: `--tile:url(&quot;data:image/svg+xml,${encodeURIComponent(tile)}&quot;)` };
}

// ---- items: auto projects + posts, arranged by site.json (written by the site editor) ----
export const excerpt = (md) => String(md || '').replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[#*`>_-]/g, '').replace(/\s+/g, ' ').trim().slice(0, 140);
/** legacy items() */
export function items() {
  if (!_data) return [];
  const src = new Map();
  for (const p of _data.projects) src.set('project:' + p.name, { kind: 'project', name: p.name, url: p.url, description: p.description, code: p.code });
  for (const p of _site.posts || []) if (!p.draft && p.id && p.title)
    src.set('post:' + p.id, { kind: 'post', name: p.title, url: '#post-' + p.id, description: excerpt(p.body), date: p.date || '', id: p.id });
  const out = [], seen = new Set(), cats = new Set((_site.categories || []).map((c) => c.id));
  for (const it of _site.items || []) {
    const s = src.get(it.key); if (!s || seen.has(it.key)) continue;
    seen.add(it.key);
    const page = s.kind === 'project' && it.page && /^[a-z0-9-]+$/.test(it.page.slug || '') ? '/p/' + it.page.slug + '/' : null;
    out.push({ ...s, key: it.key, category: cats.has(it.category) ? it.category : '', pinned: !!it.pinned, page });
  }
  for (const [key, s] of src) if (!seen.has(key)) out.push({ ...s, key, category: '', pinned: false });
  return out;
}
/** legacy visible() */
export function visible() {
  const all = items();
  if (isCrazy() || !query) return all;
  if (none) return [];
  const q = query.toLowerCase();
  return all.filter((p) => (p.name + ' ' + (p.description || '')).toLowerCase().includes(q));
}
export function sections(list) {
  if (query) return [{ title: '', list }];
  const out = [], pinned = list.filter((p) => p.pinned);
  if (pinned.length) out.push({ title: 'Pinned', list: pinned });
  for (const c of _site.categories || []) {
    const l = list.filter((p) => !p.pinned && p.category === c.id);
    if (l.length) out.push({ title: c.name, list: l });
  }
  const rest = list.filter((p) => !p.pinned && !p.category);
  if (rest.length) out.push({ title: out.length ? 'More' : '', list: rest });
  return out;
}

export function calmCard(p, i) {
  const b = band(p.kind === 'post' ? p.key : p.name, i);
  const post = p.kind === 'post';
  const pill = post ? `<span class="pill postpill">post${p.date ? ' · ' + esc(fmtDate(p.date)) : ''}</span>`
                    : /^https:\/\/github\.com\//.test(p.url) ? '<span class="pill">code only</span>' : '';
  return `
      <div class="card${post ? ' post' : ''}" style="--i:${i};--c1:${b.c1}" data-key="${esc(p.key)}">
        ${p.pinned && query ? '<span class="pin">Pinned</span>' : ''}
        <span class="band" style="${b.style}"></span>
        <div class="body">
          <h3><a href="${esc(p.page || p.url)}">${esc(p.name)}</a>${pill}</h3>
          <p${p.description ? '' : ' class="none"'}>${esc(p.description || 'No description yet.')}</p>
          <div class="links">
            ${post ? `<a href="${esc(p.url)}">Read</a>` : `${p.page ? `<a href="${esc(p.page)}">About</a>` : ''}<a href="${esc(p.url)}">${esc(host(p.url))}</a>`}
            ${p.code && p.code !== p.url ? `<a href="${esc(p.code)}">Source</a>` : ''}
          </div>
        </div>
      </div>`;
}
/** the crazy-mode card (legacy: inline in render) */
export function crazyCard(p, i) {
  return `
      <div class="card">
        <h2><a href="${esc(p.page || p.url)}">${p.kind === 'post' ? '📰' : '🚀'} ${esc(p.name)}</a> <span class="badge">${hype[i % hype.length]}</span></h2>
        <p>${esc(p.description || '')} ${blurbs[i % blurbs.length]}</p>
        ${p.kind === 'post' ? '' : `<a class="u" href="${esc(p.url)}">${esc(host(p.url))}</a>`}
        ${p.code && p.code !== p.url ? `<a class="src" href="${esc(p.code)}">📦 source code (open source!!)</a>` : ''}
      </div>`;
}
export const fmtDate = (d) => { const t = new Date(d); return isNaN(t) ? d : t.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }); };

/** legacy render() */
export function render() {
  const grid = document.getElementById('grid');
  const crazy = isCrazy();
  if (failed) { grid.innerHTML = crazy ? '<p>💥 Oops! Our AI hallucinated. Try again.</p>' : '<p>Could not load the project list. Please refresh.</p>'; return; }
  if (!_data) return;
  const all = items(), list = visible();
  if (!all.length) { grid.innerHTML = crazy ? '<p>🤔 No projects yet. The AI is thinking.</p>' : '<p>No projects yet.</p>'; return; }
  document.getElementById('shown').textContent = query ? `${list.length} of ${all.length}` : all.length;
  if (!list.length) { grid.innerHTML = `<p class="empty">Nothing here but fog. Try another word.</p>`; return; }
  if (crazy) {
    grid.innerHTML = list.map(crazyCard).join('');
    return;
  }
  let i = 0;
  grid.innerHTML = sections(list).map((sec) =>
    (sec.title ? `<h3 class="sec">${esc(sec.title)}</h3>` : '') + sec.list.map((p) => calmCard(p, i++)).join('')).join('');
  bus.emit('cards.rendered', {});
  document.dispatchEvent(new Event('cards-rendered'));
}

export function install(app) {
  fetch('site.json', { cache: 'no-store' }).then((r) => r.ok ? r.json() : null).then((d) => { if (d) { _site = d; render(); route(); } }).catch(() => {});
  fetch('projects.json', { cache: 'no-store' }).then((r) => r.json()).then((d) => {
    _data = d;
    const when = new Date(d.updated);
    document.getElementById('count').textContent = d.projects.length;
    document.getElementById('count-calm').textContent = d.projects.length;
    document.getElementById('upd').textContent = '(last delve: ' + when.toLocaleString() + ')';
    document.getElementById('upd-calm').textContent = '(last ' + when.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + ')';
    render();
    bus.emit('data.loaded', { data: d });
  }).catch(() => { failed = true; render(); });
}
