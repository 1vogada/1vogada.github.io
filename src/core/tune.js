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
    TEETH: true, ONE_TUG: 0.75, EASE: 0.9, // a card comes out like a tooth: on its first tug (ONE_TUG of the cards) or its second; a tug is holding the strain until
                                         // the grip runs out, and the pull must ease under EASE m before the next one counts. Past RIP before that it tears in two
    LOOSE_GIVE: 0.2, LOOSE_GRIP: 0.5,    // each tug it has given makes the root spring this much softer; the grip it has left right after giving
    LOOSE_TILT: 1.3,                     // deg a loosened card sits crooked in its slot, per tug
    SNAP_KEEP: 0.3,                      // a card yanked in two: neither half is under this share of its length
    STRETCH: [0.5, 1.4], STRETCH_S: 0.32, // a rooted card stretches toward your hand from STRETCH[0] m of pull, fully by STRETCH[1]; a yank takes STRETCH_S s to tear it
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
    SEW: { AFTER_S: 1.2, OUT_PX: 90, RATE: 4, PX: 80, PALM_PX: 35, HZ: 6, S: 1.4, SAY_S: 0.5, SHOW_S: 2.6 },   // sew it back on: carry an old hand while it is a stump and the stump comes out (after AFTER_S, its wrist OUT_PX in from the edge); drop the old hand's palm within PX of where its palm belongs (PALM_PX past the wrist) and it is pulled on (joint HZ) for S; then it shows it off, says so after SAY_S, lurks after SHOW_S
    AGIT_MAX: 6, AGIT_DECAY: 0.6, REACT_TTL_MS: 6000,
    COOL: { slip: 2500, reach: 800, catch: 600, toss: 1200, gloat: 1200, eat: 1800, regrow: 1500, grab: 1500, small: 4000 },
    PIECE_BIG: 0.25,     // a piece of a card with at least this share of the card's area gets everything a whole card gets; smaller scraps it rejects
    SWAT: [-22, -9],     // m/s it bats a small piece back with
    JOINT_HZ: 30,
    SEVER_PX: [13, 16], SEVER_STEP: 8,
    CATCH_CHANCE_CRUSH: 0.3, REACH_CHANCE_CRUSH: 0.4, SNATCH_CHANCE: 0.5, SNATCH_AGAIN: 0.6, TOSS_HARD: 0.3,
    ZONES: { maxW: 1080, gutter: 16, col: 306, narrow: 0.4, grabMin: 220, grabFrac: 0.4,
      cardMaxFrac: 0.45, teaseCards: 2, teaseMaxFrac: 0.6 },   // the tease zone is teaseCards cards wide (so it starts left of the catch zone, past the GitHub link), never more than teaseMaxFrac of vw   // Ivo 2026-11-25: tease and catch zones are each one card wide from the right edge (never more than this share of vw: on a phone a card is the whole screen)
    NEAR: [190, 0.28],                // a held card this close to the right edge (px, or this share of vw if less) gets lunged at and pulled
    SNATCH_REACH: [440, 0.36],        // it only snatches a card this close to the right edge (px, or share of vw); further away it just sulks
    JEALOUS: { MS: 5000, LEAN_MS: 2600, LEAN_PX: 150, COOL_MS: 30000 },   // you carry an old hand this long: the arm leans in, drumming its fingers, and says so
    SQUEEZE: { W: 520, SX: 0.4, RATE: 6, SAY_MS: 6000 },   // window narrower than W px while the hand is out: it is pressed flat (sx), complains every SAY_MS
    IDLE: { MS: 10000, CREEP_S: 2.6, GIVE_UP_S: 9, COOL_MS: 30000 },   // "are you still there?": mouse still this long (Ivo: 10 s), creep, give up, not again for
    CIRCLE: { WINDOW_MS: 1000, TURNS: 0.75, R_MIN: 20, R_MAX: 420, HOLD_MS: 700, EYE_PX: 5 },   // the mouse going round in circles: the last WINDOW_MS of it winds TURNS times round its middle, R_MIN..R_MAX px out; eyes follow it for HOLD_MS after, the pupil up to EYE_PX off centre
    SHOWN_PX: 40,                     // the arm counts as out (the old hands may play the mirror game) while its wrist is within this many px past the right edge
    OLD: {                            // the new hand and the old (cut-off) one
      SEE_BOTTOM: 60,                 // ...and may be this far below the bottom edge (it is 92 px tall: the top of it still shows)
      SEE: [40, 40],                  // the old hand is "in view" when its palm is this far inside the left and top of the viewport (x, y px)
      NOTICE_MS: 1500,                // an old hand it has not met must be in view this long before it leans out
      MEET_S: 2.4,                    // it leans out and looks for this long
      REACH: [380, 0.4],              // it only goes for an old hand this close to the right edge (px, or share of vw)
      GRAB_PX: 52, REACH_S: 1.8,      // grip this close = got it; gives up after this long
      HOLD_S: 1.6, LIFT_PX: 90,       // then it lifts it up and shakes it for this long (your chance to take it back)
      DRAG_RATE: 1.4,                 // and drags it off the edge this slowly (easing rate; a card it eats goes at 5)
      DIGEST_MS: 20000,               // full after eating one: no second helping for this long
      THIEF_MS: 7000,                 // after the old hand crushes a card, it may be eaten while awake for this long
      COOL: 2500,                     // after it lost its old hand to you
      AWAKE: 0.35, ROLL_MS: 8000,     // a walking old hand it has met, in reach: it goes for it anyway with this chance, rolled once per old hand per ROLL_MS (it plays dead)
      PAPER: { MS: 2000, GRAB_PX: 44, REACH_S: 1.4, RATE: 9, PAUSE_S: 0.9, THINK_S: 1.8, EAT: 0.5, BACK_PX: 340, BACK_S: 1.2, COOL_MS: 8000 },   // not paper: an old hand held in the tease zone this long is taken for a card; got it this close, gives up after REACH_S; looks, says so after PAUSE_S, decides at THINK_S (eats it with chance EAT), else carries it BACK_PX in from the edge and lets go after BACK_S; leaves you alone for COOL_MS
      PROD: { HOVER_PX: 60, RATE: 6, POKE_S: [1.6, 2.5], POKE_LEN: 0.28, TWITCH: 0.4, CAUGHT_S: 0.5, DONE_S: 3.6, COOL_MS: 9000 },   // poking the one playing dead: hovers this far off it, pokes at these times (s) for POKE_LEN each, a poke makes it twitch with this chance; caught out: grabs it after CAUGHT_S; no twitch: gives up after DONE_S, leaves it alone for COOL_MS
    },
    CHEESE: {                         // the cheese pull: an old hand jumps on the card it drags off the shelf, and both pull
      TEAR_PX: 230,                   // the card tears once it is stretched this far past its own length
      OVER: 1.3, PULL_S: 3.2,         // how far they pull apart (times TEAR_PX), over how long (it tears on the way)
      JERK_PX: 26, JERK_W: 6,         // the pulling comes in surges: this many px, this fast (rad/s)
      ARM_SHARE: 0.6,                 // the arm's share of the pulling (the old hand gets the rest)
      SAG_PX: 40,                     // both sag this much while they strain
      EDGE_PX: 40,                    // the old hand cannot be pulled further left than this (page px from the left edge)
      MAX_S: 5,                       // it tears by now whatever happens
    },
    WREST: {                          // tug of war over a card: an old hand crushes a card near the right edge, the arm grabs the other end
      CHANCE: 0.35,                   // share of crushes it goes for (rolled once per crush, only when it could: lurking, met, in reach)
      WAIT_S: 0.35,                   // it eyes the crush this long before it lunges
      RATE: 9, GRAB_PX: 40, REACH_S: 1.4,   // how fast it reaches; grip this close to the card's end = got it; gives up after this long
      END_PX: 22,                     // it takes the card this far in from its end (and the old hand moves to this far in from the other)
      TEAR_PX: 210,                   // the card tears once it is stretched this far past its own length
      OVER: 1.3, PULL_S: 4.2,         // how far they pull apart (times TEAR_PX), over how long (it tears on the way)
      JERK_PX: 34, JERK_W: 5,         // the pulling comes in surges: this many px, this fast (rad/s)
      ARM_SHARE: 0.55,                // the arm's share of the pulling (the old hand gets the rest)
      SAG_PX: 26,                     // both sag this much while they strain
      EDGE_PX: 40,                    // the old hand cannot be pulled further left than this (page px from the left edge)
      MAX_S: 6.5,                     // it tears by now whatever happens
      HIT_PX: 58,                     // a click this close to the arm's hand or forearm (px) makes it slip
      COOL: 6000,                     // after it slipped and lost the card: it leaves cards alone this long (game ms)
    },
    TOWER: {                          // the hand tower (TUNE.severed.TOWER): the arm leans in to look, is pulled out, shakes them off
      PEER_DX: 14, PEER_DY: 34,       // it brings its grip this far right of and above the top one's fingertips
      PEER_AIM: 2.2,                  // pointing down and to the left (rad) as it looks
      PEER_RATE: 2.4, PEER_MAX_S: 14, // slowly; and gives up looking after this long whatever happens
      PULL_S: 3.4,                    // they drag it out onto the page over this long
      TO: [0.38, 240],                // its grip ends up this share of the window's width from the left (at least this many px)
      DROP_PX: 120,                   // and this much lower
      FLOOR_PX: 150,                  // never closer than this to the bottom of the window
      JERK_PX: 34, JERK_W: 5,         // each heave: this many px, this often (rad/s)
      RATE: 4,                        // how fast its wrist follows being dragged (easing rate)
      FLAIL: 0.45, FLAIL_W: 9,        // its hand flails this much (rad), this fast
      SHAKE_S: 1.6, SHAKE_PX: 46, SHAKE_W: 31,   // then it shakes them off: this long, this hard, this fast
      SULK_MS: 9000,                  // and sulks out of sight this long
      SAY_MS: 1400,                   // its first line while being dragged, then unforced ones
    },
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
    PAINT: { MS: 120000, DRAW_MS: 4200, FADE_MS: 60000, SIZE_PX: 34 },   // left alone this long, an old hand finger-paints a word in its own gore, writing for DRAW_MS; the word fades after FADE_MS
    AVENGE: { SEE_PX: 600, GRAB_PX: 40, GRAB_DY: 140, EDGE_PX: 170, HAUL: 0.55, PUFF_S: 2.5, THROW: [9, -26], SPIN: -14, GIVE_UP_S: 25,   // revenge: sees the katana, takes the hilt, hauls it this slow, throws it (m/s) at the arm from EDGE_PX in from the right edge
      WAIT_MS: 4000, FIVE_AFTER_MS: 1600, FIVE_PX: 95, FIVE_S: 1.4, FIVE_GIVE_UP_S: 10, HOP: 3.5 },   // then: the high-five, after the new old hand has landed
    MOURN: { EDGE_PX: 150, NEAR_PX: 60, WALK_S: 9, SAY_S: 1, BOW_S: 3.2, RUN_MS: 3000 },   // the funeral: where (px in from the right edge), how close, give up walking, words, bow, run
    HIDE: { S: 12, LAUNCH_PX: 80, LAND_PX: 70, CLEAR_PX: 40, IN_PX: 30, MAX_DY: 650, UP_PX: 130, LEAP_S: 1.8, TRIES: 3, STUCK_S: 0.6, COWER_S: 14 },   // hiding on the shelf: give up, jump this far over it, at most this far below it
    MIRROR: { DELAY_MS: 450, POSE_RATE: 9, SIT_RATE: 4, SAY_S: 1.1, LINGER_S: 1.2, MAX_S: 14, COOL_MS: 12000, KNOCK: 1.5 },   // the mirror game: copies the arm's pose this late, eases to it, sits up; says its line; gives up when the arm has gone this long, after MAX_S, or when knocked; not again for COOL_MS
    DEAD: { FLOP_VY: -3.2, ANGLE: -1.4, ROLL_S: 1.2, ROLL_RATE: 6, TWITCH_MS: 260, TAP_S: 0.35, UP_S: 2.5, RUN_MS: 3500, HOP: [-1.6, -4.5],
      POSE: { curl: 0.75, th: 0.7, spread: 1.15, eye: 1, pupil: 0.5, happy: 0, point: 0, legs: 0, dead: 1 } },   // (its pose is kept out of POSES: X eyes in draw.js, fingers in the air)   // playing dead: the hop as it flops, the angle it rolls to (fingers up) over ROLL_S; a twitch shows this long; a press shorter than TAP_S is a tap; up again UP_S after the arm left; then it runs this long (the spring: m/s)
    STARE_S: 2.6, STARE_SAY_S: 0.9,   // the old hand stares back at the new one, says its line after this long
    HITCH: {                          // the hitchhiker: you pick up a card or a piece near an old hand, and it jumps on and dangles from it
      CHANCE: 0.1,                    // share of pick-ups near an old hand that it latches on to (Ivo: 10%)
      NEAR_PX: 170,                   // "near": the old hand's middle this close to the card's edge when you pick it up
      FROM: ['walk', 'rest', 'rise', 'gloat', 'stare', 'cower'],   // what it may be doing when it decides to come along
      LEAP_S: 0.45, ARC_PX: 70,       // the jump onto the card: how long, how high the arc goes
      IN: 0.18,                       // it grips this share of the way in from the card's lowest corner towards its middle
      TIP_PX: 46,                     // its fingertips, px ahead of the middle of its body (where the joint goes)
      SPEED: 14,                      // m/s: swung faster than this, its grip starts to give
      ACC: 700,                       // m/s²: jerked harder than this, likewise (a calm wave of the card stays under ~600)
      DRAIN: 0.9, REGAIN: 0.35,       // grip lost per second of hard swinging (times how far past the limit), won back per calm second
      RIDE_SAY_MS: 3200,              // how often it chats while carried calmly
      FLING: 1.25, LIFT: 3, SPIN: 10, // when it lets go: its speed is boosted this much, plus this much upwards (m/s), a random spin up to this (rad/s)
      REST_V: 0.6, REST_S: 0.8,       // the card lies still (m/s) this long, nobody holding it: it gets off
      WHEE_S: 4, LAND_V: 1.2,         // flying: it has landed when slower than this (m/s), or after this long anyway
      DIZZY_S: 2.6,                   // and lies there seeing stars this long
    },
    CHEESE: {                         // the cheese pull: the arm drags a card off the shelf and an old hand jumps on the other end
      CHANCE: 0.5,                    // share of shelf snacks it goes for, when an old hand is about
      NEAR_PX: 480,                   // "about": its middle this close to the card's edge (page px), on screen
      BELOW_PX: 60,                   // ...or this far below the bottom of the screen (lying on the floor)
      FROM: ['walk', 'rest', 'rise', 'gloat', 'stare', 'cower', 'hide'],   // what it may be doing
      FLICK: [-9, -7], FLICK_SPIN: 8, // lost the pull: flicked off at this speed (m/s), spinning (rad/s)
    },
    WREST: {                          // tug of war over a card it was crushing (the arm's TUNE.hand.WREST)
      TAP_S: 0.25,                    // a click on it shorter than this makes it slip; held longer, you have picked it up
      EASE_S: 0.3,                    // it shuffles from the middle of the card to its end this fast
      FLICK: [-6, -6], FLICK_SPIN: 7, // slipped: it flies off at this speed (m/s), spinning (rad/s)
    },
    GIFT: {                           // a gift for you: after a crush, with your pointer resting on the page, it brings you the ball
      STILL_MS: 1200,                 // the pointer has not moved for this long (game ms)
      R: 30,                          // the ball's radius (px)
      ON_TOP_PX: 84,                  // carried this far above the middle of its body (over its knuckles)
      AT_PX: 40, FAR_PX: 260,         // it puts it down this close below your cursor (px across); further than FAR_PX it scuttles
      PUSH: [1.4, 2.2],               // and gives it this little push forwards and up (m/s)
      WAIT_S: 2.4, MAX_S: 16,         // it waits this long, pleased with itself; gives up carrying after this long
      FILTER: 'saturate(1.8) sepia(.25) hue-rotate(-15deg) brightness(.9) contrast(1.25)',
      CREASES: 'radial-gradient(circle at 34% 30%, rgba(255,255,255,.45), transparent 42%), radial-gradient(circle at 66% 72%, rgba(0,0,0,.4), transparent 62%), repeating-linear-gradient(37deg, rgba(0,0,0,.13) 0 2px, transparent 2px 7px), repeating-linear-gradient(-58deg, rgba(0,0,0,.1) 0 1px, transparent 1px 6px)',
    },
    LEG: { force: 520, damp: 42, cap: 170, walk: 14, drag: 30, torque: 900, torqueDamp: 54 },
    TOWER: {                          // the hand tower: three old hands climb on each other at the right edge and pull the arm out by its wrist
      WAIT_MS: 3000,                  // all three met, awake, walking and in view, the arm lurking: this long before they gather (game ms)
      COOL_MS: 120000,                // not again for this long after a tower, however it ended
      EDGE_PX: 120,                   // the bottom one braces this far in from the right edge of the window
      QUEUE_PX: 125,                  // the others wait their turn this far apart, to its left
      IN_PX: 16, STUCK_S: 0.8,        // close enough to its spot; or stuck this long near it
      STEP_PX: 88,                    // each hand stands on the fingertips of the one below: this much higher (its body is 104 px long)
      CLIMB_S: 1.1, ARC_PX: 70,       // a climb takes this long, up and over in an arc this high
      BRACE_S: 0.5,                   // the one below settles this long before the next one climbs
      BUILD_S: 22,                    // gathering and climbing take at most this long, else they give up
      REACH_S: 9,                     // the top one waits this long for the arm to come down to it
      ASK_MS: 1000,                   // up, it waves at a lurking arm this often (sev.tower)
      HEAVE_MS: 1300,                 // pulling, one of them shouts every so often (each in turn, unforced)
      GRAB_PX: 60, GRAB_AFTER_S: 1.4, // its fingertips this close to the arm's grip, once the arm has looked this long: it has it
      FOLLOW: 18,                     // how fast a hand in the tower follows its place (easing rate)
      WOBBLE: 0.05, WOBBLE_W: 3.1,    // the tower sways this much (rad per hand up), this fast (rad/s)
      KNOCK_PX: 12,                   // pushed this far off its place within a frame (px): it was knocked, and comes down
      FALL: [2.5, 3],                 // coming down: each falls off sideways up to this fast (m/s x, up)
      FLING: [[-9, -4], [-6, -7]],    // shaken off: flung left between these speeds (m/s, [x, y] at the least and at the most)
      SPIN: 12,                       // and spun up to this fast (rad/s)
      LAND_V: 1, LAND_S: 3,           // landed (slower than this, m/s) or after this long: dizzy
    },
  },
  // ---- the secret shelf ----
  shelf: { MAX_W: 260, W_FRAC: 0.42, CLEAR_PX: 250, TOP: 140, BOTTOM: 160, CARDS_BELOW: 2, FRICTION: 0.9, NEAR: [120, 60, 380, 80], EYE_MS: 700 },
  // ---- the hand in the phrasebook menu (its own little world in viewport px) ----
  raid: { S: 100, DT: 1 / 240, GRAV: 85, FALL: 0.25, SMASH: 13, GRIP: [98, 20], ARM_TICK_MS: 250, CARD_TTL_MS: 6000 },
  // ---- page ----
  fog: { REGROW_S: 12, BLOBS: 14, WIPE_STEP: 10, WIPE_R: [46, 0.14], HINT_PX: 400, DPR_MAX: 1.5 },
  kiri: { FLOOD_IN_S: 2.4, FLOOD_HOLD_S: 14, FLOOD_OUT_S: 4, BLOBS: 16, EDGE: 180, MASK_SCALE: 0.5, MASK_MAX: 4096 },
  greeting: { TYPE_MS: 85, HOLD_MS: 2200, ERASE_MS: 40, PAUSE_MS: 260 },
  surprise: { STEPS: 14, STEP_MS: 40, STEP_GROW: 1.6, ASK_DELAY_MS: 700, WELCOME_MS: 900, PAGESHOW_MS: 600 },
  tilt: { DEG: 7, BAND_PX: 26, ROLL: 60 },
  cards: { REGROW_MS: 700, CRUSH_DY: -70 },   // torn-out grid cards regrow (ms, wall time); the crushed card's last scream, px above the fist
  crazy: { TITLE_MS: 180 },
  away: { BACK_MS: 1600 },   // "there you are" stays in the tab title this long after you come back (page/away.js)
  toast: { FALL_MS: 900 },   // the toast you clicked five times falls off the screen this fast
  eggs: { YEAR_MS: 4000, SWITCHES: 7, SWITCH_MS: 4000 },   // 1926: hover the year this long; 7 theme switches within this long: the moon
  rps: {   // rock, paper, scissors between the new hand and an old one (scenes/rps.js)
    CHANCE: 0.5,                      // share of meetings (hand.met) that end in a game
    WAIT_MS: 1800,                    // they stare at each other this long first
    IN_PX: 190, ABOVE_PX: 170, TOP_PX: 130,   // the arm's grip: this far in from the right edge, this far above the old hand (kept this far inside the window)
    YES_MS: 1000,                     // the old hand's answer stays up this long before the count
    PUMPS: 3, PUMP_MS: 440, PUMP_PX: 34,   // three pumps of the fist, each this long, this high
    SHOW_MS: 1300, DRAW_MS: 1300, SAY_GAP_MS: 700, END_MS: 1600,   // the picks stay up; a draw; between the two lines; the end
    ROUNDS: 3,                        // draws: at most this many rounds
    SULK_MS: 10000,                   // the new hand lost: it sulks off out of sight this long (Ivo: 10 s)
    FAIR_MS: 15000,                   // the old hand lost: it is fair game this long
    STAND_PX: 18, STAND_S: 0.35,      // the old hand stands on its wrist: lifted this much, this fast
    HAND: {                           // the arm's three shapes (rock, paper; scissors is its pointing finger)
      rock: { curl: 1, th: 0.95, spread: 0.3, eye: 1.1, pupil: 0.8, happy: 0, point: 0, pinch: 0 },
      paper: { curl: -0.05, th: -0.1, spread: 1.5, eye: 1.2, pupil: 1, happy: 0, point: 0, pinch: 0 },
      scissors: { curl: 0.95, th: 0.9, spread: 0.6, eye: 1.2, pupil: 0.7, happy: 0, point: 1, pinch: 0 },
    },
    OLD: {                            // the old hand's
      rock: { curl: 1.1, th: 1.05, spread: 0.3, eye: 0.9, pupil: 0.6, happy: 0, point: 0, legs: 0 },
      paper: { curl: 0.05, th: 0.1, spread: 1.4, eye: 1.2, pupil: 0.9, happy: 0, point: 0, legs: 0 },
      scissors: { curl: 0.95, th: 0.9, spread: 0.6, eye: 1.2, pupil: 0.7, happy: 0, point: 1, legs: 0 },
    },
  },
  coin: { EDGE: 0.01 },   // share of coin tosses that land on their edge (scenes/coin.js)
  apology: { YES: 0.7, MENU_MS: 4000 },   // right-click a torn card, "apologise": it forgives you this often; the menu goes away after this long
  // say "hand": select the word anywhere and it reaches in for it (scenes/word.js). SETTLE_MS: the selection must sit still this long;
  // OVER_PX: it first hovers this far right of the word; HOVER_MS, PINCH_MS: how long it eyes the word, then pinches it;
  // HOLD_MS: at least this long with the word in its fingers before it pulls it away; DRAG_MS: the pull off the right edge
  // the Konami code (page/omikuji.js): a ripped-out slip unfolds over UNFOLD_MS and reads its fortune READ_MS after the tear (after its
  // own "rip" line); a 凶 says so CURSE_MS later; a slip torn in two complains TORN_MS after its scream
  omikuji: { UNFOLD_MS: 500, READ_MS: 1500, CURSE_MS: 2600, TORN_MS: 1700 },
  // the hand's diary (page/diary.js, the phrasebook's secret chapter): it keeps at most MAX lines a visit (the oldest go first);
  // typing WORD with the phrasebook open shows it
  diary: { MAX: 300 },
  // the basement (page/basement.js): at the very bottom of the page, PUSHES more scrolls down lift the footer like a trapdoor onto the
  // hand's trophy wall. A wheel push is a burst of wheel events after GAP_MS without one, or PUSH_PX of wheel past the last push;
  // the pushes must come within RESET_MS of each other; a touch push is a swipe up of TOUCH_PX. BOTTOM_PX: how close to the
  // bottom counts. The wall is H_MAX px (or H_VH of the window) tall and opens in OPEN_MS; each trophy is TROPHY_PX wide; MAX kept
  basement: { PUSHES: 3, GAP_MS: 220, PUSH_PX: 400, RESET_MS: 2500, TOUCH_PX: 40, BOTTOM_PX: 2, H_MAX: 460, H_VH: 0.62, OPEN_MS: 700, LID_DEG: 55, TROPHY_PX: 150, MAX: 40 },
  word: { SETTLE_MS: 450, OVER_PX: 70, HOVER_MS: 650, PINCH_MS: 260, HOLD_MS: 1500, DRAG_MS: 1300, GONE_PX: 260 },
  speech: {
    TILT: [4, 4],                // every bubble leans right by 4 + up to 4 degrees
    RIDE_DY: -40,                // a body's bubble sits this far above the top of its rotated box
    ARM: { dx: -30, dy: -115, minY: 70, maxX: 80 },
    AGONY_GAP: [1500, 950],      // cardSay: no new line within 1500 - 950 * pain ms unless the tier rises
    AGONY_TIERS: [0.3, 0.62],
    EDGE: 6, APART: 10, APART_HOLD: 34, APART_TOUCH: 4, STACK: 16, DODGE: 10, DODGE_GAP: 14, TAIL: 14, LEAN_GROW: 0.07,
    BUTTON_EXTRA_MS: 100,
  },
  // crazy mode with old hands on the page (src/actors/severed/dance.js, behaviours dance / jive / freeze; src/actors/hand/bob.js):
  // they dance in place to a beat of BEAT_TICKS ticks of the scrolling tab title (TUNE.crazy.TITLE_MS), and the arm bobs at the edge
  dance: {
    BEAT_TICKS: 3,                    // one beat = this many title scroll steps (3 x 180 ms: about 111 bpm)
    FROM: ['walk', 'rest', 'limp', 'rise', 'stare', 'gloat', 'mirror', 'cower', 'dizzy', 'dead'],   // what an old hand may be doing when the music takes it
    STILL_V: 1,                       // limp: only once it lies this still (m/s), so a thrown one lands first
    STEP_PX: 16,                      // on each beat one foot steps out this far to the side and back
    SHUFFLE: 0.22,                    // m/s: the body sways two beats right, two beats left
    DIP: 0.24,                        // m: it dips on every beat (and comes back up before the next)
    SPIN_EVERY: 8,                    // beats between two spins on the spot
    POSE_RATE: 14,                    // how fast the free fingers snap to the beat's move
    WIG: 0.22,                        // finger wiggle while dancing (held: HELD_WIG)
    HELD_WIG: 0.6,
    SAY_MS: 7000, HELD_SAY_MS: 2600,  // how often it chats while dancing / while you hold it (unforced)
    MOVES: [                          // its moves, one per beat (fingers 0 and 1 are its legs; the others do the moves)
      { curl: 0.9, th: 0.95, spread: 0.5, eye: 1, pupil: 1, happy: 1, point: 0, legs: 1 },
      { curl: 0.2, th: 0.15, spread: 1.35, eye: 1.3, pupil: 0.8, happy: 0, point: 0, legs: 1 },
      { curl: 0.9, th: 0.9, spread: 0.5, eye: 1.1, pupil: 1, happy: 1, point: 1, legs: 1 },
      { curl: 1.1, th: 1.05, spread: 0.3, eye: 0.5, pupil: 0.6, happy: 0, point: 0, legs: 1 },
    ],
    FREEZE: { STILL_S: 0.8, LOOK_S: 0.5, LOOKS: 3, PRETEND_S: 2.6, END_S: 4.4 },   // the music stops: stock still, then it looks left and right LOOKS times, then pretends nothing happened, then walks on
    BOB: { EDGE_PX: 70, PX: 18, SWAY: 0.22, RATE: 7, WIG: 0.35, SAY_MS: 900 },   // the arm: its wrist this far in from the right edge, bobbing this many px a beat, the hand swaying (rad); its line after SAY_MS
  },
};

// ---- timing: how long every speech bubble stays up, how long anyone waits before speaking again, and how long you get to answer ----
// All in ms of real time. Change the numbers here, never at the call sites. (Verbatim from index.html, PR 80/81.)
export const TIMING = {
  read: { base: 600, perChar: 65, cjk: 220, min: 1300, max: 3500 },
  floor: { rip: 1900, eat: 1600, help: 2400, hide: 1900, btn: 2600, hand: 1500, toast: 2400,
           flip: 4000, rematch: 4000, meet: 2200, devour: 1900, yourpick: 4000, callit: 3500, ask: 4000, waiting: 2600 },
  gap: { show: 600, after: 500, card: 1400, katana: 2000, scream: 2000, hand: 2000, handIdle: 2400, handLate: 1200, sev: 2200, sevForce: 900, notme: 2600, raid: 1300, raidAsk: 2900 },
  react: { min: 700, spread: 2100, calm: 0.65, flinch: 1500 },
  wait: {
    tease: [2000, 2800], teaseAgain: [1200, 2000], teaseMin: 2000, catchHeld: 1000,   // catchHeld: a card held this long in the catch zone gets grabbed (Ivo 2026-11-25)   // teaseMin: Ivo wants teasing to last at least 2 s before it lunges or snatches
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
