import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { buildIncome } from "../../service/mapCommands";
import { FacilityIncome } from "../../service/util/constants";

@CommandHandler({ name: "rigs" })
export class Rigs {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("rigs")
        .setDescription("Shows shows a breakdown of oil rig income by team")
        .toJSON();

    @Command()
    async rigs(interaction: ChatInputCommandInteraction) {
        const rigs = await LandAndFacilitiesRepository.getRigs();

        await interaction.reply({
            embeds: [
                buildIncome(
                    rigs[0],
                    "Oil rig income",
                    "Oil rig",
                    FacilityIncome.RIG
                ),
            ],
        });
    }
}
