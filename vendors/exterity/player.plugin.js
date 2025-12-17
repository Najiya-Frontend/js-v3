var Player = {
    isSTB: true,
    player: (typeof document.createExterityPlayer == "function") ? document.createExterityPlayer() : {},
    conf: (typeof document.createExterityOutputConfig == "function") ? document.createExterityOutputConfig() : {},
    currentMrl: "",
    mediaType: "",
    currentState: null,
    playerSpeed: [2, 4, 8, 16, 32],
    playerSpeedIndex: 0,
    init: function () {
        try {
            if (typeof (opera) != "undefined") {
                opera.disableorigincheck(document, true);
            }
            this.setChromaKey(0);
        } catch (b) {
           console.log("Player.init() error :: " + b.message);
        }
    },
    getPlayerHtml: function () {
        return "";
    },
    getPlayerState: function () {
        return this.currentState
    },
    setPlayerState: function (b) {
        this.currentState = b;
    },
    getVolume: function () {
        try {
            return this.conf.getVolume();
        } catch (b) {
           console.log("getVolume error :: " + b.message);
            return 0;
        }
    },
    setVolume: function (c) {
        try {
            c = c > VOLUME_MAX ? VOLUME_MAX : c;
            c = c < 0 ? 0 : c;
            this.conf.setVolume(c);
        } catch (d) {
           console.log("setVolume error :: " + d.message);
        }
    },
    setMaxVolume: function () {
        try {
            this.conf.setVolume(VOLUME_MAX);
        } catch (b) {
           console.log("setVolume error :: " + b.message);
        }
    },
    toggleMute: function () {
        try {
            this.conf.setMute(!this.conf.getMute());
        } catch (b) {
           console.log("toggleMute error :: " + b.message);
        }
    },
    getIpAddress: function () {
        try {
            return (typeof configread === "undefined") ? "000.000.000.000" : configread("IPAddress");
        } catch (b) {
           console.log("rtvGetIp error :: " + b.message);
            return "000.000.000.000";
        }
    },
    getMacAddress: function () {
        try {
            var b = (typeof configread === "undefined") ? "00:00:00:00:00:00" : configread("mac");
            b = b.replaceAll(":", "");
            return b.trim();
        } catch (c) {
           console.log("rtvGetMacAddress error :: " + c.message);
            return "00:00:00:00:00:00";
        }
    },
    getSerialNumber: function () {
        try {
            return (typeof configread === "undefined") ? "00:00:00:00:00:00" : configread("serialNumber");
        } catch (b) {
           console.log("rtvGetSerialNumber error :: " + b.message);
            return "00:00:00:00:00:00";
        }
    },
    getStoredData: function (d) {
        try {
            return this.player.getStorageValue(d)
        } catch (c) {
           console.log("Player.getStoredData() error :: " + c.message);
        }
    },
    setStoredData: function (e, d) {
        try {
            return this.player.setStorageValue(e, d);
        } catch (f) {
           console.log("Player.setStoredData() error :: " + f.message);
        }
    },
    loadUrl: function (d) {
        try {
            this.document.location.href = d;
        } catch (c) {
           console.log("Player.loadUrl() error :: " + c.message);
        }
    },
    stop: function () {
        try {
            this.setPlayerState("IDLE");
            this.player.stop();
            this.currentMrl = "";
            this.playerSpeedIndex = 0;
        } catch (b) {
           console.log("Player.stop() error :: " + b.message);
        }
    },
    play: function (d) {
        var e = null;
        try {
            if (d != this.currentMrl) {
                this.setPlayerState("PLAYING");
                e = this.player.play(d);
                if (e) {
                    this.currentMrl = d;
                    this.setPlayerState("PLAYING");
                } else {
                    this.currentMrl = "";
                }
            }
        } catch (f) {
           console.log("Player.play() error :: " + f.message);
        }
    },
    pause: function () {
        try {
            if (this.getPlayerState() === "PAUSED") {
                this.resume();
            } else {
                this.setPlayerState("PAUSED");
                this.player.pause();
                this.playerSpeedIndex = 0;
            }
        } catch (b) {
           console.log("Player.pause() error :: " + b.message);
        }
    },
    resume: function () {
        try {
            this.setPlayerState("PLAYING");
            this.playerSpeedIndex = 0;
            this.player.play();
        } catch (b) {
           console.log("Player.resume() error :: " + b.message);
        }
    },
    rewind: function (d) {
        try {
            var e = d || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("REWIND");
            this.player.rewind(-1 * e)
        } catch (f) {
           console.log("Player.rewind() error :: " + f.message)
        }
    },
    fforward: function (d) {
        try {
            var e = d || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("FFORWARD");
            this.player.fastForward(e)
        } catch (f) {
           console.log("Player.fforward() error :: " + f.message)
        }
    },
    seekPDL: function (d) {
        try {
            this.player.seekPDL(d)
        } catch (c) {
           console.log("Player.seekPDL() error :: " + c.message)
        }
    },
    getPosition: function () {
        var d = 0;
        try {
            d = this.player.getPosition()
        } catch (c) {
           console.log("Player.getPosition() error :: " + c.message)
        }
        return d
    },
    setPosition: function (d) {
        try {
            this.player.setPosition(d)
        } catch (c) {
           console.log("Player.setPosition() error :: " + c.message)
        }
    },
    getDuration: function () {
        var c = 0;
        try {
            c = this.player.getStreamDuration()
        } catch (d) {
           console.log("Player.getDuration() error :: " + d.message)
        }
        return c
    },
    setClipScreen: function () {
        if (this.player) {
            try {
                if (getFrameDocument().getElementById("player")) {
                    getFrameDocument().getElementById("player").style.width = CLIP_W + "px";
                    getFrameDocument().getElementById("player").style.height = CLIP_H + "px";
                    if (DEFAULT_DIRECTION == "rtl") {
                        l = globalGetScreenWidthByResolution() - (CLIP_W + CLIP_X);
                        getFrameDocument().getElementById("player").style.left = l + "px";
                        getFrameDocument().getElementById("player").style.top = CLIP_Y + "px"
                    } else {
                        getFrameDocument().getElementById("player").style.left = CLIP_X + "px";
                        getFrameDocument().getElementById("player").style.top = CLIP_Y + "px"
                    }
                }
            } catch (a) {
               console.log("Player.setClipScreen() error :: " + a.message);
                result = false
            }
        }
    },
    setFullScreen: function () {
        if (this.player) {
            try {
                if (getFrameDocument().getElementById("player")) {
                    getFrameDocument().getElementById("player").style.width = globalGetScreenWidthByResolution() + "px";
                    getFrameDocument().getElementById("player").style.height = globalGetScreenHeightByResolution() + "px";
                    getFrameDocument().getElementById("player").style.left = "0px";
                    getFrameDocument().getElementById("player").style.top = "0px"
                }
            } catch (b) {
                result = false
            }
        }
    },
    getBrowserResolution: function () {
        var d = "";
        var c = (typeof configread === "undefined") ? "720p" : configread("screenResolution");
        c = (c === "auto") ? screen.height + 'p' : configread("screenResolution");//force to screen height
        switch (c) {
            case "720p":
            case "720p60":
            case "720p50":
                d = "720P";
                break;
            case "1080p":
            case "1080p60":
            case "1080p50":
            case "1080i60":
            case "1080i50":
                d = "1080I";
                break;
        }
        return d;
    },
    isWiredConnection: function () {
        var d = false;
        try {
            d = this.player.checkWiredConnection();
        } catch (c) {
            d = false
        }
        return d
    },
    setAlphaLevel: function (c) {
        try {
            this.player.setAlpha(c)
        } catch (d) {
        }
    },
    getAlphaLevel: function (c) {
        try {
            this.player.getAlpha()
        } catch (d) {
        }
    },
    setOutputResolution: function (d) {
        try {
            this.player.setOutputResolution(2, level)
        } catch (c) {
        }
    },
    setChromaKey: function (d) {
        try {
            this.player.setChromaKey(d)
        } catch (c) {
        }
    },
    reboot: function () {
        try {
            this.player.reboot()
        } catch (b) {
        }
    },
    printDebugMessage: function (c) {
        try {
            this.player.debugMsg(c, 3)
        } catch (d) {
        }
    },
    getChannelChangeTime: function () {
        var d = 0;
        try {
            d = this.player.getChannelChangeTime()
        } catch (c) {
        }
        return d
    },
    getAudioList: function () {
        var a = [];
        try {
            a = eval(this.player.getAudioIDList())
        } catch (b) {
        }
        return a
    },
    getCurrentAudio: function () {
        var d = null;
        try {
            d = this.player.getAudioID()
        } catch (c) {
        }
        return d
    },
    setCurrentAudio: function (c) {
        try {
            this.player.setAudioID(c)
        } catch (d) {
        }
    },
    getSubtitleList: function () {
        var a = [];
        try {
            a = eval(this.player.getSubtitleIDList())
        } catch (b) {
        }
        return a
    },
    getCurrentSubtitle: function () {
        var d = null;
        try {
            d = this.player.getSubtitleID()
        } catch (c) {
        }
        return d
    },
    setCurrentSubtitle: function (c) {
        try {
            if (c != "off") {
                this.player.setSubtitleID(c)
            } else {
                this.removeSubtitles()
            }
        } catch (d) {
        }
    },
    removeSubtitles: function () {
        try {
            this.player.removeSubtitles()
        } catch (b) {
        }
    },
    getSoftwareVersion: function () {
        var d = "0000";
        try {
            d = this.player.getSoftwareVersion()
        } catch (c) {
        }
        return d
    },
    setUpgradeParameters: function (h, e) {
        var f = false;
        try {
            f = this.player.setUpgradeParameters(parseInt(h), e)
        } catch (g) {
           console.log("Player.upgrade setUpgradeParameters :: " + g.message)
        }
        return f
    },
    upgrade: function () {
        var d = false;
        try {
            d = this.player.upgrade()
        } catch (c) {
           console.log("Player.upgrade error :: " + c.message)
        }
        return d
    },
    addSubtitleURL: function (e, g) {
        var f = false;
        try {
            f = this.player.addSubtitleURL(e, g)
        } catch (h) {
            f = 0
        }
        return f
    },
    setSubtitleURL: function (f) {
        var e = false;
        try {
            e = this.player.setSubtitleURL(f)
        } catch (d) {
            e = 0
        }
        return e
    },
    upnpInit: function () {
        var d = false;
        try {
            d = this.player.UPnPInit()
        } catch (c) {
            d = 0
        }
        return d
    },
    upnpUninit: function () {
        var d = false;
        try {
            d = this.player.UPnPUninit()
        } catch (c) {
            d = 0
        }
        return d
    },
    upnpScanDevices: function () {
        var d = false;
        try {
            d = this.player.UPnPScanDevices()
        } catch (c) {
        }
        return d
    },
    upnpGetDevicesList: function () {
        var d = null;
        try {
            d = this.player.UPnPGetDevices()
        } catch (c) {
        }
        return d
    },
    upnpBrowseDevice: function (e, g) {
        var f = null;
        try {
            f = this.player.UPnPBrowseDevice(e, g)
        } catch (h) {
        }
        return f
    },
    upnpGetMetadata: function (h, e) {
        var f = null;
        try {
            f = this.player.UPnPGetMetadata(h, e)
        } catch (g) {
        }
        return f
    },
    browseLocalDevice: function (f) {
        var e = null;
        try {
            e = this.player.browseLocalDevice(f)
        } catch (d) {
        }
        return e
    },
    startAutoScan: function () {
        var d = false;
        try {
            d = this.player.startScan(DVB_AUTO_SCAN_START_FREQUENCY, DVB_AUTO_SCAN_END_FREQUENCY, DVB_AUTO_SCAN_BANDWIDTH)
        } catch (c) {
        }
        return d
    },
    startManualScan: function () {
        var d = false;
        try {
            d = this.player.manualScan(DVB_MANUAL_SCAN_FREQUENCY, DVB_MANUAL_SCAN_BANDWIDTH)
        } catch (c) {
        }
        return d
    },
    stopScan: function () {
        var d = false;
        try {
            d = this.player.stopScan()
        } catch (c) {
        }
        return d
    },
    getSignalQuality: function () {
        var d = null;
        try {
            d = this.player.getSignalQuality()
        } catch (c) {
        }
        return d
    },
    getScanFrequency: function () {
        var d = null;
        try {
            d = this.player.getScanFrequency()
        } catch (c) {
        }
        return d
    },
    getScanProgress: function () {
        var d = null;
        try {
            d = this.player.getScanProgress();
        } catch (c) {
        }
        return d;
    },
    isChannelsStored: function () {
        var d = false;
        try {
            d = this.player.isChannelsStored();
        } catch (c) {
        }
        return d;
    },
    storeScannedChannels: function () {
        var d = null;
        try {
            d = this.player.storeScannedChannels();
        } catch (c) {
        }
        return d;
    },
    getStoredChannels: function () {
        var d = null;
        try {
            d = this.player.readStoredChannels();
        } catch (c) {
        }
        return d;
    },
    deleteStoredChannels: function () {
        var d = false;
        try {
            d = this.player.deleteSavedChannels();
        } catch (c) {
        }
        return d;
    },
    getPresentEvent: function (d) {
        var e = false;
        try {
            e = this.player.getPresentEvent(d);
        } catch (f) {
        }
        return e;
    },
    getNextEvent: function (d) {
        var e = false;
        try {
            e = this.player.getNextEvent(d);
        } catch (f) {
        }
        return e;
    },
    getAllScheduleEvents: function (d) {
        var e = false;
        try {
            e = this.player.getAllScheduleEvents(d);
        } catch (f) {
        }
        return e;
    },
    wirelessInit: function () {
        var d = false;
        try {
            d = this.player.initWireless();
        } catch (c) {
            d = 0;
        }
        return d;
    },
    wirelessActivateListener: function () {
        var d = false;
        try {
            d = this.player.onWirelessEvent(this.wirelessEventHandler)
        } catch (c) {
            d = false;
        }
        return d;
    },
    wirelessUninit: function () {
        var d = false;
        try {
            d = this.player.uninitWireless();
        } catch (c) {
            d = false;
        }
        return d;
    },
    wirelessIsConfigExists: function () {
        var d = false;
        try {
            d = this.player.checkWirelessConfig()
        } catch (c) {
            d = 1;
        }
        return d;
    },
    wirelessResetExistingConfig: function () {
        var d = false;
        try {
            d = this.player.resetWirelessConfig();
        } catch (c) {
            d = false;
        }
        return d;
    },
    wirelessGetStatus: function () {
        var d = false;
        try {
            d = this.player.getWirelessStatus();
        } catch (c) {
            d = false;
        }
        return d;
    },
    wirelessReconnect: function () {
        var d = false;
        try {
            d = this.player.reconnectWireless();
        } catch (c) {
            d = false;
        }
        return d;
    },
    wirelessDisconnect: function () {
        var d = false;
        try {
            d = this.player.disconnectWireless();
        } catch (c) {
            d = false;
        }
        return d;
    },
    wirelessInitWPS: function () {
        var d = false;
        try {
            d = this.player.initWPS();
        } catch (c) {
            d = false;
        }
        return d;
    },
    wirelessConnectWPS: function () {
        var d = false;
        try {
            d = this.player.connectWirelessWPS()
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessScan: function () {
        var d = false;
        try {
            d = this.player.scanWirelessAP()
        } catch (c) {
        }
        return d
    },
    wirelessGetNetworkList: function (d) {
        var e = false;
        try {
            e = this.player.getWirelessAPList(d || 0)
        } catch (f) {
            e = "test"
        }
        return e
    },
    wirelessGetSecurityTypeByName: function (d) {
        var c = null;
        switch (d.toUpperCase()) {
            case "NONE":
                c = 0;
                break;
            case "WEP64":
                c = 1;
                break;
            case "WEP128":
                c = 2;
                break;
            case "WPA":
                c = 5;
                break;
            case "WPA2":
                c = 6;
                break
        }
        return c
    },
    wirelessManualConnect: function (h, i, e) {
        var g = false;
        try {
            g = this.player.connectWirelessManual(h, i, e)
        } catch (j) {
        }
        return g
    },
    startPltv: function () {
        var d = false;
        try {
            d = this.player.pltvRecord(true, PLTV_BUFFER_SIZE)
        } catch (c) {
        }
        return d
    },
    stopPltv: function () {
        var d = false;
        try {
            d = this.player.pltvRecord(false)
        } catch (c) {
        }
        return d
    },
    startRecording: function (e, o, k, j, m) {
        var i = false;
        try {
            i = this.player.record(e, o, k, j, m);
            if (i == 0) {
                this.setPlayerState("RECORD")
            }
        } catch (n) {
        }
        return i
    },
    stopRecording: function (f) {
        var e = false;
        try {
            e = this.player.stopRecording(f);
            if (e == 0) {
                this.setPlayerState("IDLE")
            }
        } catch (d) {
        }
        return e
    },
    getRecordVolumesList: function () {
        var d = [];
        try {
            d = this.player.getRecordingVolumeList();
        } catch (c) {
        }
        return d
    },
    getOngoingRecording: function (f) {
        var e = null;
        try {
            if (f) {
                e = this.player.getRecordingStatusList(f)
            } else {
                e = this.player.getRecordingStatusList()
            }
        } catch (d) {
        }
        return e
    },
    getFinishedRecording: function (f) {
        var e = null;
        try {
            if (f) {
                e = this.player.getRecordingList(f)
            } else {
                e = this.player.getRecordingList()
            }
        } catch (d) {
        }
        return e
    },
    deleteRecording: function (f) {
        var e = false;
        try {
            e = this.player.deleteRecording(f)
        } catch (d) {
        }
        return e
    },
    deleteAllRecordings: function (d) {
        var e = false;
        try {
            e = this.player.deleteAllRecordings(d)
        } catch (f) {
        }
        return e == 0
    },
    lockRecording: function (g, e) {
        var f = false;
        try {
            f = this.player.lockRecording(g, e)
        } catch (h) {
        }
        return f == 0
    },
    getFinishedRecordingsCountByVolume: function (d) {
        var e = [];
        try {
            e = this.player.getNumOfRecordings(d)
        } catch (f) {
        }
        return e
    },
    getVolumeLimit: function (d) {
        var e = false;
        try {
            e = this.player.getVolumeLimit(d)
        } catch (f) {
        }
        return e
    },
    setVolumeLimit: function (e, h) {
        var f = false;
        try {
            f = this.player.setVolumeLimit(e, h)
        } catch (g) {
        }
        return f == 0
    },
    wirelessEventHandler: function (c) {
        var d = "";
        switch (c) {
            case 0:
                d = "WIRELESS_EVENT_WPS_SUCCESS";
                break;
            case 1:
                d = "WIRELESS_EVENT_WPS_IN_PROGRESS";
                break;
            case 2:
                d = "WIRELESS_EVENT_WPS_FAILED";
                break;
            case 3:
                d = "WIRELESS_EVENT_CONNECTION_SUCCESS";
                break;
            case 4:
                d = "WIRELESS_EVENT_CONNECTION_IN_PROGRESS";
                break;
            case 5:
                d = "WIRELESS_EVENT_SEARCHING_IN_PROGRESS";
                break;
            case 6:
                d = "WIRELESS_EVENT_AUTHENTICATING_IN_PROGRESS";
                break;
            case 7:
                d = "WIRELESS_EVENT_CONNECTION_FAILED";
                break;
            case 8:
                d = "WIRELESS_EVENT_DISCONNECTED_SUCCESS";
                break;
            case 9:
                d = "WIRELESS_EVENT_DISCONNECTION_IN_PROGRESS";
                break;
            case 10:
                d = "WIRELESS_EVENT_AP_SCAN_FAILED";
                break;
            case 11:
                d = "WIRELESS_EVENT_AP_SCAN_SUCCESS";
                break;
            case 12:
                d = "WIRELESS_EVENT_AP_SCAN_IN_PROGRESS";
                break;
            default:
                d = "UNKNOWN_PLUGIN_EVENT_" + c;
                break
        }
        globalFireEvent(new Event(d))
    },
    playerEventHandler: function (c) {
        var d = "VIDEO_UNKNOWN_EVENT";
        switch (c) {
            case 1:
            case 2:
            case 3:
            case 4:
            case 8:
            case 9:
            case 10:
                d = "VIDEO_PLAYING_FAILED";
                break;
            case 5:
                d = "VIDEO_PLAYING_SUCCESS";
                break;
            case 7:
                d = "VIDEO_END_OF_STREAM";
                break;
            case 14:
                d = "VIDEO_START_OF_STREAM";
                break;
            case 16:
                d = "IGMP_END_OF_STREAM";
                break;
            case 17:
                d = "IGMP_PLAYING_SUCCESS";
                break;
            case 19:
                d = "UDP_END_OF_STREAM";
                break;
            case 20:
                d = "UDP_STATUS_PLAYING";
                break;
            case 21:
                d = "MP3_END_OF_STREAM";
                break;
            case 22:
                d = "MP3_START_OF_STREAM";
                break;
            case 23:
                d = "FILE_END_OF_STREAM";
                break;
            case 24:
                d = "DVR_RECORD_ERROR";
                break;
            case 25:
                d = "DVR_PLAY_ERROR";
                break;
            case 26:
                d = "DVR_END_OF_STREAM";
                break;
            case 27:
                d = "DVR_START_OF_STREAM";
                break;
            case 6:
            case 11:
            case 12:
            case 13:
            case 15:
            case 18:
                d = "VIDEO_UNKNOWN_EVENT";
                break;
            default:
                d = "VIDEO_UNKNOWN_EVENT_" + c;
                break
        }
        globalFireEvent(new Event(d))
    },
    firmwareEventHandler: function (c) {
        var d = "FIRMWARE_UNKNOWN_EVENT";
        switch (c) {
            case 1000:
                d = "FIRMWARE_EVENT_NEW_FIRMWARE_AVAILABLE";
                break;
            case 1001:
                d = "FIRMWARE_EVENT_FIRMWARE_UP_TO_DATE";
                break;
            case 1002:
                d = "FIRMWARE_EVENT_UPGRADE_CHECK_FAILED";
                break;
            default:
                d = "FIRMWARE_UNKNOWN_EVENT";
                break
        }
        globalFireEvent(new Event(d))
    },
    dvbEventHandler: function (c) {
        var d = "DVB_UNKNOWN_EVENT";
        switch (c) {
            case 2000:
                d = "DVBT_EVENT_SCAN_STARTED";
                break;
            case 2001:
                d = "DVBT_EVENT_SCAN_CONTINUE";
                break;
            case 2002:
                d = "DVBT_EVENT_SCAN_COMPLETED_WITH_CHANNELS";
                break;
            case 2003:
                d = "DVBT_EVENT_SCAN_COMPLETED_WITHOUT_CHANNELS";
                break;
            case 2004:
                d = "DVBT_EVENT_SCAN_ERROR";
                break;
            case 2005:
                d = "DVBT_EVENT_LOW_SIGNAL";
                break;
            case 2006:
                d = "DVBT_EVENT_LOST_SIGNAL";
                break;
            default:
                d = "DVB_UNKNOWN_EVENT";
                break
        }
        globalFireEvent(new Event(d))
    },
    upnpEventHandler: function (c) {
        var d = "UPNP_UNKNOWN_EVENT";
        switch (c) {
            case 1000:
                d = "UPNP_SCAN_IN_PROGRESS";
                break;
            case 1001:
                d = "UPNP_SCAN_SUCCESS_SERVERS_FOUND";
                break;
            case 1002:
                d = "UPNP_SCAN_SUCCESS_NO_SERVERS_FOUND";
                break;
            case 1003:
                d = "UPNP_SCAN_FAILED";
                break
        }
        globalFireEvent(new Event(d))
    },
    pvrEventHandler: function (d, f) {
        var e = "PVR_UNKNOWN_EVENT";
        switch (d) {
            case 2501:
                e = "RECORDING_STOPPED";
                break;
            case 2502:
                e = "RECORDING_ERROR";
                break;
            case 2503:
                e = "LIMIT_SIZE_EXCEEDED";
                break
        }
        globalFireEvent(new Event(e, {
            assetId: f
        }));
    },
    listenerEventHandler: function (b) {
        globalFireEvent(new Event("NOTIFICATION", {
            message: b
        }));
    }
};