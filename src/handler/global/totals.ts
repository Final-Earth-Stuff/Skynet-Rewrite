import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";

import { buildTotals } from "../../service/mapCommands";

export class Totals {
    @CommandData({ type: "global" })
    totalsData() {
        return new SlashCommandBuilder()
            .setName("totals")
            .setDescription("Shows units, facilities and income by team")
            .toJSON();
    }

    @Command({ name: "totals" })
    @Guard({ body: commandChannelGuard })
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
