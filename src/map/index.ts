import { config } from "../config";
import { getWorld } from "../wrapper/wrapper";

export interface Country {
    name: string;
    id: number;
    coordinates: {
        longitude: number;
        latitude: number;
    };
}

let countries: Map<number, Country> | undefined = undefined;

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
    }

    return countries;
};

export const getCountry = (id: number) => getCountries().then((c) => c.get(id));
