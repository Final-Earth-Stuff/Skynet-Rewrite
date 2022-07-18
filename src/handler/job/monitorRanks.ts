import {
    EventHandler,
    ScheduledJob,
    Cron,
    DiscordEvent,
} from "../../decorators";
import { Client, GuildMember, PartialGuildMember, Guild } from "discord.js";

import { UserRankRepository } from "../../repository/UserRankRepository";
import { AppDataSource } from "../..";

import { processUser } from "../../service/verifyService";
import { makeLogger } from "../../logger";
import { UserRank } from "../../entity/UserRank";
import { removeMembers } from "../../service/nicknameService";
import { isSome } from "../../util/guard";
import { getUser } from "../../wrapper/wrapper";
import { config } from "../../config";
import { ApiError } from "../../error";

import {
    getGuild,
    sendMessage,
    updateRoleAndNickname,
} from "../../service/verifyService";
import { Color } from "../../service/util/constants";

const logger = makeLogger(import.meta);

@EventHandler()
@ScheduledJob()
export class MonitorRanks {
    @Cron("*/10 * * * *")
    async checkRanks(client: Client) {
        logger.debug(`checking user ranks...`);
        const users = await UserRankRepository.getCurrentUsers();
        const guilds = await client.guilds.fetch();
        users.forEach((u) => {
            processUser(u, guilds);
        });
    }

    @DiscordEvent("guildMemberAdd")
    async initUserRank(member: GuildMember) {
        logger.info(`${member.displayName} joined ${member.guild.name}`);
        try {
            const userData = await getUser(config.apiKey, member.id);
            const guild = await getGuild(member.guild.id);
            updateRoleAndNickname(userData, guild, member);
            sendMessage(
                member,
                `Successfully verified user ${member.user.tag}!`,
                Color.GREEN
            );
        } catch (e) {
            if (e instanceof ApiError && e.code === 2) {
                sendMessage(
                    member,
                    `Your discord account is not verified with Final Earth.
                Please visit [here](https://www.finalearth.com/discord) and follow the instructions.`,
                    Color.RED
                );
            } else {
                logger.error(e);
            }
        }
    }

    @DiscordEvent("guildMemberRemove")
    async memberLeft(member: GuildMember | PartialGuildMember) {
        logger.info(`${member.displayName} left ${member.guild.name}`);
        const repository = AppDataSource.getRepository(UserRank);
        const userRank = await removeMembers(member, repository);
        if (userRank) repository.save(userRank);
    }

    @DiscordEvent("guildDelete")
    async guildDelete(guild: Guild) {
        logger.info(`Bot kicked from guild: ${guild.name}`);
        const repository = AppDataSource.getRepository(UserRank);
        const members = await guild.members.fetch();
        const users = (
            await Promise.all(
                members.map((member) => removeMembers(member, repository))
            )
        ).filter(isSome);

        if (users.length > 0) repository.save(users);
    }
}
