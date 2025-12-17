var pluginKeymap = {
    38: "KEY_UP",
    40: "KEY_DOWN",
    39: "KEY_RIGHT",
    37: "KEY_LEFT",
    427: "KEY_CHANNEL_UP",
    428: "KEY_CHANNEL_DOWN",
    461: "KEY_BACK",
    462: "KEY_MENU",
    13: "KEY_SELECT",
    403: "KEY_RED",
    404: "KEY_GREEN",
    405: "KEY_YELLOW",
    406: "KEY_BLUE",
    449: "KEY_MUTE",
    447: "KEY_VOLUME_UP",
    448: "KEY_VOLUME_DOWN",
    409: "POWER_BUTTON",
    413: "KEY_STOP",
    412: "KEY_REWIND",
    417: "KEY_FFORWARD",
    415: "KEY_PLAY",
    463: "KEY_PAUSE"
};

function pluginKeyHandler(g) {
    try {
        var e = null;
        var f = g.which || g.keyCode;
        if (f < 58 && f >= 48) {
            e = "KEY_NUMERIC";
            f = f - 48
        } else {
            e = pluginKeymap[f]
        }
    } catch (d) {}
    globalFireEvent(new Event(e, {
        value: f
    }));
    return false
}

function pluginInitRcPlugin() {
    document.onkeydown = pluginKeyHandler
}
pluginInitRcPlugin();