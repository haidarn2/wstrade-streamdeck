// oauth headers
const OAUTH_TOKEN = "x-access-token";
const REFRESH_TOKEN = "x-refresh-token";
const TOKEN_EXPIRY = "x-access-token-expires";
const OTP_REQURED_HEADER = "x-wealthsimple-otp-required";
const OTP_OPTS_HEADER = "x-wealthsimple-otp";
const OTP_OPTS_PREFIX = "required; method=sms; digits=";

// element ids
const LOGIN_EMAIL_INPUT = "login-email";
const LOGIN_PASSWORD_INPUT = "login-password";
const LOGIN_SUBMIT_BUTTON = "login-submit";
const OTP_WRAPPER = "otp-wrapper";
const OTP_OPTS_WRAPPER = "login-otp-opts-wrapper";
const OTP_OPTS_DETAIL = "login-otp-opts";
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
    .then((resp) => resp.getAllResponseHeaders())
    .then((respHeadersStr) => Client.parseResponseHeaders(respHeadersStr))
    .then((headers) => {
        if (headers[OTP_OPTS_HEADER] && headers[OTP_OPTS_HEADER].startsWith(OTP_OPTS_PREFIX)) {
             // unhide OTP opts string
             e(OTP_OPTS_WRAPPER).style = "";
             e(OTP_OPTS_DETAIL).innerHTML = "SMS sent to number ending in " + headers[OTP_OPTS_HEADER].slice(-2)
        }
        return headers;
    })
    .then((_headers) => {
        console.log(_headers);
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
