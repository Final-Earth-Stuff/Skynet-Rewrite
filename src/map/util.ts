import { Data } from "../map";
import { greatCircleDist } from "../map/geometry";

export function travelTime(
    distKm: number,
    points?: number,
    paratrooper?: boolean | null
): number {
    return Math.round(
        (1 - (points ?? 0) / 100) *
            (paratrooper ? 0.9 : 1) *
            (distKm / 1.609344 / 1000.0) *
            60
    );
}

export function convertToKm(
    travelTime: number,
    points: number,
    paratrooper: boolean
): number {
    return (
        (travelTime * 1.609344 * 1000.0) /
        60 /
        (paratrooper ? 0.9 : 1) /
        (1 - points / 100)
    );
}

export function getDistance(
    origin: number,
    destination: number,
    travelPoints?: number,
    paratrooper?: boolean | null
) {
    const oC = Data.shared.country(origin);
    const dC = Data.shared.country(destination);

    if (!oC || !dC) {
        throw new Error("Unknown country id");
    }

    const distKm = greatCircleDist(oC.coordinates, dC.coordinates);
    return travelTime(distKm, travelPoints, paratrooper);
}
