/* =========================================================================
   Your Number — UI layer
   Depends on js/engine.js globals (ITEMS, LIKERT, TYPES, TRIADS, typeFor,
   score, selectType, extendedOrder, buildShareText). Guarded for Node.
   ========================================================================= */

"use strict";

if (typeof document !== "undefined") {
  (function () {
    var STORE_ANSWERS = "yn:v1:answers";
    var STORE_INDEX = "yn:v1:index";
    var STORE_EXTINDEX = "yn:v1:extindex";
    var STORE_MODE = "yn:v1:mode";
    var SHORT_COUNT = 45;
    var EXT_COUNT = 27;

    var els = {
      intro: document.getElementById("view-intro"),
      quiz: document.getElementById("view-quiz"),
      result: document.getElementById("view-result"),
      brand: document.querySelector(".brand"),
      start: document.getElementById("btn-start"),
      resumeNote: document.getElementById("resume-note"),
      progressLabel: document.getElementById("quiz-progress-label"),
      answeredLabel: document.getElementById("quiz-answered-label"),
      progress: document.getElementById("quiz-progress"),
      progressFill: document.getElementById("quiz-progress-fill"),
      counter: document.getElementById("quiz-counter"),
      text: document.getElementById("quiz-text"),
      options: document.getElementById("quiz-options"),
      back: document.getElementById("btn-back"),
      next: document.getElementById("btn-next"),
      resultNumber: document.getElementById("result-number"),
      resultName: document.getElementById("result-name"),
      resultBlurb: document.getElementById("result-blurb"),
      resultTie: document.getElementById("result-tie"),
      resultKicker: document.getElementById("result-kicker"),
      statWing: document.getElementById("stat-wing"),
      statTriad: document.getElementById("stat-triad"),
      statStress: document.getElementById("stat-stress"),
      statSecurity: document.getElementById("stat-security"),
      scorebars: document.getElementById("scorebars"),
      resultClose: document.getElementById("result-close"),
      closeText: document.getElementById("close-text"),
      closePicks: document.getElementById("close-picks"),
      chosenNote: document.getElementById("chosen-note"),
      closeList: document.getElementById("close-list"),
      extendedBlock: document.getElementById("extended-block"),
      extendedTitle: document.getElementById("extended-title"),
      extendedCopy: document.getElementById("extended-copy"),
      btnExtended: document.getElementById("btn-extended"),
      growthBlock: document.getElementById("growth-block"),
      growthText: document.getElementById("growth-text"),
      commText: document.getElementById("comm-text"),
      typesModal: document.getElementById("types-modal"),
      btnAllTypes: document.getElementById("btn-all-types"),
      btnCloseTypes: document.getElementById("btn-close-types"),
      typesList: document.getElementById("types-list"),
      copy: document.getElementById("btn-copy"),
      copyFeedback: document.getElementById("copy-feedback"),
      retake: document.getElementById("btn-retake"),
    };

    var answers = loadAnswers() || new Array(ITEMS.length).fill(null);
    var mode = "short";          // "short" (1-45) | "extended" (46-72)
    var index = 0;               // position within the active mode's list
    var extOrder = [];           // ordered item ids for the extended pass
    var lastResult = null;
    var lastShortClose = null;   // closeCall from the short pass (adaptive order)
    var retakeArmed = false;
    var retakeTimer = null;

    /* ---------- storage ---------- */

    function loadAnswers() {
      try {
        var raw = localStorage.getItem(STORE_ANSWERS);
        if (!raw) return null;
        var arr = JSON.parse(raw);
        if (!Array.isArray(arr) || (arr.length !== 45 && arr.length !== ITEMS.length)) return null;
        while (arr.length < ITEMS.length) { arr.push(null); } // v1 → v2 migration
        return arr.map(function (v) { return (typeof v === "number" && v >= 1 && v <= 5) ? v : null; });
      } catch (e) { return null; }
    }

    function saveAnswers() {
      try { localStorage.setItem(STORE_ANSWERS, JSON.stringify(answers)); } catch (e) { /* private mode */ }
      try {
        localStorage.setItem(STORE_MODE, mode);
        localStorage.setItem(mode === "extended" ? STORE_EXTINDEX : STORE_INDEX, String(index));
      } catch (e) { /* ignore */ }
    }

    function clearAnswers() {
      answers = new Array(ITEMS.length).fill(null);
      mode = "short";
      index = 0;
      extOrder = [];
      lastShortClose = null;
      try { localStorage.removeItem(STORE_ANSWERS); } catch (e) { /* ignore */ }
      try { localStorage.removeItem(STORE_INDEX); } catch (e) { /* ignore */ }
      try { localStorage.removeItem(STORE_EXTINDEX); } catch (e) { /* ignore */ }
      try { localStorage.removeItem(STORE_MODE); } catch (e) { /* ignore */ }
    }

    /* ---------- counting ---------- */

    function answeredCount() {
      return answers.filter(function (v) { return v !== null; }).length;
    }

    function shortAnswered() {
      var n = 0;
      for (var i = 0; i < SHORT_COUNT; i++) { if (answers[i] !== null) n++; }
      return n;
    }

    function extAnswered() {
      var n = 0;
      for (var i = SHORT_COUNT; i < answers.length; i++) { if (answers[i] !== null) n++; }
      return n;
    }

    /* ---------- views ---------- */

    function showView(view) {
      [els.intro, els.quiz, els.result].forEach(function (v) { v.hidden = true; });
      view.hidden = false;
      try { window.scrollTo(0, 0); } catch (e) { /* jsdom */ }
    }

    /* ---------- intro ---------- */

    function renderIntro() {
      var done = answeredCount();
      if (done === 0) {
        els.start.textContent = "Begin — it's free";
        els.resumeNote.hidden = true;
      } else if (done === ITEMS.length) {
        els.start.textContent = "See your result again";
        els.resumeNote.textContent = "You've taken the full 72 questions. It's all still here, and it's all still free.";
        els.resumeNote.hidden = false;
      } else if (extAnswered() > 0) {
        els.start.textContent = "Resume the extended pass — " + done + " answered";
        els.resumeNote.textContent = "The deep dive continues. 27 extra questions, your answers saved on this device.";
        els.resumeNote.hidden = false;
      } else {
        els.start.textContent = "Continue — " + done + " answered";
        els.resumeNote.textContent = "You left off around question " + (done + 1) + ". Your answers are saved on this device.";
        els.resumeNote.hidden = false;
      }
    }

    /* ---------- quiz ---------- */

    function currentItem() {
      return mode === "short" ? ITEMS[index] : ITEMS[extOrder[index] - 1];
    }

    function currentSlot() {
      return mode === "short" ? index : extOrder[index] - 1;
    }

    function renderProgress() {
      var done = answeredCount();
      els.progressLabel.textContent = mode === "short"
        ? "Question " + (index + 1) + " of " + SHORT_COUNT
        : "Extension " + (index + 1) + " of " + EXT_COUNT;
      els.answeredLabel.textContent = done + " answered";
      var pct = Math.round((done / ITEMS.length) * 100);
      els.progressFill.style.width = pct + "%";
      els.progress.setAttribute("aria-valuenow", String(done));
    }

    function renderQuestion() {
      var item = currentItem();
      var slot = currentSlot();
      els.counter.textContent = mode === "short"
        ? "Question " + (index + 1) + " of " + SHORT_COUNT
        : "Extension " + (index + 1) + " of " + EXT_COUNT;
      els.text.textContent = item.text;
      els.options.innerHTML = "";
      LIKERT.forEach(function (opt) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "option" + (answers[slot] === opt.value ? " selected" : "");
        btn.dataset.value = String(opt.value);
        btn.setAttribute("role", "radio");
        btn.setAttribute("aria-checked", answers[slot] === opt.value ? "true" : "false");

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

      var selected = answers[slot] !== null;
      els.next.disabled = !selected;
      if (mode === "extended" && index === EXT_COUNT - 1) {
        els.next.textContent = "See my final number";
      } else if (mode === "short" && index === SHORT_COUNT - 1) {
        els.next.textContent = "See my number";
      } else {
        els.next.textContent = "Next";
      }
      els.back.disabled = mode === "short" && index === 0;
      renderProgress();
    }

    function selectAnswer(value) {
      answers[currentSlot()] = value;
      saveAnswers();
      renderQuestion();
      var isLast = mode === "short"
        ? index === SHORT_COUNT - 1
        : index === EXT_COUNT - 1;
      if (!isLast) { els.next.focus(); }
    }

    function goNext() {
      if (answers[currentSlot()] === null) return;
      var isLast = mode === "short"
        ? index === SHORT_COUNT - 1
        : index === EXT_COUNT - 1;
      if (isLast) {
        if (mode === "short") { finishShort(); } else { finishExtended(); }
      } else {
        index += 1;
        saveAnswers();
        renderQuestion();
      }
    }

    function goBack() {
      if (mode === "short") {
        if (index === 0) return;
        index -= 1;
        saveAnswers();
        renderQuestion();
        return;
      }
      // extended: back at the start returns to the (short) result
      if (index > 0) {
        index -= 1;
        saveAnswers();
        renderQuestion();
        return;
      }
      if (shortAnswered() === SHORT_COUNT) {
        lastResult = score(answers.slice(0, SHORT_COUNT));
        lastShortClose = lastResult.closeCall;
        renderResult();
      }
    }

    /* ---------- results ---------- */

    function finishShort() {
      lastResult = score(answers.slice(0, SHORT_COUNT));
      lastShortClose = lastResult.closeCall;
      renderResult();
    }

    function finishExtended() {
      lastResult = score(answers);
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
        var tied = r.ranked.filter(function (x) { return x.score === r.primaryScore; });
        els.resultTie.textContent = "A real tie: " + tied.map(function (x) {
          return x.n + " · " + typeFor(x.n).name;
        }).join(", ") + ". Read them all, then choose which fits.";
        els.resultTie.hidden = false;
      } else {
        els.resultTie.hidden = true;
      }

      els.resultKicker.textContent = r.chosen ? "You chose" : "Your number is";
      els.chosenNote.hidden = true;
      if (r.chosen) {
        els.chosenNote.textContent = "You chose " + r.primary + " — the raw scores were close, and your number is yours. " +
          "Nothing wrong with knowing who you are.";
        els.chosenNote.hidden = false;
      }

      els.copyFeedback.hidden = true;

      // Score bars — scale-aware (25 short, 40 extended).
      els.scorebars.innerHTML = "";
      r.breakdown.forEach(function (b) {
        var row = document.createElement("div");
        row.className = "score-row" + (b.n === r.primary ? " top" : "");
        var label = document.createElement("span");
        label.className = "score-label";
        label.textContent = b.n + "  " + b.name;
        var track = document.createElement("span");
        track.className = "score-track";
        var fill = document.createElement("span");
        fill.className = "score-fill";
        fill.style.width = Math.round((b.score / r.maxScore) * 100) + "%";
        track.appendChild(fill);
        var val = document.createElement("span");
        val.className = "score-val";
        val.textContent = String(b.score);
        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(val);
        els.scorebars.appendChild(row);
      });

      // Close-call panel — refuse to fake certainty when the margin is thin.
      els.closePicks.innerHTML = "";
      els.closeList.innerHTML = "";
      if (r.close) {
        els.closeText.textContent = "Your top numbers landed within a few points of each other — read them all, then choose.";
        r.closeCall.forEach(function (n) {
          var tt = typeFor(n);
          var li = document.createElement("li");
          li.textContent = n + " · " + tt.name + " — fears " + tt.fear;
          els.closeList.appendChild(li);
          var b = document.createElement("button");
          b.type = "button";
          b.className = "btn btn-ghost pick";
          b.textContent = "Choose " + n + " · " + typeFor(n).name;
          b.dataset.pick = String(n);
          els.closePicks.appendChild(b);
        });
        els.resultClose.hidden = false;
      } else {
        els.resultClose.hidden = true;
      }

      // Extended pass callout — offered on EVERY result, close call or not.
      els.growthBlock.hidden = true;
      if (r.extended) {
        els.extendedTitle.textContent = "The full read";
        els.extendedCopy.textContent = "You answered all " + ITEMS.length + " questions. This is the deepest read this free test offers — and it will always be free.";
        els.btnExtended.hidden = true;
        els.growthText.textContent = t.growth;
        els.commText.textContent = t.communication;
        els.growthBlock.hidden = false;
      } else {
        els.extendedTitle.textContent = "The extended pass";
        els.extendedCopy.textContent = r.close
          ? "Your numbers are close — 27 more questions dig straight into who was tied."
          : "Want to confirm your number? 27 more questions lock it in with precision.";
        els.btnExtended.hidden = false;
        els.extendedBlock.hidden = false;
      }

      showView(els.result);
    }

    /* ---------- extended pass ---------- */

    function firstUnansweredExtended() {
      for (var i = 0; i < extOrder.length; i++) {
        if (answers[extOrder[i] - 1] === null) return i;
      }
      return 0;
    }

    function enterExtended() {
      extOrder = extendedOrder(lastShortClose || null);
      mode = "extended";
      index = firstUnansweredExtended();
      saveAnswers();
      showView(els.quiz);
      renderQuestion();
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

    /* ---------- all nine types ---------- */

    function renderAllTypes() {
      els.typesList.innerHTML = "";
      TYPES.forEach(function (t) {
        var card = document.createElement("article");
        card.className = "type-card";
        var num = document.createElement("span");
        num.className = "type-card-num";
        num.textContent = String(t.n);
        var body = document.createElement("div");
        body.className = "type-card-body";
        var h = document.createElement("h3");
        h.textContent = t.n + " · " + t.name;
        var triad = document.createElement("p");
        triad.className = "type-card-triad";
        triad.textContent = TRIADS[t.triad].label;
        var fd = document.createElement("p");
        fd.className = "fear-desire";
        fd.textContent = "Fears " + t.fear + " · Desires " + t.desire;
        var blurb = document.createElement("p");
        blurb.className = "type-card-blurb";
        blurb.textContent = t.blurb;
        body.appendChild(h);
        body.appendChild(triad);
        body.appendChild(fd);
        body.appendChild(blurb);
        card.appendChild(num);
        card.appendChild(body);
        els.typesList.appendChild(card);
      });
    }

    function openTypesModal() {
      els.typesModal.hidden = false;
      document.body.style.overflow = "hidden";
      els.btnCloseTypes.focus();
    }

    function closeTypesModal() {
      els.typesModal.hidden = true;
      document.body.style.overflow = "";
    }

    /* ---------- flow ---------- */

    function startFlow() {
      var done = answeredCount();
      if (done === ITEMS.length) { finishExtended(); return; }
      if (done >= SHORT_COUNT && extAnswered() === 0) { finishShort(); return; }
      if (extAnswered() > 0) {
        extOrder = extendedOrder(lastShortClose || null);
        mode = "extended";
        index = firstUnansweredExtended();
      } else {
        mode = "short";
        index = answers.slice(0, SHORT_COUNT).indexOf(null);
        if (index === -1) index = 0;
      }
      showView(els.quiz);
      renderQuestion();
    }

    function restoreState() {
      try {
        var storedMode = localStorage.getItem(STORE_MODE);
        if (storedMode === "extended" && extAnswered() > 0) {
          if (shortAnswered() === SHORT_COUNT) {
            var s = score(answers.slice(0, SHORT_COUNT));
            lastShortClose = s.closeCall;
            lastResult = s;
          }
          extOrder = extendedOrder(lastShortClose || null);
          mode = "extended";
          var ei = parseInt(localStorage.getItem(STORE_EXTINDEX), 10);
          index = (Number.isInteger(ei) && ei >= 0 && ei < EXT_COUNT) ? ei : firstUnansweredExtended();
          return;
        }
      } catch (e) { /* ignore */ }
      mode = "short";
      try {
        var i = parseInt(localStorage.getItem(STORE_INDEX), 10);
        if (Number.isInteger(i) && i >= 0 && i < SHORT_COUNT) { index = i; return; }
      } catch (e) { /* ignore */ }
      var first = answers.slice(0, SHORT_COUNT).indexOf(null);
      if (first !== -1) { index = first; }
    }

    /* ---------- wiring ---------- */

    els.start.addEventListener("click", startFlow);

    els.options.addEventListener("click", function (ev) {
      var btn = ev.target.closest(".option");
      if (!btn) return;
      selectAnswer(parseInt(btn.dataset.value, 10));
    });

    els.next.addEventListener("click", goNext);
    els.back.addEventListener("click", goBack);
    els.copy.addEventListener("click", copyResult);
    els.retake.addEventListener("click", armRetake);
    els.btnExtended.addEventListener("click", enterExtended);

    els.closePicks.addEventListener("click", function (ev) {
      var btn = ev.target.closest("[data-pick]");
      if (!btn || !lastResult) return;
      var n = parseInt(btn.dataset.pick, 10);
      lastResult = selectType(lastResult.scores, n, lastResult.maxScore, lastResult.extended);
      renderResult();
    });

    /* logo = home */
    els.brand.addEventListener("click", function (ev) {
      ev.preventDefault();
      showView(els.intro);
      renderIntro();
    });

    els.btnAllTypes.addEventListener("click", openTypesModal);
    els.btnCloseTypes.addEventListener("click", closeTypesModal);
    els.typesModal.addEventListener("click", function (ev) {
      if (ev.target.closest("[data-modal-close]")) closeTypesModal();
    });

    /* keyboard: 1–5 to answer, Enter to advance, Escape to close the modal */
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && !els.typesModal.hidden) {
        closeTypesModal();
        return;
      }
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
    restoreState();
    renderAllTypes();
    renderIntro();
  })();
}