// js/app/tvchannels.js  (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.TVChannels) return;

  var viewEl, gridEl, gridViewportEl, countEl, titleEl, nameEl, videoEl, osdEl;
  var appJson = null;

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

  /* ---------------- URL helpers (fixes your 400 logo requests) ---------------- */

  function apiOrigin() {
    try {
      if (w.TenxApi && w.TenxApi.HOST) return String(w.TenxApi.HOST).replace(/\/+$/, "");
    } catch (e) {}
    try { return String(w.location.origin || "").replace(/\/+$/, ""); } catch (e2) {}
    return "";
  }

  function rewriteAssetUrl(url) {
    url = String(url || "");
    if (!url) return url;
    if (url.indexOf("/admin-portal/assets/") < 0) return url;

    var origin = apiOrigin();
    if (!origin) return url;

    return url.replace(/^https?:\/\/[^\/]+/i, origin);
  }

  function sanitizeUrl(u) {
    u = String(u || "");
    if (!u) return "";

    // remove control chars that can cause 400 in some servers
    u = u.replace(/[\u0000-\u001F\u007F]/g, "").replace(/^\s+|\s+$/g, "");

    // decode common html entity seen in attributes
    u = u.replace(/&amp;/g, "&");

    // make absolute if relative
    var origin = apiOrigin();
    if (/^\/\//.test(u)) {
      // protocol-relative
      try { u = (w.location.protocol || "http:") + u; } catch (e1) {}
    } else if (!/^https?:\/\//i.test(u)) {
      if (u.charAt(0) === "/") u = origin + u;
      else u = origin + "/" + u;
    }

    // rewrite admin-portal host to TenxApi.HOST when needed
    u = rewriteAssetUrl(u);

    // encode spaces / arabic / etc (prevents malformed request => 400)
    try { u = encodeURI(u); } catch (e2) {}

    return u;
  }

  /* ---------------- Parse from html_output ---------------- */

  function parseChannelsFromHtml(html) {
    html = String(html || "");
    if (!html) return [];

    // DOMParser is supported on modern TV web engines; if it fails we just return []
    var parsed = [];
    try {
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, "text/html");
      var channelList = doc.querySelector("#channel_list_widget ul");
      if (!channelList) return [];

      var lis = channelList.querySelectorAll("li.subnav_item");
      var i, li, img, logo;

      for (i = 0; i < lis.length; i++) {
        li = lis[i];
        img = li.querySelector("img");

        logo = "";
        if (img) {
          logo = img.getAttribute("data-src") || img.getAttribute("src") || "";
        }

        parsed.push({
          id: li.getAttribute("data-id") || "",
          name: li.getAttribute("data-name") || "",
          number: li.getAttribute("data-channel-number") || "",
          url: li.getAttribute("data-channel-url") || "",
          type: li.getAttribute("data-channel-type") || "",
          logo: sanitizeUrl(logo)
        });
      }
    } catch (e) {
      return [];
    }

    return parsed;
  }

  function extractKeyTvHtml(fullHtml) {
    fullHtml = String(fullHtml || "");
    if (!fullHtml) return "";

    // safer than innerHTML of huge wrapper: just search for KEY_TV node by string
    var needle = 'id="KEY_TV"';
    var at = fullHtml.indexOf(needle);
    if (at < 0) return "";

    var open = fullHtml.lastIndexOf("<div", at);
    if (open < 0) open = at;

    var next = fullHtml.indexOf('<div dir="ltr" id="KEY_', at + needle.length);
    if (next < 0) next = fullHtml.length;

    return fullHtml.slice(open, next);
  }

  function fetchChannels() {
    if (!appJson || !appJson.html_output) {
      channels = [];
      renderGrid();
      updateFocusUI(null);
      return;
    }

    var keyTvHtml = extractKeyTvHtml(appJson.html_output);
    channels = parseChannelsFromHtml(keyTvHtml);

   renderGrid();

if (!channels.length) {
  focusIndex = 0;
  updateFocusUI(null);
  return;
}

// keep current focusIndex if possible
focusIndex = clamp(focusIndex, 0, channels.length - 1);
updateFocusUI(null);
setPreviewChannel(focusIndex);

  }

  /* ---------------- UI ---------------- */

  function renderGrid() {
    if (!gridEl) return;

    var html = "";
    var i, c, logo;

    for (i = 0; i < channels.length; i++) {
      c = channels[i];
      logo = c.logo ? String(c.logo) : "";

      html += '<div class="tv-tile" data-i="' + i + '">';
      html +=   '<div class="tv-tile__logoBox">';

      if (logo) {
        html += '<img class="tv-tile__logo" alt="" src="' + logo + '">';
      } else {
        html += '<div style="font-size:34px;font-weight:900;color:#111;opacity:.8;">' + escapeHtml(c.name) + '</div>';
      }

      html +=   "</div>";
      html +=   '<div class="tv-tile__name">' + escapeHtml(c.name) + "</div>";
      html += "</div>";
    }

    gridEl.innerHTML = html;

    // click support (no inline onclick)
    gridEl.onclick = function (ev) {
      ev = ev || w.event;
      var t = ev.target || ev.srcElement;
      while (t && t !== gridEl) {
        if (t.getAttribute && t.getAttribute("data-i") != null) {
          var idx = parseInt(t.getAttribute("data-i"), 10);
          if (!isNaN(idx)) {
            focusIndex = idx;
            updateFocusUI(null);
            setPreviewChannel(idx);
            enterFullscreen();

          }
          return;
        }
        t = t.parentNode;
      }
    };
  }

  function setPreviewChannel(i) {
    if (!channels.length) return;
    i = clamp(i, 0, channels.length - 1);

    focusIndex = i;
    current = channels[i];

    safeText(nameEl, current ? current.name : "");

    if (videoEl && current && current.url) {
      try { videoEl.pause(); } catch (e1) {}
      try {
        videoEl.src = String(current.url);
        videoEl.load();
        videoEl.play();
      } catch (e2) {}
    }

    showOSD(4500);
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

  function keepFocusedInView() {
    if (!gridViewportEl || !gridEl) return;

    var tileH = 170 + 28; // tile height + gap
    var rowsVisible = 3;
    var row = Math.floor(focusIndex / cols);

    var minRow = Math.floor(scrollY / tileH);
    var maxRow = minRow + (rowsVisible - 1);

    if (row < minRow) scrollY = row * tileH;
    else if (row > maxRow) scrollY = (row - (rowsVisible - 1)) * tileH;

    if (scrollY < 0) scrollY = 0;
    gridEl.style.transform = "translateY(" + (-scrollY) + "px)";
  }

  function updateFocusUI(prev) {
    var tiles = gridEl ? gridEl.getElementsByClassName("tv-tile") : null;
    if (!tiles || !tiles.length) return;

    if (prev != null && tiles[prev]) tiles[prev].className = "tv-tile";
    if (tiles[focusIndex]) tiles[focusIndex].className = "tv-tile is-focused";

    safeText(countEl, (focusIndex + 1) + " of " + channels.length);

    keepFocusedInView();
  }

  function isBackKey(k) {
    return (k === 8 || k === 27 || k === 461 || k === 10009);
  }

  function isCssFullscreen() {
    if (!viewEl) return false;
    return ((" " + (viewEl.className || "") + " ").indexOf(" is-fullscreen ") >= 0);
  }

  function enterFullscreen() {
    if (!viewEl) return;
    if (!isCssFullscreen()) viewEl.className = "tx-view is-active is-fullscreen";
  }

  function exitFullscreen() {
    if (!viewEl) return;
    if (isCssFullscreen()) viewEl.className = "tx-view is-active";
  }

  function move(dx, dy) {
    var prev = focusIndex;
    var x = (focusIndex % cols);
    var y = Math.floor(focusIndex / cols);

    x += dx;
    y += dy;

    x = clamp(x, 0, cols - 1);

    var idx = clamp(y * cols + x, 0, channels.length - 1);

    focusIndex = idx;
    updateFocusUI(prev);
    setPreviewChannel(focusIndex);
  }

  function handleKeyDown(e) {
    var k = (e && (e.keyCode || e.which)) || 0;

    // In fullscreen: BACK exits fullscreen first
    if (isBackKey(k) && isCssFullscreen()) {
      exitFullscreen();
      return true;
    }

    if (k === 37) { move(-1, 0); return true; }  // Left
    if (k === 39) { move(1, 0); return true; }   // Right
    if (k === 38) { move(0, -1); return true; }  // Up
    if (k === 40) { move(0, 1); return true; }   // Down

    if (k === 13) { enterFullscreen(); return true; } // OK => fullscreen watch
    if (isBackKey(k)) return false; // let home.js do page back
    return false;
  }

  /* ---------------- Public API ---------------- */

  var TVChannels = {
    mount: function (opts) {
      opts = opts || {};

      viewEl = qs("view-tv");
      gridEl = qs("tv-grid");
      gridViewportEl = qs("tv-grid-viewport");
      countEl = qs("tv-count");
      titleEl = qs("tv-title");
      nameEl = qs("tv-now-name");
      videoEl = qs("tv-preview");
      osdEl = qs("tv-osd");

      appJson = opts.appJson || null;

      active = true;

      // reset view state
      if (viewEl) viewEl.className = "tx-view is-active";
        scrollY = 0;

        // keep previous focus if we already had one
        if (channels && channels.length) {
          focusIndex = clamp(focusIndex, 0, channels.length - 1);
        } else {
          focusIndex = 0;
        }

        fetchChannels();

    },

    unmount: function () {
      active = false;

      if (osdTimer) { try { clearTimeout(osdTimer); } catch (e) {} osdTimer = null; }

      if (videoEl) {
        try { videoEl.pause(); } catch (e1) {}
        try { videoEl.removeAttribute("src"); videoEl.load(); } catch (e2) {}
      }

      if (viewEl) viewEl.className = "tx-view";
    },

    handleKeyDown: handleKeyDown,
    isActive: function () { return !!active; }
  };

  w.TVChannels = TVChannels;
})(window);
