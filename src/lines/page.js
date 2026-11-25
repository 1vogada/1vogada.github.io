// What the page itself says: the greeting's words (legacy hellos), the omikuji slips (legacy FORTUNES) and the fog toast.
// Imported by lines/phrasebook.js so it loads with the other lines modules (main.js imports the six stubs only).
// Generated once from the old scripts; tests/unit/lines.snapshot.json pins every list (edit, UPDATE_SNAPSHOT=1, review the diff).
// Keep each array's contents and order exactly: line() draws by index, and the array itself is the picker's memory key.
// lang: one tag per line ('en' | 'bg' | 'ja', by script: Cyrillic = bg, kana/kanji = ja, else en), or one string for all.
import { defineLines } from '../core/lines.js';

// typed one after another, always English, then Bulgarian, then Japanese (page/greeting.js; reduced motion: [0] only)
defineLines('greeting.hello', ['Hi there.', 'Здравей.', 'こんにちは。', 'Welcome.', 'Добре дошли.', 'ようこそ。'], {
  who: 'greeting',
  lang: ['en', 'bg', 'ja', 'en', 'bg', 'ja'],
});

// the omikuji: [kanji, name, text or [[Japanese, English], ...], weight]. Not picked with line(): scenes/fortune draws by weight.
// A slip is a record, not a line: langOf() tags it 'en' (every slip carries its English). In English-only mode scenes/fortune
// shows only the English parts, as legacy lang.js did (name: the part after ' · ' that is English; 末吉: the English, no tooltip).
defineLines('fortune.slip', [
  ['大吉', 'Great blessing · Голям късмет', 'The fog parts just for you today.', 3],
  ['中吉', 'Middle blessing · Среден късмет', 'Something you build today will compile on the first try.', 3],
  ['小吉', 'Small blessing · Малък късмет', 'A small bug will flee before you.', 3],
  ['吉', 'Blessing · Късмет', 'The katana is on your side. Mostly.', 3],
  ['末吉', 'Future blessing · Бъдещ късмет', [
    ['霧の中で、自分の形を忘れていく', 'In the fog I am forgetting my own shape'],
    ['割れた鏡の向こうで、知らない顔が笑う', 'Beyond the broken mirror, a face I do not know is smiling'],
    ['崩れていく僕を、誰か見つけて', 'Someone, find me while I crumble'],
    ['止まった時計の中で、まだ息をしている', 'Inside a stopped clock, I am still breathing'],
    ['霧が晴れたら、僕はまだここにいるかな', 'When the fog lifts, will I still be here?'],
    ['色のない世界で、赤だけが痛い', 'In a world without colour, only the red hurts'],
    ['名前を呼ばれても、返事ができない', 'They call my name and I cannot answer'],
  ], 2],
  ['凶', 'Curse · Лош късмет', 'Tie this slip to a tree and draw again.', 1],
], { who: 'fortune', lang: 'en' });

// toast: a one-line list (page/kiri.js, the kiri / мъгла flood). Tagged ja by script; English-only drops the non-English parts
defineLines('toast.fog', ['霧が出た · Мъгла падна · The fog rolls in'], { who: 'toast', lang: 'ja' });

// ---- easter eggs ----
// the tab title while you are on another tab, and the moment you come back (page/away.js; picked in turn, no random draw)
defineLines('page.away', ['come back…', 'where did you go?', 'psst. come back', 'the hand misses you', 'come back… 手'], {
  who: 'page', lang: ['en', 'en', 'en', 'en', 'ja'], gloss: { 'come back… 手': 'come back… (手 = hand)' },
});
defineLines('page.back', ['oh, there you are', 'welcome back', 'oh. hi.'], { who: 'page', lang: 'en' });
// click a toast: it answers, in turn; the fifth click knocks it off the screen (page/toast.js)
defineLines('page.toastPoke', ['stop poking me', 'I am just a message', 'I said stop.', 'fine. FINE.'], { who: 'toast', lang: 'en' });
defineLines('page.toastFall', ['aaaa—'], { who: 'toast', lang: 'en' });
// the Konami code: the cards fold themselves into omikuji slips (page/omikuji.js; a toast, one draw)
defineLines('page.konami', ['The cards have folded themselves into fortunes.', 'Up, up, down, down… and every card is a fortune now.', 'Omikuji everywhere. Pull a card, read your luck.', 'Cheat code accepted. The cards are omikuji now.', 'Картите станаха късметчета.', 'カードがおみくじになった。'], {
  who: 'toast', lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
  gloss: { 'Картите станаха късметчета.': 'The cards turned into fortunes.', 'カードがおみくじになった。': 'The cards became fortune slips.' },
});
// the basement: the hand's trophy wall under the footer (page/basement.js): the plaque over it, and what it says when it is bare
defineLines('page.trophy', ['The trophy wall', 'Everything it ate', 'Do not touch the exhibits', 'My collection. Look, do not touch.', 'Delicious, every one', 'Трофеите ми', '戦利品'], {
  who: 'page', lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
  gloss: { 'Трофеите ми': 'My trophies', '戦利品': 'spoils of war' },
});
defineLines('page.trophyEmpty', ['Nothing here yet. Bring me something.', 'Empty. For now.', 'Room for one more. Or twelve.', 'The nails are waiting', 'Още е празно.', 'まだ空っぽ'], {
  who: 'page', lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
  gloss: { 'Още е празно.': 'Still empty.', 'まだ空っぽ': 'still empty' },
});
// kiri.hint() in the console (page/console.js)
defineLines('console.hint', ['type a word for a thing that holds things.', 'everything here can be pulled. most things can be torn.', 'the fog hides more than the banner.', 'the old hand remembers you.', 'some slips land on their edge.'], {
  who: 'console', lang: 'en',
});

export function install(app) {}
