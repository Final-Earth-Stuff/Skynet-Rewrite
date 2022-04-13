import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { buildIncome } from "../../service/mapCommands";

export class Rigs {
    @CommandData({ type: "global" })
    rigsData() {
        return new SlashCommandBuilder()
            .setName("rigs")
            .setDescription("Shows shows a breakdown of oil rig income by team")
            .toJSON();
    }

    @Command({ name: "rigs" })
    @Guard({ body: commandChannelGuard })
    async rigs(interaction: CommandInteraction) {
        const rigs = await LandAndFacilitiesRepository.getRigs();

        await interaction.reply({
            embeds: [
                buildIncome(rigs[0], "Oil rig income", "Oil rig", 100_000_000),
            ],
        });
    }
}
