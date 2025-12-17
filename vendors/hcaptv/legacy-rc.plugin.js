var pluginKeymap = {
    38: "KEY_UP",
    40: "KEY_DOWN",
    39: "KEY_RIGHT",
    37: "KEY_LEFT",
    427: "KEY_CHANNEL_UP",
    428: "KEY_CHANNEL_DOWN",
    461: "KEY_BACK",
    711: "KEY_BACK",
    1001: "KEY_HOME",
    602: "KEY_HOME",
    72: "KEY_HOME",
    121: "KEY_TV",
    122: "KEY_MAIN",
    13: "KEY_SELECT",
    82: "KEY_LIST",
    403: "KEY_RED",
    404: "KEY_GREEN",
    405: "KEY_YELLOW",
    406: "KEY_BLUE",
    458: "KEY_GUIDE",
    457: "KEY_INFO",
    87: "KEY_SEARCH",
    74: "KEY_STAR",
    69: "KEY_EXIT",
    447: "KEY_VOLUME_UP",
    448: "KEY_VOLUME_DOWN",
    85: "POWER_BUTTON",
    449: "KEY_MUTE",
    412: "KEY_REWIND",
    417: "KEY_FFORWARD",
    177: "KEY_PREV",
    176: "KEY_NEXT",
    413: "KEY_STOP",
    415: "KEY_PLAY",
    19: "KEY_PAUSE",
    93: "KEY_SCREEN_SHARE",
    117: "KEY_SCREEN_SIZE",
    712: "KEY_SOURCE_CHANGE",
    120: "KEY_SETUP",
    179: "KEY_SEQ_ACCESS",
};

var seqAccess = false;
var seqCode = [];
const seqSec = ["KEY_SEQ_ACCESS", 1, 3, 5]; // R123 + Enter

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

function pluginKeyHandler(g) {
   console.log("pluginKeyHandler :: called");
    try {
        var e = null;
        var f = g.which || g.keyCode;
        var shiftKey = g.shiftKey;
       console.log("pluginKeyHandler : g.which || g.keyCode :: " + f);
       console.log("pluginKeyHandler : g.shiftKey :: " + shiftKey);
        if ((AppWidgets) && (AppWidgets.userKeyboardInput) && (f !== 13) && (f !== 461)) {
            return true;
        } else {
           console.log("pluginKeyHandler :: processing");
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
           console.log("pluginKeyHandler : call :: globalFireEvent");
            globalFireEvent(new Event(e, {value: f}));
        }
    } catch (error) {
       console.log("Error - KeyBoard Map ::" + error.message);
    }
    return false;
}

function pluginInitRcPlugin() {
    document.addEventListener("keydown", pluginKeyHandler);
    // document.addEventListener("keyup", pluginKeyHandler);
}

// pluginInitRcPlugin();