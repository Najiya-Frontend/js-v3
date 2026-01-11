// js/app/messages.js — Messages page module with read status (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.MessagesPage) return;

  var viewEl, rootEl;
  var listViewportEl, listContentEl, listTrackEl, listThumbEl;
  var detailTitleEl, detailBodyEl;
  var filterValueEl;

  var active = false;
  var focusArea = "list"; // list | detail
  var focusIndex = 0;

  var allItems = [];
  var shownItems = [];
  var filterMode = "message"; // message -> notice -> emergency -> all
  var scrollY = 0;

  function qs(id) { return document.getElementById(id); }
  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }
  function safeText(el, txt) { if (el) el.textContent = (txt == null) ? "" : String(txt); }

  function escapeHtml(s) {
    s = (s == null) ? "" : String(s);
    return s.replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
  }

  function bindDom() {
    viewEl = qs("view-messages");
    rootEl = qs("mx-msg-root");

    listViewportEl = qs("mx-msg-list-viewport");
    listContentEl = qs("mx-msg-list-content");
    listTrackEl = qs("mx-msg-scroll-track");
    listThumbEl = qs("mx-msg-scroll-thumb");

    detailTitleEl = qs("mx-msg-detail-title");
    detailBodyEl = qs("mx-msg-detail-body");

    filterValueEl = qs("mx-msg-filter-value");

    return !!(viewEl && rootEl && listViewportEl && listContentEl && detailTitleEl && detailBodyEl);
  }

  function normalizeType(t) {
    t = (t == null) ? "" : String(t).toLowerCase();
    if (t.indexOf("emerg") >= 0) return "emergency";
    if (t.indexOf("notice") >= 0) return "notice";
    if (t.indexOf("msg") >= 0) return "message";
    return t || "message";
  }

  function itemHeightPx() { return 98; }
  function viewportHeightPx() { return listViewportEl ? (listViewportEl.clientHeight || 630) : 630; }

  function applyFocusStyles() {
    if (!rootEl) return;
    rootEl.className = "mx-msg " + (focusArea === "detail" ? "is-focus-detail" : "is-focus-list");
  }

  function applyFilter() {
    var i, it, typ;

    if (filterMode === "all") {
      shownItems = allItems.slice(0);
    } else {
      shownItems = [];
      for (i = 0; i < allItems.length; i++) {
        it = allItems[i];
        typ = normalizeType(it && it.message_type);
        if (typ === filterMode) shownItems.push(it);
      }
      if (shownItems.length === 0) shownItems = allItems.slice(0);
    }

    focusIndex = clamp(focusIndex, 0, Math.max(0, shownItems.length - 1));
    scrollY = 0;
  }

  function ensureVisible() {
    var h = itemHeightPx();
    var top = focusIndex * h;
    var bottom = top + h;
    var vpH = viewportHeightPx();
    var contentH = shownItems.length * h;

    if (top < scrollY) scrollY = top;
    if (bottom > scrollY + vpH) scrollY = bottom - vpH;

    scrollY = clamp(scrollY, 0, Math.max(0, contentH - vpH));
  }

  function updateScrollbar() {
    if (!listTrackEl || !listThumbEl) return;

    var h = itemHeightPx();
    var vpH = viewportHeightPx();
    var contentH = shownItems.length * h;

    if (contentH <= vpH) {
      listThumbEl.style.height = "0px";
      listThumbEl.style.top = "0px";
      listTrackEl.style.opacity = "0.35";
      return;
    }

    var trackH = listTrackEl.clientHeight || vpH;
    var ratio = vpH / contentH;
    var thumbH = Math.max(46, Math.floor(trackH * ratio));

    var maxScroll = contentH - vpH;
    var maxTop = trackH - thumbH;
    var topPx = (maxScroll > 0) ? Math.floor((scrollY / maxScroll) * maxTop) : 0;

    listThumbEl.style.height = thumbH + "px";
    listThumbEl.style.top = topPx + "px";
    listTrackEl.style.opacity = "0.95";
  }

  function renderFilterLabel() {
    if (!filterValueEl) return;
    var txt = "Message";
    if (filterMode === "all") txt = "All";
    else if (filterMode === "notice") txt = "Notice";
    else if (filterMode === "emergency") txt = "Emergency";
    safeText(filterValueEl, txt);
  }

  function renderList() {
    if (!listContentEl) return;

    var h = itemHeightPx();
    var html = "";
    var i, it, title, typ, unread, typeLabel, typeCls;

    for (i = 0; i < shownItems.length; i++) {
      it = shownItems[i] || {};
      title = it.message_title ? String(it.message_title) : "Untitled";
      typ = normalizeType(it.message_type);
      
      // ✅ FIX #3: Check read status (0 = read, 1 = unread)
      unread = (String(it.guest_message_status) === "1");

      typeLabel = (typ === "emergency") ? "Emergency" : (typ === "notice") ? "Notice" : "Normal";
      typeCls = (typ === "emergency") ? " mx-msg-item__type--emergency"
              : (typ === "notice") ? " mx-msg-item__type--notice"
              : " mx-msg-item__type--normal";

      html +=
        '<div class="mx-msg-item' + (i === focusIndex ? " is-selected" : "") + (unread ? " is-unread" : "") +
        '" style="top:' + (i * h) + 'px;">' +

          '<div class="mx-msg-item__row">' +
            // ✅ FIX #3: Show green checkmark for read messages
            (unread ? 
              '<span class="mx-msg-item__dot"></span>' : 
              '<span class="mx-msg-item__dot mx-msg-item__dot--read">✓</span>'
            ) +
            '<div class="mx-msg-item__title">' + escapeHtml(title) + '</div>' +
            '<span class="mx-msg-item__type' + typeCls + '">' + escapeHtml(typeLabel) + '</span>' +
          "</div>" +

          '<div class="mx-msg-item__meta"></div>' +
        "</div>";
    }

    listContentEl.innerHTML = html;
    listContentEl.style.height = (shownItems.length * h) + "px";
    listContentEl.style.transform = "translate3d(0," + (-scrollY) + "px,0)";
    updateScrollbar();
  }

  function renderDetail() {
    var it = shownItems[focusIndex] || {};
    var title = it.message_title ? String(it.message_title) : "Message";
    var body = (it.message_text == null) ? "" : String(it.message_text);

    var typ = normalizeType(it.message_type);
    var prefix = (typ === "emergency") ? "Emergency" : "Notice";
    safeText(detailTitleEl, prefix + ": " + title);

    var lines = body.split(/\r?\n/);
    var i, out = "";
    for (i = 0; i < lines.length; i++) {
      var ln = String(lines[i] || "");
      if (ln.replace(/\s+/g, "") === "") out += '<div class="mx-msg-p mx-msg-p--gap"></div>';
      else out += '<div class="mx-msg-p">' + escapeHtml(ln) + "</div>";
    }
    if (!out) out = '<div class="mx-msg-p"></div>';

    detailBodyEl.innerHTML = out;
    detailBodyEl.scrollTop = 0;
  }

  function renderAll() {
    applyFilter();
    ensureVisible();
    renderFilterLabel();
    renderList();
    renderDetail();
    applyFocusStyles();
  }

  function setFocusIndex(n) {
    focusIndex = clamp(n, 0, Math.max(0, shownItems.length - 1));
    ensureVisible();
    renderList();
    renderDetail();
  }

  function cycleFilter() {
    if (filterMode === "message") filterMode = "notice";
    else if (filterMode === "notice") filterMode = "emergency";
    else if (filterMode === "emergency") filterMode = "all";
    else filterMode = "message";

    focusIndex = 0;
    scrollY = 0;
    renderAll();
  }

  // ✅ FIX #3: Mark message as read via API
  function markCurrentRead() {
    var it = shownItems[focusIndex];
    if (!it) return;
    
    var messageId = it.message_id || it.id;
    if (!messageId) {
      console.warn("[Messages] No message_id found for current message");
      return;
    }

    // Don't call API if already read
    if (String(it.guest_message_status) === "0") {
      return;
    }

    // ✅ FIX #3: Call TenxApi.setMessageReadStatus
    if (w.TenxApi && typeof w.TenxApi.setMessageReadStatus === "function") {
      w.TenxApi.setMessageReadStatus({
        message_id: messageId,
        guest_message_status: 0 // 0 = read
      }).then(
        function(res) {
          console.log("[Messages] Marked as read:", messageId);
          
          // ✅ FIX #3: Update local state
          it.guest_message_status = 0;
          
          // ✅ FIX #3: Show toast
          if (w.tenxToast) {
            w.tenxToast("Message marked as read", 2000, "success");
          }
          
          // Re-render to show green checkmark
          renderList();
        },
        function(err) {
          console.error("[Messages] Failed to mark as read:", err);
          if (w.tenxToast) {
            w.tenxToast("Failed to mark message as read", 2500, "error");
          }
        }
      );
    } else {
      console.warn("[Messages] TenxApi.setMessageReadStatus not available");
      
      // ✅ Fallback: update UI optimistically
      it.guest_message_status = 0;
      renderList();
      
      if (w.tenxToast) {
        w.tenxToast("Message marked as read (offline)", 2000, "info");
      }
    }
  }

  var api = {
    init: function () { bindDom(); },

    show: function () {
      if (!bindDom()) return;
      active = true;
      focusArea = "list";
      renderAll();
    },

    hide: function () {
      active = false;
    },

    setData: function (data) {
      if (!bindDom()) return;

      var items = null;
      if (data && data.layout_data && typeof data.layout_data.length === "number") items = data.layout_data;
      else if (data && typeof data.length === "number") items = data;

      allItems = (items ? items.slice(0) : []);
      focusIndex = 0;
      scrollY = 0;

      if (active) renderAll();
    },

    handleKeyDown: function (e) {
      if (!active) return false;

      var k = e.keyCode || e.which || 0;
      var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, OK = 13;
      var YELLOW = 405, KEY_Y = 89;

      // Yellow => cycle filter
      if (k === YELLOW || k === KEY_Y) { cycleFilter(); return true; }

      if (k === LEFT) { focusArea = "list"; applyFocusStyles(); return true; }
      if (k === RIGHT) { focusArea = "detail"; applyFocusStyles(); return true; }

      // ✅ FIX #3: OK marks message as read and switches to detail view
      if (k === OK) {
        markCurrentRead();
        focusArea = "detail";
        applyFocusStyles();
        return true;
      }

      if (focusArea === "list") {
        if (k === UP) { setFocusIndex(focusIndex - 1); return true; }
        if (k === DOWN) { setFocusIndex(focusIndex + 1); return true; }
      } else {
        if (k === UP) { detailBodyEl.scrollTop = Math.max(0, detailBodyEl.scrollTop - 80); return true; }
        if (k === DOWN) { detailBodyEl.scrollTop = detailBodyEl.scrollTop + 80; return true; }
      }

      return false;
    }
  };

  w.MessagesPage = api;
})(window);