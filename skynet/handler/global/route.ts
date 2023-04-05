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
import { travelTime, getDistance } from "../../map/util.js";
import { Color } from "../../service/util/constants.js";
import { defaultTravelPoints } from "../../service/mapCommands.js";

@CommandHandler({ name: "route" })
export class Route {
    @CommandData({
        type: "global",
        completion: { start: "country", destination: "country" },
    })
    readonly data = new SlashCommandBuilder()
        .setName("route")
        .setDescription("Computes a route between two countries")
        .addIntegerOption((option) =>
            option
                .setName("start")
                .setDescription("The country in which the route will start")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("destination")
                .setDescription("The route's destination")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addNumberOption((option) =>
            option
                .setName("elasticity")
                .setDescription(
                    "Higher means shorter jumps but longer overall travel time"
                )
                .setMinValue(1.05)
                .setMaxValue(1.8)
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

    @Command()
    async route(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();
        const start = interaction.options.getInteger("start", true);
        const dest = interaction.options.getInteger("destination", true);
        const elasticity = interaction.options.getNumber("elasticity") ?? 1.2;
        const points =
            interaction.options.getInteger("points") ??
            (await defaultTravelPoints(interaction.user));
        const paratroopers =
            interaction.options.getBoolean("paratroopers") ?? false;

        const startCountry = Data.shared.country(start);
        const destCountry = Data.shared.country(dest);

        if (!startCountry) {
            throw new BotError(`Unknown country: ${start}`);
        }
        if (!destCountry) {
            throw new BotError(`Unknown country: ${dest}`);
        }

        const computedRoute = await Data.shared.routeQuery(
            start,
            dest,
            elasticity
        );

        const directTime = getDistance(start, dest, points, paratroopers);
        const indirectDist = computedRoute.reduce(
            (acc, cur) => acc + cur.distKm,
            0
        );
        const indirectTime = travelTime(indirectDist, points, paratroopers);

        const routeDesc = computedRoute
            .map((r, i) => {
                const sC = Data.shared.country(r.startId);
                const eC = Data.shared.country(r.endId);
                const time = travelTime(r.distKm, points, paratroopers);

                return `${i + 1}. ${sC?.name ?? ""} ⇾ ${
                    eC?.name ?? ""
                } (${time} mins)`;
            })
            .join("\n");

        const embed = new EmbedBuilder()
            .setTitle(`Route: ${startCountry.name} ➔ ${destCountry.name}`)
            .setDescription(
                `From **${startCountry.name}** to **${destCountry.name}**${
                    points !== 0 ? ` with ${points}% travel bonus` : ""
                }`
            )
            .setColor(Color.BLUE)
            .addFields(
                {
                    name: `Direct (${directTime} mins)`,
                    value: `1. ${startCountry.name} ⇾ ${destCountry.name} (${directTime} mins)`,
                    inline: true,
                },
                {
                    name: `Indirect (${indirectTime} mins)`,
                    value: routeDesc,
                    inline: true,
                }
            );

        await interaction.editReply({ embeds: [embed] });
    }
}
