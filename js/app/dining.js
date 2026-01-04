// js/app/dining.js — In-Room Dining page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.DiningPage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, submenuEl, gridViewportEl, gridEl;

  var detailEl, detailMainImageEl, detailThumbsEl;
  var detailNameEl, detailPriceEl, detailDescEl, detailBadgesEl;
  var detailQtyValueEl, detailAddBtnEl;

  // NOTE: these IDs might not match meaning if you swapped +/− in HTML
  // so we will NOT trust the names; we resolve by DOM order + button text.
  var qtyBtnA, qtyBtnB;

  // ---------- STATE ----------
  var active = false;
  var focusArea = "submenu"; // "submenu" | "grid" | "detail"
  var mode = "grid";         // "grid" | "detail"

  var categories = [];
  var focusCategoryIndex = 0;
  var focusItemIndex = 0;
  var gridScrollY = 0;

  var detailItem = null;
  var detailQuantity = 1;
  var detailFocusIndex = 0; // index into detail focusables (qty btns + add)
  var detailImageIndex = 0;

  // ---------- LAYOUT CONSTANTS ----------
  var COLS = 1;        // vertical list
  var CARD_H = 190;    // figma card height
  var GAP_Y = 24;      // figma gap

  var SUB_COLS = 3;
  var TILE_H = 150;
  var TILE_GAP = 35;
  var SUB_VIEW_H = 520;
  var subScrollY = 0;

  var SUB_PAGE_SIZE = 9; // 3 cols x 3 rows
  var subPageStart = 0;

  // ---------- HELPERS ----------
  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = (txt == null ? "" : String(txt)); }

  function escapeHtml(s) {
    s = s == null ? "" : String(s);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }



  // ✅ API moved out: use TenxApi helpers (fallback safe)
  function apiAssetUrl(url) {
    try {
      if (w.TenxApi && typeof w.TenxApi.rewriteAssetUrl === "function") {
        return w.TenxApi.rewriteAssetUrl(url);
      }
    } catch (e) {}
    return String(url || "");
  }

  function apiStripHtml(html) {
    try {
      if (w.TenxApi && typeof w.TenxApi.stripHtmlTags === "function") {
        return w.TenxApi.stripHtmlTags(html);
      }
    } catch (e2) {}
    // fallback
    html = String(html || "");
    html = html.replace(/<br\s*\/?>/gi, "\n");
    html = html.replace(/<\/p>/gi, "\n");
    html = html.replace(/<[^>]+>/g, "");
    return html;
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-dining");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".dn-bg");
    pageTitleEl = qs("dn-page-title");
    submenuEl = qs("dn-submenu");
    gridViewportEl = qs("dn-grid-viewport");
    gridEl = qs("dn-grid");

    detailEl = qs("dn-detail");
    detailMainImageEl = qs("dn-detail-main-image");
    detailThumbsEl = qs("dn-detail-thumbs");
    detailNameEl = qs("dn-detail-name");
    detailPriceEl = qs("dn-detail-price");
    detailDescEl = qs("dn-detail-desc");
    detailBadgesEl = qs("dn-detail-badges");
    detailQtyValueEl = qs("dn-detail-qty-value");
    detailAddBtnEl = qs("dn-detail-add-btn");

    // These IDs may be swapped in meaning; treat them as two generic buttons.
    qtyBtnA = qs("dn-qty-minus");
    qtyBtnB = qs("dn-qty-plus");
  }

  function subPageForIndex(idx) { return Math.floor(idx / SUB_PAGE_SIZE); }
  function subStartForIndex(idx) { return subPageForIndex(idx) * SUB_PAGE_SIZE; }

  // ---------- DETAIL FOCUSABLES (robust even if +/− swapped) ----------
  function getQtyButtonsInDomOrder() {
    // Prefer DOM order inside the quantity container (visual left -> right)
    try {
      if (detailEl) {
        var q = detailEl.querySelector(".dn-detail__quantity");
        if (q) {
          var n = q.querySelectorAll(".dn-detail__qty-btn");
          if (n && n.length) return n;
        }
      }
    } catch (e) {}
    // fallback to the two known buttons
    var arr = [];
    if (qtyBtnA) arr.push(qtyBtnA);
    if (qtyBtnB) arr.push(qtyBtnB);
    return arr;
  }

  function isPlusButton(el) {
    if (!el) return false;
    var t = "";
    try { t = (el.textContent || "").replace(/\s+/g, ""); } catch (e) { t = ""; }
    return (t.indexOf("+") >= 0 || t === "＋");
  }

  function isMinusButton(el) {
    if (!el) return false;
    var t = "";
    try { t = (el.textContent || "").replace(/\s+/g, ""); } catch (e) { t = ""; }
    // covers "-" and "−"
    return (t.indexOf("−") >= 0 || t.indexOf("-") >= 0);
  }

  function getDetailFocusables() {
    var btns = getQtyButtonsInDomOrder(); // 2 buttons in visual order
    var elems = [];
    if (btns && btns.length) {
      elems.push(btns[0]);
      if (btns.length > 1) elems.push(btns[1]);
    }
    elems.push(detailAddBtnEl);
    return elems;
  }

  function pickPlusIndex() {
    var btns = getQtyButtonsInDomOrder();
    var i;
    for (i = 0; i < btns.length; i++) {
      if (isPlusButton(btns[i])) return i;
    }
    // fallback: first button
    return 0;
  }

  // ---------- DATA MAPPING ----------
  function normalizeCategory(cat) {
    var items = [];
    if (cat.items && cat.items.length) {
      var i;
      for (i = 0; i < cat.items.length; i++) items.push(normalizeItem(cat.items[i]));
    }
    return {
      id: cat.item_category_id || "",
      name: cat.item_category_name || "Category",
      icon: apiAssetUrl(cat.item_category_icon || ""),
      items: items
    };
  }

  function normalizeItem(item) {
    var images = [];
    var i;

    if (item.item_slider && item.item_slider.length) {
      for (i = 0; i < item.item_slider.length; i++) {
        images.push(apiAssetUrl(item.item_slider[i].img_src || ""));
      }
    }

    if (!images.length && item.item_cover) images.push(apiAssetUrl(item.item_cover));

    var ingredients = [];
    if (item.items_ingredients && item.items_ingredients.length) {
      var j;
      for (j = 0; j < item.items_ingredients.length; j++) {
        var ing = item.items_ingredients[j];
        ingredients.push({
          name: ing.item_ingredient_name || "",
          code: ing.item_ingredient_code || ""
        });
      }
    }

    return {
      id: item.item_id || "",
      name: item.item_name || "Item",
      intro: apiStripHtml(item.item_intro || ""),
      price: Number(item.item_price || 0),
      available: item.item_availability === 1,
      images: images,
      ingredients: ingredients
    };
  }

  // ---------- RENDER ----------
  function renderSubmenu() {
    if (!submenuEl) return;

    var wantedStart = subStartForIndex(focusCategoryIndex);
    if (wantedStart !== subPageStart) subPageStart = wantedStart;

    var end = Math.min(categories.length, subPageStart + SUB_PAGE_SIZE);

    var html = "";
    var i, ic, c;
    for (i = subPageStart; i < end; i++) {
      c = categories[i];
      ic = c.icon || "";
      html += ""
        + '<div class="dn-submenu-item" data-index="' + i + '">'
        +   '<div class="dn-submenu-item__icon" style="background-image:url(\'' + ic + '\');"></div>'
        +   '<div class="dn-submenu-item__label">' + escapeHtml(c.name) + "</div>"
        + "</div>";
    }

    submenuEl.innerHTML = html;
    applySubmenuFocus();
    ensureSubmenuVisible();
  }

  function renderGrid() {
    if (!gridEl) return;

    var cat = categories[focusCategoryIndex];
    if (!cat || !cat.items.length) {
      gridEl.innerHTML = '<div style="color:rgba(255,255,255,0.7);font-size:28px;padding:40px;">No items available</div>';
      return;
    }

    var html = "";
    var i, item, img, desc, pills, j;

    for (i = 0; i < cat.items.length; i++) {
      item = cat.items[i];

      img = (item.images && item.images.length) ? item.images[0] : "";
      desc = item.intro || "";
      if (desc.length > 90) desc = desc.substring(0, 90) + "...";

      pills = "";
      for (j = 0; j < item.ingredients.length && j < 2; j++) {
        pills += '<span class="dn-pill">' + escapeHtml(item.ingredients[j].code || "") + "</span>";
      }
      pills += item.available
        ? '<span class="dn-pill dn-pill--ok">Available</span>'
        : '<span class="dn-pill dn-pill--off">Unavailable</span>';

      html += ""
        + '<div class="dn-item-card" data-index="' + i + '" style="left:0px; top:' + (i * (CARD_H + GAP_Y)) + 'px;">'
        +   '<div class="dn-item-card__row">'
        +     '<div class="dn-item-card__thumb" style="background-image:url(\'' + img + '\');"></div>'
        +     '<div class="dn-item-card__meta">'
        +       '<div class="dn-item-card__name">' + escapeHtml(item.name) + "</div>"
        +       '<div class="dn-item-card__desc">' + escapeHtml(desc) + "</div>"
        +       '<div class="dn-item-card__pills">' + pills + "</div>"
        +     "</div>"
        +     '<div class="dn-item-card__actions">'
        +       '<div class="dn-item-card__btn">Add to Cart</div>'
        +       '<div class="dn-item-card__price">' + item.price.toFixed(2) + " SAR</div>"
        +     "</div>"
        +   "</div>"
        + "</div>";
    }

    gridEl.innerHTML = html;
    applyGridFocus();
  }

  function ensureSubmenuVisible() {
    if (!submenuEl) return;

    var row = Math.floor(focusCategoryIndex / SUB_COLS);
    var tileTop = row * (TILE_H + TILE_GAP);
    var tileBottom = tileTop + TILE_H;

    var padTop = 0;
    var padBottom = TILE_GAP;

    if (tileTop - subScrollY < padTop) subScrollY = tileTop - padTop;
    if (tileBottom - subScrollY > SUB_VIEW_H - padBottom) subScrollY = tileBottom - (SUB_VIEW_H - padBottom);

    var totalRows = Math.ceil(categories.length / SUB_COLS);
    var totalH = totalRows * (TILE_H + TILE_GAP) - TILE_GAP;
    var maxScroll = Math.max(0, totalH - SUB_VIEW_H);

    subScrollY = clamp(subScrollY, 0, maxScroll);
    submenuEl.style.transform = "translateY(" + (-subScrollY) + "px)";
  }

  function applySubmenuFocus() {
    if (!submenuEl) return;
    var kids = submenuEl.children;
    var i, idx;
    for (i = 0; i < kids.length; i++) {
      idx = Number(kids[i].getAttribute("data-index") || -1);
      var on = (idx === focusCategoryIndex) && (focusArea === "submenu");
      kids[i].className = "dn-submenu-item" + (on ? " is-focused" : "");
    }
  }

  function applyGridFocus() {
    if (!gridEl) return;
    var cards = gridEl.querySelectorAll(".dn-item-card");
    var i;
    for (i = 0; i < cards.length; i++) {
      var on = (i === focusItemIndex) && (focusArea === "grid");
      cards[i].className = "dn-item-card" + (on ? " is-focused" : "");
    }
    ensureGridVisible();
  }

  function ensureGridVisible() {
    if (!gridViewportEl || !gridEl) return;

    var cat = categories[focusCategoryIndex];
    if (!cat) return;

    var row = Math.floor(focusItemIndex / COLS);
    var cardTop = row * (CARD_H + GAP_Y);
    var cardBottom = cardTop + CARD_H;

    var vpH = gridViewportEl.clientHeight || 618;
    var padTop = 0, padBottom = 0;

    if (cardTop - gridScrollY < padTop) gridScrollY = cardTop - padTop;
    if (cardBottom - gridScrollY > vpH - padBottom) gridScrollY = cardBottom - (vpH - padBottom);

    gridScrollY = clamp(
      gridScrollY,
      0,
      Math.max(0, (Math.ceil(cat.items.length / COLS) * (CARD_H + GAP_Y)) - vpH)
    );

    gridEl.style.transform = "translateY(" + (-gridScrollY) + "px)";
  }

  // ---------- DETAIL VIEW ----------
  function updateDetailQuantity() {
    safeText(detailQtyValueEl, String(detailQuantity));
  }

  function applyDetailFocus() {
    var elems = getDetailFocusables();
    var i;
    for (i = 0; i < elems.length; i++) {
      if (!elems[i]) continue;
      var on = (i === detailFocusIndex) && (focusArea === "detail");
      elems[i].className = elems[i].className.replace(/\bis-focused\b/g, "");
      if (on) elems[i].className += " is-focused";
    }
  }

  function showDetail(item) {
    if (!item) return;

    detailItem = item;
    detailQuantity = 1;
    detailImageIndex = 0;

    mode = "detail";
    focusArea = "detail";
    if (detailEl) detailEl.className = "dn-detail is-active";

    safeText(detailNameEl, item.name);
    safeText(detailPriceEl, item.price.toFixed(2) + " SAR");

    if (detailDescEl) {
      var txt = item.intro || "";
      if (txt.length > 160) txt = txt.substring(0, 160) + "...";
      detailDescEl.innerHTML = escapeHtml(txt).replace(/\n/g, "<br>");
    }

    if (detailBadgesEl) {
      var first = "";
      if (item.ingredients && item.ingredients.length) first = item.ingredients[0].code || item.ingredients[0].name || "";
      var badgesHtml = "";
      if (first) badgesHtml += '<span class="dn-detail__badge">' + escapeHtml(first) + "</span>";
      badgesHtml += item.available
        ? '<span class="dn-detail__badge dn-detail__badge--ok">Available</span>'
        : '<span class="dn-detail__badge dn-detail__badge--off">Unavailable</span>';
      detailBadgesEl.innerHTML = badgesHtml;
    }

    if (detailMainImageEl) {
      var img = (item.images && item.images.length) ? item.images[0] : "";
      detailMainImageEl.style.backgroundImage = img ? ("url('" + img + "')") : "none";
    }

    if (detailThumbsEl) detailThumbsEl.innerHTML = "";

    // ✅ Default focus should be on PLUS (wherever it is)
    detailFocusIndex = pickPlusIndex();

    updateDetailQuantity();
    applyDetailFocus();
  }

  function hideDetail() {
    mode = "grid";
    focusArea = "grid";
    if (detailEl) detailEl.className = "dn-detail";
    detailItem = null;
  }

  function addToCart() {
    if (!detailItem) return;

    // Add to cart via CartPage API
    if (w.CartPage && typeof w.CartPage.addItem === "function") {
      w.CartPage.addItem({
        id: detailItem.id,
        name: detailItem.name,
        price: detailItem.price,
        qty: detailQuantity,
        category_id: categories[focusCategoryIndex].id
      });

      if (w.tenxToast) {
  w.tenxToast(
        "Added to cart\n" +
        detailItem.name +
        "\nQty: " + detailQuantity +
        "  •  Total: " + (detailItem.price * detailQuantity).toFixed(2) + " SAR",
        3000,
        "success"
        );}

    } else {
      if (w.tenxToast) {
        w.tenxToast("Cart system not loaded.", 3000, "error");
      }
    }

    hideDetail();
  }

  // ---------- NAV ----------
  function moveSubmenu(delta) {
    if (!categories.length) return;

    var newIndex = clamp(focusCategoryIndex + delta, 0, categories.length - 1);
    if (newIndex === focusCategoryIndex) return;

    focusCategoryIndex = newIndex;
    focusItemIndex = 0;
    gridScrollY = 0;

    var newStart = subStartForIndex(focusCategoryIndex);
    if (newStart !== subPageStart) {
      subPageStart = newStart;
      renderSubmenu();
    } else {
      applySubmenuFocus();
      ensureSubmenuVisible();
    }

    renderGrid();
  }

  function moveGrid(dx, dy) {
    var cat = categories[focusCategoryIndex];
    if (!cat || !cat.items.length) return;

    var row = Math.floor(focusItemIndex / COLS);
    var col = focusItemIndex % COLS;

    row += dy;
    col += dx;

    row = clamp(row, 0, Math.ceil(cat.items.length / COLS) - 1);
    col = clamp(col, 0, COLS - 1);

    var newIndex = row * COLS + col;
    newIndex = clamp(newIndex, 0, cat.items.length - 1);

    if (newIndex === focusItemIndex) return;
    focusItemIndex = newIndex;
    applyGridFocus();
  }

  function moveDetail(delta) {
    var elems = getDetailFocusables();
    detailFocusIndex = clamp(detailFocusIndex + delta, 0, Math.max(0, elems.length - 1));
    applyDetailFocus();
  }

  // ---------- OPEN/CLOSE ----------
  function open(route) {
    ensureDom();
    if (!viewEl) return;

    active = true;
    focusArea = "submenu";
    mode = "grid";

    focusCategoryIndex = 0;
    focusItemIndex = 0;

    gridScrollY = 0;
    subScrollY = 0;
    subPageStart = 0;

    if (submenuEl) submenuEl.style.transform = "translateY(0px)";

    var title = "In-Room Dining";
    if (route && route.route_name) title = route.route_name;
    safeText(pageTitleEl, title);

    if (bgEl && route && route.route_bg) {
      bgEl.style.backgroundImage = "url('" + apiAssetUrl(route.route_bg) + "')";
      bgEl.style.backgroundSize = "cover";
      bgEl.style.backgroundPosition = "center";
    }

    categories = [];
    if (route && route.layout_data && route.layout_data.length) {
      var restaurant = route.layout_data[0];
      if (restaurant && restaurant.item_categories && restaurant.item_categories.length) {
        var i;
        for (i = 0; i < restaurant.item_categories.length; i++) {
          categories.push(normalizeCategory(restaurant.item_categories[i]));
        }
      }
    }

    renderSubmenu();
    renderGrid();

    viewEl.className = "tx-view is-active";
  }

  function close() {
    if (!viewEl) return;
    active = false;
    viewEl.className = "tx-view";
    hideDetail();
    categories = [];
    focusCategoryIndex = 0;
    focusItemIndex = 0;
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;
    var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, OK = 13;
    var BACK1 = 8, BACK2 = 461, BACK3 = 10009, BACK4 = 27;

    if (mode === "detail") {
      if (k === LEFT)  { moveDetail(-1); return true; }
      if (k === RIGHT) { moveDetail( 1); return true; }

      if (k === OK) {
        var elems = getDetailFocusables();
        var focused = elems[detailFocusIndex];

        if (focused === detailAddBtnEl) {
          addToCart();
          return true;
        }

        // Decide by button text, not by ID/name
        if (isPlusButton(focused)) {
          detailQuantity = Math.min(99, detailQuantity + 1);
          updateDetailQuantity();
          return true;
        }
        if (isMinusButton(focused)) {
          detailQuantity = Math.max(1, detailQuantity - 1);
          updateDetailQuantity();
          return true;
        }

        // fallback: first qty = plus, second = minus
        if (detailFocusIndex === 0) detailQuantity = Math.min(99, detailQuantity + 1);
        else detailQuantity = Math.max(1, detailQuantity - 1);
        updateDetailQuantity();
        return true;
      }

      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        hideDetail();
        return true;
      }

      return false;
    }

    if (k === LEFT) {
      if (focusArea === "grid") {
        var col = focusItemIndex % COLS;
        if (col === 0) {
          focusArea = "submenu";
          applySubmenuFocus();
          applyGridFocus();
          return true;
        }
        moveGrid(-1, 0);
        return true;
      }
      return true;
    }

    if (k === RIGHT) {
      if (focusArea === "submenu") {
        focusArea = "grid";
        applySubmenuFocus();
        applyGridFocus();
        return true;
      }
      moveGrid(1, 0);
      return true;
    }

    if (k === UP) {
      if (focusArea === "submenu") { moveSubmenu(-1); return true; }
      moveGrid(0, -1);
      return true;
    }

    if (k === DOWN) {
      if (focusArea === "submenu") { moveSubmenu(1); return true; }
      moveGrid(0, 1);
      return true;
    }

    if (k === OK) {
      if (focusArea === "submenu") {
        focusArea = "grid";
        applySubmenuFocus();
        applyGridFocus();
        return true;
      }

      if (focusArea === "grid") {
        var cat = categories[focusCategoryIndex];
        if (cat && cat.items[focusItemIndex]) showDetail(cat.items[focusItemIndex]);
        return true;
      }
    }

    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      return false;
    }

    return false;
  }

  // ---------- EXPORT ----------
  w.DiningPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; }
  };

})(window);
