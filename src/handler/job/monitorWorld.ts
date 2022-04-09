import { Client } from "discord.js";

import { ScheduledJob } from "../../decorators";
import * as wrapper from "../../wrapper/wrapper";
import { makeLogger } from "../../logger";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { config } from "../../config";
import { CountryData } from "../../wrapper/models/country";
import { LandAndFacilities } from "../../entity/LandAndFacilities";

const logger = makeLogger(module);

export class MonitorWorld {
    @ScheduledJob({ cron: "*/25 * * * * *" })
    async checkWorld(_client: Client) {
        logger.info("checking world...");
        try {
            const world: CountryData[] = await wrapper.getWorld(config.apiKey);
            const currWorld: LandAndFacilities[] = this.convertWorld(world);
            const prevWorld = await LandAndFacilitiesRepository.getLastWorld();

            const changedWorld = currWorld.filter(
                (item1) =>
                    !prevWorld.some((item2) =>
                        this.compareCountry(item1, item2)
                    )
            );

            if (changedWorld.length > 0) {
                LandAndFacilitiesRepository.updateWorld(changedWorld);
            }
        } catch (e) {
            logger.error(e);
        }
    }

    convertWorld(world: CountryData[]) {
        return world.map((country) => {
            return {
                country: parseInt(country.id),
                land: country.land,
                rigs: country.facilities.rigs,
                facs: country.facilities.factories,
                mines: country.facilities.mines,
                is_spawn: country.isActiveSpawn,
                team_control: country.control,
                timestamp: new Date(),
            };
        });
    }

    compareCountry(c1: LandAndFacilities, c2: LandAndFacilities) {
        return (
            c1.country === c2.country &&
            c1.land === c2.land &&
            c1.rigs === c2.rigs &&
            c1.facs === c2.facs &&
            c1.mines === c2.mines &&
            c1.is_spawn === c2.is_spawn &&
            c1.team_control === c2.team_control
        );
    }
}
