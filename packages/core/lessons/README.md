# Community lessons

Anyone can add a short lesson in any language. Each lesson is one JSON file. A mod reviews it, and once merged it shows up under **Community lessons** in the app.

## Add a lesson

1. Fork the repo and copy [`es/buying-fruit-at-the-market.json`](es/buying-fruit-at-the-market.json) to `packages/core/lessons/<language>/<your-lesson-id>.json`.
   - `<language>` is a language code like `es`, `fr` or `pt-BR`.
   - The file name must equal `scenario.id` (lowercase, digits, hyphens).
2. Write the lesson (see the format below).
3. Run `pnpm test`. It checks every lesson and prints what's wrong.
4. Run `pnpm dev`, play your lesson, and check the scene.
5. Open a pull request. A mod listed in [`.github/CODEOWNERS`](../.github/CODEOWNERS) reviews it.

## Format

| Field | What it is |
| --- | --- |
| `authors` | Your GitHub usernames (1–5) |
| `emoji`, `blurb` | Shown on the lesson card (blurb ≤ 120 characters, in English) |
| `scenario.title`, `setting` | In English. The setting describes the place (it's also used to paint the backdrop) |
| `scenario.cast` | 1–3 characters. `characterId` is a catalog character: `carpenter`, `baker`, `barista`, `clerk` |
| `scenario.goals` | 1–4 things the learner must do. Each needs exactly one learner line |
| `scenario.vocab` | Up to 12 words with English meanings |
| `scenario.lines` | Up to 20 lines. `speaker` is a cast `characterId` or `learner`. Learner lines set `expects` to a goal id; other lines use `null`. `animation`: `idle`, `talk`, `wave`, `nod`, `point`, `think` |
| `recipe` | The 3D scene, built only from catalog IDs (see below) |

### Scene recipe

- `room`: `wood-workshop`, `bakery` or `shop-counter`.
- `character`: the main cast member's `characterId`.
- `props`: up to 12 `{ "item", "slot" }`. Slots: `counter` (the counter between you and the character), `counter-top` (small items on it), `back` (against the wall), `floor-left`, `floor-right` (one item each).
- Prop IDs and the slots each fits are in [`src/scene/catalog/props.ts`](../src/scene/catalog/props.ts).

If a prop doesn't fit, `pnpm test` tells you which one.

## Review checklist for mods

- Text is natural, correct and at the stated level (ask a fluent speaker if you aren't one).
- Family-friendly. No real people, brands or personal details.
- The scene plays well in `pnpm dev`.
- Approve, then merge. CI must be green.
