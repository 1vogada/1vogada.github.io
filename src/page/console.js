// The note in the console: open the dev tools and a hand drawn in characters tells you to stop peeking, and how to find the
// secret commands (core/commands.js). The page's own commands live here; others can be added from any module.
import { defineCommand } from '../core/commands.js';
import { line } from '../core/lines.js';
import { isCrazy } from '../world/world.js';
import * as kiri from './kiri.js';

const HAND = [
  '        _  _',
  '      _| || |_',
  '     | || || |',
  '     | || || | _',
  '     |  `  `  |/ )',
  '     |   (o)    /',
  '      \\        /',
  '       |      |',
].join('\n');


export function install(app) {
  defineCommand('shelf', { about: 'the secret shelf (same as typing tana)', run: () => { if (isCrazy() || !app.shelf) return 'not now.'; app.shelf.toggle(); return 'there.'; } });
  defineCommand('mist', { about: 'fog over everything (same as typing kiri)', run: () => { if (isCrazy()) return 'not now.'; kiri.flood(); return '霧.'; } });
  defineCommand('hint', { about: 'a nudge towards something hidden', run: () => line('console.hint') });
  defineCommand('sever', { about: 'cuts the hand off, if it is out', hidden: true, run: () => {
    const h = app.hand, c = h && h.get && h.brain && h.brain() ? h.get() : null;
    if (!c || c.stump || !h.brain().is('lurk', 'eager', 'tug', 'has', 'crush', 'reach', 'sulk', 'gloat')) return 'no hand to cut.';
    h.cut(); return 'snip.';
  } });
  try {
    // eslint-disable-next-line no-console
    console.log('%c' + HAND + '\n\n%cstop peeking.%c\n…or type kiri.help()', 'color:#c8372d;font:12px/1.15 monospace', 'font:bold 14px system-ui', 'font:12px system-ui;color:#888');
  } catch (e) {}
}
