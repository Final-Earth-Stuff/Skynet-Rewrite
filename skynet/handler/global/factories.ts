import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import {
    CommandHandler,
    Command,
    CommandData,
} from "../../decorators/index.js";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository.js";
import { buildIncome } from "../../service/mapCommands.js";
import { FacilityIncome } from "../../service/util/constants.js";

@CommandHandler({ name: "factories" })
export class Factories {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("factories")
        .setDescription("Shows shows a breakdown of factory income by team")
        .toJSON();

    @Command()
    async factories(interaction: ChatInputCommandInteraction): Promise<void> {
        const factories = await LandAndFacilitiesRepository.getFactories();

        await interaction.reply({
            embeds: [
                buildIncome(
                    factories[0],
                    "Factory income",
                    "Factory",
                    FacilityIncome.FACTORY
                ),
            ],
        });
    }
}
