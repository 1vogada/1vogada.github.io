> **Since the flip (wave 4):** the modules under `src/` are the default and the old script loads only with `?legacy`. `npm test` runs the scenarios on the modules, `npm run test:legacy` on the old script, both with strict matching. Where the notes below say `?next`, read "the default". Goldens are now recorded from the modules
> (`UPDATE_GOLDEN=1 npm run test:golden`), and no test reads `scripts/*.js` any more (docs/pitfalls.md item 12).

> For working on the code today, read [`docs/`](docs/README.md) first; these notes are the background on the old code and the test harness.

# Refactor notes

What package N0 ("Safety net") found surprising about the legacy code of kiripad.dev while moving it and writing the scenario suite.
Read this before porting anything from `scripts/legacy.js` into `src/`.

## How the safety net works

- `scripts/legacy.js` is the old big inline `<script>` of `index.html` (commit 41683e8), byte for byte. Prove it with
  `npm run check:legacy` (`tests/helpers/check-legacy-move.js`). Do not edit it: it is the reference the goldens were recorded from.
- The loader at the bottom of `index.html` writes either `<script src="/scripts/legacy.js">` + `scripts/phrasebook.js` (default) or
  `<script type="module">import "/src/main.js"</script>` (URL has `?next` or `&next`; `window.__next` says which). It uses
  `document.write`, so legacy.js still runs synchronously at exactly the spot where the inline script ran, before `DOMContentLoaded`,
  and phrasebook.js is still a parser-inserted `defer` script.
- The import map between the `importmap:start` / `importmap:end` markers in the `<head>` is generated: `npm run stamp` after any change
  under `src/`, `npm run stamp:check` in CI. Every module URL gets one `?v=N`, because GitHub Pages caches each file for 10 minutes on its
  own and a new module next to an old one breaks the page. Import modules by root-absolute or relative URL; both resolve through the map.
- `npm test` runs the 35 scenarios on legacy and compares each recorded trace (bubbles + actor states) strictly with `tests/golden/`.
  `npm run test:next` runs them on `/?next` with the looser `kind` comparison (same lists and order of lines, same order of state changes,
  no exact times or texts). `UPDATE_GOLDEN=1` re-records (legacy only). `ONLY="part of a name"` runs matching scenarios.
- Every test page gets `localStorage['kiripad-lang'] = 'all'` before any site script runs (unless the scenario presets another value).
  The goldens are the mixed English / Bulgarian / Japanese behaviour; an English-only default must treat `all` as "today's behaviour".

## The legacy code

1. **One script, one global scope.** legacy.js is a classic script whose top level declares about 85 `const` / `let` / `function` names
   (`root`, `data`, `site`, `q`, `grid`, `toast`, `TIMING`, `render`, `isCrazy`, ...). They are global lexical bindings shared with every
   other classic script on the page: another classic script that declares `const root` throws a SyntaxError. phrasebook.js is wrapped
   in an IIFE and uses none of them; it talks to the page only through `window.__*` hooks.
2. **The hooks are the only contract between pieces.** `window.__cards` (`objs`, `S`, `bits`, `state()` -> grab, press, loopOn, size,
   found, katana, claw, shelf), `window.__lines` (SAY, CLAW_SAY, AGONY, BEG, PANIC, NOTME, SEV_SAY), `window.__hand` (get, draw, set,
   POSES, katanaSvg, say, ...), `window.__sev` (list, SEV, POSES, set, spawn, say, cut), `window.__pick`, `window.__shelf`,
   `window.__timing`, and phrasebook.js's `window.__phrasebook` (state, raid, next). phrasebook.js reads `__lines`, `__hand`, `__pick`
   and `__timing`; the test recorder reads `__cards`, `__sev`, `__phrasebook` and `__lines`. The rewrite must publish the same hooks
   with the same shapes or the phrasebook and the suite break.
3. **Reduced motion means no physics at all.** `reduced` is read once at load. `cardPhysics()` returns at its first line, so
   `__cards`, `__lines`, `__hand`, `__sev`, `__pick` are never defined; the greeting is a fixed "Hi there."; the phrasebook then shows
   "Nothing to list". Changing the OS setting later does nothing until a reload.
4. **planck.js is lazy.** `/vendor/planck-1.4.2.min.js` is injected on the first `pointerover` of `#grid` (once). Until it has loaded,
   a pull does not start, and the hand's `come()` waits for it. A network wait in the middle of a scene shifts every later timer.
5. **The physics world does not exist until something is pulled.** `init()` (world, ground, the `#phys` layer that holds every speech
   bubble of the cards and the hand, the walls, the contact listener, a ResizeObserver on body) runs on the first grab. Severed-hand
   and shelf code assume it exists.
6. **The cards have their own clock.** `now()` inside `cardPhysics` is `performance.now()` minus the time the tab was hidden;
   `visibilitychange` freezes it (`hiddenAt`) and restarts the frame loop without simulating the time away. Physics is a fixed 1/240 s
   step driven from rAF timestamps; the loop stops itself when nothing is awake (`loopOn`), and `run()` restarts it.
7. **Fetches are relative and racy.** `fetch('site.json')` and `fetch('projects.json')` (relative URLs, `cache: 'no-store'`) both call
   `render()`; whichever comes last wins. `welcomeBack()` runs 900 ms after projects.json arrives (and 600 ms after a `pageshow` from the
   bfcache), so its timing hangs on the network, not on page time.
8. **TIMING is declared in the middle of the file** (after the search code, before `cardPhysics`), but `toast()` near the top already
   uses it, guarded by `window.__timing ? ... : 2400`. Every bubble's life is `TIMING.talk(el, floor)`, which sets the CSS var `--say`;
   never set `animationDuration` (`.say.agony` has two animations).
9. **Bubbles are removed by timers, not by `animationend`.** The CSS fade runs on real time; the removal is a `setTimeout` of the same
   length. Under a fake clock the two drift apart; under a real one they match.
10. **Some motion ignores the page clock entirely.** The Surprise-me slam uses Web Animations (`el.animate`: the slip's jolt, the flung
    button clones `.omi-flung`, the bits `.omi-bit`, the Heads/Tails poof) and removes the clones in `onfinish`. Cards in the grid, the
    planted katana `.katana-in` and the secret `.omi-secret` have CSS transitions; entrance animations `rise`, `regrow`, `unroll`,
    `stamp`, `poof`, `shelf-in` are CSS too. All run on real time, so anything that reads a rectangle while one runs depends on the machine.
11. **Math.random is called at load and its order is the behaviour.** 67 call sites. Exactly 120 calls happen at load, all for the fog: the
    hero fog's 14 blobs and the kiri flood's 16 blobs, four calls each, in that order; nothing else draws until something happens
    (the cards' bubble tilt, `pick()`, Surprise me, the hand's waits through `TIMING.span`, ...). `pick()` (exposed as `__pick`) keeps a memory per list (`pickMem`, never the last index, low weight for the
    last three, never the same text twice in a row) and draws with one `Math.random()` per pick. Filtering a list (English only) or
    reordering calls changes which line comes out: that is why `kind` matching exists for `?next` and why tests pin `kiripad-lang=all`.
12. **Line lists mix languages inside one array** (e.g. `NOTME` has English, Bulgarian and Japanese entries side by side; CLAW_SAY.rip
    is three "CHEESE PULL!!!!" then "RIIIP", ..., "チーズ!!!", "СИРЕНЕ!!!"). Some entries are arrays of alternatives (`AGONY`, `PANIC` tiers,
    FORTUNES as [Japanese, English] pairs). There is no language tag: an English-only mode has to tell them apart by script.
13. **The first rip line after a page load is always the cheese pull** (`clawSay.cheesed`, a property on the function). A rip faster than
    `TIMING.gap.show` after the pull line is not shouted about at all.
14. **The hand's bubbles are one slot.** Forced lines cut in once the current bubble has been up `gap.show` (600 ms); unforced remarks
    wait for `c.sayEnd + gap.after`; the first unforced remark needs `gap.handIdle` since page time 0. `__hand.say(kind)` returns the ms
    the line will stay up, 0 if it was deferred; scenes `await sleep(Math.max(wait, H.say(..)))`.
15. **Query flags compare exactly.** `?dbg` (log release / impact speeds) is `location.search === '?dbg'`, so `?dbg&next` does not
    enable it; `?debug=zones` is a regex and does. The loader's `?next` test is `/[?&]next(=...)?(&|$)/`.
16. **Typed secrets go through one keydown buffer** (`typed`, last 8 chars, lower-cased, ignored in inputs or with Ctrl/Meta/Alt):
    `kiri` / `мъгла` floods the page, `tana` / `рафт` / `たな` toggles the shelf (also `tana` + Enter in the search box, and a click on the
    uncovered `#secret` writing, which checks the fog mask alpha under it). The Escape key lifts the flood, closes the post reader, and
    says No to the crazy-mode warning; the phrasebook stops propagation of every key while open.
17. **The kiri flood timing** is 2.4 s rolling in, 14 s holding (counted from the start, not from full cover), 4 s thinning: gone 20.4 s
    after it was called if left alone. Esc lifts it at `max(2.4 s, now)`. It does nothing in crazy mode.
18. **Crazy mode is asked for twice.** `kiripad-mode=crazy` in storage only sets `data-want-crazy` (head script); the warning dialog
    asks again on every load. Turning crazy on stops the hero fog loop, re-renders the grid with badges, starts a 180 ms `setInterval`
    that scrolls `document.title`, and does a *smooth* `scrollTo(0)`.
19. **The theme and crazy toggles live in the footer**, more than 2000 px down a 900 px window; the theme button is in the header.
    `syncTheme()` also recomputes the fog colour (`rgb`) that both fog canvases use.
20. **Dragging near the screen edge autoscrolls** (after 350 ms at the edge, `scrollBy` each frame). Read `scrollY` again after any drag.
21. **The post reader is a route** (`#post-<id>`, `hashchange`); closing it sets `location.hash = 'projects'`, so the URL ends in
    `#projects` afterwards, never empty. Drafts and unknown ids leave it closed.
22. **Hand zones are one helper**, `zones(vw)` in `cardPhysics()` (`tease`, `edge`, `grab` in viewport x); `?debug=zones` draws them.
23. **The severed hand's walk turns by flipping `a.fd` directly**; the 0.42 s edge-on turning animation only runs when `a.dir` changes,
    which the walk behaviour never does. Max three severed hands; spawning through `__sev.spawn` does not bring out the reset button.
24. **A thrown card stays "hot" for 1.5 s**: a throw is over 9 m/s (`HOT`), shattering needs about 13 m/s, and a hot card that falls the
    whole page in that time shatters on the floor.
25. **The phrasebook's stylesheet is fetched on first open** (real time) and its entrance is a CSS transition; the raid hand has its own
    small planck world in viewport px and puts the hand's claw state to `'book'`, which makes `clawTick` skip.
26. **Last-delve dates use the visitor's locale and time zone** (`toLocaleString()` of `projects.json`'s `updated`), so screenshots
    are only comparable with a fixed locale and zone (the harness uses en-US / UTC).
27. **Cache busting is manual for the legacy files**: `?v=16` on phrasebook.js (and `VER` inside it), `?v=1` on legacy.js. Bump both
    the query and the file whenever a file changes, or Pages serves a mix for 10 minutes.

## Testing the page deterministically (what the harness had to do)

- Playwright's `page.clock` is installed and paused before the page loads; `tests/helpers/page-init.js` then replaces
  `performance.now` with `Date.now() - start` and rAF with 16 ms fake-clock timers, because the fake `performance.now` carries a
  1 to 25 ms offset that changes from run to run, and its animation frames sit on a grid of that offset.
- Every reload is a fresh browser context that carries over local storage, session storage, cookies and the frozen time: the fake clock
  carried into a new document picks up the real time the navigation took.
- One font for everything (DejaVu Sans, IPAGothic for Japanese) and no CSS transitions on the grid cards, `.katana-in` and
  `.omi-secret`: card heights come from text wrapping and card size is body size, so the physics (and every golden) depends on fonts.
  The goldens were recorded on Ubuntu 24.04 with Playwright 1.63.0's Chromium; CI uses the same.
- Finite CSS entrance animations and Web Animations are finished explicitly (`finishCss`, `finishWaapi`); waits for network, the
  phrasebook stylesheet and WAAPI frames use small real-time waits.
- Chrome does three things on its own real frames, not on the page clock: it hands mouse moves to the page (the harness waits for
  each pointermove before it moves the clock), it updates `:hover` and sends pointerover / pointerout under a pointer that stands
  still while the page scrolls (the harness waits for that after every scroll: a grid card under the pointer is lifted 3 px by its
  hover style, and a pull that starts then measures the card 3 px off), and it plays the screen shake `#projects.shake` (turned off in
  tests; a pull that starts during it measures its card up to 5 px off). The phrasebook has the same trap twice: the raid hand aims
  at a line's `getBoundingClientRect()` every frame while `.pb-tug` (infinite 0.09 s shiver) or `.pb-card.pb-jolt` (0.28 s, after a
  smash or a rip) moves it on real time; both are off in tests. Code that measures rectangles must expect all of this.
- Requests to other hosts never leave the machine; a navigation of the page itself to another host (the hand sends you to a project)
  is recorded (`s.leftTo()`) and dropped.
- A Bulgarian keyboard cannot be simulated with Playwright's keyboard (US layout only): `рафт` is sent as synthetic keydown events.

## English only by default (added with wave 0)

`scripts/lang.js` runs right after `legacy.js` and thins `window.__lines`, `hellos`, `FORTUNES`, toasts and the 棚 glyph to English unless
`localStorage['kiripad-lang'] === 'all'`; `scripts/phrasebook.js` thins its own lists through `window.__thin`. `legacy.js` is untouched.
The footer button `#lang` (made by lang.js) flips the key and reloads. The new code must do the same in `src/page/language.js` through
`setLanguages(['en'])`: English only unless the key is `all`, same button, same texts. The suite always runs with `all`.
