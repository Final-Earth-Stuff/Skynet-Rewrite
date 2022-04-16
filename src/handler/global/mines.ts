import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { buildIncome } from "../../service/mapCommands";
import { FacilityIncome } from "../../service/util/constants";

export class Mines {
    @CommandData({ type: "global" })
    minesData() {
        return new SlashCommandBuilder()
            .setName("mines")
            .setDescription("Shows shows a breakdown of mine income by team")
            .toJSON();
    }

    @Command({ name: "mines" })
    @Guard({ body: commandChannelGuard })
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
