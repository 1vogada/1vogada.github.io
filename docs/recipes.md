# Recipes

Each recipe: the files to touch, the code, how to check it. The code is real: the arm behaviour, the severed behaviour, the
reactions, the event, the scene, the actor and the scenarios below were applied to a copy of the tree and passed lint and their
scenario (see "Verified" at the end). Read [pitfalls.md](pitfalls.md) once before your first change.

After **any** change under `src/`: `node scripts/lint-layers.mjs`, `npm run stamp`, `node --test tests/unit/*.test.js`, and the
scenarios of the feature (`ONLY="..." npm test`).

Contents: [lines](#1-change-a-line-or-add-lines) · [numbers](#2-change-a-timing-or-a-tuning-number) ·
[arm behaviour](#3-add-a-behaviour-to-the-arm) · [severed behaviour](#4-add-a-behaviour-to-the-severed-hand) ·
[reaction](#5-add-a-reaction-between-two-features) · [event](#6-add-an-event-and-emit-it) · [speaker](#7-add-a-speaker) ·
[scene](#8-add-a-scene) · [actor](#9-add-a-whole-new-actor) · [scenario test](#10-add-a-scenario-test-and-record-its-golden)

---

## 1. Change a line, or add lines

**Files:** `src/lines/<who>.js` (`cards`, `katana`, `hand`, `severed`, `shelf`, `phrasebook`, `page`). For a new list that the
phrasebook should show under its own trigger: `src/phrasebook/menu.js` (`CHAPTERS`).

A list is one `defineLines(key, list, opts)` call (`src/core/lines.js`). Code never holds line text; it names the key.

```js
// src/lines/katana.js: one line added at the end ('whoopsie'), with its language tag
defineLines('katana.drop', ['oops.', 'I meant to do that', 'gravity wins again', 'catch me?!', 'timber!', 'butterfingers', 'おっと', 'опа!', 'whoopsie'], {
  who: 'katana', legacy: 'SAY.kdrop',
  trigger: { title: 'Dropped',
    when: 'You let go of it.' },
  gloss: { 'おっと': 'oops', 'опа!': 'whoops!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'ja', 'bg', 'en'],
});
```

| option | effect |
|---|---|
| `lang` | one tag per line (`'en'`, `'bg'`, `'ja'`), or one string for all, or omitted to detect by script (`langOf`). **Keep the array the same length as the list**: a missing tag counts as `'en'` |
| `gloss` | `{ [line]: 'English meaning' }` for Bulgarian and Japanese lines; the phrasebook prints it on the chip (`JP · meaning`) |
| `trigger` | `{ title, when }`: the phrasebook entry's heading and its "When" text |
| `who` | who says it (defaults to the key's first part) |
| `legacy` | `'SAY.x'`, `'CLAW_SAY.x'`, `'SEV_SAY.x'`, ...: where the list sits in `window.__lines`. The test recorder names a bubble's list from `window.__lines` (`CLAW_SAY.bye`); a list without `legacy` is recorded with key `?` |

**How it shows up**

- `line(key)` picks from `list(key)`: in English-only mode (the default for visitors) that is the `'en'`-tagged lines; a list with no English line falls back to all of it. Tests run with every language (`kiripad-lang = all`).
- The phrasebook (`src/phrasebook/menu.js` `build()`) shows the keys named in `CHAPTERS[].entries`, in that order, with their `trigger`, thinned like `list(key)`. A list with a `legacy` path under `SAY` or `CLAW_SAY` that is not in `CHAPTERS` is still shown, at the end of its chapter, as "New: “name”". Add the key to `CHAPTERS` to show its trigger:

```js
// src/phrasebook/menu.js, in the 'hand' chapter's entries
      'hand.bye',
      'hand.wave',      // the new list, shown with its trigger
      { fig: 'press' },
```

**Say a new list:** the arm: `speak('wave', true)` (from `src/actors/hand/index.js`; key `hand.wave`; its bubble's minimum life
is `TIMING.floor.wave` if you add one); a card or a cut-off hand: `say(o, 'card.x', { force: true })` (`core/speech.js`); a
cut-off hand: `say(o, 'x', true)` from `src/actors/severed/index.js`; at a page point: `sayAt(x, y, 'card.x')`; a toast:
`bus.emit('ui.toast', { msg: line('toast.x') })` (one-line list: no random draw).

**Check:** `node --test tests/unit/*.test.js`; open the phrasebook; try English only (footer button, or `localStorage['kiripad-lang']='en'`).

> Today `tests/unit/lines-data.test.js` pins every list to the text in `scripts/legacy.js` and allows no new multi-line key,
> so any deliberate line change fails it; the strict goldens fail too wherever the changed list is picked. See pitfalls.md
> "Tests that pin today's behaviour".

---

## 2. Change a timing or a tuning number

**File:** `src/core/tune.js` only. `TUNE.<feature>.<NAME>` holds feature numbers (physics, drag, shatter, cut, fx, katana, hand,
severed, shelf, raid, fog, kiri, greeting, surprise, tilt, cards, crazy, speech); `TIMING` holds every bubble life and wait:

| `TIMING.` | what |
|---|---|
| `read` | bubble life from text length: `base + perChar * n + cjk * k`, clamped to `[min, max]` |
| `floor.<kind>` | minimum life of a kind of bubble (`rip`, `eat`, `btn`, `toast`, `flip`, ...) |
| `gap.<who>` | how long a speaker stays quiet (`card` 1400, `katana` 2000, `hand` 2000, `handIdle` 2400, `sev` 2200, ...) |
| `react` | the arm's delay before commenting (`min`, `spread`, `calm`, `flinch`) |
| `wait.<name>` | scene and actor waits (`tease`, `ask`, `hello`, `call`, `yes`, `sevRest`, `book`, ...); `[a, b]` pairs go through `TIMING.span` (one random draw) |

```js
// src/core/tune.js
  gap: { show: 600, after: 500, card: 1400, katana: 2000, ... },   // e.g. card: 1400 -> 1000: cards talk more often
```

Every reader reads the table live (`window.__timing` is the same object), so one edit changes every use. A literal still inside a
function (moved verbatim from legacy, such as the `1.6` in `behaviours/sulk.js`) is lifted into `TUNE` with its value unchanged,
then tuned.

**Check:** the scenarios of the feature. Times are part of the strict goldens, so a changed number fails the scenarios that hit it
(see pitfalls.md "Tests that pin today's behaviour").

---

## 3. Add a behaviour to the arm

**Files:** a new `src/actors/hand/behaviours/<name>.js`; `src/main.js` (import + one `ORDER` entry); `src/core/tune.js` (its
numbers); whatever switches to it (`src/reactions.js`, or another behaviour's `set('<name>')`).

The arm's frame (`tick` in `src/actors/hand/index.js`): pre-chain -> `m.step(dt)` runs the current behaviour's `tick(c, m, dt)`
-> post-chain (agitation, queued line, react queue, flinch, easing towards the target, held card, bubble, draw, sever check).
A behaviour sets the motion target on the frame context `m.x`:

| `m.x.` | meaning |
|---|---|
| `T` | target wrist position `[x, y]`, viewport px (default `[vw + 150, c.ly]`) |
| `rate`, `aim`, `pose`, `wig`, `shake`, `strain` | easing rate, arm angle (rad, `Math.PI` = pointing left), a `POSES` entry, finger wiggle, shake, strain |
| `t`, `dt`, `vw`, `vh` | `now()`, frame seconds, viewport size |
| `P`, `held`, `o` | the pointer `[x, y]` (or null), the loose card you hold (or null), the arm's target `c.o` |
| `NEAR`, `FAR`, `Z`, `HOLD`, `ripE`, `strainE` | distances the legacy branches use (`Z` = `zones(vw)`: `tease`, `edge`, `grab`) |

Flags on the definition replace the legacy state-name tests:

| flag | the hand's tick then |
|---|---|
| `busy: false` | does not keep the frame loop awake (default `true`) |
| `busyUntil: true` | keeps it awake until `c.until` (1.5 s after `set`) |
| `calm: true` | does not sulk when its target disappears |
| `catches: true` | runs the catch scan for cards thrown its way |
| `idle: true` | says queued remarks (`notice`) and leans in to say them |
| `poseRate: n` | pose easing rate (default 12) |
| `uncut: true` | the blade cannot sever it in this state |
| `borrowed: true` | the tick returns at once (the phrasebook drives it) |
| `hold(c, m, x, H)` | runs after the easing with the grip `H` (page px); return true if it moved the held card itself |

The machine also offers `enter(c, m)`, `leave(c, m)` and `on: { 'event.type'(c, ev, m) {} }` (bound only while the state is current).

```js
// src/actors/hand/behaviours/wave.js
// hand state "wave": waves goodbye (the shelf went away), then lurk.
// tick(c, m, dt) sets the motion target on the frame's ctx m.x.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { POSES } from '../poses.js';
import { set, speak } from '../index.js';

export default defineBehaviour('hand', 'wave', {
  pose: 'eager',
  catches: true,   // the catch scan still runs: a card thrown at it now is caught
  enter(c, m) { speak('bye', true); },
  tick(c, m, dt) {
    const x = m.x;
    x.pose = POSES.eager; x.rate = 10; x.wig = 0.3;
    x.aim = Math.PI + Math.sin(m.t * 12) * 0.35; x.T = [x.vw - 60, c.ly];
    if (m.t > TUNE.hand.WAVE_S) set('lurk');
  },
});
export function install(app) {}
```

```js
// src/core/tune.js, in TUNE.hand
    STUMP_S: 8, REGROW_SAY_S: 0.7, REGROW_S: 2.4,
    WAVE_S: 1.2,                      // the goodbye wave after the shelf goes
```

```js
// src/main.js: import it next to the other behaviours, and list it before 'hand' in ORDER
import * as hWave from './actors/hand/behaviours/wave.js';
  ['hStump', hStump], ['hRegrow', hRegrow], ['hSulk', hSulk], ['hBook', hBook], ['hWave', hWave], ['hand', hand],
```

The way in is recipe 5 (`hand.set('wave')` from a reaction). Inside the hand package use `set(name)` (restarts `m.t`, keeps it
busy 1.5 s, wakes the loop, emits `hand.state`) and `speak(kind, force)`. Setting `c.o = card` claims the card for the hand
(`'hand'`, `'target'`); `c.o = null` releases it.

**Check:** lint, stamp, the scenario of recipe 10 (`claw` in `s.state()` is the state name). `tests/unit/hand-behaviours.test.js`
checks the 18 legacy behaviours only and stays green.

---

## 4. Add a behaviour to the severed hand

**Files:** a new `src/actors/severed/behaviours/<name>.js`; `src/main.js` (import + `ORDER`, before `'severed'`);
`src/core/tune.js`; whatever switches to it.

`sevTick` per hand: `m.age(dt)`, held check (switches to `held`), `m.step(dt)` = the behaviour's `tick(o, m, dt)`, then pose
easing towards `TUNE.severed.POSES[def.pose]`, turning, drawing. Scratch lives on `o.ai` (`vx`, `gait`, `hop`, `fd`, `wig`, ...).
`up: true` means it stands on its fingers (the gait's leg spring in step phase `forces`). `busy: false` lets the loop sleep.
`tickNow()` is the frame's `now()`; `m.t` is seconds in the state.

```js
// src/actors/severed/behaviours/cheer.js
// cut-off hand behaviour "cheer": hops on the spot for TUNE.severed.CHEER_S (the shelf came out), then walk.
// ctx (m) gives t; per-hand scratch stays on o.ai.
import { defineBehaviour } from '../../../core/machine.js';
import { TUNE } from '../../../core/tune.js';
import { set, say } from '../index.js';

export default defineBehaviour('sev', 'cheer', {
  pose: 'joy',   // a key of TUNE.severed.POSES
  up: true,      // standing on its fingers (the gait's leg spring works)
  enter(o, m) { const a = o.ai; a.vx = 0; a.gait = 'tiptoe'; say(o, 'rise', true); },
  tick(o, m, dt) { const a = o.ai; a.hop = 0.2 * Math.abs(Math.sin(m.t * 12)); if (m.t > TUNE.severed.CHEER_S) { a.hop = 0; set(o, 'walk'); } },
});
export function install(app) {}
```

```js
// src/core/tune.js, in TUNE.severed
    CHEER_S: 1.5,
// src/main.js
import * as sCheer from './actors/severed/behaviours/cheer.js';
  ... ['sGloat', sGloat], ['sRest', sRest], ['sCheer', sCheer],
// src/reactions.js, in RULES
  ['shelf.opened', () => { for (const o of severed.list) if (severed.brain(o).is('walk')) severed.set(o, 'cheer'); }],   // the cut-off hands cheer
```

`say(o, kind, force)` goes through gate `severed` (`TIMING.gap.sev`, forced `gap.sevForce`). Each switch emits `sev.state`.

**Check:** lint, stamp, a scenario that spawns a hand with `window.__sev.spawn(x, y, 0.3, window.__sev.POSES.limp)` (see
`tests/scenarios/sev.test.js` `world()` and `spawn()`); `o.ai.st` is the state name.

---

## 5. Add a reaction between two features

**File:** `src/reactions.js` only. One line in `RULES`: `[event type, payload => call]`. The listener runs synchronously inside
`bus.emit`, after the emitter's own listeners (reactions are installed after every actor).

```js
// src/reactions.js, in RULES: when the shelf goes and the hand is lurking, it waves (recipe 3)
  ['shelf.closed', () => { const m = hand.brain(); if (m && m.is('lurk')) hand.set('wave'); }],   // the hand waves the shelf goodbye
```

Rules of thumb:

- Call only another feature's exported API (`hand.notice`, `hand.set`, `hand.brain`, `severed.spawn`, `severed.set`, `cards.panic`, `katana.brag`, `toast.show`, ...). Import the module at the top of `reactions.js` if it is not there yet.
- Guard on state: the target may not exist yet (`hand.brain()` is null until the first card is torn), may be in crazy mode (`isCrazy()` from `src/world/world.js`), or absent under reduced motion (actors skip `install`).
- A random draw in a reaction happens at the emit point, before the emitter's next draw: adding one changes every later pick in that scenario (pitfalls.md).
- To wait: `clock.real.after(ms, fn)` (wall time) or `clock.after(ms, fn)` (game time, frozen while the tab is hidden). See the `data.loaded` rule.
- Need to sense another feature every frame instead of reacting to an event? Inject a function, as `install()` does for the shelf: `hand.senses({ shelfSnack: () => shelf.snack(), ... })`.

**Check:** a scenario that makes the event happen (recipe 10). For a quick look: `window.__kiri.bus.emit('shelf.closed', {})` in
the console fakes the event. Run the scenarios of both features: a reaction to an existing event changes existing goldens wherever
that event fires (the `katana.sheathed` scene of recipe 8 makes the strict `sheathe` golden fail at its 6th bubble).

---

## 6. Add an event and emit it

**Files:** `src/core/events.js` (the catalogue), the emitter, [events.md](events.md) (the table).

```js
// src/core/events.js, in EVENTS
  // ---- magnet ----
  'magnet.changed': '{ on } switched on or off (src/actors/magnet.js set())',
```

```js
// the emitter (src/actors/magnet.js)
export function set(v) {
  on = !!v;
  bus.emit('magnet.changed', { on });
  clock.wake();
}
```

- Emit after the emitter's own line and own random draws for the same moment (the actor speaks first, then the world reacts); never rename a type.
- `bus.emit` of a type missing from `EVENTS` throws only on a strict bus: in the page with `?debug`, and in unit tests built with `createBus({ strict: true })`. The scenario suite loads the page without `?debug`, so a typo goes unnoticed there: open the page with `?debug` once.
- Listen: `bus.on(type, fn)` (returns `off`; `'magnet.*'` and `'*'` wildcards work), `bus.once`, a scope's `sc.on(type, fn)` (dies with the scope), or `on: { type(self, ev, m) {} }` in a behaviour (only while that state is current).
- A state change of a machine already emits `<actor>.state` `{ self, from, to, data }` (`hand.state`, `sev.state`).

---

## 7. Add a speaker

A speaker decides who may talk when (the gate), where the bubble goes (layer, anchor) and how long it lives. **File:** the
`install(app)` of the actor that owns it. Lines come from `src/lines/` (recipe 1).

```js
// as src/actors/katana.js does: a body kind that speaks with the card gate, riding above its body
import { defineSpeaker, say } from '../core/speech.js';
import { drawOffset } from '../world/loop.js';

  defineSpeaker('katana', { kinds: ['katana'], prefix: 'katana.', gate: 'card', quiet: TIMING.gap.katana, layer: () => world.layer,
    anchor: (o) => { const p = o.body.getPosition(), a = o.body.getAngle(), [hx, hy] = drawOffset(o), top = Math.abs(Math.sin(a)) * o.w / 2 + Math.abs(Math.cos(a)) * o.h / 2;
      return { x: p.x * S + hx, ax: p.x * S + hx, y: p.y * S + hy - top + TUNE.speech.RIDE_DY }; } });

  say(o, 'katana.hello', { force: true });   // o.kind === 'katana' finds the speaker
```

| option | |
|---|---|
| `kinds` | body kinds that speak as this speaker (`say(self)` finds it by `opts.as` or `self.kind`) |
| `prefix` | keys must start with it, or `say` returns null without drawing |
| `gate` | `'card'` (gap.card, one line per burst, shared death-scream cooldown, `quiet`), `'arm'` (one slot, queue, `flushLater`), `'severed'`, `'plain'` (always), or `fn(self, key, opts, t, sp) -> boolean` |
| `layer` | `() => Element` the bubble is appended to (`world.layer` = `#phys`) |
| `anchor` | `(self, t) -> { x, y, ax }` page px; called in the draw phase for bodies in `world.bodies` |
| `life` | `'game'` (default, `clock.now`), `'wall'`, or `() => number` (own clock; then it never wakes the page loop) |
| `tilt` | `true`: one `Math.random()` per bubble for the lean (after the line's own draw) |
| `cls`, `extraCls`, `tag` | the element's class (keep `'say'`: the test recorder only sees `.say`, `.btn-say`, `.pb-say`), an extra class (`'claw-say'` = recorded as `hand`), the tag |
| `onSaid(self, key, rec)` | after a line went up (the arm emits `hand.said` here) |

For bubbles left at a page point use `sayAt(x, y, key, { as: '<speaker>' })` (default speaker `'page'`, removed on wall time); for a
bubble inside an element, `sayIn(el, key, { text, floor })` (speaker `'button'`).

**Check:** a scenario that makes it talk; `s.said(/some text/)` or `s.said('CLAW_SAY.bye')` (needs a `legacy` path, recipe 1).

---

## 8. Add a scene

A scene is a script that drives the arm (Surprise me, the coin game). **Files:** a new `src/scenes/<name>.js`; `src/main.js`
(import + `ORDER`, with the other scenes); its trigger (`src/reactions.js`, or a DOM listener in its `install`).

The arm's scene API (`src/actors/hand/index.js`): `come(x, y, pose)` -> Promise (state `show`, grip at viewport px),
`to({ x, y, pose, rate, aim, bob, tip, wig })`, `say(kind)` -> ms the line stays up (0: held back), `grip()`, `leave()` (-> `sulk`).
The runner (`src/scenes/scene.js`): `scene(name)` -> `{ sleep(ms), after, every, on, listen, onEnd, fail(fn), kill(), done() }`
on **wall time**; `current()`; a killed scene rejects pending sleeps with `GONE`.

```js
// src/scenes/peek.js
// The hand pops out at the top right when you put the katana back, says something about it, and goes.
// A scene (scenes/scene.js): wall-time sleeps that reject with GONE when the scene is killed; done() in the finally.
import { TIMING } from '../core/tune.js';
import { isCrazy } from '../world/world.js';
import * as hand from '../actors/hand/index.js';
import { scene, current, GONE } from './scene.js';

let app = { reduced: false };

/** run the scene (does nothing while another scene runs, in crazy mode, under reduced motion, or while the hand is busy) */
export async function peek() {
  const m = hand.brain();
  if (app.reduced || current() || isCrazy() || (m && !m.is('off', 'lurk', 'sulk'))) return;
  const my = scene('peek');
  const vw = document.documentElement.clientWidth;
  try {
    await hand.come(vw - 90, innerHeight * 0.3, 'eager');   // state 'show': it goes where the scene says
    await my.sleep(Math.max(TIMING.wait.hello, hand.say('katana')));   // say() returns how long the line stays up (0: held back)
    hand.to({ pose: 'joy', bob: true });
    await my.sleep(600);
  } catch (e) {
    if (e !== GONE) throw e;   // killed: fall through to the tidy-up
  } finally {
    hand.leave();   // 'show' -> 'sulk'
    my.done();      // emits scene.ended, frees current()
  }
}

export function install(a) { app = a; }
```

```js
// src/main.js
import * as peek from './scenes/peek.js';
  ['coin', coin], ['welcomeBack', welcomeBack], ['peek', peek],
// src/reactions.js
import * as peek from './scenes/peek.js';
  ['katana.sheathed', () => peek.peek()],   // the hand comments on the katana going back
```

- `come()` takes the arm whatever it was doing; guard on `hand.brain()` as above. Over the slip, add `app.root.classList.add('hand-show')` (z-index) as `src/scenes/fortune.js` does.
- Scenes may import `page/` (`src/scenes/fortune.js` reads `data()` and `band()` from `src/page/directory.js`) and actors, never `src/phrasebook/`.
- Web Animations (`el.animate`) and CSS animations run on real time even in tests.

**Check:** lint, stamp, a scenario; the trace shows `claw` going `show` -> `sulk`.

---

## 9. Add a whole new actor

**Files:** a new `src/actors/<name>.js` (or `src/actors/<name>/index.js`); `src/main.js` (import + `ORDER`, after `'shelf'` and
before `'reactions'`); `src/core/tune.js` (`TUNE.<name>`); `src/core/events.js` (its events); `src/reactions.js` (how it meets
the others); `src/lines/<name>.js` if it talks (import it in `main.js` with the other line tables).

```js
// src/actors/magnet.js
// The magnet: while it is on, every loose card nobody holds drifts to the left edge of the page.
// install(app): onTick 'late' (which cards it pulls), onStep 'forces' (the pull), hasWork/keepAwake, claims ('magnet', 'pull'),
// world.reset -> off, hook('__magnet', ...). Emits 'magnet.changed' { on }.
import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';
import { clock } from '../core/clock.js';
import { claim, isFree } from '../core/claims.js';
import { hook } from '../core/debug.js';
import { world, isHeld, isCrazy } from '../world/world.js';

const M = TUNE.magnet;
let on = false;
const pulled = new Map();   // body record -> release() of its claim

const unpull = (o) => { const release = pulled.get(o); if (release) { release(); pulled.delete(o); } };

/** once per frame: which cards it pulls (a card someone else holds or claims is left alone) */
function think() {
  if (!on || isCrazy()) { for (const o of [...pulled.keys()]) unpull(o); return; }
  for (const o of world.bodies) {
    const mine = pulled.has(o);
    if (o.kind !== 'card' || o.root || isHeld(o) || o.tug || o.sq) { if (mine) unpull(o); continue; }
    if (!mine && isFree(o)) pulled.set(o, claim(o, 'magnet', 'pull'));
  }
}
/** every physics step: the pull itself (forces are cleared after each world step, so it is applied per step) */
function pull() {
  for (const o of pulled.keys()) o.body.applyForceToCenter({ x: -M.FORCE * o.body.getMass(), y: 0 }, true);
}
const busy = () => on && pulled.size > 0;

/** switch it on or off; emits 'magnet.changed' */
export function set(v) {
  on = !!v;
  bus.emit('magnet.changed', { on });
  clock.wake();
}
export const isOn = () => on;

export function install(app) {
  if (app && app.reduced) return;   // no physics under reduced motion
  clock.onTick(think, 'late');
  clock.onStep(pull, 'forces');
  clock.hasWork(busy);
  clock.keepAwake(busy);
  bus.on('body.removed', ({ body }) => unpull(body));
  bus.on('world.reset', () => { if (on) set(false); });
  hook('__magnet', { set, isOn });
}
```

```js
// src/core/tune.js
  // ---- the magnet ----
  magnet: { FORCE: 30 },   // m/s² towards the left wall
// src/main.js
import * as magnet from './actors/magnet.js';
  ['severed', severed], ['shelf', shelf], ['magnet', magnet],
```

Checklist for an actor:

| piece | how |
|---|---|
| per-frame work | `clock.onTick(fn, 'late')` (`fn(dt, ms)`); physics forces in `clock.onStep(fn, 'forces')` (per 1/240 s step) |
| keep the loop running | `clock.hasWork(fn)` (may start / run a frame) and `clock.keepAwake(fn)` (ask for the next); call `clock.wake()` when you create work |
| bodies | `add(...)` / `remove(o)` from `src/world/world.js`; listen to `body.removed` to forget yours |
| who holds a body | `claim(o, owner, why)` -> `release()`; ask `isFree(o)`, `holder(o)`, `heldBy(o, owner, why)` before taking one. The pointer is `world.grab` / `isHeld(o)`; the arm's tug is `o.tug`, the severed squeeze `o.sq`, a rooted card `o.root` |
| talk | `defineSpeaker` (recipe 7) and `src/lines/<name>.js` (recipe 1) |
| reset | `bus.on('world.reset', ...)` (emitted before the bodies are removed) |
| modes | return from `install` when `app.reduced`; do nothing while `isCrazy()` |
| test hook | `hook('__name', value)` from `src/core/debug.js` (name matches `/^__[a-z]+$/`); `window.__kiri` already exposes `bus`, `clock`, `lines` |
| other actors | never import them: emit an event, wire it in `src/reactions.js` |

`report(name, fn)` (world) only feeds the fixed fields of `__cards.state()` (`found`, `katana`, `claw`, `shelf`): the test recorder
does not see a new actor's state. Assert on your own hook in scenarios instead (`window.__magnet.isOn()`).

**Check:** lint (an import of another actor fails it), stamp, a scenario (the magnet's: rip a card, let it settle,
`window.__magnet.set(true)`, run 1.5 s, the card's x went down by more than 50 px).

---

## 10. Add a scenario test and record its golden

**Files:** `tests/scenarios/<group>.test.js` (groups: `arm`, `katana`, `page`, `phrasebook`, `scenes`, `sev`, `shelf`, `world`),
`tests/golden/<group>/<slug of the name>.json` (written by the harness).

```js
// tests/scenarios/arm.test.js (G = 'arm', O = { idle: 3000 } are defined at the top of the file)
scenario(G, 'waves when the shelf goes', { ...O, golden: false }, async (s) => {
  await s.ensurePlanck();
  await s.rip(0);
  await s.run(300);
  await s.up();
  await s.runUntil(() => window.__cards.state().claw.st === 'lurk', null, { max: 5000 });
  await s.type('tana'); await s.run(100);
  await s.type('tana'); await s.run(100);
  assert.equal((await s.state()).claw, 'wave', 'the shelf went: it waves');
  assert.ok(await s.said('CLAW_SAY.bye'), 'and says bye');
  await s.run(1500);
  assert.equal((await s.state()).claw, 'lurk', 'then back to lurking');
});
```

Options (third argument): `seed` (default 1), `rand` (a constant `Math.random`), `idle` (ms after load), `viewport`,
`colorScheme`, `reducedMotion`, `session` / `local` (storage, e.g. `local: { 'kiripad-lang': 'en' }`), `query`, `golden: false`,
`skip`, `timeout`.

Session helpers (`tests/helpers/harness.js`): time `run(ms, step)`, `runUntil(fn, arg, { max, step })`, `real(ms)`; input
`move`, `down`, `up`, `line`, `path`, `pull(i, dx, dy)`, `rip(i)` (button stays down), `throwTo`, `press(sel)`, `key(k)`,
`type(text)`, `scrollTo(y)`; reads `state()` (`claw`, `sev`, `pb`, `kat`, `shelf`, `grab`, `objs`), `said(key | RegExp)`,
`bubbles()`, `texts()`, `eval(fn, arg)`, `box(sel)`; randomness `rand(v)`, `randQueue(...v)`; `ensurePlanck()`.

**Recording the golden.** After the scenario passes, the harness compares the recorded trace (every bubble with time, life, list
key and text; every change of `claw`, `sev`, `pb`, `kat`, `shelf`, `grab`, `objs`) with the golden file. `UPDATE_GOLDEN=1` writes
goldens **only on the legacy run** (`if (UPDATE && !NEXT)` in `tests/helpers/harness.js`):

| the scenario covers | do |
|---|---|
| behaviour legacy also has | `UPDATE_GOLDEN=1 ONLY="name" npm run test:legacy`, then `ONLY="name" npm test` must pass strictly on the modules |
| new behaviour (modules only) | `golden: false` and assert what matters (as above). A golden for it needs the harness to record with `NEXT=1` (open item, pitfalls.md) |

Commit the new golden file with the test. `UPDATE_GOLDEN=1 npm test` (modules) does not write anything: it fails with
"no golden trace ... record it on legacy".

**Check:** `ONLY="waves when the shelf goes" npm test` -> 1 pass.

---

## Verified

Applied to a copy of this tree (then thrown away; nothing of it is committed):

| recipe | result |
|---|---|
| 3 + 5 + 10: `wave` behaviour, `shelf.closed` rule, scenario `waves when the shelf goes` | lint ok, stamp ok, unit tests ok, scenario passes on the modules (8 s) |
| 4: `cheer` behaviour, `shelf.opened` rule, scenario with `__sev.spawn` | scenario passes |
| 6 + 9: `magnet` actor, `magnet.changed` event, `TUNE.magnet` | lint ok, scenario passes (card drifts left > 50 px) |
| 8: `peek` scene on `katana.sheathed` | scenario passes (`show` -> `sulk`, `CLAW_SAY.katana` said); the existing strict `sheathe` golden then fails, as expected |
| 10, recording: an existing-behaviour scenario (`second card pulled and let go`) | recorded with `UPDATE_GOLDEN=1 ... npm run test:legacy`, passes strictly with `npm test`; `UPDATE_GOLDEN=1 npm test` writes nothing |
