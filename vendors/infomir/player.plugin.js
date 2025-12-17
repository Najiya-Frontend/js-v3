//
window.stbEvent = {
    onEvent: function (event, info) {
        console.log('event:', event);
        console.log('event additional info:', info);
    },
    onStandBy: function (data, info) {
        console.log('event data:', data);
        console.log('event additional info:', info);
        var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
        //
        data = JSON.parse(data);
        //
        if (data.nextState === 0) {
            //normal
            if ($thisPage.pageID === "KEY_TV" || $thisPage.pageID === "KEY_XTV") {
                AppWidgets.widget_channelList.init();
            }
            //
            if (AppWidgets.widget_promoBox) {
                AppWidgets.widget_promoBox.initPromoBox();
            }
        }
        if (data.nextState === 3) {
            // standby
            if (AppWidgets.widget_promoBox) {
                AppWidgets.widget_promoBox.unInit();
            }
        }
    },
    event: 0
};
//
var stbPlayer = stbPlayerManager.list[0];
stbPlayer.onTracksInfo = function () {
    console.log('Information on audio and video tracks of the media content is received.');
};
stbPlayer.onPlayStart = function () {
    console.log('Video playback has begun.');
};
// //
// var stbDisplay = stbDisplayManager.list[0];
// stbDisplay.onStateChange = function (state) {
//     console.log('HDMI device has been connected/disconnected');
// };
// //
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
    winMode: 0,//0 - Graphic, 1 - Video
    mountPath: "",
    init: function () {
        try {
            // gSTB.InitPlayer();
            gSTB.SetWakeUpSources([6]);
            gSTB.StandByMode = 1;
            // gSTB.SetVolume(top.CURRENT_VOLUME);
            console.log("stbPlayer.volume :: ", stbPlayer.volume);
            console.log("VOLUME_CONFIG :: ", VOLUME_CONFIG);
            stbPlayer.volume = (VOLUME_CONFIG > stbPlayer.volume) ? stbPlayer.volume : VOLUME_CONFIG;
            // gSTB.SetBufferSize(4000, 2000000);
            stbPlayer.setBufferSize(4000, 2000000);
            //stbPlayer.aspectConversion = 2;
            //stbPlayer.videoWindowMode = 1;
            if ((IS_DEPLOY) && (!IS_DEV_MOD)) {
                gSTB.EnableServiceButton(false);
                gSTB.EnableVKButton(false);
            }
        } catch (a) {
           console.log("Player.init() error :: " + a.message);
        }
    },
    startLocalCfg: function () {
        gSTB.StartLocalCfg();
    },
    getPlayerHtml: function () {
        return "";
    },
    getPlayerState: function () {
        return this.currentState;
    },
    setPlayerState: function (a) {
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
            return stbPlayer.volume;
        } catch (a) {
           console.log("getVolume error :: " + a.message);
            return 0;
        }
    },
    powerToggle: function () {
        var p = gSTB.GetStandByStatus();
        p = (p) ? false : true;
        gSTB.StandBy(p);
    },
    keyboardToggle: function () {
        // var b = gSTB.IsVirtualKeyboardActive();
        // b = (b) ? false : true;
        try {
            gSTB.ShowVirtualKeyboard(true);
        } catch (e) {
           console.log("keyboardToggle :: error : " + e.message);
        }
    },
    changeSource: function (n) {
        //var pluginObjectTVMW = this.pluginObjectTVMW;
        //pluginObjectTVMW.SetSource(n);//31 = HDMI1, 48 = IPTV
    },
    mirrorScreen: function () {
        //var pluginObjectSEF = this.pluginObjectSEF;
        //pluginObjectSEF.Open("TaskManager", "1.000", "TaskManager");
        //pluginObjectSEF.Execute("RunWIFIDisplay"); //RunWIFIDisplay will launch Screen Mirroring App.
        ////pluginObjectSEF.Close();
    },
    bluetoothMusicPlayer: function () {
        //var pluginObjectSEF = this.pluginObjectSEF;
        //pluginObjectSEF.Open("HOTEL", "1.000", "HOTEL");
        //pluginObjectSEF.Execute("RunHotelApp", "BtApp");//Run the BlueTooth player app
        ////pluginObjectSEF.Close();
    },
    setVolume: function (b) {
        var v = 0;
        try {
            v = (b >= VOLUME_MAX) ? VOLUME_MAX : (b <= VOLUME_MIN) ? VOLUME_MIN : b;
            stbPlayer.volume = v;
            setGlobalVolumeNumber(v);
        } catch (a) {
           console.log("setVolume error :: " + a.message);
        }
    },
    setBrowser: function (b) {
        try {
            gSTB.SetMouseState(false);
            Browser.SetToolbarState(false);
        } catch (a) {
           console.log(a.message);
        }
    },
    toggleMute: function () {
        try {
            this.isMute = (this.isMute) ? false : true;
            stbPlayer.mute = this.isMute;
        } catch (a) {
           console.log("toggleMute error :: " + a.message);
        }
    },
    getIpAddress: function () {
        try {
            return gSTB.RDir("IPAddress");
        } catch (a) {
           console.log(a.message);
            return "127.0.0.1";
        }
    },
    getMacAddress: function () {
        try {
            return gSTB.GetDeviceMacAddress();
        } catch (a) {
           console.log("GetMacAddress error :: " + a.message);
            return "00:00:00:00:00:00";
        }
    },
    getDeviceModel: function () {
        try {
            var a = gSTB.GetDeviceModel();
            a = a.replaceAll(":", "");
            return a.trim();
        } catch (a) {
           console.log("GetDeviceModel error :: " + a.message);
        }
    },
    getDeviceVersionHardware: function () {
        try {
            return gSTB.GetDeviceVersionHardware();
        } catch (a) {
           console.log("GetDeviceVersionHardware error :: " + a.message);
        }
    },
    getDeviceVendor: function () {
        try {
            var str = gSTB.GetDeviceVendor();
            str = (typeof str == "string") ? 3 : str;//3 for INFOMIR
            return str;
        } catch (a) {
           console.log("getDeviceVendor error :: " + a.message);
        }
    },
    getSerialNumber: function () {
        try {
            return gSTB.GetDeviceSerialNumber();
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
            gSTB.LoadURL(PROTOCOL + ip + "/client/index.html");
        } catch (b) {
           console.log("Player.loadUrl() error :: " + b.message);
        }
    },
    stop: function () {
        try {
            this.setPlayerState("IDLE");
            this.currentMrl = "";
            this.playerSpeedIndex = 0;
            stbPlayer.stop();
        } catch (a) {
           console.log("Player.stop() error :: " + a.message);
        }
    },
    play: function (c, t) {
        var b = null;
        try {
            if (c !== this.currentMrl) {
                this.currentMrl = c;
                this.setPlayerState("PLAYING");
                stbPlayer.play({
                    uri: c,
                    solution: 'auto'
                });
            }
        } catch (a) {
           console.log("Player.play() error :: " + a.message);
        }
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
           console.log("Player.pause() error :: " + a.message);
        }
    },
    resume: function () {
        try {
            this.setPlayerState("PLAYING");
            this.playerSpeedIndex = 0;
            gSTB.Continue();
        } catch (a) {
           console.log("Player.resume() error :: " + a.message);
        }
    },
    rewind: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("REWIND");
            gSTB.SetSpeed(-1 * b);
        } catch (a) {
           console.log("Player.rewind() error :: " + a.message);
        }
    },
    fforward: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("FFORWARD");
            gSTB.SetSpeed(b);
        } catch (a) {
           console.log("Player.fforward() error :: " + a.message);
        }
    },
    seekPDL: function (a) {
        try {
            this.player.seekPDL(a);
        } catch (b) {
           console.log("Player.seekPDL() error :: " + b.message);
        }
    },
    getPosition: function () {
        var a = 0;
        try {
            a = PVR.GetPltInfo();
        } catch (b) {
           console.log("Player.getPosition() error :: " + b.message);
        }
        return a;
    },
    setPosition: function (a) {
        try {
            this.player.setPosition(a);
        } catch (b) {
           console.log("Player.setPosition() error :: " + b.message);
        }
    },
    getDuration: function () {
        var b = 0;
        try {
            b = gSTB.GetDuration();
        } catch (a) {
           console.log("Player.getDuration() error :: " + a.message);
        }
        return b;
    },
    toggleWinMode: function (t) {
        try {
            this.winMode = (t === "clip") ? 1 : 0;
            gSTB.SetTopWin(this.winMode);
        } catch (a) {
           console.log("toggleWinMode error :: " + a.message);
        }
    },
    setClipScreen: function (c, x) {
        try {
            //set on top of image = 1
            gSTB.SetTopWin(0);
            //this.toggleWinMode(c);
            // alert("SCREEN_HEIGHT ==> " + SCREEN_HEIGHT + " SCREEN_WIDTH ==> " + SCREEN_WIDTH);
            // alert("CLIP_W ==> " + CLIP_W + " CLIP_H ==> " + CLIP_H + "CLIP_X ==> " + CLIP_X + "CLIP_Y ==> " + CLIP_Y);
            stbPlayer.setViewport({x: CLIP_X, y: CLIP_Y, width: CLIP_W, height: CLIP_H});
        } catch (a) {
           console.log("Player.setClipScreen() error :: " + a.message);
        }
    },
    setFullScreen: function () {
        try {
            // this.toggleWinMode("full");
            var w = SCREEN_WIDTH;
            var h = SCREEN_HEIGHT;
            //gSTB.SetViewport(w, h, 0, 0);
            stbPlayer.setViewport({x: 0, y: 0, width: w, height: h});
        } catch (a) {
           console.log("Player.setFullScreen() error :: " + a.message);
        }
    },
    setClipScreenMin: function () {
        try {
            this.setAlphaLevel(OPAQUE_LEVEL);
        } catch (a) {
           console.log(a.message);
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
           console.log(b.message);
        }
    },
    setAlphaLevel: function (b) {
        try {
            VideoDisplay.SetAlphaLevel(b);
        } catch (a) {
           console.log(a.message);
        }
    },
    setOutputResolution: function (a) {
        try {
            this.player.setOutputResolution(2, level);
        } catch (b) {
           console.log(b.message);
        }
    },
    setChromaKey: function (a) {
        try {
            VideoDisplay.SetChromaKey(a);
        } catch (b) {
           console.log(b.message);
        }
    },
    reboot: function () {
        try {
            // reboot device
            gSTB.ExecAction('reboot');
        } catch (e) {
           console.log("Player.reboot() error :: " + e.message);
        }
    },
    printDebugMessage: function (b) {
        try {
            gSTB.DebugString(b);
        } catch (a) {
           console.log(a.message);
        }
    },
    getVolumeLimit: function (c) {
        var b = false;
        try {
            b = this.player.getVolumeLimit(c);
        } catch (a) {
           console.log(a.message);
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
        globalFireEvent(new Event(a));
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
        globalFireEvent(new Event(a));
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
           console.log(a.message);
        }
    },
    rotateSTB: function (a) {
        gSTB.rotate(90);
    },
    readMediaJson: function () {
        //device_mount_path
        if (DEVICE_MOUNT_PATH != "" || this.mountPath != "") {
            //update br cache number for html file as well
            BR_CACHE = "cache=" + (Math.random() * 1000);
            var obj = {};
            var xmlhttp = new XMLHttpRequest();
            xmlhttp.overrideMimeType("application/json");
            xmlhttp.onreadystatechange = function () {
                if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
                    obj = JSON.parse(xmlhttp.responseText);
                    Player.downloadMediasToUSB(obj);
                }
            };
            var json_uri = DEVICE_FILES + "media_assets.json?" + BR_CACHE;
            xmlhttp.open('GET', json_uri, true);
            xmlhttp.send(null);
        } else {
            document.getElementById('storageError').innerHTML = "Error - Device Mount Path";
        }
    },
    configUSB: function () {
        DataManager.updateDeviceJsonData('config_usb', DEVICE_ID, 1, 'reboot');
        setTimeout(function () {
            document.getElementById('storageError').innerHTML = "USB Configured...";
            Player.readMediaJson();
        }, 30000);
    },
    storageUSBConfig: function () {
        var storageInfo = JSON.parse(gSTB.GetStorageInfo('{}')), devices = storageInfo.result || [];
        if (devices) {
            var mountPath = devices[0].mountPath + '/';
            this.mountPath = mountPath;
            var div = document.createElement("div");
            div.id = "storageInfoWrapper";
            div.style.width = "820px";
            div.style.height = "500px";
            div.style.background = "red";
            div.style.color = "white";
            div.style.position = "absolute";
            div.style.padding = "20px";
            div.style.fontSize = "32px";
            div.style.top = "40%";
            div.style.left = "50px";
            div.style.textAlign = "center";
            div.style.overflowWrap = "anywhere";
            div.innerHTML = '<h1>storage USB info</h1><br/>' +
                '<h6 id="storageInfo">' + JSON.stringify(storageInfo) + '</h6><br/>' +
                '<h4>mount USB :: ' + mountPath + '</h4><br/>' +
                '<h6 id="queueInfo"></h6><br/>' +
                '<h5>STB may reboot once USB configured properly... Please be patient...</h5><br/>' +
                '<h4 id="storageError" style="color: #FFFF00;"></h4>';
            document.body.appendChild(div);
            //
            setTimeout(function () {
                document.getElementById('storageError').innerHTML = "Configuring USB...";
                Player.configUSB();
            }, 30000);
        } else {
            document.getElementById('storageError').innerHTML = "Error - Cannot find USB";
        }
    },
    downloadMediasToUSB: function (mediaObj) {
        var jobAdded = false;

        //mediaObj = [
        //    "logo5fa5450a0d973_11062020_181354.jpeg",
        //    "Believe-in-Yourself-Motivational-Video-English5fa5451d45754_11062020_181413.mp4",
        //    "Recognizing-Signs-of-Corona-Sinhala5fa66ea5b53f1_11072020_152341.mp4",
        //    "Recognizing-Signs-of-Corona-Sinhala5fa66eec40e13_11072020_152452.mp4",
        //    "Recognizing-Signs-of-Corona-Sinhala5fa66f122fd0b_11072020_152530.mp4",
        //    "Recognizing-Signs-of-Corona-Sinhala5fa66f36875d5_11072020_152606.mp4",
        //    "Recognizing-Signs-of-Corona-Sinhala5fa66f678492e_11072020_152655.mp4",
        //    "Recognizing-Signs-of-Corona-Sinhala5fa67914714ff_11072020_160812.mp4",
        //    "Recognizing-Signs-of-Corona-Sinhala5fa6794bba1fa_11072020_160907.mp4",
        //    "BIYMVE5fa679a2f3040_11072020_161034.mp4",
        //    "onehotel-app-qr5fd07c5dee699_12092020_125725.png"
        //];

        if (mediaObj) {
            for (var idx = 0; idx < mediaObj.length; idx++) {
                var itm = mediaObj[idx];
                var downloadURL = PROTOCOL + ADMIN_URL + 'uploads/' + itm;
                var pathToSave = this.mountPath + itm;
                var AddJob = stbDownloadManager.AddJob(downloadURL, pathToSave);
                if (AddJob) {
                    document.getElementById('storageError').innerHTML = "Downloading media...";
                } else {
                    document.getElementById('storageError').innerHTML = "Error - Download failed";
                }
                if (idx == (mediaObj.length - 1)) {
                    jobAdded = true;
                    document.getElementById('storageError').innerHTML = "On... Success - Download... System Rebooting... Wait...";
                }
            }
        } else {
            document.getElementById('storageError').innerHTML = "Error - Cannot read json data";
        }
        //
        if (jobAdded) {
            document.getElementById('storageError').innerHTML = "Ready - Reboot...";
            var queueInfo = JSON.parse(stbDownloadManager.GetQueueInfo());
            //var queueInfo = [123, 456, 789, 1123, 1145, 1167, 1189];
            document.getElementById('queueInfo').innerHTML = JSON.stringify(queueInfo);
            setTimeout(function () {
                document.getElementById('storageError').innerHTML = "Success - Rebooting NOW...";
                Player.reboot();
            }, 60000);
        }
    }
};