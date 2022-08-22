import {
    Collection,
    GuildMember,
    EmbedBuilder,
    OAuth2Guild,
    ChannelType,
} from "discord.js";
import { Guild as GuildEntity } from "../entity/Guild";

import { Team } from "../service/util/constants";
import { setNickname } from "./nicknameService";
import { UserData } from "../wrapper/models/user";
import { BotError } from "../error";
import { AppDataSource } from "..";
import { makeLogger } from "../logger";
import { Color } from "../service/util/constants";
import { UserRank } from "../entity/UserRank";
import { getUser } from "../wrapper/wrapper";
import { config } from "../config";

const logger = makeLogger(import.meta);

export async function updateRoleAndNickname(
    user: UserData,
    guild: GuildEntity,
    member: GuildMember,
    isRoundOver: boolean
): Promise<void> {
    if (!guild.allies_role || !guild.axis_role || !guild.spectator_role)
        throw new BotError("Roles are not configured for this guild");

    let role: string;
    switch (user.team) {
        case Team.ALLIES:
            role = guild.allies_role;
            break;
        case Team.AXIS:
            role = guild.axis_role;
            break;
        case Team.NONE:
        case Team.AUTO:
            role = guild.spectator_role;
            break;
    }

    if (isRoundOver) {
        role = guild.spectator_role;
    }

    await member.roles.set([
        role,
        ...(guild.verified_role ? [guild.verified_role] : []),
        ...[...member.roles.cache.keys()].filter(
            (r) =>
                ![
                    guild.allies_role,
                    guild.axis_role,
                    guild.spectator_role,
                    guild.verified_role,
                ].includes(r)
        ),
    ]);

    await setNickname(member, user, isRoundOver);
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
                    await updateRoleAndNickname(user, guildEntity, member, isRoundOver);
                } catch (e) {
                    logger.debug(e);
                }
            }
        }
    } catch (e) {
        logger.debug(e);
    }
}
