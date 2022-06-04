import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { CommandHandler, Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { buildIncome } from "../../service/mapCommands";
import { FacilityIncome } from "../../service/util/constants";

@CommandHandler({ name: "rigs" })
@Guard(commandChannelGuard)
export class Rigs {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("rigs")
        .setDescription("Shows shows a breakdown of oil rig income by team")
        .toJSON();

    @Command()
    async rigs(interaction: CommandInteraction) {
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
