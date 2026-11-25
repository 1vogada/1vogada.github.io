// The toast (legacy toast(msg)). Its life is TIMING.ms(msg, TIMING.floor.toast) on wall time. STUB.
// Actors cannot import this file: they emit 'ui.toast' and src/reactions.js calls show(msg).

const todo = (name) => () => { throw new Error(`toast.${name}: not implemented`); };

export const show = todo('show');
export function install(app) {}
