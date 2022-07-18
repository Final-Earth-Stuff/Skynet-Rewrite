import * as t from "io-ts";

export const Coordinates = t.type({
    latitude: t.number,
    longitude: t.number,
});

export const Facilities = t.type({
    rigs: t.number,
    mines: t.number,
    factories: t.number,
    groundDefences: t.number,
    airDefences: t.number,
});

export const Units = t.type({
    axis: t.number,
    allies: t.number,
});

export const CountryData = t.type({
    id: t.string,
    name: t.string,
    region: t.string,
    control: t.number,
    controlTeam: t.number,
    initialControl: t.number,
    coastline: t.number,
    land: t.number,
    code: t.string,
    isActiveSpawn: t.boolean,
    isSpawn: t.boolean,
    coordinates: Coordinates,
    facilities: Facilities,
    units: Units,
});

export type CountryData = t.TypeOf<typeof CountryData>;
