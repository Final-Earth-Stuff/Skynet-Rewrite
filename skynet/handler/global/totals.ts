import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import {
    CommandHandler,
    Command,
    CommandData,
} from "../../decorators/index.js";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository.js";

import { buildTotals } from "../../service/mapCommands.js";

@CommandHandler({ name: "totals" })
export class Totals {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("totals")
        .setDescription("Shows units, facilities and income by team")
        .toJSON();

    @Command()
    async totals(interaction: ChatInputCommandInteraction) {
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
