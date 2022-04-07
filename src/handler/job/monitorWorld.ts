import { Client } from "discord.js";

import { ScheduledJob } from "../../decorators";
import * as wrapper from "../../wrapper/wrapper";
import { makeLogger } from "../../logger";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { config } from "../../config";
import { CountryData } from "../../wrapper/models/country";

const logger = makeLogger(module);

export class MonitorWorld {
    @ScheduledJob({ cron: "*/60 * * * * *" })
    async checkWorld(_client: Client) {
        logger.info("checking world...");
        try {
            const world: CountryData[] = await wrapper.getWorld(config.apiKey);
            world.forEach(async (country) => {
                LandAndFacilitiesRepository.createLandAndFacilities(
                    parseInt(country.id),
                    country.land,
                    country.facilities.rigs,
                    country.facilities.factories,
                    country.facilities.mines,
                    country.isSpawn,
                    country.controlTeam,
                    new Date()
                );
            });
        } catch (e) {
            logger.error(e);
        }
    }
}
