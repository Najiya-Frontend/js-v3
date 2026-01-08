// js/app/cart.js — Cart page module with FNB layout (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.CartPage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, tableBodyEl, totalAmountEl, placeOrderBtnEl;
  var emptyStateEl;
  var summaryItemsEl, summaryDiscountEl, summaryTotalEl;

  // ---------- STATE ----------
  var active = false;
  var focusArea = "table"; // "table" | "placeorder"
  var focusItemIndex = 0;
  var focusQtyBtnIndex = 0; // 0=minus, 1=plus for focused row

  var cartItems = []; // [{id, name, price, qty, category_id, restaurant_id}]

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

  function tenxToast(msg, ms, kind) {
    ms = (ms == null) ? 2500 : Number(ms);
    kind = String(kind || "info");

    try {
      if (!document || !document.body) return;

      var el = document.getElementById("tenx-toast");
      if (!el) {
        el = document.createElement("div");
        el.id = "tenx-toast";
        document.body.appendChild(el);
      }

      if (tenxToast._t1) { clearTimeout(tenxToast._t1); tenxToast._t1 = null; }
      if (tenxToast._t2) { clearTimeout(tenxToast._t2); tenxToast._t2 = null; }

      el.textContent = String(msg == null ? "" : msg);
      el.className = "is-show is-" + kind;

      tenxToast._t1 = setTimeout(function () {
        el.className = el.className.replace(/\bis-show\b/g, "");
      }, Math.max(800, ms));

      tenxToast._t2 = setTimeout(function () {
        el.className = "";
        el.textContent = "";
      }, Math.max(900, ms + 250));
    } catch (e) {}
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-cart");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".fnb-bg");
    pageTitleEl = qs("cart-page-title");
    tableBodyEl = qs("cart-table-body");
    totalAmountEl = qs("cart-total-amount");
    placeOrderBtnEl = qs("cart-place-order-btn");
    emptyStateEl = qs("cart-empty-state");
    
    
    summaryItemsEl = qs("cart-summary-items");
    summaryDiscountEl = qs("cart-summary-discount");
    summaryTotalEl = qs("cart-summary-total");
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
      updateSummary();

      // ✅ clear focus visuals when list is empty
      focusArea = "placeorder";
      focusItemIndex = 0;
      focusQtyBtnIndex = 0;
      applyFocus();

      return;
    }


    if (emptyStateEl) emptyStateEl.style.display = "none";

    var html = "";
    var i, item, itemTotal;

    for (i = 0; i < cartItems.length; i++) {
      item = cartItems[i];
      itemTotal = (item.price * item.qty).toFixed(2);

      html += '<tr class="fnb-table-row" data-index="' + i + '">';
      html += '<td>' + escapeHtml(item.name) + '</td>';
      
      html += '<td>';
      html += '<div class="fnb-qty-controls">';
      html += '<div class="fnb-qty-btn" data-action="minus" data-index="' + i + '">−</div>';
      html += '<div class="fnb-qty-value">' + item.qty + '</div>';
      html += '<div class="fnb-qty-btn" data-action="plus" data-index="' + i + '">+</div>';
      html += '</div>';
      html += '</td>';

      html += '<td>' + item.price.toFixed(2) + '</td>';
      html += '<td>' + itemTotal + ' SAR</td>';
      html += '</tr>';
    }

    tableBodyEl.innerHTML = html;
    applyFocus();
    updateTotal();
    updateSummary();
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

  function updateSummary() {
    var total = 0;
    var i;
    for (i = 0; i < cartItems.length; i++) {
      total += cartItems[i].price * cartItems[i].qty;
    }

    safeText(summaryItemsEl, "x" + cartItems.length);
    safeText(summaryDiscountEl, "-");
    safeText(summaryTotalEl, total.toFixed(2) + " SAR");
  }

  function applyFocus() {
    if (!tableBodyEl) return;

    // Clear all focus
    var allRows = tableBodyEl.querySelectorAll(".fnb-table-row");
    var allBtns = tableBodyEl.querySelectorAll(".fnb-qty-btn");
    var i;

    for (i = 0; i < allRows.length; i++) {
      allRows[i].className = "fnb-table-row";
    }
    for (i = 0; i < allBtns.length; i++) {
      allBtns[i].className = allBtns[i].className.replace(/\bis-focused\b/g, "");
    }

    if (placeOrderBtnEl) {
      placeOrderBtnEl.className = "fnb-place-order-btn";
    }

    // DEBUG logging
    try {
      console.log("[CartPage applyFocus] Area:", focusArea, "ItemIndex:", focusItemIndex);
    } catch (e) {}

    if (focusArea === "placeorder") {
      if (placeOrderBtnEl) {
        placeOrderBtnEl.className = "fnb-place-order-btn is-focused";
        try { console.log("[CartPage] Place Order button now has focus!"); } catch (e) {}
      }
      return;
    }

    // Focus on table row
    if (focusArea === "table" && cartItems.length) {
      focusItemIndex = clamp(focusItemIndex, 0, cartItems.length - 1);

      var row = allRows[focusItemIndex];
      if (row) row.className = "fnb-table-row is-focused";

      // Focus on qty button within that row
      var btns = tableBodyEl.querySelectorAll('tr[data-index="' + focusItemIndex + '"] .fnb-qty-btn');
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
    tenxToast("Cart is empty!", 2500, "warn");
    return;
  }

  if (!w.TenxApi || typeof w.TenxApi.createOrder !== "function") {
    tenxToast("API not ready. Please try again.", 3000, "error");
    return;
  }

  if (placeOrderBtnEl) {
    placeOrderBtnEl.disabled = true;
    placeOrderBtnEl.textContent = "Placing Order...";
  }

  // Prepare clean items exactly like the official createOrder expects
  var orderItems = cartItems.map(function(item) {
    return {
      id: Number(item.id),
      name: String(item.name),
      price: Number(item.price),
      qty: Number(item.qty),
      category_id: Number(item.category_id || 0),
      restaurant_id: Number(item.restaurant_id || 0)
    };
  });

  var total = cartItems.reduce(function(sum, item) {
    return sum + (item.price * item.qty);
  }, 0);

  console.log("[CartPage] Placing order with payload:", { order_items: orderItems, order_total: total });

  // Let TenxApi.createOrder handle ALL logic: device binding, restaurant_id, room_id, etc.
  w.TenxApi.createOrder({
    order_items: orderItems,
    order_total: total,
    order_location: "In-Room",
    payment_type_id: 1,
    order_note: ""
  }).then(
    function (res) {
      console.log("[CartPage] Order success response:", res);

      var orderId = "";
      if (res && res.data && res.data.order_id) orderId = res.data.order_id;
      else if (res && res.order_id) orderId = res.order_id;

      tenxToast(
        "Order placed successfully!\n\n" +
        "Order ID: " + (orderId || "N/A") + "\n" +
        "Total: " + total.toFixed(2) + " SAR",
        4000,
        "success"
      );

      clearCart();
      renderTable();

      if (placeOrderBtnEl) {
        placeOrderBtnEl.disabled = false;
        placeOrderBtnEl.textContent = "Place Order";
      }
    },
    function (err) {
      console.error("[CartPage] Order failed with error:", err);

      var msg = "Order failed\n\n";

      // ✅ SPECIAL CASE: PHP foreach warning after DB insert
      // This is common when notification/WebSocket code crashes but order was saved
      if (err && err.raw && err.raw.indexOf("Invalid argument supplied for foreach()") >= 0) {
        // Treat as SUCCESS for user — order is in DB
        tenxToast(
          "Order placed!\n\n" +
          "Total: " + total.toFixed(2) + " SAR\n\n" +
          "(Notification may be delayed)",
          5000,
          "success"
        );

        clearCart();
        renderTable();

        if (placeOrderBtnEl) {
          placeOrderBtnEl.disabled = false;
          placeOrderBtnEl.textContent = "Place Order";
        }
        return;
      }

      // Normal error handling
      if (err && err.message) msg += err.message;
      else msg += "Please try again.";

      tenxToast(msg, 4000, "error");

      if (placeOrderBtnEl) {
        placeOrderBtnEl.disabled = false;
        placeOrderBtnEl.textContent = "Place Order";
      }
    }
  );
}
  // ---------- NAVIGATION ----------
  function moveTableUD(delta) {
    if (!cartItems.length) return;

    var newIndex = focusItemIndex + delta;
    newIndex = clamp(newIndex, 0, cartItems.length - 1);

    if (newIndex === focusItemIndex) {
      // At edge, try to move to place order button
      if (delta > 0 && focusItemIndex === cartItems.length - 1) {
        focusArea = "placeorder";
        applyFocus();
        return;
      }
      return;
    }
    
    focusItemIndex = newIndex;
    focusQtyBtnIndex = 0;
    applyFocus();
  }

  function moveTableLR(delta) {
    if (!cartItems.length) return;

    focusQtyBtnIndex += delta;
    focusQtyBtnIndex = clamp(focusQtyBtnIndex, 0, 1);
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

    // DEBUG logging (remove after testing)
    try {
      console.log("[CartPage] Key:", k, "FocusArea:", focusArea, "ItemIndex:", focusItemIndex, "QtyBtnIndex:", focusQtyBtnIndex);
    } catch (e) {}

    // CRITICAL: Handle Place Order button FIRST
    if (focusArea === "placeorder") {

      // ✅ allow BACK to bubble (so Home handles it)
      if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
        return false;
      }

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
        // ✅ Ensure focus remains in placeorder after clicking OK
        focusArea = "placeorder";   // <-- Fix focusArea reset
        applyFocus();   // <-- Reapply focus after button press
        return true;
      }

      // swallow other keys while on button
      return true;
    }


    if (focusArea === "table") {
      if (k === UP) {
        if (focusItemIndex === 0) return true;
        moveTableUD(-1);
        return true;
      }
      
      if (k === DOWN) {
        moveTableUD(1);
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
      return false;
    }

    return false;
  }

  // ---------- EXPORT ----------
  w.CartPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; },
    
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
          category_id: item.category_id || 0,
          restaurant_id: item.restaurant_id || 0
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