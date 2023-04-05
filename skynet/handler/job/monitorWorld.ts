import { Client } from "discord.js";

import { ScheduledJob, Cron } from "../../decorators/index.js";
import { ApiWrapper } from "../../wrapper/wrapper.js";
import { makeLogger } from "../../logger.js";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository.js";
import { CountryData } from "../../wrapper/models/country.js";
import { UnitChangeRepository } from "../../repository/UnitChangeRepository.js";

import {
    changedUnitsFromWorld,
    prepareAndSendMessage,
} from "../../service/troopMovements.js";

import {
    convertWorld,
    compareCountry,
    logChangesToChannel,
} from "../../service/facilitiesChanges.js";
import { LandAndFacilities } from "skynet/entity/LandAndFacilities.js";

const logger = makeLogger(import.meta);

@ScheduledJob()
export class MonitorWorld {
    @Cron({ cron: "*/30 * * * * *", label: "monitor_world" })
    async checkWorld(client: Client) {
        logger.debug("checking world...");
        const world: CountryData[] = await ApiWrapper.bot.getWorld();

        const prevFacilties = await LandAndFacilitiesRepository.getLastWorld();
        const changedFacilities = this.checkFacilities(world, prevFacilties);
        if (changedFacilities.length > 0) {
            await logChangesToChannel(
                client,
                changedFacilities,
                prevFacilties,
                world
            );
            await LandAndFacilitiesRepository.updateWorld(changedFacilities);
        }

        const { changes, notifications } = await this.checkTroops(world);
        if (changes.length > 0) {
            await prepareAndSendMessage(client, notifications, world);
            await UnitChangeRepository.updateUnits(changes);
        }
    }

    checkFacilities(world: CountryData[], prevFacilties: LandAndFacilities[]) {
        const currFacilties = convertWorld(world);
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
