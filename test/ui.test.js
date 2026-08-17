/* UI tests — jsdom, full-page flow, zero console errors. */
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { JSDOM } = require("jsdom");

const ROOT = path.join(__dirname, "..");
const HTML = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");

/* Attribute-tolerant inline loader: script tags carry defer/attrs. */
function inlineScripts(html) {
  return html.replace(/<script src="([^"]+)"[^>]*><\/script>/g, function (_, src) {
    const code = fs.readFileSync(path.join(ROOT, src), "utf8");
    return "<script>" + code.replace(/<\/script>/g, "<\\/script>") + "</scr" + "ipt>";
  });
}

function matchMediaShim() {
  return {
    matches: false,
    addListener: function () {},
    removeListener: function () {},
    addEventListener: function () {},
    removeEventListener: function () {},
    dispatchEvent: function () { return false; },
  };
}

function buildWindow(seedAnswers) {
  const errors = [];
  const dom = new JSDOM(inlineScripts(HTML), {
    runScripts: "dangerously",
    url: "http://localhost/",
    pretendToBeVisual: true,
    beforeParse(window) {
      window.matchMedia = window.matchMedia || matchMediaShim;
      window.scrollTo = function () {}; // jsdom logs "Not implemented" otherwise
      try { window.localStorage.clear(); } catch (e) { /* ignore */ }
      if (seedAnswers !== undefined) {
        window.localStorage.setItem("yn:v1:answers", JSON.stringify(seedAnswers));
      }
      window.addEventListener("error", function (ev) { errors.push(ev.message || String(ev)); });
    },
  });
  return { window: dom.window, document: dom.window.document, errors: errors };
}

let passed = 0;
function ok(cond, name, ctx) {
  if (cond) { passed++; console.log("  ok  " + name); }
  else {
    console.error("FAIL " + name + (ctx ? "\n     ctx: " + JSON.stringify(ctx).slice(0, 200) : ""));
    process.exitCode = 1;
  }
}

/* ---------- fresh start: intro → full flow → result ---------- */

{
  const { window, document: doc, errors } = buildWindow();
  const $ = (id) => doc.getElementById(id);

  ok(doc.querySelector("#view-intro").hidden === false, "intro visible on load");
  ok(doc.querySelector("#view-quiz").hidden === true, "quiz hidden on load");
  ok($("btn-start").textContent.indexOf("Begin") !== -1, "fresh start button says Begin");

  $("btn-start").click();
  ok(doc.querySelector("#view-quiz").hidden === false, "clicking Begin shows the quiz");
  ok($("quiz-progress-label").textContent === "Question 1 of 45", "progress label starts at 1 of 45");
  ok($("btn-next").disabled === true, "Next disabled until an answer is picked");
  ok($("quiz-options").children.length === 5, "five options rendered");
  ok($("quiz-text").textContent.length > 5, "question text rendered");

  // Answer all 45 with (item's own type number) → deterministic type 9 result.
  // Access engine data through the global lexical scope via a script element.
  // Simpler: re-derive the same mapping from the rendered question order.
  let idx = 0;
  for (; idx < 45; idx++) {
    const group = Math.floor(idx / 5);          // 0..8 (item's type minus 1)
    const want = (group === 7) ? 5 : 3;         // 5 on every type-8 item, 3 elsewhere → 8 wins
    const target = Array.prototype.find.call(
      $("quiz-options").children,
      (b) => Number(b.dataset.value) === want
    );
    ok(!!target, "option for value " + want + " exists at question " + (idx + 1));
    target.click();
    ok($("btn-next").disabled === false, "Next enabled after answer");
    ok($("quiz-answered-label").textContent.indexOf(String(idx + 1)) !== -1 || idx >= 44,
      "answered counter advances");
    $("btn-next").click();
    if (idx < 44) {
      ok(doc.querySelector("#view-quiz").hidden === false, "still on quiz before the last question");
    }
  }

  ok(doc.querySelector("#view-result").hidden === false, "result view appears after last question");
  // 5 on every type-8 item, 3 elsewhere → type 8 totals 21, wins by 6 (decisive).
  ok($("result-number").textContent === "8", "result number is 8 (8-max scenario)");
  ok($("result-name").textContent === "The Challenger", "result name is The Challenger");
  ok($("stat-wing").textContent.indexOf("7") !== -1, "wing shown from stronger neighbor");
  ok($("stat-triad").textContent.indexOf("Gut") !== -1, "triad shown");
  ok($("result-tie").hidden === true, "no tie note when decisive");
  ok($("result-close").hidden === true, "no close-call panel when the margin is 6 points");
  const scoreRows = doc.querySelectorAll(".score-row");
  ok(scoreRows.length === 9, "all nine score bars rendered");
  ok(doc.querySelectorAll(".score-row.top").length === 1, "exactly one top row highlighted");
  ok(scoreRows[7].querySelector(".score-label").textContent.indexOf("Challenger") !== -1, "type 8 row present");
  ok(scoreRows[7].querySelector(".score-val").textContent === "21", "type 8's score shown as 21");
  ok($("extended-block").hidden === false, "extended callout shown on every result");
  ok($("extended-title").textContent === "The extended pass", "callout title before the deep dive");
  ok($("btn-extended").hidden === false, "extended button visible pre-deep-dive");
  ok($("extended-copy").textContent.indexOf("confirm") !== -1, "decisive results frame the pass as confirmation");
  ok($("growth-block").hidden === true, "growth block hidden until the extended pass is taken");

  // Copy path: no clipboard in jsdom → honest manual-copy fallback message.
  $("btn-copy").click();
  ok($("copy-feedback").hidden === false, "copy feedback appears after copy attempt");
  ok($("copy-feedback").textContent.indexOf("manually") !== -1, "fallback message is honest about copying");

  // Retake: arm → confirm → back to intro, store cleared.
  const retakeBtn = $("btn-retake");
  retakeBtn.click();
  ok(retakeBtn.textContent === "Really start over?", "retake arms with a confirm label");
  retakeBtn.click();
  ok(doc.querySelector("#view-intro").hidden === false, "confirmed retake returns to intro");
  ok(doc.querySelector("#view-quiz").hidden === true, "quiz hidden after retake");

  ok(errors.length === 0, "zero console errors", errors);
  window.close();
}

/* ---------- close-call drive: all 3s → honest tie + close panel ---------- */

{
  const { window, document: doc, errors } = buildWindow();
  const $ = (id) => doc.getElementById(id);
  $("btn-start").click();
  for (let idx = 0; idx < 45; idx++) {
    const target = Array.prototype.find.call(
      $("quiz-options").children,
      (b) => Number(b.dataset.value) === 3
    );
    target.click();
    $("btn-next").click();
  }
  ok($("result-number").textContent === "1", "all-3s: lowest tied number shows (1)");
  ok($("result-tie").hidden === false, "tie note visible on a full tie");
  ok($("result-tie").textContent.indexOf("A real tie") !== -1, "tie note announces a real tie");
  ok($("result-tie").textContent.indexOf("9 · The Peacemaker") !== -1, "tie note names every tied type");
  ok($("result-close").hidden === false, "close-call panel visible on a near-tie");
  ok($("close-text").textContent.indexOf("within a few points") !== -1, "close panel intro sentence");
  ok($("extended-copy").textContent.indexOf("dig straight into") !== -1, "close-call results invite the deep dive");
  const listItems = doc.querySelectorAll("#close-list li");
  ok(listItems.length === 9, "close list has one row per contender");
  ok(listItems[0].textContent.indexOf("1 · The Reformer — fears") !== -1, "close list rows name type and fear");

  // The decision is real: pick your number and the whole result follows.
  const picks = doc.querySelectorAll("[data-pick]");
  ok(picks.length === 9, "nine choose-your-number buttons on a full tie");
  doc.querySelector('[data-pick="8"]').click();
  ok($("result-number").textContent === "8", "choosing 8 makes 8 the number");
  ok($("result-name").textContent === "The Challenger", "name follows the choice");
  ok($("result-kicker").textContent === "You chose", "kicker flips to 'You chose'");
  ok($("chosen-note").hidden === false, "chosen note visible after picking");
  ok($("chosen-note").textContent.indexOf("8") !== -1, "chosen note names the pick");
  ok($("stat-stress").textContent.indexOf("5") !== -1, "stress line follows the chosen type (8→5)");
  ok(doc.querySelectorAll(".score-row.top").length === 1, "top row follows the chosen type");
  ok(scoreRowsTop(8, doc), "chosen type's row is now the highlighted one");

  ok(errors.length === 0, "zero console errors in close-call drive", errors);
  window.close();
}

function scoreRowsTop(n, doc) {
  const top = doc.querySelector(".score-row.top");
  return !!top && top.querySelector(".score-label").textContent.indexOf(String(n)) !== -1;
}

/* ---------- all nine types modal + logo home ---------- */

{
  const { window, document: doc, errors } = buildWindow();
  const $ = (id) => doc.getElementById(id);
  const open = () => $("btn-all-types").click();

  ok($("types-modal").hidden === true, "modal hidden on load");
  ok($("btn-all-types").textContent.indexOf("All nine types") !== -1, "masthead nav has the all-types link");

  open();
  ok($("types-modal").hidden === false, "modal opens from the masthead");
  ok(doc.querySelectorAll(".type-card").length === 9, "nine type cards rendered");
  ok(doc.querySelector(".type-card").textContent.indexOf("The Reformer") !== -1, "first card is type 1");
  ok(doc.querySelector(".type-card").textContent.indexOf("Fears") !== -1, "cards carry the core fear/desire");

  $("btn-close-types").click();
  ok($("types-modal").hidden === true, "modal closes via the × button");

  open();
  doc.dispatchEvent(new window.KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
  ok($("types-modal").hidden === true, "modal closes on Escape");

  open();
  doc.querySelector("[data-modal-close]").click();
  ok($("types-modal").hidden === true, "modal closes on backdrop click");

  // Logo = home: from the quiz view, the brand returns to the intro.
  $("btn-start").click();
  ok(doc.querySelector("#view-quiz").hidden === false, "quiz view active");
  doc.querySelector(".brand").click();
  ok(doc.querySelector("#view-intro").hidden === false, "logo click returns to the intro (home)");
  ok(doc.querySelector("#view-quiz").hidden === true, "...and leaves the quiz view");

  ok(errors.length === 0, "zero console errors in modal block", errors);
  window.close();
}

/* ---------- extended pass flow ---------- */

{
  const { window, document: doc, errors } = buildWindow();
  const $ = (id) => doc.getElementById(id);
  $("btn-start").click();
  for (let idx = 0; idx < 45; idx++) {
    const want = (Math.floor(idx / 5) === 7) ? 5 : 3; // 8-max short pass
    Array.prototype.find.call($("quiz-options").children, (b) => Number(b.dataset.value) === want).click();
    $("btn-next").click();
  }
  ok($("result-number").textContent === "8", "short pass gives 8 before the deep dive");
  $("btn-extended").click();
  ok(doc.querySelector("#view-quiz").hidden === false, "extended button enters the deep dive");
  ok($("quiz-progress-label").textContent === "Extension 1 of 27", "extended progress label");
  ok($("quiz-num").textContent === "E1", "extended question counter uses the E-prefix");
  for (let idx = 0; idx < 27; idx++) {
    Array.prototype.find.call($("quiz-options").children, (b) => Number(b.dataset.value) === 3).click();
    $("btn-next").click();
  }
  ok(doc.querySelector("#view-result").hidden === false, "extended completion returns to the result");
  // Short 8-max (8=21, others 15) + extended all-3s (every type +9) → 8=30, decisive.
  ok($("result-number").textContent === "8", "extended score keeps 8 on top (8=30 vs 24)");
  ok($("extended-title").textContent === "The full read", "callout flips to The full read");
  ok($("btn-extended").hidden === true, "extended button hides after the deep dive");
  ok($("growth-block").hidden === false, "growth block appears on the extended result");
  ok($("growth-text").textContent.indexOf("softness") !== -1, "growth text present (type 8)");
  ok($("comm-text").textContent.indexOf("direct") !== -1, "communication text present (type 8)");
  const extTop = doc.querySelector(".score-row.top .score-val");
  ok(extTop.textContent === "30", "extended bars score out of 40 (8=30)");
  ok($("result-tie").hidden === true, "extended 6-point win stays decisive — no fake tie");
  ok(errors.length === 0, "zero console errors in extended flow", errors);
  window.close();
}

/* ---------- returning after full completion ---------- */

{
  const full = new Array(72).fill(3);
  const { window, document: doc, errors } = buildWindow(full);
  const $ = (id) => doc.getElementById(id);
  ok($("btn-start").textContent.indexOf("See your result again") !== -1, "intro detects the finished full pass");
  $("btn-start").click();
  ok(doc.querySelector("#view-result").hidden === false, "start shows the result directly when complete");
  ok($("growth-block").hidden === false, "growth surfaces immediately for the returning full taker");
  ok(errors.length === 0, "zero console errors on return-to-result", errors);
  window.close();
}

/* ---------- resume: seeded partial answers ---------- */

{
  const partial = new Array(45).fill(null);
  partial[0] = 4; partial[1] = 5; partial[2] = 3;
  const { window, document: doc } = buildWindow(partial);
  const $ = (id) => doc.getElementById(id);

  ok(doc.querySelector("#view-intro").hidden === false, "intro shows for returning visitor");
  ok($("btn-start").textContent.indexOf("Continue") !== -1, "button says Continue when answers exist");
  ok($("resume-note").hidden === false, "resume note visible");
  ok($("resume-note").textContent.indexOf("saved on this device") !== -1, "note mentions on-device save");

  $("btn-start").click();
  ok($("quiz-progress-label").textContent === "Question 4 of 45", "resumes at question 4 (index 3)");
  ok($("quiz-answered-label").textContent === "3 answered", "answered counter restored");
  const sel = doc.querySelectorAll(".option.selected");
  ok(sel.length === 0, "no selection shown for the current (unanswered) question");
  ok($("btn-next").disabled === true, "Next disabled on the in-progress question");
  window.close();
}

console.log("\nui: " + passed + " assertions passed");
if (process.exitCode) { console.log("ui: FAILURES PRESENT"); }