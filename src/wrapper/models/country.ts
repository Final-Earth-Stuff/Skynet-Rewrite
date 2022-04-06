export interface CountryData {
    id: number,
    name: string,
    region: string,
    control: number,
    controlTeam: number,
    initialControl: number,
    coastline: number,
    land: number,
    code: string,
    isActiveSpawn: boolean,
    isSpawn: boolean,
    coordinates: Coordinates,
    facilities: Facilities,
    units: Units
}

export interface Coordinates {
    latitude: number,
    longitude: number
}

export interface Facilities {
    rigs: number,
    mines: number,
    factories: number,
    groundDefences: number,
    airDefences: number
}

export interface Units {
    axis: number,
    allies: number
}