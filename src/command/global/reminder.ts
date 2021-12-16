import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("reminder")
    .setDescription("Schedule a reminder")
    .addIntegerOption((option) =>
        option
            .setName("minutes")
            .setDescription("Number of minutes after which to remind you")
            .setRequired(true)
    )
    .addStringOption((option) =>
        option
            .setName("message")
            .setDescription("Message that should accompany the reminder")
            .setRequired(false)
    );

export const handler = async (interaction: CommandInteraction) => {
    const minutes = interaction.options.getInteger("minutes", true);
    if (minutes < 1) {
        await interaction.reply({
            ephemeral: true,
            content: "minutes needs to be at least 1",
        });
        return;
    }
    await interaction.reply({ content: "Not implemented" });
};
