var stbEvent = {
    onEvent: function (data) {
    },
    event: 0
};

var Player = {
    isSTB: true,
    currentMrl: "",
    currentState: null,
    playerSpeed: [2, 4, 6, 8, 16, 32],
    playerSpeedIndex: 0,
    isMute: 0,
    winMode: 0, //0 - Graphic, 1 - Video
    init: function () {
        try {
            gSTB.InitPlayer();
            gSTB.SetWakeUpSources([6]);
            gSTB.StandByMode = 1;
            gSTB.SetVolume(top.CURRENT_VOLUME);
            gSTB.SetBufferSize(4000, 2000000);
            stbEvent.onEvent = (function (self) {
                return function () {
                    this.firmwareEventHandler(self, arguments);
                }
            })(this);
            if (top.IS_DEPLOY) {
                gSTB.EnableServiceButton(false);
                gSTB.EnableVKButton(false);
            }
            //top.kwConsole.print("Player.init() done");
        } catch (a) {
            //top.kwConsole.print("Player.init() error :: " + a.message);
        }
    },
    getPlayerHtml: function () {
        return "";
    },
    getPlayerState: function () {
        return this.currentState;
    },
    setPlayerState: function (a) {
        //top.kwConsole.print("Player.setPlayerState() " + a);
        this.currentState = a;
    },
    localClockInterval: null,
    currentDateTime: null,
    getLocalTime: function () {
        return this.currentDateTime;
    },
    setLocalTime: function (d) {
        try {
            // Set the currentDateTime to the provided time 'd'
            this.currentDateTime = new Date(d);
            // Clear the previous interval before setting a new one
            if (this.localClockInterval) {
                clearInterval(this.localClockInterval);
            }
            // Start the clock interval after initial fetch
            this.localClockInterval = setInterval(function () {
                // Increment currentDateTime by 1 second
                this.currentDateTime.setSeconds(this.currentDateTime.getSeconds() + 1);
            }.bind(this), 1000); // Update the clock every second (1000 milliseconds)
        } catch (error) {
            // Handle any errors during setting the local time
            console.error("ClockManager.setLocalTime error:", error);
        }
    },
    getVolume: function () {
        try {
            //top.kwConsole.print("Current Volume is:" + gSTB.GetVolume());
            return gSTB.GetVolume();
        } catch (a) {
            //top.kwConsole.print("getVolume error :: " + a.message);
            return 0;
        }
    },
    powerToggle: function () {

        //if (top.MessageManager.msgIsInfobarHidden == false) {
        //    top.MessageManager.messageShow(0);
        //    top.MessageManager.setMessageRead(top.CURRENT_MESSAGE_ID);
        //    top.CURRENT_MESSAGE_ID = null;
        //}

        var status = gSTB.GetStandByStatus();
        var tvStatus = gSTB.GetHDMIConnectionState();
        //top.kwConsole.print("GetStandByStatus :" + status);
        //top.kwConsole.print("GetHDMIConnectionState :" + tvStatus);
        if ((tvStatus == 0) && (status == true) && (top.STANDBY_HOLD == false)) {
            //HDMI connected to TV, but not in active state e.i. standby mode, TV is off
            //top.kwConsole.print("(tvStatus == 0) && (status == true) && (top.STANDBY_HOLD == false)");
            gSTB.StandBy(false);
            top.STANDBY_HOLD = true;

            //Init Live Channel
            //if (top.LIVE_CHANNEL != null) {
            //    top.ChannelManager.setCurrentChannel(top.LIVE_CHANNEL);
            //    top.ScreenManager.deleteHistory();
            //    top.globalChannelApproved = false;
            //    top.ScreenManager.load("FSV");
            //} else {
            //    if (top.MessageManager.msgIsInfobarHidden == true) {
            //        top.ScreenManager.load("MENU");
            //    }
            //}

            //
            top.ScreenManager.load("MENU");
            //
            setTimeout(function () {
                top.STANDBY_HOLD = false;
            }, 10000);

        } else if ((tvStatus == 2) && (status == false) && (top.STANDBY_HOLD == false)) {
            //top.kwConsole.print("(tvStatus == 2) && (status == false) && (top.STANDBY_HOLD == false)");
            gSTB.StandBy(true);
            top.STANDBY_HOLD = true;

            //if (top.SCREEN_MODE == 1) {
            //    var udpChannel = top.ChannelManager.getCurrentChannel();
            //    top.LIVE_CHANNEL = udpChannel;
            //}
            //else if (top.SCREEN_MODE == 0 && gSTB.IsPlaying() == true) {
            //    var udpChannel = top.ChannelManager.getCurrentChannel();
            //    top.LIVE_CHANNEL = udpChannel;
            //} else {
            //    top.LIVE_CHANNEL = null;
            //}

            //
            top.ScreenManager.load("MENU");
            //
            setTimeout(function () {
                top.STANDBY_HOLD = false;
            }, 15000);
        }
    },
    setVolume: function (b) {
        try {
            b = b > top.VOLUME_MAX ? top.VOLUME_MAX : b;
            b = b < top.VOLUME_MIN ? top.VOLUME_MIN : b;
            gSTB.SetVolume(b);
        } catch (a) {
            //top.kwConsole.print("setVolume error :: " + a.message);
        }
    },
    setBrowser: function (b) {
        try {
            gSTB.SetMouseState(false);
            Browser.SetToolbarState(false);
        } catch (a) {
            //top.kwConsole.print(a.message);
        }
    },
    toggleMute: function () {
        try {
            this.isMute = gSTB.GetMute();
            this.isMute = (this.isMute == 1) ? 0 : 1;
            gSTB.SetMute(this.isMute);
            return this.isMute;
        } catch (a) {
            //top.kwConsole.print("toggleMute error :: " + a.message);
        }
    },
    getIpAddress: function () {
        try {
            return gSTB.RDir("IPAddress");
        } catch (a) {
            //top.kwConsole.print(a.message);
            return "127.0.0.1";
        }
    },
    getMacAddress: function () {
        try {
            return gSTB.GetDeviceMacAddress();
        } catch (a) {
            //top.kwConsole.print("GetMacAddress error :: " + a.message);
            return "000000000000";
        }
    },
    getDeviceModel: function () {
        try {
            var a = gSTB.GetDeviceModel();
            a = a.replaceAll(":", "");
            return a.trim();
        } catch (a) {
            //top.kwConsole.print("GetDeviceModel error :: " + a.message);
        }
    },
    getDeviceVersionHardware: function () {
        try {
            return gSTB.GetDeviceVersionHardware();
        } catch (a) {
            //top.kwConsole.print("GetDeviceVersionHardware error :: " + a.message);
        }
    },
    getDeviceVendor: function () {
        try {
            var str = gSTB.GetDeviceVendor();
            str = (typeof str == "string") ? 3 : str;//3 for INFOMIR
            return str;
        } catch (a) {
            //top.kwConsole.print("getDeviceVendor error :: " + a.message);
        }
    },
    getSerialNumber: function () {
        try {
            return gSTB.GetDeviceSerialNumber();
        } catch (a) {
            //top.kwConsole.print("rtvGetSerialNumber error :: " + a.message);
            return "000000000000";
        }
    },
    getStoredData: function (a) {
        try {
            return this.player.getStorageValue(a);
        } catch (b) {
            //top.kwConsole.print("Player.getStoredData() error :: " + b.message);
        }
    },
    setStoredData: function (b, c) {
        try {
            return this.player.setStorageValue(b, c);
        } catch (a) {
            //top.kwConsole.print("Player.setStoredData() error :: " + a.message);
        }
    },
    loadUrl: function (a) {
        try {
            this.document.location.href = a;
        } catch (b) {
            //top.kwConsole.print("Player.loadUrl() error :: " + b.message);
        }
    },
    stop: function () {
        try {
            this.setPlayerState("IDLE");
            gSTB.Stop();
            this.currentMrl = "";
            this.playerSpeedIndex = 0;
            //this.setClipScreen(0, 0, 0, 0);
        } catch (a) {
            //top.kwConsole.print("Player.stop() error :: " + a.message);
        }
    },
    play: function (c, t) {
        var b = null;
        try {
            if (c != this.currentMrl) {
                document.body.style.backgroundColor = "transparent";
                //top.kwConsole.print("Player.play() " + c);
                this.setPlayerState("PLAYING");
                b = gSTB.Play(c);
                if (b == 0) {
                    //top.kwConsole.print("Player.play() playing");
                    this.currentMrl = c;
                    this.setPlayerState("PLAYING");
                } else {
                    //top.kwConsole.print("Player.play() Not playing");
                    this.currentMrl = "";
                }
                this.setChromaKey(top.CHROMAKEY);
                //Browser.SetToolbarState(0);
            }
        } catch (a) {
            //top.kwConsole.print("Player.play() error :: " + a.message);
        }
    },
    restart: function () {
        //top.kwConsole.print("reboot init");
        gSTB.LoadURL("http://" + top.ip + "/client/index.html");
    },
    pause: function () {
        try {
            if (this.getPlayerState() === "PAUSED") {
                this.resume();
            } else {
                this.setPlayerState("PAUSED");
                gSTB.Pause();
                this.playerSpeedIndex = 0
            }
        } catch (a) {
            //top.kwConsole.print("Player.pause() error :: " + a.message);
        }
    },
    resume: function () {
        try {
            this.setPlayerState("PLAYING");
            this.playerSpeedIndex = 0;
            gSTB.Continue();
        } catch (a) {
            //top.kwConsole.print("Player.resume() error :: " + a.message);
        }
    },
    rewind: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            //top.kwConsole.print("rewind :: " + b);
            this.setPlayerState("REWIND");
            gSTB.SetSpeed(-1 * b);
        } catch (a) {
            //top.kwConsole.print("Player.rewind() error :: " + a.message);
        }
    },
    fforward: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            //top.kwConsole.print("fforward :: " + b);
            this.setPlayerState("FFORWARD");
            gSTB.SetSpeed(b);
        } catch (a) {
            //top.kwConsole.print("Player.fforward() error :: " + a.message);
        }
    },
    seekPDL: function (a) {
        try {
            this.player.seekPDL(a);
        } catch (b) {
            //top.kwConsole.print("Player.seekPDL() error :: " + b.message);
        }
    },
    getPosition: function () {
        var a = 0;
        try {
            a = PVR.GetPltInfo();
        } catch (b) {
            //top.kwConsole.print("Player.getPosition() error :: " + b.message);
        }
        return a;
    },
    setPosition: function (a) {
        try {
            this.player.setPosition(a);
        } catch (b) {
            //top.kwConsole.print("Player.setPosition() error :: " + b.message);
        }
    },
    getDuration: function () {
        var b = 0;
        try {
            b = gSTB.GetDuration();
        } catch (a) {
            //top.kwConsole.print("Player.getDuration() error :: " + a.message);
        }
        return b;
    },
    toggleWinMode: function (t) {
        try {
            //top.kwConsole.print("toggleWinMode :: winMode " + this.winMode);
            this.winMode = (t == "clip") ? 1 : 0;
            gSTB.SetTopWin(this.winMode);
        } catch (a) {
            //top.kwConsole.print("toggleWinMode error :: " + a.message);
        }
    },
    setClipScreen: function () {
        try {
            this.toggleWinMode("clip");
            if (top.DEFAULT_LANGUAGE == 'ar') {
                top.CLIP_X = 60;
            }
            gSTB.SetViewport(top.CLIP_W, top.CLIP_H, top.CLIP_X, top.CLIP_Y);
            //top.kwConsole.print("Player.setClipScreen() done");
        } catch (a) {
            //top.kwConsole.print("Player.setClipScreen() error :: " + a.message);
            result = false;
        }
    },
    setClipScreenMin: function () {
        try {
            this.setAlphaLevel(top.OPAQUE_LEVEL);
        } catch (a) {
            //top.kwConsole.print(a.message);
        }
    },
    setFullScreen: function () {
        try {
            this.toggleWinMode("full");
            var w = top.globalConst("SCREEN_WIDTH");
            var h = top.globalConst("SCREEN_HEIGHT");
            gSTB.SetViewport(w, h, 0, 0);
        } catch (a) {
            //top.kwConsole.print("Player.setFullScreen() error :: " + a.message);
            result = false;
        }
    },
    getBrowserResolution: function () {
        var a = "1080";
        try {
            a = screen.height + "";
        } catch (d) {
            return a;
        }
        return a;
    },
    removeCache: function () {
        try {
            Browser.CacheFlush();
        } catch (b) {
            //top.kwConsole.print(b.message);
        }
    },
    setAlphaLevel: function (b) {
        try {
            VideoDisplay.SetAlphaLevel(b);
        } catch (a) {
            //top.kwConsole.print(a.message);
        }
    },
    setOutputResolution: function (a) {
        try {
            this.player.setOutputResolution(2, level);
        } catch (b) {
            //top.kwConsole.print(b.message);
        }
    },
    setChromaKey: function (a) {
        try {
            VideoDisplay.SetChromaKey(a);
        } catch (b) {
            //top.kwConsole.print(b.message);
        }
    },
    reboot: function () {
        try {
            //top.kwConsole.print("reboot init");
            // gSTB.LoadURL("http://" + top.ip + "/client/index.html");
            top.UserManager.setRestart();
            gSTB.ExecAction('reboot');

        } catch (a) {
            //top.kwConsole.print(a.message);
        }
    },
    printDebugMessage: function (b) {
        try {
            gSTB.DebugString(b);
        } catch (a) {
            //top.kwConsole.print(a.message);
        }
    },
    getVolumeLimit: function (c) {
        var b = false;
        try {
            b = this.player.getVolumeLimit(c);
        } catch (a) {
            //top.kwConsole.print(a.message);
        }
        return b;
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
        top.globalFireEvent(new top.Event(a))
    },
    firmwareEventHandler: function (self, arguments) {

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
        top.globalFireEvent(new top.Event(a));
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
        top.globalFireEvent(new top.Event(a));
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
        top.globalFireEvent(new top.Event(a))
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
        top.globalFireEvent(new top.Event(b, {
            assetId: a
        }))
    },
    listenerEventHandler: function () {
        var c = stbEvent.event;
        //top.kwConsole.print("listenerEventHandler :: " + c);
        switch (c) {
            case 32://tv on
                //top.ScreenManager.load("MENU");
                // gSTB.StandBy(0);//stb on
                break;
            case 33://tv off
                // stbEvent.event = 0;
                top.ScreenManager.load("MENU");
                // gSTB.StandBy(1);//stb off
                break;
        }
        // stbEvent.event = 0;
        // top.globalFireEvent(new top.Event("NOTIFICATION", {
        // message: a
        // }))
    },
    setCurrentSubtitle: function (b) {
        try {
            //top.kwConsole.print("Player.setCurrentSubtitle() :: " + b);
            if (b != "off") {
                VideoDisplay.SetSubtitles(1)
            } else {
                VideoDisplay.SetSubtitles(0)
            }
        } catch (a) {
            //top.kwConsole.print(a.message);
        }
    }
};