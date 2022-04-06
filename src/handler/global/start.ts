import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getCustomRepository } from "typeorm";

import { Command, CommandData } from "../../decorators";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";
import { getUser } from "../../wrapper/wrapper";
import { isErrorResponse } from "../../wrapper/utils";
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

    /**
     * @todo Add additional handling for invalid api key
     */
    @Command({ name: "start" })
    async start(interaction: CommandInteraction): Promise<void> {
        const settingsRepository = getCustomRepository(UserSettingsRepository);
        const apiKey = interaction.options.getString("apikey", true);
        if (apiKey.length != 10) {
            await interaction.reply({
                content:
                    "API keys must be 10 characters, please check your key and try again.",
                ephemeral: true,
            });
            return;
        }
        const user = await getUser(apiKey);
        if (!isErrorResponse(user.data)) {
            settingsRepository.saveSettings(
                interaction.user.id,
                apiKey,
                true,
                user.data.id
            );
            await interaction.reply({
                content: "Saved! (Only partially implemented)",
                ephemeral: true,
            });
        } else if (user.data.code === 1) {
            await interaction.reply({
                content: "Invalid API key",
                ephemeral: true,
            });
        } else {
            await interaction.reply({
                content: "Something went wrong",
                ephemeral: true,
            });
        }
    }
}
