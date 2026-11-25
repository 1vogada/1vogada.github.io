# src/: the new kiripad.dev code

<<<<<<< HEAD
=======
> Start with [`docs/`](../docs/README.md): the map, recipes for changes, the event catalogue and the pitfalls. This file is the core contract reference.

>>>>>>> pkg/d5
Native ES modules, no build step. Loaded through `/src/main.js` by default since the parity suite passed (all 35 scenarios, strict); `?legacy` loads the old script. Was behind `?next` until the parity suite passes on old
and new; then the default flips. **Nothing here may change behaviour**: same lines, same timings, same random draws in the
same order (a seeded `Math.random` gives identical runs old vs new), same order of effects within a frame.

```
node --test tests/unit/*.test.js     # core unit tests (plain node, no DOM)
node scripts/lint-layers.mjs         # layer and timer rules
```

## Rules

1. **No timers outside `core/clock.js`.** No `setTimeout`, `setInterval`, `requestAnimationFrame`, `performance.now` anywhere
   else (lint enforces it). Game time: `clock.now/after/every/sleep/cooldown/scope`. Legacy bare `setTimeout`: `clock.real.*`.
   Animation loops: `clock.frames(fn)`, one frame: `clock.nextFrame(fn)`, wall clock: `clock.wall()`.
2. **No bubbles outside `core/speech.js`.** Every `.say`, `.btn-say`, `.pb-say` element is made there.
3. **No line text outside `src/lines/`.** Code names lines by key (`line('card.pull')`, `say(o, 'hand.rip')`). Toast texts are
   lines too (one-line lists: no random draw).
4. **No numbers outside `core/tune.js`.** Feature numbers live in `TUNE`/`TIMING`. Formula literals move verbatim with their
   function; lift one into `TUNE` if you need to tune it, never change its value.
5. **No `window.__` outside `core/debug.js`.** Publish a test hook with `debug.hook('__name', value)`.
6. **Never import another actor.** Emit an event (`core/events.js`) and add one line to `src/reactions.js`.
7. A file imports only from layers above it, or from its own package. Every module exports `install(app)`.
8. **Core is frozen.** Later packages code against it; they may not change `src/core/`. Need something? Ask the orchestrator.

## Layers

| layer | folder | package (imports inside a package are free) |
|---|---|---|
| 1 | `core/` | core: clock bus events lines speech machine claims tune debug |
| 2 | `world/` | world: world loop drag shatter cut fx |
| 3 | `actors/` | one package per actor: `cards.js`, `katana.js`, `hand/`, `severed/`, `shelf.js` |
| 4 | `page/` `lines/` | two packages (they do not import each other) |
| 4.5 | `scenes/` `phrasebook/` | two packages; they may import `page/` (the slip needs the directory's data and embroidery), not each other |
| 5 | `reactions.js` `main.js` | main imports everything |

## The contract as built (`src/core/`)

### clock.js
```js
now()                      // game ms: performance.now() minus hidden time, frozen while hidden (legacy now()/hiddenAt/away)
hidden(); wall()           // tab hidden?; performance.now()
after(ms, fn) -> cancel; every(ms, fn) -> cancel; sleep(ms) -> Promise     // game time: paused while hidden
cooldown(ms) -> { ready(), hit(), left(), reset() }
real.after / real.every / real.sleep                                       // wall time (legacy bare setTimeout)
scope(name, { wall = false }) -> { after, every, sleep, on(type, fn), listen(target, type, fn, opts), onEnd(fn), end(), ended }
GONE                       // what a scope's pending sleep() rejects with on end()
onStep(fn, phase) / onTick(fn, phase) / onDraw(fn, phase) -> off
hasWork(fn) / keepAwake(fn) -> off
wake(); running()          // legacy run(); loopOn
frames(fn) -> cancel; nextFrame(fn) -> cancel      // independent rAF loops (fn(t) returning false stops)
visibility(hidden)         // the visibilitychange handler (wired by install; tests call it)
createClock(env)           // an independent clock with a fake env (tests)
```

### bus.js / events.js
```js
on(type, fn) -> off ('card.*' and '*' wildcards); once(type, fn); emit(type, payload); tap(fn)
createBus({ strict, catalogue })
EVENTS (type -> payload doc), EVENT_TYPES, isEvent
```
Synchronous; listeners in registration order (exact and wildcard share it). Strict (any `?debug`, and tests): unknown types throw.

### lines.js
```js
defineLines(key, list, { who, trigger: { title, when }, gloss: { line: meaning }, lang, legacy: 'SAY.pull' })
line(key)        // EXACTLY legacy pick(); memory per array, "said by anyone" shared; one draw, none for a list of < 2
pick(array)      // the same picker for any array (legacy __pick; the raid picks DOM elements with it)
list(key)        // the array line() picks from (filtered copy under a language filter; stable identity)
once(id)         // true the first time per page load (the first rip is always CHEESE PULL)
allLines(); setLanguages(['en'] | null); languages(); legacy(); langOf(text); has(key)
```

### speech.js
```js
defineSpeaker(kind, { kinds, prefix, gate, quiet, cls, extraCls, tag, tilt, layer, life, layout, first, anchor, onSaid })
say(self, key, { force, scream, mode: 'agony'|'plain', pain, floor, text, first: { id, text }, as, cls }) -> bubble | null
sayAt(x, y, key, { scream, text, as, floor }) -> el       // left at a page point, removed on wall time
sayIn(el, key, { text, floor, extra }) -> el               // inside an element (Heads/Tails), no tilt draw
hush(self); expire(self, t); place(self, x, y, ax); ride(bodies, t); flushLater(self); scream(el)
layout()                                                   // legacy sayLayout, registered on draw phase 'bubbles'
setLayoutSource(() => world.bodies); addFirst(() => claw)
```
Gates (the legacy rules, by name): `card` (legacy `say`: card/katana, `quiet` = the katana's 2 s, `scream` = shared
death-scream cooldown), `arm` (legacy `clawSay`: idle gap, cut-in after `gap.show`, `later` queue, floor by kind),
`severed` (legacy `sevSay`), `plain` (legacy `talkOn`), and `mode: 'agony'` (legacy `cardSay`, tier = key + `.0/.1/.2`).

### machine.js
```js
defineBehaviour(actor, name, { pose, busy = true, enter(self, m), tick(self, m, dt), leave(self, m), on: { type(self, ev, m) }, ...extra })
machine(actor, self, initial, { switched, entered, bus }) -> m { state, def, t, data, busy, set(name, data), is(...), age(dt), step(dt), tick(dt), end() }
behaviours(actor); behaviour(actor, name)
```

### claims.js
```js
claim(body, owner, why) -> release; holder(body); holders(body); isFree(body); heldBy(body, owner, why?); clear(body)
```

### tune.js / debug.js
`TUNE` (physics, drag, shatter, cut, fx, katana, hand, severed, shelf, raid, fog, kiri, greeting, surprise, tilt, speech) and
`TIMING` (verbatim, with `ms`, `span`, `talk`). `debug.hook(name, value)`, `debug.flags()`, `install(app)` publishes
`window.__kiri` and the legacy hooks.

## Refinements to the planned contract (and why)

1. **Two loop predicates instead of one.** Legacy `frame()` stops at the *start* of a frame when nothing exists
   (`objs.size || bits.length || clawBusy()`) and asks for the next frame only when something is *active* (grab, bits,
   clawBusy, any body rooted/dying/talking/awake), and the draw factor is `busy ? acc/DT : 1`. So `hasWork(fn)` (start, and
   `wake()`) and `keepAwake(fn)` (end) are separate.
2. **Named phases.** Step: `pose, forces, joints, world, impacts, blasts, bodies`. Tick: `input` (before the steps: the
   autoscroll), then `fx, blade, hand, severed, late` (legacy `moveBits, bladeCuts, clawTick, sevTick`). Draw: `bodies,
   bubbles`. Legacy snapshot + `sevStep` + root spring ran in one loop over `objs`; they are split into `pose` and `forces`
   (no body is both a walking hand and rooted, forces add, the only random draw is the root's shake torque, in body order).
3. **Wall time next to game time.** Legacy mixed the paused game clock with bare `setTimeout` (sayAt removal, toasts, the
   whole Surprise me scene, the greeting, trails, the severed hand's `sevRest` safety timer, the button bubbles). Moving
   those onto the paused clock would change what happens while the tab is hidden, so `clock.real.*` and
   `scope(name, { wall: true })` keep them on wall time. Scenes use wall scopes.
4. **`frames()` / `nextFrame()` / `wall()`** for the independent rAF loops (fog, flood, band roll, raid, coin) and the coin's
   `performance.now()`; lint also bans `requestAnimationFrame`/`clearTimeout` outside core. Each `frames()` loop requests its
   own rAF, so the relative order of loops (and of their random draws) is the legacy order.
5. **The phrasebook raid keeps its own clock** (`r.now`: frame ms added only while visible, clamped to 250). Its speakers
   take `life: () => r.now` and `layout: false`; it keeps its own planck world.
6. **Speech: owners position.** The anchor/expiry points differ in legacy (body bubbles expire in `draw()`, the arm's in
   `clawTick()`, before the busy check), so speech exposes `expire/place/ride` for owners to call at the legacy point, and
   `anchor` for body riders (called from `ride(world.bodies, t)` in the world's draw). Layout order is legacy: the first
   speaker (the arm), then bodies in `world.bodies` order (`setLayoutSource`).
7. **Speech extras:** `sayIn` (button bubbles: span inside the button, no tilt draw, +100 ms), `opts.text` (lines picked up
   front: the two `btnhi` picks, raid lines), `opts.first` (CHEESE PULL, consumed only when the line is really shown),
   `mode: 'agony'`, `flushLater` (legacy `c.later`), `onSaid` (the arm emits `hand.said`), `scream`, `prefix` (legacy
   katana-vs-card check, which came first and drew nothing). say() returns the bubble or null (legacy clawSay's
   `undefined` vs `0` both meant "not shown").
8. **Extra events:** `body.added`, `body.removed` (legacy `sevGone`/`katObj = null` point inside `remove()`),
   `world.resized` (legacy `buildWalls` rebuilt the shelf), `data.loaded` (welcome back), `cards.rendered`, `ui.toast`
   (actors cannot import page/toast.js), `hand.said` (the katana brags after "MY HAND!!"), `katana.found`, `hand.state`.
   `hand.severed` carries the spawn data and fires at the legacy `sevSpawn` call; `card.stabbed` fires before the wound.
9. **machine:** `switched`/`entered` hooks (legacy `a.up = !!SEV[st].up` before enter, `setAwake + run()` after);
   `entered` is not run for the initial state (legacy `sevSpawn` called `SEV.limp.enter` only); `age`/`step` split (legacy
   `sevTick` aged, checked the grab, then ticked); a switch made inside `enter` wins and only the inner one emits.
10. **claims stack** (the pointer and the arm both hold a card in the tug); `heldBy`, `clear`.
11. **`world.blade`** (set by the katana with `setBlade`): the hand's sever check and the severed hand's flee read it, so
    neither imports the katana. The hand reads the shelf through `hand.senses()` injected by `reactions.js`.
12. **lines:** `list(key)` and `once(id)`; `legacy` path option so `__lines` holds the very arrays `line()` picks from (the
    raid picks `__lines.CLAW_SAY.rip` through `__pick`, sharing the hand's memory). An emptied language filter falls back
    to the whole list.
13. **debug:** any `?debug` (or `window.__test.strictBus`, which the test harness sets) makes the bus strict; `?debug=events` also logs. `window.__lines` is built at debug install.
14. **TIMING is unchanged** (same shape on `window.__timing`); new speech numbers (tilt, ride offset, agony gaps, arm bubble
    offsets, layout paddings) are in `TUNE.speech`.
15. **Layer 4 is split** into 4 (`page/`, `lines/`) and 4.5 (`scenes/`, `phrasebook/`): legacy Surprise me reads the
    directory's `data` and `band()`, so scenes must be able to import the page.

## Install order (`main.js`)

Legacy script order, because it fixes the order of same-type DOM listeners on the same target and of start-up random draws.

1. core: tune, events, bus, clock (visibilitychange listener), lines, speech (draw phase `bubbles`), machine, claims, debug
   (strict bus, `window.__kiri`, `__timing`, `__pick`, `__lines`; later hooks publish at once)
2. lines/*: cards, katana, hand, severed, shelf, phrasebook (they call `defineLines` when imported)
3. page above the physics: toast, directory (fetches), reader (hashchange, Escape), search, tilt (band roll loop)
4. legacy `cardPhysics()`: world, loop, drag (grid pointerdown, pointermove, pointerup/cancel, touchmove, click capture,
   dragstart, document pointerdown), shatter, cut, fx, cards, katana (DOM, hero pointermove, dblclick, Escape keydown),
   hand (poses, draw, zones, tug, 18 behaviours, index), severed (gait, 7 behaviours, index), shelf
5. reactions
6. page below the physics: greeting, scene, fortune (surprise click, secret pointermove, Escape keydown), coin,
   welcome-back (pageshow), fog (14 blobs = 56 draws; hero pointermove after the katana's), kiri (16 blobs = 64 draws;
   keydown after fortune's), theme, crazy
7. phrasebook: menu (keydown capture, button), figures, raid
8. language

Same-type listener orders that matter: document `keydown`: reader Escape, katana Escape, fortune Escape, page keys (kiri.js),
phrasebook (capture). Hero `pointermove`: katana reveal, fog wipe. Document `pointermove`: secret ×, kiri wipe.
`visibilitychange`: clock, fog.

## Frame phases

```
frame(t):  hidden? return            | no hasWork? stop
           ms = min(250, t - last); acc += ms/1000
  tick  input      world/loop: autoscroll a carried card resting at a screen edge
  step  (while acc >= DT, DT = 1/240)
        pose       world/loop: px, py, pa of every body
        forces     world/loop: root springs (+ shake torque draws) ; severed/gait: leg spring, upright torque, walk force
        joints     world/loop: grab.joint.setTarget(pointer + scroll)
        world      world/loop: b2.step(DT, 10, 6)
        impacts    world/shatter: drain world.hits (shatter)
        blasts     world/shatter: drain world.blasts (shove)
        bodies     world/loop: o.die, o.hot, root grip / 'card.strain' / tear / settle
  tick  fx         world/fx: moveBits
        blade      world/cut: bleed, bladeCuts (emits blade.moved)
        hand       actors/hand: clawTick
        severed    actors/severed: sevTick
        late       (free)
  busy = any keepAwake
  draw  bodies     world/loop: transforms, fades, speech.ride(world.bodies, now)
        bubbles    core/speech: layout()
  busy ? next frame : stop
```

## Line keys

| legacy | key |
|---|---|
| `SAY.pull strain back rip throw land cutting stab slice smash` | `card.<name>` |
| `SAY.kdrop khello kbrag kcut` | `katana.drop hello brag cut` |
| `SAY.btnhi` | `button.hi` |
| `AGONY[0..2]`, `PANIC[0..2]` | `card.agony.0..2`, `card.panic.0..2` |
| `NOTME`, `BEG` | `card.notme`, `card.beg` |
| `CLAW_SAY.<name>` (all 44) | `hand.<name>` |
| `SEV_SAY.<name>` | `sev.<name>` |
| phrasebook `RAID_SAY SWAT_SAY GRUDGE_SAY ANGRY_SAY SCROLL_SAY HELP_SAY ALONE_SAY MORE_SAY HIDE_SAY`, `'all gone.'` | `raid.bored swat grudge angry scroll help alone more hide done` |
| toasts | `toast.<name>` (see the stubs in `lines/`) |

Speakers: `card` (kinds card/piece/shard, prefix `card.`), `katana` (prefix `katana.`, quiet `gap.katana`), `arm`,
`severed` (kind hand), `page` (sayAt), `button` (sayIn), `raidHand`, `raidCard`, `raidScream`.

## Where every legacy function lands

Inline script of `index.html` (master 41683e8) and `scripts/phrasebook.js`.

| legacy | target |
|---|---|
| `root`, `reduced`, `isCrazy` | `main.js` `app.root/app.reduced`; `world.isCrazy` |
| `hype`, `blurbs`, `esc`, `host`, `data`, `site`, `failed`, `query` | `page/directory.js` |
| `toast`, `toastTimer` | `page/toast.js` (actors emit `ui.toast`) |
| `PALETTES`, `seeded`, `band` | `page/directory.js` |
| `excerpt`, `items`, `visible`, `sections`, `calmCard`, `fmtDate`, `render`, site.json/projects.json fetches | `page/directory.js` |
| `inline`, `markdown`, `route`, reader click/hashchange/Escape | `page/reader.js` |
| search `input`/`keydown` (shelf secret on Enter) | `page/search.js` |
| card tilt `pointermove`/`pointerout`, `bandRoll`/`tick` | `page/tilt.js` |
| `TIMING`, `TIMING.ms/span/talk` | `core/tune.js` |
| `S DT GRAVITY STRAIN RIP ROOT_HZ PULL_HZ HAND_HZ SPIN HELD_SPIN FALL HOT SMASH` | `core/tune.js` `TUNE.physics/drag` |
| `pl`, `loading`, `load`, `init`, `buildWalls`, `world`, `ground`, `layer`, `wallFx`, `size`, `objs`, `rootOf`, `ripped`, `smashed`, `hits`, `blasts` | `world/world.js` |
| `away`, `hiddenAt`, `now`, visibilitychange, `loopOn`, `last`, `acc`, `frame`, `run` | `core/clock.js` |
| `DBG` (`?dbg`) | `core/debug.js` `flags().dbg` |
| `zones`, `?debug=zones` overlay | `actors/hand/zones.js` |
| `cloneCard`, `addBody`, `remove` | `world/world.js` |
| `SAY` | `lines/cards.js`, `lines/katana.js` (`btnhi` in `lines/cards.js` as `button.hi`) |
| `cutSaid`, `pickMem`, `pickSaid`, `pick` | `core/speech.js` (shared scream), `core/lines.js` |
| `bubble`, `sayLayout`, `say`, `talkOn`, `scream`, `sayAt` | `core/speech.js` (speakers configured by the actors) |
| `step` | `world/loop.js` (+ `severed/gait.js` step) |
| `draw` | `world/loop.js` + `speech.ride` |
| `hold`, `carry`, `drop`, grid `pointerdown`, `onMove`, touchmove, click capture, dragstart, loose `pointerdown`, `press`, `grab`, `suppress` | `world/drag.js` (re-exported by `world.js`) |
| `startPull`, `tear` | `actors/cards.js` |
| `onContact`, `shatter` | `world/shatter.js` |
| `katanaSvg`, `hero`, `kat`, `katIn`, `sheatheBtn`, `actions`, `found`, `near`, `lastWipe`, reveal `pointermove`, `KAT_REST`, katIn `pointerdown`, `plant`, `freeKatana`, `EQUIP_ANGLE`, `equip`, dblclick, `putBack`, sheathe/kat click, Escape keydown, `katObj`, `k9` | `actors/katana.js` (`katObj` = `world.blade`) |
| `TIP`, `TRAIL_SPEED`, `toLocal`, `toPage`, `edgeOf`, `screamed`, `wounds`, `tick` (stroke), `bladeCuts`, `endCut`, `bleed` | `world/cut.js` (`toLocal/toPage` re-exported by `world.js`) |
| `polyArea`, `validPoly`, `rectPoly`, `worldPoly`, `inside`, `crossings`, `targets`, `freeCard`, `fragment`, `slice` | `world/cut.js` (`rectPoly/worldPoly/freeCard/fragment` via `world.js`) |
| `bits`, `spray`, `moveBits`, `trail`, `gore`, the `#projects` shake | `world/fx.js` |
| `CLAW_SAY` | `lines/hand.js` |
| `NS`, `FING`, `THUMB`, `BEND`, `ARCH`, `GRIP`, `PALM`, `POSES` | `core/tune.js` `TUNE.hand`, re-exported by `actors/hand/poses.js` |
| `claw`, `clawBusy`, `clamp01`, `wrapA`, `clawInit`, `clawSet`, `REACT_GAP`, `notice`, `clawSay`, `clawReset`, `snatch`, `clawLetGo`, `sever`, `window.__hand` | `actors/hand/index.js` |
| `handParts`, `clawDraw`, `handDraw` | `actors/hand/draw.js` |
| `gripPt`, `wristFor`, `clawPre`, `clawTug`, `tugDraw`, `clawUntug`, `clawSlip`, `clawRip`, `CRUSH_Q`, `CRUSH`, `crushQ`, `crushPause`, `crushStart` | `actors/hand/tug.js` |
| `clawTick` branches `off lurk reach eager lunge snatch catch crush gloat tug has triumph eat show stump regrow sulk book` | `actors/hand/behaviours/<state>.js` |
| `clawTick` pre-chain (init, lost card, grab tracking, catch scan) and post-chain (agitation, later, react, flinch, easing, held-card drawing, strands, bubble place, draw, sever check) | `actors/hand/index.js` |
| `AGONY`, `PANIC`, `NOTME`, `BEG` | `lines/cards.js` |
| `panic`, `cardSay` | `actors/cards.js` (`panic` via `hand.reaching`; `cardSay` = speech `mode: 'agony'`) |
| `SEV_SAY` | `lines/severed.js` |
| `GAIT`, `TURN`, `NEXT`, `sevGround`, `sevFeet`, `sevStep`, the turning block of `sevTick` | `actors/severed/gait.js` (numbers in `TUNE.severed`) |
| `sevs`, `SEV_POSE`, `sevBusy`, `sevSay`, `sevSpawn`, `sevGone`, `sevSet`, `sevFood`, `sevUnsquash`, `sevTick`, `window.__sev` | `actors/severed/index.js` |
| `SEV.limp rise walk held crush gloat rest` | `actors/severed/behaviours/<name>.js` |
| `shelf`, `shelfOn`, `shelfOff`, `onShelf`, `nearShelf`, `shelfSnack`, `window.__shelf` | `actors/shelf.js` |
| `showReset`, `resetBtn`, `resetAll` | `world/world.js` (`world.reset` emits `world.reset`; each actor resets itself) |
| `cards-rendered` listener | `actors/cards.js` (on `cards.rendered`) |
| `window.__cards`, `window.__lines` | `core/debug.js` (`__cards` published by `world/world.js` through `hook`) |
| `hellos`, `helloEl`, `type` | `page/greeting.js` |
| `surprise`, `label`, surprise click, `FORTUNES`, `omi`, `slip`, `$`, `goBtn`, `noBtn`, `qEl`, `actEl`, `drawFortune`, `closeFortune`, `fitOmi`, `secret`, `found`/`peek`, secret `pointermove`/click, `askHand`, `askAgain`, `unpeek`, omi-x/omi click, Escape keydown, `showOff` | `scenes/fortune.js` |
| `scene`, `GONE`, `sleep` | `scenes/scene.js` (`core/clock.js` `GONE`, wall scope) |
| `swatsLeft`, noBtn/goBtn click, `handScene` (`makeBtns`, `tap`, smash, `turn`, `fly`, `hover`, `poke`, `stopClock`, `clock`, `myPick`, `go`, result, Yes press) | `scenes/coin.js` |
| `SENT`, `welcomeBack`, `pageshow` | `scenes/welcome-back.js` |
| hero fog: `cv`, `ctx`, `mask`, `mctx`, `hint`, `W/H/dpr/last/running/wiped`, `REGROW_S`, `heroGrow`, `regrowMask`, `blobs`, `fogRGB`, `rgb`, `resize`, `wipe`, `frame`, `setRunning`, pointermove/pointerleave, ResizeObserver, IntersectionObserver, visibilitychange, `refog` | `page/fog.js` |
| kiri flood: `kv`, `kctx`, `km`, `kmctx`, `FLOOD_*`, `flood`, `kW/kH/kdpr/kS/kLast`, `kGrow`, `kBlobs`, `ease`, `pageH`, `kSize`, `kMaskSize`, `kWipe`, `kFrame`, `floodPage`, `liftFlood`, its pointermove/scroll/resize | `page/kiri.js` |
| `themeBtn`, `darkNow`, `syncTheme`, theme click, prefers-color-scheme change | `page/theme.js` |
| `typed`, keys keydown, hero click (secret tap) | `page/kiri.js` (the shelf through `actors/shelf.js`, the fog's alpha through `page/fog.js` `alphaAt`) |
| `calmTitle`, `slopTitle`, `titleTimer`, `applyMode`, `warn`, `setCrazy`, `askCrazy`, toggle/warn handlers | `page/crazy.js` |
| phrasebook `nav`, `esc`, `VER`, `here`, `CHAPTERS`, `listOf`, `linesHTML`, `build`, `el`, `scroller`, `isOpen`, `lastFocus`, `q`, `make`, `onKey`, `open`, `close`, the button, `window.__phrasebook` | `phrasebook/menu.js` (CHAPTERS' trigger texts become `trigger` on `defineLines`) |
| phrasebook `RAID_SAY SWAT_SAY GRUDGE_SAY ANGRY_SAY SCROLL_SAY HELP_SAY ALONE_SAY MORE_SAY HIDE_SAY`, `GLOSS` | `lines/phrasebook.js`; glosses next to their lines in every `lines/*.js` |
| phrasebook `langOf` | `core/lines.js` `langOf` |
| phrasebook `figN`, `INK`, `zig`, `cardG`, `bubble` (SVG), `cursor`, `hatch`, `first`, `handParts`, `handPrint`, `kat`, `FIGS`, `figure`, `figN_plate` | `phrasebook/figures.js` |
| phrasebook `TM`, `LINGER`, `HELP_WAIT`, `GAP`, `ASK_GAP`, `talk`, `S DT GRAV FALL SMASH GRIP`, `raid`, `armT`, `armed`, `pick`, `clamp`, `raidArm`, `loadPlanck`, `raidStart`, `raidWalls`, `raidStop`, `raidSay`, `raidCrumbs`, `raidRip`, `raidSwat`, `intact`, `inView`, `raidBody`, `raidShatter`, `raidFrame`, `raidHand` | `phrasebook/raid.js` (numbers `TUNE.raid`, bubbles via speech speakers `raidHand/raidCard/raidScream`) |

Note: `page/` is one package, so page modules import each other freely (kiri.js uses fog.js `alphaAt` and `regrowMask`,
theme.js calls fog.js `refog`, crazy.js calls directory.js `render` and stops the fog). Scenes and the phrasebook may import
`page/` (fortune.js needs the directory's projects and `band`). Nothing below layer 4.5 may import a scene or the phrasebook:
the page reaches them through events wired in `reactions.js` (`data.loaded` -> welcome back).

## Hard parts for later packages (read before you start)

- **Random draws are everywhere and order matters.** `handDraw` draws two per call even with shake 0; `bubble()` draws one
  for the tilt after the line's pick; `notice()` draws one, two if a remark is queued; `TIMING.span` one; the root shake
  torque one per rooted body per step while slipping; the fog (56) and flood (64) blobs at start-up; `drawFortune` one or two;
  the btnhi pair is drawn before the bubbles show. Every gate that drops a line draws nothing.
- **`notice()` vs the actor's own line:** the line first, then the event. `card.stabbed` is the exception (event, then the
  wound's random life, then the line).
- **The claw is not a clean state machine.** `clawSet` has no enter/leave, states are switched from the pre-chain (the catch
  scan) and from helpers (`clawTug`, `clawSlip`, `snatch`, `sever`), and the post-chain does per-state work (the crush and
  tug drawings, the snap of `has`). `c.t` is incremented before the chain, so a state set mid-frame starts with t = 0 in
  that frame's post-chain. `flinch` overrides the target of lurk/sulk after the react queue.
- **`c.o` is read by the severed hand** (`sevFood` excludes the arm's target). Claim every body the hand sets as `c.o`
  (`claim(o, 'hand', 'target')`) and release it wherever legacy cleared `c.o`.
- **Body flags as shared state:** `o.tug` (hand), `o.sq` (severed), `o.root`, `o.die`, `o.hot` are read across actors
  (`shelfSnack`, `sevFood`, the catch scan, `panic`'s bystanders). Keep the fields; add claims for the queries.
- **Two clocks in one scene.** The coin's `fly()` uses `performance.now()` (`clock.wall()`), the scene's sleeps are wall
  timers, the hand it drives runs on game time. Web Animations (`el.animate`) ignore Playwright's frozen clock.
- **`remove()` order:** drop the grab, hush the bubble, (katObj = null, sevGone) = `body.removed`, then destroy. `sevGone` runs
  the behaviour's `leave`, which may touch the body while it is still in `world.bodies`.
- **`world.reset` happens first** (legacy `clawReset()` before removing bodies); the shelf survives a reset.
- **The raid** borrows the arm (`c.st = 'book'`), restores it with `H.set('lurk')` unless it was off, and picks DOM elements
  with the shared picker (`pick(seen)`): one draw from the same `Math.random`.
- **The sevRest safety timer** is a legacy `setTimeout`: wall time (`clock.real.after`).
- **Hidden tab:** a game-time scope freezes; legacy setTimeout code did not. Use `{ wall: true }` where legacy used setTimeout.
- **`index.html`, `scripts/`, `tests/helpers`, `tests/scenarios`, `package.json` belong to N0.** The new code ships only in `src/`.
