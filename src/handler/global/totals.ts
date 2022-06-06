import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";

import { buildTotals } from "../../service/mapCommands";

@CommandHandler({ name: "totals" })
export class Totals {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("totals")
        .setDescription("Shows units, facilities and income by team")
        .toJSON();

    @Command()
    async totals(interaction: CommandInteraction) {
        const totals = await LandAndFacilitiesRepository.totals();

        await interaction.reply({
            embeds: [
                buildTotals(
                    totals,
                    "World overview",
                    "Displaying Allies vs. Axis for the world:"
                ),
            ],
        });
    }
}
