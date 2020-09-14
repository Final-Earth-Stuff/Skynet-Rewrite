function discord() {
    let developer = {
        author: 'boo [1544641]',
        version: '1.0',
    };

    let channels = {
        dev: '716682964875870320',
        lobby: '723201182834884688',
        webhook: '748904696235687938',
        allies: '723623924054622380',
        axis: '741220571555037275',
        units: '716678895096561725',
        facilities: '716680482993209386',
    };

    let roles = {
        allies: '716677333582610472',
        axis: '716678322536316968',
    };

    return {
        developer,
        channels,
        roles,
    };
}

module.exports = discord();
