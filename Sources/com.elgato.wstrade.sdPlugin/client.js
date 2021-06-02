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
        //.then(response => response.json())
        //.then(json => console.log(json))
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
    }
}
