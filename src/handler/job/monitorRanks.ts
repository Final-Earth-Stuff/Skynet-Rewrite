import { Client, Guild, GuildMember, PartialGuildMember } from "discord.js";
import { EventHandler, ScheduledJob } from "../../decorators";
import { getUser } from "../../wrapper/wrapper";
import { config } from "../../config";

import { rankMap } from "../../service/util/constants";
import { UserRankRepository } from "../../repository/UserRankRepository";
import { AppDataSource } from "../..";
import { UserRank } from "../../entity/UserRank";
import {
    processUser,
    removeMembers,
    buildMember,
} from "../../service/nickname";
import { makeLogger } from "../../logger";
import { isSome } from "../../util/guard";

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

    @EventHandler({ event: "guildCreate" })
    async initUserRanks(guild: Guild) {
        logger.info(`Bot added to guild: ${guild.name}`);
        const repository = AppDataSource.getRepository(UserRank);
        const members = await guild.members.fetch();
        const users = (
            await Promise.all(
                members.map((member) => buildMember(member, repository))
            )
        ).filter(isSome);
        if (users.length > 0) repository.save(users);
    }

    @EventHandler({ event: "guildMemberAdd" })
    async initUserRank(member: GuildMember) {
        logger.info(`${member.displayName} joined ${member.guild.name}`);
        const repository = AppDataSource.getRepository(UserRank);
        const user = await buildMember(member, repository);
        if (user) {
            repository.save(user);
            const userData = await getUser(config.apiKey, member.id);
            if (member.manageable) {
                const rank = rankMap.get(userData.rank) ?? "";
                await member.edit({
                    nick: `${rank} ${userData.name}`,
                });
            }
        }
    }

    @EventHandler({ event: "guildMemberRemove" })
    async memberLeft(member: GuildMember | PartialGuildMember) {
        logger.info(`${member.displayName} left ${member.guild.name}`);
        const repository = AppDataSource.getRepository(UserRank);
        const userRank = await removeMembers(member, repository);
        if (userRank) repository.save(userRank);
    }

    @EventHandler({ event: "guildDelete" })
    async guildDelete(guild: Guild) {
        logger.info(`Bot kicked from guild: ${guild.name}`);
        const repository = AppDataSource.getRepository(UserRank);
        const members = await guild.members.fetch();
        const users = (
            await Promise.all(
                members.map((member) => buildMember(member, repository))
            )
        ).filter(isSome);

        if (users.length > 0) repository.save(users);
    }
}
