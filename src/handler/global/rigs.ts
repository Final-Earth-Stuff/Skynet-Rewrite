import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData } from "../../decorators";

export class Rigs {
    @CommandData({ type: "global" })
    rigsData() {
        return new SlashCommandBuilder()
            .setName("rigs")
            .setDescription("Shows shows a breakdown of oil rig income by team")
            .toJSON();
    }

    @Command({ name: "rigs" })
    async rigs(interaction: CommandInteraction) {
        await interaction.reply({ content: "Not implemented" });
    }
}
