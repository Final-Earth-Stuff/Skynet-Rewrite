import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";

import { Command, CommandData } from "../../decorators";
import { BotError } from "../../error";

import { getCountries } from "../../map";

import { FacQueryRow } from "../../repository/LandAndFacilitiesRepository";

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
    async spawns(interaction: CommandInteraction): Promise<void> {
        const hours = interaction.options.getInteger("hours") ?? 0;
        if (hours <= 0) {
            throw new BotError(
                "Number of hours needs to be greater than zero!"
            );
        }
        const hoursInMs = 60000 * 60 * hours;
        const countryMap = await getCountries();
        const facs = await LandAndFacilitiesRepository.getSpawnFactories(
            new Date(Date.now() - hoursInMs)
        );

        const allies = facs.reduce<FacQueryRow[]>((acc, e) => {
            if (e.team_control === 100) {
                e.name = countryMap.get(e.country)?.name;
                acc?.push(e);
            }
            return acc;
        }, []);
        const axis = facs.reduce<FacQueryRow[]>((acc, e) => {
            if (e.team_control === 0) {
                e.name = countryMap.get(e.country)?.name;
                acc?.push(e);
            }
            return acc;
        }, []);

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
            .setColor("DARK_BLUE");
        interaction.reply({ embeds: [embed] });
    }
}
