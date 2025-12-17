///utils/mac.util.js

(function () {
  "use strict";

  // Define ZERO_MAC as an empty or invalid MAC address constant
  const ZERO_MAC = "00:00:00:00:00:00";

  const SS = {
    get: (k, d = "") => {
      try {
        const v = sessionStorage.getItem(k);
        return v == null ? d : v;
      } catch {
        return d;
      }
    },
    set: (k, v) => {
      try {
        sessionStorage.setItem(k, v);
      } catch {}
    },
  };

  const LS = {
    get: (k, d = "") => {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : v;
      } catch {
        return d;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch {}
    },
  };

  const isZero = (s = "") => /^(?:00:){5}00$/i.test(String(s));

  function normMac(s = "") {
    s = String(s).trim().toUpperCase().replace(/[^0-9A-F]/g, "");
    if (s.length !== 12) return "";
    return s.match(/.{1,2}/g).join(":");
  }

  function getCachedMac() {
    const s = SS.get("DEVICE_MAC") || LS.get("DEVICE_MAC");
    const m = normMac(s);
    return m || "";
  }

  function putCachedMac(m) {
    if (!m || isZero(m)) return; // never store bad MAC
    SS.set("DEVICE_MAC", m);
    LS.set("DEVICE_MAC", m);
  }

  /* ---------------- sync best-effort (for early boot) ---------------- */
  function getAnyMacAddressSync() {
    try {
      if (window.Player?.getMacAddress) {
        const m = normMac(window.Player.getMacAddress());
        if (m) return m;
      }
    } catch {}
    try {
      if (window.Player?.getMac) {
        const m = normMac(window.Player.getMac());
        if (m) return m;
      }
    } catch {}
    try {
      if (window.PlayerInterface?.getMacAddress) {
        const m = normMac(window.PlayerInterface.getMacAddress());
        if (m) return m;
      }
    } catch {}
    try {
      if (window.gSTB?.RDir) {
        const m = normMac(window.gSTB.RDir("MACAddress"));
        if (m) return m;
      }
    } catch {}
    try {
      if (window.stb?.GetDeviceMacAddress) {
        const m = normMac(window.stb.GetDeviceMacAddress());
        if (m) return m;
      }
    } catch {}
    try {
      if (window.webOS?.device?.macAddress) {
        const m = normMac(window.webOS.device.macAddress);
        if (m) return m;
      }
    } catch {}
    // Tizen/webOS async APIs come later
    return "";
  }

  /* ---------------- async full scan (Tizen / webOS supported) ---------------- */
  async function getAnyMacAddress() {
    let m = getAnyMacAddressSync();
    if (m) return m;

    // Tizen
    try {
      const si = window.tizen?.systeminfo;
      if (si?.getPropertyValue) {
        const getProp = (k) => new Promise((res) => si.getPropertyValue(k, res, () => res(null)));
        const wifi = await getProp("WIFI_NETWORK");
        const eth = await getProp("ETHERNET_NETWORK");
        m = normMac(wifi?.macAddress || eth?.macAddress || "");
        if (m) return m;
      }
    } catch {}

    // webOS
    try {
      const dev = window.webOS?.device;
      if (dev?.getInfo) {
        const info = await new Promise((res) => dev.getInfo((i) => res(i), () => res(null)));
        m = normMac(info?.macAddress || "");
        if (m) return m;
      }
    } catch {}

    return "";
  }

  // Resolve once and cache; emit 'mac:resolved' only on real improvement
  async function resolveMacAsync() {
    const before = getCachedMac();
    let mac = before || getAnyMacAddressSync();
    if (!mac) mac = await getAnyMacAddress();
    mac = normMac(mac);

    if (mac && !isZero(mac) && mac !== before) {
      putCachedMac(mac);
      try {
        window.dispatchEvent(new CustomEvent("mac:resolved", { detail: { mac } }));
      } catch {}
      return mac;
    }
    // no improvement; keep previous good value (or remain empty)
    return before || "";
  }

  // expose
  window.MacUtil = {
    normMac,
    getAnyMacAddressSync,
    getAnyMacAddress, // async
    getCachedMac,
    resolveMacAsync, // async + caches + event (only on improvement)
    ZERO_MAC,
  };
})();
