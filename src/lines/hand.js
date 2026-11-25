// What the arm's hand says: every legacy CLAW_SAY list, key = 'hand.' + its name.
// The first rip after each page load is always hand.rip[0] (CHEESE PULL): say(claw, 'hand.rip', { first: { id: 'cheese', text: list('hand.rip')[0] } }).
// Generated once from the old scripts; tests/unit/lines.snapshot.json pins every list (edit, UPDATE_SNAPSHOT=1, review the diff).
// Keep each array's contents and order exactly: line() draws by index, and the array itself is the picker's memory key.
// lang: one tag per line ('en' | 'bg' | 'ja', by script: Cyrillic = bg, kana/kanji = ja, else en), or one string for all.
import { defineLines } from '../core/lines.js';

defineLines('hand.eager', ['gimme', 'ooh. snack.', 'closer…', 'GIVE.', 'yes yes yes', 'do not test me', 'I will take it', 'дай!', 'ちょうだい'], {
  who: 'hand', legacy: 'CLAW_SAY.eager',
  trigger: { title: 'Wanting',
    when: 'You carry a loose card towards the right edge of the screen. Said again if you keep it waiting.' },
  gloss: { 'дай!': 'give!', 'ちょうだい': 'give it to me' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.grab', ['mine.', 'GOT IT', 'thank you!', 'мое!', 'いただき!'], {
  who: 'hand', legacy: 'CLAW_SAY.grab',
  trigger: { title: 'Taking hold',
    when: 'You bring the card within its reach and it closes its fingers on the far end. The tug of war begins.' },
  gloss: { 'мое!': 'mine!', 'いただき!': 'got it!' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.tug', ['stretchy…', 'let gooo', 'pull harder', 'hnnngh', "it's MINE", 'разтяга се…', 'のびる…'], {
  who: 'hand', legacy: 'CLAW_SAY.tug',
  trigger: { title: 'In the tug of war',
    when: 'You pull against it hard enough that its grip starts to slip.' },
  gloss: { 'разтяга се…': 'it stretches…', 'のびる…': 'it stretches…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// rip[0] is the forced first rip line (CHEESE PULL)
defineLines('hand.rip', ['CHEESE PULL!!!!', 'CHEESE PULL!!!!', 'CHEESE PULL!!!!', 'RIIIP', 'half is fine!', 'again! again!', 'チーズ!!!', 'СИРЕНЕ!!!'], {
  who: 'hand', legacy: 'CLAW_SAY.rip',
  trigger: { title: 'A card comes apart',
    when: 'A card is torn out of the grid while it watches, or torn in half between the two of you.' },
  gloss: { 'チーズ!!!': 'CHEESE!!!', 'СИРЕНЕ!!!': 'CHEESE!!!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'ja', 'bg'],
});

defineLines('hand.eat', ['nom.', '*crunch*', 'papery.', 'needs salt', 'ごちそうさま', 'ммм.'], {
  who: 'hand', legacy: 'CLAW_SAY.eat',
  trigger: { title: 'Eating',
    when: 'It drags its half of the card off the screen.' },
  gloss: { 'ごちそうさま': 'thank you for the meal', 'ммм.': 'mmm.' },
  lang: ['en', 'en', 'en', 'en', 'ja', 'bg'],
});

defineLines('hand.keep', ['mine.', 'hehehe', 'no take-backs', 'finders keepers', 'хе-хе'], {
  who: 'hand', legacy: 'CLAW_SAY.keep',
  trigger: { title: 'Winning the whole card',
    when: 'You let go during the tug of war.' },
  gloss: { 'хе-хе': 'heh-heh' },
  lang: ['en', 'en', 'en', 'en', 'bg'],
});

defineLines('hand.toss', ['bored.', 'catch.', 'yeet', 'tastes like JavaScript', 'いらない'], {
  who: 'hand', legacy: 'CLAW_SAY.toss',
  trigger: { title: 'Bored of it',
    when: 'It has held a card for two seconds. The card comes back, and about one time in three it comes back hard.' },
  gloss: { 'いらない': 'do not want it' },
  lang: ['en', 'en', 'en', 'en', 'ja'],
});

defineLines('hand.small', ['too small.', 'crumbs?!', 'that is a scrap', 'I said a CARD', 'not worth chewing', 'bring the rest', 'трохи?!', 'ちっちゃい…'], {
  who: 'hand',
  trigger: { title: 'A scrap',
    when: 'You offer it, or throw it, a scrap: a piece under a quarter of a card. It will not have it: held out, it turns away; thrown, it bats it back. With a bigger piece it does all it does with a whole card.' },
  gloss: { 'трохи?!': 'crumbs?!', 'ちっちゃい…': 'so tiny…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.sulk', ['aww.', 'tease.', 'rude.', 'fine.', 'ケチ', 'пф.'], {
  who: 'hand', legacy: 'CLAW_SAY.sulk',
  trigger: { title: 'Sulking',
    when: 'You tempt it and take the card away, or the thing it was holding is cut or smashed.' },
  gloss: { 'ケチ': 'stingy', 'пф.': 'pff.' },
  lang: ['en', 'en', 'en', 'en', 'ja', 'bg'],
});

// what it has to say about things it only watches
defineLines('hand.cut', ['ooh, sharp.', 'save me a slice', 'messy.', 'I could do that with my nails', 'thinner! thinner!', 'いい切れ味', 'режи, режи…'], {
  who: 'hand', legacy: 'CLAW_SAY.cut',
  trigger: { title: 'Watching a cut',
    when: 'It saw the katana divide a card.' },
  gloss: { 'いい切れ味': 'a fine edge', 'режи, режи…': 'cut, cut…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'ja', 'bg'],
});

defineLines('hand.stab', ['finish it!', 'so close.', 'amateur.', 'I smell blood', 'again, deeper'], {
  who: 'hand', legacy: 'CLAW_SAY.stab',
  trigger: { title: 'Watching a stab',
    when: 'It saw the katana go in and come out the same way.' },
  lang: 'en',
});

defineLines('hand.smash', ['what a waste of a snack', 'boom.', 'I felt that', 'again!', 'бум!', 'もったいない'], {
  who: 'hand', legacy: 'CLAW_SAY.smash',
  trigger: { title: 'Watching a card shatter',
    when: 'It saw a thrown card break.' },
  gloss: { 'бум!': 'boom!', 'もったいない': 'what a waste' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.loose', ['fresh one!', 'bring it here', 'ooh, a loose one', 'that one looks tasty', 'дай го насам'], {
  who: 'hand', legacy: 'CLAW_SAY.loose',
  gloss: { 'дай го насам': 'hand it over here' },
  lang: ['en', 'en', 'en', 'en', 'bg'],
});

defineLines('hand.throw', ['wheee', 'over here!', 'pass it!', 'nice arm'], {
  who: 'hand', legacy: 'CLAW_SAY.throw',
  trigger: { title: 'Watching a throw',
    when: 'It saw you throw a card.' },
  lang: 'en',
});

defineLines('hand.katana', ['show-off.', 'I prefer claws', 'pointy.', 'keep that away from me', 'かっこつけ'], {
  who: 'hand', legacy: 'CLAW_SAY.katana',
  trigger: { title: 'On the katana',
    when: 'It saw you draw the katana, or take it in hand.' },
  gloss: { 'かっこつけ': 'show-off' },
  lang: ['en', 'en', 'en', 'en', 'ja'],
});

defineLines('hand.kdrop', ['butterfingers', 'clumsy.', 'ha.', 'and you call ME grabby'], {
  who: 'hand', legacy: 'CLAW_SAY.kdrop',
  trigger: { title: 'On the katana, dropped',
    when: 'It saw you drop the katana.' },
  lang: 'en',
});

defineLines('hand.caught', ['nice throw', 'CAUGHT IT', 'thanks!', 'delivery!', 'for me? again?', 'хванах!', 'ナイスパス!'], {
  who: 'hand', legacy: 'CLAW_SAY.caught',
  trigger: { title: 'A catch',
    when: 'You throw a card towards the right edge, and it plucks it out of the air.' },
  gloss: { 'хванах!': 'caught it!', 'ナイスパス!': 'nice pass!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.slip', ['slippery!', 'hey!!', 'no fair', 'my snack!'], {
  who: 'hand', legacy: 'CLAW_SAY.slip',
  trigger: { title: 'Losing its grip',
    when: 'You yank the card away the moment it grabs, or take back the card it was celebrating with.' },
  lang: 'en',
});

defineLines('hand.snatch', ['TOO SLOW', 'YOINK', 'MINE NOW', 'enough games', 'дай тука!', 'もらった!'], {
  who: 'hand', legacy: 'CLAW_SAY.snatch',
  trigger: { title: 'Out of patience',
    when: 'You have teased it for too long with a card just out of reach. The arm shoots out as far as it must.' },
  gloss: { 'дай тука!': 'give it here!', 'もらった!': 'mine now!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.savour', ['shhh.', 'slowly…', 'does it hurt?', 'look at me.', 'not yet.', 'one more squeeze', 'бавно…', 'まだだよ'], {
  who: 'hand', legacy: 'CLAW_SAY.savour',
  trigger: { title: 'Savouring',
    when: 'In the pauses of the crushing, while it turns the card over and looks at it.' },
  gloss: { 'бавно…': 'slowly…', 'まだだよ': 'not yet' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.shelf', ['ooh. left out for me?', 'a snack on a shelf', "don't mind if I do", 'nobody is looking…', 'unattended. mine.', 'какво имаме тук…', 'いただきます…'], {
  who: 'hand', legacy: 'CLAW_SAY.shelf',
  trigger: { title: 'The shelf',
    when: 'There is a secret written under the fog in the top right corner of the banner. With the shelf out, you leave a card lying on it and let go: it reaches for it, slowly.' },
  gloss: { 'какво имаме тук…': 'what have we here…', 'いただきます…': 'thanks for the meal… (said before eating)' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.severed', ['MY HAND!!', 'I NEEDED THAT', 'AAAAAAAAA', 'you… you CUT it', 'that was my favourite one', 'РЪКАТА МИ!!', '手がぁぁ!!'], {
  who: 'hand', legacy: 'CLAW_SAY.severed',
  trigger: { title: 'Its hand cut off',
    when: 'The very tip of the katana passes through its arm while the arm is out on the screen. The hand drops, and the arm whips back out of sight.' },
  gloss: { 'РЪКАТА МИ!!': 'MY HAND!!', '手がぁぁ!!': 'my haaand!!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.regrow', ['grew a new one.', 'ta-da.', 'I have spares', 'that one was old anyway', 'good as new', 'нова-новеничка', '生えた。'], {
  who: 'hand', legacy: 'CLAW_SAY.regrow',
  trigger: { title: 'A new hand',
    when: 'Some eight seconds after losing one. It comes back to show it off.' },
  gloss: { 'нова-новеничка': 'brand new', '生えた。': 'it grew back.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.crush', ['squish.', '*CRUNCH*', 'paper is weak', 'that is what teasing gets you', 'смачках го.', 'ぐしゃ'], {
  who: 'hand', legacy: 'CLAW_SAY.crush',
  trigger: { title: 'The crunch',
    when: 'The card it snatched is finally crushed.' },
  gloss: { 'смачках го.': 'I crushed it.' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// "Surprise me": you said no, so it settles it with a coin
defineLines('hand.ask', ['go there?', 'well? go there?', 'this one. go?', 'I picked this for you. go?', 'shall we?', 'отиваме ли?', '行く?'], {
  who: 'hand', legacy: 'CLAW_SAY.ask',
  trigger: { title: 'The question',
    when: 'Surprise me draws you a fortune and a project. It leans in beside the slip and asks, and asks once more if you have done nothing for seven seconds.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.heads', ['heads.', 'it is heads.', 'heads it is', 'ези.', '表。'], {
  who: 'hand', legacy: 'CLAW_SAY.heads',
  trigger: { title: 'Heads',
    when: 'The coin lands heads up, and it reads it out.' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.tails', ['tails.', 'it is tails.', 'tails it is', 'тура.', '裏。'], {
  who: 'hand', legacy: 'CLAW_SAY.tails',
  trigger: { title: 'Tails',
    when: 'The coin lands tails up, and it reads it out.' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.stay', ['you may stay. this time.', 'stay. for now.', 'you got lucky. stay.', 'остани. засега.', '今回だけだぞ。'], {
  who: 'hand', legacy: 'CLAW_SAY.stay',
  trigger: { title: 'Letting you stay',
    when: 'A moment after you win the toss, before it closes the slip for you.' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.hello', ['oh? a "no"?', 'hello there.', 'you said no. to ME?', 'hi. I live here.', 'picky, are we', 'здрасти.', 'やあ。'], {
  who: 'hand', legacy: 'CLAW_SAY.hello',
  trigger: { title: 'Answering a no',
    when: 'Surprise me offers you a project and you say No. The Hand comes out to see about that.' },
  gloss: { 'здрасти.': 'hi.', 'やあ。': 'hey.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.smashbtn', ['no "no".', 'WRONG BUTTONS.', 'not these.', 'I hate these two', 'my game. my buttons.', 'BAM.', 'не тези!', 'このボタン、きらい'], {
  who: 'hand', legacy: 'CLAW_SAY.smashbtn',
  trigger: { title: 'Smashing Yes and No',
    when: 'A few moments after it greets you, it slams itself down on the Yes and No buttons. They fly off the page in pieces.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.better', ['much better.', 'much better now.', 'there. better.', 'now we play MY game', 'see? nicer.', 'така е по-добре.', 'これでよし。'], {
  who: 'hand', legacy: 'CLAW_SAY.better',
  trigger: { title: 'Its own buttons',
    when: 'It snaps two fingers, and Heads and Tails poof in where Yes and No were.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.flip', ['heads or tails?', 'call it.', 'let the coin decide', 'one flip. no take-backs.', 'ези или тура?', '表か裏か?'], {
  who: 'hand', legacy: 'CLAW_SAY.flip',
  trigger: { title: 'The toss',
    when: 'It throws a coin and makes you call it, heads or tails.' },
  gloss: { 'ези или тура?': 'heads or tails?', '表か裏か?': 'heads or tails?' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.won', ['…fine.', 'lucky.', 'tch. stay then.', 'next time.', 'пф. късмет.', 'ちっ'], {
  who: 'hand', legacy: 'CLAW_SAY.won',
  trigger: { title: 'Beaten by a coin',
    when: 'You called it right. You may stay on the page.' },
  gloss: { 'пф. късмет.': 'pff. luck.', 'ちっ': 'tch' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.lost', ['WRONG.', 'ha. wrong side.', 'the coin has spoken', 'loser walks', 'не позна!', 'ハズレ!'], {
  who: 'hand', legacy: 'CLAW_SAY.lost',
  trigger: { title: 'The taunt',
    when: 'You called it wrong. It reaches over and presses Yes for you.' },
  gloss: { 'не позна!': 'wrong guess!', 'ハズレ!': 'miss!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.idgaf', ['you know what? idgaf.', 'actually, forget the coin', "you're going anyway", 'coin? what coin.', 'майната ѝ на монетата', 'どうでもいい。行け。'], {
  who: 'hand', legacy: 'CLAW_SAY.idgaf',
  trigger: { title: 'Not bothering with the coin',
    when: 'One toss in ten it pockets the coin and decides for you anyway.' },
  gloss: { 'майната ѝ на монетата': 'to hell with the coin', 'どうでもいい。行け。': 'whatever. go.' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.waiting', ['well?', 'tick tock', 'go on. press it.', 'or I press it for you', '3… 2…', 'хайде де', 'はやく'], {
  who: 'hand', legacy: 'CLAW_SAY.waiting',
  trigger: { title: 'Waiting on you',
    when: 'You lost the toss. Yes and No are back, and you have five seconds before it presses Yes for you.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.bye', ['BYE BYE', 'BYE BYEEE', 'HAHAHA BYE', 'see ya never', 'ЧАО-ЧАО!', 'バイバイ!'], {
  who: 'hand', legacy: 'CLAW_SAY.bye',
  trigger: { title: 'Seeing you off',
    when: 'You pressed neither button for five seconds, so its finger is on Yes. You are leaving.' },
  gloss: { 'ЧАО-ЧАО!': 'BYE-BYE!', 'バイバイ!': 'bye-bye!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.slap', ['no.', 'not yet!', '*slap*', 'hands off', 'I am not done', 'чакай!', 'だめ!'], {
  who: 'hand', legacy: 'CLAW_SAY.slap',
  trigger: { title: 'Knocking the buttons away',
    when: 'The first time you reach for Heads or Tails on a visit, it slaps, backhands or slams both buttons off the slip.' },
  gloss: { 'чакай!': 'wait!', 'だめ!': 'no!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.snap', ['ENOUGH.', 'FINE. FINE!', 'ugh. you are exhausting', 'stop poking things', 'стига вече!', 'もういい!'], {
  who: 'hand', legacy: 'CLAW_SAY.snap',
  trigger: { title: 'Snapping',
    when: 'Right after the buttons go flying. It has had enough of you.' },
  gloss: { 'стига вече!': 'enough already!', 'もういい!': 'that is enough!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.yourpick', ['go on then. pick.', 'pick. now.', 'your call. literally.', 'избирай.', '選べ。'], {
  who: 'hand', legacy: 'CLAW_SAY.yourpick',
  trigger: { title: 'Letting you pick',
    when: 'Half the time after it snaps, it lets you call it after all.' },
  gloss: { 'избирай.': 'pick.', '選べ。': 'pick.' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.secret', ['NOOOOOOO', 'NOOO! not the secret!', 'who told you about that?!', 'stop. right. there.', 'that is NOT for you', 'you were never supposed to find that', 'НЕЕЕЕЕ!', 'намери тайната!', 'не пипай това!', 'だめーーー!', 'ひみつが!', 'バレた!'], {
  who: 'hand', legacy: 'CLAW_SAY.secret',
  trigger: { title: 'The secret is out',
    when: 'You bring the pointer near the bottom-right corner of the fortune slip and the hidden × rises out of it. If it was not already out, it bursts in to protest.' },
  gloss: { 'НЕЕЕЕЕ!': 'NOOOOO!', 'намери тайната!': 'you found the secret!', 'не пипай това!': 'do not touch that!', 'だめーーー!': 'nooooo!', 'ひみつが!': 'my secret!', 'バレた!': 'busted!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'bg', 'bg', 'ja', 'ja', 'ja'],
});

defineLines('hand.escaped', ['...fine.', 'cheater.', 'I will remember this', 'nobody likes a sneak', 'ずるい', 'измамник.'], {
  who: 'hand', legacy: 'CLAW_SAY.escaped',
  trigger: { title: 'Escaped',
    when: 'You click the secret ×, and the slip closes under its nose. Also when you lose the toss and press No anyway.' },
  gloss: { 'ずるい': 'no fair', 'измамник.': 'cheat.' },
  lang: ['en', 'en', 'en', 'en', 'ja', 'bg'],
});

defineLines('hand.callit', ['call it already', 'heads? tails? anything?', 'the coin is getting dizzy', 'I can do this all day', 'it is a coin, not a test', 'ези или тура? хайде!', 'はやく決めて'], {
  who: 'hand', legacy: 'CLAW_SAY.callit',
  trigger: { title: 'Hurry up',
    when: 'The coin is spinning and you have not called it. Four seconds in it nags you.' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.mypick', ["I'll do it myself", 'too slow. mine.', 'give me that', 'сам ще избера', '貸して'], {
  who: 'hand', legacy: 'CLAW_SAY.mypick',
  trigger: { title: 'Picking for you',
    when: 'The other half of the time after it snaps, it pokes Heads or Tails itself. It also does when you leave the coin spinning for nine seconds.' },
  gloss: { 'сам ще избера': 'I will pick myself', '貸して': 'give it here' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

// it sent you away and you came back: it noticed, and wants a rematch
defineLines('hand.back', ["hmm. didn't like the repo?", 'back already?', 'oh. you again.', 'that bad, huh?', 'not your thing?', 'missed me?', 'you came back. cute.', 'върна се, а?', 'не ти хареса, а?', 'おかえり。', '気に入らなかった?'], {
  who: 'hand', legacy: 'CLAW_SAY.back',
  trigger: { title: 'You came back',
    when: 'It pressed Yes for you, and now you are on this page again. It noticed.' },
  gloss: { 'върна се, а?': 'you came back, huh?', 'не ти хареса, а?': 'did not like it, huh?', 'おかえり。': 'welcome back.', '気に入らなかった?': 'did you not like it?' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'bg', 'ja', 'ja'],
});

defineLines('hand.rematch', ['wanna play another coin toss?', 'another coin toss?', 'rematch. call it.', 'double or nothing?', 'same game. new coin.', 'heads or tails. again.', 'още едно хвърляне?', 'пак ли? ези или тура?', 'もう一回?', 'もう一度、表か裏か?'], {
  who: 'hand', legacy: 'CLAW_SAY.rematch',
  trigger: { title: 'The rematch',
    when: 'It draws you another project and tosses the coin again.' },
  gloss: { 'още едно хвърляне?': 'one more toss?', 'пак ли? ези или тура?': 'again? heads or tails?', 'もう一回?': 'one more time?', 'もう一度、表か裏か?': 'once more: heads or tails?' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'bg', 'ja', 'ja'],
});

// ---- the new hand and the old one (cut off earlier, still walking about) ----
defineLines('hand.meet', ['…is that my old hand?', 'oh. it is you.', 'hello, former me', 'I see you, leftovers', 'you look… worse', 'старата ми ръка?', 'ふるい手だ'], {
  who: 'hand',
  trigger: { title: 'Meeting the old hand',
    when: 'Its new hand has grown, and the one you cut off earlier comes into view. It leans out and has a look.' },
  gloss: { 'старата ми ръка?': 'my old hand?', 'ふるい手だ': 'it is the old hand' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.stolen', ['that was MY snack', 'the old one still eats?', 'greedy little thing', 'thief.', 'I saw that.', 'крадец!', 'どろぼう!'], {
  who: 'hand',
  trigger: { title: 'The old hand ate a card',
    when: 'The cut-off hand crushes a card while the new one is around. It takes note, and the old hand is fair game for a while.' },
  gloss: { 'крадец!': 'thief!', 'どろぼう!': 'thief!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.devour', ['waste not.', 'come here, old friend', 'nothing personal', 'you look tired. let me help', 'back where you belong', 'ела при мен', 'いただきます'], {
  who: 'hand',
  trigger: { title: 'Going for the old hand',
    when: 'The old hand is near the right edge and cannot get away: asleep, still crawling from the cut, or caught gloating over a card it stole. The new hand has met it and is not full.' },
  gloss: { 'ела при мен': 'come to me', 'いただきます': 'thanks for the meal (said before eating)' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.devoured', ['*burp*', 'tastes like me', 'recycling.', 'we are one again', 'better inside than out', 'хрус.', 'うまい'], {
  who: 'hand',
  trigger: { title: 'Ate the old hand',
    when: 'It drags the old hand off the edge of the screen. Then it is full for twenty seconds.' },
  gloss: { 'хрус.': 'crunch.', 'うまい': 'tasty' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('hand.robbed', ['HEY. that was me', 'give me back… me', 'fine. keep the leftovers', 'you are on ITS side?', 'ей, мое е!', 'ずるい!'], {
  who: 'hand',
  trigger: { title: 'You saved the old hand',
    when: 'You pick the old hand up while the new one is dragging it away.' },
  gloss: { 'ей, мое е!': 'hey, that is mine!', 'ずるい!': 'not fair!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- the mirror game: an old hand copies it from the floor ----
defineLines('hand.mirror', ['…is it copying me?', 'stop that.', 'I do it better', 'copycat.', 'that is MY move', 'спри да ме имитираш', 'まねするな'], {
  who: 'hand',
  trigger: { title: 'Copied', when: 'An old hand starts the mirror game while the arm is out. It notices, a moment later.' },
  gloss: { 'спри да ме имитираш': 'stop imitating me', 'まねするな': 'do not copy me' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- plays dead: it goes for an old hand that is awake ----
defineLines('hand.prod', ['you look slow today', 'dinner is walking', 'fresh. well, fresh-ish.', 'hold still, old friend', 'is that a limp I see?', 'стой мирно', 'じっとして'], {
  who: 'hand',
  trigger: { title: 'Going for an awake old hand',
    when: 'Now and then it goes for an old hand it has met even though it is walking about near the right edge. The old hand plays dead.' },
  gloss: { 'стой мирно': 'hold still', 'じっとして': 'stay still' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.gotcha', ['AHA. it moved.', 'dead things do not twitch', 'nice try.', 'I saw that finger', 'gotcha.', 'мръдна!', 'うごいた!'], {
  who: 'hand',
  trigger: { title: 'Caught playing dead', when: 'It pokes the old hand that plays dead, and the old hand twitches. Then it takes it.' },
  gloss: { 'мръдна!': 'it moved!', 'うごいた!': 'it moved!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.fooled', ['huh. broken.', 'never mind. it is off.', 'I do not eat the dead. I have standards.', 'poor thing.', 'it was like that when I got here', 'жалко.', 'かわいそうに'], {
  who: 'hand',
  trigger: { title: 'Fooled', when: 'The old hand plays dead and holds still through both pokes. It gives up and leaves it alone.' },
  gloss: { 'жалко.': 'what a pity.', 'かわいそうに': 'poor thing' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.tricked', ['…it was ALIVE?', 'it LIED to me', 'come back here!', 'I was SO close', 'you woke it up. thanks.', 'измамник!', 'だまされた!'], {
  who: 'hand',
  trigger: { title: 'Tricked', when: 'You tap the old hand while it plays dead. It springs up and runs, and the new hand is left poking the floor.' },
  gloss: { 'измамник!': 'cheat!', 'だまされた!': 'I was fooled!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- not paper: you hold an old hand out to it like a card ----
defineLines('hand.paper', ['ooh. a card?', 'for me?', 'gimme gimme', 'is that a new one?', 'a fresh one!', 'карта? за мен?', 'カードだ!'], {
  who: 'hand',
  trigger: { title: 'Not paper', when: 'Pick up an old (cut-off) hand and hold it out at the right edge, where you tease it with cards, for two seconds. It takes it for a card.' },
  gloss: { 'карта? за мен?': 'a card? for me?', 'カードだ!': 'a card!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.notpaper', ['wait. this is not paper.', 'this card has… knuckles.', 'why is it warm', 'cards do not have fingernails', 'hold on. this one blinked.', 'това не е хартия.', 'これ、紙じゃない'], {
  who: 'hand',
  trigger: { title: 'Not paper: the penny drops', when: 'It has taken the old hand out of your hand and has a good look at it.' },
  gloss: { 'това не е хартия.': 'this is not paper.', 'これ、紙じゃない': 'this is not paper' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.giveback', ['here. yours, I think.', 'no thanks. not in the mood for… that.', 'returning this.', 'I will pass.', 'too bony.', 'вземи си го', 'おかえしします'], {
  who: 'hand',
  trigger: { title: 'Not paper: handed back', when: 'Half the time it decides against eating the old hand it took for a card, and puts it down again.' },
  gloss: { 'вземи си го': 'take it back', 'おかえしします': 'I am giving this back' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- sewn back on: you gave it its old hand back while it was a stump ----
defineLines('hand.sewn', ['good as old.', 'it still fits!', 'hello again, me', 'who needs a new one', 'stitched. mostly.', 'като ново… почти', 'おかえり、わたし'], {
  who: 'hand',
  trigger: { title: 'Sewn back on', when: 'While the arm is a stump, carry the cut-off hand to it and let go of it right at the end. It goes back on, and no new hand grows.' },
  gloss: { 'като ново… почти': 'good as new… almost', 'おかえり、わたし': 'welcome back, me' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- are you still there? (the mouse has been still for 10 s) ----
defineLines('hand.idle', ['…hello?', 'you there?', 'poke.', 'are you asleep?', 'blink twice if you need help', 'ало?', 'もしもし?'], {
  who: 'hand',
  trigger: { title: 'Are you still there?',
    when: 'After a card has left its slot, leave the mouse still on the page for ten seconds. It creeps out and taps the cursor.' },
  gloss: { 'ало?': 'hello?', 'もしもし?': 'hello? (on the phone)' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.idleback', ['AH', 'I was not doing anything', 'carry on.', 'nothing to see here'], { who: 'hand', lang: 'en',
  trigger: { title: 'Caught poking', when: 'You move the mouse while it is tapping the cursor. It whips back out of sight.' } });

// ---- jealous: you have been carrying the old hand around ----
defineLines('hand.jealous', ['you never carry ME.', 'what does it have that I do not', 'I see how it is', 'и мен носи!', 'えこひいき…'], {
  who: 'hand',
  trigger: { title: 'Jealous', when: 'Pick up an old (cut-off) hand and carry it around for five seconds. The new hand leans in, drumming its fingers.' },
  gloss: { 'и мен носи!': 'carry me too!', 'えこひいき…': 'favouritism…' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});

// ---- squeezed: the window is too narrow while it is out ----
defineLines('hand.squeezed', ['too tight', 'mmmf. no room', 'who shrank the page?', 'I am being folded', 'тясно ми е', 'せまい!'], {
  who: 'hand',
  trigger: { title: 'Squeezed', when: 'Make the window very narrow while the hand is out. It is pressed flat against the edge.' },
  gloss: { 'тясно ми е': 'it is tight in here', 'せまい!': 'cramped!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.unsqueezed', ['ahh. better.', 'thank you.', 'phew'], { who: 'hand', lang: 'en',
  trigger: { title: 'Room again', when: 'You make the window wide again after it was squeezed.' } });

// ---- the coin lands on its edge (one toss in a hundred) ----
defineLines('hand.edge', ['…that has never happened.', 'it… stood up?', 'on its EDGE?', 'това не се случва', 'ありえない'], {
  who: 'hand',
  trigger: { title: 'Coin on its edge', when: 'One coin toss in a hundred lands on its edge and rolls off the slip.' },
  gloss: { 'това не се случва': 'this does not happen', 'ありえない': 'impossible' },
  lang: ['en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.edgepick', ['…you pick. I need to lie down.', 'fine. your call.', 'I am not touching that.'], { who: 'hand', lang: 'en',
  trigger: { title: 'You choose', when: 'After the coin rolls off on its edge, it leaves Yes and No to you.' } });

// ---- say "hand": you highlight the word and it comes for it (scenes/word.js) ----
defineLines('hand.word', ['you said my name?', 'did someone say hand?', 'HAND. that is me.', 'say it again. I dare you', 'oh, a word for me', 'that is MY word', 'ръка? викаш ли ме?', '手? よんだ?'], {
  who: 'hand',
  trigger: { title: 'Say "hand"', when: 'Once a card has left its slot, highlight the word "hand" anywhere on the page. It reaches in for it.' },
  gloss: { 'ръка? викаш ли ме?': 'hand? are you calling me?', '手? よんだ?': 'hand? did you call me?' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.wordgot', ['no more hand for you', 'that word is taken', 'I collect those', '*folds it into a pocket*', 'write your own', 'highlighted. delicious.', 'думата е моя.', 'この言葉、もらった'], {
  who: 'hand',
  trigger: { title: 'The word is gone', when: 'It pinched the highlighted word off the page and is dragging it out past the right edge.' },
  gloss: { 'думата е моя.': 'the word is mine.', 'この言葉、もらった': 'this word is mine now' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// toast: a one-line list, no random draw
defineLines('toast.devoured', ['It ate its old hand. Nothing goes to waste here.'], { who: 'toast', lang: 'en' });
defineLines('toast.severed', ['You cut its hand off. It will grow another. The old one has plans of its own.'], { who: 'toast', lang: 'en' });

// ---- the cheese pull: an old hand jumped on the card it drags off the shelf ----
defineLines('hand.cheese', ['it is MINE', 'you are me. let go.', 'heave!', 'unhand it. literally.', 'I grew back for THIS?', 'пусни го!', 'よこせ!'], {
  who: 'hand',
  trigger: { title: 'The cheese pull', when: 'It is dragging a card off the shelf when an old hand jumps on the other end. Both pull.' },
  gloss: { 'пусни го!': 'let go of it!', 'よこせ!': 'hand it over!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.cheeseEnd', ['fine. half each.', 'a draw. for now.', 'like cheese on a pizza', 'stringy.', 'we split the bill', 'по половинка', 'はんぶんこ'], {
  who: 'hand',
  trigger: { title: 'Half each', when: 'The card tears in two in the cheese pull. It drags its half off to eat.' },
  gloss: { 'по половинка': 'half each', 'はんぶんこ': 'half and half' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.cheeseWon', ['let go, leftovers', 'stronger with an arm', 'shoo.', 'nice try, old me', 'my snack, my rules', 'махай се!', 'ざんねんでした'], {
  who: 'hand',
  trigger: { title: 'Won the cheese pull', when: 'The old hand lets go of its end (you picked it up, say). The arm keeps the card whole and flicks the old hand away.' },
  gloss: { 'махай се!': 'get lost!', 'ざんねんでした': 'too bad for you' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- tug of war: it grabs the other end of a card an old hand is crushing ----
defineLines('hand.wrest', ['that one is spoken for', 'drop it, old me', 'I called dibs from the edge', 'two hands, one card. I like these odds.', 'it was going to waste', 'on three. THREE.', 'дай насам!', 'ひっぱれー!'], {
  who: 'hand',
  trigger: { title: 'Tug of war', when: 'An old hand is crushing a card near the right edge while the arm lurks there. Now and then the arm grabs the other end, and both pull. Said again while they pull.' },
  gloss: { 'дай насам!': 'give it here!', 'ひっぱれー!': 'pull!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.wrestWon', ['butterfingers!', 'all mine, every pixel', 'should have kept your grip, stumpy', 'the house always wins', 'thank you, kind clicker', 'ха! цялата!', 'いただきまーす'], {
  who: 'hand',
  trigger: { title: 'Won the tug of war', when: 'In the tug of war, you click the old hand: its fingers slip and it flies off (or you pick it up). The arm drags the whole card away and eats it.' },
  gloss: { 'ха! цялата!': 'ha! the whole of it!', 'いただきまーす': 'let\'s eat!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.wrestSlip', ['HEY. whose side are you on?', 'my claws! you tickled my claws!', 'that was a foul', 'I demand a rematch', 'traitor.', 'мръсна игра!', 'はんそくだ!'], {
  who: 'hand',
  trigger: { title: 'Lost the tug of war', when: 'In the tug of war, you click the arm: its claws slip and the old hand keeps the whole card. The arm sulks off.' },
  gloss: { 'мръсна игра!': 'dirty play!', 'はんそくだ!': 'that is a foul!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.wrestEnd', ['well. that went both ways.', 'tear along the dotted line', 'my half has the good corner', 'a fair split, I suppose', 'one card, two dinners', 'то се скъса', 'ちぎれた'], {
  who: 'hand',
  trigger: { title: 'Torn in the tug of war', when: 'Nobody clicks either hand in the tug of war: the card tears in two. The arm drags its half away to eat; the old hand crushes the other.' },
  gloss: { 'то се скъса': 'it tore', 'ちぎれた': 'it ripped apart' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- the gift: you throw the ball an old hand brought you at it ----
defineLines('hand.burp', ['*BUUURP*', 'pardon me.', 'oh, that was a good one', 'my compliments to the old me', 'crunchy. papery. burpy.', 'оригнах се', 'げっぷ'], {
  who: 'hand',
  trigger: { title: 'Burp', when: 'An old hand brought you a crumpled ball of a card it crushed. Throw it at the new hand: it catches it, eats it and burps.' },
  gloss: { 'оригнах се': 'I burped', 'げっぷ': 'burp' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- rock, paper, scissors with an old hand (scenes/rps.js) ----
defineLines('hand.rps', ['rock, paper, scissors. loser gets eaten.', 'settle this like hands?', 'best of one. go.', 'you and me. rock paper scissors.', 'I know all your moves', 'камък, ножица, хартия?', 'じゃんけんで勝負だ'], {
  who: 'hand',
  trigger: { title: 'Rock, paper, scissors', when: 'Now and then, when the new hand meets an old one, it comes out over it and challenges it. Type r, p or s during the count to shout a pick for the old hand.' },
  gloss: { 'камък, ножица, хартия?': 'rock, scissors, paper?', 'じゃんけんで勝負だ': 'let us settle it with janken' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.rpsShoot', ['SHOOT!', 'and… now!', 'rock! paper! scissors!', 'show!', 'камък-ножица-хартия!', 'じゃんけんぽん!'], {
  who: 'hand',
  trigger: { title: 'Rock, paper, scissors: shoot', when: 'Three pumps of the fist, and both show.' },
  gloss: { 'камък-ножица-хартия!': 'rock-scissors-paper!', 'じゃんけんぽん!': 'rock, paper, scissors!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.rpsDraw', ['again.', 'stop copying me', 'great minds…', 'we ARE the same hand', 'пак същото!', 'あいこでしょ!'], {
  who: 'hand',
  trigger: { title: 'Rock, paper, scissors: a draw', when: 'Both show the same. They go again (three rounds at most).' },
  gloss: { 'пак същото!': 'the same again!', 'あいこでしょ!': 'a tie, again!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.rpsWon', ['ha! dinner.', 'I always win', 'you know what this means', 'rules are rules', 'сега си мой', 'かった!'], {
  who: 'hand',
  trigger: { title: 'Rock, paper, scissors: it won', when: 'The old hand lost. It is fair game for the new one for a while.' },
  gloss: { 'сега си мой': 'now you are mine', 'かった!': 'I won!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.rpsLost', ['…fine. you win.', 'I was not even trying', 'I need a minute', 'nobody saw that', 'не е честно', 'くやしい…'], {
  who: 'hand',
  trigger: { title: 'Rock, paper, scissors: it lost', when: 'The old hand beat it. It sulks off out of sight for ten seconds.' },
  gloss: { 'не е честно': 'that is not fair', 'くやしい…': 'so frustrating…' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.rpsQuit', ['coward.', 'where are you going?', 'forfeit!', 'we were PLAYING', 'бягаш ли?', 'にげるな!'], {
  who: 'hand',
  trigger: { title: 'Rock, paper, scissors: called off', when: 'You pick the old hand up in the middle of the game.' },
  gloss: { 'бягаш ли?': 'running away?', 'にげるな!': 'do not run!' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- the hand tower (src/actors/severed/tower.js) ----
defineLines('hand.towerPeer', ['what are you three up to?', 'is that… a tower?', 'very impressive. now what?', 'I am just looking', 'cute. really cute.', 'какво правите там?', 'なにしてるの?'], {
  who: 'hand',
  trigger: { title: 'The hand tower: it leans in to look', when: 'Three old hands stand on each other at the right edge. Curious, the arm leans down to look.' },
  gloss: { 'какво правите там?': 'what are you doing there?', 'なにしてるの?': 'what are you doing?' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.pulled', ['hey! HEY! let go!', 'my elbow does not bend that way', 'I am not a rope!', 'unhand me! literally!', 'where are you taking me?!', 'this is NOT how arms work', 'пуснете ме!', 'はなせー!'], {
  who: 'hand',
  trigger: { title: 'The hand tower: pulled out', when: 'The tower has it by the wrist and drags it out onto the page, stretched far out of its corner.' },
  gloss: { 'пуснете ме!': 'let me go!', 'はなせー!': 'let gooo!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.shakeOff', ['OFF. GET OFF.', 'enough!', 'shoo! all of you!', 'I said let go!', 'shake shake SHAKE', 'махайте се!', 'どけー!'], {
  who: 'hand',
  trigger: { title: 'The hand tower: shaking them off', when: 'Pulled far enough, it shakes the three off.' },
  gloss: { 'махайте се!': 'get lost!', 'どけー!': 'out of my way!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.towerSulk', ['I am not talking about this', 'that was humiliating', 'I need to lie down', 'nobody saw that, right?', 'my poor wrist', 'унижение…', 'もうやだ…'], {
  who: 'hand',
  trigger: { title: 'The hand tower: it sulks', when: 'It shook them off and snaps back out of sight to sulk for a while.' },
  gloss: { 'унижение…': 'humiliation…', 'もうやだ…': 'I have had enough…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.towerSaved', ['phew. thank you.', 'I owe you one', 'that was far too close', 'my hero', 'I was about to win anyway', 'благодаря ти', 'たすかった…'], {
  who: 'hand',
  trigger: { title: 'The hand tower: you save it', when: 'You pick one of the old hands off the tower while they pull the arm: it comes down and the arm snaps back.' },
  gloss: { 'благодаря ти': 'thank you', 'たすかった…': 'saved…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.towerLaugh', ['ha! timber.', 'nice try, stack of thumbs', 'gravity, my friend', 'that was not even close', 'ten out of ten for effort', 'ха-ха, паднахте', 'おしかったね'], {
  who: 'hand',
  trigger: { title: 'The hand tower: it laughs', when: 'The tower comes down while the arm is looking at it.' },
  gloss: { 'ха-ха, паднахте': 'ha-ha, you fell', 'おしかったね': 'so close' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// ---- toast for the hand: you throw it the toast that fell off the screen (page/bread.js) ----
defineLines('hand.toast', ['toast. finally, real food', 'is that… bread?', 'carbs! at last!', 'you shouldn\'t have. really. give.', 'warm. crunchy. not a card.', 'a little burnt. just how I like it', 'no butter? rude.', 'breakfast is served', 'finally something without a link in it', 'it still has words on it. delicious words.', 'weeks of cards. and now: TOAST.', 'тост! най-сетне!', 'トーストだ!', 'やっとまともな飯'], {
  who: 'hand',
  trigger: { title: 'Toast!', when: 'You threw the toast that fell off the screen at the hand. It catches it out of the air.' },
  gloss: { 'тост! най-сетне!': 'toast! at last!', 'トーストだ!': 'it is toast!', 'やっとまともな飯': 'real food at last' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja', 'ja'],
});
defineLines('hand.toastEat', ['*crunch* (toasted)', 'tastes like a notification', 'needed jam', 'crumbs everywhere. worth it.', 'that message was delicious', 'mmm. sourdough.', 'better than paper', 'slightly burnt. ten out of ten.', 'I could get used to bread', 'more toasts. go poke more toasts.', 'хрупкаво.', 'さくさく'], {
  who: 'hand',
  trigger: { title: 'Ate the toast', when: 'It caught the toast and dragged it off the edge.' },
  gloss: { 'хрупкаво.': 'crunchy.', 'さくさく': 'crispy-crunchy' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
// ---- the old hand pokes you instead (idle-old): an old hand got to your still cursor first (behaviours/mine.js) ----
defineLines('hand.pesterMine', [
  "hey. that's MY job",
  'excuse me. I do the poking here.',
  'who said YOU could poke it?',
  'that is literally my one hobby',
  'step aside, amateur',
  "you're doing it wrong. watch.",
  'I was poking cursors before you were cut off',
  'get your own cursor',
  'unbelievable. replaced by my own leftovers',
  'I was GOING to poke it',
  'oh, so we BOTH poke now?',
  'this is my bit.',
  'ей, това е МОЯ работа',
  'それ、ぼくの仕事!'], {
  who: 'hand',
  trigger: { title: 'The old hand pokes you instead: “MY job”',
    when: 'With an old (cut-off) hand on the page, leave the mouse still. The old hand gets to the cursor first and pokes it; the new hand comes out to do the same and finds the job taken.' },
  gloss: { 'ей, това е МОЯ работа': 'hey, that is MY job', 'それ、ぼくの仕事!': "that's my job!" },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.pesterTurn', [
  'my turn',
  'MINE',
  'poke. your move.',
  'beat that',
  'I poke better',
  'faster, slowpoke',
  'ha! my turn',
  'and again',
  'still not waking up?',
  'out of my way',
  'tap tap tap',
  'watch the master',
  'мой ред!',
  'ぼくの番!'], {
  who: 'hand',
  trigger: { title: 'The old hand pokes you instead: taking turns',
    when: 'Keep the mouse still while both hands are at it. They take turns poking the cursor, faster and faster.' },
  gloss: { 'мой ред!': 'my turn!', 'ぼくの番!': 'my turn!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('hand.pesterBack', [
  'it started it',
  'we were just checking',
  'it was THIS one',
  'nobody poked anything',
  "it's awake! scatter!",
  'I was never poking anything',
  'not my idea',
  'a team effort. mostly me.',
  'carry on. we were never here',
  'I was winning',
  'не бях аз',
  '知らない!'], {
  who: 'hand',
  trigger: { title: 'The old hand pokes you instead: caught',
    when: 'You move the mouse while the two hands take turns poking it. The new hand whips back out of sight.' },
  gloss: { 'не бях аз': "it wasn't me", '知らない!': "I don't know anything!" },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
// ---- crazy mode: the arm bobs along (src/actors/hand/bob.js) ----
defineLines('hand.bob', ["I am not dancing. this is a twitch.", "ugh. fine. ONE song.", "my wrist just does this", "do not tell the cards", "I bob ironically", "I have a reputation, you know", "this beat is… acceptable", "nobody films this", "just keeping warm", "these old hands have no shame", "I'm only here for the snacks", "не танцувам, мърдам се", "おどってないし"], {
  who: 'hand',
  trigger: { title: "Crazy mode: bobbing along", when: "Crazy mode goes on while old hands are on the page. They dance; the arm comes in at the right edge and bobs along, pretending it is not." },
  gloss: {"не танцувам, мърдам се": "I'm not dancing, I'm fidgeting", "おどってないし": "I'm not dancing"},
  lang: ["en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "en", "bg", "ja"],
});
defineLines('hand.danced', ["oh, I saw that.", "nothing happened, sure", "smooth. very smooth.", "I have screenshots", "the floor misses you", "stretching. right.", "encore? no? shame.", "I never bobbed. you have no proof", "pretend all you like", "видях ви", "みてたよ"], {
  who: 'hand',
  trigger: { title: "Crazy mode: after the dance", when: "Crazy mode goes off and the old hands pretend they were never dancing. A little later, the arm comments." },
  gloss: {"видях ви": "I saw you", "みてたよ": "I was watching"},
  lang: ["en", "en", "en", "en", "en", "en", "en", "en", "en", "bg", "ja"],
});

export function install(app) {}
