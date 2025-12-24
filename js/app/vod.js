// js/app/vod.js — VOD page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.VODPage) return;

  // ---------- DOM ----------
  var viewEl, bgVideoEl;
  var gridViewportEl, gridEl;

  var detailEl, detailPosterEl, detailCategoryEl, detailTitleEl, detailMetaEl;
  var detailCastEl, detailDirectorEl, detailDescEl, detailBtnEl;

  var playerEl, playerVideoEl;

  // ---------- STATE ----------
  var active = false;
  var mode = "grid"; // grid | detail | player

  // categories: [{ name, items:[], scrollX:0 }]
  var categories = [];
  var focusRow = 0;
  var focusCol = 0;

  // layout constants (match CSS)
  var CARD_W = 270;
  var CARD_H = 400;
  var GAP_X = 24;
  var ROW_GAP_Y = 34;
  var ROW_TITLE_H = 50; // approx
  var VISIBLE_COLS = 6;

  var scrollY = 0; // vertical scroll for rows

  var trailerTimer = null;
  var currentTrailer = "";

  // hide/show grid on detail mode
  var defaultGridDisplay = "";
  var defaultDetailDisplay = "";

  // ---------- HELPERS ----------
  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = (txt == null) ? "" : String(txt); }

  function escapeHtml(s) {
    s = (s == null) ? "" : String(s);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function apiOrigin() {
    try {
      if (w.TenxApi && w.TenxApi.HOST) return String(w.TenxApi.HOST).replace(/\/+$/, "");
    } catch (e) {}
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

  function money(v) {
    if (v == null || v === "") return "";
    var n = Number(v);
    if (isNaN(n)) return String(v);
    if (n <= 0) return "Free";
    var s = (Math.round(n * 100) / 100).toFixed(2);
    return "$" + s;
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-vod");
    bgVideoEl = qs("vod-bg-video");

    gridViewportEl = qs("vod-grid-viewport");
    gridEl = qs("vod-grid");

    detailEl = qs("vod-detail");
    detailPosterEl = qs("vod-detail-poster");
    detailCategoryEl = qs("vod-detail-category");
    detailTitleEl = qs("vod-detail-title");
    detailMetaEl = qs("vod-detail-meta");
    detailCastEl = qs("vod-detail-cast");
    detailDirectorEl = qs("vod-detail-director");
    detailDescEl = qs("vod-detail-desc");
    detailBtnEl = qs("vod-detail-btn");

    playerEl = qs("vod-player");
    playerVideoEl = qs("vod-player-video");

    if (gridViewportEl && defaultGridDisplay === "") defaultGridDisplay = gridViewportEl.style.display || "";
    if (detailEl && defaultDetailDisplay === "") defaultDetailDisplay = detailEl.style.display || "";

    // background trailer video defaults
    if (bgVideoEl) {
      bgVideoEl.muted = true;
      bgVideoEl.loop = true;
      bgVideoEl.autoplay = true;
      try { bgVideoEl.setAttribute("playsinline", ""); } catch (e1) {}
    }
    if (playerVideoEl) {
      try { playerVideoEl.setAttribute("playsinline", ""); } catch (e2) {}
    }
    // legend (overlays on top of grid)
    if (!w.__vodLegendEl) {
      try { w.__vodLegendEl = viewEl ? viewEl.querySelector(".vod-legend") : null; } catch (e) { w.__vodLegendEl = null; }
    }

  }

  function normalizeItem(x) {
    x = x || {};
    return {
      id: x.vod_id || x.id || "",
      title: x.title || "Untitled",
      category: x.category_name || x.category || "Other",
      thumbnail: rewriteAssetUrl(x.thumbnail_src || x.thumb || ""),
      poster: rewriteAssetUrl(x.poster_src || x.poster || x.thumbnail_src || ""),
      trailer: rewriteAssetUrl(x.trailer_src || x.trailer || ""),
      movie: rewriteAssetUrl(x.movie_src || x.movie || ""),
      cast: x.cast || "",
      director: x.director || "",
      languages: x.languages || "",
      rating: x.rating || "",
      price: x.price,
      description: x.description || ""
    };
  }

  function currentItem() {
    if (!categories.length) return null;
    if (!categories[focusRow]) return null;
    return categories[focusRow].items[focusCol] || null;
  }

  // ---------- BUILD CATEGORY LIST ----------
  function buildCategories(flatItems) {
    var map = {}; // name -> index
    var out = [];
    var i, it, key, idx;

    for (i = 0; i < flatItems.length; i++) {
      it = flatItems[i];
      key = String(it.category || "Other");
      if (map[key] == null) {
        idx = out.length;
        map[key] = idx;
        out.push({ name: key, items: [], scrollX: 0 });
      }
      out[map[key]].items.push(it);
    }
    return out;
  }

  // ---------- RENDER ----------
  function renderGrid() {
    if (!gridEl) return;

    var html = "";
    var r, c, row, it, poster, title, metaCat, metaRate, priceTxt;

    for (r = 0; r < categories.length; r++) {
      row = categories[r];

      html += ''
        + '<div class="vod-cat-row" id="vod-row-' + r + '">'
        +   '<div class="vod-cat-title">' + escapeHtml(row.name) + '</div>'
        +   '<div class="vod-cat-viewport">'
        +     '<div class="vod-cat-track" id="vod-track-' + r + '">';

      for (c = 0; c < row.items.length; c++) {
        it = row.items[c];

        poster = it.poster || it.thumbnail || "";

        title = escapeHtml(it.title || "");
        metaCat = escapeHtml(it.category || "");
        metaRate = escapeHtml(it.rating || "");
        priceTxt = money(it.price);

        html += ''
          + '<div class="vod-card" id="vod-card-' + r + '-' + c + '" data-r="' + r + '" data-c="' + c + '">'
          +   '<div class="vod-card__poster" style="background-image:url(\'' + poster + '\');"></div>'
          +   '<div class="vod-card__info">'
          +     '<div class="vod-card__title">' + title + '</div>'
          +     '<div class="vod-card__meta">'
          +       (metaCat ? ('<span>' + metaCat + '</span>') : '')
          +       (metaRate ? ('<span class="vod-card__rating">' + metaRate + '</span>') : '')
          // +       (priceTxt ? ('<span class="vod-card__price">' + escapeHtml(priceTxt) + '</span>') : '')
          +     '</div>'
          +   '</div>'
          + '</div>';
      }

      html += ''
        +     '</div>'
        +   '</div>'
        + '</div>';
    }

    gridEl.innerHTML = html;

    // reset focus & scroll
    focusRow = clamp(focusRow, 0, Math.max(0, categories.length - 1));
    focusCol = 0;
    scrollY = 0;

    // reset row scrolls
    for (r = 0; r < categories.length; r++) categories[r].scrollX = 0;

    applyFocus(true);
    scheduleTrailer();
  }

  // ---------- SCROLLING ----------
  function vpWidth() {
    var w0 = 1800; // 1920 - 60 - 60
    try { if (gridViewportEl && gridViewportEl.offsetWidth) w0 = gridViewportEl.offsetWidth; } catch (e) {}
    return w0;
  }

  function vpHeight() {
    var h0 = 760;
    try { if (gridViewportEl && gridViewportEl.offsetHeight) h0 = gridViewportEl.offsetHeight; } catch (e) {}
    return h0;
  }

  function rowBlockH() {
    // title + cards + row gap
    return ROW_TITLE_H + CARD_H + ROW_GAP_Y;
  }

function applyVerticalScroll() {
  if (!gridEl || !gridViewportEl) return;

  var el = qs("vod-card-" + focusRow + "-" + focusCol);
  if (!el) return;

  var PAD_TOP = 60;
  var PAD_BOTTOM = 20; // ✅ want 20px space above the bottom “visible area”

  // viewport + card rectangles (includes transforms)
  var vp = gridViewportEl.getBoundingClientRect();
  var cr = el.getBoundingClientRect();

  // ✅ IMPORTANT: legend overlays the grid, so visible bottom is legend.top (if present)
  var legend = w.__vodLegendEl || null;
  var visibleBottom = vp.bottom;

  try {
    if (legend && legend.offsetHeight > 0) {
      var lr = legend.getBoundingClientRect();
      // if legend is on screen, treat its TOP as the visible bottom limit
      if (lr.top > 0 && lr.top < visibleBottom) visibleBottom = lr.top;
    }
  } catch (e0) {}

  var visibleTop = vp.top;

  // If card is above visible area
  if (cr.top < visibleTop + PAD_TOP) {
    scrollY -= (visibleTop + PAD_TOP - cr.top);
  }

  // If card is below visible area (keep 20px gap)
  if (cr.bottom > (visibleBottom - PAD_BOTTOM)) {
    scrollY += (cr.bottom - (visibleBottom - PAD_BOTTOM));
  }

  // Clamp
  var vpH = (gridViewportEl.offsetHeight || 760);

  // content height (gridEl contains all rows)
  var contentH = (gridEl.offsetHeight || 0);

  // allow bottom padding when clamping
  var maxScroll = Math.max(0, contentH - vpH + PAD_BOTTOM);
  scrollY = clamp(scrollY, 0, maxScroll);

  gridEl.style.transform = "translateY(" + (-scrollY) + "px)";
}



  function applyHorizontalScroll(rowIndex) {
    var row = categories[rowIndex];
    if (!row) return;

    var track = qs("vod-track-" + rowIndex);
    if (!track) return;

    var vpW = vpWidth();

    var count = row.items.length;
    var contentW = (count * CARD_W) + ((count - 1) * GAP_X);
    var maxX = Math.max(0, contentW - vpW);

    var cardLeft = focusCol * (CARD_W + GAP_X);
    var cardRight = cardLeft + CARD_W;

    var x = row.scrollX || 0;
    if (cardLeft < x) x = cardLeft;
    if (cardRight > x + vpW) x = cardRight - vpW;

    x = clamp(x, 0, maxX);
    row.scrollX = x;

    track.style.transform = "translateX(" + (-x) + "px)";
  }

  // ---------- FOCUS ----------
  var lastFocusId = "";

  function applyFocus(ensure) {
    // clear previous
    if (lastFocusId) {
      var prev = qs(lastFocusId);
      if (prev) prev.className = prev.className.replace(/\bis-focused\b/g, "");
    }

    var id = "vod-card-" + focusRow + "-" + focusCol;
    var el = qs(id);
    if (el) el.className += " is-focused";
    lastFocusId = id;

   if (ensure) {
  // run after DOM applies .is-focused scale
    setTimeout(function () {
    applyVerticalScroll();
    applyHorizontalScroll(focusRow);
  }, 0);
}


    if (mode === "detail") fillDetail(currentItem());
  }

  // ---------- TRAILER ----------
  function scheduleTrailer() {
    if (trailerTimer) { try { clearTimeout(trailerTimer); } catch (e) {} trailerTimer = null; }

    trailerTimer = setTimeout(function () {
      trailerTimer = null;
      var it = currentItem();
      playTrailer(it ? it.trailer : "");
    }, 160);
  }

  function playTrailer(url) {
    url = rewriteAssetUrl(url);
    if (!bgVideoEl) return;

    if (!url) {
      try { bgVideoEl.pause(); } catch (e0) {}
      try { bgVideoEl.removeAttribute("src"); } catch (e1) {}
      try { bgVideoEl.load(); } catch (e2) {}
      currentTrailer = "";
      return;
    }

    if (url === currentTrailer) return;
    currentTrailer = url;

    try { bgVideoEl.pause(); } catch (e3) {}
    try { bgVideoEl.src = url; } catch (e4) {}
    try { bgVideoEl.load(); } catch (e5) {}

    try {
      var p = bgVideoEl.play();
      if (p && typeof p.then === "function") p.then(function(){}, function(){});
    } catch (e6) {}
  }

  // ---------- DETAIL ----------
  function setDetailLayout(on) {
    if (!detailEl) return;

    if (on) {
      if (gridViewportEl) gridViewportEl.style.display = "none";
      detailEl.className = "vod-detail is-active";
      mode = "detail";
    } else {
      if (gridViewportEl) gridViewportEl.style.display = defaultGridDisplay;
      detailEl.className = "vod-detail";
      mode = "grid";
    }
  }

  function fillDetail(it) {
    it = it || {};

    if (detailPosterEl) {
      detailPosterEl.style.backgroundImage = "url('" + (it.poster || it.thumbnail || "") + "')";
      detailPosterEl.style.backgroundSize = "cover";
      detailPosterEl.style.backgroundPosition = "center";
    }

    safeText(detailCategoryEl, it.category || "—");
    safeText(detailTitleEl, it.title || "—");

    if (detailMetaEl) {
      var html = "";
      if (it.rating) html += '<span class="vod-detail__rating">' + escapeHtml(it.rating) + "</span>";
      if (it.director) html += '<span>Director: ' + escapeHtml(it.director) + "</span>";
      if (it.languages) html += '<span>Languages: ' + escapeHtml(it.languages) + "</span>";
      var p = money(it.price);
      if (p) html += '<span class="vod-detail__price">' + escapeHtml(p) + "</span>";
      detailMetaEl.innerHTML = html || "—";
    }

    safeText(detailCastEl, it.cast || "—");
    safeText(detailDirectorEl, it.director || "—");
    safeText(detailDescEl, it.description || "—");
  }

  function showDetail(on) {
    if (on) {
      setDetailLayout(true);
      fillDetail(currentItem());
      scheduleTrailer();
    } else {
      setDetailLayout(false);
    }
  }

  // ---------- PLAYER ----------
  function startPlayer(it) {
    it = it || {};
    if (!playerEl || !playerVideoEl) return;

    var src = it.movie || "";
    if (!src) return;

    try { if (bgVideoEl) bgVideoEl.pause(); } catch (e0) {}

    playerEl.className = "vod-player is-active";
    mode = "player";

    try { playerVideoEl.pause(); } catch (e1) {}
    try { playerVideoEl.src = src; } catch (e2) {}
    try { playerVideoEl.load(); } catch (e3) {}

    try {
      var p = playerVideoEl.play();
      if (p && typeof p.then === "function") p.then(function(){}, function(){});
    } catch (e4) {}
  }

  function stopPlayer() {
    if (!playerEl || !playerVideoEl) return;

    try { playerVideoEl.pause(); } catch (e1) {}
    try { playerVideoEl.removeAttribute("src"); } catch (e2) {}
    try { playerVideoEl.load(); } catch (e3) {}

    playerEl.className = "vod-player";
    mode = "detail";

    scheduleTrailer();
  }

  // ---------- NAV ----------
  function moveLR(dc) {
    if (!categories.length) return;

    var row = categories[focusRow];
    if (!row) return;

    var maxC = Math.max(0, row.items.length - 1);
    var nc = focusCol + dc;
    nc = clamp(nc, 0, maxC);

    if (nc === focusCol) return;
    focusCol = nc;

    applyFocus(true);
    scheduleTrailer();
  }

  function moveUD(dr) {
    if (!categories.length) return;

    var nr = focusRow + dr;
    nr = clamp(nr, 0, Math.max(0, categories.length - 1));
    if (nr === focusRow) return;

    // keep same column if possible in new row
    var newRow = categories[nr];
    var maxC = Math.max(0, newRow.items.length - 1);
    var nc = clamp(focusCol, 0, maxC);

    focusRow = nr;
    focusCol = nc;

    applyFocus(true);
    scheduleTrailer();
  }

  // ---------- OPEN/CLOSE ----------
  function open(vodRouteOrAppJson) {
    ensureDom();
    active = true;
    mode = "grid";
    focusRow = 0;
    focusCol = 0;
    scrollY = 0;

    var data = null;

    if (vodRouteOrAppJson && vodRouteOrAppJson.layout_data && vodRouteOrAppJson.layout_data.length) {
      data = vodRouteOrAppJson.layout_data;
    }

    if (!data && vodRouteOrAppJson && vodRouteOrAppJson.routes && vodRouteOrAppJson.routes.length) {
      var i, rt;
      for (i = 0; i < vodRouteOrAppJson.routes.length; i++) {
        rt = vodRouteOrAppJson.routes[i];
        if (!rt) continue;
        if (String(rt.route_key || "").toUpperCase() === "KEY_VOD" && String(rt.route_parent_id || "") === "0") {
          if (rt.layout_data && rt.layout_data.length) data = rt.layout_data;
          break;
        }
      }
    }

    var flat = [];
    if (data && data.length) {
      var j;
      for (j = 0; j < data.length; j++) flat.push(normalizeItem(data[j]));
    }

    categories = buildCategories(flat);
    // Put Action first (case-insensitive)
    // categories.sort(function (a, b) {
    //   var an = String(a.name || "").toLowerCase();
    //   var bn = String(b.name || "").toLowerCase();

    //   if (an === "action" && bn !== "action") return -1;
    //   if (bn === "action" && an !== "action") return 1;
    //   return 0;
    // });


    // hide detail + player initially
    if (detailEl) detailEl.className = "vod-detail";
    if (playerEl) playerEl.className = "vod-player";
    if (gridViewportEl) gridViewportEl.style.display = defaultGridDisplay;

    renderGrid();
    scheduleTrailer();
  }

  function close() {
    active = false;

    if (trailerTimer) { try { clearTimeout(trailerTimer); } catch (e) {} trailerTimer = null; }

    try { if (bgVideoEl) { bgVideoEl.pause(); bgVideoEl.removeAttribute("src"); bgVideoEl.load(); } } catch (e1) {}
    try { if (playerVideoEl) { playerVideoEl.pause(); playerVideoEl.removeAttribute("src"); playerVideoEl.load(); } } catch (e2) {}

    currentTrailer = "";

    if (gridEl) gridEl.innerHTML = "";
    if (detailEl) detailEl.className = "vod-detail";
    if (playerEl) playerEl.className = "vod-player";
    if (gridViewportEl) gridViewportEl.style.display = defaultGridDisplay;

    categories = [];
    mode = "grid";
    focusRow = 0;
    focusCol = 0;
    scrollY = 0;
    lastFocusId = "";
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;

    var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, OK = 13;
    var BACK1 = 8, BACK2 = 461, BACK3 = 10009, BACK4 = 27;
    var UKEY = 85;

    // player mode
    if (mode === "player") {
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4 || k === UKEY) {
        stopPlayer();
        return true;
      }
      return true;
    }

    // detail mode
    if (mode === "detail") {
      if (k === LEFT) { moveLR(-1); return true; }
      if (k === RIGHT) { moveLR(1); return true; }
      if (k === UP) { moveUD(-1); return true; }
      if (k === DOWN) { moveUD(1); return true; }

      if (k === OK) {
        startPlayer(currentItem());
        return true;
      }

      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4 || k === UKEY) {
        showDetail(false);
        return true;
      }

      return false;
    }

    // grid mode
    if (k === LEFT) { moveLR(-1); return true; }
    if (k === RIGHT) { moveLR(1); return true; }
    if (k === UP) { moveUD(-1); return true; }
    if (k === DOWN) { moveUD(1); return true; }

    if (k === OK) {
      showDetail(true);
      return true;
    }

    // let home.js handle leaving VOD on BACK/U
    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4 || k === UKEY) {
      return false;
    }

    return false;
  }

  // Export
  w.VODPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown
  };

})(window);
