// English only by default. Runs right after scripts/legacy.js (same loader) and before scripts/phrasebook.js.
// localStorage 'kiripad-lang': unset or 'en' = English only; 'all' = the mixed English / Bulgarian / Japanese site as it always was.
// legacy.js itself is not touched: this file thins the lists it exposes (window.__lines and its top-level hellos / FORTUNES)
// before anything has been said, so the picker simply never sees a Bulgarian or Japanese line. Typed secrets (tana, рафт, たな) still work.
(function () {
  let mode = null; try { mode = localStorage.getItem('kiripad-lang'); } catch (e) {}
  const en = mode !== 'all', root = document.documentElement;
  window.__lang = en ? 'en' : 'all'; root.dataset.lang = window.__lang;
  const foreign = /[Ѐ-ӿ぀-ヿ㐀-鿿]/;
  // a list of lines keeps its English ones (a list with none is left alone); anything else is walked
  const thin = window.__thin = (v) => {
    if (Array.isArray(v)) {
      if (v.length && v.every((s) => typeof s === 'string')) { const keep = v.filter((s) => !foreign.test(s)); if (keep.length && keep.length < v.length) v.splice(0, v.length, ...keep); }
      else v.forEach(thin);
    } else if (v && typeof v === 'object') Object.values(v).forEach(thin);
    return v;
  };
  // "棚 · A shelf." -> "A shelf.": the parts of a notice that are not English are dropped
  const plain = (s) => typeof s !== 'string' || !foreign.test(s) ? s : (s.split(' · ').filter((p) => !foreign.test(p)).join(' · ') || s);
  if (en) {
    if (window.__lines) thin(window.__lines);
    try { thin(hellos); } catch (e) {}
    try { for (const f of FORTUNES) { f[1] = plain(f[1]); if (Array.isArray(f[2])) f[2] = f[2].map((t) => [t[1], '']); } } catch (e) {}
    const kanji = document.querySelector('#secret b'); if (kanji) kanji.remove();   // the 棚 next to "psst. type tana"
    if (typeof window.toast === 'function') { const t0 = window.toast; window.toast = (m) => t0(plain(m)); }
  }
  // the switch sits in the footer next to the mode toggle; changing it reloads, so every list is rebuilt from scratch
  const at = document.getElementById('toggle');
  if (at) {
    const b = document.createElement('button'); b.type = 'button'; b.className = 'toggle'; b.id = 'lang';
    b.textContent = en ? 'More languages' : 'English only';
    b.title = en ? 'Let the cards and the hand speak Bulgarian and Japanese too' : 'Keep everything in English';
    b.addEventListener('click', () => { try { localStorage.setItem('kiripad-lang', en ? 'all' : 'en'); } catch (e) {} location.reload(); });
    b.style.marginLeft = 'auto'; b.style.marginRight = '10px';   // both switches sit together at the right end of the footer
    at.before(b);
  }
})();
