// The hand's diary: every line the arm's hand says on this visit, in order, with the time it said it (from 'hand.said', which
// carries the bubble's own words). Kept in sessionStorage, so a reload does not wipe it; at most TUNE.diary.MAX lines.
// The phrasebook shows it as a secret last chapter when you type "kotoba" (言葉, words) with it open (phrasebook/menu.js).
// Nothing here draws Math.random.
import { TUNE } from '../core/tune.js';
import { bus } from '../core/bus.js';

const KEY = 'kiripad-diary';
let days = null;

function load() {
  if (days) return days;
  try { days = JSON.parse(sessionStorage.getItem(KEY) || '[]'); } catch (e) { days = []; }
  if (!Array.isArray(days)) days = [];
  return days;
}
/** the lines so far, oldest first: [{ at (ms since 1970), kind, text }] */
export const entries = () => load().slice();

function write({ kind, text }) {
  if (!text) return;
  const d = load(); d.push({ at: Date.now(), kind, text });
  if (d.length > TUNE.diary.MAX) d.splice(0, d.length - TUNE.diary.MAX);
  try { sessionStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {}
}

export function install(app) { bus.on('hand.said', write); }
