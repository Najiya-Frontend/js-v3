// js/app/facilities.js — Facilities/Hotel Info page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.FacilitiesPage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, submenuEl, detailEl;
  var detailTitleEl, sliderViewportEl, sliderTrackEl, descriptionEl;
  var mainImgEl;
  var leftArrowEl, rightArrowEl;

  // ---------- STATE ----------
  var active = false;
  var focusArea = "submenu"; // "submenu" | "slider"

  var pageData = null; // route object with layout_data
  var items = []; // submenu items from layout_data
  var focusSubmenuIndex = 0;
  var focusSliderIndex = 0;
  var sliderScrollX = 0;

  var pageKey = ""; // KEY_FACILITIES or KEY_OUR_SERVICES, etc.

  // ---------- HELPERS ----------
  function qs(id) {
    return document.getElementById(id);
  }
  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }
  function safeText(el, txt) {
    if (el) el.textContent = txt == null ? "" : String(txt);
  }

  function escapeHtml(s) {
    s = s == null ? "" : String(s);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function apiOrigin() {
    try {
      if (w.TenxApi && w.TenxApi.HOST)
        return String(w.TenxApi.HOST).replace(/\/+$/, "");
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

  function stripHtmlTags(html) {
    html = String(html || "");
    // Remove HTML tags but keep line breaks
    html = html.replace(/<br\s*\/?>/gi, "\n");
    html = html.replace(/<\/p>/gi, "\n");
    html = html.replace(/<[^>]+>/g, "");
    // Decode common entities
    html = html.replace(/&nbsp;/g, " ");
    html = html.replace(/&amp;/g, "&");
    html = html.replace(/&lt;/g, "<");
    html = html.replace(/&gt;/g, ">");
    html = html.replace(/&quot;/g, '"');
    return html;
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-facilities");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".fc-bg");
    pageTitleEl = qs("fc-page-title");
    submenuEl = qs("fc-submenu");
    detailEl = qs("fc-detail");
    detailTitleEl = qs("fc-detail-title");
    sliderViewportEl = qs("fc-slider-viewport");
    sliderTrackEl = qs("fc-slider-track");
    descriptionEl = qs("fc-description");
    leftArrowEl = qs("fc-slider-arrow-left");
    rightArrowEl = qs("fc-slider-arrow-right");
    mainImgEl = qs("fc-main-img");

  }

  // ---------- DATA MAPPING ----------
  function normalizeItem(x) {
    x = x || {};

    // Parse slider data
    var sliderData = [];
    if (x.slider && typeof x.slider === "string") {
      try {
        sliderData = JSON.parse(x.slider);
      } catch (e) {
        sliderData = [];
      }
    } else if (x.slider && typeof x.slider.length === "number") {
      sliderData = x.slider;
    }

    // Map slider images
    var images = [];
    var i;
    for (i = 0; i < sliderData.length; i++) {
      var img = sliderData[i];
      images.push({
        src: rewriteAssetUrl(img.img_src || img.src || img.image || ""),
        duration: img.img_duration || img.duration || 3
      });
    }

    // If no slider, use icon as fallback
    if (!images.length && x.icon) {
      images.push({
        src: rewriteAssetUrl(x.icon),
        duration: 3
      });
    }

    return {
      id: x.id || x.facility_id || "",
      name: x.name || x.subtitle || "Untitled",
      description: stripHtmlTags(x.intro || x.slogan || x.description || ""),
      images: images
    };
  }

  // ---------- RENDER ----------
  function renderSubmenu() {
    if (!submenuEl) return;

    var html = "";
    var i, item;

    for (i = 0; i < items.length; i++) {
      item = items[i];
      html +=
        '<div class="fc-submenu-item" data-index="' +
        i +
        '">' +
        escapeHtml(item.name) +
        "</div>";
    }

    submenuEl.innerHTML = html;
    applySubmenuFocus();
  }

  function renderDetail() {
    if (!items.length) {
      if (detailEl) detailEl.innerHTML = '<div class="fc-empty"><div class="fc-empty-text">No information available</div></div>';
      return;
    }

    var item = items[focusSubmenuIndex];
    if (!item) return;

    // Set title
    safeText(detailTitleEl, item.name);

    // Render slider
    renderSlider(item);

    // Render description
    if (descriptionEl) {
      var desc = item.description || "";
      var lines = desc.split("\n");
      var html = "";
      var j;
      for (j = 0; j < lines.length; j++) {
        var line = lines[j].trim();
        if (line) {
          html += '<div class="fc-description-text">' + escapeHtml(line) + "</div>";
        }
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

function renderSlider(item) {
  if (!sliderTrackEl) return;

  var html = "";
  var i, img;

  for (i = 0; i < item.images.length; i++) {
    img = item.images[i];
    html +=
      '<div class="fc-slider-image" data-index="' + i + '">' +
        '<img src="' + img.src + '" alt="' + escapeHtml(item.name) + '">' +
      '</div>';
  }

  sliderTrackEl.innerHTML = html;

  // Set main preview
  updateMainPreview();
}

  // ---------- FOCUS ----------
  function applySubmenuFocus() {
    if (!submenuEl) return;

    var kids = submenuEl.children;
    var i;
    for (i = 0; i < kids.length; i++) {
      var on = i === focusSubmenuIndex && focusArea === "submenu";
      kids[i].className = "fc-submenu-item" + (on ? " is-focused" : "");
    }

    // Update main class for styling
    var mainEl = qs("fc-main");
    if (mainEl) {
      mainEl.className = "fc-main focus-" + focusArea;
    }
  }

function applySliderFocus() {
  if (!sliderTrackEl) return;

  var kids = sliderTrackEl.children;
  var i;
  for (i = 0; i < kids.length; i++) {
    var on = i === focusSliderIndex && focusArea === "slider";
    kids[i].className = "fc-slider-image" + (on ? " is-focused" : "");
  }

  applySliderScroll();
}


function applySliderScroll() {
  if (!sliderTrackEl || !sliderViewportEl) return;

  var item = items[focusSubmenuIndex];
  if (!item || !item.images.length) return;

  // thumb sizing must match CSS
  var THUMB_W = 300;
  var GAP_X = 20;

  var vpW = sliderViewportEl.offsetWidth || 620;

  var cardLeft = focusSliderIndex * (THUMB_W + GAP_X);
  var cardRight = cardLeft + THUMB_W;

  var x = sliderScrollX;
  if (cardLeft < x) x = cardLeft;
  if (cardRight > x + vpW) x = cardRight - vpW;

  var contentW = item.images.length * (THUMB_W + GAP_X) - GAP_X;
  var maxX = Math.max(0, contentW - vpW);
  x = clamp(x, 0, maxX);

  sliderScrollX = x;
  sliderTrackEl.style.transform = "translateX(" + -x + "px)";
}

  function updateMainPreview() {
    var item = items[focusSubmenuIndex];
    if (!item || !mainImgEl) return;

    if (!item.images || !item.images.length) {
        mainImgEl.src = "";
        mainImgEl.alt = "";
        return;
    }

    var idx = clamp(focusSliderIndex, 0, item.images.length - 1);
    mainImgEl.src = item.images[idx].src;
    mainImgEl.alt = item.name || "";
    }


function updateArrows() {
  var item = items[focusSubmenuIndex];
  if (!item || !leftArrowEl || !rightArrowEl) return;

  // show arrows only if more than 2 thumbs
  if (item.images.length <= 2) {
    leftArrowEl.className = "fc-slider-arrow fc-slider-arrow--left is-hidden";
    rightArrowEl.className = "fc-slider-arrow fc-slider-arrow--right is-hidden";
    return;
  }

  leftArrowEl.className =
    "fc-slider-arrow fc-slider-arrow--left" + (focusSliderIndex === 0 ? " is-hidden" : "");
  rightArrowEl.className =
    "fc-slider-arrow fc-slider-arrow--right" + (focusSliderIndex === item.images.length - 1 ? " is-hidden" : "");
}


  // ---------- NAVIGATION ----------
  function moveSubmenu(delta) {
    if (!items.length) return;

    var newIndex = focusSubmenuIndex + delta;
    newIndex = clamp(newIndex, 0, items.length - 1);

    if (newIndex === focusSubmenuIndex) return;

    focusSubmenuIndex = newIndex;
    applySubmenuFocus();
    renderDetail();
  }

function moveSlider(delta) {
  var item = items[focusSubmenuIndex];
  if (!item || !item.images.length) return;

  var newIndex = focusSliderIndex + delta;
  newIndex = clamp(newIndex, 0, item.images.length - 1);

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

    // Determine page key
    pageKey = (route && route.route_key) ? String(route.route_key).toUpperCase() : "";

    // Set page title
    var title = "Facilities";
    if (route && route.route_name) {
      title = route.route_name;
    } else if (pageKey === "KEY_OUR_SERVICES") {
      title = "Hotel Information";
    } else if (pageKey === "KEY_FACILITIES") {
      title = "Facilities";
    }
    safeText(pageTitleEl, title);

    // Set background
    if (bgEl && route && route.route_bg) {
      var bg = String(route.route_bg || "");
      if (bg) {
        bgEl.style.backgroundImage = "url('" + rewriteAssetUrl(bg) + "')";
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundPosition = "center";
      }
    }

    // Parse layout_data
    items = [];
    if (route && route.layout_data && route.layout_data.length) {
      var i;
      for (i = 0; i < route.layout_data.length; i++) {
        items.push(normalizeItem(route.layout_data[i]));
      }
    }

    // Render
    renderSubmenu();
    renderDetail();

    viewEl.className = "tx-view is-active";
  }

  function close() {
    if (!viewEl) return;

    active = false;
    viewEl.className = "tx-view";
    items = [];
    focusSubmenuIndex = 0;
    focusSliderIndex = 0;
    sliderScrollX = 0;
    pageData = null;
    pageKey = "";
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;

    var LEFT = 37,
      UP = 38,
      RIGHT = 39,
      DOWN = 40,
      OK = 13;
    var BACK1 = 8,
      BACK2 = 461,
      BACK3 = 10009,
      BACK4 = 27;

    // Switch between submenu and slider
    if (k === LEFT && focusArea === "slider") {
      var item = items[focusSubmenuIndex];
      if (item && focusSliderIndex === 0) {
        focusArea = "submenu";
        applySubmenuFocus();
        applySliderFocus();
        updateArrows();
        return true;
      }
    }

    if (k === RIGHT && focusArea === "submenu") {
      var item2 = items[focusSubmenuIndex];
      if (item2 && item2.images.length > 0) {
        focusArea = "slider";
        focusSliderIndex = 0;
        sliderScrollX = 0;
        applySubmenuFocus();
        applySliderFocus();
        updateArrows();
        return true;
      }
    }

    // Navigation within areas
    if (focusArea === "submenu") {
      if (k === UP) {
        moveSubmenu(-1);
        return true;
      }
      if (k === DOWN) {
        moveSubmenu(1);
        return true;
      }
      if (k === OK) {
        // Switch to slider if images available
        var item3 = items[focusSubmenuIndex];
        if (item3 && item3.images.length > 0) {
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
      if (k === LEFT) {
        moveSlider(-1);
        return true;
      }
      if (k === RIGHT) {
        moveSlider(1);
        return true;
      }
      if (k === UP) {
        moveSubmenu(-1);
        return true;
      }
      if (k === DOWN) {
        moveSubmenu(1);
        return true;
      }
    }

    // Back key - let home.js handle going back
    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      return false;
    }

    return false;
  }

  // Export
  w.FacilitiesPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () {
      return active;
    }
  };
})(window);