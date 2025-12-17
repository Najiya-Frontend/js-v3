// home.js (ES5 / Tizen 4 safe)
(function () {
  "use strict";

  var DESIGN_W = 1920, DESIGN_H = 1080;

  var stage = document.getElementById("tx-stage");
  var viewWelcome = document.getElementById("view-welcome");
  var viewHome = document.getElementById("view-home");
  var viewWeather = document.getElementById("view-weather");
  var prevView = "home";
  var viewTV = document.getElementById("view-tv");


  var btnContinue = document.getElementById("btn-continue");
  var toggleTV = document.getElementById("toggle-tv");
  var toggleLang = document.getElementById("toggle-lang");

  var currentView = "welcome";
  var currentLang = "en";
  var LANG_ID = { en: 1, ar: 2 };

  var APP_DATA = null;
  var ROUTES_BY_ATTR = {};
  var ROUTES_LIST = [];
  var TILE_ROUTE = {}; // tileId -> route object

  var TEXT = {
    en: {
      continue: "Continue",
      tv: "Television",
      language: "Language",
      welcome: "WELCOME",
      welcomeName: "WELCOME",
      metaWelcome: "Welcome"
    },
    ar: {
      continue: "استمرار",
      tv: "التلفزيون",
      language: "اللغة",
      welcome: "أهلاً وسهلاً",
      welcomeName: "أهلاً وسهلاً",
      metaWelcome: "أهلاً"
    }
  };

  function qs(id) { return document.getElementById(id); }

  function log() {
    try { if (window.console && console.log) console.log.apply(console, arguments); } catch (e) {}
  }

  function setText(id, txt) {
    var el = qs(id);
    if (!el) return;
    el.textContent = (txt == null) ? "" : String(txt);
  }

  function pad2(n) { n = String(n); return n.length < 2 ? ("0" + n) : n; }

  function updateClock() {
    var d = new Date();
    var time = pad2(d.getHours()) + ":" + pad2(d.getMinutes());
    var mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var date = pad2(d.getDate()) + " " + mons[d.getMonth()] + " " + d.getFullYear();
    setText("meta-time-w", time);
    setText("meta-time-h", time);
    setText("meta-date-w", date);
    setText("meta-date-h", date);
    setText("meta-time-we", time);
    setText("meta-date-we", date);

  }

  function fitStage() {
    if (!stage) return;
    var ww = window.innerWidth || DESIGN_W;
    var wh = window.innerHeight || DESIGN_H;
    var sx = ww / DESIGN_W, sy = wh / DESIGN_H;
    var s = sx < sy ? sx : sy;
    stage.style.transform = "translate(-50%, -50%) scale(" + s + ")";
  }

  function clearFocus() {
    var els = document.querySelectorAll(".tx-focusable.is-focused");
    var i;
    for (i = 0; i < els.length; i++) {
      els[i].className = els[i].className.replace(/\bis-focused\b/g, "");
    }
  }

  // ===================== URL REWRITE (admin-portal assets) =====================

  function apiOrigin() {
    try {
      if (window.TenxApi && window.TenxApi.HOST) return String(window.TenxApi.HOST).replace(/\/+$/, "");
    } catch (e) {}
    return "";
  }
function rewriteAssetUrl(url) {
  url = String(url || "");
  if (!url) return url;
  if (url.indexOf("/admin-portal/assets/") < 0) return url;

  var origin = apiOrigin();
  if (!origin) return url;

  // Debugging the asset URL before rewriting
  console.log("Rewriting asset URL:", url);

  return url.replace(/^https?:\/\/[^\/]+/i, origin);
}


  // ===================== BRAND LOGO (from backend settings/hotel cover/logo) =====================

  function setBrandLogo(url) {
    url = rewriteAssetUrl(url);

    var imgW = qs("brand-logo-w"), imgH = qs("brand-logo-h");
    var txtW = qs("brand-text-w"), txtH = qs("brand-text-h");

    function apply(img, txt) {
      if (!img || !txt) return;

      if (url) {
        img.src = url;
        img.style.display = "block";
        txt.style.display = "none";
      } else {
        try { img.removeAttribute("src"); } catch (e) {}
        img.style.display = "none";
        txt.style.display = "block";
      }
    }

    apply(imgW, txtW);
    apply(imgH, txtH);
  }

  function pick(obj, keys) {
    var i, k, v;
    if (!obj) return null;
    for (i = 0; i < keys.length; i++) {
      k = keys[i];
      v = obj[k];
      if (v !== undefined && v !== null && v !== "") return v;
    }
    return null;
  }
  function isLikelyImageUrl(u) {
  u = String(u || "");
  if (!u) return false;
  if (u.charAt(u.length - 1) === "/") return false;        // folder
  // must end with a common image extension (ignore query string)
  var bare = u.split("?")[0].toLowerCase();
  return (
    bare.indexOf(".png") > -1 ||
    bare.indexOf(".jpg") > -1 ||
    bare.indexOf(".jpeg") > -1 ||
    bare.indexOf(".svg") > -1 ||
    bare.indexOf(".webp") > -1 ||
    bare.indexOf(".gif") > -1
  );
}

  function pickHotelLogo(app) {
    // tries common TenX payload patterns (hotel logo/cover in settings)
    var u =
      pick(app, ["hotel_logo","hotel_logo_url","logo","logo_url"]) ||
      pick(app, ["hotel_cover","hotel_cover_url","cover","cover_url"]);

    if (!u && app && app.hotel) {
      u = pick(app.hotel, ["logo","logo_url","cover","cover_url"]);
    }
    if (!u && app && app.settings) {
      u = pick(app.settings, ["logo","logo_url","cover","cover_url"]);
    }
    if (!u && app && app.hotel_covers && app.hotel_covers.length) {
      u = app.hotel_covers[0];
    }

    return u || "";
  }

  // ===================== LANGUAGE =====================

  function applyLang() {
    var t = TEXT[currentLang] || TEXT.en;

    var cls = (document.body.className || "");
    cls = cls.replace(/\blang-ar\b/g, "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
    if (currentLang === "ar") cls = (cls ? (cls + " ") : "") + "lang-ar";
    document.body.className = cls;

    setText("txt-continue", t.continue);
    setText("txt-tv", t.tv);
    setText("txt-lang", t.language);
    setText("welcome-title", t.welcome);
    setText("welcome-name", t.welcomeName);
  }

  // ===================== VIEWS / NAV =====================

  var welcomeFocusIndex = 0;
  var welcomeFocusEls = [btnContinue, toggleTV, toggleLang];

  function setWelcomeFocus(idx) {
    clearFocus();
    welcomeFocusIndex = idx;
    var el = welcomeFocusEls[idx];
    if (el) el.className += " is-focused";
  }

  var homePos = { r: 0, c: 0 };
  var HOME_NAV = [
    ["tile-hotelinfo", "tile-roomservice", "tile-movies",      "tile-movies",      "tile-music",   "tile-tv"],
    ["tile-spa",       "tile-restaurants", "tile-movies",      "tile-movies",      "tile-weather", "tile-clock"],
    ["tile-dining",    "tile-discover",    "tile-roomcontrol", "tile-cart",        "tile-special", "tile-special"],
    ["tile-dining",    "tile-prayer",      "tile-messages",    "tile-viewbill",    "tile-special", "tile-special"]
  ];

  function setHomeFocusById(id) {
    clearFocus();
    var el = qs(id);
    if (el) el.className += " is-focused";

    var r, c;
    for (r = 0; r < HOME_NAV.length; r++) {
      for (c = 0; c < HOME_NAV[r].length; c++) {
        if (HOME_NAV[r][c] === id) { homePos.r = r; homePos.c = c; return; }
      }
    }
  }

  function moveHome(dr, dc) {
    var r = homePos.r, c = homePos.c;
    var cur = HOME_NAV[r][c];
    var nr = r + dr, nc = c + dc;

    if (nr < 0) nr = 0;
    if (nr > HOME_NAV.length - 1) nr = HOME_NAV.length - 1;
    if (nc < 0) nc = 0;
    if (nc > HOME_NAV[0].length - 1) nc = HOME_NAV[0].length - 1;

    var guard = 0;
    while (guard < 20 && HOME_NAV[nr][nc] === cur && (nr !== r || nc !== c)) {
      nr += dr; nc += dc;
      if (nr < 0 || nr > HOME_NAV.length - 1 || nc < 0 || nc > HOME_NAV[0].length - 1) { nr = r; nc = c; break; }
      guard++;
    }
    setHomeFocusById(HOME_NAV[nr][nc]);
  }

  function showView(name) {
  // leaving weather? tell module to hide
  if (currentView === "weather" && name !== "weather") {
    if (window.WeatherPage && typeof window.WeatherPage.onHide === "function") {
      window.WeatherPage.onHide();
    }
  }

  // ===== WEATHER FIRST (so it doesn't go into welcome/home else) =====
  if (name === "weather") {
    // store where we came from BEFORE changing currentView
    prevView = currentView || "home";
    currentView = "weather";

    if (viewWelcome) viewWelcome.className = "tx-view";
    if (viewHome) viewHome.className = "tx-view";
    if (viewWeather) viewWeather.className = "tx-view is-active";

    if (window.WeatherPage && typeof window.WeatherPage.onShow === "function") {
      window.WeatherPage.onShow(APP_DATA);
    }
    return;
  }
  if (name === "tv") {
  viewWelcome.className = "tx-view";
  viewHome.className = "tx-view";
  viewWeather.className = "tx-view";
  if (viewTV) viewTV.className = "tx-view is-active";

  prevView = "home";

  // mount channels (pass app_json if you store it)
 try {
      if (window.TVChannels && channels.mount) {
        var appJson = window.__APP_JSON__ || null;
        var htmlOutput = appJson ? appJson.html_output : "";

        // Extract TV channels from html_output
        var channels = extractChannelsDataFromHtml(htmlOutput);

        // Pass the channels to TVChannels.mount
        TVChannels.mount({
          appJson: appJson,
          channels: channels  // Pass the channels to display on the TV page
        });
      }
    } catch (e) {
      console.error("Error mounting TV channels:", e);
    }

  return;
}
  // ===== NORMAL VIEWS =====
  currentView = name;

  // always hide weather when not on it
  if (viewWeather) viewWeather.className = "tx-view";

  if (name === "home") {
    if (viewWelcome) viewWelcome.className = "tx-view";
    if (viewHome) viewHome.className = "tx-view is-active";
    setHomeFocusById("tile-hotelinfo");
  } else {
    if (viewHome) viewHome.className = "tx-view";
    if (viewWelcome) viewWelcome.className = "tx-view is-active";
    setWelcomeFocus(0);
  }
}

function extractChannelsDataFromHtml(html) {
  var channelList = [];
  var channelItems = html.match(/<li class="subnav_item[^>]*data-id="([^"]*)"[^>]*data-name="([^"]*)"[^>]*data-channel-number="([^"]*)"[^>]*data-channel-url="([^"]*)"/g);

  if (channelItems) {
    channelItems.forEach(function(item) {
      var id = item.match(/data-id="([^"]*)/)[1];
      var name = item.match(/data-name="([^"]*)/)[1];
      var number = item.match(/data-channel-number="([^"]*)/)[1];
      var url = item.match(/data-channel-url="([^"]*)/)[1];
      var logoUrl = item.match(/<img[^>]+data-src="([^"]*)/)[1] || '';

      channelList.push({
        id: id,
        name: name,
        number: number,
        url: url,
        logoUrl: logoUrl
      });
    });
  }

  return channelList;
}


  function forceWelcomeOnBoot() {
    var h = String(window.location.hash || "");
    if (!h || h === "#") { window.location.hash = "#/welcome"; return; }
    if (h.toLowerCase().indexOf("#/home") === 0) window.location.hash = "#/welcome";
  }

function onOk() {
  if (currentView === "welcome") {
    if (welcomeFocusIndex === 0) window.location.hash = "#/home";
    else if (welcomeFocusIndex === 1) alert("TV action (hook later)");
    else if (welcomeFocusIndex === 2) changeLang((currentLang === "en") ? "ar" : "en");
    else if (welcomeFocusIndex === 1) showView("tv"); // Trigger TV action

    return;
  }

  var focused = document.querySelector(".tx-focusable.is-focused");
  if (!focused) return;

  var tileId = focused.id;
  var rt = TILE_ROUTE[tileId];

  // ✅ Open Weather page
  if (tileId === "tile-weather") {
    showView("weather");
    return;
  }
  // ✅ Open Weather page
  if (tileId === "tile-tv") {
    showView("tv");
    return;
  }

  if (rt) {
    alert("Open: " + (rt.route_name || tileId) + " (route_id=" + (rt.route_id || "") + ")");
    return;
  }

  alert("Open: " + tileId + " (not mapped yet)");
}


  function onBack() {
    if (currentView === "home") window.location.hash = "#/welcome";
    else alert("Exit (hook to TV close later)");
  }

  function onKeyDown(e) {
  var k = e.keyCode || e.which || 0;

  var LEFT=37, UP=38, RIGHT=39, DOWN=40, OK=13;
  var BACK1=8, BACK2=461, BACK3=10009, BACK4=27;

  // ✅ U = Back (requested)
  if (k === 85) { // U
    e.preventDefault();
    if (currentView === "weather") showView(prevView || "home");
    else if (currentView === "tv") showView("home"); // Navigate back to the TV page
    else onBack();
    return;
  }

  // ✅ R = Home (requested)
  if (k === 82) { // R
    e.preventDefault();
    showView("home");
    return;
  }

  // OK / BACK
  if (k === OK) { e.preventDefault(); onOk(); return; }
  if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) { e.preventDefault(); onBack(); return; }

  // ✅ If Weather is active, delegate keys to WeatherPage and STOP here
  if (currentView === "weather") {
    if (window.WeatherPage && typeof window.WeatherPage.handleKey === "function") {
      if (window.WeatherPage.handleKey(k)) { e.preventDefault(); return; }
    }
    // If WeatherPage didn't handle it, still don't move home grid
    return;
  }

  // Welcome navigation
  if (currentView === "welcome") {
    if (k === DOWN) { if (welcomeFocusIndex === 0) setWelcomeFocus(1); return; }
    if (k === UP)   { if (welcomeFocusIndex !== 0) setWelcomeFocus(0); return; }
    if (k === LEFT || k === RIGHT) {
      if (welcomeFocusIndex === 1 && k === RIGHT) setWelcomeFocus(2);
      else if (welcomeFocusIndex === 2 && k === LEFT) setWelcomeFocus(1);
      return;
    }
    return;
  }
  // If the "TV" tile is selected, trigger the TV view
  if (currentView === "home") {
    if (k === OK) {  // OK / Enter key
      var focusedTile = document.querySelector(".tx-focusable.is-focused"); // Get focused tile
      if (focusedTile && focusedTile.id === "tile-tv") {  // Check if the focused tile is TV
        showView("tv"); // Show TV view
        return true;
      }
    }
  }
  if (currentView === "tv") {
  if (window.TVChannels && window.TVChannels.handleKeyDown) {
    if (window.TVChannels.handleKeyDown(e)) {
      e.preventDefault();
      return;
    }
  }
  return;
}

  // Home navigation
  if (k === LEFT)  { e.preventDefault(); moveHome(0,-1); return; }
  if (k === RIGHT) { e.preventDefault(); moveHome(0, 1); return; }
  if (k === UP)    { e.preventDefault(); moveHome(-1,0); return; }
  if (k === DOWN)  { e.preventDefault(); moveHome( 1,0); return; }
}


  // ===================== APP_JSON PARSING / UI HYDRATE =====================

  function normalizeRoutes(app) {
    var r = app && (app.routes || app.route_list || app.menu || app.menus || app.routeData || app.route_data);
    if (r && r.data && r.data.length) r = r.data;
    if (r && r.length) return r;
    if (app && app.home && app.home.routes && app.home.routes.length) return app.home.routes;
    return [];
  }

  function toLowerSafe(s) { return String(s || "").toLowerCase(); }

  function routeMatches(rt, tests) {
    var hay = "";
    var a = pick(rt, ["route_attr","route_key","route_name","layout_name","layout_key"]);
    var b = pick(rt, ["layout_attr_name","route_attr_name"]);
    hay = (String(a || "") + " " + String(b || "")).toLowerCase();

    var i;
    for (i = 0; i < tests.length; i++) {
      if (hay.indexOf(tests[i]) >= 0) return true;
    }
    return false;
  }

  function findRoute(routes, tests) {
    var i;
    for (i = 0; i < routes.length; i++) {
      if (routeMatches(routes[i], tests)) return routes[i];
    }
    return null;
  }

  // ===================== html_output helpers =====================

  function slicePageFromHtmlOutput(html, keyId) {
    html = String(html || "");
    if (!html) return "";

    var needle = 'id="' + keyId + '"';
    var at = html.indexOf(needle);
    if (at < 0) return "";

    var open = html.lastIndexOf("<div", at);
    if (open < 0) open = at;

    var next = html.indexOf('<div dir="ltr" id="KEY_', at + needle.length);
    if (next < 0) next = html.length;

    return html.slice(open, next);
  }

  function extractBgUrlFromPageHtml(pageHtml) {
    pageHtml = String(pageHtml || "");
    if (!pageHtml) return "";

    var m = /background-image\s*:\s*url\(([^)]+)\)/i.exec(pageHtml);
    if (!m || !m[1]) return "";
    var raw = String(m[1]).replace(/^\s+|\s+$/g, "");
    raw = raw.replace(/^[\"']/, "").replace(/[\"']$/, "");
    return raw;
  }

  // pick LAST match (so overrides win)
  function extractMenuIconFromHomeByCode(homeHtml, code) {
    homeHtml = String(homeHtml || "");
    code = String(code || "");
    if (!homeHtml || !code) return "";

    var up = code.toUpperCase();

    var needle1 = 'data-code="' + up + '"';
    var needle2 = "data-code='" + up + "'";

    var lastIdx = -1;
    var idx = -1;

    idx = homeHtml.toUpperCase().indexOf(needle1.toUpperCase());
    while (idx >= 0) {
      lastIdx = idx;
      idx = homeHtml.toUpperCase().indexOf(needle1.toUpperCase(), idx + 1);
    }

    if (lastIdx < 0) {
      idx = homeHtml.toUpperCase().indexOf(needle2.toUpperCase());
      while (idx >= 0) {
        lastIdx = idx;
        idx = homeHtml.toUpperCase().indexOf(needle2.toUpperCase(), idx + 1);
      }
    }

    if (lastIdx < 0) return "";

    var liStart = homeHtml.lastIndexOf("<li", lastIdx);
    if (liStart < 0) return "";

    var liEnd = homeHtml.indexOf("</li", lastIdx);
    if (liEnd < 0) liEnd = homeHtml.length;

    var liHtml = homeHtml.slice(liStart, liEnd);

    var m = /<img[^>]+data-src\s*=\s*[\"']([^"']+)[\"']/i.exec(liHtml);
    if (m && m[1]) return m[1];

    m = /<img[^>]+src\s*=\s*[\"']([^"']+)[\"']/i.exec(liHtml);
    if (m && m[1]) {
      var s = String(m[1]);
      if (s.indexOf("/Menus/Menu_Icons/") >= 0 || s.indexOf("/Menu_Icons/") >= 0) return s;
    }

    return "";
  }

  // pull icon by route_attr token in class=""
  function extractMenuIconFromHomeByRouteAttr(homeHtml, routeAttr) {
    homeHtml = String(homeHtml || "");
    routeAttr = String(routeAttr || "");
    if (!homeHtml || !routeAttr) return "";

    var token = routeAttr.toLowerCase();
    var upper = homeHtml.toLowerCase();
    var last = -1;
    var at = upper.indexOf(token);
    while (at >= 0) {
      last = at;
      at = upper.indexOf(token, at + 1);
    }
    if (last < 0) return "";

    var liStart = homeHtml.lastIndexOf("<li", last);
    if (liStart < 0) return "";

    var liEnd = homeHtml.indexOf("</li", last);
    if (liEnd < 0) liEnd = homeHtml.length;

    var liHtml = homeHtml.slice(liStart, liEnd);

    var m = /<img[^>]+data-src\s*=\s*[\"']([^"']+)[\"']/i.exec(liHtml);
    if (m && m[1]) return m[1];

    m = /<img[^>]+src\s*=\s*[\"']([^"']+)[\"']/i.exec(liHtml);
    if (m && m[1]) {
      var s = String(m[1]);
      if (s.indexOf("/Menus/Menu_Icons/") >= 0 || s.indexOf("/Menu_Icons/") >= 0) return s;
    }

    return "";
  }

  function setPageBg(viewEl, url) {
    url = rewriteAssetUrl(url);
    if (!viewEl || !url) return;

    var bg = null;
    try { bg = viewEl.querySelector(".tx-bg"); } catch (e) { bg = null; }

    var overlay = "linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.75) 70%, rgba(0,0,0,.95) 100%)";

    if (bg) {
      bg.style.backgroundImage = overlay + ", url('" + url + "')";
      bg.style.backgroundSize = "cover";
      bg.style.backgroundRepeat = "no-repeat";
      bg.style.backgroundPosition = "center center";
      return;
    }

    viewEl.style.backgroundImage = "url('" + url + "')";
    viewEl.style.backgroundSize = "cover";
    viewEl.style.backgroundRepeat = "no-repeat";
    viewEl.style.backgroundPosition = "center center";
  }

  function setTileLabel(tileId, text) {
    var tile = qs(tileId);
    if (!tile || !tile.querySelector) return;
    var lbl = tile.querySelector(".tx-tile__label");
    if (lbl && text) lbl.textContent = String(text);
  }

  function setTileBg(tileId, url) {
    url = rewriteAssetUrl(url);
    if (!url) return;
    var tile = qs(tileId);
    if (!tile) return;
    tile.style.backgroundImage =
      "linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.75)), url('" + url + "')";
    tile.style.backgroundSize = "cover";
    tile.style.backgroundPosition = "center";
  }

  function setTileIcon(tileId, url, isBig) {
    url = rewriteAssetUrl(url);
    if (!url) return;

    var tile = qs(tileId);
    if (!tile || !tile.querySelector) return;

    var img = null;
    if (isBig) img = tile.querySelector("img.tx-route-icon--big") || tile.querySelector("img.tx-route-icon");
    else img = tile.querySelector("img.tx-route-icon");

    if (!img) {
      var wrap = tile.querySelector(".tx-tile__iconWrap");
      if (wrap) {
        img = document.createElement("img");
        img.className = "tx-route-icon" + (isBig ? " tx-route-icon--big" : "");
        img.alt = "";
        wrap.insertBefore(img, wrap.firstChild);
      }
    }

    if (img) {
      img.src = url;
      img.style.display = "block";
    }

    var emoji = tile.querySelector(isBig ? ".tx-iconBig" : ".tx-icon");
    if (emoji) emoji.style.display = "none";

    var play = tile.querySelector(".tx-tile__centerIcon");
    if (play) play.style.display = "none";
  }

  function buildRoutesLookup(app) {
    ROUTES_LIST = normalizeRoutes(app);
    ROUTES_BY_ATTR = {};
    var i, r, key;
    for (i = 0; i < ROUTES_LIST.length; i++) {
      r = ROUTES_LIST[i];
      key = r && r.route_attr ? String(r.route_attr) : "";
      if (key) ROUTES_BY_ATTR[key] = r;
    }
  }

  function hydrateFromRoutes(app) {
    if (!app) return;

    // Set logo early (welcome + home headers)
    setBrandLogo(pickHotelLogo(app));

    buildRoutesLookup(app);

    var htmlOutput = app.html_output || app.html || "";
    var htmlWelcome = slicePageFromHtmlOutput(htmlOutput, "KEY_WELCOME");
    var htmlHome = slicePageFromHtmlOutput(htmlOutput, "KEY_HOME");

    var htmlWelcomeBg = extractBgUrlFromPageHtml(htmlWelcome);
    var htmlHomeBg = extractBgUrlFromPageHtml(htmlHome);

    var welcomeRoute = ROUTES_BY_ATTR.WELCOME || findRoute(ROUTES_LIST, ["welcome"]);
    var homeRoute = ROUTES_BY_ATTR.HOME || findRoute(ROUTES_LIST, ["home"]);

    var fallbackCover = (app.hotel_covers && app.hotel_covers.length) ? app.hotel_covers[0] : "";

    setPageBg(viewWelcome,
      (welcomeRoute && welcomeRoute.route_bg) ? welcomeRoute.route_bg :
      (htmlWelcomeBg ? htmlWelcomeBg : fallbackCover)
    );

    setPageBg(viewHome,
      (homeRoute && homeRoute.route_bg) ? homeRoute.route_bg :
      (htmlHomeBg ? htmlHomeBg : fallbackCover)
    );

    var guestTitle = app.guest_title || "";
    var guestFirst = app.guest_first_name || "";
    var guestLast = app.guest_last_name || "";
    var guestFull = (guestTitle + " " + guestFirst + " " + guestLast)
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");

    var roomNumber = app.room_number || app.room_no || "101";

    setText("meta-room-w", "Room " + roomNumber);
    setText("meta-room-h", "Room " + roomNumber);

    if (guestFull) {
      setText("meta-welcome-h", "Welcome, " + guestFull);
      TEXT.en.welcomeName = guestFull.toUpperCase();
      TEXT.en.metaWelcome = "Welcome, " + guestFull;
      setText("welcome-name", TEXT.en.welcomeName);
    }

    if (app.language_attr) {
      var la = toLowerSafe(app.language_attr);
      currentLang = (la === "ar" || la.indexOf("ar") === 0) ? "ar" : "en";
      applyLang();
    }

    TILE_ROUTE = {};

    function mapTile(tileId, tests, fallbackLabel, isBigIcon, preferredAttrUpper) {
        var rt = findRoute(ROUTES_LIST, tests);

        if (rt) {
          TILE_ROUTE[tileId] = rt;

          if (rt.route_name) setTileLabel(tileId, rt.route_name);
          else if (fallbackLabel) setTileLabel(tileId, fallbackLabel);

          var bg = pick(rt, ["route_bg", "route_cover", "cover", "bg", "background"]);
          if (bg) setTileBg(tileId, bg);

          // ICON PRIORITY:
          var iconUrl = "";

          var attr = "";
          if (preferredAttrUpper) attr = String(preferredAttrUpper || "").toUpperCase();
          else attr = String(rt.route_attr || "").toUpperCase();

          if (attr) {
            iconUrl = extractMenuIconFromHomeByRouteAttr(htmlHome, attr);
          }

          if (!iconUrl) {
            var i, code;
            for (i = 0; i < tests.length; i++) {
              code = String(tests[i] || "");
              if (code.toLowerCase().indexOf("key_") === 0) {
                iconUrl = extractMenuIconFromHomeByCode(htmlHome, code);
                if (iconUrl) break;
              }
            }
          }

          if (!iconUrl) {
            iconUrl = pick(rt, ["route_icon", "icon", "icon_url"]);
          }
          // ✅ IMPORTANT: treat folder/invalid URLs as empty
          if (!isLikelyImageUrl(iconUrl)) iconUrl = "";

          if (tileId === "tile-weather" && !iconUrl) {
          // put your working PNG here (or keep it blank if you don’t want hardcode)
          iconUrl = "http:\/\/192.168.10.60\/admin-portal\/assets\/uploads\/Menus\/Menu_Icons\/b36ce629b5d7e15ce7569dbd91be0a26@3x.png";
}

          // Debugging the URL for tile-weather
          console.log("Icon URL for " + tileId + ":", iconUrl);

          if (iconUrl) setTileIcon(tileId, iconUrl, !!isBigIcon);
        } else {
          if (fallbackLabel) setTileLabel(tileId, fallbackLabel);
        }
      }


    mapTile("tile-dining",  ["key_dining_in_room","dining_in_room","in-room dining","room dining","dining"], "In-Room Dining", true);

    mapTile("tile-movies",  ["key_vod","vod","movies","movie"], "Movies", false, null);
    mapTile("tile-special", ["key_special_offers","special_offers","offers","promotion"], "Special Offers", false, null);

    mapTile("tile-hotelinfo",   ["key_our_services","our_services","hotel info","hotel information","information"], "Hotel Information", false, null);
    mapTile("tile-roomservice", ["key_hotel_services","hotel_service","roomservice"], "Room Service", false, null);
    mapTile("tile-spa", ["key_facilities","facilities","key_facility"], "Wellness & Spa", false, null);
    mapTile("tile-restaurants", ["key_dining_all_day","dining_all_day","restaurant"], "Restaurants", false, null);
    mapTile("tile-discover",    ["key_attractions","attractions","discover","city"], "Discover City", false, null);
    mapTile("tile-prayer",      ["key_prayer_time","prayer_time","shop"], "Prayer", false, null);

    mapTile("tile-music",       ["key_music","music"], "Music", false, null);
    mapTile("tile-tv",          ["key_tv","tv","tv_channels","television","channels"], "TV", false, null);
    mapTile("tile-weather",     ["key_weather","weather","temperature"], "Weather", false, null);
    mapTile("tile-clock",       ["key_world_clock","world_clock","clock"], "Clock", false, null);
    mapTile("tile-roomcontrol", ["key_room_control","room_control","controls","iot"], "Room Control", false, null);
    mapTile("tile-cart",        ["key_cart","cart","view_cart","basket"], "Cart", false, null);
    mapTile("tile-messages",    ["key_messages","messages","inbox"], "Messages", false, null);
    mapTile("tile-viewbill",    ["view bill","bill","folio"], "View Bill", false, null);
  }

  // ===================== API LOAD =====================

  function loadAppData() {
    if (!window.TenxApi || typeof window.TenxApi.getAppDataNormalized !== "function") {
      log("TenxApi not available. Check index.html script order/paths.");
      return;
    }

    log("Loading app_json via TenxApi…", window.TenxApi.HOST);

    window.TenxApi.getAppDataNormalized().then(function (app) {
      APP_DATA = app;
      log("app_json loaded");
      hydrateFromRoutes(app);
    }, function (err) {
      log("app_json error:", err);
    });
  }

  function changeLang(nextLang) {
    var nextId = LANG_ID[nextLang] || 1;

    if (!window.TenxApi || typeof window.TenxApi.changeGuestLang !== "function") {
      currentLang = nextLang;
      applyLang();
      return;
    }

    window.TenxApi.changeGuestLang({ language_id: nextId }).then(function () {
      currentLang = nextLang;
      applyLang();
      loadAppData();
    }, function (err) {
      log("changeGuestLang error:", err);
      currentLang = nextLang;
      applyLang();
    });
  }
// Decide which view to show based on URL hash.
// This must exist before BOOT uses it.
function routeFromHash() {
  var h = (window.location.hash || "#/welcome").toLowerCase();

  // Optional: if you ever use #/weather directly
  if (h.indexOf("#/weather") === 0) { showView("weather"); return; }

  if (h.indexOf("#/home") === 0) showView("home");
  else showView("welcome");
}

  // ===================== BOOT =====================

  window.addEventListener("resize", fitStage);
  window.addEventListener("hashchange", routeFromHash);
  document.addEventListener("keydown", onKeyDown);

  fitStage();
  updateClock();
  setInterval(updateClock, 15000);

  forceWelcomeOnBoot();
  applyLang();
  routeFromHash();

  setTimeout(loadAppData, 50);

}());
