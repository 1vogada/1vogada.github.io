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
// ---- the mirror game (the new hand is out; the old one copies it from the floor) ----
defineLines('sev.mirror', ['anything you can do…', 'like this?', 'copy that.', 'I was doing this first', 'same. same.', 'и аз така!', 'まねっこ!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: the mirror game',
    when: 'An old hand that has met the new one is walking about in view while the arm is out. It sits up and copies every pose a beat late. Move the mouse round in circles and both their eyes follow it.' },
  gloss: { 'и аз така!': 'me too, like this!', 'まねっこ!': 'copycat!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
// ---- playing dead (the new hand came for it while it was up and about) ----
defineLines('sev.dead', ['*dies dramatically*', 'I am just a glove now', '(definitely not alive)', 'nobody home', 'x_x', 'умрях.', 'しーん…'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: plays dead',
    when: 'The new hand goes for it while it is walking about. It flops onto its back, fingers in the air, X for an eye.' },
  gloss: { 'умрях.': 'I died.', 'しーん…': '(dead silence)' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.twitch', ['eep!', 'ticklish!', 'hnnk', 'not the knuckle', 'that was a reflex', 'ой!', 'ひっ!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: twitches', when: 'Playing dead, it is poked, and it twitches. The new hand saw.' },
  gloss: { 'ой!': 'ow!', 'ひっ!': 'eek!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.spring', ['ALIVE! bye!', 'BOO! run!', 'cover blown!', 'you ruined it!', 'resurrection!', 'жив съм!', 'いきかえった!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: springs up', when: 'Tap it while it plays dead, before the new hand has made up its mind. It jumps up and runs off to the left.' },
  gloss: { 'жив съм!': 'I am alive!', 'いきかえった!': 'back to life!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.phew', ['and… scene.', 'Oscar-worthy, if I say so', 'and the award goes to…', 'it worked?!', 'best role of my life', 'фу, отървах се', 'あぶなかった'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: it worked', when: 'It played dead through both pokes and the new hand went away. It gets up and runs.' },
  gloss: { 'фу, отървах се': 'phew, I got away', 'あぶなかった': 'that was close' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
// ---- not paper (the new hand took it for a card) ----
defineLines('sev.notcard', ['I am NOT a card', 'do I look rectangular?!', 'wrong snack!', 'put me down, I am a HAND', 'no barcode, no deal', 'аз не съм карта!', 'カードじゃない!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: taken for a card', when: 'You held it out at the right edge like a card, and the new hand took it.' },
  gloss: { 'аз не съм карта!': 'I am not a card!', 'カードじゃない!': 'I am not a card!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.returned', ['…thanks?', 'rude, but thanks', 'I will take that as a compliment', 'ok that was weird', 'never do that again', 'благодаря… май', 'た、たすかった'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: handed back', when: 'The new hand decided it is not paper after all and put it down.' },
  gloss: { 'благодаря… май': 'thanks… I guess', 'た、たすかった': 'th-that was a close one' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
// ---- sewn back on ----
defineLines('sev.home', ['home!', 'reunited!', 'scoot over, wrist', 'I knew you would take me back', 'back where I belong', 'у дома!', 'ただいま!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: back on', when: 'You let go of it right at the stump before the new hand has grown. The arm pulls it back on.' },
  gloss: { 'у дома!': 'home!', 'ただいま!': 'I am home!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- the hitchhiker: it latches on to a card you picked up near it ----
defineLines('sev.latch', ['room for one more?', 'going my way?', 'hold the card!', 'free ride!', '*boing*', 'mind if I hang around?', 'ще се повозя', 'のせてー!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: hitches a ride',
    when: 'You pick up a card or a piece of one near an old hand. Now and then (one time in ten) it jumps on and hangs from the edge.' },
  gloss: { 'ще се повозя': 'I will take a ride', 'のせてー!': 'give me a ride!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.ride', ['this is the life', 'left a bit. no, your left', 'nice view from down here', 'are we there yet?', 'I could get used to this', 'carry on, driver', 'хубаво возене', 'らくちん'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: along for the ride', when: 'It dangles from the card while you carry it about gently.' },
  gloss: { 'хубаво возене': 'a nice ride', 'らくちん': 'comfy, no effort at all' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.cling', ['easy! EASY!', 'not so fast!', 'my fingers are slipping', 'I am going to be sick', 'hold… on…', 'стига си клатил!', 'ゆらさないで!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: hanging on', when: 'You swing the card it hangs from about too hard. Its grip is giving.' },
  gloss: { 'стига си клатил!': 'stop shaking it!', 'ゆらさないで!': 'do not shake it!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.whee', ['WHEEEEE!', 'I can FLYYY', 'worth it!', 'tell my fingers I loved them', 'wheeeee—oof', 'аааа-ха-ха!', 'わーい!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: lets go', when: 'Swung once too often, its grip gives out and it flies off the card.' },
  gloss: { 'аааа-ха-ха!': 'aaaa-ha-ha!', 'わーい!': 'wheee!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.dizzy', ['I am dizzy', 'five of you. hello, all five', 'the floor is moving', 'which way is up', 'again! …no. later.', 'вие ми се свят', 'くらくら…'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: dizzy', when: 'It has landed after flying off a card, and lies there with its eye rolling.' },
  gloss: { 'вие ми се свят': 'my head is spinning', 'くらくら…': 'so dizzy…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.alight', ['thanks for the lift', 'my stop', 'I will walk from here', 'five stars', 'благодаря за возенето', 'ここでおります'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: gets off', when: 'You put the card it hangs from down. Once the card lies still it lets go.' },
  gloss: { 'благодаря за возенето': 'thanks for the ride', 'ここでおります': 'I will get off here' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- the cheese pull: it jumps on a card the arm is dragging off the shelf ----
defineLines('sev.pounce', ['MINE!', 'not so fast, new guy', 'drop it!', 'I saw it first', 'share!', 'моя е!', 'まてー!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: pounces', when: 'The arm drags a card off the shelf while an old hand is about. Sometimes it jumps on the other end.' },
  gloss: { 'моя е!': 'it is mine!', 'まてー!': 'wait!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.cheese', ['pull! PULL!', 'it is stretching!', 'I had it first!', 'you let go!', 'my fingers are slipping!', 'дърпай, де!', 'はなしてよ!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: the cheese pull', when: 'It hangs on to its end of the card and pulls against the arm. The card stretches like hot cheese.' },
  gloss: { 'дърпай, де!': 'come on, pull!', 'はなしてよ!': 'let go of it!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.cheeseEnd', ['half is mine!', 'ha! my half', 'fair and square', 'stretchy!', 'половината е моя', 'はんぶんゲット'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: its half', when: 'The card tears in two in the cheese pull. It falls with its half and crushes it where it lands.' },
  gloss: { 'половината е моя': 'half of it is mine', 'はんぶんゲット': 'got half!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- tug of war: the arm grabs the other end of the card it is crushing ----
defineLines('sev.wrest', ['get your own!', 'I was in the middle of something!', 'you have a whole ARM, cheater', 'hnnngh… mine…', 'help! anyone with fingers!', 'няма да го пусна!', 'ぜったい はなさない!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: tug of war', when: 'It is crushing a card near the right edge when the arm grabs the other end. It hangs on to its end and pulls.' },
  gloss: { 'няма да го пусна!': 'I won\'t let it go!', 'ぜったい はなさない!': 'I will never let go!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.wrestSlip', ['you clicked me?! YOU?!', 'my grip! nooo—', 'traitor pointerrr', 'I was WINNING', 'whose cursor is that?!', 'изплъзна ми се!', 'すべったー!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: slips', when: 'In the tug of war, you click the old hand. Its fingers slip and it flies off; the arm keeps the card.' },
  gloss: { 'изплъзна ми се!': 'it slipped out of my hand!', 'すべったー!': 'I slipped!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.wrestWon', ['ha! weak wrist!', 'finders keepers, arm', 'all of it. ALL OF IT.', 'thank you, kind stranger', 'now, where was I…', 'победа!', 'しょうりー!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: wins the tug of war', when: 'In the tug of war, you click the arm and its claws slip (or its hand is cut off). The old hand has the whole card and crushes it after all.' },
  gloss: { 'победа!': 'victory!', 'しょうりー!': 'I won!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.wrestEnd', ['I got the end with the words', 'half a card is still a card', 'next time I keep both halves', 'it screamed in two directions', 'good enough to squeeze', 'и това е нещо', 'まあいいか'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: half a card', when: 'The card tears in two in the tug of war. The old hand crushes its half where it is.' },
  gloss: { 'и това е нещо': 'that is something, at least', 'まあいいか': 'oh well, good enough' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- a gift for you: it brings you a ball of the card it crushed ----
defineLines('sev.fetch', ['coming, coming', 'look what I made', 'wait till you see this', 'hold still, it is for you', 'nobody touch it', 'идвам, идвам', 'まっててね'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: brings you something', when: 'It crushes a card while your mouse pointer rests on the page. It keeps a ball of it and carries it over to you.' },
  gloss: { 'идвам, идвам': 'coming, coming', 'まっててね': 'wait for me' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.gift', ['for you.', 'I made you this', 'a present!', 'do not say I never gave you anything', 'it was a card. now it is art.', 'за теб', 'どうぞ'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: a gift', when: 'It puts the crumpled ball down at your feet, below the cursor, like a cat with a mouse, and waits.' },
  gloss: { 'за теб': 'for you', 'どうぞ': 'here you are' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.regift', ['that was for THEM', 'I worked hard on that', 'ungrateful thing', 'you could have said thanks', 'това беше подарък!', 'せっかくのプレゼントが…'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: its gift was eaten', when: 'You throw the ball it brought you at the new hand, and the new hand eats it.' },
  gloss: { 'това беше подарък!': 'that was a present!', 'せっかくのプレゼントが…': 'and it was a present…' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- rock, paper, scissors with the new hand (scenes/rps.js) ----
defineLines('sev.rpsYes', ['you are ON', 'I invented this game', 'fine. no cheating.', 'I have five fingers too', 'давай!', 'のぞむところだ'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: takes the challenge', when: 'The new hand challenges it to rock, paper, scissors. It stands up on its wrist.' },
  gloss: { 'давай!': 'come on!', 'のぞむところだ': 'bring it on' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.coached', ['got it, boss', 'ok ok ok', 'trust me', 'are you sure?', 'shh, it will hear you', 'разбрах', 'りょうかい'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: you coach it', when: 'Type r, p or s while they count: it plays your pick.' },
  gloss: { 'разбрах': 'got it', 'りょうかい': 'roger' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.rpsWon', ['HA! still got it', 'the original is the best', 'the old ways are best', 'bow to me', 'спечелих!', 'かったー!'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: wins', when: 'It beats the new hand at rock, paper, scissors, and dances. The new hand sulks off.' },
  gloss: { 'спечелих!': 'I won!', 'かったー!': 'I wooon!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.rpsLost', ['best of three?', 'that was a practice round', 'oh no', 'I want a lawyer', 'загубих…', 'まけた…'], {
  who: 'sev',
  trigger: { title: 'The cut-off hand: loses', when: 'The new hand beats it at rock, paper, scissors. Now it is fair game.' },
  gloss: { 'загубих…': 'I lost…', 'まけた…': 'I lost…' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- the hand tower (src/actors/severed/tower.js) ----
defineLines('sev.towerCall', ['tower time!', 'assemble, fingers!', 'everyone to the edge', 'we have a plan. it is a bad plan.', 'today we reach the arm', 'formation! like we practised', 'кула!', 'たいけつだ、あつまれ!'], {
  who: 'sev',
  trigger: { title: 'The hand tower: gathering', when: 'Three old hands that have met the new hand, the arm lurking at the right edge: after a while they all scuttle to the edge.' },
  gloss: { 'кула!': 'tower!', 'たいけつだ、あつまれ!': 'showdown, gather up!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.towerBrace', ['I am the foundation', 'climb, I am braced', 'mind the knuckles', 'why am I always the bottom one', 'go go go, I can hold it', 'лек си, нали?', 'したはまかせろ'], {
  who: 'sev',
  trigger: { title: 'The hand tower: the bottom one braces', when: 'The old hand nearest the edge stands on its wrist, fingers spread wide, for the others to climb on.' },
  gloss: { 'лек си, нали?': 'you are light, right?', 'したはまかせろ': 'leave the bottom to me' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.towerClimb', ['excuse my fingers', 'do not look up', 'sorry, was that your eye?', 'one more knuckle…', 'hup!', 'ставам, ставам', 'のぼるよ!'], {
  who: 'sev',
  trigger: { title: 'The hand tower: climbing up', when: 'Each of the other two climbs up and over the one below and stands on its fingertips.' },
  gloss: { 'ставам, ставам': 'getting up, getting up', 'のぼるよ!': 'climbing up!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.towerReach', ['almost… almost…', 'come closer, big guy', 'just a little lower', 'we only want to talk', 'I can see the wrist!', 'ела насам…', 'もうちょっと…'], {
  who: 'sev',
  trigger: { title: 'The hand tower: the top one reaches', when: 'All three are up. The top one stretches towards the arm at the edge.' },
  gloss: { 'ела насам…': 'come over here…', 'もうちょっと…': 'a little more…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.towerPull', ['got it! PULL!', 'heave-ho, team!', 'all together now!', 'out you come!', 'pull like you mean it', 'теглете!', 'せーの!'], {
  who: 'sev',
  trigger: { title: 'The hand tower: got it', when: 'The arm leaned in to look and the top one grabbed it by the wrist. They all pull.' },
  gloss: { 'теглете!': 'pull, all of you!', 'せーの!': 'heave-ho!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.towerFell', ['the tower is down!', 'we were SO close', 'who moved?!', 'I told you I was ticklish', 'whose idea was this', 'рухнахме…', 'くずれた!'], {
  who: 'sev',
  trigger: { title: 'The hand tower: it comes down', when: 'You pick one of them off, something knocks it, or the arm does not come: down they all go.' },
  gloss: { 'рухнахме…': 'we collapsed…', 'くずれた!': 'it fell apart!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('sev.towerHeap', ['worth it', 'did we win?', 'get your thumb out of my palm', 'again tomorrow?', 'I can see my house from here', 'всичко ме боли', 'めがまわる…'], {
  who: 'sev',
  trigger: { title: 'The hand tower: in a heap', when: 'The arm shook them off. They land in a heap, seeing stars.' },
  gloss: { 'всичко ме боли': 'everything hurts', 'めがまわる…': 'my head is spinning…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

export function install(app) {}
