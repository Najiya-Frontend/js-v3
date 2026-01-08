// js/app/orders.js — Orders page module (FNB layout, ES5 / Tizen 4 safe)
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
  var orders = []; // populated from route.layout_data

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
    // Expected format: "2026-01-08 11:50:13"
    try {
      var parts = iso.split(" ");
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

    bgEl = viewEl.querySelector(".fnb-bg");
    pageTitleEl = qs("orders-page-title");
    tableBodyEl = qs("orders-table-body");
    emptyStateEl = qs("orders-empty-state");
    totalCountEl = qs("orders-total-count");

    summaryCountEl = qs("orders-summary-count");
    summaryProcessingEl = qs("orders-summary-processing");
    summaryCompletedEl = qs("orders-summary-completed");
  }

  // ---------- RENDER ----------
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

  var i, order; // keep this once, at function top if you prefer — or remove entirely

  for (i = 0; i < orders.length; i++) {
    order = orders[i];
    var statusLower = String(order.order_status || "").toLowerCase();
    if (statusLower.indexOf("process") >= 0 || statusLower.indexOf("pending") >= 0) {
      processing++;
    } else if (statusLower.indexOf("complet") >= 0 || statusLower.indexOf("deliver") >= 0) {
      completed++;
    }

    html += '<tr class="fnb-table-row" data-index="' + i + '">';
    html += '<td>' + escapeHtml(order.order_code || "—") + '</td>';
    html += '<td class="fnb-date-col">' + formatDateTime(order.order_added) + '</td>';
    html += '<td>' + formatStatus(order.order_status) + '</td>';
    html += '<td>' + Number(order.order_total || 0).toFixed(2) + " SAR</td>";
    html += '<td style="text-align:right;">' + escapeHtml(order.order_note || "—") + '</td>';
    html += '</tr>';
  }

  tableBodyEl.innerHTML = html;
  applyFocus();
  updateSummary(processing, completed);
}

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

  // ---------- NAVIGATION ----------
  function moveUD(delta) {
    if (!orders.length) return;

    var newIndex = focusItemIndex + delta;
    newIndex = clamp(newIndex, 0, orders.length - 1);

    if (newIndex === focusItemIndex) return;

    focusItemIndex = newIndex;
    applyFocus();
  }

  // ---------- OPEN/CLOSE ----------
  function open(route) {
    ensureDom();
    if (!viewEl) return;

    active = true;
    focusItemIndex = 0;

    var title = "Order History";
    if (route && route.route_name) title = route.route_name;
    safeText(pageTitleEl, title);

    // Background from route (same as other FNB pages)
    if (bgEl && route && route.route_bg) {
      try {
        var bgUrl = route.route_bg;
        if (w.TenxApi && typeof w.TenxApi.rewriteAssetUrl === "function") {
          bgUrl = w.TenxApi.rewriteAssetUrl(bgUrl);
        }
        bgEl.style.backgroundImage = "url('" + bgUrl + "')";
        bgEl.style.backgroundSize = "cover";
        bgEl.style.backgroundPosition = "center";
      } catch (e) {}
    }

    // Populate orders from layout_data
    orders = [];
    if (route && route.layout_data && route.layout_data.length) {
      var i;
      for (i = 0; i < route.layout_data.length; i++) {
        orders.push(route.layout_data[i]);
      }
    }

    renderTable();

    viewEl.className = "tx-view is-active";
  }

  function close() {
    if (!viewEl) return;

    active = false;
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

    if (k === UP) {
      moveUD(-1);
      return true;
    }

    if (k === DOWN) {
      moveUD(1);
      return true;
    }

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