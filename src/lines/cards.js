// What the cards say. STUB: the lines package moves the text here from index.html, together with each list's trigger
// (phrasebook CHAPTERS), its BG/JP glosses (phrasebook GLOSS) and legacy path, with
//   defineLines(key, list, { who: 'card', trigger: { title, when }, gloss, legacy })
// Keys (legacy path in brackets). Keep the arrays' contents and order exactly: line() draws by index.
//   card.pull [SAY.pull]  card.strain [SAY.strain]  card.back [SAY.back]  card.rip [SAY.rip]  card.throw [SAY.throw]
//   card.land [SAY.land]  card.cutting [SAY.cutting]  card.stab [SAY.stab]  card.slice [SAY.slice]  card.smash [SAY.smash]
//   card.agony.0 / .1 / .2 [AGONY.0/1/2]  card.panic.0 / .1 / .2 [PANIC.0/1/2]  card.notme [NOTME]  card.beg [BEG]
//   button.hi [SAY.btnhi]  (the Heads / Tails buttons; legacy kept them in SAY)
//   toast.ripped 'Ripped it out! Stack them, or throw one hard to smash it.'  toast.smashed 'Smashed!'
//   toast.smashed10 '10 cards smashed. Feeling better?'  toast.halved 'It keeps its half.'  (one-line lists: no draw)
export function install(app) {}
