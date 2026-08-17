/* Engine tests — pure Node, no DOM. */
"use strict";

const assert = require("assert");
const {
  TYPES, TRIADS, ARROWS, ITEMS, LIKERT,
  typeFor, triadFor, wingFor, score, buildShareText,
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

/* ---------- scoring ---------- */

function scenario(answerForItem) {
  return ITEMS.map((it) => answerForItem(it));
}

// Everything 3s → perfect tie across all types.
{
  const r = score(scenario(() => 3));
  ok(r.tie === true, "all-3s reports a tie");
  ok(r.primary === 1 && r.runnerUp === 2, "tie resolves to the two smallest numbers");
}

// Answer pattern (type-1)%5+1: types 1..5 get 1..5, types 6..9 wrap to 1..4.
// Sums: t5=25, t4=20, t9=20, t3=15, t8=15, t2=10, t7=10, t1=5, t6=5 → type 5 wins.
{
  const r = score(scenario((it) => ((it.type - 1) % 5) + 1));
  ok(r.primary === 5 && r.tie === false, "wrapped answers give type 5 (25) the win");
  ok(r.primaryScore === 25 && r.runnerUpScore === 20, "scores accumulate by type");
  ok(r.runnerUp === 4, "runner-up is type 4 (stable lower-first ordering breaks the 4/9 tie)");
  ok(r.wing === 4, "type 5 wing is the stronger neighbor (4)");
  ok(r.triad === "head", "type 5 is a head type");
  ok(r.stress === 7 && r.security === 8, "type 5 arrow lines");
  ok(r.ranked[0].n === 5, "ranked list leads with 5");
}

// A single type maxed, everything else minimal → that type wins cleanly.
{
  const r = score(scenario((it) => (it.type === 4 ? 5 : 1)));
  ok(r.primary === 4 && r.primaryScore === 25, "type 4 wins cleanly when maxed");
  ok(r.wing === 3 || r.wing === 5, "wing is one of the two neighbors");
}

// Wing picks the higher-scored neighbor: for 4, boost 5 above 3.
{
  const ans = scenario((it) => (it.type === 4 ? 4 : it.type === 5 ? 2 : 1));
  const r = score(ans);
  ok(r.primary === 4, "primary still 4 when neighbors boosted mildly");
  ok(r.wing === 5, "wing prefers the stronger neighbor (5)"); // 3 gets 5, 5 gets 10
  const r2 = score(scenario((it) => (it.type === 4 ? 4 : it.type === 3 ? 2 : 1)));
  ok(r2.wing === 3, "wing flips when the other neighbor is stronger");
}

// Wing wrap-around: type 1's neighbors are 9 and 2.
{
  const r = score(scenario((it) => (it.type === 1 ? 4 : it.type === 9 ? 5 : 1)));
  ok(r.primary === 9, "boosting 9 makes it primary");
  const r2 = score(scenario((it) => (it.type === 1 ? 5 : it.type === 9 ? 1 : 1)));
  ok(r2.primary === 1, "primary 1 when maxed");
  ok([2, 9].indexOf(r2.wing) !== -1, "type 1 wing is 2 or 9");
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

/* ---------- share text ---------- */

{
  // Type 4 maxed (25), everything else minimal (5): wing 3 wins the 3-vs-5 tie via lower-first.
  const r = score(scenario((it) => (it.type === 4 ? 5 : 1)));
  const txt = buildShareText(r);
  ok(txt.indexOf("Your Number is 4 — The Individualist") !== -1, "share text names the type");
  ok(txt.indexOf("Your wing: 3 The Achiever") !== -1, "share text has the wing");
  ok(txt.indexOf("The Heart — emotional (2-3-4)") !== -1, "share text has the triad");
  ok(txt.indexOf("Under stress you lean toward 2 The Helper") !== -1, "share text has stress line");
  ok(txt.indexOf("In growth you lean toward 1 The Reformer") !== -1, "share text has security line");
  ok(txt.indexOf("No account. No paywall. Ever.") !== -1, "share text carries the pledge");

  const tieTxt = buildShareText(score(scenario(() => 3)));
  ok(tieTxt.indexOf("tied with") !== -1, "share text explains ties honestly");
}

console.log("\nengine: " + passed + " assertions passed");
if (process.exitCode) { console.log("engine: FAILURES PRESENT"); }