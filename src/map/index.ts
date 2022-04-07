import { config } from "../config";
import { getWorld } from "../wrapper/wrapper";
import { prepare, go } from "fuzzysort";

type Prepared = ReturnType<typeof prepare>;

export interface Country {
    name: string;
    id: number;
    coordinates: {
        longitude: number;
        latitude: number;
    };
}

let countries: Map<number, Country> | undefined = undefined;
let countryNameLut: Map<string, number> | undefined = undefined;

let preparedCountries: Prepared[] | undefined = undefined;

export const getCountries = async () => {
    if (!countries) {
        const world = await getWorld(config.apiKey);

        countries = new Map(
            world.map(({ name, id, coordinates }) => [
                id,
                {
                    name,
                    id,
                    coordinates,
                },
            ])
        );

        countryNameLut = new Map(world.map(({ name, id }) => [name, id]));
    }

    return countries;
};

export interface SearchMatch {
    value: number;
    name: string;
}

export const fuzzySearchCountries = async (
    input: string
): Promise<SearchMatch[]> => {
    if (!preparedCountries) {
        preparedCountries = await getCountries().then((cs) =>
            [...cs.values()].map((c) => prepare(c.name))
        );
    }

    /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
    const results = go(input, preparedCountries!, {
        limit: 10,
        allowTypo: false,
    });

    return results.map((r) => ({
        /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
        value: countryNameLut!.get(r.target)!,
        name: r.target,
    }));
};

export const getCountry = (id: number) => getCountries().then((c) => c.get(id));
