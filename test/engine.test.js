/* Engine tests — pure Node, no DOM. Fixture numbers verified against live runs. */
"use strict";

const assert = require("assert");
const {
  TYPES, TRIADS, ARROWS, ITEMS, LIKERT,
  typeFor, triadFor, wingFor, score, selectType, extendedOrder, buildShareText,
} = require("../js/engine.js");

let passed = 0;
function ok(cond, name) {
  if (cond) { passed++; console.log("  ok  " + name); }
  else { console.error("FAIL " + name); process.exitCode = 1; }
}

/* ---------- data sanity ---------- */

ok(TYPES.length === 9, "nine type profiles");
ok(ITEMS.length === 72, "72 items (short 45 + extended 27)");
ok(LIKERT.length === 5, "five Likert steps");
ok(TYPES.every((t) => t.n >= 1 && t.n <= 9 && t.name && t.fear && t.desire && t.blurb
   && t.growth && t.communication && TRIADS[t.triad]),
  "every type has name/fear/desire/blurb/growth/communication/triad");
{
  const counts = {};
  ITEMS.forEach((it) => { counts[it.type] = (counts[it.type] || 0) + 1; });
  ok(Object.keys(counts).length === 9 && Object.values(counts).every((c) => c === 8),
    "exactly 8 items per type");
  const texts = new Set(ITEMS.map((it) => it.text));
  ok(texts.size === 72, "all item texts unique");
  const ids = new Set(ITEMS.map((it) => it.id));
  ok(ids.size === 72 && Math.min(...ids) === 1 && Math.max(...ids) === 72, "ids are 1..72");
  const negs = ITEMS.filter((it) => it.neg);
  ok(negs.length === 15, "15 reverse-keyed items total");
  const extNeghasBoundary = negs.some((it) => it.id === 69 || it.id === 47 || it.id === 57);
  ok(extNeghasBoundary, "reverse-keying covers the 1/8 and 4/5 boundaries");
}
ok(typeFor(4).name === "The Individualist", "typeFor resolves name");
ok(triadFor(4).label.indexOf("Heart") !== -1 && triadFor(8).label.indexOf("Gut") !== -1
   && triadFor(6).label.indexOf("Head") !== -1, "triad mapping");

/* ---------- arrows ---------- */
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
const short = (fn) => Array.from({ length: 45 }, (_, i) => fn(i));
// per-type short value map: item is type `group+1` while (group = floor(i/5))
const pType = (n) => Math.floor(n / 5) + 1;

/* ---------- short pass (45): scoring, honesty ---------- */

{
  const r = score(short(() => 3));
  ok(r.tie === true && r.close === true, "short all-3s reports tie + close");
  ok(r.primary === 1 && r.closeCall.length === 9 && r.scores[0] === 15, "short all-3s: everyone at 15");
  ok(r.extended === false && r.maxScore === 25, "short result is not extended, max 25");
}

// 5 on every type-8 item, 3 elsewhere → 8 wins by 6 (verified: 8=21, gap 6).
{
  const r = score(short((i) => (pType(i) === 8 ? 5 : 3)));
  ok(r.primary === 8 && r.tie === false && r.close === false, "short 8-max: decisive win by 6");
  ok(r.primaryScore === 21 && r.runnerUpScore === 15, "short 8-max: scores 8=21, rest 15");
  ok(r.runnerUp === 1, "short 8-max: runner-up is type 1");
  ok(r.wing === 7 && r.triad === "gut" && r.stress === 5 && r.security === 2, "short 8-max: wing/triad/arrows for 8");
  ok(r.closeCall.length === 1, "short 8-max: no close call at 6 points");
}

// 5 on every type-1 item → 1 wins by 6; wing prefers equal neighbor 9 (prev-first).
{
  const r = score(short((i) => (pType(i) === 1 ? 5 : 3)));
  ok(r.primary === 1 && r.primaryScore === 21 && r.close === false, "short 1-max: decisive win");
  ok(r.wing === 9, "short 1-max: wing is the equal neighbor 9 (prev-first)");
}

// Reverse keying: disagreeing with a neg item raises its type.
{
  const all3 = short(() => 3);
  const nudged = all3.slice();
  nudged[4] = 1; // item id 5 (neg, type 1): value 1 → contributes 5
  const r = score(nudged);
  ok(r.scores[0] === 17, "reverse-key: type 1 rises to 17 when its neg item is a 1");
  ok(r.primary === 1 && r.close === true, "reverse-key lead is still honestly flagged close");
}

/* ---------- extended pass (72): scoring on the 40-scale ---------- */

{
  const r = score(scenario(() => 3));
  ok(r.extended === true && r.maxScore === 40, "extended all-3s: extended result, max 40");
  ok(r.tie === true && r.scores[0] === 24 && r.closeCall.length === 9, "extended all-3s: everyone at 24");
}

// All 5s: types without a base-set neg item (3, 5, 7) reach 36; the six types
// with one base-set neg land at 32 — an honest 4-point spread → close call.
{
  const r = score(scenario(() => 5));
  ok(r.primary === 3 && r.tie === true && r.close === true, "extended all-5s: 3 leads among the 36s");
  ok(r.scores[2] === 36 && r.scores[4] === 36 && r.scores[6] === 36, "extended all-5s: types 3/5/7 at 36");
  ok([1, 2, 4, 6, 8, 9].every((n) => r.scores[n - 1] === 32), "extended all-5s: neg-bearing types at 32");
  ok(r.closeCall.length === 9, "extended all-5s: 4-point spread still lists everyone (gap 4 on the 40-scale)");
}

// Extended 8-max: 8 on 8's items, 3 elsewhere → 8=32, gap 8, decisive on the 40-scale.
{
  const r = score(scenario((it) => (it.type === 8 ? 5 : 3)));
  ok(r.primary === 8 && r.close === false && r.primaryScore === 32, "extended 8-max: decisive win, 8=32");
  ok(r.wing === 7 && r.stress === 5 && r.security === 2, "extended 8-max: wing/arrows for 8");
}

/* ---------- validation ---------- */

ok((() => { try { score([]); } catch (e) { return true; } return false; })(), "wrong length throws");
ok((() => { try { score(new Array(46).fill(3)); } catch (e) { return true; } return false; })(), "46 answers throws");
ok((() => { try { score(scenario(() => 1.5)); } catch (e) { return true; } return false; })(), "non-integer throws");
ok((() => { try { score(scenario(() => 0)); } catch (e) { return true; } return false; })(), "below-range throws");
ok((() => { try { score(scenario(() => 6)); } catch (e) { return true; } return false; })(), "above-range throws");
ok((() => { try { score(short(() => null)); } catch (e) { return true; } return false; })(), "null answer throws");

/* ---------- selectType (user-chosen number) ---------- */

{
  const r = score(scenario(() => 3)); // extended full tie at 24
  const chosen = selectType(r.scores, 8, 40, true);
  ok(chosen.primary === 8 && chosen.chosen === true, "selectType adopts the chosen type");
  ok(chosen.extended === true && chosen.maxScore === 40, "selectType carries extended meta forward");
  ok(chosen.wing === 7 && chosen.triad === "gut" && chosen.stress === 5 && chosen.security === 2,
    "selectType recomputes wing/triad/arrows for the choice");
  ok((() => { try { selectType(r.scores, 11); } catch (e) { return true; } return false; })(), "selectType rejects unknown");
  ok((() => { try { selectType(r.scores, 0); } catch (e) { return true; } return false; })(), "selectType rejects zero");
}

/* ---------- extendedOrder (adaptive emphasis) ---------- */

{
  const plain = extendedOrder(null);
  ok(plain.length === 27 && plain[0] === 46 && plain[26] === 72, "plain extended order is 46..72");
  const adaptive = extendedOrder([1, 6, 8]);
  ok(adaptive.slice(0, 9).join(",") === "46,47,48,61,62,63,67,68,69",
    "adaptive order leads with the close-call contenders (1, 6, 8)");
  ok(adaptive.length === 27, "adaptive order still covers all 27");
  ok(adaptive.filter((id) => id >= 49 && id <= 60 || id >= 64 && id <= 66 || id >= 70 && id <= 72).length
     && adaptive.indexOf(49) > adaptive.indexOf(48), "non-contenders come after contenders");
}

/* ---------- share text ---------- */

{
  // Short decisive: complete card, no growth lines, no false closeness.
  const r = score(short((i) => (pType(i) === 4 ? 5 : 1)));
  const txt = buildShareText(r);
  ok(txt.indexOf("Your Number is 4 — The Individualist") !== -1, "share text names the type");
  ok(txt.indexOf("Your wing: 3 The Achiever") !== -1, "share text has the wing");
  ok(txt.indexOf("The Heart — emotional (2-3-4)") !== -1, "share text has the triad");
  ok(txt.indexOf("Under stress you lean toward 2 The Helper") !== -1, "share text has stress line");
  ok(txt.indexOf("In growth you lean toward 1 The Reformer") !== -1, "share text has security line");
  ok(txt.indexOf("No account. No paywall. Ever.") !== -1, "share text carries the pledge");
  ok(txt.indexOf("Growth:") === -1, "short share text carries no growth line");
  ok(txt.indexOf("was close") === -1, "no close line when decisive");

  // Extended tie: growth lines appear, closeness disclosed.
  const tieR = score(scenario(() => 3));
  const tieTxt = buildShareText(tieR);
  ok(tieTxt.indexOf("A real tie") !== -1 || tieTxt.indexOf("tied with") !== -1, "tie share text is honest");
  ok(tieTxt.indexOf("Growth: Your growth edge") !== -1, "extended share text carries growth");
  ok(tieTxt.indexOf("Communication:") !== -1, "extended share text carries communication");

  // Extended decisive pick: chosen line, growth follows the choice.
  const ext8 = score(scenario((it) => (it.type === 8 ? 5 : 3)));
  const chosen = selectType(ext8.scores, 8, 40, true);
  const chosenTxt = buildShareText(chosen);
  ok(chosenTxt.indexOf("Your Number is 8 — The Challenger") !== -1, "chosen share text speaks the pick");
  ok(chosenTxt.indexOf("Growth: Your growth edge is softness") !== -1, "chosen share text carries type-8 growth");
}

console.log("\nengine: " + passed + " assertions passed");
if (process.exitCode) { console.log("engine: FAILURES PRESENT"); }