// The phrasebook of kiripad.dev. A translate button in the header opens a near-fullscreen menu (one big card over the tinted page) that lists every line the cards,
// the katana and the hand can say, what sets each one off, and what the Bulgarian and Japanese ones mean.
// The lines themselves are NOT kept here: they are read from the page's own lists (window.__lines, set in index.html), so a line added
// there turns up in the menu by itself. Only the descriptions of the triggers and the translations live in this file.
(() => {
  const nav = document.querySelector('header.top .nav'); if (!nav) return;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  // Bump VER, and the ?v= on this file's script tag in index.html, whenever this file or the stylesheet changes. GitHub Pages caches each
  // file for ten minutes on its own, and a new script with an old stylesheet looks broken; the version makes them arrive as a pair
  const VER = 17;
  const here = (document.currentScript && document.currentScript.src) || '/scripts/phrasebook.js';

  // ---- what this file knows: which occasion each list belongs to. src = which list on window.__lines, key = which entry of it ----
  const CHAPTERS = [
    { id: 'cards', num: 'I', title: 'The Cards', head: 'Of the Cards',
      intro: 'The cards of this site are rooted in their grid and would like to stay there. Each one may be taken by any part of it and pulled; it will complain from the first pixel, and louder the worse you treat it. A card is never silent for long, but it will not speak twice within about a second and a half unless something new is done to it.',
      entries: [
        { src: 'SAY', key: 'pull', title: 'On being taken hold of', when: 'You begin to drag a card that still sits in its place in the grid. A card the Hand plucks out of the air says the same.' },
        { src: 'SAY', key: 'strain', title: 'Under strain', when: 'You have pulled some 160 px from where you took hold, and the root begins to lose its grip.' },
        { fig: 'strain' },
        { src: 'SAY', key: 'back', title: 'Let go in time', when: 'You release the card before it tears. It springs home, and gloats.' },
        { fig: 'back' },
        { src: 'SAY', key: 'rip', title: 'Torn out', when: 'You pull past 350 px, or hold the strain until the root gives up. The card comes loose in your hand.' },
        { fig: 'pull' },
        { src: 'SAY', key: 'throw', title: 'Thrown', when: 'A loose card is let go at more than 900 px a second.' },
        { fig: 'fly' },
        { src: 'SAY', key: 'land', title: 'A hard landing', when: 'The card strikes something at more than 500 px a second, and survives it.' },
        { fig: 'land' },
        { src: 'SAY', key: 'smash', title: 'Shattered', when: 'A thrown card meets a wall, the floor or another card at more than 1300 px a second. Only a thrown card breaks; one that is dropped or carried never does.' },
        { fig: 'smash' },
        { fig: 'stack' },
        { src: 'SAY', key: 'cutting', title: 'With the blade inside', when: 'The very tip of the katana has entered the card and has not yet come out.' },
        { src: 'SAY', key: 'stab', title: 'Stabbed, not cut', when: 'The tip leaves by the same side it came in through. The card is not divided, but it bleeds for a while.' },
        { src: 'SAY', key: 'slice', title: 'Cut in two', when: 'The tip goes in by one side and out by another. These are also the last words of a card torn in half between you and the Hand.' },
        { fig: 'cut' },
        { src: 'AGONY', key: 0, title: 'Stretched: the first degree', when: 'You and the Hand each hold an end of the same card, and it has begun to grow longer.' },
        { src: 'AGONY', key: 1, title: 'Stretched: the second degree', when: 'The card is pulled past a third of what it can bear. Also said in the Hand’s fist, while it is being crushed.' },
        { fig: 'stretch' },
        { src: 'AGONY', key: 2, title: 'Stretched: the third degree', when: 'The card is close to tearing, or close to being a ball of paper. The letters grow, redden and shake.' },
        { src: 'PANIC', key: 0, title: 'On the shelf: it has noticed', when: 'A card lies on the secret shelf and the Hand has started across the screen for it.' },
        { src: 'PANIC', key: 1, title: 'On the shelf: it is coming', when: 'The Hand is a third of the way there. The card shakes and hops and shuffles away from it.' },
        { fig: 'shelf' },
        { src: 'PANIC', key: 2, title: 'On the shelf: it is here', when: 'The Hand is nearly on it. Pick the card up and it is saved.' },
        { src: 'NOTME', key: null, title: 'Not me', when: 'Said by a loose card lying near the shelf while the Hand is coming for another.' },
        { src: 'BEG', key: null, title: 'Begging', when: 'In the Hand’s closed fist, in the quiet pause after the second squeeze.' },
        { fig: 'crush' },
      ] },
    { id: 'katana', num: 'II', title: 'The Katana', head: 'Of the Katana',
      intro: 'Hidden in the mist of the banner stands a katana, and it has a very high opinion of itself. It is drawn like a card, by pulling, and a double click keeps it in the hand. Only its very tip cuts, at any speed whatever. It speaks once and is then quiet for two seconds, however much it has done in the meantime.',
      entries: [
        { fig: 'katana' },
        { src: 'SAY', key: 'khello', title: 'Introducing itself', when: 'You tear it out of the banner, or double-click to take it in hand.' },
        { fig: 'mist' },
        { src: 'SAY', key: 'kbrag', title: 'Boasting', when: 'It has just cut a card in two while you were holding it. It boasts about two times in five.' },
        { fig: 'equip' },
        { src: 'SAY', key: 'kcut', title: 'Cutting by accident', when: 'It cuts a card with nobody holding it, on its way down the page.' },
        { fig: 'kfall' },
        { src: 'SAY', key: 'kdrop', title: 'Dropped', when: 'You let go of it.' },
      ] },
    { id: 'hand', num: 'III', title: 'The Hand', head: 'Of the Hand',
      intro: 'Something lives past the right edge of the screen, and it wants your cards. It shows itself only after the first card has been torn loose. It has one eye, on the back of the hand, and opinions on everything it sees. It never answers at once: every remark waits up to three seconds, and two full seconds always pass between any two things it says.',
      entries: [
        { src: 'CLAW_SAY', key: 'eager', title: 'Wanting', when: 'You carry a loose card towards the right edge of the screen. Said again if you keep it waiting.' },
        { fig: 'hand' },
        { src: 'CLAW_SAY', key: 'grab', title: 'Taking hold', when: 'You bring the card within its reach and it closes its fingers on the far end. The tug of war begins.' },
        { src: 'CLAW_SAY', key: 'tug', title: 'In the tug of war', when: 'You pull against it hard enough that its grip starts to slip.' },
        { src: 'CLAW_SAY', key: 'rip', title: 'A card comes apart', when: 'A card is torn out of the grid while it watches, or torn in half between the two of you.' },
        { src: 'CLAW_SAY', key: 'eat', title: 'Eating', when: 'It drags its half of the card off the screen.' },
        { src: 'CLAW_SAY', key: 'keep', title: 'Winning the whole card', when: 'You let go during the tug of war.' },
        { src: 'CLAW_SAY', key: 'toss', title: 'Bored of it', when: 'It has held a card for two seconds. The card comes back, and about one time in three it comes back hard.' },
        { src: 'CLAW_SAY', key: 'sulk', title: 'Sulking', when: 'You tempt it and take the card away, or the thing it was holding is cut or smashed.' },
        { fig: 'sulking' },
        { src: 'CLAW_SAY', key: 'snatch', title: 'Out of patience', when: 'You have teased it for too long with a card just out of reach. The arm shoots out as far as it must.' },
        { src: 'CLAW_SAY', key: 'savour', title: 'Savouring', when: 'In the pauses of the crushing, while it turns the card over and looks at it.' },
        { src: 'CLAW_SAY', key: 'crush', title: 'The crunch', when: 'The card it snatched is finally crushed.' },
        { fig: 'fist' },
        { src: 'CLAW_SAY', key: 'shelf', title: 'The shelf', when: 'There is a secret written under the fog in the top right corner of the banner. With the shelf out, you leave a card lying on it and let go: it reaches for it, slowly.' },
        { src: 'CLAW_SAY', key: 'severed', title: 'Its hand cut off', when: 'The very tip of the katana passes through its arm while the arm is out on the screen. The hand drops, and the arm whips back out of sight.' },
        { fig: 'severed' },
        { src: 'CLAW_SAY', key: 'regrow', title: 'A new hand', when: 'Some eight seconds after losing one. It comes back to show it off.' },
        { src: 'SEV_SAY', key: 'cut', title: 'The cut-off hand: just fallen', when: 'Said by the hand that was cut off, lying where it fell and twitching.' },
        { src: 'SEV_SAY', key: 'rise', title: 'The cut-off hand: up on two fingers', when: 'After a couple of seconds it stands up on its first two fingers and walks off on tiptoe.' },
        { src: 'SEV_SAY', key: 'held', title: 'The cut-off hand: picked up', when: 'You take it in your hand. It wriggles.' },
        { src: 'SEV_SAY', key: 'thrown', title: 'The cut-off hand: thrown', when: 'You let it go at more than 900 px a second.' },
        { src: 'SEV_SAY', key: 'hunt', title: 'The cut-off hand: it has seen a card', when: 'A loose card lies within about 500 px of it, on its level. It tiptoes over, faster.' },
        { src: 'SEV_SAY', key: 'squeeze', title: 'The cut-off hand: squeezing', when: 'It has climbed onto the card and closed around it, in the pause before the last squeeze.' },
        { src: 'SEV_SAY', key: 'crush', title: 'The cut-off hand: crushed it', when: 'There is no card any more. It does a little dance.' },
        { src: 'SEV_SAY', key: 'drag', title: 'The cut-off hand: dragging itself', when: 'Freshly cut off, it cannot stand yet: it lies on its belly, reaches out with two fingers and pulls the rest along.' },
        { src: 'SEV_SAY', key: 'flee', title: 'The cut-off hand: running for it', when: 'The tip of the katana comes within about 280 px of it. It runs the other way on all five.' },
        { src: 'SEV_SAY', key: 'rest', title: 'The cut-off hand: sitting down', when: 'After a while of walking with nothing to catch. It gets up again by itself, or when something bumps it.' },
        { src: 'CLAW_SAY', key: 'caught', title: 'A catch', when: 'You throw a card towards the right edge, and it plucks it out of the air.' },
        { fig: 'catch' },
        { src: 'CLAW_SAY', key: 'slip', title: 'Losing its grip', when: 'You yank the card away the moment it grabs, or take back the card it was celebrating with.' },
        { src: 'CLAW_SAY', key: 'cut', title: 'Watching a cut', when: 'It saw the katana divide a card.' },
        { src: 'CLAW_SAY', key: 'stab', title: 'Watching a stab', when: 'It saw the katana go in and come out the same way.' },
        { src: 'CLAW_SAY', key: 'smash', title: 'Watching a card shatter', when: 'It saw a thrown card break.' },
        { src: 'CLAW_SAY', key: 'throw', title: 'Watching a throw', when: 'It saw you throw a card.' },
        { src: 'CLAW_SAY', key: 'katana', title: 'On the katana', when: 'It saw you draw the katana, or take it in hand.' },
        { src: 'CLAW_SAY', key: 'kdrop', title: 'On the katana, dropped', when: 'It saw you drop the katana.' },
        { src: 'BOOK', key: null, title: 'Bored of your reading', when: 'You keep this menu open for 5 seconds. The Hand comes in and picks something to do, at random, again and again: throw a card at the left edge of the screen, eat one, ask you to help rip one, or take the scroll. It says these as it arrives and as it throws.' },
        { src: 'HELP', key: null, title: 'Asking for help', when: 'It pulls a card out of this menu and holds it out to you. Grab the card and pull it left, and it rips in two: you get half, it eats the other.' },
        { src: 'ALONE', key: null, title: 'Nobody helped', when: 'It held the card out for about eight seconds and you did not take the other end. It throws it instead.' },
        { src: 'SWAT', key: null, title: 'Swatted', when: 'You click the Hand while it is in this menu. It drops what it holds and stays away for at least five seconds.' },
        { fig: 'swat' },
        { src: 'GRUDGE', key: null, title: 'Back, and careful', when: 'About half the time it returns from a swat wary, and creeps towards the next card slowly.' },
        { src: 'ANGRY', key: null, title: 'Back, and angry', when: 'The other half of the time it returns furious: it reaches fast, throws three cards in a row, and may take hold of the scroll.' },
        { src: 'SCROLL', key: null, title: 'Shaking the scroll', when: 'It grabs the right edge of the menu and yanks the page up and down for two to four seconds, so you lose your place.' },
        { src: 'MORE', key: null, title: 'Still scrolling', when: 'Half the time it does not let go after that, and shakes the scroll for a few seconds more.' },
        { src: 'HIDE', key: null, title: 'Hiding', when: 'The other half it lets go, says this, and hides off the screen for a few seconds as if it was never there.' },
        { fig: 'scroll' },
        { src: 'CLAW_SAY', key: 'ask', title: 'The question', when: 'Surprise me draws you a fortune and a project. It leans in beside the slip and asks, and asks once more if you have done nothing for seven seconds.' },
        { src: 'CLAW_SAY', key: 'hello', title: 'Answering a no', when: 'Surprise me offers you a project and you say No. The Hand comes out to see about that.' },
        { src: 'CLAW_SAY', key: 'smashbtn', title: 'Smashing Yes and No', when: 'A few moments after it greets you, it slams itself down on the Yes and No buttons. They fly off the page in pieces.' },
        { src: 'CLAW_SAY', key: 'better', title: 'Its own buttons', when: 'It snaps two fingers, and Heads and Tails poof in where Yes and No were.' },
        { src: 'CLAW_SAY', key: 'flip', title: 'The toss', when: 'It throws a coin and makes you call it, heads or tails.' },
        { fig: 'coin' },
        { src: 'CLAW_SAY', key: 'heads', title: 'Heads', when: 'The coin lands heads up, and it reads it out.' },
        { src: 'CLAW_SAY', key: 'tails', title: 'Tails', when: 'The coin lands tails up, and it reads it out.' },
        { src: 'CLAW_SAY', key: 'won', title: 'Beaten by a coin', when: 'You called it right. You may stay on the page.' },
        { src: 'CLAW_SAY', key: 'stay', title: 'Letting you stay', when: 'A moment after you win the toss, before it closes the slip for you.' },
        { src: 'CLAW_SAY', key: 'lost', title: 'The taunt', when: 'You called it wrong. It reaches over and presses Yes for you.' },
        { src: 'CLAW_SAY', key: 'idgaf', title: 'Not bothering with the coin', when: 'One toss in ten it pockets the coin and decides for you anyway.' },
        { src: 'CLAW_SAY', key: 'waiting', title: 'Waiting on you', when: 'You lost the toss. Yes and No are back, and you have five seconds before it presses Yes for you.' },
        { src: 'CLAW_SAY', key: 'bye', title: 'Seeing you off', when: 'You pressed neither button for five seconds, so its finger is on Yes. You are leaving.' },
        { fig: 'press' },
        { src: 'CLAW_SAY', key: 'slap', title: 'Knocking the buttons away', when: 'The first time you reach for Heads or Tails on a visit, it slaps, backhands or slams both buttons off the slip.' },
        { src: 'CLAW_SAY', key: 'snap', title: 'Snapping', when: 'Right after the buttons go flying. It has had enough of you.' },
        { src: 'CLAW_SAY', key: 'secret', title: 'The secret is out', when: 'You bring the pointer near the bottom-right corner of the fortune slip and the hidden × rises out of it. If it was not already out, it bursts in to protest.' },
        { src: 'CLAW_SAY', key: 'escaped', title: 'Escaped', when: 'You click the secret ×, and the slip closes under its nose. Also when you lose the toss and press No anyway.' },
        { src: 'SAY', key: 'btnhi', title: 'The new buttons', when: 'After it snaps, a fresh Heads and Tails poof in and each says hello.' },
        { src: 'CLAW_SAY', key: 'yourpick', title: 'Letting you pick', when: 'Half the time after it snaps, it lets you call it after all.' },
        { src: 'CLAW_SAY', key: 'callit', title: 'Hurry up', when: 'The coin is spinning and you have not called it. Four seconds in it nags you.' },
        { src: 'CLAW_SAY', key: 'mypick', title: 'Picking for you', when: 'The other half of the time after it snaps, it pokes Heads or Tails itself. It also does when you leave the coin spinning for nine seconds.' },
        { src: 'CLAW_SAY', key: 'back', title: 'You came back', when: 'It pressed Yes for you, and now you are on this page again. It noticed.' },
        { src: 'CLAW_SAY', key: 'rematch', title: 'The rematch', when: 'It draws you another project and tosses the coin again.' },
      ] },
  ];
  // the only lines that live in this file: what the hand says while it empties this menu
  const RAID_SAY = ['boring.', 'too many words', 'less reading, more snacks', 'you read too slow', 'I am in this one!', 'spoilers.', 'YEET', 'next!', 'this one too', 'скука.', 'つまらない', 'ポイ'];
  const SWAT_SAY = ['OW!', 'hey!!', 'rude.', 'my knuckles!', 'I was reading that', 'what was that for', 'you hit me?!', 'ау!', 'боли!', '痛っ!', 'ひどい!'];
  const GRUDGE_SAY = ['fine. slowly.', 'gently, then', 'do not hit me', 'tiptoe…', 'I am being nice now', 'полека…', 'そーっと…'];
  const ANGRY_SAY = ['THAT IS IT', 'you asked for it', 'no more mister nice hand', 'NOW I am angry', 'сега ще видиш!', 'もう怒った!'];
  const SCROLL_SAY = ['lost your place?', 'where were we?', 'up! down! up!', 'wheeee', 'нагоре-надолу!', 'ぐるぐる〜'];
  const HELP_SAY = ['help me rip this', 'grab the other end!', 'you pull, I pull', 'hold this. PULL.', 'too tough for one hand', 'дърпай!', '手伝って!', '引っぱって!'];
  const ALONE_SAY = ['fine. alone then.', 'no help? ok.', 'useless.', 'I do everything here', 'сам ще си го…', 'もういい!'];
  const MORE_SAY = ['again!', 'not done', 'one more lap', 'still lost?', 'още!', 'もう一回!'];
  const HIDE_SAY = ['was not me.', 'you saw nothing', 'I was never here', '*hides*', 'не бях аз.', 'かくれんぼ!', '知らないよ'];
  // English only by default (scripts/lang.js): the hand's own lists in here are thinned the same way as the page's
  if (window.__lang === 'en' && window.__thin) window.__thin([RAID_SAY, SWAT_SAY, GRUDGE_SAY, ANGRY_SAY, SCROLL_SAY, HELP_SAY, ALONE_SAY, MORE_SAY, HIDE_SAY]);
  // what the Bulgarian and Japanese lines mean. A line that is missing here is simply printed without a gloss
  const GLOSS = {
    'дърпай!': 'pull!', '手伝って!': 'help me!', '引っぱって!': 'pull!', 'сам ще си го…': 'I will do it myself…', 'もういい!': 'forget it!', 'още!': 'more!', 'もう一回!': 'one more time!', 'не бях аз.': 'it was not me.', 'かくれんぼ!': 'hide and seek!', '知らないよ': 'I know nothing',
    'върна се, а?': 'you came back, huh?', 'не ти хареса, а?': 'did not like it, huh?', 'おかえり。': 'welcome back.', '気に入らなかった?': 'did you not like it?',
    'още едно хвърляне?': 'one more toss?', 'пак ли? ези или тура?': 'again? heads or tails?', 'もう一回?': 'one more time?', 'もう一度、表か裏か?': 'once more: heads or tails?',
    'чакай!': 'wait!', 'だめ!': 'no!', 'стига вече!': 'enough already!', 'もういい!': 'that is enough!', 'избирай.': 'pick.', '選べ。': 'pick.', 'сам ще избера': 'I will pick myself', '貸して': 'give it here', 'здрасти!': 'hi!', 'ей!': 'hey!', 'ето ни пак': 'here we are again', 'やあ!': 'hey!', 'こんにちは': 'hello', 'ただいま': 'we are home', 'おっす': 'yo', 'НЕЕЕЕЕ!': 'NOOOOO!', 'намери тайната!': 'you found the secret!', 'не пипай това!': 'do not touch that!', 'だめーーー!': 'nooooo!', 'ひみつが!': 'my secret!', 'バレた!': 'busted!', 'ずるい': 'no fair', 'измамник.': 'cheat.',
    'здрасти.': 'hi.', 'やあ。': 'hey.', 'ези или тура?': 'heads or tails?', '表か裏か?': 'heads or tails?', 'пф. късмет.': 'pff. luck.', 'ちっ': 'tch',
    'не позна!': 'wrong guess!', 'ハズレ!': 'miss!', 'майната ѝ на монетата': 'to hell with the coin', 'どうでもいい。行け。': 'whatever. go.', 'ЧАО-ЧАО!': 'BYE-BYE!', 'バイバイ!': 'bye-bye!',
    'не!': 'no!', 'やめて!': 'stop it!', 'ъъъгх': 'nnngh', 'ау!': 'ow!', 'ох…': 'oh…', 'おっと': 'oops', 'опа!': 'whoops!',
    '世界一切れる刀です': 'I am the sharpest sword in the world', 'най-острата катана на света, здрасти!': 'the sharpest katana in the world, hello!',
    'スパッ': 'the sound of a clean cut', 'като масло': 'like butter', '痛い痛い痛い!!': 'it hurts, it hurts, it hurts!!', 'ААААААА!': 'a scream', 'боли боли боли': 'hurts, hurts, hurts',
    'まだ生きてる…?': 'still alive…?', 'жив съм?!': 'I am alive?!', 'ААААААААА!!!': 'a scream', 'НЕЕЕЕЕЕЕ!': 'NOOOOO!', 'ぎゃああああ!!': 'a shriek', 'うわあああ!!': 'a wail',
    'ААААА!!': 'a scream', 'ぐはっ!!': 'the wind knocked out of it', 'のびてる!': 'I am stretching!', 'БОЛИИИ!': 'IT HUUURTS!', '痛い!!': 'it hurts!!', 'МАМООООО': 'MOOOMMY',
    'моля те…': 'please…', 'やめて…': 'stop…', 'дай!': 'give!', 'ちょうだい': 'give it to me', 'мое!': 'mine!', 'いただき!': 'got it!', 'разтяга се…': 'it stretches…', 'のびる…': 'it stretches…',
    'チーズ!!!': 'CHEESE!!!', 'СИРЕНЕ!!!': 'CHEESE!!!', 'ごちそうさま': 'thank you for the meal', 'ммм.': 'mmm.', 'хе-хе': 'heh-heh', 'いらない': 'do not want it', 'ケチ': 'stingy', 'пф.': 'pff.',
    'いい切れ味': 'a fine edge', 'режи, режи…': 'cut, cut…', 'бум!': 'boom!', 'もったいない': 'what a waste', 'дай го насам': 'hand it over here', 'かっこつけ': 'show-off',
    'какво имаме тук…': 'what have we here…', 'いただきます…': 'thanks for the meal… (said before eating)',
    'ъъъ… хора?': 'uhh… guys?', 'あれ、こっち来てる?': 'huh, is it coming this way?', 'ПОМОЩ!': 'HELP!', 'こっち来ないで!': 'do not come over here!', 'НЕ МЕ ЯЖ!!': 'DO NOT EAT ME!!', '助けてぇぇ!!': 'heeelp!!', 'вземи него!': 'take him!', 'あっちだよ!': 'it is that one, over there!',
    'РЪКАТА МИ!!': 'MY HAND!!', '手がぁぁ!!': 'my haaand!!', 'нова-новеничка': 'brand new', '生えた。': 'it grew back.', 'ъъ?': 'uh?', 'сам съм си шеф': 'I am my own boss', '自由だ!': 'I am free!', 'пусни ме!': 'let me go!', 'はなせ!': 'let go!', 'ааааа!': 'aaaaa!', 'ела тук': 'come here', 'みーつけた': 'found you', 'ねむい…': 'sleepy…',
    'ох, ох, ох': 'ow, ow, ow', 'не, не пак!': 'no, not again!', 'やだやだやだ!': 'no no no!',
    'хванах!': 'caught it!', 'ナイスパス!': 'nice pass!', 'дай тука!': 'give it here!', 'もらった!': 'mine now!', 'бавно…': 'slowly…', 'まだだよ': 'not yet', 'смачках го.': 'I crushed it.', 'скука.': 'boring.', 'ау!': 'ow!', 'боли!': 'it hurts!', '痛っ!': 'ouch!', 'ひどい!': 'how mean!', 'полека…': 'easy does it…', 'そーっと…': 'ever so quietly…', 'сега ще видиш!': 'now you will see!', 'もう怒った!': 'now I am angry!', 'нагоре-надолу!': 'up and down!', 'ぐるぐる〜': 'round and round', 'つまらない': 'boring', 'ポイ': 'the sound of tossing something away',
  };
  const langOf = (s) => /[぀-ヿ一-鿿]/.test(s) ? 'JP' : /[Ѐ-ӿ]/.test(s) ? 'BG' : '';

  // ---- the figures: small static drawings in the page's own colours. The katana and the hand are not redrawn here:
  // they are the page's own drawings (window.__hand), posed once and printed ----
  let figN = 0;
  const INK = 'fill="none" stroke="var(--ink)" stroke-linecap="round" stroke-linejoin="round"';
  const zig = (x0, x1, y) => { let d = `M${x0} ${y + 3}`; for (let x = x0 + 4, up = true; x <= x1; x += 4, up = !up) d += `L${x} ${up ? y - 3 : y + 3}`; return d; };
  const cardG = (tf, extra = '') => `<g transform="${tf}"><rect width="112" height="72" rx="6" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M.7 13h110.6" stroke="var(--ink)" stroke-width=".8"/>
    <path d="${zig(6, 106, 6.5)}" fill="none" stroke="var(--rubric)" stroke-width="1.2"/><path d="M10 27h50" stroke="var(--ink)" stroke-width="3.4" stroke-linecap="round"/>
    <path d="M10 40h90M10 48h82M10 56h60" stroke="var(--ink)" stroke-width="1" opacity=".55" stroke-linecap="round"/>${extra}</g>`;
  const bubble = (x, y, text, red) => { const w = Math.max(30, [...text].reduce((n, ch) => n + (ch.charCodeAt(0) > 0x2e7f ? 11 : ch === ch.toLowerCase() ? 6.4 : 8.6), 0) + 18); return `<g transform="translate(${x - w / 2} ${y})"><rect width="${w}" height="20" rx="10" fill="var(--${red ? 'rubric' : 'ink'})"/><path d="M${w / 2 - 5} 19l5 6 5-6z" fill="var(--${red ? 'rubric' : 'ink'})"/><text x="${w / 2}" y="14" text-anchor="middle" font-size="11.5" font-weight="700" font-family="system-ui, sans-serif" fill="var(--paper)">${esc(text)}</text></g>`; };
  const cursor = (x, y) => `<path transform="translate(${x} ${y})" d="M0 0v17l4.6-4.2 3 7 2.9-1.3-3-6.8h6.2z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/>`;
  const hatch = (id) => `<defs><pattern id="${id}" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0v6" stroke="var(--ink)" stroke-width="1"/></pattern></defs>`;
  const first = (L, src, key, fallback) => { const a = L && L[src] && L[src][key]; return (Array.isArray(a) && a.find((s) => !langOf(s) && s.length < 14)) || fallback; };
  // the page's hand, held in a pose for a moment and copied as paths. x, y: where the wrist goes in the figure. It comes back in two layers,
  // thumb (under) and the rest (over), so a card can be drawn between them and sit in its grip
  function handParts(pose, a, x, y, sh = 70) {
    const H = window.__hand; if (!H) return null;
    try {
      const c = H.get(), parts = ['thumb', 'talonT', 'flesh', 'talon', 'crease', 'vein', 'eye', 'pupil'], vw = document.documentElement.clientWidth;
      const keep = { x: c.x, y: c.y, a: c.a, sh: c.sh, pose: c.pose, d: parts.map((k) => c[k].getAttribute('d')), eye: c.eye.getAttribute('class') };
      Object.assign(c, { x: vw - 250, y: 400, a, sh: 400 + sh, pose: typeof pose === 'string' ? { ...H.POSES[pose] } : { ...H.POSES.lurk, ...pose } }); H.draw(0, 0, 0);
      const g = (ks) => `<g class="pb-hand" transform="translate(${x - (vw - 250)} ${y - 400})">${ks.map((k) => `<path class="${k === 'thumb' ? 'flesh' : k === 'talonT' ? 'talon' : c[k].getAttribute('class')}" d="${c[k].getAttribute('d') || ''}"/>`).join('')}</g>`;
      const out = { under: g(parts.slice(0, 2)), over: g(parts.slice(2)) }; out.all = out.under + out.over;
      Object.assign(c, { x: keep.x, y: keep.y, a: keep.a, sh: keep.sh, pose: keep.pose }); parts.forEach((k, i) => { if (keep.d[i] == null) c[k].removeAttribute('d'); else c[k].setAttribute('d', keep.d[i]); }); c.eye.setAttribute('class', keep.eye || 'eye');
      return out;
    } catch (e) { return null; }
  }
  function handPrint(pose, a) { const h = handParts(pose, a, 190, 130, 120); return h ? `<svg class="pb-clip" viewBox="0 0 400 250" aria-hidden="true">${h.all}</svg>` : ''; }
  const kat = (tf) => { const H = window.__hand; return H ? `<g class="pb-kat" transform="${tf}">${H.katanaSvg('pb-kat' + (++figN)).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>` : ''; };
  const FIGS = {
    pull: (L) => [`<svg viewBox="0 0 340 150" aria-hidden="true">
        ${cardG('translate(4 62)')}${cardG('translate(224 62)')}
        <rect x="114" y="62" width="112" height="72" rx="6" ${INK} stroke-width="1.1" stroke-dasharray="4 4" opacity=".7"/>
        <path d="M150 96c8-10 18-16 30-20M168 110c8-8 16-13 26-17M140 80c6-8 14-14 24-18" ${INK} stroke-width=".9" opacity=".6"/>
        ${cardG('translate(150 34) rotate(-13 56 36)')}${bubble(206, 2, first(L, 'SAY', 'pull', 'hey!'))}${cursor(243, 52)}</svg>`,
      'A card taken hold of by the corner. It turns about the point where it is held, and its place in the grid is kept for it.'],
    smash: (L) => { let sh = ''; const P = [[0, 0, 26, -8, 30, 20, 6, 26], [34, -30, 62, -44, 70, -18, 44, -8], [40, 10, 72, 2, 80, 30, 50, 34], [84, -40, 118, -52, 122, -26, 92, -18], [96, 2, 130, -6, 140, 22, 108, 26], [60, 52, 92, 44, 100, 66, 70, 72], [16, 44, 40, 40, 44, 60, 22, 64], [136, -66, 160, -74, 164, -54, 142, -48], [150, 40, 176, 34, 180, 56, 156, 60], [120, 62, 138, 58, 142, 74, 124, 78]];
      for (const q of P) sh += `<path d="M${q[0]} ${q[1]}L${q[2]} ${q[3]}L${q[4]} ${q[5]}L${q[6]} ${q[7]}Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round"/><path d="M${(q[0] + q[6]) / 2 + 3} ${(q[1] + q[7]) / 2}L${(q[2] + q[4]) / 2 - 3} ${(q[3] + q[5]) / 2}" stroke="var(--ink)" stroke-width=".8" opacity=".5"/>`;
      return [`<svg viewBox="0 0 340 170" aria-hidden="true">${hatch('pb-h1')}<rect x="0" y="0" width="22" height="170" fill="url(#pb-h1)"/><path d="M22 0v170" ${INK} stroke-width="1.6"/>
        <path d="M22 84l22-34M22 84l30-12M22 84l32 8M22 84l24 30M22 84l10-44M22 84l8 42" ${INK} stroke="var(--rubric)" stroke-width="1.3"/>
        <g transform="translate(52 78)">${sh}</g><path d="M330 20C290 26 250 38 214 58" ${INK} stroke-width="1" stroke-dasharray="2 5"/><path d="M214 58l11-1M214 58l6-9" ${INK} stroke-width="1"/>
        ${bubble(268, 104, 'KRRRK—', true)}</svg>`, 'The end of a thrown card. The pieces fly from the place where it struck; the large ones remain, and may be picked up, stacked, cut or thrown again.']; },
    cut: () => [`<svg viewBox="0 0 340 120" aria-hidden="true">
        <g transform="translate(18 26)"><path d="M0 6a6 6 0 0 1 6-6h46l-10 72H6a6 6 0 0 1-6-6z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M64 0h46a6 6 0 0 1 6 6v60a6 6 0 0 1-6 6H54z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/>
          <path d="M66-22L46 94" ${INK} stroke="var(--rubric)" stroke-width="1.3" stroke-dasharray="5 4"/><path d="M46 94l-1-10M46 94l8-7" ${INK} stroke="var(--rubric)" stroke-width="1.3"/><circle cx="62" cy="0" r="3" fill="var(--rubric)"/><circle cx="50" cy="72" r="3" fill="var(--rubric)"/>
          <path d="M10 22h26M10 34h30M10 44h22M74 22h30M72 34h34M70 44h24" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round"/></g>
        <text x="30" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">a.</text>
        <g transform="translate(204 26)"><rect width="116" height="72" rx="6" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/>
          <path d="M40-22C44 10 52 36 60 40C68 36 74 10 78-22" ${INK} stroke="var(--rubric)" stroke-width="1.3" stroke-dasharray="5 4"/><path d="M78-22l-7 6M78-22l3 9" ${INK} stroke="var(--rubric)" stroke-width="1.3"/><circle cx="43.500" cy="0" r="3" fill="var(--rubric)"/><circle cx="74.500" cy="0" r="3" fill="var(--rubric)"/>
          <path d="M60 42v9M56 46l4 5 4-5" ${INK} stroke="var(--rubric)" stroke-width="1.2"/><circle cx="60" cy="60" r="2" fill="var(--rubric)"/><circle cx="60" cy="67" r="1.4" fill="var(--rubric)"/>
          <path d="M10 22h24M10 34h30M10 44h22M84 22h22M80 34h26M78 44h20" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round"/></g>
        <text x="216" y="114" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">b.</text></svg>`,
      '<b>a.</b> In by one side and out by another: a cut, made from the point of entry to the point of leaving. <b>b.</b> In and out by the same side: a stab.'],
    katana: () => { const H = window.__hand; if (!H) return null; const id = 'pb-kat' + (++figN);
      return [`<svg class="pb-kat" viewBox="-6 -22 312 74" aria-hidden="true"><g transform="translate(0 40) rotate(-90)">${H.katanaSvg(id).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>
        <path d="M296 5l0-16" ${INK} stroke-width=".9"/><text x="296" y="-14" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">a.</text>
        <path d="M100 30h180M100 26v8M280 26v8" ${INK} stroke-width=".9"/><text x="190" y="46" text-anchor="middle" font-size="12" font-weight="700" fill="var(--ink)">b.</text></svg>`,
      'The katana. <b>a.</b> The tip, which cuts whatever it touches. <b>b.</b> The rest of the blade, which passes through everything and only looks sharp.']; },
    hand: () => { const s = handPrint('eager', Math.PI); return s && [s, 'The Hand, wanting. The eye opens wide and the fingers spread when a loose card comes near.']; },
    fist: () => { const s = handPrint('joy', Math.PI + 0.12); return s && [s, 'The Hand, pleased with itself. When it is happy the eye closes to a curve.']; },
    // ---- more figures. The ones with the hand in them use the page's own drawing of it (handParts), placed among the other shapes ----
    strain: (L) => [`<svg viewBox="0 0 340 160" aria-hidden="true">
        ${cardG('translate(4 78)')}${cardG('translate(224 78)')}
        <rect x="114" y="78" width="112" height="72" rx="6" ${INK} stroke-width="1.1" stroke-dasharray="4 4" opacity=".7"/>
        <path d="M132 80C140 66 150 70 162 58M158 80C164 68 176 74 184 62M186 80C190 70 202 76 208 66M210 80C214 72 222 76 228 70" ${INK} stroke="var(--rubric)" stroke-width="1.5"/>
        ${cardG('translate(150 6) rotate(-9 56 36)')}
        <path d="M138 30l-8-4M136 44l-9 1M272 14l8-5M276 30l9-1" ${INK} stroke-width="1.1"/>
        ${bubble(96, 34, first(L, 'SAY', 'strain', 'nnngh!'))}${cursor(232, 30)}</svg>`,
      'Under strain. Past 160 px of pull the root starts to let go, strand by strand, and the card shakes.'],
    back: (L) => [`<svg viewBox="0 0 340 150" aria-hidden="true">
        ${cardG('translate(4 62)')}${cardG('translate(224 62)')}
        <rect x="114" y="62" width="112" height="72" rx="6" ${INK} stroke-width="1.1" stroke-dasharray="4 4" opacity=".7"/>
        ${cardG('translate(118 56) rotate(3 56 36)')}
        <path d="M300 18C270 14 244 24 226 44" ${INK} stroke-width="1" stroke-dasharray="2 5"/><path d="M226 44l10-3M226 44l3-10" ${INK} stroke-width="1"/>
        <path d="M108 52c-6 6-8 14-6 22M236 50c6 6 8 14 6 22M100 44c-9 9-12 20-9 32" ${INK} stroke-width="1" opacity=".6"/>
        ${bubble(170, 16, first(L, 'SAY', 'back', 'ha!'))}${cursor(304, 14)}</svg>`,
      'Let go in time. The root pulls the card straight home, where it wobbles once and gloats.'],
    fly: (L) => [`<svg viewBox="0 0 340 150" aria-hidden="true">
        <path d="M20 132C70 60 150 30 250 38" ${INK} stroke-width="1" stroke-dasharray="2 5"/>
        <path d="M150 66h-46M146 82h-58M150 98h-40" ${INK} stroke-width="1.4"/><path d="M96 74h-22M82 90h-18" ${INK} stroke-width="1" opacity=".6"/>
        ${cardG('translate(166 34) rotate(14 56 36)')}${cursor(22, 118)}
        <path d="M36 112l8-9M44 122l11-4" ${INK} stroke-width="1"/>
        ${bubble(228, 4, first(L, 'SAY', 'throw', 'wheee'))}</svg>`,
      'Thrown. Let go at more than 900 px a second and the card keeps the speed of the hand that threw it.'],
    land: (L) => [`<svg viewBox="0 0 340 150" aria-hidden="true">${hatch('pb-h2')}
        <rect x="0" y="128" width="340" height="22" fill="url(#pb-h2)" opacity=".7"/><path d="M0 128h340" ${INK} stroke-width="1.6"/>
        <path d="M250 6C236 30 220 46 204 60" ${INK} stroke-width="1" stroke-dasharray="2 5"/>
        ${cardG('translate(108 51) rotate(-7 56 36)')}
        <path d="M104 126l-14-8M100 118l-10-12M232 124l14-10M236 114l8-12" ${INK} stroke-width="1.2"/>
        <path d="M70 124a7 5 0 1 1 12 0M254 124a8 5 0 1 1 14 0M44 125a5 4 0 1 1 9 0" ${INK} stroke-width="1" opacity=".7"/>
        ${bubble(126, 14, first(L, 'SAY', 'land', 'oof'))}</svg>`,
      'A hard landing. Faster than 500 px a second it hurts; only a thrown card going faster than 1300 breaks.'],
    stack: () => [`<svg viewBox="0 -24 340 194" aria-hidden="true">${hatch('pb-h3')}
        <rect x="0" y="150" width="340" height="20" fill="url(#pb-h3)" opacity=".7"/><path d="M0 150h340" ${INK} stroke-width="1.6"/>
        ${cardG('translate(110 108) scale(1 .56)')}${cardG('translate(122 67) scale(1 .56)')}${cardG('translate(104 26) scale(1 .56)')}${cardG('translate(118 -15) scale(1 .56)')}
        <path d="M262 -14v40M262 26l-5-8M262 26l5-8" ${INK} stroke-width="1" stroke-dasharray="2 4"/><path d="M84 148l-10-6M256 148l10-6" ${INK} stroke-width="1.1"/></svg>`,
      'Loose cards are ordinary objects. They fall, lie on each other and stack; a tower of five stands.'],
    stretch: (L) => { const h = handParts('strain', Math.PI, 392, 82); if (!h) return null; const a = L && L.AGONY && L.AGONY[1];
      return [`<svg class="pb-clip" viewBox="0 0 460 190" aria-hidden="true">${h.under}
        <path d="M40 56h74c40 2 62 30 86 30s48-22 96-18v72c-48 4-72-20-96-20s-46 28-86 30H40a6 6 0 0 1-6-6V62a6 6 0 0 1 6-6z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round"/>
        <path d="M34 70h82c34 2 58 24 84 24" ${INK} stroke-width=".8"/><path d="M46 84h44M46 98h70c30 0 50 4 84 4M46 110h60M46 122h40" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round" fill="none"/>
        <path d="M188 80l5 8M200 78l1 9M212 80l-4 8M190 116l4-7M204 118l0-8" ${INK} stroke="var(--rubric)" stroke-width="1.4"/>
        <circle cx="198" cy="132" r="2.6" fill="var(--rubric)"/><circle cx="206" cy="146" r="2" fill="var(--rubric)"/><circle cx="194" cy="158" r="1.5" fill="var(--rubric)"/>
        ${h.over}${cursor(52, 96)}${bubble(196, 30, (a && a.find((s) => !langOf(s) && s.length < 14)) || 'IT HURTS', true)}</svg>`,
      'The tug of war. You hold one end and the Hand the other; the card grows a waist, drips, and at last tears in two.']; },
    crush: (L) => { const h = handParts({ ...window.__hand.POSES.clamp, curl: 0.7, th: 0.7, eye: 1.3, pupil: 1.2 }, Math.PI, 300, 100); if (!h) return null;
      return [`<svg class="pb-clip" viewBox="0 0 400 200" aria-hidden="true">${h.under}
        <path d="M168 96l14-22 20 8 16-14 14 20 22 2-6 22 14 16-20 10-2 22-22-8-16 14-12-20-22-2 8-20-14-16z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round"/>
        <path d="M182 74l18 34 18-40M200 108l32-20M200 108l-24 22M200 108l24 28M200 108l40 10" ${INK} stroke-width=".9" opacity=".7"/>
        ${h.over}<path d="M150 70l-10-8M146 96l-13-1M152 122l-11 7" ${INK} stroke-width="1.2"/>
        ${bubble(128, 28, (L && L.BEG && L.BEG.find((s) => !langOf(s) && s.length < 14)) || 'please')}</svg>`,
      'In the fist. It squeezes in three goes and looks the card over between them. In the second pause the card begs.']; },
    shelf: (L) => { const h = handParts('eager', Math.PI, 400, 96); if (!h) return null; const p = L && L.PANIC && L.PANIC[1];
      return [`<svg class="pb-clip" viewBox="0 0 440 190" aria-hidden="true">
        <path d="M14 132h196" ${INK} stroke-width="3"/><path d="M40 132v22l18-22M184 132v22l-18-22" ${INK} stroke-width="1.6"/>
        ${cardG('translate(52 59) rotate(-3 56 36)')}
        <path d="M44 70l-9-5M42 92l-10 1M174 62l9-6M176 88l10-1M58 52l-4-9M150 50l4-9" ${INK} stroke-width="1.1"/>
        <path d="M218 96h-22M210 110h-16" ${INK} stroke-width="1" stroke-dasharray="2 4"/>
        ${h.all}${bubble(108, 14, (p && p.find((s) => !langOf(s) && s.length < 16)) || 'it is coming', true)}</svg>`,
      'The secret shelf. A card left on it shakes and hops as the Hand comes over. Pick the card up and it is saved.']; },
    mist: () => { const k = kat('translate(150 6) scale(.52)'); if (!k) return null; const cloud = (x, y, s, o) => `<path transform="translate(${x} ${y}) scale(${s})" d="M0 30c-14 0-20-18-6-24 2-16 26-20 34-6 12-10 32-2 30 14 16 2 16 22-2 22z" fill="var(--paper)" stroke="var(--ink)" stroke-width="${1.1 / s}" opacity="${o}"/>`;
      return [`<svg viewBox="0 0 340 170" aria-hidden="true"><path d="M0 162h340" ${INK} stroke-width="1.4"/>
        ${cloud(40, 96, 1.5, 0.8)}${k}${cloud(96, 112, 1.6, 1)}${cloud(176, 104, 1.3, 1)}${cloud(232, 118, 1.2, 0.85)}${cloud(10, 126, 1, 1)}
        <path d="M196 30c16-12 34-10 44 2M204 44c12-8 24-6 32 2" ${INK} stroke-width="1" stroke-dasharray="2 4"/>${cursor(246, 26)}</svg>`,
      'The katana stands planted in the mist of the banner. Move the pointer about near it for a while and it shows itself.']; },
    kfall: (L) => { const k = kat('translate(150 -30) scale(.46)'); if (!k) return null;
      return [`<svg class="pb-clip" viewBox="0 0 340 180" aria-hidden="true">
        <g transform="translate(96 100)"><path d="M0 6a6 6 0 0 1 6-6h58l-6 72H6a6 6 0 0 1-6-6z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M84 0h58a6 6 0 0 1 6 6v60a6 6 0 0 1-6 6H78z" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4" transform="translate(6 3) rotate(3 110 36)"/>
          <path d="M10 22h34M10 34h40M10 44h28" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round"/></g>
        ${k}<path d="M140 2v22M190 0v26" ${INK} stroke-width="1" opacity=".6"/>
        ${bubble(262, 50, first(L, 'SAY', 'kcut', 'whoops'))}</svg>`,
      'Dropped, it still cuts. The tip divides whatever it meets on the way down the page, and the katana says sorry.']; },
    equip: () => { const k = kat('translate(120 -40) rotate(38 20 150) scale(.6)'); if (!k) return null;
      return [`<svg class="pb-clip" viewBox="0 0 340 170" aria-hidden="true">${k}
        <circle cx="218" cy="42" r="15" ${INK} stroke="var(--rubric)" stroke-width="1.4"/><circle cx="218" cy="42" r="24" ${INK} stroke="var(--rubric)" stroke-width="1.1" stroke-dasharray="3 4"/>
        ${cursor(214, 38)}<text x="262" y="34" font-size="12" font-weight="700" fill="var(--ink)">× 2</text>
        <path d="M66 150c10 6 24 8 36 4M52 136c14 12 36 16 56 10" ${INK} stroke-width="1" stroke-dasharray="2 4"/></svg>`,
      'Double-click and the katana stays in the hand at one steady angle. Double-click again, or press Esc, to let it go.']; },
    catch: (L) => { const h = handParts('lunge', Math.PI + 0.08, 410, 104); if (!h) return null;
      return [`<svg class="pb-clip" viewBox="0 0 460 190" aria-hidden="true">
        <path d="M10 150C60 96 110 78 160 76" ${INK} stroke-width="1" stroke-dasharray="2 5"/>
        <path d="M118 62h-46M112 80h-60M118 98h-38" ${INK} stroke-width="1.4"/>
        ${h.under}${cardG('translate(134 44) rotate(-10 56 36)')}${h.over}
        ${bubble(330, 16, first(L, 'CLAW_SAY', 'caught', 'CAUGHT IT'), true)}</svg>`,
      'A catch. Throw a card towards the right edge and the arm shoots out to pluck it from the air.']; },
    press: (L) => { const h = handParts('point', Math.PI - 0.95, 286, 60); if (!h) return null;
      return [`<svg class="pb-clip" viewBox="0 0 440 180" aria-hidden="true">
        <rect x="34" y="62" width="150" height="96" rx="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/><path d="M52 84h76M52 98h110" stroke="var(--ink)" stroke-width="1" opacity=".5" stroke-linecap="round"/>
        <rect x="52" y="116" width="52" height="26" rx="13" ${INK} stroke-width="1.3"/><text x="78" y="133.500" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--ink)">No</text>
        <rect x="114" y="116" width="54" height="26" rx="13" fill="var(--rubric)"/><text x="141" y="133.500" text-anchor="middle" font-size="11.5" font-weight="700" fill="var(--paper)">Yes</text>
        ${h.all}${bubble(110, 22, first(L, 'CLAW_SAY', 'bye', 'BYE BYE'), true)}</svg>`,
      'Surprise me. Lose the toss, press neither button for five seconds, and one pointing finger presses Yes for you.']; },
    coin: (L) => { const h = handParts('snapped', Math.PI + 0.5, 360, 150); if (!h) return null;
      return [`<svg class="pb-clip" viewBox="0 0 440 200" aria-hidden="true">
        <path d="M236 96C212 60 196 44 172 40" ${INK} stroke-width="1" stroke-dasharray="2 5"/>
        <ellipse cx="150" cy="40" rx="20" ry="14" fill="#e3c32f" stroke="var(--ink)" stroke-width="1.4"/><ellipse cx="150" cy="40" rx="13" ry="8.500" ${INK} stroke-width="1"/>
        <path d="M118 30c-6 6-6 14 0 20M182 30c6 6 6 14 0 20M110 24c-9 10-9 22 0 32M190 24c9 10 9 22 0 32" ${INK} stroke-width="1"/>
        ${h.all}${bubble(110, 84, first(L, 'CLAW_SAY', 'flip', 'call it.'), true)}</svg>`,
      'The toss. It will not take your No for an answer: it flips a coin and makes you call heads or tails.']; },
    severed: (L) => { const h = handParts('lunge', Math.PI, 250, 96); if (!h) return null; const id = 'pb-sv' + (++figN);
      return [`<svg class="pb-clip" viewBox="0 0 440 190" aria-hidden="true"><defs><clipPath id="${id}a"><path d="M0-40h292l-26 280H0z"/></clipPath><clipPath id="${id}b"><path d="M292-40h200v280H266z"/></clipPath></defs>
        <g transform="translate(-16 14) rotate(-7 250 96)"><g clip-path="url(#${id}a)">${h.all}</g></g><g transform="translate(12 -2)"><g clip-path="url(#${id}b)">${h.all}</g></g>
        <path d="M306-6L262 196" ${INK} stroke="var(--rubric)" stroke-width="1.4" stroke-dasharray="6 5"/>
        <circle cx="282" cy="150" r="3" fill="var(--rubric)"/><circle cx="290" cy="166" r="2.200" fill="var(--rubric)"/><circle cx="274" cy="172" r="1.600" fill="var(--rubric)"/><circle cx="296" cy="140" r="1.800" fill="var(--rubric)"/>
        ${bubble(370, 20, first(L, 'CLAW_SAY', 'severed', 'MY HAND!!'), true)}</svg>`,
      'Pass the tip of the katana through the arm and the hand comes off. It lives on by itself; the arm grows a new one.']; },
    swat: () => { const h = handParts('sulk', Math.PI - 0.45, 372, 84); if (!h) return null;
      return [`<svg class="pb-clip" viewBox="0 0 440 190" aria-hidden="true">
        <circle cx="150" cy="104" r="20" ${INK} stroke="var(--rubric)" stroke-width="2"/><circle cx="150" cy="104" r="32" ${INK} stroke="var(--rubric)" stroke-width="1.2" stroke-dasharray="3 5"/>
        <path d="M150 62v-12M150 146v12M108 104h-12M192 104h12M120 74l-9-9M180 74l9-9M120 134l-9 9M180 134l9 9" ${INK} stroke="var(--rubric)" stroke-width="1.4"/>
        ${cursor(146, 100)}<path d="M214 70h26M208 92h34M216 114h24" ${INK} stroke-width="1.3"/>
        ${h.all}${bubble(300, 16, SWAT_SAY[0], true)}</svg>`,
      'Click the Hand while it is in this menu and it is swatted. It drops what it holds and sulks for five seconds or more.']; },
    scroll: () => { const h = handParts('clamp', Math.PI, 382, 78); if (!h) return null; let rows = ''; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) rows += `<rect x="${40 + j * 106}" y="${34 + i * 48}" width="96" height="38" rx="6" ${INK} stroke-width="1" opacity=".6"/><path d="M${48 + j * 106} ${46 + i * 48}h40M${48 + j * 106} ${58 + i * 48}h70" stroke="var(--ink)" stroke-width="1" opacity=".4" stroke-linecap="round"/>`;
      return [`<svg class="pb-clip" viewBox="0 0 440 190" aria-hidden="true">
        <rect x="28" y="20" width="250" height="160" rx="12" fill="var(--paper)" stroke="var(--ink)" stroke-width="1.4"/>${rows}
        <path d="M266 30v140" ${INK} stroke-width="1" opacity=".5"/><rect x="262" y="80" width="8" height="38" rx="4" fill="var(--rubric)"/>
        <path d="M296 34v-18M296 16l-6 8M296 16l6 8M296 150v20M296 170l-6-8M296 170l6-8" ${INK} stroke="var(--rubric)" stroke-width="1.5"/>
        ${h.all}${bubble(366, 150, SCROLL_SAY[0], true)}</svg>`,
      'In a temper it takes hold of the edge of this menu and yanks the page up and down until you have lost your place.']; },
    sulking: () => { const s = handPrint('sulk', Math.PI - 0.4); return s && [s, 'The Hand, sulking: a fist turned half away and the eye nearly shut. It does not last.']; },
  };
  function figure(name, L) {
    let f = null; try { f = FIGS[name](L); } catch (e) { f = null; }
    return f ? `<figure class="pb-fig pb-fig-${name}">${f[0]}<figcaption><b>Fig. ${++figN_plate}</b> ${f[1]}</figcaption></figure>` : '';
  }
  let figN_plate = 0;

  // ---- the text, built from the live lists ----
  function listOf(L, e) { const src = L[e.src]; if (!src) return null; const v = e.key == null ? src : src[e.key]; return Array.isArray(v) ? v : null; }
  function linesHTML(arr) {
    return [...new Set(arr)].map((s) => {
      const lang = langOf(s), g = GLOSS[s];
      return `<span class="pb-chip"${lang ? ` lang="${lang === 'JP' ? 'ja' : 'bg'}"` : ''}><b>${esc(s)}</b>${lang ? `<i lang="en">${lang}${g ? ' · ' + esc(g) : ''}</i>` : ''}</span>`;
    }).join('');
  }
  function build() {
    const L = window.__lines && { ...window.__lines, BOOK: RAID_SAY, SWAT: SWAT_SAY, GRUDGE: GRUDGE_SAY, ANGRY: ANGRY_SAY, SCROLL: SCROLL_SAY, HELP: HELP_SAY, ALONE: ALONE_SAY, MORE: MORE_SAY, HIDE: HIDE_SAY }; figN_plate = 0;
    if (!L) return { head: 'Nothing to list', nav: '', body: '<p class="pb-intro">Nothing on this site moves or speaks while your system asks for reduced motion, so there are no lines to show. Switch that setting off and open this again.</p>' };
    const chapters = CHAPTERS.map((c) => ({ ...c, entries: c.entries.map((e) => e.fig ? e : ({ ...e, lines: listOf(L, e) })).filter((e) => e.fig || (e.lines && e.lines.length)) }));
    // lists the page has that this file has not been told about yet: they are still shown, in the section they belong to
    const known = new Set(CHAPTERS.flatMap((c) => c.entries.filter((e) => e.key != null).map((e) => e.src + '.' + e.key)));
    const extra = (src, test, ch) => { for (const k of Object.keys(L[src] || {})) if (!known.has(src + '.' + k) && Array.isArray(L[src][k]) && test(k)) chapters[ch].entries.push({ src, key: k, title: `New: “${k}”`, when: 'A new set of lines. What sets it off has not been written down here yet.', lines: L[src][k] }); };
    extra('SAY', (k) => k[0] !== 'k', 0); extra('SAY', (k) => k[0] === 'k', 1); extra('CLAW_SAY', () => true, 2);
    let nLines = 0, nOcc = 0; for (const c of chapters) { c.n = 0; for (const e of c.entries) if (!e.fig) { nOcc++; c.n += new Set(e.lines).size; } nLines += c.n; }
    let h = '';
    for (const c of chapters) {
      h += `<section class="pb-sec pb-sec-${c.id}" id="pb-${c.id}"><header class="pb-sec-h"><h3>${esc(c.title)}</h3><span class="pb-pill">${c.n} lines</span></header><p class="pb-intro">${esc(c.intro)}</p><div class="pb-grid">`;
      for (const e of c.entries) h += e.fig ? figure(e.fig, L) : `<article class="pb-entry"><h4>${esc(e.title)}<span class="pb-pill">${new Set(e.lines).size}</span></h4><p class="pb-when"><b>When</b> ${esc(e.when)}</p><div class="pb-lines">${linesHTML(e.lines)}</div></article>`;
      h += '</div></section>';
    }
    h += '<p class="pb-end">That is all of them. Go and make them say it.</p>';
    return { head: `${nLines} lines, ${nOcc} triggers`, nav: chapters.map((c) => `<button type="button" class="pb-tab" data-go="${c.id}">${esc(c.title)}</button>`).join(''), body: h };
  }

  // ---- the menu: one big card over a tinted page, scrolling top to bottom ----
  let el = null, scroller = null, isOpen = false, lastFocus = null;
  const q = (s) => el.querySelector(s);
  function make() {
    const css = document.createElement('link'); css.rel = 'stylesheet'; css.href = new URL('../styles/phrasebook.css?v=' + VER, here).href;
    const ready = new Promise((res) => { css.onload = css.onerror = res; }); document.head.appendChild(css);
    el = document.createElement('div'); el.className = 'pb'; el.hidden = true; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-labelledby', 'pb-title');
    el.innerHTML = `<div class="pb-shade"></div>
      <div class="pb-card">
        <header class="pb-top"><div class="pb-top-row"><div><h2 id="pb-title">Phrasebook</h2><p class="pb-sub">Everything the cards, the katana and the hand can say, and what sets it off. <span class="pb-count"></span></p></div>
          <button class="icon-btn pb-x" type="button" aria-label="Close the phrasebook">✕</button></div><nav class="pb-tabs" aria-label="Sections"></nav></header>
        <div class="pb-scroll" tabindex="-1"></div>
      </div>`;
    document.body.appendChild(el);
    scroller = q('.pb-scroll');
    q('.pb-shade').addEventListener('click', close); q('.pb-x').addEventListener('click', close);
    q('.pb-tabs').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'), sec = b && document.getElementById('pb-' + b.dataset.go); if (sec) scroller.scrollTo({ top: sec.offsetTop - 8, behavior: 'smooth' }); });
    scroller.addEventListener('scroll', () => { let cur = null; el.querySelectorAll('.pb-sec').forEach((s) => { if (s.offsetTop - 140 <= scroller.scrollTop) cur = s.id.slice(3); }); el.querySelectorAll('.pb-tab').forEach((t) => t.classList.toggle('on', t.dataset.go === cur)); el.classList.toggle('scrolled', scroller.scrollTop > 4); }, { passive: true });
    return ready;
  }
  function onKey(e) {
    if (!isOpen) return;
    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'Tab') { const f = [...el.querySelectorAll('button:not(:disabled)')], k = f.indexOf(document.activeElement); e.preventDefault(); (f[(k + (e.shiftKey ? -1 : 1) + f.length) % f.length] || f[0]).focus(); }
    e.stopPropagation();   // nothing typed in the menu reaches the page under it
  }
  document.addEventListener('keydown', onKey, true);
  async function open() {
    if (isOpen) return;
    isOpen = true; lastFocus = document.activeElement;
    if (!el) await make();
    const b = build(); scroller.innerHTML = b.body; q('.pb-count').textContent = b.head + '.'; q('.pb-tabs').innerHTML = b.nav;
    el.hidden = false; document.documentElement.classList.add('pb-lock'); scroller.scrollTop = 0; scroller.dispatchEvent(new Event('scroll'));
    requestAnimationFrame(() => el.classList.add('in'));
    scroller.focus({ preventScroll: true });   // so the arrow keys, space and page keys scroll it straight away
    raidArm();
    el.dispatchEvent(new CustomEvent('pb-open'));
  }
  function close() {
    if (!isOpen) return;
    isOpen = false; el.classList.remove('in'); document.documentElement.classList.remove('pb-lock'); raidStop();
    el.dispatchEvent(new CustomEvent('pb-close'));
    setTimeout(() => { if (!isOpen) el.hidden = true; }, 240);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  // ---- stay too long and the hand gets bored: after 30 s in the menu it reaches in, pulls the cards out one by one and throws them
  // at the left edge of the screen, where they break. The hand is the page's own (window.__hand): while its state is 'book' the page
  // leaves it alone and this file poses it. The thrown cards are real bodies in a small planck world the size of the window. ----
  // every wait and bubble time comes from the page's one table (TIMING in index.html); the numbers after ?? are only for a page without it
  const TM = window.__timing, LINGER = TM ? TM.wait.book : 5000, HELP_WAIT = (TM ? TM.wait.help : 8000) / 1000, GAP = TM ? TM.gap.raid : 1300, ASK_GAP = TM ? TM.gap.raidAsk : 2900;
  const talk = (el, floor) => (TM ? TM.talk(el, TM.floor[floor]) : 1300);
  const S = 100, DT = 1 / 240, GRAV = 85, FALL = 0.25, SMASH = 13, GRIP = [98, 20];
  let raid = null, armT = 0, armed = 0;
  const pick = (a) => window.__pick ? window.__pick(a) : a[Math.floor(Math.random() * a.length)], clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function raidArm() {   // counts only the time the menu is really in front of someone
    clearInterval(armT); armed = 0; if (!window.__hand) return;
    armT = setInterval(() => { if (!isOpen) return clearInterval(armT); if (!document.hidden) armed += 250; if (armed >= LINGER) { clearInterval(armT); raidStart(); } }, 250);
  }
  function loadPlanck() { return window.planck ? Promise.resolve() : new Promise((res, rej) => { const s = document.createElement('script'); s.src = new URL('../vendor/planck-1.4.2.min.js', here).href; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  async function raidStart() {
    const H = window.__hand; if (!H || !isOpen || raid) return;
    clearInterval(armT);
    const r = raid = { st: 'wait', t: 0, now: 0, objs: new Set(), bits: [], hits: [], thrown: 0, broken: 0, last: 0, acc: 0, target: null, held: null, say: null, said: -1e9, mood: 'slow', fury: 0, swats: 0, act: null, lastAct: null, force: null, pull: null, bouts: 0, eaten: 0, ripped: 0, acts: [] };
    try { await loadPlanck(); } catch (e) { raid = null; return; }
    if (raid !== r || !isOpen) return;
    const pl = window.planck;
    r.layer = document.createElement('div'); r.layer.className = 'pb-fly'; document.body.appendChild(r.layer);
    // the drawn hand takes no clicks (it is one big SVG over the window), so a patch that follows it does: click it and the hand is swatted
    r.swat = document.createElement('button'); r.swat.type = 'button'; r.swat.className = 'pb-swat'; r.swat.tabIndex = -1; r.swat.setAttribute('aria-label', 'Swat the hand away'); r.layer.appendChild(r.swat);
    r.swat.addEventListener('pointerdown', (e) => { e.preventDefault(); raidSwat(e.clientX, e.clientY); });
    r.world = new pl.World({ gravity: { x: 0, y: GRAV } }); r.ground = r.world.createBody(); r.walls = [];
    r.world.on('begin-contact', (c) => {   // the world is locked in here: the hit is only noted, and the card is broken after the step
      const fa = c.getFixtureA(), fb = c.getFixtureB(), wall = fa.getBody() === r.ground ? fa : fb.getBody() === r.ground ? fb : null; if (!wall) return;
      const o = (wall === fa ? fb : fa).getBody().getUserData(); if (!o || o.kind !== 'card' || o.hit) return;
      const n = wall.getUserData(), v = o.body.getLinearVelocity(), closing = -(v.x * n[0] + v.y * n[1]); if (closing < SMASH) return;
      const wm = c.getWorldManifold(null), pt = wm && wm.points && wm.points[0], p = o.body.getPosition();
      o.hit = true; r.hits.push({ o, n, x: pt ? pt.x : p.x, y: pt ? pt.y : p.y, vx: v.x, vy: v.y, w: o.body.getAngularVelocity() });
    });
    raidWalls(); addEventListener('resize', raidWalls);
    requestAnimationFrame(raidFrame);
  }
  function raidWalls() {
    const r = raid; if (!r || !r.world) return; const pl = window.planck, w = document.documentElement.clientWidth / S, h = innerHeight / S, T = 5;
    for (const f of r.walls) r.ground.destroyFixture(f);
    const box = (cx, cy, hw, hh, n) => { const f = r.ground.createFixture({ shape: new pl.Box(hw, hh, { x: cx, y: cy }, 0), friction: 0.8 }); f.setUserData(n); return f; };
    r.walls = [box(-T, h / 2, T, h * 3, [1, 0]), box(w + T, h / 2, T, h * 3, [-1, 0]), box(w / 2, h + T, w, T, [0, -1])];
    for (const o of r.objs) o.body.setAwake(true);
  }
  function raidStop() {
    clearInterval(armT); const r = raid; if (!r) return; raid = null;
    removeEventListener('resize', raidWalls);
    if (r.layer) r.layer.remove();
    if (r.c) {   // the hand goes back to whatever it was doing on the page
      const c = r.c, H = window.__hand; c.under.classList.remove('pb-raid'); c.over.classList.remove('pb-raid');
      c.x = document.documentElement.clientWidth + 340; c.pose = { ...H.POSES.lurk }; c.a = Math.PI; H.draw(0, 0, 0); c.st = 'off'; if (r.prev !== 'off') H.set('lurk');
    }
  }
  function raidSay(text, o, floor) {   // floor: a key of TIMING.floor for a line that wants longer than its length gives
    const r = raid, b = document.createElement('div'); b.className = 'pb-say' + (o ? '' : ' hand'); b.textContent = text;
    b.style.setProperty('--tilt', (4 + Math.random() * 4).toFixed(1));   // cards lean right, the hand leans left
    const ms = talk(b, floor || (o ? null : 'hand'));
    r.layer.appendChild(b);
    if (o) { if (o.say) o.say.el.remove(); o.say = { el: b, until: r.now + ms }; }
    else { if (r.say) r.say.el.remove(); r.say = { el: b, until: r.now + ms }; r.said = r.now; }
  }
  function raidCrumbs(x, y, n, dir) {
    const r = raid;
    for (let i = 0; i < n; i++) { const e = document.createElement('div'); e.className = 'pb-bit'; const sz = 3 + Math.random() * 5; e.style.width = e.style.height = sz + 'px'; r.layer.appendChild(e); const a = Math.random() * Math.PI * 2, sp = 100 + Math.random() * 350; r.bits.push({ el: e, x, y, vx: dir * (120 + Math.random() * 380) + Math.cos(a) * sp * 0.5, vy: Math.sin(a) * sp * 0.6 - 260, life: 0.5 + Math.random() * 0.5, t: 0 }); }
  }
  // the two of you have pulled the card apart: your half drops, the hand keeps its own
  function raidRip() {
    const r = raid, o = r.held, pl = window.planck, w = o.w, h = o.h, n = 7, tear = [];
    for (let i = 0; i <= n; i++) tear.push([w / 2 + (i % 2 ? 9 : -9) + (Math.random() - 0.5) * 8, h * i / n]);
    const pts = (a) => a.map((q) => `${q[0].toFixed(1)}px ${q[1].toFixed(1)}px`).join(',');
    const lel = o.el.cloneNode(true); lel.classList.remove('pb-offer'); lel.style.clipPath = `polygon(0px 0px,${pts(tear)},0px ${h}px)`; lel.style.boxShadow = 'none'; r.layer.appendChild(lel);
    o.el.classList.remove('pb-offer'); o.el.style.clipPath = `polygon(${w}px 0px,${pts(tear)},${w}px ${h}px)`; o.el.style.boxShadow = 'none';
    const ca = Math.cos(o.a), sa = Math.sin(o.a), st = o.st || 0, lx = o.x - st * ca, ly = o.y - st * sa;   // your half is where you had pulled it to
    const piece = raidBody({ kind: 'piece', el: lel, w, h, die: r.now + 3600 }, lx / S, ly / S, o.a, new pl.Box(w / 4 / S, h / 2 / S, { x: -w / 4 / S, y: 0 }, 0), { filterGroupIndex: -1 });
    piece.body.setLinearVelocity({ x: -7 - Math.random() * 4, y: -5 }); piece.body.setAngularVelocity(-2 - Math.random() * 3);
    raidCrumbs(o.x - st / 2, o.y, 14, -0.3); raidCrumbs(o.x - st / 2, o.y, 8, 0.3);
    o.st = 0; r.pull = null; r.ripped++;
    const L = window.__lines, lines = L && L.CLAW_SAY && L.CLAW_SAY.rip; raidSay(lines ? pick(lines) : 'RIIIP', null, 'rip');
    const card = q('.pb-card'); card.classList.remove('pb-jolt'); void card.offsetWidth; card.classList.add('pb-jolt');
  }
  function raidSwat(x, y) {
    const r = raid; if (!r || !r.c || r.st === 'swat' || r.st === 'done') return;
    if (r.target) r.target.classList.remove('pb-tug');
    if (r.held) {   // what it was holding just drops
      const o = r.held, pl = window.planck; r.held = null; o.st = 0; o.el.classList.remove('pb-offer'); raidBody(o, o.x / S, o.y / S, o.a, new pl.Box(o.w / 2 / S, o.h / 2 / S));
      o.body.setLinearVelocity({ x: -2 - Math.random() * 3, y: -3 }); o.body.setAngularVelocity((Math.random() - 0.5) * 5); o.born = r.now;
      const L = window.__lines; if (L && L.SAY && L.SAY.land) raidSay(pick(L.SAY.land), o);
    }
    const ring = document.createElement('div'); ring.className = 'pb-slap'; ring.style.left = x + 'px'; ring.style.top = y + 'px'; r.layer.appendChild(ring); setTimeout(() => ring.remove(), 400);
    r.act = null; r.pull = null; r.grabbed = false; r.bouts = 0; r.swats++; r.away = 5 + Math.random() * 2.5; r.st = 'swat'; r.t = 0; raidSay(pick(SWAT_SAY));
  }
  const intact = () => [...scroller.querySelectorAll('.pb-entry:not(.pb-gone), .pb-fig:not(.pb-gone)')];
  function inView(e) { const a = e.getBoundingClientRect(), b = scroller.getBoundingClientRect(), mid = (a.top + a.bottom) / 2; return mid > b.top + 30 && mid < b.bottom - 30; }
  function raidBody(o, x, y, a, shape, opt) {
    const r = raid; o.body = r.world.createBody({ type: 'dynamic', position: { x, y }, angle: a, linearDamping: 0.05, angularDamping: 0.5, bullet: true });
    o.body.createFixture({ shape, density: 1, friction: 0.7, restitution: 0.1, ...opt }); o.body.setGravityScale(FALL); o.body.setUserData(o);
    o.px = x; o.py = y; o.pa = a; r.objs.add(o); return o;
  }
  // the card breaks from the point where it struck: a web of cracks fanned out from there, every piece a body of its own
  function raidShatter(h) {
    const r = raid, o = h.o, pl = window.planck, b = o.body, pos = b.getPosition(), ang = b.getAngle(), hw = o.w / 2, hh = o.h / 2;
    const lp = b.getLocalPoint({ x: h.x, y: h.y }), P = [clamp(lp.x * S, -hw + 4, hw - 4), clamp(lp.y * S, -hh + 4, hh - 4)];
    const rim = [], edge = (x0, y0, x1, y1) => { const n = 1 + Math.round(Math.hypot(x1 - x0, y1 - y0) / 110); rim.push([x0, y0]); for (let i = 0; i < n; i++) { const f = (i + 0.25 + Math.random() * 0.5) / n; rim.push([x0 + (x1 - x0) * f, y0 + (y1 - y0) * f]); } };
    edge(-hw, -hh, hw, -hh); edge(hw, -hh, hw, hh); edge(hw, hh, -hw, hh); edge(-hw, hh, -hw, -hh);
    const ring = rim.map((q) => { const f = 0.3 + Math.random() * 0.3; return [P[0] + (q[0] - P[0]) * f, P[1] + (q[1] - P[1]) * f]; });
    const polys = []; for (let i = 0; i < rim.length; i++) { const j = (i + 1) % rim.length; polys.push([P, ring[i], ring[j]], [ring[i], rim[i], rim[j], ring[j]]); }
    const area = (p) => { let a = 0; p.forEach((q, i) => { const n = p[(i + 1) % p.length]; a += q[0] * n[1] - n[0] * q[1]; }); return a / 2; };
    const vn = h.vx * h.n[0] + h.vy * h.n[1], bx = h.vx - 1.3 * vn * h.n[0], by = h.vy - 1.3 * vn * h.n[1], ca = Math.cos(ang), sa = Math.sin(ang);
    if (o.say) o.say.el.remove();
    r.world.destroyBody(b); r.objs.delete(o); r.broken++;
    for (let p of polys) {
      const A = area(p); if (Math.abs(A) < 90) continue; if (A < 0) p = [...p].reverse();
      let ok = true; p.forEach((q, i) => { const n = p[(i + 1) % p.length]; if (Math.hypot(q[0] - n[0], q[1] - n[1]) < 3) ok = false; }); if (!ok) continue;
      const shape = new pl.Polygon(p.map((q) => ({ x: q[0] / S, y: q[1] / S }))); if (shape.m_count !== p.length) continue;   // planck quietly makes a box out of a bad outline
      const elp = o.el.cloneNode(true); elp.style.clipPath = `polygon(${p.map((q) => `${(q[0] + hw).toFixed(1)}px ${(q[1] + hh).toFixed(1)}px`).join(',')})`; elp.style.boxShadow = 'none'; r.layer.appendChild(elp);
      const cx = p.reduce((s2, q) => s2 + q[0], 0) / p.length - P[0], cy = p.reduce((s2, q) => s2 + q[1], 0) / p.length - P[1], cl = Math.hypot(cx, cy) || 1, push = (3 + Math.random() * 7) * Math.max(0.3, 1 - cl / 400);
      const ox = (cx * ca - cy * sa) / cl, oy = (cx * sa + cy * ca) / cl;
      const piece = raidBody({ kind: 'piece', el: elp, w: o.w, h: o.h, die: r.now + 3200 + Math.random() * 2600 }, pos.x, pos.y, ang, shape, { filterGroupIndex: -1 });
      piece.body.setLinearVelocity({ x: bx * (0.25 + Math.random() * 0.5) + ox * push, y: by * (0.25 + Math.random() * 0.5) + oy * push - 2 }); piece.body.setAngularVelocity(h.w * 0.4 + (Math.random() - 0.5) * 14);
    }
    o.el.remove();
    const vw = document.documentElement.clientWidth, X = clamp(h.x * S, 0, vw), Y = clamp(h.y * S, 0, innerHeight);
    for (let i = 0; i < 16; i++) { const e = document.createElement('div'); e.className = 'pb-bit'; const sz = 3 + Math.random() * 5; e.style.width = e.style.height = sz + 'px'; r.layer.appendChild(e); const a = Math.random() * Math.PI * 2, sp = 200 + Math.random() * 700; r.bits.push({ el: e, x: X, y: Y, vx: h.n[0] * (200 + Math.random() * 500) + Math.cos(a) * sp * 0.6, vy: h.n[1] * 300 + Math.sin(a) * sp * 0.6 - 200, life: 0.6 + Math.random() * 0.6, t: 0 }); }
    const L = window.__lines, sm = L && L.SAY && L.SAY.smash; if (sm) { const s = document.createElement('div'); s.className = 'pb-say scream'; s.textContent = pick(sm); s.style.translate = `calc(${clamp(X, 90, vw - 90).toFixed(0)}px - 50%) ${clamp(Y - 60, 12, innerHeight - 50).toFixed(0)}px`; r.layer.appendChild(s); setTimeout(() => s.remove(), talk(s)); }
    const card = q('.pb-card'); card.classList.remove('pb-jolt'); void card.offsetWidth; card.classList.add('pb-jolt');
  }
  function raidFrame(t) {
    const r = raid; if (!r) return;
    const ms = Math.min(250, t - (r.last || t)); r.last = t; const dt = ms / 1000;
    if (!document.hidden) {
      r.now += ms; r.acc += dt;
      while (r.acc >= DT) { for (const o of r.objs) { const p = o.body.getPosition(); o.px = p.x; o.py = p.y; o.pa = o.body.getAngle(); } r.world.step(DT, 10, 6); r.acc -= DT; for (const h of r.hits.splice(0)) if (r.objs.has(h.o)) raidShatter(h); }
      raidHand(dt);
      const k = r.acc / DT;
      for (const o of r.objs) {
        const p = o.body.getPosition(), x = (o.px + (p.x - o.px) * k) * S, y = (o.py + (p.y - o.py) * k) * S, a = o.pa + (o.body.getAngle() - o.pa) * k;
        o.el.style.transform = `translate(${(x - o.w / 2).toFixed(2)}px, ${(y - o.h / 2).toFixed(2)}px) rotate(${a.toFixed(4)}rad)`;
        if (o.say) { if (r.now > o.say.until) { o.say.el.remove(); o.say = null; } else o.say.el.style.translate = `calc(${clamp(x, 70, innerWidth - 70).toFixed(0)}px - 50%) ${clamp(y - o.h / 2 - 36, 8, innerHeight - 40).toFixed(0)}px`; }
        if (o.die && r.now > o.die) { o.el.style.opacity = Math.max(0, 1 - (r.now - o.die) / 500).toFixed(2); if (r.now > o.die + 500) { if (o.say) o.say.el.remove(); o.el.remove(); r.world.destroyBody(o.body); r.objs.delete(o); } }
        else if (o.kind === 'card' && !o.hit && !o.die && r.now > o.born + 6000) o.die = r.now;   // one that somehow never broke does not lie around for ever
      }
      for (let i = r.bits.length - 1; i >= 0; i--) { const b = r.bits[i]; b.t += dt; b.vy += 2100 * dt; b.x += b.vx * dt; b.y += b.vy * dt; if (b.t > b.life) { b.el.remove(); r.bits.splice(i, 1); } else b.el.style.transform = `translate(${b.x.toFixed(1)}px, ${b.y.toFixed(1)}px) rotate(${(b.t * 9).toFixed(2)}rad)`; }
    }
    requestAnimationFrame(raidFrame);
  }
  // the hand's own little state machine while it is in the menu
  function raidHand(dt) {
    const r = raid, H = window.__hand, vw = document.documentElement.clientWidth, vh = innerHeight, G = GRIP, P = H.POSES;
    if (!r.c) {   // it finishes whatever it was doing on the page first
      const c = H.get(); if ((c.st !== 'off' && c.st !== 'lurk' && c.st !== 'sulk' && c.st !== 'gloat') || c.o || c.joint) return;
      r.c = c; r.prev = c.st; c.st = 'book'; c.under.classList.add('pb-raid'); c.over.classList.add('pb-raid');
      c.x = vw + 340; c.y = c.ly = vh * 0.5; c.sh = c.y + 70; c.a = Math.PI; c.pose = { ...P.lurk }; r.st = 'enter'; r.t = 0;
    }
    const c = r.c; c.st = 'book'; r.t += dt;
    const set = (st) => { r.st = st; r.t = 0; }, end = (rest) => { if (r.mood === 'slow' && r.act !== 'scroll') r.mood = 'normal'; r.act = null; r.rest = rest; set('rest'); }, wristFor = (Hc, a) => { const ca = Math.cos(a), sa = Math.sin(a); return [Hc[0] - G[0] * ca - G[1] * sa, Hc[1] - G[0] * sa + G[1] * ca]; };
    const grip = () => { const ca = Math.cos(c.a), sa = Math.sin(c.a); return [c.x + G[0] * ca + G[1] * sa, c.y + G[0] * sa - G[1] * ca]; };
    let T = [vw + 30, c.ly], aim = Math.PI, pose = P.eager, rate = 7, wig = 0.12, shake = 0, strain = 0, vmax = 1e9;
    const angry = r.mood === 'angry', slow = r.mood === 'slow';
    const tr = r.target && r.target.isConnected ? r.target.getBoundingClientRect() : null;
    const hold = tr ? [Math.min(tr.right - 30, vw - 60), clamp((tr.top + tr.bottom) / 2, 70, vh - 70)] : null;
    if (r.st === 'enter') { wig = 0.34; T = [vw + 10, vh * 0.5]; if (r.t > 0.5 && r.said < 0) raidSay(pick(RAID_SAY)); if (r.t > 1.7) set('pick'); }
    else if (r.st === 'pick') {
      const all = intact(), seen = all.filter(inView);
      if (!all.length) { set('done'); raidSay('all gone.'); }
      else if (!r.act) {   // what now? one of four things, never the same twice running
        const max = scroller.scrollHeight - scroller.clientHeight, opts = ['throw', 'eat', 'help', 'scroll'].filter((a) => a !== r.lastAct && (a !== 'scroll' || max > 40));
        r.act = r.force || (angry ? 'throw' : opts[Math.floor(Math.random() * opts.length)]); r.force = null; r.lastAct = r.act; r.acts.push(r.act); r.t = 0;
      }
      else if (r.act === 'scroll') set('scroll');
      else if (seen.length) { r.target = pick(seen); r.scrolling = false; set('reach'); }
      else if (r.t > 0.4 && !r.scrolling) { const e = all[0], sr = scroller.getBoundingClientRect(), er = e.getBoundingClientRect(); scroller.scrollTo({ top: Math.max(0, scroller.scrollTop + er.top - sr.top - 60), behavior: 'smooth' }); r.scrolling = true; }   // nothing left on screen: it turns the page for you
      else if (r.t > 1.6) { r.scrolling = false; r.t = 0; }
    } else if (r.st === 'reach') {
      if (!tr || !inView(r.target)) set('pick');
      else {   // the first time, and when it comes back wary, it creeps: fingers out, a little at a time. Otherwise it just goes for it
        pose = slow ? P.eager : P.lunge; rate = angry ? 28 : 16; if (slow) { vmax = 150; wig = 0.3; aim = Math.PI + Math.sin(r.t * 2.6) * 0.07; }
        T = wristFor(hold, Math.PI); c.ly = hold[1]; const g = grip();
        if (Math.hypot(g[0] - hold[0], g[1] - hold[1]) < 18) { r.target.classList.add('pb-tug'); set('grip'); } else if (r.t > (slow ? 12 : 1.5)) set('pick');
      }
    } else if (r.st === 'grip') {   // it has it by the edge and the card does not want to come out
      if (!tr) set('pick');
      else {
        const gt = angry ? 0.25 : slow ? 0.9 : 0.55; strain = clamp(r.t / (gt - 0.05), 0, 1); pose = {}; for (const k in P.clamp) pose[k] = P.clamp[k] + (P.strain[k] - P.clamp[k]) * strain;
        rate = 30; shake = 1 + 3 * strain; T = wristFor([hold[0] + 26 * strain, hold[1]], aim);
        if (r.t > gt) {
          const e = r.target, el2 = e.cloneNode(true); el2.classList.remove('pb-tug'); if (e.closest('.pb-sec-hand')) el2.classList.add('pb-sec-hand');
          el2.style.width = tr.width + 'px'; el2.style.height = tr.height + 'px'; r.layer.appendChild(el2);
          e.classList.remove('pb-tug'); e.classList.add('pb-gone');
          const g = grip(), cx = tr.left + tr.width / 2, cy = tr.top + tr.height / 2;
          r.held = { kind: 'card', el: el2, w: tr.width, h: tr.height, off: [g[0] - cx, g[1] - cy], x: cx, y: cy, a: 0, vx: 0, vy: 0 };
          r.y0 = hold[1]; const L = window.__lines; if (L && L.SAY && L.SAY.rip) raidSay(pick(L.SAY.rip), r.held);
          if (r.act === 'eat') set('eat');
          else if (r.act === 'help') {   // it holds the card out: take the other end and pull
            const o = r.held; o.st = 0; el2.classList.add('pb-offer');
            el2.addEventListener('pointerdown', (e) => { if (raid !== r || r.held !== o || r.st !== 'offer') return; e.preventDefault(); try { el2.setPointerCapture(e.pointerId); } catch (x) {} r.pull = { x0: e.clientX, dx: 0 }; });
            el2.addEventListener('pointermove', (e) => { if (r.pull && r.held === o) r.pull.dx = Math.max(0, r.pull.x0 - e.clientX); });
            const up = () => { if (r.held === o) r.pull = null; }; el2.addEventListener('pointerup', up); el2.addEventListener('pointercancel', up);
            set('offer');
          } else set('wind');
        }
      }
    } else if (r.st === 'wind') {   // back it goes, cocked over its shoulder
      pose = P.clamp; rate = 9; aim = Math.PI + 0.95; T = wristFor([vw - 90, clamp(r.y0 - 60, 110, vh - 110)], aim);
      if (r.t > 0.2 && r.now - r.said > GAP) raidSay(pick(RAID_SAY));
      if (r.t > (angry ? 0.4 : 0.62)) set('throw');
    } else if (r.st === 'throw') {   // and the whip forward: the card leaves the fingers with the speed they had
      rate = 34; aim = Math.PI - 0.3; T = wristFor([vw - 420, clamp(r.y0 + 10, 110, vh - 110)], aim); pose = r.held ? P.clamp : P.lunge;
      if (r.held && r.t > 0.085) {
        const o = r.held, pl = window.planck; r.held = null;
        let vx = o.vx / S, vy = o.vy / S, sp = Math.hypot(vx, vy); if (vx > -0.8 * sp || sp < 1) { vx = -0.98; vy = -0.2; sp = 1; }
        const v = clamp(sp, 34, 52); vx = vx / sp * v; vy = Math.min(vy / sp * v, -2);
        raidBody(o, o.x / S, o.y / S, o.a, new pl.Box(o.w / 2 / S, o.h / 2 / S));
        o.body.setLinearVelocity({ x: vx, y: vy }); o.body.setAngularVelocity((Math.random() - 0.5) * 9); o.born = r.now; r.thrown++;
        const L = window.__lines; if (L && L.SAY && L.SAY.throw) raidSay(pick(L.SAY.throw), o);
      }
      if (r.t > 0.5) {
        if (angry && --r.fury <= 0) r.mood = 'normal';
        if (angry && r.fury > 0 && Math.random() < 0.3) { r.act = 'scroll'; set('scroll'); } else end(angry ? 0.12 : 0.5 + Math.random() * 0.9);   // it got one: no more creeping
      }
    } else if (r.st === 'offer') {   // "help me rip this": it holds the card out by one end and waits for you to take the other
      const o = r.held; if (!o) end(0.3);
      else {
        const need = Math.min(150, o.w * 0.45), want = r.pull ? Math.min(r.pull.dx, need + 30) : 0; o.st += (want - o.st) * (1 - Math.exp(-dt * (r.pull ? 40 : 12)));
        strain = clamp(o.st / need, 0, 1); pose = {}; for (const k in P.clamp) pose[k] = P.clamp[k] + (P.strain[k] - P.clamp[k]) * strain;
        rate = 10; wig = 0.2; shake = r.pull ? 1 + 3 * strain : 0;
        const gx = clamp(vw * 0.5 + o.w / 2, Math.min(o.w + 24, vw - 70), vw - 70) + (r.pull ? 0 : Math.sin(r.t * 3.2) * 9) - o.st * 0.2;
        T = wristFor([gx, clamp(r.y0, 110, vh - 110)], aim);
        if (!r.pull && r.t > 0.3 && (!o.asked || r.now - r.said > ASK_GAP) && r.t < HELP_WAIT - 1) { o.asked = true; raidSay(pick(HELP_SAY), null, 'help'); }
        if (r.pull && o.st >= need) { raidRip(); set('eat'); }
        else if (!r.pull && r.t > HELP_WAIT) { o.st = 0; o.el.classList.remove('pb-offer'); raidSay(pick(ALONE_SAY)); r.act = 'throw'; set('wind'); }
      }
    } else if (r.st === 'eat') {   // it drags the card off the right edge of the screen, to where its mouth must be
      const o = r.held; if (!o) end(0.4);
      else {
        pose = P.clamp; wig = 0.2;
        if (r.t < 0.55) { rate = 20; T = [c.x, c.y]; } else { rate = 6; vmax = 260 + 520 * Math.min(1, (r.t - 0.55) / 0.5); T = wristFor([vw + o.w + 160, clamp(r.y0, 110, vh - 110)], aim); }
        if (o.x - o.w / 2 > vw + 4 || r.t > 4.5) {
          if (o.say) o.say.el.remove(); o.el.remove(); r.held = null; r.eaten++; r.y0 = clamp(o.y, 90, vh - 90);
          const L = window.__lines, lines = L && L.CLAW_SAY && L.CLAW_SAY.eat; raidSay(lines ? pick(lines) : 'nom.', null, 'eat'); set('chew');
        }
      }
    } else if (r.st === 'chew') {   // crumbs come flying back in
      pose = P.joy; wig = 0.3; shake = 2.5; rate = 9; T = [vw + 40, r.y0]; c.ly = r.y0;
      r.crumb = (r.crumb || 0) + dt; if (r.crumb > 0.13 && r.t < 1.1) { r.crumb = 0; raidCrumbs(vw - 4, r.y0 + (Math.random() - 0.5) * 60, 2, -1); }
      if (r.t > 1.4) end(0.4 + Math.random() * 0.6);
    } else if (r.st === 'hide') {   // it was never here
      pose = P.lurk; rate = 11; wig = 0.02; T = [vw + 420, c.ly]; if (r.t > r.hide) end(0.3);
    } else if (r.st === 'rest') { pose = P.joy; wig = 0.2; T = [vw + 20, c.ly]; if (r.t > r.rest) set('pick'); }
    else if (r.st === 'swat') {   // swatted: it snatches itself back out of the window and nurses its knuckles for at least five seconds
      pose = P.sulk; rate = 13; shake = r.t < 0.35 ? 7 : 0; aim = Math.PI - 0.5; T = [vw + 400, clamp(c.ly - 30, 80, vh - 80)]; wig = 0.02;
      if (r.t > r.away) {
        if (Math.random() < 0.5) { r.mood = 'slow'; raidSay(pick(GRUDGE_SAY)); set('pick'); }
        else { r.mood = 'angry'; r.fury = 3; raidSay(pick(ANGRY_SAY)); if (Math.random() < 0.65) { r.act = r.lastAct = 'scroll'; r.acts.push('scroll'); } set('pick'); }
      }
    } else if (r.st === 'scroll') {   // it takes the right edge of the menu like a scrollbar and yanks the page about
      const sr = scroller.getBoundingClientRect(), max = scroller.scrollHeight - scroller.clientHeight, top = sr.top + 40, span = Math.max(1, sr.height - 80);
      if (max < 40) { r.act = null; set('pick'); }
      else if (!r.grabbed) {
        pose = P.lunge; rate = 20; const hp = [Math.min(sr.right - 6, vw - 20), top + span * scroller.scrollTop / max]; T = wristFor(hp, aim); c.ly = hp[1];
        const g = grip(); if (Math.hypot(g[0] - hp[0], g[1] - hp[1]) < 22 || r.t > 0.9) { r.grabbed = true; r.t = 0; r.dur = 2 + Math.random() * 2; r.s0 = scroller.scrollTop / max; r.ph = Math.random() * 6; r.scrolled = (r.scrolled || []); r.t0 = r.now; raidSay(pick(SCROLL_SAY)); }
      } else {
        const f = clamp(r.s0 + 0.42 * Math.sin(r.t * 8 + r.ph) * Math.min(1, r.t * 3) + 0.12 * Math.sin(r.t * 23), 0, 1);
        pose = P.clamp; rate = 40; shake = 2; T = wristFor([Math.min(sr.right - 6, vw - 20), top + span * f], aim); scroller.scrollTop = f * max;
        if (r.t > r.dur) {   // three seconds, give or take one. Then it either goes on, or lets go and hides
          r.scrolled.push(Math.round(r.now - r.t0));
          if (!angry && r.bouts < 2 && Math.random() < 0.5) { r.bouts++; r.t = 0; r.t0 = r.now; r.dur = 2 + Math.random() * 2; r.s0 = f; r.ph = Math.PI - r.ph; raidSay(pick(MORE_SAY)); }
          else { r.grabbed = false; r.bouts = 0; if (angry) end(0.2); else { r.hide = 2.5 + Math.random() * 2; raidSay(pick(HIDE_SAY), null, 'hide'); set('hide'); } }
        }
      }
    }
    else if (r.st === 'done') { pose = P.sulk; rate = 3; T = [vw + (r.t > 1.6 ? 340 : 60), vh * 0.5]; wig = 0.02; }
    const k = 1 - Math.exp(-dt * rate), ka = 1 - Math.exp(-dt * (rate > 20 ? 30 : 9)), kp = 1 - Math.exp(-dt * (r.st === 'reach' || r.st === 'throw' ? 30 : 12));
    let mx = (T[0] - c.x) * k, my = (T[1] - c.y) * k; const ml = Math.hypot(mx, my), cap = vmax * dt; if (ml > cap) { mx *= cap / ml; my *= cap / ml; }
    c.x += mx; c.y += my; c.a += (aim - c.a) * ka; c.sh += (c.y + 70 - c.sh) * (1 - Math.exp(-dt * 4));
    for (const key in pose) c.pose[key] += (pose[key] - c.pose[key]) * kp;
    if (r.held) {   // the card is pinned in the fingers: it goes where the grip goes and turns with the wrist
      const o = r.held, g = grip(), th = c.a - Math.PI, ca = Math.cos(th), sa = Math.sin(th), x = g[0] - (o.off[0] * ca - o.off[1] * sa), y = g[1] - (o.off[0] * sa + o.off[1] * ca);
      if (dt > 0) { o.vx = (x - o.x) / dt; o.vy = (y - o.y) / dt; } o.x = x; o.y = y; o.a = th;
      const st = o.st || 0; o.el.style.transform = `translate(${(x - o.w / 2 - st / 2).toFixed(2)}px, ${(y - o.h / 2).toFixed(2)}px) rotate(${th.toFixed(4)}rad)` + (st > 0.5 ? ` scaleX(${(1 + st / o.w).toFixed(4)})` : '');
      if (o.say) { if (r.now > o.say.until) { o.say.el.remove(); o.say = null; } else o.say.el.style.translate = `calc(${clamp(x, 70, vw - 70).toFixed(0)}px - 50%) ${clamp(y - o.h / 2 - 36, 8, vh - 40).toFixed(0)}px`; }
    }
    if (r.say) { if (r.now > r.say.until) { r.say.el.remove(); r.say = null; } else { const g = grip(); r.say.el.style.translate = `calc(${clamp(Math.min(c.x, g[0]) - 30, 80, vw - 90).toFixed(0)}px - 50%) ${clamp(Math.min(c.y, g[1]) - 115 - (r.held && r.held.say ? 44 : 0), 10, vh - 50).toFixed(0)}px`; } }
    {   // the patch that takes the swatting click sits over the palm and fingers, wherever they are
      const g = grip(), hx = (c.x + g[0]) / 2, hy = (c.y + g[1]) / 2, on = r.st !== 'swat' && r.st !== 'done' && hx < vw + 40;
      r.swat.style.display = on ? '' : 'none'; if (on) r.swat.style.transform = `translate(${(hx - 95).toFixed(0)}px, ${(hy - 80).toFixed(0)}px)`;
    }
    H.draw(wig, shake, strain);
  }

  // ---- the button: a translate sign, next to the theme switch ----
  const btn = document.createElement('button');
  btn.type = 'button'; btn.className = 'icon-btn pb-open-btn'; btn.id = 'phrasebook'; btn.title = 'Phrasebook: what everything on this page says, and why'; btn.setAttribute('aria-label', 'Open the phrasebook');
  btn.innerHTML = '<svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true"><path fill="currentColor" d="M12.87 15.07l-2.54-2.51.03-.03A17.52 17.52 0 0 0 14.07 6H17V4h-7V2H8v2H1v1.99h11.17C11.5 7.92 10.44 9.75 9 11.35 8.07 10.32 7.3 9.19 6.69 8h-2c.73 1.63 1.73 3.17 2.98 4.56l-5.09 5.02L4 19l5-5 3.11 3.11.76-2.04zM18.5 10h-2L12 22h2l1.12-3h4.75L21 22h2l-4.5-12zm-2.62 7l1.62-4.33L19.12 17h-3.24z"/></svg>';
  btn.addEventListener('click', open);
  nav.insertBefore(btn, document.getElementById('theme'));
  window.__phrasebook = { open, close, raid: raidStart, next: (a) => { if (raid) raid.force = a; }, state: () => ({ isOpen, raid: raid && { act: raid.act, acts: raid.acts, eaten: raid.eaten, ripped: raid.ripped, scrolled: raid.scrolled, held: raid.held && [raid.held.x, raid.held.y, raid.held.w, raid.held.h], st: raid.st, mood: raid.mood, swats: raid.swats, hand: raid.c && [raid.c.x, raid.c.y], objs: raid.objs.size, thrown: raid.thrown, broken: raid.broken, gone: scroller.querySelectorAll('.pb-gone').length } }), get el() { return el; } };
})();
