// Rehearsal: while the secret stage (src/showcase/) plays an act, the page is only showing off. Nothing that is meant to be found
// by playing counts as found: no stamp is inked (page/stamps.js), no line is heard (phrasebook/heard.js), the diary writes nothing
// (page/diary.js). Everything else runs exactly as it always does. Draws no Math.random.

let on = false;
/** an act of the stage is playing */
export const rehearsing = () => on;
/** the stage starts (true) or ends (false) an act */
export function rehearse(v) { on = !!v; }
