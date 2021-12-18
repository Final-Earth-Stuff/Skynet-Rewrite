import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { NotificationSettingsRepository } from "../../repository/NotficationSettingsRespository";
import { getCustomRepository } from "typeorm";

export const data = new SlashCommandBuilder()
    .setName("delete")
    .setDescription("Delete your api key and personal data from the bot");

export const handler = async (interaction: CommandInteraction) => {
    const settingsRepository = getCustomRepository(
        NotificationSettingsRepository
    );
    settingsRepository.deleteByDiscordId(interaction.user.id);
    await interaction.reply({
        content: "All your data has been deleted.",
        ephemeral: true,
    });
};
