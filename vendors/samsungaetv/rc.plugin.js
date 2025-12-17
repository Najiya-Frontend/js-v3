var pluginKeymap = {
    29460: "KEY_UP",
    29461: "KEY_DOWN",
    5: "KEY_RIGHT",
    4: "KEY_LEFT",
    68: "KEY_CHANNEL_UP",
    65: "KEY_CHANNEL_DOWN",
    88: "KEY_BACK",
    261: "KEY_HOME",
    261: "KEY_HOME",
    261: "KEY_HOME",
    84: "KEY_TV",
    75: "KEY_MAIN",
    29443: "KEY_SELECT",
    82: "KEY_LIST",
    108: "KEY_RED",
    404: "KEY_GREEN",
    20: "KEY_GREEN",
    21: "KEY_YELLOW",
    22: "KEY_BLUE",
    89: "KEY_GUIDE",
    87: "KEY_SEARCH",
    90: "KEY_STAR",
    45: "KEY_EXIT",
    7: "KEY_VOLUME_UP",
    11: "KEY_VOLUME_DOWN",
    85: "POWER_BUTTON",
    27: "KEY_MUTE",
    69: "KEY_REWIND",
    72: "KEY_FFORWARD",
    69: "KEY_PREV",
    72: "KEY_NEXT",
    70: "KEY_STOP",
    71: "KEY_PLAY",
    74: "KEY_PAUSE",
    116: "KEY_SWITCH_APP",
    117: "KEY_SCREEN_SIZE",
    120: "KEY_SETUP",
    179: "KEY_SEQ_ACCESS",
};

function pluginKeyHandler(g) {
    try {
        var e = null;
        var f = g.which || g.keyCode;
        var shiftKey = g.shiftKey;
        if (f == 101) {
            e = "KEY_NUMERIC";
            f = 1;
        } else if (f == 98) {
            e = "KEY_NUMERIC";
            f = 2;
        } else if (f == 6) {
            e = "KEY_NUMERIC";
            f = 3;
        } else if (f == 8) {
            e = "KEY_NUMERIC";
            f = 4;
        } else if (f == 9) {
            e = "KEY_NUMERIC";
            f = 5;
        } else if (f == 10) {
            e = "KEY_NUMERIC";
            f = 6;
        } else if (f == 12) {
            e = "KEY_NUMERIC";
            f = 7;
        } else if (f == 13) {
            e = "KEY_NUMERIC";
            f = 8;
        } else if (f == 14) {
            e = "KEY_NUMERIC";
            f = 9;
        } else if (f == 17) {
            e = "KEY_NUMERIC";
            f = 0;
        } else {
            if (shiftKey) {
                if (f == 9) {
                    e = pluginKeymap[539];
                }
            } else {
                e = pluginKeymap[f];
            }
        }
    } catch (d) {
        //
    }
    globalFireEvent(new Event(e, {
        value: f
    }));
    return false;
}

function pluginInitRcPlugin() {
    document.onkeydown = pluginKeyHandler;// MAG256
    // document.onkeyup = pluginKeyHandler;// MAG256
    // document.addEventListener("keydown", pluginKeyHandler, false);// LG
}

pluginInitRcPlugin();