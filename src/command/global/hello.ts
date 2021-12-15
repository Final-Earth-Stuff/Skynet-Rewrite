import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("hello")
    .setDescription("replies with hello world")
    .toJSON();

export const handler = (interaction: CommandInteraction) =>
    interaction.reply({ content: "Hello World!" });
