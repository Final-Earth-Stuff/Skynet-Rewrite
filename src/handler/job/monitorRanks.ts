import {
    EventHandler,
    DiscordEvent,
    ScheduledJob,
    Cron,
} from "../../decorators";
import { getUser } from "../../wrapper/wrapper";
import { config } from "../../config";
import { Client } from "discord.js";

import { UserRankRepository } from "../../repository/UserRankRepository";

import { processUser } from "../../service/nickname";
import { makeLogger } from "../../logger";

const logger = makeLogger(module);

@EventHandler()
@ScheduledJob()
export class MonitorRanks {
    @Cron("*/10 * * * *")
    async checkRanks(client: Client) {
        logger.info(`checking user ranks...`);
        const users = await UserRankRepository.getCurrentUsers();
        const guilds = await client.guilds.fetch();
        users.forEach((u) => {
            processUser(u, guilds);
        });
    }
}
