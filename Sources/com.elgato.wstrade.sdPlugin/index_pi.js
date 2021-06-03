var pluginAction = null, uuid = ''

if ($SD) {
    $SD.on('connected', function (jsonObj) {
        uuid = jsonObj['uuid'];
        if (jsonObj.hasOwnProperty('actionInfo')) {
            pluginAction = jsonObj.actionInfo['action'];
        }
    });
};

/** you can also use ES6 syntax like so:
*
*   if ($SD) $SD.on('connected', (jsonObj) => { uuid=jsonObj.uuid }));
*    
*/

function sendValueToPlugin(value, param) {
    //console.log("SENDING VALUE TO PLUGIN: ", value, uuid, pluginAction);
    if ($SD && $SD.connection) {
        var payload = {};
        if (param) {
            payload[param] = value;
        }
        $SD.api.sendToPlugin(uuid, pluginAction, payload);
    }
}

function openExternalLogin() {
    window.xtWindow = window.open('login_pi.html', "WS Trade Login");
    setTimeout(() => window.xtWindow.postMessage('initPropertyInspector', '*'), 1500);
}
