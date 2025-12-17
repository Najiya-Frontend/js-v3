var Player = {
    isSTB: true,
    currentMrl: "",
    mediaType: "",
    currentState: null,
    playerSpeed: [2, 4, 6, 8, 16, 32],
    playerSpeedIndex: 0,
    playerRegion: "",
    playerElement: "",
    currentElement: "",
    isMute: 0,
    init: function () {
        if (typeof ASTB != "undefined") {
            try {
                ASTB.SetConfig(AMINO_PWD, "SETTINGS.DISPLAY_MODE", AMINO_ASPECT_RATIO);
                ASTB.SetConfig(AMINO_PWD, "SETTINGS.FULLSCREEN", AMINO_FULLSCREEN_SETTING);
                ASTB.SetConfig(AMINO_PWD, "SETTINGS.GFX_RESOLUTION", AMINO_VIDEO_MODE);
                ASTB.SetConfig(AMINO_PWD, "SETTINGS.DISPLAY_MODE", AMINO_ASPECT_RATIO);
                ASTB.CommitConfig();
            } catch (b) {
                alert(b.message);
            }
        }
    },
    getPlayerHtml: function () {
        return "";
    },
    getPlayerState: function () {
        return this.currentState
    },
    setPlayerState: function (a) {
        this.currentState = a;
    },
    getVolume: function () {
        try {
            return AudioControl.GetVolume();
        } catch (a) {
            console.log("getVolume error :: " + a.message);
            return 0;
        }
    },
    powerToggle: function () {
        p = ASTB.GetPowerState();
        p = (p == 2) ? 4 : 2;
        ASTB.SetPowerState(p);
    },
    setVolume: function (b) {
        try {
            b = b > VOLUME_MAX ? VOLUME_MAX : b;
            b = b < VOLUME_MIN ? VOLUME_MIN : b;
            AudioControl.SetVolume(b);
        } catch (a) {
           console.log("setVolume error :: " + a.message);
        }
    },
    setBrowser: function (b) {
        try {
            ASTB.SetMouseState(false);
            Browser.SetToolbarState(false);
        } catch (d) {
        }
    },
    toggleMute: function () {
        try {
            this.isMute = AudioControl.GetMute();
            this.isMute = (this.isMute == 1) ? 0 : 1;
            AudioControl.SetMute(this.isMute);
            return this.isMute;
        } catch (a) {
           console.log("toggleMute error :: " + a.message);
        }
    },
    getIpAddress: function () {
        try {
            return ASTB.GetIPAddress();
        } catch (a) {
           console.log("getIpAddress error :: " + a.message);
            return "000.000.000.000";
        }
    },
    getMacAddress: function () {
        try {
            return ASTB.GetMacAddress();
        } catch (a) {
           console.log("GetMacAddress error :: " + a.message);
            return "00:00:00:00:00:00";
        }
    },
    getSerialNumber: function () {
        try {
            return ASTB.GetSerialNumber();
        } catch (a) {
           console.log("rtvGetSerialNumber error :: " + a.message);
            return "00:00:00:00:00:00";
        }
    },
    getStoredData: function (a) {
        try {
            return this.player.getStorageValue(a);
        } catch (b) {
           console.log("Player.getStoredData() error :: " + b.message);
        }
    },
    setStoredData: function (b, c) {
        try {
            return this.player.setStorageValue(b, c);
        } catch (a) {
           console.log("Player.setStoredData() error :: " + a.message);
        }
    },
    loadUrl: function (a) {
        try {
            setTimeout(function () {
                parent.location.reload();
            }, 5000);
        } catch (b) {
           console.log("Player.loadUrl() error :: " + b.message);
        }
    },
    stop: function () {
        try {
            this.setPlayerState("IDLE");
            AVMedia.Stop();
            this.currentMrl = "";
            this.playerSpeedIndex = 0;
            this.setClipScreen(0, globalGetScreenHeightByResolution(), CLIP_W, CLIP_H);
        } catch (a) {
           console.log("Player.stop() error :: " + a.message);
        }
    },
    play: function (a, t) {
        var b = null;
        try {
            if (a != this.currentMrl) {
                document.body.style.backgroundColor = "#102030";
                this.setPlayerState("PLAYING");
                b = AVMedia.Play(a);
                if (SCREEN_MODE == 1) {
                    VideoDisplay.SetAVAspect(3);
                }
                if (0 == b) {
                    this.currentMrl = a;
                    this.setPlayerState("PLAYING");
                } else this.currentMrl = "";
                this.setChromaKey(CHROMAKEY);
                Browser.SetToolbarState(0);
            }
        } catch (c) {
           console.log("Player.play() error :: " + c.message);
        }
    },
    restart: function () {
        ASTB.Reboot();
    },
    pause: function () {
        try {
            if (this.getPlayerState() === "PAUSED") {
                this.resume()
            } else {
                this.setPlayerState("PAUSED");
                AVMedia.Pause();
                this.playerSpeedIndex = 0
            }
        } catch (a) {
           console.log("Player.pause() error :: " + a.message)
        }
    },
    resume: function () {
        try {
            this.setPlayerState("PLAYING");
            this.playerSpeedIndex = 0;
            AVMedia.Continue()
        } catch (a) {
           console.log("Player.resume() error :: " + a.message)
        }
    },
    rewind: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("REWIND");
            AVMedia.SetSpeed(-1 * b)
        } catch (a) {
           console.log("Player.rewind() error :: " + a.message)
        }
    },
    fforward: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("FFORWARD");
            AVMedia.SetSpeed(b)
        } catch (a) {
           console.log("Player.fforward() error :: " + a.message)
        }
    },
    seekPDL: function (a) {
        try {
            this.player.seekPDL(a)
        } catch (b) {
           console.log("Player.seekPDL() error :: " + b.message)
        }
    },
    getPosition: function () {
        var a = 0;
        try {
            a = PVR.GetPltInfo()
        } catch (b) {
           console.log("Player.getPosition() error :: " + b.message)
        }
        return a
    },
    setPosition: function (a) {
        try {
            this.player.setPosition(a)
        } catch (b) {
           console.log("Player.setPosition() error :: " + b.message)
        }
    },
    getDuration: function () {
        var b = 0;
        try {
            b = AVMedia.GetDuration()
        } catch (a) {
           console.log("Player.getDuration() error :: " + a.message)
        }
        return b
    },
    setClipScreen: function () {
        try {
            var c = VideoDisplay.GetVideoWindow();
            if (c != null) {
                w = c.GetRectangle();
                w.width = CLIP_W;
                w.height = CLIP_H;
                w.left = CLIP_X;
                w.top = CLIP_Y;
                c.SetRectangle(w);
                this.setAlphaLevel(TRANSPARENCY_LEVEL)
            }
        } catch (d) {
        }
    },
    setClipScreenMin: function () {
        try {
            this.setAlphaLevel(OPAQUE_LEVEL)
        } catch (b) {
        }
    },
    setFullScreen: function () {
        try {
            var d = VideoDisplay.GetVideoWindow();
            if (d != null) {
                w = d.GetRectangle();
                w.width = globalConst("SCREEN_WIDTH");
                w.height = globalConst("SCREEN_HEIGHT");
                w.left = 0;
                w.top = 0;
                d.SetRectangle(w);
                this.setAlphaLevel(0)
            }
        } catch (a) {
            result = false
        }
    },
    getBrowserResolution: function () {
        var a = "1080";
        try {
            a = screen.height + ""
        } catch (d) {
            return a
        }
        return a
    },
    removeCache: function () {
        try {
            Browser.CacheFlush()
        } catch (b) {
           console.log(b.message)
        }
    },
    setAlphaLevel: function (b) {
        try {
            VideoDisplay.SetAlphaLevel(b)
        } catch (a) {
        }
    },
    setOutputResolution: function (a) {
        try {
            this.player.setOutputResolution(2, level)
        } catch (b) {
        }
    },
    setChromaKey: function (a) {
        try {
            VideoDisplay.SetChromaKey(a)
        } catch (b) {
        }
    },
    reboot: function () {
        try {
            ASTB.Reboot();
        } catch (a) {
        }
    },
    printDebugMessage: function (b) {
        try {
            ASTB.DebugString(b)
        } catch (a) {
        }
    },
    getVolumeLimit: function (c) {
        var b = false;
        try {
            b = this.player.getVolumeLimit(c)
        } catch (a) {
        }
        return b
    },
    playerEventHandler: function (b) {
        var a = "VIDEO_UNKNOWN_EVENT";
        switch (b) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 8:
            case 9:
            case 10:
                a = "VIDEO_PLAYING_FAILED";
                break;
            case 5:
                a = "VIDEO_PLAYING_SUCCESS";
                break;
            case 7:
                a = "VIDEO_END_OF_STREAM";
                break;
            case 14:
                a = "VIDEO_START_OF_STREAM";
                break;
            case 16:
                a = "IGMP_END_OF_STREAM";
                break;
            case 17:
                a = "IGMP_PLAYING_SUCCESS";
                break;
            case 19:
                a = "UDP_END_OF_STREAM";
                break;
            case 20:
                a = "UDP_STATUS_PLAYING";
                break;
            case 21:
                a = "MP3_END_OF_STREAM";
                break;
            case 22:
                a = "MP3_START_OF_STREAM";
                break;
            case 23:
                a = "FILE_END_OF_STREAM";
                break;
            case 24:
                a = "DVR_RECORD_ERROR";
                break;
            case 25:
                a = "DVR_PLAY_ERROR";
                break;
            case 26:
                a = "DVR_END_OF_STREAM";
                break;
            case 27:
                a = "DVR_START_OF_STREAM";
                break;
            case 6:
            case 11:
            case 12:
            case 13:
            case 15:
            case 18:
                a = "VIDEO_UNKNOWN_EVENT";
                break;
            default:
                a = "VIDEO_UNKNOWN_EVENT_" + b;
                break
        }
        globalFireEvent(new Event(a))
    },
    firmwareEventHandler: function (b) {
        var a = "FIRMWARE_UNKNOWN_EVENT";
        switch (b) {
            case 1000:
                a = "FIRMWARE_EVENT_NEW_FIRMWARE_AVAILABLE";
                break;
            case 1001:
                a = "FIRMWARE_EVENT_FIRMWARE_UP_TO_DATE";
                break;
            case 1002:
                a = "FIRMWARE_EVENT_UPGRADE_CHECK_FAILED";
                break;
            default:
                a = "FIRMWARE_UNKNOWN_EVENT";
                break
        }
        globalFireEvent(new Event(a))
    },
    dvbEventHandler: function (b) {
        var a = "DVB_UNKNOWN_EVENT";
        switch (b) {
            case 2000:
                a = "DVBT_EVENT_SCAN_STARTED";
                break;
            case 2001:
                a = "DVBT_EVENT_SCAN_CONTINUE";
                break;
            case 2002:
                a = "DVBT_EVENT_SCAN_COMPLETED_WITH_CHANNELS";
                break;
            case 2003:
                a = "DVBT_EVENT_SCAN_COMPLETED_WITHOUT_CHANNELS";
                break;
            case 2004:
                a = "DVBT_EVENT_SCAN_ERROR";
                break;
            case 2005:
                a = "DVBT_EVENT_LOW_SIGNAL";
                break;
            case 2006:
                a = "DVBT_EVENT_LOST_SIGNAL";
                break;
            default:
                a = "DVB_UNKNOWN_EVENT";
                break
        }
        globalFireEvent(new Event(a))
    },
    upnpEventHandler: function (b) {
        var a = "UPNP_UNKNOWN_EVENT";
        switch (b) {
            case 1000:
                a = "UPNP_SCAN_IN_PROGRESS";
                break;
            case 1001:
                a = "UPNP_SCAN_SUCCESS_SERVERS_FOUND";
                break;
            case 1002:
                a = "UPNP_SCAN_SUCCESS_NO_SERVERS_FOUND";
                break;
            case 1003:
                a = "UPNP_SCAN_FAILED";
                break
        }
        globalFireEvent(new Event(a))
    },
    pvrEventHandler: function (c, a) {
        var b = "PVR_UNKNOWN_EVENT";
        switch (c) {
            case 2501:
                b = "RECORDING_STOPPED";
                break;
            case 2502:
                b = "RECORDING_ERROR";
                break;
            case 2503:
                b = "LIMIT_SIZE_EXCEEDED";
                break
        }
        globalFireEvent(new Event(b, {
            assetId: a
        }))
    },
    listenerEventHandler: function (a) {
        globalFireEvent(new Event("NOTIFICATION", {
            message: a
        }))
    },
    setCurrentSubtitle: function (b) {
        try {
            if (b != "off") {
                VideoDisplay.SetSubtitles(1)
            } else {
                VideoDisplay.SetSubtitles(0)
            }
        } catch (a) {
        }
    },
};