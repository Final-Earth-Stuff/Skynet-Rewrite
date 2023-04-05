import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";

import {
    CommandHandler,
    Command,
    CommandData,
} from "../../decorators/index.js";
import { BotError } from "../../error.js";
import { Data } from "../../map/index.js";
import { greatCircleDist } from "../../map/geometry.js";
import { Color } from "../../service/util/constants.js";

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

@CommandHandler({ name: "nuke" })
export class Nuke {
    @CommandData({
        type: "global",
        completion: {
            origin: "country",
            destination: "country",
        },
    })
    readonly data = new SlashCommandBuilder()
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
                .setDescription("The technology used for launching the nuke")
                .setRequired(false)
                .addChoices(
                    { name: "Nuke I: SRBMs", value: "SRBM" },
                    { name: "Nuke II: IRBMs", value: "IRBM" },
                    { name: "Nuke III: ICBMs", value: "ICBM" }
                )
        )
        .toJSON();

    @Command()
    async nuke(interaction: ChatInputCommandInteraction): Promise<void> {
        const origin = interaction.options.getInteger("origin", true);
        const destination = interaction.options.getInteger("destination", true);

        const tech = interaction.options.getString("tech") ?? "SRBM";

        const oC = Data.shared.country(origin);
        const dC = Data.shared.country(destination);

        if (!oC || !dC) {
            throw new Error("Unknown country id");
        }

        const distKm = greatCircleDist(oC.coordinates, dC.coordinates);

        if (distKm > rangeLimit(tech)) {
            const embed = new EmbedBuilder()
                .setTitle(`${oC.name} ➔ ${dC.name}`)
                .setDescription(
                    `Destination is not within range of the launch site (${tech})!`
                )
                .addFields({ name: "Distance", value: `${distKm}km` })
                .setColor(Color.NUKE);

            await interaction.reply({ embeds: [embed] });
            return;
        }

        const time = Math.round((distKm / travelSpeed(tech)) * 60 * 10) / 10;

        const embed = new EmbedBuilder()
            .setTitle(`${oC.name} ➔ ${dC.name}`)
            .setDescription(
                `From **${oC.name}** to **${dC.name}** with the ${tech} technology`
            )
            .setColor(Color.BLUE)
            .addFields(
                { name: "Distance", value: `${distKm}km`, inline: true },
                {
                    name: "Travel time",
                    value: `${time.toFixed(1)} minutes`,
                    inline: true,
                }
            );

        await interaction.reply({ embeds: [embed] });
    }
}
