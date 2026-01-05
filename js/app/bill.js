// js/app/bill.js — Bill/View Bill page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.BillPage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, tableBodyEl, totalAmountEl;
  var emptyStateEl;
  var summaryItemsEl, summaryPaidEl, summaryBalanceEl;

  // ---------- STATE ----------
  var active = false;
  var focusItemIndex = 0;
  var orders = []; // [{order_id, order_code, order_total, order_added, order_status}]

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

  function formatDate(dateStr) {
    if (!dateStr) return "—";
    
    try {
      var d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      
      var year = d.getFullYear();
      var month = String(d.getMonth() + 1).padStart(2, "0");
      var day = String(d.getDate()).padStart(2, "0");
      var hours = String(d.getHours()).padStart(2, "0");
      var minutes = String(d.getMinutes()).padStart(2, "0");
      
      return year + "-" + month + "-" + day + " " + hours + ":" + minutes;
    } catch (e) {
      return dateStr;
    }
  }

  function formatStatus(status) {
    status = String(status || "").toLowerCase();
    
    if (status.indexOf("process") >= 0) {
      return '<span class="fnb-status fnb-status--processing">Processing</span>';
    } else if (status.indexOf("complet") >= 0 || status.indexOf("deliver") >= 0) {
      return '<span class="fnb-status fnb-status--completed">Completed</span>';
    } else if (status.indexOf("cancel") >= 0) {
      return '<span class="fnb-status fnb-status--cancelled">Cancelled</span>';
    }
    
    return '<span class="fnb-status fnb-status--processing">' + escapeHtml(status) + '</span>';
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-bill");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".fnb-bg");
    pageTitleEl = qs("bill-page-title");
    tableBodyEl = qs("bill-table-body");
    totalAmountEl = qs("bill-total-amount");
    emptyStateEl = qs("bill-empty-state");
    
    summaryItemsEl = qs("bill-summary-items");
    summaryPaidEl = qs("bill-summary-paid");
    summaryBalanceEl = qs("bill-summary-balance");
  }

  // ---------- RENDER ----------
  function renderTable() {
    if (!tableBodyEl) return;

    if (!orders.length) {
      tableBodyEl.innerHTML = "";
      if (emptyStateEl) emptyStateEl.style.display = "block";
      updateTotal();
      updateSummary();
      return;
    }

    if (emptyStateEl) emptyStateEl.style.display = "none";

    var html = "";
    var i, order;

    for (i = 0; i < orders.length; i++) {
      order = orders[i];

      html += '<tr class="fnb-table-row" data-index="' + i + '">';
      html += '<td>' + escapeHtml(order.order_code || order.order_id || "—") + '</td>';
      html += '<td class="fnb-date-col">' + formatDate(order.order_added) + '</td>';
      html += '<td>' + formatStatus(order.order_status) + '</td>';
      html += '<td>' + Number(order.order_total || 0).toFixed(2) + '</td>';
      html += '<td>--</td>'; // note column (empty for now)
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
    for (i = 0; i < orders.length; i++) {
      total += Number(orders[i].order_total || 0);
    }

    safeText(totalAmountEl, total.toFixed(2) + " SAR");
  }

  function updateSummary() {
    var total = 0;
    var i;
    for (i = 0; i < orders.length; i++) {
      total += Number(orders[i].order_total || 0);
    }

    // For now, assume no payments made (paid = 0, balance = total)
    safeText(summaryItemsEl, "x" + orders.length);
    safeText(summaryPaidEl, "0.00 SAR");
    safeText(summaryBalanceEl, total.toFixed(2) + " SAR");
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

    var title = "View Bill";
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

    // Get orders from route.layout_data
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
      return false; // let home.js handle
    }

    return false;
  }

  // ---------- EXPORT ----------
  w.BillPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; }
  };

})(window);