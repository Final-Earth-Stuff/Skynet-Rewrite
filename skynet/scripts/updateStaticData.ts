import { AppDataSource } from "../index.js";
import { makeLogger } from "../logger.js";

import { Data } from "../map/index.js";
import { Country, Region } from "../entity/Country.js";
import { ApiWrapper } from "../wrapper/wrapper.js";

const logger = makeLogger(import.meta);

export async function updateStaticData() {
    try {
        logger.info("Writing static map data to database...");
        const world = await ApiWrapper.bot.getWorld();
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
