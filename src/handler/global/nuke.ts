import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData } from "../../decorators";

export class Nuke {
    @CommandData({ type: "global" })
    nukeData() {
        return new SlashCommandBuilder()
            .setName("nuke")
            .setDescription("Shows nuke travel time")
            .addStringOption((option) =>
                option
                    .setName("origin")
                    .setDescription("The country in which the nuke is launched")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("destination")
                    .setDescription("The country the nuke is launched at")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("tech")
                    .setDescription(
                        "The technology used for launching the nuke"
                    )
                    .setRequired(false)
                    .addChoices([
                        ["Nuke I: SRBM", "SRMB"],
                        ["Nuke II: IRMB", "IRBM"],
                        ["Nuke III: ICBM", "ICBM"],
                    ])
            )
            .toJSON();
    }

    @Command({ name: "nuke" })
    async nuke(interaction: CommandInteraction): Promise<void> {
        await interaction.reply({ content: "Not implemented" });
    }
}
