'use strict';
// Runs in the page before any of its own scripts (Playwright addInitScript), on every document of the test context.
// It must stay plain ES2020 with no imports: it is serialised into the page.
//
//  - localStorage['kiripad-lang'] = 'all' when it is not set (the mixed-language behaviour the goldens were recorded with)
//  - Math.random: seeded (mulberry32), or a settable constant, or a queue of values to hand out first   -> window.__rng
//  - performance.now starts at exactly 0 when the document starts (it is driven by the fake Date), and requestAnimationFrame is a 16 ms grid of fake-clock timers on
//    that same time. Playwright's fake clock is paused from the first line of the page, but its performance.now() carries a 1 to 25 ms
//    offset that changes from run to run, and its animation frames sit on a grid of that offset: frames and timers would drift apart
//  - document.hidden / visibilityState can be switched by the test                                        -> window.__setHidden(bool)
//  - every speech bubble that is added to or removed from the page is logged with the page time          -> window.__bub
module.exports = function pageInit(opts) {
  // ---- language ----
  // the site is getting an English-only default; 'all' is today's mixed-language behaviour, which every golden was recorded with.
  // Only when unset, so a scenario can still preset another value with opts.local
  try { if (localStorage.getItem('kiripad-lang') == null) localStorage.setItem('kiripad-lang', (opts && opts.lang) || 'all'); } catch (e) { /* no storage */ }

  // ---- random ----
  let s = (opts && opts.seed) >>> 0 || 1;
  const next = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rng = window.__rng = { fixed: opts && opts.rand != null ? opts.rand : null, queue: [], calls: 0,
    set(v) { rng.fixed = v == null ? null : v; }, push(...v) { rng.queue.push(...v); } };
  Math.random = function random() { rng.calls++; return rng.queue.length ? rng.queue.shift() : rng.fixed != null ? rng.fixed : next(); };

  // ---- time: page time 0 is the start of this document ----
  // (Date.now, not the fake performance.now: across a navigation the latter picks up real time spent loading the new document,
  // while the paused fake Date only moves when the test moves the clock)
  const P = window.performance, dnow = Date.now.bind(Date), p0 = dnow();
  P.now = function now() { return dnow() - p0; };
  const st = window.setTimeout.bind(window), ct = window.clearTimeout.bind(window);
  window.requestAnimationFrame = function requestAnimationFrame(cb) { const n = Math.round(P.now()); return st(() => cb(P.now()), 16 - (n % 16)); };
  window.cancelAnimationFrame = function cancelAnimationFrame(id) { ct(id); };

  // ---- visibility ----
  let hidden = false;
  Object.defineProperty(Document.prototype, 'hidden', { configurable: true, get() { return hidden; } });
  Object.defineProperty(Document.prototype, 'visibilityState', { configurable: true, get() { return hidden ? 'hidden' : 'visible'; } });
  window.__setHidden = (h) => { hidden = !!h; document.dispatchEvent(new Event('visibilitychange')); };

  // ---- speech bubbles ----
  const SEL = '.say, .btn-say, .pb-say';
  const ids = new WeakMap(); let n = 0;
  const log = window.__bub = [];
  const added = (el) => {
    if (ids.has(el)) return;
    ids.set(el, ++n);
    const par = el.parentElement;
    log.push({ ev: '+', id: n, t: P.now(), text: el.textContent, cls: String(el.className), lvl: el.dataset.lvl || null,
      par: par ? (par.id ? '#' + par.id : String(par.className || par.tagName).split(' ')[0]) : null });
  };
  const gone = (el) => { if (ids.has(el) && !el.isConnected) log.push({ ev: '-', id: ids.get(el), t: P.now() }); };
  const each = (node, fn) => {
    if (node.nodeType !== 1) return;
    if (node.matches(SEL)) fn(node);
    if (node.firstElementChild) node.querySelectorAll(SEL).forEach(fn);
  };
  new MutationObserver((muts) => {
    for (const m of muts) {
      for (const node of m.removedNodes) each(node, gone);
      for (const node of m.addedNodes) each(node, (el) => { if (el.isConnected) added(el); });
    }
  }).observe(document, { childList: true, subtree: true });
};
