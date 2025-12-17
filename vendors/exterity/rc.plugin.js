var pluginKeymap = {
    38: "KEY_UP",
    40: "KEY_DOWN",
    39: "KEY_RIGHT",
    37: "KEY_LEFT",
    427: "KEY_CHANNEL_UP", //pc pageup 33, stb exterity 427
    409: "POWER_OFF",
    428: "KEY_CHANNEL_DOWN", //pc pageup 34, stb exterity 428    
    //36:"KEY_HOME",
    406: "KEY_BACK", //exterity does not have back so set blue color, in pc back is 8
    1073741844: "KEY_MENU", //STB : 403  , I changed to 109 for Key 'M' in PC ,1073741844
    462: "KEY_MENU", //STB : 403  , I changed to 109 for Key 'M' in PC ,1073741844
    13: "KEY_SELECT",
    403: "KEY_RED", //STB : 112  , I changed to 104 for Key 'H' in PC
    404: "KEY_GREEN", //Pc 103 'G' Letter  //STB 404
    405: "KEY_YELLOW", //STB : 405  , I changed to 111 for Key 'Y' in PC
    //406:"KEY_BLUE",
    //116:"KEY_VOD",
    //117:"KEY_TV",
    //118:"KEY_ON_OFF",
    //119:"KEY_HELP",
    //413:"KEY_RECORD",
    //121:"KEY_MUTE",
    //122:"KEY_TEXT",
    //105:"KEY_INFO", //STB 123  , I changed to 105 for Key 'I' for Pc
    //125:"KEY_QUIT",
    447: "KEY_VOLUME_UP",
    448: "KEY_VOLUME_DOWN",
    413: "KEY_STOP", //STB 413, PC S=115
    412: "KEY_REWIND", //STB 412, R=114
    417: "KEY_FFORWARD", //STB 417 , F=102
    415: "KEY_PLAY", //STB 415 , P=112
    1073741831: "KEY_PAUSE" //STB 19, Z=122
            //131:"KEY_LANGUAGE",
            //132:"KEY_SUBTITLE",
            //101:"KEY_GUIDE", //STB 125  , I changed to 101 for Key 'e' for Pc
            //405:"KEY_FAV" //STB yellow button key set   , I changed to 102 for Key 'F' for Pc
            //Some STB Values AV:148, STB:143, P<->P : 35, VOD : 116, Red:112, Green:128, Yellow:114, Blue:115,
            //lang :131, sub:132, options:133, help:119, interactive :130, mute:121
};

function pluginKeyHandler(a) {
    var c = null;
    var b = null;
    /*
     if(a.consume!==undefined){
     a.consume()
     }
     if(a.preventDefault!==undefined){
     a.preventDefault()
     }
     */
    b = a.which || a.keyCode;
    if (b < 58 && b >= 48) {
        c = (ScreenManager.getCurrentScreen().name == "ROOM_KEEPER" || ScreenManager.getCurrentScreen().name == "SERVICE") ? "KEY_CODE" : "KEY_NUMERIC";
        b = b - 48
    } else {
        c = pluginKeymap[b]
    }
    if (c == "KEY_MENU") {
        //globalLoadApplication()
    }
    globalFireEvent(new Event(c, {
        value: b
    }));
    return false
}
function pluginInitRcPlugin() {
    document.onkeypress = pluginKeyHandler
}
