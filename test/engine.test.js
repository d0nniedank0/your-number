/* Engine tests — pure Node, no DOM. */
"use strict";

const assert = require("assert");
const {
  TYPES, TRIADS, ARROWS, ITEMS, LIKERT,
  typeFor, triadFor, wingFor, score, selectType, buildShareText,
} = require("../js/engine.js");

let passed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.error("FAIL " + name); process.exitCode = 1; }
}

/* ---------- data sanity ---------- */

ok(TYPES.length === 9, "nine type profiles");
ok(ITEMS.length === 45, "45 items");
ok(LIKERT.length === 5, "five Likert steps");
ok(TYPES.every((t) => t.n >= 1 && t.n <= 9 && t.name && t.fear && t.desire && t.blurb && TRIADS[t.triad]),
  "every type has name/fear/desire/blurb/triad");
{
  const counts = {};
  ITEMS.forEach((it) => { counts[it.type] = (counts[it.type] || 0) + 1; });
  ok(Object.keys(counts).length === 9 && Object.values(counts).every((c) => c === 5),
    "exactly 5 items per type");
  const texts = new Set(ITEMS.map((it) => it.text));
  ok(texts.size === 45, "all item texts unique");
  const ids = new Set(ITEMS.map((it) => it.id));
  ok(ids.size === 45, "all item ids unique");
  const negs = ITEMS.filter((it) => it.neg);
  ok(negs.length === 6 && negs.every((it) => [1, 2, 4, 6, 8, 9].indexOf(it.type) !== -1),
    "six reverse-keyed items spread across types 1,2,4,6,8,9");
}
ok(typeFor(4).name === "The Individualist", "typeFor resolves name");
ok(triadFor(4).label.indexOf("Heart") !== -1 && triadFor(8).label.indexOf("Gut") !== -1
   && triadFor(6).label.indexOf("Head") !== -1, "triad mapping");

/* ---------- arrows (well-established enneagram lines) ---------- */
ok(ARROWS[1].stress === 4 && ARROWS[1].security === 7, "type 1 arrows");
ok(ARROWS[2].stress === 8 && ARROWS[2].security === 4, "type 2 arrows");
ok(ARROWS[3].stress === 9 && ARROWS[3].security === 6, "type 3 arrows");
ok(ARROWS[4].stress === 2 && ARROWS[4].security === 1, "type 4 arrows");
ok(ARROWS[5].stress === 7 && ARROWS[5].security === 8, "type 5 arrows");
ok(ARROWS[6].stress === 3 && ARROWS[6].security === 9, "type 6 arrows");
ok(ARROWS[7].stress === 1 && ARROWS[7].security === 5, "type 7 arrows");
ok(ARROWS[8].stress === 5 && ARROWS[8].security === 2, "type 8 arrows");
ok(ARROWS[9].stress === 6 && ARROWS[9].security === 3, "type 9 arrows (wraps)");

/* ---------- helpers ---------- */

function scenario(answerForItem) {
  return ITEMS.map((it) => answerForItem(it));
}
const sv = (vals) => { // build answers from per-type value array (9 values, index = type-1)
  return ITEMS.map((it) => vals[it.type - 1]);
};

/* ---------- scoring: ties and near-ties are reported honestly ---------- */

// All 3s → every type scores 15: a full tie, reported as such.
{
  const r = score(scenario(() => 3));
  ok(r.tie === true && r.close === true, "all-3s reports a tie and a close call");
  ok(r.closeCall.length === 9, "tie lists all nine contenders");
  ok(r.primary === 1 && r.runnerUp === 2, "tie resolves to the two smallest numbers (stable sort)");
}

// Uniform-per-type pattern: v = (type-1)%5+1 is the same for every item of a
// type, so type 5 collects 5×5=25 and wins clearly (gap 7) — verified against
// a live run: t5=25, t4=18, t9=18, t3=15, t8=15, t7=10, t2=12, t1=9, t6=9.
{
  const r = score(scenario((it) => ((it.type - 1) % 5) + 1));
  ok(r.primary === 5 && r.tie === false && r.close === false, "uniform-per-type pattern: type 5 wins by 7");
  ok(r.primaryScore === 25 && r.runnerUpScore === 18, "scores accumulate per type (with neg keying)");
  ok(r.runnerUp === 4, "runner-up is type 4 (stable lower-first among 18s)");
  ok(r.wing === 4, "type 5 wing is the stronger neighbor (4)");
  ok(r.closeCall.length === 1, "no close call when the gap is 7 points");
}

// Decisive: answering 5 on every type-8 item and 3 elsewhere → 8 wins by 6.
{
  const r = score(scenario((it) => (it.type === 8 ? 5 : 3)));
  ok(r.primary === 8 && r.tie === false && r.close === false, "8 wins decisively by 6 points");
  ok(r.primaryScore === 21 && r.runnerUpScore === 15, "scores accumulate by type (with neg keying)");
  ok(r.runnerUp === 1, "runner-up is the first of the tied 15s (type 1)");
  ok(r.wing === 7, "8's wing prefers the stronger-or-equal neighbor (7, lower-first)");
  ok(r.triad === "gut", "type 8 is a gut type");
  ok(r.stress === 5 && r.security === 2, "type 8 arrow lines");
  ok(r.ranked[0].n === 8, "ranked list leads with 8");
}

/* ---------- reverse keying ---------- */

{
  const all3 = scenario(() => 3);
  const baseline = score(all3);
  ok(baseline.scores[0] === 15, "baseline type 1 score is 15 on all-3s");
  const nudged = all3.slice();
  nudged[4] = 1; // item id 5 is neg-keyed for type 1: strongly disagreeing adds 5
  const r = score(nudged);
  ok(r.scores[0] === 17, "disagreeing with a reverse-keyed type-1 item raises type 1 to 17");
  ok(r.primary === 1 && r.close === true, "now 1 leads but honestly flagged as a close call");
  ok(r.closeCall.length === 9, "a 2-point lead over a full tie keeps everyone in the discussion");
}

/* ---------- wing logic ---------- */

// Single type maxed, everything else minimal → that type wins cleanly.
// (Type 4's reverse-keyed item caps its max at 21, not 25 — by design.)
{
  const r = score(scenario((it) => (it.type === 4 ? 5 : 1)));
  ok(r.primary === 4 && r.primaryScore === 21, "type 4 wins cleanly when maxed");
  ok(r.wing === 3, "tied neighbors resolve to the lower one (prev first)");
}

// Wing prefers the stronger-scoring neighbor.
{
  const r = score(scenario((it) => (it.type === 4 ? 4 : it.type === 5 ? 2 : 1)));
  ok(r.primary === 4, "primary still 4 when a neighbor is boosted mildly");
  ok(r.wing === 5, "wing prefers the stronger neighbor (5)");
  const r2 = score(scenario((it) => (it.type === 4 ? 4 : it.type === 3 ? 2 : 1)));
  ok(r2.wing === 3, "wing flips when the other neighbor is stronger");
}

// Wing wrap-around: type 1's neighbors are 9 and 2.
{
  const r = score(scenario((it) => (it.type === 1 ? 5 : 3)));
  ok(r.primary === 1 && r.primaryScore === 21, "type 1 maxed wins");
  ok(r.wing === 9, "type 1 wing prefers the equal neighbor 9 (prev first)");
  const r9 = score(scenario((it) => (it.type === 9 ? 5 : 3)));
  ok(r9.primary === 9, "type 9 maxed wins when boosted");
}

/* ---------- validation ---------- */

ok((() => { try { score([]); } catch (e) { return true; } return false; })(),
  "wrong length throws");
ok((() => { try { score(scenario(() => 1.5)); } catch (e) { return true; } return false; })(),
  "non-integer answer throws");
ok((() => { try { score(scenario(() => 0)); } catch (e) { return true; } return false; })(),
  "below-range answer throws");
ok((() => { try { score(scenario(() => 6)); } catch (e) { return true; } return false; })(),
  "above-range answer throws");

/* ---------- selectType (user-chosen number) ---------- */

{
  const r = score(scenario(() => 3)); // a full tie at 15 everywhere
  const chosen = selectType(r.scores, 8);
  ok(chosen.primary === 8 && chosen.chosen === true, "selectType adopts the chosen type");
  ok(chosen.wing === 7, "wing recomputed for the chosen type (7, prev-first on tie)");
  ok(chosen.triad === "gut" && chosen.stress === 5 && chosen.security === 2, "triad and arrows follow the choice");
  ok(chosen.close === true, "still honestly a close call after choosing");
  const txt = buildShareText(chosen);
  ok(txt.indexOf("Your Number is 8 — The Challenger") !== -1, "share text speaks the chosen type");
  ok(txt.indexOf("I chose my number") !== -1, "share text owns the choice");
  ok((() => { try { selectType(r.scores, 11); } catch (e) { return true; } return false; })(),
    "selectType rejects unknown types");
  ok((() => { try { selectType(r.scores, 0); } catch (e) { return true; } return false; })(),
    "selectType rejects zero");
}

/* ---------- share text ---------- */

{
  // Type 4 maxed (25, decisive): complete, confident share card.
  const r = score(scenario((it) => (it.type === 4 ? 5 : 1)));
  const txt = buildShareText(r);
  ok(txt.indexOf("Your Number is 4 — The Individualist") !== -1, "share text names the type");
  ok(txt.indexOf("Your wing: 3 The Achiever") !== -1, "share text has the wing");
  ok(txt.indexOf("The Heart — emotional (2-3-4)") !== -1, "share text has the triad");
  ok(txt.indexOf("Under stress you lean toward 2 The Helper") !== -1, "share text has stress line");
  ok(txt.indexOf("In growth you lean toward 1 The Reformer") !== -1, "share text has security line");
  ok(txt.indexOf("No account. No paywall. Ever.") !== -1, "share text carries the pledge");
  ok(txt.indexOf("was close") === -1, "no close-call line when the result is decisive");

  // All-3s tie: the share text says so — no fake certainty.
  const tieTxt = buildShareText(score(scenario(() => 3)));
  ok(tieTxt.indexOf("tied with") !== -1, "share text explains exact ties");
  ok(tieTxt.indexOf("The top of my chart was close") !== -1, "share text discloses the margin");
  ok(tieTxt.indexOf("the number you choose is yours") !== -1, "share text hands the decision back");

  // Close-but-not-tied: margin disclosed without overclaiming.
  const closeR = score(scenario((it) => (it.type === 8 ? 5 : 3)));
  const closeTxt = buildShareText(closeR);
  ok(closeTxt.indexOf("was close") === -1, "decisive 8-case carries no close line");
}

console.log("\nengine: " + passed + " assertions passed");
if (process.exitCode) { console.log("engine: FAILURES PRESENT"); }