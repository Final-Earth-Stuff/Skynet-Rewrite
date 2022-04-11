import { Client } from "discord.js";

import { ScheduledJob } from "../../decorators";
import * as wrapper from "../../wrapper/wrapper";
import { makeLogger } from "../../logger";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { config } from "../../config";
import { CountryData } from "../../wrapper/models/country";
import { UnitChangeRepository } from "../../repository/UnitChangeRepository";

import {
    changedUnitsFromWorld,
    prepareAndSendMessage,
} from "../../service/troopMovements";

import { convertWorld, compareCountry } from "../../service/facilitiesChanges";

const logger = makeLogger(module);

export class MonitorWorld {
    @ScheduledJob({ cron: "*/30 * * * * *" })
    async checkWorld(client: Client) {
        logger.info("checking world...");
        try {
            const world: CountryData[] = await wrapper.getWorld(config.apiKey);

            const changedFacilities = await this.checkFacilities(world);
            if (changedFacilities.length > 0) {
                LandAndFacilitiesRepository.updateWorld(changedFacilities);
            }

            const { changes, notifications } = await this.checkTroops(world);
            if (changes.length > 0) {
                prepareAndSendMessage(client, notifications, world);
                UnitChangeRepository.updateUnits(changes);
            }
        } catch (e) {
            logger.error(e);
        }
    }

    async checkFacilities(world: CountryData[]) {
        const currFacilties = convertWorld(world);
        const prevFacilties = await LandAndFacilitiesRepository.getLastWorld();
        return currFacilties.filter(
            (item1) =>
                !prevFacilties.some((item2) => compareCountry(item1, item2))
        );
    }

    async checkTroops(world: CountryData[]) {
        const prevUnits = await UnitChangeRepository.getLastWorld();
        return changedUnitsFromWorld(world, prevUnits);
    }
}
