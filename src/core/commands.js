// Secret console commands: window.kiri, for visitors who open the dev tools (Ivo 2026-11-25: "make a foundation for secret
// console commands"). Any module registers one with defineCommand(name, { about, run, hidden }); window.kiri.<name>() runs it.
// Hidden commands are left out of kiri.help() until kiri.unlock() has been typed. A command's return value is what the console
// prints, so return a short string (or nothing). Nothing here draws Math.random.
//
// Add one:   defineCommand('shelf', { about: 'the secret shelf', run: () => app.shelf.toggle() });
// Lint: window.kiri is fine (only window.__ is reserved for test hooks in core/debug.js).

const commands = new Map();   // name -> { about, run, hidden }
let unlocked = false, published = false, api = null;

/** register (or replace) a console command */
export function defineCommand(name, { about = '', run, hidden = false } = {}) {
  if (!/^[a-z][a-z0-9]*$/.test(name)) throw new Error('defineCommand: lower-case letters and digits only');
  if (typeof run !== 'function') throw new Error('defineCommand: run must be a function');
  commands.set(name, { about, run, hidden });
  if (api) expose(name);
}
/** the commands as they are now (tests) */
export const list = () => [...commands].map(([name, c]) => ({ name, about: c.about, hidden: c.hidden }));
export const isUnlocked = () => unlocked;

function expose(name) {
  Object.defineProperty(api, name, { configurable: true, enumerable: !commands.get(name).hidden || unlocked,
    value: (...args) => { const c = commands.get(name); if (!c) return undefined; try { return c.run(...args); } catch (e) { return 'that did not work: ' + (e && e.message || e); } } });
}

function help() {
  const rows = [...commands].filter(([, c]) => !c.hidden || unlocked).map(([n, c]) => `kiri.${n}()`.padEnd(16) + c.about);
  return rows.join('\n') + (unlocked ? '' : '\n…and some you have not found yet.');
}

export function install(app) {
  if (typeof window === 'undefined' || published) return;
  published = true;
  api = {};
  defineCommand('help', { about: 'this list', run: help });
  defineCommand('unlock', { about: 'shows the hidden ones', hidden: true, run: () => {
    unlocked = true; for (const n of commands.keys()) expose(n);
    return 'unlocked. kiri.help() shows everything now.';
  } });
  for (const n of commands.keys()) expose(n);
  try { Object.defineProperty(window, 'kiri', { value: api, configurable: true }); } catch (e) {}
}
