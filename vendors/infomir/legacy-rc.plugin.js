var pluginKeymap = {
    38: "KEY_UP",
    40: "KEY_DOWN",
    39: "KEY_RIGHT",
    37: "KEY_LEFT",
    9: "KEY_CHANNEL_UP",
    539: "KEY_CHANNEL_DOWN",
    8: "KEY_BACK",
    27: "KEY_MENU",
    13: "KEY_SELECT",
    112: "KEY_RED",
    113: "KEY_GREEN",
    114: "KEY_YELLOW",
    115: "KEY_BLUE",
    192: "KEY_MUTE",
    121: "KEY_TV",
    107: "KEY_VOLUME_UP",
    109: "KEY_VOLUME_DOWN",
    85: "POWER_BUTTON",
    83: "KEY_STOP",
    66: "KEY_REWIND",
    70: "KEY_FFORWARD",
    82: "KEY_PLAY",
    82: "KEY_PAUSE"
};

function pluginKeyHandler(g) {
    try {
        var e = null;
        var f = g.which || g.keyCode;
        var shiftKey = g.shiftKey;
        //top.kwConsole.print("KeyBoard Listener" + f);
        if (f < 58 && f >= 48) {
            e = "KEY_NUMERIC";
            f = f - 48;
        } else {
            if (shiftKey) {
                //top.kwConsole.print("KeyBoard Listener :: shiftKey PRESSED");
                if (f == 9) {
                    e = pluginKeymap[539];
                }
            } else {
                e = pluginKeymap[f];
            }
        }
        //top.kwConsole.print("KeyBoard Map" + e);
    } catch (d) {
        //
    }
    if(top.MessageManager.msgIsInfobarHidden == false){
        if(f != 115 && f != 85){
            e = null;
            f = null;
        }
    }
    top.globalFireEvent(new Event(e, {
        value: f
    }));
    return false;
}

function pluginInitRcPlugin() {
    document.onkeydown = pluginKeyHandler;
}
pluginInitRcPlugin();