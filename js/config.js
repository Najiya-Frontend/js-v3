/* /tenx-v3/js/config.js
   ES5-safe runtime config defaults.
   - Only sets localStorage keys if they are missing (so you can override later).
*/
(function (w) {
  "use strict";

  function lsGet(k) { try { return w.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { w.localStorage.setItem(k, v); } catch (e) {} }

  // Base path (useful for other loaders later)
  w.__TENX_BASE__ = "/tenx-v3";
  w.__TENX_VER__ = w.__TENX_VER__ || String(Date.now());

  // Default origin for API calls
  var origin = "";
  try {
    if (w.location && w.location.protocol && w.location.host) {
      origin = w.location.protocol + "//" + w.location.host;
    }
  } catch (e2) {}
  if (!origin) origin = "http://192.168.1.50";

  // Set defaults only if missing
  if (!lsGet("API_ORIGIN")) lsSet("API_ORIGIN", origin);

  // These should match what your admin portal expects
  if (!lsGet("APP_ID"))   lsSet("APP_ID", "2");
  if (!lsGet("HOTEL_ID")) lsSet("HOTEL_ID", "1");

  // Optional: if you want to force room/guest during testing
  // if (!lsGet("ROOM_ID"))  lsSet("ROOM_ID", "1");
  // if (!lsGet("GUEST_ID")) lsSet("GUEST_ID", "1");

})(window);
