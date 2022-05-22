import {
    GuildMember,
    Guild,
    PartialGuildMember,
    MessageEmbed,
} from "discord.js";
import { Guild as GuildEntity } from "../entity/Guild";

import { Team } from "../service/util/constants";
import { setNickname } from "../service/nickname";
import { UserData } from "../wrapper/models/user";
import { ApiError, BotError } from "../error";
import { AppDataSource } from "..";
import { EventHandler } from "../decorators";
import { makeLogger } from "../logger";
import { UserRank } from "../entity/UserRank";
import { removeMembers, buildMember } from "../service/nickname";
import { isSome } from "../util/guard";
import { getUser } from "../wrapper/wrapper";
import { config } from "../config";
import { Color } from "../service/util/constants";

const logger = makeLogger(module);

export class VerifyService {
    @EventHandler({ event: "guildMemberAdd" })
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
                members.map((member) => removeMembers(member, repository))
            )
        ).filter(isSome);

        if (users.length > 0) repository.save(users);
    }
}

export async function updateRoleAndNickname(
    user: UserData,
    guild: GuildEntity,
    member: GuildMember
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

    await member.roles
        .set([
            role,
            ...[...member.roles.cache.keys()].filter(
                (r) =>
                    ![
                        guild.allies_role,
                        guild.axis_role,
                        guild.spectator_role,
                    ].includes(r)
            ),
        ])
        .catch((e) => {
            throw e;
        });

    setNickname(member, user);
}

export async function getGuild(guildId: string): Promise<GuildEntity> {
    const guildRepository = AppDataSource.getRepository(GuildEntity);
    return await guildRepository.findOneOrFail({
        where: { guild_id: guildId },
    });
}

async function sendMessage(member: GuildMember, message: string, color: Color) {
    const guild = await getGuild(member.guild.id);
    if (!guild) {
        throw new BotError("Guild not found, something is very wrong.");
    }
    const embed = new MessageEmbed()
        .setAuthor({
            name: member.displayName,
            iconURL: member.user.displayAvatarURL(),
        })
        .setDescription(message)
        .setColor(color);

    const verifyChannel = await getVerifyChannel(member, guild);

    if (verifyChannel && verifyChannel.isText()) {
        verifyChannel.send({ embeds: [embed] });
    }
}

async function getVerifyChannel(member: GuildMember, guild: GuildEntity) {
    return guild.verify_channel
        ? member.guild.channels.cache.get(guild.verify_channel)
        : undefined;
}
