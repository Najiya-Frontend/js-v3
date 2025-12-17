var _stateMedia = null;
var _media = null;
var _media_status = 0;
var _stream_status = 0;
var current_pipeline = 0;
var hcap_js_version = "0.00";
var hcap_mware_version = "0.00";
var tokenList = [
    {
        "id": "netflix",
        "token": "uVekcOmdwugQzPj9XM3vg36EoAEmQrloUKuWVHTS8/L1zHczcfMCiRc46+rwzONkDuW8cZmzKhfEP/Y+KrRytvz7+SJ1YOZ5xSvcXdSNuSNyT3yUnqQCh/310TUFk7cB1NYaq0bZTcemaxyzkDSOLHC02gOXh8ZRT0KpcmJa9KXWYS3PF32fzU3gcznPQaVXgB5B5SaESxShxkteGpcaX4YGLfiJeeRMl2sLbuUeCB2XiiZ4PlfDsABd57M3cCs5zroOmtyI58TcRoRuIHFIahesGqRUYTjMWXVZXl1YVYALe+mRXOkbKRJmJuYy2nEBri0klWLYhcpHm7wDcA/seQ=="
    }
];

/**
 * setBrowserDebugMode
 */
function setBrowserDebugMode() {
    var param1 = {
        "debugMode": IS_DEV_MOD,
        "onSuccess": function () {
            console.log("setBrowserDebugMode :: onSuccess");
           console.log("setBrowserDebugMode :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("setBrowserDebugMode :: onFailure : errorMessage = " + f.errorMessage);
           console.log("setBrowserDebugMode :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.system.setBrowserDebugMode(param1);
}

/**
 * idcapModelCheck
 * @param model_name
 */
function idcapModelCheck(model_name) {
    var param1 = {
        "parameters": {
            "key": model_name
        },
        "onSuccess": function (cbObject) {
            console.log("onSuccess cbObject = " + JSON.stringify(cbObject));
        },
        "onFailure": function (err) {
            console.log("onFailure : errorMessage = " + err.errorMessage);
        }
    };
    idcap.request("idcap://configuration/property/get", param1);
}

/**
 * showToastMessage
 * @param text_message
 */
function showToastMessage(text_message) {
    var param1 = {
        "message": text_message,
        "onSuccess": function () {
            console.log("onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.system.showToastMessage(param1);
}

function clearKeyTable() {
    var param1 = {
        "onSuccess": function () {
            console.log("clearKeyTable : onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.key.clearKeyTable(param1);
}

function rc_addKeyItem() {
    //
    clearKeyTable();

    // change Input key
    var param1 = {
        "keycode": 0x00000000,
        "virtualKeycode": hcap.key.Code.INPUT,
        //"attribute" :0, //Processed by TV
        "attribute": 2, //Processed by application
        "onSuccess": function () {
            console.log("rc_addKeyItem :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.key.addKeyItem(param1);

    // change Applications key
    var param2 = {
        "keycode": 0x00000000,
        "virtualKeycode": hcap.key.Code.APPS,
        //"attribute" :0, //Processed by TV
        "attribute": 2, //Processed by application
        "onSuccess": function () {
            console.log("rc_addKeyItem :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.key.addKeyItem(param2);

    // change Smart home key
    var param3 = {
        "keycode": 0x00000000,
        "virtualKeycode": hcap.key.Code.SMART_HOME,
        //"attribute" :0, //Processed by TV
        "attribute": 2, //Processed by application
        "onSuccess": function () {
            console.log("rc_addKeyItem :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.key.addKeyItem(param3);

    // change Alarm key
    var param4 = {
        "keycode": 0x00000000,
        "virtualKeycode": hcap.key.Code.ALARM,
        //"attribute" :0, //Processed by TV
        "attribute": 2, //Processed by application
        "onSuccess": function () {
            console.log("rc_addKeyItem :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.key.addKeyItem(param4);

    // change Portal key
    var param5 = {
        "keycode": 0x00000000,
        "virtualKeycode": hcap.key.Code.PORTAL,
        //"attribute" :0, //Processed by TV
        "attribute": 2, //Processed by application
        "onSuccess": function () {
            console.log("rc_addKeyItem :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.key.addKeyItem(param5);

    // change List key
    var param6 = {
        "keycode": 0x00000000,
        "virtualKeycode": hcap.key.Code.LIST,
        //"attribute" :0, //Processed by TV
        "attribute": 2, //Processed by application
        "onSuccess": function () {
            console.log("rc_addKeyItem :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.key.addKeyItem(param6);
}

function getHotelMode() {
    var param1 = {
        "onSuccess": function (s) {
            console.log("onSuccess : hotel mode settings = " + s.hotelMode);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.property.getHotelMode(param1);
}

function setHotelMode(b) {
    if (!IS_DEV_MOD) {
        b = (b) ? "on" : "off";
        var param1 = {
            "hotelMode": "{ \"enable\": \"" + b + "\", \"settings\": { \"powerOnStatus\": \"stand_by\", \"volume\": { \"enable\": \"on\", \"settings\": { \"startVolume\": { \"enable\": \"off\", \"level\": " + VOLUME_CONFIG + " }, \"minimumVolume\": " + VOLUME_MIN + ", \"maximumVolume\": " + VOLUME_MAX + " } }, \"keyManagement\": { \"enable\": \"on\", \"settings\": { \"irOperation\": \"normal\", \"localKeyOperation\": \"normal\" } }, \"limitedMode\": { \"enable\": \"on\", \"settings\": { \"setupMenu\": \"off\", \"programmeChange\": \"off\", \"menuDisplay\": \"off\", \"osdDisplay\": \"off\", \"systemProviderMode\": \"off\" } }, \"dtvProgrammeUpdate\": \"Manual\", \"powerOnDefault\": { \"enable\": \"off\", \"settings\": { \"input\": \"off\", \"programme\": \"2\", \"avSetting\": \"off\", \"aspectRatio\": \"disable\" } }, \"auxSourceSetting\": { \"enable\": \"off\", \"settings\": [ { \"av1\": \"on\" }, { \"av2\": \"on\" }, { \"av3\": \"on\" }, { \"rgb\": \"on\" }, { \"comp1\": \"on\" }, { \"comp2\": \"on\" }, { \"comp3\": \"on\" }, { \"hdmi1\": \"on\" }, { \"hdmi2\": \"on\" }, { \"hdmi3\": \"on\" }, { \"hdmi4\": \"on\" } ] }, \"powerManagement\": \"off\", \"radioVideoBlank\": { \"enable\": \"off\", \"settings\": { \"startOfRadioProgramme\": 1, \"countOfRadioProgramme\": 1 } } } }",
            "onSuccess": function () {
                console.log("Success to set hotel mode");
               console.log("Success to set hotel mode");
            },
            "onFailure": function (f) {
                console.log("Fail to set hotel mode: " + f.errorMessage);
               console.log("Fail to set hotel mode: " + f.errorMessage);
            }
        };
        hcap.property.setHotelMode(param1);
    }
}

/**
 * setProperties
 */
function setProperties() {
    // set Instant Mode
    setInstantMode("2");

    //
    var param1 = {
        "key": "tv_channel_attribute_floating_ui",
        "value": "0",
        "onSuccess": function () {
            console.log("onSuccess : tv_channel_attribute_floating_ui");
           console.log("onSuccess : tv_channel_attribute_floating_ui");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.property.setProperty(param1);

    //
    var param2 = {
        "key": "boot_sequence_option",
        "value": "1",
        "onSuccess": function () {
            console.log("onSuccess : boot_sequence_option");
           console.log("onSuccess : boot_sequence_option");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.property.setProperty(param2);

    //
    var param3 = {
        "key": "mute_on_tv_input",
        "value": "1",//TV AV is mute.
        "onSuccess": function () {
            console.log("onSuccess : mute_on_tv_input");
           console.log("onSuccess : mute_on_tv_input");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.property.setProperty(param3);

    //
    var param4 = {
        "key": "screensaver_control",
        "value": "1",
        "onSuccess": function () {
            console.log("onSuccess : screensaver_control");
           console.log("onSuccess : screensaver_control");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.property.setProperty(param4);

    //
    var param5 = {
        "key": "smart_share",
        "value": "1",
        "onSuccess": function () {
            console.log("onSuccess : smart_share");
           console.log("onSuccess : smart_share");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.property.setProperty(param5);

    //
    var param6 = {
        "key": "wifi_screen_share",
        "value": "1",
        "onSuccess": function () {
            console.log("onSuccess : wifi_screen_share");
           console.log("onSuccess : wifi_screen_share");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.property.setProperty(param6);

    // set Hotel Mode
    setHotelMode(false);
}

function setDisplayResolutionProperty() {
    var resolution = "1920x1080";
    if (BROWSER_RESOLUTION === "720p") {
        resolution = "1280x720";
    }
    var param3 = {
        "key": "display_resolution",
        "value": resolution,//"1280x720" Or "1920x1080"
        "onSuccess": function () {
            console.log("onSuccess : display_resolution");
           console.log("setProperty : display_resolution :: onSuccess");
        },
        "onFailure": function (f) {
           console.log("setProperty : display_resolution :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.property.setProperty(param3);
}

function setPowerMode(mode) {
    hcap.power.setPowerMode({
        "mode": mode,
        "onSuccess": function () {
            console.log("Success to set power mode : " + mode);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function setInstantMode(mode) {
    // Instant On Reboot = 1, Instant On Mute = 2
    hcap.property.setProperty({
        "key": "instant_power",
        "value": mode,
        "onSuccess": function () {
            console.log("set Instant Mode " + mode);
           console.log("set Instant Mode " + mode);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function setWOL(mode) {
    hcap.property.setProperty({
        "key": "wol_m",
        "value": mode,
        "onSuccess": function () {
            console.log("set WOL " + mode);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function show_tv_current_status_of_the_power() {
    hcap.property.getProperty({
        "key": "instant_power",
        "onSuccess": function (s) {
            console.log("instant_power = " + s.value);
            if (s.value === 0)
                hcap.property.getProperty({
                    "key": "wol_m",
                    "onSuccess": function (s) {
                        console.log("wol_m = " + s.value);
                    },
                    "onFailure": function (f) {
                        console.log("onFailure : errorMessage = " + f.errorMessage);
                    }
                });
            else
                console.log("WOL is disalbed because Instant mode is on");

        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
    //
    getPowerMode();
}

function getPowerMode() {
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    var param1 = {
        "onSuccess": function (s) {
            console.log("onSuccess power mode " + s.mode);
            //normal
            if (s.mode === 1) {
                DEVICE_STANDBY = false;
                if (($thisPage) && ($thisPage.pageID === "KEY_TV" && $thisPage.pageID === "KEY_XTV")) {
                    AppWidgets.widget_channelList.init();
                } else {
                    // $thisPage.changePage("KEY_HOME");
                }
                //
                if (AppWidgets.widget_promoBox) {
                    AppWidgets.widget_promoBox.initPromoBox();
                }
            }
            // standby
            if (s.mode === 2) {
                DEVICE_STANDBY = true;
                // $thisPage.changePage("KEY_HOME");
                if (AppWidgets.widget_promoBox) {
                    AppWidgets.widget_promoBox.unInit();
                }
                //get Volume Level
                getVolumeLevel();
            }
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.power.getPowerMode(param1);
}

function isWarmUpdate() {
    var param1 = {
        "onSuccess": function (s) {
            console.log("onSuccess : is warm update = " + s.isWarmUpdate);
            //var onSucess_txt = "onSuccess : is warm update = " + s.isWarmUpdate;
            //showToastMessage(onSucess_txt);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.power.isWarmUpdate(param1);
}

function reboot() {
    var param1 = {
        "onSuccess": function () {
            console.log("Success to reboot");
        },
        "onFailure": function (f) {
            console.log("Fail to reboot : " + f.errorMessage);
        }
    };
    hcap.power.reboot(param1);
}

function reload() {
    document.location.reload(true);
}

function powerOff() {
    var param1 = {
        "onSuccess": function () {
            console.log("onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.power.powerOff(param1);
}

function registerSIApplicationList(list) {
    var param1 = {
        "tokenList": list,
        "onSuccess": function (s) {
            console.log("onSuccess RegisterSIApplicationList: App registered!");
        },
        "onFailure": function (f) {
            console.log("onFailure RegisterSIApplicationList: reason = " + f.errorMessage);
        }
    };
    hcap.application.RegisterSIApplicationList(param1);
}

/**
 * getProperty
 * @param v
 * @param callback
 */
function getProperty(v, callback) {
    var param1 = {
        "key": v,
        "onSuccess": function (s) {
            console.log("onSuccess : " + v + " :: property value = " + s.value);
           console.log("getProperty : " + v + " :: onSuccess : property value = " + s.value);
            callback(s.value);
        },
        "onFailure": function (f) {
            console.log("onFailure : " + v + " :: errorMessage = " + f.errorMessage);
           console.log("getProperty : " + v + " :: onFailure : errorMessage = " + f.errorMessage);
        }
    }
    hcap.property.getProperty(param1);
}

/**
 * getMemoryUsage
 */
function getMemoryUsage() {
    var param1 = {
        "onSuccess": function (param) {
            console.log("onSuccess : percentage of used memory = " + param.percentage + "free memory = " + param.freememory + "total memory = " + param.totalmemory);
            var onSucess_txt = "onSuccess : percentage of used memory = " + param.percentage + "free memory = " + param.freememory + "total memory = " + param.totalmemory;
            showToastMessage(onSucess_txt);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.system.getMemoryUsage(param1);
}

/**
 * setOsdTransparencyLevel
 * @param l
 */
function setOsdTransparencyLevel(l) {
    var param1 = {
        "level": l,
        "onSuccess": function () {
            console.log("onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.video.setOsdTransparencyLevel(param1);
}

/**
 * getOsdTransparencyLevel
 */
function getOsdTransparencyLevel() {
    var param1 = {
        "onSuccess": function (s) {
            console.log("onSuccess : level = " + s.level);
            //var onSucess_txt = "onSuccess : level = " + s.level;
            //showToastMessage(onSucess_txt);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.video.getOsdTransparencyLevel(param1);
}

/**
 * getCpuUsage
 */
function getCpuUsage() {
    var param1 = {
        "onSuccess": function (param) {
            console.log("onSuccess : percentage of used CPU resource = " + param.percentage);
            //var onSucess_txt = "onSuccess : percentage of used CPU resource = " + param.percentage;
            //showToastMessage(onSucess_txt);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.system.getCpuUsage(param1);
}

/**
 * preloadedApplication
 * @param preId
 */
function preloadedApplication(preId, appName) {
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    var param = {
        "id": preId,
        "onSuccess": function () {
            console.log("onSuccess :: preloadedApplication");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
            if (($thisPage) && ($thisPage.waitForCallback)) {
                // globalFireEvent(new Event("KEY_BACK", {}));
                setGlobalNotification(LANG.msg_27, true);
                $thisPage.waitForCallback = false;
                $thisPage.isHidden = false;
                $thisPage.isExternalInput = false;
                $thisPage.isAppFocused = true;
                $thisPage.toggleAppVisibility(true);
            }
        }
    };
    if (appName === "NETFLIX") {
        param = {
            "id": preId,
            "parameters": "{'reason':'launcher','params':{'hotel_id':1,'launcher_version':'1.0'}}",
            "onSuccess": function () {
                console.log("onSuccess :: preloadedApplication");
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
                if (($thisPage) && ($thisPage.waitForCallback)) {
                    // globalFireEvent(new Event("KEY_BACK", {}));
                    setGlobalNotification(LANG.msg_27, true);
                    $thisPage.waitForCallback = false;
                    $thisPage.isHidden = false;
                    $thisPage.isExternalInput = false;
                    $thisPage.isAppFocused = true;
                    $thisPage.toggleAppVisibility(true);
                }
            }
        };
    }
    hcap.preloadedApplication.launchPreloadedApplication(param);
}

/**
 * getPreloadedApplicationList
 */
function getPreloadedApplicationList() {
    var param = {
        "onSuccess": function (s) {
            console.log("onSuccess : list length = " + s.list.length);
            for (var i = 0; i < s.list.length; i++) {
                console.log(
                    "list[" + i + "].id = " + s.list[i].id +
                    "list[" + i + "].title = " + s.list[i].title +
                    "list[" + i + "].iconFilePath = " + s.list[i].iconFilePath
                );
            }
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.preloadedApplication.getPreloadedApplicationList(param);
}

/**
 * destroyPreloadedApplication
 * @param preId
 */
function destroyPreloadedApplication(preId) {
    var param = {
        "id": preId,
        "onSuccess": function () {
            console.log("onSuccess :: destroyPreloadedApplication");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.preloadedApplication.destroyPreloadedApplication(param);
}

/**
 * Set Streaming video size
 * @param x
 * @param y
 * @param w
 * @param h
 */
function setVideoSize(x, y, w, h) {
    hcap.video.setVideoSize({
        "x": x,
        "y": y,
        "width": w,
        "height": h,
        "onSuccess": function () {
            console.log("onSuccess : setVideoSize");
           console.log("onSuccess : setVideoSize");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

/**
 * shutDown
 * 1._media.stop , 2._media.destroy , 3.hcap.Media.shutDown
 */
function shutDown() {
    if (_media != null) {
        _media.stop({
            "onSuccess": function () {
                console.log("shutDown : _media.stop :: onSuccess");
                top.kwDebugConsole.print("shutDown : _media.stop :: onSuccess");
                _media.destroy({
                    "onSuccess": function () {
                        console.log("shutDown : _media.destroy :: onSuccess");
                        top.kwDebugConsole.print("shutDown : _media.destroy :: onSuccess");
                        hcap.Media.shutDown({
                            "onSuccess": function () {
                                console.log("shutDown : Media.shutDown :: onSuccess");
                                top.kwDebugConsole.print("shutDown : Media.shutDown :: onSuccess");
                                _media_status = 0; //stop
                            },
                            "onFailure": function (f) {
                                console.log("onFailure : errorMessage = " + f.errorMessage);
                                top.kwDebugConsole.print("shutDown : Media.shutDown :: onFailure : errorMessage = " + f.errorMessage);
                                _media_status = 0; //stop
                            }
                        });
                    },
                    "onFailure": function (f) {
                        console.log("onFailure : errorMessage = " + f.errorMessage);
                        top.kwDebugConsole.print("shutDown : _media.destroy :: onFailure : errorMessage = " + f.errorMessage);
                    }
                });
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
                top.kwDebugConsole.print("shutDown : _media.stop :: onFailure : errorMessage = " + f.errorMessage);
            }
        });
    } else {
        console.log("log: _media is null");
    }
}

/**
 * stopMedia
 * 1._media.stop , 2._media.destroy
 */
function stopMedia() {
    if (_media != null) {
        _media.stop({
            "onSuccess": function () {
                console.log("stopMedia : _media.stop :: onSuccess");
                top.kwDebugConsole.print("stopMedia : _media.stop :: onSuccess");
                _media.destroy({
                    "onSuccess": function () {
                        console.log("stopMedia : _media.destroy :: onSuccess");
                        top.kwDebugConsole.print("stopMedia : _media.destroy :: onSuccess");
                    },
                    "onFailure": function (f) {
                        console.log("onFailure : errorMessage = " + f.errorMessage);
                        top.kwDebugConsole.print("stopMedia : _media.destroy :: onFailure : errorMessage = " + f.errorMessage);
                    }
                });
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
                top.kwDebugConsole.print("stopMedia : _media.stop :: onFailure : errorMessage = " + f.errorMessage);
            }
        });
    } else {
        console.log("log: _media is null");
    }
}

/**
 * stopChannel
 */
function stopChannel() {
    var param1 = {
        "onSuccess": function () {
            console.log("stopChannel : stopCurrentChannel :: onSuccess");
            top.kwDebugConsole.print("stopChannel : stopCurrentChannel :: onSuccess");
            _stream_status = 0; //stop
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
            top.kwDebugConsole.print("stopChannel : stopCurrentChannel :: onFailure : errorMessage = " + f.errorMessage);
            _stream_status = 0; //stop
        }
    };
    hcap.channel.stopCurrentChannel(param1);
}

/**
 * playMedia
 * 1._media.stop , 2._media.destroy , 3.hcap.Media.createMedia, 4._media.play
 * @param srcVideo
 * @param mimeType
 */
function playMedia(srcVideo, mimeType) {
    if (!mimeType) mimeType = "video/mp4";
    if (_media_status === 0) {
        _media.stop({
            "onSuccess": function () {
                console.log("onSuccess");
                _media.destroy({
                    "onSuccess": function () {
                        console.log("onSuccess");
                        _media = hcap.Media.createMedia({
                            "url": srcVideo,
                            "mimeType": mimeType
                        });
                        console.log("Media.createMedia = " + _media);
                        _media.play({
                            "repeatCount": 0,
                            "onSuccess": function () {
                                console.log("onSuccess : playMedia -> " + srcVideo);
                                _media_status = 1; //play
                            },
                            "onFailure": function (f) {
                                console.log("onFailure : errorMessage = " + f.errorMessage);
                                _media_status = 0; //stop
                            }
                        });
                    },
                    "onFailure": function (f) {
                        console.log("onFailure : errorMessage = " + f.errorMessage);
                    }
                });
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
            }
        });
    } else {
        // setTimeout(playMedia, 500, srcVideo, mimeType);
    }
}

/**
 * playVOD
 * 1.hcap.Media.startUp , 2.hcap.Media.createMedia , 3._media.play
 * @param srcVideo
 * @param mimeType
 */
function playVOD(srcVideo, mimeType) {
    if (!mimeType) mimeType = "video/mp4";
    // stopChannel();
    if (_media_status === 0) {
        hcap.Media.startUp({
            "onSuccess": function () {
                console.log("playVOD : Media.startUp :: onSuccess");
                top.kwDebugConsole.print("playVOD : Media.startUp :: onSuccess");
                _media = hcap.Media.createMedia({
                    "url": srcVideo,
                    "mimeType": mimeType
                });
                console.log("Media.createMedia = " + _media);
                _media.play({
                    "repeatCount": 300,
                    "onSuccess": function () {
                        console.log("playVOD : _media.play :: onSuccess -> " + srcVideo);
                        top.kwDebugConsole.print("playVOD : _media.play :: onSuccess");
                        _media_status = 1; //play
                    },
                    "onFailure": function (f) {
                        console.log("onFailure : errorMessage = " + f.errorMessage);
                        top.kwDebugConsole.print("playVOD : _media.play :: onFailure : errorMessage = " + f.errorMessage);
                        _media_status = 0; //stop
                    }
                });
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
                top.kwDebugConsole.print("playVOD : Media.startUp :: onFailure : errorMessage = " + f.errorMessage);
            }
        });
    } else {
        // setTimeout(playVOD, 500, srcVideo, mimeType);
    }
}

/**
 * playIPChannel
 * @param ip
 * @param port
 */
function playIPChannel(ip, port) {
    var param = {
        "channelType": hcap.channel.ChannelType.IP,
        "ip": ip,
        "port": parseInt(port),
        "ipBroadcastType": hcap.channel.IpBroadcastType.UDP,
        "onSuccess": function () {
            console.log("playIPChannel : requestChangeCurrentChannel : onSuccess");
            top.kwDebugConsole.print("playIPChannel : requestChangeCurrentChannel : onSuccess");
            _stream_status = 1; //play
        },
        "onFailure": function (f) {
            console.log("playIPChannel : requestChangeCurrentChannel : onFailure : errorMessage = " + f.errorMessage);
            top.kwDebugConsole.print("playIPChannel : - :: onFailure : errorMessage = " + f.errorMessage);
            _stream_status = 0; //stop
        }
    };
    hcap.channel.requestChangeCurrentChannel(param);
}

/**
 * playRFChannel
 * @param logicalNumber
 */
function playRFChannel(logicalNumber) {
    // RF channel class 1 change request
    var param = {
        "channelType": hcap.channel.ChannelType.RF,
        "logicalNumber": logicalNumber,
        "rfBroadcastType": hcap.channel.RfBroadcastType.TERRESTRIAL,
        "onSuccess": function () {
            console.log("onSuccess : playRFChannel logicalNumber = " + logicalNumber);
        },
        "onFailure": function (f) {
            console.log("onFailure : logicalNumber = " + logicalNumber + ", errorMessage = " + f.errorMessage);
        }
    };
    hcap.channel.requestChangeCurrentChannel(param);
}

/**
 * playATSCChannel
 * @param major
 * @param minor
 */
function playATSCChannel(major, minor) {
    // RF channel class 3 change request
    var param = {
        "channelType": hcap.channel.ChannelType.RF,
        "majorNumber": parseInt(major),
        "minorNumber": parseInt(minor),
        "rfBroadcastType": hcap.channel.RfBroadcastType.TERRESTRIAL,
        "onSuccess": function () {
            console.log("onSuccess : playATSCChannel majorNumber = " + major + ", minorNumber = " + minor);
        },
        "onFailure": function (f) {
            console.log("onFailure : majorNumber = " + major + ", minorNumber = " + minor + ", errorMessage = " + f.errorMessage);
        }
    };
    hcap.channel.requestChangeCurrentChannel(param);
}

/**
 * playDvbtChannel
 * @param frequency
 * @param programNumber
 */
function playDvbtChannel(frequency, programNumber) {
    // RF channel class 2 change request
    var param = {
        "channelType": hcap.channel.ChannelType.RF,
        "frequency": parseInt(frequency * 1000000),
        "programNumber": programNumber,
        "rfBroadcastType": hcap.channel.RfBroadcastType.TERRESTRIAL,
        "onSuccess": function () {
            console.log("onSuccess : playDvbtChannel frequency = " + frequency + ", programNumber = " + programNumber);
        },
        "onFailure": function (f) {
            console.log("onFailure : frequency = " + frequency + ", programNumber = " + programNumber + ", errorMessage = " + f.errorMessage);
        }
    };
    hcap.channel.requestChangeCurrentChannel(param);
}

/**
 * getChannelMap
 */
function getChannelMap() {
    hcap.channel.getChannelMap({
        "onSuccess": function (s) {
            console.log("onSuccess : list length = " + s.list.length);
            for (var i = 0; i < s.list.length; i++) {
                console.log(
                    "[" + i + "].img_url2 = " + s.list[i].img_url2 +
                    "[" + i + "].img_url = " + s.list[i].img_url +
                    "[" + i + "].short_cut = " + s.list[i].short_cut +
                    "[" + i + "].channel_type = " + s.list[i].channel_type +
                    "[" + i + "].channel_mode_id = " + s.list[i].channel_mode_id +
                    "[" + i + "].channel_number = " + s.list[i].channel_number +
                    "[" + i + "].channel_name = " + s.list[i].channel_name
                );
            }
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

/**
 * getCurrentChannel
 */
function getCurrentChannel() {
    var param1 = {
        "onSuccess": function (s) {
            console.log("getCurrentChannel :: onSuccess :" +
                "\n channel status    : " + s.channelStatus +
                "\n channel type      : " + s.channelType +
                "\n logical number    : " + s.logicalNumber +
                "\n frequency         : " + s.frequency +
                "\n program number    : " + s.programNumber +
                "\n major number      : " + s.majorNumber +
                "\n minor number      : " + s.minorNumber +
                "\n satellite ID      : " + s.satelliteId +
                "\n polarization      : " + s.polarization +
                "\n rf broadcast type : " + s.rfBroadcastType +
                "\n ip                : " + s.ip +
                "\n port              : " + s.port +
                "\n ip broadcast type : " + s.ipBroadcastType +
                "\n symbol rate       : " + s.symbolRate +
                "\n pcr pid           : " + s.pcrPid +
                "\n video pid         : " + s.videoPid +
                "\n video stream type : " + s.videoStreamType +
                "\n audio pid         : " + s.audioPid +
                "\n audio stream type : " + s.audioStreamType +
                "\n signal strength   : " + s.signalStrength +
                "\n source address    : " + s.sourceAddress);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("getCurrentChannel :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.channel.getCurrentChannel(param1);
}

/**
 * bluetoothScanSet
 * @param a
 */
function bluetoothScanSet(a) {
    var param = {
        "visible": true,
        "connectable": true,
        "onSuccess": function () {
            bluetoothStatus = true;
            console.log("bluetoothScanSet :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("bluetoothScanSet :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.bluetooth.setScanState(param);
}

/**
 * bluetoothSoundSyncSet
 * @param b
 */
function bluetoothSoundSyncSet(b) {
    var param = {
        "enable": b,
        "onSuccess": function () {
            bluetoothStatus = false;
            console.log("bluetoothSoundSyncSet :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("bluetoothSoundSyncSet :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.bluetooth.setBluetoothSoundSync(param);
}

/**
 * getCurrentExternalInput
 */
function getCurrentExternalInput() {
    var param1 = {
        "onSuccess": function (s) {
            console.log("onSuccess :" + "\n type = " + s.type + "\n index = " + s.index);
           console.log("getCurrentExternalInput :: onSuccess :" + "\n type = " + s.type + "\n index = " + s.index)
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
           console.log("getCurrentExternalInput :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.externalinput.getCurrentExternalInput(param1);
}

/**
 * isExternalInputConnected
 * @param type
 * @param index
 * @param callback
 */
function isExternalInputConnected(type, index, callback) {
    var param = {
        "type": type,
        "index": index,
        "onSuccess": function (s) {
            console.log("isExternalInputConnected :: onSuccess " + s.isConnected);
           console.log("isExternalInputConnected :: onSuccess " + s.isConnected);
            callback(s.isConnected);
        },
        "onFailure": function (f) {
            console.log("isExternalInputConnected :: onFailure : errorMessage = " + f.errorMessage);
           console.log("isExternalInputConnected :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.externalinput.isExternalInputConnected(param);
}

/**
 * changeSourceHDMI
 * @param port
 */
function changeSourceHDMI(port) {
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    //
    var source = hcap.externalinput.ExternalInputType.HDMI;
    var param = {
        "type": source,
        "index": port,
        "onSuccess": function () {
            console.log("changeSourceHDMI :: onSuccess");
           console.log("changeSourceHDMI : setCurrentExternalInput :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("changeSourceHDMI :: onFailure : errorMessage = " + f.errorMessage);
           console.log("changeSourceHDMI : setCurrentExternalInput :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    //
    isExternalInputConnected(source, port, function (b) {
        if (!b) {
            setGlobalNotification(LANG.msg_25, true);
            $thisPage.waitForCallback = false;
            $thisPage.isHidden = false;
            $thisPage.isExternalInput = false;
            $thisPage.isAppFocused = true;
            $thisPage.toggleAppVisibility(true);
        } else {
            hcap.externalinput.setCurrentExternalInput(param);
        }
    });
    //
}

/**
 * changeSourceTV
 * @param port
 */
function changeSourceTV(port) {
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    var param = {
        "type": hcap.externalinput.ExternalInputType.TV,
        "index": port,
        "onSuccess": function () {
            console.log("changeSourceTV :: onSuccess");
           console.log("changeSourceTV : setCurrentExternalInput :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("changeSourceTV :: onFailure : errorMessage = " + f.errorMessage);
           console.log("changeSourceTV : setCurrentExternalInput :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.externalinput.setCurrentExternalInput(param);
}

/**
 * get Network Device Mac
 * @param ip
 * @param callback
 */
function getNetworkDeviceMac(ip, callback) {
    hcap.network.getNumberOfNetworkDevices({
        "onSuccess": function (s) {
            console.log("onSuccess :: the number of network devices = " + s.count);
            for (var i = 0; i < s.count; i++) {
                (function (k) {
                    hcap.network.getNetworkDevice({
                        "index": k,
                        "onSuccess": function (obj) {
                            //console.log("onSuccess : networkMode = " + obj.networkMode + "\n name = " + obj.name + "\n mac = " + obj.mac + "\n dhcp = " + obj.dhcp + "\n ip = " + obj.ip + "\n gateway = " + obj.gateway + "\n netmask = " + obj.netmask + "\n primary dns = " + obj.primaryDns + "\n secondary dns = " + obj.secondaryDns);
                            console.log("onSuccess :: getNetworkDevice");
                            if (ip === obj.ip) {
                                console.log("CURRENT MAC : " + obj.mac);
                                callback(obj.mac);
                            }
                        },
                        "onFailure": function (f) {
                            console.log("onFailure :: errorMessage = " + f.errorMessage);
                        }
                    });
                })(i);
            }
        },
        "onFailure": function (f) {
            console.log("onFailure :: errorMessage = " + f.errorMessage);
        }
    });
}

/**
 * get Network Information
 * @param callback
 */
function getNetworkInformation(callback) {
    var param = {
        "onSuccess": function (obj) {
            //console.log("onSuccess :: network_mode = " + obj.network_mode + "\n ssid = " + obj.ssid + "\n eth_speed = " + obj.eth_speed + "\n eth_duplex = " + obj.eth_duplex + "\n dhcp_state = " + obj.dhcp_state);
            console.log("onSuccess :: getNetworkInformation");
            callback(obj.ip_address);
        },
        "onFailure": function (f) {
            console.log("onFailure :: errorMessage = " + f.errorMessage);
        }
    };
    hcap.network.getNetworkInformation(param);
}

function startManualUpdate() {
    hcap.system.startManualUpdate({
        "onSuccess": function () {
            console.log("onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

function setLocalTime(srv_date) {
    var year = srv_date.getFullYear();
    var month = ("0" + (srv_date.getMonth() + 1)).slice(-2);
    var day = ("0" + (srv_date.getDate())).slice(-2);
    var hours = ("0" + (srv_date.getHours())).slice(-2);
    var minutes = (srv_date.getMinutes() < 10 ? '0' : '') + srv_date.getMinutes();
    var seconds = (srv_date.getSeconds() < 10 ? '0' : '') + srv_date.getSeconds();
    //
    var param1 = {
        "year": parseFloat(year),
        "month": parseFloat(month),
        "day": parseFloat(day),
        "hour": parseFloat(hours),
        "minute": parseFloat(minutes),
        "second": parseFloat(seconds),
        "gmtOffsetInMinute": 240, // Asia/Dubai = 240
        "isDaylightSaving": false,
        "onSuccess": function () {
            console.log("onSuccess :: setLocalTime");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    }
    hcap.time.setLocalTime(param1);
}

function getLocalTime() {
    var param1 = {
        "onSuccess": function (s) {
            console.log("onSuccess : \n" +
                "TV localtime = " + s.year + "-" + s.month + "-" + s.day + " " + s.hour + " : " + s.minute + " : " + s.second + "\n" +
                "GMT offset = " + s.gmtOffsetInMinute + "\n" +
                "daylight saving = " + s.isDaylightSaving);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    }
    hcap.time.getLocalTime(param1);
}

function setVolumeLevel(v) {
    var param1 = {
        "level": v,
        "onSuccess": function () {
            console.log("setVolumeLevel :: onSuccess");
           console.log("setVolumeLevel :: onSuccess");
        },
        "onFailure": function (f) {
            console.log("setVolumeLevel :: onFailure : errorMessage = " + f.errorMessage);
           console.log("setVolumeLevel :: onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.volume.setVolumeLevel(param1);
}

function getVolumeLevel(callback) {
    var param1 = {
        "onSuccess": function (s) {
            console.log("getVolumeLevel : onSuccess : level = " + s.level);
            VOLUME_CONFIG = s.level;
            callback(VOLUME_CONFIG);
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.volume.getVolumeLevel(param1);
}

function requestCheckout() {
    var param1 = {
        "onSuccess": function (s) {
            console.log("requestCheckout : onSuccess");
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    };
    hcap.checkout.requestCheckout(param1);
}

//Pause-Resume of Media played
var pr = 1;

/**
 * pause_resume
 */
function pause_resume() {
    if (pr) {
        pr = 0;
        _media.pause({
            "onSuccess": function () {
                console.log("onSuccess");
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
            }
        });
    } else {
        pr = 1;
        _media.resume({
            "onSuccess": function () {
                console.log("onSuccess");
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
            }
        });
    }

}

/**
 * Rewind of Media played
 * @constructor
 */
function rewind() {
    _media.getPlayPosition({
        "onSuccess": function (s) {
            console.log("onSuccess position : " + s.positionInMs);
            var current = s.positionInMs;
            _media.getInformation({
                "onSuccess": function (s) {
                    console.log("onSuccess" + "\nvideoAvailable = " + s.videoAvailable + "\ntitle = " + s.title + "\ncontentLengthInMs = " + s.contentLengthInMs);
                    _media.setPlayPosition({
                        "positionInMs": current - (s.contentLengthInMs / 10),
                        "onSuccess": function () {
                            console.log("positionInMs=" + (current - (s.contentLengthInMs / 10)));
                        },
                        "onFailure": function (f) {
                            console.log("onFailure : errorMessage = " + f.errorMessage);
                        }
                    });
                },
                "onFailure": function (f) {
                    console.log("onFailure : errorMessage = " + f.errorMessage);
                }
            });
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

/**
 * Fast Forward of Media played
 * @constructor
 */
function ff() {
    _media.getPlayPosition({
        "onSuccess": function (s) {
            console.log("onSuccess position : " + s.positionInMs);
            var current = s.positionInMs;
            _media.getInformation({
                "onSuccess": function (s) {
                    console.log("onSuccess" + "\nvideoAvailable = " + s.videoAvailable + "\ntitle = " + s.title + "\ncontentLengthInMs = " + s.contentLengthInMs);
                    _media.setPlayPosition({
                        "positionInMs": current + (s.contentLengthInMs / 10),
                        "onSuccess": function () {
                            console.log("positionInMs=" + (current + (s.contentLengthInMs / 10)));
                        },
                        "onFailure": function (f) {
                            console.log("onFailure : errorMessage = " + f.errorMessage);
                        }
                    });
                },
                "onFailure": function (f) {
                    console.log("onFailure : errorMessage = " + f.errorMessage);
                }
            });
        },
        "onFailure": function (f) {
            console.log("onFailure : errorMessage = " + f.errorMessage);
        }
    });
}

/**
 * Event Listener
 * List all HCAP Events
 */
document.addEventListener("application_registration_result_received", function (param) {
    // {String} param.id - ID of the app that requested by hcap.application.RegisterSIApplicationList().
    // {Boolean} param.tokenResult- true if the app is registered successfully, else false.
    // {String} param.errorMessage - in case of failure, this message provides the details.
    console.log(
        "Event 'application_registration_result_received' is received.\n" + "tokenResult = " + param.tokenResult + "\n" +
        "Error message = " + param.errorMessage + "\n" + "id = " + param.id
    );
}, false);
document.addEventListener("beacon_device_discovered", function (param) {
    // {Array} param.devices- Beacon device list
    // {Array} param.devices[].scanRecord[] - Beacon device scanned record.
    // {String} param.devices[].address - Beacon device address.
    // {Number} param.devices[].rssi - RSSI value of device.
    console.log(
        "Event 'beacon_device_discovered' is received.\n" +
        "devices length = " + param.devices.length
    );
    for (var i = 0; i < param.devices.length; i++) {
        console.log("discovered device[" + i + "] scanRecord = " + param.devices[i].scanRecord + ", address = " + param.devices[i].address + ", rssi = " + param.devices[i].rssi);
    }
}, false);
document.addEventListener("bluetooth_event_received", function (param) {
    // {String} param.eventType - bluetooth event type ("bt_gap_find_devices_result" / "bt_service_status_changed" / "bt_audio_device_discovered" / "bt_peripheral_device_connection_status")
    // {Object} param.btGapFindDevicesResult - event data for the event type "bt_gap_find_devices_result"
    //      {
    //          {String} scanState - scan state ("found_devices" : devices are found / "done" : scanning is done with no device found)
    //          {Array} list - device list
    //                  {String} list[].name - device name
    //                  {Number} list[].class - device class
    //                  {String} list[].address - BD (Bluetooth Device) address
    //                  {Number} list[].rssi - RSSI value of device
    //      }
    // {Object} param.btServiceStatusChanged - event data for the event type "bt_service_status_changed"
    //      {
    //          {String} listType - list type ("discovered"/"bonded"/"none")
    //          {String} state - device connection state ("connected"/"disconnected"/"connecting"/"disconnecting"/"none")
    //          {String} address - BD (Bluetooth Device) address
    //          {String} service - service profile ("hid" : HID profile / "audio" : audio src(A2DP) profile / "opc" : OPC profile / "audio_sink" : audio sink(A2DP) profile)
    //          {String} name - device name
    //      }
    // {Object} param.device - event data for the event type "bt_audio_device_discovered"
    //      {
    //          {String} deviceClass - device class
    //          {String} address - BD (Bluetooth Device) address
    //          {String} rssi - RSSI value of device
    //          {String} name - device name
    //          {String} type - device type
    //      }
    // {Object} param.deviceMessage - event data for the event type "bt_peripheral_device_connection_status"
    //      {
    //          {String} address- device mac address
    //          {String} reason - normal/incoming (normal: TV requests connection./incoming: A registered peripheral device requests connection.)
    //          {String} status - connected/disconnected
    //          {String} deviceName - device name
    //      }
    console.log("Event 'bluetooth_event_received' is received.");
    if (param.eventType === "bt_gap_find_devices_result") {
        console.log("scan state = " + param.btGapFindDevicesResult.scanState);
        for (var i = 0; i < param.btGapFindDevicesResult.list.length; i++) {
            console.log("found device[" + i + "] name = " + param.btGapFindDevicesResult.list[i].name + ", class = " + param.btGapFindDevicesResult.list[i].class + ", BD address = " + param.btGapFindDevicesResult.list[i].address + ", rssi = " + param.btGapFindDevicesResult.list[i].rssi);
        }
    } else if (param.eventType === "bt_service_status_changed") {
        console.log("listType = " + param.btServiceStatusChanged.listType + ", state = " + param.btServiceStatusChanged.state + ", BD address = " + param.btServiceStatusChanged.address + ", service profile = " + param.btServiceStatusChanged.service + ", name = " + param.btServiceStatusChanged.name);
    } else if (param.eventType === "bt_audio_device_discovered") {
        console.log("eventType = " + param.eventType + ", deviceClass = " + param.device.deviceClass + ", address = " + param.device.address + ", rssi = " + param.device.rssi + ", name = " + param.device.name + ", type = " + param.device.type);
    } else if (param.eventType === "bt_peripheral_device_connection_status") {
        console.log("address = " + param.deviceMessage.address + ", reason = " + param.deviceMessage.reason + ", status = " + param.deviceMessage.status + ", deviceName = " + param.deviceMessage.deviceName);
    }
}, false);
document.addEventListener("carousel_data_cached", function (param) {
    // {Boolean} param.result - true if a carousel data is cached successfully, else false.
    // {String} param.errorMessage - in case of failure, this message provides the details.
    // {String} param.url - url of the cached carousel data.
    // {String} param.cachePath - path where the carousel data is cached.
    console.log(
        "Event 'carousel_data_cached' is received.\n" +
        "Result = " + param.result + "\n" +
        "Error message = " + param.errorMessage + "\n" +
        "URL = " + param.url + "\n" +
        "Cache Path = " + param.cachePath
    );
}, false);
document.addEventListener("cec_data_received", function (param) {
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    // {String} param.data - data that is transferred from the CEC device
    console.log("Event 'cec_data_received' is received.\n" + "Data = " + param.data);
    if (($thisPage) && ($thisPage.pageID !== "KEY_TV" && $thisPage.pageID !== "KEY_XTV")) {
        stopChannel();
    } else {
        console.log("cec_data_received :: else");
    }
}, false);
document.addEventListener("channel_changed", function (param) {
    // {Boolean} param.result - true if the current channel is changed successfully, else false.
    // {String} param.errorMessage - in case of failure, this message provides the details.
    console.log("Event 'channel_changed' is received.\n" + "Result = " + param.result + "\n" + "Error message = " + param.errorMessage);
   console.log("Event 'channel_changed' is received.\n" + "Result = " + param.result + "\n" + "Error message = " + param.errorMessage);
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    if (param.result === true) {
        if (($thisPage) && ($thisPage.waitForCallback)) {
            $thisPage.waitForCallback = false;
        }
    } else {
        console.log("channel_changed:[" + param.result + "] Error = " + param.errorMessage);
    }
}, false);
document.addEventListener("channel_status_changed", function (param) {
    console.log("Event 'channel_status_changed' is received.\n" + "param = " + param);
   console.log("Event 'channel_status_changed' is received.\n" + "param = " + param);
}, false);
document.addEventListener("cloning_done_received", function (param) {
    // {Boolean} param.result - true if the cloning is done successfully, else false.
    console.log("Event 'cloning_done_received' is received.\n" + "Result = " + param.result);
}, false);
document.addEventListener("current_channel_audio_language_changed", function (param) {
    console.log("Event 'current_channel_audio_language_changed' is received.");
}, false);
document.addEventListener("current_channel_subtitle_changed", function (param) {
    console.log("Event 'current_channel_subtitle_changed' is received.");
}, false);
document.addEventListener("external_input_changed", function (param) {
    console.log("Event 'external_input_changed' is received.");
   console.log("Event 'external_input_changed' is received.");
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    if (param) {
        if (($thisPage) && ($thisPage.isExternalInput)) {
            if ($thisPage.waitForCallback) {
                $thisPage.waitForCallback = false;
            }
        }
    } else {
        console.log("external_input_changed:[" + param.result + "] Error = " + param.errorMessage);
    }
}, false);
document.addEventListener("hcap_application_focus_changed", function (param) {
    // {String} param.eventType - HCAP application focus event type
    console.log("hcap_application_focus_changed :: event type = " + param.eventType);
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    if (param.eventType === "focused") {
        if (($thisPage) && ($thisPage.isHidden) && ((deviceModel.indexOf("US660H0") > 1) || (deviceModel.indexOf("LT662V9") > 1))) {
            setHotelMode(true);
            $thisPage.waitForCallback = false;
            $thisPage.isHidden = false;
            $thisPage.isExternalInput = false;
            $thisPage.isAppFocused = true;
            $thisPage.toggleAppVisibility(true);
            if (DEVICE_TYPE === "hcaptv" || DEVICE_TYPE === "lxhcaptv") {
                changeSourceTV(0);
            }
            initPageWidgets();
        }
    }
    if (param.eventType === "unfocused") {
        if (($thisPage) && ($thisPage.isHidden) && ((deviceModel.indexOf("US660H0") > 1) || (deviceModel.indexOf("LT662V9") > 1))) {
            setHotelMode(false);
            $thisPage.isAppFocused = false;
            // disable widget notify Scroller
            if (AppWidgets.widget_notifyScroller) {
                clearTimeout(AppWidgets.widget_notifyScroller.timeTick);
                clearTimeout(AppWidgets.widget_notifyScroller.scrollTick);
                clearTimeout(AppWidgets.widget_notifyScroller.scrollPopUpTick);
                AppWidgets.widget_notifyScroller.timeTick = null;
                AppWidgets.widget_notifyScroller.scrollTick = null;
                AppWidgets.widget_notifyScroller.scrollPopUpTick = null;
            }
        }
    }
}, false);
document.addEventListener("hdmi_connection_changed", function (param) {
    // {Number} param.index - index of the HDMI which was connected or disconnected.
    // {Boolean} param.connected - true if the HDMI is connected, else false.
    console.log("Event 'hdmi_connection_changed' is received.\n" + "HDMI-" + param.index + " : " + "connected = " + param.connected);
}, false);
document.addEventListener("inband_data_service_ready", function (param) {
    // {Number} param.inband_data_service_type - inband data service type. (hcap.channel.InbandDataServiceType)
    console.log("Event 'inband_data_service_ready' is received.\n" + "inband_data_service_type = " + param.inband_data_service_type);
}, false);
document.addEventListener("iot_binding_ready", function (param) {
    // {String} param.bindingId - binding ID ready to conrol.
    console.log("Event 'iot_binding_ready' is received.\n" + "bindingId = " + param.bindingId + "\n");
}, false);
document.addEventListener("iot_bridge_status_changed", function (param) {
    // {String} param.bridgeUid - bridge UID.
    // {String} param.status - the bridge status after the change. "scan" for scan status, "normal" for normal (non-scan) status.
    console.log("Event 'iot_bridge_status_changed' is received.\n" + "bridgeUid = " + param.bridgeUid + "\n" + "status = " + param.status);
}, false);
document.addEventListener("iot_component_reported", function (param) {
    // {String} param.thingUid - thing UID.
    // {String} param.componentId - component ID.
    // {Object} param.fromValue - |ComponentValue|, // previous component value of changed
    // {Object} param.toValue - |ComponentValue|, // later component value of changed
    // {Object} |ComponentValue| - json object of a component value
    //     {
    //       "valueType": |string|, // "Unknown", "String", "Boolean", "Variables", "Double", "Float", "Int8", "Int16", "Int32", "Int64", "UInt8", "UInt16", "UInt32", "UInt64"
    //       "value": |string|, // value
    //       "additionalValue": |string|, // custom additional value as a string
    //     }
    console.log(
        "Event 'iot_component_reported' is received.\n" +
        "thingUid = " + param.thingUid + "\n" +
        "componentId = " + param.componentId + "\n" +
        "fromValue = " + JSON.stringify(param.fromValue) + "\n" +
        "toValue = " + JSON.stringify(param.toValue)
    );
}, false);
document.addEventListener("iot_factory_reset_result_received", function (param) {
    // {Array} param.factoryResetResultList - |FactoryResetResult| // list of factory reset results.
    // {Object} |FactoryResetResult| - json object of a factory reset result.
    //     {
    //       "id": |string|,  // "Core" or binding ID
    //       "factoryResetResult": |boolean|, // facotry reset result
    //     }
    console.log(
        "Event 'iot_factory_reset_result_received' is received.\n" +
        "factory reset result list = " + JSON.stringify(param.factoryResetResultList)
    );
}, false);
document.addEventListener("iot_framework_status_changed", function (param) {
    // {String} param.status - "off" : framework is off, "initializing" : framework is initializing, "ready" : framework is ready.
    console.log(
        "Event 'iot_framework_status_changed' is received.\n" +
        "status = " + param.status
    );
}, false);
document.addEventListener("iot_set_component_result_received", function (param) {
    // {Boolean} param.result - true for the success, otherwise false.
    // {String} param.callId - callId of the callId in hcap.iot.requestSetComponent().
    console.log(
        "Event 'iot_set_component_result_received' is received.\n" +
        "result = " + param.result + "\n" +
        "callId = " + param.callId
    );
}, false);
document.addEventListener("iot_thing_discovered", function (param) {
    // {String} param.bindingId - binding ID of the bridge a thing is discovered.
    // {String} param.thingUid - thing UID to be discovered.
    // {String} param.thingId - thing ID.
    // {String} param.label - thing label.
    console.log(
        "Event 'iot_thing_discovered' is received.\n" +
        "bindingId = " + param.bindingId + "\n" +
        "thingUid = " + param.thingUid + "\n" +
        "thingId = " + param.thingId + "\n" +
        "label = " + param.label
    );
}, false);
document.addEventListener("iot_thing_meta_data_changed", function (param) {
    // {String} param.thingUid - UID of the changed thing
    // {Object} param.thingMetaData - |ThingMetaData|, // later meta data of changed
    // {Object} |ThingMetaData| - json object of the meta data of a thing
    //     {
    //       "hardwareVersion": |string|,  // thing hardware version
    //       "softwareVersion": |string|, // thing software version
    //       "registrationDate": |string|, // date the thing was registered
    //       "label": |string|, //thing label
    //       "modelName": |string|, //thing model name
    //       "manufacturer": |string|, //thing manufacturer
    //       "nickname": |string|, //thing nickname
    //     }
    console.log(
        "Event 'iot_thing_meta_data_changed' is received.\n" +
        "thingUid = " + param.thingUid +
        "thingMetaData = " + JSON.stringify(param.thingMetaData)
    );
}, false);
document.addEventListener("iot_thing_registered", function (param) {
    // {String} param.thingUid : new thing UID
    console.log(
        "Event 'iot_thing_registered' is received.\n" +
        "thingUid = " + param.thingUid
    );
}, false);
document.addEventListener("iot_thing_rejected", function (param) {
    // {String} param.thingUid - thing UID.
    console.log(
        "Event 'iot_thing_rejected' is received.\n" +
        "thingUid = " + param.thingUid
    );
}, false);
document.addEventListener("iot_thing_unregistered", function (param) {
    // {String} param.thingUid : thing UID.
    console.log(
        "Event 'iot_thing_unregistered' is received.\n" +
        "thingUid = " + param.thingUid
    );
}, false);
document.addEventListener("locale_changed", function (param) {
    // {String} param.specifier - locale specifier for the locale change request.
    // {Boolean} param.result - true if the locale is changed successfully, else false.
    // {String} param.errorMessage - in case of failure, this message provides the details.
    console.log(
        "Event 'locale_changed' is received.\n" +
        "specifier = " + param.specifier + "\n" +
        "change result = " + param.result + "\n" +
        "Error message = " + param.errorMessage
    );
}, false);
document.addEventListener("media_event_received", function (param) {
    // {String} param.eventType - changed event type
    console.log("Event 'media_event_received' is received.\n" + "param = " + param + "\n event type = " + param.eventType);
   console.log("Event 'media_event_received' is received.\n" + "param = " + param + "\n event type = " + param.eventType);
    _stateMedia = param.eventType;
    var $thisPage = ((AppWidgets) && (AppWidgets.widget_pages)) ? AppWidgets.widget_pages : null;
    switch (_stateMedia) {
        case "seek_done":
            break;
        case "play_start":
            if (($thisPage) && ($thisPage.waitForCallback)) {
                $thisPage.waitForCallback = false;
            }
            break;
    }
}, false);
document.addEventListener("media_hub_event_received", function (param) {
    // {Number} param.eventType - Media Hub event type.
    console.log("Media Hub event type = " + param.eventType);
}, false);
document.addEventListener("mmr_low_battery_event_received", function (param) {
    console.log("MMR low battery notification is received");
}, false);
document.addEventListener("mpi_data_received", function (param) {
    // {Boolean} param.result - true if MPI data is received successfully, else false.
    // {String} param.errorMessage - in case of failure, this message provides the details.
    // {Number} param.id - request ID that is defined between application and MPI headend. (0 ~ 255)
    // {Number} param.sequence - sequence number of packet. (0 ~ 255).
    // {String} param.packet - packet data that is transferred to the MPI card. (0 ~ 32)
    console.log(
        "Event 'mpi_data_received' is received.\n" +
        "Result = " + param.result + "\n" +
        "Error message = " + param.errorMessage + "\n" +
        "ID = " + param.id + "\n" +
        "Sequence = " + param.sequence + "\n" +
        "Packet = " + param.packet
    );
}, false);
document.addEventListener("network_event_received", function (param) {
    // {Number} param.event - network event. (hcap.network.NetworkEventType)
    console.log(
        "Event 'network_event_received' is received.\n" +
        "event = " + param.event
    );
}, false);
document.addEventListener("on_destroy", function (param) {
    console.log("Event 'on_destroy' is received");
    // unInitPagePlayer();
    // stop TV channels on init
    stopChannel();
    // shut down Media on init
    shutDown();
    // stop Media on init
    // stopMedia();
    //
    hcap.system.beginDestroy({
        "onSuccess": function () {
            console.log("beginDestroy onSuccess");
            // clean up resources
            hcap.system.endDestroy({
                "onSuccess": function () {
                    console.log("endDestroy onSuccess");
                },
                "onFailure": function (e) {
                    console.log("endDestroy onFailure : errorMessage = " + e.errorMessage);
                }
            });
        },
        "onFailure": function (f) {
            console.log("beginDestroy onFailure : errorMessage = " + f.errorMessage);
        }
    });
}, false);
document.addEventListener("output_connection_changed", function (param) {
    // {Boolean} param.connected - true if the TV (or monitor) is connected, else false.
    console.log(
        "Event 'output_connection_changed' is received.\n" +
        "output connected = " + param.connected
    );
}, false);
document.addEventListener("ping_result_received", function (param) {
    // {Boolean} param.result - true if the result of asynchronous ping is success, else false.
    // {String} param.errorMessage - in case of failure, this message provides the details.
    // {String} param.roundTripTimeInMs - round trip time to the target in milliseconds requested by hcap.network.asyncPing().
    console.log(
        "Event 'ping_result_received' is received.\n" +
        "Result = " + param.result + "\n" +
        "Error message = " + param.errorMessage + "\n" +
        "Round trip time = " + param.roundTripTimeInMs
    );
}, false);
document.addEventListener("power_mode_changed", function (param) {
    console.log("Event 'power_mode_changed' is received");
    if (param.returnValue === true) {
        getPowerMode();
    }
}, false);
document.addEventListener("property_changed", function (param) {
    // {String} param.key - property that was changed.
    console.log("Event 'property_changed' is received.\n" + "Changed Property = " + param.key);
}, false);
document.addEventListener("rms_response_received", function (param) {
    // {String} param.response - RMS response message.
    console.log(
        "Event 'rms_response_received' is received.\n" +
        "response message = " + param.response
    );
}, false);
document.addEventListener("rs232c_data_received", function (param) {
    // {String} param.data - rs232c data string converted from binary data to ascii data such as ascii "3B1C42" for binary 0x3B1C42 with param.dataLength 3 (3 bytes) and ascii "00" for binary null data (0x00) with param.dataLength 1 (1 byte).
    // {Number} param.dataLength - received rs232c data length in bytes. Max length of EU model is 255 (bytes) and US model is 32 (bytes).
    console.log(
        "Event 'rs232c_data_received' is received.\n" +
        "data = " + param.data + "\n" +
        "data length = " + param.dataLength
    );
}, false);
document.addEventListener("screensaver_event_received", function (param) {
    // {Number} param.eventType - screensaver event type.
    console.log("screensaver event type = " + param.eventType);
}, false);
document.addEventListener("software_update_event_received", function (param) {
    // {String} param.eventType - software update event type ("sw_new_version_checked" / "sw_update_status_changed")
    // {Object} param.swNewVersionChecked - event data for the event type "sw_new_version_checked"
    //      {
    //          {Boolean} flagUpdate - Status of update request
    //          {Number} version - Version to be updated
    //      }
    // {Object} param.swUpdateStatusChanged - event data for the event type "sw_update_status_changed"
    //      {
    //          {String} status - "idle" / "in progress" / "completed"
    //      }
    console.log("Event 'software_update_event_received' is received.");
    if (param.eventType === "sw_new_version_checked") {
        console.log("eventType = " + param.eventType + ", flagUpdate = " + param.swNewVersionChecked.flagUpdate + ", version = " + param.swNewVersionChecked.version);
    } else if (param.eventType === "sw_update_status_changed") {
        console.log("eventType = " + param.eventType + ", status = " + param.swUpdateStatusChanged.status);
    }
}, false);
document.addEventListener("speech_to_text_status_changed", function (param) {
    // {String} param.status - "processing" : STT is processing. "ready" : STT is completed.
    // {String} param.actionData - STT intent parameter when STT status is changed from "processing" to "ready".
    // {String} param.serviceType - STT result category when STT status is changed from "processing" to "ready".
    // {String} param.actionType - STT result intent when STT status is changed from "processing" to "ready".
    // {String} param.userUtterance - STT result text when STT status is changed from "processing" to "ready".
    console.log(
        "Event 'speech_to_text_status_changed' is received.\n" +
        "status = " + param.status +
        "action data = " + param.actionData +
        "service type = " + param.serviceType +
        "action type = " + param.actionType +
        "user utterance = " + param.userUtterance
    );
}, false);
document.addEventListener("start_channel_changed", function (param) {
    console.log("Event 'start_channel_changed' is received.\n" + "param = " + param);
   console.log("Event 'start_channel_changed' is received.\n" + "param = " + param);
}, false);
document.addEventListener("tcp_data_received", function (param) {
    // {Number} param.port - port number of TCP connection through which TCP data is received.
    // {String} param.data - received TCP data.
    console.log(
        "Event 'tcp_data_received' is received.\n" +
        "port = " + param.port + "\n" +
        "data = " + param.data
    );
}, false);
document.addEventListener("udp_data_received", function (param) {
    // {Number} param.port - port number of UDP connection through which UDP data is received.
    // {String} param.data - received UDP data.
    console.log("Event 'udp_data_received' is received.\n" + "port = " + param.port + "\n" + "data = " + param.data);
}, false);
document.addEventListener("ui_value_changed", function (param) {
    // {String} param.key - UI Value event string
    console.log("Event 'ui_value_changed' is received. EventString = " + param.key);
    if (param) {
        // {String} param.key - UI Value event string
        console.log("Event 'ui_value_changed' is received. EventString = " + param.key);
    } else {
        console.log("function:[" + param.result + "] Error = " + param.errorMessage);
    }
}, false);
document.addEventListener("usb_file_downloaded", function (param) {
    // {Boolean} param.result - true if the file of uri is downloaded successfully, else false.
    // {String} param.errorMessage - in case of failure, this message provides the details.
    // {String} param.uri - URI for the file to download to the usb storage requested by hcap.file.downloadFileToUsb().
    // {String} param.downloadPath - file path to download the file of uri requested by hcap.file.downloadFileToUsb().
    console.log(
        "Event 'usb_file_downloaded' is received.\n" +
        "Result = " + param.result + "\n" +
        "Error message = " + param.errorMessage + "\n" +
        "uri = " + param.uri + "\n" +
        "Download path = " + param.downloadPath
    );
}, false);
document.addEventListener("usb_storage_status_changed", function (param) {
    // {String} param.eventType - usb storage event type
    console.log("event type = " + param.eventType);
}, false);
document.addEventListener("volume_level_changed", function (param) {
    console.log("Event 'volume_level_changed' is received");
}, false);
document.addEventListener("webrtc_event_received", function (param) {
    // {String} param.eventString - WebRTC event string
    console.log("Event 'webrtc_event_received' is received.");
    console.log("eventString = " + param.eventString);
}, false);
document.addEventListener("webrtc_message_received", function (param) {
    // {Number} param.remotePeerId - remote peer id
    // {String} param.message - message
    console.log("Event 'webrtc_message_received' is received.");
    console.log("remotePeerId = " + param.remotePeerId + ", message = " + param.message);
}, false);

//remove Player object after finish hcap tv
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
    storageAttached: false,
    storageConfigured: false,
    storageReady: false,
    storageAssetsCount: 0,
    assetsLength: 0,
    assetsCount: 0,
    init: function () {
        try {
            if ((IS_DEPLOY) && (!IS_DEV_MOD)) {
            }
            // rc add Key Item
            rc_addKeyItem();
            // stop TV channels on init
            stopChannel();
            // stop Media on init
            shutDown();
            // set Volume Level
            setVolumeLevel(VOLUME_CONFIG);
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
            getVolumeLevel(function (volume) {
                this.isMute = (volume < 1);
                if (this.isMute) {
                    //device is on Mute
                    setVolumeLevel(volume);
                } else {
                    //device is not on Mute
                    setVolumeLevel(-1);
                }
            });
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
            str = (typeof str === "string") ? 3 : str;//3 for INFOMIR
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
            //gSTB.Stop();
            // stbPlayer.stop();
            this.currentMrl = "";
            this.playerSpeedIndex = 0;
            //this.setClipScreen(0, 0, 0, 0);
        } catch (a) {
           console.log("Player.stop() error :: " + a.message);
        }
    },
    play: function (c, t) {
        var b = null;
        try {
            if (c != this.currentMrl) {
                //c = "https://1.tv.itsthe1.com/tvChannels/4Fun_Dance.mp4";
                //c = "https://manorhotel.itstheone.net/admin-portal/assets/uploads/Promotions/Videos/4Fun_Dance.mp4";
                //document.body.style.backgroundColor = "transparent";
                this.currentMrl = c;
                this.setPlayerState("PLAYING");
                //gSTB.Play(c);
                stbPlayer.play({
                    uri: c,
                    solution: 'auto'
                });
                var playerState = this.getPlayerState();
                if (playerState === "PLAYING") {
                    this.setPlayerState("PLAYING");
                } else {
                    this.currentMrl = "";
                }
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
            var b = c || this.playerSpeed[(this.playerSpeedIndex === (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
            this.setPlayerState("REWIND");
            gSTB.SetSpeed(-1 * b);
        } catch (a) {
           console.log("Player.rewind() error :: " + a.message);
        }
    },
    fforward: function (c) {
        try {
            var b = c || this.playerSpeed[(this.playerSpeedIndex === (this.playerSpeed.length - 1) ? this.playerSpeedIndex : this.playerSpeedIndex++)];
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
            gSTB.SetTopWin(0);
            //this.toggleWinMode(c);
            stbPlayer.setViewport({x: CLIP_X, y: CLIP_Y, width: CLIP_W, height: CLIP_H});
        } catch (a) {
           console.log("Player.setClipScreen() error :: " + a.message);
        }
    },
    setFullScreen: function () {
        try {
            this.toggleWinMode("full");
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
        if (DEVICE_MOUNT_PATH !== "" || Player.mountPath !== "") {
            Player.assetsLength = AppWidgets.assetsList.length;
            Player.storageReady = true;
            Player.downloadMediasToUSB(AppWidgets.assetsList);
        }
    },
    configUSB: function () {
        DataManager.updateDeviceJsonData('config_usb', DEVICE_ID, 1, 'reboot');
        Player.storageConfigured = true;
        // setTimeout(function () {
        //     Player.readyUSB = true;
        //     Player.readMediaJson();
        // }, 10000);
    },
    storageUSBInfo: function () {
        var param1 = {
            "onSuccess": function (s) {
                console.log("onSuccess : list length = " + s.list.length);
                var devices = s.list;
                if (devices) {
                    var mountPoint = devices[0].mountPoint + '/';
                    Player.mountPath = mountPoint;
                    DEVICE_MOUNT_PATH = Player.mountPath;
                    Player.storageAttached = true;
                    // setTimeout(function () {
                    //     Player.configUSB();
                    // }, 10000);
                }
                // for (var i = 0; i < s.list.length; i++) {
                //     console.log(
                //         "[" + i + "].name = " + s.list[i].name +
                //         "[" + i + "].displayName = " + s.list[i].displayName +
                //         "[" + i + "].mountPoint = " + s.list[i].mountPoint +
                //         "[" + i + "].status = " + s.list[i].status +
                //         "[" + i + "].filesystemStatus = " + s.list[i].filesystemStatus +
                //         "[" + i + "].totalSize = " + s.list[i].totalSize +
                //         "[" + i + "].freeSize = " + s.list[i].freeSize
                //     );
                // }
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
            }
        };
        hcap.file.getUsbStorageList(param1);
    },
    storageUSBFiles: function () {
        var param1 = {
            "onSuccess": function (s) {
                hcap.file.getUsbStorageFileList({
                    "path": Player.mountPath,
                    "onSuccess": function (param) {
                        console.log("file list length = " + param.list.length);
                        Player.storageAssetsCount = param.list.length;
                        // for (var i = 0; i < param.list.length; i++) {
                        //     console.log(
                        //         "[" + i + "].name = " + param.list[i].name +
                        //         "[" + i + "].type = " + param.list[i].type +
                        //         "[" + i + "].length = " + param.list[i].length
                        //     );
                        // }
                    },
                    "onFailure": function (ff) {
                        console.log("onFailure : errorMessage = " + ff.errorMessage);
                    }
                });
            },
            "onFailure": function (f) {
                console.log("onFailure : errorMessage = " + f.errorMessage);
            }
        };
        hcap.file.getUsbStorageList(param1);
    },
    downloadMediasToUSB: function (mediaObj) {
        mediaObj = [
            "http://10.0.1.120/Project-HotelOne/admin-portal/assets/uploads/Promotions/Images/fdc7ced4c03e44db4fd97a288efe59b4@3x.png",
            "http://10.0.1.120/Project-HotelOne/admin-portal/assets/uploads/Backgrounds/0b1136ae1efcfab764ed0d608fb93f16@3x.jpg",
        ];

        if (mediaObj) {
            for (var idx = 0; idx < mediaObj.length; idx++) {
                var itm = mediaObj[idx];
                var filename = itm.split('/').pop(); 
                // var downloadURL = PROTOCOL + ADMIN_URL + 'uploads/' + itm;
                var downloadURL = itm;
                var pathToSave = "/tmp/usb/sda/sda1/" + filename;
                setTimeout(function () {
                    var param1 = {
                        "uri": downloadURL,
                        "path": pathToSave,
                        "onSuccess": function () {
                            console.log("onSuccess");
                        },
                        "onFailure": function (f) {
                            console.log("onFailure : errorMessage = " + f.errorMessage);
                        }
                    };
                    hcap.file.downloadFileToUsb(param1);
                    //count download jobs
                    Player.assetsCount++;
                }, 5000);
            }
        }

        // //
        // if (jobAdded) {
        //     document.getElementById('storageError').innerHTML = "Ready - Reboot...";
        //     var queueInfo = JSON.parse(stbDownloadManager.GetQueueInfo());
        //     //var queueInfo = [123, 456, 789, 1123, 1145, 1167, 1189];
        //     document.getElementById('queueInfo').innerHTML = JSON.stringify(queueInfo);
        //     setTimeout(function () {
        //         document.getElementById('storageError').innerHTML = "Success - Rebooting NOW...";
        //         Player.reboot();
        //     }, 60000);
        // }
    }
};

setBrowserDebugMode();

getProperty("model_name", function (modelName) {
   console.log("callback : getProperty :: modelName = " + modelName);
    deviceModel = modelName;
   console.log("callback : getProperty :: deviceModel = " + deviceModel);
    switch (deviceModel) {
        case "32LT662V9ZC":
        case "43US660H0GD":
        case "50UM767H0LD":
            browserResolution = "1080p";
            break;
        case "49UT661H0GA":
        case "43LX761H-GA":
        case "43LV751H-GA":
        case "LG_STB-3000":
            appId = 8;
            browserResolution = "720p";
            break;
        default:
            browserResolution = "1080p";
            break;
    }
    deviceStatus = true;
    setProperties();
});

getProperty("hcap_js_extension_version", function (extension_version) {
    console.log("callback : getProperty : hcap_js_extension_version : extension_version = " + extension_version);
   console.log("callback : getProperty : hcap_js_extension_version : extension_version = " + extension_version);
    hcap_js_version = extension_version.substring(0, 4);
    if (hcap_js_version >= "1.24") {
        // We have the latest hcap.js extension so check the television middleware version
        getProperty("hcap_middleware_version", function (middleware_version) {
            console.log("callback : getProperty : hcap_middleware_version : middleware_version = " + middleware_version);
           console.log("callback : getProperty : hcap_middleware_version : middleware_version = " + middleware_version);
            hcap_mware_version = middleware_version.substring(0, 4);
            if (hcap_mware_version >= "1.24") {
                // We have the latest hcap.js and the TV supports it so register the SI token and use the new method with parameters to launch apps
                registerSIApplicationList(tokenList);
            } else {
                // We have the latest extension but the TV doesn’t support it so launch using the old method
                console.log("hcap_middleware_version :: TV does not latest HCAP version");
            }
        });
    } else {
        // We don’t have the latest hcap.js extension so just use old method of launching
        console.log("hcap_js_extension_version :: do not have the latest HCAP version");
    }
});