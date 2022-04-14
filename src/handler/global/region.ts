import { SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction, MessageEmbed } from "discord.js";

import { Command, CommandData, Guard } from "../../decorators";
import { commandChannelGuard } from "../../guard/commandChannelGuard";

import { UnitChangeRepository } from "../../repository/UnitChangeRepository";
import { LandAndFacilitiesRepository } from "../../repository/LandAndFacilitiesRepository";
import { Region as RegionEnum } from "../../entity/Country";
import { Team } from "../../service/util/constants";
import { buildTotals, buildRegionUnitList } from "../../service/mapCommands";
import { Color } from "../../service/util/constants";

export class Region {
    @CommandData({ type: "global" })
    regionData() {
        return new SlashCommandBuilder()
            .setName("region")
            .setDescription(
                "Shows units, facilities and income by team for the provided region"
            )
            .addStringOption((option) =>
                option
                    .setName("region")
                    .setDescription("Region which should be summarized")
                    .setRequired(true)
                    .addChoices([
                        ["Europe", RegionEnum.EUROPE],
                        ["Middle East", RegionEnum.MIDDLE_EAST],
                        ["Asia", RegionEnum.ASIA],
                        ["North America", RegionEnum.NORTH_AMERICA],
                        ["South America", RegionEnum.SOUTH_AMERICA],
                        ["Australasia", RegionEnum.AUSTRALASIA],
                        ["Caribbean", RegionEnum.CARIBBEAN],
                        ["Africa", RegionEnum.AFRICA],
                    ])
            )
            .addStringOption((option) =>
                option
                    .setName("team")
                    .setDescription("Only show one team")
                    .setRequired(false)
                    .addChoices([
                        ["axis", "Axis"],
                        ["allies", "Allies"],
                    ])
            )
            .toJSON();
    }

    @Command({ name: "region" })
    @Guard({ body: commandChannelGuard })
    async region(interaction: CommandInteraction): Promise<void> {
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

        const embeds = new Array<MessageEmbed>();
        if (unitString.length > 1024) {
            const unitEmbed = new MessageEmbed()
                .setTitle("Units")
                .setDescription(unitString)
                .setColor(Color.BLUE);
            embeds.push(embed, unitEmbed);
        } else {
            embed.addField("Units", unitString);
            embeds.push(embed);
        }

        await interaction.reply({ embeds });
    }
}
