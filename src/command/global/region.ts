import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("region")
    .setDescription(
        "Determines the distance and travel time between two countries"
    )
    .addStringOption((option) =>
        option
            .setName("region")
            .setDescription("Region which should be summarized")
            .setRequired(true)
            .addChoices([
                ["Europe", "Europe"],
                ["Middle East", "Middle East"],
                ["Asia", "Asia"],
                ["North America", "North America"],
                ["South America", "South America"],
                ["Australasia", "Australasia"],
                ["Caribbean", "Carribean"],
                ["Africa", "Africa"],
            ])
    )
    .addStringOption((option) =>
        option
            .setName("team")
            .setDescription("Only show one team")
            .setRequired(false)
            .addChoices([
                ["axis", "Axis"],
                ["allies", "Allies"],
            ])
    );

export const handler = async (interaction: CommandInteraction) => {
    await interaction.reply({ content: "Not implemented" });
};
