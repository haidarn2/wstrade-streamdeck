const baseUrl = "https://trade-service.wealthsimple.com"
var WsTrade = {
    getAccounts: function() {
        fetch(baseUrl + "/account/list", {
            headers: {"Authorization": "bearer placeholder"}
        })
            .then(response => response.json())
            .then(data => console.log(data));
    },
    accountHistory: function(accountId, interval) {
        fetch(baseUrl + "/account/history/" + interval + "?" + new URLSearchParams({
            "account_id": accountId
        }), {
            headers: {"Authorization": "bearer placeholder"}
        })
            .then(response => response.json())
            .then(data => console.log(data));
    }
}