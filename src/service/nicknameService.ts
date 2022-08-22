import { GuildMember, PartialGuildMember } from "discord.js";

import { rankMap } from "./util/constants";
import { UserRankRepository } from "../repository/UserRankRepository";
import { UserRank } from "../entity/UserRank";
import { UserData } from "../wrapper/models/user";
import { Repository } from "typeorm";
import { AppDataSource } from "..";

export async function getNicknameIfChanged(
    member: GuildMember,
    userData: UserData,
    isRoundOver: boolean
): Promise<string | undefined> {
    if (!member.manageable) return;

    const repository = AppDataSource.getRepository(UserRank);
    const userRank = await UserRankRepository.findByDiscordId(member.id);
    const guild = member.guild.id;

    if (!userRank) {
        const rank = buildUserRank(member);
        await repository.save(rank);
        return buildRankNickname(userData, isRoundOver);
    } else if (!userRank.guild_ids.some((id) => id === guild)) {
        userRank.guild_ids.push(guild);
        await repository.save(userRank);
        return buildRankNickname(userData, isRoundOver);
    } else {
        return checkForChange(userRank, userData, member, isRoundOver);
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
    member: GuildMember,
    isRoundOver: boolean
): string | undefined {
    const newNick = buildRankNickname(user, isRoundOver);
    if (
        user.name != userRank.user_name ||
        user.rank != userRank.rank ||
        newNick != member.nickname
    ) {
        return newNick;
    }
}

function buildRankNickname(user: UserData, isRoundOver: boolean): string {
    if (isRoundOver) {
        return user.name;
    } else {
        const rank = rankMap.get(user.rank);
        return rank ? `${rank} ${user.name}` : user.name;
    }
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
