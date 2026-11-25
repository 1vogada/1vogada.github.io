# styles/

`styles/mainStyle.css` belongs to the old pages (blog, profile, blog posts) and `styles/phrasebook.css` is fetched by the phrasebook
on first open; neither is part of this split.

The other seven files are the inline `<style>` block of `index.html`, split by feature. Every rule was moved unchanged (same
selectors, declarations, media queries and keyframes); only the indentation and a comment at the top of each file are new.

| file | what is in it |
|---|---|
| `base.css` | the colour tokens (`:root`, dark by `prefers-color-scheme`, dark by `html[data-theme="dark"]`), page frame, header, hero, intro, buttons, toolbar and search, footer, toast; `@keyframes caret, roll` |
| `cards.css` | the project grid and cards (tilt, band motif and its dark filter), sections, pins, posts, the post reader; the `prefers-reduced-motion` rule for the cards and the caret; `@keyframes rise` |
| `physics.css` | cards as bodies in `#phys` (held, pulled, regrowing, their `.say` bubbles), shards, throwing, the katana and the action buttons, debris and slashes, the secret shelf, the screen shake; `@keyframes regrow, agony, say, slash, shelf-in, shake` |
| `hand.css` | the claw (SVG parts, over/under layers, dark rim), its hit box and bubble, ink bits and strands, `html.hand-show` z-indexes |
| `omikuji.css` | the Surprise me slip, its buttons and their `.btn-say` bubbles, the secret ×, the coin; the slip's `prefers-reduced-motion` rule; `@keyframes unroll, stamp, poof, puff, btnsay, snapray` |
| `fog.css` | the banner's fog canvas `#fog` and the kiri flood canvas `#kiri` |
| `crazy.css` | `.slop-only` / `.calm-only`, the flashing-lights warning, every `html.crazy` rule (also the ones that hide the katana, the secret, the claw, `#phys` and the kiri flood), crazy mode's `prefers-reduced-motion` rule; `@keyframes slop, wobble, blink, run` |

## Link order

Link them in this order, in the `<head>` where the inline `<style>` block is now (after the theme script and the import map, before
`</head>`), and remove the inline block:

```html
<link rel="stylesheet" href="/styles/base.css">
<link rel="stylesheet" href="/styles/cards.css">
<link rel="stylesheet" href="/styles/physics.css">
<link rel="stylesheet" href="/styles/hand.css">
<link rel="stylesheet" href="/styles/omikuji.css">
<link rel="stylesheet" href="/styles/fog.css">
<link rel="stylesheet" href="/styles/crazy.css">
```

The paths are absolute because index.html is also served for other routes (posts); a `?v=` stamp may be appended.

### Why this order

- The inline block was already laid out roughly in this order (tokens and page frame, cards, card physics and katana, claw, slip,
  then crazy mode last). Each file keeps its rules in their original order, so a rule still comes after every rule it overrode
  inside its feature: `base` first because everything reads its custom properties and later files override its generic rules
  (`.btn.primary` is narrowed by `.omi-actions .btn.primary`, `.band` by `.slip .band.bottom`, `html.crazy …` everywhere);
  `crazy` last because crazy mode overrides the calm page (`html.crazy .slop-only` after `.slop-only`, `html.crazy .card` after
  `.card`, and so on, as it did in the inline block).
- Some rules sat away from their feature in the inline block and moved: `#fog`/`#kiri` (after the hero rules) to `fog.css`, the
  `html.crazy` rules that hide a feature (`#kiri`, `.katana`, `.secret`, `.claw`, `#phys`) and `.slop-only` to `crazy.css`,
  `html.hand-show .claw.over …` (inside the slip's rules) to `hand.css`, the cards' reduced-motion block (after the warning) to
  `cards.css`, `.toast` to `base.css`. Moving them changes the order of some pairs of rules, and the order of two rules only
  matters when both set the same property on the same element with the same specificity and importance. For every reordered
  pair, `tests/unit/styles-split.test.js` checks that they share no property, or that no selector of one has the same specificity
  (and pseudo-element) as a selector of the other; no pair needs an exception. `fog.css` could go anywhere for the same reason:
  it comes after `omikuji` only to keep the requested order.
- `@keyframes` names are unique, so where a keyframes rule sits does not matter; each lives with the feature that uses it.

## Checks

- `node --test tests/unit/styles-split.test.js`: parses the inline block and the seven files (concatenated in link order) with
  Chromium's CSSOM and checks the same rules come out, each file in original order, and the reordered pairs as above. Once the
  inline block is gone from index.html it reads it from git and also checks the `<link>` order in index.html.
- `node --test tests/unit/styles-split.screens.js` (about a minute): screenshots the page with the inline block and a copy with
  the links (whichever of the two index.html is not, built in memory) in 12 states and checks they are pixel-identical.
