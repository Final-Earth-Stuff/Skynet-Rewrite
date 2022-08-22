import {
    Collection,
    GuildMember,
    EmbedBuilder,
    OAuth2Guild,
    ChannelType,
} from "discord.js";
import { Guild as GuildEntity } from "../entity/Guild";

import { Team } from "../service/util/constants";
import { getNicknameIfChanged } from "./nicknameService";
import { UserData } from "../wrapper/models/user";
import { BotError } from "../error";
import { AppDataSource } from "..";
import { makeLogger } from "../logger";
import { Color } from "../service/util/constants";
import { UserRank } from "../entity/UserRank";
import { getUser } from "../wrapper/wrapper";
import { config } from "../config";
import { UserRankRepository } from "../repository/UserRankRepository";

const logger = makeLogger(import.meta);

export async function updateRoleAndNickname(
    user: UserData,
    guild: GuildEntity,
    member: GuildMember,
    isRoundOver: boolean
): Promise<void> {
    if (!guild.allies_role || !guild.axis_role || !guild.spectator_role)
        throw new BotError("Roles are not configured for this guild");

    const map = {
        [Team.ALLIES]: guild.allies_role,
        [Team.AXIS]: guild.axis_role,
        [Team.AUTO]: guild.spectator_role,
        [Team.NONE]: guild.spectator_role,
    };

    const roles = getRolesIfChanged(user, member, map, guild.verified_role);
    const nick = await getNicknameIfChanged(member, user, isRoundOver);

    if (roles || nick) {
        console.log(roles, nick);
        await member.edit({ roles, nick });
    }

    if (nick) {
        // TODO: this should probably be merged with the role update for rank roles?
        try {
            await UserRankRepository.updateNameAndRank(
                member.id,
                user.rank,
                user.name
            );
        } catch (e) {
            console.error(e);
        }
    }
}

export function getRolesIfChanged(
    user: UserData,
    member: GuildMember,
    roleMap: Record<Team, string>,
    verified?: string
): string[] | undefined {
    const has = [roleMap[user.team]];
    if (verified) {
        has.push(verified);
    }

    const hasNot: string[] = [];
    switch (user.team) {
        case Team.ALLIES:
            hasNot.push(
                roleMap[Team.AXIS],
                roleMap[Team.AUTO],
                roleMap[Team.NONE]
            );
            break;
        case Team.AXIS:
            hasNot.push(
                roleMap[Team.ALLIES],
                roleMap[Team.AUTO],
                roleMap[Team.NONE]
            );
            break;
        case Team.NONE:
        case Team.AUTO:
            hasNot.push(roleMap[Team.AXIS], roleMap[Team.ALLIES]);
            break;
    }

    if (
        member.roles.cache.hasAny(...hasNot) ||
        !member.roles.cache.hasAll(...has)
    ) {
        const combined = new Set([...has, ...hasNot]);
        const otherRoles = member.roles.cache
            .filter((_v, k) => !combined.has(k))
            .keys();

        return [...new Set([...has, ...otherRoles])];
    }
}

export async function getGuild(guildId: string): Promise<GuildEntity> {
    const guildRepository = AppDataSource.getRepository(GuildEntity);
    return await guildRepository.findOneOrFail({
        where: { guild_id: guildId },
    });
}

export async function sendMessage(
    member: GuildMember,
    message: string,
    color: Color
) {
    const guild = await getGuild(member.guild.id);
    const embed = new EmbedBuilder()
        .setAuthor({
            name: member.displayName,
            iconURL: member.user.displayAvatarURL(),
        })
        .setDescription(message)
        .setColor(color);

    const verifyChannel = getVerifyChannel(member, guild);

    if (verifyChannel && verifyChannel.type === ChannelType.GuildText) {
        await verifyChannel.send({ embeds: [embed] });
    }
}

function getVerifyChannel(member: GuildMember, guild: GuildEntity) {
    return guild.verify_channel
        ? member.guild.channels.cache.get(guild.verify_channel)
        : undefined;
}

export async function processUser(
    u: UserRank,
    guilds: Collection<string, OAuth2Guild>,
    isRoundOver: boolean
): Promise<void> {
    try {
        const user = await getUser(config.apiKey, u.discord_id);
        for (const g of u.guild_ids) {
            const guild = await guilds.get(g)?.fetch();
            if (guild) {
                const guildEntity = await getGuild(guild.id);
                const member = await guild.members.fetch(u.discord_id);
                try {
                    await updateRoleAndNickname(
                        user,
                        guildEntity,
                        member,
                        isRoundOver
                    );
                } catch (e) {
                    logger.debug(e);
                }
            }
        }
    } catch (e) {
        logger.debug(e);
    }
}
