function countryInfo() {
    const dbConnect = require('../connectors/dbConnect.js');

    return {
        control,
    };

    async function control(id) {
        let meta = await dbConnect.viewEarthMeta(id);
        let active = await dbConnect.viewEarthActive(id);
        let bar = active[id].control;
        if (active[id].team == 0) {
            (marker = ':white_circle:'), (bar = 50);
        }
        if (active[id].team == 1) {
            marker = ':green_circle:';
        }
        if (active[id].team == 2) {
            (marker = ':red_circle:'), (bar = 100 - active[id].control);
        }
        return {
            text: `${marker} ${meta[id].name} (${bar}%)`,
            bar: bar,
            team: active[id].team,
        };
    }
}

module.exports = countryInfo();
