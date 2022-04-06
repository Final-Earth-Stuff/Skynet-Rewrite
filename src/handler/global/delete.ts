import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getCustomRepository } from "typeorm";

import { Command, CommandData } from "../../decorators";
import { NotificationSettingsRepository } from "../../repository/NotificationSettingsRepository";

export class Delete {
    @CommandData({ type: "global" })
    deleteData() {
        return new SlashCommandBuilder()
            .setName("delete")
            .setDescription(
                "Delete your api key and personal data from the bot"
            )
            .toJSON();
    }

    @Command({ name: "delete" })
    async delete(interaction: CommandInteraction): Promise<void> {
        const settingsRepository = getCustomRepository(
            NotificationSettingsRepository
        );
        settingsRepository.deleteByDiscordId(interaction.user.id);
        await interaction.reply({
            content: "All your data has been deleted.",
            ephemeral: true,
        });
    }
}
