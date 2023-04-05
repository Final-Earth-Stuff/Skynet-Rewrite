import {
    EventHandler,
    ScheduledJob,
    Cron,
    DiscordEvent,
} from "../../decorators/index.js";
import { Client, GuildMember, PartialGuildMember, Guild } from "discord.js";

import { UserRankRepository } from "../../repository/UserRankRepository.js";
import { AppDataSource } from "../../index.js";

import { processUser } from "../../service/verifyService.js";
import { makeLogger } from "../../logger.js";
import { UserRank } from "../../entity/UserRank.js";
import { removeMembers } from "../../service/nicknameService.js";
import { isSome } from "../../util/guard.js";
import { ApiWrapper } from "../../wrapper/wrapper.js";
import { ApiError } from "../../error.js";

import {
    getGuild,
    sendMessage,
    updateRoleAndNickname,
} from "../../service/verifyService.js";
import { Color } from "../../service/util/constants.js";
import { isRoundOver } from "../../service/util/team.js";

const logger = makeLogger(import.meta);

@EventHandler()
@ScheduledJob()
export class MonitorRanks {
    @Cron({ cron: "*/10 * * * *", label: "monitor_ranks" })
    async checkRanks(client: Client) {
        logger.debug(`checking user ranks...`);
        const world = await ApiWrapper.bot.getWorld();
        const roundOver = isRoundOver(world);
        const users = await UserRankRepository.getCurrentUsers();
        const guilds = await client.guilds.fetch();
        for (const user of users) {
            await processUser(user, guilds, roundOver);
        }
    }

    @DiscordEvent("guildMemberAdd")
    async initUserRank(member: GuildMember) {
        logger.info(`${member.displayName} joined ${member.guild.name}`);
        try {
            const userData = await ApiWrapper.bot.getUser(member.id);
            const guild = await getGuild(member.guild.id);
            const world = await ApiWrapper.bot.getWorld();
            const roundOver = isRoundOver(world);

            await updateRoleAndNickname(userData, guild, member, roundOver);
            await sendMessage(
                member,
                `Successfully verified user ${member.user.tag}!`,
                Color.GREEN
            );
        } catch (e) {
            if (e instanceof ApiError && e.code === 2) {
                await sendMessage(
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
        if (userRank) await repository.save(userRank);
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

        if (users.length > 0) await repository.save(users);
    }
}
