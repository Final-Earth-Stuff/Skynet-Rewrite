import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("mines")
    .setDescription("Shows shows a breakdown of mine income by team");

export const handler = async (interaction: CommandInteraction) => {
    await interaction.reply({ content: "Not implemented" });
};
