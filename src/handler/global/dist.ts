import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData } from "../../decorators";
import { BotError } from "../../error";

export class Dist {
    @CommandData({ type: "global" })
    distData() {
        return new SlashCommandBuilder()
            .setName("dist")
            .setDescription(
                "Determines the distance and travel time between two countries"
            )
            .addStringOption((option) =>
                option
                    .setName("origin")
                    .setDescription("Starting country")
                    .setRequired(true)
            )
            .addStringOption((option) =>
                option
                    .setName("destination")
                    .setDescription("Destination")
                    .setRequired(true)
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

    @Command({ name: "dist" })
    async dist(interaction: CommandInteraction): Promise<void> {
        const travelPoints = interaction.options.getInteger("points") ?? 0;
        if (travelPoints < 0 || travelPoints > 25) {
            throw new BotError("Travel points need to be between 0 and 25");
        }

        throw new BotError("Not implemented");
    }
}
