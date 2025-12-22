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
  var viewMusic = document.getElementById("view-music");
    // Global topbar state (so language switch can re-apply)
  var GUEST_FULL = "";
  var ROOM_NO = "";
  var TEMP_TXT = "";


  

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
  var PAGE_ROUTE_BY_KEY = {}; // KEY_MUSIC -> parent_id 0 / GET_DATALIST route
  var TILE_ROUTE_BY_KEY = {}; // KEY_MUSIC -> parent_id != 0 / XMAIN_* route


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

    // ===================== STARTUP RULE (welcome once) =====================
  var LS_WELCOME_SEEN = "tenx_welcome_seen_v1";

  function hasSeenWelcome() {
    try { return localStorage.getItem(LS_WELCOME_SEEN) === "1"; } catch (e) { return false; }
  }

  function markWelcomeSeen() {
    try { localStorage.setItem(LS_WELCOME_SEEN, "1"); } catch (e) {}
  }

  function setText(id, txt) {
    var el = qs(id);
    if (!el) return;
    el.textContent = (txt == null) ? "" : String(txt);
  }

  function pad2(n) { n = String(n); return n.length < 2 ? ("0" + n) : n; }

function updateClock() {
  var d = new Date();

  var hh = d.getHours();
  var mm = d.getMinutes();
  var time = (hh < 10 ? "0" + hh : "" + hh) + ":" + (mm < 10 ? "0" + mm : "" + mm);

  var mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  var dd = d.getDate();
  var date = (dd < 10 ? "0" + dd : "" + dd) + " " + mons[d.getMonth()] + " " + d.getFullYear();

  // ✅ Global topbar ids (only ones that exist now)
  setText("meta-time", "⏱️ " + time);
  setText("meta-date", date);
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

  var img = qs("brand-logo");
  var txt = qs("brand-text");
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
// ✅ route_bg can sometimes be:
// 1) normal url string: "http://.../bg.png"
// 2) filename only: "abc@3x.png"
// 3) JSON string from DB like: [{"image":"...png","isActive":"true"}]
// This helper always returns the best usable image/url string.
function resolveRouteBgValue(routeBg) {
  var s = routeBg;

  // already an object/array? try to read it
  if (s && typeof s === "object") {
    try {
      if (Object.prototype.toString.call(s) === "[object Array]") {
        if (s.length && (s[0].image || s[0].url)) return s[0].image || s[0].url;
      } else {
        if (s.image || s.url) return s.image || s.url;
      }
    } catch (e) {}
    return "";
  }

  s = String(s || "").replace(/^\s+|\s+$/g, "");
  if (!s) return "";

  // if it looks like JSON text, parse it
  if (s.charAt(0) === "[" || s.charAt(0) === "{") {
    try {
      var obj = JSON.parse(s);

      if (Object.prototype.toString.call(obj) === "[object Array]") {
        var i;
        for (i = 0; i < obj.length; i++) {
          if (!obj[i]) continue;
          if (String(obj[i].isActive) === "true" || obj[i].isActive === 1 || obj[i].isActive === true) {
            return obj[i].image || obj[i].url || "";
          }
        }
        // fallback first
        if (obj.length) return obj[0].image || obj[0].url || "";
      } else {
        return obj.image || obj.url || "";
      }
    } catch (e2) {
      // not valid JSON -> ignore
    }
  }

  // plain string path/url
  return s;
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
  function setTopbarTheme(viewName) {
  var tb = qs("tx-topbar");
  if (!tb) return;
  tb.className = "tx-topbar tx-topbar--global";
}


 function showView(name) {
  // leaving weather? tell module to hide
  if (currentView === "weather" && name !== "weather") {
    if (window.WeatherPage && typeof window.WeatherPage.onHide === "function") {
      window.WeatherPage.onHide();
    }
  }

  // leaving tv? tell module to hide
  if (currentView === "tv" && name !== "tv") {
    if (window.TVChannels && typeof window.TVChannels.unmount === "function") {
      window.TVChannels.unmount();
    }
  }
    // leaving music? tell module to close
  if (currentView === "music" && name !== "music") {
    if (window.MusicPage && typeof window.MusicPage.close === "function") {
      window.MusicPage.close();
    }
  }
  // set topbar theme
  setTopbarTheme(name);


  // ===== TV VIEW =====
  if (name === "tv") {
    prevView = currentView || "home";
    currentView = "tv";

    if (viewWelcome) viewWelcome.className = "tx-view";
    if (viewHome) viewHome.className = "tx-view";
    if (viewWeather) viewWeather.className = "tx-view";
    if (viewTV) viewTV.className = "tx-view is-active";

    // Mount TV Channels
    // Mount TV Channels (tvchannels.js parses KEY_TV itself from appJson.html_output)
    try {
      if (window.TVChannels && typeof window.TVChannels.mount === "function") {
        window.TVChannels.mount({ appJson: APP_DATA });
      }
    } catch (e) {
      log("Error mounting TV channels: " + (e && e.message ? e.message : e));
    }


    return;
  }

  // ===== WEATHER VIEW =====
  if (name === "weather") {
    prevView = currentView || "home";
    currentView = "weather";

    if (viewWelcome) viewWelcome.className = "tx-view";
    if (viewHome) viewHome.className = "tx-view";
    if (viewWeather) viewWeather.className = "tx-view is-active";
    if (viewTV) viewTV.className = "tx-view";
    var wRt = PAGE_ROUTE_BY_KEY["KEY_WEATHER"];
    if (wRt && wRt.route_bg) setPageBg(viewWeather, resolveRouteBgValue(wRt.route_bg));

    if (window.WeatherPage && typeof window.WeatherPage.onShow === "function") {
      window.WeatherPage.onShow(APP_DATA);
    }
    return;
  }

    // ===== MUSIC VIEW =====
  if (name === "music") {
    prevView = currentView || "home";
    currentView = "music";

    if (viewWelcome) viewWelcome.className = "tx-view";
    if (viewHome) viewHome.className = "tx-view";
    if (viewWeather) viewWeather.className = "tx-view";
    if (viewTV) viewTV.className = "tx-view";
    if (viewMusic) viewMusic.className = "tx-view is-active";

    // open Music (needs the KEY_MUSIC route object)
    try {
    // ✅ PAGE music route must be parent_id = 0 (GET_DATALIST)
    var rt = PAGE_ROUTE_BY_KEY["KEY_MUSIC"];

    if (!rt) {
      // fallback: pick parent_id=0 manually
      var i;
      for (i = 0; i < ROUTES_LIST.length; i++) {
        if (ROUTES_LIST[i] &&
            String(ROUTES_LIST[i].route_key || "").toUpperCase() === "KEY_MUSIC" &&
            String(ROUTES_LIST[i].route_parent_id || "") === "0") {
          rt = ROUTES_LIST[i];
          break;
        }
      }
    }
    if (rt && rt.route_bg) setPageBg(viewMusic, resolveRouteBgValue(rt.route_bg));

    if (window.MusicPage && typeof window.MusicPage.open === "function") {
      window.MusicPage.open(rt);
    }


    } catch (e) {
      log("Error opening music: " + (e && e.message ? e.message : e));
    }

    return;
  }

  // ===== NORMAL VIEWS =====
  currentView = name;

  // always hide weather and tv when not on them
  if (viewWeather) viewWeather.className = "tx-view";
  if (viewTV) viewTV.className = "tx-view";
  if (viewMusic) viewMusic.className = "tx-view";


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
  html = String(html || "");
  if (!html) return [];

  var channelList = [];
  var regex = /<li[^>]*class="[^"]*subnav_item[^"]*"[^>]*data-id="([^"]*)"[^>]*data-name="([^"]*)"[^>]*data-channel-number="([^"]*)"[^>]*data-channel-url="([^"]*)"[^>]*>/gi;
  var match;
  
  while ((match = regex.exec(html)) !== null) {
    var id = match[1] || "";
    var name = match[2] || "";
    var number = match[3] || "";
    var url = match[4] || "";
    
    // Extract logo URL from img tag within this <li>
    var liStart = match.index;
    var liEnd = html.indexOf("</li>", liStart);
    if (liEnd === -1) liEnd = html.length;
    
    var liContent = html.substring(liStart, liEnd);
    var logoMatch = /<img[^>]+data-src="([^"]*)"/i.exec(liContent);
    if (!logoMatch) {
      logoMatch = /<img[^>]+src="([^"]*)"/i.exec(liContent);
    }
    var logoUrl = logoMatch ? logoMatch[1] : "";

    if (id && name && url) {
      channelList.push({
        id: id,
        name: name,
        number: number,
        url: url,
        logo: logoUrl
      });
    }
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
        if (welcomeFocusIndex === 0) {
      markWelcomeSeen();
      window.location.hash = "#/home";
    }

    if (welcomeFocusIndex === 1) {
      showView("tv");
      return;
    }
    if (welcomeFocusIndex === 2) {
      changeLang((currentLang === "en") ? "ar" : "en");
      return;
    }

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
    // ✅ Open Music page
  if (tileId === "tile-music") {
    showView("music");
    return;
  }


  if (rt) {
    alert("Open: " + (rt.route_name || tileId) + " (route_id=" + (rt.route_id || "") + ")");
    return;
  }

  alert("Open: " + tileId + " (not mapped yet)");
}


function onKeyDown(e) {
  var k = e.keyCode || e.which || 0;

  var LEFT=37, UP=38, RIGHT=39, DOWN=40, OK=13;
  var BACK1=8, BACK2=461, BACK3=10009, BACK4=27;

  // ✅ U = Back (requested)
  if (k === 85) {
    e.preventDefault();

    // Weather: go back to previous view
    if (currentView === "weather") {
      showView(prevView || "home");
      return;
    }
        // Music: go back to previous view
    if (currentView === "music") {
      showView(prevView || "home");
      return;
    }

    // TV: if fullscreen -> exit fullscreen FIRST (stay on TV page)
    if (currentView === "tv") {
      if (window.TVChannels && typeof window.TVChannels.handleKeyDown === "function") {
        // send a BACK key to TVChannels so it exits fullscreen
        if (window.TVChannels.handleKeyDown({ keyCode: 461, which: 461 })) {
          return; // fullscreen closed, still on TV channels page ✅
        }
      }
      // not fullscreen => now close TV page
      showView(prevView || "home");
      return;
    }

    // Normal views
    onBack();
    return;
  }

  // ✅ R = Home (requested)
  if (k === 82) {
    e.preventDefault();
    showView("home");
    return;
  }

  // ===============================
  // 1) WEATHER: delegate FIRST
  // ===============================
  if (currentView === "weather") {
    if (window.WeatherPage && typeof window.WeatherPage.handleKey === "function") {
      if (window.WeatherPage.handleKey(k)) { e.preventDefault(); return; }
    }

    // If module didn't consume BACK, close weather
    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      e.preventDefault();
      showView(prevView || "home");
      return;
    }

    // Do not let home onOk run in weather
    if (k === OK) { e.preventDefault(); return; }

    return;
  }

  // ===============================
  // 2) TV: delegate FIRST
  // ===============================
  if (currentView === "tv") {
    if (window.TVChannels && typeof window.TVChannels.handleKeyDown === "function") {
      if (window.TVChannels.handleKeyDown(e)) { e.preventDefault(); return; }
    }

    // If TV didn't consume BACK, close TV view
    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      e.preventDefault();
      showView(prevView || "home");
      return;
    }

    // Do not let home onOk run in TV
    if (k === OK) { e.preventDefault(); return; }

    return;
  }
    // ===============================
  // 2.5) MUSIC: delegate FIRST
  // ===============================
  if (currentView === "music") {
    if (window.MusicPage && typeof window.MusicPage.onKeyDown === "function") {
      if (window.MusicPage.onKeyDown(e)) { e.preventDefault(); return; }
    }

    // If module didn't consume BACK, close music
    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      e.preventDefault();
      showView(prevView || "home");
      return;
    }

    // Do not let home onOk run in music
    if (k === OK) { e.preventDefault(); return; }

    return;
  }

  // ===============================
  // 3) NORMAL VIEWS: OK / BACK
  // ===============================
  if (k === OK) { e.preventDefault(); onOk(); return; }

  if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
    e.preventDefault();
    onBack();
    return;
  }

  // ===============================
  // 4) Welcome navigation
  // ===============================
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

  // ===============================
  // 5) Home navigation
  // ===============================
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
  function extractTileBgFromHomeByCode(homeHtml, code) {
  homeHtml = String(homeHtml || "");
  code = String(code || "");
  if (!homeHtml || !code) return "";

  var up = code.toUpperCase();
  var needle1 = 'data-code="' + up + '"';
  var needle2 = "data-code='" + up + "'";

  var lastIdx = -1, idx = -1;
  idx = homeHtml.toUpperCase().indexOf(needle1.toUpperCase());
  while (idx >= 0) { lastIdx = idx; idx = homeHtml.toUpperCase().indexOf(needle1.toUpperCase(), idx + 1); }

  if (lastIdx < 0) {
    idx = homeHtml.toUpperCase().indexOf(needle2.toUpperCase());
    while (idx >= 0) { lastIdx = idx; idx = homeHtml.toUpperCase().indexOf(needle2.toUpperCase(), idx + 1); }
  }
  if (lastIdx < 0) return "";

  var liStart = homeHtml.lastIndexOf("<li", lastIdx);
  if (liStart < 0) return "";
  var liEnd = homeHtml.indexOf("</li", lastIdx);
  if (liEnd < 0) liEnd = homeHtml.length;

  var liHtml = homeHtml.slice(liStart, liEnd);

  // try inline style background-image:url(...)
  var m = /background-image\s*:\s*url\(([^)]+)\)/i.exec(liHtml);
  if (m && m[1]) {
    var raw = String(m[1]).replace(/^\s+|\s+$/g, "").replace(/^[\"']/, "").replace(/[\"']$/, "");
    return raw;
  }

  // try data-bg / data-background
  m = /data-(?:bg|background)\s*=\s*[\"']([^"']+)[\"']/i.exec(liHtml);
  if (m && m[1]) return m[1];

  return "";
}

function extractTileBgFromHomeByRouteAttr(homeHtml, routeAttr) {
  // fallback: just reuse code version by searching the LI chunk around routeAttr token
  homeHtml = String(homeHtml || "");
  routeAttr = String(routeAttr || "");
  if (!homeHtml || !routeAttr) return "";

  var token = routeAttr.toLowerCase();
  var upper = homeHtml.toLowerCase();
  var last = -1, at = upper.indexOf(token);
  while (at >= 0) { last = at; at = upper.indexOf(token, at + 1); }
  if (last < 0) return "";

  var liStart = homeHtml.lastIndexOf("<li", last);
  if (liStart < 0) return "";
  var liEnd = homeHtml.indexOf("</li", last);
  if (liEnd < 0) liEnd = homeHtml.length;

  var liHtml = homeHtml.slice(liStart, liEnd);

  var m = /background-image\s*:\s*url\(([^)]+)\)/i.exec(liHtml);
  if (m && m[1]) {
    var raw = String(m[1]).replace(/^\s+|\s+$/g, "").replace(/^[\"']/, "").replace(/[\"']$/, "");
    return raw;
  }

  m = /data-(?:bg|background)\s*=\s*[\"']([^"']+)[\"']/i.exec(liHtml);
  if (m && m[1]) return m[1];

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
    if (!isLikelyImageUrl(url)) return;
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
function getRouteKeyFromTests(tests) {
  var i, t;
  for (i = 0; i < (tests ? tests.length : 0); i++) {
    t = String(tests[i] || "");
    if (t.toLowerCase().indexOf("key_") === 0) return t.toUpperCase(); // e.g. KEY_MUSIC
  }
  return "";
}

function findByKey(routeKey, wantTile) {
  // wantTile=true => parent_id != 0
  // wantTile=false => parent_id == 0
  var i, rt, k, pid;
  routeKey = String(routeKey || "").toUpperCase();
  if (!routeKey) return null;

  for (i = 0; i < ROUTES_LIST.length; i++) {
    rt = ROUTES_LIST[i];
    if (!rt) continue;

    k = String(rt.route_key || "").toUpperCase();
    if (k !== routeKey) continue;

    pid = String(rt.route_parent_id || "");
    if (wantTile) {
      if (pid !== "0") return rt;
    } else {
      if (pid === "0") return rt;
    }
  }
  return null;
}

function buildRouteKeyLookups() {
  PAGE_ROUTE_BY_KEY = {};
  TILE_ROUTE_BY_KEY = {};

  var i, rt, k, pid;

  for (i = 0; i < ROUTES_LIST.length; i++) {
    rt = ROUTES_LIST[i];
    if (!rt) continue;

    k = String(rt.route_key || "").toUpperCase();
    if (!k) continue;

    pid = String(rt.route_parent_id == null ? "" : rt.route_parent_id);
    pid = pid.replace(/^\s+|\s+$/g, ""); // ✅ trim spaces

    if (pid === "0") {
      PAGE_ROUTE_BY_KEY[k] = rt;     // parent_id=0 => page route
    } else {
      TILE_ROUTE_BY_KEY[k] = rt;     // parent_id!=0 => tile route
    }
  }
}



  function hydrateFromRoutes(app) {
    if (!app) return;

    // Set logo early (welcome + home headers)
    setBrandLogo(pickHotelLogo(app));

    buildRoutesLookup(app);
    buildRouteKeyLookups();
    log("KEY_MUSIC tileRt=", !!TILE_ROUTE_BY_KEY["KEY_MUSIC"], "pageRt=", !!PAGE_ROUTE_BY_KEY["KEY_MUSIC"]);


    (function () {
      var i, rt;
      for (i = 0; i < ROUTES_LIST.length; i++) {
        rt = ROUTES_LIST[i];
        if (rt && String(rt.route_key || "").toUpperCase() === "KEY_MUSIC") {
          log("[KEY_MUSIC route in payload]", "id=", rt.route_id, "parent=", rt.route_parent_id, "bg=", rt.route_bg);
        }
      }
    })();




    var htmlOutput = app.html_output || app.html || "";
    var htmlWelcome = slicePageFromHtmlOutput(htmlOutput, "KEY_WELCOME");
    var htmlHome = slicePageFromHtmlOutput(htmlOutput, "KEY_HOME");

    var htmlWelcomeBg = extractBgUrlFromPageHtml(htmlWelcome);
    var htmlHomeBg = extractBgUrlFromPageHtml(htmlHome);

    var welcomeRoute = ROUTES_BY_ATTR.WELCOME || findRoute(ROUTES_LIST, ["welcome"]);
    var homeRoute = ROUTES_BY_ATTR.HOME || findRoute(ROUTES_LIST, ["home"]);

    var fallbackCover = (app.hotel_covers && app.hotel_covers.length) ? app.hotel_covers[0] : "";

      setPageBg(viewWelcome,
        (welcomeRoute && welcomeRoute.route_bg) ? resolveRouteBgValue(welcomeRoute.route_bg) :
        (htmlWelcomeBg ? htmlWelcomeBg : fallbackCover)
      );

      setPageBg(viewHome,
        (homeRoute && homeRoute.route_bg) ? resolveRouteBgValue(homeRoute.route_bg) :
        (htmlHomeBg ? htmlHomeBg : fallbackCover)
      );

 // ===================== PAGE BACKGROUNDS (parent_id = 0 only) =====================
// Function to apply page background (parent_id == 0)
function applyPageBg(viewEl, routeKey) {
  var pageRt = PAGE_ROUTE_BY_KEY[routeKey] || findByKey(routeKey, false); // Get route for page (parent_id == 0)
  var pageBg = pageRt ? resolveRouteBgValue(pageRt.route_bg) : "";

  if (isLikelyImageUrl(pageBg)) {
    setPageBg(viewEl, pageBg); // Apply background to the page
  } else {
    // Optionally, clear if no background is found
    viewEl.style.backgroundImage = "";
  }
}

// Apply page background for weather and music pages
applyPageBg(viewWeather, "KEY_WEATHER");
applyPageBg(viewMusic, "KEY_MUSIC");



    var guestTitle = app.guest_title || "";
    var guestFirst = app.guest_first_name || "";
    var guestLast  = app.guest_last_name || "";

    var guestFull = (guestTitle + " " + guestFirst + " " + guestLast)
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");

    var roomNumber = app.room_number || app.room_no || "101";

    // store global values (optional, but good)
    GUEST_FULL = guestFull || "";
    ROOM_NO = roomNumber || "";

    // ✅ ONLY global topbar ids
    setText("meta-room", "Room " + (ROOM_NO || "—"));
    setText("meta-welcome", GUEST_FULL ? ("Welcome, " + GUEST_FULL) : "Welcome, —");

    // ✅ welcome screen big name only (not topbar)
    if (GUEST_FULL) {
      TEXT.en.welcomeName = GUEST_FULL.toUpperCase();
      setText("welcome-name", TEXT.en.welcomeName);
    }




    

    if (app.language_attr) {
      var la = toLowerSafe(app.language_attr);
      currentLang = (la === "ar" || la.indexOf("ar") === 0) ? "ar" : "en";
      applyLang();
    }

    TILE_ROUTE = {};

function clearTileBg(tileId) {
  var tEl = qs(tileId);
  if (!tEl) return;
  tEl.style.backgroundImage = "";
  tEl.style.backgroundSize = "";
  tEl.style.backgroundPosition = "";
}
function mapTile(tileId, tests, fallbackLabel, isBigIcon, preferredAttrUpper) {
  var routeKey = getRouteKeyFromTests(tests); // e.g. "KEY_MUSIC"
  var tileRt = null;  // parent_id != 0 (tile styling)
  var pageRt = null;  // parent_id == 0 (page logic)

  // Resolve both variants by KEY_*
  if (routeKey) {
    tileRt = (TILE_ROUTE_BY_KEY && TILE_ROUTE_BY_KEY[routeKey]) ? TILE_ROUTE_BY_KEY[routeKey] : findByKey(routeKey, true);
    pageRt = (PAGE_ROUTE_BY_KEY && PAGE_ROUTE_BY_KEY[routeKey]) ? PAGE_ROUTE_BY_KEY[routeKey] : findByKey(routeKey, false);
  }

  // Fallback fuzzy route (but do NOT let it decide tile bg)
  var fuzzy = findRoute(ROUTES_LIST, tests);
  if (!pageRt && fuzzy && String(fuzzy.route_parent_id || "") === "0") pageRt = fuzzy;
  if (!tileRt && fuzzy && String(fuzzy.route_parent_id || "") !== "0") tileRt = fuzzy;

  // What route should clicking/OK represent? -> PAGE route (parent 0)
  // (If pageRt missing, fall back to whatever exists)
  var rtForAction = pageRt || tileRt || fuzzy || null;
  if (rtForAction) TILE_ROUTE[tileId] = rtForAction;

  // Label: prefer tile label (usually matches menu tile naming), else page label
  var labelRt = tileRt || pageRt || fuzzy;
  if (labelRt && labelRt.route_name) setTileLabel(tileId, labelRt.route_name);
  else if (fallbackLabel) setTileLabel(tileId, fallbackLabel);

  // =========================
  // TILE BACKGROUND (IMPORTANT)
  // =========================
  // Only use TILE variant bg (parent != 0). Never use pageRt bg for the tile.
  var tileBg = "";
  if (tileRt) {
    tileBg = resolveRouteBgValue(pick(tileRt, ["route_bg","route_cover","cover","bg","background"]));
  }

  // If tile route bg missing, try extract from html_home itself (many TenX payloads have tile bg there)
  if (!tileBg) {
    var attr = preferredAttrUpper ? String(preferredAttrUpper || "").toUpperCase() : String((tileRt && tileRt.route_attr) || (pageRt && pageRt.route_attr) || "");
    if (attr) tileBg = extractTileBgFromHomeByRouteAttr(htmlHome, attr);

    if (!tileBg) {
      var i, code;
      for (i = 0; i < tests.length; i++) {
        code = String(tests[i] || "");
        if (code.toLowerCase().indexOf("key_") === 0) {
          tileBg = extractTileBgFromHomeByCode(htmlHome, code);
          if (tileBg) break;
        }
      }
    }
  }

  if (tileBg) setTileBg(tileId, tileBg);

  // =========================
  // TILE ICON (same logic as before)
  // =========================
  var iconUrl = "";
  var attr2 = preferredAttrUpper ? String(preferredAttrUpper || "").toUpperCase()
                                 : String(((tileRt && tileRt.route_attr) || (pageRt && pageRt.route_attr) || "")).toUpperCase();

  if (attr2) iconUrl = extractMenuIconFromHomeByRouteAttr(htmlHome, attr2);

  if (!iconUrl) {
    var j, code2;
    for (j = 0; j < tests.length; j++) {
      code2 = String(tests[j] || "");
      if (code2.toLowerCase().indexOf("key_") === 0) {
        iconUrl = extractMenuIconFromHomeByCode(htmlHome, code2);
        if (iconUrl) break;
      }
    }
  }

  if (!iconUrl) {
    // Prefer tile route icon if available
    iconUrl = pick(tileRt || pageRt || fuzzy, ["route_icon","icon","icon_url"]);
  }

  if (!isLikelyImageUrl(iconUrl)) iconUrl = "";

  if (tileId === "tile-weather" && !iconUrl) {
    iconUrl = "http://192.168.10.60/admin-portal/assets/uploads/Menus/Menu_Icons/b36ce629b5d7e15ce7569dbd91be0a26@3x.png";
  }

  if (iconUrl) setTileIcon(tileId, iconUrl, !!isBigIcon);
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
      // If TV view is already open, push fresh appJson into the module
      if (currentView === "tv" && window.TVChannels && typeof window.TVChannels.updateAppJson === "function") {
          window.TVChannels.updateAppJson(APP_DATA);
        }

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
  var raw = (window.location.hash || "");
  var h = raw.toLowerCase();

  // Explicit routes always win
  if (h.indexOf("#/welcome") === 0) { showView("welcome"); return; }
  if (h.indexOf("#/home") === 0)    { showView("home"); return; }
  if (h.indexOf("#/weather") === 0) { showView("weather"); return; }
  if (h.indexOf("#/music") === 0)   { showView("music"); return; }


  // No hash or unknown hash:
  // - First ever load -> welcome
  // - Later reloads -> home
  if (hasSeenWelcome()) showView("home");
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
