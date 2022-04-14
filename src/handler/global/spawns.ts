import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";

import { Command, CommandData, Guard } from "../../decorators";
import { BotError } from "../../error";
import { commandChannelGuard } from "../../guard/commandChannelGuard";
import { Color } from "../../service/util/constants";

export class Spawns {
    @CommandData({ type: "global" })
    SpawnsData() {
        return new SlashCommandBuilder()
            .setName("spawns")
            .setDescription("Check increase in all spawn's factory counts.")
            .addIntegerOption((option) =>
                option
                    .setName("hours")
                    .setDescription("How many hours change to check")
                    .setRequired(true)
            )
            .toJSON();
    }

    @Command({ name: "spawns" })
    @Guard({ body: commandChannelGuard })
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

        const heading1 = `Changes over last ${hours} hours:\n🟢 ALLIES`;
        const heading2 = `🔴 AXIS`;

        const alliesMessage = allies
            .map((spawn) => `**${spawn.name}**: ${spawn.diff}`)
            .join("\n");
        const axisMessage = axis
            .map((spawn) => `**${spawn.name}**: ${spawn.diff}`)
            .join("\n");

        const embed = new MessageEmbed()
            .setTitle(`Spawn Factory Report`)
            .setDescription(
                `${heading1}\n${alliesMessage}\n${heading2}\n${axisMessage}`
            )
            .setColor(Color.BLUE);
        interaction.reply({ embeds: [embed] });
    }
}
