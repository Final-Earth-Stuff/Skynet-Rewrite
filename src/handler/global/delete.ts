import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { getCustomRepository } from "typeorm";

import { Command, CommandData } from "../../decorators";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";

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
        await interaction.deferReply();
        const settingsRepository = getCustomRepository(UserSettingsRepository);
        settingsRepository.deleteByDiscordId(interaction.user.id);
        const success = new MessageEmbed()
            .setDescription(`All your data has been deleted.`)
            .setColor("DARK_GREEN");
        await interaction.editReply({ embeds: [success] });
    }
}
