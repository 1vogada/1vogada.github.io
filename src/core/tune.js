// Every number that tunes a feature, grouped by feature, with the legacy values unchanged.
// TIMING is the legacy timing table from index.html (window.__timing), moved here verbatim with its helpers.
// Rule: a number that changes how something feels lives here, never at the call site. Formula literals inside a moved
// function (a 0.35 in a blend, a 2.4 in a push) move with their function verbatim; a later package may lift one into TUNE,
// never change its value.
// Pure data: no DOM access at import time, so this file loads in plain node.

const PI = Math.PI;

export const TUNE = {
  // ---- the physics world (legacy cardPhysics constants) ----
  physics: {
    S: 100,              // px per metre
    DT: 1 / 240,         // fixed step, s
    VELOCITY_ITERS: 10, POSITION_ITERS: 6,
    MAX_FRAME_MS: 250,   // one frame's elapsed time is clamped to this (tab switches)
    GRAVITY: 85,         // m/s²
    FALL: 0.25,          // gravity scale of free bodies; a held body gets 1
    SPIN: 0.5, HELD_SPIN: 3,     // angular damping free / hanging from the hand
    LINEAR_DAMPING: 0.05,
    CARD: { density: 1, friction: 0.7, restitution: 0.06 },
    WALL: { thickness: 5, friction: 0.8, category: 3 },
    HOT: 9,              // m/s release speed that counts as a throw
    HOT_MS: 1500,        // a thrown body stays "hot" (can smash, is a bullet) this long
    SMASH: 13,           // m/s closing speed a throw needs to shatter
    LAND: 5,             // m/s closing speed for a "land" line
    MAX_FORCE: 4000,     // mouse joint maxForce per kg
  },
  // ---- rooted cards and the pointer ----
  drag: {
    STRAIN: 1.6, RIP: 3.5,               // m of hand stretch: start losing grip / tear at once
    ROOT_HZ: 14, ANGLE_HZ: 9,            // root spring, root torque spring
    PULL_HZ: 7, PULL_DAMPING: 0.8,       // hand while rooted
    HAND_HZ: 60, HAND_DAMPING: 1,        // hand once free
    TWIST: 1.1,                          // rad of twist that tears
    GRIP_DRAIN: [0.4, 2], GRIP_RECOVER: 0.7, GRIP_RECOVER_FREE: 1,
    ROOT_GIVE: [0.45, 0.55],             // spring strength = a + b * grip
    ROOT_DAMP: 0.6, ANGLE_DAMP: 0.7, SHAKE_TORQUE: 900,
    SETTLE: { dist: 0.004, angle: 0.004, v: 0.05, w: 0.05 },
    MOVE_PX: 4,                          // pointer travel that starts a pull / counts as moved
    TOUCH_ARM_MS: 200, TOUCH_CANCEL_PX: 10, VIBRATE_MS: 12,
    THROW_WINDOW_MS: 80, THROW_SPAN_MIN_MS: 8, THROW_FRESH_MS: 40, THROW_MAX: 60,
    HISTORY: 12,
    HELD_SNAP_PX: 24, HELD_FADE_PX: 40,  // draw offset of the held body: full under 24 px, gone 40 px later
    EDGE_PX: 44, EDGE_WAIT_MS: 350, EDGE_RATE: 0.35,
  },
  // ---- impacts ----
  shatter: {
    MIN_AREA: 90, MIN_EDGE: 3, CHUNK_AREA: 3000,
    RINGS: [0, 0.3, 0.62, 1], PERIM_STEP: 130, POINTS: [3, 9],
    PIECE: { friction: 0.6, restitution: 0.12 },
    SHARD: { friction: 0.5, restitution: 0.2, filterGroupIndex: -1 },
    SHARD_LIFE: [4200, 1800],
    BLAST_RADIUS: 8, BLAST: 0.35, PASS: 0.6,
    SAY_DY: -20,
  },
  // ---- the blade ----
  cut: {
    TIP: [15, 146], TRAIL_SPEED: 700, TRAIL_MS: 280,
    MIN_THROUGH: 24, MIN_CUT: 4,
    VALID: { minVerts: 3, maxVerts: 10, minArea: 150, minEdge: 3 },
    PIECE_LIFE: [2500, 1200], PUSH: 2.4, STROKE_PUSH: 1.6,
    SCREAM_GAP: 700,                      // ms between "cutting" screams
    WOUND_LIFE: [2400, 1200], DRIP_MS: [70, 90],
    SAY_DY: -34,
  },
  // ---- particles ----
  fx: { GRAVITY: 2600, SPRAY: 4, SHAKE_CLASS: 'shake' },
  // ---- the katana ----
  katana: {
    REST: 190,                 // px the planted katana sits below its box
    EQUIP_ANGLE: PI + 0.5,
    GRIP_LOCAL: [0, -1.05],    // m, where an equipped katana is held
    REVEAL_RADIUS: 120, REVEAL_TRAVEL: 260, REVEAL_DY: 50,
    HILT: { density: 2.6 }, BLADE: { density: 1.6 }, PART: { friction: 0.6, restitution: 0.1 },
    CATEGORY: 4, MASK_LOOSE: 2,
  },
  // ---- the arm and its hand (the claw) ----
  hand: {
    GRIP: [98, 20],
    FING: [{ b: [58, -27], a: -0.36, l: [44, 33, 25], w: 12 }, { b: [66, -11], a: -0.13, l: [52, 38, 27], w: 13 }, { b: [64, 5], a: 0.09, l: [46, 34, 24], w: 12 }, { b: [56, 19], a: 0.32, l: [35, 26, 19], w: 10 }],
    THUMB: { b: [14, 22], a: 1.1, l: [36, 30, 23], w: 13 },
    BEND: [0.3, 1.05, 0.85], ARCH: [-0.3, 0.2, 0.24],
    PALM: [[-8, -15], [18, -25], [56, -33], [72, -12], [70, 14], [58, 27], [30, 30], [8, 27], [-8, 14]],
    EYE: [36, -2],
    POSES: {
      lurk: { curl: 0.5, th: 0.4, spread: 0.75, eye: 0.3, pupil: 0.6, happy: 0, point: 0, pinch: 0 },
      eager: { curl: 0.12, th: 0.05, spread: 1.4, eye: 1.25, pupil: 1.25, happy: 0, point: 0, pinch: 0 },
      lunge: { curl: -0.12, th: -0.15, spread: 1.7, eye: 1.45, pupil: 0.6, happy: 0, point: 0, pinch: 0 },
      clamp: { curl: 0.82, th: 0.85, spread: 0.45, eye: 0.8, pupil: 0.8, happy: 0, point: 0, pinch: 0 },
      strain: { curl: 0.95, th: 1, spread: 0.3, eye: 0.3, pupil: 0.45, happy: 0, point: 0, pinch: 0 },
      joy: { curl: 0.82, th: 0.85, spread: 0.5, eye: 1, pupil: 1, happy: 1, point: 0, pinch: 0 },
      sulk: { curl: 0.95, th: 0.55, spread: 0.2, eye: 0.2, pupil: 0.5, happy: 0, point: 0, pinch: 0 },
      point: { curl: 0.95, th: 0.9, spread: 0.5, eye: 1.2, pupil: 0.7, happy: 0, point: 1, pinch: 0 },
      pinch: { curl: 0.95, th: 0.62, spread: 0.5, eye: 0.55, pupil: 0.7, happy: 0, point: 0, pinch: 1 },
      snapped: { curl: 0.95, th: 0.1, spread: 0.5, eye: 1.2, pupil: 0.9, happy: 0, point: 0, pinch: 0.45 },
    },
    OFF_X: 340,                       // px past the right edge where it waits when off
    LURK_X: 150, SET_UNTIL_MS: 1500,  // clawSet keeps it busy this long
    CRUSH_Q: [[0, 0], [0.8, 0.28], [1.7, 0.32], [2.5, 0.56], [3.7, 0.6], [4.3, 0.84], [5.0, 0.87], [5.18, 1]], CRUSH: 5.18,
    CRUSH_PAUSES: [[0.8, 1.7], [2.5, 3.7], [4.3, 5.0]],
    STUMP_S: 8, REGROW_SAY_S: 0.7, REGROW_S: 2.4,
    AGIT_MAX: 6, AGIT_DECAY: 0.6, REACT_TTL_MS: 6000,
    COOL: { slip: 2500, reach: 800, catch: 600, toss: 1200, gloat: 1200, eat: 1800, regrow: 1500, grab: 1500 },
    JOINT_HZ: 30,
    SEVER_PX: [13, 16], SEVER_STEP: 8,
    CATCH_CHANCE_CRUSH: 0.3, REACH_CHANCE_CRUSH: 0.4, SNATCH_CHANCE: 0.5, SNATCH_AGAIN: 0.6, TOSS_HARD: 0.3,
    ZONES: { maxW: 1080, gutter: 16, col: 306, narrow: 0.4, grabMin: 220, grabFrac: 0.4 },
  },
  // ---- cut-off hands ----
  severed: {
    MAX: 3,
    BODY: { w: 104, h: 92, hw: 0.4, hh: 0.28, density: 1.3, friction: 0.9, restitution: 0.05, damping: 2.5 },
    HURT_MS: 7500,
    TURN: 0.42,
    NEXT: { 0: [1, 4], 1: [0, 2], 2: [1, 3], 3: [2], 4: [0] },
    GAIT: {
      tiptoe: { hh: 1.5, speed: 1.25, lean: 0.07, step: 62, lift: 24, swing: 0.2, bob: 0.05, home: { 0: 12, 1: -12 } },
      sneak: { hh: 1.2, speed: 0.6, lean: 0.24, step: 44, lift: 46, swing: 0.4, bob: 0.02, home: { 0: 16, 1: -10 } },
      scuttle: { flat: true, hh: 0.52, speed: 2.4, lean: 0.06, step: 50, lift: 13, swing: 0.11, bob: 0.03, home: { 0: 104, 1: 86, 2: 66, 3: 46, 4: 2 } },
      run: { flat: true, hh: 0.6, speed: 4.4, lean: -0.14, step: 74, lift: 20, swing: 0.07, bob: 0.07, home: { 0: 110, 1: 90, 2: 68, 3: 46, 4: -4 } },
      crawl: { flat: true, drag: true, hh: 0.3, speed: 1.5, lean: 0, step: 64, lift: 9, swing: 0.3, bob: 0, home: { 0: 122, 1: 104 } },
    },
    POSES: {
      limp: { curl: 0.55, th: 0.5, spread: 0.8, eye: 0.12, pupil: 0.4, happy: 0, point: 0, legs: 0 },
      walk: { curl: 0.9, th: 0.95, spread: 0.5, eye: 1.15, pupil: 1, happy: 0, point: 0, legs: 1 },
      sneak: { curl: 0.9, th: 0.95, spread: 0.5, eye: 1.45, pupil: 0.45, happy: 0, point: 0, legs: 1 },
      run: { curl: 0.9, th: 0.95, spread: 0.5, eye: 1.5, pupil: 0.35, happy: 0, point: 0, legs: 1 },
      crawl: { curl: 0.6, th: 0.5, spread: 0.7, eye: 0.3, pupil: 0.5, happy: 0, point: 0, legs: 0.45 },
      held: { curl: 0.25, th: 0.2, spread: 1.3, eye: 1.4, pupil: 0.5, happy: 0, point: 0, legs: 0 },
      grip: { curl: 0.7, th: 0.75, spread: 0.6, eye: 0.9, pupil: 0.8, happy: 0, point: 0, legs: 0 },
      fist: { curl: 1.1, th: 1.05, spread: 0.3, eye: 0.35, pupil: 0.45, happy: 0, point: 0, legs: 0 },
      joy: { curl: 0.9, th: 0.95, spread: 0.5, eye: 1, pupil: 1, happy: 1, point: 0, legs: 1 },
      rest: { curl: 1, th: 1, spread: 0.3, eye: 0.06, pupil: 0.4, happy: 0, point: 0, legs: 0 },
    },
    LOOK_MS: 250, SEE_PX: 520, FLEE_PX: 280, FLEE_MS: 2200, EDGE_PX: 70, CRAWL_EDGE_PX: 90,
    TURN_MS: [2500, 4000], TIRED_MS: [14000, 9000], STROLL_TURN_MS: [2500, 5000], STUCK_TURN_MS: [2000, 3000],
    CRUSH_S: 3.2, CRUSH_COOL: 5000, FOOD_COOL: 2500, LOSE_COOL: 1500,
    REST_WAKE_MS: [7000, 7000],
    LEG: { force: 520, damp: 42, cap: 170, walk: 14, drag: 30, torque: 900, torqueDamp: 54 },
  },
  // ---- the secret shelf ----
  shelf: { MAX_W: 260, W_FRAC: 0.42, CLEAR_PX: 250, TOP: 140, BOTTOM: 160, VIEW: 0.56, VIEW_BOTTOM: 70, FRICTION: 0.9, NEAR: [120, 60, 380, 80], EYE_MS: 700 },
  // ---- the hand in the phrasebook menu (its own little world in viewport px) ----
  raid: { S: 100, DT: 1 / 240, GRAV: 85, FALL: 0.25, SMASH: 13, GRIP: [98, 20], ARM_TICK_MS: 250, CARD_TTL_MS: 6000 },
  // ---- page ----
  fog: { REGROW_S: 12, BLOBS: 14, WIPE_STEP: 10, WIPE_R: [46, 0.14], HINT_PX: 400, DPR_MAX: 1.5 },
  kiri: { FLOOD_IN_S: 2.4, FLOOD_HOLD_S: 14, FLOOD_OUT_S: 4, BLOBS: 16, EDGE: 180, MASK_SCALE: 0.5, MASK_MAX: 4096 },
  greeting: { TYPE_MS: 85, HOLD_MS: 2200, ERASE_MS: 40, PAUSE_MS: 260 },
  surprise: { STEPS: 14, STEP_MS: 40, STEP_GROW: 1.6, ASK_DELAY_MS: 700, WELCOME_MS: 900, PAGESHOW_MS: 600 },
  tilt: { DEG: 7, BAND_PX: 26, ROLL: 60 },
  crazy: { TITLE_MS: 180 },   // ms per character of the scrolling tab title
  speech: {
    TILT: [4, 4],                // every bubble leans right by 4 + up to 4 degrees
    RIDE_DY: -40,                // a body's bubble sits this far above the top of its rotated box
    ARM: { dx: -30, dy: -115, minY: 70, maxX: 80 },
    AGONY_GAP: [1500, 950],      // cardSay: no new line within 1500 - 950 * pain ms unless the tier rises
    AGONY_TIERS: [0.3, 0.62],
    EDGE: 6, APART: 10, APART_HOLD: 34, APART_TOUCH: 4, STACK: 16, DODGE: 10, DODGE_GAP: 14, TAIL: 14, LEAN_GROW: 0.07,
    BUTTON_EXTRA_MS: 100,
  },
};

// ---- timing: how long every speech bubble stays up, how long anyone waits before speaking again, and how long you get to answer ----
// All in ms of real time. Change the numbers here, never at the call sites. (Verbatim from index.html, PR 80/81.)
export const TIMING = {
  read: { base: 600, perChar: 65, cjk: 220, min: 1300, max: 3500 },
  floor: { rip: 1900, eat: 1600, help: 2400, hide: 1900, btn: 2600, hand: 1500, toast: 2400,
           flip: 4000, rematch: 4000, yourpick: 4000, callit: 3500, ask: 4000, waiting: 2600 },
  gap: { show: 600, after: 500, card: 1400, katana: 2000, scream: 2000, hand: 2000, handIdle: 2400, handLate: 1200, sev: 2200, sevForce: 900, notme: 2600, raid: 1300, raidAsk: 2900 },
  react: { min: 700, spread: 2100, calm: 0.65, flinch: 1500 },
  wait: {
    tease: [1400, 2200], teaseAgain: [1200, 2000],
    ask: 7000,
    secret: 350,
    hello: 2200, back: 2500,
    better: 2100,
    callNag: 4000, call: 9000,
    result: 1800, verdict: 2100,
    yesNag: 2400, yes: 5000,
    escaped: 1700,
    sevRest: 15000,
    book: 5000, help: 8000,
  },
};
// Japanese and Chinese characters carry about a word each, so they take cjk ms instead of perChar
TIMING.ms = (text, floor) => { const r = TIMING.read, t = String(text), k = (t.match(/[぀-鿿]/g) || []).length, n = [...t].length - k; return Math.max(floor || 0, Math.min(r.max, Math.max(r.min, r.base + r.perChar * n + r.cjk * k))); };
// [at least, plus up to] -> one random wait (one Math.random draw)
TIMING.span = ([a, b]) => a + Math.random() * b;
// gives a bubble its life: the fade in its CSS runs for the same time (var --say), and the time is returned for whoever removes it
TIMING.talk = (el, floor) => { const ms = TIMING.ms(el.textContent, floor); el.style.setProperty('--say', ms + 'ms'); return ms; };

export function install() {}
