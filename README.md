# Your Number 🧡

**The honest, free Enneagram.**

Answer 45 short questions and get your Enneagram type — your wing, your triad,
and the lines you walk under stress and in growth. Free forever. No account.
No email. No "pay to unlock your result." Your answers never leave your device.

## Why this exists

The classic Enneagram tests are gatekept — take the test, then a paywall
swallows your result. That's backwards. Self-knowledge shouldn't be owned by
a checkout page. So this test was **written from scratch, in the open**: the
questions are original, authored directly from the classic public descriptions
of each type's core motivation (fear and desire). No copyrighted test content,
no license mines, no tricks.

## How it works

1. **45 original questions**, one at a time, answered on a 1–5 scale
   (*Not me at all* → *That's me exactly*).
2. **Plain scoring**: each of the nine types gets one score; nothing is
   weighted in secret. Ties are reported honestly.
3. **Your result, instantly**: your number, the type's name and blurb, your
   wing (the stronger neighbor), your triad (Gut / Heart / Head), and your
   stress + growth arrow lines.
4. **Copy your result** as plain text and paste it anywhere. No watermark,
   no "upgrade to unlock the rest."

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

Engine tests cover item/type integrity, scoring, wing and arrow logic,
input validation, and the share text. UI tests drive the full flow in jsdom:
intro → 45 answered questions → result → copy → retake → resume — with zero
console errors.

## Privacy

There is no server, no analytics, no accounts. Answers live in your browser's
local storage on your device, and clearing them takes one button. The site is
static files on a CDN.

## Roadmap

- **v2**: an extended 60+ question deep-dive with growth and communication
  notes per type.
- Possible: shareable deep-links that render a specific result.

---

Made with honest ink. MIT license.