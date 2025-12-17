var pluginKeymap = {
    38: "KEY_UP",
    40: "KEY_DOWN",
    39: "KEY_RIGHT",
    37: "KEY_LEFT",
    33: "KEY_CHANNEL_UP",
    34: "KEY_CHANNEL_DOWN",
    4: "KEY_BACK",
    113: "KEY_HOME",
    113: "KEY_HOME",
    113: "KEY_HOME",
    121: "KEY_TV",
    122: "KEY_MAIN",
    13: "KEY_SELECT",
    82: "KEY_LIST",
    183: "KEY_RED",
    27: "KEY_GREEN",
    185: "KEY_YELLOW",
    186: "KEY_BLUE",
    89: "KEY_GUIDE",
    87: "KEY_SEARCH",
    74: "KEY_STAR",
    69: "KEY_EXIT",
    107: "KEY_VOLUME_UP",
    109: "KEY_VOLUME_DOWN",
    85: "POWER_BUTTON",
    192: "KEY_MUTE",
    227: "KEY_REWIND",
    228: "KEY_FFORWARD",
    177: "KEY_PREV",
    176: "KEY_NEXT",
    83: "KEY_STOP",
    179: "KEY_PLAY",
    179: "KEY_PAUSE",
    116: "KEY_SWITCH_APP",
    117: "KEY_SCREEN_SIZE",
    120: "KEY_SETUP",
    179: "KEY_SEQ_ACCESS",
};

var seqAccess = false;
var seqCode = [];
const seqSec = ["KEY_SEQ_ACCESS", 1, 3, 5]; // R123 + Enter

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
    try {
        var e = null;
        var f = g.which || g.keyCode;
        var shiftKey = g.shiftKey;
        if ((AppWidgets) && (AppWidgets.userKeyboardInput) && (f !== 13) && (f !== 4)) {
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
            globalFireEvent(new Event(e, {value: f}));
        }
    } catch (error) {
       console.log("Error - KeyBoard Map ::" + error.message);
    }
    return false;
}

function pluginInitRcPlugin() {
    document.onkeydown = pluginKeyHandler;//MAG256
    // document.onkeyup = pluginKeyHandler;//MAG256
    // document.addEventListener("keydown", pluginKeyHandler, false);// LG
}

pluginInitRcPlugin();