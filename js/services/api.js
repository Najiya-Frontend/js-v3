(function (w) {
  "use strict";

  if (w.TenxApi && typeof w.TenxApi.ensureDevice === "function") return;

  // Put your SERVER IP here (rest-api host). Your PC IP (192.168.10.3) is NOT used.
  var STATIC_BACKEND_ORIGIN = "http://192.168.10.60";
 // change to https://... if your rest-api is https

  var ZERO_MAC = "00:00:00:00:00:00";

  function safeGetLS(k) { try { return w.localStorage.getItem(k); } catch (e) { return null; } }
  function safeGetSS(k) { try { return w.sessionStorage.getItem(k); } catch (e2) { return null; } }
  function safeSetSS(k, v) { try { w.sessionStorage.setItem(k, v); } catch (e3) {} }

  function detectHost() {
    var override = safeGetLS("API_ORIGIN");
    if (override) return String(override).replace(/\/+$/, "");

    try {
      if (w.location && w.location.protocol && w.location.host &&
          (w.location.protocol.indexOf("http") === 0)) {
        return (w.location.protocol + "//" + w.location.host).replace(/\/+$/, "");
      }
    } catch (e) {}

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
    xhr.open(method, url, true);
    xhr.setRequestHeader("Accept", "application/json");
    if (method === "POST") xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function () {
      if (xhr.readyState !== 4) return;

      var ok = (xhr.status >= 200 && xhr.status < 300);
      var data = null;
      try { data = JSON.parse(xhr.responseText || "{}"); } catch (e) { data = null; }

      cb(ok ? null : (data || xhr.responseText || ("HTTP " + xhr.status)), data);
    };
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
        app_id: Number(d.app_id || payload.app_id),
        hotel_id: Number(d.hotel_id || payload.hotel_id),
        device_id: Number(d.device_id || 0),
        guest_id: Number(d.guest_id || payload.guest_id || 0),
        room_id: Number(d.room_id || payload.room_id || 0),
        device_mac: String(d.device_mac || payload.device_mac || ""),
        language_id: Number(payload.language_id || 1)
      };

      safeSetSS("DEVICE_INFO", JSON.stringify(save));
      done(null, save);
    });
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
        cb && cb(null, (res && res.data) ? res.data : res);
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

  w.TenxApi = {
    HOST: HOST,
    ensureDevice: function () { return ensureDevice(function () {}); },
    getAppDataNormalized: function () { return getAppDataNormalized(function () {}); },
    changeGuestLang: function (p) { return changeGuestLang(p, function () {}); },
    liveClient: { subscribe: function () {} }
  };

})(window);
