// js/app/orders.js — Orders page module (AUTO-FETCH app_json, ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.OrdersPage) return;

  // ---------- DOM ----------
  var viewEl = null;
  var bgEl = null;
  var pageTitleEl = null;
  var tableBodyEl = null;
  var emptyStateEl = null;
  var totalCountEl = null;

  var summaryCountEl = null;
  var summaryProcessingEl = null;
  var summaryCompletedEl = null;

  // ---------- STATE ----------
  var active = false;
  var focusItemIndex = 0;
  var orders = [];
  var loading = false;

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

  function formatDateTime(iso) {
    if (!iso) return "—";
    try {
      var parts = String(iso).split(" ");
      if (parts.length < 2) return iso;
      var dateParts = parts[0].split("-");
      if (dateParts.length !== 3) return iso;
      return dateParts[2] + "/" + dateParts[1] + "/" + dateParts[0] + " " + parts[1];
    } catch (e) {
      return iso;
    }
  }

  function formatStatus(status) {
    status = String(status || "").toLowerCase();

    if (status.indexOf("process") >= 0 || status.indexOf("pending") >= 0) {
      return '<span class="fnb-status fnb-status--processing">Processing</span>';
    }
    if (status.indexOf("complet") >= 0 || status.indexOf("deliver") >= 0) {
      return '<span class="fnb-status fnb-status--completed">Completed</span>';
    }
    if (status.indexOf("cancel") >= 0) {
      return '<span class="fnb-status fnb-status--cancelled">Cancelled</span>';
    }
    return '<span class="fnb-status fnb-status--processing">' + escapeHtml(status) + '</span>';
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-orders");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".fnb-bg"); // optional
    pageTitleEl = qs("orders-page-title");
    tableBodyEl = qs("orders-table-body");
    emptyStateEl = qs("orders-empty-state");
    totalCountEl = qs("orders-total-count");

    summaryCountEl = qs("orders-summary-count");
    summaryProcessingEl = qs("orders-summary-processing");
    summaryCompletedEl = qs("orders-summary-completed");
  }

  function normalizeBgUrl(routeBg) {
    var bgUrl = routeBg;

    // Resolve arrays/objects
    if (bgUrl && typeof bgUrl === "object") {
      try {
        if (Object.prototype.toString.call(bgUrl) === "[object Array]") {
          if (bgUrl.length && (bgUrl[0].image || bgUrl[0].url)) {
            bgUrl = bgUrl[0].image || bgUrl[0].url;
          } else {
            bgUrl = "";
          }
        } else {
          bgUrl = bgUrl.image || bgUrl.url || "";
        }
      } catch (e) { bgUrl = ""; }
    }

    bgUrl = String(bgUrl || "");

    if (bgUrl && w.TenxApi && typeof w.TenxApi.rewriteAssetUrl === "function") {
      bgUrl = w.TenxApi.rewriteAssetUrl(bgUrl);
    }

    return bgUrl;
  }

  function applyBackground(route) {
    if (!route) return;

    var bgUrl = normalizeBgUrl(route.route_bg);
    if (!bgUrl) return;

    // Prefer .fnb-bg, fallback to viewEl
    var target = bgEl || viewEl;
    if (!target) return;

    target.style.backgroundImage = "url('" + bgUrl + "')";
    target.style.backgroundSize = "cover";
    target.style.backgroundPosition = "center";
  }

  function applyOrdersFromRoute(route) {
    orders = [];
    if (route && route.layout_data && route.layout_data.length) {
      var i;
      for (i = 0; i < route.layout_data.length; i++) {
        orders.push(route.layout_data[i]);
      }
    }
  }

  // ---------- RENDER ----------
  function updateSummary(processing, completed) {
    if (typeof processing === "undefined") {
      processing = 0; completed = 0;
      var i;
      for (i = 0; i < orders.length; i++) {
        var st = String(orders[i].order_status || "").toLowerCase();
        if (st.indexOf("process") >= 0 || st.indexOf("pending") >= 0) processing++;
        else if (st.indexOf("complet") >= 0 || st.indexOf("deliver") >= 0) completed++;
      }
    }

    safeText(totalCountEl, String(orders.length));
    safeText(summaryCountEl, String(orders.length));
    safeText(summaryProcessingEl, String(processing));
    safeText(summaryCompletedEl, String(completed));
  }

  function applyFocus() {
    if (!tableBodyEl) return;

    var allRows = tableBodyEl.querySelectorAll(".fnb-table-row");
    var i;

    for (i = 0; i < allRows.length; i++) {
      allRows[i].className = "fnb-table-row";
    }

    if (orders.length) {
      focusItemIndex = clamp(focusItemIndex, 0, orders.length - 1);
      var row = allRows[focusItemIndex];
      if (row) row.className = "fnb-table-row is-focused";
    }
  }

  function renderTable() {
    if (!tableBodyEl) return;

    if (!orders.length) {
      tableBodyEl.innerHTML = "";
      if (emptyStateEl) emptyStateEl.style.display = "block";
      updateSummary();
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = "none";

    var html = "";
    var processing = 0;
    var completed = 0;

    var i, order;

    for (i = 0; i < orders.length; i++) {
      order = orders[i];

      var statusLower = String(order.order_status || "").toLowerCase();
      if (statusLower.indexOf("process") >= 0 || statusLower.indexOf("pending") >= 0) processing++;
      else if (statusLower.indexOf("complet") >= 0 || statusLower.indexOf("deliver") >= 0) completed++;

      html += '<tr class="fnb-table-row" data-index="' + i + '">';
      html += '<td>' + escapeHtml(order.order_code || "—") + '</td>';
      html += '<td class="fnb-date-col">' + formatDateTime(order.order_added) + '</td>';
      html += '<td>' + formatStatus(order.order_status) + '</td>';
      html += '<td>' + Number(order.order_total || 0).toFixed(2) + " SAR</td>";
      html += '<td style="text-align:right;">' + escapeHtml(order.order_note || "—") + '</td>';
      html += "</tr>";
    }

    tableBodyEl.innerHTML = html;
    applyFocus();
    updateSummary(processing, completed);
  }

  // ---------- NAV ----------
  function moveUD(delta) {
    if (!orders.length) return;

    var newIndex = clamp(focusItemIndex + delta, 0, orders.length - 1);
    if (newIndex === focusItemIndex) return;

    focusItemIndex = newIndex;
    applyFocus();
  }

  // ---------- ROUTE FIND ----------
  function findOrdersRoute(app) {
    // app could be { routes: [...] } or directly { ... routes ... }
    var routes = null;

    if (app && app.routes && Object.prototype.toString.call(app.routes) === "[object Array]") routes = app.routes;
    else if (app && app.data && app.data.routes && Object.prototype.toString.call(app.data.routes) === "[object Array]") routes = app.data.routes;

    if (!routes) return null;

    var i, r;
    for (i = 0; i < routes.length; i++) {
      r = routes[i];
      if (!r) continue;

      if (String(r.route_key || "") === "KEY_ORDER_HISTORY") return r;
      if (String(r.route_attr || "") === "ORDER_HISTORY") return r;
      if (Number(r.route_id || 0) === 361) return r;
    }

    return null;
  }

  function fetchAndApplyLatest() {
    if (loading) return;
    loading = true;

    if (!(w.TenxApi && typeof w.TenxApi.getAppDataNormalized === "function")) {
      loading = false;
      // no api, render empty
      applyOrdersFromRoute(null);
      renderTable();
      return;
    }

    w.TenxApi.getAppDataNormalized().then(function (app) {
      loading = false;
      if (!active) return; // user already left

      var route = findOrdersRoute(app);

      // apply title
      safeText(pageTitleEl, (route && route.route_name) ? route.route_name : "Order History");

      // background + data
      if (route) {
        applyBackground(route);
        applyOrdersFromRoute(route);
      } else {
        applyOrdersFromRoute(null);
      }

      try { console.log("[OrdersPage] fetched latest app_json. orders:", orders.length, "route:", route); } catch (e) {}
      renderTable();
    }, function (err) {
      loading = false;
      if (!active) return;

      try { console.log("[OrdersPage] app_json fetch failed:", err); } catch (e2) {}
      applyOrdersFromRoute(null);
      renderTable();
    });
  }

  // ---------- OPEN/CLOSE ----------
  function open(route) {

    ensureDom();
    console.log("[OrdersPage.open] route_key:", route && route.route_key,
    "has_bg:", !!(route && route.route_bg),
    "layout_data_len:", (route && route.layout_data && route.layout_data.length) ? route.layout_data.length : 0
  );

    if (!viewEl) return;

    active = true;
    focusItemIndex = 0;

    // show view immediately
    viewEl.className = "tx-view is-active";

    // If full route passed, apply immediately
    if (route && (route.route_bg || (route.layout_data && route.layout_data.length))) {
      safeText(pageTitleEl, route.route_name || "Order History");
      applyBackground(route);
      applyOrdersFromRoute(route);
      renderTable();
      return;
    }

    // Otherwise ALWAYS fetch latest (this is the main fix)
    safeText(pageTitleEl, "Order History");
    applyOrdersFromRoute(null);
    renderTable();

    fetchAndApplyLatest();
  }

  function close() {
    if (!viewEl) return;
    active = false;
    loading = false;
    viewEl.className = "tx-view";
    orders = [];
    focusItemIndex = 0;
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;
    var UP = 38, DOWN = 40;
    var BACK1 = 8, BACK2 = 461, BACK3 = 10009, BACK4 = 27;

    if (k === UP) { moveUD(-1); return true; }
    if (k === DOWN) { moveUD(1); return true; }

    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      return false; // let home.js handle back
    }

    return false;
  }

  // ---------- EXPORT ----------
  w.OrdersPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; }
  };

})(window);
