const baseUrl = "https://trade-service.wealthsimple.com"
var Client = {
    login: function(body){
        return fetch(baseUrl + "/auth/login", {
            headers: {
                "Accept": "application/json", 
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify(body)
        })
        .then((response) => console.log(response))
        //.then(response => response.json())
        //.then(json => console.log(json))
    },
    loginXhr: function(body) {
        return new Promise(function (resolve, reject) {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", baseUrl + "/auth/login");
            xhr.setRequestHeader("Accept", "application/json");
            xhr.setRequestHeader("Content-Type", "application/json");
            xhr.onload = resolve;
            xhr.onerror = reject;
            xhr.send(JSON.stringify(body));
        })
        .then((resp) => resp.target);
    },
    getAccounts: function(oauthToken, oauthToken) {
        return fetch(baseUrl + "/account/list", {
            headers: {"Authorization": "bearer " + oauthToken}
        })
            .then(response => response.json())
    },
    accountHistory: function(oauthToken, accountId, interval) {
        return fetch(baseUrl + "/account/history/" + interval + "?" + new URLSearchParams({
            "account_id": accountId
        }), {
            headers: {"Authorization": "bearer " + oauthToken}
        })
            .then(response => response.json())
    },
    parseResponseHeaders: function (headerStr) {
        return Object.fromEntries(
            (headerStr || '').split('\u000d\u000a') // '\n'
                .map(line => line.split('\u003a\u0020')) // ": "
                .filter(pair => pair[0] !== undefined && pair[1] !== undefined)
        );
    }
}
