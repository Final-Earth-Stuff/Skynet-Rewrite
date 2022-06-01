import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";
import { getUser } from "../../wrapper/wrapper";
import { ApiError, BotError } from "../../error";
import { dmGuard } from "../../guard/dmGuard";
import { Color } from "../../service/util/constants";

export class Start {
    @CommandData({ type: "global" })
    startData() {
        return new SlashCommandBuilder()
            .setName("start")
            .setDescription(
                "Add api key to bot to start using notification functions"
            )
            .addStringOption((option) =>
                option
                    .setName("apikey")
                    .setDescription("Your api key")
                    .setRequired(true)
            )
            .toJSON();
    }

    @Command({ name: "start" })
    @Guard({ body: dmGuard })
    async start(interaction: CommandInteraction) {
        await interaction.deferReply();
        const apiKey = interaction.options.getString("apikey", true);
        if (apiKey.length != 10) {
            throw new BotError(
                "API keys must be 10 characters, please check your key and try again.",
                {
                    ephemeral: true,
                }
            );
        }
        let user;
        try {
            user = await getUser(apiKey);
        } catch (e) {
            if (e instanceof ApiError && e.code === 1) {
                throw new BotError(
                    "This is not a valid API key, please check your key and try again.",
                    {
                        ephemeral: true,
                    }
                );
            }
            throw new BotError(
                "Something went wrong with calling the API, please check your key and try again.",
                {
                    ephemeral: true,
                }
            );
        }
        UserSettingsRepository.saveSettings(
            interaction.user.id,
            apiKey,
            true,
            user.id
        );
        const success = new MessageEmbed()
            .setDescription(`Successfully saved user data!`)
            .setColor(Color.GREEN);
        await interaction.editReply({ embeds: [success] });
        return;
    }
}
