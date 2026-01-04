// js/app/cart.js — Cart page module (ES5 / Tizen 4 safe) - FIXED ORDER PLACEMENT
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
  // ===== Toast helper (ES5 / TV safe) =====
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

    // clear old timers
    if (tenxToast._t1) { clearTimeout(tenxToast._t1); tenxToast._t1 = null; }
    if (tenxToast._t2) { clearTimeout(tenxToast._t2); tenxToast._t2 = null; }

    // set text + class
    el.textContent = String(msg == null ? "" : msg);

    el.className = "is-show is-" + kind;

    // hide later
    tenxToast._t1 = setTimeout(function () {
      el.className = el.className.replace(/\bis-show\b/g, "");
    }, Math.max(800, ms));

    // cleanup type class after fade
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

    // Disable button during order placement
    if (placeOrderBtnEl) {
      placeOrderBtnEl.disabled = true;
      placeOrderBtnEl.textContent = "Placing Order...";
    }

    var orderItems = [];
    var orderTotal = 0;
    var i, item;
    var restaurantId = 0;

    for (i = 0; i < cartItems.length; i++) {
      item = cartItems[i];
      
      // Build order item according to backend API format
      orderItems.push({
        item_id: Number(item.id),
        item_category_id: Number(item.category_id || 0),
        item_qty: Number(item.qty),
        item_price: Number(item.price),
        item_name: String(item.name)
      });
      
      orderTotal += item.price * item.qty;
      
      // Get restaurant_id from first item (all items should be from same restaurant)
      if (i === 0 && item.restaurant_id) {
        restaurantId = Number(item.restaurant_id);
      }
    }

    // Build payload
    var payload = {
      order_items: orderItems,
      order_total: orderTotal,
      order_note: "",
      order_location: "In-Room",
      payment_type_id: 1
    };

    // Try to get device info from session
    var deviceInfo = null;
    try {
      var cached = sessionStorage.getItem("DEVICE_INFO");
      if (cached) {
        deviceInfo = JSON.parse(cached);
      }
    } catch (e) {}

    // Add device-specific data if available
    if (deviceInfo) {
      payload.hotel_id = deviceInfo.hotel_id || 1;
      payload.guest_id = deviceInfo.guest_id || 0;
      payload.app_id = deviceInfo.app_id || 2;
    }

    // Add restaurant_id
    if (restaurantId) {
      payload.restaurant_id = restaurantId;
    } else {
      // Fallback: try to get from first cart item or default to 1
      payload.restaurant_id = 1;
    }

    console.log("Placing order with payload:", JSON.stringify(payload, null, 2));

    // Place the order
    w.TenxApi.createOrder(payload).then(
      function (res) {
        // Success
        console.log("Order response:", res);
        
        var orderId = "";
        if (res && res.data && res.data.order_id) {
          orderId = res.data.order_id;
        } else if (res && res.order_id) {
          orderId = res.order_id;
        }

        alert(
          "✅ Order placed successfully!\n\n" +
          "Order ID: " + (orderId || "N/A") + "\n" +
          "Total: " + orderTotal.toFixed(2) + " SAR"
        );

      // Clear cart
      clearCart();
      renderTable();

        // Re-enable button
      if (placeOrderBtnEl) {
          placeOrderBtnEl.disabled = false;
        placeOrderBtnEl.textContent = "Place Order";
      }
      },
      function (err) {
        // Error
        console.error("Order error:", err);
        
        var errorMsg = "❌ Order failed\n\n";
        
        if (err && err.message) {
          errorMsg += err.message;
        } else if (typeof err === "string") {
          errorMsg += err;
        } else {
          errorMsg += JSON.stringify(err || {}, null, 2);
        }

        alert(errorMsg);
        
        // Re-enable button
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
          category_id: item.category_id || 0,
          restaurant_id: item.restaurant_id || 0 // Store restaurant_id
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