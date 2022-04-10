import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

export class Region {
    @CommandData({ type: "global" })
    regionData() {
        return new SlashCommandBuilder()
            .setName("region")
            .setDescription(
                "Shows units, facilities and income by team for the provided region"
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
            )
            .toJSON();
    }

    @Command({ name: "region" })
    @Guard({ body: commandChannelGuard })
    async region(interaction: CommandInteraction): Promise<void> {
        await interaction.reply({ content: "Not implemented" });
    }
}
