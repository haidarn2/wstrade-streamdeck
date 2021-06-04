// oauth headers
const OAUTH_TOKEN = "x-access-token";
const REFRESH_TOKEN = "x-refresh-token";
const TOKEN_EXPIRY = "x-access-token-expires";

// element ids
const LOGIN_EMAIL_INPUT = "login-email";
const LOGIN_PASSWORD_INPUT = "login-password";
const LOGIN_SUBMIT_BUTTON = "login-submit";
const OTP_WRAPPER = "otp-wrapper";
const OTP_LOGIN_INPUT = "login-otp";
const OTP_SUBMIT_BUTTON = "otp-submit";
const OAUTH_WRAPPER = "oauth-wrapper";
const OAUTH_TOKEN_DETAIL = "login-oauth";
const OAUTH_REFRESH_DETAIL = "login-oauth-refresh";
const OAUTH_EXPIRY_DETAIL = "login-oauth-expiry";
const ACCOUNT_SELECT = "account-select"

function e(id) {
    return document.getElementById(id);
}

function loginSubmit() {
    let req = {
        email: e(LOGIN_EMAIL_INPUT).value,
        password: e(LOGIN_PASSWORD_INPUT).value
    }
    Client.login(req)
    .then((resp) => {
        console.log(resp);
        // disable inputs
        e(LOGIN_EMAIL_INPUT).disabled = true;
        e(LOGIN_PASSWORD_INPUT).disabled = true;
        e(LOGIN_SUBMIT_BUTTON).disabled = true;
        // unhide otp
        e(OTP_WRAPPER).style = "";
    })
}

function otpSubmit() {
    let req = {
        email: e(LOGIN_EMAIL_INPUT).value,
        password: e(LOGIN_PASSWORD_INPUT).value,
        otp: e(OTP_LOGIN_INPUT).value
    }
    Client.login(req)
    .then((resp) => resp.getAllResponseHeaders())
    .then((respHeadersStr) => Client.parseResponseHeaders(respHeadersStr))
    .then((headers) => {
        e(OAUTH_TOKEN_DETAIL).innerHTML = headers[OAUTH_TOKEN];
        e(OAUTH_REFRESH_DETAIL).innerHTML = headers[REFRESH_TOKEN];
        e(OAUTH_EXPIRY_DETAIL).innerHTML = new Date(headers[TOKEN_EXPIRY] * 1000);
        // disable inputs
        e(OTP_SUBMIT_BUTTON).disabled = true;
        e(OTP_LOGIN_INPUT).disabled = true;
        // unhide oauth
        e(OAUTH_WRAPPER).style = "";
        return Client.getAccounts(headers[OAUTH_TOKEN]);
    })
    .then((resp) => {
        let accounts = resp.results.map((acc) => {
            let type = acc.id.startsWith('tfsa') ? 'TFSA' 
            : acc.id.startsWith('rrsp') ? 'RRSP'
            : acc.id.startsWith('non-registered-crypto') ? 'CRYPTO'
            : 'PERSONAL';
            return {type: type, id: acc.id}
          });
        accounts.forEach((acc) => {
            let opt = document.createElement("option");
            opt.value = JSON.stringify(acc);
            opt.innerHTML = acc.type + " " + acc.id;
            e(ACCOUNT_SELECT).appendChild(opt);
        })
    })
}

function saveAndClose() {
    let account = JSON.parse(e(ACCOUNT_SELECT).value)
    let payload = {
        "x-access-token": e(OAUTH_TOKEN_DETAIL).innerHTML,
        "x-refresh-token": e(OAUTH_REFRESH_DETAIL).innerHTML,
        "x-access-token-expires": e(OAUTH_EXPIRY_DETAIL).innerHTML,
        "accountType": account.type,
        "accountId": account.id
    }
    window.opener.saveSettings(payload);
    window.opener.refreshSettings();
    window.close();
}
