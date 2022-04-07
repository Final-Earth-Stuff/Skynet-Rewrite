export function travelTime(
    distKm: number,
    points?: number,
    paratrooper?: boolean | null
): number {
    return Math.round(
        (1 - (points ?? 0) / 100) *
            (paratrooper ? 0.9 : 1) *
            (Math.floor(distKm) / 1.609344 / 1000.0) *
            60
    );
}
