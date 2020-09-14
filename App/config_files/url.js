function url() {
    const fe = 'https://www.finalearth.com';
    const map = fe + '/users/map';
    const discord = fe + '/discord/get?uid=@discordid';

    return {
        map,
        discord,
    };
}

module.exports = url();
