import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { CommandHandler, Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";
import { BotError } from "../../error";
import { Data } from "../../map";
import { findInRange } from "../../map/kdtree";
import { travelTime, convertToKm } from "../../map/util";
import { Team } from "../../service/util/constants";
import { UnitChangeRepository } from "../../repository/UnitChangeRepository";
import { unwrap } from "../../util/assert";
import { Color } from "../../service/util/constants";
import {
    getIcon,
    teamFromControl,
    convertAxisControl,
} from "../../service/util/team";

@CommandHandler({ name: "prox" })
@Guard(commandChannelGuard)
export class Prox {
    @CommandData({ type: "global", completion: { center: "country" } })
    readonly data = new SlashCommandBuilder()
        .setName("prox")
        .setDescription(
            "Shows all units within the provided distance of a country"
        )
        .addIntegerOption((option) =>
            option
                .setName("center")
                .setDescription("The country on which the search is centered")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addIntegerOption((option) =>
            option
                .setName("radius")
                .setDescription("Radius of the search (minutes)")
                .setRequired(true)
        )
        .addStringOption((option) =>
            option
                .setName("team")
                .setDescription("Only show results for one team")
                .setRequired(false)
                .setChoices(
                    { name: "Allies", value: Team.ALLIES },
                    { name: "Axis", value: Team.AXIS }
                )
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
    async prox(interaction: CommandInteraction): Promise<void> {
        const center = interaction.options.getInteger("center", true);
        const radius = interaction.options.getInteger("radius", true);
        const travelPoints = interaction.options.getInteger("points") ?? 0;
        const team = interaction.options.getString("team") as Team;
        const paratroopers =
            interaction.options.getBoolean("paratroopers") ?? false;
        if (travelPoints < 0 || travelPoints > 25) {
            throw new BotError("Travel points need to be between 0 and 25.", {
                ephemeral: true,
            });
        }

        const radiusKm = convertToKm(radius, travelPoints, paratroopers);
        const centerCountry = Data.shared.country(center);
        if (!centerCountry) {
            throw new Error("Unknown country ID");
        }

        const countries = findInRange(
            Data.shared.kdtree,
            centerCountry.coordinates,
            radiusKm
        );

        const countryMap = new Map(
            countries.map(({ id, distKm }) => [id, distKm])
        );

        const rows = await UnitChangeRepository.getUnitsForCountries(
            countries.map(({ id }) => id),
            centerCountry.id,
            team
        );
        const result = rows[0];
        const results = result.countries.map((r) => {
            const dist = unwrap(countryMap.get(r.id));
            return {
                ...r,
                dist: Math.round(dist),
                travelTime: travelTime(dist, travelPoints, paratroopers),
            };
        });
        const list = results
            .sort((a, b) => a.dist - b.dist)
            .map(
                (r) =>
                    `${getIcon(teamFromControl(r.control))} ${
                        r.name
                    } (${convertAxisControl(
                        r.control,
                        teamFromControl(r.control)
                    )}%) — ${r.allies} vs. ${r.axis} [${r.travelTime} min]`
            )
            .join("\n");

        let suffix: string;
        switch (team) {
            case Team.ALLIES:
                suffix = " for allied units";
                break;
            case Team.AXIS:
                suffix = " for axis units";
                break;

            default:
                suffix = "";
        }

        const embed = new MessageEmbed()
            .setTitle(`Scanning proximity of ${centerCountry.name}${suffix}`)
            .setDescription(
                `Allies vs. Axis within ${radius} minutes [${Math.round(
                    radiusKm
                )}km] of ${getIcon(teamFromControl(result.center_control))} ${
                    centerCountry.name
                } (${convertAxisControl(
                    result.center_control,
                    teamFromControl(result.center_control)
                )}%) with ${travelPoints}% travel bonus`
            )
            .addField("Units", `${result.allies} vs. ${result.axis}`)
            .setColor(Color.BLUE);

        const embeds = [embed];

        if (list.length > 4048) {
            throw new BotError("The selected range was too large");
        } else if (list.length > 1024) {
            embeds.push(
                new MessageEmbed()
                    .setTitle("Countries")
                    .setDescription(list)
                    .setColor(Color.BLUE)
            );
        } else if (list.length > 0) {
            embed.addField("Countries", list);
        }

        await interaction.reply({ embeds });
    }
}
