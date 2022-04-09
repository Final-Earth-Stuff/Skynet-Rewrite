import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { BotError } from "../../error";
import { getCountries } from "../../map";
import { greatCircleDist } from "../../map/geometry";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

function rangeLimit(tech: string): number {
    switch (tech) {
        case "SRBM":
            return 3000;
        case "IRBM":
            return 6000;
        case "ICBM":
            return 12000;
        default:
            throw new BotError(`Uknown missile technology '${tech}'`);
    }
}

function travelSpeed(tech: string): number {
    switch (tech) {
        case "SRBM":
            return 2500;
        case "IRBM":
            return 5000;
        case "ICBM":
            return 10000;
        default:
            throw new BotError(`Uknown missile technology '${tech}'`);
    }
}

export class Nuke {
    @CommandData({
        type: "global",
        completions: { origin: "country", destination: "country" },
    })
    nukeData() {
        return new SlashCommandBuilder()
            .setName("nuke")
            .setDescription("Shows nuke travel time")
            .addIntegerOption((option) =>
                option
                    .setName("origin")
                    .setDescription("The country in which the nuke is launched")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addIntegerOption((option) =>
                option
                    .setName("destination")
                    .setDescription("The country the nuke is launched at")
                    .setRequired(true)
                    .setAutocomplete(true)
            )
            .addStringOption((option) =>
                option
                    .setName("tech")
                    .setDescription(
                        "The technology used for launching the nuke"
                    )
                    .setRequired(false)
                    .addChoices([
                        ["Nuke I: SRBMs", "SRBM"],
                        ["Nuke II: IRBMs", "IRBM"],
                        ["Nuke III: ICBMs", "ICBM"],
                    ])
            )
            .toJSON();
    }

    @Command({ name: "nuke" })
    @Guard({ body: commandChannelGuard })
    async nuke(interaction: CommandInteraction): Promise<void> {
        const origin = interaction.options.getInteger("origin", true);
        const destination = interaction.options.getInteger("destination", true);

        const tech = interaction.options.getString("tech") ?? "SRBM";

        const countries = await getCountries();

        const oC = countries.get(origin);
        const dC = countries.get(destination);

        if (!oC || !dC) {
            throw new Error("Unknown country id");
        }

        const distKm = greatCircleDist(oC.coordinates, dC.coordinates);

        if (distKm > rangeLimit(tech)) {
            const embed = new MessageEmbed()
                .setTitle(`${oC.name} ➔ ${dC.name}`)
                .setDescription(
                    `Destination is not within range of the launch site (${tech})!`
                )
                .addField("Distance", `${distKm}km`)
                .setColor("DARK_ORANGE");

            await interaction.reply({ embeds: [embed] });
            return;
        }

        const time = Math.round((distKm / travelSpeed(tech)) * 60 * 10) / 10;

        const embed = new MessageEmbed()
            .setTitle(`${oC.name} ➔ ${dC.name}`)
            .setDescription(
                `From **${oC.name}** to **${dC.name}** with the ${tech} technology`
            )
            .setColor("DARK_BLUE")
            .addField("Distance", `${distKm}km`, true)
            .addField("Travel time", `${time.toFixed(1)} minutes`, true);

        interaction.reply({ embeds: [embed] });
    }
}
