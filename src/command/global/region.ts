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
                ["Europe", "eu"],
                ["North America", "north"],
                ["South America", "south"],
                ["Asia", "asia"],
                ["Australasia", "aust"],
                ["Caribbean", "carib"],
                ["Africa", "africa"],
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
