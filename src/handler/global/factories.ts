import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { buildIncome } from "../../service/mapCommands";
import { FacilityIncome } from "../../service/util/constants";

export class Factories {
    @CommandData({ type: "global" })
    factoriesData() {
        return new SlashCommandBuilder()
            .setName("factories")
            .setDescription("Shows shows a breakdown of factory income by team")
            .toJSON();
    }

    @Command({ name: "factories" })
    @Guard({ body: commandChannelGuard })
    async factories(interaction: CommandInteraction): Promise<void> {
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
