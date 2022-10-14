import {
    ChatInputCommandInteraction,
    SlashCommandBuilder,
    EmbedBuilder,
} from "discord.js";

import { CommandHandler, Command, CommandData } from "../../decorators";

import { UnitChangeRepository } from "../../repository/UnitChangeRepository";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { Region as RegionEnum } from "../../entity/Country";
import { Team } from "../../service/util/constants";
import { buildTotals, buildRegionUnitList } from "../../service/mapCommands";
import { Color } from "../../service/util/constants";
import { BotError } from "../../error";

@CommandHandler({ name: "region" })
export class Region {
    @CommandData({ type: "global" })
    readonly data = new SlashCommandBuilder()
        .setName("region")
        .setDescription(
            "Shows units, facilities and income by team for the provided region"
        )
        .addStringOption((option) =>
            option
                .setName("region")
                .setDescription("Region which should be summarized")
                .setRequired(true)
                .addChoices(
                    { name: "Europe", value: RegionEnum.EUROPE },
                    { name: "Middle East", value: RegionEnum.MIDDLE_EAST },
                    { name: "Asia", value: RegionEnum.ASIA },
                    { name: "North America", value: RegionEnum.NORTH_AMERICA },
                    { name: "South America", value: RegionEnum.SOUTH_AMERICA },
                    { name: "Australasia", value: RegionEnum.AUSTRALASIA },
                    { name: "Caribbean", value: RegionEnum.CARIBBEAN },
                    { name: "Africa", value: RegionEnum.AFRICA }
                )
        )
        .addStringOption((option) =>
            option
                .setName("team")
                .setDescription("Only show one team")
                .setRequired(false)
                .addChoices(
                    { name: "axis", value: "Axis" },
                    { name: "allies", value: "Allies" }
                )
        )
        .toJSON();

    @Command()
    async region(interaction: ChatInputCommandInteraction): Promise<void> {
        const reg = interaction.options.getString("region", true) as RegionEnum;
        const team = interaction.options.getString("team") as Team | undefined;

        const totals = await LandAndFacilitiesRepository.totals(reg);

        const embed = buildTotals(
            totals,
            reg.replace(/\w*/g, (w) =>
                w.replace(/^\w/, (c) => c.toUpperCase())
            ),
            "Displaying Allies vs. Axis for the region:"
        );
        const units = await UnitChangeRepository.getRegion(reg, team);
        const unitString = buildRegionUnitList(units);

        const embeds = new Array<EmbedBuilder>();
        if (unitString.length > 4048) {
            throw new BotError("Response too long.");
        } else if (unitString.length > 1024) {
            const unitEmbed = new EmbedBuilder()
                .setTitle("Units")
                .setDescription(unitString)
                .setColor(Color.BLUE);
            embeds.push(embed, unitEmbed);
        } else if (unitString.length > 0) {
            embed.addFields({ name: "Units", value: unitString });
            embeds.push(embed);
        }

        await interaction.reply({ embeds });
    }
}
