function discordVerify() {
    const fetch = require('node-fetch');
    const urls = require('../config_files/url');

    return {
        getUser,
    };

    async function getUser(discordid, xMsg) {
        url = urls.discord.replace('@discordid', discordid);
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

module.exports = discordVerify();
