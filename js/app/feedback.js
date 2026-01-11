/* =========================================================================
   TenX — Feedback / Survey Page (TV SAFE: ES5 / Tizen 4 + LG)
   FIXED: Back navigation from first question + Auto-exit after submission
   ========================================================================= */
(function (w) {
  "use strict";
  if (w.FeedbackPage) return;

  /* ---------------- helpers ---------------- */
  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = (txt == null) ? "" : String(txt); }
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
  var cursorIndex = 0;
  var answersMap = {};
  var closeTimer = null;
  var submitting = false;

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
      
      var isOn = (i < filledCount);
      var isCursor = (i === cursorAt);
      
      s.className = "fb-star" +
        (isOn ? " is-on" : "") +
        (isCursor ? " is-cursor" : "");
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

      if (selectedId) {
        for (var i = 0; i < q.question_answers.length; i++) {
          if (String(q.question_answers[i].answer_id) === String(selectedId)) {
            cursorIndex = i;
            break;
          }
        }
      }

      cursorIndex = Math.max(-1, Math.min(cursorIndex, n - 1));

      var filled = cursorIndex >= 0 ? cursorIndex + 1 : 0;
      var cursorAt = cursorIndex >= 0 ? cursorIndex : -1;

      renderStars(n, filled, cursorAt);
      safeText(hintEl, "← → Navigate arrow keys to leave your rating");
    } else {
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
      if (cursorIndex < 0) return false;
      var idx = clamp(cursorIndex, 0, q.question_answers.length - 1);
      answersMap[q.question_id] = q.question_answers[idx].answer_id;
      return true;
    }

    var idx = clamp(cursorIndex, 0, q.question_answers.length - 1);
    answersMap[q.question_id] = q.question_answers[idx].answer_id;
    return true;
  }

  function previousQuestion() {
    if (qIndex > 0) {
      qIndex--;
      var prevQ = questions[qIndex];
      
      var savedAnswerId = answersMap[prevQ.question_id];
      if (savedAnswerId) {
        var mode = detectQuestionMode(prevQ);
        if (mode === "RATING") {
          for (var i = 0; i < prevQ.question_answers.length; i++) {
            if (String(prevQ.question_answers[i].answer_id) === String(savedAnswerId)) {
              cursorIndex = i;
              break;
            }
          }
        } else {
          for (var j = 0; j < prevQ.question_answers.length; j++) {
            if (String(prevQ.question_answers[j].answer_id) === String(savedAnswerId)) {
              cursorIndex = j;
              break;
            }
          }
        }
      } else {
        cursorIndex = detectQuestionMode(prevQ) === "RATING" ? -1 : 0;
      }
      
      render();
      return true;
    }
    
    // ✅ FIX #2: At first question, return false so home.js handles back
    return false;
  }

  function nextQuestionOrSubmit() {
    if (qIndex < questions.length - 1) {
      qIndex++;
      var nextQ = questions[qIndex];
      
      var savedAnswerId = answersMap[nextQ.question_id];
      if (savedAnswerId) {
        var mode = detectQuestionMode(nextQ);
        if (mode === "RATING") {
          for (var i = 0; i < nextQ.question_answers.length; i++) {
            if (String(nextQ.question_answers[i].answer_id) === String(savedAnswerId)) {
              cursorIndex = i;
              break;
            }
          }
        } else {
          for (var j = 0; j < nextQ.question_answers.length; j++) {
            if (String(nextQ.question_answers[j].answer_id) === String(savedAnswerId)) {
              cursorIndex = j;
              break;
            }
          }
        }
      } else {
        cursorIndex = detectQuestionMode(nextQ) === "RATING" ? -1 : 0;
      }
      
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

  // ✅ FIX #2: Schedule auto-close to home after submission
  function scheduleAutoClose(delayMs) {
    if (closeTimer) clearTimeout(closeTimer);
    closeTimer = setTimeout(function() {
      FeedbackPage.closeToHome();
    }, delayMs || 2000);
  }

  function submitSurvey() {
    if (submitting) return;
    submitting = true;

    var payload = buildSubmitPayload();

    // ✅ FIX #2: Show toast and schedule auto-close immediately
    showToast("Thank you for your valuable feedback!");
    scheduleAutoClose(2500); // Auto-exit after 2.5s

    function onDone(err) {
      submitting = false;

      if (err) {
        // ✅ FIX #2: Cancel auto-close on error
        if (closeTimer) { 
          clearTimeout(closeTimer); 
          closeTimer = null; 
        }
        showToast("Failed to submit. Please try again.");
        render();
        return;
      }
      // Success: allow scheduled close to happen
    }

    if (isFn(w.submitSurvey)) {
      try {
        w.submitSurvey(payload, function (err) { onDone(err); });
      } catch (e) { onDone(e); }
      return;
    }

    if (w.TenxApi && isFn(w.TenxApi.submitSurvey)) {
      try {
        w.TenxApi.submitSurvey(payload, function (err) { onDone(err); });
      } catch (e2) { onDone(e2); }
      return;
    }

    // No API: just close as scheduled
    submitting = false;
    try { console.log("[Feedback] submit payload:", payload); } catch(e3){}
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
      // ✅ FIX #2: Clear any pending timers
      if (closeTimer) {
        clearTimeout(closeTimer);
        closeTimer = null;
      }

      active = false;
      routeObj = survey = null;
      questions = [];
      answersMap = {};
      qIndex = cursorIndex = 0;
      submitting = false;

      if (viewEl) {
        viewEl.style.display = "none";
        viewEl.className = "";
      }

      if (isFn(w.goHome)) w.goHome();
      else if (isFn(w.showView)) w.showView("home");
    },

    isActive: function () { return active; },

    handleKeyDown: function (e) {
      if (!active) return false;

      var k = e.keyCode || e.which;

      // ✅ FIX #2: Back keys - try previous question first, then close
      if ([8, 27, 461, 10009, 4].indexOf(k) !== -1 || k === 403 || k === 85) {
        if (e.preventDefault) e.preventDefault();
        
        // Try to go to previous question
        if (previousQuestion()) {
          return true; // successfully went back
        }
        
        // ✅ FIX #2: At first question, close to home
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