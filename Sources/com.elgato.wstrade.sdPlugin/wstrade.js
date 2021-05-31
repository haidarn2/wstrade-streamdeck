const baseUrl = "https://trade-service.wealthsimple.com"
var WsTrade = {
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
