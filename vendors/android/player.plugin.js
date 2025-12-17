/* player-plugin.js  — unified Player API for UDP/HTTP + background/front control
 * - Uses window.PlayerInterface when available (Android/STB)
 * - Falls back to HTML5 <video> on desktop/dev
 */

(function () {
  /* ---------- utils ---------- */
  const ZAP_DELAY_MS = 120;

  function fire(name, detail) {
    try {
      const ev = new CustomEvent(name, { detail });
      window.dispatchEvent(ev);
    } catch {
      // older engines
      const ev = document.createEvent('CustomEvent');
      ev.initCustomEvent(name, false, false, detail);
      window.dispatchEvent(ev);
    }
  }

  function isUdpLike(url) {
    if (!url) return false;
    if (/^(udp|rtp|igmp):/i.test(url)) return true;
    return /^\d{1,3}(?:\.\d{1,3}){3}:\d{2,5}$/.test(String(url));
  }

  function detectType(url) {
    if (isUdpLike(url)) return "UDP";
    if (/\.m3u8(\?|$)/i.test(url) || /^https?:/i.test(url)) return "HTTP";
    return "FILE";
  }

  /* ---------- HTML5 fallback (desktop/dev) ---------- */
  const Fallback = {
    _el: null,
    _mounted: false,
    _muted: false,
    _front: false, // not used visually; React controls z-order

    ensure() {
      if (this._mounted) return;
      const v = document.createElement('video');
      v.id = 'vendor-fallback-video';
      v.playsInline = true;
      v.autoplay = true;
      v.controls = false;
      v.style.position = 'fixed';
      v.style.inset = '0';
      v.style.width = '100vw';
      v.style.height = '100vh';
      v.style.objectFit = 'contain';
      v.style.zIndex = '0'; // React decides front/back by pointer-events overlay
      v.style.opacity = '0'; // hidden by default unless React wants front
      v.setAttribute('muted', 'muted');
      v.muted = true;

      v.addEventListener('playing', () => fire('VIDEO_PLAYING_SUCCESS'));
      v.addEventListener('ended',   () => fire('VIDEO_END_OF_STREAM'));
      v.addEventListener('error',   () => fire('VIDEO_PLAYING_FAILED'));

      document.body.appendChild(v);
      this._el = v;
      this._mounted = true;
    },

    async play(url) {
      this.ensure();
      this._el.src = url;
      try { await this._el.play(); } catch {}
    },
    stop() {
      if (!this._el) return;
      try { this._el.pause(); } catch {}
      try { this._el.removeAttribute('src'); this._el.load(); } catch {}
    },
    pause() { try { this._el?.pause(); } catch {} },
    resume() { try { this._el?.play(); } catch {} },
    setViewport(x, y, w, h) {
      this.ensure();
      Object.assign(this._el.style, {
        left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px'
      });
    },
    setFullScreen() {
      this.ensure();
      Object.assign(this._el.style, {
        left: '0px', top: '0px', width: '100vw', height: '100vh'
      });
    },
    setTopWin(isTop) {
      this.ensure();
      this._front = !!isTop;
      // React overlays handle real z-order; we keep the element always present
    },
    getVolume() { return Math.round((this._el?.volume ?? 1) * 100); },
    setVolume(v) {
      this.ensure();
      const clamped = Math.max(0, Math.min(100, Number(v) || 0));
      this._el.volume = clamped / 100;
      return clamped;
    },
    mute(b) { this.ensure(); this._el.muted = !!b; this._muted = !!b; },
  };

  /* ---------- Player facade (matches your app) ---------- */
  const Player = {
    // public state
    isSTB: true,
    currentMrl: "",
    mediaType: "",
    currentState: "IDLE",
    isMute: 0,
    winMode: 0, // 0: background, 1: front
    playerSpeed: [2, 4, 6, 8, 16, 32],
    playerSpeedIndex: 0,

    // internal
    _useNative() { return !!window.PlayerInterface; },
    _fallback: Fallback,

    init() {
      // nothing required; keep for parity
    },

    /* -------- basics -------- */
    getPlayerState() { return this.currentState; },
    setPlayerState(s) { this.currentState = s; },

    stop() {
      try {
        this.currentMrl = "";
        this.playerSpeedIndex = 0;
        if (this._useNative()) {
          window.PlayerInterface.stop();
        } else {
          this._fallback.stop();
        }
        this.setPlayerState("IDLE");
      } catch (e) {
        console.error("Player.stop error:", e);
      }
    },

    play(url, type) {
      try {
        const mType = type || detectType(url);

        // replay guard parity with your legacy code
        if (url === this.currentMrl) {
          // force a replay anyway by stopping first
          this.stop();
        }
        this.currentMrl = url;
        this.mediaType = mType;

        if (this._useNative()) {
          // Native interface: play(url, type)
          window.PlayerInterface.play(url, mType);
        } else {
          // Fallback HTML5
          this._fallback.play(url);
        }

        this.setPlayerState("PLAYING");
      } catch (e) {
        console.error("Player.play error:", e);
        fire('VIDEO_PLAYING_FAILED');
      }
    },

    pause() {
      try {
        if (this.getPlayerState() === "PAUSED") { this.resume(); return; }
        this.setPlayerState("PAUSED");
        if (this._useNative()) window.PlayerInterface.pause();
        else this._fallback.pause();
        this.playerSpeedIndex = 0;
      } catch (e) { console.error("Player.pause error:", e); }
    },

    resume() {
      try {
        this.setPlayerState("PLAYING");
        this.playerSpeedIndex = 0;
        if (this._useNative()) window.PlayerInterface.continue();
        else this._fallback.resume();
      } catch (e) { console.error("Player.resume error:", e); }
    },

    rewind(speed) {
      try {
        const b = speed || this.playerSpeed[
          this.playerSpeedIndex === (this.playerSpeed.length - 1)
            ? this.playerSpeedIndex
            : (this.playerSpeedIndex++)
        ];
        this.setPlayerState("REWIND");
        if (this._useNative()) window.PlayerInterface.setSpeed(-1 * b);
        // fallback: skip backwards a bit
        else { const v = this._fallback._el; if (v) v.currentTime = Math.max(0, v.currentTime - 10); }
      } catch (e) { console.error("Player.rewind error:", e); }
    },

    fforward(speed) {
      try {
        const b = speed || this.playerSpeed[
          this.playerSpeedIndex === (this.playerSpeed.length - 1)
            ? this.playerSpeedIndex
            : (this.playerSpeedIndex++)
        ];
        this.setPlayerState("FFORWARD");
        if (this._useNative()) window.PlayerInterface.setSpeed(b);
        else { const v = this._fallback._el; if (v) v.currentTime = Math.min((v.duration || 1e9), v.currentTime + 10); }
      } catch (e) { console.error("Player.fforward error:", e); }
    },

    /* -------- view plane / z-order -------- */
    // 'clip' => front (on top), 'full' => background
    toggleWinMode(t) {
      try {
        this.winMode = (t === "clip") ? 1 : 0;
        if (this._useNative()) {
          window.PlayerInterface.setTopWin(this.winMode);
        } else {
          this._fallback.setTopWin(this.winMode);
        }
      } catch (e) { console.error("Player.toggleWinMode error:", e); }
    },

    setViewport(x, y, w, h) {
      try {
        if (this._useNative()) {
          window.PlayerInterface.setViewport(parseInt(x), parseInt(y), parseInt(w), parseInt(h));
        } else {
          this._fallback.setViewport(x, y, w, h);
        }
      } catch (e) { console.error("Player.setViewport error:", e); }
    },

    setFullScreen() {
      try {
        if (this._useNative()) {
          const w = (screen && (screen.availWidth || screen.width)) || window.innerWidth || 1920;
          const h = (screen && (screen.availHeight || screen.height)) || window.innerHeight || 1080;
          window.PlayerInterface.setViewport(0, 0, parseInt(w), parseInt(h));
        } else {
          this._fallback.setFullScreen();
        }
      } catch (e) { console.error("Player.setFullScreen error:", e); }
    },

    /* -------- volume / mute -------- */
    getVolume() {
      try {
        if (this._useNative()) return window.PlayerInterface.getVolume();
        return this._fallback.getVolume();
      } catch (e) { console.error("Player.getVolume error:", e); return 0; }
    },

    setVolume(v) {
      try {
        const clamped = Math.max(0, Math.min(100, Number(v) || 0));
        if (this._useNative()) window.PlayerInterface.setVolume(clamped);
        else this._fallback.setVolume(clamped);
        return clamped;
      } catch (e) { console.error("Player.setVolume error:", e); }
    },

    toggleMute() {
      try {
        this.isMute = this.isMute ? 0 : 1;
        if (this._useNative()) window.PlayerInterface.mute(!!this.isMute);
        else this._fallback.mute(!!this.isMute);
      } catch (e) { console.error("Player.toggleMute error:", e); }
    },

    /* -------- numeric event mapper (native → DOM) -------- */
    playerEventHandler(code) {
      let name = "VIDEO_UNKNOWN_EVENT";
      switch (code) {
        case 1: case 2: case 3: case 4: case 8: case 9: case 10: name = "VIDEO_PLAYING_FAILED"; break;
        case 5:  name = "VIDEO_PLAYING_SUCCESS"; break;
        case 7:  name = "VIDEO_END_OF_STREAM"; break;
        case 14: name = "VIDEO_START_OF_STREAM"; break;
        case 16: name = "IGMP_END_OF_STREAM"; break;
        case 17: name = "IGMP_PLAYING_SUCCESS"; break;
        case 19: name = "UDP_END_OF_STREAM"; break;
        case 20: name = "UDP_STATUS_PLAYING"; break;
        default: name = "VIDEO_UNKNOWN_EVENT_" + code; break;
      }
      fire(name);
    }
  };

  /* ---------- expose ---------- */
  window.Player = Player;

  // If native layer wants to call back (optional — wire these names in your WebView/bridge)
  window.__player_native_event__ = function (code) {
    try { Player.playerEventHandler(code); } catch {}
  };

  /* ---------- small helper to sync z-order on success ---------- */
  window.addEventListener('VIDEO_PLAYING_SUCCESS', function () {
    try {
      // keep the current z-order the app selected
      Player.setFullScreen();
      Player.toggleWinMode(Player.winMode ? 'clip' : 'full');
    } catch {}
  });

})();
