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

function openExternalLogin() {
    window.xtWindow = window.open('login_pi.html', "WS Trade Login");
    setTimeout(() => window.xtWindow.postMessage('initPropertyInspector', '*'), 1500);
}

function loginSubmit() {
    let req = {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value
    }
    Client.loginXhr(req)
    .then((resp) => {
        // unhide otp
        document.getElementById("otp-wrapper").style = "";
    })
}

function otpSubmit() {
    let req = {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
        otp: document.getElementById("login-otp").value
    }
    Client.loginXhr(req)
    .then((resp) => resp.getAllResponseHeaders())
    .then((respHeadersStr) => Client.parseResponseHeaders(respHeadersStr))
    .then((headers) => {
        document.getElementById("login-oauth").value = headers["x-access-token"];
        document.getElementById("login-oauth-refresh").value = headers["x-refresh-token"];
        document.getElementById("login-oauth-expiry").value = new Date(headers["x-access-token-expires"] * 1000);
        // unhide oauth
        document.getElementById("oauth-wrapper").style = "";
    })
}

function oauthVerify() {
    console.log("sup tho");
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