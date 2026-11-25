'use strict';
// The test harness for kiripad.dev: one browser per spec file, one fresh context per scenario, time frozen with Playwright's clock,
// Math.random seeded, every speech bubble and the actors' states recorded, and the recording compared to a golden file.
//
//   const { scenario } = require('../helpers/harness');
//   scenario('world', 'pull and spring back', async (s) => { ... });
//
// Env:  NEXT=1           load / (the ES modules under src/, the default); without it /?legacy (the old script) is loaded
//       UPDATE_GOLDEN=1  write the recorded traces to tests/golden instead of comparing
//       TRACE_MATCH=strict|kind   how traces are compared (default: strict; see compareTrace)
//       SHOTS=1          write the screenshots scenarios ask for (s.shot) to tests/shots/
//       ONLY="name"      run only scenarios whose name contains this text (node --test-name-pattern works too)
//       HEADED=1         show the browser
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const server = require('./server');
const pageInit = require('./page-init');
const { compareTrace, buildTrace } = require('./trace');

const NEXT = process.env.NEXT === '1';
const UPDATE = process.env.UPDATE_GOLDEN === '1';
const MATCH = process.env.TRACE_MATCH || 'strict';
const SHOTS = process.env.SHOTS === '1';
const ROOT = path.resolve(__dirname, '..');
const GOLDEN = path.join(ROOT, 'golden');
const SHOTDIR = path.join(ROOT, 'shots');
const T0 = Date.parse('2026-11-24T12:00:00Z');   // the frozen wall clock every page starts at
const VIEW = { width: 1280, height: 900 };
const real = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// what the recorder samples after every step of the clock. Only the published test hooks are read (see REFACTOR-NOTES.md)
function sampleState() {
  const C = window.__cards, st = C && C.state ? C.state() : null, objs = {};
  if (C && C.objs) for (const o of C.objs) objs[o.kind] = (objs[o.kind] || 0) + 1;
  const claw = st && st.claw ? st.claw.st + (st.claw.stump ? '/stump' : '') : null;
  const sev = window.__sev && window.__sev.list ? [...window.__sev.list].map((o) => o.ai.st).join(',') : '';
  let pb = null;
  try { const p = window.__phrasebook && window.__phrasebook.state(); if (p) pb = p.isOpen ? (p.raid ? 'raid:' + p.raid.st + (p.raid.act ? ':' + p.raid.act : '') : 'open') : 'closed'; } catch (e) { pb = 'error'; }
  const kat = st ? (st.katana ? (st.katana.root ? 'rooted' : st.grab && st.grab.o === st.katana && st.grab.sticky ? 'equipped' : 'loose') : st.found ? 'found' : 'hidden') : null;
  const grab = st && st.grab ? st.grab.o.kind + (st.grab.o.root ? ':rooted' : '') : null;
  return { claw, sev, pb, kat, shelf: st ? !!st.shelf : null, grab, objs };
}

let browser = null, srv = null, base = null;
function setup() {
  before(async () => {
    srv = await server.start();
    base = srv.url;
    browser = await chromium.launch({ headless: process.env.HEADED !== '1' });
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.close(); });
}
let setupDone = false;

// group: the spec file's group (golden subfolder); name: the scenario; opts: { seed, rand, viewport, colorScheme, reducedMotion,
// session: {k: v}, local: {k: v}, query, idle: ms to let pass after load, golden: false, skip: 'reason', timeout }
function scenario(group, name, opts, fn) {
  if (typeof opts === 'function') { fn = opts; opts = {}; }
  if (process.env.ONLY && !name.includes(process.env.ONLY)) return;   // first: a file with no matching scenario must not launch a browser, or it never exits
  if (!setupDone) { setup(); setupDone = true; }
  test(name, { skip: opts.skip || false, timeout: opts.timeout || 180000 }, async () => {
    const s = await Session.open(group, name, opts);
    let ok = false;
    try {
      await fn(s);
      ok = true;
    } finally {
      if (ok && opts.golden !== false) { await s.collect(); s.checkGolden(); }
      if (!ok && SHOTS) await s.shot('failure').catch(() => {});
      await s.close();
    }
  });
}

class Session {
  static async open(group, name, opts) {
    const s = new Session(group, name, opts);
    await s.start();
    return s;
  }
  constructor(group, name, opts) {
    this.group = group; this.name = name; this.opts = opts; this.doc = 0;
    this.trace = { bubbles: [], states: [] }; this.raw = new Map(); this.lastState = null; this.lines = null;
    this.errors = [];
  }
  get url() { return base; }
  async start() {
    const o = this.opts;
    await this.open(T0, o.session, o.local);
    await this.load(o.query);
    if (o.idle) await this.run(o.idle, 100);   // the page has been open a while: the hand's first unforced remark needs TIMING.gap.handIdle since page time 0
  }
  // a fresh browser context with its clock frozen at `time` + 1 s, and the given storage. Every document gets its own context
  // (see load): Playwright's fake clock, carried over into a new document, picks up the real time the navigation took
  async open(time, session, local, cookies) {
    const o = this.opts;
    this.ctx = await browser.newContext({ viewport: o.viewport || VIEW, deviceScaleFactor: 1, locale: 'en-US', timezoneId: 'UTC',
      colorScheme: o.colorScheme || 'light', reducedMotion: o.reducedMotion || 'no-preference', serviceWorkers: 'block' });
    if (cookies && cookies.length) await this.ctx.addCookies(cookies);
    // nothing leaves the machine. A navigation of the page itself to another host (the hand sends you to a project's site) is
    // recorded (s.leftTo) and dropped, so the page stays where it was; anything else from another host gets an empty page
    this.left = [];
    await this.ctx.route((u) => !u.href.startsWith(base), (route) => {
      const r = route.request();
      if (r.isNavigationRequest() && r.frame() === this.page.mainFrame()) { this.left.push(r.url()); return route.abort('aborted'); }
      return route.fulfill({ status: 200, contentType: 'text/html', body: '<!doctype html><title>elsewhere</title><p>elsewhere</p>' });
    });
    this.page = await this.ctx.newPage();
    this.page.on('pageerror', (e) => this.errors.push(e.message));
    this.page.on('console', (m) => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) this.errors.push('console: ' + m.text()); });
    await this.page.clock.install({ time });
    await this.page.clock.pauseAt(time + 1000);
    await this.ctx.addInitScript(pageInit, { seed: o.seed == null ? 1 : o.seed, rand: o.rand == null ? null : o.rand });
    // test-only style, for determinism across machines and runs:
    //  - one font everywhere (DejaVu Sans, IPAGothic for Japanese): card heights come from text wrapping, and card size is body size
    //  - no CSS transitions on the cards, the planted katana and the secret ×, and no screen shake (#projects.shake, a 0.28 s CSS
    //    animation that moves the whole grid by up to 5 px after a hard landing, a crush or a smash): they run on real time, and
    //    rectangles read by the page (a pull measures its card) or by the test while one runs would depend on the machine
    //  - the same for the phrasebook's jolt (.pb-card.pb-jolt, after a smash or a rip) and the tugged line's shiver (.pb-tug): the raid
    //    hand aims at the line's rectangle every frame
    await this.ctx.addInitScript(() => { document.addEventListener('DOMContentLoaded', () => { const st = document.createElement('style'); st.dataset.test = 'harness';
      st.textContent = '*, *::before, *::after { font-family: "DejaVu Sans", "IPAGothic", sans-serif !important; } .grid .card, .katana-in, .omi-secret { transition: none !important; } #projects.shake, .pb-card.pb-jolt, .pb-tug { animation: none !important; }'; document.head.appendChild(st); }); });
    const has = (x) => x && Object.keys(x).length;
    if (has(session) || has(local)) {
      await this.page.goto(base + '/__blank');
      await this.page.evaluate(({ session, local }) => {
        for (const [k, v] of Object.entries(session || {})) sessionStorage.setItem(k, v);
        for (const [k, v] of Object.entries(local || {})) localStorage.setItem(k, v);
      }, { session, local });
    }
  }
  // load (or reload) the page and wait until the project list is rendered and the page is still
  // A reload is a new context that carries over the storage (local, session, cookies) and the time
  async load(query = '') {
    if (this.doc > 0) {
      await this.collect();
      const keep = await this.page.evaluate(() => {
        const dump = (st) => { const o = {}; for (let i = 0; i < st.length; i++) o[st.key(i)] = st.getItem(st.key(i)); return o; };
        return { time: Date.now(), session: dump(sessionStorage), local: dump(localStorage) };
      });
      const cookies = await this.ctx.cookies();
      await this.ctx.close();
      this.lastState = null;
      await this.open(keep.time, keep.session, keep.local, cookies);
    }
    this.doc++;
    const q = NEXT || /[?&]next\b/.test(query) ? query : !query ? '?legacy' : query[0] === '#' ? '?legacy' + query : query + '&legacy';   // the modules are the default; ?legacy loads the old script
    await this.page.goto(base + '/' + q, { waitUntil: 'load' });
    await this.settle();
  }
  async settle() {
    // real time: the fetches of projects.json / site.json, the first resize and intersection observers, the cards' entrance animation
    for (let i = 0; i < 100; i++) {
      const ok = await this.page.evaluate(() => document.querySelectorAll('#grid .card').length > 0 || /Could not load|No projects/.test(document.getElementById('grid').textContent) || document.documentElement.classList.contains('crazy'));
      if (ok) break;
      await real(30);
    }
    await real(120);
    await this.finishCss();
    if (!this.lines) this.lines = await this.page.evaluate(() => window.__lines ? JSON.parse(JSON.stringify(window.__lines)) : null).catch(() => null);
  }
  // CSS entrance animations run on real time; finish them so layout is final (only the finite, non-speech ones)
  async finishCss(names = ['rise', 'regrow', 'unroll', 'stamp', 'poof', 'shelf-in']) {
    await this.page.evaluate((names) => { for (const a of document.getAnimations()) { if (a.animationName && names.includes(a.animationName)) { try { a.finish(); } catch (e) {} } } }, names);
  }
  // finish every Web Animation started with el.animate (they ignore the frozen clock): the flung buttons, the slip's jolt
  async finishWaapi() {
    await this.page.evaluate(() => { for (const a of document.getAnimations()) { if (!a.animationName && a.effect && a.effect.getTiming().iterations !== Infinity) { try { a.finish(); } catch (e) {} } } });
  }

  // ---- time ----
  // advance the frozen clock by ms, in steps, sampling the actors after each step
  async run(ms, step = 50) {
    let left = ms;
    while (left > 0) {
      const d = Math.min(step, left);
      await this.page.clock.runFor(d);
      left -= d;
      await this.sample();
    }
  }
  // advance until fn(page state) is true or `max` ms have passed; returns the ms it took. Deterministic: it steps in fixed amounts
  async runUntil(fn, arg, { max = 20000, step = 50 } = {}) {
    let t = 0;
    while (t < max) {
      if (await this.page.evaluate(fn, arg)) return t;
      await this.run(step, step); t += step;
    }
    if (await this.page.evaluate(fn, arg)) return t;
    throw new Error(`runUntil: condition not met after ${max} ms: ${fn.toString().slice(0, 160)}`);
  }
  // where the page last tried to send you (another host), or null
  async leftTo() { await real(150); return this.left.length ? this.left[this.left.length - 1] : null; }
  async now() { return this.page.evaluate(() => performance.now()); }
  // real time, for things the fake clock does not drive (network, Web Animations)
  real(ms) { return real(ms); }
  async rand(v) { await this.page.evaluate((v) => window.__rng.set(v), v); }
  async randQueue(...v) { await this.page.evaluate((v) => window.__rng.push(...v), v); }
  eval(fn, arg) { return this.page.evaluate(fn, arg); }

  // ---- recording ----
  async sample() {
    let st;
    try { st = await this.page.evaluate(sampleState); } catch (e) { return; }
    const key = JSON.stringify(st);
    if (key === this.lastState) return;
    this.lastState = key;
    const t = await this.now();
    this.trace.states.push({ doc: this.doc, t: Math.round(t), ...st });
  }
  async state() { return this.page.evaluate(sampleState); }
  // pull the bubble log out of the page (it is cleared there)
  async collect() {
    let ev;
    try { ev = await this.page.evaluate(() => (window.__bub || []).splice(0)); } catch (e) { return; }
    for (const e of ev) {
      const k = this.doc + ':' + e.id;
      if (e.ev === '+') { const b = { doc: this.doc, t: Math.round(e.t), ms: null, text: e.text, cls: e.cls, lvl: e.lvl, par: e.par }; this.raw.set(k, b); this.trace.bubbles.push(b); }
      else { const b = this.raw.get(k); if (b) b.ms = Math.round(e.t) - b.t; }
    }
  }
  // the bubbles seen so far: [{ t, ms, who, key, text }]
  async bubbles() { await this.collect(); return buildTrace(this.trace, this.lines).bubbles; }
  async texts() { return (await this.bubbles()).map((b) => b.text); }
  async said(re) { return (await this.bubbles()).some((b) => (re instanceof RegExp ? re.test(b.key + ' ' + b.text) : b.key.split('|').includes(re))); }
  checkGolden() {
    if (this.errors.length) assert.fail('page errors:\n' + this.errors.join('\n'));
    const trace = buildTrace(this.trace, this.lines);
    const file = path.join(GOLDEN, this.group, slug(this.name) + '.json');
    const out = { scenario: `${this.group} / ${this.name}`, seed: this.opts.seed == null ? 1 : this.opts.seed, ...trace };
    if (UPDATE && !NEXT) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
      return;
    }
    if (!fs.existsSync(file)) assert.fail(`no golden trace ${path.relative(ROOT, file)}: record it on legacy with UPDATE_GOLDEN=1`);
    const want = JSON.parse(fs.readFileSync(file, 'utf8'));
    const diff = compareTrace(want, out, MATCH);
    if (diff) {
      fs.mkdirSync(SHOTDIR, { recursive: true });
      const act = path.join(SHOTDIR, `${this.group}--${slug(this.name)}.actual.json`);
      fs.writeFileSync(act, JSON.stringify(out, null, 1) + '\n');
      assert.fail(`trace differs from ${path.relative(ROOT, file)} (${MATCH}): ${diff}\n  actual trace written to ${path.relative(process.cwd(), act)}`);
    }
  }
  async shot(label, opts = {}) {
    if (!SHOTS) return;
    const dir = path.join(SHOTDIR, this.group, slug(this.name));
    fs.mkdirSync(dir, { recursive: true });
    await this.page.screenshot({ path: path.join(dir, slug(label) + '.png'), ...opts });
  }
  async close() { await this.ctx.close().catch(() => {}); }

  // ---- the page ----
  async box(sel, i = 0) {
    const b = await this.page.evaluate(([sel, i]) => { const el = document.querySelectorAll(sel)[i]; if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, [sel, i]);
    if (!b) throw new Error(`no element ${sel} [${i}]`);
    return b;
  }
  async cardBox(i) { return this.box('#grid .card:not(.held)', i); }
  scrollY() { return this.page.evaluate(() => scrollY); }
  // scroll the page to y at once, then let dt ms pass
  async scrollTo(y, dt = 20) { await this.page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), y); await this.syncHover(); if (dt) await this.run(dt, dt); }
  // Chrome updates what is under a pointer that stands still (:hover, pointerover / pointerout) on its next real frame after a scroll,
  // not at once. Wait (real time, the page clock stands still) until it has, so it happens at the same page time on every run:
  // otherwise a card under the pointer is lifted by its :hover style a frame early or late, and a pull measures it there
  async syncHover() {
    const done = () => { if (window.__px == null) return true; const at = document.elementFromPoint(window.__px, window.__py), hov = document.querySelectorAll(':hover');
      return (hov.length ? hov[hov.length - 1] : null) === at; };
    for (let i = 0; i < 60; i++) { if (await this.page.evaluate(done)) break; await real(5); }
  }
  // planck is fetched on the first hover over the grid; a pull does not start without it
  async ensurePlanck() {
    const c = await this.cardBox(0);
    await this.page.mouse.move(c.x + c.w / 2, c.y - 6);
    await this.page.mouse.move(c.x + c.w / 2, c.y + c.h / 2);
    for (let i = 0; i < 200; i++) { if (await this.page.evaluate(() => !!window.planck)) return; await real(20); }
    throw new Error('planck did not load');
  }
  async press(sel, i = 0) {   // click a button by selector at its centre, then let one frame pass. Off screen, it is scrolled into view first
    let b = await this.box(sel, i);
    if (b.y < 0 || b.y + b.h > (this.opts.viewport || VIEW).height) {
      await this.page.evaluate(([sel, i]) => document.querySelectorAll(sel)[i].scrollIntoView({ block: 'center', behavior: 'instant' }), [sel, i]);
      await this.syncHover();
      await this.run(20, 20);
      b = await this.box(sel, i);
    }
    await this.page.mouse.click(b.x + b.w / 2, b.y + b.h / 2);
    await this.run(20, 20);
  }
  async key(k) { await this.page.keyboard.press(k); await this.run(20, 20); }
  async type(text) { for (const ch of text) { await this.page.keyboard.type(ch); await this.run(20, 20); } }

  // ---- the pointer: every move is followed by dt ms of frozen time, so drag speeds are exact ----
  // Chrome delivers mouse moves to the page on its next real frame, not when mouse.move returns: wait (real time) until the page has
  // seen the pointermove, so that it lands at the same page time on every run, however busy the machine is
  async move(x, y, dt = 16) {
    const n = await this.page.evaluate(() => window.__pm);
    await this.page.mouse.move(x, y);
    for (let i = 0; i < 100; i++) { if (await this.page.evaluate((n) => window.__pm > n, n)) break; await real(2); }
    if (dt) await this.run(dt, dt);
  }
  async down(dt = 16) { await this.page.mouse.down(); if (dt) await this.run(dt, dt); }
  async up(dt = 16) { await this.page.mouse.up(); if (dt) await this.run(dt, dt); }
  // move along a straight line in n steps of dt ms each
  async line(x0, y0, x1, y1, n = 10, dt = 16) {
    for (let k = 1; k <= n; k++) await this.move(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n, dt);
  }
  // go through a list of points [x, y] with dt ms between them
  async path(pts, dt = 16) { for (const [x, y] of pts) await this.move(x, y, dt); }
  // press a grid card at (fx, fy) of its box (0..1), and pull it by (dx, dy) in n steps. Returns the point the pointer is at; the button stays down
  async pull(i, dx, dy, { fx = 0.5, fy = 0.5, n = 20, dt = 16 } = {}) {
    await this.ensurePlanck();
    const c = await this.cardBox(i), x = c.x + c.w * fx, y = c.y + c.h * fy;
    await this.move(x, y, 16);
    await this.down(16);
    await this.line(x, y, x + dx, y + dy, n, dt);
    return [x + dx, y + dy];
  }
  // tear a card out of the grid: a 420 px pull, by default straight up, in about a second (a faster rip is not shouted about:
  // the pull line is younger than TIMING.gap.show). The button stays down and the card hangs from the pointer
  async rip(i, { dx = 0, dy = -420, fx = 0.5, fy = 0.5, n = 60 } = {}) {
    const p = await this.pull(i, dx, dy, { fx, fy, n });
    const ok = await this.page.evaluate(() => { const g = window.__cards.state().grab; return !!g && !g.o.root; });
    if (!ok) throw new Error('rip: the card did not tear');
    return p;
  }
  // scroll the page to y (default: the bottom) in steps of `step` px a frame, while whatever is held stays under the pointer
  async scrollHolding(y = null, step = 60) {
    const to = y == null ? await this.page.evaluate(() => document.documentElement.scrollHeight - innerHeight) : y;
    let cur = await this.scrollY();
    while (cur !== to) { cur = cur < to ? Math.min(to, cur + step) : Math.max(to, cur - step); await this.scrollTo(cur, 16); }
    return cur;
  }
  // carry what is held along a path at a steady speed (px per 16 ms frame), then let go: fast enough and it is a throw
  async throwTo(from, to, { n = 6, dt = 16, release = true } = {}) {
    await this.line(from[0], from[1], to[0], to[1], n, dt);
    if (release) await this.up(0);
    await this.run(16, 16);
  }
}

module.exports = { scenario, Session, NEXT, MATCH, assert, real, sampleState };
