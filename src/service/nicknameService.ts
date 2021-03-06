import { GuildMember, PartialGuildMember } from "discord.js";

import { rankMap } from "./util/constants";
import { UserRankRepository } from "../repository/UserRankRepository";
import { UserRank } from "../entity/UserRank";
import { UserData } from "../wrapper/models/user";
import { Repository } from "typeorm";
import { makeLogger } from "../logger";
import { AppDataSource } from "..";

const logger = makeLogger(import.meta);

export async function setNickname(
    member: GuildMember,
    userData: UserData
): Promise<void> {
    const repository = AppDataSource.getRepository(UserRank);
    const userRank = await UserRankRepository.findByDiscordId(member.id);
    const guild = member.guild.id;

    if (!userRank) {
        const rank = buildUserRank(member);
        const newRank = await repository.save(rank);
        processMember(member, userData, newRank.id);
    } else if (!userRank.guild_ids.some((id) => id === guild)) {
        userRank.guild_ids.push(guild);
        repository.save(userRank);
        processMember(member, userData, userRank.id);
    } else {
        checkForChange(userRank, userData, member);
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
        await member.edit({
            nick: buildRankNickname(user),
        });
        UserRankRepository.updateNameAndRank(id, user.rank, user.name);
        logger.debug(
            `Updated user with name ${user.name} and rank #${user.rank}`
        );
    }
}

export function buildUserRank(member: GuildMember): UserRank {
    const user = new UserRank();
    user.discord_id = member.id;
    user.guild_ids = [member.guild.id];
    return user;
}

function checkForChange(
    userRank: UserRank,
    user: UserData,
    member: GuildMember
) {
    if (
        user.name != userRank.user_name ||
        user.rank != userRank.rank ||
        buildRankNickname(user) != member.nickname
    ) {
        processMember(member, user, userRank.id);
    }
}

function buildRankNickname(user: UserData) {
    const rank = rankMap.get(user.rank) ?? "";
    return `${rank} ${user.name}`;
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
