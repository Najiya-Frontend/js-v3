/* =========================================================================
   TenX — Feedback / Survey Page (TV SAFE: ES5 / Tizen 4 + LG)
   FIXED & CLEANED VERSION
   ========================================================================= */
(function (w) {
  "use strict";
  if (w.FeedbackPage) return;

  /* ---------------- helpers ---------------- */
  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = (txt == null ? "" : String(txt)); }
  function isFn(fn) { return typeof fn === "function"; }

  function normalizeUrl(u) {
    if (!u) return "";
    if (isFn(w.rewriteAssetUrl)) return w.rewriteAssetUrl(u);
    if (isFn(w.sanitizeUrl)) return w.sanitizeUrl(u);
    return u;
  }

  /* ---------------- state ---------------- */
  var active = false;
  var routeObj = null;
  var survey = null;
  var questions = [];
  var qIndex = 0;
  var cursorIndex = 0;            // -1 for rating = no selection, 0..n-1 otherwise
  var answersMap = {};

  /* ---------------- DOM ---------------- */
  var viewEl, bgEl, titleEl, qCountEl, qTextEl, answersEl, hintEl, toastEl;

  function mount() {
    if (viewEl) return;
    viewEl    = qs("view-feedback");
    bgEl      = qs("fb-bg");
    titleEl   = qs("fb-title");
    qCountEl  = qs("fb-qcount");
    qTextEl   = qs("fb-question");
    answersEl = qs("fb-answers");
    hintEl    = qs("fb-hint");
    toastEl   = qs("fb-toast");
  }

  function showToast(msg) {
    if (!toastEl) return;
    safeText(toastEl, msg);
    toastEl.className = "fb-toast is-on";
    setTimeout(function () {
      if (toastEl) toastEl.className = "fb-toast";
    }, 1200);
  }

  function setBackgroundFromRoute(r) {
    if (!bgEl) return;
    var url = r && r.route_bg ? normalizeUrl(r.route_bg) : "";
    bgEl.style.backgroundImage = url ? "url('" + url + "')" : "none";
    if (!url) bgEl.style.backgroundColor = "#000";
  }

  function clearAnswersUI() {
    if (answersEl) answersEl.innerHTML = "";
  }

  function renderStars(n, filledCount, cursorAt) {
    var wrap = document.createElement("div");
    wrap.className = "fb-stars";
    for (var i = 0; i < n; i++) {
      var s = document.createElement("span");
      s.className = "fb-star" +
        (i < filledCount ? " is-on" : "") +
        (i === cursorAt ? " is-cursor" : "");
      s.textContent = "★";
      wrap.appendChild(s);
    }
    answersEl.appendChild(wrap);
  }

  function renderBoolean(options, selectedId, cursorAt) {
    var wrap = document.createElement("div");
    wrap.className = "fb-bool";
    for (var i = 0; i < options.length; i++) {
      var o = options[i];
      var b = document.createElement("div");
      var isSel = selectedId && String(o.answer_id) === String(selectedId);
      b.className = "fb-opt" +
        (i === cursorAt ? " is-cursor" : "") +
        (isSel ? " is-selected" : "");
      b.textContent = (o.answer_text || "").toUpperCase();
      wrap.appendChild(b);
    }
    answersEl.appendChild(wrap);
  }

  function getCurrentQuestion() {
    return questions[qIndex] || null;
  }

  function detectQuestionMode(q) {
    var a = q && q.question_answers && q.question_answers[0];
    if (!a) return "UNKNOWN";
    if (a.answer_type_name) return String(a.answer_type_name).toUpperCase();
    if (a.answer_symbol) {
      var s = String(a.answer_symbol).toLowerCase();
      if (s === "star") return "RATING";
      if (s === "circle") return "BOOLEAN";
    }
    return "UNKNOWN";
  }

  function render() {
    if (!active) return;

    var q = getCurrentQuestion();
    if (!q) {
      safeText(qTextEl, "No questions available");
      safeText(qCountEl, "");
      clearAnswersUI();
      return;
    }

    safeText(titleEl, "Feedback");
    safeText(qCountEl, "Question: " + (qIndex + 1) + " of " + questions.length);
    safeText(qTextEl, q.question_text || "");

    clearAnswersUI();

    var mode = detectQuestionMode(q);
    var selectedId = answersMap[q.question_id];

    if (mode === "RATING") {
      var n = q.question_answers ? q.question_answers.length : 5;

      // Restore saved rating if exists
      if (selectedId) {
        for (var i = 0; i < q.question_answers.length; i++) {
          if (String(q.question_answers[i].answer_id) === String(selectedId)) {
            cursorIndex = i;
            break;
          }
        }
      }

      // Clamp cursorIndex: allow -1 (no rating) up to n-1
      cursorIndex = Math.max(-1, Math.min(cursorIndex, n - 1));

      var filled = cursorIndex >= 0 ? cursorIndex + 1 : 0;
      var cursorAt = cursorIndex >= 0 ? cursorIndex : -1;

      renderStars(n, filled, cursorAt);
      safeText(hintEl, "← → Navigate arrow keys to leave your rating");
    } else {
      // BOOLEAN or fallback
      var cursor = clamp(cursorIndex, 0, (q.question_answers || []).length - 1);
      renderBoolean(q.question_answers || [], selectedId, cursor);
      safeText(hintEl, "← → Choose option, OK to confirm");
    }
  }

  function saveCurrentSelection() {
    var q = getCurrentQuestion();
    if (!q || !q.question_answers || !q.question_answers.length) return false;

    var mode = detectQuestionMode(q);

    if (mode === "RATING") {
      if (cursorIndex < 0) return false; // no star selected
      var idx = clamp(cursorIndex, 0, q.question_answers.length - 1);
      answersMap[q.question_id] = q.question_answers[idx].answer_id;
      return true;
    }

    // BOOLEAN / other
    var idx = clamp(cursorIndex, 0, q.question_answers.length - 1);
    answersMap[q.question_id] = q.question_answers[idx].answer_id;
    return true;
  }

  function nextQuestionOrSubmit() {
    if (qIndex < questions.length - 1) {
      qIndex++;
      var nextQ = questions[qIndex];
      cursorIndex = detectQuestionMode(nextQ) === "RATING" ? -1 : 0;
      render();
    } else {
      submitSurvey();
    }
  }

  function buildSubmitPayload() {
    var payload = {
      route_key: routeObj && routeObj.route_key || "KEY_FEEDBACK",
      survey_id: survey && survey.survey_id || null,
      hotel_id: routeObj && routeObj.hotel_id || null,
      language_id: routeObj && routeObj.language_id || null,
      answers: []
    };
    for (var i = 0; i < questions.length; i++) {
      var q = questions[i];
      payload.answers.push({
        question_id: q.question_id,
        answer_id: answersMap[q.question_id] || null
      });
    }
    return payload;
  }

  function submitSurvey() {
    var payload = buildSubmitPayload();

    if (isFn(w.submitSurvey)) {
      w.submitSurvey(payload, function (err) {
        showToast(err ? "Failed to submit" : "Thank you!");
        if (!err) setTimeout(FeedbackPage.closeToHome, 700);
      });
      return;
    }

    if (w.TenxApi && isFn(w.TenxApi.submitSurvey)) {
      w.TenxApi.submitSurvey(payload, function (err) {
        showToast(err ? "Failed to submit" : "Thank you!");
        if (!err) setTimeout(FeedbackPage.closeToHome, 700);
      });
      return;
    }

    // fallback
    try { console.log("[Feedback] submit payload:", payload); } catch(e){}
    showToast("Saved");
    setTimeout(FeedbackPage.closeToHome, 700);
  }

  /* ---------------- public API ---------------- */
  var FeedbackPage = {
    mount: mount,

    open: function (route) {
      mount();
      routeObj = route || null;
      survey = routeObj && routeObj.layout_data || null;
      questions = survey && survey.survey_questions || [];

      qIndex = 0;
      answersMap = {};
      cursorIndex = questions.length && detectQuestionMode(questions[0]) === "RATING" ? -1 : 0;

      active = true;
      if (viewEl) {
        viewEl.style.display = "block";
        viewEl.className = "is-active";
      }

      setBackgroundFromRoute(routeObj);
      render();
    },

    closeToHome: function () {
      active = false;
      routeObj = survey = null;
      questions = [];
      answersMap = {};
      qIndex = cursorIndex = 0;

      if (viewEl) {
        viewEl.style.display = "none";
        viewEl.className = "";
      }

      if (isFn(w.goHome)) w.goHome();
      else if (isFn(w.showView)) w.showView("home");
    },

    isActive: function () { return active; },

    onKeyDown: function (e) {
      if (!active) return false;

      var k = e.keyCode || e.which;

      // Back / Exit keys
      if ([8, 27, 461, 10009, 4].indexOf(k) !== -1 || k === 403) {
        if (e.preventDefault) e.preventDefault();
        FeedbackPage.closeToHome();
        return true;
      }

      // Left / Right arrows
      if (k === 37 || k === 39) {
        if (e.preventDefault) e.preventDefault();

        var q = getCurrentQuestion();
        if (!q || !q.question_answers) return true;

        var mode = detectQuestionMode(q);
        var n = q.question_answers.length || 5;

        if (mode === "RATING") {
          cursorIndex += (k === 39 ? 1 : -1);
          cursorIndex = Math.max(-1, Math.min(cursorIndex, n - 1));
        } else {
          cursorIndex += (k === 39 ? 1 : -1);
          cursorIndex = clamp(cursorIndex, 0, n - 1);
        }

        render();
        return true;
      }

      // OK / Enter
      if (k === 13) {
        if (e.preventDefault) e.preventDefault();
        if (saveCurrentSelection()) {
          nextQuestionOrSubmit();
        } else {
          showToast("Select an option");
        }
        return true;
      }

      return false;
    }
  };

  w.FeedbackPage = FeedbackPage;

})(window);