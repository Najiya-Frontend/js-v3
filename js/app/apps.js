// js/app/apps.js — Apps page module (ES5 / Tizen 4 safe)
(function (w) {
  "use strict";
  if (w.AppsPage) return;

  // ---------- DOM ----------
  var viewEl, bgEl;
  var pageTitleEl, gridEl;

  // ---------- STATE ----------
  var active = false;
  var focusIndex = 0;

  var pageData = null;
  var apps = []; // [{id, name, icon, package, attr}]

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

  function rewriteAssetUrl(url) {
    if (w.TenxApi && typeof w.TenxApi.rewriteAssetUrl === "function") {
      return w.TenxApi.rewriteAssetUrl(url);
    }
    return String(url || "");
  }

  function ensureDom() {
    if (viewEl) return;

    viewEl = qs("view-apps");
    if (!viewEl) return;

    bgEl = viewEl.querySelector(".apps-bg");
    pageTitleEl = qs("apps-page-title");
    gridEl = qs("apps-grid");
  }

  // ---------- APP LAUNCHING ----------
  function launchApp(app) {
    if (!app) return;

    var pkg = String(app.package || app.attr || "");
    var name = String(app.name || "App");

    console.log("[AppsPage] Attempting to launch:", name, "Package:", pkg);

    // Show toast
    if (w.tenxToast) {
      w.tenxToast("Launching " + name + "...", 2000, "info");
    }

    // Try different launch methods based on platform
    var launched = false;

    // 1. Tizen App Control (for Netflix, YouTube, Browser)
    if (!launched && w.tizen && w.tizen.application) {
      try {
        var appControl = new w.tizen.ApplicationControl(
          "http://tizen.org/appcontrol/operation/default",
          null,
          null,
          null,
          null,
          pkg
        );
        
        w.tizen.application.launchAppControl(
          appControl,
          pkg,
          function() {
            console.log("[AppsPage] Tizen launch success:", name);
          },
          function(e) {
            console.error("[AppsPage] Tizen launch failed:", e);
            if (w.tenxToast) {
              w.tenxToast(name + " not available on this device", 2500, "error");
            }
          }
        );
        launched = true;
      } catch (e) {
        console.error("[AppsPage] Tizen launch error:", e);
      }
    }

    // 2. webOS Launch (LG TVs)
    if (!launched && w.webOS && w.webOS.service) {
      try {
        w.webOS.service.request("luna://com.webos.service.applicationmanager", {
          method: "launch",
          parameters: {
            id: pkg
          },
          onSuccess: function() {
            console.log("[AppsPage] webOS launch success:", name);
          },
          onFailure: function(e) {
            console.error("[AppsPage] webOS launch failed:", e);
            if (w.tenxToast) {
              w.tenxToast(name + " not available on this device", 2500, "error");
            }
          }
        });
        launched = true;
      } catch (e2) {
        console.error("[AppsPage] webOS launch error:", e2);
      }
    }

    // 3. Android TV Intent (if running on Android TV)
    if (!launched && w.Android && w.Android.launchApp) {
      try {
        w.Android.launchApp(pkg);
        launched = true;
        console.log("[AppsPage] Android launch attempt:", name);
      } catch (e3) {
        console.error("[AppsPage] Android launch error:", e3);
      }
    }

    // 4. Generic window.open for Browser (fallback for PC testing)
    if (!launched && name.toLowerCase().indexOf("browser") >= 0) {
      try {
        w.open("about:blank", "_blank");
        launched = true;
      } catch (e4) {
        console.error("[AppsPage] Browser open error:", e4);
      }
    }

    // If nothing worked
    if (!launched) {
      console.warn("[AppsPage] No launch method available for:", name);
      if (w.tenxToast) {
        w.tenxToast(name + " launch not supported on this platform", 2500, "warn");
      }
    }
  }

  // ---------- DATA MAPPING ----------
  function parseHtmlForApps(html) {
    html = String(html || "");
    if (!html) return [];

    var out = [];
    var regex = /<li[^>]*data-code="([^"]*)"[^>]*data-id="([^"]*)"[^>]*data-attr="([^"]*)"[^>]*class="[^"]*subnav_item[^"]*"[^>]*>/gi;
    var match;

    while ((match = regex.exec(html)) !== null) {
      var code = match[1] || "";
      var id = match[2] || "";
      var attr = match[3] || "";

      var liStart = match.index;
      var liEnd = html.indexOf("</li>", liStart);
      if (liEnd === -1) liEnd = html.length;

      var liContent = html.substring(liStart, liEnd);

      // Extract icon
      var iconMatch = /<div[^>]+style="background-image:\s*url\(([^)]+)\)"/i.exec(liContent);
      var icon = "";
      if (iconMatch && iconMatch[1]) {
        icon = iconMatch[1].replace(/['"]/g, "");
      }

      // Extract name (text content after the div)
      var nameMatch = /<\/div>([^<]+)<\/li>/i.exec(liContent);
      var name = nameMatch ? nameMatch[1].trim() : id;

      if (id && attr) {
        out.push({
          id: id,
          name: name,
          icon: rewriteAssetUrl(icon),
          package: attr,
          attr: attr
        });
      }
    }

    return out;
  }

  function extractAppsFromRoute(route) {
    var out = [];

    // First try to parse from html_output (like old UI)
    if (route && route.html_output) {
      out = parseHtmlForApps(route.html_output);
    }

    // Fallback: try to get apps from route data
    if (!out.length) {
      var data = (route && route.layout_data) || {};
      var menuItems = data.menu_items || data.apps || data.items || [];

      if (menuItems.length) {
        var i, item;
        for (i = 0; i < menuItems.length; i++) {
          item = menuItems[i];
          out.push({
            id: String(item.id || item.code || i),
            name: String(item.name || item.title || "App"),
            icon: rewriteAssetUrl(item.icon || item.image || ""),
            package: String(item.package || item.attr || item.data_attr || ""),
            attr: String(item.attr || item.data_attr || "")
          });
        }
      }
    }

    // If still no apps found, create default Netflix, YouTube, Browser
    if (!out.length) {
      out = [
        {
          id: "NETFLIX",
          name: "NETFLIX",
          icon: "",
          package: "com.netflix.ninja",
          attr: "COM.NETFLIX.MEDIACLIENT"
        },
        {
          id: "YOUTUBE",
          name: "YOUTUBE",
          icon: "",
          package: "com.google.android.youtube.tv",
          attr: "COM.YOUTUBE.APP"
        },
        {
          id: "BROWSER",
          name: "BROWSER",
          icon: "",
          package: "org.tizen.browser",
          attr: "ORG.TIZEN.BROWSER"
        }
      ];
    }

    return out;
  }

  // ---------- RENDER ----------
  function renderGrid() {
    if (!gridEl) return;

    var html = "";
    var i, app;

    for (i = 0; i < apps.length; i++) {
      app = apps[i];

      html += '<div class="apps-card" data-index="' + i + '">';
      
      if (app.icon) {
        html += '<div class="apps-card__icon" style="background-image: url(\'' + escapeHtml(app.icon) + '\');"></div>';
      } else {
        html += '<div class="apps-card__icon apps-card__icon--placeholder">📱</div>';
      }
      
      html += '<div class="apps-card__name">' + escapeHtml(app.name) + '</div>';
      html += '</div>';
    }

    gridEl.innerHTML = html;
    applyFocus();
  }

  function applyFocus() {
    if (!gridEl) return;

    var cards = gridEl.querySelectorAll(".apps-card");
    var i;

    for (i = 0; i < cards.length; i++) {
      cards[i].className = "apps-card";
    }

    if (apps.length) {
      focusIndex = clamp(focusIndex, 0, apps.length - 1);
      var card = cards[focusIndex];
      if (card) card.className = "apps-card is-focused";
    }
  }

  // ---------- NAVIGATION ----------
  function moveLR(delta) {
    if (!apps.length) return;

    var newIndex = focusIndex + delta;
    newIndex = clamp(newIndex, 0, apps.length - 1);

    if (newIndex === focusIndex) return;

    focusIndex = newIndex;
    applyFocus();
  }

  function moveUD(delta) {
    if (!apps.length) return;

    // Move by 3 (one row - since we show 3 per row)
    var newIndex = focusIndex + (delta * 3);
    newIndex = clamp(newIndex, 0, apps.length - 1);

    if (newIndex === focusIndex) return;

    focusIndex = newIndex;
    applyFocus();
  }

  function onOk() {
    if (!apps.length) return;

    var app = apps[focusIndex];
    if (app) {
      launchApp(app);
    }
  }

  // ---------- OPEN/CLOSE ----------
  function open(route) {
    ensureDom();
    if (!viewEl) return;

    pageData = route || null;
    active = true;
    focusIndex = 0;

    var title = "Apps";
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

    apps = extractAppsFromRoute(route);
    renderGrid();

    viewEl.className = "tx-view is-active";
  }

  function close() {
    if (!viewEl) return;

    active = false;
    viewEl.className = "tx-view";
    apps = [];
    focusIndex = 0;
    pageData = null;
  }

  // ---------- KEYS ----------
  function handleKeyDown(e) {
    if (!active) return false;

    var k = e.keyCode || e.which || 0;
    var LEFT = 37, UP = 38, RIGHT = 39, DOWN = 40, OK = 13;
    var BACK1 = 8, BACK2 = 461, BACK3 = 10009, BACK4 = 27;

    if (k === LEFT) { moveLR(-1); return true; }
    if (k === RIGHT) { moveLR(1); return true; }
    if (k === UP) { moveUD(-1); return true; }
    if (k === DOWN) { moveUD(1); return true; }

    if (k === OK) {
      onOk();
      return true;
    }

    if (k === BACK1 || k === BACK2 || k === BACK3 || k === BACK4) {
      return false; // let home.js handle back
    }

    return false;
  }

  // ---------- EXPORT ----------
  w.AppsPage = {
    open: open,
    close: close,
    handleKeyDown: handleKeyDown,
    isActive: function () { return active; }
  };

})(window);