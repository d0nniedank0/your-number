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
    growth:
      "Your growth edge is letting imperfection count as enough. Rest, play, and mercy for yourself and others are part of the good work — not threats to it.",
    communication:
      "You speak in standards and corrections. Others hear judgment; you mean care. Say what you appreciate before you say what needs fixing, and the same words land twice as well.",
  },
  {
    n: 2,
    name: "The Helper",
    triad: "heart",
    fear: "being unloved or unwanted",
    desire: "to feel loved and needed",
    blurb:
      "You sense what people need before they can say it, and you move toward them without being asked. Your gift is generosity — you warm the rooms you enter. Life softens when you remember your own needs are allowed to take the same warmth you give away.",
    growth:
      "Your growth edge is receiving: letting yourself be loved and helped without earning it, and naming your own needs out loud.",
    communication:
      "You give so much that your needs go quiet. Tell people what you want — they can't guess it forever, and most of them would love to meet you there.",
  },
  {
    n: 3,
    name: "The Achiever",
    triad: "heart",
    fear: "being worthless or a nobody",
    desire: "to feel valuable and seen",
    blurb:
      "You shape yourself to the task at hand and get things done — often beautifully. Your gift is excellence and the ability to inspire it. Life softens when you remember you are worth more than what you produce.",
    growth:
      "Your growth edge is being someone off the clock — valuable without output, loved without a win on the board.",
    communication:
      "You present your best self, and it reads as effortless, which makes you hard to reach. Share a struggle now and then; it makes you real, not weak.",
  },
  {
    n: 4,
    name: "The Individualist",
    triad: "heart",
    fear: "being ordinary, flawed, or unseen",
    desire: "to be uniquely and authentically yourself",
    blurb:
      "You feel in deep colors, and meaning matters to you more than ease. Your gift is depth and beauty — you show others that life has a texture worth attending to. Life softens when you remember that being human is not a lesser version of being special.",
    growth:
      "Your growth edge is finding the ordinary beautiful. The everyday you isn't a lesser you — it's the point.",
    communication:
      "You feel deeply and assume others don't. Say what you feel plainly; people can meet you there once you let them in.",
  },
  {
    n: 5,
    name: "The Investigator",
    triad: "head",
    fear: "being incompetent or overwhelmed",
    desire: "to be capable, knowing, and self-sufficient",
    blurb:
      "You need to understand before you act, and you protect your attention like a fire. Your gift is depth of knowledge and clear sight. Life softens when you remember that understanding is a doorway, not a house.",
    growth:
      "Your growth edge is stepping into the current: acting on partial knowledge, letting people matter before you fully understand them.",
    communication:
      "You go quiet when overwhelmed and study before responding. Say 'I need to think' instead of disappearing — it costs you nothing and keeps people close.",
  },
  {
    n: 6,
    name: "The Loyalist",
    triad: "head",
    fear: "being without support or guidance",
    desire: "to be safe and secure",
    blurb:
      "You see what could go wrong so the people you love rarely have to. Your gift is loyalty and vigilance — you are the one who stays. Life softens when you remember that doubt is a lantern, not a leash.",
    growth:
      "Your growth edge is trusting safety you can't verify. Courage is acting before you're sure.",
    communication:
      "You test and plan and warn; others hear doubt. Say what you're afraid of, plainly — that's the loyalty people can actually hold.",
  },
  {
    n: 7,
    name: "The Enthusiast",
    triad: "head",
    fear: "being trapped in pain or deprivation",
    desire: "to be satisfied, free, and full of joy",
    blurb:
      "You say yes to life and keep several doors open at once. Your gift is joy and possibility — you are living proof that the world is wide. Life softens when you remember that staying in one place long enough to feel it is also a kind of freedom.",
    growth:
      "Your growth edge is staying in one thing long enough to feel it. Joy deepens when it stops running from pain.",
    communication:
      "You brighten every room and deflect every heavy moment with a better idea. Let a moment be heavy sometimes; staying in it with someone is a gift too.",
  },
  {
    n: 8,
    name: "The Challenger",
    triad: "gut",
    fear: "being controlled, harmed, or betrayed",
    desire: "to protect yourself and those you love",
    blurb:
      "You are honest to the bone, and you step toward trouble when others step back. Your gift is strength and protection — you are the roof in a storm. Life softens when you remember that letting yourself be seen is not a surrender.",
    growth:
      "Your growth edge is softness: asking, trusting, letting someone see you unarmored. Strength that doesn't need proving is the strongest kind.",
    communication:
      "You're direct, and people either respect it or flinch. Add warmth to the truth — you can say the hard thing and still be safe to land next to.",
  },
  {
    n: 9,
    name: "The Peacemaker",
    triad: "gut",
    fear: "loss, separation, and disconnection",
    desire: "to have inner peace and harmony",
    blurb:
      "You hold the space where others can disagree and still be friends. Your gift is calm and inclusion — you make room for everyone. Life softens when you remember that your own voice is part of the harmony, and peace without you in it is not peace.",
    growth:
      "Your growth edge is taking a side — your own — and moving even when it disturbs the peace.",
    communication:
      "You merge so well that people can't find you. Practice 'I want' and 'I don't like that.' Your voice is part of the harmony, not a threat to it.",
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
  // ---- Extended pass (ids 46–72): three more items per type ----
  // Target: sharp separation at the classic near-miss boundaries (1/8, 4/5)
  // plus more reverse-keying, so the deep dive actually discriminates.
  // Type 1 — self-judgment vs. outer judgment is what separates 1 from 8.
  { id: 46, type: 1, text: "I keep a running mental list of things that need fixing, even on a good day." },
  { id: 47, type: 1, neg: true, text: "I'm comfortable bending a rule when the situation calls for it." },
  { id: 48, type: 1, text: "I criticize myself more sharply than anyone else ever could." },
  // Type 2
  { id: 49, type: 2, text: "I can tell when a friend is quietly struggling before anyone else notices." },
  { id: 50, type: 2, text: "Saying no to someone who needs me leaves me feeling guilty." },
  { id: 51, type: 2, neg: true, text: "If no one thanked me for something, I'd barely notice." },
  // Type 3
  { id: 52, type: 3, text: "I genuinely enjoy the version of me that performs well." },
  { id: 53, type: 3, text: "I would rather be seen succeeding at something hard than relax in private." },
  { id: 54, type: 3, neg: true, text: "I'm fine being average at most things." },
  // Type 4 — the 4/5 boundary: feeling deeply vs. thinking clearly.
  { id: 55, type: 4, text: "Certain songs, places, or memories carry a weight that's hard to explain to others." },
  { id: 56, type: 4, text: "I compare my inner life with other people's outer lives and come up short." },
  { id: 57, type: 4, neg: true, text: "Happiness feels simpler for me than it seems to feel for other people." },
  // Type 5
  { id: 58, type: 5, text: "I feel most like myself when I'm thinking clearly about something I care about." },
  { id: 59, type: 5, text: "Emotional demands from others make me want to retreat and recharge." },
  { id: 60, type: 5, neg: true, text: "I'm quick to share half-formed opinions in a conversation." },
  // Type 6
  { id: 61, type: 6, text: "I rehearse difficult conversations in my head before they happen." },
  { id: 62, type: 6, text: "A plan changing at the last minute genuinely unsettles me." },
  { id: 63, type: 6, neg: true, text: "I assume people will do what they said they'd do, full stop." },
  // Type 7
  { id: 64, type: 7, text: "Boring routines feel like a slow kind of dying to me." },
  { id: 65, type: 7, text: "I have three ideas for tonight, and I'll probably try all of them." },
  { id: 66, type: 7, neg: true, text: "I'm comfortable sitting with sadness instead of distracting myself." },
  // Type 8 — the 1/8 boundary: 8 owns the room and the rules, 1 owns the rules and the self.
  { id: 67, type: 8, text: "Controlling my own direction matters more to me than being comfortable." },
  { id: 68, type: 8, text: "When I'm tired, I get blunter — my filters vanish." },
  { id: 69, type: 8, neg: true, text: "I would rather be liked than win an argument." },
  // Type 9
  { id: 70, type: 9, text: "I avoid taking sides because the moment I do, someone gets hurt." },
  { id: 71, type: 9, text: "I say 'I don't mind' so often that I forget what I actually mind." },
  { id: 72, type: 9, neg: true, text: "I'll make my opinion known and fight for it before the silence gets awkward." },
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

// Close-call thresholds, recalibrated per scale: short form scores reach 25
// per type, the extended pass reaches 40, so the gap widens with the scale.
function closeGapFor(length) {
  return length >= 72 ? 4 : 3;
}

/**
 * Score answers into a full result. Two valid lengths:
 * - 45 (short pass): scores out of 25 per type
 * - 72 (extended pass): scores out of 40 per type, result flagged `extended`
 * Reverse-keyed items (neg: true) contribute 6 - value.
 * Throws on invalid input: length, non-integer, out of range.
 */
function score(answers) {
  if (!Array.isArray(answers) || (answers.length !== 45 && answers.length !== 72)) {
    throw new Error("score() expects 45 or 72 answers");
  }
  const extended = answers.length === 72;
  const maxScore = extended ? 40 : 25;
  const gap = closeGapFor(answers.length);
  const scores = [0, 0, 0, 0, 0, 0, 0, 0, 0];
  for (let i = 0; i < answers.length; i++) {
    const v = answers[i];
    if (!Number.isInteger(v) || v < 1 || v > 5) {
      throw new Error("answer " + i + " invalid: " + v);
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
  const close = tie || (primaryScore - runnerUpScore <= gap);
  const closeCall = ranked.filter(function (r) { return primaryScore - r.score <= gap; })
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
    extended: extended,
    maxScore: maxScore,
  };
}

/**
 * Presentation order for the extended pass (ids 46–72), adaptive: when the
 * short pass landed a close call, the deep-dive items for those contender
 * types come first so the sharpest questions are asked while they're fresh.
 * Deterministic — same input, same order.
 */
function extendedOrder(closeCall) {
  const wanted = {};
  (closeCall || []).forEach(function (n) { wanted[n] = true; });
  const inSet = [];
  const outSet = [];
  for (let id = 46; id <= ITEMS.length; id++) {
    const t = ITEMS[id - 1].type;
    (wanted[t] ? inSet : outSet).push(id);
  }
  return inSet.concat(outSet);
}

/**
 * Re-interpret a score array for a user-chosen primary type. Used when a
 * close call hands the decision back to the taker ("only you choose your
 * number") — re-derives wing, triad, arrows, and breakdown around their pick.
 */
function selectType(scores, chosen, maxScore, extended) {
  if (!Number.isInteger(chosen) || chosen < 1 || chosen > 9 || !typeFor(chosen)) {
    throw new Error("unknown type: " + chosen);
  }
  const metaMax = (maxScore === 40 || maxScore === 25) ? maxScore : 25;
  const metaExt = !!extended;
  const gap = closeGapFor(scores.length);
  const ranked = TYPES.map(function (t) { return { n: t.n, score: scores[t.n - 1] }; })
    .sort(function (a, b) { return b.score - a.score; });
  const others = ranked.filter(function (x) { return x.n !== chosen; });
  const primaryScore = scores[chosen - 1];
  const runnerUp = others[0] ? others[0].n : chosen;
  const runnerUpScore = others[0] ? others[0].score : primaryScore;
  const tie = primaryScore === runnerUpScore;
  const close = tie || (primaryScore - runnerUpScore <= gap);
  const closeCall = ranked.filter(function (r) { return primaryScore - r.score <= gap; })
    .map(function (r) { return r.n; });
  const arrows = ARROWS[chosen];
  const breakdown = TYPES.map(function (t) {
    return { n: t.n, name: t.name, score: scores[t.n - 1] };
  });
  return {
    scores: scores,
    primary: chosen,
    primaryScore: primaryScore,
    runnerUp: runnerUp,
    runnerUpScore: runnerUpScore,
    tie: tie,
    close: close,
    closeCall: closeCall,
    wing: wingFor(chosen, scores),
    triad: typeFor(chosen).triad,
    stress: arrows.stress,
    security: arrows.security,
    ranked: ranked,
    breakdown: breakdown,
    chosen: true,
    maxScore: metaMax,
    extended: metaExt,
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
  const growthLine = r.extended ? "Growth: " + t.growth : "";
  const commLine = r.extended ? "Communication: " + t.communication : "";
  const closeLine = r.chosen
    ? "  I chose my number — the raw scores were close, and the choice is mine."
    : (r.tie || r.close)
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
    growthLine,
    commLine,
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
    selectType: selectType,
    extendedOrder: extendedOrder,
    buildShareText: buildShareText,
  };
}