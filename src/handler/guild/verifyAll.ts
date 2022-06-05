import { SlashCommandBuilder } from "@discordjs/builders";
import {
    CommandInteraction,
    MessageEmbed,
    GuildMember,
    Permissions,
} from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";
import { getUser } from "../../wrapper/wrapper";
import { UserData } from "../../wrapper/models/user";
import { config } from "../../config";
import { BotError, ApiError } from "../../error";

import { Color } from "../../service/util/constants";
import { updateRoleAndNickname, getGuild } from "../../service/verifyService";

@CommandHandler({ name: "verify-all" })
export class VerifyAll {
    @CommandData({ type: "guild" })
    readonly data = new SlashCommandBuilder()
        .setName("verify-all")
        .setDescription("Attempt to verify all users in the server")
        .setDefaultMemberPermissions(Permissions.FLAGS.MANAGE_ROLES)
        .toJSON();

    @Command()
    async totals(interaction: CommandInteraction) {
        if (!interaction.guild)
            throw new BotError("Command needs to be run in a guild");

        const guild = await getGuild(interaction.guildId ?? "");

        const logChannel = guild.log_channel
            ? interaction.client.channels.cache.get(guild.log_channel)
            : undefined;

        if (!logChannel || !logChannel.isText()) {
            throw new BotError(
                "The log channel is not a text channel or no log channel is configured"
            );
        }

        if (!guild.allies_role || !guild.axis_role || !guild.spectator_role)
            throw new BotError("Roles are not configured for this guild");

        {
            const embed = new MessageEmbed()
                .setDescription("Will now verify all guild members...")
                .setColor(Color.GREEN);

            await interaction.reply({ embeds: [embed] });
        }

        const members = await interaction.guild.members.fetch();
        for (const member of members.values()) {
            let user: UserData;
            try {
                user = await getUser(config.apiKey, member.id);
            } catch (e) {
                if (e instanceof ApiError && e.code == 2) {
                    const embed = buildEmbed(
                        `User ${member.user.tag} is not verified with Final Earth!`,
                        member,
                        Color.NUKE
                    );
                    await logChannel.send({ embeds: [embed] });
                }
                continue;
            }

            try {
                await updateRoleAndNickname(user, guild, member);
            } catch (e) {
                const embed = buildEmbed(
                    `User ${member.user.tag} could not be assigned a role! Check that the bot role is ranked above the role you want to assign.`,
                    member,
                    Color.NUKE
                );
                await logChannel.send({ embeds: [embed] });
                continue;
            }
            const embed = buildEmbed(
                `Successfully verified user ${member.user.tag}!`,
                member,
                Color.GREEN
            );
            logChannel.send({ embeds: [embed] });
        }

        {
            const embed = new MessageEmbed()
                .setDescription("Finished!")
                .setColor(Color.GREEN);

            await interaction.followUp({ embeds: [embed] });
        }
    }
}

function buildEmbed(message: string, member: GuildMember, color: Color) {
    return new MessageEmbed()
        .setAuthor({
            name: member.user.username,
            iconURL: member.user.displayAvatarURL(),
        })
        .setDescription(message)
        .setColor(color);
}
