export interface Coordinates {
    x: number;
    y: number;
    z: number;
}

export interface GeoCoordinates {
    latitude: number;
    longitude: number;
}

export function euclideanMetric(c1: Coordinates, c2: Coordinates): number {
    return Math.sqrt(
        (c1.x - c2.x) ** 2 + (c1.y - c2.y) ** 2 + (c1.z - c2.z) ** 2
    );
}

export function projectToUnitSphere(geo: GeoCoordinates): Coordinates {
    const phi = (Math.PI / 180) * geo.longitude;
    const theta = Math.PI / 2 - (Math.PI / 180) * geo.latitude;
    return {
        x: Math.cos(phi) * Math.sin(theta),
        y: Math.sin(phi) * Math.sin(theta),
        z: Math.cos(theta),
    };
}

export function haversine(theta: number): number {
    return (1 - Math.cos(theta)) / 2;
}

const RADIUS_EARTH = 6371;

export function greatCircleDist(
    c1: GeoCoordinates,
    c2: GeoCoordinates
): number {
    const phi1 = (Math.PI / 180) * c1.latitude;
    const phi2 = (Math.PI / 180) * c2.latitude;
    const theta1 = (Math.PI / 180) * c1.longitude;
    const theta2 = (Math.PI / 180) * c2.longitude;
    const a =
        haversine(phi2 - phi1) +
        Math.cos(phi1) * Math.cos(phi2) * haversine(theta2 - theta1);

    // this is so dumb...
    const alph = 2 * Math.asin(Math.sqrt(a));
    const deg = (alph * 180) / Math.PI;
    const miles = deg * 60 * 1.1515;

    return Math.round(Math.round(miles) * 1.609344);
}

export function gcToEuclidean(d: number): number {
    return 2 * Math.sin(d / (2 * RADIUS_EARTH));
}

export function euclideanToGc(d: number): number {
    return Math.asin(d / 2) * 2 * RADIUS_EARTH;
}
