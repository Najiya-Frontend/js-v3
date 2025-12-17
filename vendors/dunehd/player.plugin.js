var Player = {
    isSTB: true,
    alphaLevels: [191, 223, 255],
    currentAlpha: 0,
    player: document.getElementById("duneapi"),
    currentMrl: "",
    mediaType: "",
    isMute: 0,
    currentState: null,
    playerSpeed: [256, 512, 1024, 2048, 4096, 8192],
    playerSpeedIndex: 0,
    init: function() {},
    createStbPlugin: function() {
        try {
            var b = document.getElementsByTagName("body")[0];
            var a = document.createElement("div");
            a.innerHTML = '<object type="application/x-dune-stb-api" style="visibility: hidden; width: 0px; height: 0px;"></object>';
            b.appendChild(a);
            return a.getElementsByTagName("object")[0]
        } catch (c) {
            return undefined
        }
    },
    getPlayerHtml: function() {
        return ""
    },
    getPlayerState: function() {
        return this.currentState
    },
    setPlayerState: function(b) {
        this.currentState = b
    },
    getVolume: function() {
        try {
            return this.player.getVolume()
        } catch (b) {
           console.log("getVolume error :: " + b.message);
            return 0
        }
    },
    powerToggle: function() {
        v = this.player.getStandbyMode();
        if (v == STANDBY_MODE_OFF) {
            this.player.setStandbyMode(STANDBY_MODE_ON)
        } else {
            this.player.setStandbyMode(STANDBY_MODE_OFF)
        }
    },
    setVideoMode: function(a) {
        try {
            this.player.setVideoMode(a)
        } catch (b) {
            alert(b.message)
        }
    },
    setVolume: function(c) {
        try {
            c = (c > VOLUME_MAX) ? VOLUME_MAX : c;
            c = (c < VOLUME_MIN) ? VOLUME_MIN : c;
            this.player.setVolume(c);
        } catch (d) {
           console.log("setVolume error :: " + d.message)
        }
    },
    toggleMute: function() {
        try {
            if (this.isMute == 1) {
                this.player.disableMute();
                this.isMute = 0
            } else {
                this.player.enableMute();
                this.isMute = 1
            }
            return this.isMute
        } catch (b) {
           console.log("toggleMute error :: " + b.message)
        }
    },
    getIpAddress: function() {
        try {
            return (typeof configread === "undefined") ? "000.000.000.000" : configread("IPAddress");
        } catch (b) {
           console.log("rtvGetIp error :: " + b.message);
            return "000.000.000.000";
        }
    },
    getMacAddress: function() {
        try {
            var b = this.player.getMacAddress();
            b = b.replaceAll(":", "");
            return b.trim();
        } catch (c) {
           console.log("rtvGetMacAddress error :: " + c.message);
            return "00:00:00:00:00:00";
        }
    },
    getSerialNumber: function() {
        try {
            return this.player.getSerialNumber();
        } catch (b) {
           console.log("rtvGetSerialNumber error :: " + b.message);
            return "00:00:00:00:00:00";
        }
    },
    getStoredData: function(d) {
        try {
            return this.player.getStorageValue(d)
        } catch (c) {
           console.log("Player.getStoredData() error :: " + c.message)
        }
    },
    setStoredData: function(d, f) {
        try {
            return this.player.setStorageValue(d, f)
        } catch (e) {
           console.log("Player.setStoredData() error :: " + e.message)
        }
    },
    loadUrl: function(d) {
        try {
            this.player.play(d)
        } catch (c) {
           console.log("Player.loadUrl() error :: " + c.message)
        }
    },
    stop: function() {
        try {
            this.setPlayerState("IDLE");
            this.player.stop();
            this.currentMrl = "";
            this.playerSpeedIndex = 0
        } catch (b) {
           console.log("Player.stop() error :: " + b.message)
        }
    },
    play: function(f) {
        var d = null;
        this.playerSpeedIndex = 0;
        this.player.setSpeed(this.playerSpeed[this.playerSpeedIndex]);
        try {
            if (f != this.currentMrl) {
                this.setPlayerState("PLAYING");
                d = this.player.play(f);
                if (d == 0) {
                    this.currentMrl = f;
                    this.setPlayerState("PLAYING")
                } else {
                    this.currentMrl = ""
                }
            }
        } catch (e) {
           console.log("Player.play() error :: " + e.message)
        }
    },
    restart: function() {
        this.player.reboot()
    },
    pause: function() {
        try {
            if (this.getPlayerState() === "PAUSED") {
                this.resume()
            } else {
                this.setPlayerState("PAUSED");
                this.player.pause();
                this.playerSpeedIndex = 0
            }
        } catch (b) {
           console.log("Player.pause() error :: " + b.message)
        }
    },
    resume: function() {
        try {
            if (this.getPlayerState() === "PLAYING") {
                this.setPlayerState("PAUSED");
                this.player.pause();
                this.playerSpeedIndex = 0
            } else {
                this.setPlayerState("PLAYING");
                this.playerSpeedIndex = 0;
                this.player.setSpeed(this.playerSpeed[this.playerSpeedIndex]);
                this.player.play()
            }
        } catch (b) {
           console.log("Player.resume() error :: " + b.message)
        }
    },
    rewind: function(f) {
        try {
            var d = f || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("REWIND");
            this.player.setSpeed(-1 * d);
        } catch (e) {
           console.log("Player.rewind() error :: " + e.message)
        }
    },
    fforward: function(f) {
        try {
            this.playerSpeedIndex = (this.playerSpeedIndex == 0) ? 1 : this.playerSpeedIndex++;
            var d = f || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("FFORWARD");
            this.player.setSpeed(d);
            this.playerStatus()
        } catch (e) {
           console.log("Player.fforward() error :: " + e.message)
        }
    },
    seekPDL: function(d) {
        try {
            this.player.seekPDL(d)
        } catch (c) {
           console.log("Player.seekPDL() error :: " + c.message)
        }
    },
    getPosition: function() {
        var d = 0;
        try {
            d = this.player.getPosition()
        } catch (c) {
           console.log("Player.getPosition() error :: " + c.message)
        }
        return d
    },
    setPosition: function(d) {
        try {
            this.player.setPosition(d)
        } catch (c) {
           console.log("Player.setPosition() error :: " + c.message)
        }
    },
    getDuration: function() {
        var c = 0;
        try {
            c = this.player.getStreamDuration()
        } catch (d) {
           console.log("Player.getDuration() error :: " + d.message)
        }
        return c
    },
    setClipScreen: function() {
        if (this.player) {
            try {
                if (DEFAULT_DIRECTION == "rtl") {
                    l = globalGetScreenWidthByResolution() - (CLIP_W + CLIP_X);
                    this.player.setWindowRect(l, CLIP_Y, CLIP_W, CLIP_H)
                } else {
                    this.player.setWindowRect(CLIP_X, CLIP_Y, CLIP_W, CLIP_H)
                }
                this.setAlphaLevel(TRANSPARENCY_LEVEL)
            } catch (a) {
               console.log("Player.setClipScreen() error :: " + a.message);
                result = false
            }
        }
    },
    setFullScreen: function() {
        if (this.player) {
            try {
                if (!this.player.isWindowFullScreen()) {
                    this.player.enableWindowFullScreen();
                    this.player.setAspectRatio(DUNE_ASPECT_RATIO);
                    this.setAlphaLevel(0)
                }
            } catch (b) {
               console.log("Player.setFullScreen() error :: " + b.message);
                result = false
            }
        }
    },
    getBrowserResolution: function() {
        /* var d = "";
         var c = (typeof configread === "undefined") ? "720p60" : configread("screenResolution");
         switch (c) {
             case"720p60":
             case"720p50":
                 d = "720P";
                 break;
             case"1080p60":
             case"1080p50":
             case"1080i60":
             case"1080i50":
                 d = "1080I";
                 break
         }*/
        var d = screen.height + ""
        return d
    },
    isWiredConnection: function() {
        var d = false;
        try {
            d = this.player.checkWiredConnection()
        } catch (c) {
            d = false
        }
        return d
    },
    setAlphaLevel: function(c) {
        try {
            this.player.setBrowserAlphaLevel(c)
        } catch (d) {}
    },
    getAlphaLevel: function() {
        try {
            return this.player.getBrowserAlphaLevel()
        } catch (b) {}
    },
    handleAlpha: function() {
        try {
            this.player.enableWindowFullScreen();
            this.currentAlpha++;
            if (this.currentAlpha >= this.alphaLevels.length) {
                this.currentAlpha = 0
            }
            this.setAlphaLevel(this.alphaLevels[this.currentAlpha]);
        } catch (a) {
           console.log(a.mesage)
        }
    },
    setOutputResolution: function(d) {
        try {
            this.player.setOutputResolution(2, level)
        } catch (c) {}
    },
    setChromaKey: function(d) {
        try {
            this.player.setChromaKey(d)
        } catch (c) {}
    },
    reboot: function() {
        try {
            this.player.reboot()
        } catch (b) {}
    },
    printDebugMessage: function(c) {
        try {
            this.player.debugMsg(c, 3)
        } catch (d) {}
    },
    getChannelChangeTime: function() {
        var d = 0;
        try {
            d = this.player.getChannelChangeTime()
        } catch (c) {}
        return d
    },
    getAudioList: function() {
        var a = [];
        try {
            a = eval(this.player.getAudioIDList())
        } catch (b) {}
        return a
    },
    getCurrentAudio: function() {
        var d = null;
        try {
            d = this.player.getAudioID()
        } catch (c) {}
        return d
    },
    setCurrentAudio: function(c) {
        try {
            this.player.setAudioID(c)
        } catch (d) {}
    },
    getSubtitleList: function() {
        var a = [];
        try {
            a = eval(this.player.getSubtitleIDList())
        } catch (b) {}
        return a
    },
    getCurrentSubtitle: function() {
        var d = null;
        try {
            d = this.player.getSubtitleID()
        } catch (c) {}
        return d
    },
    setCurrentSubtitle: function(c) {
        try {
            if (c != "off") {
                this.player.setSubtitleID(c)
            } else {
                this.removeSubtitles()
            }
        } catch (d) {}
    },
    removeSubtitles: function() {
        try {
            this.player.removeSubtitles()
        } catch (b) {}
    },
    getSoftwareVersion: function() {
        var d = "0000";
        try {
            d = this.player.getSoftwareVersion()
        } catch (c) {}
        return d
    },
    setUpgradeParameters: function(f, g) {
        var h = false;
        try {
            h = this.player.setUpgradeParameters(parseInt(f), g)
        } catch (e) {
           console.log("Player.upgrade setUpgradeParameters :: " + e.message)
        }
        return h
    },
    upgrade: function() {
        var d = false;
        try {
            d = this.player.upgrade()
        } catch (c) {
           console.log("Player.upgrade error :: " + c.message)
        }
        return d
    },
    addSubtitleURL: function(g, e) {
        var h = false;
        try {
            h = this.player.addSubtitleURL(g, e)
        } catch (f) {
            h = 0
        }
        return h
    },
    setSubtitleURL: function(e) {
        var d = false;
        try {
            d = this.player.setSubtitleURL(e)
        } catch (f) {
            d = 0
        }
        return d
    },
    upnpInit: function() {
        var d = false;
        try {
            d = this.player.UPnPInit()
        } catch (c) {
            d = 0
        }
        return d
    },
    upnpUninit: function() {
        var d = false;
        try {
            d = this.player.UPnPUninit()
        } catch (c) {
            d = 0
        }
        return d
    },
    upnpScanDevices: function() {
        var d = false;
        try {
            d = this.player.UPnPScanDevices()
        } catch (c) {}
        return d
    },
    upnpGetDevicesList: function() {
        var d = null;
        try {
            d = this.player.UPnPGetDevices()
        } catch (c) {}
        return d
    },
    upnpBrowseDevice: function(g, e) {
        var h = null;
        try {
            h = this.player.UPnPBrowseDevice(g, e)
        } catch (f) {}
        return h
    },
    upnpGetMetadata: function(f, g) {
        var h = null;
        try {
            h = this.player.UPnPGetMetadata(f, g)
        } catch (e) {}
        return h
    },
    browseLocalDevice: function(e) {
        var d = null;
        try {
            d = this.player.browseLocalDevice(e)
        } catch (f) {}
        return d
    },
    startAutoScan: function() {
        var d = false;
        try {
            d = this.player.startScan(DVB_AUTO_SCAN_START_FREQUENCY, DVB_AUTO_SCAN_END_FREQUENCY, DVB_AUTO_SCAN_BANDWIDTH)
        } catch (c) {}
        return d
    },
    startManualScan: function() {
        var d = false;
        try {
            d = this.player.manualScan(DVB_MANUAL_SCAN_FREQUENCY, DVB_MANUAL_SCAN_BANDWIDTH)
        } catch (c) {}
        return d
    },
    stopScan: function() {
        var d = false;
        try {
            d = this.player.stopScan()
        } catch (c) {}
        return d
    },
    getSignalQuality: function() {
        var d = null;
        try {
            d = this.player.getSignalQuality()
        } catch (c) {}
        return d
    },
    getScanFrequency: function() {
        var d = null;
        try {
            d = this.player.getScanFrequency()
        } catch (c) {}
        return d
    },
    getScanProgress: function() {
        var d = null;
        try {
            d = this.player.getScanProgress()
        } catch (c) {}
        return d
    },
    isChannelsStored: function() {
        var d = false;
        try {
            d = this.player.isChannelsStored();
        } catch (c) {}
        return d
    },
    storeScannedChannels: function() {
        var d = null;
        try {
            d = this.player.storeScannedChannels()
        } catch (c) {}
        return d
    },
    getStoredChannels: function() {
        var d = null;
        try {
            d = this.player.readStoredChannels()
        } catch (c) {}
        return d
    },
    deleteStoredChannels: function() {
        var d = false;
        try {
            d = this.player.deleteSavedChannels()
        } catch (c) {}
        return d
    },
    getPresentEvent: function(f) {
        var d = false;
        try {
            d = this.player.getPresentEvent(f)
        } catch (e) {}
        return d
    },
    getNextEvent: function(f) {
        var d = false;
        try {
            d = this.player.getNextEvent(f)
        } catch (e) {}
        return d
    },
    getAllScheduleEvents: function(f) {
        var d = false;
        try {
            d = this.player.getAllScheduleEvents(f)
        } catch (e) {}
        return d
    },
    wirelessInit: function() {
        var d = false;
        try {
            d = this.player.initWireless()
        } catch (c) {
            d = 0
        }
        return d
    },
    wirelessActivateListener: function() {
        var d = false;
        try {
            d = this.player.onWirelessEvent(this.wirelessEventHandler)
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessUninit: function() {
        var d = false;
        try {
            d = this.player.uninitWireless()
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessIsConfigExists: function() {
        var d = false;
        try {
            d = this.player.checkWirelessConfig()
        } catch (c) {
            d = 1
        }
        return d
    },
    wirelessResetExistingConfig: function() {
        var d = false;
        try {
            d = this.player.resetWirelessConfig()
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessGetStatus: function() {
        var d = false;
        try {
            d = this.player.getWirelessStatus()
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessReconnect: function() {
        var d = false;
        try {
            d = this.player.reconnectWireless()
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessDisconnect: function() {
        var d = false;
        try {
            d = this.player.disconnectWireless()
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessInitWPS: function() {
        var d = false;
        try {
            d = this.player.initWPS()
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessConnectWPS: function() {
        var d = false;
        try {
            d = this.player.connectWirelessWPS()
        } catch (c) {
            d = false
        }
        return d
    },
    wirelessScan: function() {
        var d = false;
        try {
            d = this.player.scanWirelessAP()
        } catch (c) {}
        return d
    },
    wirelessGetNetworkList: function(f) {
        var d = false;
        try {
            d = this.player.getWirelessAPList(f || 0)
        } catch (e) {
            d = "test"
        }
        return d
    },
    wirelessGetSecurityTypeByName: function(d) {
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
    wirelessManualConnect: function(j, e, h) {
        var i = false;
        try {
            i = this.player.connectWirelessManual(j, e, h)
        } catch (g) {}
        return i
    },
    startPltv: function() {
        var d = false;
        try {
            d = this.player.pltvRecord(true, PLTV_BUFFER_SIZE)
        } catch (c) {}
        return d
    },
    stopPltv: function() {
        var d = false;
        try {
            d = this.player.pltvRecord(false)
        } catch (c) {}
        return d
    },
    startRecording: function(m, k, e, o, i) {
        var n = false;
        try {
            n = this.player.record(m, k, e, o, i);
           console.log("Player.startRec() :: " + k + ", " + e + ", result : " + n);
            if (n == 0) {
                this.setPlayerState("RECORD")
            }
        } catch (j) {}
        return n
    },
    stopRecording: function(e) {
        var d = false;
        try {
            d = this.player.stopRecording(e);
           console.log("Player.stoptRecording() :: " + e + ", result : " + d);
            if (d == 0) {
                this.setPlayerState("IDLE")
            }
        } catch (f) {}
        return d
    },
    getRecordVolumesList: function() {
        var d = [];
        try {
            d = this.player.getRecordingVolumeList();
           console.log("Player.getRecordVolumesList() :: " + d)
        } catch (c) {}
        return d
    },
    getOngoingRecording: function(e) {
        var d = null;
        try {
            if (e) {
                d = this.player.getRecordingStatusList(e)
            } else {
                d = this.player.getRecordingStatusList()
            }
           console.log("Player.getOngoingRecording() :: " + d)
        } catch (f) {}
        return d
    },
    getFinishedRecording: function(e) {
        var d = null;
        try {
            if (e) {
                d = this.player.getRecordingList(e)
            } else {
                d = this.player.getRecordingList()
            }
        } catch (f) {}
        return d
    },
    deleteRecording: function(e) {
        var d = false;
        try {
            d = this.player.deleteRecording(e)
        } catch (f) {}
        return d
    },
    deleteAllRecordings: function(f) {
        var d = false;
        try {
            d = this.player.deleteAllRecordings(f)
        } catch (e) {}
        return d == 0
    },
    lockRecording: function(e, g) {
        var h = false;
        try {
            h = this.player.lockRecording(e, g)
        } catch (f) {}
        return h == 0
    },
    getFinishedRecordingsCountByVolume: function(f) {
        var d = [];
        try {
            d = this.player.getNumOfRecordings(f)
        } catch (e) {}
        return d
    },
    getVolumeLimit: function(f) {
        var d = false;
        try {
            d = this.player.getVolumeLimit(f)
        } catch (e) {}
        return d
    },
    setVolumeLimit: function(g, f) {
        var h = false;
        try {
            h = this.player.setVolumeLimit(g, f)
        } catch (e) {}
        return h == 0
    },
    wirelessEventHandler: function(c) {
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
    playerEventHandler: function(c) {
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
    firmwareEventHandler: function(c) {
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
    dvbEventHandler: function(c) {
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
    upnpEventHandler: function(c) {
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
    pvrEventHandler: function(f, e) {
        var d = "PVR_UNKNOWN_EVENT";
        switch (f) {
            case 2501:
                d = "RECORDING_STOPPED";
                break;
            case 2502:
                d = "RECORDING_ERROR";
                break;
            case 2503:
                d = "LIMIT_SIZE_EXCEEDED";
                break
        }
        globalFireEvent(new Event(d, {
            assetId: e
        }))
    },
    playerStatus: function() {
        try {
            var b = this.player.getPlaybackState();
            s = "Dont Know";
            if (b == this.player.PLAYBACK_STATE_STOPPED) {
                s = "PLAYBACK_STATE_STOPPED"
            } else {
                if (b == this.player.PLAYBACK_STATE_INITIALIZING) {
                    s = "PLAYBACK_STATE_INITIALIZING"
                } else {
                    if (b == this.player.PLAYBACK_STATE_PLAYING) {
                        s = "PLAYBACK_STATE_PLAYING"
                    } else {
                        if (b == this.player.PLAYBACK_STATE_PAUSED) {
                            s = "PLAYBACK_STATE_PAUSED"
                        } else {
                            if (b == this.player.PLAYBACK_STATE_SEEKING) {
                                s = "PLAYBACK_STATE_SEEKING"
                            } else {
                                if (b == this.player.PLAYBACK_STATE_BUFFERING) {
                                    s = "PLAYBACK_STATE_BUFFERING"
                                } else {
                                    if (b == this.player.PLAYBACK_STATE_FINISHED) {
                                        s = "PLAYBACK_STATE_FINISHED"
                                    } else {
                                        if (b == this.player.PLAYBACK_STATE_DEINITIALIZING) {
                                            s = "PLAYBACK_STATE_DEINITIALIZING"
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
           console.log("Player Status is : " + s)
        } catch (a) {
           console.log(a.message)
        }
    },
    listenerEventHandler: function(b) {
        globalFireEvent(new Event("NOTIFICATION", {
            message: b
        }))
    }
};