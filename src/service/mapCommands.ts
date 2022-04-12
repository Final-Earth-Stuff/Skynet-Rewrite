import { MessageEmbed } from "discord.js";

import { TotalsQueryRow } from "../repository/LandAndFacilitiesRepository";
import { RegionQueryRow } from "../repository/UnitChangeRepository";

import { getIcon, teamFromControl, convertAxisControl } from "./util/team";

export function buildTotals(
    totals: TotalsQueryRow,
    title: string,
    desc: string
): MessageEmbed {
    const alliesIncome =
        Math.round(
            (totals.total_allies_rigs * 0.1 +
                totals.total_allies_facs * 0.0015 +
                totals.total_allies_mines * 0.0005) *
                10
        ) / 10;

    const axisIncome =
        Math.round(
            (totals.total_axis_rigs * 0.1 +
                totals.total_axis_facs * 0.0015 +
                totals.total_axis_mines * 0.0005) *
                10
        ) / 10;

    return new MessageEmbed()
        .setTitle(title)
        .setDescription(desc)
        .addField(
            "Capped/Uncapped",
            `${totals.allies_capped}/${totals.allies_uncapped} vs. ${totals.axis_capped}/${totals.axis_uncapped}`,
            true
        )
        .addField(
            "Units",
            `${totals.total_allies} vs. ${totals.total_axis}`,
            true
        )
        .addField(
            "Factories",
            `${totals.total_allies_facs} vs. ${totals.total_axis_facs}`,
            true
        )
        .addField(
            "Oil rigs",
            `${totals.total_allies_rigs} vs. ${totals.total_axis_rigs}`,
            true
        )
        .addField(
            "Mines",
            `${totals.total_allies_mines} vs. ${totals.total_axis_mines}`,
            true
        )
        .addField(
            "Income",
            `${alliesIncome.toFixed(1)}B vs. ${axisIncome.toFixed(1)}B`,
            true
        )
        .setColor("DARK_BLUE");
}

export function buildRegionUnitList(units: RegionQueryRow[]): string {
    return units
        .map(
            (row) =>
                `${getIcon(teamFromControl(row.control))} ${
                    row.name
                } (${convertAxisControl(
                    row.control,
                    teamFromControl(row.control)
                )}%) — ${row.allies} vs. ${row.axis}`
        )
        .join("\n");
}
