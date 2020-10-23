function vectorCalculator() {
    const dbConnect = require('../connectors/dbConnect');

    return {
        haversine,
    };

    async function haversine([lat1, lon1], [lat2, lon2], bonus) {
        let radian = 180 / Math.PI;
        let radius = 6381.372; // earth's radius in km
        let speed = 26.9967456; // estimated FE travel speed in kmh

        let lat = [],
            dLat,
            dLon,
            a,
            c,
            d,
            eta;
        (lat[0] = lat1 / radian), (lat[1] = lat2 / radian);
        dLat = (lat2 - lat1) / radian;
        dLon = (lon2 - lon1) / radian;
        a = capAndCollar(Math.sin(dLat / 2) ** 2 + Math.cos(lat[0]) * Math.cos(lat[1]) * Math.sin(dLon / 2) ** 2, -1, 1);
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        d = radius * c;

        eta = (d / speed) * (1 - bonus / 100);

        return {
            dist: Math.round((d * 100) / 100),
            eta: Math.round(eta),
            bonus: bonus,
        };
    }

    function capAndCollar(x, min, max) {
        if (x < min) {
            x = min;
        }
        if (x > max) {
            x = max;
        }
        return x;
    }
}

module.exports = vectorCalculator();
