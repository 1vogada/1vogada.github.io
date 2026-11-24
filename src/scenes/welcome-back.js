// Back after the hand sent you away: another project and a rematch (legacy welcomeBack, the pageshow handler). STUB.
// Runs TUNE.surprise.WELCOME_MS after 'data.loaded' (wall time; wired in reactions.js) and PAGESHOW_MS after a persisted pageshow.

const todo = (name) => () => { throw new Error(`welcome-back.${name}: not implemented`); };

/** legacy welcomeBack() */ export const welcomeBack = todo('welcomeBack');
export function install(app) {}
