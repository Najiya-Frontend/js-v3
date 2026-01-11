// js/app/prayer.js — Prayer Time page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.PrayerPage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, gridEl;

  // ---------- STATE ----------
  var active = false;
  var focusIndex = 0;

  var pageData = null;
  var prayers = []; // [{name, time, imagePath}]

  // Prayer order and background images
  var PRAYER_ORDER = [
  { key: "fajr",     label: "FAJR",     image: "assets/prayer/fajr.png" },
  { key: "shurooq",  label: "SHUROOQ",  image: "assets/prayer/shurooq.png" },
  { key: "dhuhr",    label: "DHUHR",    image: "assets/prayer/dhuhr.png" },
  { key: "asr",      label: "ASR",      image: "assets/prayer/asr.png" },
  { key: "maghrib",  label: "MAGHRIB",  image: "assets/prayer/maghrib.png" },
  { key: "isha",     label: "ISHA",     image: "assets/prayer/isha.png" }
];


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
    return String(url || "");
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-prayer");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".pr-bg");
    pageTitleEl = qs("pr-page-title");
    gridEl = qs("pr-grid");
  }

  // ---------- DATA MAPPING ----------
  function normalizePrayerData(route) {
    var data = (route && route.layout_data) || {};
    var out = [];
    var i, p, key, time;

    for (i = 0; i < PRAYER_ORDER.length; i++) {
      p = PRAYER_ORDER[i];
      key = p.key;
      time = data[key] || "—";

      out.push({
        name: p.label,
        time: String(time),
        imagePath: p.image
      });
    }

    return out;
  }

  // ---------- RENDER ----------
  function renderGrid() {
    if (!gridEl) return;

    var html = "";
    var i, prayer;

    for (i = 0; i < prayers.length; i++) {
      prayer = prayers[i];

      html += '<div class="pr-card" data-index="' + i + '">';
      html += '<div class="pr-card__bg" style="background-image: url(\'' + escapeHtml(prayer.imagePath) + '\');"></div>';
      html += '<div class="pr-card__overlay"></div>';
      html += '<div class="pr-card__content">';
      html += '<div class="pr-card__name">' + escapeHtml(prayer.name) + '</div>';
      html += '<div class="pr-card__divider"></div>';
      html += '<div class="pr-card__time">' + escapeHtml(prayer.time) + '</div>';
      html += '</div>';
      html += '</div>';
    }

    gridEl.innerHTML = html;
    applyFocus();
  }

  function applyFocus() {
    if (!gridEl) return;

    var cards = gridEl.querySelectorAll(".pr-card");
    var i;

    for (i = 0; i < cards.length; i++) {
      cards[i].className = "pr-card";
    }

    if (prayers.length) {
      focusIndex = clamp(focusIndex, 0, prayers.length - 1);
      var card = cards[focusIndex];
      if (card) card.className = "pr-card is-focused";
    }
  }

  // ---------- NAVIGATION ----------
  function moveLR(delta) {
    if (!prayers.length) return;

    var newIndex = focusIndex + delta;
    newIndex = clamp(newIndex, 0, prayers.length - 1);

    if (newIndex === focusIndex) return;

    focusIndex = newIndex;
    applyFocus();
  }

  function moveUD(delta) {
    if (!prayers.length) return;

    // Move by 3 (one row)
    var newIndex = focusIndex + (delta * 3);
    newIndex = clamp(newIndex, 0, prayers.length - 1);

    if (newIndex === focusIndex) return;

    focusIndex = newIndex;
    applyFocus();
  }

  // ---------- OPEN/CLOSE ----------
  function open(route) {
    ensureDom();
    if (!viewEl) return;

    pageData = route || null;
    active = true;
    focusIndex = 0;

    var title = "Prayer Time";
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

    prayers = normalizePrayerData(route);
    renderGrid();

    viewEl.className = "tx-view is-active";
  }

  function close() {
    if (!viewEl) return;

    active = false;
    viewEl.className = "tx-view";
    prayers = [];
    focusIndex = 0;
    pageData = null;
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;
    var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, OK = 13;
    var BACK1 = 8, BACK2 = 461, BACK3 = 10009, BACK4 = 27;

    if (k === LEFT) { moveLR(-1); return true; }
    if (k === RIGHT) { moveLR(1); return true; }
    if (k === UP) { moveUD(-1); return true; }
    if (k === DOWN) { moveUD(1); return true; }

    if (k === OK) {
      // No action on OK for now (just display)
      return true;
    }

    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      return false; // let home.js handle back
    }

    return false;
  }

  // ---------- EXPORT ----------
  w.PrayerPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; }
  };

})(window);