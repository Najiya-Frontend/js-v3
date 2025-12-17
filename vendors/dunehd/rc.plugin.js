var pluginKeymap = {
    38: "KEY_UP",
    40: "KEY_DOWN",
    39: "KEY_RIGHT",
    37: "KEY_LEFT",
    33: "KEY_CHANNEL_UP",
    34: "KEY_CHANNEL_DOWN",
    8: "KEY_BACK",
    200: "KEY_MENU",
    13: "KEY_SELECT",
    193: "KEY_RED",
    194: "KEY_GREEN",
    195: "KEY_YELLOW",
    196: "KEY_BLUE",
    173: "KEY_MUTE",
    175: "KEY_VOLUME_UP",
    174: "KEY_VOLUME_DOWN",
    178: "KEY_STOP",
    204: "KEY_REWIND",
    205: "KEY_FFORWARD",
    250: "KEY_PLAY"
};
function pluginKeyHandler(b) {
    var a = null;
    var c = null;
    var c = b.which || b.keyCode;
    if (c < 58 && c >= 48) {
        a = (ScreenManager.getCurrentScreen().name == "ROOM_KEEPER" || ScreenManager.getCurrentScreen().name == "SERVICE") ? "KEY_CODE" : "KEY_NUMERIC";
        c = c - 48
    } else {
        a = pluginKeymap[c]
    }
    if (SCREEN_MODE == 1) {
        switch (a) {
            case"KEY_UP":
                a = "KEY_CHANNEL_UP";
                break;
            case"KEY_DOWN":
                a = "KEY_CHANNEL_DOWN";
                break;
            case"KEY_RIGHT":
                a = "KEY_VOLUME_UP";
                break;
            case"KEY_LEFT":
                a = "KEY_VOLUME_DOWN";
                break
        }
    } else {
        if (VOD_SCREEN_MODE == 1) {
            switch (a) {
                case"KEY_UP":
                case"KEY_RIGHT":
                    a = "KEY_VOLUME_UP";
                    break;
                case"KEY_DOWN":
                case"KEY_LEFT":
                    a = "KEY_VOLUME_UP";
                    break
            }
        }
    }
    if (a == "KEY_MENU") {
    }
    globalFireEvent(new Event(a, {value: c}));
    return false
}
function pluginInitRcPlugin() {
    try {
        window.focus();
        if (navigator.userAgent.search(/arora/i) != -1) {
            window.onkeydown = pluginKeyHandler
        } else {
            if (navigator.userAgent.search(/opera/i) != -1) {
                window.onkeypress = pluginKeyHandler
            }
        }
    } catch (b) {
       console.log(b.message)
    }
};