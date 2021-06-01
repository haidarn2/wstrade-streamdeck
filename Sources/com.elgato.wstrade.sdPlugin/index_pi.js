var pluginAction = null,
uuid = '',
aValueSlider = document.querySelectorAll('.setvalueSlider'),
oValueSelector = document.querySelector(".setvalueSelect");

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
    // console.log("SENDING VALUE TO PLUGIN: ", value, uuid, pluginAction);
    if (param === 'setValue') {

        aValueSlider && Array.prototype.forEach.call(aValueSlider, function (ctl) {
            ctl.value = value;
        })

        oValueSelector && Array.prototype.forEach.call(oValueSelector.options, function (o) {
            const val = Math.round(value);
            if (o.value !== val) {
                oValueSelector.value = val;
            }
        })
    }

    if ($SD && $SD.connection) {
        var payload = {};
        if (param) {
            payload[param] = value;
        }
        $SD.api.sendToPlugin(uuid, pluginAction, payload);
    }
}

function openMeExternal() {
    window.xtWindow = window.open('index_pi.html', "PI Samples");
    setTimeout(() => window.xtWindow.postMessage('initPropertyInspector', '*'), 1500);
}

function oauthChange() {
    document.getElementById("oauth-submit").disabled = !document.getElementById("oauth-input").checkValidity();
}

function oauthSubmit() {
    let payload = {
        "accountId": document.getElementById("account-id").value,
        "oauthToken": document.getElementById("oauth-input").value
    }
    sendValueToPlugin(payload, 'pi-save-button');
}