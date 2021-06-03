//var sendValueToPluginCallback;

function loginSubmit() {
    let req = {
        email: document.getElementById("login-email").value,
        password: document.getElementById("login-password").value
    }
    Client.login(req)
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
    Client.login(req)
    .then((resp) => resp.getAllResponseHeaders())
    .then((respHeadersStr) => Client.parseResponseHeaders(respHeadersStr))
    .then((headers) => {
        document.getElementById("login-oauth").innerHTML = headers["x-access-token"];
        document.getElementById("login-oauth-refresh").innerHTML = headers["x-refresh-token"];
        document.getElementById("login-oauth-expiry").innerHTML = new Date(headers["x-access-token-expires"] * 1000);
        // unhide oauth
        document.getElementById("oauth-wrapper").style = "";
        return Client.getAccounts(headers["x-access-token"]);
    })
    .then((resp) => {
        let accounts = resp.results.map((acc) => {
            let type = acc.id.startsWith('tfsa') ? 'TFSA' 
            : acc.id.startsWith('rrsp') ? 'RRSP'
            : acc.id.startsWith('non-registered-crypto') ? 'CRYPTO'
            : 'PERSONAL';
            return {type: type, id: acc.id}
          });
        let account_selector = document.getElementById("account-select");
        accounts.forEach((acc) => {
            let opt = document.createElement("option");
            opt.value = JSON.stringify(acc);
            opt.innerHTML = acc.type + " " + acc.id;
            account_selector.appendChild(opt);
        })
    })
}

function saveAndClose() {
    let account = JSON.parse(document.getElementById("account-select").value)
    let payload = {
        "x-access-token": document.getElementById("login-oauth").innerHTML,
        "x-refresh-token": document.getElementById("login-oauth-refresh").innerHTML,
        "x-access-token-expires": document.getElementById("login-oauth-expiry").innerHTML,
        "accountType": account.type,
        "accountId": account.id
    }
    window.opener.saveSettings(payload);
    window.opener.refreshSettings();
    window.close();
}
