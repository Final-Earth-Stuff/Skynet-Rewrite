import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { CommandHandler, Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { buildIncome } from "../../service/mapCommands";
import { FacilityIncome } from "../../service/util/constants";

@CommandHandler({ name: "mines" })
@Guard(commandChannelGuard)
export class Mines {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("mines")
        .setDescription("Shows shows a breakdown of mine income by team")
        .toJSON();

    @Command()
    async mines(interaction: CommandInteraction): Promise<void> {
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
