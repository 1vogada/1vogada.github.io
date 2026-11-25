// The shelf's toasts (one-line lists, no random draw). The cards' panic and the hand's shelf lines live in cards.js and hand.js.
// The 棚 toasts are tagged ja by script; in English-only mode page/toast.js drops their non-English parts (legacy lang.js plain()).
// Generated once from scripts/legacy.js and scripts/phrasebook.js; tests/unit/lines-data.test.js checks every list against them.
// Keep each array's contents and order exactly: line() draws by index, and the array itself is the picker's memory key.
// lang: one tag per line ('en' | 'bg' | 'ja', by script: Cyrillic = bg, kana/kanji = ja, else en), or one string for all.
import { defineLines } from '../core/lines.js';

defineLines('toast.shelfGone', ['The shelf is gone.'], { who: 'toast', lang: 'en' });
defineLines('toast.shelfIn', ['棚 · A shelf. Leave a card on it and look away.'], { who: 'toast', lang: 'ja' });
defineLines('toast.shelfFirst', ['棚 · A shelf. Pull a card out and leave it there.'], { who: 'toast', lang: 'ja' });

export function install(app) {}
