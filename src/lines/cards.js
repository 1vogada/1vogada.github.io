// What the cards say: legacy SAY (all but the katana's), AGONY, PANIC, NOTME, BEG, and the cards' toasts.
// Generated once from the old scripts; tests/unit/lines.snapshot.json pins every list (edit, UPDATE_SNAPSHOT=1, review the diff).
// Keep each array's contents and order exactly: line() draws by index, and the array itself is the picker's memory key.
// lang: one tag per line ('en' | 'bg' | 'ja', by script: Cyrillic = bg, kana/kanji = ja, else en), or one string for all.
import { defineLines } from '../core/lines.js';

defineLines('card.pull', ['hey!', 'nope.', 'let go!', 'I live here', 'hands off', 'не!', 'やめて!', 'excuse me?'], {
  who: 'card', legacy: 'SAY.pull',
  trigger: { title: 'On being taken hold of',
    when: 'You begin to drag a card that still sits in its place in the grid. A card the Hand plucks out of the air says the same.' },
  gloss: { 'не!': 'no!', 'やめて!': 'stop it!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja', 'en'],
});

defineLines('card.strain', ['nnngh!', 'holding… on…', 'not… today', 'stop iiit', 'my roots!!', 'ъъъгх'], {
  who: 'card', legacy: 'SAY.strain',
  trigger: { title: 'Under strain',
    when: 'You have pulled some 160 px from where you took hold, and the root begins to lose its grip.' },
  gloss: { 'ъъъгх': 'nnngh' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg'],
});

defineLines('card.back', ['ha!', 'told you', 'too weak', 'nice try', 'stubborn > you'], {
  who: 'card', legacy: 'SAY.back',
  trigger: { title: 'Let go in time',
    when: 'You release the card before it tears. It springs home, and gloats.' },
  lang: 'en',
});

defineLines('card.rip', ['AAAH!', 'nooo!', 'rude.', 'ау!', 'I was comfy!', 'put me back!'], {
  who: 'card', legacy: 'SAY.rip',
  trigger: { title: 'Torn out',
    when: 'The third tug. The root gives up and the card comes loose in your hand.' },
  gloss: { 'ау!': 'ow!' },
  lang: ['en', 'en', 'en', 'bg', 'en', 'en'],
});

defineLines('card.loosen', ['*crack*', 'I felt that!', 'that was a root!', 'wiggle wiggle', 'not again…', 'one more and I go', 'пук!', 'ぐらぐら…'], {
  who: 'card',
  trigger: { title: 'A tug, like a tooth',
    when: 'You hold the strain until the root gives a notch. Ease off and tug again: a card comes out on the third tug. Yank it past 350 px before that and it tears in two.' },
  gloss: { 'пук!': 'crack!', 'ぐらぐら…': 'wobbly…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('card.throw', ['wheee', 'NOOO', 'not the wall!', 'I can fly?!', 'aaaaaa'], {
  who: 'card', legacy: 'SAY.throw',
  trigger: { title: 'Thrown',
    when: 'A loose card is let go at more than 900 px a second.' },
  lang: 'en',
});

defineLines('card.land', ['oof', 'ow', 'ugh', "I'm fine", 'ох…', 'my corner!'], {
  who: 'card', legacy: 'SAY.land',
  trigger: { title: 'A hard landing',
    when: 'The card strikes something at more than 500 px a second, and survives it.' },
  gloss: { 'ох…': 'oh…' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'en'],
});

// the new Heads / Tails buttons, as they poof in (legacy kept them in SAY). scenes/coin draws the pair itself from list('button.hi')
defineLines('button.hi', ['hi!', 'hello again', 'we are back', 'miss us?', 'pick me!', 'no, me!', 'hey there', 'ta-da', 'здрасти!', 'ей!', 'ето ни пак', 'やあ!', 'こんにちは', 'ただいま', 'おっす'], {
  who: 'button', legacy: 'SAY.btnhi',
  trigger: { title: 'The new buttons',
    when: 'After it snaps, a fresh Heads and Tails poof in and each says hello.' },
  gloss: { 'здрасти!': 'hi!', 'ей!': 'hey!', 'ето ни пак': 'here we are again', 'やあ!': 'hey!', 'こんにちは': 'hello', 'ただいま': 'we are home', 'おっす': 'yo' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'en', 'bg', 'bg', 'bg', 'ja', 'ja', 'ja', 'ja'],
});

defineLines('card.cutting', ['AAAAAAAAA', 'IT IS IN ME', 'STOP STOP STOP', 'NOT THE MIDDLE', 'I CAN FEEL IT', '痛い痛い痛い!!', 'ААААААА!', 'боли боли боли'], {
  who: 'card', legacy: 'SAY.cutting',
  trigger: { title: 'With the blade inside',
    when: 'The very tip of the katana has entered the card and has not yet come out.' },
  gloss: { '痛い痛い痛い!!': 'it hurts, it hurts, it hurts!!', 'ААААААА!': 'a scream', 'боли боли боли': 'hurts, hurts, hurts' },
  lang: ['en', 'en', 'en', 'en', 'en', 'ja', 'bg', 'bg'],
});

defineLines('card.stab', ['was I spared???', 'just a flesh wound', "I'm leaking", "that's going to scar", 'it only went in a little', 'you missed. mostly.', 'am I… alive?', 'まだ生きてる…?', 'жив съм?!'], {
  who: 'card', legacy: 'SAY.stab',
  trigger: { title: 'Stabbed, not cut',
    when: 'The tip leaves by the same side it came in through. The card is not divided, but it bleeds for a while.' },
  gloss: { 'まだ生きてる…?': 'still alive…?', 'жив съм?!': 'I am alive?!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'en', 'ja', 'bg'],
});

defineLines('card.slice', ['AAAAAAARGH!!', 'NOOOOOOOO—', 'EEEEEEEEK!!', 'GYAAAAAAH!', 'AAAAAAAAAAA!!!', 'ААААААААА!!!', 'НЕЕЕЕЕЕЕ!', 'ぎゃああああ!!', 'うわあああ!!', 'HHHHRRRKK—'], {
  who: 'card', legacy: 'SAY.slice',
  trigger: { title: 'Cut in two',
    when: 'The tip goes in by one side and out by another. These are also the last words of a card torn in half between you and the Hand.' },
  gloss: { 'ААААААААА!!!': 'a scream', 'НЕЕЕЕЕЕЕ!': 'NOOOOO!', 'ぎゃああああ!!': 'a shriek', 'うわあああ!!': 'a wail' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'bg', 'ja', 'ja', 'en'],
});

defineLines('card.smash', ['AAAAAAAAAA—', 'NOOOOO!!', 'ААААА!!', 'ぐはっ!!', 'KRRRK—'], {
  who: 'card', legacy: 'SAY.smash',
  trigger: { title: 'Shattered',
    when: 'A thrown card meets a wall, the floor or another card at more than 1300 px a second. Only a thrown card breaks; one that is dropped or carried never does.' },
  gloss: { 'ААААА!!': 'a scream', 'ぐはっ!!': 'the wind knocked out of it' },
  lang: ['en', 'en', 'bg', 'ja', 'en'],
});

// the card screams, and the further it is stretched the louder (speech mode: 'agony', tier = key + .0/.1/.2)

defineLines('card.agony.0', ['uh oh', 'not again', 'too… long…', 'I bend, I do not br—', 'pick a side!', 'ъъъгх', 'のびてる!'], {
  who: 'card', legacy: 'AGONY.0',
  trigger: { title: 'Stretched: the first degree',
    when: 'You and the Hand each hold an end of the same card, and it has begun to grow longer.' },
  gloss: { 'ъъъгх': 'nnngh', 'のびてる!': 'I am stretching!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('card.agony.1', ['IT HURTS', 'STOP PULLING', 'MY MIDDLE!!', 'I am not cheese!', 'LET GO LET GO', 'БОЛИИИ!', '痛い!!'], {
  who: 'card', legacy: 'AGONY.1',
  trigger: { title: 'Stretched: the second degree',
    when: 'The card is pulled past a third of what it can bear. Also said in the Hand’s fist, while it is being crushed.' },
  gloss: { 'БОЛИИИ!': 'IT HUUURTS!', '痛い!!': 'it hurts!!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('card.agony.2', ['AAAAAAAAAAAAAA', 'I CAN SEE MY INSIDES', 'I AM COMING APART', 'NOT LIKE THIS', 'МАМООООО', 'ぎゃああああ!!', 'AAAAAAA—'], {
  who: 'card', legacy: 'AGONY.2',
  trigger: { title: 'Stretched: the third degree',
    when: 'The card is close to tearing, or close to being a ball of paper. The letters grow, redden and shake.' },
  gloss: { 'МАМООООО': 'MOOOMMY', 'ぎゃああああ!!': 'a shriek' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja', 'en'],
});

// what the card on the shelf says while the hand is on its way

defineLines('card.panic.0', ['uh. guys?', 'is that… coming here?', "it's not looking at me. right?", 'nobody move', 'I do not like this shelf', 'ъъъ… хора?', 'あれ、こっち来てる?'], {
  who: 'card', legacy: 'PANIC.0',
  trigger: { title: 'On the shelf: it has noticed',
    when: 'A card lies on the secret shelf and the Hand has started across the screen for it.' },
  gloss: { 'ъъъ… хора?': 'uhh… guys?', 'あれ、こっち来てる?': 'huh, is it coming this way?' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('card.panic.1', ['IT IS COMING HERE', 'somebody pick me up!', 'not me not me not me', 'I am just a card!', 'take another one!', 'ПОМОЩ!', 'こっち来ないで!'], {
  who: 'card', legacy: 'PANIC.1',
  trigger: { title: 'On the shelf: it is coming',
    when: 'The Hand is a third of the way there. The card shakes and hops and shuffles away from it.' },
  gloss: { 'ПОМОЩ!': 'HELP!', 'こっち来ないで!': 'do not come over here!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('card.panic.2', ['HELP HELP HELP', 'PICK ME UP PICK ME UP', 'I CAN SMELL IT', 'AAAAAAAAAA', 'DO SOMETHING', 'НЕ МЕ ЯЖ!!', '助けてぇぇ!!'], {
  who: 'card', legacy: 'PANIC.2',
  trigger: { title: 'On the shelf: it is here',
    when: 'The Hand is nearly on it. Pick the card up and it is saved.' },
  gloss: { 'НЕ МЕ ЯЖ!!': 'DO NOT EAT ME!!', '助けてぇぇ!!': 'heeelp!!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// what the cards near the shelf say
defineLines('card.notme', ['take that one!', 'not me. phew.', "don't look at me", 'I was never here', 'it wants the one on the shelf', 'вземи него!', 'あっちだよ!'], {
  who: 'card', legacy: 'NOTME',
  trigger: { title: 'Not me',
    when: 'Said by a loose card lying near the shelf while the Hand is coming for another.' },
  gloss: { 'вземи него!': 'take him!', 'あっちだよ!': 'it is that one, over there!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('card.beg', ['please', 'I will be good', 'I have unmerged commits!', 'not the corners', 'we can talk about this', 'моля те…', 'やめて…', 'tell me what you want'], {
  who: 'card', legacy: 'BEG',
  trigger: { title: 'Begging',
    when: 'In the Hand’s closed fist, in the quiet pause after the second squeeze.' },
  gloss: { 'моля те…': 'please…', 'やめて…': 'stop…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja', 'en'],
});

// ---- tug of war: an old hand on one end, the arm on the other ----
defineLines('card.wrest', ['I am not a wishbone!', 'pick ONE hand!', 'this is not how hands work!', 'I can feel my staples!', 'somebody call a referee!', 'ще ме разкъсате!', 'さけるー!'], {
  who: 'card',
  trigger: { title: 'Pulled two ways', when: 'An old hand is crushing it near the right edge when the arm grabs its other end. Both pull; it stretches.' },
  gloss: { 'ще ме разкъсате!': 'you will tear me apart!', 'さけるー!': 'I\'m tearing!' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

// toasts: one-line lists, no random draw
// ---- apologise to the card (right-click a card that has been ripped out or torn) ----
defineLines('card.forgive', ['…fine. I forgive you.', 'apology accepted', 'it is ok. it is not ok.', 'just this once', 'прощавам ти', 'ゆるす…'], {
  who: 'card',
  trigger: { title: 'Forgiven', when: 'Right-click a card you ripped out or tore, and pick "apologise". Mostly it forgives you.' },
  gloss: { 'прощавам ти': 'I forgive you', 'ゆるす…': 'I forgive…' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('card.grudge', ['no. just no.', 'never.', 'I will remember your face', 'say it like you mean it', 'не.', 'いやだ'], {
  who: 'card',
  trigger: { title: 'Not forgiven', when: 'You apologise to a torn card, and it does not take it.' },
  gloss: { 'не.': 'no.', 'いやだ': 'no way' },
  lang: ['en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('card.again', ['you said that already', 'words are cheap', 'still torn, though'], { who: 'card', lang: 'en',
  trigger: { title: 'Sorry again', when: 'You apologise to the same card a second time.' } });

// ---- the Konami code: every card is an omikuji slip for the rest of the visit (page/omikuji.js) ----
// said by the card you ripped out, followed by its fortune's kanji and name ("it says: 大吉 · Great blessing")
defineLines('card.omikuji', ['let me read it…', 'it says:', 'unrolling… it says', 'the slip says:', 'my fortune:', 'drum roll…', 'гласи:', 'おみくじによると'], {
  who: 'card',
  trigger: { title: 'Its fortune', when: 'After the Konami code every card is a folded omikuji slip. Rip one out of its slot: it unfolds and reads you its fortune.' },
  gloss: { 'гласи:': 'it reads:', 'おみくじによると': 'according to the fortune slip' },
  lang: ['en', 'en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('card.cursed', ['bad luck. tie me to a tree.', 'of course I got the curse', 'this is your fault', 'can I draw again?', 'cursed. lovely.', 'проклет съм.', '凶だって…'], {
  who: 'card',
  trigger: { title: 'A curse', when: 'The slip you ripped out unfolds to 凶, the curse.' },
  gloss: { 'проклет съм.': 'I am cursed.', '凶だって…': 'it says "curse"…' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});
defineLines('card.tornslip', ['you tore my fortune!', 'that is seven years of bad luck', 'torn fortunes come true backwards', 'now nobody gets to know', 'the gods saw that', 'скъса ми късмета!', 'ばちが当たるよ'], {
  who: 'card',
  trigger: { title: 'A torn fortune', when: 'You yank an omikuji slip so hard it tears in two. Both halves read 凶.' },
  gloss: { 'скъса ми късмета!': 'you tore my luck!', 'ばちが当たるよ': 'you will be punished for that' },
  lang: ['en', 'en', 'en', 'en', 'en', 'bg', 'ja'],
});

defineLines('toast.ripped', ['Ripped it out! Stack them, or throw one hard to smash it.'], { who: 'toast', lang: 'en' });
defineLines('toast.smashed', ['Smashed!'], { who: 'toast', lang: 'en' });
defineLines('toast.smashed10', ['10 cards smashed. Feeling better?'], { who: 'toast', lang: 'en' });
defineLines('toast.snapped', ['Too hard: it tore. Tug a few times instead, like pulling a tooth.'], { who: 'toast', lang: 'en' });
defineLines('toast.halved', ['It keeps its half.'], { who: 'toast', lang: 'en' });

export function install(app) {}
