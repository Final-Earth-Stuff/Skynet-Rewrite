import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { buildIncome } from "../../service/mapCommands";
import { FacilityIncome } from "../../service/util/constants";

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
