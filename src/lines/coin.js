// Keep the coin (chain coin-keep): the coin that stays on the page after the coin game (page/coinbody.js, speaker 'coin'), what
// the hand says when it bites it and when it sees it on the shelf (actors/hand/behaviours/bite.js, lurk.js), and what the cards
// say when the coin pays for one of them or draws the hand away from them (actors/cards.js putBack, spared).
// tests/unit/lines.snapshot.json pins every list (edit, UPDATE_SNAPSHOT=1, review the diff). Every text here is its own: the
// scenario trace names a bubble's list by its text.
import { defineLines } from '../core/lines.js';

/** one language tag per line, by script: Cyrillic = bg, kana / kanji = ja, else en */
const tags = (list) => list.map((t) => (/[Ѐ-ӿ]/.test(t) ? 'bg' : /[぀-ヿ一-鿿]/.test(t) ? 'ja' : 'en'));
const def = (key, list, opts) => defineLines(key, list, { ...opts, lang: tags(list) });

// ---- the coin itself: a small, proud, slightly insecure piece of currency ----
def('coin.land', ['tails. if anyone asks.', 'and I stay.', 'keep the change. I AM the change.', 'nobody spends me today', 'I live on this page now', 'that was my last toss', '*clink*', 'a coin on a web page. sure.', 'finders keepers, coin edition', 'still warm from its palm', 'heads up, down here', 'дзън.', 'チャリン'], {
  who: 'coin',
  trigger: { title: 'The coin stays', when: 'The coin game is over. The coin drops onto the page and stays there, a small coin you can pick up.' },
  gloss: { 'дзън.': 'clink.', 'チャリン': 'clink' },
});
def('coin.thrown', ['heads! no, tails!', 'I am currency, not a discus', 'wheee—*clink*?', 'spin me right round', 'this is how I got here in the first place', 'call it! call it!', 'legal tender, airborne', 'mind my edge', 'flip me properly!', 'I bounce, you know', 'летяаа!', 'くるくる〜'], {
  who: 'coin',
  trigger: { title: 'Thrown coin', when: 'You threw the coin.' },
  gloss: { 'летяаа!': 'I am flyiiing!', 'くるくる〜': 'round and round~' },
});
def('coin.bitten', ['OW. that is my milling', 'I am legal tender!', 'that is a tooth mark', 'hands do not even have teeth!', 'how did you BITE me', 'gold-ish! gold-ish!', 'unhand me, ruffian', 'my rim! my beautiful rim!', 'test me gently!', 'I am not a biscuit', 'ай, зъби!', 'かじられた!'], {
  who: 'coin',
  trigger: { title: 'Bitten', when: 'The hand caught the coin and bit it like gold, to see if it is real.' },
  gloss: { 'ай, зъби!': 'ow, teeth!', 'かじられた!': 'I got bitten!' },
});
def('coin.flicked', ['I am too real.', 'fake? FAKE?', 'I want a second opinion', 'its loss.', 'one hundred percent probably gold', 'I will remember this, hand', 'I am worth something!', 'go bite a card', 'you will regret this at the bank', 'my value is not up for debate', 'истинска съм!', '本物だもん!'], {
  who: 'coin',
  trigger: { title: 'Flicked back', when: 'The hand decided the coin is fake and flicked it back at you.' },
  gloss: { 'истинска съм!': 'I am real!', '本物だもん!': 'I am the real thing!' },
});
def('coin.reached', ['finally. a connoisseur.', 'take me, I am worth it', 'not the cards. me.', 'appraise me, then', 'gently, I am collectible', 'ah. an investor.', 'you have expensive taste', 'careful, I have value', 'do I get a receipt?', 'yes, the shiny one', 'вземи мен!', '選ばれた…'], {
  who: 'coin',
  trigger: { title: 'Reached for', when: 'You left the coin on the shelf. The hand comes for it, and for nothing else.' },
  gloss: { 'вземи мен!': 'take me!', '選ばれた…': 'I have been chosen…' },
});

// ---- the hand: a greedy gremlin who knows gold when it bites it ----
def('hand.fake', ['fake.', 'chocolate? no. fake.', 'fake. not even chocolate.', 'tastes like a forgery', 'fake. I would know.', 'counterfeit. typical.', 'hm. plastic.', 'nope. pyrite.', 'fool\'s gold. for a fool.', 'fake. keep it.', 'not gold. not even brass.', 'arcade token. fake.', 'фалшива.', '偽物。'], {
  who: 'hand',
  trigger: { title: 'Fake', when: 'You threw the coin at the hand, or left it on the shelf. It bites it like gold, and flicks it back.' },
  gloss: { 'фалшива.': 'fake.', '偽物。': 'a fake.' },
});
def('hand.fakeAgain', ['still fake.', 'still fake. I checked.', 'it did not get any realer', 'fake. again.', 'how many times', 'yep. still fake.', 'fake. with my tooth marks now', 'stop sending me this', 'fake. I SAID fake.', 'you again.', 'fake. and I am out of patience', 'пак е фалшива.', 'やっぱり偽物。'], {
  who: 'hand',
  trigger: { title: 'Still fake', when: 'The hand bites the same coin again, later on the same visit.' },
  gloss: { 'пак е фалшива.': 'fake again.', 'やっぱり偽物。': 'a fake after all.' },
});
def('hand.shelfCoin', ['ooh. shiny.', 'is that gold?', 'forget the cards. COIN.', 'money on the shelf. mine.', 'coins first. always coins first.', 'mine mine mine mine', 'is that for me? it is for me.', 'who leaves money lying around?', 'cards later. treasure now.', 'shiny shiny shiny', 'пари!', 'お金だ!'], {
  who: 'hand',
  trigger: { title: 'A coin on the shelf', when: 'You left the coin on the shelf. Coins beat cards: the hand goes for the coin.' },
  gloss: { 'пари!': 'money!', 'お金だ!': 'money!' },
});
def('hand.paid', ['you PAID for it?', 'that was MY coin', 'buying them back now?', 'that one had my tooth marks', 'bribery. disgusting. effective.', 'it was fake anyway', 'big spender', 'a coin for a card? robbery', 'I want a receipt', 'they take fake coins? noted.', 'платено, а?', '買い戻したの?'], {
  who: 'hand',
  trigger: { title: 'Paid for', when: 'You dropped the coin into an empty slot and the card grew back. The hand saw it.' },
  gloss: { 'платено, а?': 'paid, huh?', '買い戻したの?': 'you bought it back?' },
});

// ---- the cards: panicky, dramatic, and now and then grateful ----
def('card.paid', ['paid!', 'paid in full', 'I have been bought back!', 'receipt, please', 'cash only. thank you.', 'worth every coin', 'I am home. and expensive.', 'bought and paid for', 'back, and fully paid up', 'one card, one coin. fair.', 'the coin was fake, but shh', 'платено!', '支払い済み!'], {
  who: 'card',
  trigger: { title: 'Paid', when: 'You dropped the coin into an empty slot. The card that was ripped out of it grows back at once.' },
  gloss: { 'платено!': 'paid!', '支払い済み!': 'paid!' },
});
def('card.spared', ['take the coin! take the coin!', 'phew. phew. phew.', 'it wants the coin, not me', 'go on, the shiny one', 'I am worth less! good!', 'never been so glad to be cheap', 'money talks. I scream.', 'yes, the coin, the COIN', 'not me this time', 'saved by small change', 'спасих се!', '助かった…'], {
  who: 'card',
  trigger: { title: 'Spared', when: 'A card and the coin lie on the shelf. The hand goes for the coin, and the card is very relieved.' },
  gloss: { 'спасих се!': 'I am saved!', '助かった…': 'saved…' },
});

export function install(app) {}
