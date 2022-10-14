import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { buildIncome } from "../../service/mapCommands";
import { FacilityIncome } from "../../service/util/constants";

@CommandHandler({ name: "mines" })
export class Mines {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("mines")
        .setDescription("Shows shows a breakdown of mine income by team")
        .toJSON();

    @Command()
    async mines(interaction: ChatInputCommandInteraction): Promise<void> {
        const mines = await LandAndFacilitiesRepository.getMines();

        await interaction.reply({
            embeds: [
                buildIncome(
                    mines[0],
                    "Mine income",
                    "Mine",
                    FacilityIncome.MINE
                ),
            ],
        });
    }
}
