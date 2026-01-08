// home.js (ES5 / Tizen 4 safe) - FIXED PARENT_ID LOGIC
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
  var viewMessages = document.getElementById("view-messages");
  var viewVOD = document.getElementById("view-vod");
  var viewFacilities = document.getElementById("view-facilities");
  var viewHotelInfo = document.getElementById("view-hotelinfo");
  var viewRoomService = document.getElementById("view-roomservice");
  var viewDining = document.getElementById("view-dining");
  var viewCart = document.getElementById("view-cart");
  var viewBill = document.getElementById("view-bill");
  var viewRestaurants = document.getElementById("view-restaurants");
  var viewDiscoverCity = document.getElementById("view-discovercity");
  var viewPrayer = document.getElementById("view-prayer");
  var viewFeedback = document.getElementById("view-feedback");



  
  var GUEST_FULL = "";
  var ROOM_NO = "";
  
  var btnContinue = document.getElementById("btn-continue");
  var toggleTV = document.getElementById("toggle-tv");
  var toggleLang = document.getElementById("toggle-lang");

  var currentView = "welcome";
  var currentLang = "en";
  var LANG_ID = { en: 1, ar: 2 };

  var APP_DATA = null;
  var ROUTES_BY_ATTR = {};
  var ROUTES_LIST = [];
  var TILE_ROUTE = {};
  var PAGE_ROUTE_BY_KEY = {};
  var TILE_ROUTE_BY_KEY = {};

  // ✅ NEW: Define which tiles need backgrounds
  var TILES_WITH_BACKGROUNDS = [
    "KEY_OUR_SERVICES",
    "KEY_HOTEL_SERVICES",
    "KEY_ATTRACTIONS", 
    "KEY_VOD",
    "KEY_FACILITIES",
    "KEY_DINING_ALL_DAY",
    "KEY_PRAYER_TIME",
    "KEY_SPECIAL_OFFERS"
  ];

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

    // ===================== BOOT LOADER (WELCOME ONLY) =====================
  var txLoaderEl = document.getElementById("tx-loader");

  function loaderShow() {
    if (!txLoaderEl) return;
    if (txLoaderEl.className.indexOf("is-on") < 0) txLoaderEl.className += " is-on";
  }

  function loaderHide() {
    if (!txLoaderEl) return;
    txLoaderEl.className = txLoaderEl.className.replace(/\bis-on\b/g, "").replace(/\s+/g, " ").replace(/^\s+|\s+$/g, "");
  }

  function getBgUrlFromEl(el) {
    if (!el || !el.querySelector) return "";
    var bg = null;
    try { bg = el.querySelector(".tx-bg, .fc-bg"); } catch (e) { bg = null; }
    if (!bg) return "";

    var s = "";
    try { s = bg.style.backgroundImage || ""; } catch (e2) { s = ""; }
    if (!s) return "";

    // handles: linear-gradient(...), url('...')
    var m = /url\(\s*['"]?([^'")]+)['"]?\s*\)/i.exec(s);
    return (m && m[1]) ? m[1] : "";
  }

  function preloadImage(url, cb) {
    url = String(url || "");
    if (!url) { cb && cb(); return; }

    var done = false;
    function finish() { if (done) return; done = true; cb && cb(); }

    try {
      var img = new Image();
      img.onload = finish;
      img.onerror = finish;
      img.src = url;

      // if cached
      if (img.complete) finish();
      // failsafe
      setTimeout(finish, 3500);
    } catch (e) {
      cb && cb();
    }
  }

  function waitImgEl(imgEl, cb) {
    if (!imgEl || !imgEl.src) { cb && cb(); return; }

    // if already loaded
    try {
      if (imgEl.complete && imgEl.naturalWidth > 0) { cb && cb(); return; }
    } catch (e) {}

    var done = false;
    function finish() { if (done) return; done = true; cb && cb(); }

    imgEl.onload = finish;
    imgEl.onerror = finish;

    // failsafe
    setTimeout(finish, 3500);
  }

  function hideLoaderWhenWelcomeReady() {
    // Only care about boot welcome.
    if (currentView !== "welcome") { loaderHide(); return; }

    var pending = 0;
    var done = false;

    function oneDone() {
      pending--;
      if (pending <= 0) finish();
    }

    function finish() {
      if (done) return;
      done = true;
      loaderHide();
    }

    // Wait welcome bg image (after hydrateFromRoutes applied it)
    var bgUrl = getBgUrlFromEl(viewWelcome);
    if (bgUrl) { pending++; preloadImage(bgUrl, oneDone); }

    // Wait brand logo if it’s shown
    var logoEl = qs("brand-logo");
    if (logoEl && logoEl.style && logoEl.style.display !== "none" && logoEl.src) {
      pending++;
      waitImgEl(logoEl, oneDone);
    }

    // If nothing to wait, hide immediately
    if (pending === 0) finish();

    // Global failsafe (never keep loader forever)
    setTimeout(finish, 4500);
  }


  function log() {
    try { if (window.console && console.log) console.log.apply(console, arguments); } catch (e) {}
  }

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

  // function pad2(n) { n = String(n); return n.length < 2 ? ("0" + n) : n; }

  function updateClock() {
    var d = new Date();
    var hh = d.getHours();
    var mm = d.getMinutes();
    var time = (hh < 10 ? "0" + hh : "" + hh) + ":" + (mm < 10 ? "0" + mm : "" + mm);

    var mons = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    var dd = d.getDate();
    var date = (dd < 10 ? "0" + dd : "" + dd) + " " + mons[d.getMonth()] + " " + d.getFullYear();

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

    return url.replace(/^https?:\/\/[^\/]+/i, origin);
  }

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
    if (u.charAt(u.length - 1) === "/") return false;
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

  function resolveRouteBgValue(routeBg) {
    var s = routeBg;

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
          if (obj.length) return obj[0].image || obj[0].url || "";
        } else {
          return obj.image || obj.url || "";
        }
      } catch (e2) {}
    }

    return s;
  }

  function pickHotelLogo(app) {
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

  var welcomeFocusIndex = 0;
  var welcomeFocusEls = [btnContinue, toggleTV, toggleLang];

  function setWelcomeFocus(idx) {
    clearFocus();
    welcomeFocusIndex = idx;
    var el = welcomeFocusEls[idx];
    if (el) el.className += " is-focused";
  }
  // ✅ Remember last focused tile on Home (movement) + last selected tile (OK/open)
  var lastHomeFocusId = "tile-hotelinfo";
  var lastHomeSelectedId = ""; // set when you press OK to open a page


  var homePos = { r: 0, c: 0 };
  var HOME_NAV = [
  ["tile-hotelinfo", "tile-roomservice", "tile-movies", "tile-movies", "tile-music", "tile-tv"],
  ["tile-spa", "tile-restaurants", "tile-movies", "tile-movies", "tile-weather", "tile-clock"],
  ["tile-dining", "tile-discover", "tile-apps", "tile-cart", "tile-special", "tile-special"],
  ["tile-dining", "tile-prayer", "tile-messages", "tile-viewbill", "tile-roomcontrol", "tile-feedback"]
];


function setHomeFocusById(id) {
  clearFocus();
  var el = qs(id);

  if (el) {
    el.className += " is-focused";
    // ✅ track last focused tile (for returning to Home)
    lastHomeFocusId = id;
  }

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
    if (currentView === "weather" && name !== "weather") {
      if (window.WeatherPage && typeof window.WeatherPage.onHide === "function") {
        window.WeatherPage.onHide();
      }
    }

    if (currentView === "tv" && name !== "tv") {
      if (window.TVChannels && typeof window.TVChannels.unmount === "function") {
        window.TVChannels.unmount();
      }
    }

    if (currentView === "music" && name !== "music") {
      if (window.MusicPage && typeof window.MusicPage.close === "function") {
        window.MusicPage.close();
      }
    }
    if (currentView === "messages" && name !== "messages") {
      if (window.MessagesPage && typeof window.MessagesPage.hide === "function") {
      window.MessagesPage.hide();
      }
    }
    if (currentView === "vod" && name !== "vod") {
      if (window.VODPage && typeof window.VODPage.close === "function") {
      window.VODPage.close();
      }
    }
    if (currentView === "facilities" && name !== "facilities") {
      if (window.FacilitiesPage && typeof window.FacilitiesPage.close === "function") {
      window.FacilitiesPage.close();
      }
    }
    if (currentView === "hotelinfo" && name !== "hotelinfo") {
      if (window.HotelInfoPage && typeof window.HotelInfoPage.close === "function") {
        window.HotelInfoPage.close();
      }
    }
    if (currentView === "roomservice" && name !== "roomservice") {
        if (window.RoomServicePage && typeof window.RoomServicePage.close === "function") {
          window.RoomServicePage.close();
        }
      }
      if (currentView === "dining" && name !== "dining") {
      if (window.DiningPage && typeof window.DiningPage.close === "function") {
        window.DiningPage.close();
      }
    }
    if (currentView === "cart" && name !== "cart") {
      if (window.CartPage && typeof window.CartPage.close === "function") {
        window.CartPage.close();
      }
    }

    if (currentView === "bill" && name !== "bill") {
      if (window.BillPage && typeof window.BillPage.close === "function") {
        window.BillPage.close();
      }
    }
    if (currentView === "restaurants" && name !== "restaurants") {  
      if (window.RestaurantsPage && typeof window.RestaurantsPage.close === "function") {
        window.RestaurantsPage.close();
      }
    }
    if (currentView === "discovercity" && name !== "discovercity") {  
      if (window.DiscoverCityPage && typeof window.DiscoverCityPage.close === "function") {
        window.DiscoverCityPage.close();
      }
    }
    if (currentView === "prayer" && name !== "prayer") {
      if (window.PrayerPage && typeof window.PrayerPage.close === "function") {
        window.PrayerPage.close();
      }
    }
    if (currentView === "feedback" && name !== "feedback") {
      if (window.FeedbackPage && typeof window.FeedbackPage.close === "function") {
        window.FeedbackPage.close();
      }
    }

    // ===== ALWAYS reset all view classes first (THIS fixes your overlay bug) =====
  if (viewWelcome) viewWelcome.className = "tx-view";
  if (viewHome) viewHome.className = "tx-view";
  if (viewWeather) viewWeather.className = "tx-view";
  if (viewTV) viewTV.className = "tx-view";
  if (viewMusic) viewMusic.className = "tx-view";
  if (viewMessages) viewMessages.className = "tx-view";
  if (viewVOD) viewVOD.className = "tx-view";
  if (viewFacilities) viewFacilities.className = "tx-view";
  if (viewHotelInfo) viewHotelInfo.className = "tx-view";
  if (viewRoomService) viewRoomService.className = "tx-view";
  if (viewDining) viewDining.className = "tx-view";
  if (viewCart) viewCart.className = "tx-view";
  if (viewBill) viewBill.className = "tx-view";
  if (viewRestaurants) viewRestaurants.className = "tx-view";
  if (viewDiscoverCity) viewDiscoverCity.className = "tx-view";
  if (viewPrayer) viewPrayer.className = "tx-view";
  if (viewFeedback) viewFeedback.className = "tx-view";


    setTopbarTheme(name);

    if (name === "tv") {
      prevView = currentView || "home";
      currentView = "tv";
      if (viewTV) viewTV.className = "tx-view is-active";

      
      try {
        if (window.TVChannels && typeof window.TVChannels.mount === "function") {
          window.TVChannels.mount({ appJson: APP_DATA });
        }
      } catch (e) {
        log("Error mounting TV channels: " + (e && e.message ? e.message : e));
      }

      return;
    }
    if (name === "roomservice") {
      prevView = currentView || "home";
      currentView = "roomservice";
      if (viewRoomService) viewRoomService.className = "tx-view is-active";

      try {
        var rsRoute = PAGE_ROUTE_BY_KEY["KEY_HOTEL_SERVICES"] || findByKey("KEY_HOTEL_SERVICES", false);

        if (rsRoute && rsRoute.route_bg && viewRoomService) {
          setPageBg(viewRoomService, resolveRouteBgValue(rsRoute.route_bg));
        }

        if (window.RoomServicePage && typeof window.RoomServicePage.open === "function") {
          window.RoomServicePage.open(rsRoute);
        }
      } catch (e) {
        log("Error opening roomservice: " + (e && e.message ? e.message : e));
      }
      return;
    }
    if (name === "dining") {
    prevView = currentView || "home";
    currentView = "dining";
    if (viewDining) viewDining.className = "tx-view is-active";

    try {
      var diningRoute = PAGE_ROUTE_BY_KEY["KEY_DINING_IN_ROOM"] || findByKey("KEY_DINING_IN_ROOM", false);

      if (diningRoute && diningRoute.route_bg && viewDining) {
        setPageBg(viewDining, resolveRouteBgValue(diningRoute.route_bg));
      }

      if (window.DiningPage && typeof window.DiningPage.open === "function") {
        window.DiningPage.open(diningRoute);
      }
    } catch (e) {
      log("Error opening dining: " + (e && e.message ? e.message : e));
    }
    return;
  }
  if (name === "cart") {
  prevView = currentView || "home";
  currentView = "cart";
  if (viewCart) viewCart.className = "tx-view is-active";

  try {
    var cartRoute = PAGE_ROUTE_BY_KEY["KEY_CART"] || findByKey("KEY_CART", false);
    
    if (cartRoute && cartRoute.route_bg && viewCart) {
      setPageBg(viewCart, resolveRouteBgValue(cartRoute.route_bg));
    }

    if (window.CartPage && typeof window.CartPage.open === "function") {
      window.CartPage.open(cartRoute);
    }
  } catch (e) {
    log("Error opening cart: " + (e && e.message ? e.message : e));
  }
  return;
}

if (name === "bill") {
  prevView = currentView || "home";
  currentView = "bill";
  if (viewBill) viewBill.className = "tx-view is-active";

  try {
    var billRoute = PAGE_ROUTE_BY_KEY["KEY_VIEW_BILL"] || findByKey("KEY_VIEW_BILL", false);
    
    if (billRoute && billRoute.route_bg && viewBill) {
      setPageBg(viewBill, resolveRouteBgValue(billRoute.route_bg));
    }

    if (window.BillPage && typeof window.BillPage.open === "function") {
      window.BillPage.open(billRoute);
    }
  } catch (e) {
    log("Error opening bill: " + (e && e.message ? e.message : e));
  }
  return;
}

    if (name === "weather") {
    prevView = currentView || "home";
    currentView = "weather";
    if (viewWeather) viewWeather.className = "tx-view is-active";

    var wRt = PAGE_ROUTE_BY_KEY["KEY_WEATHER"];
    if (wRt && wRt.route_bg) setPageBg(viewWeather, resolveRouteBgValue(wRt.route_bg));

    if (window.WeatherPage && typeof window.WeatherPage.onShow === "function") {
      window.WeatherPage.onShow(APP_DATA);
    }
    return;
  }

  if (name === "vod") {
    prevView = currentView || "home";
    currentView = "vod";
    if (viewVOD) viewVOD.className = "tx-view is-active";

    try {
      var vodRoute = PAGE_ROUTE_BY_KEY["KEY_VOD"] || findByKey("KEY_VOD", false);

      if (vodRoute && vodRoute.route_bg && viewVOD) {
        setPageBg(viewVOD, resolveRouteBgValue(vodRoute.route_bg));
      }

      if (window.VODPage && typeof window.VODPage.open === "function") {
        window.VODPage.open(vodRoute);
      }
    } catch (e2) {
      log("Error opening VOD: " + (e2 && e2.message ? e2.message : e2));
    }
    return;
  }

  if (name === "music") {
    prevView = currentView || "home";
    currentView = "music";
    if (viewMusic) viewMusic.className = "tx-view is-active";

    try {
      var rt = PAGE_ROUTE_BY_KEY["KEY_MUSIC"];
      if (rt && rt.route_bg) setPageBg(viewMusic, resolveRouteBgValue(rt.route_bg));

      if (window.MusicPage && typeof window.MusicPage.open === "function") {
        window.MusicPage.open(rt);
      }
    } catch (e3) {
      log("Error opening music: " + (e3 && e3.message ? e3.message : e3));
    }
    return;
  }

  if (name === "messages") {
    prevView = currentView || "home";
    currentView = "messages";
    if (viewMessages) viewMessages.className = "tx-view is-active";

    try {
      var mRt = PAGE_ROUTE_BY_KEY["KEY_MESSAGES"] || findByKey("KEY_MESSAGES", false);

      if (mRt && mRt.route_bg && viewMessages) {
        setPageBg(viewMessages, resolveRouteBgValue(mRt.route_bg));
      }

      if (window.MessagesPage) {
        if (typeof window.MessagesPage.show === "function") window.MessagesPage.show();
        if (mRt && typeof window.MessagesPage.setData === "function") window.MessagesPage.setData(mRt);
        else if (APP_DATA && typeof window.MessagesPage.loadFromAppJson === "function") window.MessagesPage.loadFromAppJson(APP_DATA);
      }
    } catch (e4) {
      log("Error opening messages: " + (e4 && e4.message ? e4.message : e4));
    }
    return;
  }
  if (name === "restaurants") {
    prevView = currentView || "home";
    currentView = "restaurants";
    if (viewRestaurants) viewRestaurants.className = "tx-view is-active";

    try {
      var resRoute = PAGE_ROUTE_BY_KEY["KEY_RESTAURANTS"] || findByKey("KEY_RESTAURANTS", false);

      if (resRoute && resRoute.route_bg && viewRestaurants) {
        setPageBg(viewRestaurants, resolveRouteBgValue(resRoute.route_bg));
      }

      if (window.RestaurantsPage && typeof window.RestaurantsPage.open === "function") {
        window.RestaurantsPage.open(resRoute);
      }
    } catch (e6) {
      log("Error opening restaurants: " + (e6 && e6.message ? e6.message : e6));
    }
    return;
  }
  if (name === "discovercity") {
    prevView = currentView || "home";
    currentView = "discovercity";
    if (viewDiscoverCity) viewDiscoverCity.className = "tx-view is-active";

    try {
      var dcRoute = PAGE_ROUTE_BY_KEY["KEY_ATTRACTIONS"] || findByKey("KEY_ATTRACTIONS", false);
      if (dcRoute && dcRoute.route_bg && viewDiscoverCity) {
        setPageBg(viewDiscoverCity, resolveRouteBgValue(dcRoute.route_bg));
      }

      if (window.DiscoverCityPage && typeof window.DiscoverCityPage.open === "function") {
        window.DiscoverCityPage.open(dcRoute);
      }
    } catch (e7) {
      log("Error opening discovercity: " + (e7 && e7.message ? e7.message : e7));
    }
    return;
  }
  if (name === "prayer") {
  prevView = currentView || "home";
  currentView = "prayer";
  if (viewPrayer) viewPrayer.className = "tx-view is-active";

  try {
    var prayerRoute = PAGE_ROUTE_BY_KEY["KEY_PRAYER_TIME"] || findByKey("KEY_PRAYER_TIME", false);

    if (prayerRoute && prayerRoute.route_bg && viewPrayer) {
      setPageBg(viewPrayer, resolveRouteBgValue(prayerRoute.route_bg));
    }

    if (window.PrayerPage && typeof window.PrayerPage.open === "function") {
      window.PrayerPage.open(prayerRoute);
    }
  } catch (e) {
    log("Error opening prayer: " + (e && e.message ? e.message : e));
  }
  return;
}
  
    if (name === "facilities") {
    prevView = currentView || "home";
    currentView = "facilities";

    if (viewFacilities) viewFacilities.className = "tx-view is-active";

    try {
      var fcRoute = PAGE_ROUTE_BY_KEY["KEY_FACILITIES"] || findByKey("KEY_FACILITIES", false);

      // optional: page bg if backend has it
      if (fcRoute && fcRoute.route_bg && viewFacilities) {
        setPageBg(viewFacilities, resolveRouteBgValue(fcRoute.route_bg));
      }

      if (window.FacilitiesPage && typeof window.FacilitiesPage.open === "function") {
        window.FacilitiesPage.open(fcRoute);
      }
    } catch (e5) {
      log("Error opening facilities: " + (e5 && e5.message ? e5.message : e5));
    }

    return;
  }
  if (name === "hotelinfo") {
  prevView = currentView || "home";
  currentView = "hotelinfo";
  if (viewHotelInfo) viewHotelInfo.className = "tx-view is-active";

  try {
    var hiRoute = PAGE_ROUTE_BY_KEY["KEY_OUR_SERVICES"] || findByKey("KEY_OUR_SERVICES", false);

    if (hiRoute && hiRoute.route_bg && viewHotelInfo) {
      setPageBg(viewHotelInfo, resolveRouteBgValue(hiRoute.route_bg));
    }

    if (window.HotelInfoPage && typeof window.HotelInfoPage.open === "function") {
      window.HotelInfoPage.open(hiRoute);
    }
  } catch (e) {
    log("Error opening hotelinfo: " + (e && e.message ? e.message : e));
  }
  return;
}
  if (name === "feedback") {
    prevView = currentView || "home";
    currentView = "feedback";
    if (viewFeedback) viewFeedback.className = "tx-view is-active";

    try {
      var fbRoute = PAGE_ROUTE_BY_KEY["KEY_FEEDBACK"] || findByKey("KEY_FEEDBACK", false);
      if (fbRoute && fbRoute.route_bg && viewFeedback) {
        setPageBg(viewFeedback, resolveRouteBgValue(fbRoute.route_bg));
      }

      if (window.FeedbackPage && typeof window.FeedbackPage.open === "function") {
        window.FeedbackPage.open(fbRoute);
      }
    } catch (e) {
      log("Error opening feedback: " + (e && e.message ? e.message : e));
    }
    return;
  }



  // ===== default views =====
  if (name === "home") {
    currentView = "home";
    if (viewHome) viewHome.className = "tx-view is-active";

    // ✅ Restore last selected tile first, otherwise last focused, otherwise default
    var restoreId = lastHomeSelectedId || lastHomeFocusId || "tile-hotelinfo";
    if (!qs(restoreId)) restoreId = "tile-hotelinfo";
    setHomeFocusById(restoreId);

    return;
  }

  // welcome fallback
  currentView = "welcome";
  if (viewWelcome) viewWelcome.className = "tx-view is-active";
  setWelcomeFocus(0);
}

  // function extractChannelsDataFromHtml(html) {
  //   html = String(html || "");
  //   if (!html) return [];

  //   var channelList = [];
  //   var regex = /<li[^>]*class="[^"]*subnav_item[^"]*"[^>]*data-id="([^"]*)"[^>]*data-name="([^"]*)"[^>]*data-channel-number="([^"]*)"[^>]*data-channel-url="([^"]*)"[^>]*>/gi;
  //   var match;
    
  //   while ((match = regex.exec(html)) !== null) {
  //     var id = match[1] || "";
  //     var name = match[2] || "";
  //     var number = match[3] || "";
  //     var url = match[4] || "";
      
  //     var liStart = match.index;
  //     var liEnd = html.indexOf("</li>", liStart);
  //     if (liEnd === -1) liEnd = html.length;
      
  //     var liContent = html.substring(liStart, liEnd);
  //     var logoMatch = /<img[^>]+data-src="([^"]*)"/i.exec(liContent);
  //     if (!logoMatch) {
  //       logoMatch = /<img[^>]+src="([^"]*)"/i.exec(liContent);
  //     }
  //     var logoUrl = logoMatch ? logoMatch[1] : "";

  //     if (id && name && url) {
  //       channelList.push({
  //         id: id,
  //         name: name,
  //         number: number,
  //         url: url,
  //         logo: logoUrl
  //       });
  //     }
  //   }

  //   return channelList;
  // }

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
    // ✅ Remember the tile that was selected (OK) so Back returns here
    if (currentView === "home" && tileId) {
      lastHomeSelectedId = tileId;
      lastHomeFocusId = tileId;
    }

    var rt = TILE_ROUTE[tileId];

    if (tileId === "tile-weather") {
      showView("weather");
      return;
    }
    if (tileId === "tile-tv") {
      showView("tv");
      return;
    }
    if (tileId === "tile-music") {
      showView("music");
      return;
    }
    if (tileId === "tile-messages") {
    showView("messages");
    return;
    }
    if (tileId === "tile-movies") {
    showView("vod");
    return;
    }
    if (tileId === "tile-spa") {
    showView("facilities");
    return;
    }
    if (tileId === "tile-hotelinfo") {
      showView("hotelinfo");
      return;
    }
    if (tileId === "tile-roomservice") {
        showView("roomservice");
        return;
      }
    if (tileId === "tile-dining") {
    showView("dining");
    return;
  }
  if (tileId === "tile-cart") {
    showView("cart");
    return;
  }

  if (tileId === "tile-viewbill") {
    showView("bill");
    return;
  }
  if (tileId === "tile-restaurants") {
    showView("restaurants");
    return;
  }
  if (tileId === "tile-discover") {
    showView("discovercity");
    return;
  }
  if (tileId === "tile-prayer") {
  showView("prayer");
  return;
}
  if (tileId === "tile-feedback") {
    showView("feedback");
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

    if (k === 85) {
      e.preventDefault();

      if (currentView === "weather") {
        showView(prevView || "home");
        return;
      }
      if (currentView === "music") {
        showView(prevView || "home");
        return;
      }
      if (currentView === "messages") {
        showView(prevView || "home");
        return;
        }
      if (currentView === "facilities") {
        showView(prevView || "home");
      return;
      }
      if (currentView === "hotelinfo") {
        showView(prevView || "home");
        return;
      }
      if (currentView === "roomservice") {
        showView(prevView || "home");
        return;
      } 
      if (currentView === "dining") {
        showView(prevView || "home");
        return;
      } 
      if (currentView === "cart") {
        showView(prevView || "home");
        return;
      }
      if (currentView === "bill") {
        showView(prevView || "home");
        return;
      }
      if (currentView === "restaurants") {
        showView(prevView || "home");
        return;
      }
      if (currentView === "discovercity") {
        showView(prevView || "home");
        return;
      }
      if (currentView === "prayer") {
        showView(prevView || "home");
        return;
      }
      if (currentView === "feedback") {
        showView(prevView || "home");
        return;
      }



      if (currentView === "tv") {
        if (window.TVChannels && typeof window.TVChannels.handleKeyDown === "function") {
          if (window.TVChannels.handleKeyDown({ keyCode: 461, which: 461 })) {
            return;
          }
        }
        showView(prevView || "home");
        return;
      }
          // inside if (k === 85) { ... } block in home.js
          if (currentView === "vod") {
            // First: let VODPage exit fullscreen/detail if needed
            if (window.VODPage && typeof window.VODPage.handleKeyDown === "function") {
              if (window.VODPage.handleKeyDown({ keyCode: 85, which: 85 })) return;
            }
            // Otherwise go back to previous view
            showView(prevView || "home");
            return;
          }


      onBack();
      return;
    }

    if (k === 82) {
      e.preventDefault();
      showView("home");
      return;
    }

    if (currentView === "weather") {
      if (window.WeatherPage && typeof window.WeatherPage.handleKey === "function") {
        if (window.WeatherPage.handleKey(k)) { e.preventDefault(); return; }
      }

      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }

      if (k === OK) { e.preventDefault(); return; }

      return;
    }

    if (currentView === "tv") {
      if (window.TVChannels && typeof window.TVChannels.handleKeyDown === "function") {
        if (window.TVChannels.handleKeyDown(e)) { e.preventDefault(); return; }
      }

      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }

      if (k === OK) { e.preventDefault(); return; }

      return;
    }
    if (currentView === "roomservice") {
      if (window.RoomServicePage && typeof window.RoomServicePage.handleKeyDown === "function") {
        if (window.RoomServicePage.handleKeyDown(e)) { e.preventDefault(); return; }
      }
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      if (k === OK) { e.preventDefault(); return; }
      return;
    }
    if (currentView === "restaurants") {
      if (window.RestaurantsPage && typeof window.RestaurantsPage.handleKeyDown === "function") {
        if (window.RestaurantsPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      if (k === OK) { e.preventDefault(); return; }
      return;
    }

    if (currentView === "discovercity") {
      if (window.DiscoverCityPage && typeof window.DiscoverCityPage.handleKeyDown === "function") {
        if (window.DiscoverCityPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      if (k === OK) { e.preventDefault(); return; }
      return;
    }

    if (currentView === "dining") {
      if (window.DiningPage && typeof window.DiningPage.handleKeyDown === "function") {
        if (window.DiningPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      if (k === OK) { e.preventDefault(); return; }
      return;
    }
    if (currentView === "messages") {
        // Let Messages page consume arrows/OK/etc.
        if (window.MessagesPage && typeof window.MessagesPage.handleKeyDown === "function") {
          if (window.MessagesPage.handleKeyDown(e)) { e.preventDefault(); return; }
        }

        // Back keys -> previous view
        if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
          e.preventDefault();
          showView(prevView || "home");
          return;
        }

        // Prevent OK falling through to Home
        if (k === OK) { e.preventDefault(); return; }

        return;
      }
    if (currentView === "vod") {
      if (window.VODPage && typeof window.VODPage.handleKeyDown === "function") {
        if (window.VODPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }

      // Back keys -> previous view
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }

      // Prevent OK falling through to Home
      if (k === OK) { e.preventDefault(); return; }

      return;
    }

    if (currentView === "music") {
      if (window.MusicPage && typeof window.MusicPage.onKeyDown === "function") {
        if (window.MusicPage.onKeyDown(e)) { e.preventDefault(); return; }
      }

      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }

      if (k === OK) { e.preventDefault(); return; }

      return;
    }
    if (currentView === "feedback") {
      if (window.FeedbackPage && typeof window.FeedbackPage.handleKeyDown === "function") {
        if (window.FeedbackPage.handleKeyDown(e)) { e.preventDefault(); return; }
      } 

      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      if (k === OK) { e.preventDefault(); return; }
      return;
    }

    // OK should only trigger tile actions when you're on HOME or WELCOME
    if (k === OK) {
      if (currentView === "home" || currentView === "welcome") {
        e.preventDefault();
        onOk();
        return;
      }
      // otherwise: let page modules (CartPage, DiningPage, etc) handle OK
    }


    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      e.preventDefault();
      onBack();
      return;
    }


    if (currentView === "facilities") {
      if (window.FacilitiesPage && typeof window.FacilitiesPage.handleKeyDown === "function") {
        if (window.FacilitiesPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }

      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }

      if (k === OK) { e.preventDefault(); return; }

      return;
    }

    if (currentView === "hotelinfo") {
      if (window.HotelInfoPage && typeof window.HotelInfoPage.handleKeyDown === "function") {
        if (window.HotelInfoPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      if (k === OK) { e.preventDefault(); return; }
      return;
    }
    if (currentView === "cart") {
  if (window.CartPage && typeof window.CartPage.handleKeyDown === "function") {
    if (window.CartPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }
      
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      

      return;
    }

    if (currentView === "bill") {
      if (window.BillPage && typeof window.BillPage.handleKeyDown === "function") {
        if (window.BillPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }
      
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      
      if (k === OK) { e.preventDefault(); return; }
      return;
    }
    if (k === 86) {  // V key = Change Location (blue key)
    e.preventDefault();
    
    // For now, just show a toast - you can implement location change later
    if (currentView === "prayer") {
      if (w.tenxToast) {
        w.tenxToast("Change Location feature coming soon!", 2500, "info");
      }
      return;
    }
    
    return;
  }

  // COMPLETE EXAMPLE OF THE V KEY HANDLER SECTION:
/*
    if (k === 86) {  // V key = Change Location (blue key)
      e.preventDefault();
      
      // Handle based on current view
      if (currentView === "prayer") {
        if (w.tenxToast) {
          w.tenxToast("Change Location feature coming soon!", 2500, "info");
        }
        return;
      }
      
      // You can add more view-specific handlers here
      // For example, in weather view it might change weather location
      if (currentView === "weather") {
        // Handle weather location change
        return;
      }
      
      return;
    }
*/
    if (currentView === "prayer") {
      if (window.PrayerPage && typeof window.PrayerPage.handleKeyDown === "function") {
        if (window.PrayerPage.handleKeyDown(e)) { e.preventDefault(); return; }
      }
      
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        e.preventDefault();
        showView(prevView || "home");
        return;
      }
      
      if (k === OK) { e.preventDefault(); return; }
      return;
    }


    if (currentView === "welcome") {
      if (k === DOWN) { if (welcomeFocusIndex === 0) setWelcomeFocus(1); return; }
      if (k === UP) { if (welcomeFocusIndex !== 0) setWelcomeFocus(0); return; }
      if (k === LEFT || k === RIGHT) {
        if (welcomeFocusIndex === 1 && k === RIGHT) setWelcomeFocus(2);
        else if (welcomeFocusIndex === 2 && k === LEFT) setWelcomeFocus(1);
        return;
      }
      return;
    }

    if (k === LEFT) { e.preventDefault(); moveHome(0,-1); return; }
    if (k === RIGHT) { e.preventDefault(); moveHome(0, 1); return; }
    if (k === UP) { e.preventDefault(); moveHome(-1,0); return; }
    if (k === DOWN) { e.preventDefault(); moveHome( 1,0); return; }
  }

  function onBack() {
    if (currentView === "home") {
      showView("welcome");
    } else {
      showView("home");
    }
  }

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

    var m = /background-image\s*:\s*url\(([^)]+)\)/i.exec(liHtml);
    if (m && m[1]) {
      var raw = String(m[1]).replace(/^\s+|\s+$/g, "").replace(/^[\"']/, "").replace(/[\"']$/, "");
      return raw;
    }

    m = /data-(?:bg|background)\s*=\s*[\"']([^"']+)[\"']/i.exec(liHtml);
    if (m && m[1]) return m[1];

    return "";
  }

  function extractTileBgFromHomeByRouteAttr(homeHtml, routeAttr) {
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
    try { bg = viewEl.querySelector(".tx-bg, .fc-bg"); } catch (e) { bg = null; }

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
      if (t.toLowerCase().indexOf("key_") === 0) return t.toUpperCase();
    }
    return "";
  }

  // ✅ FIXED: Now correctly separates parent_id 211 (tile styling) from parent_id 0 (page logic)
  function findByKey(routeKey, wantTile) {
    var i, rt, k, pid;
    routeKey = String(routeKey || "").toUpperCase();
    if (!routeKey) return null;

    for (i = 0; i < ROUTES_LIST.length; i++) {
      rt = ROUTES_LIST[i];
      if (!rt) continue;

      k = String(rt.route_key || "").toUpperCase();
      if (k !== routeKey) continue;

      pid = String(rt.route_parent_id || "");
      
      // ✅ wantTile=true => parent_id 211 (tile styling with backgrounds/icons)
      // ✅ wantTile=false => parent_id 0 (page content only)
      if (wantTile) {
        if (pid === "211") return rt;  // FIXED: Look for parent_id 211
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
      pid = pid.replace(/^\s+|\s+$/g, "");

      if (pid === "0") {
        PAGE_ROUTE_BY_KEY[k] = rt;
      } else if (pid === "211") {  // ✅ FIXED: Only parent_id 211 for tile styling
        TILE_ROUTE_BY_KEY[k] = rt;
      }
    }
  }

  function hydrateFromRoutes(app) {
    if (!app) return;

    setBrandLogo(pickHotelLogo(app));

    buildRoutesLookup(app);
    buildRouteKeyLookups();

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

    // ✅ Apply page backgrounds for weather and music (parent_id 0 only)
    function applyPageBg(viewEl, routeKey) {
      var pageRt = PAGE_ROUTE_BY_KEY[routeKey] || findByKey(routeKey, false);
      var pageBg = pageRt ? resolveRouteBgValue(pageRt.route_bg) : "";

      if (isLikelyImageUrl(pageBg)) {
        setPageBg(viewEl, pageBg);
      }
    }

    applyPageBg(viewWeather, "KEY_WEATHER");
    applyPageBg(viewMusic, "KEY_MUSIC");

    var guestTitle = app.guest_title || "";
    var guestFirst = app.guest_first_name || "";
    var guestLast = app.guest_last_name || "";

    var guestFull = (guestTitle + " " + guestFirst + " " + guestLast)
      .replace(/\s+/g, " ")
      .replace(/^\s+|\s+$/g, "");

    var roomNumber = app.room_number || app.room_no || "101";

    GUEST_FULL = guestFull || "";
    ROOM_NO = roomNumber || "";

    setText("meta-room", "Room " + (ROOM_NO || "—"));
    setText("meta-welcome", GUEST_FULL ? ("Welcome, " + GUEST_FULL) : "Welcome, —");

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

    // ✅ FIXED mapTile: Now correctly handles parent_id 211 vs parent_id 0
    function mapTile(tileId, tests, fallbackLabel, isBigIcon, preferredAttrUpper) {
      var routeKey = getRouteKeyFromTests(tests);
      var tileRt = null;  // parent_id 211 (tile styling)
      var pageRt = null;  // parent_id 0 (page logic)

      // ✅ Check if this tile needs backgrounds
      var needsBg = false;
      if (routeKey) {
        for (var idx = 0; idx < TILES_WITH_BACKGROUNDS.length; idx++) {
          if (TILES_WITH_BACKGROUNDS[idx] === routeKey) {
            needsBg = true;
            break;
          }
        }
      }

      // Resolve both variants by KEY_*

      if (routeKey) {
      // ✅ Always fetch tileRt so icons work (parent_id 211)
      tileRt = TILE_ROUTE_BY_KEY[routeKey] || findByKey(routeKey, true);

      // ✅ Page route still for actions/labels (parent_id 0)
      pageRt = PAGE_ROUTE_BY_KEY[routeKey] || findByKey(routeKey, false);
    }


      // Fallback fuzzy route (legacy support)
      var fuzzy = findRoute(ROUTES_LIST, tests);

      // What route should clicking/OK represent? -> PAGE route (parent 0)
      var rtForAction = pageRt || fuzzy || null;
      if (rtForAction) TILE_ROUTE[tileId] = rtForAction;

      // ===== LABEL =====
      var labelRt = pageRt || fuzzy;  // Use parent_id 0 for labels
      if (labelRt && labelRt.route_name) {
        setTileLabel(tileId, labelRt.route_name);
      } else if (fallbackLabel) {
        setTileLabel(tileId, fallbackLabel);
      }

      // ===== BACKGROUND (only for tiles that need it) =====
      if (needsBg) {
        var tileBg = "";
        
        // 1. Try parent_id 211 first (tile styling)
        if (tileRt) {
          tileBg = resolveRouteBgValue(pick(tileRt, ["route_bg","route_cover","cover","bg","background"]));
        }

        // 2. Fallback to html_home extraction
        if (!tileBg) {
          var attr = preferredAttrUpper ? String(preferredAttrUpper || "").toUpperCase() : 
                     String((tileRt && tileRt.route_attr) || (pageRt && pageRt.route_attr) || "");
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

        // 3. Final fallback to parent_id 0 if still no background
        if (!tileBg && pageRt) {
          tileBg = resolveRouteBgValue(pick(pageRt, ["route_bg","route_cover","cover","bg","background"]));
        }

        if (tileBg) setTileBg(tileId, tileBg);
      }

      // ===== ICON =====
      var iconUrl = "";
      
      // 1. Try parent_id 211 first (tile styling)
      if (tileRt) {
        iconUrl = pick(tileRt, ["route_icon","icon","icon_url"]);
      }

      // 2. Try html_home extraction
      if (!iconUrl) {
        var attr2 = preferredAttrUpper ? String(preferredAttrUpper || "").toUpperCase() :
                    String(((tileRt && tileRt.route_attr) || (pageRt && pageRt.route_attr) || "")).toUpperCase();

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
      }

      // 3. Final fallback to parent_id 0
      if (!iconUrl && pageRt) {
        iconUrl = pick(pageRt, ["route_icon","icon","icon_url"]);
      }

      if (!isLikelyImageUrl(iconUrl)) iconUrl = "";

      if (iconUrl) setTileIcon(tileId, iconUrl, !!isBigIcon);
    }

    // ===== MAP ALL TILES =====
    mapTile("tile-dining", ["key_dining_in_room","dining_in_room","in-room dining","room dining","dining"], "In-Room Dining", true);
    mapTile("tile-movies", ["key_vod","vod","movies","movie"], "Movies", false, null);
    mapTile("tile-special", ["key_special_offers","special_offers","offers","promotion"], "Special Offers", false, null);
    mapTile("tile-hotelinfo", ["key_our_services","our_services","hotel info","hotel information","information"], "Hotel Information", false, null);
    mapTile("tile-roomservice", ["key_hotel_services","hotel_service","roomservice"], "Room Service", false, null);
    mapTile("tile-spa", ["key_facilities","facilities","key_facility"], "Wellness & Spa", false, null);
    mapTile("tile-restaurants", ["key_dining_all_day","dining_all_day","restaurant"], "Restaurants", false, null);
    mapTile("tile-discover", ["key_attractions","attractions","discover","city"], "Discover City", false, null);
    mapTile("tile-prayer", ["key_prayer_time","prayer_time","shop"], "Prayer", false, null);
    mapTile("tile-music", ["key_music","music"], "Music", false, null);
    mapTile("tile-tv", ["key_tv","tv","tv_channels","television","channels"], "TV", false, null);
    mapTile("tile-weather", ["key_weather","weather","temperature"], "Weather", false, null);
    mapTile("tile-clock", ["key_world_clock","world_clock","clock"], "World Clock", false, null);
    mapTile("tile-roomcontrol", ["key_room_control","room_control","controls","iot"], "Room Control", false, null);
    mapTile("tile-cart", ["key_cart","cart","view_cart","basket"], "Cart", false, null);
    mapTile("tile-messages", ["key_messages","messages","inbox"], "Messages", false, null);
    mapTile("tile-viewbill", ["key_view_bill","bill","folio"], "Bill", false, null);
    mapTile("tile-apps", ["key_socialstore","socialstore","apps","app store","store"], "Apps", false, null);
    mapTile("tile-feedback", ["key_feedback","feedback","guest feedback","review"], "Feedback", false, null);

  }

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
      // ✅ Hide boot loader once Welcome assets are ready
      hideLoaderWhenWelcomeReady();

      
      if (currentView === "tv" && window.TVChannels && typeof window.TVChannels.updateAppJson === "function") {
        window.TVChannels.updateAppJson(APP_DATA);
      }
      if (currentView === "messages" && window.MessagesPage) {
        var mRt = PAGE_ROUTE_BY_KEY["KEY_MESSAGES"] || findByKey("KEY_MESSAGES", false);
      if (mRt && typeof window.MessagesPage.setData === "function") window.MessagesPage.setData(mRt);
      }

    }, function (err) {
      log("app_json error:", err);
       // ✅ don’t block UI forever if backend is down
      setTimeout(function(){ loaderHide(); }, 800);
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

  function routeFromHash() {
    var raw = (window.location.hash || "");
    var h = raw.toLowerCase();

    if (h.indexOf("#/welcome") === 0) { showView("welcome"); return; }
    if (h.indexOf("#/home") === 0) { showView("home"); return; }
    if (h.indexOf("#/weather") === 0) { showView("weather"); return; }
    if (h.indexOf("#/music") === 0) { showView("music"); return; }
    if (h.indexOf("#/vod") === 0) { showView("vod"); return; }
    if (h.indexOf("#/messages") === 0) { showView("messages"); return; }
    if (h.indexOf("#/hotelinfo") === 0) { showView("hotelinfo"); return; }
    if (h.indexOf("#/facilities") === 0) { showView("facilities"); return; }
    if (h.indexOf("#/tv") === 0) { showView("tv"); return; }
    if (h.indexOf("#/prayer") === 0) { showView("prayer"); return; }


    if (hasSeenWelcome()) showView("home");
    else showView("welcome");
  }

  window.addEventListener("resize", fitStage);
  window.addEventListener("hashchange", routeFromHash);
  document.addEventListener("keydown", onKeyDown);

  fitStage();
  updateClock();
  setInterval(updateClock, 15000);

  loaderShow();

  forceWelcomeOnBoot();
  applyLang();
  routeFromHash();

  setTimeout(loadAppData, 50);

}());