// The parts of the stage, in the order the list shows them. Each part file exports PART = { id, title, intro, acts: [...] }.
// An act: { id (unique over all parts), title, how (how you set it off for real, one sentence), shortcut (optional: what the
// stage does quicker than you would), play: async (r, app) => {...} (r = ./rig.js), tail (optional: ms to keep watching after
// play returns, default 2500) }.
import { PART as cards } from './cards.js';
import { PART as katana } from './katana.js';
import { PART as arm } from './arm.js';
import { PART as old } from './old.js';
import { PART as page } from './page.js';
import { PART as surprise } from './surprise.js';
import { PART as book } from './book.js';

export const PARTS = [cards, katana, arm, old, surprise, page, book];
