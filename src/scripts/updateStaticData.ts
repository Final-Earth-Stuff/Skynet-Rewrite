import { AppDataSource } from "..";
import { config } from "../config";
import { makeLogger } from "../logger";

import { Data } from "../map";
import { Country, Region } from "../entity/Country";
import { getWorld } from "../wrapper/wrapper";

const logger = makeLogger(import.meta);

export async function updateStaticData() {
    try {
        logger.info("Writing static map data to database...");
        const world = await getWorld(config.apiKey);
        await AppDataSource.getRepository(Country).upsert(
            world.map((country) => ({
                id: parseInt(country.id),
                name: country.name,
                code: country.code,
                latitude: country.coordinates.latitude,
                longitude: country.coordinates.longitude,
                coastline: country.coastline,
                region: country.region.toLowerCase() as Region,
            })),
            ["id"]
        );
        logger.info("Success!");

        logger.info("Generating derived data structures and freezing them...");
        await Data.generate(world);
        logger.info("Success!");
    } catch (e) {
        logger.error("Encountered error while updating static map data: %O", e);
    }
}
