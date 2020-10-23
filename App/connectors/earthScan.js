function earthScan() {
    const fetch = require('node-fetch');
    const urls = require('../config_files/url');

    return {
        getEarth,
    };

    async function getEarth() {
        url = urls.map;
        let response = new Promise((resolve, reject) => {
            try { 
                fetch(url)
                .then((data) => {
                    return data.json();
                })
                .then((res) => {
                    resolve(res);
                });
            } catch(err) {
                reject(err)
            }
        });
        return response;
    }
}

module.exports = earthScan();
