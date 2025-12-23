// js/app/music.js  (ES5 / Tizen 4 safe) — Figma-like UI with Albums/Genres grouping
(function (w) {
  "use strict";
  if (w.MusicPage) return;

  var viewEl, gridEl, gridViewportEl, countEl;
  var bgEl, logoEl;

  var playerVisualEl, nowTitleEl, nowArtistEl, audioEl, curEl, durEl, fillEl, knobEl;
  var btnPrevEl, btnPlayEl, btnNextEl;

  // NEW UI parts (created if missing)
  var sideEl, navEl, navTitleEl, scrollbarEl, scrollbarThumbEl;

  var active = false;

  // layout
  var cols = 4;
  var focusIndex = 0;
  var navIndex = 0;
  var scrollY = 0;
  var focusArea = "grid"; // "nav" | "grid" | "player"

  // audio
  var playingSongIndex = -1; // index into allSongs
  var isPlaying = false;

  // data
  var route = null;
  var allSongs = [];       // full song list from backend
  var display = [];        // current grid list (songs or groups)
  var mode = "songs";      // "songs" | "albums" | "genres" | "playlists"
  var drill = null;        // { type:"albums"/"genres"/"playlists", value:"..." } or null

  // grid tile metrics (must match CSS/ensureVisible)
  var TILE_W = 170, TILE_H = 210, GAP_X = 24, GAP_Y = 34;


  var NAV = [
    { id: "songs", label: "All Songs" },
    { id: "albums", label: "Albums" },
    { id: "genres", label: "Genres" },
    { id: "playlists", label: "Playlists" }
  ];

  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = (txt == null) ? "" : String(txt); }

  function sanitizeUrl(u) {
    u = (u == null) ? "" : String(u);
    return u.replace(/[\u0000-\u001F\u007F\s]+/g, "");
  }

  function rewriteAssetUrl(url) {
    url = sanitizeUrl(url);
    if (!url) return "";
    if (/^https?:\/\//i.test(url)) return url;
    if (/^\/\//.test(url)) return "http:" + url;
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
    if (!viewEl) return;

    gridEl = qs("mx-grid");
    gridViewportEl = qs("mx-grid-viewport");
    countEl = qs("mx-count");

    bgEl = viewEl.querySelector(".mx-bg");
    logoEl = qs("mx-brand-logo");

    playerVisualEl = qs("mx-player-visual");
    nowTitleEl = qs("mx-nowtitle");

    // artist line under title
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
      audioEl.addEventListener("pause", function () {
        isPlaying = false;
        if (btnPlayEl) btnPlayEl.textContent = "▶";
      });
      audioEl.addEventListener("play", function () {
        isPlaying = true;
        if (btnPlayEl) btnPlayEl.textContent = "⏸";
      });
    }

    // ---- NEW: sidebar + scrollbar (create if missing) ----
    // IMPORTANT: insert inside .mx-left so layout is stable with your HTML
    var leftWrap = viewEl ? viewEl.querySelector(".mx-left") : null;

    sideEl = qs("mx-side");
    if (!sideEl) {
      sideEl = document.createElement("div");
      sideEl.id = "mx-side";
      sideEl.className = "mx-side";
      if (leftWrap) leftWrap.insertBefore(sideEl, leftWrap.firstChild);
    }

    navTitleEl = qs("mx-side-title");
    if (!navTitleEl && sideEl) {
      navTitleEl = document.createElement("div");
      navTitleEl.id = "mx-side-title";
      navTitleEl.className = "mx-side-title";
      navTitleEl.textContent = "Music";
      sideEl.appendChild(navTitleEl);
    }

    navEl = qs("mx-nav");
    if (!navEl && sideEl) {
      navEl = document.createElement("div");
      navEl.id = "mx-nav";
      navEl.className = "mx-nav";
      sideEl.appendChild(navEl);
    }

    scrollbarEl = qs("mx-scrollbar");
    if (!scrollbarEl) {
      scrollbarEl = document.createElement("div");
      scrollbarEl.id = "mx-scrollbar";
      scrollbarEl.className = "mx-scrollbar";
      if (leftWrap) leftWrap.appendChild(scrollbarEl);
    }

    scrollbarThumbEl = qs("mx-scrollbar-thumb");
    if (!scrollbarThumbEl && scrollbarEl) {
      scrollbarThumbEl = document.createElement("div");
      scrollbarThumbEl.id = "mx-scrollbar-thumb";
      scrollbarThumbEl.className = "mx-scrollbar-thumb";
      scrollbarEl.appendChild(scrollbarThumbEl);
    }

    renderNav();
  }

  function renderNav() {
    if (!navEl) return;
    navEl.innerHTML = "";
    for (var i = 0; i < NAV.length; i++) {
      var b = document.createElement("div");
      b.className = "mx-navItem";
      b.setAttribute("data-nav", String(i));
      b.textContent = NAV[i].label;
      navEl.appendChild(b);
    }
    applyNavFocus();
  }

  function applyNavFocus() {
    if (!navEl) return;
    var kids = navEl.children;
    for (var i = 0; i < kids.length; i++) {
      var on = (i === navIndex && focusArea === "nav");
      kids[i].className = "mx-navItem" + (on ? " is-focus" : "");
    }
  }

  /* -------------------- data mapping (unchanged backend contract) -------------------- */
  function mapLayoutDataToSongs(routeObj) {
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

  function normKey(x) {
    x = (x == null) ? "" : String(x);
    x = x.replace(/^\s+|\s+$/g, "");
    return x;
  }

  function buildGroups(kind) {
    // kind: "albums" | "genres" | "playlists"
    var map = {}; // key -> group
    var list = [];
    for (var i = 0; i < allSongs.length; i++) {
      var s = allSongs[i];
      var k = "";
      if (kind === "albums") k = normKey(s.album) || "Unknown Album";
      else if (kind === "genres") k = normKey(s.genre) || "Unknown Genre";
      else if (kind === "playlists") {
        // backend doesn't provide playlist field in your current mapping
        // so we keep a single pseudo playlist for now
        k = "All";
      }

      if (!map[k]) {
        map[k] = {
          kind: "group",
          groupKind: kind,
          value: k,
          count: 0,
          cover: s.cover || "",
          // for subtitle display
          sub: ""
        };
        list.push(map[k]);
      }
      map[k].count++;
    }
    // finalize subtitles
    for (var j = 0; j < list.length; j++) {
      list[j].sub = String(list[j].count) + (list[j].count === 1 ? " Track" : " Tracks");
    }
    return list;
  }

  function buildSongsForDrill(dr) {
    // dr: {type, value}
    var out = [];
    for (var i = 0; i < allSongs.length; i++) {
      var s = allSongs[i];
      var ok = false;
      if (dr.type === "albums") ok = (normKey(s.album) || "Unknown Album") === dr.value;
      else if (dr.type === "genres") ok = (normKey(s.genre) || "Unknown Genre") === dr.value;
      else if (dr.type === "playlists") ok = true;

      if (ok) {
        out.push({ kind: "song", songIndex: i });
      }
    }
    return out;
  }

  function buildDisplay() {
    if (mode === "songs") {
      drill = null;
      var songs = [];
      for (var i = 0; i < allSongs.length; i++) songs.push({ kind: "song", songIndex: i });
      display = songs;
      return;
    }

    // albums/genres/playlists
    if (drill) {
      display = buildSongsForDrill(drill);
    } else {
      display = buildGroups(mode);
    }
  }

  /* -------------------- render grid -------------------- */
function renderGrid() {
  if (!gridEl) return;
  gridEl.innerHTML = "";

  for (var i = 0; i < display.length; i++) {
    var r = Math.floor(i / cols);
    var c = i % cols;

    var d = display[i];
    var title = "";
    var meta = "";
    var coverUrl = "";

    if (d && d.kind === "group") {
      title = d.value || "";
      meta = d.sub || "";
      coverUrl = d.cover || "";
    } else if (d && d.kind === "song") {
      var s = allSongs[d.songIndex] || {};
      title = s.title || "";
      meta = s.artist || "";
      coverUrl = s.cover || "";
    }

    var tile = document.createElement("div");
    tile.className = "mx-tile";
    tile.setAttribute("data-i", String(i));
    tile.style.left = (c * (TILE_W + GAP_X)) + "px";
    tile.style.top  = (r * (TILE_H + GAP_Y)) + "px";

    var cover = document.createElement("div");
    cover.className = "mx-cover";

    var img = document.createElement("img");
    img.alt = title || "";
    img.src = coverUrl || "";
    cover.appendChild(img);

    var name = document.createElement("div");
    name.className = "mx-name";
    name.textContent = title || "";

    var m = document.createElement("div");
    m.className = "mx-meta";
    m.textContent = meta || "";

    tile.appendChild(cover);
    tile.appendChild(name);
    tile.appendChild(m);
    gridEl.appendChild(tile);
  }

  applyGridFocus();
  updateCount();
  ensureVisible();
  updateScrollbar();
}



  function applyGridFocus() {
    if (!gridEl) return;
    var kids = gridEl.children;
    for (var i = 0; i < kids.length; i++) {
      var on = (i === focusIndex && focusArea === "grid");
      kids[i].className = "mx-tile" + (on ? " is-focus" : "");
    }
  }

  function updateCount() {
    // show mode + drill + position
    var total = display.length;
    var pos = total ? (focusIndex + 1) : 0;

    var label = "";
    if (mode === "songs") label = "All Songs";
    else if (mode === "albums") label = drill ? ("Albums • " + drill.value) : "Albums";
    else if (mode === "genres") label = drill ? ("Genres • " + drill.value) : "Genres";
    else label = drill ? ("Playlists • " + drill.value) : "Playlists";

    safeText(countEl, label + "   " + pos + " of " + total);
  }

function ensureVisible() {
  if (!gridEl || !gridViewportEl) return;

  var row = Math.floor(focusIndex / cols);
  var y = row * (TILE_H + GAP_Y);

  var vpH = gridViewportEl.clientHeight || 700;
  var padTop = 10;
  var padBottom = 120;

  if (y - scrollY < padTop) scrollY = y - padTop;
  if (y - scrollY > (vpH - padBottom)) scrollY = y - (vpH - padBottom);
  if (scrollY < 0) scrollY = 0;

  gridEl.style.top = (-scrollY) + "px";
}


  function updateScrollbar() {
    if (!scrollbarEl || !scrollbarThumbEl || !gridViewportEl) return;

    // compute content height
    var totalRows = Math.ceil(display.length / cols);
    var contentH = totalRows * (TILE_H + GAP_Y);
    var vpH = gridViewportEl.clientHeight || 700;

    if (contentH <= vpH + 2) {
      scrollbarEl.style.display = "none";
      return;
    }
    scrollbarEl.style.display = "block";

    var trackH = scrollbarEl.clientHeight || (vpH - 20);
    var thumbH = Math.max(40, Math.round(trackH * (vpH / contentH)));

    var maxScroll = Math.max(1, contentH - vpH);
    var t = scrollY / maxScroll;
    t = Math.max(0, Math.min(1, t));

    var top = Math.round((trackH - thumbH) * t);

    scrollbarThumbEl.style.height = thumbH + "px";
    scrollbarThumbEl.style.top = top + "px";
  }

  /* -------------------- player -------------------- */
  function setPlayerFromSongIndex(songIdx) {
    songIdx = clamp(songIdx, 0, Math.max(0, allSongs.length - 1));
    var it = allSongs[songIdx] || {};

    safeText(nowTitleEl, it.title || "—");
    safeText(nowArtistEl, it.artist || "");

    if (playerVisualEl) {
      var visual = it.cover || "";
      playerVisualEl.style.backgroundImage = visual ? ("url('" + visual + "')") : "none";
      playerVisualEl.style.backgroundSize = "cover";
      playerVisualEl.style.backgroundPosition = "center";
    }
  }

  function playSongIndex(songIdx) {
    songIdx = clamp(songIdx, 0, Math.max(0, allSongs.length - 1));
    var it = allSongs[songIdx];
    if (!it || !it.stream) return;

    playingSongIndex = songIdx;
    setPlayerFromSongIndex(songIdx);

    try {
      audioEl.src = it.stream;
      audioEl.play();
      isPlaying = true;
      if (btnPlayEl) btnPlayEl.textContent = "⏸";
    } catch (e) {}
  }

  function playFromGrid() {
    if (!display.length) return;
    var d = display[focusIndex];
    if (!d) return;

    if (d.kind === "group") {
      drill = { type: d.groupKind, value: d.value };
      focusIndex = 0;
      scrollY = 0;
      buildDisplay();
      renderGrid();
      return;
    }

    playSongIndex(d.songIndex);
  }

  function togglePlay() {
    if (!audioEl) return;

    if (playingSongIndex < 0) {
      // no playing yet => play current focused song if possible
      if (display.length && display[focusIndex] && display[focusIndex].kind === "song") {
        playSongIndex(display[focusIndex].songIndex);
      } else {
        // if on group, drill first
        playFromGrid();
      }
      return;
    }

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
    if (!allSongs.length) return;
    var next = (playingSongIndex >= 0) ? (playingSongIndex - 1) : 0;
    if (next < 0) next = 0;
    playSongIndex(next);
  }

  function nextTrack() {
    if (!allSongs.length) return;
    var next = (playingSongIndex >= 0) ? (playingSongIndex + 1) : 0;
    if (next > allSongs.length - 1) next = allSongs.length - 1;
    playSongIndex(next);
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
    if (playingSongIndex >= 0 && playingSongIndex < allSongs.length - 1) {
      playSongIndex(playingSongIndex + 1);
    }
  }

  /* -------------------- mode switching -------------------- */
  function setMode(newMode) {
    mode = newMode || "songs";
    drill = null;
    focusIndex = 0;
    scrollY = 0;
    buildDisplay();
    renderGrid();

    // set a nice default player preview
    if (allSongs.length) setPlayerFromSongIndex(playingSongIndex >= 0 ? playingSongIndex : 0);
  }

  /* -------------------- open/close -------------------- */
  function open(routeObj) {
    mountOnce();
    if (!viewEl) return;

    route = routeObj || null;

    active = true;
    focusArea = "grid";
    focusIndex = 0;
    navIndex = 0;
    scrollY = 0;

    // keep currently playing if you want; but for stability reset it like before:
    playingSongIndex = -1;
    isPlaying = false;

    viewEl.className = "tx-view is-active";

    try {
      if (bgEl && route && route.route_bg) {
        bgEl.style.backgroundImage = "url('" + rewriteAssetUrl(route.route_bg) + "')";
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundRepeat = "no-repeat";
      }
      if (logoEl && route && route.route_icon) {
        // optional: route icon as logo
        // logoEl.src = rewriteAssetUrl(route.route_icon);
      }
    } catch (e) {}

    allSongs = mapLayoutDataToSongs(route);
    setMode("songs");
  }

  function close() {
    if (!viewEl) return;
    active = false;
    viewEl.className = "tx-view";
    try { if (audioEl) { audioEl.pause(); audioEl.src = ""; } } catch (e) {}
  }

  /* -------------------- keys -------------------- */
  function keyCode(e) { return (e && (e.keyCode || e.which)) || 0; }
  function isBack(k) { return (k === 10009 || k === 461 || k === 8 || k === 27 || k === 412 || k === 457); }

  function goBackOneLevel() {
    if (drill) {
      drill = null;
      focusIndex = 0;
      scrollY = 0;
      buildDisplay();
      renderGrid();
      return true;
    }
    return false;
  }

  function onKeyDown(e) {
    if (!active) return false;

    var k = keyCode(e);

    if (isBack(k)) {
      if (goBackOneLevel()) return true;
      close();
      return true;
    }

    // OK
    if (k === 13) {
      if (focusArea === "nav") {
        setMode(NAV[navIndex].id);
        focusArea = "grid";
        applyNavFocus();
        applyGridFocus();
        return true;
      }
      if (focusArea === "grid") {
        playFromGrid();
        return true;
      }
      togglePlay();
      return true;
    }

    // LEFT
    if (k === 37) {
      if (focusArea === "player") {
        focusArea = "grid";
        applyNavFocus(); applyGridFocus();
        return true;
      }
      if (focusArea === "grid") {
        if ((focusIndex % cols) === 0) {
          focusArea = "nav";
          applyNavFocus(); applyGridFocus();
          return true;
        }
        focusIndex = clamp(focusIndex - 1, 0, Math.max(0, display.length - 1));
        applyGridFocus(); updateCount(); ensureVisible(); updateScrollbar();
        return true;
      }
      // nav: stay
      return true;
    }

    // RIGHT
    if (k === 39) {
      if (focusArea === "nav") {
        focusArea = "grid";
        applyNavFocus(); applyGridFocus();
        return true;
      }
      if (focusArea === "grid") {
        if ((focusIndex % cols) === (cols - 1) || focusIndex === display.length - 1) {
          focusArea = "player";
          applyNavFocus(); applyGridFocus();
          return true;
        }
        focusIndex = clamp(focusIndex + 1, 0, Math.max(0, display.length - 1));
        applyGridFocus(); updateCount(); ensureVisible(); updateScrollbar();
        return true;
      }
      // player: next
      nextTrack();
      return true;
    }

    // UP
    if (k === 38) {
      if (focusArea === "player") return true;
      if (focusArea === "nav") {
        navIndex = clamp(navIndex - 1, 0, NAV.length - 1);
        applyNavFocus();
        return true;
      }
      focusIndex = clamp(focusIndex - cols, 0, Math.max(0, display.length - 1));
      applyGridFocus(); updateCount(); ensureVisible(); updateScrollbar();
      return true;
    }

    // DOWN
    if (k === 40) {
      if (focusArea === "player") return true;
      if (focusArea === "nav") {
        navIndex = clamp(navIndex + 1, 0, NAV.length - 1);
        applyNavFocus();
        return true;
      }
      focusIndex = clamp(focusIndex + cols, 0, Math.max(0, display.length - 1));
      applyGridFocus(); updateCount(); ensureVisible(); updateScrollbar();
      return true;
    }

    // media keys
    if (k === 415) { togglePlay(); return true; } // Play
    if (k === 417) { nextTrack(); return true; }  // Next
    if (k === 412) { prevTrack(); return true; }  // Prev

    return false;
  }

  w.MusicPage = {
    open: open,
    close: close,
    onKeyDown: onKeyDown,
    isActive: function () { return active; }
  };
})(window);
