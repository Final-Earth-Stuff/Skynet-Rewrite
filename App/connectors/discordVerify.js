function discordVerify() {
    const fetch = require('node-fetch');
    const urls = require('../config_files/url');

    return {
        getUser,
    };

    async function getUser(discordid, xMsg) {
        url = urls.discord.replace('@discordid', discordid);
        let response = new Promise((resolve, reject) => {
            fetch(url)
                .then((data) => {
                    return data.json();
                })
                .then((res) => {
                    resolve(res);
                });
        });
        return response;
    }
}

module.exports = discordVerify();
