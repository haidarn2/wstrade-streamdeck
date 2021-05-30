var WsTrade = {
    auth: function() {
        fetch('https://trade-service.wealthsimple.com/account/list', {
            headers: {"Authorization": "bearer placeholder"}
        })
            .then(response => response.json())
            .then(data => console.log(data));
    }
}