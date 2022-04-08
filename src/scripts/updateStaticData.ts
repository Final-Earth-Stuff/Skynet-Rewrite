import { AppDataSource } from "..";
import { config } from "../config";
import { makeLogger } from "../logger";

import { Country, Region } from "../entity/Country";
import { getWorld } from "../wrapper/wrapper";

const logger = makeLogger(module);

export async function updateStaticData() {
    try {
        logger.info("Updating static map data...");
        const world = await getWorld(config.apiKey);
        AppDataSource.getRepository(Country).upsert(
            world.map((country) => ({
                id: parseInt(country.id),
                name: country.name,
                code: country.code,
                latitude: country.coordinates.latitude,
                longitude: country.coordinates.longitude,
                region: country.region.toLowerCase() as Region,
            })),
            ["id"]
        );
        logger.info("Success!");
    } catch (e) {
        logger.error("Encountered error while updating static map data: %O", e);
    }
}
