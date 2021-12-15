import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("ping")
    .setDescription("replies with pong")
    .toJSON();

export const handler = (interaction: CommandInteraction) =>
    interaction.reply({ content: "pong!" });
