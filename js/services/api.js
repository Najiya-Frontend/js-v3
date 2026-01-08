//services/api.js
(function (w) {
  "use strict";

  if (w.TenxApi && typeof w.TenxApi.ensureDevice === "function") return;

  // Put your SERVER IP here (rest-api host). Your PC IP (192.168.10.3) is NOT used.
  var STATIC_BACKEND_ORIGIN = "http://192.168.1.50";
 // change to https://... if your rest-api is https

  var ZERO_MAC = "00:00:00:00:00:00";

  function safeGetLS(k) { try { return w.localStorage.getItem(k); } catch (e) { return null; } }
  function safeGetSS(k) { try { return w.sessionStorage.getItem(k); } catch (e2) { return null; } }
  function safeSetSS(k, v) { try { w.sessionStorage.setItem(k, v); } catch (e3) {} }

function detectHost() {
  var override = safeGetLS("API_ORIGIN");
  if (override) return String(override).replace(/\/+$/, "");

  // ✅ ALWAYS use the REST API host by default (NOT the UI host)
  return String(STATIC_BACKEND_ORIGIN).replace(/\/+$/, "");
}


  var HOST = detectHost();

  function normMac(mac) {
    mac = String(mac || "").toUpperCase().replace(/[^0-9A-F]/g, "");
    if (mac.length !== 12) return "";
    return mac.replace(/(.{2})(?=.)/g, "$1:");
  }

  function isZeroMac(mac) {
    return !mac || String(mac).toLowerCase() === ZERO_MAC;
  }

  // stable pseudo MAC for PC/unknown devices so backend won't “reuse old device” and change app_id
  function pseudoMacFromUid(uid) {
    uid = String(uid || "x");
    var h = 0, i;
    for (i = 0; i < uid.length; i++) {
      h = ((h << 5) - h + uid.charCodeAt(i)) & 0xFFFFFFFF;
    }
    // locally administered unicast MAC: first octet 02
    var b1 = 0x02;
    var b2 = (h      ) & 0xFF;
    var b3 = (h >>  8) & 0xFF;
    var b4 = (h >> 16) & 0xFF;
    var b5 = (h >> 24) & 0xFF;
    var b6 = (uid.length * 17) & 0xFF;

    function hex2(n) {
      var s = (n & 0xFF).toString(16).toUpperCase();
      return s.length < 2 ? ("0" + s) : s;
    }
    return hex2(b1) + ":" + hex2(b2) + ":" + hex2(b3) + ":" + hex2(b4) + ":" + hex2(b5) + ":" + hex2(b6);
  }

function xhrJSON(method, url, body, cb) {
  var xhr = new XMLHttpRequest();
  try { seedPhpSessionFromStorage(); } catch (e0) {}

  xhr.open(method, url, true);
  try { xhr.withCredentials = true; } catch (e1) {}

  xhr.setRequestHeader("Accept", "application/json");
  if (method === "POST") xhr.setRequestHeader("Content-Type", "application/json");

  xhr.timeout = 15000;

xhr.onreadystatechange = function () {
  if (xhr.readyState !== 4) return;

  var raw = xhr.responseText || "";
  var ct = "";
  try { ct = String(xhr.getResponseHeader("content-type") || "").toLowerCase(); } catch (eCt) {}

  // ✅ ALWAYS log so we see backend errors
  try { console.log("[xhrJSON]", method, url, "->", xhr.status, ct, "Raw length:", raw.length, "First 200 chars:", raw.substring(0, 200)); } catch (e2) {}

  // treat HTML as error (even if 200)
  var trimmed = raw.replace(/^\uFEFF/, "").replace(/^\s+/, "");
  var looksHtml = trimmed.charAt(0) === "<" || ct.indexOf("text/html") >= 0;

  if (looksHtml) {
    cb({
      status: xhr.status,
      url: url,
      raw: raw,
      contentType: ct,
      message: "Expected JSON but got HTML (backend PHP error page). Check console for raw response."
    }, null);
    return;
  }

  var data = null;
  try { data = JSON.parse(trimmed || "{}"); } catch (e) {
    console.error("[xhrJSON] JSON parse error:", e.message);
    cb({ status: xhr.status, url: url, raw: raw, parseError: e.message }, null);
    return;
  }

  if (xhr.status >= 200 && xhr.status < 300) cb(null, data);
  else cb({ status: xhr.status, url: url, raw: raw, data: data }, data);
};

  xhr.ontimeout = function () { cb({ status: 0, url: url, raw: "TIMEOUT" }, null); };
  xhr.onerror   = function () { cb({ status: 0, url: url, raw: "NETWORK_ERROR" }, null); };

  xhr.send(body ? JSON.stringify(body) : null);
}




  function getDeviceIdentity() {
    var ua = "";
    try { ua = (navigator.userAgent || ""); } catch (e) {}

    var device_os = "UNKNOWN";
    var device_type = "PC";

    if (/tizen/i.test(ua)) { device_os = "TIZEN"; device_type = "SAMSUNG"; }
    else if (/web0s|webos/i.test(ua)) { device_os = "WEBOS"; device_type = "LG"; }
    else if (/android/i.test(ua)) { device_os = "ANDROID"; device_type = "ANDROID"; }

    var name = safeGetLS("DEVICE_NAME") || "TenX TV";

    var uid = safeGetLS("DEVICE_UID") || "";
    if (!uid) {
      uid = String(Math.random()).slice(2) + String(Date.now());
      try { w.localStorage.setItem("DEVICE_UID", uid); } catch (e2) {}
    }

    var mac = "";
    try {
      if (w.MacUtil && typeof w.MacUtil.getCachedMac === "function") {
        mac = w.MacUtil.getCachedMac() || "";
      }
      if (!mac && w.MacUtil && typeof w.MacUtil.getAnyMacAddressSync === "function") {
        mac = w.MacUtil.getAnyMacAddressSync() || "";
      }
    } catch (e3) {}

    mac = normMac(mac);

    // If still bad, use stable pseudo mac (CRITICAL FIX)
    if (!mac || isZeroMac(mac)) mac = pseudoMacFromUid(uid);

    return { mac: mac, uid: uid, name: name, device_os: device_os, device_type: device_type };
  }

  function postDevice(payload, done) {
    xhrJSON("POST", HOST + "/rest-api/api/v2/rest/device/", payload, function (err, res) {
      if (err) { done(err, null); return; }

      var d = (res && res.data) ? res.data : (res || {});
      var save = {
        app_id: Number(d.app_id != null ? d.app_id : payload.app_id),
        hotel_id: Number(d.hotel_id != null ? d.hotel_id : payload.hotel_id),
        device_id: Number(d.device_id != null ? d.device_id : 0),

        // ✅ IMPORTANT: keep 0 if backend returns 0
        guest_id: Number(d.guest_id != null ? d.guest_id : (payload.guest_id || 0)),
        room_id:  Number(d.room_id  != null ? d.room_id  : (payload.room_id  || 0)),

        device_mac: String(d.device_mac || payload.device_mac || ""),
        language_id: Number(payload.language_id || 1)
      };


      safeSetSS("DEVICE_INFO", JSON.stringify(save));
      done(null, save);
    });
  }
  function makeThenable(startFn) {
  var state = 0; // 0=pending, 1=ok, 2=fail
  var value = null;
  var handlers = [];

  function flush() {
    var i, h;
    for (i = 0; i < handlers.length; i++) {
      h = handlers[i];
      try {
        if (state === 1 && h.ok) h.ok(value);
        if (state === 2 && h.bad) h.bad(value);
      } catch (e) {}
    }
    handlers = [];
  }

  function resolve(v) {
    if (state) return;
    state = 1; value = v;
    flush();
  }

  function reject(e) {
    if (state) return;
    state = 2; value = e;
    flush();
  }

  // start immediately but keep result for later .then()
  try { startFn(resolve, reject); } catch (ex) { reject(ex); }

  return {
    then: function (ok, bad) {
      if (state === 1) { try { ok && ok(value); } catch (e1) {} }
      else if (state === 2) { try { bad && bad(value); } catch (e2) {} }
      else handlers.push({ ok: ok, bad: bad });
      return this;
    }
  };
}

  function ensureDevice(cb) {
    var p = {
      then: function (ok, bad) {
        ensureDevice(function (err, data) {
          if (err) { if (bad) bad(err); return; }
          if (ok) ok(data);
        });
        return p;
      }
    };

    var cached = null;
    try { cached = JSON.parse(safeGetSS("DEVICE_INFO") || "null"); } catch (e) { cached = null; }
    if (cached && cached.device_id) {
      cb && cb(null, cached);
      return p;
    }

    var id = getDeviceIdentity();

    var payload = {
      app_id: String(safeGetLS("APP_ID") || "2"),
      hotel_id: Number(safeGetLS("HOTEL_ID") || 1),
      guest_id: Number(safeGetLS("GUEST_ID") || 0),
      room_id: Number(safeGetLS("ROOM_ID") || 0),
      language_id: Number(safeGetLS("LANGUAGE_ID") || 1),

      device_name: id.name,
      device_mac: id.mac,
      device_uid: id.uid,
      device_os: id.device_os,
      device_type: id.device_type
    };

    postDevice(payload, function (err, save) {
      if (err) { cb && cb(err, null); return; }
      cb && cb(null, save);
    });

    return p;
  }
  function seedPhpSessionFromStorage() {
  try {
    if (typeof document === "undefined") return;
    var sid = safeGetSS("SESSION_ID") || "";
    sid = String(sid).trim();
    if (sid && document.cookie.indexOf("PHPSESSID=") < 0) {
      document.cookie = "PHPSESSID=" + sid + "; path=/";
    }
  } catch (e) {}
}

  // ===============Dining.js api=================
function stripHtmlTags(html) {
  html = String(html || "");
  html = html.replace(/<br\s*\/?>/gi, "\n");
  html = html.replace(/<\/p>/gi, "\n");
  html = html.replace(/<[^>]+>/g, "");
  html = html.replace(/&nbsp;/g, " ");
  html = html.replace(/&amp;/g, "&");
  html = html.replace(/&lt;/g, "<");
  html = html.replace(/&gt;/g, ">");
  html = html.replace(/&quot;/g, '"');
  return html;
}
// ===============cart.js api=================
function createTicket(params, cb) {
    params = params || {};

    var p = {
      then: function (ok, bad) {
        createTicket(params, function (err, data) {
          if (err) { if (bad) bad(err); return; }
          if (ok) ok(data);
        });
        return p;
      }
    };

    ensureDevice(function (err, base) {
      if (err) { cb && cb(err, null); return; }

      // base has guest_id/hotel_id even if room_number is UI-derived
      var di = safeGetDeviceInfo() || base || {};

      var body = {
        guest_id: Number(params.guest_id || di.guest_id || 0),
        hotel_id: Number(params.hotel_id || di.hotel_id || 0),

        room_number: String(params.room_number || ""),
        service_key: String(params.service_key || ""),
        topic_id: String(params.topic_id || ""),
        ticket_name: String(params.ticket_name || ""),
        description: String(params.description || ""),

        // optional compatibility (some installs use these)
        guest_room: String(params.room_number || ""),
        ticket_description: String(params.description || "")
      };

      if (!body.guest_id || !body.hotel_id) {
        cb && cb({ message: "Device not bound (guest_id/hotel_id missing)." }, null);
        return;
      }
      if (!body.room_number) {
        cb && cb({ message: "Missing room_number." }, null);
        return;
      }

      xhrJSON("POST", HOST + "/rest-api/api/v2/rest/create_ticket/", body, function (err2, res) {
        if (err2) { cb && cb(err2, null); return; }
        cb && cb(null, res);
      });
    });

    return p;
  }
  // ✅ OLD-UI parity: sanitize items + keep required fields
function sanitizeOrderItems(items, fallbackRestaurantId) {
  var arr = Array.isArray(items) ? items : [];
  var out = [];
  var i;

  for (i = 0; i < arr.length; i++) {
    var it = arr[i] || {};

    var item_id = Number(it.item_id != null ? it.item_id : it.id);
    var item_qty = Number(it.item_qty != null ? it.item_qty :
                  (it.qty != null ? it.qty : it.order_item_qty));
    var item_price = Number(it.item_price != null ? it.item_price : it.price);

    var item_category_id = Number(it.item_category_id || it.category_id || 0);
    var item_name = String(it.item_name != null ? it.item_name : (it.name || "Item"));

    // ✅ restaurant per item (old UI sends this)
    var item_restaurant_id = Number(
      it.item_restaurant_id != null ? it.item_restaurant_id :
      (it.restaurant_id != null ? it.restaurant_id : (fallbackRestaurantId || 0))
    );

    if (!item_id || !item_qty) continue;
    if (!isFinite(item_price)) item_price = 0;

    out.push({
      item_id: item_id,
      item_name: item_name,
      item_qty: item_qty,
      item_price: item_price,
      item_category_id: item_category_id,
      item_restaurant_id: item_restaurant_id,
      item_total: (item_price * item_qty),
      item_src: String(it.item_src || it.item_cover || it.cover || it.image || "")
    });
  }

  return out;
}

function createOrder(params, cb) {
  params = params || {};

  var p = {
    then: function (ok, bad) {
      createOrder(params, function (err, data) {
        if (err) { if (bad) bad(err); return; }
        if (ok) ok(data);
      });
      return p;
    }
  };

  ensureDevice(function (err, base) {
    if (err) { cb && cb(err, null); return; }

    var di = safeGetDeviceInfo() || base || {};
    var itemsIn = params.order_items || [];

    // Restaurant ID logic
    var restaurantId = Number(params.restaurant_id || 0);

    if (!restaurantId && itemsIn && itemsIn.length) {
      var first = itemsIn[0] || {};
      restaurantId = Number(first.restaurant_id || first.item_restaurant_id || 0);
    }

    // Fallback to localStorage if no restaurantId found
    if (!restaurantId) {
      try { restaurantId = Number(localStorage.getItem("fnb_last_restaurant_id") || 0); } catch (e0) {}
    }

    var cleanItems = sanitizeOrderItems(itemsIn, restaurantId);

    // Calculate total if not provided
    var total = Number(params.order_total || 0);
    if (!total) {
      var s = 0, i;
      for (i = 0; i < cleanItems.length; i++) s += Number(cleanItems[i].item_total || 0);
      total = s;
    }

    var body = {
        app_id: String(params.app_id || di.app_id || "2"),
        hotel_id: Number(params.hotel_id || di.hotel_id || 1),

        //include device_id if backend can resolve guest/room from device
        device_id: Number(di.device_id || base.device_id || 0),

        //guest/room ids (what backend needs)
        guest_id: Number(params.guest_id || di.guest_id || 0),
        room_id:  Number(params.room_id  || di.room_id  || 0),

        //also send room number as fallback (some installs use this)
        room_number: String(
          params.room_number ||
          (function(){ try { return localStorage.getItem("ROOM_NO") || ""; } catch(e0) { return ""; } })()
        ),

        restaurant_id: Number(restaurantId || 0),
        payment_type_id: Number(params.payment_type_id || 1),
        order_location: String(params.order_location || "In-Room"),
        order_note: String(params.order_note || ""),
        order_total: Number(total || 0),
        order_items: cleanItems
      };


    if (!body.restaurant_id) {
      cb && cb({ message: "Missing restaurant_id (cannot place order)." }, null);
      return;
    }
    if (!body.order_items.length) {
      cb && cb({ message: "No valid order items (item_id/qty missing)." }, null);
      return;
    }

    // Store last restaurant id for convenience
    try { localStorage.setItem("fnb_last_restaurant_id", String(body.restaurant_id)); } catch (e1) {}


try {
  console.log("[createOrder] device_info:", safeGetDeviceInfo());
  console.log("[createOrder] payload:", body);
} catch (e) {}


    // Call the backend API
    xhrJSON("POST", HOST + "/rest-api/api/v2/rest/order/", body, function (err2, res) {
      if (err2) {
        // If we got an HTML response (PHP error page), catch it and notify user
        if (err2 && err2.message === "Expected JSON but got HTML") {
          cb && cb({ message: "Order failed: Server error (please try again)." }, null);
        } else {
          cb && cb(err2, null); // Handle other errors
        }
        return;
      }
      
      // If the response is valid
      if (!res) { 
        cb && cb({ message: "Empty/invalid JSON from order API." }, null); 
        return; 
      }

      cb && cb(null, res); // Successfully placed order
    });

  });

  return p;
}

function syncIdsFromAppJson(app) {
  if (!app) return;

  // app_json MAY include these ids depending on backend
  var gid = Number(app.guest_id || app.guestId || 0);
  var rid = Number(app.room_id  || app.roomId  || app.guest_room_id || 0);

  // also keep room number for order APIs that accept room_number
  var roomNo = String(app.room_number || app.room_no || "");

  // persist to localStorage (so next ensureDevice payload can use it)
  try { if (gid) w.localStorage.setItem("GUEST_ID", String(gid)); } catch (e1) {}
  try { if (rid) w.localStorage.setItem("ROOM_ID",  String(rid)); } catch (e2) {}
  try { if (roomNo) w.localStorage.setItem("ROOM_NO", roomNo); } catch (e3) {}

  // also patch session DEVICE_INFO if it exists
  var di = safeGetDeviceInfo() || null;
  if (di) {
    var changed = false;
    if (gid && Number(di.guest_id || 0) !== gid) { di.guest_id = gid; changed = true; }
    if (rid && Number(di.room_id  || 0) !== rid) { di.room_id  = rid; changed = true; }
    if (changed) {
      try { safeSetSS("DEVICE_INFO", JSON.stringify(di)); } catch (e4) {}
    }
  }
}


  function getAppDataNormalized(cb) {
    var p = {
      then: function (ok, bad) {
        getAppDataNormalized(function (err, data) {
          if (err) { if (bad) bad(err); return; }
          if (ok) ok(data);
        });
        return p;
      }
    };

    ensureDevice(function (err, base) {
      if (err) { cb && cb(err, null); return; }

      var q =
        "app_id=" + encodeURIComponent(base.app_id) +
        "&hotel_id=" + encodeURIComponent(base.hotel_id) +
        "&device_id=" + encodeURIComponent(base.device_id) +
        "&guest_id=" + encodeURIComponent(base.guest_id) +
        "&room_id=" + encodeURIComponent(base.room_id);

      xhrJSON("GET", HOST + "/rest-api/api/v2/rest/app_json/?" + q, null, function (err2, res) {
  if (err2) { cb && cb(err2, null); return; }

  var app = (res && res.data) ? res.data : res;

  // ✅ IMPORTANT: save guest_id/room_id/room_no for createOrder
  try { syncIdsFromAppJson(app); } catch (e0) {}

  cb && cb(null, app);
});

    });

    return p;
  }

  function changeGuestLang(params, cb) {
    params = params || {};

    var p = {
      then: function (ok, bad) {
        changeGuestLang(params, function (err, data) {
          if (err) { if (bad) bad(err); return; }
          if (ok) ok(data);
        });
        return p;
      }
    };

    ensureDevice(function (err, base) {
      if (err) { cb && cb(err, null); return; }

      var body = {
        app_id: Number(base.app_id),
        hotel_id: Number(base.hotel_id),
        device_id: Number(base.device_id),
        guest_id: Number(base.guest_id),
        room_id: Number(base.room_id),
        language_id: Number(params.language_id)
      };

      xhrJSON("POST", HOST + "/rest-api/api/v2/rest/change_guest_lang/", body, function (err2, res) {
        if (err2) { cb && cb(err2, null); return; }
        cb && cb(null, res);
      });
    });

    return p;
  }
    function safeGetDeviceInfo() {
    var raw = safeGetSS("DEVICE_INFO");
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }

  function rewriteAssetUrl(url) {
    url = String(url || "");
    if (!url) return url;
    if (url.indexOf("/admin-portal/assets/") < 0) return url;
    return url.replace(/^https?:\/\/[^\/]+/i, HOST);
  }
  // ===================== FEEDBACK / SURVEY submit =====================
function submitSurvey(params, cb) {
  params = params || {};

  var p = {
    then: function (ok, bad) {
      submitSurvey(params, function (err, data) {
        if (err) { if (bad) bad(err); return; }
        if (ok) ok(data);
      });
      return p;
    }
  };

  ensureDevice(function (err, base) {
    if (err) { cb && cb(err, null); return; }

    var di = safeGetDeviceInfo() || base || {};

    // body your backend can use (adjust names if needed)
    var body = {
      app_id: Number(di.app_id || base.app_id || 2),
      hotel_id: Number(params.hotel_id || di.hotel_id || base.hotel_id || 1),
      device_id: Number(di.device_id || base.device_id || 0),
      guest_id: Number(params.guest_id || di.guest_id || base.guest_id || 0),
      room_id:  Number(params.room_id  || di.room_id  || base.room_id  || 0),
      language_id: Number(params.language_id || di.language_id || 1),

      survey_id: params.survey_id != null ? Number(params.survey_id) : null,
      answers: Array.isArray(params.answers) ? params.answers : []
    };

    // Some installs don’t require guest/room, but if yours does, keep this:
    // if (!body.guest_id || !body.hotel_id) {
    //   cb && cb({ message: "Device not bound (guest_id/hotel_id missing)." }, null);
    //   return;
    // }

    // Try common endpoints (because naming differs per backend)
    var endpoints = [
      "/rest-api/api/v2/rest/submit_survey/",
      "/rest-api/api/v2/rest/survey_submit/",
      "/rest-api/api/v2/rest/feedback_submit/",
      "/rest-api/api/v2/rest/survey/"
    ];

    var idx = 0;

    function tryNext(lastErr) {
      if (idx >= endpoints.length) {
        cb && cb(lastErr || { message: "No survey endpoint worked." }, null);
        return;
      }

      var url = HOST + endpoints[idx++];
      xhrJSON("POST", url, body, function (e2, res) {
        // If 404 or "not found", try next endpoint
        if (e2 && (e2.status === 404 || e2.status === 405)) {
          tryNext(e2);
          return;
        }
        if (e2) { cb && cb(e2, null); return; }
        cb && cb(null, res);
      });
    }

    tryNext(null);
  });

  return p;
}



    w.TenxApi = {
    HOST: HOST,

    ensureDevice: function () { return ensureDevice(function () {}); },
    getAppDataNormalized: function () { return getAppDataNormalized(function () {}); },
    changeGuestLang: function (p) { return changeGuestLang(p, function () {}); },

    // ✅ NEW
    getDeviceInfo: function () { return safeGetDeviceInfo(); },
    rewriteAssetUrl: function (url) { return rewriteAssetUrl(url); },
    stripHtmlTags: function (html) { return stripHtmlTags(html); },
    createOrder: function (p) { return createOrder(p); },
    createTicket: function (p) { return createTicket(p); },
    submitSurvey: function (p) { return submitSurvey(p); },




    liveClient: { subscribe: function () {} }
  };


})(window);
