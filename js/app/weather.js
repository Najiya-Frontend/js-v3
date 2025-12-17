// js/app/weather.js — Weather page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.WeatherPage) return;

  var viewEl = null;
  var cardsWrap = null;

  var active = false;
  var unit = "C";  // C or F
  var focusIndex = 0;
  var dataCache = null;

  function qs(id){ return document.getElementById(id); }

  function setText(id, txt){
    var el = qs(id);
    if (!el) return;
    el.textContent = (txt == null) ? "" : String(txt);
  }

  function apiOrigin(){
    try {
      if (w.TenxApi && w.TenxApi.HOST) return String(w.TenxApi.HOST).replace(/\/+$/, "");
    } catch (e) {}
    return "";
  }

  function rewriteAssetUrl(url){
    url = String(url || "");
    if (!url) return url;
    if (url.indexOf("/admin-portal/assets/") < 0) return url;

    var origin = apiOrigin();
    if (!origin) return url;
    return url.replace(/^https?:\/\/[^\/]+/i, origin);
  }

  function setPageBg(url){
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
    }
  }

  function cToF(c){ return (c * 9 / 5) + 32; }

  function fmtTemp(c){
    var n = Number(c);
    if (isNaN(n)) n = 0;
    if (unit === "F") return (n >= 0 ? "+" : "") + Math.round(cToF(n)) + "°F";
    return (n >= 0 ? "+" : "") + Math.round(n) + "°C";
  }

  function wxIconFor(s){
    s = String(s || "").toLowerCase();
    if (s.indexOf("thunder") >= 0 || s.indexOf("storm") >= 0) return "⛈";
    if (s.indexOf("snow") >= 0) return "❄";
    if (s.indexOf("rain") >= 0) return "🌧";
    if (s.indexOf("sun") >= 0 || s.indexOf("clear") >= 0) return "☀";
    if (s.indexOf("cloud") >= 0) return "☁";
    return "☁";
  }

  function sampleWeather(){
    return {
      bg: "",
      location: "Riyadh, Saudi Arabia",
      now: {
        temp_c: 21,
        text: "now\ncloudy",
        wind: "NW, 2–3 m/s",
        humidity: "96%",
        pressure: "834 mm",
        cloudiness: "40%"
      },
      forecast: [
        { day:"Today", date:"July, 06", icon:"thunder", temp_c:21, desc:"mainly cloudy", extra1:"Calm", extra2:"78%", extra3:"782 mm" },
        { day:"Tomorrow", date:"July, 06", icon:"rain", temp_c:18, desc:"cloudy", extra1:"Calm", extra2:"78%", extra3:"782 mm" },
        { day:"Tuesday", date:"July, 07", icon:"snow", temp_c:-12, desc:"snow", extra1:"Calm", extra2:"78%", extra3:"782 mm" },
        { day:"Wednesday", date:"July, 08", icon:"sun", temp_c:50, desc:"sunny", extra1:"Calm", extra2:"78%", extra3:"782 mm" },
        { day:"Thursday", date:"July, 09", icon:"rain", temp_c:50, desc:"rainy", extra1:"Calm", extra2:"78%", extra3:"782 mm" }
      ]
    };
  }

  // Try to normalize from app_json in many possible shapes
  function normalizeFromApp(app){
    if (!app) return null;

    // common candidates
    var wdata = app.weather || app.weather_data || app.weather_widget || null;
    if (!wdata && app.widgets && app.widgets.length) {
      // try find by key/name
      var i, it, key;
      for (i = 0; i < app.widgets.length; i++) {
        it = app.widgets[i];
        key = String(it && (it.key || it.name || it.type || "")).toLowerCase();
        if (key.indexOf("weather") >= 0) { wdata = it; break; }
      }
    }
    if (!wdata) return null;
    if (wdata.data) wdata = wdata.data;

    var out = { bg:"", location:"Weather", now:{}, forecast:[] };

    out.bg = wdata.bg || wdata.background || wdata.cover || wdata.route_bg || "";
    out.location = wdata.location || wdata.city || wdata.place || out.location;

    var cur = wdata.current || wdata.now || wdata.today || wdata;
    out.now.temp_c = Number(cur.temp_c || cur.temp || cur.temperature || 0);
    out.now.text = String(cur.text || cur.condition || cur.status || "");
    out.now.wind = cur.wind || cur.wind_text || "";
    out.now.humidity = cur.humidity || cur.humidity_text || "";
    out.now.pressure = cur.pressure || cur.pressure_text || "";
    out.now.cloudiness = cur.cloudiness || cur.cloud || cur.cloud_text || "";

    var f = wdata.forecast || wdata.days || wdata.daily || [];
    if (f.data && f.data.length) f = f.data;

    var j, d;
    for (j = 0; j < f.length && j < 5; j++) {
      d = f[j] || {};
      out.forecast.push({
        day: d.day || d.name || "",
        date: d.date || d.label || "",
        icon: d.icon || d.code || d.text || d.condition || "",
        temp_c: Number(d.temp_c || d.temp || d.temperature || 0),
        desc: d.desc || d.text || d.condition || "",
        extra1: d.extra1 || d.wind || "",
        extra2: d.extra2 || d.humidity || "",
        extra3: d.extra3 || d.pressure || ""
      });
    }

    if (!out.forecast.length) return null;
    return out;
  }

  function mount(){
    if (viewEl) return;
    viewEl = qs("view-weather");
    cardsWrap = qs("wx-cards");
  }

  function render(data){
    mount();

    dataCache = data || sampleWeather();

    if (dataCache.bg) setPageBg(dataCache.bg);

    setText("wx-city", dataCache.location || "Weather");
    setText("wx-temp", fmtTemp(dataCache.now.temp_c));

    var condEl = qs("wx-cond");
    if (condEl) condEl.innerHTML = String(dataCache.now.text || "now<br>cloudy").replace(/\n/g, "<br>");

    setText("wx-wind", "Wind: " + (dataCache.now.wind || "—"));
    setText("wx-humidity", "Humidity: " + (dataCache.now.humidity || "—"));
    setText("wx-pressure", "Pressure: " + (dataCache.now.pressure || "—"));
    setText("wx-cloud", "Cloudiness: " + (dataCache.now.cloudiness || "—"));

    if (!cardsWrap) return;
    cardsWrap.innerHTML = "";

    var i, d, el;
    for (i = 0; i < dataCache.forecast.length && i < 5; i++) {
      d = dataCache.forecast[i];

      el = document.createElement("div");
      el.className = "wx-card tx-focusable";
      el.setAttribute("data-wx-idx", String(i));

      el.innerHTML =
        '<div class="wx-card__day">' + (d.day || "") + "</div>" +
        '<div class="wx-card__date">' + (d.date || "") + "</div>" +
        '<div class="wx-card__icon">' + wxIconFor(d.icon || d.desc) + "</div>" +
        '<div class="wx-card__t">' + fmtTemp(d.temp_c) + "</div>" +
        '<div class="wx-card__desc">' + (d.desc || "") + "</div>" +
        '<div class="wx-card__line"></div>' +
        '<div class="wx-card__foot">' +
          (d.extra1 || "") + "<br>" +
          (d.extra2 || "") + "<br>" +
          (d.extra3 || "") +
        "</div>";

      cardsWrap.appendChild(el);
    }

    setFocus(0);
  }

  function clearFocus(){
    var els = document.querySelectorAll(".tx-focusable.is-focused");
    var i;
    for (i = 0; i < els.length; i++) {
      els[i].className = els[i].className.replace(/\bis-focused\b/g, "");
    }
  }

  function setFocus(idx){
    if (!cardsWrap) return;
    var cards = cardsWrap.querySelectorAll(".wx-card");
    if (!cards || !cards.length) return;

    if (idx < 0) idx = 0;
    if (idx > cards.length - 1) idx = cards.length - 1;

    focusIndex = idx;
    clearFocus();
    cards[focusIndex].className += " is-focused";
  }

  function handleKey(k){
    // only page-local keys here
    if (!active) return false;

    // LEFT / RIGHT focus
    if (k === 37) { setFocus(focusIndex - 1); return true; }
    if (k === 39) { setFocus(focusIndex + 1); return true; }

    // C = toggle unit
    if (k === 67) {
      unit = (unit === "C") ? "F" : "C";
      render(dataCache || sampleWeather());
      return true;
    }

    return false;
  }

  function onShow(app){
    active = true;
    var norm = normalizeFromApp(app);
    render(norm || sampleWeather());
  }

  function onHide(){
    active = false;
  }

  w.WeatherPage = {
    isActive: function(){ return !!active; },
    onShow: onShow,
    onHide: onHide,
    handleKey: handleKey,
    // expose for debugging
    normalizeFromApp: normalizeFromApp
  };

})(window);
