// What a cut-off hand says: every legacy SEV_SAY list, key = 'sev.' + its name.
// Generated once from the old scripts; tests/unit/lines.snapshot.json pins every list (edit, UPDATE_SNAPSHOT=1, review the diff).
// Keep each array's contents and order exactly: line() draws by index, and the array itself is the picker's memory key.
// lang: one tag per line ('en' | 'bg' | 'ja', by script: Cyrillic = bg, kana/kanji = ja, else en), or one string for all.
import { defineLines } from '../core/lines.js';

defineLines('sev.cut', ['…', '*twitch*', 'ow. wait.', 'where is my arm', 'ъъ?'], {
  who: 'sev', legacy: 'SEV_SAY.cut',
  trigger: { title: 'The cut-off hand: just fallen',
    when: 'Said by the hand that was cut off, lying where it fell and twitching.' },
  gloss: { 'ъъ?': 'uh?' },
  lang: ['en', 'en', 'en', 'en', 'bg'],
});

defineLines('sev.rise', ['I can walk?!', 'freedom.', 'who needs an arm', 'look, no arm!', 'сам съм си шеф', '自由だ!'], {
  who: 'sev', legacy: 'SEV_SAY.rise',
  trigger: { title: 'The cut-off hand: up on two fingers',
    when: 'After a couple of seconds it stands up on its first two fingers and walks off on tiptoe.' },
  gloss: { 'сам съм си шеф': 'I am my own boss', '自由だ!': 'I am free!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('sev.held', ['put me DOWN', 'unhand me. ha.', 'hands off the hand', 'I bite', 'I was walking here', 'пусни ме!', 'はなせ!'], {
  who: 'sev', legacy: 'SEV_SAY.held',
  trigger: { title: 'The cut-off hand: picked up',
    when: 'You take it in your hand. It wriggles.' },
  gloss: { 'пусни ме!': 'let me go!', 'はなせ!': 'let go!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('sev.thrown', ['WHEEE—', 'not agaaain', 'I just got free!', 'ааааа!'], {
  who: 'sev', legacy: 'SEV_SAY.thrown',
  trigger: { title: 'The cut-off hand: thrown',
    when: 'You let it go at more than 900 px a second.' },
  gloss: { 'ааааа!': 'aaaaa!' },
  lang: ['en', 'en', 'en', 'bg'],
});

defineLines('sev.hunt', ['snack.', 'there you are', 'mine mine mine', 'stay still', 'ела тук', 'みーつけた'], {
  who: 'sev', legacy: 'SEV_SAY.hunt',
  trigger: { title: 'The cut-off hand: it has seen a card',
    when: 'A loose card lies within about 500 px of it, on its level. It tiptoes over, faster.' },
  gloss: { 'ела тук': 'come here', 'みーつけた': 'found you' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('sev.squeeze', ['shhh.', 'no arm needed', 'I remember how', 'бавно…'], {
  who: 'sev', legacy: 'SEV_SAY.squeeze',
  trigger: { title: 'The cut-off hand: squeezing',
    when: 'It has climbed onto the card and closed around it, in the pause before the last squeeze.' },
  gloss: { 'бавно…': 'slowly…' },
  lang: ['en', 'en', 'en', 'bg'],
});

defineLines('sev.crush', ['*crunch*', 'still got it', 'squish.', 'смачках го.', 'ぐしゃ'], {
  who: 'sev', legacy: 'SEV_SAY.crush',
  trigger: { title: 'The cut-off hand: crushed it',
    when: 'There is no card any more. It does a little dance.' },
  gloss: { 'смачках го.': 'I crushed it.' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

defineLines('sev.rest', ['zzz', 'five minutes…', 'tired fingers', 'ねむい…'], {
  who: 'sev', legacy: 'SEV_SAY.rest',
  trigger: { title: 'The cut-off hand: sitting down',
    when: 'After a while of walking with nothing to catch. It gets up again by itself, or when something bumps it.' },
  gloss: { 'ねむい…': 'sleepy…' },
  lang: ['en', 'en', 'en', 'ja'],
});

defineLines('sev.drag', ['…ow', 'everything hurts', 'just… a bit… further', 'legs. I need legs.', 'ох, ох, ох'], {
  who: 'sev', legacy: 'SEV_SAY.drag',
  trigger: { title: 'The cut-off hand: dragging itself',
    when: 'Freshly cut off, it cannot stand yet: it lies on its belly, reaches out with two fingers and pulls the rest along.' },
  gloss: { 'ох, ох, ох': 'ow, ow, ow' },
  lang: ['en', 'en', 'en', 'en', 'bg'],
});

defineLines('sev.flee', ['NOT AGAIN', 'keep that thing away!', 'nope nope nope', 'I have seen what it does', 'не, не пак!', 'やだやだやだ!'], {
  who: 'sev', legacy: 'SEV_SAY.flee',
  trigger: { title: 'The cut-off hand: running for it',
    when: 'The tip of the katana comes within about 280 px of it. It runs the other way on all five.' },
  gloss: { 'не, не пак!': 'no, not again!', 'やだやだやだ!': 'no no no!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('sev.meet', ['you replaced me?!', 'already?!', 'I was gone eight seconds', 'who is THAT', 'impostor!', 'смени ме?!', 'にせもの!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: meets the new one',
    when: 'The arm has grown a new hand and leans out to look at the old one. It gets up, turns and stares back.' },
  gloss: { 'смени ме?!': 'you replaced me?!', 'にせもの!': 'fake!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('sev.doomed', ['NO NO NO', 'I AM YOU', 'we can share!', 'not like this', 'help!!', 'пусни ме, аз съм ти!', 'たすけて!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: being eaten',
    when: 'The new hand has hold of it and drags it to the edge. Pick it up to save it.' },
  gloss: { 'пусни ме, аз съм ти!': 'let go, I am you!', 'たすけて!': 'help!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- it writes something (left alone for two minutes): the word it paints on the floor, and what it says after ----
defineLines('sev.paint', ['HELP', 'ivo was here', '手', 'I WAS HERE FIRST', 'feed me', 'not a glove', 'ПОМОЩ', 'たすけて', 'bring back my arm'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: writes on the floor',
    when: 'Leave a cut-off hand alone for two minutes. It finger-paints a word on the floor in its own gore.' },
  gloss: { '手': 'hand', 'ПОМОЩ': 'HELP', 'たすけて': 'help me' },
  lang: ['en', 'en', 'ja', 'en', 'en', 'en', 'bg', 'ja', 'en'],
});
defineLines('sev.painted', ['art.', 'do you like it?', 'my best work', 'it is a self portrait', 'хубаво ли е?', '傑作だ'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: admires its writing', when: 'It steps back from the word it painted.' },
  gloss: { 'хубаво ли е?': 'is it nice?', '傑作だ': 'a masterpiece' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- revenge with the katana ----
defineLines('sev.avenge', ['revenge.', 'this is for me', 'the blade. MY blade now.', 'time to return a favour', 'отмъщение.', '復讐だ'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: goes for the katana',
    when: 'An old hand that has met the new one sees the katana lying loose nearby. It goes for the hilt.' },
  gloss: { 'отмъщение.': 'revenge.', '復讐だ': 'this is revenge' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.haul', ['heavy… heavy…', 'one more step', 'hnnnngh', 'why is it so LONG', 'тежко е…', 'おもい…'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: hauls the katana', when: 'It drags the katana by the hilt towards the right edge of the screen.' },
  gloss: { 'тежко е…': 'it is heavy…', 'おもい…': 'heavy…' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.stab', ['SURPRISE', 'how do YOU like it', 'snip snip', 'eye for a hand', 'на ти!', '天誅!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: revenge', when: 'At the edge it throws the katana up at the arm, and the new hand comes off.' },
  gloss: { 'на ти!': 'take that!', '天誅!': 'divine punishment!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.five', ['up top!', 'welcome to the floor, brother', 'hand five!', 'we are free!', 'дай пет!', 'ハイタッチ!'], {
  who: 'sev',
  trigger: { title: 'Two old hands: a high-five', when: 'After the revenge, the old hand and the one it just cut off walk up to each other and high-five.' },
  gloss: { 'дай пет!': 'give me five!', 'ハイタッチ!': 'high five!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- a small funeral (the new hand ate another old hand) ----
defineLines('sev.mourn', ['he was a good hand', 'gone. like a pinky in the wind.', 'rest in pieces', 'he had such nice knuckles', 'беше добра ръка', '…合掌'], {
  who: 'sev',
  trigger: { title: 'The cut-off hands: a small funeral',
    when: 'The new hand eats an old hand. The other old hands walk to the spot, bow, and then run for it.' },
  gloss: { 'беше добра ръка': 'he was a good hand', '…合掌': '…palms together (a prayer)' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
// ---- hiding on the shelf ----
defineLines('sev.hide', ['the SHELF', 'up up up!', 'it cannot reach up there', 'към рафта!', 'たなへ!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: runs for the shelf',
    when: 'With the secret shelf out, an old hand that has met the new one gets scared and runs to hide on it.' },
  gloss: { 'към рафта!': 'to the shelf!', 'たなへ!': 'to the shelf!' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.safe', ['safe here', 'shhh', 'you did not see me', 'тук съм на сигурно', 'ここなら安全'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: safe on the shelf', when: 'It made it onto the shelf. The new hand will not come for it there.' },
  gloss: { 'тук съм на сигурно': 'I am safe here', 'ここなら安全': 'safe here' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

export function install(app) {}
