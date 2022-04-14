import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData } from "../../decorators";
import { getUser } from "../../wrapper/wrapper";
import { UserData } from "../../wrapper/models/user";
import { config } from "../../config";
import { BotError, ApiError } from "../../error";

import { AppDataSource } from "../..";

import { Guild } from "../../entity/Guild";
import { Team, Color } from "../../service/util/constants";

export class Verify {
    @CommandData({ type: "guild" })
    verifyAllData() {
        return new SlashCommandBuilder()
            .setName("verify-all")
            .setDescription("Verify user")
            .setDefaultPermission(false)
            .toJSON();
    }

    @Command({ name: "verify-all", admin: true })
    async totals(interaction: CommandInteraction) {
        if (!interaction.guild)
            throw new BotError("Command needs to be run in a guild");

        const guildRepository = AppDataSource.getRepository(Guild);
        const guild = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });

        const logChannel = guild.log_channel
            ? interaction.client.channels.cache.get(guild.log_channel)
            : undefined;

        if (logChannel && !logChannel.isText()) {
            throw new BotError(
                "The configured log channel is not a text channel"
            );
        }

        if (!guild.allies_role || !guild.axis_role || !guild.spectator_role)
            throw new BotError("Roles are not configure for this guild");

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
                if (e instanceof ApiError && e.code == 2 && logChannel) {
                    const embed = new MessageEmbed()
                        .setAuthor({
                            name: member.user.username,
                            iconURL: member.user.displayAvatarURL(),
                        })
                        .setDescription(
                            `User ${member.user.tag} is not verified with Final Earth!`
                        )
                        .setColor(Color.NUKE);
                    await logChannel.send({ embeds: [embed] });
                }
                continue;
            }

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

            await member.roles.set([
                role,
                ...[...member.roles.cache.keys()].filter(
                    (r) =>
                        ![
                            guild.allies_role,
                            guild.axis_role,
                            guild.spectator_role,
                        ].includes(r)
                ),
            ]);
            if (member.manageable) {
                await member.edit({
                    nick: user.name,
                });
            }

            if (logChannel) {
                const embed = new MessageEmbed()
                    .setAuthor({
                        name: user.name,
                        iconURL: member.displayAvatarURL(),
                    })
                    .setDescription(
                        `Successfully verified user ${member.user.tag}!`
                    )
                    .setColor(Color.GREEN);
                logChannel.send({ embeds: [embed] });
            }
        }

        {
            const embed = new MessageEmbed()
                .setDescription("Finished!")
                .setColor(Color.GREEN);

            await interaction.followUp({ embeds: [embed] });
        }
    }
}
