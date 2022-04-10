import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

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
    @Guard({ body: commandChannelGuard })
    async delete(interaction: CommandInteraction): Promise<void> {
        await interaction.deferReply();
        UserSettingsRepository.deleteByDiscordId(interaction.user.id);
        const success = new MessageEmbed()
            .setDescription(`All your data has been deleted.`)
            .setColor("DARK_GREEN");
        await interaction.editReply({ embeds: [success] });
    }
}
