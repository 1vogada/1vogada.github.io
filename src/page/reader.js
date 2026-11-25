// The blog post reader at #post-<id> (legacy inline, markdown, route, the reader click / hashchange / Escape handlers), with a
// tiny, safe markdown renderer. Closing sets location.hash = 'projects' (so the URL ends in #projects, never empty).

import { band, esc, fmtDate, site } from './directory.js';

/** legacy inline(t) */
export function inline(t) {
  return esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)/g, '<img alt="$1" src="$2">')
    .replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
/** legacy markdown(md) */
export function markdown(md) {
  const out = []; let para = [], list = null;
  const flush = () => { if (para.length) out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; if (list) { out.push('<ul>' + list.map((l) => '<li>' + inline(l) + '</li>').join('') + '</ul>'); list = null; } };
  for (const line of String(md || '').split(/\r?\n/)) {
    const h = line.match(/^(#{1,3})\s+(.*)/), li = line.match(/^\s*[-*]\s+(.*)/);
    if (!line.trim()) flush();
    else if (h) { flush(); const n = h[1].length + 1; out.push(`<h${n}>${inline(h[2])}</h${n}>`); }
    else if (li) { if (para.length) { const l = list; list = null; flush(); list = l; } (list = list || []).push(li[1]); }
    else { if (list) flush(); para.push(line.trim()); }
  }
  flush();
  return out.join('');
}

let reader = null;
/** legacy route(): open the reader for #post-<id>, or close it */
export function route() {
  if (!reader) return;
  const m = location.hash.match(/^#post-([\w-]+)$/);
  const post = m && (site().posts || []).find((p) => p.id === m[1] && !p.draft);
  if (!post) { reader.hidden = true; reader.innerHTML = ''; document.body.style.overflow = ''; return; }
  const b = band('post:' + post.id, 0);
  reader.innerHTML = `<article><span class="band" style="--c1:${b.c1};${b.style}"></span><div class="body">
      <a class="btn ghost close" href="#projects">Close</a>
      <h1>${esc(post.title)}</h1><p class="date">${esc(post.date ? fmtDate(post.date) : '')}</p>
      <div class="md">${markdown(post.body)}</div></div></article>`;
  reader.hidden = false; document.body.style.overflow = 'hidden';
}

export function install(app) {
  reader = document.getElementById('reader');
  reader.addEventListener('click', (e) => { if (e.target === reader) location.hash = 'projects'; });
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !reader.hidden) location.hash = 'projects'; });
}
