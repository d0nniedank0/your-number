/* =========================================================================
   Your Number — UI layer
   Depends on js/engine.js globals (ITEMS, LIKERT, TYPES, TRIADS, typeFor,
   score, buildShareText). Guarded so Node can require this file.
   ========================================================================= */

"use strict";

if (typeof document !== "undefined") {
  (function () {
    var STORE_ANSWERS = "yn:v1:answers";
    var STORE_INDEX = "yn:v1:index";

    var els = {
      intro: document.getElementById("view-intro"),
      quiz: document.getElementById("view-quiz"),
      result: document.getElementById("view-result"),
      start: document.getElementById("btn-start"),
      resumeNote: document.getElementById("resume-note"),
      progressLabel: document.getElementById("quiz-progress-label"),
      answeredLabel: document.getElementById("quiz-answered-label"),
      progress: document.getElementById("quiz-progress"),
      progressFill: document.getElementById("quiz-progress-fill"),
      counter: document.getElementById("quiz-counter"),
      num: document.getElementById("quiz-num"),
      text: document.getElementById("quiz-text"),
      options: document.getElementById("quiz-options"),
      back: document.getElementById("btn-back"),
      next: document.getElementById("btn-next"),
      resultNumber: document.getElementById("result-number"),
      resultName: document.getElementById("result-name"),
      resultBlurb: document.getElementById("result-blurb"),
      resultTie: document.getElementById("result-tie"),
      statWing: document.getElementById("stat-wing"),
      statTriad: document.getElementById("stat-triad"),
      statStress: document.getElementById("stat-stress"),
      statSecurity: document.getElementById("stat-security"),
      copy: document.getElementById("btn-copy"),
      copyFeedback: document.getElementById("copy-feedback"),
      retake: document.getElementById("btn-retake"),
    };

    var answers = loadAnswers() || new Array(ITEMS.length).fill(null);
    var index = 0;
    var lastResult = null;
    var retakeArmed = false;
    var retakeTimer = null;

    /* ---------- storage ---------- */

    function loadAnswers() {
      try {
        var raw = localStorage.getItem(STORE_ANSWERS);
        if (!raw) return null;
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr) || arr.length !== ITEMS.length) return null;
        return arr.map(function (v) { return (typeof v === "number" && v >= 1 && v <= 5) ? v : null; });
      } catch (e) { return null; }
    }

    function saveAnswers() {
      try { localStorage.setItem(STORE_ANSWERS, JSON.stringify(answers)); } catch (e) { /* private mode */ }
      try { localStorage.setItem(STORE_INDEX, String(index)); } catch (e) { /* ignore */ }
    }

    function clearAnswers() {
      answers = new Array(ITEMS.length).fill(null);
      index = 0;
      try { localStorage.removeItem(STORE_ANSWERS); } catch (e) { /* ignore */ }
      try { localStorage.removeItem(STORE_INDEX); } catch (e) { /* ignore */ }
    }

    /* ---------- views ---------- */

    function showView(view) {
      [els.intro, els.quiz, els.result].forEach(function (v) { v.hidden = true; });
      view.hidden = false;
      try { window.scrollTo(0, 0); } catch (e) { /* jsdom has no scrollTo */ }
    }

    /* ---------- intro ---------- */

    function renderIntro() {
      var answered = answers.filter(function (v) { return v !== null; }).length;
      if (answered === 0) {
        els.start.textContent = "Begin — it's free";
        els.resumeNote.hidden = true;
      } else if (answered === ITEMS.length) {
        els.start.textContent = "See your number again";
        els.resumeNote.textContent = "You've already finished once — take it again anytime. It always stays free.";
        els.resumeNote.hidden = false;
      } else {
        els.start.textContent = "Continue — " + answered + " answered";
        els.resumeNote.textContent = "You left off around question " + (answered + 1) + ". Your answers are saved on this device.";
        els.resumeNote.hidden = false;
      }
    }

    /* ---------- quiz ---------- */

    function answeredCount() {
      return answers.filter(function (v) { return v !== null; }).length;
    }

    function renderProgress() {
      var done = answeredCount();
      els.progressLabel.textContent = "Question " + (index + 1) + " of " + ITEMS.length;
      els.answeredLabel.textContent = done + " answered";
      var pct = Math.round((done / ITEMS.length) * 100);
      els.progressFill.style.width = pct + "%";
      els.progress.setAttribute("aria-valuenow", String(done));
    }

    function renderQuestion() {
      var item = ITEMS[index];
      els.num.textContent = String(index + 1);
      els.text.textContent = item.text;
      els.options.innerHTML = "";
      LIKERT.forEach(function (opt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option" + (answers[index] === opt.value ? " selected" : "");
        btn.dataset.value = String(opt.value);
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", answers[index] === opt.value ? "true" : "false");

        var dot = document.createElement("span");
        dot.className = "option-dot";
        dot.textContent = String(opt.value);

        var label = document.createElement("span");
        label.className = "option-label";
        label.textContent = opt.label;

        btn.appendChild(dot);
        btn.appendChild(label);
        els.options.appendChild(btn);
      });

      var selected = answers[index] !== null;
      els.next.disabled = !selected;
      els.next.textContent = index === ITEMS.length - 1 ? "See my number" : "Next";
      els.back.disabled = index === 0;
      renderProgress();
    }

    function selectAnswer(value) {
      answers[index] = value;
      saveAnswers();
      renderQuestion();
      if (index < ITEMS.length - 1) {
        els.next.focus();
      }
    }

    function goNext() {
      if (answers[index] === null) return;
      if (index === ITEMS.length - 1) {
        finishQuiz();
      } else {
        index += 1;
        try { localStorage.setItem(STORE_INDEX, String(index)); } catch (e) { /* ignore */ }
        renderQuestion();
      }
    }

    function goBack() {
      if (index === 0) return;
      index -= 1;
      try { localStorage.setItem(STORE_INDEX, String(index)); } catch (e) { /* ignore */ }
      renderQuestion();
    }

    /* ---------- result ---------- */

    function finishQuiz() {
      try {
        lastResult = score(answers);
      } catch (e) {
        lastResult = null;
        var n = answeredCount();
        if (n < ITEMS.length) {
          index = Math.min(n, ITEMS.length - 1);
          renderQuestion();
        }
        return;
      }
      renderResult();
    }

    function renderResult() {
      var r = lastResult;
      var t = typeFor(r.primary);
      var wingT = typeFor(r.wing);
      var triad = TRIADS[r.triad];
      var stressT = typeFor(r.stress);
      var secT = typeFor(r.security);

      els.resultNumber.textContent = String(r.primary);
      els.resultName.textContent = t.name;
      els.resultBlurb.textContent = t.blurb;
      els.statWing.textContent = r.wing + " · " + wingT.name;
      els.statTriad.textContent = triad.label + " (" + triad.types.join("–") + ")";
      els.statStress.textContent = r.stress + " · " + stressT.name;
      els.statSecurity.textContent = r.security + " · " + secT.name;
      if (r.tie) {
        var runner = typeFor(r.runnerUp);
        els.resultTie.textContent = "Close call: you tied with " + r.runnerUp + " · " + runner.name + ". Read both and see which one fits best.";
        els.resultTie.hidden = false;
      } else {
        els.resultTie.hidden = true;
      }

      els.copyFeedback.hidden = true;
      showView(els.result);
    }

    /* ---------- copy ---------- */

    function showCopied() {
      els.copyFeedback.textContent = "Copied — go tell someone your number.";
      els.copyFeedback.hidden = false;
    }

    function manualCopy(text) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
      document.body.removeChild(ta);
      if (ok) {
        showCopied();
      } else {
        els.copyFeedback.textContent = "Copy didn't fire here — select the card text and copy it manually. The words are yours.";
        els.copyFeedback.hidden = false;
      }
    }

    function copyResult() {
      if (!lastResult) return;
      var text = buildShareText(lastResult);
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        navigator.clipboard.writeText(text).then(showCopied).catch(function () { manualCopy(text); });
      } else {
        manualCopy(text);
      }
    }

    /* ---------- retake ---------- */

    function armRetake() {
      if (retakeArmed) {
        clearAnswers();
        renderIntro();
        showView(els.intro);
        els.retake.textContent = "Retake the test";
        retakeArmed = false;
        return;
      }
      retakeArmed = true;
      els.retake.textContent = "Really start over?";
      if (retakeTimer) clearTimeout(retakeTimer);
      retakeTimer = setTimeout(function () {
        retakeArmed = false;
        els.retake.textContent = "Retake the test";
      }, 3000);
    }

    /* ---------- wiring ---------- */

    function restoreIndex() {
      try {
        var i = parseInt(localStorage.getItem(STORE_INDEX), 10);
        if (Number.isInteger(i) && i >= 0 && i < ITEMS.length) { index = i; return; }
      } catch (e) { /* ignore */ }
      // No valid stored position → resume at the first unanswered question.
      var first = answers.indexOf(null);
      if (first !== -1) { index = first; }
    }

    els.start.addEventListener("click", function () {
      showView(els.quiz);
      renderQuestion();
    });

    els.options.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".option");
      if (!btn) return;
      selectAnswer(parseInt(btn.dataset.value, 10));
    });

    els.next.addEventListener("click", goNext);
    els.back.addEventListener("click", goBack);
    els.copy.addEventListener("click", copyResult);
    els.retake.addEventListener("click", armRetake);

    /* keyboard: 1–5 to answer, Enter to advance */
    document.addEventListener("keydown", function (ev) {
      if (els.quiz.hidden) return;
      var k = parseInt(ev.key, 10);
      if (k >= 1 && k <= 5 && els.options.querySelectorAll(".option").length === LIKERT.length) {
        selectAnswer(k);
        ev.preventDefault();
      } else if (ev.key === "Enter" && !els.next.disabled) {
        els.next.click();
        ev.preventDefault();
      }
    });

    /* boot */
    restoreIndex();
    renderIntro();
  })();
}