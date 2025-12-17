/**
 * chunk
 * @param str
 * @param n
 * @returns {Array}
 */
function chunk(str, n) {
    var ret = [];
    var i;
    var len;
    for (i = 0, len = str.length; i < len; i += n) {
        ret.push(str.substr(i, n))
    }
    return ret
}

/**
 * makeid
 * @param length
 * @returns {string}
 */
function makeid(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() *
            charactersLength));
    }
    //
    var chk = chunk(result, 2).join(':');
    return chk;
}

/**
 * enableMute
 * @param currentElement
 */
function enableMute(currentElement) {
    currentElement.muted = true;
}

/**
 * disableMute
 * @param currentElement
 */
function disableMute(currentElement) {
    currentElement.muted = false;
}

/**
 * Player
 * @type object
 */
var Player = {
    isSTB: true,
    player: {},
    conf: {},
    currentMrl: "",
    mediaType: "",
    currentState: null,
    playerSpeed: [2, 4, 8, 16, 32],
    playerSpeedIndex: 0,
    playerRegion: "",
    playerElement: "",
    currentElement: "",
    isMute: 0,
    volumeNumber: 0,
    init: function () {
        try {
            if (typeof (opera) != "undefined") {
                opera.disableorigincheck(document, true)
            }
            this.setChromaKey(0)
        } catch (a) {
           console.log("Player.init() error :: " + a.message)
        }
    },
    getPlayerHtml: function () {
        return ""
    },
    getPlayerState: function () {
        return this.currentState
    },
    setPlayerState: function (a) {
        this.currentState = a
    },
    localClockInterval: null,
    currentDateTime: null,
    getLocalTime: function () {
        return this.currentDateTime;
    },
    setLocalTime: function (d) {
        try {
            // Assuming the API returns the time in milliseconds since the Unix Epoch
            this.currentDateTime = d;
            // Clear the previous interval before setting a new one
            if (this.localClockInterval) {
                clearInterval(this.localClockInterval);
            }
            // Start the clock interval after initial fetch
            this.localClockInterval = setInterval(() => {
                // Increment currentDateTime by 1 second
                this.currentDateTime.setSeconds(this.currentDateTime.getSeconds() + 1);
            }, 1000); // Update the clock every second (1000 milliseconds)
        } catch (a) {
           console.log("Player.setLocalTime() error :: " + a.message);
        }
    },
    getVolume: function () {
        try {
            return this.volumeNumber
        } catch (a) {
           console.log("getVolume error :: " + a.message);
            return 0
        }
    },
    setVolume: function (b) {
        try {
            b = b > VOLUME_MAX ? VOLUME_MAX : b;
            b = b < VOLUME_MIN ? VOLUME_MIN : b;
            this.volumeNumber = b
        } catch (a) {
           console.log("setVolume error :: " + a.message)
        }
    },
    toggleMute: function () {
        try {
            this.isMute = (this.isMute == 1) ? 0 : 1;
            return this.isMute
        } catch (a) {
           console.log("toggleMute error :: " + a.message)
        }
    },
    keyboardToggle: function () {
        // var b = gSTB.IsVirtualKeyboardActive();
        // b = (b) ? false : true;
        try {
            // gSTB.ShowVirtualKeyboard(b);
        } catch (e) {
           console.log("keyboardToggle :: error : " + e.message);
        }
    },
    getIpAddress: function () {
        try {
            return (typeof configread === "undefined") ? "000.000.000.000" : configread("IPAddress")
        } catch (a) {
           console.log("rtvGetIp error :: " + a.message);
            return "000.000.000.000"
        }
    },
    getMacAddress: function () {
        return "00:00:00:00:00:00";
    },
    getSerialNumber: function () {
        try {
            return (typeof configread === "undefined") ? "00:00:00:00:00:00" : configread("boardNumber")
        } catch (a) {
           console.log("rtvGetSerialNumber error :: " + a.message);
            return "00:00:00:00:00:00"
        }
    },
    getStoredData: function (a) {
        try {
            return this.player.getStorageValue(a)
        } catch (b) {
           console.log("Player.getStoredData() error :: " + b.message)
        }
    },
    setStoredData: function (b, c) {
        try {
            return this.player.setStorageValue(b, c)
        } catch (a) {
           console.log("Player.setStoredData() error :: " + a.message)
        }
    },
    loadUrl: function (a) {
        try {
            this.document.location.href = a
        } catch (b) {
           console.log("Player.loadUrl() error :: " + b.message)
        }
    },
    stop: function () {
        try {
            this.setPlayerState("IDLE");
            this.currentElement.pause();
        } catch (a) {
           console.log("Player.stop() error :: " + a.message)
        }
    },
    play: function (c) {
        var b = null;
        try {
            var $that = this;
            //console.log('play :: $that', $that);

            //var playerHTML = getFrameDocument().getElementById(this.playerRegion + "_" + this.playerElement + "_player").outerHTML;
            //var ele = getFrameDocument().getElementsByClassName(this.playerRegion)[0];
            //ele.innerHTML = "";
            //ele.innerHTML = playerHTML;

            //get video element to load and play
            $that.currentElement = getFrameDocument().getElementById($that.playerRegion + "_" + $that.playerElement + "_player");
            $that.currentElement.load();

            const playPromise = $that.currentElement.play();
            //$that.currentElement.focus();

            //// In browsers that don’t yet support this functionality,
            //// playPromise won’t be defined.
            //if (playPromise !== undefined) {
            //    playPromise.then(function () {
            //        // Automatic playback started!
            //        console.log('playPromise :: then');
            //        //enableMute($that.currentElement);
            //        //disableMute($that.currentElement);
            //    }).catch(function (error) {
            //        // Automatic playback failed.
            //        // Show a UI element to let the user manually start playback.
            //        console.log('playPromise :: error', error);
            //    });
            //}
            //
            this.currentElement.addEventListener("play", function onVideoPlay() {
                console.log('onVideoPlay :: $that.currentElement', $that.currentElement);
                //enableMute($that.currentElement);
                disableMute($that.currentElement);
            }, false);
            //

            this.setPlayerState("PLAYING");
        } catch (a) {
           console.log("Player.play() error :: " + a.message)
        }
    },
    pause: function () {
        try {
            if (this.getPlayerState() === "PAUSED") {
                this.resume()
            } else {
                this.setPlayerState("PAUSED");
                this.player.pause();
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
            this.player.play()
        } catch (a) {
           console.log("Player.resume() error :: " + a.message)
        }
    },
    rewind: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("REWIND");
            this.player.rewind(-1 * b)
        } catch (a) {
           console.log("Player.rewind() error :: " + a.message)
        }
    },
    fforward: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("FFORWARD");
            this.player.fastForward(b)
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
            a = this.player.getPosition()
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
            b = this.player.getStreamDuration()
        } catch (a) {
           console.log("Player.getDuration() error :: " + a.message)
        }
        return b
    },
    setClipScreen: function () {
        //
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
            } catch (a) {
                result = false
            }
        }
    },
    getBrowserResolution: function () {
        d = "720";
        return d
    },
    isWiredConnection: function () {
        var a = false;
        try {
            a = this.player.checkWiredConnection()
        } catch (b) {
            a = false
        }
        return a
    },
    setAlphaLevel: function (b) {
        try {
            this.player.setAlpha(b)
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
            this.player.setChromaKey(a)
        } catch (b) {
        }
    },
    reboot: function () {
        try {
            window.location.reload();
        } catch (e) {
           console.log("Player.reboot() error :: " + e.message);
        }
    },
    printDebugMessage: function (b) {
        try {
            this.player.debugMsg(b, 3)
        } catch (a) {
        }
    },
    getChannelChangeTime: function () {
        var a = 0;
        try {
            a = this.player.getChannelChangeTime()
        } catch (b) {
        }
        return a
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
        var a = null;
        try {
            a = this.player.getAudioID()
        } catch (b) {
        }
        return a
    },
    setCurrentAudio: function (b) {
        try {
            this.player.setAudioID(b)
        } catch (a) {
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
        var a = null;
        try {
            a = this.player.getSubtitleID()
        } catch (b) {
        }
        return a
    },
    setCurrentSubtitle: function (b) {
        try {
            if (b != "off") {
                this.player.setSubtitleID(b)
            } else {
                this.removeSubtitles()
            }
        } catch (a) {
        }
    },
    removeSubtitles: function () {
        try {
            this.player.removeSubtitles()
        } catch (a) {
        }
    },
    getSoftwareVersion: function () {
        var a = "0000";
        try {
            a = this.player.getSoftwareVersion()
        } catch (b) {
        }
        return a
    },
    setUpgradeParameters: function (a, i) {
        var c = false;
        try {
            c = this.player.setUpgradeParameters(parseInt(a), i)
        } catch (b) {
           console.log("Player.upgrade setUpgradeParameters :: " + b.message)
        }
        return c
    },
    upgrade: function () {
        var a = false;
        try {
            a = this.player.upgrade()
        } catch (b) {
           console.log("Player.upgrade error :: " + b.message)
        }
        return a
    },
    addSubtitleURL: function (i, b) {
        var c = false;
        try {
            c = this.player.addSubtitleURL(i, b)
        } catch (a) {
            c = 0
        }
        return c
    },
    setSubtitleURL: function (a) {
        var b = false;
        try {
            b = this.player.setSubtitleURL(a)
        } catch (c) {
            b = 0
        }
        return b
    },
    upnpInit: function () {
        var a = false;
        try {
            a = this.player.UPnPInit()
        } catch (b) {
            a = 0
        }
        return a
    },
    upnpUninit: function () {
        var a = false;
        try {
            a = this.player.UPnPUninit()
        } catch (b) {
            a = 0
        }
        return a
    },
    upnpScanDevices: function () {
        var a = false;
        try {
            a = this.player.UPnPScanDevices()
        } catch (b) {
        }
        return a
    },
    upnpGetDevicesList: function () {
        var a = null;
        try {
            a = this.player.UPnPGetDevices()
        } catch (b) {
        }
        return a
    },
    upnpBrowseDevice: function (i, b) {
        var c = null;
        try {
            c = this.player.UPnPBrowseDevice(i, b)
        } catch (a) {
        }
        return c
    },
    upnpGetMetadata: function (a, i) {
        var c = null;
        try {
            c = this.player.UPnPGetMetadata(a, i)
        } catch (b) {
        }
        return c
    },
    browseLocalDevice: function (a) {
        var b = null;
        try {
            b = this.player.browseLocalDevice(a)
        } catch (c) {
        }
        return b
    },
    startAutoScan: function () {
        var a = false;
        try {
            a = this.player.startScan(DVB_AUTO_SCAN_START_FREQUENCY, DVB_AUTO_SCAN_END_FREQUENCY, DVB_AUTO_SCAN_BANDWIDTH)
        } catch (b) {
        }
        return a
    },
    startManualScan: function () {
        var a = false;
        try {
            a = this.player.manualScan(DVB_MANUAL_SCAN_FREQUENCY, DVB_MANUAL_SCAN_BANDWIDTH)
        } catch (b) {
        }
        return a
    },
    stopScan: function () {
        var a = false;
        try {
            a = this.player.stopScan()
        } catch (b) {
        }
        return a
    },
    getSignalQuality: function () {
        var a = null;
        try {
            a = this.player.getSignalQuality()
        } catch (b) {
        }
        return a
    },
    getScanFrequency: function () {
        var a = null;
        try {
            a = this.player.getScanFrequency()
        } catch (b) {
        }
        return a
    },
    getScanProgress: function () {
        var a = null;
        try {
            a = this.player.getScanProgress()
        } catch (b) {
        }
        return a
    },
    isChannelsStored: function () {
        var a = false;
        try {
            a = this.player.isChannelsStored();
        } catch (b) {
        }
        return a
    },
    storeScannedChannels: function () {
        var a = null;
        try {
            a = this.player.storeScannedChannels()
        } catch (b) {
        }
        return a
    },
    getStoredChannels: function () {
        var a = null;
        try {
            a = this.player.readStoredChannels()
        } catch (b) {
        }
        return a
    },
    deleteStoredChannels: function () {
        var a = false;
        try {
            a = this.player.deleteSavedChannels()
        } catch (b) {
        }
        return a
    },
    getPresentEvent: function (c) {
        var b = false;
        try {
            b = this.player.getPresentEvent(c)
        } catch (a) {
        }
        return b
    },
    getNextEvent: function (c) {
        var b = false;
        try {
            b = this.player.getNextEvent(c)
        } catch (a) {
        }
        return b
    },
    getAllScheduleEvents: function (c) {
        var b = false;
        try {
            b = this.player.getAllScheduleEvents(c)
        } catch (a) {
        }
        return b
    },
    wirelessInit: function () {
        var a = false;
        try {
            a = this.player.initWireless()
        } catch (b) {
            a = 0
        }
        return a
    },
    wirelessActivateListener: function () {
        var a = false;
        try {
            a = this.player.onWirelessEvent(this.wirelessEventHandler)
        } catch (b) {
            a = false
        }
        return a
    },
    wirelessUninit: function () {
        var a = false;
        try {
            a = this.player.uninitWireless()
        } catch (b) {
            a = false
        }
        return a
    },
    wirelessIsConfigExists: function () {
        var a = false;
        try {
            a = this.player.checkWirelessConfig()
        } catch (b) {
            a = 1
        }
        return a
    },
    wirelessResetExistingConfig: function () {
        var a = false;
        try {
            a = this.player.resetWirelessConfig()
        } catch (b) {
            a = false
        }
        return a
    },
    wirelessGetStatus: function () {
        var a = false;
        try {
            a = this.player.getWirelessStatus()
        } catch (b) {
            a = false
        }
        return a
    },
    wirelessReconnect: function () {
        var a = false;
        try {
            a = this.player.reconnectWireless()
        } catch (b) {
            a = false
        }
        return a
    },
    wirelessDisconnect: function () {
        var a = false;
        try {
            a = this.player.disconnectWireless()
        } catch (b) {
            a = false
        }
        return a
    },
    wirelessInitWPS: function () {
        var a = false;
        try {
            a = this.player.initWPS()
        } catch (b) {
            a = false
        }
        return a
    },
    wirelessConnectWPS: function () {
        var a = false;
        try {
            a = this.player.connectWirelessWPS()
        } catch (b) {
            a = false
        }
        return a
    },
    wirelessScan: function () {
        var a = false;
        try {
            a = this.player.scanWirelessAP()
        } catch (b) {
        }
        return a
    },
    wirelessGetNetworkList: function (c) {
        var b = false;
        try {
            b = this.player.getWirelessAPList(c || 0)
        } catch (a) {
            b = "test"
        }
        return b
    },
    wirelessGetSecurityTypeByName: function (a) {
        var b = null;
        switch (a.toUpperCase()) {
            case "NONE":
                b = 0;
                break;
            case "WEP64":
                b = 1;
                break;
            case "WEP128":
                b = 2;
                break;
            case "WPA":
                b = 5;
                break;
            case "WPA2":
                b = 6;
                break
        }
        return b
    },
    wirelessManualConnect: function (c, b, k) {
        var f = false;
        try {
            f = this.player.connectWirelessManual(c, b, k)
        } catch (a) {
        }
        return f
    },
    startPltv: function () {
        var a = false;
        try {
            a = this.player.pltvRecord(true, PLTV_BUFFER_SIZE)
        } catch (b) {
        }
        return a
    },
    stopPltv: function () {
        var a = false;
        try {
            a = this.player.pltvRecord(false)
        } catch (b) {
        }
        return a
    },
    startRecording: function (h, o, c, f, b) {
        var g = false;
        try {
            g = this.player.record(h, o, c, f, b);
            if (g == 0) {
                this.setPlayerState("RECORD")
            }
        } catch (a) {
        }
        return g
    },
    stopRecording: function (a) {
        var b = false;
        try {
            b = this.player.stopRecording(a);
            if (b == 0) {
                this.setPlayerState("IDLE")
            }
        } catch (c) {
        }
        return b
    },
    getRecordVolumesList: function () {
        var a = [];
        try {
            a = this.player.getRecordingVolumeList();
        } catch (b) {
        }
        return a
    },
    getOngoingRecording: function (a) {
        var b = null;
        try {
            if (a) {
                b = this.player.getRecordingStatusList(a)
            } else {
                b = this.player.getRecordingStatusList()
            }
        } catch (c) {
        }
        return b
    },
    getFinishedRecording: function (a) {
        var b = null;
        try {
            if (a) {
                b = this.player.getRecordingList(a)
            } else {
                b = this.player.getRecordingList()
            }
        } catch (c) {
        }
        return b
    },
    deleteRecording: function (a) {
        var b = false;
        try {
            b = this.player.deleteRecording(a)
        } catch (c) {
        }
        return b
    },
    deleteAllRecordings: function (c) {
        var b = false;
        try {
            b = this.player.deleteAllRecordings(c)
        } catch (a) {
        }
        return b == 0
    },
    lockRecording: function (b, i) {
        var c = false;
        try {
            c = this.player.lockRecording(b, i)
        } catch (a) {
        }
        return c == 0
    },
    getFinishedRecordingsCountByVolume: function (c) {
        var b = [];
        try {
            b = this.player.getNumOfRecordings(c)
        } catch (a) {
        }
        return b
    },
    getVolumeLimit: function (c) {
        var b = false;
        try {
            b = this.player.getVolumeLimit(c)
        } catch (a) {
        }
        return b
    },
    setVolumeLimit: function (i, a) {
        var c = false;
        try {
            c = this.player.setVolumeLimit(i, a)
        } catch (b) {
        }
        return c == 0
    },
    wirelessEventHandler: function (b) {
        var a = "";
        switch (b) {
            case 0:
                a = "WIRELESS_EVENT_WPS_SUCCESS";
                break;
            case 1:
                a = "WIRELESS_EVENT_WPS_IN_PROGRESS";
                break;
            case 2:
                a = "WIRELESS_EVENT_WPS_FAILED";
                break;
            case 3:
                a = "WIRELESS_EVENT_CONNECTION_SUCCESS";
                break;
            case 4:
                a = "WIRELESS_EVENT_CONNECTION_IN_PROGRESS";
                break;
            case 5:
                a = "WIRELESS_EVENT_SEARCHING_IN_PROGRESS";
                break;
            case 6:
                a = "WIRELESS_EVENT_AUTHENTICATING_IN_PROGRESS";
                break;
            case 7:
                a = "WIRELESS_EVENT_CONNECTION_FAILED";
                break;
            case 8:
                a = "WIRELESS_EVENT_DISCONNECTED_SUCCESS";
                break;
            case 9:
                a = "WIRELESS_EVENT_DISCONNECTION_IN_PROGRESS";
                break;
            case 10:
                a = "WIRELESS_EVENT_AP_SCAN_FAILED";
                break;
            case 11:
                a = "WIRELESS_EVENT_AP_SCAN_SUCCESS";
                break;
            case 12:
                a = "WIRELESS_EVENT_AP_SCAN_IN_PROGRESS";
                break;
            default:
                a = "UNKNOWN_PLUGIN_EVENT_" + b;
                break
        }
        globalFireEvent(new Event(a))
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
    }
};