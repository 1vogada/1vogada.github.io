# Pitfalls

The short list of what bites. Each item: the trap, then what to do.

## 1. Random draws: the order is the behaviour

Every test page seeds `Math.random` (mulberry32, `seed` 1 unless the scenario says otherwise; `tests/helpers/page-init.js`).
One extra or missing draw anywhere shifts every later pick: other lines, other waits, other crush rolls, and the strict golden
fails from that point on. Who draws:

| draws | where |
|---|---|
| 1 per shown line (0 for a one-line list) | `line(key)` / `pick(array)` (`core/lines.js`) |
| 1 per bubble (its tilt), after the line's draw | `core/speech.js` `make` for speakers with `tilt: true` (all but `button`) |
| 2 per frame while the arm is drawn | `actors/hand/draw.js` `handDraw`, even with shake 0 |
| 1, or 2 when a remark is queued | `hand.notice(kind)` |
| 1 | `TIMING.span([a, b])` |
| 1 per rooted body per step while its grip slips | `world/loop.js` `forces` (shake torque) |
| 56 + 64 at start-up | the fog's 14 blobs and the kiri flood's 16 blobs, 4 each, in install order |
| many | shatter, cut pieces, wounds, panic, the cut-off hand's spawn spin and waits, the coin, the raid |

A gate that holds a line back draws nothing, so whether a line shows also changes the draws. A reaction runs inside `emit`, so its
draws land between the emitter's draws. **Do:** for a change meant to keep existing behaviour, add no draw on paths the scenarios
hit (check with `ONLY="..." npm test`). For a change meant to alter behaviour, expect the goldens of every scenario that reaches it
to change (item 12). In a scenario, `s.rand(0.3)` or `{ rand: 0.3 }` pins `Math.random` to a constant, `s.randQueue(...)` feeds values.

## 2. Game time vs wall time

| clock | API | runs while the tab is hidden? |
|---|---|---|
| game | `clock.now()`, `clock.after/every/sleep/cooldown`, `clock.scope(name)` | no: frozen, resumes where it was |
| wall | `clock.real.after/every/sleep`, `clock.scope(name, { wall: true })`, every scene (`scenes/scene.js`), `clock.wall()` (= `performance.now()`) | yes (throttled) |
| own | the phrasebook raid's `r.now`; a speaker with `life: () => number` | its owner decides |

The frame loop does not simulate time away: after a hidden tab it restarts from the current frame. Legacy code that used a bare
`setTimeout` stays on wall time (toasts, `sayAt` removal, the greeting, the scenes, the cut-off hand's `sevRest` safety timer).
**Do:** physics and actor timing on game time; UI and scenes on wall time; never mix the two for one wait. CSS and Web Animations
(`el.animate`) run on real time, even under the test's frozen clock (the harness finishes them with `finishCss` / `finishWaapi`).

## 3. No timers or `window.__` outside core (the lint)

`node scripts/lint-layers.mjs` fails on `setTimeout`, `setInterval`, `clearTimeout`, `clearInterval`, `requestAnimationFrame`,
`cancelAnimationFrame` or `performance.now` outside `src/core/`, on `window.__` outside `src/core/debug.js`, on a non-relative
import, an import that leaves `src/`, or a layer violation. Comments are ignored.
**Do:** timers from `core/clock.js` (`frames(fn)` for an animation loop, `nextFrame(fn)` for one frame); test hooks with
`hook('__name', value)`.

## 4. Actors never import each other

Lint fails on it. The same holds for `scenes/` vs `phrasebook/`, and nothing below layer 4.5 imports a scene or the phrasebook.
**Do:** emit an event and add a rule to `src/reactions.js`; for a per-frame query inject a function the way the hand senses the
shelf (`hand.senses({...})` in `reactions.js`). Three places read another module off `app` instead (not lint-checked; keep it rare):
`severed` draws with `app.handDraw`, the hand's `__hand.katanaSvg` and `phrasebook/figures.js` read `app.katana.katanaSvg`,
`page/kiri.js` calls `app.shelf.toggle()`.

## 5. Body claims and shared flags

`core/claims.js`: `claim(body, owner, why)` -> `release()`; claims stack. Today the arm claims its target (`c.o` setter:
`'hand'`, `'target'`) and a cut-off hand its prey (`'sev'`, `'crush'`). The pointer does **not** claim: it is `world.grab`
(`isHeld(o)`). Flags still shared across actors: `o.root` (rooted in the grid), `o.tug` (the arm's tug of war), `o.sq` (a cut-off
hand's squeeze), `o.die` (fading out at that time), `o.hot` (thrown, can smash). **Do:** before taking a body check all of them
(see `severed` `food()`: `!q.root && !q.tug && !q.sq && !isHeld(q) && isFree(q)`), claim it, release on every path out and on
`body.removed`.

## 6. Speech: gates and gaps

A line that a gate holds back returns null, shows nothing and draws nothing.

| gate | rule (numbers in `TIMING.gap`) |
|---|---|
| `card` (cards, pieces, shards, katana) | unforced: not within `card` (1400) of its last line. Forced: may not replace a bubble younger than `show` (600) unless it is a scream. Katana: quiet `katana` (2000) after any line. Death screams of all bodies share one `scream` cooldown (2000) |
| `arm` | one bubble slot. Unforced: dropped within `handIdle` (2400) of its last line (the first one needs 2.4 s of page time) or before `sayEnd + after`. Forced within `show` of the last line: queued (`c.later`), said by `flushLater` unless more than `handLate` (1200) late. `hand.say(kind)` returns 0 when queued |
| `severed` | not within `sev` (2200), forced `sevForce` (900) |
| `plain` / `mode: 'plain'` | always |
| `mode: 'agony'` | key + `.0/.1/.2` by pain; no new line within `1500 - 950 * pain` ms unless the tier rises |

The arm's remarks on events (`hand.notice`) wait `TIMING.react` and are said only in `idle` states (`lurk`, `sulk`).
**Do:** scenes wait `Math.max(ms, hand.say(kind))`; tests wait `TIMING.gap.show` before expecting a forced line.

## 7. Reduced motion

`app.reduced` is read once at load. Under it there is no physics at all: world, actors and the shelf return from `install`, so
`__cards`, `__hand`, `__sev`, `__shelf` do not exist; the greeting is a fixed "Hi there."; the phrasebook says "Nothing to
list"; Surprise me rolls one step. **Do:** return from `install(app)` when `app.reduced`; a scene checks it before calling the
hand. Test with `{ reducedMotion: 'reduce' }`.

## 8. Crazy mode

`html.crazy` (`isCrazy()` from `src/world/world.js`). The arm's tick and `notice` return, the katana cannot be equipped or found,
the shelf and the kiri flood do nothing, the fog loop stops, CSS hides the claw and `#phys`. It is asked for on every load (stored
`kiripad-mode=crazy` only pre-selects). **Do:** every new feature checks `isCrazy()` where it would start something.

## 9. English-only mode and the test pin

Visitors get English only unless `localStorage['kiripad-lang'] === 'all'`. `src/page/language.js` calls `setLanguages(['en'])`
when it is **evaluated** (imported by `main.js` before `boot()`), so `list(key)` is a filtered copy and picks differ from the
mixed lists. Toasts go through `plain()`, fortunes through `thinFortunes()`, the greeting through `thin()`. The test harness sets
`kiripad-lang = all` when unset, so the goldens are the mixed-language behaviour. **Do:** tag every new line (`lang`); look at
English-only by hand (footer "More languages" / "English only"), or in a scenario with `local: { 'kiripad-lang': 'en' }`.

## 10. The cache and the stamp

GitHub Pages caches each file for 10 minutes on its own. **Do:** `npm run stamp` after any change under `src/` (CI's
`npm run stamp:check` fails otherwise); bump the `?v=` of a changed stylesheet in `index.html` by hand; bump `VER` in
`src/phrasebook/menu.js` when `styles/phrasebook.css` changes.

## 11. Order of install and of listeners

`ORDER` in `src/main.js` is the legacy script order. It fixes the order of same-type DOM listeners (document `keydown`: reader
Escape, katana Escape, fortune Escape, page keys in `kiri.js`, then the phrasebook's capture listener; hero `pointermove`: katana
then fog), the order of start-up random draws, and the order of callbacks inside a frame phase. **Do:** add a new module at the end
of its group; move nothing.

Also: the physics world is lazy (planck loads on the first `pointerover` of `#grid`; `world.b2` is null until the first pull):
call `load()` then `init()` before touching it, as `actors/shelf.js` `toggle` does. `world.reset` is emitted before the bodies are
removed. `card.landed` fires inside the planck contact callback: no body may be created or destroyed there. The bus is strict
(unknown event types throw) only with `?debug` in the URL, not in the scenario suite.

## 12. Tests that pin today's behaviour

These were built to prove the refactor changed nothing; an intended change trips them:

| check | pins | what happens on an intended change |
|---|---|---|
| strict goldens (`tests/golden/`) | every bubble's time, life, list and text; every state change | fails from the first difference. Re-recording works only on the legacy run (`tests/helpers/harness.js` `if (UPDATE && !NEXT)`), so behaviour that legacy lacks cannot get a golden yet; use `golden: false` and assertions. `TRACE_MATCH=kind` is a looser local aid (no times, no texts) |
| `tests/unit/lines-data.test.js` | every list's text and order against `scripts/legacy.js` and `scripts/phrasebook.js`; no extra multi-line keys; no new triggers or glosses | fails on any line edit or new list |
| `tests/helpers/trace.js` | names the phrasebook raid's lists (`PB.RAID_SAY` ...) by reading `scripts/phrasebook.js` | deleting that file turns those keys into `?` and fails the raid golden |
| `tests/unit/styles-split.test.js` | the split CSS against `index.html` at commit `df0dc3b` | needs the git history (fails in a copy without `.git`) |

**Do:** until these are relaxed, say in your commit which goldens or checks changed on purpose and why.

## 13. Legacy bugs deliberately kept

Kept on purpose so old and new behave the same. Fix one only as a deliberate behaviour change (item 12).

| bug | where |
|---|---|
| `?dbg` works only as the exact query `?dbg` (`?dbg&x` does not) | `core/debug.js` `flags()` |
| the cut-off hand's walk turns by flipping `a.fd`; the 0.42 s edge-on turning animation only runs when `a.dir` changes, which walk never does | `actors/severed/gait.js`, `behaviours/walk.js` |
| `__sev.spawn` does not bring out the "Put the cards back" button | `actors/severed/index.js` |
| the coin's finger snap reads `H.get().tip2`, which is never set: always the fallback point | `scenes/coin.js` |
| a scene sleep started after `kill()` is not rejected at once: its timer runs out first; a killed scene stays `current()` until its own `finally` runs | `scenes/scene.js` |
| the cards' panic timers (`crowd`, `notme`) are never reset (legacy kept them on the claw) | `actors/cards.js` |
| a double fog loop after `setRunning(false)` + `setRunning(true)` in one frame; a second flood frame chain when flooding while lifting | `page/fog.js`, `page/kiri.js` |
| the gloss table had `もういい!` twice (the last wins); 18 Bulgarian / Japanese lines have no gloss | `src/lines/*.js` |
| `site.json` and `projects.json` both call `render()`; the last to arrive wins. Welcome back runs 900 ms after `projects.json`, so its timing hangs on the network | `page/directory.js`, `reactions.js` |
| last-delve dates use the visitor's locale and time zone | `page/directory.js` |
