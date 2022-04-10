import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { getUser } from "../../wrapper/wrapper";
import { config } from "../../config";
import { BotError, ApiError } from "../../error";
import { verifyGuard } from "../../guard/verifyGuard";

import { AppDataSource } from "../..";

import { Guild } from "../../entity/Guild";

export class Verify {
    @CommandData({ type: "guild" })
    verifyData() {
        return new SlashCommandBuilder()
            .setName("verify")
            .setDescription("Attempt to verify all users in the server")
            .toJSON();
    }

    @Command({ name: "verify" })
    @Guard({ body: verifyGuard })
    async totals(interaction: CommandInteraction) {
        if (!interaction.guild)
            throw new BotError("Command needs to be run in a guild");

        const user = await getUser(config.apiKey, interaction.user.id).catch(
            (e) => {
                if (e instanceof ApiError && e.code == 2) {
                    throw new BotError(
                        `Your discord account is not verified with Final Earth.
                    Please visit [here](https://www.finalearth.com/discord) and follow the instructions.`
                    );
                } else {
                    throw e;
                }
            }
        );

        const guildRepository = AppDataSource.getRepository(Guild);
        const guild = await guildRepository.findOneOrFail({
            where: { guild_id: interaction.guildId ?? "" },
        });
        if (!guild.allies_role || !guild.axis_role || !guild.spectator_role)
            throw new BotError("Roles are not configure for this guild");

        let role: string;
        switch (user.team) {
            case "Allies":
                role = guild.allies_role;
                break;
            case "Axis":
                role = guild.axis_role;
                break;
            case "None":
            case "Auto":
                role = guild.spectator_role;
                break;
        }

        const member = await interaction.guild.members.fetch(
            interaction.user.id
        );
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

        const embed = new MessageEmbed()
            .setAuthor({
                name: user.name,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setDescription(
                `Successfully verified user ${interaction.user.tag}!`
            )
            .setColor("DARK_GREEN");

        await interaction.reply({ embeds: [embed] });
    }
}
