import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData } from "../../decorators";

export class Mines {
    @CommandData({ type: "global" })
    minesData() {
        return new SlashCommandBuilder()
            .setName("mines")
            .setDescription("Shows shows a breakdown of mine income by team")
            .toJSON();
    }

    @Command({ name: "mines" })
    async mines(interaction: CommandInteraction): Promise<void> {
        await interaction.reply({ content: "Not implemented" });
    }
}
