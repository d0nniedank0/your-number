/* =========================================================================
   Your Number — engine
   Original questions and type profiles for the Enneagram, authored fresh.
   No RHETI/Riso-Hudson content. DOM-free; Node-requireable for tests.
   ========================================================================= */

"use strict";

const TYPES = [
  {
    n: 1,
    name: "The Reformer",
    triad: "gut",
    fear: "being corrupt, wrong, or bad",
    desire: "to be good, right, and whole",
    blurb:
      "You carry a clear inner sense of how things ought to be, and you hold yourself to that standard first. Your gift is integrity and improvement — the world gets better because you pass through it. Life softens when you remember that order is a means, not a measure of your worth.",
  },
  {
    n: 2,
    name: "The Helper",
    triad: "heart",
    fear: "being unloved or unwanted",
    desire: "to feel loved and needed",
    blurb:
      "You sense what people need before they can say it, and you move toward them without being asked. Your gift is generosity — you warm the rooms you enter. Life softens when you remember your own needs are allowed to take the same warmth you give away.",
  },
  {
    n: 3,
    name: "The Achiever",
    triad: "heart",
    fear: "being worthless or a nobody",
    desire: "to feel valuable and seen",
    blurb:
      "You shape yourself to the task at hand and get things done — often beautifully. Your gift is excellence and the ability to inspire it. Life softens when you remember you are worth more than what you produce.",
  },
  {
    n: 4,
    name: "The Individualist",
    triad: "heart",
    fear: "being ordinary, flawed, or unseen",
    desire: "to be uniquely and authentically yourself",
    blurb:
      "You feel in deep colors, and meaning matters to you more than ease. Your gift is depth and beauty — you show others that life has a texture worth attending to. Life softens when you remember that being human is not a lesser version of being special.",
  },
  {
    n: 5,
    name: "The Investigator",
    triad: "head",
    fear: "being incompetent or overwhelmed",
    desire: "to be capable, knowing, and self-sufficient",
    blurb:
      "You need to understand before you act, and you protect your attention like a fire. Your gift is depth of knowledge and clear sight. Life softens when you remember that understanding is a doorway, not a house.",
  },
  {
    n: 6,
    name: "The Loyalist",
    triad: "head",
    fear: "being without support or guidance",
    desire: "to be safe and secure",
    blurb:
      "You see what could go wrong so the people you love rarely have to. Your gift is loyalty and vigilance — you are the one who stays. Life softens when you remember that doubt is a lantern, not a leash.",
  },
  {
    n: 7,
    name: "The Enthusiast",
    triad: "head",
    fear: "being trapped in pain or deprivation",
    desire: "to be satisfied, free, and full of joy",
    blurb:
      "You say yes to life and keep several doors open at once. Your gift is joy and possibility — you are living proof that the world is wide. Life softens when you remember that staying in one place long enough to feel it is also a kind of freedom.",
  },
  {
    n: 8,
    name: "The Challenger",
    triad: "gut",
    fear: "being controlled, harmed, or betrayed",
    desire: "to protect yourself and those you love",
    blurb:
      "You are honest to the bone, and you step toward trouble when others step back. Your gift is strength and protection — you are the roof in a storm. Life softens when you remember that letting yourself be seen is not a surrender.",
  },
  {
    n: 9,
    name: "The Peacemaker",
    triad: "gut",
    fear: "loss, separation, and disconnection",
    desire: "to have inner peace and harmony",
    blurb:
      "You hold the space where others can disagree and still be friends. Your gift is calm and inclusion — you make room for everyone. Life softens when you remember that your own voice is part of the harmony, and peace without you in it is not peace.",
  },
];

const TRIADS = {
  gut: { label: "The Gut — instinctive", types: [8, 9, 1] },
  heart: { label: "The Heart — emotional", types: [2, 3, 4] },
  head: { label: "The Head — thinking", types: [5, 6, 7] },
};

// Stress arrow (when moving in disintegration) / security arrow (when growing)
const ARROWS = {
  1: { stress: 4, security: 7 },
  2: { stress: 8, security: 4 },
  3: { stress: 9, security: 6 },
  4: { stress: 2, security: 1 },
  5: { stress: 7, security: 8 },
  6: { stress: 3, security: 9 },
  7: { stress: 1, security: 5 },
  8: { stress: 5, security: 2 },
  9: { stress: 6, security: 3 },
};

// Five original questions per type, grounded in the classic public
// descriptions of each type's motivation (fear/desire). -- 45 total.
// Questions, five per type. `neg: true` = reverse-keyed: DISAGREEING with the
// statement raises the type's score (guards against blanket agreement).
// Curated with extra care at the 8/1 gut boundary — those two are the
// classic near-miss pair and every item here is chosen to separate them.
const ITEMS = [
  // Type 1 — The Reformer (correctness, order, self-judgment)
  { id: 1, type: 1, text: "When a task is finished, I can already see exactly how it could have been done better." },
  { id: 2, type: 1, text: "I have a clear inner sense of right and wrong, and I trust it." },
  { id: 3, type: 1, text: "I find it hard to relax while something around me is out of order." },
  { id: 4, type: 1, text: "People sometimes call me critical even when I'm only trying to help." },
  { id: 5, type: 1, neg: true, text: "When a job is 'good enough', I'm usually satisfied — life is too short to chase perfect." },
  // Type 2 — The Helper (attention to others' needs, being needed)
  { id: 6, type: 2, text: "I notice what people need before they ask for it." },
  { id: 7, type: 2, text: "Being needed by someone matters a great deal to me." },
  { id: 8, type: 2, text: "I often put other people's needs ahead of my own." },
  { id: 9, type: 2, text: "It is easy for me to give help, and hard for me to accept it." },
  { id: 10, type: 2, neg: true, text: "I don't lose sleep over whether someone appreciated what I did for them." },
  // Type 3 — The Achiever (image, accomplishment, being valued for results)
  { id: 11, type: 3, text: "I adapt naturally to whatever a situation requires of me." },
  { id: 12, type: 3, text: "Accomplishing things is how I know I matter." },
  { id: 13, type: 3, text: "I am good at presenting myself; people seldom see me struggling." },
  { id: 14, type: 3, text: "I measure my days by what got done." },
  { id: 15, type: 3, text: "Comparing myself with others pushes me, whether I like it or not." },
  // Type 4 — The Individualist (depth, being different, emotional truth)
  { id: 16, type: 4, text: "I have always felt a little different from the people around me." },
  { id: 17, type: 4, text: "My emotions run deep, and they feel like an essential part of who I am." },
  { id: 18, type: 4, text: "I am drawn to beauty and meaning in ways my friends are not." },
  { id: 19, type: 4, text: "I sometimes worry that something essential is missing in me." },
  { id: 20, type: 4, neg: true, text: "I rarely dwell on how I feel — I just get on with things." },
  // Type 5 — The Investigator (understanding, autonomy, conserving energy)
  { id: 21, type: 5, text: "I need to understand something fully before I feel comfortable acting on it." },
  { id: 22, type: 5, text: "I am happiest with a good book, a quiet corner, and no interruptions." },
  { id: 23, type: 5, text: "I guard my time and energy carefully." },
  { id: 24, type: 5, text: "Big social gatherings drain me, even when I enjoy them." },
  { id: 25, type: 5, text: "I would rather figure something out myself than ask someone for help." },
  // Type 6 — The Loyalist (security, vigilance, steadiness)
  { id: 26, type: 6, text: "I like to know the plan, the risks, and the exit before I commit." },
  { id: 27, type: 6, text: "I test people's loyalty before I trust them fully." },
  { id: 28, type: 6, text: "My mind runs ahead to what could go wrong — it's a habit." },
  { id: 29, type: 6, text: "Once I take someone's side, I am in it for the long haul." },
  { id: 30, type: 6, neg: true, text: "I trust easily and don't spend much energy watching for hidden motives." },
  // Type 7 — The Enthusiast (variety, possibility, dodging pain)
  { id: 31, type: 7, text: "I would rather say yes to an adventure than guard what I already have." },
  { id: 32, type: 7, text: "The moment a plan gets boring, I start looking at the next exciting one." },
  { id: 33, type: 7, text: "I prefer to move forward rather than dwell on painful things." },
  { id: 34, type: 7, text: "I keep several irons in the fire, just in case." },
  { id: 35, type: 7, text: "The thought of being stuck or limited genuinely frightens me." },
  // Type 8 — The Challenger (control, boundaries, justice, raw strength)
  { id: 36, type: 8, text: "I am direct — people always know where they stand with me." },
  { id: 37, type: 8, text: "I step up naturally when someone needs protection or justice." },
  { id: 38, type: 8, text: "I would rather ask forgiveness than permission." },
  { id: 39, type: 8, text: "When someone crosses a boundary of mine, they hear about it — fast." },
  { id: 40, type: 8, neg: true, text: "I often soften what I really think just to keep the peace." },
  // Type 9 — The Peacemaker (harmony, merging, ease)
  { id: 41, type: 9, text: "I keep the peace in a room without even trying." },
  { id: 42, type: 9, text: "I can see everyone's side of a disagreement, which makes choosing hard." },
  { id: 43, type: 9, text: "I settle into comfortable routines and do not like them disrupted." },
  { id: 44, type: 9, text: "Conflict exhausts me; I would rather smooth things over than confront." },
  { id: 45, type: 9, neg: true, text: "I'll push back hard and stay loud until the conflict is settled my way." },
];

const LIKERT = [
  { value: 1, label: "Not me at all" },
  { value: 2, label: "Barely me" },
  { value: 3, label: "Maybe me" },
  { value: 4, label: "Mostly me" },
  { value: 5, label: "That's me exactly" },
];

function typeFor(n) {
  return TYPES.find(function (t) { return t.n === n; });
}

function triadFor(n) {
  return TRIADS[typeFor(n).triad];
}

function wingFor(primary, scores) {
  const prev = primary === 1 ? 9 : primary - 1;
  const next = primary === 9 ? 1 : primary + 1;
  return scores[prev - 1] >= scores[next - 1] ? prev : next;
}

// A "close call" is declared when the runner-up is within 3 points of the
// winner (scale: 5–25 per type). The test then refuses to fake certainty.
const CLOSE_GAP = 3;

/**
 * Score 45 answers (array of ints 1..5) into a full result.
 * Reverse-keyed items (neg: true) contribute 6 - value.
 * Throws on invalid input: length, non-integer, out of range.
 */
function score(answers) {
  if (!Array.isArray(answers) || answers.length !== ITEMS.length) {
    throw new Error("score() expects 45 answers");
  }
  const scores = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < answers.length; i++) {
    const v = answers[i];
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      throw new Error("answer " + i + " out of range: " + v);
    }
    const c = ITEMS[i].neg ? 6 - v : v;
    scores[ITEMS[i].type - 1] += c;
  }

  const ranked = TYPES.map(function (t) { return { n: t.n, score: scores[t.n - 1] }; })
    .sort(function (a, b) { return b.score - a.score; });
  const primary = ranked[0].n;
  const primaryScore = ranked[0].score;
  const runnerUp = ranked[1].n;
  const runnerUpScore = ranked[1].score;
  const tie = primaryScore === runnerUpScore;
  const close = tie || (primaryScore - runnerUpScore <= CLOSE_GAP);
  const closeCall = ranked.filter(function (r) { return primaryScore - r.score <= CLOSE_GAP; })
    .map(function (r) { return r.n; });
  const wing = wingFor(primary, scores);
  const arrows = ARROWS[primary];
  const breakdown = TYPES.map(function (t) {
    return { n: t.n, name: t.name, score: scores[t.n - 1] };
  });

  return {
    scores: scores,
    primary: primary,
    primaryScore: primaryScore,
    runnerUp: runnerUp,
    runnerUpScore: runnerUpScore,
    tie: tie,
    close: close,
    closeCall: closeCall,
    wing: wing,
    triad: typeFor(primary).triad,
    stress: arrows.stress,
    security: arrows.security,
    ranked: ranked,
    breakdown: breakdown,
  };
}

/** Plain-text share card — the anti-paywall gift. No images, paste anywhere. */
function buildShareText(r) {
  const t = typeFor(r.primary);
  const wingT = typeFor(r.wing);
  const triad = TRIADS[r.triad];
  const stressT = typeFor(r.stress);
  const secT = typeFor(r.security);
  const tieLine = r.tie
    ? "  (tied with " + typeFor(r.runnerUp).name + " — read both and see which fits)"
    : "";
  const closeLine = (r.tie || r.close)
    ? "  The top of my chart was close: " + r.closeCall.map(function (n) {
        return n + " (" + r.scores[n - 1] + ")";
      }).join(", ") + " — a test is a starting point, the number you choose is yours."
    : "";
  return [
    "Your Number is " + r.primary + " — " + t.name,
    "",
    "Your wing: " + r.wing + " " + wingT.name,
    "Your triad: " + triad.label + " (" + triad.types.join("-") + ")",
    "Under stress you lean toward " + r.stress + " " + stressT.name,
    "In growth you lean toward " + r.security + " " + secT.name,
    tieLine,
    closeLine,
    "",
    "What it means: " + t.blurb,
    "",
    "— taken free at Your Number. No account. No paywall. Ever.",
  ].filter(function (line) { return line !== ""; }).join("\n");
}

if (typeof module !== "undefined") {
  module.exports = {
    TYPES: TYPES,
    TRIADS: TRIADS,
    ARROWS: ARROWS,
    ITEMS: ITEMS,
    LIKERT: LIKERT,
    typeFor: typeFor,
    triadFor: triadFor,
    wingFor: wingFor,
    score: score,
    buildShareText: buildShareText,
  };
}