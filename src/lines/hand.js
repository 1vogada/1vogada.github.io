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

// toast: a one-line list, no random draw
defineLines('toast.severed', ['You cut its hand off. It will grow another. The old one has plans of its own.'], { who: 'toast', lang: 'en' });

export function install(app) {}
