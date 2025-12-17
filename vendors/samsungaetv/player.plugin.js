//Udp
var PL_ISP_SOURCE = 48;

function onEvent_SEF(event, data1, data2) {
    //console.log("onEvent........._SEF" + event + " param1 : " + data1 + " param2 : " + data2);
    //switch (event) {
    //    case 1: //PL_EMP_IPTV_EVENT_MESSAGE:
    //        console.log("SEF_EVENT_TYPE.PL_EMP_IPTV_EVENT_MESSAGE.");
    //        break;
    //    case 2: //PL_EMP_PLAYER_EVENTS:
    //        console.log("SEF_EVENT_TYPE.PL_EMP_PLAYER_EVENTS.");
    //        break;
    //    case 3: //PL_EMP_IPTV_EVENTS:
    //        console.log("SEF_EVENT_TYPE.PL_EMP_IPTV_EVENTS.");
    //        if (data1 == 1)//PL_EMP_IPTV_EVENT_AUDIO_ONLY)
    //        {
    //            console.log("SEF_IPTV_EVENT_PARAM.PL_EMP_IPTV_EVENT_AUDIO_ONLY.");
    //        }
    //        else if (data1 == 2)// PL_EMP_IPTV_EVENT_VIDEO_ONLY)
    //        {
    //            console.log("SEF_IPTV_EVENT_PARAM.PL_EMP_IPTV_EVENT_VIDEO_ONLY.");
    //        }
    //        else if (data1 == 3)// PL_EMP_IPTV_EVENT_AUDIO_AND_VIDEO)
    //        {
    //            console.log("SEF_IPTV_EVENT_PARAM.PL_EMP_IPTV_EVENT_AUDIO_AND_VIDEO.");
    //        }
    //        else if (data1 == 4)//PL_EMP_IPTV_EVENT_NO_STREAMINPUT)
    //        {
    //            console.log("Weak or No Signal!");
    //            console.log("SEF_IPTV_EVENT_PARAM.PL_EMP_IPTV_EVENT_NO_STREAMINPUT.");
    //        }
    //        else if (data1 == 5)// PL_EMP_IPTV_EVENT_STREAM_RECOVERED)
    //        {
    //            console.log("SEF_IPTV_EVENT_PARAM.PL_EMP_IPTV_EVENT_STREAM_RECOVERED.");
    //        }
    //        break;
    //
    //    default:
    //        break;
    //}
}

//Mp4
var SEF_EVENT_TYPE = {
    CONNECTION_FAILED: 1,
    AUTHENTICATION_FAILED: 2,
    STREAM_NOT_FOUND: 3,
    NETWORK_DISCONNECTED: 4,
    NETWORK_SLOW: 5,
    RENDER_ERROR: 6,
    RENDERING_START: 7,
    RENDERING_COMPLETE: 8,
    STREAM_INFO_READY: 9,
    DECODING_COMPLETE: 10,
    BUFFERING_START: 11,
    BUFFERING_COMPLETE: 12,
    BUFFERING_PROGRESS: 13,
    CURRENT_DISPLAY_TIME: 14,
    AD_START: 15,
    AD_END: 16,
    RESOLUTION_CHANGED: 17,
    BITRATE_CHANGED: 18,
    SUBTITLE: 19,
    CUSTOM: 20
};
var PL_MEDIA_SOURCE = 43;

function onEvent_VOD(event, data1, data2) {
    //console.log("<br>onEvent_VOD==" + event + " param1 : " + data1 + " param2 : " + data2);
    //switch (event) {
    //    case SEF_EVENT_TYPE.STREAM_INFO_READY:
    //        console.log("Stream info ready Completed <br>");
    //        break;
    //    case SEF_EVENT_TYPE.DECODING_COMPLETE:
    //        console.log("DECODING_COMPLETE Completed <br>");
    //        break;
    //    case SEF_EVENT_TYPE.BUFFERING_COMPLETE:
    //        console.log("Buffering Completed <br>");
    //        break;
    //    case SEF_EVENT_TYPE.CURRENT_DISPLAY_TIME:
    //        console.log("CURRENT_DISPLAY_TIME <br>");
    //        break;
    //    case SEF_EVENT_TYPE.RENDERING_COMPLETE:
    //        console.log("RENDERING_COMPLETE <br>");
    //        break;
    //    case SEF_EVENT_TYPE.NETWORK_DISCONNECTED:
    //        console.log("Network disconnected<br>");
    //        break;
    //    case SEF_EVENT_TYPE.CONNECTION_FAILED:
    //        console.log("CONNECTION_FAILED<br>");
    //        break;
    //    case SEF_EVENT_TYPE.STREAM_NOT_FOUND:
    //        console.log("STREAM_NOT_FOUND<br>");
    //        break;
    //    case SEF_EVENT_TYPE.NETWORK_SLOW:
    //        console.log("NETWORK_SLOW<br>");
    //        break;
    //}
}

//Variables For Samsung onEvent Functions
var alarm_url = null;
var PL_TV_EVENT_CHANGE_POWER_STATE = 211;
var powerWidgetObject = null;
//
window.addEventListener('focus', function (e) {
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    // console.log("FOCUS");
    if ($thisPage.isHidden) {
        $thisPage.isHidden = false;
        $thisPage.isExternalInput = false;
        $thisPage.toggleAppVisibility(true);
        if (DEVICE_TYPE === "samsungaetv") {
            Player.changeSource(48);
        }
        initPageWidgets();
    }
}, false);
//
var Player = {
    isSTB: true,
    currentMrl: "",
    mediaType: "",
    currentState: null,
    playerSpeed: [2, 4, 6, 8, 16, 32],
    playerSpeedIndex: 0,
    isMute: 0,
    winMode: 0, //0 - Graphic, 1 - Video
    pluginAPI: null,
    widgetAPI: null,
    tvKeyAPI: null,
    pluginPower: null,
    pluginObjectSEF: null,
    pluginObjectSEFTV: null,
    pluginAudio: null,
    pluginNNavi: null,
    powerState: null,
    pluginSefIPTV: null,
    pluginObjectTVMW: null,
    pluginSefTV: null,
    pluginSefVOD: null,
    pluginAppCommon: null,
    pluginTime: null,
    pluginSefNetwork: null,
    pluginTV: null,
    pluginSamsungTV: function () {
        var samsungHTMLObjects = '';
        samsungHTMLObjects += '<object id="pluginObjectTVMW" border="0" classid="clsid:SAMSUNG-INFOLINK-TVMW"></object>';
        samsungHTMLObjects += '<object id="pluginSefIPTV" border="0" classid="clsid:SAMSUNG-INFOLINK-SEF"></object>';
        samsungHTMLObjects += '<object id="pluginSefTV" border="0" classid="clsid:SAMSUNG-INFOLINK-SEF"></object>';
        samsungHTMLObjects += '<object id="pluginSefVOD" border="0" classid="clsid:SAMSUNG-INFOLINK-SEF"></object>';
        samsungHTMLObjects += '<object id="pluginAppCommon" border="0" classid="clsid:SAMSUNG-INFOLINK-APPCOMMON"></object>';
        samsungHTMLObjects += '<object id="pluginTime" border="0" classid="clsid:SAMSUNG-INFOLINK-TIME"></object>';
        samsungHTMLObjects += '<object id="pluginSefNetwork" border="0" classid="clsid:SAMSUNG-INFOLINK-SEF"></object>';
        samsungHTMLObjects += '<object id="pluginPower" border="0" classid="clsid:SAMSUNG-INFOLINK-SEF"></object>';
        samsungHTMLObjects += '<object id="pluginObjectSEF" border="0" classid="clsid:SAMSUNG-INFOLINK-SEF"></object>';
        samsungHTMLObjects += '<object id="pluginObjectSEFTV" border="0" classid="clsid:SAMSUNG-INFOLINK-SEF"></object>';
        samsungHTMLObjects += '<object id="pluginAudio" border="0" classid="clsid:SAMSUNG-INFOLINK-SEF"></object>';
        samsungHTMLObjects += '<object id="pluginNNavi" border="0" classid="clsid:SAMSUNG-INFOLINK-NNAVI"></object>';
        return samsungHTMLObjects;
    },
    init: function () {
        try {
            this.widgetAPI = new Common.API.Widget();
            this.tvKeyAPI = new Common.API.TVKeyValue();
            this.pluginAPI = new Common.API.Plugin();
            this.widgetAPI.sendReadyEvent(); //The sendReadyEvent() method notifies the Application Manager that the application is ready to be displayed.
            // this.widgetAPI.onWidgetEvent = this.onWidgetEvent;
            //Declare Objects
            var plugin_SefIPTV = document.getElementById("pluginSefIPTV");
            var plugin_ObjectTVMW = document.getElementById("pluginObjectTVMW");
            var plugin_SefTV = document.getElementById("pluginSefTV");
            var plugin_SefVOD = document.getElementById("pluginSefVOD");
            var plugin_AppCommon = document.getElementById("pluginAppCommon");
            var plugin_Time = document.getElementById("pluginTime");
            var plugin_SefNetwork = document.getElementById("pluginSefNetwork");
            var plugin_Power = document.getElementById("pluginPower");
            var plugin_ObjectSEF = document.getElementById("pluginObjectSEF");
            var plugin_ObjectSEFTV = document.getElementById("pluginObjectSEFTV");
            var plugin_Audio = document.getElementById("pluginAudio");
            var plugin_NNavi = document.getElementById("pluginNNavi");
            //Initialize Samsung Objects
            this.pluginSefIPTV = plugin_SefIPTV;
            this.pluginObjectTVMW = plugin_ObjectTVMW;
            this.pluginSefTV = plugin_SefTV;
            this.pluginSefVOD = plugin_SefVOD;
            this.pluginAppCommon = plugin_AppCommon;
            this.pluginTime = plugin_Time;
            this.pluginSefNetwork = plugin_SefNetwork;
            this.pluginPower = plugin_Power;
            this.pluginObjectSEF = plugin_ObjectSEF;
            this.pluginObjectSEFTV = plugin_ObjectSEFTV;
            this.pluginAudio = plugin_Audio;
            this.pluginNNavi = plugin_NNavi;

            //Subscribing to the Power State Event
            powerWidgetObject = this.pluginSefTV;
            powerWidgetObject.Open("TV", "1.000", "TV");
            powerWidgetObject.OnEvent = this.TVEventHandler;
            powerWidgetObject.Execute("SetEvent", PL_TV_EVENT_CHANGE_POWER_STATE);

            //Register All Keys
            this.pluginAPI.registAllKey();

            //Unregistering Keys
            this.pluginAPI.unregistKey(this.tvKeyAPI.KEY_VOL_UP);
            this.pluginAPI.unregistKey(this.tvKeyAPI.KEY_VOL_DOWN);
            this.pluginAPI.unregistKey(this.tvKeyAPI.KEY_MUTE);
            this.pluginAPI.unregistKey(this.tvKeyAPI.KEY_RETURN);
            this.pluginAPI.unregistKey(this.tvKeyAPI.KEY_GREEN);
            this.pluginAPI.unregistKey(this.tvKeyAPI.KEY_POWER);

            //Register Key
            this.pluginAPI.registKey(88);// KEY_RETURN
            this.pluginAPI.registKey(20);// KEY_GREEN

            //Waking Up TV if Standby
            var standBy = this.getPowerState();
            if (standBy === true) {
                this.setWakeUp();
            }
        } catch (a) {
           console.log("Player.init() error :: " + a.message);
        }
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
            //Get TV's Current Volume
            this.pluginAudio.Open("Audio", "1.000", "Audio");
            var currentVolume = this.pluginAudio.Execute("GetVolume");
            this.pluginAudio.Close();
            return currentVolume;
        } catch (a) {
           console.log("getVolume error :: " + a.message);
            return 0;
        }
    },
    powerToggle: function () {
        // TV Power ON / OFF Function
        // p = gSTB.GetStandByStatus();
        // p = (p) ? false : true;
        // gSTB.StandBy(p);
    },
    setWakeUp: function () {
        this.pluginPower.Open("HOTEL", "1.000", "HOTEL");
        this.pluginPower.Execute("SetPowerOn");
    },
    setStandby: function () {
        this.pluginPower.Open("HOTEL", "1.000", "HOTEL");
        this.pluginPower.Execute("SetPowerOff");
    },
    setLoopPlay: function (alarm_tone_url) {
        alarm_url = alarm_tone_url;
        this.pluginSefVOD.Open('Player', '1.000', 'Player');
        this.pluginSefVOD.OnEvent = this.onLoopEvent;
        this.pluginObjectTVMW.SetSource(43);
        this.pluginSefVOD.Execute("InitPlayer", alarm_url);
        this.pluginSefVOD.Execute("Start", alarm_url);
        this.pluginSefVOD.Execute("StartPlayback", 0);
        ALARM_RUNNING = true;
    },
    onLoopEvent: function (event, data1, data2) {
        this.pluginSefVOD = SAMSUNG_OBJECTS.pluginSefVOD;
        switch (event) {
            case 14:
                //console.log("onLoopEvent :: " + event+":::"+data1+":::"+data2);
                break;
            case 8:
                if (ALARM_RUNNING == false) {
                    this.pluginSefVOD.Execute("Stop");
                } else {
                    this.pluginSefVOD.Execute("Stop");
                    this.pluginSefVOD.Execute("InitPlayer", alarm_url);
                    this.pluginSefVOD.Execute("Start", alarm_url);
                    this.pluginSefVOD.Execute("StartPlayback", 0);
                }
                break;
            default:
                break;
        }
    },
    stopAlarm: function () {
        this.pluginSefVOD.Execute("Stop");
    },
    getPowerState: function () {
        this.powerState = powerWidgetObject.Execute("GetPowerState");
        var standBy = null;
        switch (this.powerState) {
            case 0:
                standBy = true;
                break;
            case 1:
                standBy = false;
                break;
            default:
                break;
        }
        return standBy;
    },
    TVEventHandler: function (event, id, data) {
        switch (parseInt(id)) {
            case PL_TV_EVENT_CHANGE_POWER_STATE :
                /* To get current TV status */
                this.powerState = powerWidgetObject.Execute("GetPowerState");
                break;
            default:
                break;
        }
    },
    onWidgetEvent: function (event) {
        // if (event.type == Common.API.EVENT_ENUM.GET_WIDGET_INFO) {
        //     // The return value is event.data
        //     // stat=ok&[JSON data]   : id, title, ver, runTitle
        //    console.log("Player.onWidgetEvent() data :: " + event.data);
        // }
    },
    getHDMIConnectionState: function () {
        var HDMIState = null;
        var power = powerWidgetObject.Execute("GetPowerState");
        switch (power) {
            case 0:
                HDMIState = 0;
                break;
            case 1:
                HDMIState = 2;
                break;
            default:
                break;
        }

        return HDMIState;
    },
    changeSource: function (n) {
        var pluginObjectTVMW = this.pluginObjectTVMW;
        pluginObjectTVMW.SetSource(n);//31 = HDMI1, 48 = IPTV
    },
    mirrorScreen: function () {
        var pluginObjectSEF = this.pluginObjectSEF;
        pluginObjectSEF.Open("TaskManager", "1.000", "TaskManager");
        pluginObjectSEF.Execute("RunWIFIDisplay"); //RunWIFIDisplay will launch Screen Mirroring App.
        //pluginObjectSEF.Close();
    },
    bluetoothMusicPlayer: function () {
        var pluginObjectSEF = this.pluginObjectSEF;
        pluginObjectSEF.Open("HOTEL", "1.000", "HOTEL");
        pluginObjectSEF.Execute("RunHotelApp", "BtApp");//Run the BlueTooth player app
        //pluginObjectSEF.Close();
    },
    setVolume: function (v) {
        try {
            v = v > VOLUME_MAX ? VOLUME_MAX : v;
            v = v < VOLUME_MIN ? VOLUME_MIN : v;
            setGlobalVolumeNumber(v);
            this.pluginAudio.Open('Audio', '1.000', 'Audio');
            this.pluginAudio.Execute("SetVolume", v);
            this.pluginAudio.Close();
        } catch (a) {
           console.log("setVolume error :: " + a.message);
        }
    },
    setBrowser: function (b) {
        try {
            //Internet Browser Config or Open Web Browser

            // gSTB.SetMouseState(false);
            // Browser.SetToolbarState(false);
        } catch (a) {
           console.log(a.message);
        }
    },
    toggleMute: function () {
        try {
            this.pluginAudio.Open("Audio", "1.000", "Audio");
            this.isMute = this.pluginAudio.Execute("SetUserMute");
            this.isMute = (this.isMute == 1) ? 0 : 1;
            this.pluginAudio.Execute("SetUserMute", this.isMute);
            this.pluginAudio.Close();
            return this.isMute;
        } catch (a) {
           console.log("toggleMute error :: " + a.message);
        }
    },
    getIpAddress: function () {
        try {
            this.pluginSefNetwork.Open('Network', '1.000', 'Network');
            var IP = this.pluginSefNetwork.Execute("GetIP", "1");
            this.pluginSefNetwork.Close();
            return IP;
        } catch (a) {
           console.log("getIpAddress error :: " + a.message);
            return "127.0.0.1";
        }
    },
    getMacAddress: function () {
        try {
            this.pluginSefNetwork.Open('Network', '1.000', 'Network');
            var return_mac = this.pluginSefNetwork.Execute("GetMAC", "1");
            this.pluginSefNetwork.Close();
            var MAC = return_mac.replace(/(.{2})/g, "$1:").slice(0, -1);
            //var MAC = return_mac;
            return MAC;
        } catch (a) {
           console.log("GetMacAddress error :: " + a.message);
            return "00:00:00:00:00:00";
        }
    },
    getDeviceModel: function () {
        try {
            this.pluginObjectSEFTV.Open('TV', '1.000', 'TV');
            var TVModel = this.pluginObjectSEFTV.Execute("GetProductCode", 1);
            return TVModel;
        } catch (a) {
           console.log("GetDeviceModel error :: " + a.message);
        }
    },
    getDeviceVersionHardware: function () { //Ended here on 24th Wednesday 2018
        try {
            this.pluginObjectSEF.Open('Device', '1.000', 'Device');
            var Firmware = this.pluginObjectSEF.Execute('Firmware');
            return Firmware;

        } catch (a) {
           console.log("GetDeviceVersionHardware error :: " + a.message);
        }
    },
    getDeviceVendor: function () {
        try {
            return "samsung";
        } catch (a) {
           console.log("getDeviceVendor error :: " + a.message);
        }
    },
    getSerialNumber: function () {
        try {
            var DUID;
            this.pluginSefNetwork.Open('Network', '1.000', 'Network');
            var MAC = this.pluginSefNetwork.Execute("GetMAC", "1");
            this.pluginSefNetwork.Close();
            DUID = this.pluginNNavi.GetDUID(MAC);
            return DUID;
        } catch (a) {
           console.log("rtvGetSerialNumber error :: " + a.message);
            return "000000000000";
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
            this.document.location.href = a;
        } catch (b) {
           console.log("Player.loadUrl() error :: " + b.message);
        }
    },
    stop: function () {
        try {
            var pluginSefIPTV = this.pluginSefIPTV;
            var pluginSefVOD = this.pluginSefVOD;
            //Added by Yesh
            var videoURL = this.currentMrl;
            this.currentMrl = "";
            this.setPlayerState("STOP");
            //check udp or mp4
            var videoType = (videoURL.slice(-3) === "mp4") ? "mp4" : "udp";
            //videoType == UDP
            if (videoType == "udp") {
                pluginSefIPTV.Open("IPTV", 1.0, "IPTV");
                pluginSefIPTV.Execute("StopCurrentChannel", 0);
                pluginSefIPTV.Execute("FreeNowPlayingInfo", 0);
                pluginSefIPTV.Close();
            }
            //videoType == Mp4
            if (videoType == "mp4") {
                pluginSefVOD.Open("Player", "1.000", "Player");
                pluginSefVOD.Execute("Stop");
                pluginSefVOD.Close();
            }
        } catch (a) {
           console.log("Player.stop() error :: " + a.message);
        }
    },
    play: function (c, t) {
        try {
            if (c !== this.currentMrl) {
                //Added by Yesh
                var videoURL = c;
                //check udp or mp4
                var videoType = (videoURL.slice(-3) === "mp4") ? "mp4" : "udp";
                this.currentMrl = videoURL;
                //
                var pluginSefIPTV = this.pluginSefIPTV;
                var pluginSefTV = this.pluginSefTV;
                var pluginObjectTVMW = this.pluginObjectTVMW;
                var pluginSefVOD = this.pluginSefVOD;
                //videoType == UDP
                if (videoType == "udp") {
                    var URL_rtp = videoURL.replace("udp", "rtp");
                    var URL_src = URL_rtp.replace("@", "");
                    // // Add HW to end of the URL
                    // // Some AE TVs does not work without |HW
                    // // rtp://234.10.10.1:11000|HW
                    // URL_src = URL_src + "|HW";
                    pluginSefIPTV.Open("IPTV", "1.00", "IPTV");
                    //pluginSefIPTV.OnEvent = onEvent_SEF;
                    pluginSefTV.Open("TV", "1.000", "TV");
                    pluginSefTV.Execute("SetEvent", 126); //126 event is received whenever source is changed
                    if (parseInt(pluginObjectTVMW.GetSource(), 10) != PL_ISP_SOURCE) {
                        pluginObjectTVMW.SetSource(PL_ISP_SOURCE);
                    }
                    pluginSefIPTV.Execute("SIInit");
                    var ret1 = pluginSefIPTV.Execute("SetTuneURL", URL_src, 0);
                    this.setPlayerState("PLAYING");
                }
                //videoType == Mp4
                if (videoType == "mp4") {
                    pluginSefVOD.Open('Player', '1.000', 'Player');
                    //pluginSefVOD.OnEvent = onEvent_VOD;
                    if (parseInt(pluginObjectTVMW.GetSource(), 10) != PL_MEDIA_SOURCE) {
                        pluginObjectTVMW.SetSource(PL_MEDIA_SOURCE);
                    }
                    var ret1 = pluginSefVOD.Execute("InitPlayer", videoURL);
                    pluginSefVOD.Execute("Start", videoURL);
                    pluginSefVOD.Execute("StartPlayback", 0);
                    this.setPlayerState("PLAYING");
                }
            }
        } catch (a) {
           console.log("Player.play() error :: " + a.message);
        }
    },
    restart: function () {
        // gSTB.LoadURL("http://" + ip + "/client/index.html"); Soft Restart
        // window.location.href = "http://" + ip + "/" + APPNAME + "/client_samsungAE/";
        window.location.href = '';
    },
    reboot: function () {
        // var g_playHotel =  document.getElementById('pluginPower');
        // g_playHotel.Open("HOTEL", "1.000", "HOTEL");
        // g_playHotel.Execute("SetPowerReboot");
        try {
            // window.location.href = "http://" + ip + "/" + APPNAME + "/client_samsungAE/";
            this.pluginPower.Open("HOTEL", "1.000", "HOTEL");
            this.pluginPower.Execute("SetPowerReboot");
        } catch (a) {
           console.log(a.message);
        }
    },
    pause: function () {
        try {
            // if (this.getPlayerState() === "PAUSED") {
            //     this.resume();
            // } else {
            //     this.setPlayerState("PAUSED");
            //     gSTB.Pause();
            //     this.playerSpeedIndex = 0
            // }
        } catch (a) {
           console.log("Player.pause() error :: " + a.message);
        }
    },
    resume: function () {
        try {
            // this.setPlayerState("PLAYING");
            // this.playerSpeedIndex = 0;
            // gSTB.Continue();
        } catch (a) {
           console.log("Player.resume() error :: " + a.message);
        }
    },
    rewind: function (c) {
        try {
            // var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            // this.setPlayerState("REWIND");
            // gSTB.SetSpeed(-1 * b);
        } catch (a) {
           console.log("Player.rewind() error :: " + a.message);
        }
    },
    fforward: function (c) {
        try {
            // var b = c || this.playerSpeed[(this.playerSpeedIndex == (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            // this.setPlayerState("FFORWARD");
            // gSTB.SetSpeed(b);
        } catch (a) {
           console.log("Player.fforward() error :: " + a.message);
        }
    },
    runWidget: function (app_id, url) {
        /*******************************
         Apps            ID
         ********************************
         Facebook        11091000000
         Twitter        11091000001
         YouTube        11111000010
         Picasa            11101000000
         Google Talk        11111000005
         Accuweather    11101000001
         WebBrowser    29_fullbrowser
         Play Jam        11111310601
         *******************************/
        try {
            this.widgetAPI.runSearchWidget(app_id, url);
        } catch (a) {
           console.log("Player.runWidget() error :: " + a.message);
        }
    },
    seekPDL: function (a) {
        try {
            // this.player.seekPDL(a);
        } catch (b) {
           console.log("Player.seekPDL() error :: " + b.message);
        }
    },
    getPosition: function () {
        var a = 0;
        try {
            // a = PVR.GetPltInfo();
        } catch (b) {
           console.log("Player.getPosition() error :: " + b.message);
        }
        return a;
    },
    setPosition: function (a) {
        try {
            // this.player.setPosition(a);
        } catch (b) {
           console.log("Player.setPosition() error :: " + b.message);
        }
    },
    getDuration: function () {
        var b = 0;
        try {
            // b = gSTB.GetDuration();
        } catch (a) {
           console.log("Player.getDuration() error :: " + a.message);
        }
        return b;
    },
    toggleWinMode: function (t) {
        try {
            // this.winMode = (t == "clip") ? 1 : 0;
            // gSTB.SetTopWin(this.winMode);
        } catch (a) {
           console.log("toggleWinMode error :: " + a.message);
        }
    },
    setClipScreen: function (c, mrl) {
        try {
            //Added by Yesh
            var videoURL = mrl;
            //check udp or mp4
            var videoType = (videoURL.slice(-3) === "mp4") ? "mp4" : "udp";
            // if arabic
            var browser_width = SCREEN_WIDTH;
            if (DEFAULT_DIRECTION == "rtl") {
                CLIP_XX = (browser_width - (CLIP_W + CLIP_X));
            } else {
                CLIP_XX = CLIP_X;
            }
            //

            //videoType == UDP
            if (videoType == "udp") {
                var pluginSefIPTV = this.pluginSefIPTV;
                //var CLIP_X = 200;
                //var CLIP_Y = 300;
                //var CLIP_W = 520;
                //var CLIP_H = 360;
                //
                var xx = CLIP_XX;
                var yy = CLIP_Y;
                var ww = CLIP_W;
                var hh = CLIP_H;
                //
                //var xx = CLIP_X;
                //var yy = CLIP_Y;
                //var ww = CLIP_W;
                //var hh = CLIP_H;
                //
                var x = (1920 / 1280) * xx;
                var y = (1080 / 720) * yy;
                var w = (1920 / 1280) * ww;
                var h = (1080 / 720) * hh;
                //
                pluginSefIPTV.Execute('SetPlayerWindow', 0, x, y, w, h);
            }
            //videoType == Mp4
            if (videoType == "mp4") {
                var pluginSefVOD = this.pluginSefVOD;
                //var CLIP_X = 200;
                //var CLIP_Y = 300;
                //var CLIP_W = 520;
                //var CLIP_H = 360;
                //
                var xx = CLIP_XX;
                var yy = CLIP_Y;
                var ww = CLIP_W;
                var hh = CLIP_H;
                //
                //var xx = CLIP_X;
                //var yy = CLIP_Y;
                //var ww = CLIP_W;
                //var hh = CLIP_H;
                //
                var x = (960 / 1280) * xx;
                var y = (540 / 720) * yy;
                var w = (960 / 1280) * ww;
                var h = (540 / 720) * hh;
                //
                pluginSefVOD.Execute('SetDisplayArea', x, y, w, h);
            }
        } catch (a) {
           console.log("Player.setClipScreen() error :: " + a.message);
            result = false;
        }
    },
    setClipScreenMin: function () {
        try {
            // this.setAlphaLevel(OPAQUE_LEVEL);
        } catch (a) {
           console.log(a.message);
        }
    },
    setFullScreen: function (mrl) {
        try {
            //Added by Yesh
            //var videoURL = (typeof mrl == "undefined") ? ChannelManager.getCurrentChannel().url : mrl;
            var videoURL = mrl;
            //check udp or mp4
            var videoType = (videoURL.slice(-3) === "mp4") ? "mp4" : "udp";
            //videoType == UDP
            if (videoType == "udp") {
                var pluginSefIPTV = this.pluginSefIPTV;
                pluginSefIPTV.Execute("SetPlayerWindow", 0, 0, 0, 1920, 1080);
            }
            //videoType == Mp4
            if (videoType == "mp4") {
                var pluginSefVOD = this.pluginSefVOD;
                pluginSefVOD.Execute('SetDisplayArea', 0, 0, 1280, 720);
            }
        } catch (a) {
           console.log("Player.setFullScreen() error :: " + a.message);
            result = false;
        }
    },
    getBrowserResolution: function () {
        var a = [];
        try {
            //a['height'] = screen.height;
            a['height'] = 720;
            //a['height'] = 1080;
            //a['width'] = screen.width;
            a['width'] = 1280;
            //a['width'] = 1920;
            return a;
        } catch (d) {
            return a;
        }
    },
    removeCache: function () {
        // try {
        //     Browser.CacheFlush();
        // } catch (b) {
        //    console.log(b.message);
        // }
    },
    setAlphaLevel: function (b) {
        // try {
        //     VideoDisplay.SetAlphaLevel(b);
        // } catch (a) {
        //    console.log(a.message);
        // }
    },
    setOutputResolution: function (a) {
        // try {
        //     this.player.setOutputResolution(2, level);
        // } catch (b) {
        //    console.log(b.message);
        // }
    },
    setChromaKey: function (a) {
        // try {
        //     VideoDisplay.SetChromaKey(a);
        // } catch (b) {
        //    console.log(b.message);
        // }
    },
    printDebugMessage: function (b) {
        // try {
        //     gSTB.DebugString(b);
        // } catch (a) {
        //    console.log(a.message);
        // }
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
    listenerEventHandler: function () {
        //var c = stbEvent.event;
        //switch (c) {
        //    case 32://tv on
        //ScreenManager.load("MENU");
        // gSTB.StandBy(0);//stb on
        //break;
        //case 33://tv off
        // stbEvent.event = 0;
        //ScreenManager.load("MENU");
        // gSTB.StandBy(1);//stb off
        //break;
        //}
        // stbEvent.event = 0;
        // globalFireEvent(new Event("NOTIFICATION", {
        // message: a
        // }))
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
    }
};