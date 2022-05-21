import { Client } from "discord.js";
import { ScheduledJob } from "../../decorators";

import { UserRankRepository } from "../../repository/UserRankRepository";

import { processUser } from "../../service/nickname";
import { makeLogger } from "../../logger";

const logger = makeLogger(module);

export class MonitorRanks {
    @ScheduledJob({ cron: "*/10 * * * *" })
    async checkRanks(client: Client) {
        logger.info(`checking user ranks...`);
        const users = await UserRankRepository.getCurrentUsers();
        const guilds = await client.guilds.fetch();
        users.forEach((u) => {
            processUser(u, guilds);
        });
    }
}
