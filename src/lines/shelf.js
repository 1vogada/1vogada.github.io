// The shelf's toasts. shelfGone is a one-line list (no random draw); the opening ones say it came out at a random height. The cards' panic and the hand's shelf lines live in cards.js and hand.js.
// The 棚 toasts are tagged ja by script; in English-only mode page/toast.js drops their non-English parts (legacy lang.js plain()).
// Generated once from the old scripts; tests/unit/lines.snapshot.json pins every list (edit, UPDATE_SNAPSHOT=1, review the diff).
// Keep each array's contents and order exactly: line() draws by index, and the array itself is the picker's memory key.
// lang: one tag per line ('en' | 'bg' | 'ja', by script: Cyrillic = bg, kana/kanji = ja, else en), or one string for all.
import { defineLines } from '../core/lines.js';

defineLines('toast.shelfGone', ['The shelf is gone.'], { who: 'toast', lang: 'en' });
defineLines('toast.shelfIn', [
  '棚 · A shelf spawned at a random spot. Leave a card on it and look away.',
  '棚 · A shelf popped up somewhere random this time. Leave a card on it and look away.',
  '棚 · New shelf, random height. Find it, leave a card, look away.',
  '棚 · The shelf landed somewhere new under the banner. Leave a card there and look away.',
], { who: 'toast', lang: 'ja' });
defineLines('toast.shelfFirst', [
  '棚 · A shelf spawned at a random spot. Pull a card out and leave it there.',
  '棚 · A shelf popped up somewhere random under the banner. Pull a card out and leave it there.',
  '棚 · A shelf, randomly placed. Scroll to find it, then leave a card on it.',
  '棚 · Somewhere down the page a shelf just spawned. Pull a card out and put it there.',
], { who: 'toast', lang: 'ja' });

export function install(app) {}
