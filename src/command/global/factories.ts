import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("factories")
    .setDescription("Shows shows a breakdown of factory income by team");

export const handler = async (interaction: CommandInteraction) => {
    await interaction.reply({ content: "Not implemented" });
};
