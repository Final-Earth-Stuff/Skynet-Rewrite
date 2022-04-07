import { Client } from "discord.js";
import { getCustomRepository } from "typeorm";

import { ScheduledJob } from "../../decorators";
import * as wrapper from "../../wrapper/wrapper";
import { makeLogger } from "../../logger";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { UnitChangeRepository } from "../../repository/UnitChangeRepository";
import { config } from "../../config";
import { CountryData } from "../../wrapper/models/country";

const logger = makeLogger(module);

function getFacRepository(): LandAndFacilitiesRepository {
    return getCustomRepository(LandAndFacilitiesRepository);
}

function getUnitRepository(): UnitChangeRepository {
    return getCustomRepository(UnitChangeRepository);
}


export class MonitorWorld {
    @ScheduledJob({ cron: "*/60 * * * * *" })
    async checkWorld(client: Client) {
        logger.info("checking world...");
        try {
            const facRepository = getFacRepository();
            const world:CountryData[] = await wrapper.getWorld(config.apiKey);
            world.forEach(async (country) => {
                facRepository.createLandAndFacilities(parseInt(country.id),
                    country.land,
                    country.facilities.rigs,
                    country.facilities.factories,
                    country.facilities.mines,
                    country.isSpawn,
                    country.controlTeam,
                    new Date())
            });
        } catch (e) {
            logger.error(e)
        }
    }
}