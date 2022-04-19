import {
    Collection,
    GuildMember,
    OAuth2Guild,
    PartialGuildMember,
} from "discord.js";
import { getUser } from "../wrapper/wrapper";
import { config } from "../config";

import { rankMap } from "../service/util/constants";
import { UserRankRepository } from "../repository/UserRankRepository";
import { UserRank } from "../entity/UserRank";
import { UserData } from "../wrapper/models/user";
import { Repository } from "typeorm";
import { makeLogger } from "../logger";

const logger = makeLogger(module);

export async function processUser(
    u: UserRank,
    guilds: Collection<string, OAuth2Guild>
): Promise<void> {
    try {
        const user = await getUser(config.apiKey, u.discord_id);
        if ((guilds && user.name != u.user_name) || user.rank != u.rank) {
            for (const g of u.guild_ids) {
                const guild = await guilds.get(g)?.fetch();
                if (guild) {
                    const member = await guild.members.fetch(u.discord_id);
                    await processMember(member, user, u.id);
                }
            }
        }
    } catch (e) {
        logger.debug(e);
    }
}

/**
 * @todo Add rank role
 */
async function processMember(
    member: GuildMember,
    user: UserData,
    id: string
): Promise<void> {
    if (member.manageable) {
        const rank = rankMap.get(user.rank) ?? "";
        await member.edit({
            nick: `${rank} ${user.name}`,
        });
        UserRankRepository.updateNameAndRank(id, user.rank, user.name);
        logger.debug(
            `Updated user with name ${user.name} and rank #${user.rank}`
        );
    }
}

export async function buildMember(
    member: GuildMember,
    repository: Repository<UserRank>
): Promise<UserRank | undefined> {
    const userRank = await repository.findOne({
        where: { discord_id: member.id },
    });
    const guild = member.guild.id;
    if (userRank === null) {
        const user = new UserRank();
        user.discord_id = member.id;
        user.guild_ids = [guild];
        return user;
    } else if (!userRank.guild_ids.some((id) => id === guild)) {
        userRank.guild_ids.push(guild);
        return userRank;
    }
    return;
}

export async function removeMembers(
    member: GuildMember | PartialGuildMember,
    repository: Repository<UserRank>
): Promise<UserRank | undefined> {
    const userRank = await repository.findOne({
        where: { discord_id: member.id },
    });
    if (userRank) {
        userRank.guild_ids = userRank.guild_ids.filter(
            (g) => g !== member.guild.id
        );
        return userRank;
    }
    return;
}
