var listener = {
    onbufferingstart: function () {
        console.log("Buffering start.");
    },
    onbufferingprogress: function (percent) {
        console.log("Buffering progress data : " + percent);
    },
    onbufferingcomplete: function () {
        console.log("Buffering complete.");
    },
    onstreamcompleted: function () {
        console.log("Stream Completed");
        // webapis.avplay.stop();
    },
    oncurrentplaytime: function (currentTime) {
        // console.log("Current playtime: " + currentTime);
    },
    onevent: function (eventType, eventData) {
        console.log("event type: " + eventType + ", data: " + eventData);
    },
    onerror: function (eventType) {
        console.log("event type error : " + eventType);
    },
    onsubtitlechange: function (duration, text, data3, data4) {
        console.log("subtitleText: " + text);
    },
    ondrmevent: function (drmEvent, drmData) {
        console.log("DRM callback: " + drmEvent + ", data: " + drmData);
    }
};
//b2bapis
var result = null;
var b2bpower = null;
var b2bcontrol = null;
var test = null;
var flag = false;
//webapis
var stbPlayer = null;
var stbPlayerAudio = null;
var remotePower = null;

//===========  Tizen SDK API   ===========

function setCurrentTime(dateTime) {
    var dateString = (dateTime.date.replace(/-/g, ":")) + ':' + dateTime.time;
    console.log("setCurrentTime called");
    var onSuccess = function () {
        console.log("[setCurrentTime] success");
    };
    var onError = function (error) {
        console.log("[setCurrentTime] code :" + error.code + " error name: " + error.name + "  message " + error.message);
    };
    console.log("[setCurrentTime]");
    //2015= year, 12= month, 25= day, 15=hour, 56= minute, 40= second
    b2bcontrol.setCurrentTime(dateString, onSuccess, onError);
}

function getCurrentTime() {
    var currentTime = null;
    try {
        currentTime = b2bcontrol.getCurrentTime();
    } catch (e) {
        console.log("[getCurrentTime] call syncFunction exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    if (null !== currentTime) {
        // console.log("[getCurrentTime] call syncFunction type: " + currentTime);
    }
    return currentTime;
}

function setIPAddress(ip) {
    console.log("[setIPAddress] function call");
    var onSuccess = function () {
        console.log("[setIPAddress] " + ip + " success ");
    }
    var onError = function (error) {
        console.log("[setIPAddress] " + ip + "  code :" + error.code + " error name: " + error.name + "  message " + error.message);
    }
    b2bcontrol.setIPAddress(ip, onSuccess, onError);
}

function getIPAddress() {
    console.log("[getIPAddress] function call");
    var IPAddress = null;
    try {
        IPAddress = b2bcontrol.getIPAddress();
    } catch (e) {
        console.log("[getIPAddress] call syncFunction exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    if (null !== IPAddress) {
        console.log(" IP Address is NULL: " + IPAddress);
    } else {
        console.log(" IP Address is NULL");
    }
}

function setSubNetMask(subnet) {
    console.log("[setSubnetMask] function call");
    var onSuccess = function () {
        console.log("[setSubnetMask] " + subnet + " success  ");
    }
    var onError = function (error) {
        console.log("[setSubnetMask] " + subnet + "  code :" + error.code + " error name: " + error.name + "  message " + error.message);
    }
    b2bcontrol.setSubnetMask(subnet, onSuccess, onError);
}

function getSubNetMask() {
    console.log("[getSubNetMask] function call");
    var subNetMask = null;
    try {
        subNetMask = b2bcontrol.getSubNetMask();
    } catch (e) {
        console.log("[getSubNetMask] call syncFunction exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    if (null !== subNetMask) {
        console.log("[getSubNetMask] call syncFunction type: " + subNetMask);
    }
}

function setGatewayAddress(gateway) {
    console.log("[setGatewayAddress] function call");
    var onSuccess = function () {
        console.log("[setGatewayAddress] " + gateway + " success ");
    }
    var onError = function (error) {
        console.log("[setGatewayAddress] " + gateway + "  code :" + error.code + " error name: " + error.name + "  message " + error.message);
    }
    b2bcontrol.setGatewayAddress(gateway, onSuccess, onError);
}

function getGatewayAddress() {
    console.log("[getGatewayAddress] function call");
    var gatewayAddress = null;
    try {
        gatewayAddress = b2bcontrol.getGatewayAddress();
    } catch (e) {
        console.log("[getGatewayAddress] call syncFunction exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    if (null !== gatewayAddress) {
        console.log("[getGatewayAddress] call syncFunction type: " + gatewayAddress);
    }
}

function setDNSServer(dns) {
    console.log("[setDNSServer] function call");
    var onSuccess = function () {
        console.log("[setDNSServer] " + dns + " success ");
    }
    var onError = function (error) {
        console.log("[setDNSServer] " + dns + "  code :" + error.code + " error name: " + error.name + "  message " + error.message);
    }
    b2bcontrol.setDNSServer(dns, onSuccess, onError);
}

function getDNSServer() {
    console.log("[getDNSServer] function call");
    var DNSServer = null;
    try {
        DNSServer = b2bcontrol.getDNSServer();
    } catch (e) {
        console.log("[getDNSServer] call syncFunction exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    if (null !== DNSServer) {
        console.log("[getDNSServer] call syncFunction type: " + DNSServer);
    }
}

function getMACAddress() {
    console.log("[getMACAddress] function call");
    var MACAddress = null;
    try {
        MACAddress = b2bcontrol.getMACAddress();
    } catch (e) {
        console.log("[getMACAddress] call syncFunction exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    if (null !== MACAddress) {
        console.log("[getMACAddress] call syncFunction type ==  " + MACAddress);
        return MACAddress;
    }
}

function getVersion() {
    console.log("[getVersion] function call");
    var GETVersion = null;
    try {
        console.log("[getVersion] b2bpower object : " + b2bpower);
        GETVersion = b2bpower.getVersion();
    } catch (e) {
        console.log("[getVersion] call syncFunction exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    if (null !== GETVersion) {
        console.log("[getVersion] call syncFunction type: " + GETVersion);
    }
}

function getPowerState() {
    console.log("[getPowerState] function call");
    var getPowerState = null;
    try {
        console.log("[getPowerState] b2bpower object : " + b2bpower);
        getPowerState = b2bpower.getPowerState();
    } catch (e) {
        console.log("[getPowerState] call syncFunction exception [" + e.code + "] name: " + e.name + " message: " + e.message);
    }
    if (null !== getPowerState) {
        console.log("[getPowerState] call syncFunction type: " + getPowerState);
    }
}

function setPowerStateChangeListener() {
    try {
        var onchange = function (val) {
            console.log("changed function." + JSON.stringify(val));
        }
        b2bpower.setPowerStateChangeListener(onchange);
        console.log("setPowerStateChangeListener");
    } catch (e) {
        // TODO: handle exception
        throw(e);
    }
}

function unsetPowerStateChangeListener() {
    try {
        var onchange = function (val) {
            console.log("changed function." + JSON.stringify(val));
        }
        b2bpower.unsetPowerStateChangeListener(onchange);
        console.log("unsetPowerStateChangeListener");
    } catch (e) {
        // TODO: handle exception
        throw(e);
    }
}

function setPowerOn() {
    console.log("[setPowerOn] function call");
    var onSuccess = function () {
        console.log("[setPowerOn]success ");
    }
    var onError = function (error) {
        console.log("[setPowerOn]code :" + error.code + " error name: " + error.name + "  message " + error.message);
    }
    console.log("[setPowerOn] b2bpower object == " + b2bpower);
    b2bpower.setPowerOn(onSuccess, onError);
}

function setPowerOff() {
    console.log("[setPowerOn] function call");
    var onSuccess = function () {
        console.log("[setPowerOff] succeeded!");
    }
    var onError = function (error) {
        console.log("[setPowerOff] failed! error code: " + error.code + " error name: " + error.name + "  message " + error.message);
    }
    b2bcontrol.setPowerOff(onSuccess, onError);
}

function rebootDevice() {
    console.log("[rebootDevice] function call");
    var onSuccess = function () {
        console.log("[rebootDevice] succeeded!");
    }
    var onError = function (error) {
        console.log("[rebootDevice] failed! error code: " + error.code + " error name: " + error.name + "  message " + error.message);
    }
    b2bcontrol.rebootDevice(onSuccess, onError);
}

var launchUSBContent = function () {
    try {
        var app = tizen.application.getCurrentApplication();
        var appControl = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/pick", null, null, null, [new tizen.ApplicationControlData("launch_type", ["mycontent "]), new tizen.ApplicationControlData("device_path", ["/opt/media/USBDriveA1"]), new tizen.ApplicationControlData("device_name", ["removable_sda1"]), new tizen.ApplicationControlData("device_type", ["USB"]), new tizen.ApplicationControlData("called_app", [app.appInfo.id])]);
        // ApplicationControlDataArrayReplyCallback instance
        var appControlReplyCallback = {
            // callee sent a reply
            onsuccess: function (data) {
                console.log("inside success");
            },
            // callee returned failure
            onfailure: function () {
                console.log('The launch application control failed');
            }
        };
        tizen.application.launchAppControl(appControl, "com.samsung.tv.mycontents", function () {
            console.log("mycontent success !!");
        }, function (e) {
            console.log("mycontent error !!" + e.message);
        }, appControlReplyCallback);
    } catch (error) {
        console.log("Error occured :: " + error.message);
    }
};

var launchApplication = function (appName) {
    try {
        var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
        //
        var appControl = new tizen.ApplicationControl("http://tizen.org/appcontrol/operation/view");
        // ApplicationControlDataArrayReplyCallback instance
        var appControlReplyCallback = {
            // callee sent a reply
            onsuccess: function (data) {
                console.log("inside success");
            },
            // callee returned failure
            onfailure: function () {
                console.log('The launch application control failed');
            }
        };
        tizen.application.launchAppControl(appControl, appName, function () {
            console.log("[sochoi] success !!");
        }, function (e) {
            console.log("[sochoi] error !!" + e.message);
            if ($thisPage.isHidden) {
                $thisPage.isHidden = false;
                $thisPage.isExternalInput = false;
                $thisPage.toggleAppVisibility(true);
                if (DEVICE_TYPE === "tizentv") {
                    // launchSource("TV");
                    handleBack();
                }
                initPageWidgets();
            }
        }, appControlReplyCallback);
    } catch (error) {
        console.log("Error occured :: " + error.message);
    }
};

var getCurrentApplication = function () {
    var app = tizen.application.getCurrentApplication();
    console.log("Current application's app id is " + app.appInfo.id);
};

var getPropValueArray = function () {
    var sourceArray = ["BATTERY", "CPU", "STORAGE", "DISPLAY", "DEVICE_ORIENTATION", "BUILD", "LOCALE", "NETWORK", "WIFI_NETWORK", "CELLULAR_NETWORK", "SIM", "PERIPHERAL", "MEMORY", "VIDEOSOURCE"];
    var connectedSources;

    function success1CB(videoSource) {
        console.log("videoSource " + videoSource);
        connectedSources = videoSource.connected;
        for (var i = 0; i < connectedSources.length; i++) {
            console.log("--------------- Source " + i + " ---------------");
            console.log("type = " + connectedSources[i].type);
            console.log("number = " + connectedSources[i].number);
        }
    }

    function error1CB(error) {
        console.log("getPropertyValue() is failed. Error name = " + error.name + ", Error message = " + error.message);
    }

    for (var a = 0; a < sourceArray.length; a++) {
        console.log("sources " + sourceArray[a]);
        tizen.systeminfo.getPropertyValue(sourceArray[a], success1CB, error1CB);
    }
};

var launchSource = function (sourceName) {
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    var connectedVideoSources;

    function successCB(source, type) {
        console.log("setSource() is successfully done. source name = " + source.name + ", source port number = " + source.number);
        showSource();
    }

    function errorCB(error) {
        console.log("setSource() is failed. Error name = " + error.name + ", Error message = " + error.message);
    }

    function systemInfoSuccessCB(videoSource) {
        connectedVideoSources = videoSource.connected;
        var sourceChange = false;
        for (var i = 0; i < connectedVideoSources.length; i++) {
            console.log("--------------- Source " + i + " ---------------");
            console.log("type = " + connectedVideoSources[i].type);
            console.log("number = " + connectedVideoSources[i].number);
            // if (connectedVideoSources[i].type === sourceName) {
            //     // set HDMI as input source of TV hole window
            //     tizen.tvwindow.setSource(connectedVideoSources[i], successCB, errorCB);
            //     getSourceInfo();
            //     break;
            // }
            switch (sourceName) {
                case "TV":
                    // set HDMI as input source of TV hole window
                    if (connectedVideoSources[i].type === "TV") {
                        tizen.tvwindow.setSource(connectedVideoSources[i], successCB, errorCB);
                        sourceChange = true;
                    }
                    break;
                case "HDMI_1":
                    // set HDMI as input source of TV hole window
                    if (connectedVideoSources[i].type === "HDMI" && connectedVideoSources[i].number === 1) {
                        tizen.tvwindow.setSource(connectedVideoSources[i], successCB, errorCB);
                        sourceChange = true;
                    }
                    break;
                case "HDMI_2":
                    // set HDMI as input source of TV hole window
                    if (connectedVideoSources[i].type === "HDMI" && connectedVideoSources[i].number === 2) {
                        tizen.tvwindow.setSource(connectedVideoSources[i], successCB, errorCB);
                        sourceChange = true;
                    }
                    break;
                case "HDMI_3":
                    // set HDMI as input source of TV hole window
                    if (connectedVideoSources[i].type === "HDMI" && connectedVideoSources[i].number === 3) {
                        tizen.tvwindow.setSource(connectedVideoSources[i], successCB, errorCB);
                        sourceChange = true;
                    }
                    break;
            }
        }
        // When source not changed
        if (!sourceChange) {
            if (($thisPage) && ($thisPage.isHidden)) {
                setGlobalNotification(LANG.msg_25, true);
                $thisPage.isHidden = false;
                $thisPage.isExternalInput = false;
                $thisPage.isAppFocused = true;
                $thisPage.toggleAppVisibility(true);
                // launchSource("TV");
                // handleBack();
                // initPageWidgets();
            }
        }
    }

    function systemInfoErrorCB(error) {
        console.log("getPropertyValue(VIDEOSOURCE) is failed. Error name = " + error.name + ", Error message = " + error.message);
    }

    try {
        tizen.systeminfo.getPropertyValue("VIDEOSOURCE", systemInfoSuccessCB, systemInfoErrorCB);
    } catch (error) {
        console.log("Error name = " + error.name + ", Error message = " + error.message);
    }
};

var showSource = function () {
    function successCB(windowRect, type) {
        // You will get exactly what you put as rectangle argument of show() through windowRect.
        // expected result : ["0", "0px", "50%", "540px"]
        console.log("Rectangle : [" + windowRect[0] + ", " + windowRect[1] + ", " + windowRect[2] + ", " + windowRect[3] + "]");
    }

    function errorCB(windowRect, type) {
        // You will get exactly what you put as rectangle argument of show() through windowRect.
        // expected result : ["0", "0px", "50%", "540px"]
        console.log("showSource - errorCB");
    }

    try {
        tizen.tvwindow.show(successCB, errorCB, ["0", "0px", "100%", "1080px"], "MAIN");
    } catch (error) {
        console.log("error: " + error.name);
    }
};

var hideSource = function () {
    function successCallBack() {
        // handleBack();
        console.log("hideSource : successCallBack");
    }

    function errorCallBack() {
        // handleBack();
        console.log("hideSource : errorCallBack");
    }

    tizen.tvwindow.hide(successCallBack, errorCallBack, "MAIN");
};

var getSourceInfo = function () {
    try {
        var source = tizen.tvwindow.getSource();
        console.log("type = " + source.type);
        console.log("number = " + source.number);
        console.log("Current source type is " + source.type + " source number is " + source.number);
    } catch (error) {
        console.log("Error name = " + error.name + ", Error message = " + error.message);
    }
};

var listInstalledApps = function () {
    function successCB(applications) {
        for (var i = 0; i < applications.length; i++) {
            console.log(applications[i].id);
        }
    }

    //
    tizen.application.getAppsInfo(successCB);
}

function handleBack() {
    hideSource();
}

function playerPrepareAsync() {
    console.log("[playerPrepareAsync] function call");
    var successCallback = function () {
        console.log("[playerPrepareAsync] succeeded!");
        stbPlayer.play();
    }
    var errorCallback = function (error) {
        console.log("[playerPrepareAsync] failed! error code: " + error.code + " error name: " + error.name + "  message " + error.message);
    }
    stbPlayer.prepareAsync(successCallback, errorCallback);
}

document.addEventListener('visibilitychange', function () {
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
   console.log("init - addEventListener : visibilitychange");
    if (document.hidden) {
        // Something you want to do when hide or exit.
       console.log("App Document hide or exit");
        console.log("App Document hide or exit");
        //
        // if (($thisPage) && ($thisPage.pageID === "KEY_TV" && $thisPage.pageID === "KEY_XTV")) {
        if (!$thisPage.isHidden) {
           console.log("Page Not Hidden");
            console.log("Page Not Hidden");
            $thisPage.changePage("KEY_HOME");
        }
        // }
    } else {
        // Something you want to do when resume.
       console.log("App Document active");
        console.log("App Document active");
        if (($thisPage) && ($thisPage.isExternalInput)) {
           console.log("Exit From External Input");
            console.log("Exit From External Input");
            if ($thisPage.isHidden) {
               console.log("Page Hidden");
                console.log("Page Hidden");
            }
            $thisPage.isHidden = false;
            $thisPage.isExternalInput = false;
            $thisPage.toggleAppVisibility(true);
            if (DEVICE_TYPE === "tizentv") {
                // launchSource("TV");
                handleBack();
            }
            initPageWidgets();
        }
    }
   console.log("end - addEventListener : visibilitychange");
});

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
            if ((IS_DEPLOY) && (!IS_DEV_MOD)) {
            }
            b2bpower = window.b2bapis.b2bpower;
            console.log("b2bpower object intilization call == " + b2bpower);
            b2bcontrol = window.b2bapis.b2bcontrol;
            console.log("b2bcontrol object intilization call == " + b2bcontrol);
            stbPlayer = webapis.avplay;
            console.log("stbPlayer object intilization call == " + stbPlayer);
            stbPlayerAudio = window.tizen.tvaudiocontrol;
            console.log("stbPlayerAudio object intilization call == " + stbPlayerAudio);
            var v = (VOLUME_CONFIG > stbPlayerAudio.getVolume()) ? stbPlayerAudio.getVolume() : VOLUME_CONFIG;
            stbPlayerAudio.setVolume(v);
            // unsetPowerStateChangeListener();
            // setPowerStateChangeListener();
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
            return stbPlayerAudio.getVolume();
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
            stbPlayerAudio.setVolume(v);
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
           console.log("setBrowser error :: " + a.message);
        }
    },
    toggleMute: function () {
        try {
            // Check if it is mute or not
            if (stbPlayerAudio.isMute()) {
                // Turn off the silent mode
                stbPlayerAudio.setMute(false);
            } else {
                // Mute to turn off the sound
                stbPlayerAudio.setMute(true);
            }
        } catch (a) {
           console.log("toggleMute error :: " + a.message);
        }
    },
    getIpAddress: function () {
        try {
            return gSTB.RDir("IPAddress");
        } catch (a) {
           console.log("getIpAddress error :: " + a.message);
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
            stbPlayer.close();
        } catch (a) {
           console.log("Player.stop() error :: " + a.message);
        }
    },
    play: function (c, t) {
        try {
            if (c !== this.currentMrl) {
                this.currentMrl = c;
                this.setPlayerState("PLAYING");

                /**
                 * asynchronously
                 */
                // stbPlayer.open(c);
                // if (this.winMode === 1) {
                //     var w = SCREEN_WIDTH;
                //     var h = SCREEN_HEIGHT;
                //     stbPlayer.setDisplayRect(0, 0, w, h);
                // }
                // if (t === "video") {
                //     stbPlayer.setLooping(true);
                // }
                // stbPlayer.setListener(listener);
                // playerPrepareAsync();
                // // stbPlayer.prepareAsync(function () {
                // //     stbPlayer.play();
                // // });

                /**
                 * synchronously
                 */
                stbPlayer.open(c);
                if (this.winMode === 1) {
                    var w = SCREEN_WIDTH;
                    var h = SCREEN_HEIGHT;
                    stbPlayer.setDisplayRect(0, 0, w, h);
                }
                if (t === "video") {
                    stbPlayer.setLooping(true);
                }
                stbPlayer.setListener(listener);
                // stbPlayer.setBufferingParam("PLAYER_BUFFER_FOR_PLAY", "PLAYER_BUFFER_SIZE_IN_SECOND", 5000);  // For the initial buffering is in seconds
                // stbPlayer.setBufferingParam("PLAYER_BUFFER_FOR_RESUME", "PLAYER_BUFFER_SIZE_IN_SECOND", 5000);  // For the rebuffering is in seconds
                // stbPlayer.setTimeoutForBuffering(10000);
                stbPlayer.prepare();
                stbPlayer.play();
            }
        } catch (a) {
           console.log("Player.play() error :: " + a.message);
        }
    },
    pause: function () {
        try {
            var state = stbPlayer.getState();
            if (state === 'PLAYING') {
                this.setPlayerState("PAUSED");
                stbPlayer.pause();
            } else if (state === 'PAUSED') {
                this.setPlayerState("PLAYING");
                stbPlayer.play();
            }
            this.playerSpeedIndex = 0
        } catch (a) {
           console.log("Player.pause() error :: " + a.message);
        }
    },
    resume: function () {
        try {
            var state = stbPlayer.getState();
            if (state === 'PLAYING') {
                this.setPlayerState("PAUSED");
                stbPlayer.pause();
            } else if (state === 'PAUSED') {
                this.setPlayerState("PLAYING");
                stbPlayer.play();
            }
            this.playerSpeedIndex = 0
        } catch (a) {
           console.log("Player.resume() error :: " + a.message);
        }
    },
    rewind: function (c) {
        try {
            // rewind 3 seconds (3000 ms)
            this.setPlayerState("REWIND");
            stbPlayer.jumpBackward(3000);
        } catch (a) {
           console.log("Player.rewind() error :: " + a.message);
        }
    },
    fforward: function (c) {
        try {
            // jump forward 3 seconds (3000 ms)
            this.setPlayerState("FFORWARD");
            stbPlayer.jumpForward(3000);
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
            // gSTB.SetTopWin(this.winMode);
        } catch (a) {
           console.log("toggleWinMode error :: " + a.message);
        }
    },
    setClipScreen: function (c, x) {
        try {
            stbPlayer.setDisplayRect(CLIP_X, CLIP_Y, CLIP_W, CLIP_H);
        } catch (a) {
           console.log("Player.setClipScreen() error :: " + a.message);
        }
    },
    setFullScreen: function () {
        try {
            this.toggleWinMode("full");
            // var w = SCREEN_WIDTH;
            // var h = SCREEN_HEIGHT;
            // stbPlayer.setDisplayRect(0, 0, w, h);
        } catch (a) {
           console.log("Player.setFullScreen() error :: " + a.message);
        }
    },
    setClipScreenMin: function () {
        try {
            this.setAlphaLevel(OPAQUE_LEVEL);
        } catch (a) {
           console.log("setClipScreenMin error :: " + a.message);
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
           console.log("Player.setAlphaLevel() error :: " + a.message);
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
           console.log("Player.printDebugMessage() error :: " + a.message);
        }
    },
    getVolumeLimit: function (c) {
        var b = false;
        try {
            b = this.player.getVolumeLimit(c);
        } catch (a) {
           console.log("Player.getVolumeLimit() error :: " + a.message);
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
           console.log("Player.setCurrentSubtitle() error :: " + a.message);
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