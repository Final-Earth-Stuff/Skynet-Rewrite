import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData } from "../../decorators";
import { UserSettingsRepository } from "../../repository/UserSettingsRepository";
import { getUser } from "../../wrapper/wrapper";
import { BotError } from "../../error";

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
        await interaction.deferReply();
        const apiKey = interaction.options.getString("apikey", true);
        if (apiKey.length != 10) {
            throw new BotError(
                "API keys must be 10 characters, please check your key and try again."
            );
        }
        const user = await getUser(apiKey);
        UserSettingsRepository.saveSettings(
            interaction.user.id,
            apiKey,
            true,
            user.id
        );
        const success = new MessageEmbed()
            .setDescription(`Successfully saved user data!`)
            .setColor("DARK_GREEN");
        await interaction.editReply({ embeds: [success] });
        return;
    }
}
