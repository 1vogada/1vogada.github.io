# kiripad.dev: how the page is built

One page to find your way. The code is native ES modules under `src/`, loaded by `index.html` through `/src/main.js`.
No build step. `?legacy` still loads the old `scripts/legacy.js` (about to be deleted; ignore it).

| doc | for |
|---|---|
| [recipes.md](recipes.md) | step-by-step changes: lines, numbers, behaviours, reactions, events, speakers, scenes, actors, tests |
| [events.md](events.md) | every bus event: payload, who emits it and exactly when, who listens |
| [pitfalls.md](pitfalls.md) | what bites: random draws, two clocks, the lint, claims, speech gates, modes, the cache, legacy bugs kept |
| `src/README.md` | the full core contract and where each legacy function went (reference) |
| `REFACTOR-NOTES.md` | how the old code and the test harness behave (reference) |

## Layers: who may import whom

A file imports only from a layer with a lower number, or from its own package. `node scripts/lint-layers.mjs` enforces it.

| layer | folder | package | may import |
|---|---|---|---|
| 1 | `src/core/` | core: `clock bus events lines speech machine claims tune debug` | core only |
| 2 | `src/world/` | world: `world loop drag shatter cut fx` | core |
| 3 | `src/actors/` | one package per actor: `cards.js`, `katana.js`, `hand/`, `severed/`, `shelf.js` | core, world. **Never another actor** |
| 4 | `src/page/`, `src/lines/` | two packages (not each other) | core, world, actors |
| 4.5 | `src/scenes/`, `src/phrasebook/` | two packages (not each other) | the above, and `page/` |
| 5 | `src/reactions.js`, `src/main.js` | the glue | everything |

Actors talk only through the bus (`core/events.js`): an actor emits, `src/reactions.js` answers by calling another feature's
public API. Every module exports `install(app)`; `app` holds every module by its name in `ORDER` plus `app.reduced` and `app.root`.

## Where each feature lives

| feature | code | its lines | styles |
|---|---|---|---|
| project grid, post reader, search, card tilt | `src/page/directory.js`, `reader.js`, `search.js`, `tilt.js` | | `styles/cards.css` |
| physics world, pointer drag, throw, autoscroll | `src/world/world.js`, `loop.js`, `drag.js` | | `styles/physics.css` |
| smash (impacts), particles, screen shake | `src/world/shatter.js`, `fx.js` | | `styles/physics.css` |
| the blade's cut, stab, wounds | `src/world/cut.js` (reads `world.blade`) | `card.cutting/stab/slice`, `katana.cut/brag` | |
| cards: pull, tear, agony, panic, regrow | `src/actors/cards.js` | `src/lines/cards.js` | |
| katana: reveal, draw, equip, sheathe | `src/actors/katana.js` | `src/lines/katana.js` | `styles/physics.css` |
| the arm's hand (18 states) | `src/actors/hand/index.js` (tick, speech, sever), `behaviours/<state>.js`, `tug.js` (tug, slip, rip, crush helpers), `draw.js`, `poses.js`, `zones.js` | `src/lines/hand.js` | `styles/hand.css` |
| cut-off hands (7 states) | `src/actors/severed/index.js`, `behaviours/<state>.js`, `gait.js` (legs, walking forces) | `src/lines/severed.js` | `styles/hand.css` |
| the secret shelf (棚 tana) | `src/actors/shelf.js`; opened by `src/page/kiri.js` (typed), `src/page/search.js` (Enter) | `src/lines/shelf.js` (toasts) | `styles/physics.css` |
| the old hand pokes your still cursor first, then turns with the arm (idle-old) | `src/actors/severed/pester.js` (who, the pace), `severed/behaviours/pester.js`, `hand/behaviours/mine.js` ("that's MY job") | `sev.pester*`, `hand.pester*` | |
| old hands dance in crazy mode, the arm bobs along | `src/actors/severed/dance.js` (groove, the inline overrides of crazy mode's hiding), `behaviours/dance.js`, `jive.js`, `freeze.js`; `src/actors/hand/bob.js` | `sev.dance/jive/freeze/pretend`, `hand.bob/danced` | inline styles only |
| the secret shelf (棚 tana) | `src/actors/shelf.js`; opened by `src/page/kiri.js` (typed), `src/page/search.js` (Enter), `src/page/slash.js` (katana across 棚) | `src/lines/shelf.js` (toasts) | `styles/physics.css` |
| who reacts to whom | `src/reactions.js` (`RULES`, plus `hand.senses(...)` for the shelf) | | |
| speech bubbles (every one) | `src/core/speech.js`; each actor calls `defineSpeaker` in its `install` | | `styles/physics.css`, `hand.css` |
| toasts | `src/page/toast.js` (actors emit `ui.toast`) | `toast.*` in each `src/lines/*.js` | `styles/base.css` |
| the knocked-off toast as a body (kind `toast`) you can throw to the hand | `src/page/bread.js` (from `toast.js`; caught in `hand/behaviours/catch.js`) | `bread.*` in `src/lines/page.js`, `hand.toast`, `hand.toastEat` | inline |
| greeting typewriter | `src/page/greeting.js` | `greeting.hello` in `src/lines/page.js` | |
| banner fog; kiri flood and typed secrets | `src/page/fog.js`; `src/page/kiri.js` | `toast.fog` | `styles/fog.css` |
| the katana slits the fog; slashing 棚 opens the shelf | `src/page/slash.js` (on `blade.moved`, in `reactions.js`); `slit` in `fog.js`, `kiri.js` | `katana.tana` | inline |
| theme, crazy mode, English only | `src/page/theme.js`, `crazy.js`, `language.js` | | `styles/base.css`, `crazy.css` |
| Surprise me, the omikuji slip, the secret × | `src/scenes/fortune.js` | `fortune.slip` in `src/lines/page.js` | `styles/omikuji.css` |
| the coin game; welcome back; scene runner | `src/scenes/coin.js`; `welcome-back.js`; `scene.js` | `hand.*`, `button.hi` | `styles/omikuji.css` |
| phrasebook menu, its drawings, the raid | `src/phrasebook/menu.js` (`CHAPTERS`), `figures.js`, `raid.js` | `src/lines/phrasebook.js` (`raid.*`) | `styles/phrasebook.css` |
| phrase-say: select a line in the open phrasebook, its owner says it beside the menu (or refuses a line you never heard) | `src/phrasebook/say.js` (heard via `core/speech.js` `onSaid`) | `card.notyet`, `katana.notyet`, `hand.notyet`, `sev.notyet`, `toast.sayNobody` in `src/lines/phrasebook.js` | inline |
| every tuning number and timing | `src/core/tune.js` (`TUNE`, `TIMING`) | | |
| test hooks (`window.__*`), `?debug` | `src/core/debug.js` | | |
| feed the search box: drop a card, a scrap or an old hand on it and it searches for it | `src/page/feed.js` (`body.dropped` in `reactions.js`; `cards.putBack`, `severed.notThere`) | `card.eaten`, `card.home`, `sev.notthere`, `search.gulp`, `search.spit`, `toast.scrap` | |
| install order | `src/main.js` (`ORDER`) | | |

## How a frame runs

`core/clock.js` runs one loop. Inside a phase, callbacks run in registration order, which is install order (`src/main.js`).

```
frame(t): tab hidden -> return (resumes when shown)    no hasWork() true -> stop
          ms = min(250, t - last); acc += ms / 1000
  tick  input     world/loop autoscroll
  step  (while acc >= DT, DT = 1/240 s)
        pose      world/loop: px, py, pa of every body
        forces    world/loop: root springs (+ shake torque draws); severed/gait: legs, upright torque, walk force
        joints    world/loop: the pointer joint target
        world     world/loop: b2.step
        impacts   world/shatter: drain world.hits (shatter)
        blasts    world/shatter: drain world.blasts (shove)
        bodies    world/loop: die, hot, root grip, 'card.strained', tear, settle
  tick  fx        world/fx: particles
        blade     world/cut: bleed, the blade's stroke (emits blade.moved, card.cutting, card.cut, card.stabbed)
        hand      actors/hand: the arm (pre-chain, the current behaviour's tick, post-chain, draw, sever check)
        severed   actors/severed: every cut-off hand (age, held check, behaviour tick, turn, draw)
        late      free: put a new actor's per-frame work here
  busy = any keepAwake()
  draw  bodies    world/loop: transforms, fades, speech.ride(world.bodies)
        bubbles   core/speech: layout()
  busy ? next frame : stop
```

| register with | signature | who uses it today |
|---|---|---|
| `clock.onStep(fn, phase)` | `fn()` per 1/240 s step | world/loop (pose, forces, joints, world, bodies), severed/gait (forces), world/shatter (impacts, blasts) |
| `clock.onTick(fn, phase)` | `fn(dt, ms)` per frame | world/loop (input), world/fx (fx), world/cut (blade), hand (hand), severed (severed) |
| `clock.onDraw(fn, phase)` | `fn(k)` per frame | world/loop (bodies), core/speech (bubbles) |
| `clock.hasWork(fn)` | may the loop start / run this frame | world/loop (bodies exist), world/fx (bits), hand, severed, shelf |
| `clock.keepAwake(fn)` | ask for another frame | world/loop (grab, root, die, say, awake bodies), world/fx, hand, severed, shelf |
| `clock.wake()` | start the loop if stopped and there is work | anything that just made work (a line said, a state set) |

The phases are fixed in `core/clock.js` (`STEP_PHASES`, `TICK_PHASES`, `DRAW_PHASES`); an unknown phase name throws.

## Commands

| command | what it does |
|---|---|
| `npm test` | the 35 browser scenarios (Playwright, Chromium) on the modules, compared **strictly** with `tests/golden/` (about 9 min: prefer `ONLY`) |
| `ONLY="part of a name" npm test` | only the scenarios whose name contains the text |
| `npm run test:legacy` | the same scenarios on `?legacy` (`LEGACY=1`; until legacy.js is deleted). A scenario whose behaviour changed after the flip takes `legacy: false` and is skipped there |
| `UPDATE_GOLDEN=1 ONLY="..." npm run test:golden` | record (or re-record) the goldens of the matching scenarios from the modules; review `git diff tests/golden` (recipes.md 10) |
| `TRACE_MATCH=kind ONLY="..." npm test` | looser compare: same order of line lists and state changes, no times or texts |
| `SHOTS=1`, `HEADED=1` | screenshots to `tests/shots/` / a visible browser |
| `node --test tests/unit/*.test.js` | unit tests, plain node (core, the lines snapshot, hand behaviours, gait, cut geometry, hand drawing, styles split) |
| `UPDATE_SNAPSHOT=1 node --test tests/unit/<file>.test.js` | rewrite that test's snapshot from the modules: `tests/unit/lines.snapshot.json` (lines-snapshot), `tests/unit/fixtures/*.json` (cut-geometry, hand-draw, sev-gait); review the diff |
| `node scripts/lint-layers.mjs` | the layer rules, no timers or `performance.now` outside `src/core/`, no `window.__` outside `src/core/debug.js` |
| `npm run stamp` | regenerate the import map in `index.html`. **After any change under `src/`** (add, remove or edit: the stamp hashes contents) |
| `npm run stamp:check` | what CI runs: fails if the import map is stale |

A failing scenario writes the actual trace to `tests/shots/<group>--<name>.actual.json` and prints the first difference.
Open the page with `?debug` for a strict bus (an unknown event type throws; the scenarios always run with a strict bus) and `?debug=events` to log every emit.
`?debug=zones` draws the hand's trigger zones; `?dbg` (exactly that) logs release and impact speeds.

## The cache rule

GitHub Pages caches every file for 10 minutes on its own, so a new file next to an old one can break the page.

- Modules: every `/src/*.js` URL in the import map carries one `?v=N`. Run `npm run stamp` after any change under `src/` and commit `index.html` with it (CI's `npm run stamp:check` fails otherwise).
- Styles: the seven `<link rel="stylesheet" href="/styles/<name>.css?v=N">` in `index.html` are bumped **by hand**: change a stylesheet, bump its `?v=`.
- `styles/phrasebook.css` is loaded by `src/phrasebook/menu.js` with `?v=` + `VER`: bump `VER` there when that stylesheet changes.
