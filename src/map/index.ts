import { readFile, access, mkdir, writeFile } from "fs/promises";

import fuzzysort from "fuzzysort";
const { prepare } = fuzzysort;

import { CountryData } from "../wrapper/models/country";
import { assertIsSome } from "../util/assert";

import { TreeNode, buildTree } from "./kdtree";

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
    return JSON.parse(blob);
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
    private _kdtree?: TreeNode;

    private countryIdMap?: Map<string, number>;
    private countryMap?: Map<number, Country>;

    public get preparedCountries(): Prepared[] {
        assertIsSome(
            this._preparedCountries,
            "Tried to access data before initialisation."
        );
        return this._preparedCountries;
    }

    public get kdtree(): TreeNode {
        assertIsSome(
            this._kdtree,
            "Tried to access data before initialisation."
        );
        return this._kdtree;
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

    public async initialise() {
        this._preparedCountries = await loadResource("prepared.json");
        this._kdtree = await loadResource("kdtree.json");
        this.countryMap = new Map(await loadResource("countries.json"));
        this.countryIdMap = new Map(await loadResource("ids.json"));
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
                id,
                name,
                coordinates,
            },
        ]);
        await writeFile("resources/countries.json", JSON.stringify(countries));

        const idMap = world.map(({ name, id }) => [name, parseInt(id)]);
        await writeFile("resources/ids.json", JSON.stringify(idMap));

        const tree = buildTree(
            world.map(({ name, id, coordinates }) => ({
                id: parseInt(id),
                name,
                coordinates,
            }))
        );
        await writeFile("resources/kdtree.json", JSON.stringify(tree));
    }
}
