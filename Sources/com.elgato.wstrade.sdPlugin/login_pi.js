var sendValueToPluginCallback;

function loginSubmit() {
    let payload = {
        "x-access-token": "1234",
        "x-refresh-token": "1234",
        "x-access-token-expires": "1234",
        "accountId": "1234"
    }
    sendValueToPluginCallback(payload, 'save-oauth');
    console.log(sendValueToPluginCallback);
    //let req = {
    //    email: document.getElementById("login-email").value,
    //    password: document.getElementById("login-password").value
    //}
    //Client.login(req)
    //.then((resp) => {
    //    // unhide otp
    //    document.getElementById("otp-wrapper").style = "";
    //})
}

function otpSubmit() {
    let req = {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value,
        otp: document.getElementById("login-otp").value
    }
    Client.login(req)
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
    let payload = {
        "x-access-token": document.getElementById("login-oauth").value,
        "x-refresh-token": document.getElementById("login-oauth-refresh"),
        "x-access-token-expires": document.getElementById("login-oauth-expiry").value,
        "accountId": "non-registered-gsdjith2"
    }
    //sendValueToPlugin(payload, 'save-oauth');
    window.close();
}
