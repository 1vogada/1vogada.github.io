// What the hand says in the phrasebook menu (legacy scripts/phrasebook.js RAID_SAY ... HIDE_SAY) and its one literal.
// legacy: none of these were on window.__lines (no `legacy` path).
// Generated once from scripts/legacy.js and scripts/phrasebook.js; tests/unit/lines-data.test.js checks every list against them.
// Keep each array's contents and order exactly: line() draws by index, and the array itself is the picker's memory key.
// lang: one tag per line ('en' | 'bg' | 'ja', by script: Cyrillic = bg, kana/kanji = ja, else en), or one string for all.
import { defineLines } from '../core/lines.js';
import './page.js';   // the page's own lines (greeting, fortunes, fog toast): loaded with this module

defineLines('raid.bored', ['boring.', 'too many words', 'less reading, more snacks', 'you read too slow', 'I am in this one!', 'spoilers.', 'YEET', 'next!', 'this one too', 'скука.', 'つまらない', 'ポイ'], {
  who: 'raid',
  trigger: { title: 'Bored of your reading',
    when: 'You keep this menu open for 5 seconds. The Hand comes in and picks something to do, at random, again and again: throw a card at the left edge of the screen, eat one, ask you to help rip one, or take the scroll. It says these as it arrives and as it throws.' },
  gloss: { 'скука.': 'boring.', 'つまらない': 'boring', 'ポイ': 'the sound of tossing something away' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja', 'ja'],
});

defineLines('raid.swat', ['OW!', 'hey!!', 'rude.', 'my knuckles!', 'I was reading that', 'what was that for', 'you hit me?!', 'ау!', 'боли!', '痛っ!', 'ひどい!'], {
  who: 'raid',
  trigger: { title: 'Swatted',
    when: 'You click the Hand while it is in this menu. It drops what it holds and stays away for at least five seconds.' },
  gloss: { 'ау!': 'ow!', 'боли!': 'it hurts!', '痛っ!': 'ouch!', 'ひどい!': 'how mean!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'bg', 'ja', 'ja'],
});

defineLines('raid.grudge', ['fine. slowly.', 'gently, then', 'do not hit me', 'tiptoe…', 'I am being nice now', 'полека…', 'そーっと…'], {
  who: 'raid',
  trigger: { title: 'Back, and careful',
    when: 'About half the time it returns from a swat wary, and creeps towards the next card slowly.' },
  gloss: { 'полека…': 'easy does it…', 'そーっと…': 'ever so quietly…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('raid.angry', ['THAT IS IT', 'you asked for it', 'no more mister nice hand', 'NOW I am angry', 'сега ще видиш!', 'もう怒った!'], {
  who: 'raid',
  trigger: { title: 'Back, and angry',
    when: 'The other half of the time it returns furious: it reaches fast, throws three cards in a row, and may take hold of the scroll.' },
  gloss: { 'сега ще видиш!': 'now you will see!', 'もう怒った!': 'now I am angry!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('raid.scroll', ['lost your place?', 'where were we?', 'up! down! up!', 'wheeee', 'нагоре-надолу!', 'ぐるぐる〜'], {
  who: 'raid',
  trigger: { title: 'Shaking the scroll',
    when: 'It grabs the right edge of the menu and yanks the page up and down for two to four seconds, so you lose your place.' },
  gloss: { 'нагоре-надолу!': 'up and down!', 'ぐるぐる〜': 'round and round' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('raid.help', ['help me rip this', 'grab the other end!', 'you pull, I pull', 'hold this. PULL.', 'too tough for one hand', 'дърпай!', '手伝って!', '引っぱって!'], {
  who: 'raid',
  trigger: { title: 'Asking for help',
    when: 'It pulls a card out of this menu and holds it out to you. Grab the card and pull it left, and it rips in two: you get half, it eats the other.' },
  gloss: { 'дърпай!': 'pull!', '手伝って!': 'help me!', '引っぱって!': 'pull!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja', 'ja'],
});

defineLines('raid.alone', ['fine. alone then.', 'no help? ok.', 'useless.', 'I do everything here', 'сам ще си го…', 'もういい!'], {
  who: 'raid',
  trigger: { title: 'Nobody helped',
    when: 'It held the card out for about eight seconds and you did not take the other end. It throws it instead.' },
  gloss: { 'сам ще си го…': 'I will do it myself…', 'もういい!': 'that is enough!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('raid.more', ['again!', 'not done', 'one more lap', 'still lost?', 'още!', 'もう一回!'], {
  who: 'raid',
  trigger: { title: 'Still scrolling',
    when: 'Half the time it does not let go after that, and shakes the scroll for a few seconds more.' },
  gloss: { 'още!': 'more!', 'もう一回!': 'one more time!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('raid.hide', ['was not me.', 'you saw nothing', 'I was never here', '*hides*', 'не бях аз.', 'かくれんぼ!', '知らないよ'], {
  who: 'raid',
  trigger: { title: 'Hiding',
    when: 'The other half it lets go, says this, and hides off the screen for a few seconds as if it was never there.' },
  gloss: { 'не бях аз.': 'it was not me.', 'かくれんぼ!': 'hide and seek!', '知らないよ': 'I know nothing' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja', 'ja'],
});

// said when the menu is empty: a one-line list
defineLines('raid.done', ['all gone.'], { who: 'raid', lang: 'en' });

export function install(app) {}
