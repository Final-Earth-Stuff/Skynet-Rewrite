import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData } from "../../decorators";
import { BotError } from "../../error";

import { getCountries } from "../../map";
import { greatCircleDist } from "../../map/geometry";
import { travelTime } from "../../map/util";

export class Dis {
    @CommandData({
        type: "global",
        completions: { origin: "country", destination: "country" },
    })
    distData() {
        return new SlashCommandBuilder()
            .setName("dis")
            .setDescription(
                "Determines the distance and travel time between two countries"
            )
            .addIntegerOption((option) =>
                option
                    .setName("origin")
                    .setDescription("Starting country")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addIntegerOption((option) =>
                option
                    .setName("destination")
                    .setDescription("Destination")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addIntegerOption((option) =>
                option
                    .setName("points")
                    .setDescription(
                        "Number of points spent on the travel time reduction skill"
                    )
                    .setRequired(false)
            )
            .addBooleanOption((option) =>
                option
                    .setName("paratroopers")
                    .setDescription(
                        "Whether or not the team has researched the Paratrooper Training technology"
                    )
                    .setRequired(false)
            )
            .toJSON();
    }

    @Command({ name: "dis" })
    async dist(interaction: CommandInteraction): Promise<void> {
        const travelPoints = interaction.options.getInteger("points") ?? 0;
        if (travelPoints < 0 || travelPoints > 25) {
            throw new BotError("Travel points need to be between 0 and 25");
        }

        const origin = interaction.options.getInteger("origin", true);
        const destination = interaction.options.getInteger("destination", true);

        const paratrooper = interaction.options.getBoolean("paratroopers");

        const countries = await getCountries();

        const oC = countries.get(origin);
        const dC = countries.get(destination);

        if (!oC || !dC) {
            throw new Error("Unknown country id");
        }

        const distKm = greatCircleDist(oC.coordinates, dC.coordinates);
        const time = travelTime(distKm, travelPoints, paratrooper);

        const embed = new MessageEmbed()
            .setTitle(`${oC.name} ➔ ${dC.name}`)
            .setDescription(
                `From **${oC.name}** to **${
                    dC.name
                }** with ${travelPoints}% travel bonus${
                    paratrooper
                        ? " the **Paratrooper Training** training tech."
                        : ""
                }`
            )
            .setColor("DARK_BLUE")
            .addField("Distance", `${Math.floor(distKm)}km`, true)
            .addField("Travel time", `${time} minutes`, true);

        interaction.reply({ embeds: [embed] });
    }
}
