import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";

import { CommandHandler, Command, CommandData } from "../../decorators";
import { BotError } from "../../error";
import { Color } from "../../service/util/constants";

@CommandHandler({ name: "spawns" })
export class Spawns {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("spawns")
        .setDescription("Check increase in all spawn's factory counts.")
        .addIntegerOption((option) =>
            option
                .setName("hours")
                .setDescription("How many hours change to check")
                .setRequired(true)
        )
        .toJSON();

    @Command()
    async spawns(interaction: CommandInteraction): Promise<void> {
        const hours = interaction.options.getInteger("hours") ?? 0;
        if (hours <= 0) {
            throw new BotError(
                "Number of hours needs to be greater than zero!"
            );
        }
        const hoursInMs = 60000 * 60 * hours;
        const facs = await LandAndFacilitiesRepository.getSpawnFactories(
            new Date(Date.now() - hoursInMs)
        );

        const allies = facs.filter((c) => c.control === 100);
        const axis = facs.filter((c) => c.control === 0);

        const alliesMessage = allies
            .map((spawn) => `${spawn.name}: ${spawn.diff}`)
            .concat([
                "**Total**: " +
                    allies.reduce((sum, spawn) => sum + spawn.diff, 0),
            ])
            .join("\n");
        const axisMessage = axis
            .map((spawn) => `${spawn.name}: ${spawn.diff}`)
            .concat([
                "**Total**: " +
                    axis.reduce((sum, spawn) => sum + spawn.diff, 0),
            ])
            .join("\n");

        const embed = new MessageEmbed()
            .setTitle(`Spawn Factory Report`)
            .setDescription(`Changes over last ${hours} hours:`)
            .addField("Allies 🟢", alliesMessage, true)
            .addField("Axis 🔴", axisMessage, true)
            .setColor(Color.BLUE);
        interaction.reply({ embeds: [embed] });
    }
}
