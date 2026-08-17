# Your Number 🧡

**The honest, free Enneagram.**

Answer honest questions and get your Enneagram type — your wing, your triad,
the lines you walk under stress and in growth, and (on the deep read) what
growth looks like for you and how you're heard. Free forever. No account.
No email. No "pay to unlock your result." Your answers never leave your device.

## Two passes, zero gates

- **Short pass (45 questions)** — your number in about six minutes, with raw
  scores for all nine types shown on the result page. Close calls and ties are
  reported honestly, never faked into a verdict.
- **Extended pass (27 more questions, always offered)** — 72 questions total,
  more reverse-keyed items tuned to separate the classic near-miss pairs
  (1/8, 4/5). When the short pass lands a close call, the deep-dive questions
  for the tied types come first — adaptive, and still free.

Either way the result is yours: type, wing, triad, stress/security arrows,
score bars, and a real "choose your number" picker when the margin is thin.
The extended read adds growth and communication notes per type.

## Why this exists

The classic Enneagram tests are gatekept — take the test, then a paywall
swallows your result. That's backwards. Self-knowledge shouldn't be owned by
a checkout page. So this test was **written from scratch, in the open**: the
questions are original, authored directly from the classic public descriptions
of each type's core motivation (fear and desire). No copyrighted test content,
no license mines, no tricks.

## How it works

1. **Original questions**, one at a time, answered on a 1–5 scale
   (*Not me at all* → *That's me exactly*), with reverse-keyed items to stop
   blanket agreement from flattening your profile.
2. **Plain scoring**: each of the nine types gets one score; nothing is
   weighted in secret. Ties and near-ties are reported, not hidden.
3. **Your result, honestly**: your number, the type's name and blurb, wing,
   triad, stress + growth arrows — and a nine-bar score chart so you can see
   how close it really was. When it's close, the app says so and hands the
   decision back to you. Notes on classic near-miss pairs (1/8, 4/5, 9/6) help
   you read the top contenders side by side.
4. **Copy your result** as plain text and paste it anywhere, or copy the raw
   scores as JSON. No watermark, no "upgrade to unlock the rest."
5. **Print the result card** straight from your browser — Ctrl/Cmd+P gives a
   clean single-page result sheet.

## Stack

- Static site: `index.html` + `css/styles.css` + `js/engine.js` + `js/app.js`
- Engine is DOM-free and Node-requireable; UI is guarded for testability
- Tests: Node (engine) + jsdom (full-page UI flow)
- Deployed on Cloudflare Pages (git-connected, auto-deploys on push)

## Run the tests

```bash
npm install
npm test
```

Engine tests cover item/type integrity (72 items, 8 per type, 15 reverse-keyed),
short and extended scoring on both scales, wing and arrow logic, adaptive
ordering, input validation, and the share text. UI tests drive the full flow
in jsdom: short pass → extended pass → close calls → choose-your-number →
growth notes — with zero console errors.

## Privacy

There is no server, no analytics, no accounts. Answers live in your browser's
local storage on your device, and clearing them takes one button. The site is
static files on a CDN.

## Roadmap

- Possible: shareable deep-links that render a specific result.
- Possible: an image/PDF export of the result card (print stylesheet already ships).

---

Made with honest ink by CHΛOS ([@daanisharif](https://twitter.com/daanisharif)). MIT license.