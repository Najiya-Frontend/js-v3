// js/app/cart.js — Cart page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.CartPage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, tableBodyEl, totalAmountEl, placeOrderBtnEl;
  var emptyStateEl;

  // ---------- STATE ----------
  var active = false;
  var focusArea = "table"; // "table" | "placeorder"
  var focusItemIndex = 0;
  var focusQtyBtnIndex = 0; // 0=minus, 1=plus for focused row

  var cartItems = []; // [{id, name, price, qty, category_id}]

  // ---------- HELPERS ----------
  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = txt == null ? "" : String(txt); }

  function escapeHtml(s) {
    s = s == null ? "" : String(s);
    return s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-cart");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".cart-bg");
    pageTitleEl = qs("cart-page-title");
    tableBodyEl = qs("cart-table-body");
    totalAmountEl = qs("cart-total-amount");
    placeOrderBtnEl = qs("cart-place-order-btn");
    emptyStateEl = qs("cart-empty-state");
  }

  // ---------- CART STORAGE ----------
  function loadCartFromStorage() {
    try {
      var raw = sessionStorage.getItem("tenx_cart_items");
      if (!raw) return [];
      var items = JSON.parse(raw);
      if (!Array.isArray(items)) return [];
      return items;
    } catch (e) {
      return [];
    }
  }

  function saveCartToStorage(items) {
    try {
      sessionStorage.setItem("tenx_cart_items", JSON.stringify(items));
    } catch (e) {}
  }

  function clearCart() {
    cartItems = [];
    saveCartToStorage([]);
  }

  // ---------- RENDER ----------
  function renderTable() {
    if (!tableBodyEl) return;

    if (!cartItems.length) {
      tableBodyEl.innerHTML = "";
      if (emptyStateEl) emptyStateEl.style.display = "block";
      updateTotal();
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = "none";

    var html = "";
    var i, item, itemTotal;

    for (i = 0; i < cartItems.length; i++) {
      item = cartItems[i];
      itemTotal = (item.price * item.qty).toFixed(2);

      html += '<tr class="cart-table-row" data-index="' + i + '">';
      html += '<td>' + escapeHtml(item.name) + '</td>';
      
      html += '<td>';
      html += '<div class="cart-qty-controls">';
      html += '<div class="cart-qty-btn" data-action="minus" data-index="' + i + '">−</div>';
      html += '<div class="cart-qty-value">' + item.qty + '</div>';
      html += '<div class="cart-qty-btn" data-action="plus" data-index="' + i + '">+</div>';
      html += '</div>';
      html += '</td>';

      html += '<td>' + item.price.toFixed(2) + '</td>';
      html += '<td>' + itemTotal + ' SAR</td>';
      html += '</tr>';
    }

    tableBodyEl.innerHTML = html;
    applyFocus();
    updateTotal();
  }

  function updateTotal() {
    var total = 0;
    var i;
    for (i = 0; i < cartItems.length; i++) {
      total += cartItems[i].price * cartItems[i].qty;
    }

    safeText(totalAmountEl, total.toFixed(2) + " SAR");

    if (placeOrderBtnEl) {
      placeOrderBtnEl.disabled = (cartItems.length === 0);
    }
  }

  function applyFocus() {
    if (!tableBodyEl) return;

    // Clear all focus
    var allRows = tableBodyEl.querySelectorAll(".cart-table-row");
    var allBtns = tableBodyEl.querySelectorAll(".cart-qty-btn");
    var i;

    for (i = 0; i < allRows.length; i++) {
      allRows[i].className = "cart-table-row";
    }
    for (i = 0; i < allBtns.length; i++) {
      allBtns[i].className = allBtns[i].className.replace(/\bis-focused\b/g, "");
    }

    if (placeOrderBtnEl) {
      placeOrderBtnEl.className = placeOrderBtnEl.className.replace(/\bis-focused\b/g, "");
    }

    if (focusArea === "placeorder") {
      if (placeOrderBtnEl) placeOrderBtnEl.className += " is-focused";
      return;
    }

    // Focus on table row
    if (focusArea === "table" && cartItems.length) {
      focusItemIndex = clamp(focusItemIndex, 0, cartItems.length - 1);

      var row = allRows[focusItemIndex];
      if (row) row.className = "cart-table-row is-focused";

      // Focus on qty button within that row
      var btns = tableBodyEl.querySelectorAll('tr[data-index="' + focusItemIndex + '"] .cart-qty-btn');
      if (btns && btns.length > focusQtyBtnIndex) {
        btns[focusQtyBtnIndex].className += " is-focused";
      }
    }
  }

  // ---------- CART OPERATIONS ----------
  function changeQty(index, delta) {
    if (!cartItems[index]) return;

    cartItems[index].qty += delta;

    if (cartItems[index].qty <= 0) {
      cartItems.splice(index, 1);
      if (focusItemIndex >= cartItems.length) {
        focusItemIndex = Math.max(0, cartItems.length - 1);
      }
    }

    saveCartToStorage(cartItems);
    renderTable();
  }

  // ---------- PLACE ORDER ----------
  function placeOrder() {
    if (!cartItems.length) {
      alert("Cart is empty!");
      return;
    }

    // Check if TenxApi and createOrder exist
    if (!w.TenxApi || typeof w.TenxApi.createOrder !== "function") {
      alert("TenxApi.createOrder not found. Cannot place order.");
      return;
    }

    var orderItems = [];
    var orderTotal = 0;
    var i, item;

    for (i = 0; i < cartItems.length; i++) {
      item = cartItems[i];
      orderItems.push({
        item_id: item.id,
        item_category_id: item.category_id || 0,
        item_qty: item.qty,
        item_price: item.price,
        item_name: item.name
      });
      orderTotal += item.price * item.qty;
    }

    var payload = {
      order_items: orderItems,
      order_total: orderTotal,
      order_note: "",
      order_location: "In-Room"
    };

    // Get restaurant_id from session or config
    try {
      var cached = sessionStorage.getItem("DEVICE_INFO");
      if (cached) {
        var info = JSON.parse(cached);
        payload.restaurant_id = info.restaurant_id || 1;
        payload.hotel_id = info.hotel_id || 1;
        payload.guest_id = info.guest_id || 0;
        payload.app_id = info.app_id || 2;
      }
    } catch (e) {}

    w.TenxApi.createOrder(payload).then(function (res) {
      alert("✅ Order placed successfully!\n\nOrder ID: " + (res && res.order_id ? res.order_id : "N/A"));
      clearCart();
      renderTable();
    }, function (err) {
      alert("❌ Order failed\n\n" + JSON.stringify(err || {}, null, 2));
    });
  }

  // ---------- NAVIGATION ----------
  function moveTableUD(delta) {
    if (!cartItems.length) return;

    var newIndex = focusItemIndex + delta;
    newIndex = clamp(newIndex, 0, cartItems.length - 1);

    if (newIndex === focusItemIndex) return;
    focusItemIndex = newIndex;
    focusQtyBtnIndex = 0; // reset to minus button
    applyFocus();
  }

  function moveTableLR(delta) {
    if (!cartItems.length) return;

    focusQtyBtnIndex += delta;
    focusQtyBtnIndex = clamp(focusQtyBtnIndex, 0, 1); // 0=minus, 1=plus
    applyFocus();
  }

  // ---------- OPEN/CLOSE ----------
  function open(route) {
    ensureDom();
    if (!viewEl) return;

    active = true;
    focusArea = "table";
    focusItemIndex = 0;
    focusQtyBtnIndex = 0;

    var title = "Cart";
    if (route && route.route_name) title = route.route_name;
    safeText(pageTitleEl, title);

    if (bgEl && route && route.route_bg) {
      try {
        if (w.TenxApi && typeof w.TenxApi.rewriteAssetUrl === "function") {
          var bg = w.TenxApi.rewriteAssetUrl(route.route_bg);
          bgEl.style.backgroundImage = "url('" + bg + "')";
          bgEl.style.backgroundSize = "cover";
          bgEl.style.backgroundPosition = "center";
        }
      } catch (e) {}
    }

    cartItems = loadCartFromStorage();
    renderTable();

    viewEl.className = "tx-view is-active";
  }

  function close() {
    if (!viewEl) return;

    active = false;
    viewEl.className = "tx-view";
    cartItems = [];
    focusItemIndex = 0;
    focusQtyBtnIndex = 0;
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;
    var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, OK = 13;
    var BACK1 = 8, BACK2 = 461, BACK3 = 10009, BACK4 = 27;

    if (focusArea === "placeorder") {
      if (k === UP) {
        if (cartItems.length) {
          focusArea = "table";
          focusItemIndex = cartItems.length - 1;
          focusQtyBtnIndex = 0;
          applyFocus();
        }
        return true;
      }
      if (k === OK) {
        placeOrder();
        return true;
      }
    }

    if (focusArea === "table") {
      if (k === UP) {
        if (focusItemIndex === 0) return true;
        moveTableUD(-1);
        return true;
      }
      if (k === DOWN) {
        if (focusItemIndex === cartItems.length - 1) {
          focusArea = "placeorder";
          applyFocus();
        } else {
          moveTableUD(1);
        }
        return true;
      }
      if (k === LEFT) {
        moveTableLR(-1);
        return true;
      }
      if (k === RIGHT) {
        moveTableLR(1);
        return true;
      }
      if (k === OK) {
        var delta = (focusQtyBtnIndex === 0) ? -1 : 1;
        changeQty(focusItemIndex, delta);
        return true;
      }
    }

    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      return false; // let home.js handle
    }

    return false;
  }

  // ---------- EXPORT ----------
  w.CartPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; },
    
    // Public methods for external use
    addItem: function (item) {
      var existing = null;
      var i;
      for (i = 0; i < cartItems.length; i++) {
        if (String(cartItems[i].id) === String(item.id)) {
          existing = cartItems[i];
          break;
        }
      }

      if (existing) {
        existing.qty += (item.qty || 1);
      } else {
        cartItems.push({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty || 1,
          category_id: item.category_id || 0
        });
      }

      saveCartToStorage(cartItems);
      if (active) renderTable();
    },
    
    getItemCount: function () {
      var items = loadCartFromStorage();
      return items.length;
    }
  };

})(window);