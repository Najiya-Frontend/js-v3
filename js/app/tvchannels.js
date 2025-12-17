(function (w) {
  "use strict";
  if (w.TVChannels) return;

  var viewEl, gridEl, gridViewportEl, countEl, titleEl, nameEl, videoEl, osdEl, appJson;
  var active = false;
  var cols = 4;
  var focusIndex = 0;
  var channels = [];
  var current = null;
  var scrollY = 0;
  var osdTimer = null;

  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (!el) return; el.textContent = (txt == null) ? "" : String(txt); }

  function escapeHtml(s) {
    s = (s == null) ? "" : String(s);
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  // ---- Fetch TV Channels from the API ----
  function fetchChannels() {
    // Assuming channels are passed from the `appJson` data
    channels = appJson ? appJson.channels || [] : []; // Get channels from the API response
    renderGrid();
    updateFocusUI(null);
    setPreviewChannel(0);
  }

  // ---- Render Grid ----
  function renderGrid() {
    if (!gridEl) return;
    var html = "";
    var i, c, logo;
    for (i = 0; i < channels.length; i++) {
      c = channels[i];
      logo = c.logo ? String(c.logo) : "";

      html += '<div class="tv-tile" data-i="' + i + '" onclick="setPreviewChannel(' + i + ')">';
      html +=   '<div class="tv-tile__logoBox">';
      if (logo) {
        html +=     '<img class="tv-tile__logo" alt="" src="' + logo + '">';
      } else {
        html +=     '<div style="font-size:34px;font-weight:900;color:#111;opacity:.8;">' + escapeHtml(c.name) + "</div>";
      }
      html +=   "</div>";
      html +=   '<div class="tv-tile__name">' + escapeHtml(c.name) + "</div>";
      html += "</div>";
    }
    gridEl.innerHTML = html;
  }

  // ---- Set Preview Channel (right panel) ----
  function setPreviewChannel(i) {
    i = clamp(i, 0, channels.length - 1);
    focusIndex = i;

    var c = channels[i];
    current = c;

    safeText(nameEl, c ? c.name : "");

    // Try autoplay preview (TV browsers usually allow it)
    if (videoEl && c && c.url) {
      try {
        videoEl.pause();
      } catch (e1) {}

      try {
        videoEl.src = String(c.url);
        videoEl.load();
        var p = videoEl.play();
      } catch (e2) {}
    }

    showOSD(4500); // show a bit on selection too
  }

  function showOSD(ms) {
    if (!osdEl || !current) return;
    if (osdTimer) { try { clearTimeout(osdTimer); } catch (e) {} osdTimer = null; }

    osdEl.innerHTML = escapeHtml(String(current.number)) + " • " + escapeHtml(String(current.name));
    osdEl.className = "tv-osd is-on";

    osdTimer = setTimeout(function () {
      osdEl.className = "tv-osd";
    }, ms || 7000);
  }

  // ---- Move Navigation ----
  function move(dx, dy) {
    var prev = focusIndex;
    var x = (focusIndex % cols);
    var y = Math.floor(focusIndex / cols);
    x += dx;
    y += dy;

    x = clamp(x, 0, cols - 1);
    var idx = y * cols + x;

    idx = clamp(idx, 0, channels.length - 1);

    focusIndex = idx;
    updateFocusUI(prev);
    setPreviewChannel(focusIndex);
  }

  function updateFocusUI(prev) {
    var tiles = gridEl ? gridEl.getElementsByClassName("tv-tile") : null;
    if (!tiles || !tiles.length) return;

    if (prev != null && tiles[prev]) tiles[prev].className = "tv-tile";
    if (tiles[focusIndex]) tiles[focusIndex].className = "tv-tile is-focused";
    console.log("Focus updated:", focusIndex);  // Debug log focus update
    // “14 of 93”
    safeText(countEl, (focusIndex + 1) + " of " + channels.length);

    // Scroll to keep focused row visible
    keepFocusedInView();
  }
  function enterFullscreen() {
    var viewEl = document.getElementById("view-tv");
    if (viewEl && viewEl.requestFullscreen) {
        viewEl.requestFullscreen();
    }
}

  function keepFocusedInView() {
    if (!gridViewportEl || !gridEl) return;

    var tileH = 170 + 28; // tile height + row gap (approx)
    var rowsVisible = 3;  // screenshot-like
    var row = Math.floor(focusIndex / cols);

    var minRow = Math.floor(scrollY / tileH);
    var maxRow = minRow + (rowsVisible - 1);

    if (row < minRow) {
      scrollY = row * tileH;
    } else if (row > maxRow) {
      scrollY = (row - (rowsVisible - 1)) * tileH;
    }

    if (scrollY < 0) scrollY = 0;
    gridEl.style.transform = "translateY(" + (-scrollY) + "px)";
  }

  function handleKeyDown(e) {
    var k = e.keyCode || e.which;

    if (k === 37) { move(-1, 0); return true; }  // Left
    if (k === 39) { move(1, 0); return true; }   // Right
    if (k === 38) { move(0, -1); return true; }  // Up
    if (k === 40) { move(0, 1); return true; }   // Down

    if (k === 13) { enterFullscreen(); return true; } // Enter
    if (isBackKey(k)) return false; // let home.js handle back key
    return false;
  }

  // ---- Mount & Unmount ----
  var TVChannels = {
    mount: function (opts) {
      viewEl = qs("view-tv");
      gridEl = qs("tv-grid");
      gridViewportEl = qs("tv-grid-viewport");
      countEl = qs("tv-count");
      titleEl = qs("tv-title");
      nameEl = qs("tv-now-name");
      videoEl = qs("tv-preview");
      osdEl = qs("tv-osd");

      appJson = opts.appJson;  // Store appJson passed to mount
      fetchChannels();
      active = true;
    },

    unmount: function () {
      active = false;

      if (osdTimer) { clearTimeout(osdTimer); osdTimer = null; }

      if (videoEl) {
        try { videoEl.pause(); } catch (e1) {}
        try { videoEl.removeAttribute("src"); videoEl.load(); } catch (e2) {}
      }

      if (viewEl) viewEl.className = "tx-view";
    },

    handleKeyDown: handleKeyDown,
    isActive: function () { return !!active; },

    exitFullscreen: function () {
      if (active && isFullscreen()) exitFullscreen();
    }
  };

  w.TVChannels = TVChannels;
})(window);
