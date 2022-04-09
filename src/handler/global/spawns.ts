import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";

import { Command, CommandData } from "../../decorators";
import { BotError } from "../../error";

import { getCountries } from "../../map";

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
        console.log(await LandAndFacilitiesRepository.getLastWorld());
        const countryMap = await getCountries();
        //const repository = getCustomRepository(LandAndFacilitiesRepository);
        const temp: Factories[] = [
            { id: 74, diff: 12, control: 100 },
            { id: 25, diff: -9, control: 0 },
        ];
        const allies = temp.reduce<Factories[]>((acc, e) => {
            if (e.control === 100) {
                e.name = countryMap.get(e.id)?.name;
                acc?.push(e);
            }
            return acc;
        }, []);
        const axis = temp.reduce<Factories[]>((acc, e) => {
            if (e.control === 0) {
                e.name = countryMap.get(e.id)?.name;
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

interface Factories {
    id: number;
    diff: number;
    control: number;
    name?: string;
}
