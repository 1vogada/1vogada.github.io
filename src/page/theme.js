// Light / dark (legacy darkNow, syncTheme, the theme button, localStorage kiripad-theme). Emits 'theme.changed'; page/fog.js
// re-reads its colour and refogs. STUB.
const todo = (name) => () => { throw new Error(`theme.${name}: not implemented`); };
export const dark = todo('dark');
export function install(app) {}
