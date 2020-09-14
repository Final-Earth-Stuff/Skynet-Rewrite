function List() {
    let types = {
        scanning: ['init', 'scan'],
        report: ['europe', 'middle', 'north', 'south', 'africa', 'asia', 'aust', 'carib', 'totals', 'proximity', 'prox', 'oil', 'factories', 'facs'],
        utility: ['distance', 'dis', 'remind', 'route', 'verify', 'autoverify'],
    };

    let loadedModules = ['scanning'];

    function help(mod) {
        if (mod == 'scanning') {
            return [
                {
                    list: '!init',
                },
                {
                    name: 'init',
                    syntax: '!init',
                    description: 'Initialises data from Final Earth',
                },
            ];
        }
    }

    return {
        types,
        loadedModules,
        help,
    };
}

module.exports = List();
