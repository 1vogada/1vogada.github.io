// What the hand says in the phrasebook menu (legacy scripts/phrasebook.js RAID_SAY ... HIDE_SAY) and its one literal.
// legacy: none of these were on window.__lines (no `legacy` path).
// Generated once from the old scripts; tests/unit/lines.snapshot.json pins every list (edit, UPDATE_SNAPSHOT=1, review the diff).
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

// ---- phrase-say (phrasebook/say.js): select a line in the open phrasebook and its owner says it beside the menu; a line it has
// never said to you, it refuses with one of these ----
defineLines('card.notyet', ["I don't say that one yet!", 'not that one! not YET!', 'I have never said that to you and I am not starting now', 'where did you even read that?!', 'spoilers! I refuse!', 'that line is for later. MUCH later', 'you have to earn that one. please don\'t', 'lies! I never said that!', 'do something to me first. no wait, DON\'T', 'that one is still in rehearsal', 'I am saving that for a worse day', 'who wrote that down?!', 'не, това още не го казвам!', 'それはまだ言わない!'], {
  who: 'card',
  trigger: { title: 'Not yet!',
    when: 'In this book, you select a card line you have never heard a card say. A card peeks out from behind the book and refuses.' },
  gloss: { 'не, това още не го казвам!': 'no, I do not say that one yet!', 'それはまだ言わない!': 'I will not say that one yet!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('katana.notyet', ['I do not say that one yet.', 'a blade does not repeat what it has never said', 'unworthy. ask again after a cut', 'my words are sharper when earned', 'I do not recite on demand', 'draw me first. then we talk', 'that line is still in its sheath', 'you are not ready for that one', 'not before the first stroke', 'silence is also a cut', 'не още, смъртни.', 'まだだ。'], {
  who: 'katana',
  trigger: { title: 'Sheathed words',
    when: 'In this book, you select a katana line you have never heard it say. It slides out beside the book and declines.' },
  gloss: { 'не още, смъртни.': 'not yet, mortal.', 'まだだ。': 'not yet.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.notyet', ["I don't say that one yet.", 'nice try. that one costs a card', 'you have not heard that from me. yet.', 'unlock it the usual way: feed me', 'that one is premium', 'no reading ahead', 'I say it when I say it', 'who leaked my lines?', 'rip something and maybe I will', 'that is for paying customers', 'my mouth, my rules', 'snacks first. then lines', 'reading my script? rude.', 'не и без карта.', 'まだ早い'], {
  who: 'hand',
  trigger: { title: 'Not for free',
    when: 'In this book, you select a line of the Hand\'s that it has never said to you. It pokes in at the edge of the book and wags a finger.' },
  gloss: { 'не и без карта.': 'not without a card.', 'まだ早い': 'too soon' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('sev.notyet', ["I don't say that one yet…", 'not yet… ask me when I am older', 'that is a secret. shh.', 'I only whisper that one', 'maybe if you are nice to me', 'I am too small to say that', 'I will tell you when the big one is not listening', 'that one makes me sad. later', 'psst. not yet.', 'I am saving it for my funeral', 'you have not earned my words', 'what line? I see no line', 'шшт. още не.', 'ないしょ'], {
  who: 'sev',
  trigger: { title: 'A secret, still',
    when: 'In this book, you select an old hand\'s line you have never heard one say, while an old hand is about. It creeps in at the edge of the book and keeps it to itself.' },
  gloss: { 'шшт. още не.': 'shh. not yet.', 'ないしょ': 'it is a secret' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// the one whose line you picked is not about (no old hand on the page, or the hand has not shown itself yet): a toast says so
defineLines('toast.sayNobody', ['Nobody around says that just now.', 'The one who says that is not here.', 'Whoever owns that line is elsewhere.', 'No one to say it. Try again later.', 'That voice is not on the page right now.', 'Nobody answers.', 'It would be said, if anyone were here.', 'The line waits for its speaker.', 'Silence. Its speaker is out.', 'Not a soul to say it.'], { who: 'toast', lang: 'en' });

export function install(app) {}
