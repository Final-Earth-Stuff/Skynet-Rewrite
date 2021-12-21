import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData } from "../../decorators";

export class Prox {
    @CommandData({ type: "global" })
    proxData() {
        return new SlashCommandBuilder()
            .setName("prox")
            .setDescription(
                "Shows all units within the provided distance of a country"
            )
            .addStringOption((option) =>
                option
                    .setName("center")
                    .setDescription(
                        "The country on which the search is centered"
                    )
                    .setRequired(true)
            )
            .addIntegerOption((option) =>
                option
                    .setName("radius")
                    .setDescription("Radius of the search")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("team")
                    .setDescription("Only show results for one team")
                    .setRequired(false)
            )
            .addIntegerOption((option) =>
                option
                    .setName("points")
                    .setDescription(
                        "Number of points spent on the travel time reduction skill"
                    )
                    .setRequired(false)
            )
            .addBooleanOption((option) =>
                option
                    .setName("paratroopers")
                    .setDescription(
                        "Whether or not the team has researched the Paratrooper Training technology"
                    )
                    .setRequired(false)
            )
            .toJSON();
    }

    @Command({ name: "prox" })
    async prox(interaction: CommandInteraction): Promise<void> {
        const travelPoints = interaction.options.getInteger("points") ?? 0;
        if (travelPoints < 0 || travelPoints > 25) {
            await interaction.reply({
                ephemeral: true,
                content: "Travel points need to be between 0 and 25.",
            });
            return;
        }

        await interaction.reply({ content: "Not implemented" });
    }
}
