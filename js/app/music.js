(function (w) {
  "use strict";
  if (w.MusicPage) return;

  var viewEl, gridEl, gridViewportEl, countEl;
  var bgEl, logoEl;

  var playerVisualEl, nowTitleEl, nowArtistEl, audioEl, curEl, durEl, fillEl, knobEl;

  var btnPrevEl, btnPlayEl, btnNextEl;

  var active = false;
  var cols = 4;
  var focusIndex = 0;
  var items = [];
  var scrollY = 0;
  var focusArea = "grid"; // "grid" | "player"
  var playingIndex = -1;
  var isPlaying = false;

  var route = null; // current KEY_MUSIC route object

  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = (txt == null) ? "" : String(txt); }

  function sanitizeUrl(u) {
    u = (u == null) ? "" : String(u);
    return u.replace(/[\u0000-\u001F\u007F\s]+/g, "");
  }

  function rewriteAssetUrl(url) {
    // In your data it is already absolute http://192.168...
    url = sanitizeUrl(url);
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return "http:" + url;

    // if relative, try TenxApi.HOST
    try {
      if (w.TenxApi && w.TenxApi.HOST) {
        var origin = String(w.TenxApi.HOST).replace(/\/+$/, "");
        if (url.charAt(0) === "/") return origin + url;
        return origin + "/" + url;
      }
    } catch (e) {}
    return url;
  }

  /* -------------------- mount -------------------- */
  function mountOnce() {
    if (viewEl) return;

    viewEl = qs("view-music");
    gridEl = qs("mx-grid");
    gridViewportEl = qs("mx-grid-viewport");
    countEl = qs("mx-count");

    bgEl = viewEl ? viewEl.querySelector(".mx-bg") : null;
    logoEl = qs("mx-brand-logo");

    playerVisualEl = qs("mx-player-visual");
    nowTitleEl = qs("mx-nowtitle");

    // ✅ Create an artist line under title if not present
    nowArtistEl = qs("mx-nowartist");
    if (!nowArtistEl && nowTitleEl && nowTitleEl.parentNode) {
      nowArtistEl = document.createElement("div");
      nowArtistEl.id = "mx-nowartist";
      nowArtistEl.className = "mx-nowartist";
      nowTitleEl.parentNode.insertBefore(nowArtistEl, nowTitleEl.nextSibling);
    }

audioEl = qs("mx-audio");

    curEl = qs("mx-cur");
    durEl = qs("mx-dur");
    fillEl = qs("mx-player-fill");
    knobEl = qs("mx-player-knob");

    btnPrevEl = qs("mx-prev");
    btnPlayEl = qs("mx-play");
    btnNextEl = qs("mx-next");

    if (btnPrevEl) btnPrevEl.onclick = prevTrack;
    if (btnPlayEl) btnPlayEl.onclick = togglePlay;
    if (btnNextEl) btnNextEl.onclick = nextTrack;

    if (audioEl) {
      audioEl.addEventListener("timeupdate", onAudioTime);
      audioEl.addEventListener("ended", onAudioEnded);
      audioEl.addEventListener("loadedmetadata", onAudioTime);
      audioEl.addEventListener("pause", function(){ isPlaying = false; if (btnPlayEl) btnPlayEl.textContent = "▶"; });
      audioEl.addEventListener("play", function(){ isPlaying = true; if (btnPlayEl) btnPlayEl.textContent = "⏸"; });
    }
  }

  /* -------------------- data mapping -------------------- */
  function mapLayoutDataToItems(routeObj) {
    var out = [];
    if (!routeObj || !routeObj.layout_data || !routeObj.layout_data.length) return out;

    for (var i = 0; i < routeObj.layout_data.length; i++) {
      var s = routeObj.layout_data[i] || {};
      out.push({
        id: s.song_id || i,
        title: s.song_title || ("Track " + (i + 1)),
        artist: s.artist || "",
        album: s.album_name || "",
        genre: s.genre_name || "",
        language: s.language || "",
        desc: s.description || "",
        duration: s.duration_seconds || 0,
        stream: rewriteAssetUrl(s.file_src),
        cover: rewriteAssetUrl(s.poster_src)
      });
    }
    return out;
  }

  /* -------------------- render grid -------------------- */
  function renderGrid() {
    if (!gridEl) return;
    gridEl.innerHTML = "";

    var gapX = 34, gapY = 72;
    var tileW = 240, tileH = 170;

    for (var i = 0; i < items.length; i++) {
      var r = Math.floor(i / cols);
      var c = i % cols;

      var tile = document.createElement("div");
      tile.className = "mx-tile";
      tile.setAttribute("data-i", String(i));
      tile.style.left = (c * (tileW + gapX)) + "px";
      tile.style.top = (r * (tileH + gapY)) + "px";

      var cover = document.createElement("div");
      cover.className = "mx-cover";

      var img = document.createElement("img");
      img.alt = items[i].title || "";
      img.src = items[i].cover || "";
      cover.appendChild(img);

      var name = document.createElement("div");
      name.className = "mx-name";
      name.textContent = items[i].title || "";

      tile.appendChild(cover);
      tile.appendChild(name);
      gridEl.appendChild(tile);
    }

    applyFocus();
    updateCount();
    ensureVisible();
  }

  function updateCount() {
    safeText(countEl, (items.length ? (focusIndex + 1) : 0) + " of " + items.length);
  }

  function applyFocus() {
    if (!gridEl) return;
    var kids = gridEl.children;
    for (var i = 0; i < kids.length; i++) {
      kids[i].className = "mx-tile" + ((i === focusIndex && focusArea === "grid") ? " is-focus" : "");
    }
  }

  function ensureVisible() {
    if (!gridEl || !gridViewportEl) return;

    var row = Math.floor(focusIndex / cols);
    var tileH = 170, gapY = 72;
    var y = row * (tileH + gapY);

    var vpH = gridViewportEl.clientHeight || 700;
    var padTop = 10;
    var padBottom = 80;

    if (y - scrollY < padTop) scrollY = y - padTop;
    if (y - scrollY > (vpH - padBottom)) scrollY = y - (vpH - padBottom);
    if (scrollY < 0) scrollY = 0;

    gridEl.style.top = (-scrollY) + "px";
  }

  /* -------------------- player -------------------- */
  function setPlayerFromIndex(idx) {
    idx = clamp(idx, 0, Math.max(0, items.length - 1));
    var it = items[idx] || {};

    safeText(nowTitleEl, it.title || "—");
    safeText(nowArtistEl, it.artist || "");


    if (playerVisualEl) {
      var visual = it.cover || "";
      playerVisualEl.style.backgroundImage = visual ? ("url('" + visual + "')") : "none";
      playerVisualEl.style.backgroundSize = "cover";
      playerVisualEl.style.backgroundPosition = "center";
    }
  }

  function playIndex(idx) {
    idx = clamp(idx, 0, Math.max(0, items.length - 1));
    var it = items[idx];
    if (!it || !it.stream) return;

    playingIndex = idx;
    setPlayerFromIndex(idx);

    try {
      audioEl.src = it.stream;
      audioEl.play();
      isPlaying = true;
      if (btnPlayEl) btnPlayEl.textContent = "⏸";
    } catch (e) {}
  }

  function togglePlay() {
    if (!audioEl) return;

    if (playingIndex < 0) { playIndex(focusIndex); return; }

    try {
      if (isPlaying) {
        audioEl.pause();
        isPlaying = false;
        if (btnPlayEl) btnPlayEl.textContent = "▶";
      } else {
        audioEl.play();
        isPlaying = true;
        if (btnPlayEl) btnPlayEl.textContent = "⏸";
      }
    } catch (e) {}
  }

  function prevTrack() {
    if (!items.length) return;
    var next = (playingIndex >= 0) ? (playingIndex - 1) : (focusIndex - 1);
    if (next < 0) next = 0;
    playIndex(next);
  }

  function nextTrack() {
    if (!items.length) return;
    var next = (playingIndex >= 0) ? (playingIndex + 1) : (focusIndex + 1);
    if (next > items.length - 1) next = items.length - 1;
    playIndex(next);
  }

  function fmtTime(sec) {
    sec = Math.max(0, sec || 0);
    var m = Math.floor(sec / 60);
    var s = Math.floor(sec % 60);
    return (m < 10 ? "0" + m : "" + m) + ":" + (s < 10 ? "0" + s : "" + s);
  }

  function onAudioTime() {
    if (!audioEl) return;
    var cur = audioEl.currentTime || 0;
    var dur = audioEl.duration || 0;

    safeText(curEl, fmtTime(cur));
    safeText(durEl, isFinite(dur) ? fmtTime(dur) : "00:00");

    var pct = (dur > 0) ? (cur / dur) : 0;
    pct = Math.max(0, Math.min(1, pct));

    if (fillEl) fillEl.style.width = Math.round(pct * 100) + "%";
    if (knobEl) knobEl.style.left = Math.round(pct * 100) + "%";
  }

  function onAudioEnded() {
    isPlaying = false;
    if (btnPlayEl) btnPlayEl.textContent = "▶";
    if (playingIndex >= 0 && playingIndex < items.length - 1) playIndex(playingIndex + 1);
  }

  /* -------------------- open/close -------------------- */
  function open(routeObj) {
    mountOnce();
    if (!viewEl) return;

    route = routeObj || null;

    active = true;
    focusArea = "grid";
    focusIndex = 0;
    scrollY = 0;
    playingIndex = -1;
    isPlaying = false;

    viewEl.className = "tx-view is-active";

    // Background and icon (same idea as channels)
    try {
      if (bgEl && route && route.route_bg) {
        bgEl.style.backgroundImage = "url('" + rewriteAssetUrl(route.route_bg) + "')";
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundRepeat = "no-repeat";
      }
      if (logoEl && route && route.route_icon) {
        // optional: show route icon as logo (or keep hotel logo)
        // logoEl.src = rewriteAssetUrl(route.route_icon);
      }
    } catch (e) {}

    items = mapLayoutDataToItems(route);
    renderGrid();
    setPlayerFromIndex(0);
  }

  function close() {
    if (!viewEl) return;
    active = false;
    viewEl.className = "tx-view";
    try { if (audioEl) { audioEl.pause(); audioEl.src = ""; } } catch (e) {}
  }

  /* -------------------- keys -------------------- */
  function keyCode(e) { return e && (e.keyCode || e.which) || 0; }
  function isBack(k) { return (k === 10009 || k === 461 || k === 8 || k === 27 || k === 412 || k === 457); }

  function onKeyDown(e) {
    if (!active) return false;

    var k = keyCode(e);

    if (isBack(k)) { close(); return true; }

    // OK/ENTER
    if (k === 13) {
      if (focusArea === "grid") playIndex(focusIndex);
      else togglePlay();
      return true;
    }

    // LEFT
    if (k === 37) {
      if (focusArea === "player") { focusArea = "grid"; applyFocus(); return true; }
      if ((focusIndex % cols) > 0) focusIndex--;
      applyFocus(); updateCount(); ensureVisible();
      return true;
    }

    // RIGHT
    if (k === 39) {
      if (focusArea === "grid") {
        if ((focusIndex % cols) === (cols - 1)) { focusArea = "player"; applyFocus(); return true; }
        focusIndex = clamp(focusIndex + 1, 0, items.length - 1);
        applyFocus(); updateCount(); ensureVisible();
        return true;
      }
      nextTrack();
      return true;
    }

    // UP
    if (k === 38) {
      if (focusArea === "player") return true;
      focusIndex = clamp(focusIndex - cols, 0, items.length - 1);
      applyFocus(); updateCount(); ensureVisible();
      return true;
    }

    // DOWN
    if (k === 40) {
      if (focusArea === "player") return true;
      focusIndex = clamp(focusIndex + cols, 0, items.length - 1);
      applyFocus(); updateCount(); ensureVisible();
      return true;
    }

    // media keys optional
    if (k === 415) { togglePlay(); return true; } // Play
    if (k === 417) { nextTrack(); return true; }  // Next
    if (k === 412) { prevTrack(); return true; }  // Prev

    return false;
  }

  w.MusicPage = {
    open: open,      // expects the KEY_MUSIC route object
    close: close,
    onKeyDown: onKeyDown,
    isActive: function(){ return active; }
  };
})(window);
