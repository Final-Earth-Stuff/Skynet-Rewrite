import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData } from "../../decorators";

export class Factories {
    @CommandData({ type: "global" })
    factoriesData() {
        return new SlashCommandBuilder()
            .setName("factories")
            .setDescription("Shows shows a breakdown of factory income by team")
            .toJSON();
    }

    @Command({ name: "factories" })
    async factories(interaction: CommandInteraction): Promise<void> {
        await interaction.reply({ content: "Not implemented" });
    }
}
