import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { NotificationSettingsRepository } from "../../repository/NotficationSettingsRespository";
import { getCustomRepository } from "typeorm";

export const data = new SlashCommandBuilder()
    .setName("start")
    .setDescription("Add api key to bot to start using notification functions")
    .addStringOption((option) =>
        option
            .setName("apikey")
            .setDescription("Your api key")
            .setRequired(true)
    );

/**
 * @todo Add additional handling for invalid api key
 */
export const handler = async (interaction: CommandInteraction) => {
    const settingsRepository = getCustomRepository(
        NotificationSettingsRepository
    );
    const apiKey = interaction.options.getString("apikey", true);
    if (apiKey) {
        if (apiKey.length != 10) {
            await interaction.reply({
                content:
                    "API keys must be 10 characters, please check your key and try again.",
                ephemeral: true,
            });
            return;
        }
        settingsRepository.saveSettings(interaction.user.id, apiKey, true);
    }
    await interaction.reply({
        content: "Saved! (Only partially implemented)",
        ephemeral: true,
    });
};
