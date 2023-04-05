import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import {
    CommandHandler,
    Command,
    CommandData,
} from "../../decorators/index.js";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository.js";
import { buildIncome } from "../../service/mapCommands.js";
import { FacilityIncome } from "../../service/util/constants.js";

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
