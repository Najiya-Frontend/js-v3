var registAllKeys = function () {
    "use strict";
    try {
        tizen.tvinputdevice.getSupportedKeys().forEach(function (k) {
            tizen.tvinputdevice.registerKey(k.name);
            console.log("tizen.tvinputdevice.getSupportedKey: ", k.name);
            if (['VolumeUp', 'VolumeDown', 'VolumeMute',].indexOf(k.name) > -1) {
                tizen.tvinputdevice.unregisterKey(k.name);
            }
        });
    } catch (error) {
       console.log("Error - Could not subscribe keys, exception occurred ::" + error.message);
    }
};

registAllKeys();

var pluginKeymap = {
    38: "KEY_UP",
    40: "KEY_DOWN",
    39: "KEY_RIGHT",
    37: "KEY_LEFT",
    427: "KEY_CHANNEL_UP",
    428: "KEY_CHANNEL_DOWN",
    10009: "KEY_BACK",
    27: "KEY_HOME",
    27: "KEY_HOME",
    27: "KEY_HOME",
    121: "KEY_TV",
    122: "KEY_MAIN",
    13: "KEY_SELECT",
    65376: "KEY_SELECT",
    82: "KEY_LIST",
    403: "KEY_RED",
    404: "KEY_GREEN",
    405: "KEY_YELLOW",
    406: "KEY_BLUE",
    89: "KEY_GUIDE",
    87: "KEY_SEARCH",
    74: "KEY_STAR",
    69: "KEY_EXIT",
    107: "KEY_VOLUME_UP",
    109: "KEY_VOLUME_DOWN",
    85: "POWER_BUTTON",
    449: "KEY_MUTE",
    33: "KEY_REWIND",
    34: "KEY_FFORWARD",
    177: "KEY_PREV",
    176: "KEY_NEXT",
    83: "KEY_STOP",
    82: "KEY_PLAY",
    82: "KEY_PAUSE",
    116: "KEY_SWITCH_APP",
    117: "KEY_SCREEN_SIZE",
    120: "KEY_SETUP",
    179: "KEY_SEQ_ACCESS",
};

var seqAccess = false;
var seqCode = [];
const seqSec = ["KEY_SEQ_ACCESS", 1, 3, 5]; // R123 + Enter
//
var enterTimer;
var enterPressed = false;
var isPressAndHold = false;

/**
 * arrays Equal
 * @param a
 * @param b
 * @returns {boolean}
 */
function arraysEqual(a, b) {
    if (a === b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    // If you don't care about the order of the elements inside
    // the array, you should sort both arrays here.
    // Please note that calling sort on an array will modify that array.
    // you might want to clone your array first.

    for (var i = 0; i < a.length; ++i) {
        if (a[i] !== b[i]) return false;
    }
    return true;
}

/**
 * handle Single Press
 * @param event
 */
function handleSinglePress(event) {
    // Handle single Enter key press actions here
    console.log("handleSinglePress");
    if (!isPressAndHold) {
        console.log("Single Enter press action");
        enterPressed = false; // Reset for next press
        globalFireEvent(event);
    }
}

/**
 * handle Hold Press
 * @param event
 */
function handleHoldPress(event) {
    // Handle Enter key press-and-hold actions here
    console.log("handleHoldPress");
    isPressAndHold = true;
    globalFireEvent(event);
}

/**
 * plugin Key Handler
 * @param event
 * @returns {boolean}
 */
function pluginKeyHandler(event) {
    try {
        var e = null;
        var f = event.which || event.keyCode;
        var shiftKey = event.shiftKey;
        if ((AppWidgets) && (AppWidgets.userKeyboardInput) && (f !== 13) && (f !== 8)) {
            return true;
        } else {
            if (f < 58 && f >= 48) {
                e = "KEY_NUMERIC";
                f = f - 48;
            } else {
                if (shiftKey) {
                    if (f == 9) {
                        e = pluginKeymap[539];
                    }
                } else {
                    e = pluginKeymap[f];
                }
            }
            //seq Access checker
            if (seqCode.length > 3) {
                seqAccess = arraysEqual(seqCode, seqSec);
            }
            if (seqAccess) {
                seqAccess = false;
                seqCode = [];
                Player.removeCache();
            } else {
                if (seqCode.indexOf("KEY_SEQ_ACCESS") !== -1) {
                    seqCode.push(f);
                } else {
                    if (e === "KEY_SEQ_ACCESS") {
                        seqCode.push(e);
                    }
                }
            }
            //
            if (event.type === "keydown") {
                if (e === "KEY_SELECT") {
                    if (!enterPressed) {
                        enterPressed = true;
                        isPressAndHold = false;
                        // Adjust the duration for press-and-hold (in milliseconds)
                        enterTimer = setTimeout(function () {
                            handleHoldPress(new Event("KEY_HOLD", {value: 0}));
                        }, 1000);
                    }
                } else {
                    globalFireEvent(new Event(e, {value: f}));
                }
            }
            if (event.type === "keyup") {
                if (e === "KEY_SELECT") {
                    // Clear the timer if the key is released before the duration
                    clearTimeout(enterTimer);
                    // If the key was released within the delay, trigger single press action
                    if (enterPressed) {
                        handleSinglePress(new Event(e, {value: f}));
                    }
                    enterPressed = false; // Reset for next press
                    isPressAndHold = false; // Reset the flag for next use
                }
            }
            if (event.type === "virtualRemote") {
                globalFireEvent(new Event(e, {value: f}));
            }
            //

        }
    } catch (error) {
       console.log("Error - KeyBoard Map ::" + error.message);
    }
    return false;
}

function pluginInitRcPlugin() {
    document.addEventListener("keydown", pluginKeyHandler);
    document.addEventListener("keyup", pluginKeyHandler);
}

pluginInitRcPlugin();