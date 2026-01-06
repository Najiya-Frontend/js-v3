// js/app/restaurants.js — Restaurants page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.RestaurantsPage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, submenuEl, detailEl;
  var detailTitleEl, sliderViewportEl, sliderTrackEl, descriptionEl;
  var mainImgEl;
  var leftArrowEl, rightArrowEl;

  // ---------- STATE ----------
  var active = false;
  var focusArea = "submenu"; // "submenu" | "slider"

  var pageData = null;
  var restaurants = [];
  var focusSubmenuIndex = 0;
  var focusSliderIndex = 0;
  var sliderScrollX = 0;

  // ---------- HELPERS ----------
  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = (txt == null) ? "" : String(txt); }

  function escapeHtml(s) {
    s = (s == null) ? "" : String(s);
    return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function apiOrigin() {
    try { if (w.TenxApi && w.TenxApi.HOST) return String(w.TenxApi.HOST).replace(/\/+$/, ""); } catch (e) {}
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

  function stripHtmlTags(html) {
    html = String(html || "");
    html = html.replace(/<br\s*\/?>/gi, "\n");
    html = html.replace(/<\/p>/gi, "\n");
    html = html.replace(/<\/h\d>/gi, "\n");
    html = html.replace(/<[^>]+>/g, "");
    html = html.replace(/&nbsp;/g, " ");
    html = html.replace(/&amp;/g, "&");
    html = html.replace(/&lt;/g, "<");
    html = html.replace(/&gt;/g, ">");
    html = html.replace(/&quot;/g, '"');
    return html;
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-restaurants");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".fc-bg");
    pageTitleEl = qs("rest-page-title");
    submenuEl = qs("rest-submenu");
    detailEl = qs("rest-detail");
    detailTitleEl = qs("rest-detail-title");
    sliderViewportEl = qs("rest-slider-viewport");
    sliderTrackEl = qs("rest-slider-track");
    descriptionEl = qs("rest-description");
    leftArrowEl = qs("rest-slider-arrow-left");
    rightArrowEl = qs("rest-slider-arrow-right");
    mainImgEl = qs("rest-main-img");
  }

  // ---------- DATA MAPPING ----------
  function normalizeRestaurant(r) {
    r = r || {};

    var sliderData = [];
    if (r.slider && typeof r.slider === "string") {
      try { sliderData = JSON.parse(r.slider); } catch (e) { sliderData = []; }
    } else if (r.slider && typeof r.slider.length === "number") {
      sliderData = r.slider;
    }

    var images = [];
    var i;
    for (i = 0; i < sliderData.length; i++) {
      var img = sliderData[i] || {};
      images.push({
        src: rewriteAssetUrl(img.img_src || img.src || img.image || ""),
        duration: img.img_duration || img.duration || 3
      });
    }

    if (!images.length && r.cover) {
      images.push({ src: rewriteAssetUrl(r.cover), duration: 3 });
    }

    var openTime = String(r.open || "").substring(0, 5);
    var closeTime = String(r.close || "").substring(0, 5);
    var hours = (openTime && closeTime) ? (openTime + " - " + closeTime) : "";

    return {
      id: r.id || "",
      name: r.name || "Restaurant",
      description: stripHtmlTags(r.intro || r.desc || r.description || ""),
      images: images,
      hours: hours,
      isBookable: r.is_bookable === 1,
      canOrder: r.can_order === 1
    };
  }

  // ---------- RENDER ----------
  function renderSubmenu() {
    if (!submenuEl) return;

    var html = "";
    var i, rest;
    for (i = 0; i < restaurants.length; i++) {
      rest = restaurants[i];
      html += '<div class="fc-submenu-item" data-index="' + i + '">' + escapeHtml(rest.name) + "</div>";
    }
    submenuEl.innerHTML = html;
    applySubmenuFocus();
  }

  function renderSlider(rest) {
    if (!sliderTrackEl) return;

    var html = "";
    var i, img;
    for (i = 0; i < rest.images.length; i++) {
      img = rest.images[i];
      html +=
        '<div class="fc-slider-image" data-index="' + i + '">' +
          '<img src="' + img.src + '" alt="' + escapeHtml(rest.name) + '">' +
        "</div>";
    }
    sliderTrackEl.innerHTML = html;
    updateMainPreview();
  }

  function renderDetail() {
    if (!restaurants.length) {
      if (detailEl) detailEl.innerHTML = '<div class="fc-empty"><div class="fc-empty-text">No restaurants available</div></div>';
      return;
    }

    var rest = restaurants[focusSubmenuIndex];
    if (!rest) return;

    safeText(detailTitleEl, rest.name);

    renderSlider(rest);

    if (descriptionEl) {
      var desc = rest.description || "";
      var lines = desc.split("\n");
      var html = "";
      var j;
      for (j = 0; j < lines.length; j++) {
        var line = String(lines[j] || "").replace(/^\s+|\s+$/g, "");
        if (line) html += '<div class="fc-description-text">' + escapeHtml(line) + "</div>";
      }
      
      if (rest.hours) {
        html += '<div class="fc-description-text"><strong>Hours:</strong> ' + escapeHtml(rest.hours) + "</div>";
      }
      
      if (rest.canOrder) {
        html += '<div class="fc-description-text"><strong>Available for ordering</strong></div>';
      }
      
      descriptionEl.innerHTML = html || '<div class="fc-description-text">No description available.</div>';
      descriptionEl.scrollTop = 0;
    }

    focusSliderIndex = 0;
    sliderScrollX = 0;
    updateMainPreview();
    applySliderFocus();
    updateArrows();
  }

  // ---------- FOCUS / SCROLL ----------
  function applySubmenuFocus() {
    if (!submenuEl) return;

    var kids = submenuEl.children;
    var i;
    for (i = 0; i < kids.length; i++) {
      var on = (i === focusSubmenuIndex) && (focusArea === "submenu");
      kids[i].className = "fc-submenu-item" + (on ? " is-focused" : "");
    }

    var mainEl = qs("rest-main");
    if (mainEl) mainEl.className = "fc-main focus-" + focusArea;
  }

  function applySliderFocus() {
    if (!sliderTrackEl) return;

    var kids = sliderTrackEl.children;
    var i;
    for (i = 0; i < kids.length; i++) {
      var on = (i === focusSliderIndex) && (focusArea === "slider");
      kids[i].className = "fc-slider-image" + (on ? " is-focused" : "");
    }
    applySliderScroll();
  }

  function applySliderScroll() {
    if (!sliderTrackEl || !sliderViewportEl) return;

    var rest = restaurants[focusSubmenuIndex];
    if (!rest || !rest.images.length) return;

    var THUMB_W = 300;
    var GAP_X = 20;
    var vpW = sliderViewportEl.offsetWidth || 620;

    var cardLeft = focusSliderIndex * (THUMB_W + GAP_X);
    var cardRight = cardLeft + THUMB_W;

    var x = sliderScrollX;
    if (cardLeft < x) x = cardLeft;
    if (cardRight > x + vpW) x = cardRight - vpW;

    var contentW = rest.images.length * (THUMB_W + GAP_X) - GAP_X;
    var maxX = Math.max(0, contentW - vpW);
    x = clamp(x, 0, maxX);

    sliderScrollX = x;
    sliderTrackEl.style.transform = "translateX(" + -x + "px)";
  }

  function updateMainPreview() {
    var rest = restaurants[focusSubmenuIndex];
    if (!rest || !mainImgEl) return;

    if (!rest.images || !rest.images.length) {
      mainImgEl.src = "";
      mainImgEl.alt = "";
      return;
    }

    var idx = clamp(focusSliderIndex, 0, rest.images.length - 1);
    mainImgEl.src = rest.images[idx].src;
    mainImgEl.alt = rest.name || "";
  }

  function updateArrows() {
    var rest = restaurants[focusSubmenuIndex];
    if (!rest || !leftArrowEl || !rightArrowEl) return;

    if (rest.images.length <= 2) {
      leftArrowEl.className = "fc-slider-arrow fc-slider-arrow--left is-hidden";
      rightArrowEl.className = "fc-slider-arrow fc-slider-arrow--right is-hidden";
      return;
    }

    leftArrowEl.className =
      "fc-slider-arrow fc-slider-arrow--left" + (focusSliderIndex === 0 ? " is-hidden" : "");
    rightArrowEl.className =
      "fc-slider-arrow fc-slider-arrow--right" + (focusSliderIndex === rest.images.length - 1 ? " is-hidden" : "");
  }

  // ---------- NAVIGATION ----------
  function moveSubmenu(delta) {
    if (!restaurants.length) return;

    var newIndex = clamp(focusSubmenuIndex + delta, 0, restaurants.length - 1);
    if (newIndex === focusSubmenuIndex) return;

    focusSubmenuIndex = newIndex;
    applySubmenuFocus();
    renderDetail();
  }

  function moveSlider(delta) {
    var rest = restaurants[focusSubmenuIndex];
    if (!rest || !rest.images.length) return;

    var newIndex = clamp(focusSliderIndex + delta, 0, rest.images.length - 1);
    if (newIndex === focusSliderIndex) return;

    focusSliderIndex = newIndex;
    applySliderFocus();
    updateMainPreview();
    updateArrows();
  }

  // ---------- OPEN/CLOSE ----------
  function open(route) {
    ensureDom();
    if (!viewEl) return;

    pageData = route || null;
    active = true;
    focusArea = "submenu";
    focusSubmenuIndex = 0;
    focusSliderIndex = 0;
    sliderScrollX = 0;

    var title = "Restaurants";
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

    restaurants = [];
    if (route && route.layout_data && route.layout_data.length) {
      var i;
      for (i = 0; i < route.layout_data.length; i++) {
        restaurants.push(normalizeRestaurant(route.layout_data[i]));
      }
    }

    renderSubmenu();
    renderDetail();

    viewEl.className = "tx-view is-active";
  }

  function close() {
    if (!viewEl) return;

    active = false;
    viewEl.className = "tx-view";
    restaurants = [];
    focusSubmenuIndex = 0;
    focusSliderIndex = 0;
    sliderScrollX = 0;
    pageData = null;
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;
    var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, OK = 13;
    var BACK1 = 8, BACK2 = 461, BACK3 = 10009, BACK4 = 27;

    if (k === LEFT && focusArea === "slider") {
      if (focusSliderIndex === 0) {
        focusArea = "submenu";
        applySubmenuFocus();
        applySliderFocus();
        updateArrows();
        return true;
      }
    }

    if (k === RIGHT && focusArea === "submenu") {
      var rest = restaurants[focusSubmenuIndex];
      if (rest && rest.images.length > 0) {
        focusArea = "slider";
        focusSliderIndex = 0;
        sliderScrollX = 0;
        applySubmenuFocus();
        applySliderFocus();
        updateArrows();
        return true;
      }
    }

    if (focusArea === "submenu") {
      if (k === UP) { moveSubmenu(-1); return true; }
      if (k === DOWN) { moveSubmenu(1); return true; }
      if (k === OK) {
        var rest2 = restaurants[focusSubmenuIndex];
        if (rest2 && rest2.images.length > 0) {
          focusArea = "slider";
          focusSliderIndex = 0;
          sliderScrollX = 0;
          applySubmenuFocus();
          applySliderFocus();
          updateArrows();
        }
        return true;
      }
    } else if (focusArea === "slider") {
      if (k === LEFT) { moveSlider(-1); return true; }
      if (k === RIGHT) { moveSlider(1); return true; }
      if (k === UP) { moveSubmenu(-1); return true; }
      if (k === DOWN) { moveSubmenu(1); return true; }
    }

    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      return false;
    }

    return false;
  }

  w.RestaurantsPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; }
  };
})(window);