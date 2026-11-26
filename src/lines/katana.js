// What the katana says (legacy SAY.kdrop khello kbrag kcut; katana.tana for the chain fog-slash) and its toasts.
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

defineLines('katana.tana', [
  'found your shelf. you\'re welcome.',
  'the writing had it coming',
  'open sesame. sharply.',
  'who needs a password when you have me?',
  'I read it. then I cut it.',
  'a secret? not any more.',
  'one slash, one shelf',
  'typing is for people without blades',
  'the fog never stood a chance',
  'I cut a word in half and a shelf fell out. normal day.',
  'shelf delivered. tips accepted.',
  'some words you say. this one I slice.',
  '棚、開けといた',
  'рафтът е отворен. моля.',
], {
  who: 'katana',
  trigger: { title: 'Slashing the secret open',
    when: 'You swing it fast across the hidden 棚 in the corner of the banner while the shelf is in: the writing splits and the shelf slides out.' },
  gloss: { '棚、開けといた': 'I opened the shelf for you', 'рафтът е отворен. моля.': 'the shelf is open. you\'re welcome.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'ja', 'bg'],
});

// toasts: one-line lists, no random draw
defineLines('toast.katanaFound', ['A katana?! Pull it out of the ground.'], { who: 'toast', lang: 'en' });
defineLines('toast.katanaDrawn', ['The very tip of the blade cuts, however slowly. Double-click the katana to keep it in hand.'], { who: 'toast', lang: 'en' });

// ---- silent film (chain silent-film): 1926-only lists that take the place of others while the egg is on (core/speech.js FILM) ----
defineLines('katana.film', ["THWICK.", "And lo, the blade sang.", "Steel speaks; paper listens.", "A clean cut, sir.", "Justice, swift and shiny.", "Thus ends the scoundrel card.", "Behold: the fine edge of 1926.", "The blade bows to no one.", "Another, if you please.", "A tragedy, beautifully edged.", "Чисто, господине.", "一刀両断。"], {
  who: 'katana',
  trigger: { title: "1926: the blade speaks", when: "While the page is in 1926 (hover the © year in the footer for a few seconds), every bubble is a silent-film title card. It has just cut something in two." },
  gloss: {"Чисто, господине.": "clean, sir.", "一刀両断。": "cut in two with a single stroke."},
  lang: ["en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "bg", "ja"],
});

export function install(app) {}
