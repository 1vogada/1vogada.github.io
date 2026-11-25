// What the katana says (legacy SAY.kdrop khello kbrag kcut) and its toasts.
// Generated once from the old scripts; tests/unit/lines.snapshot.json pins every list (edit, UPDATE_SNAPSHOT=1, review the diff).
// Keep each array's contents and order exactly: line() draws by index, and the array itself is the picker's memory key.
// lang: one tag per line ('en' | 'bg' | 'ja', by script: Cyrillic = bg, kana/kanji = ja, else en), or one string for all.
import { defineLines } from '../core/lines.js';

defineLines('katana.drop', ['oops.', 'I meant to do that', 'gravity wins again', 'catch me?!', 'timber!', 'butterfingers', 'おっと', 'опа!'], {
  who: 'katana', legacy: 'SAY.kdrop',
  trigger: { title: 'Dropped',
    when: 'You let go of it.' },
  gloss: { 'おっと': 'oops', 'опа!': 'whoops!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'ja', 'bg'],
});

defineLines('katana.hello', ["hello! I'm the sharpest katana ever!", 'careful: I cut things just by touching them', 'sharpest blade in the world, hi!', "don't touch anything you like with me", '世界一切れる刀です', 'най-острата катана на света, здрасти!'], {
  who: 'katana', legacy: 'SAY.khello',
  trigger: { title: 'Introducing itself',
    when: 'You tear it out of the banner, or double-click to take it in hand.' },
  gloss: { '世界一切れる刀です': 'I am the sharpest sword in the world', 'най-острата катана на света, здрасти!': 'the sharpest katana in the world, hello!' },
  lang: ['en', 'en', 'en', 'en', 'ja', 'bg'],
});

defineLines('katana.brag', ['told you. sharpest ever.', "I didn't even try", 'one touch is all it takes', 'I barely touched it!', 'too sharp, sorry', 'スパッ', 'като масло'], {
  who: 'katana', legacy: 'SAY.kbrag',
  trigger: { title: 'Boasting',
    when: 'It has just cut a card in two while you were holding it. It boasts about two times in five.' },
  gloss: { 'スパッ': 'the sound of a clean cut', 'като масло': 'like butter' },
  lang: ['en', 'en', 'en', 'en', 'en', 'ja', 'bg'],
});

defineLines('katana.cut', ['whoops, sorry', 'slicing on my way down', 'not my fault', "don't mind me", 'it was in the way'], {
  who: 'katana', legacy: 'SAY.kcut',
  trigger: { title: 'Cutting by accident',
    when: 'It cuts a card with nobody holding it, on its way down the page.' },
  lang: 'en',
});

// toasts: one-line lists, no random draw
defineLines('toast.katanaFound', ['A katana?! Pull it out of the ground.'], { who: 'toast', lang: 'en' });
defineLines('toast.katanaDrawn', ['The very tip of the blade cuts, however slowly. Double-click the katana to keep it in hand.'], { who: 'toast', lang: 'en' });

export function install(app) {}
