import { readFile, access, mkdir, writeFile } from "fs/promises";

import fuzzysort from "fuzzysort";

/* eslint-disable-next-line @typescript-eslint/unbound-method */
const { prepare } = fuzzysort;

import { MapQueryEngine } from "helpers";

import { CountryData } from "../wrapper/models/country.js";
import { assertIsSome } from "../util/assert.js";

import { RADIUS_EARTH } from "./geometry.js";

type Prepared = ReturnType<typeof prepare>;

export interface Country {
    name: string;
    id: number;
    coordinates: {
        longitude: number;
        latitude: number;
    };
}

async function loadResource<T>(name: string): Promise<T> {
    const blob = await readFile(`resources/${name}`, { encoding: "utf-8" });
    return JSON.parse(blob) as T;
}

export class Data {
    private static _instance?: Data;

    public static get shared(): Data {
        if (!Data._instance) {
            Data._instance = new Data();
        }
        return Data._instance;
    }

    private _preparedCountries?: Prepared[];

    private countryIdMap?: Map<string, number>;
    private countryMap?: Map<number, Country>;

    private _queryEngine?: MapQueryEngine;

    public get preparedCountries(): Prepared[] {
        assertIsSome(
            this._preparedCountries,
            "Tried to access data before initialisation."
        );
        return this._preparedCountries;
    }

    private get engine(): MapQueryEngine {
        assertIsSome(
            this._queryEngine,
            "Tried to run map query before initialisation"
        );
        return this._queryEngine;
    }

    public idForCountry(name: string): number | undefined {
        assertIsSome(
            this.countryIdMap,
            "Tried to access data before initialisation."
        );
        return this.countryIdMap.get(name);
    }

    public country(id: number): Country | undefined {
        assertIsSome(
            this.countryMap,
            "Tried to access data before initialisation."
        );
        return this.countryMap.get(id);
    }

    public async proximityQuery(
        centre: number,
        radiusKm: number
    ): Promise<{ id: number; distKm: number }[]> {
        const matches = await this.engine.proximityQuery(
            centre,
            radiusKm / RADIUS_EARTH
        );

        return matches.map((m) => ({
            id: m.id,
            distKm: m.dist * RADIUS_EARTH,
        }));
    }

    public async routeQuery(
        start: number,
        end: number,
        elasticity: number
    ): Promise<{ distKm: number; startId: number; endId: number }[]> {
        const route = await this.engine.routeQuery(start, end, elasticity);

        return route.map(({ dist, ...rest }) => ({
            ...rest,
            distKm: dist * RADIUS_EARTH,
        }));
    }

    public async initialise() {
        this._preparedCountries = await loadResource("prepared.json");
        this.countryMap = new Map(await loadResource("countries.json"));
        this.countryIdMap = new Map(await loadResource("ids.json"));

        this._queryEngine = MapQueryEngine.withCountries(
            [...this.countryMap.values()].map((c) => ({
                id: c.id,
                coordinates: c.coordinates,
            }))
        );
    }

    public static async generate(world: CountryData[]) {
        try {
            await access("resources/");
        } catch {
            await mkdir("resources");
        }

        const prepared = world.map((c) => prepare(c.name));
        await writeFile("resources/prepared.json", JSON.stringify(prepared));

        const countries = world.map(({ name, id, coordinates }) => [
            parseInt(id),
            {
                id: parseInt(id),
                name,
                coordinates,
            },
        ]);
        await writeFile("resources/countries.json", JSON.stringify(countries));

        const idMap = world.map(({ name, id }) => [name, parseInt(id)]);
        await writeFile("resources/ids.json", JSON.stringify(idMap));
    }
}
