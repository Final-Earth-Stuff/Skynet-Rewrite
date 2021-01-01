function earthScan() {
    const fetch = require('node-fetch');
    const urls = require('../config_files/url');

    return {
        getEarth,
    };

    async function getEarth() {
        url = urls.map;
        let response = await fetch(url)
                .then((data) => {
                    return data.json();
                })
                .then((res) => {
                    return res;
                });
        return response;
    }
}

module.exports = earthScan();
