// js/app/roomservice.js — Room Service page module (ES5 / Tizen 4 safe)
// UI ONLY: no XHR, no sessionStorage parsing. Uses TenxApi for everything.
(function (w) {
  "use strict";
  if (w.RoomServicePage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, submenuEl, detailEl, detailTitleEl;

  // ---------- STATE ----------
  var active = false;
  var focusArea = "submenu"; // "submenu" | "form"
  var focusSubmenuIndex = 0;

  var pageData = null;
  var services = [];
  var currentService = null;
  var currentFormType = null; // "form_booking" | "form_taxi" | "form_report_request"

  // Form state
  var formData = {
    lastName: "",
    roomNumber: "",
    date: "now",
    hour: "02",
    minute: "20",
    ampm: "PM",
    message: "",
    selectedTaxi: null,
    selectedProblem: null,
    selectedProblemName: ""
  };

  var focusFormIndex = 0;
  var formElements = [];
  var formIndexMap = { dates: [], hour: -1, minute: -1, ampm: -1, submit: -1 };

  // ---------- HELPERS ----------
  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = txt == null ? "" : String(txt); }

  function escapeHtml(s) {
    s = s == null ? "" : String(s);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function rewriteAssetUrl(url) {
    if (w.TenxApi && typeof w.TenxApi.rewriteAssetUrl === "function") {
      return w.TenxApi.rewriteAssetUrl(url);
    }
    // fallback (shouldn’t happen if api.js is loaded)
    return String(url || "");
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-roomservice");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".rs-bg");
    pageTitleEl = qs("rs-page-title");
    submenuEl = qs("rs-submenu");
    detailEl = qs("rs-detail");
    detailTitleEl = qs("rs-detail-title");
  }

  // ---------- DATA MAPPING ----------
  function parseServiceAttr(attrStr) {
    try { return JSON.parse(attrStr); } catch (e) { return null; }
  }

  function normalizeService(s) {
    var attr = parseServiceAttr(s.service_attr);
    if (!attr) return null;

    return {
      id: s.service_id,
      name: s.service_name,
      key: s.service_key,
      icon: rewriteAssetUrl(s.service_icon),
      topicPid: attr.topic_pid,
      formName: attr.form_name,
      formInputs: attr.form_inputs || [],
      protocol: s.service_protocol
    };
  }

  // ---------- RENDER ----------
  function renderSubmenu() {
    if (!submenuEl) return;

    var html = "";
    var i, svc;

    for (i = 0; i < services.length; i++) {
      svc = services[i];
      html += '<div class="rs-submenu-item" data-index="' + i + '">' +
        escapeHtml(svc.name) + "</div>";
    }

    submenuEl.innerHTML = html;
    applySubmenuFocus();
  }

  function applySubmenuFocus() {
    if (!submenuEl) return;

    var kids = submenuEl.children;
    var i;
    for (i = 0; i < kids.length; i++) {
      var on = (i === focusSubmenuIndex && focusArea === "submenu");
      kids[i].className = "rs-submenu-item" + (on ? " is-focused" : "");
    }

    var mainEl = qs("rs-main");
    if (mainEl) mainEl.className = "rs-main focus-" + focusArea;
  }

  function renderDetail() {
    if (!services.length || !detailEl) return;

    currentService = services[focusSubmenuIndex];
    if (!currentService) return;

    safeText(detailTitleEl, currentService.name);
    currentFormType = currentService.formName;

    if (String(currentFormType || "").indexOf("booking") >= 0) {
      renderBookingForm(currentService);
    } else if (String(currentFormType || "").indexOf("taxi") >= 0) {
      renderTaxiForm(currentService);
    } else if (String(currentFormType || "").indexOf("report") >= 0) {
      renderReportForm(currentService);
    } else {
      detailEl.innerHTML =
        '<div class="rs-detail-title">' + escapeHtml(currentService.name) +
        '</div><p style="color:rgba(255,255,255,0.7);font-size:22px;">Form not available</p>';
    }

    focusFormIndex = 0;
    applyFormFocus();
  }

  function renderBookingForm(svc) {
    var html = "";
    html += '<div class="rs-detail-title">' + escapeHtml(svc.name) + "</div>";
    html += '<div class="rs-form-booking">';

    html += '<div class="rs-form-row">';
    html += '<div class="rs-form-label">Room Number:</div>';
    html += '<input type="text" class="rs-form-input" id="rs-room-number" value="' +
      escapeHtml(formData.roomNumber) + '" readonly />';
    html += "</div>";

    html += '<div class="rs-form-row">';
    html += '<div class="rs-form-label">Preferred Date Slot:</div>';
    html += '<div class="rs-radio-dates">';

    var dateOptions = [
      { title: "Now", key: "now" },
      { title: "Today", key: "today" },
      { title: "Tomorrow", key: "tomorrow" }
    ];

    var j;
    for (j = 0; j < dateOptions.length; j++) {
      var opt = dateOptions[j];
      var sel = (opt.key === formData.date) ? " is-selected" : "";
      html += '<div class="rs-radio-btn rs-focusable' + sel + '" data-date="' +
        opt.key + '">' + escapeHtml(opt.title) + "</div>";
    }

    html += "</div>";
    html += "</div>";

    html += '<div class="rs-form-row">';
    html += '<div class="rs-form-label">Preferred Time Slot:</div>';
    html += '<div class="rs-time-group">';
    html += '<input type="text" class="rs-time-input rs-focusable" id="rs-hour" maxlength="2" value="' +
      escapeHtml(formData.hour) + '" />';
    html += '<span class="rs-time-sep">:</span>';
    html += '<input type="text" class="rs-time-input rs-focusable" id="rs-minute" maxlength="2" value="' +
      escapeHtml(formData.minute) + '" />';
    html += '<input type="text" class="rs-time-ampm rs-focusable" id="rs-ampm" maxlength="2" value="' +
      escapeHtml(formData.ampm) + '" />';
    html += "</div>";
    html += '<div class="rs-time-hint">Enter: Hour : Minutes → AM/PM</div>';
    html += "</div>";

    html += '<button class="rs-submit-btn rs-focusable" id="rs-submit">Book Service</button>';
    html += "</div>";

    detailEl.innerHTML = html;
    buildFormElements();
  }

  function renderTaxiForm(svc) {
    var inputs = svc.formInputs || [];
    var taxiInput = null;
    var i;

    for (i = 0; i < inputs.length; i++) {
      if (inputs[i].input_type === "radio_icons") { taxiInput = inputs[i]; break; }
    }

    var html = "";
    html += '<div class="rs-detail-title">' + escapeHtml(svc.name) + "</div>";
    html += '<div class="rs-form-taxi">';

    html += '<div class="rs-form-row">';
    html += '<div class="rs-form-label">Room Number:</div>';
    html += '<input type="text" class="rs-form-input" id="rs-room-number" value="' +
      escapeHtml(formData.roomNumber) + '" readonly />';
    html += "</div>";

    html += '<div class="rs-form-row">';
    html += '<div class="rs-form-label">Preferred Time Slot:</div>';
    html += '<div class="rs-time-group">';
    html += '<input type="text" class="rs-time-input rs-focusable" id="rs-hour" maxlength="2" value="' +
      escapeHtml(formData.hour) + '" />';
    html += '<span class="rs-time-sep">:</span>';
    html += '<input type="text" class="rs-time-input rs-focusable" id="rs-minute" maxlength="2" value="' +
      escapeHtml(formData.minute) + '" />';
    html += '<input type="text" class="rs-time-ampm rs-focusable" id="rs-ampm" maxlength="2" value="' +
      escapeHtml(formData.ampm) + '" />';
    html += "</div>";
    html += '<div class="rs-time-hint">Enter: Hour : Minutes → AM/PM</div>';
    html += "</div>";

    html += '<div class="rs-form-row">';
    html += '<div class="rs-form-label">Transportation mode:</div>';
    html += '<div class="rs-taxi-icons">';

    if (taxiInput && taxiInput.values) {
      var j, opt;
      for (j = 0; j < taxiInput.values.length; j++) {
        opt = taxiInput.values[j];
        html += '<div class="rs-taxi-icon-btn rs-focusable" data-taxi="' + escapeHtml(opt.key) + '">';
        html += '<img class="rs-taxi-icon" src="' + rewriteAssetUrl(opt.icon) + '" alt="' + escapeHtml(opt.key) + '" />';
        html += '<div class="rs-taxi-label">' + escapeHtml(opt.key) + "</div>";
        html += "</div>";
      }
    }

    html += "</div>";
    html += "</div>";

    html += '<button class="rs-submit-btn rs-focusable" id="rs-submit">Book Service</button>';
    html += "</div>";

    detailEl.innerHTML = html;
    buildFormElements();
  }

  function renderReportForm(svc) {
    var inputs = svc.formInputs || [];
    var topicsInput = null;
    var i;

    for (i = 0; i < inputs.length; i++) {
      if (inputs[i].input_type === "radio_topics") { topicsInput = inputs[i]; break; }
    }

    var html = "";
    html += '<div class="rs-detail-title">' + escapeHtml(svc.name) + "</div>";
    html += '<div class="rs-form-report">';

    html += '<div class="rs-form-row">';
    html += '<div class="rs-form-label">Room Number:</div>';
    html += '<input type="text" class="rs-form-input" id="rs-room-number" value="' +
      escapeHtml(formData.roomNumber) + '" readonly />';
    html += "</div>";

    html += '<div class="rs-form-row">';
    html += '<div class="rs-form-label">Choose Problem:</div>';
    html += '<div class="rs-problem-grid">';

    if (topicsInput && topicsInput.values) {
      var j, topic;
      for (j = 0; j < topicsInput.values.length; j++) {
        topic = topicsInput.values[j];
        var isSel = (String(formData.selectedProblem) === String(topic.topic_id)) ? " is-selected" : "";
        html += '<div class="rs-problem-btn rs-focusable' + isSel + '"' +
          ' data-topic-id="' + topic.topic_id + '"' +
          ' data-topic-name="' + escapeHtml(topic.topic_name) + '">' +
          escapeHtml(topic.topic_name) + "</div>";
      }
    }

    html += "</div>";
    html += "</div>";

    html += '<button class="rs-submit-btn rs-focusable" id="rs-submit">Book Service</button>';
    html += "</div>";

    detailEl.innerHTML = html;
    buildFormElements();
  }

  function buildFormElements() {
    if (!detailEl) return;
    formElements = [];
    formIndexMap = { dates: [], hour: -1, minute: -1, ampm: -1, submit: -1 };

    var focusables = detailEl.querySelectorAll(".rs-focusable");
    var i;
    for (i = 0; i < focusables.length; i++) {
      var el = focusables[i];
      formElements.push(el);

      var cls = el.className || "";
      if (cls.indexOf("rs-radio-btn") >= 0) formIndexMap.dates.push(i);
      if (el.id === "rs-hour") formIndexMap.hour = i;
      if (el.id === "rs-minute") formIndexMap.minute = i;
      if (el.id === "rs-ampm") formIndexMap.ampm = i;
      if (el.id === "rs-submit") formIndexMap.submit = i;
    }
  }

  function applyFormFocus() {
    if (!formElements.length) return;

    var i;
    for (i = 0; i < formElements.length; i++) {
      var el = formElements[i];
      var on = (i === focusFormIndex && focusArea === "form");
      var cls = (el.className || "").replace(/\bis-focused\b/g, "").replace(/\s+/g, " ");
      if (on) cls += " is-focused";
      el.className = cls;
    }
  }

  // ---------- NAVIGATION ----------
  function moveSubmenu(delta) {
    if (!services.length) return;

    var newIndex = clamp(focusSubmenuIndex + delta, 0, services.length - 1);
    if (newIndex === focusSubmenuIndex) return;

    focusSubmenuIndex = newIndex;
    applySubmenuFocus();
    renderDetail();
  }

  function moveForm(delta) {
    if (!formElements.length) return;

    var newIndex = clamp(focusFormIndex + delta, 0, formElements.length - 1);
    if (newIndex === focusFormIndex) return;

    focusFormIndex = newIndex;
    applyFormFocus();
  }

  function onFormOK() {
    if (!formElements.length || focusFormIndex < 0) return;

    var el = formElements[focusFormIndex];
    if (!el) return;

    if ((el.className || "").indexOf("rs-radio-btn") >= 0) {
      formData.date = el.getAttribute("data-date") || "now";
      var allDateBtns = detailEl.querySelectorAll(".rs-radio-btn");
      var i;
      for (i = 0; i < allDateBtns.length; i++) {
        allDateBtns[i].className = allDateBtns[i].className.replace(/\bis-selected\b/g, "");
      }
      el.className += " is-selected";
      return;
    }

    if ((el.className || "").indexOf("rs-taxi-icon-btn") >= 0) {
      formData.selectedTaxi = el.getAttribute("data-taxi");
      var allTaxi = detailEl.querySelectorAll(".rs-taxi-icon-btn");
      var t;
      for (t = 0; t < allTaxi.length; t++) {
        allTaxi[t].className = allTaxi[t].className.replace(/\bis-selected\b/g, "");
      }
      el.className += " is-selected";
      return;
    }

    if ((el.className || "").indexOf("rs-problem-btn") >= 0) {
      formData.selectedProblem = el.getAttribute("data-topic-id") || "";
      formData.selectedProblemName = el.getAttribute("data-topic-name") || "";
      var allProb = detailEl.querySelectorAll(".rs-problem-btn");
      var p;
      for (p = 0; p < allProb.length; p++) {
        allProb[p].className = allProb[p].className.replace(/\bis-selected\b/g, "");
      }
      el.className += " is-selected";
      return;
    }

    if (el.id === "rs-submit") {
      submitForm();
      return;
    }
  }

  function prettyServiceKey(k) {
    k = String(k || "");
    return k.replace(/_/g, " ").trim();
  }

  function getTopicNameById(topicId) {
    topicId = String(topicId || "");
    if (!currentService || !currentService.formInputs) return "";
    var inputs = currentService.formInputs, i, vals, j;
    for (i = 0; i < inputs.length; i++) {
      if (inputs[i].input_type === "radio_topics" && inputs[i].values) {
        vals = inputs[i].values;
        for (j = 0; j < vals.length; j++) {
          if (String(vals[j].topic_id) === topicId) return String(vals[j].topic_name || "");
        }
      }
    }
    return "";
  }

  function submitForm() {
    if (!currentService) return;
    if (!w.TenxApi || typeof w.TenxApi.createTicket !== "function") {
      alert("TenxApi.createTicket not found. Check api.js is loaded before roomservice.js");
      return;
    }

    // Room number shown in UI (string)
    var roomNo = String(formData.roomNumber || (w.ROOM_NO || "") || "101");

    var serviceKey = String(currentService.key || "");
    var serviceLabel = prettyServiceKey(serviceKey) || String(currentService.name || "service");

    var topicId = "";
    var topicName = "";

    if (String(currentFormType || "").indexOf("report") >= 0) {
      topicId = String(formData.selectedProblem || "");
      topicName = String(formData.selectedProblemName || getTopicNameById(topicId) || "");
      if (!topicId) { alert("Please choose a problem first."); return; }
    } else {
      topicId = String(currentService.topicPid || "");
    }

    var timeText = String(formData.hour || "00") + ":" + String(formData.minute || "00") + " " + String(formData.ampm || "AM");
    var dateKey = String(formData.date || "");
    var dateLabel = (dateKey === "today") ? "Today" : (dateKey === "tomorrow") ? "Tomorrow" : "Now";

    var ticketName = serviceLabel;
    if (topicName) ticketName += " - " + topicName;

    var desc = "Kindly attend  " + ticketName + "<br/><br/>";

    if (String(currentFormType || "").indexOf("report") >= 0) {
      if (topicName) desc += topicName + "<br/>";
      if (formData.message) desc += escapeHtml(formData.message) + "<br/>";
      desc += "Thanks!";
    } else if (String(currentFormType || "").indexOf("booking") >= 0) {
      desc += "Preferred Date: " + escapeHtml(dateLabel) + "<br/>";
      desc += "Preferred Time: " + escapeHtml(timeText) + "<br/>";
      if (formData.message) desc += "Message: " + escapeHtml(formData.message) + "<br/>";
      desc += "Thanks!";
    } else if (String(currentFormType || "").indexOf("taxi") >= 0) {
      if (formData.selectedTaxi) desc += "Taxi Type: " + escapeHtml(formData.selectedTaxi) + "<br/>";
      desc += "Preferred Time: " + escapeHtml(timeText) + "<br/>";
      if (formData.message) desc += "Destination/Note: " + escapeHtml(formData.message) + "<br/>";
      desc += "Thanks!";
    } else {
      if (formData.message) desc += escapeHtml(formData.message) + "<br/>";
      desc += "Thanks!";
    }

    w.TenxApi.createTicket({
      room_number: roomNo,
      service_key: serviceKey,
      topic_id: topicId,
      ticket_name: ticketName,
      description: desc
    }).then(function (res) {
      alert("✅ Ticket created!\n\n" + JSON.stringify(res || {}, null, 2));
    }, function (err) {
      alert("❌ Ticket failed\n\n" + JSON.stringify(err || {}, null, 2));
    });
  }

  // ------------------ TIME INPUT HELPERS ------------------
  function isDigitKey(k) { return (k >= 48 && k <= 57) || (k >= 96 && k <= 105); }
  function digitFromKey(k) { if (k >= 48 && k <= 57) return String(k - 48); if (k >= 96 && k <= 105) return String(k - 96); return ""; }
  function pad2(n) { n = String(n || ""); if (n.length === 0) return "00"; if (n.length === 1) return "0" + n; return n.slice(-2); }
  function clampInt(n, a, b) { n = parseInt(n, 10); if (isNaN(n)) n = a; return Math.max(a, Math.min(b, n)); }

  function pushTimeDigit(field, digit) {
    var bufKey = (field === "hour") ? "__hourBuf" : "__minBuf";
    var buf = formData[bufKey] || "";
    buf = (buf + digit).slice(-2);
    formData[bufKey] = buf;

    if (field === "hour") {
      var h = clampInt(buf, 1, 12);
      formData.hour = pad2(h);
      var elH = qs("rs-hour"); if (elH) elH.value = formData.hour;
    } else {
      var m = clampInt(buf, 0, 59);
      formData.minute = pad2(m);
      var elM = qs("rs-minute"); if (elM) elM.value = formData.minute;
    }
  }

  function toggleAmPm() {
    formData.ampm = (String(formData.ampm).toUpperCase() === "AM") ? "PM" : "AM";
    var elA = qs("rs-ampm"); if (elA) elA.value = formData.ampm;
  }

  // ---------- OPEN/CLOSE ----------
  function open(route) {
    ensureDom();
    if (!viewEl) return;

    pageData = route || null;
    active = true;
    focusArea = "submenu";
    focusSubmenuIndex = 0;
    focusFormIndex = 0;

    var title = "Room Service";
    if (route && route.route_name) title = route.route_name;
    safeText(pageTitleEl, title);

    if (bgEl && route && route.route_bg) {
      var bg = String(route.route_bg || "");
      if (bg) {
        bgEl.style.backgroundImage = "url('" + rewriteAssetUrl(bg) + "')";
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundPosition = "center";
      }
    }

    services = [];
    if (route && route.layout_data && route.layout_data.length) {
      var i;
      for (i = 0; i < route.layout_data.length; i++) {
        var svc = normalizeService(route.layout_data[i]);
        if (svc) services.push(svc);
      }
    }

    try { if (w.ROOM_NO) formData.roomNumber = w.ROOM_NO; } catch (e) {}
    if (!formData.roomNumber) formData.roomNumber = "101";

    renderSubmenu();
    renderDetail();

    viewEl.className = "tx-view is-active";
  }

  function close() {
    if (!viewEl) return;

    active = false;
    viewEl.className = "tx-view";
    services = [];
    currentService = null;
    focusSubmenuIndex = 0;
    focusFormIndex = 0;
    formElements = [];
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;
    var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, OK = 13;
    var BACK1 = 8, BACK2 = 461, BACK3 = 10009, BACK4 = 27;

    // LEFT from form -> submenu
    if (k === LEFT && focusArea === "form") {
      if (focusFormIndex > 0) moveForm(-1);
      else {
        focusArea = "submenu";
        applySubmenuFocus();
        applyFormFocus();
      }
      return true;
    }

    // RIGHT from submenu -> form
    if (k === RIGHT && focusArea === "submenu") {
      if (services.length) {
        focusArea = "form";
        focusFormIndex = 0;
        applySubmenuFocus();
        applyFormFocus();
        return true;
      }
    }

    if (focusArea === "submenu") {
      if (k === UP) { moveSubmenu(-1); return true; }
      if (k === DOWN) { moveSubmenu(1); return true; }
      if (k === OK) {
        focusArea = "form";
        focusFormIndex = 0;
        applySubmenuFocus();
        applyFormFocus();
        return true;
      }
    } else if (focusArea === "form") {
      // number entry
      if (formElements.length) {
        var cur = formElements[focusFormIndex];
        if (cur) {
          var id = cur.id || "";
          if ((id === "rs-hour" || id === "rs-minute") && isDigitKey(k)) {
            pushTimeDigit(id === "rs-hour" ? "hour" : "minute", digitFromKey(k));
            return true;
          }
          if (id === "rs-ampm" && k === OK) { toggleAmPm(); return true; }
        }
      }

      // smart jump for booking
      var curEl = formElements[focusFormIndex];
      var curCls = curEl ? (curEl.className || "") : "";
      var isDateBtn = curCls.indexOf("rs-radio-btn") >= 0;
      var isTimeField = curEl && (curEl.id === "rs-hour" || curEl.id === "rs-minute" || curEl.id === "rs-ampm");

      if (String(currentFormType || "").indexOf("booking") >= 0) {
        if (k === DOWN && isDateBtn && formIndexMap.hour >= 0) {
          focusFormIndex = formIndexMap.hour; applyFormFocus(); return true;
        }
        if (k === UP && isTimeField && formIndexMap.dates.length) {
          var selIdx = formIndexMap.dates[0], i;
          for (i = 0; i < formIndexMap.dates.length; i++) {
            var idx = formIndexMap.dates[i];
            var dEl = formElements[idx];
            if (dEl && (dEl.className || "").indexOf("is-selected") >= 0) { selIdx = idx; break; }
          }
          focusFormIndex = selIdx; applyFormFocus(); return true;
        }
      }

      if (k === UP) { moveForm(-1); return true; }
      if (k === DOWN) { moveForm(1); return true; }
      if (k === RIGHT) { moveForm(1); return true; }
      if (k === OK) { onFormOK(); return true; }
    }

    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      return false; // home.js handles back
    }

    return false;
  }

  // ---------- EXPORT ----------
  w.RoomServicePage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; }
  };

})(window);
