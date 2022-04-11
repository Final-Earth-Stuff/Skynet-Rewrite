import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";

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

        const alliesIncome =
            Math.round(
                (totals.total_allies_rigs * 0.1 +
                    totals.total_allies_facs * 0.0015 +
                    totals.total_allies_mines * 0.0005) *
                    10
            ) / 10;

        const axisIncome =
            Math.round(
                (totals.total_axis_rigs * 0.1 +
                    totals.total_axis_facs * 0.0015 +
                    totals.total_axis_mines * 0.0005) *
                    10
            ) / 10;

        const embed = new MessageEmbed()
            .setTitle("World overview")
            .setDescription("Displaying Allies vs. Axis for the world:")
            .addField(
                "Capped/Uncapped",
                `${totals.allies_capped}/${totals.allies_uncapped} vs. ${totals.axis_capped}/${totals.axis_uncapped}`,
                true
            )
            .addField(
                "Units",
                `${totals.total_allies} vs. ${totals.total_axis}`,
                true
            )
            .addField(
                "Factories",
                `${totals.total_allies_facs} vs. ${totals.total_axis_facs}`,
                true
            )
            .addField(
                "Oil rigs",
                `${totals.total_allies_rigs} vs. ${totals.total_axis_rigs}`,
                true
            )
            .addField(
                "Mines",
                `${totals.total_allies_mines} vs. ${totals.total_axis_mines}`,
                true
            )
            .addField(
                "Income",
                `${alliesIncome.toFixed(1)}B vs. ${axisIncome.toFixed(1)}B`,
                true
            )

            .setColor("DARK_BLUE");

        await interaction.reply({ embeds: [embed] });
    }
}
